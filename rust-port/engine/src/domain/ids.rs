use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt;

macro_rules! id_type {
    ($name:ident) => {
        #[derive(
            Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize,
        )]
        #[serde(transparent)]
        pub struct $name(u64);

        impl $name {
            pub const fn new(value: u64) -> Self {
                Self(value)
            }

            pub const fn get(self) -> u64 {
                self.0
            }
        }

        impl From<u64> for $name {
            fn from(value: u64) -> Self {
                Self::new(value)
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                self.0.fmt(formatter)
            }
        }
    };
}

id_type!(PlayerId);
id_type!(CityId);
id_type!(UnitId);
id_type!(CampId);

/// Legacy JSON value of the barbarian owner (`-1`, web `barbarians.ts:49`).
pub const LEGACY_BARBARIAN_OWNER_ID: i64 = -1;

/// Legacy JSON value of the rebel owner (`-99`, web `society-breakdown.ts:206`).
pub const LEGACY_REBEL_OWNER_ID: i64 = -99;

/// Owner of a world entity. Replaces the signed sentinel values `-1` and `-99`.
///
/// The serialized form stays a single JSON number so the existing DTO and save
/// contract is unchanged: a player serializes as its id (`>= 0`), barbarians as
/// `-1` and rebels as `-99`. No arithmetic is provided on owners.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum OwnerRef {
    Player(PlayerId),
    Barbarian,
    Rebel,
}

impl OwnerRef {
    pub const fn player(self) -> Option<PlayerId> {
        match self {
            Self::Player(id) => Some(id),
            Self::Barbarian | Self::Rebel => None,
        }
    }

    pub const fn is_barbarian(self) -> bool {
        matches!(self, Self::Barbarian)
    }

    /// Decodes the legacy numeric owner. Returns `None` for any negative value
    /// other than `-1` and `-99`.
    pub fn from_legacy_i64(value: i64) -> Option<Self> {
        match value {
            LEGACY_BARBARIAN_OWNER_ID => Some(Self::Barbarian),
            LEGACY_REBEL_OWNER_ID => Some(Self::Rebel),
            _ => u64::try_from(value)
                .ok()
                .map(|id| Self::Player(PlayerId::new(id))),
        }
    }

    /// Encodes the owner as the legacy numeric value. `None` only when a player
    /// id does not fit into `i64`.
    pub fn legacy_i64(self) -> Option<i64> {
        match self {
            Self::Player(id) => i64::try_from(id.get()).ok(),
            Self::Barbarian => Some(LEGACY_BARBARIAN_OWNER_ID),
            Self::Rebel => Some(LEGACY_REBEL_OWNER_ID),
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
        let value = self
            .legacy_i64()
            .ok_or_else(|| <S::Error as serde::ser::Error>::custom("owner id exceeds i64 range"))?;
        serializer.serialize_i64(value)
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
