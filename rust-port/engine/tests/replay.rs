#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

#[path = "../src/domain/replay.rs"]
#[allow(dead_code)]
mod replay;

use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use replay::{ReplayLog, ReplayRecorder, CURRENT_REPLAY_VERSION};
use save_load::{EventQueue, SaveSnapshot, TurnEvent, TurnPhase};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
enum Input {
    Move { unit: u32, x: u16, y: u16 },
    EndTurn,
}

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

fn checkpoint_snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(
        valid_state(),
        queue,
        civ_engine::Rng::from_state(0xdead_beef),
    )
}

#[test]
fn recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic() {
    let mut first = ReplayRecorder::new(42);
    let mut second = ReplayRecorder::new(42);
    let inputs = [
        Input::Move {
            unit: 8,
            x: 0,
            y: 0,
        },
        Input::EndTurn,
    ];

    for (turn, input) in [(3, inputs[0].clone()), (3, inputs[1].clone())] {
        first.rng_mut().next_u32();
        second.rng_mut().next_u32();
        first
            .record(turn, input.clone(), None)
            .expect("first recording is valid");
        second
            .record(turn, input, None)
            .expect("second recording is valid");
    }

    let first = first.finish();
    let second = second.finish();
    assert_eq!(first, second);

    let first_json = serde_json::to_string(&first).expect("first replay serializes");
    let second_json = serde_json::to_string(&second).expect("second replay serializes");
    assert_eq!(first_json, second_json);

    let restored: ReplayLog<Input> =
        serde_json::from_str(&first_json).expect("replay deserializes");
    assert_eq!(restored, first);
    assert_eq!(restored.seed(), 42);
    assert_eq!(restored.version(), CURRENT_REPLAY_VERSION);
}

#[test]
fn replay_playback_preserves_order_rng_checkpoints_and_snapshots() {
    let snapshot = checkpoint_snapshot();
    let mut recorder = ReplayRecorder::new(7);
    recorder
        .record(3, Input::EndTurn, Some(snapshot.clone()))
        .expect("snapshot recording is valid");
    recorder.rng_mut().next_u32();
    recorder
        .record(
            4,
            Input::Move {
                unit: 8,
                x: 1,
                y: 0,
            },
            None,
        )
        .expect("second recording is valid");
    let log = recorder.finish();

    let mut playback = log.replay().expect("valid replay creates playback");
    assert_eq!(playback.seed(), 7);
    assert_eq!(playback.position(), 0);
    assert_eq!(playback.rng().state(), 7);

    let first = playback.next().expect("first recorded input");
    assert_eq!(first.sequence(), 0);
    assert_eq!(first.turn(), 3);
    assert_eq!(first.input(), &Input::EndTurn);
    assert_eq!(first.rng_state(), 7);
    assert_eq!(first.snapshot(), Some(&snapshot));
    assert_eq!(playback.rng().state(), first.rng_state());

    let second = playback.next().expect("second recorded input");
    assert_eq!(second.sequence(), 1);
    assert_eq!(second.turn(), 4);
    assert_eq!(
        second.input(),
        &Input::Move {
            unit: 8,
            x: 1,
            y: 0,
        }
    );
    assert_ne!(second.rng_state(), first.rng_state());
    assert!(second.snapshot().is_none());
    assert!(playback.is_finished());
    assert!(playback.next().is_none());
}

#[test]
fn playback_cursor_observes_peek_remaining_and_reset() {
    let mut recorder = ReplayRecorder::new(7);
    recorder
        .record(3, Input::EndTurn, None)
        .expect("first recording is valid");
    recorder.rng_mut().next_u32();
    recorder
        .record(
            4,
            Input::Move {
                unit: 8,
                x: 1,
                y: 0,
            },
            None,
        )
        .expect("second recording is valid");
    let log = recorder.finish();

    let mut playback = log.replay().expect("valid replay creates playback");
    assert_eq!(playback.position(), 0);
    assert_eq!(playback.remaining(), 2);

    let peeked_first = playback.peek().expect("peek exposes the first step");
    assert_eq!(peeked_first.sequence(), 0);
    assert_eq!(peeked_first.input(), &Input::EndTurn);
    assert_eq!(playback.position(), 0);
    assert_eq!(playback.remaining(), 2);

    let first = playback.next().expect("first recorded input");
    assert_eq!(first.sequence(), 0);
    assert_eq!(playback.position(), 1);
    assert_eq!(playback.remaining(), 1);
    let peeked_second = playback.peek().expect("peek exposes the second step");
    assert_eq!(peeked_second.sequence(), 1);
    assert_eq!(
        peeked_second.input(),
        &Input::Move {
            unit: 8,
            x: 1,
            y: 0
        }
    );

    let second = playback.next().expect("second recorded input");
    assert_eq!(second.sequence(), 1);
    assert_eq!(playback.position(), 2);
    assert_eq!(playback.remaining(), 0);
    assert!(playback.peek().is_none());

    playback.reset();
    assert_eq!(playback.position(), 0);
    assert_eq!(playback.remaining(), 2);
    assert_eq!(playback.rng().state(), 7);
    assert_eq!(
        playback
            .peek()
            .expect("reset restores the first step")
            .sequence(),
        0
    );

    let replayed_first = playback.next().expect("reset playback can advance again");
    assert_eq!(replayed_first.sequence(), 0);
    assert_eq!(replayed_first.input(), &Input::EndTurn);
    assert_eq!(playback.remaining(), 1);
}

#[test]
fn replay_log_round_trips_some_snapshot_with_all_snapshot_data() {
    let snapshot = checkpoint_snapshot();
    let mut recorder = ReplayRecorder::new(13);
    recorder
        .record(3, Input::EndTurn, Some(snapshot.clone()))
        .expect("snapshot recording is valid");
    let replay = recorder.finish();

    let encoded = serde_json::to_string(&replay).expect("replay with snapshot serializes");
    let restored: ReplayLog<Input> =
        serde_json::from_str(&encoded).expect("replay with snapshot deserializes");

    assert_eq!(restored, replay);
    assert_eq!(restored.version(), CURRENT_REPLAY_VERSION);
    assert_eq!(restored.seed(), 13);

    let restored_snapshot = restored
        .step(0)
        .expect("round-tripped step is present")
        .snapshot()
        .expect("round-tripped snapshot is present");
    assert_eq!(restored_snapshot.version(), snapshot.version());
    assert_eq!(restored_snapshot.state(), snapshot.state());
    assert_eq!(restored_snapshot.event_queue(), snapshot.event_queue());
    assert_eq!(restored_snapshot.rng(), snapshot.rng());
}

#[test]
fn replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps() {
    let missing_version = r#"{"seed":7,"steps":[]}"#;
    assert!(serde_json::from_str::<ReplayLog<Input>>(missing_version)
        .expect_err("version is required")
        .to_string()
        .contains("replay version is missing"));

    let unsupported = r#"{"version":99,"seed":7,"steps":[]}"#;
    assert!(serde_json::from_str::<ReplayLog<Input>>(unsupported)
        .expect_err("unsupported versions are rejected")
        .to_string()
        .contains("unsupported replay version 99"));

    let non_contiguous = r#"{
        "version":1,
        "seed":7,
        "steps":[
            {"sequence":1,"turn":3,"input":"EndTurn","rng_state":7,"snapshot":null}
        ]
    }"#;
    assert!(serde_json::from_str::<ReplayLog<Input>>(non_contiguous)
        .expect_err("step sequence must start at zero")
        .to_string()
        .contains("expected replay sequence 0, found 1"));
}

#[test]
fn replay_validation_rejects_invalid_checkpoint_snapshots() {
    let invalid_state = r#"{
        "map":{"width":1,"height":1,"tiles":[{"position":{"x":0,"y":0},"terrain":"Plains"}]},
        "civilizations":[],
        "cities":[],
        "units":[],
        "turn":0
    }"#;
    let json = format!(
        r#"{{"version":1,"seed":7,"steps":[{{"sequence":0,"turn":1,"input":"EndTurn","rng_state":7,"snapshot":{{"version":2,"state":{},"event_queue":{{"events":[],"next_sequence":0}},"rng":{{"state":7}}}}}}]}}"#,
        invalid_state
    );

    assert!(serde_json::from_str::<ReplayLog<Input>>(&json).is_err());
}
