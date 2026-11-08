//! R-RUSTPORT-REPIN-OBLEZENIE-GLOD-COOLDOWN-Q1 (FALA 555 SIEGEDUR): testy `siege_defender_units` oraz wektory
//! glodu garnizonu z web `gra/src/game/siege-starvation.ts` (origin/main).
//!
//! Wektory: wynik web uruchomionego pod Node 22 (`--experimental-strip-types`) na tych samych wejsciach.
//! Oczekiwania podane jawnie ponizej. Granice: progi 50 % (remis = miasto trzyma), NaN/Inf, hp <= 0.

use civ_engine::domain::siege_starvation::{
    garrison_hp_totals, siege_defender_units, siege_starvation_state, SiegeCityPos,
    SiegeDefenderPos, SiegeGarrisonUnit, SiegeStarvationCity, SiegeStarvationParams,
    SiegeStarvationState,
};

/// Jednostka testowa: pozycja + stan + cywil.
#[derive(Debug, Clone, PartialEq)]
struct TUnit {
    id: &'static str,
    owner_id: i64,
    q: i32,
    r: i32,
    hp: Option<f64>,
    civ: bool,
}

fn tu(id: &'static str, owner_id: i64, q: i32, r: i32, hp: Option<f64>, civ: bool) -> TUnit {
    TUnit {
        id,
        owner_id,
        q,
        r,
        hp,
        civ,
    }
}

fn pos(u: &TUnit) -> SiegeDefenderPos {
    SiegeDefenderPos {
        owner_id: u.owner_id,
        q: u.q,
        r: u.r,
        hp: u.hp,
    }
}

/// Web `getMaxHp` z wektorow: inf=10, pik=20, zero=0.
fn max_hp(t: &str) -> f64 {
    match t {
        "inf" => 10.0,
        "pik" => 20.0,
        _ => 0.0,
    }
}

fn gu(type_id: &str, hp: Option<f64>) -> SiegeGarrisonUnit {
    SiegeGarrisonUnit {
        hp,
        hp_max: None,
        type_id: Some(type_id.to_string()),
    }
}

fn city(oblegane: Option<bool>, start: Option<f64>, pending: Option<bool>) -> SiegeStarvationCity {
    SiegeStarvationCity {
        oblegane,
        siege_capitulation_pending: pending,
        siege_starve_start_max_hp: start,
    }
}

fn run(c: &SiegeStarvationCity, units: &[SiegeGarrisonUnit], food: f64) -> SiegeStarvationState {
    let params = SiegeStarvationParams {
        food,
        surrender_below_frac: None,
    };
    siege_starvation_state(c, units, &params, &max_hp)
}

fn ids(v: &[&TUnit]) -> Vec<&'static str> {
    v.iter().map(|u| u.id).collect()
}

// ---------- siege_defender_units (web siegeDefenderUnits) ----------

fn defender_fixture() -> Vec<TUnit> {
    vec![
        tu("a", 1, 3, 4, Some(5.0), false),      // zywa, na miescie -> TAK
        tu("b", 1, 3, 4, None, false),           // hp nieustawione -> TAK
        tu("c", 1, 3, 4, Some(0.0), false),      // hp = 0 -> NIE
        tu("d", 1, 3, 4, Some(-2.0), false),     // hp < 0 -> NIE
        tu("e", 1, 3, 4, Some(7.0), true),       // cywil -> NIE
        tu("f", 2, 3, 4, Some(7.0), false),      // obcy wlasciciel -> NIE
        tu("g", 1, 3, 5, Some(7.0), false),      // sasiedni hex -> NIE
        tu("h", 1, 3, 4, Some(f64::NAN), false), // NaN: web `NaN <= 0` = fałsz -> TAK
    ]
}

#[test]
fn defenders_match_web_vector() {
    // Wektor web: defenders = ["a", "b", "h"].
    let units = defender_fixture();
    let city = SiegeCityPos {
        owner_id: 1,
        q: 3,
        r: 4,
    };
    let got = siege_defender_units(&units, city, pos, |u| u.civ);
    assert_eq!(ids(&got), vec!["a", "b", "h"]);
}

#[test]
fn defenders_do_not_require_fortification_flag() {
    // Regresja FALA 555: jednostka na miescie bez ufortyfikowania nadal jest obronca (brak pola inGarnizon w wejsciu).
    let units = vec![tu("x", 1, 0, 0, Some(10.0), false)];
    let got = siege_defender_units(
        &units,
        SiegeCityPos {
            owner_id: 1,
            q: 0,
            r: 0,
        },
        pos,
        |u| u.civ,
    );
    assert_eq!(ids(&got), vec!["x"]);
}

#[test]
fn defenders_empty_when_no_units_on_hex() {
    let units = vec![tu("g", 1, 3, 5, Some(7.0), false)];
    let got = siege_defender_units(
        &units,
        SiegeCityPos {
            owner_id: 1,
            q: 3,
            r: 4,
        },
        pos,
        |u| u.civ,
    );
    assert!(got.is_empty());
}

#[test]
fn defenders_keep_input_order() {
    let units = vec![
        tu("z", 1, 1, 1, None, false),
        tu("m", 1, 1, 1, Some(3.0), false),
        tu("a", 1, 1, 1, Some(1.0), false),
    ];
    let got = siege_defender_units(
        &units,
        SiegeCityPos {
            owner_id: 1,
            q: 1,
            r: 1,
        },
        pos,
        |u| u.civ,
    );
    assert_eq!(ids(&got), vec!["z", "m", "a"]);
}

// ---------- garrison_hp_totals (web garrisonHpTotals) ----------

#[test]
fn totals_match_web_vector() {
    // Wektor web: [inf hp12 (-> 10/10), pik bez hp (20/20), zero hp3 (pominiety)] -> {hp 30, maxHp 30, count 2}.
    let units = vec![
        gu("inf", Some(12.0)),
        gu("pik", None),
        gu("zero", Some(3.0)),
    ];
    let t = garrison_hp_totals(&units, &max_hp);
    assert_eq!(t.count, 2);
    assert_eq!(t.max_hp, 30.0);
    assert_eq!(t.hp, 30.0);
}

// ---------- siege_starvation_state (web siegeStarvationState) ----------

#[test]
fn not_besieged_gives_empty_state() {
    let s = run(&city(Some(false), None, None), &[gu("inf", None)], 0.0);
    assert_eq!(s, SiegeStarvationState::default());
}

#[test]
fn positive_food_gives_empty_state() {
    let s = run(&city(Some(true), None, None), &[gu("inf", None)], 5.0);
    assert_eq!(s, SiegeStarvationState::default());
}

#[test]
fn zero_food_no_garrison_sets_legacy_pending() {
    // Wektor web legacy_nogarrison_start.
    let s = run(&city(Some(true), None, None), &[], 0.0);
    assert!(s.hunger_started && s.set_legacy_pending);
    assert!(!s.record_start && !s.apply_attrition && !s.surrender);
    assert_eq!(s.hp_fraction, None);
    assert_eq!(s.start_max_hp, None);
}

#[test]
fn first_hungry_tick_records_start_without_attrition() {
    // Wektor web record_start: inf hp4 + pik bez hp (= 20/20) -> hp 24 z maxHp 30 -> start 30, udzial 0,8.
    let s = run(
        &city(Some(true), None, None),
        &[gu("inf", Some(4.0)), gu("pik", None)],
        0.0,
    );
    assert!(s.hunger_started && s.record_start);
    assert!(!s.apply_attrition && !s.surrender);
    assert_eq!(s.start_max_hp, Some(30.0));
    assert!(approx(s.hp_fraction, 0.8));
}

#[test]
fn attrition_at_exactly_half_holds_city() {
    // Wektor web attrition_ok_half: start 30, hp 5+10 = 15 -> 0,5 (remis = miasto trzyma).
    let c = city(Some(true), Some(30.0), None);
    let s = run(&c, &[gu("inf", Some(5.0)), gu("pik", Some(10.0))], 0.0);
    assert!(s.apply_attrition && !s.surrender);
    assert!(approx(s.hp_fraction, 0.5));
    assert_eq!(s.start_max_hp, Some(30.0));
}

#[test]
fn attrition_below_half_surrenders() {
    // Wektor web attrition_below: start 30, hp 4+10 = 14 -> 0,4667 < 0,5 -> poddanie.
    let c = city(Some(true), Some(30.0), None);
    let s = run(&c, &[gu("inf", Some(4.0)), gu("pik", Some(10.0))], 0.0);
    assert!(s.apply_attrition && s.surrender);
    assert!(approx(s.hp_fraction, 14.0 / 30.0));
}

#[test]
fn empty_garrison_with_start_surrenders() {
    // Wektor web empty_garrison_start.
    let c = city(Some(true), Some(30.0), None);
    let s = run(&c, &[], 0.0);
    assert!(s.apply_attrition && s.surrender);
    assert!(approx(s.hp_fraction, 0.0));
}

#[test]
fn pending_flag_surrenders_immediately() {
    // Wektor web pending_flag.
    let c = city(Some(true), None, Some(true));
    let s = run(&c, &[], 0.0);
    assert!(s.hunger_started && s.surrender);
    assert!(!s.apply_attrition && !s.record_start);
}

#[test]
fn nan_start_counts_as_no_start() {
    // Wektor web start_nan: NaN nie jest startem -> zapis startu (10 = maxHp garnizonu), udzial 1.
    let c = city(Some(true), Some(f64::NAN), None);
    let s = run(&c, &[gu("inf", Some(10.0))], 0.0);
    assert!(s.record_start && !s.apply_attrition);
    assert_eq!(s.start_max_hp, Some(10.0));
    assert!(approx(s.hp_fraction, 1.0));
}

#[test]
fn zero_start_counts_as_no_start() {
    // Wektor web start_zero.
    let c = city(Some(true), Some(0.0), None);
    let s = run(&c, &[gu("inf", Some(10.0))], 0.0);
    assert!(s.record_start && !s.apply_attrition);
    assert_eq!(s.start_max_hp, Some(10.0));
}

#[test]
fn zero_max_unit_is_skipped_in_fraction() {
    // Wektor web hpmax_zero_skipped: zero (maxHp 0) pominiety; inf hp3 -> 3/10 = 0,3.
    let c = city(Some(true), None, None);
    let s = run(&c, &[gu("zero", None), gu("inf", Some(3.0))], 0.0);
    assert!(s.record_start);
    assert!(approx(s.hp_fraction, 0.3));
    assert_eq!(s.start_max_hp, Some(10.0));
}

#[test]
fn nan_food_is_treated_as_zero() {
    // Wektor web food_nan: food NaN -> 0 -> glod (start zapisany).
    let c = city(Some(true), None, None);
    let s = run(&c, &[gu("inf", Some(10.0))], f64::NAN);
    assert!(s.hunger_started && s.record_start);
}

fn approx(a: Option<f64>, b: f64) -> bool {
    matches!(a, Some(x) if (x - b).abs() < 1e-12)
}
