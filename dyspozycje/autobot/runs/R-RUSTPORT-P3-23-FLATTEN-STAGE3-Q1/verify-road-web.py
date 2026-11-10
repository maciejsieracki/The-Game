#!/usr/bin/env python3
"""Niezalezny weryfikator tabeli RUCH (P3-23 etap 3, wiersz 35i).

Nie uzywa kodu weba ani generatora. Oczekiwane wartosci liczy z reguly webu
applyRoadMovementModifier (gra/src/map/road-movement.ts:73-84) wg tekstu zrodla:
  brak        -> koszt
  droga       -> koszt / ROAD_MOVE_SPEED_MULT
  bruk        -> max(ROAD_BRUK_MIN_MOVE_COST, koszt / ROAD_BRUK_MOVE_SPEED_MULT)
Stale ROAD_* czytane z gra/src/map/road-movement.ts (regex na definicje `export const`).

Porownuje:
  A) stale webu (regex na zrodle) vs wartosci tabeli rust/.../road-movement-multipliers.json
  B) wektory z uruchomionego kodu weba (road-web.json, gen-road-web.mjs) vs oczekiwane
  C) model calkowitoliczbowy domeny Rust (pathfinding.rs:292-298: raw = koszt*15, wynik = raw/dzielnik,
     MovementCost = wynik/15) dla calkowitych kosztow 1,2,3 vs wektory webu

Uzycie:
  python3 -I verify-road-web.py <KORZEN_WEB> <tabela.json> <road-web.json>
Wyjscie: linia "ROZBIEZNOSCI: N"; kod 0 gdy N == 0.
"""
import json
import re
import sys

root, table_path, web_gen_path = sys.argv[1:4]

src = open(f"{root}/gra/src/map/road-movement.ts", encoding="utf-8").read()


def web_const(name):
    m = re.search(rf"export const {name} = ([^;]+);", src)
    if not m:
        raise SystemExit(f"brak stalej {name} w road-movement.ts")
    return eval(m.group(1).replace("/", "/"), {}, {})  # wyrazenia: 3, 5, 1 / 3, 1 / 5


stale = {
    "ROAD_MOVE_SPEED_MULT": web_const("ROAD_MOVE_SPEED_MULT"),
    "ROAD_BRUK_MOVE_SPEED_MULT": web_const("ROAD_BRUK_MOVE_SPEED_MULT"),
    "ROAD_BRUK_MIN_MOVE_COST": web_const("ROAD_BRUK_MIN_MOVE_COST"),
    "ROAD_MIN_MOVE_COST": web_const("ROAD_MIN_MOVE_COST"),
}

table = json.load(open(table_path, encoding="utf-8"))
tabela = {w["id"]: w["wartosc"] for w in table["wiersze"]}
web = json.load(open(web_gen_path, encoding="utf-8"))

rozbieznosci = 0
print("A) stale webu (regex) vs tabela")
for k, v in stale.items():
    ok = k in tabela and abs(tabela[k] - v) <= 1e-12
    print(f"  {k}: web={v!r} tabela={tabela.get(k)!r} {'OK' if ok else 'ROZNI SIE'}")
    if not ok:
        rozbieznosci += 1

# Podlaczenie do uruchomionego kodu: stale wygenerowane przez gen-road-web.mjs.
print("A2) stale z uruchomionego kodu weba vs regex")
for k, v in web["stale"].items():
    ok = abs(v - stale[k]) <= 1e-12
    print(f"  {k}: kod={v!r} regex={stale[k]!r} {'OK' if ok else 'ROZNI SIE'}")
    if not ok:
        rozbieznosci += 1


def oczekiwane(ulepszenie, koszt):
    if ulepszenie == "brak":
        return koszt
    if ulepszenie == "droga":
        return koszt / tabela["ROAD_MOVE_SPEED_MULT"]
    if ulepszenie == "droga_brukowana":
        return max(tabela["ROAD_BRUK_MIN_MOVE_COST"], koszt / tabela["ROAD_BRUK_MOVE_SPEED_MULT"])
    raise ValueError(ulepszenie)


print("B) wektory kodu weba vs oczekiwane z tabeli")
for w in web["wektory"]:
    exp = oczekiwane(w["ulepszenie"], w["koszt_bazowy"])
    ok = abs(w["wynik"] - exp) <= 1e-12
    print(f"  {w['ulepszenie']} koszt={w['koszt_bazowy']}: web={w['wynik']!r} oczekiwane={exp!r} {'OK' if ok else 'ROZNI SIE'}")
    if not ok:
        rozbieznosci += 1

print("C) model calkowitoliczbowy Rust (raw=koszt*15, /dzielnik) vs wektory webu, koszty calkowite >= 1")
SCALE = 15
dzielniki = {
    "brak": 1,
    "droga": int(tabela["ROAD_MOVE_SPEED_MULT"]),
    "droga_brukowana": int(tabela["ROAD_BRUK_MOVE_SPEED_MULT"]),
}
for w in web["wektory"]:
    koszt = w["koszt_bazowy"]
    if koszt != int(koszt) or koszt < 1:
        continue  # Rust nie ma kosztow ulamkowych (MovementCost z calkowitego kosztu)
    raw = int(koszt) * SCALE
    rust = max(raw // dzielniki[w["ulepszenie"]], 1) / SCALE
    ok = abs(rust - w["wynik"]) <= 1e-12
    print(f"  {w['ulepszenie']} koszt={koszt}: rust={rust!r} web={w['wynik']!r} {'OK' if ok else 'ROZNI SIE'}")
    if not ok:
        rozbieznosci += 1

print(f"ROZBIEZNOSCI: {rozbieznosci}")
sys.exit(0 if rozbieznosci == 0 else 1)
