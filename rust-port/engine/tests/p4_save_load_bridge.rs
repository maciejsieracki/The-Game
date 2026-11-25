//! R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (#375): komendy mostu `SaveGame` / `LoadGame` i produkcyjna sciezka
//! zapisu/odtworzenia `PlayableGame` (U1: `with_playable_*` / `restore_*` / `load_save_snapshot` wolane z
//! produkcji; U5: `activeHumanOwnerId`).
//!
//! Web (pin `07d2fbd72`): zapis `buildSaveGameSnapshot` (`main.ts:37171-37460`; `seed` `:37236`,
//! `activeHumanOwnerId` `:37242`, `plannedMarches` `:37244`, `placedWorldWonders` `:37450`), wczytanie
//! `restoreGameFromSave` (`main.ts:46225-47400`; `humanSeats` `:46379-46382`, mgla `:46385-46411`,
//! `selectedId = null` `:47328`), normalizacja `game/save.ts:727-728`.

#![allow(dead_code)]

#[path = "../src/bridge.rs"]
mod bridge;

use std::collections::{BTreeMap, BTreeSet};

use bridge::{
    BridgeDispatch, BridgeError, BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult,
    CivEngineAdapter, EngineBridge, EngineCommand, EnginePort, MockEngineAdapter, StartGameParams,
    CONTRACT_VERSION,
};
use civ_engine::domain::city_capture_apply::{
    PlayableCityProduction, PlayableCivChronicle, PlayablePostCaptureLaw, PlayableSidePanelEvent,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayableMarchStopReason, PlayablePlacedWonder,
    PlayablePlannedMarch, PlayablePlayer, PlayableReplaceUnit, PlayableSaveError,
    PlayableSiegeMachineKind, PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::save_load::{EventQueue, SaveSnapshot};
use civ_engine::domain::siege_surrender::PlayableCitySiege;
use civ_engine::{CityId, PlayerId, PositionDto, Rng, UnitId};
use serde_json::{json, Value};

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);
const ANCHOR: u64 = 7001;

// ---------------------------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------------------------

fn send(
    b: &mut EngineBridge<CivEngineAdapter>,
    cmd: EngineCommand,
) -> Result<BridgeDispatch, BridgeError> {
    b.handle(BridgeRequest::new("r", cmd))
}

fn state_of(d: &BridgeDispatch) -> &PlayableState {
    match &d.response.result {
        BridgeResult::State { state } => state,
        _ => panic!("odpowiedz State"),
    }
}

fn get_state(b: &mut EngineBridge<CivEngineAdapter>) -> PlayableState {
    state_of(&send(b, EngineCommand::GetState).expect("GetState")).clone()
}

/// `SaveGame` przez most: odpowiedz `State` + `saveGame`, bez zdarzen.
fn save(b: &mut EngineBridge<CivEngineAdapter>) -> String {
    let d = send(b, EngineCommand::SaveGame).expect("SaveGame");
    assert!(d.events.is_empty(), "SaveGame nie emituje StateChanged");
    assert!(d.response.siege_battle.is_none());
    d.response
        .save_game
        .clone()
        .expect("odpowiedz niesie saveGame")
}

/// Nowa sesja (inna gra startowa) + `LoadGame`; zwraca most i dispatch wczytania.
fn load_in_new_session(text: &str) -> (EngineBridge<CivEngineAdapter>, BridgeDispatch) {
    let mut b = EngineBridge::new(CivEngineAdapter::default());
    send(
        &mut b,
        EngineCommand::CreateSession {
            params: StartGameParams {
                seed: 999,
                ..StartGameParams::default()
            },
        },
    )
    .expect("inna sesja startowa");
    let d = send(
        &mut b,
        EngineCommand::LoadGame {
            save: text.to_owned(),
        },
    )
    .expect("LoadGame");
    (b, d)
}

fn session() -> EngineBridge<CivEngineAdapter> {
    let mut b = EngineBridge::new(CivEngineAdapter::default());
    send(
        &mut b,
        EngineCommand::CreateSession {
            params: StartGameParams::default(),
        },
    )
    .expect("sesja");
    b
}

/// Kilka tur i komend: zaznaczenie, marsz wieloturowy (plan), klatka renderera (eksploracja), tura.
fn played_session() -> EngineBridge<CivEngineAdapter> {
    let mut b = session();
    send(&mut b, EngineCommand::SelectUnit { unit_id: 1 }).expect("select");
    send(
        &mut b,
        EngineCommand::MoveUnit {
            unit_id: 1,
            destination: PositionDto::new(6, 4),
            attack_unit_id: None,
        },
    )
    .expect("marsz");
    send(
        &mut b,
        EngineCommand::GetRenderFrame {
            seat: None,
            ui: None,
        },
    )
    .expect("frame");
    send(&mut b, EngineCommand::AdvanceTurn).expect("tura");
    send(&mut b, EngineCommand::GetRenderLayers { seat: None }).expect("warstwy");
    b
}

/// Stan po wczytaniu wg pinu: pola, ktorych web nie zapisuje, sa wyczyszczone (`selectedId = null`,
/// `marchStopNotified/Detail.clear()`, `movedByPlayerThisTurn.clear()`, dziennik zdarzen poza zapisem).
fn expected_after_load(mut st: PlayableState) -> PlayableState {
    st.selected_unit_id = None;
    for u in &mut st.units {
        u.selected = false;
    }
    st.march_stop_notified.clear();
    st.march_stop_detail.clear();
    st.moved_by_player_this_turn.clear();
    st.capture_events = Default::default();
    st
}

fn json_of(text: &str) -> Value {
    serde_json::from_str(text).expect("JSON zapisu")
}

fn add_unit(st: &mut PlayableState, id: u64, owner: u64, pos: (u16, u16), ty: &str) {
    st.units.push(PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(pos.0, pos.1),
        movement: 1u8.into(),
        movement_max: 1u8.into(),
        selected: false,
    });
    st.economy.units.insert(
        id,
        PlayableReplaceUnit {
            type_id: Some(ty.to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
}

/// Scenariusz bitwy oblezniczej (jak `p6_k5loop_wiring_b.rs`): gracz oblega obwarowane miasto wroga.
fn siege_state(seed: u32) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams {
        seed,
        ..StartGameParams::default()
    })
    .expect("start")
    .state()
    .clone();
    for t in &mut st.map.tiles {
        t.terrain = PlayableTerrain::Plains;
        t.passable = true;
    }
    st.units.clear();
    st.economy.units.clear();
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    st.cities.push(PlayableCity {
        id: CityId::new(CITY),
        owner_id: PlayerId::new(ENEMY),
        name: "Twierdza".into(),
        position: PositionDto::new(CITY_POS.0, CITY_POS.1),
        is_capital: false,
        population: 3,
        culture: 0,
    });
    st.stores
        .buildings_by_city
        .insert(CITY, vec!["palisada".to_owned()]);
    st.oblegane.insert(CityId::new(CITY));
    st.siege_machines_ready.insert(
        CityId::new(CITY),
        vec![
            PlayableSiegeMachineKind::Taran,
            PlayableSiegeMachineKind::Taran,
        ],
    );
    let mut id = 7000;
    for t in [
        "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Łucznik",
    ] {
        id += 1;
        add_unit(&mut st, id, HUMAN, (CITY_POS.0 + 1, CITY_POS.1), t);
    }
    add_unit(&mut st, 8001, ENEMY, CITY_POS, "Wojownik");
    st
}

fn bridge_for(st: PlayableState) -> EngineBridge<CivEngineAdapter> {
    EngineBridge::new(CivEngineAdapter::from_game(PlayableGame::from_state(st)))
}

fn storm() -> EngineCommand {
    EngineCommand::StartSiegeStorm {
        city_id: CITY,
        unit_id: ANCHOR,
    }
}

// ---------------------------------------------------------------------------------------------
// Kontrakt komend
// ---------------------------------------------------------------------------------------------

#[test]
fn save_game_odpowiada_stanem_i_tekstem_bez_zdarzen() {
    let mut b = played_session();
    send(&mut b, EngineCommand::SelectUnit { unit_id: 1 }).expect("zaznaczenie przed zapisem");
    let before = get_state(&mut b);
    let d = send(&mut b, EngineCommand::SaveGame).expect("SaveGame");
    assert!(d.events.is_empty());
    assert_eq!(d.response.contract_version, CONTRACT_VERSION);
    assert_eq!(state_of(&d), &before, "SaveGame nie zmienia stanu");
    let wire = serde_json::to_value(&d.response).expect("odpowiedz");
    let text = wire["saveGame"]
        .as_str()
        .expect("klucz saveGame w JSON odpowiedzi");
    let snap = json_of(text);
    assert_eq!(snap["version"], json!(2));
    assert!(snap.get("playable").is_some(), "cialo sesji w zapisie");
    assert_eq!(snap["activeHumanOwnerId"], json!(HUMAN));
    // Web nie zapisuje `selectedId` (brak w `SaveGame`): cialo sesji bez zaznaczenia.
    assert_eq!(
        before.selected_unit_id,
        Some(1),
        "scenariusz ma zaznaczenie"
    );
    assert_eq!(snap["playable"]["state"]["selectedUnitId"], Value::Null);
    // Inne komendy nie maja klucza `saveGame` (JSON bez zmian).
    let other = send(&mut b, EngineCommand::GetState).expect("GetState");
    let other_wire = serde_json::to_value(&other.response).expect("odpowiedz");
    assert!(other_wire.get("saveGame").is_none());
    assert!(other.response.save_game.is_none());
}

#[test]
fn komendy_save_load_maja_ksztalt_json_weba_mostu() {
    let save = serde_json::to_value(EngineCommand::SaveGame).expect("json");
    assert_eq!(save, json!({"kind": "save_game"}));
    let load = serde_json::to_value(EngineCommand::LoadGame {
        save: "{}".to_owned(),
    })
    .expect("json");
    assert_eq!(load, json!({"kind": "load_game", "save": "{}"}));
    let back: EngineCommand = serde_json::from_value(load).expect("deser");
    assert_eq!(
        back,
        EngineCommand::LoadGame {
            save: "{}".to_owned()
        }
    );
}

#[test]
fn load_game_emituje_state_changed_ze_stanem_wczytanym() {
    let mut b = played_session();
    let text = save(&mut b);
    let (_, d) = load_in_new_session(&text);
    assert_eq!(
        d.events.len(),
        1,
        "LoadGame zmienia stan sesji: StateChanged"
    );
    let BridgeEvent::StateChanged { state, .. } = &d.events[0];
    assert_eq!(state, state_of(&d));
    assert_eq!(d.response.save_game, None);
}

// ---------------------------------------------------------------------------------------------
// Round-trip bajt w bajt i determinizm
// ---------------------------------------------------------------------------------------------

#[test]
fn wczytanie_w_nowej_sesji_odtwarza_stan_i_zapis_bajt_w_bajt() {
    let mut b = played_session();
    let original = get_state(&mut b);
    assert!(
        !original.planned_marches.is_empty(),
        "scenariusz ma plan marszu wieloturowego"
    );
    let text = save(&mut b);
    let (mut loaded, d) = load_in_new_session(&text);
    assert_eq!(state_of(&d), &expected_after_load(original.clone()));
    assert_eq!(get_state(&mut loaded), expected_after_load(original));
    // Ponowny zapis wczytanej sesji = ten sam tekst (zapis -> odczyt -> zapis jest punktem stalym).
    assert_eq!(save(&mut loaded), text);
}

#[test]
fn kolejne_komendy_po_wczytaniu_daja_ten_sam_wynik_bajt_w_bajt() {
    let mut original = played_session();
    // Stan zapisu = stan po wczytaniu: zaznaczenie zdjete przez ponowne `LoadGame` tej samej sesji.
    let text = save(&mut original);
    send(
        &mut original,
        EngineCommand::LoadGame { save: text.clone() },
    )
    .expect("LoadGame w tej samej sesji");
    let (mut a, _) = load_in_new_session(&text);
    let (mut b, _) = load_in_new_session(&text);
    let commands = vec![
        EngineCommand::SelectUnit { unit_id: 1 },
        EngineCommand::MoveUnit {
            unit_id: 1,
            destination: PositionDto::new(2, 2),
            attack_unit_id: None,
        },
        EngineCommand::AdvanceTurn,
        EngineCommand::GetRenderFrame {
            seat: None,
            ui: None,
        },
        EngineCommand::AdvanceTurn,
        EngineCommand::GetRenderLayers { seat: None },
        EngineCommand::SaveGame,
    ];
    for cmd in commands {
        let ra =
            serde_json::to_string(&send(&mut a, cmd.clone()).map(|d| d.response)).expect("json");
        let rb =
            serde_json::to_string(&send(&mut b, cmd.clone()).map(|d| d.response)).expect("json");
        let ro = serde_json::to_string(&send(&mut original, cmd.clone()).map(|d| d.response))
            .expect("json");
        assert_eq!(ra, rb, "dwie wczytane sesje: {cmd:?}");
        assert_eq!(
            ra, ro,
            "wczytana vs zywa sesja po tym samym punkcie: {cmd:?}"
        );
    }
}

#[test]
fn zapis_bez_sesji_gry_nie_zmienia_starego_formatu() {
    // `SaveSnapshot` bez ciala sesji i bez fotela: brak nowych kluczy (zapis sprzed tematu bajt w bajt).
    let game = PlayableGame::new(StartGameParams::default()).expect("gra");
    let mut snap = json_of(&game.save_json().expect("zapis"));
    let obj = snap.as_object_mut().expect("obiekt");
    obj.remove("playable");
    obj.remove("activeHumanOwnerId");
    let stripped = serde_json::to_string(&snap).expect("json");
    let err = PlayableGame::load_json(&stripped).expect_err("bez ciala sesji");
    assert_eq!(err, PlayableSaveError::MissingPlayableSession);
    let plain = SaveSnapshot::new(
        civ_engine::domain::playable::playable_state_projection(game.state()).expect("rzut"),
        EventQueue::new(),
        Rng::new(1),
    );
    let plain_json = serde_json::to_value(&plain).expect("json");
    assert!(plain_json.get("playable").is_none());
    assert!(plain_json.get("activeHumanOwnerId").is_none());
}

// ---------------------------------------------------------------------------------------------
// U5: aktywny fotel
// ---------------------------------------------------------------------------------------------

fn with_active_seat(text: &str, seat: Value) -> String {
    let mut v = json_of(text);
    v["activeHumanOwnerId"] = seat;
    serde_json::to_string(&v).expect("json")
}

#[test]
fn aktywny_fotel_rozny_od_glownego_przezywa_zapis_i_steruje_zapytaniami() {
    let mut b = played_session();
    let text = with_active_seat(&save(&mut b), json!(2));
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(
        loaded.adapter().fog_session().active_seat,
        PlayerId::new(2),
        "web humanSeats.activeHumanOwnerId = saved.activeHumanOwnerId"
    );
    let primary_before = loaded
        .adapter()
        .fog_session()
        .explored_by_human
        .get(&PlayerId::new(HUMAN))
        .cloned();
    // Zapytanie bez fotela = aktywny fotel (web `ME()`): eksploracja trafia do fotela 2.
    send(&mut loaded, EngineCommand::GetRenderLayers { seat: None }).expect("warstwy");
    let fog = loaded.adapter().fog_session();
    assert!(fog.explored_by_human.contains_key(&PlayerId::new(2)));
    assert_eq!(
        fog.explored_by_human.get(&PlayerId::new(HUMAN)).cloned(),
        primary_before,
        "fotel glowny bez zmian"
    );
    // Fotel przezywa ponowny zapis.
    let again = json_of(&save(&mut loaded));
    assert_eq!(again["activeHumanOwnerId"], json!(2));
}

#[test]
fn aktywny_fotel_nieliczbowy_albo_brak_to_fotel_glowny_jak_web() {
    let mut b = played_session();
    let text = save(&mut b);
    for bad in [json!("2"), json!(null), json!(-1), json!(1.5), json!([2])] {
        let (loaded, _) = load_in_new_session(&with_active_seat(&text, bad.clone()));
        assert_eq!(
            loaded.adapter().fog_session().active_seat,
            PlayerId::new(HUMAN),
            "activeHumanOwnerId = {bad}"
        );
    }
    let mut v = json_of(&text);
    v.as_object_mut()
        .expect("obiekt")
        .remove("activeHumanOwnerId");
    let (loaded, _) = load_in_new_session(&serde_json::to_string(&v).expect("json"));
    assert_eq!(
        loaded.adapter().fog_session().active_seat,
        PlayerId::new(HUMAN)
    );
}

// ---------------------------------------------------------------------------------------------
// U1: mgla, plany marszu, oblezenia, cuda, pola ZMB/KAP
// ---------------------------------------------------------------------------------------------

#[test]
fn mgla_eksploracji_przezywa_zapis_w_kluczu_weba() {
    let mut b = played_session();
    let explored = b.adapter().fog_session().explored_by_human.clone();
    assert!(
        explored.values().any(|s| !s.is_empty()),
        "scenariusz odkryl heksy"
    );
    let text = save(&mut b);
    let snap = json_of(&text);
    assert!(
        snap["exploredByHuman"].is_array(),
        "klucz weba exploredByHuman"
    );
    let (loaded, _) = load_in_new_session(&text);
    assert_eq!(loaded.adapter().fog_session().explored_by_human, explored);
    assert!(!loaded.adapter().fog_session().reveal_all_land);
}

fn custom_state() -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("gra")
        .state()
        .clone();
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    st.cities.push(PlayableCity {
        id: CityId::new(CITY),
        owner_id: PlayerId::new(ENEMY),
        name: "Twierdza".into(),
        position: PositionDto::new(CITY_POS.0, CITY_POS.1),
        is_capital: false,
        population: 4,
        culture: 2,
    });
    add_unit(&mut st, 50, ENEMY, (5, 3), "Wojownik");
    add_unit(&mut st, 51, ENEMY, CITY_POS, "Wojownik");
    st
}

#[test]
fn plany_marszu_przezywaja_zapis_a_cele_ataku_sa_odbudowane() {
    let mut st = custom_state();
    st.planned_marches = vec![PlayablePlannedMarch {
        unit_id: UnitId::new(1),
        dest_q: 5,
        dest_r: 3,
        attack_unit_id: Some(UnitId::new(50)),
        general_target_id: None,
    }];
    st.march_attack_targets
        .insert(UnitId::new(1), UnitId::new(50));
    let mut b = bridge_for(st.clone());
    let text = save(&mut b);
    let snap = json_of(&text);
    assert_eq!(snap["plannedMarches"][0]["unitId"], json!("1"));
    assert_eq!(snap["plannedMarches"][0]["attackUnitId"], json!("50"));
    let body = &snap["playable"]["state"];
    assert!(
        body.get("plannedMarches").is_none(),
        "plan tylko w kluczu weba"
    );
    assert!(
        body.get("marchAttackTargets").is_none(),
        "web nie zapisuje marchAttackTargets"
    );
    let (mut loaded, _) = load_in_new_session(&text);
    let got = get_state(&mut loaded);
    assert_eq!(got.planned_marches, st.planned_marches);
    assert_eq!(
        got.march_attack_targets,
        BTreeMap::from([(UnitId::new(1), UnitId::new(50))]),
        "web syncMarchAttackTarget przy wczytaniu"
    );
}

#[test]
fn plan_obcej_jednostki_jest_odfiltrowany_przy_wczytaniu_jak_web() {
    // Web `plannedMarchesFromSave(..., units, 0)`: tylko jednostki gracza.
    let mut st = custom_state();
    st.planned_marches = vec![PlayablePlannedMarch {
        unit_id: UnitId::new(50),
        dest_q: 2,
        dest_r: 2,
        attack_unit_id: None,
        general_target_id: None,
    }];
    let mut b = bridge_for(st);
    let text = save(&mut b);
    let (mut loaded, _) = load_in_new_session(&text);
    assert!(get_state(&mut loaded).planned_marches.is_empty());
}

#[test]
fn oblezenia_i_cuda_przezywaja_zapis_w_kluczach_weba() {
    let mut st = custom_state();
    st.oblegane.insert(CityId::new(CITY));
    st.siege_machines_ready.insert(
        CityId::new(CITY),
        vec![
            PlayableSiegeMachineKind::Taran,
            PlayableSiegeMachineKind::Wieza,
        ],
    );
    st.placed_world_wonders = vec![PlayablePlacedWonder {
        wonder_id: "piramidy".into(),
        q: 1,
        r: 1,
        owner_id: PlayerId::new(HUMAN),
    }];
    let mut b = bridge_for(st.clone());
    let text = save(&mut b);
    let snap = json_of(&text);
    assert_eq!(snap["citySiege"][0]["cityId"], json!(CITY));
    assert_eq!(snap["citySiege"][0]["oblegane"], json!(true));
    assert_eq!(
        snap["meta"]["placedWorldWonders"][0]["wonderId"],
        json!("piramidy")
    );
    let body = &snap["playable"]["state"];
    for key in ["oblegane", "siegeMachinesReady", "placedWorldWonders"] {
        assert!(body.get(key).is_none(), "{key} tylko w kluczu weba");
    }
    let (mut loaded, _) = load_in_new_session(&text);
    let got = get_state(&mut loaded);
    assert_eq!(got.oblegane, st.oblegane);
    assert_eq!(got.siege_machines_ready, st.siege_machines_ready);
    assert_eq!(got.placed_world_wonders, st.placed_world_wonders);
}

#[test]
fn pola_zdobycia_i_kapitulacji_przezywaja_zapis_a_dziennik_nie() {
    let mut st = custom_state();
    st.captured_from_owner_by_city
        .insert(CityId::new(CITY), PlayerId::new(HUMAN));
    st.post_capture_law_by_city.insert(
        CityId::new(CITY),
        PlayablePostCaptureLaw {
            post_capture_law_turns_remaining: Some(3.0),
            was_rebellion_reconquest: true,
        },
    );
    st.city_prod_by_city.insert(
        CityId::new(CITY),
        PlayableCityProduction {
            kolejka: Vec::new(),
            postep: 12.5,
            wstrzymana: Some(true),
            rekrutacja: None,
        },
    );
    st.civ_chronicle_by_owner.insert(
        ENEMY,
        PlayableCivChronicle {
            produced: 4.0,
            cities_lost: 1.0,
            ..PlayableCivChronicle::default()
        },
    );
    st.siege_city.insert(
        CityId::new(CITY),
        PlayableCitySiege {
            oblegajacy_owner_id: Some(PlayerId::new(HUMAN)),
            siege_capitulation_pending: true,
            siege_starve_start_max_hp: Some(40.0),
            magazyn_zywnosci: Some(7.5),
        },
    );
    st.oblega_city_by_unit
        .insert(UnitId::new(1), CityId::new(CITY));
    st.capture_events
        .war_event_log
        .push(PlayableSidePanelEvent {
            id: "cap-1".into(),
            ..PlayableSidePanelEvent::default()
        });
    let mut b = bridge_for(st.clone());
    let text = save(&mut b);
    let (mut loaded, _) = load_in_new_session(&text);
    let got = get_state(&mut loaded);
    assert_eq!(
        got.captured_from_owner_by_city,
        st.captured_from_owner_by_city
    );
    assert_eq!(got.post_capture_law_by_city, st.post_capture_law_by_city);
    assert_eq!(got.city_prod_by_city, st.city_prod_by_city);
    assert_eq!(got.civ_chronicle_by_owner, st.civ_chronicle_by_owner);
    assert_eq!(got.siege_city, st.siege_city);
    assert_eq!(got.oblega_city_by_unit, st.oblega_city_by_unit);
    assert!(
        got.capture_events.war_event_log.is_empty(),
        "pin nie zapisuje warEventLog (D-SLB-4)"
    );
}

#[test]
fn flaga_miast_gracza_odtworzona_ze_miast_przy_wczytaniu() {
    // Pin `main.ts:46368-46370`: `playerEverOwnedCityByOwner` = fotele z miastem (flaga nie jest w zapisie).
    let mut b = played_session();
    let text = save(&mut b);
    let (loaded, _) = load_in_new_session(&text);
    assert!(loaded
        .adapter()
        .state()
        .ever_owned_city(PlayerId::new(HUMAN)));
    // Bez miasta gracza flaga po wczytaniu = false (web: brak miasta => brak wpisu).
    let mut st = loaded.adapter().state().clone();
    st.cities.retain(|c| c.owner_id != PlayerId::new(HUMAN));
    let mut nb = bridge_for(st);
    let (loaded2, _) = load_in_new_session(&save(&mut nb));
    assert!(!loaded2
        .adapter()
        .state()
        .ever_owned_city(PlayerId::new(HUMAN)));
}

#[test]
fn jednostka_wlasciciela_spoza_graczy_i_miast_nie_blokuje_zapisu() {
    // Rzut `GameStateDto` (D-SLB-2) wymaga cywilizacji kazdego wlasciciela jednostki: wlasciciel 77 nie jest
    // graczem i nie ma miasta (np. barbarzyncy / rebelianci sesji).
    let mut st = custom_state();
    add_unit(&mut st, 60, 77, (6, 4), "Wojownik");
    let mut b = bridge_for(st.clone());
    let text = save(&mut b);
    let snap = json_of(&text);
    let civ_ids: Vec<u64> = snap["state"]["civilizations"]
        .as_array()
        .expect("cywilizacje rzutu")
        .iter()
        .map(|c| c["id"].as_u64().expect("id"))
        .collect();
    assert!(civ_ids.contains(&77), "{civ_ids:?}");
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(get_state(&mut loaded).units, st.units);
}

#[test]
fn stan_wojny_jest_w_state_war_snapshotu_a_nie_w_ciele() {
    let st = siege_state(11);
    let war = st.war.clone();
    assert!(!war.is_default());
    let mut b = bridge_for(st);
    let text = save(&mut b);
    let snap = json_of(&text);
    assert!(
        snap["state"].get("war").is_some(),
        "wojna w state.war (D1=B)"
    );
    assert!(snap["playable"]["state"].get("war").is_none());
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(get_state(&mut loaded).war, war);
}

// ---------------------------------------------------------------------------------------------
// RNG bitew i bitwa w toku
// ---------------------------------------------------------------------------------------------

#[test]
fn licznik_bitew_rng_przezywa_zapis_i_nastepna_bitwa_jest_identyczna() {
    let mut live = bridge_for(siege_state(11));
    send(&mut live, storm()).expect("start 1");
    send(&mut live, EngineCommand::SkipSiegeBattle).expect("skip 1");
    send(&mut live, EngineCommand::FinishSiegeBattle).expect("finish 1");
    let text = save(&mut live);
    assert_eq!(
        json_of(&text)["playable"]["siegeBattlesStarted"],
        json!(1),
        "punkt kontrolny strumienia RNG bitew"
    );
    let (mut loaded, _) = load_in_new_session(&text);
    // Druga bitwa (jezeli miasto nadal stoi) w obu sesjach daje te same bajty odpowiedzi.
    let a = serde_json::to_string(&send(&mut live, storm()).map(|d| d.response)).expect("json");
    let b = serde_json::to_string(&send(&mut loaded, storm()).map(|d| d.response)).expect("json");
    assert_eq!(a, b);
    let a =
        serde_json::to_string(&send(&mut live, EngineCommand::SkipSiegeBattle).map(|d| d.response))
            .expect("json");
    let b = serde_json::to_string(
        &send(&mut loaded, EngineCommand::SkipSiegeBattle).map(|d| d.response),
    )
    .expect("json");
    assert_eq!(a, b);
}

#[test]
fn licznik_bitew_z_zapisu_zmienia_ziarno_nastepnej_bitwy() {
    // Czulosc: ten sam stan z innym licznikiem daje inny strumien (licznik naprawde wchodzi do RNG).
    let mut b = bridge_for(siege_state(11));
    let text = save(&mut b);
    let mut v = json_of(&text);
    v["playable"]["siegeBattlesStarted"] = json!(5);
    let (mut l5, _) = load_in_new_session(&serde_json::to_string(&v).expect("json"));
    assert_eq!(
        json_of(&save(&mut l5))["playable"]["siegeBattlesStarted"],
        json!(5)
    );
    let (mut l0, _) = load_in_new_session(&text);
    let run = |s: &mut EngineBridge<CivEngineAdapter>| {
        send(s, storm()).expect("start");
        serde_json::to_string(
            &send(s, EngineCommand::SkipSiegeBattle)
                .expect("skip")
                .response,
        )
        .expect("json")
    };
    assert_ne!(run(&mut l5), run(&mut l0));
}

#[test]
fn zapis_w_trakcie_bitwy_jest_jawnym_bledem_bez_zmiany_sesji() {
    let mut b = bridge_for(siege_state(11));
    send(&mut b, storm()).expect("start");
    let before = get_state(&mut b);
    let err = send(&mut b, EngineCommand::SaveGame).expect_err("bitwa trwa");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    assert!(err.message.contains("bitwa obleznicza"), "{}", err.message);
    assert_eq!(get_state(&mut b), before);
    // Bitwa nadal trwa (Skip dziala).
    send(&mut b, EngineCommand::SkipSiegeBattle).expect("bitwa trwa dalej");
}

#[test]
fn wczytanie_konczy_trwajaca_bitwe_sesji() {
    let mut saved = bridge_for(siege_state(11));
    let text = save(&mut saved);
    let mut b = bridge_for(siege_state(11));
    send(&mut b, storm()).expect("start");
    send(&mut b, EngineCommand::LoadGame { save: text }).expect("LoadGame");
    let err = send(&mut b, EngineCommand::SkipSiegeBattle).expect_err("brak bitwy");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    // Nowa bitwa startuje normalnie.
    send(&mut b, storm()).expect("start po wczytaniu");
}

// ---------------------------------------------------------------------------------------------
// Bledy wczytania i migracje
// ---------------------------------------------------------------------------------------------

#[test]
fn zly_zapis_jest_odrzucony_a_sesja_nietknieta() {
    let mut b = played_session();
    let before = get_state(&mut b);
    let fog_before = b.adapter().fog_session().clone();
    for bad in [
        "{}".to_owned(),
        "nie json".to_owned(),
        json!({"version": 9}).to_string(),
    ] {
        let err =
            send(&mut b, EngineCommand::LoadGame { save: bad.clone() }).expect_err("zly zapis");
        assert_eq!(err.code, BridgeErrorCode::EngineRejected, "{bad}");
        assert!(err.message.starts_with("load_game:"), "{}", err.message);
    }
    // Zly ksztalt ciala sesji (forma Rust) = blad, nie ciche pominiecie.
    let mut v = json_of(&save(&mut b));
    v["playable"]["state"] = json!(7);
    let err = send(
        &mut b,
        EngineCommand::LoadGame {
            save: serde_json::to_string(&v).expect("json"),
        },
    )
    .expect_err("zle cialo");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    assert_eq!(get_state(&mut b), before);
    assert_eq!(b.adapter().fog_session(), &fog_before);
}

#[test]
fn migracja_stosu_przy_wczytaniu_przenosi_jednostki_w_stanie_gry() {
    // Web `main.ts:46566-46573`: stosy ponad limitem dzielone na sasiednie heksy przy wczytaniu.
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("gra")
        .state()
        .clone();
    for t in &mut st.map.tiles {
        t.terrain = PlayableTerrain::Plains;
        t.passable = true;
    }
    let limit = civ_engine::domain::save_migrations::ARMY_STACK_LIMIT;
    let extra = 3_u64;
    for i in 0..(u64::try_from(limit).expect("limit") + extra) {
        add_unit(&mut st, 10_000 + i, HUMAN, (5, 4), "Wojownik");
    }
    let game = PlayableGame::from_state(st);
    let text = game.save_json().expect("zapis");
    let (loaded, report) = PlayableGame::load_json(&text).expect("wczytanie");
    assert!(
        !report.migration.moved_units.is_empty(),
        "migracja przeniosla jednostki"
    );
    let (snap, mig) = civ_engine::domain::zapis_loader::load_save_snapshot(&text).expect("loader");
    assert_eq!(mig, report.migration);
    for id in &report.migration.moved_units {
        let dto = snap
            .state()
            .units()
            .iter()
            .find(|u| u.id() == *id)
            .expect("jednostka w rzucie");
        let unit = loaded
            .state()
            .units
            .iter()
            .find(|u| u.id == *id)
            .expect("jednostka w stanie");
        assert_eq!(unit.position, dto.position(), "pozycja z migracji: {id:?}");
        assert_ne!(unit.position, PositionDto::new(5, 4));
    }
    let on_hex = loaded
        .state()
        .units
        .iter()
        .filter(|u| u.position == PositionDto::new(5, 4))
        .count();
    assert!(on_hex as i64 <= limit);
}

// ---------------------------------------------------------------------------------------------
// Adapter testowy (mock)
// ---------------------------------------------------------------------------------------------

#[test]
fn mock_odrzuca_zapis_bez_sesji_i_obsluguje_zapis_z_sesja() {
    let mut mock = EngineBridge::new(MockEngineAdapter::default());
    let err = mock
        .handle(BridgeRequest::new("s", EngineCommand::SaveGame))
        .expect_err("brak sesji");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    mock.handle(BridgeRequest::new(
        "c",
        EngineCommand::CreateSession {
            params: StartGameParams::default(),
        },
    ))
    .expect("sesja");
    let d = mock
        .handle(BridgeRequest::new("s", EngineCommand::SaveGame))
        .expect("zapis");
    let text = d.response.save_game.expect("saveGame");
    let l = mock
        .handle(BridgeRequest::new(
            "l",
            EngineCommand::LoadGame { save: text.clone() },
        ))
        .expect("wczytanie");
    assert_eq!(l.events.len(), 1);
    let calls = mock.adapter().calls();
    assert_eq!(
        &calls[calls.len() - 2..],
        &[
            EngineCommand::SaveGame,
            EngineCommand::LoadGame { save: text }
        ],
        "mock zapisuje wywolania save/load"
    );
    // Zapis innej (rozegranej) sesji wczytany w mocku: kolejny zapis mocka = ten sam tekst.
    let foreign = save(&mut played_session());
    mock.handle(BridgeRequest::new(
        "l2",
        EngineCommand::LoadGame {
            save: foreign.clone(),
        },
    ))
    .expect("wczytanie obcego zapisu");
    let again = mock
        .handle(BridgeRequest::new("s2", EngineCommand::SaveGame))
        .expect("zapis po wczytaniu");
    assert_eq!(again.response.save_game, Some(foreign));
    // Zly zapis w mocku: blad, stan mocka bez zmian.
    let before = mock.adapter().state().clone();
    mock.handle(BridgeRequest::new(
        "x",
        EngineCommand::LoadGame {
            save: "{}".to_owned(),
        },
    ))
    .expect_err("zly zapis");
    assert_eq!(mock.adapter().state(), &before);
}

#[test]
fn port_bez_sesji_odrzuca_save_i_load_domyslnie() {
    struct Bare;
    impl EnginePort for Bare {
        fn execute(&mut self, _command: EngineCommand) -> Result<bridge::EngineState, BridgeError> {
            Err(BridgeError::engine_rejected("bare"))
        }
    }
    let mut bare = Bare;
    assert_eq!(
        bare.save_game().expect_err("domyslnie").code,
        BridgeErrorCode::EngineRejected
    );
    assert_eq!(
        bare.load_game("{}").expect_err("domyslnie").code,
        BridgeErrorCode::EngineRejected
    );
    let _ = BTreeSet::<u8>::new();
}

// ---------------------------------------------------------------------------------------------
// Obrona r1 (N1, N2, N4): luki testow wskazane mutantami Evaluatora E05, E06, E08, E09
// ---------------------------------------------------------------------------------------------

/// E05/E06: zapis w SRODKU tury po `MoveUnit` (zbior `movedByPlayerThisTurn` niepusty) i z powiadomieniami
/// marszu. Pin ich nie zapisuje (`buildSaveGameSnapshot`) i czysci przy wczytaniu (`main.ts:46273-46280`):
/// cialo `playable` ich nie niesie, a wczytany stan ma je puste.
#[test]
fn zapis_w_srodku_tury_po_ruchu_nie_niesie_pol_ruchu_ani_powiadomien_w_ciele() {
    let mut b = session();
    let unit = get_state(&mut b).units[0].clone();
    send(
        &mut b,
        EngineCommand::SelectUnit {
            unit_id: unit.id.get(),
        },
    )
    .expect("select");
    send(
        &mut b,
        EngineCommand::MoveUnit {
            unit_id: unit.id.get(),
            destination: PositionDto::new(6, 4),
            attack_unit_id: None,
        },
    )
    .expect("ruch w srodku tury");
    let mut st = get_state(&mut b);
    assert!(
        st.is_moved_by_player_this_turn(unit.id),
        "warunek wstepny: MoveUnit oznacza jednostke (web markPlayerMovedUnit)"
    );
    st.march_stop_notified
        .insert(unit.id, PlayableMarchStopReason::NoMovement);
    st.march_stop_detail
        .insert(unit.id, "wstrzymane".to_owned());
    let mut nb = bridge_for(st);
    let text = save(&mut nb);
    let body = &json_of(&text)["playable"]["state"];
    for key in [
        "movedByPlayerThisTurn",
        "marchStopNotified",
        "marchStopDetail",
    ] {
        assert!(body.get(key).is_none(), "{key} poza cialem zapisu (pin)");
    }
    let (mut loaded, _) = load_in_new_session(&text);
    let got = get_state(&mut loaded);
    assert!(got.moved_by_player_this_turn.is_empty());
    assert!(got.march_stop_notified.is_empty());
    assert!(got.march_stop_detail.is_empty());
}

/// E05/E06 (strona wczytania): recznie dopisane pola ruchu i powiadomien w ciele zapisu sa czyszczone
/// przy wczytaniu jak w pinie (`main.ts:46273`, `:46280`).
#[test]
fn wczytanie_czysci_pola_ruchu_wpisane_recznie_do_ciala() {
    let mut st = custom_state();
    st.mark_player_moved_unit(UnitId::new(1));
    st.march_stop_notified
        .insert(UnitId::new(1), PlayableMarchStopReason::Obstacle);
    st.march_stop_detail
        .insert(UnitId::new(1), "przeszkoda".to_owned());
    let wire = serde_json::to_value(&st).expect("stan");
    let mut b = bridge_for(custom_state());
    let mut snap = json_of(&save(&mut b));
    for key in [
        "movedByPlayerThisTurn",
        "marchStopNotified",
        "marchStopDetail",
    ] {
        snap["playable"]["state"][key] = wire[key].clone();
        assert!(!snap["playable"]["state"][key].is_null(), "{key} wpisany");
    }
    let (mut loaded, _) = load_in_new_session(&serde_json::to_string(&snap).expect("json"));
    let got = get_state(&mut loaded);
    assert!(got.moved_by_player_this_turn.is_empty());
    assert!(got.march_stop_notified.is_empty());
    assert!(got.march_stop_detail.is_empty());
}

/// E08: pin `plannedMarchesFromSave(..., units, 0)` (`main.ts:46283`) filtruje plany po fotelu GLOWNYM, nie po
/// aktywnym fotelu. Przy aktywnym fotelu 2 plan jednostki fotela glownego przezywa, plan jednostki fotela 2 nie.
#[test]
fn plany_marszu_filtrowane_po_fotelu_glownym_gdy_aktywny_fotel_jest_inny() {
    let mut st = custom_state();
    add_unit(&mut st, 70, 2, (2, 2), "Wojownik");
    let main_plan = PlayablePlannedMarch {
        unit_id: UnitId::new(1),
        dest_q: 5,
        dest_r: 3,
        attack_unit_id: Some(UnitId::new(50)),
        general_target_id: None,
    };
    st.planned_marches = vec![
        main_plan.clone(),
        PlayablePlannedMarch {
            unit_id: UnitId::new(70),
            dest_q: 3,
            dest_r: 2,
            attack_unit_id: None,
            general_target_id: None,
        },
    ];
    let mut b = bridge_for(st);
    let snap = json_of(&save(&mut b));
    assert_eq!(
        snap["plannedMarches"].as_array().map(Vec::len),
        Some(2),
        "zapis niesie oba plany"
    );
    let text = with_active_seat(&serde_json::to_string(&snap).expect("json"), json!(2));
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(loaded.adapter().fog_session().active_seat, PlayerId::new(2));
    assert_eq!(get_state(&mut loaded).planned_marches, vec![main_plan]);
}

/// E09: miasto wlasciciela spoza `players` i bez jednostek musi trafic do cywilizacji rzutu `GameStateDto`
/// (inaczej walidacja rzutu odrzuca zapis bledem `UnknownCityOwner`).
#[test]
fn miasto_wlasciciela_spoza_graczy_bez_jednostek_nie_blokuje_zapisu() {
    let mut st = custom_state();
    st.cities.push(PlayableCity {
        id: CityId::new(901),
        owner_id: PlayerId::new(88),
        name: "Wolne miasto".into(),
        position: PositionDto::new(2, 4),
        is_capital: false,
        population: 2,
        culture: 0,
    });
    assert!(st.units.iter().all(|u| u.owner_id != PlayerId::new(88)));
    let mut b = bridge_for(st.clone());
    let text = save(&mut b);
    let civ_ids: Vec<u64> = json_of(&text)["state"]["civilizations"]
        .as_array()
        .expect("cywilizacje rzutu")
        .iter()
        .map(|c| c["id"].as_u64().expect("id"))
        .collect();
    assert!(civ_ids.contains(&88), "{civ_ids:?}");
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(get_state(&mut loaded).cities, st.cities);
}

/// N2 (DL-SLB-3 zawezony): pin zapisuje `meta.siegeTurnByCity` (`main.ts:37291`, odczyt `:47266`). W Rust to
/// zarzadzany surowy klucz `war.opaque` (`war_turn_state.rs:85`), wiec przechodzi przez `state.war` snapshotu.
#[test]
fn surowy_licznik_tur_oblezenia_w_war_opaque_przezywa_zapis() {
    let mut st = custom_state();
    st.war
        .opaque
        .insert("siegeTurnByCity".to_owned(), json!([[CITY, 3]]));
    let mut b = bridge_for(st);
    let text = save(&mut b);
    assert!(json_of(&text)["playable"]["state"].get("war").is_none());
    let (mut loaded, _) = load_in_new_session(&text);
    assert_eq!(
        get_state(&mut loaded).war.opaque.get("siegeTurnByCity"),
        Some(&json!([[CITY, 3]]))
    );
}

/// N4: cialo `playable` jest scisle co do FORMY znanych pol, a nieznane klucze ignoruje (jak reszta
/// `SnapshotWire`, bez `deny_unknown_fields`).
#[test]
fn cialo_sesji_ignoruje_nieznane_klucze_a_zla_forma_znanego_pola_to_blad() {
    let mut b = played_session();
    let text = save(&mut b);
    let (mut reference, _) = load_in_new_session(&text);
    let expected = get_state(&mut reference);
    let mut snap = json_of(&text);
    snap["playable"]["state"]["kluczZPrzyszlosci"] = json!(1);
    snap["playable"]["nieznany"] = json!("x");
    let (mut loaded, _) = load_in_new_session(&serde_json::to_string(&snap).expect("json"));
    assert_eq!(get_state(&mut loaded), expected);
    snap["playable"]["state"]["turn"] = json!("zla forma");
    let mut nb = session();
    let err = send(
        &mut nb,
        EngineCommand::LoadGame {
            save: serde_json::to_string(&snap).expect("json"),
        },
    )
    .expect_err("zla forma znanego pola");
    assert!(err.message.contains("load_game:"), "{}", err.message);
}
