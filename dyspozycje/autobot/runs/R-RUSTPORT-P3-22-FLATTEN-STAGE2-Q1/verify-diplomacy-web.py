#!/usr/bin/env python3
"""Niezalezny weryfikator grupy DYPLOMACJA (P3-22 etap 2, runda 3).

Uzycie: python3 -I verify-diplomacy-web.py <KORZEN_WEBA_git_archive> <web-values.json> <diplomacy-multipliers.json>

Porownuje tabele Rust (rust-port/engine/data/derived/diplomacy-multipliers.json) z:
  (a) wartosciami zaobserwowanymi z URUCHOMIONEGO kodu TS weba (gen-diplomacy-web.mjs);
  (b) niezaleznym odczytem literalow zrodlowych TS (regex, bez node) - krzyzowa kontrola.
Kazda niezgodnosc = wpis w LICZBA ROZBIEZNOSCI; exit != 0 przy jakiejkolwiek rozbieznosci.
"""
import json
import math
import re
import sys

root, web_json, table_json = sys.argv[1], sys.argv[2], sys.argv[3]
EPS = 1e-12
mismatches = []


def src(path):
    with open(f"{root}/{path}", encoding="utf-8") as fh:
        return fh.read()


def literal_object(text, name):
    """Zwraca dict literal z `name: Record<...> = { k: v, ... }` (zwykle mnozniki)."""
    m = re.search(rf"export const {name}\b[^=]*=\s*(?:Object\.freeze\()?\{{(.*?)\}}", text, re.S)
    if not m:
        raise SystemExit(f"BRAK LITERALU OBIEKTU {name}")
    pairs = re.findall(r"(\w+)\s*:\s*(-?[0-9]+(?:\.[0-9]+)?)", m.group(1))
    return {k: float(v) for k, v in pairs}


def check(label, got, want):
    ok = (got is None and want is None) or (
        got is not None and want is not None and abs(float(got) - float(want)) <= EPS
    )
    if not ok:
        mismatches.append(f"{label}: tabela={got} wzor={want}")


web = json.load(open(web_json, encoding="utf-8"))
table = json.load(open(table_json, encoding="utf-8"))
rows = {r["id"]: r for r in table["wiersze"]}

# 0. Kompletnosc: 15 wierszy (runda 5: +HANDEL, +WIARYGODNOSC), kazdy ID raz.
EXPECTED = {
    "BUILDING_PN_FACTOR", "BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE",
    "BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE", "TREATY_DURATION_MULTIPLIER_ACTIONS",
    "TREATY_DURATION_UNLIMITED_MULT", "TREATY_DURATION_MIN_TURNS", "TREATY_DURATION_MAX_TURNS",
    "TREATY_DURATION_TURNS_PER_DOUBLING", "TREATY_DURATION_GEOMETRIC_BASE",
    "AI_DIPLOMACY_GENEROSITY_GOLD_MULT", "SISTER_ALLIANCE_THRESHOLD_SCALE",
    "HANDEL_WILLINGNESS_EASE_MAX_PCT", "HANDEL_WILLINGNESS_PENALTY_MAX_PCT",
    "WIARYGODNOSC_TEMPO_AMPLITUDA", "WIARYGODNOSC_ZAUFANIE_DRYF_NA_100",
}
if set(rows) != EXPECTED or len(table["wiersze"]) != len(EXPECTED):
    mismatches.append(f"KOMPLETNOSC: brak={EXPECTED - set(rows)} nadmiar={set(rows) - EXPECTED}")

# 1. Klasa b: web (uruchomiony) vs tabela vs literal zrodlowy.
catalog_src = src("gra/src/game/diplomacy-value-catalog.ts")
economy_src = src("gra/src/game/diplomacy-economy.ts")
diplo_src = src("gra/src/game/diplomacy.ts")
give_lit = literal_object(catalog_src, "BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE")
recv_lit = literal_object(catalog_src, "BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE")
gen_lit = literal_object(economy_src, "AI_DIPLOMACY_GENEROSITY_GOLD_MULT")
sis_lit = literal_object(diplo_src, "SISTER_ALLIANCE_THRESHOLD_SCALE")

for key in ("easy", "normal", "hard"):
    t = rows["BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE"]["wartosci_po_trudnosci"][key]
    check(f"GIVE[{key}] tabela-vs-web", t, web["basket_give"][key])
    check(f"GIVE[{key}] tabela-vs-literal", t, give_lit[key])
    t = rows["BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE"]["wartosci_po_trudnosci"][key]
    check(f"RECEIVE[{key}] tabela-vs-web", t, web["basket_receive"][key])
    check(f"RECEIVE[{key}] tabela-vs-literal", t, recv_lit[key])
    t = rows["AI_DIPLOMACY_GENEROSITY_GOLD_MULT"]["wartosci_po_trudnosci"][key]
    check(f"GENEROSITY[{key}] tabela-vs-web", t, web["generosity"][key])
    check(f"GENEROSITY[{key}] tabela-vs-literal", t, gen_lit[key])

for key in ("low", "normal", "strong"):
    t = rows["SISTER_ALLIANCE_THRESHOLD_SCALE"]["wartosci_po_stanie"][key]
    check(f"SISTER[{key}] tabela-vs-web", t, web["sister"][key])
    check(f"SISTER[{key}] tabela-vs-literal", t, sis_lit[key])

# 2. Koszyk: rola strony (give/receive x proposer) -> tabela GIVE lub RECEIVE.
for entry in web["basket_side_fn"]:
    sells = (entry["side"] == "give" and entry["proposer"] == 0) or (
        entry["side"] == "receive" and entry["proposer"] == 1
    )
    row = "BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE" if sells else "BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE"
    check(
        f"basketSide {entry['side']}/p{entry['proposer']}/{entry['difficulty']}",
        rows[row]["wartosci_po_trudnosci"][entry["difficulty"]],
        entry["mnoznik"],
    )

# 3. Czas traktatu: formula z tabeli vs uruchomiony web; zbior akcji z literalu zrodlowego.
proposals_src = src("gra/src/game/diplomacy-proposals.ts")
set_m = re.search(r"const TREATY_DURATION_MULTIPLIER_ACTIONS[^=]*=\s*new Set<string>\(\[(.*?)\]\)", proposals_src, re.S)
if not set_m:
    mismatches.append("BRAK literalu TREATY_DURATION_MULTIPLIER_ACTIONS")
    web_set = set()
else:
    web_set = set(re.findall(r"'([a-z_]+)'", set_m.group(1)))
nl_set = set(rows["TREATY_DURATION_MULTIPLIER_ACTIONS"]["zbior"])
if web_set != nl_set:
    mismatches.append(f"ZBIOR NL: tabela={sorted(nl_set)} web-literal={sorted(web_set)}")

u = rows["TREATY_DURATION_UNLIMITED_MULT"]["wartosc"]
lo = rows["TREATY_DURATION_MIN_TURNS"]["wartosc"]
hi = rows["TREATY_DURATION_MAX_TURNS"]["wartosc"]
per = rows["TREATY_DURATION_TURNS_PER_DOUBLING"]["wartosc"]
base = rows["TREATY_DURATION_GEOMETRIC_BASE"]["wartosc"]
# Literaly w zrodle (niezalezny odczyt): return 8; clamp(raw ?? 10, 10, 20); pow(2, (turns - 10) / 5)
if not re.search(rf"raw != null && raw <= 0\) return {int(u)};", proposals_src):
    mismatches.append("LITERAL unlimited nie zgadza sie ze zrodlem")
if not re.search(rf"clamp\(raw \?\? 10, {int(lo)}, {int(hi)}\)", proposals_src):
    mismatches.append("LITERAL clamp nie zgadza sie ze zrodlem")
if not re.search(rf"Math\.pow\({int(base)}, \(turns - {int(lo)}\) / {int(per)}\)", proposals_src):
    mismatches.append("LITERAL pow/divisor nie zgadza sie ze zrodlem")


def formula(turns, action_in_set):
    if not action_in_set:
        return 1.0
    if turns is None:
        return 1.0
    if turns <= 0:
        return u
    t = min(max(turns, lo), hi)
    return base ** ((t - lo) / per)


for probe in web["treaty_probe"]:
    turns = probe["turns"]
    in_set = probe["action"] in web_set
    check(f"treaty {probe['action']}/{turns}", formula(turns, in_set), probe["mnoznik"])

# 4. Budynek: diplomacyPnBudynek = round(kosztBudowy * factor^(poziom-1)); factor z literalu 1.1 i z danych.
bld = json.load(open(f"{root}/gra/data/buildings.json", encoding="utf-8"))
rec = next(b for b in (bld if isinstance(bld, list) else bld.get("budynki", [])) if b.get("id") == "targowisko")
koszt = rec["kosztBudowy"]
fac_src = re.search(r"const BUILDING_PN_FACTOR = ([0-9.]+);", catalog_src)
fac = float(fac_src.group(1)) if fac_src else None
check("BUILDING_PN_FACTOR literal vs tabela", rows["BUILDING_PN_FACTOR"]["wartosc"], fac)
for lvl, got in ((1, web["building_pn"]["poziom1"]), (2, web["building_pn"]["poziom2"])):
    want = math.floor(koszt * fac ** (lvl - 1) + 0.5)
    check(f"diplomacyPnBudynek targowisko lvl{lvl}", got, want)

# 4b. Runda 5 (literaly zrodlowe, pin edb8fb56).
hw = src("gra/src/game/diplomacy-proposals.ts")
for cname, rid in (("HANDEL_WILLINGNESS_EASE_MAX_PCT", "HANDEL_WILLINGNESS_EASE_MAX_PCT"),
                   ("HANDEL_WILLINGNESS_PENALTY_MAX_PCT", "HANDEL_WILLINGNESS_PENALTY_MAX_PCT")):
    m = re.search(rf"const {cname} = ([0-9.]+);", hw)
    check(f"{rid} literal", rows[rid]["wartosc"], float(m.group(1)) if m else None)
dip_json = json.load(open(f"{root}/gra/data/diplomacy.json", encoding="utf-8"))
check("WIARYGODNOSC_TEMPO_AMPLITUDA json", rows["WIARYGODNOSC_TEMPO_AMPLITUDA"]["wartosc"],
      dip_json["params"]["wiarygodnoscTempoAmplituda"])
check("WIARYGODNOSC_ZAUFANIE_DRYF_NA_100 json", rows["WIARYGODNOSC_ZAUFANIE_DRYF_NA_100"]["wartosc"],
      dip_json["params"]["wiarygodnoscZaufanieDryfNa100"])

# 5. Kazde plik:linia z tabeli wskazuje istniejacy, niepusty wiersz zrodla.
for row in table["wiersze"]:
    m = re.match(r"(gra/src/[^:]+):(\d+)", row["definicja_web"])
    if not m:
        mismatches.append(f"BRAK plik:linia w definicja_web {row['id']}")
        continue
    lines = src(m.group(1)).split("\n")
    if not (0 < int(m.group(2)) <= len(lines)) or not lines[int(m.group(2)) - 1].strip():
        mismatches.append(f"LINIA {row['definicja_web']} pusta lub poza plikiem")

print(f"sprawdzono wierszy: {len(table['wiersze'])} z {len(EXPECTED)}")
print(f"LICZBA ROZBIEZNOSCI: {len(mismatches)}")
for item in mismatches:
    print(" - " + item)
sys.exit(1 if mismatches else 0)
