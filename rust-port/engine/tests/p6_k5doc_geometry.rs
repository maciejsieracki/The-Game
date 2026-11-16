//! K5DOC-T3 GEOMETRIA (dispatch R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1): wektory C9 `_moveTargetForUnit`
//! (pin `gra/src/battle/battleScene.ts:11442-11448`). Wektory generuje `p6_k5doc_geometry_gen.mjs`
//! (replika 1:1 pina); sumy SHA-256 w `p6_k5doc_geometry_vectors/SHA256SUMS`.
//! C7 `_attackFormationRallyPoint` i C8 `_chargeMoveDest` są NIE_PORTOWANE (martwe w pinie), patrz
//! nagłówek `siege_tactics_doctrine_geometry.rs`.

use civ_engine::domain::siege_tactics_doctrine_geometry::{move_target_for_unit, BoardPos};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5doc_geometry_vectors/move_target.json");

fn load_cases() -> Vec<Value> {
    let root: Value = serde_json::from_str(VECTORS).expect("vectors JSON");
    root["cases"].as_array().expect("cases array").clone()
}

fn offset_of(v: &Value) -> Option<(i64, i64)> {
    if v.is_null() {
        return None;
    }
    let a = v.as_array().expect("offset pair");
    Some((a[0].as_i64().unwrap(), a[1].as_i64().unwrap()))
}

#[test]
fn move_target_for_unit_matches_pin_vectors() {
    let cases = load_cases();
    assert!(cases.len() >= 4, "minimum 4 przypadki na funkcje");
    for c in &cases {
        let id = c["id"].as_str().unwrap();
        let got = move_target_for_unit(
            offset_of(&c["formation_offset"]),
            c["col"].as_i64().unwrap(),
            c["row"].as_i64().unwrap(),
        );
        let want = BoardPos {
            col: c["expect_col"].as_i64().unwrap(),
            row: c["expect_row"].as_i64().unwrap(),
        };
        assert_eq!(got, want, "przypadek {id}");
    }
}

#[test]
fn move_target_null_offset_is_identity_inside_board() {
    assert_eq!(
        move_target_for_unit(None, 10, 20),
        BoardPos { col: 10, row: 20 }
    );
}

#[test]
fn move_target_clamps_to_board_edges() {
    // BF_COLS = 68, BF_ROWS = 156 (pin :661-662).
    assert_eq!(
        move_target_for_unit(Some((100, 200)), 60, 150),
        BoardPos { col: 67, row: 155 }
    );
    assert_eq!(
        move_target_for_unit(Some((-1, -1)), 0, 0),
        BoardPos { col: 0, row: 0 }
    );
}
