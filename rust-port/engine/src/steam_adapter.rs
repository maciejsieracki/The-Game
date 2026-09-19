//! Side-effect-free boundary for optional Steamworks capabilities.
//!
//! This module deliberately contains no Steam SDK dependency. The production
//! implementation reports that no runtime is connected; a caller can inject a
//! real implementation later without changing the engine-facing contract.

use std::{
    collections::{BTreeMap, BTreeSet},
    error::Error,
    fmt,
};

/// Operations exposed by the optional Steamworks integration.
pub trait SteamAdapter {
    /// Unlock one achievement identified by the game's stable achievement key.
    fn unlock_achievement(&mut self, achievement_id: &str) -> Result<(), SteamAdapterError>;

    /// Read one opaque cloud-save payload.
    fn read_cloud_save(&self, key: &str) -> Result<Vec<u8>, SteamAdapterError>;

    /// Replace one opaque cloud-save payload.
    fn write_cloud_save(&mut self, key: &str, payload: &[u8]) -> Result<(), SteamAdapterError>;

    /// Report whether the Steam overlay is currently visible.
    fn overlay_status(&self) -> Result<OverlayStatus, SteamAdapterError>;
}

/// Errors returned by the adapter boundary.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SteamAdapterError {
    /// No connected Steam runtime can service the request.
    ServiceUnavailable,
    /// The requested cloud-save key has not been written.
    MissingCloudSaveKey { key: String },
}

impl fmt::Display for SteamAdapterError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ServiceUnavailable => formatter.write_str("Steam service is unavailable"),
            Self::MissingCloudSaveKey { key } => {
                write!(formatter, "cloud-save key is missing: {key}")
            }
        }
    }
}

impl Error for SteamAdapterError {}

/// The two observable states of an available overlay.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OverlayStatus {
    Hidden,
    Visible,
}

/// Explicit production boundary used until a Steam runtime is connected.
///
/// It is a zero-sized adapter: every operation returns
/// [`SteamAdapterError::ServiceUnavailable`] and performs no I/O or mutation.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ProductionSteamAdapter;

impl ProductionSteamAdapter {
    pub const fn new() -> Self {
        Self
    }
}

impl SteamAdapter for ProductionSteamAdapter {
    fn unlock_achievement(&mut self, _achievement_id: &str) -> Result<(), SteamAdapterError> {
        Err(SteamAdapterError::ServiceUnavailable)
    }

    fn read_cloud_save(&self, _key: &str) -> Result<Vec<u8>, SteamAdapterError> {
        Err(SteamAdapterError::ServiceUnavailable)
    }

    fn write_cloud_save(&mut self, _key: &str, _payload: &[u8]) -> Result<(), SteamAdapterError> {
        Err(SteamAdapterError::ServiceUnavailable)
    }

    fn overlay_status(&self) -> Result<OverlayStatus, SteamAdapterError> {
        Err(SteamAdapterError::ServiceUnavailable)
    }
}

/// Deterministic in-memory implementation for tests and local development.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InMemorySteamAdapter {
    service_available: bool,
    unlocked_achievements: BTreeSet<String>,
    cloud_saves: BTreeMap<String, Vec<u8>>,
    overlay_visible: bool,
}

impl Default for InMemorySteamAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl InMemorySteamAdapter {
    /// Create an available mock with an initially hidden overlay.
    pub fn new() -> Self {
        Self {
            service_available: true,
            unlocked_achievements: BTreeSet::new(),
            cloud_saves: BTreeMap::new(),
            overlay_visible: false,
        }
    }

    /// Create a mock whose every adapter operation is unavailable.
    pub fn unavailable() -> Self {
        Self {
            service_available: false,
            ..Self::new()
        }
    }

    /// Toggle service availability for an existing mock.
    pub fn set_service_available(&mut self, available: bool) {
        self.service_available = available;
    }

    /// Set the deterministic overlay state returned by the mock.
    pub fn set_overlay_visible(&mut self, visible: bool) {
        self.overlay_visible = visible;
    }

    /// Check whether an achievement was successfully recorded as unlocked.
    pub fn is_achievement_unlocked(&self, achievement_id: &str) -> bool {
        self.unlocked_achievements.contains(achievement_id)
    }

    /// Expose the ordered unlocked-achievement set for deterministic assertions.
    pub fn unlocked_achievements(&self) -> &BTreeSet<String> {
        &self.unlocked_achievements
    }

    fn ensure_service_available(&self) -> Result<(), SteamAdapterError> {
        if self.service_available {
            Ok(())
        } else {
            Err(SteamAdapterError::ServiceUnavailable)
        }
    }
}

impl SteamAdapter for InMemorySteamAdapter {
    fn unlock_achievement(&mut self, achievement_id: &str) -> Result<(), SteamAdapterError> {
        self.ensure_service_available()?;
        self.unlocked_achievements.insert(achievement_id.to_owned());
        Ok(())
    }

    fn read_cloud_save(&self, key: &str) -> Result<Vec<u8>, SteamAdapterError> {
        self.ensure_service_available()?;
        self.cloud_saves
            .get(key)
            .cloned()
            .ok_or_else(|| SteamAdapterError::MissingCloudSaveKey {
                key: key.to_owned(),
            })
    }

    fn write_cloud_save(&mut self, key: &str, payload: &[u8]) -> Result<(), SteamAdapterError> {
        self.ensure_service_available()?;
        self.cloud_saves.insert(key.to_owned(), payload.to_vec());
        Ok(())
    }

    fn overlay_status(&self) -> Result<OverlayStatus, SteamAdapterError> {
        self.ensure_service_available()?;
        Ok(if self.overlay_visible {
            OverlayStatus::Visible
        } else {
            OverlayStatus::Hidden
        })
    }
}
