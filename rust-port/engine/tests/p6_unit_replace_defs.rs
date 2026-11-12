//! P6-UNIT-REPLACE-L3-DEFS (etap 3): port `categoryOf` z pinu 07d2fbd72 i produkcyjna tabela
//! `ReplaceUnitDef` podlaczona do komendy `replace_unit`.
//!
//! Wektory: `p6_unit_replace_defs_vectors/*.json` generowane przez `gen-category-vectors.mjs`
//! (node uruchamia tekst pinu `categoryOf`; patrz naglowek generatora).

use civ_engine::domain::building_costs::p6_7b::{unit_stock_cost, StockRecord};
use civ_engine::domain::playable::{PlayableGame, StartGameParams};
use civ_engine::domain::unit_replace_defs::{category_of, production_replace_defs_for_civ};
use serde::Deserialize;

const PIN_VECTORS: &str = include_str!("p6_unit_replace_defs_vectors/category-vectors-pin.json");
const RUST_VECTORS: &str = include_str!("p6_unit_replace_defs_vectors/category-vectors-rust.json");
const EDGE_VECTORS: &str = include_str!("p6_unit_replace_defs_vectors/category-vectors-edge.json");
const DISCREPANCIES: &str =
    include_str!("p6_unit_replace_defs_vectors/category-discrepancies.json");

const HUMAN_UNIT: u64 = 1;

#[derive(Debug, Deserialize)]
struct CategoryVector {
    name: String,
    role: String,
    is_super: bool,
    typ: Option<String>,
    expected: String,
}

fn parse(json: &str) -> Vec<CategoryVector> {
    serde_json::from_str(json).expect("wektory kategorii parsuja sie")
}

fn check_all(rows: &[CategoryVector]) -> Vec<String> {
    rows.iter()
        .filter_map(|row| {
            let got = category_of(&row.name, &row.role, row.is_super, row.typ.as_deref());
            (got != row.expected).then(|| {
                format!(
                    "{:?} role={:?} super={} typ={:?}: rust={} pin={}",
                    row.name, row.role, row.is_super, row.typ, got, row.expected
                )
            })
        })
        .collect()
}

#[test]
fn kategoria_port_zgodny_z_pinem_dla_75_jednostek() {
    let rows = parse(PIN_VECTORS);
    assert!(rows.len() >= 75, "wektory z pinu: {} wierszy", rows.len());
    let mismatches = check_all(&rows);
    assert!(mismatches.is_empty(), "rozbieznosci: {mismatches:#?}");
}

#[test]
fn kategoria_przypadki_skrajne_i_nieznane_typy() {
    let rows = parse(EDGE_VECTORS);
    assert!(rows.len() >= 30, "przypadki skrajne: {}", rows.len());
    let mismatches = check_all(&rows);
    assert!(mismatches.is_empty(), "rozbieznosci: {mismatches:#?}");
}

#[test]
fn kategoria_dane_rust_zgodne_z_pinem() {
    // Dane Rust (units.json) i pin maja te same pola wejsciowe categoryOf (Jednostka, Rola, Super, Typ):
    // generator nie wykryl rozbieznosci kategorii, a port daje wynik node dla obu zestawow.
    let rows = parse(RUST_VECTORS);
    assert_eq!(rows.len(), 75);
    let mismatches = check_all(&rows);
    assert!(mismatches.is_empty(), "rozbieznosci: {mismatches:#?}");
}

#[test]
fn raport_rozbieznosci_danych_nie_zawiera_roznic_kategorii() {
    let rows: Vec<serde_json::Value> = serde_json::from_str(DISCREPANCIES).expect("json");
    let category_diffs: Vec<&serde_json::Value> = rows
        .iter()
        .filter(|row| row["kind"] == "kategoria-rozna")
        .collect();
    assert!(
        category_diffs.is_empty(),
        "kategoria rozna mimo zgodnych wejsc: {category_diffs:#?}"
    );
}

#[test]
fn tabela_produkcyjna_ma_kategorie_z_wektorow_rust() {
    let defs = production_replace_defs_for_civ(
        "rzymianie",
        "niski",
        civ_engine::domain::types::Difficulty::Normal,
    );
    assert_eq!(defs.len(), 75, "jeden wpis na rekord units.json");
    for row in parse(RUST_VECTORS) {
        let def = defs
            .get(&row.name)
            .unwrap_or_else(|| panic!("brak definicji {}", row.name));
        assert_eq!(def.category, row.expected, "kategoria {}", row.name);
        assert!(def.max_hp > 0.0, "maxHp {}", row.name);
        assert!(def.stock_source.is_some(), "zrodlo surowca {}", row.name);
    }
}

#[test]
fn zamiana_produkcyjna_pobiera_koszt_z_tabeli() {
    let defs = production_replace_defs_for_civ(
        "rzymianie",
        "niski",
        civ_engine::domain::types::Difficulty::Normal,
    );
    let procarz = defs.get("Procarz").expect("Procarz w units.json");
    let cost: StockRecord = unit_stock_cost(procarz.stock_source.as_ref());
    let money = procarz.money_cost;
    assert!(money > 0.0, "koszt Pieniadz Procarza");

    let mut game = PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy");
    game.set_human_treasury(money + 1.0).expect("skarbiec");
    game.set_capital_stock(cost.clone()).expect("stolica");

    game.replace_unit(HUMAN_UNIT, "Procarz", None)
        .expect("zamiana produkcyjna ma sie udac");

    let economy = &game.state().economy;
    assert!(
        (economy.treasury - 1.0).abs() < 1e-9,
        "skarbiec po zamianie: {}",
        economy.treasury
    );
    assert_eq!(
        economy
            .units
            .get(&HUMAN_UNIT)
            .and_then(|s| s.type_id.clone()),
        Some("Procarz".to_owned())
    );
}

#[test]
fn zamiana_produkcyjna_odrzuca_nieznany_typ_bez_zmiany_stanu() {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy");
    game.set_human_treasury(1_000.0).expect("skarbiec");
    let before = game.state().economy.clone();
    assert!(game
        .replace_unit(HUMAN_UNIT, "Nieistniejacy", None)
        .is_err());
    assert_eq!(game.state().economy, before, "odrzucenie nie zmienia stanu");
}
