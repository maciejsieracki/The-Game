//! P6.6A - `game/city-founding.ts` (163 linie): wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie
//! BITOWE f64. Oczekiwania pochodza wylacznie z `tests/p6_6a_vectors/founding.json`; testy ksztaltu
//! (parametry) nie pinuja wartosci balansu.

#[path = "p6_6a_vectors/common.rs"]
mod common;

use std::cell::Cell;

use civ_engine::domain::terrain::city_founding::{
    ai_founding_source_min_pop, can_afford_found_city, can_afford_found_city_with,
    evaluate_found_city_affordance, evaluate_found_city_affordance_with, found_city_cost_label,
    found_city_cost_label_with, found_city_params, found_city_population_cost,
    found_city_work_cost, is_subsequent_found_city, pick_source_city_for_founding,
    pick_source_city_for_founding_with, read_param, FoundCityAffordance, FoundCityParams,
    FoundCitySourceCity,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("founding.json")
}

fn cities(v: &Value) -> Vec<FoundCitySourceCity> {
    v.as_array()
        .expect("cities")
        .iter()
        .map(|c| FoundCitySourceCity {
            id: text(&c["id"]),
            owner_id: c["ownerId"].as_i64().expect("ownerId"),
            population: num(&c["population"]),
        })
        .collect()
}

fn assert_affordance(label: &str, got: &FoundCityAffordance, want: &Value) {
    assert_eq!(got.ok, want["ok"].as_bool().expect("ok"), "{label}: ok");
    assert_eq!(got.reason, opt_text(&want["reason"]), "{label}: reason");
    assert_bits(
        &format!("{label}.kosztPraca"),
        got.koszt_praca,
        num(&want["kosztPraca"]),
    );
    assert_bits(
        &format!("{label}.kosztLudnosc"),
        got.koszt_ludnosc,
        num(&want["kosztLudnosc"]),
    );
    assert_eq!(
        got.source_city_id,
        opt_text(&want["sourceCityId"]),
        "{label}: sourceCityId"
    );
}

#[test]
fn cost_constants_match_running_web() {
    let d = data();
    let c = &d["constants"];
    assert_bits("work", found_city_work_cost(), num(&c["work"]));
    assert_bits("pop", found_city_population_cost(), num(&c["pop"]));
    assert_bits("aiMin", ai_founding_source_min_pop(), num(&c["aiMinPop"]));
}

#[test]
fn cost_labels_match_web() {
    let d = data();
    for (i, row) in arr(&d, "labels").iter().enumerate() {
        let free = row["arg"].as_bool().unwrap_or(false);
        assert_eq!(found_city_cost_label(free), text(&row["out"]), "label[{i}]");
    }
}

#[test]
fn is_subsequent_found_city_matches_web() {
    let d = data();
    let rows = arr(&d, "subsequent");
    assert!(rows.len() >= 80);
    for (i, row) in rows.iter().enumerate() {
        let owners: Vec<i64> = row["owners"]
            .as_array()
            .expect("owners")
            .iter()
            .map(|o| o.as_i64().expect("owner"))
            .collect();
        let owner = row["ownerId"].as_i64().expect("ownerId");
        assert_eq!(
            is_subsequent_found_city(&owners, owner),
            row["out"].as_bool().expect("out"),
            "subsequent[{i}]"
        );
    }
}

#[test]
fn pick_source_city_matches_web_including_rand_protocol() {
    let d = data();
    let rows = arr(&d, "pick");
    assert!(rows.len() >= 400);
    let mut with_calls = 0;
    let mut with_none = 0;
    for (i, row) in rows.iter().enumerate() {
        let list = cities(&row["cities"]);
        let owner = row["ownerId"].as_i64().expect("ownerId");
        let rv = num(&row["rand"]);
        let calls = Cell::new(0_u32);
        let mut rand = || {
            calls.set(calls.get() + 1);
            rv
        };
        let got = pick_source_city_for_founding(&list, owner, &mut rand).map(|c| c.id.clone());
        assert_eq!(got, opt_text(&row["out"]), "pick[{i}]");
        assert_eq!(
            u64::from(calls.get()),
            row["calls"].as_u64().expect("calls"),
            "pick[{i}] liczba wywolan rand"
        );
        if calls.get() > 0 {
            with_calls += 1;
        }
        if got.is_none() {
            with_none += 1;
        }
    }
    assert!(with_calls >= 50, "za malo remisow w wektorze: {with_calls}");
    assert!(
        with_none >= 50,
        "za malo przypadkow bez zrodla: {with_none}"
    );
}

#[test]
fn evaluate_found_city_affordance_matches_web() {
    let d = data();
    let rows = arr(&d, "evaluate");
    assert!(rows.len() >= 400);
    for (i, row) in rows.iter().enumerate() {
        let list = cities(&row["cities"]);
        let rv = num(&row["rand"]);
        let calls = Cell::new(0_u32);
        let mut rand = || {
            calls.set(calls.get() + 1);
            rv
        };
        let got = evaluate_found_city_affordance(
            num(&row["treasury"]),
            &list,
            row["ownerId"].as_i64().expect("ownerId"),
            &mut rand,
        );
        assert_affordance(&format!("evaluate[{i}]"), &got, &row["out"]);
        assert_eq!(
            u64::from(calls.get()),
            row["calls"].as_u64().expect("calls"),
            "evaluate[{i}] liczba wywolan rand"
        );
    }
}

#[test]
fn can_afford_found_city_matches_web() {
    let d = data();
    let rows = arr(&d, "canAfford");
    assert!(rows.len() >= 200);
    for (i, row) in rows.iter().enumerate() {
        let free = row["free"].as_bool().unwrap_or(false);
        let got = can_afford_found_city(num(&row["treasury"]), num(&row["pop"]), free);
        assert_affordance(&format!("canAfford[{i}]"), &got, &row["out"]);
    }
}

// ---------------------------------------------------------------------------
// Testy ksztaltu: parametry sa wstrzykiwalne i faktycznie steruja wynikiem (bez pinow wartosci).
// ---------------------------------------------------------------------------

fn params(work: f64, pop: f64, ai: f64) -> FoundCityParams {
    FoundCityParams {
        work_cost: work,
        population_cost: pop,
        ai_source_min_pop: ai,
    }
}

#[test]
fn read_param_accepts_only_finite_numbers() {
    let fb = found_city_params().work_cost + 1.5;
    assert_bits("some", read_param(Some(7.25), fb), 7.25);
    assert_bits("none", read_param(None, fb), fb);
    for bad in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
        assert_bits("bad", read_param(Some(bad), fb), fb);
    }
}

#[test]
fn costs_follow_injected_params() {
    let p = params(37.0, 2.0, 5.0);
    let two_cities = vec![
        FoundCitySourceCity {
            id: "a".into(),
            owner_id: 1,
            population: 9.0,
        },
        FoundCitySourceCity {
            id: "b".into(),
            owner_id: 1,
            population: 1.0,
        },
    ];
    let mut rand = || 0.0;
    let ok = evaluate_found_city_affordance_with(1000.0, &two_cities, 1, &mut rand, &p);
    assert!(ok.ok);
    assert_bits("praca", ok.koszt_praca, 37.0);
    assert_bits("ludnosc", ok.koszt_ludnosc, 2.0);
    assert_eq!(ok.source_city_id.as_deref(), Some("a"));
    let poor = evaluate_found_city_affordance_with(36.999, &two_cities, 1, &mut rand, &p);
    assert!(!poor.ok);
    assert!(poor.reason.expect("reason").contains("37"));
    // AI (ownerId > 0): prog = max(koszt ludnosci + 1, prog AI); gracz (ownerId <= 0): koszt ludnosci + 1
    let small = vec![
        FoundCitySourceCity {
            id: "x".into(),
            owner_id: 1,
            population: 4.0,
        },
        FoundCitySourceCity {
            id: "y".into(),
            owner_id: 0,
            population: 4.0,
        },
    ];
    assert!(pick_source_city_for_founding_with(&small, 1, &mut rand, &p).is_none());
    assert_eq!(
        pick_source_city_for_founding_with(&small, 0, &mut rand, &p).map(|c| c.id.as_str()),
        Some("y")
    );
    let label = found_city_cost_label_with(false, &p);
    assert!(label.contains("37") && label.contains('2'), "{label}");
    assert_ne!(label, found_city_cost_label_with(true, &p));
    let afford = can_afford_found_city_with(100.0, 2.0, false, &p);
    assert!(!afford.ok, "ludnosc 2 - koszt 2 < 1");
}

#[test]
fn first_city_is_free_for_any_params() {
    let p = params(99.0, 4.0, 8.0);
    let mut rand = || 0.0;
    let r = evaluate_found_city_affordance_with(0.0, &[], 3, &mut rand, &p);
    assert!(r.ok);
    assert_bits("praca", r.koszt_praca, 0.0);
    assert_bits("ludnosc", r.koszt_ludnosc, 0.0);
    assert!(r.source_city_id.is_none());
}

#[test]
fn production_params_come_from_data_tables() {
    let p = found_city_params();
    assert_eq!(*p, FoundCityParams::from_data());
    assert!(p.work_cost.is_finite() && p.population_cost.is_finite());
    assert!(p.ai_source_min_pop.is_finite());
}
