//! P6.4 - `planned-march.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_4_vectors/march.json`).

#[path = "p6_4_vectors/common.rs"]
mod common;

use std::collections::HashSet;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    apply_fog_to_path_plan, execute_march_step, plan_path_turns, planned_marches_from_save,
    planned_marches_to_save, should_stop_at_obstacle, truncate_path_at_fog_frontier,
    truncate_path_to_budget, validate_auto_march_from_save, AutoMarchSave, ExecuteMarchResult,
    Klucz, MarchFogContext, MarchStopReason, PathTurnPlan, PathTurnStop, PlannedMarchDest,
    PlannedMarchSaved, StopDecision,
};
use common::{
    assert_same, cases, cost_bonusy, key_set, load, load_maps, make_cost, num, opt_num, opt_string,
    pair_f, pairs, points, unit, units,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_4_vectors/march.json");

fn root() -> Value {
    load(VECTORS)
}

fn reason(value: Option<&Value>) -> Option<MarchStopReason> {
    match value.and_then(Value::as_str) {
        None => None,
        Some("obstacle") => Some(MarchStopReason::Obstacle),
        Some("no_path") => Some(MarchStopReason::NoPath),
        Some("no_movement") => Some(MarchStopReason::NoMovement),
        Some("blocked_city") => Some(MarchStopReason::BlockedCity),
        Some("fog") => Some(MarchStopReason::Fog),
        Some(other) => panic!("nieznany powod {other}"),
    }
}

fn plan_from(value: &Value) -> PathTurnPlan {
    PathTurnPlan {
        full_path: points(&value["fullPath"]),
        turn_stops: value["turnStops"]
            .as_array()
            .expect("turnStops")
            .iter()
            .map(|stop| PathTurnStop {
                q: i32::try_from(stop["q"].as_i64().expect("q")).expect("i32"),
                r: i32::try_from(stop["r"].as_i64().expect("r")).expect("i32"),
                turn: u32::try_from(stop["turn"].as_u64().expect("turn")).expect("u32"),
            })
            .collect(),
        segment_path: points(&value["segmentPath"]),
        segment_cost: num(&value["segmentCost"]),
        reachable: value["reachable"].as_bool().expect("reachable"),
        stop_reason: reason(value.get("stopReason")),
        fog_limited: value.get("fogLimited").and_then(Value::as_bool),
    }
}

fn assert_plan(label: &str, got: &PathTurnPlan, want: &PathTurnPlan) {
    assert_eq!(got.full_path, want.full_path, "{label} fullPath");
    assert_eq!(got.turn_stops, want.turn_stops, "{label} turnStops");
    assert_eq!(got.segment_path, want.segment_path, "{label} segmentPath");
    assert_same(
        &format!("{label} segmentCost"),
        got.segment_cost,
        want.segment_cost,
    );
    assert_eq!(got.reachable, want.reachable, "{label} reachable");
    assert_eq!(got.stop_reason, want.stop_reason, "{label} stopReason");
    assert_eq!(got.fog_limited, want.fog_limited, "{label} fogLimited");
}

fn dest_from(value: &Value) -> PlannedMarchDest {
    PlannedMarchDest {
        dest_q: num(&value["destQ"]),
        dest_r: num(&value["destR"]),
        attack_unit_id: opt_string(value.get("attackUnitId")),
    }
}

#[test]
fn fog_frontier_and_fog_plan_match_web() {
    let root = root();
    let maps = load_maps();
    let mut limited = 0;
    for case in cases(&root, "truncatePathAtFogFrontier") {
        let (path, fog_limited) =
            truncate_path_at_fog_frontier(&pairs(&case["path"]), &key_set(&case["visible"]));
        assert_eq!(path, pairs(&case["out"]["path"]), "{case}");
        assert_eq!(
            fog_limited,
            case["out"]["fogLimited"].as_bool().expect("fogLimited"),
            "{case}"
        );
        if fog_limited {
            limited += 1;
        }
    }
    assert!(limited > 5);
    for case in cases(&root, "applyFogToPathPlan") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let plan = plan_from(&case["plan"]);
        let fog = MarchFogContext {
            fog_active: true,
            visible: plan.full_path.iter().copied().collect::<HashSet<Klucz>>(),
            attack_on_visible_enemy: false,
        };
        let got = apply_fog_to_path_plan(
            plan.clone(),
            map,
            num(&case["perTurn"]),
            opt_num(case.get("budget")),
            Some(&fog),
        );
        assert_plan("applyFogToPathPlan", &got, &plan_from(&case["out"]));
    }
}

#[test]
fn truncate_path_to_budget_matches_web_including_min_move() {
    let root = root();
    let maps = load_maps();
    for case in cases(&root, "truncatePathToBudget") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let got = truncate_path_to_budget(
            &pairs(&case["path"]),
            num(&case["budget"]),
            map,
            cost.as_deref(),
        );
        assert_eq!(got, pairs(&case["out"]), "truncatePathToBudget {case}");
    }
}

#[test]
fn plan_path_turns_matches_web() {
    let root = root();
    let maps = load_maps();
    let (mut reachable, mut multi_turn) = (0, 0);
    for case in cases(&root, "planPathTurns") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let (dq, dr) = pair_f(&case["dest"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let got = plan_path_turns(
            &unit,
            dq,
            dr,
            map,
            &key_set(&case["occupied"]),
            num(&case["perTurn"]),
            opt_num(case.get("budget")),
            cost.as_deref(),
        );
        assert_plan(
            &format!("planPathTurns {case}"),
            &got,
            &plan_from(&case["out"]),
        );
        if got.reachable {
            reachable += 1;
        }
        if got.turn_stops.len() > 1 {
            multi_turn += 1;
        }
    }
    assert!(
        reachable > 100 && multi_turn > 100,
        "wektory musza obejmowac trasy wieloturowe ({reachable}/{multi_turn})"
    );
}

#[test]
fn should_stop_at_obstacle_matches_web() {
    let root = root();
    let maps = load_maps();
    let (mut stops, mut goes) = (0, 0);
    for case in cases(&root, "shouldStopAtObstacle") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let got = should_stop_at_obstacle(
            &unit,
            &dest_from(&case["dest"]),
            map,
            &key_set(&case["occupied"]),
            &pairs(&case["segment"]),
            num(&case["budget"]),
            cost.as_deref(),
        );
        let out = &case["out"];
        let want = StopDecision {
            stop: out["stop"].as_bool().expect("stop"),
            reason: reason(out.get("reason")),
            detail: opt_string(out.get("detail")),
        };
        assert_eq!(got, want, "shouldStopAtObstacle {case}");
        if got.stop {
            stops += 1;
        } else {
            goes += 1;
        }
    }
    assert!(stops > 50 && goes > 50);
}

#[test]
fn execute_march_step_matches_web() {
    let root = root();
    let maps = load_maps();
    let (mut arrived, mut blocked, mut no_move, mut no_path) = (0, 0, 0, 0);
    for case in cases(&root, "executeMarchStep") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let unit = unit(&case["unit"]);
        let bonus = cost_bonusy(&case["costFn"]);
        let cost = make_cost(&case["costFn"], &unit, &bonus);
        let blocked_hexes = key_set(&case["blocked"]);
        let fog = case["fog"].as_object().map(|spec| MarchFogContext {
            fog_active: true,
            visible: pairs(&spec["visible"]).into_iter().collect(),
            attack_on_visible_enemy: false,
        });
        let got = execute_march_step(
            &unit,
            &dest_from(&case["dest"]),
            map,
            &key_set(&case["occupied"]),
            num(&case["budget"]),
            &|q, r| !blocked_hexes.contains(&(q, r)),
            num(&case["perTurn"]),
            fog.as_ref(),
            cost.as_deref(),
        );
        let out = &case["out"];
        let want = ExecuteMarchResult {
            ok: out["ok"].as_bool().expect("ok"),
            move_path: points(&out["movePath"]),
            cost: num(&out["cost"]),
            arrived: out["arrived"].as_bool().expect("arrived"),
            stop_reason: reason(out.get("stopReason")),
            stop_detail: opt_string(out.get("stopDetail")),
        };
        assert_eq!(got.ok, want.ok, "ok {case}");
        assert_eq!(got.move_path, want.move_path, "movePath {case}");
        assert_same("cost", got.cost, want.cost);
        assert_eq!(got.arrived, want.arrived, "arrived {case}");
        assert_eq!(got.stop_reason, want.stop_reason, "stopReason {case}");
        assert_eq!(got.stop_detail, want.stop_detail, "stopDetail {case}");
        match got.stop_reason {
            Some(MarchStopReason::BlockedCity) => blocked += 1,
            Some(MarchStopReason::NoMovement) => no_move += 1,
            Some(MarchStopReason::NoPath) => no_path += 1,
            _ => {}
        }
        if got.arrived {
            arrived += 1;
        }
    }
    assert!(
        arrived > 30 && blocked > 30 && no_move > 30 && no_path > 30,
        "wektory musza obejmowac przybycie i powody zatrzymania ({arrived}/{blocked}/{no_move}/{no_path})"
    );
}

fn auto_march(value: &Value) -> Option<AutoMarchSave> {
    if value.is_null() {
        return None;
    }
    Some(AutoMarchSave {
        leader_id: opt_string(value.get("leaderId")),
        dest_q: opt_num(value.get("destQ")),
        dest_r: opt_num(value.get("destR")),
    })
}

fn saved_dest(value: &Value) -> Option<PlannedMarchSaved> {
    if value.is_null() {
        return None;
    }
    Some(PlannedMarchSaved {
        dest_q: opt_num(value.get("destQ")),
        dest_r: opt_num(value.get("destR")),
        attack_unit_id: opt_string(value.get("attackUnitId")),
    })
}

#[test]
fn save_validation_and_round_trip_match_web() {
    let root = root();
    let (mut kept, mut dropped) = (0, 0);
    for case in cases(&root, "validateAutoMarchFromSave") {
        let saved = auto_march(&case["saved"]);
        let list = units(&case["units"]);
        let owner = case["owner"].as_i64().expect("owner");
        let got = validate_auto_march_from_save(saved.as_ref(), &list, owner);
        match (&got, case["out"].is_null()) {
            (None, true) => dropped += 1,
            (Some((leader, dest_q, dest_r)), false) => {
                kept += 1;
                assert_eq!(leader, case["out"]["leaderId"].as_str().expect("leader"));
                assert_same("destQ", *dest_q, num(&case["out"]["destQ"]));
                assert_same("destR", *dest_r, num(&case["out"]["destR"]));
            }
            _ => panic!("validateAutoMarchFromSave rozbieznosc {case}"),
        }
    }
    assert!(kept > 5 && dropped > 20);

    let (mut with_attack, mut legacy_added) = (0, 0);
    for case in cases(&root, "plannedMarchesFromSave") {
        let saved = auto_march(&case["saved"]);
        let list = units(&case["units"]);
        let owner = case["owner"].as_i64().expect("owner");
        let planned: Option<Vec<(String, Option<PlannedMarchSaved>)>> =
            case["planned"].as_array().map(|entries| {
                entries
                    .iter()
                    .map(|entry| {
                        (
                            entry[0].as_str().expect("uid").to_owned(),
                            saved_dest(&entry[1]),
                        )
                    })
                    .collect()
            });
        let got = planned_marches_from_save(saved.as_ref(), planned.as_deref(), &list, owner);
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "plannedMarchesFromSave {case}");
        for ((uid, dest), want) in got.iter().zip(want) {
            assert_eq!(uid, want[0].as_str().expect("uid"), "{case}");
            assert_eq!(*dest, dest_from(&want[1]), "{case}");
            if dest.attack_unit_id.is_some() {
                with_attack += 1;
            }
        }
        if got.iter().any(|(_, dest)| dest.attack_unit_id.is_none()) && case["saved"].is_object() {
            legacy_added += 1;
        }
    }
    assert!(with_attack > 5 && legacy_added > 5);

    let mut non_empty = 0;
    for case in cases(&root, "plannedMarchesToSave") {
        let marches: Vec<(String, PlannedMarchDest)> = case["marches"]
            .as_array()
            .expect("marches")
            .iter()
            .map(|entry| {
                (
                    entry[0].as_str().expect("uid").to_owned(),
                    dest_from(&entry[1]),
                )
            })
            .collect();
        let got = planned_marches_to_save(&marches);
        let out = &case["out"];
        match (&got.auto_march, out.get("autoMarch")) {
            (None, None) => {}
            (Some((leader, dest_q, dest_r)), Some(want)) => {
                assert_eq!(leader, want["leaderId"].as_str().expect("leader"));
                assert_same("destQ", *dest_q, num(&want["destQ"]));
                assert_same("destR", *dest_r, num(&want["destR"]));
            }
            _ => panic!("autoMarch rozbieznosc {case}"),
        }
        match (&got.planned_marches, out.get("plannedMarches")) {
            (None, None) => {}
            (Some(entries), Some(want)) => {
                non_empty += 1;
                let want = want.as_object().expect("plannedMarches");
                assert_eq!(entries.len(), want.len(), "{case}");
                for (uid, dest) in entries {
                    assert_eq!(*dest, dest_from(&want[uid]), "{case}");
                    // forma wyjsciowa: `attackUnitId` tylko dla niepustego napisu
                    assert_eq!(
                        want[uid].get("attackUnitId").is_some(),
                        dest.attack_unit_id.is_some()
                    );
                }
            }
            _ => panic!("plannedMarches rozbieznosc {case}"),
        }
    }
    assert!(non_empty > 20);
}
