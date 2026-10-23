#!/usr/bin/env python3
"""Tabela symboli P6.7B: kazdy eksport i symbol prywatny trzech plikow weba ma wiersz ze statusem.

Uzycie: gen-symbols-p67b.py <WEB_ROOT> <ENGINE_DIR> > symbols-p67b-r1.tsv
Sprawdza (blad i exit 2): (a) kazda deklaracja `export ...` / prywatna deklaracja pliku TS ma wiersz; (b) wiersz nie
wskazuje symbolu spoza zrodla; (c) nazwa Rust istnieje w `src/domain/building_costs.rs` (modul p6_7b) i ma numer
linii; (d) nazwa testu istnieje w `tests/p6_7b_*.rs`. Slownik statusow: PORTOWANY, PORTOWANY-Z-WSTRZYKNIETYMI,
DANE-JUZ-W-RUST, NIE-DOTYCZY, RUNDA-2.
"""
import re
import sys
from pathlib import Path

WEB = Path(sys.argv[1])
ENG = Path(sys.argv[2])
BC = (ENG / "src/domain/building_costs.rs").read_text(encoding="utf-8").split("\n")
TESTS = {p.name: p.read_text(encoding="utf-8") for p in (ENG / "tests").glob("p6_7b_*.rs")}
STATUSES = {"PORTOWANY", "PORTOWANY-Z-WSTRZYKNIETYMI", "DANE-JUZ-W-RUST", "NIE-DOTYCZY", "RUNDA-2"}
START = next(i for i, l in enumerate(BC) if l.startswith("pub mod p6_7b"))


def rust_line(name):
    pat = re.compile(rf"^\s+(?:pub (?:fn|struct|enum|type|const|trait) {re.escape(name)}\b|fn {re.escape(name)}\b)")
    for i in range(START, len(BC)):
        if pat.match(BC[i]):
            return i + 1
    raise SystemExit(f"BLAD: brak `{name}` w building_costs.rs::p6_7b")


def has_test(fname, test):
    if fname not in TESTS or not re.search(rf"fn {re.escape(test)}\b", TESTS[fname]):
        raise SystemExit(f"BLAD: brak testu {fname}::{test}")


DECL = re.compile(r"^(export )?(?:(?:const|let|function|interface|type|enum|class) )(\w+)")


def scan(fname):
    out = {}
    for n, line in enumerate((WEB / "gra/src/game" / fname).read_text(encoding="utf-8").split("\n"), 1):
        m = DECL.match(line)
        if m and m.group(2) not in out:
            out[m.group(2)] = n
    return out


R = "PORTOWANY"
RI = "PORTOWANY-Z-WSTRZYKNIETYMI"
DR = "DANE-JUZ-W-RUST"
ND = "NIE-DOTYCZY"

TE = "building-cost-tempo.ts"
ST = "building-stock-cost.ts"
GA = "building-resource-gate.ts"
C = "p6_7b_cost.rs"
P = "p6_7b_pool.rs"
G = "p6_7b_gate.rs"
S = "p6_7b_spichlerz.rs"
N = "p6_7b_nfd.rs"
TB = "p6_7b_tables.rs"

# (plik, symbol): (status, [nazwy Rust], test 'plik::nazwa' albo '-', uwaga)
T = {
    # --- building-cost-tempo.ts ---
    (TE, "KOSZT_BUDYNKOW_PACE"): (R, ["building_cost_pace_multiplier"], f"{C}::constants_match_running_web", "dane: building-cost-params.json tempo_kosztow_budynkow; wyniki tempa sa tez splaszczone w building-work-states.json (zgodnosc: tables::pace_matches_flattened_work_states_for_normal_mode)"),
    (TE, "BuildingCostPace"): (R, ["PaceInput"], f"{C}::building_cost_pace_matches_running_web", "keyof -> PaceInput::Key; liczba -> PaceInput::Multiplier"),
    (TE, "applyBuildingCostPace"): (R, ["apply_building_cost_pace"], f"{C}::building_cost_pace_matches_running_web", "Math.max(1, Math.round(..)); nieznany klucz = NaN"),
    # --- building-stock-cost.ts ---
    (ST, "BuildingStockCost"): (R, ["StockRecord"], f"{C}::building_stock_cost_matches_running_web", "alias Partial<Record<string, number>> -> BTreeMap<String, f64>"),
    (ST, "epochCostMultiplier"): (R, ["epoch_cost_multiplier", "EpochInput"], f"{C}::epoch_cost_multiplier_matches_running_web", "progi i slowa epok: building-cost-params.json epoki"),
    (ST, "scaleCostByEpoch"): (R, ["scale_cost_by_epoch"], f"{C}::scale_cost_by_epoch_matches_running_web", "-"),
    (ST, "buildingEraCostMultiplier"): (R, ["building_era_cost_multiplier"], f"{C}::building_era_cost_multiplier_matches_running_web", "zgodnosc z building-work-costs.json: tables::era_multiplier_matches_flattened_work_tables"),
    (ST, "buildingStockCost"): (RI, ["building_stock_cost", "BuildingStockSource", "scale_stock_cost_record"], f"{C}::building_stock_cost_matches_running_web", "wstrzykniete: scaleStockCostRecord z r-stawki-strojenie.ts (FALA2 x2) - kopia wejsciowa + mnoznik w building-cost-params.json; zgodnosc z building-stock-costs.json: tables::building_stock_cost_matches_flattened_p3_19_table"),
    (ST, "missingStockFor"): (R, ["missing_stock_for"], f"{C}::missing_can_afford_and_deduct_match_running_web", "-"),
    (ST, "canAffordBuildingStock"): (R, ["can_afford_building_stock"], f"{C}::missing_can_afford_and_deduct_match_running_web", "-"),
    (ST, "deductBuildingStockCost"): (R, ["deduct_building_stock_cost"], f"{C}::missing_can_afford_and_deduct_match_running_web", "nie mutuje wejsc: cost::deduct_does_not_mutate_inputs"),
    (ST, "STOCK_RESOURCE_LABEL"): (R, ["stock_resource_labels"], f"{C}::constants_match_running_web", "dane: building-cost-params.json magazyn.etykiety"),
    (ST, "EMPIRE_STOCK_RESOURCE_KEYS"): (R, ["empire_stock_resource_keys"], f"{C}::constants_match_running_web", "dane: building-cost-params.json magazyn.klucze_magazynu_panstwa"),
    (ST, "stockResourceLabel"): (R, ["stock_resource_label"], f"{C}::stock_resource_label_matches_running_web", "klucz z lancucha prototypow: swiadoma rozbieznosc (cost::prototype_key_lookups_are_a_documented_divergence)"),
    (ST, "StockCitySource"): (R, ["StockCitySource", "StockCity"], f"{P}::deduct_across_cities_matches_running_web", "interfejs -> cecha (implementacja dla City z P6.6B i dla StockCity)"),
    (ST, "ownerResourceStockAll"): (R, ["owner_resource_stock_all"], f"{P}::owner_resource_stock_all_matches_running_web", "-"),
    (ST, "ownerResourceStock"): (R, ["owner_resource_stock"], f"{P}::owner_resource_stock_matches_running_web", "-"),
    (ST, "refundBuildingStockCostAcrossCities"): (R, ["refund_building_stock_cost_across_cities"], f"{P}::refund_across_cities_matches_running_web", "-"),
    (ST, "deductBuildingStockCostAcrossCities"): (R, ["deduct_building_stock_cost_across_cities"], f"{P}::deduct_across_cities_matches_running_web", "remis po id: porownanie UTF-16 (pool::explicit_utf16_tie_break_matches_running_web)"),
    (ST, "creditOwnerResourceStock"): (R, ["credit_owner_resource_stock"], f"{P}::credit_owner_resource_stock_matches_running_web", "-"),
    (ST, "assignOwnerResourceStockFromPool"): (R, ["assign_owner_resource_stock_from_pool"], f"{P}::assign_from_pool_matches_running_web", "-"),
    (ST, "stripDiacriticsLower"): (R, ["strip_diacritics_lower", "nfd_strip", "canonical_order"], f"{N}::nfd_strip_matches_running_web_for_every_code_point", "NFD: dane Unicode nfd-strip-table.json + Hangul algorytmicznie + kolejnosc kanoniczna; przeglad calego Unicode i 6000 napisow losowych"),
    (ST, "MOUNT_UNIT_HORSE_STOCK_COST"): (R, ["mount_unit_horse_stock_cost"], f"{C}::constants_match_running_web", "dane: building-cost-params.json jednostki.kon_koszt_bazowy"),
    (ST, "MOUNT_UNIT_HORSE_STOCK_KEY"): (R, ["mount_unit_horse_stock_key"], f"{C}::constants_match_running_web", "dane: building-cost-params.json jednostki.kon_klucz"),
    (ST, "MOUNT_HORSE_EXEMPT_UNIT"): (R, ["mount_horse_exempt_unit"], f"{C}::constants_match_running_web", "dane: building-cost-params.json jednostki.wyjatek_kon_jednostka"),
    (ST, "UnitStockCostSource"): (R, ["UnitStockCostSource"], f"{C}::unit_stock_cost_matches_running_web", "-"),
    (ST, "unitRequiresMountHorseStock"): (R, ["unit_requires_mount_horse_stock"], f"{C}::unit_stock_cost_matches_running_web", "-"),
    (ST, "unitStockCost"): (R, ["unit_stock_cost"], f"{C}::unit_stock_cost_matches_running_web", "zgodnosc z unit-stock-costs.json: tables::unit_stock_cost_matches_flattened_p3_19_table"),
    # --- building-resource-gate.ts ---
    (GA, "LABEL_BY_ASCII"): (R, ["label_by_ascii"], f"{G}::required_active_labels_match_running_web", "dane: building-cost-params.json bramka.etykiety_ascii (etykieta Zlota z jednego zrodla)"),
    (GA, "DEPOSIT_LINKED_BUILDING_LABELS"): (R, ["deposit_runtime_gated_building_ids", "building_required_active_labels"], f"{G}::constants_match_running_web", "dane: building-cost-params.json bramka.zloza_budynkow"),
    (GA, "CITY_BUILDING_PREREQ"): (R, ["city_building_prereq"], f"{G}::constants_match_running_web", "dane: building-cost-params.json bramka.prerekwizyty_miasta (napis albo lista)"),
    (GA, "cityBuildingPrereqMet"): (RI, ["city_building_prereq_met", "PrereqBuilding", "SupersededFn"], f"{G}::city_building_prereq_met_matches_running_web", "wstrzykniete: isBuildingSupersededByUpgrade (production.ts) - domkniecie odtwarzajace zapisane wyniki z kontrola argumentow i liczby wywolan"),
    (GA, "WATER_ACCESS_BUILDING_IDS"): (R, ["is_water_access_building"], f"{G}::constants_match_running_web", "dane: building-cost-params.json bramka.dostep_wodny"),
    (GA, "ASCII_BY_LABEL"): (R, ["ascii_by_label"], f"{G}::label_satisfied_matches_running_web", "odwrocenie tabeli etykiet; przy powtorzonej etykiecie wygrywa ostatnia (jak Object.fromEntries)"),
    (GA, "ACCESS_ONLY_RESOURCE_LABELS"): (R, ["access_only_resource_labels"], f"{G}::constants_match_running_web", "deprecated, pusty zbior"),
    (GA, "isAccessOnlyResourceLabel"): (R, ["is_access_only_resource_label"], f"{G}::access_only_labels_match_running_web", "deprecated, zawsze false"),
    (GA, "empireResourceLabelSatisfied"): (R, ["empire_resource_label_satisfied"], f"{G}::label_satisfied_matches_running_web", "argumenty _activeLabels i _buildingId nieuzywane, zachowane w sygnaturze"),
    (GA, "empireLabelSatisfied"): (R, ["label_satisfied"], f"{G}::label_satisfied_matches_running_web", "konwertery: building-cost-params.json bramka.konwertery"),
    (GA, "buildingRequiredActiveLabels"): (R, ["building_required_active_labels", "GateBuilding"], f"{G}::required_active_labels_match_running_web", "klucz z lancucha prototypow: swiadoma rozbieznosc (cost::prototype_key_lookups_are_a_documented_divergence)"),
    (GA, "buildingResourceGateMet"): (R, ["building_resource_gate_met"], f"{G}::resource_gate_matches_running_web", "-"),
    (GA, "DEPOSIT_RUNTIME_GATED_BUILDING_IDS"): (R, ["deposit_runtime_gated_building_ids"], f"{G}::constants_match_running_web", "-"),
    (GA, "SPICHLERZ_RUNTIME_EXCLUDED"): (R, ["has_deposit_runtime_gate"], f"{G}::has_deposit_runtime_gate_matches_running_web", "dane: building-cost-params.json spichlerz.wykluczone_z_bramki_runtime"),
    (GA, "hasDepositRuntimeGate"): (R, ["has_deposit_runtime_gate"], f"{G}::has_deposit_runtime_gate_matches_running_web", "-"),
    (GA, "BuildingRuntimeGateOptions"): (RI, ["BuildingRuntimeGateOptions"], f"{G}::runtime_gate_matches_running_web", "wstrzykniete: resolveOwnerZlotoAccess (domkniecie wolajacego)"),
    (GA, "empireLabelSatisfiedAtRuntime"): (R, ["label_satisfied"], f"{G}::runtime_gate_matches_running_web", "druga kopia tej samej tresci w webie -> jedna implementacja label_satisfied; rownowaznosc dowodzona wektorami obu sciezek"),
    (GA, "mennicaRuntimeGateMet"): (RI, ["mennica_runtime_gate_met", "owner_can_feed_mennica"], f"{G}::owner_can_feed_mennica_matches_running_web", "wstrzykniete: ownerCanFeedMennica z zloto-access.ts (kopia wejsciowa, stale w building-cost-params.json) i resolver zlota"),
    (GA, "buildingRuntimeGateMet"): (RI, ["building_runtime_gate_met"], f"{G}::runtime_gate_matches_running_web", "wstrzykniete: resolver zlota"),
    (GA, "filterRuntimeActiveBuiltIds"): (RI, ["filter_runtime_active_built_ids"], f"{G}::filter_runtime_active_built_ids_matches_running_web", "wstrzykniete: resolver zlota; punkt staly Ceramika/Cegla"),
    (GA, "SPICHLERZ_DRAIN_CERAMIKA_PER_TURN"): (R, ["spichlerz_drain_ceramika_per_turn"], f"{S}::constants_match_running_web", "dane: building-cost-params.json spichlerz.drain_ceramika_na_ture"),
    (GA, "SPICHLERZ_DRAIN_SOL_PER_TURN"): (R, ["spichlerz_drain_sol_per_turn"], f"{S}::constants_match_running_web", "dane: building-cost-params.json spichlerz.drain_sol_na_ture"),
    (GA, "SpichlerzDrainPayResult"): (R, ["SpichlerzDrainPayResult"], f"{S}::pay_drain_matches_running_web", "-"),
    (GA, "SpichlerzCityBonusState"): (R, ["SpichlerzCityBonusState"], f"{S}::bonus_state_matches_running_web", "-"),
    (GA, "cityHasSpichlerzBuilding"): (R, ["city_has_spichlerz_building"], f"{S}::city_has_spichlerz_matches_running_web", "-"),
    (GA, "paySpichlerzDrainForCity"): (R, ["pay_spichlerz_drain_for_city", "spichlerz_drain_dry_run"], f"{S}::pay_drain_matches_running_web", "dryRun na miastach tylko do odczytu: spichlerz_drain_dry_run (uzywane przez status nieaktywnego budynku)"),
    (GA, "resolveSpichlerzCityBonusState"): (R, ["resolve_spichlerz_city_bonus_state"], f"{S}::bonus_state_matches_running_web", "-"),
    (GA, "spichlerzHealthBonus"): (R, ["spichlerz_health_bonus"], f"{S}::bonuses_and_yields_match_running_web", "dane: building-cost-params.json spichlerz.zdrowie_*"),
    (GA, "spichlerzGrowthBonusPercent"): (R, ["spichlerz_growth_bonus_percent"], f"{S}::bonuses_and_yields_match_running_web", "dane: building-cost-params.json spichlerz.wzrost_procent_*"),
    (GA, "spichlerzRationFoodCostMultiplier"): (R, ["spichlerz_ration_food_cost_multiplier"], f"{S}::bonuses_and_yields_match_running_web", "dane: building-cost-params.json spichlerz.racja_mnoznik_*"),
    (GA, "spichlerzHappinessBonusFromJson"): (R, ["spichlerz_happiness_bonus_from_json"], f"{S}::bonuses_and_yields_match_running_web", "domyslny jsonBonus: building-cost-params.json spichlerz.zadowolenie_json_domyslne"),
    (GA, "builtIdsForSpichlerzYields"): (R, ["built_ids_for_spichlerz_yields"], f"{S}::bonuses_and_yields_match_running_web", "-"),
    (GA, "SPICHLERZ_EMPIRE_CAP_I"): (R, ["spichlerz_empire_cap_i"], f"{S}::constants_match_running_web", "dane: building-cost-params.json spichlerz.cap_imperium_i"),
    (GA, "SPICHLERZ_EMPIRE_CAP_II_FULL"): (R, ["spichlerz_empire_cap_ii_full"], f"{S}::constants_match_running_web", "dane: building-cost-params.json spichlerz.cap_imperium_ii_pelny"),
    (GA, "spichlerzArmyFoodCostMultiplier"): (R, ["spichlerz_army_food_cost_multiplier"], f"{S}::army_food_multiplier_matches_running_web", "dane: building-cost-params.json spichlerz.armia_*, garnizon_*"),
    (GA, "OwnedBuildingInactiveStatus"): (R, ["OwnedBuildingInactiveStatus"], f"{S}::inactive_status_matches_running_web", "-"),
    (GA, "formatInactiveTooltip"): (R, ["format_inactive_tooltip"], f"{S}::inactive_status_matches_running_web", "dane: building-cost-params.json bramka.komunikaty"),
    (GA, "missingRuntimeResourceLabels"): (RI, ["missing_runtime_resource_labels"], f"{G}::missing_runtime_labels_match_running_web", "wstrzykniete: resolver zlota"),
    (GA, "resolveOwnedBuildingInactiveStatus"): (RI, ["resolve_owned_building_inactive_status", "InactiveStatusOptions"], f"{S}::inactive_status_matches_running_web", "wstrzykniete: resolver zlota; miasta tylko do odczytu"),
}
# re-eksport `export { MENNICA_ZLOTO_DRAIN_PER_TURN };` (nie jest deklaracja)
REEXPORT = (GA, "MENNICA_ZLOTO_DRAIN_PER_TURN", (R, ["mennica_zloto_drain_per_turn"], f"{G}::constants_match_running_web", "re-eksport stalej z zloto-access.ts; dane: building-cost-params.json wejscia_z_innych_modulow_weba"))

assert all(v[0] in STATUSES for v in T.values()), "status spoza slownika"

rows = []
for fname in (TE, ST, GA):
    decls = scan(fname)
    declared = {s for (f, s) in T if f == fname}
    missing = [s for s in decls if (fname, s) not in T]
    if missing:
        raise SystemExit(f"BLAD: symbole bez wiersza w {fname}: {missing}")
    extra = [s for s in declared if s not in decls]
    if extra:
        raise SystemExit(f"BLAD: wiersze wskazuja symbole spoza {fname}: {extra}")
    for sym, line in sorted(decls.items(), key=lambda kv: kv[1]):
        status, rust, test, note = T[(fname, sym)]
        refs = []
        for r in rust:
            refs.append(f"rust-port/engine/src/domain/building_costs.rs:{rust_line(r)} ({r})")
        if test != "-":
            tf, tn = test.split("::")
            has_test(tf, tn)
        rows.append((fname, str(line), sym, status, "; ".join(refs), test, note))
    if fname == GA:
        text = (WEB / "gra/src/game" / fname).read_text(encoding="utf-8").split("\n")
        ln = next(i + 1 for i, l in enumerate(text) if l.startswith("export { MENNICA_ZLOTO_DRAIN_PER_TURN }"))
        status, rust, test, note = REEXPORT[2]
        rows.append((fname, str(ln), REEXPORT[1], status, f"rust-port/engine/src/domain/building_costs.rs:{rust_line(rust[0])} ({rust[0]})", test, note))
        tf, tn = test.split("::")
        has_test(tf, tn)

print("plik_ts\tlinia_ts\tsymbol\tstatus\todpowiednik_rust\ttest\tuwaga")
for r in rows:
    print("\t".join(r))
counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
print(f"# wiersze={len(rows)} " + " ".join(f"{k}={v}" for k, v in sorted(counts.items())), file=sys.stderr)
