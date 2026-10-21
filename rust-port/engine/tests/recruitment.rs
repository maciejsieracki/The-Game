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

    // Values from gra/data/units.json (Wojownik: koszt 5, Drewno 13, utrzymanie 1 + Drewno 3).
    // Previously hard-coded 10 / 50 / 10 (see P3-17 audit, Wojownik row).
    assert_eq!(warrior.gold_cost, 5);
    assert_eq!(warrior.stock_cost("drewno"), Some(13));
    assert_eq!(warrior.resource_upkeep("drewno"), Some(3));
    assert_eq!(warrior.gold_upkeep, 1);

    let cavalry = recruitment_for("Konnica").expect("canonical cavalry");
    assert_eq!(cavalry.stock_cost("braz"), Some(25));
    // KNOWN DIVERGENCE (P3-17 audit, objection 6): the web runtime adds a mount horse
    // surcharge (`MOUNT_UNIT_HORSE_STOCK_COST = 25` on `kon`, building-stock-cost.ts:368-369,
    // 383-389, 415-417) for every Typ == Mount unit except Rydwan (woły), scaled by epoch.
    // units.json has no `kon` column, so the domain row carries no `kon` cost. This assertion
    // pins the JSON value; it does NOT claim parity with the web surcharge (see doc section 3).
    assert_eq!(cavalry.stock_cost("kon"), None);
    assert_eq!(cavalry.resource_upkeep("braz"), Some(5));

    let ox_chariot = recruitment_for("Rydwan (woły)").expect("canonical ox chariot");
    assert_eq!(ox_chariot.stock_cost("kon"), None);
}

#[test]
fn recruitment_affordability_checks_only_the_one_time_purchase_stock() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let spearman = recruitment_for("Włócznik").expect("canonical spearman");

    assert!(can_afford_recruitment(&stock(&[("drewno", 13)]), &warrior));
    assert!(!can_afford_recruitment(&stock(&[("drewno", 12)]), &warrior));
    assert!(!can_afford_recruitment(
        &stock(&[("drewno", 57), ("kamien", 999)]),
        &spearman
    ));
    assert!(can_afford_recruitment(&stock(&[("braz", 25)]), &spearman));
    assert!(!can_afford_recruitment(&stock(&[("braz", 24)]), &spearman));
}

#[test]
fn successful_recruitment_spends_purchase_stock_but_not_future_upkeep() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let available = stock(&[("drewno", 57), ("zloto", 40)]);

    let result = spend_recruitment(&available, &warrior).expect("purchase is affordable");

    assert_eq!(
        result.remaining_stock,
        stock(&[("drewno", 44), ("zloto", 40)])
    );
    assert_eq!(warrior.resource_upkeep("drewno"), Some(3));
}

#[test]
fn failed_recruitment_is_atomic_and_reports_the_missing_resource() {
    let warrior = recruitment_for("Wojownik").expect("canonical warrior");
    let available = stock(&[("drewno", 12), ("zloto", 40)]);

    assert_eq!(
        spend_recruitment(&available, &warrior),
        Err(RecruitmentError::InsufficientStock {
            resource: "drewno".to_owned(),
            required: 13,
            available: 12,
        })
    );
    assert_eq!(available, stock(&[("drewno", 12), ("zloto", 40)]));
}

#[test]
fn upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units() {
    let total = total_resource_upkeep(&[
        "Wojownik",
        "Wojownik",
        "Włócznik",
        "unit-that-does-not-exist",
    ]);

    assert_eq!(total, stock(&[("braz", 5), ("drewno", 6)]));
}

/// Lower-case, strip Polish diacritics: the domain key convention for resources.
fn domain_key(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| match c {
            'ą' => 'a',
            'ć' => 'c',
            'ę' => 'e',
            'ł' => 'l',
            'ń' => 'n',
            'ó' => 'o',
            'ś' => 's',
            'ź' | 'ż' => 'z',
            other => other,
        })
        .collect()
}

#[test]
fn canonical_catalog_matches_units_json_for_all_75_rows() {
    let records = civ_engine::data::units_combat::parse_units().expect("units.json parses");
    assert_eq!(records.len(), 75);

    let catalog = canonical_recruitment_costs();
    assert_eq!(catalog.len(), records.len());

    for record in &records {
        let unit = recruitment_for(&record.jednostka)
            .unwrap_or_else(|| panic!("missing canonical row {}", record.jednostka));
        let id = record.jednostka.as_str();

        assert_eq!(unit.unit_type, record.typ, "Typ of {id}");
        assert_eq!(
            i64::from(unit.gold_cost),
            record.pieniadz_koszt,
            "Pieniądz (koszt) of {id}"
        );
        assert_eq!(
            i64::from(unit.gold_upkeep),
            record.utrzymanie_pieniadz_ture,
            "Utrzymanie (Pieniądz/turę) of {id}"
        );

        let expected_stock: ResourceStock = record
            .surowiec
            .iter()
            .map(|resource| (domain_key(resource), record.surowiec_ilosc as u32))
            .collect();
        assert_eq!(unit.stock_cost, expected_stock, "Surowiec of {id}");

        let expected_upkeep: ResourceStock = record
            .utrzymanie_surowiec
            .iter()
            .map(|resource| {
                (
                    domain_key(resource),
                    record.utrzymanie_surowiec_ilosc as u32,
                )
            })
            .collect();
        assert_eq!(
            unit.resource_upkeep, expected_upkeep,
            "Utrzymanie surowiec of {id}"
        );

        assert_eq!(
            unit.super_unit,
            record.super_jednostka == "TAK",
            "Super-jednostka of {id}"
        );
    }
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
