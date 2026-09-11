//! Domain building blocks shared by future engine systems.

mod error;
mod ids;
mod player;
mod rng;
mod session;

pub use error::EngineError;
pub use ids::{CityId, PlayerId, UnitId};
pub use player::Player;
pub use rng::{Rng, RngError};
pub use session::{GameState, Turn};
