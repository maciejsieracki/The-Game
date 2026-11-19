//! Stable boundary between the Tauri shell and the first playable Rust slice.
//!
//! The bridge owns the versioned request/response/event envelope.  The engine
//! owns the map, entities, movement rules, and turn phase queue; the frontend
//! never maintains a second game state machine.

pub use civ_engine::domain::dto_bridge::RenderLayersPayload;
pub use civ_engine::domain::render_frame::{RenderFramePayload, RenderMapPayload, RenderUiParams};
pub use civ_engine::domain::siege_battle_apply::{SiegeBattlePayload, WallMs};
pub use civ_engine::StartGameParams;
use civ_engine::{PlayableGame, PlayablePlayer, PlayableState, PositionDto};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Version of the request/response/event payloads shared with the frontend.
pub const CONTRACT_VERSION: u16 = 1;
/// The Tauri command exposed by the shell.
pub const TAURI_COMMAND: &str = "engine_command";
/// Event emitted after a mutating command has produced a new snapshot.
pub const EVENT_STATE_CHANGED: &str = "engine_state_changed";

/// Commands accepted by [`TAURI_COMMAND`].
// `CreateSession` carries the full wizard DTO by value; boxing it would change
// the constructor contract used by the root `tests/bridge_contract.rs`, which is
// outside this topic's allowlist, so the size lint is accepted here.
#[allow(clippy::large_enum_variant)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum EngineCommand {
    /// Start a fresh deterministic session from the wizard DTO.
    CreateSession {
        #[serde(default)]
        params: StartGameParams,
    },
    /// Compatibility command for bridge probes that add a non-human player.
    AddPlayer { id: u64, name: String },
    /// Select the human unit that the next map click should move.
    SelectUnit { unit_id: u64 },
    /// P4-1H Q6: order a march of the selected human unit (web `planMarchTo(destQ, destR,
    /// attackUnitId?)`, `main.ts:31213-31298` @ `07d2fbd72`): the destination may be any hex with a
    /// route; the first segment runs at once, the rest stays as a planned march. `attack_unit_id`
    /// marks an enemy target (march-then-attack; the battle itself is outside this command). An
    /// absent field keeps the previous JSON shape (`{unit_id, destination}`).
    MoveUnit {
        unit_id: u64,
        destination: PositionDto,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        attack_unit_id: Option<u64>,
    },
    /// P4-1H: cancel the planned march of one human unit (web `clearPlannedMarch(unitId, force)`,
    /// `main.ts:31051-31056` @ `07d2fbd72`). `force=false` keeps a march-then-attack plan; no plan is
    /// `Ok` without changes; an unknown or foreign unit is rejected (`UnitNotFound` / `UnitNotOwned`).
    CancelPlannedMarch { unit_id: u64, force: bool },
    /// Resolve the current turn through the canonical phase queue.
    AdvanceTurn,
    /// Read the current state without emitting a state-change event.
    GetState,
    /// Player `declarer` declares war on `target` (web `playerDeclareWarOnOwner`). Contract-only in this
    /// topic: the adapters reject it until the diplomacy state is wired into the session.
    DeclareWar { declarer: u64, target: u64 },
    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2 (D-364-2): query the renderer layers (fog, fog reveal, territory
    /// ranges) of seat `seat`; absent `seat` = the active human seat (web `ME()`). Answered with
    /// [`BridgeResult::RenderLayers`] and NO [`BridgeEvent::StateChanged`]. It never changes
    /// [`EngineState`], but - like web `refreshFog()` (`main.ts:13475-13513`) - it accumulates the seat's
    /// exploration (`exploredByHuman`) inside the session, outside the state DTO, save and replay.
    /// Additive: the JSON of every other command is unchanged and `CONTRACT_VERSION` stays 1.
    GetRenderLayers {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        seat: Option<u64>,
    },
    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1 (D-R3-1): static renderer map (`MapViewDto`, once per game).
    /// Answered with [`BridgeResult::RenderMap`] and NO [`BridgeEvent::StateChanged`]; read-only.
    GetRenderMap,
    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1 (D-R3-1): full dynamic renderer frame (`RenderLayersDto`) of seat
    /// `seat` (absent = active human seat, web `ME()`) with the client UI state `ui` (D-R3-2; absent = no
    /// selection, no build mode). Answered with [`BridgeResult::RenderFrame`] and NO
    /// [`BridgeEvent::StateChanged`]; like [`EngineCommand::GetRenderLayers`] it accumulates the seat
    /// exploration in the session only. Additive: `CONTRACT_VERSION` stays 1.
    GetRenderFrame {
        #[serde(default, skip_serializing_if = "Option::is_none")]
        seat: Option<u64>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        ui: Option<RenderUiParams>,
    },
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369): the human besieger storms walled city `city_id` from unit
    /// `unit_id` (web `launchSiegeStormFromMap` -> `onBattlefield` -> `new BattleScene` -> `bs.play`,
    /// `main.ts:36799-37019` @ `07d2fbd72`). The battle lives in the session (outside `EngineState`); the
    /// answer is `State` (unchanged state) plus `siegeBattle` (scene units, start actions, frame); no
    /// `StateChanged`. Additive: `CONTRACT_VERSION` stays 1.
    StartSiegeStorm { city_id: u64, unit_id: u64 },
    /// Real-time step of the running siege battle by `wall_ms` of wall clock (D-WIR-3, 16 ms frames):
    /// `siegeBattle` carries the actions of the step and the frame; no `StateChanged`.
    StepSiegeBattle { wall_ms: WallMs },
    /// Web `skip()` after start (`battleScene.ts:3680-3707`): fast-forward to the result; no `StateChanged`.
    SkipSiegeBattle,
    /// Apply the finished battle to the game state (web `consumeReadyMachines` + `finishSiegeStormBattle`
    /// without the city capture, which is returned as `captureRequested` for #354); emits `StateChanged`.
    FinishSiegeBattle,
}

impl EngineCommand {
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: commands of the siege battle session (answered with `siegeBattle`).
    pub const fn is_siege_battle(&self) -> bool {
        matches!(
            self,
            Self::StartSiegeStorm { .. }
                | Self::StepSiegeBattle { .. }
                | Self::SkipSiegeBattle
                | Self::FinishSiegeBattle
        )
    }
}

/// JSON request envelope sent by the frontend through Tauri `invoke`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeRequest {
    pub contract_version: u16,
    pub request_id: String,
    pub command: EngineCommand,
}

impl BridgeRequest {
    pub fn new(request_id: impl Into<String>, command: EngineCommand) -> Self {
        Self {
            contract_version: CONTRACT_VERSION,
            request_id: request_id.into(),
            command,
        }
    }

    fn validate(&self) -> Result<(), BridgeError> {
        if self.contract_version != CONTRACT_VERSION {
            return Err(BridgeError::unsupported_version(self.contract_version));
        }
        if self.request_id.trim().is_empty() {
            return Err(BridgeError::invalid_request(
                "requestId must contain at least one non-whitespace character",
            ));
        }
        Ok(())
    }
}

/// Frontend-safe projection of the complete playable state.
pub type EngineState = PlayableState;
pub type EnginePlayer = PlayablePlayer;

/// Successful command result.
// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: `State` carries the full state DTO by value; boxing it would
// change the `BridgeResult::State { state }` pattern used by the bridge consumers (root
// `tests/bridge_contract.rs`, outside this topic's allowlist), so the size lint is accepted here as for
// `EngineCommand`.
#[allow(clippy::large_enum_variant)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum BridgeResult {
    State {
        state: EngineState,
    },
    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: answer to [`EngineCommand::GetRenderLayers`].
    RenderLayers {
        layers: RenderLayersPayload,
    },
    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1: answer to [`EngineCommand::GetRenderMap`].
    RenderMap {
        map: RenderMapPayload,
    },
    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1: answer to [`EngineCommand::GetRenderFrame`].
    RenderFrame {
        frame: RenderFramePayload,
    },
}

/// JSON response returned by the Tauri command.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeResponse {
    pub contract_version: u16,
    pub request_id: String,
    pub result: BridgeResult,
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (D-WIRB-5): answer of the siege battle commands next to `result`
    /// (`State`). Absent for every other command, so their JSON is unchanged. A sibling field instead of a
    /// new `BridgeResult` variant: the consumers outside the engine (`rust-port/client` tests) match
    /// `BridgeResult` exhaustively, so a new variant would break their build.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub siege_battle: Option<SiegeBattlePayload>,
}

/// Events produced by a successful mutating command.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum BridgeEvent {
    StateChanged {
        #[serde(rename = "contractVersion")]
        contract_version: u16,
        #[serde(rename = "requestId")]
        request_id: String,
        state: EngineState,
    },
}

impl BridgeEvent {
    /// Return the Tauri event channel for this event payload.
    pub const fn channel(&self) -> &'static str {
        match self {
            Self::StateChanged { .. } => EVENT_STATE_CHANGED,
        }
    }
}

/// Stable, serializable error returned when the command cannot be completed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BridgeErrorCode {
    InvalidRequest,
    UnsupportedVersion,
    EngineRejected,
    EventEmission,
    Internal,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BridgeError {
    pub code: BridgeErrorCode,
    pub message: String,
}

impl BridgeError {
    pub fn invalid_request(message: impl Into<String>) -> Self {
        Self {
            code: BridgeErrorCode::InvalidRequest,
            message: message.into(),
        }
    }

    pub fn unsupported_version(actual: u16) -> Self {
        Self {
            code: BridgeErrorCode::UnsupportedVersion,
            message: format!(
                "unsupported bridge contract version {actual}; expected {CONTRACT_VERSION}"
            ),
        }
    }

    pub fn engine_rejected(message: impl Into<String>) -> Self {
        Self {
            code: BridgeErrorCode::EngineRejected,
            message: message.into(),
        }
    }

    pub fn event_emission(message: impl Into<String>) -> Self {
        Self {
            code: BridgeErrorCode::EventEmission,
            message: message.into(),
        }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self {
            code: BridgeErrorCode::Internal,
            message: message.into(),
        }
    }
}

impl fmt::Display for BridgeError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{:?}: {}", self.code, self.message)
    }
}

impl std::error::Error for BridgeError {}

/// Adapter seam used by the versioned dispatcher.
pub trait EnginePort {
    fn execute(&mut self, command: EngineCommand) -> Result<EngineState, BridgeError>;

    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: renderer layers of seat `seat` (`None` = active human seat).
    /// Adapters without a session fog state reject the query.
    fn render_layers(&mut self, seat: Option<u64>) -> Result<RenderLayersPayload, BridgeError> {
        let _ = seat;
        Err(BridgeError::engine_rejected(
            "get_render_layers: this adapter does not provide renderer layers",
        ))
    }

    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1: static renderer map. Adapters without a session reject it.
    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        Err(BridgeError::engine_rejected(
            "get_render_map: this adapter does not provide the renderer map",
        ))
    }

    /// R-RUSTPORT-P4-364-RENDER-FRAME-R1: full renderer frame of seat `seat` (`None` = active human seat)
    /// with the UI state `ui`. Adapters without a session reject it.
    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        let _ = (seat, ui);
        Err(BridgeError::engine_rejected(
            "get_render_frame: this adapter does not provide the renderer frame",
        ))
    }

    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: siege battle commands ([`EngineCommand::is_siege_battle`]). Adapters
    /// without a game session reject them.
    fn siege_battle(
        &mut self,
        command: &EngineCommand,
    ) -> Result<(EngineState, SiegeBattlePayload), BridgeError> {
        let _ = command;
        Err(BridgeError::engine_rejected(
            "siege battle: this adapter does not provide a game session",
        ))
    }
}

/// Runs one siege battle command on a game (shared by the real and the mock adapter).
fn siege_battle_on_game(
    game: &mut PlayableGame,
    command: &EngineCommand,
) -> Result<SiegeBattlePayload, BridgeError> {
    let result = match command {
        EngineCommand::StartSiegeStorm { city_id, unit_id } => {
            game.start_siege_storm(*city_id, *unit_id)
        }
        EngineCommand::StepSiegeBattle { wall_ms } => game.step_siege_battle(wall_ms.0),
        EngineCommand::SkipSiegeBattle => game.skip_siege_battle(),
        EngineCommand::FinishSiegeBattle => game.finish_siege_battle(),
        _ => {
            return Err(BridgeError::internal(
                "siege battle dispatcher called with a non-battle command",
            ))
        }
    };
    result.map_err(|error| BridgeError::engine_rejected(error.to_string()))
}

/// Result of dispatching one request, including events the Tauri shell emits.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BridgeDispatch {
    pub response: BridgeResponse,
    pub events: Vec<BridgeEvent>,
}

/// Versioned command dispatcher shared by the Tauri command and tests.
pub struct EngineBridge<A> {
    adapter: A,
}

impl<A> EngineBridge<A>
where
    A: EnginePort,
{
    pub fn new(adapter: A) -> Self {
        Self { adapter }
    }

    pub fn adapter(&self) -> &A {
        &self.adapter
    }

    pub fn adapter_mut(&mut self) -> &mut A {
        &mut self.adapter
    }

    pub fn handle(&mut self, request: BridgeRequest) -> Result<BridgeDispatch, BridgeError> {
        request.validate()?;
        let request_id = request.request_id;
        let command = request.command;
        if let EngineCommand::GetRenderLayers { seat } = command {
            // Read-only query: no `StateChanged` event (the session exploration it accumulates is not
            // part of `EngineState`).
            let layers = self.adapter.render_layers(seat)?;
            return Ok(BridgeDispatch {
                response: BridgeResponse {
                    contract_version: CONTRACT_VERSION,
                    request_id,
                    result: BridgeResult::RenderLayers { layers },
                    siege_battle: None,
                },
                events: Vec::new(),
            });
        }
        if matches!(command, EngineCommand::GetRenderMap) {
            // Read-only query: no `StateChanged` event.
            let map = self.adapter.render_map()?;
            return Ok(BridgeDispatch {
                response: BridgeResponse {
                    contract_version: CONTRACT_VERSION,
                    request_id,
                    result: BridgeResult::RenderMap { map },
                    siege_battle: None,
                },
                events: Vec::new(),
            });
        }
        if let EngineCommand::GetRenderFrame { seat, ui } = command {
            // Read-only query: no `StateChanged` event (the exploration it accumulates is session-only).
            let frame = self.adapter.render_frame(seat, ui)?;
            return Ok(BridgeDispatch {
                response: BridgeResponse {
                    contract_version: CONTRACT_VERSION,
                    request_id,
                    result: BridgeResult::RenderFrame { frame },
                    siege_battle: None,
                },
                events: Vec::new(),
            });
        }
        if command.is_siege_battle() {
            // Start/Step/Skip leave `EngineState` unchanged (the battle lives in the session, web map is
            // untouched until the scene result): no event. Finish applies the result: `StateChanged`.
            let (state, battle) = self.adapter.siege_battle(&command)?;
            let events = if matches!(command, EngineCommand::FinishSiegeBattle) {
                vec![BridgeEvent::StateChanged {
                    contract_version: CONTRACT_VERSION,
                    request_id: request_id.clone(),
                    state: state.clone(),
                }]
            } else {
                Vec::new()
            };
            return Ok(BridgeDispatch {
                response: BridgeResponse {
                    contract_version: CONTRACT_VERSION,
                    request_id,
                    result: BridgeResult::State { state },
                    siege_battle: Some(battle),
                },
                events,
            });
        }
        let state = self.adapter.execute(command.clone())?;
        let response = BridgeResponse {
            contract_version: CONTRACT_VERSION,
            request_id: request_id.clone(),
            result: BridgeResult::State {
                state: state.clone(),
            },
            siege_battle: None,
        };
        let events = if matches!(command, EngineCommand::GetState) {
            Vec::new()
        } else {
            vec![BridgeEvent::StateChanged {
                contract_version: CONTRACT_VERSION,
                request_id,
                state,
            }]
        };

        Ok(BridgeDispatch { response, events })
    }
}

/// Adapter over the deterministic first-slice engine.
#[derive(Debug, Clone)]
pub struct CivEngineAdapter {
    game: PlayableGame,
}

impl Default for CivEngineAdapter {
    fn default() -> Self {
        Self {
            game: PlayableGame::new(StartGameParams::default())
                .expect("default playable scenario must be valid"),
        }
    }
}

impl CivEngineAdapter {
    /// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1: adapter over an existing game (scenario or loaded game; the first
    /// slice `CreateSession` has no enemy city to storm).
    pub fn from_game(game: PlayableGame) -> Self {
        Self { game }
    }

    pub fn state(&self) -> &PlayableState {
        self.game.state()
    }

    /// R-RUSTPORT-P4-364-BRIDGE-LAYERS-R2: session fog state (exploration per seat), outside `EngineState`.
    pub fn fog_session(&self) -> &civ_engine::domain::playable::PlayableFogSession {
        self.game.fog_session()
    }
}

impl EnginePort for CivEngineAdapter {
    fn execute(&mut self, command: EngineCommand) -> Result<EngineState, BridgeError> {
        match command {
            EngineCommand::CreateSession { params } => {
                self.game = PlayableGame::new(params)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
            }
            EngineCommand::AddPlayer { id, name } => self
                .game
                .add_player(id, name)
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::SelectUnit { unit_id } => self
                .game
                .select_unit(unit_id)
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::MoveUnit {
                unit_id,
                destination,
                attack_unit_id,
            } => self
                .game
                .move_unit_with_attack(unit_id, destination, attack_unit_id)
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::CancelPlannedMarch { unit_id, force } => self
                .game
                .cancel_planned_march(unit_id, force)
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::AdvanceTurn => self
                .game
                .advance_turn()
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::GetState => {}
            EngineCommand::GetRenderLayers { seat } => {
                self.render_layers(seat)?;
            }
            EngineCommand::GetRenderMap => {
                self.render_map()?;
            }
            EngineCommand::GetRenderFrame { seat, ui } => {
                self.render_frame(seat, ui)?;
            }
            EngineCommand::DeclareWar { .. } => {
                return Err(BridgeError::engine_rejected(
                    "declare_war: wiring stanu dyplomacji poza zakresem tematu CRED-HAK-WYPOWIEDZENIE-IMPL-Q1",
                ));
            }
            EngineCommand::StartSiegeStorm { .. }
            | EngineCommand::StepSiegeBattle { .. }
            | EngineCommand::SkipSiegeBattle
            | EngineCommand::FinishSiegeBattle => {
                return self.siege_battle(&command).map(|(state, _)| state);
            }
        }

        Ok(self.game.state().clone())
    }

    fn siege_battle(
        &mut self,
        command: &EngineCommand,
    ) -> Result<(EngineState, SiegeBattlePayload), BridgeError> {
        let battle = siege_battle_on_game(&mut self.game, command)?;
        Ok((self.game.state().clone(), battle))
    }

    fn render_layers(&mut self, seat: Option<u64>) -> Result<RenderLayersPayload, BridgeError> {
        civ_engine::domain::dto_bridge::session_render_layers(&mut self.game, seat)
            .map_err(|error| BridgeError::engine_rejected(error.to_string()))
    }

    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        civ_engine::domain::render_frame::render_map(self.game.state())
            .map(RenderMapPayload)
            .map_err(|error| BridgeError::engine_rejected(error.to_string()))
    }

    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        let ui = ui.unwrap_or_default();
        civ_engine::domain::render_frame::session_render_frame(&mut self.game, seat, &ui)
            .map(RenderFramePayload)
            .map_err(|error| BridgeError::engine_rejected(error.to_string()))
    }
}

/// Deterministic adapter used by bridge contract tests and shell integration.
#[derive(Debug, Clone)]
pub struct MockEngineAdapter {
    state: EngineState,
    game: Option<PlayableGame>,
    calls: Vec<EngineCommand>,
}

impl Default for MockEngineAdapter {
    fn default() -> Self {
        Self {
            state: EngineState::empty(),
            game: None,
            calls: Vec::new(),
        }
    }
}

impl MockEngineAdapter {
    pub fn calls(&self) -> &[EngineCommand] {
        &self.calls
    }

    pub fn state(&self) -> &EngineState {
        &self.state
    }
}

impl EnginePort for MockEngineAdapter {
    fn execute(&mut self, command: EngineCommand) -> Result<EngineState, BridgeError> {
        self.calls.push(command.clone());
        match command {
            EngineCommand::CreateSession { params } => {
                let game = PlayableGame::new(params)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state = game.state().clone();
                self.game = Some(game);
            }
            EngineCommand::AddPlayer { id, name } => {
                if name.trim().is_empty() {
                    return Err(BridgeError::engine_rejected("player name cannot be empty"));
                }
                if self
                    .state
                    .players
                    .iter()
                    .any(|player| player.id.get() == id)
                {
                    return Err(BridgeError::engine_rejected(format!(
                        "player {id} already exists"
                    )));
                }
                // Fallible game call first: a rejected player must not leave a
                // trace in the mock state (the mock is compiled into production).
                if let Some(game) = &mut self.game {
                    game.add_player(id, name)
                        .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                    self.state = game.state().clone();
                } else {
                    self.state.players.push(PlayablePlayer {
                        id: civ_engine::domain::PlayerId::new(id),
                        name,
                        civilization: format!("player-{id}"),
                        is_human: false,
                    });
                }
            }
            EngineCommand::SelectUnit { unit_id } => {
                let game = self.game.as_mut().ok_or_else(|| {
                    BridgeError::engine_rejected("create session before selecting a unit")
                })?;
                game.select_unit(unit_id)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state = game.state().clone();
            }
            EngineCommand::MoveUnit {
                unit_id,
                destination,
                attack_unit_id,
            } => {
                let game = self.game.as_mut().ok_or_else(|| {
                    BridgeError::engine_rejected("create session before moving a unit")
                })?;
                game.move_unit_with_attack(unit_id, destination, attack_unit_id)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state = game.state().clone();
            }
            EngineCommand::CancelPlannedMarch { unit_id, force } => {
                let game = self.game.as_mut().ok_or_else(|| {
                    BridgeError::engine_rejected("create session before cancelling a march")
                })?;
                game.cancel_planned_march(unit_id, force)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state = game.state().clone();
            }
            EngineCommand::AdvanceTurn => {
                let game = self.game.as_mut().ok_or_else(|| {
                    BridgeError::engine_rejected("create session before advancing the turn")
                })?;
                game.advance_turn()
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state = game.state().clone();
            }
            EngineCommand::GetState => {
                if let Some(game) = &self.game {
                    self.state = game.state().clone();
                }
            }
            EngineCommand::DeclareWar { .. } => {
                return Err(BridgeError::engine_rejected(
                    "declare_war: wiring stanu dyplomacji poza zakresem tematu CRED-HAK-WYPOWIEDZENIE-IMPL-Q1",
                ));
            }
            EngineCommand::GetRenderLayers { seat } => {
                return self.render_layers(seat).map(|_| self.state.clone());
            }
            EngineCommand::GetRenderMap => {
                return self.render_map().map(|_| self.state.clone());
            }
            EngineCommand::GetRenderFrame { seat, ui } => {
                return self.render_frame(seat, ui).map(|_| self.state.clone());
            }
            EngineCommand::StartSiegeStorm { .. }
            | EngineCommand::StepSiegeBattle { .. }
            | EngineCommand::SkipSiegeBattle
            | EngineCommand::FinishSiegeBattle => {
                return self.siege_battle_on_mock(&command).map(|(state, _)| state);
            }
        }

        Ok(self.state.clone())
    }

    fn siege_battle(
        &mut self,
        command: &EngineCommand,
    ) -> Result<(EngineState, SiegeBattlePayload), BridgeError> {
        self.calls.push(command.clone());
        self.siege_battle_on_mock(command)
    }
}

impl MockEngineAdapter {
    fn siege_battle_on_mock(
        &mut self,
        command: &EngineCommand,
    ) -> Result<(EngineState, SiegeBattlePayload), BridgeError> {
        let game = self
            .game
            .as_mut()
            .ok_or_else(|| BridgeError::engine_rejected("create session before a siege battle"))?;
        let battle = siege_battle_on_game(game, command)?;
        self.state = game.state().clone();
        Ok((self.state.clone(), battle))
    }
}

#[cfg(test)]
mod add_player_atomicity_tests {
    use super::*;

    #[test]
    fn add_player_leaves_mock_state_untouched_when_the_game_rejects_it() {
        let mut adapter = MockEngineAdapter::default();
        adapter
            .execute(EngineCommand::CreateSession {
                params: StartGameParams::default(),
            })
            .expect("session starts");
        adapter
            .execute(EngineCommand::AddPlayer {
                id: 77,
                name: "Alpha".to_owned(),
            })
            .expect("first add succeeds");
        // Make the mock mirror drift: the game still holds player 77, the mock does not.
        adapter.state.players.retain(|player| player.id.get() != 77);
        let before = adapter.state.players.clone();

        let error = adapter
            .execute(EngineCommand::AddPlayer {
                id: 77,
                name: "Beta".to_owned(),
            })
            .expect_err("the game rejects the duplicate id");
        assert_eq!(error.code, BridgeErrorCode::EngineRejected);
        assert_eq!(
            adapter.state.players, before,
            "a rejected AddPlayer must not leave a player in the mock state"
        );
    }
}
