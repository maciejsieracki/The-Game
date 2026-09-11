use serde::{Deserialize, Serialize};

use super::{EngineError, PlayerId};

/// A player identity kept independent from future map and economy systems.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Player {
    id: PlayerId,
    name: String,
}

impl Player {
    pub fn new(id: PlayerId, name: impl Into<String>) -> Result<Self, EngineError> {
        let name = name.into();
        if name.trim().is_empty() {
            return Err(EngineError::EmptyPlayerName);
        }

        Ok(Self { id, name })
    }

    pub const fn id(&self) -> PlayerId {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }
}
