//! P6-ZAPIS-MIGRACJE-FALA509 (runda 2): wektory z WEBU dla siatki stosu ponad limit.
//! Wektory: `tests/p6_zapis_migracje_vectors/stack-split.json`, wygenerowane uruchomionym webem
//! (Node v22.22.0, `planOversizedStackSplits` z origin/main `gra/src/game/army-stack-limit.ts`)
//! generatorem `tests/p6_zapis_migracje_vectors/gen-stack-vectors.mjs` (303 przypadki, w tym 3 reczne).

use civ_engine::domain::save_migrations::{plan_oversized_stack_splits, StackUnit};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zapis_migracje_vectors/stack-split.json");

fn unit_from(value: &Value) -> StackUnit {
    StackUnit {
        id: value["id"].as_str().expect("id").to_string(),
        owner_id: value["ownerId"].as_i64().expect("ownerId"),
        q: value["q"].as_i64().expect("q"),
        r: value["r"].as_i64().expect("r"),
    }
}

#[test]
fn p6_zapis_migracje_stack_split_matches_web_vectors() {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors parse");
    let cases = doc["cases"].as_array().expect("cases array");
    assert_eq!(cases.len(), 303, "liczba przypadkow wektorow");
    let mut with_moves = 0;
    let mut with_unplaced = 0;
    for (index, case) in cases.iter().enumerate() {
        let units: Vec<StackUnit> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(unit_from)
            .collect();
        let limit = case["limit"].as_i64().expect("limit");
        let max_radius = case["maxRadius"].as_i64().expect("maxRadius");
        let blocked: Vec<(i64, i64)> = case["blocked"]
            .as_array()
            .expect("blocked")
            .iter()
            .map(|p| (p[0].as_i64().expect("q"), p[1].as_i64().expect("r")))
            .collect();
        // Web `canPlaceAt` z wektora: zablokowane heksy nie przyjmuja nadwyzki (dla kazdego wlasciciela).
        let plan = plan_oversized_stack_splits(&units, limit, max_radius, |_owner, q, r| {
            !blocked.contains(&(q, r))
        });

        let expected_moves = case["expectedMoves"].as_array().expect("expectedMoves");
        let got_moves: Vec<Value> = plan
            .moves
            .iter()
            .map(|m| {
                serde_json::json!({
                    "unitId": m.unit_id,
                    "fromQ": m.from_q,
                    "fromR": m.from_r,
                    "toQ": m.to_q,
                    "toR": m.to_r,
                })
            })
            .collect();
        if !expected_moves.is_empty() {
            with_moves += 1;
        }
        if !plan.unplaced.is_empty() {
            with_unplaced += 1;
        }
        assert_eq!(
            got_moves.as_slice(),
            expected_moves.as_slice(),
            "przypadek #{index} (ruchy): {case}"
        );
        let expected_unplaced: Vec<String> = case["expectedUnplaced"]
            .as_array()
            .expect("expectedUnplaced")
            .iter()
            .map(|v| v.as_str().expect("id").to_string())
            .collect();
        assert_eq!(
            plan.unplaced, expected_unplaced,
            "przypadek #{index} (bez miejsca)"
        );
    }
    assert_eq!(with_moves, 258, "liczba przypadkow z ruchami");
    assert_eq!(with_unplaced, 1, "liczba przypadkow z nieumieszczonymi");
}
