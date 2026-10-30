//! Wspolne narzedzia testow P6.M06B2 (dolaczane przez `#[path]`; plik lezy w `p6_m06b2_vectors/`,
//! wiec nie jest osobnym crate'em testowym). Wektory: `web-*.json` z URUCHOMIONEGO weba
//! (generator `gen-m06b2-vectors.mjs`, pin `edb8fb56`). Mapy w tablicy `maps` (indeks w przypadku);
//! wiersz stanu: `[klucz, terenBazowy, nakladka, zloze(0/1), rzekaObecna(0/1), rzekaKrawedzie[]]`.
//! Wynik funkcji = `ret` + `diff` (tylko heksy zmienione przez web, w kolejnosci wstawiania).
//! Stan oczekiwany = stan wejsciowy z podmienionymi wierszami z `diff` (po kluczu).
//! Liczby f64 jako tekst (`String(x)`) albo liczba JSON, porownywane BIT-W-BIT.
#![allow(dead_code)]

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use serde_json::{json, Value};

pub const WEB_CASES_TINY: &str = include_str!("web-tiny.json");
pub const WEB_CASES_SPECKS: &str = include_str!("web-specks.json");
pub const WEB_CASES_FINALIZE: &str = include_str!("web-finalize.json");
pub const WEB_CASES_ENFORCE: &str = include_str!("web-enforce.json");
pub const WEB_CASES_ENFORCE_PROBE: &str = include_str!("web-enforce-probe.json");

/// Parsuje plik wektorow (raz na test).
pub fn load(text: &str) -> Value {
    serde_json::from_str(text).expect("web vectors parse")
}

pub fn cases<'a>(root: &'a Value, kind: &str) -> &'a Vec<Value> {
    root["cases"][kind]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {kind}"))
}

pub fn map_rows(root: &Value, idx: usize) -> &Vec<Value> {
    root["maps"][idx]["rows"]
        .as_array()
        .unwrap_or_else(|| panic!("brak mapy {idx}"))
}

/// Tablica wartosci `scores` mapy (landScores w kolejnosci kluczy wiersza).
pub fn map_scores(root: &Value, idx: usize) -> Vec<f64> {
    root["maps"][idx]["scores"]
        .as_array()
        .expect("scores")
        .iter()
        .map(fv)
        .collect()
}

pub fn s(v: &Value) -> &str {
    v.as_str().unwrap_or_else(|| panic!("str: {v}"))
}

/// f64 zapisany jako tekst JS (`String(x)`) albo liczba JSON.
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

fn row_to_hex(row: &Value) -> (String, TerrainHex) {
    let key = s(&row[0]).to_string();
    let parts: Vec<&str> = key.split(',').collect();
    let q = parts[0].parse::<i64>().expect("q");
    let r = parts[1].parse::<i64>().expect("r");
    let edges: Vec<u8> = row[5]
        .as_array()
        .expect("krawedzie")
        .iter()
        .map(|e| e.as_u64().expect("krawedz") as u8)
        .collect();
    let hex = TerrainHex {
        q,
        r,
        terrain: terrain_from(s(&row[1])),
        overlay: nakladka_from(s(&row[2])),
        river_present: row[4].as_i64().expect("rzeka") == 1,
        river_edges: edges,
        has_deposit: row[3].as_i64().expect("zloze") == 1,
    };
    (key, hex)
}

/// Mapa z tablicy `maps[idx]` (swieza kopia przy kazdym wywolaniu).
pub fn build_map(root: &Value, idx: usize) -> HexRecord {
    let mut hexes = HexRecord::new();
    for row in map_rows(root, idx) {
        let (key, hex) = row_to_hex(row);
        hexes.insert(key, hex);
    }
    hexes
}

/// Zrzut stanu w formacie wektora (kolejnosc wstawiania = `Object.entries`).
pub fn dump(hexes: &HexRecord) -> Value {
    let rows: Vec<Value> = hexes
        .iter()
        .map(|(k, h)| {
            let edges: Vec<Value> = h.river_edges.iter().map(|e| json!(e)).collect();
            json!([
                k,
                terrain_name(h.terrain),
                nakladka_name(h.overlay),
                u8::from(h.has_deposit),
                u8::from(h.river_present),
                edges
            ])
        })
        .collect();
    Value::Array(rows)
}

/// Stan oczekiwany po wywolaniu web: wiersze wejsciowe z podmienionymi wierszami z `diff`.
pub fn expected_state(root: &Value, idx: usize, diff: &Value) -> Value {
    let mut rows: Vec<Value> = map_rows(root, idx).clone();
    let changed: Vec<&Value> = diff.as_array().expect("diff").iter().collect();
    for newrow in changed {
        let key = s(&newrow[0]);
        let pos = rows
            .iter()
            .position(|r| s(&r[0]) == key)
            .unwrap_or_else(|| panic!("diff: brak klucza {key}"));
        rows[pos] = newrow.clone();
    }
    Value::Array(rows)
}

/// Round-trip stanu wejsciowego: mapa zbudowana z wektora daje ten sam zrzut.
pub fn check_input(root: &Value, idx: usize, id: &str) {
    assert_eq!(
        dump(&build_map(root, idx)),
        Value::Array(map_rows(root, idx).clone()),
        "{id}: round-trip stanu wejsciowego"
    );
}

pub fn dims(c: &Value) -> (i64, i64) {
    (c["W"].as_i64().expect("W"), c["H"].as_i64().expect("H"))
}

pub fn map_index(c: &Value) -> usize {
    c["mi"].as_u64().expect("mi") as usize
}
