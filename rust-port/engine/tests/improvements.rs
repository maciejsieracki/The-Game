use civ_engine::domain::{
    production_for, qualifies, Deposit, ImprovementKey, Production, TerrainType, Tile,
};

fn tile(terrain: TerrainType) -> Tile {
    Tile::new(terrain)
}

#[test]
fn trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land() {
    let mut forest = tile(TerrainType::Grassland);
    forest.forest = true;

    assert!(!qualifies(ImprovementKey::Trzoda, &forest));
    assert!(!qualifies(
        ImprovementKey::Trzoda,
        &tile(TerrainType::Grassland)
    ));

    let mut cattle_deposit = tile(TerrainType::Grassland);
    cattle_deposit.deposit = Some(Deposit::Cattle);
    assert!(qualifies(ImprovementKey::Trzoda, &cattle_deposit));

    let mut unlocked = tile(TerrainType::Plains);
    unlocked.livestock_unlocked = vec![Deposit::Cattle];
    assert!(qualifies(ImprovementKey::Trzoda, &unlocked));
    assert!(!qualifies(
        ImprovementKey::Trzoda,
        &tile(TerrainType::Hills)
    ));
}

#[test]
fn forest_rules_distinguish_dependent_and_compatible_improvements() {
    let mut forest = tile(TerrainType::Grassland);
    forest.forest = true;

    assert!(qualifies(ImprovementKey::LumberMill, &forest));
    assert!(!qualifies(ImprovementKey::Farm, &forest));
    assert!(!qualifies(ImprovementKey::Irrigation, &forest));
    assert!(!qualifies(ImprovementKey::Trzoda, &forest));
    let mut forest_hills = tile(TerrainType::Hills);
    forest_hills.forest = true;
    forest_hills.deposit = Some(Deposit::Sheep);
    assert!(qualifies(ImprovementKey::Sheep, &forest_hills));
    forest_hills.deposit = Some(Deposit::Llama);
    assert!(qualifies(ImprovementKey::Llama, &forest_hills));
    assert!(!qualifies(ImprovementKey::Terraces, &forest_hills));
}

#[test]
fn terrain_and_deposit_gates_are_checked_before_building() {
    let mut copper = tile(TerrainType::Hills);
    copper.deposit = Some(Deposit::Copper);
    assert!(qualifies(ImprovementKey::CopperMine, &copper));
    assert!(!qualifies(ImprovementKey::IronMine, &copper));

    let mut clay = tile(TerrainType::Plains);
    clay.deposit = Some(Deposit::Clay);
    assert!(qualifies(ImprovementKey::ClayPit, &clay));
    assert!(!qualifies(
        ImprovementKey::ClayPit,
        &tile(TerrainType::Plains)
    ));

    let mut irrigated = tile(TerrainType::Desert);
    irrigated.river_adjacent = true;
    assert!(qualifies(ImprovementKey::Irrigation, &irrigated));
    assert!(!qualifies(
        ImprovementKey::Irrigation,
        &tile(TerrainType::Desert)
    ));
}

#[test]
fn terraces_are_hills_only_and_salt_works_reaches_shallow_water() {
    assert!(!qualifies(
        ImprovementKey::Terraces,
        &tile(TerrainType::Mountains)
    ));
    assert!(qualifies(
        ImprovementKey::SaltWorks,
        &tile(TerrainType::ShallowWater)
    ));
}

#[test]
fn food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm() {
    let mut with_farm = tile(TerrainType::Grassland);
    with_farm.river_adjacent = true;
    with_farm.improvements = vec![ImprovementKey::Farm];
    with_farm.livestock_unlocked = vec![Deposit::Cattle];
    assert!(qualifies(ImprovementKey::Irrigation, &with_farm));
    assert!(qualifies(ImprovementKey::Trzoda, &with_farm));

    let mut without_farm = tile(TerrainType::Grassland);
    without_farm.improvements = vec![ImprovementKey::Trzoda];
    assert!(!qualifies(ImprovementKey::Irrigation, &without_farm));
    assert!(qualifies(ImprovementKey::Farm, &without_farm));
}

#[test]
fn solo_food_improvements_and_duplicates_are_rejected() {
    let mut sheep = tile(TerrainType::Hills);
    sheep.improvements = vec![ImprovementKey::Sheep];
    assert!(!qualifies(ImprovementKey::Farm, &sheep));
    assert!(!qualifies(ImprovementKey::Sheep, &sheep));

    let mut llama = tile(TerrainType::Mountains);
    llama.improvements = vec![ImprovementKey::Llama];
    assert!(!qualifies(ImprovementKey::Llama, &llama));
}

#[test]
fn production_returns_field_bonuses_and_logistics_rates() {
    assert_eq!(
        production_for(ImprovementKey::Farm),
        Production {
            food: 3,
            work: 3,
            trade: 3,
            money: 0,
            clay: 0,
            stone: 0,
            resource: None,
            resource_amount: 0,
        }
    );
    assert_eq!(
        production_for(ImprovementKey::Trzoda),
        Production {
            food: 2,
            work: 4,
            trade: 3,
            money: 0,
            clay: 0,
            stone: 0,
            resource: None,
            resource_amount: 0,
        }
    );
    assert_eq!(
        production_for(ImprovementKey::LumberMill),
        Production {
            work: 3,
            trade: 3,
            ..Production::resource("drewno", 200)
        }
    );
    assert_eq!(
        production_for(ImprovementKey::CopperMine),
        Production {
            work: 2,
            trade: 5,
            ..Production::resource("ruda", 20)
        }
    );
}

#[test]
fn production_is_pure_and_non_producers_have_zero_logistics() {
    let road = production_for(ImprovementKey::Road);
    assert_eq!(road.trade, 2);

    let first = production_for(ImprovementKey::ClayPit);
    let second = production_for(ImprovementKey::ClayPit);
    assert_eq!(first, second);
    assert_eq!(first.resource.as_deref(), Some("glina"));
    assert_eq!(first.resource_amount, 50);
    assert_eq!(first.clay, 10);
}

#[test]
fn tile_and_production_are_json_round_trip_safe() {
    let mut value = tile(TerrainType::Plains);
    value.forest = true;
    value.deposit = Some(Deposit::Cattle);
    value.improvements = vec![ImprovementKey::LumberMill];

    let encoded = serde_json::to_string(&value).expect("tile serializes");
    let decoded: Tile = serde_json::from_str(&encoded).expect("tile deserializes");
    assert_eq!(decoded, value);

    let production = production_for(ImprovementKey::LumberMill);
    let encoded = serde_json::to_string(&production).expect("production serializes");
    let decoded: Production = serde_json::from_str(&encoded).expect("production deserializes");
    assert_eq!(decoded, production);
}

#[test]
fn food_layers_can_coexist_with_non_food_layers() {
    let mut cattle = tile(TerrainType::Grassland);
    cattle.deposit = Some(Deposit::Cattle);
    cattle.improvements = vec![ImprovementKey::Road];
    assert!(qualifies(ImprovementKey::Trzoda, &cattle));

    let mut irrigation = tile(TerrainType::Grassland);
    irrigation.river_adjacent = true;
    irrigation.improvements = vec![ImprovementKey::Road];
    assert!(qualifies(ImprovementKey::Irrigation, &irrigation));

    let mut sheep = tile(TerrainType::Hills);
    sheep.deposit = Some(Deposit::Sheep);
    sheep.improvements = vec![ImprovementKey::Road];
    assert!(qualifies(ImprovementKey::Sheep, &sheep));
}

#[test]
fn non_food_upgrade_dependencies_are_preserved() {
    let mut forest = tile(TerrainType::Grassland);
    forest.forest = true;
    assert!(!qualifies(ImprovementKey::HuntingCamp, &forest));
    forest.improvements = vec![ImprovementKey::LumberMill];
    assert!(qualifies(ImprovementKey::HuntingCamp, &forest));

    let mut road = tile(TerrainType::Grassland);
    assert!(!qualifies(ImprovementKey::PavedRoad, &road));
    road.improvements = vec![ImprovementKey::Road];
    assert!(qualifies(ImprovementKey::PavedRoad, &road));
}

#[test]
fn livestock_requires_matching_first_deposit_or_explicit_unlock() {
    let fresh = tile(TerrainType::Grassland);
    assert!(!qualifies(ImprovementKey::Trzoda, &fresh));

    let mut wrong_deposit = tile(TerrainType::Grassland);
    wrong_deposit.deposit = Some(Deposit::Sheep);
    assert!(!qualifies(ImprovementKey::Trzoda, &wrong_deposit));

    let mut unlocked = tile(TerrainType::Grassland);
    unlocked.livestock_unlocked = vec![Deposit::Cattle];
    assert!(qualifies(ImprovementKey::Trzoda, &unlocked));
}

#[test]
fn legacy_improvement_keys_and_bonus_fields_preserve_data_contract() {
    let encoded = r#"{
        "terrain":"plains",
        "forest":false,
        "river_adjacent":false,
        "deposit":null,
        "improvements":["bydlo", "tartak", "glinianka", "kamieniolom", "wyrab"],
        "horse_unlocked":false
    }"#;
    let decoded: Tile = serde_json::from_str(encoded).expect("legacy tile deserializes");
    assert_eq!(
        decoded.improvements,
        vec![
            ImprovementKey::Cattle,
            ImprovementKey::LumberMill,
            ImprovementKey::ClayPit,
            ImprovementKey::Quarry,
            ImprovementKey::Clearing,
        ]
    );
    let reencoded = serde_json::to_string(&decoded).expect("legacy tile serializes");
    assert!(reencoded.contains("bydlo"));
    assert!(reencoded.contains("tartak"));

    let clay = production_for(ImprovementKey::ClayPit);
    assert_eq!((clay.clay, clay.resource_amount), (10, 50));
    let quarry = production_for(ImprovementKey::Quarry);
    assert_eq!((quarry.stone, quarry.resource_amount), (5, 200));
    let salt_works = production_for(ImprovementKey::SaltWorks);
    assert_eq!(
        (
            salt_works.food,
            salt_works.work,
            salt_works.trade,
            salt_works.money
        ),
        (1, 1, 3, 1)
    );
    assert_eq!(production_for(ImprovementKey::Clearing).trade, 1);
    assert_eq!(production_for(ImprovementKey::HuntingCamp).money, 1);
}
