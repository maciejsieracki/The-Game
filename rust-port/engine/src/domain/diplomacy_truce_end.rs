//! R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1: REPIN web FALA 605 (R-WEB-DIPLO-TRUCE-IMPL-Q1,
//! kod e7bf8acc8) — części rozejmu po jego wygaśnięciu, których brakowało w porcie.
//!
//! web `gra/src/game/diplomacy-peace-lock.ts` (pin: origin/main 638e90bea):
//! - `truceEndAiAccepts` (r5/r6, ~:162-180): przyjęcie pokoju po rozejmie wg SIŁY (MOC WOJSKOWA = suma M_pole armii).
//! - `truceEndOfferTarget` (~:190): adresat propozycji pokoju = strona, która NIE zaproponowała rozejmu.
//! - `truceEndOfferExpired` (~:200): oferta nierozstrzygnięta do kolejnej tury = timeout = wojna.
//! - `isTruceWindowBreach` (~:210): okno złamania = aktywny rozejm LUB oferta pokoju po rozejmie.
//!
//! Progi: `diplomacy-war-peace-params.json`, klucz `przewagaMilitarna` (prog 0.20, epsilon 1e-9).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Liczby `number` = `f64` (NaN/Infinity jak w JS). Brak wartości = `Option`.
//! - Identyfikatory graczy: generyczne `T: PartialEq + Copy` (w porcie `PlayerId`); logika identyczna.
//! - Parametry prog/epsilon w porcie jako stałe (`PRZEWAGA_PROG`, `PRZEWAGA_EPSILON`) zgodne z JSON weba;
//!   web czyta je z `WAR_PEACE_PARAMS`, port nie ładuje JSON tutaj (ZAŁOŻENIE: brak zmiany danych).

/// Web: `WAR_PEACE_PARAMS.przewagaMilitarna.prog` (diplomacy-war-peace-params.json).
pub const PRZEWAGA_PROG: f64 = 0.20;
/// Web: `WAR_PEACE_PARAMS.przewagaMilitarna.epsilon`.
pub const PRZEWAGA_EPSILON: f64 = 1e-9;

/// Web: `truceEndAiAccepts(proposerArmyM, addresseeArmyM, prog)`.
/// Przyjmuje, gdy proponujący ≤ (1 − prog + eps) × adresat. Adresat bez armii (≤ 0) → odmowa,
/// także przy 0 vs 0 (r6, ZAŁOŻENIE-R5-C rozstrzygnięte przez Operatora).
pub fn truce_end_ai_accepts(proposer_army_m: f64, addressee_army_m: f64, prog: f64) -> bool {
    if !proposer_army_m.is_finite() || !addressee_army_m.is_finite() {
        return false;
    }
    if proposer_army_m < 0.0 || addressee_army_m < 0.0 {
        return false;
    }
    if addressee_army_m <= 0.0 {
        return false;
    }
    proposer_army_m <= (1.0 - prog + PRZEWAGA_EPSILON) * addressee_army_m
}

/// Wariant z progiem z parametrów weba (0.20).
pub fn truce_end_ai_accepts_default(proposer_army_m: f64, addressee_army_m: f64) -> bool {
    truce_end_ai_accepts(proposer_army_m, addressee_army_m, PRZEWAGA_PROG)
}

/// Web: `truceEndOfferTarget(initiatorId, a, b)`. Brak inicjatora (stare zapisy) → `None`.
pub fn truce_end_offer_target<T: PartialEq + Copy>(initiator: Option<T>, a: T, b: T) -> Option<T> {
    let init = initiator?;
    if init == a {
        Some(b)
    } else if init == b {
        Some(a)
    } else {
        None
    }
}

/// Web: `truceEndOfferExpired(offerTurn, currentTurn)`: `currentTurn > offerTurn` (timeout = wojna).
pub fn truce_end_offer_expired(offer_turn: f64, current_turn: f64) -> bool {
    offer_turn.is_finite() && current_turn > offer_turn
}

/// Web: `isTruceWindowBreach(meta, currentTurn)`: aktywny rozejm LUB oferta pokoju po rozejmie.
/// `truce_until` = `truceUntilTurn`; `has_end_offer` = `truceEndOffer != null`.
pub fn is_truce_window_breach(
    truce_until: Option<f64>,
    has_end_offer: bool,
    current_turn: f64,
) -> bool {
    let active = match truce_until {
        Some(u) if u.is_finite() => current_turn < u,
        _ => false,
    };
    active || has_end_offer
}
