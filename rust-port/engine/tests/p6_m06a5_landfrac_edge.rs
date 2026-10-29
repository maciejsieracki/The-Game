//! P6.M06A5 (partia 1, runda 2, R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1) - wektory brzegowe rodziny
//! ulamka lądu. Domkniecie luk Z-1..Z-4 z pomiaru Evaluatora:
//! - NaN (web: porownania z NaN falszywe -> brak zmian w `applyLandFractionByScore`),
//! - granica `tolerancja_score_sortowanie` (0.04) przy dokladnej roznicy f64 (pary 0.0 / 0.04),
//! - brakujacy klucz w `landScores` (web `?? 0`),
//! - progi clamp udzialu (0.15 / 0.85) i ich N-1 / N+1 (rozstrzygane przez dobor rozmiaru mapy),
//! - okno tolerancji `tolerancja_odleglosci_centrum` (0.015) w (0.015, 0.0151] i (0.0149, 0.015].
//!
//! Wektory: `tests/p6_m06a5_vectors/landfrac-edge-vectors.json` (generator
//! `gen-m06a5-landfrac-edge-vectors.mjs`, seed 20261101, oczekiwania z URUCHOMIONEGO weba, pin `edb8fb56`).
//!
//! Plik `landfrac-vectors.json` i jego testy pozostaja nietkniete.

use std::collections::HashMap;
use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    apply_land_fraction_by_score, rebalance_land_fraction_with_margins, sort_land_keys_for_erosion,
    LandFractionFillBias,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const EDGE_VECTORS: &str = include_str!("p6_m06a5_vectors/landfrac-edge-vectors.json");

fn vectors() -> &'static Value {
    static V: OnceLock<Value> = OnceLock::new();
    V.get_or_init(|| serde_json::from_str(EDGE_VECTORS).expect("edge vectors parse"))
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

/// Liczba JSON albo string "NaN" (JSON nie koduje NaN).
fn target_of(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("target"),
    }
}

fn dims_of(v: &Value) -> Option<(i64, i64)> {
    match v {
        Value::Null => None,
        d => Some((d[0].as_i64().unwrap(), d[1].as_i64().unwrap())),
    }
}

fn fill_of(v: &Value) -> LandFractionFillBias {
    match v.as_str().unwrap() {
        "center" => LandFractionFillBias::Center,
        "mask" => LandFractionFillBias::Mask,
        other => panic!("fill {other}"),
    }
}

fn keys_of(v: &Value) -> Vec<String> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|k| k.as_str().unwrap().to_owned())
        .collect()
}

/// Z-1: NaN w `applyLandFractionByScore` -> 0 zmian, mapa identyczna (web: porownania z NaN falszywe).
#[test]
fn apply_nan_target_changes_nothing() {
    let cs = cases("apply_nan");
    assert!(!cs.is_empty());
    for c in cs {
        let before = dump_terrains(&build_map(&c["map"]));
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let target = target_of(&c["target"]);
        assert!(target.is_nan());
        let adjusted = apply_land_fraction_by_score(
            &mut hexes,
            &scores,
            target,
            dims_of(&c["dims"]),
            fill_of(&c["fill"]),
            c["min"].as_f64().unwrap(),
        );
        assert_eq!(adjusted, 0, "przypadek {}", c["id"]);
        assert_eq!(
            dump_terrains(&hexes),
            before,
            "mapa bez zmian, przypadek {}",
            c["id"]
        );
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "web adjusted, przypadek {}",
            c["id"]
        );
    }
}

/// Z-1: NaN w `rebalanceLandFractionWithMargins` -> wynik zgodny z webem (caps/ocean/pierscien dalej dzialaja).
#[test]
fn rebalance_nan_target_matches_web() {
    let cs = cases("rebalance_nan");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let target = target_of(&c["target"]);
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

/// Z-2 / Z-4: granica tolerancji score (0.04). Pary (0.0, 0.04) maja roznice f64 == 0.04 dokladnie.
#[test]
fn apply_score_tolerance_boundary_matches_web() {
    let cs = cases("apply_tie");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let adjusted = apply_land_fraction_by_score(
            &mut hexes,
            &scores,
            c["target"].as_f64().unwrap(),
            dims_of(&c["dims"]),
            fill_of(&c["fill"]),
            c["min"].as_f64().unwrap(),
        );
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "przypadek {}",
            c["id"]
        );
    }
}

/// Z-3: brakujacy klucz w landScores -> `?? 0` (web), nie 1.
#[test]
fn apply_missing_score_defaults_to_zero_like_web() {
    let cs = cases("apply_missing");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let adjusted = apply_land_fraction_by_score(
            &mut hexes,
            &scores,
            c["target"].as_f64().unwrap(),
            dims_of(&c["dims"]),
            fill_of(&c["fill"]),
            c["min"].as_f64().unwrap(),
        );
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "przypadek {}",
            c["id"]
        );
    }
}

/// Z-3: sortowanie erozji z brakujacymi score (`?? 0`).
#[test]
fn sort_missing_score_defaults_to_zero_like_web() {
    let cs = cases("sort_missing");
    assert!(!cs.is_empty());
    for c in cs {
        let hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let keys = keys_of(&c["keys"]);
        let (w, h) = dims_of(&c["dims"]).unwrap();
        let got = sort_land_keys_for_erosion(&keys, &hexes, &scores, w, h);
        assert_eq!(got, keys_of(&c["expect"]), "przypadek {}", c["id"]);
    }
}

/// Z-4: progi clamp 0.15 / 0.85 i ich sasiedzi 0.1499 / 0.1501 / 0.8499 / 0.8501 (mapy dobrane tak,
/// ze zaokraglenie `Math.round(t*clamp)` rozni sie miedzy wartosciami progowymi).
#[test]
fn apply_clamp_thresholds_match_web() {
    let cs = cases("apply_clamp");
    assert!(!cs.is_empty());
    for c in cs {
        let mut hexes = build_map(&c["map"]);
        let scores = build_scores(&c["scores"]);
        let adjusted = apply_land_fraction_by_score(
            &mut hexes,
            &scores,
            target_of(&c["target"]),
            dims_of(&c["dims"]),
            fill_of(&c["fill"]),
            c["min"].as_f64().unwrap(),
        );
        assert_eq!(
            adjusted,
            c["expect"]["adjusted"].as_u64().unwrap() as usize,
            "przypadek {}",
            c["id"]
        );
        assert_eq!(
            dump_terrains(&hexes),
            expected_terrains(&c["expect"]["terrains"]),
            "przypadek {}",
            c["id"]
        );
    }
}

/// Z-4: okno `tolerancja_odleglosci_centrum` (0.015): pary o tym samym brzegu i |ca-cb| tuz powyzej
/// i tuz ponizej 0.015; galaz rangi erozji rozstrzyga inaczej niz galaz odleglosci.
#[test]
fn sort_center_tolerance_window_matches_web() {
    let cs = cases("sort_tol_centrum");
    assert!(!cs.is_empty());
    for c in cs {
        let hexes = build_map(&c["map"]);
        let keys = keys_of(&c["keys"]);
        let (w, h) = dims_of(&c["dims"]).unwrap();
        let got = sort_land_keys_for_erosion(&keys, &hexes, &HashMap::new(), w, h);
        assert_eq!(got, keys_of(&c["expect"]), "przypadek {}", c["id"]);
    }
}
