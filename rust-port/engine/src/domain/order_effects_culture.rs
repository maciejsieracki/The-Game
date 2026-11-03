//! R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1: kultura i religia pętli porządku (pin weba `4bbef081d`),
//! 1:1 z `gra/src/game/culture-religion.ts` (cały plik poza `cityTradeMultiplier`, `onCityCaptured*`).
//!
//! Zakres: `loadCultureParams`/`loadReligionParams`/`loadCulturePressureParams`, `accumulateCulture`,
//! `cultureAccrualWithModifier`, `cultureHappiness`, `convertCulture`, `religionOwnShare`,
//! `religionHappiness`, `makeRng` (culture-religion.ts:974), `spreadReligion`, `convertViaTemple`,
//! `religionParamsWithSpreadModifier`, `civReligionForKey`, `resolveCityReligionState`,
//! `empireCultureTotal`, `empireReligionTotal`, `applyCultureReligionPressureToTarget`.
//!
//! ZAŁOŻENIA (luki, nie cicha zmiana):
//! - Z-OL-1: `ReligionState.counts` to `BTreeMap` (porządek nazw), web: obiekt z porządkiem wstawiania. Sumy
//!   (`totalAdherents`) są dokładne tylko dla liczb całkowitych (wektory używają liczb całkowitych).
//! - Z-OL-2: porządek kluczy `Object.keys(...).sort()` (UTF-16) = porządek bajtowy UTF-8 dla BMP (nazwy
//!   religii w pinie są w BMP).
//! - Z-OL-3: `makeRng` z `culture-religion.ts:974` różni się od `civ-roster.ts:10`/`Mulberry32::new`: ziarno 0
//!   daje stan 1 (`(seed >>> 0) || 1`) i `finiteOr(seed, 0)`.

use std::collections::BTreeMap;

use serde_json::Value;

use crate::domain::resource_access::society_inputs::dominant_religion;
use crate::domain::rng::Mulberry32;
use crate::domain::territory::{DominantStatus, ReligionState};
use crate::domain::types::Difficulty;

// ---------------------------------------------------------------------------------------------
// pomocnicze (culture-religion.ts:138-158)
// ---------------------------------------------------------------------------------------------

/// Web `pick` (`culture-religion.ts:138`).
fn pick(row: Option<&Value>, difficulty: Difficulty, fallback: f64) -> f64 {
    match row {
        None => fallback,
        Some(r) => r
            .get(difficulty.key())
            .and_then(Value::as_f64)
            .filter(|v| v.is_finite())
            .unwrap_or(fallback),
    }
}

/// Web `finiteOr(v, fallback)`.
fn finite_or(v: f64, fallback: f64) -> f64 {
    if v.is_finite() {
        v
    } else {
        fallback
    }
}

/// Web `clamp(x, lo, hi)` (NaN przechodzi bez zmian).
fn clamp(x: f64, lo: f64, hi: f64) -> f64 {
    if x < lo {
        lo
    } else if x > hi {
        hi
    } else {
        x
    }
}

/// Web `Math.max(a, b)` (NaN zaraża; `max(+0,-0) = +0`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() && b.is_sign_negative() {
            -0.0
        } else {
            0.0
        };
    }
    if a > b {
        a
    } else {
        b
    }
}

fn block<'a>(society: Option<&'a Value>, key: &str) -> Option<&'a Value> {
    society.and_then(|s| s.get(key)).filter(|v| v.is_object())
}

// ---------------------------------------------------------------------------------------------
// KULTURA
// ---------------------------------------------------------------------------------------------

/// Web `CultureParams` (`culture-religion.ts:169`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CultureParams {
    pub prog_zasieg_1: f64,
    pub prog_zasieg_2: f64,
    pub prog_zasieg_3: f64,
    pub zadowolenie_100: f64,
    pub zadowolenie_75: f64,
    pub zadowolenie_50: f64,
    pub kara_lt_50: f64,
    pub kara_lt_25: f64,
    pub konwersja_baza: f64,
    pub konwersja_swiatynia: f64,
    pub konwersja_amfiteatr: f64,
    pub konwersja_biblioteka: f64,
    pub konwersja_palac: f64,
    pub konwersja_stela: f64,
    pub konwersja_sad: f64,
    pub konwersja_laznia: f64,
    pub konwersja_cap_tura: f64,
}

/// Web `FALLBACK_CULTURE_PARAMS` (`culture-religion.ts:210`) - literały weba (fallback gdy brak wiersza).
pub const FALLBACK_CULTURE_PARAMS: CultureParams = CultureParams {
    prog_zasieg_1: 100.0,
    prog_zasieg_2: 250.0,
    prog_zasieg_3: 500.0,
    zadowolenie_100: 2.0,
    zadowolenie_75: 1.0,
    zadowolenie_50: 0.0,
    kara_lt_50: -1.0,
    kara_lt_25: -2.0,
    konwersja_baza: 1.0,
    konwersja_swiatynia: 1.5,
    konwersja_amfiteatr: 1.0,
    konwersja_biblioteka: 2.0,
    konwersja_palac: 2.0,
    konwersja_stela: 0.5,
    konwersja_sad: 2.0,
    konwersja_laznia: 1.0,
    konwersja_cap_tura: 5.0,
};

/// Web `loadCultureParams` (`culture-religion.ts:238`).
pub fn load_culture_params(society: Option<&Value>, difficulty: Difficulty) -> CultureParams {
    let k = block(society, "kultura");
    let g = |key: &str, fb: f64| pick(k.and_then(|b| b.get(key)), difficulty, fb);
    let f = FALLBACK_CULTURE_PARAMS;
    CultureParams {
        prog_zasieg_1: g("kultura_prog_zasieg_1", f.prog_zasieg_1),
        prog_zasieg_2: g("kultura_prog_zasieg_2", f.prog_zasieg_2),
        prog_zasieg_3: g("kultura_prog_zasieg_3", f.prog_zasieg_3),
        zadowolenie_100: g("kultura_zadowolenie_100pct", f.zadowolenie_100),
        zadowolenie_75: g("kultura_zadowolenie_75pct", f.zadowolenie_75),
        zadowolenie_50: g("kultura_zadowolenie_50pct", f.zadowolenie_50),
        kara_lt_50: g("kultura_kara_zadowolenie_lt50", f.kara_lt_50),
        kara_lt_25: g("kultura_kara_zadowolenie_lt25", f.kara_lt_25),
        konwersja_baza: g("kultura_konwersja_baza_tura", f.konwersja_baza),
        konwersja_swiatynia: g("kultura_konwersja_swiatynia", f.konwersja_swiatynia),
        konwersja_amfiteatr: g("kultura_konwersja_amfiteatr", f.konwersja_amfiteatr),
        konwersja_biblioteka: g("kultura_konwersja_biblioteka", f.konwersja_biblioteka),
        konwersja_palac: g("kultura_konwersja_palac", f.konwersja_palac),
        konwersja_stela: g("kultura_konwersja_stela", f.konwersja_stela),
        konwersja_sad: g("kultura_konwersja_sad", f.konwersja_sad),
        konwersja_laznia: g("kultura_konwersja_laznia", f.konwersja_laznia),
        konwersja_cap_tura: g("kultura_konwersja_cap_tura", f.konwersja_cap_tura),
    }
}

/// Web `cityBorderRadius` (`culture-religion.ts:316`).
pub fn city_border_radius(culture_points: f64, params: &CultureParams) -> u8 {
    let c = finite_or(culture_points, 0.0);
    if c >= params.prog_zasieg_3 {
        3
    } else if c >= params.prog_zasieg_2 {
        2
    } else if c >= params.prog_zasieg_1 {
        1
    } else {
        0
    }
}

/// Web `cultureAccrualWithModifier` (`culture-religion.ts:340`).
pub fn culture_accrual_with_modifier(per_turn: f64, modifier: f64) -> f64 {
    let base = js_max(0.0, finite_or(per_turn, 0.0));
    let factor = if modifier.is_finite() {
        js_max(0.0, 1.0 + modifier)
    } else {
        1.0
    };
    base * factor
}

/// Web `CultureAccrualResult` (`culture-religion.ts:328`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CultureAccrualResult {
    pub kultura_skumulowana: f64,
    pub poprzedni_zasieg: u8,
    pub nowy_zasieg: u8,
    pub granica_rozszerzona: bool,
}

/// Web `accumulateCulture` (`culture-religion.ts:354`).
pub fn accumulate_culture(
    kultura_skumulowana: f64,
    per_turn: f64,
    params: &CultureParams,
) -> CultureAccrualResult {
    let before = js_max(0.0, finite_or(kultura_skumulowana, 0.0));
    let gain = js_max(0.0, finite_or(per_turn, 0.0));
    let after = before + gain;
    let poprzedni = city_border_radius(before, params);
    let nowy = city_border_radius(after, params);
    CultureAccrualResult {
        kultura_skumulowana: after,
        poprzedni_zasieg: poprzedni,
        nowy_zasieg: nowy,
        granica_rozszerzona: nowy > poprzedni,
    }
}

/// Web `cultureHappiness` (`culture-religion.ts:394`); `own_culture_share = None` = `?? 1`.
pub fn culture_happiness(own_culture_share: Option<f64>, params: &CultureParams) -> f64 {
    let share = clamp(finite_or(own_culture_share.unwrap_or(1.0), 1.0), 0.0, 1.0);
    if share < 0.25 {
        return params.kara_lt_25;
    }
    if share < 0.5 {
        return params.kara_lt_50;
    }
    if share >= 1.0 {
        return params.zadowolenie_100;
    }
    if share >= 0.75 {
        return params.zadowolenie_75;
    }
    params.zadowolenie_50
}

/// Web `convertCulture` (`culture-religion.ts:447`) - zwraca `ownCultureShare` wyniku.
/// `own_culture_share = None` = `?? 0`.
pub fn convert_culture_share(
    own_culture_share: Option<f64>,
    has: &crate::domain::terrain::conquest_stability::CultureBuildings,
    params: &CultureParams,
) -> f64 {
    let share = clamp(finite_or(own_culture_share.unwrap_or(0.0), 0.0), 0.0, 1.0);
    let mut rate_pct = params.konwersja_baza;
    if has.has_amfiteatr {
        rate_pct += params.konwersja_amfiteatr;
    }
    if has.has_biblioteka {
        rate_pct += params.konwersja_biblioteka;
    }
    if has.has_palac {
        rate_pct += params.konwersja_palac;
    }
    if has.has_stela {
        rate_pct += params.konwersja_stela;
    }
    if has.has_sad {
        rate_pct += params.konwersja_sad;
    }
    if has.has_laznia {
        rate_pct += params.konwersja_laznia;
    }
    rate_pct = clamp(rate_pct, 0.0, params.konwersja_cap_tura);
    let applied = rate_pct / 100.0;
    clamp(share + applied, 0.0, 1.0)
}

// ---------------------------------------------------------------------------------------------
// RELIGIA
// ---------------------------------------------------------------------------------------------

/// Web `ReligionParams` (`culture-religion.ts:479`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ReligionParams {
    pub prog_dominacji_pct: f64,
    pub szybkosc_szerzenia_bazowa: f64,
    pub swiatynia_bonus_szerzenia: f64,
    pub szerzenie_max_dystans: f64,
    pub zadowolenie_dominujaca: f64,
    pub kara_obca: f64,
    pub kara_brak_religii: f64,
    pub konwersja_baza_pct: f64,
    pub konwersja_swiatynia_pct: f64,
    pub konwersja_kregi_pct: f64,
}

/// Web `FALLBACK_RELIGION_PARAMS` (`culture-religion.ts:516`).
pub const FALLBACK_RELIGION_PARAMS: ReligionParams = ReligionParams {
    prog_dominacji_pct: 50.0,
    szybkosc_szerzenia_bazowa: 1.0,
    swiatynia_bonus_szerzenia: 1.0,
    szerzenie_max_dystans: 3.0,
    zadowolenie_dominujaca: 2.0,
    kara_obca: -2.0,
    kara_brak_religii: -1.0,
    konwersja_baza_pct: 2.0,
    konwersja_swiatynia_pct: 4.0,
    konwersja_kregi_pct: 2.0,
};

/// Web `loadReligionParams` (`culture-religion.ts:534`).
pub fn load_religion_params(society: Option<&Value>, difficulty: Difficulty) -> ReligionParams {
    let r = block(society, "religia");
    let g = |key: &str, fb: f64| pick(r.and_then(|b| b.get(key)), difficulty, fb);
    let f = FALLBACK_RELIGION_PARAMS;
    ReligionParams {
        prog_dominacji_pct: g("religia_prog_dominacji", f.prog_dominacji_pct),
        szybkosc_szerzenia_bazowa: g(
            "religia_szybkosc_szerzenia_bazowa",
            f.szybkosc_szerzenia_bazowa,
        ),
        swiatynia_bonus_szerzenia: g(
            "religia_swiatynia_bonus_szerzenia",
            f.swiatynia_bonus_szerzenia,
        ),
        szerzenie_max_dystans: g("religia_szerzenie_max_dystans", f.szerzenie_max_dystans),
        zadowolenie_dominujaca: g("religia_zadowolenie_dominujaca", f.zadowolenie_dominujaca),
        kara_obca: g("religia_kara_obca", f.kara_obca),
        kara_brak_religii: g("religia_kara_brak_religii", f.kara_brak_religii),
        konwersja_baza_pct: g("religia_konwersja_bazowa", f.konwersja_baza_pct),
        konwersja_swiatynia_pct: g("religia_konwersja_swiatynia", f.konwersja_swiatynia_pct),
        konwersja_kregi_pct: g("religia_konwersja_kregi", f.konwersja_kregi_pct),
    }
}

/// Web `religionParamsWithSpreadModifier` (`culture-religion.ts:503`).
pub fn religion_params_with_spread_modifier(
    params: &ReligionParams,
    modifier: f64,
) -> ReligionParams {
    let factor = if modifier.is_finite() {
        1.0 + modifier
    } else {
        1.0
    };
    if factor == 1.0 {
        return *params;
    }
    ReligionParams {
        szybkosc_szerzenia_bazowa: params.szybkosc_szerzenia_bazowa * factor,
        ..*params
    }
}

/// Web `civReligionForKey(civKey, society, civs)` (`culture-religion.ts:607`) z `resolveCivDisplayName` (:583)
/// i `civReligion` (:567). `civs` = `civs.json` (`cywilizacje[]`), `society` = `society-params.json`.
pub fn civ_religion_for_key(
    civ_key: Option<&str>,
    society: Option<&Value>,
    civs: Option<&Value>,
) -> Option<String> {
    let key = civ_key.filter(|k| !k.is_empty())?;
    // resolveCivDisplayName
    let display: String = {
        let list = civs
            .and_then(|c| c.get("cywilizacje"))
            .and_then(Value::as_array)
            .filter(|l| !l.is_empty());
        match list {
            None => key.to_owned(),
            Some(list) => {
                let lk = key.to_lowercase();
                let mut found: Option<String> = None;
                for row in list {
                    if !row.is_object() {
                        continue;
                    }
                    let ids: Vec<String> = ["ikonaId", "typCywilizacji", "Cywilizacja"]
                        .iter()
                        .filter_map(|f| row.get(*f).and_then(Value::as_str))
                        .filter(|s| !s.is_empty())
                        .map(str::to_lowercase)
                        .collect();
                    if !ids.contains(&lk) {
                        continue;
                    }
                    found = Some(
                        match row.get("Cywilizacja").and_then(Value::as_str) {
                            Some(n) if !n.is_empty() => n,
                            _ => key,
                        }
                        .to_owned(),
                    );
                    break;
                }
                found.unwrap_or_else(|| key.to_owned())
            }
        }
    };
    // civReligion
    if display.is_empty() {
        return None;
    }
    let table = society
        .and_then(|s| s.get("religie_cywilizacji"))
        .and_then(Value::as_array)?;
    for row in table {
        if row.get("Cywilizacja").and_then(Value::as_str) == Some(display.as_str()) {
            return match row.get("Religia / wyznanie").and_then(Value::as_str) {
                Some(rel) if !rel.is_empty() => Some(rel.to_owned()),
                _ => None,
            };
        }
    }
    None
}

/// Web `totalAdherents` (`culture-religion.ts:660`).
pub fn total_adherents(state: &ReligionState) -> f64 {
    state
        .counts
        .values()
        .filter(|v| v.is_finite() && **v > 0.0)
        .sum()
}

/// Web `countReligionAdherents` (`culture-religion.ts:720`).
pub fn count_religion_adherents(state: &ReligionState, religion: Option<&str>) -> f64 {
    let Some(r) = religion.filter(|r| !r.is_empty()) else {
        return 0.0;
    };
    match state.counts.get(r) {
        Some(v) if v.is_finite() && *v > 0.0 => *v,
        _ => 0.0,
    }
}

/// Web `isEmptyReligionState` (`culture-religion.ts:742`).
pub fn is_empty_religion_state(state: Option<&ReligionState>) -> bool {
    match state {
        None => true,
        Some(s) => total_adherents(s) <= 0.0,
    }
}

/// Web `defaultCityReligionState` (`culture-religion.ts:748`).
pub fn default_city_religion_state(population: f64, own_religion: Option<&str>) -> ReligionState {
    let pop = js_max(0.0, population.floor());
    match own_religion.filter(|r| !r.is_empty()) {
        Some(r) if pop > 0.0 => ReligionState {
            counts: BTreeMap::from([(r.to_owned(), pop)]),
        },
        _ => ReligionState::default(),
    }
}

/// Web `resolveCityReligionState` (`culture-religion.ts:875`).
pub fn resolve_city_religion_state(
    stored: Option<&ReligionState>,
    population: f64,
    own_religion: Option<&str>,
) -> ReligionState {
    if !is_empty_religion_state(stored) {
        return stored.cloned().unwrap_or_default();
    }
    default_city_religion_state(population, own_religion)
}

/// Web `religionOwnShare` (`culture-religion.ts:925`).
pub fn religion_own_share(state: &ReligionState, own_religion: Option<&str>) -> f64 {
    let total = total_adherents(state);
    if total <= 0.0 || own_religion.is_none() {
        return 0.5;
    }
    clamp(
        count_religion_adherents(state, own_religion) / total,
        0.0,
        1.0,
    )
}

/// Web `religionHappiness` (`culture-religion.ts:960`): `2 * religionOwnShare - 1`.
pub fn religion_happiness(state: &ReligionState, own_religion: Option<&str>) -> f64 {
    2.0 * religion_own_share(state, own_religion) - 1.0
}

/// Web `makeRng` z `culture-religion.ts:974` (Z-OL-3): `(finiteOr(seed, 0) >>> 0) || 1`, mulberry32.
pub fn make_rng(seed: f64) -> Mulberry32 {
    let s = finite_or(seed, 0.0);
    // ToUint32: obcięcie ku zeru, modulo 2^32.
    let u = (s.trunc().rem_euclid(4_294_967_296.0)) as u32;
    Mulberry32::new(if u == 0 { 1 } else { u })
}

/// Web `ReligionNeighbor` (`culture-religion.ts:990`).
#[derive(Debug, Clone, PartialEq)]
pub struct ReligionNeighbor {
    pub id: String,
    pub distance: f64,
    pub state: ReligionState,
    pub population: Option<f64>,
}

/// Web `ReligionSpreadEvent` (`culture-religion.ts:1002`).
#[derive(Debug, Clone, PartialEq)]
pub struct ReligionSpreadEvent {
    pub id: String,
    pub religion: String,
    pub added: f64,
    pub state: ReligionState,
}

/// Web `spreadReligion` (`culture-religion.ts:1044`); `pressure = None` -> 1.
pub fn spread_religion(
    source: &ReligionState,
    neighbors: &[ReligionNeighbor],
    params: &ReligionParams,
    has_swiatynia: bool,
    pressure: Option<f64>,
    seed: f64,
) -> Vec<ReligionSpreadEvent> {
    let dom = dominant_religion(source, params.prog_dominacji_pct);
    let religion = match (dom.status, dom.religion) {
        (DominantStatus::Dominant, Some(r)) => r,
        _ => return Vec::new(),
    };
    let max_dist = params.szerzenie_max_dystans;
    let pressure = js_max(0.0, finite_or(pressure.unwrap_or(1.0), 1.0));
    let eligible: Vec<&ReligionNeighbor> = neighbors
        .iter()
        .filter(|n| n.distance.is_finite() && n.distance >= 1.0 && n.distance <= max_dist)
        .collect();
    let mut slots_f = params.szybkosc_szerzenia_bazowa
        + if has_swiatynia {
            params.swiatynia_bonus_szerzenia
        } else {
            0.0
        };
    slots_f = js_max(0.0, finite_or(slots_f, 0.0).floor());
    let slots = (slots_f as usize).min(eligible.len());

    // Jitter (strumień zużywany jak w webie: po jednej wartości na kandydata, w kolejności `eligible`).
    let mut rng = make_rng(seed.trunc().rem_euclid(4_294_967_296.0));
    let mut jitter: BTreeMap<&str, f64> = BTreeMap::new();
    for n in &eligible {
        jitter.insert(n.id.as_str(), rng.next_f64());
    }
    let mut ordered: Vec<&ReligionNeighbor> = eligible.clone();
    ordered.sort_by(|a, b| {
        if a.distance != b.distance {
            return a
                .distance
                .partial_cmp(&b.distance)
                .unwrap_or(std::cmp::Ordering::Equal);
        }
        if a.id != b.id {
            return a.id.cmp(&b.id);
        }
        let ja = jitter.get(a.id.as_str()).copied().unwrap_or(0.0);
        let jb = jitter.get(b.id.as_str()).copied().unwrap_or(0.0);
        ja.partial_cmp(&jb).unwrap_or(std::cmp::Ordering::Equal)
    });

    let mut events = Vec::new();
    for n in ordered.iter().take(slots) {
        let current = n.state.counts.get(&religion).copied().unwrap_or(0.0);
        let current = if current.is_nan() { 0.0 } else { current };
        let mut added = pressure;
        if let Some(p) = n.population.filter(|p| p.is_finite()) {
            let room = js_max(0.0, p - total_adherents(&n.state));
            added = added.min(js_max(0.0, room));
        }
        let mut counts = n.state.counts.clone();
        counts.insert(religion.clone(), current + added);
        events.push(ReligionSpreadEvent {
            id: n.id.clone(),
            religion: religion.clone(),
            added,
            state: ReligionState { counts },
        });
    }
    events
}

/// Web `ReligionConversionResult` (`culture-religion.ts:1124`) - pola czytane przez tick.
#[derive(Debug, Clone, PartialEq)]
pub struct ReligionConversionOut {
    pub state: ReligionState,
    pub converted: f64,
}

/// Web `convertViaTemple` (`culture-religion.ts:1160`).
pub fn convert_via_temple(
    state: &ReligionState,
    target_religion: &str,
    has_swiatynia: bool,
    has_kamienne_kregi: bool,
    params: &ReligionParams,
) -> ReligionConversionOut {
    let total = total_adherents(state);
    let mut clone: BTreeMap<String, f64> = state
        .counts
        .iter()
        .filter(|(_, v)| v.is_finite() && **v > 0.0)
        .map(|(k, v)| (k.clone(), *v))
        .collect();
    let mut rate_pct = params.konwersja_baza_pct;
    if has_swiatynia {
        rate_pct += params.konwersja_swiatynia_pct;
    }
    if has_kamienne_kregi {
        rate_pct += params.konwersja_kregi_pct;
    }
    let rate_pct = js_max(0.0, rate_pct);
    let applied_rate = rate_pct / 100.0;

    let target_count = if target_religion.is_empty() {
        0.0
    } else {
        clone.get(target_religion).copied().unwrap_or(0.0)
    };
    let convertible = total - target_count;
    if target_religion.is_empty() || total <= 0.0 || convertible <= 0.0 {
        return ReligionConversionOut {
            state: ReligionState { counts: clone },
            converted: 0.0,
        };
    }
    // Math.round (JS: round half up).
    let mut to_convert = (applied_rate * convertible + 0.5).floor();
    if to_convert <= 0.0 && applied_rate > 0.0 {
        to_convert = 1.0;
    }
    to_convert = to_convert.min(convertible);

    let mut remaining = to_convert;
    let mut donors: Vec<String> = clone
        .iter()
        .filter(|(k, v)| k.as_str() != target_religion && **v > 0.0)
        .map(|(k, _)| k.clone())
        .collect();
    donors.sort_by(|a, b| {
        let dv = clone[b] - clone[a];
        if dv != 0.0 {
            return if dv < 0.0 {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            };
        }
        a.cmp(b)
    });
    for k in donors {
        if remaining <= 0.0 {
            break;
        }
        let have = clone[&k];
        let take = remaining.min(have);
        let left = have - take;
        if left <= 0.0 {
            clone.remove(&k);
        } else {
            clone.insert(k, left);
        }
        remaining -= take;
    }
    let actually = to_convert - remaining;
    clone.insert(target_religion.to_owned(), target_count + actually);
    ReligionConversionOut {
        state: ReligionState { counts: clone },
        converted: actually,
    }
}

// ---------------------------------------------------------------------------------------------
// PRESJA (KULT-PRESJA)
// ---------------------------------------------------------------------------------------------

/// Web `loadCulturePressureParams` (`culture-religion.ts:1414`): `presjaProcTura`, fallback 5.
pub fn load_culture_pressure_rate(society: Option<&Value>, difficulty: Difficulty) -> f64 {
    pick(
        block(society, "kultura").and_then(|b| b.get("kultura_presja_proc_tura")),
        difficulty,
        5.0,
    )
}

/// Pola `PressureCity` czytane przez presję (`culture-religion.ts` - `empireCultureTotal`,
/// `empireReligionTotal`).
#[derive(Debug, Clone, PartialEq)]
pub struct PressureCity {
    pub owner_id: i64,
    pub kultura_skumulowana: f64,
    pub religion_state: ReligionState,
}

/// Web `empireCultureTotal` (`culture-religion.ts:1370`).
pub fn empire_culture_total(cities: &[PressureCity], owner_id: i64) -> f64 {
    let mut sum = 0.0;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        sum += js_max(0.0, finite_or(c.kultura_skumulowana, 0.0));
    }
    sum
}

/// Web `empireReligionTotal` (`culture-religion.ts:1400`).
pub fn empire_religion_total(
    cities: &[PressureCity],
    owner_id: i64,
    state_religion: Option<&str>,
) -> f64 {
    let Some(sr) = state_religion.filter(|r| !r.is_empty()) else {
        return 0.0;
    };
    let mut sum = 0.0;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        sum += count_religion_adherents(&c.religion_state, Some(sr));
    }
    sum
}

fn clamp_pct(x: f64) -> f64 {
    clamp(finite_or(x, 0.0), 0.0, 100.0)
}

/// Web `PressureTickResult` (`culture-religion.ts:1430`).
#[derive(Debug, Clone, PartialEq)]
pub struct PressureTickResult {
    pub own_culture_share: f64,
    pub religion_pressure_pct: BTreeMap<i64, f64>,
}

/// Web `applyCultureReligionPressureToTarget` (`culture-religion.ts:1441`). `target_share` = `ownCultureShare ??
/// kulturaOwnShare` celu (`None` = oba pola `undefined` => mix nieaktywny). `source_owner_ids` = `ownerId`
/// źródeł w kolejności. `state_religion_by_owner` = `stateReligionByOwner`.
pub fn apply_culture_religion_pressure_to_target(
    target_owner_id: i64,
    target_share: Option<f64>,
    target_religion_pressure_pct: Option<&BTreeMap<i64, f64>>,
    source_owner_ids: &[i64],
    cities: &[PressureCity],
    rate_pct: f64,
    state_religion_by_owner: &BTreeMap<i64, Option<String>>,
) -> PressureTickResult {
    let culture_mix_active = target_share.is_some();
    let mut share = if culture_mix_active {
        clamp(finite_or(target_share.unwrap_or(0.0), 0.0), 0.0, 1.0)
    } else {
        1.0
    };
    let mut rel_pct: BTreeMap<i64, f64> = target_religion_pressure_pct.cloned().unwrap_or_default();
    let rate = js_max(0.0, rate_pct) / 100.0;
    let o_t = target_owner_id;
    let sr = |o: i64| -> Option<&str> {
        state_religion_by_owner
            .get(&o)
            .and_then(|v| v.as_deref())
    };
    let total_rel_t = empire_religion_total(cities, o_t, sr(o_t));

    for &o_s in source_owner_ids {
        if o_s == o_t {
            continue;
        }
        let cult_s = empire_culture_total(cities, o_s);
        let cult_t = empire_culture_total(cities, o_t);
        if !culture_mix_active {
            continue;
        }
        if cult_s > cult_t {
            share = clamp(share - rate, 0.0, 1.0);
        } else if cult_t > cult_s {
            share = clamp(share + rate, 0.0, 1.0);
        }
        let rel_s = empire_religion_total(cities, o_s, sr(o_s));
        if rel_s > total_rel_t {
            let cur = rel_pct.get(&o_s).copied().unwrap_or(0.0);
            rel_pct.insert(o_s, clamp_pct(cur + rate_pct));
        } else if total_rel_t > rel_s {
            let cur = rel_pct.get(&o_t).copied().unwrap_or(100.0);
            rel_pct.insert(o_t, clamp_pct(cur - rate_pct));
        }
    }
    PressureTickResult {
        own_culture_share: share,
        religion_pressure_pct: rel_pct,
    }
}
