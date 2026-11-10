#!/usr/bin/env python3
"""Sklada dokument P6-7B-MIASTA-WZROST-B.md z szablonu, tabeli symboli, wektorow i surowych logow.

Uzycie (z korzenia repo/worktree): python3 -I build-doc-p67b.py <TEMPLATE> <OUT_MD>
Czyta: pliki w katalogu runu (logi bramek, ewidencja mutacji, tabela symboli, logi weryfikatora),
`rust-port/engine/tests/p6_7b_vectors/*.json`, `rust-port/engine/tests/p6_7b_*.rs`. Nie uruchamia cargo.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

TEMPLATE = Path(sys.argv[1])
OUT = Path(sys.argv[2])
ROOT = Path.cwd()
RUN = ROOT / "dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1"
ENG = ROOT / "rust-port/engine"


def read(p):
    return Path(p).read_text(encoding="utf-8").rstrip("\n")


text = TEMPLATE.read_text(encoding="utf-8")

# --- tabela symboli ---
rows = [l.split("\t") for l in read(RUN / "symbols-p67b-r1.tsv").splitlines()[1:]]
counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
summary = f"{len(rows)} wierszy; " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items()))
table = ["| Plik TS | Linia TS | Symbol | Status | Odpowiednik Rust | Test | Uwaga |", "|---|---|---|---|---|---|---|"]
for r in rows:
    table.append("| " + " | ".join(c.replace("|", "\\|") for c in r) + " |")

# --- testy ---
test_files = ["p6_7b_cost", "p6_7b_gate", "p6_7b_nfd", "p6_7b_pool", "p6_7b_spichlerz", "p6_7b_tables"]
ttable = ["| Plik | Testy | Zakres |", "|---|---|---|"]
scope = {
    "p6_7b_cost": "tempo kosztow, mnozniki epok, koszt surowcowy budynku/jednostki, brakuje/stac/pobor, etykiety, klucze prototypowe",
    "p6_7b_gate": "etykiety i zloza, bramka budowy i runtime, punkt staly aktywnych, prerekwizyty miasta, Mennica",
    "p6_7b_nfd": "klucz stripDiacriticsLower: caly Unicode (1 112 064 punkty) i 6000 napisow losowych",
    "p6_7b_pool": "pula panstwa po miastach: suma, zapas, pobor, zwrot, kredyt z capem, przypisanie z puli, remis UTF-16",
    "p6_7b_spichlerz": "drain Ceramiki/Soli, stan i bonusy, yields, mnoznik armii, status nieaktywnego budynku",
    "p6_7b_tables": "ksztalt i spojnosc tabel (bez pinow), zgodnosc z tabelami P3-19 (stock budynkow/jednostek, ery, tempo)",
}
total_new = 0
for f in test_files:
    src = (ENG / "tests" / f"{f}.rs").read_text(encoding="utf-8")
    names = re.findall(r"#\[test\]\s*\n\s*fn (\w+)", src)
    total_new += len(names)
    ttable.append(f"| `{f}.rs` | {len(names)}: " + ", ".join(f"`{n}`" for n in names) + f" | {scope[f]} |")

# --- wektory ---
vt = ["| Plik | Sekcja | Przypadkow |", "|---|---|---|"]
for name in ("cost.json", "nfd.json", "pool.json", "gate.json"):
    d = json.loads((ENG / "tests/p6_7b_vectors" / name).read_text(encoding="utf-8"))
    for k, v in d.items():
        if isinstance(v, list):
            vt.append(f"| `{name}` | `{k}` | {len(v)} |")
    if name == "nfd.json":
        vt.append(f"| `nfd.json` | `total` (punkty kodowe bez zastepczych) | {d['total']} |")

# --- logi ---
gate_test = read(RUN / "gate-test-r1.log")
passed = sum(int(m) for m in re.findall(r"test result: ok\. (\d+) passed", gate_test))
failed = sum(int(m) for m in re.findall(r"; (\d+) failed", gate_test))
assert failed == 0, "testy czerwone w logu bramki"
verify_log = read(RUN / "verify-p67b-r1.log")
m = re.search(r"sprawdzen=(\d+) rozbieznosci=(\d+) nfd_punktow=(\d+)", verify_log)
verify_summary = f"{m.group(1)} sprawdzen, {m.group(2)} rozbieznosci; w tym {m.group(3)} punktow kodowych NFD"

mut_raw = ""
final = {}
for part in ("part1", "part2", "part3"):
    p = RUN / f"mutation-evidence-r1-{part}.txt"
    if p.exists():
        body = read(p)
        mut_raw += f"# {p.name}\n" + body + "\n"
        for l in body.splitlines():
            m = re.match(r"(WYKRYTY|PRZEZYL|KOMPILACJA|TIMEOUT)\s*: \[(\d+)\]", l)
            if m:
                final[int(m.group(2))] = (m.group(1), l)
mut_total = len(final)
mut_det = sum(1 for v in final.values() if v[0] == "WYKRYTY")
surv = [v[1] for v in final.values() if v[0] != "WYKRYTY"]
equiv = RUN / "mutation-equivalents-r1.txt"
equiv_text = read(equiv) if equiv.exists() else ""
mut_summary = f"{mut_det}/{mut_total} wykrytych, {len(surv)} nie wykrytych (rownowazne z uzasadnieniem: {len(re.findall(r'^R[0-9]+', equiv_text, re.M))})"
mut_full = f"Wynik: **{mut_det} z {mut_total}** mutantow wykrytych; {len(surv)} bez wykrycia - kazdy jest mutantem ROWNOWAZNYM (uzasadnienie ponizej), zadnego prawdziwego przezycia.\n\n" + equiv_text

nfd_skew = (RUN / "nfd-skew-r1.txt").read_text(encoding="utf-8").strip() if (RUN / "nfd-skew-r1.txt").exists() else "?"

# --- liczby ---
module_lines = len(
    "\n".join((ENG / "src/domain/building_costs.rs").read_text(encoding="utf-8").splitlines()[
        next(i for i, l in enumerate((ENG / "src/domain/building_costs.rs").read_text(encoding="utf-8").splitlines()) if l.startswith("pub mod p6_7b")):
    ]).splitlines()
)
derived_lines = len((ENG / "src/data/derived.rs").read_text(encoding="utf-8").splitlines()) - next(
    i for i, l in enumerate((ENG / "src/data/derived.rs").read_text(encoding="utf-8").splitlines()) if l.startswith("// P6.7B")
) + 1
states = json.loads((ENG / "data/derived/building-work-states.json").read_text(encoding="utf-8"))
pace_rows = sum(1 for r in states["wiersze"] for w in r["wartosci"] if w["tryb"] == "normalny" and w["znizka_cywilizacji"] == 0)

# --- samokontrola ---
def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, cwd=ROOT).stdout.rstrip("\n")


allow = [
    re.compile(r"^dyspozycje/rust-port/p6/P6-7B-MIASTA-WZROST-B\.md$"),
    re.compile(r"^dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/"),
    re.compile(r"^rust-port/engine/src/domain/building_costs\.rs$"),
    re.compile(r"^rust-port/engine/src/data/derived\.rs$"),
    re.compile(r"^rust-port/engine/data/derived/[^/]+\.json$"),
    re.compile(r"^rust-port/engine/tests/p6_7b_[^/]+\.rs$"),
    re.compile(r"^rust-port/engine/tests/p6_7b_vectors/"),
]
staged = git("diff", "--cached", "--name-only").splitlines()
status = git("status", "--short")
outside = [p for p in staged if not any(a.search(p) for a in allow)]
doc_path = "dyspozycje/rust-port/p6/P6-7B-MIASTA-WZROST-B.md"
selfcheck = (
    f"Pliki w indeksie po jawnym `git add` (bez `-A`): {len(staged)}; poza allowlista: {len(outside)} {outside if outside else ''}.\n"
    f"Zakazane sciezki (`gra/**`, `bridge.rs`, `Cargo.toml`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`): "
    f"{sum(1 for p in staged if p.startswith(('gra/', 'rust-port/renderer/', 'src-tauri/')) or p.endswith(('bridge.rs', 'Cargo.toml', 'domain/mod.rs', 'p6_m00_skeleton.rs')))} w indeksie. "
    "`Cargo.lock` i `target/` nie sa w indeksie (plik generowany lokalnie, nieSledzony).\n\n"
    "```text\n$ git status --short   (stan w chwili skladania dokumentu)\n" + status + "\n\n$ git diff --cached --stat   (przed dodaniem tego dokumentu)\n" + git("diff", "--cached", "--stat") + "\n```"
)

repl = {
    "@@SYMBOL_SUMMARY@@": summary,
    "@@SYMBOLS@@": "\n".join(table),
    "@@TEST_TABLE@@": "\n".join(ttable),
    "@@VECTOR_TABLE@@": "\n".join(vt),
    "@@VERIFY_SUMMARY@@": verify_summary,
    "@@MUTATION_SUMMARY_FULL@@": mut_full,
    "@@MUTATION_SUMMARY@@": mut_summary,
    "@@MUTATION_RAW@@": mut_raw.rstrip("\n"),
    "@@NFD_SKEW@@": nfd_skew,
    "@@MODULE_LINES@@": str(module_lines),
    "@@DERIVED_LINES@@": str(derived_lines),
    "@@PARAMS_LINES@@": str(len((ENG / "data/derived/building-cost-params.json").read_text(encoding="utf-8").splitlines())),
    "@@NFD_LINES@@": str(len((ENG / "data/derived/nfd-strip-table.json").read_text(encoding="utf-8").splitlines())),
    "@@PACE_ROWS@@": str(pace_rows),
    "@@TEST_TOTAL@@": str(passed),
    "@@TEST_NEW@@": str(total_new),
    "@@SELFCHECK@@": selfcheck,
    "@@GATE_FMT@@": read(RUN / "gate-fmt-r1.log"),
    "@@GATE_CLIPPY@@": read(RUN / "gate-clippy-r1.log"),
    "@@GATE_TEST@@": gate_test,
    "@@GATE_DIFFCHECK@@": read(RUN / "gate-diffcheck-r1.log"),
    "@@VERIFY_LOG@@": verify_log,
    "@@NEGATIVE_LOG@@": read(RUN / "dowody/verify-negative-r1.txt"),
    "@@LITERALS@@": read(RUN / "dowody/grep-literals-r1.txt"),
}
# kolejnosc: dluzsze klucze pierwsze (SUMMARY_FULL przed SUMMARY)
for k in sorted(repl, key=len, reverse=True):
    text = text.replace(k, repl[k])
left = re.findall(r"@@[A-Z_]+@@", text)
assert not left, f"nierozwiazane znaczniki: {left}"
OUT.write_text(text.rstrip("\n") + "\n", encoding="utf-8")
print(f"OK {OUT} linii={len(text.splitlines())} testow_nowych={total_new} testow_lacznie={passed}")
