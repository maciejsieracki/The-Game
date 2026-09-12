//! Domain building blocks shared by future engine systems.

mod error;
mod ids;
pub mod improvements;
pub mod map_generator;
mod player;
pub mod resource_production;
mod rng;
mod session;
mod state;
mod types;

pub use error::EngineError;
pub use ids::{CityId, PlayerId, UnitId};
pub use improvements::{
    can_build_improvement, improvement_production, production_for, qualifies,
    qualifies_improvement, Deposit, Improvement, ImprovementKey, Production, TerrainType, Tile,
};
pub use map_generator::{
    generate_map, ClimateBand, GeneratedMap, HexCoord, HexTile, MapGenerator, MapGeneratorError,
    Mulberry32, Terrain, WorldType,
};
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
