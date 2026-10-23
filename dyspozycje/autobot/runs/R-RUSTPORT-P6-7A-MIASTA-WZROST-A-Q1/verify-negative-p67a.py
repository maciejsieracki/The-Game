#!/usr/bin/env python3
"""Dowod negatywny: zadna wartosc balansu z tabel P6.7A nie wystepuje jako literal w nowym kodzie Rust.
Uzycie: verify-negative-p67a.py <ENGINE_DIR>"""
import json
import re
import sys
from pathlib import Path

E = Path(sys.argv[1])
params = json.loads((E / "data/derived/wzrost-ludnosci-params.json").read_text(encoding="utf-8"))


def numbers(x, out):
    if isinstance(x, bool):
        return
    if isinstance(x, (int, float)):
        out.add(float(x))
    elif isinstance(x, list):
        for i in x:
            numbers(i, out)
    elif isinstance(x, dict):
        for k, v in x.items():
            if k != "meta":
                numbers(v, out)


vals = set()
numbers(params, vals)
racje = json.loads((E / "data/derived/racje.json").read_text(encoding="utf-8"))
numbers(racje["wiersze"], vals)
neutral = {0.0, 1.0, -1.0}
vals = sorted(v for v in vals if v not in neutral)

NUM = re.compile(r"(?<![A-Za-z_0-9.])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?![A-Za-z_0-9])")
STR = re.compile(r'"((?:[^"\\]|\\.)*)"')
lines = (E / "src/domain/city_growth.rs").read_text(encoding="utf-8").splitlines()
start = next(i for i, l in enumerate(lines) if l.startswith("pub mod p6_7a {"))
code_nums = set()
for l in lines[start:]:
    c = STR.sub('""', l.split("//")[0])
    for m in NUM.finditer(c):
        # indeks tablicy `[2]` (wybor elementu trojki) nie jest wartoscia balansu
        if m.start() > 0 and c[m.start() - 1] == "[" and c[m.end() : m.end() + 1] == "]":
            continue
        code_nums.add(float(m.group(0)))
hits = [v for v in vals if v in code_nums]
print(f"wartosci balansu w tabelach (bez 0, 1, -1): {len(vals)}")
print(f"literaly liczbowe w kodzie p6_7a (unikalne): {sorted(code_nums)}")
print(f"wartosci z tabel, ktore sa tez literalem w kodzie: {hits}")
sys.exit(0 if not hits else 1)
