//! P6-POWER-NOZEROS-Q1: brak skladnika `computeObjectivePower` nie jest cichym zerem.
//! Polityka STRICT: brakujacy skladnik aktywnego modelu daje `MissingComponents`; zero trzeba podac
//! jawnie (`Component::ExplicitZero`). Producenty (`brake_power_producers`) wypelniaja swoje pola.

use std::collections::BTreeSet;

use civ_engine::data::units_combat::parse_power_params;
use civ_engine::domain::brake_power::{
    compute_objective_power, military_component_keys, objective_power_for_owner, BattlePowerModel,
    Component, MissingComponents, ObjectivePowerRaw, PowerCoeffs,
};
use civ_engine::domain::brake_power_producers::{
    apply_produced, produce_for_owner, ProducerInputs,
};
use civ_engine::domain::order_effects_culture::PressureCity;
use civ_engine::domain::recruitment::manpower::ManpowerCity;
use civ_engine::domain::territory::ReligionState;

fn coeff() -> PowerCoeffs {
    PowerCoeffs::default_params()
}

fn military() -> BTreeSet<&'static str> {
    military_component_keys(&parse_power_params().expect("power-params.json"))
}

/// Pelne wejscie: wszystkie skladniki `Provided`.
fn complete() -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id: 1,
        epoka: 2.0,
        jednostki: Component::Provided(3.0),
        wygrane_bitwy: Component::Provided(1.0),
        bitwy_pkt_sum: Component::Provided(4.0),
        suma_ludkow: Component::Provided(5.0),
        rekrut_ekw: Component::Provided(2.0),
        miasta: Component::Provided(2.0),
        heksy_terytorium: Component::Provided(6.0),
        budynki: Component::Provided(3.0),
        tech_zbadane: Component::Provided(2.0),
        ulepszenia_terenu: Component::Provided(1.0),
        kultura_imperium: Component::Provided(7.0),
        miasta_jednosc_religii: Component::Provided(2.0),
        zdobycze_power: Component::Provided(1.0),
    }
}

/// Osiem skladnikow bez producenta ustawionych jako `Missing`, producenty wciaz `Missing`.
fn all_open_missing() -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        jednostki: Component::Missing,
        wygrane_bitwy: Component::Missing,
        bitwy_pkt_sum: Component::Missing,
        heksy_terytorium: Component::Missing,
        budynki: Component::Missing,
        tech_zbadane: Component::Missing,
        ulepszenia_terenu: Component::Missing,
        miasta_jednosc_religii: Component::Missing,
        zdobycze_power: Component::Missing,
        suma_ludkow: Component::Missing,
        rekrut_ekw: Component::Missing,
        miasta: Component::Missing,
        kultura_imperium: Component::Missing,
        ..complete()
    }
}

#[test]
fn complete_input_is_ok_and_matches_adapter() {
    let raw = complete();
    let (c, b, m) = (coeff(), BattlePowerModel::EnemyMSum, military());
    let res = compute_objective_power(&raw, &c, b, &m).expect("pelne wejscie");
    assert_eq!(res.components.len(), 12);
    assert_eq!(objective_power_for_owner(&raw, &c, b, &m), Ok(res.power));
}

#[test]
fn missing_active_component_is_error_not_zero() {
    let mut raw = complete();
    raw.budynki = Component::Missing;
    let err = compute_objective_power(&raw, &coeff(), BattlePowerModel::EnemyMSum, &military())
        .unwrap_err();
    assert_eq!(err, MissingComponents(vec!["infra"]));
}

#[test]
fn all_open_components_missing_are_listed_in_component_order() {
    let raw = all_open_missing();
    let err = compute_objective_power(&raw, &coeff(), BattlePowerModel::FlatCount, &military())
        .unwrap_err();
    // Producenci (ludki, rekruci, miasta, kultura) nie sa wypelnieni - tez brakuja.
    assert_eq!(
        err,
        MissingComponents(vec![
            "armia",
            "bitwy",
            "ludki",
            "rekruci",
            "miasta",
            "terytorium",
            "infra",
            "tech",
            "ulepszenia",
            "kultura",
            "religia",
            "zdobycze",
        ])
    );
}

#[test]
fn open_components_without_producer_list_is_exactly_no_producer_keys() {
    let mut raw = complete();
    for field in [
        &mut raw.jednostki,
        &mut raw.wygrane_bitwy,
        &mut raw.bitwy_pkt_sum,
        &mut raw.heksy_terytorium,
        &mut raw.budynki,
        &mut raw.tech_zbadane,
        &mut raw.ulepszenia_terenu,
        &mut raw.miasta_jednosc_religii,
        &mut raw.zdobycze_power,
    ] {
        *field = Component::Missing;
    }
    let err = compute_objective_power(&raw, &coeff(), BattlePowerModel::EnemyMSum, &military())
        .unwrap_err();
    // Brakujace wejscia wolajacego (te same 8 kluczy co przed POWER-SOURCES; producenci armia/terytorium/
    // infra/tech/religia nie sa wpisywani automatycznie, wiec wolajacy musi je podac jawnie).
    assert_eq!(
        err.0,
        vec![
            "armia",
            "bitwy",
            "terytorium",
            "infra",
            "tech",
            "ulepszenia",
            "religia",
            "zdobycze"
        ]
    );
}

#[test]
fn explicit_zero_is_accepted_and_equals_provided_zero() {
    let (c, b, m) = (coeff(), BattlePowerModel::EnemyMSum, military());
    let mut explicit = complete();
    explicit.zdobycze_power = Component::ExplicitZero;
    let mut provided = complete();
    provided.zdobycze_power = Component::Provided(0.0);
    let a = compute_objective_power(&explicit, &c, b, &m).expect("jawne zero");
    let p = compute_objective_power(&provided, &c, b, &m).expect("podane zero");
    assert_eq!(a, p);
    let z = a.components.iter().find(|x| x.key == "zdobycze").unwrap();
    assert_eq!(z.points, 0.0);
}

#[test]
fn inactive_battle_field_is_not_required() {
    let c = coeff();
    let m = military();
    let mut flat = complete();
    flat.bitwy_pkt_sum = Component::Missing;
    assert!(compute_objective_power(&flat, &c, BattlePowerModel::FlatCount, &m).is_ok());

    let mut enemy = complete();
    enemy.wygrane_bitwy = Component::Missing;
    assert!(compute_objective_power(&enemy, &c, BattlePowerModel::EnemyMSum, &m).is_ok());
}

#[test]
fn active_battle_field_missing_is_error_in_each_model() {
    let c = coeff();
    let m = military();
    let mut flat = complete();
    flat.wygrane_bitwy = Component::Missing;
    assert_eq!(
        compute_objective_power(&flat, &c, BattlePowerModel::FlatCount, &m).unwrap_err(),
        MissingComponents(vec!["bitwy"])
    );
    let mut enemy = complete();
    enemy.bitwy_pkt_sum = Component::Missing;
    assert_eq!(
        compute_objective_power(&enemy, &c, BattlePowerModel::EnemyMSum, &m).unwrap_err(),
        MissingComponents(vec!["bitwy"])
    );
}

#[test]
fn adapter_propagates_missing_error() {
    let mut raw = complete();
    raw.heksy_terytorium = Component::Missing;
    let err = objective_power_for_owner(&raw, &coeff(), BattlePowerModel::FlatCount, &military())
        .unwrap_err();
    assert_eq!(err, MissingComponents(vec!["terytorium"]));
}

#[test]
fn producers_must_be_applied_before_strict_compute() {
    let manpower = vec![ManpowerCity::new("a", 0, 10.0)];
    let pressure = vec![PressureCity {
        owner_id: 0,
        kultura_skumulowana: 12.5,
        religion_state: ReligionState::default(),
    }];
    let owners = [0_i64];
    let inputs = ProducerInputs {
        manpower_cities: &manpower,
        pressure_cities: &pressure,
        city_owner_ids: &owners,
        epoka: 1.0,
        max_mult: 1.0,
        cost_mult: 1.0,
    };
    let mut raw = all_open_missing();
    // Osiem skladnikow bez producenta: jawnie zero (wolajacy decyduje swiadomie).
    for field in [
        &mut raw.jednostki,
        &mut raw.wygrane_bitwy,
        &mut raw.bitwy_pkt_sum,
        &mut raw.heksy_terytorium,
        &mut raw.budynki,
        &mut raw.tech_zbadane,
        &mut raw.ulepszenia_terenu,
        &mut raw.miasta_jednosc_religii,
        &mut raw.zdobycze_power,
    ] {
        *field = Component::ExplicitZero;
    }
    let (c, b, m) = (coeff(), BattlePowerModel::FlatCount, military());

    // Przed producentami: producenci wciaz Missing -> blad z ich kluczami.
    assert_eq!(
        compute_objective_power(&raw, &c, b, &m).unwrap_err(),
        MissingComponents(vec!["ludki", "rekruci", "miasta", "kultura"])
    );

    apply_produced(&mut raw, &produce_for_owner(&inputs, 0));
    let res = compute_objective_power(&raw, &c, b, &m).expect("po producentach");
    let ludki = res.components.iter().find(|x| x.key == "ludki").unwrap();
    assert_eq!(ludki.raw_count, 10.0);
    let kultura = res.components.iter().find(|x| x.key == "kultura").unwrap();
    assert_eq!(kultura.raw_count, 12.5);
}
