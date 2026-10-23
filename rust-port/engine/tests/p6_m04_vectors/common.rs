//! Wspolne narzedzia testow P6.M04 (dolaczane przez `#[path]`; plik lezy w `p6_m04_vectors/`, wiec
//! nie jest osobnym crate'm testowym). Wektory: `web-vectors.json` z URUCHOMIONEGO weba
//! (generator `gen-m04-vectors.mjs` w runie). Liczby f64 w wektorach sa TEKSTEM i porownujemy je
//! bit-w-bit (`to_bits`; wszystkie NaN sa dla JS jednym NaN, wiec sprowadzane do kanonicznego).
#![allow(dead_code)]

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::map_generator::{ClimateBand, Terrain, WorldType};
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::terrain_class::{
    HexRecord, Nakladka, TerrainClassifyThresholds, TerrainHex,
};
use serde_json::Value;

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

pub fn i(v: &Value) -> i64 {
    v.as_i64().expect("i64")
}

pub fn s(v: &Value) -> &str {
    v.as_str().expect("str")
}

/// f64 zapisany jako tekst (`Infinity`, `-Infinity`, `NaN`, `-0` tez).
pub fn fv(v: &Value) -> f64 {
    let t = s(v);
    match t {
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "NaN" => f64::NAN,
        "-0" => -0.0,
        _ => t.parse::<f64>().unwrap_or_else(|_| panic!("f64: {t}")),
    }
}

pub fn fv_opt(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(fv(v))
    }
}

/// Bity f64; kazdy NaN jest jednym NaN w JS (brak obserwowalnego ladunku).
pub fn bits(x: f64) -> u64 {
    if x.is_nan() {
        f64::NAN.to_bits()
    } else {
        x.to_bits()
    }
}

pub fn same_f64(a: f64, b: f64) -> bool {
    bits(a) == bits(b)
}

pub fn assert_f64(actual: f64, expected: f64, what: &str) {
    assert!(
        same_f64(actual, expected),
        "{what}: rust={actual:?} (0x{:016x}) web={expected:?} (0x{:016x})",
        bits(actual),
        bits(expected)
    );
}

pub fn fnv1a64(text: &str) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in text.as_bytes() {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

// ---------------------------------------------------------------------------------------------
// Slowniki enumow weba (kody numeryczne w wektorach: `enums.tb`, `enums.nak`)
// ---------------------------------------------------------------------------------------------

pub fn terrain_from_web(key: &str) -> Terrain {
    match key {
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "plytkie_morze" => Terrain::ShallowSea,
        "morze" => Terrain::Sea,
        "pustynia" => Terrain::Desert,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren weba {other}"),
    }
}

pub fn terrain_from_code(code: i64) -> Terrain {
    let list = web()["enums"]["tb"].as_array().expect("enums.tb");
    terrain_from_web(s(&list[usize::try_from(code).expect("kod tb")]))
}

pub fn nakladka_from_code(code: i64) -> Nakladka {
    let list = web()["enums"]["nak"].as_array().expect("enums.nak");
    Nakladka::from_key(s(&list[usize::try_from(code).expect("kod nak")])).expect("nakladka")
}

pub fn band_from_web(key: &str) -> ClimateBand {
    match key {
        "polar_north" => ClimateBand::PolarNorth,
        "temperate_north" => ClimateBand::TemperateNorth,
        "plains_north" => ClimateBand::PlainsNorth,
        "desert" => ClimateBand::Desert,
        "plains_south" => ClimateBand::PlainsSouth,
        "temperate_south" => ClimateBand::TemperateSouth,
        "polar_south" => ClimateBand::PolarSouth,
        other => panic!("nieznany pas {other}"),
    }
}

pub fn typ_from_web(key: &str) -> WorldType {
    match key {
        "kontynenty" => WorldType::Continents,
        "pangea" => WorldType::Pangea,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("nieznany typ swiata {other}"),
    }
}

pub fn tier_from_web(key: &str) -> DensityTier {
    DensityTier::from_key(key).unwrap_or_else(|| panic!("nieznany tier {key}"))
}

pub fn thresholds_from(v: &Value) -> Option<TerrainClassifyThresholds> {
    if v.is_null() {
        return None;
    }
    let o = v.as_object().expect("progi");
    let get = |k: &str| o.get(k).and_then(fv_opt);
    Some(TerrainClassifyThresholds {
        desert: get("desert"),
        forest: get("forest"),
        mountain: get("mountain"),
        highland: get("highland"),
    })
}

// ---------------------------------------------------------------------------------------------
// Mapy heksow: spec `[q, r, tb, nak, riv, zl]` -> HexRecord; porownanie ze stanem `[q,r,tb,nak,riv,edges,zl]`
// ---------------------------------------------------------------------------------------------

pub fn key_of(q: i64, r: i64) -> String {
    format!("{q},{r}")
}

pub fn spec_to_record(spec: &Value) -> HexRecord {
    let mut rec = HexRecord::new();
    for row in spec.as_array().expect("spec") {
        let a = row.as_array().expect("wiersz spec");
        let (q, r) = (i(&a[0]), i(&a[1]));
        let mut hex = TerrainHex::new(q, r, terrain_from_code(i(&a[2])));
        hex.overlay = nakladka_from_code(i(&a[3]));
        hex.river_present = i(&a[4]) == 1;
        if hex.river_present {
            hex.river_edges = vec![0, 3];
        }
        hex.has_deposit = i(&a[5]) == 1;
        rec.insert(key_of(q, r), hex);
    }
    rec
}

pub fn assert_hexes(actual: &HexRecord, expected: &Value, what: &str) {
    let exp = expected.as_array().expect("stan");
    assert_eq!(actual.len(), exp.len(), "{what}: liczba heksow");
    for (n, ((key, hex), row)) in actual.iter().zip(exp).enumerate() {
        let a = row.as_array().expect("wiersz");
        let (q, r) = (i(&a[0]), i(&a[1]));
        assert_eq!(key, &key_of(q, r), "{what}: kolejnosc/klucz #{n}");
        assert_eq!((hex.q, hex.r), (q, r), "{what}: coords #{n}");
        assert_eq!(
            hex.terrain,
            terrain_from_code(i(&a[2])),
            "{what}: teren {key}"
        );
        assert_eq!(
            hex.overlay,
            nakladka_from_code(i(&a[3])),
            "{what}: nakladka {key}"
        );
        assert_eq!(
            hex.river_present,
            i(&a[4]) == 1,
            "{what}: rzeka.obecna {key}"
        );
        assert_eq!(
            hex.river_edges.len(),
            usize::try_from(i(&a[5])).expect("krawedzie"),
            "{what}: rzeka.krawedzie {key}"
        );
        assert_eq!(hex.has_deposit, i(&a[6]) == 1, "{what}: zloze {key}");
    }
}

pub fn scores_map(v: &Value) -> HashMap<String, f64> {
    v.as_array()
        .expect("scores")
        .iter()
        .map(|p| (s(&p[0]).to_string(), fv(&p[1])))
        .collect()
}
