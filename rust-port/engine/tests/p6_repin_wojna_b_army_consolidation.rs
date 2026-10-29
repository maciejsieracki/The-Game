//! REPIN-WOJNA-NOWE-B - `gra/src/game/army-consolidation.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_b_vectors/army-consolidation.json`).

use civ_engine::domain::army_consolidation::{
    army_consolidation_home_group_size, army_consolidation_max_per_hex,
    army_consolidation_rally_search_hex, assign_rally_targets, build_rally_candidates,
    is_army_consolidation_enabled, pick_rally_city, split_into_war_armies, war_army_count,
    ConsolidationUnit, RallyCityRef, RallyHexRef,
};
use serde_json::Value;
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_repin_wojna_b_vectors/army-consolidation.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("army-consolidation.json parse")
}

fn city(v: &Value) -> RallyCityRef {
    RallyCityRef {
        id: v["id"].as_str().expect("id").to_owned(),
        q: v["q"].as_i64().expect("q"),
        r: v["r"].as_i64().expect("r"),
    }
}

fn hex(v: &Value) -> RallyHexRef {
    RallyHexRef {
        q: v["q"].as_i64().expect("q"),
        r: v["r"].as_i64().expect("r"),
    }
}

fn unit(v: &Value) -> ConsolidationUnit {
    ConsolidationUnit {
        id: v["id"].as_str().expect("id").to_owned(),
        q: v["q"].as_i64().expect("q"),
        r: v["r"].as_i64().expect("r"),
        ruch_left: v["ruchLeft"].as_i64().expect("ruchLeft"),
    }
}

#[test]
fn constants_and_flag_match_web() {
    let v = root();
    assert_eq!(v["constants"]["enabledDefault"].as_bool(), Some(true));
    assert_eq!(
        is_army_consolidation_enabled(None),
        v["constants"]["enabledDefault"].as_bool().unwrap()
    );
    assert_eq!(
        army_consolidation_max_per_hex(),
        v["constants"]["maxPerHex"]
            .as_str()
            .unwrap()
            .parse::<i64>()
            .unwrap()
    );
    assert_eq!(
        army_consolidation_home_group_size(),
        v["constants"]["homeGroupSize"]
            .as_str()
            .unwrap()
            .parse::<i64>()
            .unwrap()
    );
    assert_eq!(
        army_consolidation_rally_search_hex(),
        v["constants"]["rallySearchHex"]
            .as_str()
            .unwrap()
            .parse::<i64>()
            .unwrap()
    );
    let cases = v["flagCases"].as_array().expect("flagCases");
    assert_eq!(cases.len(), 3);
    for (i, case) in cases.iter().enumerate() {
        let ov = case["override"].as_bool();
        assert_eq!(
            is_army_consolidation_enabled(ov),
            case["enabled"].as_bool().expect("enabled"),
            "przypadek {i}"
        );
    }
}

#[test]
fn pick_rally_city_matches_web() {
    let v = root();
    let cases = v["pickCases"].as_array().expect("pickCases");
    assert!(cases.len() >= 500);
    for (i, case) in cases.iter().enumerate() {
        let cities: Vec<RallyCityRef> = case["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(city)
            .collect();
        let capital = case["capital"].as_str();
        let got = pick_rally_city(&cities, capital).map(|c| c.id.clone());
        let want = case["out"].as_str().map(str::to_owned);
        assert_eq!(got, want, "przypadek {i}");
    }
}

#[test]
fn build_rally_candidates_matches_web() {
    let v = root();
    let default_radius = army_consolidation_rally_search_hex();
    let cases = v["candCases"].as_array().expect("candCases");
    assert!(cases.len() >= 500);
    for (i, case) in cases.iter().enumerate() {
        let cities: Vec<RallyCityRef> = case["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(city)
            .collect();
        let rally = city(&case["rally"]);
        let radius = case["radius"].as_i64().unwrap_or(default_radius);
        let got = build_rally_candidates(&cities, &rally, radius);
        let want: Vec<RallyHexRef> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(hex)
            .collect();
        assert_eq!(got, want, "przypadek {i}");
    }
}

#[test]
fn assign_rally_targets_matches_web() {
    let v = root();
    let cases = v["assignCases"].as_array().expect("assignCases");
    assert!(cases.len() >= 500);
    for (i, case) in cases.iter().enumerate() {
        let units: Vec<ConsolidationUnit> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(unit)
            .collect();
        let candidates: Vec<RallyHexRef> = case["candidates"]
            .as_array()
            .expect("candidates")
            .iter()
            .map(hex)
            .collect();
        let occupancy: HashMap<(i64, i64), i64> = case["occupancy"]
            .as_array()
            .expect("occupancy")
            .iter()
            .map(|o| {
                (
                    (o["q"].as_i64().unwrap(), o["r"].as_i64().unwrap()),
                    o["n"].as_i64().unwrap(),
                )
            })
            .collect();
        let max = case["maxPerHex"].as_i64().expect("maxPerHex");
        let got = assign_rally_targets(&units, &candidates, max, &occupancy);
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "przypadek {i}: liczba przydzialow");
        for (j, (g, w)) in got.iter().zip(want.iter()).enumerate() {
            assert_eq!(
                g.unit_id,
                w["unitId"].as_str().unwrap(),
                "przypadek {i}/{j}: unitId"
            );
            assert_eq!(
                g.target_q,
                w["targetQ"].as_i64().unwrap(),
                "przypadek {i}/{j}: targetQ"
            );
            assert_eq!(
                g.target_r,
                w["targetR"].as_i64().unwrap(),
                "przypadek {i}/{j}: targetR"
            );
            assert_eq!(
                g.at_rally,
                w["atRally"].as_bool().unwrap(),
                "przypadek {i}/{j}: atRally"
            );
        }
    }
}

#[test]
fn war_army_count_matches_web() {
    let v = root();
    let cases = v["warCases"].as_array().expect("warCases");
    assert!(cases.len() >= 200);
    for (i, case) in cases.iter().enumerate() {
        let ids: Vec<i64> = case["enemyOwnerIds"]
            .as_array()
            .expect("enemyOwnerIds")
            .iter()
            .map(|x| x.as_i64().expect("id"))
            .collect();
        assert_eq!(
            war_army_count(&ids) as i64,
            case["out"].as_i64().expect("out"),
            "przypadek {i}"
        );
    }
}

#[derive(Clone, Debug, PartialEq)]
struct Sized {
    id: String,
    strength: f64,
}

#[test]
fn split_into_war_armies_matches_web() {
    let v = root();
    let cases = v["splitCases"].as_array().expect("splitCases");
    assert!(cases.len() >= 500);
    for (i, case) in cases.iter().enumerate() {
        let units: Vec<Sized> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| Sized {
                id: u["id"].as_str().unwrap().to_owned(),
                strength: u["strength"].as_f64().unwrap(),
            })
            .collect();
        let army_count = case["armyCount"].as_i64().expect("armyCount");
        let got: Vec<Vec<String>> =
            split_into_war_armies(&units, army_count, |u| u.strength, |u| u.id.as_str())
                .into_iter()
                .map(|g| g.into_iter().map(|u| u.id).collect())
                .collect();
        let want: Vec<Vec<String>> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|g| {
                g.as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_str().unwrap().to_owned())
                    .collect()
            })
            .collect();
        assert_eq!(got, want, "przypadek {i}");
    }
}
