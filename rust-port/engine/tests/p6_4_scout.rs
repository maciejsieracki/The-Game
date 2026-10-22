//! P6.4 - `scout-auto-explore.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_4_vectors/scout.json`).
//! Generator liczb losowych to sekwencja zapisana w wektorze (cyklicznie); porownujemy takze
//! LICZBE wywolan `rng()` (zuzycie losowosci musi byc identyczne z webem).

#[path = "p6_4_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    advance_scout_auto_explore, clear_scout_auto_explore, is_scout_unit, pick_scout_explore_target,
    run_scouts_auto_explore, score_hex_for_explore, score_marginal_reveal, RuchJednostka,
};
use common::{
    assert_same, cases, key_set, load, load_maps, num, opt_string, ordered, pair, unit, units,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_4_vectors/scout.json");

fn root() -> Value {
    load(VECTORS)
}

/// Generator odtwarzajacy sekwencje z wektora (web: `seq[i++ % seq.length]`).
struct Seq {
    values: Vec<f64>,
    index: usize,
}

impl Seq {
    fn new(value: &Value) -> Self {
        Self {
            values: value.as_array().expect("rng").iter().map(num).collect(),
            index: 0,
        }
    }

    fn next(&mut self) -> f64 {
        let value = self.values[self.index % self.values.len()];
        self.index += 1;
        value
    }
}

#[test]
fn scout_flags_match_web() {
    let root = root();
    let mut scouts = 0;
    for case in cases(&root, "isScoutUnit") {
        let mut candidate =
            RuchJednostka::new("x", 0, case["category"].as_str().expect("category"), 0, 0);
        candidate.type_id = opt_string(case.get("typeId"));
        let got = is_scout_unit(&candidate);
        assert_eq!(
            got,
            case["out"].as_bool().expect("out"),
            "isScoutUnit {case}"
        );
        if got {
            scouts += 1;
        }
    }
    assert!(scouts > 3);
    for case in cases(&root, "clearScoutAutoExplore") {
        let mut candidate = unit(&case["unit"]);
        let got = clear_scout_auto_explore(&mut candidate);
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
        assert_eq!(
            candidate,
            unit(&case["after"]),
            "clearScoutAutoExplore {case}"
        );
    }
}

#[test]
fn explore_scores_match_web() {
    let root = root();
    let maps = load_maps();
    let mut positive = 0;
    for case in cases(&root, "scoreMarginalReveal") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let got = score_marginal_reveal(
            pair(&case["from"]),
            pair(&case["to"]),
            &ordered(&case["explored"]),
            map,
            num(&case["sight"]),
        );
        assert_eq!(
            i64::from(got),
            case["out"].as_i64().expect("out"),
            "scoreMarginalReveal {case}"
        );
        if got > 0 {
            positive += 1;
        }
    }
    assert!(positive > 20);
    for case in cases(&root, "scoreHexForExplore") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let got = score_hex_for_explore(
            i32::try_from(case["q"].as_i64().expect("q")).expect("i32"),
            i32::try_from(case["r"].as_i64().expect("r")).expect("i32"),
            &ordered(&case["explored"]),
            map,
            num(&case["sight"]),
        );
        assert_eq!(
            got,
            case["out"].as_i64().expect("out"),
            "scoreHexForExplore {case}"
        );
    }
}

#[test]
fn pick_scout_explore_target_matches_web_including_rng_use() {
    let root = root();
    let maps = load_maps();
    let (mut some, mut none) = (0, 0);
    for case in cases(&root, "pickScoutExploreTarget") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let mut rng = Seq::new(&case["rng"]);
        let got = pick_scout_explore_target(
            &unit(&case["unit"]),
            map,
            &ordered(&case["explored"]),
            &key_set(&case["occupied"]),
            num(&case["sight"]),
            &mut || rng.next(),
        );
        let want = if case["out"].is_null() {
            None
        } else {
            Some(pair(&case["out"]))
        };
        assert_eq!(got, want, "pickScoutExploreTarget {case}");
        assert_eq!(
            rng.index,
            case["rngCalls"].as_u64().expect("rngCalls") as usize,
            "liczba wywolan rng {case}"
        );
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
    }
    assert!(
        some > 60 && none > 5,
        "wektory musza obejmowac oba wyniki ({some}/{none})"
    );
}

fn callbacks(value: &Value) -> Vec<(String, i32, i32, f64)> {
    value
        .as_array()
        .expect("callbacks")
        .iter()
        .map(|entry| {
            (
                entry[0].as_str().expect("id").to_owned(),
                i32::try_from(entry[1].as_i64().expect("q")).expect("i32"),
                i32::try_from(entry[2].as_i64().expect("r")).expect("i32"),
                num(&entry[3]),
            )
        })
        .collect()
}

#[test]
fn advance_scout_auto_explore_matches_web() {
    let root = root();
    let maps = load_maps();
    let (mut moved, mut idle, mut capped) = (0, 0, 0);
    for case in cases(&root, "advanceScoutAutoExplore") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let mut scout = unit(&case["unit"]);
        let mut all = vec![scout.clone()];
        all.extend(units(&case["others"]));
        let mut rng = Seq::new(&case["rng"]);
        let mut seen: Vec<(String, i32, i32, f64)> = Vec::new();
        let (did_move, steps) = advance_scout_auto_explore(
            &mut scout,
            map,
            &ordered(&case["explored"]),
            &all,
            num(&case["sight"]),
            &mut || rng.next(),
            Some(&mut |unit: &RuchJednostka| {
                seen.push((unit.id.clone(), unit.q, unit.r, unit.ruch_left));
            }),
        );
        let out = &case["out"];
        assert_eq!(
            did_move,
            out["moved"].as_bool().expect("moved"),
            "moved {case}"
        );
        assert_eq!(
            u64::from(steps),
            out["steps"].as_u64().expect("steps"),
            "steps {case}"
        );
        assert_eq!(scout, unit(&out["unit"]), "stan jednostki {case}");
        assert_eq!(seen.len(), callbacks(&out["callbacks"]).len(), "{case}");
        for (got, want) in seen.iter().zip(callbacks(&out["callbacks"])) {
            assert_eq!((&got.0, got.1, got.2), (&want.0, want.1, want.2), "{case}");
            assert_same("ruchLeft w callbacku", got.3, want.3);
        }
        assert_eq!(
            rng.index,
            out["rngCalls"].as_u64().expect("rngCalls") as usize,
            "liczba wywolan rng {case}"
        );
        if did_move {
            moved += 1;
        } else {
            idle += 1;
        }
        if steps > 96 {
            capped += 1;
        }
    }
    assert!(
        moved > 40 && idle > 10 && capped >= 1,
        "wektory musza obejmowac ruch, bezruch i limit krokow ({moved}/{idle}/{capped})"
    );
}

#[test]
fn run_scouts_auto_explore_matches_web() {
    let root = root();
    let maps = load_maps();
    let mut with_moves = 0;
    for case in cases(&root, "runScoutsAutoExplore") {
        let map = &maps[case["map"].as_u64().expect("map") as usize].map;
        let mut list = units(&case["units"]);
        let default_sight = num(&case["sights"]["default"]);
        let per_id: HashMap<String, f64> = case["sights"]["perId"]
            .as_object()
            .expect("perId")
            .iter()
            .map(|(id, sight)| (id.clone(), num(sight)))
            .collect();
        let mut rng = Seq::new(&case["rng"]);
        let mut seen: Vec<(String, i32, i32, f64)> = Vec::new();
        let (moved_ids, total_steps) = run_scouts_auto_explore(
            &mut list,
            map,
            &ordered(&case["explored"]),
            case["owner"].as_i64().expect("owner"),
            &|unit: &RuchJednostka| per_id.get(&unit.id).copied().unwrap_or(default_sight),
            &mut || rng.next(),
            Some(&mut |unit: &RuchJednostka| {
                seen.push((unit.id.clone(), unit.q, unit.r, unit.ruch_left));
            }),
        );
        let out = &case["out"];
        let want_ids: Vec<String> = out["movedUnitIds"]
            .as_array()
            .expect("ids")
            .iter()
            .map(|id| id.as_str().expect("id").to_owned())
            .collect();
        assert_eq!(moved_ids, want_ids, "movedUnitIds {case}");
        assert_eq!(
            u64::from(total_steps),
            out["totalSteps"].as_u64().expect("totalSteps"),
            "{case}"
        );
        assert_eq!(list, units(&out["units"]), "stan jednostek {case}");
        let want_callbacks = callbacks(&out["callbacks"]);
        assert_eq!(seen.len(), want_callbacks.len(), "{case}");
        for (got, want) in seen.iter().zip(want_callbacks) {
            assert_eq!((&got.0, got.1, got.2), (&want.0, want.1, want.2), "{case}");
            assert_same("ruchLeft w callbacku", got.3, want.3);
        }
        assert_eq!(
            rng.index,
            out["rngCalls"].as_u64().expect("rngCalls") as usize,
            "liczba wywolan rng {case}"
        );
        if total_steps > 0 {
            with_moves += 1;
        }
    }
    assert!(
        with_moves > 20,
        "wektory musza obejmowac ruch zwiadowcow ({with_moves})"
    );
}
