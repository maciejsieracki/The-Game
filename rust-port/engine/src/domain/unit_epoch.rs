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

// ---------------------------------------------------------------------------
// P6.1 — pierwsze wejście cywilizacji w epokę (web `gra/src/game/civ-entry-epoch.ts`,
// pin edb8fb56). Identyfikatory epok są ścisłe (dokładne dopasowanie jak w webie):
// "kamien" | "braz" | "zelazo". Nieznany identyfikator epoki ma indeks poza zakresem
// (`GAME_EPOCH_ORDER.len()`), więc każda cywilizacja jest dla niego dostępna.
// ---------------------------------------------------------------------------

/// Kanoniczna kolejność epok gry (web `GAME_EPOCH_ORDER`, civ-entry-epoch.ts:9).
#[allow(dead_code)]
pub const GAME_EPOCH_ORDER: [Epoch; 3] = [Epoch::Stone, Epoch::Bronze, Epoch::Iron];

/// Ścisłe rozpoznanie kanonicznego identyfikatora epoki gry (web `GAME_EPOCH_ORDER.includes`).
/// `allow(dead_code)`: plik jest też włączany przez `tests/unit_epoch.rs` (`#[path]`), który nie używa tego API.
#[allow(dead_code)]
pub fn parse_game_epoch_id(id: &str) -> Option<Epoch> {
    match id {
        "kamien" => Some(Epoch::Stone),
        "braz" => Some(Epoch::Bronze),
        "zelazo" => Some(Epoch::Iron),
        _ => None,
    }
}

/// Indeks epoki gry (web `gameEpochIndex`). Nieznany identyfikator => `GAME_EPOCH_ORDER.len()`.
#[allow(dead_code)]
pub fn game_epoch_index(id: &str) -> usize {
    parse_game_epoch_id(id).map_or(GAME_EPOCH_ORDER.len(), |epoch| epoch as usize - 1)
}

/// Wiersz cywilizacji potrzebny do wyznaczenia epoki wejścia (web `CivEntryEpochRow`).
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CivEntryRow<'a> {
    /// `ikonaId` — pusty lub brak = pomijany przy liście dostępnych.
    pub ikona_id: Option<&'a str>,
    /// `epokaWejscia` (kanon).
    pub epoka_wejscia: Option<&'a str>,
    /// `epokiStartowe` (legacy).
    pub epoki_startowe: Option<&'a [&'a str]>,
}

/// Pierwsza epoka wejścia cywilizacji (web `getCivEpokaWejscia`).
/// Kolejność: poprawny `epoka_wejscia`; w przeciwnym razie minimum poprawnych
/// `epoki_startowe`; w przeciwnym razie `Kamień`.
#[allow(dead_code)]
pub fn civ_entry_epoch(epoka_wejscia: Option<&str>, epoki_startowe: Option<&[&str]>) -> Epoch {
    if let Some(epoch) = epoka_wejscia.and_then(parse_game_epoch_id) {
        return epoch;
    }
    if let Some(legacy) = epoki_startowe {
        if let Some(earliest) = legacy.iter().copied().filter_map(parse_game_epoch_id).min() {
            return earliest;
        }
    }
    Epoch::Stone
}

/// Czy cywilizacja może być wybrana/wylosowana w danej epoce gry
/// (web `isCivAvailableAtGameEpoch`: indeks wejścia <= indeks epoki gry).
#[allow(dead_code)]
pub fn is_civ_available_at_game_epoch(row: CivEntryRow<'_>, game_epoch_id: &str) -> bool {
    let entry = civ_entry_epoch(row.epoka_wejscia, row.epoki_startowe);
    (entry as usize) - 1 <= game_epoch_index(game_epoch_id)
}

/// Identyfikatory cywilizacji (`ikona_id`) dostępnych w epoce startu gry, w kolejności wejścia
/// (web `civIdsAvailableAtGameEpoch`).
#[allow(dead_code)]
pub fn civ_ids_available_at_game_epoch<'a>(
    rows: &[CivEntryRow<'a>],
    game_epoch_id: &str,
) -> Vec<&'a str> {
    rows.iter()
        .filter_map(|row| {
            let id = row.ikona_id.filter(|id| !id.is_empty())?;
            is_civ_available_at_game_epoch(*row, game_epoch_id).then_some(id)
        })
        .collect()
}
