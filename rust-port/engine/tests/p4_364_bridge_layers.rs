//! R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 (#364, czesc 2): komenda mostu `GetRenderLayers`.
//!
//! Decyzje orkiestratora D-364-2: komenda addytywna (`CONTRACT_VERSION` = 1), odpowiedz
//! `BridgeResult::RenderLayers { layers }`, bez zdarzenia `StateChanged`; eksploracja fotela kumuluje
//! sie w sesji jak web `refreshFog()` (`main.ts:13475-13513` @ `07d2fbd72`) i nie wchodzi do
//! `EngineState`.

#[path = "../src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use std::collections::BTreeSet;

use bridge::{
    BridgeErrorCode, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge, EngineCommand,
    EnginePort, MockEngineAdapter, RenderLayersPayload, StartGameParams, CONTRACT_VERSION,
};
use civ_engine::domain::dto_bridge::{build_view_layers, fog_inputs_of};
use civ_engine::domain::playable::PlayableFogSession;
use civ_engine::{PlayableState, PlayerId, PositionDto};
use civ_view_model::FogState;
use serde_json::{json, Value};

const HUMAN: u64 = 1;
const AI: u64 = 2;

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

fn layers_cmd(seat: Option<u64>) -> EngineCommand {
    EngineCommand::GetRenderLayers { seat }
}

/// Wysyla `GetRenderLayers`, sprawdza brak zdarzen i zwraca warstwy.
fn query(bridge: &mut EngineBridge<CivEngineAdapter>, seat: Option<u64>) -> RenderLayersPayload {
    let dispatch = bridge
        .handle(BridgeRequest::new("layers", layers_cmd(seat)))
        .expect("zapytanie warstw");
    assert!(
        dispatch.events.is_empty(),
        "GetRenderLayers nie emituje StateChanged: {:?}",
        dispatch.events.len()
    );
    assert_eq!(dispatch.response.contract_version, CONTRACT_VERSION);
    match dispatch.response.result {
        BridgeResult::RenderLayers { layers } => layers,
        BridgeResult::State { .. } => panic!("GetRenderLayers musi zwrocic RenderLayers"),
    }
}

/// Oczekiwane warstwy z `dto_bridge` na tym samym stanie i podanej eksploracji (bez mostu).
fn expected_layers(
    state: &PlayableState,
    seat: u64,
    explored: &civ_engine::domain::terrain::visibility::fog_view::ExploredByHuman,
) -> RenderLayersPayload {
    let session = PlayableFogSession::for_new_game(state);
    let mut explored = explored.clone();
    explored.entry(PlayerId::new(seat)).or_default();
    let ever = state.player_ever_owned_city_by_owner();
    build_view_layers(
        state,
        &fog_inputs_of(&session, PlayerId::new(seat)),
        &ever,
        &mut explored,
    )
    .expect("warstwy dto_bridge")
    .into()
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

// (a) komenda = dto_bridge na tym samym stanie -----------------------------------------------------

#[test]
fn komenda_zwraca_warstwy_zgodne_z_dto_bridge() {
    let mut bridge = session_bridge();
    let state = bridge.adapter().state().clone();
    let explored_before = bridge.adapter().fog_session().explored_by_human.clone();
    let expected = expected_layers(&state, HUMAN, &explored_before);
    let got = query(&mut bridge, None);
    assert_eq!(got, expected);
    assert!(got.fog_active, "web fogOn = true po nowej grze");
    assert!(!got.reveal.reveal_all_land, "web revealAllLand = false");
    assert_eq!(
        got.fog.state.len(),
        state.map.tiles.len(),
        "FogViewDto rownolegle do map.hexes"
    );
    assert!(
        !got.territory.by_owner.is_empty(),
        "stolica gracza daje zasieg terytorium"
    );
    // Jawny fotel glowny = domyslny.
    let explicit = query(&mut bridge, Some(HUMAN));
    let expected_again = expected_layers(
        bridge.adapter().state(),
        HUMAN,
        &bridge.adapter().fog_session().explored_by_human,
    );
    assert_eq!(explicit, expected_again);
}

#[test]
fn stan_mgly_sesji_wg_pinu_po_nowej_grze() {
    let bridge = session_bridge();
    let fog = bridge.adapter().fog_session();
    assert_eq!(fog.active_seat, PlayerId::new(HUMAN));
    assert!(fog.fog_on);
    assert!(!fog.reveal_all_land);
    // `startRevealRadiusForDifficulty('normal')` = 8 (`startScoring.ts:17-23`).
    assert_eq!(fog.start_reveal_radius, 8.0);
    assert_eq!(
        fog.explored_by_human.get(&PlayerId::new(HUMAN)),
        Some(&BTreeSet::new()),
        "seedStartingFog: explored.clear()"
    );
    let capital = bridge
        .adapter()
        .state()
        .cities
        .iter()
        .find(|c| c.is_capital && c.owner_id == PlayerId::new(HUMAN))
        .expect("stolica");
    let (x, y) = (capital.position.x(), capital.position.y());
    assert_eq!(
        fog.player_start_hex_by_owner.get(&PlayerId::new(HUMAN)),
        Some(&(i32::from(x), i32::from(y)))
    );
}

#[test]
fn promien_startu_z_trudnosci_wg_pinu() {
    for (label, radius) in [
        ("Łatwy", 10.0),
        ("Normalny", 8.0),
        ("Trudny", 5.0),
        ("easy", 10.0),
        ("hard", 5.0),
    ] {
        let mut bridge = EngineBridge::new(CivEngineAdapter::default());
        bridge
            .handle(BridgeRequest::new(
                "create",
                EngineCommand::CreateSession {
                    params: StartGameParams {
                        difficulty: label.to_owned(),
                        ..StartGameParams::default()
                    },
                },
            ))
            .expect("sesja");
        assert_eq!(
            bridge.adapter().fog_session().start_reveal_radius,
            radius,
            "{label}"
        );
    }
}

// (b) fotel -------------------------------------------------------------------------------------------

#[test]
fn fotel_2_daje_inna_mgle_niz_domyslny() {
    let mut bridge = session_bridge();
    add_ai(&mut bridge);
    let default = query(&mut bridge, None);
    let seat2 = query(&mut bridge, Some(AI));
    assert_ne!(default.fog, seat2.fog, "mgla zalezy od fotela");
    assert_ne!(
        default.territory, seat2.territory,
        "filtr terytorium zalezy od fotela"
    );
    let expected = expected_layers(bridge.adapter().state(), AI, &Default::default());
    assert_eq!(seat2, expected);
    // Fotel 2 bez jednostek i miast nic nie widzi, wiec nic nie odkrywa.
    assert!(seat2.fog.state.iter().all(|s| *s == FogState::Unexplored));
    // Wybor fotela dotyczy tylko zapytania: aktywny fotel sesji bez zmian.
    let fog = bridge.adapter().fog_session();
    assert_eq!(fog.active_seat, PlayerId::new(HUMAN));
    assert!(
        fog.explored_by_human.contains_key(&PlayerId::new(AI)),
        "switchActiveHuman KROK 0: pusty wpis fotela (main.ts:13902)"
    );
}

#[test]
fn nieznany_fotel_jest_odrzucony_bez_zmiany_stanu() {
    let mut bridge = session_bridge();
    let before = bridge.adapter().state().clone();
    let explored = bridge.adapter().fog_session().explored_by_human.clone();
    let err = bridge
        .handle(BridgeRequest::new("x", layers_cmd(Some(99))))
        .expect_err("fotel 99 nie istnieje");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    assert_eq!(bridge.adapter().state(), &before);
    assert_eq!(bridge.adapter().fog_session().explored_by_human, explored);
}

// (c) idempotencja i kumulacja eksploracji ---------------------------------------------------------

#[test]
fn dwa_wywolania_daja_ten_sam_wynik_i_nie_zmieniaja_stanu_gry() {
    let mut bridge = session_bridge();
    let state_before = serde_json::to_value(bridge.adapter().state()).expect("stan");
    let first = query(&mut bridge, None);
    let second = query(&mut bridge, None);
    assert_eq!(first, second, "zapytanie idempotentne co do wyniku");
    assert_eq!(
        serde_json::to_value(bridge.adapter().state()).expect("stan"),
        state_before,
        "EngineState bez zmian (eksploracja poza stanem)"
    );
}

#[test]
fn zapytanie_kumuluje_eksploracje_w_sesji() {
    let mut bridge = session_bridge();
    let seat = PlayerId::new(HUMAN);
    assert!(bridge.adapter().fog_session().explored_by_human[&seat].is_empty());
    let first = query(&mut bridge, None);
    let explored = bridge.adapter().fog_session().explored_by_human[&seat].clone();
    assert!(
        !explored.is_empty(),
        "refreshFog -> addExplored(exploredByHuman.get(ME()), vis)"
    );
    let visible_count = first
        .fog
        .state
        .iter()
        .filter(|s| **s == FogState::Visible)
        .count();
    assert_eq!(
        explored.len(),
        visible_count,
        "eksploracja = widoczne heksy"
    );

    // Kolejne zapytanie po ruchu: eksploracja tylko rosnie, a heksy raz widziane zostaja co najmniej
    // odkryte.
    bridge
        .handle(BridgeRequest::new(
            "select",
            EngineCommand::SelectUnit { unit_id: 1 },
        ))
        .expect("wybor jednostki");
    bridge
        .handle(BridgeRequest::new(
            "move",
            EngineCommand::MoveUnit {
                unit_id: 1,
                destination: PositionDto::new(3, 1),
                attack_unit_id: None,
            },
        ))
        .expect("ruch");
    let second = query(&mut bridge, None);
    let explored_after = bridge.adapter().fog_session().explored_by_human[&seat].clone();
    assert!(
        explored_after.is_superset(&explored),
        "eksploracja nie cofa sie"
    );
    for (before, after) in first.fog.state.iter().zip(&second.fog.state) {
        if *before != FogState::Unexplored {
            assert_ne!(
                *after,
                FogState::Unexplored,
                "odkryty heks nie wraca do mgly"
            );
        }
    }
    let cumulative = expected_layers(bridge.adapter().state(), HUMAN, &{
        let mut m = civ_engine::domain::terrain::visibility::fog_view::ExploredByHuman::new();
        m.insert(seat, explored.clone());
        m
    });
    assert_eq!(
        second, cumulative,
        "druga odpowiedz liczona na eksploracji z pierwszej"
    );
}

// (d) istniejace ksztalty JSON i wersja kontraktu ----------------------------------------------------

#[test]
fn stare_zadania_get_state_i_move_unit_bez_zmian() {
    assert_eq!(
        CONTRACT_VERSION, 1,
        "zmiana addytywna: wersja kontraktu = 1"
    );
    let get_state: BridgeRequest = serde_json::from_value(json!({
        "contractVersion": 1,
        "requestId": "r1",
        "command": {"kind": "get_state"}
    }))
    .expect("stare get_state");
    assert_eq!(get_state.command, EngineCommand::GetState);
    let move_unit: BridgeRequest = serde_json::from_value(json!({
        "contractVersion": 1,
        "requestId": "r2",
        "command": {"kind": "move_unit", "unit_id": 1, "destination": {"x": 3, "y": 1}}
    }))
    .expect("stare move_unit");
    assert_eq!(
        move_unit.command,
        EngineCommand::MoveUnit {
            unit_id: 1,
            destination: PositionDto::new(3, 1),
            attack_unit_id: None,
        }
    );
    assert_eq!(
        serde_json::to_value(&get_state).expect("ser"),
        json!({"contractVersion": 1, "requestId": "r1", "command": {"kind": "get_state"}})
    );
    assert_eq!(
        serde_json::to_value(EngineCommand::MoveUnit {
            unit_id: 1,
            destination: PositionDto::new(3, 1),
            attack_unit_id: None,
        })
        .expect("ser"),
        json!({"kind": "move_unit", "unit_id": 1, "destination": {"x": 3, "y": 1}})
    );
    // GetState nadal zwraca stan bez zdarzen, MoveUnit nadal emituje StateChanged.
    let mut bridge = session_bridge();
    bridge
        .handle(BridgeRequest::new(
            "select",
            EngineCommand::SelectUnit { unit_id: 1 },
        ))
        .expect("wybor jednostki");
    let d = bridge.handle(get_state).expect("get_state");
    assert!(d.events.is_empty());
    assert!(matches!(d.response.result, BridgeResult::State { .. }));
    let d = bridge.handle(move_unit).expect("move_unit");
    assert_eq!(d.events.len(), 1);
    assert!(matches!(d.response.result, BridgeResult::State { .. }));
}

#[test]
fn get_render_layers_wymaga_wersji_1() {
    let mut bridge = session_bridge();
    let mut request = BridgeRequest::new("v", layers_cmd(None));
    request.contract_version = 2;
    let err = bridge.handle(request).expect_err("wersja 2 odrzucona");
    assert_eq!(err.code, BridgeErrorCode::UnsupportedVersion);
    let ok: BridgeRequest = serde_json::from_value(json!({
        "contractVersion": 1,
        "requestId": "v1",
        "command": {"kind": "get_render_layers"}
    }))
    .expect("get_render_layers bez seat");
    assert_eq!(ok.command, layers_cmd(None));
    bridge.handle(ok).expect("wersja 1 przyjeta");
}

// (e) serializacja odpowiedzi --------------------------------------------------------------------------

#[test]
fn komenda_i_odpowiedz_serializuja_sie_camel_case() {
    assert_eq!(
        serde_json::to_value(layers_cmd(None)).expect("ser"),
        json!({"kind": "get_render_layers"})
    );
    assert_eq!(
        serde_json::to_value(layers_cmd(Some(2))).expect("ser"),
        json!({"kind": "get_render_layers", "seat": 2})
    );
    let back: EngineCommand =
        serde_json::from_value(json!({"kind": "get_render_layers", "seat": 2})).expect("de");
    assert_eq!(back, layers_cmd(Some(2)));

    let mut bridge = session_bridge();
    let dispatch = bridge
        .handle(BridgeRequest::new("ser", layers_cmd(None)))
        .expect("warstwy");
    let value = serde_json::to_value(&dispatch.response).expect("ser odpowiedzi");
    assert_eq!(value["contractVersion"], json!(1));
    assert_eq!(value["requestId"], json!("ser"));
    let result = &value["result"];
    assert_eq!(result["kind"], json!("render_layers"));
    let layers = result["layers"].as_object().expect("layers");
    let keys: BTreeSet<&str> = layers.keys().map(String::as_str).collect();
    assert_eq!(
        keys,
        BTreeSet::from(["fog", "fogActive", "reveal", "territory"])
    );
    assert_eq!(layers["fogActive"], Value::Bool(true));
    let reveal = layers["reveal"].as_object().expect("reveal");
    assert!(reveal.contains_key("revealAllLand"));
    assert!(reveal.contains_key("riverRevealKeys"));
    assert!(layers["territory"].get("byOwner").is_some());
    // Round-trip odpowiedzi.
    let back: bridge::BridgeResponse = serde_json::from_value(value).expect("de odpowiedzi");
    assert_eq!(back, dispatch.response);
}

// adaptery bez sesji mgly ------------------------------------------------------------------------------

#[test]
fn mock_adapter_odrzuca_zapytanie_warstw() {
    let mut adapter = MockEngineAdapter::default();
    let err = adapter
        .render_layers(None)
        .expect_err("mock bez mgly sesji");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
    let mut bridge = EngineBridge::new(MockEngineAdapter::default());
    let err = bridge
        .handle(BridgeRequest::new("m", layers_cmd(None)))
        .expect_err("most z mockiem odrzuca");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
}

// bezposrednia sciezka portu (poza EngineBridge::handle) ---------------------------------------------

#[test]
fn execute_get_render_layers_bezposrednio_kumuluje_i_zwraca_niezmieniony_stan() {
    let mut adapter = CivEngineAdapter::default();
    adapter
        .execute(EngineCommand::CreateSession {
            params: StartGameParams::default(),
        })
        .expect("sesja startuje");
    let seat = PlayerId::new(HUMAN);
    let state_before = serde_json::to_value(adapter.state()).expect("stan");
    assert!(adapter.fog_session().explored_by_human[&seat].is_empty());

    let returned = adapter
        .execute(layers_cmd(None))
        .expect("execute(GetRenderLayers) przez port");
    assert_eq!(
        serde_json::to_value(&returned).expect("zwrocony stan"),
        state_before,
        "execute zwraca niezmieniony EngineState"
    );
    assert_eq!(
        serde_json::to_value(adapter.state()).expect("stan"),
        state_before,
        "EngineState bez zmian"
    );
    let explored = adapter.fog_session().explored_by_human[&seat].clone();
    assert!(
        !explored.is_empty(),
        "execute(GetRenderLayers) kumuluje eksploracje jak render_layers"
    );

    // Ta sama sciezka co render_layers: kolejne zapytanie przez port widzi te sama eksploracje.
    let via_port = adapter.render_layers(None).expect("render_layers");
    let expected = expected_layers(adapter.state(), HUMAN, &{
        let mut m = civ_engine::domain::terrain::visibility::fog_view::ExploredByHuman::new();
        m.insert(seat, explored.clone());
        m
    });
    assert_eq!(via_port, expected);

    let err = adapter
        .execute(layers_cmd(Some(999)))
        .expect_err("nieznany fotel odrzucony takze przez execute");
    assert_eq!(err.code, BridgeErrorCode::EngineRejected);
}
