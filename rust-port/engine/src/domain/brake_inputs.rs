//! P6-BRAKE-INPUTS (W8 podzial 2/3): czyste producenty wejsc `BrakePhaseInput` z danych stanu.
//!
//! Kazda funkcja jest czysta: dostaje juz wyciagniete fakty (mapy, zbiory, domkniecia) i zwraca
//! wejscie fazy. Nie czyta `PlayableState` ani `WarTurnState` bezposrednio; wolajacy (W8 r3) buduje
//! fakty z `WarTurnState` (klucze `rust*`, zrodlo prawdy dla magazynow dyplomacji i wojny).
//!
//! Pokryte (web, pin 07d2fbd72 `gra/src/main.ts`):
//! - `is_peace_locked_between` / `peace_locked_set`: `isPeaceLockedBetween` (l.11817),
//! - `crisis_war_gate_blocked` / `gate_blocked_set`: `diploCrisisWarGateBlocked` (l.11632),
//! - `contacts_for`: `getDiplomaticContacts` (l.22523) bez gracza,
//! - `phase_owners`: `diploOwnerEligibleForBrake` (l.11590) + `allPowerOwnerIds` (l.19124),
//! - `power_map`: adapter na `objectivePowerForOwner` (l.2874). NIE_PORTOWANE: `computeObjectivePower`
//!   (web l.2759) nie ma odpowiednika w Rust; `power_map` przyjmuje gotowa funkcje mocy od wolajacego.

use std::collections::{BTreeMap, BTreeSet};

use super::ai_diplomacy_turn::{pair_key, PairKey, PhaseOwner};
use super::diplomacy_multiwar_gate::{
    evaluate_inter_civ_war_gate, InterCivWarGateInput, WarGateReason,
};
use super::diplomacy_tick_war_brake::AiAiOwnerInfo;
use super::diplomacy_truce::{is_peace_treaty_locked, PairMetaWeb};
use super::war_forced_common::is_forced_era_peace_locked;

/// Web `forcedEraPeaceUntilNextEraByPairKey`: wpis `{ ownerId, era }`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ForcedEraLock {
    pub owner_id: i64,
    pub era: i64,
}

/// Web `isPeaceLockedBetween(a, b)`: blokada z wojny epoki (gdy epoka wlasciciela wciaz <= epoki wojny)
/// LUB karencja pokoju z traktatu (`isPeaceTreatyLocked`). `current_epoch` = `empireEpochForOwner`.
pub fn is_peace_locked_between(
    a: i64,
    b: i64,
    forced_era_locks: &BTreeMap<PairKey, ForcedEraLock>,
    current_epoch: impl Fn(i64) -> i64,
    meta: Option<&PairMetaWeb>,
    turn: f64,
) -> bool {
    let key = pair_key(a, b);
    let until_next_era = forced_era_locks
        .get(&key)
        .is_some_and(|lock| is_forced_era_peace_locked(current_epoch(lock.owner_id), lock.era));
    until_next_era || is_peace_treaty_locked(meta, turn)
}

/// Zbior par zablokowanych pokojem sposrod `pairs` (wejscie `BrakePhaseInput::peace_locked`).
pub fn peace_locked_set(
    pairs: &[PairKey],
    forced_era_locks: &BTreeMap<PairKey, ForcedEraLock>,
    current_epoch: impl Fn(i64) -> i64,
    meta_by_pair: &BTreeMap<PairKey, PairMetaWeb>,
    turn: f64,
) -> BTreeSet<PairKey> {
    pairs
        .iter()
        .copied()
        .filter(|&(a, b)| {
            is_peace_locked_between(
                a,
                b,
                forced_era_locks,
                &current_epoch,
                meta_by_pair.get(&(a, b)),
                turn,
            )
        })
        .collect()
}

/// Fakty wlasciciela potrzebne do bramki R1/R2 (web: `empireEpochForOwner`, `countActiveWarsForOwnerExcludingBarbarians`, `isHuman`).
/// `era` = wynik `empireEpochForOwner` (web: liczba calkowita; f64 bez utraty dla malych wartosci).
/// `is_player` = `isHuman(victim)` (web l.11642, `targetIsPlayer`) - OSOBNE zrodlo niz `isMe` w
/// `OwnerFacts`/`phase_owners`; web uzywa obu funkcji w roznych miejscach, port zachowuje to rozdzielenie.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GateFacts {
    pub era: f64,
    pub war_count: i64,
    pub is_player: bool,
}

/// Web `diploCrisisWarGateBlocked(declarer, victim)`: bramka wylaczona (`isWarRulesMultiwarEnabled` = false)
/// => nigdy nie blokuje. Brak `era_tag` (zwykle wypowiedzenie, R1 obowiazuje).
pub fn crisis_war_gate_blocked(
    multiwar_enabled: bool,
    turn: f64,
    declarer: GateFacts,
    victim: GateFacts,
) -> bool {
    if !multiwar_enabled {
        return false;
    }
    evaluate_inter_civ_war_gate(&InterCivWarGateInput {
        turn,
        attacker_era: declarer.era,
        attacker_war_count: declarer.war_count,
        target_is_player: victim.is_player,
        target_era: victim.era,
        target_war_count: victim.war_count,
        era_tag: None,
    }) != WarGateReason::Ok
}

/// Zbior `(declarer, victim)` zablokowanych bramka dla wszystkich par w obu kierunkach
/// (wejscie `BrakePhaseInput::gate_blocked`). Pary bez faktow wlasciciela sa pomijane.
pub fn gate_blocked_set(
    multiwar_enabled: bool,
    turn: f64,
    pairs: &[PairKey],
    facts: &BTreeMap<i64, GateFacts>,
) -> BTreeSet<(i64, i64)> {
    let mut out = BTreeSet::new();
    for &(a, b) in pairs {
        let (Some(&fa), Some(&fb)) = (facts.get(&a), facts.get(&b)) else {
            continue;
        };
        if crisis_war_gate_blocked(multiwar_enabled, turn, fa, fb) {
            out.insert((a, b));
        }
        if crisis_war_gate_blocked(multiwar_enabled, turn, fb, fa) {
            out.insert((b, a));
        }
    }
    out
}

/// Web `getDiplomaticContacts(ME)` (main.ts:22523): zwraca zbior `diplomaticallyDiscoveredOwnersSet`
/// BEZ dodatkowego filtra. Wykluczenie gracza (owner 0) dzieje sie u zrodla: `computeDiplomaticContacts`
/// (gra/src/game/diplomacy-layers.ts:221) z `playerOwnerId = 0`. Kolejnosc rosnaca (BTreeSet).
pub fn contacts_for(discovered: &BTreeSet<i64>) -> Vec<i64> {
    discovered.iter().copied().collect()
}

/// Fakty wlasciciela do kwalifikacji fazy (web: `isBarbarian`, `typCityCopyOwners`, `eliminatedOwners`, liczba miast).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OwnerFacts {
    pub is_barbarian: bool,
    pub is_city_copy: bool,
    pub eliminated: bool,
    pub city_count: f64,
}

/// Brak faktow dla wlasciciela z `allPowerOwnerIds` - blad wolajacego (web: ten przypadek nie wystepuje).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MissingOwnerFacts {
    pub owner_id: i64,
}

/// Web `allPowerOwnerIds` + `diploOwnerEligibleForBrake`: lista wlascicieli w kolejnosci wejscia z
/// informacja `AiAiOwnerInfo`. `is_player` = `isMe(id)` (`id == me`). Brak faktu dla wlasciciela z
/// listy zwraca `Err` zamiast cichego pominiecia (polityka jawna: niekompletne wejscie nie przechodzi).
pub fn phase_owners(
    me: i64,
    all_owner_ids: &[i64],
    facts: &BTreeMap<i64, OwnerFacts>,
) -> Result<Vec<PhaseOwner>, MissingOwnerFacts> {
    all_owner_ids
        .iter()
        .map(|&id| {
            let f = facts.get(&id).ok_or(MissingOwnerFacts { owner_id: id })?;
            Ok(PhaseOwner {
                id,
                info: AiAiOwnerInfo {
                    is_player: id == me,
                    is_barbarian: f.is_barbarian,
                    is_city_copy: f.is_city_copy,
                    eliminated: f.eliminated,
                    city_count: f.city_count,
                },
            })
        })
        .collect()
}

/// Adapter `objectivePowerForOwner` per owner: `power(id)` dostarcza wolajacy (brak portu `computeObjectivePower`).
pub fn power_map(owner_ids: &[i64], power: impl Fn(i64) -> f64) -> BTreeMap<i64, f64> {
    owner_ids.iter().map(|&id| (id, power(id))).collect()
}
