//! P6.M16 - dowod z URUCHOMIONEGO weba dla rozbieznosci z P6-25 §2 pkt 9: `hasBlockingDepositForFarm` jest w
//! webie zawsze `false` (wolne wspolistnienie zloz, `improvement-build.ts:743-747`), wiec farma / irygacja /
//! tarasy KWALIFIKUJA sie na heksie ze zlozem. Rust `improvements::qualifies` (prywatna `deposit_gate`) blokuje
//! `Farm | Irrigation | Terraces` gdy `tile.deposit.is_some()` (`improvements.rs:281`) - rozbieznosc zapisana w
//! dokumencie P6-M16 §6 jako decyzja dla orkiestratora/P6.8/P6.17 (M16 nie edytuje `improvements.rs`).
//! Ten test sprawdza WYLACZNIE strone weba (wektory) i modul M16; nie pinuje zachowania `improvements.rs`.

#[path = "p6_m16_vectors/common.rs"]
mod common;

use civ_engine::domain::improvement_build::{
    build_improvement_qualifier, has_blocking_deposit_for_farm,
};
use civ_engine::domain::start_position::Overlay;
use common::*;

fn has_deposit(h: &civ_engine::domain::improvement_build::BuildHex) -> bool {
    h.zloze.as_deref().is_some_and(|z| !z.is_empty())
        || !matches!(h.overlay, Overlay::Brak | Overlay::Las)
}

#[test]
fn web_allows_farm_irrigation_terraces_on_deposit_hexes() {
    let d = load("qualifier.json");
    let keys = ["farma", "irygacja", "tarasy"];
    let mut hits = [0usize; 3];
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        let queries = arr(case, "queries");
        for (ki, key) in keys.iter().enumerate() {
            let bits = s(&case["qual"][*key]);
            for (qi, q) in queries.iter().enumerate() {
                if bits.as_bytes()[qi] != b'1' {
                    continue;
                }
                let hex = st
                    .map
                    .hex(&format!("{},{}", int(&q[0]), int(&q[1])))
                    .unwrap();
                assert!(!has_blocking_deposit_for_farm(hex));
                if has_deposit(hex) {
                    hits[ki] += 1;
                }
            }
        }
        // Rust M16 zgadza sie z webem rowniez na tych heksach (bity z `qualifier.json`)
        let qualify = build_improvement_qualifier(&st);
        for key in keys {
            for (qi, q) in queries.iter().enumerate() {
                let want = s(&case["qual"][key]).as_bytes()[qi] == b'1';
                assert_eq!(
                    qualify.qualifies(key, int(&q[0]), int(&q[1])),
                    want,
                    "stan {ci} {key}"
                );
            }
        }
    }
    for (ki, key) in keys.iter().enumerate() {
        assert!(
            hits[ki] > 0,
            "wektory nie zawieraja heksu ze zlozem, na ktorym web kwalifikuje {key}"
        );
    }
}
