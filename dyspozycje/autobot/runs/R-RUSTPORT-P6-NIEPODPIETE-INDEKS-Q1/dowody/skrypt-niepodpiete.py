#!/usr/bin/env python3
"""Lista modulow domain/*.rs i funkcji `pub fn` bez wolajacego produkcyjnego.

Uzycie (z korzenia repo):  python3 <ten-plik> <korzen-repo> <wyjscie-tsv>

Metoda (konserwatywna wzgledem wolan, tzn. przy watpliwosci liczy wolanie):
- korpus: wszystkie *.rs pod rust-port/ z pominieciem katalogow tests/, benches/, target/;
- z korpusu usuwane sa komentarze (// i /* */) oraz bloki #[cfg(test)] (klamra lub srednik);
- linie definicji `fn NAZWA` oraz linie `use`/`pub use` nie licza sie jako wolanie;
- funkcja jest bez wolajacego, gdy identyfikator NAZWA nie wystepuje w zadnej innej linii korpusu
  (takze w swoim pliku, poza definicja);
- modul (plik domain/*.rs lub domain/*/mod.rs, plik podrzedny) jest bez wolajacego, gdy jego
  nazwa (stem) nie wystepuje w zadnej linii korpusu poza wlasnym plikiem i poza deklaracja `mod stem`.
Ograniczenia: wolania po samej nazwie metody (np. `.new(`) sa liczone jako wolanie innego typu
(bledy w strone 'ma wolajacego'); nazwy kolidujace z innymi modulami daja to samo.
"""
import os
import re
import sys

ROOT = os.path.abspath(sys.argv[1])
OUT = sys.argv[2]
DOM_REL = os.path.join("rust-port", "engine", "src", "domain")
SKIP_DIRS = {"tests", "benches", "target", ".git"}

IDENT = re.compile(r"\b[A-Za-z_][A-Za-z0-9_]*\b")
PUB_FN = re.compile(r"^\s*pub\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)")
DEF_LINE = re.compile(r"\bfn\s+[A-Za-z_][A-Za-z0-9_]*")
USE_LINE = re.compile(r"^\s*(pub\s+)?use\s")
CFG_TEST = "#[cfg(test)]"
MOD_DECL = re.compile(r"^\s*(pub(\([a-z]+\))?\s+)?mod\s+[A-Za-z_]")


def strip_comments(text):
    out = []
    i, n = 0, len(text)
    in_str = False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == '"':
                in_str = False
            elif c == "\n":
                pass
            i += 1
            continue
        if c == "'":
            # literaly znakowe: 'x', '"', '\n', '\'' (czas zycia 'a nie jest literalem)
            if i + 2 < n and text[i + 1] != "\\" and text[i + 2] == "'":
                out.append(text[i:i + 3])
                i += 3
                continue
            if i + 1 < n and text[i + 1] == "\\":
                j = text.find("'", i + 3)
                if j >= 0 and j - i <= 10:
                    out.append(text[i:j + 1])
                    i = j + 1
                    continue
        if c == '"':
            in_str = True
            out.append(c)
            i += 1
            continue
        if text.startswith("//", i):
            j = text.find("\n", i)
            j = n if j < 0 else j
            i = j
            continue
        if text.startswith("/*", i):
            j = text.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("\n" * text.count("\n", i, j))
            i = j
            continue
        out.append(c)
        i += 1
    return "".join(out)


def blank_cfg_test(text):
    """Zastepuje bloki #[cfg(test)] pustymi znakami (zachowuje numery linii)."""
    res = list(text)
    pos = 0
    while True:
        k = text.find(CFG_TEST, pos)
        if k < 0:
            break
        j = k + len(CFG_TEST)
        m_brace = text.find("{", j)
        m_semi = text.find(";", j)
        if m_brace < 0 and m_semi < 0:
            end = len(text)
        elif m_semi >= 0 and (m_brace < 0 or m_semi < m_brace):
            end = m_semi + 1
        else:
            depth = 0
            end = len(text)
            p = m_brace
            while p < len(text):
                ch = text[p]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        end = p + 1
                        break
                p += 1
        for q in range(k, end):
            if res[q] != "\n":
                res[q] = " "
        pos = end
    return "".join(res)


def rs_files(base):
    for dp, dns, fns in os.walk(base):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for f in fns:
            if f.endswith(".rs"):
                yield os.path.join(dp, f)


def main():
    corpus = {}
    for path in rs_files(os.path.join(ROOT, "rust-port")):
        rel = os.path.relpath(path, ROOT)
        with open(path, encoding="utf-8", errors="replace") as fh:
            raw = fh.read()
        corpus[rel] = blank_cfg_test(strip_comments(raw))

    # licznik identyfikatorow w liniach-wolaniach (poza definicjami fn i importami)
    call_count = {}
    call_lines_by_file = {}
    for rel, text in corpus.items():
        for lineno, line in enumerate(text.split("\n"), 1):
            if USE_LINE.match(line) or "pub use" in line:
                continue
            is_def = bool(DEF_LINE.search(line))
            idents = IDENT.findall(line)
            if is_def:
                # w linii definicji liczymy tylko identyfikatory po nawiasie '(' w sygnaturze
                # (nazwa wlasnej definicji jest pomijana, reszta jest traktowana jako wolanie)
                names = [m.group(1) for m in re.finditer(r"\bfn\s+([A-Za-z_][A-Za-z0-9_]*)", line)]
                own = set(names)
                idents = [x for x in idents if x not in own and x != "fn"]
            for ident in idents:
                call_count[ident] = call_count.get(ident, 0) + 1
                call_lines_by_file.setdefault(ident, set()).add(rel)

    rows = []
    fn_total = 0
    dom_files = []
    for rel in sorted(corpus):
        if not rel.startswith(DOM_REL + os.sep):
            continue
        dom_files.append(rel)
        text = corpus[rel]
        for lineno, line in enumerate(text.split("\n"), 1):
            m = PUB_FN.match(line)
            if not m:
                continue
            fn_total += 1
            name = m.group(1)
            if call_count.get(name, 0) == 0:
                rows.append((rel, lineno, rel[len(DOM_REL) + 1:-3], name))

    # moduly: stem pliku domain/*.rs lub domain/*/mod.rs (tokeny per plik, bez linii `mod stem`)
    file_idents = {}
    for other, text in corpus.items():
        ids = set()
        for line in text.split("\n"):
            if MOD_DECL.search(line):
                continue
            ids.update(IDENT.findall(line))
        file_idents[other] = ids
    mod_rows = []
    for rel in dom_files:
        base = os.path.basename(rel)
        if base == "mod.rs":
            stem = os.path.basename(os.path.dirname(rel))
        else:
            stem = base[:-3]
        users = [o for o, ids in file_idents.items() if o != rel and stem in ids]
        if not users:
            mod_rows.append((rel, stem))

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("TYP\tPLIK\tLINIA\tMODUL\tNAZWA\n")
        for rel, lineno, mod, name in rows:
            fh.write("FN\t%s\t%d\t%s\t%s\n" % (rel, lineno, mod, name))
        for rel, stem in mod_rows:
            fh.write("MOD\t%s\t0\t%s\t\n" % (rel, stem))

    print("pliki domain/*.rs: %d" % len(dom_files))
    print("definicje pub fn w domain (bez #[cfg(test)]): %d" % fn_total)
    print("pub fn bez wolajacego produkcyjnego: %d" % len(rows))
    print("moduly domain bez wolajacego produkcyjnego: %d" % len(mod_rows))
    print("moduly bez wolajacego: " + ", ".join(sorted(s for _, s in mod_rows)))


if __name__ == "__main__":
    main()
