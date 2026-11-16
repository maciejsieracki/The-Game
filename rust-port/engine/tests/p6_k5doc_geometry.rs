//! K5DOC-T3 GEOMETRIA (dispatch R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1): wektory C9 `_moveTargetForUnit`
//! (pin `gra/src/battle/battleScene.ts:11442-11448`). Wektory generuje `p6_k5doc_geometry_gen.mjs`
//! (wykonuje ciało metody wyciągnięte z pina `07d2fbd72` przez `git show`); sumy SHA-256 w
//! `p6_k5doc_geometry_vectors/SHA256SUMS`, egzekwowane testem `vector_files_match_sha256sums`.
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

/// Egzekwuje `SHA256SUMS` (dispatch: sumy SHA-256 fragmentow). Uruchamia `sha256sum -c` (albo
/// `shasum -a 256 -c` na systemach bez `sha256sum`) w katalogu wektorow, bo plik sum ma sciezki wzgledne.
#[test]
fn vector_files_match_sha256sums() {
    let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("p6_k5doc_geometry_vectors");
    let attempts: [(&str, &[&str]); 2] = [
        ("sha256sum", &["-c", "SHA256SUMS"]),
        ("shasum", &["-a", "256", "-c", "SHA256SUMS"]),
    ];
    let mut ran = false;
    for (prog, args) in attempts {
        match std::process::Command::new(prog)
            .args(args)
            .current_dir(&dir)
            .output()
        {
            Ok(out) => {
                ran = true;
                assert!(
                    out.status.success(),
                    "SHA256SUMS niezgodne ({prog}): stdout={} stderr={}",
                    String::from_utf8_lossy(&out.stdout),
                    String::from_utf8_lossy(&out.stderr)
                );
                break;
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
            Err(e) => panic!("nie mozna uruchomic {prog}: {e}"),
        }
    }
    assert!(
        ran,
        "brak narzedzia sha256sum/shasum do weryfikacji SHA256SUMS"
    );
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
