//! Testy KSZTAŁTU i KOMPLETNOŚCI tabel wartości rozwiniętych (P3-19 FLATTEN-MULTIPLIERS).
//!
//! Tabele `data/derived/*.json` są edytowalnym źródłem prawdy dla ręcznego balansu.
//! Te testy NIE sprawdzają zgodności liczb ze wzorem mnożnikowym weba (to blokowałoby
//! ręczny balans). Sprawdzają: każda jednostka/budynek występuje dokładnie raz, klucze
//! zasobów mają właściwy kształt, wartości są dodatnimi liczbami całkowitymi, a kod
//! domeny czyta dokładnie te liczby z tabeli.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::derived::{parse_building_stock_costs, parse_unit_stock_costs, StockMap};
use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::building_costs::canonical_building_costs;
use civ_engine::domain::recruitment::{canonical_recruitment_costs, recruitment_for};

const MOUNT_EXEMPT_UNIT: &str = "Rydwan (woły)";

const KNOWN_STOCK_KEYS: &[&str] = &[
    "drewno",
    "kamien",
    "glina",
    "ruda",
    "ruda_zelaza",
    "ruda_cyny",
    "cegla",
    "ceramika",
    "braz",
    "zelazo",
    "stal",
    "sol",
    "zloto",
    "wegiel",
    "kon",
];

const CANONICAL_BUILDING_IDS: [&str; 42] = [
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
];

/// Shape helper: lower-case and strip Polish diacritics (the domain key convention).
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

fn keys(map: &StockMap) -> BTreeSet<&str> {
    map.keys().map(String::as_str).collect()
}

#[test]
fn unit_table_has_one_row_per_units_json_record_and_no_extra_rows() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");

    assert_eq!(records.len(), 75);
    assert_eq!(table.wiersze.len(), records.len());

    let table_ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.jednostka.as_str())
        .collect();
    assert_eq!(
        table_ids.len(),
        table.wiersze.len(),
        "duplicate jednostka rows"
    );
    let record_ids: BTreeSet<&str> = records.iter().map(|r| r.jednostka.as_str()).collect();
    assert_eq!(table_ids, record_ids);
}

#[test]
fn unit_table_epoch_field_matches_units_json() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, &str> = records
        .iter()
        .map(|r| (r.jednostka.as_str(), r.epoka.as_str()))
        .collect();

    for row in &table.wiersze {
        assert_eq!(
            by_id.get(row.jednostka.as_str()).copied(),
            Some(row.epoka.as_str()),
            "epoka of {}",
            row.jednostka
        );
        assert!(
            ["Kamień", "Brąz", "Żelazo"].contains(&row.epoka.as_str()),
            "unknown epoka {} for {}",
            row.epoka,
            row.jednostka
        );
    }
}

#[test]
fn unit_table_key_shape_and_positive_integer_values() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, _> = records.iter().map(|r| (r.jednostka.as_str(), r)).collect();

    for row in &table.wiersze {
        let record = by_id[row.jednostka.as_str()];
        let id = row.jednostka.as_str();

        // Stock keys: the resource named in units.json, plus `kon` for Mount (except the exempt ox chariot).
        let mut expected_stock: BTreeSet<&str> = BTreeSet::new();
        let resource_key = record
            .surowiec
            .as_deref()
            .map(str::trim)
            .filter(|r| !r.is_empty() && *r != "-");
        if let Some(name) = resource_key {
            expected_stock.insert(
                KNOWN_STOCK_KEYS
                    .iter()
                    .copied()
                    .find(|k| *k == domain_key(name))
                    .unwrap_or_else(|| panic!("unknown stock key for {id}")),
            );
        }
        if record.typ == "Mount" && id != MOUNT_EXEMPT_UNIT {
            expected_stock.insert("kon");
        }
        assert_eq!(keys(&row.surowiec), expected_stock, "stock key set of {id}");

        let upkeep_name = record
            .utrzymanie_surowiec
            .as_deref()
            .map(str::trim)
            .filter(|r| !r.is_empty() && *r != "-");
        let expected_upkeep: BTreeSet<&str> = match upkeep_name {
            Some(name) => std::iter::once(
                KNOWN_STOCK_KEYS
                    .iter()
                    .copied()
                    .find(|k| *k == domain_key(name))
                    .unwrap_or_else(|| panic!("unknown upkeep key for {id}")),
            )
            .collect(),
            None => BTreeSet::new(),
        };
        assert_eq!(
            keys(&row.utrzymanie_surowiec),
            expected_upkeep,
            "upkeep key set of {id}"
        );

        for (key, value) in row.surowiec.iter().chain(row.utrzymanie_surowiec.iter()) {
            assert!(*value > 0, "{id}: {key} must be a positive integer");
        }
    }
}

#[test]
fn unit_table_keeps_the_units_json_base_as_provenance() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, _> = records.iter().map(|r| (r.jednostka.as_str(), r)).collect();

    for row in &table.wiersze {
        let record = by_id[row.jednostka.as_str()];
        assert_eq!(
            row.baza.surowiec, record.surowiec,
            "baza.surowiec of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.surowiec_ilosc, record.surowiec_ilosc,
            "baza.surowiec_ilosc of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.utrzymanie_surowiec, record.utrzymanie_surowiec,
            "baza.utrzymanie_surowiec of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.utrzymanie_surowiec_ilosc, record.utrzymanie_surowiec_ilosc,
            "baza.utrzymanie_surowiec_ilosc of {}",
            row.jednostka
        );
    }
}

#[test]
fn building_table_has_exactly_the_42_canonical_ids_once_each() {
    let table = parse_building_stock_costs().expect("building table parses");
    assert_eq!(table.wiersze.len(), CANONICAL_BUILDING_IDS.len());

    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.budynek.as_str())
        .collect();
    assert_eq!(ids.len(), table.wiersze.len(), "duplicate budynek rows");
    let expected: BTreeSet<&str> = CANONICAL_BUILDING_IDS.iter().copied().collect();
    assert_eq!(ids, expected);
}

#[test]
fn building_table_key_shape_is_known_resources_and_mirrors_the_base_keys() {
    let table = parse_building_stock_costs().expect("building table parses");

    for row in &table.wiersze {
        let id = row.budynek.as_str();
        assert!((1..=4).contains(&row.epoka_wejscia), "epokaWejscia of {id}");
        assert_eq!(
            keys(&row.koszt_surowce),
            keys(&row.baza_koszt_surowce),
            "stock keys of {id}"
        );
        assert_eq!(
            keys(&row.utrzymanie_surowcowe_na_ture),
            keys(&row.koszt_surowce),
            "building upkeep keys of {id}"
        );
        for key in row.koszt_surowce.keys() {
            assert!(
                KNOWN_STOCK_KEYS.contains(&key.as_str()),
                "{id}: unknown resource key {key}"
            );
        }
        for (key, value) in &row.koszt_surowce {
            assert!(*value > 0, "{id}: {key} must be a positive integer");
        }
    }
}

#[test]
fn building_table_palac_has_no_stock_cost_and_others_do() {
    let table = parse_building_stock_costs().expect("building table parses");
    let palac = table
        .wiersze
        .iter()
        .find(|row| row.budynek == "palac")
        .expect("palac row");
    assert!(palac.koszt_surowce.is_empty());
    assert!(palac.utrzymanie_surowcowe_na_ture.is_empty());

    let stolarnia = table
        .wiersze
        .iter()
        .find(|row| row.budynek == "stolarnia")
        .expect("stolarnia row");
    assert!(!stolarnia.koszt_surowce.is_empty());
}

#[test]
fn domain_recruitment_reads_the_unit_table_values_without_recomputing_them() {
    let table = parse_unit_stock_costs().expect("unit table parses");
    for row in &table.wiersze {
        let unit = recruitment_for(&row.jednostka).expect("canonical unit");
        assert_eq!(
            unit.stock_costs(),
            &row.surowiec,
            "stock of {}",
            row.jednostka
        );
        assert_eq!(
            unit.resource_upkeep_costs(),
            &row.utrzymanie_surowiec,
            "upkeep of {}",
            row.jednostka
        );
    }
    assert_eq!(canonical_recruitment_costs().len(), table.wiersze.len());
}

#[test]
fn domain_building_costs_read_the_building_table_values_without_recomputing_them() {
    let table = parse_building_stock_costs().expect("building table parses");
    let by_id: BTreeMap<&str, &StockMap> = table
        .wiersze
        .iter()
        .map(|row| (row.budynek.as_str(), &row.koszt_surowce))
        .collect();

    let catalog = canonical_building_costs();
    assert_eq!(catalog.len(), table.wiersze.len());
    for cost in &catalog {
        assert_eq!(
            cost.resource_costs(),
            by_id[cost.building_id.as_str()],
            "resource cost of {}",
            cost.building_id
        );
    }
}

// ---------------------------------------------------------------------------
// P3-19 runda 3: tabele Pracy budynków i złota jednostek (KSZTAŁT i KOMPLETNOŚĆ).
// Testy NIE porównują liczb z kosztBudowy / przyrostKosztu / mnożnikiem ery: wartości są
// edytowalne przez właściciela. Sprawdzają komplet wierszy, brak duplikatów, zakres pól
// i to, że kod domeny czyta tabelę bez przeliczania.
// ---------------------------------------------------------------------------

#[test]
fn work_table_has_exactly_the_42_buildings_once_each_and_positive_values() {
    use civ_engine::data::derived::parse_building_work_costs;

    let table = parse_building_work_costs().expect("work table parses");
    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.budynek.as_str())
        .collect();
    assert_eq!(table.wiersze.len(), 42, "one work row per building");
    assert_eq!(ids.len(), table.wiersze.len(), "no duplicate work rows");
    for row in &table.wiersze {
        assert!(
            row.praca_bazowa > 0,
            "praca_bazowa of {} must be > 0",
            row.budynek
        );
        assert!(
            matches!(row.baza.mnoznik_ery, 1 | 2 | 4),
            "provenance era factor of {} must be 1, 2 or 4",
            row.budynek
        );
    }
}

#[test]
fn work_table_is_read_by_the_domain_without_recomputation() {
    use civ_engine::data::derived::parse_building_work_costs;

    let table = parse_building_work_costs().expect("work table parses");
    let by_id: BTreeMap<&str, (u32, u32)> = table
        .wiersze
        .iter()
        .map(|row| (row.budynek.as_str(), (row.praca_bazowa, row.praca_przyrost)))
        .collect();
    for cost in civ_engine::domain::building_costs::canonical_building_costs() {
        assert_eq!(
            (cost.base_work, cost.work_increment),
            by_id[cost.building_id.as_str()],
            "work values of {}",
            cost.building_id
        );
    }
}

#[test]
fn gold_table_has_exactly_the_75_units_once_each_and_known_eras() {
    use civ_engine::data::derived::parse_unit_gold_costs;

    let units = parse_units().expect("units.json parses");
    let table = parse_unit_gold_costs().expect("gold table parses");
    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.jednostka.as_str())
        .collect();
    assert_eq!(table.wiersze.len(), 75, "one gold row per unit");
    assert_eq!(ids.len(), table.wiersze.len(), "no duplicate gold rows");
    for record in &units {
        assert!(
            ids.contains(record.jednostka.as_str()),
            "gold row missing for {}",
            record.jednostka
        );
    }
    for row in &table.wiersze {
        assert!(
            matches!(row.epoka.as_str(), "Kamień" | "Brąz" | "Żelazo"),
            "epoka of {} is one of the three eras",
            row.jednostka
        );
    }
}

#[test]
fn domain_recruitment_reads_the_gold_table_without_recomputation() {
    use civ_engine::data::derived::parse_unit_gold_costs;

    let table = parse_unit_gold_costs().expect("gold table parses");
    let by_id: BTreeMap<&str, (u32, u32)> = table
        .wiersze
        .iter()
        .map(|row| {
            (
                row.jednostka.as_str(),
                (row.pieniadz_koszt, row.utrzymanie_pieniadz_ture),
            )
        })
        .collect();
    for unit in civ_engine::domain::recruitment::canonical_recruitment_costs() {
        assert_eq!(
            (unit.gold_cost, unit.gold_upkeep),
            by_id[unit.unit_id.as_str()],
            "gold values of {}",
            unit.unit_id
        );
    }
}
