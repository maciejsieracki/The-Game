#!/usr/bin/env python3
"""P6.5B r2 (zarzut 6): dowod statyczny, ze grupy mutacji z mutate-p65b.py sa rozlaczne.

Uzycie: check-mutation-independence.py <ENGINE_DIR> > dowody/mutation-independence-r2.txt
Wynik: wyniki grep + weryfikacja regul (kod wyjscia != 0 przy naruszeniu).
"""
import re
import sys
from pathlib import Path

E = Path(sys.argv[1])
TESTS = ["p6_5b_bonuses", "p6_5b_format", "p6_5b_manpower", "p6_5b_replenish", "p6_5b_tables"]
errors = []


def read(rel):
    return (E / rel).read_text(encoding="utf-8")


print("# P6.5B r2 (zarzut 6): rozlacznosc grup mutacji (statycznie)\n")
print("## 1. Importy z civ_engine w binariach testowych")
imports = {}
for t in TESTS + ["vectors/common"]:
    path = f"tests/p6_5b_{t}.rs" if not t.startswith("vectors") else "tests/p6_5b_vectors/common.rs"
    if t.startswith("p6_5b"):
        path = f"tests/{t}.rs"
    text = read(path)
    mods = sorted(set(re.findall(r"civ_engine::((?:domain|data)::[a-z_]+(?:::[a-z_]+)?)", text)))
    imports[t] = mods
    print(f"- {path}: {mods}")
for t in ["p6_5b_format", "p6_5b_manpower", "p6_5b_replenish", "vectors/common"]:
    if any("combat" in m for m in imports[t]):
        errors.append(f"{t} importuje combat")
if any("recruitment" in m for m in imports["p6_5b_bonuses"]):
    errors.append("p6_5b_bonuses importuje recruitment")

print("\n## 2. recruitment.rs -> combat (oczekiwane: brak)")
rec = read("src/domain/recruitment.rs")
hits = [(i, l.strip()) for i, l in enumerate(rec.splitlines(), 1) if re.search(r"domain::combat|unit_building_bonuses|(?<![a-z_])combat::", l)]
print(hits if hits else "(brak trafien)")
if hits:
    errors.append("recruitment.rs odwoluje sie do combat")

print("\n## 3. combat::unit_building_bonuses -> recruitment (oczekiwane: tylko js_max i js_number_to_string)")
cb = read("src/domain/combat.rs")
ub = cb[cb.index("pub mod unit_building_bonuses"):]
used = [(i, l.strip()) for i, l in enumerate(ub.splitlines(), 1) if re.search(r"recruitment::|manpower::|army_merge::", l)]
for u in used:
    print(u)
allowed = {"js_max", "js_number_to_string"}
for _, line in used:
    if not any(a in line for a in allowed):
        errors.append(f"combat odwoluje sie do recruitment poza {allowed}: {line}")

print("\n## 4. Dane JSON: czytniki w src/domain")
for name, who, other in [
    ("unit_building_bonuses", "combat.rs", "recruitment.rs"),
    ("manpower_params", "recruitment.rs", "combat.rs"),
    ("locale_compare_ascii", "recruitment.rs", "combat.rs"),
]:
    in_who = len(re.findall(rf"\b{name}\b", read(f"src/domain/{who}")))
    in_other = len(re.findall(rf"\b{name}\b", read(f"src/domain/{other}")))
    print(f"- {name}: {who}={in_who}, {other}={in_other}")
    if in_other:
        errors.append(f"{name} uzywane tez w {other}")

print("\n## 5. Symbole recruitment uzywane przez combat -> mutacje w nich tylko pojedynczo (SINGLE_ONLY = M25, M26)")
for sym in ["js_number_to_string", "js_max"]:
    for i, l in enumerate(rec.splitlines(), 1):
        if re.search(rf"pub fn {sym}\b", l):
            print(f"- recruitment.rs:{i}: {l.strip()}")

print("\n" + ("WYNIK: NARUSZENIA " + str(len(errors)) if errors else "WYNIK: NARUSZEN 0"))
for e in errors:
    print("BLAD:", e)
sys.exit(1 if errors else 0)
