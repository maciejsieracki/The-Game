//! R-RUSTPORT-P4-364-RENDER-FRAME-R1 (#364, czesc 3): pelna ramka renderera z mostu.
//!
//! Decyzje orkiestratora D-364-R3: komendy addytywne `GetRenderMap` -> `BridgeResult::RenderMap` i
//! `GetRenderFrame { seat, ui }` -> `BridgeResult::RenderFrame`, bez `StateChanged`, `CONTRACT_VERSION`
//! mostu = 1. Skladacz: `civ_engine::domain::render_frame`. Pin webu `07d2fbd72` (`gra/src/...`).

#[path = "../src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use std::collections::BTreeSet;

use bridge::{
    BridgeErrorCode, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge, EngineCommand,
    EnginePort, MockEngineAdapter, RenderUiParams, StartGameParams, CONTRACT_VERSION,
};
use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::map_view::build_map_view;
use civ_engine::domain::overlays_view::reachable_overlay;
use civ_engine::domain::playable::{
    MovementPoints, PlayableFogSession, PlayableGame, PlayablePlayer, PlayableUnit,
    PlayableUnitKind,
};
use civ_engine::domain::render_frame::{
    build_render_frame, render_map, snapshot_map_of, RenderFrameError, RENDER_FRAME_GAPS,
};
use civ_engine::{PlayableState, PlayerId, PositionDto, UnitId};
use civ_view_model as vm;
use civ_view_model::{FogState, MapViewDto, RenderLayersDto, Terrain};
use serde_json::{json, Value};

const HUMAN: u64 = 1;
const AI: u64 = 2;
/// `STARTING_UNIT_ID` / `START_X` / `START_Y` scenariusza startowego (`playable.rs:43-45`).
const WARRIOR: u64 = 1;

fn session_bridge() -> EngineBridge<CivEngineAdapter> {
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    bridge
        .handle(BridgeRequest::new(
            "create",
            EngineCommand::CreateSession {
                params: StartGameParams::default(),
            },
        ))
        .expect("sesja startuje");
    bridge
}

fn add_ai(bridge: &mut EngineBridge<CivEngineAdapter>) {
    bridge
        .handle(BridgeRequest::new(
            "ai",
            EngineCommand::AddPlayer {
                id: AI,
                name: "AI".to_owned(),
            },
        ))
        .expect("fotel 2");
}

fn frame_cmd(seat: Option<u64>, ui: Option<RenderUiParams>) -> EngineCommand {
    EngineCommand::GetRenderFrame { seat, ui }
}

/// Wysyla `GetRenderFrame`, sprawdza brak zdarzen i zwraca ramke.
fn frame(
    bridge: &mut EngineBridge<CivEngineAdapter>,
    seat: Option<u64>,
    ui: Option<RenderUiParams>,
) -> RenderLayersDto {
    let dispatch = bridge
        .handle(BridgeRequest::new("frame", frame_cmd(seat, ui)))
        .expect("zapytanie ramki");
    assert!(
        dispatch.events.is_empty(),
        "GetRenderFrame nie emituje StateChanged ({} zdarzen)",
        dispatch.events.len()
    );
    assert_eq!(dispatch.response.contract_version, CONTRACT_VERSION);
    match dispatch.response.result {
        BridgeResult::RenderFrame { frame } => frame.0,
        _ => panic!("GetRenderFrame musi zwrocic RenderFrame"),
    }
}

fn map(bridge: &mut EngineBridge<CivEngineAdapter>) -> MapViewDto {
    let dispatch = bridge
        .handle(BridgeRequest::new("map", EngineCommand::GetRenderMap))
        .expect("zapytanie mapy");
    assert!(dispatch.events.is_empty(), "GetRenderMap bez StateChanged");
    match dispatch.response.result {
        BridgeResult::RenderMap { map } => map.0,
        _ => panic!("GetRenderMap musi zwrocic RenderMap"),
    }
}

fn selected(id: u64) -> RenderUiParams {
    RenderUiParams {
        selected_unit_id: Some(id),
        ..RenderUiParams::default()
    }
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).expect("id"))
}

// (a) GetRenderMap == build_map_view na tym samym stanie -----------------------------------------------

#[test]
fn a_render_map_rowna_build_map_view_na_tym_samym_stanie() {
    let mut bridge = session_bridge();
    let state = bridge.adapter().state().clone();
    let got = map(&mut bridge);
    let expected = build_map_view(&snapshot_map_of(&state)).expect("map view");
    assert_eq!(got, expected);
    assert_eq!(got, render_map(&state).expect("render_map"));
    // Wymiary i kolejnosc r-major (kontrakt §1.4); kafel (0,0) to woda -> `morze` (`teren_of`).
    assert_eq!(got.width, u32::from(state.map.width));
    assert_eq!(got.height, u32::from(state.map.height));
    assert_eq!(got.hexes.len(), state.map.tiles.len());
    let order: Vec<(i32, i32)> = got.hexes.iter().map(|h| (h.coord.r, h.coord.q)).collect();
    let mut sorted = order.clone();
    sorted.sort_unstable();
    assert_eq!(order, sorted, "hexes r-major, q-minor");
    assert_eq!(got.hexes[0].teren_bazowy, Terrain::Morze);
    assert_eq!(got.seed, f64::from(state.params.seed));
    assert!(got.rivers.is_empty(), "stan nie ma rzek");
    vm::validate_map(&got).expect("mapa poprawna wg view-model");
}

// (b) rownolegle dlugosci ------------------------------------------------------------------------------

#[test]
fn b_hex_state_i_fog_rownolegle_do_map_hexes() {
    let mut bridge = session_bridge();
    let m = map(&mut bridge);
    let f = frame(&mut bridge, None, None);
    assert_eq!(f.hex_state.len(), m.hexes.len());
    assert_eq!(f.fog.state.len(), m.hexes.len());
    // Pelny snapshot (join) przechodzi walidacje kontraktu.
    let full = vm::RenderViewDto::join(m, f);
    assert_eq!(full.hex_state.len(), full.map.hexes.len());
}

// (c) kontrakt Q6-2 (D-R3-3) ---------------------------------------------------------------------------

#[test]
fn c_bez_trybu_budowy_nakladki_jednostki_zgodne_z_overlays_view() {
    let mut bridge = session_bridge();
    let f = frame(&mut bridge, None, Some(selected(WARRIOR)));
    let mut state = bridge.adapter().state().clone();
    let unit = state
        .units
        .iter()
        .find(|u| u.id == UnitId::new(WARRIOR))
        .expect("wojownik")
        .clone();
    let sel = f.overlays.selection.expect("zaznaczenie z UI");
    assert_eq!(
        sel.hex,
        vm::HexCoord::new(i32::from(unit.position.x()), i32::from(unit.position.y()))
    );
    assert_eq!(sel.owner_id, player(HUMAN));
    // `reachable` = `reachable_overlay` na stanie z tym samym `selectedId` (web jedna zmienna).
    state.selected_unit_id = Some(WARRIOR);
    let expected = reachable_overlay(&state);
    assert!(!expected.is_empty(), "wojownik ma ruch 1");
    assert_eq!(f.overlays.reachable, expected);
    assert!(f.overlays.build_highlight.hexes.is_empty());
}

#[test]
fn c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase() {
    let mut bridge = session_bridge();
    for ui in [
        RenderUiParams {
            build_mode_open: true,
            active_improvement_key: Some("farma".to_owned()),
            ..selected(WARRIOR)
        },
        RenderUiParams {
            found_city_mode: true,
            ..selected(WARRIOR)
        },
        RenderUiParams {
            wonder_active: true,
            ..selected(WARRIOR)
        },
    ] {
        let f = frame(&mut bridge, None, Some(ui.clone()));
        // `onOpenBuild` -> `clearPlayerUnitSelection()` (`main.ts:26702-26703`, `:7096-7105`).
        assert_eq!(f.overlays.selection, None, "{ui:?}");
        assert!(f.overlays.reachable.is_empty(), "{ui:?}");
        assert_eq!(f.overlays.path_route, None, "{ui:?}");
    }
    // Kontrola: `buildModeOpen` bez klucza = galaz „brak trybu” (`:16369`) - zaznaczenie zostaje.
    let f = frame(
        &mut bridge,
        None,
        Some(RenderUiParams {
            build_mode_open: true,
            ..selected(WARRIOR)
        }),
    );
    assert!(f.overlays.selection.is_some());
    assert!(!f.overlays.reachable.is_empty());
    // Rodzaj warstwy wg trybu (`refreshBuildHighlight`).
    let mine = frame(
        &mut bridge,
        None,
        Some(RenderUiParams {
            build_mode_open: true,
            active_improvement_key: Some("kopalnia_miedzi".to_owned()),
            ..RenderUiParams::default()
        }),
    );
    assert_eq!(
        mine.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Mine
    );
}

#[test]
fn c_brak_ui_to_brak_zaznaczenia() {
    let mut bridge = session_bridge();
    let f = frame(&mut bridge, None, None);
    assert_eq!(f.overlays.selection, None);
    assert!(f.overlays.reachable.is_empty());
    assert_eq!(f.overlays.path_route, None);
    // `selectedId` z UI, nie ze stanu: SelectUnit w stanie nie zmienia ramki bez UI.
    bridge
        .handle(BridgeRequest::new(
            "sel",
            EngineCommand::SelectUnit { unit_id: WARRIOR },
        ))
        .expect("select");
    let f2 = frame(&mut bridge, None, None);
    assert_eq!(f2.overlays.selection, None);
}

// (d) fotel ----------------------------------------------------------------------------------------------

#[test]
fn d_fotel_2_daje_inny_viewer_i_inna_mgle() {
    let mut bridge = session_bridge();
    add_ai(&mut bridge);
    let me = frame(&mut bridge, None, None);
    let seat2 = frame(&mut bridge, Some(AI), None);
    assert_eq!(me.viewer.owner_id, player(HUMAN));
    assert_eq!(seat2.viewer.owner_id, player(AI));
    assert_ne!(me.fog, seat2.fog);
    assert!(seat2.fog.state.iter().all(|s| *s == FogState::Unexplored));
    // Jednostki: fotel 2 nie widzi wojownika gracza (`unitsVisibleOnMap`, `visibility.ts:327-336`).
    assert_eq!(me.units.len(), 1);
    assert!(seat2.units.is_empty());
    // Aktywny fotel sesji bez zmian.
    assert_eq!(
        bridge.adapter().fog_session().active_seat,
        PlayerId::new(HUMAN)
    );
}

#[test]
fn d_nieznany_fotel_odrzucony() {
    let mut bridge = session_bridge();
    let err = bridge
        .handle(BridgeRequest::new("frame", frame_cmd(Some(99), None)))
        .expect_err("fotel 99 nie istnieje");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
}

// (e) determinizm -----------------------------------------------------------------------------------------

#[test]
fn e_dwa_wywolania_daja_identyczny_json() {
    let mut bridge = session_bridge();
    let ui = Some(selected(WARRIOR));
    let first = serde_json::to_string(&frame(&mut bridge, None, ui.clone())).expect("json");
    let second = serde_json::to_string(&frame(&mut bridge, None, ui.clone())).expect("json");
    let third = serde_json::to_string(&frame(&mut bridge, None, ui)).expect("json");
    // Mgla kumuluje sie (r2), ale bez ruchu widoczne = odkryte: kolejne ramki identyczne.
    assert_eq!(first, second);
    assert_eq!(second, third);
}

// (f) brak zmian stanu i zdarzen --------------------------------------------------------------------------

#[test]
fn f_ramka_i_mapa_nie_zmieniaja_engine_state() {
    let mut bridge = session_bridge();
    add_ai(&mut bridge);
    let before = bridge.adapter().state().clone();
    let _ = frame(&mut bridge, None, Some(selected(WARRIOR)));
    let _ = frame(&mut bridge, Some(AI), None);
    let _ = map(&mut bridge);
    assert_eq!(bridge.adapter().state(), &before);
    // GetState po zapytaniach daje ten sam stan.
    let d = bridge
        .handle(BridgeRequest::new("state", EngineCommand::GetState))
        .expect("get_state");
    match d.response.result {
        BridgeResult::State { state } => assert_eq!(state, before),
        _ => panic!("GetState zwraca State"),
    }
    // Eksploracja fotela rosnie tylko w sesji (jak r2).
    assert!(!bridge
        .adapter()
        .fog_session()
        .explored_by_human
        .get(&PlayerId::new(HUMAN))
        .expect("wpis")
        .is_empty());
}

#[test]
fn f_mock_odrzuca_zapytania_ramki() {
    let mut bridge = EngineBridge::new(MockEngineAdapter::default());
    for cmd in [EngineCommand::GetRenderMap, frame_cmd(None, None)] {
        let err = bridge
            .handle(BridgeRequest::new("q", cmd))
            .expect_err("mock bez sesji renderera");
        assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    }
    let mut mock = MockEngineAdapter::default();
    assert!(mock.render_map().is_err());
    assert!(mock.render_frame(None, None).is_err());
}

// (g) JSON -------------------------------------------------------------------------------------------------

#[test]
fn g_json_komend_i_odpowiedzi() {
    assert_eq!(CONTRACT_VERSION, 1, "D-R3-1: wersja mostu bez zmian");
    assert_eq!(
        serde_json::to_value(EngineCommand::GetRenderMap).expect("json"),
        json!({"kind": "get_render_map"})
    );
    assert_eq!(
        serde_json::to_value(frame_cmd(None, None)).expect("json"),
        json!({"kind": "get_render_frame"})
    );
    let cmd: EngineCommand = serde_json::from_value(json!({
        "kind": "get_render_frame",
        "seat": 2,
        "ui": {"selectedUnitId": 1, "buildModeOpen": true, "activeImprovementKey": "farma"}
    }))
    .expect("komenda z UI");
    assert_eq!(
        cmd,
        frame_cmd(
            Some(2),
            Some(RenderUiParams {
                selected_unit_id: Some(1),
                build_mode_open: true,
                active_improvement_key: Some("farma".to_owned()),
                ..RenderUiParams::default()
            })
        )
    );
    // `ui` = {} -> wszystkie pola domyslne; nieznane pole odrzucone.
    let empty: EngineCommand =
        serde_json::from_value(json!({"kind": "get_render_frame", "ui": {}})).expect("ui {}");
    assert_eq!(empty, frame_cmd(None, Some(RenderUiParams::default())));
    assert!(serde_json::from_value::<EngineCommand>(
        json!({"kind": "get_render_frame", "ui": {"selected": 1}})
    )
    .is_err());
    // Stary JSON bez zmian.
    assert_eq!(
        serde_json::to_value(EngineCommand::GetState).expect("json"),
        json!({"kind": "get_state"})
    );
    assert_eq!(
        serde_json::to_value(EngineCommand::GetRenderLayers { seat: None }).expect("json"),
        json!({"kind": "get_render_layers"})
    );
    assert_eq!(
        serde_json::to_value(EngineCommand::MoveUnit {
            unit_id: 1,
            destination: PositionDto::new(3, 1),
            attack_unit_id: None,
        })
        .expect("json"),
        json!({"kind": "move_unit", "unit_id": 1, "destination": {"x": 3, "y": 1}})
    );

    // Odpowiedzi: `kind` i camelCase pol ramki.
    let mut bridge = session_bridge();
    let d = bridge
        .handle(BridgeRequest::new("f", frame_cmd(None, None)))
        .expect("frame");
    let v: Value = serde_json::to_value(&d.response).expect("json");
    assert_eq!(v["result"]["kind"], "render_frame");
    let fr = &v["result"]["frame"];
    for key in [
        "contractVersion",
        "viewer",
        "turn",
        "hexState",
        "fog",
        "owners",
        "cities",
        "units",
        "stacks",
        "sieges",
        "wonders",
        "territory",
        "overlays",
        "battle",
    ] {
        assert!(fr.get(key).is_some(), "brak klucza {key}");
    }
    assert_eq!(fr["contractVersion"], json!(vm::CONTRACT_VERSION));
    assert_eq!(fr["viewer"]["fogActive"], json!(true));
    assert_eq!(fr["battle"], Value::Null);
    let back: bridge::BridgeResponse = serde_json::from_value(v).expect("odczyt odpowiedzi");
    assert_eq!(back, d.response);
    let dm = bridge
        .handle(BridgeRequest::new("m", EngineCommand::GetRenderMap))
        .expect("map");
    let vm_json: Value = serde_json::to_value(&dm.response).expect("json");
    assert_eq!(vm_json["result"]["kind"], "render_map");
    assert!(vm_json["result"]["map"]["riverRenderPaths"].is_array());
}

// (h) pola ramki - wektory --------------------------------------------------------------------------------

#[test]
fn h_pola_ramki_scenariusza_startowego() {
    let mut bridge = session_bridge();
    let state = bridge.adapter().state().clone();
    let f = frame(&mut bridge, None, None);
    assert_eq!(f.contract_version, vm::CONTRACT_VERSION);
    assert_eq!(f.turn, state.turn);
    assert!(f.viewer.fog_active);
    // owners: wszyscy gracze stanu rosnaco; cities: kolejnosc stanu.
    assert_eq!(f.owners.len(), state.players.len());
    assert_eq!(f.cities.len(), state.cities.len());
    assert_eq!(f.cities[0].owner_id, player(HUMAN));
    // units: wojownik gracza na (2,1), typ `Wojownik`, ruch 1/1; `hp` undefined = pelne z definicji:
    // `unitHealth(def)` = `def.health` (`main.ts:33093-33095`), w `units.json` = 22.
    let health = parse_units()
        .expect("units.json")
        .into_iter()
        .find(|u| u.jednostka == "Wojownik")
        .expect("Wojownik")
        .health_lc;
    assert_eq!(health, 22);
    assert_eq!(f.units.len(), 1);
    let u = &f.units[0];
    assert_eq!(u.id.get(), WARRIOR);
    assert_eq!(u.owner_id, player(HUMAN));
    assert_eq!(u.type_id, "Wojownik");
    assert_eq!(u.hex, vm::HexCoord::new(2, 1));
    assert_eq!((u.ruch_max, u.ruch_left), (1.0, 1.0));
    assert_eq!(u.hp, 22.0);
    assert_eq!(u.hp_max, None);
    assert_eq!(
        (u.veteran_stars, u.armor_badge_level, u.soft_badge_level),
        (0, 0, 0)
    );
    assert!(!u.embarked && !u.in_garnizon && !u.is_general && !u.dimmed);
    // stacks: jeden stos jednoelementowy -> reprezentant bez plakietki (`armyMerge.ts:584-646`).
    assert_eq!(f.stacks.visible_ids, vec![u.id]);
    assert!(f.stacks.badge_by_rep_id.is_empty());
    // sieges / wonders: brak oblezen i cudow w stanie.
    assert!(f.sieges.is_empty());
    assert!(f.wonders.is_empty());
    // territory: stolica gracza -> jeden wlasciciel, heksy w kolejnosci r-major.
    assert_eq!(f.territory.by_owner.len(), 1);
    assert_eq!(f.territory.by_owner[0].owner_id, player(HUMAN));
    let hexes: Vec<(i32, i32)> = f.territory.by_owner[0]
        .hexes
        .iter()
        .map(|h| (h.r, h.q))
        .collect();
    let mut sorted = hexes.clone();
    sorted.sort_unstable();
    assert_eq!(hexes, sorted);
    assert!(hexes.contains(&(1, 1)), "heks stolicy (1,1)");
    // overlays: zasiegi kultury/religii wylaczone (`main.ts:15335-15336`), brak tras i okolicy.
    assert_eq!(f.overlays.culture_range, None);
    assert_eq!(f.overlays.religion_range, None);
    assert!(f.overlays.trade_routes.is_empty());
    assert_eq!(f.overlays.okolica, None);
    assert_eq!(f.battle, None);
}

/// Dwa stosy: dwie jednostki gracza na jednym heksie (plakietka x2) i wrog poza widokiem (filtr mgly).
fn two_stacks_state() -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz")
        .state()
        .clone();
    state.players.push(PlayablePlayer {
        id: PlayerId::new(AI),
        name: "AI".to_owned(),
        civilization: "grecy".to_owned(),
        is_human: false,
    });
    let mk = |id: u64, owner: u64, x: u16, y: u16| PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    };
    state.units.push(mk(5, HUMAN, 2, 1));
    let far_x = state.map.width - 1;
    let far_y = state.map.height - 1;
    state.units.push(mk(9, AI, far_x, far_y));
    state
}

#[test]
fn h_stosy_i_filtr_mgly_jednostek() {
    let state = two_stacks_state();
    let mut session = PlayableFogSession::for_new_game(&state);
    let f = build_render_frame(
        &state,
        &mut session,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect("ramka");
    let ids: Vec<u64> = f.units.iter().map(|u| u.id.get()).collect();
    // Wrog (9) poza `currentVisible()` nie trafia do `units` (`unitsVisibleOnMap`).
    let far = vm::HexCoord::new(
        i32::from(state.map.width - 1),
        i32::from(state.map.height - 1),
    );
    let enemy_visible = f.fog.state[f.fog.state.len() - 1] == FogState::Visible;
    assert!(
        !enemy_visible,
        "naroznik {far:?} poza zasiegiem widzenia gracza"
    );
    assert!(
        !ids.contains(&9),
        "wrog na {far:?} poza mgla nie jest w units"
    );
    assert!(ids.contains(&1) && ids.contains(&5));
    // Stos (2,1): remis ataku -> mniejsze id UTF-16 (`pickStackLeader`), plakietka 2.
    assert_eq!(f.stacks.badge_by_rep_id.len(), 1);
    assert_eq!(f.stacks.badge_by_rep_id[0].0.get(), 1);
    assert_eq!(f.stacks.badge_by_rep_id[0].1, 2);
    assert!(!f.stacks.visible_ids.iter().any(|id| id.get() == 5));

    // Bez mgly (`fogOn = false`): wszystkie jednostki.
    let mut no_fog = PlayableFogSession::for_new_game(&state);
    no_fog.fog_on = false;
    let f2 = build_render_frame(
        &state,
        &mut no_fog,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect("ramka bez mgly");
    assert_eq!(f2.units.len(), state.units.len());
    assert!(!f2.viewer.fog_active);
}

#[test]
fn h_skladacz_odrzuca_nieznany_fotel() {
    let state = two_stacks_state();
    let mut session = PlayableFogSession::for_new_game(&state);
    let err = build_render_frame(
        &state,
        &mut session,
        PlayerId::new(42),
        &RenderUiParams::default(),
    )
    .expect_err("fotel 42");
    assert_eq!(err, RenderFrameError::UnknownSeat(42));
}

#[test]
fn h_jawne_luki_ramki() {
    let fields: BTreeSet<&str> = RENDER_FRAME_GAPS.iter().map(|g| g.field).collect();
    let expected: BTreeSet<&str> = [
        "overlays.workerFields",
        "overlays.buildHighlight.hexes",
        "stacks.vitalsByRepId",
        "stacks.starvingRepIds / stacks.goldDeficitRepIds",
        "units[].hp (brak hp w stanie) / units[].hpMax",
    ]
    .into_iter()
    .collect();
    assert_eq!(fields, expected);
    assert!(RENDER_FRAME_GAPS.iter().all(|g| !g.reason.is_empty()));
}
