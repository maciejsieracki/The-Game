#!/usr/bin/env python3
"""Tabela symboli P6.7A: kazdy eksport TS (+ symbole prywatne) ma status; weryfikacja istnienia symboli.

Uzycie: gen-symbols-p67a.py <WEB_ROOT> <ENGINE_DIR> <OUT_TSV> <OUT_MD>
Bledy (exit 2): eksport TS bez wiersza, wiersz bez symbolu TS, symbol Rust albo test nie istnieja.
Slownik statusow: PORTOWANY | PORTOWANY-Z-WSTRZYKNIETYMI | DANE-JUZ-W-RUST | NIE-DOTYCZY | RUNDA-2.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1]) / "gra/src/game"
ENG = Path(sys.argv[2])
OUT_TSV = Path(sys.argv[3])
OUT_MD = Path(sys.argv[4])

V = "population-growth-v85.ts"
H = "growth-happiness.ts"
T = "population-growth-tempo.ts"
S = "r-stawki-strojenie.ts"
E = "empire-food.ts"

P, PI, D, N, R2 = "PORTOWANY", "PORTOWANY-Z-WSTRZYKNIETYMI", "DANE-JUZ-W-RUST", "NIE-DOTYCZY", "RUNDA-2"

G = "p6_7a_growth"
TE = "p6_7a_tempo"
EM = "p6_7a_empire"
PC = "p6_7a_post_central"
TB = "p6_7a_tables"

# (plik, symbol TS, status, symbol Rust, test, uwaga)
ROWS = [
    (V, "PoziomRacji", N, "PoziomRacji", "-", "alias typu `number` bez zachowania (runda 2: bylo PORTOWANY bez testu); uzywany w sygnaturach funkcji pokrytych wektorami, np. clampPoziomRacji"),
    (V, "WYZYWIENIE_MIN", P, "wyzywienie_min", f"{G}::constants_match_running_web", "tabela wzrost-ludnosci-params.json::wyzywienie.min"),
    (V, "WYZYWIENIE_MAX", D, "wyzywienie_max", f"{G}::single_source_of_default_level_and_max", "cities-params.json::wejscia_z_innych_modulow_weba (P6.6B); jedno zrodlo"),
    (V, "WYZYWIENIE_STEP", P, "wyzywienie_step", f"{G}::constants_match_running_web", "tabela wyzywienie.krok"),
    (V, "WYZYWIENIE_LEVELS", P, "wyzywienie_levels", f"{G}::constants_match_running_web", "wyliczane z min/max/krok jak w webie"),
    (V, "WYZYWIENIE_GROWTH_PCT", P, "ration_growth_percent", f"{G}::ration_helpers_match_web", "tabela wyzywienie.wzrost_proc"),
    (V, "DEFAULT_POZIOM_RACJI", D, "default_poziom_racji", f"{G}::single_source_of_default_level_and_max", "cities-params.json (P6.6B); jedno zrodlo"),
    (V, "RationParams", P, "RationParams", f"{G}::build_params_match_web", "struktura"),
    (V, "CIV_MATRIX_GROWTH_DIFFICULTY_MULT", P, "civ_matrix_growth_difficulty_mult", f"{G}::constants_match_running_web", "tabela trudnosc_mnoznik_macierzy (P3-22 poz. 35b)"),
    (V, "civMatrixGrowthDifficultyMultiplier", P, "civ_matrix_growth_difficulty_multiplier", f"{G}::difficulty_multiplier_matches_web", ""),
    (V, "PopulationMatrixResolved", P, "PopulationMatrixResolved", f"{G}::population_matrix_matches_web", "struktura"),
    (V, "resolvePopulationMatrixForCiv", P, "resolve_population_matrix_for_civ", f"{G}::population_matrix_matches_web", "civMatrixParam = civ_matrix::civ_matrix_param (P6.1E)"),
    (V, "buildRationParams", P, "build_ration_params", f"{G}::build_params_match_web", "@deprecated w webie; wartosci zapasowe w tabeli"),
    (V, "clampPoziomRacji", P, "clamp_poziom_racji", f"{G}::ration_helpers_match_web", ""),
    (V, "migrateLegacyRationLevel", P, "migrate_legacy_ration_level", f"{G}::ration_helpers_match_web", "tabela migracja_racji_legacy"),
    (V, "migrateProcentRozwojToPoziomRacji", P, "migrate_procent_rozwoj_to_poziom_racji", f"{G}::ration_helpers_match_web", ""),
    (V, "getCityRationLevel", P, "get_city_ration_level", f"{G}::city_ration_level_matches_web", ""),
    (V, "rationFoodCostPerPop", P, "ration_food_cost_per_pop", f"{G}::ration_helpers_match_web", "zywnosc/mieszkanca z racje.json (P3-19), bez mnoznika w kodzie"),
    (V, "rationGrowthPercent", P, "ration_growth_percent", f"{G}::ration_helpers_match_web", ""),
    (V, "formatWyzwienieLabel", P, "format_wyzwienie_label", f"{G}::ration_helpers_match_web", "js_to_fixed / js_number_to_string"),
    (V, "computeCityRationCost", P, "compute_city_ration_cost", f"{G}::ration_cost_matches_web", "wejscie Spichlerz: spichlerz_ration_food_cost_multiplier"),
    (V, "GrowthPercentBreakdown", P, "GrowthPercentBreakdown", f"{G}::growth_percent_matches_web", "struktura"),
    (V, "GrowthPercentInput", P, "GrowthPercentInput", f"{G}::growth_percent_matches_web", "struktura"),
    (V, "computeGrowthPercentV85", P, "compute_growth_percent_v85", f"{G}::growth_percent_matches_web", ""),
    (V, "FractionalGrowthResult", P, "FractionalGrowthResult", f"{G}::fractional_growth_matches_web", "struktura"),
    (V, "applyFractionalGrowthV85", P, "apply_fractional_growth_v85", f"{G}::fractional_growth_matches_web", "wejscie economy.ts: city_population_cap"),
    (V, "growthGainPerTurnSlots", P, "growth_gain_per_turn_slots", f"{G}::gain_and_turns_match_web", ""),
    (V, "turnsUntilNextCitizen", P, "turns_until_next_citizen", f"{G}::gain_and_turns_match_web", "null -> None"),
    (V, "applyHungerPenaltyV85", P, "apply_hunger_penalty_v85", f"{G}::hunger_penalty_matches_web", ""),
    (V, "ensureCityRationDefaults", P, "ensure_city_ration_defaults", f"{G}::ensure_city_ration_defaults_matches_web", "GrowthCity: pole hungerLossUlamkowy poza City (state.rs)"),
    (V, "CentralFoodFedSnapshot", P, "EmpireFoodTick", f"{PC}::post_central_growth_matches_web", "podzbior EmpireFoodTick (ZAL-3)"),
    (V, "PostCentralGrowthOpts", P, "PostCentralGrowthOpts", f"{PC}::post_central_growth_matches_web", "bez tablic mutowanych (cities, econ, wiersze)"),
    (V, "applyPostCentralPopulationGrowth", PI, "apply_post_central_population_growth", f"{PC}::post_central_growth_matches_web", "wstrzykniete: rebalanceWorkersAfterPopulationChange (okolica.ts), onCityPopulationChanged; manpower z recruitment::manpower (P6.5B)"),
    (V, "ApplyCentralFoodGrowthOpts", P, "PostCentralGrowthOpts", f"{PC}::post_central_growth_matches_web", "Omit<PostCentralGrowthOpts,'efResult'> = ta sama struktura"),
    (V, "applyCentralFoodPopulationGrowth", PI, "apply_central_food_population_growth", f"{PC}::post_central_growth_matches_web", "jak applyPostCentral...; warianty central2 / efAlias w wektorach"),
    (V, "pick", P, "pick", f"{G}::build_params_match_web", "nieeksportowana; wspolna z empire-food.ts"),
    (V, "RawParamRow", N, "-", "-", "typ pomocniczy TS; w Rust surowy serde_json::Value"),
    (V, "Difficulty", N, "GameDifficulty", "-", "alias typu: GameDifficulty = domain::types::Difficulty (ZAL-12)"),
    (H, "computeGrowthHappinessNetto", P, "happiness::compute_growth_happiness_netto", f"{TE}::happiness_matches_web", "argumenty 2-3 swiadomie ignorowane"),
    (T, "WZROST_LUDNOSCI_PACE", P, "tempo::WzrostLudnosciPace::multiplier", f"{TE}::pace_table_matches_web", "tabela tempo_wzrostu"),
    (T, "WzrostLudnosciPace", P, "tempo::WzrostLudnosciPace", f"{TE}::pace_table_matches_web", "enum"),
    (T, "applyGrowthThresholdPace", P, "tempo::apply_growth_threshold_pace", f"{TE}::tempo_threshold_matches_web", ""),
    (S, "R_STAWKI_KOSZT_MULT", P, "r_stawki::r_stawki_koszt_mult", f"{TE}::stawki_constants_and_scalars_match_web", "tabela r_stawki; silnik nie mnozy (P3-19 splaszczyl)"),
    (S, "R_STAWKI_FALA2_MULT", P, "r_stawki::r_stawki_fala2_mult", f"{TE}::stawki_constants_and_scalars_match_web", "j.w."),
    (S, "R_STAWKI_FALA1_FALA2_MULT", P, "r_stawki::r_stawki_fala1_fala2_mult", f"{TE}::stawki_constants_and_scalars_match_web", "iloczyn z tabeli"),
    (S, "normalizeResearchEra", P, "r_stawki::normalize_research_era", f"{TE}::research_era_matches_web", "NFD przez era-diakrytyki.json + algorytm Hangul"),
    (S, "isResearchEraFala2Extra", P, "r_stawki::is_research_era_fala2_extra", f"{TE}::research_era_matches_web", ""),
    (S, "scaleStockCostRecord", P, "r_stawki::scale_stock_cost_record", f"{TE}::stock_cost_record_matches_web", "kolejnosc kluczy zachowana"),
    (S, "scaleImprovementWorkCost", P, "r_stawki::scale_improvement_work_cost", f"{TE}::stawki_constants_and_scalars_match_web", ""),
    (S, "scaledWonderWorkCost", P, "r_stawki::scaled_wonder_work_cost", f"{TE}::stawki_constants_and_scalars_match_web", ""),
    (S, "scaledWonderFoodCost", P, "r_stawki::scaled_wonder_food_cost", f"{TE}::stawki_constants_and_scalars_match_web", ""),
    (S, "stripDiacriticsLower", P, "r_stawki::strip_diacritics_lower", f"{TE}::research_era_matches_web", "nieeksportowana"),
    (E, "EmpireFoodState", P, "EmpireFoodState", f"{EM}::advance_empire_food_matches_web", "struktura"),
    (E, "EmpireFoodParams", P, "EmpireFoodParams", f"{G}::build_params_match_web", "struktura"),
    (E, "EmpireFoodCityRow", P, "EmpireFoodCityRow", f"{EM}::advance_empire_food_matches_web", "struktura"),
    (E, "EmpireFoodTick", P, "EmpireFoodTick", f"{EM}::advance_empire_food_matches_web", "struktura"),
    (E, "EmpireFoodTickResult", P, "EmpireFoodTickResult", f"{EM}::advance_empire_food_matches_web", "byOwner = widok perOwner"),
    (E, "buildEmpireFoodParams", P, "empire_food::build_empire_food_params", f"{G}::build_params_match_web", ""),
    (E, "freshEmpireFoodState", P, "empire_food::fresh_empire_food_state", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", ""),
    (E, "advanceEmpireFood", PI, "empire_food::advance_empire_food", f"{EM}::advance_empire_food_matches_web", "wstrzykniete: militaryFoodConsumptionWithSpichlerz (turn-economy.ts)"),
    (E, "bindEmpireFoodRuntime", P, "EmpireFoodRuntime::get_empire_food_reserve", f"{EM}::advance_empire_food_matches_web", "globalna referencja -> jawny parametr `states` (ZAL-4)"),
    (E, "getEmpireFoodReserve", P, "EmpireFoodRuntime::get_empire_food_reserve", f"{EM}::advance_empire_food_matches_web", ""),
    (E, "getEmpireFoodMaxCap", P, "EmpireFoodRuntime::get_empire_food_max_cap", f"{EM}::advance_empire_food_matches_web", ""),
    (E, "getEmpireFoodSplit", P, "empire_food::get_empire_food_split", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated"),
    (E, "isArmyHungry", P, "EmpireFoodRuntime::is_army_hungry", f"{EM}::advance_empire_food_matches_web", ""),
    (E, "isArmyStarving", P, "EmpireFoodRuntime::is_army_starving", f"{EM}::advance_empire_food_matches_web", ""),
    (E, "getArmyStarvationCountdown", P, "EmpireFoodRuntime::get_army_starvation_countdown", f"{EM}::advance_empire_food_matches_web", "null -> None"),
    (E, "getLastEmpireFoodTick", P, "EmpireFoodRuntime::get_last_empire_food_tick", f"{EM}::advance_empire_food_matches_web", "migawka z chwili advance (ZAL-4)"),
    (E, "_setLastEmpireFoodTicks", P, "EmpireFoodRuntime::set_last_empire_food_ticks", f"{EM}::advance_empire_food_matches_web", ""),
    (E, "clearLastEmpireFoodTicks", P, "EmpireFoodRuntime::clear_last_empire_food_ticks", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", ""),
    (E, "isCityAutoWyzywienieEnabled", P, "empire_food::is_city_auto_wyzywienie_enabled", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "humanOwnerIds domyslnie [0]"),
    (E, "AutoRationCityChange", P, "AutoRationCityChange", f"{EM}::auto_balance_matches_web", "struktura"),
    (E, "AutoRationAdjustResult", P, "AutoRationAdjustResult", f"{EM}::auto_balance_matches_web", "struktura"),
    (E, "computeEmpireCityFoodNadwyzka", P, "empire_food::compute_empire_city_food_nadwyzka", f"{EM}::simulation_helpers_match_web", ""),
    (E, "simulateCityFoodCentralPool", P, "empire_food::simulate_city_food_central_pool", f"{EM}::simulation_helpers_match_web", ""),
    (E, "simulateCityFoodAllFed", P, "empire_food::simulate_city_food_all_fed", f"{EM}::simulation_helpers_match_web", ""),
    (E, "WYZYWIENIE_POZIOM_NA_LIMICIE", P, "empire_food::wyzywienie_poziom_na_limicie", f"{EM}::wyzywienie_poziom_na_limicie_matches_web", "wyliczane z tabeli, nie literal"),
    (E, "EqualGrowthRationPlanOpts", P, "EqualGrowthRationPlanOpts", f"{EM}::equal_growth_plan_matches_web", "struktura bez tablic mutowanych"),
    (E, "EqualGrowthRationPlan", P, "EqualGrowthRationPlan", f"{EM}::equal_growth_plan_matches_web", "struktura"),
    (E, "resolveEqualGrowthRationPlan", P, "empire_food::resolve_equal_growth_ration_plan", f"{EM}::equal_growth_plan_matches_web", "wejscie turn-economy.ts: recompute_city_food_balances_in_econ"),
    (E, "isEmpireCityFoodSolvent", P, "empire_food::is_empire_city_food_solvent", f"{EM}::simulation_helpers_match_web", ""),
    (E, "AutoBalanceRationsOpts", P, "AutoBalanceRationsOpts", f"{EM}::auto_balance_matches_web", "struktura bez tablic mutowanych"),
    (E, "autoBalanceRationsToSolvency", P, "empire_food::auto_balance_rations_to_solvency", f"{EM}::auto_balance_matches_web", ""),
    (E, "AutoRaiseRationsOpts", P, "AutoRaiseRationsOpts", f"{EM}::auto_raise_matches_web", "struktura bez tablic mutowanych"),
    (E, "autoRaiseRationsForGrowth", P, "empire_food::auto_raise_rations_for_growth", f"{EM}::auto_raise_matches_web", ""),
    (E, "maxSafePoziomRacjiForCity", P, "empire_food::max_safe_poziom_racji_for_city", f"{EM}::max_safe_poziom_matches_web", ""),
    (E, "computeEmpireFoodNetDelta", P, "empire_food::compute_empire_food_net_delta", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated"),
    (E, "computeEmpireFoodNetDeltaFromCityFoods", P, "empire_food::compute_empire_food_net_delta_from_city_foods", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated"),
    (E, "computeEmpireFoodMaxCap", P, "empire_food::compute_empire_food_max_cap", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated"),
    (E, "clampFoodSplitPct", P, "empire_food::clamp_food_split_pct", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated"),
    (E, "getCityFoodSplit", P, "empire_food::get_city_food_split", f"{EM}::runtime_clear_and_deprecated_helpers_match_web", "@deprecated; drugi argument weba ignorowany"),
    (E, "applyPostCentralPopulationGrowth", PI, "apply_post_central_population_growth", f"{PC}::post_central_growth_matches_web", "re-eksport z population-growth-v85.ts (empire-food.ts:1070-1074)"),
    (E, "applyCentralFoodPopulationGrowth", PI, "apply_post_central_population_growth", f"{PC}::post_central_growth_matches_web", "w empire-food.ts to ALIAS applyPostCentral... (1 argument `opts` z efResult), NIE wariant 2-argumentowy z v85; wektory 'efAlias'"),
    (E, "ApplyCentralFoodGrowthOpts", P, "PostCentralGrowthOpts", f"{PC}::post_central_growth_matches_web", "re-eksport typu PostCentralGrowthOpts"),
    (E, "countMagazynByOwner", P, "count_magazyn_by_owner", f"{EM}::advance_empire_food_matches_web", "nieeksportowana; dedup tikow (seen)"),
    (E, "computeCentralFoodCap", P, "compute_central_food_cap", f"{EM}::advance_empire_food_matches_web", "nieeksportowana; magazynEraMultiplier jako wejscie"),
    (E, "ownerCitiesForAutoAdjust", P, "owner_cities_for_auto_adjust", f"{EM}::equal_growth_plan_matches_web", "nieeksportowana"),
    (E, "applyEqualGrowthRationPlan", P, "apply_equal_growth_ration_plan", f"{EM}::auto_balance_matches_web", "nieeksportowana"),
    (E, "isRationBalanceTargetMet", P, "is_ration_balance_target_met", f"{EM}::auto_balance_matches_web", "nieeksportowana"),
    (E, "_lastTicks", P, "EmpireFoodRuntime", f"{EM}::advance_empire_food_matches_web", "stan modulu -> pole EmpireFoodRuntime"),
    (E, "_statesRef", P, "EmpireFoodRuntime", f"{EM}::advance_empire_food_matches_web", "stan modulu -> parametr `states` (ZAL-4)"),
    (E, "_maxCapByOwner", P, "EmpireFoodRuntime", f"{EM}::advance_empire_food_matches_web", "stan modulu -> pole EmpireFoodRuntime"),
    (E, "RawParamRow", N, "-", "-", "typ pomocniczy TS; w Rust surowy serde_json::Value"),
    (E, "CityFoodTickLike", N, "CityEconomyTick", "-", "Pick<CityEconomyTick,...> = ta sama struktura"),
]

# symbole TS prywatne/typy, ktore nie sa `export function/const/...` (lista wyjatkow weryfikacji istnienia w TS)
PRIVATE_TS = {
    "pick", "RawParamRow", "Difficulty", "stripDiacriticsLower", "countMagazynByOwner", "computeCentralFoodCap",
    "ownerCitiesForAutoAdjust", "applyEqualGrowthRationPlan", "isRationBalanceTargetMet", "_lastTicks", "_statesRef",
    "_maxCapByOwner", "CityFoodTickLike",
}

errors = []
ts_exports = {}
for f in (V, H, T, S, E):
    src = (WEB / f).read_text(encoding="utf-8")
    names = set(re.findall(r"^export\s+(?:async\s+)?(?:function|const|interface|type|class)\s+([A-Za-z0-9_]+)", src, re.M))
    # re-eksport `export { a, a as b, type C as D } from ...`
    for blk in re.findall(r"^export\s*\{([^}]*)\}\s*from", src, re.M):
        for part in blk.split(","):
            part = part.strip()
            if not part:
                continue
            m = re.match(r"(?:type\s+)?([A-Za-z0-9_]+)(?:\s+as\s+([A-Za-z0-9_]+))?$", part)
            names.add(m.group(2) or m.group(1))
    ts_exports[f] = names
    declared = set(re.findall(r"^(?:export\s+)?(?:async\s+)?(?:function|const|let|interface|type|class)\s+([A-Za-z0-9_]+)", src, re.M))
    for row in ROWS:
        if row[0] == f and row[1] not in names and row[1] not in PRIVATE_TS:
            errors.append(f"symbol TS nie jest eksportem {f}: {row[1]}")
        if row[0] == f and row[1] in PRIVATE_TS and row[1] not in declared:
            errors.append(f"symbol prywatny TS nie jest zadeklarowany w {f}: {row[1]}")

rows_by_file = {}
for row in ROWS:
    rows_by_file.setdefault(row[0], set()).add(row[1])
for f, names in ts_exports.items():
    for n in sorted(names):
        if n not in rows_by_file.get(f, set()):
            errors.append(f"eksport TS bez wiersza: {f} {n}")

rust = (ENG / "src/domain/city_growth.rs").read_text(encoding="utf-8")
start = rust.index("pub mod p6_7a {")
region = rust[start:]
tests = {}
for p in ENG.glob("tests/p6_7a_*.rs"):
    tests[p.stem] = p.read_text(encoding="utf-8")

for f, sym, status, rsym, test, note in [(r[0], r[1], r[2], r[3], r[4], r[5] or "-") for r in ROWS]:
    if rsym != "-":
        last = rsym.split("::")[-1]
        if not re.search(r"\b(?:fn|struct|enum|type|const|mod|as)\s+" + re.escape(last) + r"\b", region):
            errors.append(f"symbol Rust nie istnieje: {rsym} (dla {sym})")
    if test != "-":
        tf, tn = test.split("::")
        if tf not in tests or not re.search(r"fn\s+" + re.escape(tn) + r"\b", tests[tf]):
            errors.append(f"test nie istnieje: {test} (dla {sym})")
    if status not in (P, PI, D, N, R2):
        errors.append(f"zly status {status} dla {sym}")

if errors:
    print("\n".join(errors))
    sys.exit(2)

counts = {}
for r in ROWS:
    counts[r[2]] = counts.get(r[2], 0) + 1
OUT_TSV.write_text(
    "plik\tsymbol_ts\tstatus\tsymbol_rust\ttest\tuwaga\n" + "\n".join("\t".join(tuple(r[:5]) + (r[5] or "-",)) for r in ROWS) + "\n", encoding="utf-8"
)
md = ["| Plik web | Symbol | Status | Rust | Test | Uwaga |", "|---|---|---|---|---|---|"]
for f, sym, status, rsym, test, note in [(r[0], r[1], r[2], r[3], r[4], r[5] or "-") for r in ROWS]:
    md.append(f"| `{f}` | `{sym}` | {status} | `{rsym}` | `{test}` | {note} |")
OUT_MD.write_text("\n".join(md) + "\n", encoding="utf-8")
print("wierszy:", len(ROWS), counts)
for f in (V, H, T, S, E):
    print(f, "eksportow TS:", len(ts_exports[f]), "wierszy:", len(rows_by_file[f]))
