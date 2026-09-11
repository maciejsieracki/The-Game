use serde::{de, Deserialize, Deserializer, Serialize};

use super::{EngineError, Player, PlayerId};

/// One-based turn counter for the engine session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct Turn(u32);

impl Turn {
    pub const fn new(number: u32) -> Result<Self, EngineError> {
        if number == 0 {
            Err(EngineError::InvalidTurn(number))
        } else {
            Ok(Self(number))
        }
    }

    const fn first() -> Self {
        Self(1)
    }

    pub const fn number(self) -> u32 {
        self.0
    }

    fn advance(&mut self) -> Result<(), EngineError> {
        self.0 = self.0.checked_add(1).ok_or(EngineError::TurnOverflow)?;
        Ok(())
    }
}

impl<'de> Deserialize<'de> for Turn {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let number = u32::deserialize(deserializer)?;
        Self::new(number).map_err(de::Error::custom)
    }
}

/// Serializable session state shared by future engine domains.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GameState {
    turn: Turn,
    players: Vec<Player>,
}

impl GameState {
    pub const fn new() -> Self {
        Self {
            turn: Turn::first(),
            players: Vec::new(),
        }
    }

    pub const fn turn(&self) -> Turn {
        self.turn
    }

    pub fn players(&self) -> &[Player] {
        &self.players
    }

    pub fn add_player(&mut self, player: Player) -> Result<(), EngineError> {
        if self
            .players
            .iter()
            .any(|existing| existing.id() == player.id())
        {
            return Err(EngineError::DuplicatePlayer(player.id()));
        }

        self.players.push(player);
        Ok(())
    }

    pub fn player(&self, id: PlayerId) -> Option<&Player> {
        self.players.iter().find(|player| player.id() == id)
    }

    pub fn advance_turn(&mut self) -> Result<(), EngineError> {
        self.turn.advance()
    }
}

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}
