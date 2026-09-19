//! Domain building blocks shared by future engine systems.

pub mod barbarians;
pub mod building_costs;
pub mod city_growth;
pub mod diplomacy;
mod error;
pub mod events;
pub mod hex;
mod ids;
pub mod improvements;
pub mod map_generator;
pub mod pathfinding;
pub mod playable;
mod player;
pub mod recruitment;
pub mod resource_production;
mod rng;
mod session;
mod state;
pub mod terrain;

pub mod trade;
pub mod turn_economy;
mod types;

pub use error::EngineError;
pub use events::{canonical_phase_order, phase_order, TurnEvent, TurnPhase, PHASE_COUNT};
pub use ids::{CityId, PlayerId, UnitId};
pub use improvements::{
    can_build_improvement, improvement_production, production_for, qualifies,
    qualifies_improvement, Deposit, Improvement, ImprovementKey, Production, TerrainType, Tile,
};
pub use map_generator::{
    generate_map, ClimateBand, GeneratedMap, HexCoord, HexTile, MapGenerator, MapGeneratorError,
    Mulberry32, Terrain, WorldType,
};
pub use playable::{
    PlayableAdvancedParams, PlayableCity, PlayableError, PlayableGame, PlayableMap, PlayablePlayer,
    PlayableState, PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind,
    PlayableWorldDensity, StartGameParams, PLAYABLE_STATE_VERSION,
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
