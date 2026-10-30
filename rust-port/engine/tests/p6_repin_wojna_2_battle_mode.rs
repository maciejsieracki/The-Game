//! REPIN-WOJNA-2 (U2) - `gra/src/game/battle-mode.ts` (pin dc8a3adc) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_repin_wojna_2_vectors/battle-mode.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-battle-mode-vectors.mjs`).

use civ_engine::domain::battle_mode::{is_automatic_only_battle_mode, BATTLE_MODE_SETTING_VERSION};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_2_vectors/battle-mode.json");

/// Zapis wartosci wejsciowej z wektora -> `Option<f64>` (wersja; `null`/`undef` = None).
fn version(enc: &str) -> Option<f64> {
    match enc {
        "undef" | "null" => None,
        other => Some(
            other
                .strip_prefix("num:")
                .expect("wersja: num:<n>")
                .parse::<f64>()
                .expect("liczba"),
        ),
    }
}

/// Zapis `battleAlwaysManual` -> `Option<bool>`: tylko boolowskie `false`/`true` sa `Some`,
/// wszystkie inne typy/wartosci sa `None` (zalozenie modulu: web `=== false` ich nie spelnia).
fn manual(enc: &str) -> Option<bool> {
    match enc {
        "bool:true" => Some(true),
        "bool:false" => Some(false),
        _ => None,
    }
}

#[test]
fn version_constant_matches_web() {
    let v: Value = serde_json::from_str(VECTORS).expect("battle-mode.json");
    let want = v["BATTLE_MODE_SETTING_VERSION"].as_str().expect("stala");
    assert_eq!(BATTLE_MODE_SETTING_VERSION.to_string(), want);
}

#[test]
fn automatic_only_matches_web_on_all_vectors() {
    let v: Value = serde_json::from_str(VECTORS).expect("battle-mode.json");
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 60, "za malo wektorow: {}", cases.len());
    for (i, case) in cases.iter().enumerate() {
        let got = is_automatic_only_battle_mode(
            version(case["settingVersion"].as_str().expect("settingVersion")),
            manual(
                case["battleAlwaysManual"]
                    .as_str()
                    .expect("battleAlwaysManual"),
            ),
        );
        assert_eq!(
            got,
            case["out"].as_bool().expect("out"),
            "przypadek {i}: {case}"
        );
    }
}

/// Mutant-guard: stary zapis (brak markera) z `battleAlwaysManual: false` NIE jest automatyczny.
#[test]
fn legacy_save_without_marker_is_not_automatic_only() {
    assert!(!is_automatic_only_battle_mode(None, Some(false)));
    assert!(!is_automatic_only_battle_mode(Some(0.0), Some(false)));
    assert!(is_automatic_only_battle_mode(Some(1.0), Some(false)));
    assert!(!is_automatic_only_battle_mode(Some(1.0), Some(true)));
    assert!(!is_automatic_only_battle_mode(Some(1.0), None));
}
