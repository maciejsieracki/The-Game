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

// ---------------------------------------------------------------------------
// R1 -> R2 (R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1, runda 2): reszta cyklu życia rozejmu
// z web `diplomacy-peace-lock.ts` (sekcje (B)/(C)/(E), pin 638e90bea):
// `aiTruceOrPeaceMode` (L10), `peaceFinalizeTrustEvent` (L8, wartość logiki),
// `clearTruceEndOfferCore` / `truceEndToWarCore` / `truceEndTickPair` (L9 — tick pary).
// Port: stan pary (`truceUntilTurn`, inicjator, oferta) i efekty przez trait `TruceEndPorts`,
// tak jak web (`TruceEndPorts`). Podpięcie trait-a pod żywy stan `diplomacy.rs` = BLOKADA (patrz raport).
// ---------------------------------------------------------------------------

use crate::domain::diplomacy_truce::{
    normalize_truce_duration, truce_expiry_action, TruceExpiryAction,
};

/// Web: `TRUCE_AI_FATIGUE_PEACE_MIN` (ułamek zmęczenia 1 = pełne zmęczenie). ZAŁOŻENIE orkiestratora.
pub const TRUCE_AI_FATIGUE_PEACE_MIN: f64 = 1.0;
/// Web: `TRUCE_AI_WILLINGNESS_PEACE_MIN`. ZAŁOŻENIE orkiestratora (do potwierdzenia).
pub const TRUCE_AI_WILLINGNESS_PEACE_MIN: f64 = 0.7;
/// Web: `TRUCE_AI_TRUST_PEACE_MIN`. ZAŁOŻENIE orkiestratora (do ABC).
pub const TRUCE_AI_TRUST_PEACE_MIN: f64 = 60.0;

/// Web: wynik `aiTruceOrPeaceMode` ('pokoj' | 'rozejm').
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TruceOrPeaceMode {
    Pokoj,
    Rozejm,
}

/// Web: `aiTruceOrPeaceMode(input)`. `fallback_is_peace` = `fallbackKind === 'pokoj'`.
/// Porównania z NaN są fałszywe jak w JS (`NaN >= progu` = false).
pub fn ai_truce_or_peace_mode(
    fatigue_fraction: f64,
    willingness_peace: f64,
    zaufanie: f64,
    weaker: bool,
    fallback_is_peace: bool,
) -> TruceOrPeaceMode {
    if fatigue_fraction >= TRUCE_AI_FATIGUE_PEACE_MIN {
        return TruceOrPeaceMode::Pokoj;
    }
    if willingness_peace >= TRUCE_AI_WILLINGNESS_PEACE_MIN {
        return TruceOrPeaceMode::Pokoj;
    }
    if zaufanie >= TRUCE_AI_TRUST_PEACE_MIN {
        return TruceOrPeaceMode::Pokoj;
    }
    if weaker {
        return TruceOrPeaceMode::Rozejm;
    }
    if fallback_is_peace {
        TruceOrPeaceMode::Pokoj
    } else {
        TruceOrPeaceMode::Rozejm
    }
}

/// Web: `peaceFinalizeTrustEvent(truceTurns)` (L8, C). Zwraca `true` gdy zawarcie daje zdarzenie
/// 'pokoj' (+5 Zaufania): pokój stały (brak/0/nieprawidłowa długość). Rozejm (5/10/15) = `false` (0 Zaufania).
pub fn peace_finalize_gives_trust_event(truce_turns: Option<f64>) -> bool {
    normalize_truce_duration(truce_turns).is_none()
}

/// Stan rozejmu jednej pary potrzebny cyklowi życia (web: `truceUntilTurn`, `truceInitiatorId`, `truceEndOffer`).
#[derive(Debug, Clone, PartialEq)]
pub struct TruceEndOffer<T> {
    pub turn: f64,
    pub from: T,
    pub to: T,
    /// Web: `inboxId` (wpis w skrzynce gracza); `None` dla oferty bez wpisu.
    pub inbox_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PairTruceMeta<T> {
    pub truce_until: Option<f64>,
    pub initiator: Option<T>,
    pub offer: Option<TruceEndOffer<T>>,
}

impl<T> Default for PairTruceMeta<T> {
    fn default() -> Self {
        Self {
            truce_until: None,
            initiator: None,
            offer: None,
        }
    }
}

/// Web: `TruceEndPorts`. `status_is_peace` = `getStatus(a,b) === 'pokoj'` (adaptacja typu statusu).
pub trait TruceEndPorts<T: Copy + PartialEq> {
    fn meta(&self, a: T, b: T) -> PairTruceMeta<T>;
    fn set_meta(&mut self, a: T, b: T, meta: PairTruceMeta<T>);
    fn status_is_peace(&self, a: T, b: T) -> bool;
    /// Web: `getArmyM(ownerId)` (suma M_pole armii, nominalna).
    fn army_m(&self, owner: T) -> f64;
    fn is_human(&self, owner: T) -> bool;
    /// Web: `declareWarAfterTruce(a,b)`.
    fn declare_war_after_truce(&mut self, a: T, b: T);
    /// Web: `enqueueOffer(ownerId, reason)` -> id wpisu.
    fn enqueue_offer(&mut self, owner: T, reason: &str) -> String;
    fn remove_offer(&mut self, inbox_id: &str);
    /// Web: `finalizePeace(proposerId, responderId)` (pokój stały, bez truceTurns).
    fn finalize_peace(&mut self, proposer: T, responder: T);
}

/// Tekst wpisu w skrzynce z web `truceEndTickPair` (literał inline w TS, skopiowany bez zmian).
pub const TRUCE_END_OFFER_REASON: &str =
    "Rozejm wygasł — propozycja pokoju stałego (odmowa = wojna)";

/// Web: `clearTruceEndOfferCore(ports,a,b)`.
pub fn clear_truce_end_offer_core<T, P>(ports: &mut P, a: T, b: T)
where
    T: Copy + PartialEq,
    P: TruceEndPorts<T>,
{
    let meta = ports.meta(a, b);
    let Some(offer) = meta.offer else { return };
    if let Some(inbox) = offer.inbox_id.as_deref() {
        ports.remove_offer(inbox);
    }
    let mut next = ports.meta(a, b);
    next.offer = None;
    ports.set_meta(a, b, next);
}

/// Web: `truceEndToWarCore(ports,a,b)`: odmowa lub timeout = wojna (bez kary).
pub fn truce_end_to_war_core<T, P>(ports: &mut P, a: T, b: T)
where
    T: Copy + PartialEq,
    P: TruceEndPorts<T>,
{
    if ports.status_is_peace(a, b) {
        ports.declare_war_after_truce(a, b);
    }
    clear_truce_end_offer_core(ports, a, b);
}

/// Web: `truceEndTickPair(ports,a,b,turn)`: jeden tick pary (raz na turę).
pub fn truce_end_tick_pair<T, P>(ports: &mut P, a: T, b: T, turn: f64)
where
    T: Copy + PartialEq,
    P: TruceEndPorts<T>,
{
    let meta = ports.meta(a, b);
    if let Some(offer) = meta.offer.clone() {
        if truce_end_offer_expired(offer.turn, turn) {
            truce_end_to_war_core(ports, a, b);
        }
        return;
    }
    if meta.truce_until.is_none() {
        return;
    }
    if truce_expiry_action(meta.truce_until, turn) != TruceExpiryAction::RevertToWar {
        return;
    }
    let initiator = meta.initiator;
    let target = match initiator {
        Some(init) if init == a => Some(b),
        Some(init) if init == b => Some(a),
        _ => None,
    };
    let mut cleared = ports.meta(a, b);
    cleared.truce_until = None;
    ports.set_meta(a, b, cleared);
    if !ports.status_is_peace(a, b) {
        return;
    }
    let (Some(init), Some(tgt)) = (initiator, target) else {
        truce_end_to_war_core(ports, a, b);
        return;
    };
    if ports.is_human(tgt) {
        let inbox_id = ports.enqueue_offer(init, TRUCE_END_OFFER_REASON);
        let mut next = ports.meta(a, b);
        next.offer = Some(TruceEndOffer {
            turn,
            from: init,
            to: tgt,
            inbox_id: Some(inbox_id),
        });
        ports.set_meta(a, b, next);
        return;
    }
    if truce_end_ai_accepts_default(ports.army_m(init), ports.army_m(tgt)) {
        ports.finalize_peace(init, tgt);
    } else {
        truce_end_to_war_core(ports, a, b);
    }
}
