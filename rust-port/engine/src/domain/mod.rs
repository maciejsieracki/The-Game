//! Domain building blocks shared by future engine systems.

mod error;
mod ids;
mod player;
mod rng;
mod session;
mod state;
mod types;

pub use error::EngineError;
pub use ids::{CityId, PlayerId, UnitId};
pub use player::Player;
pub use rng::{Rng, RngError};
pub use session::{GameState, Turn};
pub use state::{
    CanonicalState, CityState, CivilizationState, GameStateDto, MapState, TurnState, UnitState,
};
pub use types::{
    CityDto, CivilizationDto, MapDto, PositionDto, TerrainDto, TileDto, TurnDto, UnitDto,
    UnitKindDto, ValidationError,
};
