use std::{fmt, str::FromStr};

/// Chronological eras used by the unit availability rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Epoch {
    Stone = 1,
    Bronze = 2,
    Iron = 3,
}

impl Epoch {
    /// Returns the immediately preceding era, if one exists.
    pub const fn previous(self) -> Option<Self> {
        match self {
            Self::Stone => None,
            Self::Bronze => Some(Self::Stone),
            Self::Iron => Some(Self::Bronze),
        }
    }

    /// Returns the canonical Polish label used by the game's data files.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Stone => "Kamień",
            Self::Bronze => "Brąz",
            Self::Iron => "Żelazo",
        }
    }
}

impl fmt::Display for Epoch {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InvalidEpoch;

impl fmt::Display for InvalidEpoch {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("unknown unit epoch")
    }
}

impl std::error::Error for InvalidEpoch {}

impl FromStr for Epoch {
    type Err = InvalidEpoch;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_lowercase().as_str() {
            "kamień" | "kamien" | "stone" => Ok(Self::Stone),
            "brąz" | "braz" | "bronze" => Ok(Self::Bronze),
            "żelazo" | "zelazo" | "iron" => Ok(Self::Iron),
            _ => Err(InvalidEpoch),
        }
    }
}

/// Unit metadata needed to decide whether recruitment is available.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnitEpoch {
    id: String,
    epoch: Epoch,
    scout: bool,
}

impl UnitEpoch {
    /// Creates a unit entry. Scout names are recognised so data-loaded Scouts
    /// receive the permanent availability exception without a second flag.
    pub fn new(id: impl Into<String>, epoch: Epoch) -> Self {
        let id = id.into();
        let scout = is_scout_name(&id);
        Self { id, epoch, scout }
    }

    /// Creates an explicitly exempt Scout entry.
    pub fn scout(id: impl Into<String>, epoch: Epoch) -> Self {
        Self {
            id: id.into(),
            epoch,
            scout: true,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub const fn epoch(&self) -> Epoch {
        self.epoch
    }

    pub const fn is_scout(&self) -> bool {
        self.scout
    }

    /// A military unit is available in its own era and one era after it.
    /// Scouts are the explicit exception and remain available in every era.
    pub fn is_available_in(&self, current: Epoch) -> bool {
        self.scout
            || self.epoch == current
            || matches!(current.previous(), Some(previous) if previous == self.epoch)
    }
}

/// Returns the entries available in `current`, preserving input order.
pub fn available_units(current: Epoch, units: &[UnitEpoch]) -> Vec<&UnitEpoch> {
    units
        .iter()
        .filter(|unit| unit.is_available_in(current))
        .collect()
}

fn is_scout_name(id: &str) -> bool {
    let normalized = id.trim().to_lowercase();
    matches!(normalized.as_str(), "zwiadowca" | "scout")
}
