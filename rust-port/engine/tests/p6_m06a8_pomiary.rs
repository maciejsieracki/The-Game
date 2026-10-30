//! P6.M06A8 Operator-pomiary r1 (R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1): wektory uzupelniajace
//! z URUCHOMIONEGO weba (pin `edb8fb56`, instrumentowana kopia, fill :4595 = 0).
//! Wektory: `tests/p6_m06a8_vectors/pomiary-r1-vectors.json` (generator `gen-m06a8-pomiary-vectors.mjs`).
//! Rodziny: skala-N (N > 18, w tym clamp 48), niekanon (klucz `x,0` obok heksu), iter-cap (cap 12 wiazacy).
//! Plik nie zmienia istniejacych testow; sprawdza te same dwa symbole co `p6_m06a8_landsea.rs`.

use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    ensure_pangea_single_continent, group_dry_land_mass_keys,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const POMIARY_VECTORS: &str = include_str!("p6_m06a8_vectors/pomiary-r1-vectors.json");

fn cases() -> &'static Vec<Value> {
    static CELL: OnceLock<Value> = OnceLock::new();
    let v = CELL.get_or_init(|| serde_json::from_str(POMIARY_VECTORS).expect("wektory parsuja"));
    v["cases"].as_array().expect("tablica cases")
}

fn terrain_of(name: &str) -> Terrain {
    serde_json::from_value(Value::String(name.to_string())).expect("nazwa TerenBazowy")
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

fn terrain_name(t: Terrain) -> String {
    serde_json::to_value(t)
        .expect("serializacja Terrain")
        .as_str()
        .expect("nazwa")
        .to_string()
}

#[test]
fn pomiary_vector_families_and_counts() {
    let all = cases();
    assert_eq!(all.len(), 39, "liczba przypadkow zgodna z generatorem");
    let count = |fam: &str| all.iter().filter(|c| c["family"] == fam).count();
    assert_eq!(count("skala-N"), 28);
    assert_eq!(count("niekanon"), 8);
    assert_eq!(count("iter-cap"), 1);
    assert_eq!(count("iter-gap"), 2);
    // Zakres N > 18 musi byc pokryty, w tym gorny clamp 48.
    let ns: Vec<i64> = all
        .iter()
        .map(|c| c["n_most"].as_i64().expect("n"))
        .collect();
    assert!(ns.contains(&48), "clamp gorny N=48 pokryty");
    assert!(
        ns.iter().any(|&n| (19..=47).contains(&n)),
        "N posrednie pokryte"
    );
}

#[test]
fn pomiary_group_dry_land_mass_keys_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases() {
        let hexes = build_hexes(c["order"].as_array().expect("order"));
        let got = group_dry_land_mass_keys(&hexes);
        let expected: Vec<Vec<String>> = c["group"]
            .as_array()
            .expect("group")
            .iter()
            .map(|m| {
                m.as_array()
                    .expect("masa")
                    .iter()
                    .map(|k| k.as_str().expect("klucz").to_string())
                    .collect()
            })
            .collect();
        if got != expected && mismatches.len() < 5 {
            mismatches.push(format!("{}: web={expected:?} rust={got:?}", c["id"]));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci group: {mismatches:#?}");
}

#[test]
fn pomiary_ensure_pangea_single_continent_matches_web_with_fill_hook_zero() {
    let mut mismatches = Vec::new();
    for c in cases() {
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let converted = ensure_pangea_single_continent(&mut hexes, w, h, |_, _, _| 0);
        let got_after: Vec<(String, String)> = hexes
            .iter()
            .map(|(k, hex)| (k.clone(), terrain_name(hex.terrain)))
            .collect();
        let expected_after: Vec<(String, String)> = c["after"]
            .as_array()
            .expect("after")
            .iter()
            .map(|p| {
                (
                    p[0].as_str().expect("klucz").to_string(),
                    p[1].as_str().expect("nazwa").to_string(),
                )
            })
            .collect();
        let expected_converted = c["converted"].as_u64().expect("converted") as usize;
        if (converted != expected_converted || got_after != expected_after) && mismatches.len() < 5
        {
            mismatches.push(format!(
                "{} ({}x{}): web_converted={expected_converted} rust_converted={converted}",
                c["id"], w, h
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci ensure: {mismatches:#?}"
    );
}
