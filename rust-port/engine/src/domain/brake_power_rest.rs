//! P6-POWER-REST (Q1): 6 pozostalych skladnikow `computeObjectivePower` (bitwy, infrastruktura, tech,
//! ulepszenia, religia, zdobycze) - tabela zrodel wzgledem pinu 07d2fbd72 i producenci wycieci z weba
//! bez atrap: `religia` (`countCitiesWithDominantStateReligion`, culture-religion.ts:1383), `infra`
//! (`countBuildingsForOwner`, main.ts:2629) i `tech` (`countTechForOwner`, main.ts:2638). Dodatkowo czyste
//! kroki akumulatorow: `bitwy` (`battlePowerPointsFromDefeatedEnemy`) i `zdobycze`
//! (`barbarianCapturedPowerGain`) - akumulator i pelna moc ofiary zostaja po stronie wolajacego.
//!
//! `ulepszenia` przeniesiono do `brake_power_improvements` (P6-POWER-ULEPSZENIA-Q1, producent w tabeli).
//! Pozostale 2 skladniki (bitwy, zdobycze) maja jawny `NoProducer` z dowodem (plik:linia pinu
//! + brak danych w Rust). Wolajacy (W8 r4) musi podac je jawnie w `ObjectivePowerRaw`; brak cichych zer.
//!
//! Wektory: tests/p6_power_rest_vectors/vectors.json (generator tests/p6_power_rest_gen.mjs wykonuje
//! wyciete funkcje z pinu 07d2fbd72). Dominacja religii: `resource_access::society_inputs::dominant_religion`
//! (port `dominantReligion`, zweryfikowany wektorami w tym module).

use std::collections::HashSet;
use std::hash::Hash;

use crate::domain::resource_access::society_inputs::dominant_religion;
use crate::domain::territory::{DominantStatus, ReligionState};

/// Zrodlo skladnika `computeObjectivePower` (klucz = web `breakdown.key`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RestSource {
    /// Producent w tym module (funkcja czysta, wektory z pinu).
    RustProducer(&'static str),
    /// Brak producenta w Rust: powod z dowodem (plik:linia pinu, czego brakuje w Rust).
    NoProducer(&'static str),
}

/// Tabela 6 skladnikow pozostalych (P6-POWER-BITWY-ZDOBYCZE: `bitwy` i `zdobycze` maja producentow z akumulatorow stanu wojny).
pub const REST_COMPONENT_SOURCES: [(&str, RestSource); 6] = [
    (
        "bitwy",
        RestSource::RustProducer("war_turn_state::WarTurnState::battle_power_pts_for (web battlePowerPtsByOwner.get(ownerId) ?? 0, main.ts:2763; akumulator: record_battle_win = battlePowerPointsFromDefeatedEnemy, main.ts:34487-34490); wygraneBitwy = literal 0 (main.ts:2764, :2819) - Provided(0)"),
    ),
    (
        "infra",
        RestSource::RustProducer("count_buildings_for_owner (web countBuildingsForOwner, main.ts:2629; wejscia: wpisy cityBuilt + rekordy cities)"),
    ),
    (
        "tech",
        RestSource::RustProducer("count_tech_for_owner (web countTechForOwner, main.ts:2638; dlugosc zbioru po stronie wolajacego: ownerResearchedTechs / aiResearchDone)"),
    ),
    (
        "ulepszenia",
        RestSource::RustProducer("brake_power_improvements::ulepszenia_for_owner (web countImprovementsForOwner, main.ts:2643; countImprovementsForNodes main.ts:2654; statsTerritoryNodesForOwner main.ts:5657)"),
    ),
    (
        "religia",
        RestSource::RustProducer("count_cities_with_dominant_state_religion (web countCitiesWithDominantStateReligion, culture-religion.ts:1383) na resource_access::society_inputs::dominant_religion"),
    ),
    (
        "zdobycze",
        RestSource::RustProducer("war_turn_state::WarTurnState::zdobycze_power_for (web zdobyczePowerByOwner.get(ownerId) ?? 0, main.ts:2779; akumulator: record_capture_power_gain = barbarianCapturedPowerGain, main.ts:35673-35675)"),
    ),
];

/// Klucze skladnikow bez producenta (`NoProducer`) w tej tabeli (po POWER-BITWY-ZDOBYCZE: pusta lista).
pub fn rest_no_producer_keys() -> Vec<&'static str> {
    REST_COMPONENT_SOURCES
        .iter()
        .filter_map(|(k, s)| match s {
            RestSource::NoProducer(_) => Some(*k),
            RestSource::RustProducer(_) => None,
        })
        .collect()
}

/// Miasto do liczenia religii: wlasciciel + stan religii (`None` = web `{ counts: {} }`).
#[derive(Debug, Clone, Copy)]
pub struct ReligionCity<'a> {
    pub owner_id: i64,
    pub religion_state: Option<&'a ReligionState>,
}

/// Producent `religia` (web `countCitiesWithDominantStateReligion`, culture-religion.ts:1383).
/// `state_religion` = web `stateReligion` (`None` albo pusty = 0); `prog_dominacji_pct` = web
/// `religionParams.progDominacjiPct` (uzyte przez `dominantReligion`).
pub fn count_cities_with_dominant_state_religion(
    cities: &[ReligionCity<'_>],
    owner_id: i64,
    state_religion: Option<&str>,
    prog_dominacji_pct: f64,
) -> f64 {
    let Some(state_name) = state_religion.filter(|s| !s.is_empty()) else {
        return 0.0;
    };
    let empty = ReligionState::default();
    let mut n = 0.0;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let state = c.religion_state.unwrap_or(&empty);
        let dom = dominant_religion(state, prog_dominacji_pct);
        if dom.religion.as_deref() == Some(state_name) {
            n += 1.0;
        }
    }
    n
}

/// Producent `infra` (web `countBuildingsForOwner`, main.ts:2629). `city_built` = wpisy mapy `cityBuilt`
/// jako (id miasta, `blt.length`); `cities` = rekordy `cities` jako (id, ownerId). Id sa nieprzezroczystymi
/// kluczami (porownywane wylacznie przez `==`, jak `ct.id === cid` w webie). Wpis liczy sie, gdy istnieje
/// miasto o tym id i tym wlascicielu (web `cities.find`).
pub fn count_buildings_for_owner<K: PartialEq>(
    city_built: &[(K, usize)],
    cities: &[(K, i64)],
    owner_id: i64,
) -> usize {
    city_built
        .iter()
        .filter(|(cid, _)| {
            cities
                .iter()
                .any(|(id, owner)| id == cid && *owner == owner_id)
        })
        .map(|(_, n)| *n)
        .sum()
}

/// Producent `tech` (web `countTechForOwner`, main.ts:2638). `human_researched_len` = web
/// `ownerResearchedTechs(ownerId).size` (uzywane gdy `is_human`); `ai_done_len` = web
/// `aiResearchDone.get(ownerId)?.size` (`None` = brak wpisu = 0).
pub fn count_tech_for_owner(
    is_human: bool,
    human_researched_len: usize,
    ai_done_len: Option<usize>,
) -> usize {
    if is_human {
        human_researched_len
    } else {
        ai_done_len.unwrap_or(0)
    }
}

/// Liczba unikatowych elementow zbioru (JS `Set.size`) - pomocnik dla wolajacych z duplikujacymi sie wejsciami.
pub fn set_size<T: Eq + Hash>(items: impl IntoIterator<Item = T>) -> usize {
    items.into_iter().collect::<HashSet<T>>().len()
}

/// Krok czysty `zdobycze` (web `barbarianCapturedPowerGain`, capital-capture.ts:438): 0, gdy zdobywca
/// to barbarzyńca, inaczej `lost_power` (bez zmian, takze NaN).
pub fn barbarian_captured_power_gain(lost_power: f64, barb_captor: bool) -> f64 {
    if barb_captor {
        0.0
    } else {
        lost_power
    }
}

/// Krok czysty `bitwy` (web `battlePowerPointsFromDefeatedEnemy`, power-objective.ts:103): jedna wygrana =
/// `max(0, floor(m))`, a niefinityczne `m` daje 0. Sumowanie do akumulatora zostaje po stronie wolajacego.
pub fn battle_power_points_from_defeated_enemy(enemy_field_m: f64) -> f64 {
    let m = if enemy_field_m.is_finite() {
        enemy_field_m
    } else {
        0.0
    };
    m.floor().max(0.0)
}

/// Status dominacji jako tekst webowy (`none` / `mixed` / `dominant`) - do porownan z wektorami.
pub fn dominant_status_web(status: DominantStatus) -> &'static str {
    match status {
        DominantStatus::None => "none",
        DominantStatus::Mixed => "mixed",
        DominantStatus::Dominant => "dominant",
    }
}

/// Czy uzasadnienie zawiera odwolanie `plik.ts:<linia>` (format dowodu z pinu).
pub fn has_pin_file_line_ref(reason: &str) -> bool {
    reason.match_indices(".ts:").any(|(i, _)| {
        reason[i + 4..]
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_digit())
    })
}
