//! R-RUSTPORT-P4-1H-RJ-REPIN-Q3: dryf `RJ` (ruch marszu) do pinu `07d2fbd72` - wektory z
//! URUCHOMIONEGO kodu pinu (`tests/p4_1h_rj_repin_vectors/gen.mjs`):
//! `setup.ts` (MoveOccupancy / passThrough, `siegeBlocksEntry` w `computePath`),
//! `planned-march.ts` (`planPathTurns`, `shouldStopAtObstacle`, `executeMarchStep`, powiadomienia
//! o przerwaniu marszu), `army-stack-limit.ts` (`canJoinStackAt`, `trimPathToStackRoom`).

#[path = "p6_4_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::army_follow_auto_merge::{
    can_join_stack_at, trim_path_to_stack_room, FollowAutoMergeUnit,
};
use civ_engine::domain::pathfinding::ruch_jednostek::{
    build_move_occupancy, clear_march_stop, compute_path, compute_path_with_siege,
    embark_move_cost, end_blocked_keys, execute_march_step, execute_march_step_occ,
    is_notifiable_march_stop, is_pass_through_hex, march_paused_label, plan_path_turns,
    plan_path_turns_occ, register_march_stop, should_stop_at_obstacle, should_stop_at_obstacle_occ,
    trim_segment_end_off_pass_through, BoxedCostFn, ExecuteMarchResult, Klucz, MarchStopReason,
    MoveOccupancy, PathTurnPlan, PathTurnStop, PlannedMarchDest, RuchHex, RuchJednostka, RuchMapa,
    SiegeEntryFn, StopDecision, TerenBazowy, OWN_UNIT_IN_REACH_DETAIL,
};
use civ_engine::domain::save_migrations::ARMY_STACK_LIMIT;
use common::{assert_same, num, opt_num, pairs, points, unit};
use serde_json::Value;

const VECTORS: &str = include_str!("p4_1h_rj_repin_vectors/vectors.json");
const GENERATOR: &str = include_str!("p4_1h_rj_repin_vectors/gen.mjs");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn list<'a>(value: &'a Value, name: &str) -> &'a Vec<Value> {
    value[name]
        .as_array()
        .unwrap_or_else(|| panic!("brak listy {name}"))
}

fn i(value: &Value) -> i32 {
    i32::try_from(value.as_i64().expect("liczba calkowita")).expect("i32")
}

fn map_from(rows: &Value) -> RuchMapa {
    let mut map = RuchMapa::new();
    for row in rows.as_array().expect("mapa") {
        let items = row.as_array().expect("heks");
        let mut hex = RuchHex::new(
            TerenBazowy::from_web(items[2].as_str().expect("teren")).expect("znany teren"),
        );
        hex.las = items[3].as_bool().expect("las");
        hex.rzeka = items[4].as_bool().expect("rzeka");
        hex.ulepszenie = items[5].as_str().map(str::to_owned);
        hex.ulepszenia = items[6].as_array().map(|layers| {
            layers
                .iter()
                .map(|layer| layer.as_str().expect("warstwa").to_owned())
                .collect()
        });
        hex.wioska = items[7].as_bool().expect("wioska");
        hex.ma_wlasciciela = items[8].as_bool().expect("wlasciciel");
        map.insert((i(&items[0]), i(&items[1])), hex);
    }
    map
}

fn maps(root: &Value) -> Vec<RuchMapa> {
    list(root, "maps").iter().map(map_from).collect()
}

/// Minimalna jednostka zajetosci (`{id, ownerId, q, r}` weba).
fn occ_unit(value: &Value) -> RuchJednostka {
    RuchJednostka::new(
        value["id"].as_str().expect("id"),
        value["ownerId"].as_i64().expect("ownerId"),
        "piechota",
        i(&value["q"]),
        i(&value["r"]),
    )
}

fn pair_set(value: &Value) -> HashSet<Klucz> {
    pairs(value).into_iter().collect()
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
        full_path: pairs(&value["fullPath"]),
        turn_stops: list(value, "turnStops")
            .iter()
            .map(|stop| PathTurnStop {
                q: i(&stop["q"]),
                r: i(&stop["r"]),
                turn: u32::try_from(stop["turn"].as_u64().expect("turn")).expect("u32"),
            })
            .collect(),
        segment_path: pairs(&value["segmentPath"]),
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

fn stop_from(value: &Value) -> StopDecision {
    StopDecision {
        stop: value["stop"].as_bool().expect("stop"),
        reason: reason(value.get("reason")),
        detail: value
            .get("detail")
            .and_then(Value::as_str)
            .map(str::to_owned),
    }
}

fn exec_from(value: &Value) -> ExecuteMarchResult {
    ExecuteMarchResult {
        ok: value["ok"].as_bool().expect("ok"),
        move_path: pairs(&value["movePath"]),
        cost: num(&value["cost"]),
        arrived: value["arrived"].as_bool().expect("arrived"),
        stop_reason: reason(value.get("stopReason")),
        stop_detail: value
            .get("stopDetail")
            .and_then(Value::as_str)
            .map(str::to_owned),
    }
}

fn assert_exec(label: &str, got: &ExecuteMarchResult, want: &ExecuteMarchResult) {
    assert_eq!(got.ok, want.ok, "{label} ok");
    assert_eq!(got.move_path, want.move_path, "{label} movePath");
    assert_same(&format!("{label} cost"), got.cost, want.cost);
    assert_eq!(got.arrived, want.arrived, "{label} arrived");
    assert_eq!(got.stop_reason, want.stop_reason, "{label} stopReason");
    assert_eq!(got.stop_detail, want.stop_detail, "{label} stopDetail");
}

fn cost_of(spec: &Value) -> Option<BoxedCostFn<'static>> {
    match spec {
        Value::Null => None,
        Value::String(name) if name == "embark" => {
            Some(Box::new(|hex: &RuchHex| embark_move_cost(hex)))
        }
        other => panic!("nieznany koszt {other}"),
    }
}

/// Jeden przypadek marszu: wszystkie funkcje portu na tym samym wejsciu co pin.
fn check_march_case(idx: usize, case: &Value, maps: &[RuchMapa]) {
    let label = format!("march[{idx}] {:?}", case["cats"]);
    let map = &maps[case["map"].as_u64().expect("map") as usize];
    let mover = unit(&case["unit"]);
    let dest = pairs(&Value::Array(vec![case["dest"].clone()]))[0];
    let (dq, dr) = (f64::from(dest.0), f64::from(dest.1));
    let units: Vec<RuchJednostka> = list(case, "units").iter().map(occ_unit).collect();
    let occ = build_move_occupancy(&units, mover.owner_id, &[mover.id.as_str()]);
    assert_eq!(occ.blocked, pair_set(&case["occBlocked"]), "{label} occ");
    assert_eq!(
        occ.pass_through,
        pair_set(&case["occPassThrough"]),
        "{label} passThrough"
    );
    let siege_hexes = pair_set(&case["siege"]);
    let siege_owner = case["siegeOwner"].as_i64().expect("siegeOwner");
    let siege_fn = move |u: &RuchJednostka, q: i32, r: i32| {
        siege_hexes.contains(&(q, r)) && u.owner_id != siege_owner
    };
    let siege: Option<&SiegeEntryFn<'_>> = if list(case, "siege").is_empty() {
        None
    } else {
        Some(&siege_fn)
    };
    let blocked_cities = pair_set(&case["blockedCities"]);
    let can_occupy = |q: i32, r: i32| !blocked_cities.contains(&(q, r));
    let per_turn = num(&case["perTurn"]);
    let budget = opt_num(case.get("budget"));
    let stop_budget = budget.unwrap_or(per_turn);
    let cost = cost_of(&case["costFn"]);
    let cost = cost.as_deref();
    let plain = case["plainSet"].as_bool().expect("plainSet");
    let dest_obj = PlannedMarchDest {
        dest_q: dq,
        dest_r: dr,
        attack_unit_id: None,
        general_target_id: None,
    };
    let out = &case["out"];
    let want_plan = plan_from(&out["plan"]);

    let (path, plan, stop, exec) = if plain {
        // Zwykly web `Set` (bez `passThrough`), bez blokady oblezenia: stare API.
        assert!(siege.is_none(), "{label}: plain bez oblezenia");
        let path = compute_path(&mover, map, dq, dr, &occ.blocked, cost);
        let plan = plan_path_turns(&mover, dq, dr, map, &occ.blocked, per_turn, budget, cost);
        let stop = should_stop_at_obstacle(
            &mover,
            &dest_obj,
            map,
            &occ.blocked,
            &plan.segment_path,
            stop_budget,
            cost,
        );
        let exec = execute_march_step(
            &mover,
            &dest_obj,
            map,
            &occ.blocked,
            stop_budget,
            &can_occupy,
            per_turn,
            None,
            cost,
        );
        (path, plan, stop, exec)
    } else {
        let path = compute_path_with_siege(&mover, map, dq, dr, &occ.blocked, siege, cost);
        let plan = plan_path_turns_occ(&mover, dq, dr, map, &occ, siege, per_turn, budget, cost);
        let stop = should_stop_at_obstacle_occ(
            &mover,
            &dest_obj,
            map,
            &occ,
            siege,
            &plan.segment_path,
            stop_budget,
            cost,
        );
        let exec = execute_march_step_occ(
            &mover,
            &dest_obj,
            map,
            &occ,
            siege,
            stop_budget,
            &can_occupy,
            per_turn,
            None,
            cost,
        );
        (path, plan, stop, exec)
    };
    assert_eq!(path, pairs(&out["computePath"]), "{label} computePath");
    assert_plan(&label, &plan, &want_plan);
    assert_eq!(
        stop,
        stop_from(&out["stop"]),
        "{label} shouldStopAtObstacle"
    );
    assert_exec(&label, &exec, &exec_from(&out["exec"]));
}

#[test]
fn march_vectors_match_pin_07d2fbd72() {
    let root = root();
    let maps = maps(&root);
    let cases = list(&root, "march");
    assert!(
        cases.len() >= 200,
        "za malo przypadkow marszu: {}",
        cases.len()
    );
    for (idx, case) in cases.iter().enumerate() {
        check_march_case(idx, case, &maps);
    }
}

/// Pokrycie kategorii wymaganych dispatchem (liczone z wynikow pinu przez generator).
#[test]
fn march_vectors_cover_dispatch_categories() {
    let root = root();
    let mut counts: BTreeMap<String, usize> = BTreeMap::new();
    for case in list(&root, "march") {
        for cat in list(case, "cats") {
            *counts
                .entry(cat.as_str().expect("kategoria").to_owned())
                .or_default() += 1;
        }
    }
    for (cat, min) in [
        ("pass_through_mid_route", 50),
        ("segment_end_trimmed", 50),
        ("only_own_hex_in_reach", 20),
        ("dest_own_unit_merge", 20),
        ("siege_dest", 20),
        ("siege_mid", 20),
        ("plain_set", 20),
    ] {
        let got = counts.get(cat).copied().unwrap_or(0);
        assert!(got >= min, "kategoria {cat}: {got} < {min} ({counts:?})");
    }
    // Liczniki zapisane przez generator = przeliczone tutaj.
    for (cat, n) in &counts {
        assert_eq!(
            root["counts"][format!("march:{cat}")].as_u64(),
            Some(*n as u64),
            "licznik {cat}"
        );
    }
}

#[test]
fn move_occupancy_and_trim_match_pin() {
    let root = root();
    for case in list(&root, "occupancy") {
        let units: Vec<RuchJednostka> = list(case, "units").iter().map(occ_unit).collect();
        let exclude: Vec<&str> = list(case, "exclude")
            .iter()
            .map(|id| id.as_str().expect("id"))
            .collect();
        let occ = build_move_occupancy(&units, case["mover"].as_i64().expect("mover"), &exclude);
        assert_eq!(occ.blocked, pair_set(&case["blocked"]), "{case}");
        assert_eq!(occ.pass_through, pair_set(&case["passThrough"]), "{case}");
        let ends = end_blocked_keys(&occ);
        assert_eq!(
            ends,
            occ.blocked.union(&occ.pass_through).copied().collect(),
            "{case}"
        );
        let plain = MoveOccupancy::from_blocked(occ.blocked.clone());
        for probe in list(case, "probes") {
            let items = probe.as_array().expect("probe");
            let (q, r) = (i(&items[0]), i(&items[1]));
            assert_eq!(
                is_pass_through_hex(&occ, q, r),
                items[2].as_bool().expect("occ"),
                "{case}"
            );
            assert_eq!(
                is_pass_through_hex(&plain, q, r),
                items[3].as_bool().expect("plain"),
                "{case}"
            );
        }
    }
    for case in list(&root, "trimSegment") {
        let segment = pairs(&case["segment"]);
        let full_length = case["fullLength"].as_i64().expect("fullLength");
        let full_length = usize::try_from(full_length.max(0)).expect("usize");
        let occ = if case["plain"].as_bool().expect("plain") {
            MoveOccupancy::from_blocked(pair_set(&case["blocked"]))
        } else {
            MoveOccupancy {
                blocked: pair_set(&case["blocked"]),
                pass_through: pair_set(&case["passThrough"]),
            }
        };
        assert_eq!(
            trim_segment_end_off_pass_through(&segment, full_length, &occ),
            pairs(&case["out"]),
            "{case}"
        );
    }
}

fn stack_units(stacks: &Value) -> Vec<FollowAutoMergeUnit> {
    let mut out = Vec::new();
    for stack in stacks.as_array().expect("stosy") {
        let items = stack.as_array().expect("stos");
        let count = items[3].as_u64().expect("count");
        let prefix = items[4].as_str().expect("prefix");
        for n in 0..count {
            out.push(FollowAutoMergeUnit {
                id: format!("{prefix}{n}"),
                owner_id: items[2].as_i64().expect("owner"),
                q: items[0].as_i64().expect("q"),
                r: items[1].as_i64().expect("r"),
                follow_general: false,
                is_general: false,
            });
        }
    }
    out
}

fn moving_units(value: &Value) -> Vec<FollowAutoMergeUnit> {
    value
        .as_array()
        .expect("moving")
        .iter()
        .map(|u| FollowAutoMergeUnit {
            id: u["id"].as_str().expect("id").to_owned(),
            owner_id: u["ownerId"].as_i64().expect("ownerId"),
            q: u["q"].as_i64().expect("q"),
            r: u["r"].as_i64().expect("r"),
            follow_general: false,
            is_general: false,
        })
        .collect()
}

#[test]
fn stack_limit_trim_matches_pin_with_limit_500_boundaries() {
    let root = root();
    assert_eq!(root["armyStackLimit"].as_i64(), Some(ARMY_STACK_LIMIT));
    let mut labels = HashSet::new();
    for case in list(&root, "stack") {
        let label = case["label"].as_str().expect("label");
        labels.insert(label.to_owned());
        let moving = moving_units(&case["moving"]);
        let mut units = stack_units(&case["stacks"]);
        units.extend(moving.iter().cloned());
        let path = pairs(&case["path"]);
        let limit = case["limit"].as_i64().expect("limit");
        let trimmed = trim_path_to_stack_room(
            &units,
            &moving,
            &path,
            |hex| (i64::from(hex.0), i64::from(hex.1)),
            limit,
        );
        assert_eq!(trimmed, pairs(&case["out"]["trimmed"]), "{label} {case}");
        let joins: Vec<bool> = path
            .iter()
            .map(|hex| {
                can_join_stack_at(&units, &moving, i64::from(hex.0), i64::from(hex.1), limit)
            })
            .collect();
        let want: Vec<bool> = list(&case["out"], "joins")
            .iter()
            .map(|b| b.as_bool().expect("bool"))
            .collect();
        assert_eq!(joins, want, "{label}");
    }
    for required in [
        "boundary_499_plus_1_ok",
        "boundary_500_plus_1_refused",
        "boundary_498_plus_2_ok",
        "boundary_499_plus_2_refused",
        "trim_last_full",
        "trim_all_full_empty",
    ] {
        assert!(labels.contains(required), "brak wektora {required}");
    }
}

#[test]
fn march_stop_notifications_match_pin() {
    let root = root();
    let notify = &root["notify"];
    for case in list(notify, "isNotifiable") {
        assert_eq!(
            is_notifiable_march_stop(reason(case.get("reason"))),
            case["out"].as_bool().expect("out"),
            "{case}"
        );
    }
    for case in list(notify, "pausedLabel") {
        let detail = case["detail"].as_str();
        assert_eq!(
            march_paused_label(reason(case.get("reason")), detail),
            case["out"].as_str().map(str::to_owned),
            "{case}"
        );
    }
    for seq in list(notify, "sequences") {
        let mut notified: BTreeMap<String, MarchStopReason> = BTreeMap::new();
        for op in seq.as_array().expect("ops") {
            let unit_id = op["unit"].as_str().expect("unit").to_owned();
            match op["op"].as_str().expect("op") {
                "clear" => clear_march_stop(&mut notified, &unit_id),
                "register" => {
                    let got = register_march_stop(&mut notified, unit_id, reason(op.get("reason")));
                    assert_eq!(got, op["out"].as_bool().expect("out"), "{op}");
                }
                other => panic!("nieznana operacja {other}"),
            }
            let state: Vec<(String, &'static str)> = notified
                .iter()
                .map(|(k, v)| (k.clone(), v.web_value()))
                .collect();
            let want: Vec<(String, String)> = list(op, "state")
                .iter()
                .map(|e| {
                    (
                        e[0].as_str().expect("k").to_owned(),
                        e[1].as_str().expect("v").to_owned(),
                    )
                })
                .collect();
            let state: Vec<(String, String)> =
                state.into_iter().map(|(k, v)| (k, v.to_owned())).collect();
            assert_eq!(state, want, "{op}");
        }
    }
}

/// Straznik: wektory pochodza z pinu `07d2fbd72`, skroty fragmentow zapisane w wektorach sa tymi,
/// ktore generator wymusza (`EXPECTED_SHA` w `gen.mjs`), a tekst detalu R3 = literal pinu.
#[test]
fn vectors_pin_guard_and_constants() {
    let root = root();
    assert_eq!(root["pin"].as_str(), Some("07d2fbd72"));
    let excerpts = list(&root, "excerpts");
    assert!(excerpts.len() >= 20, "fragmenty: {}", excerpts.len());
    for ex in excerpts {
        let sha = ex["sha256"].as_str().expect("sha256");
        assert_eq!(sha.len(), 64);
        let name = format!(
            "'{}#{}': '{}'",
            ex["file"].as_str().expect("file"),
            ex["name"].as_str().expect("name"),
            sha
        );
        assert!(
            GENERATOR.contains(&name),
            "skrot spoza EXPECTED_SHA: {name}"
        );
    }
    assert_eq!(
        root["ownUnitInReachDetail"].as_str(),
        Some(OWN_UNIT_IN_REACH_DETAIL)
    );
}

/// Stare API (zwykly `Set`, bez oblezenia) == nowe API z pustym `pass_through` i bez predykatu:
/// dryf `07d2fbd72` nie zmienia wyniku dla zwyklego `Set` (`instanceof MoveOccupancy` = false,
/// `siegeEntryBlocker === null`).
#[test]
fn legacy_api_equals_occupancy_api_without_pass_through() {
    let root = root();
    let maps = maps(&root);
    for case in list(&root, "march") {
        let map = &maps[case["map"].as_u64().expect("map") as usize];
        let mover = unit(&case["unit"]);
        let dest = points(&Value::Array(vec![serde_json::json!({
            "q": case["dest"][0], "r": case["dest"][1]
        })]))[0];
        let units: Vec<RuchJednostka> = list(case, "units").iter().map(occ_unit).collect();
        let occ = build_move_occupancy(&units, mover.owner_id, &[mover.id.as_str()]);
        let plain = MoveOccupancy::from_blocked(occ.blocked.clone());
        let cost = cost_of(&case["costFn"]);
        let cost = cost.as_deref();
        let per_turn = num(&case["perTurn"]);
        let budget = opt_num(case.get("budget"));
        let (dq, dr) = (f64::from(dest.0), f64::from(dest.1));
        assert_eq!(
            plan_path_turns(&mover, dq, dr, map, &occ.blocked, per_turn, budget, cost),
            plan_path_turns_occ(&mover, dq, dr, map, &plain, None, per_turn, budget, cost)
        );
    }
}
