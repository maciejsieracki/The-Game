#!/usr/bin/env python3
"""Ponowna weryfikacja plik:linia pozycji ETAP 3 + test kompletnosci inwentarza.

Uzycie: python3 -I check-etap3.py <korzen_wyeksportowany_z_git_archive>
(1) Kazda pozycja ETAP 3 z listy ETAP3 ma plik:linia; w tej linii musi wystepowac ID.
(2) Kompletnosc: regex z Zalacznika D (P3-22 runda 2 uzywa tego samego wzorca, rozszerzonego
    o RATIO/PROG i BONUS) uruchomiony na gra/src; kazdy trafiony identyfikator musi byc
    w liscie ROZWINIETE/ETAP3/BEZ MECHANIKI/NIE-LICZBA/POZA ZAKRESEM (zbior ponizej),
    inaczej raport 'NIEOBJETE'.
Wynik: liczba bledow (0 = OK).
"""
import os
import re
import sys

root = sys.argv[1]
src = os.path.join(root, "gra", "src")

# (ID, plik, linia) - pozycje ETAP 3 (kazda ma klase i plik:linia w dokumencie).
ETAP3 = [
    ("AI_MAJOR_EARLY_ECON_BUILDING_MULT", "gra/src/game/ai.ts", 1265),
    ("TERYTORIUM_MNOZNIK", "gra/src/game/ai.ts", 4568),
    ("CIV_MATRIX_GROWTH_DIFFICULTY_MULT", "gra/src/game/population-growth-v85.ts", 92),
    ("VILLAGE_GOLD_ERA_MULT", "gra/src/game/villageRewards.ts", 42),
    ("VILLAGE_TECH_ERA_MULT", "gra/src/game/villageRewards.ts", 48),
    ("TREATY_DURATION_MULTIPLIER_ACTIONS", "gra/src/game/diplomacy-proposals.ts", 595),
    ("AI_DIPLOMACY_GENEROSITY_GOLD_MULT", "gra/src/game/diplomacy-economy.ts", 164),
    ("HILL_DEFENSE_MULT", "gra/src/game/siege.ts", 118),
    ("MOUNTAIN_DEFENSE_MULT", "gra/src/game/siege.ts", 124),
    ("COUNTER_MULT", "gra/src/game/combat.ts", 20),
    ("EMBARK_DEFENSE_MULT", "gra/src/game/embarkation.ts", 28),
    ("ROAD_MOVE_SPEED_MULT", "gra/src/map/road-movement.ts", 14),
    ("ROAD_BRUK_MOVE_SPEED_MULT", "gra/src/map/road-movement.ts", 29),
    ("RESOURCE_BASELINE_RARITY_MULT", "gra/src/map/newGameMapDefaults.ts", 419),
    ("RELIEF_OVERFLOW_CAP_MULT", "gra/src/map/gen-helpers.ts", 2181),
    ("MOUNTAIN_RANGE_REGROW_TARGET_MULT", "gra/src/map/gen-helpers.ts", 2480),
    ("RIVER_SCALE_BY_SIZE", "gra/src/map/newGameMapDefaults.ts", 255),
    ("FALLBACK_RESOURCE_MULT", "gra/src/data/map-gen-params-loader.ts", 21),
    ("FALLBACK_RIVER_SCALE", "gra/src/data/map-gen-params-loader.ts", 24),
    ("BROD_RUCH_MULT", "gra/src/battle/battleScene.ts", 918),
    ("MORALE_HIT_LOSS_SCALE", "gra/src/battle/battleScene.ts", 1050),
    ("MORALE_ARMY_COLLAPSE_MULT", "gra/src/battle/battleScene.ts", 1071),
    ("MORALE_ARMY_COLLAPSE_RATIO", "gra/src/battle/battleScene.ts", 1070),
    ("SISTER_ALLIANCE_THRESHOLD_SCALE", "gra/src/game/diplomacy.ts", 702),
    ("FALLBACK_SOCIETY_SCALE", "gra/src/game/society-breakdown.ts", 399),
    ("FORTIFY_OBRONA_BONUS", "gra/src/game/siege.ts", 131),
    ("VETERAN_BONUS_FRAC", "gra/src/game/veteran.ts", 71),
    ("BUILDING_PN_FACTOR", "gra/src/game/diplomacy-value-catalog.ts", 35),
    ("BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE", "gra/src/game/diplomacy-value-catalog.ts", 136),
    ("BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE", "gra/src/game/diplomacy-value-catalog.ts", 146),
    ("SIEGE_AI_T1_ASSAULT_RATIO", "gra/src/game/siegeAi.ts", 37),
    ("SIEGE_AI_T2_BUILD_MIN_RATIO", "gra/src/game/siegeAi.ts", 43),
    ("SIEGE_AI_T3_STARVE_MIN_RATIO", "gra/src/game/siegeAi.ts", 46),
    ("AI_MAJOR_ABSORB_POWER_RATIO_MIN", "gra/src/game/ai-major-absorb.ts", 10),
    ("BARBARIAN_COOPERATION_RADIUS", "gra/src/game/diplomacy-barbarian-cooperation.ts", 10),
    ("BARBARIAN_COOPERATION_TURNS", "gra/src/game/diplomacy-barbarian-cooperation.ts", 21),
    ("BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS", "gra/src/game/diplomacy-barbarian-cooperation.ts", 25),
    ("R_STAWKI_KOSZT_MULT", "gra/src/game/r-stawki-strojenie.ts", 6),
    ("GLOBAL_RESEARCH_COST_MULT", "gra/src/game/difficulty-cost.ts", 41),
    ("BROD_BONUS_BRZEG", "gra/src/battle/battleScene.ts", 921),
    ("BROD_KARA_ATAK", "gra/src/battle/battleScene.ts", 919),
    ("BROD_KARA_OBRONA", "gra/src/battle/battleScene.ts", 920),
    ("throughputFallback", "gra/src/game/converters.ts", 56),
    ("SPICHLERZ_DRAIN_CERAMIKA_PER_TURN", "gra/src/game/building-resource-gate.ts", 329),
    ("SPICHLERZ_DRAIN_SOL_PER_TURN", "gra/src/game/building-resource-gate.ts", 332),
    ("DEFAULT_TRADE_ROUTE_INCOME_PARAMS", "gra/src/game/trade-routes.ts", 1541),
    ("DEFAULT_TRADE_ROUTE_PARAMS", "gra/src/game/trade-routes.ts", 173),
    ("DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS", "gra/src/game/trade-routes.ts", 1978),
]

errors = 0
for cid, rel, line_no in ETAP3:
    path = os.path.join(root, rel)
    if not os.path.isfile(path):
        print(f"BLAD {cid}: brak pliku {rel}")
        errors += 1
        continue
    with open(path, encoding="utf-8") as fh:
        lines = fh.read().split("\n")
    # Linia podana w dokumencie albo +/-0: wymagamy ID w tej linii.
    txt = lines[line_no - 1] if line_no - 1 < len(lines) else ""
    if not re.search(r"\b" + re.escape(cid) + r"\b", txt):
        # Dopuszczamy alias/komentarz tylko gdy ID jest w pliku (raport jawny).
        found = [i + 1 for i, l in enumerate(lines) if re.search(r"\b" + re.escape(cid) + r"\b", l)]
        print(f"BLAD {cid}: {rel}:{line_no} nie zawiera ID; ID jest w liniach {found[:6]}")
        errors += 1
    else:
        print(f"OK {cid} {rel}:{line_no}")

# (2) Kompletnosc: identyfikatory z wzorca inwentarza (rozszerzony o BONUS/RATIO/PROG).
pat = re.compile(r"^\s*(export )?const [A-Za-z0-9_]*(MULT|MULTIPLIER|MNOZNIK|FACTOR|SCALE|RATIO|BONUS|PROD|FALA)[A-Za-z0-9_]*\s*[:=]")
known = {c for c, _, _ in ETAP3}
known |= {
    "TRADE_ROUTE_INTERNATIONAL_MULTIPLIER", "TRADE_ROUTE_INCOME_HALF_DIVISOR", "FALLBACK_TRADE_MULT",
    "TRADE_ROUTE_BUILDING_BONUS_RATE", "PORT_SEA_TRADE_BONUS_PIENIADZ", "MNOZNIK_HANDEL_TRUDNOSC_DELTA",
    "BLOCKED_COMBAT_MULTIPLIER", "PIENIADZ_MNOZNIK", "TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS",
    "GLOBAL_BUILDING_PROD_MULT", "BUILDING_GOLD_PURCHASE_MULT", "ROAD_ARM_WIDTH_RATIO",
    "ROAD_NODE_RADIUS_RATIO", "FARMA_POTENTIAL_FOOD_BONUS", "TRADE_ROUTE_BUILDING_BONUS_RATE",
    "AI_ONESHOT_GIFT_GOLD_MULT", "AI_DIFFICULTY_BONUS_UNIT_TYPE", "AI_MAJOR_WALL_THREAT_BONUS",
    "AI_MAJOR_WALL_BORDER_BONUS", "AI_MAJOR_GRANARY_PRIORITY_BONUS_WEAK",
    "AI_MAJOR_GRANARY_PRIORITY_BONUS_STRONG", "ARMY_CONCENTRATION_MIN_UNITS",
    "ARMY_CONCENTRATION_RADIUS", "ARMY_FRONT_SEPARATION_RADIUS", "DEFAULT_MIN_RATIO_HONOR",
    "DEFAULT_MIN_RATIO_HONOR_PEACEFUL", "DIPLO_FACTOR_LABELS_PL", "IMPROVEMENT_MULTI_TECH_REQ",
    "MUR_BONUS_PROC", "CYTADELA_BONUS_PROC", "BASZTA_BONUS_PROC", "PALISADA_BONUS_PROC",
    "ZERO_BUILDING_COMBAT_BONUS", "BARBARIAN_COOPERATION_DURATION_CHOICES",
    "BARBARIAN_COOPERATION_DURATION_CHOICES", "SIEGE_AI_T1_ASSAULT_RATIO",
    "AI_MAJOR_ABSORB_POWER_RATIO_MIN", "MNOZNIK_HANDEL_TRUDNOSC_DELTA",
    "R_STAWKI_FALA2_MULT", "R_STAWKI_FALA1_FALA2_MULT", "PORT_SEA_TRADE_BONUS_PIENIADZ",
    "TRADE_ROUTE_BUILDING_BONUS_RATE", "TERYTORIUM_MNOZNIK", "VETERAN_BONUS_FRAC",
    "MORALE_ARMY_COLLAPSE_RATIO", "AI_TRADE_GOLD_MAX",
    "RIVER_BONUS", "FOREST_BONUS", "ERA_SCALED_RESOURCE_IMPROVEMENTS", "PRODUCTION_DATA",
    "SCALES", "BONUS_LABEL", "WONDER_PROD_PREFIX", "AUTO_RATION_EVENT_COPY", "MAX_SCALE", "MIN_SCALE",
    "UNIT_CARD_ZOOM_LIFT_PER_SCALE_PX", "STARVING_SKULL_SCALE",
}
# Warstwa prezentacji (render/ui/wonderpreview) = NIE-BALANS wg P3-19 R4.4, poza inwentarzem.
PREZ = ("gra/src/render/", "gra/src/ui/", "gra/src/wonderpreview/")
hits = {}
for dp, _, fns in os.walk(src):
    for fn in fns:
        if not fn.endswith(".ts") or ".test." in fn:
            continue
        full = os.path.join(dp, fn)
        rel = os.path.relpath(full, root).replace(os.sep, "/")
        with open(full, encoding="utf-8") as fh:
            for i, l in enumerate(fh, 1):
                if pat.search(l):
                    name = re.search(r"const\s+([A-Za-z0-9_]+)", l).group(1)
                    hits.setdefault(name, []).append(f"{rel}:{i}")
nieobjete = sorted(n for n in hits if n not in known and not all(h.startswith(PREZ) for h in hits[n]))
prezentacja = sorted(n for n in hits if n not in known and all(h.startswith(PREZ) for h in hits[n]))
print(f"INWENTARZ: trafionych identyfikatorow = {len(hits)}; poza lista dokumentu (bez prezentacji) = {len(nieobjete)}; prezentacja NIE-BALANS = {len(prezentacja)}")
for n in nieobjete:
    print(f"NIEOBJETE {n} {hits[n][:3]}")
print(f"LICZBA BLEDOW ETAP3: {errors}")
