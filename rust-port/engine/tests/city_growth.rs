use civ_engine::domain::city_growth::{
    self, advance_city_growth, city_population_cap, CityGrowthParams, CityGrowthState,
};

fn normal_params() -> CityGrowthParams {
    CityGrowthParams::default()
}

#[test]
fn population_cap_uses_the_three_canonical_building_steps() {
    let params = normal_params();

    assert_eq!(city_population_cap(false, false, &params), 5);
    assert_eq!(city_population_cap(false, true, &params), 8);
    assert_eq!(
        city_population_cap(true, false, &params),
        12,
        "aqueduct is the upper step even without a granary"
    );
    assert_eq!(
        city_population_cap(true, true, &params),
        12,
        "aqueduct takes precedence over the granary"
    );
}

#[test]
fn positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once() {
    let params = normal_params();
    let city = CityGrowthState {
        population: 3,
        health: 10.0,
        food_store: 0,
        ..CityGrowthState::default()
    };

    // Threshold(3) = 20 + 3 * 16 = 68. Health 10 adds a 1.5x modifier,
    // so 46 food becomes 69 and is enough for exactly one citizen.
    let result = advance_city_growth(&city, 46.0, &params);

    assert_eq!(result.population, 4);
    assert!(result.grew);
    assert!(!result.lost_population);
    assert!(!result.growth_frozen);
    assert_eq!(result.food_store, 0, "without a granary the buffer resets");
    assert_eq!(result.population_cap, 5);
    assert_eq!(result.growth_threshold, 68);
}

#[test]
fn granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention() {
    let params = normal_params();
    let city = CityGrowthState {
        population: 3,
        food_store: 40,
        has_granary: true,
        ..CityGrowthState::default()
    };

    let result = advance_city_growth(&city, 28.0, &params);
    assert_eq!(result.population, 4);
    assert_eq!(result.food_store, 34, "floor(68 * 0.5)");

    let tier_two = CityGrowthState {
        has_granary: false,
        has_granary_tier_two: true,
        ..city
    };
    let tier_two_result = advance_city_growth(&tier_two, 28.0, &params);
    assert_eq!(tier_two_result.population, 4);
    assert_eq!(tier_two_result.food_store, 47, "floor(68 * 0.7)");
    assert_eq!(tier_two_result.population_cap, 8);
}

#[test]
fn population_at_cap_is_frozen_but_surplus_food_is_not_spent() {
    let params = normal_params();
    let city = CityGrowthState {
        population: 5,
        food_store: 100,
        ..CityGrowthState::default()
    };

    let result = advance_city_growth(&city, 50.0, &params);

    assert_eq!(result.population, 5);
    assert!(!result.grew);
    assert!(result.growth_frozen);
    assert_eq!(result.food_store, 150);
}

#[test]
fn deficit_reduces_population_to_one_without_health_boosting_negative_food() {
    let params = normal_params();
    let city = CityGrowthState {
        population: 2,
        health: 100.0,
        food_store: 0,
        ..CityGrowthState::default()
    };

    let result = advance_city_growth(&city, -1.2, &params);
    assert_eq!(result.population, 1);
    assert_eq!(result.food_store, 0);
    assert!(result.lost_population);
    assert!(!result.growth_frozen);

    let minimum = CityGrowthState {
        population: 1,
        ..city
    };
    let minimum_result = advance_city_growth(&minimum, -10.0, &params);
    assert_eq!(minimum_result.population, 1);
    assert!(!minimum_result.lost_population);
}

#[test]
fn a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn() {
    let mut params = normal_params();
    params.growth_threshold_multiplier = 2.0;
    let city = CityGrowthState {
        population: 3,
        food_store: 0,
        has_granary: true,
        ..CityGrowthState::default()
    };

    // 68 * 2 = 136; a large store still resolves one population step only.
    let result = advance_city_growth(&city, 300.0, &params);

    assert_eq!(result.population, 4);
    assert_eq!(result.growth_threshold, 136);
    assert_eq!(result.food_store, 150, "floor(300 * 0.5)");
}

#[test]
fn fractional_growth_accumulates_and_freezes_at_the_population_cap() {
    let params = normal_params();
    let city = city_growth::FractionalGrowthState {
        population: 4,
        fractional_growth: 0.8,
    };

    let result = city_growth::apply_fractional_growth(&city, 10.0, true, false, false, &params);
    assert_eq!(result.population, 5);
    assert!((result.fractional_growth - 0.2).abs() < f64::EPSILON);
    assert!(result.grew);
    assert!(!result.growth_frozen);

    let capped = city_growth::FractionalGrowthState {
        population: 5,
        fractional_growth: 0.25,
    };
    let capped_result =
        city_growth::apply_fractional_growth(&capped, 10.0, true, false, false, &params);
    assert_eq!(capped_result.population, 5);
    assert!((capped_result.fractional_growth - 0.25).abs() < f64::EPSILON);
    assert!(capped_result.growth_frozen);
}

#[test]
fn fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed() {
    let params = normal_params();
    let city = city_growth::FractionalGrowthState {
        population: 1,
        fractional_growth: 0.0,
    };

    let result = city_growth::apply_fractional_growth(&city, 1100.0, true, true, false, &params);
    assert_eq!(result.population, 12, "aqueduct cap is respected");
    assert!(result.grew);
    assert!((result.fractional_growth - 0.0).abs() < f64::EPSILON);

    let unfed = city_growth::apply_fractional_growth(&city, 500.0, false, true, false, &params);
    assert_eq!(unfed.population, 1);
    assert_eq!(unfed.fractional_growth, 0.0);
    assert!(!unfed.grew);
}

#[test]
fn hunger_penalty_is_separate_and_never_drops_below_one() {
    let result = city_growth::apply_hunger_penalty(2, false, 0);
    assert_eq!(result.population, 1);
    assert_eq!(result.unfed_turns, 0);
    assert!(result.lost_population);

    let minimum = city_growth::apply_hunger_penalty(1, false, 99);
    assert_eq!(minimum.population, 1);
    assert_eq!(minimum.unfed_turns, 100);
    assert!(!minimum.lost_population);

    let fed = city_growth::apply_hunger_penalty(4, true, 99);
    assert_eq!(fed.population, 4);
    assert_eq!(fed.unfed_turns, 0);
    assert!(!fed.lost_population);
}

#[test]
fn growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs() {
    assert_eq!(
        city_growth::growth_gain_per_turn_slots(4, 5.0, true, false),
        0.2
    );
    assert_eq!(
        city_growth::growth_gain_per_turn_slots(4, 5.0, true, true),
        0.0
    );
    assert_eq!(
        city_growth::growth_gain_per_turn_slots(4, -5.0, true, false),
        -0.2
    );
    assert_eq!(
        city_growth::growth_gain_per_turn_slots(4, 5.0, false, false),
        0.0
    );

    assert_eq!(city_growth::turns_until_next_citizen(0.25, 0.2), Some(4));
    assert_eq!(city_growth::turns_until_next_citizen(1.0, 0.2), Some(0));
    assert_eq!(city_growth::turns_until_next_citizen(0.25, 0.0), None);
}
