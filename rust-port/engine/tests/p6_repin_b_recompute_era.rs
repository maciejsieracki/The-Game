//! REPIN-EKONOMIA-B (pin 91dc998a) - `recomputeCityFoodBalancesInEcon` z `ownerEra` (`tick.ownerEra ?? 1`).
//!
//! Zabija mutant M4 (`tick.owner_era.unwrap_or(1.0)` -> `1.0`): wektor `recompute_era.json` niesie
//! `ownerEra` 2 i 4 (oraz brak pola = 1) i wyniki z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B-Q1/gen-repin-b-recompute-era.mjs`).
//! Porownanie przez `assert_values` (ten sam kanon co reszta P6.7A). Asercje nie sa oslabione.

#[path = "p6_7a_vectors/common.rs"]
mod common;

use civ_engine::domain::city_growth::p6_7a::recompute_city_food_balances_in_econ;
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_b_vectors/recompute_era.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("recompute_era.json musi byc poprawnym JSON-em")
}

#[test]
fn recompute_with_owner_era_matches_web() {
    let v = vectors();
    let cases = v["recompute"].as_array().expect("recompute");
    for (i, c) in cases.iter().enumerate() {
        let cities: Vec<_> = arr(c, "cities").iter().map(growth_city).collect();
        let mut ticks = ticks_of(&c["ticks"]);
        let sp = spichlerz_map(&c["spichlerz"]);
        recompute_city_food_balances_in_econ(&mut ticks, &cities, sp.as_ref());
        assert_values(
            &format!("recompute_era[{i}]"),
            &ticks_value(&ticks),
            &c["out"],
        );
    }
}

#[test]
fn vector_covers_era_2_and_4_with_nonzero_cost() {
    // Strazak przed pustym wektorem: era 2 i 4 musza wystepowac i dawac koszt rozny od 1x.
    let v = vectors();
    let cases = v["recompute"].as_array().expect("recompute");
    let cost_of = |c: &Value| c["out"][0]["kosztRacji"].as_f64().unwrap_or(0.0);
    let era_of = |c: &Value| c["ticks"][0]["ownerEra"].as_f64();
    let mut seen2 = 0;
    let mut seen4 = 0;
    for c in cases {
        if c["cities"][0]["poziomRacji"].as_f64().unwrap_or(0.0) <= 0.0 {
            continue;
        }
        if c["cities"][0]["population"].as_f64().unwrap_or(0.0) <= 0.0 {
            continue;
        }
        if cost_of(c) == 0.0 {
            continue;
        }
        match era_of(c) {
            Some(2.0) => seen2 += 1,
            Some(4.0) => seen4 += 1,
            _ => {}
        }
    }
    assert!(seen2 > 0, "wektor bez ownerEra=2 z niezerowym kosztem");
    assert!(seen4 > 0, "wektor bez ownerEra=4 z niezerowym kosztem");
}
