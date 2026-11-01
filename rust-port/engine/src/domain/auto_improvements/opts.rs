//! P6.8I (8I-P1): typy wejscia/wyjscia pickera auto-ulepszen (`AutoImprovementCity`,
//! `AutoImprovementPick`, `AutoImprovementSurplusReport`, `PickAutoImprovementsOpts`).
//!
//! Domkniecia webowe (`getFocus`, `getOnlyWorked`, ...) to `Option<&dyn Fn>`; `surplusReport` (obiekt
//! wypelniany W MIEJSCU przez wolajacego) to `Option<&RefCell<..>>`. `Clone` kopiuje wskazniki, tak jak
//! `{ ...opts }` w webowym `after()`.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use crate::domain::improvement_build::BuildMap;
use crate::domain::territory::TerritoryNode;

/// Web `UlepszeniaFocus` (`cities.ts:181`) + `Other`: dowolny inny napis z danych (web: lista
/// `default:` = zrownowazone, ale `focus === 'zrownowazone'` jest fALSZEM).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UlepszeniaFocus {
    Zywnosc,
    Surowce,
    Infrastruktura,
    Zrownowazone,
    Other,
}

/// Web `DEFAULT_ULEPSZENIA_FOCUS` (`cities.ts:202`).
pub const DEFAULT_ULEPSZENIA_FOCUS: UlepszeniaFocus = UlepszeniaFocus::Zrownowazone;

/// Web `AutoImprovementCity` (+ `surowce.kon`, czytane przez `(c as unknown as {surowce}).surowce?.kon`).
#[derive(Debug, Clone, PartialEq)]
pub struct AutoImprovementCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub population: f64,
    pub ulepszenia_focus: Option<UlepszeniaFocus>,
    pub ulepszenia_only_worked: Option<bool>,
    /// `city.surowce?.kon` (`None` = brak pola -> 0).
    pub kon_stock: Option<f64>,
}

/// Web `AutoImprovementPick`.
#[derive(Debug, Clone, PartialEq)]
pub struct AutoImprovementPick {
    pub owner_id: i64,
    pub city_id: String,
    pub q: i32,
    pub r: i32,
    pub key: String,
    pub koszt_praca: f64,
}

/// Web `AutoImprovementSurplusReport`.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct AutoImprovementSurplusReport {
    pub demand_active: bool,
    pub deficit_active: bool,
    pub any_candidate: bool,
    pub surplus: bool,
}

/// Web `foodImprovementStages?: boolean | ((city) => boolean)`.
#[derive(Clone, Copy)]
pub enum FoodStages<'a> {
    Flag(bool),
    PerCity(&'a dyn Fn(&AutoImprovementCity) -> bool),
}

/// Predykat per miasto (`getOnlyWorked`, `getSkipWyrab`, ...).
pub type CityPredicate<'a> = &'a dyn Fn(&AutoImprovementCity) -> bool;
/// Bramka cywilizacji (`isImprovementAllowedForCiv`).
pub type CivGate<'a> = &'a dyn Fn(&str, Option<&str>) -> bool;
/// Zbior kluczy heksow pracowanych per miasto (`getWorkedHexKeys`).
pub type WorkedKeysFn<'a> = &'a dyn Fn(&AutoImprovementCity) -> BTreeSet<String>;

/// Warstwy ulepszen per heks (`"q,r"` -> klucze), odpowiednik `Map<string, string[]>`.
pub type PlacedMap = BTreeMap<String, Vec<String>>;

/// Web `PickAutoImprovementsOpts`. Pola `None`/`false` = nieobecne w webowym obiekcie.
#[derive(Clone, Default)]
pub struct PickAutoImprovementsOpts<'a> {
    pub cities: Vec<AutoImprovementCity>,
    pub owner_id: i64,
    pub map: Option<&'a BuildMap>,
    pub territory_nodes: Option<Vec<TerritoryNode>>,
    pub placed_improvements: Option<PlacedMap>,
    pub praca_available: f64,
    pub unlocked_techs: BTreeSet<String>,
    pub get_focus: Option<&'a dyn Fn(&AutoImprovementCity) -> UlepszeniaFocus>,
    pub get_only_worked: Option<CityPredicate<'a>>,
    pub get_worked_hex_keys: Option<WorkedKeysFn<'a>>,
    pub praca_budget_percent: Option<f64>,
    pub improvement_budget_cap: Option<f64>,
    pub get_praca_budget_percent: Option<&'a dyn Fn(&AutoImprovementCity) -> f64>,
    pub max_items_per_city: Option<f64>,
    pub praca_surplus_threshold: Option<f64>,
    pub skip_wyrab: bool,
    pub get_skip_wyrab: Option<CityPredicate<'a>>,
    pub demand_driven: bool,
    pub resource_deficit_keys: Option<Vec<String>>,
    pub surplus_report: Option<&'a RefCell<AutoImprovementSurplusReport>>,
    pub civ_archetype: Option<String>,
    pub player_era: Option<f64>,
    pub is_improvement_allowed_for_civ: Option<CivGate<'a>>,
    pub priority_override: Option<Vec<String>>,
    pub food_improvement_stages: Option<FoodStages<'a>>,
    pub river_forest_clearing_only: bool,
    pub clearing_hex_keys: Option<BTreeSet<String>>,
    pub roads_pass: bool,
    pub city_limit_exhausted: bool,
    pub fort_claim_pass: bool,
    pub river_hexes_only: bool,
    pub off_river_clearing: bool,
    pub irrigation_needs_farm: bool,
    pub get_resource_pass_only_worked: Option<CityPredicate<'a>>,
    /// Web `farmPriorityOnlyWorked`: pole zadeklarowane i ustawiane w `pickAutoImprovements`, ale
    /// BEZ konsumenta w `pickAutoImprovementsSinglePass` (pin 4bbef081d) - martwe, portowane dla wiernosci.
    pub farm_priority_only_worked: Option<CityPredicate<'a>>,
}
