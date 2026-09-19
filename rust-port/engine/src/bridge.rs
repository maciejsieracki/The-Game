//! Stable boundary between the Tauri shell and the first playable Rust slice.
//!
//! The bridge owns the versioned request/response/event envelope.  The engine
//! owns the map, entities, movement rules, and turn phase queue; the frontend
//! never maintains a second game state machine.

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
    /// Move a selected human unit to one legal adjacent destination.
    MoveUnit {
        unit_id: u64,
        destination: PositionDto,
    },
    /// Resolve the current turn through the canonical phase queue.
    AdvanceTurn,
    /// Read the current state without emitting a state-change event.
    GetState,
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
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum BridgeResult {
    State { state: EngineState },
}

/// JSON response returned by the Tauri command.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeResponse {
    pub contract_version: u16,
    pub request_id: String,
    pub result: BridgeResult,
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
        let state = self.adapter.execute(command.clone())?;
        let response = BridgeResponse {
            contract_version: CONTRACT_VERSION,
            request_id: request_id.clone(),
            result: BridgeResult::State {
                state: state.clone(),
            },
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
    pub fn state(&self) -> &PlayableState {
        self.game.state()
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
            } => self
                .game
                .move_unit(unit_id, destination)
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::AdvanceTurn => self
                .game
                .advance_turn()
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::GetState => {}
        }

        Ok(self.game.state().clone())
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
                if self.state.players.iter().any(|player| player.id == id) {
                    return Err(BridgeError::engine_rejected(format!(
                        "player {id} already exists"
                    )));
                }
                self.state.players.push(PlayablePlayer {
                    id,
                    name,
                    civilization: format!("player-{id}"),
                    is_human: false,
                });
                if let Some(game) = &mut self.game {
                    game.add_player(id, self.state.players.last().unwrap().name.clone())
                        .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                    self.state = game.state().clone();
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
            } => {
                let game = self.game.as_mut().ok_or_else(|| {
                    BridgeError::engine_rejected("create session before moving a unit")
                })?;
                game.move_unit(unit_id, destination)
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
        }

        Ok(self.state.clone())
    }
}
