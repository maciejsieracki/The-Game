//! Strukturalne odzwierciedlenie plików danych `buildings.json`, `wonders.json`
//! i `tech.json` (kopie 1:1 w `rust-port/engine/data/`).
//!
//! Każda struktura odwzorowuje dokładnie kształt JSON z pliku źródłowego:
//! nazwy pól JSON są zachowane przez `#[serde(rename = "...")]`, pola obecne
//! nie zawsze są `Option<T>`, a pola występujące w części rekordów są
//! `Option<T>` (brak klucza albo `null` → `None`).
//!
//! Moduł NIE jest podpięty do `lib.rs` (osobny temat konsolidacyjny).
//! Test włącza go przez `#[path]`. Parsowanie używa `serde_json`, który jest
//! obecnie zależnością deweloperską (`[dev-dependencies]`); przy podpinaniu
//! do biblioteki trzeba przenieść `serde_json` do `[dependencies]`.

#![allow(dead_code)]

use serde::Deserialize;
use std::collections::BTreeMap;

// ---------------------------------------------------------------------------
// Dane wbudowane (ścieżki względem tego pliku: src/data/ -> ../../data/)
// ---------------------------------------------------------------------------

pub const BUILDINGS_JSON: &str = include_str!("../../data/buildings.json");
pub const WONDERS_JSON: &str = include_str!("../../data/wonders.json");
pub const TECH_JSON: &str = include_str!("../../data/tech.json");

pub fn parse_buildings() -> serde_json::Result<Vec<Building>> {
    serde_json::from_str(BUILDINGS_JSON)
}

pub fn parse_wonders() -> serde_json::Result<Wonders> {
    serde_json::from_str(WONDERS_JSON)
}

pub fn parse_tech() -> serde_json::Result<TechFile> {
    serde_json::from_str(TECH_JSON)
}

// ---------------------------------------------------------------------------
// buildings.json — tablica 42 rekordów budynków
// ---------------------------------------------------------------------------

/// Wektor efektów (`baza` i `przyrost` mają identyczny zestaw 8 kluczy).
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Efekty {
    pub praca: i64,
    pub pieniadz: i64,
    pub zywnosc: i64,
    pub nauka: i64,
    pub kultura: i64,
    pub zadowolenie: i64,
    pub obrona: i64,
    pub mnoznik: i64,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Top3 {
    pub tytul: String,
    pub tekst: String,
}

/// `koszt_surowce` — obecny w 41 z 42 rekordów; każdy surowiec opcjonalny.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct KosztSurowce {
    pub drewno: Option<i64>,
    pub kamien: Option<i64>,
    pub cegla: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Building {
    pub id: String,
    #[serde(rename = "dajeSzczescie")]
    pub daje_szczescie: bool,
    pub nazwa: String,
    pub kategoria: String,
    pub grupa: String,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    #[serde(rename = "maksPoziom")]
    pub maks_poziom: i64,
    #[serde(rename = "nazwyPoziomow")]
    pub nazwy_poziomow: Vec<String>,
    pub baza: Efekty,
    pub przyrost: Efekty,
    #[serde(rename = "kosztBudowy")]
    pub koszt_budowy: i64,
    #[serde(rename = "przyrostKosztu")]
    pub przyrost_kosztu: i64,
    pub utrzymanie: i64,
    #[serde(rename = "przyrostUtrzymania")]
    pub przyrost_utrzymania: i64,
    pub wymagania: String,
    pub uwagi: String,
    pub historia: String,
    pub opis: String,
    pub top3: Vec<Top3>,
    #[serde(rename = "techUnlock")]
    pub tech_unlock: String,
    pub koszt_surowce: Option<KosztSurowce>,
    #[serde(rename = "upgradeFrom")]
    pub upgrade_from: Option<String>,
    #[serde(rename = "wymaganySurowiec")]
    pub wymagany_surowiec: Option<String>,
    /// Klucz liczbowy `"6"` w jednym rekordzie (`poziomTechGate`).
    #[serde(rename = "poziomTechGate")]
    pub poziom_tech_gate: Option<BTreeMap<String, String>>,
    pub lokalizacja: Option<String>,
    pub odblokowuje: Option<String>,
    pub suppressed: Option<bool>,
}

// ---------------------------------------------------------------------------
// wonders.json — obiekt: _meta, cuda, panstwa, parkowane_epoka4plus
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Wonders {
    #[serde(rename = "_meta")]
    pub meta: WondersMeta,
    pub cuda: Vec<Cud>,
    pub panstwa: BTreeMap<String, Panstwo>,
    pub parkowane_epoka4plus: Vec<Parkowany>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct WondersMeta {
    pub opis: String,
    #[serde(rename = "dostep_E")]
    pub dostep_e: String,
    #[serde(rename = "dostep_R")]
    pub dostep_r: String,
    pub cuda_wyscigowe: Vec<String>,
    pub cuda_wyscigowe_epoka: BTreeMap<String, CudaWyscigoweEpoka>,
    pub cuda_wyscigowe_uwaga: String,
    pub wszystkie_cywilizacje: Vec<String>,
    pub epoka: String,
    pub wieki: Wieki,
    pub absolut: Absolut,
    pub budowa: String,
    pub harappa_v1: String,
    pub chinczycy_v1: String,
    pub celtowie_v1: String,
    pub koszt_jednostka: String,
    pub bonus_miasto: String,
    pub bonus_cywilizacja: String,
    pub bonus_cywilizacja_typy: BonusCywilizacjaTypy,
    pub bonus_zasieg: String,
    pub bonus_teren: String,
    pub bonus_specjalne: String,
    pub kanon_bonusow_2026: String,
    pub bonus_miasto_mnoznik: i64,
    pub bonus_moc: String,
    pub kanon_tech_wejscie: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct CudaWyscigoweEpoka {
    pub id: String,
    pub nazwa: String,
    pub epoka: String,
    pub profil: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct EpokiOpis {
    pub epoki: Vec<i64>,
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Wieki {
    pub antyk: EpokiOpis,
    pub sredniowiecze: EpokiOpis,
    pub renesans_plus: EpokiOpis,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct JedynyEfekt {
    pub opis: String,
    pub typ: String,
    pub wartosc: i64,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct PoAbsolut {
    pub decyzja: String,
    pub hex: String,
    pub jedyny_efekt: JedynyEfekt,
    pub utrzymanie_wygasly: String,
    pub utrzymanie_wygasly_opis: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Absolut {
    pub decyzja: String,
    pub domyslnie_antyk: i64,
    pub koniec_sredniowiecza: i64,
    pub opis: String,
    pub po_absolut: PoAbsolut,
    pub silnik: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct BonusCywilizacjaTypy {
    pub armia_morale: String,
    pub armia_xp: String,
    #[serde(rename = "dyplomacja_wpływ")]
    pub dyplomacja_wplyw: String,
    pub fortyfikacja_mapa: String,
    pub handel_procent: String,
    pub handel_turystyka: String,
    pub jednorazowe: String,
    pub magazyn_pojemnosc: String,
    pub nauka_procent: String,
    pub pobor_regen: String,
    pub produkcja_procent: String,
    pub relacje_respekt: String,
    pub relacje_zaufanie: String,
    pub walka_procent: String,
    pub wojna_wsparcie: String,
    pub wzrost_ludnosci_procent: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct BonusHex {
    pub kultura: Option<i64>,
    pub obrona: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct BonusMiasto {
    pub pieniadz: Option<i64>,
    pub praca: Option<i64>,
    pub kultura: Option<i64>,
    pub zywnosc: Option<i64>,
    pub zadowolenie: Option<i64>,
    pub nauka: Option<i64>,
    pub obrona: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct BonusTeren {
    #[serde(rename = "typTerenu")]
    pub typ_terenu: String,
    pub pieniadz: Option<i64>,
    pub praca: Option<i64>,
    pub warunek: Option<String>,
    pub zywnosc: Option<i64>,
    pub kultura: Option<i64>,
    pub drewno: Option<i64>,
    pub nauka: Option<i64>,
    pub zadowolenie: Option<i64>,
}

/// `wartosc` bywa całkowita (38 wystąpień) lub zmiennoprzecinkowa (19).
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct BonusSpecjalny {
    pub typ: String,
    pub wartosc: f64,
    pub opis: String,
    pub cel: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Bonusy {
    pub hex: Option<BonusHex>,
    pub miasto: BonusMiasto,
    pub teren: Option<Vec<BonusTeren>>,
    pub specjalne: Vec<BonusSpecjalny>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Cud {
    pub id: String,
    pub nazwa: String,
    pub dostep: String,
    pub cywilizacje: Vec<String>,
    #[serde(rename = "techUnlock")]
    pub tech_unlock: Vec<String>,
    #[serde(rename = "wymagaTerenu")]
    pub wymaga_terenu: Vec<String>,
    #[serde(rename = "epokaWejscia")]
    pub epoka_wejscia: i64,
    pub absolut: i64,
    #[serde(rename = "maxNaSwiecie")]
    pub max_na_swiecie: i64,
    #[serde(rename = "kosztBudowy")]
    pub koszt_budowy: i64,
    pub utrzymanie: i64,
    pub bonusy: Bonusy,
    pub historia: String,
    pub uwagi: Option<String>,
    #[serde(rename = "nazwaAlt")]
    pub nazwa_alt: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct PanstwoCud {
    pub id: String,
    pub dostep: String,
    pub kolejnosc: i64,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Panstwo {
    pub nazwa: String,
    pub cuda: Vec<PanstwoCud>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Parkowany {
    pub id: String,
    pub nazwa: String,
    #[serde(rename = "nazwaAlt")]
    pub nazwa_alt: Option<String>,
    pub dostep: String,
    pub cywilizacje: Vec<String>,
    #[serde(rename = "techUnlock")]
    pub tech_unlock: Vec<String>,
    #[serde(rename = "wymagaTerenu")]
    pub wymaga_terenu: Vec<String>,
    #[serde(rename = "epokaDocelowa")]
    pub epoka_docelowa: i64,
    #[serde(rename = "epokaDocelowaOpis")]
    pub epoka_docelowa_opis: String,
    #[serde(rename = "maxNaSwiecie")]
    pub max_na_swiecie: i64,
    pub aktywne: bool,
    pub uwagi: String,
}

// ---------------------------------------------------------------------------
// tech.json — obiekt: drzewko_model, _drzewko_model_opis, tempo_gry, technologie
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct TechFile {
    pub drzewko_model: String,
    #[serde(rename = "_drzewko_model_opis")]
    pub drzewko_model_opis: String,
    pub tempo_gry: TempoGry,
    pub technologie: Vec<Technologia>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct TempoGry {
    pub szybka: i64,
    pub standardowa: i64,
    pub dluga: i64,
    #[serde(rename = "_opis")]
    pub opis: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Technologia {
    #[serde(rename = "Technologia")]
    pub technologia: String,
    #[serde(rename = "Epoka")]
    pub epoka: String,
    #[serde(rename = "Poziom")]
    pub poziom: i64,
    #[serde(rename = "Dostęp do surowca.")]
    pub dostep_do_surowca: Option<String>,
    #[serde(rename = "wymagany budynek")]
    pub wymagany_budynek: Option<String>,
    #[serde(rename = "Wymaga (prereq)")]
    pub wymaga_prereq: String,
    #[serde(rename = "Odblokowuje surowiec.")]
    pub odblokowuje_surowiec: Option<String>,
    #[serde(rename = "Odblokowuje budynek")]
    pub odblokowuje_budynek: Option<String>,
    #[serde(rename = "Koszt nauki")]
    pub koszt_nauki: i64,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
    #[serde(rename = "Odblokowuje ulepszenie terenu")]
    pub odblokowuje_ulepszenie_terenu: Option<String>,
    #[serde(rename = "Historia")]
    pub historia: String,
    #[serde(rename = "awansDoEpoki")]
    pub awans_do_epoki: Option<i64>,
    #[serde(rename = "wymagane ulepszenie")]
    pub wymagane_ulepszenie: Option<String>,
}
