//! R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1: pętla porządku publicznego (lane "Porządku") 1:1 z
//! `gra/src/main.ts:35358-35789` (pin `4bbef081d`), produkująca `orderMultMap` (+ `orderValueMap`,
//! `growthMultMap`, `cityRelig`) dla `run_economy_tick_for_game`.
//!
//! Funkcje czyste (pin): `orderEffectsWithCivMatrix` (`order.ts:162`), `post-capture-law.ts`
//! (`markCityRebellionStarted`, `tickPostCaptureLawEndOfTurn`, `tickRebelProtectionEndOfTurn`,
//! `applyPostCaptureLawOverride`, `shouldSuppressRevoltDuringPostCaptureLaw`), `countLawGarrisonOnCityHex`
//! (`armyMerge.ts:991`), `isOwnerAtWarInRelations` (`diplomacy.ts:82`).
//! Sklejka `main.ts` (zamknięcia) jest przepisana w [`compute_order_lane`] z numerami linii.
//!
//! ZAŁOŻENIA (do akceptacji):
//! - Z-OL-4: wejścia wołającego (zamknięcia weba spoza pętli): `econ.perCity` (`kultura`, `wealthZadowolenie`,
//!   `garncarniaSurplusZadowolenie`, `maSpichlerz*`), `ownerReligionForOwnerId`, `empireEpochForOwner`,
//!   `unlockedTechSetForOwner`, `wonderCityYieldBonusForOwner(...).zadowolenie`, `effectivePodzialHandlu.procentLuksus`,
//!   `units`, `diplomacyRelations`, `isHuman`, `capitalCityIdByOwner`.
//! - Z-OL-5: `populationMatrixByOwnerId` (cache weba) pominięty: zawsze `resolvePopulationMatrixForCiv(ownerCivMap)`
//!   (cache jest tą samą funkcją z `ownerCivMap`; różnica tylko przy ręcznym nadpisaniu poza pętlą).
//! - Z-OL-6: efekty uboczne UI (`console.log`, `showHintMessage`) pominięte; `seedCityOwnerDefaults(city)` po buncie
//!   zgłaszane w [`OrderLaneOutput::rebelled_city_ids`] (wołający wywołuje `seed_city_owner_defaults_podzial`).
//! - Z-OL-7: `console.log`/`lastReligionSpreadByCity` (tylko UI) pominięte.
//! - Z-OL-8: `tickCityCultureReligion` + `convertCulture`/`convertViaTemple` reużywają `terrain::conquest_stability`
//!   (8J) z wstrzykniętymi domknięciami z `order_effects_culture`.

use std::collections::{BTreeMap, BTreeSet, HashSet};

use serde_json::Value;

use crate::data::buildings_tech::Building;
use crate::data::civilizations::CivMatrixFile;
use crate::data::economy_society::CitizenResourceUpkeep;
use crate::domain::building_costs::p6_7b::{
    deduct_building_stock_cost_across_cities, owner_resource_stock_all, StockCitySource,
    StockRecord,
};
use crate::domain::civ_matrix::civ_matrix_param;
use crate::domain::economy_city_fns::{
    sum_building_happiness_from_built_ids, HappinessCatalogEntry,
};
use crate::domain::order_effects_culture::{
    accumulate_culture, apply_culture_religion_pressure_to_target, convert_culture_share,
    convert_via_temple, culture_accrual_with_modifier, culture_happiness, load_culture_params,
    load_culture_pressure_rate, load_religion_params, make_rng, religion_happiness,
    religion_params_with_spread_modifier, resolve_city_religion_state, spread_religion,
    CultureParams, PressureCity, ReligionNeighbor, ReligionParams,
};
use crate::domain::production_units::{building_level_for_epoch, city_palac_tier};
use crate::domain::resource_access::capital_labels::{stolica_easy_bonus_active, CapitalCityView};
use crate::domain::resource_access::society_inputs::is_foreign_religion_dominant;
use crate::domain::resource_access::{
    city_culture_mix_active, resolve_own_culture_share, CultureMixFields,
};
use crate::domain::resource_production::{
    compute_citizen_resource_drain, CitizenResourceDrainResult,
};
use crate::domain::society_breakdown::{
    apply_civ_matrix_happiness_modifier, compute_por_pct, evaluate_order_from_breakdown,
    is_osiedle_revolt_immune, load_revolt_params, order_effects_from_por_pct, por_pct_band,
    tier_from_por_pct, update_revolt_grace, HappinessBreakdownInput, LawBreakdownInput,
    OrderPctBreakdown, RevoltGraceState, SocietyLine,
};
use crate::domain::terrain::city_range_for_population;
use crate::domain::terrain::conquest_stability::{
    conquest_revolt_risk_multiplier, tick_city_culture_religion, CultureBuildings, CultureCity,
    ReligionBuildings, ReligionConversion,
};
use crate::domain::territory::ReligionState;
use crate::domain::turn_economy_inputs_state::city_found_order;
use crate::domain::turn_economy_loop::OrderYieldMults;
use crate::domain::types::porzadek::{
    load_order_params, order_effects_to_yield_mults, pick_revolt_migration_target, OrderEffects,
    RevoltMigrationCity,
};
use crate::domain::types::Difficulty;

/// Web `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`).
pub const REBEL_FACTION_OWNER_ID: i64 = -99;
/// Web `BARBARIAN_OWNER_ID` (`barbarians.ts:51`).
pub const BARBARIAN_OWNER_ID: i64 = -1;
/// Web `REBEL_PROTECTION_TURNS` (`post-capture-law.ts:33`).
pub const REBEL_PROTECTION_TURNS: f64 = 20.0;
/// Web `POST_CAPTURE_LAW_PCT` (`post-capture-law.ts:25`).
pub const POST_CAPTURE_LAW_PCT: f64 = 100.0;
/// Web `stolicaEasyBonusActive(..., maxTur = 10)` wołane z `main.ts:35595` z literałem `10`.
const STOLICA_EASY_MAX_TUR: f64 = 10.0;

// ---------------------------------------------------------------------------------------------
// order.ts:162 orderEffectsWithCivMatrix
// ---------------------------------------------------------------------------------------------

/// Web `Partial<Record<'porzadek_*_proc', number>>`; `None` = klucz nieobecny (`Number.isFinite(undefined)=false`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CivOrderModifiers {
    pub porzadek_produkcja_proc: Option<f64>,
    pub porzadek_pieniadz_proc: Option<f64>,
    pub porzadek_nauka_proc: Option<f64>,
    pub porzadek_kultura_proc: Option<f64>,
    pub porzadek_wzrost_proc: Option<f64>,
}

fn js_max(a: f64, b: f64) -> f64 {
    crate::domain::civ_matrix::js_compat::js_max(a, b)
}

/// Web `orderEffectsWithCivMatrix` (`order.ts:162-179`).
pub fn order_effects_with_civ_matrix(
    effects: &OrderEffects,
    modifiers: &CivOrderModifiers,
) -> OrderEffects {
    let apply = |base: f64, modifier: Option<f64>| -> f64 {
        let factor = match modifier {
            Some(m) if m.is_finite() => js_max(0.0, 1.0 + m),
            _ => 1.0,
        };
        js_max(0.0, base * factor)
    };
    OrderEffects {
        production_mult: apply(effects.production_mult, modifiers.porzadek_produkcja_proc),
        pieniadz_mult: apply(effects.pieniadz_mult, modifiers.porzadek_pieniadz_proc),
        trade_mult: apply(effects.trade_mult, modifiers.porzadek_pieniadz_proc),
        nauka_mult: apply(effects.nauka_mult, modifiers.porzadek_nauka_proc),
        kultura_mult: apply(effects.kultura_mult, modifiers.porzadek_kultura_proc),
        growth_mult: apply(effects.growth_mult, modifiers.porzadek_wzrost_proc),
        revolt_risk: effects.revolt_risk,
    }
}

// ---------------------------------------------------------------------------------------------
// post-capture-law.ts
// ---------------------------------------------------------------------------------------------

/// Pola `PostCaptureLawCity` (`post-capture-law.ts:35`); `None` = pole nieobecne.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct PostCaptureLawFields {
    pub post_capture_law_turns_remaining: Option<f64>,
    pub was_rebellion_reconquest: bool,
    pub rebel_previous_owner_id: Option<i64>,
    pub rebel_protection_turns_remaining: Option<f64>,
}

/// Web `markCityRebellionStarted` (`post-capture-law.ts:47`).
pub fn mark_city_rebellion_started(f: &mut PostCaptureLawFields, owner_id: i64) {
    f.rebel_previous_owner_id = Some(owner_id);
    f.rebel_protection_turns_remaining = Some(REBEL_PROTECTION_TURNS);
}

/// Web `isPostCaptureLawActive` (`post-capture-law.ts:83`): `typeof n === 'number' && n > 0`.
pub fn is_post_capture_law_active(f: &PostCaptureLawFields) -> bool {
    f.post_capture_law_turns_remaining.is_some_and(|n| n > 0.0)
}

/// Web `shouldSuppressRevoltDuringPostCaptureLaw` (`post-capture-law.ts:166`).
pub fn should_suppress_revolt_during_post_capture_law(f: &PostCaptureLawFields) -> bool {
    is_post_capture_law_active(f)
}

/// Web `tickPostCaptureLawEndOfTurn` (`post-capture-law.ts:89`).
pub fn tick_post_capture_law_end_of_turn(f: &mut PostCaptureLawFields) {
    let Some(n) = f.post_capture_law_turns_remaining.filter(|n| *n > 0.0) else {
        return;
    };
    let next = n - 1.0;
    if next <= 0.0 {
        f.post_capture_law_turns_remaining = None;
        f.was_rebellion_reconquest = false;
    } else {
        f.post_capture_law_turns_remaining = Some(next);
    }
}

/// Web `tickRebelProtectionEndOfTurn` (`post-capture-law.ts:104`).
pub fn tick_rebel_protection_end_of_turn(f: &mut PostCaptureLawFields) {
    let Some(n) = f.rebel_protection_turns_remaining.filter(|n| *n > 0.0) else {
        return;
    };
    let next = n - 1.0;
    f.rebel_protection_turns_remaining = if next <= 0.0 { None } else { Some(next) };
}

/// Web `postCaptureLawBannerLabel` (`post-capture-law.ts:115`).
pub fn post_capture_law_banner_label(f: &PostCaptureLawFields) -> Option<String> {
    let n = f.post_capture_law_turns_remaining?;
    if !is_post_capture_law_active(f) {
        return None;
    }
    let n_s = crate::domain::society_breakdown::js_num_str(n);
    if f.was_rebellion_reconquest {
        Some(format!("Odbicie po buncie — Prawo 100% ({n_s} tur)"))
    } else {
        Some(format!("Po podboju — Prawo 100% ({n_s} tur)"))
    }
}

/// Web `applyPostCaptureLawOverride` (`post-capture-law.ts:125`).
pub fn apply_post_capture_law_override(
    ord_pct: &OrderPctBreakdown,
    f: &PostCaptureLawFields,
    society: Option<&Value>,
    difficulty: Difficulty,
) -> OrderPctBreakdown {
    if !is_post_capture_law_active(f) {
        return ord_pct.clone();
    }
    let params = load_order_params(society, difficulty);
    let revolt = load_revolt_params(society, difficulty);
    let praw_pct = POST_CAPTURE_LAW_PCT;
    let por_pct = compute_por_pct(ord_pct.sz.sz_pct, praw_pct, &params);
    let tier = tier_from_por_pct(por_pct);
    let effects = order_effects_from_por_pct(por_pct, &params, revolt.critical_por_pct);
    let band = por_pct_band(por_pct, revolt.critical_por_pct);
    let banner =
        post_capture_law_banner_label(f).unwrap_or_else(|| "Podbój — wymuszone Prawo".to_owned());
    let override_line = SocietyLine {
        id: "post_capture_law".to_owned(),
        label: banner,
        value: praw_pct,
    };
    let mut prawo = ord_pct.prawo.clone();
    prawo.lines.insert(0, override_line);
    prawo.praw_pct = praw_pct;
    prawo.netto = praw_pct;
    OrderPctBreakdown {
        prawo,
        por_pct,
        tier,
        band,
        band_label: band.label(),
        effects: OrderEffects {
            revolt_risk: 0.0,
            ..effects
        },
        ..ord_pct.clone()
    }
}

// ---------------------------------------------------------------------------------------------
// armyMerge.ts:991 countLawGarrisonOnCityHex, diplomacy.ts:82 isOwnerAtWarInRelations
// ---------------------------------------------------------------------------------------------

/// Pola `RuntimeUnit` czytane przez `countLawGarrisonOnCityHex`.
#[derive(Debug, Clone, PartialEq)]
pub struct LawGarrisonUnit {
    pub owner_id: i64,
    pub q: f64,
    pub r: f64,
    /// `!!u.oblegaCityId` (niepusty napis).
    pub oblega: bool,
}

/// Web `countLawGarrisonOnCityHex` (`armyMerge.ts:991`).
pub fn count_law_garrison_on_city_hex(
    units: &[LawGarrisonUnit],
    city_q: f64,
    city_r: f64,
    owner_id: i64,
) -> f64 {
    units
        .iter()
        .filter(|u| u.owner_id == owner_id && u.q == city_q && u.r == city_r && !u.oblega)
        .count() as f64
}

/// Web `isOwnerAtWarInRelations` (`diplomacy.ts:82`): `relations` = `(klucz "a_b", status == 'wojna')`.
/// `key.split('_').map(Number)`; `parts.length !== 2` pomija.
pub fn is_owner_at_war_in_relations(owner_id: i64, relations: &[(String, bool)]) -> bool {
    for (key, at_war) in relations {
        if !*at_war {
            continue;
        }
        let parts: Vec<&str> = key.split('_').collect();
        if parts.len() != 2 {
            continue;
        }
        // `Number("")` = 0, `Number("abc")` = NaN; NaN nigdy nie równa się owner_id.
        let num = |s: &str| -> Option<i64> {
            let t = s.trim();
            if t.is_empty() {
                Some(0)
            } else {
                t.parse::<i64>().ok()
            }
        };
        let (a, b) = (num(parts[0]), num(parts[1]));
        if a == Some(BARBARIAN_OWNER_ID) || b == Some(BARBARIAN_OWNER_ID) {
            continue;
        }
        if a == Some(owner_id) || b == Some(owner_id) {
            return true;
        }
    }
    false
}

// ---------------------------------------------------------------------------------------------
// Pętla porządku (main.ts:35358-35789)
// ---------------------------------------------------------------------------------------------

/// Miasto w pętli porządku (pola `City` czytane/zmieniane przez pętlę).
#[derive(Debug, Clone, PartialEq)]
pub struct OrderLaneCity {
    pub id: String,
    pub name: String,
    pub owner_id: i64,
    pub q: f64,
    pub r: f64,
    pub population: f64,
    /// `(city as any).kultura ?? 0`.
    pub kultura: f64,
    pub own_culture_share: Option<f64>,
    pub kultura_own_share: Option<f64>,
    pub religion_pressure_pct: Option<BTreeMap<i64, f64>>,
    pub rebel_state: bool,
    pub revolt_grace_remaining: Option<f64>,
    pub post: PostCaptureLawFields,
    /// `City.surowce` (magazyn centralny: `ownerResourceStockAll`).
    pub surowce: Option<StockRecord>,
}

impl StockCitySource for OrderLaneCity {
    fn id(&self) -> &str {
        &self.id
    }
    fn owner_id(&self) -> i64 {
        self.owner_id
    }
    fn surowce(&self) -> Option<&StockRecord> {
        self.surowce.as_ref()
    }
    fn surowce_mut(&mut self) -> &mut Option<StockRecord> {
        &mut self.surowce
    }
}

/// Pola `econ.perCity.find(cityId)` czytane przez pętlę (brak wpisu = zera, `main.ts:35390-35393`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct OrderLaneEconTick {
    pub kultura: f64,
    pub wealth_zadowolenie: f64,
    pub garncarnia_surplus_zadowolenie: f64,
    pub ma_spichlerz: bool,
    pub ma_spichlerz_ii: bool,
}

/// Stan trwały między turami (Mapy weba `main.ts:3202`, `:4886-4888`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct OrderLaneState {
    /// `cityRelig`.
    pub city_relig: BTreeMap<String, ReligionState>,
    /// `orderValueMap` (PorPct).
    pub order_value_map: BTreeMap<String, f64>,
    /// `growthMultMap`.
    pub growth_mult_map: BTreeMap<String, f64>,
    /// `orderMultMap`.
    pub order_mult_map: BTreeMap<String, OrderYieldMults>,
}

/// Wejścia wołającego (Z-OL-4).
pub struct OrderLaneCtx<'a> {
    pub difficulty: Difficulty,
    /// `turn` (numer tury; `makeRng(turn)`).
    pub turn: f64,
    pub society: Option<&'a Value>,
    pub civs: Option<&'a Value>,
    pub matrix: &'a CivMatrixFile,
    pub buildings: &'a [Building],
    pub citizen_table: &'a CitizenResourceUpkeep,
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    pub owner_civ_map: &'a BTreeMap<i64, String>,
    pub econ_tick: &'a BTreeMap<String, OrderLaneEconTick>,
    pub owner_era: &'a dyn Fn(i64) -> f64,
    pub owner_tech: &'a dyn Fn(i64) -> HashSet<String>,
    pub owner_religion: &'a dyn Fn(i64) -> Option<String>,
    pub wonder_zadowolenie: &'a dyn Fn(i64) -> f64,
    /// `effectivePodzialHandlu(city).procentLuksus` po `city.id` (`None` = brak pola -> domyślne 20 w rozpisce).
    pub podzial_procent_luksus: &'a dyn Fn(&str) -> Option<f64>,
    pub units: &'a [LawGarrisonUnit],
    /// `diplomacyRelations`: `(klucz, status == 'wojna')`.
    pub relations: &'a [(String, bool)],
    pub human_owner_ids: &'a BTreeSet<i64>,
    pub capital_city_id_by_owner: &'a BTreeMap<i64, String>,
}

/// Skrót `cityOrderState` (`main.ts:35764`) czytany przez testy.
#[derive(Debug, Clone, PartialEq)]
pub struct OrderLaneCityReport {
    pub city_id: String,
    pub por_pct: f64,
    pub sz_pct: f64,
    pub praw_pct: f64,
    pub tier: crate::domain::types::porzadek::OrderTier,
    pub ha_kult: f64,
    pub ha_rel: f64,
    pub own_culture_share: f64,
    pub bunt: bool,
    pub revolt_warning: bool,
    pub revolt_grace_turns_left: Option<f64>,
    /// `cityOrderState.szczescie` = `Math.round(ordPct.sz.netto * 10) / 10` (`main.ts:35765`); wejscie
    /// `happinessByCityId` wzrostu po centrali (R-RUSTPORT-P6-ECON-TICK-POST-Q1, Z-POST-4).
    pub szczescie: f64,
    /// `cityOrderState.citizenUpkeep.growthPctDelta` (`main.ts:36020-36024`); wejscie `citizenGrowthPctByCityId`.
    pub citizen_growth_pct_delta: f64,
}

/// Wynik pętli.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct OrderLaneOutput {
    pub reports: Vec<OrderLaneCityReport>,
    /// Miasta, które przeszły do rebeliantów (wołający: `seedCityOwnerDefaults`, Z-OL-6).
    pub rebelled_city_ids: Vec<String>,
    /// `citizenUpkeepByOwner` (kolejność wstawiania).
    pub citizen_upkeep_by_owner: Vec<(i64, CitizenResourceDrainResult)>,
    /// Liczba zużytych wartości `rng()` (diagnostyka).
    pub rng_draws: u32,
}

fn hex_distance_web(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    js_max(js_max(dq, dr), ds)
}

fn fields(c: &OrderLaneCity) -> CultureMixFields {
    CultureMixFields {
        own_culture_share: c.own_culture_share,
        kultura_own_share: c.kultura_own_share,
    }
}

/// Web `resolvedCityReligion(city)` (`main.ts:4866`).
fn resolved_city_religion(
    state: &OrderLaneState,
    city: &OrderLaneCity,
    ctx: &OrderLaneCtx<'_>,
) -> ReligionState {
    let own = (ctx.owner_religion)(city.owner_id);
    resolve_city_religion_state(
        state.city_relig.get(&city.id),
        city.population,
        own.as_deref(),
    )
}

/// Web `capitalCityIdForOwner` (`main.ts:31575`): jawna stolica, jeśli nadal należy do ownera, inaczej najstarsze.
fn capital_city_id_for_owner(
    owner_id: i64,
    explicit_map: &BTreeMap<i64, String>,
    cities: &[OrderLaneCity],
) -> Option<String> {
    if let Some(explicit) = explicit_map.get(&owner_id) {
        if !explicit.is_empty()
            && cities
                .iter()
                .any(|c| &c.id == explicit && c.owner_id == owner_id)
        {
            return Some(explicit.clone());
        }
    }
    let mut best: Option<&OrderLaneCity> = None;
    let mut best_order = f64::INFINITY;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let o = city_found_order(&c.id);
        if o < best_order {
            best = Some(c);
            best_order = o;
        }
    }
    best.map(|c| c.id.clone())
}

/// Pętla porządku `main.ts:35358-35789` (część aż do `orderMultMap.set`). Mutuje `cities` (kultura, mix kultury,
/// presja religii, laska buntu, bunt: populacja/rebelia, magazyn surowców) i `state`.
pub fn compute_order_lane(
    cities: &mut [OrderLaneCity],
    state: &mut OrderLaneState,
    ctx: &OrderLaneCtx<'_>,
) -> OrderLaneOutput {
    let society = ctx.society;
    let difficulty = ctx.difficulty;
    let op = load_order_params(society, difficulty);
    let _ = op;
    let cp = load_culture_params(society, difficulty);
    let rp = load_religion_params(society, difficulty);
    let mut rng = make_rng(ctx.turn);
    let mut out = OrderLaneOutput::default();
    let mut drain_cache: BTreeMap<i64, CitizenResourceDrainResult> = BTreeMap::new();

    let catalog: Vec<HappinessCatalogEntry<'_>> = ctx
        .buildings
        .iter()
        .map(|b| HappinessCatalogEntry {
            id: b.id.as_str(),
            daje_szczescie: b.daje_szczescie,
            baza_zadowolenie: Some(b.baza.zadowolenie as f64),
            przyrost_zadowolenie: b.przyrost.zadowolenie as f64,
        })
        .collect();

    for idx in 0..cities.len() {
        let cid = cities[idx].id.clone();
        let econ = ctx.econ_tick.get(&cid).copied();
        let kultura_tick = econ.map_or(0.0, |e| e.kultura);

        let mut own_share = resolve_own_culture_share(&fields(&cities[idx]));
        let mix_active = city_culture_mix_active(&fields(&cities[idx]));
        let built: Vec<String> = ctx.built_by_city.get(&cid).cloned().unwrap_or_default();
        let built_refs: Vec<&str> = built.iter().map(String::as_str).collect();

        // RELIGIA (stan przed konwersją) :35421-35423
        let owner_id0 = cities[idx].owner_id;
        let own_rel = (ctx.owner_religion)(owner_id0);
        let mut cur_rel = resolved_city_religion(state, &cities[idx], ctx);
        let mut foreign_dom =
            is_foreign_religion_dominant(&cur_rel, own_rel.as_deref(), rp.prog_dominacji_pct);

        // Konwersja kultury + religii :35426-35434
        let conv = tick_city_culture_religion::<ReligionState, _, _>(
            own_share,
            cur_rel.clone(),
            &built_refs,
            own_rel.as_deref(),
            foreign_dom,
            &cp,
            &rp,
            &|cc: &CultureCity, has: &CultureBuildings, p: &CultureParams| {
                convert_culture_share(cc.own_culture_share, has, p)
            },
            &|st: &ReligionState, target: &str, b: &ReligionBuildings, p: &ReligionParams| {
                let r = convert_via_temple(st, target, b.has_swiatynia, b.has_kamienne_kregi, p);
                ReligionConversion {
                    state: r.state,
                    converted: r.converted,
                }
            },
        );
        own_share = conv.own_culture_share;
        if mix_active || own_share < 1.0 {
            cities[idx].own_culture_share = Some(own_share);
        }
        cur_rel = conv.religion_state;
        state.city_relig.insert(cid.clone(), cur_rel.clone());
        foreign_dom =
            is_foreign_religion_dominant(&cur_rel, own_rel.as_deref(), rp.prog_dominacji_pct);

        // KULTURA :35446-35455
        let civ_key = ctx.owner_civ_map.get(&owner_id0).cloned();
        let culture_modifier = civ_key.as_deref().map_or(0.0, |k| {
            civ_matrix_param(ctx.matrix, k, "kultura_naplyw_proc")
        });
        let culture_gain = culture_accrual_with_modifier(kultura_tick, culture_modifier);
        let acc = accumulate_culture(cities[idx].kultura, culture_gain, &cp);
        cities[idx].kultura = acc.kultura_skumulowana;
        let ha_kult = culture_happiness(Some(own_share), &cp);
        let ha_rel = religion_happiness(&cur_rel, own_rel.as_deref());

        // SPREAD RELIGION :35459-35500
        {
            let mut neighbors: Vec<ReligionNeighbor> = Vec::new();
            for oc in cities.iter() {
                if oc.id == cid {
                    continue;
                }
                let dist = hex_distance_web(oc.q, oc.r, cities[idx].q, cities[idx].r);
                if dist <= rp.szerzenie_max_dystans {
                    neighbors.push(ReligionNeighbor {
                        id: oc.id.clone(),
                        distance: dist,
                        state: resolved_city_religion(state, oc, ctx),
                        population: Some(oc.population),
                    });
                }
            }
            if !neighbors.is_empty() {
                let has_swiatynia = built_refs.contains(&"swiatynia");
                let source_params = match civ_key.as_deref() {
                    Some(k) => religion_params_with_spread_modifier(
                        &rp,
                        civ_matrix_param(ctx.matrix, k, "religia_spread_proc"),
                    ),
                    None => rp,
                };
                let seed = (ctx.turn * 997.0 + cities[idx].q * 31.0 + cities[idx].r)
                    .trunc()
                    .rem_euclid(4_294_967_296.0);
                let events = spread_religion(
                    &cur_rel,
                    &neighbors,
                    &source_params,
                    has_swiatynia,
                    Some(1.0),
                    seed,
                );
                for ev in events {
                    state.city_relig.insert(ev.id, ev.state);
                }
            }
        }

        // KULT-PRESJA :35502-35557
        {
            let rate = load_culture_pressure_rate(society, difficulty);
            let pressure_range = city_range_for_population(cities[idx].population);
            let mut state_rel_map: BTreeMap<i64, Option<String>> = BTreeMap::new();
            for c in cities.iter() {
                state_rel_map
                    .entry(c.owner_id)
                    .or_insert_with(|| (ctx.owner_religion)(c.owner_id));
            }
            let pressure_cities: Vec<PressureCity> = cities
                .iter()
                .map(|cc| PressureCity {
                    owner_id: cc.owner_id,
                    kultura_skumulowana: cc.kultura,
                    religion_state: resolved_city_religion(state, cc, ctx),
                })
                .collect();
            let source_owner_ids: Vec<i64> = cities
                .iter()
                .filter(|oc| {
                    oc.id != cid
                        && hex_distance_web(oc.q, oc.r, cities[idx].q, cities[idx].r)
                            <= pressure_range
                })
                .map(|oc| oc.owner_id)
                .collect();
            let pres = apply_culture_religion_pressure_to_target(
                cities[idx].owner_id,
                if mix_active { Some(own_share) } else { None },
                cities[idx].religion_pressure_pct.as_ref(),
                &source_owner_ids,
                &pressure_cities,
                rate,
                &state_rel_map,
            );
            if mix_active {
                own_share = pres.own_culture_share;
                cities[idx].own_culture_share = Some(own_share);
            }
            cities[idx].religion_pressure_pct = Some(pres.religion_pressure_pct);
        }

        // SZCZĘŚCIE :35560-35577
        let pop_matrix =
            crate::domain::city_growth::p6_7a::growth_v85::resolve_population_matrix_for_civ_in(
                ctx.matrix,
                ctx.owner_civ_map.get(&owner_id0).map(String::as_str),
            );
        let unlocked = (ctx.owner_tech)(owner_id0);
        let era_owner = (ctx.owner_era)(owner_id0);
        let ha_buildings = sum_building_happiness_from_built_ids(&built_refs, &catalog, |bdef| {
            match ctx.buildings.iter().find(|b| b.id == bdef.id) {
                Some(b) => {
                    let gate: Option<Vec<(String, String)>> = b
                        .poziom_tech_gate
                        .as_ref()
                        .map(|g| g.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
                    building_level_for_epoch(
                        b.epoka_wejscia as f64,
                        era_owner,
                        b.maks_poziom as f64,
                        gate.as_deref(),
                        Some(&unlocked),
                    )
                }
                None => 1.0,
            }
        }) + pop_matrix.happiness_base;
        let ha_wealth = econ.map_or(0.0, |e| e.wealth_zadowolenie);
        let ha_cuda = (ctx.wonder_zadowolenie)(owner_id0);
        let luksus = (ctx.podzial_procent_luksus)(&cid);
        let g_count_law =
            count_law_garrison_on_city_hex(ctx.units, cities[idx].q, cities[idx].r, owner_id0);
        let owner_at_war = is_owner_at_war_in_relations(owner_id0, ctx.relations);
        let designated = capital_city_id_for_owner(owner_id0, ctx.capital_city_id_by_owner, cities);
        let views: Vec<CapitalCityView<'_>> = cities
            .iter()
            .map(|c| CapitalCityView {
                id: c.id.as_str(),
                owner_id: c.owner_id,
            })
            .collect();
        let stolica_bonus = stolica_easy_bonus_active(
            difficulty == Difficulty::Easy,
            ctx.turn,
            CapitalCityView {
                id: cid.as_str(),
                owner_id: owner_id0,
            },
            &views,
            STOLICA_EASY_MAX_TUR,
            designated.as_deref(),
            &city_found_order,
        );
        let revolt_params = load_revolt_params(society, difficulty);
        let owner_era_upkeep = era_owner;

        // citizenUpkeepDrainForOwner :35380-35403
        if let std::collections::btree_map::Entry::Vacant(slot) = drain_cache.entry(owner_id0) {
            let owner_population: f64 = cities.iter().fold(0.0, |s, c| {
                if c.owner_id == owner_id0 {
                    s + c.population
                } else {
                    s
                }
            });
            let stock = owner_resource_stock_all(cities, owner_id0);
            let v = compute_citizen_resource_drain(
                ctx.citizen_table,
                owner_era_upkeep,
                owner_population,
                Some(&stock),
            );
            if !v.deductions.is_empty() {
                deduct_building_stock_cost_across_cities(cities, owner_id0, &v.deductions);
            }
            out.citizen_upkeep_by_owner.push((owner_id0, v.clone()));
            slot.insert(v);
        }
        let citizen_upkeep = drain_cache[&owner_id0].clone();

        let pop_now = cities[idx].population;
        let happiness_input = HappinessBreakdownInput {
            difficulty: Some(difficulty),
            era: Some(owner_era_upkeep),
            population: pop_now,
            building_zadowolenie: ha_buildings,
            ha_rel: Some(ha_rel),
            own_religion_share: None,
            ha_wealth: Some(ha_wealth),
            ha_cuda: Some(ha_cuda),
            podzial_procent_luksus: luksus,
            at_war: owner_at_war,
            own_culture_share: if mix_active { Some(own_share) } else { None },
            stolica_easy_bonus: stolica_bonus,
            citizen_resource_happiness_delta: Some(citizen_upkeep.coverage.happiness_delta as f64),
        };
        let law_input = LawBreakdownInput {
            difficulty: Some(difficulty),
            era: Some(era_owner),
            population: Some(pop_now),
            garnizon_count: g_count_law,
            has_dom_starszyzny: built_refs.contains(&"dom_starszyzny"),
            has_dwor_zarzadcy: built_refs.contains(&"dwor_zarzadcy"),
            has_pretorium: built_refs.contains(&"pretorium"),
            has_sad: built_refs.contains(&"sad"),
            has_trybunal: built_refs.contains(&"trybunal"),
            has_palac: false,
            palac_tier: city_palac_tier(&built_refs),
            stolica_easy_bonus: stolica_bonus,
            has_garnizon_budynek: built_refs.contains(&"garnizon"),
        };
        let ord_eval =
            evaluate_order_from_breakdown(&happiness_input, &law_input, society, difficulty);
        let ord_raw = match civ_key.as_deref() {
            Some(k) => apply_civ_matrix_happiness_modifier(
                &ord_eval,
                civ_matrix_param(ctx.matrix, k, "eko_zadowolenie_proc"),
                society,
                difficulty,
            ),
            None => ord_eval,
        };

        tick_rebel_protection_end_of_turn(&mut cities[idx].post);
        let post_active = should_suppress_revolt_during_post_capture_law(&cities[idx].post);
        let ord_pct = if post_active {
            apply_post_capture_law_override(&ord_raw, &cities[idx].post, society, difficulty)
        } else {
            ord_raw
        };

        let mods = match civ_key.as_deref() {
            Some(k) => CivOrderModifiers {
                porzadek_produkcja_proc: Some(civ_matrix_param(
                    ctx.matrix,
                    k,
                    "porzadek_produkcja_proc",
                )),
                porzadek_pieniadz_proc: Some(civ_matrix_param(
                    ctx.matrix,
                    k,
                    "porzadek_pieniadz_proc",
                )),
                porzadek_nauka_proc: Some(civ_matrix_param(ctx.matrix, k, "porzadek_nauka_proc")),
                porzadek_kultura_proc: Some(civ_matrix_param(
                    ctx.matrix,
                    k,
                    "porzadek_kultura_proc",
                )),
                porzadek_wzrost_proc: Some(civ_matrix_param(ctx.matrix, k, "porzadek_wzrost_proc")),
            },
            None => CivOrderModifiers::default(),
        };
        let order_eff = order_effects_with_civ_matrix(&ord_pct.effects, &mods);
        let tier = ord_pct.tier;
        let conquest_mult = conquest_revolt_risk_multiplier(own_share, foreign_dom, g_count_law);
        let effective_revolt_risk = if post_active {
            0.0
        } else {
            order_eff.revolt_risk * conquest_mult
        };
        let osiedle_immune = is_osiedle_revolt_immune(pop_now, society, difficulty);

        let grace_upd: RevoltGraceState = if osiedle_immune || post_active {
            cities[idx].revolt_grace_remaining = None;
            RevoltGraceState {
                revolt_grace_remaining: None,
                revolt_warning: false,
                should_trigger_rebellion: false,
                grace_turns_left: None,
            }
        } else {
            let g = update_revolt_grace(
                cities[idx].revolt_grace_remaining,
                ord_pct.por_pct,
                revolt_params,
            );
            cities[idx].revolt_grace_remaining = g.revolt_grace_remaining;
            if g.should_trigger_rebellion
                && ctx.human_owner_ids.contains(&cities[idx].owner_id)
                && !cities[idx].rebel_state
            {
                let prev_owner = cities[idx].owner_id;
                mark_city_rebellion_started(&mut cities[idx].post, prev_owner);
                cities[idx].rebel_state = true;
                cities[idx].owner_id = REBEL_FACTION_OWNER_ID;
                out.rebelled_city_ids.push(cid.clone());
            }
            g
        };

        let mut bunt = false;
        if !osiedle_immune
            && !post_active
            && !grace_upd.revolt_warning
            && !cities[idx].rebel_state
            && order_eff.revolt_risk > 0.0
            && {
                out.rng_draws += 1;
                rng.next_f64() < effective_revolt_risk
            }
        {
            let migr: Vec<RevoltMigrationCity> = cities
                .iter()
                .map(|c| RevoltMigrationCity {
                    id: c.id.clone(),
                    owner_id: c.owner_id,
                    population: c.population,
                })
                .collect();
            let target_id = pick_revolt_migration_target(
                &cid,
                cities[idx].owner_id,
                &migr,
                &state.order_value_map,
            );
            if let Some(tid) = target_id.filter(|t| !t.is_empty()) {
                if let Some(tidx) = cities.iter().position(|c| c.id == tid) {
                    if cities[idx].population > 1.0 {
                        cities[idx].population -= 1.0;
                        cities[tidx].population += 1.0;
                        bunt = true;
                    }
                }
            }
        }

        out.reports.push(OrderLaneCityReport {
            city_id: cid.clone(),
            por_pct: ord_pct.por_pct,
            sz_pct: ord_pct.sz.sz_pct,
            praw_pct: ord_pct.prawo.praw_pct,
            tier,
            ha_kult,
            ha_rel,
            own_culture_share: own_share,
            bunt,
            revolt_warning: grace_upd.revolt_warning,
            revolt_grace_turns_left: grace_upd.grace_turns_left,
            szczescie: crate::domain::society_breakdown::js_round(ord_pct.sz.netto * 10.0) / 10.0,
            citizen_growth_pct_delta: citizen_upkeep.coverage.growth_pct_delta as f64,
        });

        if post_active {
            tick_post_capture_law_end_of_turn(&mut cities[idx].post);
        }

        state.order_value_map.insert(cid.clone(), ord_pct.por_pct);
        state
            .growth_mult_map
            .insert(cid.clone(), order_eff.growth_mult);
        state.order_mult_map.insert(cid.clone(), {
            let m = order_effects_to_yield_mults(tier, &order_eff);
            OrderYieldMults {
                production_mult: m.production_mult,
                pieniadz_mult: m.pieniadz_mult,
                nauka_mult: m.nauka_mult,
                kultura_mult: m.kultura_mult,
            }
        });
    }
    out
}
