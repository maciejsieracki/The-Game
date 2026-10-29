//! Wspolne narzedzia testow P6.M05B (dolaczane przez `#[path]`; plik lezy w `p6_m05b_vectors/`,
//! wiec nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba
//! (generator `gen-m05b-vectors.mjs`, pin `edb8fb56`). Stan mapy (wejscie i wyjscie) jest w
//! wektorze jako `[klucz, terenBazowy, nakladka, zloze(0/1)]`; liczby f64 jako tekst (`String(x)`),
//! porownywane BIT-W-BIT (`to_bits`; NaN sprowadzony do jednego NaN).
#![allow(dead_code)]

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::prims::{mulberry32_step, mulberry32_unit};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex, TerrainScratch};
use serde_json::{json, Value};

const WEB_VECTORS: &str = include_str!("web-vectors.json");

pub fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

pub fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

pub fn stat(name: &str) -> i64 {
    web()["stats"][name].as_i64().unwrap_or(0)
}

pub fn s(v: &Value) -> &str {
    v.as_str().unwrap_or_else(|| panic!("str: {v}"))
}

/// f64 zapisany jako tekst JS (`String(x)`, `NaN`, `Infinity`, `-0`) albo liczba JSON.
pub fn fv(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(t) => match t.as_str() {
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "NaN" => f64::NAN,
            other => other
                .parse::<f64>()
                .unwrap_or_else(|_| panic!("f64: {other}")),
        },
        other => panic!("f64: {other}"),
    }
}

pub fn bits(x: f64) -> u64 {
    if x.is_nan() {
        f64::NAN.to_bits()
    } else {
        x.to_bits()
    }
}

pub fn assert_f64(actual: f64, expected: f64, what: &str) {
    assert_eq!(
        bits(actual),
        bits(expected),
        "{what}: rust={actual:?} web={expected:?}"
    );
}

pub fn terrain_from(name: &str) -> Terrain {
    match name {
        "gory" => Terrain::Mountains,
        "wzgorza" => Terrain::Hills,
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "pustynia" => Terrain::Desert,
        "morze" => Terrain::Sea,
        "plytkie_morze" => Terrain::ShallowSea,
        other => panic!("nieznany teren web: {other}"),
    }
}

pub fn terrain_name(t: Terrain) -> &'static str {
    match t {
        Terrain::Mountains => "gory",
        Terrain::Hills => "wzgorza",
        Terrain::Grassland => "laka",
        Terrain::Plains => "rownina",
        Terrain::Desert => "pustynia",
        Terrain::Sea => "morze",
        Terrain::ShallowSea => "plytkie_morze",
        other => panic!("teren spoza zakresu wektorow: {other:?}"),
    }
}

pub fn nakladka_from(name: &str) -> Nakladka {
    match name {
        "brak" => Nakladka::Brak,
        "las" => Nakladka::Las,
        other => panic!("nieznana nakladka web: {other}"),
    }
}

pub fn nakladka_name(n: Nakladka) -> &'static str {
    match n {
        Nakladka::Brak => "brak",
        Nakladka::Las => "las",
        other => panic!("nakladka spoza zakresu wektorow: {other:?}"),
    }
}

pub fn tier_from(name: &str) -> DensityTier {
    match name {
        "low" => DensityTier::Low,
        "medium" => DensityTier::Medium,
        "high" => DensityTier::High,
        other => panic!("nieznany tier: {other}"),
    }
}

/// Stan z wektora: `map.hexes` = `[[k, teren, nakladka, zloze]]`, `map.scratch` = `[[k, "szum"]]`.
pub fn build_state(map: &Value) -> (HexRecord, HashMap<String, TerrainScratch>) {
    let mut hexes = HexRecord::new();
    for row in map["hexes"].as_array().expect("hexes") {
        let key = s(&row[0]).to_string();
        let (q, r) = {
            let parts: Vec<&str> = key.split(',').collect();
            (
                parts[0].parse::<i64>().expect("q"),
                parts[1].parse::<i64>().expect("r"),
            )
        };
        let hex = TerrainHex {
            q,
            r,
            terrain: terrain_from(s(&row[1])),
            overlay: nakladka_from(s(&row[2])),
            river_present: false,
            river_edges: Vec::new(),
            has_deposit: row[3].as_i64().expect("zloze") == 1,
        };
        hexes.insert(key, hex);
    }
    let mut scratch = HashMap::new();
    for row in map["scratch"].as_array().expect("scratch") {
        let key = s(&row[0]).to_string();
        let n = fv(&row[1]);
        scratch.insert(
            key,
            TerrainScratch {
                elev_continental: 0.0,
                land_mask: 0.0,
                mtn_noise: n,
                for_noise: 0.0,
                des_noise: 0.0,
            },
        );
    }
    (hexes, scratch)
}

/// Zrzut stanu w formacie wektora (kolejnosc wstawiania = `Object.entries`).
pub fn dump(hexes: &HexRecord) -> Value {
    let rows: Vec<Value> = hexes
        .iter()
        .map(|(k, h)| {
            json!([
                k,
                terrain_name(h.terrain),
                nakladka_name(h.overlay),
                u8::from(h.has_deposit)
            ])
        })
        .collect();
    Value::Array(rows)
}

/// Strumien `mulberry32(seed)` z web (`gen-helpers.ts:57`): ten sam krok co `prims::mulberry32_*`.
pub fn make_rand(seed: u64) -> impl FnMut() -> f64 {
    let mut state = seed as u32;
    move || {
        let (next, out) = mulberry32_step(state);
        state = next;
        mulberry32_unit(out)
    }
}

/// Ziarno web: `mulberry32(seed)` robi `seed >>> 0` - wynik JS `^` bywa ujemny, wiec bierzemy
/// 32 bity (tak jak web).
pub fn seed_of(c: &Value) -> u64 {
    let v = c["seed"].as_i64().expect("seed");
    u64::from(v as u32)
}

pub fn dims(c: &Value) -> (f64, f64) {
    (
        c["width"].as_f64().expect("width"),
        c["height"].as_f64().expect("height"),
    )
}

pub fn keys_of(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("array")
        .iter()
        .map(|k| s(k).to_string())
        .collect()
}

pub fn key_set(v: &Value) -> std::collections::HashSet<String> {
    keys_of(v).into_iter().collect()
}
