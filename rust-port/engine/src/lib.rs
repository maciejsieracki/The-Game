//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::{
    can_build_improvement, generate_map, improvement_production, production_for, qualifies,
    qualifies_improvement, CanonicalState, CityDto, CityId, CityState, CivilizationDto,
    CivilizationState, ClimateBand, Deposit, EngineError, GameState, GameStateDto, GeneratedMap,
    HexCoord, HexTile, Improvement, ImprovementKey, MapDto, MapGenerator, MapGeneratorError,
    MapState, Mulberry32, Player, PlayerId, PositionDto, Production, Rng, RngError, Terrain,
    TerrainDto, TerrainType, Tile, TileDto, Turn, TurnDto, TurnState, UnitDto, UnitId, UnitKindDto,
    UnitState, ValidationError, WorldType,
};
