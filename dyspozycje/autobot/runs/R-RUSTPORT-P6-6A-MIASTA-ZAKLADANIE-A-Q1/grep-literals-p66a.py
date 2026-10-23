#!/usr/bin/env python3
"""Literaly liczbowe i napisowe w nowych modulach P6.6A (komentarze pominiete).

Uzycie: grep-literals-p66a.py <ENGINE_DIR> > dowody/grep-literals-r1.txt
Zakresy: od markera `// P6.6A` do konca pliku w `domain/state.rs` i `domain/terrain.rs`. Klasyfikacja
STRUKTURALNY = elementy neutralne/semantyka JS (0.0 / 1.0 jako elementy neutralne i krok petli, `+ 1`
w progu minimalnej ludnosci zrodla, indeksy, klucze flag `has*` jako identyfikatory pol, nazwy nakladek).
Dane/teksty/progi balansu (20 / 1 / 3 / 0.5 / 1.5 / 5 / 0.175 / listy id budynkow / klucze ulepszen /
komunikaty): `data/derived/{city-founding-params,city-hex-clear-rules,conquest-stability-params,
visibility-params}.json`, `data/miasto-params.json`, `data/map-gen-params.json`.
"""
import re
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
SCOPES = [
    ("src/domain/state.rs", "// P6.6A"),
    ("src/domain/terrain.rs", "// P6.6A"),
]
NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

print("# Literaly liczbowe i napisowe w modulach P6.6A (state.rs, terrain.rs); komentarze pominiete")
print("# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, `+ 1.0`, krok petli, identyfikatory pol has*,")
print("# format cudzyslowu szablonu), nie dane ani mnozniki balansu. Dane: data/derived/*.json, data/miasto-params.json.")
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
