//! P6-WIRE-WAR-STATE-OWNER (W8 podzial 1/3): `WarTurnState` przechowuje typowane magazyny
//! dyplomacji i wojny (DiplomacyState, BrakePhaseState, AiPeaceRequestStore, WarWearinessStore).
//! Testy: nowa gra = puste magazyny i brak kluczy Rust w zapisie; round-trip przez `meta`, serde
//! oraz pelny `PlayableState` (sciezka `PlayableState.war`); stary zapis bez kluczy wczytuje sie
//! z domyslnymi wartosciami; uszkodzone wpisy sa pomijane (zachowanie pinowane).

use civ_engine::domain::ai_diplomacy_turn::BrakePhaseState;
use civ_engine::domain::diplomacy::{
    ActiveDeal, CivilizationPair, Relation, RelationStatus, TreatyEconomy, TreatyKind,
};
use civ_engine::domain::diplomacy_ai_forced_peace::{
    register_ai_peace_request, AiPeaceKind, AiPeaceRequestStore,
};
use civ_engine::domain::diplomacy_multiwar_peace::WarWearinessPairState;
use civ_engine::domain::playable::PlayableState;
use civ_engine::domain::war_turn_state::{
    managed_meta_keys, WarTurnState, RUST_AI_PEACE_KEY, RUST_BRAKE_PHASE_KEY, RUST_DIPLOMACY_KEY,
    RUST_OWNER_META_KEYS, RUST_WAR_WEARINESS_KEY,
};
use civ_engine::domain::PlayerId;
use serde_json::{json, Map, Value};

fn populated() -> WarTurnState {
    let mut w = WarTurnState::default();
    // Wiele relacji o niedomyslnych wartosciach (trust/respect/status), nie tylko startowa.
    w.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(1), PlayerId::new(2)),
        Relation::new(35.0, 60.0, RelationStatus::War),
    );
    w.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(3), PlayerId::new(4)),
        Relation::new(-12.5, 7.0, RelationStatus::Peace),
    );
    w.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(2), PlayerId::new(5)),
        Relation::new(80.0, 40.0, RelationStatus::Alliance),
    );
    // Transakcje: bez ekonomii i z ekonomia (pole zagniezdzone).
    w.diplomacy.deals.push(ActiveDeal::new(
        TreatyKind::Nap,
        PlayerId::new(1),
        PlayerId::new(2),
        100,
        Some(140),
    ));
    w.diplomacy.deals.push(ActiveDeal {
        economy: Some(TreatyEconomy {
            payer_owner_id: PlayerId::new(2),
            receiver_owner_id: PlayerId::new(5),
            money_per_turn: 10.0,
        }),
        ..ActiveDeal::new(
            TreatyKind::Vassalization,
            PlayerId::new(2),
            PlayerId::new(5),
            110,
            None,
        )
    });

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
    assert_eq!(back.diplomacy.relations.len(), 3);
    assert_eq!(back.diplomacy.deals.len(), 2);
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
fn playable_state_writes_owner_stores_only_when_populated() {
    // Pelna sciezka produkcyjna: `PlayableState.war` z `skip_serializing_if = is_default`.
    let mut state = PlayableState::empty();
    let v = serde_json::to_value(&state).expect("serialize empty PlayableState");
    assert!(
        !v.as_object().expect("object").contains_key("war"),
        "pusty stan wojny jest pomijany w zapisie PlayableState"
    );

    state.war = populated();
    let v = serde_json::to_value(&state).expect("serialize PlayableState");
    let war = v["war"].as_object().expect("blok war w zapisie");
    for key in RUST_OWNER_META_KEYS {
        assert!(war.contains_key(key), "brak klucza w PlayableState: {key}");
    }

    let back: PlayableState = serde_json::from_value(v).expect("deserialize PlayableState");
    assert_eq!(back.war, populated());
    assert_eq!(back, state);
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
fn corrupt_owner_entries_are_skipped_and_valid_ones_kept() {
    // Zachowanie lenientnego odczytu jest pinowane: zle elementy sa pomijane bez bledu,
    // a poprawne zostaja. Pominiete wpisy znikaja przy kolejnym zapisie.
    let meta: Map<String, Value> = json!({
        "rustBrakePhaseState": {
            "counters": [[1, 2, 3.0], [1, 3, "x"], [4, 5]],
            "atWar": [[1, 3], [7], ["a", 2]],
            "dobraRemaining": [[2, 4, 2.5]]
        },
        "rustAiPeaceRequestStore": [
            ["2|5", {"requesterId": 2, "otherId": 5, "sinceTurn": 120, "kind": "rozejm"}],
            ["9|9", {"requesterId": 9, "otherId": 9, "sinceTurn": 1, "kind": "nieznany"}],
            ["8|8", {"requesterId": 8, "otherId": 8}],
            ["7|7", "nie-obiekt"],
            ["2|5", {"requesterId": 2, "otherId": 5, "sinceTurn": 121, "kind": "pokoj"}]
        ],
        "rustWarWearinessStore": [
            ["3|4", {"peak": 5.0}],
            ["5|6", "zle"],
            ["6|7", {"warStart": 10, "peak": 1, "stage": 2, "rejectedOffers": 3, "lastOfferTurn": 9}]
        ]
    })
    .as_object()
    .cloned()
    .expect("object");

    let state = WarTurnState::from_meta_json(&meta);

    let mut brake = BrakePhaseState::default();
    brake.counters.insert((1, 2), 3.0);
    brake.at_war.insert((1, 3));
    brake.dobra_remaining.insert((2, 4), 2.5);
    assert!(state.brake_phase == brake, "tylko poprawne trojki i pary");

    let peace_keys: Vec<&str> = state
        .ai_peace_requests
        .entries()
        .iter()
        .map(|(k, _)| k.as_str())
        .collect();
    assert_eq!(
        peace_keys,
        vec!["2|5"],
        "nieznany kind, brak pola i duplikat pominiete"
    );
    assert!(matches!(
        state.ai_peace_requests.entries()[0].1.kind,
        civ_engine::domain::diplomacy_ai_forced_peace::AiPeaceKind::Rozejm
    ));

    assert_eq!(state.war_weariness.len(), 2, "wpis nie-obiektowy pominiety");
    let partial = &state.war_weariness["3|4"];
    assert_eq!(partial.war_start, 0.0);
    assert_eq!(partial.peak, 5.0);
    assert_eq!(partial.stage, 0);
    assert_eq!(partial.rejected_offers, 0);
    assert_eq!(partial.last_offer_turn, -1.0, "brak oferty = -1");
    let full = &state.war_weariness["6|7"];
    assert_eq!(full.stage, 2);
    assert_eq!(full.last_offer_turn, 9.0);

    // Pominiete wpisy nie wracaja przy ponownym zapisie.
    let resaved = state.to_meta_json();
    assert_eq!(
        resaved["rustAiPeaceRequestStore"].as_array().map(Vec::len),
        Some(1)
    );
}

#[test]
fn wrong_shape_owner_keys_fall_back_to_defaults() {
    // Zly typ calego pola (nie tylko elementu) => domyslny magazyn, bez paniki.
    let meta: Map<String, Value> = json!({
        "rustDiplomacyState": "garbage",
        "rustBrakePhaseState": [1, 2],
        "rustAiPeaceRequestStore": {},
        "rustWarWearinessStore": "x"
    })
    .as_object()
    .cloned()
    .expect("object");

    let state = WarTurnState::from_meta_json(&meta);
    assert!(state.diplomacy == Default::default());
    assert!(state.brake_phase == BrakePhaseState::default());
    assert!(state.ai_peace_requests == AiPeaceRequestStore::default());
    assert!(state.war_weariness.is_empty());
    assert!(state.is_default());
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
