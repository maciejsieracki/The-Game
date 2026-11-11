//! R-RUSTPORT-P6-W6S-COOLDOWN-Q1 (W6 wariant A, punkt 3): test behawioralny cooldownu odrzucen
//! `domain::diplomacy_rejection_cooldown` na wektorach wygenerowanych z pinu web 07d2fbd72f758705f8e1d59cc4968027ffbafe75
//! (`gra/src/game/diplomacy-rejection-cooldown.ts`) przez `p6_w6s_cooldown_gen.mjs`.
//!
//! Wektory sa generowane, nie pisane recznie: `p6_w6s_cooldown_vectors/cooldown-vectors.json`.
//! Test odtwarza identyczna sekwencje operacji i porownuje wynik kazdej operacji oraz stan cooldownow po kazdej z nich.

use civ_engine::domain::diplomacy_rejection_cooldown::{
    is_offer_rejected_on_cooldown, negotiation_partner_owner_id, prune_expired_rejected_offers,
    record_rejected_offer, reject_cooldown_key_for, RejectedOfferCooldown,
    AI_REJECTED_OFFER_COOLDOWN_TURNS, CITY_FOR_PEACE_COOLDOWN_KEY, CYCLIC_BARTER_COOLDOWN_KEY,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_w6s_cooldown_vectors/cooldown-vectors.json");

fn load() -> Value {
    serde_json::from_str(VECTORS).expect("cooldown-vectors.json musi byc poprawnym JSON-em")
}

fn f(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn i(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}

fn s(v: &Value) -> &str {
    v.as_str().expect("tekst")
}

/// Stan jako krotki do porownania z web (partner, akcja, rejectedAt, expiresAt).
fn tuples(cd: &[RejectedOfferCooldown]) -> Vec<(i64, String, f64, f64)> {
    cd.iter()
        .map(|c| {
            (
                c.partner_owner_id,
                c.action_id.clone(),
                c.rejected_at_turn,
                c.expires_at_turn,
            )
        })
        .collect()
}

fn json_tuples(v: &Value) -> Vec<(i64, String, f64, f64)> {
    v.as_array()
        .expect("tablica stanu")
        .iter()
        .map(|e| {
            (
                i(&e["partnerOwnerId"]),
                s(&e["actionId"]).to_owned(),
                f(&e["rejectedAtTurn"]),
                f(&e["expiresAtTurn"]),
            )
        })
        .collect()
}

#[test]
fn constants_match_pinned_web() {
    let d = load();
    let c = &d["constants"];
    assert_eq!(
        AI_REJECTED_OFFER_COOLDOWN_TURNS,
        f(&c["AI_REJECTED_OFFER_COOLDOWN_TURNS"])
    );
    assert_eq!(
        CITY_FOR_PEACE_COOLDOWN_KEY,
        s(&c["CITY_FOR_PEACE_COOLDOWN_KEY"])
    );
    assert_eq!(
        CYCLIC_BARTER_COOLDOWN_KEY,
        s(&c["CYCLIC_BARTER_COOLDOWN_KEY"])
    );
}

#[test]
fn reject_cooldown_keys_match_pinned_web() {
    let d = load();
    let cases = d["keyFor"].as_array().expect("keyFor");
    assert_eq!(cases.len(), 5);
    for case in cases {
        let got = reject_cooldown_key_for(s(&case["cmdType"]), s(&case["actionId"]));
        assert_eq!(got, s(&case["key"]), "klucz dla {}", case["cmdType"]);
    }
}

#[test]
fn partner_owner_matches_pinned_web() {
    let d = load();
    let cases = d["partnerOwner"].as_array().expect("partnerOwner");
    for case in cases {
        let got = negotiation_partner_owner_id(i(&case["proposer"]), i(&case["responder"]));
        assert_eq!(got, i(&case["partner"]));
    }
}

#[test]
fn operation_sequence_matches_pinned_web() {
    let d = load();
    let ops = d["ops"].as_array().expect("ops");
    let states = d["cooldownStates"].as_array().expect("cooldownStates");
    assert_eq!(ops.len(), states.len());

    let mut cd: Vec<RejectedOfferCooldown> = Vec::new();
    for (idx, op) in ops.iter().enumerate() {
        match s(&op["op"]) {
            "record" => {
                cd = record_rejected_offer(
                    &cd,
                    i(&op["partner"]),
                    s(&op["action"]),
                    f(&op["turn"]),
                    f(&op["cd"]),
                );
            }
            "check" => {
                let got = is_offer_rejected_on_cooldown(
                    &cd,
                    i(&op["partner"]),
                    s(&op["action"]),
                    f(&op["turn"]),
                );
                assert_eq!(
                    Some(got),
                    op["result"].as_bool(),
                    "check #{idx} partner={} action={} turn={}",
                    op["partner"],
                    op["action"],
                    op["turn"]
                );
            }
            "prune" => {
                cd = prune_expired_rejected_offers(&cd, f(&op["turn"]));
            }
            other => panic!("nieznana operacja {other}"),
        }
        assert_eq!(
            tuples(&cd),
            json_tuples(&states[idx]),
            "stan po operacji #{idx} ({})",
            op["op"]
        );
    }
    assert_eq!(tuples(&cd), json_tuples(&d["finalState"]));
}

#[test]
fn city_and_cyclic_keys_are_isolated_from_plain_actions() {
    // Klucz miasta i wymiany nie blokuje zwyklego pokoju/handlu tej samej AI (i odwrotnie).
    let cd = record_rejected_offer(
        &[],
        2,
        CITY_FOR_PEACE_COOLDOWN_KEY,
        10.0,
        AI_REJECTED_OFFER_COOLDOWN_TURNS,
    );
    assert!(!is_offer_rejected_on_cooldown(&cd, 2, "pokoj", 10.0));
    assert!(is_offer_rejected_on_cooldown(
        &cd,
        2,
        CITY_FOR_PEACE_COOLDOWN_KEY,
        12.0
    ));
    assert!(!is_offer_rejected_on_cooldown(
        &cd,
        2,
        CITY_FOR_PEACE_COOLDOWN_KEY,
        13.0
    ));
}
