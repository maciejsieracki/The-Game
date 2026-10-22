//! Wspolne pomocniki testow P6.M16 (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1/gen-m16-vectors.mjs`,
//! pin edb8fb56). Konwencja JSON: `null` = pole nieobecne/undefined albo null.
#![allow(dead_code)]

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::improvement_build::{
    terrain_from_web_value, BuildHex, BuildMap, ImprovementBuildState, PlacedLayers,
};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::CityNode;
use civ_engine::domain::territory::TerritoryNode;
use serde_json::Value;

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_m16_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

pub fn num(v: &Value) -> f64 {
    v.as_f64().unwrap_or_else(|| panic!("to nie liczba: {v}"))
}

pub fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

/// Rownosc BITOWA f64.
pub fn assert_bits(label: &str, got: f64, want: f64) {
    assert!(
        got.to_bits() == want.to_bits(),
        "{label}: rust={got:?} web={want:?}"
    );
}

pub fn int(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("int")).expect("i32")
}

pub fn s(v: &Value) -> &str {
    v.as_str().unwrap_or_else(|| panic!("to nie string: {v}"))
}

pub fn opt_s(v: &Value) -> Option<String> {
    v.as_str().map(str::to_owned)
}

pub fn strs(v: &Value) -> Vec<String> {
    v.as_array()
        .unwrap_or_else(|| panic!("to nie tablica: {v}"))
        .iter()
        .map(|x| s(x).to_owned())
        .collect()
}

pub fn opt_strs(v: &Value) -> Option<Vec<String>> {
    if v.is_null() {
        None
    } else {
        Some(strs(v))
    }
}

pub fn terrain(v: &Value) -> TerrainType {
    terrain_from_web_value(s(v)).unwrap_or_else(|| panic!("nieznany teren {v}"))
}

pub fn overlay(v: &Value) -> Overlay {
    Overlay::from_web_value(s(v)).unwrap_or_else(|| panic!("nieznana nakladka {v}"))
}

pub fn opt_bool(v: &Value) -> Option<bool> {
    v.as_bool()
}

pub fn node(v: &Value) -> CityNode {
    CityNode {
        q: int(&v["q"]),
        r: int(&v["r"]),
        is_outpost: opt_bool(&v["isOutpost"]),
        is_fort: opt_bool(&v["isFort"]),
        pop: num(&v["pop"]),
        level: 1.0,
        civ: None,
    }
}

pub fn build_hex(v: &Value) -> BuildHex {
    BuildHex {
        q: int(&v["q"]),
        r: int(&v["r"]),
        terrain: terrain(&v["teren"]),
        overlay: overlay(&v["nakladka"]),
        ulepszenie: opt_s(&v["ulepszenie"]),
        ulepszenia: opt_strs(&v["ulepszenia"]),
        zloze: opt_s(&v["zloze"]),
        river_present: v["rzeka"].as_bool().expect("rzeka"),
    }
}

/// Heks "ad hoc" z wektorow regul (`teren`, `nakladka`, `zloze`).
pub fn deposit_hex(v: &Value) -> BuildHex {
    let mut hex = BuildHex::new(0, 0, terrain(&v["teren"]), overlay(&v["nakladka"]));
    hex.zloze = opt_s(&v["zloze"]);
    hex
}

pub fn state(v: &Value) -> ImprovementBuildState {
    let hexes: Vec<BuildHex> = arr(v, "hexes").iter().map(build_hex).collect();
    let paths: Vec<Vec<(i32, i32)>> = arr(v, "riverPaths")
        .iter()
        .map(|p| {
            p.as_array()
                .unwrap()
                .iter()
                .map(|pt| (int(&pt[0]), int(&pt[1])))
                .collect()
        })
        .collect();
    let city_nodes: Vec<CityNode> = arr(v, "cityNodes").iter().map(node).collect();
    let mut st = ImprovementBuildState::new(BuildMap::new(hexes, paths), city_nodes);
    st.placed_keys = opt_strs(&v["placedKeys"]);
    st.road_keys = opt_strs(&v["roadKeys"]);
    st.player_civ_archetype = opt_s(&v["playerCivArchetype"]);
    st.player_era = opt_num(&v["playerEra"]);
    st.territory_nodes = v["territoryNodes"].as_array().map(|list| {
        list.iter()
            .map(|n| TerritoryNode::new(node(n), n["ownerId"].as_i64().unwrap()))
            .collect()
    });
    st.player_owner_id_num = v["playerOwnerIdNum"].as_i64();
    st.placed_improvements = v["placedImprovements"].as_object().map(|o| {
        o.iter()
            .map(|(k, val)| {
                let layers = match val {
                    Value::String(x) => PlacedLayers::One(x.clone()),
                    Value::Array(_) => PlacedLayers::Many(strs(val)),
                    other => panic!("zla warstwa {other}"),
                };
                (k.clone(), layers)
            })
            .collect::<BTreeMap<_, _>>()
    });
    st.researched_techs =
        opt_strs(&v["researchedTechs"]).map(|x| x.into_iter().collect::<BTreeSet<_>>());
    st.clearing_hex_keys =
        opt_strs(&v["clearingHexKeys"]).map(|x| x.into_iter().collect::<BTreeSet<_>>());
    st.pending_undo_keys = opt_strs(&v["pendingUndoKeys"]);
    st.trade_route_kon_unlocked = opt_bool(&v["tradeRouteKonUnlocked"]);
    st.horse_stock_available = opt_num(&v["horseStockAvailable"]);
    st.own_unit_hex_keys = opt_strs(&v["ownUnitHexKeys"]);
    st
}
