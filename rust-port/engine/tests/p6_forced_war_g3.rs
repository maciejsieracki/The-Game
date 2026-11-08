//! P6-FORCED-WAR-MODULES-Q1 (runda 3, partia G3a): zgodnosc fal wojny wymuszonej
//! (`forced-war-waves.ts`, pin `origin/main`) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_forced_war_g3_data/cases.json` (generator `gen_cases_g3.mjs`, Node 22, prawdziwe
//! funkcje weba; stub `isCivilianUnit` = pole `isCivilian`). Liczby porownywane numerycznie (f64).

use std::collections::HashSet;

use civ_engine::domain::war_forced_waves::*;
use serde_json::{json, Value};

const G3: &str = include_str!("p6_forced_war_g3_data/cases.json");

/// Porownanie JSON z tolerancja typu liczbowego (JS nie rozroznia 5 i 5.0).
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

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn text(v: &Value) -> String {
    v.as_str().expect("tekst").to_string()
}

fn hex(v: &Value) -> WaveHex {
    WaveHex {
        q: num(&v["q"]),
        r: num(&v["r"]),
    }
}

fn hex_json(h: WaveHex) -> Value {
    json!({ "q": h.q, "r": h.r })
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("tablica").iter().map(text).collect()
}

fn unit(v: &Value) -> WaveUnit {
    WaveUnit {
        id: text(&v["id"]),
        owner_id: v["ownerId"].as_i64().expect("owner"),
        category: text(&v["category"]),
        q: num(&v["q"]),
        r: num(&v["r"]),
        ruch_left: num(&v["ruchLeft"]),
        is_civilian: v["isCivilian"].as_bool().expect("isCivilian"),
        in_garnizon: v["inGarnizon"].as_bool().expect("inGarnizon"),
        oblega_city_id: v["oblegaCityId"].as_str().map(str::to_string),
        embarked: v["embarked"].as_bool().expect("embarked"),
        sea_raider: v["seaRaider"].as_bool().expect("seaRaider"),
    }
}

fn city(v: &Value) -> WaveCity {
    WaveCity {
        id: text(&v["id"]),
        owner_id: v["ownerId"].as_i64().expect("owner"),
        q: num(&v["q"]),
        r: num(&v["r"]),
    }
}

fn wave(v: &Value) -> ForcedWarWave {
    ForcedWarWave {
        id: text(&v["id"]),
        target_city_id: text(&v["targetCityId"]),
        unit_ids: strings(&v["unitIds"]),
        origin_hex: hex(&v["originHex"]),
        rally_point: hex(&v["rallyPoint"]),
        approach_sector: num(&v["approachSector"]),
        created_turn: num(&v["createdTurn"]),
    }
}

fn history(v: &Value) -> ForcedWarWaveHistory {
    ForcedWarWaveHistory {
        target_city_id: text(&v["targetCityId"]),
        origin_hex: hex(&v["originHex"]),
        rally_point: hex(&v["rallyPoint"]),
        approach_sector: num(&v["approachSector"]),
        created_turn: num(&v["createdTurn"]),
    }
}

fn state(v: &Value) -> ForcedWarWaveState {
    ForcedWarWaveState {
        next_wave_id: num(&v["nextWaveId"]),
        waves: v["waves"].as_array().unwrap().iter().map(wave).collect(),
        history: v["history"]
            .as_array()
            .unwrap()
            .iter()
            .map(history)
            .collect(),
    }
}

fn wave_json(w: &ForcedWarWave) -> Value {
    json!({
        "id": w.id,
        "targetCityId": w.target_city_id,
        "unitIds": w.unit_ids,
        "originHex": hex_json(w.origin_hex),
        "rallyPoint": hex_json(w.rally_point),
        "approachSector": w.approach_sector,
        "createdTurn": w.created_turn,
    })
}

fn history_json(h: &ForcedWarWaveHistory) -> Value {
    json!({
        "targetCityId": h.target_city_id,
        "originHex": hex_json(h.origin_hex),
        "rallyPoint": hex_json(h.rally_point),
        "approachSector": h.approach_sector,
        "createdTurn": h.created_turn,
    })
}

fn state_json(s: &ForcedWarWaveState) -> Value {
    json!({
        "nextWaveId": s.next_wave_id,
        "waves": s.waves.iter().map(wave_json).collect::<Vec<_>>(),
        "history": s.history.iter().map(history_json).collect::<Vec<_>>(),
    })
}

fn entries_json(entries: &[(String, ForcedWarWaveState)]) -> Value {
    Value::Array(
        entries
            .iter()
            .map(|(k, s)| json!([k, state_json(s)]))
            .collect(),
    )
}

fn run_plan(i: &Value) -> Value {
    let units: Vec<WaveUnit> = i["units"].as_array().unwrap().iter().map(unit).collect();
    let cities: Vec<WaveCity> = i["targetCities"]
        .as_array()
        .unwrap()
        .iter()
        .map(city)
        .collect();
    let active: Vec<ForcedWarWave> = i["activeWaves"]
        .as_array()
        .unwrap()
        .iter()
        .map(wave)
        .collect();
    let hist: Vec<ForcedWarWaveHistory> = i["waveHistory"]
        .as_array()
        .unwrap()
        .iter()
        .map(history)
        .collect();
    let excluded: HashSet<String> = strings(&i["excluded"]).into_iter().collect();
    let plan = plan_forced_war_wave(
        &units,
        &cities,
        &active,
        &excluded,
        &hex_distance,
        num(&i["createdTurn"]),
        &hist,
    );
    match plan {
        None => Value::Null,
        Some(p) => json!({
            "targetCityId": p.target_city_id,
            "unitIds": p.unit_ids,
            "moveUnitIds": p.move_unit_ids,
            "deferredUnitIds": p.deferred_unit_ids,
            "originHex": hex_json(p.origin_hex),
            "rallyPoint": hex_json(p.rally_point),
            "approachSector": p.approach_sector,
            "createdTurn": p.created_turn,
        }),
    }
}

fn run_prune(i: &Value) -> Value {
    let st = if i["state"].is_null() {
        None
    } else {
        Some(state(&i["state"]))
    };
    let units: Vec<WaveUnit> = i["units"].as_array().unwrap().iter().map(unit).collect();
    let cities: Vec<WaveCity> = i["cities"].as_array().unwrap().iter().map(city).collect();
    match prune_forced_war_waves(
        st.as_ref(),
        i["attackerId"].as_i64().unwrap(),
        i["targetOwnerId"].as_i64().unwrap(),
        &units,
        &cities,
    ) {
        None => Value::Null,
        Some(s) => state_json(&s),
    }
}

fn run(c: &Value) -> Value {
    let i = &c["in"];
    match c["fn"].as_str().unwrap() {
        "planForcedWarWave" => run_plan(i),
        "pruneForcedWarWaves" => run_prune(i),
        "approachSectorForHex" => json!(approach_sector_for_hex(
            hex(&i["target"]),
            hex(&i["origin"])
        )),
        "hexDistanceForForcedWar" => json!(hex_distance_for_forced_war(hex(&i["a"]), hex(&i["b"]))),
        "serializeForcedWarWaves" => {
            let entries: Vec<(String, ForcedWarWaveState)> = i["entries"]
                .as_array()
                .unwrap()
                .iter()
                .map(|e| (text(&e[0]), state(&e[1])))
                .collect();
            entries_json(&serialize_forced_war_waves(&entries))
        }
        "restoreForcedWarWaves" => entries_json(&restore_forced_war_waves(&i["saved"])),
        "emptyForcedWarWaveState" => state_json(&empty_forced_war_wave_state()),
        "constant" => match i["name"].as_str().unwrap() {
            "ARMY_CONCENTRATION_MIN_UNITS" => json!(ARMY_CONCENTRATION_MIN_UNITS as f64),
            "ARMY_CONCENTRATION_RADIUS" => json!(ARMY_CONCENTRATION_RADIUS),
            other => panic!("nieznana stala {other}"),
        },
        other => panic!("nieznana funkcja {other}"),
    }
}

#[test]
fn g3_waves_match_web_vectors() {
    let cases: Vec<Value> = serde_json::from_str(G3).expect("cases.json");
    let mut failures = Vec::new();
    let mut counts = std::collections::BTreeMap::<String, usize>::new();
    for (idx, c) in cases.iter().enumerate() {
        *counts
            .entry(c["fn"].as_str().unwrap().to_string())
            .or_default() += 1;
        let got = run(c);
        if !json_eq(&got, &c["out"]) {
            failures.push(format!("#{idx} {}: got {got} want {}", c["fn"], c["out"]));
        }
    }
    assert!(
        failures.is_empty(),
        "roznice vs web ({}):\n{}",
        failures.len(),
        failures
            .iter()
            .take(10)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
    assert!(
        counts["planForcedWarWave"] >= 200,
        "pokrycie plan: {counts:?}"
    );
    assert!(
        counts["pruneForcedWarWaves"] >= 100,
        "pokrycie prune: {counts:?}"
    );
    assert!(
        counts["restoreForcedWarWaves"] >= 40,
        "pokrycie restore: {counts:?}"
    );
}

#[test]
fn g3_plan_nonempty_vectors_present() {
    let cases: Vec<Value> = serde_json::from_str(G3).expect("cases.json");
    let nonempty = cases
        .iter()
        .filter(|c| c["fn"] == "planForcedWarWave" && !c["out"].is_null())
        .count();
    assert!(nonempty >= 40, "za malo planow niepustych: {nonempty}");
}
