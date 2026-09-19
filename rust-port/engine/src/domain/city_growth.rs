//! Deterministic city food and population growth.
//!
//! This module is intentionally independent from the rest of the engine.  The
//! TypeScript economy resolves one city's population change from the food flow
//! allocated to city development; the Rust port keeps that boundary and does
//! not silently mix in army food or terrain production.
//!
//! The normal-difficulty defaults are the canonical three-step population cap:
//! no building = 5, granary = 8, aqueduct = 12.

use serde::{Deserialize, Serialize};

/// Normal-difficulty population cap without either population building.
pub const DEFAULT_POPULATION_CAP: u32 = 5;
/// Population cap after building a granary, without an aqueduct.
pub const DEFAULT_GRANARY_POPULATION_CAP: u32 = 8;
/// Population cap after building an aqueduct (with or without a granary).
pub const DEFAULT_AQUEDUCT_POPULATION_CAP: u32 = 12;

/// Base part of the food threshold for one additional citizen.
pub const DEFAULT_GROWTH_THRESHOLD_BASE: f64 = 20.0;
/// Per-citizen part of the food threshold at the normal difficulty.
pub const DEFAULT_GROWTH_THRESHOLD_PER_POPULATION: f64 = 16.0;
/// Health coefficient used by the canonical economy formula.
pub const DEFAULT_HEALTH_GROWTH_MODIFIER: f64 = 0.05;
/// Fraction of the food buffer retained by a tier-one granary after growth.
pub const DEFAULT_GRANARY_FOOD_RETENTION: f64 = 0.5;
/// Fixed fraction retained by a tier-two granary after growth.
pub const DEFAULT_GRANARY_TIER_TWO_FOOD_RETENTION: f64 = 0.7;
/// Cities cannot starve below one citizen.
pub const DEFAULT_MINIMUM_POPULATION: u32 = 1;

/// Parameters resolved for one difficulty level.
///
/// The defaults are the current normal-difficulty data values.  Easy and hard
/// difficulty callers should construct this value from their resolved data
/// rather than changing the mechanics below.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct CityGrowthParams {
    /// Constant part of `Threshold(N) = base + N * per_population`.
    pub growth_threshold_base: f64,
    /// Population coefficient in the growth threshold.
    pub growth_threshold_per_population: f64,
    /// Extra threshold multiplier, for example a game-wide growth pace.
    pub growth_threshold_multiplier: f64,
    /// `max(0, 1 + health * health_growth_modifier)` for non-negative food flow.
    pub health_growth_modifier: f64,
    /// Cap with neither a granary nor an aqueduct.
    pub population_cap: u32,
    /// Cap with a granary but without an aqueduct.
    pub granary_population_cap: u32,
    /// Cap with an aqueduct, regardless of the granary state.
    pub aqueduct_population_cap: u32,
    /// Food-buffer fraction retained after a tier-one granary growth.
    pub granary_food_retention: f64,
    /// Food-buffer fraction retained after a tier-two granary growth.
    pub granary_tier_two_food_retention: f64,
    /// Minimum population after starvation.
    pub minimum_population: u32,
}

impl Default for CityGrowthParams {
    fn default() -> Self {
        Self {
            growth_threshold_base: DEFAULT_GROWTH_THRESHOLD_BASE,
            growth_threshold_per_population: DEFAULT_GROWTH_THRESHOLD_PER_POPULATION,
            growth_threshold_multiplier: 1.0,
            health_growth_modifier: DEFAULT_HEALTH_GROWTH_MODIFIER,
            population_cap: DEFAULT_POPULATION_CAP,
            granary_population_cap: DEFAULT_GRANARY_POPULATION_CAP,
            aqueduct_population_cap: DEFAULT_AQUEDUCT_POPULATION_CAP,
            granary_food_retention: DEFAULT_GRANARY_FOOD_RETENTION,
            granary_tier_two_food_retention: DEFAULT_GRANARY_TIER_TWO_FOOD_RETENTION,
            minimum_population: DEFAULT_MINIMUM_POPULATION,
        }
    }
}

impl CityGrowthParams {
    /// Return the current normal-difficulty defaults explicitly.
    pub const fn normal() -> Self {
        Self {
            growth_threshold_base: DEFAULT_GROWTH_THRESHOLD_BASE,
            growth_threshold_per_population: DEFAULT_GROWTH_THRESHOLD_PER_POPULATION,
            growth_threshold_multiplier: 1.0,
            health_growth_modifier: DEFAULT_HEALTH_GROWTH_MODIFIER,
            population_cap: DEFAULT_POPULATION_CAP,
            granary_population_cap: DEFAULT_GRANARY_POPULATION_CAP,
            aqueduct_population_cap: DEFAULT_AQUEDUCT_POPULATION_CAP,
            granary_food_retention: DEFAULT_GRANARY_FOOD_RETENTION,
            granary_tier_two_food_retention: DEFAULT_GRANARY_TIER_TWO_FOOD_RETENTION,
            minimum_population: DEFAULT_MINIMUM_POPULATION,
        }
    }
}

/// Persistent city fields consumed by the growth tick.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct CityGrowthState {
    /// Whole citizens currently living in the city.
    pub population: u32,
    /// Health score used only to modify a non-negative food flow.
    pub health: f64,
    /// A tier-one granary in this city.
    pub has_granary: bool,
    /// A tier-two granary in this city.  Tier two also implies a granary cap.
    pub has_granary_tier_two: bool,
    /// Compatibility spelling for callers ported directly from `maSpichlerzII`.
    /// Either tier-two flag enables the tier-two retention rule.
    pub has_granary_ii: bool,
    /// An aqueduct in this city.  It takes precedence over both granary flags.
    pub has_aqueduct: bool,
    /// Whole-food growth buffer carried between turns.
    pub food_store: i64,
}

impl Default for CityGrowthState {
    fn default() -> Self {
        Self {
            population: DEFAULT_MINIMUM_POPULATION,
            health: 0.0,
            has_granary: false,
            has_granary_tier_two: false,
            has_granary_ii: false,
            has_aqueduct: false,
            food_store: 0,
        }
    }
}

/// Result of resolving one city's food and population tick.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CityGrowthResult {
    /// Population after the tick.
    pub population: u32,
    /// Food buffer after the tick and any post-growth retention rule.
    pub food_store: i64,
    /// Whether the tick added one citizen.
    pub grew: bool,
    /// Whether the tick removed one citizen due to an empty food buffer.
    pub lost_population: bool,
    /// Whether positive growth was blocked because the city was at its cap.
    pub growth_frozen: bool,
    /// Cap used for this tick.
    pub population_cap: u32,
    /// Threshold calculated from the population at the start of this tick.
    pub growth_threshold: i64,
}

/// State used by the current (V85) fractional-growth path.
///
/// Food allocation is resolved before this state is advanced.  `fed` is
/// therefore an input to [`apply_fractional_growth`], not a hidden second
/// food ledger in this struct.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct FractionalGrowthState {
    pub population: u32,
    pub fractional_growth: f64,
}

impl Default for FractionalGrowthState {
    fn default() -> Self {
        Self {
            population: DEFAULT_MINIMUM_POPULATION,
            fractional_growth: 0.0,
        }
    }
}

/// Result of one V85 fractional growth tick.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct FractionalGrowthResult {
    pub population: u32,
    pub fractional_growth: f64,
    pub grew: bool,
    pub lost_population: bool,
    /// Positive growth was requested while the city was already at its cap.
    pub growth_frozen: bool,
}

/// Result of the V85 one-turn hunger check.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct HungerPenaltyResult {
    pub population: u32,
    pub unfed_turns: u32,
    pub lost_population: bool,
}

/// Resolve the hard population cap for the three building states.
///
/// An aqueduct is the upper step and therefore wins when both buildings are
/// present.  A tier-two granary is represented by `has_granary` at this
/// boundary; the caller decides the tier separately for food retention.
pub fn city_population_cap(
    has_aqueduct: bool,
    has_granary: bool,
    params: &CityGrowthParams,
) -> u32 {
    if has_aqueduct {
        params.aqueduct_population_cap
    } else if has_granary {
        params.granary_population_cap
    } else {
        params.population_cap
    }
}

/// Compatibility alias for callers that use the shorter domain term.
pub fn population_cap(has_aqueduct: bool, has_granary: bool, params: &CityGrowthParams) -> u32 {
    city_population_cap(has_aqueduct, has_granary, params)
}

/// Return the rounded food threshold for one additional citizen.
///
/// Positive `.5` values round upward, matching JavaScript `Math.round` for
/// this non-negative threshold.  A malformed/non-positive multiplier is
/// treated as the neutral multiplier rather than making growth free.
pub fn growth_threshold(population: u32, params: &CityGrowthParams) -> i64 {
    growth_threshold_with_multiplier(population, params, params.growth_threshold_multiplier)
}

/// Return the rounded threshold with an explicit pace multiplier.
pub fn growth_threshold_with_multiplier(
    population: u32,
    params: &CityGrowthParams,
    multiplier: f64,
) -> i64 {
    let base = params.growth_threshold_base
        + f64::from(population) * params.growth_threshold_per_population;
    let multiplier = if multiplier.is_finite() && multiplier > 0.0 {
        multiplier
    } else {
        1.0
    };
    round_to_i64((base * multiplier).max(1.0))
}

/// Apply the health modifier to a city's non-negative food flow.
///
/// Deficits are deliberately not health-boosted: the TypeScript economy uses
/// the raw negative flow so health cannot turn starvation into a smaller loss.
pub fn effective_food_flow(net_food: f64, health: f64, health_modifier: f64) -> f64 {
    if !net_food.is_finite() {
        return 0.0;
    }
    if net_food < 0.0 {
        return net_food;
    }

    let modifier = 1.0 + health * health_modifier;
    if !modifier.is_finite() {
        return 0.0;
    }
    net_food * modifier.max(0.0)
}

/// Apply the current fractional population growth formula.
///
/// This mirrors `population-growth-v85.ts::applyFractionalGrowthV85`:
/// positive `growth_percent` adds population slots while a city is below its
/// cap, and negative growth consumes slots while population is above one.
/// Several whole citizens may be crossed in one turn; any remainder stays in
/// `fractional_growth`.  An unfed city does not advance this buffer because
/// hunger is resolved separately by [`apply_hunger_penalty`].
pub fn apply_fractional_growth(
    state: &FractionalGrowthState,
    growth_percent: f64,
    fed: bool,
    has_aqueduct: bool,
    has_granary: bool,
    params: &CityGrowthParams,
) -> FractionalGrowthResult {
    let cap = city_population_cap(has_aqueduct, has_granary, params);
    let initial_population = state.population;
    let mut population = state.population;
    let mut fractional_growth = state.fractional_growth;
    let mut grew = false;
    let mut lost_population = false;

    if fed && growth_percent.is_finite() && growth_percent != 0.0 && population > 0 {
        if growth_percent > 0.0 && population < cap {
            fractional_growth += f64::from(population) * growth_percent / 100.0;
            while fractional_growth >= 1.0 && population < cap {
                population += 1;
                fractional_growth -= 1.0;
                grew = true;
            }
        } else if growth_percent < 0.0 && population > DEFAULT_MINIMUM_POPULATION {
            fractional_growth -= f64::from(population) * (-growth_percent) / 100.0;
            while fractional_growth >= 1.0 && population > DEFAULT_MINIMUM_POPULATION {
                population -= 1;
                fractional_growth -= 1.0;
                lost_population = true;
            }
        }
    }

    FractionalGrowthResult {
        population,
        fractional_growth,
        grew,
        lost_population,
        growth_frozen: fed
            && growth_percent.is_finite()
            && growth_percent > 0.0
            && initial_population >= cap,
    }
}

/// Compatibility name matching the TypeScript V85 function.
pub fn apply_fractional_growth_v85(
    state: &FractionalGrowthState,
    growth_percent: f64,
    fed: bool,
    has_aqueduct: bool,
    has_granary: bool,
    params: &CityGrowthParams,
) -> FractionalGrowthResult {
    apply_fractional_growth(
        state,
        growth_percent,
        fed,
        has_aqueduct,
        has_granary,
        params,
    )
}

/// Apply the V85 hunger rule: one unfed turn costs one citizen, down to one.
pub fn apply_hunger_penalty(population: u32, fed: bool, unfed_turns: u32) -> HungerPenaltyResult {
    if fed {
        return HungerPenaltyResult {
            population,
            unfed_turns: 0,
            lost_population: false,
        };
    }

    let next_unfed_turns = unfed_turns.saturating_add(1);
    if population > DEFAULT_MINIMUM_POPULATION {
        HungerPenaltyResult {
            population: population - 1,
            unfed_turns: 0,
            lost_population: true,
        }
    } else {
        HungerPenaltyResult {
            population,
            unfed_turns: next_unfed_turns,
            lost_population: false,
        }
    }
}

/// Return the fractional citizen-slot gain for a fed city this turn.
pub fn growth_gain_per_turn_slots(
    population: u32,
    growth_percent: f64,
    fed: bool,
    at_population_cap: bool,
) -> f64 {
    if !fed || !growth_percent.is_finite() || growth_percent == 0.0 || population == 0 {
        return 0.0;
    }
    if growth_percent > 0.0 && at_population_cap {
        return 0.0;
    }
    f64::from(population) * growth_percent / 100.0
}

/// Return the number of turns needed to reach the next whole citizen.
pub fn turns_until_next_citizen(fractional_growth: f64, gain_per_turn: f64) -> Option<u32> {
    if !gain_per_turn.is_finite() || gain_per_turn <= 0.0 {
        return None;
    }
    if fractional_growth >= 1.0 {
        return Some(0);
    }
    if !fractional_growth.is_finite() {
        return None;
    }

    let turns = ((1.0 - fractional_growth) / gain_per_turn).ceil();
    if !turns.is_finite() || turns < 0.0 {
        return None;
    }
    Some(turns.min(f64::from(u32::MAX)) as u32)
}

/// Resolve one city's population change without mutating the input state.
///
/// Rules mirrored from `economy.ts::populationGrowth`:
///
/// - add `floor(effective_food_flow)` to the food buffer;
/// - an empty buffer removes one citizen, but never below the configured
///   minimum;
/// - a full threshold adds exactly one citizen when below the cap;
/// - a granary retains its configured fraction after growth, while a tier-two
///   granary retains the fixed tier-two fraction;
/// - at the cap, food remains in the buffer and positive population growth is
///   frozen rather than consuming a threshold.
pub fn advance_city_growth(
    state: &CityGrowthState,
    net_food: f64,
    params: &CityGrowthParams,
) -> CityGrowthResult {
    let has_tier_two = state.has_granary_tier_two || state.has_granary_ii;
    let has_granary = state.has_granary || has_tier_two;
    let cap = city_population_cap(state.has_aqueduct, has_granary, params);
    let threshold = growth_threshold(state.population, params);
    let flow = effective_food_flow(net_food, state.health, params.health_growth_modifier);
    let food_delta = floor_to_i64(flow);
    let mut food_store = state.food_store.saturating_add(food_delta);
    let mut population = state.population;
    let mut grew = false;
    let mut lost_population = false;

    if food_store < 0 {
        food_store = 0;
        if population > params.minimum_population {
            population -= 1;
            lost_population = true;
        }
        return CityGrowthResult {
            population,
            food_store,
            grew,
            lost_population,
            growth_frozen: false,
            population_cap: cap,
            growth_threshold: threshold,
        };
    }

    if food_store >= threshold && population < cap {
        population = population.saturating_add(1);
        grew = true;

        let retention = if has_tier_two {
            params.granary_tier_two_food_retention
        } else if state.has_granary {
            params.granary_food_retention
        } else {
            0.0
        };
        food_store = floor_to_i64((food_store as f64) * retention);
    }

    CityGrowthResult {
        population,
        food_store,
        grew,
        lost_population,
        growth_frozen: population >= cap && !grew && flow >= 0.0,
        population_cap: cap,
        growth_threshold: threshold,
    }
}

/// Resolve growth with an explicit threshold multiplier, without mutation.
pub fn advance_city_growth_with_multiplier(
    state: &CityGrowthState,
    net_food: f64,
    params: &CityGrowthParams,
    multiplier: f64,
) -> CityGrowthResult {
    let mut adjusted = *params;
    adjusted.growth_threshold_multiplier = multiplier;
    advance_city_growth(state, net_food, &adjusted)
}

/// Compatibility name matching the TypeScript economy function.
pub fn population_growth(
    state: &CityGrowthState,
    net_food: f64,
    params: &CityGrowthParams,
) -> CityGrowthResult {
    advance_city_growth(state, net_food, params)
}

/// Apply one resolved tick in place and return its audit result.
pub fn apply_city_growth(
    state: &mut CityGrowthState,
    net_food: f64,
    params: &CityGrowthParams,
) -> CityGrowthResult {
    let result = advance_city_growth(state, net_food, params);
    state.population = result.population;
    state.food_store = result.food_store;
    result
}

fn floor_to_i64(value: f64) -> i64 {
    if value.is_nan() {
        return 0;
    }
    if value >= i64::MAX as f64 {
        return i64::MAX;
    }
    if value <= i64::MIN as f64 {
        return i64::MIN;
    }
    value.floor() as i64
}

fn round_to_i64(value: f64) -> i64 {
    if value.is_nan() {
        return 1;
    }
    if value >= i64::MAX as f64 {
        return i64::MAX;
    }
    if value <= i64::MIN as f64 {
        return i64::MIN;
    }
    value.round() as i64
}
