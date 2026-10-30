//! REPIN-EKONOMIA-B3 (pin webu 91dc998a), partia B3a: `routeCashForCity` (turn-economy.ts).
//!
//! Wektory: `tests/p6_repin_b3_vectors/route_cash*.json` z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/gen-repin-b3-vectors.mjs`).
//! Wariant `_mod`: kopia `civ-matrix.json` z podniesionym `eko_pieniadz_port_proc` dla trzech
//! cywilizacji (fixture testowy, `civ_matrix_mod.json`), liczony tym samym kodem weba.
//! Porownanie bitowe f64 (zero: znak pomijany, NaN == NaN).

use civ_engine::data::civilizations::{parse_civ_matrix, CivMatrixFile};
use civ_engine::domain::city_growth::repin_b3::route_cash_for_city;
use serde_json::Value;

const ROUTE_REAL: &str = include_str!("p6_repin_b3_vectors/route_cash.json");
const ROUTE_MOD: &str = include_str!("p6_repin_b3_vectors/route_cash_mod.json");
const MATRIX_MOD: &str = include_str!("p6_repin_b3_vectors/civ_matrix_mod.json");

fn parse_json(text: &str) -> Value {
    serde_json::from_str(text).expect("wektor musi byc poprawnym JSON-em")
}

/// Liczba z wektora: napis `String(x)` z JS (round-trip; `NaN`, `Infinity`, `-Infinity`).
/// Napisy zamiast liczb JSON: serde_json bez `float_roundtrip` nie parsuje wszystkich liczb dokladnie.
fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other
                .parse::<f64>()
                .unwrap_or_else(|_| panic!("nieznany napis liczbowy w wektorze: {other}")),
        },
        other => panic!("oczekiwano napisu liczbowego, jest: {other}"),
    }
}

fn same_f64(got: f64, expected: f64) -> bool {
    if expected.is_nan() {
        return got.is_nan();
    }
    if expected == 0.0 {
        return got == 0.0;
    }
    got.to_bits() == expected.to_bits()
}

/// Klucz cywilizacji z wektora: `null` = brak (JS undefined), napis = klucz (takze pusty).
fn civ_key(v: &Value) -> Option<&str> {
    v.as_str()
}

fn run_vectors(text: &str, matrix: &CivMatrixFile, min_cases: usize) -> usize {
    let doc = parse_json(text);
    let cases = doc["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= min_cases,
        "za malo przypadkow: {}",
        cases.len()
    );
    let mut mismatches = Vec::new();
    let mut moved = 0usize;
    for case in cases {
        let total = num(&case["total"]);
        let maritime = num(&case["maritime"]);
        let expected = num(&case["out"]);
        let got = route_cash_for_city(matrix, total, maritime, civ_key(&case["civKey"]));
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "total={total} maritime={maritime} civ={:?}: rust={got} web={expected}",
                case["civKey"]
            ));
        }
        if expected.is_finite() && total.is_finite() && expected != total {
            moved += 1;
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci z webem: {mismatches:#?}"
    );
    moved
}

#[test]
fn route_cash_matches_web_vectors_real_matrix() {
    let matrix = parse_civ_matrix().expect("civ-matrix.json (kopia Rust) musi sie parsowac");
    let moved = run_vectors(ROUTE_REAL, &matrix, 5000);
    // Grecy/Hetyci/Fenicjanie maja niezerowy wspolczynnik: wektor musi go pokryc.
    assert!(
        moved >= 100,
        "wektor nie pokrywa mnoznika cywilizacji: {moved}"
    );
}

#[test]
fn route_cash_matches_web_vectors_modified_matrix() {
    let matrix: CivMatrixFile = serde_json::from_str(MATRIX_MOD).expect("civ_matrix_mod.json");
    let moved = run_vectors(ROUTE_MOD, &matrix, 5000);
    // Przypadki, w ktorych mnoznik zmienia wynik (wariant mod: 3 cywilizacje x 3 zapisy x 170 par).
    assert!(
        moved >= 500,
        "wariant z podniesionym wspolczynnikiem za slabo pokryty: {moved}"
    );
}

#[test]
fn route_cash_empty_or_missing_civ_key_is_untreated_sea_cash() {
    let matrix: CivMatrixFile = serde_json::from_str(MATRIX_MOD).expect("civ_matrix_mod.json");
    // JS: pusty napis i undefined sa falsy -> bez mnoznika cywilizacji.
    assert!(same_f64(
        route_cash_for_city(&matrix, 10.0, 4.0, None),
        10.0
    ));
    assert!(same_f64(
        route_cash_for_city(&matrix, 10.0, 4.0, Some("")),
        10.0
    ));
    // Z mnoznikiem Grecy (0.4 w wariancie mod): morski 4 -> 4*1.4 = 5.6, reszta 6 -> 11.6.
    assert!(same_f64(
        route_cash_for_city(&matrix, 10.0, 4.0, Some("grecy")),
        (10.0 - 4.0) + 4.0 * (1.0 + 0.4)
    ));
}

#[test]
fn route_cash_clamps_maritime_to_total_and_non_negative() {
    let matrix: CivMatrixFile = serde_json::from_str(MATRIX_MOD).expect("civ_matrix_mod.json");
    // maritime > total: morska czesc = total (nie wiecej), reszta 0.
    assert!(same_f64(
        route_cash_for_city(&matrix, 3.0, 10.0, Some("grecy")),
        (3.0 - 3.0) + 3.0 * (1.0 + 0.4)
    ));
    // maritime ujemne: morska czesc = 0 (brak mnoznika na zero), reszta = total.
    assert!(same_f64(
        route_cash_for_city(&matrix, 3.0, -2.0, Some("grecy")),
        3.0
    ));
}
