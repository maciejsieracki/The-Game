//! P6.8I: port `gra/src/game/auto-improvements.ts` (wspolny picker auto-ulepszen), pin `91dc998a`.
//!
//! Partia 8I-P1 (ta czesc): stale priorytetow/fokusu, progi, predykat niedoboru, raport nadwyzki
//! i `prioritiesForUlepszeniaFocus`. Partia 8I-P2 (`auto_improvements/pick.rs`): `pickAutoImprovements`.
//! Predykat reliefu (`preservesHillRelief*`, C5) w `auto_improvements/relief_preserving.rs`.
//! Dokument statusu symboli: `dyspozycje/rust-port/p6/P6-8I-AUTO-ULEPSZENIA.md`.

pub mod pick;
pub mod relief_preserving;

/// Web `UlepszeniaFocus` (`game/cities.ts:181`). ZALOZENIE: typ portowany lokalnie (cities.ts nie jest
/// jeszcze w Rust); wartosci 1:1 z web.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum UlepszeniaFocus {
    Zywnosc,
    Surowce,
    Infrastruktura,
    #[default]
    Zrownowazone,
}

/// Kolejnosc priorytetow AI / profil Zrownowazone (web `AI_IMPROVEMENT_PRIORITY`, pin :56).
/// `tartak` PRZED `oboz_lowiecki` (R-ULEPSZENIA-OBOZ-LOWIECKI-WYMAGA-TARTAKU-Q1).
pub const AI_IMPROVEMENT_PRIORITY: &[&str] = &[
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

/// Web `ULEPSZENIA_FOCUS_ZYWNOSC` (pin :73).
pub const ULEPSZENIA_FOCUS_ZYWNOSC: &[&str] = &[
    "farma",
    "bydlo",
    "owce",
    "lama",
    "tarasy",
    "tartak",
    "oboz_lowiecki",
    "lodzie_rybackie",
    "irygacja",
];

/// Web `ULEPSZENIA_ZYWNOSCIOWE` (pin :111) = `ULEPSZENIA_FOCUS_ZYWNOSC` bez `tartak`
/// (`new Set(...filter(k => k !== 'tartak'))`). Eksport bez konsumenta w pickerze (zob. raport).
pub const ULEPSZENIA_ZYWNOSCIOWE: &[&str] = &[
    "farma",
    "bydlo",
    "owce",
    "lama",
    "tarasy",
    "oboz_lowiecki",
    "lodzie_rybackie",
    "irygacja",
];

/// Web `ULEPSZENIA_FOCUS_SUROWCE` (pin, prywatna stala).
pub const ULEPSZENIA_FOCUS_SUROWCE: &[&str] = &[
    "tartak",
    "kamieniolom",
    "glinianka",
    "kopalnia_miedzi",
    "kopalnia_zelaza",
    "kopalnia_cyny",
    "stadnina",
    "warzelnia_soli",
];

/// Web `ULEPSZENIA_FOCUS_INFRASTRUKTURA` (pin, prywatna stala).
pub const ULEPSZENIA_FOCUS_INFRASTRUKTURA: &[&str] =
    &["posterunek", "droga", "droga_brukowana", "fort"];

/// Web `ULEPSZENIA_FOCUS_ZROWNOWAZONE` = `AI_IMPROVEMENT_PRIORITY` (pin, prywatna stala).
pub const ULEPSZENIA_FOCUS_ZROWNOWAZONE: &[&str] = AI_IMPROVEMENT_PRIORITY;

/// Web `ZERO_YIELD_IMPROVEMENTS` (pin :148): ulepszenia o zerowej delcie `tileYield`.
pub const ZERO_YIELD_IMPROVEMENTS: &[&str] = &["posterunek", "fort"];

/// Web `JEDEN_NA_ILU_OBYWATELI` (pin :166).
pub const JEDEN_NA_ILU_OBYWATELI: f64 = 10.0;

/// Web `WYRAB_MIN_FOREST_IN_RADIUS` (pin :169).
pub const WYRAB_MIN_FOREST_IN_RADIUS: f64 = 3.0;

/// Web `AUTO_ULEPSZENIA_PRACA_RESERVE` (pin :172).
pub const AUTO_ULEPSZENIA_PRACA_RESERVE: f64 = 30.0;

/// Web `hasNonFoodResourceDeficit` (pin :191). `None` = pole nieobecne (`undefined`).
/// Klucz `zywnosc` jest ignorowany; kazdy inny niedobor = `true`.
pub fn has_non_food_resource_deficit(deficit_keys: Option<&[String]>) -> bool {
    match deficit_keys {
        None => false,
        Some(keys) => keys.iter().any(|k| k != "zywnosc"),
    }
}

/// Web `AutoImprovementSurplusReport` (pin :203).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct AutoImprovementSurplusReport {
    pub demand_active: bool,
    pub deficit_active: bool,
    pub any_candidate: bool,
    pub surplus: bool,
}

/// Web `freshSurplusReport` (pin :215).
pub fn fresh_surplus_report() -> AutoImprovementSurplusReport {
    AutoImprovementSurplusReport::default()
}

/// Web `prioritiesForUlepszeniaFocus` (pin :220). `skip_wyrab` filtruje `wyrab`.
pub fn priorities_for_ulepszenia_focus(
    focus: UlepszeniaFocus,
    skip_wyrab: bool,
) -> Vec<&'static str> {
    let list: &[&'static str] = match focus {
        UlepszeniaFocus::Zywnosc => ULEPSZENIA_FOCUS_ZYWNOSC,
        UlepszeniaFocus::Surowce => ULEPSZENIA_FOCUS_SUROWCE,
        UlepszeniaFocus::Infrastruktura => ULEPSZENIA_FOCUS_INFRASTRUKTURA,
        UlepszeniaFocus::Zrownowazone => ULEPSZENIA_FOCUS_ZROWNOWAZONE,
    };
    list.iter()
        .copied()
        .filter(|k| !(skip_wyrab && *k == "wyrab"))
        .collect()
}
