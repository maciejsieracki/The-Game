//! R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1 -- semantyka NaN/Inf `Math.max`/`Math.min` z pinu 07d2fbd72.
//!
//! `f64::max`/`f64::min` ignoruja NaN (zwracaja drugi argument), a JS `Math.max`/`Math.min` NaN propaguja.
//! Dotyczy: `ranged_shot_accuracy` (combat.ts:476), `range_damage_tw` (combat.ts:468), `hit_chance_tw`
//! (combat.ts:446). Wektory: `p6_unit_power_maxnan_vectors/maxnan.json`, wygenerowane przez
//! `p6_unit_power_maxnan_gen.mjs` z WYKONANIA tekstu pinu (straznik SHA-256 w generatorze).
//!
//! Wartosci NaN/Infinity w JSON sa napisami: "NaN", "Infinity", "-Infinity".

use civ_engine::domain::siege_tactics_inputs_pos::js_min_sign;
use civ_engine::domain::unit_power::{hit_chance_tw, range_damage_tw, ranged_shot_accuracy};
use serde_json::Value;

const MAXNAN: &str = include_str!("p6_unit_power_maxnan_vectors/maxnan.json");

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
        other => panic!("pole {key} musi byc liczba, jest {other}"),
    }
}

fn same(got: f64, exp: f64, ctx: &str) {
    if exp.is_nan() {
        assert!(got.is_nan(), "oczekiwano NaN, jest {got}: {ctx}");
    } else {
        assert_eq!(got, exp, "{ctx}");
        // Znak zera jest obserwowalny: Math.max(-0,+0) === +0, Math.min(+0,-0) === -0 (K5I2b2).
        assert_eq!(
            got.is_sign_negative(),
            exp.is_sign_negative(),
            "znak zera: {ctx}"
        );
    }
}

#[test]
fn p6_unit_power_maxnan_wektory_z_pinu_zgodne() {
    let root: Value = serde_json::from_str(MAXNAN).expect("maxnan.json");
    let acc = root["acc"].as_array().expect("acc");
    let hits = root["hits"].as_array().expect("hits");
    let ranges = root["ranges"].as_array().expect("ranges");
    assert!(
        acc.len() >= 200 && hits.len() >= 1000 && ranges.len() >= 200,
        "za malo wektorow"
    );
    let nan_expected = acc.iter().filter(|r| r["expected"] == "NaN").count();
    assert!(
        nan_expected >= 20,
        "wektory musza zawierac przypadki NaN: {nan_expected}"
    );

    for row in acc {
        let got = ranged_shot_accuracy(num(row, "melee"), num(row, "missile"));
        same(
            got,
            num(row, "expected"),
            &format!("rangedShotAccuracy: {row}"),
        );
    }
    for row in hits {
        let got = hit_chance_tw(num(row, "atk"), num(row, "def"), num(row, "bonus"));
        same(got, num(row, "expected"), &format!("hitChanceTw: {row}"));
    }
    for row in ranges {
        let got = range_damage_tw(num(row, "missile"), num(row, "armor"));
        same(got, num(row, "expected"), &format!("rangeDamageTw: {row}"));
    }
}

#[test]
fn p6_unit_power_maxnan_jawne_przypadki_js() {
    // Math.max(NaN, 9) === NaN; f64::max dawalby 9.
    assert!(ranged_shot_accuracy(f64::NAN, 9.0).is_nan());
    assert!(ranged_shot_accuracy(9.0, f64::NAN).is_nan());
    assert_eq!(ranged_shot_accuracy(3.0, 9.0), 9.0);
    // Math.max(1, NaN) === NaN.
    assert!(range_damage_tw(f64::NAN, 1.0).is_nan());
    assert_eq!(range_damage_tw(5.0, 3.0), 2.0);
    // clamp: Math.max(15, Math.min(75, NaN)) === NaN; Infinity -> 75; -Infinity -> 15.
    assert!(hit_chance_tw(f64::NAN, 40.0, 0.0).is_nan());
    assert_eq!(hit_chance_tw(f64::INFINITY, 0.0, 0.0), 75.0);
    assert_eq!(hit_chance_tw(f64::NEG_INFINITY, 0.0, 0.0), 15.0);
    assert_eq!(hit_chance_tw(40.0, 40.0, 0.0), 40.0);
    // Znak zera (K5I2b2): Math.max(-0, +0) === +0; Math.max(-0, -0) === -0; Math.min(+0, -0) === -0.
    assert!(ranged_shot_accuracy(-0.0, 0.0).is_sign_positive());
    assert!(ranged_shot_accuracy(-0.0, -0.0).is_sign_negative());
    assert!(ranged_shot_accuracy(0.0, -0.0).is_sign_positive());
    assert!(js_min_sign(0.0, -0.0).is_sign_negative());
    assert!(js_min_sign(-0.0, 0.0).is_sign_negative());
}
