#!/usr/bin/env python3
"""Literaly liczbowe i napisowe w nowych modulach P6.7B (komentarze pominiete).

Uzycie: grep-literals-p67b.py <ENGINE_DIR> > dowody/grep-literals-r1.txt
Zakresy: od markera `pub mod p6_7b` do konca pliku w `domain/building_costs.rs` oraz od markera `// P6.7B` do
konca pliku w `data/derived.rs`. Klasyfikacja STRUKTURALNY = elementy neutralne/semantyka JS (0.0 jako dolna
granica Math.max(0, x) i element neutralny sumy, 1.0 jako dolna granica Math.max(1, x) w kosztach i element
neutralny iloczynu, indeksy `[0]`, nazwy pol JSON jako identyfikatory, formaty szablonow `{}`, sentinelne
napisy bledow `expect`), nie dane ani mnozniki balansu. Dane/teksty/progi balansu: `data/derived/building-cost-params.json`;
dane Unicode: `data/derived/nfd-strip-table.json`.
"""
import re
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
SCOPES = [
    ("src/domain/building_costs.rs", "pub mod p6_7b"),
    ("src/data/derived.rs", "// P6.7B"),
]
NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

print("# Literaly liczbowe i napisowe w modulach P6.7B (building_costs.rs::p6_7b, derived.rs); komentarze pominiete")
print("# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, indeksy, nazwy pol JSON jako identyfikatory,")
print("# komunikaty expect, formaty szablonow), nie dane ani mnozniki balansu.")
print("# Dane: data/derived/building-cost-params.json; dane Unicode: data/derived/nfd-strip-table.json.")
total = 0
for rel, marker in SCOPES:
    lines = (ENGINE / rel).read_text(encoding="utf-8").splitlines()
    start = next(i for i, l in enumerate(lines) if l.lstrip().startswith(marker))
    print(f"## {rel} od linii {start + 1}")
    for i in range(start, len(lines)):
        raw = lines[i]
        stripped_line = raw.lstrip()
        if stripped_line.startswith("//"):
            continue
        code = raw.split("//")[0]
        if code.lstrip().startswith("///") or code.lstrip().startswith("#["):
            continue
        strs = STR.findall(code)
        stripped = STR.sub('""', code)
        nums = NUM.findall(stripped)
        if nums or strs:
            total += 1
            print(f"{i + 1}: nums={nums} strs={strs} | {raw.strip()}")
print(f"# linii z literalami: {total}")
