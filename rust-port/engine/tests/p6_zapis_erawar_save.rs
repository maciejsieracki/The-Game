//! P6-ZAPIS-ERAWAR (runda 1): pole `meta.warRulesEraWarCountByCiv` w `SaveSnapshot` (zapis -> odczyt przez pelny serde).
//! Web: `main.ts:35745-35746` (zapis, tylko przy flagach multiwar), `main.ts:44950-44959` (odczyt przez
//! `restoreEraWarCounts`). Brak pola w starym zapisie NIE jest bledem: odtwarzamy z aktywnych par.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

use civ_engine::domain::diplomacy_multiwar::{
    rebuild_era_war_counts_from_active_pairs, record_era_forced_war_participation,
    restore_era_war_counts, ActiveWarPair, EraWarCounts,
};
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

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

fn epoch_of(oid: i64) -> i64 {
    match oid {
        0 | 3 => 1,
        1 => 2,
        _ => 3,
    }
}

fn pairs() -> Vec<ActiveWarPair> {
    vec![ActiveWarPair {
        attacker_id: 1,
        target_id: 2,
    }]
}

#[test]
fn zapis_licznikow_w_meta_przechodzi_przez_serde() {
    let mut counts = EraWarCounts::new();
    record_era_forced_war_participation(&mut counts, 1, 2, 2, 3);
    record_era_forced_war_participation(&mut counts, 1, 2, 2, 3);
    let snap = snapshot().with_meta(SaveMeta::default().with_era_war_counts(counts.entries()));

    let encoded = serde_json::to_string(&snap).expect("serialize");
    assert!(encoded.contains(r#""warRulesEraWarCountByCiv":[["1:2",2],["2:3",2]]"#));

    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("deserialize");
    let raw = decoded.meta().era_war_count_by_civ().expect("pole obecne");
    assert_eq!(raw, &json!([["1:2", 2], ["2:3", 2]]));
    let back = restore_era_war_counts(Some(raw), &pairs(), epoch_of);
    assert_eq!(back, counts);
}

#[test]
fn stary_zapis_bez_pola_nie_zapisuje_licznika_i_odbudowuje() {
    let encoded = serde_json::to_string(&snapshot()).expect("serialize");
    assert!(!encoded.contains("warRulesEraWarCountByCiv"));

    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("deserialize");
    assert!(decoded.meta().era_war_count_by_civ().is_none());
    let got = restore_era_war_counts(decoded.meta().era_war_count_by_civ(), &pairs(), epoch_of);
    assert_eq!(
        got,
        rebuild_era_war_counts_from_active_pairs(&pairs(), epoch_of)
    );
}

#[test]
fn zly_typ_pola_nie_psuje_reszty_meta() {
    let mut wire: Value = serde_json::to_value(snapshot()).expect("to_value");
    wire["meta"] = json!({
        "battleModeSettingVersion": 1,
        "warRulesEraWarCountByCiv": "bad"
    });
    let decoded: SaveSnapshot = serde_json::from_value(wire).expect("zly typ nie blokuje zapisu");
    assert_eq!(decoded.meta().battle_mode_setting_value(), Some(1.0));
    let got = restore_era_war_counts(decoded.meta().era_war_count_by_civ(), &pairs(), epoch_of);
    assert_eq!(
        got,
        rebuild_era_war_counts_from_active_pairs(&pairs(), epoch_of)
    );
}

#[test]
fn pusta_tablica_w_zapisie_daje_pusty_licznik() {
    let mut wire: Value = serde_json::to_value(snapshot()).expect("to_value");
    wire["meta"] = json!({ "warRulesEraWarCountByCiv": [] });
    let decoded: SaveSnapshot = serde_json::from_value(wire).expect("deserialize");
    let got = restore_era_war_counts(decoded.meta().era_war_count_by_civ(), &pairs(), epoch_of);
    assert!(got.is_empty());
}

#[test]
fn pusta_tablica_zapisywana_jako_pole() {
    let snap = snapshot().with_meta(SaveMeta::default().with_era_war_counts(&[]));
    let encoded = serde_json::to_string(&snap).expect("serialize");
    assert!(encoded.contains("warRulesEraWarCountByCiv"));
    let decoded: SaveSnapshot = serde_json::from_str(&encoded).expect("deserialize");
    assert_eq!(decoded.meta().era_war_count_by_civ(), Some(&json!([])));
}
