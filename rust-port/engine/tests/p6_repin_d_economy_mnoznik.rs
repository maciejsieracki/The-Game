//! REPIN-EKONOMIA-D, partia D2.1 — testy portu mnoznikow z `gra/src/game/economy.ts` (pin `91dc998a`).
//!
//! Wektory: `tests/p6_repin_d_economy_vectors/mnoznik-main.json` (wbudowana macierz `civ-matrix.json`,
//! identyczna bajtowo z `gra/data/civ-matrix.json@91dc998a`) i `mnoznik-zero.json` (kopia macierzy,
//! w ktorej wiersz 0 ma surowe zero `meta_mnoznik_waluta`, a wiersz 1 nie ma pola => domyslna 2).
//! Generowane URUCHOMIENIEM weba (node 22.22, `--experimental-strip-types`), generator:
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D-Q1/logs/gen-vectors-mnoznik.mts`.
//!
//! - `parity_*`: wektory weba (porownanie BIT-W-BIT, znak zera i NaN sprawdzane).
//! - `structural_*` / `boundary_*`: galezie logiki wyprowadzone z kodu weba.

use civ_engine::data::civilizations::{CivMatrixFile, Num};
use civ_engine::domain::civ_matrix::{load_civ_matrix, CivMatrixData};
use civ_engine::domain::economy_yield::{
    civ_economy_yield_multipliers, civ_matrix_mnoznik_handel_pieniadz_raw,
    mnoznik_handel_pieniadz_for_civ, mnoznik_handel_pieniadz_for_civ_by_difficulty,
    mnoznik_handel_trudnosc_delta, MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT,
};
use civ_engine::domain::types::Difficulty;
use serde_json::{json, Value};

const MAIN_VECTORS: &str = include_str!("p6_repin_d_economy_vectors/mnoznik-main.json");
const ZERO_VECTORS: &str = include_str!("p6_repin_d_economy_vectors/mnoznik-zero.json");
const EMBEDDED_MATRIX: &str = include_str!("../data/civ-matrix.json");

fn vectors(text: &str) -> Value {
    serde_json::from_str(text).expect("vectors parse")
}

/// Liczba zakodowana przez generator: `{"f": String(x)}` (`-0` jako `"-0"`, `NaN`, `Infinity`).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

/// Klucz cywilizacji: `null` i `{"u":true}` (undefined) => brak (web: `!civKey`); string => klucz.
fn key(v: &Value) -> Option<&str> {
    v.as_str()
}

/// Wartosc zapasowa: `{"default":true}` => domyslna wartosc parametru web (`fallback = 1`).
fn fb_arg(v: &Value) -> f64 {
    if v.get("default").is_some() {
        MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT
    } else {
        ef(v)
    }
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

fn diff_of(s: &str) -> Difficulty {
    match s {
        "easy" => Difficulty::Easy,
        "normal" => Difficulty::Normal,
        "hard" => Difficulty::Hard,
        other => panic!("unknown difficulty {other}"),
    }
}

fn zero_matrix() -> CivMatrixData {
    // Ta sama zmiana co w generatorze weba (make-zero-matrix): wiersz 0 => 0, wiersz 1 => pole pominiete.
    let mut v: Value = serde_json::from_str(EMBEDDED_MATRIX).expect("embedded matrix parse");
    v["cywilizacje"][0]["params"]["meta_mnoznik_waluta"] = json!(0);
    v["cywilizacje"][1]["params"]
        .as_object_mut()
        .expect("params object")
        .remove("meta_mnoznik_waluta");
    CivMatrixData::from_json(&v.to_string()).expect("zero matrix parse")
}

fn main_matrix() -> &'static CivMatrixFile {
    &load_civ_matrix().file
}

#[test]
fn parity_mnoznik_for_civ_main() {
    let w = vectors(MAIN_VECTORS);
    let cases = w["forCiv"].as_array().unwrap();
    assert_eq!(cases.len(), 588);
    let m = main_matrix();
    for c in cases {
        let got = mnoznik_handel_pieniadz_for_civ(m, key(&c["key"]), fb_arg(&c["fb"]));
        assert!(same(got, ef(&c["out"])), "forCiv mismatch: {c}");
    }
}

#[test]
fn parity_mnoznik_by_difficulty_main() {
    let w = vectors(MAIN_VECTORS);
    let cases = w["byDiff"].as_array().unwrap();
    assert_eq!(cases.len(), 1029);
    let m = main_matrix();
    for c in cases {
        let got = mnoznik_handel_pieniadz_for_civ_by_difficulty(
            m,
            key(&c["key"]),
            diff_of(c["diff"].as_str().unwrap()),
            ef(&c["fb"]),
        );
        assert!(same(got, ef(&c["out"])), "byDiff mismatch: {c}");
    }
}

#[test]
fn parity_mnoznik_for_civ_zero_matrix() {
    let w = vectors(ZERO_VECTORS);
    let cases = w["forCiv"].as_array().unwrap();
    assert_eq!(cases.len(), 588);
    let zm = zero_matrix();
    for c in cases {
        let got = mnoznik_handel_pieniadz_for_civ(&zm.file, key(&c["key"]), fb_arg(&c["fb"]));
        assert!(same(got, ef(&c["out"])), "zero forCiv mismatch: {c}");
    }
}

#[test]
fn parity_mnoznik_by_difficulty_zero_matrix() {
    let w = vectors(ZERO_VECTORS);
    let cases = w["byDiff"].as_array().unwrap();
    assert_eq!(cases.len(), 1029);
    let zm = zero_matrix();
    for c in cases {
        let got = mnoznik_handel_pieniadz_for_civ_by_difficulty(
            &zm.file,
            key(&c["key"]),
            diff_of(c["diff"].as_str().unwrap()),
            ef(&c["fb"]),
        );
        assert!(same(got, ef(&c["out"])), "zero byDiff mismatch: {c}");
    }
}

#[test]
fn parity_civ_economy_yield_multipliers() {
    let w = vectors(MAIN_VECTORS);
    let cases = w["yieldMult"].as_array().unwrap();
    assert_eq!(cases.len(), 4);
    for c in cases {
        let got = civ_economy_yield_multipliers();
        assert_eq!(c["out"]["handel"].as_f64(), Some(got.handel), "handel: {c}");
        assert_eq!(c["out"]["nauka"].as_f64(), Some(got.nauka), "nauka: {c}");
    }
}

#[test]
fn boundary_trudnosc_delta_table() {
    assert_eq!(mnoznik_handel_trudnosc_delta(Difficulty::Easy), 0.5);
    assert_eq!(mnoznik_handel_trudnosc_delta(Difficulty::Normal), 0.0);
    assert_eq!(mnoznik_handel_trudnosc_delta(Difficulty::Hard), -0.5);
}

#[test]
fn structural_empty_or_missing_key_is_unknown() {
    let m = main_matrix();
    assert_eq!(civ_matrix_mnoznik_handel_pieniadz_raw(m, None), None);
    assert_eq!(civ_matrix_mnoznik_handel_pieniadz_raw(m, Some("")), None);
    assert_eq!(
        civ_matrix_mnoznik_handel_pieniadz_raw(m, Some("nieznana_cywilizacja")),
        None
    );
}

#[test]
fn structural_key_lookup_is_case_insensitive_across_three_fields() {
    let m = main_matrix();
    let by_id = civ_matrix_mnoznik_handel_pieniadz_raw(m, Some("grecy"));
    assert!(by_id.is_some());
    assert_eq!(
        civ_matrix_mnoznik_handel_pieniadz_raw(m, Some("GRECY")),
        by_id
    );
}

#[test]
fn structural_unknown_key_returns_fallback_without_delta() {
    let m = main_matrix();
    // Brak wiersza => fallbackScaled bez drugiej warstwy delty (nawet przy trudnosci hard/easy).
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ_by_difficulty(m, Some("x"), Difficulty::Hard, 2.5),
        2.5
    );
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ_by_difficulty(m, Some("x"), Difficulty::Easy, 2.5),
        2.5
    );
}

#[test]
fn structural_known_raw_zero_is_authoritative_and_gets_delta() {
    let zm = zero_matrix();
    // Surowe zero znanej cywilizacji NIE wraca do fallbacku (web: Number.isFinite, nie > 0).
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ(&zm.file, Some("grecy"), 1.0),
        0.0
    );
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ_by_difficulty(
            &zm.file,
            Some("grecy"),
            Difficulty::Easy,
            9.0
        ),
        0.5
    );
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ_by_difficulty(
            &zm.file,
            Some("grecy"),
            Difficulty::Normal,
            9.0
        ),
        0.0
    );
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ_by_difficulty(
            &zm.file,
            Some("grecy"),
            Difficulty::Hard,
            9.0
        ),
        -0.5
    );
}

#[test]
fn structural_known_row_missing_field_uses_matrix_default() {
    let zm = zero_matrix();
    // Wiersz bez pola => defaults.meta_mnoznik_waluta = 2 (a nie fallback wywolujacego).
    assert_eq!(
        mnoznik_handel_pieniadz_for_civ(&zm.file, Some("rzymianie"), 1.0),
        2.0
    );
}

#[test]
fn structural_non_finite_matrix_value_is_unknown() {
    // web civMatrixMnoznikHandelPieniadzRaw (L717-728): Number.isFinite(raw) ? raw : undefined.
    // Wartosc nieskonczona lub NaN w wierszu znanej cywilizacji => brak => fallback
    // (ten test zabija mutacje `is_finite().then_some(v)` -> `Some(v)`, ktora przepuszcza NaN/Inf).
    for bad in [f64::INFINITY, f64::NEG_INFINITY, f64::NAN] {
        let mut file = main_matrix().clone();
        file.cywilizacje[0]
            .params
            .insert("meta_mnoznik_waluta".to_string(), Num::Float(bad));
        assert_eq!(
            civ_matrix_mnoznik_handel_pieniadz_raw(&file, Some("grecy")),
            None
        );
        assert_eq!(
            mnoznik_handel_pieniadz_for_civ(&file, Some("grecy"), 3.0),
            3.0
        );
        assert_eq!(
            mnoznik_handel_pieniadz_for_civ_by_difficulty(
                &file,
                Some("grecy"),
                Difficulty::Easy,
                3.0
            ),
            3.0
        );
    }
}

#[test]
fn structural_fallback_default_is_web_default_one() {
    assert_eq!(MNOZNIK_HANDEL_PIENIADZ_FALLBACK_DEFAULT, 1.0);
}
