//! P6-POWER-REST (Q1): testy 6 pozostalych skladnikow `computeObjectivePower` vs wektory z PINU web
//! (07d2fbd72f758705f8e1d59cc4968027ffbafe75), generowane przez tests/p6_power_rest_gen.mjs
//! (wykonanie wycietych funkcji weba, nie reczne asercje).

use std::collections::BTreeMap;

use civ_engine::domain::brake_power_rest::{
    count_cities_with_dominant_state_religion, dominant_status_web, rest_no_producer_keys,
    ReligionCity, RestSource, REST_COMPONENT_SOURCES,
};
use civ_engine::domain::resource_access::society_inputs::dominant_religion;
use civ_engine::domain::territory::ReligionState;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_power_rest_vectors/vectors.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac")
}

fn cases(key: &str) -> Vec<Value> {
    root()[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
        .clone()
}

/// Liczba z wektora; NaN / +-Infinity zakodowane jako napisy (generator, JSON nie ma tych wartosci).
fn f(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy w wektorze: {other}"),
        },
        _ => v.as_f64().expect("liczba w wektorze"),
    }
}

fn i(v: &Value) -> i64 {
    v.as_i64().expect("calkowita w wektorze")
}

/// `{ counts: {...} }` z wektora -> ReligionState (web `counts`, klucze posortowane przez BTreeMap).
fn religion_state(v: &Value) -> ReligionState {
    let counts: BTreeMap<String, f64> = v["counts"]
        .as_object()
        .expect("counts jako obiekt")
        .iter()
        .map(|(k, val)| (k.clone(), f(val)))
        .collect();
    ReligionState { counts }
}

#[test]
fn dominant_religion_matches_web_vectors() {
    let cs = cases("dominant");
    assert_eq!(cs.len(), 60);
    for (idx, c) in cs.iter().enumerate() {
        let state = religion_state(&c["state"]);
        let prog = f(&c["prog"]);
        let got = dominant_religion(&state, prog);
        let exp = &c["expect"];
        let exp_religion = exp["religion"].as_str().map(str::to_owned);
        assert_eq!(got.religion, exp_religion, "dominant[{idx}] religion");
        assert_eq!(
            dominant_status_web(got.status),
            exp["status"].as_str().expect("status"),
            "dominant[{idx}] status"
        );
    }
}

#[test]
fn religia_count_matches_web_vectors() {
    let cs = cases("religia");
    assert_eq!(cs.len(), 60);
    let mut nonzero = 0;
    for (idx, c) in cs.iter().enumerate() {
        // Stany miast trzymamy w osobnych wartosciach, zeby ReligionCity mogla je pozyczac.
        let states: Vec<Option<ReligionState>> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|city| city.get("religionState").map(religion_state))
            .collect();
        let cities: Vec<ReligionCity<'_>> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .zip(states.iter())
            .map(|(city, st)| ReligionCity {
                owner_id: i(&city["ownerId"]),
                religion_state: st.as_ref(),
            })
            .collect();
        let state_name = c["state"].as_str();
        let got = count_cities_with_dominant_state_religion(
            &cities,
            i(&c["owner"]),
            state_name,
            f(&c["prog"]),
        );
        let exp = f(&c["expect"]);
        if exp != 0.0 {
            nonzero += 1;
        }
        assert_eq!(got, exp, "religia[{idx}]");
    }
    assert!(
        nonzero >= 15,
        "za malo niezerowych przypadkow w wektorach: {nonzero}"
    );
}

#[test]
fn religia_without_state_religion_is_zero() {
    let state = ReligionState {
        counts: BTreeMap::from([("Alpha".to_owned(), 10.0)]),
    };
    let cities = [ReligionCity {
        owner_id: 1,
        religion_state: Some(&state),
    }];
    assert_eq!(
        count_cities_with_dominant_state_religion(&cities, 1, None, 50.0),
        0.0
    );
    assert_eq!(
        count_cities_with_dominant_state_religion(&cities, 1, Some(""), 50.0),
        0.0
    );
    assert_eq!(
        count_cities_with_dominant_state_religion(&cities, 1, Some("Alpha"), 50.0),
        1.0
    );
}

#[test]
fn rest_table_covers_six_components_with_explicit_sources() {
    let keys: Vec<&str> = REST_COMPONENT_SOURCES.iter().map(|(k, _)| *k).collect();
    assert_eq!(
        keys,
        vec![
            "bitwy",
            "infra",
            "tech",
            "ulepszenia",
            "religia",
            "zdobycze"
        ]
    );
    let religia = REST_COMPONENT_SOURCES
        .iter()
        .find(|(k, _)| *k == "religia")
        .map(|(_, s)| *s)
        .expect("religia");
    assert!(matches!(religia, RestSource::RustProducer(_)));
    assert_eq!(
        rest_no_producer_keys(),
        vec!["bitwy", "infra", "tech", "ulepszenia", "zdobycze"]
    );
    // Kazdy NoProducer ma niepusty dowod (plik:linia pinu / brak danych w Rust).
    for (k, s) in REST_COMPONENT_SOURCES.iter() {
        if let RestSource::NoProducer(reason) = s {
            assert!(!reason.is_empty(), "brak uzasadnienia dla {k}");
        }
    }
}
