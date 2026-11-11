//! P6-ZAPIS-REPLAY-MIGRATE: test behawioralny wczytywania replayu ze starym snapshotem.
//! Snapshot z nadmiarem wodzow (stan sprzed migracji) wczytany przez `ReplayLog` musi dac
//! stan PO migracji (asercje na stanie), tak jak produkcyjny `load_save_snapshot`.

use civ_engine::domain::events::EventQueue;
use civ_engine::domain::replay::ReplayLog;
use civ_engine::domain::save_load::{SaveMeta, SaveSnapshot};
use civ_engine::domain::zapis_loader::load_save_snapshot;
use civ_engine::{
    CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto, TileDto,
    TurnDto, TurnEvent, TurnPhase, UnitDto, UnitId, UnitKindDto,
};
use serde_json::{json, Value};

const OWNER: u64 = 1;
const FOREIGN: u64 = 2;

type UnitSpec = (u64, u64, u16, u16, bool);

fn map(w: u16, h: u16) -> MapDto {
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            tiles.push(TileDto::new(PositionDto::new(x, y), TerrainDto::Plains));
        }
    }
    MapDto::new(w, h, tiles).expect("map")
}

fn state(map: MapDto, specs: &[UnitSpec]) -> GameStateDto {
    let mut civs = Vec::new();
    for owner in [OWNER, FOREIGN] {
        civs.push(
            CivilizationDto::new(
                PlayerId::new(owner),
                format!("civ{owner}"),
                Vec::<CityId>::new(),
                specs
                    .iter()
                    .filter(|s| s.1 == owner)
                    .map(|s| UnitId::new(s.0))
                    .collect(),
            )
            .expect("civ"),
        );
    }
    let cities = Vec::new();
    let units = specs
        .iter()
        .map(|s| {
            UnitDto::new(
                UnitId::new(s.0),
                PlayerId::new(s.1),
                UnitKindDto::Warrior,
                PositionDto::new(s.2, s.3),
            )
            .expect("unit")
            .with_general(s.4)
        })
        .collect();
    GameStateDto::new(map, civs, cities, units, TurnDto::new(3).expect("turn")).expect("state")
}

/// Snapshot w formacie produkcyjnym (JSON), jak zapisany przed migracja.
/// `owner_eras` trafia do `meta.ownerEraByOwner`, skad migracja czyta epoke wlasciciela.
fn snapshot_wire(specs: &[UnitSpec], owner_eras: Value) -> Value {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    let snapshot = SaveSnapshot::new(state(map(3, 1), specs), queue, Rng::new(42))
        .with_meta(SaveMeta::default());
    let mut wire = serde_json::to_value(&snapshot).expect("ser");
    wire["meta"]["ownerEraByOwner"] = owner_eras;
    wire
}

/// Replay z jednym krokiem, ktory niesie podany snapshot.
fn replay_text(snapshot: Value) -> String {
    let replay = json!({
        "version": 1,
        "seed": 13,
        "steps": [{
            "sequence": 0,
            "turn": 3,
            "input": "EndTurn",
            "rng_state": 7,
            "snapshot": snapshot,
        }],
    });
    serde_json::to_string(&replay).expect("replay text")
}

fn generals(s: &SaveSnapshot) -> Vec<u64> {
    s.state()
        .units()
        .iter()
        .filter(|u| u.is_general())
        .map(|u| u.id().get())
        .collect()
}

/// Wodzowie gracza 1 (era 2 => limit 2) i obcy wodz (id 20). Przed migracja 4 wodzow.
fn excess_generals_specs() -> Vec<UnitSpec> {
    vec![
        (10, OWNER, 0, 0, true),
        (11, OWNER, 1, 0, true),
        (12, OWNER, 2, 0, true),
        (20, FOREIGN, 2, 0, true),
    ]
}

fn replay_snapshot(text: &str) -> SaveSnapshot {
    let log: ReplayLog<String> = serde_json::from_str(text).expect("replay loads");
    log.step(0)
        .expect("step 0 present")
        .snapshot()
        .expect("snapshot present")
        .clone()
}

#[test]
fn p6_zapis_replay_migrates_old_snapshot_on_load() {
    let text = replay_text(snapshot_wire(
        &excess_generals_specs(),
        json!([[OWNER, 2.0], [FOREIGN, 2.0]]),
    ));

    let loaded = replay_snapshot(&text);
    assert_eq!(generals(&loaded), vec![10, 11, 20], "stan po migracji");
    assert_eq!(loaded.state().units().len(), 4, "nikt nie ginie");
}

#[test]
fn p6_zapis_replay_state_matches_production_loader() {
    let wire = snapshot_wire(
        &excess_generals_specs(),
        json!([[OWNER, 1.0], [FOREIGN, 3.0]]),
    );
    let (from_loader, _) =
        load_save_snapshot(&serde_json::to_string(&wire).expect("ser")).expect("loader");

    let from_replay = replay_snapshot(&replay_text(wire));
    assert_eq!(from_replay.state(), from_loader.state());
    assert_eq!(generals(&from_replay), vec![10, 20]);
}

#[test]
fn p6_zapis_replay_uses_per_owner_era() {
    // Epoka 1 dla gracza (limit 1) traci wodzow 11 i 12; epoka 3 dla obcego nie zmienia jego wodza.
    let text = replay_text(snapshot_wire(
        &excess_generals_specs(),
        json!([[OWNER, 1.0], [FOREIGN, 3.0]]),
    ));
    assert_eq!(generals(&replay_snapshot(&text)), vec![10, 20]);
}

#[test]
fn p6_zapis_replay_reload_after_migration_is_stable() {
    let text = replay_text(snapshot_wire(
        &excess_generals_specs(),
        json!([[OWNER, 2.0], [FOREIGN, 2.0]]),
    ));
    let once = replay_snapshot(&text);

    let again_text = replay_text(serde_json::to_value(&once).expect("ser"));
    let again = replay_snapshot(&again_text);
    assert_eq!(generals(&again), vec![10, 11, 20]);
    assert_eq!(again.state(), once.state(), "drugi odczyt bez zmian");
}
