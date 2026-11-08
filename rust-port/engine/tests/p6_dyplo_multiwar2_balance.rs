//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 5, domkniecie wyceny `price` z webu): `balanceFor`,
//! `requiredPn` i `tolerancePn` z `price(winner, loser)` (main.ts) zgodne z URUCHOMIONYM webem.
//! Wektory: `tests/p6_dyplo_multiwar2_balance_data/balance.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-balance.mts`
//! (origin/main 5dd53e60f, `peaceOfferAiOwnBilans` / `peaceOfferAiRequestPn` / `aiOfferPwSurplusTolerance`).
//! Pokrycie: bazy {0,-10,1,2,333,500,1000,2000,500=pokoj}, relacje -50..300 (w tym granice clamp +-90 i 100),
//! trzy trudnosci, pokrycie {0,1,5.5,100,777.25,-3,1234}.

use civ_engine::domain::diplomacy_war_weariness_tick::*;
use serde_json::Value;

const BALANCE: &str = include_str!("p6_dyplo_multiwar2_balance_data/balance.json");

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznana liczba {other}"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn difficulty(s: &str) -> WebDifficulty {
    match s {
        "easy" => WebDifficulty::Easy,
        "normal" => WebDifficulty::Normal,
        "hard" => WebDifficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

fn same(actual: f64, expected: f64, ctx: &str) {
    let ok = (actual.is_nan() && expected.is_nan()) || actual == expected;
    assert!(ok, "{ctx}: rust={actual} web={expected}");
}

#[test]
fn balance_required_and_tolerance_match_web_vectors() {
    let doc: Value = serde_json::from_str(BALANCE).unwrap();
    assert_eq!(
        num(&doc["pokojBase"]),
        500.0,
        "baza pokoju z acceptance-points.json"
    );
    let rows = doc["rows"].as_array().unwrap();
    assert_eq!(rows.len(), 2268, "liczba wektorow");
    for r in rows {
        let base = num(&r["base"]);
        let rel = num(&r["rel"]);
        let d = difficulty(r["diff"].as_str().unwrap());
        let cov = num(&r["cov"]);
        let ctx = format!("base={base} rel={rel} diff={d:?} cov={cov}");
        let q = PeacePriceQuote::from_web(base, rel, d);
        same(
            q.balance_for(cov),
            num(&r["balance"]),
            &format!("balanceFor {ctx}"),
        );
        same(
            q.balance_for(0.0),
            num(&r["balance0"]),
            &format!("balanceFor(0) {ctx}"),
        );
        same(
            q.required_pn,
            num(&r["required"]),
            &format!("requiredPn {ctx}"),
        );
        same(
            q.tolerance_pn,
            num(&r["tol"]),
            &format!("tolerancePn {ctx}"),
        );
    }
}

#[test]
fn zero_base_is_constant_zero_balance_even_for_nan_coverage() {
    // Web: `if (basePn <= 0) return 0` - stala 0 niezaleznie od pokrycia.
    let q = PeacePriceQuote::from_web(0.0, 100.0, WebDifficulty::Normal);
    assert_eq!(q.balance_for(777.0), 0.0);
    assert_eq!(q.balance_for(f64::NAN), 0.0);
    assert_eq!(q.required_pn, 0.0);
}

#[test]
fn easy_difficulty_targets_no_required_pn_and_infinite_tolerance() {
    let q = PeacePriceQuote::from_web(500.0, 0.0, WebDifficulty::Easy);
    assert_eq!(q.required_pn, 0.0);
    assert!(q.tolerance_pn.is_infinite() && q.tolerance_pn > 0.0);
}

#[test]
fn balance_slope_is_one_for_positive_base() {
    // Bilans AI jest przesunieciem o pokrycie: N-1 / N / N+1 wokol typowej wartosci.
    let q = PeacePriceQuote::from_web(500.0, 100.0, WebDifficulty::Normal);
    let b0 = q.balance_for(0.0);
    assert_eq!(q.balance_for(9.0) - b0, 9.0);
    assert_eq!(q.balance_for(10.0) - b0, 10.0);
    assert_eq!(q.balance_for(11.0) - b0, 11.0);
}
