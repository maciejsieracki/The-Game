//! P6.M03 - `Math.*` V8 (pow, atan2, sin, hypot, max, min) odtworzone w `masks::v8math`:
//! porownanie BITOWE z wektorami z URUCHOMIONEGO weba (`tests/p6_m03_vectors/jsmath.json`, pin
//! `edb8fb56`) oraz dowod, ze wektory nie sa trywialne (libm systemu rozni sie od V8).

use std::sync::OnceLock;

use civ_engine::domain::mapgen::masks::v8math::{
    js_atan2, js_hypot, js_max, js_min, js_pow, js_sin,
};
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{num, same};

const JSMATH: &str = include_str!("p6_m03_vectors/jsmath.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(JSMATH).expect("jsmath parse"))
}

fn rows(name: &str) -> &'static Vec<Value> {
    web()[name].as_array().expect("wiersze")
}

fn check(name: &str, args: usize, f: impl Fn(&[f64]) -> f64) -> usize {
    let mut count = 0;
    for row in rows(name) {
        let values: Vec<f64> = row.as_array().expect("wiersz").iter().map(num).collect();
        let actual = f(&values[..args]);
        let expected = values[args];
        assert!(
            same(actual, expected),
            "{name}{:?}: rust {actual:?} (bity {:#x}) != web {expected:?} (bity {:#x})",
            &values[..args],
            actual.to_bits(),
            expected.to_bits()
        );
        count += 1;
    }
    count
}

#[test]
fn pow_matches_web_bit_for_bit() {
    let n = check("pow", 2, |v| js_pow(v[0], v[1]));
    assert!(n > 12_000, "za malo wektorow pow: {n}");
}

#[test]
fn atan2_matches_web_bit_for_bit() {
    let n = check("atan2", 2, |v| js_atan2(v[0], v[1]));
    assert!(n > 9_000, "za malo wektorow atan2: {n}");
}

#[test]
fn sin_matches_web_bit_for_bit() {
    let n = check("sin", 1, |v| js_sin(v[0]));
    assert!(n > 6_000, "za malo wektorow sin: {n}");
}

#[test]
fn hypot_matches_web_bit_for_bit() {
    let n = check("hypot", 2, |v| js_hypot(v[0], v[1]));
    assert!(n > 8_000, "za malo wektorow hypot: {n}");
}

/// Wektory musza odrozniac port V8 od libm systemu - inaczej test niczego by nie chronil.
#[test]
fn vectors_distinguish_v8_from_system_libm() {
    fn mismatches(name: &str, args: usize, f: impl Fn(&[f64]) -> f64) -> usize {
        rows(name)
            .iter()
            .filter(|row| {
                let values: Vec<f64> = row.as_array().expect("wiersz").iter().map(num).collect();
                !same(f(&values[..args]), values[args])
            })
            .count()
    }
    assert!(mismatches("pow", 2, |v| v[0].powf(v[1])) > 100);
    assert!(mismatches("atan2", 2, |v| v[0].atan2(v[1])) > 100);
    assert!(mismatches("sin", 1, |v| v[0].sin()) > 100);
    assert!(mismatches("hypot", 2, |v| v[0].hypot(v[1])) > 100);
}

#[test]
fn max_min_follow_javascript_nan_and_signed_zero_rules() {
    assert!(js_max(f64::NAN, 1.0).is_nan());
    assert!(js_max(1.0, f64::NAN).is_nan());
    assert!(js_min(f64::NAN, 1.0).is_nan());
    assert!(js_min(1.0, f64::NAN).is_nan());
    assert!(same(js_max(0.0, -0.0), 0.0));
    assert!(same(js_max(-0.0, 0.0), 0.0));
    assert!(same(js_min(0.0, -0.0), -0.0));
    assert!(same(js_min(-0.0, 0.0), -0.0));
    assert!(same(js_max(-0.0, -0.0), -0.0));
    assert!(same(js_min(0.0, 0.0), 0.0));
    assert!(same(js_max(2.0, 3.0), 3.0));
    assert!(same(js_min(2.0, 3.0), 2.0));
}

#[test]
fn pow_follows_ecmascript_special_cases() {
    // Roznice ECMAScript wzgledem C99 `pow`: NaN w wykladniku, |x| == 1 z nieskonczonym wykladnikiem.
    assert!(js_pow(1.0, f64::NAN).is_nan());
    assert!(js_pow(1.0, f64::INFINITY).is_nan());
    assert!(js_pow(-1.0, f64::NEG_INFINITY).is_nan());
    assert!(same(js_pow(f64::NAN, 0.0), 1.0));
    assert!(same(js_pow(0.0, -1.0), f64::INFINITY));
    assert!(same(js_pow(-0.0, -1.0), f64::NEG_INFINITY));
}

/// Poza zakresem odtworzenia V8 (`|x| > 2^19*pi/2`) `js_sin` nie udaje `Math.sin`: w buildzie z
/// asercjami panikuje (zarzut 8 oceny r1); wektory weba nie siegaja tego zakresu.
#[cfg(debug_assertions)]
#[test]
#[should_panic(expected = "poza zakresem odtworzenia V8")]
fn sin_beyond_reconstructed_domain_panics_in_debug_builds() {
    let _ = js_sin(1.0e7);
}

/// Wewnatrz zakresu `js_sin` nie panikuje i nie wpada w libm.
#[test]
fn sin_inside_domain_does_not_hit_the_fallback() {
    let limit = 2f64.powi(19) * std::f64::consts::FRAC_PI_2;
    for x in [0.0, 1.0, 1.0e5, limit * 0.999, -limit * 0.999] {
        assert!(js_sin(x).is_finite());
    }
}
