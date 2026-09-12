//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::{
    generate_map, CanonicalState, CityDto, CityId, CityState, CivilizationDto, CivilizationState,
    ClimateBand, EngineError, GameState, GameStateDto, GeneratedMap, HexCoord, HexTile, MapDto,
    MapGenerator, MapGeneratorError, MapState, Mulberry32, Player, PlayerId, PositionDto, Rng,
    RngError, Terrain, TerrainDto, TileDto, Turn, TurnDto, TurnState, UnitDto, UnitId, UnitKindDto,
    UnitState, ValidationError, WorldType,
};
