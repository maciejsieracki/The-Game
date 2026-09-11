use std::{error::Error, fmt};

use super::PlayerId;

/// Errors shared by the foundational engine domain types.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EngineError {
    EmptyPlayerName,
    DuplicatePlayer(PlayerId),
    InvalidTurn(u32),
    TurnOverflow,
}

impl fmt::Display for EngineError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyPlayerName => formatter.write_str("player name cannot be empty"),
            Self::DuplicatePlayer(id) => write!(formatter, "player {id} already exists"),
            Self::InvalidTurn(number) => {
                write!(formatter, "turn number must be at least 1, got {number}")
            }
            Self::TurnOverflow => formatter.write_str("turn number cannot be advanced further"),
        }
    }
}

impl Error for EngineError {}
