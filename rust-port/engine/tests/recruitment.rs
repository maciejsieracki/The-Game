use std::collections::BTreeMap;

use civ_engine::domain::recruitment::{
    self, can_afford_recruitment, canonical_recruitment_costs, recruitment_for, spend_recruitment,
    total_resource_upkeep, RecruitmentError, ResourceStock,
};

fn stock(entries: &[(&str, u32)]) -> ResourceStock {
    entries
        .iter()
        .map(|(resource, amount)| ((*resource).to_owned(), *amount))
        .collect()
}

#[test]
fn canonical_unit_record_keeps_purchase_and_upkeep_separate() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");

    assert_eq!(warrior.gold_cost, 10);
    assert_eq!(warrior.stock_cost("drewno"), Some(50));
    assert_eq!(warrior.resource_upkeep("drewno"), Some(10));
    assert_eq!(warrior.gold_upkeep, 1);

    let cavalry = recruitment_for("Konnica").expect("canonical cavalry");
    assert_eq!(cavalry.stock_cost("braz"), Some(50));
    assert_eq!(cavalry.stock_cost("kon"), Some(25));
    assert_eq!(cavalry.resource_upkeep("braz"), Some(10));

    let ox_chariot = recruitment_for("Rydwan (woły)").expect("canonical ox chariot");
    assert_eq!(ox_chariot.stock_cost("kon"), None);
}

#[test]
fn recruitment_affordability_checks_only_the_one_time_purchase_stock() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let spearman = recruitment_for("Włócznik").expect("canonical spearman");

    assert!(can_afford_recruitment(&stock(&[("drewno", 57)]), &warrior));
    assert!(!can_afford_recruitment(&stock(&[("drewno", 49)]), &warrior));
    assert!(!can_afford_recruitment(
        &stock(&[("drewno", 57), ("kamien", 999)]),
        &spearman
    ));
}

#[test]
fn successful_recruitment_spends_purchase_stock_but_not_future_upkeep() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let available = stock(&[("drewno", 57), ("zloto", 40)]);

    let result = spend_recruitment(&available, &warrior).expect("purchase is affordable");

    assert_eq!(
        result.remaining_stock,
        stock(&[("drewno", 7), ("zloto", 40)])
    );
    assert_eq!(warrior.resource_upkeep("drewno"), Some(10));
}

#[test]
fn failed_recruitment_is_atomic_and_reports_the_missing_resource() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let available = stock(&[("drewno", 49), ("zloto", 40)]);

    assert_eq!(
        spend_recruitment(&available, &warrior),
        Err(RecruitmentError::InsufficientStock {
            resource: "drewno".to_owned(),
            required: 50,
            available: 49,
        })
    );
    assert_eq!(available, stock(&[("drewno", 49), ("zloto", 40)]));
}

#[test]
fn upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units() {
    let total = total_resource_upkeep(&[
        "Wojownik",
        "Wojownik",
        "Włócznik",
        "unit-that-does-not-exist",
    ]);

    assert_eq!(total, stock(&[("braz", 10), ("drewno", 20)]));
}

#[test]
fn canonical_catalog_contains_all_unit_rows_and_round_trips() {
    let catalog = canonical_recruitment_costs();
    assert_eq!(catalog.len(), 75);

    let ids: std::collections::BTreeSet<_> =
        catalog.iter().map(|unit| unit.unit_id.as_str()).collect();
    assert_eq!(ids.len(), catalog.len());

    let encoded = serde_json::to_string(&catalog).expect("catalog serializes");
    let decoded: Vec<recruitment::UnitRecruitment> =
        serde_json::from_str(&encoded).expect("catalog deserializes");
    assert_eq!(decoded, catalog);
}

#[test]
fn empty_purchase_cost_is_affordable_and_keeps_stock_unchanged() {
    let free = recruitment::UnitRecruitment::new("free", "Swordsman", 0, 0)
        .with_stock_cost("drewno", 0)
        .with_resource_upkeep("drewno", 10);
    let available = BTreeMap::new();

    assert!(can_afford_recruitment(&available, &free));
    let result = spend_recruitment(&available, &free).expect("zero purchase cost");
    assert!(result.remaining_stock.is_empty());
}
