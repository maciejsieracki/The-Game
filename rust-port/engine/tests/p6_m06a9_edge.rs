//! P6.M06A9 (runda 2, R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1) - wektory BRZEGOWE
//! `fillPangeaAnnularSeaCorridors` (progi `distSelf < 0.01`, gen-helpers.ts :4496) i
//! `rebalanceLandSeaRatio` (limit warstw `ceil(sqrt(w*h))`, gen-helpers.ts :3791 ff).
//! Wektory z URUCHOMIONEGO weba (pin `edb8fb56`): `tests/p6_m06a9_vectors/edge-vectors.json`.
//! Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1/gen-m06a9-edge-vectors.mjs`.
//! Zabijane mutanty: M17 (`dist_self < eps` -> `<=`, przypadek prog-eps n=100) oraz
//! M21 (`max_layers - 1`, przypadek warstwy 0.2/0.3/0.5).

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    fill_pangea_annular_sea_corridors, rebalance_land_sea_ratio,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const EDGE_VECTORS: &str = include_str!("p6_m06a9_vectors/edge-vectors.json");

fn cases() -> Vec<Value> {
    let v: Value = serde_json::from_str(EDGE_VECTORS).expect("wektory brzegowe parsuja");
    v["cases"].as_array().expect("tablica cases").clone()
}

fn family_count(fam: &str) -> usize {
    cases().iter().filter(|c| c["family"] == fam).count()
}

fn terrain_of(name: &str) -> Terrain {
    serde_json::from_value(Value::String(name.to_string())).expect("nazwa TerenBazowy")
}

fn terrain_name(t: Terrain) -> String {
    serde_json::to_value(t)
        .expect("serializacja Terrain")
        .as_str()
        .expect("nazwa")
        .to_string()
}

fn build_hexes(order: &[Value]) -> HexRecord {
    let mut hexes = HexRecord::new();
    for pair in order {
        let key = pair[0].as_str().expect("klucz").to_string();
        let name = pair[1].as_str().expect("nazwa");
        let mut parts = key.split(',');
        let q: i64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
        let r: i64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
        hexes.insert(key, TerrainHex::new(q, r, terrain_of(name)));
    }
    hexes
}

fn state_of(hexes: &HexRecord) -> Vec<Value> {
    hexes
        .iter()
        .map(|(k, h)| {
            Value::Array(vec![
                Value::String(k.clone()),
                Value::String(terrain_name(h.terrain)),
            ])
        })
        .collect()
}

#[test]
fn edge_vector_file_has_expected_families() {
    assert_eq!(cases().len(), 9, "liczba przypadkow brzegowych");
    assert_eq!(family_count("prog-eps"), 5);
    assert_eq!(family_count("warstwy"), 4);
}

#[test]
fn fill_dist_epsilon_boundary_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases().iter().filter(|c| c["family"] == "prog-eps") {
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let max_w = c["maxW"].as_f64();
        let converted = fill_pangea_annular_sea_corridors(&mut hexes, w, h, max_w);
        let exp_converted = c["converted"].as_u64().expect("converted") as usize;
        let got_state = state_of(&hexes);
        let exp_state = c["after"].as_array().expect("after").clone();
        if (converted != exp_converted || got_state != exp_state) && mismatches.len() < 5 {
            mismatches.push(format!(
                "{}: converted web={exp_converted} rust={converted}, stan zgodny={}",
                c["id"],
                got_state == exp_state
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci prog-eps: {mismatches:#?}"
    );
}

#[test]
fn rebalance_land_sea_ratio_layer_limit_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases().iter().filter(|c| c["family"] == "warstwy") {
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let target = c["target"].as_f64().expect("target");
        let adjusted = rebalance_land_sea_ratio(&mut hexes, w, h, target);
        let exp_adjusted = c["adjusted"].as_u64().expect("adjusted") as usize;
        let got_state = state_of(&hexes);
        let exp_state = c["after"].as_array().expect("after").clone();
        if (adjusted != exp_adjusted || got_state != exp_state) && mismatches.len() < 5 {
            mismatches.push(format!(
                "{}: adjusted web={exp_adjusted} rust={adjusted}, stan zgodny={}",
                c["id"],
                got_state == exp_state
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci warstwy: {mismatches:#?}"
    );
}
