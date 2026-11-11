//! P6-POWER-REST (Q1): 6 pozostalych skladnikow `computeObjectivePower` (bitwy, infrastruktura, tech,
//! ulepszenia, religia, zdobycze) - tabela zrodel wzgledem pinu 07d2fbd72 i jedyny producent, ktory
//! da sie wyciac z weba bez atrap: `religia` (`countCitiesWithDominantStateReligion`, culture-religion.ts:1383).
//!
//! Pozostale 5 skladnikow ma jawny `NoProducer` z dowodem (plik:linia pinu + brak danych w Rust).
//! Wolajacy (W8 r4) musi podac je jawnie w `ObjectivePowerRaw`; brak cichych zer.
//!
//! Wektory: tests/p6_power_rest_vectors/vectors.json (generator tests/p6_power_rest_gen.mjs wykonuje
//! wyciete funkcje z pinu 07d2fbd72). Dominacja religii: `resource_access::society_inputs::dominant_religion`
//! (port `dominantReligion`, zweryfikowany wektorami w tym module).

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

/// Tabela 6 skladnikow pozostalych (NIE_ZMIERZONO tam, gdzie brak producenta).
pub const REST_COMPONENT_SOURCES: [(&str, RestSource); 6] = [
    (
        "bitwy",
        RestSource::NoProducer("web battlePowerPtsByOwner (main.ts:2254, zapis main.ts:34490 = floor(sumRosterFieldM(przegrany))) - akumulator stanu walk; Rust nie ma zapisu zwyciestw ani portu armyFieldPower (unit-power.ts:182) / sumRosterFieldM (auto-battle-power.ts:50)"),
    ),
    (
        "infra",
        RestSource::NoProducer("web countBuildingsForOwner (main.ts:2629) - domkniecie nad cityBuilt/cities, bez wycinka pure; Rust ma city_buildings tylko w kontekscie ai_turn.rs, nie w PlayableState/WarTurnState"),
    ),
    (
        "tech",
        RestSource::NoProducer("web countTechForOwner (main.ts:2638) - domkniecie: isHuman, ownerResearchedTechs (main.ts:34979, playerStateByHuman.zbadane / aiResearchDone); Rust player_zbadane tylko w turn_economy_wire, nie w PlayableState"),
    ),
    (
        "ulepszenia",
        RestSource::NoProducer("web countImprovementsForOwner (main.ts:2643) - domkniecie: statsTerritoryNodesForOwner (main.ts:5657), hudPureScope, improvementKeysForHex, hexKeysWithinRadius; brak portu tej sumy w Rust"),
    ),
    (
        "religia",
        RestSource::RustProducer("resource_access::society_inputs::dominant_religion + count_cities_with_dominant_state_religion"),
    ),
    (
        "zdobycze",
        RestSource::NoProducer("web zdobyczePowerByOwner (zapis main.ts:35675 = barbarianCapturedPowerGain(buildObjectivePowerForOwner(ofiara).power)) - zalezy od PELNEJ mocy ofiary (4 skladniki NoProducer powyzej) i od akumulatora zdarzen eliminacji; brak w Rust"),
    ),
];

/// Klucze skladnikow bez producenta (`NoProducer`) w tej tabeli.
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

/// Status dominacji jako tekst webowy (`none` / `mixed` / `dominant`) - do porownan z wektorami.
pub fn dominant_status_web(status: DominantStatus) -> &'static str {
    match status {
        DominantStatus::None => "none",
        DominantStatus::Mixed => "mixed",
        DominantStatus::Dominant => "dominant",
    }
}
