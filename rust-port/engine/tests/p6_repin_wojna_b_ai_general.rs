//! REPIN-WOJNA-NOWE-B - `gra/src/game/ai-general-war-campaign.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_b_vectors/ai-general-war-campaign.json`).

use civ_engine::domain::ai_general_war_campaign::{
    ai_general_campaign_to_save, ai_war_target_has_reachable_land_neighbor,
    choose_ai_general_war_target, find_ai_war_land_reachability, reconcile_ai_general_war_campaign,
    record_ai_general_gather_turn, restore_ai_general_campaigns, AiGeneralCampaignStage,
    AiGeneralWarCampaign, GeneralRef, WarTargetCandidate, AI_GENERAL_WAR_GATHER_TURNS,
};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};

const VECTORS: &str = include_str!("p6_repin_wojna_b_vectors/ai-general-war-campaign.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("ai-general-war-campaign.json parse")
}

fn parse_key(k: &str) -> (i64, i64) {
    let (q, r) = k.split_once(',').expect("klucz q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

/// Koszt z wektora: liczba w tekscie (`String(x)`) albo `Infinity`.
fn parse_cost(s: &str) -> f64 {
    if s == "Infinity" {
        f64::INFINITY
    } else {
        s.parse::<f64>().expect("koszt")
    }
}

fn stage_of(s: &str) -> AiGeneralCampaignStage {
    match s {
        "recruiting" => AiGeneralCampaignStage::Recruiting,
        "gathering" => AiGeneralCampaignStage::Gathering,
        "attacking" => AiGeneralCampaignStage::Attacking,
        other => panic!("nieznany stage {other}"),
    }
}

fn parse_campaign(v: &Value) -> AiGeneralWarCampaign {
    AiGeneralWarCampaign {
        target_owner_id: v["targetOwnerId"].as_i64().expect("targetOwnerId"),
        stage: stage_of(v["stage"].as_str().expect("stage")),
        general_unit_id: v
            .get("generalUnitId")
            .map(|g| g.as_str().expect("gid").to_owned()),
        blocked_general_ids: v.get("blockedGeneralIds").map(|b| {
            b.as_array()
                .expect("blocked")
                .iter()
                .map(|x| x.as_str().expect("id").to_owned())
                .collect()
        }),
        gather_turns_completed: v["gatherTurnsCompleted"].as_i64().expect("gather"),
        last_gather_turn: v.get("lastGatherTurn").map(|x| x.as_i64().expect("last")),
    }
}

/// Postac JSON kampanii taka jak w webie (pola `undefined` nie wystepuja).
fn campaign_json(c: &AiGeneralWarCampaign) -> Value {
    let stage = match c.stage {
        AiGeneralCampaignStage::Recruiting => "recruiting",
        AiGeneralCampaignStage::Gathering => "gathering",
        AiGeneralCampaignStage::Attacking => "attacking",
    };
    let mut obj = json!({
        "targetOwnerId": c.target_owner_id,
        "stage": stage,
        "gatherTurnsCompleted": c.gather_turns_completed,
    });
    let map = obj.as_object_mut().expect("obiekt");
    if let Some(g) = &c.general_unit_id {
        map.insert("generalUnitId".into(), json!(g));
    }
    if let Some(b) = &c.blocked_general_ids {
        map.insert("blockedGeneralIds".into(), json!(b));
    }
    if let Some(l) = c.last_gather_turn {
        map.insert("lastGatherTurn".into(), json!(l));
    }
    obj
}

fn general(v: &Value) -> GeneralRef {
    GeneralRef {
        id: v["id"].as_str().expect("id").to_owned(),
        is_general: v["isGeneral"].as_bool().expect("isGeneral"),
    }
}

#[test]
fn gather_turns_constant_matches_web() {
    let v = root();
    assert_eq!(
        AI_GENERAL_WAR_GATHER_TURNS,
        v["gatherTurns"].as_str().unwrap().parse::<i64>().unwrap()
    );
}

#[test]
fn reachability_matches_web() {
    let v = root();
    let cases = v["reachCases"].as_array().expect("reachCases");
    assert!(cases.len() >= 300);
    for (i, case) in cases.iter().enumerate() {
        let costs: HashMap<(i64, i64), f64> = case["costs"]
            .as_array()
            .expect("costs")
            .iter()
            .map(|e| {
                (
                    parse_key(e[0].as_str().unwrap()),
                    parse_cost(e[1].as_str().unwrap()),
                )
            })
            .collect();
        let blocked: HashSet<(i64, i64)> = case["blocked"]
            .as_array()
            .expect("blocked")
            .iter()
            .map(|k| parse_key(k.as_str().unwrap()))
            .collect();
        let probe = (
            case["probe"]["q"].as_i64().unwrap(),
            case["probe"]["r"].as_i64().unwrap(),
        );
        let res = find_ai_war_land_reachability(probe, &costs, &blocked);
        let mut got: Vec<String> = res
            .hex_keys
            .iter()
            .map(|(q, r)| format!("{q},{r}"))
            .collect();
        got.sort();
        let want: Vec<String> = case["hexKeys"]
            .as_array()
            .expect("hexKeys")
            .iter()
            .map(|k| k.as_str().unwrap().to_owned())
            .collect();
        assert_eq!(got, want, "przypadek {i}: hexKeys");
        assert_eq!(
            res.visited_hex_count as i64,
            case["visitedHexCount"].as_i64().unwrap(),
            "przypadek {i}: visitedHexCount"
        );
        assert_eq!(
            res.search_count as i64,
            case["searchCount"].as_i64().unwrap(),
            "przypadek {i}: searchCount"
        );
        for (j, probe_case) in case["neighbor"]
            .as_array()
            .expect("neighbor")
            .iter()
            .enumerate()
        {
            let target = (
                probe_case["target"]["q"].as_i64().unwrap(),
                probe_case["target"]["r"].as_i64().unwrap(),
            );
            assert_eq!(
                ai_war_target_has_reachable_land_neighbor(&res, target),
                probe_case["out"].as_bool().unwrap(),
                "przypadek {i}/{j}: sasiad celu"
            );
        }
    }
}

#[test]
fn choose_target_matches_web() {
    let v = root();
    let cases = v["chooseCases"].as_array().expect("chooseCases");
    assert!(cases.len() >= 500);
    for (i, case) in cases.iter().enumerate() {
        let current = if case["current"].is_null() {
            None
        } else {
            Some(parse_campaign(&case["current"]))
        };
        let candidates: Vec<WarTargetCandidate> = case["candidates"]
            .as_array()
            .expect("candidates")
            .iter()
            .map(|c| WarTargetCandidate {
                owner_id: c["ownerId"].as_i64().unwrap(),
                distance: c["distance"].as_f64().unwrap(),
                reachable: c.get("reachable").map(|r| r.as_bool().unwrap()),
            })
            .collect();
        let got = choose_ai_general_war_target(current.as_ref(), &candidates);
        let want = case["out"].as_i64();
        assert_eq!(got, want, "przypadek {i}");
    }
}

#[test]
fn reconcile_matches_web() {
    let v = root();
    let cases = v["reconcileCases"].as_array().expect("reconcileCases");
    assert!(cases.len() >= 1000);
    for (i, case) in cases.iter().enumerate() {
        let current = if case["current"].is_null() {
            None
        } else {
            Some(parse_campaign(&case["current"]))
        };
        let target = case["target"].as_i64();
        let gen = if case["general"].is_null() {
            None
        } else {
            Some(general(&case["general"]))
        };
        let queued = case["queued"].as_bool().unwrap();
        let alive: Option<Vec<String>> = if case["alive"].is_null() {
            None
        } else {
            Some(
                case["alive"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_str().unwrap().to_owned())
                    .collect(),
            )
        };
        let got = reconcile_ai_general_war_campaign(
            current.as_ref(),
            target,
            gen.as_ref(),
            queued,
            alive.as_deref(),
        );
        let got_json = got.as_ref().map(campaign_json).unwrap_or(Value::Null);
        assert_eq!(got_json, case["out"], "przypadek {i}");
    }
}

#[test]
fn record_gather_turn_matches_web() {
    let v = root();
    let cases = v["recordCases"].as_array().expect("recordCases");
    assert!(cases.len() >= 300);
    for (i, case) in cases.iter().enumerate() {
        let c = parse_campaign(&case["campaign"]);
        let turn = case["turn"].as_i64().unwrap();
        let got = record_ai_general_gather_turn(&c, turn);
        assert_eq!(campaign_json(&got), case["out"], "przypadek {i}");
    }
}

#[test]
fn save_matches_web() {
    let v = root();
    let cases = v["saveCases"].as_array().expect("saveCases");
    assert!(cases.len() >= 200);
    for (i, case) in cases.iter().enumerate() {
        let entries: Vec<(i64, AiGeneralWarCampaign)> = case["entries"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| (e[0].as_i64().unwrap(), parse_campaign(&e[1])))
            .collect();
        let got: Vec<Value> = ai_general_campaign_to_save(&entries)
            .iter()
            .map(|(o, c)| json!([o, campaign_json(c)]))
            .collect();
        let want = case["out"].as_array().expect("out");
        assert_eq!(&got, want, "przypadek {i}");
    }
}

#[test]
fn restore_matches_web() {
    let v = root();
    let cases = v["restoreCases"].as_array().expect("restoreCases");
    assert!(cases.len() >= 300);
    for (i, case) in cases.iter().enumerate() {
        let got: Vec<Value> = restore_ai_general_campaigns(&case["value"])
            .iter()
            .map(|(o, c)| json!([o, campaign_json(c)]))
            .collect();
        assert_eq!(&got, case["out"].as_array().expect("out"), "przypadek {i}");
    }
    for (i, case) in v["edgeRestore"].as_array().unwrap().iter().enumerate() {
        let got: Vec<Value> = restore_ai_general_campaigns(&case["value"])
            .iter()
            .map(|(o, c)| json!([o, campaign_json(c)]))
            .collect();
        assert_eq!(&got, case["out"].as_array().unwrap(), "krawedz {i}");
    }
}
