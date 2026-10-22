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
    /// Kategoria jednostki wg `categoryOf` (web). `super` i `zwiadowca` mają utrzymanie 0
    /// (economy-upkeep.ts:967-968); wartość w `utrzymanie_pieniadz_ture` to już wynik tej reguły.
    pub kategoria_utrzymania: String,
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

// ---------------------------------------------------------------------------
// Runda 4 (P3-19): tabele wartości rozwiniętych dla wierszy 12-18 i 25 oraz osi (b)
// Pracy budynków i złota jednostek. Wszystkie pliki są edytowalnym źródłem prawdy
// (liczby, nie mnożniki); bootstrap = dyspozycje/autobot/runs/R-RUSTPORT-P3-19-FLATTEN-MULTIPLIERS-Q1/.
// ---------------------------------------------------------------------------

/// Oś (b) Pracy budynków: poziom x pace x tryb x zniżka cywilizacji.
pub const BUILDING_WORK_STATES_JSON: &str =
    include_str!("../../data/derived/building-work-states.json");
/// Oś (b) złota jednostek: pace x tryb x zniżka rekrutacji.
pub const UNIT_GOLD_STATES_JSON: &str = include_str!("../../data/derived/unit-gold-states.json");
/// Utrzymanie złota budynku (wiersz 12), per poziom.
pub const BUILDING_GOLD_UPKEEP_JSON: &str =
    include_str!("../../data/derived/building-gold-upkeep.json");
/// Żywność wojska w setnych (wiersz 13): stan x terytorium x poziom trudności.
pub const UNIT_FOOD_JSON: &str = include_str!("../../data/derived/unit-food.json");
/// Żywność na mieszkańca przy poziomie racji (wiersz 14).
pub const RACJE_JSON: &str = include_str!("../../data/derived/racje.json");
/// Koszt badań (wiersz 15): tempo x tryb.
pub const RESEARCH_COSTS_JSON: &str = include_str!("../../data/derived/research-costs.json");
/// Praca ulepszeń terenu (wiersze 16 i 25), per ulepszenie.
pub const IMPROVEMENT_WORK_JSON: &str = include_str!("../../data/derived/improvement-work.json");
/// Praca i żywność cudów (wiersz 17), per cud.
pub const WONDER_WORK_JSON: &str = include_str!("../../data/derived/wonder-work.json");
/// Limity magazynu (wiersz 18): epoka x poziom trudności; liczba Magazynów = wejście jawne.
pub const STORAGE_CAPS_JSON: &str = include_str!("../../data/derived/storage-caps.json");

/// Tolerancja porównania zniżki (wartości w JSON są dokładnymi ułamkami dziesiętnymi).
const ZNIZKA_EPS: f64 = 1e-9;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkStatesFile {
    pub meta: serde_json::Value,
    pub osie: serde_json::Value,
    pub wiersze: Vec<BuildingWorkStatesRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkStatesRow {
    pub budynek: String,
    pub poziom: u32,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    pub koszt_przed_tempem: u32,
    pub wartosci: Vec<BuildingWorkValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingWorkValue {
    pub pace: String,
    pub tryb: String,
    pub znizka_cywilizacji: f64,
    pub praca: u32,
    /// Koszt zakupu budynku za złoto w tym stanie (web: Praca x 2, production.ts:635-638).
    pub zakup_zloto: u32,
}

impl BuildingWorkStatesFile {
    /// Praca budynku dla konkretnego stanu (b). `None`, gdy klucza nie ma w tabeli.
    pub fn lookup(
        &self,
        budynek: &str,
        poziom: u32,
        pace: &str,
        tryb: &str,
        znizka_cywilizacji: f64,
    ) -> Option<u32> {
        let row = self
            .wiersze
            .iter()
            .find(|r| r.budynek == budynek && r.poziom == poziom)?;
        row.wartosci
            .iter()
            .find(|w| {
                w.pace == pace
                    && w.tryb == tryb
                    && (w.znizka_cywilizacji - znizka_cywilizacji).abs() < ZNIZKA_EPS
            })
            .map(|w| w.praca)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldStatesFile {
    pub meta: serde_json::Value,
    pub osie: serde_json::Value,
    pub wiersze: Vec<UnitGoldStatesRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldStatesRow {
    pub jednostka: String,
    pub epoka: String,
    pub koszt_przed_tempem: u32,
    pub wartosci: Vec<UnitGoldValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitGoldValue {
    pub pace: String,
    pub tryb: String,
    pub znizka_rekrutacji: f64,
    pub pieniadz: u32,
}

impl UnitGoldStatesFile {
    /// Koszt zakupu jednostki w złocie dla konkretnego stanu (b).
    pub fn lookup(
        &self,
        jednostka: &str,
        pace: &str,
        tryb: &str,
        znizka_rekrutacji: f64,
    ) -> Option<u32> {
        let row = self.wiersze.iter().find(|r| r.jednostka == jednostka)?;
        row.wartosci
            .iter()
            .find(|w| {
                w.pace == pace
                    && w.tryb == tryb
                    && (w.znizka_rekrutacji - znizka_rekrutacji).abs() < ZNIZKA_EPS
            })
            .map(|w| w.pieniadz)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGoldUpkeepFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<BuildingGoldUpkeepRow>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGoldUpkeepRow {
    pub budynek: String,
    pub poziom: u32,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    pub utrzymanie_zlota: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitFoodFile {
    pub meta: serde_json::Value,
    pub osie: serde_json::Value,
    pub wiersze: Vec<UnitFoodRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitFoodRow {
    pub jednostka: String,
    pub epoka: String,
    pub zywnosc_baza_tabela: Option<u32>,
    pub wartosci: Vec<UnitFoodValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitFoodValue {
    pub stan: String,
    pub terytorium: String,
    pub poziom_trudnosci: String,
    /// Żywność na turę x 100 (liczba całkowita; 152 = 1,52).
    pub zywnosc_setne: u32,
    pub zywnosc_dokladnie: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RacjeFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<RacjeRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RacjeRow {
    pub poziom_racji: f64,
    pub zywnosc_na_mieszkanca: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResearchCostsFile {
    pub meta: serde_json::Value,
    pub osie: serde_json::Value,
    pub wiersze: Vec<ResearchCostsRow>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResearchCostsRow {
    pub technologia: String,
    pub epoka: String,
    pub koszt_bazowy: u32,
    pub wartosci: Vec<ResearchCostValue>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ResearchCostValue {
    pub tempo: String,
    pub tryb: String,
    pub koszt: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ImprovementWorkFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<ImprovementWorkRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ImprovementWorkRow {
    pub ulepszenie: String,
    pub nazwa: String,
    pub epoka: i64,
    pub koszt_praca_baza: f64,
    pub praca: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WonderWorkFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<WonderWorkRow>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WonderWorkRow {
    pub cud: String,
    pub nazwa: String,
    #[serde(rename = "kosztBudowy")]
    pub koszt_budowy: i64,
    pub praca: u32,
    pub zywnosc: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StorageCapsFile {
    pub meta: serde_json::Value,
    pub osie: serde_json::Value,
    pub wiersze: Vec<StorageCapsRow>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StorageCapsRow {
    pub epoka_ordynal: u32,
    pub mnoznik_ery: u32,
    pub wartosci: Vec<StorageCapValue>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StorageCapValue {
    pub poziom_trudnosci: String,
    pub surowce_baza_epoki: u32,
    pub surowce_bonus_na_magazyn_epoki: u32,
    pub zywnosc_baza: u32,
    pub zywnosc_mnoznik_spichlerz: u32,
}

pub fn parse_building_work_states() -> Result<BuildingWorkStatesFile, serde_json::Error> {
    serde_json::from_str(BUILDING_WORK_STATES_JSON)
}
pub fn parse_unit_gold_states() -> Result<UnitGoldStatesFile, serde_json::Error> {
    serde_json::from_str(UNIT_GOLD_STATES_JSON)
}
pub fn parse_building_gold_upkeep() -> Result<BuildingGoldUpkeepFile, serde_json::Error> {
    serde_json::from_str(BUILDING_GOLD_UPKEEP_JSON)
}
pub fn parse_unit_food() -> Result<UnitFoodFile, serde_json::Error> {
    serde_json::from_str(UNIT_FOOD_JSON)
}
pub fn parse_racje() -> Result<RacjeFile, serde_json::Error> {
    serde_json::from_str(RACJE_JSON)
}
pub fn parse_research_costs() -> Result<ResearchCostsFile, serde_json::Error> {
    serde_json::from_str(RESEARCH_COSTS_JSON)
}
pub fn parse_improvement_work() -> Result<ImprovementWorkFile, serde_json::Error> {
    serde_json::from_str(IMPROVEMENT_WORK_JSON)
}
pub fn parse_wonder_work() -> Result<WonderWorkFile, serde_json::Error> {
    serde_json::from_str(WONDER_WORK_JSON)
}
pub fn parse_storage_caps() -> Result<StorageCapsFile, serde_json::Error> {
    serde_json::from_str(STORAGE_CAPS_JSON)
}

/// Stałe handlu (P3-22 grupa HANDEL): `trade-multipliers.json`.
/// Wiersze ROZWINIĘTE (`TRADE_ROUTE_BUILDING_BONUS_RATE`, `PORT_SEA_TRADE_BONUS_PIENIADZ`)
/// są czytane przez `domain/trade.rs`; pozostałe są BEZ MECHANIKI (NIEUŻYWANE).
pub const TRADE_MULTIPLIERS_JSON: &str = include_str!("../../data/derived/trade-multipliers.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TradeMultipliersFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<TradeMultiplierRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TradeMultiplierRow {
    pub id: String,
    pub klasa: String,
    /// Wartość klasy a (stała). Brak dla wiersza klasy b.
    #[serde(default)]
    pub wartosc: Option<f64>,
    /// Wartości klasy b po kluczu trudności (`easy` / `normal` / `hard`).
    #[serde(default)]
    pub wartosci_po_trudnosci: Option<BTreeMap<String, f64>>,
    pub definicja_web: String,
    pub uzycie_web: String,
    pub opis: String,
    pub rust: String,
}

pub fn parse_trade_multipliers() -> Result<TradeMultipliersFile, serde_json::Error> {
    serde_json::from_str(TRADE_MULTIPLIERS_JSON)
}

/// Wartość klasy a wiersza `id` z `trade-multipliers.json`. Brak wiersza lub wartości
/// to błąd danych (pokrywa go test kształtu), więc panika z komunikatem.
pub fn trade_multiplier_value(id: &str) -> f64 {
    static TABLE: std::sync::OnceLock<TradeMultipliersFile> = std::sync::OnceLock::new();
    let table =
        TABLE.get_or_init(|| parse_trade_multipliers().expect("trade-multipliers.json must parse"));
    table
        .wiersze
        .iter()
        .find(|row| row.id == id)
        .and_then(|row| row.wartosc)
        .unwrap_or_else(|| panic!("trade-multipliers.json: brak wartosc klasy a dla {id}"))
}
