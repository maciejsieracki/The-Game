//! P4-1J (R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1): pola planow marszu w `PlayableState`
//! (`plannedMarches`, `marchAttackTargets`, `marchStopNotified`, `marchStopDetail`) i zgodnosc wstecz.
//!
//! * puste pola nie trafiaja do JSON (DTO i zapis), wiec istniejace golden pliki stanu sa bajtowo
//!   identyczne po ponownej serializacji (trzy pliki fixtur, kazdy w swoim formacie);
//! * stan sprzed zmiany (bez pol) laduje sie z pustymi polami;
//! * pelny stan robi round-trip przez JSON bez strat; nazwy pol i wartosci powodow = web;
//! * zapis `SaveSnapshot` bez planow jest bajtowo taki sam jak przed zmiana;
//! * semantyka `Map` (jeden wpis na jednostke) przy zapisie i odczycie, wlasciciel z parametru.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

#[path = "common/snapshot.rs"]
#[allow(dead_code)]
mod snapshot;

use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::playable::{PlayableMarchStopReason, PlayablePlannedMarch};
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayableGame, PlayableState,
    PlayableUnit, PlayableUnitKind, PlayerId, PositionDto, Rng, StartGameParams, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{
    playable_planned_marches_to_save, restore_playable_planned_marches, SaveSnapshot,
    SavedAutoMarch, SavedPlannedMarch, TurnPhase,
};
use serde_json::{json, Number, Value};
use snapshot::decode_snapshot_str;

const NEW_KEYS: [&str; 4] = [
    "plannedMarches",
    "marchAttackTargets",
    "marchStopNotified",
    "marchStopDetail",
];

const SAVE_PRE_STORES: &str = include_str!("p6_wire_war_stores_vectors/save_pre_stores.json");
const PRE_ETAP2_STATE: &str = include_str!("p6_unit_replace_l3_state_vectors/pre-etap2-state.json");
const OLD_STATE_PRE_POP: &str = include_str!("p6_wire_war_pop_vectors/old_state_pre_pop.json");

fn march(unit: u64, q: i32, r: i32, attack: Option<u64>) -> PlayablePlannedMarch {
    PlayablePlannedMarch {
        unit_id: UnitId::new(unit),
        dest_q: q,
        dest_r: r,
        attack_unit_id: attack.map(UnitId::new),
        general_target_id: None,
    }
}

fn unit(id: u64, owner: u64, x: u16, y: u16) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    }
}

fn full_state() -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenario")
        .state()
        .clone();
    state.planned_marches = vec![march(12, 3, -1, None), march(3, 5, 4, Some(20))];
    state
        .march_attack_targets
        .insert(UnitId::new(3), UnitId::new(20));
    state
        .march_stop_notified
        .insert(UnitId::new(12), PlayableMarchStopReason::BlockedCity);
    state
        .march_stop_notified
        .insert(UnitId::new(3), PlayableMarchStopReason::NoPath);
    state
        .march_stop_detail
        .insert(UnitId::new(12), "obce miasto na trasie".to_owned());
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
    // save_pre_stores.json: `to_string_pretty` z `Value` (klucze posortowane), bez konca linii.
    let state: PlayableState = serde_json::from_str(SAVE_PRE_STORES).expect("save_pre_stores");
    let again = serde_json::to_string_pretty(&serde_json::to_value(&state).expect("value"))
        .expect("pretty");
    assert_eq!(again, SAVE_PRE_STORES.trim_end_matches('\n'));

    // pre-etap2-state.json: `to_string_pretty` w kolejnosci pol struktury.
    let state: PlayableState = serde_json::from_str(PRE_ETAP2_STATE).expect("pre-etap2");
    let again = serde_json::to_string_pretty(&state).expect("pretty");
    assert_eq!(again, PRE_ETAP2_STATE.trim_end_matches('\n'));

    // old_state_pre_pop.json (zwarty, sprzed `population`/`culture` miast): juz przed P4-1J ponowna
    // serializacja dopisuje te dwa pola, wiec bajtow pliku nie da sie odtworzyc. Sprawdzamy, ze
    // roznica to WYLACZNIE te pola miast (bajtowa zgodnosc z kodem bazy: pomiar w raporcie P4-1J).
    let state: PlayableState = serde_json::from_str(OLD_STATE_PRE_POP).expect("pre-pop");
    let mut again = serde_json::to_value(&state).expect("value");
    for city in again["cities"].as_array_mut().expect("cities") {
        let city = city.as_object_mut().expect("city");
        assert!(city.remove("population").is_some());
        assert!(city.remove("culture").is_some());
    }
    let old: Value = serde_json::from_str(OLD_STATE_PRE_POP).expect("json");
    assert_eq!(again, old);

    for (name, text) in [
        ("save_pre_stores", SAVE_PRE_STORES),
        ("pre-etap2-state", PRE_ETAP2_STATE),
        ("old_state_pre_pop", OLD_STATE_PRE_POP),
    ] {
        let state: PlayableState = serde_json::from_str(text).expect("golden");
        assert!(state.planned_marches.is_empty(), "{name}");
        assert!(state.march_attack_targets.is_empty(), "{name}");
        assert!(state.march_stop_notified.is_empty(), "{name}");
        assert!(state.march_stop_detail.is_empty(), "{name}");
        assert_no_new_keys(&serde_json::to_value(&state).expect("value"), name);
    }
}

#[test]
fn empty_fields_are_omitted_and_legacy_state_loads_with_defaults() {
    let empty = PlayableState::empty();
    let json = serde_json::to_value(&empty).expect("serialize");
    assert_no_new_keys(&json, "PlayableState::empty");
    let started = PlayableGame::new(StartGameParams::default()).expect("scenario");
    let json = serde_json::to_value(started.state()).expect("serialize");
    assert_no_new_keys(&json, "PlayableGame::new");
    let back: PlayableState = serde_json::from_value(json).expect("legacy load");
    // `graczKiedysMialMiasto` nie jest zapisywana (pin); reszta stanu identyczna, nowe pola puste.
    let mut expected = started.state().clone();
    expected.gracz_kiedys_mial_miasto = false;
    assert_eq!(back, expected);
}

#[test]
fn full_state_roundtrips_with_web_field_names_and_values() {
    let state = full_state();
    let json = serde_json::to_value(&state).expect("serialize");
    assert_eq!(
        json["plannedMarches"],
        json!([
            {"unitId": 12, "destQ": 3, "destR": -1},
            {"unitId": 3, "destQ": 5, "destR": 4, "attackUnitId": 20}
        ])
    );
    assert_eq!(json["marchAttackTargets"], json!({"3": 20}));
    assert_eq!(
        json["marchStopNotified"],
        json!({"3": "no_path", "12": "blocked_city"})
    );
    assert_eq!(
        json["marchStopDetail"],
        json!({"12": "obce miasto na trasie"})
    );
    let text = serde_json::to_string(&state).expect("serialize");
    let back: PlayableState = serde_json::from_str(&text).expect("roundtrip");
    // `graczKiedysMialMiasto` nie jest zapisywana (pin), reszta stanu bez strat.
    let mut expected = state.clone();
    expected.gracz_kiedys_mial_miasto = false;
    assert_eq!(back, expected);
}

#[test]
fn stop_reasons_serialize_as_web_literals() {
    // Web `MarchStopReason` (planned-march.ts:35).
    let all = [
        (PlayableMarchStopReason::Obstacle, "obstacle"),
        (PlayableMarchStopReason::NoPath, "no_path"),
        (PlayableMarchStopReason::NoMovement, "no_movement"),
        (PlayableMarchStopReason::BlockedCity, "blocked_city"),
        (PlayableMarchStopReason::Fog, "fog"),
    ];
    for (reason, literal) in all {
        assert_eq!(serde_json::to_value(reason).expect("ser"), json!(literal));
        let back: PlayableMarchStopReason = serde_json::from_value(json!(literal)).expect("de");
        assert_eq!(back, reason);
    }
    assert!(serde_json::from_value::<PlayableMarchStopReason>(json!("NoPath")).is_err());
}

#[test]
fn snapshot_without_plans_is_byte_identical() {
    let plain = serde_json::to_string(&snapshot()).expect("serialize");
    let with_empty =
        serde_json::to_string(&snapshot().with_playable_planned_marches(&PlayableState::empty()))
            .expect("serialize");
    assert_eq!(with_empty, plain);
    assert!(!plain.contains("plannedMarches"));
    assert!(!plain.contains("autoMarch"));
    assert_eq!(playable_planned_marches_to_save(&[]), (Vec::new(), None));
}

#[test]
fn save_uses_map_semantics_object_key_order_and_integer_numbers() {
    // Wektor z duplikatem (stan niepoprawny, ale semantyka `Map.set`): pierwsza pozycja, ostatnia
    // wartosc; `autoMarch` = pierwszy wpis mapy (12), lista = kolejnosc kluczy obiektu (3, 7, 12).
    let marches = [
        march(12, 0, 0, None),
        march(7, -2, 5, None),
        march(3, 1, 1, Some(9)),
        march(12, 4, 4, None),
    ];
    let (planned, auto) = playable_planned_marches_to_save(&marches);
    let ids: Vec<&str> = planned.iter().map(|m| m.unit_id.as_str()).collect();
    assert_eq!(ids, ["3", "7", "12"]);
    assert_eq!(
        auto,
        Some(SavedAutoMarch {
            leader_id: Some("12".to_owned()),
            dest_q: Some(Number::from(4)),
            dest_r: Some(Number::from(4)),
        })
    );
    assert_eq!(planned[0].attack_unit_id.as_deref(), Some("9"));
    assert_eq!(planned[1].dest_q, Some(Number::from(-2)));
    let text = serde_json::to_string(&planned[1]).expect("serialize");
    assert_eq!(text, r#"{"unitId":"7","destQ":-2,"destR":5}"#);
}

#[test]
fn restore_keeps_one_entry_per_unit_and_uses_owner_parameter() {
    let mut state = PlayableState::empty();
    state.units = vec![unit(1, 2, 0, 0), unit(2, 2, 1, 1), unit(3, 1, 2, 2)];
    let saved = |id: &str, q: i64, attack: Option<&str>| SavedPlannedMarch {
        unit_id: id.to_owned(),
        dest_q: Some(Number::from(q)),
        dest_r: Some(Number::from(0)),
        attack_unit_id: attack.map(str::to_owned),
        general_target_id: None,
    };
    // Forma listowa Rust moze miec powtorzenie: `Map.set` - pierwsza pozycja, ostatnia wartosc,
    // a `syncMarchAttackTarget` kasuje cel ataku, gdy ostatnia wartosc go nie ma.
    let list = [
        saved("2", 5, Some("9")),
        saved("1", 3, None),
        saved("3", 4, None),
        saved("2", 6, None),
    ];
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(2));
    assert!(report.unrepresentable.is_empty());
    assert_eq!(
        state.planned_marches,
        vec![march(2, 6, 0, None), march(1, 3, 0, None)],
        "jednostka 3 nalezy do innego wlasciciela"
    );
    assert!(state.march_attack_targets.is_empty());

    // Ten sam zapis z graczem = PlayerId(1): wczytany tylko plan jednostki 3.
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(1));
    assert_eq!(report, Default::default());
    assert_eq!(state.planned_marches, vec![march(3, 4, 0, None)]);
}

#[test]
fn restore_keeps_general_target_and_reports_unrepresentable_entries() {
    let mut state = PlayableState::empty();
    state.units = vec![unit(1, 1, 0, 0), unit(2, 1, 1, 1), unit(3, 1, 2, 2)];
    state
        .march_stop_detail
        .insert(UnitId::new(1), "brak trasy do celu".to_owned());
    let list = vec![
        SavedPlannedMarch {
            unit_id: "1".to_owned(),
            dest_q: Some(Number::from(0)),
            dest_r: Some(Number::from(0)),
            attack_unit_id: None,
            general_target_id: Some("g1".to_owned()),
        },
        SavedPlannedMarch {
            unit_id: "2".to_owned(),
            dest_q: Number::from_f64(2.5),
            dest_r: Some(Number::from(1)),
            attack_unit_id: None,
            general_target_id: None,
        },
        SavedPlannedMarch {
            unit_id: "3".to_owned(),
            dest_q: Some(Number::from(i64::from(i32::MAX) + 1)),
            dest_r: Some(Number::from(0)),
            attack_unit_id: None,
            general_target_id: None,
        },
    ];
    let snapshot = snapshot().with_planned_marches(list);
    let encoded = serde_json::to_string(&snapshot).expect("serialize");
    let decoded = decode_snapshot_str(&encoded).expect("decode");
    let report = decoded.restore_planned_marches(&mut state, PlayerId::new(1));
    assert_eq!(report.unrepresentable, vec!["2", "3"]);
    // Wpis generala na pozycji jednostki zostaje (web planned-march.ts:466) razem z `generalTargetId`.
    assert_eq!(
        state.planned_marches,
        vec![PlayablePlannedMarch {
            general_target_id: Some("g1".to_owned()),
            ..march(1, 0, 0, None)
        }]
    );
    assert!(
        state.march_stop_detail.is_empty(),
        "odczyt czysci marchStopDetail"
    );
}

/// Obrona r1 (Z1 Evaluatora): powtorzony `unitId` w formie listowej jest scalany PRZED filtrem
/// `plannedMarchesFromSave` (web filtruje obiekt po `JSON.parse`: pierwsza pozycja, ostatnia
/// wartosc). Odrzucona albo niewyrazalna ostatnia wartosc nie moze zostawic planu z wczesniejszego
/// wpisu, a raport musi zgadzac sie ze stanem.
#[test]
fn restore_merges_duplicates_before_filter() {
    let saved = |q: Number, attack: Option<&str>| SavedPlannedMarch {
        unit_id: "1".to_owned(),
        dest_q: Some(q),
        dest_r: Some(Number::from(0)),
        attack_unit_id: attack.map(str::to_owned),
        general_target_id: None,
    };
    let fresh = || {
        let mut state = PlayableState::empty();
        state.units = vec![unit(1, 1, 0, 0)];
        state
    };

    // (A) ostatnia wartosc = pozycja jednostki: web `planned-march.ts:466` ja odrzuca, wiec brak planu.
    let mut state = fresh();
    let list = [
        saved(Number::from(5), Some("9")),
        saved(Number::from(0), None),
    ];
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(1));
    assert_eq!(report, Default::default());
    assert!(
        state.planned_marches.is_empty(),
        "A: brak planu jak w webie"
    );
    assert!(state.march_attack_targets.is_empty(), "A: brak celu ataku");

    // (B) ostatnia wartosc niewyrazalna (2.5): web ja trzyma, Rust pomija z raportem; brak planu (5,0).
    let mut state = fresh();
    let list = [
        saved(Number::from(5), Some("9")),
        saved(Number::from_f64(2.5).expect("finite"), None),
    ];
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(1));
    assert_eq!(report.unrepresentable, vec!["1"]);
    assert!(
        state.planned_marches.is_empty(),
        "B: raport unrepresentable zgodny ze stanem"
    );
    assert!(state.march_attack_targets.is_empty(), "B: brak celu ataku");

    // Kontrola: poprawna ostatnia wartosc wygrywa nad odrzucana pierwsza.
    let mut state = fresh();
    let list = [
        saved(Number::from(0), None),
        saved(Number::from(5), Some("9")),
    ];
    let report = restore_playable_planned_marches(&mut state, &list, None, PlayerId::new(1));
    assert_eq!(report, Default::default());
    assert_eq!(state.planned_marches, vec![march(1, 5, 0, Some(9))]);
    assert_eq!(
        state.march_attack_targets.get(&UnitId::new(1)),
        Some(&UnitId::new(9))
    );
}
