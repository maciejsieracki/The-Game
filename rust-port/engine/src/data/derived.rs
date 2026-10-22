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

/// Stałe dyplomacji (P3-22 grupa DYPLOMACJA, runda 3): `diplomacy-multipliers.json`.
/// Wiersze ROZWINIĘTE (koszyk PN wg trudności, formuła czasu traktatu) są czytane przez
/// `domain/diplomacy.rs`; wiersze BEZ MECHANIKI są NIEUŻYWANE; wiersz NL to zbiór akcji.
pub const DIPLOMACY_MULTIPLIERS_JSON: &str =
    include_str!("../../data/derived/diplomacy-multipliers.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DiplomacyMultipliersFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<DiplomacyMultiplierRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DiplomacyMultiplierRow {
    pub id: String,
    pub klasa: String,
    /// Wartość klasy a (stała).
    #[serde(default)]
    pub wartosc: Option<f64>,
    /// Klasa b po kluczu trudności (`easy` / `normal` / `hard`).
    #[serde(default)]
    pub wartosci_po_trudnosci: Option<BTreeMap<String, f64>>,
    /// Klasa b po stanie o kluczach z webu (`low` / `normal` / `strong`).
    #[serde(default)]
    pub wartosci_po_stanie: Option<BTreeMap<String, f64>>,
    /// Wiersz NL: zbiór identyfikatorów akcji (nie współczynnik).
    #[serde(default)]
    pub zbior: Option<Vec<String>>,
    pub definicja_web: String,
    pub uzycie_web: String,
    pub opis: String,
    pub rust: String,
}

pub fn parse_diplomacy_multipliers() -> Result<DiplomacyMultipliersFile, serde_json::Error> {
    serde_json::from_str(DIPLOMACY_MULTIPLIERS_JSON)
}

fn diplomacy_row(id: &str) -> &'static DiplomacyMultiplierRow {
    static TABLE: std::sync::OnceLock<DiplomacyMultipliersFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| {
            parse_diplomacy_multipliers().expect("diplomacy-multipliers.json must parse")
        })
        .wiersze
        .iter()
        .find(|row| row.id == id)
        .unwrap_or_else(|| panic!("diplomacy-multipliers.json: brak wiersza {id}"))
}

/// Wartość klasy a wiersza `id` z `diplomacy-multipliers.json`. Brak wartości = błąd danych.
pub fn diplomacy_multiplier_value(id: &str) -> f64 {
    diplomacy_row(id)
        .wartosc
        .unwrap_or_else(|| panic!("diplomacy-multipliers.json: brak wartosc klasy a dla {id}"))
}

/// Wartość klasy b wiersza `id` dla stanu `key` (`easy`/`normal`/`hard` albo `low`/`normal`/`strong`).
/// Brak wiersza lub klucza = błąd danych (pokrywa go test kształtu).
pub fn diplomacy_multiplier_by_key(id: &str, key: &str) -> f64 {
    let row = diplomacy_row(id);
    row.wartosci_po_trudnosci
        .as_ref()
        .or(row.wartosci_po_stanie.as_ref())
        .and_then(|map| map.get(key).copied())
        .unwrap_or_else(|| panic!("diplomacy-multipliers.json: brak wartosci {id}[{key}]"))
}

/// Tabela WALKA/OBLĘŻENIE i AI (P3-22 etap 2, runda 4): edytowalne liczby, klasa a/b.
pub const COMBAT_AI_MULTIPLIERS_JSON: &str =
    include_str!("../../data/derived/combat-ai-multipliers.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CombatAiMultipliersFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<CombatAiMultiplierRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CombatAiMultiplierRow {
    pub id: String,
    pub klasa: String,
    /// Wartość klasy a (stała).
    #[serde(default)]
    pub wartosc: Option<f64>,
    /// Klasa b po kluczu stanu (np. poziom weterana `0`..`3`).
    #[serde(default)]
    pub wartosci_po_stanie: Option<BTreeMap<String, f64>>,
    pub zrodlo_wartosci: String,
    pub definicja_web: String,
    pub uzycie_web: String,
    /// `ROZWINIETE` (domena czyta wartość) albo `NIEUZYWANE` (bez mechaniki w Rust).
    pub status_rust: String,
    pub rust: String,
    pub opis: String,
}

pub fn parse_combat_ai_multipliers() -> Result<CombatAiMultipliersFile, serde_json::Error> {
    serde_json::from_str(COMBAT_AI_MULTIPLIERS_JSON)
}

fn combat_ai_row(id: &str) -> &'static CombatAiMultiplierRow {
    static TABLE: std::sync::OnceLock<CombatAiMultipliersFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| {
            parse_combat_ai_multipliers().expect("combat-ai-multipliers.json must parse")
        })
        .wiersze
        .iter()
        .find(|row| row.id == id)
        .unwrap_or_else(|| panic!("combat-ai-multipliers.json: brak wiersza {id}"))
}

/// Wartość klasy a wiersza `id` z `combat-ai-multipliers.json`. Brak wartości = błąd danych.
pub fn combat_ai_multiplier_value(id: &str) -> f64 {
    combat_ai_row(id)
        .wartosc
        .unwrap_or_else(|| panic!("combat-ai-multipliers.json: brak wartosc klasy a dla {id}"))
}

/// Wartość klasy b wiersza `id` dla klucza stanu `key` (np. `"2"` dla poziomu weterana).
pub fn combat_ai_multiplier_by_key(id: &str, key: &str) -> f64 {
    combat_ai_row(id)
        .wartosci_po_stanie
        .as_ref()
        .and_then(|map| map.get(key).copied())
        .unwrap_or_else(|| panic!("combat-ai-multipliers.json: brak wartosci {id}[{key}]"))
}

/// Tabela MACIERZY COUNTER (P3-23 etap 3, grupa WALKA, wiersz 35g): edytowalne liczby.
pub const COUNTER_MULTIPLIERS_JSON: &str =
    include_str!("../../data/derived/counter-multipliers.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CounterMultipliersFile {
    pub meta: serde_json::Value,
    /// Typy jednostek (klucze kanoniczne, małe litery, bez spacji), 8 sztuk.
    pub typy: Vec<String>,
    pub pary: Vec<CounterMultiplierPair>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CounterMultiplierPair {
    /// Typ atakujący (klucz kanoniczny).
    pub atakujacy: String,
    /// Typ celu (klucz kanoniczny).
    pub cel: String,
    /// Mnożnik ataku (1.0 = brak premii).
    pub mnoznik: f64,
}

pub fn parse_counter_multipliers() -> Result<CounterMultipliersFile, serde_json::Error> {
    serde_json::from_str(COUNTER_MULTIPLIERS_JSON)
}

fn counter_multiplier_map() -> &'static BTreeMap<(String, String), f64> {
    static MAP: std::sync::OnceLock<BTreeMap<(String, String), f64>> = std::sync::OnceLock::new();
    MAP.get_or_init(|| {
        parse_counter_multipliers()
            .expect("counter-multipliers.json must parse")
            .pary
            .into_iter()
            .map(|p| ((p.atakujacy, p.cel), p.mnoznik))
            .collect()
    })
}

/// Mnożnik counter z tabeli dla pary kanonicznych typów; `None` = para spoza tabeli
/// (traktowana jako brak premii przez domenę).
pub fn counter_multiplier_value(attacker: &str, defender: &str) -> Option<f64> {
    counter_multiplier_map()
        .get(&(attacker.to_owned(), defender.to_owned()))
        .copied()
}

/// Mnozniki ruchu drogi (P3-23 etap 3, grupa RUCH, wiersz 35i): `road-movement-multipliers.json`.
/// Wiersze ROZWINIETE (`ROAD_MOVE_SPEED_MULT`, `ROAD_BRUK_MOVE_SPEED_MULT`, podloga bruku) sa
/// czytane przez `domain/pathfinding.rs`; wiersz BEZ MECHANIKI (`ROAD_MIN_MOVE_COST`) jest NIEUZYWANY.
pub const ROAD_MOVEMENT_MULTIPLIERS_JSON: &str =
    include_str!("../../data/derived/road-movement-multipliers.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RoadMovementMultipliersFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<RoadMovementMultiplierRow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RoadMovementMultiplierRow {
    pub id: String,
    pub klasa: String,
    /// Wartosc klasy a (stala).
    pub wartosc: f64,
    pub definicja_web: String,
    pub uzycie_web: String,
    pub opis: String,
    pub rust: String,
}

pub fn parse_road_movement_multipliers() -> Result<RoadMovementMultipliersFile, serde_json::Error> {
    serde_json::from_str(ROAD_MOVEMENT_MULTIPLIERS_JSON)
}

/// Wartosc wiersza `id` z `road-movement-multipliers.json`. Brak wiersza to blad danych
/// (pokrywa go test ksztaltu), wiec panika z komunikatem.
pub fn road_movement_value(id: &str) -> f64 {
    static TABLE: std::sync::OnceLock<RoadMovementMultipliersFile> = std::sync::OnceLock::new();
    let table = TABLE.get_or_init(|| {
        parse_road_movement_multipliers().expect("road-movement-multipliers.json must parse")
    });
    table
        .wiersze
        .iter()
        .find(|row| row.id == id)
        .map(|row| row.wartosc)
        .unwrap_or_else(|| panic!("road-movement-multipliers.json: brak wiersza {id}"))
}

/// Dzielnik ruchu (calkowity, >= 1) z tabeli RUCH. Ulamkowa lub niedodatnia wartosc to blad danych.
pub fn road_movement_divisor(id: &str) -> u32 {
    let value = road_movement_value(id);
    assert!(
        value.fract() == 0.0 && value >= 1.0 && value <= f64::from(u32::MAX),
        "road-movement-multipliers.json: {id} musi byc calkowitym dzielnikiem >= 1, jest {value}"
    );
    value as u32
}

// ---------------------------------------------------------------------------
// P6.1C (R-RUSTPORT-P6-1C-START-KLASTRA-Q1): tabele stanu poczatkowego.
// Czytane przez `domain/start_position.rs`. Wartosci balansowe sa EDYTOWALNE
// w `data/derived/start-*.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const START_CLUSTER_PARAMS_JSON: &str =
    include_str!("../../data/derived/start-cluster-params.json");
pub const START_LLAMA_PARAMS_JSON: &str =
    include_str!("../../data/derived/start-llama-params.json");
pub const START_BRAZ_ACCESS_JSON: &str = include_str!("../../data/derived/start-braz-access.json");

/// Pojedyncza wartosc z pochodzeniem w webie (`zrodlo_web`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartValue<T> {
    pub wartosc: T,
    pub zrodlo_web: String,
    #[serde(default)]
    pub uzycie: Option<String>,
    #[serde(default)]
    pub jednostka: Option<String>,
    #[serde(default)]
    pub uwaga: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartTrustRange {
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartRelationParams {
    pub przedzial_zaufania: StartTrustRange,
    pub zrodlo_web: String,
    pub uwaga: String,
}

/// Plik `start-cluster-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartClusterParamsFile {
    pub meta: serde_json::Value,
    pub min_dystans_miast_start_miasto_panstwo: StartValue<u32>,
    pub drugi_czlowiek_tryb_domyslny: StartValue<String>,
    pub drugi_czlowiek_pula_blisko_daleko_ulamek: StartValue<f64>,
    pub nazwa_miasta_zastepcza: StartValue<String>,
    pub start_relacja: StartRelationParams,
}

/// Plik `start-llama-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartLlamaParamsFile {
    pub meta: serde_json::Value,
    pub promien_regionu_startowego: StartValue<u32>,
    pub zloza_na_start: StartValue<u32>,
}

/// Plik `start-braz-access.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartBrazAccessFile {
    pub meta: serde_json::Value,
    pub budynek_odlewnia_brazu: StartValue<String>,
    pub budynki_ulepszenia_odlewni: StartValue<Vec<String>>,
    pub ulepszenie_zrodlo_miedzi: StartValue<String>,
    pub klucz_magazynu_brazu: StartValue<String>,
    pub aliasy_kluczy_ulepszen: StartValue<BTreeMap<String, String>>,
}

pub fn parse_start_cluster_params() -> Result<StartClusterParamsFile, serde_json::Error> {
    serde_json::from_str(START_CLUSTER_PARAMS_JSON)
}

pub fn parse_start_llama_params() -> Result<StartLlamaParamsFile, serde_json::Error> {
    serde_json::from_str(START_LLAMA_PARAMS_JSON)
}

pub fn parse_start_braz_access() -> Result<StartBrazAccessFile, serde_json::Error> {
    serde_json::from_str(START_BRAZ_ACCESS_JSON)
}

/// Tabela parametrow klastra startowego (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn start_cluster_params() -> &'static StartClusterParamsFile {
    static TABLE: std::sync::OnceLock<StartClusterParamsFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_start_cluster_params().expect("start-cluster-params.json must parse"))
}

/// Tabela parametrow posiewu lamy.
pub fn start_llama_params() -> &'static StartLlamaParamsFile {
    static TABLE: std::sync::OnceLock<StartLlamaParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_start_llama_params().expect("start-llama-params.json must parse"))
}

/// Tabela identyfikatorow lancucha brazu.
pub fn start_braz_access() -> &'static StartBrazAccessFile {
    static TABLE: std::sync::OnceLock<StartBrazAccessFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_start_braz_access().expect("start-braz-access.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.1D: tabele bonusow cywilizacji i pul nazw miast (civ-bonuses.ts, city-names-pool.ts).
// Pliki `data/derived/civ-bonus-*.json` sa EDYTOWALNE; generator: `gen-p61d-tables.mjs`
// w runie R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1.
// ---------------------------------------------------------------------------

/// Tabela generowania wpisow bonusow walki z macierzy cywilizacji (MATRIX_COMBAT_SPECS itd.).
pub const CIV_BONUS_MATRIX_SPECS_JSON: &str =
    include_str!("../../data/derived/civ-bonus-matrix-specs.json");
/// Reguly routingu parametrow macierzy do statystyk, warunki kontekstu, stale znizki kosztu.
pub const CIV_BONUS_RULES_JSON: &str = include_str!("../../data/derived/civ-bonus-rules.json");
/// Stale pul nazw miast (dlugosci, sufiksy rzymskie, teksty zastepcze).
pub const CIV_BONUS_CITY_NAMES_JSON: &str =
    include_str!("../../data/derived/civ-bonus-city-names.json");
/// Tabela dekompozycji znakow (odpowiednik `stripDiacritics` weba: NFD bez U+0300-U+036F).
pub const CIV_BONUS_DIACRITICS_JSON: &str =
    include_str!("../../data/derived/civ-bonus-diacritics.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusMatrixSpecsFile {
    pub meta: serde_json::Value,
    pub etykiety: CivBonusLabels,
    pub spec_walka: Vec<CivBonusMatrixSpec>,
    pub wykluczone_g1: Vec<String>,
    pub parametry_dodatkowe: Vec<CivBonusExtraParam>,
    pub koszt_rekrutacji: CivBonusRecruitmentSpec,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusLabels {
    pub opis_prefiks: String,
    pub realizuje_walka: String,
    pub realizuje_ekonomia: String,
    pub typ_walka: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusMatrixSpec {
    pub id: String,
    pub typ: String,
    pub cel: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusExtraParam {
    pub id: String,
    pub cel_domyslne: String,
    pub wyjatki_civ: Vec<CivBonusCelException>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusCelException {
    pub civ_key: String,
    pub cel: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusRecruitmentSpec {
    pub id: String,
    pub typ: String,
    pub cel: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusRulesFile {
    pub meta: serde_json::Value,
    pub pomijane: CivBonusSkipped,
    pub statystyki: Vec<CivBonusStatRule>,
    pub warunki_kontekstu: CivBonusContextRules,
    pub grupy_mnoznikow: CivBonusMultiplierGroups,
    pub koszt_budynkow: CivBonusBuildingCostRule,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusSkipped {
    pub prefiksy: Vec<String>,
    pub id: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusStatRule {
    pub prefiks: String,
    /// Nazwa statystyki: `atk`, `obrona`, `pancerz`, `uderzenie`, `rangedAtk`, `health`.
    pub stat: String,
    pub wyklucz_fragment: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusContextRules {
    pub terytorium_wlasne_id: Vec<String>,
    pub fragment_mur: String,
    pub fragment_las: String,
    pub fragment_plytkie_morze: String,
    pub fragment_runda_szarzy: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusMultiplierGroups {
    pub ruch: Vec<String>,
    pub zasieg: Vec<String>,
    pub oblezenie: Vec<String>,
    pub mur: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusBuildingCostRule {
    pub typ: String,
    pub cel: String,
    pub realizuje: String,
    pub max_znizka: f64,
    pub min_koszt: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusCityNamesFile {
    pub meta: serde_json::Value,
    pub dlugosc_regularna: usize,
    pub dlugosc_panstwa: usize,
    /// Indeks = liczba porzadkowa (0 i 1 puste; 2 => "II" ... 10 => "X").
    pub rzymskie: Vec<String>,
    pub fallback_stolica: String,
    pub fallback_miasto: String,
    pub fallback_rywal_prefiks: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivBonusDiacriticsFile {
    pub meta: serde_json::Value,
    pub mapa: BTreeMap<String, String>,
}

pub fn parse_civ_bonus_matrix_specs() -> Result<CivBonusMatrixSpecsFile, serde_json::Error> {
    serde_json::from_str(CIV_BONUS_MATRIX_SPECS_JSON)
}

pub fn parse_civ_bonus_rules() -> Result<CivBonusRulesFile, serde_json::Error> {
    serde_json::from_str(CIV_BONUS_RULES_JSON)
}

pub fn parse_civ_bonus_city_names() -> Result<CivBonusCityNamesFile, serde_json::Error> {
    serde_json::from_str(CIV_BONUS_CITY_NAMES_JSON)
}

pub fn parse_civ_bonus_diacritics() -> Result<CivBonusDiacriticsFile, serde_json::Error> {
    serde_json::from_str(CIV_BONUS_DIACRITICS_JSON)
}

/// Tabela specyfikacji macierzy (zaladowana raz; blad parsowania to blad danych pokryty testem ksztaltu).
pub fn civ_bonus_matrix_specs() -> &'static CivBonusMatrixSpecsFile {
    static TABLE: std::sync::OnceLock<CivBonusMatrixSpecsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_civ_bonus_matrix_specs().expect("civ-bonus-matrix-specs.json must parse")
    })
}

pub fn civ_bonus_rules() -> &'static CivBonusRulesFile {
    static TABLE: std::sync::OnceLock<CivBonusRulesFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_civ_bonus_rules().expect("civ-bonus-rules.json must parse"))
}

pub fn civ_bonus_city_names() -> &'static CivBonusCityNamesFile {
    static TABLE: std::sync::OnceLock<CivBonusCityNamesFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_civ_bonus_city_names().expect("civ-bonus-city-names.json must parse"))
}

pub fn civ_bonus_diacritics() -> &'static CivBonusDiacriticsFile {
    static TABLE: std::sync::OnceLock<CivBonusDiacriticsFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_civ_bonus_diacritics().expect("civ-bonus-diacritics.json must parse"))
}
