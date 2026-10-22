//! P3-23 etap 3, grupa RUCH (wiersz 35i): test KSZTALTU i podpiecia tabeli
//! `data/derived/road-movement-multipliers.json`. Bez pinow wartosci (tabela ma byc edytowalna);
//! wartosci sprawdza niezalezny weryfikator `verify-road-web.py` wzgledem kodu weba.

use std::collections::BTreeSet;

use civ_engine::data::derived::{
    parse_road_movement_multipliers, road_movement_divisor, road_movement_value,
};
use civ_engine::domain::pathfinding::MovementRules;

#[test]
fn road_movement_table_covers_each_constant_once() {
    let table = parse_road_movement_multipliers().expect("road-movement-multipliers.json parse");
    let ids: BTreeSet<&str> = table.wiersze.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(table.wiersze.len(), 4);
    assert_eq!(ids.len(), 4);
    let expected: BTreeSet<&str> = [
        "ROAD_MOVE_SPEED_MULT",
        "ROAD_BRUK_MOVE_SPEED_MULT",
        "ROAD_BRUK_MIN_MOVE_COST",
        "ROAD_MIN_MOVE_COST",
    ]
    .into_iter()
    .collect();
    assert_eq!(ids, expected);
    for row in &table.wiersze {
        assert_eq!(row.klasa, "a", "klasa wiersza {}", row.id);
        assert!(
            row.wartosc.is_finite() && row.wartosc > 0.0,
            "wartosc {}",
            row.id
        );
        assert!(
            row.rust.starts_with("ROZWINIETA") || row.rust.starts_with("BEZ MECHANIKI"),
            "status Rust wiersza {} niejednoznaczny",
            row.id
        );
        assert!(!row.definicja_web.is_empty() && !row.uzycie_web.is_empty());
    }
}

#[test]
fn road_divisors_are_integers_read_from_the_table() {
    // Dzielniki calkowite >= 1 (kod domeny nie obsluguje ulamkow dla dzielnika).
    let road = road_movement_divisor("ROAD_MOVE_SPEED_MULT");
    let paved = road_movement_divisor("ROAD_BRUK_MOVE_SPEED_MULT");
    assert!(road >= 1 && paved >= 1);
    // Wiazanie domeny: domyslne reguly ruchu czytaja dokladnie te wartosci z tabeli.
    let rules = MovementRules::default();
    assert_eq!(rules.road_divisor, road);
    assert_eq!(rules.paved_road_divisor, paved);
}

#[test]
fn road_floor_row_is_readable_and_positive() {
    // Podloga bruku jest wartoscia ulamkowa (koszt/5 >= podloga); dodatnia i skonczona.
    let floor = road_movement_value("ROAD_BRUK_MIN_MOVE_COST");
    assert!(floor.is_finite() && floor > 0.0 && floor < 1.0);
}
