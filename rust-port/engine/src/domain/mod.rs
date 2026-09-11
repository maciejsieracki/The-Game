//! Domain building blocks shared by future engine systems.

mod error;
mod ids;
mod player;
mod session;

pub use error::EngineError;
pub use ids::{CityId, PlayerId, UnitId};
pub use player::Player;
pub use session::{GameState, Turn};
