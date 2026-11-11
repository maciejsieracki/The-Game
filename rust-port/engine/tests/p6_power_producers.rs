//! P6-POWER-PRODUCERS (Q1): testy producentow skladnikow `computeObjectivePower` vs wektory z PINU
//! web (07d2fbd72f758705f8e1d59cc4968027ffbafe75), generowane przez tests/p6_power_producers_gen.mjs
//! (wykonanie wycietych funkcji weba, nie reczne asercje).

use civ_engine::domain::brake_power::ObjectivePowerRaw;
use civ_engine::domain::brake_power_producers::{
    apply_produced, kultura_for_owner, ludki_for_owner, miasta_for_owner, produce_for_owner,
    rekruci_ekw_for_owner, ComponentSource, ProducerInputs, COMPONENT_SOURCES,
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

fn f(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
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
        assert_eq!(got, f(&c["expect"]), "ludki dla {c}");
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
        assert_eq!(
            pobor.suma_ludkow,
            f(&exp["sumaLudkow"]),
            "sumaLudkow dla {c}"
        );
        assert_eq!(
            pobor.ludnosc_absolutna,
            f(&exp["ludnoscAbsolutna"]),
            "ludnosc dla {c}"
        );
        assert_eq!(pobor.rekruci, f(&exp["rekruci"]), "rekruci dla {c}");
        assert_eq!(pobor.pobor_raw, f(&exp["poborRaw"]), "poborRaw dla {c}");
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
        assert_eq!(got, f(&c["expect"]["rekrutEkw"]), "rekrutEkw dla {c}");
    }
}

#[test]
fn kultura_matches_pin_empire_culture_total() {
    for c in cases("kultura") {
        let cities = pressure_cities(c["cities"].as_array().unwrap());
        let got = kultura_for_owner(&cities, i(&c["owner"]));
        assert_eq!(got, f(&c["expect"]), "kultura dla {c}");
    }
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
        jednostki: 7.0,
        wygrane_bitwy: 0.0,
        bitwy_pkt_sum: Some(3.0),
        suma_ludkow: 0.0,
        rekrut_ekw: 0.0,
        miasta: 0.0,
        heksy_terytorium: 5.0,
        budynki: 6.0,
        tech_zbadane: 2.0,
        ulepszenia_terenu: 1.0,
        kultura_imperium: None,
        miasta_jednosc_religii: Some(4.0),
        zdobycze_power: Some(9.0),
    };
    apply_produced(&mut raw, &produced);
    assert_eq!(raw.suma_ludkow, 10.0);
    assert_eq!(raw.miasta, 1.0);
    assert_eq!(raw.kultura_imperium, Some(12.5));
    // Pola bez producenta zostaja jak podane przez wolajacego.
    assert_eq!(raw.jednostki, 7.0);
    assert_eq!(raw.bitwy_pkt_sum, Some(3.0));
    assert_eq!(raw.heksy_terytorium, 5.0);
    assert_eq!(raw.budynki, 6.0);
    assert_eq!(raw.miasta_jednosc_religii, Some(4.0));
    assert_eq!(raw.zdobycze_power, Some(9.0));
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
    assert_eq!(producers, vec!["ludki", "rekruci", "miasta", "kultura"]);
    for (key, source) in COMPONENT_SOURCES.iter() {
        if let ComponentSource::NoProducer(reason) = source {
            assert!(!reason.is_empty(), "brak uzasadnienia dla {key}");
        }
    }
}
