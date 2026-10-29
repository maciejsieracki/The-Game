//! Domain building blocks shared by future engine systems.

pub mod ai_era_unit_promotion;
pub mod ai_general_war_campaign;
pub mod army_consolidation;
pub mod army_leadership;
pub mod barbarians;
pub mod building_costs;
pub mod city_growth;
pub mod city_names;
pub mod civ_bonuses;
pub mod civ_matrix;
pub mod civ_names;
pub mod combat;
pub mod diplomacy;
mod error;
pub mod events;
pub mod formation_rules;
pub mod hex;
mod ids;
pub mod improvement_build;
pub mod improvements;
pub mod map_generator;
pub mod map_snapshot;
pub mod mapgen;
pub mod pathfinding;
pub mod playable;
pub mod player;
pub mod recruitment;
pub mod resource_production;
pub mod rng;
pub mod roads;
mod session;
pub mod start_position;
mod state;
pub mod terrain;
pub mod territory;

pub mod trade;
pub mod turn_economy;
pub mod types;
pub mod unit_epoch;
pub mod wonder_placement;

pub use error::EngineError;
pub use events::{canonical_phase_order, phase_order, TurnEvent, TurnPhase, PHASE_COUNT};
pub use ids::{CampId, CityId, OwnerRef, PlayerId, UnitId};
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
    CityDto, CivilizationDto, Difficulty, MapDto, PositionDto, TerrainDto, TileDto, TurnDto,
    UnitDto, UnitKindDto, ValidationError,
};
