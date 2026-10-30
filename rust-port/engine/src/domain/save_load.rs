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
use serde_json::{Number, Value};

// The source file is currently exercised as an integration-test path module.
// The production branch resolves these types from the sibling domain modules;
// the test branch resolves them from the same path-loaded dependency module.
#[cfg(not(test))]
use super::{GameStateDto, Rng};
#[cfg(test)]
use civ_engine::{GameStateDto, Rng};

#[cfg(not(test))]
pub use super::events::{EventQueue, TurnEvent, TurnPhase};
#[cfg(test)]
pub use crate::events::{EventQueue, TurnEvent, TurnPhase};

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
    /// Additive, optional save metadata (REPIN-WOJNA-2 R4). Absent in older saves.
    #[serde(skip_serializing_if = "SaveMeta::is_empty")]
    meta: SaveMeta,
    /// Additive, optional `plannedMarches` entries (web `planned-march.ts:466`).
    #[serde(
        rename = "plannedMarches",
        default,
        skip_serializing_if = "Vec::is_empty"
    )]
    planned_marches: Vec<SavedPlannedMarch>,
    /// Additive legacy `autoMarch` fallback (web `planned-march.ts:424-431`).
    #[serde(rename = "autoMarch", default, skip_serializing_if = "Option::is_none")]
    auto_march: Option<SavedAutoMarch>,
}

/// Web `AutoMarchSave` (`autoMarch` in the save). Only `leaderId` as non-empty string survives.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedAutoMarch {
    #[serde(
        rename = "leaderId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub leader_id: Option<String>,
    #[serde(
        rename = "destQ",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_q: Option<Number>,
    #[serde(
        rename = "destR",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_r: Option<Number>,
}

/// Additive save metadata. Mirrors the web `meta` block only for the fields that gate
/// battle-mode semantics (web `main.ts:40818-40820` and `main.ts:32378`).
///
/// Values are kept as raw JSON so that a non-conforming value (string, `null`, `NaN`
/// written as `null`) is normalized by the same rules as the web, never by a load error.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SaveMeta {
    #[serde(
        rename = "battleModeSettingVersion",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    battle_mode_setting_version: Option<Value>,
    /// Web `meta.newGameParams` (carries `advanced.battleAlwaysManual`).
    #[serde(
        rename = "newGameParams",
        default,
        skip_serializing_if = "Option::is_none"
    )]
    new_game_params: Option<Value>,
}

impl SaveMeta {
    /// True when no metadata field is present (used to omit the block from the output).
    pub fn is_empty(&self) -> bool {
        self.battle_mode_setting_version.is_none() && self.new_game_params.is_none()
    }

    /// Sets the raw `battleModeSettingVersion` value (web `meta.battleModeSettingVersion`).
    pub fn with_battle_mode_setting_version(mut self, value: Value) -> Self {
        self.battle_mode_setting_version = Some(value);
        self
    }

    /// Sets the raw `newGameParams` value.
    pub fn with_new_game_params(mut self, value: Value) -> Self {
        self.new_game_params = Some(value);
        self
    }

    /// Raw numeric marker (web `meta.battleModeSettingVersion`); non-numbers give `None`.
    /// The web normalization `=== 1 ? 1 : undefined` (`main.ts:40819-40821`) is applied by
    /// `battle_mode::restored_setting_version`, so the rule has a single owner.
    pub fn battle_mode_setting_value(&self) -> Option<f64> {
        self.battle_mode_setting_version
            .as_ref()
            .and_then(Value::as_f64)
    }

    /// Web `_lastNewGameParams?.advanced?.battleAlwaysManual`: only a JSON boolean is `Some`.
    pub fn battle_always_manual(&self) -> Option<bool> {
        self.new_game_params
            .as_ref()?
            .get("advanced")?
            .get("battleAlwaysManual")?
            .as_bool()
    }
}

/// One `plannedMarches` entry of the save (web `PlannedMarchesSave` value).
///
/// Field rules follow the web load path (`planned-march.ts:438-462`): a destination
/// must be a JSON number; `attackUnitId` / `generalTargetId` survive only as non-empty
/// strings. Filtering against live units is done by the caller.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedPlannedMarch {
    #[serde(rename = "unitId")]
    pub unit_id: String,
    #[serde(
        rename = "destQ",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_q: Option<Number>,
    #[serde(
        rename = "destR",
        default,
        deserialize_with = "lenient_number",
        skip_serializing_if = "Option::is_none"
    )]
    pub dest_r: Option<Number>,
    #[serde(
        rename = "attackUnitId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub attack_unit_id: Option<String>,
    #[serde(
        rename = "generalTargetId",
        default,
        deserialize_with = "lenient_nonempty_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub general_target_id: Option<String>,
}

/// Destination coordinates: only JSON numbers survive (web `Number.isFinite` on a parsed save).
/// `Number` (not `f64`) keeps `Eq` derivable on the snapshot, which `replay.rs` requires.
fn lenient_number<'de, D>(deserializer: D) -> Result<Option<Number>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(match Option::<Value>::deserialize(deserializer)? {
        Some(Value::Number(number)) => Some(number),
        _ => None,
    })
}

fn lenient_nonempty_string<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(match Option::<Value>::deserialize(deserializer)? {
        Some(Value::String(text)) if !text.is_empty() => Some(text),
        _ => None,
    })
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
    #[serde(default)]
    meta: Option<SaveMeta>,
    #[serde(default, rename = "plannedMarches")]
    planned_marches: Option<Vec<SavedPlannedMarch>>,
    #[serde(default, rename = "autoMarch")]
    auto_march: Option<SavedAutoMarch>,
}

impl SaveSnapshot {
    /// Creates a current version-2 snapshot.
    pub fn new(state: GameStateDto, event_queue: EventQueue<TurnEvent>, rng: Rng) -> Self {
        Self {
            version: CURRENT_SNAPSHOT_VERSION,
            state,
            event_queue,
            rng,
            meta: SaveMeta::default(),
            planned_marches: Vec::new(),
            auto_march: None,
        }
    }

    /// Returns a copy carrying the legacy `autoMarch` fallback entry.
    pub fn with_auto_march(mut self, auto_march: Option<SavedAutoMarch>) -> Self {
        self.auto_march = auto_march;
        self
    }

    /// Returns the legacy `autoMarch` entry, if the save carried one.
    pub fn auto_march(&self) -> Option<&SavedAutoMarch> {
        self.auto_march.as_ref()
    }

    /// Returns a copy carrying the additive save metadata.
    pub fn with_meta(mut self, meta: SaveMeta) -> Self {
        self.meta = meta;
        self
    }

    /// Returns a copy carrying the additive `plannedMarches` entries.
    pub fn with_planned_marches(mut self, planned_marches: Vec<SavedPlannedMarch>) -> Self {
        self.planned_marches = planned_marches;
        self
    }

    /// Returns the additive save metadata (empty for saves written before R4).
    pub fn meta(&self) -> &SaveMeta {
        &self.meta
    }

    /// Returns the saved `plannedMarches` entries (empty when absent).
    pub fn planned_marches(&self) -> &[SavedPlannedMarch] {
        &self.planned_marches
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

        let snapshot = snapshot
            .with_meta(wire.meta.unwrap_or_default())
            .with_planned_marches(wire.planned_marches.unwrap_or_default())
            .with_auto_march(wire.auto_march);
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
