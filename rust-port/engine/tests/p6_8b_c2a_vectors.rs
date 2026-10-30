//! P6.8B-P1b-c2a (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba dla
//! `manpowerCostOf` (production.ts ~1985) i `setPaused` (production.ts ~1990).
//!
//! Wektory: `tests/p6_8b_vectors/p1b-c2a.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/gen-p6-8b-c2a-vectors.mjs`
//! (Node 22 + loader TS: import PRAWDZIWEGO `production.ts` z pinu, bez stubow).
//!
//! Kodowanie liczb: calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."}.
//! Nieobecne pole = {"absent": true}; null = null.

use civ_engine::domain::production_units::{
    manpower_cost_of, set_paused, CityProduction, ProductionItem, ProductionKind,
};
use serde_json::Value;

const C2A_JSON: &str = include_str!("p6_8b_vectors/p1b-c2a.json");

fn root() -> Value {
    serde_json::from_str(C2A_JSON).expect("wektor JSON p1b-c2a")
}

fn dec(v: &Value) -> f64 {
    if let Some(n) = v.as_f64() {
        return n;
    }
    if let Some(s) = v.get("$f").and_then(Value::as_str) {
        return s.parse::<f64>().expect("$f");
    }
    match v.get("$n").and_then(Value::as_str).expect("$n") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => panic!("nieznana liczba {other}"),
    }
}

/// Liczba z wektora, `{absent}` -> None (brak argumentu / pola).
fn opt_num(v: &Value) -> Option<f64> {
    if v.get("absent").is_some() {
        None
    } else {
        Some(dec(v))
    }
}

fn same_num(actual: f64, expected: &Value) -> bool {
    let e = dec(expected);
    if e.is_nan() {
        return actual.is_nan();
    }
    if e == 0.0 && e.is_sign_negative() {
        return actual == 0.0 && actual.is_sign_negative();
    }
    actual == e
}

fn kind_of(s: &str) -> ProductionKind {
    match s {
        "jednostka" => ProductionKind::Jednostka,
        "budynek" => ProductionKind::Budynek,
        other => panic!("nieznany kind {other}"),
    }
}

fn item_of(v: &Value) -> ProductionItem {
    ProductionItem {
        kind: kind_of(v["kind"].as_str().expect("kind")),
        id: v["id"].as_str().expect("id").to_string(),
        nazwa: v["nazwa"].as_str().expect("nazwa").to_string(),
        koszt: dec(&v["koszt"]),
        postep: v.get("postep").map(dec),
        is_general: v.get("isGeneral").and_then(Value::as_bool),
    }
}

fn items_eq(actual: &[ProductionItem], expected: &Value) {
    let exp = expected.as_array().expect("tablica pozycji");
    assert_eq!(actual.len(), exp.len(), "dlugosc kolejki");
    for (a, e) in actual.iter().zip(exp) {
        assert_eq!(a.kind, kind_of(e["kind"].as_str().unwrap()));
        assert_eq!(a.id, e["id"].as_str().unwrap());
        assert_eq!(a.nazwa, e["nazwa"].as_str().unwrap());
        assert!(same_num(a.koszt, &e["koszt"]), "koszt {}", e["koszt"]);
        match (a.postep, e.get("postep")) {
            (None, None) => {}
            (Some(x), Some(ev)) => assert!(same_num(x, ev), "postep"),
            (x, ev) => panic!("postep: rust={x:?} web={ev:?}"),
        }
        assert_eq!(a.is_general, e.get("isGeneral").and_then(Value::as_bool));
    }
}

#[test]
fn manpower_cost_of_matches_web_vectors() {
    let r = root();
    let cases = r["manpowerCostOf"].as_array().expect("manpowerCostOf");
    assert!(cases.len() >= 10_000, "za malo wektorow: {}", cases.len());
    for c in cases {
        let item = ProductionItem {
            kind: kind_of(c["item"]["kind"].as_str().unwrap()),
            id: c["item"]["id"].as_str().unwrap().to_string(),
            nazwa: String::new(),
            koszt: 1.0,
            postep: None,
            is_general: None,
        };
        let epoka = dec(&c["epoka"]);
        // web: maxMult = 1 gdy brak argumentu (domyslny parametr); costMult = maxMult gdy brak.
        let max_mult = opt_num(&c["maxMult"]).unwrap_or(1.0);
        let cost_mult = opt_num(&c["costMult"]);
        let got = manpower_cost_of(&item, epoka, max_mult, cost_mult);
        assert!(
            same_num(got, &c["out"]),
            "item={} epoka={} maxMult={} costMult={} got={got}",
            c["item"],
            c["epoka"],
            c["maxMult"],
            c["costMult"]
        );
    }
}

#[test]
fn manpower_cost_of_scout_and_budynek_are_zero() {
    let scout = ProductionItem {
        kind: ProductionKind::Jednostka,
        id: "Zwiadowca".into(),
        nazwa: "Zwiadowca".into(),
        koszt: 1.0,
        postep: None,
        is_general: None,
    };
    assert_eq!(manpower_cost_of(&scout, 3.0, 1.0, Some(5.0)), 0.0);
    let budynek = ProductionItem {
        kind: ProductionKind::Budynek,
        id: "Wojownik".into(),
        ..scout.clone()
    };
    assert_eq!(manpower_cost_of(&budynek, 3.0, 1.0, Some(5.0)), 0.0);
}

#[test]
fn manpower_cost_of_cost_mult_defaults_to_max_mult() {
    let u = ProductionItem {
        kind: ProductionKind::Jednostka,
        id: "Wojownik".into(),
        nazwa: "Wojownik".into(),
        koszt: 1.0,
        postep: None,
        is_general: None,
    };
    // Brak costMult -> costMult = maxMult (web): wynik zalezy od maxMult, nie od 1.
    let by_default = manpower_cost_of(&u, 2.0, 2.0, None);
    let explicit = manpower_cost_of(&u, 2.0, 2.0, Some(2.0));
    assert_eq!(by_default.to_bits(), explicit.to_bits());
    // Jawne costMult ma pierwszenstwo nad maxMult.
    assert_ne!(manpower_cost_of(&u, 2.0, 2.0, Some(1.0)), explicit);
}

#[test]
fn set_paused_matches_web_vectors() {
    let r = root();
    let cases = r["setPaused"].as_array().expect("setPaused");
    assert!(
        cases.len() >= 10,
        "za malo wektorow setPaused: {}",
        cases.len()
    );
    for c in cases {
        let inp = &c["input"];
        let prod = CityProduction {
            kolejka: inp["kolejka"]
                .as_array()
                .unwrap()
                .iter()
                .map(item_of)
                .collect(),
            postep: dec(&inp["postep"]),
            wstrzymana: inp.get("wstrzymana").and_then(Value::as_bool),
            rekrutacja: match inp.get("rekrutacja") {
                Some(v) if v.is_array() => {
                    Some(v.as_array().unwrap().iter().map(item_of).collect())
                }
                _ => None,
            },
        };
        let paused = c["paused"].as_bool().expect("paused");
        let out = set_paused(&prod, paused);
        let exp = &c["out"];
        items_eq(&out.kolejka, &exp["kolejka"]);
        assert!(same_num(out.postep, &exp["postep"]), "postep");
        assert_eq!(out.wstrzymana, exp["wstrzymana"].as_bool(), "wstrzymana");
        match (&out.rekrutacja, exp.get("rekrutacja")) {
            (None, Some(v)) if v.get("absent").is_some() => {}
            (Some(a), Some(v)) if v.is_array() => items_eq(a, v),
            (a, v) => panic!("rekrutacja: rust={a:?} web={v:?}"),
        }
    }
}

#[test]
fn set_paused_keeps_rekrutacja_absent_and_does_not_mutate_input() {
    let prod = CityProduction {
        kolejka: vec![],
        postep: 0.0,
        wstrzymana: None,
        rekrutacja: None,
    };
    let out = set_paused(&prod, true);
    assert_eq!(out.wstrzymana, Some(true));
    assert_eq!(out.rekrutacja, None);
    assert_eq!(prod.wstrzymana, None, "wejscie nie zmienione");
}
