//! P6-ZAPIS-MIGRACJE-FALA509 (runda 2): flagi `meta.autoBuildEnabled` / `meta.playerEpochWarEnabled`
//! przez PELNY `SaveSnapshot` (serde w obie strony), dla zapisu STAREGO (bez pol) i NOWEGO (z polami).
//! Web: `main.ts:46701` (`autoBuildFromSaveMeta`), `main.ts:46706` (`playerEpochWarEnabled`).

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{SaveMeta, SaveSnapshot, TurnPhase};
use serde_json::{json, Value};

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

fn snapshot_with_meta(meta: SaveMeta) -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42)).with_meta(meta)
}

/// Zapis sprzed P6-ZAPIS-MIGRACJE: w `meta` nie ma zadnego z dwoch pol.
fn old_save_json() -> Value {
    let encoded =
        serde_json::to_string(&snapshot_with_meta(SaveMeta::default())).expect("serialize");
    let wire: Value = serde_json::from_str(&encoded).expect("json");
    assert!(!encoded.contains("autoBuildEnabled"));
    assert!(!encoded.contains("playerEpochWarEnabled"));
    wire
}

#[test]
fn p6_zapis_migracje_snapshot_old_save_loads_with_web_defaults() {
    let decoded: SaveSnapshot =
        serde_json::from_value(old_save_json()).expect("stary zapis wczytuje sie");
    assert!(
        !decoded.meta().auto_build_enabled(),
        "brak pola = auto-budowa wylaczona"
    );
    assert!(
        decoded.meta().player_epoch_war_enabled(),
        "brak pola = playerEpochWar true"
    );
}

#[test]
fn p6_zapis_migracje_snapshot_new_flags_round_trip() {
    let meta = serde_json::from_value::<SaveMeta>(json!({
        "autoBuildEnabled": true,
        "playerEpochWarEnabled": false
    }))
    .expect("meta");
    let encoded = serde_json::to_string(&snapshot_with_meta(meta)).expect("serialize");
    assert!(encoded.contains(r#""autoBuildEnabled":true"#));
    assert!(encoded.contains(r#""playerEpochWarEnabled":false"#));

    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("deserialize");
    assert!(decoded.meta().auto_build_enabled());
    assert!(!decoded.meta().player_epoch_war_enabled());
}

#[test]
fn p6_zapis_migracje_snapshot_wrong_types_fall_back_like_web() {
    let mut wire = old_save_json();
    wire["meta"] = json!({ "autoBuildEnabled": "true", "playerEpochWarEnabled": "false" });
    let decoded: SaveSnapshot =
        serde_json::from_value(wire).expect("zly typ nie blokuje wczytania");
    assert!(
        !decoded.meta().auto_build_enabled(),
        "tylko JSON true wlacza"
    );
    assert!(
        decoded.meta().player_epoch_war_enabled(),
        "nie-boolean = jak brak pola"
    );
}
