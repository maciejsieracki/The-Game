//! R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1: pipeline zasobow per tura (web pin `4bbef081d`).
//!
//! Port `gra/src/game/turn-economy.ts`: `tickEmpireResourcePipeline` (`:1691-1808`, trzy fazy: wplyw
//! z mapy -> konwertery -> drain Spichlerza), `simulateCeramikaAfterSpichlerzDrains` (`:1363-1380`),
//! `computeGarncarniaSurplusZadowolenieByOwner` (`:1563-1593`), `applyStolarniaDrewnoMapInflow`
//! (`:801-808`), oraz wywolanie z `advanceCityEconomy` (`:2476-2500`: `loadSpichlerzDrainParams` ->
//! tick -> bonus Garncarni). Zalezne: `converters.ts` (`runConverter(s)`, receptury, przepustowosc
//! wg epoki). To NIE jest rozliczacz skarbca `u64` z `turn_economy.rs` - inny kontrakt (`f64` per
//! miasto, pula wlasciciela rozsmarowana po `City.surowce`).
//!
//! Zalozenia modelowe (opisane w `dyspozycje/rust-port/p6/P6-TURN-ECONOMY-RESOURCES.md`):
//! * `Record<string, number>` = `BTreeMap<String, f64>` (kolejnosc kluczy nie jest modelowana; klucze
//!   sa niezalezne, a receptury iteruja wejscia w kolejnosci wstawiania - tu kolejnosc tablicy);
//! * dane wejsciowe ticku wyliczane gdzie indziej w webie (`territoryResourceByCity`,
//!   `workedMagazynByCity`, liczniki Stolarni/Kamieniarni, `ownerResourceCapFor`,
//!   `converterThroughputsForOwner`, resolvery) wchodza jako parametry - tak jak w sygnaturze weba;
//! * globalne mapy weba `_spichlerzSolArmyByOwner` / `_spichlerzSolCityIdsByOwner` zwracane sa w
//!   wyniku (`EmpireResourceTickOutcome`) zamiast statycznego stanu modulu.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::domain::building_costs::p6_7b::{
    assign_owner_resource_stock_from_pool, city_has_spichlerz_building,
    credit_owner_resource_stock, filter_runtime_active_built_ids, load_spichlerz_drain_params,
    load_throughput, owner_resource_stock, owner_resource_stock_all, pay_spichlerz_drain_for_city,
    resolve_spichlerz_city_bonus_state, spichlerz_ceramika_drain_amount,
    BuildingRuntimeGateOptions, SpichlerzCityBonusState, SpichlerzDrainParams, StockCitySource,
    StockRecord,
};
use crate::domain::civ_matrix::js_compat::{js_max, js_min};

// ---------------------------------------------------------------------------------------------
// converters.ts
// ---------------------------------------------------------------------------------------------

/// Web `ConverterRecipe` (`converters.ts:47-57`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ConverterRecipe {
    pub id: &'static str,
    pub building_id: Option<&'static str>,
    pub inputs: &'static [(&'static str, f64)],
    pub output: &'static str,
    pub output_amount: f64,
    pub throughput_param_key: &'static str,
    pub throughput_fallback: f64,
}

/// Web `DEFAULT_CONVERTER_RECIPES` (`converters.ts:81-101`), w tej samej kolejnosci.
pub const DEFAULT_CONVERTER_RECIPES: [ConverterRecipe; 9] = [
    ConverterRecipe {
        id: "cegielnia",
        building_id: None,
        inputs: &[("glina", 2.0), ("drewno", 1.0)],
        output: "cegla",
        output_amount: 1.0,
        throughput_param_key: "budynek_cegielnia_przepustowosc",
        throughput_fallback: 50.0,
    },
    ConverterRecipe {
        id: "garncarnia",
        building_id: None,
        inputs: &[("glina", 1.0), ("drewno", 1.0)],
        output: "ceramika",
        output_amount: 1.0,
        throughput_param_key: "budynek_garncarnia_przepustowosc",
        throughput_fallback: 50.0,
    },
    ConverterRecipe {
        id: "huta",
        building_id: None,
        inputs: &[("ruda", 1.0), ("drewno", 1.0)],
        output: "braz",
        output_amount: 1.0,
        throughput_param_key: "budynek_huta_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "odlewnia_brazu",
        building_id: None,
        inputs: &[("ruda", 1.0), ("drewno", 1.0), ("ruda_cyny", 0.1)],
        output: "braz",
        output_amount: 1.0,
        throughput_param_key: "budynek_huta_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "odlewnia_zelaza__braz",
        building_id: Some("odlewnia_zelaza"),
        inputs: &[("ruda", 1.0), ("drewno", 1.0), ("ruda_cyny", 0.1)],
        output: "braz",
        output_amount: 1.0,
        throughput_param_key: "budynek_huta_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "odlewnia_zelaza__zelazo",
        building_id: Some("odlewnia_zelaza"),
        inputs: &[("ruda_zelaza", 1.0), ("drewno", 1.0)],
        output: "zelazo",
        output_amount: 1.0,
        throughput_param_key: "budynek_odlewnia_zelaza_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "wielka_odlewnia__braz",
        building_id: Some("wielka_odlewnia"),
        inputs: &[("ruda", 1.0), ("drewno", 1.0), ("ruda_cyny", 0.1)],
        output: "braz",
        output_amount: 1.0,
        throughput_param_key: "budynek_huta_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "wielka_odlewnia__zelazo",
        building_id: Some("wielka_odlewnia"),
        inputs: &[("ruda_zelaza", 1.0), ("drewno", 1.0)],
        output: "zelazo",
        output_amount: 1.0,
        throughput_param_key: "budynek_odlewnia_zelaza_przepustowosc",
        throughput_fallback: 25.0,
    },
    ConverterRecipe {
        id: "wielka_odlewnia__stal",
        building_id: Some("wielka_odlewnia"),
        inputs: &[("zelazo", 1.0), ("drewno", 1.0)],
        output: "stal",
        output_amount: 1.0,
        throughput_param_key: "budynek_wielka_odlewnia_przepustowosc",
        throughput_fallback: 25.0,
    },
];

/// Receptury realnie obecne w webie (bez slotu pomocniczego).
pub fn default_converter_recipes() -> &'static [ConverterRecipe] {
    &DEFAULT_CONVERTER_RECIPES
}

/// Web `CONVERTER_ERA_SCALING_PCT`.
pub const CONVERTER_ERA_SCALING_PCT: f64 = 0.10;

/// Web `converterBuildingIdForRecipe`.
pub fn converter_building_id_for_recipe(recipe: &ConverterRecipe) -> &'static str {
    recipe.building_id.unwrap_or(recipe.id)
}

/// Web `converterThroughputForEra` (`converters.ts:142-150`): tylko `cegielnia`/`garncarnia` rosna
/// +10% bazy na epoke (addytywnie); `era` nieskonczona/NaN/<=1 = 1.
pub fn converter_throughput_for_era(recipe_id: &str, base_throughput: f64, era: f64) -> f64 {
    if recipe_id != "cegielnia" && recipe_id != "garncarnia" {
        return base_throughput;
    }
    let e = if era.is_finite() && era > 1.0 {
        era
    } else {
        1.0
    };
    base_throughput * (1.0 + CONVERTER_ERA_SCALING_PCT * (e - 1.0))
}

/// Web `ConverterReason`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConverterReason {
    Ok,
    BrakWejscia,
    PelnyMagazyn,
    ZeroPrzepustowosci,
}

/// Web `ConvertResult`.
#[derive(Debug, Clone, PartialEq)]
pub struct ConvertResult {
    pub produced: f64,
    pub cykle: f64,
    pub consumed: StockRecord,
    pub stores: StockRecord,
    pub reason: ConverterReason,
}

fn have(stores: &StockRecord, key: &str) -> f64 {
    match stores.get(key) {
        Some(v) if v.is_finite() => *v,
        _ => 0.0,
    }
}

/// Web `runConverter` (`converters.ts:162-208`).
pub fn run_converter(
    recipe: &ConverterRecipe,
    stores: &StockRecord,
    throughput: f64,
    output_capacity: f64,
) -> ConvertResult {
    let tput = if throughput.is_finite() && throughput > 0.0 {
        throughput.floor()
    } else {
        0.0
    };

    let mut limit_wejscia = f64::INFINITY;
    for (k, per_cykl) in recipe.inputs {
        if *per_cykl <= 0.0 {
            continue;
        }
        limit_wejscia = js_min(limit_wejscia, (have(stores, k) / per_cykl).floor());
    }
    if !limit_wejscia.is_finite() {
        limit_wejscia = 0.0;
    }

    let wolne = js_max(0.0, output_capacity - have(stores, recipe.output));
    let limit_wyjscia = if recipe.output_amount > 0.0 {
        (wolne / recipe.output_amount).floor()
    } else {
        0.0
    };

    let cykle = js_max(0.0, js_min(js_min(tput, limit_wejscia), limit_wyjscia));

    let mut nowe = stores.clone();
    let mut consumed = StockRecord::new();
    if cykle > 0.0 {
        for (k, per_cykl) in recipe.inputs {
            let used = per_cykl * cykle;
            nowe.insert((*k).to_owned(), have(stores, k) - used);
            consumed.insert((*k).to_owned(), used);
        }
        nowe.insert(
            recipe.output.to_owned(),
            have(stores, recipe.output) + recipe.output_amount * cykle,
        );
    }

    let reason = if cykle == 0.0 {
        if tput == 0.0 {
            ConverterReason::ZeroPrzepustowosci
        } else if limit_wejscia == 0.0 {
            ConverterReason::BrakWejscia
        } else if limit_wyjscia == 0.0 {
            ConverterReason::PelnyMagazyn
        } else {
            ConverterReason::BrakWejscia
        }
    } else {
        ConverterReason::Ok
    };

    ConvertResult {
        produced: cykle * recipe.output_amount,
        cykle,
        consumed,
        stores: nowe,
        reason,
    }
}

/// Web `runConverters` (`converters.ts:340-360`): receptury po kolei na jednej puli; przepustowosc
/// z mapy po `recipe.id` (brak wpisu = `throughputFallback`).
pub fn run_converters(
    recipes: &[ConverterRecipe],
    stores: &StockRecord,
    throughputs: &BTreeMap<String, f64>,
    capacity_of: &dyn Fn(&str) -> f64,
) -> StockRecord {
    let mut cur = stores.clone();
    for recipe in recipes {
        let tput = throughputs
            .get(recipe.id)
            .copied()
            .unwrap_or(recipe.throughput_fallback);
        cur = run_converter(recipe, &cur, tput, capacity_of(recipe.output)).stores;
    }
    cur
}

/// Web `converterThroughputsForOwner` budowany w `simulateResourcePipelineForPreview`
/// (`turn-economy.ts:1428-1435`): per receptura `loadThroughput` + skalowanie epoka wlasciciela.
pub fn converter_throughputs_for_era(
    raw: &Value,
    difficulty: &str,
    era: f64,
) -> BTreeMap<String, f64> {
    let mut out = BTreeMap::new();
    for recipe in default_converter_recipes() {
        let base = load_throughput(
            raw,
            recipe.throughput_param_key,
            difficulty,
            recipe.throughput_fallback,
        );
        out.insert(
            recipe.id.to_owned(),
            converter_throughput_for_era(recipe.id, base, era),
        );
    }
    out
}

/// Web `ceramikaHappinessBonus` (`converters.ts:299-305`).
pub fn ceramika_happiness_bonus(ceramika_po_drain: f64, ma_garncarnie: bool) -> f64 {
    if ma_garncarnie && ceramika_po_drain.is_finite() && ceramika_po_drain > 0.0 {
        1.0
    } else {
        0.0
    }
}

// ---------------------------------------------------------------------------------------------
// turn-economy.ts: wplyw z mapy
// ---------------------------------------------------------------------------------------------

/// Web `stolarniaDrewnoMapInflowMult` (`:791-797`).
pub fn stolarnia_drewno_map_inflow_mult(stolarnia_count: f64, bonus_per_building: f64) -> f64 {
    let n = js_max(0.0, stolarnia_count.floor());
    1.0 + bonus_per_building * n
}

/// Web `applyStolarniaDrewnoMapInflow` (`:801-808`).
pub fn apply_stolarnia_drewno_map_inflow(
    base_drewno: f64,
    stolarnia_count: f64,
    bonus_per_building: f64,
) -> f64 {
    if !base_drewno.is_finite() || base_drewno <= 0.0 {
        return 0.0;
    }
    (base_drewno * stolarnia_drewno_map_inflow_mult(stolarnia_count, bonus_per_building)).floor()
}

/// Web `WorkedMagazynYield`.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct WorkedMagazynYield {
    pub drewno: f64,
    pub kamien: f64,
    pub glina: f64,
}

/// Web `TerritoryResourceYield` (pola opcjonalne = `undefined`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct TerritoryResourceYield {
    pub drewno: Option<f64>,
    pub kamien: Option<f64>,
    pub glina: Option<f64>,
    pub ruda: Option<f64>,
    pub ruda_zelaza: Option<f64>,
    pub ruda_cyny: Option<f64>,
    pub sol: Option<f64>,
    pub zloto: Option<f64>,
    pub kon: Option<f64>,
}

/// Resolvery weba (`OwnerActiveLabelsResolver`, `OwnerZlotoAccessResolver`) - `None` = `undefined`.
pub struct ResourceTickResolvers<'a> {
    pub owner_active_labels: Option<&'a dyn Fn(i64) -> Vec<String>>,
    pub owner_zloto_access: Option<&'a dyn Fn(i64) -> bool>,
}

/// Wejscia `tickEmpireResourcePipeline` (kolejnosc i nazwy jak w sygnaturze weba `:1691-1712`).
pub struct EmpireResourceTickInput<'a> {
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    pub territory_resource_by_city: &'a BTreeMap<String, TerritoryResourceYield>,
    pub worked_magazyn_by_city: &'a BTreeMap<String, WorkedMagazynYield>,
    pub stolarnia_count_by_owner: &'a BTreeMap<i64, f64>,
    pub kamieniarski_count_by_owner: &'a BTreeMap<i64, f64>,
    pub stolarnia_bonus_drewna_civ: f64,
    pub kamieniarski_bonus_kamienia_civ: f64,
    pub converter_throughputs_for_owner: &'a dyn Fn(i64) -> BTreeMap<String, f64>,
    pub owner_resource_cap_for: &'a dyn Fn(i64) -> f64,
    pub resolvers: ResourceTickResolvers<'a>,
    pub spichlerz_drain_params: SpichlerzDrainParams,
}

/// Wynik ticku: `Map<cityId, SpichlerzCityBonusState>` + globalne mapy Soli weba
/// (`_spichlerzSolArmyByOwner`, `_spichlerzSolCityIdsByOwner`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct EmpireResourceTickOutcome {
    pub spichlerz_by_city: BTreeMap<String, SpichlerzCityBonusState>,
    pub sol_army_by_owner: BTreeSet<i64>,
    pub sol_city_ids_by_owner: BTreeMap<i64, BTreeSet<String>>,
}

/// Web `runtimeActiveBuiltIdsForCity` (`:1662-1681`).
pub(crate) fn runtime_active_built_ids_for_city(
    built_ids: &[String],
    owner_id: i64,
    resolvers: &ResourceTickResolvers<'_>,
    empire_stock_override: Option<&StockRecord>,
) -> Vec<String> {
    let Some(labels) = resolvers.owner_active_labels else {
        return built_ids.to_vec();
    };
    let options = BuildingRuntimeGateOptions {
        owner_id: Some(owner_id),
        resolve_owner_zloto_access: resolvers.owner_zloto_access,
    };
    filter_runtime_active_built_ids(
        built_ids,
        &labels(owner_id),
        empire_stock_override,
        Some(&options),
    )
}

/// Web `tickEmpireResourcePipeline` (`:1691-1808`). Mutuje `City.surowce` (pula wlasciciela).
pub fn tick_empire_resource_pipeline<T: StockCitySource>(
    cities: &mut [T],
    input: &EmpireResourceTickInput<'_>,
) -> EmpireResourceTickOutcome {
    let mut owner_ids: Vec<i64> = Vec::new();
    for c in cities.iter() {
        if !owner_ids.contains(&c.owner_id()) {
            owner_ids.push(c.owner_id());
        }
    }

    // Faza 1 (R2): wplyw z mapy do magazynu panstwa - przed konwerterami.
    for idx in 0..cities.len() {
        let city_id = cities[idx].id().to_owned();
        let owner_id = cities[idx].owner_id();
        let terr = input.territory_resource_by_city.get(&city_id).copied();
        let worked = input
            .worked_magazyn_by_city
            .get(&city_id)
            .copied()
            .unwrap_or_default();
        let cap = (input.owner_resource_cap_for)(owner_id);
        let stolarnia_count = input
            .stolarnia_count_by_owner
            .get(&owner_id)
            .copied()
            .unwrap_or(0.0);
        let kamien_mult = 1.0
            + input.kamieniarski_bonus_kamienia_civ
                * input
                    .kamieniarski_count_by_owner
                    .get(&owner_id)
                    .copied()
                    .unwrap_or(0.0);

        let credit_territory = |cities: &mut [T], key: &str, raw: Option<f64>, mult: f64| {
            let Some(raw) = raw else { return };
            if raw.is_nan() || raw <= 0.0 {
                return;
            }
            credit_owner_resource_stock(cities, owner_id, key, (raw * mult).floor(), Some(cap));
        };

        let drewno_map_base = terr.and_then(|t| t.drewno).unwrap_or(0.0) + worked.drewno;
        let drewno_credit = apply_stolarnia_drewno_map_inflow(
            drewno_map_base,
            stolarnia_count,
            input.stolarnia_bonus_drewna_civ,
        );
        if drewno_credit > 0.0 {
            credit_owner_resource_stock(cities, owner_id, "drewno", drewno_credit, Some(cap));
        }

        let kamien_base = terr.and_then(|t| t.kamien).unwrap_or(0.0) + worked.kamien;
        credit_territory(cities, "kamien", Some(kamien_base), kamien_mult);

        let glina_base = terr.and_then(|t| t.glina).unwrap_or(0.0) + worked.glina;
        credit_territory(cities, "glina", Some(glina_base), 1.0);

        let Some(t) = terr else { continue };
        credit_territory(cities, "ruda", t.ruda, 1.0);
        credit_territory(cities, "ruda_zelaza", t.ruda_zelaza, 1.0);
        credit_territory(cities, "ruda_cyny", t.ruda_cyny, 1.0);
        credit_territory(cities, "sol", t.sol, 1.0);
        credit_territory(cities, "zloto", t.zloto, 1.0);
        credit_territory(cities, "kon", t.kon, 1.0);
    }

    // Faza 2 (R2/Q5): budynki przetworcze / odlewnie ze skarbca panstwa.
    for &owner_id in &owner_ids {
        let cap = (input.owner_resource_cap_for)(owner_id);
        let mut pool: StockRecord = owner_resource_stock_all(cities, owner_id);
        let owner_throughputs = (input.converter_throughputs_for_owner)(owner_id);

        for city in cities.iter() {
            if city.owner_id() != owner_id {
                continue;
            }
            let built_ids: &[String] = input
                .built_by_city
                .get(city.id())
                .map(Vec::as_slice)
                .unwrap_or(&[]);
            let runtime_built_ids = runtime_active_built_ids_for_city(
                built_ids,
                owner_id,
                &ResourceTickResolvers {
                    owner_active_labels: input.resolvers.owner_active_labels,
                    owner_zloto_access: input.resolvers.owner_zloto_access,
                },
                Some(&pool),
            );
            let active: Vec<ConverterRecipe> = default_converter_recipes()
                .iter()
                .filter(|r| {
                    runtime_built_ids
                        .iter()
                        .any(|b| b == converter_building_id_for_recipe(r))
                })
                .copied()
                .collect();
            if active.is_empty() {
                continue;
            }
            pool = run_converters(&active, &pool, &owner_throughputs, &|_| cap);
        }

        assign_owner_resource_stock_from_pool(cities, owner_id, &pool);
    }

    // Faza 3 (U-5/U-10/U-11): drain Spichlerza ze skarbca po swiezej produkcji/konwersji.
    let mut out = EmpireResourceTickOutcome::default();
    for idx in 0..cities.len() {
        let city_id = cities[idx].id().to_owned();
        let owner_id = cities[idx].owner_id();
        let built_ids: &[String] = input
            .built_by_city
            .get(&city_id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let drain = pay_spichlerz_drain_for_city(
            cities,
            owner_id,
            built_ids,
            false,
            &input.spichlerz_drain_params,
        );
        let state = resolve_spichlerz_city_bonus_state(built_ids, drain);
        out.spichlerz_by_city.insert(city_id.clone(), state);
        if state.sol_active {
            out.sol_army_by_owner.insert(owner_id);
            out.sol_city_ids_by_owner
                .entry(owner_id)
                .or_default()
                .insert(city_id);
        }
    }
    out
}

/// Web `simulateCeramikaAfterSpichlerzDrains` (`:1363-1380`): dry-run puli Ceramiki po drainach.
pub fn simulate_ceramika_after_spichlerz_drains<T: StockCitySource>(
    cities: &[T],
    owner_id: i64,
    built_by_city: &BTreeMap<String, Vec<String>>,
    drain_params: &SpichlerzDrainParams,
) -> f64 {
    let mut ceramika = owner_resource_stock(cities, owner_id, "ceramika");
    for city in cities {
        if city.owner_id() != owner_id {
            continue;
        }
        let built_ids: &[String] = built_by_city
            .get(city.id())
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let has_spichlerz = city_has_spichlerz_building(built_ids);
        let amount = spichlerz_ceramika_drain_amount(built_ids, drain_params);
        if has_spichlerz && ceramika >= amount {
            ceramika -= amount;
        }
    }
    ceramika
}

/// Web `computeGarncarniaSurplusZadowolenieByOwner` (`:1563-1593`): +1 Zadowolenia per wlasciciel
/// z Garncarnia i dodatnia (po floor) nadwyzka Ceramiki. Klucze w kolejnosci pierwszego wystapienia.
pub fn compute_garncarnia_surplus_zadowolenie_by_owner<T: StockCitySource>(
    cities: &[T],
    built_by_city: &BTreeMap<String, Vec<String>>,
    stock_already_drained: bool,
    drain_params: &SpichlerzDrainParams,
) -> BTreeMap<i64, f64> {
    let mut out = BTreeMap::new();
    for city in cities {
        let owner_id = city.owner_id();
        if out.contains_key(&owner_id) {
            continue;
        }
        let ma_garncarnie = cities.iter().any(|c| {
            c.owner_id() == owner_id
                && built_by_city
                    .get(c.id())
                    .is_some_and(|b| b.iter().any(|id| id == "garncarnia"))
        });
        let ceramika_after = if stock_already_drained {
            owner_resource_stock(cities, owner_id, "ceramika")
        } else {
            simulate_ceramika_after_spichlerz_drains(cities, owner_id, built_by_city, drain_params)
        };
        // computeGarncarniaSurplusBonus(efekt 'zadowolenie'): nadwyzka = ma ? max(0, floor(c)) : 0.
        let nadwyzka = if ma_garncarnie {
            js_max(0.0, ceramika_after.floor())
        } else {
            0.0
        };
        let bonus = if nadwyzka <= 0.0 {
            0.0
        } else {
            ceramika_happiness_bonus(nadwyzka, ma_garncarnie)
        };
        out.insert(owner_id, bonus);
    }
    out
}

/// Wynik fazy zasobow `advanceCityEconomy` (`:2476-2500`).
#[derive(Debug, Clone, PartialEq)]
pub struct ResourcePhaseOutcome {
    pub drain_params: SpichlerzDrainParams,
    pub tick: EmpireResourceTickOutcome,
    pub garncarnia_surplus_zadowolenie_by_owner: BTreeMap<i64, f64>,
}

/// PRODUKCYJNY WYWOLUJACY (web `advanceCityEconomy` `:2476-2500`): `loadSpichlerzDrainParams(econ,
/// difficulty)` -> `tickEmpireResourcePipeline` -> `computeGarncarniaSurplusZadowolenieByOwner(..., true)`.
/// `input.spichlerz_drain_params` jest tu ignorowane i nadpisywane wynikiem ladowania z `econ_params`
/// (jedno zrodlo prawdy, jak w webie).
pub fn run_city_economy_resource_phase<T: StockCitySource>(
    cities: &mut [T],
    mut input: EmpireResourceTickInput<'_>,
    econ_params: Option<&Value>,
    difficulty: &str,
) -> ResourcePhaseOutcome {
    let drain_params = load_spichlerz_drain_params(econ_params, difficulty);
    input.spichlerz_drain_params = drain_params;
    let tick = tick_empire_resource_pipeline(cities, &input);
    let garncarnia = compute_garncarnia_surplus_zadowolenie_by_owner(
        cities,
        input.built_by_city,
        true,
        &drain_params,
    );
    ResourcePhaseOutcome {
        drain_params,
        tick,
        garncarnia_surplus_zadowolenie_by_owner: garncarnia,
    }
}
