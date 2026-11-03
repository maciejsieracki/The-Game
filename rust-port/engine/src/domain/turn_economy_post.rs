//! R-RUSTPORT-P6-ECON-TICK-POST-Q1: etapy kroku ekonomii tury PO bankowaniu skarbca/nauki, 1:1 z webem
//! (pin `4bbef081d`, `gra/src/main.ts`). Inwentarz krok -> web -> Rust: `dyspozycje/rust-port/p6/P6-ECON-TICK-POST.md`.
//!
//! Zaportowane tutaj (kolejnosc weba):
//! 1. [`run_gold_deficit_step`] - `main.ts:35250-35354` (`advanceGoldDeficit` + `applyGoldDeficitHpLoss` + sprzatanie),
//! 2. [`run_post_central_growth`] - `main.ts:36009-36092` (`applyPostCentralPopulationGrowth` z `growthMultMap`
//!    i `manpowerMaxMultByOwnerId`; dlug ORDER-LANE `-Q2`, `main.ts:36071`),
//! 3. [`apply_praca_upkeep_post`] - `main.ts:36093-36118` (upkeep Pracy ulepszen, `Math.max(0, ...)`).
//!
//! Kolejnosc w webie: bankowanie (`:35057-35246`) -> deficyt Zlota (`:35250`) -> petla per miasto MIASTO
//! (`:35358-36092`, wewnatrz niej wzrost po centrali `:36009`) -> upkeep Pracy (`:36097`). Funkcje sa osobne, bo
//! petla per miasto (kultura/religia/porzadek/produkcja) nie jest czescia tego tematu (zob. inwentarz).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::data::civilizations::CivMatrixFile;
use crate::domain::city_growth::p6_7a::empire_food::build_empire_food_params;
use crate::domain::city_growth::p6_7a::growth_v85::{PopulationChangeHooks, PostCentralGrowthOpts};
use crate::domain::city_growth::p6_7a::{
    apply_post_central_population_growth_ext, game_difficulty_from_web, CityEconomyTick,
    EconomyTickResult as FoodEconomy, EmpireFoodTickResult, GameDifficulty, GrowthCity,
    PopCapParams, PopulationMatrixResolved, PostCentralGrowthExt, SpichlerzCityBonusState,
};
use crate::domain::economy_city_params::load_econ_params;
use crate::domain::recruitment::manpower::is_civilian_unit;
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::turn_economy::gold_deficit::{
    apply_gold_deficit_hp_loss, fresh_gold_deficit_state, GoldDeficitParams, GoldDeficitRuntime,
    GoldDeficitState, GoldDeficitTickResult, GoldDeficitUnit,
};
use crate::domain::turn_economy_attrition::{
    cleanup_after_starvation_destroy, AttritionUnit, SiegeCityState, StarvationCleanup,
};
use crate::domain::turn_economy_loop::CityLoopExtra;
use crate::domain::turn_economy_tick::EconomyTickResult;

const BARBARIAN_OWNER_ID: i64 = -1;
const REBEL_FACTION_OWNER_ID: i64 = -99;

// ---------------------------------------------------------------------------------------------------------------
// 1. Deficyt Zlota (main.ts:35250-35354)
// ---------------------------------------------------------------------------------------------------------------

/// Wejscia kroku deficytu Zlota.
pub struct GoldDeficitStepInput<'a> {
    /// `buildGoldDeficitParams(data.econParams, difficulty)`.
    pub params: &'a GoldDeficitParams,
    /// `humanSeats.humanOwnerIds` (`isAiOwner`: nie czlowiek, nie -1, nie -99).
    pub human_owner_ids: &'a BTreeSet<i64>,
    /// `ownerTreasury(ownerId)` - MUSI czytac Skarbiec PO zbankowaniu (`main.ts:35251-35254`).
    pub owner_treasury: &'a dyn Fn(i64) -> f64,
    /// `unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {})`.
    pub unit_health_by_type: &'a dyn Fn(&str) -> f64,
}

/// Wynik kroku (dane zamiast komunikatow HUD; HUD = poza silnikiem).
#[derive(Debug, Clone, PartialEq)]
pub struct GoldDeficitStepOutcome {
    /// `gdOwnerIds` po odfiltrowaniu barbarzyncow (kolejnosc iteracji weba).
    pub owner_ids: Vec<i64>,
    pub tick: GoldDeficitTickResult,
    pub destroyed_ids: Vec<String>,
    /// `gdPlayerDamagedCount` / `gdPlayerDestroyedCount` (tylko `ownerId === 0`).
    pub player_damaged_count: usize,
    pub player_destroyed_count: usize,
    pub cleanup: StarvationCleanup,
}

/// `main.ts:35255-35354` bez UI (`refreshFog`, `syncUnitsRender`, `showHintMessage`).
pub fn run_gold_deficit_step(
    cities: &[City],
    states: &mut BTreeMap<i64, GoldDeficitState>,
    runtime: &mut GoldDeficitRuntime,
    units: &mut Vec<AttritionUnit>,
    siege_cities: &mut Vec<SiegeCityState>,
    besieger_by_city: &mut BTreeMap<String, i64>,
    input: &GoldDeficitStepInput<'_>,
) -> GoldDeficitStepOutcome {
    // `gdAiOwnerIds`: Set w kolejnosci pierwszego wystapienia miasta.
    let mut ai_ids: Vec<i64> = Vec::new();
    for c in cities {
        let o = c.owner_id;
        let is_ai = !input.human_owner_ids.contains(&o)
            && o != BARBARIAN_OWNER_ID
            && o != REBEL_FACTION_OWNER_ID;
        if is_ai && !ai_ids.contains(&o) {
            ai_ids.push(o);
        }
    }
    // `new Set([0, ...gdAiOwnerIds, ...goldDeficitStates.keys()])` (klucze Map = kolejnosc wstawiania; tu rosnaco).
    let mut gd_owner_ids: Vec<i64> = vec![0];
    for o in ai_ids {
        if !gd_owner_ids.contains(&o) {
            gd_owner_ids.push(o);
        }
    }
    for &k in states.keys() {
        if !gd_owner_ids.contains(&k) {
            gd_owner_ids.push(k);
        }
    }
    for &oid in &gd_owner_ids {
        if oid == BARBARIAN_OWNER_ID {
            continue;
        }
        states.entry(oid).or_insert_with(fresh_gold_deficit_state);
    }
    let owner_ids: Vec<i64> = gd_owner_ids
        .into_iter()
        .filter(|&o| o != BARBARIAN_OWNER_ID)
        .collect();
    let tick = runtime.advance(&owner_ids, states, input.owner_treasury, input.params);

    let mut destroyed_ids: Vec<String> = Vec::new();
    let mut player_damaged = 0usize;
    let mut player_destroyed = 0usize;
    for t in &tick.per_owner {
        if !t.zloto_deficyt_atrycja_aktywna {
            continue;
        }
        // `applyGoldDeficitHpLoss` na wspolnej liscie jednostek (widok `GoldDeficitUnit`, zapis z powrotem).
        let mut view: Vec<GoldDeficitUnit> = units
            .iter()
            .map(|u| GoldDeficitUnit {
                id: u.id.clone(),
                owner_id: u.owner_id,
                type_id: u.type_id.clone(),
                civilian: is_civilian_unit(&u.category, &u.type_id),
                hp: u.hp,
                hp_max: u.hp_max,
            })
            .collect();
        let res = apply_gold_deficit_hp_loss(
            &mut view,
            t.owner_id,
            input.params.zloto_deficyt_hp_frac,
            input.unit_health_by_type,
        );
        for (dst, src) in units.iter_mut().zip(view.iter()) {
            dst.hp = src.hp;
            dst.hp_max = src.hp_max;
        }
        if t.owner_id == 0 {
            player_damaged += res.damaged_count;
            player_destroyed += res.destroyed_ids.len();
        }
        destroyed_ids.extend(res.destroyed_ids);
    }
    // Identyczne sprzatanie oblezenia/garnizonu co atrycja glodu wojska (`main.ts:35311-35340`).
    let cleanup = cleanup_after_starvation_destroy(
        units,
        siege_cities,
        besieger_by_city,
        &destroyed_ids,
    );
    GoldDeficitStepOutcome {
        owner_ids,
        tick,
        destroyed_ids,
        player_damaged_count: player_damaged,
        player_destroyed_count: player_destroyed,
        cleanup,
    }
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Wzrost populacji po centrali (main.ts:36009-36092)
// ---------------------------------------------------------------------------------------------------------------

/// Wejscia wzrostu po centrali. Mapy `happiness`/`citizen` to wynik petli Porzadku (`cityOrderState`).
pub struct PostGrowthInput<'a> {
    pub econ_params: &'a Value,
    pub difficulty: &'a str,
    pub matrix: &'a CivMatrixFile,
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    /// `ownerCivMap`.
    pub owner_civ_by_owner_id: &'a BTreeMap<i64, String>,
    /// `happinessByCityId` (`st.szczescie`).
    pub happiness_by_city_id: &'a BTreeMap<String, f64>,
    /// `citizenGrowthPctByCityId` (`st.citizenUpkeep?.growthPctDelta ?? 0`).
    pub citizen_growth_pct_by_city_id: &'a BTreeMap<String, f64>,
    /// `growthMultMap` z `compute_order_lane` (`order_effects_lane`).
    pub growth_mult_map: &'a BTreeMap<String, f64>,
    /// `manpowerMaxMultByOwnerId` (po `ownerCivMap.keys()`).
    pub manpower_max_mult_by_owner_id: &'a BTreeMap<i64, f64>,
    /// `new Map([...new Set(cities.map(c => c.ownerId))].map(oid => [oid, empireEpochForOwner(oid)]))`.
    pub owner_era_by_owner: &'a BTreeMap<i64, f64>,
    /// `populationMatrixByOwnerId` (web: pole fixture; produkcja = `None`).
    pub population_matrix_by_owner_id: Option<&'a BTreeMap<i64, PopulationMatrixResolved>>,
    /// `computeLostToNearerSiblingByCity`.
    pub exclude_hex_keys_by_city: Option<&'a BTreeMap<String, BTreeSet<String>>>,
}

/// Wynik wzrostu: miasta, ktorych populacja sie zmienila (kolejnosc wywolan `onCityPopulationChanged`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct PostGrowthOutcome {
    pub changed_city_ids: Vec<String>,
}

struct CollectHooks<'a> {
    inner: &'a mut dyn PopulationChangeHooks,
    changed: Vec<String>,
}

impl PopulationChangeHooks for CollectHooks<'_> {
    fn rebalance_workers_after_population_change(
        &mut self,
        city: &mut GrowthCity,
        pop_before: f64,
        pop_after: f64,
        exclude_hex_keys: Option<&BTreeSet<String>>,
    ) {
        self.inner
            .rebalance_workers_after_population_change(city, pop_before, pop_after, exclude_hex_keys);
    }

    fn on_city_population_changed(&mut self, city_id: &str) {
        self.changed.push(city_id.to_string());
        self.inner.on_city_population_changed(city_id);
    }
}

/// `if (lastEfTickResult) { ... applyPostCentralPopulationGrowth(...) }` (`main.ts:36010-36081`).
///
/// Mutuje `cities` (populacja, `wzrostUlamkowy`, `turyBezDoplaty`), `extras[..].manpower`, `hunger_loss`
/// (`hungerLossUlamkowy`), pola ticku petli (`ludnoscPo`, `wzrost`, `ubytek`, `wzrostProcent`, `wzrostUlamkowyPo`,
/// `magazynPoTurze`, `growth`, `starved`) oraz wiersze `ef` (`wzrostProcent`, `breakdown`, `nakarmione`, `name`).
pub fn run_post_central_growth(
    cities: &mut [City],
    extras: &mut BTreeMap<String, CityLoopExtra>,
    hunger_loss: &mut BTreeMap<String, Option<f64>>,
    tick: &mut EconomyTickResult,
    ef: &mut EmpireFoodTickResult,
    input: &PostGrowthInput<'_>,
    hooks: &mut dyn PopulationChangeHooks,
) -> PostGrowthOutcome {
    let difficulty = game_difficulty_from_web(input.difficulty).unwrap_or(GameDifficulty::Normal);
    let econ_cfg = load_econ_params(input.econ_params, input.difficulty);
    let ef_params = build_empire_food_params(input.econ_params, difficulty);

    // `spichlerzByCity` z ticku (`main.ts:36028-36035`).
    let mut spichlerz_by_city: BTreeMap<String, SpichlerzCityBonusState> = BTreeMap::new();
    for c in cities.iter() {
        let t = tick.per_city.iter().find(|t| t.city_id == c.id);
        spichlerz_by_city.insert(
            c.id.clone(),
            SpichlerzCityBonusState {
                ceramika_active: t.is_some_and(|t| t.spichlerz_ceramika),
                sol_active: t.is_some_and(|t| t.spichlerz_sol),
                ma_spichlerz_pop: t.is_some_and(|t| t.ma_spichlerz),
                ma_spichlerz_ii_pop: t.is_some_and(|t| t.ma_spichlerz_ii),
            },
        );
    }
    let mut econ = FoodEconomy {
        per_city: tick
            .per_city
            .iter()
            .map(crate::domain::turn_economy_empirefood::food_tick_of)
            .collect(),
        growth: tick.growth,
        starved: tick.starved,
    };
    let mut gcities: Vec<GrowthCity> = cities
        .iter()
        .cloned()
        .map(|c| {
            let id = c.id.clone();
            let mut g = GrowthCity::new(c);
            g.hunger_loss_ulamkowy = hunger_loss.get(&id).copied().flatten();
            g.manpower = extras.get(&id).and_then(|e| e.manpower);
            g
        })
        .collect();

    let opts = PostCentralGrowthOpts {
        pop_cap_params: PopCapParams {
            akwedukt_prog_ludnosci: econ_cfg.akwedukt_prog_ludnosci,
            spichlerz_prog_ludnosci: econ_cfg.spichlerz_prog_ludnosci,
            akwedukt_max_ludnosci: econ_cfg.akwedukt_max_ludnosci,
        },
        ration_params: ef_params.ration_params,
        owner_civ_by_owner_id: Some(input.owner_civ_by_owner_id),
        spichlerz_by_city: Some(&spichlerz_by_city),
        happiness_by_city_id: Some(input.happiness_by_city_id),
        built_by_city: Some(input.built_by_city),
        owner_era_by_owner: Some(input.owner_era_by_owner),
        difficulty: Some(difficulty),
        population_matrix_by_owner_id: input.population_matrix_by_owner_id,
        civ_bonusy_by_owner: None,
        citizen_growth_pct_by_city_id: Some(input.citizen_growth_pct_by_city_id),
        exclude_hex_keys_by_city: input.exclude_hex_keys_by_city,
    };
    let ext = PostCentralGrowthExt {
        order_growth_mult_by_city: Some(input.growth_mult_map),
        manpower_max_mult_by_owner_id: Some(input.manpower_max_mult_by_owner_id),
        pin_matrix: Some(input.matrix),
    };
    let mut collect = CollectHooks {
        inner: hooks,
        changed: Vec::new(),
    };
    apply_post_central_population_growth_ext(
        &mut gcities,
        &mut econ,
        &mut ef.per_owner,
        &opts,
        &ext,
        &mut collect,
    );

    // ---- zapis z powrotem ----
    for (dst, src) in cities.iter_mut().zip(gcities.iter()) {
        *dst = src.city.clone();
        hunger_loss.insert(src.city.id.clone(), src.hunger_loss_ulamkowy);
        if let Some(e) = extras.get_mut(&src.city.id) {
            e.manpower = src.manpower;
        }
    }
    for src in &econ.per_city {
        if let Some(dst) = tick.per_city.iter_mut().find(|d| d.city_id == src.city_id) {
            write_back_growth(dst, src);
        }
    }
    tick.growth = econ.growth;
    tick.starved = econ.starved;
    PostGrowthOutcome {
        changed_city_ids: collect.changed,
    }
}

fn write_back_growth(
    dst: &mut crate::domain::turn_economy_loop::CityLoopTick,
    src: &CityEconomyTick,
) {
    if let Some(v) = src.ludnosc_po {
        dst.ludnosc_po = v;
    }
    if let Some(v) = src.wzrost {
        dst.wzrost = v;
    }
    if let Some(v) = src.ubytek {
        dst.ubytek = v;
    }
    if let Some(v) = src.wzrost_procent {
        dst.wzrost_procent = Some(v);
    }
    if let Some(v) = src.wzrost_ulamkowy_po {
        dst.wzrost_ulamkowy_po = Some(v);
    }
    if let Some(v) = src.magazyn_po_turze {
        dst.magazyn_po_turze = v;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Upkeep Pracy ulepszen (main.ts:36093-36118)
// ---------------------------------------------------------------------------------------------------------------

/// Pule Pracy po upkeepie. Web: `playerPracaPool` (owner 0) i `aiPracaPoolByOwner` (KAZDY inny owner, takze
/// drugi fotel czlowieka - 1:1, `main.ts:36108-36113`: `if (oid === 0 || up <= 0) continue`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct PostPracaPools {
    pub player_praca_pool: f64,
    pub ai_praca_pool_by_owner: BTreeMap<i64, f64>,
}

/// Wynik: `_lastPracaUpkeep` i skladnik `_lastPracaRate` (`-= playerUpkeep`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PracaUpkeepOutcome {
    pub last_praca_upkeep: f64,
    /// Odjecie od `_lastPracaRate` (`playerUpkeep` surowe, takze gdy `<= 0`).
    pub last_praca_rate_delta: f64,
}

/// `econ.pracaUpkeepByOwner` -> pule.
pub fn apply_praca_upkeep_post(
    pools: &mut PostPracaPools,
    praca_upkeep_by_owner: &BTreeMap<i64, f64>,
) -> PracaUpkeepOutcome {
    let player_upkeep = praca_upkeep_by_owner.get(&0).copied().unwrap_or(0.0);
    if player_upkeep > 0.0 {
        pools.player_praca_pool = js_max0(pools.player_praca_pool - player_upkeep);
    }
    for (&oid, &up) in praca_upkeep_by_owner {
        if oid == 0 || up <= 0.0 {
            continue;
        }
        let cur = pools.ai_praca_pool_by_owner.get(&oid).copied().unwrap_or(0.0);
        pools
            .ai_praca_pool_by_owner
            .insert(oid, js_max0(cur - up));
    }
    PracaUpkeepOutcome {
        last_praca_upkeep: player_upkeep,
        last_praca_rate_delta: -player_upkeep,
    }
}

/// `Math.max(0, x)` (NaN -> NaN, `-0` -> `0`).
fn js_max0(x: f64) -> f64 {
    crate::domain::recruitment::army_merge::js_max(0.0, x)
}

/// Pomocnik testowy: `load_econ_params` wymaga `&Value`; eksport dla spojnosci z `turn_economy_wire`.
pub fn pop_cap_params_of(econ_params: &Value, difficulty: &str) -> PopCapParams {
    let c = load_econ_params(econ_params, difficulty);
    PopCapParams {
        akwedukt_prog_ludnosci: c.akwedukt_prog_ludnosci,
        spichlerz_prog_ludnosci: c.spichlerz_prog_ludnosci,
        akwedukt_max_ludnosci: c.akwedukt_max_ludnosci,
    }
}
