//! P6.M06B1 - limit `przebiegi_wygladzania` = 12 (web `thickenCoastAndSmoothInlets` (a), gen-helpers.ts:4852)
//! Runda 2 (NAPRAW 1). Wektory `p6_m06b1_vectors/web-cap.json` z URUCHOMIONEGO weba (pin `edb8fb56`, cap 12),
//! generator `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/gen-m06b1-cap-vectors.mjs`,
//! wejscie: `evidence-r2-cap-both.json` (`m06b1-r2-cap-search.mjs`, LCG 12345).
//!
//! Dowod obserwowalnosci capu: na mapie `cap-thick-m0-cap12` kopie weba z capem 11 i 13 daja INNY stan koncowy
//! (flagi `ref_cap11.differs_from_cap12`, `ref_cap13.differs_from_cap12` = true). Zatem test Rust
//! sprawdzajacy stan wzgledem cap 12 zabija mutanty cap 11 (M16) i cap 13 (M17).

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use std::sync::OnceLock;

use civ_engine::domain::mapgen::landsea::thicken_coast_and_smooth_inlets_default;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use common::{assert_f64, dump, fv, nakladka_from, s, terrain_from};
use serde_json::Value;

const CAP: &str = include_str!("p6_m06b1_vectors/web-cap.json");

fn cap() -> &'static Value {
    static C: OnceLock<Value> = OnceLock::new();
    C.get_or_init(|| serde_json::from_str(CAP).expect("web-cap parse"))
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

#[test]
fn cap12_thicken_maps_match_web_cap12() {
    let cs = cap()["cases"]["thicken"].as_array().expect("thicken");
    assert!(cs.len() >= 3, "za malo przypadkow cap: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let mi = c["mi"].as_u64().expect("mi") as usize;
        let rows = cap()["maps"][mi].as_array().expect("mapa");
        let mut hx = build_rows(rows);
        let w = c["W"].as_i64().expect("W");
        let h = c["H"].as_i64().expect("H");
        let ret = thicken_coast_and_smooth_inlets_default(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

/// Obserwowalnosc capu (dane z weba): na pierwszej mapie cap 11 i cap 13 daja stan rozny od cap 12.
/// Bez tego wektora mutanty M16/M17 przezywaja (wyjscie niezalezne od capu).
#[test]
fn cap_11_and_13_differ_from_cap_12_on_web_map() {
    let c = &cap()["cases"]["thicken"][0];
    assert_eq!(c["ref_cap11"]["differs_from_cap12"], Value::Bool(true));
    assert_eq!(c["ref_cap13"]["differs_from_cap12"], Value::Bool(true));
}
