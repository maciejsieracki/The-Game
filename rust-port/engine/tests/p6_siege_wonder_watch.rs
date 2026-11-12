//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1: wektory z pinu dla klocka przeniesienia cudow
//! (`snapshotWonderTerritoryOwners`, `planWonderTransfers`, `applyWonderTransfers`, `isCivilizationOwnerId`).
//!
//! Zrodlo wektorow: `tests/p6_siege_wonder_watch_vectors/vectors.json` wygenerowane przez
//! `tests/p6_siege_wonder_watch_gen.mjs` (wykonuje `gra/src/game/wonder-transfer.ts` z pinu
//! 07d2fbd72f758705f8e1d59cc4968027ffbafe75 w node).
//!
//! Przypadki: "plan" (wyczerpujaco dla jednego cudu, 246), "apply" (4), "chain" (80: migawka PRZED/PO, plan, apply).

use civ_engine::domain::siege_wonder_watch::{
    apply_wonder_transfers, is_civilization_owner_id, plan_wonder_transfers,
    snapshot_wonder_territory_owners, TransferableWonder, WonderTerritorySnapshot, WonderTransfer,
};
use serde_json::{json, Map, Value};
use std::collections::HashMap;

const DATA: &str = include_str!("p6_siege_wonder_watch_vectors/vectors.json");

fn wonder_from(v: &Value) -> TransferableWonder {
    TransferableWonder {
        wonder_id: v["wonderId"].as_str().expect("wonderId").to_string(),
        q: v["q"].as_i64().expect("q") as i32,
        r: v["r"].as_i64().expect("r") as i32,
        owner_id: v["ownerId"].as_i64().expect("ownerId") as i32,
    }
}

fn wonders_from(v: &Value) -> Vec<TransferableWonder> {
    v.as_array()
        .expect("wonders")
        .iter()
        .map(wonder_from)
        .collect()
}

fn wonders_to_json(ws: &[TransferableWonder]) -> Value {
    Value::Array(
        ws.iter()
            .map(|w| {
                json!({
                    "wonderId": w.wonder_id,
                    "q": w.q,
                    "r": w.r,
                    "ownerId": w.owner_id,
                })
            })
            .collect(),
    )
}

/// Obiekt JSON `{id: null|liczba}` -> migawka; brak klucza = brak wpisu (undefined w TS).
fn snapshot_from(v: &Value) -> WonderTerritorySnapshot {
    v.as_object()
        .expect("snapshot object")
        .iter()
        .map(|(k, val)| (k.clone(), val.as_i64().map(|x| x as i32)))
        .collect()
}

fn snapshot_to_json(s: &WonderTerritorySnapshot) -> Value {
    let mut m = Map::new();
    for (k, v) in s {
        m.insert(k.clone(), v.map_or(Value::Null, |x| json!(x)));
    }
    Value::Object(m)
}

fn plan_to_json(plan: &[WonderTransfer]) -> Value {
    Value::Array(
        plan.iter()
            .map(|t| {
                json!({
                    "wonderId": t.wonder_id,
                    "q": t.q,
                    "r": t.r,
                    "fromOwnerId": t.from_owner_id,
                    "toOwnerId": t.to_owner_id,
                })
            })
            .collect(),
    )
}

fn plan_from(v: &Value) -> Vec<WonderTransfer> {
    v.as_array()
        .expect("plan")
        .iter()
        .map(|t| WonderTransfer {
            wonder_id: t["wonderId"].as_str().expect("wonderId").to_string(),
            q: t["q"].as_i64().expect("q") as i32,
            r: t["r"].as_i64().expect("r") as i32,
            from_owner_id: t["fromOwnerId"].as_i64().expect("fromOwnerId") as i32,
            to_owner_id: t["toOwnerId"].as_i64().expect("toOwnerId") as i32,
        })
        .collect()
}

fn terr_lookup(terr: &Value) -> HashMap<(i32, i32), Option<i32>> {
    terr.as_array()
        .expect("terr")
        .iter()
        .map(|e| {
            (
                (
                    e["q"].as_i64().expect("q") as i32,
                    e["r"].as_i64().expect("r") as i32,
                ),
                e["owner"].as_i64().map(|x| x as i32),
            )
        })
        .collect()
}

#[test]
fn vectors_file_has_at_least_30_cases_per_group_and_expected_sizes() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    let cases = &root["cases"];
    let plan_n = cases["plan"].as_array().expect("plan").len();
    let apply_n = cases["apply"].as_array().expect("apply").len();
    let chain_n = cases["chain"].as_array().expect("chain").len();
    assert!(plan_n >= 30, "plan: {plan_n}");
    assert!(apply_n >= 4, "apply: {apply_n}");
    assert!(chain_n >= 30, "chain: {chain_n}");
    assert_eq!(root["counts"]["plan"].as_u64(), Some(plan_n as u64));
    assert_eq!(root["counts"]["apply"].as_u64(), Some(apply_n as u64));
    assert_eq!(root["counts"]["chain"].as_u64(), Some(chain_n as u64));
}

#[test]
fn is_civilization_owner_id_matches_pin() {
    // Pin: ownerId >= 0 to cywilizacja; sentinele -1 i -99 nie.
    assert!(is_civilization_owner_id(0));
    assert!(is_civilization_owner_id(3));
    assert!(!is_civilization_owner_id(-1));
    assert!(!is_civilization_owner_id(-99));
}

#[test]
fn plan_matches_pin_vectors() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    for (i, c) in root["cases"]["plan"].as_array().unwrap().iter().enumerate() {
        let wonders = wonders_from(&c["wonders"]);
        let before = snapshot_from(&c["before"]);
        let after = snapshot_from(&c["after"]);
        let plan = plan_wonder_transfers(&wonders, &before, &after);
        assert_eq!(plan_to_json(&plan), c["expected"], "plan case {i}: {c}");
    }
}

#[test]
fn apply_matches_pin_vectors() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    for (i, c) in root["cases"]["apply"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
    {
        let mut wonders = wonders_from(&c["wonders"]);
        let plan = plan_from(&c["plan"]);
        let n = apply_wonder_transfers(&mut wonders, &plan);
        assert_eq!(
            n as u64,
            c["expected"]["count"].as_u64().unwrap(),
            "apply count case {i}"
        );
        assert_eq!(
            wonders_to_json(&wonders),
            c["expected"]["wonders"],
            "apply wonders case {i}"
        );
    }
}

#[test]
fn chain_snapshot_plan_apply_matches_pin_vectors() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    for (i, c) in root["cases"]["chain"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
    {
        let mut wonders = wonders_from(&c["wonders"]);
        let before_terr = terr_lookup(&c["terrBefore"]);
        let after_terr = terr_lookup(&c["terrAfter"]);
        let before = snapshot_wonder_territory_owners(&wonders, |q, r| {
            before_terr.get(&(q, r)).copied().unwrap_or(None)
        });
        let after = snapshot_wonder_territory_owners(&wonders, |q, r| {
            after_terr.get(&(q, r)).copied().unwrap_or(None)
        });
        assert_eq!(
            snapshot_to_json(&before),
            c["expected"]["before"],
            "snapshot PRZED case {i}"
        );
        assert_eq!(
            snapshot_to_json(&after),
            c["expected"]["after"],
            "snapshot PO case {i}"
        );
        let plan = plan_wonder_transfers(&wonders, &before, &after);
        assert_eq!(
            plan_to_json(&plan),
            c["expected"]["plan"],
            "chain plan case {i}"
        );
        let n = apply_wonder_transfers(&mut wonders, &plan);
        assert_eq!(
            n as u64,
            c["expected"]["count"].as_u64().unwrap(),
            "chain count case {i}"
        );
        assert_eq!(
            wonders_to_json(&wonders),
            c["expected"]["wonders"],
            "chain wonders case {i}"
        );
    }
}
