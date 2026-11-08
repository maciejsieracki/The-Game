//! P6-FORCED-WAR-MODULES-Q1 (runda 1, partia G1): zgodnosc helperow wojen wymuszonych
//! (`forced-war-common.ts` + `forced-war-stone.ts`, pin `origin/main`) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_forced_war_g1_data/cases.json` (generator: Node 22 +
//! `--experimental-strip-types`, prawdziwe funkcje weba; jedyny patch to rozszerzenie `.ts` w imporcie).
//! Liczby: JSON number; `"undefined"` = brak wartosci (undefined w webie). Odleglosc heksowa: formula axialna.

use std::collections::HashSet;

use civ_engine::domain::war_forced_common::*;
use civ_engine::domain::war_forced_stone::*;
use serde_json::Value;

const G1: &str = include_str!("p6_forced_war_g1_data/cases.json");

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) if s == "undefined" => f64::NAN,
        other => panic!("liczba oczekiwana, jest {other}"),
    }
}

fn int(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| num(v) as i64)
}

fn boolv(v: &Value) -> bool {
    v.as_bool().expect("bool")
}

/// Odleglosc heksowa (axial) -- identyczna formula jak w generatorze.
fn hd(aq: i32, ar: i32, bq: i32, br: i32) -> i64 {
    let dq = (aq - bq) as i64;
    let dr = (ar - br) as i64;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

fn candidates(v: &Value) -> Vec<ForcedWarNeighborCandidate> {
    v.as_array()
        .expect("kandydaci")
        .iter()
        .map(|c| ForcedWarNeighborCandidate {
            owner_id: int(&c["ownerId"]),
            q: int(&c["q"]) as i32,
            r: int(&c["r"]) as i32,
        })
        .collect()
}

fn id_set(v: &Value) -> HashSet<i64> {
    v.as_array().expect("lista id").iter().map(int).collect()
}

fn reference(v: &Value) -> Option<(i32, i32)> {
    if v.is_null() {
        None
    } else {
        Some((int(&v["q"]) as i32, int(&v["r"]) as i32))
    }
}

fn opt_out(v: &Option<i64>) -> Value {
    match v {
        Some(x) => Value::from(*x),
        None => Value::Null,
    }
}

#[test]
fn forced_war_g1_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(G1).expect("wektory musza sie parsowac");
    let mut counts: std::collections::BTreeMap<&str, usize> = Default::default();
    for c in &cases {
        let f = c["fn"].as_str().expect("fn");
        let input = &c["in"];
        let out = &c["out"];
        *counts.entry(f).or_default() += 1;
        match f {
            "pickForcedWarTargetId" => {
                let got = pick_forced_war_target_id(
                    &candidates(&input["candidates"]),
                    reference(&input["ref"]),
                    hd,
                    &id_set(&input["blocked"]),
                );
                assert_eq!(opt_out(&got), *out, "pickForcedWarTargetId {input}");
            }
            "pickStoneForcedWarTargetId" => {
                let got = pick_stone_forced_war_target_id(
                    &candidates(&input["candidates"]),
                    reference(&input["ref"]),
                    hd,
                    &id_set(&input["blocked"]),
                );
                assert_eq!(opt_out(&got), *out, "pickStoneForcedWarTargetId {input}");
            }
            "shouldEndForcedWarByCityCount" => {
                let got = should_end_forced_war_by_city_count(
                    int(&input["a"]),
                    int(&input["d"]),
                    int(&input["t"]),
                );
                assert_eq!(Value::Bool(got), *out, "shouldEnd {input}");
            }
            "countActiveWarsExcluding" => {
                let owners: Vec<i64> = input["owners"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(int)
                    .collect();
                let wars: HashSet<String> = input["wars"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|w| w.as_str().unwrap().to_string())
                    .collect();
                let excl = id_set(&input["exclude"]);
                let owner = int(&input["ownerId"]);
                let got = count_active_wars_excluding(
                    owner,
                    &owners,
                    |a, b| wars.contains(&format!("{}-{}", a.min(b), a.max(b))),
                    |oid| excl.contains(&oid),
                );
                assert_eq!(Value::from(got), *out, "countActiveWarsExcluding {input}");
            }
            "isRestingFromForcedWar" => {
                let rest = if input["rest"] == "undefined" {
                    None
                } else {
                    Some(num(&input["rest"]))
                };
                let got = is_resting_from_forced_war(num(&input["cur"]), rest);
                assert_eq!(Value::Bool(got), *out, "isResting {input}");
            }
            "countActiveForcedWarsForOwner" => {
                let pairs: Vec<(i64, i64)> = input["pairs"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|p| (int(&p["attackerId"]), int(&p["targetId"])))
                    .collect();
                let got = count_active_forced_wars_for_owner(int(&input["ownerId"]), &pairs);
                assert_eq!(
                    Value::from(got),
                    *out,
                    "countActiveForcedWarsForOwner {input}"
                );
            }
            "isForcedEraPeaceLocked" => {
                let got = is_forced_era_peace_locked(int(&input["cur"]), int(&input["war"]));
                assert_eq!(Value::Bool(got), *out, "isForcedEraPeaceLocked {input}");
            }
            "isForcedWarRelationBlocked" => {
                let got = is_forced_war_relation_blocked(num(&input["r"]));
                assert_eq!(Value::Bool(got), *out, "isForcedWarRelationBlocked {input}");
            }
            "isEligibleForStoneForcedWar" => {
                let got = is_eligible_for_stone_forced_war(
                    boolv(&input["isMainAiCiv"]),
                    boolv(&input["isAlreadyAtWarAnyRole"]),
                    num(&input["currentTurn"]),
                    boolv(&input["isStoneEra"]),
                );
                assert_eq!(Value::Bool(got), *out, "isEligibleForStone {input}");
            }
            "constant" => {
                let got: f64 = match input["name"].as_str().unwrap() {
                    "FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD" => {
                        FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD
                    }
                    "WOJNA_KAMIEN_WYMUSZONA_START_TURY" => WOJNA_KAMIEN_WYMUSZONA_START_TURY,
                    "WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR" => {
                        WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR
                    }
                    "WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR" => {
                        WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR
                    }
                    "WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE" => {
                        WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE as f64
                    }
                    other => panic!("nieznana stala {other}"),
                };
                assert_eq!(got, num(out), "stala {input}");
            }
            other => panic!("nieobslugiwana funkcja wektora: {other}"),
        }
    }
    // Pokrycie: kazda funkcja z partii G1 ma co najmniej jeden wektor.
    for f in [
        "pickForcedWarTargetId",
        "pickStoneForcedWarTargetId",
        "shouldEndForcedWarByCityCount",
        "countActiveWarsExcluding",
        "isRestingFromForcedWar",
        "countActiveForcedWarsForOwner",
        "isForcedEraPeaceLocked",
        "isForcedWarRelationBlocked",
        "isEligibleForStoneForcedWar",
        "constant",
    ] {
        assert!(
            counts.get(f).copied().unwrap_or(0) > 0,
            "brak wektorow: {f}"
        );
    }
}
