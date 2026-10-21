//! Tabele wartości rozwiniętych (P3-19 FLATTEN-MULTIPLIERS).
//!
//! Pliki `data/derived/*.json` są jawnym, EDYTOWALNYM źródłem prawdy dla ręcznego
//! balansu: właściciel zmienia konkretną liczbę, a nie mnożnik. Wartości startowe
//! (bootstrap) wygenerowano jednorazowo z danych bazowych `units.json` /
//! `buildings.json` i reguł weba (pin `edb8fb56`); pochodzenie każdej liczby jest
//! zapisane w polu `baza` (wiersze jednostek) i `baza_koszt_surowce` (budynki).
//!
//! Silnik NIE mnoży tych współczynników w czasie gry. Testy w `tests/derived_values.rs`
//! sprawdzają wyłącznie KSZTAŁT i KOMPLETNOŚĆ tabel, nie zgodność ze wzorem.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

pub const UNIT_STOCK_COSTS_JSON: &str = include_str!("../../data/derived/unit-stock-costs.json");
pub const BUILDING_STOCK_COSTS_JSON: &str =
    include_str!("../../data/derived/building-stock-costs.json");

/// Klucz zasobu magazynu państwa (ASCII, małe litery) -> ilość. Liczby całkowite >= 0.
pub type StockMap = BTreeMap<String, u32>;

/// Plik `unit-stock-costs.json`: jeden wiersz na każdą jednostkę z `units.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitStockCostsFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<UnitStockRow>,
}

/// Rozwinięty koszt surowcowy jednostki (rekrutacja i utrzymanie surowcowe).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitStockRow {
    pub jednostka: String,
    pub epoka: String,
    /// Jednorazowy koszt surowcowy rekrutacji (łącznie z dopłatą koni dla `Mount`).
    pub surowiec: StockMap,
    /// Utrzymanie surowcowe na turę po rekrutacji.
    pub utrzymanie_surowiec: StockMap,
    /// Wartości bazowe z `units.json`, z których powstał wiersz (pochodzenie liczby).
    pub baza: UnitStockBase,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitStockBase {
    pub surowiec: Option<String>,
    pub surowiec_ilosc: i64,
    pub utrzymanie_surowiec: Option<String>,
    pub utrzymanie_surowiec_ilosc: i64,
    pub dodatek_kon_baza: i64,
}

/// Plik `building-stock-costs.json`: jeden wiersz na każdy budynek z `buildings.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingStockCostsFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<BuildingStockRow>,
}

/// Rozwinięty koszt surowcowy budynku (jednorazowo przy budowie).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingStockRow {
    pub budynek: String,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    pub koszt_surowce: StockMap,
    pub utrzymanie_surowcowe_na_ture: StockMap,
    /// Wartości bazowe z `buildings.json` (`koszt_surowce`), pochodzenie liczby.
    pub baza_koszt_surowce: StockMap,
}

pub fn parse_unit_stock_costs() -> Result<UnitStockCostsFile, serde_json::Error> {
    serde_json::from_str(UNIT_STOCK_COSTS_JSON)
}

pub fn parse_building_stock_costs() -> Result<BuildingStockCostsFile, serde_json::Error> {
    serde_json::from_str(BUILDING_STOCK_COSTS_JSON)
}
