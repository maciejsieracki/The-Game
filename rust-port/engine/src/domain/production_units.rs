//! REPIN-EKONOMIA-B2 (pin webu 91dc998a): odpowiedniki z `gra/src/game/production.ts`
//! dodane w hunkach 3 (`epochNumber` / `newestAvailableSameTypeUnit`, web:190-226).
//!
//! Zalozenia (ZALOZENIE, do weryfikacji przez Evaluatora):
//! * web operuje na obiektach `UnitDef`; Rust przyjmuje plaski widok `UnitRow` z polami
//!   `Jednostka`, `Typ`, `Epoka` (`None` = pole brakujace albo `null`).
//! * zwracany jest indeks w `units` zamiast obiektu (ten sam wiersz, bez kopiowania).
//! * web `Set` kandydatow i porownanie `Jednostka` sa dokladne (bez trim/normalizacji).

use crate::domain::civ_matrix::js_compat::js_trim;

/// Plaski widok wiersza jednostki (pola uzywane przez web `newestAvailableSameTypeUnit`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitRow<'a> {
    /// web `Jednostka`.
    pub jednostka: &'a str,
    /// web `Typ` (`None` = brak; web traktuje jako pusty napis).
    pub typ: Option<&'a str>,
    /// web `Epoka` (`None` = brak / `null`).
    pub epoka: Option<&'a str>,
}

/// web `EPOCH_BY_NAME` + `epochNumber` (production.ts:190-205).
/// Brak / nieznana nazwa epoki = 1 (najwczesniejsza). Klucze ASCII i z diakrytykami.
pub fn epoch_number(epoka: Option<&str>) -> u32 {
    epoka
        .and_then(|e| EPOCH_BY_NAME.iter().find(|(name, _)| *name == e))
        .map_or(1, |(_, n)| *n)
}

/// web `newestAvailableSameTypeUnit` (production.ts:210-226).
///
/// Zwraca indeks w `units` najnowszej epoki (ściśle nowszej niz bieżaca) o tym samym `Typ`
/// (po `trim`), ktorej nazwa jest w `candidate_names`. Remis: wygrywa pierwszy w kolejnosci
/// `units`. Gdy bieżąca jednostka nie istnieje albo ma pusty `Typ` - `None`.
pub fn newest_available_same_type_unit(
    current_unit_name: &str,
    candidate_names: &[&str],
    units: &[UnitRow<'_>],
) -> Option<usize> {
    let current_idx = units
        .iter()
        .position(|u| u.jednostka == current_unit_name)?;
    let current = units[current_idx];
    let current_typ = js_trim(current.typ.unwrap_or(""));
    if current_typ.is_empty() {
        return None;
    }
    let current_epoch = epoch_number(current.epoka);
    let mut best: Option<usize> = None;
    for (idx, unit) in units.iter().enumerate() {
        if !candidate_names.contains(&unit.jednostka) {
            continue;
        }
        if js_trim(unit.typ.unwrap_or("")) != current_typ {
            continue;
        }
        let epoch = epoch_number(unit.epoka);
        if epoch <= current_epoch {
            continue;
        }
        match best {
            None => best = Some(idx),
            Some(b) if epoch > epoch_number(units[b].epoka) => best = Some(idx),
            Some(_) => {}
        }
    }
    best
}

// ---------------------------------------------------------------------------
// P6.8A-P1 (pin webu 91dc998a): odpowiedniki z `gra/src/game/building-upgrades.ts`
// bez zaleznosci od danych (`miasto-params.json`, `unit-building-bonuses`).
// Zalozenia (ZALOZENIE, Operator R1):
// * `buildingStructuralDefenseBonusPercent` dostaje wartosc procentowa jako argument
//   (web czyta ja z `miasto-params.json`); mapowanie klucza parametru jest tu.
// * `buildingStatSummaryLines` / `cumulativeMnoznikForBuildingId` NIE sa w tej partii
//   (zaleza od `unit-building-bonuses`) -> NASTEPNA-PARTIA.
// * web `Map` z duplikatami id: ostatni wpis wygrywa (`upgrade_chain_steps`);
//   `Array.find` (prev w `upgrade_production_display_name`): pierwszy wpis wygrywa.
// * Cykl w `upgradeFrom` web zapetliłby sie w nieskonczonosc; Rust przerywa po
//   odwiedzeniu wezla (ZALOZENIE: brak cykli w danych, guard jest bezpieczenstwem).
// ---------------------------------------------------------------------------

/// web `BuildingUpgradeLite` (pola uzywane przez helpery P1).
#[derive(Debug, Clone, PartialEq)]
pub struct BuildingUpgradeLite {
    pub id: String,
    pub nazwa: String,
    /// web `upgradeFrom` (`None` = brak pola / `undefined`).
    pub upgrade_from: Option<String>,
    /// web `suppressed` (`None` = brak pola; web traktuje jak `false`).
    pub suppressed: Option<bool>,
}

/// web `isBuildingSuppressedFromProduction`: wylacznie `suppressed === true`.
pub fn is_building_suppressed_from_production(building: &BuildingUpgradeLite) -> bool {
    building.suppressed == Some(true)
}

/// web `upgradeChainSteps`: lancuch [najstarszy ... aktualny].
pub fn upgrade_chain_steps<'a>(
    building_id: &str,
    buildings: &'a [BuildingUpgradeLite],
) -> Vec<&'a BuildingUpgradeLite> {
    // web `new Map(buildings.map(b => [b.id, b]))`: ostatni duplikat wygrywa.
    let by_id = |id: &str| -> Option<&'a BuildingUpgradeLite> {
        buildings.iter().rev().find(|b| b.id == id)
    };
    let mut chain: Vec<&'a BuildingUpgradeLite> = Vec::new();
    let mut cur = by_id(building_id);
    while let Some(node) = cur {
        if chain.iter().any(|c| std::ptr::eq(*c, node)) {
            break; // guard: cykl (patrz zalozenia)
        }
        chain.insert(0, node);
        let from = js_trim(node.upgrade_from.as_deref().unwrap_or(""));
        cur = if from.is_empty() { None } else { by_id(from) };
    }
    chain
}

/// web `upgradeProductionDisplayName` (UPG-PROD A).
pub fn upgrade_production_display_name(
    target: &BuildingUpgradeLite,
    buildings: &[BuildingUpgradeLite],
) -> String {
    let from = js_trim(target.upgrade_from.as_deref().unwrap_or(""));
    if from.is_empty() {
        return target.nazwa.clone();
    }
    // web `buildings.find` -> pierwszy wpis.
    let prev_name = buildings
        .iter()
        .find(|b| b.id == from)
        .map(|b| b.nazwa.as_str())
        .unwrap_or(from);
    format!("Rozbuduj {} → {}", prev_name, target.nazwa)
}

/// web `upgradeCompositionLines` (UPG-BONUS A+C).
pub fn upgrade_composition_lines(
    building_id: &str,
    buildings: &[BuildingUpgradeLite],
) -> Vec<String> {
    let chain = upgrade_chain_steps(building_id, buildings);
    if chain.len() <= 1 {
        return Vec::new();
    }
    let names: Vec<&str> = chain.iter().map(|c| c.nazwa.as_str()).collect();
    vec![
        format!("Łańcuch: {}", names.join(" → ")),
        "Bonusy w silniku = suma poprzednich poziomów (zapisane w JSON tego budynku).".to_string(),
    ]
}

/// web `cityHasBibliotekaLine`: biblioteka lub akademia.
pub fn city_has_biblioteka_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"biblioteka") || built_ids.contains(&"akademia")
}

/// web `cityHasAmfiteatrLine`: teatr lub akademia.
pub fn city_has_amfiteatr_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"teatr") || built_ids.contains(&"akademia")
}

/// web `cityHasMurLine`: mury, fort lub palisada.
pub fn city_has_mur_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"mury") || built_ids.contains(&"fort") || built_ids.contains(&"palisada")
}

/// web `STRUCTURAL_DEFENSE_PARAM_KEY[buildingId]` (klucz parametru w `miasto-params.json`).
pub fn structural_defense_param_key(building_id: &str) -> Option<&'static str> {
    match building_id {
        "palisada" => Some("bonus_obrona_palisada_proc"),
        "mury" => Some("bonus_obrona_mur_proc"),
        "fort" => Some("bonus_obrona_cytadela_proc"),
        "baszta" => Some("bonus_obrona_baszta_proc"),
        _ => None,
    }
}

/// web `buildingStructuralDefenseBonusPercent`: wartosc > 0, inaczej `None`.
/// `raw_value` = `miasto-params[key].wartosc` (`None` = brak wpisu / nie-liczba).
pub fn building_structural_defense_bonus_percent(
    building_id: &str,
    raw_value: Option<f64>,
) -> Option<f64> {
    structural_defense_param_key(building_id)?;
    match raw_value {
        Some(v) if v > 0.0 => Some(v),
        _ => None,
    }
}

/// web `buildingStructuralDefenseBonusLine` (etykieta UI, pelna forma z jednostka).
pub fn building_structural_defense_bonus_line(
    building_id: &str,
    raw_value: Option<f64>,
) -> Option<String> {
    let proc = building_structural_defense_bonus_percent(building_id, raw_value)?;
    Some(match building_id {
        "palisada" => {
            format!("Obrona (jednostki broniące miasta) +{proc}% — zastąpione przez Mury kamienne")
        }
        "mury" => {
            format!("Obrona (jednostki broniące miasta) +{proc}% — zastępuje Palisadę drewnianą")
        }
        "fort" | "baszta" => format!(
            "Obrona (jednostki broniące miasta) +{proc}% dodatkowo (wymaga Murów w mieście)"
        ),
        _ => format!("Obrona (jednostki broniące miasta) +{proc}%"),
    })
}

/// web `cityHasPalacLine`: palac / palac_ii / palac_iii.
pub fn city_has_palac_line(built_ids: &[&str]) -> bool {
    built_ids.contains(&"palac")
        || built_ids.contains(&"palac_ii")
        || built_ids.contains(&"palac_iii")
}

/// web `cityPalacTier`: najwyzszy tier Palacu w miescie, `None` = brak.
pub fn city_palac_tier(built_ids: &[&str]) -> Option<u8> {
    if built_ids.contains(&"palac_iii") {
        Some(3)
    } else if built_ids.contains(&"palac_ii") {
        Some(2)
    } else if built_ids.contains(&"palac") {
        Some(1)
    } else {
        None
    }
}

/// web `BUILDING_GROUP_ORDER` (kolejnosc wyswietlania).
pub const BUILDING_GROUP_ORDER: [&str; 8] = [
    "Prawo i administracja",
    "Wojsko i obrona",
    "Handel i pieniądz",
    "Nauka i kultura",
    "Wiara",
    "Zdrowie",
    "Produkcja surowców",
    "Żywność",
];

/// web `BUILDING_GROUP_FALLBACK`.
pub const BUILDING_GROUP_FALLBACK: &str = "Inne";

/// web `BuildingGroupLite` (`grupa`: `None` = brak / `null`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingGroupLite {
    pub id: String,
    pub grupa: Option<String>,
}

/// web `BuildingGroupBucket`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingGroupBucket {
    pub grupa: String,
    pub ids: Vec<String>,
}

/// web `groupBuiltBuildingIds`: osiem grup zawsze obecnych (kolejnosc `BUILDING_GROUP_ORDER`),
/// nieznane grupy / `Inne` dopisywane w kolejnosci pierwszego wystapienia (jak JS `Map`).
pub fn group_built_building_ids(
    built_ids: &[&str],
    buildings: &[BuildingGroupLite],
) -> Vec<BuildingGroupBucket> {
    let mut buckets: Vec<BuildingGroupBucket> = BUILDING_GROUP_ORDER
        .iter()
        .map(|g| BuildingGroupBucket {
            grupa: (*g).to_string(),
            ids: Vec::new(),
        })
        .collect();
    for id in built_ids {
        // web `byId` (Map): ostatni duplikat wygrywa.
        let raw = buildings
            .iter()
            .rev()
            .find(|b| b.id == *id)
            .and_then(|b| b.grupa.as_deref());
        let trimmed = js_trim(raw.unwrap_or(""));
        let g = if trimmed.is_empty() {
            BUILDING_GROUP_FALLBACK
        } else {
            trimmed
        };
        match buckets.iter_mut().find(|b| b.grupa == g) {
            Some(b) => b.ids.push((*id).to_string()),
            None => buckets.push(BuildingGroupBucket {
                grupa: g.to_string(),
                ids: vec![(*id).to_string()],
            }),
        }
    }
    buckets
}

// ===========================================================================
// P6.8A-P1 (dokonczenie) i P6.8A-P2 (pin webu 91dc998a): production.ts 1-692.
//
// ZALOZENIA (Operator R3, do weryfikacji przez Evaluatora):
// * dane budynkow i jednostek: plaskie wiersze `BuildingCostRow` / `UnitCostRow`; pole liczbowe
//   nieobecne w JSON (web `undefined`) = NaN; pole napisowe nieobecne = None.
// * `ProductionData` = wycinek GameData (web `{ buildings, units }`).
// * `AvailabilityContext` = podzbior web (pola czytane przez funkcje kosztu i bramek P2);
//   pola dostepnosci (epoka, kolejka, budynki, bonusy mapy) naleza do availableProduction (8B).
// * `strip_diacritics`: tablica NFD dla U+00C0-U+017F wygenerowana z `String.prototype.normalize`
//   (Node 22) + usuniecie znakow U+0300-U+036F. Znaki spoza tego zakresu z rozkladem NFD
//   (np. grecki, wietnamski) NIE sa obslugiwane; dane gry (Surowiec, nazwy) sa w zakresie.
// * klucze prototypu JS (np. `constructor` w UNIT_STOCK_GATE_LABEL) nie wystepuja w danych;
//   web zwrocilby tu wadliwy napis, Rust zwraca `None`.
// ===========================================================================

use std::collections::{BTreeMap, HashSet};
use std::sync::OnceLock;

use crate::domain::building_costs::p6_7b::{
    building_era_cost_multiplier, scale_cost_by_epoch, EpochInput, PaceInput,
};
use crate::domain::building_costs::repin_b2::{
    building_work_cost_web, unit_money_cost_web, CostMarker,
};
use crate::domain::civ_matrix::js_compat::{js_math_round, js_max, js_min};
use crate::domain::recruitment::army_merge::UnitCostPace;
use crate::domain::types::Difficulty;

pub use crate::domain::building_costs::repin_b2::apply_cost_discount;

/// web `RECRUIT_UNITS_PER_TURN` (production.ts:166).
pub const RECRUIT_UNITS_PER_TURN: u32 = 1;

/// web `EPOCH_BY_NAME` (production.ts:190-197): klucze ASCII i z diakrytykami.
pub const EPOCH_BY_NAME: [(&str, u32); 6] = [
    ("Kamien", 1),
    ("Kamień", 1),
    ("Braz", 2),
    ("Brąz", 2),
    ("Zelazo", 3),
    ("Żelazo", 3),
];

/// web `ProductionKind` (`budynek` | `jednostka`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProductionKind {
    Budynek,
    Jednostka,
}

/// web `ProductionItem`. `postep` (banked, poza pozycja 0) i `is_general` sa opcjonalne jak w webie.
#[derive(Debug, Clone, PartialEq)]
pub struct ProductionItem {
    pub kind: ProductionKind,
    pub id: String,
    pub nazwa: String,
    pub koszt: f64,
    pub postep: Option<f64>,
    pub is_general: Option<bool>,
}

/// web `CityProduction` (pola P1; `wstrzymana` i `rekrutacja` naleza do 8B).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CityProduction {
    pub kolejka: Vec<ProductionItem>,
    pub postep: f64,
}

/// Wiersz budynku: pola `BuildingDef` czytane przez production.ts 1-692.
#[derive(Debug, Clone, PartialEq)]
pub struct BuildingCostRow {
    pub id: String,
    pub nazwa: String,
    /// web `kosztBudowy` (brak = NaN).
    pub koszt_budowy: f64,
    /// web `przyrostKosztu` (nie-skonczona wartosc = 0 w `itemCost`).
    pub przyrost_kosztu: f64,
    /// web `epokaWejscia` (`None` = brak).
    pub epoka_wejscia: Option<f64>,
    /// web `lokalizacja` (`None` = brak).
    pub lokalizacja: Option<String>,
}

/// Wiersz jednostki: pola `UnitDef` czytane przez production.ts 1-692.
#[derive(Debug, Clone, PartialEq)]
pub struct UnitCostRow {
    /// web `Jednostka` (klucz wyszukiwania; brak osobnego id).
    pub jednostka: String,
    /// web `Epoka` (`None` = brak / `null`).
    pub epoka: Option<String>,
    /// web `Pieniądz (koszt)` (`None` = brak / nie-liczba).
    pub pieniadz_koszt: Option<f64>,
    /// web `Super-jednostka`.
    pub super_jednostka: Option<String>,
    /// web `Rola (linia)`.
    pub rola: Option<String>,
    /// web `Surowiec`.
    pub surowiec: Option<String>,
}

/// web `ProductionData`: wycinek GameData (budynki + jednostki).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ProductionData {
    pub buildings: Vec<BuildingCostRow>,
    pub units: Vec<UnitCostRow>,
}

/// Podzbior web `AvailabilityContext` (production.ts): pola czytane przez funkcje kosztu i bramek
/// P2. Reszta (epoka, kolejka, budynki, bonusy mapy) nalezy do availableProduction (8B).
/// Domyslnie: brak stolicy/zapasu/markerow/tempa, `owner_id = 0`, trudnosc `normal` (web defaults).
#[derive(Debug, Clone, Default)]
pub struct AvailabilityContext<'a> {
    pub is_capital: Option<bool>,
    pub empire_resource_stock: Option<&'a BTreeMap<String, f64>>,
    pub cost_markers: Vec<CostMarker<'a>>,
    pub building_cost_pace: Option<PaceInput<'a>>,
    pub unit_cost_pace: Option<UnitCostPace<'a>>,
    pub owner_id: i64,
    pub difficulty: Difficulty,
}

impl<'a> AvailabilityContext<'a> {
    /// web `buildingProductionItem(id, data, level, civBonusy, buildingCostPace, ownerId, difficulty)`.
    pub fn building_item(
        &self,
        id: &str,
        data: &ProductionData,
        level: f64,
    ) -> Option<ProductionItem> {
        building_production_item(
            id,
            data,
            level,
            &self.cost_markers,
            self.building_cost_pace,
            self.owner_id,
            self.difficulty,
        )
    }

    /// web `unitProductionItem(id, data, civBonusy, kosztJednostekPace, ownerId, difficulty)`.
    pub fn unit_item(&self, id: &str, data: &ProductionData) -> Option<ProductionItem> {
        unit_production_item(
            id,
            data,
            &self.cost_markers,
            self.unit_cost_pace,
            self.owner_id,
            self.difficulty,
        )
    }
}

// ---------------------------------------------------------------------------
// P1: poziom budynku wg epoki (production.ts buildingLevelForEpoch).
// ---------------------------------------------------------------------------

/// web `Number(key)` dla kluczy `poziomTechGate`. Dziesietne literaly; reszta = NaN
/// (web: `0x..` itp. -- nieobecne w danych).
fn js_number(text: &str) -> f64 {
    let t = text.trim();
    if t.is_empty() {
        return 0.0;
    }
    if t.chars()
        .all(|c| c.is_ascii_digit() || matches!(c, '+' | '-' | '.' | 'e' | 'E'))
    {
        return t.parse::<f64>().unwrap_or(f64::NAN);
    }
    f64::NAN
}

/// Kolejnosc iteracji JS `Object.entries`: klucze-indeksy (kanoniczne liczby) rosnaco, potem reszta
/// w kolejnosci wstawienia. Ma znaczenie, gdy klucze nie sa calkowite (kolejne progi zmieniaja poziom).
fn js_object_key_order(entries: &[(String, String)]) -> Vec<(&str, &str)> {
    let canonical_index = |k: &str| -> Option<u32> {
        let n: u32 = k.parse().ok()?;
        (n.to_string() == k && n < u32::MAX).then_some(n)
    };
    let mut indexed: Vec<(u32, &str, &str)> = Vec::new();
    let mut rest: Vec<(&str, &str)> = Vec::new();
    for (k, v) in entries {
        match canonical_index(k) {
            Some(n) => indexed.push((n, k.as_str(), v.as_str())),
            None => rest.push((k.as_str(), v.as_str())),
        }
    }
    indexed.sort_by_key(|entry| entry.0);
    indexed
        .into_iter()
        .map(|(_, k, v)| (k, v))
        .chain(rest)
        .collect()
}

/// web `buildingLevelForEpoch` (production.ts:243-262). Zwraca `f64` jak web (poziom moze byc
/// ujemny po bramce progu 0). `poziom_tech_gate` = wpisy `{ "poziom": "Technologia" }` w kolejnosci
/// JS; `unlocked` = `None` jak `undefined` (web: pusty zbior).
pub fn building_level_for_epoch(
    epoka_wejscia: f64,
    city_epoch: f64,
    maks_poziom: f64,
    poziom_tech_gate: Option<&[(String, String)]>,
    unlocked: Option<&HashSet<String>>,
) -> f64 {
    let lvl = city_epoch.floor() - epoka_wejscia.floor() + 1.0;
    let cap = if maks_poziom.is_finite() && maks_poziom > 0.0 {
        maks_poziom.floor()
    } else {
        1.0
    };
    let mut level = js_max(1.0, js_min(cap, lvl));
    if let Some(gate) = poziom_tech_gate {
        let empty = HashSet::new();
        let unlocked = unlocked.unwrap_or(&empty);
        for (level_key, tech) in js_object_key_order(gate) {
            let gate_level = js_number(level_key);
            if gate_level.is_finite() && level >= gate_level && !unlocked.contains(tech) {
                level = js_min(level, gate_level - 1.0);
            }
        }
    }
    level
}

// ---------------------------------------------------------------------------
// P2: koszty (production.ts itemCost / unitCostFromDef / DEFAULT_*).
// ---------------------------------------------------------------------------

/// Dane `miasto-params.json` wbudowane w crate (web `miastoParams`).
fn miasto_params_static() -> &'static serde_json::Value {
    static PARAMS: OnceLock<serde_json::Value> = OnceLock::new();
    PARAMS.get_or_init(|| {
        serde_json::from_str(include_str!("../../data/miasto-params.json"))
            .expect("miasto-params.json")
    })
}

/// web `miastoParams[key]?.wartosc` dla podanego obiektu `miasto-params` (`None` = brak / nie-liczba).
pub fn miasto_wartosc_in(params: &serde_json::Value, key: &str) -> Option<f64> {
    params.get(key)?.get("wartosc")?.as_f64()
}

/// web `DEFAULT_UNIT_COST` = `miastoParams.jednostka_koszt_domyslny.wartosc ?? 10` (dla podanych danych).
pub fn default_unit_cost_in(params: &serde_json::Value) -> f64 {
    miasto_wartosc_in(params, "jednostka_koszt_domyslny").unwrap_or(10.0)
}

/// web `DEFAULT_UNIT_COST` z wbudowanych danych.
pub fn default_unit_cost() -> f64 {
    default_unit_cost_in(miasto_params_static())
}

/// web `DEFAULT_COST_BY_ROLE[rola]` dla podanych danych (`None` = brak wpisu roli).
/// `Wręcz` i `Wrecz` = ten sam klucz. Brak / `null` wartosci = literal fallback z web (`?? 12` itd.).
pub fn default_cost_by_role_in(params: &serde_json::Value, rola: &str) -> Option<f64> {
    let (param, fallback) = match rola {
        "Wsparcie" => ("jednostka_koszt_rola_wsparcie", 12.0),
        "Dystans" => ("jednostka_koszt_rola_dystans", 8.0),
        "Wręcz" | "Wrecz" => ("jednostka_koszt_rola_wrecz", 10.0),
        "Konnica" => ("jednostka_koszt_rola_konnica", 16.0),
        _ => return None,
    };
    Some(miasto_wartosc_in(params, param).unwrap_or(fallback))
}

/// web `DEFAULT_COST_BY_ROLE[rola]` z wbudowanych danych.
pub fn default_cost_by_role(rola: &str) -> Option<f64> {
    default_cost_by_role_in(miasto_params_static(), rola)
}

/// web `unitCostFromDef` dla podanych danych `miasto-params`: `Pieniądz (koszt)` > 0; `0` tylko dla
/// Super-jednostki; inaczej domyslny koszt roli, a gdy brak -- `DEFAULT_UNIT_COST`.
pub fn unit_cost_from_def_in(u: &UnitCostRow, params: &serde_json::Value) -> f64 {
    if let Some(raw) = u.pieniadz_koszt.filter(|v| v.is_finite()) {
        if raw > 0.0 {
            return raw;
        }
        if raw == 0.0 && u.super_jednostka.as_deref() == Some("TAK") {
            return 0.0;
        }
    }
    if let Some(by_role) = u
        .rola
        .as_deref()
        .and_then(|r| default_cost_by_role_in(params, r))
    {
        return by_role;
    }
    default_unit_cost_in(params)
}

/// web `unitCostFromDef` z wbudowanych danych.
pub fn unit_cost_from_def(u: &UnitCostRow) -> f64 {
    unit_cost_from_def_in(u, miasto_params_static())
}

/// web `findBuilding` (pierwszy wpis o tym id).
pub fn find_building<'a>(data: &'a ProductionData, id: &str) -> Option<&'a BuildingCostRow> {
    data.buildings.iter().find(|b| b.id == id)
}

/// web `findUnit` (pierwszy wpis o tej nazwie `Jednostka`).
pub fn find_unit<'a>(data: &'a ProductionData, id: &str) -> Option<&'a UnitCostRow> {
    data.units.iter().find(|u| u.jednostka == id)
}

fn epoch_input(epoka: Option<&str>) -> EpochInput {
    match epoka {
        Some(text) => EpochInput::Text(text.to_string()),
        None => EpochInput::Other,
    }
}

/// web `itemCost(kind, id, data, cityLevelOrEpoch)`. Nieznane id = 0.
pub fn item_cost(
    kind: ProductionKind,
    id: &str,
    data: &ProductionData,
    city_level_or_epoch: f64,
) -> f64 {
    match kind {
        ProductionKind::Budynek => {
            let Some(b) = find_building(data, id) else {
                return 0.0;
            };
            let level = if city_level_or_epoch.is_finite() {
                js_max(1.0, city_level_or_epoch.floor())
            } else {
                1.0
            };
            let przyrost = if b.przyrost_kosztu.is_finite() {
                b.przyrost_kosztu
            } else {
                0.0
            };
            let base = js_math_round(b.koszt_budowy + przyrost * (level - 1.0));
            js_math_round(base * building_era_cost_multiplier(b.epoka_wejscia))
        }
        ProductionKind::Jednostka => {
            let Some(u) = find_unit(data, id) else {
                return 0.0;
            };
            scale_cost_by_epoch(unit_cost_from_def(u), &epoch_input(u.epoka.as_deref()))
        }
    }
}

/// web `buildingProductionItem` (`level` domyslnie 1 po stronie wolajacego). `None` = brak id.
pub fn building_production_item(
    id: &str,
    data: &ProductionData,
    level: f64,
    markers: &[CostMarker<'_>],
    pace: Option<PaceInput<'_>>,
    owner_id: i64,
    difficulty: Difficulty,
) -> Option<ProductionItem> {
    let b = find_building(data, id)?;
    Some(ProductionItem {
        kind: ProductionKind::Budynek,
        id: b.id.clone(),
        nazwa: b.nazwa.clone(),
        koszt: building_work_cost_web(
            item_cost(ProductionKind::Budynek, &b.id, data, level),
            markers,
            pace,
            owner_id,
            difficulty,
        ),
        postep: None,
        is_general: None,
    })
}

/// web `unitProductionItem`. `None` = brak jednostki o tej nazwie.
pub fn unit_production_item(
    id: &str,
    data: &ProductionData,
    markers: &[CostMarker<'_>],
    pace: Option<UnitCostPace<'_>>,
    owner_id: i64,
    difficulty: Difficulty,
) -> Option<ProductionItem> {
    let u = find_unit(data, id)?;
    Some(ProductionItem {
        kind: ProductionKind::Jednostka,
        id: u.jednostka.clone(),
        nazwa: u.jednostka.clone(),
        koszt: unit_money_cost_web(
            item_cost(ProductionKind::Jednostka, &u.jednostka, data, 1.0),
            markers,
            pace,
            owner_id,
            difficulty,
            Some(&u.jednostka),
        ),
        postep: None,
        is_general: None,
    })
}

/// web `buildingLocationAllowed` (ADMIN-STOLICA): `stolica` tylko w stolicy, `region` tylko poza nia.
/// `is_capital = None` (web `undefined`) blokuje oba kierunki.
pub fn building_location_allowed(lokalizacja: Option<&str>, is_capital: Option<bool>) -> bool {
    match lokalizacja {
        Some("stolica") => is_capital == Some(true),
        Some("region") => is_capital == Some(false),
        _ => true,
    }
}

/// web `empireStockHas` (DOSTEP-SUROWCE-Q1): czy magazyn panstwa ma > 0 sztuk klucza.
pub fn empire_stock_has(stock: Option<&BTreeMap<String, f64>>, ascii_key: &str) -> bool {
    stock.and_then(|s| s.get(ascii_key)).copied().unwrap_or(0.0) > 0.0
}

/// web `stripDiacritics`: NFD, usuniecie U+0300-U+036F, `toLowerCase`.
/// Tablica `NFD_BASE`: znak -> pierwsza (bazowa) litera jego rozkladu kanonicznego, dla
/// znakow BMP (poza Hangul) ktorych rozklad to: baza + znaki U+0300-U+036F. Wygenerowana z
/// Node 22 `normalize("NFD")` (pominiete 177 znakow o wielu bazach lub zaczynajacych sie
/// od znaku laczacego -- poza zakresem danych gry). Posortowana wg kodu znaku.
const NFD_BASE: &[(char, char)] = &[
    ('\u{c0}', '\u{41}'),
    ('\u{c1}', '\u{41}'),
    ('\u{c2}', '\u{41}'),
    ('\u{c3}', '\u{41}'),
    ('\u{c4}', '\u{41}'),
    ('\u{c5}', '\u{41}'),
    ('\u{c7}', '\u{43}'),
    ('\u{c8}', '\u{45}'),
    ('\u{c9}', '\u{45}'),
    ('\u{ca}', '\u{45}'),
    ('\u{cb}', '\u{45}'),
    ('\u{cc}', '\u{49}'),
    ('\u{cd}', '\u{49}'),
    ('\u{ce}', '\u{49}'),
    ('\u{cf}', '\u{49}'),
    ('\u{d1}', '\u{4e}'),
    ('\u{d2}', '\u{4f}'),
    ('\u{d3}', '\u{4f}'),
    ('\u{d4}', '\u{4f}'),
    ('\u{d5}', '\u{4f}'),
    ('\u{d6}', '\u{4f}'),
    ('\u{d9}', '\u{55}'),
    ('\u{da}', '\u{55}'),
    ('\u{db}', '\u{55}'),
    ('\u{dc}', '\u{55}'),
    ('\u{dd}', '\u{59}'),
    ('\u{e0}', '\u{61}'),
    ('\u{e1}', '\u{61}'),
    ('\u{e2}', '\u{61}'),
    ('\u{e3}', '\u{61}'),
    ('\u{e4}', '\u{61}'),
    ('\u{e5}', '\u{61}'),
    ('\u{e7}', '\u{63}'),
    ('\u{e8}', '\u{65}'),
    ('\u{e9}', '\u{65}'),
    ('\u{ea}', '\u{65}'),
    ('\u{eb}', '\u{65}'),
    ('\u{ec}', '\u{69}'),
    ('\u{ed}', '\u{69}'),
    ('\u{ee}', '\u{69}'),
    ('\u{ef}', '\u{69}'),
    ('\u{f1}', '\u{6e}'),
    ('\u{f2}', '\u{6f}'),
    ('\u{f3}', '\u{6f}'),
    ('\u{f4}', '\u{6f}'),
    ('\u{f5}', '\u{6f}'),
    ('\u{f6}', '\u{6f}'),
    ('\u{f9}', '\u{75}'),
    ('\u{fa}', '\u{75}'),
    ('\u{fb}', '\u{75}'),
    ('\u{fc}', '\u{75}'),
    ('\u{fd}', '\u{79}'),
    ('\u{ff}', '\u{79}'),
    ('\u{100}', '\u{41}'),
    ('\u{101}', '\u{61}'),
    ('\u{102}', '\u{41}'),
    ('\u{103}', '\u{61}'),
    ('\u{104}', '\u{41}'),
    ('\u{105}', '\u{61}'),
    ('\u{106}', '\u{43}'),
    ('\u{107}', '\u{63}'),
    ('\u{108}', '\u{43}'),
    ('\u{109}', '\u{63}'),
    ('\u{10a}', '\u{43}'),
    ('\u{10b}', '\u{63}'),
    ('\u{10c}', '\u{43}'),
    ('\u{10d}', '\u{63}'),
    ('\u{10e}', '\u{44}'),
    ('\u{10f}', '\u{64}'),
    ('\u{112}', '\u{45}'),
    ('\u{113}', '\u{65}'),
    ('\u{114}', '\u{45}'),
    ('\u{115}', '\u{65}'),
    ('\u{116}', '\u{45}'),
    ('\u{117}', '\u{65}'),
    ('\u{118}', '\u{45}'),
    ('\u{119}', '\u{65}'),
    ('\u{11a}', '\u{45}'),
    ('\u{11b}', '\u{65}'),
    ('\u{11c}', '\u{47}'),
    ('\u{11d}', '\u{67}'),
    ('\u{11e}', '\u{47}'),
    ('\u{11f}', '\u{67}'),
    ('\u{120}', '\u{47}'),
    ('\u{121}', '\u{67}'),
    ('\u{122}', '\u{47}'),
    ('\u{123}', '\u{67}'),
    ('\u{124}', '\u{48}'),
    ('\u{125}', '\u{68}'),
    ('\u{128}', '\u{49}'),
    ('\u{129}', '\u{69}'),
    ('\u{12a}', '\u{49}'),
    ('\u{12b}', '\u{69}'),
    ('\u{12c}', '\u{49}'),
    ('\u{12d}', '\u{69}'),
    ('\u{12e}', '\u{49}'),
    ('\u{12f}', '\u{69}'),
    ('\u{130}', '\u{49}'),
    ('\u{134}', '\u{4a}'),
    ('\u{135}', '\u{6a}'),
    ('\u{136}', '\u{4b}'),
    ('\u{137}', '\u{6b}'),
    ('\u{139}', '\u{4c}'),
    ('\u{13a}', '\u{6c}'),
    ('\u{13b}', '\u{4c}'),
    ('\u{13c}', '\u{6c}'),
    ('\u{13d}', '\u{4c}'),
    ('\u{13e}', '\u{6c}'),
    ('\u{143}', '\u{4e}'),
    ('\u{144}', '\u{6e}'),
    ('\u{145}', '\u{4e}'),
    ('\u{146}', '\u{6e}'),
    ('\u{147}', '\u{4e}'),
    ('\u{148}', '\u{6e}'),
    ('\u{14c}', '\u{4f}'),
    ('\u{14d}', '\u{6f}'),
    ('\u{14e}', '\u{4f}'),
    ('\u{14f}', '\u{6f}'),
    ('\u{150}', '\u{4f}'),
    ('\u{151}', '\u{6f}'),
    ('\u{154}', '\u{52}'),
    ('\u{155}', '\u{72}'),
    ('\u{156}', '\u{52}'),
    ('\u{157}', '\u{72}'),
    ('\u{158}', '\u{52}'),
    ('\u{159}', '\u{72}'),
    ('\u{15a}', '\u{53}'),
    ('\u{15b}', '\u{73}'),
    ('\u{15c}', '\u{53}'),
    ('\u{15d}', '\u{73}'),
    ('\u{15e}', '\u{53}'),
    ('\u{15f}', '\u{73}'),
    ('\u{160}', '\u{53}'),
    ('\u{161}', '\u{73}'),
    ('\u{162}', '\u{54}'),
    ('\u{163}', '\u{74}'),
    ('\u{164}', '\u{54}'),
    ('\u{165}', '\u{74}'),
    ('\u{168}', '\u{55}'),
    ('\u{169}', '\u{75}'),
    ('\u{16a}', '\u{55}'),
    ('\u{16b}', '\u{75}'),
    ('\u{16c}', '\u{55}'),
    ('\u{16d}', '\u{75}'),
    ('\u{16e}', '\u{55}'),
    ('\u{16f}', '\u{75}'),
    ('\u{170}', '\u{55}'),
    ('\u{171}', '\u{75}'),
    ('\u{172}', '\u{55}'),
    ('\u{173}', '\u{75}'),
    ('\u{174}', '\u{57}'),
    ('\u{175}', '\u{77}'),
    ('\u{176}', '\u{59}'),
    ('\u{177}', '\u{79}'),
    ('\u{178}', '\u{59}'),
    ('\u{179}', '\u{5a}'),
    ('\u{17a}', '\u{7a}'),
    ('\u{17b}', '\u{5a}'),
    ('\u{17c}', '\u{7a}'),
    ('\u{17d}', '\u{5a}'),
    ('\u{17e}', '\u{7a}'),
    ('\u{1a0}', '\u{4f}'),
    ('\u{1a1}', '\u{6f}'),
    ('\u{1af}', '\u{55}'),
    ('\u{1b0}', '\u{75}'),
    ('\u{1cd}', '\u{41}'),
    ('\u{1ce}', '\u{61}'),
    ('\u{1cf}', '\u{49}'),
    ('\u{1d0}', '\u{69}'),
    ('\u{1d1}', '\u{4f}'),
    ('\u{1d2}', '\u{6f}'),
    ('\u{1d3}', '\u{55}'),
    ('\u{1d4}', '\u{75}'),
    ('\u{1d5}', '\u{55}'),
    ('\u{1d6}', '\u{75}'),
    ('\u{1d7}', '\u{55}'),
    ('\u{1d8}', '\u{75}'),
    ('\u{1d9}', '\u{55}'),
    ('\u{1da}', '\u{75}'),
    ('\u{1db}', '\u{55}'),
    ('\u{1dc}', '\u{75}'),
    ('\u{1de}', '\u{41}'),
    ('\u{1df}', '\u{61}'),
    ('\u{1e0}', '\u{41}'),
    ('\u{1e1}', '\u{61}'),
    ('\u{1e2}', '\u{c6}'),
    ('\u{1e3}', '\u{e6}'),
    ('\u{1e6}', '\u{47}'),
    ('\u{1e7}', '\u{67}'),
    ('\u{1e8}', '\u{4b}'),
    ('\u{1e9}', '\u{6b}'),
    ('\u{1ea}', '\u{4f}'),
    ('\u{1eb}', '\u{6f}'),
    ('\u{1ec}', '\u{4f}'),
    ('\u{1ed}', '\u{6f}'),
    ('\u{1ee}', '\u{1b7}'),
    ('\u{1ef}', '\u{292}'),
    ('\u{1f0}', '\u{6a}'),
    ('\u{1f4}', '\u{47}'),
    ('\u{1f5}', '\u{67}'),
    ('\u{1f8}', '\u{4e}'),
    ('\u{1f9}', '\u{6e}'),
    ('\u{1fa}', '\u{41}'),
    ('\u{1fb}', '\u{61}'),
    ('\u{1fc}', '\u{c6}'),
    ('\u{1fd}', '\u{e6}'),
    ('\u{1fe}', '\u{d8}'),
    ('\u{1ff}', '\u{f8}'),
    ('\u{200}', '\u{41}'),
    ('\u{201}', '\u{61}'),
    ('\u{202}', '\u{41}'),
    ('\u{203}', '\u{61}'),
    ('\u{204}', '\u{45}'),
    ('\u{205}', '\u{65}'),
    ('\u{206}', '\u{45}'),
    ('\u{207}', '\u{65}'),
    ('\u{208}', '\u{49}'),
    ('\u{209}', '\u{69}'),
    ('\u{20a}', '\u{49}'),
    ('\u{20b}', '\u{69}'),
    ('\u{20c}', '\u{4f}'),
    ('\u{20d}', '\u{6f}'),
    ('\u{20e}', '\u{4f}'),
    ('\u{20f}', '\u{6f}'),
    ('\u{210}', '\u{52}'),
    ('\u{211}', '\u{72}'),
    ('\u{212}', '\u{52}'),
    ('\u{213}', '\u{72}'),
    ('\u{214}', '\u{55}'),
    ('\u{215}', '\u{75}'),
    ('\u{216}', '\u{55}'),
    ('\u{217}', '\u{75}'),
    ('\u{218}', '\u{53}'),
    ('\u{219}', '\u{73}'),
    ('\u{21a}', '\u{54}'),
    ('\u{21b}', '\u{74}'),
    ('\u{21e}', '\u{48}'),
    ('\u{21f}', '\u{68}'),
    ('\u{226}', '\u{41}'),
    ('\u{227}', '\u{61}'),
    ('\u{228}', '\u{45}'),
    ('\u{229}', '\u{65}'),
    ('\u{22a}', '\u{4f}'),
    ('\u{22b}', '\u{6f}'),
    ('\u{22c}', '\u{4f}'),
    ('\u{22d}', '\u{6f}'),
    ('\u{22e}', '\u{4f}'),
    ('\u{22f}', '\u{6f}'),
    ('\u{230}', '\u{4f}'),
    ('\u{231}', '\u{6f}'),
    ('\u{232}', '\u{59}'),
    ('\u{233}', '\u{79}'),
    ('\u{374}', '\u{2b9}'),
    ('\u{37e}', '\u{3b}'),
    ('\u{385}', '\u{a8}'),
    ('\u{386}', '\u{391}'),
    ('\u{387}', '\u{b7}'),
    ('\u{388}', '\u{395}'),
    ('\u{389}', '\u{397}'),
    ('\u{38a}', '\u{399}'),
    ('\u{38c}', '\u{39f}'),
    ('\u{38e}', '\u{3a5}'),
    ('\u{38f}', '\u{3a9}'),
    ('\u{390}', '\u{3b9}'),
    ('\u{3aa}', '\u{399}'),
    ('\u{3ab}', '\u{3a5}'),
    ('\u{3ac}', '\u{3b1}'),
    ('\u{3ad}', '\u{3b5}'),
    ('\u{3ae}', '\u{3b7}'),
    ('\u{3af}', '\u{3b9}'),
    ('\u{3b0}', '\u{3c5}'),
    ('\u{3ca}', '\u{3b9}'),
    ('\u{3cb}', '\u{3c5}'),
    ('\u{3cc}', '\u{3bf}'),
    ('\u{3cd}', '\u{3c5}'),
    ('\u{3ce}', '\u{3c9}'),
    ('\u{3d3}', '\u{3d2}'),
    ('\u{3d4}', '\u{3d2}'),
    ('\u{400}', '\u{415}'),
    ('\u{401}', '\u{415}'),
    ('\u{403}', '\u{413}'),
    ('\u{407}', '\u{406}'),
    ('\u{40c}', '\u{41a}'),
    ('\u{40d}', '\u{418}'),
    ('\u{40e}', '\u{423}'),
    ('\u{419}', '\u{418}'),
    ('\u{439}', '\u{438}'),
    ('\u{450}', '\u{435}'),
    ('\u{451}', '\u{435}'),
    ('\u{453}', '\u{433}'),
    ('\u{457}', '\u{456}'),
    ('\u{45c}', '\u{43a}'),
    ('\u{45d}', '\u{438}'),
    ('\u{45e}', '\u{443}'),
    ('\u{476}', '\u{474}'),
    ('\u{477}', '\u{475}'),
    ('\u{4c1}', '\u{416}'),
    ('\u{4c2}', '\u{436}'),
    ('\u{4d0}', '\u{410}'),
    ('\u{4d1}', '\u{430}'),
    ('\u{4d2}', '\u{410}'),
    ('\u{4d3}', '\u{430}'),
    ('\u{4d6}', '\u{415}'),
    ('\u{4d7}', '\u{435}'),
    ('\u{4da}', '\u{4d8}'),
    ('\u{4db}', '\u{4d9}'),
    ('\u{4dc}', '\u{416}'),
    ('\u{4dd}', '\u{436}'),
    ('\u{4de}', '\u{417}'),
    ('\u{4df}', '\u{437}'),
    ('\u{4e2}', '\u{418}'),
    ('\u{4e3}', '\u{438}'),
    ('\u{4e4}', '\u{418}'),
    ('\u{4e5}', '\u{438}'),
    ('\u{4e6}', '\u{41e}'),
    ('\u{4e7}', '\u{43e}'),
    ('\u{4ea}', '\u{4e8}'),
    ('\u{4eb}', '\u{4e9}'),
    ('\u{4ec}', '\u{42d}'),
    ('\u{4ed}', '\u{44d}'),
    ('\u{4ee}', '\u{423}'),
    ('\u{4ef}', '\u{443}'),
    ('\u{4f0}', '\u{423}'),
    ('\u{4f1}', '\u{443}'),
    ('\u{4f2}', '\u{423}'),
    ('\u{4f3}', '\u{443}'),
    ('\u{4f4}', '\u{427}'),
    ('\u{4f5}', '\u{447}'),
    ('\u{4f8}', '\u{42b}'),
    ('\u{4f9}', '\u{44b}'),
    ('\u{1e00}', '\u{41}'),
    ('\u{1e01}', '\u{61}'),
    ('\u{1e02}', '\u{42}'),
    ('\u{1e03}', '\u{62}'),
    ('\u{1e04}', '\u{42}'),
    ('\u{1e05}', '\u{62}'),
    ('\u{1e06}', '\u{42}'),
    ('\u{1e07}', '\u{62}'),
    ('\u{1e08}', '\u{43}'),
    ('\u{1e09}', '\u{63}'),
    ('\u{1e0a}', '\u{44}'),
    ('\u{1e0b}', '\u{64}'),
    ('\u{1e0c}', '\u{44}'),
    ('\u{1e0d}', '\u{64}'),
    ('\u{1e0e}', '\u{44}'),
    ('\u{1e0f}', '\u{64}'),
    ('\u{1e10}', '\u{44}'),
    ('\u{1e11}', '\u{64}'),
    ('\u{1e12}', '\u{44}'),
    ('\u{1e13}', '\u{64}'),
    ('\u{1e14}', '\u{45}'),
    ('\u{1e15}', '\u{65}'),
    ('\u{1e16}', '\u{45}'),
    ('\u{1e17}', '\u{65}'),
    ('\u{1e18}', '\u{45}'),
    ('\u{1e19}', '\u{65}'),
    ('\u{1e1a}', '\u{45}'),
    ('\u{1e1b}', '\u{65}'),
    ('\u{1e1c}', '\u{45}'),
    ('\u{1e1d}', '\u{65}'),
    ('\u{1e1e}', '\u{46}'),
    ('\u{1e1f}', '\u{66}'),
    ('\u{1e20}', '\u{47}'),
    ('\u{1e21}', '\u{67}'),
    ('\u{1e22}', '\u{48}'),
    ('\u{1e23}', '\u{68}'),
    ('\u{1e24}', '\u{48}'),
    ('\u{1e25}', '\u{68}'),
    ('\u{1e26}', '\u{48}'),
    ('\u{1e27}', '\u{68}'),
    ('\u{1e28}', '\u{48}'),
    ('\u{1e29}', '\u{68}'),
    ('\u{1e2a}', '\u{48}'),
    ('\u{1e2b}', '\u{68}'),
    ('\u{1e2c}', '\u{49}'),
    ('\u{1e2d}', '\u{69}'),
    ('\u{1e2e}', '\u{49}'),
    ('\u{1e2f}', '\u{69}'),
    ('\u{1e30}', '\u{4b}'),
    ('\u{1e31}', '\u{6b}'),
    ('\u{1e32}', '\u{4b}'),
    ('\u{1e33}', '\u{6b}'),
    ('\u{1e34}', '\u{4b}'),
    ('\u{1e35}', '\u{6b}'),
    ('\u{1e36}', '\u{4c}'),
    ('\u{1e37}', '\u{6c}'),
    ('\u{1e38}', '\u{4c}'),
    ('\u{1e39}', '\u{6c}'),
    ('\u{1e3a}', '\u{4c}'),
    ('\u{1e3b}', '\u{6c}'),
    ('\u{1e3c}', '\u{4c}'),
    ('\u{1e3d}', '\u{6c}'),
    ('\u{1e3e}', '\u{4d}'),
    ('\u{1e3f}', '\u{6d}'),
    ('\u{1e40}', '\u{4d}'),
    ('\u{1e41}', '\u{6d}'),
    ('\u{1e42}', '\u{4d}'),
    ('\u{1e43}', '\u{6d}'),
    ('\u{1e44}', '\u{4e}'),
    ('\u{1e45}', '\u{6e}'),
    ('\u{1e46}', '\u{4e}'),
    ('\u{1e47}', '\u{6e}'),
    ('\u{1e48}', '\u{4e}'),
    ('\u{1e49}', '\u{6e}'),
    ('\u{1e4a}', '\u{4e}'),
    ('\u{1e4b}', '\u{6e}'),
    ('\u{1e4c}', '\u{4f}'),
    ('\u{1e4d}', '\u{6f}'),
    ('\u{1e4e}', '\u{4f}'),
    ('\u{1e4f}', '\u{6f}'),
    ('\u{1e50}', '\u{4f}'),
    ('\u{1e51}', '\u{6f}'),
    ('\u{1e52}', '\u{4f}'),
    ('\u{1e53}', '\u{6f}'),
    ('\u{1e54}', '\u{50}'),
    ('\u{1e55}', '\u{70}'),
    ('\u{1e56}', '\u{50}'),
    ('\u{1e57}', '\u{70}'),
    ('\u{1e58}', '\u{52}'),
    ('\u{1e59}', '\u{72}'),
    ('\u{1e5a}', '\u{52}'),
    ('\u{1e5b}', '\u{72}'),
    ('\u{1e5c}', '\u{52}'),
    ('\u{1e5d}', '\u{72}'),
    ('\u{1e5e}', '\u{52}'),
    ('\u{1e5f}', '\u{72}'),
    ('\u{1e60}', '\u{53}'),
    ('\u{1e61}', '\u{73}'),
    ('\u{1e62}', '\u{53}'),
    ('\u{1e63}', '\u{73}'),
    ('\u{1e64}', '\u{53}'),
    ('\u{1e65}', '\u{73}'),
    ('\u{1e66}', '\u{53}'),
    ('\u{1e67}', '\u{73}'),
    ('\u{1e68}', '\u{53}'),
    ('\u{1e69}', '\u{73}'),
    ('\u{1e6a}', '\u{54}'),
    ('\u{1e6b}', '\u{74}'),
    ('\u{1e6c}', '\u{54}'),
    ('\u{1e6d}', '\u{74}'),
    ('\u{1e6e}', '\u{54}'),
    ('\u{1e6f}', '\u{74}'),
    ('\u{1e70}', '\u{54}'),
    ('\u{1e71}', '\u{74}'),
    ('\u{1e72}', '\u{55}'),
    ('\u{1e73}', '\u{75}'),
    ('\u{1e74}', '\u{55}'),
    ('\u{1e75}', '\u{75}'),
    ('\u{1e76}', '\u{55}'),
    ('\u{1e77}', '\u{75}'),
    ('\u{1e78}', '\u{55}'),
    ('\u{1e79}', '\u{75}'),
    ('\u{1e7a}', '\u{55}'),
    ('\u{1e7b}', '\u{75}'),
    ('\u{1e7c}', '\u{56}'),
    ('\u{1e7d}', '\u{76}'),
    ('\u{1e7e}', '\u{56}'),
    ('\u{1e7f}', '\u{76}'),
    ('\u{1e80}', '\u{57}'),
    ('\u{1e81}', '\u{77}'),
    ('\u{1e82}', '\u{57}'),
    ('\u{1e83}', '\u{77}'),
    ('\u{1e84}', '\u{57}'),
    ('\u{1e85}', '\u{77}'),
    ('\u{1e86}', '\u{57}'),
    ('\u{1e87}', '\u{77}'),
    ('\u{1e88}', '\u{57}'),
    ('\u{1e89}', '\u{77}'),
    ('\u{1e8a}', '\u{58}'),
    ('\u{1e8b}', '\u{78}'),
    ('\u{1e8c}', '\u{58}'),
    ('\u{1e8d}', '\u{78}'),
    ('\u{1e8e}', '\u{59}'),
    ('\u{1e8f}', '\u{79}'),
    ('\u{1e90}', '\u{5a}'),
    ('\u{1e91}', '\u{7a}'),
    ('\u{1e92}', '\u{5a}'),
    ('\u{1e93}', '\u{7a}'),
    ('\u{1e94}', '\u{5a}'),
    ('\u{1e95}', '\u{7a}'),
    ('\u{1e96}', '\u{68}'),
    ('\u{1e97}', '\u{74}'),
    ('\u{1e98}', '\u{77}'),
    ('\u{1e99}', '\u{79}'),
    ('\u{1e9b}', '\u{17f}'),
    ('\u{1ea0}', '\u{41}'),
    ('\u{1ea1}', '\u{61}'),
    ('\u{1ea2}', '\u{41}'),
    ('\u{1ea3}', '\u{61}'),
    ('\u{1ea4}', '\u{41}'),
    ('\u{1ea5}', '\u{61}'),
    ('\u{1ea6}', '\u{41}'),
    ('\u{1ea7}', '\u{61}'),
    ('\u{1ea8}', '\u{41}'),
    ('\u{1ea9}', '\u{61}'),
    ('\u{1eaa}', '\u{41}'),
    ('\u{1eab}', '\u{61}'),
    ('\u{1eac}', '\u{41}'),
    ('\u{1ead}', '\u{61}'),
    ('\u{1eae}', '\u{41}'),
    ('\u{1eaf}', '\u{61}'),
    ('\u{1eb0}', '\u{41}'),
    ('\u{1eb1}', '\u{61}'),
    ('\u{1eb2}', '\u{41}'),
    ('\u{1eb3}', '\u{61}'),
    ('\u{1eb4}', '\u{41}'),
    ('\u{1eb5}', '\u{61}'),
    ('\u{1eb6}', '\u{41}'),
    ('\u{1eb7}', '\u{61}'),
    ('\u{1eb8}', '\u{45}'),
    ('\u{1eb9}', '\u{65}'),
    ('\u{1eba}', '\u{45}'),
    ('\u{1ebb}', '\u{65}'),
    ('\u{1ebc}', '\u{45}'),
    ('\u{1ebd}', '\u{65}'),
    ('\u{1ebe}', '\u{45}'),
    ('\u{1ebf}', '\u{65}'),
    ('\u{1ec0}', '\u{45}'),
    ('\u{1ec1}', '\u{65}'),
    ('\u{1ec2}', '\u{45}'),
    ('\u{1ec3}', '\u{65}'),
    ('\u{1ec4}', '\u{45}'),
    ('\u{1ec5}', '\u{65}'),
    ('\u{1ec6}', '\u{45}'),
    ('\u{1ec7}', '\u{65}'),
    ('\u{1ec8}', '\u{49}'),
    ('\u{1ec9}', '\u{69}'),
    ('\u{1eca}', '\u{49}'),
    ('\u{1ecb}', '\u{69}'),
    ('\u{1ecc}', '\u{4f}'),
    ('\u{1ecd}', '\u{6f}'),
    ('\u{1ece}', '\u{4f}'),
    ('\u{1ecf}', '\u{6f}'),
    ('\u{1ed0}', '\u{4f}'),
    ('\u{1ed1}', '\u{6f}'),
    ('\u{1ed2}', '\u{4f}'),
    ('\u{1ed3}', '\u{6f}'),
    ('\u{1ed4}', '\u{4f}'),
    ('\u{1ed5}', '\u{6f}'),
    ('\u{1ed6}', '\u{4f}'),
    ('\u{1ed7}', '\u{6f}'),
    ('\u{1ed8}', '\u{4f}'),
    ('\u{1ed9}', '\u{6f}'),
    ('\u{1eda}', '\u{4f}'),
    ('\u{1edb}', '\u{6f}'),
    ('\u{1edc}', '\u{4f}'),
    ('\u{1edd}', '\u{6f}'),
    ('\u{1ede}', '\u{4f}'),
    ('\u{1edf}', '\u{6f}'),
    ('\u{1ee0}', '\u{4f}'),
    ('\u{1ee1}', '\u{6f}'),
    ('\u{1ee2}', '\u{4f}'),
    ('\u{1ee3}', '\u{6f}'),
    ('\u{1ee4}', '\u{55}'),
    ('\u{1ee5}', '\u{75}'),
    ('\u{1ee6}', '\u{55}'),
    ('\u{1ee7}', '\u{75}'),
    ('\u{1ee8}', '\u{55}'),
    ('\u{1ee9}', '\u{75}'),
    ('\u{1eea}', '\u{55}'),
    ('\u{1eeb}', '\u{75}'),
    ('\u{1eec}', '\u{55}'),
    ('\u{1eed}', '\u{75}'),
    ('\u{1eee}', '\u{55}'),
    ('\u{1eef}', '\u{75}'),
    ('\u{1ef0}', '\u{55}'),
    ('\u{1ef1}', '\u{75}'),
    ('\u{1ef2}', '\u{59}'),
    ('\u{1ef3}', '\u{79}'),
    ('\u{1ef4}', '\u{59}'),
    ('\u{1ef5}', '\u{79}'),
    ('\u{1ef6}', '\u{59}'),
    ('\u{1ef7}', '\u{79}'),
    ('\u{1ef8}', '\u{59}'),
    ('\u{1ef9}', '\u{79}'),
    ('\u{1f00}', '\u{3b1}'),
    ('\u{1f01}', '\u{3b1}'),
    ('\u{1f02}', '\u{3b1}'),
    ('\u{1f03}', '\u{3b1}'),
    ('\u{1f04}', '\u{3b1}'),
    ('\u{1f05}', '\u{3b1}'),
    ('\u{1f06}', '\u{3b1}'),
    ('\u{1f07}', '\u{3b1}'),
    ('\u{1f08}', '\u{391}'),
    ('\u{1f09}', '\u{391}'),
    ('\u{1f0a}', '\u{391}'),
    ('\u{1f0b}', '\u{391}'),
    ('\u{1f0c}', '\u{391}'),
    ('\u{1f0d}', '\u{391}'),
    ('\u{1f0e}', '\u{391}'),
    ('\u{1f0f}', '\u{391}'),
    ('\u{1f10}', '\u{3b5}'),
    ('\u{1f11}', '\u{3b5}'),
    ('\u{1f12}', '\u{3b5}'),
    ('\u{1f13}', '\u{3b5}'),
    ('\u{1f14}', '\u{3b5}'),
    ('\u{1f15}', '\u{3b5}'),
    ('\u{1f18}', '\u{395}'),
    ('\u{1f19}', '\u{395}'),
    ('\u{1f1a}', '\u{395}'),
    ('\u{1f1b}', '\u{395}'),
    ('\u{1f1c}', '\u{395}'),
    ('\u{1f1d}', '\u{395}'),
    ('\u{1f20}', '\u{3b7}'),
    ('\u{1f21}', '\u{3b7}'),
    ('\u{1f22}', '\u{3b7}'),
    ('\u{1f23}', '\u{3b7}'),
    ('\u{1f24}', '\u{3b7}'),
    ('\u{1f25}', '\u{3b7}'),
    ('\u{1f26}', '\u{3b7}'),
    ('\u{1f27}', '\u{3b7}'),
    ('\u{1f28}', '\u{397}'),
    ('\u{1f29}', '\u{397}'),
    ('\u{1f2a}', '\u{397}'),
    ('\u{1f2b}', '\u{397}'),
    ('\u{1f2c}', '\u{397}'),
    ('\u{1f2d}', '\u{397}'),
    ('\u{1f2e}', '\u{397}'),
    ('\u{1f2f}', '\u{397}'),
    ('\u{1f30}', '\u{3b9}'),
    ('\u{1f31}', '\u{3b9}'),
    ('\u{1f32}', '\u{3b9}'),
    ('\u{1f33}', '\u{3b9}'),
    ('\u{1f34}', '\u{3b9}'),
    ('\u{1f35}', '\u{3b9}'),
    ('\u{1f36}', '\u{3b9}'),
    ('\u{1f37}', '\u{3b9}'),
    ('\u{1f38}', '\u{399}'),
    ('\u{1f39}', '\u{399}'),
    ('\u{1f3a}', '\u{399}'),
    ('\u{1f3b}', '\u{399}'),
    ('\u{1f3c}', '\u{399}'),
    ('\u{1f3d}', '\u{399}'),
    ('\u{1f3e}', '\u{399}'),
    ('\u{1f3f}', '\u{399}'),
    ('\u{1f40}', '\u{3bf}'),
    ('\u{1f41}', '\u{3bf}'),
    ('\u{1f42}', '\u{3bf}'),
    ('\u{1f43}', '\u{3bf}'),
    ('\u{1f44}', '\u{3bf}'),
    ('\u{1f45}', '\u{3bf}'),
    ('\u{1f48}', '\u{39f}'),
    ('\u{1f49}', '\u{39f}'),
    ('\u{1f4a}', '\u{39f}'),
    ('\u{1f4b}', '\u{39f}'),
    ('\u{1f4c}', '\u{39f}'),
    ('\u{1f4d}', '\u{39f}'),
    ('\u{1f50}', '\u{3c5}'),
    ('\u{1f51}', '\u{3c5}'),
    ('\u{1f52}', '\u{3c5}'),
    ('\u{1f53}', '\u{3c5}'),
    ('\u{1f54}', '\u{3c5}'),
    ('\u{1f55}', '\u{3c5}'),
    ('\u{1f56}', '\u{3c5}'),
    ('\u{1f57}', '\u{3c5}'),
    ('\u{1f59}', '\u{3a5}'),
    ('\u{1f5b}', '\u{3a5}'),
    ('\u{1f5d}', '\u{3a5}'),
    ('\u{1f5f}', '\u{3a5}'),
    ('\u{1f60}', '\u{3c9}'),
    ('\u{1f61}', '\u{3c9}'),
    ('\u{1f62}', '\u{3c9}'),
    ('\u{1f63}', '\u{3c9}'),
    ('\u{1f64}', '\u{3c9}'),
    ('\u{1f65}', '\u{3c9}'),
    ('\u{1f66}', '\u{3c9}'),
    ('\u{1f67}', '\u{3c9}'),
    ('\u{1f68}', '\u{3a9}'),
    ('\u{1f69}', '\u{3a9}'),
    ('\u{1f6a}', '\u{3a9}'),
    ('\u{1f6b}', '\u{3a9}'),
    ('\u{1f6c}', '\u{3a9}'),
    ('\u{1f6d}', '\u{3a9}'),
    ('\u{1f6e}', '\u{3a9}'),
    ('\u{1f6f}', '\u{3a9}'),
    ('\u{1f70}', '\u{3b1}'),
    ('\u{1f71}', '\u{3b1}'),
    ('\u{1f72}', '\u{3b5}'),
    ('\u{1f73}', '\u{3b5}'),
    ('\u{1f74}', '\u{3b7}'),
    ('\u{1f75}', '\u{3b7}'),
    ('\u{1f76}', '\u{3b9}'),
    ('\u{1f77}', '\u{3b9}'),
    ('\u{1f78}', '\u{3bf}'),
    ('\u{1f79}', '\u{3bf}'),
    ('\u{1f7a}', '\u{3c5}'),
    ('\u{1f7b}', '\u{3c5}'),
    ('\u{1f7c}', '\u{3c9}'),
    ('\u{1f7d}', '\u{3c9}'),
    ('\u{1f80}', '\u{3b1}'),
    ('\u{1f81}', '\u{3b1}'),
    ('\u{1f82}', '\u{3b1}'),
    ('\u{1f83}', '\u{3b1}'),
    ('\u{1f84}', '\u{3b1}'),
    ('\u{1f85}', '\u{3b1}'),
    ('\u{1f86}', '\u{3b1}'),
    ('\u{1f87}', '\u{3b1}'),
    ('\u{1f88}', '\u{391}'),
    ('\u{1f89}', '\u{391}'),
    ('\u{1f8a}', '\u{391}'),
    ('\u{1f8b}', '\u{391}'),
    ('\u{1f8c}', '\u{391}'),
    ('\u{1f8d}', '\u{391}'),
    ('\u{1f8e}', '\u{391}'),
    ('\u{1f8f}', '\u{391}'),
    ('\u{1f90}', '\u{3b7}'),
    ('\u{1f91}', '\u{3b7}'),
    ('\u{1f92}', '\u{3b7}'),
    ('\u{1f93}', '\u{3b7}'),
    ('\u{1f94}', '\u{3b7}'),
    ('\u{1f95}', '\u{3b7}'),
    ('\u{1f96}', '\u{3b7}'),
    ('\u{1f97}', '\u{3b7}'),
    ('\u{1f98}', '\u{397}'),
    ('\u{1f99}', '\u{397}'),
    ('\u{1f9a}', '\u{397}'),
    ('\u{1f9b}', '\u{397}'),
    ('\u{1f9c}', '\u{397}'),
    ('\u{1f9d}', '\u{397}'),
    ('\u{1f9e}', '\u{397}'),
    ('\u{1f9f}', '\u{397}'),
    ('\u{1fa0}', '\u{3c9}'),
    ('\u{1fa1}', '\u{3c9}'),
    ('\u{1fa2}', '\u{3c9}'),
    ('\u{1fa3}', '\u{3c9}'),
    ('\u{1fa4}', '\u{3c9}'),
    ('\u{1fa5}', '\u{3c9}'),
    ('\u{1fa6}', '\u{3c9}'),
    ('\u{1fa7}', '\u{3c9}'),
    ('\u{1fa8}', '\u{3a9}'),
    ('\u{1fa9}', '\u{3a9}'),
    ('\u{1faa}', '\u{3a9}'),
    ('\u{1fab}', '\u{3a9}'),
    ('\u{1fac}', '\u{3a9}'),
    ('\u{1fad}', '\u{3a9}'),
    ('\u{1fae}', '\u{3a9}'),
    ('\u{1faf}', '\u{3a9}'),
    ('\u{1fb0}', '\u{3b1}'),
    ('\u{1fb1}', '\u{3b1}'),
    ('\u{1fb2}', '\u{3b1}'),
    ('\u{1fb3}', '\u{3b1}'),
    ('\u{1fb4}', '\u{3b1}'),
    ('\u{1fb6}', '\u{3b1}'),
    ('\u{1fb7}', '\u{3b1}'),
    ('\u{1fb8}', '\u{391}'),
    ('\u{1fb9}', '\u{391}'),
    ('\u{1fba}', '\u{391}'),
    ('\u{1fbb}', '\u{391}'),
    ('\u{1fbc}', '\u{391}'),
    ('\u{1fbe}', '\u{3b9}'),
    ('\u{1fc1}', '\u{a8}'),
    ('\u{1fc2}', '\u{3b7}'),
    ('\u{1fc3}', '\u{3b7}'),
    ('\u{1fc4}', '\u{3b7}'),
    ('\u{1fc6}', '\u{3b7}'),
    ('\u{1fc7}', '\u{3b7}'),
    ('\u{1fc8}', '\u{395}'),
    ('\u{1fc9}', '\u{395}'),
    ('\u{1fca}', '\u{397}'),
    ('\u{1fcb}', '\u{397}'),
    ('\u{1fcc}', '\u{397}'),
    ('\u{1fcd}', '\u{1fbf}'),
    ('\u{1fce}', '\u{1fbf}'),
    ('\u{1fcf}', '\u{1fbf}'),
    ('\u{1fd0}', '\u{3b9}'),
    ('\u{1fd1}', '\u{3b9}'),
    ('\u{1fd2}', '\u{3b9}'),
    ('\u{1fd3}', '\u{3b9}'),
    ('\u{1fd6}', '\u{3b9}'),
    ('\u{1fd7}', '\u{3b9}'),
    ('\u{1fd8}', '\u{399}'),
    ('\u{1fd9}', '\u{399}'),
    ('\u{1fda}', '\u{399}'),
    ('\u{1fdb}', '\u{399}'),
    ('\u{1fdd}', '\u{1ffe}'),
    ('\u{1fde}', '\u{1ffe}'),
    ('\u{1fdf}', '\u{1ffe}'),
    ('\u{1fe0}', '\u{3c5}'),
    ('\u{1fe1}', '\u{3c5}'),
    ('\u{1fe2}', '\u{3c5}'),
    ('\u{1fe3}', '\u{3c5}'),
    ('\u{1fe4}', '\u{3c1}'),
    ('\u{1fe5}', '\u{3c1}'),
    ('\u{1fe6}', '\u{3c5}'),
    ('\u{1fe7}', '\u{3c5}'),
    ('\u{1fe8}', '\u{3a5}'),
    ('\u{1fe9}', '\u{3a5}'),
    ('\u{1fea}', '\u{3a5}'),
    ('\u{1feb}', '\u{3a5}'),
    ('\u{1fec}', '\u{3a1}'),
    ('\u{1fed}', '\u{a8}'),
    ('\u{1fee}', '\u{a8}'),
    ('\u{1fef}', '\u{60}'),
    ('\u{1ff2}', '\u{3c9}'),
    ('\u{1ff3}', '\u{3c9}'),
    ('\u{1ff4}', '\u{3c9}'),
    ('\u{1ff6}', '\u{3c9}'),
    ('\u{1ff7}', '\u{3c9}'),
    ('\u{1ff8}', '\u{39f}'),
    ('\u{1ff9}', '\u{39f}'),
    ('\u{1ffa}', '\u{3a9}'),
    ('\u{1ffb}', '\u{3a9}'),
    ('\u{1ffc}', '\u{3a9}'),
    ('\u{1ffd}', '\u{b4}'),
    ('\u{2000}', '\u{2002}'),
    ('\u{2001}', '\u{2003}'),
    ('\u{2126}', '\u{3a9}'),
    ('\u{212a}', '\u{4b}'),
    ('\u{212b}', '\u{41}'),
    ('\u{219a}', '\u{2190}'),
    ('\u{219b}', '\u{2192}'),
    ('\u{21ae}', '\u{2194}'),
    ('\u{21cd}', '\u{21d0}'),
    ('\u{21ce}', '\u{21d4}'),
    ('\u{21cf}', '\u{21d2}'),
    ('\u{2204}', '\u{2203}'),
    ('\u{2209}', '\u{2208}'),
    ('\u{220c}', '\u{220b}'),
    ('\u{2224}', '\u{2223}'),
    ('\u{2226}', '\u{2225}'),
    ('\u{2241}', '\u{223c}'),
    ('\u{2244}', '\u{2243}'),
    ('\u{2247}', '\u{2245}'),
    ('\u{2249}', '\u{2248}'),
    ('\u{2260}', '\u{3d}'),
    ('\u{2262}', '\u{2261}'),
    ('\u{226d}', '\u{224d}'),
    ('\u{226e}', '\u{3c}'),
    ('\u{226f}', '\u{3e}'),
    ('\u{2270}', '\u{2264}'),
    ('\u{2271}', '\u{2265}'),
    ('\u{2274}', '\u{2272}'),
    ('\u{2275}', '\u{2273}'),
    ('\u{2278}', '\u{2276}'),
    ('\u{2279}', '\u{2277}'),
    ('\u{2280}', '\u{227a}'),
    ('\u{2281}', '\u{227b}'),
    ('\u{2284}', '\u{2282}'),
    ('\u{2285}', '\u{2283}'),
    ('\u{2288}', '\u{2286}'),
    ('\u{2289}', '\u{2287}'),
    ('\u{22ac}', '\u{22a2}'),
    ('\u{22ad}', '\u{22a8}'),
    ('\u{22ae}', '\u{22a9}'),
    ('\u{22af}', '\u{22ab}'),
    ('\u{22e0}', '\u{227c}'),
    ('\u{22e1}', '\u{227d}'),
    ('\u{22e2}', '\u{2291}'),
    ('\u{22e3}', '\u{2292}'),
    ('\u{22ea}', '\u{22b2}'),
    ('\u{22eb}', '\u{22b3}'),
    ('\u{22ec}', '\u{22b4}'),
    ('\u{22ed}', '\u{22b5}'),
    ('\u{2329}', '\u{3008}'),
    ('\u{232a}', '\u{3009}'),
    ('\u{2adc}', '\u{2add}'),
    ('\u{f900}', '\u{8c48}'),
    ('\u{f901}', '\u{66f4}'),
    ('\u{f902}', '\u{8eca}'),
    ('\u{f903}', '\u{8cc8}'),
    ('\u{f904}', '\u{6ed1}'),
    ('\u{f905}', '\u{4e32}'),
    ('\u{f906}', '\u{53e5}'),
    ('\u{f907}', '\u{9f9c}'),
    ('\u{f908}', '\u{9f9c}'),
    ('\u{f909}', '\u{5951}'),
    ('\u{f90a}', '\u{91d1}'),
    ('\u{f90b}', '\u{5587}'),
    ('\u{f90c}', '\u{5948}'),
    ('\u{f90d}', '\u{61f6}'),
    ('\u{f90e}', '\u{7669}'),
    ('\u{f90f}', '\u{7f85}'),
    ('\u{f910}', '\u{863f}'),
    ('\u{f911}', '\u{87ba}'),
    ('\u{f912}', '\u{88f8}'),
    ('\u{f913}', '\u{908f}'),
    ('\u{f914}', '\u{6a02}'),
    ('\u{f915}', '\u{6d1b}'),
    ('\u{f916}', '\u{70d9}'),
    ('\u{f917}', '\u{73de}'),
    ('\u{f918}', '\u{843d}'),
    ('\u{f919}', '\u{916a}'),
    ('\u{f91a}', '\u{99f1}'),
    ('\u{f91b}', '\u{4e82}'),
    ('\u{f91c}', '\u{5375}'),
    ('\u{f91d}', '\u{6b04}'),
    ('\u{f91e}', '\u{721b}'),
    ('\u{f91f}', '\u{862d}'),
    ('\u{f920}', '\u{9e1e}'),
    ('\u{f921}', '\u{5d50}'),
    ('\u{f922}', '\u{6feb}'),
    ('\u{f923}', '\u{85cd}'),
    ('\u{f924}', '\u{8964}'),
    ('\u{f925}', '\u{62c9}'),
    ('\u{f926}', '\u{81d8}'),
    ('\u{f927}', '\u{881f}'),
    ('\u{f928}', '\u{5eca}'),
    ('\u{f929}', '\u{6717}'),
    ('\u{f92a}', '\u{6d6a}'),
    ('\u{f92b}', '\u{72fc}'),
    ('\u{f92c}', '\u{90ce}'),
    ('\u{f92d}', '\u{4f86}'),
    ('\u{f92e}', '\u{51b7}'),
    ('\u{f92f}', '\u{52de}'),
    ('\u{f930}', '\u{64c4}'),
    ('\u{f931}', '\u{6ad3}'),
    ('\u{f932}', '\u{7210}'),
    ('\u{f933}', '\u{76e7}'),
    ('\u{f934}', '\u{8001}'),
    ('\u{f935}', '\u{8606}'),
    ('\u{f936}', '\u{865c}'),
    ('\u{f937}', '\u{8def}'),
    ('\u{f938}', '\u{9732}'),
    ('\u{f939}', '\u{9b6f}'),
    ('\u{f93a}', '\u{9dfa}'),
    ('\u{f93b}', '\u{788c}'),
    ('\u{f93c}', '\u{797f}'),
    ('\u{f93d}', '\u{7da0}'),
    ('\u{f93e}', '\u{83c9}'),
    ('\u{f93f}', '\u{9304}'),
    ('\u{f940}', '\u{9e7f}'),
    ('\u{f941}', '\u{8ad6}'),
    ('\u{f942}', '\u{58df}'),
    ('\u{f943}', '\u{5f04}'),
    ('\u{f944}', '\u{7c60}'),
    ('\u{f945}', '\u{807e}'),
    ('\u{f946}', '\u{7262}'),
    ('\u{f947}', '\u{78ca}'),
    ('\u{f948}', '\u{8cc2}'),
    ('\u{f949}', '\u{96f7}'),
    ('\u{f94a}', '\u{58d8}'),
    ('\u{f94b}', '\u{5c62}'),
    ('\u{f94c}', '\u{6a13}'),
    ('\u{f94d}', '\u{6dda}'),
    ('\u{f94e}', '\u{6f0f}'),
    ('\u{f94f}', '\u{7d2f}'),
    ('\u{f950}', '\u{7e37}'),
    ('\u{f951}', '\u{964b}'),
    ('\u{f952}', '\u{52d2}'),
    ('\u{f953}', '\u{808b}'),
    ('\u{f954}', '\u{51dc}'),
    ('\u{f955}', '\u{51cc}'),
    ('\u{f956}', '\u{7a1c}'),
    ('\u{f957}', '\u{7dbe}'),
    ('\u{f958}', '\u{83f1}'),
    ('\u{f959}', '\u{9675}'),
    ('\u{f95a}', '\u{8b80}'),
    ('\u{f95b}', '\u{62cf}'),
    ('\u{f95c}', '\u{6a02}'),
    ('\u{f95d}', '\u{8afe}'),
    ('\u{f95e}', '\u{4e39}'),
    ('\u{f95f}', '\u{5be7}'),
    ('\u{f960}', '\u{6012}'),
    ('\u{f961}', '\u{7387}'),
    ('\u{f962}', '\u{7570}'),
    ('\u{f963}', '\u{5317}'),
    ('\u{f964}', '\u{78fb}'),
    ('\u{f965}', '\u{4fbf}'),
    ('\u{f966}', '\u{5fa9}'),
    ('\u{f967}', '\u{4e0d}'),
    ('\u{f968}', '\u{6ccc}'),
    ('\u{f969}', '\u{6578}'),
    ('\u{f96a}', '\u{7d22}'),
    ('\u{f96b}', '\u{53c3}'),
    ('\u{f96c}', '\u{585e}'),
    ('\u{f96d}', '\u{7701}'),
    ('\u{f96e}', '\u{8449}'),
    ('\u{f96f}', '\u{8aaa}'),
    ('\u{f970}', '\u{6bba}'),
    ('\u{f971}', '\u{8fb0}'),
    ('\u{f972}', '\u{6c88}'),
    ('\u{f973}', '\u{62fe}'),
    ('\u{f974}', '\u{82e5}'),
    ('\u{f975}', '\u{63a0}'),
    ('\u{f976}', '\u{7565}'),
    ('\u{f977}', '\u{4eae}'),
    ('\u{f978}', '\u{5169}'),
    ('\u{f979}', '\u{51c9}'),
    ('\u{f97a}', '\u{6881}'),
    ('\u{f97b}', '\u{7ce7}'),
    ('\u{f97c}', '\u{826f}'),
    ('\u{f97d}', '\u{8ad2}'),
    ('\u{f97e}', '\u{91cf}'),
    ('\u{f97f}', '\u{52f5}'),
    ('\u{f980}', '\u{5442}'),
    ('\u{f981}', '\u{5973}'),
    ('\u{f982}', '\u{5eec}'),
    ('\u{f983}', '\u{65c5}'),
    ('\u{f984}', '\u{6ffe}'),
    ('\u{f985}', '\u{792a}'),
    ('\u{f986}', '\u{95ad}'),
    ('\u{f987}', '\u{9a6a}'),
    ('\u{f988}', '\u{9e97}'),
    ('\u{f989}', '\u{9ece}'),
    ('\u{f98a}', '\u{529b}'),
    ('\u{f98b}', '\u{66c6}'),
    ('\u{f98c}', '\u{6b77}'),
    ('\u{f98d}', '\u{8f62}'),
    ('\u{f98e}', '\u{5e74}'),
    ('\u{f98f}', '\u{6190}'),
    ('\u{f990}', '\u{6200}'),
    ('\u{f991}', '\u{649a}'),
    ('\u{f992}', '\u{6f23}'),
    ('\u{f993}', '\u{7149}'),
    ('\u{f994}', '\u{7489}'),
    ('\u{f995}', '\u{79ca}'),
    ('\u{f996}', '\u{7df4}'),
    ('\u{f997}', '\u{806f}'),
    ('\u{f998}', '\u{8f26}'),
    ('\u{f999}', '\u{84ee}'),
    ('\u{f99a}', '\u{9023}'),
    ('\u{f99b}', '\u{934a}'),
    ('\u{f99c}', '\u{5217}'),
    ('\u{f99d}', '\u{52a3}'),
    ('\u{f99e}', '\u{54bd}'),
    ('\u{f99f}', '\u{70c8}'),
    ('\u{f9a0}', '\u{88c2}'),
    ('\u{f9a1}', '\u{8aaa}'),
    ('\u{f9a2}', '\u{5ec9}'),
    ('\u{f9a3}', '\u{5ff5}'),
    ('\u{f9a4}', '\u{637b}'),
    ('\u{f9a5}', '\u{6bae}'),
    ('\u{f9a6}', '\u{7c3e}'),
    ('\u{f9a7}', '\u{7375}'),
    ('\u{f9a8}', '\u{4ee4}'),
    ('\u{f9a9}', '\u{56f9}'),
    ('\u{f9aa}', '\u{5be7}'),
    ('\u{f9ab}', '\u{5dba}'),
    ('\u{f9ac}', '\u{601c}'),
    ('\u{f9ad}', '\u{73b2}'),
    ('\u{f9ae}', '\u{7469}'),
    ('\u{f9af}', '\u{7f9a}'),
    ('\u{f9b0}', '\u{8046}'),
    ('\u{f9b1}', '\u{9234}'),
    ('\u{f9b2}', '\u{96f6}'),
    ('\u{f9b3}', '\u{9748}'),
    ('\u{f9b4}', '\u{9818}'),
    ('\u{f9b5}', '\u{4f8b}'),
    ('\u{f9b6}', '\u{79ae}'),
    ('\u{f9b7}', '\u{91b4}'),
    ('\u{f9b8}', '\u{96b8}'),
    ('\u{f9b9}', '\u{60e1}'),
    ('\u{f9ba}', '\u{4e86}'),
    ('\u{f9bb}', '\u{50da}'),
    ('\u{f9bc}', '\u{5bee}'),
    ('\u{f9bd}', '\u{5c3f}'),
    ('\u{f9be}', '\u{6599}'),
    ('\u{f9bf}', '\u{6a02}'),
    ('\u{f9c0}', '\u{71ce}'),
    ('\u{f9c1}', '\u{7642}'),
    ('\u{f9c2}', '\u{84fc}'),
    ('\u{f9c3}', '\u{907c}'),
    ('\u{f9c4}', '\u{9f8d}'),
    ('\u{f9c5}', '\u{6688}'),
    ('\u{f9c6}', '\u{962e}'),
    ('\u{f9c7}', '\u{5289}'),
    ('\u{f9c8}', '\u{677b}'),
    ('\u{f9c9}', '\u{67f3}'),
    ('\u{f9ca}', '\u{6d41}'),
    ('\u{f9cb}', '\u{6e9c}'),
    ('\u{f9cc}', '\u{7409}'),
    ('\u{f9cd}', '\u{7559}'),
    ('\u{f9ce}', '\u{786b}'),
    ('\u{f9cf}', '\u{7d10}'),
    ('\u{f9d0}', '\u{985e}'),
    ('\u{f9d1}', '\u{516d}'),
    ('\u{f9d2}', '\u{622e}'),
    ('\u{f9d3}', '\u{9678}'),
    ('\u{f9d4}', '\u{502b}'),
    ('\u{f9d5}', '\u{5d19}'),
    ('\u{f9d6}', '\u{6dea}'),
    ('\u{f9d7}', '\u{8f2a}'),
    ('\u{f9d8}', '\u{5f8b}'),
    ('\u{f9d9}', '\u{6144}'),
    ('\u{f9da}', '\u{6817}'),
    ('\u{f9db}', '\u{7387}'),
    ('\u{f9dc}', '\u{9686}'),
    ('\u{f9dd}', '\u{5229}'),
    ('\u{f9de}', '\u{540f}'),
    ('\u{f9df}', '\u{5c65}'),
    ('\u{f9e0}', '\u{6613}'),
    ('\u{f9e1}', '\u{674e}'),
    ('\u{f9e2}', '\u{68a8}'),
    ('\u{f9e3}', '\u{6ce5}'),
    ('\u{f9e4}', '\u{7406}'),
    ('\u{f9e5}', '\u{75e2}'),
    ('\u{f9e6}', '\u{7f79}'),
    ('\u{f9e7}', '\u{88cf}'),
    ('\u{f9e8}', '\u{88e1}'),
    ('\u{f9e9}', '\u{91cc}'),
    ('\u{f9ea}', '\u{96e2}'),
    ('\u{f9eb}', '\u{533f}'),
    ('\u{f9ec}', '\u{6eba}'),
    ('\u{f9ed}', '\u{541d}'),
    ('\u{f9ee}', '\u{71d0}'),
    ('\u{f9ef}', '\u{7498}'),
    ('\u{f9f0}', '\u{85fa}'),
    ('\u{f9f1}', '\u{96a3}'),
    ('\u{f9f2}', '\u{9c57}'),
    ('\u{f9f3}', '\u{9e9f}'),
    ('\u{f9f4}', '\u{6797}'),
    ('\u{f9f5}', '\u{6dcb}'),
    ('\u{f9f6}', '\u{81e8}'),
    ('\u{f9f7}', '\u{7acb}'),
    ('\u{f9f8}', '\u{7b20}'),
    ('\u{f9f9}', '\u{7c92}'),
    ('\u{f9fa}', '\u{72c0}'),
    ('\u{f9fb}', '\u{7099}'),
    ('\u{f9fc}', '\u{8b58}'),
    ('\u{f9fd}', '\u{4ec0}'),
    ('\u{f9fe}', '\u{8336}'),
    ('\u{f9ff}', '\u{523a}'),
    ('\u{fa00}', '\u{5207}'),
    ('\u{fa01}', '\u{5ea6}'),
    ('\u{fa02}', '\u{62d3}'),
    ('\u{fa03}', '\u{7cd6}'),
    ('\u{fa04}', '\u{5b85}'),
    ('\u{fa05}', '\u{6d1e}'),
    ('\u{fa06}', '\u{66b4}'),
    ('\u{fa07}', '\u{8f3b}'),
    ('\u{fa08}', '\u{884c}'),
    ('\u{fa09}', '\u{964d}'),
    ('\u{fa0a}', '\u{898b}'),
    ('\u{fa0b}', '\u{5ed3}'),
    ('\u{fa0c}', '\u{5140}'),
    ('\u{fa0d}', '\u{55c0}'),
    ('\u{fa10}', '\u{585a}'),
    ('\u{fa12}', '\u{6674}'),
    ('\u{fa15}', '\u{51de}'),
    ('\u{fa16}', '\u{732a}'),
    ('\u{fa17}', '\u{76ca}'),
    ('\u{fa18}', '\u{793c}'),
    ('\u{fa19}', '\u{795e}'),
    ('\u{fa1a}', '\u{7965}'),
    ('\u{fa1b}', '\u{798f}'),
    ('\u{fa1c}', '\u{9756}'),
    ('\u{fa1d}', '\u{7cbe}'),
    ('\u{fa1e}', '\u{7fbd}'),
    ('\u{fa20}', '\u{8612}'),
    ('\u{fa22}', '\u{8af8}'),
    ('\u{fa25}', '\u{9038}'),
    ('\u{fa26}', '\u{90fd}'),
    ('\u{fa2a}', '\u{98ef}'),
    ('\u{fa2b}', '\u{98fc}'),
    ('\u{fa2c}', '\u{9928}'),
    ('\u{fa2d}', '\u{9db4}'),
    ('\u{fa2e}', '\u{90de}'),
    ('\u{fa2f}', '\u{96b7}'),
    ('\u{fa30}', '\u{4fae}'),
    ('\u{fa31}', '\u{50e7}'),
    ('\u{fa32}', '\u{514d}'),
    ('\u{fa33}', '\u{52c9}'),
    ('\u{fa34}', '\u{52e4}'),
    ('\u{fa35}', '\u{5351}'),
    ('\u{fa36}', '\u{559d}'),
    ('\u{fa37}', '\u{5606}'),
    ('\u{fa38}', '\u{5668}'),
    ('\u{fa39}', '\u{5840}'),
    ('\u{fa3a}', '\u{58a8}'),
    ('\u{fa3b}', '\u{5c64}'),
    ('\u{fa3c}', '\u{5c6e}'),
    ('\u{fa3d}', '\u{6094}'),
    ('\u{fa3e}', '\u{6168}'),
    ('\u{fa3f}', '\u{618e}'),
    ('\u{fa40}', '\u{61f2}'),
    ('\u{fa41}', '\u{654f}'),
    ('\u{fa42}', '\u{65e2}'),
    ('\u{fa43}', '\u{6691}'),
    ('\u{fa44}', '\u{6885}'),
    ('\u{fa45}', '\u{6d77}'),
    ('\u{fa46}', '\u{6e1a}'),
    ('\u{fa47}', '\u{6f22}'),
    ('\u{fa48}', '\u{716e}'),
    ('\u{fa49}', '\u{722b}'),
    ('\u{fa4a}', '\u{7422}'),
    ('\u{fa4b}', '\u{7891}'),
    ('\u{fa4c}', '\u{793e}'),
    ('\u{fa4d}', '\u{7949}'),
    ('\u{fa4e}', '\u{7948}'),
    ('\u{fa4f}', '\u{7950}'),
    ('\u{fa50}', '\u{7956}'),
    ('\u{fa51}', '\u{795d}'),
    ('\u{fa52}', '\u{798d}'),
    ('\u{fa53}', '\u{798e}'),
    ('\u{fa54}', '\u{7a40}'),
    ('\u{fa55}', '\u{7a81}'),
    ('\u{fa56}', '\u{7bc0}'),
    ('\u{fa57}', '\u{7df4}'),
    ('\u{fa58}', '\u{7e09}'),
    ('\u{fa59}', '\u{7e41}'),
    ('\u{fa5a}', '\u{7f72}'),
    ('\u{fa5b}', '\u{8005}'),
    ('\u{fa5c}', '\u{81ed}'),
    ('\u{fa5d}', '\u{8279}'),
    ('\u{fa5e}', '\u{8279}'),
    ('\u{fa5f}', '\u{8457}'),
    ('\u{fa60}', '\u{8910}'),
    ('\u{fa61}', '\u{8996}'),
    ('\u{fa62}', '\u{8b01}'),
    ('\u{fa63}', '\u{8b39}'),
    ('\u{fa64}', '\u{8cd3}'),
    ('\u{fa65}', '\u{8d08}'),
    ('\u{fa66}', '\u{8fb6}'),
    ('\u{fa67}', '\u{9038}'),
    ('\u{fa68}', '\u{96e3}'),
    ('\u{fa69}', '\u{97ff}'),
    ('\u{fa6a}', '\u{983b}'),
    ('\u{fa6b}', '\u{6075}'),
    ('\u{fa6c}', '\u{242ee}'),
    ('\u{fa6d}', '\u{8218}'),
    ('\u{fa70}', '\u{4e26}'),
    ('\u{fa71}', '\u{51b5}'),
    ('\u{fa72}', '\u{5168}'),
    ('\u{fa73}', '\u{4f80}'),
    ('\u{fa74}', '\u{5145}'),
    ('\u{fa75}', '\u{5180}'),
    ('\u{fa76}', '\u{52c7}'),
    ('\u{fa77}', '\u{52fa}'),
    ('\u{fa78}', '\u{559d}'),
    ('\u{fa79}', '\u{5555}'),
    ('\u{fa7a}', '\u{5599}'),
    ('\u{fa7b}', '\u{55e2}'),
    ('\u{fa7c}', '\u{585a}'),
    ('\u{fa7d}', '\u{58b3}'),
    ('\u{fa7e}', '\u{5944}'),
    ('\u{fa7f}', '\u{5954}'),
    ('\u{fa80}', '\u{5a62}'),
    ('\u{fa81}', '\u{5b28}'),
    ('\u{fa82}', '\u{5ed2}'),
    ('\u{fa83}', '\u{5ed9}'),
    ('\u{fa84}', '\u{5f69}'),
    ('\u{fa85}', '\u{5fad}'),
    ('\u{fa86}', '\u{60d8}'),
    ('\u{fa87}', '\u{614e}'),
    ('\u{fa88}', '\u{6108}'),
    ('\u{fa89}', '\u{618e}'),
    ('\u{fa8a}', '\u{6160}'),
    ('\u{fa8b}', '\u{61f2}'),
    ('\u{fa8c}', '\u{6234}'),
    ('\u{fa8d}', '\u{63c4}'),
    ('\u{fa8e}', '\u{641c}'),
    ('\u{fa8f}', '\u{6452}'),
    ('\u{fa90}', '\u{6556}'),
    ('\u{fa91}', '\u{6674}'),
    ('\u{fa92}', '\u{6717}'),
    ('\u{fa93}', '\u{671b}'),
    ('\u{fa94}', '\u{6756}'),
    ('\u{fa95}', '\u{6b79}'),
    ('\u{fa96}', '\u{6bba}'),
    ('\u{fa97}', '\u{6d41}'),
    ('\u{fa98}', '\u{6edb}'),
    ('\u{fa99}', '\u{6ecb}'),
    ('\u{fa9a}', '\u{6f22}'),
    ('\u{fa9b}', '\u{701e}'),
    ('\u{fa9c}', '\u{716e}'),
    ('\u{fa9d}', '\u{77a7}'),
    ('\u{fa9e}', '\u{7235}'),
    ('\u{fa9f}', '\u{72af}'),
    ('\u{faa0}', '\u{732a}'),
    ('\u{faa1}', '\u{7471}'),
    ('\u{faa2}', '\u{7506}'),
    ('\u{faa3}', '\u{753b}'),
    ('\u{faa4}', '\u{761d}'),
    ('\u{faa5}', '\u{761f}'),
    ('\u{faa6}', '\u{76ca}'),
    ('\u{faa7}', '\u{76db}'),
    ('\u{faa8}', '\u{76f4}'),
    ('\u{faa9}', '\u{774a}'),
    ('\u{faaa}', '\u{7740}'),
    ('\u{faab}', '\u{78cc}'),
    ('\u{faac}', '\u{7ab1}'),
    ('\u{faad}', '\u{7bc0}'),
    ('\u{faae}', '\u{7c7b}'),
    ('\u{faaf}', '\u{7d5b}'),
    ('\u{fab0}', '\u{7df4}'),
    ('\u{fab1}', '\u{7f3e}'),
    ('\u{fab2}', '\u{8005}'),
    ('\u{fab3}', '\u{8352}'),
    ('\u{fab4}', '\u{83ef}'),
    ('\u{fab5}', '\u{8779}'),
    ('\u{fab6}', '\u{8941}'),
    ('\u{fab7}', '\u{8986}'),
    ('\u{fab8}', '\u{8996}'),
    ('\u{fab9}', '\u{8abf}'),
    ('\u{faba}', '\u{8af8}'),
    ('\u{fabb}', '\u{8acb}'),
    ('\u{fabc}', '\u{8b01}'),
    ('\u{fabd}', '\u{8afe}'),
    ('\u{fabe}', '\u{8aed}'),
    ('\u{fabf}', '\u{8b39}'),
    ('\u{fac0}', '\u{8b8a}'),
    ('\u{fac1}', '\u{8d08}'),
    ('\u{fac2}', '\u{8f38}'),
    ('\u{fac3}', '\u{9072}'),
    ('\u{fac4}', '\u{9199}'),
    ('\u{fac5}', '\u{9276}'),
    ('\u{fac6}', '\u{967c}'),
    ('\u{fac7}', '\u{96e3}'),
    ('\u{fac8}', '\u{9756}'),
    ('\u{fac9}', '\u{97db}'),
    ('\u{faca}', '\u{97ff}'),
    ('\u{facb}', '\u{980b}'),
    ('\u{facc}', '\u{983b}'),
    ('\u{facd}', '\u{9b12}'),
    ('\u{face}', '\u{9f9c}'),
    ('\u{facf}', '\u{2284a}'),
    ('\u{fad0}', '\u{22844}'),
    ('\u{fad1}', '\u{233d5}'),
    ('\u{fad2}', '\u{3b9d}'),
    ('\u{fad3}', '\u{4018}'),
    ('\u{fad4}', '\u{4039}'),
    ('\u{fad5}', '\u{25249}'),
    ('\u{fad6}', '\u{25cd0}'),
    ('\u{fad7}', '\u{27ed3}'),
    ('\u{fad8}', '\u{9f43}'),
    ('\u{fad9}', '\u{9f8e}'),
];

pub fn strip_diacritics(s: &str) -> String {
    s.chars()
        .filter_map(|c| {
            if ('\u{0300}'..='\u{036F}').contains(&c) {
                return None;
            }
            Some(
                NFD_BASE
                    .binary_search_by_key(&c, |(from, _)| *from)
                    .map_or(c, |idx| NFD_BASE[idx].1),
            )
        })
        .collect::<String>()
        .to_lowercase()
}

/// web `UNIT_STOCK_GATE_LABEL` (klucz = `stripDiacritics(Surowiec)`).
fn unit_stock_gate_label(key: &str) -> Option<&'static str> {
    match key {
        "braz" => Some("Brąz"),
        "zelazo" => Some("Żelazo"),
        "drewno" => Some("Drewno"),
        _ => None,
    }
}

/// web `unitStockShortfallLabel`: przyczyna blokady jednostki brakiem zapasu (Braz/Zelazo/Drewno)
/// albo `None` (brak bramki lub zapas jest).
pub fn unit_stock_shortfall_label(
    surowiec: Option<&str>,
    stock: Option<&BTreeMap<String, f64>>,
) -> Option<String> {
    let key = strip_diacritics(js_trim(surowiec.unwrap_or("")));
    let label = unit_stock_gate_label(&key)?;
    if empire_stock_has(stock, &key) {
        return None;
    }
    Some(format!("Brak w magazynie państwa: {label}"))
}

// ---------------------------------------------------------------------------
// P6.8A-P1 (dokonczenie): buildingStatSummaryLines (building-upgrades.ts:98-125).
// Zalezy od mnoznikow bojowych z `unit-building-bonuses` (port: combat::unit_building_bonuses).
// ---------------------------------------------------------------------------

/// web `STAT_KEYS` (building-upgrades.ts): kolejnosc wierszy statystyk.
pub const BUILDING_STAT_KEYS: [&str; 7] = [
    "praca",
    "pieniadz",
    "zywnosc",
    "nauka",
    "kultura",
    "zadowolenie",
    "obrona",
];

/// web `statLine(label, baza, przyrost)`: `None` gdy oba zero; `NaN` przechodzi (web `NaN !== 0`).
fn stat_line(label: &str, baza: f64, przyrost: f64) -> Option<String> {
    if baza == 0.0 && przyrost == 0.0 {
        return None;
    }
    let mut parts: Vec<String> = Vec::new();
    if baza != 0.0 {
        parts.push(crate::domain::civ_matrix::js_compat::js_number_to_string(
            baza,
        ));
    }
    if przyrost != 0.0 {
        parts.push(format!(
            "+{}/poz",
            crate::domain::civ_matrix::js_compat::js_number_to_string(przyrost)
        ));
    }
    Some(format!("{label} {}", parts.join(" ")))
}

/// web `buildingStatSummaryLines(def, buildings?)`.
/// * `baza` / `przyrost` = mapy liczbowe definicji (brak klucza = 0 jak `?? 0`).
/// * `buildings` = `None` (web `undefined`) -> wlasny `baza.mnoznik`; `Some(lista)` (takze pusta:
///   w JS pusta tablica jest prawdziwa) -> skumulowany mnoznik lancucha upgradeFrom.
pub fn building_stat_summary_lines(
    def_id: &str,
    baza: &BTreeMap<String, f64>,
    przyrost: &BTreeMap<String, f64>,
    buildings: Option<&[crate::domain::combat::unit_building_bonuses::MnoznikBuildingLookup]>,
) -> Vec<String> {
    use crate::domain::combat::unit_building_bonuses::{
        cumulative_mnoznik_for_building_id, mnoznik_role_for_building_id, MnoznikRole,
    };
    let mut lines: Vec<String> = BUILDING_STAT_KEYS
        .iter()
        .filter_map(|k| {
            let b = baza.get(*k).copied().unwrap_or(0.0);
            let p = przyrost.get(*k).copied().unwrap_or(0.0);
            stat_line(k, b, p)
        })
        .collect();
    if let Some(role) = mnoznik_role_for_building_id(def_id) {
        let cumulative = match buildings {
            Some(list) => cumulative_mnoznik_for_building_id(def_id, Some(list)),
            None => baza.get("mnoznik").copied().unwrap_or(0.0),
        };
        if cumulative != 0.0 {
            let label = match role {
                MnoznikRole::Pancerz => "Pancerz (jednostki)",
                MnoznikRole::Parametry => "Parametry poza Pancerzem (jednostki)",
            };
            lines.push(format!(
                "{label} +{}%",
                crate::domain::civ_matrix::js_compat::js_number_to_string(cumulative)
            ));
        }
    }
    lines
}

// ---------------------------------------------------------------------------
// P6.8B-P1a (pin webu 91dc998a; production.ts 694-905): nacja jednostek, zamienniki
// cywilizacji, kolejka ulepszen, tokeny jednostek specjalnych oraz koszt kupna budynku
// za zloto. Bez availableProduction / availableReplacementsFor / rekrutacji
// (P1b, P2 -- NASTEPNA-PARTIA w P6-8B-*.md).
// ---------------------------------------------------------------------------

/// web `CIV_KEY_TO_UNIT_NACJA` (production.ts:694-716). Klucze ASCII; wartosci jak w units.json.
/// Web trzyma to w obiekcie JS: lookup po nazwie prototypowej (`constructor` itp.) zwraca
/// wartosc dziedziczona -- NIE odtwarzane (NOTE w P6-8B-*.md; zadna cywilizacja nie ma takiego klucza).
const CIV_KEY_TO_UNIT_NACJA: [(&str, &str); 17] = [
    ("grecy", "Grecja"),
    ("rzymianie", "Rzym"),
    ("chinczycy", "Chiny"),
    ("zulusi", "Zulu"),
    ("inkowie", "Inkowie"),
    ("egipt", "Egipt"),
    ("sumer", "Sumer"),
    ("sumerowie", "Sumer"),
    ("babilon", "Sumer"),
    ("celtowie", "Celtowie"),
    ("germanie", "Germanie"),
    ("harappa", "Harappa"),
    ("hetyci", "Hetyci"),
    ("slowianie", "Słowianie"),
    ("babilonia", "Babilonia"),
    ("asyria", "Asyria"),
    ("fenicjanie", "Fenicjanie"),
];

/// web `unitNacjaForCivKey(civKey)`: `None` = brak klucza (`undefined`/`null`/pusty po trim)
/// albo klucz nieznany.
pub fn unit_nacja_for_civ_key(civ_key: Option<&str>) -> Option<&'static str> {
    let key = js_trim(civ_key?);
    if key.is_empty() {
        return None;
    }
    let lower = key.to_lowercase();
    CIV_KEY_TO_UNIT_NACJA
        .iter()
        .find(|(k, _)| *k == lower)
        .map(|(_, v)| *v)
}

/// web `unitAllowedForCivNation(unitNacja, civUnitNacja)`.
pub fn unit_allowed_for_civ_nation(unit_nacja: &str, civ_unit_nacja: Option<&str>) -> bool {
    let n = js_trim(unit_nacja);
    if n.is_empty() {
        return true;
    }
    let c = js_trim(civ_unit_nacja.unwrap_or(""));
    if c.is_empty() {
        return false;
    }
    strip_diacritics(n) == strip_diacritics(c)
}

/// web `availabilityCivNation(ctx)`: `civ_key` = `ctx.civKey` (`None` = pole `undefined`,
/// `Some(None)` = `null`, `Some(Some(s))` = napis). Gdy `civKey !== undefined` -> nacja z klucza,
/// inaczej `ctx.civUnitNacja`.
pub fn availability_civ_nation(
    civ_key: Option<Option<&str>>,
    civ_unit_nacja: Option<&str>,
) -> Option<String> {
    match civ_key {
        Some(key) => unit_nacja_for_civ_key(key).map(str::to_string),
        None => civ_unit_nacja.map(str::to_string),
    }
}

/// Wiersz jednostki dla logiki zamiennikow (pola `UnitDef` czytane przez web
/// `isBlankReplacement` / `isCivSpecialReplacement` / `civHasReplacementFor`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct UnitReplacementRow {
    pub jednostka: String,
    /// web `Nacja` (`None` = brak / `null`).
    pub nacja: Option<String>,
    /// web `W zamian za` (`None` = brak / `null`).
    pub w_zamian_za: Option<String>,
}

/// web `isBlankReplacement(zamiast)`: pusty, `-` albo em dash.
pub fn is_blank_replacement(zamiast: &str) -> bool {
    zamiast.is_empty() || zamiast == "-" || zamiast == "\u{2014}"
}

/// web `isCivSpecialReplacement(unit, civNation)`. `civ_nation` pusty/`None` = falsy (false).
pub fn is_civ_special_replacement(unit: &UnitReplacementRow, civ_nation: Option<&str>) -> bool {
    let Some(civ) = civ_nation.filter(|c| !c.is_empty()) else {
        return false;
    };
    let replacement = js_trim(unit.w_zamian_za.as_deref().unwrap_or(""));
    let unit_nation = js_trim(unit.nacja.as_deref().unwrap_or(""));
    !is_blank_replacement(replacement)
        && !unit_nation.is_empty()
        && strip_diacritics(unit_nation) == strip_diacritics(civ)
}

/// web `civHasReplacementFor(data, baseUnitName, civNation)`.
pub fn civ_has_replacement_for(
    units: &[UnitReplacementRow],
    base_unit_name: &str,
    civ_nation: Option<&str>,
) -> bool {
    if civ_nation.is_none_or(str::is_empty) {
        return false;
    }
    units.iter().any(|unit| {
        is_civ_special_replacement(unit, civ_nation)
            && js_trim(unit.w_zamian_za.as_deref().unwrap_or("")) == base_unit_name
    })
}

/// web `BUILDING_GOLD_PURCHASE_MULT` (production.ts:757).
pub const BUILDING_GOLD_PURCHASE_MULT: f64 = 2.0;

/// web `buildingGoldPurchaseCost(pracaKoszt)` = `Math.max(1, Math.round(praca * 2))`.
/// `Math.max` zwraca NaN, gdy argument jest NaN (w odroznieniu od `f64::max`).
pub fn building_gold_purchase_cost(praca_koszt: f64) -> f64 {
    let rounded = js_math_round(praca_koszt * BUILDING_GOLD_PURCHASE_MULT);
    if rounded.is_nan() {
        f64::NAN
    } else {
        rounded.max(1.0)
    }
}

/// Wiersz budynku dla logiki kolejki ulepszen (pola web `upgradeFrom` i `odblokowuje`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct BuildingLinkRow {
    pub id: String,
    /// web `upgradeFrom` (`None` = brak).
    pub upgrade_from: Option<String>,
    /// web `odblokowuje` (`None` = brak).
    pub odblokowuje: Option<String>,
}

/// web `buildingTypeCommitted(buildingId, builtIds, queue)`.
pub fn building_type_committed(
    building_id: &str,
    built_ids: &[&str],
    queue: &[ProductionItem],
) -> bool {
    built_ids.contains(&building_id)
        || queue
            .iter()
            .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)
}

/// web `isBuildingSupersededByUpgrade(buildingId, builtIds, buildings)`.
pub fn is_building_superseded_by_upgrade(
    building_id: &str,
    built_ids: &[&str],
    buildings: &[BuildingLinkRow],
) -> bool {
    buildings.iter().any(|b| {
        b.upgrade_from.as_deref() == Some(building_id) && built_ids.contains(&b.id.as_str())
    })
}

/// web `applyCompletedBuildingIds(builtIds, completedBuildingId, buildings)` (ABC-7, T-TECH-8).
/// Usuwa pierwsze wystapienie poprzednika (`upgradeFrom` po trim, niepusty), dopisuje ukonczony
/// budynek (jesli go nie ma) i dla `mury` usuwa pierwsza `palisada`.
pub fn apply_completed_building_ids(
    built_ids: &[&str],
    completed_building_id: &str,
    buildings: &[BuildingLinkRow],
) -> Vec<String> {
    let mut next: Vec<String> = built_ids.iter().map(|s| s.to_string()).collect();
    let def = buildings.iter().find(|b| b.id == completed_building_id);
    if let Some(upgrade_from) = def
        .and_then(|d| d.upgrade_from.as_deref())
        .map(js_trim)
        .filter(|s| !s.is_empty())
    {
        if let Some(idx) = next.iter().position(|id| id == upgrade_from) {
            next.remove(idx);
        }
    }
    if !next.iter().any(|id| id == completed_building_id) {
        next.push(completed_building_id.to_string());
    }
    if completed_building_id == "mury" {
        if let Some(pi) = next.iter().position(|id| id == "palisada") {
            next.remove(pi);
        }
    }
    next
}

/// web `buildingUnlockFlagFor(completedBuildingId, buildings)`: `odblokowuje` po trim
/// (niepusty) albo `None`.
pub fn building_unlock_flag_for(
    completed_building_id: &str,
    buildings: &[BuildingLinkRow],
) -> Option<String> {
    buildings
        .iter()
        .find(|b| b.id == completed_building_id)
        .and_then(|b| b.odblokowuje.as_deref())
        .map(js_trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// web `buildingTypeQueued(buildingId, queue)`.
pub fn building_type_queued(building_id: &str, queue: &[ProductionItem]) -> bool {
    queue
        .iter()
        .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)
}

/// Wartosc `bonusy[].wartosc` (web: `string[]` albo `string`). `None` = brak/`null`
/// (web: `String(undefined ?? '')` = pusty napis); elementy listy `None` = `null` w tablicy.
#[derive(Debug, Clone, PartialEq)]
pub enum CivBonusValue {
    Single(Option<String>),
    List(Vec<Option<String>>),
}

/// Pola bonusu cywilizacji czytane przez `civSpecialUnitNameTokens`.
#[derive(Debug, Clone, PartialEq)]
pub struct CivSpecialBonus {
    pub typ: String,
    pub wartosc: CivBonusValue,
}

/// web `civSpecialUnitNameTokens(bonusy)`: tokeny nazw z bonusow `jednostka_specjalna`
/// (rozdzielone `/`, z obcieciem nawiasu jako dodatkowy token).
pub fn civ_special_unit_name_tokens(bonusy: Option<&[CivSpecialBonus]>) -> Vec<String> {
    let mut tokens: Vec<String> = Vec::new();
    let Some(bonusy) = bonusy.filter(|b| !b.is_empty()) else {
        return tokens;
    };
    for b in bonusy {
        if b.typ != "jednostka_specjalna" {
            continue;
        }
        let raw_values: Vec<String> = match &b.wartosc {
            CivBonusValue::List(items) => items
                .iter()
                .map(|v| v.clone().unwrap_or_default())
                .collect(),
            CivBonusValue::Single(v) => vec![v.clone().unwrap_or_default()],
        };
        for raw_value in raw_values {
            let raw = js_trim(&raw_value);
            if raw.is_empty() {
                continue;
            }
            for part in raw.split('/') {
                let trimmed = js_trim(part);
                if trimmed.is_empty() {
                    continue;
                }
                tokens.push(trimmed.to_string());
                let primary = js_trim(trimmed.split('(').next().unwrap_or(""));
                if !primary.is_empty() && primary != trimmed {
                    tokens.push(primary.to_string());
                }
            }
        }
    }
    tokens
}

/// web `unitMatchesSpecialName(unitName, tokens)`.
pub fn unit_matches_special_name(unit_name: &str, tokens: &[String]) -> bool {
    if tokens.is_empty() {
        return false;
    }
    let un = strip_diacritics(unit_name);
    tokens.iter().any(|token| {
        let tn = strip_diacritics(token);
        if tn.is_empty() {
            return false;
        }
        un == tn
            || un.starts_with(&tn)
            || tn.starts_with(&un)
            || un.contains(&tn)
            || tn.contains(&un)
    })
}

// ---------------------------------------------------------------------------
// P6.8B-P1b (czesc 1): unitStockShortfallLabel (production.ts 682-693 @91dc998a) oraz
// populationCostOf / UNIT_POPULATION_COST (production.ts 1980-1982 / 1977 @91dc998a). Wektory: p6_8b_vectors/p1b.json.
// ---------------------------------------------------------------------------

/// web `UNIT_POPULATION_COST` = `miasto-params.json` `jednostka_koszt_ludnosci.wartosc` (?? 1).
/// Pin 91dc998a: wartosc 0 (rekrutacja nie zabiera ludnosci). Wartosc zamrozona w Rust; generator
/// wektorow odczytuje ja z weba (`unitPopulationCost` w p1b.json).
pub const UNIT_POPULATION_COST: f64 = 0.0;

/// web `populationCostOf(item)`: koszt ludnosci ukonczenia pozycji (jednostka = `UNIT_POPULATION_COST`, budynek = 0).
pub fn population_cost_of(item: &ProductionItem) -> f64 {
    match item.kind {
        ProductionKind::Jednostka => UNIT_POPULATION_COST,
        ProductionKind::Budynek => 0.0,
    }
}
