//! R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW: pola `oblegane`, `siegeMachinesReady`, `placedWorldWonders`
//! w `PlayableState` oraz ich zapis/odczyt w `SaveSnapshot` (`meta.placedWorldWonders`, `citySiege`).
//!
//! * golden pliki stanu bez nowych pol sa bajtowo identyczne po ponownej serializacji;
//! * zapis `SaveSnapshot` bez nowych pol jest bajtowo taki sam jak przed zmiana;
//! * pelny stan robi round-trip przez JSON i przez zapis bez strat.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

#[path = "common/snapshot.rs"]
#[allow(dead_code)]
mod snapshot;

use civ_engine::domain::playable::{PlayablePlacedWonder, PlayableSiegeMachineKind};
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayableGame, PlayableState, PlayerId,
    PositionDto, Rng, StartGameParams, TerrainDto, TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{
    restore_playable_siege_wonders, SaveSnapshot, SavedCitySiege, SiegeWonderRestoreReport,
    TurnPhase, PLACED_WORLD_WONDERS_KEY,
};
use serde_json::{json, Value};
use snapshot::decode_snapshot_str;

const NEW_KEYS: [&str; 3] = ["oblegane", "siegeMachinesReady", "placedWorldWonders"];

const SAVE_PRE_STORES: &str = include_str!("p6_wire_war_stores_vectors/save_pre_stores.json");
const PRE_ETAP2_STATE: &str = include_str!("p6_unit_replace_l3_state_vectors/pre-etap2-state.json");
const OLD_STATE_PRE_POP: &str = include_str!("p6_wire_war_pop_vectors/old_state_pre_pop.json");

fn started_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("scenario")
        .state()
        .clone()
}

fn full_state() -> PlayableState {
    let mut state = started_state();
    let city = state.cities[0].id;
    state.oblegane.insert(city);
    state.siege_machines_ready.insert(
        city,
        vec![
            PlayableSiegeMachineKind::Wieza,
            PlayableSiegeMachineKind::Taran,
        ],
    );
    state.placed_world_wonders = vec![
        PlayablePlacedWonder {
            wonder_id: "piramidy".to_owned(),
            q: 4,
            r: -1,
            owner_id: PlayerId::new(1),
        },
        PlayablePlacedWonder {
            wonder_id: "wyrocznia".to_owned(),
            q: 0,
            r: 2,
            owner_id: PlayerId::new(2),
        },
    ];
    state
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

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

fn assert_no_new_keys(json: &Value, context: &str) {
    for key in NEW_KEYS {
        assert!(json.get(key).is_none(), "{context}: klucz {key} w JSON");
    }
}

#[test]
fn golden_state_files_reserialize_byte_identical() {
    let state: PlayableState = serde_json::from_str(SAVE_PRE_STORES).expect("save_pre_stores");
    let again = serde_json::to_string_pretty(&serde_json::to_value(&state).expect("value"))
        .expect("pretty");
    assert_eq!(again, SAVE_PRE_STORES.trim_end_matches('\n'));

    let state: PlayableState = serde_json::from_str(PRE_ETAP2_STATE).expect("pre-etap2");
    let again = serde_json::to_string_pretty(&state).expect("pretty");
    assert_eq!(again, PRE_ETAP2_STATE.trim_end_matches('\n'));

    for (name, text) in [
        ("save_pre_stores", SAVE_PRE_STORES),
        ("pre-etap2-state", PRE_ETAP2_STATE),
        ("old_state_pre_pop", OLD_STATE_PRE_POP),
    ] {
        let state: PlayableState = serde_json::from_str(text).expect("golden");
        assert!(state.oblegane.is_empty(), "{name}");
        assert!(state.siege_machines_ready.is_empty(), "{name}");
        assert!(state.placed_world_wonders.is_empty(), "{name}");
        assert_no_new_keys(&serde_json::to_value(&state).expect("value"), name);
    }
}

#[test]
fn empty_fields_are_omitted_and_legacy_state_loads_with_defaults() {
    assert_no_new_keys(
        &serde_json::to_value(PlayableState::empty()).expect("serialize"),
        "PlayableState::empty",
    );
    let started = started_state();
    let json = serde_json::to_value(&started).expect("serialize");
    assert_no_new_keys(&json, "PlayableGame::new");
    let back: PlayableState = serde_json::from_value(json).expect("legacy load");
    let mut expected = started;
    expected.gracz_kiedys_mial_miasto = false;
    assert_eq!(back, expected);
}

/// Nazwy pol = web: `City.oblegane` (`game/cities.ts:858`), `SiegeMachineKind` `'taran' | 'wieza'`
/// (`game/siegeMachines.ts:6`), `PlacedWonder {wonderId, q, r, ownerId}` (`render/wonderRenderer.ts:12-19`).
#[test]
fn full_state_roundtrips_with_web_field_names_and_values() {
    let state = full_state();
    let city = state.cities[0].id.get();
    let json = serde_json::to_value(&state).expect("serialize");
    assert_eq!(json["oblegane"], json!([city]));
    assert_eq!(
        json["siegeMachinesReady"],
        json!({ city.to_string(): ["wieza", "taran"] })
    );
    assert_eq!(
        json["placedWorldWonders"],
        json!([
            {"wonderId": "piramidy", "q": 4, "r": -1, "ownerId": 1},
            {"wonderId": "wyrocznia", "q": 0, "r": 2, "ownerId": 2}
        ])
    );
    let back: PlayableState =
        serde_json::from_str(&serde_json::to_string(&state).expect("text")).expect("roundtrip");
    let mut expected = state;
    expected.gracz_kiedys_mial_miasto = false;
    assert_eq!(back, expected);
}

#[test]
fn snapshot_without_new_fields_is_byte_identical() {
    let plain = serde_json::to_string(&snapshot()).expect("serialize");
    let with_empty =
        serde_json::to_string(&snapshot().with_playable_siege_wonders(&PlayableState::empty()))
            .expect("serialize");
    assert_eq!(with_empty, plain);
    assert!(!plain.contains("placedWorldWonders"));
    assert!(!plain.contains("citySiege"));
    // Ten sam zapis po odczycie i ponownym zapisie (brak nowych kluczy) - bajt w bajt.
    let again = serde_json::to_string(&decode_snapshot_str(&plain).expect("decode")).expect("ser");
    assert_eq!(again, plain);
}

/// Zapis jak web `buildSaveGameSnapshot` (`main.ts:37450`: `placedWorldWonders: placedWorldWonders.slice()`
/// w `meta`), odczyt jak `main.ts:46459-46461`; `oblegane`/`siegeMachines` (pola miast weba) w `citySiege`.
#[test]
fn save_and_restore_roundtrip() {
    let state = full_state();
    let saved = snapshot().with_playable_siege_wonders(&state);
    let text = serde_json::to_string(&saved).expect("serialize");
    let json: Value = serde_json::from_str(&text).expect("json");
    assert_eq!(
        json["meta"][PLACED_WORLD_WONDERS_KEY],
        serde_json::to_value(&state.placed_world_wonders).expect("wonders")
    );
    let city = state.cities[0].id.get();
    assert_eq!(
        json["citySiege"],
        json!([{"cityId": city, "oblegane": true, "siegeMachines": {"ready": ["wieza", "taran"]}}])
    );

    let loaded = decode_snapshot_str(&text).expect("decode");
    let mut target = started_state();
    let report = loaded.restore_siege_wonders(&mut target);
    assert_eq!(report, SiegeWonderRestoreReport::default());
    assert_eq!(target.oblegane, state.oblegane);
    assert_eq!(target.siege_machines_ready, state.siege_machines_ready);
    assert_eq!(target.placed_world_wonders, state.placed_world_wonders);
    // Ponowny zapis odczytanego snapshotu jest bajt w bajt.
    assert_eq!(serde_json::to_string(&loaded).expect("ser"), text);
}

/// Web `Array.isArray(saved.meta?.placedWorldWonders) ? … : []` (`main.ts:46459-46461`): nie-tablica =>
/// pusta lista; wpisy niewyrazalne w Rust sa pominiete i zgloszone; `ruin` z zapisu ignorowane.
/// `citySiege`: wpis nieznanego miasta pominiety i zgloszony, wpis o zlej formie pominiety przy odczycie.
#[test]
fn restore_reports_unrepresentable_entries() {
    let mut state = started_state();
    let city = state.cities[0].id;
    state.oblegane.insert(CityId::new(999));
    let placed = json!([
        {"wonderId": "piramidy", "q": 1, "r": 2, "ownerId": 1, "ruin": true},
        {"wonderId": 5, "q": 1, "r": 2, "ownerId": 1},
        {"wonderId": "wyrocznia", "q": 1.5, "r": 2, "ownerId": 1},
        {"wonderId": "wyrocznia", "q": 1, "r": 2, "ownerId": -1}
    ]);
    let city_siege = vec![
        SavedCitySiege {
            city_id: CityId::new(404),
            oblegane: true,
            siege_machines: None,
        },
        SavedCitySiege {
            city_id: city,
            oblegane: false,
            siege_machines: None,
        },
    ];
    let report = restore_playable_siege_wonders(&mut state, Some(&placed), &city_siege);
    assert_eq!(report.unrepresentable_wonders, vec![1, 2, 3]);
    assert_eq!(report.unknown_cities, vec![CityId::new(404)]);
    assert_eq!(
        state.placed_world_wonders,
        vec![PlayablePlacedWonder {
            wonder_id: "piramidy".to_owned(),
            q: 1,
            r: 2,
            owner_id: PlayerId::new(1),
        }]
    );
    // Stan sprzed odczytu wyczyszczony (miasto 999 nie jest juz oblegane).
    assert!(state.oblegane.is_empty());

    let report = restore_playable_siege_wonders(&mut state, Some(&json!({"a": 1})), &[]);
    assert_eq!(report, SiegeWonderRestoreReport::default());
    assert!(state.placed_world_wonders.is_empty());

    // Zla forma `citySiege` w tekscie zapisu nie jest bledem ladowania.
    let mut json: Value =
        serde_json::from_str(&serde_json::to_string(&snapshot()).expect("ser")).expect("json");
    json["citySiege"] = json!([{"cityId": "x"}, {"cityId": 7, "oblegane": true}]);
    let loaded = decode_snapshot_str(&json.to_string()).expect("lenient load");
    assert_eq!(
        loaded.city_siege(),
        &[SavedCitySiege {
            city_id: CityId::new(7),
            oblegane: true,
            siege_machines: None,
        }]
    );
    json["citySiege"] = json!("nie tablica");
    let loaded = decode_snapshot_str(&json.to_string()).expect("lenient load");
    assert!(loaded.city_siege().is_empty());
}
