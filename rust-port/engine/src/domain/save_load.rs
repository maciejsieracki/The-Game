//! Versioned save/load snapshot for the Rust/Tauri boundary.
//!
//! The wire contract is deliberately small and explicit:
//!
//! * version 1 contains `version`, a validated `state`, and the raw `rng_state`;
//! * version 2 is the current format and contains `version`, `state`, `rng`, and
//!   the serializable deterministic `event_queue`;
//! * loading version 1 migrates it to version 2 by restoring the RNG state and
//!   starting with an empty event queue;
//! * every other version is rejected instead of being silently defaulted.
//!
//! This module only defines the serializable domain value.  A Tauri command or
//! file adapter can use serde's `Serialize`/`Deserialize` implementations at
//! its JSON boundary without coupling the engine to storage or UI code.

use std::{error::Error, fmt};

use serde::{de, Deserialize, Deserializer, Serialize};

// The source file is currently exercised as an integration-test path module.
// The production branch resolves these types from the sibling domain modules;
// the test branch resolves them from the same path-loaded dependency module.
#[cfg(not(test))]
use super::{GameStateDto, Rng};
#[cfg(test)]
use civ_engine::{GameStateDto, Rng};

pub use super::events::{EventQueue, TurnEvent, TurnPhase};

/// The current on-disk snapshot format.
pub const CURRENT_SNAPSHOT_VERSION: u16 = 2;

/// The only legacy format accepted by the migration boundary.
pub const LEGACY_SNAPSHOT_VERSION: u16 = 1;

/// Errors raised when a snapshot cannot be restored safely.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SnapshotError {
    /// The version field was not present in the input object.
    MissingVersion,
    /// The version is outside the explicitly supported migration boundary.
    UnsupportedVersion { found: u16, current: u16 },
    /// A field required by a known version was absent.
    MissingField { version: u16, field: &'static str },
    /// The state DTO violated one of its domain invariants.
    InvalidState(String),
}

impl fmt::Display for SnapshotError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingVersion => formatter.write_str("snapshot version is missing"),
            Self::UnsupportedVersion { found, current } => write!(
                formatter,
                "unsupported snapshot version {found}; current version is {current}"
            ),
            Self::MissingField { version, field } => {
                write!(
                    formatter,
                    "snapshot version {version} is missing field {field:?}"
                )
            }
            Self::InvalidState(error) => write!(formatter, "snapshot state is invalid: {error}"),
        }
    }
}

impl Error for SnapshotError {}

/// The minimal, current save/load snapshot.
///
/// The version is private so a caller cannot serialize a version-2 payload
/// stamped as an unsupported version.  Use [`SaveSnapshot::version`] to inspect
/// it and [`SaveSnapshot::new`] to construct a current snapshot.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SaveSnapshot {
    version: u16,
    state: GameStateDto,
    event_queue: EventQueue<TurnEvent>,
    rng: Rng,
}

/// Version-aware input accepted by [`SaveSnapshot`]'s custom deserializer.
///
/// Optional fields are kept here, rather than on `SaveSnapshot`, so omission is
/// handled only by the matching legacy migration.  A current snapshot missing
/// `rng` or `event_queue` is rejected explicitly.
#[derive(Debug, Deserialize)]
struct SnapshotWire {
    #[serde(default)]
    version: Option<u16>,
    state: GameStateDto,
    #[serde(default)]
    event_queue: Option<EventQueue<TurnEvent>>,
    #[serde(default)]
    rng: Option<Rng>,
    #[serde(default)]
    rng_state: Option<u32>,
}

impl SaveSnapshot {
    /// Creates a current version-2 snapshot.
    pub fn new(state: GameStateDto, event_queue: EventQueue<TurnEvent>, rng: Rng) -> Self {
        Self {
            version: CURRENT_SNAPSHOT_VERSION,
            state,
            event_queue,
            rng,
        }
    }

    /// Returns the format version stamped on this snapshot.
    pub const fn version(&self) -> u16 {
        self.version
    }

    /// Returns the validated game state.
    pub fn state(&self) -> &GameStateDto {
        &self.state
    }

    /// Returns the deterministic events waiting to be resolved.
    pub fn event_queue(&self) -> &EventQueue<TurnEvent> {
        &self.event_queue
    }

    /// Returns the RNG stream checkpoint used by the next random step.
    pub const fn rng(&self) -> &Rng {
        &self.rng
    }

    /// Checks the format and state invariants before handing a snapshot to the
    /// game runtime.
    pub fn validate(&self) -> Result<(), SnapshotError> {
        if self.version != CURRENT_SNAPSHOT_VERSION {
            return Err(SnapshotError::UnsupportedVersion {
                found: self.version,
                current: CURRENT_SNAPSHOT_VERSION,
            });
        }
        self.state
            .validate()
            .map_err(|error| SnapshotError::InvalidState(error.to_string()))
    }

    /// Decomposes the snapshot for a runtime restore operation.
    pub fn into_parts(self) -> (GameStateDto, EventQueue<TurnEvent>, Rng) {
        (self.state, self.event_queue, self.rng)
    }
}

impl<'de> Deserialize<'de> for SaveSnapshot {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let wire = SnapshotWire::deserialize(deserializer)?;
        let version = wire
            .version
            .ok_or_else(|| de::Error::custom(SnapshotError::MissingVersion))?;

        let snapshot = match version {
            LEGACY_SNAPSHOT_VERSION => {
                let rng_state = wire.rng_state.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "rng_state",
                    })
                })?;
                migrate_v1(wire.state, rng_state)
            }
            CURRENT_SNAPSHOT_VERSION => {
                let event_queue = wire.event_queue.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "event_queue",
                    })
                })?;
                let rng = wire.rng.ok_or_else(|| {
                    de::Error::custom(SnapshotError::MissingField {
                        version,
                        field: "rng",
                    })
                })?;
                SaveSnapshot::new(wire.state, event_queue, rng)
            }
            found => {
                return Err(de::Error::custom(SnapshotError::UnsupportedVersion {
                    found,
                    current: CURRENT_SNAPSHOT_VERSION,
                }));
            }
        };

        snapshot.validate().map_err(de::Error::custom)?;
        Ok(snapshot)
    }
}

/// Migrates the explicitly supported version-1 representation to version 2.
///
/// Version 1 had no event queue.  The queue is therefore initialized empty,
/// while `rng_state` becomes the exact checkpoint for the restored [`Rng`].
pub fn migrate_v1(state: GameStateDto, rng_state: u32) -> SaveSnapshot {
    SaveSnapshot::new(state, EventQueue::new(), Rng::from_state(rng_state))
}
