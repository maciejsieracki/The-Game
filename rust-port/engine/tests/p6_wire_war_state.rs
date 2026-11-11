//! P6-WIRE-WAR-STATE (W1): round-trip stanu wojny w `meta` zapisu oraz zgodnosc kluczy z webem.
//! Wektory sa pisane recznie wg semantyki webu (ZALOZENIE: generator Node 22 z `origin/main`
//! jeszcze nie podpiety w tej partii — NIE_ZMIERZONO wzgledem prawdziwego webu).

use civ_engine::domain::war_forced_pairing::{ForcedWarPairState, ForcedWarSaveState};
use civ_engine::domain::war_turn_state::{WarTurnState, OPAQUE_WAR_META_KEYS};
use serde_json::{json, Map, Value};

fn meta_of(v: Value) -> Map<String, Value> {
    v.as_object().cloned().expect("meta must be an object")
}

fn sample_meta() -> Value {
    json!({
        "stoneForceWarPendingOwners": [2, 3],
        "stoneForceWarCycleOwners": [4],
        "stoneForceWarRestUntilByOwner": [[2, 120]],
        "stoneForceWarActiveByPairKey": [
            ["1|2", {"attackerId": 1, "targetId": 2, "capturedByAttacker": 0,
                     "capturedByDefender": 0, "startTurn": 80}]
        ],
        "bronzeForceWarPendingOwners": [5],
        "bronzeForceWarCycleOwners": [],
        "bronzeForceWarRestUntilByOwner": [],
        "bronzeForceWarActiveByPairKey": [],
        "bronzeEraEnterTurnByOwner": [[0, 150], [5, 160]],
        "ironForceWarPendingOwners": [],
        "ironForceWarCycleOwners": [],
        "ironForceWarRestUntilByOwner": [],
        "ironForceWarActiveByPairKey": [],
        "ironEraEnterTurnByOwner": [[0, 300]],
        "regularWarCapturedByPairKey": [["3|4", {"captured": 1}]],
        "aiAiPeaceRequestByPairKey": [],
        "warWearinessByPairKey": [["3|4", 12.5]],
        "forcedEraPeaceUntilNextEraByPairKey": [],
        "forcedWarWavesByPairKey": [],
        "aiGeneralWarCampaignByOwner": []
    })
}

#[test]
fn old_save_without_war_keys_loads_as_empty_and_writes_empty_arrays() {
    let state = WarTurnState::from_meta_json(&Map::new());
    assert_eq!(state, WarTurnState::default());

    let out = state.to_meta_json();
    assert_eq!(out.get("stoneForceWarPendingOwners"), Some(&json!([])));
    assert_eq!(out.get("bronzeEraEnterTurnByOwner"), Some(&json!([])));
    assert_eq!(out.get("ironEraEnterTurnByOwner"), Some(&json!([])));
    // Pola opakowane nie pojawiaja sie, gdy web ich nie zapisal.
    for key in OPAQUE_WAR_META_KEYS {
        assert!(!out.contains_key(key), "unexpected opaque key {key}");
    }
}

#[test]
fn round_trip_keeps_web_keys_and_values() {
    let input = meta_of(sample_meta());
    let state = WarTurnState::from_meta_json(&input);
    let out = state.to_meta_json();

    for (key, expected) in &input {
        if key.starts_with("stoneForce")
            || key.starts_with("bronzeForce")
            || key.starts_with("ironForce")
            || key.ends_with("EraEnterTurnByOwner")
            || OPAQUE_WAR_META_KEYS.contains(&key.as_str())
        {
            assert_eq!(out.get(key), Some(expected), "mismatch at {key}");
        }
    }
}

#[test]
fn typed_fields_read_back_with_web_semantics() {
    let state = WarTurnState::from_meta_json(&meta_of(sample_meta()));

    // Set semantics: duplikat wlasciciela odrzucony (pierwsze wystapienie wygrywa).
    assert_eq!(state.forced[0].pending_owners, vec![2, 3]);
    assert_eq!(state.forced[0].cycle_owners, vec![4]);
    assert_eq!(state.forced[0].rest_until_by_owner, vec![(2, 120.0)]);

    let pair = &state.forced[0].active_by_pair_key[0];
    assert_eq!(pair.0, "1|2");
    assert_eq!(
        pair.1,
        ForcedWarPairState {
            attacker_id: 1,
            target_id: 2,
            captured_by_attacker: 0,
            captured_by_defender: 0,
            start_turn: Some(80.0),
        }
    );

    assert_eq!(
        state.bronze_era_enter_turn_by_owner,
        vec![(0, 150.0), (5, 160.0)]
    );
    assert_eq!(state.iron_era_enter_turn_by_owner, vec![(0, 300.0)]);
    assert_eq!(state.forced[1].pending_owners, vec![5]);
}

#[test]
fn wrong_typed_field_degrades_to_empty_without_failing_block() {
    let meta = meta_of(json!({
        "stoneForceWarPendingOwners": "nie-tablica",
        "stoneForceWarCycleOwners": [7],
        "bronzeEraEnterTurnByOwner": {"0": 150},
        "ironEraEnterTurnByOwner": [[0, 300]]
    }));
    let state = WarTurnState::from_meta_json(&meta);

    assert!(state.forced[0].pending_owners.is_empty());
    assert_eq!(state.forced[0].cycle_owners, vec![7]);
    assert!(state.bronze_era_enter_turn_by_owner.is_empty());
    assert_eq!(state.iron_era_enter_turn_by_owner, vec![(0, 300.0)]);
}

#[test]
fn pair_without_start_turn_stays_without_start_turn() {
    let meta = meta_of(json!({
        "ironForceWarActiveByPairKey": [
            ["0|9", {"attackerId": 0, "targetId": 9, "capturedByAttacker": 1, "capturedByDefender": 0}]
        ]
    }));
    let state = WarTurnState::from_meta_json(&meta);
    assert_eq!(state.forced[2].active_by_pair_key[0].1.start_turn, None);

    let out = state.to_meta_json();
    let entry = &out["ironForceWarActiveByPairKey"][0][1];
    assert!(entry.get("startTurn").is_none());
    assert_eq!(entry["capturedByAttacker"], json!(1));
}

#[test]
fn integral_numbers_are_written_as_json_integers() {
    let state = WarTurnState {
        forced: [
            ForcedWarSaveState::default(),
            ForcedWarSaveState::default(),
            ForcedWarSaveState::default(),
        ],
        bronze_era_enter_turn_by_owner: vec![(3, 150.0)],
        ..Default::default()
    };
    let out = state.to_meta_json();
    assert_eq!(out["bronzeEraEnterTurnByOwner"], json!([[3, 150]]));
    assert!(out["bronzeEraEnterTurnByOwner"][0][1].is_i64());
}

#[test]
fn second_round_trip_is_stable() {
    let first = WarTurnState::from_meta_json(&meta_of(sample_meta())).to_meta_json();
    let second = WarTurnState::from_meta_json(&first).to_meta_json();
    assert_eq!(first, second);
}
