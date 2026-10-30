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
    /// Identyfikatory pominiete przy generowaniu wpisow (web `MATRIX_ADAPTER_EXCLUDED_IDS`,
    /// R-RUSTPORT-REPIN-LOGIKA-CIV-Q1: od 91dc998a tylko `walka_atak_lukownicy`).
    pub wykluczone_g1: Vec<String>,
    /// Identyfikatory, dla ktorych wpis o wartosci 0 jest emitowany, gdy cywilizacja ma wiersz
    /// w macierzy (web `MATRIX_ZERO_MARKER_IDS`).
    #[serde(default)]
    pub zerowe_markery: Vec<String>,
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
    /// Klucze cywilizacji, dla ktorych parametr jest calkowicie pomijany (web: Egipt, `walka_ruch_bitwa_proc`).
    #[serde(default)]
    pub pomin_civ: Vec<String>,
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
    /// Wyjatki celu per cywilizacja (web: `zulusi` -> `Impi`).
    #[serde(default)]
    pub wyjatki_civ: Vec<CivBonusCelException>,
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

// ---------------------------------------------------------------------------
// P6.1B (R-RUSTPORT-P6-1B-PLAYERSTATE-Q1): stale stanu gracza i badan
// `player-state-params.json` (web playerState.ts). Czyta je `domain/player.rs`.
// ---------------------------------------------------------------------------

pub const PLAYER_STATE_PARAMS_JSON: &str =
    include_str!("../../data/derived/player-state-params.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlayerStateParamsFile {
    pub meta: serde_json::Value,
    pub pieniadz_mnoznik: i64,
    pub research_queue_max: usize,
    pub brak_prereq: Vec<String>,
    pub numer_epoki: BTreeMap<String, i64>,
    pub diakrytyki_epoki: BTreeMap<char, char>,
    pub technologia_pieniadza: String,
    pub uwagi_pieniadza_igla: String,
    /// Klucz trudnosci (`easy`/`normal`/`hard`) -> os `tryb` w `research-costs.json` dla gracza.
    pub tryb_badan_gracza: BTreeMap<String, String>,
    pub stan_poczatkowy: PlayerStateInitial,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlayerStateInitial {
    pub skarbiec: f64,
    pub nauka: f64,
    pub era: i64,
    pub pieniadz_mnoznik: i64,
    pub tempo_gry: String,
    pub building_cost_pace: String,
    pub koszt_jednostek_pace: String,
    pub wzrost_ludnosci_pace: String,
    pub ruch_swiata_pace: String,
    pub civ_type: String,
    pub rakieta_wystrzelona: bool,
}

pub fn parse_player_state_params() -> Result<PlayerStateParamsFile, serde_json::Error> {
    serde_json::from_str(PLAYER_STATE_PARAMS_JSON)
}

impl ResearchCostsFile {
    /// Koszt badania dla (technologia, tempo, tryb). `None`, gdy klucza nie ma w tabeli.
    pub fn lookup(&self, technologia: &str, tempo: &str, tryb: &str) -> Option<u32> {
        let row = self.wiersze.iter().find(|r| r.technologia == technologia)?;
        row.wartosci
            .iter()
            .find(|w| w.tempo == tempo && w.tryb == tryb)
            .map(|w| w.koszt)
    }
}

// ---------------------------------------------------------------------------
// P6.2 / P6.3 (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1): tabele Porzadku, regul ulepszen
// terenu i regul ruchu/fortow. Wartosci balansowe sa EDYTOWALNE w
// `data/derived/{porzadek-params,ulepszenia-reguly,teren-ruch-reguly}.json`; kod
// (`domain/types.rs::porzadek`, `domain/improvements.rs`, `domain/pathfinding.rs`,
// `domain/terrain.rs`) nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const PORZADEK_PARAMS_JSON: &str = include_str!("../../data/derived/porzadek-params.json");
pub const ULEPSZENIA_REGULY_JSON: &str = include_str!("../../data/derived/ulepszenia-reguly.json");
pub const TEREN_RUCH_REGULY_JSON: &str = include_str!("../../data/derived/teren-ruch-reguly.json");
/// `society-params.json` jako zrodlo bloku `porzadek` / `szczescie` dla `load_order_params`.
pub const SOCIETY_PARAMS_JSON: &str = include_str!("../../data/society-params.json");

/// Wiersz tabeli nazwanych wartosci liczbowych.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NamedValueRow {
    pub id: String,
    pub wartosc: f64,
    pub definicja_web: String,
    pub opis: String,
}

/// Plik `porzadek-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PorzadekParamsFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<NamedValueRow>,
}

pub fn parse_porzadek_params() -> Result<PorzadekParamsFile, serde_json::Error> {
    serde_json::from_str(PORZADEK_PARAMS_JSON)
}

/// Wartosc wiersza `id` z `porzadek-params.json`. Brak wiersza to blad danych (pokrywa go test
/// ksztaltu), wiec panika z komunikatem.
pub fn porzadek_param(id: &str) -> f64 {
    static TABLE: std::sync::OnceLock<PorzadekParamsFile> = std::sync::OnceLock::new();
    let table =
        TABLE.get_or_init(|| parse_porzadek_params().expect("porzadek-params.json must parse"));
    table
        .wiersze
        .iter()
        .find(|row| row.id == id)
        .map(|row| row.wartosc)
        .unwrap_or_else(|| panic!("porzadek-params.json: brak wiersza {id}"))
}

/// Para `ulepszenie` -> `surowiec`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UlepszenieSurowiec {
    pub ulepszenie: String,
    pub surowiec: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SkalaPracy {
    pub zrodlo_web: String,
    pub fala2_mnoznik: f64,
    pub epoka_domyslna: f64,
    pub mnozniki_epoki: BTreeMap<i64, f64>,
    pub podstawa_podwajania: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProdukcjaEpoka {
    pub zrodlo_web: String,
    pub mnoznik_za_epoke: f64,
    pub epoka_min: i64,
    pub epoka_max: i64,
    pub ulepszenia_skalowane: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerytoriumReguly {
    pub zrodlo_web: String,
    pub domyslna_ilosc: f64,
    pub ulepszenia: Vec<UlepszenieSurowiec>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RudaReguly {
    pub zrodlo_web: String,
    pub na_kopalnie: f64,
    pub kopalnie: Vec<UlepszenieSurowiec>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AliasLegacy {
    pub stary: String,
    pub nowy: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AliasyLegacy {
    pub zrodlo_web: String,
    pub aliasy: Vec<AliasLegacy>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ZlozeUlepszenie {
    pub zloze: String,
    pub ulepszenie: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MigracjaKopalni {
    pub zrodlo_web: String,
    pub klucz_legacy: String,
    pub zloze_zelazo: ZlozeUlepszenie,
    pub zloza_miedzi: Vec<String>,
    pub nakladka_rudy: String,
    pub ulepszenie_miedzi: String,
    pub zloze_bez_migracji: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HodowlaReguly {
    pub zrodlo_web: String,
    pub surowce: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ZywnoscReguly {
    pub zrodlo_web: String,
    pub ulepszenie_farmy: String,
    pub farma_bonus_domyslny: f64,
    pub kara_las: f64,
    pub ulepszenia: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DrogiReguly {
    pub zrodlo_web: String,
    pub ulepszenia: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NakladkaUlepszenie {
    pub nakladka: String,
    pub ulepszenie: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ZlozeZwierzeceReguly {
    pub zrodlo_web: String,
    pub wiersze: Vec<NakladkaUlepszenie>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UkrywanieZlozaRow {
    pub ulepszenie: String,
    pub nakladki: Vec<String>,
    pub zloza: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UkrywanieZloza {
    pub zrodlo_web: String,
    pub wiersze: Vec<UkrywanieZlozaRow>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TypWycinka {
    pub zrodlo_web: String,
    pub typ: String,
}

/// Nazwy wlasciwosci `Object.prototype` (efekt obiektu JS `IMPROVEMENTS`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct KluczePrototypuJs {
    pub zrodlo_web: String,
    pub klucze: Vec<String>,
}

/// Plik `ulepszenia-reguly.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UlepszeniaRegulyFile {
    pub meta: serde_json::Value,
    pub skala_pracy: SkalaPracy,
    pub produkcja_epoka: ProdukcjaEpoka,
    pub terytorium: TerytoriumReguly,
    pub ruda: RudaReguly,
    pub aliasy_legacy: AliasyLegacy,
    pub klucze_prototypu_js: KluczePrototypuJs,
    pub migracja_kopalni: MigracjaKopalni,
    pub hodowla: HodowlaReguly,
    pub zywnosc: ZywnoscReguly,
    pub drogi: DrogiReguly,
    pub zloze_zwierzece: ZlozeZwierzeceReguly,
    pub ukrywanie_zloza: UkrywanieZloza,
    pub typ_wycinka: TypWycinka,
}

pub fn parse_ulepszenia_reguly() -> Result<UlepszeniaRegulyFile, serde_json::Error> {
    serde_json::from_str(ULEPSZENIA_REGULY_JSON)
}

/// Tabela regul ulepszen terenu (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn ulepszenia_reguly() -> &'static UlepszeniaRegulyFile {
    static TABLE: std::sync::OnceLock<UlepszeniaRegulyFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_ulepszenia_reguly().expect("ulepszenia-reguly.json must parse"))
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MiastoObceReguly {
    pub zrodlo_web: String,
    pub budynki_obronne: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct FortReguly {
    pub zrodlo_web: String,
    pub ewakuacja_maks_pierscien: u32,
    pub ulepszenie_fort: String,
    pub ulepszenie_posterunek: String,
}

/// Plik `teren-ruch-reguly.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerenRuchRegulyFile {
    pub meta: serde_json::Value,
    pub miasto_obce: MiastoObceReguly,
    pub fort: FortReguly,
}

pub fn parse_teren_ruch_reguly() -> Result<TerenRuchRegulyFile, serde_json::Error> {
    serde_json::from_str(TEREN_RUCH_REGULY_JSON)
}

/// Tabela regul ruchu / fortow.
pub fn teren_ruch_reguly() -> &'static TerenRuchRegulyFile {
    static TABLE: std::sync::OnceLock<TerenRuchRegulyFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_teren_ruch_reguly().expect("teren-ruch-reguly.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.1E (R-RUSTPORT-P6-1E-CIV-DANE-MACIERZE-Q1): stale macierzy cywilizacji, profili AI,
// przydzialu cywilizacji i semantycznej prezentacji macierzy (web civ-matrix.ts,
// civ-matrix-semantic.ts, civ-ai-data.ts, civ-roster.ts, civ-names.ts). Czytaja je
// `domain/civ_matrix.rs` i `domain/civ_names.rs`.
// ---------------------------------------------------------------------------

pub const CIV_MATRIX_PARAMS_JSON: &str = include_str!("../../data/derived/civ-matrix-params.json");
pub const CIV_MATRIX_SEMANTIC_JSON: &str =
    include_str!("../../data/derived/civ-matrix-semantic.json");

/// `civ-matrix-params.json`: trudnosc, formula domyslna, profile AI, dyplomacja, przydzial.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivMatrixParamsFile {
    pub meta: serde_json::Value,
    pub trudnosc: CivMatrixDifficultyRule,
    pub formula_domyslna: String,
    pub nazwy: CivNamesParams,
    pub roster: CivRosterParams,
    pub ai: CivAiParams,
    pub dyplomacja: CivDiplomacyParams,
    /// Wartosc `TypCywilizacji`, dla ktorej web nie ma nazwy Excel (`DrobnaCywilizacja`).
    pub typ_bez_nazwy_excel: String,
}

/// Skalowanie parametrow `skala` poziomem trudnosci (web `civMatrixParamAtDifficulty`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivMatrixDifficultyRule {
    pub formula_skalowana: String,
    pub delta_latwy: f64,
    pub delta_trudny: f64,
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivNamesParams {
    /// Web `MIASTA_CYWILIZACJI_LEN`: pierwsze N pozycji wspolnej puli to miasta cywilizacji.
    pub miasta_cywilizacji_len: usize,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivRosterParams {
    pub przesuniecie_ziarna_tasowania_ai: i64,
    pub awaryjny_typ: String,
    pub min_typow: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivAiParams {
    pub parametry: CivAiParamIds,
    pub domyslna_wartosc_skali: f64,
    pub dzielnik_skali: f64,
    pub zakres: CivUnitRange,
    pub profil_obronna_wartosc: f64,
    pub profil_mapy_obronna: String,
    pub profil_mapy_standardowa: String,
}

/// Identyfikatory parametrow macierzy czytane przez profil AI.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivAiParamIds {
    pub agresywnosc: String,
    pub ekspansywnosc: String,
    pub priorytet_militarny: String,
    pub priorytet_ekonomia: String,
    pub priorytet_nauka: String,
    pub tolerancja_ryzyka: String,
    pub sklonnosc_podboju: String,
    pub profil_obronna: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivUnitRange {
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivDiplomacyParams {
    pub parametr_handel: String,
    /// Parametr bazy agresji archetypu (web `dip_agresja_archetyp`, REPIN-LOGIKA-CIV-Q1).
    pub parametr_agresja_archetyp: String,
    pub dzielnik_otwartosc_handel: f64,
    pub parametr_nastawienie: String,
    pub nastawienie_baza_domyslna: f64,
    pub nastawienie_podzial: f64,
}

/// `civ-matrix-semantic.json`: zbiory statusow, teksty i slowniki prezentacji macierzy.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivMatrixSemanticFile {
    pub meta: serde_json::Value,
    pub wersja: String,
    pub trudnosc: String,
    pub baza_porownania: String,
    pub zrodlo_wartosci: CivSemanticSources,
    pub nieznane: CivSemanticUnknown,
    pub skala_intensywnosci: CivSemanticScale,
    pub polaryzacja: CivSemanticPolarityNames,
    pub etykiety_kierunku: CivSemanticDirectionLabels,
    pub polityka_pasm: String,
    pub pasma_neutralne: CivSemanticBands,
    pub zbiory: CivSemanticSets,
    /// Status (`REAL_GAMEPLAY`, ...) -> etykieta PL.
    pub etykiety_statusow: BTreeMap<String, String>,
    pub powody: CivSemanticReasons,
    pub blokada_wejscia: CivSemanticInputBlocks,
    pub zachowanie_trudnosci: CivSemanticDifficultyTexts,
    /// Parametr -> opis udowodnionego konsumenta po stronie weba.
    pub dowody_konsumentow: BTreeMap<String, String>,
    pub etykieta_parametru: CivSemanticParamLabel,
    pub formatowanie: CivSemanticFormatting,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticSources {
    pub macierz: String,
    pub brak: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticUnknown {
    pub wersja_macierzy: String,
    pub domena: String,
    pub jednostka: String,
    pub formula: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticScale {
    pub min: f64,
    pub max: f64,
    pub mnoznik: f64,
    pub zaokraglenie: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticPolarityNames {
    pub korzystna: String,
    pub szkodliwa: String,
    pub neutralna: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticDirectionLabels {
    pub pozytywny: String,
    pub negatywny: String,
    pub neutralny: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticBands {
    /// Kolejnosc ma znaczenie: pierwsza pasujaca regula wygrywa.
    pub reguly: Vec<CivSemanticBandRule>,
    pub domyslne: CivSemanticBandValue,
    pub nieznany_parametr: CivSemanticBandValue,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticBandRule {
    pub klucz: String,
    pub tolerancja: f64,
    /// Regula pasuje, gdy formula LUB jednostka parametru jest na liscie.
    pub gdy_formula: Vec<String>,
    pub gdy_jednostka: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticBandValue {
    pub klucz: String,
    pub tolerancja: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticSets {
    pub real_gameplay: Vec<String>,
    pub ui_only: Vec<String>,
    pub decision_required: Vec<String>,
    pub szkodliwe: Vec<String>,
    pub walka_zablokowana: Vec<String>,
    pub walka_martwa: Vec<String>,
    pub domeny_neutralne: Vec<String>,
    pub prefiksy_neutralne: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticReasons {
    #[serde(rename = "REAL_GAMEPLAY")]
    pub real_gameplay: CivSemanticRealReasons,
    #[serde(rename = "UI_ONLY")]
    pub ui_only: String,
    #[serde(rename = "DEAD_UNWIRED")]
    pub dead_unwired: String,
    #[serde(rename = "PROPOSAL")]
    pub proposal: String,
    #[serde(rename = "REFERENCE_NEEDS_REVIEW")]
    pub reference_needs_review: String,
    #[serde(rename = "UNWIRED")]
    pub unwired: CivSemanticReasonWithExceptions,
    #[serde(rename = "BLOCKED")]
    pub blocked: CivSemanticBlockedReasons,
    #[serde(rename = "DECISION_REQUIRED")]
    pub decision_required: CivSemanticReasonWithExceptions,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticRealReasons {
    pub neutralny: String,
    pub pozostale: String,
}

/// Tekst domyslny (szablon z `{parametr}`) + wyjatki per identyfikator parametru.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticReasonWithExceptions {
    pub domyslny: String,
    pub wyjatki: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticBlockedReasons {
    pub domyslny: String,
    pub grupa_walka_zablokowana: String,
    /// Web `statusReason` (BLOCKED, Egipt + `walka_ruch_bitwa_proc`, decyzja 1B).
    #[serde(default)]
    pub egipt_ruch_bitwa: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticInputBlocks {
    pub nieznany_parametr: String,
    pub brak_wartosci: String,
    pub nieznana_cywilizacja: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticDifficultyTexts {
    pub bez_roznic_statusy: Vec<String>,
    pub bez_roznic_tekst: String,
    pub wyjatki: BTreeMap<String, String>,
    pub grupa_bez_wzmocnien: CivSemanticDifficultyGroup,
    pub prefiks_ai: CivSemanticDifficultyPrefix,
    pub domyslny: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticDifficultyGroup {
    pub parametry: Vec<String>,
    pub tekst: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticDifficultyPrefix {
    pub prefiks: String,
    pub tekst: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticParamLabel {
    pub separator_czesci: String,
    pub sufiks_proc: CivSemanticSuffixRule,
    pub slownik: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticSuffixRule {
    pub koncowka: String,
    pub zamiennik: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CivSemanticFormatting {
    pub brak: String,
    pub flag_tak: String,
    pub flag_nie: String,
    pub jednostki_ulamek: Vec<String>,
    pub jednostka_flaga: String,
    pub mnoznik_procent: f64,
    pub cyfry_procent: usize,
    pub cyfry_wartosc: usize,
}

pub fn parse_civ_matrix_params() -> Result<CivMatrixParamsFile, serde_json::Error> {
    serde_json::from_str(CIV_MATRIX_PARAMS_JSON)
}

pub fn parse_civ_matrix_semantic() -> Result<CivMatrixSemanticFile, serde_json::Error> {
    serde_json::from_str(CIV_MATRIX_SEMANTIC_JSON)
}

/// Tabela parametrow macierzy (zaladowana raz; blad parsowania to blad danych pokryty testem ksztaltu).
pub fn civ_matrix_params() -> &'static CivMatrixParamsFile {
    static TABLE: std::sync::OnceLock<CivMatrixParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_civ_matrix_params().expect("civ-matrix-params.json must parse"))
}

/// Tabela semantyki macierzy (zaladowana raz).
pub fn civ_matrix_semantic() -> &'static CivMatrixSemanticFile {
    static TABLE: std::sync::OnceLock<CivMatrixSemanticFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_civ_matrix_semantic().expect("civ-matrix-semantic.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.4 (R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1): `ruch-jednostek-params.json` - stale i teksty ruchu
// jednostek (embarkacja, trasa, zaplanowany marsz, zwiad, identyfikator stosu). Kod
// `domain/pathfinding.rs::ruch_jednostek` nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const RUCH_JEDNOSTEK_PARAMS_JSON: &str =
    include_str!("../../data/derived/ruch-jednostek-params.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EmbarkacjaParams {
    pub zrodlo_web: String,
    pub technologia: String,
    pub mnoznik_obrony: f64,
    pub koszt_wody: f64,
    pub min_mnoznik_ruchu: f64,
    pub kategoria_okretu: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerenRuchParams {
    pub zrodlo_web: String,
    pub koszt_rzeki: f64,
    pub prog_nieprzejezdny: f64,
    pub ulepszenie_droga: String,
    pub ulepszenie_droga_brukowana: String,
    pub sasiedzi: Vec<[i32; 2]>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TrasaParams {
    pub zrodlo_web: String,
    pub mnoznik_promienia: i64,
    pub bufor_promienia: i64,
    pub koszt_celu_nieprzejezdnego: f64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MarszTeksty {
    pub brak_ruchu: String,
    pub brak_trasy: String,
    pub zablokowany_heks: String,
    pub obce_miasto: String,
    pub mgla: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MarszParams {
    pub zrodlo_web: String,
    pub min_budzet_kroku: f64,
    pub min_tury_ruchu: f64,
    pub teksty: MarszTeksty,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ZwiadParams {
    pub zrodlo_web: String,
    pub typ_jednostki: String,
    pub kategoria: String,
    pub punkty_nieodkryty_w_zasiegu: i64,
    pub punkty_sasiad_ukryty: i64,
    pub szum_losowania: f64,
    pub tolerancja_remisu: f64,
    pub limit_krokow: u32,
    pub min_ruch_do_kroku: f64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StosParams {
    pub zrodlo_web: String,
    pub separator: String,
    pub przyrostek_garnizon: String,
}

/// Plik `ruch-jednostek-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RuchJednostekParamsFile {
    pub meta: serde_json::Value,
    pub embarkacja: EmbarkacjaParams,
    pub teren: TerenRuchParams,
    pub trasa: TrasaParams,
    pub marsz: MarszParams,
    pub zwiad: ZwiadParams,
    pub stos: StosParams,
}

pub fn parse_ruch_jednostek_params() -> Result<RuchJednostekParamsFile, serde_json::Error> {
    serde_json::from_str(RUCH_JEDNOSTEK_PARAMS_JSON)
}

/// Tabela ruchu jednostek (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn ruch_jednostek_params() -> &'static RuchJednostekParamsFile {
    static TABLE: std::sync::OnceLock<RuchJednostekParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_ruch_jednostek_params().expect("ruch-jednostek-params.json must parse")
    })
}

// ---------------------------------------------------------------------------
// P6.M09 (R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1): stale wycinka rywali klastra.
// Czytane przez `domain/mapgen/cluster_rivals.rs`. Wartosci balansowe sa EDYTOWALNE
// w `data/derived/mapgen-cluster-rivals.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const MAPGEN_CLUSTER_RIVALS_JSON: &str =
    include_str!("../../data/derived/mapgen-cluster-rivals.json");

/// Parametry pakowania puli ladu wokol rdzenia (`clusterPackRadius`, `landPoolNearCore`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterPackingParams {
    pub min_pierscieni: StartValue<i64>,
    pub wspolczynnik_pierscieni: StartValue<f64>,
    pub min_promien_w_odstepach: StartValue<i64>,
    pub rozszerzenie_max_krokow_w_odstepach: StartValue<i64>,
    pub pula_max_mnoznik: StartValue<i64>,
    pub rozszerzony_promien_mnoznik: StartValue<i64>,
}

/// Parametry polplaszczyzny rywali tego samego typu.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterHalfPlaneParams {
    pub margines: StartValue<f64>,
    pub prog_dlugosci_kw: StartValue<f64>,
}

/// Plik `mapgen-cluster-rivals.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenClusterRivalsFile {
    pub meta: serde_json::Value,
    pub promien_miasta_panstwa_min_hex: StartValue<i64>,
    pub promien_miasta_panstwa_max_hex: StartValue<i64>,
    pub min_dystans_obce_od_gracza: StartValue<i64>,
    pub rezerwa_wzrostu_klastra: StartValue<i64>,
    pub pakowanie: ClusterPackingParams,
    pub polplaszczyzna: ClusterHalfPlaneParams,
}

pub fn parse_mapgen_cluster_rivals() -> Result<MapgenClusterRivalsFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_CLUSTER_RIVALS_JSON)
}

/// Tabela stalych wycinka rywali klastra (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_cluster_rivals() -> &'static MapgenClusterRivalsFile {
    static TABLE: std::sync::OnceLock<MapgenClusterRivalsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_cluster_rivals().expect("mapgen-cluster-rivals.json must parse")
    })
}

// ---------------------------------------------------------------------------
// P6.M02 (R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1): stale parametrow nowej gry
// trzymane w KODZIE weba (generator.ts / newGameMapDefaults.ts / deposit-era.ts /
// riverGenSwitch.ts). Czytane przez `domain/mapgen/params.rs`. Wartosci sa EDYTOWALNE
// w `data/derived/mapgen-nowa-gra.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const MAPGEN_NOWA_GRA_JSON: &str = include_str!("../../data/derived/mapgen-nowa-gra.json");

/// Metadane tabeli (pochodzenie).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenMeta {
    pub status: String,
    pub pin_web: String,
    pub temat: String,
    pub uwaga: String,
}

/// Trzy poziomy suwaka (low / medium / high) w tabelach mapgen.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TierTriple<T> {
    pub low: T,
    pub medium: T,
    pub high: T,
}

/// Regula rozpoznawania rozmiaru z etykiety menu (kolejnosc ma znaczenie).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RozmiarRegula {
    pub prefiksy: Vec<String>,
    pub rowne: Vec<String>,
    pub rozmiar: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenRozmiary {
    pub zrodlo_web: String,
    pub kolejnosc: Vec<String>,
    pub domyslny: String,
    pub etykiety_menu: Vec<String>,
    pub rozpoznawanie: Vec<RozmiarRegula>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProgPola {
    pub ponizej: f64,
    pub etykieta: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenEtykietaMapy {
    pub zrodlo_web: String,
    pub progi_pola: Vec<ProgPola>,
    pub w_przeciwnym_razie: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UdzialLaduTyp {
    pub pangea: f64,
    pub kontynenty: f64,
    pub wyspy: f64,
    pub ziemia: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenTypSwiata {
    pub zrodlo_web: String,
    pub etykiety_menu: Vec<String>,
    pub z_etykiety: BTreeMap<String, String>,
    pub domyslny: String,
    pub udzial_ladu: UdzialLaduTyp,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PresetGestosci {
    pub resources: String,
    pub rivers: String,
    pub desert: String,
    pub forest: String,
    pub relief: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenJakosc {
    pub zrodlo_web: String,
    pub etykiety_menu: Vec<String>,
    pub z_etykiety_niskie: Vec<String>,
    pub z_etykiety_wysokie: Vec<String>,
    pub domyslna_z_etykiety: String,
    pub domyslna_jakosc_mapy_szczegoly: String,
    pub duze_mapy: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenGestosc {
    pub zrodlo_web: String,
    pub etykiety_menu: Vec<String>,
    pub z_etykiety_niskie: Vec<String>,
    pub z_etykiety_wysokie: Vec<String>,
    pub domyslna_z_etykiety: String,
    pub domyslna_etykieta_reliefu: String,
    pub domyslny_preset: PresetGestosci,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PowierzchniaReferencyjna {
    pub szerokosc: f64,
    pub wysokosc: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DoplywKomorka {
    pub mnoznik_glownej: f64,
    pub minimum: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MinLenRegula {
    pub mnoznik_obszaru_dol: f64,
    pub dolny_clamp: i64,
    pub ulamek_min_wymiaru: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MaxLenRegula {
    pub mnoznik_min_len_a: i64,
    pub ulamek_min_wymiaru_a: f64,
    pub mnoznik_min_len_b: i64,
    pub ulamek_min_wymiaru_sufit: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SiatkaTraceRegula {
    pub dolny_clamp: i64,
    pub ulamek_min_wymiaru: f64,
    pub gorny_podloga: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DoplywMinLenRegula {
    pub dolny_clamp: i64,
    pub odjecie_od_siatki: i64,
    pub ulamek_min_wymiaru: f64,
    pub gorny_podloga: i64,
}

/// `clamp(round(baza * areaScale), min, max)`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SkalowanyClamp {
    pub baza: f64,
    pub min: i64,
    pub max: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MinWGlabLadu {
    pub prog_min_wymiaru: i64,
    pub gdy_duza: i64,
    pub gdy_mala: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SzukanieReliefu {
    pub min: i64,
    pub max: SkalowanyClamp,
    pub bonus_zrodla: i64,
}

/// `clamp(baza + floor(areaScale * mnoznik_skali), min, max)`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PrzebiegiRegula {
    pub baza: i64,
    pub mnoznik_skali: f64,
    pub min: i64,
    pub max: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PrzebiegiWgMapy {
    pub duza: PrzebiegiRegula,
    pub mala: PrzebiegiRegula,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MinWGlabKomorki {
    pub dolny_clamp: i64,
    pub ulamek_min_len: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LimityTrasyLegacy {
    pub prog_pola: f64,
    pub min_len_duza: i64,
    pub min_len_mala: i64,
    pub max_len_dolny: i64,
    pub max_len_ulamek_min_wymiaru: f64,
    pub margines_dolny: i64,
    pub margines_ulamek_min_wymiaru: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MaksRzekLegacy {
    pub dzielnik_pola: f64,
    pub boost_min: f64,
    pub wynik_min: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenRzeki {
    pub zrodlo_web: String,
    pub min_dlugosc_tier: TierTriple<i64>,
    pub komorka_siatki_tier: TierTriple<i64>,
    pub limit_akceptacji_tier: TierTriple<i64>,
    pub powierzchnia_referencyjna: PowierzchniaReferencyjna,
    pub dopyw_komorka: DoplywKomorka,
    pub glowne_stride: i64,
    pub min_len: MinLenRegula,
    pub max_len: MaxLenRegula,
    pub siatka_trace: SiatkaTraceRegula,
    pub doplyw_min_len: DoplywMinLenRegula,
    pub twarde_meandry: SkalowanyClamp,
    pub ogon_ujscia: SkalowanyClamp,
    pub min_w_glab_ladu: MinWGlabLadu,
    pub szukanie_reliefu: SzukanieReliefu,
    pub duza_mapa_prog_skali: f64,
    pub przebiegi_doplywow: PrzebiegiWgMapy,
    pub przebiegi_dopelnienia: PrzebiegiWgMapy,
    pub separacja_zrodel_doplywu: f64,
    pub promien_rozszerzenia_zrodla: SkalowanyClamp,
    pub min_w_glab_komorki: MinWGlabKomorki,
    pub limity_trasy_legacy: LimityTrasyLegacy,
    pub maks_rzek_legacy: MaksRzekLegacy,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenProgiSzumu {
    pub zrodlo_web: String,
    pub las_odjecie: f64,
    pub las_dolny_prog: f64,
    pub bazowa_rzadkosc_bez_presetu: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenUdzialLadu {
    pub zrodlo_web: String,
    pub opcje_procent: Vec<i64>,
    pub przelicznik_procent: f64,
    pub min: f64,
    pub max: f64,
}

/// Trojka min / domyslna / max (web `MapScaleTriple`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TripleRow {
    pub min: i64,
    pub default: i64,
    pub max: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Podpowiedzi {
    pub domyslna: String,
    pub mniej: String,
    pub wiecej: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenMiastaPanstwa {
    pub zrodlo_web: String,
    pub sufit: i64,
    pub dolna_granica: i64,
    pub dolna_granica_gdy_zero_dozwolone: i64,
    pub menu_wg_rozmiaru: Vec<TripleRow>,
    pub podpowiedzi: Podpowiedzi,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AliasyEpok {
    pub braz: Vec<String>,
    pub zelazo: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WgEpoki<T> {
    pub kamien: T,
    pub braz: T,
    pub zelazo: T,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TripleZDomyslnej {
    pub krok_max: i64,
    pub krok_min: i64,
    pub krok_rozdzielenia: i64,
    pub indeks_awaryjny_menu: i64,
    pub minimum: i64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenTypyCywilizacji {
    pub zrodlo_web: String,
    pub sufit_menu: i64,
    pub epoka_domyslna: String,
    pub epoka_domyslna_aktywnych_typow: String,
    pub aliasy_epok: AliasyEpok,
    pub pula_wg_epoki: WgEpoki<i64>,
    pub domyslne_wg_rozmiaru_fallback: WgEpoki<Vec<i64>>,
    pub triple_z_domyslnej: TripleZDomyslnej,
    pub podpowiedzi: Podpowiedzi,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenRywaleMenu {
    pub zrodlo_web: String,
    pub minimum: i64,
    pub gorna_nadwyzka: i64,
    pub dolna_roznica: i64,
    pub odjecie_od_typow: i64,
    pub podpowiedzi: Podpowiedzi,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenZlozaEpoka {
    pub zrodlo_web: String,
    pub min_epoka_domyslna: i64,
    pub nigdy_widoczne: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct KluczeRzekiPrzelacznik {
    pub magazyn_generowanie: String,
    pub magazyn_faza: String,
    pub url_generowanie: String,
    pub url_faza: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenRzekiPrzelacznik {
    pub zrodlo_web: String,
    pub fazy: Vec<String>,
    pub faza_domyslna: String,
    pub faza_tylko_glowne: String,
    pub faza_pelna: String,
    pub generowanie_domyslne: bool,
    pub klucze: KluczeRzekiPrzelacznik,
    pub tokeny_wlaczone: Vec<String>,
    pub tokeny_wylaczone: Vec<String>,
}

/// Plik `mapgen-nowa-gra.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenNowaGraFile {
    pub meta: MapgenMeta,
    pub rozmiary: MapgenRozmiary,
    pub etykieta_mapy: MapgenEtykietaMapy,
    pub typ_swiata: MapgenTypSwiata,
    pub jakosc: MapgenJakosc,
    pub gestosc: MapgenGestosc,
    pub rzeki: MapgenRzeki,
    pub progi_szumu: MapgenProgiSzumu,
    pub udzial_ladu: MapgenUdzialLadu,
    pub miasta_panstwa: MapgenMiastaPanstwa,
    pub typy_cywilizacji: MapgenTypyCywilizacji,
    pub rywale_menu: MapgenRywaleMenu,
    pub zloza_epoka: MapgenZlozaEpoka,
    pub rzeki_przelacznik: MapgenRzekiPrzelacznik,
}

pub fn parse_mapgen_nowa_gra() -> Result<MapgenNowaGraFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_NOWA_GRA_JSON)
}

/// Tabela parametrow nowej gry (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_nowa_gra() -> &'static MapgenNowaGraFile {
    static TABLE: std::sync::OnceLock<MapgenNowaGraFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_nowa_gra().expect("mapgen-nowa-gra.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M01 (rdzen mapgen): wartosci kalibracyjne klimatu/maski Ziemi i dane maski.
// ---------------------------------------------------------------------------

pub const MAPGEN_CORE_PARAMS_JSON: &str =
    include_str!("../../data/derived/mapgen-core-params.json");
pub const EARTH_LAND_MASK_JSON: &str = include_str!("../../data/derived/earth-land-mask.json");

/// Prog rozmiaru: dla `min(w, h) - 2 * granica >= min_wewn` obowiazuje `kroki`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SubsampleTier {
    pub min_wewn: u32,
    pub kroki: u32,
}

/// Prog rozmiaru dla progu ulamka ladu komorki.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LandFractionTier {
    pub min_wewn: u32,
    pub prog: f64,
}

/// Sekcja `earth` pliku `mapgen-core-params.json` (web `earth-land-mask.ts`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenEarthParams {
    pub granica_grywalna: u32,
    pub polarny_ocean_wiersze_ref: u32,
    pub polarny_ocean_wysokosc_ref: u32,
    pub polarny_ocean_limit_proc: f64,
    pub polarny_ocean_min_wiersze: u32,
    pub prog_szablonu_ladu: f64,
    pub podprobkowanie_progi: Vec<SubsampleTier>,
    pub podprobkowanie_domyslne: u32,
    pub prog_ulamka_ladu_progi: Vec<LandFractionTier>,
    pub prog_ulamka_ladu_domyslny: f64,
}

/// Sekcja `klimat` pliku `mapgen-core-params.json` (web `gen-helpers.ts`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenClimateParams {
    pub polarny_proc: f64,
    pub pustynia_pol_wiersze: f64,
    pub rowniny_pol_proc: f64,
    pub bufor_proceduralny_proc: f64,
    pub bufor_proceduralny_min_wiersze: u32,
    pub las_prog_wrogi: f64,
    pub las_umiarkowany_delta: f64,
}

/// Plik `mapgen-core-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenCoreParamsFile {
    pub zrodlo: String,
    pub earth: MapgenEarthParams,
    pub klimat: MapgenClimateParams,
}

/// Obwiednia ladu w ukladzie znormalizowanym maski.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EarthMaskBbox {
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
}

/// Plik `earth-land-mask.json`: maska ladu Ziemi (RLE, `szerokosc * wysokosc` bitow).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EarthLandMaskFile {
    pub zrodlo: String,
    pub szerokosc: usize,
    pub wysokosc: usize,
    pub bbox: EarthMaskBbox,
    pub rle: String,
}

pub fn parse_mapgen_core_params() -> Result<MapgenCoreParamsFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_CORE_PARAMS_JSON)
}

pub fn parse_earth_land_mask() -> Result<EarthLandMaskFile, serde_json::Error> {
    serde_json::from_str(EARTH_LAND_MASK_JSON)
}

/// Tabela kalibracji rdzenia mapgen (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_core_params() -> &'static MapgenCoreParamsFile {
    static TABLE: std::sync::OnceLock<MapgenCoreParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_core_params().expect("mapgen-core-params.json must parse"))
}

/// Maska ladu Ziemi (jednorazowy odczyt).
pub fn earth_land_mask_file() -> &'static EarthLandMaskFile {
    static TABLE: std::sync::OnceLock<EarthLandMaskFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_earth_land_mask().expect("earth-land-mask.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.5A (R-RUSTPORT-P6-5A-JEDNOSTKI-ZYCIE-A-Q1): tempo kosztu jednostek (`unit-cost-tempo.ts`) i
// stale stosow armii (`armyMerge.ts`). Kod `domain/recruitment.rs::army_merge` nie zawiera ich
// literalow.
// ---------------------------------------------------------------------------

pub const UNIT_COST_TEMPO_JSON: &str = include_str!("../../data/derived/unit-cost-tempo.json");
pub const ARMY_MERGE_PARAMS_JSON: &str = include_str!("../../data/derived/army-merge-params.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TempoKosztuRow {
    pub klucz: String,
    pub mnoznik: f64,
}

/// Plik `unit-cost-tempo.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitCostTempoFile {
    pub meta: serde_json::Value,
    pub zrodlo_web: String,
    pub min_koszt: f64,
    pub tempa: Vec<TempoKosztuRow>,
}

impl UnitCostTempoFile {
    /// Mnoznik dla klucza tempa (`niski` / `normalny` / `wysoki`); `None`, gdy klucza nie ma w tabeli.
    pub fn mnoznik(&self, klucz: &str) -> Option<f64> {
        self.tempa
            .iter()
            .find(|row| row.klucz == klucz)
            .map(|row| row.mnoznik)
    }
}

pub fn parse_unit_cost_tempo() -> Result<UnitCostTempoFile, serde_json::Error> {
    serde_json::from_str(UNIT_COST_TEMPO_JSON)
}

/// Tabela tempa kosztow jednostek (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn unit_cost_tempo() -> &'static UnitCostTempoFile {
    static TABLE: std::sync::OnceLock<UnitCostTempoFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_unit_cost_tempo().expect("unit-cost-tempo.json must parse"))
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct IdStosuParams {
    pub zrodlo_web: String,
    pub prefiks: String,
    pub separator: String,
    pub podstawa: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AkcjaStosuParams {
    pub id: String,
    pub etykieta: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PodzialStosuParams {
    pub zrodlo_web: String,
    pub etykieta_ten_heks: String,
    pub min_stos_rozdzielenia: usize,
    pub akcja_rozdziel: AkcjaStosuParams,
    pub akcja_polacz: AkcjaStosuParams,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StanStosuParams {
    pub zrodlo_web: String,
    pub poziom_odznaki_poczatkowy: u8,
    pub poziom_weterana_poczatkowy: u8,
    pub gwiazdki_poczatkowe: u32,
}

/// Plik `army-merge-params.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ArmyMergeParamsFile {
    pub meta: serde_json::Value,
    pub id_stosu: IdStosuParams,
    pub podzial: PodzialStosuParams,
    pub stan_stosu: StanStosuParams,
}

pub fn parse_army_merge_params() -> Result<ArmyMergeParamsFile, serde_json::Error> {
    serde_json::from_str(ARMY_MERGE_PARAMS_JSON)
}

/// Stale stosow armii (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn army_merge_params() -> &'static ArmyMergeParamsFile {
    static TABLE: std::sync::OnceLock<ArmyMergeParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_army_merge_params().expect("army-merge-params.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M16 (R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1): tabele regul budowy ulepszen na mapie
// (`gra/src/map/improvement-build.ts`). Wartosci sa EDYTOWALNE w
// `data/derived/ulepszenia-budowa.json`; kod `domain/improvement_build.rs` nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const ULEPSZENIA_BUDOWA_JSON: &str = include_str!("../../data/derived/ulepszenia-budowa.json");

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaMeta {
    pub zrodlo_web: String,
    pub opis: String,
}

/// Nazwane zbiory kodow terenu (`TerenBazowy`) uzywane przez bramki budowy.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaTeren {
    pub ladu: Vec<String>,
    pub tartak: Vec<String>,
    pub farma_plaski: Vec<String>,
    pub irygacja: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaLas {
    pub zaleznosc: Vec<String>,
    pub wspolistnieje: Vec<String>,
    pub zablokowane: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaZywnosc {
    pub warstwy: Vec<String>,
    pub solo: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaSektory {
    pub przypisanie: std::collections::BTreeMap<String, String>,
    pub wykluczajace: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaTarasyCywilizacje {
    pub zawiera: Vec<String>,
    pub rowne: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaHodowla {
    pub odblokowanie: std::collections::BTreeMap<String, String>,
    pub klucze_konia: Vec<String>,
    pub kon: String,
    pub lama: String,
    pub cywilizacje_inkaskie: Vec<String>,
    pub cywilizacje_inkaskie_zawiera: Vec<String>,
    pub stadnina_koszt_koni: f64,
    pub nowy_swiat_min_epoka_hodowli: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaTechnologie {
    pub kanoniczne: std::collections::BTreeMap<String, String>,
    pub wiele_tech: std::collections::BTreeMap<String, Vec<String>>,
    pub brak_wymagania: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaDomyslne {
    pub epoka_gracza: f64,
    pub wlasciciel_gracza: i64,
    pub praca_bez_wpisu: f64,
    pub praca_meta_bez_wpisu: f64,
    pub typ_ulepszenia: String,
    pub pierscien_kandydatow: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BudowaTeksty {
    pub etykieta_lasu: String,
    pub separator_listy: String,
    pub podpowiedz_bydlo: String,
    pub podpowiedz_las_prefiks: String,
}

/// Plik `ulepszenia-budowa.json`. `teren_dozwolony`: `null` = brak ograniczenia terenu.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UlepszeniaBudowaFile {
    pub meta: BudowaMeta,
    pub teren: BudowaTeren,
    pub teren_dozwolony: std::collections::BTreeMap<String, Option<Vec<String>>>,
    pub las: BudowaLas,
    pub zywnosc: BudowaZywnosc,
    pub sektory: BudowaSektory,
    pub kopalnie: Vec<String>,
    pub nakladki_zwierzece: Vec<String>,
    pub tarasy_cywilizacje: BudowaTarasyCywilizacje,
    pub hodowla: BudowaHodowla,
    pub technologie: BudowaTechnologie,
    pub domyslne: BudowaDomyslne,
    pub teksty: BudowaTeksty,
}

pub fn parse_ulepszenia_budowa() -> Result<UlepszeniaBudowaFile, serde_json::Error> {
    serde_json::from_str(ULEPSZENIA_BUDOWA_JSON)
}

/// Tabela regul budowy ulepszen (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn ulepszenia_budowa() -> &'static UlepszeniaBudowaFile {
    static TABLE: std::sync::OnceLock<UlepszeniaBudowaFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_ulepszenia_budowa().expect("ulepszenia-budowa.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M10 (R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1): progi i wagi mas ladu, bramek startu
// i rozmieszczenia srodkow klastrow (clusters.ts:59-1345) oraz punktacja startu gracza
// (startScoring.ts). Czytane przez `domain/mapgen/cluster_mass.rs`. Wartosci balansowe sa
// EDYTOWALNE w `data/derived/mapgen-cluster-mass.json` i `data/derived/start-scoring.json`.
// ---------------------------------------------------------------------------

pub const MAPGEN_CLUSTER_MASS_JSON: &str =
    include_str!("../../data/derived/mapgen-cluster-mass.json");
pub const START_SCORING_JSON: &str = include_str!("../../data/derived/start-scoring.json");

/// Wiersz progu pola mapy (`mapSizeLabel`, clusters.ts:152).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterMapSizeStep {
    pub ponizej: f64,
    pub etykieta: String,
    pub zrodlo_web: String,
}

/// Etykieta wyniku po przekroczeniu wszystkich progow.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterMapSizeFallback {
    pub etykieta: String,
    pub zrodlo_web: String,
}

/// Liczba aktywnych typow wg etykiety rozmiaru (`aktywneTypyFromSize`, clusters.ts:161).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterActiveTypes {
    pub mala: StartValue<i64>,
    pub srednia: StartValue<i64>,
    pub duza: StartValue<i64>,
    pub ogromna: StartValue<i64>,
    #[serde(rename = "super")]
    pub super_: StartValue<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterMapSizeParams {
    pub progi_pola: Vec<ClusterMapSizeStep>,
    pub w_przeciwnym_razie: ClusterMapSizeFallback,
    pub aktywne_typy: ClusterActiveTypes,
}

/// Progi mas ladu (clusters.ts:212-235).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterMassThresholds {
    pub min_masa_srodka_hex: StartValue<i64>,
    pub min_masa_spawn_hex: StartValue<i64>,
    pub min_przestrzen_rozwoju_na_cywilizacje: StartValue<i64>,
    pub prog_malej_masy_mnoznik: StartValue<i64>,
    pub promien_przestrzeni_rozwoju: StartValue<i64>,
    pub frakcja_wyspy_najwiekszej_masy: StartValue<f64>,
    pub obca_masa_min_bezwzgledny: StartValue<i64>,
    pub obca_masa_frakcja_najwiekszej: StartValue<f64>,
}

/// Bramki startu gracza (clusters.ts:240-248, :577).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterPlayerStartParams {
    pub lokalny_lad_frakcja: StartValue<f64>,
    pub lokalny_lad_promien: StartValue<i64>,
    pub min_masa_hex: StartValue<i64>,
    pub min_masa_bezwzgledna_hex: StartValue<i64>,
    pub min_masa_frakcja_najwiekszej: StartValue<f64>,
}

/// Wagi i tolerancje wyboru hexu srodka (clusters.ts:584-1004).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterPickParams {
    pub tolerancja_przestrzeni_rozwoju: StartValue<f64>,
    pub tolerancja_udzialu_lasu: StartValue<f64>,
    pub tolerancja_odleglosci_od_morza: StartValue<f64>,
    pub waga_bliskosci_preferowanego: StartValue<f64>,
    pub waga_losowego_rozstrzygniecia: StartValue<f64>,
    pub sentinel_brak_srodkow: StartValue<f64>,
    pub limit_morza_w_wyniku_powyzej_min: StartValue<f64>,
    pub tolerancja_min_exist_pasma: StartValue<f64>,
    pub tolerancja_obciazenia_cwiartki_pasma: StartValue<i64>,
    pub min_liczba_typow_filtra_cwiartek: StartValue<i64>,
}

/// Parametry rozmieszczenia srodkow (clusters.ts:1009-1344).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterPlacementParams {
    pub balans_prog_dziury_mnoznik: StartValue<f64>,
    pub balans_zblizenie_do_dziury: StartValue<f64>,
    pub balans_duza_dziura_mnoznik: StartValue<f64>,
    pub wymus_cwiartki_max_iteracji: StartValue<i64>,
    pub wymus_cwiartki_min_centrow: StartValue<i64>,
    pub wymus_cwiartki_min_obciazenie: StartValue<i64>,
    pub wyrownanie_min_iteracji: StartValue<i64>,
    pub wyrownanie_max_iteracji: StartValue<i64>,
    pub wyrownanie_dzielnik_typow: StartValue<i64>,
    pub min_centrow_wyrownania: StartValue<i64>,
    pub straznik_faza2_mnoznik: StartValue<i64>,
    pub straznik_faza5_mnoznik: StartValue<i64>,
    pub straznik_faza5b_mnoznik: StartValue<i64>,
    pub min_twardy_dystans: StartValue<f64>,
}

/// Plik `mapgen-cluster-mass.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenClusterMassFile {
    pub meta: serde_json::Value,
    pub roster_klucze: StartValue<Vec<String>>,
    pub rozmiar_mapy: ClusterMapSizeParams,
    pub masy: ClusterMassThresholds,
    pub start_gracza: ClusterPlayerStartParams,
    pub wybor_hexu: ClusterPickParams,
    pub rozmieszczenie: ClusterPlacementParams,
}

pub fn parse_mapgen_cluster_mass() -> Result<MapgenClusterMassFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_CLUSTER_MASS_JSON)
}

/// Tabela progow mas / bramek / rozmieszczenia klastrow (jednorazowy odczyt; blad = panika).
pub fn mapgen_cluster_mass() -> &'static MapgenClusterMassFile {
    static TABLE: std::sync::OnceLock<MapgenClusterMassFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_cluster_mass().expect("mapgen-cluster-mass.json must parse"))
}

/// Promien oswietlenia startu wg trudnosci (`startRevealRadiusForDifficulty`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartRevealRadii {
    pub domyslny_legacy: StartValue<i64>,
    pub easy: StartValue<i64>,
    pub normal: StartValue<i64>,
    pub hard: StartValue<i64>,
}

/// Punktacja `scoreCityStartHex` (startScoring.ts:51-95) i waga przestrzeni rozwoju (:131).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartScoringPoints {
    pub laka_rownina: StartValue<f64>,
    pub wzgorza: StartValue<f64>,
    pub pustynia: StartValue<f64>,
    pub inny_teren: StartValue<f64>,
    pub rzeka_na_hexie: StartValue<f64>,
    pub rzeka_u_sasiada: StartValue<f64>,
    pub promien_okolicy: StartValue<i64>,
    pub promien_pol_blisko: StartValue<i64>,
    pub pola_uprawne_blisko: StartValue<f64>,
    pub pola_uprawne_dalej: StartValue<f64>,
    pub min_dystans_wzniesien: StartValue<i64>,
    pub gory_w_okolicy: StartValue<f64>,
    pub wzgorza_w_okolicy: StartValue<f64>,
    pub waga_przestrzeni_rozwoju: StartValue<f64>,
}

/// Plik `start-scoring.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct StartScoringFile {
    pub meta: serde_json::Value,
    pub promien_oswietlenia: StartRevealRadii,
    pub punktacja: StartScoringPoints,
}

pub fn parse_start_scoring() -> Result<StartScoringFile, serde_json::Error> {
    serde_json::from_str(START_SCORING_JSON)
}

/// Tabela punktacji startu gracza (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn start_scoring() -> &'static StartScoringFile {
    static TABLE: std::sync::OnceLock<StartScoringFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_start_scoring().expect("start-scoring.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.5B (R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1): stale z `manpower.ts`, `units/setup.ts`
// (zbior jednostek cywilnych) i `unit-building-bonuses.ts`, trzymane w KODZIE weba. Czytane przez
// `domain::recruitment::manpower` i `domain::combat::unit_building_bonuses`. Wartosci sa EDYTOWALNE
// w `data/derived/{manpower-params,unit-building-bonuses,locale-compare-ascii}.json`; kod Rust nie
// zawiera ich literalow. Tabela epok i parametry miasta zostaly w `data/economy_society.rs`.
// ---------------------------------------------------------------------------

pub const MANPOWER_PARAMS_JSON: &str = include_str!("../../data/derived/manpower-params.json");
pub const UNIT_BUILDING_BONUSES_JSON: &str =
    include_str!("../../data/derived/unit-building-bonuses.json");
pub const LOCALE_COMPARE_ASCII_JSON: &str =
    include_str!("../../data/derived/locale-compare-ascii.json");

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerEpokaBounds {
    pub min: u32,
    pub max: u32,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerDefaultRegen {
    pub proc_max_na_ture: f64,
    pub blokada_przy_oblezeniu: bool,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerDefaultReplenish {
    pub easy: f64,
    pub normal: f64,
    pub hard: f64,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerCivMults {
    pub regen_min: f64,
    pub max_min: f64,
    pub skalowanie_min: f64,
    pub typ_regen_bonus: String,
    pub typ_regen_mnoznik: String,
    pub typ_pula_bonus: String,
    pub typ_pula_mnoznik: String,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerSortKeys {
    pub oblezone: u8,
    pub garnizon: u8,
    pub pole: u8,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerBlockReasons {
    pub brak_manpower: String,
    pub brak_ludnosci: String,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerCivilian {
    pub kategorie: Vec<String>,
    pub typy: Vec<String>,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerFormatting {
    pub obywatel_jeden: String,
    pub obywatel_wiele: String,
    pub prog_mln: f64,
    pub prog_tys: f64,
    pub sufiks_mln: String,
    pub sufiks_tys: String,
    pub prog_calkowite_mln: f64,
    pub prog_calkowite_tys: f64,
    pub krok_dziesiatych: f64,
    pub zrodlo_web: String,
}

/// Plik `manpower-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ManpowerParamsFile {
    pub meta: serde_json::Value,
    pub epoka: ManpowerEpokaBounds,
    pub min_ludkow: f64,
    pub scout_type_id: String,
    pub maks_proc: f64,
    pub domyslny_zwrot_koszt_ludnosci: f64,
    pub domyslne_regen: ManpowerDefaultRegen,
    pub domyslne_uzupelnienie_hp_proc: ManpowerDefaultReplenish,
    pub mnozniki_cywilizacji: ManpowerCivMults,
    pub klucz_sortowania_leczenia: ManpowerSortKeys,
    pub powody_blokady: ManpowerBlockReasons,
    pub cywilne: ManpowerCivilian,
    pub formatowanie: ManpowerFormatting,
}

pub fn parse_manpower_params() -> Result<ManpowerParamsFile, serde_json::Error> {
    serde_json::from_str(MANPOWER_PARAMS_JSON)
}

/// Stale `manpower.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn manpower_params() -> &'static ManpowerParamsFile {
    static TABLE: std::sync::OnceLock<ManpowerParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_manpower_params().expect("manpower-params.json must parse"))
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingPathParams {
    pub budynki: Vec<String>,
    pub max_pp: f64,
    pub zrodlo_web: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingBonusLabels {
    pub pancerz: String,
    pub parametry: String,
    pub separator: String,
    pub wzmianka_pancerz: String,
    pub wzmianka_parametry: String,
    pub wzmianka: String,
    pub zrodlo_web: String,
}

/// Plik `unit-building-bonuses.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct UnitBuildingBonusesFile {
    pub meta: serde_json::Value,
    pub sciezka_pancerz: BuildingPathParams,
    pub sciezka_parametry: BuildingPathParams,
    pub max_glebokosc_lancucha: usize,
    pub liczba_tercji: f64,
    pub podstawa_procentu: f64,
    pub etykiety: BuildingBonusLabels,
}

pub fn parse_unit_building_bonuses() -> Result<UnitBuildingBonusesFile, serde_json::Error> {
    serde_json::from_str(UNIT_BUILDING_BONUSES_JSON)
}

/// Stale `unit-building-bonuses.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn unit_building_bonuses_params() -> &'static UnitBuildingBonusesFile {
    static TABLE: std::sync::OnceLock<UnitBuildingBonusesFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_unit_building_bonuses().expect("unit-building-bonuses.json must parse")
    })
}

/// Plik `locale-compare-ascii.json` (kolejnosc `localeCompare` dla ASCII).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LocaleCompareAsciiFile {
    pub meta: serde_json::Value,
    pub kolejnosc_podstawowa: String,
    pub male_przed_wielkimi: bool,
}

pub fn parse_locale_compare_ascii() -> Result<LocaleCompareAsciiFile, serde_json::Error> {
    serde_json::from_str(LOCALE_COMPARE_ASCII_JSON)
}

/// Kolejnosc ICU dla ASCII (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn locale_compare_ascii() -> &'static LocaleCompareAsciiFile {
    static TABLE: std::sync::OnceLock<LocaleCompareAsciiFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_locale_compare_ascii().expect("locale-compare-ascii.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.6A (R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1): city-founding / city-hex-clear /
// conquest-stability / visibility - edytowalne tabele balansu (pin web edb8fb56)
// ---------------------------------------------------------------------------------------------

pub const CITY_FOUNDING_PARAMS_JSON: &str =
    include_str!("../../data/derived/city-founding-params.json");
pub const CITY_HEX_CLEAR_RULES_JSON: &str =
    include_str!("../../data/derived/city-hex-clear-rules.json");
pub const CONQUEST_STABILITY_PARAMS_JSON: &str =
    include_str!("../../data/derived/conquest-stability-params.json");
pub const VISIBILITY_PARAMS_JSON: &str = include_str!("../../data/derived/visibility-params.json");

/// Teksty komunikatow zakladania miasta (szablony z `{koszt}` / `{praca}` / `{ludnosc}`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CityFoundingTexts {
    pub za_malo_pracy: String,
    pub potrzebne_miasto: String,
    pub za_malo_ludnosci: String,
    pub etykieta_darmowe: String,
    pub etykieta_platne: String,
}

/// Plik `city-founding-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CityFoundingParamsFile {
    pub meta: serde_json::Value,
    pub fallback_koszt_praca: f64,
    pub fallback_koszt_ludnosci: f64,
    pub ai_source_min_pop: f64,
    pub teksty: CityFoundingTexts,
}

pub fn parse_city_founding_params() -> Result<CityFoundingParamsFile, serde_json::Error> {
    serde_json::from_str(CITY_FOUNDING_PARAMS_JSON)
}

/// Stale `city-founding.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn city_founding_params() -> &'static CityFoundingParamsFile {
    static TABLE: std::sync::OnceLock<CityFoundingParamsFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_city_founding_params().expect("city-founding-params.json must parse"))
}

/// Plik `city-hex-clear-rules.json` (macierz B: co zostaje na heksie centrum miasta).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CityHexClearRulesFile {
    pub meta: serde_json::Value,
    pub zostaje_ulepszenia: Vec<String>,
    pub zostaja_zloza_nakladki: Vec<String>,
    pub ulepszenie_brak: String,
}

pub fn parse_city_hex_clear_rules() -> Result<CityHexClearRulesFile, serde_json::Error> {
    serde_json::from_str(CITY_HEX_CLEAR_RULES_JSON)
}

/// Reguly `city-hex-clear.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn city_hex_clear_rules() -> &'static CityHexClearRulesFile {
    static TABLE: std::sync::OnceLock<CityHexClearRulesFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_city_hex_clear_rules().expect("city-hex-clear-rules.json must parse"))
}

/// Plik `conquest-stability-params.json`. Mapy flaga -> lista id budynkow.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ConquestStabilityParamsFile {
    pub meta: serde_json::Value,
    pub prog_obca_kultura: f64,
    pub mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu: f64,
    pub budynki_kulturalne: BTreeMap<String, Vec<String>>,
    pub budynki_religijne: BTreeMap<String, Vec<String>>,
}

pub fn parse_conquest_stability_params() -> Result<ConquestStabilityParamsFile, serde_json::Error> {
    serde_json::from_str(CONQUEST_STABILITY_PARAMS_JSON)
}

/// Stale `conquest-stability.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn conquest_stability_params() -> &'static ConquestStabilityParamsFile {
    static TABLE: std::sync::OnceLock<ConquestStabilityParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_conquest_stability_params().expect("conquest-stability-params.json must parse")
    })
}

/// Plik `visibility-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct VisibilityParamsFile {
    pub meta: serde_json::Value,
    pub fallback_sight: f64,
    pub fog_explored_brightness: f64,
    pub start_reveal_radius: f64,
    pub city_type_id: String,
}

pub fn parse_visibility_params() -> Result<VisibilityParamsFile, serde_json::Error> {
    serde_json::from_str(VISIBILITY_PARAMS_JSON)
}

/// Stale `visibility.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn visibility_params() -> &'static VisibilityParamsFile {
    static TABLE: std::sync::OnceLock<VisibilityParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_visibility_params().expect("visibility-params.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M03 (maski centrum): wartosci kalibracyjne masek ladu (`gen-helpers.ts`:252-824 i zaleznosci).
// Kod `domain/mapgen/masks.rs` nie zawiera tych literalow; struktura wzorow zostaje w kodzie.
// ---------------------------------------------------------------------------

pub const MAPGEN_MASKS_JSON: &str = include_str!("../../data/derived/mapgen-masks.json");

/// Warstwa szumu `fbm(perm, q * skala * mnoznik + przesuniecie, ..., oktawy) * amplituda`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksNoiseWarp {
    pub mnoznik_skali: f64,
    pub przesuniecie: f64,
    pub oktawy: u32,
    pub amplituda: f64,
}

/// Warstwa szumu kata: `fbm(perm, cos(a) * mnoznik_kata + strefa * mnoznik_strefy, ...)`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksAngleNoise {
    pub mnoznik_kata: f64,
    pub mnoznik_strefy: f64,
    pub przesuniecie: f64,
    pub oktawy: u32,
    pub amplituda: f64,
}

/// Warstwa szumu bez amplitudy (mnozona przez parametr ukladu).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksNoiseBase {
    pub mnoznik_skali: f64,
    pub przesuniecie: f64,
    pub oktawy: u32,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksShapeParams {
    pub skala_szumu: f64,
    pub skala_gor: f64,
    pub skala_lasu: f64,
    pub skala_pustyni: f64,
    pub zakres_przesuniec: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksEllipticParams {
    pub dodatek_polowki: f64,
    pub promien: f64,
    pub wykladnik: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksBorderParams {
    pub ocean_heksy: u32,
    pub strefa_marginesu_heksy: u32,
    pub krok_limitu: f64,
    pub dzielnik_zaniku: f64,
    pub min_margines: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksCenterDefaults {
    pub promien_min: f64,
    pub promien_max: f64,
    pub min_odleglosc: f64,
    pub domyslna_szerokosc: f64,
    pub domyslna_wysokosc: f64,
    pub margines_min: f64,
    pub kotwica_udzial_promienia: f64,
    pub pierscien_min: f64,
    pub pierscien_max: f64,
    pub proby: u32,
    pub jitter_kata: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksContinentsParams {
    pub liczba_stref: u32,
    pub obszar_male: f64,
    pub obszar_srednie: f64,
    pub liczba_male: u32,
    pub liczba_srednie: u32,
    pub liczba_duze: u32,
    pub piecio_margines_min: f64,
    pub piecio_jitter: f64,
    pub piecio_odsuniecie: f64,
    pub ciesnina: f64,
    pub wykladnik_radialny: f64,
    pub szum_gruby: MasksNoiseWarp,
    pub szum_drobny: MasksNoiseWarp,
    pub szum_kata: MasksAngleNoise,
    pub odjemnik: f64,
}

/// Wspolczynniki zaciagniecia pierscienia (`ringPull`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksPangeaDragCoeffs {
    pub baza: f64,
    pub rozmiar: f64,
    pub wysoki: f64,
    pub niski: f64,
}

/// Wspolczynniki `baza + t * t_wsp + rozmiar * rozmiar_wsp`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksCoeffsTS {
    pub baza: f64,
    pub t: f64,
    pub rozmiar: f64,
}

/// Wspolczynniki `baza + t * t_wsp`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksCoeffsT {
    pub baza: f64,
    pub t: f64,
}

/// Wspolczynniki `baza + t * t_wsp + rozmiar * rozmiar_wsp + wysoki * wysoki_wsp`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksCoeffsTSH {
    pub baza: f64,
    pub t: f64,
    pub rozmiar: f64,
    pub wysoki: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksRingMinCoeffs {
    pub dolna_granica: f64,
    pub baza: f64,
    pub t: f64,
    pub rozmiar: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksRingMaxCoeffs {
    pub dolna_granica: f64,
    pub baza: f64,
    pub t: f64,
    pub rozmiar: f64,
    pub sciagniecie: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksValleyCoeffs {
    pub dolna_granica: f64,
    pub baza: f64,
    pub t: f64,
    pub niski: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksPangeaCenters {
    pub margines_min: f64,
    pub jitter: f64,
    pub pierscien_promien_mnoznik: f64,
    pub pierscien_rozrzut: f64,
    pub jitter_kata: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksPangeaBlob {
    pub wykladnik_radialny: f64,
    pub szum_gruby: MasksNoiseWarp,
    pub przesuniecie_strefy_gruby: f64,
    pub szum_drobny: MasksNoiseWarp,
    pub przesuniecie_strefy_drobny: f64,
    pub szum_kata: MasksAngleNoise,
    pub odjemnik: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksPangeaMask {
    pub wykladnik_klastra: f64,
    pub dolina: MasksNoiseBase,
    pub warp_globalny: MasksNoiseBase,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksPangeaParams {
    pub t_dolny: f64,
    pub t_zakres: f64,
    pub powierzchnia_odniesienia: f64,
    pub boost_max: f64,
    pub boost_wsp: f64,
    pub wysoki_prog: f64,
    pub wysoki_zakres: f64,
    pub niski_zakres: f64,
    pub sciagniecie: MasksPangeaDragCoeffs,
    pub prog_male: f64,
    pub prog_srednie: f64,
    pub liczba_male: u32,
    pub liczba_srednie: u32,
    pub liczba_duze: u32,
    pub promien_blobu_min: MasksCoeffsTS,
    pub promien_blobu_max: MasksCoeffsTS,
    pub pierscien_min: MasksRingMinCoeffs,
    pub pierscien_max: MasksRingMaxCoeffs,
    pub promien_klastra: MasksCoeffsT,
    pub prog: MasksCoeffsT,
    pub scalanie_suma: MasksCoeffsTSH,
    pub scalanie_max: MasksCoeffsTSH,
    pub warp_globalny_wsp: MasksCoeffsT,
    pub dolina_wsp: MasksValleyCoeffs,
    pub wypelnienie_min: MasksCoeffsT,
    pub centra: MasksPangeaCenters,
    pub blob: MasksPangeaBlob,
    pub maska: MasksPangeaMask,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksIslandSize {
    pub baza: f64,
    pub wsp: f64,
    pub min: f64,
    pub max: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksIslandRadiusRange {
    pub baza: f64,
    pub rozrzut: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksIslandsParams {
    pub siatka: u32,
    pub margines_min: f64,
    pub powierzchnia_odniesienia: f64,
    pub rozmiar: MasksIslandSize,
    pub promien_komorki: f64,
    pub jitter: f64,
    pub promien_zakres: MasksIslandRadiusRange,
    pub pas_morski: f64,
    pub wykladnik_radialny: f64,
    pub szum_gruby: MasksNoiseWarp,
    pub szum_drobny: MasksNoiseWarp,
    pub szum_kata: MasksAngleNoise,
    pub odjemnik: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksCenterRow {
    pub nq: f64,
    pub nr: f64,
    pub radius: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MasksEarthParams {
    pub centra: Vec<MasksCenterRow>,
    pub szum_brzegu: MasksNoiseWarp,
    pub poziom_ladu: f64,
    pub odjemnik: f64,
}

/// Plik `mapgen-masks.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenMasksFile {
    pub zrodlo: String,
    pub ksztalt: MasksShapeParams,
    pub eliptyczna: MasksEllipticParams,
    pub brzeg: MasksBorderParams,
    pub centra: MasksCenterDefaults,
    pub kontynenty: MasksContinentsParams,
    pub pangea: MasksPangeaParams,
    pub wyspy: MasksIslandsParams,
    pub ziemia: MasksEarthParams,
}

pub fn parse_mapgen_masks() -> Result<MapgenMasksFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_MASKS_JSON)
}

/// Tabela kalibracji masek ladu (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_masks() -> &'static MapgenMasksFile {
    static TABLE: std::sync::OnceLock<MapgenMasksFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_masks().expect("mapgen-masks.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M11 (R-RUSTPORT-P6-M11-KLASTRY-UKLAD-STOLIC-Q1): parametry ukladu stolic klastrow.
// Czytane przez `domain/mapgen/cluster_layout.rs`. Wartosci balansowe sa EDYTOWALNE
// w `data/derived/mapgen-cluster-layout.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const MAPGEN_CLUSTER_LAYOUT_JSON: &str =
    include_str!("../../data/derived/mapgen-cluster-layout.json");

/// Pas stolicy od morza (`capitalMinSeaDist`, `capitalSeaBandPenalty`, clusters.ts:1370-1464).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterSeaBandParams {
    pub min_odleglosc_od_morza: ClusterActiveTypes,
    pub szerokosc_pasa: StartValue<i64>,
    pub min_krotszy_bok_mapy: StartValue<i64>,
    pub kara_ponizej_pasa: StartValue<f64>,
    pub kara_powyzej_pasa: StartValue<f64>,
}

/// Separacja stolic roznych civ (`capitalMinSeparation`, clusters.ts:1470-1530).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterSeparationParams {
    pub min_odstep: ClusterActiveTypes,
    pub dodatek_odstepu_srodkow: StartValue<i64>,
}

/// Drabinka miekniecia odleglosci od morza (`seaDistRescueLadder`, clusters.ts:1678-1689).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterSeaRescueParams {
    pub mnoznik_ceil_pierwszy: StartValue<f64>,
    pub mnoznik_ceil_drugi: StartValue<f64>,
    pub mnoznik_floor: StartValue<f64>,
    pub dolna_granica_stopnia: StartValue<f64>,
}

/// Jeden prog `minimumSpreadQuartersRequired` (clusters.ts:1580-1582).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterQuarterStep {
    pub od_liczby_typow: i64,
    pub min_cwiartek: usize,
    pub zrodlo_web: String,
}

/// Progi cwiartek bboxa ladu (clusters.ts:1579-1600, 3259-3329).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterLayoutQuarters {
    pub progi_minimum: Vec<ClusterQuarterStep>,
    pub w_przeciwnym_razie_min_cwiartek: StartValue<usize>,
    pub min_typow_preferencji: StartValue<i64>,
    pub min_typow_biasu_wyboru_hexu: StartValue<i64>,
    pub wyrownanie_min_typow: StartValue<i64>,
    pub wyrownanie_min_klastrow: StartValue<usize>,
    pub wyrownanie_max_iteracji: StartValue<usize>,
    pub wyrownanie_min_obciazenie: StartValue<usize>,
}

/// Wybor stolicy w regionie (clusters.ts:2261, 2616).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterCapitalPickParams {
    pub waga_losowego_rozstrzygniecia: StartValue<f64>,
    pub proby_ladu: StartValue<usize>,
}

/// Luzny przebieg `poissonPickCities` (clusters.ts:1835-1836).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterPoissonParams {
    pub min_wybranych_przed_luzem: StartValue<usize>,
    pub luz_odstepu: StartValue<i64>,
}

/// Straznicy petli napraw (clusters.ts:2693, 3055).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterGuardParams {
    pub twarda_separacja_mnoznik: StartValue<usize>,
    pub separacja_bryl_mnoznik: StartValue<usize>,
}

/// Ponowienia `repackClusterStateCitiesIfSparse` (clusters.ts:2892-2932).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterRepackParams {
    pub luzny_bufor_dzielnik: StartValue<f64>,
    pub luzny_min_dystans_dolny: StartValue<i64>,
    pub luzny_min_dystans_odjecie: StartValue<i64>,
    pub pierscienie_po_maksymalnym: StartValue<Vec<i64>>,
    pub pierscienie_ostateczne: StartValue<Vec<i64>>,
    pub ostateczny_min_dystans: StartValue<i64>,
}

/// Plik `mapgen-cluster-layout.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenClusterLayoutFile {
    pub meta: serde_json::Value,
    pub morze_stolicy: ClusterSeaBandParams,
    pub separacja_stolic: ClusterSeparationParams,
    pub ratunek_morza: ClusterSeaRescueParams,
    pub cwiartki: ClusterLayoutQuarters,
    pub wybor_stolicy: ClusterCapitalPickParams,
    pub poisson: ClusterPoissonParams,
    pub straznicy: ClusterGuardParams,
    pub repack: ClusterRepackParams,
}

pub fn parse_mapgen_cluster_layout() -> Result<MapgenClusterLayoutFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_CLUSTER_LAYOUT_JSON)
}

/// Tabela ukladu stolic klastrow (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_cluster_layout() -> &'static MapgenClusterLayoutFile {
    static TABLE: std::sync::OnceLock<MapgenClusterLayoutFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_cluster_layout().expect("mapgen-cluster-layout.json must parse")
    })
}

// ---------------------------------------------------------------------------
// P6.M04 (klasyfikacja terenu i granice mapy): progi i mnozniki balansu.
// ---------------------------------------------------------------------------

pub const MAPGEN_TERRAIN_CLASS_JSON: &str =
    include_str!("../../data/derived/mapgen-terrain-class.json");

/// Sekcja `klasyfikacja` (web `classifyTerrain` / `classifyTerrainFlat`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainClassifyParams {
    pub prog_pustyni_domyslny: StartValue<f64>,
    pub prog_gor_domyslny: StartValue<f64>,
    pub prog_wzgorz_domyslny: StartValue<f64>,
    pub elev_ponizej_ktorego_woda_lub_laka: StartValue<f64>,
    pub landmask_ponizej_ktorego_morze: StartValue<f64>,
    pub pustynia_elev_wiekszy_niz: StartValue<f64>,
    pub pustynia_elev_mniejszy_niz: StartValue<f64>,
    pub rownina_prog_sumy: StartValue<f64>,
}

/// Jeden wiersz bramek wysokosci reliefu (web `reliefElevGates`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefGateRow {
    pub mountain: StartValue<f64>,
    pub highland: StartValue<f64>,
    pub land_mask_hi: StartValue<f64>,
    pub land_mask_mtn: StartValue<f64>,
}

/// Sekcja `bramki_wysokosci_reliefu` (web `reliefElevGates`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefGateParams {
    pub prog_niski_mtn_max_wlacznie: StartValue<f64>,
    pub prog_wysoki_mtn_min_wlacznie: StartValue<f64>,
    pub niski: ReliefGateRow,
    pub sredni: ReliefGateRow,
    pub wysoki: ReliefGateRow,
}

/// Sekcja `przeplot_rownina_laka` (web `TERRAIN_*_AMP`, `terenCoverageCellSize`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainCellMixParams {
    pub amplituda_globalna: StartValue<f64>,
    pub amplituda_komorkowa: StartValue<f64>,
    pub rozmiar_komorki_hex: StartValue<f64>,
}

/// Sekcja `relief_po_dopasowaniu_ladu` (web `REAPPLY_RELIEF_BUDGET_FRAC`, `FALLBACK_RELIEF_FRAC`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainReliefTierParams {
    pub budzet_ulamek_ladu: TierTriple<StartValue<f64>>,
    pub docelowy_udzial_gor: TierTriple<StartValue<f64>>,
    pub docelowy_udzial_wzgorz: TierTriple<StartValue<f64>>,
}

/// Sekcja `nakladka_lasu` (web `reapplyForestOverlay`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ForestOverlayParams {
    pub bonus_wnetrza_ladu_max: StartValue<f64>,
    pub mnoznik_strefy_umiarkowanej: StartValue<f64>,
    pub mnoznik_poza_strefa_umiarkowana: StartValue<f64>,
    pub minimum_lasu_pangea: StartValue<f64>,
    pub minimum_lasu_poza_pangea: StartValue<f64>,
    pub minimum_sufitu_komorki: StartValue<f64>,
}

/// Sekcja `brzeg_mapy` (web `MAP_BORDER_*`, strefa stopniowanego brzegu, fade'y).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapBorderParams {
    pub twardy_ocean_hex: StartValue<f64>,
    pub strefa_stopniowanego_ladu_hex: StartValue<f64>,
    pub przyrost_limitu_ladu_na_pierscien: StartValue<f64>,
    pub limit_pelnego_ladu_w_fade: StartValue<f64>,
    pub waga_rozproszenia_brzegu: StartValue<f64>,
    pub tolerancja_remisu_rozproszenia: StartValue<f64>,
    pub max_sasiadow_ladu_przy_dosypywaniu: StartValue<f64>,
    pub minimum_marginesu_krawedzi_rect: StartValue<f64>,
}

/// Sekcja `srodek_mapy` (web `mapCenterRadialBias`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapCenterParams {
    pub minimum_biasu_radialnego: StartValue<f64>,
    pub promien_biasu_radialnego: StartValue<f64>,
    pub wykladnik_biasu_radialnego: StartValue<f64>,
}

/// Plik `mapgen-terrain-class.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenTerrainClassFile {
    pub meta: serde_json::Value,
    pub klasyfikacja: TerrainClassifyParams,
    pub bramki_wysokosci_reliefu: ReliefGateParams,
    pub przeplot_rownina_laka: TerrainCellMixParams,
    pub relief_po_dopasowaniu_ladu: TerrainReliefTierParams,
    pub nakladka_lasu: ForestOverlayParams,
    pub brzeg_mapy: MapBorderParams,
    pub srodek_mapy: MapCenterParams,
}

pub fn parse_mapgen_terrain_class() -> Result<MapgenTerrainClassFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_TERRAIN_CLASS_JSON)
}

/// Tabela klasyfikacji terenu i granic mapy (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_terrain_class() -> &'static MapgenTerrainClassFile {
    static TABLE: std::sync::OnceLock<MapgenTerrainClassFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_mapgen_terrain_class().expect("mapgen-terrain-class.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.6B (R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1): cities / empire-city-defaults / display-names -
// edytowalne tabele balansu i etykiet (pin web edb8fb56)
// ---------------------------------------------------------------------------------------------

pub const CITIES_PARAMS_JSON: &str = include_str!("../../data/derived/cities-params.json");
pub const DISPLAY_NAMES_PARAMS_JSON: &str =
    include_str!("../../data/derived/display-names-params.json");

/// Podzial Pracy miasta: domyslna wartosc, granice i stale AI (procent udzialu budynkow).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesPodzialPracyParams {
    pub domyslnie_budynki: f64,
    pub min_budynki: f64,
    pub max_budynki: f64,
    pub ai_stale_budynki: f64,
    pub min_pula_zasada3_nadwyzka: f64,
}

/// Trzy udzialy podzialu Handlu (nazwy pol jak w webie).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesHandelSplit {
    #[serde(rename = "procentNauka")]
    pub procent_nauka: f64,
    #[serde(rename = "procentPieniadz")]
    pub procent_pieniadz: f64,
    #[serde(rename = "procentLuksus")]
    pub procent_luksus: f64,
}

/// Podzial Handlu: domyslny podzial nowego miasta, krok suwaka i cap Nauki.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesPodzialHandluParams {
    pub domyslnie: CitiesHandelSplit,
    pub krok: f64,
    pub max_nauka: f64,
}

/// Wiersz migracji starego `ulepszeniaPerTurn` (1|2|3 sztuk) na procent budzetu Pracy.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesPerTurnMigration {
    pub per_turn: f64,
    pub procent: f64,
}

/// Ustawienia auto-ulepszen terenu.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesUlepszeniaParams {
    pub domyslny_focus: String,
    pub domyslny_tryb: String,
    pub domyslnie_only_worked: bool,
    pub domyslnie_wolno_wycinac_las: bool,
    pub domyslna_praca_procent: f64,
    pub ai_major_praca_procent: f64,
    pub max_auto_praca_procent: f64,
    pub migracja_per_turn: Vec<CitiesPerTurnMigration>,
}

/// Ustawienia auto-kolejki budynkow i biblioteki list.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesBudowaParams {
    pub domyslny_focus: String,
    pub domyslny_tryb: String,
    pub domyslny_tryb_ai: String,
    pub domyslny_tryb_nowe_miasto: String,
    pub domyslny_priorytet_typow: Vec<String>,
    pub typy_focus: Vec<String>,
    pub focus_bez_typu: String,
    pub lista_domyslna_nazwa_prefiks: String,
    pub lista_szablon_id_prefiks: String,
    pub lista_slot_legacy: Vec<String>,
    pub lista_nazwa_legacy_prefiks: String,
    pub lista_limit_nazw: f64,
}

/// Domyslny profil pol okolicy.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesOkolicaParams {
    pub domyslny_focus: String,
    pub domyslny_tryb: String,
}

/// Stale z `population-growth-v85.ts` (poza zakresem P6.6B), kopia wejsciowa.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesForeignInputs {
    pub zrodlo: String,
    pub domyslny_poziom_racji: f64,
    pub wyzywienie_max: f64,
    pub swiezy_wealth_poziom: f64,
    pub swiezy_wealth_pula: f64,
}

/// Domyslny suwak zywnosc -> wzrost.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesWyzywienieParams {
    pub domyslny_procent_rozwoj: f64,
}

/// Teksty powodow odmowy zalozenia miasta.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesFoundingReasons {
    pub poza_mapa: String,
    pub morze: String,
    pub gory: String,
    pub za_blisko: String,
    pub poza_terytorium: String,
    pub limit_epoka: String,
    pub found_city_at_null: String,
}

/// Parametry zakladania miasta (poza kosztami z `city-founding-params.json`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesFoundingParams {
    pub min_dystans_miasto_panstwo: f64,
    pub limit_miast_baza_zapas: f64,
    pub limit_miast_krok_epoka: f64,
    pub min_epoka: f64,
    pub startowa_populacja: f64,
    pub wealth_immunitet_tur: f64,
    pub id_prefiks: String,
    pub powody: CitiesFoundingReasons,
}

/// Pula nazw miast (deprecated `cityName`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesNamesParams {
    pub lista: Vec<String>,
    pub prefiks_generyczny: String,
}

/// Etykiety i tooltip podzialu Pracy dla UI.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesPodzialLabels {
    pub pula: String,
    pub pula_pelna: String,
    pub pula_tip: String,
}

/// Plik `cities-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CitiesParamsFile {
    pub meta: serde_json::Value,
    pub procent_calosc: f64,
    pub podzial_pracy: CitiesPodzialPracyParams,
    pub podzial_handlu: CitiesPodzialHandluParams,
    pub ulepszenia: CitiesUlepszeniaParams,
    pub budowa: CitiesBudowaParams,
    pub okolica: CitiesOkolicaParams,
    pub wejscia_z_innych_modulow_weba: CitiesForeignInputs,
    pub wyzywienie: CitiesWyzywienieParams,
    pub zakladanie: CitiesFoundingParams,
    pub nazwy_miast: CitiesNamesParams,
    pub etykiety_podzialu_pracy: CitiesPodzialLabels,
}

pub fn parse_cities_params() -> Result<CitiesParamsFile, serde_json::Error> {
    serde_json::from_str(CITIES_PARAMS_JSON)
}

/// Stale `cities.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn cities_params() -> &'static CitiesParamsFile {
    static TABLE: std::sync::OnceLock<CitiesParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_cities_params().expect("cities-params.json must parse"))
}

/// Wzorzec techniczny etykiety wlasciciela (regex `^<prefiks>\d+$` z flaga `i`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DisplayNamesTechnicalPattern {
    pub prefiks: String,
    pub cyfry: bool,
    pub ignoruj_wielkosc: bool,
}

/// Plik `display-names-params.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DisplayNamesParamsFile {
    pub meta: serde_json::Value,
    pub etykieta_miasto_panstwo: String,
    pub separator: String,
    pub wzorce_techniczne: Vec<DisplayNamesTechnicalPattern>,
}

pub fn parse_display_names_params() -> Result<DisplayNamesParamsFile, serde_json::Error> {
    serde_json::from_str(DISPLAY_NAMES_PARAMS_JSON)
}

/// Stale `display-names.ts` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn display_names_params() -> &'static DisplayNamesParamsFile {
    static TABLE: std::sync::OnceLock<DisplayNamesParamsFile> = std::sync::OnceLock::new();
    TABLE
        .get_or_init(|| parse_display_names_params().expect("display-names-params.json must parse"))
}

// ---------------------------------------------------------------------------
// P6.M05A (relief A: masy ladu i pokrycie siatki): ulamki, rozmiary komorek i mnozniki balansu.
// ---------------------------------------------------------------------------

pub const MAPGEN_RELIEF_A_JSON: &str = include_str!("../../data/derived/mapgen-relief-a.json");

/// Sekcja `kwadrat_centrum` (web `CONTINENT_CENTER_SQUARE_SIZE`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefCenterSquareParams {
    pub rozmiar_boku: StartValue<f64>,
}

/// Sekcja `las` (web `FOREST_SHARE_OF_DRY_LAND`, `FOREST_OVERLAY_CAP_FRAC`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefForestParams {
    pub udzial_suchego_ladu: TierTriple<StartValue<f64>>,
    pub sufit_nakladki_ulamek: StartValue<f64>,
}

/// Sekcja `limit_bonusu_reliefu` (web `reliefBonusCapMountain` / `reliefBonusCapHighland`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefBonusCapParams {
    pub gory: TierTriple<StartValue<f64>>,
    pub wzgorza: TierTriple<StartValue<f64>>,
}

/// Sekcja `rozrzut_reliefu` (web `pickSpreadReliefKeys(..., minDist)`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefSpreadParams {
    pub min_odleglosc_gor: StartValue<f64>,
    pub min_odleglosc_wzgorz: StartValue<f64>,
}

/// Sekcja `minima_komorki` (web `RELIEF_MIN_MOUNTAINS` / `RELIEF_MIN_HIGHLANDS`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefCellMinimaParams {
    pub gory: TierTriple<StartValue<f64>>,
    pub wzgorza: TierTriple<StartValue<f64>>,
}

/// Sekcja `rozmiary_komorek` (web `*CoverageCellSize`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefCellSizeParams {
    pub woda: TierTriple<StartValue<f64>>,
    pub zelazo: TierTriple<StartValue<f64>>,
    pub miedz: TierTriple<StartValue<f64>>,
    pub las: TierTriple<StartValue<f64>>,
}

/// Sekcja `min_ladu_w_komorce` (web `minLandHexesForReliefCell`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefMinLandParams {
    pub dolna_granica: StartValue<f64>,
    pub ulamek_rozmiaru_komorki: StartValue<f64>,
}

/// Sekcja `pokrycie` (web `MIN_RIVER_SOURCES_PER_WATER_CELL`, `reliefGridCoverageRatio`,
/// `assertReliefGridCoverage`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefCoverageParams {
    pub min_zrodel_rzek_na_komorke_wody: StartValue<f64>,
    pub mnoznik_miedzi_wzgledem_zelaza: StartValue<f64>,
    pub prog_pokrycia_siatki: StartValue<f64>,
}

/// Sekcja `wymuszanie` (web `pickReliefForceHex`, `forceReliefTypeInCell`, `ensureMass*`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefForceParams {
    pub mnoznik_wyniku_wzgorza: StartValue<f64>,
    pub limit_odleglosci_od_brzegu: StartValue<f64>,
    pub waga_odleglosci_od_brzegu: StartValue<f64>,
    pub kara_plytkie_morze: StartValue<f64>,
    pub waga_losowa: StartValue<f64>,
    pub dodatek_do_straznika_petli: StartValue<f64>,
    pub max_przebiegow_domykania_komorek: StartValue<f64>,
}

/// Sekcja `sufit_przepelnienia` (web `RELIEF_OVERFLOW_CAP_MULT`, `FALLBACK_RELIEF_OVERFLOW_CAP`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefOverflowParams {
    pub mnoznik: StartValue<f64>,
    pub fallback_gory: TierTriple<StartValue<f64>>,
    pub fallback_wzgorza: TierTriple<StartValue<f64>>,
}

/// Plik `mapgen-relief-a.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenReliefAFile {
    pub meta: serde_json::Value,
    pub kwadrat_centrum: ReliefCenterSquareParams,
    pub las: ReliefForestParams,
    pub limit_bonusu_reliefu: ReliefBonusCapParams,
    pub rozrzut_reliefu: ReliefSpreadParams,
    pub minima_komorki: ReliefCellMinimaParams,
    pub rozmiary_komorek: ReliefCellSizeParams,
    pub min_ladu_w_komorce: ReliefMinLandParams,
    pub pokrycie: ReliefCoverageParams,
    pub wymuszanie: ReliefForceParams,
    pub sufit_przepelnienia: ReliefOverflowParams,
}

pub fn parse_mapgen_relief_a() -> Result<MapgenReliefAFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_RELIEF_A_JSON)
}

/// Tabela reliefu A (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_relief_a() -> &'static MapgenReliefAFile {
    static TABLE: std::sync::OnceLock<MapgenReliefAFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_relief_a().expect("mapgen-relief-a.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.7B (R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1): building-cost-tempo / building-stock-cost /
// building-resource-gate - edytowalna tabela balansu (pin web edb8fb56)
// ---------------------------------------------------------------------------------------------

pub const BUILDING_COST_PARAMS_JSON: &str =
    include_str!("../../data/derived/building-cost-params.json");

/// Token zastepowany etykieta Zlota z sekcji wejsc z innych modulow weba (jedno zrodlo).
pub const BUILDING_COST_ZLOTO_TOKEN: &str = "{zloto_label}";

/// Wpis `KOSZT_BUDYNKOW_PACE`: klucz tempa kosztow i jego mnoznik.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostPaceEntry {
    pub klucz: String,
    pub mnoznik: f64,
}

/// Prog mnoznika ery: epoka >= `min_epoka` daje `mnoznik` (progi sprawdzane w kolejnosci pliku).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostEraThreshold {
    pub min_epoka: f64,
    pub mnoznik: f64,
}

/// Slowa nazw epok (po normalizacji) przypisane do mnoznika.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostEraWords {
    pub mnoznik: f64,
    pub slowa: Vec<String>,
}

/// Mnoznik kosztu wg epoki (jednostki i budynki).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostEras {
    pub progi: Vec<BuildingCostEraThreshold>,
    pub domyslny_mnoznik: f64,
    pub domyslna_epoka_wejscia_budynku: f64,
    pub slowa: Vec<BuildingCostEraWords>,
}

/// Stale z `r-stawki-strojenie.ts` i `zloto-access.ts` (poza zakresem P6.7B), kopia wejsciowa.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostForeignInputs {
    pub zrodlo: String,
    pub r_stawki_fala2_mnoznik: f64,
    pub zloto_stock_klucz: String,
    pub zloto_label: String,
    pub mennica_zloto_drain_na_ture: f64,
}

/// Para klucz ASCII magazynu i etykieta PL.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostLabel {
    pub klucz: String,
    pub etykieta: String,
}

/// Etykiety i klucze magazynu panstwa.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostStorage {
    pub etykiety: Vec<BuildingCostLabel>,
    pub klucze_magazynu_panstwa: Vec<String>,
}

/// Parametry kosztu surowcowego jednostek (units.json `Surowiec`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostUnits {
    pub kon_koszt_bazowy: u32,
    pub kon_klucz: String,
    pub wyjatek_kon_jednostka: String,
    pub typ_jezdny: String,
    pub znacznik_braku_surowca: String,
}

/// Bramka zloza: budynek wymaga zapasu surowcow o podanych etykietach w magazynie panstwa.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGateDeposit {
    pub budynek: String,
    pub etykiety: Vec<String>,
}

/// Prerekwizyt miasta: jeden budynek albo lista alternatyw (semantyka OR).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BuildingGatePrereqValue {
    One(String),
    Many(Vec<String>),
}

/// Wpis `CITY_BUILDING_PREREQ`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGatePrereq {
    pub budynek: String,
    pub wymaga: BuildingGatePrereqValue,
}

/// Konwerter: etykieta surowca spelniona przez wybudowany/aktywny budynek.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGateConverter {
    pub etykieta: String,
    pub budynek: String,
}

/// Teksty komunikatu o nieaktywnym budynku.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGateMessages {
    pub brak_prefiks: String,
    pub separator: String,
}

/// Bramka surowcowa/budynkowa: etykiety, zloza, prerekwizyty, dostep wodny, konwertery.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingGateParams {
    pub etykiety_ascii: Vec<BuildingCostLabel>,
    pub zloza_budynkow: Vec<BuildingGateDeposit>,
    pub prerekwizyty_miasta: Vec<BuildingGatePrereq>,
    pub dostep_wodny: Vec<String>,
    pub konwertery: Vec<BuildingGateConverter>,
    pub mennica_budynek: String,
    pub komunikaty: BuildingGateMessages,
}

/// Stale Spichlerza I/II (drain, bonusy, limity, mnozniki zywnosci).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SpichlerzParams {
    pub budynek_i: String,
    pub budynek_ii: String,
    pub wykluczone_z_bramki_runtime: Vec<String>,
    pub klucz_ceramika: String,
    pub klucz_sol: String,
    pub etykieta_ceramika: String,
    pub etykieta_sol: String,
    pub drain_ceramika_na_ture: f64,
    pub drain_sol_na_ture: f64,
    pub zdrowie_ii: f64,
    pub zdrowie_i: f64,
    pub wzrost_procent_ii: f64,
    pub wzrost_procent_i: f64,
    pub racja_mnoznik_ii: f64,
    pub racja_mnoznik_i: f64,
    pub zadowolenie_json_domyslne: f64,
    pub cap_imperium_i: f64,
    pub cap_imperium_ii_pelny: f64,
    pub armia_mnoznik_poza_terytorium: f64,
    pub garnizon_mnoznik_sol: f64,
}

/// Plik `building-cost-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BuildingCostParamsFile {
    pub meta: serde_json::Value,
    pub tempo_kosztow_budynkow: Vec<BuildingCostPaceEntry>,
    pub epoki: BuildingCostEras,
    pub wejscia_z_innych_modulow_weba: BuildingCostForeignInputs,
    pub magazyn: BuildingCostStorage,
    pub jednostki: BuildingCostUnits,
    pub bramka: BuildingGateParams,
    pub spichlerz: SpichlerzParams,
}

pub fn parse_building_cost_params() -> Result<BuildingCostParamsFile, serde_json::Error> {
    serde_json::from_str(BUILDING_COST_PARAMS_JSON)
}

/// Tabela `building-cost-params.json` (jednorazowy odczyt; blad danych = panika z komunikatem).
/// Token `{zloto_label}` w etykietach bramki jest tu zamieniany na etykiete Zlota z sekcji wejsc.
pub fn building_cost_params() -> &'static BuildingCostParamsFile {
    static TABLE: std::sync::OnceLock<BuildingCostParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        let mut file = parse_building_cost_params().expect("building-cost-params.json must parse");
        let zloto = file.wejscia_z_innych_modulow_weba.zloto_label.clone();
        let resolve = |text: &mut String| {
            if text == BUILDING_COST_ZLOTO_TOKEN {
                *text = zloto.clone();
            }
        };
        for entry in &mut file.bramka.etykiety_ascii {
            resolve(&mut entry.etykieta);
        }
        for deposit in &mut file.bramka.zloza_budynkow {
            deposit.etykiety.iter_mut().for_each(resolve);
        }
        file
    })
}

pub const NFD_STRIP_TABLE_JSON: &str = include_str!("../../data/derived/nfd-strip-table.json");

/// Zakres znakow laczacych wycinanych po rozkladzie NFD (web: `/[̀-ͯ]/g`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NfdStripRange {
    pub od: u32,
    #[serde(rename = "do")]
    pub do_: u32,
}

/// Stale rozkladu sylab Hangul (Unicode, rozdzial 3.12).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NfdHangulParams {
    pub s_base: u32,
    pub l_base: u32,
    pub v_base: u32,
    pub t_base: u32,
    pub l_count: u32,
    pub v_count: u32,
    pub t_count: u32,
}

/// Plik `nfd-strip-table.json`: rozklad NFD po wycieciu znakow laczacych (dane Unicode).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct NfdStripTableFile {
    pub meta: serde_json::Value,
    pub wycinany_zakres: NfdStripRange,
    pub hangul: NfdHangulParams,
    pub wpisy: Vec<(u32, String)>,
    /// Znaki laczace o klasie laczenia (ccc) != 0: `[punkt_kodowy, ranga]`, ranga rosnaca z ccc.
    pub kolejnosc_znakow_laczacych: Vec<(u32, u32)>,
}

pub fn parse_nfd_strip_table() -> Result<NfdStripTableFile, serde_json::Error> {
    serde_json::from_str(NFD_STRIP_TABLE_JSON)
}

/// Tabela rozkladu NFD z indeksem po punkcie kodowym (jednorazowy odczyt; blad danych = panika).
pub struct NfdStripLookup {
    pub file: NfdStripTableFile,
    pub by_code_point: std::collections::HashMap<u32, String>,
    pub combining_rank: std::collections::HashMap<u32, u32>,
}

pub fn nfd_strip_lookup() -> &'static NfdStripLookup {
    static TABLE: std::sync::OnceLock<NfdStripLookup> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        let file = parse_nfd_strip_table().expect("nfd-strip-table.json must parse");
        let by_code_point = file.wpisy.iter().cloned().collect();
        let combining_rank = file.kolejnosc_znakow_laczacych.iter().copied().collect();
        NfdStripLookup {
            file,
            by_code_point,
            combining_rank,
        }
    })
}

// ---------------------------------------------------------------------------
// P6.7A - wzrost ludnosci i zywnosc imperium
// (`population-growth-v85.ts`, `empire-food.ts`, `population-growth-tempo.ts`,
// `r-stawki-strojenie.ts`). Tabele: `wzrost-ludnosci-params.json`, `era-diakrytyki.json`.
// ---------------------------------------------------------------------------

pub const WZROST_LUDNOSCI_PARAMS_JSON: &str =
    include_str!("../../data/derived/wzrost-ludnosci-params.json");
pub const ERA_DIAKRYTYKI_JSON: &str = include_str!("../../data/derived/era-diakrytyki.json");

/// Wiersz tabeli `WYZYWIENIE_GROWTH_PCT`: poziom Wyzywienia -> wzrost % na ture.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WzrostProcWiersz {
    pub poziom: f64,
    pub proc: f64,
}

/// Skala Wyzywienia (0..max co krok); max zyje w `cities-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WyzywienieParams {
    pub zrodlo: String,
    pub min: f64,
    pub krok: f64,
    pub wzrost_proc: Vec<WzrostProcWiersz>,
}

/// Stale skladnikow `computeGrowthPercentV85`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SkladnikiWzrostuParams {
    pub zrodlo: String,
    pub male_miasto_prog: f64,
    pub zdrowie_na_punkt: f64,
    pub szczescie_na_punkt: f64,
    pub cywilizacja_skala: f64,
}

/// Mnoznik trudnosci dla wkladu `lud_wzrost_proc` macierzy cywilizacji.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TrudnoscMnoznikParams {
    pub zrodlo: String,
    pub easy: f64,
    pub normal: f64,
    pub hard: f64,
}

/// Twardy sufit i dozwolone delty limitu ludnosci (wejscie z `economy.ts`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LimitPopulacjiParams {
    pub zrodlo: String,
    pub twardy_max: f64,
    pub dozwolone_delta: Vec<f64>,
}

/// Wejscia Spichlerza (z `building-resource-gate.ts`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SpichlerzWzrostParams {
    pub zrodlo: String,
    pub id_i: String,
    pub id_ii: String,
    pub id_akwedukt: String,
    pub id_magazyn: String,
    pub wzrost_proc_tier_i: f64,
    pub wzrost_proc_tier_ii: f64,
    pub wzrost_proc_brak: f64,
    pub mnoznik_kosztu_racji_tier_i: f64,
    pub mnoznik_kosztu_racji_tier_ii: f64,
    pub mnoznik_kosztu_racji_brak: f64,
    pub cap_imperium_tier_i: f64,
    pub cap_imperium_tier_ii: f64,
}

/// Wejscie z `economy-upkeep.ts::magazynEraMultiplier`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MagazynEraParams {
    pub zrodlo: String,
    pub podstawa: f64,
    pub epoka_min: f64,
}

/// Wartosci zapasowe `buildRationParams` (@deprecated w webie).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RacjeDomyslneParams {
    pub zrodlo: String,
    pub zywnosc: [f64; 3],
    pub wzrost_proc: [f64; 3],
}

/// Wartosci zapasowe `buildEmpireFoodParams`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EmpireFoodDomyslneParams {
    pub zrodlo: String,
    pub centralny_cap_baza: f64,
    pub centralny_cap_bonus_magazyn: f64,
    pub glod_hp_frac: f64,
    pub glod_karencja_tur: f64,
    pub glod_stat_mult: f64,
}

/// Wiersz migracji starych batonow Racji (1|2|3).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MigracjaRacjiWiersz {
    pub stary: f64,
    pub nowy: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MigracjaRacjiParams {
    pub zrodlo: String,
    pub wiersze: Vec<MigracjaRacjiWiersz>,
}

/// Tempo wzrostu z kreatora (mnoznik progu).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TempoWzrostuParams {
    pub zrodlo: String,
    pub wysoki: f64,
    pub normalny: f64,
    pub wolny: f64,
    pub prog_min: f64,
}

/// Mnozniki R-STAWKI-STROJENIE.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RStawkiParams {
    pub zrodlo: String,
    pub koszt_mult: f64,
    pub fala2_mult: f64,
    pub min_wartosc: f64,
}

/// Alias epoki badan (warianty zapisu -> id kanoniczny).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EpokaAlias {
    pub kanon: String,
    pub warianty: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EpokiBadanParams {
    pub zrodlo: String,
    pub domyslna: String,
    pub aliasy: Vec<EpokaAlias>,
    pub fala2_extra: Vec<String>,
}

/// Plik `wzrost-ludnosci-params.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WzrostLudnosciParamsFile {
    pub meta: serde_json::Value,
    pub wyzywienie: WyzywienieParams,
    pub skladniki_wzrostu: SkladnikiWzrostuParams,
    pub trudnosc_mnoznik_macierzy: TrudnoscMnoznikParams,
    pub limit_populacji: LimitPopulacjiParams,
    pub spichlerz: SpichlerzWzrostParams,
    pub magazyn_era: MagazynEraParams,
    pub racje_domyslne_deprecated: RacjeDomyslneParams,
    pub empire_food_domyslne: EmpireFoodDomyslneParams,
    pub migracja_racji_legacy: MigracjaRacjiParams,
    pub tempo_wzrostu: TempoWzrostuParams,
    pub r_stawki: RStawkiParams,
    pub epoki_badan: EpokiBadanParams,
}

pub fn parse_wzrost_ludnosci_params() -> Result<WzrostLudnosciParamsFile, serde_json::Error> {
    serde_json::from_str(WZROST_LUDNOSCI_PARAMS_JSON)
}

/// Stale P6.7A (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn wzrost_ludnosci_params() -> &'static WzrostLudnosciParamsFile {
    static TABLE: std::sync::OnceLock<WzrostLudnosciParamsFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_wzrost_ludnosci_params().expect("wzrost-ludnosci-params.json must parse")
    })
}

/// Plik `era-diakrytyki.json`: rozklad NFD bez znakow laczacych U+0300..U+036F.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EraDiakrytykiFile {
    pub meta: serde_json::Value,
    pub wiersze: Vec<(u32, String)>,
}

pub fn parse_era_diakrytyki() -> Result<EraDiakrytykiFile, serde_json::Error> {
    serde_json::from_str(ERA_DIAKRYTYKI_JSON)
}

/// Tabela rozkladu jako mapa punkt kodowy -> tekst (jednorazowy odczyt).
pub fn era_diakrytyki_map() -> &'static BTreeMap<u32, String> {
    static TABLE: std::sync::OnceLock<BTreeMap<u32, String>> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_era_diakrytyki()
            .expect("era-diakrytyki.json must parse")
            .wiersze
            .into_iter()
            .collect()
    })
}

// P6.M12 (R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1): domyslne i progi `computeClusters`.
// Czytane przez `domain/mapgen/cluster_compute.rs`. Wartosci balansowe sa EDYTOWALNE
// w `data/derived/mapgen-cluster-compute.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

pub const MAPGEN_CLUSTER_COMPUTE_JSON: &str =
    include_str!("../../data/derived/mapgen-cluster-compute.json");

/// Domyslne wejscia `computeClusters` (clusters.ts:3398).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterComputeDefaults {
    pub rywale_na_klaster: StartValue<i64>,
}

/// Miekki zapas min. odleglosci srodkow klastrow (clusters.ts:3433).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterComputeCenterDistance {
    pub min_zapas_krotszy_bok: StartValue<i64>,
    pub dzielnik_krotszego_boku: StartValue<i64>,
}

/// Margines od krawedzi mapy dla srodkow klastrow (clusters.ts:3463).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterComputeEdgeMargin {
    pub minimum: StartValue<i64>,
    pub dzielnik_dystansu_klastrow: StartValue<i64>,
}

/// Promien regionu klastra dopelnionego (clusters.ts:4054, 4069).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ClusterComputeTopUpRegion {
    pub minimum_promienia: StartValue<i64>,
    pub dzielnik_dystansu_klastrow: StartValue<i64>,
}

/// Plik `mapgen-cluster-compute.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenClusterComputeFile {
    pub meta: serde_json::Value,
    pub domyslne: ClusterComputeDefaults,
    pub dystans_klastrow: ClusterComputeCenterDistance,
    pub margines_brzegu: ClusterComputeEdgeMargin,
    pub region_dopelnienia: ClusterComputeTopUpRegion,
}

pub fn parse_mapgen_cluster_compute() -> Result<MapgenClusterComputeFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_CLUSTER_COMPUTE_JSON)
}

/// Tabela `computeClusters` (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_cluster_compute() -> &'static MapgenClusterComputeFile {
    static TABLE: std::sync::OnceLock<MapgenClusterComputeFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_cluster_compute().expect("mapgen-cluster-compute.json must parse")
    })
}

// ---------------------------------------------------------------------------------------------
// P6.M05B (R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1): pokrycie reliefu, bezpiecznik skupisk
// i pasma gorskie - tabela balansu `data/derived/mapgen-relief-b.json` (pin web `edb8fb56`).
// ---------------------------------------------------------------------------------------------

/// Plik `mapgen-relief-b.json`.
pub const MAPGEN_RELIEF_B_JSON: &str = include_str!("../../data/derived/mapgen-relief-b.json");

/// Sekcja `siatka_domykanie` (web `ensureReliefGridCoverage`, gen-helpers.ts:2371).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefBGridParams {
    pub min_masa_do_domykania: StartValue<f64>,
    pub przebiegi_zewnetrzne: StartValue<f64>,
    pub przebiegi_przywracania: StartValue<f64>,
    pub przebiegi_mop_up: StartValue<f64>,
    pub min_masa_mop_up: StartValue<f64>,
}

/// Sekcja `pasma` (web `growMountainRanges`, `capMountainRangeClusterSize`, `regrowLostMountainClusters`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefBRangeParams {
    pub udzial_gor_wzgorz_w_ladzie_sufit: StartValue<f64>,
    pub maks_skupisko_gor_wzgorz: StartValue<f64>,
    pub regrow_odstep_od_reliefu: StartValue<f64>,
    pub regrow_mnoznik_celu: StartValue<f64>,
    pub regrow_dlugosc_min: StartValue<f64>,
    pub regrow_dlugosc_max: StartValue<f64>,
    pub rozrzut_seedow_min_odleglosc: StartValue<f64>,
    pub szum_seed_pasma: StartValue<f64>,
    pub szum_seed_regrow: StartValue<f64>,
    pub szum_kroku_pasma: StartValue<f64>,
    pub szum_kroku_regrow: StartValue<f64>,
    pub regrow_proby_na_mase: StartValue<f64>,
    pub regrow_proby_bazowe: StartValue<f64>,
}

/// Fallback jednego tieru parametrow pasm (web `FALLBACK_MOUNTAIN_RANGE`, loader :63-65).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefBPasmaFallback {
    pub hexy_na_pasmo: StartValue<f64>,
    pub max_pasm_na_mase: StartValue<f64>,
    pub dlugosc_min: StartValue<f64>,
    pub dlugosc_max: StartValue<f64>,
    pub min_masa_hexow: StartValue<f64>,
    pub obrzeze_szansa: StartValue<f64>,
}

/// Plik `mapgen-relief-b.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenReliefBFile {
    pub meta: serde_json::Value,
    pub siatka_domykanie: ReliefBGridParams,
    pub pasma: ReliefBRangeParams,
    pub pasma_fallback: TierTriple<ReliefBPasmaFallback>,
}

pub fn parse_mapgen_relief_b() -> Result<MapgenReliefBFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_RELIEF_B_JSON)
}

/// Tabela reliefu B (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_relief_b() -> &'static MapgenReliefBFile {
    static TABLE: std::sync::OnceLock<MapgenReliefBFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_relief_b().expect("mapgen-relief-b.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.M06A (R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1) - lad/morze/wybrzeze A: edytowalne tabele
// (pin web edb8fb56: defaultLandFractionForTyp :3254, ERODE_TERRAIN_ORDER :3279).
// ---------------------------------------------------------------------------------------------

pub const MAPGEN_LANDSEA_JSON: &str = include_str!("../../data/derived/mapgen-landsea.json");

/// Udzial lądu per typ swiata (web `defaultLandFractionForTyp`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct LandFractionByTyp {
    pub kontynenty: f64,
    pub pangea: f64,
    pub wyspy: f64,
    pub ziemia: f64,
}

/// Plik `mapgen-landsea.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenLandseaFile {
    pub meta: serde_json::Value,
    pub udzial_ladu_domyslny: LandFractionByTyp,
    pub kolejnosc_erozji: Vec<crate::domain::map_generator::Terrain>,
}

pub fn parse_mapgen_landsea() -> Result<MapgenLandseaFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_LANDSEA_JSON)
}

/// Tabela lad/morze/wybrzeze (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea() -> &'static MapgenLandseaFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_landsea().expect("mapgen-landsea.json must parse"))
}

/// Plik `mapgen-desert-purge.json` (P6.M06A4, web `purgeDesertEnclaveWater` :4156): progi galezi
/// zamiany wody enklawy na pustynie. Wartosci edytowalne; kod nie zawiera ich literalow.
pub const MAPGEN_DESERT_PURGE_JSON: &str =
    include_str!("../../data/derived/mapgen-desert-purge.json");

/// Tabela progow `purgeDesertEnclaveWater` (P6.M06A4).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenDesertPurgeFile {
    pub meta: serde_json::Value,
    /// Web: `pustN >= 2` (bezwzgledny prog liczby pustynnych sasiadow).
    pub prog_pustyni_min_liczba: u64,
    /// Web: `pustN >= dryN * 0.4` (ulamek suchych sasiadow).
    pub prog_pustyni_min_ulamek_suchych: f64,
}

pub fn parse_mapgen_desert_purge() -> Result<MapgenDesertPurgeFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_DESERT_PURGE_JSON)
}

/// Tabela progow pustyni (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_desert_purge() -> &'static MapgenDesertPurgeFile {
    static TABLE: std::sync::OnceLock<MapgenDesertPurgeFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_desert_purge().expect("mapgen-desert-purge.json must parse"))
}

/// Plik `mapgen-jagged-coast.json` (P6.M06A4 r3, web `applyJaggedCoastNoise` :4232): parametry szumu
/// i progi poszarpania brzegow. Wartosci edytowalne; kod nie zawiera ich literalow.
pub const MAPGEN_JAGGED_COAST_JSON: &str =
    include_str!("../../data/derived/mapgen-jagged-coast.json");

/// Tabela parametrow `applyJaggedCoastNoise` (P6.M06A4 r3).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenJaggedCoastFile {
    pub meta: serde_json::Value,
    /// Web `noiseScale` (0.28).
    pub skala_szumu: f64,
    /// Web `q * noiseScale * 2.1` (mnoznik drobnej skali).
    pub mnoznik_drobnej_skali: f64,
    /// Web `... * 2.1 + 200` (przesuniecie drobnej skali, x i y).
    pub przesuniecie_drobnej_skali: f64,
    /// Web `fbm(...) * 0.35` (waga drobnej skali).
    pub waga_drobnej_skali: f64,
    /// Web `fbm(perm, ..., 4)` (oktawy grubej skali).
    pub oktawy_grubej_skali: u32,
    /// Web `fbm(perm, ..., 3)` (oktawy drobnej skali).
    pub oktawy_drobnej_skali: u32,
    /// Web `pass * 17` (przesuniecie przebiegu, x).
    pub przesuniecie_przebiegu_x: f64,
    /// Web `pass * 31` (przesuniecie przebiegu, y).
    pub przesuniecie_przebiegu_y: f64,
    /// Web `coast > 0.68` (erozja lądu przy morzu).
    pub prog_erozji_lad: f64,
    /// Web `coast < 0.32` (wypelnienie morza przy lądzie).
    pub prog_wypelnienia_morze: f64,
}

pub fn parse_mapgen_jagged_coast() -> Result<MapgenJaggedCoastFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_JAGGED_COAST_JSON)
}

/// Tabela poszarpania brzegow (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_jagged_coast() -> &'static MapgenJaggedCoastFile {
    static TABLE: std::sync::OnceLock<MapgenJaggedCoastFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_jagged_coast().expect("mapgen-jagged-coast.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.M06A5 (R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1) - rodzina ulamka lądu, partia 1: progi
// i tolerancje z web `applyLandFractionByScore` (:3444) / `sortLandKeysForErosion` (:3207).
// ---------------------------------------------------------------------------------------------

pub const MAPGEN_LANDSEA_FILL_JSON: &str =
    include_str!("../../data/derived/mapgen-landsea-fill.json");

/// Plik `mapgen-landsea-fill.json` (web: PANGEA_LAND_FILL_MIN_SCORE :3438, clamp :3453,
/// tolerancje sortowania :3222 i :3484).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenLandseaFillFile {
    pub meta: serde_json::Value,
    pub clamp_udzialu_min: f64,
    pub clamp_udzialu_max: f64,
    pub pangea_min_score_wypelnienia: f64,
    pub tolerancja_score_sortowanie: f64,
    pub tolerancja_odleglosci_centrum: f64,
}

pub fn parse_mapgen_landsea_fill() -> Result<MapgenLandseaFillFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_LANDSEA_FILL_JSON)
}

/// Tabela ulamka lądu (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea_fill() -> &'static MapgenLandseaFillFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaFillFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_landsea_fill().expect("mapgen-landsea-fill.json must parse"))
}

// ---------------------------------------------------------------------------------------------
// P6.M06A6 (R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1) - rodzina Pangei i kontynentow, partia 1:
// progi i szum z web `erodePangeaBboxLowScoreRim` (:3551), `carvePangeaLongSideGulfs` (:3606).
// ---------------------------------------------------------------------------------------------

pub const MAPGEN_LANDSEA_PANGEA_JSON: &str =
    include_str!("../../data/derived/mapgen-landsea-pangea.json");

/// Plik `mapgen-landsea-pangea.json` (web: erozja obwodu bbox :3551, zatoki na dlugich bokach :3606).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenLandseaPangeaFile {
    pub meta: serde_json::Value,
    pub erode_docelowe_wypelnienie_bbox: f64,
    pub erode_max: usize,
    pub erode_pas_brzegu: f64,
    pub erode_tolerancja_score: f64,
    pub carve_min_liczba_ladu: usize,
    pub carve_max_aspect: f64,
    pub carve_max_wyciec: usize,
    pub carve_glebokosc_udzial: f64,
    pub carve_glebokosc_min: f64,
    pub carve_blisko_srodka_udzial: f64,
    pub carve_szum_skala: f64,
    pub carve_szum_przesuniecie: f64,
    pub carve_szum_oktawy: u32,
    pub carve_szum_waga: f64,
}

pub fn parse_mapgen_landsea_pangea() -> Result<MapgenLandseaPangeaFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_LANDSEA_PANGEA_JSON)
}

/// Tabela progow Pangei (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea_pangea() -> &'static MapgenLandseaPangeaFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaPangeaFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_landsea_pangea().expect("mapgen-landsea-pangea.json must parse")
    })
}

// ---------------------------------------------------------------------------------------------
// P6.M06A7 (R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1) - korytarze obwarzanka Pangei, partia 1:
// szerokosc korytarza z web `pangeaAnnularMaxCorridorWidth` (gen-helpers.ts :4329).
// ---------------------------------------------------------------------------------------------

pub const MAPGEN_LANDSEA_PANGEA_ANNULAR_JSON: &str =
    include_str!("../../data/derived/mapgen-landsea-pangea-annular.json");

/// Plik `mapgen-landsea-pangea-annular.json` (web: `pangeaAnnularMaxCorridorWidth` :4329).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenLandseaPangeaAnnularFile {
    pub meta: serde_json::Value,
    pub annular_skala_pola: f64,
    pub annular_baza: f64,
    pub annular_mnoznik: f64,
    pub annular_min: f64,
    pub annular_max: f64,
}

pub fn parse_mapgen_landsea_pangea_annular(
) -> Result<MapgenLandseaPangeaAnnularFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_LANDSEA_PANGEA_ANNULAR_JSON)
}

/// Tabela korytarzy obwarzanka Pangei (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea_pangea_annular() -> &'static MapgenLandseaPangeaAnnularFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaPangeaAnnularFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_landsea_pangea_annular()
            .expect("mapgen-landsea-pangea-annular.json must parse")
    })
}

// ---------------------------------------------------------------------------------------------
// P6.M06A8 (R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1) - jednosc Pangei, partia 1:
// most i usuwanie obcych mas z web `ensurePangeaSingleContinent` (gen-helpers.ts :4375).
// ---------------------------------------------------------------------------------------------

pub const MAPGEN_LANDSEA_PANGEA_BRIDGE_JSON: &str =
    include_str!("../../data/derived/mapgen-landsea-pangea-bridge.json");

/// Plik `mapgen-landsea-pangea-bridge.json` (web: `ensurePangeaSingleContinent` :4375).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenLandseaPangeaBridgeFile {
    pub meta: serde_json::Value,
    pub bridge_skala_pola: f64,
    pub bridge_baza: f64,
    pub bridge_mnoznik: f64,
    pub bridge_min: f64,
    pub bridge_max: f64,
    pub bridge_iter_max: usize,
    pub bridge_zapas_sciezki: i64,
    pub masa_obca_min: f64,
    pub masa_obca_ulamek_glownej: f64,
}

pub fn parse_mapgen_landsea_pangea_bridge(
) -> Result<MapgenLandseaPangeaBridgeFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_LANDSEA_PANGEA_BRIDGE_JSON)
}

/// Tabela mostow Pangei (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea_pangea_bridge() -> &'static MapgenLandseaPangeaBridgeFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaPangeaBridgeFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_landsea_pangea_bridge().expect("mapgen-landsea-pangea-bridge.json must parse")
    })
}

// ---------------------------------------------------------------------------------------------
// P6.M06A9 (R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1) - wypelnianie korytarzy Pangei i
// rebalance udzialu lądu, partia 1. Literaly w `data/derived/mapgen-landsea-pangea-fill.json`.
// ---------------------------------------------------------------------------------------------

/// Tekst `mapgen-landsea-pangea-fill.json` (wbudowany w binarke).
pub const MAPGEN_LANDSEA_PANGEA_FILL_JSON: &str =
    include_str!("../../data/derived/mapgen-landsea-pangea-fill.json");

/// Plik `mapgen-landsea-pangea-fill.json` (web: `pangeaLandCentroid` :4473, `pangeaRadialDryLandSteps`
/// :4484, `fillPangeaAnnularSeaCorridors` :4595, przebiegi `rebalanceLandFractionPangea` :3667).
#[derive(Debug, Clone, serde::Deserialize)]
pub struct MapgenLandseaPangeaFillFile {
    pub meta: serde_json::Value,
    pub fill_centroid_min_land: usize,
    pub fill_dist_epsilon: f64,
    pub fill_zapas_szerokosci: f64,
    pub fill_prog_pasma_zapas: f64,
    pub rebalance_jagged_passes: u32,
}

pub fn parse_mapgen_landsea_pangea_fill() -> Result<MapgenLandseaPangeaFillFile, serde_json::Error>
{
    serde_json::from_str(MAPGEN_LANDSEA_PANGEA_FILL_JSON)
}

/// Tabela wypelniania korytarzy Pangei (jednorazowy odczyt; blad danych = panika).
pub fn mapgen_landsea_pangea_fill() -> &'static MapgenLandseaPangeaFillFile {
    static TABLE: std::sync::OnceLock<MapgenLandseaPangeaFillFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| {
        parse_mapgen_landsea_pangea_fill().expect("mapgen-landsea-pangea-fill.json must parse")
    })
}

// ---------------------------------------------------------------------------------------------
// P6.M06B1 (R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1) - finalizacja wybrzeza i wod srodladowych,
// partia 1. Literaly progow i mnoznikow w `data/derived/mapgen-coast.json` (pin web edb8fb56,
// gen-helpers.ts:4649-4939). Kazdy lisc ma `zrodlo_web`.
// ---------------------------------------------------------------------------------------------

/// Tekst `mapgen-coast.json` (wbudowany w binarke).
pub const MAPGEN_COAST_JSON: &str = include_str!("../../data/derived/mapgen-coast.json");

/// Sekcja `zatoki_oceanu` (web `maxOceanBayDepth` :4649).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CoastZatokiOceanu {
    pub dzielnik_skali: StartValue<f64>,
    pub bufor_min_dodatek: StartValue<f64>,
    pub bufor_gorny_dodatek: StartValue<f64>,
}

/// Sekcja `dolina_rzezby` (web `purgeReliefValleyWater` :4724).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CoastDolinaRzezby {
    pub min_sasiadow_rzezby: StartValue<usize>,
    pub min_sasiadow_suchych: StartValue<usize>,
}

/// Sekcja `finalizacja` (web `finalizeCoastAndInlandWater` :4787).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CoastFinalizacja {
    pub max_przebiegow_domyslne: StartValue<usize>,
}

/// Sekcja `wciecia` (web `thickenCoastAndSmoothInlets` :4840).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CoastWciecia {
    pub przebiegi_wygladzania: StartValue<usize>,
    pub prog_sasiadow_ladu: StartValue<usize>,
    pub szerokosc_wybrzeza_domyslna: StartValue<usize>,
}

/// Sekcja `cypel_ujscia` (web `flattenFalseCoastalRiverNotches` :4915).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CoastCypelUjscia {
    pub prog_sasiadow_morza: StartValue<usize>,
}

/// Plik `mapgen-coast.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapgenCoastFile {
    pub meta: serde_json::Value,
    pub zatoki_oceanu: CoastZatokiOceanu,
    pub dolina_rzezby: CoastDolinaRzezby,
    pub finalizacja: CoastFinalizacja,
    pub wciecia: CoastWciecia,
    pub cypel_ujscia: CoastCypelUjscia,
}

pub fn parse_mapgen_coast() -> Result<MapgenCoastFile, serde_json::Error> {
    serde_json::from_str(MAPGEN_COAST_JSON)
}

/// Tabela finalizacji wybrzeza (jednorazowy odczyt; blad danych = panika z komunikatem).
pub fn mapgen_coast() -> &'static MapgenCoastFile {
    static TABLE: std::sync::OnceLock<MapgenCoastFile> = std::sync::OnceLock::new();
    TABLE.get_or_init(|| parse_mapgen_coast().expect("mapgen-coast.json must parse"))
}
