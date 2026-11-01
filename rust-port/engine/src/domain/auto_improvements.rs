//! P6.8I: port `gra/src/game/auto-improvements.ts` (wspolny picker auto-ulepszen) z PINA `4bbef081d`.
//!
//! Partia 8I-P1 (ten plik): stale, listy priorytetow, typy i male helpery (`AI_IMPROVEMENT_PRIORITY`,
//! `prioritiesForUlepszeniaFocus`, `deficitImprovementKeys`, `isCityLimitExhausted`, ...).
//! Partia 8I-P2a `fort_claim` (E-FORT), 8I-P2b `single_pass` + `city_phases` + `hex_phases`
//! (`pickAutoImprovementsSinglePass`), 8I-P2c `pick` (`pickAutoImprovements`: etapy E1-E6, krok niedoboru, forty, drogi).
//! 8I-P3 `relief_preserving` (predykat reliefu, zamyka C5 w LEDGER).
//!
//! ZALOZENIA (pelna lista: `dyspozycje/rust-port/p6/P6-8I-AUTO-ULEPSZENIA.md`):
//! - Klucze ulepszen to `&str`/`String` (web: unia stringow), jak w `improvement_build.rs`.
//! - Porownania i `Math.max/min` zachowuja semantyke JS dla NaN (`js_max`/`js_min`).
//! - Brak portu: klucz niedoboru o nazwie wlasciwosci `Object.prototype` (web rzuca `TypeError`).

pub mod city_phases;
pub mod fort_claim;
pub mod hex_phases;
pub mod opts;
pub mod pick;
pub mod relief_preserving;
pub mod single_pass;

use std::cmp::Ordering;

pub use opts::{
    AutoImprovementCity, AutoImprovementPick, AutoImprovementSurplusReport, FoodStages,
    PickAutoImprovementsOpts, UlepszeniaFocus,
};
pub use pick::pick_auto_improvements;

/// Web `AI_IMPROVEMENT_PRIORITY`: kolejnosc priorytetow AI / profil Zrownowazone (`tartak` PRZED
/// `oboz_lowiecki`, `wyrab` na koncu).
pub const AI_IMPROVEMENT_PRIORITY: [&str; 21] = [
    "farma",
    "bydlo",
    "owce",
    "lama",
    "tarasy",
    "tartak",
    "oboz_lowiecki",
    "lodzie_rybackie",
    "irygacja",
    "kopalnia_miedzi",
    "kopalnia_cyny",
    "kopalnia_zelaza",
    "kamieniolom",
    "glinianka",
    "stadnina",
    "warzelnia_soli",
    "posterunek",
    "droga",
    "droga_brukowana",
    "fort",
    "wyrab",
];

/// Web `ULEPSZENIA_FOCUS_ZYWNOSC` (bez tartaku i obozu lowieckiego).
pub const ULEPSZENIA_FOCUS_ZYWNOSC: [&str; 7] = [
    "farma",
    "bydlo",
    "owce",
    "lama",
    "tarasy",
    "lodzie_rybackie",
    "irygacja",
];

/// Web `FOREST_BUILDING_KEYS`: tartak i oboz lowiecki (filtr bezpieczenstwa profilu Zywnosc).
pub const FOREST_BUILDING_KEYS: [&str; 2] = ["tartak", "oboz_lowiecki"];

/// Web `ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE` = `ULEPSZENIA_FOCUS_ZYWNOSC` + `oboz_lowiecki`; to ten sam
/// zbior co eksport `ULEPSZENIA_ZYWNOSCIOWE` (web: `Set`).
pub const ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE: [&str; 8] = [
    "farma",
    "bydlo",
    "owce",
    "lama",
    "tarasy",
    "lodzie_rybackie",
    "irygacja",
    "oboz_lowiecki",
];

/// Web `ULEPSZENIA_ZYWNOSCIOWE` (zbior; kolejnosc iteracji = kolejnosc wstawienia).
pub const ULEPSZENIA_ZYWNOSCIOWE: [&str; 8] = ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE;

/// Web `ULEPSZENIA_FOCUS_SUROWCE`.
pub const ULEPSZENIA_FOCUS_SUROWCE: [&str; 8] = [
    "tartak",
    "kamieniolom",
    "glinianka",
    "kopalnia_miedzi",
    "kopalnia_zelaza",
    "kopalnia_cyny",
    "stadnina",
    "warzelnia_soli",
];

/// Web `ULEPSZENIA_FOCUS_INFRASTRUKTURA`.
pub const ULEPSZENIA_FOCUS_INFRASTRUKTURA: [&str; 4] =
    ["posterunek", "droga", "droga_brukowana", "fort"];

/// Web `ZERO_YIELD_IMPROVEMENTS` (zbior).
pub const ZERO_YIELD_IMPROVEMENTS: [&str; 2] = ["posterunek", "fort"];

/// Web `JEDEN_NA_ILU_OBYWATELI`.
pub const JEDEN_NA_ILU_OBYWATELI: f64 = 10.0;

/// Web `WYRAB_MIN_FOREST_IN_RADIUS`.
pub const WYRAB_MIN_FOREST_IN_RADIUS: f64 = 3.0;

/// Web `AUTO_ULEPSZENIA_PRACA_RESERVE`.
pub const AUTO_ULEPSZENIA_PRACA_RESERVE: f64 = 30.0;

/// Web `FOOD_STAGE_MAX_ITEMS_PER_CITY` (`Infinity`: limit zdjety, S3-2=C).
pub const FOOD_STAGE_MAX_ITEMS_PER_CITY: f64 = f64::INFINITY;

/// Web `FOOD_LIVESTOCK_STAGE_KEYS`.
pub const FOOD_LIVESTOCK_STAGE_KEYS: [&str; 3] = ["bydlo", "owce", "lama"];

/// Web `RIVER_DEVELOPMENT_KEYS`.
pub const RIVER_DEVELOPMENT_KEYS: [&str; 6] =
    ["farma", "bydlo", "owce", "lama", "irygacja", "tarasy"];

/// Web `ROAD_KEYS` (`ROAD_KEY_SET` = ten sam zbior).
pub const ROAD_KEYS: [&str; 2] = ["droga", "droga_brukowana"];

/// Web `FORT_CLAIM_MIN_NEW_HEXES`.
pub const FORT_CLAIM_MIN_NEW_HEXES: f64 = 1.0;

/// Web `FORT_CLAIM_KEYS`: fort (r=5) preferowany, posterunek (r=3) gdy fort niedostepny.
pub const FORT_CLAIM_KEYS: [&str; 2] = ["fort", "posterunek"];

/// Web `FoodStageDef` (`id` tylko opis diagnostyczny).
#[derive(Debug, Clone, Copy)]
pub struct FoodStageDef {
    pub id: &'static str,
    pub keys: &'static [&'static str],
    pub river_hexes_only: bool,
    pub river_forest_clearing_only: bool,
    pub off_river_clearing: bool,
}

/// Web `FOOD_STAGES` (E1...E6, kolejnosc wiazaca).
pub const FOOD_STAGES: [FoodStageDef; 6] = [
    FoodStageDef {
        id: "E1",
        keys: &["farma"],
        river_hexes_only: true,
        river_forest_clearing_only: false,
        off_river_clearing: false,
    },
    FoodStageDef {
        id: "E2",
        keys: &["wyrab"],
        river_hexes_only: false,
        river_forest_clearing_only: true,
        off_river_clearing: false,
    },
    FoodStageDef {
        id: "E3",
        keys: &FOOD_LIVESTOCK_STAGE_KEYS,
        river_hexes_only: false,
        river_forest_clearing_only: false,
        off_river_clearing: false,
    },
    FoodStageDef {
        id: "E4",
        keys: &["irygacja", "tarasy"],
        river_hexes_only: false,
        river_forest_clearing_only: false,
        off_river_clearing: false,
    },
    FoodStageDef {
        id: "E5",
        keys: &["wyrab", "farma"],
        river_hexes_only: false,
        river_forest_clearing_only: false,
        off_river_clearing: true,
    },
    FoodStageDef {
        id: "E6",
        keys: &["oboz_lowiecki", "lodzie_rybackie", "warzelnia_soli"],
        river_hexes_only: false,
        river_forest_clearing_only: false,
        off_river_clearing: false,
    },
];

/// Web `IMPROVEMENT_FOR_DEFICIT` (kolejnosc wpisow = kolejnosc literalu).
pub const IMPROVEMENT_FOR_DEFICIT: [(&str, &[&str]); 8] = [
    ("drewno", &["tartak", "wyrab"]),
    ("kamien", &["kamieniolom"]),
    ("glina", &["glinianka"]),
    ("ruda", &["kopalnia_miedzi"]),
    ("ruda_zelaza", &["kopalnia_zelaza"]),
    ("ruda_cyny", &["kopalnia_cyny"]),
    ("sol", &["warzelnia_soli"]),
    ("kon", &["stadnina"]),
];

/// Web `Math.max` (propaguje NaN, w odroznieniu od `f64::max`).
pub(crate) fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else {
        b
    }
}

/// Web `Math.min` (propaguje NaN, w odroznieniu od `f64::min`).
pub(crate) fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else {
        b
    }
}

/// Porownanie napisow jak JS `<`/`>` (jednostki UTF-16, nie bajty UTF-8).
pub(crate) fn cmp_js_str(a: &str, b: &str) -> Ordering {
    a.encode_utf16().cmp(b.encode_utf16())
}

/// Web `hasNonFoodResourceDeficit`: jest niedobor surowca innego niz zywnosc.
pub fn has_non_food_resource_deficit(deficit_keys: Option<&[String]>) -> bool {
    match deficit_keys {
        None => false,
        Some(keys) => keys.iter().any(|k| k != "zywnosc"),
    }
}

/// Web `freshSurplusReport`.
pub fn fresh_surplus_report() -> AutoImprovementSurplusReport {
    AutoImprovementSurplusReport::default()
}

/// Web `prioritiesForUlepszeniaFocus`: lista typow ulepszen wg profilu (opcjonalnie bez `wyrab`).
pub fn priorities_for_ulepszenia_focus(focus: UlepszeniaFocus, skip_wyrab: bool) -> Vec<String> {
    let list: &[&str] = match focus {
        UlepszeniaFocus::Zywnosc => &ULEPSZENIA_FOCUS_ZYWNOSC,
        UlepszeniaFocus::Surowce => &ULEPSZENIA_FOCUS_SUROWCE,
        UlepszeniaFocus::Infrastruktura => &ULEPSZENIA_FOCUS_INFRASTRUKTURA,
        UlepszeniaFocus::Zrownowazone | UlepszeniaFocus::Other => &AI_IMPROVEMENT_PRIORITY,
    };
    list.iter()
        .filter(|k| !skip_wyrab || **k != "wyrab")
        .map(|k| (*k).to_owned())
        .collect()
}

fn improvements_for_deficit(key: &str) -> &'static [&'static str] {
    IMPROVEMENT_FOR_DEFICIT
        .iter()
        .find(|(k, _)| *k == key)
        .map_or(&[], |(_, v)| *v)
}

/// Web `deficitImprovementKeys`: ulepszenia produkujace BRAKUJACE surowce (bez `wyrab`).
pub fn deficit_improvement_keys(deficit_keys: Option<&[String]>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for key in deficit_keys.unwrap_or(&[]) {
        for imp in improvements_for_deficit(key) {
            if *imp != "wyrab" && !out.iter().any(|o| o == imp) {
                out.push((*imp).to_owned());
            }
        }
    }
    out
}

/// Web `actionableDeficitKeys`: niedobory, na ktore istnieje ulepszenie terenu.
pub fn actionable_deficit_keys(deficit_keys: Option<&[String]>) -> Vec<String> {
    deficit_keys
        .unwrap_or(&[])
        .iter()
        .filter(|k| !deficit_improvement_keys(Some(std::slice::from_ref(*k))).is_empty())
        .cloned()
        .collect()
}

/// Web `isCityLimitExhausted`: `owner_cities` = `foundedByOwner` kazdego miasta (`None` = brak pola).
/// Limit = `base + (max(1, era ?? 1) - 1) * 5`; licza sie miasta z `foundedByOwner !== false`.
pub fn is_city_limit_exhausted(
    owner_cities: &[Option<bool>],
    city_limit_base: Option<f64>,
    owner_era: Option<f64>,
) -> bool {
    let Some(base) = city_limit_base.filter(|b| b.is_finite()) else {
        return false;
    };
    let limit = base + (js_max(1.0, owner_era.unwrap_or(1.0)) - 1.0) * 5.0;
    let founded = owner_cities.iter().filter(|c| **c != Some(false)).count() as f64;
    founded >= limit
}

/// Promien terytorium wezla wg PINA `4bbef081d` (`territory.ts`: fort r=5, posterunek r=3, miasto z
/// populacji). ZALOZENIE: `terrain::city_territory_radius` czyta jeszcze stare 10/5 z
/// `data/terrain-improvements.json` (repin terytorium poza allowlista tego tematu), wiec picker
/// uzywa stalych pinu lokalnie; dla miast wynik jest tozsamy z `terrain::city_territory_radius`.
pub const FORT_TERRITORY_RADIUS_PIN: f64 = 5.0;
/// Patrz `FORT_TERRITORY_RADIUS_PIN` (posterunek r=3).
pub const OUTPOST_TERRITORY_RADIUS_PIN: f64 = 3.0;

/// Web `cityTerritoryRadius` z pinu `4bbef081d`.
pub fn territory_radius_pin(node: &crate::domain::terrain::CityNode) -> f64 {
    if node.is_fort == Some(true) {
        return FORT_TERRITORY_RADIUS_PIN;
    }
    if node.is_outpost == Some(true) {
        return OUTPOST_TERRITORY_RADIUS_PIN;
    }
    crate::domain::terrain::city_range_for_population(node.pop)
}
