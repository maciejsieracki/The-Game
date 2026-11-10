#!/usr/bin/env python3
"""Skaza kopie wektorow P6.M02 (do dowodu, ze weryfikator wykrywa rozbieznosci).
Uzycie: python3 -I tamper-vectors.py <KOPIA_WEKTOROW_DIR>   (nigdy na zacommitowanych wektorach)"""
import json
import sys
from pathlib import Path

d = Path(sys.argv[1])


def edit(name, fn):
    p = d / name
    data = json.loads(p.read_text(encoding="utf-8"))
    fn(data)
    p.write_text(json.dumps(data), encoding="utf-8")


def f_new(x):
    x["riverParams"][3]["ints"]["minLen"] += 1
    x["perLabel"][2]["defaultRywale"] += 1
    x["clampMiasta"][5]["result"] += 1
    x["tierFns"][0]["multiplier"] = "3ff0000000000001"


def f_river(x):
    x["cases"][7]["enabled"] = not x["cases"][7]["enabled"]


def f_dep(x):
    x["hexCases"][20]["minEraFor"] += 1


edit("new-game.json", f_new)
edit("river-switch.json", f_river)
edit("deposit-era.json", f_dep)


def f_quality(x):
    x["perLabel"][3]["tier"] = "high"
    x["perLabel"][4]["large"] = not x["perLabel"][4]["large"]


edit("quality.json", f_quality)
