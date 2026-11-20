//! R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT (= #374, D-371-6): kontrakt powloki Tauri
//! (`src-tauri/src/lib.rs`) i mostu (`engine/src/bridge.rs`), przeniesiony z root
//! `tests/bridge_contract.rs` (niekompilowanego przez zaden manifest ani CI) do testow engine.
//! Dopasowania `match` w `command_kind` i `result_kind` sa WYCZERPUJACE bez `_ =>`: nowy wariant
//! `EngineCommand` lub `BridgeResult` bez ramienia tutaj lamie kompilacje tego testu (cel D-371-6).

#![allow(dead_code)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge,
    EngineCommand, MockEngineAdapter, StartGameParams, CONTRACT_VERSION, EVENT_STATE_CHANGED,
    TAURI_COMMAND,
};
use serde_json::json;

const TAURI_SHELL: &str = include_str!("../../../src-tauri/src/lib.rs");

fn state_from(result: &BridgeResult) -> &bridge::EngineState {
    match result {
        BridgeResult::State { state } => state,
        BridgeResult::RenderLayers { .. } => panic!("expected State, got RenderLayers"),
        BridgeResult::RenderMap { .. } => panic!("expected State, got RenderMap"),
        BridgeResult::RenderFrame { .. } => panic!("expected State, got RenderFrame"),
    }
}

/// Wire `kind` of every `EngineCommand` variant, indexed by [`command_index`].
/// `COMMAND_KINDS.len()` is the declared number of variants: a new variant needs a new arm in
/// `command_index` (compile error otherwise), a new entry here and a new sample in `every_command`
/// (the completeness test fails otherwise).
const COMMAND_KINDS: [&str; 16] = [
    "create_session",
    "add_player",
    "select_unit",
    "move_unit",
    "cancel_planned_march",
    "advance_turn",
    "get_state",
    "declare_war",
    "get_render_layers",
    "get_render_map",
    "get_render_frame",
    "start_siege_storm",
    "step_siege_battle",
    "skip_siege_battle",
    "finish_siege_battle",
    "abort_siege_battle",
];

/// Position of every `EngineCommand` variant in [`COMMAND_KINDS`]. Exhaustive on purpose (no
/// `_ =>`): a new command without an arm here is a compile error of this contract test.
fn command_index(command: &EngineCommand) -> usize {
    match command {
        EngineCommand::CreateSession { .. } => 0,
        EngineCommand::AddPlayer { .. } => 1,
        EngineCommand::SelectUnit { .. } => 2,
        EngineCommand::MoveUnit { .. } => 3,
        EngineCommand::CancelPlannedMarch { .. } => 4,
        EngineCommand::AdvanceTurn => 5,
        EngineCommand::GetState => 6,
        EngineCommand::DeclareWar { .. } => 7,
        EngineCommand::GetRenderLayers { .. } => 8,
        EngineCommand::GetRenderMap => 9,
        EngineCommand::GetRenderFrame { .. } => 10,
        EngineCommand::StartSiegeStorm { .. } => 11,
        EngineCommand::StepSiegeBattle { .. } => 12,
        EngineCommand::SkipSiegeBattle => 13,
        EngineCommand::FinishSiegeBattle => 14,
        EngineCommand::AbortSiegeBattle => 15,
    }
}

/// Wire `kind` of a command (via the exhaustive [`command_index`]).
fn command_kind(command: &EngineCommand) -> &'static str {
    COMMAND_KINDS[command_index(command)]
}

/// Name of every `BridgeResult` variant. Exhaustive on purpose (no `_ =>`).
fn result_kind(result: &BridgeResult) -> &'static str {
    match result {
        BridgeResult::State { .. } => "State",
        BridgeResult::RenderLayers { .. } => "RenderLayers",
        BridgeResult::RenderMap { .. } => "RenderMap",
        BridgeResult::RenderFrame { .. } => "RenderFrame",
    }
}

/// One sample of every `EngineCommand` variant. Completeness is asserted by
/// `every_command_serializes_with_its_wire_kind_and_round_trips`: every index of
/// [`COMMAND_KINDS`] must be hit exactly once.
fn every_command() -> Vec<EngineCommand> {
    vec![
        EngineCommand::CreateSession {
            params: StartGameParams::default(),
        },
        EngineCommand::AddPlayer {
            id: 2,
            name: "AI".to_owned(),
        },
        EngineCommand::SelectUnit { unit_id: 1 },
        EngineCommand::MoveUnit {
            unit_id: 1,
            destination: civ_engine::PositionDto::new(1, 1),
            attack_unit_id: None,
        },
        EngineCommand::CancelPlannedMarch {
            unit_id: 1,
            force: false,
        },
        EngineCommand::AdvanceTurn,
        EngineCommand::GetState,
        EngineCommand::DeclareWar {
            declarer: 1,
            target: 2,
        },
        EngineCommand::GetRenderLayers { seat: None },
        EngineCommand::GetRenderMap,
        EngineCommand::GetRenderFrame {
            seat: None,
            ui: None,
        },
        EngineCommand::StartSiegeStorm {
            city_id: 1,
            unit_id: 7,
        },
        EngineCommand::StepSiegeBattle {
            wall_ms: bridge::WallMs(16.0),
        },
        EngineCommand::SkipSiegeBattle,
        EngineCommand::FinishSiegeBattle,
        EngineCommand::AbortSiegeBattle,
    ]
}

/// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: the siege battle commands are additive (wire shape fixed here) and
/// the old response shape has no `siegeBattle` key.
#[test]
fn siege_battle_commands_have_a_fixed_wire_shape_and_old_responses_are_unchanged() {
    let cases = [
        (
            EngineCommand::StartSiegeStorm {
                city_id: 1,
                unit_id: 7,
            },
            json!({"kind": "start_siege_storm", "city_id": 1, "unit_id": 7}),
        ),
        (
            EngineCommand::StepSiegeBattle {
                wall_ms: bridge::WallMs(16.5),
            },
            json!({"kind": "step_siege_battle", "wall_ms": 16.5}),
        ),
        (
            EngineCommand::SkipSiegeBattle,
            json!({"kind": "skip_siege_battle"}),
        ),
        (
            EngineCommand::FinishSiegeBattle,
            json!({"kind": "finish_siege_battle"}),
        ),
        (
            EngineCommand::AbortSiegeBattle,
            json!({"kind": "abort_siege_battle"}),
        ),
    ];
    for (command, wire) in cases {
        assert_eq!(serde_json::to_value(&command).expect("serializes"), wire);
        let back: EngineCommand = serde_json::from_value(wire).expect("deserializes");
        assert_eq!(back, command);
    }
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    let read = bridge
        .handle(BridgeRequest::new("read", EngineCommand::GetState))
        .expect("get_state");
    let encoded = serde_json::to_value(&read.response).expect("response serializes");
    assert!(
        encoded.get("siegeBattle").is_none(),
        "old commands keep the response JSON without siegeBattle"
    );
    let keys: Vec<&str> = encoded
        .as_object()
        .expect("object")
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(keys, ["contractVersion", "requestId", "result"]);
    // Battle commands without a running battle are explicit rejections, not panics.
    for command in [
        EngineCommand::StepSiegeBattle {
            wall_ms: bridge::WallMs(16.0),
        },
        EngineCommand::SkipSiegeBattle,
        EngineCommand::FinishSiegeBattle,
        EngineCommand::AbortSiegeBattle,
    ] {
        let error = bridge
            .handle(BridgeRequest::new("battle", command))
            .expect_err("no battle in progress");
        assert_eq!(error.code, BridgeErrorCode::EngineRejected);
        assert!(error.message.contains("no battle in progress"), "{error:?}");
        // R-RUSTPORT-P4-1I6-DLUGI-Q1 (D-1I6-ERR): the battle error travels as a type next to its text.
        assert_eq!(
            error.siege_battle,
            Some(bridge::SiegeBattleErrorDto::NoActiveBattle),
            "{error:?}"
        );
        let wire = serde_json::to_value(&error).expect("error serializes");
        assert_eq!(wire["siegeBattle"], json!({"code": "no_active_battle"}));
    }
    // Non-battle errors keep the old error JSON (no `siegeBattle` key).
    let other = bridge
        .handle(BridgeRequest::new(" ", EngineCommand::GetState))
        .expect_err("blank request id");
    assert_eq!(other.siege_battle, None);
    let keys: Vec<String> = serde_json::to_value(&other)
        .expect("error serializes")
        .as_object()
        .expect("object")
        .keys()
        .cloned()
        .collect();
    assert_eq!(keys, ["code", "message"]);
    let mut mock = EngineBridge::new(MockEngineAdapter::default());
    let error = mock
        .handle(BridgeRequest::new("battle", EngineCommand::SkipSiegeBattle))
        .expect_err("mock without session rejects");
    assert_eq!(error.code, BridgeErrorCode::EngineRejected);
}

#[test]
fn every_command_serializes_with_its_wire_kind_and_round_trips() {
    let commands = every_command();
    let mut covered = [false; COMMAND_KINDS.len()];
    for command in &commands {
        let index = command_index(command);
        assert!(
            index < COMMAND_KINDS.len(),
            "command_index {index} outside COMMAND_KINDS for {command:?}"
        );
        assert!(
            !covered[index],
            "duplicate sample for {}",
            COMMAND_KINDS[index]
        );
        covered[index] = true;
    }
    let missing: Vec<&str> = COMMAND_KINDS
        .iter()
        .zip(covered)
        .filter(|(_, hit)| !hit)
        .map(|(kind, _)| *kind)
        .collect();
    assert!(
        missing.is_empty(),
        "every_command misses samples: {missing:?}"
    );
    assert_eq!(
        commands.len(),
        COMMAND_KINDS.len(),
        "one sample per variant"
    );
    let mut unique_kinds = COMMAND_KINDS.to_vec();
    unique_kinds.sort_unstable();
    unique_kinds.dedup();
    assert_eq!(
        unique_kinds.len(),
        COMMAND_KINDS.len(),
        "wire kinds are unique"
    );
    for command in commands {
        let request = BridgeRequest::new("kind", command.clone());
        let encoded = serde_json::to_value(&request).expect("request serializes");
        assert_eq!(encoded["command"]["kind"], command_kind(&command));
        let decoded: BridgeRequest = serde_json::from_value(encoded).expect("request deserializes");
        assert_eq!(decoded.command, command);
    }
}

#[test]
fn render_queries_through_real_adapter_answer_their_variant_without_events() {
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    bridge
        .handle(BridgeRequest::new(
            "create",
            EngineCommand::CreateSession {
                params: StartGameParams::default(),
            },
        ))
        .expect("create session succeeds");
    let cases = [
        (
            EngineCommand::GetRenderLayers { seat: None },
            "RenderLayers",
        ),
        (EngineCommand::GetRenderMap, "RenderMap"),
        (
            EngineCommand::GetRenderFrame {
                seat: None,
                ui: None,
            },
            "RenderFrame",
        ),
    ];
    for (command, expected) in cases {
        let kind = command_kind(&command);
        let dispatch = bridge
            .handle(BridgeRequest::new(kind, command))
            .unwrap_or_else(|error| panic!("{kind} succeeds: {error:?}"));
        assert!(
            dispatch.events.is_empty(),
            "{kind} emits no StateChanged ({} events)",
            dispatch.events.len()
        );
        assert_eq!(dispatch.response.request_id, kind);
        assert_eq!(dispatch.response.contract_version, CONTRACT_VERSION);
        assert_eq!(result_kind(&dispatch.response.result), expected);
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
fn non_default_frontend_start_values_deserialize_into_the_rust_dto() {
    let payload = json!({
        "civId": "grecy",
        "civName": "Grecy",
        "epoch": "Epoka Brązu",
        "epochId": "braz",
        "difficulty": "Trudny",
        "mapSize": "Mały",
        "rivals": 3,
        "speed": "Szybka",
        "worldType": "Wyspy",
        "typSwiata": "wyspy",
        "seed": 99,
        "mapQualityLabel": "Wysoka",
        "mapQuality": "high",
        "renderQualityLabel": "Wysoka",
        "renderQuality": "high",
        "mapDetailQualityLabel": "Wysoka",
        "mapDetailQuality": "high",
        "civTypesCount": 8,
        "cityStatesCount": 4,
        "worldDensity": {
            "resources": "low",
            "rivers": "high",
            "desert": "low",
            "forest": "high",
            "relief": "low"
        },
        "worldDensityLabels": {
            "resources": "Nisko",
            "rivers": "Wysoko",
            "desert": "Nisko",
            "forest": "Wysoko",
            "relief": "Nisko"
        },
        "landFractionPercent": 40,
        "advanced": {
            "barbariansLevel": "trudny",
            "battleAlwaysManual": true,
            "victoryMode": "dominacja",
            "buildingCostPace": "wysoki",
            "kosztJednostekPace": "normalny",
            "wzrostLudnosciPace": "wolny",
            "ruchSwiataPace": "dlugi",
            "landFractionPercent": 40,
            "landFractionCustom": true,
            "cityStateDifficultyOverride": "hard",
            "cityLimitBase": 20
        },
        "selectedAiCivIds": ["egipcjanie"],
        "villageRewardsEnabled": false,
        "unsupportedFeatures": ["advanced:NOT_IMPLEMENTED"]
    });
    let mut params: StartGameParams = serde_json::from_value(payload).expect("DTO deserializes");
    assert_eq!(params.civ_id, "grecy");
    assert_eq!(params.epoch_id, "braz");
    assert_eq!(params.world_type_id, "wyspy");
    assert_eq!(params.map_quality, "high");
    assert_eq!(params.world_density.rivers, "high");
    assert_eq!(params.advanced.city_limit_base, 20);
    assert_eq!(params.selected_ai_civ_ids, vec!["egipcjanie"]);
    assert!(!params.village_rewards_enabled);

    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    let created = bridge
        .handle(BridgeRequest::new(
            "create-selected",
            EngineCommand::CreateSession {
                params: std::mem::take(&mut params),
            },
        ))
        .expect("selected DTO starts a Rust session");
    let state = state_from(&created.response.result);
    assert_eq!(state.params.civ_id, "grecy");
    assert_eq!(state.params.epoch_id, "braz");
    assert_eq!(state.params.seed, 99);
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
    assert_eq!(
        state_from(&add.response.result).players[0].id,
        civ_engine::PlayerId::new(1)
    );
    assert_eq!(add.events.len(), 1);
    assert_eq!(add.events[0].channel(), EVENT_STATE_CHANGED);
    assert!(matches!(
        add.events[0],
        BridgeEvent::StateChanged { ref request_id, .. } if request_id == "add-1"
    ));
    let event_json = serde_json::to_value(&add.events[0]).expect("event serializes");
    assert_eq!(event_json["kind"], "state_changed");
    assert_eq!(event_json["contractVersion"], CONTRACT_VERSION);
    assert_eq!(event_json["requestId"], "add-1");
    assert_eq!(event_json["state"]["turn"], 1);
    assert_eq!(event_json["state"]["players"][0]["name"], "Player One");
    assert!(event_json["state"].get("map").is_some());
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
        .handle(BridgeRequest::new(
            "create-1",
            EngineCommand::CreateSession {
                params: StartGameParams::default(),
            },
        ))
        .expect("create session succeeds");
    assert_eq!(state_from(&created.response.result).turn, 1);
    assert_eq!(state_from(&created.response.result).map.width, 8);
    assert_eq!(state_from(&created.response.result).cities.len(), 1);
    assert_eq!(state_from(&created.response.result).units.len(), 1);

    let added = bridge
        .handle(BridgeRequest::new(
            "add-1",
            EngineCommand::AddPlayer {
                id: 42,
                name: "Ada".to_owned(),
            },
        ))
        .expect("add player succeeds");
    assert!(state_from(&added.response.result)
        .players
        .iter()
        .any(|player| player.name == "Ada"));

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
