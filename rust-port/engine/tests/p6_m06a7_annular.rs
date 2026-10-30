//! P6.M06A7 (partia 1, R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1) - testy portu
//! `pangeaAnnularMaxCorridorWidth` (gen-helpers.ts :4329) i `isPangeaBridgeWater` (:4371)
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`, instrumentowana kopia).
//! Wektory: `tests/p6_m06a7_vectors/*.json` (generator `gen-m06a7-annular-vectors.mjs`).
//! NaN / Infinity w wektorach zapisane jako napisy "NaN" / "Infinity" / "-Infinity".

use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    is_pangea_bridge_water, pangea_annular_max_corridor_width,
};
use serde_json::Value;

const ANNULAR_VECTORS: &str = include_str!("p6_m06a7_vectors/annular-vectors.json");
const BRIDGE_VECTORS: &str = include_str!("p6_m06a7_vectors/bridge-vectors.json");

fn annular_cases() -> &'static Vec<Value> {
    static CELL: OnceLock<Value> = OnceLock::new();
    let v = CELL.get_or_init(|| serde_json::from_str(ANNULAR_VECTORS).expect("annular parsuje"));
    v["cases"]["annular"].as_array().expect("przypadki annular")
}

fn bridge_cases() -> &'static Vec<Value> {
    static CELL: OnceLock<Value> = OnceLock::new();
    let v = CELL.get_or_init(|| serde_json::from_str(BRIDGE_VECTORS).expect("bridge parsuje"));
    v["cases"]["bridge"].as_array().expect("przypadki bridge")
}

/// Liczba JS z wektora: liczba albo napis "NaN" / "Infinity" / "-Infinity".
fn js_num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy {other}"),
        },
        other => panic!("nieoczekiwany typ {other}"),
    }
}

#[test]
fn annular_vectors_match_web_bit_for_bit() {
    let cases = annular_cases();
    assert!(
        cases.len() > 100_000,
        "zbyt mala siatka wektorow: {}",
        cases.len()
    );
    let mut mismatches = Vec::new();
    for c in cases {
        let a = c.as_array().expect("wiersz");
        let (w, h) = (js_num(&a[0]), js_num(&a[1]));
        let expected = js_num(&a[2]);
        let got = pangea_annular_max_corridor_width(w, h);
        let same = (got.is_nan() && expected.is_nan()) || got == expected;
        if !same && mismatches.len() < 10 {
            mismatches.push(format!("w={w} h={h} web={expected} rust={got}"));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci: {mismatches:?}");
}

#[test]
fn annular_boundary_values_hit_round_and_clamp_thresholds() {
    // Konkretne punkty progow (wartosci potwierdzone przez wektory z weba):
    // mala mapa -> dolny clamp 6; duza mapa -> gorny clamp 22.
    assert_eq!(pangea_annular_max_corridor_width(0.0, 0.0), 6.0);
    assert_eq!(pangea_annular_max_corridor_width(10.0, 10.0), 6.0);
    assert_eq!(pangea_annular_max_corridor_width(4096.0, 4096.0), 22.0);
    // Prog Math.round: raw = 6 + sqrt(w*h/20160)*2.6 ~ 6.4998 dla (1,745) -> 6,
    // ~ 6.5001 dla (1,746) -> 7 (zaokraglenie polowki w gore, jak Math.round).
    assert_eq!(pangea_annular_max_corridor_width(1.0, 745.0), 6.0);
    assert_eq!(pangea_annular_max_corridor_width(1.0, 746.0), 7.0);
}

#[test]
fn annular_nonfinite_and_negative_inputs_propagate_nan_like_web() {
    assert!(pangea_annular_max_corridor_width(f64::NAN, 10.0).is_nan());
    assert!(pangea_annular_max_corridor_width(10.0, f64::NAN).is_nan());
    // Ujemne * ujemne = dodatnie iloczyn (10000): nie NaN, tylko 8 (jak w webie).
    assert_eq!(pangea_annular_max_corridor_width(-100.0, -100.0), 8.0);
    assert!(pangea_annular_max_corridor_width(-1.0, 100.0).is_nan());
    assert_eq!(pangea_annular_max_corridor_width(f64::INFINITY, 10.0), 22.0);
}

#[test]
fn bridge_water_matches_web_for_every_base_terrain() {
    let cases = bridge_cases();
    assert_eq!(cases.len(), 8, "osiem wartosci TerenBazowy");
    for c in cases {
        let a = c.as_array().expect("wiersz");
        let terrain: Terrain = serde_json::from_value(a[0].clone()).expect("terrain");
        let expected = a[1].as_bool().expect("bool");
        assert_eq!(is_pangea_bridge_water(terrain), expected, "{terrain:?}");
    }
    // Most przez Morze i Wybrzeze (PlytkieMorze) - tylko wody; lad nie jest mostem.
    assert!(is_pangea_bridge_water(Terrain::Sea));
    assert!(is_pangea_bridge_water(Terrain::ShallowSea));
    assert!(!is_pangea_bridge_water(Terrain::Grassland));
}
