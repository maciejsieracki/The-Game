//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q5-Q1: wektory z pinu dla 4 skutkow przejecia (BRAK -> Ported):
//! `syncCityGarnizon` (+`garnizonCountForCity`), `noteCityCapture` (+`newChronicle`/`chronicleFor`),
//! `applyLiveSafeRationForCity` (czesc decyzyjna) oraz `playerEverOwnedCityByOwner.add`.
//!
//! Zrodlo wektorow: `tests/p6_siege_transfer_q5_vectors/vectors.json` wygenerowane przez
//! `tests/p6_siege_transfer_q5_gen.mjs` (wycina funkcje z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 i wykonuje je w node).
//! Wyjatek: `ever` - sprawdza semantyke JS `Set` (brak funkcji do wyciecia w pinie; patrz naglowek generatora).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer_q5::{
    apply_live_safe_ration_for_city, new_chronicle, note_city_capture,
    record_player_ever_owned_city, sync_city_garnizon, ChronicleMap, CivChronicle,
};
use serde_json::{json, Value};

const DATA: &str = include_str!("p6_siege_transfer_q5_vectors/vectors.json");

/// Normalizacja liczb: JSON `1` i `1.0` maja byc rowne (serde_json rozrozni PosInt/Float bez tego).
fn norm(v: &Value) -> Value {
    match v {
        Value::Number(n) => json!(n.as_f64().expect("liczba")),
        Value::Array(a) => Value::Array(a.iter().map(norm).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, v)| (k.clone(), norm(v))).collect()),
        other => other.clone(),
    }
}

fn unit(owner: i64, q: i64, r: i64, in_garnizon: bool) -> EnterUnit {
    EnterUnit {
        id: format!("u-{owner}-{q}-{r}-{in_garnizon}"),
        owner_id: owner,
        type_id: "t".into(),
        category: "wojsko".into(),
        q,
        r,
        oblega_city_id: None,
        is_general: false,
        embarked: false,
        in_garnizon,
        ufortyfikowany_w_polu: false,
    }
}

fn chronicle_json(c: &CivChronicle) -> Value {
    let mut o = serde_json::Map::new();
    if let Some(t) = c.since_turn {
        o.insert("sinceTurn".into(), json!(t));
    }
    if let Some(l) = c.legacy {
        o.insert("legacy".into(), json!(l));
    }
    o.insert("produced".into(), json!(c.produced));
    o.insert("lost".into(), json!(c.lost));
    o.insert("destroyed".into(), json!(c.destroyed));
    o.insert("battles".into(), json!(c.battles));
    o.insert("citiesTaken".into(), json!(c.cities_taken));
    o.insert("citiesLost".into(), json!(c.cities_lost));
    o.insert("maxCities".into(), json!(c.max_cities));
    o.insert("peakPop".into(), json!(c.peak_pop));
    o.insert("wonders".into(), json!(c.wonders));
    let vs: serde_json::Map<String, Value> =
        c.vs.iter()
            .map(|(k, v)| (k.to_string(), json!({"k": v.k, "l": v.l, "b": v.b})))
            .collect();
    o.insert("vs".into(), Value::Object(vs));
    Value::Object(o)
}

fn map_json(m: &ChronicleMap) -> Value {
    Value::Array(
        m.iter()
            .map(|(k, v)| json!([k, chronicle_json(v)]))
            .collect(),
    )
}

#[test]
fn garnizon_vectors_match_pin() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    let cases = root["garnizon"].as_array().expect("garnizon");
    assert!(cases.len() >= 7);
    for c in cases {
        let name = c["name"].as_str().unwrap();
        let city = &c["input"]["city"];
        let units: Vec<EnterUnit> = c["input"]["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| {
                unit(
                    u["ownerId"].as_i64().unwrap(),
                    u["q"].as_i64().unwrap(),
                    u["r"].as_i64().unwrap(),
                    u["inGarnizon"].as_bool().unwrap_or(false),
                )
            })
            .collect();
        let got = sync_city_garnizon(
            city["ownerId"].as_i64().unwrap(),
            city["q"].as_i64().unwrap(),
            city["r"].as_i64().unwrap(),
            &units,
        );
        assert_eq!(
            got,
            c["expected"]["garnizon"].as_f64().unwrap(),
            "garnizon: {name}"
        );
    }
}

#[test]
fn capture_chronicle_vectors_match_pin() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    let cases = root["capture"].as_array().expect("capture");
    assert!(cases.len() >= 7);
    for c in cases {
        let name = c["name"].as_str().unwrap();
        let mut map: ChronicleMap = BTreeMap::new();
        for e in c["input"]["initial"].as_array().unwrap() {
            let turn = e["turn"].as_f64();
            let legacy = e["legacy"].as_bool().unwrap_or(false);
            let mut ch = new_chronicle(turn, legacy);
            if let Some(v) = e["citiesTaken"].as_f64() {
                ch.cities_taken = v;
            }
            if let Some(v) = e["citiesLost"].as_f64() {
                ch.cities_lost = v;
            }
            map.insert(e["owner"].as_i64().unwrap(), ch);
        }
        let turn = c["input"]["turn"].as_f64();
        note_city_capture(
            &mut map,
            c["input"]["oldOwner"].as_i64().unwrap(),
            c["input"]["newOwner"].as_i64().unwrap(),
            turn,
        );
        assert_eq!(
            norm(&map_json(&map)),
            norm(&c["expected"]["map"]),
            "capture: {name}"
        );
    }
}

#[test]
fn ration_vectors_match_pin() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    let cases = root["ration"].as_array().expect("ration");
    assert!(cases.len() >= 7);
    for c in cases {
        let name = c["name"].as_str().unwrap();
        let owner = c["input"]["owner"].as_i64().unwrap();
        let auto_input = c["input"]["autoWyzywienie"].as_bool();
        // Mapowanie isCityAutoWyzywienieEnabled (empire-food.ts:390) dla ownera w [0]: `autoWyzywienie === true`;
        // dla innych wlascicieli funkcja zwraca true (ale applyLive i tak wraca na ownerId !== 0).
        let auto_rust = if owner == 0 {
            auto_input == Some(true)
        } else {
            true
        };
        let exp = &c["expected"];
        assert_eq!(
            auto_rust,
            exp["autoEnabled"].as_bool().unwrap(),
            "auto: {name}"
        );
        let level = c["input"]["level"].as_f64().unwrap();
        let max_safe = c["input"]["maxSafe"].as_f64().unwrap();
        let got = apply_live_safe_ration_for_city(owner, auto_rust, level, max_safe);
        let after = got.unwrap_or(level);
        assert_eq!(
            after,
            exp["poziomRacjiAfter"].as_f64().unwrap(),
            "poziom: {name}"
        );
        assert_eq!(
            got.is_some(),
            exp["dirty"].as_bool().unwrap(),
            "dirty: {name}"
        );
    }
}

#[test]
fn ever_owned_vectors_match_js_set_semantics() {
    let root: Value = serde_json::from_str(DATA).expect("json");
    let cases = root["ever"].as_array().expect("ever");
    assert!(cases.len() >= 3);
    for c in cases {
        let name = c["name"].as_str().unwrap();
        let mut set: BTreeSet<i64> = c["input"]["initial"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let owner = c["input"]["owner"].as_i64().unwrap();
        record_player_ever_owned_city(&mut set, owner);
        let sorted: Vec<i64> = set.iter().copied().collect();
        let exp_sorted: Vec<i64> = c["expected"]["sorted"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        assert_eq!(sorted, exp_sorted, "ever: {name}");
        assert_eq!(
            set.contains(&owner),
            c["expected"]["has"].as_bool().unwrap()
        );
    }
}
