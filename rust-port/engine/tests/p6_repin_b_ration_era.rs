//! REPIN-EKONOMIA-B (pin 91dc998a) - mnoznik ery Racji (`rationEraFoodCostMultiplier`) i `ownerEra`
//! w `computeCityRationCost` / `computeCityFoodBalanceV85` / `recomputeCityFoodBalancesInEcon`.
//!
//! Wektory: `tests/p6_repin_b_vectors/ration_era.json` z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B-Q1/gen-repin-b-ration-era.mjs`).
//! Porownanie BITOWE f64. Zrodlo oczekiwan: `gra/src/game/population-growth-v85.ts` @ 91dc998a
//! (`rationEraFoodCostMultiplier`, `computeCityRationCost`).

use civ_engine::domain::city_growth::p6_7a::growth_v85::{
    compute_city_ration_cost, ration_era_food_cost_multiplier,
};
use civ_engine::domain::city_growth::p6_7a::SpichlerzCityBonusState;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_b_vectors/ration_era.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("ration_era.json musi byc poprawnym JSON-em")
}

/// Dekodowanie liczby jak w generatorze: specjalne (`NaN`, `Infinity`, `-Infinity`) jako napisy.
fn dec(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy: {other}"),
        },
        other => panic!("to nie liczba: {other}"),
    }
}

/// `null` = brak argumentu w webie (domyslna era 1).
fn era_of(v: &Value) -> f64 {
    if v.is_null() {
        1.0
    } else {
        dec(v)
    }
}

fn spichlerz(v: &Value) -> Option<SpichlerzCityBonusState> {
    if v.is_null() {
        return None;
    }
    Some(SpichlerzCityBonusState {
        ceramika_active: v["ceramikaActive"].as_bool().unwrap_or(false),
        sol_active: v["solActive"].as_bool().unwrap_or(false),
        ma_spichlerz_pop: v["maSpichlerzPop"].as_bool().unwrap_or(false),
        ma_spichlerz_ii_pop: v["maSpichlerzIIPop"].as_bool().unwrap_or(false),
    })
}

fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

#[test]
fn era_multiplier_matches_web_grid() {
    let v = vectors();
    let rows = v["eraMults"].as_array().expect("eraMults");
    assert!(rows.len() >= 10, "za malo wierszy mnoznika ery");
    for (i, row) in rows.iter().enumerate() {
        let era = era_of(&row["era"]);
        assert_bits(
            &format!("eraMults[{i}]"),
            ration_era_food_cost_multiplier(era),
            dec(&row["mult"]),
        );
    }
}

#[test]
fn ration_cost_with_era_matches_web_bits() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 1000, "za malo przypadkow: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let st = spichlerz(&c["st"]);
        let got = compute_city_ration_cost(
            dec(&c["pop"]),
            dec(&c["level"]),
            st.as_ref(),
            era_of(&c["era"]),
        );
        assert_bits(&format!("cases[{i}]"), got, dec(&c["out"]));
    }
}

/// Zabija mutanty progow: era 2 -> 2x (nie 4x), era 3..=5 -> 4x, era <=1 / NaN / Infinity -> 1x.
#[test]
fn era_thresholds_are_exact() {
    assert_eq!(ration_era_food_cost_multiplier(1.0), 1.0);
    assert_eq!(ration_era_food_cost_multiplier(0.0), 1.0);
    assert_eq!(ration_era_food_cost_multiplier(1.0000001), 4.0);
    assert_eq!(ration_era_food_cost_multiplier(2.0), 2.0);
    assert_eq!(ration_era_food_cost_multiplier(3.0), 4.0);
    assert_eq!(ration_era_food_cost_multiplier(5.0), 4.0);
    assert_eq!(ration_era_food_cost_multiplier(f64::NAN), 1.0);
    assert_eq!(ration_era_food_cost_multiplier(f64::INFINITY), 1.0);
    assert_eq!(ration_era_food_cost_multiplier(f64::NEG_INFINITY), 1.0);
}
