//! P6-POWER-PRODUCERS (Q1): testy producentow skladnikow `computeObjectivePower` vs wektory z PINU
//! web (07d2fbd72f758705f8e1d59cc4968027ffbafe75), generowane przez tests/p6_power_producers_gen.mjs
//! (wykonanie wycietych funkcji weba, nie reczne asercje).

use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::brake_power_producers::{
    apply_produced, kultura_for_owner, ludki_for_owner, miasta_for_owner, no_producer_keys,
    produce_for_owner, rekruci_ekw_for_owner, ComponentSource, ProducerInputs, COMPONENT_SOURCES,
};
use civ_engine::domain::order_effects_culture::PressureCity;
use civ_engine::domain::recruitment::manpower::{empire_pobor_totals, ManpowerCity};
use civ_engine::domain::territory::ReligionState;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_power_producers_vectors/vectors.json");

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

/// Porownanie bitowo-rownowazne dla wartosci z weba: NaN == NaN, reszta przez `==`.
fn assert_same(got: f64, exp: f64, msg: &str) {
    if exp.is_nan() {
        assert!(got.is_nan(), "{msg}: oczekiwano NaN, otrzymano {got}");
    } else {
        assert_eq!(got, exp, "{msg}");
    }
}

fn i(v: &Value) -> i64 {
    v.as_i64().expect("calkowita w wektorze")
}

fn manpower_cities(arr: &[Value]) -> Vec<ManpowerCity> {
    arr.iter()
        .enumerate()
        .map(|(idx, c)| {
            let mut m = ManpowerCity::new(format!("c{idx}"), i(&c["ownerId"]), f(&c["population"]));
            m.manpower = c.get("manpower").map(f);
            m
        })
        .collect()
}

fn pressure_cities(arr: &[Value]) -> Vec<PressureCity> {
    arr.iter()
        .map(|c| PressureCity {
            owner_id: i(&c["ownerId"]),
            kultura_skumulowana: f(&c["kulturaSkumulowana"]),
            religion_state: ReligionState::default(),
        })
        .collect()
}

#[test]
fn ludki_match_pin_empire_suma_ludkow() {
    for c in cases("ludki") {
        let cities = manpower_cities(c["cities"].as_array().unwrap());
        let got = ludki_for_owner(&cities, i(&c["owner"]));
        assert_same(got, f(&c["expect"]), &format!("ludki dla {c}"));
    }
}

#[test]
fn pobor_totals_match_pin() {
    for c in cases("pobor") {
        let cities = manpower_cities(c["cities"].as_array().unwrap());
        let owner = i(&c["owner"]);
        let epoka = f(&c["epoka"]);
        let exp = &c["expect"];
        let pobor = empire_pobor_totals(&cities, owner, epoka, f(&c["maxMult"]));
        assert_same(
            pobor.suma_ludkow,
            f(&exp["sumaLudkow"]),
            &format!("sumaLudkow dla {c}"),
        );
        assert_same(
            pobor.ludnosc_absolutna,
            f(&exp["ludnoscAbsolutna"]),
            &format!("ludnosc dla {c}"),
        );
        assert_same(
            pobor.rekruci,
            f(&exp["rekruci"]),
            &format!("rekruci dla {c}"),
        );
        assert_same(
            pobor.pobor_raw,
            f(&exp["poborRaw"]),
            &format!("poborRaw dla {c}"),
        );
    }
}

#[test]
fn rekruci_ekw_match_pin_rekrut_unit_equivalents() {
    for c in cases("pobor") {
        let cities = manpower_cities(c["cities"].as_array().unwrap());
        let got = rekruci_ekw_for_owner(
            &cities,
            i(&c["owner"]),
            f(&c["epoka"]),
            f(&c["maxMult"]),
            f(&c["costMult"]),
        );
        assert_same(
            got,
            f(&c["expect"]["rekrutEkw"]),
            &format!("rekrutEkw dla {c}"),
        );
    }
}

#[test]
fn kultura_matches_pin_empire_culture_total() {
    for c in cases("kultura") {
        let cities = pressure_cities(c["cities"].as_array().unwrap());
        let got = kultura_for_owner(&cities, i(&c["owner"]));
        assert_same(got, f(&c["expect"]), &format!("kultura dla {c}"));
    }
}

/// Test krzyzowy: `ludki_for_owner` (empire_suma_ludkow) == `pobor.sumaLudkow` z pinu na tych samych wejsciach.
/// Web liczy oba przez te same `clampLudki`; tu sprawdzane jawnie, a nie tylko przez dwa osobne testy.
#[test]
fn ludki_equal_pobor_suma_ludkow_on_same_inputs() {
    for c in cases("pobor") {
        let cities = manpower_cities(c["cities"].as_array().unwrap());
        let owner = i(&c["owner"]);
        let ludki = ludki_for_owner(&cities, owner);
        let pobor = empire_pobor_totals(&cities, owner, f(&c["epoka"]), f(&c["maxMult"]));
        assert_same(
            ludki,
            pobor.suma_ludkow,
            &format!("ludki vs pobor.sumaLudkow dla {c}"),
        );
        assert_same(
            ludki,
            f(&c["expect"]["sumaLudkow"]),
            &format!("ludki vs pin sumaLudkow dla {c}"),
        );
    }
}

#[test]
fn no_producer_keys_are_exactly_the_three_components_without_rust_producer() {
    // Stan po POWER-SOURCES: armia, terytorium, infra, tech, religia maja producenta (RustProducer).
    assert_eq!(no_producer_keys(), vec!["bitwy", "ulepszenia", "zdobycze"]);
}

#[test]
fn miasta_counts_only_owner_cities() {
    let owners = [0, 1, 0, 2, 0];
    assert_eq!(miasta_for_owner(&owners, 0), 3.0);
    assert_eq!(miasta_for_owner(&owners, 1), 1.0);
    assert_eq!(miasta_for_owner(&owners, 9), 0.0);
    assert_eq!(miasta_for_owner(&[], 0), 0.0);
}

#[test]
fn produce_and_apply_fill_only_rust_producer_fields() {
    let manpower = vec![
        ManpowerCity::new("a", 0, 10.0),
        ManpowerCity::new("b", 1, 4.0),
    ];
    let pressure = vec![PressureCity {
        owner_id: 0,
        kultura_skumulowana: 12.5,
        religion_state: ReligionState::default(),
    }];
    let owners = [0_i64, 1];
    let inputs = ProducerInputs {
        manpower_cities: &manpower,
        pressure_cities: &pressure,
        city_owner_ids: &owners,
        epoka: 1.0,
        max_mult: 1.0,
        cost_mult: 1.0,
    };
    let produced = produce_for_owner(&inputs, 0);
    assert_eq!(produced.suma_ludkow, 10.0);
    assert_eq!(produced.miasta, 1.0);
    assert_eq!(produced.kultura_imperium, 12.5);

    let mut raw = ObjectivePowerRaw {
        owner_id: 0,
        epoka: 1.0,
        jednostki: Component::Provided(7.0),
        wygrane_bitwy: Component::ExplicitZero,
        bitwy_pkt_sum: Component::Provided(3.0),
        suma_ludkow: Component::Missing,
        rekrut_ekw: Component::Missing,
        miasta: Component::Missing,
        heksy_terytorium: Component::Provided(5.0),
        budynki: Component::Provided(6.0),
        tech_zbadane: Component::Provided(2.0),
        ulepszenia_terenu: Component::Provided(1.0),
        kultura_imperium: Component::Missing,
        miasta_jednosc_religii: Component::Provided(4.0),
        zdobycze_power: Component::Provided(9.0),
    };
    apply_produced(&mut raw, &produced);
    assert_eq!(raw.suma_ludkow, Component::Provided(10.0));
    assert_eq!(raw.miasta, Component::Provided(1.0));
    assert_eq!(raw.kultura_imperium, Component::Provided(12.5));
    // Pola bez producenta zostaja jak podane przez wolajacego.
    assert_eq!(raw.jednostki, Component::Provided(7.0));
    assert_eq!(raw.bitwy_pkt_sum, Component::Provided(3.0));
    assert_eq!(raw.heksy_terytorium, Component::Provided(5.0));
    assert_eq!(raw.budynki, Component::Provided(6.0));
    assert_eq!(raw.miasta_jednosc_religii, Component::Provided(4.0));
    assert_eq!(raw.zdobycze_power, Component::Provided(9.0));
}

#[test]
fn coverage_table_lists_all_twelve_components_with_explicit_status() {
    assert_eq!(COMPONENT_SOURCES.len(), 12);
    let producers: Vec<&str> = COMPONENT_SOURCES
        .iter()
        .filter_map(|(k, s)| match s {
            ComponentSource::RustProducer(_) => Some(*k),
            ComponentSource::NoProducer(_) => None,
        })
        .collect();
    assert_eq!(
        producers,
        vec![
            "armia",
            "ludki",
            "rekruci",
            "miasta",
            "terytorium",
            "infra",
            "tech",
            "kultura",
            "religia"
        ]
    );
    for (key, source) in COMPONENT_SOURCES.iter() {
        if let ComponentSource::NoProducer(reason) = source {
            assert!(!reason.is_empty(), "brak uzasadnienia dla {key}");
        }
    }
}
