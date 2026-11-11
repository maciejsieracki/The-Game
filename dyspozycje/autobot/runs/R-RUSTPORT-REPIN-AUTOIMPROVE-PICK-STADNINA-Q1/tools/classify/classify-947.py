#!/usr/bin/env python3
"""Klasyfikacja 947 niezgodnosci pick (Rust bez portu D2/D3 vs web cffe39cb9).

Metoda (ablacja): baseline-bad-947.txt = scenariusze niezgodne gdy wszystkie 3 porty sa WYLACZONE (A+B+C).
abl-<X>.txt = scenariusze z tej listy, ktore NADAL sa niezgodne, gdy wylaczony jest TYLKO port X
(reszta wlaczona). Wylaczniki: patrz abl-hooks.patch (tymczasowa zmienna ABL, NIE jest w kodzie koncowym).
  A = kaskada etapow zywnosciowych (web 9420ae1da, Q2 r2; sprawca bledu cf236dafc)
  B = hodowla poza rzeka (web a4396c3d8, Q2 r1: bydlo na farmie, owce/lama bez rzeki)
  C = sonda etapu pomija miasta 0% (web a4396c3d8, unlimitedBudgetProbe/cityMayBuild)
Scenariusz niezgodny przy samym wylaczeniu X = port X jest NIEZBEDNY do zgodnosci.

Uzycie: python3 -I classify-947.py [katalog]  (domyslnie katalog skryptu)
"""
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

d = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent


def load(n):
    return set(l for l in (d / n).read_text(encoding="utf-8").splitlines() if l)


base = load("baseline-bad-947.txt")
single = {x: load(f"abl-{x}.txt") for x in "ABC"}
pair = {x: load(f"abl-{x}.txt") for x in ("AB", "AC", "BC")}


def family(name):
    m = re.match(r"([a-z]+(?:-[a-z]+)*?)(?:-\d|$)", name)
    return m.group(1) if m else name


groups = defaultdict(list)
for s in sorted(base):
    need = "".join(x for x in "ABC" if s in single[x])
    if not need:
        # zgodny przy kazdym pojedynczym wylaczeniu: wymaga >= 2 portow naraz
        need = "+".join(k for k in ("AB", "AC", "BC") if s in pair[k]) or "interakcja(A+B+C)"
        need = "para:" + need
    groups[need].append(s)

print(f"baseline niezgodnych: {len(base)}")
for k, v in sorted(groups.items(), key=lambda kv: -len(kv[1])):
    fam = Counter(family(n) for n in v).most_common(6)
    print(f"\n[{k}] {len(v)} scenariuszy; rodziny: {fam}")
    print("  przyklady:", ", ".join(v[:5]))

print("\nPer port (scenariusze, dla ktorych port jest niezbedny):")
for x, label in (("A", "kaskada etapow"), ("B", "hodowla poza rzeka"), ("C", "sonda pomija miasta 0%")):
    print(f"  {x} {label}: {len(single[x])}")
print("\nCztery przywrocone scenariusze:")
for n in ("rnd-961", "ra-rnd-1", "ra-rnd-24", "ra-rnd-247"):
    print(f"  {n}: baseline={'tak' if n in base else 'nie'}; wymaga=" + "".join(x for x in "ABC" if n in single[x]))
