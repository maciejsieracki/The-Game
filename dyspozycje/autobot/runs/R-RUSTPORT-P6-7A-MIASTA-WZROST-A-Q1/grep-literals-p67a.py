#!/usr/bin/env python3
"""Literaly liczbowe i napisowe w nowym module P6.7A (komentarze pominiete).

Uzycie: grep-literals-p67a.py <ENGINE_DIR> > dowody/grep-literals-r1.txt
Zakresy: od markera `pub mod p6_7a {` do konca `src/domain/city_growth.rs` oraz od markera
`// P6.7A - wzrost ludnosci` do konca `src/data/derived.rs`.
Klasyfikacja STRUKTURALNY = elementy neutralne/semantyka JS (0.0 jako dolna granica `Math.max(0, x)` i wartosc
domyslna `?? 0`, 1.0 jako krok `+ 1`/`- 1` i dolna granica populacji, indeksy `[0]`/`[1]`/`[2]` trojek wartosci,
nazwy kluczy JSON/wariantow jako identyfikatory, komunikaty `expect`, id parametrow macierzy cywilizacji,
tolerancje 1e-9, stale algorytmu Hangul z Unicode ch. 3.12 i dziewiaty wierszy kodowania). Dane/progi/mnozniki
balansu NIE wystepuja jako literaly: `data/derived/{wzrost-ludnosci-params,era-diakrytyki,racje}.json`.
"""
import re
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
SCOPES = [
    ("src/domain/city_growth.rs", "pub mod p6_7a {"),
    ("src/data/derived.rs", "// P6.7A - wzrost ludnosci"),
]
NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

print("# Literaly liczbowe i napisowe w module P6.7A (city_growth.rs::p6_7a, derived.rs); komentarze pominiete")
total = 0
nonstruct = 0
for rel, marker in SCOPES:
    lines = (ENGINE / rel).read_text(encoding="utf-8").splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith(marker) or l.lstrip().startswith(marker))
    print(f"## {rel} od linii {start + 1}")
    for i in range(start, len(lines)):
        raw = lines[i]
        code = raw.split("//")[0]
        if code.strip().startswith("///") or code.strip().startswith("//"):
            continue
        strs = STR.findall(code)
        stripped = STR.sub('""', code)
        nums = NUM.findall(stripped)
        if nums or strs:
            total += 1
            print(f"{i + 1}: nums={nums} strs={strs} | {raw.strip()}")
print(f"# linii z literalami: {total}")
