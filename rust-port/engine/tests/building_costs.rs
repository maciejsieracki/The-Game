#[allow(dead_code)]
#[path = "../src/domain/building_costs.rs"]
mod building_costs;

use std::collections::{BTreeMap, BTreeSet};

use building_costs::{
    building_cost_for, canonical_building_costs, effective_work_cost, spend_building_cost,
    validate_building_expenditure, BuildingCost, BuildingSpendError, ResourceStock,
};

fn cost() -> BuildingCost {
    BuildingCost::new("stolarnia", 20, 10)
        .with_resource_cost("drewno", 25)
        .with_resource_cost("kamien", 30)
}

fn stock(entries: &[(&str, u32)]) -> ResourceStock {
    entries
        .iter()
        .map(|(resource, amount)| ((*resource).to_owned(), *amount))
        .collect()
}

#[test]
fn work_cost_is_linear_and_levels_are_one_based() {
    let building = cost();

    assert_eq!(building.work_cost(0), 20);
    assert_eq!(building.work_cost(1), 20);
    assert_eq!(building.work_cost(2), 30);
    assert_eq!(building.work_cost(3), 40);
}

#[test]
fn effective_work_cost_is_exactly_half_without_scaling_resources() {
    let building = cost();

    assert_eq!(building.effective_work_cost(1), 10);
    assert_eq!(building.effective_work_cost(2), 15);
    assert_eq!(building.effective_work_cost(3), 20);
    assert_eq!(effective_work_cost(31), 16);
    assert_eq!(building.resource_cost("drewno"), Some(25));
    assert_eq!(building.resource_cost("kamien"), Some(30));
}

#[test]
fn resource_cost_is_independent_and_missing_resources_are_reported() {
    let building = cost();
    let available = stock(&[("drewno", 25), ("kamien", 29)]);

    assert_eq!(
        validate_building_expenditure(15, &available, &building, 2),
        Err(BuildingSpendError::InsufficientResource {
            resource: "kamien".to_owned(),
            required: 30,
            available: 29,
        })
    );
}

#[test]
fn expenditure_requires_both_work_and_all_resources() {
    let building = cost();
    let available = stock(&[("drewno", 25), ("kamien", 30)]);

    assert_eq!(
        validate_building_expenditure(14, &available, &building, 2),
        Err(BuildingSpendError::InsufficientWork {
            required: 15,
            available: 14,
        })
    );
    assert!(validate_building_expenditure(15, &available, &building, 2).is_ok());
}

#[test]
fn successful_spend_deducts_effective_work_and_raw_stock_atomically() {
    let building = cost();
    let available = stock(&[("drewno", 40), ("kamien", 50), ("zloto", 7)]);

    let result = spend_building_cost(20, &available, &building, 2).expect("affordable");

    assert_eq!(result.remaining_work, 5);
    assert_eq!(
        result.remaining_resources,
        stock(&[("drewno", 15), ("kamien", 20), ("zloto", 7)])
    );
}

#[test]
fn failed_spend_does_not_mutate_the_input_stock() {
    let building = cost();
    let available = stock(&[("drewno", 25), ("kamien", 29)]);

    assert!(spend_building_cost(100, &available, &building, 1).is_err());
    assert_eq!(available, stock(&[("drewno", 25), ("kamien", 29)]));
}

#[test]
fn mutable_spend_is_atomic_and_preserves_unrelated_resources() {
    let building = cost();
    let mut work = 20;
    let mut resources = stock(&[("drewno", 40), ("kamien", 50), ("zloto", 7)]);

    building
        .try_spend(&mut work, &mut resources, 3)
        .expect("affordable");

    assert_eq!(work, 0);
    assert_eq!(
        resources,
        stock(&[("drewno", 15), ("kamien", 20), ("zloto", 7)])
    );
}

#[test]
fn serde_round_trip_keeps_the_split_cost_contract() {
    let building = cost();
    let encoded = serde_json::to_string(&building).expect("serializes");
    let decoded: BuildingCost = serde_json::from_str(&encoded).expect("deserializes");

    assert_eq!(decoded, building);
}

#[test]
fn empty_resource_cost_is_affordable_without_a_stock_map() {
    let building = BuildingCost::new("pomnik", 1, 0);
    let empty = BTreeMap::new();

    assert!(validate_building_expenditure(1, &empty, &building, 1).is_ok());
}

#[test]
fn canonical_catalog_contains_all_buildings_and_preserves_split_values() {
    let catalog = canonical_building_costs();
    assert_eq!(catalog.len(), 42);
    let ids: BTreeSet<_> = catalog
        .iter()
        .map(|cost| cost.building_id.as_str())
        .collect();
    let expected_ids = [
        "stolarnia",
        "kamieniarski",
        "kuznia",
        "odlewnia_brazu",
        "odlewnia_zelaza",
        "wielka_odlewnia",
        "targowisko",
        "port",
        "port_wielki",
        "spichlerz",
        "spichlerz_ii",
        "garncarnia",
        "cegielnia",
        "kamienne_kregi",
        "swiatynia",
        "biblioteka",
        "studnia",
        "akwedukt",
        "mennica",
        "palisada",
        "mury",
        "koszary",
        "magazyn",
        "stela",
        "palac",
        "palac_ii",
        "palac_iii",
        "kuznia_zelaza",
        "wielka_kuznia",
        "fort",
        "baszta",
        "warsztat_oblezniczy",
        "akademia",
        "teatr",
        "sad",
        "dom_starszyzny",
        "dwor_zarzadcy",
        "pretorium",
        "trybunal",
        "garnizon",
        "laznia_publiczna",
        "akademia_wojskowa",
    ]
    .into_iter()
    .collect::<BTreeSet<_>>();
    assert_eq!(ids, expected_ids);

    let found = building_cost_for("palac_iii").expect("canonical building");
    assert_eq!(found.base_work, 90);
    assert_eq!(found.work_increment, 27);
    assert_eq!(found.resource_cost("drewno"), Some(50));
    assert_eq!(found.resource_cost("cegla"), Some(70));
    assert_eq!(found.effective_work_cost(1), 45);

    assert!(building_cost_for("not-a-building").is_none());
}
