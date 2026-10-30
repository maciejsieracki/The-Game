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

// ---------------------------------------------------------------------------
// P6.7A - miasta: wzrost ludnosci, czesc A (R-RUSTPORT-P6-7A-MIASTA-WZROST-A-Q1).
//
// Port 1:1 (pin web `edb8fb56`) plikow `gra/src/game/`:
//   population-growth-v85.ts, growth-happiness.ts, population-growth-tempo.ts,
//   r-stawki-strojenie.ts, empire-food.ts.
// Stare funkcje powyzej (`advance_city_growth`, ...) to wczesniejszy, uproszczony model
// (`economy.ts::populationGrowth`) i zostaja bez zmian; ten modul go NIE zastepuje.
//
// Dane: `data/derived/wzrost-ludnosci-params.json`, `data/derived/era-diakrytyki.json`
// (parsery na koncu `data/derived.rs`). `DEFAULT_POZIOM_RACJI` i `WYZYWIENIE_MAX` zyja WYLACZNIE
// w `data/derived/cities-params.json` (P6.6B) - jedno zrodlo, czytane stad.
//
// Wstrzykniete zaleznosci spoza zakresu (PORTOWANY-Z-WSTRZYKNIETYMI):
//   - `militaryFoodConsumptionWithSpichlerz` (turn-economy.ts) -> domkniecie `military_food`,
//   - `rebalanceWorkersAfterPopulationChange` (okolica.ts) i `onCityPopulationChanged` -> `PopulationChangeHooks`.
// `refreshManpowerAfterPopChange` / `civManpowerMults` sa juz w Rust (`recruitment::manpower`).
// ---------------------------------------------------------------------------
pub mod p6_7a {
    use std::collections::{BTreeMap, BTreeSet};
    use std::sync::OnceLock;

    use crate::data::derived::{
        cities_params, era_diakrytyki_map, parse_racje, wzrost_ludnosci_params, RacjeRow,
    };
    use crate::data::economy_society::{parse_econ_params, EconParams};
    use crate::domain::civ_matrix::js_compat::{
        js_is_integer, js_math_round, js_number_to_string, js_to_fixed, js_trim,
    };
    use crate::domain::civ_matrix::{civ_matrix_param, load_civ_matrix};
    use crate::domain::ids::LEGACY_BARBARIAN_OWNER_ID;
    use crate::domain::recruitment::army_merge::{js_max, js_min};
    use crate::domain::recruitment::manpower::{
        civ_manpower_mults_legacy_edb8fb56, refresh_manpower_after_pop_change, CivBonusPoborLite,
        ManpowerCity,
    };
    use crate::domain::terrain::city_founding::p6_6b::cities::City;

    /// Tolerancja porownan zmiennoprzecinkowych w `empire-food.ts` (`1e-9`, `empire-food.ts:494` i `empire-food.ts:681`).
    const FOOD_EPSILON: f64 = 1e-9;

    /// Web `PoziomRacji` (`population-growth-v85.ts:25`).
    pub type PoziomRacji = f64;

    fn percent_whole() -> f64 {
        cities_params().procent_calosc
    }

    /// Web `GameDifficulty` (`difficulty-cost.ts`): JEDYNY typ trudnosci w `domain/`
    /// (`domain::types::Difficulty`, P3-22 etap 2 runda 3); klucze tabel i wektorow
    /// (`easy` / `normal` / `hard`) to `Difficulty::key()`.
    pub use crate::domain::types::Difficulty as GameDifficulty;

    /// Parsuje klucz trudnosci weba (`easy` / `normal` / `hard`).
    pub fn game_difficulty_from_web(s: &str) -> Option<GameDifficulty> {
        [
            GameDifficulty::Easy,
            GameDifficulty::Normal,
            GameDifficulty::Hard,
        ]
        .into_iter()
        .find(|d| d.key() == s)
    }

    // =======================================================================
    // population-growth-tempo.ts
    // =======================================================================
    pub mod tempo {
        use super::*;

        /// Web `WzrostLudnosciPace` (klucz tabeli).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum WzrostLudnosciPace {
            Wysoki,
            Normalny,
            Wolny,
        }

        impl WzrostLudnosciPace {
            pub fn from_web(s: &str) -> Option<Self> {
                match s {
                    "wysoki" => Some(Self::Wysoki),
                    "normalny" => Some(Self::Normalny),
                    "wolny" => Some(Self::Wolny),
                    _ => None,
                }
            }

            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Wysoki => "wysoki",
                    Self::Normalny => "normalny",
                    Self::Wolny => "wolny",
                }
            }

            /// Web `WZROST_LUDNOSCI_PACE[pace]`.
            pub fn multiplier(self) -> f64 {
                let t = &wzrost_ludnosci_params().tempo_wzrostu;
                match self {
                    Self::Wysoki => t.wysoki,
                    Self::Normalny => t.normalny,
                    Self::Wolny => t.wolny,
                }
            }
        }

        /// Web `WzrostLudnosciPace | number`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub enum PaceArg {
            Key(WzrostLudnosciPace),
            Multiplier(f64),
        }

        /// Web `applyGrowthThresholdPace` (`population-growth-tempo.ts:35`).
        pub fn apply_growth_threshold_pace(bazowy_prog: f64, pace: PaceArg) -> f64 {
            let mnoznik = match pace {
                PaceArg::Multiplier(m) => m,
                PaceArg::Key(k) => k.multiplier(),
            };
            js_max(
                wzrost_ludnosci_params().tempo_wzrostu.prog_min,
                js_math_round(bazowy_prog * mnoznik),
            )
        }
    }

    // =======================================================================
    // growth-happiness.ts
    // =======================================================================
    pub mod happiness {
        /// Web `computeGrowthHappinessNetto` (`growth-happiness.ts:24`): dwa ostatnie argumenty
        /// sa w webie swiadomie ignorowane (R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G3).
        pub fn compute_growth_happiness_netto(
            wealth_zadowolenie: f64,
            _ma_dostep_do_ceramiki: bool,
            _ma_dzialajacy_spichlerz: bool,
        ) -> f64 {
            if wealth_zadowolenie.is_finite() {
                wealth_zadowolenie
            } else {
                0.0
            }
        }
    }

    // =======================================================================
    // r-stawki-strojenie.ts
    // =======================================================================
    pub mod r_stawki {
        use super::*;

        /// Web `R_STAWKI_KOSZT_MULT`.
        pub fn r_stawki_koszt_mult() -> f64 {
            wzrost_ludnosci_params().r_stawki.koszt_mult
        }

        /// Web `R_STAWKI_FALA2_MULT`.
        pub fn r_stawki_fala2_mult() -> f64 {
            wzrost_ludnosci_params().r_stawki.fala2_mult
        }

        /// Web `R_STAWKI_FALA1_FALA2_MULT` = koszt x fala2.
        pub fn r_stawki_fala1_fala2_mult() -> f64 {
            r_stawki_koszt_mult() * r_stawki_fala2_mult()
        }

        // Stale algorytmu Hangul (Unicode 15, rozdz. 3.12) - struktura kodowania, nie balans.
        const HANGUL_S_BASE: u32 = 0xAC00;
        const HANGUL_L_BASE: u32 = 0x1100;
        const HANGUL_V_BASE: u32 = 0x1161;
        const HANGUL_T_BASE: u32 = 0x11A7;
        const HANGUL_L_COUNT: u32 = 19;
        const HANGUL_V_COUNT: u32 = 21;
        const HANGUL_T_COUNT: u32 = 28;
        const HANGUL_N_COUNT: u32 = HANGUL_V_COUNT * HANGUL_T_COUNT;
        const HANGUL_S_COUNT: u32 = HANGUL_L_COUNT * HANGUL_N_COUNT;

        /// `s.normalize('NFD').replace(/[̀-ͯ]/g, '')` (tabela `era-diakrytyki.json` +
        /// algorytm Hangul). Nie modeluje kanonicznej zmiany kolejnosci znakow laczacych
        /// spoza U+0300..U+036F (NIE_ZMIERZONO dla takich wejsc).
        pub fn nfd_without_combining(s: &str) -> String {
            let table = era_diakrytyki_map();
            let mut out = String::with_capacity(s.len());
            for ch in s.chars() {
                let cp = ch as u32;
                if (HANGUL_S_BASE..HANGUL_S_BASE + HANGUL_S_COUNT).contains(&cp) {
                    let index = cp - HANGUL_S_BASE;
                    let l = HANGUL_L_BASE + index / HANGUL_N_COUNT;
                    let v = HANGUL_V_BASE + (index % HANGUL_N_COUNT) / HANGUL_T_COUNT;
                    let t = HANGUL_T_BASE + index % HANGUL_T_COUNT;
                    out.push(char::from_u32(l).expect("hangul L"));
                    out.push(char::from_u32(v).expect("hangul V"));
                    if t != HANGUL_T_BASE {
                        out.push(char::from_u32(t).expect("hangul T"));
                    }
                } else if let Some(rep) = table.get(&cp) {
                    out.push_str(rep);
                } else {
                    out.push(ch);
                }
            }
            out
        }

        /// Web `stripDiacriticsLower` (nieeksportowana).
        pub fn strip_diacritics_lower(s: &str) -> String {
            js_trim(&nfd_without_combining(s)).to_lowercase()
        }

        /// Web `normalizeResearchEra` (`r-stawki-strojenie.ts:20`); `None` i `""` -> epoka domyslna.
        pub fn normalize_research_era(epoka: Option<&str>) -> String {
            let t = &wzrost_ludnosci_params().epoki_badan;
            let Some(e) = epoka.filter(|e| !e.is_empty()) else {
                return t.domyslna.clone();
            };
            let n = strip_diacritics_lower(e);
            for alias in &t.aliasy {
                if alias.warianty.contains(&n) {
                    return alias.kanon.clone();
                }
            }
            n
        }

        /// Web `isResearchEraFala2Extra` (`r-stawki-strojenie.ts:30`).
        pub fn is_research_era_fala2_extra(epoka: Option<&str>) -> bool {
            let era = normalize_research_era(epoka);
            wzrost_ludnosci_params()
                .epoki_badan
                .fala2_extra
                .contains(&era)
        }

        fn fala2_scaled(v: f64) -> f64 {
            js_max(
                wzrost_ludnosci_params().r_stawki.min_wartosc,
                js_math_round(v * r_stawki_fala2_mult()),
            )
        }

        /// Web `scaleStockCostRecord` (`r-stawki-strojenie.ts:36`). Wejscie: wpisy w kolejnosci
        /// obiektu; `None` w wartosci = wartosc spoza typu `number`.
        pub fn scale_stock_cost_record(
            raw: Option<&[(String, Option<f64>)]>,
        ) -> Vec<(String, f64)> {
            let mut out = Vec::new();
            let Some(raw) = raw else {
                return out;
            };
            for (k, v) in raw {
                if let Some(v) = v {
                    if v.is_finite() && *v > 0.0 {
                        out.push((k.clone(), fala2_scaled(*v)));
                    }
                }
            }
            out
        }

        /// Web `scaleImprovementWorkCost` (`r-stawki-strojenie.ts:50`).
        pub fn scale_improvement_work_cost(base: f64) -> f64 {
            if !base.is_finite() || base <= 0.0 {
                return 0.0;
            }
            fala2_scaled(base)
        }

        /// Web `scaledWonderWorkCost` (`r-stawki-strojenie.ts:56`).
        pub fn scaled_wonder_work_cost(koszt_budowy: f64) -> f64 {
            if !koszt_budowy.is_finite() || koszt_budowy <= 0.0 {
                return 0.0;
            }
            fala2_scaled(koszt_budowy)
        }

        /// Web `scaledWonderFoodCost` (`r-stawki-strojenie.ts:62`).
        pub fn scaled_wonder_food_cost(koszt_budowy: f64) -> f64 {
            scaled_wonder_work_cost(koszt_budowy)
        }
    }

    // =======================================================================
    // Wejscia z innych plikow weba (minimalny, przetestowany podzbior)
    // =======================================================================

    /// Web `SpichlerzCityBonusState` (`building-resource-gate.ts:340`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
    pub struct SpichlerzCityBonusState {
        pub ceramika_active: bool,
        pub sol_active: bool,
        pub ma_spichlerz_pop: bool,
        pub ma_spichlerz_ii_pop: bool,
    }

    /// Web `cityHasSpichlerzBuilding` (`building-resource-gate.ts:362`).
    pub fn city_has_spichlerz_building(built_ids: &[String]) -> bool {
        let t = &wzrost_ludnosci_params().spichlerz;
        built_ids.iter().any(|b| *b == t.id_i || *b == t.id_ii)
    }

    /// Web `spichlerzGrowthBonusPercent` (`building-resource-gate.ts:434`).
    pub fn spichlerz_growth_bonus_percent(state: &SpichlerzCityBonusState) -> f64 {
        let t = &wzrost_ludnosci_params().spichlerz;
        if state.ma_spichlerz_ii_pop {
            t.wzrost_proc_tier_ii
        } else if state.ma_spichlerz_pop {
            t.wzrost_proc_tier_i
        } else {
            t.wzrost_proc_brak
        }
    }

    /// Web `spichlerzRationFoodCostMultiplier` (`building-resource-gate.ts:441`).
    pub fn spichlerz_ration_food_cost_multiplier(state: &SpichlerzCityBonusState) -> f64 {
        let t = &wzrost_ludnosci_params().spichlerz;
        if state.ma_spichlerz_ii_pop {
            t.mnoznik_kosztu_racji_tier_ii
        } else if state.ma_spichlerz_pop {
            t.mnoznik_kosztu_racji_tier_i
        } else {
            t.mnoznik_kosztu_racji_brak
        }
    }

    /// Web `magazynEraMultiplier` (`economy-upkeep.ts:392`).
    pub fn magazyn_era_multiplier(era: f64) -> f64 {
        let t = &wzrost_ludnosci_params().magazyn_era;
        let e = if era.is_finite() && era > t.epoka_min {
            era
        } else {
            t.epoka_min
        };
        t.podstawa.powf(e - t.epoka_min)
    }

    /// Podzbior `EconParams` czytany przez wzrost ludnosci (`akwedukt*Ludnosci`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct PopCapParams {
        pub akwedukt_prog_ludnosci: f64,
        pub spichlerz_prog_ludnosci: f64,
        pub akwedukt_max_ludnosci: f64,
    }

    impl PopCapParams {
        /// Wartosci z `data/econ-params.json` (`ekonomia_miasta`) dla poziomu trudnosci.
        pub fn for_difficulty(d: GameDifficulty) -> Self {
            static ECON: OnceLock<EconParams> = OnceLock::new();
            let econ = ECON.get_or_init(|| parse_econ_params().expect("econ-params.json"));
            let m = &econ.ekonomia_miasta;
            let pick = |row: &crate::data::economy_society::EconParamsEkonomiaMiastaProgWzrostuWspolczynnik| -> f64 {
                let v = match d {
                    GameDifficulty::Easy => row.easy,
                    GameDifficulty::Normal => row.normal,
                    GameDifficulty::Hard => row.hard,
                };
                v as f64
            };
            Self {
                akwedukt_prog_ludnosci: pick(&m.akwedukt_prog_ludnosci),
                spichlerz_prog_ludnosci: pick(&m.spichlerz_prog_ludnosci),
                akwedukt_max_ludnosci: pick(&m.akwedukt_max_ludnosci),
            }
        }
    }

    fn delta_allowed(delta: f64) -> bool {
        wzrost_ludnosci_params()
            .limit_populacji
            .dozwolone_delta
            .contains(&delta)
    }

    /// Web `cityPopulationCap` (`economy.ts:1145`).
    pub fn city_population_cap(
        ma_akwedukt: bool,
        ma_spichlerz: bool,
        params: &PopCapParams,
        matrix_delta: f64,
    ) -> f64 {
        let building_cap = if ma_akwedukt {
            params.akwedukt_max_ludnosci
        } else if ma_spichlerz {
            params.spichlerz_prog_ludnosci
        } else {
            params.akwedukt_prog_ludnosci
        };
        let safe_delta = if delta_allowed(matrix_delta) {
            matrix_delta
        } else {
            0.0
        };
        js_min(
            wzrost_ludnosci_params().limit_populacji.twardy_max,
            building_cap + safe_delta,
        )
    }

    /// Web `resolvePopulationCapMatrixDelta` (`economy.ts:1163`).
    pub fn resolve_population_cap_matrix_delta(civ_key: Option<&str>) -> f64 {
        resolve_population_cap_matrix_delta_in(&load_civ_matrix().file, civ_key)
    }

    /// `resolve_population_cap_matrix_delta` na JAWNIE podanej macierzy (runda 2: wektory z macierza
    /// syntetyczna; wersja bez argumentu czyta wbudowany `civ-matrix.json`, jak web `loadCivMatrix()`).
    pub fn resolve_population_cap_matrix_delta_in(
        matrix: &crate::data::civilizations::CivMatrixFile,
        civ_key: Option<&str>,
    ) -> f64 {
        let value = match civ_key.filter(|k| !k.is_empty()) {
            Some(k) => civ_matrix_param(matrix, k, "lud_limit_populacji"),
            None => 0.0,
        };
        if delta_allowed(value) {
            value
        } else {
            0.0
        }
    }

    // =======================================================================
    // population-growth-v85.ts
    // =======================================================================
    pub mod growth_v85 {
        use super::*;

        /// Web `WYZYWIENIE_MIN`.
        pub fn wyzywienie_min() -> f64 {
            wzrost_ludnosci_params().wyzywienie.min
        }

        /// Web `WYZYWIENIE_MAX` (zrodlo: `cities-params.json`, jedno zrodlo).
        pub fn wyzywienie_max() -> f64 {
            cities_params().wejscia_z_innych_modulow_weba.wyzywienie_max
        }

        /// Web `WYZYWIENIE_STEP`.
        pub fn wyzywienie_step() -> f64 {
            wzrost_ludnosci_params().wyzywienie.krok
        }

        /// Web `DEFAULT_POZIOM_RACJI` (zrodlo: `cities-params.json`, jedno zrodlo).
        pub fn default_poziom_racji() -> PoziomRacji {
            cities_params()
                .wejscia_z_innych_modulow_weba
                .domyslny_poziom_racji
        }

        /// Web `WYZYWIENIE_LEVELS`: `Array.from({length: Math.round((MAX-MIN)/STEP)+1}, (_, i) => MIN + i*STEP)`.
        pub fn wyzywienie_levels() -> Vec<f64> {
            let length =
                js_math_round((wyzywienie_max() - wyzywienie_min()) / wyzywienie_step()) + 1.0;
            let n = if length.is_finite() && length > 0.0 {
                length as usize
            } else {
                0
            };
            (0..n)
                .map(|i| wyzywienie_min() + (i as f64) * wyzywienie_step())
                .collect()
        }

        /// Web `CIV_MATRIX_GROWTH_DIFFICULTY_MULT[difficulty]`.
        pub fn civ_matrix_growth_difficulty_mult(d: GameDifficulty) -> f64 {
            let t = &wzrost_ludnosci_params().trudnosc_mnoznik_macierzy;
            match d {
                GameDifficulty::Easy => t.easy,
                GameDifficulty::Normal => t.normal,
                GameDifficulty::Hard => t.hard,
            }
        }

        /// Web `civMatrixGrowthDifficultyMultiplier(difficulty = 'normal')`.
        pub fn civ_matrix_growth_difficulty_multiplier(d: Option<GameDifficulty>) -> f64 {
            civ_matrix_growth_difficulty_mult(d.unwrap_or_default())
        }

        /// Web `PopulationMatrixResolved`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct PopulationMatrixResolved {
            pub hunger_loss_multiplier: f64,
            pub health_growth_multiplier: f64,
            pub happiness_base: f64,
            pub population_cap_delta: f64,
        }

        fn finite_or_zero(x: f64) -> f64 {
            if x.is_finite() {
                x
            } else {
                0.0
            }
        }

        /// Web `resolvePopulationMatrixForCiv` (`population-growth-v85.ts:112`).
        pub fn resolve_population_matrix_for_civ(
            civ_key: Option<&str>,
        ) -> PopulationMatrixResolved {
            resolve_population_matrix_for_civ_in(&load_civ_matrix().file, civ_key)
        }

        /// `resolve_population_matrix_for_civ` na JAWNIE podanej macierzy (runda 2: wektory z macierza
        /// syntetyczna, np. `lud_spadek_proc` < -1, ktorego nie ma w prawdziwym `civ-matrix.json`).
        pub fn resolve_population_matrix_for_civ_in(
            matrix: &crate::data::civilizations::CivMatrixFile,
            civ_key: Option<&str>,
        ) -> PopulationMatrixResolved {
            let Some(key) = civ_key.filter(|k| !k.is_empty()) else {
                return PopulationMatrixResolved {
                    hunger_loss_multiplier: 1.0,
                    health_growth_multiplier: 1.0,
                    happiness_base: 0.0,
                    population_cap_delta: 0.0,
                };
            };
            let hunger_proc = civ_matrix_param(matrix, key, "lud_spadek_proc");
            let health_proc = civ_matrix_param(matrix, key, "lud_zdrowie_proc");
            let happiness = civ_matrix_param(matrix, key, "lud_zadowolenie_bazowe");
            PopulationMatrixResolved {
                hunger_loss_multiplier: js_max(0.0, 1.0 + finite_or_zero(hunger_proc)),
                health_growth_multiplier: js_max(0.0, 1.0 + finite_or_zero(health_proc)),
                happiness_base: finite_or_zero(happiness),
                population_cap_delta: resolve_population_cap_matrix_delta_in(matrix, Some(key)),
            }
        }

        /// Web `RationParams`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct RationParams {
            pub racje_zywnosc_1: f64,
            pub racje_zywnosc_2: f64,
            pub racje_zywnosc_3: f64,
            pub racje_wzrost_proc_1: f64,
            pub racje_wzrost_proc_2: f64,
            pub racje_wzrost_proc_3: f64,
        }

        /// Web `pick(row, d, fallback)` (`population-growth-v85.ts:134`) na surowym JSON.
        pub fn pick(row: Option<&serde_json::Value>, d: GameDifficulty, fallback: f64) -> f64 {
            let Some(row) = row else {
                return fallback;
            };
            match row.get(d.key()).and_then(serde_json::Value::as_f64) {
                Some(v) if v.is_finite() => v,
                _ => fallback,
            }
        }

        /// Sekcja `raw.ekonomia_miasta ?? raw`.
        pub fn section_of(raw: &serde_json::Value) -> &serde_json::Value {
            match raw.get("ekonomia_miasta") {
                Some(v) if !v.is_null() => v,
                _ => raw,
            }
        }

        /// Web `buildRationParams` (`population-growth-v85.ts:141`, @deprecated).
        pub fn build_ration_params(raw: &serde_json::Value, d: GameDifficulty) -> RationParams {
            let t = &wzrost_ludnosci_params().racje_domyslne_deprecated;
            let section = section_of(raw);
            RationParams {
                racje_zywnosc_1: pick(section.get("racje_zywnosc_1"), d, t.zywnosc[0]),
                racje_zywnosc_2: pick(section.get("racje_zywnosc_2"), d, t.zywnosc[1]),
                racje_zywnosc_3: pick(section.get("racje_zywnosc_3"), d, t.zywnosc[2]),
                racje_wzrost_proc_1: pick(section.get("racje_wzrost_proc_1"), d, t.wzrost_proc[0]),
                racje_wzrost_proc_2: pick(section.get("racje_wzrost_proc_2"), d, t.wzrost_proc[1]),
                racje_wzrost_proc_3: pick(section.get("racje_wzrost_proc_3"), d, t.wzrost_proc[2]),
            }
        }

        /// Web `clampPoziomRacji` (`population-growth-v85.ts:165`).
        pub fn clamp_poziom_racji(n: f64) -> PoziomRacji {
            let clamped = js_min(wyzywienie_max(), js_max(wyzywienie_min(), n));
            js_math_round(clamped / wyzywienie_step()) * wyzywienie_step()
        }

        /// Web `migrateLegacyRationLevel` (`population-growth-v85.ts:171`).
        pub fn migrate_legacy_ration_level(old: f64) -> PoziomRacji {
            for w in &wzrost_ludnosci_params().migracja_racji_legacy.wiersze {
                if old == w.stary {
                    return w.nowy;
                }
            }
            clamp_poziom_racji(old)
        }

        /// Web `migrateProcentRozwojToPoziomRacji` (`population-growth-v85.ts:179`).
        pub fn migrate_procent_rozwoj_to_poziom_racji(procent_rozwoj: Option<f64>) -> PoziomRacji {
            match procent_rozwoj {
                None => default_poziom_racji(),
                Some(p) => clamp_poziom_racji((p / percent_whole()) * wyzywienie_max()),
            }
        }

        /// Web `getCityRationLevel` (`population-growth-v85.ts:184`).
        pub fn get_city_ration_level(city: &City) -> PoziomRacji {
            match city.poziom_racji {
                Some(p) => clamp_poziom_racji(p),
                None => migrate_procent_rozwoj_to_poziom_racji(city.procent_rozwoj),
            }
        }

        fn racje_rows() -> &'static [RacjeRow] {
            static ROWS: OnceLock<Vec<RacjeRow>> = OnceLock::new();
            ROWS.get_or_init(|| parse_racje().expect("racje.json must parse").wiersze)
        }

        /// Web `rationFoodCostPerPop` (`population-growth-v85.ts:190`): `clampPoziomRacji(level) *
        /// R_STAWKI_KOSZT_MULT`. W Rust zywnosc na mieszkanca bierze sie z gotowej tabeli
        /// `data/derived/racje.json` (P3-19: mnoznik juz splaszczony), bez mnoznika w kodzie; poziom
        /// spoza siatki (tylko `NaN`) daje `NaN` jak mnozenie w webie. Drugi argument weba jest ignorowany.
        pub fn ration_food_cost_per_pop(level: PoziomRacji) -> f64 {
            let key = clamp_poziom_racji(level);
            racje_rows()
                .iter()
                .find(|r| r.poziom_racji == key)
                .map_or(f64::NAN, |r| f64::from(r.zywnosc_na_mieszkanca))
        }

        /// Web `rationGrowthPercent` (`population-growth-v85.ts:195`); drugi argument weba ignorowany.
        pub fn ration_growth_percent(level: PoziomRacji) -> f64 {
            let key = clamp_poziom_racji(level);
            for w in &wzrost_ludnosci_params().wyzywienie.wzrost_proc {
                if w.poziom == key {
                    return w.proc;
                }
            }
            0.0
        }

        /// Web `formatWyzwienieLabel` (`population-growth-v85.ts:200`).
        pub fn format_wyzwienie_label(level: PoziomRacji) -> String {
            let v = clamp_poziom_racji(level);
            if js_is_integer(v) {
                js_number_to_string(v)
            } else {
                js_to_fixed(v, 1).replacen('.', ",", 1)
            }
        }

        /// Web `rationEraFoodCostMultiplier` (`population-growth-v85.ts`, pin 91dc998a):
        /// Stone 1x, Bronze 2x, Iron+ 4x; non-finite or <=1 eras are neutral (1x).
        // web: gra/src/game/population-growth-v85.ts (rationEraFoodCostMultiplier)
        pub fn ration_era_food_cost_multiplier(owner_era: f64) -> f64 {
            if !owner_era.is_finite() || owner_era <= 1.0 {
                return 1.0;
            }
            if owner_era == 2.0 {
                2.0
            } else {
                4.0
            }
        }

        /// Web `computeCityRationCost` (`population-growth-v85.ts:205`, pin 91dc998a: + `ownerEra`).
        // web: gra/src/game/population-growth-v85.ts (computeCityRationCost)
        pub fn compute_city_ration_cost(
            population: f64,
            level: PoziomRacji,
            spichlerz_state: Option<&SpichlerzCityBonusState>,
            owner_era: f64,
        ) -> f64 {
            let base = js_max(0.0, population)
                * ration_food_cost_per_pop(level)
                * ration_era_food_cost_multiplier(owner_era);
            let mult = spichlerz_state.map_or(1.0, spichlerz_ration_food_cost_multiplier);
            base * mult
        }

        /// Web `GrowthPercentBreakdown`.
        #[derive(Debug, Clone, Copy, PartialEq, Default)]
        pub struct GrowthPercentBreakdown {
            pub total: f64,
            pub racje: f64,
            pub male_miasto: f64,
            pub spichlerz: f64,
            pub zdrowie: f64,
            pub szczescie: f64,
            pub cywilizacja: f64,
            pub zaopatrzenie: f64,
        }

        /// Web `GrowthPercentInput`.
        #[derive(Debug, Clone, PartialEq)]
        pub struct GrowthPercentInput {
            pub population: f64,
            pub poziom_racji: PoziomRacji,
            pub zdrowie: f64,
            pub szczescie_netto: f64,
            pub wealth_poziom: f64,
            pub spichlerz_state: SpichlerzCityBonusState,
            pub civ_key: Option<String>,
            pub difficulty: Option<GameDifficulty>,
            pub ration_params: RationParams,
            pub citizen_resource_growth_pct: Option<f64>,
            pub population_matrix: Option<PopulationMatrixResolved>,
        }

        /// Web `computeGrowthPercentV85` (`population-growth-v85.ts:254`).
        pub fn compute_growth_percent_v85(input: &GrowthPercentInput) -> GrowthPercentBreakdown {
            let s = &wzrost_ludnosci_params().skladniki_wzrostu;
            let racje = ration_growth_percent(input.poziom_racji);
            let male_miasto = js_max(0.0, s.male_miasto_prog - input.population);
            let spichlerz = spichlerz_growth_bonus_percent(&input.spichlerz_state);
            let population_matrix = input
                .population_matrix
                .unwrap_or_else(|| resolve_population_matrix_for_civ(input.civ_key.as_deref()));
            let zdrowie_bazowe = (js_max(0.0, input.zdrowie) / s.zdrowie_na_punkt).floor();
            let zdrowie = zdrowie_bazowe * population_matrix.health_growth_multiplier;
            let szczescie = (js_max(0.0, input.szczescie_netto) / s.szczescie_na_punkt).floor();
            let civ_raw = match input.civ_key.as_deref().filter(|k| !k.is_empty()) {
                Some(k) => civ_matrix_param(&load_civ_matrix().file, k, "lud_wzrost_proc"),
                None => 0.0,
            };
            let civ_difficulty_mult = civ_matrix_growth_difficulty_multiplier(input.difficulty);
            let cywilizacja = js_math_round(civ_raw * civ_difficulty_mult * s.cywilizacja_skala);
            let zaopatrzenie = input.citizen_resource_growth_pct.unwrap_or(0.0);
            let total =
                racje + male_miasto + spichlerz + zdrowie + szczescie + cywilizacja + zaopatrzenie;
            GrowthPercentBreakdown {
                total,
                racje,
                male_miasto,
                spichlerz,
                zdrowie,
                szczescie,
                cywilizacja,
                zaopatrzenie,
            }
        }

        /// Web `FractionalGrowthResult`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct FractionalGrowthResult {
            pub nowa_ludnosc: f64,
            pub wzrost_ulamkowy: f64,
            pub wzrost: bool,
            pub ubytek: bool,
        }

        /// Web `applyFractionalGrowthV85` (`population-growth-v85.ts:286`).
        #[allow(clippy::too_many_arguments)]
        pub fn apply_fractional_growth_v85(
            population: f64,
            wzrost_ulamkowy: Option<f64>,
            growth_pct: f64,
            fed: bool,
            ma_akwedukt: bool,
            econ_params: &PopCapParams,
            ma_spichlerz: bool,
            population_cap_delta: f64,
        ) -> FractionalGrowthResult {
            let mut pop = population;
            let mut frac = wzrost_ulamkowy.unwrap_or(0.0);
            let mut wzrost = false;
            let mut ubytek = false;
            let hundred = percent_whole();

            if fed && growth_pct != 0.0 && pop > 0.0 {
                let pop_cap = city_population_cap(
                    ma_akwedukt,
                    ma_spichlerz,
                    econ_params,
                    population_cap_delta,
                );
                if growth_pct > 0.0 && pop < pop_cap {
                    frac += pop * growth_pct / hundred;
                    while frac >= 1.0 && pop < pop_cap {
                        pop += 1.0;
                        frac -= 1.0;
                        wzrost = true;
                    }
                } else if growth_pct < 0.0 && pop > 1.0 {
                    frac -= pop * (-growth_pct) / hundred;
                    while frac >= 1.0 && pop > 1.0 {
                        pop -= 1.0;
                        frac -= 1.0;
                        ubytek = true;
                    }
                }
            }

            FractionalGrowthResult {
                nowa_ludnosc: pop,
                wzrost_ulamkowy: frac,
                wzrost,
                ubytek,
            }
        }

        /// Web `growthGainPerTurnSlots` (`population-growth-v85.ts:323`).
        pub fn growth_gain_per_turn_slots(
            population: f64,
            growth_pct: f64,
            fed: bool,
            at_pop_cap: bool,
        ) -> f64 {
            if !fed || growth_pct == 0.0 || population <= 0.0 {
                return 0.0;
            }
            if growth_pct > 0.0 && at_pop_cap {
                return 0.0;
            }
            population * growth_pct / percent_whole()
        }

        /// Web `turnsUntilNextCitizen` (`population-growth-v85.ts:335`); `None` = `null`.
        pub fn turns_until_next_citizen(
            wzrost_ulamkowy: Option<f64>,
            gain_per_turn: f64,
        ) -> Option<f64> {
            if gain_per_turn <= 0.0 {
                return None;
            }
            let frac = wzrost_ulamkowy.unwrap_or(0.0);
            if frac >= 1.0 {
                return Some(0.0);
            }
            Some(((1.0 - frac) / gain_per_turn).ceil())
        }

        /// Wynik `applyHungerPenaltyV85`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct HungerPenaltyResult {
            pub nowa_ludnosc: f64,
            pub tury_bez_doplaty: f64,
            pub ubytek: bool,
            pub hunger_loss_ulamkowy: f64,
        }

        /// Web `applyHungerPenaltyV85` (`population-growth-v85.ts:346`).
        pub fn apply_hunger_penalty_v85(
            population: f64,
            fed: bool,
            tury_bez_doplaty: Option<f64>,
            hunger_loss_multiplier: f64,
            hunger_loss_ulamkowy: f64,
        ) -> HungerPenaltyResult {
            if fed {
                return HungerPenaltyResult {
                    nowa_ludnosc: population,
                    tury_bez_doplaty: 0.0,
                    ubytek: false,
                    hunger_loss_ulamkowy: 0.0,
                };
            }
            let next_tury = tury_bez_doplaty.unwrap_or(0.0) + 1.0;
            let mut pop = population;
            let mut debt = if hunger_loss_ulamkowy.is_finite() {
                js_max(0.0, hunger_loss_ulamkowy)
            } else {
                0.0
            };
            debt += if hunger_loss_multiplier.is_finite() {
                js_max(0.0, hunger_loss_multiplier)
            } else {
                1.0
            };
            let mut ubytek = false;
            while debt >= 1.0 && pop > 1.0 {
                pop -= 1.0;
                debt -= 1.0;
                ubytek = true;
            }
            HungerPenaltyResult {
                nowa_ludnosc: pop,
                tury_bez_doplaty: if ubytek { 0.0 } else { next_tury },
                ubytek,
                hunger_loss_ulamkowy: debt,
            }
        }

        /// `City` z polami, ktorych brakuje w `City` P6.6B (`state.rs`, poza allowlista):
        /// `hungerLossUlamkowy` (rozszerzenie `City & {...}` w `population-growth-v85.ts`) i `manpower`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct GrowthCity {
            pub city: City,
            pub hunger_loss_ulamkowy: Option<f64>,
            pub manpower: Option<f64>,
        }

        impl GrowthCity {
            pub fn new(city: City) -> Self {
                Self {
                    city,
                    hunger_loss_ulamkowy: None,
                    manpower: None,
                }
            }
        }

        /// Web `ensureCityRationDefaults` (`population-growth-v85.ts:374`).
        pub fn ensure_city_ration_defaults(gc: &mut GrowthCity) {
            let legacy = &wzrost_ludnosci_params().migracja_racji_legacy.wiersze;
            let lo = legacy.iter().map(|w| w.stary).fold(f64::INFINITY, f64::min);
            let hi = legacy
                .iter()
                .map(|w| w.stary)
                .fold(f64::NEG_INFINITY, f64::max);
            let c = &mut gc.city;
            if !c.ration_migrated_v114.unwrap_or(false) {
                match (c.poziom_racji, c.procent_rozwoj) {
                    (Some(p), _) if js_is_integer(p) && p >= lo && p <= hi => {
                        c.poziom_racji = Some(migrate_legacy_ration_level(p));
                    }
                    (None, Some(proc_)) => {
                        c.poziom_racji = Some(migrate_procent_rozwoj_to_poziom_racji(Some(proc_)));
                    }
                    _ => {}
                }
                c.ration_migrated_v114 = Some(true);
            }
            match c.poziom_racji {
                None => c.poziom_racji = Some(default_poziom_racji()),
                Some(p) => c.poziom_racji = Some(clamp_poziom_racji(p)),
            }
            if c.wzrost_ulamkowy.is_none() {
                c.wzrost_ulamkowy = Some(0.0);
            }
            if c.tury_bez_doplaty.is_none() {
                c.tury_bez_doplaty = Some(0.0);
            }
            if gc.hunger_loss_ulamkowy.is_none() {
                gc.hunger_loss_ulamkowy = Some(0.0);
            }
        }

        /// Haki zaleznosci spoza zakresu P6.7A wolane przez `applyPostCentralPopulationGrowth`.
        pub trait PopulationChangeHooks {
            /// Web `rebalanceWorkersAfterPopulationChange(city, map, before, after, territoryNodes, exclude)`
            /// (`okolica.ts:437`) - `map` i `territoryNodes` posiada implementacja.
            fn rebalance_workers_after_population_change(
                &mut self,
                city: &mut GrowthCity,
                pop_before: f64,
                pop_after: f64,
                exclude_hex_keys: Option<&BTreeSet<String>>,
            );

            /// Web `onCityPopulationChanged?.(city.id)`.
            fn on_city_population_changed(&mut self, city_id: &str);
        }

        /// Opcje `applyPostCentralPopulationGrowth` bez tablic mutowanych (`cities`, `econ`, wiersze).
        #[derive(Debug, Clone)]
        pub struct PostCentralGrowthOpts<'a> {
            pub pop_cap_params: PopCapParams,
            pub ration_params: RationParams,
            pub owner_civ_by_owner_id: Option<&'a BTreeMap<i64, String>>,
            pub spichlerz_by_city: Option<&'a BTreeMap<String, SpichlerzCityBonusState>>,
            pub happiness_by_city_id: Option<&'a BTreeMap<String, f64>>,
            pub built_by_city: Option<&'a BTreeMap<String, Vec<String>>>,
            pub owner_era_by_owner: Option<&'a BTreeMap<i64, f64>>,
            pub difficulty: Option<GameDifficulty>,
            pub population_matrix_by_owner_id: Option<&'a BTreeMap<i64, PopulationMatrixResolved>>,
            pub civ_bonusy_by_owner: Option<&'a BTreeMap<i64, Vec<CivBonusPoborLite>>>,
            pub citizen_growth_pct_by_city_id: Option<&'a BTreeMap<String, f64>>,
            pub exclude_hex_keys_by_city: Option<&'a BTreeMap<String, BTreeSet<String>>>,
        }

        /// Web `applyPostCentralPopulationGrowth` (`population-growth-v85.ts:468`); migawka
        /// `efResult.perOwner` to `EmpireFoodTick` (struktura `CentralFoodFedSnapshot` jest jej podzbiorem).
        pub fn apply_post_central_population_growth(
            cities: &mut [GrowthCity],
            econ: &mut EconomyTickResult,
            ef_per_owner: &mut [EmpireFoodTick],
            opts: &PostCentralGrowthOpts<'_>,
            hooks: &mut dyn PopulationChangeHooks,
        ) {
            let difficulty = opts.difficulty.unwrap_or_default();
            for owner_tick in ef_per_owner.iter_mut() {
                for row_index in 0..owner_tick.per_city_rows.len() {
                    let row_city_id = owner_tick.per_city_rows[row_index].city_id.clone();
                    let Some(city_index) = cities.iter().position(|c| c.city.id == row_city_id)
                    else {
                        continue;
                    };
                    let Some(tick_index) =
                        econ.per_city.iter().position(|t| t.city_id == row_city_id)
                    else {
                        continue;
                    };
                    if econ.per_city[tick_index].oblegany {
                        continue;
                    }

                    owner_tick.per_city_rows[row_index].name = cities[city_index].city.name.clone();

                    let fed = owner_tick
                        .fed_by_city_id
                        .get(&row_city_id)
                        .copied()
                        .unwrap_or(false);
                    let tick_snapshot = econ.per_city[tick_index].clone();
                    let spichlerz = opts
                        .spichlerz_by_city
                        .and_then(|m| m.get(&row_city_id))
                        .copied()
                        .unwrap_or(SpichlerzCityBonusState {
                            ceramika_active: tick_snapshot.spichlerz_ceramika.unwrap_or(false),
                            sol_active: tick_snapshot.spichlerz_sol.unwrap_or(false),
                            ma_spichlerz_pop: tick_snapshot.ma_spichlerz.unwrap_or(false),
                            ma_spichlerz_ii_pop: tick_snapshot.ma_spichlerz_ii.unwrap_or(false),
                        });
                    let empty: Vec<String> = Vec::new();
                    let built_ids = opts
                        .built_by_city
                        .and_then(|m| m.get(&cities[city_index].city.id))
                        .unwrap_or(&empty);
                    let ma_akwedukt = built_ids
                        .iter()
                        .any(|b| *b == wzrost_ludnosci_params().spichlerz.id_akwedukt);
                    let ma_spichlerz_building = city_has_spichlerz_building(built_ids);
                    let happiness = opts
                        .happiness_by_city_id
                        .and_then(|m| m.get(&row_city_id))
                        .copied()
                        .unwrap_or(0.0);
                    let citizen_growth_pct = opts
                        .citizen_growth_pct_by_city_id
                        .and_then(|m| m.get(&row_city_id))
                        .copied()
                        .unwrap_or(0.0);
                    let owner_id = cities[city_index].city.owner_id;
                    let owner_civ = opts
                        .owner_civ_by_owner_id
                        .and_then(|m| m.get(&owner_id))
                        .map(String::as_str);
                    let population_matrix = opts
                        .population_matrix_by_owner_id
                        .and_then(|m| m.get(&owner_id))
                        .copied()
                        .unwrap_or_else(|| resolve_population_matrix_for_civ(owner_civ));
                    let wealth_poziom = cities[city_index]
                        .city
                        .wealth_state
                        .map_or(1.0, |w| w.poziom);
                    let breakdown = compute_growth_percent_v85(&GrowthPercentInput {
                        population: cities[city_index].city.population,
                        poziom_racji: get_city_ration_level(&cities[city_index].city),
                        zdrowie: tick_snapshot.zdrowie,
                        szczescie_netto: happiness,
                        wealth_poziom,
                        spichlerz_state: spichlerz,
                        civ_key: owner_civ.map(str::to_string),
                        difficulty: Some(difficulty),
                        ration_params: opts.ration_params,
                        citizen_resource_growth_pct: Some(citizen_growth_pct),
                        population_matrix: Some(population_matrix),
                    });
                    {
                        let row = &mut owner_tick.per_city_rows[row_index];
                        row.wzrost_procent = breakdown.total;
                        row.breakdown = Some(breakdown);
                        row.nakarmione = fed;
                    }

                    let before = cities[city_index].city.population;
                    let hunger = apply_hunger_penalty_v85(
                        cities[city_index].city.population,
                        fed,
                        cities[city_index].city.tury_bez_doplaty,
                        population_matrix.hunger_loss_multiplier,
                        cities[city_index].hunger_loss_ulamkowy.unwrap_or(0.0),
                    );
                    cities[city_index].city.tury_bez_doplaty = Some(hunger.tury_bez_doplaty);
                    cities[city_index].hunger_loss_ulamkowy = Some(hunger.hunger_loss_ulamkowy);
                    cities[city_index].city.population = hunger.nowa_ludnosc;

                    let growth = apply_fractional_growth_v85(
                        cities[city_index].city.population,
                        cities[city_index].city.wzrost_ulamkowy,
                        if fed { breakdown.total } else { 0.0 },
                        fed,
                        ma_akwedukt,
                        &opts.pop_cap_params,
                        ma_spichlerz_building,
                        population_matrix.population_cap_delta,
                    );
                    cities[city_index].city.population = growth.nowa_ludnosc;
                    cities[city_index].city.wzrost_ulamkowy = Some(growth.wzrost_ulamkowy);

                    {
                        let tick = &mut econ.per_city[tick_index];
                        tick.ludnosc_po = Some(cities[city_index].city.population);
                        tick.wzrost = Some(growth.wzrost);
                        tick.ubytek = Some(hunger.ubytek || growth.ubytek);
                        tick.wzrost_procent = Some(breakdown.total);
                        tick.wzrost_ulamkowy_po = Some(growth.wzrost_ulamkowy);
                        tick.magazyn_po_turze = Some(growth.wzrost_ulamkowy);
                    }

                    let after = cities[city_index].city.population;
                    if after != before {
                        let city_id = cities[city_index].city.id.clone();
                        hooks.rebalance_workers_after_population_change(
                            &mut cities[city_index],
                            before,
                            after,
                            opts.exclude_hex_keys_by_city.and_then(|m| m.get(&city_id)),
                        );
                        let owner_era = opts
                            .owner_era_by_owner
                            .and_then(|m| m.get(&owner_id))
                            .copied()
                            .unwrap_or(1.0);
                        // KOMPATYBILNOSC P6.7A (pin edb8fb56) do portu population-growth-v85 (Czesc B).
                        let (_regen, max_mult) = civ_manpower_mults_legacy_edb8fb56(
                            opts.civ_bonusy_by_owner
                                .and_then(|m| m.get(&owner_id))
                                .map(Vec::as_slice),
                        );
                        let mp_city = ManpowerCity {
                            id: city_id.clone(),
                            owner_id,
                            population: after,
                            manpower: cities[city_index].manpower,
                            q: cities[city_index].city.q as i32,
                            r: cities[city_index].city.r as i32,
                            oblegane: None,
                        };
                        cities[city_index].manpower = Some(refresh_manpower_after_pop_change(
                            &mp_city,
                            owner_era,
                            Some(before),
                            max_mult,
                        ));
                        hooks.on_city_population_changed(&city_id);
                    }

                    if growth.wzrost {
                        econ.growth += 1.0;
                    }
                    if hunger.ubytek || growth.ubytek {
                        econ.starved += 1.0;
                    }
                }
            }
        }
    }

    /// Web `applyCentralFoodPopulationGrowth(efResult, opts)` (`population-growth-v85.ts:575`):
    /// cienka nakladka na `applyPostCentralPopulationGrowth` z wynikiem `advanceEmpireFood`.
    pub fn apply_central_food_population_growth(
        ef_result: &mut EmpireFoodTickResult,
        cities: &mut [GrowthCity],
        econ: &mut EconomyTickResult,
        opts: &growth_v85::PostCentralGrowthOpts<'_>,
        hooks: &mut dyn growth_v85::PopulationChangeHooks,
    ) {
        growth_v85::apply_post_central_population_growth(
            cities,
            econ,
            &mut ef_result.per_owner,
            opts,
            hooks,
        );
    }

    pub use growth_v85::{
        apply_post_central_population_growth, clamp_poziom_racji, get_city_ration_level,
        GrowthCity, GrowthPercentBreakdown, PopulationMatrixResolved, RationParams,
    };

    // =======================================================================
    // Wejscia turn-economy.ts (EconomyTickResult, CityEconomyTick)
    // =======================================================================

    /// Podzbior web `CityEconomyTick` (`turn-economy.ts`) czytany lub pisany przez P6.7A.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct CityEconomyTick {
        pub city_id: String,
        pub owner_id: i64,
        pub oblegany: bool,
        pub zywnosc_brutto: Option<f64>,
        pub zywnosc_netto: f64,
        pub koszt_racji: Option<f64>,
        pub bilans_lokalny: Option<f64>,
        pub poziom_racji: Option<f64>,
        pub zdrowie: f64,
        pub spichlerz_ceramika: Option<bool>,
        pub spichlerz_sol: Option<bool>,
        pub ma_spichlerz: Option<bool>,
        pub ma_spichlerz_ii: Option<bool>,
        pub ludnosc_po: Option<f64>,
        pub wzrost: Option<bool>,
        pub ubytek: Option<bool>,
        pub wzrost_procent: Option<f64>,
        pub wzrost_ulamkowy_po: Option<f64>,
        pub magazyn_po_turze: Option<f64>,
        /// Web `CityEconomyTick.ownerEra` (pin 91dc998a): era for era-scaled Racja cost; `None` = 1.
        pub owner_era: Option<f64>,
    }

    /// Podzbior web `EconomyTickResult`.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct EconomyTickResult {
        pub per_city: Vec<CityEconomyTick>,
        pub growth: f64,
        pub starved: f64,
    }

    /// Web `computeCityFoodBalanceV85` (`turn-economy.ts:1640`, pin 91dc998a: + `ownerEra`):
    /// (`kosztRacji`, `bilansLokalny`, `poziomRacji`).
    // web: gra/src/game/turn-economy.ts (computeCityFoodBalanceV85)
    pub fn compute_city_food_balance_v85(
        zywnosc_brutto: f64,
        population: f64,
        city: &City,
        spichlerz_state: Option<&SpichlerzCityBonusState>,
        owner_era: f64,
    ) -> (f64, f64, f64) {
        let poziom_racji = growth_v85::get_city_ration_level(city);
        let koszt_racji = growth_v85::compute_city_ration_cost(
            population,
            poziom_racji,
            spichlerz_state,
            owner_era,
        );
        (koszt_racji, zywnosc_brutto - koszt_racji, poziom_racji)
    }

    /// Web `recomputeCityFoodBalancesInEcon` (`turn-economy.ts:1662`).
    pub fn recompute_city_food_balances_in_econ(
        per_city: &mut [CityEconomyTick],
        cities: &[GrowthCity],
        spichlerz_by_city: Option<&BTreeMap<String, SpichlerzCityBonusState>>,
    ) {
        for tick in per_city.iter_mut() {
            // `new Map(cities.map(c => [c.id, c]))`: przy powtorzonym id wygrywa ostatnie.
            let Some(gc) = cities.iter().rev().find(|c| c.city.id == tick.city_id) else {
                continue;
            };
            let spichlerz = spichlerz_by_city
                .and_then(|m| m.get(&tick.city_id))
                .copied()
                .unwrap_or(SpichlerzCityBonusState {
                    ceramika_active: tick.spichlerz_ceramika.unwrap_or(false),
                    sol_active: tick.spichlerz_sol.unwrap_or(false),
                    ma_spichlerz_pop: tick.ma_spichlerz.unwrap_or(false),
                    ma_spichlerz_ii_pop: tick.ma_spichlerz_ii.unwrap_or(false),
                });
            let produkcja = tick.zywnosc_brutto.unwrap_or_else(|| {
                js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
            });
            // web: `tick.ownerEra ?? 1` (turn-economy.ts recomputeCityFoodBalancesInEcon)
            let (koszt, bilans, poziom) = compute_city_food_balance_v85(
                produkcja,
                gc.city.population,
                &gc.city,
                Some(&spichlerz),
                tick.owner_era.unwrap_or(1.0),
            );
            tick.koszt_racji = Some(koszt);
            tick.bilans_lokalny = Some(bilans);
            tick.zywnosc_netto = bilans;
            tick.poziom_racji = Some(poziom);
        }
    }

    // =======================================================================
    // empire-food.ts
    // =======================================================================
    pub mod empire_food {
        use super::growth_v85::{
            clamp_poziom_racji, ensure_city_ration_defaults, get_city_ration_level, pick,
            ration_growth_percent, section_of, wyzywienie_levels, wyzywienie_min,
        };
        use super::*;

        /// Web `isBarbarian` (`barbarians.ts:52`).
        fn is_barbarian(owner_id: i64) -> bool {
            owner_id == LEGACY_BARBARIAN_OWNER_ID
        }

        /// Web `EmpireFoodState`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct EmpireFoodState {
            pub zapasy_panstwa: f64,
            pub procent_rozwoj: Option<f64>,
            pub tury_ujemnych_zapasow: Option<f64>,
        }

        /// `Map<number, EmpireFoodState>` z zachowana kolejnoscia wstawiania.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct OwnerFoodStates {
            entries: Vec<(i64, EmpireFoodState)>,
        }

        impl OwnerFoodStates {
            pub fn new() -> Self {
                Self::default()
            }

            pub fn has(&self, owner_id: i64) -> bool {
                self.entries.iter().any(|(k, _)| *k == owner_id)
            }

            pub fn get(&self, owner_id: i64) -> Option<&EmpireFoodState> {
                self.entries
                    .iter()
                    .find(|(k, _)| *k == owner_id)
                    .map(|(_, v)| v)
            }

            pub fn get_mut(&mut self, owner_id: i64) -> Option<&mut EmpireFoodState> {
                self.entries
                    .iter_mut()
                    .find(|(k, _)| *k == owner_id)
                    .map(|(_, v)| v)
            }

            /// `Map.set`: istniejacy klucz zachowuje miejsce.
            pub fn set(&mut self, owner_id: i64, state: EmpireFoodState) {
                if let Some(slot) = self.get_mut(owner_id) {
                    *slot = state;
                } else {
                    self.entries.push((owner_id, state));
                }
            }

            pub fn keys(&self) -> Vec<i64> {
                self.entries.iter().map(|(k, _)| *k).collect()
            }

            pub fn entries(&self) -> &[(i64, EmpireFoodState)] {
                &self.entries
            }
        }

        /// Web `EmpireFoodParams`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct EmpireFoodParams {
            pub central_cap_baza: f64,
            pub central_cap_bonus_magazyn: f64,
            pub glod_wojska_hp_frac: f64,
            pub glod_wojska_karencja_tur: f64,
            pub glod_wojska_stat_mult: f64,
            pub ration_params: RationParams,
        }

        /// `value ?? fallback` dla `null` / `undefined` (brak klucza).
        fn nn(a: Option<&serde_json::Value>) -> Option<&serde_json::Value> {
            a.filter(|v| !v.is_null())
        }

        /// Web `buildEmpireFoodParams` (`empire-food.ts:106`) na surowym JSON (`econ-params.json`).
        pub fn build_empire_food_params(
            raw: &serde_json::Value,
            d: GameDifficulty,
        ) -> EmpireFoodParams {
            let t = &wzrost_ludnosci_params().empire_food_domyslne;
            let em = section_of(raw);
            let gl = match raw.get("globalne") {
                Some(v) if !v.is_null() => v,
                _ => raw,
            };
            EmpireFoodParams {
                central_cap_baza: pick(
                    nn(gl.get("magazyn_centralny_baza_zywnosc"))
                        .or(em.get("magazyn_centralny_baza_zywnosc")),
                    d,
                    t.centralny_cap_baza,
                ),
                central_cap_bonus_magazyn: pick(
                    nn(gl.get("magazyn_centralny_bonus_zywnosc_na_budynek"))
                        .or(em.get("magazyn_centralny_bonus_zywnosc_na_budynek")),
                    d,
                    t.centralny_cap_bonus_magazyn,
                ),
                glod_wojska_hp_frac: pick(em.get("glod_wojska_hp_frac"), d, t.glod_hp_frac),
                glod_wojska_karencja_tur: pick(
                    em.get("glod_wojska_karencja_tur"),
                    d,
                    t.glod_karencja_tur,
                ),
                glod_wojska_stat_mult: pick(em.get("glod_wojska_stat_mult"), d, t.glod_stat_mult),
                ration_params: growth_v85::build_ration_params(raw, d),
            }
        }

        /// Web `freshEmpireFoodState` (`empire-food.ts:136`).
        pub fn fresh_empire_food_state() -> EmpireFoodState {
            EmpireFoodState {
                zapasy_panstwa: 0.0,
                procent_rozwoj: None,
                tury_ujemnych_zapasow: Some(0.0),
            }
        }

        /// Web `EmpireFoodCityRow`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct EmpireFoodCityRow {
            pub city_id: String,
            pub name: String,
            pub produkcja: f64,
            pub koszt_racji: f64,
            pub bilans: f64,
            pub wzrost_procent: f64,
            pub nakarmione: bool,
            pub breakdown: Option<GrowthPercentBreakdown>,
        }

        /// Web `EmpireFoodTick`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct EmpireFoodTick {
            pub owner_id: i64,
            pub uprawa_hodowla: f64,
            pub wyzwienie_ludnosci: f64,
            pub nadwyzka: f64,
            pub pomoc_miastom: f64,
            pub spichlerz_stolicy: f64,
            pub wojsko: f64,
            pub przyrost_zapasow: f64,
            pub zapasy_przed: f64,
            pub zapasy_po: f64,
            pub max_cap: f64,
            pub koszt_armii: f64,
            pub glod_wojska: bool,
            pub tury_ujemnych_zapasow_po: f64,
            pub glod_wojska_atrycja_aktywna: bool,
            pub zywnosc_brutto: f64,
            pub do_rozwoju: f64,
            pub do_panstwa: f64,
            pub per_city_rows: Vec<EmpireFoodCityRow>,
            pub fed_by_city_id: BTreeMap<String, bool>,
        }

        /// Web `EmpireFoodTickResult` (`byOwner` to widok `perOwner` po `owner_id`).
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct EmpireFoodTickResult {
            pub per_owner: Vec<EmpireFoodTick>,
        }

        impl EmpireFoodTickResult {
            pub fn by_owner(&self, owner_id: i64) -> Option<&EmpireFoodTick> {
                self.per_owner.iter().find(|t| t.owner_id == owner_id)
            }
        }

        /// Stan modulu weba (`_lastTicks`, `_maxCapByOwner`) jako jawny obiekt. `_statesRef`
        /// (`bindEmpireFoodRuntime`) zastepuje parametr `states` w `get_empire_food_reserve`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct EmpireFoodRuntime {
            last_ticks: BTreeMap<i64, EmpireFoodTick>,
            max_cap_by_owner: BTreeMap<i64, f64>,
        }

        impl EmpireFoodRuntime {
            pub fn new() -> Self {
                Self::default()
            }

            /// Web `getEmpireFoodReserve` (z jawnie podanym `states`).
            pub fn get_empire_food_reserve(&self, states: &OwnerFoodStates, owner_id: i64) -> f64 {
                states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa)
            }

            /// Web `getEmpireFoodMaxCap`.
            pub fn get_empire_food_max_cap(&self, owner_id: i64) -> f64 {
                self.max_cap_by_owner.get(&owner_id).copied().unwrap_or(0.0)
            }

            /// Web `isArmyHungry`.
            pub fn is_army_hungry(&self, owner_id: i64) -> bool {
                if is_barbarian(owner_id) {
                    return false;
                }
                self.last_ticks
                    .get(&owner_id)
                    .is_some_and(|t| t.glod_wojska)
            }

            /// Web `isArmyStarving`.
            pub fn is_army_starving(&self, owner_id: i64) -> bool {
                if is_barbarian(owner_id) {
                    return false;
                }
                self.last_ticks
                    .get(&owner_id)
                    .is_some_and(|t| t.glod_wojska_atrycja_aktywna)
            }

            /// Web `getArmyStarvationCountdown`; `None` = `null`.
            pub fn get_army_starvation_countdown(
                &self,
                owner_id: i64,
                karencja_tur: f64,
            ) -> Option<f64> {
                let t = self.last_ticks.get(&owner_id)?;
                if !t.glod_wojska || t.glod_wojska_atrycja_aktywna {
                    return None;
                }
                Some(js_max(1.0, karencja_tur - t.tury_ujemnych_zapasow_po))
            }

            /// Web `getLastEmpireFoodTick`.
            pub fn get_last_empire_food_tick(&self, owner_id: i64) -> Option<&EmpireFoodTick> {
                self.last_ticks.get(&owner_id)
            }

            /// Web `_setLastEmpireFoodTicks`.
            pub fn set_last_empire_food_ticks(&mut self, ticks: BTreeMap<i64, EmpireFoodTick>) {
                self.last_ticks = ticks;
            }

            /// Web `clearLastEmpireFoodTicks`.
            pub fn clear_last_empire_food_ticks(&mut self) {
                self.last_ticks = BTreeMap::new();
                self.max_cap_by_owner = BTreeMap::new();
            }
        }

        /// Web `getEmpireFoodSplit` (@deprecated, stala).
        pub fn get_empire_food_split(_owner_id: i64) -> f64 {
            percent_whole()
        }

        /// Web `clampFoodSplitPct` (@deprecated).
        pub fn clamp_food_split_pct(n: f64) -> f64 {
            js_min(percent_whole(), js_max(0.0, n))
        }

        /// Web `getCityFoodSplit` (@deprecated).
        pub fn get_city_food_split(poziom_racji: Option<f64>) -> f64 {
            match poziom_racji {
                Some(p) => js_math_round((p / growth_v85::wyzywienie_max()) * percent_whole()),
                None => percent_whole(),
            }
        }

        /// Web `computeEmpireFoodNetDelta` (@deprecated).
        pub fn compute_empire_food_net_delta(brutto: f64, koszt_armii: f64) -> f64 {
            brutto - koszt_armii
        }

        /// Web `computeEmpireFoodNetDeltaFromCityFoods` (@deprecated); wejscie: `zywnoscNetto` miast.
        pub fn compute_empire_food_net_delta_from_city_foods(
            zywnosc_netto: &[f64],
            koszt_armii: f64,
        ) -> f64 {
            let mut sum = 0.0;
            for c in zywnosc_netto {
                sum += *c;
            }
            sum - koszt_armii
        }

        /// Web `computeEmpireFoodMaxCap` (@deprecated).
        pub fn compute_empire_food_max_cap(params: &EmpireFoodParams) -> f64 {
            params.central_cap_baza
        }

        fn count_magazyn_by_owner(
            per_city: &[CityEconomyTick],
            built_by_city: Option<&BTreeMap<String, Vec<String>>>,
        ) -> BTreeMap<i64, f64> {
            let mut out = BTreeMap::new();
            let Some(built) = built_by_city else {
                return out;
            };
            let mut seen = BTreeSet::new();
            for tick in per_city {
                if !seen.insert(tick.city_id.clone()) {
                    continue;
                }
                let id = &wzrost_ludnosci_params().spichlerz.id_magazyn;
                if built
                    .get(&tick.city_id)
                    .is_some_and(|b| b.iter().any(|x| x == id))
                {
                    *out.entry(tick.owner_id).or_insert(0.0) += 1.0;
                }
            }
            out
        }

        fn compute_central_food_cap(
            owner_id: i64,
            per_city: &[CityEconomyTick],
            magazyn_count: f64,
            params: &EmpireFoodParams,
            era: f64,
        ) -> f64 {
            let t = &wzrost_ludnosci_params().spichlerz;
            let spichlerz_mult = magazyn_era_multiplier(era);
            let mut spichlerz_cap = 0.0;
            for tick in per_city {
                if tick.owner_id != owner_id || tick.oblegany {
                    continue;
                }
                if tick.ma_spichlerz_ii.unwrap_or(false) {
                    spichlerz_cap += t.cap_imperium_tier_ii * spichlerz_mult;
                } else if tick.ma_spichlerz.unwrap_or(false) {
                    spichlerz_cap += t.cap_imperium_tier_i * spichlerz_mult;
                }
            }
            params.central_cap_baza
                + params.central_cap_bonus_magazyn * magazyn_count
                + spichlerz_cap
        }

        /// Web `advanceEmpireFood` (`empire-food.ts:186`). `unit_owner_ids` = `units.map(u => u.ownerId)`;
        /// `military_food(ownerId)` = `militaryFoodConsumptionWithSpichlerz(units, ownerId, upkeep, foodTable)`
        /// (wstrzykniete, `turn-economy.ts` poza zakresem).
        #[allow(clippy::too_many_arguments)]
        pub fn advance_empire_food(
            econ: &EconomyTickResult,
            unit_owner_ids: &[i64],
            states: &mut OwnerFoodStates,
            params: &EmpireFoodParams,
            built_by_city: Option<&BTreeMap<String, Vec<String>>>,
            resolve_owner_era: Option<&dyn Fn(i64) -> f64>,
            military_food: &mut dyn FnMut(i64) -> f64,
            runtime: &mut EmpireFoodRuntime,
        ) -> EmpireFoodTickResult {
            let magazyn_count_by_owner = count_magazyn_by_owner(&econ.per_city, built_by_city);
            let mut per_owner: Vec<EmpireFoodTick> = Vec::new();
            let mut by_owner: BTreeMap<i64, EmpireFoodTick> = BTreeMap::new();

            // `new Set([...perCity owners, ...states.keys(), ...units owners])`: kolejnosc wstawiania.
            let mut owner_ids: Vec<i64> = Vec::new();
            let candidates = econ
                .per_city
                .iter()
                .map(|t| t.owner_id)
                .chain(states.keys())
                .chain(unit_owner_ids.iter().copied());
            for id in candidates {
                if !owner_ids.contains(&id) {
                    owner_ids.push(id);
                }
            }

            for owner_id in owner_ids {
                if is_barbarian(owner_id) {
                    continue;
                }

                if !states.has(owner_id) {
                    states.set(owner_id, fresh_empire_food_state());
                }
                let zapasy_przed = states.get(owner_id).map_or(0.0, |s| s.zapasy_panstwa);
                let mut central = zapasy_przed;
                let mut uprawa_hodowla = 0.0;
                let mut wyzywienie_ludnosci = 0.0;
                let mut pomoc_miastom = 0.0;
                // (cityId, need)
                let mut deficits: Vec<(String, f64)> = Vec::new();
                let mut per_city_rows: Vec<EmpireFoodCityRow> = Vec::new();
                let mut fed_by_city_id: BTreeMap<String, bool> = BTreeMap::new();

                for tick in &econ.per_city {
                    if tick.owner_id != owner_id || tick.oblegany {
                        continue;
                    }
                    let produkcja = tick.zywnosc_brutto.unwrap_or_else(|| {
                        js_max(0.0, tick.zywnosc_netto + tick.koszt_racji.unwrap_or(0.0))
                    });
                    let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
                    let bilans = tick.bilans_lokalny.unwrap_or(produkcja - koszt_racji);
                    uprawa_hodowla += produkcja;
                    wyzywienie_ludnosci += koszt_racji;

                    per_city_rows.push(EmpireFoodCityRow {
                        city_id: tick.city_id.clone(),
                        name: tick.city_id.clone(),
                        produkcja,
                        koszt_racji,
                        bilans,
                        wzrost_procent: tick.wzrost_procent.unwrap_or(0.0),
                        nakarmione: false,
                        breakdown: None,
                    });

                    if bilans >= 0.0 {
                        central += bilans;
                        fed_by_city_id.insert(tick.city_id.clone(), true);
                    } else {
                        deficits.push((tick.city_id.clone(), -bilans));
                    }
                }

                for (city_id, need) in &deficits {
                    let covered = js_min(*need, js_max(0.0, central));
                    central -= covered;
                    pomoc_miastom += covered;
                    let fed = covered >= *need;
                    fed_by_city_id.insert(city_id.clone(), fed);
                    if let Some(row) = per_city_rows.iter_mut().find(|r| r.city_id == *city_id) {
                        row.nakarmione = fed;
                    }
                }

                let nadwyzka = uprawa_hodowla - wyzywienie_ludnosci;
                let spichlerz_stolicy = central;
                let koszt_armii = military_food(owner_id);
                central -= koszt_armii;

                let owner_era = resolve_owner_era.map_or(1.0, |f| f(owner_id));
                let max_cap = compute_central_food_cap(
                    owner_id,
                    &econ.per_city,
                    magazyn_count_by_owner
                        .get(&owner_id)
                        .copied()
                        .unwrap_or(0.0),
                    params,
                    owner_era,
                );
                if central > max_cap {
                    central = max_cap;
                }
                let glod_wojska = central < 0.0;
                central = js_max(0.0, central);
                let przyrost_zapasow = central - zapasy_przed;

                runtime.max_cap_by_owner.insert(owner_id, max_cap);

                let st = states.get_mut(owner_id).expect("stan wlasciciela");
                st.zapasy_panstwa = central;
                let tury_przed = st.tury_ujemnych_zapasow.unwrap_or(0.0);
                let tury_po = if glod_wojska { tury_przed + 1.0 } else { 0.0 };
                st.tury_ujemnych_zapasow = Some(tury_po);

                let tick = EmpireFoodTick {
                    owner_id,
                    uprawa_hodowla,
                    wyzwienie_ludnosci: wyzywienie_ludnosci,
                    nadwyzka,
                    pomoc_miastom,
                    spichlerz_stolicy,
                    wojsko: koszt_armii,
                    przyrost_zapasow,
                    zapasy_przed,
                    zapasy_po: central,
                    max_cap,
                    koszt_armii,
                    glod_wojska,
                    tury_ujemnych_zapasow_po: tury_po,
                    glod_wojska_atrycja_aktywna: tury_po >= params.glod_wojska_karencja_tur,
                    zywnosc_brutto: uprawa_hodowla,
                    do_rozwoju: 0.0,
                    do_panstwa: nadwyzka,
                    per_city_rows,
                    fed_by_city_id,
                };
                by_owner.insert(owner_id, tick.clone());
                per_owner.push(tick);
            }

            runtime.set_last_empire_food_ticks(by_owner);
            EmpireFoodTickResult { per_owner }
        }

        /// Web `isCityAutoWyzywienieEnabled` (`empire-food.ts:381`); `human_owner_ids` domyslnie `[0]`.
        pub fn is_city_auto_wyzywienie_enabled(
            city: &City,
            force_auto: bool,
            human_owner_ids: &[i64],
        ) -> bool {
            if force_auto {
                return true;
            }
            if !human_owner_ids.contains(&city.owner_id) {
                return true;
            }
            city.auto_wyzywienie == Some(true)
        }

        /// Domyslne `humanOwnerIds` weba (`[0]`).
        pub const DEFAULT_HUMAN_OWNER_IDS: [i64; 1] = [0];

        fn owner_cities_for_auto_adjust(
            cities: &[GrowthCity],
            owner_id: i64,
            only_auto_managed: bool,
        ) -> Vec<usize> {
            cities
                .iter()
                .enumerate()
                .filter(|(_, c)| c.city.owner_id == owner_id)
                .filter(|(_, c)| {
                    !only_auto_managed
                        || is_city_auto_wyzywienie_enabled(&c.city, false, &DEFAULT_HUMAN_OWNER_IDS)
                })
                .map(|(i, _)| i)
                .collect()
        }

        /// Web `AutoRationCityChange`.
        #[derive(Debug, Clone, PartialEq)]
        pub struct AutoRationCityChange {
            pub city_id: String,
            pub name: String,
            pub old_level: PoziomRacji,
            pub new_level: PoziomRacji,
        }

        /// Web `AutoRationAdjustResult`.
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct AutoRationAdjustResult {
            pub adjusted: bool,
            pub changes: Vec<AutoRationCityChange>,
        }

        /// Web `computeEmpireCityFoodNadwyzka` (`empire-food.ts:419`).
        pub fn compute_empire_city_food_nadwyzka(
            per_city: &[CityEconomyTick],
            owner_id: i64,
        ) -> f64 {
            let mut uprawa = 0.0;
            let mut koszt = 0.0;
            for tick in per_city {
                if tick.owner_id != owner_id || tick.oblegany {
                    continue;
                }
                let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
                let koszt_racji = tick.koszt_racji.unwrap_or(0.0);
                uprawa += produkcja;
                koszt += koszt_racji;
            }
            uprawa - koszt
        }

        /// Web `simulateCityFoodCentralPool` (`empire-food.ts:436`).
        pub fn simulate_city_food_central_pool(
            zapasy_przed: f64,
            per_city: &[CityEconomyTick],
            owner_id: i64,
        ) -> f64 {
            let mut central = zapasy_przed;
            let mut deficits: Vec<f64> = Vec::new();
            for tick in per_city {
                if tick.owner_id != owner_id || tick.oblegany {
                    continue;
                }
                let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
                let koszt = tick.koszt_racji.unwrap_or(0.0);
                let bilans = tick.bilans_lokalny.unwrap_or(produkcja - koszt);
                if bilans >= 0.0 {
                    central += bilans;
                } else {
                    deficits.push(-bilans);
                }
            }
            for need in deficits {
                let covered = js_min(need, js_max(0.0, central));
                central -= covered;
            }
            central
        }

        /// Web `simulateCityFoodAllFed` (`empire-food.ts:476`).
        pub fn simulate_city_food_all_fed(
            zapasy_przed: f64,
            per_city: &[CityEconomyTick],
            owner_id: i64,
        ) -> bool {
            let mut central = zapasy_przed;
            let mut deficits: Vec<f64> = Vec::new();
            for tick in per_city {
                if tick.owner_id != owner_id || tick.oblegany {
                    continue;
                }
                let produkcja = tick.zywnosc_brutto.unwrap_or(0.0);
                let koszt = tick.koszt_racji.unwrap_or(0.0);
                let bilans = tick.bilans_lokalny.unwrap_or(produkcja - koszt);
                if bilans >= 0.0 {
                    central += bilans;
                } else {
                    deficits.push(-bilans);
                }
            }
            for need in deficits {
                let covered = js_min(need, js_max(0.0, central));
                central -= covered;
                if covered < need - FOOD_EPSILON {
                    return false;
                }
            }
            true
        }

        /// Web `WYZYWIENIE_POZIOM_NA_LIMICIE` (`empire-food.ts:513`): najnizszy poziom o nieujemnym wzroscie.
        pub fn wyzywienie_poziom_na_limicie() -> PoziomRacji {
            wyzywienie_levels()
                .into_iter()
                .find(|l| ration_growth_percent(*l) >= 0.0)
                .unwrap_or_else(wyzywienie_min)
        }

        /// Web `EqualGrowthRationPlanOpts` bez tablic mutowanych (`cities`, `econ`).
        #[derive(Debug, Clone)]
        pub struct EqualGrowthRationPlanOpts<'a> {
            pub owner_id: i64,
            pub zapasy_przed: f64,
            pub spichlerz_by_city: Option<&'a BTreeMap<String, SpichlerzCityBonusState>>,
            pub only_auto_managed: bool,
            pub require_flow_balance: bool,
            pub koszt_armii: f64,
            pub pop_cap_by_city_id: Option<&'a BTreeMap<String, f64>>,
        }

        /// Web `EqualGrowthRationPlan`.
        #[derive(Debug, Clone, PartialEq)]
        pub struct EqualGrowthRationPlan {
            pub uniform_level: PoziomRacji,
            pub level_by_city_id: BTreeMap<String, PoziomRacji>,
            pub at_pop_cap_city_ids: Vec<String>,
            pub all_fed: bool,
        }

        /// Web `isEmpireCityFoodSolvent` (`empire-food.ts:710`).
        pub fn is_empire_city_food_solvent(
            zapasy_przed: f64,
            per_city: &[CityEconomyTick],
            owner_id: i64,
            koszt_armii: f64,
        ) -> bool {
            compute_empire_city_food_nadwyzka(per_city, owner_id) + zapasy_przed - koszt_armii
                >= 0.0
        }

        /// Web `isRationBalanceTargetMet` (nieeksportowana, `empire-food.ts:749`).
        fn is_ration_balance_target_met(
            zapasy_przed: f64,
            per_city: &[CityEconomyTick],
            owner_id: i64,
            require_flow_balance: bool,
            koszt_armii: f64,
        ) -> bool {
            if require_flow_balance {
                return compute_empire_city_food_nadwyzka(per_city, owner_id) - koszt_armii >= 0.0;
            }
            is_empire_city_food_solvent(zapasy_przed, per_city, owner_id, koszt_armii)
        }

        fn set_level(gc: &mut GrowthCity, level: PoziomRacji) {
            gc.city.poziom_racji = Some(level);
        }

        /// Web `resolveEqualGrowthRationPlan` (`empire-food.ts:586`).
        pub fn resolve_equal_growth_ration_plan(
            opts: &EqualGrowthRationPlanOpts<'_>,
            cities: &mut [GrowthCity],
            econ: &mut EconomyTickResult,
        ) -> EqualGrowthRationPlan {
            let managed =
                owner_cities_for_auto_adjust(cities, opts.owner_id, opts.only_auto_managed);
            let mut original_levels: BTreeMap<String, PoziomRacji> = BTreeMap::new();
            for &i in &managed {
                ensure_city_ration_defaults(&mut cities[i]);
                original_levels.insert(
                    cities[i].city.id.clone(),
                    get_city_ration_level(&cities[i].city),
                );
            }

            let mut at_pop_cap: Vec<usize> = Vec::new();
            let mut growing: Vec<usize> = Vec::new();
            for &i in &managed {
                let cap = opts
                    .pop_cap_by_city_id
                    .and_then(|m| m.get(&cities[i].city.id))
                    .copied();
                match cap {
                    Some(cap) if cities[i].city.population >= cap => at_pop_cap.push(i),
                    _ => growing.push(i),
                }
            }

            let na_limicie = wyzywienie_poziom_na_limicie();
            let capped_level_for = |level: PoziomRacji| js_min(na_limicie, level);

            let apply_candidate =
                |level: PoziomRacji, cities: &mut [GrowthCity], econ: &mut EconomyTickResult| {
                    for &i in &at_pop_cap {
                        set_level(&mut cities[i], capped_level_for(level));
                    }
                    for &i in &growing {
                        set_level(&mut cities[i], level);
                    }
                    recompute_city_food_balances_in_econ(
                        &mut econ.per_city,
                        cities,
                        opts.spichlerz_by_city,
                    );
                };
            let feasible = |econ: &EconomyTickResult| -> bool {
                simulate_city_food_all_fed(opts.zapasy_przed, &econ.per_city, opts.owner_id)
                    && is_ration_balance_target_met(
                        opts.zapasy_przed,
                        &econ.per_city,
                        opts.owner_id,
                        opts.require_flow_balance,
                        opts.koszt_armii,
                    )
            };

            let levels = wyzywienie_levels();
            let mut uniform_level: PoziomRacji = wyzywienie_min();
            let mut all_fed = false;
            for i in (0..levels.len()).rev() {
                let level = levels[i];
                apply_candidate(level, cities, econ);
                if feasible(econ) {
                    uniform_level = level;
                    all_fed = true;
                    break;
                }
            }
            if !all_fed {
                apply_candidate(wyzywienie_min(), cities, econ);
                all_fed =
                    simulate_city_food_all_fed(opts.zapasy_przed, &econ.per_city, opts.owner_id);
            }

            let mut level_by_city_id: BTreeMap<String, PoziomRacji> = BTreeMap::new();
            for &i in &at_pop_cap {
                level_by_city_id.insert(cities[i].city.id.clone(), capped_level_for(uniform_level));
            }
            for &i in &growing {
                level_by_city_id.insert(cities[i].city.id.clone(), uniform_level);
            }

            for &i in &managed {
                let level = original_levels
                    .get(&cities[i].city.id)
                    .copied()
                    .expect("poziom poczatkowy");
                set_level(&mut cities[i], level);
            }
            recompute_city_food_balances_in_econ(
                &mut econ.per_city,
                cities,
                opts.spichlerz_by_city,
            );

            EqualGrowthRationPlan {
                uniform_level,
                level_by_city_id,
                at_pop_cap_city_ids: at_pop_cap
                    .iter()
                    .map(|&i| cities[i].city.id.clone())
                    .collect(),
                all_fed,
            }
        }

        /// Web `applyEqualGrowthRationPlan` (nieeksportowana, `empire-food.ts:665`).
        fn apply_equal_growth_ration_plan(
            plan: &EqualGrowthRationPlan,
            cities: &mut [GrowthCity],
            owner_id: i64,
            only_auto_managed: bool,
            econ: &mut EconomyTickResult,
            spichlerz_by_city: Option<&BTreeMap<String, SpichlerzCityBonusState>>,
        ) -> Vec<AutoRationCityChange> {
            let managed = owner_cities_for_auto_adjust(cities, owner_id, only_auto_managed);
            let mut changes = Vec::new();
            for i in managed {
                let Some(target) = plan.level_by_city_id.get(&cities[i].city.id).copied() else {
                    continue;
                };
                let old_level = get_city_ration_level(&cities[i].city);
                let new_level = clamp_poziom_racji(target);
                if (new_level - old_level).abs() < FOOD_EPSILON {
                    continue;
                }
                cities[i].city.poziom_racji = Some(new_level);
                changes.push(AutoRationCityChange {
                    city_id: cities[i].city.id.clone(),
                    name: cities[i].city.name.clone(),
                    old_level,
                    new_level,
                });
            }
            if !changes.is_empty() {
                recompute_city_food_balances_in_econ(&mut econ.per_city, cities, spichlerz_by_city);
            }
            changes
        }

        /// Web `AutoBalanceRationsOpts` bez tablic mutowanych.
        #[derive(Debug, Clone)]
        pub struct AutoBalanceRationsOpts<'a> {
            pub owner_id: i64,
            pub zapasy_przed: f64,
            pub spichlerz_by_city: Option<&'a BTreeMap<String, SpichlerzCityBonusState>>,
            pub only_auto_managed: bool,
            pub require_flow_balance: bool,
            pub koszt_armii: f64,
            pub pop_cap_by_city_id: Option<&'a BTreeMap<String, f64>>,
        }

        /// Web `autoBalanceRationsToSolvency` (`empire-food.ts:805`).
        pub fn auto_balance_rations_to_solvency(
            opts: &AutoBalanceRationsOpts<'_>,
            cities: &mut [GrowthCity],
            econ: &mut EconomyTickResult,
        ) -> AutoRationAdjustResult {
            let owner_cities =
                owner_cities_for_auto_adjust(cities, opts.owner_id, opts.only_auto_managed);
            if owner_cities.is_empty() {
                return AutoRationAdjustResult::default();
            }
            for &i in &owner_cities {
                ensure_city_ration_defaults(&mut cities[i]);
            }

            let target_already_met = is_ration_balance_target_met(
                opts.zapasy_przed,
                &econ.per_city,
                opts.owner_id,
                opts.require_flow_balance,
                opts.koszt_armii,
            );
            let all_fed_already =
                simulate_city_food_all_fed(opts.zapasy_przed, &econ.per_city, opts.owner_id);
            if target_already_met && all_fed_already {
                return AutoRationAdjustResult::default();
            }

            let plan = resolve_equal_growth_ration_plan(
                &EqualGrowthRationPlanOpts {
                    owner_id: opts.owner_id,
                    zapasy_przed: opts.zapasy_przed,
                    spichlerz_by_city: opts.spichlerz_by_city,
                    only_auto_managed: opts.only_auto_managed,
                    require_flow_balance: opts.require_flow_balance,
                    koszt_armii: opts.koszt_armii,
                    pop_cap_by_city_id: opts.pop_cap_by_city_id,
                },
                cities,
                econ,
            );
            let changes = apply_equal_growth_ration_plan(
                &plan,
                cities,
                opts.owner_id,
                opts.only_auto_managed,
                econ,
                opts.spichlerz_by_city,
            );
            AutoRationAdjustResult {
                adjusted: !changes.is_empty(),
                changes,
            }
        }

        /// Web `AutoRaiseRationsOpts` bez tablic mutowanych.
        #[derive(Debug, Clone)]
        pub struct AutoRaiseRationsOpts<'a> {
            pub owner_id: i64,
            pub zapasy_przed: f64,
            pub spichlerz_by_city: Option<&'a BTreeMap<String, SpichlerzCityBonusState>>,
            pub require_production_surplus: bool,
            pub only_auto_managed: bool,
            pub koszt_armii: f64,
            pub pop_cap_by_city_id: Option<&'a BTreeMap<String, f64>>,
        }

        /// Web `autoRaiseRationsForGrowth` (`empire-food.ts:873`).
        pub fn auto_raise_rations_for_growth(
            opts: &AutoRaiseRationsOpts<'_>,
            cities: &mut [GrowthCity],
            econ: &mut EconomyTickResult,
        ) -> AutoRationAdjustResult {
            let owner_cities =
                owner_cities_for_auto_adjust(cities, opts.owner_id, opts.only_auto_managed);
            if owner_cities.is_empty() {
                return AutoRationAdjustResult::default();
            }

            if !is_empire_city_food_solvent(
                opts.zapasy_przed,
                &econ.per_city,
                opts.owner_id,
                opts.koszt_armii,
            ) {
                return AutoRationAdjustResult::default();
            }

            let nadwyzka = compute_empire_city_food_nadwyzka(&econ.per_city, opts.owner_id);
            if opts.require_production_surplus {
                if nadwyzka <= 0.0 {
                    return AutoRationAdjustResult::default();
                }
            } else if nadwyzka <= 0.0 && opts.zapasy_przed <= 0.0 {
                return AutoRationAdjustResult::default();
            }

            for &i in &owner_cities {
                ensure_city_ration_defaults(&mut cities[i]);
            }

            let plan = resolve_equal_growth_ration_plan(
                &EqualGrowthRationPlanOpts {
                    owner_id: opts.owner_id,
                    zapasy_przed: opts.zapasy_przed,
                    spichlerz_by_city: opts.spichlerz_by_city,
                    only_auto_managed: opts.only_auto_managed,
                    require_flow_balance: opts.require_production_surplus,
                    koszt_armii: opts.koszt_armii,
                    pop_cap_by_city_id: opts.pop_cap_by_city_id,
                },
                cities,
                econ,
            );
            let changes = apply_equal_growth_ration_plan(
                &plan,
                cities,
                opts.owner_id,
                opts.only_auto_managed,
                econ,
                opts.spichlerz_by_city,
            );
            AutoRationAdjustResult {
                adjusted: !changes.is_empty(),
                changes,
            }
        }

        /// Web `maxSafePoziomRacjiForCity` opts bez tablic mutowanych.
        #[derive(Debug, Clone)]
        pub struct MaxSafePoziomOpts<'a> {
            pub city_id: String,
            pub owner_id: i64,
            pub zapasy_przed: f64,
            pub spichlerz_by_city: Option<&'a BTreeMap<String, SpichlerzCityBonusState>>,
            pub koszt_armii: f64,
            pub pop_cap_by_city_id: Option<&'a BTreeMap<String, f64>>,
            pub human_owner_ids: Vec<i64>,
        }

        /// Web `maxSafePoziomRacjiForCity` (`empire-food.ts:948`).
        pub fn max_safe_poziom_racji_for_city(
            opts: &MaxSafePoziomOpts<'_>,
            cities: &mut [GrowthCity],
            econ: &mut EconomyTickResult,
        ) -> PoziomRacji {
            let Some(city_index) = cities.iter().position(|c| c.city.id == opts.city_id) else {
                return wyzywienie_min();
            };
            if cities[city_index].city.owner_id != opts.owner_id {
                return wyzywienie_min();
            }

            ensure_city_ration_defaults(&mut cities[city_index]);
            let original_level = get_city_ration_level(&cities[city_index].city);
            let others: Vec<usize> = cities
                .iter()
                .enumerate()
                .filter(|(_, c)| c.city.owner_id == opts.owner_id && c.city.id != opts.city_id)
                .map(|(i, _)| i)
                .collect();
            let mut others_original: BTreeMap<String, PoziomRacji> = BTreeMap::new();
            for &i in &others {
                ensure_city_ration_defaults(&mut cities[i]);
                others_original.insert(
                    cities[i].city.id.clone(),
                    get_city_ration_level(&cities[i].city),
                );
            }
            let mut max_safe = wyzywienie_min();
            let require_flow_balance = opts.human_owner_ids.contains(&opts.owner_id);
            let na_limicie = wyzywienie_poziom_na_limicie();

            for level in wyzywienie_levels() {
                cities[city_index].city.poziom_racji = Some(level);
                for &i in &others {
                    let cap = opts
                        .pop_cap_by_city_id
                        .and_then(|m| m.get(&cities[i].city.id))
                        .copied();
                    let at_cap = cap.is_some_and(|cap| cities[i].city.population >= cap);
                    let value = if at_cap {
                        js_min(na_limicie, level)
                    } else {
                        js_min(
                            others_original
                                .get(&cities[i].city.id)
                                .copied()
                                .expect("poziom poczatkowy"),
                            level,
                        )
                    };
                    cities[i].city.poziom_racji = Some(value);
                }
                recompute_city_food_balances_in_econ(
                    &mut econ.per_city,
                    cities,
                    opts.spichlerz_by_city,
                );
                let pool = simulate_city_food_central_pool(
                    opts.zapasy_przed,
                    &econ.per_city,
                    opts.owner_id,
                );
                let all_fed =
                    simulate_city_food_all_fed(opts.zapasy_przed, &econ.per_city, opts.owner_id);
                let target_met = is_ration_balance_target_met(
                    opts.zapasy_przed,
                    &econ.per_city,
                    opts.owner_id,
                    require_flow_balance,
                    opts.koszt_armii,
                );
                if pool >= 0.0 && all_fed && target_met {
                    max_safe = level;
                }
            }

            cities[city_index].city.poziom_racji = Some(original_level);
            for &i in &others {
                let level = others_original
                    .get(&cities[i].city.id)
                    .copied()
                    .expect("poziom poczatkowy");
                cities[i].city.poziom_racji = Some(level);
            }
            recompute_city_food_balances_in_econ(
                &mut econ.per_city,
                cities,
                opts.spichlerz_by_city,
            );
            clamp_poziom_racji(max_safe)
        }
    }

    pub use empire_food::{
        EmpireFoodCityRow, EmpireFoodParams, EmpireFoodRuntime, EmpireFoodState, EmpireFoodTick,
        EmpireFoodTickResult, OwnerFoodStates,
    };
}
