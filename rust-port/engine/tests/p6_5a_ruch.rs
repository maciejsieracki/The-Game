//! P6.5A - split / bounce / zwrot ruchu, akcje paska i pule ruchu stosu z `armyMerge.ts`, z
//! wektorami z URUCHOMIONEGO weba (`tests/p6_5a_vectors/ruch.json`, pin edb8fb56).

#[path = "p6_5a_vectors/common.rs"]
mod common;

use civ_engine::domain::recruitment::army_merge::{
    assign_bounce_hexes_for_units, compute_separate_return, deduct_stack_ruch_left,
    find_adjacent_empty_hexes, find_bounce_hex_from_origin, find_split_dest_hexes,
    planning_stack_ruch_left, planning_unit_ruch_left, resolve_separate_return_hex,
    stack_hud_merge_split_actions, stack_ruch_left, stack_ruch_max, sync_stack_ruch_left,
    unit_with_planning_stack_ruch, unit_with_stack_ruch, StosJednostka,
};
use common::{
    assert_same, assert_unit, assert_units, blocked_set, cases, indices, load, num, opt_num, pair,
    pairs, refs, unit, units,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5a_vectors/ruch.json");

fn root() -> Value {
    load(VECTORS)
}

fn int(value: &Value) -> i32 {
    i32::try_from(value.as_i64().expect("int")).expect("i32")
}

#[test]
fn adjacent_empty_and_split_destinations_match_web() {
    let root = root();
    let (mut nonempty, mut labelled) = (0, 0);
    for case in cases(&root, "findAdjacentEmptyHexes") {
        let all = units(&case["units"]);
        let blocked = blocked_set(&case["blocked"]).expect("blocked");
        let passable = |q: i32, r: i32| !blocked.contains(&(q, r));
        let got = find_adjacent_empty_hexes(&all, int(&case["q"]), int(&case["r"]), &passable);
        assert_eq!(got, pairs(&case["out"]), "findAdjacentEmptyHexes {case}");
        if !got.is_empty() {
            nonempty += 1;
        }
    }
    for case in cases(&root, "findSplitDestHexes") {
        let all = units(&case["units"]);
        let blocked = blocked_set(&case["blocked"]).expect("blocked");
        let passable = |q: i32, r: i32| !blocked.contains(&(q, r));
        let allow = case["allowSame"].as_bool().unwrap_or(false);
        let got = find_split_dest_hexes(&all, int(&case["q"]), int(&case["r"]), &passable, allow);
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "{case}");
        for (hex, want) in got.iter().zip(want) {
            assert_eq!((hex.q, hex.r), (int(&want["q"]), int(&want["r"])), "{case}");
            assert_eq!(hex.label.as_deref(), want["label"].as_str(), "{case}");
            if hex.label.is_some() {
                labelled += 1;
            }
        }
    }
    assert!(nonempty > 30 && labelled > 10, "{nonempty}/{labelled}");
}

#[test]
fn bounce_hex_assignment_matches_web_including_duplicates_and_blocking() {
    let root = root();
    let (mut assigned, mut missing) = (0, 0);
    for case in cases(&root, "assignBounceHexesForUnits") {
        let all = units(&case["units"]);
        let blocked = blocked_set(&case["blocked"]);
        let passable = |q: i32, r: i32| blocked.as_ref().is_none_or(|set| !set.contains(&(q, r)));
        let ids: Vec<String> = case["ids"]
            .as_array()
            .expect("ids")
            .iter()
            .map(|id| id.as_str().expect("id").to_owned())
            .collect();
        let id_refs: Vec<&str> = ids.iter().map(String::as_str).collect();
        let got = assign_bounce_hexes_for_units(
            &all,
            int(&case["preferQ"]),
            int(&case["preferR"]),
            &id_refs,
            blocked
                .as_ref()
                .map(|_| &passable as &dyn Fn(i32, i32) -> bool),
        );
        let want: Vec<(String, (i32, i32))> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|entry| (entry[0].as_str().expect("id").to_owned(), pair(&entry[1])))
            .collect();
        assert_eq!(got, want, "assignBounceHexesForUnits {case}");
        assigned += got.len();
        missing += ids.len() - got.len().min(ids.len());
    }
    assert!(assigned > 100 && missing > 5, "{assigned}/{missing}");
}

#[test]
fn bounce_from_origin_and_separate_return_hex_match_web() {
    let root = root();
    let (mut some, mut none) = (0, 0);
    for case in cases(&root, "findBounceHexFromOrigin") {
        let all = units(&case["units"]);
        let blocked = blocked_set(&case["blocked"]);
        let passable = |q: i32, r: i32| blocked.as_ref().is_none_or(|set| !set.contains(&(q, r)));
        let got = find_bounce_hex_from_origin(
            &all,
            int(&case["fromQ"]),
            int(&case["fromR"]),
            case["except"].as_str().expect("except"),
            blocked
                .as_ref()
                .map(|_| &passable as &dyn Fn(i32, i32) -> bool),
        );
        let want = case["out"].as_array().map(|_| pair(&case["out"]));
        assert_eq!(got, want, "findBounceHexFromOrigin {case}");
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
    }
    assert!(some > 20 && none > 2, "{some}/{none}");
    let (mut some, mut none) = (0, 0);
    for case in cases(&root, "resolveSeparateReturnHex") {
        let all = units(&case["units"]);
        let blocked = blocked_set(&case["blocked"]);
        let passable = |q: i32, r: i32| blocked.as_ref().is_none_or(|set| !set.contains(&(q, r)));
        let got = resolve_separate_return_hex(
            &all,
            int(&case["fromQ"]),
            int(&case["fromR"]),
            case["ownerId"].as_i64().expect("ownerId"),
            blocked
                .as_ref()
                .map(|_| &passable as &dyn Fn(i32, i32) -> bool),
        );
        let want = case["out"].as_array().map(|_| pair(&case["out"]));
        assert_eq!(got, want, "resolveSeparateReturnHex {case}");
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
    }
    assert!(some > 20 && none > 5, "{some}/{none}");
}

#[test]
fn separate_return_matches_web_bitwise() {
    let root = root();
    let mut clamped = 0;
    for case in cases(&root, "computeSeparateReturn") {
        let all = units(&case["units"]);
        let got = compute_separate_return(&all, num(&case["deducted"]));
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "{case}");
        for ((id, value), want) in got.iter().zip(want) {
            assert_eq!(id, want[0].as_str().expect("id"), "{case}");
            assert_same(
                &format!("computeSeparateReturn {id}"),
                *value,
                num(&want[1]),
            );
        }
        if all.iter().any(|u| {
            got.iter()
                .any(|(id, v)| *id == u.id && *v == u.ruch && u.ruch_left < u.ruch)
        }) {
            clamped += 1;
        }
    }
    assert!(
        clamped > 5,
        "wektory musza dochodzic do klamry `u.ruch` ({clamped})"
    );
}

#[test]
fn hud_actions_match_web() {
    let root = root();
    let mut empty = 0;
    for case in cases(&root, "stackHudMergeSplitActions") {
        let got = stack_hud_merge_split_actions(
            usize::try_from(case["len"].as_u64().expect("len")).expect("usize"),
            case["canMerge"].as_bool().expect("canMerge"),
            usize::try_from(case["dest"].as_u64().expect("dest")).expect("usize"),
        );
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "{case}");
        for (action, want) in got.iter().zip(want) {
            assert_eq!(action.id, want["id"].as_str().expect("id"), "{case}");
            assert_eq!(
                action.label,
                want["label"].as_str().expect("label"),
                "{case}"
            );
            assert_eq!(
                action.disabled,
                want["disabled"].as_bool().expect("disabled"),
                "{case}"
            );
        }
        if got.is_empty() {
            empty += 1;
        }
    }
    assert!(empty >= 2, "{empty}");
}

#[test]
fn ruch_pools_match_web_bitwise() {
    let root = root();
    type Pool = Box<dyn Fn(&[&StosJednostka]) -> f64>;
    let pools: Vec<(&str, Pool)> = vec![
        ("stackRuchLeft", Box::new(|s| stack_ruch_left(s))),
        (
            "planningStackRuchLeft",
            Box::new(|s| planning_stack_ruch_left(s)),
        ),
        ("stackRuchMax", Box::new(|s| stack_ruch_max(s))),
    ];
    for (name, pool) in pools {
        let mut empty = 0;
        for case in cases(&root, name) {
            let all = units(&case["units"]);
            let stack = refs(&all, &indices(&case["stack"]));
            assert_same(name, pool(&stack), num(&case["out"]));
            if stack.is_empty() {
                empty += 1;
            }
        }
        assert!(empty > 2, "{name}: {empty}");
    }
    let mut snapshots = 0;
    for case in cases(&root, "planningUnitRuchLeft") {
        let u = unit(&case["unit"]);
        assert_same(
            "planningUnitRuchLeft",
            planning_unit_ruch_left(&u),
            num(&case["out"]),
        );
        if u.fortify_ruch_snapshot.is_some() {
            snapshots += 1;
        }
    }
    assert!(snapshots > 20, "{snapshots}");
}

#[test]
fn sync_and_deduct_match_web() {
    let root = root();
    for case in cases(&root, "syncStackRuchLeft") {
        let mut list = units(&case["units"]);
        let want = units(&case["after"]);
        let at = indices(&case["stack"]);
        let value = opt_num(case.get("ruchLeft"));
        let mut stack: Vec<&mut StosJednostka> = list
            .iter_mut()
            .enumerate()
            .filter(|(i, _)| at.contains(i))
            .map(|(_, u)| u)
            .collect();
        sync_stack_ruch_left(&mut stack, value);
        assert_units("syncStackRuchLeft", &list, &want);
    }
    for case in cases(&root, "deductStackRuchLeft") {
        let mut list = units(&case["units"]);
        let want = units(&case["after"]);
        let at = indices(&case["stack"]);
        let mut stack: Vec<&mut StosJednostka> = list
            .iter_mut()
            .enumerate()
            .filter(|(i, _)| at.contains(i))
            .map(|(_, u)| u)
            .collect();
        deduct_stack_ruch_left(&mut stack, num(&case["cost"]));
        assert_units("deductStackRuchLeft", &list, &want);
    }
}

#[test]
fn unit_with_pooled_ruch_matches_web() {
    let root = root();
    type With = Box<dyn Fn(&StosJednostka, &[&StosJednostka]) -> StosJednostka>;
    let withs: Vec<(&str, With)> = vec![
        (
            "unitWithStackRuch",
            Box::new(|u, s| unit_with_stack_ruch(u, s)),
        ),
        (
            "unitWithPlanningStackRuch",
            Box::new(|u, s| unit_with_planning_stack_ruch(u, s)),
        ),
    ];
    for (name, with) in withs {
        let (mut changed, mut unchanged) = (0, 0);
        for case in cases(&root, name) {
            let all = units(&case["units"]);
            let one = &all[usize::try_from(case["unit"].as_u64().expect("unit")).expect("usize")];
            let stack = refs(&all, &indices(&case["stack"]));
            let got = with(one, &stack);
            assert_unit(name, &got, &unit(&case["out"]));
            if case["same"].as_bool().expect("same") {
                unchanged += 1;
            } else {
                changed += 1;
            }
        }
        assert!(
            changed > 5 && unchanged > 5,
            "{name}: {changed}/{unchanged}"
        );
    }
}
