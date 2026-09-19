//! Stable boundary between the Tauri shell and the Rust game engine.
//!
//! The bridge deliberately exposes one Tauri command and a small, versioned JSON
//! envelope.  Keeping the command envelope here means the desktop shell does not
//! need to know how the engine stores its state internally.  `EnginePort` is the
//! seam used by the real engine adapter and by deterministic tests/mocks.

use civ_engine::{GameState, Player, PlayerId};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Version of the request/response/event payloads shared with the frontend.
pub const CONTRACT_VERSION: u16 = 1;
/// The single Tauri command exposed by the shell.
pub const TAURI_COMMAND: &str = "engine_command";
/// Event emitted after a mutating command has produced a new snapshot.
pub const EVENT_STATE_CHANGED: &str = "engine_state_changed";

/// Commands accepted by [`TAURI_COMMAND`].
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum EngineCommand {
    /// Start a fresh session and return its initial state.
    CreateSession,
    /// Add a player to the current session.
    AddPlayer { id: u64, name: String },
    /// Advance the one-based engine turn counter.
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

/// A frontend-safe projection of the engine state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EngineState {
    pub turn: u32,
    pub players: Vec<EnginePlayer>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct EnginePlayer {
    pub id: u64,
    pub name: String,
}

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

/// The adapter seam used by the bridge.
///
/// The bridge only deals in commands, snapshots, and bridge errors.  A real
/// engine and a mock can therefore implement this contract without exposing
/// their internal state representation to the Tauri layer.
pub trait EnginePort {
    fn execute(&mut self, command: EngineCommand) -> Result<EngineState, BridgeError>;
}

/// Result of dispatching one request, including events the Tauri shell must emit.
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

/// Adapter over the foundational Rust engine currently present in this repo.
#[derive(Debug, Clone, Default)]
pub struct CivEngineAdapter {
    state: GameState,
}

impl CivEngineAdapter {
    pub fn state(&self) -> &GameState {
        &self.state
    }
}

impl EnginePort for CivEngineAdapter {
    fn execute(&mut self, command: EngineCommand) -> Result<EngineState, BridgeError> {
        match command {
            EngineCommand::CreateSession => {
                self.state = GameState::new();
            }
            EngineCommand::AddPlayer { id, name } => {
                let player = Player::new(PlayerId::new(id), name)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
                self.state
                    .add_player(player)
                    .map_err(|error| BridgeError::engine_rejected(error.to_string()))?;
            }
            EngineCommand::AdvanceTurn => self
                .state
                .advance_turn()
                .map_err(|error| BridgeError::engine_rejected(error.to_string()))?,
            EngineCommand::GetState => {}
        }

        Ok(snapshot(&self.state))
    }
}

fn snapshot(state: &GameState) -> EngineState {
    EngineState {
        turn: state.turn().number(),
        players: state
            .players()
            .iter()
            .map(|player| EnginePlayer {
                id: player.id().get(),
                name: player.name().to_owned(),
            })
            .collect(),
    }
}

/// Deterministic adapter used by bridge contract tests and shell integration work.
///
/// It intentionally has the same externally visible rules as `CivEngineAdapter`
/// while recording every command, which makes it useful for testing that the
/// Tauri layer invokes the engine rather than maintaining a second state machine.
#[derive(Debug, Clone)]
pub struct MockEngineAdapter {
    state: EngineState,
    calls: Vec<EngineCommand>,
}

impl Default for MockEngineAdapter {
    fn default() -> Self {
        Self {
            state: EngineState {
                turn: 1,
                players: Vec::new(),
            },
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
            EngineCommand::CreateSession => {
                self.state = Self::default().state;
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
                self.state.players.push(EnginePlayer { id, name });
            }
            EngineCommand::AdvanceTurn => {
                self.state.turn = self.state.turn.checked_add(1).ok_or_else(|| {
                    BridgeError::engine_rejected("turn number cannot be advanced further")
                })?;
            }
            EngineCommand::GetState => {}
        }

        Ok(self.state.clone())
    }
}
