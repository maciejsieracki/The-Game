#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
mod save_load;

use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use save_load::{
    migrate_v1, EventQueue, SaveSnapshot, TurnEvent, TurnPhase, CURRENT_SNAPSHOT_VERSION,
};

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

fn current_snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    queue.enqueue(3, TurnPhase::Victory, TurnEvent::VictoryCheck);

    let mut rng = Rng::new(42);
    rng.next_u32();
    SaveSnapshot::new(valid_state(), queue, rng)
}

#[test]
fn current_snapshot_round_trips_with_state_queue_rng_and_version() {
    let snapshot = current_snapshot();

    let encoded = serde_json::to_string(&snapshot).expect("snapshot serializes");
    assert!(encoded.contains("\"version\":2"));

    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("snapshot deserializes");

    assert_eq!(decoded, snapshot);
    assert_eq!(decoded.version(), CURRENT_SNAPSHOT_VERSION);
    assert_eq!(decoded.state().turn().number(), 3);
    assert_eq!(decoded.event_queue().len(), 2);
    assert_eq!(decoded.rng().state(), snapshot.rng().state());
}

#[test]
fn version_one_snapshot_migrates_by_adding_an_empty_queue() {
    let state = valid_state();
    let state_json = serde_json::to_string(&state).expect("legacy state serializes");
    let legacy_json = format!(r#"{{"version":1,"state":{state_json},"rng_state":305419896}}"#);

    let migrated: SaveSnapshot =
        serde_json::from_str(&legacy_json).expect("version one snapshot migrates");

    assert_eq!(migrated.version(), CURRENT_SNAPSHOT_VERSION);
    assert_eq!(migrated.state(), &state);
    assert!(migrated.event_queue().is_empty());
    assert_eq!(migrated.rng().state(), 305419896);
}

#[test]
fn explicit_v1_constructor_uses_the_same_migration_contract() {
    let migrated = migrate_v1(valid_state(), 0xdead_beef);

    assert_eq!(migrated.version(), CURRENT_SNAPSHOT_VERSION);
    assert!(migrated.event_queue().is_empty());
    assert_eq!(migrated.rng().state(), 0xdead_beef);
}

#[test]
fn snapshot_parts_can_be_moved_into_a_runtime_restore() {
    let snapshot = current_snapshot();
    let expected_state = snapshot.state().clone();
    let expected_rng_state = snapshot.rng().state();

    let (state, queue, rng) = snapshot.into_parts();

    assert_eq!(state, expected_state);
    assert_eq!(queue.len(), 2);
    assert_eq!(rng.state(), expected_rng_state);
}

#[test]
fn future_and_incomplete_versions_are_rejected_without_silent_defaults() {
    let state_json = serde_json::to_string(&valid_state()).expect("state serializes");
    let future = format!(r#"{{"version":99,"state":{state_json}}}"#);
    let future_error = serde_json::from_str::<SaveSnapshot>(&future)
        .expect_err("future versions must not be loaded");
    assert!(future_error
        .to_string()
        .contains("unsupported snapshot version"));

    let missing_rng = format!(
        r#"{{"version":{},"state":{state_json},"event_queue":{{"events":[],"next_sequence":0}}}}"#,
        CURRENT_SNAPSHOT_VERSION
    );
    assert!(serde_json::from_str::<SaveSnapshot>(&missing_rng).is_err());

    let missing_legacy_rng = format!(r#"{{"version":1,"state":{state_json}}}"#);
    assert!(serde_json::from_str::<SaveSnapshot>(&missing_legacy_rng).is_err());
}

#[test]
fn invalid_state_is_rejected_during_snapshot_deserialization() {
    let invalid_state = r#"{
        "map":{"width":1,"height":1,"tiles":[{"position":{"x":0,"y":0},"terrain":"Plains"}]},
        "civilizations":[],
        "cities":[],
        "units":[],
        "turn":0
    }"#;
    let json = format!(
        r#"{{"version":{},"state":{},"event_queue":{{"events":[],"next_sequence":0}},"rng":{{"state":7}}}}"#,
        CURRENT_SNAPSHOT_VERSION, invalid_state
    );

    assert!(serde_json::from_str::<SaveSnapshot>(&json).is_err());
}
