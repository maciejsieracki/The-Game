#!/usr/bin/env python3
"""Niezalezny weryfikator grup WALKA/OBLEZENIE i AI (P3-22 etap 2, runda 4).

Uzycie: python3 -I verify-combat-web.py <KORZEN_WEBA_git_archive> <web-combat.json> <combat-ai-multipliers.json> <combat.rs>

Porownuje tabele Rust (rust-port/engine/data/derived/combat-ai-multipliers.json) z:
  (a) wartosciami zaobserwowanymi z URUCHOMIONEGO kodu TS weba (gen-combat-web.mjs);
  (b) JSON weba (combat-params.json, miasto-params.json, terrain-improvements.json) - odczyt niezalezny;
  (c) literalami zrodlowymi TS (regex) dla wierszy ODCZYT_LITERALU (battleScene.ts, ai.ts).
Kontrole strukturalne: kompletnosc ID, status ROZWINIETE wymaga wywolania w combat.rs,
brak literalow mnoznikowych w galeziach podpietych funkcji.
Kazda niezgodnosc = wpis w LICZBA ROZBIEZNOSCI; exit != 0 przy jakiejkolwiek rozbieznosci.
"""
import json
import re
import sys

root, web_json, table_json, combat_rs = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
EPS = 1e-12
mismatches = []


def src(path):
    with open(f"{root}/{path}", encoding="utf-8") as fh:
        return fh.read()


def check(label, got, want):
    if got is None or want is None or abs(float(got) - float(want)) > EPS:
        mismatches.append(f"{label}: tabela={got} wzor={want}")


def literal_const(text, name):
    m = re.search(rf"(?:export )?const {name}\b[^=]*=\s*(-?[0-9]+(?:\.[0-9]+)?)\s*;", text)
    if not m:
        mismatches.append(f"BRAK LITERALU {name}")
        return None
    return float(m.group(1))


web = json.load(open(web_json, encoding="utf-8"))
table = json.load(open(table_json, encoding="utf-8"))
rows = {r["id"]: r for r in table["wiersze"]}
rust = open(combat_rs, encoding="utf-8").read()

# 0. Kompletnosc: 26 wierszy (runda 5 + LAS), kazdy ID raz.
EXPECTED = {
    "HILL_DEFENSE_MULT", "MOUNTAIN_DEFENSE_MULT", "MUR_BONUS_PROC", "CYTADELA_BONUS_PROC",
    "BASZTA_BONUS_PROC", "PALISADA_BONUS_PROC", "FORT_TERENOWY_BONUS_PROC", "POSTERUNEK_BONUS_PROC",
    "FORTIFY_OBRONA_BONUS", "FORTIFY_OBRONA_PROC", "VETERAN_BONUS_FRAC", "EMBARK_DEFENSE_MULT",
    "SIEGE_AI_T1_ASSAULT_RATIO", "SIEGE_AI_T2_BUILD_MIN_RATIO", "SIEGE_AI_T3_STARVE_MIN_RATIO",
    "BROD_RUCH_MULT", "BROD_KARA_ATAK", "BROD_KARA_OBRONA", "BROD_BONUS_BRZEG",
    "MORALE_HIT_LOSS_SCALE", "MORALE_ARMY_COLLAPSE_RATIO", "MORALE_ARMY_COLLAPSE_MULT",
    "AI_MAJOR_EARLY_ECON_BUILDING_MULT", "TERYTORIUM_MNOZNIK", "AI_MAJOR_ABSORB_POWER_RATIO_MIN",
    "LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA",
}
if set(rows) != EXPECTED or len(table["wiersze"]) != len(EXPECTED):
    mismatches.append(f"KOMPLETNOSC: brak={sorted(EXPECTED - set(rows))} nadmiar={sorted(set(rows) - EXPECTED)}")

# 1. Klasa a: tabela vs web (uruchomiony / JSON / literal).
combat_params = web["combat_params"]
check("HILL_DEFENSE_MULT web-run", rows["HILL_DEFENSE_MULT"]["wartosc"], web["siege"]["HILL_DEFENSE_MULT"])
check("MOUNTAIN_DEFENSE_MULT web-run", rows["MOUNTAIN_DEFENSE_MULT"]["wartosc"], web["siege"]["MOUNTAIN_DEFENSE_MULT"])
check("FORTIFY_OBRONA_BONUS web-run", rows["FORTIFY_OBRONA_BONUS"]["wartosc"], web["siege"]["FORTIFY_OBRONA_BONUS"])
check("FORTIFY_OBRONA_PROC json", rows["FORTIFY_OBRONA_PROC"]["wartosc"], combat_params["fortify_obrona_proc"])
check("EMBARK_DEFENSE_MULT web-run", rows["EMBARK_DEFENSE_MULT"]["wartosc"], web["embark_defense_mult"])
for key, rid in (("SIEGE_AI_T1_ASSAULT_RATIO", "SIEGE_AI_T1_ASSAULT_RATIO"),
                 ("SIEGE_AI_T2_BUILD_MIN_RATIO", "SIEGE_AI_T2_BUILD_MIN_RATIO"),
                 ("SIEGE_AI_T3_STARVE_MIN_RATIO", "SIEGE_AI_T3_STARVE_MIN_RATIO")):
    check(f"{rid} web-run", rows[rid]["wartosc"], web["siege_ai"][key])
    json_key = {"SIEGE_AI_T1_ASSAULT_RATIO": "t1_assault_ratio",
                "SIEGE_AI_T2_BUILD_MIN_RATIO": "t2_build_min_ratio",
                "SIEGE_AI_T3_STARVE_MIN_RATIO": "t3_starve_min_ratio"}[rid]
    check(f"{rid} json", rows[rid]["wartosc"], combat_params["siege_ai"][json_key])
check("AI_MAJOR_ABSORB_POWER_RATIO_MIN web-run", rows["AI_MAJOR_ABSORB_POWER_RATIO_MIN"]["wartosc"],
      web["ai_major_absorb_power_ratio_min"])

# Miasto (MUR/CYTADELA/BASZTA/PALISADA): miasto-params.json (JSON) + probki web-run.
miasto = json.load(open(f"{root}/gra/data/miasto-params.json", encoding="utf-8"))
check("MUR json", rows["MUR_BONUS_PROC"]["wartosc"], miasto["bonus_obrona_mur_proc"]["wartosc"])
check("CYTADELA json", rows["CYTADELA_BONUS_PROC"]["wartosc"], miasto["bonus_obrona_cytadela_proc"]["wartosc"])
check("BASZTA json", rows["BASZTA_BONUS_PROC"]["wartosc"], miasto["bonus_obrona_baszta_proc"]["wartosc"])
check("PALISADA json", rows["PALISADA_BONUS_PROC"]["wartosc"], miasto["bonus_obrona_palisada_proc"]["wartosc"])
# Probki cityWallDefenseBonusPercent: niezalezna arytmetyka z tych samych wartosci.
cw = {"mur": rows["MUR_BONUS_PROC"]["wartosc"], "cyt": rows["CYTADELA_BONUS_PROC"]["wartosc"],
      "bas": rows["BASZTA_BONUS_PROC"]["wartosc"], "pal": rows["PALISADA_BONUS_PROC"]["wartosc"]}


def city_formula(ids):
    total = 0.0
    if "mury" in ids or "fort" in ids:
        total += cw["mur"]
        if "fort" in ids:
            total += cw["cyt"]
    elif "palisada" in ids:
        total += cw["pal"]
    if "baszta" in ids:
        total += cw["bas"]
    return total


for probe in web["city_wall_probe"]:
    check(f"cityWall {probe['ids']}", city_formula(probe["ids"]), probe["procent"])

# Fort terenowy / posterunek: terrain-improvements.json (JSON, po id, nie po numerze wiersza).
imps = json.load(open(f"{root}/gra/data/terrain-improvements.json", encoding="utf-8"))
by_id = {k: v for k, v in imps.items() if isinstance(v, dict) and k != "_meta"}
check("FORT_TERENOWY json", rows["FORT_TERENOWY_BONUS_PROC"]["wartosc"], by_id["fort"]["bonus_obrona_proc"])
check("POSTERUNEK json", rows["POSTERUNEK_BONUS_PROC"]["wartosc"], by_id["posterunek"]["bonus_obrona_proc"])

# Weterani: web-run vs tabela (klasa b, klucz = poziom).
for lvl in ("0", "1", "2", "3"):
    check(f"VETERAN[{lvl}] web-run", rows["VETERAN_BONUS_FRAC"]["wartosci_po_stanie"][lvl],
          web["veteran_bonus_frac"][lvl])

# Brod: combat-params.json (JSON) vs tabela.
brod = combat_params["brod"]
check("BROD_RUCH_MULT json", rows["BROD_RUCH_MULT"]["wartosc"], brod["ruchMult"])
check("BROD_KARA_ATAK json", rows["BROD_KARA_ATAK"]["wartosc"], brod["karaAtak"])
check("BROD_KARA_OBRONA json", rows["BROD_KARA_OBRONA"]["wartosc"], brod["karaObrona"])
check("BROD_BONUS_BRZEG json", rows["BROD_BONUS_BRZEG"]["wartosc"], brod["bonusObronaBrzegu"])

# 2. Literaly zrodlowe (ODCZYT_LITERALU): battleScene.ts, ai.ts.
battle = src("gra/src/battle/battleScene.ts")
ai = src("gra/src/game/ai.ts")
check("MORALE_HIT_LOSS_SCALE literal", rows["MORALE_HIT_LOSS_SCALE"]["wartosc"],
      literal_const(battle, "MORALE_HIT_LOSS_SCALE"))
check("MORALE_ARMY_COLLAPSE_RATIO literal", rows["MORALE_ARMY_COLLAPSE_RATIO"]["wartosc"],
      literal_const(battle, "MORALE_ARMY_COLLAPSE_RATIO"))
check("MORALE_ARMY_COLLAPSE_MULT literal", rows["MORALE_ARMY_COLLAPSE_MULT"]["wartosc"],
      literal_const(battle, "MORALE_ARMY_COLLAPSE_MULT"))
check("AI_MAJOR_EARLY_ECON_BUILDING_MULT literal", rows["AI_MAJOR_EARLY_ECON_BUILDING_MULT"]["wartosc"],
      literal_const(ai, "AI_MAJOR_EARLY_ECON_BUILDING_MULT"))
check("TERYTORIUM_MNOZNIK literal", rows["TERYTORIUM_MNOZNIK"]["wartosc"], literal_const(ai, "TERYTORIUM_MNOZNIK"))

# 2b. Runda 5: LAS = web combat.ts:638 literal `isRangedOrCav ? 1.5 : 1.0` (pin edb8fb56).
las_src = src("gra/src/game/combat.ts")
if not re.search(r"return isRangedOrCav \? 1\.5 : 1\.0;", las_src):
    mismatches.append("LITERAL LAS (combat.ts isRangedOrCav ? 1.5 : 1.0) nie znaleziony")
check("LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA literal", rows["LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA"]["wartosc"], 1.5)

# 3. Plik:linia w polu definicja_web istnieje i nie jest pusty (dla kazdego wiersza).
for row in table["wiersze"]:
    m = re.match(r"(gra/(?:src|data)/[^:\s]+):(\d+)", row["definicja_web"])
    if not m:
        mismatches.append(f"BRAK plik:linia {row['id']}")
        continue
    lines = src(m.group(1)).split("\n")
    if not (0 < int(m.group(2)) <= len(lines)) or not lines[int(m.group(2)) - 1].strip():
        mismatches.append(f"LINIA {row['definicja_web']} pusta lub poza plikiem")

# 4. Status Rust: ROZWINIETE tylko gdy combat.rs czyta wiersz; NIEUZYWANE nie moze byc czytane.
used = {"HILL_DEFENSE_MULT", "MOUNTAIN_DEFENSE_MULT", "MUR_BONUS_PROC",
        "FORT_TERENOWY_BONUS_PROC", "POSTERUNEK_BONUS_PROC", "LAS_DEFENSE_MULT_VS_DYSTANS_FLANKA"}
for row in table["wiersze"]:
    rid = row["id"]
    reads = f'combat_ai_multiplier_value("{rid}")' in rust or f'pct("{rid}")' in rust
    if row["status_rust"] == "ROZWINIETE" and (rid not in used or not reads):
        mismatches.append(f"STATUS {rid}: ROZWINIETE bez wywolania w combat.rs")
    if row["status_rust"] == "NIEUZYWANE" and reads:
        mismatches.append(f"STATUS {rid}: NIEUZYWANE, a combat.rs czyta wiersz")
    if row["status_rust"] == "ROZWINIETE" and rid in used and not reads:
        mismatches.append(f"STATUS {rid}: brak odczytu w combat.rs")

# 5. Brak literalow mnoznikowych w galeziach podpietych funkcji combat.rs.
for pat in (r"Terrain::Hills => 1\.5", r"Terrain::Mountain => 1\.75", r"1\.0 \+ if structures\.wall \{ 2\.0", r"Terrain::Forest => 1\.25"):
    if re.search(pat, rust):
        mismatches.append(f"LITERAL w combat.rs: /{pat}/")

print(f"sprawdzono wierszy: {len(table['wiersze'])} z {len(EXPECTED)}")
print(f"LICZBA ROZBIEZNOSCI: {len(mismatches)}")
for item in mismatches:
    print(" - " + item)
sys.exit(1 if mismatches else 0)
