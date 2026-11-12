//! R-RUSTPORT-P6-JS-MAX0-HARDENING-Q1 -- `Math.max(0, x)` ze znakiem zera w modulach oblezenia.
//!
//! Lokalne `js_max0` w siege_tactics_{breach,end,endcheck,unit,activate}.rs deleguja teraz do wspolnego
//! `js_max(0.0, x)` (siege_tactics_blow.rs). Wektory: `p6_js_max0_vectors/max0.json`, wygenerowane przez
//! `p6_js_max0_gen.mjs` (wykonanie wbudowanego `Math.max(0, x)`, straznik SHA-256 pinu 07d2fbd72).
//!
//! Porownanie bit-w-bit (`to_bits`). `Math.max(0, -0) === +0`, `Math.max(0, NaN) === NaN`.

use civ_engine::domain::siege_tactics_blow::js_max;
use serde_json::Value;

const MAX0: &str = include_str!("p6_js_max0_vectors/max0.json");

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
fn p6_js_max0_wektory_z_pinu_bit_w_bit() {
    let root: Value = serde_json::from_str(MAX0).expect("max0.json");
    let rows = root["rows"].as_array().expect("rows");
    assert!(rows.len() >= 100, "za malo wektorow: {}", rows.len());
    let neg_zero = rows.iter().filter(|r| r["x"] == "-0").count();
    let nan = rows.iter().filter(|r| r["x"] == "NaN").count();
    let inf = rows
        .iter()
        .filter(|r| r["x"] == "Infinity" || r["x"] == "-Infinity")
        .count();
    assert!(neg_zero >= 10, "za malo -0: {neg_zero}");
    assert!(nan >= 5, "za malo NaN: {nan}");
    assert!(inf >= 5, "za malo Inf: {inf}");

    for row in rows {
        let x = num(row, "x");
        check_bits(js_max(0.0, x), num(row, "max0"), &format!("max0: {row}"));
    }
}

#[test]
fn p6_js_max0_przypadki_jawne() {
    // Math.max(0, -0) === +0 (zero ze znakiem: dodatni wygrywa).
    check_bits(js_max(0.0, -0.0), 0.0, "max(0,-0)");
    check_bits(js_max(0.0, 0.0), 0.0, "max(0,+0)");
    // Math.max(0, NaN) === NaN.
    assert!(js_max(0.0, f64::NAN).is_nan());
    // Math.max(0, -Inf) === +0; Math.max(0, +Inf) === +Inf.
    check_bits(js_max(0.0, f64::NEG_INFINITY), 0.0, "max(0,-Inf)");
    assert_eq!(js_max(0.0, f64::INFINITY), f64::INFINITY);
    // Wartosci skonczone: ujemne -> +0, dodatnie bez zmian.
    check_bits(js_max(0.0, -3.0), 0.0, "max(0,-3)");
    assert_eq!(js_max(0.0, 2.5), 2.5);
}
