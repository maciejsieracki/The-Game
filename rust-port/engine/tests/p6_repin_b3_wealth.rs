//! REPIN-EKONOMIA-B3 (pin webu 91dc998a), partia B3b: `wealthParamsForOwner` (turn-economy.ts)
//! oraz `wealthParamsWithCapModifier` / `wealthParamsWithMultiplierModifier` (wealth.ts).
//!
//! Wektory: `tests/p6_repin_b3_vectors/wealth_owner*.json` z URUCHOMIONEGO weba @ 91dc998a
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/gen-repin-b3-vectors.mjs`).
//! Wariant `_mod`: fixture `civ_matrix_mod.json` (kopia macierzy z podniesionymi
//! `wealth_cap_proc` / `wealth_mnoznik_proc` dla trzech cywilizacji) liczony tym samym kodem weba.
//! W realnej macierzy 91dc998a oba parametry sa 0 dla wszystkich cywilizacji (ścieżka = tożsamosc),
//! wiec pelne pokrycie niezerowych modyfikatorow daje wariant `_mod`.
//! Porownanie bitowe f64 (zero: znak pomijany, NaN == NaN); liczby jako napisy `String(x)` z JS.

use civ_engine::data::civilizations::{parse_civ_matrix, CivMatrixFile};
use civ_engine::domain::city_growth::repin_b3::{
    wealth_params_for_owner, wealth_params_with_cap_modifier,
    wealth_params_with_multiplier_modifier, WealthModParams,
};
use serde_json::Value;

const OWNER_REAL: &str = include_str!("p6_repin_b3_vectors/wealth_owner.json");
const OWNER_MOD: &str = include_str!("p6_repin_b3_vectors/wealth_owner_mod.json");
const MATRIX_MOD: &str = include_str!("p6_repin_b3_vectors/civ_matrix_mod.json");

fn parse_json(text: &str) -> Value {
    serde_json::from_str(text).expect("wektor musi byc poprawnym JSON-em")
}

/// Liczba z wektora: napis `String(x)` z JS (round-trip; `NaN`, `Infinity`, `-Infinity`).
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

fn params_from(v: &Value) -> WealthModParams {
    WealthModParams {
        cap_na_epoke: num(&v["capNaEpoke"]),
        mnoznik_na_poziom: num(&v["mnoznikNaPoziom"]),
    }
}

fn same_params(got: WealthModParams, expected: WealthModParams) -> bool {
    same_f64(got.cap_na_epoke, expected.cap_na_epoke)
        && same_f64(got.mnoznik_na_poziom, expected.mnoznik_na_poziom)
}

fn check_owner_vectors(text: &str, matrix: &CivMatrixFile, min_cases: usize) -> usize {
    let doc = parse_json(text);
    let cases = doc["ownerCases"].as_array().expect("ownerCases");
    assert!(
        cases.len() >= min_cases,
        "za malo przypadkow: {}",
        cases.len()
    );
    let mut mismatches = Vec::new();
    let mut changed = 0usize;
    for case in cases {
        let base = params_from(&case["base"]);
        let key = case["civKey"].as_str();
        let expected = params_from(&case["out"]);
        let got = wealth_params_for_owner(matrix, base, key);
        if !same_params(got, expected) {
            mismatches.push(format!(
                "base={base:?} civ={key:?}: rust={got:?} web={expected:?}"
            ));
        }
        if !same_params(expected, base) {
            changed += 1;
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci z webem (wlasciciel): {mismatches:#?}"
    );
    changed
}

fn check_modifier_vectors(text: &str) {
    let doc = parse_json(text);
    for (field, is_cap) in [
        ("capModifierCases", true),
        ("multiplierModifierCases", false),
    ] {
        let cases = doc[field].as_array().expect(field);
        assert!(
            cases.len() >= 60,
            "{field}: za malo przypadkow: {}",
            cases.len()
        );
        let mut mismatches = Vec::new();
        for case in cases {
            let base = params_from(&case["base"]);
            let m = num(&case["mod"]);
            let expected = params_from(&case["out"]);
            let got = if is_cap {
                wealth_params_with_cap_modifier(base, m)
            } else {
                wealth_params_with_multiplier_modifier(base, m)
            };
            if !same_params(got, expected) {
                mismatches.push(format!(
                    "{field} base={base:?} mod={m}: rust={got:?} web={expected:?}"
                ));
            }
        }
        assert!(
            mismatches.is_empty(),
            "rozbieznosci z webem: {mismatches:#?}"
        );
    }
}

#[test]
fn wealth_modifiers_match_web_vectors() {
    check_modifier_vectors(OWNER_REAL);
    check_modifier_vectors(OWNER_MOD);
}

#[test]
fn wealth_owner_matches_web_vectors_real_matrix() {
    let matrix = parse_civ_matrix().expect("civ-matrix.json (kopia Rust) musi sie parsowac");
    let changed = check_owner_vectors(OWNER_REAL, &matrix, 300);
    // Realna macierz 91dc998a: parametry wealth = 0, wiec wynik = baza (tozsamosc).
    assert_eq!(changed, 0, "realna macierz nie powinna zmieniac Wealth");
}

#[test]
fn wealth_owner_matches_web_vectors_modified_matrix() {
    let matrix: CivMatrixFile = serde_json::from_str(MATRIX_MOD).expect("civ_matrix_mod.json");
    let changed = check_owner_vectors(OWNER_MOD, &matrix, 300);
    // 3 cywilizacje x 3 zapisy x 6 baz = 54 przypadki; 36 zmienia wynik (bazy z zerem/NaN sa tozsame).
    assert!(
        changed >= 30,
        "wariant mod nie pokrywa modyfikatorow: {changed}"
    );
}

#[test]
fn wealth_owner_without_civ_key_returns_base() {
    let matrix: CivMatrixFile = serde_json::from_str(MATRIX_MOD).expect("civ_matrix_mod.json");
    let base = WealthModParams {
        cap_na_epoke: 10.0,
        mnoznik_na_poziom: 0.1,
    };
    // JS: undefined i pusty napis sa falsy -> baza bez zmian, nawet przy niezerowej macierzy.
    assert_eq!(wealth_params_for_owner(&matrix, base, None), base);
    assert_eq!(wealth_params_for_owner(&matrix, base, Some("")), base);
}
