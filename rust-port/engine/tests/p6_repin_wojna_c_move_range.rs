//! REPIN-WOJNA-NOWE-C - `gra/src/game/ai-move-range.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_c_vectors/ai-move-range.json`).

use civ_engine::domain::ai_move_range::{
    build_hex_occupancy, claim_hex_for_move, farthest_step_within_budget,
    truncate_path_within_budget, Hex,
};
use serde_json::Value;
use std::collections::{HashMap, HashSet};

const VECTORS: &str = include_str!("p6_repin_wojna_c_vectors/ai-move-range.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("ai-move-range.json parse")
}

fn parse_key(k: &str) -> Hex {
    let (q, r) = k.split_once(',').expect("klucz q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

/// Liczba z wektora: tekst `String(x)` (`Infinity`, `-Infinity`, `NaN`, `-0`) albo liczba JSON.
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "NaN" => f64::NAN,
            "-0" => -0.0,
            other => other.parse::<f64>().expect("liczba"),
        },
        other => panic!("nieoczekiwany typ liczby: {other}"),
    }
}

fn hex_of(v: &Value) -> Hex {
    (v["q"].as_i64().expect("q"), v["r"].as_i64().expect("r"))
}

fn path_of(v: &Value) -> Vec<Hex> {
    v.as_array().expect("path").iter().map(hex_of).collect()
}

fn costs_of(v: &Value) -> HashMap<Hex, f64> {
    v.as_array()
        .expect("costs")
        .iter()
        .map(|pair| (parse_key(pair[0].as_str().expect("key")), num(&pair[1])))
        .collect()
}

fn sorted_occ(occ: &HashMap<String, u32>) -> Vec<(String, u32)> {
    let mut out: Vec<(String, u32)> = occ.iter().map(|(k, v)| (k.clone(), *v)).collect();
    out.sort();
    out
}

fn key_fn(q: i64, r: i64) -> String {
    format!("{q},{r}")
}

#[test]
fn truncate_path_matches_web_custom_costs() {
    let root = root();
    let cases = root["truncateCases"].as_array().expect("truncateCases");
    assert!(cases.len() >= 900);
    for (i, c) in cases.iter().enumerate() {
        let out = truncate_path_within_budget(
            &path_of(&c["path"]),
            num(&c["budget"]),
            &costs_of(&c["costs"]),
        );
        assert_eq!(out, path_of(&c["out"]), "truncateCases[{i}]");
    }
}

#[test]
fn truncate_path_matches_web_default_terrain_costs() {
    let root = root();
    let cases = root["defaultCostCases"]
        .as_array()
        .expect("defaultCostCases");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let out = truncate_path_within_budget(
            &path_of(&c["path"]),
            num(&c["budget"]),
            &costs_of(&c["costs"]),
        );
        assert_eq!(out, path_of(&c["out"]), "defaultCostCases[{i}]");
    }
}

#[test]
fn farthest_step_matches_web_with_blocked_keys() {
    let root = root();
    let cases = root["farthestCases"].as_array().expect("farthestCases");
    assert!(cases.len() >= 900);
    for (i, c) in cases.iter().enumerate() {
        let blocked: Option<HashSet<Hex>> = c["blocked"].as_array().map(|a| {
            a.iter()
                .map(|k| parse_key(k.as_str().expect("k")))
                .collect()
        });
        let out = farthest_step_within_budget(
            &path_of(&c["path"]),
            num(&c["budget"]),
            &costs_of(&c["costs"]),
            blocked.as_ref(),
        );
        let expected = if c["out"].is_null() {
            None
        } else {
            Some(hex_of(&c["out"]))
        };
        assert_eq!(out, expected, "farthestCases[{i}]");
    }
}

#[test]
fn farthest_step_matches_web_default_terrain_costs() {
    let root = root();
    let cases = root["farthestDefaultCases"]
        .as_array()
        .expect("farthestDefaultCases");
    assert!(cases.len() >= 300);
    for (i, c) in cases.iter().enumerate() {
        let out = farthest_step_within_budget(
            &path_of(&c["path"]),
            num(&c["budget"]),
            &costs_of(&c["costs"]),
            None,
        );
        let expected = if c["out"].is_null() {
            None
        } else {
            Some(hex_of(&c["out"]))
        };
        assert_eq!(out, expected, "farthestDefaultCases[{i}]");
    }
}

#[test]
fn occupancy_matches_web() {
    let root = root();
    let cases = root["occupancyCases"].as_array().expect("occupancyCases");
    for (i, c) in cases.iter().enumerate() {
        let units: Vec<Hex> = c["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(hex_of)
            .collect();
        let occ = build_hex_occupancy(&units, key_fn);
        let expected: Vec<(String, u32)> = c["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|e| {
                (
                    e[0].as_str().expect("k").to_string(),
                    e[1].as_u64().expect("n") as u32,
                )
            })
            .collect();
        assert_eq!(
            sorted_occ(&occ.iter().map(|(k, v)| (k.clone(), *v)).collect()),
            expected,
            "occupancyCases[{i}]"
        );
    }
}

#[test]
fn claim_sequences_match_web() {
    let root = root();
    let cases = root["claimCases"].as_array().expect("claimCases");
    assert!(cases.len() >= 700);
    for (i, c) in cases.iter().enumerate() {
        let mut occ: HashMap<String, u32> = c["initial"]
            .as_array()
            .expect("initial")
            .iter()
            .map(|e| {
                (
                    e[0].as_str().expect("k").to_string(),
                    e[1].as_u64().expect("n") as u32,
                )
            })
            .collect();
        let moves = c["moves"].as_array().expect("moves");
        let results = c["results"].as_array().expect("results");
        for (j, m) in moves.iter().enumerate() {
            let from = m[0].as_str().expect("from").to_string();
            let to = m[1].as_str().expect("to").to_string();
            let ok = claim_hex_for_move(&mut occ, &from, &to);
            assert_eq!(
                ok,
                results[j].as_bool().expect("bool"),
                "claimCases[{i}] krok {j}"
            );
        }
        let expected: Vec<(String, u32)> = c["occEnd"]
            .as_array()
            .expect("occEnd")
            .iter()
            .map(|e| {
                (
                    e[0].as_str().expect("k").to_string(),
                    e[1].as_u64().expect("n") as u32,
                )
            })
            .collect();
        assert_eq!(sorted_occ(&occ), expected, "claimCases[{i}] stan");
    }
}

// --- jawne przypadki brzegowe (NaN, remisy, brakujace klucze, blokady) ---

fn map_of(entries: &[(Hex, f64)]) -> HashMap<Hex, f64> {
    entries.iter().copied().collect()
}

#[test]
fn budget_nan_or_zero_or_negative_returns_empty() {
    let path = [(0, 0), (1, 0)];
    let costs = map_of(&[((0, 0), 1.0), ((1, 0), 1.0)]);
    assert!(truncate_path_within_budget(&path, f64::NAN, &costs).is_empty());
    assert!(truncate_path_within_budget(&path, 0.0, &costs).is_empty());
    assert!(truncate_path_within_budget(&path, -3.0, &costs).is_empty());
    assert!(truncate_path_within_budget(&[], 5.0, &costs).is_empty());
    assert_eq!(
        farthest_step_within_budget(&path, f64::NAN, &costs, None),
        None
    );
    assert_eq!(
        farthest_step_within_budget(&path[..1], 5.0, &costs, None),
        None
    );
}

#[test]
fn min_move_first_step_enters_even_if_over_budget() {
    // budget 0.5 < 1 -> brak MIN-MOVE; budget 1 -> pierwszy heks wchodzi mimo kosztu 3.
    let path = [(0, 0), (1, 0)];
    let costs = map_of(&[((0, 0), 3.0), ((1, 0), 1.0)]);
    assert!(truncate_path_within_budget(&path, 0.5, &costs).is_empty());
    assert_eq!(
        truncate_path_within_budget(&path, 1.0, &costs),
        vec![(0, 0)]
    );
}

#[test]
fn missing_key_or_infinity_stops_prefix() {
    let path = [(0, 0), (1, 0), (2, 0)];
    let missing = map_of(&[((0, 0), 1.0), ((2, 0), 1.0)]);
    assert_eq!(
        truncate_path_within_budget(&path, 10.0, &missing),
        vec![(0, 0)]
    );
    let inf = map_of(&[((0, 0), 1.0), ((1, 0), f64::INFINITY), ((2, 0), 1.0)]);
    assert_eq!(truncate_path_within_budget(&path, 10.0, &inf), vec![(0, 0)]);
    // pierwszy heks nieprzejezdny -> pusto (brak MIN-MOVE)
    let first_inf = map_of(&[((0, 0), f64::INFINITY), ((1, 0), 1.0)]);
    assert!(truncate_path_within_budget(&path, 10.0, &first_inf).is_empty());
}

#[test]
fn nan_cost_is_not_a_stop() {
    // web: `spent + NaN > budget` jest false, wiec NaN wchodzi do prefiksu.
    let path = [(0, 0), (1, 0)];
    let costs = map_of(&[((0, 0), f64::NAN), ((1, 0), 1.0)]);
    assert_eq!(
        truncate_path_within_budget(&path, 5.0, &costs),
        vec![(0, 0), (1, 0)]
    );
}

#[test]
fn farthest_target_blocked_steps_back_one() {
    let path = [(0, 0), (1, 0), (2, 0)];
    let costs = map_of(&[((0, 0), 1.0), ((1, 0), 1.0), ((2, 0), 1.0)]);
    let blocked: HashSet<Hex> = [(2, 0)].into_iter().collect();
    assert_eq!(
        farthest_step_within_budget(&path, 5.0, &costs, Some(&blocked)),
        Some((1, 0))
    );
    assert_eq!(
        farthest_step_within_budget(&path, 5.0, &costs, None),
        Some((2, 0))
    );
    let all: HashSet<Hex> = path.iter().copied().collect();
    assert_eq!(
        farthest_step_within_budget(&path, 5.0, &costs, Some(&all)),
        None
    );
}

#[test]
fn claim_rejects_occupied_target_and_moves_counter() {
    let mut occ: HashMap<&str, u32> = HashMap::new();
    occ.insert("a", 2);
    occ.insert("b", 1);
    assert!(!claim_hex_for_move(&mut occ, &"a", &"b"));
    assert_eq!(occ["a"], 2);
    assert!(claim_hex_for_move(&mut occ, &"a", &"c"));
    assert_eq!(occ["a"], 1);
    assert_eq!(occ["c"], 1);
    assert!(claim_hex_for_move(&mut occ, &"a", &"d"));
    assert!(!occ.contains_key("a"));
}
