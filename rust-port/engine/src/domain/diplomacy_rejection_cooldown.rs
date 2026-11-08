//! R-RUSTPORT-REPIN-OBLEZENIE-GLOD-COOLDOWN-Q1 (FALA 557 CITYCD): port `gra/src/game/diplomacy-rejection-cooldown.ts`
//! (origin/main, D-DYPLO-AI-NO-NAG + CITYCD).
//!
//! * [`AI_REJECTED_OFFER_COOLDOWN_TURNS`] = `AI_REJECTED_OFFER_COOLDOWN_TURNS` (3).
//! * [`CITY_FOR_PEACE_COOLDOWN_KEY`] = `CITY_FOR_PEACE_COOLDOWN_KEY` (`'miasto_za_pokoj'`).
//! * [`reject_cooldown_key_for`] = `rejectCooldownKeyFor`: komendy `oferuj_miasto_za_pokoj` / `zada_miasto_za_pokoj`
//!   dostaja osobny klucz; pozostale -> `actionId` jak dotad.
//! * Pozostale funkcje 1:1 z web (`makeRejectedOfferCooldown`, `negotiationPartnerOwnerId`,
//!   `isOfferRejectedOnCooldown`, `recordRejectedOffer`, `pruneExpiredRejectedOffers`).
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu):
//! * Z-RC-1 Tury (`rejectedAtTurn`, `expiresAtTurn`) jako `f64`, zgodnie z konwencja `diplomacy_truce.rs` (`turn: f64`).
//! * Z-RC-2 `actionId` / klucz cooldownu jako `&str` (web: union `RejectCooldownKey`); walidacji union nie ma.
//! * Z-RC-3 `cooldownTurns` bez wartosci domyslnej w Rust: wywolujacy podaje [`AI_REJECTED_OFFER_COOLDOWN_TURNS`].

/// Web `AI_REJECTED_OFFER_COOLDOWN_TURNS` (pelne tury AI nie powtarza tej samej akcji).
pub const AI_REJECTED_OFFER_COOLDOWN_TURNS: f64 = 3.0;

/// Web `CITY_FOR_PEACE_COOLDOWN_KEY` (osobny klucz oferty miasta za pokoj, CITYCD).
pub const CITY_FOR_PEACE_COOLDOWN_KEY: &str = "miasto_za_pokoj";

/// Web `rejectCooldownKeyFor(cmdType, actionId)`.
pub fn reject_cooldown_key_for<'a>(cmd_type: &str, action_id: &'a str) -> &'a str {
    if cmd_type == "oferuj_miasto_za_pokoj" || cmd_type == "zada_miasto_za_pokoj" {
        CITY_FOR_PEACE_COOLDOWN_KEY
    } else {
        action_id
    }
}

/// Web `RejectedOfferCooldown`.
#[derive(Debug, Clone, PartialEq)]
pub struct RejectedOfferCooldown {
    /// Id wlasciciela AI (partner gracza, ownerId != 0).
    pub partner_owner_id: i64,
    /// Typ akcji stolu albo klucz oferty miasta.
    pub action_id: String,
    /// Tura, w ktorej gracz kliknal Odrzuc.
    pub rejected_at_turn: f64,
    /// Pierwsza tura, w ktorej AI MOZE ponownie zaproponowac te akcje (wylacznie).
    pub expires_at_turn: f64,
}

/// Web `makeRejectedOfferCooldown`: `expiresAtTurn = rejectedAtTurn + cooldownTurns`.
pub fn make_rejected_offer_cooldown(
    partner_owner_id: i64,
    action_id: &str,
    rejected_at_turn: f64,
    cooldown_turns: f64,
) -> RejectedOfferCooldown {
    RejectedOfferCooldown {
        partner_owner_id,
        action_id: action_id.to_owned(),
        rejected_at_turn,
        expires_at_turn: rejected_at_turn + cooldown_turns,
    }
}

/// Web `negotiationPartnerOwnerId`: partner AI z wpisu stolu (gracz = ownerId 0).
pub fn negotiation_partner_owner_id(proposer_owner_id: i64, responder_owner_id: i64) -> i64 {
    if proposer_owner_id == 0 {
        responder_owner_id
    } else {
        proposer_owner_id
    }
}

/// Web `isOfferRejectedOnCooldown`: czy para gracz<->partner ma aktywny cooldown na dany klucz.
pub fn is_offer_rejected_on_cooldown(
    cooldowns: &[RejectedOfferCooldown],
    partner_owner_id: i64,
    action_id: &str,
    current_turn: f64,
) -> bool {
    cooldowns.iter().any(|c| {
        c.partner_owner_id == partner_owner_id
            && c.action_id == action_id
            && current_turn < c.expires_at_turn
    })
}

/// Web `recordRejectedOffer`: nadpisuje starszy wpis tej samej pary + klucza; nowy wpis na koncu.
pub fn record_rejected_offer(
    cooldowns: &[RejectedOfferCooldown],
    partner_owner_id: i64,
    action_id: &str,
    rejected_at_turn: f64,
    cooldown_turns: f64,
) -> Vec<RejectedOfferCooldown> {
    let entry = make_rejected_offer_cooldown(
        partner_owner_id,
        action_id,
        rejected_at_turn,
        cooldown_turns,
    );
    let mut out: Vec<RejectedOfferCooldown> = cooldowns
        .iter()
        .filter(|c| !(c.partner_owner_id == partner_owner_id && c.action_id == action_id))
        .cloned()
        .collect();
    out.push(entry);
    out
}

/// Web `pruneExpiredRejectedOffers`: usuwa wygasle wpisy.
pub fn prune_expired_rejected_offers(
    cooldowns: &[RejectedOfferCooldown],
    current_turn: f64,
) -> Vec<RejectedOfferCooldown> {
    cooldowns
        .iter()
        .filter(|c| current_turn < c.expires_at_turn)
        .cloned()
        .collect()
}
