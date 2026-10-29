//! P6.M06A2 (runda 1, partia 1) - testy portu lad/morze/wybrzeze A2 wzgledem wektorow z URUCHOMIONEGO weba.
//! Symbole partii 1: `removeInlandWaterPools` (:4137), `fillEnclosedWaterByLandNeighbors` (:4189),
//! `removeSmallInlandWaterPools` (:4276), `removeInlandSeaPools` (:4320).
//! Wektory: `tests/p6_m06a2_vectors/web-vectors.json` (generator `gen-m06a2-vectors.mjs`, pin `edb8fb56`,
//! seed 20261029). Stan mapy: `[klucz, terrain(serde), nakladka(key), zloze(0/1), rzeka(0/1), krawedzie(N)]`.
//! Porownanie: cala HexRecord (kolejnosc, pola) + liczba zmian.

use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    fill_enclosed_water_by_land_neighbors, remove_inland_sea_pools, remove_inland_water_pools,
    remove_small_inland_water_pools,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m06a2_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn key_qr(key: &str) -> (i64, i64) {
    let (a, b) = key.split_once(',').expect("klucz q,r");
    (a.parse().expect("q"), b.parse().expect("r"))
}

/// Wczytuje mape z wektora w kolejnosci wstawiania (jak `Object.entries`).
fn load_map(entries: &Value) -> HexRecord {
    let mut rec = HexRecord::new();
    for e in entries.as_array().expect("mapa") {
        let a = e.as_array().expect("wpis");
        let key = a[0].as_str().expect("klucz").to_string();
        let (q, r) = key_qr(&key);
        let terrain: Terrain = serde_json::from_value(a[1].clone()).expect("terrain");
        let mut hex = TerrainHex::new(q, r, terrain);
        hex.overlay = Nakladka::from_key(a[2].as_str().expect("nakladka")).expect("nakladka key");
        hex.has_deposit = a[3].as_i64().expect("zloze") == 1;
        hex.river_present = a[4].as_i64().expect("rzeka") == 1;
        let n = a[5].as_u64().expect("krawedzie") as usize;
        hex.river_edges = vec![0; n];
        rec.insert(key, hex);
    }
    rec
}

fn w_h(case: &Value) -> (i64, i64) {
    (
        case["w"].as_i64().expect("w"),
        case["h"].as_i64().expect("h"),
    )
}

#[test]
fn vectors_meta_pin_and_counts() {
    let meta = &web()["meta"];
    assert_eq!(meta["pin"].as_str(), Some("edb8fb56"));
    assert_eq!(
        meta["gen_helpers_sha256"].as_str(),
        Some("ab934703990ba00e71a801eb0b6fcefeb0906c6bd4ded477c7162361307842de"),
        "wektory musza pochodzic z tego samego gen-helpers.ts co M06A"
    );
    for name in [
        "remove_inland_water_pools",
        "fill_enclosed_water",
        "remove_small_inland_water_pools",
        "remove_inland_sea_pools",
    ] {
        assert!(!cases(name).is_empty(), "{name} puste");
    }
}

#[test]
fn remove_inland_water_pools_matches_web() {
    for case in cases("remove_inland_water_pools") {
        let (w, h) = w_h(case);
        let mut hexes = load_map(&case["input"]);
        let n = remove_inland_water_pools(&mut hexes, w, h);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
    }
}

#[test]
fn fill_enclosed_water_matches_web_with_boundaries() {
    let mut hits_rel = [0usize; 3]; // rel = -1, 0, +1 (N-1, N, N+1 wzgledem progu)
    for case in cases("fill_enclosed_water") {
        let min = case["min_land"].as_u64().expect("min_land") as usize;
        let mut hexes = load_map(&case["input"]);
        let n = fill_enclosed_water_by_land_neighbors(&mut hexes, min);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
        if let Some(rel) = case["boundary_rel"].as_i64() {
            if (-1..=1).contains(&rel) {
                hits_rel[(rel + 1) as usize] += 1;
            }
        }
    }
    assert!(
        hits_rel.iter().all(|&c| c > 0),
        "brak trafien na progu N-1/N/N+1: {hits_rel:?}"
    );
}

#[test]
fn remove_small_inland_water_pools_matches_web_with_size_boundaries() {
    let mut hits_rel = [0usize; 3]; // max-1, max, max+1 wzgledem rozmiaru bloba
    for case in cases("remove_small_inland_water_pools") {
        let (w, h) = w_h(case);
        let max_pool = case["max_pool"].as_u64().expect("max_pool") as usize;
        let mut hexes = load_map(&case["input"]);
        let n = remove_small_inland_water_pools(&mut hexes, w, h, max_pool);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
        if let Some(rel) = case["boundary_rel"].as_i64() {
            if (-1..=1).contains(&rel) {
                hits_rel[(rel + 1) as usize] += 1;
            }
        }
    }
    assert!(
        hits_rel.iter().all(|&c| c > 0),
        "brak trafien na progu rozmiaru: {hits_rel:?}"
    );
}

#[test]
fn remove_inland_sea_pools_matches_web() {
    for case in cases("remove_inland_sea_pools") {
        let (w, h) = w_h(case);
        let mut hexes = load_map(&case["input"]);
        let n = remove_inland_sea_pools(&mut hexes, w, h);
        let expected = load_map(&case["output"]);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, expected, "mapa {}", case["name"]);
    }
}
