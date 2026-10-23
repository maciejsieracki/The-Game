//! Wspolne pomocniki testow P6.6A (dolaczane przez `#[path]`). Wektory pochodza z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1/gen-p66a-vectors.mjs`, pin edb8fb56).
#![allow(dead_code)]

use std::collections::BTreeSet;
use std::fs;
use std::path::PathBuf;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    Klucz, RuchHex, RuchJednostka, RuchMapa, TerenBazowy as RuchTeren,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_hex_clear::CityCenterHex;
use civ_engine::domain::terrain::TerrainType;
use serde_json::Value;

pub fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_6a_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

pub fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba z wektora: liczba JSON albo string "NaN" / "Infinity" / "-Infinity" / "-0".
pub fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => match other.strip_prefix('~') {
                // ulamki: "~<zapis JS>"; str::parse::<f64> jest dokladny (serde_json bez float_roundtrip nie)
                Some(repr) => repr
                    .parse::<f64>()
                    .unwrap_or_else(|e| panic!("ulamek {other}: {e}")),
                None => panic!("nieznana liczba specjalna {other}"),
            },
        },
        other => panic!("to nie liczba: {other}"),
    }
}

/// Liczba JS (`typeof === 'number'`) albo `None` dla null / napisu / braku pola. Odpowiednik
/// `num`, ale bez paniki dla nie-liczb.
pub fn json_number(v: &Value) -> Option<f64> {
    match v {
        Value::Number(_) => Some(num(v)),
        Value::String(s) if s.starts_with('~') => Some(num(v)),
        _ => None,
    }
}

pub fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

/// Rownosc BITOWA f64 (NaN == NaN niezaleznie od ladunku).
pub fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

pub fn assert_opt_bits(label: &str, got: Option<f64>, want: Option<f64>) {
    match (got, want) {
        (None, None) => {}
        (Some(g), Some(w)) => assert_bits(label, g, w),
        other => panic!("{label}: rust/web = {other:?}"),
    }
}

pub fn int(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("int")).expect("i32")
}

pub fn text(v: &Value) -> String {
    v.as_str().expect("str").to_string()
}

pub fn opt_text(v: &Value) -> Option<String> {
    v.as_str().map(str::to_string)
}

pub fn terrain(s: &str) -> TerrainType {
    serde_json::from_value(Value::String(s.to_string()))
        .unwrap_or_else(|e| panic!("teren {s}: {e}"))
}

pub fn ruch_terrain(s: &str) -> RuchTeren {
    RuchTeren::from_web(s).unwrap_or_else(|| panic!("teren {s}"))
}

pub fn overlay(s: &str) -> Overlay {
    Overlay::from_web_value(s).unwrap_or_else(|| panic!("nakladka {s}"))
}

pub fn center_hex(v: &Value) -> CityCenterHex {
    CityCenterHex {
        teren: terrain(v["teren"].as_str().expect("teren")),
        nakladka: overlay(v["nakladka"].as_str().expect("nakladka")),
        ulepszenie: text(&v["ulepszenie"]),
        ulepszenia: v["ulepszenia"]
            .as_array()
            .map(|a| a.iter().map(text).collect()),
        zloze: opt_text(&v["zloze"]),
        improvement_key: opt_text(&v["improvementKey"]),
        rzeka: v["rzeka"].as_bool().expect("rzeka"),
    }
}

/// Klucze "q,r" posortowane po (q, r) -> `BTreeSet<Klucz>`.
pub fn key_strings(set: &BTreeSet<Klucz>) -> Vec<String> {
    set.iter().map(|(q, r)| format!("{q},{r}")).collect()
}

pub fn key_vec_strings(keys: &[Klucz]) -> Vec<String> {
    keys.iter().map(|(q, r)| format!("{q},{r}")).collect()
}

pub fn parse_key(s: &str) -> Klucz {
    let (q, r) = s.split_once(',').expect("klucz q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

pub fn key_set(v: &Value) -> BTreeSet<Klucz> {
    v.as_array()
        .expect("klucze")
        .iter()
        .map(|k| parse_key(k.as_str().expect("klucz")))
        .collect()
}

pub fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("strings").iter().map(text).collect()
}

/// Mapa z listy `[["q,r", "teren"], ...]` (kolejnosc wstawiania w web = rosnaco po (q, r)).
pub fn ruch_map(v: &Value) -> RuchMapa {
    let mut map = RuchMapa::new();
    for pair in v.as_array().expect("mapa") {
        let key = parse_key(pair[0].as_str().expect("klucz"));
        map.insert(
            key,
            RuchHex::new(ruch_terrain(pair[1].as_str().expect("teren"))),
        );
    }
    map
}

pub fn unit(v: &Value) -> RuchJednostka {
    let mut u = RuchJednostka::new(
        v["id"].as_str().expect("id"),
        v["ownerId"].as_i64().expect("ownerId"),
        "x",
        int(&v["q"]),
        int(&v["r"]),
    );
    u.type_id = opt_text(&v["typeId"]);
    u.in_garnizon = v["inGarnizon"].as_bool().expect("inGarnizon");
    u
}

pub fn units(v: &Value) -> Vec<RuchJednostka> {
    v.as_array().expect("jednostki").iter().map(unit).collect()
}
