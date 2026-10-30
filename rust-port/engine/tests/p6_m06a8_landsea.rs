//! P6.M06A8 (partia 1, R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1) - testy portu
//! `groupDryLandMassKeys` (gen-helpers.ts :4338) i `ensurePangeaSingleContinent` (:4375)
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`, instrumentowana kopia; fill :4595 = 0).
//! Wektory: `tests/p6_m06a8_vectors/ensure-vectors.json` (generator `gen-m06a8-landsea-vectors.mjs`).
//! Rodziny (prefiks = kategoria): losowe, granica-mostu (N-1/N/N+1), prog-masy (T-1/T/T+1), wyspy, brzeg.

use std::sync::OnceLock;

use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::landsea::{
    ensure_pangea_single_continent, group_dry_land_mass_keys,
};
use civ_engine::domain::mapgen::terrain_class::{HexRecord, TerrainHex};
use serde_json::Value;

const ENSURE_VECTORS: &str = include_str!("p6_m06a8_vectors/ensure-vectors.json");

fn cases() -> &'static Vec<Value> {
    static CELL: OnceLock<Value> = OnceLock::new();
    let v = CELL.get_or_init(|| serde_json::from_str(ENSURE_VECTORS).expect("wektory parsuja"));
    v["cases"].as_array().expect("tablica cases")
}

fn terrain_of(name: &str) -> Terrain {
    serde_json::from_value(Value::String(name.to_string())).expect("nazwa TerenBazowy")
}

/// Buduje HexRecord w kolejnosci wstawiania z wektora (`order` = [[klucz, nazwa], ...]).
fn build_hexes(order: &[Value]) -> HexRecord {
    let mut hexes = HexRecord::new();
    for pair in order {
        let key = pair[0].as_str().expect("klucz").to_string();
        let name = pair[1].as_str().expect("nazwa");
        let mut parts = key.split(',');
        let q: i64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
        let r: i64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
        hexes.insert(key, TerrainHex::new(q, r, terrain_of(name)));
    }
    hexes
}

fn terrain_name(t: Terrain) -> String {
    serde_json::to_value(t)
        .expect("serializacja Terrain")
        .as_str()
        .expect("nazwa")
        .to_string()
}

#[test]
fn vector_file_has_expected_families_and_size() {
    let all = cases();
    assert_eq!(all.len(), 418, "liczba przypadkow zgodna z generatorem");
    let count = |fam: &str| all.iter().filter(|c| c["family"] == fam).count();
    assert_eq!(count("losowe"), 160);
    assert_eq!(count("granica-mostu"), 210);
    assert_eq!(count("prog-masy"), 12);
    assert_eq!(count("wyspy"), 30);
    assert_eq!(count("brzeg"), 6);
}

#[test]
fn group_dry_land_mass_keys_matches_web() {
    let mut mismatches = Vec::new();
    for c in cases() {
        let hexes = build_hexes(c["order"].as_array().expect("order"));
        let got = group_dry_land_mass_keys(&hexes);
        let expected: Vec<Vec<String>> = c["group"]
            .as_array()
            .expect("group")
            .iter()
            .map(|m| {
                m.as_array()
                    .expect("masa")
                    .iter()
                    .map(|k| k.as_str().expect("klucz").to_string())
                    .collect()
            })
            .collect();
        if got != expected && mismatches.len() < 5 {
            mismatches.push(format!("{}: web={expected:?} rust={got:?}", c["id"]));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci group: {mismatches:#?}");
}

#[test]
fn ensure_pangea_single_continent_matches_web_with_fill_hook_zero() {
    let mut mismatches = Vec::new();
    for c in cases() {
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let converted = ensure_pangea_single_continent(&mut hexes, w, h, |_, _, _| 0);
        let got_after: Vec<(String, String)> = hexes
            .iter()
            .map(|(k, hex)| (k.clone(), terrain_name(hex.terrain)))
            .collect();
        let expected_after: Vec<(String, String)> = c["after"]
            .as_array()
            .expect("after")
            .iter()
            .map(|p| {
                (
                    p[0].as_str().expect("klucz").to_string(),
                    p[1].as_str().expect("nazwa").to_string(),
                )
            })
            .collect();
        let expected_converted = c["converted"].as_u64().expect("converted") as usize;
        if (converted != expected_converted || got_after != expected_after) && mismatches.len() < 5
        {
            mismatches.push(format!(
                "{} ({}x{}): web_converted={expected_converted} rust_converted={converted}",
                c["id"], w, h
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci ensure: {mismatches:#?}"
    );
}

#[test]
fn ensure_pangea_invokes_fill_hook_exactly_once_with_map_size() {
    // Hook (RUNDA-2 fill) dostaje te same wymiary i wynik dodawany jest do `converted`.
    let c = cases()
        .iter()
        .find(|c| c["family"] == "granica-mostu")
        .expect("przypadek granica-mostu");
    let w = c["w"].as_i64().expect("w");
    let h = c["h"].as_i64().expect("h");
    let mut hexes = build_hexes(c["order"].as_array().expect("order"));
    let mut calls = 0usize;
    let converted = ensure_pangea_single_continent(&mut hexes, w, h, |_, fw, fh| {
        calls += 1;
        assert_eq!((fw, fh), (w, h));
        7
    });
    let base = c["converted"].as_u64().expect("converted") as usize;
    assert_eq!(calls, 1);
    assert_eq!(converted, base + 7);
}

#[test]
fn bridge_boundary_n_minus_1_n_n_plus_1_are_distinguishable() {
    // Dla tej samej mapy (w = h = s) i pasa wody G = N-1 / N / N+1: przy G <= N most (Laka w pasie),
    // przy G = N+1 pas pozostaje Morzem. Sprawdzamy to na wektorach granica-mostu.
    let mut by_s: std::collections::BTreeMap<(i64, i64), Vec<(i64, bool)>> = Default::default();
    for c in cases().iter().filter(|c| c["family"] == "granica-mostu") {
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let mut hexes = build_hexes(c["order"].as_array().expect("order"));
        let _ = ensure_pangea_single_continent(&mut hexes, w, h, |_, _, _| 0);
        // Pas wody = kolumna 1 albo 2 zalezy od `a`; sprawdzamy komorke (a, 0), gdzie a = pierwsza
        // kolumna wody w wejsciu.
        let first_water_col = c["order"]
            .as_array()
            .expect("order")
            .iter()
            .find(|p| p[1] == "PlytkieMorze")
            .map(|p| p[0].as_str().expect("klucz"))
            .expect("pas wody")
            .split(',')
            .next()
            .expect("q")
            .parse::<i64>()
            .expect("q liczba");
        // Most = sciezka wody w JEDNYM wierszu (BFS trafia pierwszy obcy heks w danym wierszu),
        // wiec sprawdzamy, czy ktorykolwiek wiersz ma Laka w pierwszej kolumnie wody.
        let bridged = (0..h).any(|r| {
            hexes
                .get(&format!("{first_water_col},{r}"))
                .is_some_and(|hx| hx.terrain == Terrain::Grassland)
        });
        let gap = {
            let n = c["n_most"].as_i64().expect("n");
            let cols = c["order"]
                .as_array()
                .expect("order")
                .iter()
                .filter(|p| p[1] == "PlytkieMorze" && p[0].as_str().expect("k").ends_with(",0"))
                .count() as i64;
            (cols, n)
        };
        by_s.entry((w, h)).or_default().push((gap.0, bridged));
    }
    assert!(!by_s.is_empty());
    // Dla kazdej kombinacji: pas dluzszy niz N nie jest mostem, pas <= N jest mostem.
    for ((w, h), rows) in &by_s {
        for &(gap, bridged) in rows {
            let n = cases()
                .iter()
                .find(|c| c["w"] == *w && c["h"] == *h && c["family"] == "granica-mostu")
                .map(|c| c["n_most"].as_i64().expect("n"))
                .expect("n");
            if gap <= n {
                assert!(bridged, "w={w} h={h} gap={gap} N={n}: oczekiwany most");
            } else {
                assert!(
                    !bridged,
                    "w={w} h={h} gap={gap} N={n}: brak mostu oczekiwany"
                );
            }
        }
    }
}
