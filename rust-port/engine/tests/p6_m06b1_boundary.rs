//! P6.M06B1 - przypadki GRANIC (Operator-pomiary r1): wektory `p6_m06b1_vectors/web-boundary.json`
//! z URUCHOMIONEGO weba (pin `edb8fb56`), generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/gen-m06b1-boundary-vectors.mjs`.
//! Przypadki:
//!  - `thickenCoastAndSmoothInlets` (:4840), mapa z naturalnie 25 przebiegami czesci (a). Cap 12
//!    (`przebiegi_wygladzania`) NIE zmienia wyniku koncowego na tej mapie (pomiar: cap 11/12/13/bez
//!    limitu daja identyczny stan); mutacje capu 11/13 przezywaja. Patrz dokument, sekcja granic.
//!  - `finalizeCoastAndInlandWater` (:4787), mapa z roznica out(maxPasses=2) != out(1) przy puli 2;
//!    maxPasses 1..5 z pula 2 i bez puli.
//!
//! Stare wektory (`web-vectors.json`) NIE sa zmieniane; ten plik to osobny zbior.

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use std::sync::OnceLock;

use civ_engine::domain::mapgen::landsea::{
    finalize_coast_and_inland_water, thicken_coast_and_smooth_inlets_default,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use common::{assert_f64, dump, fv, nakladka_from, s, terrain_from};
use serde_json::Value;

const BOUNDARY: &str = include_str!("p6_m06b1_vectors/web-boundary.json");

fn boundary() -> &'static Value {
    static B: OnceLock<Value> = OnceLock::new();
    B.get_or_init(|| serde_json::from_str(BOUNDARY).expect("web-boundary parse"))
}

fn map_rows(mi: usize) -> &'static Vec<Value> {
    boundary()["maps"][mi]
        .as_array()
        .unwrap_or_else(|| panic!("brak mapy granicznej {mi}"))
}

fn build_rows(rows: &[Value]) -> HexRecord {
    let mut hexes = HexRecord::new();
    for row in rows {
        let key = s(&row[0]).to_string();
        let mut parts = key.split(',');
        let q = parts.next().expect("q").parse::<i64>().expect("q");
        let r = parts.next().expect("r").parse::<i64>().expect("r");
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
        hexes.insert(key, hex);
    }
    hexes
}

fn dims(c: &Value) -> (i64, i64) {
    (c["W"].as_i64().expect("W"), c["H"].as_i64().expect("H"))
}

#[test]
fn boundary_thicken_natural_25_passes_cap12_matches_web() {
    let cs = boundary()["cases"]["thicken"].as_array().expect("thicken");
    assert!(!cs.is_empty(), "brak przypadkow granicznych thicken");
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let mi = c["mi"].as_u64().expect("mi") as usize;
        let mut hx = build_rows(map_rows(mi));
        let (w, h) = dims(c);
        let ret = thicken_coast_and_smooth_inlets_default(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

#[test]
fn boundary_finalize_pool2_maxpasses_1_to_5_matches_web() {
    let cs = boundary()["cases"]["finalize"]
        .as_array()
        .expect("finalize");
    assert!(
        cs.len() >= 10,
        "za malo przypadkow granicznych finalize: {}",
        cs.len()
    );
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let mi = c["mi"].as_u64().expect("mi") as usize;
        let mut hx = build_rows(map_rows(mi));
        let (w, h) = dims(c);
        let max_passes = c["maxPasses"].as_u64().expect("maxPasses") as usize;
        let pool = c["pool"].as_u64().map(|p| p as usize);
        finalize_coast_and_inland_water(&mut hx, w, h, max_passes, pool);
        assert_eq!(dump(&hx), c["output"]["state"], "{id}: stan");
    }
}

/// Granica maxPasses: w webie wynik dla puli 2 zmienia sie miedzy przebiegiem 1 a 2
/// (dowod, ze wektor rozrozni N-1 od N). Sprawdzane na danych z weba, nie na kodzie portu.
#[test]
fn boundary_finalize_pool2_p1_differs_from_p2_in_web() {
    let cs = boundary()["cases"]["finalize"]
        .as_array()
        .expect("finalize");
    let state = |id: &str| -> &Value {
        &cs.iter()
            .find(|c| c["id"].as_str() == Some(id))
            .expect("id")["output"]["state"]
    };
    assert_ne!(state("bnd-fin-pool2-p1"), state("bnd-fin-pool2-p2"));
}
