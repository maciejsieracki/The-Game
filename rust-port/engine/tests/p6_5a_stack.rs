//! P6.5A - tozsamosc stosu, widocznosc na heksie, garnizon i fortyfikacja z `armyMerge.ts`, z
//! wektorami z URUCHOMIONEGO weba (`tests/p6_5a_vectors/stack.json`, pin edb8fb56).

#[path = "p6_5a_vectors/common.rs"]
mod common;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    stack_group_id_of as p64_stack_group_id_of, RuchJednostka,
};
use civ_engine::domain::recruitment::army_merge::{
    active_unit_stack, adjacent_visible_army_hexes, all_defenders_fortified_in_garnizon,
    co_located_for_merge_prompt, count_law_garrison_on_city_hex, enter_field_fortify,
    enter_garnizon, exit_field_fortify, exit_garnizon, garrison_units_on_hex, same_stack_group,
    stack_group_id_of, stack_key, stack_render_key, units_on_city_hex_for_law,
    visible_stack_on_hex, wake_stack_for_move_order, StackGroupSeq, StosJednostka,
};
use common::{assert_unit, assert_units, cases, indices, load, num, positions, unit, units};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5a_vectors/stack.json");

fn root() -> Value {
    load(VECTORS)
}

#[test]
fn stack_group_id_and_render_key_match_web() {
    let root = root();
    let mut grouped = 0;
    for case in cases(&root, "stackGroupIdOf") {
        let u = unit(&case["unit"]);
        let want = case["out"].as_str().expect("out");
        assert_eq!(stack_group_id_of(&u), want, "stackGroupIdOf {case}");
        if u.stack_group_id.as_deref().is_some_and(|id| !id.is_empty()) {
            grouped += 1;
        }
    }
    assert!(grouped > 10, "wektory musza obejmowac jawne stackGroupId");
    for case in cases(&root, "stackRenderKey") {
        let u = unit(&case["unit"]);
        assert_eq!(
            stack_render_key(&u),
            case["out"].as_str().expect("out"),
            "stackRenderKey {case}"
        );
    }
}

#[test]
fn stack_group_id_agrees_with_p64_port_on_the_same_unit() {
    let root = root();
    for case in cases(&root, "stackGroupIdOf") {
        let u = unit(&case["unit"]);
        let mut ruch = RuchJednostka::new(&u.id, u.owner_id, "piechota", u.q, u.r);
        ruch.in_garnizon = u.in_garnizon == Some(true);
        ruch.stack_group_id = u.stack_group_id.clone();
        assert_eq!(
            p64_stack_group_id_of(&ruch),
            stack_group_id_of(&u),
            "{case}"
        );
    }
}

#[test]
fn same_stack_group_and_stack_key_match_web() {
    let root = root();
    let (mut same, mut different) = (0, 0);
    for case in cases(&root, "sameStackGroup") {
        let want = case["out"].as_bool().expect("out");
        let got = same_stack_group(&unit(&case["a"]), &unit(&case["b"]));
        assert_eq!(got, want, "sameStackGroup {case}");
        if want {
            same += 1;
        } else {
            different += 1;
        }
    }
    assert!(same > 5 && different > 5, "{same}/{different}");
    for case in cases(&root, "stackKey") {
        let q = i32::try_from(num(&case["q"]) as i64).expect("q");
        let r = i32::try_from(num(&case["r"]) as i64).expect("r");
        assert_eq!(
            stack_key(q, r),
            case["out"].as_str().expect("out"),
            "{case}"
        );
    }
}

#[test]
fn fresh_and_shared_stack_group_ids_match_web_sequence() {
    let root = root();
    let sequence = &cases(&root, "freshSequence")[0];
    let mut seq = StackGroupSeq::new();
    let mut fresh = 0;
    let mut assigned = 0;
    for (i, op) in sequence["ops"].as_array().expect("ops").iter().enumerate() {
        let now = num(&op["now"]) as u64;
        match op["op"].as_str().expect("op") {
            "fresh" => {
                let owner = op["owner"].as_i64().expect("owner");
                assert_eq!(
                    seq.fresh_stack_group_id(owner, now),
                    op["out"].as_str().expect("out"),
                    "op {i} {op}"
                );
                fresh += 1;
            }
            "assign" => {
                let mut list = units(&op["units"]);
                let want = units(&op["after"]);
                let mut refs: Vec<&mut StosJednostka> = list.iter_mut().collect();
                seq.assign_shared_stack_group_id(&mut refs, now);
                assert_units(&format!("op {i}"), &list, &want);
                assigned += 1;
            }
            other => panic!("nieznana operacja {other}"),
        }
    }
    assert!(fresh > 40 && assigned > 5, "{fresh}/{assigned}");
}

fn query_cases(
    name: &str,
    run: impl for<'a> Fn(&'a [StosJednostka], i32, i32, i64, Option<&str>) -> Vec<&'a StosJednostka>,
) {
    let root = root();
    let mut nonempty = 0;
    for case in cases(&root, name) {
        let all = units(&case["units"]);
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("q");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("r");
        let owner = case["ownerId"].as_i64().expect("ownerId");
        let group = case["groupId"].as_str();
        let got = run(&all, q, r, owner, group);
        let want = indices(&case["out"]);
        assert_eq!(positions(&all, &got), want, "{name} {case}");
        if !want.is_empty() {
            nonempty += 1;
        }
    }
    assert!(
        nonempty > 10,
        "{name}: za malo niepustych wynikow ({nonempty})"
    );
}

#[test]
fn visible_colocated_and_garrison_queries_match_web() {
    query_cases("visibleStackOnHex", visible_stack_on_hex);
    query_cases("coLocatedForMergePrompt", co_located_for_merge_prompt);
    query_cases("garrisonUnitsOnHex", garrison_units_on_hex);
}

#[test]
fn adjacent_army_hexes_and_active_stack_match_web() {
    let root = root();
    let mut found = 0;
    for case in cases(&root, "adjacentVisibleArmyHexes") {
        let all = units(&case["units"]);
        let got = adjacent_visible_army_hexes(
            &all,
            i32::try_from(case["q"].as_i64().expect("q")).expect("q"),
            i32::try_from(case["r"].as_i64().expect("r")).expect("r"),
            case["ownerId"].as_i64().expect("ownerId"),
        );
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "{case}");
        for (hex, want) in got.iter().zip(want) {
            assert_eq!(i64::from(hex.q), want["q"].as_i64().expect("q"));
            assert_eq!(i64::from(hex.r), want["r"].as_i64().expect("r"));
            assert_eq!(
                positions(&all, &hex.stack),
                indices(&want["stack"]),
                "{case}"
            );
        }
        found += got.len();
    }
    assert!(found > 20, "{found}");
    let mut nonempty = 0;
    for case in cases(&root, "activeUnitStack") {
        let all = units(&case["units"]);
        let active =
            &all[usize::try_from(case["active"].as_u64().expect("active")).expect("usize")];
        let got = active_unit_stack(&all, active);
        let want = indices(&case["out"]);
        assert_eq!(positions(&all, &got), want, "activeUnitStack {case}");
        if !want.is_empty() {
            nonempty += 1;
        }
    }
    assert!(nonempty > 20, "{nonempty}");
}

#[test]
fn garrison_and_field_fortify_transitions_match_web() {
    let root = root();
    for (name, enter) in [
        ("enterGarnizon", enter_garnizon as fn(&mut StosJednostka)),
        ("enterFieldFortify", enter_field_fortify),
    ] {
        for case in cases(&root, name) {
            let mut u = unit(&case["unit"]);
            enter(&mut u);
            assert_unit(&format!("{name} {case}"), &u, &unit(&case["after"]));
        }
    }
    for (name, exit) in [
        (
            "exitGarnizon",
            exit_garnizon as fn(&mut StosJednostka) -> bool,
        ),
        ("exitFieldFortify", exit_field_fortify),
    ] {
        let (mut changed, mut unchanged) = (0, 0);
        for case in cases(&root, name) {
            let mut u = unit(&case["unit"]);
            let got = exit(&mut u);
            assert_eq!(got, case["out"].as_bool().expect("out"), "{name} {case}");
            assert_unit(&format!("{name} {case}"), &u, &unit(&case["after"]));
            if got {
                changed += 1;
            } else {
                unchanged += 1;
            }
        }
        assert!(
            changed > 5 && unchanged > 5,
            "{name}: {changed}/{unchanged}"
        );
    }
}

#[test]
fn transition_chains_match_web_including_both_fortifications_at_once() {
    let root = root();
    let mut both = 0;
    for case in cases(&root, "fortifyChain") {
        let mut u = unit(&case["unit"]);
        for (i, step) in case["steps"].as_array().expect("steps").iter().enumerate() {
            let op = step["op"].as_str().expect("op");
            let ret = match op {
                "enterGarnizon" => {
                    enter_garnizon(&mut u);
                    None
                }
                "enterFieldFortify" => {
                    enter_field_fortify(&mut u);
                    None
                }
                "exitGarnizon" => Some(exit_garnizon(&mut u)),
                "exitFieldFortify" => Some(exit_field_fortify(&mut u)),
                other => panic!("nieznana operacja {other}"),
            };
            assert_eq!(ret, step["ret"].as_bool(), "{op} krok {i}");
            assert_unit(&format!("{op} krok {i}"), &u, &unit(&step["after"]));
            if u.in_garnizon == Some(true) && u.ufortyfikowany_w_polu == Some(true) {
                both += 1;
            }
        }
    }
    assert!(
        both > 3,
        "lancuchy musza dochodzic do obu fortyfikacji naraz ({both})"
    );
}

#[test]
fn all_defenders_and_wake_stack_match_web() {
    let root = root();
    let (mut yes, mut no) = (0, 0);
    for case in cases(&root, "allDefendersFortifiedInGarnizon") {
        let defenders = units(&case["units"]);
        let got = all_defenders_fortified_in_garnizon(&defenders);
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 3 && no > 3, "{yes}/{no}");
    let (mut left, mut stayed) = (0, 0);
    for case in cases(&root, "wakeStackForMoveOrder") {
        let mut list = units(&case["units"]);
        let want = units(&case["after"]);
        let mut stack: Vec<&mut StosJednostka> = list.iter_mut().collect();
        let got = wake_stack_for_move_order(&mut stack);
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
        assert_units("wakeStackForMoveOrder", &list, &want);
        if got {
            left += 1;
        } else {
            stayed += 1;
        }
    }
    assert!(left > 5 && stayed > 5, "{left}/{stayed}");
}

#[test]
fn law_garrison_counts_match_web() {
    let root = root();
    let mut positive = 0;
    for case in cases(&root, "countLawGarrisonOnCityHex") {
        let all = units(&case["units"]);
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("q");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("r");
        let owner = case["ownerId"].as_i64().expect("ownerId");
        let got = count_law_garrison_on_city_hex(&all, q, r, owner);
        assert_eq!(
            got as u64,
            case["out"].as_u64().expect("out"),
            "countLawGarrisonOnCityHex {case}"
        );
        if got > 0 {
            positive += 1;
        }
    }
    assert!(positive > 10, "{positive}");
    for case in cases(&root, "unitsOnCityHexForLaw") {
        let all = units(&case["units"]);
        let q = i32::try_from(case["q"].as_i64().expect("q")).expect("q");
        let r = i32::try_from(case["r"].as_i64().expect("r")).expect("r");
        let owner = case["ownerId"].as_i64().expect("ownerId");
        let got = units_on_city_hex_for_law(&all, q, r, owner);
        assert_eq!(positions(&all, &got), indices(&case["out"]), "{case}");
    }
}
