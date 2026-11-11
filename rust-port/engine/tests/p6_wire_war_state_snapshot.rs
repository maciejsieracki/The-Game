//! P6-WIRE-WAR-STATE (W1, runda 3): wpiecie `WarTurnState` do `GameStateDto`/`PlayableState` (D1=B)
//! oraz test PRZEZ pelny `SaveSnapshot`; wektory 3 pol opaque pochodza z uruchomionego weba
//! (`tests/p6_wire_war_state_vectors/opaque-web.json`; generator: esbuild bundle
//! `gra/src/game/{forced-war-common,forced-war-waves,ai-general-war-campaign}.ts` z
//! `git archive origin/main`, Node 22; funkcje `serializeForcedEraPeaceLocks`,
//! `serializeForcedWarWaves`, `aiGeneralCampaignToSave`).

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayableState, PlayerId, PositionDto,
    Rng, TerrainDto, TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{SaveSnapshot, TurnPhase};
use serde_json::{json, Map, Value};

fn valid_state() -> GameStateDto {
    let map = MapDto::new(
        2,
        1,
        vec![
            civ_engine::TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            civ_engine::TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");
    GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(3).expect("turn three is valid"),
    )
    .expect("state is valid")
}

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

fn web_vectors() -> Map<String, Value> {
    let text = include_str!("p6_wire_war_state_vectors/opaque-web.json");
    serde_json::from_str::<Value>(text)
        .expect("vector json")
        .as_object()
        .cloned()
        .expect("vector object")
}

/// Meta weba: pola typowane + 3 pola opaque z uruchomionego weba.
fn web_meta_with_vectors() -> Map<String, Value> {
    let mut meta = web_vectors();
    meta.insert("stoneForceWarPendingOwners".into(), json!([2, 3]));
    meta.insert("stoneForceWarRestUntilByOwner".into(), json!([[2, 120]]));
    meta.insert("bronzeEraEnterTurnByOwner".into(), json!([[0, 150]]));
    meta.insert("siegeTurnByCity".into(), json!([["c9", 12]]));
    meta
}

fn web_save_json(meta: &Map<String, Value>) -> Value {
    let mut v = serde_json::to_value(snapshot()).expect("serialize");
    v.as_object_mut()
        .expect("object")
        .insert("meta".into(), Value::Object(meta.clone()));
    v
}

#[test]
fn old_save_without_war_fields_loads_unchanged_and_writes_no_new_keys() {
    let base = serde_json::to_value(snapshot()).expect("serialize");
    let text = base.to_string();
    assert!(!text.contains("\"war\""));
    assert!(!text.contains("ForceWar"));
    let decoded: SaveSnapshot = serde_json::from_value(base.clone()).expect("old save loads");
    assert!(decoded.war_turn_state().is_default());
    assert_eq!(serde_json::to_value(&decoded).expect("re-serialize"), base);
}

#[test]
fn snapshot_with_war_state_round_trips_through_serde() {
    let mut war = WarTurnState::default();
    war.opaque.insert(
        "forcedWarWavesByPairKey".into(),
        web_vectors()["forcedWarWavesByPairKey"].clone(),
    );
    war.bronze_era_enter_turn_by_owner = vec![(0, 150.0), (5, 160.0)];
    let snap = snapshot().with_war_turn_state(war.clone());
    let encoded = serde_json::to_value(&snap).expect("serialize");
    assert!(encoded["state"]["war"].is_object());
    // Jedno zrodlo prawdy: wojna nie jest zapisana drugi raz w `meta`.
    assert!(encoded.get("meta").is_none());
    let decoded: SaveSnapshot = serde_json::from_value(encoded.clone()).expect("deserialize");
    assert_eq!(decoded.war_turn_state(), &war);
    assert_eq!(
        serde_json::to_value(&decoded).expect("re-serialize"),
        encoded
    );
}

#[test]
fn web_format_meta_is_migrated_into_state_and_exports_back_identically() {
    let meta = web_meta_with_vectors();
    let decoded: SaveSnapshot =
        serde_json::from_value(web_save_json(&meta)).expect("web save loads");
    let war = decoded.war_turn_state();
    assert_eq!(war.forced[0].pending_owners, vec![2, 3]);
    assert_eq!(war.bronze_era_enter_turn_by_owner, vec![(0, 150.0)]);
    // Po migracji `meta` nie dubluje kluczy wojny.
    assert!(decoded.meta().is_empty());
    // Eksport do formatu weba zwraca dokladnie wejsciowe wartosci wektorow i pol typowanych.
    let exported = serde_json::to_value(decoded.web_meta()).expect("export");
    let exported = exported.as_object().expect("object");
    for (key, value) in &meta {
        assert_eq!(exported.get(key), Some(value), "klucz {key}");
    }
    // Zapis wlasny -> odczyt daje ten sam stan.
    let again: SaveSnapshot =
        serde_json::from_value(serde_json::to_value(&decoded).expect("ser")).expect("de");
    assert_eq!(again.war_turn_state(), war);
}

#[test]
fn other_meta_fields_survive_next_to_war_migration() {
    let mut meta = web_meta_with_vectors();
    meta.insert("battleModeSettingVersion".into(), json!(2));
    let decoded: SaveSnapshot = serde_json::from_value(web_save_json(&meta)).expect("loads");
    let out = serde_json::to_value(&decoded).expect("ser");
    assert_eq!(out["meta"]["battleModeSettingVersion"], json!(2));
    assert!(out["meta"].get("stoneForceWarPendingOwners").is_none());
}

#[test]
fn state_war_wins_over_meta_when_both_present() {
    let mut v = web_save_json(&web_meta_with_vectors());
    let war = WarTurnState {
        bronze_era_enter_turn_by_owner: vec![(9, 1.0)],
        ..Default::default()
    };
    v["state"]["war"] = serde_json::to_value(&war).expect("war");
    let decoded: SaveSnapshot = serde_json::from_value(v).expect("loads");
    assert_eq!(decoded.war_turn_state(), &war);
    assert!(decoded.meta().is_empty());
}

#[test]
fn game_state_dto_carries_war_with_serde_default() {
    let state = valid_state();
    assert!(state.war_turn_state().is_default());
    let plain = serde_json::to_value(&state).expect("ser");
    assert!(plain.get("war").is_none());
    let war = WarTurnState {
        iron_era_enter_turn_by_owner: vec![(2, 300.0)],
        ..Default::default()
    };
    let with = state.with_war_turn_state(war.clone());
    let back: GameStateDto =
        serde_json::from_value(serde_json::to_value(&with).expect("ser")).expect("de");
    assert_eq!(back.war_turn_state(), &war);
    let old: GameStateDto = serde_json::from_value(plain).expect("old state loads");
    assert!(old.war_turn_state().is_default());
}

#[test]
fn playable_state_war_is_additive() {
    let empty = PlayableState::empty();
    let json = serde_json::to_value(&empty).expect("ser");
    assert!(json.get("war").is_none(), "pusty stan nie zmienia DTO");
    let old: PlayableState = serde_json::from_value(json).expect("old dto loads");
    assert_eq!(old, empty);
    let mut with = empty.clone();
    with.war.bronze_era_enter_turn_by_owner = vec![(1, 10.0)];
    let back: PlayableState =
        serde_json::from_value(serde_json::to_value(&with).expect("ser")).expect("de");
    assert_eq!(back.war, with.war);
}

#[test]
fn web_vectors_for_opaque_fields_round_trip_equal() {
    let vectors = web_vectors();
    assert_eq!(vectors.len(), 3);
    let out = WarTurnState::from_meta_json(&vectors).to_meta_json();
    for key in [
        "forcedEraPeaceUntilNextEraByPairKey",
        "forcedWarWavesByPairKey",
        "aiGeneralWarCampaignByOwner",
    ] {
        assert_eq!(out.get(key), vectors.get(key), "{key}");
    }
    // Pole odrzucane przez web serializer (`extraDropped`) nie ma prawa byc w wektorze.
    assert!(!vectors["aiGeneralWarCampaignByOwner"]
        .to_string()
        .contains("extraDropped"));
}
