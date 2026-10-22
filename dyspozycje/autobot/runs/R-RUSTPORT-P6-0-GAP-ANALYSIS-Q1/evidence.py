#!/usr/bin/env python3
# Dowody plik:linia po obu stronach (runda 2).
# Uzycie: python3 -I evidence.py <run_dir> <web_root_gra_src> <rust_engine_src>
# Wyjscia (w <run_dir>):
#  - evidence.tsv: dla kazdego eksportu web (max 6 pierwszych z web-inventory.tsv):
#      linia deklaracji eksportu w pliku web oraz deklaracje o tej samej nazwie (lub snake_case / UPPER) w Rust.
#      To jest DOWOD NAZWOWY (zgodnosc nazwy), nie dowod rownowaznosci zachowania.
#  - rust-anchors.tsv: dla kazdego pliku Rust pierwsza linia publicznego elementu (kotwica plik:linia).
import os, re, sys
run, webroot, rustroot = sys.argv[1], sys.argv[2], sys.argv[3]
webgame = os.path.join(webroot, "game")

def snake(n):
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", n).lower()

rust_src = {}
for dp, _, fns in os.walk(rustroot):
    for fn in fns:
        if fn.endswith(".rs"):
            p = os.path.join(dp, fn)
            with open(p, encoding="utf-8", errors="replace") as f:
                rust_src[os.path.relpath(p, rustroot).replace(os.sep, "/")] = f.read().splitlines()

DECL = r"(?:pub(?:\([^)]*\))?\s+)?(?:const\s+)?(?:async\s+)?(?:fn|struct|enum|type|trait|const|static|mod)\s+%s\b"
cache = {}
def rust_hits(name):
    if name in cache:
        return cache[name]
    pats = [re.compile(DECL % re.escape(n)) for n in sorted({name, snake(name), name.upper()})]
    out = []
    for rel in sorted(rust_src):
        for i, line in enumerate(rust_src[rel], 1):
            if any(p.search(line) for p in pats):
                out.append("%s:%d" % (rel, i))
    cache[name] = out
    return out

def web_line(rel, name):
    with open(os.path.join(webgame, rel), encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f, 1):
            if re.search(r"\bexport\b.*\b%s\b" % re.escape(name), line):
                return i
    return 0

with open(os.path.join(run, "web-inventory.tsv"), encoding="utf-8") as f:
    rows = [l.rstrip("\n").split("\t") for l in f if l.strip()][1:]
with open(os.path.join(run, "evidence.tsv"), "w", encoding="utf-8") as out:
    out.write("plik\texport\tweb_linia\trust_dowody_nazwowe\n")
    for r in rows:
        rel = r[0]
        names = [n for n in (r[6].split(",") if len(r) > 6 else []) if n][:6]
        if not names:
            out.write("%s\t-\t0\t-\n" % rel)
            continue
        for n in names:
            hits = rust_hits(n)
            out.write("%s\t%s\t%d\t%s\n" % (rel, n, web_line(rel, n), ";".join(hits[:3]) if hits else "-"))

with open(os.path.join(run, "rust-anchors.tsv"), "w", encoding="utf-8") as out:
    out.write("plik\tpierwsza_linia_pub\tpierwszy_element\n")
    PUB = re.compile(r"^\s*pub(?:\([^)]*\))?\s+(?:async\s+)?(?:const\s+)?(?:fn|struct|enum|trait|type|const|static|mod)\s+(\w+)")
    for rel in sorted(rust_src):
        anchor = "-"
        elem = "-"
        for i, line in enumerate(rust_src[rel], 1):
            m = PUB.match(line)
            if m:
                anchor, elem = str(i), m.group(1)
                break
        out.write("%s\t%s\t%s\n" % (rel, anchor, elem))
print("OK")
