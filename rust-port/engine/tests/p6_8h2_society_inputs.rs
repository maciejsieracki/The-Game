//! P6.8H2 partia B, runda 4 (Z6): `dominantReligion` / `isForeignReligionDominant` wobec wektorów
//! z pinu `91dc998a` (`tests/p6_8h2_vectors/vectors.json`, klucz `religion`) oraz brzegi progu.

use std::collections::BTreeMap;

use civ_engine::domain::resource_access::society_inputs::{
    dominant_religion, is_foreign_religion_dominant,
};
use civ_engine::domain::territory::{DominantStatus, ReligionState};
use serde_json::Value;

const CASES: &str = include_str!("p6_8h2_vectors/cases.json");
const VECTORS: &str = include_str!("p6_8h2_vectors/vectors.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektor JSON")
}

/// Web `'NaN'` / `'Inf'` jako napisy (JSON nie ma NaN ani Infinity).
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().unwrap(),
        Value::String(s) if s == "NaN" => f64::NAN,
        Value::String(s) if s == "Inf" => f64::INFINITY,
        other => panic!("liczba: {other}"),
    }
}

fn state_of(counts: &Value) -> ReligionState {
    let map: BTreeMap<String, f64> = counts
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), num(v)))
        .collect();
    ReligionState { counts: map }
}

fn status_name(s: DominantStatus) -> &'static str {
    match s {
        DominantStatus::None => "none",
        DominantStatus::Mixed => "mixed",
        DominantStatus::Dominant => "dominant",
    }
}

#[test]
fn religion_matches_pinned_web_vectors() {
    let cases = parse(CASES);
    let vectors = parse(VECTORS);
    let rel_cases = cases["religion"].as_array().unwrap();
    let rel_vectors = vectors["religion"].as_array().unwrap();
    assert_eq!(rel_cases.len(), rel_vectors.len());
    let mut dominant_seen = 0usize;
    let mut foreign_seen = 0usize;
    for (case, expected) in rel_cases.iter().zip(rel_vectors) {
        let state = state_of(&case["counts"]);
        let prog = num(&case["prog"]);
        let dom = dominant_religion(&state, prog);
        assert_eq!(
            status_name(dom.status),
            expected["status"].as_str().unwrap(),
            "status: {}",
            case["name"]
        );
        assert_eq!(
            dom.religion,
            expected["religion"].as_str().map(str::to_owned),
            "religion: {}",
            case["name"]
        );
        let own = case["own"].as_str();
        let foreign = is_foreign_religion_dominant(&state, own, prog);
        assert_eq!(
            foreign,
            expected["foreign"].as_bool().unwrap(),
            "foreign: {}",
            case["name"]
        );
        if dom.status == DominantStatus::Dominant {
            dominant_seen += 1;
        }
        if foreign {
            foreign_seen += 1;
        }
    }
    // Pokrycie: każda gałąź wyniku i obu ścieżek `foreign` występuje w wektorach.
    assert!(dominant_seen > 0 && foreign_seen > 0);
}

fn counts(pairs: &[(&str, f64)]) -> ReligionState {
    ReligionState {
        counts: pairs.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect(),
    }
}

#[test]
fn threshold_boundaries_n_minus_1_n_n_plus_1() {
    // udział a = 50/100 = 0,5; próg 50% (N): nie jest „> progu” -> mixed.
    let tie = counts(&[("a", 50.0), ("b", 50.0)]);
    assert_eq!(dominant_religion(&tie, 50.0).status, DominantStatus::Mixed);
    // N-1 (49%): 0,5 > 0,49 -> dominant.
    assert_eq!(
        dominant_religion(&tie, 49.0).status,
        DominantStatus::Dominant
    );
    // N+1 (51%): 0,5 > 0,51 fałsz -> mixed.
    assert_eq!(dominant_religion(&tie, 51.0).status, DominantStatus::Mixed);
    // 51 vs 49 przy progu 50: dominujące „a”.
    let lead = counts(&[("a", 51.0), ("b", 49.0)]);
    let dom = dominant_religion(&lead, 50.0);
    assert_eq!(dom.status, DominantStatus::Dominant);
    assert_eq!(dom.religion.as_deref(), Some("a"));
}

#[test]
fn clamp_and_nan_threshold() {
    let st = counts(&[("a", 3.0), ("b", 1.0)]);
    // clamp(150) = 100 -> próg 1,0 -> share 0,75 nie przekracza -> mixed.
    assert_eq!(dominant_religion(&st, 150.0).status, DominantStatus::Mixed);
    // clamp(-5) = 0 -> próg 0 -> dominant.
    assert_eq!(
        dominant_religion(&st, -5.0).status,
        DominantStatus::Dominant
    );
    // NaN przechodzi przez clamp -> porównanie fałszywe -> mixed (web).
    assert_eq!(
        dominant_religion(&st, f64::NAN).status,
        DominantStatus::Mixed
    );
}

#[test]
fn tie_break_and_non_finite_counts() {
    // Remis 3:3 przy progu 0: wygrywa pierwsza nazwa posortowana (`a`), status dominant.
    let st = counts(&[("b", 3.0), ("a", 3.0)]);
    assert_eq!(dominant_religion(&st, 0.0).religion.as_deref(), Some("a"));
    // NaN i Infinity nie liczą się do sumy ani do lidera.
    let bad = counts(&[("a", f64::NAN), ("b", f64::INFINITY), ("c", 4.0)]);
    let dom = dominant_religion(&bad, 50.0);
    assert_eq!(dom.status, DominantStatus::Dominant);
    assert_eq!(dom.religion.as_deref(), Some("c"));
    // Brak dodatnich wyznawców = none.
    let none = counts(&[("a", 0.0), ("b", -1.0)]);
    assert_eq!(dominant_religion(&none, 50.0).status, DominantStatus::None);
}

#[test]
fn foreign_owner_religion_variants() {
    let st = counts(&[("x", 9.0), ("y", 1.0)]);
    // Brak religii właściciela (null/undefined/"") = obca dominująca.
    assert!(is_foreign_religion_dominant(&st, None, 50.0));
    assert!(is_foreign_religion_dominant(&st, Some(""), 50.0));
    // Ta sama religia = nie obca; inna = obca.
    assert!(!is_foreign_religion_dominant(&st, Some("x"), 50.0));
    assert!(is_foreign_religion_dominant(&st, Some("y"), 50.0));
    // Brak dominacji (mixed) = nie obca niezależnie od właściciela.
    assert!(!is_foreign_religion_dominant(&st, None, 95.0));
}
