use serde::{Deserialize, Serialize};

use super::{EngineError, OwnerRef, PlayerId};

/// Fotel gracza ludzkiego w single-player (web `HUMAN_OWNER_PRIMARY`, human-owners.ts:21).
pub const HUMAN_OWNER_PRIMARY: PlayerId = PlayerId::new(0);

/// AI-MANAGE-Q1=A (web `isMajorAiOwner`, owner-utils.ts:12): major AI to właściciel-gracz
/// o id > 0, który nie jest miastem-państwem. Barbarzyńca i rebelianci nie są major AI.
pub fn is_major_ai_owner(owner: OwnerRef, is_city_state: impl Fn(PlayerId) -> bool) -> bool {
    match owner {
        OwnerRef::Player(id) => id.get() > 0 && !is_city_state(id),
        OwnerRef::Barbarian | OwnerRef::Rebel => false,
    }
}

/// Stan foteli ludzkich (web `HumanSeats`, human-owners.ts:27). Pojedynczy fotel = single-player,
/// więcej niż jeden = hot-seat. Aktywny fotel może być spoza listy (wtedy brak następnego).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HumanSeats {
    human_owners: Vec<PlayerId>,
    active: PlayerId,
}

impl HumanSeats {
    pub fn new(human_owners: Vec<PlayerId>, active: PlayerId) -> Self {
        Self {
            human_owners,
            active,
        }
    }

    pub fn human_owners(&self) -> &[PlayerId] {
        &self.human_owners
    }

    pub const fn active(&self) -> PlayerId {
        self.active
    }

    /// Web `isHumanOwner`: właściciel jest którymkolwiek z foteli ludzkich.
    pub fn is_human_owner(&self, owner: OwnerRef) -> bool {
        owner
            .player()
            .is_some_and(|id| self.human_owners.contains(&id))
    }

    /// Web `isActiveHuman`: właściciel jest DOKŁADNIE aktywnym fotelem.
    pub fn is_active_human(&self, owner: OwnerRef) -> bool {
        owner == OwnerRef::Player(self.active)
    }

    /// Web `isAiOwner`: nie człowiek, nie barbarzyńca, nie rebeliant.
    pub fn is_ai_owner(&self, owner: OwnerRef) -> bool {
        if self.is_human_owner(owner) {
            return false;
        }
        !owner.is_barbarian() && owner != OwnerRef::Rebel
    }

    /// Web `nextHumanSeat`: kolejny fotel po aktywnym, cyklicznie. `None` przy <= 1 foteli
    /// lub gdy aktywny fotel nie należy do listy.
    pub fn next_human_seat(&self) -> Option<PlayerId> {
        if self.human_owners.len() <= 1 {
            return None;
        }
        let index = self.human_owners.iter().position(|id| *id == self.active)?;
        self.human_owners
            .get((index + 1) % self.human_owners.len())
            .copied()
    }

    /// Web `isHotSeat`: więcej niż jeden fotel ludzki.
    pub fn is_hot_seat(&self) -> bool {
        self.human_owners.len() > 1
    }
}

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
