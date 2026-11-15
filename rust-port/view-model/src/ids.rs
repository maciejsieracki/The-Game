//! Identifiers and coordinates of the view model.
//!
//! Decision D-DTO-2 = B (contract §7): the DTO carries newtypes; the renderer
//! adapter (P4-1G) turns them into the `String` / `i32` / `i64` its modules
//! already take. The newtypes mirror the engine ones (`engine/src/domain/ids.rs:4-39`,
//! `#[serde(transparent)] u64`) and the engine `OwnerRef` (`ids.rs:49-121`, a
//! single JSON number `-99` / `-1` / `>= 0`), with one addition required by the
//! contract (§4 pt 4): every id is at most `2^53 - 1`, so the webview reads it
//! as an exact JS number. The bound is enforced by construction
//! ([`CityId::try_new`] …) and again when deserializing.

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

/// `Number.MAX_SAFE_INTEGER` (`2^53 - 1`): the largest id the contract allows.
pub const MAX_SAFE_ID: u64 = (1_u64 << 53) - 1;

/// Legacy JSON value of the barbarian owner (`-1`; engine `ids.rs:42`).
pub const BARBARIAN_OWNER_JSON: i64 = -1;

/// Legacy JSON value of the rebel owner (`-99`; engine `ids.rs:45`).
pub const REBEL_OWNER_JSON: i64 = -99;

/// An id above [`MAX_SAFE_ID`] (not exactly representable as a JS number).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IdOutOfRange {
    /// The rejected value.
    pub value: u64,
}

impl fmt::Display for IdOutOfRange {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "id {} exceeds the JSON-safe maximum {MAX_SAFE_ID}",
            self.value
        )
    }
}

impl std::error::Error for IdOutOfRange {}

macro_rules! view_id {
    ($(#[$meta:meta])* $name:ident) => {
        $(#[$meta])*
        ///
        /// JSON: a plain number. Invariant: `value <= MAX_SAFE_ID`.
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub struct $name(u64);

        impl $name {
            /// The id, or [`IdOutOfRange`] when `value > MAX_SAFE_ID`.
            pub const fn try_new(value: u64) -> Result<Self, IdOutOfRange> {
                if value <= MAX_SAFE_ID {
                    Ok(Self(value))
                } else {
                    Err(IdOutOfRange { value })
                }
            }

            /// The raw value.
            #[must_use]
            pub const fn get(self) -> u64 {
                self.0
            }
        }

        impl TryFrom<u64> for $name {
            type Error = IdOutOfRange;

            fn try_from(value: u64) -> Result<Self, Self::Error> {
                Self::try_new(value)
            }
        }

        /// Decimal, like the engine id `Display` (`ids.rs:28-32`): the
        /// adapter uses it for the renderer's `String` ids.
        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                self.0.fmt(f)
            }
        }

        impl Serialize for $name {
            fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
                serializer.serialize_u64(self.0)
            }
        }

        impl<'de> Deserialize<'de> for $name {
            fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
                let value = u64::deserialize(deserializer)?;
                Self::try_new(value).map_err(<D::Error as serde::de::Error>::custom)
            }
        }
    };
}

view_id!(
    /// Player id (engine `PlayerId`).
    PlayerId
);
view_id!(
    /// City id (engine `CityId`).
    CityId
);
view_id!(
    /// Unit id (engine `UnitId`).
    UnitId
);

/// Owner of a world entity (engine `OwnerRef`, `ids.rs:49-121`).
///
/// JSON: one number — a player as its id (`>= 0`), barbarians `-1`, rebels
/// `-99` (the web values; the renderer reads owners as `i32`/`i64`/`f64`,
/// contract §1.3). The derived order is `Rebel < Barbarian < Player(_)`, the
/// order of the legacy numbers (`-99 < -1 < 0 < …`), used by `owners[]`
/// (contract §3.4). Do not reorder the variants.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum OwnerRef {
    /// Rebels (`-99`).
    Rebel,
    /// Barbarians (`-1`).
    Barbarian,
    /// A player.
    Player(PlayerId),
}

impl OwnerRef {
    /// The JSON number of the owner (always fits: player ids are `<= 2^53 - 1`).
    #[must_use]
    pub const fn legacy_i64(self) -> i64 {
        match self {
            Self::Rebel => REBEL_OWNER_JSON,
            Self::Barbarian => BARBARIAN_OWNER_JSON,
            // `get() <= MAX_SAFE_ID < i64::MAX`, so the cast is lossless.
            #[allow(clippy::cast_possible_wrap)]
            Self::Player(id) => id.get() as i64,
        }
    }

    /// Decodes the JSON number: `-1`, `-99` or a player id in `0..=MAX_SAFE_ID`.
    /// Any other value is `None`.
    #[must_use]
    pub fn from_legacy_i64(value: i64) -> Option<Self> {
        match value {
            BARBARIAN_OWNER_JSON => Some(Self::Barbarian),
            REBEL_OWNER_JSON => Some(Self::Rebel),
            _ => u64::try_from(value)
                .ok()
                .and_then(|v| PlayerId::try_new(v).ok())
                .map(Self::Player),
        }
    }
}

impl From<PlayerId> for OwnerRef {
    fn from(id: PlayerId) -> Self {
        Self::Player(id)
    }
}

impl Serialize for OwnerRef {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_i64(self.legacy_i64())
    }
}

impl<'de> Deserialize<'de> for OwnerRef {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let value = i64::deserialize(deserializer)?;
        Self::from_legacy_i64(value).ok_or_else(|| {
            <D::Error as serde::de::Error>::custom(format!("invalid owner value {value}"))
        })
    }
}

/// Axial hex coordinate, JSON `{"q": …, "r": …}` — the engine `HexCoord`
/// (`engine/src/domain/hex.rs:8-12`) and the web `HexCoords`
/// (`gra/src/types/hex.ts:71-74` @ `07d2fbd72`). `PositionDto(x, y)` of the
/// engine is `HexCoord(q = x, r = y)` (contract §1.4).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct HexCoord {
    /// Axial `q`.
    pub q: i32,
    /// Axial `r`.
    pub r: i32,
}

impl HexCoord {
    /// The coordinate `(q, r)`.
    #[must_use]
    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }
}
