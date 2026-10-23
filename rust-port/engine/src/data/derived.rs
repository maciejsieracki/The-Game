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
