//! R-RUSTPORT-P6-JS-MAX0-REST-Q1 -- `Math.max(0, Math.floor(x))` ze znakiem zera poza modulami oblezenia.
//!
//! `okolica::js_floor_nonneg` (uzywane przez okolica/{auto,manual,sasiedztwo}.rs i turn_economy_loop.rs
//! dla `population` miasta) deleguje do `siege_tactics_blow::js_max(0, floor(x))`. Wektory:
//! `p6_js_max0_rest_vectors/max0_rest.json`, wygenerowane przez `p6_js_max0_rest_gen.mjs` (wykonanie
//! wbudowanego `Math.max(0, Math.floor(x))`, straznik SHA-256 `gra/src/game/okolica.ts` w pinie 07d2fbd72).
//!
//! Porownanie bit-w-bit (`to_bits`): `Math.max(0, -0) === +0`, `Math.max(0, NaN) === NaN`.

use civ_engine::domain::okolica::js_floor_nonneg;
use serde_json::Value;

const MAX0_REST: &str = include_str!("p6_js_max0_rest_vectors/max0_rest.json");

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
fn p6_js_max0_rest_wektory_z_pinu_bit_w_bit() {
    let root: Value = serde_json::from_str(MAX0_REST).expect("max0_rest.json");
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
        check_bits(
            js_floor_nonneg(x),
            num(row, "floor_max0"),
            &format!("floor_max0: {row}"),
        );
    }
}

#[test]
fn p6_js_max0_rest_przypadki_jawne() {
    // Math.max(0, Math.floor(-0)) === +0 (zero ze znakiem: dodatni wygrywa).
    check_bits(js_floor_nonneg(-0.0), 0.0, "floor_max0(-0)");
    check_bits(js_floor_nonneg(0.0), 0.0, "floor_max0(+0)");
    // Math.max(0, Math.floor(-0.5)) === +0 (floor daje -1).
    check_bits(js_floor_nonneg(-0.5), 0.0, "floor_max0(-0.5)");
    // Math.max(0, Math.floor(-0.0001)) === +0 (floor daje -1).
    check_bits(js_floor_nonneg(-0.0001), 0.0, "floor_max0(-0.0001)");
    // Math.max(0, Math.floor(NaN)) === NaN.
    assert!(js_floor_nonneg(f64::NAN).is_nan());
    // Math.max(0, Math.floor(-Inf)) === +0; Math.max(0, Math.floor(+Inf)) === +Inf.
    check_bits(js_floor_nonneg(f64::NEG_INFINITY), 0.0, "floor_max0(-Inf)");
    assert_eq!(js_floor_nonneg(f64::INFINITY), f64::INFINITY);
    // Wartosci skonczone: ulamki obcinane w dol, ujemne -> +0.
    check_bits(js_floor_nonneg(2.7), 2.0, "floor_max0(2.7)");
    check_bits(js_floor_nonneg(-3.0), 0.0, "floor_max0(-3)");
}
