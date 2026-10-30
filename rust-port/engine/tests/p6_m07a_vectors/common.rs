//! Wspolne narzedzia testow P6.M07A (dolaczane przez `#[path]`; plik lezy w `p6_m07a_vectors/`,
//! wiec nie jest osobnym crate'em testowym). Wektory: `web-rivers-a.json` z URUCHOMIONEGO weba
//! (generator `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-vectors.mjs`,
//! pin `edb8fb56`). Mapy w tablicy `maps` (`{w, h, rows}`); wiersz stanu:
//! `[klucz, terenBazowy, nakladka, zloze(0/1), rzekaObecna(0/1), rzekaKrawedzie[]]`.
#![allow(dead_code)]

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::Value;

pub const WEB_CASES_RIVERS_A: &str = include_str!("web-rivers-a.json");

/// Parsuje plik wektorow (raz na test).
pub fn load() -> Value {
    serde_json::from_str(WEB_CASES_RIVERS_A).expect("web vectors parse")
}

pub fn cases<'a>(root: &'a Value, kind: &str) -> &'a Vec<Value> {
    root["cases"][kind]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {kind}"))
}

pub fn map_dims(root: &Value, idx: usize) -> (i64, i64) {
    (
        root["maps"][idx]["w"].as_i64().expect("w"),
        root["maps"][idx]["h"].as_i64().expect("h"),
    )
}

pub fn terrain_from(name: &str) -> Terrain {
    match name {
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "plytkie_morze" => Terrain::ShallowSea,
        "morze" => Terrain::Sea,
        "pustynia" => Terrain::Desert,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren web: {other}"),
    }
}

pub fn terrain_name(t: Terrain) -> &'static str {
    match t {
        Terrain::Grassland => "laka",
        Terrain::Plains => "rownina",
        Terrain::Hills => "wzgorza",
        Terrain::Mountains => "gory",
        Terrain::ShallowSea => "plytkie_morze",
        Terrain::Sea => "morze",
        Terrain::Desert => "pustynia",
        Terrain::Polar => "polarny",
    }
}

pub fn overlay_from(name: &str) -> Nakladka {
    match name {
        "brak" => Nakladka::Brak,
        "las" => Nakladka::Las,
        other => panic!("nieznana nakladka web: {other}"),
    }
}

pub fn overlay_name(n: Nakladka) -> &'static str {
    match n {
        Nakladka::Brak => "brak",
        Nakladka::Las => "las",
        other => panic!("nakladka spoza zakresu wektorow: {other:?}"),
    }
}

fn row_to_hex(row: &Value) -> (String, TerrainHex) {
    let key = row[0].as_str().expect("klucz").to_string();
    let (q, r) = key.split_once(',').expect("klucz q,r");
    let q: i64 = q.parse().expect("q");
    let r: i64 = r.parse().expect("r");
    let edges: Vec<u8> = row[5]
        .as_array()
        .expect("krawedzie")
        .iter()
        .map(|e| e.as_u64().expect("krawedz") as u8)
        .collect();
    let hex = TerrainHex {
        q,
        r,
        terrain: terrain_from(row[1].as_str().expect("teren")),
        overlay: overlay_from(row[2].as_str().expect("nakladka")),
        river_present: row[4].as_i64().expect("rzeka") == 1,
        river_edges: edges,
        has_deposit: row[3].as_i64().expect("zloze") == 1,
    };
    (key, hex)
}

/// Mapa z tablicy `maps[idx]` (swieza kopia przy kazdym wywolaniu, kolejnosc wstawiania zachowana).
pub fn build_map(root: &Value, idx: usize) -> HexRecord {
    let mut rec = HexRecord::new();
    for row in root["maps"][idx]["rows"].as_array().expect("rows") {
        let (k, h) = row_to_hex(row);
        rec.insert(k, h);
    }
    rec
}

/// Stan mapy w kolejnosci wstawiania (format wektorow).
pub fn dump_map(rec: &HexRecord) -> Vec<Value> {
    rec.iter()
        .map(|(k, h)| {
            serde_json::json!([
                k,
                terrain_name(h.terrain),
                overlay_name(h.overlay),
                if h.has_deposit { 1 } else { 0 },
                if h.river_present { 1 } else { 0 },
                h.river_edges,
            ])
        })
        .collect()
}

/// Sciezka z wektora `[[q,r],...]`.
pub fn path_of(v: &Value) -> Vec<RiverCoord> {
    v.as_array()
        .expect("sciezka")
        .iter()
        .map(|p| RiverCoord::new(p[0].as_i64().expect("q"), p[1].as_i64().expect("r")))
        .collect()
}

/// Sciezka oczekiwana (`[[q,r],...]`) do porownania z wynikiem.
pub fn path_json(path: &[RiverCoord]) -> Value {
    Value::Array(path.iter().map(|c| serde_json::json!([c.q, c.r])).collect())
}
