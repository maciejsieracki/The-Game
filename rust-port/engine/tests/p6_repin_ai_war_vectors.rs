//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 553 NEARCITY + FALA 558 ERAPOOL): zgodnosc z URUCHOMIONYM webem.
//! Wektory: `tests/p6_repin_ai_war_vectors.json` (generator: Node 22 `stripTypeScriptTypes`
//! na `gra/src/game/war-rules-multiwar.ts` i `ai-war-target-select.ts` z `origin/main` 14f2af1b0;
//! jedyny patch: import JSON `war-rules-params.json` zastapiony literalem). Skrypt generujacy
//! lezy poza repo (scratchpad sesji Operatora).

use std::collections::HashMap;

use civ_engine::domain::diplomacy_multiwar::ForcedEraTag;
use civ_engine::domain::war_era_pool::{
    era_war_counter_epoch, forced_era_tag_epoch, forced_era_tag_for_epoch,
    is_player_eligible_for_era_war_pool, is_player_era_war_slot_free, PlayerEraWarPoolInput,
};
use civ_engine::domain::war_target_select::{
    build_war_city_targets, is_nearest_city_war_pair, BuildWarTargetsInput, WarTargetCity,
    WarTargetUnit,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ai_war_vectors.json");

fn tag_str(t: Option<ForcedEraTag>) -> Value {
    match t {
        None => Value::Null,
        Some(ForcedEraTag::Stone) => Value::from("stone"),
        Some(ForcedEraTag::Bronze) => Value::from("bronze"),
        Some(ForcedEraTag::Iron) => Value::from("iron"),
    }
}

fn opt_i64(v: &Value) -> Option<i64> {
    v.as_i64()
}

fn opt_f64(v: &Value) -> Option<f64> {
    v.as_f64()
}

#[test]
fn era_pool_eligibility_matches_web() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    let rows = root["pool"].as_array().expect("pool");
    assert!(rows.len() >= 500, "za malo wektorow puli: {}", rows.len());
    for (i, row) in rows.iter().enumerate() {
        let inp = &row["inp"];
        let pin = PlayerEraWarPoolInput {
            current_turn: opt_f64(&inp["currentTurn"]).unwrap(),
            player_epoch: opt_i64(&inp["playerEpoch"]).unwrap(),
            active_forced_wars_total: opt_i64(&inp["activeForcedWarsTotal"]).unwrap(),
            active_forced_wars_in_player_era: opt_i64(&inp["activeForcedWarsInPlayerEra"]).unwrap(),
            era_enter_turn: opt_f64(&inp["eraEnterTurn"]),
            pool_start_turn: opt_f64(&inp["poolStartTurn"]).unwrap(),
        };
        let want = row["out"].as_bool().unwrap();
        assert_eq!(
            is_player_eligible_for_era_war_pool(&pin),
            want,
            "pool #{i}: {inp}"
        );
    }
}

#[test]
fn era_slot_free_matches_web() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    for (i, row) in root["slot"].as_array().expect("slot").iter().enumerate() {
        let mut counts: HashMap<String, i64> = HashMap::new();
        for pair in row["counts"].as_array().unwrap() {
            counts.insert(
                pair[0].as_str().unwrap().to_string(),
                pair[1].as_i64().unwrap(),
            );
        }
        let ai = opt_i64(&row["aiEpoch"]).unwrap();
        let pe = opt_i64(&row["playerEpoch"]).unwrap();
        assert_eq!(
            is_player_era_war_slot_free(&counts, ai, pe),
            row["out"].as_bool().unwrap(),
            "slot #{i}: {row}"
        );
    }
}

#[test]
fn era_tag_helpers_match_web() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    for row in root["tag"].as_array().expect("tag") {
        let e = opt_i64(&row["epoch"]).unwrap();
        assert_eq!(
            tag_str(forced_era_tag_for_epoch(e)),
            row["tag"],
            "tag epoch {e}"
        );
    }
    for row in root["counter"].as_array().expect("counter") {
        if row.get("ownerEpoch").is_some() {
            let te = opt_i64(&row["tagEpoch"]);
            let oe = opt_i64(&row["ownerEpoch"]).unwrap();
            assert_eq!(
                era_war_counter_epoch(te, oe),
                row["out"].as_i64().unwrap(),
                "counter {row}"
            );
        } else {
            let tag = match row["tag"].as_str() {
                Some("stone") => Some(ForcedEraTag::Stone),
                Some("bronze") => Some(ForcedEraTag::Bronze),
                Some("iron") => Some(ForcedEraTag::Iron),
                _ => None,
            };
            let want = opt_i64(&row["epoch"]);
            assert_eq!(forced_era_tag_epoch(tag), want, "forcedEraTagEpoch {row}");
        }
    }
}

#[test]
fn nearest_city_targets_match_web() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    for (i, row) in root["nearest"]
        .as_array()
        .expect("nearest")
        .iter()
        .enumerate()
    {
        let inp = &row["inp"];
        let self_owner = inp["self"].as_i64().unwrap();
        let human: Vec<i64> = inp["human"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let barb: Vec<i64> = inp["barb"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let engage: Vec<i64> = inp["engage"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let enemies: Vec<i64> = inp["enemies"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let is_human = |o: i64| human.contains(&o);
        let is_barb = |o: i64| barb.contains(&o);

        for p in row["pairs"].as_array().unwrap() {
            let t = p["target"].as_i64().unwrap();
            assert_eq!(
                is_nearest_city_war_pair(self_owner, t, is_human, is_barb),
                p["nearest"].as_bool().unwrap(),
                "pair #{i} target {t}"
            );
        }

        let cities: Vec<WarTargetCity> = inp["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| WarTargetCity {
                id: c["id"].as_str().unwrap().to_string(),
                owner_id: c["ownerId"].as_i64().unwrap(),
                q: c["q"].as_i64().unwrap() as i32,
                r: c["r"].as_i64().unwrap() as i32,
            })
            .collect();
        let units: Vec<WarTargetUnit> = inp["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| WarTargetUnit {
                owner_id: u["ownerId"].as_i64().unwrap(),
                q: u["q"].as_i64().unwrap() as i32,
                r: u["r"].as_i64().unwrap() as i32,
            })
            .collect();
        let caps = inp["caps"].as_object().unwrap();
        let cap_of = |o: i64| {
            caps.get(&o.to_string())
                .and_then(|v| v.as_str())
                .map(str::to_string)
        };
        let engage_fn = |o: i64| engage.contains(&o);
        let input = BuildWarTargetsInput {
            self_owner_id: self_owner,
            enemy_owner_ids: &enemies,
            engage: &engage_fn,
            cities: &cities,
            combat_units: &units,
            is_human: &is_human,
            is_barbarian: &is_barb,
            capital_city_id_for_owner: &cap_of,
        };
        let got = build_war_city_targets(&input);
        let want = row["targets"].as_array().unwrap();
        assert_eq!(got.len(), want.len(), "targets count #{i}");
        for (g, w) in got.iter().zip(want.iter()) {
            assert_eq!(
                g.target.owner_id,
                w["ownerId"].as_i64().unwrap(),
                "owner #{i}"
            );
            assert_eq!(g.target.city_id, w["cityId"].as_str().unwrap(), "city #{i}");
            assert_eq!(g.target.q as i64, w["q"].as_i64().unwrap(), "q #{i}");
            assert_eq!(g.target.r as i64, w["r"].as_i64().unwrap(), "r #{i}");
            assert_eq!(g.defenders, opt_i64(&w["defenders"]), "defenders #{i}");
        }
    }
}
