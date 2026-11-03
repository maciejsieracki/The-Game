//! R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1: blok EmpireFood / auto-racje / atrycja, ktory web wykonuje MIEDZY tickiem
//! ekonomii a bankowaniem (`gra/src/main.ts:34594-34850`, pin `4bbef081d`).
//!
//! Funkcje rdzeniowe (`advanceEmpireFood`, `autoBalanceRationsToSolvency`, `autoRaiseRationsForGrowth`,
//! `maxSafePoziomRacjiForCity`, `recomputeCityFoodBalancesInEcon`, `cityPopulationCap`, ...) ISTNIEJA w
//! `domain/city_growth.rs` (`p6_7a`, wektory `tests/p6_7a_empire.rs`). Ten modul DODAJE brakujace:
//! * [`military_food_consumption_with_spichlerz`] = `militaryFoodConsumptionWithSpichlerz` (`turn-economy.ts:1325`);
//! * [`refresh_economy_food_totals`] = `refreshEconomyFoodTotals` (`turn-economy.ts:1654`);
//! * [`run_empire_food_block`] = sklejka `main.ts:34594-34850` (mapa Spichlerza per miasto, `popCapByCityId`,
//!   petla po wlascicielach: auto-obnizenie + auto-podniesienie, clamp foteli czlowieka, `advanceEmpireFood`,
//!   atrycja HP + sprzatanie po zniszczonych jednostkach);
//!
//! oraz adaptery miedzy typem ticku petli ([`CityLoopTick`]) a podzbiorem `CityEconomyTick` modulu `p6_7a`.
//!
//! ZALOZENIA (do akceptacji):
//! * Z-EF-4 Blok zmienia `cities` WYLACZNIE w `poziomRacji` (+ domyslne pola racji z `ensureCityRationDefaults`);
//!   NIE zmienia `population` ani zapasow miasta (to robi `applyPostCentralPopulationGrowth` PO bloku, poza zakresem).
//!   Atrycja zmienia jednostki i stan oblezenia/garnizonu ([`crate::domain::turn_economy_attrition`]).
//! * Z-EF-5 Komunikaty HUD (`showHintMessage`), `refreshFog`, `_maxSafeRationCache.clear()`, `pendingAutoRationForNextTurn`
//!   (tu: [`EmpireFoodBlockOutcome::pending_auto_ration`]) to UI/stan poza silnikiem; zwracane jako dane.
//! * Z-EF-6 `maxSafePoziomRacjiForCity` w clampie weba wolane BEZ `humanOwnerIds` i BEZ `kosztArmii` (domyslne `[0]`, `0`):
//!   odtworzone doslownie (`main.ts:34710-34747`), mimo ze petla idzie po `humanSeats.humanOwnerIds`.
//! * Z-EF-7 `ownerCitiesForAutoAdjust` weba uzywa `isCityAutoWyzywienieEnabled(c)` z domyslnym `humanOwnerIds=[0]`
//!   (port `p6_7a` robi tak samo, `DEFAULT_HUMAN_OWNER_IDS`).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::data::civilizations::CivMatrixFile;
use crate::domain::building_costs::p6_7b::spichlerz_army_food_cost_multiplier;
use crate::domain::city_growth::p6_7a::empire_food::{
    advance_empire_food, auto_balance_rations_to_solvency, auto_raise_rations_for_growth,
    max_safe_poziom_racji_for_city, AutoBalanceRationsOpts, AutoRaiseRationsOpts,
    AutoRationAdjustResult, MaxSafePoziomOpts,
};
use crate::domain::city_growth::p6_7a::{
    city_has_spichlerz_building, city_population_cap, game_difficulty_from_web,
    get_city_ration_level, recompute_city_food_balances_in_econ,
    resolve_population_cap_matrix_delta_in, CityEconomyTick, EconomyTickResult as FoodEconomy,
    EmpireFoodRuntime, EmpireFoodTickResult, GameDifficulty, GrowthCity, OwnerFoodStates,
    PopCapParams, SpichlerzCityBonusState,
};
use crate::domain::economy_city_params::load_econ_params;
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::turn_economy::economy_upkeep_p2::{
    build_unit_food_table, load_upkeep_params, unit_food_per_turn, UnitFoodLike, UnitRow,
};
use crate::domain::turn_economy_attrition::{
    apply_army_starvation_hp_loss, cleanup_after_starvation_destroy, siege_turn_garrison_attrition,
    sync_runtime_unit_hp_state, AttritionUnit, SiegeCityState, SiegeGarrisonLog, StarvationCleanup,
};
use crate::domain::turn_economy_loop::CityLoopTick;
use crate::domain::turn_economy_tick::EconomyTickResult;
use crate::domain::turn_economy_upkeep::raw_econ_for_upkeep;

/// Web `econUnits` (`main.ts:34413-34430`): `EconUnit & {inGarnizon, garrisonCityId}` + `camping`, `onOwnTerritory`.
#[derive(Debug, Clone, PartialEq)]
pub struct FoodUnit {
    pub owner_id: i64,
    pub type_id: String,
    pub camping: bool,
    pub on_own_territory: bool,
    pub in_garnizon: bool,
    pub garrison_city_id: Option<String>,
}

/// Web `militaryFoodConsumptionWithSpichlerz` (`turn-economy.ts:1325-1349`) BEZ `opts` (blok weba ich nie podaje):
/// stan Soli to `spichlerzSolArmyBonusActive(ownerId)` i `spichlerzSolPayingCityIds(ownerId)` po ticku.
pub fn military_food_consumption_with_spichlerz(
    units: &[FoodUnit],
    owner_id: i64,
    upkeep: &crate::domain::turn_economy::economy_upkeep_p1::UpkeepParams,
    food_table: &crate::domain::turn_economy::economy_upkeep_p2::UnitFoodTable,
    sol_army: bool,
    sol_cities: &BTreeSet<String>,
) -> f64 {
    let mut sum = 0.0;
    for u in units {
        if u.owner_id != owner_id {
            continue;
        }
        let like = UnitFoodLike {
            type_id: Some(u.type_id.clone()),
            camping: u.camping,
            on_own_territory: Some(u.on_own_territory),
        };
        let base = unit_food_per_turn(&like, upkeep, food_table);
        // `!!(u.inGarnizon && u.garrisonCityId && solCities.has(u.garrisonCityId))`
        let in_sol = u.in_garnizon
            && u.garrison_city_id
                .as_ref()
                .is_some_and(|c| !c.is_empty() && sol_cities.contains(c));
        let mult = spichlerz_army_food_cost_multiplier(sol_army, u.on_own_territory, in_sol);
        sum += base * mult;
    }
    sum
}

/// Web `refreshEconomyFoodTotals` (`turn-economy.ts:1654`): `totalZywnosc = suma (bilansLokalny ?? zywnoscNetto ?? 0)`.
pub fn refresh_economy_food_totals(per_city: &[CityEconomyTick]) -> f64 {
    let mut total = 0.0;
    for tick in per_city {
        total += tick.bilans_lokalny.unwrap_or(tick.zywnosc_netto);
    }
    total
}

/// `CityLoopTick` -> podzbior `CityEconomyTick` czytany/pisany przez `p6_7a`.
pub fn food_tick_of(t: &CityLoopTick) -> CityEconomyTick {
    CityEconomyTick {
        city_id: t.city_id.clone(),
        owner_id: t.owner_id,
        oblegany: t.oblegany,
        zywnosc_brutto: Some(t.zywnosc_brutto),
        zywnosc_netto: t.zywnosc_netto,
        koszt_racji: Some(t.koszt_racji),
        bilans_lokalny: Some(t.bilans_lokalny),
        poziom_racji: Some(t.poziom_racji),
        zdrowie: t.zdrowie,
        spichlerz_ceramika: Some(t.spichlerz_ceramika),
        spichlerz_sol: Some(t.spichlerz_sol),
        ma_spichlerz: Some(t.ma_spichlerz),
        ma_spichlerz_ii: Some(t.ma_spichlerz_ii),
        wzrost_procent: t.wzrost_procent,
        owner_era: Some(t.owner_era),
        ..CityEconomyTick::default()
    }
}

/// Zapis pol zmienianych przez `recomputeCityFoodBalancesInEcon` z powrotem do ticku petli.
fn write_back_food(dst: &mut CityLoopTick, src: &CityEconomyTick) {
    if let Some(v) = src.koszt_racji {
        dst.koszt_racji = v;
    }
    if let Some(v) = src.bilans_lokalny {
        dst.bilans_lokalny = v;
    }
    dst.zywnosc_netto = src.zywnosc_netto;
    if let Some(v) = src.poziom_racji {
        dst.poziom_racji = v;
    }
}

/// Wejscia bloku (stan gry + dane + resolvery weba).
pub struct EmpireFoodBlockCtx<'a> {
    pub econ_params: &'a Value,
    pub difficulty: &'a str,
    pub matrix: &'a CivMatrixFile,
    pub unit_rows: &'a [UnitRow],
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    pub owner_civ_by_owner_id: &'a BTreeMap<i64, String>,
    /// Migawka `econUnits` z poczatku tury (przed atrycja).
    pub econ_units: &'a [FoodUnit],
    /// `humanSeats.humanOwnerIds` (kolejnosc petli clampu).
    pub human_owner_ids: &'a [i64],
    /// `typCityCopyOwners` (miasta-panstwa klastra).
    pub typ_city_copy_owners: &'a BTreeSet<i64>,
    /// `empireEpochForOwner`.
    pub owner_era: &'a dyn Fn(i64) -> f64,
    /// `unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {})`.
    pub unit_health_by_type: &'a dyn Fn(&str) -> f64,
    /// `effectiveRuntimeUnitMaxHp(u)` dla `syncAllRuntimeUnitHpState`.
    pub runtime_max_hp: &'a dyn Fn(&AttritionUnit) -> f64,
}

/// Stan zmienny bloku.
pub struct EmpireFoodBlockState<'a> {
    pub states: &'a mut OwnerFoodStates,
    pub runtime: &'a mut EmpireFoodRuntime,
    pub units: &'a mut Vec<AttritionUnit>,
    pub siege_cities: &'a mut Vec<SiegeCityState>,
    pub besieger_by_city: &'a mut BTreeMap<String, i64>,
}

/// Wynik bloku.
#[derive(Debug, Clone, PartialEq)]
pub struct EmpireFoodBlockOutcome {
    pub ef: EmpireFoodTickResult,
    pub auto_ration_any_adjusted: bool,
    /// `pendingAutoRationForNextTurn` (ostatni wynik korekty fotela czlowieka, ktory cos zmienil).
    pub pending_auto_ration: Option<AutoRationAdjustResult>,
    pub clamped_any: bool,
    /// `econ.totalZywnosc` po bloku (`None` = bez zmian wzgledem ticku).
    pub total_zywnosc: Option<f64>,
    pub destroyed_ids: Vec<String>,
    /// `playerDamagedCount` / `playerDestroyedCount` (`ownerId === 0`).
    pub player_damaged_count: usize,
    pub player_destroyed_count: usize,
    pub cleanup: StarvationCleanup,
    /// Czysta czesc N3 (atrycja garnizonu miast oblezonych, `main.ts:34986-35004`) - po EmpireFood, przed bankowaniem.
    pub siege_garrison: Vec<SiegeGarrisonLog>,
    /// `popCapByCityId` (diagnostyka bloku).
    pub pop_cap_by_city_id: BTreeMap<String, f64>,
    /// `hungerLossUlamkowy` per miasto po `ensureCityRationDefaults` (pole poza Rust `City`, wlasnosc `GrowthCity`).
    pub hunger_loss_by_city: BTreeMap<String, Option<f64>>,
    /// `militaryFoodConsumptionWithSpichlerz` per wlasciciel (wlasciciele miast, potem jednostek).
    pub koszt_armii_by_owner: BTreeMap<i64, f64>,
}

fn spichlerz_state_of(tick: Option<&CityEconomyTick>) -> SpichlerzCityBonusState {
    SpichlerzCityBonusState {
        ceramika_active: tick.and_then(|t| t.spichlerz_ceramika).unwrap_or(false),
        sol_active: tick.and_then(|t| t.spichlerz_sol).unwrap_or(false),
        ma_spichlerz_pop: tick.and_then(|t| t.ma_spichlerz).unwrap_or(false),
        ma_spichlerz_ii_pop: tick.and_then(|t| t.ma_spichlerz_ii).unwrap_or(false),
    }
}

/// `main.ts:34594-34850` (bez UI). Mutuje `cities` (`poziomRacji`), `tick` (pola zywnosci + `total_zywnosc`),
/// stany EmpireFood, jednostki i stan oblezenia.
pub fn run_empire_food_block(
    cities: &mut [City],
    tick: &mut EconomyTickResult,
    sol_army_by_owner: &BTreeSet<i64>,
    sol_city_ids_by_owner: &BTreeMap<i64, BTreeSet<String>>,
    ctx: &EmpireFoodBlockCtx<'_>,
    st: &mut EmpireFoodBlockState<'_>,
) -> EmpireFoodBlockOutcome {
    let difficulty = game_difficulty_from_web(ctx.difficulty).unwrap_or(GameDifficulty::Normal);
    let raw = raw_econ_for_upkeep(Some(ctx.econ_params));
    let diff_up = crate::domain::turn_economy_advance::difficulty_enum(ctx.difficulty);
    let upkeep_params = load_upkeep_params(&raw, diff_up);
    let food_table = build_unit_food_table(ctx.unit_rows);
    let ef_params = crate::domain::city_growth::p6_7a::empire_food::build_empire_food_params(
        ctx.econ_params,
        difficulty,
    );

    // robocza kopia ticku (podzbior pol) + miasta w opakowaniu `GrowthCity`
    let mut econ = FoodEconomy {
        per_city: tick.per_city.iter().map(food_tick_of).collect(),
        growth: tick.growth,
        starved: tick.starved,
    };
    let mut gcities: Vec<GrowthCity> = cities.iter().cloned().map(GrowthCity::new).collect();

    // ---- spichlerzByCityForAuto (:34594-34608) ----
    let mut spichlerz_by_city: BTreeMap<String, SpichlerzCityBonusState> = BTreeMap::new();
    for c in gcities.iter() {
        let t = econ.per_city.iter().find(|t| t.city_id == c.city.id);
        spichlerz_by_city.insert(c.city.id.clone(), spichlerz_state_of(t));
    }

    // ---- popCapByCityId (:34625-34636) ----
    let econ_cfg = load_econ_params(ctx.econ_params, ctx.difficulty);
    let pop_cap_params = PopCapParams {
        akwedukt_prog_ludnosci: econ_cfg.akwedukt_prog_ludnosci,
        spichlerz_prog_ludnosci: econ_cfg.spichlerz_prog_ludnosci,
        akwedukt_max_ludnosci: econ_cfg.akwedukt_max_ludnosci,
    };
    let mut pop_cap_by_city_id: BTreeMap<String, f64> = BTreeMap::new();
    for c in cities.iter() {
        let empty: Vec<String> = Vec::new();
        let built = ctx.built_by_city.get(&c.id).unwrap_or(&empty);
        let ma_akwedukt = built.iter().any(|b| b == "akwedukt");
        let ma_spichlerz = city_has_spichlerz_building(built);
        let civ_key = ctx
            .owner_civ_by_owner_id
            .get(&c.owner_id)
            .map(String::as_str);
        pop_cap_by_city_id.insert(
            c.id.clone(),
            city_population_cap(
                ma_akwedukt,
                ma_spichlerz,
                &pop_cap_params,
                resolve_population_cap_matrix_delta_in(ctx.matrix, civ_key),
            ),
        );
    }

    // ---- ownerIdsForAutoRation (:34637-34643) ----
    let mut owner_ids: Vec<i64> = Vec::new();
    for c in cities.iter() {
        if c.owner_id >= 0 && !owner_ids.contains(&c.owner_id) {
            owner_ids.push(c.owner_id);
        }
    }
    for oid in st.states.keys() {
        if oid >= 0 && !owner_ids.contains(&oid) {
            owner_ids.push(oid);
        }
    }

    let empty_set: BTreeSet<String> = BTreeSet::new();
    let is_human = |o: i64| ctx.human_owner_ids.contains(&o);
    let military_food = |owner: i64| -> f64 {
        military_food_consumption_with_spichlerz(
            ctx.econ_units,
            owner,
            &upkeep_params,
            &food_table,
            sol_army_by_owner.contains(&owner),
            sol_city_ids_by_owner.get(&owner).unwrap_or(&empty_set),
        )
    };

    let mut any_adjusted = false;
    let mut pending_auto_ration: Option<AutoRationAdjustResult> = None;
    for &owner_id in &owner_ids {
        let zapasy_przed = st.states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa);
        let koszt_armii = military_food(owner_id);
        let human = is_human(owner_id);
        let auto_result = auto_balance_rations_to_solvency(
            &AutoBalanceRationsOpts {
                owner_id,
                zapasy_przed,
                spichlerz_by_city: Some(&spichlerz_by_city),
                only_auto_managed: human,
                require_flow_balance: human,
                koszt_armii,
                pop_cap_by_city_id: Some(&pop_cap_by_city_id),
            },
            &mut gcities,
            &mut econ,
        );
        if auto_result.adjusted {
            any_adjusted = true;
            if human {
                pending_auto_ration = Some(auto_result);
            }
        }
        if !ctx.typ_city_copy_owners.contains(&owner_id) {
            let raise = auto_raise_rations_for_growth(
                &AutoRaiseRationsOpts {
                    owner_id,
                    zapasy_przed,
                    spichlerz_by_city: Some(&spichlerz_by_city),
                    require_production_surplus: human,
                    only_auto_managed: human,
                    koszt_armii,
                    pop_cap_by_city_id: Some(&pop_cap_by_city_id),
                },
                &mut gcities,
                &mut econ,
            );
            if raise.adjusted {
                any_adjusted = true;
            }
        }
    }
    let mut total_zywnosc: Option<f64> = None;
    if any_adjusted {
        total_zywnosc = Some(refresh_economy_food_totals(&econ.per_city));
    }

    // ---- clamp foteli czlowieka (:34710-34747) ----
    let mut clamped_any = false;
    for &h_oid in ctx.human_owner_ids {
        let zapasy0 = st.states.get(h_oid).map_or(0.0, |s| s.zapasy_panstwa);
        let ids: Vec<String> = gcities
            .iter()
            .filter(|c| c.city.owner_id == h_oid)
            .map(|c| c.city.id.clone())
            .collect();
        for cid in ids {
            let max_safe = max_safe_poziom_racji_for_city(
                &MaxSafePoziomOpts {
                    city_id: cid.clone(),
                    owner_id: h_oid,
                    zapasy_przed: zapasy0,
                    spichlerz_by_city: Some(&spichlerz_by_city),
                    // Z-EF-6: web nie podaje kosztArmii ani humanOwnerIds (domyslne 0 i [0])
                    koszt_armii: 0.0,
                    pop_cap_by_city_id: Some(&pop_cap_by_city_id),
                    human_owner_ids: vec![0],
                },
                &mut gcities,
                &mut econ,
            );
            if let Some(gc) = gcities.iter_mut().find(|c| c.city.id == cid) {
                let cur = get_city_ration_level(&gc.city);
                if cur > max_safe {
                    gc.city.poziom_racji = Some(max_safe);
                    clamped_any = true;
                }
            }
        }
    }
    if clamped_any {
        recompute_city_food_balances_in_econ(
            &mut econ.per_city,
            &gcities,
            Some(&spichlerz_by_city),
        );
        total_zywnosc = Some(refresh_economy_food_totals(&econ.per_city));
    }

    // ---- advanceEmpireFood (:34749) ----
    let unit_owner_ids: Vec<i64> = ctx.econ_units.iter().map(|u| u.owner_id).collect();
    let mut military = military_food;
    let ef = advance_empire_food(
        &econ,
        &unit_owner_ids,
        st.states,
        &ef_params,
        Some(ctx.built_by_city),
        Some(ctx.owner_era),
        &mut military,
        st.runtime,
    );

    // ---- zapis z powrotem: miasta i tick petli ----
    for (dst, src) in cities.iter_mut().zip(gcities.iter()) {
        *dst = src.city.clone();
    }
    for src in &econ.per_city {
        if let Some(dst) = tick.per_city.iter_mut().find(|d| d.city_id == src.city_id) {
            write_back_food(dst, src);
        }
    }
    if let Some(t) = total_zywnosc {
        tick.total_zywnosc = t;
    }

    // ---- atrycja (:34777-34830) ----
    let mut destroyed_all: Vec<String> = Vec::new();
    let mut player_damaged = 0usize;
    let mut player_destroyed = 0usize;
    for u in st.units.iter_mut() {
        let mx = (ctx.runtime_max_hp)(u);
        sync_runtime_unit_hp_state(u, mx);
    }
    for t in &ef.per_owner {
        if !t.glod_wojska_atrycja_aktywna {
            continue;
        }
        let starv = apply_army_starvation_hp_loss(
            st.units,
            t.owner_id,
            ef_params.glod_wojska_hp_frac,
            ctx.unit_health_by_type,
        );
        if t.owner_id == 0 {
            player_damaged += starv.damaged_count;
            player_destroyed += starv.destroyed_ids.len();
        }
        destroyed_all.extend(starv.destroyed_ids);
    }
    let cleanup = cleanup_after_starvation_destroy(
        st.units,
        st.siege_cities,
        st.besieger_by_city,
        &destroyed_all,
    );

    // ---- N3 (:34986-35004): atrycja garnizonu miast oblezonych (po EmpireFood, przed bankowaniem) ----
    let besieged: Vec<String> = tick
        .per_city
        .iter()
        .filter(|t| t.oblegany)
        .map(|t| t.city_id.clone())
        .collect();
    let siege_garrison = siege_turn_garrison_attrition(
        st.units,
        st.siege_cities,
        &besieged,
        ef_params.glod_wojska_hp_frac,
        ctx.unit_health_by_type,
    );

    let hunger_loss_by_city: BTreeMap<String, Option<f64>> = gcities
        .iter()
        .map(|g| (g.city.id.clone(), g.hunger_loss_ulamkowy))
        .collect();
    let mut koszt_armii_by_owner: BTreeMap<i64, f64> = BTreeMap::new();
    for o in cities
        .iter()
        .map(|c| c.owner_id)
        .chain(ctx.econ_units.iter().map(|u| u.owner_id))
    {
        koszt_armii_by_owner.entry(o).or_insert_with(|| {
            military_food_consumption_with_spichlerz(
                ctx.econ_units,
                o,
                &upkeep_params,
                &food_table,
                sol_army_by_owner.contains(&o),
                sol_city_ids_by_owner.get(&o).unwrap_or(&empty_set),
            )
        });
    }

    EmpireFoodBlockOutcome {
        ef,
        auto_ration_any_adjusted: any_adjusted,
        pending_auto_ration,
        clamped_any,
        total_zywnosc,
        destroyed_ids: destroyed_all,
        player_damaged_count: player_damaged,
        player_destroyed_count: player_destroyed,
        cleanup,
        siege_garrison,
        pop_cap_by_city_id,
        hunger_loss_by_city,
        koszt_armii_by_owner,
    }
}
