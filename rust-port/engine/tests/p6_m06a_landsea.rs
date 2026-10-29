//! P6.M06A (runda 1) - testy portu lad/morze/wybrzeze A wzgledem wektorow z URUCHOMIONEGO weba.
//! Wektory: `tests/p6_m06a_vectors/web-vectors.json` (generator `gen-m06a-vectors.mjs`, pin `edb8fb56`,
//! seed 20261029). Stan mapy w wektorze: `[klucz, terrain(serde), nakladka(key), zloze(0/1), rzeka(0/1)]`.
//! Porownania sa dokladne (wartosci calkowite, bool, udzialy f64 z JSON).

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::map_generator::{Terrain, WorldType};
use civ_engine::domain::mapgen::landsea::{
    apply_coast_ring, apply_double_coast_ring, count_land_neighbors, count_land_sea_hexes,
    count_morse_neighbors, default_land_fraction_for_typ, erode_terrain_rank,
    find_dry_land_touching_sea, find_inland_sea_hexes, find_inland_water_hexes,
    is_coastal_land_hex, is_coastal_morse_hex, is_dry_land_terrain, is_land_or_coast,
    is_land_terrain, key_qr, ocean_connected_water_keys, sanitize_coast_hexes,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::{json, Value};

const WEB_VECTORS: &str = include_str!("p6_m06a_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn terrain(v: &Value) -> Terrain {
    serde_json::from_value(v.clone()).unwrap_or_else(|e| panic!("terrain {v}: {e}"))
}

/// Wczytuje mape z wektora (`[klucz, terrain, nakladka, zloze, rzeka]`) w kolejnosci wstawiania.
fn load_map(entries: &Value) -> HexRecord {
    let mut rec = HexRecord::new();
    for e in entries.as_array().expect("mapa") {
        let a = e.as_array().expect("wpis");
        let key = a[0].as_str().unwrap().to_string();
        let (q, r) = key_qr(&key).unwrap_or((0, 0));
        let mut hex = TerrainHex::new(q, r, terrain(&a[1]));
        hex.overlay = Nakladka::from_key(a[2].as_str().unwrap()).expect("nakladka");
        hex.has_deposit = a[3].as_i64().unwrap() == 1;
        hex.river_present = a[4].as_i64().unwrap() == 1;
        hex.river_edges = if hex.river_present {
            vec![0]
        } else {
            Vec::new()
        };
        rec.insert(key, hex);
    }
    rec
}

/// Zrzut mapy w formacie wektora (ta sama kolejnosc, te same pola).
fn dump_map(hexes: &HexRecord) -> Value {
    Value::Array(
        hexes
            .iter()
            .map(|(k, h)| {
                json!([
                    k,
                    serde_json::to_value(h.terrain).unwrap(),
                    h.overlay.key(),
                    if h.has_deposit { 1 } else { 0 },
                    if h.river_present { 1 } else { 0 },
                ])
            })
            .collect(),
    )
}

/// Mapy po nazwie (z przypadkow `count_land_sea`, ktore niosa wejscie).
fn maps_by_name() -> &'static HashMap<String, HexRecord> {
    static M: OnceLock<HashMap<String, HexRecord>> = OnceLock::new();
    M.get_or_init(|| {
        cases("count_land_sea")
            .iter()
            .map(|c| {
                (
                    c["name"].as_str().unwrap().to_string(),
                    load_map(&c["hexes"]),
                )
            })
            .collect()
    })
}

fn sorted_strings(v: &Value) -> Vec<String> {
    let mut out: Vec<String> = v
        .as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_str().unwrap().to_string())
        .collect();
    out.sort();
    out
}

fn str_vec(v: &Value) -> Vec<String> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_str().unwrap().to_string())
        .collect()
}

#[test]
fn terrain_predicates_match_web() {
    let cs = cases("terrain_predicates");
    assert_eq!(cs.len(), 8, "wszystkie 8 wartosci TerenBazowy");
    for c in cs {
        let t = terrain(&c["terrain"]);
        assert_eq!(
            is_land_terrain(t),
            c["is_land_terrain"].as_bool().unwrap(),
            "isLandTerrain {t:?}"
        );
        assert_eq!(
            is_land_or_coast(t),
            c["is_land_or_coast"].as_bool().unwrap(),
            "isLandOrCoast {t:?}"
        );
        assert_eq!(
            is_dry_land_terrain(t),
            c["is_dry_land"].as_bool().unwrap(),
            "isDryLandTerrain {t:?}"
        );
        assert_eq!(
            erode_terrain_rank(t) as u64,
            c["erode_rank"].as_u64().unwrap(),
            "erodeTerrainRank {t:?}"
        );
    }
}

#[test]
fn default_land_fraction_matches_web() {
    for c in cases("default_land_fraction") {
        let typ: WorldType = serde_json::from_value(json!(c["typ"])).unwrap();
        assert_eq!(
            default_land_fraction_for_typ(typ),
            c["out"].as_f64().unwrap(),
            "{typ:?}"
        );
    }
}

#[test]
fn count_land_sea_matches_web() {
    for c in cases("count_land_sea") {
        let got = count_land_sea_hexes(&load_map(&c["hexes"]));
        assert_eq!(
            got.land as u64,
            c["out"]["land"].as_u64().unwrap(),
            "{}",
            c["name"]
        );
        assert_eq!(
            got.sea as u64,
            c["out"]["sea"].as_u64().unwrap(),
            "{}",
            c["name"]
        );
        assert_eq!(
            got.total as u64,
            c["out"]["total"].as_u64().unwrap(),
            "{}",
            c["name"]
        );
    }
}

#[test]
fn neighbor_counts_and_coast_predicates_match_web() {
    let maps = maps_by_name();
    for c in cases("neighborhood") {
        let h = &maps[c["map"].as_str().unwrap()];
        let (q, r) = (c["q"].as_i64().unwrap(), c["r"].as_i64().unwrap());
        assert_eq!(
            count_morse_neighbors(h, q, r) as u64,
            c["morze_n"].as_u64().unwrap(),
            "morze {} {q},{r}",
            c["map"]
        );
        assert_eq!(
            count_land_neighbors(h, q, r) as u64,
            c["land_n"].as_u64().unwrap(),
            "land {} {q},{r}",
            c["map"]
        );
    }
    for c in cases("coast_predicates") {
        let h = &maps[c["map"].as_str().unwrap()];
        let (q, r) = (c["q"].as_i64().unwrap(), c["r"].as_i64().unwrap());
        assert_eq!(
            is_coastal_land_hex(h, q, r),
            c["coastal_land"].as_bool().unwrap(),
            "cLand {} {q},{r}",
            c["map"]
        );
        assert_eq!(
            is_coastal_morse_hex(h, q, r),
            c["coastal_morse"].as_bool().unwrap(),
            "cMorse {} {q},{r}",
            c["map"]
        );
    }
}

fn check_mutating(name: &str, f: fn(&mut HexRecord) -> usize) -> usize {
    let mut nonzero = 0usize;
    for c in cases(name) {
        let mut h = load_map(&c["in"]);
        let ret = f(&mut h);
        assert_eq!(
            ret as u64,
            c["ret"].as_u64().unwrap(),
            "{name} ret {}",
            c["name"]
        );
        assert_eq!(dump_map(&h), c["out"], "{name} stan {}", c["name"]);
        if ret > 0 {
            nonzero += 1;
        }
    }
    nonzero
}

#[test]
fn apply_coast_ring_matches_web() {
    let nz = check_mutating("apply_coast_ring", apply_coast_ring);
    assert!(nz >= 20, "pokrycie galezi: zbyt malo mutacji ({nz})");
}

#[test]
fn apply_double_coast_ring_matches_web() {
    let nz = check_mutating("apply_double_coast_ring", apply_double_coast_ring);
    assert!(nz >= 20, "pokrycie galezi: zbyt malo mutacji ({nz})");
}

#[test]
fn sanitize_coast_hexes_matches_web() {
    let nz = check_mutating("sanitize_coast_hexes", sanitize_coast_hexes);
    assert!(nz >= 5, "pokrycie sierot: zbyt malo napraw ({nz})");
}

#[test]
fn find_dry_land_touching_sea_matches_web() {
    for c in cases("find_dry_land_touching_sea") {
        let h = load_map(&c["in"]);
        assert_eq!(
            find_dry_land_touching_sea(&h),
            str_vec(&c["out"]),
            "{}",
            c["name"]
        );
    }
}

#[test]
fn ocean_connected_water_matches_web() {
    for c in cases("ocean_connected_water") {
        let h = load_map(&c["in"]);
        let (w, hh) = (c["W"].as_i64().unwrap(), c["H"].as_i64().unwrap());
        let mut got: Vec<String> = ocean_connected_water_keys(&h, w, hh).into_iter().collect();
        got.sort();
        assert_eq!(got, sorted_strings(&c["out"]), "{}", c["name"]);
    }
}

#[test]
fn find_inland_water_and_sea_match_web() {
    for c in cases("find_inland_water") {
        let h = load_map(&c["in"]);
        let (w, hh) = (c["W"].as_i64().unwrap(), c["H"].as_i64().unwrap());
        assert_eq!(
            find_inland_water_hexes(&h, w, hh),
            str_vec(&c["out"]),
            "water {}",
            c["name"]
        );
    }
    for c in cases("find_inland_sea") {
        let h = load_map(&c["in"]);
        let (w, hh) = (c["W"].as_i64().unwrap(), c["H"].as_i64().unwrap());
        assert_eq!(
            find_inland_sea_hexes(&h, w, hh),
            str_vec(&c["out"]),
            "sea {}",
            c["name"]
        );
    }
}
