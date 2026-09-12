//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::{
    CanonicalState, CityDto, CityId, CityState, CivilizationDto, CivilizationState, EngineError,
    GameState, GameStateDto, MapDto, MapState, Player, PlayerId, PositionDto, Rng, RngError,
    TerrainDto, TileDto, Turn, TurnDto, TurnState, UnitDto, UnitId, UnitKindDto, UnitState,
    ValidationError,
};
