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
use civ_engine::data::economy_society_part2::parse_ai_params;
use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::combat::unit_building_bonuses::{
    soft_path_badge_level, UnitBuildingProgress,
};
use civ_engine::domain::diplomacy::RelationStatus;
use civ_engine::domain::map_view::build_map_view;
use civ_engine::domain::overlays_view::reachable_overlay;
use civ_engine::domain::playable::{
    MovementPoints, PlayableFogSession, PlayableGame, PlayablePlayer, PlayableReplaceUnit,
    PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::playable::{
    PlayableFort, PlayableFortKind, PlayablePlacedWonder, PlayableTerrain,
};
use civ_engine::domain::render_frame::{
    build_render_frame, render_map, snapshot_map_of, RenderFrameError, RENDER_FRAME_GAPS,
    RENDER_FRAME_STATE_DEFAULTS,
};
use civ_engine::domain::terrain::{axial_distance, city_territory_radius, CityNode};
use civ_engine::domain::turn_war_epoch::epochs_with_sources;
use civ_engine::domain::unit_power::{field_power, UnitPowerCoeffs, UnitPowerInput};
use civ_engine::{CityId, PlayableCity, PlayableState, PlayerId, PositionDto, UnitId};
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
        // Obrona r1 zarzut 1 (D-R3-3): sam otwarty panel, przed wyborem klucza, tez czysci.
        RenderUiParams {
            build_mode_open: true,
            ..selected(WARRIOR)
        },
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
    // `buildModeOpen` bez klucza: warstwa podswietlenia = galaz „brak trybu” (`:16369`), ale zaznaczenie
    // i tak wyczyszczone (wyzej). Kontrola: zamkniety panel zostawia zaznaczenie.
    let f = frame(&mut bridge, None, Some(selected(WARRIOR)));
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
    // R2: `syncRuntimeUnitHpState` (`main.ts:33109-33118`) ustawia `u.hpMax = hpMaxEffective` = 22 bez
    // bonusow (`effectiveMaxHp(22, 0, 0)`, `unit-card-stats.ts:79-95`).
    assert_eq!(u.hp_max, Some(22.0));
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
    let defaults: BTreeSet<&str> = RENDER_FRAME_STATE_DEFAULTS
        .iter()
        .map(|g| g.field)
        .collect();
    let expected_defaults: BTreeSet<&str> = [
        "cities[] kolejka / bunt / wzrost na zywo",
        "owners[] / cities[] miasta-panstwa",
        "units[].isGeneral / units[].dimmed",
        "units[].embarked / units[].inGarnizon",
        "units[].armorBadgeLevel",
        "stacks.vitalsByRepId fortyfikacja / garnizon / miasta-panstwa",
        "overlays.buildHighlight zrodla spoza stanu",
        "overlays.tradeRoutes",
        "battle",
    ]
    .into_iter()
    .collect();
    assert_eq!(defaults, expected_defaults);
    assert!(RENDER_FRAME_STATE_DEFAULTS
        .iter()
        .all(|g| !g.reason.is_empty() && !g.produced.is_empty()));
    let fields: BTreeSet<&str> = RENDER_FRAME_GAPS.iter().map(|g| g.field).collect();
    let expected: BTreeSet<&str> = [
        "overlays.workerFields",
        "stacks.starvingRepIds / stacks.goldDeficitRepIds",
    ]
    .into_iter()
    .collect();
    assert_eq!(fields, expected);
    assert!(RENDER_FRAME_GAPS.iter().all(|g| !g.reason.is_empty()));
    // R2: luki zalezne od stanu ekonomii wskazuja dlug #310 (decyzja techniczna dyspozycji r2).
    assert!(RENDER_FRAME_GAPS.iter().all(|g| g.reason.contains("#310")));
}

// (h) obrona r1 zarzut 2: pola produkowane od zera ---------------------------------------------------------

fn ai_player() -> PlayablePlayer {
    PlayablePlayer {
        id: PlayerId::new(AI),
        name: "AI".to_owned(),
        civilization: "grecy".to_owned(),
        is_human: false,
    }
}

fn city(id: u64, owner: u64, x: u16, y: u16) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("miasto-{id}"),
        position: PositionDto::new(x, y),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

fn start_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("scenariusz")
        .state()
        .clone()
}

fn frame_of(state: &PlayableState, fog_on: bool) -> RenderLayersDto {
    let mut session = PlayableFogSession::for_new_game(state);
    session.fog_on = fog_on;
    build_render_frame(
        state,
        &mut session,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect("ramka")
}

fn hexes_of(f: &RenderLayersDto, owner: u64) -> BTreeSet<(i32, i32)> {
    f.territory
        .by_owner
        .iter()
        .filter(|o| o.owner_id == player(owner))
        .flat_map(|o| o.hexes.iter().map(|h| (h.q, h.r)))
        .collect()
}

fn fog_at(m: &MapViewDto, f: &RenderLayersDto, q: i32, r: i32) -> FogState {
    let i = m
        .hexes
        .iter()
        .position(|h| h.coord == vm::HexCoord::new(q, r))
        .expect("heks mapy");
    f.fog.state[i]
}

/// Web `refreshTerritoryBorderOverlay` (`main.ts:15582-15601`): cudze terytorium tylko na heksach
/// `vis.has(key) || explored.has(key)`; wlasne zawsze (`isMe`); `!fogOn` = wszystko.
#[test]
fn h_terytorium_cudze_filtrowane_mgla() {
    let mut state = start_state();
    state.players.push(ai_player());
    // Miasto AI w naroznym heksie (poza widokiem gracza, jak `h_stosy_i_filtr_mgly_jednostek`).
    let (fx, fy) = (state.map.width - 1, state.map.height - 1);
    state.cities.push(city(77, AI, fx, fy));
    let m = render_map(&state).expect("mapa");

    // Bez mgly: pelne terytorium AI (punkt odniesienia filtra).
    let all = frame_of(&state, false);
    let ai_all = hexes_of(&all, AI);
    assert!(ai_all.contains(&(i32::from(fx), i32::from(fy))));
    assert!(ai_all.len() > 1, "miasto AI ma terytorium");

    // Mgla: heksy AI dziela sie na widoczne/odkryte i nieodkryte (obie czesci niepuste); w ramce
    // zostaja tylko te pierwsze. Wlasne terytorium bez zmian (`isMe`).
    let fogged = frame_of(&state, true);
    let seen = |f: &RenderLayersDto| -> BTreeSet<(i32, i32)> {
        ai_all
            .iter()
            .copied()
            .filter(|&(q, r)| fog_at(&m, f, q, r) != FogState::Unexplored)
            .collect()
    };
    let hidden: Vec<(i32, i32)> = ai_all
        .iter()
        .copied()
        .filter(|&(q, r)| fog_at(&m, &fogged, q, r) == FogState::Unexplored)
        .collect();
    assert!(!hidden.is_empty(), "czesc terytorium AI pod mgla");
    assert!(
        hexes_of(&fogged, AI).len() < ai_all.len(),
        "cudze terytorium pod mgla ukryte"
    );
    assert_eq!(hexes_of(&fogged, AI), seen(&fogged));
    // Galaz `vis.has(key)`: swiezo po starcie odkryte = widoczne, wiec te heksy sa `Visible`.
    assert!(
        !hexes_of(&fogged, AI).is_empty(),
        "czesc terytorium AI w widoku"
    );
    assert!(hexes_of(&fogged, AI)
        .iter()
        .all(|&(q, r)| fog_at(&m, &fogged, q, r) == FogState::Visible));
    assert_eq!(
        hexes_of(&fogged, HUMAN),
        hexes_of(&all, HUMAN),
        "isMe(owner) zawsze"
    );

    // Galaz `explored.has(key)`: dwa nieodkryte heksy AI dopisane do eksploracji (nie widoczne) ->
    // dochodza do ramki jako `Explored`.
    let picked: Vec<(i32, i32)> = hidden.iter().copied().take(2).collect();
    let mut explored = PlayableFogSession::for_new_game(&state);
    explored
        .explored_by_human
        .entry(PlayerId::new(HUMAN))
        .or_default()
        .extend(picked.iter().copied());
    let part = build_render_frame(
        &state,
        &mut explored,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect("ramka z odkrytymi");
    for &(q, r) in &picked {
        assert_eq!(fog_at(&m, &part, q, r), FogState::Explored);
    }
    let mut expected = hexes_of(&fogged, AI);
    expected.extend(picked.iter().copied());
    assert_eq!(hexes_of(&part, AI), expected);
    assert_eq!(hexes_of(&part, AI), seen(&part));
}

/// `cities[].besieged` = `c.oblegane`; `sieges` = `siege_views` z obozem wroga (wojna) przy miescie.
#[test]
fn h_oblezenie_besieged_i_sieges() {
    let mut state = start_state();
    state.players.push(ai_player());
    let capital = state.cities[0].clone();
    // Jednostka AI na heksie sasiednim do stolicy (1,1).
    state.units.push(PlayableUnit {
        id: UnitId::new(9),
        owner_id: PlayerId::new(AI),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(1, 2),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    });
    state.oblegane.insert(capital.id);
    state
        .war
        .diplomacy
        .ensure_relation(PlayerId::new(HUMAN), PlayerId::new(AI))
        .status = RelationStatus::War;
    let f = frame_of(&state, true);
    let c = f
        .cities
        .iter()
        .find(|c| c.id.get() == capital.id.get())
        .expect("stolica");
    assert!(c.besieged, "c.oblegane");
    assert_eq!(f.sieges.len(), 1);
    assert_eq!(f.sieges[0].city_id.get(), capital.id.get());
    assert_eq!(
        f.sieges[0]
            .camp_hexes
            .iter()
            .map(|c| (c.hex, c.owner_id))
            .collect::<Vec<_>>(),
        vec![(vm::HexCoord::new(1, 2), player(AI))]
    );
    // Bez wojny (`areEnemyOwners` = false): oblezenie bez obozu; bez `oblegane`: brak wpisu.
    let mut peace = state.clone();
    peace
        .war
        .diplomacy
        .ensure_relation(PlayerId::new(HUMAN), PlayerId::new(AI))
        .status = RelationStatus::Peace;
    let fp = frame_of(&peace, true);
    assert_eq!(fp.sieges.len(), 1);
    assert!(fp.sieges[0].camp_hexes.is_empty());
    peace.oblegane.clear();
    let none = frame_of(&peace, true);
    assert!(none.sieges.is_empty());
    assert!(none.cities.iter().all(|c| !c.besieged));
}

/// `units[].hp` = `economy.units[id].hp` (web `unit.hp`), `hpMax` = `economy.units[id].hpMax`.
#[test]
fn h_hp_jednostki_z_ekonomii() {
    let mut state = start_state();
    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            hp: Some(7.5),
            hp_max: Some(20.0),
            ..PlayableReplaceUnit::default()
        },
    );
    let f = frame_of(&state, true);
    let u = f
        .units
        .iter()
        .find(|u| u.id.get() == WARRIOR)
        .expect("wojownik");
    assert_eq!(u.hp, 7.5);
    // R2: cache `hpMax` (20) nadpisany przez `syncRuntimeUnitHpState` (`main.ts:33109-33118`):
    // `hpMax = effectiveRuntimeUnitMaxHp(u)` = 22 (Wojownik bez bonusow).
    assert_eq!(u.hp_max, Some(22.0));
}

/// Obrona r1 zarzut 3: typ bez definicji w `units.json` = jawny blad, nie `hp = 0`.
#[test]
fn h_typ_bez_definicji_to_blad() {
    let mut state = start_state();
    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            type_id: Some("NieistniejacyTyp".to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
    let mut session = PlayableFogSession::for_new_game(&state);
    let err = build_render_frame(
        &state,
        &mut session,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect_err("brak definicji");
    assert_eq!(
        err,
        RenderFrameError::UnknownUnitType("NieistniejacyTyp".to_owned())
    );
}

// =====================================================================================================
// R2 (DODATEK r2, RENDER_FRAME_GAPS): luki 1-3 domkniete; 4-5 jawne (zaleznosc #310).
// =====================================================================================================

/// Stan startowy z mapa w calosci rowninna poza wskazanymi heksami (deterministyczne wektory).
fn plains_state(water: &[(u16, u16)], hills: &[(u16, u16)]) -> PlayableState {
    let mut state = start_state();
    for t in &mut state.map.tiles {
        let p = (t.position.x(), t.position.y());
        t.terrain = if water.contains(&p) {
            PlayableTerrain::Water
        } else if hills.contains(&p) {
            PlayableTerrain::Hills
        } else {
            PlayableTerrain::Plains
        };
        t.passable = t.terrain.is_passable();
    }
    state
}

fn ui_found_city() -> RenderUiParams {
    RenderUiParams {
        found_city_mode: true,
        ..RenderUiParams::default()
    }
}

fn ui_wonder() -> RenderUiParams {
    RenderUiParams {
        wonder_active: true,
        ..RenderUiParams::default()
    }
}

fn ui_improvement(key: &str) -> RenderUiParams {
    RenderUiParams {
        build_mode_open: true,
        active_improvement_key: Some(key.to_owned()),
        ..RenderUiParams::default()
    }
}

fn frame_ui(state: &PlayableState, seat: u64, ui: &RenderUiParams) -> RenderLayersDto {
    let mut session = PlayableFogSession::for_new_game(state);
    build_render_frame(state, &mut session, PlayerId::new(seat), ui).expect("ramka")
}

fn highlight(f: &RenderLayersDto) -> Vec<(i32, i32)> {
    f.overlays
        .build_highlight
        .hexes
        .iter()
        .map(|h| (h.q, h.r))
        .collect()
}

fn coords(state: &PlayableState) -> Vec<(i32, i32)> {
    state
        .map
        .tiles
        .iter()
        .map(|t| (i32::from(t.position.x()), i32::from(t.position.y())))
        .collect()
}

/// `MIN_CITY_DISTANCE` (`cities.ts:1117` = `miasto-params.json` `min_dystans_miast`).
const MIN_CITY_DISTANCE: f64 = 4.0;

/// R2 luka 1 (`foundCityMode`, `main.ts:16352-16361`): heksy `isInStartReveal && canFoundPlayerCityAt(q,
/// r).ok`. Wektor wg `canFoundCity` (`cities.ts:1163-1230` @ `07d2fbd72`): heks ladowy (nie woda, nie
/// gory), `hexDistance >= MIN_CITY_DISTANCE` od kazdego miasta, w terytorium wlasnym
/// (`foundingTerritoryOpts`, `main.ts:12906-12920`: gracz ma stolice, wiec `isInTerritory` wezlow stolicy),
/// limit miast (1 < 10). Stolica (1,1), populacja 1.
#[test]
fn r2_build_highlight_found_city_wg_can_found_city() {
    let water = [(0, 0), (0, 1), (5, 2)];
    let state = plains_state(&water, &[]);
    let capital = state.cities[0].position;
    let (cq, cr) = (i32::from(capital.x()), i32::from(capital.y()));
    let radius = city_territory_radius(&CityNode::city(cq, cr, 1.0));
    let expected: BTreeSet<(i32, i32)> = coords(&state)
        .into_iter()
        .filter(|&(q, r)| !water.contains(&(q as u16, r as u16)))
        .filter(|&(q, r)| {
            let d = axial_distance(q, r, cq, cr);
            d >= MIN_CITY_DISTANCE && d <= radius
        })
        .collect();
    assert!(!expected.is_empty(), "wektor niepusty (promien {radius})");
    let f = frame_ui(&state, HUMAN, &ui_found_city());
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::FoundCity
    );
    let got = highlight(&f);
    assert_eq!(got.iter().copied().collect::<BTreeSet<_>>(), expected);
    // Kolejnosc = `Object.values(map.hexes)` (r-major), bez powtorzen (`new Set`).
    let mut sorted = got.clone();
    sorted.sort_by_key(|&(q, r)| (r, q));
    assert_eq!(got, sorted);
    assert!(!got.contains(&(5, 2)), "woda: `reasons.morze`");
    assert!(!got.contains(&(3, 1)), "za blisko stolicy (d = 2 < 4)");
    // Q6-2 (D-R3-3) zachowany: tryb zalozenia miasta czysci zaznaczenie.
    let mut sel = ui_found_city();
    sel.selected_unit_id = Some(WARRIOR);
    let f2 = frame_ui(&state, HUMAN, &sel);
    assert_eq!(f2.overlays.selection, None);
    assert!(f2.overlays.reachable.is_empty());
}

/// R2 luka 1: oczekiwanie na pierwsze miasto (`isAwaitingFirstPlayerCity`, gracz bez miasta) =
/// `foundingTerritoryOpts` -> `{}` (bez `withinTerritory`) i krag startu (`isInStartReveal`,
/// `first-player-city.ts:23-33`): heksy poza kregiem odrzucone, w kregu wg `canFoundCity`.
#[test]
fn r2_build_highlight_found_city_pierwsze_miasto() {
    let mut state = plains_state(&[(0, 0), (0, 1)], &[]);
    // Heks startu = stolica nowej gry (`playerStartHexFor`); potem gracz bez miasta (oczekiwanie).
    let mut session = PlayableFogSession::for_new_game(&state);
    state.cities.clear();
    // `playerEverOwnedCity` = false (`isAwaitingFirstPlayerCity`, `first-player-city.ts:14-20`).
    state.gracz_kiedys_mial_miasto = false;
    assert!(state.is_awaiting_first_city(PlayerId::new(HUMAN)));
    let (sq, sr) = *session
        .player_start_hex_by_owner
        .get(&PlayerId::new(HUMAN))
        .expect("heks startu fotela");
    let reveal = session.start_reveal_radius;
    let f = build_render_frame(&state, &mut session, PlayerId::new(HUMAN), &ui_found_city())
        .expect("ramka");
    let expected: BTreeSet<(i32, i32)> = coords(&state)
        .into_iter()
        .filter(|&(q, r)| !(q == 0 && r <= 1))
        .filter(|&(q, r)| axial_distance(q, r, sq, sr) <= reveal)
        .collect();
    let got: BTreeSet<(i32, i32)> = highlight(&f).into_iter().collect();
    assert_eq!(got, expected);
}

/// R2 luka 1 (`activeWonderId`, `main.ts:16363-16367`): `listQualifyingWonderHexesForOwner`
/// (`wonder-placement.ts:53-119`): ladowe heksy `0 < dist <= cityTerritoryRadius` od miasta fotela, bez
/// heksow miast i postawionych cudow, sortowane `dist, q, r`.
#[test]
fn r2_build_highlight_cud_wg_wonder_placement() {
    let water = [(0, 0), (0, 1), (2, 2)];
    let mut state = plains_state(&water, &[]);
    state.placed_world_wonders.push(PlayablePlacedWonder {
        wonder_id: "piramidy".to_owned(),
        q: 2,
        r: 0,
        owner_id: PlayerId::new(HUMAN),
    });
    let (cq, cr) = (1, 1);
    let radius = city_territory_radius(&CityNode::city(cq, cr, 1.0));
    let mut expected: Vec<(f64, i32, i32)> = coords(&state)
        .into_iter()
        .filter(|&(q, r)| !water.contains(&(q as u16, r as u16)))
        .filter(|&(q, r)| (q, r) != (2, 0))
        .map(|(q, r)| (axial_distance(q, r, cq, cr), q, r))
        .filter(|&(d, _, _)| d > 0.0 && d <= radius)
        .collect();
    expected.sort_by(|a, b| {
        a.0.partial_cmp(&b.0)
            .expect("dist")
            .then(a.1.cmp(&b.1))
            .then(a.2.cmp(&b.2))
    });
    let expected: Vec<(i32, i32)> = expected.into_iter().map(|(_, q, r)| (q, r)).collect();
    let f = frame_ui(&state, HUMAN, &ui_wonder());
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Wonder
    );
    assert_eq!(highlight(&f), expected);
    // Fotel bez miast: `playerCities.length === 0` -> `[]` (`main.ts:5212`).
    state.players.push(ai_player());
    let f_ai = frame_ui(&state, AI, &ui_wonder());
    assert!(highlight(&f_ai).is_empty());
}

/// R2 luka 1 (ulepszenie, `main.ts:16369-16395`): `buildApi.getQualifyingHexes(key)`
/// (`improvement-build.ts` `getQualifyingHexes` = kandydaci x `qualifies`; technologia bramkuje tylko
/// `createBuildRequest`, nie podswietlenie) z owinieciem cywilizacji (`isImprovementAllowedForCiv`,
/// `main.ts:16336-16337`: `tarasy` tylko `chinczycy`/`inkowie`).
#[test]
fn r2_build_highlight_ulepszenie_wg_build_api() {
    let state = plains_state(&[(0, 0), (0, 1)], &[(3, 2), (2, 3)]);
    let f = frame_ui(&state, HUMAN, &ui_improvement("farma"));
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Improvement
    );
    let with_tech = state.clone();
    let farms = highlight(&f);
    assert!(!farms.is_empty(), "farma na rowninie terytorium");
    // Woda nigdy (`teren` farmy), heksy poza terytorium + pierscieniem kandydatow nigdy.
    assert!(!farms.contains(&(0, 0)) && !farms.contains(&(0, 1)));
    let radius = city_territory_radius(&CityNode::city(1, 1, 1.0));
    assert!(farms
        .iter()
        .all(|&(q, r)| axial_distance(q, r, 1, 1) <= radius + 1.0));

    // `tarasy` dla rzymian: `[]` mimo technologii (owiniecie civ, `main.ts:16336-16337`).
    let terraces = highlight(&frame_ui(&with_tech, HUMAN, &ui_improvement("tarasy")));
    assert!(terraces.is_empty(), "tarasy niedozwolone dla rzymian");
    let mut chinese = with_tech.clone();
    chinese.players[0].civilization = "chinczycy".to_owned();
    let terraces_cn = highlight(&frame_ui(&chinese, HUMAN, &ui_improvement("tarasy")));
    assert!(
        !terraces_cn.is_empty(),
        "tarasy dla chinczykow na wzgorzach terytorium"
    );
    assert!(terraces_cn.iter().all(|h| [(3, 2), (2, 3)].contains(h)));
}

fn wojownik() -> civ_engine::data::units_combat::UnitRecord {
    parse_units()
        .expect("units.json")
        .into_iter()
        .find(|u| u.jednostka == "Wojownik")
        .expect("Wojownik")
}

/// R2 luka 3: `hpMax` = `hpMaxEffective` = `effectiveMaxHp(unitHealth(def), unitParametryBonusFrac,
/// veteranCombatBonusFrac)` (`unit-card-stats.ts:79-95,114`); `veteranCombatBonusFrac` 1 bitwy = 0.10
/// (`veteran.ts:71-76`); `parametryBonusProc` 20 -> 0.20 (`unit-building-bonuses.ts:344`). Wektory:
/// `round(22 * 1.1, 1)` = 24.2, `round(22 * 1.3, 1)` = 28.6; `hp` przyciete do `[0, hpMax]`
/// (`main.ts:33113-33117`).
#[test]
fn r2_hp_max_effective_z_bonusami() {
    assert_eq!(wojownik().health_lc, 22);
    let mut state = start_state();
    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            battles_survived: Some(1.0),
            ..PlayableReplaceUnit::default()
        },
    );
    let f = frame_of(&state, true);
    let u = &f.units[0];
    assert_eq!(u.hp_max, Some(24.2));
    assert_eq!(u.hp, 24.2, "hp undefined = pelne efektywne");
    assert_eq!(u.veteran_stars, 1);

    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            battles_survived: Some(1.0),
            parametry_bonus_proc: Some(20.0),
            hp: Some(99.0),
            ..PlayableReplaceUnit::default()
        },
    );
    let f = frame_of(&state, true);
    let u = &f.units[0];
    assert_eq!(u.hp_max, Some(28.6));
    assert_eq!(u.hp, 28.6, "hp > hpMax przyciete");
    assert_eq!(
        u.soft_badge_level,
        soft_path_badge_level(Some(&UnitBuildingProgress {
            pancerz_bonus_proc: None,
            parametry_bonus_proc: Some(20.0),
        }))
    );
    assert!(u.soft_badge_level >= 1, "parametryBonusProc 20 > 0");

    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            hp: Some(f64::NEG_INFINITY),
            ..PlayableReplaceUnit::default()
        },
    );
    let u = &frame_of(&state, true).units[0];
    assert_eq!(
        (u.hp, u.hp_max),
        (22.0, Some(22.0)),
        "hp nieskonczone = maxHp"
    );
}

/// R2 luka 2: `vitalsByRepId` (`computeStackDisplay(src, unitAttackScore, { maxHpOf, defOf })`,
/// `main.ts:14476-14508`; `stackVitals` `armyMerge.ts:1137-1155`). Stos dwoch wojownikow gracza:
/// hp 22 + 22, `fieldPowerM` = `sumRosterFieldM` = `round((27 + 27) * 10) / 10` (cache `fieldPower` 27,
/// `rangedDamageMultFor` = 1, `unit-power.ts` `armyFieldPower`), poziom weterana 1, 0 gwiazdek.
#[test]
fn r2_vitals_stosu_gracza() {
    let state = two_stacks_state();
    let w = wojownik();
    assert_eq!(w.field_power, 27.0);
    let f = frame_of(&state, true);
    assert_eq!(f.stacks.vitals_by_rep_id.len(), f.stacks.visible_ids.len());
    let (rep, v) = &f.stacks.vitals_by_rep_id[0];
    assert_eq!(rep.get(), WARRIOR);
    assert_eq!(
        (
            v.ruch_left,
            v.ruch_max,
            v.hp,
            v.hp_max,
            v.field_power_m,
            v.count
        ),
        (1.0, 1.0, 44.0, 44.0, 54.0, 2)
    );
    assert_eq!(
        (
            v.armor_badge_level,
            v.soft_badge_level,
            v.veteran_level,
            v.veteran_stars,
            v.has_commander
        ),
        (0, 0, 1, 0, false)
    );

    // Weteran (1 bitwa) w stosie: `veteranScaledDefFor` usuwa cache i skaluje pola x1.1
    // (`main.ts:33063-33070`, `veteran.ts:362-385`); hp stosu = 22 + 24.2; poziom 2, 1 gwiazdka.
    let mut vet = state.clone();
    vet.economy.units.insert(
        5,
        PlayableReplaceUnit {
            battles_survived: Some(1.0),
            hp: Some(10.0),
            ..PlayableReplaceUnit::default()
        },
    );
    let coeffs = UnitPowerCoeffs::from_params();
    let up = 1.1;
    let scaled = UnitPowerInput {
        melee_attack: w.melee_attack as f64 * up,
        melee_defence: w.melee_defence as f64 * up,
        weapon_damage: w.weapon_damage as f64 * up,
        piercing: w.piercing.unwrap_or(0) as f64 * up,
        armor: w.armor.unwrap_or(0) as f64,
        charge_bonus: w.charge_bonus.unwrap_or(0) as f64 * up,
        health: w.health_lc as f64 * up,
        missile_attack: w.missile_attack as f64 * up,
        typ: Some(w.typ.clone()),
        jednostka: Some(w.jednostka.clone()),
    };
    let vet_m = field_power(&scaled, &coeffs).total;
    let fv = frame_of(&vet, true);
    let (_, v) = &fv.stacks.vitals_by_rep_id[0];
    assert_eq!(v.hp_max, 22.0 + 24.2);
    assert_eq!(v.hp, 22.0 + 10.0);
    assert_eq!(v.field_power_m, ((27.0 + vet_m) * 10.0_f64).round() / 10.0);
    assert_ne!(vet_m, 27.0, "cache nie przezywa skalowania weterana");
    assert_eq!((v.veteran_level, v.veteran_stars), (2, 1));
}

/// R2 luka 2: bonus trudnosci AI (`difficultyCombatMultForOwner`, `main.ts:9506-9511`;
/// `qualifiesForMajorAiDifficultyBonus` `ai-difficulty-bonus.ts:18-23`; `applyDifficultyCombatToUnitDef`
/// `:41-60`) w `fieldPowerM` stosu AI: `Normalny` (bonusWalka 0, `mult === 1` -> def bez zmian, cache 27),
/// `Trudny` (bonusWalka poziomu 3 z `ai-params.json`: atak, obrona, pocisk x mult, cache usuniety).
#[test]
fn r2_vitals_bonus_trudnosci_ai() {
    let state = two_stacks_state();
    let w = wojownik();
    let ai_vitals = |s: &PlayableState| -> vm::StackVitalsDto {
        let f = frame_of(s, false);
        f.stacks
            .vitals_by_rep_id
            .iter()
            .find(|(id, _)| id.get() == 9)
            .map(|(_, v)| v.clone())
            .expect("stos AI")
    };
    assert_eq!(ai_vitals(&state).field_power_m, 27.0);
    let mut hard = state.clone();
    hard.params.difficulty = "Trudny".to_owned();
    let bonus = parse_ai_params()
        .expect("ai-params")
        .trudnosc_poziom3_bonus_walka
        .wartosc;
    let mult = 1.0 + bonus;
    let scaled = UnitPowerInput {
        melee_attack: w.melee_attack as f64 * mult,
        melee_defence: w.melee_defence as f64 * mult,
        weapon_damage: w.weapon_damage as f64,
        piercing: w.piercing.unwrap_or(0) as f64,
        armor: w.armor.unwrap_or(0) as f64,
        charge_bonus: w.charge_bonus.unwrap_or(0) as f64,
        health: w.health_lc as f64,
        missile_attack: w.missile_attack as f64 * mult,
        typ: Some(w.typ.clone()),
        jednostka: Some(w.jednostka.clone()),
    };
    let expected =
        (field_power(&scaled, &UnitPowerCoeffs::from_params()).total * 10.0).round() / 10.0;
    assert_ne!(expected, 27.0);
    assert_eq!(ai_vitals(&hard).field_power_m, expected);
    // Gracz glowny (web `ownerId 0`) nie dostaje bonusu: stos gracza bez zmian.
    let human = frame_of(&hard, false);
    assert_eq!(human.stacks.vitals_by_rep_id[0].1.field_power_m, 54.0);
}

// =====================================================================================================
// Obrona r2 (zarzuty Evaluatora Z1-Z3): wektory galezi adapterow r2. Wyrocznie liczone RECZNIE (Z3):
// lokalna odleglosc heksowa `axialDistance` (`map/territory.ts:57-61` @ `07d2fbd72`), promienie i progi
// jako stale z odwolaniem do pinu, oczekiwane listy heksow wypisane literalnie.
// =====================================================================================================

/// `axialDistance` (`map/territory.ts:57-61`) przepisane w tescie (nie funkcja crate'u, Z3).
fn pin_axial_distance(aq: i32, ar: i32, bq: i32, br: i32) -> i32 {
    ((aq - bq).abs() + (ar - br).abs() + ((-aq - ar) - (-bq - br)).abs()) / 2
}

/// `cityTerritoryRadius({pop: 1})` = `cityRangeForPopulation(1)` = 5 (`map/territory.ts:89-93`).
const CITY_RADIUS_POP1: i32 = 5;
/// `FORT_TERRITORY_RADIUS` (`map/territory.ts:75`).
const FORT_RADIUS: i32 = 5;
/// `MIN_CITY_DISTANCE` (`cities.ts:1117`).
const MIN_CITY_DIST: i32 = 4;

/// Stan rownin (mapa 8x5, stolica fotela glownego (1,1) pop 1) z drugim fotelem czlowieka (hotseat)
/// i jego miastem w (7,4).
fn hotseat_state() -> PlayableState {
    let mut state = plains_state(&[], &[]);
    assert_eq!(
        (state.map.width, state.map.height),
        (8, 5),
        "mapa scenariusza 8x5"
    );
    assert_eq!(
        (state.cities[0].position.x(), state.cities[0].position.y()),
        (1, 1)
    );
    state.players.push(PlayablePlayer {
        id: PlayerId::new(AI),
        name: "Fotel 2".to_owned(),
        civilization: "grecy".to_owned(),
        is_human: true,
    });
    state.cities.push(city(77, AI, 7, 4));
    state
}

/// Recznie: heksy mapy 8x5 (r-major), `d(own) in [4, 5]`, `d(inne miasto) >= 4` (`cities.ts:1163-1230`).
fn found_city_vector(own: (i32, i32), other: (i32, i32)) -> Vec<(i32, i32)> {
    let mut out = Vec::new();
    for r in 0..5 {
        for q in 0..8 {
            let d_own = pin_axial_distance(q, r, own.0, own.1);
            let d_other = pin_axial_distance(q, r, other.0, other.1);
            if (MIN_CITY_DIST..=CITY_RADIUS_POP1).contains(&d_own) && d_other >= MIN_CITY_DIST {
                out.push((q, r));
            }
        }
    }
    out
}

/// EV1 + Z1: `canFoundPlayerCityAt` dla fotela `ME()` = 2 (`main.ts:12923-12943`): `ownerId: ME()` i
/// `foundingTerritoryOpts(ME())` (`:12906-12920`) = wezly terytorium fotela 2 (miasto (7,4)), nie fotela
/// glownego. Wektor reczny: fotel 1 -> pierscien `[4, 5]` wokol (1,1); fotel 2 -> wokol (7,4).
#[test]
fn obrona_r2_ev1_zalozenie_miasta_fotela_2_wg_wlasnego_terytorium() {
    let state = hotseat_state();
    let seat1 = vec![
        (5, 0),
        (6, 0),
        (5, 1),
        (6, 1),
        (4, 2),
        (5, 2),
        (3, 3),
        (4, 3),
        (2, 4),
        (3, 4),
    ];
    let seat2 = vec![
        (6, 0),
        (7, 0),
        (5, 1),
        (6, 1),
        (4, 2),
        (5, 2),
        (3, 3),
        (4, 3),
        (2, 4),
        (3, 4),
    ];
    assert_eq!(found_city_vector((1, 1), (7, 4)), seat1);
    assert_eq!(found_city_vector((7, 4), (1, 1)), seat2);
    assert_eq!(highlight(&frame_ui(&state, HUMAN, &ui_found_city())), seat1);
    assert_eq!(highlight(&frame_ui(&state, AI, &ui_found_city())), seat2);
}

/// Z1: `ownerEra = player.era ?? 1` (`main.ts:12924`) = epoka fotela GLOWNEGO (`player`, `main.ts:13713`;
/// `reconcilePlayerEraFromResearch` z `civTypeForOwner(0)`, `:2522-2532`). Limit
/// `cityLimitBase + (era - 1) * 5` (`cities.ts:1316-1327`) na granicy: baza 1, fotel 2 ma 1 miasto -> `1 >= 1` odmowa w Kamieniu;
/// Braz (era 2) -> limit 6 -> wektor EV1. Stan `PlayableState` nie niesie epoki per wlasciciel
/// (`owner_era_facts`, `turn_war_epoch.rs:118-139`: kazdy fotel = epoka startu), wiec fotel 2 w INNEJ
/// epoce niz glowny nie jest reprezentowalny; ponizsza asercja pilnuje tego niezmiennika - gdy stan
/// dostanie epoke per fotel, test zglosi brak wektora asymetrii.
#[test]
fn obrona_r2_z1_limit_miast_fotela_2_z_epoki_fotela_glownego() {
    let mut state = hotseat_state();
    state.params.advanced.city_limit_base = 1;
    let eras = epochs_with_sources(&state, &BTreeSet::from([1_i64, 2_i64])).expect("epoki");
    assert_eq!(
        eras[&1].0, eras[&2].0,
        "stan: jedna epoka dla wszystkich foteli"
    );
    assert!(
        highlight(&frame_ui(&state, AI, &ui_found_city())).is_empty(),
        "kamien: limit 1, fotel 2 ma 1 miasto"
    );
    assert!(highlight(&frame_ui(&state, HUMAN, &ui_found_city())).is_empty());
    state.params.epoch_id = "braz".to_owned();
    assert_eq!(
        highlight(&frame_ui(&state, AI, &ui_found_city())),
        found_city_vector((7, 4), (1, 1)),
        "braz: limit 1 + 5 = 6"
    );
}

/// EV3: `gameConfig: { cityLimitBase: _menuCityLimitBase }` (`main.ts:12933`, `:44445`); bez bazy
/// `cityLimitBase ?? 10` (`cities.ts:1319`). Baza 1 przy 1 miescie = odmowa, baza 2 = wektor reczny.
#[test]
fn obrona_r2_ev3_limit_miast_z_city_limit_base() {
    let mut state = plains_state(&[], &[]);
    state.params.advanced.city_limit_base = 1;
    assert!(highlight(&frame_ui(&state, HUMAN, &ui_found_city())).is_empty());
    state.params.advanced.city_limit_base = 2;
    let expected: Vec<(i32, i32)> = found_city_vector((1, 1), (1, 1));
    assert_eq!(
        highlight(&frame_ui(&state, HUMAN, &ui_found_city())),
        expected
    );
}

/// EV2: `withinTerritory = isInTerritory(..) && !isHexInForeignFortTerritory(q, r, ME(), fortNodes,
/// buildAllTerritoryNodes())` (`main.ts:12917-12918`, `fort-territory.ts:158-173`). Miasto fotela 2 w
/// (7,4) i jego fort w (5,3) (promien 5, `territory.ts:75`). Heksy pierscienia stolicy, ktorych wlascicielem
/// jest miasto fotela 2 (`territoryOwnerAt`: blizsze miasto, `d(7,4) = 4 < d(1,1) = 5`): (6,1), (5,2),
/// (4,3), (3,4) - w zasiegu obcego fortu -> odrzucone. Reszta (wlasciciel = stolica) zostaje.
#[test]
fn obrona_r2_ev2_obcy_fort_wyklucza_heksy_obcego_terytorium() {
    let mut state = hotseat_state();
    let before = highlight(&frame_ui(&state, HUMAN, &ui_found_city()));
    assert_eq!(before, found_city_vector((1, 1), (7, 4)));
    state.forts.push(PlayableFort {
        q: 5,
        r: 3,
        owner_id: PlayerId::new(AI),
        kind: PlayableFortKind::Fort,
        contested_useless: None,
        built_at_turn: None,
        seq: None,
    });
    let foreign = [(6, 1), (5, 2), (4, 3), (3, 4)];
    for &(q, r) in &foreign {
        assert!(pin_axial_distance(q, r, 7, 4) < pin_axial_distance(q, r, 1, 1));
        assert!(pin_axial_distance(q, r, 5, 3) <= FORT_RADIUS);
    }
    let expected: Vec<(i32, i32)> = before
        .iter()
        .copied()
        .filter(|h| !foreign.contains(h))
        .collect();
    assert_eq!(
        expected,
        vec![(5, 0), (6, 0), (5, 1), (4, 2), (3, 3), (2, 4)]
    );
    assert_eq!(
        highlight(&frame_ui(&state, HUMAN, &ui_found_city())),
        expected
    );
    // `f.contestedUseless` (`fort-territory.ts:167`): fort bezuzyteczny nie wyklucza.
    state.forts[0].contested_useless = Some(true);
    assert_eq!(
        highlight(&frame_ui(&state, HUMAN, &ui_found_city())),
        before
    );
}

/// Stos jednej jednostki gracza (wojownik scenariusza, (2,1)) z faktami ekonomii.
fn single_vitals(state: &PlayableState) -> vm::StackVitalsDto {
    let f = frame_of(state, true);
    assert_eq!(f.stacks.vitals_by_rep_id.len(), 1);
    f.stacks.vitals_by_rep_id[0].1.clone()
}

/// EV4: `isFieldBattleUnit` (`auto-battle-power.ts:37-43`): `BATTLE_EXCLUDED_TYPES = {Zwiadowca,
/// Osadnik}` poza `fieldPowerM` mimo `armyFieldPower > 0`. Stos Wojownik (cache `fieldPower` 27) +
/// Zwiadowca (cache `fieldPower` 6 w `units.json`): `fieldPowerM` = 27 (nie 33); hp i liczba z obu
/// (22 + 10, `count` 2). `Osadnik` nie ma wpisu w `units.json` (brak wektora; ten sam zbior w kodzie).
#[test]
fn obrona_r2_ev4_zwiadowca_poza_moca_pola_stosu() {
    let scout = parse_units()
        .expect("units.json")
        .into_iter()
        .find(|u| u.jednostka == "Zwiadowca")
        .expect("Zwiadowca");
    assert_eq!(scout.field_power, 6.0, "Zwiadowca ma niezerowa moc pola");
    let mut state = two_stacks_state();
    state.economy.units.insert(
        5,
        PlayableReplaceUnit {
            type_id: Some("Zwiadowca".to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
    let f = frame_of(&state, true);
    let (_, v) = &f.stacks.vitals_by_rep_id[0];
    assert_eq!((v.count, v.hp, v.hp_max), (2, 32.0, 32.0));
    assert_eq!(v.field_power_m, 27.0, "Zwiadowca wykluczony (nie 27 + 6)");
}

/// EV5: `aiDiffLevelForOwner` (`main.ts:9517-9520`): `'easy' -> 1` (menu `Łatwy`). `bonusWalka` poziomu 1 =
/// -0.05 (`ai-params.json` `trudnosc_poziom1_bonus_walka`), wiec `mult = 0.95` != 1: atak, obrona, pocisk
/// wojownika AI x 0.95 (`ai-difficulty-bonus.ts:41-60`) -> `fieldPowerM` 26.6 (< 27 bez kary). Poziom 2
/// (`Normalny`, bonus 0) zostawia cache 27.
#[test]
fn obrona_r2_ev5_latwy_to_poziom_1() {
    let p = parse_ai_params().expect("ai-params");
    assert_eq!(p.trudnosc_poziom1_bonus_walka.wartosc, -0.05);
    assert_eq!(p.trudnosc_poziom2_bonus_walka.wartosc, 0);
    let ai_m = |label: &str| -> f64 {
        let mut s = two_stacks_state();
        s.params.difficulty = label.to_owned();
        let f = frame_of(&s, false);
        f.stacks
            .vitals_by_rep_id
            .iter()
            .find(|(id, _)| id.get() == 9)
            .map(|(_, v)| v.field_power_m)
            .expect("stos AI")
    };
    assert_eq!(ai_m("Normalny"), 27.0);
    assert_eq!(ai_m("Łatwy"), 26.6);
    assert_eq!(ai_m("easy"), 26.6);
}

/// EV6: `u.hp = Math.max(0, Math.min(maxHp, u.hp))` (`main.ts:33115`): `hp` ujemne -> 0 w jednostce i w
/// `vitals` stosu.
#[test]
fn obrona_r2_ev6_hp_dolna_granica_zero() {
    let mut state = start_state();
    state.economy.units.insert(
        WARRIOR,
        PlayableReplaceUnit {
            hp: Some(-5.0),
            ..PlayableReplaceUnit::default()
        },
    );
    let f = frame_of(&state, true);
    assert_eq!((f.units[0].hp, f.units[0].hp_max), (0.0, Some(22.0)));
    let v = single_vitals(&state);
    assert_eq!((v.hp, v.hp_max), (0.0, 22.0));
}

/// EV7: `veteranLevelFromBattles` (`veteran.ts:106-110`): 0 -> 1, 1-2 -> 2, 3+ -> 3; gwiazdki
/// `veteranStarCount` = min(wygrane, 3) (`veteran.ts:118`).
#[test]
fn obrona_r2_ev7_progi_poziomu_weterana() {
    for (battles, level, stars) in [
        (0.0, 1, 0),
        (1.0, 2, 1),
        (2.0, 2, 2),
        (3.0, 3, 3),
        (5.0, 3, 3),
    ] {
        let mut state = start_state();
        state.economy.units.insert(
            WARRIOR,
            PlayableReplaceUnit {
                battles_survived: Some(battles),
                ..PlayableReplaceUnit::default()
            },
        );
        let v = single_vitals(&state);
        assert_eq!(
            (v.veteran_level, v.veteran_stars),
            (level, stars),
            "battlesSurvived {battles}"
        );
    }
}

/// EV10: `horseStockAvailable: citySurowceSumForOwner(0).kon ?? 0` (`main.ts:16315`) w bramce Stadniny
/// (`livestock-unlock.ts` `isLivestockUnlockedForPlacement`, R-WEB-STABLE...: od Zelaza (`era >= 3`)
/// bez zloza konia wystarczy magazyn `kon >= stadninaKosztKoni` = 50). Zelazo, magazyn stolicy 50 ->
/// rowniny terytorium podswietlone; 49 -> brak.
#[test]
fn obrona_r2_ev10_stadnina_z_magazynu_koni() {
    let mut state = plains_state(&[], &[]);
    state.params.epoch_id = "zelazo".to_owned();
    let capital = state.cities[0].id.get();
    let with_horses = |n: f64| -> Vec<(i32, i32)> {
        let mut s = state.clone();
        s.economy
            .city_stock
            .insert(capital, [("kon".to_owned(), n)].into_iter().collect());
        highlight(&frame_ui(&s, HUMAN, &ui_improvement("stadnina")))
    };
    assert!(with_horses(49.0).is_empty(), "49 < 50");
    let got = with_horses(50.0);
    assert!(!got.is_empty(), "50 >= 50");
    assert!(got.contains(&(2, 1)), "rownina w terytorium stolicy");
    assert!(got
        .iter()
        .all(|&(q, r)| pin_axial_distance(q, r, 1, 1) <= CITY_RADIUS_POP1));
    // Magazyn innego wlasciciela nie liczy sie (`citySurowceSumForOwner(0)`).
    let mut other = state.clone();
    other.players.push(ai_player());
    other.cities.push(city(77, AI, 7, 4));
    other
        .economy
        .city_stock
        .insert(77, [("kon".to_owned(), 99.0)].into_iter().collect());
    assert!(highlight(&frame_ui(&other, HUMAN, &ui_improvement("stadnina"))).is_empty());
}

/// EV11: `ownUnitHexKeys: ownUnitHexKeysForOwner(0)` (`main.ts:16319`): fort POZA wlasnym terytorium tylko
/// na heksie z wlasna jednostka (`improvement-build.ts` FORT: `ownTerritory || ownUnitHexKeys.has`).
/// Heks (7,2): `d(1,1) = 7 > 5`, poza terytorium; z jednostka gracza -> w podswietleniu, bez niej -> nie.
#[test]
fn obrona_r2_ev11_fort_poza_terytorium_przy_wlasnej_jednostce() {
    let mut state = plains_state(&[], &[]);
    assert!(pin_axial_distance(7, 2, 1, 1) > CITY_RADIUS_POP1);
    let without = highlight(&frame_ui(&state, HUMAN, &ui_improvement("fort")));
    assert!(!without.contains(&(7, 2)));
    state.units.push(PlayableUnit {
        id: UnitId::new(7),
        owner_id: PlayerId::new(HUMAN),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(7, 2),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    });
    let with = highlight(&frame_ui(&state, HUMAN, &ui_improvement("fort")));
    assert!(with.contains(&(7, 2)), "fort przy wlasnej jednostce");
    let mut rest = with.clone();
    rest.retain(|h| *h != (7, 2));
    assert_eq!(rest, without, "pozostale heksy bez zmian");
}

// R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (#408): `reveal` w ramce ------------------------------------------
//
// Pin `07d2fbd72`: `refreshFog` (`main.ts:13475-13513`) w galezi mgly (`useFogRender`, `:13485`) wola
// `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys:
// startRevealKeysForRiverFog() })` (`:13490-13494`), bez mgly `setFog(ALL_KEYS, ALL_KEYS)` BEZ opcji
// (`:13505-13506`). `startRevealKeysForRiverFog` (`:13074-13080`): `!isAwaitingFirstPlayerCity() ||
// meStartHex === null` -> `undefined`, inaczej `computeVisibleAt(start.q, start.r, map, startRevealRadius)`.

/// Stan "przed pierwszym miastem": scenariusz startowy bez miast gracza i bez wpisu w
/// `playerEverOwnedCityByOwner`; zwraca stan i heks startu (dawna stolica, web `playerStartHexFor(ME())`).
fn awaiting_state() -> (PlayableState, (i32, i32)) {
    let mut state = start_state();
    let capital = state
        .cities
        .iter()
        .find(|c| c.owner_id == PlayerId::new(HUMAN) && c.is_capital)
        .expect("stolica scenariusza");
    let start = (
        i32::from(capital.position.x()),
        i32::from(capital.position.y()),
    );
    state.cities.retain(|c| c.owner_id != PlayerId::new(HUMAN));
    state.gracz_kiedys_mial_miasto = false;
    state.player_ever_owned_city.clear();
    assert!(state.is_awaiting_first_city(PlayerId::new(HUMAN)));
    (state, start)
}

fn reveal_session(
    state: &PlayableState,
    start: Option<(i32, i32)>,
    radius: f64,
) -> PlayableFogSession {
    let mut session = PlayableFogSession::for_new_game(state);
    session.player_start_hex_by_owner.clear();
    if let Some(s) = start {
        session
            .player_start_hex_by_owner
            .insert(PlayerId::new(HUMAN), s);
    }
    session.start_reveal_radius = radius;
    session
}

fn frame_with(state: &PlayableState, session: &mut PlayableFogSession) -> RenderLayersDto {
    build_render_frame(
        state,
        session,
        PlayerId::new(HUMAN),
        &RenderUiParams::default(),
    )
    .expect("ramka")
}

/// Niezalezny od producenta `computeVisibleAt(start, radius)` (`visibility.ts:64-79`) w kolejnosci
/// kontraktu (`r`-major, `q`-minor).
fn visible_at(state: &PlayableState, start: (i32, i32), radius: f64) -> Vec<vm::HexCoord> {
    let map = civ_engine::domain::playable_movement::ruch_mapa_from_state(state);
    let mut keys: Vec<(i32, i32)> =
        civ_engine::domain::terrain::visibility::compute_visible_at(start.0, start.1, &map, radius)
            .into_iter()
            .collect();
    keys.sort_by_key(|&(q, r)| (r, q));
    keys.into_iter()
        .map(|(q, r)| vm::HexCoord::new(q, r))
        .collect()
}

fn reveal_of(keys: Option<Vec<vm::HexCoord>>) -> Option<vm::map::FogRevealDto> {
    Some(vm::map::FogRevealDto {
        reveal_all_land: false,
        river_reveal_keys: keys,
    })
}

/// Kryterium 2a: przed pierwszym miastem ramka niesie klucze kregu startu = `computeVisibleAt(start,
/// radius)`; granica promienia: inny promien daje inne klucze (mutant promienia ginie).
#[test]
fn r403a_przed_pierwszym_miastem_ramka_niesie_krag_startu() {
    let (state, start) = awaiting_state();
    for radius in [2.0, 3.0, 8.0] {
        let mut session = reveal_session(&state, Some(start), radius);
        let f = frame_with(&state, &mut session);
        assert!(f.viewer.fog_active);
        let expected = visible_at(&state, start, radius);
        assert!(!expected.is_empty());
        assert_eq!(f.reveal, reveal_of(Some(expected)), "promien {radius}");
    }
    // Granica promienia rozroznia kregi (krag 2 jest scisle mniejszy od kregu 3).
    let r2 = visible_at(&state, start, 2.0);
    let r3 = visible_at(&state, start, 3.0);
    assert!(r2.len() < r3.len(), "{} < {}", r2.len(), r3.len());
    assert!(r2.iter().all(|h| r3.contains(h)));
    // Klucze to heksy mapy (kontrakt `FogRevealDto`).
    let m = render_map(&state).expect("mapa");
    let mut session = reveal_session(&state, Some(start), 3.0);
    let keys = frame_with(&state, &mut session)
        .reveal
        .and_then(|r| r.river_reveal_keys)
        .expect("klucze");
    assert!(keys.iter().all(|k| m.hexes.iter().any(|h| h.coord == *k)));
}

/// Kryterium 2b: po zalozeniu miasta (lub wpisie w `playerEverOwnedCityByOwner`) i bez heksu startu ->
/// `riverRevealKeys = undefined` (`None`); opcje nadal sa (galaz mgly) -> `Some({false, None})`.
#[test]
fn r403a_po_miescie_lub_bez_startu_brak_kluczy() {
    let (state, start) = awaiting_state();
    // Miasto gracza (zalozenie, `main.ts:16508`): miasto wygrywa ze startem.
    let mut founded = state.clone();
    founded.cities.push(city(55, HUMAN, 1, 1));
    founded.record_ever_owned_city(PlayerId::new(HUMAN));
    let mut session = reveal_session(&founded, Some(start), 3.0);
    assert_eq!(frame_with(&founded, &mut session).reveal, reveal_of(None));
    // Samo miasto (bez wpisu w zbiorze) - `computeAwaitingFirstPlayerCity` widzi miasto.
    let mut city_only = state.clone();
    city_only.cities.push(city(56, HUMAN, 1, 1));
    let mut session = reveal_session(&city_only, Some(start), 3.0);
    assert_eq!(frame_with(&city_only, &mut session).reveal, reveal_of(None));
    // Sam wpis w zbiorze (miasto utracone) - nadal nie czeka.
    let mut ever = state.clone();
    ever.record_ever_owned_city(PlayerId::new(HUMAN));
    let mut session = reveal_session(&ever, Some(start), 3.0);
    assert_eq!(frame_with(&ever, &mut session).reveal, reveal_of(None));
    // Bez heksu startu (`meStartHex === null`).
    let mut session = reveal_session(&state, None, 3.0);
    assert_eq!(frame_with(&state, &mut session).reveal, reveal_of(None));
    // Scenariusz startowy (stolica) = po pierwszym miescie.
    let st = start_state();
    let mut session = PlayableFogSession::for_new_game(&st);
    assert_eq!(frame_with(&st, &mut session).reveal, reveal_of(None));
}

/// Kryterium 2c: `fogOn = false` -> `setFog(ALL_KEYS, ALL_KEYS)` bez opcji -> `reveal = None`, nawet gdy
/// fotel czeka na pierwsze miasto (D-403A-2).
#[test]
fn r403a_bez_mgly_ramka_bez_opcji() {
    let (state, start) = awaiting_state();
    let mut session = reveal_session(&state, Some(start), 3.0);
    session.fog_on = false;
    let f = frame_with(&state, &mut session);
    assert!(!f.viewer.fog_active);
    assert_eq!(f.reveal, None);
    assert_eq!(frame_of(&start_state(), false).reveal, None);
    assert_eq!(frame_of(&start_state(), true).reveal, reveal_of(None));
}

/// Kryterium 4: `reveal = None` -> brak klucza w JSON (ramka jak przed zmiana: 14 kluczy); `Some` ->
/// klucz `reveal` camelCase; odczyt JSON bez klucza daje `None` (addytywnie, `CONTRACT_VERSION` mostu 1).
#[test]
fn r403a_json_ramki_addytywny() {
    let old_keys: BTreeSet<&str> = [
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
    ]
    .into_iter()
    .collect();
    let off = frame_of(&start_state(), false);
    let v = serde_json::to_value(&off).expect("json");
    let keys: BTreeSet<&str> = v
        .as_object()
        .expect("obiekt")
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(keys, old_keys, "reveal = None nie zmienia JSON ramki");
    let back: RenderLayersDto = serde_json::from_value(v).expect("odczyt");
    assert_eq!(back, off);

    let (state, start) = awaiting_state();
    let mut session = reveal_session(&state, Some(start), 2.0);
    let on = frame_with(&state, &mut session);
    let v = serde_json::to_value(&on).expect("json");
    assert_eq!(v["reveal"]["revealAllLand"], json!(false));
    assert!(v["reveal"]["riverRevealKeys"]
        .as_array()
        .is_some_and(|a| !a.is_empty()));
    let back: RenderLayersDto = serde_json::from_value(v.clone()).expect("odczyt");
    assert_eq!(back, on);
    let mut without = v;
    without.as_object_mut().expect("obiekt").remove("reveal");
    let back: RenderLayersDto = serde_json::from_value(without).expect("bez klucza");
    assert_eq!(back.reveal, None);
    assert_eq!(CONTRACT_VERSION, 1);
}

/// Most: `GetRenderFrame` na scenariuszu startowym (stolica, mgla ON) niesie opcje bez kluczy.
#[test]
fn r403a_most_get_render_frame_niesie_reveal() {
    let mut bridge = session_bridge();
    let d = bridge
        .handle(BridgeRequest::new("f", frame_cmd(None, None)))
        .expect("frame");
    let v: Value = serde_json::to_value(&d.response).expect("json");
    assert_eq!(
        v["result"]["frame"]["reveal"],
        json!({"revealAllLand": false, "riverRevealKeys": null})
    );
}
