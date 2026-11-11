//! P6-ZAPIS-ERA-ZAPISU: epoka wlasciciela w migracji wczytania pochodzi z DANYCH ZAPISU.
//! Zrodla jak web `empireEpochForOwner` (`main.ts:2069`): ludzie z `gracze[].era`, AI z
//! `meta.ownerEraByOwner`; brak epoki = udokumentowany wynik `start_era_fallback`.
//! Test behawioralny: zapis z epoka X wczytany przez `load_save_snapshot` daje epoke X w migracji
//! (limit wodzow = floor(X)), bez zadnego parametru od wolajacego.

use civ_engine::domain::events::EventQueue;
use civ_engine::domain::save_load::{SaveMeta, SaveSnapshot};
use civ_engine::domain::zapis_loader::load_save_snapshot;
use civ_engine::{
    CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto, TileDto,
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

fn state(specs: &[UnitSpec]) -> GameStateDto {
    let civs = [OWNER, FOREIGN]
        .into_iter()
        .map(|owner| {
            CivilizationDto::new(
                PlayerId::new(owner),
                format!("civ{owner}"),
                Vec::new(),
                specs
                    .iter()
                    .filter(|s| s.1 == owner)
                    .map(|s| UnitId::new(s.0))
                    .collect(),
            )
            .expect("civ")
        })
        .collect();
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
    GameStateDto::new(
        map(4, 2),
        civs,
        Vec::new(),
        units,
        TurnDto::new(3).expect("turn"),
    )
    .expect("state")
}

/// Zapis w formacie produkcyjnym; `meta_patch` dokleja pola do `meta` (epoki AI, newGameParams).
fn save_text(specs: &[UnitSpec], meta_patch: Value) -> String {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    let snapshot =
        SaveSnapshot::new(state(specs), queue, Rng::new(42)).with_meta(SaveMeta::default());
    let mut wire = serde_json::to_value(&snapshot).expect("ser");
    if let Value::Object(fields) = meta_patch {
        for (key, value) in fields {
            wire["meta"][key.as_str()] = value;
        }
    }
    serde_json::to_string(&wire).expect("ser text")
}

/// Dokleja top-level `gracze` (wpisy ludzi, web `playerStateByHuman`) do zapisu.
fn with_gracze(text: &str, gracze: Value) -> String {
    let mut wire: Value = serde_json::from_str(text).expect("json");
    wire["gracze"] = gracze;
    serde_json::to_string(&wire).expect("ser text")
}

fn generals(s: &SaveSnapshot) -> Vec<u64> {
    s.state()
        .units()
        .iter()
        .filter(|u| u.is_general())
        .map(|u| u.id().get())
        .collect()
}

/// Wodzowie gracza 1 (10, 11, 12) i obcego (20, 21, 22). Limit epoki X = floor(X) wodzow na wlasciciela.
fn specs() -> Vec<UnitSpec> {
    vec![
        (10, OWNER, 0, 0, true),
        (11, OWNER, 1, 0, true),
        (12, OWNER, 2, 0, true),
        (20, FOREIGN, 0, 1, true),
        (21, FOREIGN, 1, 1, true),
        (22, FOREIGN, 2, 1, true),
    ]
}

#[test]
fn human_era_from_save_gracze_drives_migration() {
    // Gracz ma epoke 2 w `gracze` => limit 2 => traci tylko najmlodszego (12). Obcy bez epoki
    // dostaje fallback 1 => traci 21 i 22.
    let text = with_gracze(
        &save_text(&specs(), json!({})),
        json!([[OWNER, {"era": 2}]]),
    );
    let (loaded, report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 2.0);
    assert_eq!(
        report.demoted_generals,
        vec![UnitId::new(12), UnitId::new(21), UnitId::new(22)]
    );
    assert_eq!(generals(&loaded), vec![10, 11, 20]);
}

#[test]
fn ai_era_from_meta_owner_era_drives_migration() {
    // AI (FOREIGN) ma epoke 1 w meta.ownerEraByOwner => limit 1 => traci 21 i 22.
    // Gracz bez epoki dostaje fallback 1 => traci 11 i 12.
    let text = save_text(&specs(), json!({"ownerEraByOwner": [[FOREIGN, 1.0]]}));
    let (loaded, report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(FOREIGN)), 1.0);
    assert_eq!(
        report.demoted_generals,
        vec![
            UnitId::new(11),
            UnitId::new(12),
            UnitId::new(21),
            UnitId::new(22)
        ]
    );
    assert_eq!(generals(&loaded), vec![10, 20]);
}

#[test]
fn human_era_from_gracze_overrides_meta_owner_era() {
    // Dla ludzi web czyta wylacznie `playerStateByHuman` - wpis w ownerEraByOwner jest ignorowany.
    // Epoka 3 z `gracze` => limit 3 => 3 wodzow gracza zostaje.
    let text = with_gracze(
        &save_text(
            &specs(),
            json!({"ownerEraByOwner": [[OWNER, 1.0], [FOREIGN, 3.0]]}),
        ),
        json!([[OWNER, {"era": 3}]]),
    );
    let (loaded, report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 3.0);
    assert_eq!(loaded.owner_era(PlayerId::new(FOREIGN)), 3.0);
    assert!(
        report.demoted_generals.is_empty(),
        "limit 3 mieści 3 wodzów"
    );
    assert_eq!(generals(&loaded), vec![10, 11, 12, 20, 21, 22]);
}

#[test]
fn save_without_epoch_uses_documented_fallback_from_new_game_params() {
    // Brak pola epoki: fallback z newGameParams.epochId (web loadStartEra): zelazo = 3 => limit 3.
    let text = save_text(&specs(), json!({"newGameParams": {"epochId": "zelazo"}}));
    let (loaded, report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 3.0);
    assert_eq!(loaded.owner_era(PlayerId::new(FOREIGN)), 3.0);
    assert!(report.demoted_generals.is_empty());
}

#[test]
fn save_without_epoch_and_without_epoch_id_falls_back_to_one() {
    // Brak epoki i brak newGameParams: domyslna epoka 1 (limit 1) - udokumentowany wynik.
    let text = save_text(&specs(), json!({}));
    let (loaded, report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 1.0);
    assert_eq!(loaded.meta().start_era_fallback(), 1.0);
    assert_eq!(
        report.demoted_generals,
        vec![
            UnitId::new(11),
            UnitId::new(12),
            UnitId::new(21),
            UnitId::new(22)
        ]
    );
}

#[test]
fn malformed_epoch_entries_are_ignored_not_fatal() {
    // Wpisy z nie-liczba, bez id albo z ujemnym id nie daja epoki; zapis dalej sie laduje.
    let text = with_gracze(
        &save_text(
            &specs(),
            json!({"ownerEraByOwner": [["x", 5.0], [OWNER, "bad"], [-1.0, 4.0]]}),
        ),
        json!("nie-tablica"),
    );
    let (loaded, _report) = load_save_snapshot(&text).expect("loader");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 1.0);
    assert_eq!(loaded.owner_era(PlayerId::new(FOREIGN)), 1.0);
}

#[test]
fn human_era_survives_reload_through_gracze_roundtrip() {
    // Epoka czlowieka siedzi w top-level `gracze`. Ponowny zapis musi ja zachowac, inaczej drugi
    // odczyt dalby fallback zamiast epoki 3 (P6-ZAPIS-ERA-ZAPISU, zarzut obrony).
    let text = with_gracze(
        &save_text(&specs(), json!({})),
        json!([[OWNER, {"era": 3}]]),
    );
    let (loaded, first) = load_save_snapshot(&text).expect("first");
    assert_eq!(loaded.owner_era(PlayerId::new(OWNER)), 3.0);
    let again_text = serde_json::to_string(&loaded).expect("ser");
    let again_wire: Value = serde_json::from_str(&again_text).expect("json");
    assert_eq!(again_wire["gracze"], json!([[OWNER, {"era": 3}]]));
    let (again, second) = load_save_snapshot(&again_text).expect("second");
    assert_eq!(again.owner_era(PlayerId::new(OWNER)), 3.0);
    assert!(!first.demoted_generals.is_empty());
    assert!(second.demoted_generals.is_empty(), "drugi odczyt bez zmian");
}

#[test]
fn epoch_survives_reload_through_meta_roundtrip() {
    // Epoka AI siedzi w meta (flatten `extra`), wiec ponowny zapis i odczyt daje ta sama epoke.
    let text = save_text(&specs(), json!({"ownerEraByOwner": [[FOREIGN, 2.0]]}));
    let (loaded, first) = load_save_snapshot(&text).expect("first");
    let again_text = serde_json::to_string(&loaded).expect("ser");
    let (again, second) = load_save_snapshot(&again_text).expect("second");
    assert_eq!(again.owner_era(PlayerId::new(FOREIGN)), 2.0);
    assert!(!first.demoted_generals.is_empty());
    assert!(second.demoted_generals.is_empty(), "drugi odczyt bez zmian");
}
