//! P6.M06B1 - finalizacja wybrzeza i wod srodladowych: `purgeReliefValleyWater` (gen-helpers.ts:4724),
//! `trimDeepOceanBays` (:4761), `finalizeCoastAndInlandWater` (:4787), `thickenCoastAndSmoothInlets`
//! (:4840), `flattenFalseCoastalRiverNotches` (:4915). Wektory z URUCHOMIONEGO weba (pin `edb8fb56`),
//! generator `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1/gen-m06b1-vectors.mjs`.
//! Kazdy przypadek: stan wejsciowy = mapa z tablicy (round-trip), wyjscie = zwrot + stan po wywolaniu.

#[path = "p6_m06b1_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::landsea::{
    finalize_coast_and_inland_water, flatten_false_coastal_river_notches,
    purge_relief_valley_water, thicken_coast_and_smooth_inlets,
    thicken_coast_and_smooth_inlets_default, trim_deep_ocean_bays,
};
use common::{assert_f64, build_map, cases, dims, dump, fv, map_index, stat};
use serde_json::Value;

fn check_input(id: &str, idx: usize) {
    let hx = build_map(idx);
    assert_eq!(
        dump(&hx),
        Value::Array(common::map_rows(idx).clone()),
        "{id}: round-trip stanu wejsciowego"
    );
}

#[test]
fn purge_relief_valley_water_matches_web() {
    let cs = cases("purge");
    assert!(cs.len() >= 200, "za malo przypadkow purge: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(id, idx);
        let mut hx = build_map(idx);
        let (w, h) = dims(c);
        let ret = purge_relief_valley_water(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

#[test]
fn trim_deep_ocean_bays_matches_web() {
    let cs = cases("trim");
    assert!(cs.len() >= 60, "za malo przypadkow trim: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(id, idx);
        let mut hx = build_map(idx);
        let (w, h) = dims(c);
        let ret = trim_deep_ocean_bays(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

#[test]
fn finalize_coast_and_inland_water_matches_web() {
    let cs = cases("finalize");
    assert!(cs.len() >= 300, "za malo przypadkow finalize: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(id, idx);
        let mut hx = build_map(idx);
        let (w, h) = dims(c);
        let max_passes = c["maxPasses"].as_u64().expect("maxPasses") as usize;
        let pool = c["pool"].as_u64().map(|p| p as usize);
        finalize_coast_and_inland_water(&mut hx, w, h, max_passes, pool);
        assert_eq!(dump(&hx), c["output"]["state"], "{id}: stan");
    }
}

#[test]
fn thicken_coast_and_smooth_inlets_matches_web() {
    let cs = cases("thicken");
    assert!(cs.len() >= 250, "za malo przypadkow thicken: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(id, idx);
        let mut hx = build_map(idx);
        let (w, h) = dims(c);
        let ret = if c["coastWidth"].as_str() == Some("default") {
            thicken_coast_and_smooth_inlets_default(&mut hx, w, h)
        } else {
            let cw = c["coastWidth"].as_u64().expect("coastWidth") as usize;
            thicken_coast_and_smooth_inlets(&mut hx, w, h, cw)
        };
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

#[test]
fn flatten_false_coastal_river_notches_matches_web() {
    let cs = cases("flatten");
    assert!(cs.len() >= 80, "za malo przypadkow flatten: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(id, idx);
        let mut hx = build_map(idx);
        let (w, h) = dims(c);
        let ret = flatten_false_coastal_river_notches(&mut hx, w, h);
        let out = &c["output"];
        assert_f64(ret as f64, fv(&out["ret"]), &format!("{id}: zwrot"));
        assert_eq!(dump(&hx), out["state"], "{id}: stan");
    }
}

/// Granice progow (N-1 / N / N+1) musza byc zmierzone w wektorach: liczba trafien w statystykach
/// generatora. Dla `morzeN >= 5` (flatten) i `>= 4` (thicken a) oraz dla progow purge.
#[test]
fn coast_thresholds_have_boundary_hits() {
    for name in [
        "flat_morze_eq4",
        "flat_morze_eq5",
        "flat_morze_eq6",
        "thick_land_eq3",
        "thick_land_eq4",
        "thick_land_eq5",
        "purge_relief_lt",
        "purge_relief_eq",
        "purge_relief_gt",
        "purge_dry_lt",
        "purge_dry_eq",
        "purge_dry_gt",
    ] {
        assert!(stat(name) > 0, "brak trafien granicy {name}");
    }
}

/// Wlasnosci progu `morzeN >= 5` na mapie 7x7 (srodek Plytkie, bez rzeki, 6 sasiadow):
/// k = 4 nie zamienia, k = 5 zamienia, k = 6 zamienia; z rzeka nic nie zamienia.
#[test]
fn flatten_threshold_is_five_on_targeted_maps() {
    let cs = cases("flatten");
    let find = |id: &str| {
        cs.iter()
            .find(|c| c["id"].as_str() == Some(id))
            .unwrap_or_else(|| panic!("brak przypadku {id}"))
    };
    for (id, expected) in [
        ("flat-t-k4-r0", 0.0),
        ("flat-t-k5-r0", 1.0),
        ("flat-t-k6-r0", 1.0),
        ("flat-t-k5-r1", 0.0),
    ] {
        let c = find(id);
        let mut hx = build_map(map_index(c));
        let (w, h) = dims(c);
        let ret = flatten_false_coastal_river_notches(&mut hx, w, h);
        assert_f64(ret as f64, expected, id);
    }
}
