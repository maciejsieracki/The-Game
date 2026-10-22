//! Wspolne pomocniki testow P6.M14 (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1/gen-m14-vectors.mjs`).
#![allow(dead_code)]

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::terrain::TerrainType;
use civ_engine::domain::territory::{CityNode, TerritoryNode, WorkCity};
use serde_json::Value;

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_m14_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba z wektora: liczba JSON albo string "NaN" / "Infinity" / "-Infinity" / "-0".
pub fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba specjalna {other}"),
        },
        other => panic!("to nie liczba: {other}"),
    }
}

pub fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

/// Rownosc BITOWA f64 (NaN == NaN niezaleznie od ladunku).
pub fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

pub fn int(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("int")).expect("i32")
}

pub fn opt_bool(v: &Value) -> Option<bool> {
    v.as_bool()
}

pub fn city_node(v: &Value) -> CityNode {
    CityNode {
        q: int(&v["q"]),
        r: int(&v["r"]),
        is_outpost: opt_bool(&v["isOutpost"]),
        is_fort: opt_bool(&v["isFort"]),
        pop: num(&v["pop"]),
        level: num(&v["level"]),
        civ: v["civ"].as_str().map(str::to_string),
    }
}

pub fn city_nodes(v: &Value) -> Vec<CityNode> {
    v.as_array().expect("nodes").iter().map(city_node).collect()
}

pub fn territory_node(v: &Value) -> TerritoryNode {
    TerritoryNode::new(city_node(v), v["ownerId"].as_i64().expect("ownerId"))
}

pub fn territory_nodes(v: &Value) -> Vec<TerritoryNode> {
    v.as_array()
        .expect("nodes")
        .iter()
        .map(territory_node)
        .collect()
}

pub fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("strings")
        .iter()
        .map(|s| s.as_str().expect("str").to_string())
        .collect()
}

pub fn string_set(v: &Value) -> BTreeSet<String> {
    strings(v).into_iter().collect()
}

pub fn reczne(v: &Value) -> Option<BTreeMap<String, f64>> {
    v.as_object()
        .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
}

pub fn work_city(v: &Value) -> WorkCity {
    WorkCity {
        id: v["id"].as_str().expect("id").to_string(),
        owner_id: v["ownerId"].as_i64().expect("ownerId"),
        q: int(&v["q"]),
        r: int(&v["r"]),
        population: num(&v["population"]),
        okolica_reczne: reczne(&v["okolicaReczne"]),
    }
}

pub fn work_cities(v: &Value) -> Vec<WorkCity> {
    v.as_array()
        .expect("cities")
        .iter()
        .map(work_city)
        .collect()
}

pub fn lost_map(v: &Value) -> Option<BTreeMap<String, BTreeSet<String>>> {
    v.as_object()
        .map(|o| o.iter().map(|(k, x)| (k.clone(), string_set(x))).collect())
}

pub fn terrain(s: &str) -> TerrainType {
    serde_json::from_value(Value::String(s.to_string()))
        .unwrap_or_else(|e| panic!("teren {s}: {e}"))
}

pub fn coords(v: &Value) -> Vec<HexCoord> {
    v.as_array()
        .expect("coords")
        .iter()
        .map(|p| HexCoord::new(int(&p["q"]), int(&p["r"])))
        .collect()
}
