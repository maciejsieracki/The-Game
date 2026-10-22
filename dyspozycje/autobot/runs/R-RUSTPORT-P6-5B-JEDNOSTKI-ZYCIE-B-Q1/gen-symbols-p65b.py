#!/usr/bin/env python3
"""Tabela symboli P6.5B: KAZDY eksport (i symbol prywatny) dwoch plikow TS (wyciagniety regexem ze zrodel
pinu) ma status PORTOWANY / PORTOWANY-ZAWEZONY / DANE-JUZ-W-RUST / NIE-DOTYCZY / RUNDA-2, odpowiednik
Rust (plik:linia) i test.

Uzycie: gen-symbols-p65b.py <WEB_ROOT> <ENGINE_DIR> > symbols-p65b-r1.tsv
Blad (exit 1), gdy eksport TS nie ma wiersza w mapowaniu albo mapowanie wskazuje symbol, ktorego nie ma
w zrodle / w Rust / w testach.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENGINE = Path(sys.argv[2])
GAME = WEB / "gra" / "src" / "game"
SRC = {
    "rs": (ENGINE / "src" / "domain" / "recruitment.rs", "rust-port/engine/src/domain/recruitment.rs"),
    "cb": (ENGINE / "src" / "domain" / "combat.rs", "rust-port/engine/src/domain/combat.rs"),
    "der": (ENGINE / "src" / "data" / "derived.rs", "rust-port/engine/src/data/derived.rs"),
    "eco": (ENGINE / "src" / "data" / "economy_society.rs", "rust-port/engine/src/data/economy_society.rs"),
}
LINES = {k: p.read_text(encoding="utf-8").splitlines() for k, (p, _) in SRC.items()}
TESTS = "".join((p).read_text(encoding="utf-8") for p in (ENGINE / "tests").glob("p6_5b_*.rs"))

FILES = ["manpower.ts", "unit-building-bonuses.ts"]
EXPORT_RE = re.compile(r"^export (?:default )?(?:async )?(function|const|let|interface|type|class|enum)\s+([A-Za-z0-9_]+)", re.M)
PRIVATE_RE = re.compile(r"^(?:function|const|let|interface|type)\s+([A-Za-z0-9_]+)", re.M)

P = "PORTOWANY"
PZ = "PORTOWANY-ZAWEZONY"
D = "DANE-JUZ-W-RUST"

T_ERA = "p6_5b_manpower::era_table_and_citizen_scalars_match_web"
T_POOL = "p6_5b_manpower::pool_and_cost_scalars_match_web"
T_HEAL = "p6_5b_manpower::heal_cost_and_cap_match_web"
T_REGEN = "p6_5b_manpower::regen_gain_matches_web_including_default_params"
T_RAW = "p6_5b_manpower::raw_param_loaders_match_web"
T_DEF = "p6_5b_manpower::game_default_params_equal_the_running_web_defaults"
T_CIV = "p6_5b_manpower::civ_bonus_multipliers_match_web"
T_CITY = "p6_5b_manpower::city_pool_functions_match_web"
T_SPAWN = "p6_5b_manpower::spawn_and_refund_functions_match_web"
T_EMP = "p6_5b_manpower::empire_totals_match_web"
T_MUT = "p6_5b_manpower::empire_deduct_refund_and_spawn_mutate_like_web"
T_MISC = "p6_5b_manpower::besieged_location_sort_key_sync_and_civilian_match_web"
T_TICK = "p6_5b_replenish::replenishment_matches_web_state_results_and_closure_protocol"
T_NUM = "p6_5b_format::number_to_string_matches_web"
T_POP = "p6_5b_format::population_formats_match_web"
T_LBL = "p6_5b_format::citizen_label_matches_web"
T_LOC = "p6_5b_format::locale_compare_matches_web_for_ascii"
T_BROLE = "p6_5b_bonuses::building_roles_and_real_game_data_match_web"
T_BCITY = "p6_5b_bonuses::city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids"
T_BDEPTH = "p6_5b_bonuses::chain_depth_limit_matches_web"
T_BUNIT = "p6_5b_bonuses::unit_progress_badges_and_fractions_match_web"
T_BGAIN = "p6_5b_bonuses::city_visit_gain_progress_and_hint_match_web"
T_BHINT = "p6_5b_bonuses::gain_hint_text_matches_web_for_arbitrary_gains"
T_BMERGE = "p6_5b_bonuses::stat_multiplier_merge_matches_web"
T_TCONST = "p6_5b_tables::table_constants_equal_the_running_web"
T_TSHAPE = "p6_5b_tables::tables_parse_and_have_the_expected_shape"
T_TCLOSE = "p6_5b_tables::p65a_badge_closures_are_closed_by_the_real_path_badge_port"

LC = "localeCompare (ICU) zawezone do ASCII 0x20-0x7E (zmierzone); reszta NIE_ZMIERZONO"

# nazwa TS -> (status, plik, igla w pliku Rust, test, uwaga)
M = {
    "manpower.ts": {
        "EpokaManpowerRow": (P, "rs", "pub struct EpokaManpowerRow", T_ERA, "liczby f64"),
        "CityManpowerSnapshot": (P, "rs", "pub struct CityManpowerSnapshot", T_CITY, ""),
        "ManpowerRegenParams": (P, "rs", "pub struct ManpowerRegenParams", T_REGEN, "domyslne = ManpowerRegenParams::default_params() z manpower-params.json"),
        "ManpowerDifficulty": (P, "rs", "pub enum ManpowerDifficulty", T_RAW, ""),
        "ManpowerReplenishParams": (P, "rs", "pub struct ManpowerReplenishParams", T_RAW, ""),
        "loadManpowerReplenishParams": (P, "rs", "pub fn load_manpower_replenish_params", T_RAW + " + " + T_DEF, "surowy miasto-params jako MiastoManpowerRaw (wartosci nie-liczbowe = None); raw=None to domyslny argument weba (prawdziwy plik)"),
        "ManpowerHealUnit": (P, "rs", "pub struct ManpowerHealUnit", T_TICK, ""),
        "syncLiveUnitHp": (P, "rs", "pub fn sync_live_unit_hp", T_MISC, ""),
        "isUnitInBesiegedLocation": (P, "rs", "pub fn is_unit_in_besieged_location", T_MISC, "argumenty rozwiniete: owner_id, q, r"),
        "replenishmentUnitSortKey": (P, "rs", "pub fn replenishment_unit_sort_key", T_MISC, "klucze 2/0/1 w manpower-params.json"),
        "ManpowerReplenishResult": (P, "rs", "pub struct ManpowerReplenishResult", T_TICK, ""),
        "manpowerHealCapForTurn": (P, "rs", "pub fn manpower_heal_cap_for_turn", T_HEAL, ""),
        "manpowerCostForHeal": (P, "rs", "pub fn manpower_cost_for_heal", T_HEAL, ""),
        "maxAffordableManpowerHeal": (P, "rs", "pub fn max_affordable_manpower_heal", T_HEAL, ""),
        "tickManpowerUnitReplenishment": (PZ, "rs", "pub fn tick_manpower_unit_replenishment", T_TICK, "domkniecia resolveOwnerEra/resolveOwnerBonusy/getMaxHp/onUnitHpChanged to PARAMETRY weba (nie zaleznosci z innych plikow); ZAWEZENIA: getMaxHp zawsze dostaje jednostke (web: opcjonalny arg), " + LC + ", komparatory niespojne (NaN) NIE_ZMIERZONO"),
        "loadManpowerRegenParams": (P, "rs", "pub fn load_manpower_regen_params", T_RAW + " + " + T_DEF, ""),
        "CivBonusPoborLite": (P, "rs", "pub struct CivBonusPoborLite", T_CIV, "wartosc: tylko liczby (typeof) - lista napisow/napis to None"),
        "civManpowerRegenMult": (P, "rs", "pub fn civ_manpower_regen_mult", T_CIV, ""),
        "civManpowerMaxMult": (P, "rs", "pub fn civ_manpower_max_mult", T_CIV, ""),
        "civManpowerMults": (P, "rs", "pub fn civ_manpower_mults", T_CIV, "krotka (regenMult, maxMult)"),
        "manpowerRegenGain": (P, "rs", "pub fn manpower_regen_gain", T_REGEN, ""),
        "tickManpowerRegen": (P, "rs", "pub fn tick_manpower_regen", T_CITY, ""),
        "epokaManpowerRow": (P, "rs", "pub fn epoka_manpower_row", T_ERA, ""),
        "clampLudki": (P, "rs", "pub fn clamp_ludki", T_ERA, ""),
        "cityLudnoscAbsolutna": (P, "rs", "pub fn city_ludnosc_absolutna", T_ERA, ""),
        "formatObywateleLabel": (P, "rs", "pub fn format_obywatele_label", T_LBL, "Number#toString: js_number_to_string"),
        "cityManpowerMax": (P, "rs", "pub fn city_manpower_max", T_POOL, ""),
        "SCOUT_TYPE_ID": (P, "der", "pub scout_type_id", T_TCONST, "manpower-params.json"),
        "isScoutTypeId": (P, "rs", "pub fn is_scout_type_id", T_POOL, ""),
        "unitManpowerCost": (P, "rs", "pub fn unit_manpower_cost", T_POOL, ""),
        "unitManpowerCostForType": (P, "rs", "pub fn unit_manpower_cost_for_type", T_POOL, ""),
        "cityManpowerCurrent": (P, "rs", "pub fn city_manpower_current", T_CITY, ""),
        "EmpirePoborTotals": (P, "rs", "pub struct EmpirePoborTotals", T_EMP, ""),
        "empireSumaLudkow": (P, "rs", "pub fn empire_suma_ludkow", T_EMP, ""),
        "rekrutUnitEquivalents": (P, "rs", "pub fn rekrut_unit_equivalents", T_POOL, ""),
        "empirePoborTotals": (P, "rs", "pub fn empire_pobor_totals", T_EMP, ""),
        "cityManpowerSnapshot": (P, "rs", "pub fn city_manpower_snapshot", T_CITY, "parametry odnowy z prawdziwego miasto-params.json (jak web)"),
        "canAffordUnitManpower": (P, "rs", "pub fn can_afford_unit_manpower", T_CITY, ""),
        "empireManpowerCurrent": (P, "rs", "pub fn empire_manpower_current", T_EMP, ""),
        "deductManpowerFromEmpire": (PZ, "rs", "pub fn deduct_manpower_from_empire", T_MUT, "mutuje miasta; " + LC),
        "refundManpowerToEmpire": (PZ, "rs", "pub fn refund_manpower_to_empire", T_MUT, "mutuje miasta; " + LC),
        "canAffordUnitManpowerEmpire": (P, "rs", "pub fn can_afford_unit_manpower_empire", T_EMP, "_recruitingCity/_popCost nieuzywane jak w webie"),
        "tryDeductUnitSpawnCostsEmpire": (PZ, "rs", "pub fn try_deduct_unit_spawn_costs_empire", T_MUT, "mutuje miasta; " + LC),
        "UnitSpawnBlockReason": (P, "rs", "pub enum UnitSpawnBlockReason", T_SPAWN, "napisy powodow w manpower-params.json"),
        "UnitSpawnDeduction": (P, "rs", "pub struct UnitSpawnDeduction", T_SPAWN, ""),
        "tryDeductUnitSpawnCosts": (P, "rs", "pub fn try_deduct_unit_spawn_costs", T_SPAWN, ""),
        "refundUnitSpawnToCity": (P, "rs", "pub fn refund_unit_spawn_to_city", T_SPAWN, "domyslny popCost=1: default_refund_pop_cost()"),
        "refreshManpowerAfterPopChange": (P, "rs", "pub fn refresh_manpower_after_pop_change", T_CITY, ""),
        "spendManpower": (P, "rs", "pub fn spend_manpower", T_CITY, ""),
        "formatPopulationAbs": (P, "rs", "pub fn format_population_abs", T_POP, "Number#toString: js_number_to_string (wlacznie z remisami najkrotszej reprezentacji)"),
        "formatManpower": (P, "rs", "pub fn format_manpower", T_POP, ""),
        "allEpokaManpowerRows": (D, "rs", "pub fn all_epoka_manpower_rows", T_TCONST, "tabela epok z data/epoka-ludnosc-manpower.json (economy_society.rs, identyczna z pinem: kopia danych weba w weryfikatorze)"),
    },
    "unit-building-bonuses.ts": {
        "MnoznikBuildingLookup": (P, "cb", "pub struct MnoznikBuildingLookup", T_BCITY, "baza.mnoznik splaszczone do baza_mnoznik: Option<f64>"),
        "ARMOR_BUILDING_IDS": (P, "cb", "pub fn armor_building_ids", T_TCONST, "unit-building-bonuses.json"),
        "SOFT_STAT_BUILDING_IDS": (P, "cb", "pub fn soft_stat_building_ids", T_TCONST, "unit-building-bonuses.json"),
        "mnoznikRoleForBuildingId": (P, "cb", "pub fn mnoznik_role_for_building_id", T_BROLE, ""),
        "cityArmorBonusPercent": (P, "cb", "pub fn city_armor_bonus_percent", T_BCITY + " + " + T_BROLE, "w tym prawdziwe dane gry (buildings.json)"),
        "citySoftStatBonusPercent": (P, "cb", "pub fn city_soft_stat_bonus_percent", T_BCITY + " + " + T_BROLE, ""),
        "cumulativeMnoznikForBuildingId": (P, "cb", "pub fn cumulative_mnoznik_for_building_id", T_BCITY + " + " + T_BDEPTH, ""),
        "UnitBuildingProgress": (P, "cb", "pub struct UnitBuildingProgress", T_BUNIT, "pola nie-liczbowe = None"),
        "unitPancerzBonusProc": (P, "cb", "pub fn unit_pancerz_bonus_proc", T_BUNIT, ""),
        "unitParametryBonusProc": (P, "cb", "pub fn unit_parametry_bonus_proc", T_BUNIT, ""),
        "UnitPathBadgeLevel": (P, "cb", "pub type UnitPathBadgeLevel", T_BUNIT, "u8 0-3"),
        "ARMOR_PATH_MAX_PP": (P, "cb", "pub fn armor_path_max_pp", T_TCONST, "unit-building-bonuses.json"),
        "SOFT_PATH_MAX_PP": (P, "cb", "pub fn soft_path_max_pp", T_TCONST, "unit-building-bonuses.json"),
        "ARMOR_PATH_LEVEL_MAX_PP": (P, "cb", "pub fn armor_path_level_max_pp", T_TCONST, "wyliczane z max_pp i liczba_tercji"),
        "SOFT_PATH_LEVEL_MAX_PP": (P, "cb", "pub fn soft_path_level_max_pp", T_TCONST, "wyliczane z max_pp i liczba_tercji"),
        "armorPathBadgeLevel": (P, "cb", "pub fn armor_path_badge_level", T_BUNIT + " + " + T_TCLOSE, "zamyka domkniecie wstrzykniete w P6.5A (stackArmorBadgeLevel)"),
        "softPathBadgeLevel": (P, "cb", "pub fn soft_path_badge_level", T_BUNIT + " + " + T_TCLOSE, "zamyka domkniecie wstrzykniete w P6.5A (stackSoftBadgeLevel)"),
        "unitPancerzBonusFrac": (P, "cb", "pub fn unit_pancerz_bonus_frac", T_BUNIT, ""),
        "unitParametryBonusFrac": (P, "cb", "pub fn unit_parametry_bonus_frac", T_BUNIT, ""),
        "bestBuildingProgressAfterCityVisit": (P, "cb", "pub fn best_building_progress_after_city_visit", T_BGAIN, ""),
        "buildingProgressWouldChange": (P, "cb", "pub fn building_progress_would_change", T_BGAIN, ""),
        "BuildingBonusGain": (P, "cb", "pub struct BuildingBonusGain", T_BGAIN, ""),
        "applyCityVisitBonusGain": (P, "cb", "pub fn apply_city_visit_bonus_gain", T_BGAIN, "mutuje pola procentowe"),
        "formatBuildingBonusGainHint": (P, "cb", "pub fn format_building_bonus_gain_hint", T_BGAIN + " + " + T_BHINT, "szablony w unit-building-bonuses.json; podstawianie jednoprzebiegowe"),
        "unitBuildingBonusLabel": (P, "cb", "pub fn unit_building_bonus_label", T_BUNIT, ""),
        "PathBadgeLevel": (P, "cb", "pub type PathBadgeLevel", T_BUNIT, "alias zgodnosci"),
        "PATH_A_MAX_PP": (P, "cb", "pub fn path_a_max_pp", T_TCONST, "alias"),
        "PATH_B_MAX_PP": (P, "cb", "pub fn path_b_max_pp", T_TCONST, "alias"),
        "BuildingCombatBonus": (P, "cb", "pub struct BuildingCombatBonus", T_BUNIT, ""),
        "ZERO_BUILDING_COMBAT_BONUS": (P, "cb", "pub const ZERO_BUILDING_COMBAT_BONUS", T_TCONST, ""),
        "buildingCombatBonusForUnit": (P, "cb", "pub fn building_combat_bonus_for_unit", T_BUNIT, ""),
        "StatMultipliersLike": (PZ, "cb", "pub struct StatMultipliersLike", T_BMERGE, "ZAWEZENIE: web generyczny (T extends StatMultipliersLike), Rust dokladnie 6 pol"),
        "mergeBuildingBonusIntoStatMultipliers": (PZ, "cb", "pub fn merge_building_bonus_into_stat_multipliers", T_BMERGE, "zwraca &mut do tej samej struktury (web: ten sam obiekt - wektor `same`)"),
    },
}
PRIV = {
    "manpower.ts": {
        "ROWS": (D, "rs", "pub fn all_epoka_manpower_rows", T_TCONST, "OnceLock z economy_society::parse_epoka_ludnosc_manpower"),
        "MAX_EPOKA": (P, "der", "pub struct ManpowerEpokaBounds", T_TCONST, "manpower-params.json: epoka.max"),
        "ParamRow": (P, "rs", "pub struct MiastoManpowerRaw", T_RAW, "surowe wartosci miasto-params; prawdziwy plik: MiastoManpowerRaw::game()"),
        "DEFAULT_REGEN": (P, "rs", "pub fn default_params", T_DEF, "manpower-params.json: domyslne_regen"),
        "DEFAULT_REPLENISH_PCT": (P, "der", "pub struct ManpowerDefaultReplenish", T_DEF, "manpower-params.json: domyslne_uzupelnienie_hp_proc"),
        "CityReplenishFields": (P, "rs", "pub struct ManpowerCity", T_TICK, "jeden struktura ManpowerCity (nadzbior pol Pick<City,...>)"),
        "ReplenishmentCandidate": (P, "rs", "pub struct ReplenishmentCandidate", T_TICK, "jednostka jako indeks w liscie"),
        "allocateProportionalReplenishment": (PZ, "rs", "pub fn allocate_proportional_replenishment", T_TICK, "martwy zapis usedMp po inicjalizacji remainingMp pominiety; " + LC),
        "scaledManpower": (P, "rs", "fn scaled_manpower", T_POOL, ""),
        "CityRecruitFields": (P, "rs", "pub struct ManpowerCity", T_MUT, "jak CityReplenishFields"),
    },
    "unit-building-bonuses.ts": {
        "mnoznikOf": (P, "cb", "fn mnoznik_of", T_BCITY, ""),
        "MAX_UPGRADE_CHAIN_DEPTH": (P, "der", "pub max_glebokosc_lancucha", T_BDEPTH, "unit-building-bonuses.json"),
        "chainMnoznikContribution": (P, "cb", "fn chain_mnoznik_contribution", T_BCITY + " + " + T_BDEPTH, "String#trim: is_js_whitespace (U+FEFF tak, U+0085 nie)"),
        "sumMnoznikForPresentBuildings": (P, "cb", "fn sum_mnoznik_for_present_buildings", T_BCITY, ""),
        "pathBadgeLevelFromPp": (P, "cb", "pub fn path_badge_level_from_pp", T_BUNIT, "siatka progow 0.5 pp"),
    },
}
# zaleznosci spoza dwoch plikow, portowane lokalnie
EXTRA = [
    ("gra/src/units/setup.ts", "isCivilianUnit", "function", "PORTOWANY-LOKALNIE", "rs", "pub fn is_civilian_unit", T_MISC + " + p6_5b_tables::civilian_set_is_resolved_from_the_table", "zaleznosc manpower.ts spoza zakresu (units/setup.ts:196); zbiory kategorii/typow w manpower-params.json; wektor z uruchomionego weba (isCivilianUnit)"),
    ("<ECMAScript>", "String.prototype.localeCompare", "builtin", PZ, "rs", "pub fn locale_compare", T_LOC, LC),
    ("<ECMAScript>", "Number.prototype.toString", "builtin", P, "rs", "pub fn js_number_to_string", T_NUM, "wlacznie z dokladnymi remisami najkrotszej reprezentacji (parzysta ostatnia cyfra)"),
]


def find(kind, needle):
    for i, line in enumerate(LINES[kind], 1):
        if needle in line:
            return f"{SRC[kind][1]}:{i}"
    return None


rows, errors = [], []
for fname in FILES:
    text = (GAME / fname).read_text(encoding="utf-8")
    lines = text.splitlines()
    seen = set()
    for kind, name in EXPORT_RE.findall(text):
        seen.add(name)
        if name not in M[fname]:
            errors.append(f"brak mapowania dla eksportu {fname}:{name}")
            continue
        status, rk, needle, test, note = M[fname][name]
        ref = find(rk, needle)
        if ref is None:
            errors.append(f"brak symbolu Rust {needle} dla {name}")
            continue
        for part in test.split(" + "):
            fn = part.split("::")[-1]
            if f"fn {fn}" not in TESTS:
                errors.append(f"brak testu {part} dla {name}")
        line = next(i for i, l in enumerate(lines, 1) if re.match(rf"^export (?:default )?(?:async )?{kind}\s+{name}\b", l))
        rows.append((f"gra/src/game/{fname}:{line}", name, kind, status, ref, test, note))
    for name in PRIVATE_RE.findall(text):
        if name not in PRIV[fname]:
            errors.append(f"brak mapowania dla symbolu prywatnego {fname}:{name}")
            continue
        seen.add(name)
        status, rk, needle, test, note = PRIV[fname][name]
        ref = find(rk, needle)
        if ref is None:
            errors.append(f"brak symbolu Rust {needle} dla {name}")
            continue
        for part in test.split(" + "):
            fn = part.split("::")[-1]
            if f"fn {fn}" not in TESTS:
                errors.append(f"brak testu {part} dla {name}")
        line = next(i for i, l in enumerate(lines, 1) if re.match(rf"^(?:function|const|let|interface|type)\s+{name}\b", l))
        rows.append((f"gra/src/game/{fname}:{line}", name, "prywatny", status, ref, test, note))
    for name in list(M[fname]) + list(PRIV[fname]):
        if name not in seen:
            errors.append(f"mapowanie dla symbolu spoza zrodla: {fname}:{name}")

for src, name, kind, status, rk, needle, test, note in EXTRA:
    ref = find(rk, needle)
    if ref is None:
        errors.append(f"brak symbolu Rust {needle} dla {name}")
        continue
    rows.append((src, name, kind, status, ref, test, note))

print("zrodlo_web\tsymbol\trodzaj\tstatus\todpowiednik_rust\ttest\tuwaga")
for r in rows:
    print("\t".join(c if c else "-" for c in r))
if errors:
    for e in errors:
        print("BLAD:", e, file=sys.stderr)
    sys.exit(1)
counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
print("# podsumowanie:", ", ".join(f"{k}={v}" for k, v in sorted(counts.items())), f"razem={len(rows)}", file=sys.stderr)
