//! P6.8J - testy strazy semantyki JS dla galezi, ktore w rundzie 2 przezywaly mutacje
//! (zero ze znakiem, NaN jako falsy, awaryjne tablice epok). Oczekiwania wg webu 91dc998a
//! (`gra/src/game/society-breakdown.ts`: `Math.max/min/round`, `if (input.haWealth)`,
//! `maxFromEraTable`, `kultReligScaleForEra`). Pokrycie: `04-operator-r3.md` / odpowiedz na zarzuty.

use civ_engine::domain::society_breakdown::{
    compute_happiness_breakdown, fallback_society_scale, js_max, js_min, js_round,
    kult_relig_scale_for_era, sz_max_for_era, HappinessBreakdownInput,
};

#[test]
fn js_max_min_signed_zero_like_math() {
    // Math.max(-0, +0) === +0; Math.min(-0, +0) === -0 (niezaleznie od kolejnosci argumentow).
    assert!(js_max(-0.0, 0.0).is_sign_positive());
    assert!(js_max(0.0, -0.0).is_sign_positive());
    assert!(js_min(-0.0, 0.0).is_sign_negative());
    assert!(js_min(0.0, -0.0).is_sign_negative());
    assert!(js_max(f64::NAN, 1.0).is_nan());
    assert!(js_min(1.0, f64::NAN).is_nan());
}

#[test]
fn js_round_like_math_round() {
    // Math.round: polowki w strone +inf; wynik zero z ujemnego argumentu to -0.
    assert_eq!(js_round(0.5), 1.0);
    assert_eq!(js_round(-0.5), 0.0);
    assert!(js_round(-0.5).is_sign_negative());
    assert!(js_round(-0.4).is_sign_negative());
    assert!(js_round(-0.0).is_sign_negative());
    assert!(js_round(0.0).is_sign_positive());
    assert!(js_round(f64::NAN).is_nan());
}

#[test]
fn nan_and_zero_inputs_are_falsy_no_line() {
    // Web: `if (input.haWealth)`, `haCuda`, `citizenResourceHappinessDelta` - NaN i 0 sa falsy.
    let input = HappinessBreakdownInput {
        ha_wealth: Some(f64::NAN),
        ha_cuda: Some(f64::NAN),
        citizen_resource_happiness_delta: Some(f64::NAN),
        ..Default::default()
    };
    let out = compute_happiness_breakdown(&input, None);
    assert!(out
        .lines
        .iter()
        .all(|l| l.id != "wealth" && l.id != "cuda" && l.id != "zaopatrzenie_obywateli"));
    let zero = HappinessBreakdownInput {
        ha_wealth: Some(0.0),
        ha_cuda: Some(0.0),
        citizen_resource_happiness_delta: Some(0.0),
        ..Default::default()
    };
    let out0 = compute_happiness_breakdown(&zero, None);
    assert!(out0
        .lines
        .iter()
        .all(|l| l.id != "wealth" && l.id != "cuda" && l.id != "zaopatrzenie_obywateli"));
}

#[test]
fn era_table_nonfinite_or_empty_use_same_fallback() {
    // Web `maxFromEraTable`: pusta tablica -> fallback; niefinitny wpis -> fallback (ta sama wartosc).
    let base = fallback_society_scale();
    let mut empty = base.clone();
    empty.sz_max_by_era = vec![];
    let mut nan = base.clone();
    nan.sz_max_by_era = vec![f64::NAN];
    for era in [1.0, 2.0, f64::NAN] {
        let a = sz_max_for_era(era, &empty);
        let b = sz_max_for_era(era, &nan);
        assert!(a.is_finite());
        assert_eq!(a, b, "era {era}");
    }
    let mut kempty = base.clone();
    kempty.kult_relig_by_era = vec![];
    let mut knan = base.clone();
    knan.kult_relig_by_era = vec![f64::NAN];
    let ka = kult_relig_scale_for_era(1.0, &kempty);
    let kb = kult_relig_scale_for_era(1.0, &knan);
    assert!(ka.is_finite());
    assert_eq!(ka, kb);
}
