//! P6.M06A4 (runda 3, obrona po zarzucie PM04) - test `purgeInlandWaterForMultiLandTyp` (web :4215)
//! na przypadkach, w ktorych OSTATNI `removeInlandWaterPools` zmienia mape (fill(4) odcina kanal
//! wody, zostawiajac wode inlandowa). Wektory z URUCHOMIONEGO weba (pin `edb8fb56`):
//! `tests/p6_m06a4_vectors/chan-vectors.json`, generator `gen-m06a4-chan-vectors.mjs` (seed 20261034).
//! Mutant "usuniety ostatni removeInland" daje inna mape niz web dla kazdego przypadku z tego pliku.

use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::purge_inland_water_for_multi_land_typ;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

const CHAN_VECTORS: &str = include_str!("p6_m06a4_vectors/chan-vectors.json");

fn vectors() -> &'static Value {
    static V: OnceLock<Value> = OnceLock::new();
    V.get_or_init(|| serde_json::from_str(CHAN_VECTORS).expect("chan vectors parse"))
}

fn cases() -> &'static Vec<Value> {
    vectors()["cases"]["purge_channel_cut"]
        .as_array()
        .expect("brak przypadkow purge_channel_cut")
}

/// Pierwsze dwie skladowe klucza (jak web `parseHexKey`); wektory maja tylko klucze kanoniczne.
fn key_qr(key: &str) -> (i64, i64) {
    let mut it = key.split(',');
    let a = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let b = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    (a, b)
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

#[test]
fn chan_vectors_meta_pin_and_counts() {
    let meta = &vectors()["meta"];
    assert_eq!(meta["pin"].as_str(), Some("edb8fb56"));
    assert_eq!(
        meta["gen_helpers_sha256"].as_str(),
        Some("ab934703990ba00e71a801eb0b6fcefeb0906c6bd4ded477c7162361307842de"),
    );
    assert_eq!(cases().len(), 12, "liczba przypadkow chan");
    for case in cases() {
        assert!(
            case["inland_after_fill4"].as_u64().unwrap_or(0) > 0,
            "przypadek {} nie zabija ostatniego removeInland",
            case["name"]
        );
    }
    assert!(
        CHAN_VECTORS.len() <= 8 * 1024 * 1024,
        "plik wektorow powyzej celu 8 MB"
    );
}

#[test]
fn purge_channel_cut_matches_web_including_last_remove_inland() {
    // 12 przypadkow 9x9, bez petli bez limitu: zwykle wywolanie, bez watchdoga.
    for case in cases() {
        let w = case["w"].as_i64().expect("w");
        let h = case["h"].as_i64().expect("h");
        let mut hexes = load_map(&case["input"]);
        let n = purge_inland_water_for_multi_land_typ(&mut hexes, w, h);
        assert_eq!(
            n as u64,
            case["out"].as_u64().unwrap(),
            "count {}",
            case["name"]
        );
        assert_eq!(hexes, load_map(&case["output"]), "mapa {}", case["name"]);
    }
}
