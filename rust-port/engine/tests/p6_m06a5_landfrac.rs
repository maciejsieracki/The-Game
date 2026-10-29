//! P6.M06A5 (partia 1, R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1) - testy portu rodziny ulamka lądu
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`):
//! `assignContinentIndices` (:3186), `sortLandKeysForErosion` (:3207, instrumentowany eksport w kopii),
//! `applyLandFractionByScore` (:3444), `rebalanceLandFractionWithMargins` (:3532).
//! Wektory: `tests/p6_m06a5_vectors/landfrac-vectors.json` (generator `gen-m06a5-landfrac-vectors.mjs`,
//! seed 20261031). Mapa: `[klucz, terrain(serde)]`; wynik: liczba zmian + `[klucz, terrain]` w kolejnosci.

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::data::derived::parse_mapgen_landsea_fill;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    apply_land_fraction_by_score, assign_continent_indices, rebalance_land_fraction_with_margins,
    sort_land_keys_for_erosion, LandFractionFillBias,
};
use civ_engine::domain::mapgen::masks::ContinentCenter;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const LANDFRAC_VECTORS: &str = include_str!("p6_m06a5_vectors/landfrac-vectors.json");

fn vectors() -> &'static Value {
    static V: OnceLock<Value> = OnceLock::new();
    V.get_or_init(|| serde_json::from_str(LANDFRAC_VECTORS).expect("landfrac vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    vectors()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn qr(key: &str) -> (i64, i64) {
    let (a, b) = key.split_once(',').expect("klucz q,r");
    (a.parse().expect("q"), b.parse().expect("r"))
}

fn build_map(rows: &Value) -> HexRecord {
    let mut hexes = HexRecord::new();
    for row in rows.as_array().expect("mapa") {
        let a = row.as_array().expect("wiersz mapy");
        let key = a[0].as_str().expect("klucz").to_owned();
        let terrain: Terrain = serde_json::from_value(a[1].clone()).expect("terrain");
        let (q, r) = qr(&key);
        hexes.insert(key, TerrainHex::new(q, r, terrain));
    }
    hexes
}

fn build_scores(pairs: &Value) -> HashMap<String, f64> {
    pairs
        .as_array()
        .expect("scores")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("para");
            (
                a[0].as_str().expect("klucz").to_owned(),
                a[1].as_f64().expect("score"),
            )
        })
        .collect()
}

fn dump_terrains(hexes: &HexRecord) -> Vec<(String, String)> {
    hexes
        .iter()
        .map(|(k, h)| {
            let name = serde_json::to_value(h.terrain).expect("terrain name");
            (k.clone(), name.as_str().expect("nazwa").to_owned())
        })
        .collect()
}

fn expected_terrains(v: &Value) -> Vec<(String, String)> {
    v.as_array()
        .expect("terrains")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("para");
            (
                a[0].as_str().unwrap().to_owned(),
                a[1].as_str().unwrap().to_owned(),
            )
        })
        .collect()
}

#[test]
fn landfrac_data_matches_web_constants() {
    // web :3438 (0.11), :3453 (0.15/0.85), :3484 (0.04), :3222 (0.015)
    let f = parse_mapgen_landsea_fill().expect("mapgen-landsea-fill.json");
    assert_eq!(f.pangea_min_score_wypelnienia, 0.11);
    assert_eq!(f.clamp_udzialu_min, 0.15);
    assert_eq!(f.clamp_udzialu_max, 0.85);
    assert_eq!(f.tolerancja_score_sortowanie, 0.04);
    assert_eq!(f.tolerancja_odleglosci_centrum, 0.015);
}

#[test]
fn assign_continent_indices_matches_web() {
    let cs = cases("assign");
    assert!(!cs.is_empty());
    for c in cs {
        let w = c["w"].as_u64().unwrap() as u32;
        let h = c["h"].as_u64().unwrap() as u32;
        let centers: Vec<ContinentCenter> = c["centers"]
            .as_array()
            .unwrap()
            .iter()
            .map(|t| ContinentCenter {
                nq: t[0].as_f64().unwrap(),
                nr: t[1].as_f64().unwrap(),
                radius: t[2].as_f64().unwrap(),
            })
            .collect();
        let got = assign_continent_indices(w, h, &centers);
        let exp: Vec<(String, usize)> = c["expect"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| {
                (
                    p[0].as_str().unwrap().to_owned(),
                    p[1].as_u64().unwrap() as usize,
                )
            })
            .collect();
        assert_eq!(got, exp, "przypadek {}", c["id"]);
    }
}

#[test]
fn sort_land_keys_for_erosion_matches_web() {
    let cs = cases("sort");
    assert!(!cs.is_empty());
    for c in cs {
        let hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let keys: Vec<String> = c["keys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap().to_owned())
            .collect();
        let (w, h) = match &c["dims"] {
            Value::Null => (1, 1),
            d => (d[0].as_i64().unwrap(), d[1].as_i64().unwrap()),
        };
        let got = sort_land_keys_for_erosion(&keys, &hexes, &scores, w, h);
        let exp: Vec<String> = c["expect"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap().to_owned())
            .collect();
        assert_eq!(got, exp, "przypadek {}", c["id"]);
    }
}

#[test]
fn apply_land_fraction_by_score_matches_web() {
    let cs = cases("apply");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let target = c["target"].as_f64().unwrap();
        let dims = match &c["dims"] {
            Value::Null => None,
            d => Some((d[0].as_i64().unwrap(), d[1].as_i64().unwrap())),
        };
        let fill = match c["fill"].as_str().unwrap() {
            "center" => LandFractionFillBias::Center,
            "mask" => LandFractionFillBias::Mask,
            other => panic!("fill {other}"),
        };
        let min = c["min"].as_f64().unwrap();
        let adjusted = apply_land_fraction_by_score(&mut hexes, &scores, target, dims, fill, min);
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "zmiany, przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "mapa, przypadek {}",
            c["id"]
        );
    }
}

#[test]
fn rebalance_land_fraction_with_margins_matches_web() {
    let cs = cases("rebalance");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let target = c["target"].as_f64().unwrap();
        let w = c["w"].as_i64().unwrap();
        let h = c["h"].as_i64().unwrap();
        rebalance_land_fraction_with_margins(&mut hexes, &scores, target, w, h);
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "przypadek {}",
            c["id"]
        );
    }
}
