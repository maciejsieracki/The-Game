#!/usr/bin/env python3
"""Literaly liczbowe i napisowe w nowych modulach P6.5B (komentarze pominiete).

Uzycie: grep-literals-p65b.py <ENGINE_DIR> > dowody/grep-literals-r1.txt
Zakresy: `pub mod manpower` (recruitment.rs, do konca pliku), `pub mod unit_building_bonuses`
(combat.rs, do konca pliku). Klasyfikacja STRUKTURALNY = elementy neutralne/semantyka JS (0, 1, 2 jako
argumenty/indeksy, 0.5 w Math.round, format napisu), nie dane ani mnozniki balansu. Dane/teksty/progi:
`data/derived/{manpower-params,unit-building-bonuses,locale-compare-ascii}.json`.
"""
import re
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
SCOPES = [
    ("src/domain/recruitment.rs", "pub mod manpower {"),
    ("src/domain/combat.rs", "pub mod unit_building_bonuses {"),
]
NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

print("# Literaly liczbowe i napisowe w modulach manpower (recruitment.rs) i unit_building_bonuses (combat.rs); komentarze pominiete")
print("# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0, 1, 0.5 w zaokragleniu, indeksy, format napisu),")
print("# nie sa danymi ani mnoznikami balansu. Dane/teksty/progi: data/derived/{manpower-params,unit-building-bonuses,locale-compare-ascii}.json.")
total = 0
for rel, marker in SCOPES:
    lines = (ENGINE / rel).read_text(encoding="utf-8").splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith(marker))
    print(f"## {rel} od linii {start + 1}")
    for i in range(start, len(lines)):
        raw = lines[i]
        code = raw.split("//")[0]
        strs = STR.findall(code)
        stripped = STR.sub('""', code)
        nums = NUM.findall(stripped)
        if nums or strs:
            total += 1
            print(f"{i + 1}: nums={nums} strs={strs} | {raw.strip()}")
print(f"# linii z literalami: {total}")
