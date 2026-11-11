//! P6-ZAPIS-LOADER-MIGRATE: test behawioralny produkcyjnego loadera zapisu.
//! Zapis z nadmiarem wodzow (stan sprzed migracji) wczytany przez `load_save_snapshot`
//! musi dac stan PO migracji, a nie tylko wywolanie funkcji migracji.

use civ_engine::domain::events::EventQueue;
use civ_engine::domain::save_load::{SaveMeta, SaveSnapshot};
use civ_engine::domain::zapis_loader::load_save_snapshot;
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TileDto, TurnDto, TurnEvent, TurnPhase, UnitDto, UnitId, UnitKindDto,
};

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
    let cities: Vec<CityDto> = Vec::new();
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

/// Zapis tekstowy w formacie produkcyjnym (serde JSON), tak jak zapisany przed migracja.
fn save_text(specs: &[UnitSpec]) -> String {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    let snapshot = SaveSnapshot::new(state(map(3, 1), specs), queue, Rng::new(42))
        .with_meta(SaveMeta::default());
    serde_json::to_string(&snapshot).expect("ser")
}

fn generals(s: &SaveSnapshot) -> Vec<u64> {
    s.state()
        .units()
        .iter()
        .filter(|u| u.is_general())
        .map(|u| u.id().get())
        .collect()
}

/// Wodzowie gracza 1 (era 2 => limit 2) i obcy wódz (id 20). Przed migracja 4 wodzow.
fn excess_generals_specs() -> Vec<UnitSpec> {
    vec![
        (10, OWNER, 0, 0, true),
        (11, OWNER, 1, 0, true),
        (12, OWNER, 2, 0, true),
        (20, FOREIGN, 2, 0, true),
    ]
}

#[test]
fn p6_zapis_loader_migrates_old_save_through_production_path() {
    let text = save_text(&excess_generals_specs());
    // Kontrola: surowa deserializacja NIE migruje, wiec wszyscy 4 wodzowie zostaja
    // (ta kontrola jest jednoczesnie dowodem, ze zapis przed migracja niesie flagi wodzow).
    let raw_loaded: SaveSnapshot = serde_json::from_str(&text).expect("raw load");
    assert_eq!(generals(&raw_loaded), vec![10, 11, 12, 20]);

    // Produkcyjny loader: era 2 => limit 2 na wlasciciela; najmlodszy wodz gracza 1 (id 12) traci flage.
    let (loaded, report) = load_save_snapshot(&text, |_| 2.0).expect("loader");
    assert_eq!(report.demoted_generals, vec![UnitId::new(12)]);
    assert_eq!(generals(&loaded), vec![10, 11, 20], "stan po migracji");
    assert_eq!(loaded.state().units().len(), 4, "nikt nie ginie");
}

#[test]
fn p6_zapis_loader_is_idempotent_on_reload() {
    let text = save_text(&excess_generals_specs());
    let (loaded, first) = load_save_snapshot(&text, |_| 2.0).expect("first load");
    assert!(!first.demoted_generals.is_empty());

    let again_text = serde_json::to_string(&loaded).expect("ser");
    let (again, second) = load_save_snapshot(&again_text, |_| 2.0).expect("second load");
    assert!(second.demoted_generals.is_empty(), "drugi odczyt bez zmian");
    assert_eq!(generals(&again), vec![10, 11, 20]);
}

#[test]
fn p6_zapis_loader_uses_per_owner_era() {
    let text = save_text(&excess_generals_specs());
    // Era 1 dla gracza (limit 1): wodzowie 10, 11 i 12 wlasciciela traca flage poza najstarszym;
    // era 3 dla obcego (limit 3) - jego wodz nietkniety.
    let (loaded, report) = load_save_snapshot(&text, |owner| {
        if owner == PlayerId::new(OWNER) {
            1.0
        } else {
            3.0
        }
    })
    .expect("loader");
    assert_eq!(
        report.demoted_generals,
        vec![UnitId::new(11), UnitId::new(12)]
    );
    assert_eq!(generals(&loaded), vec![10, 20]);
}

#[test]
fn p6_zapis_loader_rejects_invalid_json_without_panic() {
    assert!(load_save_snapshot("{ to nie jest zapis", |_| 1.0).is_err());
    assert!(load_save_snapshot("", |_| 1.0).is_err());
}
