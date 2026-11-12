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
//! - Umowy (`activeDeals`, pin main.ts:35482) -> `DiplomacyState::clear_deals_for_owner` (diplomacy.rs).
//! - Wojny wymuszone `forced[0..2]` (pending/cycle/rest/active, pin main.ts:35418-35441) wraz z falami
//!   `forcedWarWavesByPairKey` o tych samych kluczach, tury wejscia w Braz/Zelazo (`bronzeEraEnterTurnByOwner`,
//!   `ironEraEnterTurnByOwner`), `regularWarCapturedByPairKey`, `diplomacyPairMeta`, `diplomacyFactorLog`
//!   -> `WarTurnState::clear_eliminated_owner_war_state` (war_turn_state.rs). Pola surowe (`opaque`) i typowane
//!   pola istniejace od partii W1; NIE dodano nowych pol serde, wiec zgodnosc wsteczna nie wymaga nowego testu.
//!
//! NIE_ZMIERZONO (zostaje w webie, poza tym modulem): pozostale struktury czyszczone przez `eliminateOwner`
//! (skarbce/pule AI, rejestry wiarygodnosci, `aiTargetMemoryByOwner` i inne, ...).
//! - oblezenia (`oblegajacyOwnerId`, `siegeBesiegerByCity`, `siegeTurnByCity`, `siegeAiStateByKey`) -> brak
//!   typowanej struktury oblezen w Rust (surowe `siegeTurnByCity`/`siegeBesiegerByCity` w `opaque` nie sa
//!   filtrowane tym modulem). Rejestracja jako osobny temat (decyzja orkiestratora).
//!
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

    state.war.diplomacy.clear_deals_for_owner(pid);
    state.war.clear_eliminated_owner_war_state(owner_id);

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
