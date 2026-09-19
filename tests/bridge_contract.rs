#![allow(dead_code)]

#[path = "../rust-port/engine/src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge,
    EngineCommand, MockEngineAdapter, CONTRACT_VERSION, EVENT_STATE_CHANGED, TAURI_COMMAND,
};
use serde_json::json;

const TAURI_SHELL: &str = include_str!("../src-tauri/src/lib.rs");

fn state_from(result: &BridgeResult) -> &bridge::EngineState {
    match result {
        BridgeResult::State { state } => state,
    }
}

#[test]
fn request_and_response_use_the_versioned_frontend_shape() {
    let request = BridgeRequest::new(
        "req-1",
        EngineCommand::AddPlayer {
            id: 7,
            name: "Ada".to_owned(),
        },
    );
    let encoded = serde_json::to_value(&request).expect("request serializes");
    assert_eq!(
        encoded,
        json!({
            "contractVersion": CONTRACT_VERSION,
            "requestId": "req-1",
            "command": {"kind": "add_player", "id": 7, "name": "Ada"}
        })
    );

    let decoded: BridgeRequest = serde_json::from_value(encoded).expect("request deserializes");
    assert_eq!(decoded, request);
}

#[test]
fn bridge_invokes_mock_adapter_and_emits_only_for_mutations() {
    let mut bridge = EngineBridge::new(MockEngineAdapter::default());

    let add = bridge
        .handle(BridgeRequest::new(
            "add-1",
            EngineCommand::AddPlayer {
                id: 1,
                name: "Player One".to_owned(),
            },
        ))
        .expect("add player succeeds");
    assert_eq!(add.response.request_id, "add-1");
    assert_eq!(state_from(&add.response.result).players[0].id, 1);
    assert_eq!(add.events.len(), 1);
    assert_eq!(add.events[0].channel(), EVENT_STATE_CHANGED);
    assert!(matches!(
        add.events[0],
        BridgeEvent::StateChanged { ref request_id, .. } if request_id == "add-1"
    ));
    let event_json = serde_json::to_value(&add.events[0]).expect("event serializes");
    assert_eq!(
        event_json,
        json!({
            "kind": "state_changed",
            "contractVersion": CONTRACT_VERSION,
            "requestId": "add-1",
            "state": {
                "turn": 1,
                "players": [{"id": 1, "name": "Player One"}]
            }
        })
    );
    let decoded_event: BridgeEvent =
        serde_json::from_value(event_json).expect("event deserializes");
    assert_eq!(decoded_event, add.events[0]);

    let read = bridge
        .handle(BridgeRequest::new("read-1", EngineCommand::GetState))
        .expect("read state succeeds");
    assert_eq!(state_from(&read.response.result).players.len(), 1);
    assert!(read.events.is_empty());
    assert_eq!(
        bridge.adapter().calls(),
        &[
            EngineCommand::AddPlayer {
                id: 1,
                name: "Player One".to_owned()
            },
            EngineCommand::GetState
        ]
    );
}

#[test]
fn real_engine_adapter_maps_domain_state_and_rejections() {
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());

    let created = bridge
        .handle(BridgeRequest::new("create-1", EngineCommand::CreateSession))
        .expect("create session succeeds");
    assert_eq!(state_from(&created.response.result).turn, 1);

    let added = bridge
        .handle(BridgeRequest::new(
            "add-1",
            EngineCommand::AddPlayer {
                id: 42,
                name: "Ada".to_owned(),
            },
        ))
        .expect("add player succeeds");
    assert_eq!(state_from(&added.response.result).players[0].name, "Ada");

    let advanced = bridge
        .handle(BridgeRequest::new("advance-1", EngineCommand::AdvanceTurn))
        .expect("advance turn succeeds");
    assert_eq!(state_from(&advanced.response.result).turn, 2);

    let duplicate = bridge.handle(BridgeRequest::new(
        "add-duplicate",
        EngineCommand::AddPlayer {
            id: 42,
            name: "Ada II".to_owned(),
        },
    ));
    let error = duplicate.expect_err("duplicate player is rejected");
    assert_eq!(error.code, BridgeErrorCode::EngineRejected);
    assert!(error.message.contains("already exists"));
}

#[test]
fn invalid_request_is_rejected_before_the_adapter_runs() {
    let mut bridge = EngineBridge::new(MockEngineAdapter::default());
    let mut request = BridgeRequest::new("req-1", EngineCommand::GetState);
    request.contract_version = CONTRACT_VERSION + 1;

    let error = bridge
        .handle(request)
        .expect_err("version mismatch is rejected");
    assert_eq!(error.code, BridgeErrorCode::UnsupportedVersion);
    assert!(bridge.adapter().calls().is_empty());

    let error = bridge
        .handle(BridgeRequest::new("  ", EngineCommand::GetState))
        .expect_err("blank request id is rejected");
    assert_eq!(error.code, BridgeErrorCode::InvalidRequest);
    assert!(bridge.adapter().calls().is_empty());
}

#[test]
fn tauri_shell_wires_the_same_command_and_event_contract() {
    assert!(TAURI_SHELL.contains("#[tauri::command]"));
    assert!(TAURI_SHELL.contains("fn engine_command"));
    assert!(!TAURI_SHELL.contains("pub fn engine_command"));
    assert!(TAURI_SHELL.contains("generate_handler![engine_command]"));
    assert!(TAURI_SHELL.contains("event.channel()"));
    assert!(TAURI_SHELL.contains("app.emit("));
    assert!(TAURI_SHELL.contains(TAURI_COMMAND));
    assert!(TAURI_SHELL.contains(EVENT_STATE_CHANGED));
}
