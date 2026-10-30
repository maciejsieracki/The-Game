//! REPIN-WOJNA-2 R3 - integracja `battle-mode.ts` z zapisem (logika): `restored_setting_version`
//! (web `main.ts:40819-40821`) i `player_battle_automatic_only` (web `main.ts:29052-29060`).
//! Wektory: `tests/p6_repin_wojna_2_r3_vectors/battle-mode-restore.json`, wygenerowane z URUCHOMIONEGO
//! kodu weba dc8a3adc (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r3-battle-mode.mjs`).
//! Kolejnosc wejsc (VERSIONS x MANUALS x ME) musi byc zgodna z generatorem.

use civ_engine::domain::battle_mode::{
    is_automatic_only_battle_mode, player_battle_automatic_only, restored_setting_version,
    BATTLE_MODE_SETTING_VERSION,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_2_r3_vectors/battle-mode-restore.json");

/// Wartosci JS `version` w kolejnosci generatora. `'1'`, `null`, `true`, `false` -> `None`
/// (web `=== 1` jest falszywe dla nie-liczb); `undefined` -> `None`; NaN -> `Some(NaN)`.
const VERSIONS: [Option<f64>; 9] = [
    None,
    Some(1.0),
    Some(0.0),
    Some(2.0),
    None,
    None,
    Some(f64::NAN),
    None,
    None,
];

/// Wartosci JS `battleAlwaysManual`: tylko boolowskie `false`/`true` sa `Some`.
const MANUALS: [Option<bool>; 7] = [None, Some(false), Some(true), None, None, None, None];

const ME: [bool; 2] = [true, false];

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

#[test]
fn restored_setting_version_matches_web() {
    let root = root();
    assert_eq!(
        root["constVersion"].as_f64(),
        Some(BATTLE_MODE_SETTING_VERSION)
    );
    let want = root["restoreOut"].as_array().expect("restoreOut");
    assert_eq!(want.len(), VERSIONS.len());
    let mut restored_some = 0;
    for (input, want) in VERSIONS.iter().zip(want) {
        let got = restored_setting_version(*input);
        match want.as_str() {
            Some("undef") => assert_eq!(got, None, "restore({input:?})"),
            _ => {
                restored_some += 1;
                assert_eq!(
                    got,
                    Some(want.as_f64().expect("liczba")),
                    "restore({input:?})"
                );
            }
        }
    }
    assert_eq!(restored_some, 1, "tylko wersja 1 przechodzi normalizacje");
}

#[test]
fn player_battle_automatic_only_matches_web_on_all_combinations() {
    let root = root();
    let rows = root["rows"].as_array().expect("rows");
    assert_eq!(rows.len(), VERSIONS.len() * MANUALS.len() * ME.len());
    let mut idx = 0;
    let (mut true_restored, mut true_raw) = (0, 0);
    for version in VERSIONS {
        for manual in MANUALS {
            for is_me in ME {
                let row = &rows[idx];
                idx += 1;
                let restored = restored_setting_version(version);
                let got = player_battle_automatic_only(is_me, restored, manual);
                let want = row["restoredThenAuto"].as_u64() == Some(1);
                assert_eq!(
                    got, want,
                    "player({is_me}, restore({version:?}), {manual:?}) vs web {row}"
                );
                if want {
                    true_restored += 1;
                }
                let raw = is_automatic_only_battle_mode(version, manual);
                assert_eq!(
                    raw,
                    row["rawAuto"].as_u64() == Some(1),
                    "raw({version:?}, {manual:?}) vs web {row}"
                );
                if raw {
                    true_raw += 1;
                }
            }
        }
    }
    // Pokrycie: jedyna kombinacja aktywna to wersja 1 + false + isMe.
    assert_eq!(true_restored, 1);
    assert_eq!(true_raw, 2);
}

#[test]
fn legacy_save_without_marker_never_activates_auto_only() {
    // stary zapis: brak wersji markera, `battleAlwaysManual: false` (bezwladna wartosc domyslna)
    assert!(!player_battle_automatic_only(
        true,
        restored_setting_version(None),
        Some(false)
    ));
    // zapis z wersja 2 (przyszla) nie aktywuje trybu
    assert!(!player_battle_automatic_only(
        true,
        restored_setting_version(Some(2.0)),
        Some(false)
    ));
    // gracz niebedacy "mną" nigdy nie dostaje trybu
    assert!(!player_battle_automatic_only(false, Some(1.0), Some(false)));
    // pelny warunek
    assert!(player_battle_automatic_only(
        true,
        restored_setting_version(Some(1.0)),
        Some(false)
    ));
}
