//! P6.M06A9 (partia 1, R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1) - testy portu
//! `fillPangeaAnnularSeaCorridors` (gen-helpers.ts :4595), `rebalanceLandSeaRatio` (:3791) i
//! `rebalanceLandFractionPangea` (:3667) wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`,
//! bez instrumentacji). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1/gen-m06a9-vectors.mjs`.
//! Wektory: `tests/p6_m06a9_vectors/{fill,ratio,pangea}-vectors.json`.

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    fill_pangea_annular_sea_corridors, rebalance_land_fraction_pangea, rebalance_land_sea_ratio,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const FILL_VECTORS: &str = include_str!("p6_m06a9_vectors/fill-vectors.json");
const RATIO_VECTORS: &str = include_str!("p6_m06a9_vectors/ratio-vectors.json");
const PANGEA_VECTORS: &str = include_str!("p6_m06a9_vectors/pangea-vectors.json");

/// Parsuje plik wektorow raz (osobny cache na kazdy plik).
fn parse_once(cell: &'static OnceLock<Value>, src: &'static str) -> &'static Value {
    cell.get_or_init(|| serde_json::from_str(src).expect("wektory parsuja"))
}

fn cases(src: &'static str) -> &'static Vec<Value> {
    static FILL: OnceLock<Value> = OnceLock::new();
    static RATIO: OnceLock<Value> = OnceLock::new();
    static PANGEA: OnceLock<Value> = OnceLock::new();
    let cell = if src == FILL_VECTORS {
        &FILL
    } else if src == RATIO_VECTORS {
        &RATIO
    } else {
        &PANGEA
    };
    parse_once(cell, src)["cases"]
        .as_array()
        .expect("tablica cases")
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

/// Buduje HexRecord w kolejnosci wstawiania z wektora (`order` = [[klucz, nazwa], ...]).
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

/// Stan hexow w kolejnosci wstawiania jako [klucz, nazwa] (jak `hexesToOrder` w generatorze).
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

fn expected_state(c: &Value) -> Vec<Value> {
    c["after"].as_array().expect("after").clone()
}

fn family_count(src: &'static str, fam: &str) -> usize {
    cases(src).iter().filter(|c| c["family"] == fam).count()
}

#[test]
fn vector_files_have_expected_families() {
    assert_eq!(cases(FILL_VECTORS).len(), 120, "liczba przypadkow fill");
    assert_eq!(family_count(FILL_VECTORS, "losowe"), 90);
    assert_eq!(family_count(FILL_VECTORS, "granica-pas"), 24);
    assert_eq!(family_count(FILL_VECTORS, "prog-ladu"), 3);
    assert_eq!(family_count(FILL_VECTORS, "brzeg"), 3);

    assert_eq!(cases(RATIO_VECTORS).len(), 101, "liczba przypadkow ratio");
    assert_eq!(family_count(RATIO_VECTORS, "losowe"), 90);
    assert_eq!(family_count(RATIO_VECTORS, "prog-udzialu"), 9);

    assert_eq!(cases(PANGEA_VECTORS).len(), 60, "liczba przypadkow pangea");
}

#[test]
fn fill_pangea_annular_sea_corridors_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases(FILL_VECTORS) {
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let max_w = c["maxW"].as_f64();
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let converted = fill_pangea_annular_sea_corridors(&mut hexes, w, h, max_w);
        let exp_converted = c["converted"].as_u64().expect("converted") as usize;
        let got_state = state_of(&hexes);
        let exp_state = expected_state(c);
        if (converted != exp_converted || got_state != exp_state) && mismatches.len() < 5 {
            mismatches.push(format!(
                "{}: converted web={exp_converted} rust={converted}, stan zgodny={}",
                c["id"],
                got_state == exp_state
            ));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci fill: {mismatches:#?}");
}

#[test]
fn rebalance_land_sea_ratio_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases(RATIO_VECTORS) {
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let target = c["target"].as_f64().expect("target");
        let adjusted = rebalance_land_sea_ratio(&mut hexes, w, h, target);
        let exp_adjusted = c["adjusted"].as_u64().expect("adjusted") as usize;
        let got_state = state_of(&hexes);
        let exp_state = expected_state(c);
        if (adjusted != exp_adjusted || got_state != exp_state) && mismatches.len() < 5 {
            mismatches.push(format!(
                "{}: adjusted web={exp_adjusted} rust={adjusted}, stan zgodny={}",
                c["id"],
                got_state == exp_state
            ));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci ratio: {mismatches:#?}");
}

#[test]
fn rebalance_land_fraction_pangea_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases(PANGEA_VECTORS) {
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let scores: HashMap<String, f64> = c["scores"]
            .as_array()
            .expect("scores")
            .iter()
            .map(|p| {
                (
                    p[0].as_str().expect("klucz").to_string(),
                    p[1].as_f64().expect("wynik"),
                )
            })
            .collect();
        let perm_vec: Vec<u8> = c["perm"]
            .as_array()
            .expect("perm")
            .iter()
            .map(|v| v.as_u64().expect("bajt") as u8)
            .collect();
        let mut perm = [0u8; 256];
        perm.copy_from_slice(&perm_vec);
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let target = c["target"].as_f64().expect("target");
        rebalance_land_fraction_pangea(&mut hexes, &scores, target, w, h, &perm);
        let got_state = state_of(&hexes);
        let exp_state = expected_state(c);
        if got_state != exp_state && mismatches.len() < 5 {
            let first = got_state
                .iter()
                .zip(exp_state.iter())
                .position(|(a, b)| a != b);
            mismatches.push(format!(
                "{}: pierwsza rozbieznosc na indeksie {first:?}",
                c["id"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci pangea: {mismatches:#?}"
    );
}
