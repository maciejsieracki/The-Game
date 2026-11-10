# Niezależne wyliczenie (BEZ kodu weba, wg opisu reguł z dokumentu P3-19 §2):
#  - jednostka: Surowiec (ilość) x mnożnik epoki (Kamień 1, Brąz 2, Żelazo 4) -> max(1, round)
#  - jednostka: Mount (oprócz 'Rydwan (woły)') -> + kon: 25 x mnożnik epoki -> max(1, round)
#  - jednostka: Utrzymanie surowiec (ilość) x mnożnik epoki -> max(1, round)
#  - budynek: koszt_surowce x2 (FALA2) -> max(1, round), potem x mnożnik ery (1 / 2 / 4 dla epokaWejscia 1 / 2 / >=3)
#  - budynek: utrzymanie surowcowe = 5 na każdy klucz koszt_surowce (wartość > 0)
# Argumenty: units.json buildings.json unit-stock-costs.json building-stock-costs.json
import json
import sys

units_path, buildings_path, utab_path, btab_path = sys.argv[1:5]
units = json.load(open(units_path, encoding="utf-8"))
buildings = json.load(open(buildings_path, encoding="utf-8"))
utab = json.load(open(utab_path, encoding="utf-8"))["wiersze"]
btab = json.load(open(btab_path, encoding="utf-8"))["wiersze"]

EPOCH_MULT = {"Kamień": 1, "Brąz": 2, "Żelazo": 4}
ERA_MULT = {1: 1, 2: 2, 3: 4, 4: 4}
KEY = {"Drewno": "drewno", "Brąz": "braz", "Żelazo": "zelazo", "Kamień": "kamien"}


def rnd(x):
    # Math.round dla dodatnich: floor(x + 0.5)
    return int(x + 0.5)


def scale(cost, mult):
    if cost <= 0:
        return 0
    return max(1, rnd(cost * mult))


disc = []
exp_u = {}
for u in units:
    name = u["Jednostka"]
    m = EPOCH_MULT[u["Epoka"]]
    exp = {}
    if u.get("Surowiec") not in (None, "-") and u.get("Surowiec (ilość)", 0) > 0:
        exp[KEY[u["Surowiec"]]] = scale(u["Surowiec (ilość)"], m)
    if u.get("Typ") == "Mount" and name != "Rydwan (woły)":
        exp["kon"] = exp.get("kon", 0) + scale(25, m)
    exp_u[name] = exp
    up = {}
    if u.get("Utrzymanie surowiec") not in (None, "-") and u.get("Utrzymanie surowiec (ilość)", 0) > 0:
        up[KEY[u["Utrzymanie surowiec"]]] = scale(u["Utrzymanie surowiec (ilość)"], m)
    exp_u[name + "\x00up"] = up

rows_u = {r["jednostka"]: r for r in utab}
if len(rows_u) != len(utab):
    disc.append("unit table: duplicate jednostka keys")
if set(rows_u) != {u["Jednostka"] for u in units}:
    disc.append("unit table: key set differs from units.json")
for name in exp_u:
    if "\x00" in name:
        continue
    r = rows_u.get(name)
    if r is None:
        continue
    if r["surowiec"] != exp_u[name]:
        disc.append(f"UNIT STOCK {name}: table={r['surowiec']} indep={exp_u[name]}")
    if r["utrzymanie_surowiec"] != exp_u[name + "\x00up"]:
        disc.append(f"UNIT UPKEEP {name}: table={r['utrzymanie_surowiec']} indep={exp_u[name + chr(0) + 'up']}")

exp_b = {}
for b in buildings:
    mult = ERA_MULT[max(1, int(b["epokaWejscia"]))]
    st = {}
    for k, v in (b.get("koszt_surowce") or {}).items():
        if v > 0:
            st[k] = max(1, rnd(v * 2))
    st = {k: max(1, rnd(v * mult)) for k, v in st.items()}
    exp_b[b["id"]] = (st, {k: 5 for k, v in (b.get("koszt_surowce") or {}).items() if v > 0})

rows_b = {r["budynek"]: r for r in btab}
if set(rows_b) != set(exp_b):
    disc.append("building table: key set differs from buildings.json")
for bid, (st, up) in exp_b.items():
    r = rows_b.get(bid)
    if r is None:
        continue
    if r["koszt_surowce"] != st:
        disc.append(f"BUILDING STOCK {bid}: table={r['koszt_surowce']} indep={st}")
    if r["utrzymanie_surowcowe_na_ture"] != up:
        disc.append(f"BUILDING UPKEEP {bid}: table={r['utrzymanie_surowcowe_na_ture']} indep={up}")

print(f"unit rows compared: {len(rows_u)} (stock+upkeep each)")
print(f"building rows compared: {len(rows_b)} (stock+upkeep each)")
print(f"discrepancies: {len(disc)}")
for d in disc:
    print(d)
