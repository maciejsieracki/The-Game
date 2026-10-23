#!/usr/bin/env python3
"""Literaly liczbowe i napisowe w nowych modulach P6.6B (komentarze pominiete).

Uzycie: grep-literals-p66b.py <ENGINE_DIR> > dowody/grep-literals-r1.txt
Zakresy: od markera `// P6.6B` do konca pliku w `domain/state.rs` i `data/derived.rs`. Klasyfikacja
STRUKTURALNY = elementy neutralne/semantyka JS (0.0 jako dolna granica Math.max(0, x), 1.0 jako krok `+ 1`/`- 1`,
2.0 jako dzielnik polowy `remainder / 2`, krok petli, indeksy `[0]`/`[1]` pary kluczy, nazwy wariantow wyliczen
i pol JSON jako identyfikatory, formaty szablonow `{}`), nie dane ani mnozniki balansu.
Dane/teksty/progi balansu (50 / 70 / 100 / 20-60-20 / 33-66-100 / 10 / 5 / 3 / 12 nazw miast / komunikaty powodow
odmowy / etykiety): `data/derived/{cities-params,display-names-params}.json`, `data/miasto-params.json`.
"""
import re
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
SCOPES = [
    ("src/domain/state.rs", "// P6.6B"),
    ("src/data/derived.rs", "// P6.6B"),
]
NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')

print("# Literaly liczbowe i napisowe w modulach P6.6B (state.rs, derived.rs); komentarze pominiete")
print("# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, `+ 1.0`, `/ 2.0`, indeksy pary kluczy, nazwy")
print("# wariantow wyliczen i pol JSON jako identyfikatory, formaty szablonow), nie dane ani mnozniki balansu.")
print("# Dane: data/derived/{cities-params,display-names-params}.json, data/miasto-params.json.")
total = 0
for rel, marker in SCOPES:
    lines = (ENGINE / rel).read_text(encoding="utf-8").splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith(marker) or l.lstrip().startswith(marker))
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
