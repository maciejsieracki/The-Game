//! P6.M06B1 - limit `przebiegi_wygladzania` = 12 (web `thickenCoastAndSmoothInlets` (a), gen-helpers.ts:4852)
//! Runda 3 (poprawka po FC r2, zarzut 4). Wektory `p6_m06b1_vectors/web-cap.json` z URUCHOMIONEGO weba
//! (pin `edb8fb56`): trzy kopie kodu weba (limit 11 / 12 pristine / 13), generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/gen-m06b1-cap-vectors.mjs`,
//! wejscie `cap-picks.json` (`m06b1-r3-cap-pick.mjs`, LCG 12345: 10 map, na ktorych cap 11 i cap 13
//! daja wynik inny niz cap 12).
//!
//! Testy sprawdzaja ZACHOWANIE kodu Rust, nie flagi z JSON:
//!  (1) `cap12_thicken_maps_match_web_cap12`: domyslna funkcja (limit z tabeli JSON) == web cap 12;
//!  (2) `explicit_passes_match_web_cap11_12_13`: jawny limit 11 / 12 / 13 == web cap 11 / 12 / 13 (stan + zwrot);
//!  (3) `cap_is_observable_in_rust_on_web_maps`: Rust daje rozny wynik dla cap 11 i 13 wzgledem 12 na
//!      wektorach rozroznialnych (wynik policzony w Rust, zgodnosc z flagami weba jest dodatkowa).
//! Mutanty M15/M16/M17 (limit petli 1 / 11 / 13) i M24 (JSON 12 -> 11) musza byc zabite przez (1)-(3).

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use std::sync::OnceLock;

use civ_engine::domain::mapgen::landsea::{
    thicken_coast_and_smooth_inlets_default, thicken_coast_and_smooth_inlets_with_passes,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use common::{assert_f64, dump, fv, nakladka_from, s, terrain_from};
use serde_json::Value;

const CAP: &str = include_str!("p6_m06b1_vectors/web-cap.json");
/// Szerokosc wybrzeza z tabeli JSON (`szerokosc_wybrzeza_domyslna`, web `coastWidth = 2`).
const COAST_WIDTH_DEFAULT: usize = 2;

fn cap() -> &'static Value {
    static C: OnceLock<Value> = OnceLock::new();
    C.get_or_init(|| serde_json::from_str(CAP).expect("web-cap parse"))
}

fn cap_cases() -> &'static Vec<Value> {
    cap()["cases"]["thicken"].as_array().expect("thicken")
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

fn map_of(c: &Value) -> HexRecord {
    let mi = c["mi"].as_u64().expect("mi") as usize;
    build_rows(cap()["maps"][mi].as_array().expect("mapa"))
}

fn dims(c: &Value) -> (i64, i64) {
    (c["W"].as_i64().expect("W"), c["H"].as_i64().expect("H"))
}

/// Stan Rust w formacie wektora, do porownania z wektorem weba.
fn state_of(hx: &HexRecord) -> Value {
    dump(hx)
}

#[test]
fn cap12_thicken_maps_match_web_cap12() {
    let cs = cap_cases();
    assert!(cs.len() >= 13, "za malo przypadkow cap: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let (w, h) = dims(c);
        let mut hx = map_of(c);
        let ret = thicken_coast_and_smooth_inlets_default(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(state_of(&hx), out["state"], "{id}: stan");
    }
}

#[test]
fn explicit_passes_match_web_cap11_12_13() {
    for c in cap_cases() {
        let id = c["id"].as_str().unwrap_or("?");
        let (w, h) = dims(c);
        for (passes, key) in [
            (11usize, "output_cap11"),
            (12, "output"),
            (13, "output_cap13"),
        ] {
            let mut hx = map_of(c);
            let ret = thicken_coast_and_smooth_inlets_with_passes(
                &mut hx,
                w,
                h,
                COAST_WIDTH_DEFAULT,
                passes,
            );
            let out = &c[key];
            assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}/{key}: zwrot"));
            assert_eq!(state_of(&hx), out["state"], "{id}/{key}: stan");
        }
    }
}

#[test]
fn cap_is_observable_in_rust_on_web_maps() {
    let mut distinguishing = 0usize;
    for c in cap_cases() {
        if c["kind"].as_str() != Some("distinguishing") {
            continue;
        }
        distinguishing += 1;
        let id = c["id"].as_str().unwrap_or("?");
        let (w, h) = dims(c);
        let run = |passes: usize| {
            let mut hx = map_of(c);
            thicken_coast_and_smooth_inlets_with_passes(&mut hx, w, h, COAST_WIDTH_DEFAULT, passes);
            state_of(&hx)
        };
        let s11 = run(11);
        let s12 = run(12);
        let s13 = run(13);
        assert_ne!(
            s11, s12,
            "{id}: Rust cap 11 musi dawac inny stan niz cap 12"
        );
        assert_ne!(
            s13, s12,
            "{id}: Rust cap 13 musi dawac inny stan niz cap 12"
        );
        assert_eq!(
            c["differs_cap11"],
            Value::Bool(true),
            "{id}: flaga weba cap 11"
        );
        assert_eq!(
            c["differs_cap13"],
            Value::Bool(true),
            "{id}: flaga weba cap 13"
        );
    }
    assert!(
        distinguishing >= 10,
        "za malo map rozrozniajacych cap: {distinguishing}"
    );
}
