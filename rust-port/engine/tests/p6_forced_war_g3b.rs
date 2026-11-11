//! P6-FORCED-WAR-MODULES-Q1 (runda 4, partia G3b): zgodnosc decyzji triggera wojny wymuszonej
//! (`war_forced_trigger.rs`) i porzadku identyfikatorow (`compare_ids_icu`) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_forced_war_g3b_data/cases.json` (generator `gen_cases_g3b.mjs`, Node 22):
//! - `search`: prawdziwe `forced-war-{bronze,stone,iron}.ts` + replika warunku ownerLoop (main.ts),
//! - `sweep`: replika `sweepStaleForcedWarEntries` (main.ts) z prawdziwymi predykatami,
//! - `idcmp`: `a.localeCompare(b)` (ICU root/en; pomiar: identyczny z lokalem pl dla tego alfabetu).

use civ_engine::domain::war_forced_trigger::*;
use civ_engine::domain::war_forced_waves::{compare_ids_icu, restore_forced_war_waves};
use serde_json::{json, Value};
use std::cmp::Ordering;

const G3B: &str = include_str!("p6_forced_war_g3b_data/cases.json");

fn json_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => x.as_f64() == y.as_f64(),
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| json_eq(p, q))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|w| json_eq(v, w)))
        }
        _ => a == b,
    }
}

fn opt_f64(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(v.as_f64().expect("liczba lub null"))
    }
}

fn i64_of(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}

fn sign(o: Ordering) -> i64 {
    match o {
        Ordering::Less => -1,
        Ordering::Equal => 0,
        Ordering::Greater => 1,
    }
}

fn search_input(v: &Value) -> SearchInput {
    SearchInput {
        difficulty_level: i64_of(&v["diff"]),
        pending: v["pending"].as_bool().unwrap(),
        cycle: v["cycle"].as_bool().unwrap(),
        has_active_as_attacker: v["hasActive"].as_bool().unwrap(),
        already_at_war_any_role: v["alreadyAt"].as_bool().unwrap(),
        rest_until: opt_f64(&v["rest"]),
        current_turn: v["turn"].as_f64().unwrap(),
        era_enter_turn: opt_f64(&v["enter"]),
        epoch: i64_of(&v["epoch"]),
        era_flag_enabled: v["flag"].as_bool().unwrap(),
    }
}

fn pairs(v: &Value) -> Vec<ActivePair> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|p| ActivePair {
            attacker_id: i64_of(&p["a"]),
            target_id: i64_of(&p["b"]),
            at_war: p["war"].as_bool().unwrap(),
        })
        .collect()
}

fn rest_map(v: &Value) -> std::collections::BTreeMap<i64, f64> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|row| (i64_of(&row[0]), row[1].as_f64().unwrap()))
        .collect()
}

fn rest_json(m: &std::collections::BTreeMap<i64, f64>) -> Value {
    Value::Array(m.iter().map(|(k, v)| json!([k, v])).collect())
}

#[test]
fn g3b_search_decisions_match_web() {
    let doc: Value = serde_json::from_str(G3B).expect("cases.json");
    let mut n = 0;
    for c in doc["cases"].as_array().unwrap() {
        if c["kind"] != "search" {
            continue;
        }
        n += 1;
        let i = search_input(&c["input"]);
        let got = match c["era"].as_str().unwrap() {
            "bronze" => should_search_bronze(&i),
            "stone" => should_search_stone(&i),
            "iron" => should_search_iron(&i),
            other => panic!("nieznana epoka {other}"),
        };
        assert_eq!(
            got,
            c["out"].as_bool().unwrap(),
            "search {} {:?}",
            c["era"],
            c["input"]
        );
    }
    assert!(n >= 200, "za malo wektorow search: {n}");
}

#[test]
fn g3b_sweep_matches_web() {
    let doc: Value = serde_json::from_str(G3B).expect("cases.json");
    let mut n = 0;
    for c in doc["cases"].as_array().unwrap() {
        if c["kind"] != "sweep" {
            continue;
        }
        n += 1;
        let inp = &c["input"];
        let turn = inp["turn"].as_f64().unwrap();
        let mut regs = ForcedWarRegistries {
            stone: pairs(&inp["active"]["stone"]),
            iron: pairs(&inp["active"]["iron"]),
            bronze: pairs(&inp["active"]["bronze"]),
            rest_stone: rest_map(&inp["rest"]["stone"]),
            rest_iron: rest_map(&inp["rest"]["iron"]),
            rest_bronze: rest_map(&inp["rest"]["bronze"]),
        };
        let out = sweep_stale_forced_war_entries(turn, &mut regs);
        let got = json!({
            "removed": out.removed.iter()
                .map(|(e, a, t)| json!({"era": e.tag(), "attacker": a, "target": t}))
                .collect::<Vec<_>>(),
            "wavesDeleted": out.waves_deleted,
            "restStone": rest_json(&regs.rest_stone),
            "restIron": rest_json(&regs.rest_iron),
            "restBronze": rest_json(&regs.rest_bronze),
            "remaining": {"stone": regs.stone.len(), "iron": regs.iron.len(), "bronze": regs.bronze.len()},
        });
        assert!(
            json_eq(&got, &c["out"]),
            "sweep rozni sie od weba: got {got} want {}",
            c["out"]
        );
    }
    assert!(n >= 100, "za malo wektorow sweep: {n}");
}

#[test]
fn g3b_id_order_matches_web_localecompare() {
    let doc: Value = serde_json::from_str(G3B).expect("cases.json");
    let pairs = doc["idcmp"].as_array().unwrap();
    assert!(pairs.len() >= 10_000, "za malo par idcmp: {}", pairs.len());
    for p in pairs {
        let a = p["a"].as_str().unwrap();
        let b = p["b"].as_str().unwrap();
        assert_eq!(
            sign(compare_ids_icu(a, b)),
            p["sign"].as_i64().unwrap(),
            "porzadek {a:?} vs {b:?}"
        );
    }
}

#[test]
fn g3b_constants_match_web_source() {
    assert_eq!(WOJNA_WYMUSZONA_ODPOCZYNEK_TUR_FOR_TEST, 20.0);
    assert_eq!(WOJNA_KAMIEN_START_FOR_TEST, 40.0);
}

const WOJNA_WYMUSZONA_ODPOCZYNEK_TUR_FOR_TEST: f64 =
    civ_engine::domain::war_forced_bronze::WOJNA_WYMUSZONA_ODPOCZYNEK_TUR;
const WOJNA_KAMIEN_START_FOR_TEST: f64 =
    civ_engine::domain::war_forced_stone::WOJNA_KAMIEN_WYMUSZONA_START_TURY;

// ZALOZENIA / ODSTEPSTWA od webu (poza realnym zapisem; patrz P6-FORCED-WAR-MODULES.md, sekcja 2c).
// Te testy DOKUMENTUJA zachowanie Rust dla danych zlego ksztaltu; web zachowuje je inaczej.

#[test]
fn g3b_restore_malformed_documented_divergence() {
    // Web: unitIds zachowuje element 5 (spread/kopia); Rust odrzuca nie-string.
    let saved = json!([["1-2", {"nextWaveId": 3, "waves": [{
        "id": "bronze-1", "targetCityId": "c1", "unitIds": [5, "u1"],
        "originHex": {"q": 0, "r": 0}, "rallyPoint": {"q": 1, "r": 0},
        "approachSector": 2, "createdTurn": "x"
    }], "history": []}]]);
    let restored = restore_forced_war_waves(&saved);
    let w = &restored[0].1.waves[0];
    assert_eq!(w.unit_ids, vec!["u1".to_string()]);
    // Web: createdTurn zachowuje surowa wartosc "x"; Rust: 0.
    assert_eq!(w.created_turn, 0.0);
}

#[test]
fn g3b_restore_realistic_shape_roundtrip() {
    // Ksztalt zgodny z web-owym planForcedWarWave (typowane pola, unitIds = id jednostek).
    let saved = json!([["1-2", {"nextWaveId": 4, "waves": [{
        "id": "bronze-3", "targetCityId": "city2", "unitIds": ["u1", "u10"],
        "originHex": {"q": -1, "r": 2}, "rallyPoint": {"q": 0, "r": 1},
        "approachSector": 4, "createdTurn": 57
    }], "history": [{
        "targetCityId": "city0", "originHex": {"q": 3, "r": -2}, "rallyPoint": {"q": 2, "r": -1},
        "approachSector": 1, "createdTurn": 40
    }]}]]);
    let restored = restore_forced_war_waves(&saved);
    let (key, st) = &restored[0];
    assert_eq!(key, "1-2");
    assert_eq!(st.next_wave_id, 4.0);
    assert_eq!(
        st.waves[0].unit_ids,
        vec!["u1".to_string(), "u10".to_string()]
    );
    assert_eq!(st.waves[0].created_turn, 57.0);
    assert_eq!(st.history[0].target_city_id, "city0");
}
