//! P6.4 - `embarkation.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_4_vectors/embark.json`).
//! `EMBARK_TECH` / `EMBARK_DEFENSE_MULT` sa czytane z tabeli `ruch-jednostek-params.json`
//! (zgodnosc ze stalymi weba: `p6_4_core.rs::constants_read_from_running_web_match_tables`).

#[path = "p6_4_vectors/common.rs"]
mod common;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    apply_embark_state_after_move, can_unit_embark, is_water_hex_at, move_cost_fn_for,
    nearest_free_water_hex,
};
use common::{assert_same, bonusy, cases, key_set, load, load_maps, num, pair, unit, units};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_4_vectors/embark.json");

fn root() -> Value {
    load(VECTORS)
}

#[test]
fn can_unit_embark_matches_web() {
    let root = root();
    let (mut yes, mut no) = (0, 0);
    for case in cases(&root, "canUnitEmbark") {
        let got = can_unit_embark(
            case["category"].as_str().expect("category"),
            case.get("embarked").and_then(Value::as_bool),
            case["seafaring"].as_bool().expect("seafaring"),
        );
        assert_eq!(
            got,
            case["out"].as_bool().expect("out"),
            "canUnitEmbark {case}"
        );
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 5 && no > 5, "wektory musza obejmowac oba wyniki");
}

#[test]
fn move_cost_fn_for_matches_web_on_every_map_hex() {
    let root = root();
    let maps = load_maps();
    let (mut none, mut some, mut civ_shallow) = (0, 0, 0);
    for case in cases(&root, "moveCostFnFor") {
        let map = &maps[case["map"].as_u64().expect("map") as usize];
        let unit = unit(&case["unit"]);
        let bonus = bonusy(&case["bonusy"]);
        let got = move_cost_fn_for(
            &unit,
            case["seafaring"].as_bool().expect("seafaring"),
            &bonus,
        );
        match (&got, case["out"].as_array()) {
            (None, None) => none += 1,
            (Some(function), Some(want)) => {
                some += 1;
                assert_eq!(want.len(), map.list.len());
                for ((key, hex), want) in map.list.iter().zip(want) {
                    let cost = function(hex);
                    assert_same(&format!("moveCostFnFor {key:?} {case}"), cost, num(want));
                    if hex.teren.web_value() == "plytkie_morze" && cost < 1.0 && cost > 0.0 {
                        civ_shallow += 1;
                    }
                }
            }
            (got, want) => panic!("moveCostFnFor: Rust {} vs web {want:?}", got.is_some()),
        }
    }
    assert!(
        none > 10 && some > 40 && civ_shallow > 5,
        "wektory musza obejmowac brak funkcji, funkcje i mnoznik plytkiego morza ({none}/{some}/{civ_shallow})"
    );
}

#[test]
fn apply_embark_state_after_move_matches_web() {
    let root = root();
    let maps = load_maps();
    let (mut changed_true, mut changed_false) = (0, 0);
    for case in cases(&root, "applyEmbarkStateAfterMove") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let mut list = units(&case["units"]);
        let changed = apply_embark_state_after_move(&mut list, map);
        assert_eq!(
            changed,
            case["changed"].as_bool().expect("changed"),
            "{case}"
        );
        assert_eq!(
            list,
            units(&case["after"]),
            "applyEmbarkStateAfterMove {case}"
        );
        if changed {
            changed_true += 1;
        } else {
            changed_false += 1;
        }
    }
    assert!(changed_true > 10 && changed_false > 0);
}

#[test]
fn water_hex_queries_match_web() {
    let root = root();
    let maps = load_maps();
    let mut found = 0;
    for case in cases(&root, "isWaterHexAt") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("i32");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("i32");
        assert_eq!(
            is_water_hex_at(map, q, r),
            case["out"].as_bool().expect("out"),
            "isWaterHexAt {case}"
        );
    }
    for case in cases(&root, "nearestFreeWaterHex") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("i32");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("i32");
        let got = nearest_free_water_hex(map, q, r, &key_set(&case["occupied"]));
        let want = if case["out"].is_null() {
            None
        } else {
            Some(pair(&case["out"]))
        };
        assert_eq!(got, want, "nearestFreeWaterHex {case}");
        if got.is_some() {
            found += 1;
        }
    }
    assert!(
        found > 50,
        "wektory musza obejmowac znalezione heksy ({found})"
    );
}
