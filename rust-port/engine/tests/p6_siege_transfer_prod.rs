//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q1: testy behawioralne galezi Transfer poza wektorami pinu.
//!
//! Kolejka produkcji i odzysk Pracy NIE sa w wektorach z pinu (generator nie stubuje `sanitizeBuildQueue`/`filterQueue`).
//! Oczekiwania wyprowadzone z czytania kodu web (main.ts:17720-17770) i z semantyki klockow Rust - NIE_ZMIERZONO
//! wzgledem wykonania pinu dla tej sciezki.

use civ_engine::domain::production_units::{CityProduction, ProductionItem, ProductionKind};
use civ_engine::domain::siege_enter_city::EnterUnit;
use civ_engine::domain::siege_transfer::{apply_transfer, TransferCity, TransferProduction};

fn city(owner: i64) -> TransferCity {
    TransferCity {
        owner_id: owner,
        population: 5.0,
        q: 2,
        r: 2,
        found_by_owner: Some(true),
        rebel_state: None,
        start_city_state: None,
    }
}

fn item(kind: ProductionKind, id: &str, postep: Option<f64>) -> ProductionItem {
    ProductionItem {
        kind,
        id: id.to_owned(),
        nazwa: id.to_owned(),
        koszt: 10.0,
        postep,
        is_general: None,
    }
}

fn prod(kolejka: Vec<ProductionItem>, postep: f64) -> CityProduction {
    CityProduction {
        kolejka,
        postep,
        wstrzymana: None,
        rekrutacja: None,
    }
}

fn never_capital(_: &ProductionItem) -> bool {
    false
}

#[test]
fn legacy_unit_queue_refunds_work_to_old_owner() {
    let p = prod(
        vec![
            item(ProductionKind::Budynek, "zbrojownia", Some(2.0)),
            item(ProductionKind::Jednostka, "lucznik", Some(5.0)),
        ],
        2.0,
    );
    let mut c = city(1);
    let mut units = Vec::new();
    let out = apply_transfer(
        &mut c,
        2,
        true,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: false,
            is_capital_only_building: &never_capital,
        }),
    );
    assert_eq!(out.refunded_praca_to_old, 5.0);
    assert_eq!(out.forfeited_praca_to_new, 0.0);
    let kolejka = &out.production.expect("kolejka").kolejka;
    assert_eq!(kolejka.len(), 1);
    assert_eq!(kolejka[0].id, "zbrojownia");
}

#[test]
fn capital_only_buildings_forfeit_front_and_banked_work_to_new_owner() {
    // Front: stolica (postep 3 = prod.postep); banked: druga stolica z postep 7; srodek: zwykly budynek.
    let p = prod(
        vec![
            item(ProductionKind::Budynek, "palac", Some(3.0)),
            item(ProductionKind::Budynek, "mur", Some(1.0)),
            item(ProductionKind::Budynek, "mennica", Some(7.0)),
        ],
        3.0,
    );
    let is_cap = |i: &ProductionItem| i.id == "palac" || i.id == "mennica";
    let mut c = city(1);
    let mut units = Vec::new();
    let out = apply_transfer(
        &mut c,
        2,
        true,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: false,
            is_capital_only_building: &is_cap,
        }),
    );
    assert_eq!(out.refunded_praca_to_old, 0.0);
    assert_eq!(out.forfeited_praca_to_new, 3.0 + 7.0);
    let ids: Vec<String> = out
        .production
        .expect("kolejka")
        .kolejka
        .iter()
        .map(|i| i.id.clone())
        .collect();
    assert_eq!(
        ids,
        vec!["mur".to_owned()],
        "stolice zdobytego miasta usuniete z kolejki"
    );
}

#[test]
fn new_capital_keeps_capital_buildings_and_forfeits_nothing() {
    let p = prod(
        vec![
            item(ProductionKind::Budynek, "palac", Some(3.0)),
            item(ProductionKind::Budynek, "mennica", Some(7.0)),
        ],
        3.0,
    );
    let is_cap = |i: &ProductionItem| i.id == "palac" || i.id == "mennica";
    let mut c = city(1);
    let mut units = Vec::new();
    let out = apply_transfer(
        &mut c,
        2,
        true,
        &mut units,
        Some(TransferProduction {
            prod: &p,
            is_new_capital: true,
            is_capital_only_building: &is_cap,
        }),
    );
    assert_eq!(out.forfeited_praca_to_new, 0.0);
    assert_eq!(out.production.expect("kolejka").kolejka.len(), 2);
}

#[test]
fn flags_population_and_units_follow_web_order() {
    let mut c = TransferCity {
        owner_id: 1,
        population: 0.4,
        q: 2,
        r: 2,
        found_by_owner: Some(true),
        rebel_state: Some(true),
        start_city_state: Some(true),
    };
    let mut units = vec![
        EnterUnit {
            id: "old_on_city".into(),
            owner_id: 1,
            q: 2,
            r: 2,
            ..Default::default()
        },
        EnterUnit {
            id: "new_on_city".into(),
            owner_id: 2,
            q: 2,
            r: 2,
            ..Default::default()
        },
        EnterUnit {
            id: "old_outside".into(),
            owner_id: 1,
            q: 3,
            r: 2,
            ..Default::default()
        },
        EnterUnit {
            id: "old_on_city_2".into(),
            owner_id: 1,
            q: 2,
            r: 2,
            ..Default::default()
        },
    ];
    // Nie-niezalezne miasto (wasIndependent=false) -> foundedByOwner gaszone.
    let out = apply_transfer(&mut c, 2, false, &mut units, None);
    assert_eq!(c.owner_id, 2);
    assert_eq!(c.population, 1.0, "Math.max(1, pop)");
    assert_eq!(c.found_by_owner, Some(false));
    assert_eq!(c.rebel_state, Some(false));
    assert_eq!(c.start_city_state, Some(false));
    assert!(out.start_city_state_cleared);
    assert_eq!(out.removed_unit_ids, vec!["old_on_city", "old_on_city_2"]);
    let left: Vec<&str> = units.iter().map(|u| u.id.as_str()).collect();
    assert_eq!(left, vec!["new_on_city", "old_outside"]);
}

#[test]
fn independent_city_state_keeps_founded_flag_and_nan_pop_passes_through() {
    let mut c = TransferCity {
        owner_id: 1,
        population: f64::NAN,
        q: 0,
        r: 0,
        found_by_owner: Some(true),
        rebel_state: Some(false),
        start_city_state: Some(false),
    };
    let mut units = Vec::new();
    let out = apply_transfer(&mut c, 3, true, &mut units, None);
    assert_eq!(
        c.found_by_owner,
        Some(true),
        "wasIndependent=true -> bez zmiany"
    );
    assert!(c.population.is_nan(), "Math.max(1, NaN) = NaN");
    assert!(!out.start_city_state_cleared, "flaga nie byla true");
    assert_eq!(out.performed, vec!["clearCityStateFlagOnCapture"]);
}
