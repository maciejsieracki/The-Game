//! P6.8I partia 8I-P1 - predykat reliefu `preservesHillReliefKey` / `preservesHillRelief`.
//! Wektory z URUCHOMIONEGO weba (pin 91dc998a): `tests/p6_8i_vectors/relief.json`, generator:
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1/gen-p6-8i-relief-vectors.mjs`.

use civ_engine::domain::auto_improvements::relief_preserving::{
    preserves_hill_relief, preserves_hill_relief_key,
};
use serde_json::Value;

const RELIEF: &str = include_str!("p6_8i_vectors/relief.json");

fn doc() -> Value {
    serde_json::from_str(RELIEF).expect("relief.json parses")
}

#[test]
fn vectors_pin_is_91dc998a() {
    assert_eq!(doc()["pin"].as_str(), Some("91dc998a"));
}

#[test]
fn key_predicate_matches_pinned_web_vectors() {
    let d = doc();
    let cases = d["keyCases"].as_array().expect("keyCases");
    assert!(cases.len() >= 30);
    for c in cases {
        let key = c["key"].as_str().expect("key");
        let expected = c["expected"].as_bool().expect("expected");
        assert_eq!(preserves_hill_relief_key(key), expected, "key={key:?}");
    }
}

#[test]
fn layers_predicate_matches_pinned_web_vectors() {
    let d = doc();
    let cases = d["layerCases"].as_array().expect("layerCases");
    assert!(cases.len() >= 15);
    for c in cases {
        let layers: Vec<String> = c["layers"]
            .as_array()
            .expect("layers")
            .iter()
            .map(|v| v.as_str().expect("layer").to_string())
            .collect();
        let expected = c["expected"].as_bool().expect("expected");
        assert_eq!(
            preserves_hill_relief(&layers),
            expected,
            "layers={layers:?}"
        );
    }
}

#[test]
fn explicit_keys_and_legacy_kopalnia() {
    for k in ["bydlo", "owce", "lama", "kamieniolom", "tartak", "kopalnia"] {
        assert!(preserves_hill_relief_key(k), "{k}");
    }
    for k in [
        "farma",
        "wyrab",
        "droga",
        "fort",
        "glinianka",
        "stadnina",
        "oboz_lowiecki",
    ] {
        assert!(!preserves_hill_relief_key(k), "{k}");
    }
}

/// Granice prefiksu: N-1 ("kopalni" / "kopalnia") / N ("kopalnia_") / N+1 ("kopalnia_x").
#[test]
fn prefix_boundaries() {
    assert!(!preserves_hill_relief_key("kopalni"));
    assert!(!preserves_hill_relief_key("kopalniany"));
    assert!(!preserves_hill_relief_key("niekopalnia_miedzi"));
    assert!(preserves_hill_relief_key("kopalnia_"));
    assert!(preserves_hill_relief_key("kopalnia_wegla"));
    assert!(preserves_hill_relief_key("kopalnia_przyszla_nowa"));
}

/// Porownanie dokladne: wielkosc liter, spacje i pusty string nie sa trafieniem.
#[test]
fn exact_match_no_trim_no_case_fold() {
    for k in [
        "Bydlo",
        " bydlo",
        "bydlo ",
        "BYDLO",
        "",
        "Kopalnia_miedzi",
        "KOPALNIA",
        "kopalnia-miedzi",
    ] {
        assert!(!preserves_hill_relief_key(k), "{k:?}");
    }
}

/// Pusta lista warstw = false (nie `all` na pustym zbiorze).
#[test]
fn empty_layers_is_false() {
    let empty: [&str; 0] = [];
    assert!(!preserves_hill_relief(&empty));
}

/// Jedna warstwa nie-zachowujaca psuje cala liste (`every`, nie `some`).
#[test]
fn one_non_preserving_layer_breaks_all() {
    assert!(preserves_hill_relief(&["bydlo", "tartak"]));
    assert!(!preserves_hill_relief(&["bydlo", "farma"]));
    assert!(!preserves_hill_relief(&["farma", "bydlo"]));
    assert!(preserves_hill_relief(&["bydlo", "bydlo"]));
}
