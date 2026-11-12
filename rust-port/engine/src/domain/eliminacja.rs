//! R-RUSTPORT-P6-ELIMINACJA-Q1: czysta funkcja eliminacji wlasciciela (web `main.ts` `eliminateOwner`, pin 07d2fbd72).
//!
//! Zakres (zmierzony na pinie):
//! - pin `main.ts:35348` `eliminateOwner(ownerId)`: no-op dla `ownerId === 0` i dla wlasciciela juz w `eliminatedOwners`;
//!   w pozostalych przypadkach dopisuje do `eliminatedOwners`, usuwa jednostki wlasciciela (`disbandOwnerUnits`,
//!   `capital-capture.ts:392`), czysci akumulatory mocy (`battlePowerPtsByOwner.delete` main.ts:35399,
//!   `zdobyczePowerByOwner.delete` main.ts:35410) i usuwa pary dyplomacji zawierajace wlasciciela
//!   (`diplomacyRelations`, klucz `a_b`, `diploPairKeyHasOwner` main.ts:35242).
//! - Akumulatory: przez istniejace `WarTurnState::clear_power_accumulators_for_owner` (przez
//!   `PlayableState::power_clear_eliminated_owner`).
//!
//! NIE_ZMIERZONO (zostaje w webie, poza tym modulem): pozostale struktury czyszczone przez `eliminateOwner`
//! (skarbce/pule AI, cykle wojen wymuszonych, rejestry wiarygodnosci, `diplomacyPairMeta`, `diplomacyFactorLog`, ...).
//! W tym module NIE sa czyszczone (pin main.ts), kazda z osobna przyczyna:
//! - `activeDeals` (pin main.ts:35482, `d.strony.includes(ownerId)`) -> Rust `war.diplomacy.deals` (diplomacy.rs:1656);
//! - wymuszone wojny `forced[0..2]` (pending/cycle/rest/active, pin main.ts:35418-35441) -> Rust `war.forced` (war_turn_state.rs:124);
//! - `bronzeEraEnterTurnByOwner` / `ironEraEnterTurnByOwner` (pin main.ts:35418, :35440) -> Rust
//!   `war.bronze_era_enter_turn_by_owner` / `war.iron_era_enter_turn_by_owner` (war_turn_state.rs:126,128);
//! - oblezenia (`oblegajacyOwnerId`, `siegeBesiegerByCity`) -> brak struktury oblezen w Rust.
//!   Zakres dyspozycji (miasta, jednostki, akumulatory, relacje) tego nie obejmuje. Rejestracja jako osobny temat:
//!   proponowane ID `ELIMINACJA-GRACZA-DEALS-WOJNY-Q2` (decyzja orkiestratora).
//! Wolanie z tur/walki: osobny temat (brak wpiecia tutaj).
//!
//! Wejscie `wyeliminowani` jest jawne (web `eliminatedOwners`): wolajacy trzyma zbior. Modul nie zapisuje stanu
//! poza `state` i tym zbiorem.

use super::diplomacy::CivilizationPair;
use super::ids::PlayerId;
use super::playable::PlayableState;

/// Wynik eliminacji: `pominieta` = wlasciciel 0 albo juz wyeliminowany (web: wczesny `return`).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct EliminacjaWynik {
    pub pominieta: bool,
    pub usuniete_jednostki: usize,
    pub usuniete_relacje: usize,
}

/// Mapuje id wlasciciela (web: liczba >= 0) na `PlayerId`. Ujemne id nie maja odpowiednika w Rust:
/// zadna jednostka ani para nie moze do nich nalezec, wiec `None` = brak dopasowan.
fn owner_pid(owner_id: i64) -> Option<PlayerId> {
    u64::try_from(owner_id).ok().map(PlayerId::new)
}

/// Web `eliminateOwner(ownerId)` (pin main.ts:35348) w zakresie opisanym w module.
pub fn eliminate_owner(
    state: &mut PlayableState,
    wyeliminowani: &mut Vec<i64>,
    owner_id: i64,
) -> EliminacjaWynik {
    if owner_id == 0 || wyeliminowani.contains(&owner_id) {
        return EliminacjaWynik {
            pominieta: true,
            ..EliminacjaWynik::default()
        };
    }
    wyeliminowani.push(owner_id);

    let pid = owner_pid(owner_id);
    let jednostki_przed = state.units.len();
    state.units.retain(|u| Some(u.owner_id) != pid);
    let usuniete_jednostki = jednostki_przed - state.units.len();

    state.power_clear_eliminated_owner(owner_id);

    let relacje_przed = state.war.diplomacy.relations.len();
    state
        .war
        .diplomacy
        .relations
        .retain(|para: &CivilizationPair, _| Some(para.first) != pid && Some(para.second) != pid);
    let usuniete_relacje = relacje_przed - state.war.diplomacy.relations.len();

    EliminacjaWynik {
        pominieta: false,
        usuniete_jednostki,
        usuniete_relacje,
    }
}
