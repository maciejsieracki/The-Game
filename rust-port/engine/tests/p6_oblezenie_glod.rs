//! R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1 (partia 1): testy `domain::siege_starvation` (glod garnizonu i poddanie).
//!
//! Wektory: wynik web `gra/src/game/siege-starvation.ts` (`a61337844`) uruchomiony pod Node 22
//! (`--experimental-strip-types`) na tych samych wejsciach; oczekiwania podane jawnie ponizej.
//! Granice N-1/N/N+1 dla progu 0,5 (remis 50,0% = miasto trzyma) oraz NaN/Inf wg zasad web.

use civ_engine::domain::siege_starvation::{
    garrison_hp_totals, siege_starvation_state, SiegeGarrisonUnit, SiegeStarvationCity,
    SiegeStarvationParams, SiegeStarvationState, SIEGE_SURRENDER_BELOW_FRAC,
};

/// Web `getMaxHp` z testow: inf=10, pik=20, zero=0, nieznany=0.
fn max_hp(t: &str) -> f64 {
    match t {
        "inf" => 10.0,
        "pik" => 20.0,
        _ => 0.0,
    }
}

fn unit(type_id: &str, hp: Option<f64>) -> SiegeGarrisonUnit {
    SiegeGarrisonUnit {
        hp,
        hp_max: None,
        type_id: Some(type_id.to_string()),
    }
}

fn besieged(start: Option<f64>) -> SiegeStarvationCity {
    SiegeStarvationCity {
        oblegane: Some(true),
        siege_capitulation_pending: None,
        siege_starve_start_max_hp: start,
    }
}

fn food(v: f64) -> SiegeStarvationParams {
    SiegeStarvationParams {
        food: v,
        surrender_below_frac: None,
    }
}

fn run(city: &SiegeStarvationCity, units: &[SiegeGarrisonUnit], f: f64) -> SiegeStarvationState {
    siege_starvation_state(city, units, &food(f), &max_hp)
}

fn approx(a: Option<f64>, b: f64) -> bool {
    matches!(a, Some(x) if (x - b).abs() < 1e-12)
}

#[test]
fn threshold_constant_is_half() {
    assert_eq!(SIEGE_SURRENDER_BELOW_FRAC, 0.5);
}

#[test]
fn not_besieged_returns_empty_state() {
    let city = SiegeStarvationCity {
        oblegane: Some(false),
        ..Default::default()
    };
    assert_eq!(
        run(&city, &[unit("inf", None)], 0.0),
        SiegeStarvationState::default()
    );
    let unset = SiegeStarvationCity::default();
    assert_eq!(run(&unset, &[], 0.0), SiegeStarvationState::default());
}

#[test]
fn food_boundary_n_minus_1_n_n_plus_1() {
    let units = [unit("inf", None)];
    let city = besieged(None);
    // N-1: zapasy dodatnie (cokolwiek > 0) -> brak glodu.
    assert_eq!(run(&city, &units, 1e-9), SiegeStarvationState::default());
    // N: zapasy 0 -> glod sie zaczyna (zapis startu).
    let at_zero = run(&city, &units, 0.0);
    assert!(at_zero.hunger_started && at_zero.record_start);
    // N+1 (ujemne): tez glod.
    let neg = run(&city, &units, -1.0);
    assert!(neg.hunger_started && neg.record_start);
}

#[test]
fn food_nan_is_treated_as_zero() {
    // web: Number.isFinite(food) ? food : 0 -> NaN => 0 => glod.
    let s = run(&besieged(None), &[unit("inf", None)], f64::NAN);
    assert!(s.hunger_started && s.record_start);
    assert!(approx(s.start_max_hp, 10.0));
    assert!(approx(s.hp_fraction, 1.0));
    assert!(!s.surrender);
}

#[test]
fn food_infinite_is_treated_as_zero() {
    let s = run(&besieged(None), &[unit("inf", None)], f64::INFINITY);
    assert!(s.hunger_started && s.record_start);
}

#[test]
fn no_garrison_sets_legacy_pending() {
    let s = run(&besieged(None), &[], 0.0);
    assert!(s.hunger_started && s.set_legacy_pending);
    assert!(!s.record_start && !s.surrender);
    assert_eq!(s.hp_fraction, None);
    assert_eq!(s.start_max_hp, None);
}

#[test]
fn zero_max_units_are_skipped_to_legacy() {
    let s = run(&besieged(None), &[unit("zero", Some(5.0))], 0.0);
    assert!(s.set_legacy_pending && !s.record_start);
}

#[test]
fn hp_max_zero_does_not_fall_back_to_type_table() {
    // JS `hpMax ?? getMaxHp(typeId)`: 0 nie jest null, wiec brak fallbacku -> maxHP 0 -> pominiete.
    let u = SiegeGarrisonUnit {
        hp: None,
        hp_max: Some(0.0),
        type_id: Some("inf".into()),
    };
    let s = run(&besieged(None), &[u], 0.0);
    assert!(s.set_legacy_pending);
}

#[test]
fn pending_flag_surrenders_regardless_of_food() {
    let city = SiegeStarvationCity {
        oblegane: Some(true),
        siege_capitulation_pending: Some(true),
        siege_starve_start_max_hp: None,
    };
    let s = run(&city, &[], 3.0);
    assert!(s.surrender && s.hunger_started);
    assert!(!s.apply_attrition);
}

#[test]
fn first_tick_records_start_without_attrition() {
    let s = run(
        &besieged(None),
        &[unit("inf", None), unit("pik", None)],
        0.0,
    );
    assert!(s.record_start && !s.apply_attrition && !s.surrender);
    assert!(approx(s.start_max_hp, 30.0));
    assert!(approx(s.hp_fraction, 1.0));
}

#[test]
fn first_tick_partial_hp_gives_fraction() {
    let s = run(&besieged(None), &[unit("inf", Some(5.0))], 0.0);
    assert!(s.record_start);
    assert!(approx(s.start_max_hp, 10.0));
    assert!(approx(s.hp_fraction, 0.5));
}

#[test]
fn first_tick_hp_max_overrides_type_table() {
    let u = SiegeGarrisonUnit {
        hp: Some(1.0),
        hp_max: Some(4.0),
        type_id: Some("pik".into()),
    };
    let s = run(&besieged(None), &[u], 0.0);
    assert!(approx(s.start_max_hp, 4.0));
    assert!(approx(s.hp_fraction, 0.25));
}

#[test]
fn stored_start_exactly_half_does_not_surrender() {
    // N: 15/30 = 0,5 -> miasto trzyma (remis).
    let s = run(
        &besieged(Some(30.0)),
        &[unit("inf", Some(5.0)), unit("pik", Some(10.0))],
        0.0,
    );
    assert!(s.apply_attrition && !s.surrender && !s.record_start);
    assert!(approx(s.hp_fraction, 0.5));
}

#[test]
fn stored_start_just_above_half_does_not_surrender() {
    // N+1: 16/30 > 0,5.
    let s = run(
        &besieged(Some(30.0)),
        &[unit("inf", Some(5.0)), unit("pik", Some(11.0))],
        0.0,
    );
    assert!(s.apply_attrition && !s.surrender);
}

#[test]
fn stored_start_just_below_half_surrenders() {
    // N-1: 14/30 < 0,5.
    let s = run(
        &besieged(Some(30.0)),
        &[unit("inf", Some(4.0)), unit("pik", Some(10.0))],
        0.0,
    );
    assert!(s.apply_attrition && s.surrender);
}

#[test]
fn stored_start_empty_garrison_surrenders() {
    let s = run(&besieged(Some(30.0)), &[], 0.0);
    assert!(s.apply_attrition && s.surrender);
    assert!(approx(s.hp_fraction, 0.0));
    assert!(approx(s.start_max_hp, 30.0));
}

#[test]
fn stored_start_nan_or_zero_counts_as_no_start() {
    let units = [unit("inf", None)];
    let nan = run(&besieged(Some(f64::NAN)), &units, 0.0);
    assert!(nan.record_start && !nan.apply_attrition);
    assert!(approx(nan.start_max_hp, 10.0));
    let zero = run(&besieged(Some(0.0)), &units, 0.0);
    assert!(zero.record_start && !zero.apply_attrition);
}

#[test]
fn hp_above_max_is_clamped() {
    let s = run(&besieged(Some(10.0)), &[unit("inf", Some(99.0))], 0.0);
    assert!(approx(s.hp_fraction, 1.0));
    assert!(!s.surrender);
}

#[test]
fn hp_nan_counts_as_zero_and_surrenders() {
    let s = run(&besieged(Some(10.0)), &[unit("inf", Some(f64::NAN))], 0.0);
    assert!(approx(s.hp_fraction, 0.0));
    assert!(s.surrender);
}

#[test]
fn custom_surrender_fraction_is_honored() {
    let params = SiegeStarvationParams {
        food: 0.0,
        surrender_below_frac: Some(0.8),
    };
    let s = siege_starvation_state(
        &besieged(Some(10.0)),
        &[unit("inf", Some(7.0))],
        &params,
        &max_hp,
    );
    assert!(s.surrender);
    assert!(approx(s.hp_fraction, 0.7));
}

#[test]
fn stored_start_wins_over_legacy_path() {
    let s = run(&besieged(Some(10.0)), &[unit("inf", Some(10.0))], 0.0);
    assert!(apply_only(&s));
}

fn apply_only(s: &SiegeStarvationState) -> bool {
    s.apply_attrition && !s.set_legacy_pending && !s.record_start && !s.surrender
}

#[test]
fn garrison_totals_skip_nonpositive_and_clamp() {
    let units = [
        unit("inf", Some(4.0)),
        unit("zero", Some(9.0)),
        unit("inf", Some(f64::INFINITY)),
    ];
    let t = garrison_hp_totals(&units, &max_hp);
    assert_eq!(t.count, 2);
    assert!((t.max_hp - 20.0).abs() < 1e-12);
    // 4 + 0 (inf -> nie skonczone -> 0)
    assert!((t.hp - 4.0).abs() < 1e-12);
}

#[test]
fn garrison_totals_empty() {
    let t = garrison_hp_totals(&[], &max_hp);
    assert_eq!(t.count, 0);
    assert_eq!(t.max_hp, 0.0);
    assert_eq!(t.hp, 0.0);
}
