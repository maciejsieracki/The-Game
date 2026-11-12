//! R-RUSTPORT-P6-JS-MAX-SIGN-Q1 -- znak zera w `js_max` / `js_min` (`siege_tactics_blow.rs`).
//!
//! `Math.max(-0, +0) === +0` i `Math.min(+0, -0) === -0` w JS; `f64::max` / `f64::min` nie gwarantuja znaku
//! dla pary zer. Wektory: `p6_js_max_sign_vectors/signed.json`, wygenerowane przez `p6_js_max_sign_gen.mjs`
//! (wykonanie `Math.max` / `Math.min`, straznik SHA-256 pinu 07d2fbd72).
//!
//! Porownanie bit-w-bit (`to_bits`): zero ze znakiem, NaN (kanoniczny) i nieskonczonosci musza sie zgadzac.
//! Mutacja usuniecia obslugi zera (`a.max(b)` bez galezi) musi dawac FAIL tego testu.

use civ_engine::domain::siege_tactics_blow::{js_max, js_min};
use serde_json::Value;

const SIGNED: &str = include_str!("p6_js_max_sign_vectors/signed.json");

fn num(v: &Value, key: &str) -> f64 {
    match &v[key] {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("pole {key} musi byc liczba lub napisem, jest {other}"),
    }
}

fn check_bits(got: f64, exp: f64, ctx: &str) {
    assert_eq!(
        got.to_bits(),
        exp.to_bits(),
        "bity rozne (got {got:?}, exp {exp:?}): {ctx}"
    );
}

#[test]
fn p6_js_max_sign_wektory_z_pinu_bit_w_bit() {
    let root: Value = serde_json::from_str(SIGNED).expect("signed.json");
    let rows = root["rows"].as_array().expect("rows");
    assert!(rows.len() >= 200, "za malo wektorow: {}", rows.len());
    let signed_zero = rows
        .iter()
        .filter(|r| r["a"] == "-0" || r["b"] == "-0")
        .count();
    assert!(signed_zero >= 20, "za malo przypadkow z -0: {signed_zero}");

    for row in rows {
        let a = num(row, "a");
        let b = num(row, "b");
        check_bits(js_max(a, b), num(row, "max"), &format!("js_max: {row}"));
        check_bits(js_min(a, b), num(row, "min"), &format!("js_min: {row}"));
    }
}

#[test]
fn p6_js_max_sign_przypadki_jawne() {
    // Math.max(-0, 0) === +0; Math.max(0, -0) === +0; Math.max(-0, -0) === -0.
    check_bits(js_max(-0.0, 0.0), 0.0, "max(-0,+0)");
    check_bits(js_max(0.0, -0.0), 0.0, "max(+0,-0)");
    check_bits(js_max(-0.0, -0.0), -0.0, "max(-0,-0)");
    // Math.min(+0, -0) === -0; Math.min(-0, +0) === -0; Math.min(+0, +0) === +0.
    check_bits(js_min(0.0, -0.0), -0.0, "min(+0,-0)");
    check_bits(js_min(-0.0, 0.0), -0.0, "min(-0,+0)");
    check_bits(js_min(0.0, 0.0), 0.0, "min(+0,+0)");
    // NaN propaguje w obu kierunkach.
    assert!(js_max(f64::NAN, 1.0).is_nan());
    assert!(js_min(-1.0, f64::NAN).is_nan());
    // Wartosci skonczone bez zmian.
    assert_eq!(js_max(2.5, -3.0), 2.5);
    assert_eq!(js_min(2.5, -3.0), -3.0);
}
