//! P6-WIRE-WAR-STATE-OWNER (W8 podzial 1/3): `WarTurnState` przechowuje typowane magazyny
//! dyplomacji i wojny (DiplomacyState, BrakePhaseState, AiPeaceRequestStore, WarWearinessStore).
//! Testy: nowa gra = puste magazyny i brak kluczy Rust w zapisie; round-trip przez `meta` i serde
//! (sciezka `PlayableState.war`); stary zapis bez kluczy wczytuje sie z domyslnymi wartosciami.

use civ_engine::domain::ai_diplomacy_turn::BrakePhaseState;
use civ_engine::domain::diplomacy_ai_forced_peace::{register_ai_peace_request, AiPeaceKind};
use civ_engine::domain::diplomacy_multiwar_peace::WarWearinessPairState;
use civ_engine::domain::war_turn_state::{
    managed_meta_keys, WarTurnState, RUST_AI_PEACE_KEY, RUST_BRAKE_PHASE_KEY, RUST_DIPLOMACY_KEY,
    RUST_OWNER_META_KEYS, RUST_WAR_WEARINESS_KEY,
};
use serde_json::{json, Map, Value};

fn populated() -> WarTurnState {
    let mut w = WarTurnState::default();
    w.diplomacy.ensure_relation(1u64.into(), 2u64.into());
    w.brake_phase = BrakePhaseState::default();
    w.brake_phase.counters.insert((1, 2), 3.0);
    w.brake_phase.at_war.insert((1, 3));
    w.brake_phase.dobra_remaining.insert((2, 4), 2.5);
    assert!(register_ai_peace_request(
        &mut w.ai_peace_requests,
        "2|5",
        2,
        5,
        120.0,
        AiPeaceKind::Rozejm
    ));
    assert!(register_ai_peace_request(
        &mut w.ai_peace_requests,
        "1|3",
        3,
        1,
        118.0,
        AiPeaceKind::Pokoj
    ));
    w.war_weariness.insert(
        "3|4".to_string(),
        WarWearinessPairState {
            war_start: 80.0,
            peak: 12.5,
            stage: 1,
            rejected_offers: 2,
            last_offer_turn: -1.0,
        },
    );
    w
}

#[test]
fn new_game_has_empty_owner_stores_and_writes_no_rust_keys() {
    let state = WarTurnState::default();
    assert!(state.diplomacy == Default::default());
    assert!(state.brake_phase == BrakePhaseState::default());
    assert!(state.ai_peace_requests == Default::default());
    assert!(state.war_weariness.is_empty());
    assert!(state.is_default());

    let out = state.to_meta_json();
    for key in RUST_OWNER_META_KEYS {
        assert!(
            !out.contains_key(key),
            "pusty magazyn nie moze trafic do zapisu: {key}"
        );
    }
}

#[test]
fn populated_owner_stores_round_trip_through_meta() {
    let w = populated();
    assert!(!w.is_default());

    let meta = w.to_meta_json();
    for key in [
        RUST_DIPLOMACY_KEY,
        RUST_BRAKE_PHASE_KEY,
        RUST_AI_PEACE_KEY,
        RUST_WAR_WEARINESS_KEY,
    ] {
        assert!(meta.contains_key(key), "brak klucza w zapisie: {key}");
    }

    let back = WarTurnState::from_meta_json(&meta);
    assert_eq!(back, w);
    assert_eq!(back.to_meta_json(), meta);
}

#[test]
fn populated_owner_stores_round_trip_through_serde() {
    // Sciezka uzywana przez `PlayableState.war` (serde -> meta -> serde).
    let w = populated();
    let v = serde_json::to_value(&w).expect("serialize WarTurnState");
    let back: WarTurnState = serde_json::from_value(v).expect("deserialize WarTurnState");
    assert_eq!(back, w);
}

#[test]
fn ai_peace_order_and_duplicates_survive_round_trip() {
    let w = populated();
    let back = WarTurnState::from_meta_json(&w.to_meta_json());
    let keys: Vec<&str> = back
        .ai_peace_requests
        .entries()
        .iter()
        .map(|(k, _)| k.as_str())
        .collect();
    assert_eq!(keys, vec!["2|5", "1|3"], "kolejnosc wstawiania zachowana");
    assert_eq!(back.ai_peace_requests.len(), 2);
}

#[test]
fn old_save_without_owner_keys_loads_as_defaults_and_keeps_existing_fields() {
    let meta: Map<String, Value> = json!({
        "stoneForceWarPendingOwners": [2, 3],
        "bronzeEraEnterTurnByOwner": [[0, 150]],
        "regularWarCapturedByPairKey": [["3|4", {"ownerA": 3, "ownerB": 4, "capturedByA": 1, "capturedByB": 0}]],
        "diplomacyCrisisCounters": [["1|2", 2]]
    })
    .as_object()
    .cloned()
    .expect("object");

    let state = WarTurnState::from_meta_json(&meta);
    assert!(state.diplomacy == Default::default());
    assert!(state.brake_phase == BrakePhaseState::default());
    assert!(state.ai_peace_requests == Default::default());
    assert!(state.war_weariness.is_empty());

    // Istniejace pola zachowuja dotychczasowy format i wartosci.
    let out = state.to_meta_json();
    assert_eq!(out["stoneForceWarPendingOwners"], json!([2, 3]));
    assert_eq!(out["bronzeEraEnterTurnByOwner"], json!([[0, 150]]));
    assert_eq!(
        out["regularWarCapturedByPairKey"],
        meta["regularWarCapturedByPairKey"]
    );
    assert_eq!(out["diplomacyCrisisCounters"], json!([["1|2", 2]]));
    for key in RUST_OWNER_META_KEYS {
        assert!(
            !out.contains_key(key),
            "stary zapis nie dostaje kluczy Rust: {key}"
        );
    }
}

#[test]
fn rust_owner_keys_are_managed_so_stale_values_are_overwritten() {
    let keys = managed_meta_keys();
    for key in RUST_OWNER_META_KEYS {
        assert!(
            keys.iter().any(|k| k == key),
            "brak w managed_meta_keys: {key}"
        );
    }
}
