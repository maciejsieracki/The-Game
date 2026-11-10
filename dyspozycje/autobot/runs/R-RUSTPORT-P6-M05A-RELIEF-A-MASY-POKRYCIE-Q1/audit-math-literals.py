#!/usr/bin/env python3
"""Audyt zakresu gen-helpers.ts:1408-2365 (pin edb8fb56): (1) wywolania Math.*, (2) literaly liczbowe
w kodzie Rust relief.rs. Uzycie: audit-math-literals.py <WEB_ROOT> <relief.rs> <wyjscie-math.txt> <wyjscie-literaly.txt>"""
import re
import sys

web_root, rs_path, out_math, out_lit = sys.argv[1:5]
L = open(f"{web_root}/gra/src/map/gen-helpers.ts", encoding="utf-8").read().split("\n")
out = [
    "# Wywolania Math.* w gen-helpers.ts:1408-2365 (pin edb8fb56), tylko kod (bez komentarzy //, /* */)",
    "# linia\tfunkcja\ttekst",
]
in_block = False
counts = {}
for n in range(1408, 2366):
    t = L[n - 1]
    code = t
    if in_block:
        if "*/" in code:
            code = code.split("*/", 1)[1]
            in_block = False
        else:
            continue
    code = re.sub(r"/\*.*?\*/", "", code)
    if "/*" in code:
        code = code.split("/*", 1)[0]
        in_block = True
    code = code.split("//", 1)[0]
    for m in re.finditer(r"Math\.(\w+)", code):
        counts[m.group(1)] = counts.get(m.group(1), 0) + 1
        out.append(f"{n}\t{m.group(1)}\t{t.strip()}")
out.append("")
out.append("# LICZBA wywolan wg funkcji: " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))
absent = {k: counts.get(k, 0) for k in ("sin", "cos", "pow", "atan2", "hypot", "sqrt", "exp", "log", "trunc", "sign", "abs")}
out.append("# sin/cos/pow/atan2/hypot/sqrt/exp/log/trunc/sign/abs w zakresie: " + str(absent))
open(out_math, "w", encoding="utf-8").write("\n".join(out) + "\n")
print("Math:", counts)

# literaly liczbowe w relief.rs (kod, bez komentarzy)
lit = ["# Literaly liczbowe w relief.rs (kod, bez komentarzy // i ///); klasyfikacja: strukturalny / JS-liczba"]
rs = open(rs_path, encoding="utf-8").read().split("\n")
total = 0
other = 0
for n, t in enumerate(rs, 1):
    s = t.strip()
    if s.startswith("//"):
        continue
    code = s.split("//", 1)[0]
    code = re.sub(r'"[^"]*"', '""', code)
    for m in re.finditer(r"(?<![A-Za-z_0-9.])\d+(?:\.\d+)?(?:e\d+)?(?:_f64|_usize|_u8|_i64)?(?![A-Za-z_0-9.])", code):
        total += 1
        tok = m.group(0)
        base = re.sub(r"_(f64|usize|u8|i64)$", "", tok)
        if base in ("0", "1", "2", "0.0", "1.0", "2.0"):
            kind = "strukturalny (0/1/2: licznik, indeks, polowa, brak/jeden)"
        elif base == "0.5" and "x - floor >= 0.5" in s:
            kind = "stala JS: Math.round zaokragla polowe w gore (ECMA-262 21.3.2.28)"
        elif base == "1e21":
            kind = "stala JS: Number->String przechodzi na zapis wykladniczy od 1e21 (klucze komorek)"
        else:
            kind = "NIEZNANY"
            other += 1
        lit.append(f"{n}\t{tok}\t{kind}\t{s}")
lit.append("")
lit.append(f"# RAZEM literalow: {total}; NIEZNANYCH (potencjalne dane balansowe): {other}")
open(out_lit, "w", encoding="utf-8").write("\n".join(lit) + "\n")
print("literaly:", total, "nieznane:", other)
sys.exit(1 if other else 0)
