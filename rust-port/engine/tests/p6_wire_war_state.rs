//! P6-WIRE-WAR-STATE (W1): round-trip stanu wojny w `meta` zapisu oraz zgodnosc kluczy z webem.
//! Wektory sa pisane recznie, ale KSZTALTY wartosci opakowanych pol biora sie z serializatorow
//! webu (`forced-war-common.ts:155-159`, `forced-war-waves.ts:237-245`,
//! `ai-general-war-campaign.ts:156-170`, typy `war-weariness.ts:150`, `main.ts:2308-2311`).
//! NIE_ZMIERZONO: generator z uruchomionego weba (Node 22) nie jest jeszcze podpiety.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code, unused_imports)]
mod save_load;

use civ_engine::domain::war_forced_pairing::{ForcedWarPairState, ForcedWarSaveState};
use civ_engine::domain::war_turn_state::{
    managed_meta_keys, WarTurnState, DIPLOMACY_RAW_META_KEYS, OPAQUE_WAR_META_KEYS,
    SIEGE_RAW_META_KEYS,
};
use save_load::SaveMeta;
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
        "regularWarCapturedByPairKey": [["3|4", {"ownerA": 3, "ownerB": 4, "capturedByA": 1, "capturedByB": 0}]],
        "aiAiPeaceRequestByPairKey": [],
        "warWearinessByPairKey": [["3|4", {"warStart": 80, "peak": 12, "stage": 1}]],
        "forcedEraPeaceUntilNextEraByPairKey": [["3|4", {"ownerId": 3, "era": 1}]],
        "forcedWarWavesByPairKey": [["3|4", {"nextWaveId": 2, "waves": [], "history": []}]],
        "aiGeneralWarCampaignByOwner": [[3, {"targetOwnerId": 4, "stage": "gather", "gatherTurnsCompleted": 0}]]
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

#[test]
fn bad_element_inside_array_is_skipped_and_rest_kept() {
    // ZALOZENIE (plan): zly ELEMENT tablicy jest pomijany, reszta zostaje. Test przypina to zachowanie.
    let meta = meta_of(json!({
        "stoneForceWarRestUntilByOwner": [[2, 120], ["x", 5], [7, "bad"], [9, 40]]
    }));
    let out = WarTurnState::from_meta_json(&meta).to_meta_json();
    assert_eq!(
        out.get("stoneForceWarRestUntilByOwner"),
        Some(&json!([[2, 120], [9, 40]]))
    );
}

#[test]
fn wrong_type_of_whole_field_gives_empty_field() {
    let meta = meta_of(json!({"stoneForceWarPendingOwners": "nie-tablica"}));
    let out = WarTurnState::from_meta_json(&meta).to_meta_json();
    assert_eq!(out.get("stoneForceWarPendingOwners"), Some(&json!([])));
}

#[test]
fn siege_and_diplomacy_raw_keys_round_trip_unchanged() {
    let mut input = Map::new();
    for key in SIEGE_RAW_META_KEYS
        .iter()
        .chain(DIPLOMACY_RAW_META_KEYS.iter())
    {
        input.insert((*key).to_string(), json!([["1", {"x": 1}]]));
    }
    let out = WarTurnState::from_meta_json(&input).to_meta_json();
    for (key, expected) in &input {
        assert_eq!(out.get(key), Some(expected), "mismatch at {key}");
    }
}

#[test]
fn managed_keys_cover_every_written_key() {
    let mut full = meta_of(sample_meta());
    for key in SIEGE_RAW_META_KEYS
        .iter()
        .chain(DIPLOMACY_RAW_META_KEYS.iter())
    {
        full.insert((*key).to_string(), json!([]));
    }
    let written = WarTurnState::from_meta_json(&full).to_meta_json();
    let managed = managed_meta_keys();
    for key in written.keys() {
        assert!(managed.contains(key), "written key not managed: {key}");
    }
}

#[test]
fn save_meta_keeps_war_state_through_serde() {
    let mut raw = sample_meta().as_object().cloned().expect("object");
    raw.insert("label".into(), json!("Zapis 1"));
    raw.insert("battleModeSettingVersion".into(), json!(1));
    let meta: SaveMeta = serde_json::from_value(Value::Object(raw.clone())).expect("meta parses");

    let war = meta.war_turn_state();
    assert_eq!(war, WarTurnState::from_meta_json(&raw));

    let out = serde_json::to_value(meta.clone().with_war_turn_state(&war)).expect("serializes");
    let out = out.as_object().expect("object");
    assert_eq!(out.get("label"), Some(&json!("Zapis 1")));
    for key in OPAQUE_WAR_META_KEYS {
        assert_eq!(out.get(key), raw.get(key), "mismatch at {key}");
    }
}

#[test]
fn save_meta_from_old_save_writes_no_war_keys_by_default() {
    let meta: SaveMeta =
        serde_json::from_value(json!({"battleModeSettingVersion": 1})).expect("meta parses");
    assert_eq!(meta.war_turn_state(), WarTurnState::default());
    let out = serde_json::to_value(meta.clone()).expect("serializes");
    let out = out.as_object().expect("object");
    assert!(!out.contains_key("stoneForceWarPendingOwners"));
    assert!(!out.contains_key("bronzeEraEnterTurnByOwner"));
    let again = meta.clone().with_war_turn_state(&WarTurnState::default());
    assert_eq!(again, meta);
}

#[test]
fn set_war_state_then_clear_removes_war_keys() {
    let base: SaveMeta = serde_json::from_value(json!({
        "stoneForceWarPendingOwners": [2]
    }))
    .expect("meta parses");
    let mut war = base.war_turn_state();
    assert_eq!(war.forced[0].pending_owners, vec![2]);
    war.bronze_era_enter_turn_by_owner = vec![(5, 160.0)];
    let set = base.clone().with_war_turn_state(&war);
    assert_eq!(set.war_turn_state(), war);
    let cleared = set.with_war_turn_state(&WarTurnState::default());
    let out = serde_json::to_value(cleared).expect("serializes");
    assert!(!out
        .as_object()
        .expect("object")
        .contains_key("stoneForceWarPendingOwners"));
}
