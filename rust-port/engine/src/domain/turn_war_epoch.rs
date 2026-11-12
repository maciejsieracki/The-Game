//! P6-WIRE-WAR-EPOKA (W8 r6, klocek 1): producent epoki wlasciciela dla fazy Diplomacy.
//!
//! Port 1:1 funkcji decyzyjnej weba (pin 07d2fbd72, tylko odczyt, `gra/src/main.ts`):
//! - `ERA_ID_TO_NUM` / `eraNumberFromEpochId` (main.ts:2402-2405): `{kamien:1, braz:2, zelazo:3}`, reszta `?? 1`,
//! - `gameStartEra()` (main.ts:2415-2417): `eraNumberFromEpochId(_menuEpochId || 'kamien')`,
//! - `empireEpochForOwner(ownerId)` (main.ts:2419-2422): czlowiek -> `playerStateByHuman.get(id)!.era`
//!   (brak wpisu = wyjatek weba, tu `HumanEraMissing`), AI -> `ownerEraByOwner.get(id) ?? gameStartEra()`.
//!
//! Decyzja techniczna orkiestratora (wariant A, zgodnosc z pinem): wlasciciel AI bez wpisu w
//! `ownerEraByOwner` dostaje `gameStartEra()` - to JAWNA, nazwana zrodlem (`EpochSource`) zgodnosc z webem,
//! nie ciche podstawienie. `PlayableState` NIE niesie badan ani epoki per wlasciciel (brak `zbadane`,
//! `aiResearchDone`, `ownerEraByOwner`), wiec:
//! - AI: web `setupAiOwnerEpoch` (main.ts:2582) ustawia `ownerEraByOwner = startEra` i `syncOwnerEraFromResearch`
//!   przy samych wczesniejszych tech zwraca `startEra`; bez symulacji badan zadna inna wartosc nie jest osiagalna,
//! - czlowiek: `reconcilePlayerEraFromResearch` (main.ts:2521) przy braku badan epoki startu zwraca `startEra`
//!   (`computeMainCivEraFromResearch`, owner-epoch.ts:112: petla awansu wymaga `allEraTechsResearched`).
//!
//! Zrodla wartosci sa jawne (`EpochSource`): czlowiek = `DerivedFromStartEra` (zalozenie z epoki startu,
//! NIE odczyt wpisu stanu), AI bez wpisu = `FallbackGameStartEra`. Zadna wartosc nie jest `Tracked` w produkcji.
//!
//! ZNANA LUKA (KNOWN_GAPS[0], `turn_war_inputs`): epoka jest STATYCZNA miedzy turami. Web zmienia epoke
//! wlasciciela przy awansie badan (`syncOwnerEraFromResearch` dla AI, `reconcilePlayerEraFromResearch`
//! main.ts:2521 dla czlowieka); `PlayableState` nie ma badan, wiec `advance_turn` nie awansuje epoki.
//! Test `owner_epochs_are_static_across_turns_known_gap` (p6_wire_war_epoch.rs) utrwala to zachowanie.
//!
//! Gdy `PlayableState` dostanie realne dane epoki per wlasciciel, wystarczy wypelnic `OwnerEraFacts` - funkcja
//! decyzyjna `empire_epoch_for_owner` pozostaje bez zmian.

use std::collections::{BTreeMap, BTreeSet};

use super::playable::PlayableState;

/// Web `ERA_ID_TO_NUM` (main.ts:2402).
pub const ERA_ID_TO_NUM: [(&str, f64); 3] = [("kamien", 1.0), ("braz", 2.0), ("zelazo", 3.0)];

/// Web `eraNumberFromEpochId` (main.ts:2404): dokladne dopasowanie klucza (bez trim/lowercase), `?? 1`.
pub fn era_number_from_epoch_id(epoch_id: &str) -> f64 {
    ERA_ID_TO_NUM
        .iter()
        .find(|(id, _)| *id == epoch_id)
        .map_or(1.0, |&(_, n)| n)
}

/// Web `gameStartEra()` (main.ts:2415): `_menuEpochId || 'kamien'` (pusty lancuch = `kamien`).
pub fn game_start_era(menu_epoch_id: &str) -> f64 {
    era_number_from_epoch_id(if menu_epoch_id.is_empty() {
        "kamien"
    } else {
        menu_epoch_id
    })
}

/// Zrodlo epoki wlasciciela (jawnosc: skad wziela sie wartosc).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EpochSource {
    /// Wpis stanu (`playerStateByHuman.era` albo `ownerEraByOwner`).
    Tracked,
    /// Web `?? gameStartEra()` dla AI bez wpisu w `ownerEraByOwner` (zgodnosc z pinem, wariant A).
    FallbackGameStartEra,
    /// Czlowiek bez wpisu badan w `PlayableState`: epoka = epoka startu wyprowadzona z `params.epoch_id`
    /// (NIE odczyt `playerStateByHuman.era`). Brak badan = brak awansu, wiec to zalozenie, nie stan.
    DerivedFromStartEra,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OwnerEpochError {
    /// Web `playerStateByHuman.get(id)!` rzuca, gdy czlowiek nie ma stanu gracza.
    HumanEraMissing(i64),
}

impl std::fmt::Display for OwnerEpochError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::HumanEraMissing(id) => {
                write!(f, "epoka wlasciciela {id}: czlowiek bez stanu gracza (era)")
            }
        }
    }
}

impl std::error::Error for OwnerEpochError {}

/// Dane stanu, z ktorych web czyta epoke (ID w jednej przestrzeni, tu Rust).
#[derive(Debug, Clone, PartialEq)]
pub struct OwnerEraFacts {
    /// `isHuman(id)`.
    pub human_ids: BTreeSet<i64>,
    /// `playerStateByHuman.get(id).era` wraz ze zrodlem wartosci (`Tracked` = odczyt wpisu,
    /// `DerivedFromStartEra` = zalozenie z epoki startu, gdy `PlayableState` nie niesie badan).
    pub human_era: BTreeMap<i64, (f64, EpochSource)>,
    /// `ownerEraByOwner`.
    pub owner_era_by_owner: BTreeMap<i64, f64>,
}

/// Web `empireEpochForOwner(ownerId)` (main.ts:2419) z jawnym zrodlem wartosci.
pub fn empire_epoch_for_owner(
    owner_id: i64,
    facts: &OwnerEraFacts,
    game_start_era: f64,
) -> Result<(f64, EpochSource), OwnerEpochError> {
    if facts.human_ids.contains(&owner_id) {
        // Dla faktow z `owner_era_facts` ta galaz jest nieosiagalna (kazdy czlowiek ma wpis, test
        // `production_human_era_covers_every_human`); `HumanEraMissing` pokrywa wstrzyknione fakty.
        return facts
            .human_era
            .get(&owner_id)
            .copied()
            .ok_or(OwnerEpochError::HumanEraMissing(owner_id));
    }
    Ok(match facts.owner_era_by_owner.get(&owner_id) {
        Some(&e) => (e, EpochSource::Tracked),
        None => (game_start_era, EpochSource::FallbackGameStartEra),
    })
}

/// Fakty epoki z `PlayableState`: stan NIE niesie badan ani epoki per wlasciciel (patrz naglowek), wiec
/// `ownerEraByOwner` jest pusty (AI -> jawny fallback), a czlowiek ma epoke startu (brak badan = brak awansu).
pub fn owner_era_facts(state: &PlayableState) -> OwnerEraFacts {
    let start = game_start_era(&state.params.epoch_id);
    let human_ids: BTreeSet<i64> = state
        .players
        .iter()
        .filter(|p| p.is_human)
        .map(|p| p.id.get() as i64)
        .collect();
    let human_era = human_ids
        .iter()
        .map(|&id| (id, (start, EpochSource::DerivedFromStartEra)))
        .collect();
    OwnerEraFacts {
        human_ids,
        human_era,
        owner_era_by_owner: BTreeMap::new(),
    }
}

/// Epoki (i zrodla) dla podanych wlascicieli.
pub fn epochs_with_sources(
    state: &PlayableState,
    owner_ids: &BTreeSet<i64>,
) -> Result<BTreeMap<i64, (f64, EpochSource)>, OwnerEpochError> {
    let facts = owner_era_facts(state);
    let start = game_start_era(&state.params.epoch_id);
    owner_ids
        .iter()
        .map(|&id| empire_epoch_for_owner(id, &facts, start).map(|r| (id, r)))
        .collect()
}
