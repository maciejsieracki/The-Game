//! P6.M07A partia 2 - lekcja FC (b): cap `estimateLandCentroidFromSeed` wzgledem WEBA dla
//! capow 1..=40 oraz 6000 (kazdy start: 41 wartosci capa, wiec N-1/N/N+1 sa w jednym przypadku).
//! Wektory: `p6_m07a_vectors/web-rivers-a-cap.json` (generator `gen-m07a-cap.mjs`, pin `edb8fb56`).
//! Mapy: te same co w `web-rivers-a-walk.json` (indeks `map`).

#[path = "p6_m07a_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::mapgen::rivers_a::estimate_land_centroid_from_seed;
use common::build_map;
use serde_json::{json, Value};

const WALK: &str = include_str!("p6_m07a_vectors/web-rivers-a-walk.json");
const CAP: &str = include_str!("p6_m07a_vectors/web-rivers-a-cap.json");

#[test]
fn cap_sweep_matches_web() {
    let walk: Value = serde_json::from_str(WALK).expect("wektory walk parsuja sie");
    let cases: Vec<Value> = serde_json::from_str(CAP).expect("wektory cap parsuja sie");
    assert_eq!(cases.len(), 8856, "liczba przypadkow capa");
    let mut groups: BTreeMap<(u64, i64, i64, bool), BTreeSet<String>> = BTreeMap::new();
    for c in &cases {
        let idx = c["map"].as_u64().expect("map") as usize;
        let hexes = build_map(&walk, idx);
        let mq = c["mq"].as_i64().expect("mq");
        let mr = c["mr"].as_i64().expect("mr");
        let allow = c["allowRelief"].as_bool().expect("allowRelief");
        let cap = c["cap"].as_u64().expect("cap") as usize;
        let got = match estimate_land_centroid_from_seed(&hexes, mq, mr, allow, cap) {
            None => Value::Null,
            Some((a, b)) => json!([a.to_string(), b.to_string()]),
        };
        assert_eq!(got, c["ret"], "cap {c}");
        groups
            .entry((idx as u64, mq, mr, allow))
            .or_default()
            .insert(got.to_string());
    }
    // Lekcja FC (b): na wiekszosci startow cap rozroznia wynik (dowod, ze sweep ma moc).
    let discriminating = groups.values().filter(|g| g.len() > 1).count();
    assert!(
        discriminating * 2 > groups.len(),
        "cap nie rozroznia: {discriminating}/{}",
        groups.len()
    );
}
