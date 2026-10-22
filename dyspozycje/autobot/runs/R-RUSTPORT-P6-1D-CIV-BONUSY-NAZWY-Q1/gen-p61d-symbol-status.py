#!/usr/bin/env python3
"""Tabela statusow per eksport dla P6.1D (city-names-pool.ts: 23, civ-bonuses.ts: 17).

Parsuje eksporty z plikow weba (pin edb8fb56) i wymaga statusu dla KAZDEGO (brak = blad).
Wynik: TSV (symbols-p61d-r1.tsv) i tabela markdown na stdout (do wklejenia w P6-1D.md).

Uzycie: python3 -I gen-p61d-symbol-status.py <WEB_ROOT> <OUT_TSV>
"""
import re
import sys

WEB_ROOT, OUT_TSV = sys.argv[1], sys.argv[2]
FILES = ["city-names-pool", "civ-bonuses"]
P, D, N = "PORTOWANY", "DANE-JUZ-W-RUST", "NIE-DOTYCZY"

CN = "domain::city_names::"
CB = "domain::civ_bonuses::"
STATUS = {
    ("city-names-pool", "CivsForCityNames"): (N, f"typ wejsciowy bez logiki; Rust {CN}CivForCityNames (struct bez logiki), uzywany w validate/resolve"),
    ("city-names-pool", "CITY_NAMES_POOL_REGULAR_LEN"): (P, f"{CN}city_names_pool_regular_len(); wartosc z data/derived/civ-bonus-city-names.json; wektor constants.regular"),
    ("city-names-pool", "CITY_NAMES_POOL_STATE_LEN"): (P, f"{CN}city_names_pool_state_len(); tabela civ-bonus-city-names.json; wektor constants.state"),
    ("city-names-pool", "CITY_NAMES_POOL_COMMON_LEN"): (P, f"{CN}city_names_pool_common_len() = regularna + panstwa; wektor constants.common"),
    ("city-names-pool", "NAZWY_KLASTRA_LEN"): (P, f"{CN}nazwy_klastra_len(); wektor constants.klastra"),
    ("city-names-pool", "nazwaKlastraAt"): (P, f"{CN}nazwa_klastra_at; wektor cityNames.klastraAt (24)"),
    ("city-names-pool", "CityNamesPoolEntry"): (D, "data::civilizations::CityPool (pola nazwa_pl, miasta_cywilizacji); city-names-pools.json parsowany od P1"),
    ("city-names-pool", "CityNamesPoolsData"): (D, f"data::civilizations::CityNamesPoolsFile; alias {CN}CityNamesPoolsData; odcisk FNV danych == dane wektorow"),
    ("city-names-pool", "rivalPoolIndex"): (P, f"{CN}rival_pool_index; wektor cityNames.rivalIdx (80)"),
    ("city-names-pool", "stateCityNameAt"): (P, f"{CN}state_city_name_at; wektor cityNames.stateAt (128 x 3 warianty used)"),
    ("city-names-pool", "playerCapitalFromPool"): (P, f"{CN}player_capital_from_pool; wektor cityNames.realPick.capital"),
    ("city-names-pool", "clusterRivalFromPool"): (P, f"{CN}cluster_rival_from_pool; wektor cityNames.rivals (128 x 3)"),
    ("city-names-pool", "foreignCapitalFromPool"): (P, f"{CN}foreign_capital_from_pool; wektor cityNames.realPick.foreign"),
    ("city-names-pool", "collectUsedCityNames"): (P, f"{CN}collect_used_city_names; wektor cityNames.collect.byArrays/byArraysShortOwners"),
    ("city-names-pool", "collectUsedCityNamesFromCities"): (P, f"{CN}collect_used_city_names_from_cities; wektor cityNames.collect.byCities"),
    ("city-names-pool", "cityNameWithSuffix"): (P, f"{CN}city_name_with_suffix; wektor cityNames.suffix (48)"),
    ("city-names-pool", "pickNextCityNameFromNames"): (P, f"{CN}pick_next_city_name_from_names; wektor cityNames.pick (50 kolejek syntetycznych)"),
    ("city-names-pool", "pickNextCityName"): (P, f"{CN}pick_next_city_name; wektor cityNames.realPick.nextFb/nextDefault (160)"),
    ("city-names-pool", "pickNextRegularCityName"): (P, f"{CN}pick_next_regular_city_name; wektor cityNames.realPick.regular"),
    ("city-names-pool", "suggestPlayerFoundCityName"): (P, f"{CN}suggest_player_found_city_name; wektor cityNames.suggest"),
    ("city-names-pool", "pickAiFoundCityName"): (P, f"{CN}pick_ai_found_city_name; wektor cityNames.suggest.ai"),
    ("city-names-pool", "validateCityNamesPools"): (P, f"{CN}validate_city_names_pools; wektor cityNames.validate (11 przypadkow + dane weba = 0 bledow)"),
    ("city-names-pool", "resolveStateCityName"): (P, f"{CN}resolve_state_city_name; wektor cityNames.resolve (168)"),
    ("civ-bonuses", "CivBonusEntry"): (N, f"typ danych wpisu bonusu bez logiki; Rust {CB}CivBonusEntry (+ From<&BonusyItem>), wartosc = BonusValue"),
    ("civ-bonuses", "CivBonusUnitShape"): (N, f"typ wejsciowy bez logiki; Rust {CB}CivBonusUnitShape"),
    ("civ-bonuses", "CivCombatContext"): (N, f"typ wejsciowy bez logiki; Rust {CB}CivCombatContext (+ CombatSide); brak pola weba == false/pusty tekst"),
    ("civ-bonuses", "CivStatMultipliers"): (N, f"typ wynikowy bez logiki; Rust {CB}CivStatMultipliers (Default = zera, odpowiednik ONE)"),
    ("civ-bonuses", "unitCombatCategory"): (P, f"{CB}unit_combat_category; wektor unitCategory (174 jednostki) + stripCat (49)"),
    ("civ-bonuses", "unitMatchesCel"): (P, f"{CB}unit_matches_cel; wektor matchesCel (174 x 19 celow)"),
    ("civ-bonuses", "bonusApplies"): (P, f"{CB}bonus_applies; wektor apply.bits + applyEntries (160 kontekstow)"),
    ("civ-bonuses", "civCombatStatMultipliers"): (P, f"{CB}civ_combat_stat_multipliers; wektor apply.mult (1440 zapisow x 160 kontekstow), undefinedMult"),
    ("civ-bonuses", "applyMultiplier"): (P, f"{CB}apply_multiplier; wektor applyMul"),
    ("civ-bonuses", "civMatrixBonusyForCivKey"): (P, f"{CB}civ_matrix_bonusy_for_civ_key; tabele civ-bonus-matrix-specs.json; wektor matrixBonusy (51 kluczy)"),
    ("civ-bonuses", "civMovementMultiplier"): (P, f"{CB}civ_movement_multiplier; grupa ruch z civ-bonus-rules.json; wektor mults.movement"),
    ("civ-bonuses", "civAttackRangeMultiplier"): (P, f"{CB}civ_attack_range_multiplier; wektor mults.range"),
    ("civ-bonuses", "civSiegeAttackMultiplier"): (P, f"{CB}civ_siege_attack_multiplier; wektor mults.siege"),
    ("civ-bonuses", "civWallDefenseMultiplier"): (P, f"{CB}civ_wall_defense_multiplier; wektor mults.wall"),
    ("civ-bonuses", "civBuildingCostDiscount"): (P, f"{CB}civ_building_cost_discount; limit z civ-bonus-rules.json; wektor discount (29 list)"),
    ("civ-bonuses", "buildingCostAfterCivDiscount"): (P, f"{CB}building_cost_after_civ_discount; wektor discount.costs (16 kosztow x 29 list)"),
    ("civ-bonuses", "isCombatModifierBonus"): (P, f"{CB}is_combat_modifier_bonus; wektor combatMod"),
}

rows = []
for f in FILES:
    text = open(f"{WEB_ROOT}/gra/src/game/{f}.ts", encoding="utf8").read()
    syms = []
    for m in re.finditer(r"^export\s+(?:declare\s+)?(const|let|var|function|interface|type|class|enum)\s+(\w+)", text, re.M):
        syms.append((m.group(2), m.group(1)))
    for sym, kind in syms:
        key = (f, sym)
        if key not in STATUS:
            raise SystemExit(f"BRAK STATUSU: {f}.ts {sym}")
        st, why = STATUS[key]
        rows.append((f + ".ts", sym, kind, st, why))
unused = set(STATUS) - {(r[0][:-3], r[1]) for r in rows}
if unused:
    raise SystemExit(f"STATUS DLA NIEISTNIEJACEGO SYMBOLU: {sorted(unused)}")

with open(OUT_TSV, "w", encoding="utf8") as out:
    out.write("plik\tsymbol\trodzaj\tstatus\tdowod\n")
    for r in rows:
        out.write("\t".join(r) + "\n")

counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
print("| plik web | symbol | rodzaj | status | dowod / powod |")
print("|---|---|---|---|---|")
for r in rows:
    print(f"| `{r[0]}` | `{r[1]}` | {r[2]} | {r[3]} | {r[4]} |")
print()
print("RAZEM:", len(rows), counts)
