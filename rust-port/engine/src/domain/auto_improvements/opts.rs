//! P6.8I (8I-P1): typy wejscia/wyjscia pickera auto-ulepszen (`AutoImprovementCity`,
//! `AutoImprovementPick`, `AutoImprovementSurplusReport`, `PickAutoImprovementsOpts`).
//!
//! REPIN-AUTOIMPROVE (R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1): web usunal `getOnlyWorked`,
//! `getResourcePassOnlyWorked`, `farmPriorityOnlyWorked`, `maxItemsPerCity`, `getSkipWyrab` i pole miasta
//! `ulepszeniaOnlyWorked` (hunki 6, 17, 19, 22, 29, 37, 43, 45, 49 i LIM) - odpowiadajace pola Rust usuniete.
//! Dodane: `river_clear_no_citizen_*` (wycinka rzeczna bez obywatela) i `road_plan_memo` (plan drog MST).
//!
//! Domkniecia webowe (`getFocus`, ...) to `Option<&dyn Fn>`; `surplusReport` (obiekt
//! wypelniany W MIEJSCU przez wolajacego) to `Option<&RefCell<..>>`. `Clone` kopiuje wskazniki, tak jak
//! `{ ...opts }` w webowym `after()`.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;

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

/// Web `AutoImprovementSurplusReport` (+ `filterWaitingKeys`, hunk 9/10: klucze `q,r` heksow, ktore
/// odpadly WYLACZNIE przez regule obywateli; wypelniane tylko gdy `!any_candidate`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AutoImprovementSurplusReport {
    pub demand_active: bool,
    pub deficit_active: bool,
    pub any_candidate: bool,
    pub surplus: bool,
    pub filter_waiting_keys: BTreeSet<String>,
}

/// Web `roadPlanMemo` (`{ cities, plan? }`): pamiec planu sieci drog wspolna dla WSZYSTKICH przebiegow jednego
/// wywolania `pickAutoImprovements` (plan liczony leniwie, raz na wywolanie). Tworzy ja wylacznie
/// `pick_auto_improvements`; wolajacy nie podaja.
#[derive(Debug, Clone, Default)]
pub struct RoadPlanMemo {
    pub cities: Vec<AutoImprovementCity>,
    pub plan: Option<BTreeSet<String>>,
}

/// Web `foodImprovementStages?: boolean | ((city) => boolean)`.
#[derive(Clone, Copy)]
pub enum FoodStages<'a> {
    Flag(bool),
    PerCity(&'a dyn Fn(&AutoImprovementCity) -> bool),
}

/// Predykat per miasto (`foodImprovementStages` per miasto).
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
    pub get_worked_hex_keys: Option<WorkedKeysFn<'a>>,
    pub praca_budget_percent: Option<f64>,
    pub improvement_budget_cap: Option<f64>,
    pub get_praca_budget_percent: Option<&'a dyn Fn(&AutoImprovementCity) -> f64>,
    pub praca_surplus_threshold: Option<f64>,
    pub skip_wyrab: bool,
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
    /// Web `riverClearNoCitizenPass` (internal): OSTATNI przebieg - wycinka lasu przy rzece na heksie BEZ obywatela.
    pub river_clear_no_citizen_pass: bool,
    /// Web `riverClearNoCitizenMaxPerCity` (domyslnie `RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY`).
    pub river_clear_no_citizen_max_per_city: Option<f64>,
    /// Web `riverClearNoCitizenPoolFloor` (domyslnie `RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR`).
    pub river_clear_no_citizen_pool_floor: Option<f64>,
    /// Web `roadPlanMemo` (internal; ustawia `pick_auto_improvements`).
    pub road_plan_memo: Option<Rc<RefCell<RoadPlanMemo>>>,
}
