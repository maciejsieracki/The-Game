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
/// Praca (Work) budynków: wartości już pomnożone przez mnożnik ery (runda 3, Q1=A).
pub const BUILDING_WORK_COSTS_JSON: &str =
    include_str!("../../data/derived/building-work-costs.json");
/// Złoto jednostek: koszt zakupu (po mnożniku epoki) i utrzymanie (po epoce i x4).
pub const UNIT_GOLD_COSTS_JSON: &str = include_str!("../../data/derived/unit-gold-costs.json");

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
    /// Utrzymanie surowcowe na turę (rozwinięte z webu: 5 na każdy klucz kosztu).
    /// NIEUŻYWANE w silniku w tym commicie: brak czytnika i brak mechaniki
    /// utrzymania surowcowego budynków w Rust (zob. P3-19 §2 wiersz 7, §9 pyt. 7).
    pub utrzymanie_surowcowe_na_ture: StockMap,
    /// Wartości bazowe z `buildings.json` (`koszt_surowce`), pochodzenie liczby.
    pub baza_koszt_surowce: StockMap,
}

/// Plik `building-work-costs.json`: jeden wiersz na każdy budynek z `buildings.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkCostsFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<BuildingWorkRow>,
}

/// Rozwinięta Praca budynku: `praca_bazowa` = kosztBudowy x mnożnik ery,
/// `praca_przyrost` = przyrostKosztu x mnożnik ery (poziom n: bazowa + przyrost x (n-1)).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkRow {
    pub budynek: String,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    pub praca_bazowa: u32,
    pub praca_przyrost: u32,
    pub baza: BuildingWorkBase,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkBase {
    #[serde(rename = "kosztBudowy")]
    pub koszt_budowy: i64,
    #[serde(rename = "przyrostKosztu")]
    pub przyrost_kosztu: i64,
    pub mnoznik_ery: i64,
}

/// Plik `unit-gold-costs.json`: jeden wiersz na każdą jednostkę z `units.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldCostsFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<UnitGoldRow>,
}

/// Rozwinięte złoto jednostki: koszt zakupu i utrzymanie na turę (liczby całkowite >= 0).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldRow {
    pub jednostka: String,
    pub epoka: String,
    pub pieniadz_koszt: u32,
    pub utrzymanie_pieniadz_ture: u32,
    pub baza: UnitGoldBase,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldBase {
    pub pieniadz_koszt_zrodlo: Option<i64>,
    pub rola_linia: Option<String>,
    pub super_jednostka: Option<String>,
    pub utrzymanie_zrodlo: Option<i64>,
}

pub fn parse_unit_stock_costs() -> Result<UnitStockCostsFile, serde_json::Error> {
    serde_json::from_str(UNIT_STOCK_COSTS_JSON)
}

pub fn parse_building_work_costs() -> Result<BuildingWorkCostsFile, serde_json::Error> {
    serde_json::from_str(BUILDING_WORK_COSTS_JSON)
}

pub fn parse_unit_gold_costs() -> Result<UnitGoldCostsFile, serde_json::Error> {
    serde_json::from_str(UNIT_GOLD_COSTS_JSON)
}

pub fn parse_building_stock_costs() -> Result<BuildingStockCostsFile, serde_json::Error> {
    serde_json::from_str(BUILDING_STOCK_COSTS_JSON)
}
