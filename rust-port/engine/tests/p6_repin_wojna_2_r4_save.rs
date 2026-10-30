//! REPIN-WOJNA-2 R4 - wpiecie `meta.battleModeSettingVersion`, `newGameParams.advanced.battleAlwaysManual`,
//! `plannedMarches` i `autoMarch` w zapis/odczyt `SaveSnapshot` (logika, bez UI).
//!
//! Zrodla semantyki (pin `dc8a3adc`): `main.ts:40818-40821` (restore), `main.ts:29052-29060`
//! (`playerBattleAutomaticOnly`), `planned-march.ts:438-485` (plannedMarches load/save).
//! Wektory: `tests/p6_repin_wojna_2_r4_vectors/save-meta.json` (generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-r4-save-meta.mjs`)
//! oraz `tests/p6_repin_wojna_2_r3_vectors/planned-march-general.json` (fromSave, wejscie przez zapis).

#[path = "../src/domain/battle_mode.rs"]
#[allow(dead_code)]
mod battle_mode;

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

#[path = "p6_4_vectors/common.rs"]
mod common;

use battle_mode::{player_battle_automatic_only, restored_setting_version};
use civ_engine::domain::pathfinding::ruch_jednostek::{
    planned_marches_from_save, AutoMarchSave, PlannedMarchDest, PlannedMarchSaved,
};
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use common::{load, num, opt_string, units};
use events::{EventQueue, TurnEvent};
use save_load::{SaveMeta, SaveSnapshot, SavedAutoMarch, SavedPlannedMarch, TurnPhase};
use serde_json::{Number, Value};

const META_VECTORS: &str = include_str!("p6_repin_wojna_2_r4_vectors/save-meta.json");
const PLANNED_VECTORS: &str =
    include_str!("p6_repin_wojna_2_r3_vectors/planned-march-general.json");

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

/// Web `restoreGameFromSave` (`main.ts:40818-40821`) on the decoded snapshot.
fn restored(snapshot: &SaveSnapshot) -> Option<f64> {
    restored_setting_version(snapshot.meta().battle_mode_setting_value())
}

/// Web `playerBattleAutomaticOnly` (`main.ts:29052-29060`) on the decoded snapshot.
fn auto_only(snapshot: &SaveSnapshot, is_me: bool) -> bool {
    player_battle_automatic_only(
        is_me,
        restored(snapshot),
        snapshot.meta().battle_always_manual(),
    )
}

fn num_of(value: f64) -> Option<Number> {
    Number::from_f64(value)
}

fn opt_number(value: Option<&Value>) -> Option<Number> {
    value.and_then(|v| v.as_number().cloned())
}

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

#[test]
fn save_meta_vectors_match_web_restore_and_automatic_only() {
    let root = load(META_VECTORS);
    assert_eq!(root["constVersion"].as_f64(), Some(1.0));
    let cases = root["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), root["count"].as_u64().expect("count") as usize);
    let (mut restored_some, mut auto_true) = (0usize, 0usize);
    for case in cases {
        let meta_json = case["metaJson"].as_str().expect("metaJson");
        let meta: SaveMeta = serde_json::from_str(meta_json).expect("meta parses");
        let is_me = case["isMe"].as_bool().expect("isMe");
        let snap = snapshot().with_meta(meta);
        // Zapis -> odczyt przez pelny serde (ten sam ksztalt co na dysku).
        let encoded = serde_json::to_string(&snap).expect("snapshot serializes");
        let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("snapshot deserializes");

        let want_version = case["restoredVersion"].as_f64();
        let got_version = restored(&decoded);
        assert_eq!(got_version, want_version, "restore {meta_json}");
        if got_version.is_some() {
            restored_some += 1;
        }
        let want_auto = case["automaticOnly"].as_bool().expect("automaticOnly");
        assert_eq!(
            auto_only(&decoded, is_me),
            want_auto,
            "automaticOnly {meta_json} isMe={is_me}"
        );
        if want_auto {
            auto_true += 1;
        }
    }
    // Pokrycie: wersje `1` i `1.0` (2 z 12 wartosci) przechodza: 2 * 6 * 4 * 2 = 96 przypadkow;
    // tryb auto-only: wersja 1 + `battleAlwaysManual: false` + ksztalt `advanced` + isMe = 2 przypadki.
    assert_eq!(restored_some, 96, "wersja 1 w wektorach");
    assert_eq!(auto_true, 2, "tryb auto-only w wektorach");
}

#[test]
fn snapshot_without_r4_fields_omits_them_and_loads_with_defaults() {
    let encoded = serde_json::to_string(&snapshot()).expect("serializes");
    assert!(!encoded.contains("\"meta\""), "{encoded}");
    assert!(!encoded.contains("plannedMarches"), "{encoded}");
    assert!(!encoded.contains("autoMarch"), "{encoded}");
    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("decodes");
    assert!(decoded.meta().is_empty());
    assert!(decoded.planned_marches().is_empty());
    assert!(decoded.auto_march().is_none());
    assert_eq!(restored(&decoded), None);
    assert!(!auto_only(&decoded, true));
}

#[test]
fn meta_and_planned_marches_round_trip_through_snapshot_json() {
    let meta = SaveMeta::default()
        .with_battle_mode_setting_version(Value::from(1))
        .with_new_game_params(serde_json::json!({"advanced": {"battleAlwaysManual": false}}));
    let planned = vec![SavedPlannedMarch {
        unit_id: "u1".to_owned(),
        dest_q: num_of(3.0),
        dest_r: num_of(-1.0),
        attack_unit_id: None,
        general_target_id: Some("g1".to_owned()),
    }];
    let original = snapshot()
        .with_meta(meta)
        .with_planned_marches(planned)
        .with_auto_march(Some(SavedAutoMarch {
            leader_id: Some("u1".to_owned()),
            dest_q: num_of(3.0),
            dest_r: num_of(-1.0),
        }));
    let encoded = serde_json::to_string(&original).expect("serializes");
    assert!(
        encoded.contains("\"battleModeSettingVersion\":1"),
        "{encoded}"
    );
    assert!(
        encoded.contains("\"battleAlwaysManual\":false"),
        "{encoded}"
    );
    assert!(encoded.contains("\"generalTargetId\":\"g1\""), "{encoded}");
    assert!(
        !encoded.contains("attackUnitId"),
        "pole None nie jest zapisywane: {encoded}"
    );
    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("decodes");
    assert_eq!(decoded, original);
    assert!(auto_only(&decoded, true));
    assert!(!auto_only(&decoded, false));
}

#[test]
fn non_conforming_r4_values_normalize_like_web_without_load_errors() {
    // web: `=== 1` (string "1" -> nie), `battleAlwaysManual` nie-boolowskie -> nie auto-only.
    let json = r#"{
        "version": 2,
        "state": null,
        "event_queue": null,
        "rng": null,
        "meta": {"battleModeSettingVersion": "1", "newGameParams": {"advanced": {"battleAlwaysManual": "false"}}},
        "plannedMarches": [
            {"unitId": "a", "destQ": "3", "destR": 1, "attackUnitId": "", "generalTargetId": 5},
            {"unitId": "b", "destQ": 2, "destR": 2, "attackUnitId": "x", "generalTargetId": "g"}
        ]
    }"#;
    let wire: serde_json::Value = serde_json::from_str(json).expect("json");
    let meta: SaveMeta = serde_json::from_value(wire["meta"].clone()).expect("meta");
    assert_eq!(
        restored_setting_version(meta.battle_mode_setting_value()),
        None
    );
    assert_eq!(meta.battle_always_manual(), None);
    let entries: Vec<SavedPlannedMarch> =
        serde_json::from_value(wire["plannedMarches"].clone()).expect("entries");
    assert_eq!(entries[0].dest_q, None);
    assert_eq!(entries[0].attack_unit_id, None);
    assert_eq!(entries[0].general_target_id, None);
    assert_eq!(
        entries[1].dest_q.as_ref().and_then(Number::as_f64),
        Some(2.0)
    );
    assert_eq!(entries[1].attack_unit_id.as_deref(), Some("x"));
    assert_eq!(entries[1].general_target_id.as_deref(), Some("g"));
}

fn auto_march_of(snapshot: &SaveSnapshot) -> Option<AutoMarchSave> {
    snapshot.auto_march().map(|saved| AutoMarchSave {
        leader_id: saved.leader_id.clone(),
        dest_q: saved.dest_q.as_ref().and_then(Number::as_f64),
        dest_r: saved.dest_r.as_ref().and_then(Number::as_f64),
    })
}

fn dest_from(value: &Value) -> PlannedMarchDest {
    PlannedMarchDest {
        dest_q: num(&value["destQ"]),
        dest_r: num(&value["destR"]),
        attack_unit_id: opt_string(value.get("attackUnitId")),
        general_target_id: opt_string(value.get("generalTargetId")),
    }
}

#[test]
fn planned_marches_wiring_through_save_matches_web_from_save_vectors() {
    let root = load(PLANNED_VECTORS);
    let cases = root["fromSave"].as_array().expect("fromSave");
    let (mut checked, mut with_auto) = (0usize, 0usize);
    for case in cases {
        let list = units(&case["units"]);
        let owner = case["owner"].as_i64().expect("owner");
        // Wejscie web (`plannedMarches` jako lista wpisow; wpisy `null` web pomija przy zapisie).
        let mut entries = Vec::new();
        if let Some(pairs) = case["planned"].as_array() {
            for pair in pairs {
                let uid = pair[0].as_str().expect("uid").to_owned();
                let dest = &pair[1];
                if dest.is_null() {
                    continue;
                }
                entries.push(SavedPlannedMarch {
                    unit_id: uid,
                    dest_q: opt_number(dest.get("destQ")),
                    dest_r: opt_number(dest.get("destR")),
                    attack_unit_id: opt_string(dest.get("attackUnitId")),
                    general_target_id: opt_string(dest.get("generalTargetId")),
                });
            }
        }
        let auto = if case["saved"].is_null() {
            None
        } else {
            Some(SavedAutoMarch {
                leader_id: opt_string(case["saved"].get("leaderId")),
                dest_q: opt_number(case["saved"].get("destQ")),
                dest_r: opt_number(case["saved"].get("destR")),
            })
        };
        // Zapis -> odczyt przez SaveSnapshot.
        let saved = snapshot()
            .with_planned_marches(entries)
            .with_auto_march(auto);
        let encoded = serde_json::to_string(&saved).expect("serializes");
        let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("decodes");

        let pairs: Vec<(String, Option<PlannedMarchSaved>)> = decoded
            .planned_marches()
            .iter()
            .map(|e| {
                (
                    e.unit_id.clone(),
                    Some(PlannedMarchSaved {
                        dest_q: e.dest_q.as_ref().and_then(Number::as_f64),
                        dest_r: e.dest_r.as_ref().and_then(Number::as_f64),
                        attack_unit_id: e.attack_unit_id.clone(),
                        general_target_id: e.general_target_id.clone(),
                    }),
                )
            })
            .collect();
        let auto_march = auto_march_of(&decoded);
        if auto_march.is_some() {
            with_auto += 1;
        }
        let got = planned_marches_from_save(auto_march.as_ref(), Some(&pairs), &list, owner);
        let want = case["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "dlugosc {case}");
        for ((uid, dest), want) in got.iter().zip(want) {
            assert_eq!(uid, want[0].as_str().expect("uid"), "{case}");
            assert_eq!(*dest, dest_from(&want[1]), "{case}");
        }
        checked += 1;
    }
    assert_eq!(checked, cases.len());
    assert!(with_auto > 0, "pokrycie: brak przypadkow z autoMarch");
}
