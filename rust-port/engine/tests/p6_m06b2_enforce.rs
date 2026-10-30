//! P6.M06B2 - `enforceTargetDryLandFraction` (gen-helpers.ts:5079) wzgledem wektorow z URUCHOMIONEGO
//! weba (pin `edb8fb56`). Wektory: `p6_m06b2_vectors/web-enforce.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/gen-m06b2-vectors.mjs`.
//! Przypadki: 12 map (18x18 lub 3x3 komorki), cele 0.14/0.15/0.16/0.5/0.85/0.86 oraz cele przy granicy
//! tolerancji (udzial wejscia +/- 2.5..5 pp), tolerancja 2/3/4 pp, fillBias center/mask.

#[path = "p6_m06b2_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::data::derived::mapgen_landsea_fill;
use civ_engine::domain::mapgen::landsea::{
    enforce_target_dry_land_fraction, enforce_target_dry_land_fraction_default,
    LandFractionFillBias,
};
use common::{
    build_map, cases, check_input, dims, dump, expected_state, load, map_index, map_rows,
    map_scores, s, WEB_CASES_ENFORCE, WEB_CASES_ENFORCE_LARGE, WEB_CASES_ENFORCE_PROBE,
};
use serde_json::Value;

fn root() -> Value {
    load(WEB_CASES_ENFORCE)
}

fn bias(name: &str) -> LandFractionFillBias {
    match name {
        "center" => LandFractionFillBias::Center,
        "mask" => LandFractionFillBias::Mask,
        other => panic!("nieznany fillBias: {other}"),
    }
}

fn scores(r: &Value, idx: usize) -> HashMap<String, f64> {
    let keys: Vec<String> = map_rows(r, idx)
        .iter()
        .map(|row| s(&row[0]).to_string())
        .collect();
    keys.into_iter().zip(map_scores(r, idx)).collect()
}

fn run(r: &Value, idx: usize, target: f64, tol: f64, fill: &str) -> (usize, Value) {
    let (w, h) = (
        r["maps"][idx]["W"].as_i64().expect("W"),
        r["maps"][idx]["H"].as_i64().expect("H"),
    );
    let mut hx = build_map(r, idx);
    let min_score = mapgen_landsea_fill().pangea_min_score_wypelnienia;
    let ret = enforce_target_dry_land_fraction(
        &mut hx,
        &scores(r, idx),
        target,
        w,
        h,
        None,
        tol,
        bias(fill),
        min_score,
    );
    (ret, dump(&hx))
}

/// Sprawdza jeden przypadek wektorowy (wejscie = mapa, wyjscie = zwrot + stan wzgledem weba).
fn check_case(r: &Value, c: &Value) {
    let id = c["id"].as_str().unwrap_or("?");
    let idx = map_index(c);
    check_input(r, idx, id);
    let (w, h) = dims(c);
    let mut hx = build_map(r, idx);
    // `minScore` obecny tylko w sondach (domyslnie = PANGEA_LAND_FILL_MIN_SCORE z JSON).
    let min_score = c["minScore"]
        .as_f64()
        .unwrap_or_else(|| mapgen_landsea_fill().pangea_min_score_wypelnienia);
    let ret = enforce_target_dry_land_fraction(
        &mut hx,
        &scores(r, idx),
        c["target"].as_f64().expect("target"),
        w,
        h,
        None,
        c["tol"].as_f64().expect("tol"),
        bias(s(&c["bias"])),
        min_score,
    );
    let out = &c["out"];
    assert_eq!(ret as u64, out["ret"].as_u64().expect("ret"), "{id}: zwrot");
    assert_eq!(
        dump(&hx),
        expected_state(r, idx, &out["diff"]),
        "{id}: stan"
    );
}

#[test]
fn enforce_target_dry_land_fraction_matches_web() {
    let r = root();
    let cs = cases(&r, "enforce");
    assert!(cs.len() >= 400, "za malo przypadkow enforce: {}", cs.len());
    for c in cs {
        check_case(&r, c);
    }
}

/// Sondy granic (plik `web-enforce-probe.json`): rownosc |land - targetLand| === tolHexes po pierwszym
/// etapie (kasuje mutacje `>` -> `>=`) oraz cele powyzej klampu 0.85 (kasuje zmiane klampu).
#[test]
fn enforce_probe_matches_web() {
    let r = load(WEB_CASES_ENFORCE_PROBE);
    let cs = cases(&r, "enforceProbe");
    let rown = cs
        .iter()
        .filter(|c| c["sonda"].as_str() == Some("rownosc-granicy"))
        .count();
    let klamp = cs
        .iter()
        .filter(|c| c["sonda"].as_str() == Some("klamp-gorny"))
        .count();
    assert!(rown >= 50, "za malo sond rownosci granicy: {rown}");
    assert!(klamp >= 100, "za malo sond klampu: {klamp}");
    let decyzja = cs
        .iter()
        .filter(|c| c["sonda"].as_str() == Some("klamp-decyzja"))
        .count();
    assert!(decyzja >= 10, "za malo sond decyzji klampu: {decyzja}");
    for c in cs {
        check_case(&r, c);
    }
}

/// Duze mapy (40x40 i 60x60, pojemnosc ladu do 97%; plik `web-enforce-large.json`, generator
/// `gen-m06b2-enforce-large.mjs`). Rozrozniaja gorny klamp celu 0.85 vs 0.86 (mutacja M11) oraz
/// 1 vs 2 przebiegi wybrzeza w etapie 1 enforce (mutacja M12): na mniejszych mapach (18x18) obie
/// mutacje przezywaly. Cele 0.85 / 0.86 / 0.9 / 0.99 i tolerancje 2/3/4 pp.
#[test]
fn enforce_large_maps_match_web() {
    let r = load(WEB_CASES_ENFORCE_LARGE);
    let cs = cases(&r, "enforceLarge");
    assert!(
        cs.len() >= 150,
        "za malo przypadkow duzych map: {}",
        cs.len()
    );
    for c in cs {
        check_case(&r, c);
    }
}

/// Wariant domyslny = jawne wywolanie z wartosciami domyslnymi weba (tol 3, center).
#[test]
fn enforce_default_wrapper_equals_explicit_default_on_vectors() {
    let r = root();
    for c in cases(&r, "enforce") {
        if c["tol"].as_u64() != Some(3) || s(&c["bias"]) != "center" {
            continue;
        }
        let idx = map_index(c);
        let (w, h) = dims(c);
        let target = c["target"].as_f64().expect("target");
        let mut a = build_map(&r, idx);
        let ra = enforce_target_dry_land_fraction_default(&mut a, &scores(&r, idx), target, w, h);
        let (rb, state_b) = run(&r, idx, target, 3.0, "center");
        assert_eq!(ra, rb, "zwrot wrappera");
        assert_eq!(dump(&a), state_b, "stan wrappera");
    }
}

/// Tolerancja N-1 / N / N+1 (2, 3, 4 pp): istnieja mapy, na ktorych zmiana o 1 pp zmienia wynik.
#[test]
fn tolerance_neighbours_are_discriminated() {
    let r = root();
    let cs = cases(&r, "enforce");
    let find = |mi: usize, target: f64, tol: u64, b: &str| -> Option<&Value> {
        cs.iter().find(|c| {
            map_index(c) == mi
                && c["target"].as_f64() == Some(target)
                && c["tol"].as_u64() == Some(tol)
                && s(&c["bias"]) == b
        })
    };
    let mut d23 = 0usize;
    let mut d34 = 0usize;
    for c in cs
        .iter()
        .filter(|c| c["tol"].as_u64() == Some(3) && s(&c["bias"]) == "center")
    {
        let mi = map_index(c);
        let t = c["target"].as_f64().expect("target");
        let (Some(a), Some(d)) = (find(mi, t, 2, "center"), find(mi, t, 4, "center")) else {
            continue;
        };
        if a["out"] != c["out"] {
            d23 += 1;
        }
        if c["out"] != d["out"] {
            d34 += 1;
        }
    }
    assert!(d23 > 0, "brak mapy rozrozniajacej tolerancje 2 / 3 pp");
    assert!(d34 > 0, "brak mapy rozrozniajacej tolerancje 3 / 4 pp");
}

/// Klamp celu do [0.15, 0.85]: cel 0.14 daje ten sam wynik co 0.15, a 0.15 rozni sie od 0.16.
#[test]
fn target_clamp_neighbours_are_discriminated() {
    let r = root();
    let cs = cases(&r, "enforce");
    let find = |mi: usize, target: f64, b: &str| -> Option<&Value> {
        cs.iter().find(|c| {
            map_index(c) == mi
                && c["target"].as_f64() == Some(target)
                && c["tol"].as_u64() == Some(3)
                && s(&c["bias"]) == b
        })
    };
    let mut below_eq = 0usize;
    let mut diff_15_16 = 0usize;
    for c in cs
        .iter()
        .filter(|c| c["target"].as_f64() == Some(0.15) && c["tol"].as_u64() == Some(3))
    {
        let mi = map_index(c);
        let b = s(&c["bias"]);
        let (Some(lo), Some(hi)) = (find(mi, 0.14, b), find(mi, 0.16, b)) else {
            continue;
        };
        assert_eq!(lo["out"], c["out"], "klamp: 0.14 == 0.15 (map {mi}, {b})");
        below_eq += 1;
        if c["out"] != hi["out"] {
            diff_15_16 += 1;
        }
    }
    assert!(below_eq > 0, "brak par 0.14 / 0.15");
    assert!(diff_15_16 > 0, "brak mapy rozrozniajacej cel 0.15 / 0.16");
}

/// Tryb `mask` (ranking maski) jest pokryty wektorami.
#[test]
fn mask_bias_is_covered() {
    let r = root();
    let n = cases(&r, "enforce")
        .iter()
        .filter(|c| s(&c["bias"]) == "mask")
        .count();
    assert!(n >= 100, "za malo przypadkow mask: {n}");
}
