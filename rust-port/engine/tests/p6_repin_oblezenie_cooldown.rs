//! R-RUSTPORT-REPIN-OBLEZENIE-GLOD-COOLDOWN-Q1 (FALA 557 CITYCD + D-DYPLO-AI-NO-NAG): testy
//! `domain::diplomacy_rejection_cooldown`.
//!
//! Wektory: wynik web `gra/src/game/diplomacy-rejection-cooldown.ts` (origin/main) uruchomiony pod Node 22
//! (`--experimental-strip-types`) na tej samej sekwencji wywolan. Oczekiwania podane jawnie ponizej.

use civ_engine::domain::diplomacy_rejection_cooldown::{
    is_offer_rejected_on_cooldown, make_rejected_offer_cooldown, negotiation_partner_owner_id,
    prune_expired_rejected_offers, record_rejected_offer, reject_cooldown_key_for,
    RejectedOfferCooldown, AI_REJECTED_OFFER_COOLDOWN_TURNS, CITY_FOR_PEACE_COOLDOWN_KEY,
};

#[test]
fn constants_match_web() {
    // Wektor web: const = [3, "miasto_za_pokoj"].
    assert_eq!(AI_REJECTED_OFFER_COOLDOWN_TURNS, 3.0);
    assert_eq!(CITY_FOR_PEACE_COOLDOWN_KEY, "miasto_za_pokoj");
}

#[test]
fn key_for_city_commands_uses_separate_key() {
    // Wektor web keys: oferuj_miasto_za_pokoj / zada_miasto_za_pokoj -> "miasto_za_pokoj".
    assert_eq!(
        reject_cooldown_key_for("oferuj_miasto_za_pokoj", "pokoj"),
        "miasto_za_pokoj"
    );
    assert_eq!(
        reject_cooldown_key_for("zada_miasto_za_pokoj", "pokoj"),
        "miasto_za_pokoj"
    );
}

#[test]
fn key_for_other_commands_keeps_action_id() {
    // Wektor web keys: ("pokoj", "oferuj_pokoj") -> "pokoj"; ("handel", "x") -> "handel".
    assert_eq!(reject_cooldown_key_for("oferuj_pokoj", "pokoj"), "pokoj");
    assert_eq!(reject_cooldown_key_for("x", "handel"), "handel");
}

#[test]
fn city_key_does_not_block_plain_peace_and_vice_versa() {
    // Wektor web: po zapisie pokoj(t10, cd3) + miasto(t10, cd3) + pokoj(t11, cd2) dla partnera 2.
    let cd = record_rejected_offer(&[], 2, "pokoj", 10.0, AI_REJECTED_OFFER_COOLDOWN_TURNS);
    let cd = record_rejected_offer(
        &cd,
        2,
        "miasto_za_pokoj",
        10.0,
        AI_REJECTED_OFFER_COOLDOWN_TURNS,
    );
    let cd = record_rejected_offer(&cd, 2, "pokoj", 11.0, 2.0);

    // Wektor web cooldowns: [{2,"miasto_za_pokoj",10,13}, {2,"pokoj",11,13}] (wpis pokoj nadpisany, na koncu).
    assert_eq!(
        cd,
        vec![
            RejectedOfferCooldown {
                partner_owner_id: 2,
                action_id: "miasto_za_pokoj".into(),
                rejected_at_turn: 10.0,
                expires_at_turn: 13.0,
            },
            RejectedOfferCooldown {
                partner_owner_id: 2,
                action_id: "pokoj".into(),
                rejected_at_turn: 11.0,
                expires_at_turn: 13.0,
            },
        ]
    );

    // Wektor web checks: [true, false, true, false, false].
    assert!(is_offer_rejected_on_cooldown(&cd, 2, "pokoj", 12.0));
    assert!(!is_offer_rejected_on_cooldown(&cd, 2, "pokoj", 13.0));
    assert!(is_offer_rejected_on_cooldown(
        &cd,
        2,
        "miasto_za_pokoj",
        12.0
    ));
    assert!(!is_offer_rejected_on_cooldown(
        &cd,
        2,
        "miasto_za_pokoj",
        13.0
    ));
    assert!(!is_offer_rejected_on_cooldown(&cd, 3, "pokoj", 11.0));
}

#[test]
fn partner_owner_id_resolves_player_side() {
    // Wektor web checks: (0,5) -> 5; (5,0) -> 5.
    assert_eq!(negotiation_partner_owner_id(0, 5), 5);
    assert_eq!(negotiation_partner_owner_id(5, 0), 5);
}

#[test]
fn prune_drops_entries_expiring_at_current_turn() {
    // Wektor web pruned (wpisy wygasajace w 13, tura 13): [] -- 13 < 13 = fałsz, wpis usuniety.
    let cd = record_rejected_offer(&[], 2, "pokoj", 10.0, 3.0);
    let cd = record_rejected_offer(&cd, 2, "miasto_za_pokoj", 10.0, 3.0);
    assert!(prune_expired_rejected_offers(&cd, 13.0).is_empty());
    // Tura 12: oba wpisy jeszcze wazne (12 < 13).
    assert_eq!(prune_expired_rejected_offers(&cd, 12.0).len(), 2);
    // Wpis wygasajacy w 12 (cooldown 2) znika w turze 12, zostaje wpis wygasajacy w 13.
    let cd2 = record_rejected_offer(&[], 2, "pokoj", 10.0, 2.0);
    let cd2 = record_rejected_offer(&cd2, 2, "miasto_za_pokoj", 10.0, 3.0);
    assert_eq!(prune_expired_rejected_offers(&cd2, 12.0).len(), 1);
}

#[test]
fn make_entry_expiry_is_rejected_plus_cooldown() {
    let e = make_rejected_offer_cooldown(7, "handel", 20.0, AI_REJECTED_OFFER_COOLDOWN_TURNS);
    assert_eq!(e.expires_at_turn, 23.0);
    assert_eq!(e.action_id, "handel");
}
