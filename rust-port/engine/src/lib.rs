//! Foundational domain API for the staged Rust engine.

pub mod domain;

pub use domain::building_costs::{
    building_cost, building_cost_for, building_work_cost, canonical_building_costs,
    effective_work_cost, spend_building_cost, try_spend_building_cost,
    validate_building_expenditure, BuildingCost, BuildingSpendError, BuildingSpendResult,
    ResourceStock,
};
pub use domain::city_growth::{
    advance_city_growth, advance_city_growth_with_multiplier, apply_city_growth,
    apply_fractional_growth, apply_fractional_growth_v85, apply_hunger_penalty,
    city_population_cap, effective_food_flow, growth_gain_per_turn_slots, growth_threshold,
    growth_threshold_with_multiplier, population_cap, population_growth, turns_until_next_citizen,
    CityGrowthParams, CityGrowthResult, CityGrowthState, FractionalGrowthResult,
    FractionalGrowthState, HungerPenaltyResult, DEFAULT_AQUEDUCT_POPULATION_CAP,
    DEFAULT_GRANARY_FOOD_RETENTION, DEFAULT_GRANARY_POPULATION_CAP,
    DEFAULT_GRANARY_TIER_TWO_FOOD_RETENTION, DEFAULT_GROWTH_THRESHOLD_BASE,
    DEFAULT_GROWTH_THRESHOLD_PER_POPULATION, DEFAULT_HEALTH_GROWTH_MODIFIER,
    DEFAULT_MINIMUM_POPULATION, DEFAULT_POPULATION_CAP,
};
pub use domain::hex::{
    hex_distance, neighbors, AxialCoord, CubeCoord, Direction, Hex, HexCoord, HexCoordParseError,
    HexDirection,
};
pub use domain::playable::{
    PlayableAdvancedParams, PlayableCity, PlayableError, PlayableGame, PlayableMap, PlayablePlayer,
    PlayableState, PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind,
    PlayableWorldDensity, StartGameParams, PLAYABLE_STATE_VERSION,
};
pub use domain::recruitment::{
    can_afford_recruitment, can_afford_unit_recruitment, canonical_recruitment_costs,
    recruitment_for, spend_recruitment, total_resource_upkeep, unit_recruitment,
    unit_resource_upkeep_for_turns, validate_recruitment, RecruitmentError, RecruitmentSpendResult,
    UnitRecruitment,
};
pub use domain::terrain::{
    can_found_city_on, is_passable_terrain, is_workable_terrain, BaseTerrain, TerenBazowy,
    Terrain as DomainTerrain, TerrainType, TileQualification,
};
pub use domain::turn_economy::{
    resolve_turn, settle_turn, EconomyBalances, EconomyFlow, PaidFlow, TurnEconomy,
    TurnEconomyError, TurnSettlement, UnpaidFlow,
};
pub use domain::{
    can_build_improvement, generate_map, improvement_production, production_for, qualifies,
    qualifies_improvement, resource_production, CanonicalState, CityDto, CityId, CityState,
    CivilizationDto, CivilizationState, ClimateBand, Deposit, EngineError, GameState, GameStateDto,
    GeneratedMap, HexTile, Improvement, ImprovementKey, MapDto, MapGenerator, MapGeneratorError,
    MapState, Mulberry32, Player, PlayerId, PositionDto, Production, Rng, RngError, Terrain,
    TerrainDto, Tile, TileDto, Turn, TurnDto, TurnEvent, TurnPhase, TurnState, UnitDto, UnitId,
    UnitKindDto, UnitState, ValidationError, WorldType, PHASE_COUNT,
};
