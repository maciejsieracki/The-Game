use civ_engine::{PlayableError, PlayableGame, PositionDto, StartGameParams, TurnPhase};

fn params() -> StartGameParams {
    StartGameParams {
        civ_id: "rzymianie".to_owned(),
        civ_name: "Rzymianie".to_owned(),
        epoch: "Epoka Kamienia".to_owned(),
        epoch_id: "kamien".to_owned(),
        difficulty: "Normalny".to_owned(),
        map_size: "Standardowy".to_owned(),
        world_type: "Kontynenty".to_owned(),
        speed: "Normalna".to_owned(),
        seed: 42,
        ..StartGameParams::default()
    }
}

#[test]
fn create_session_is_deterministic_and_contains_playable_entities() {
    let first = PlayableGame::new(params()).expect("default scenario is valid");
    let second = PlayableGame::new(params()).expect("same scenario is valid");

    assert_eq!(first.state(), second.state());
    assert_eq!(first.state().turn, 1);
    assert_eq!(first.state().map.width, 8);
    assert_eq!(first.state().map.height, 5);
    assert!(!first.state().map.tiles.is_empty());
    assert!(first.state().players.iter().any(|player| player.is_human));
    assert!(first.state().cities.iter().any(|city| city.is_capital));
    assert!(!first.state().units.is_empty());
}

#[test]
fn select_and_move_unit_updates_only_the_selected_unit_position() {
    let mut game = PlayableGame::new(params()).expect("default scenario is valid");
    let before = game.state().clone();

    game.select_unit(1).expect("human unit can be selected");
    game.move_unit(1, PositionDto::new(3, 1))
        .expect("adjacent plains tile is a legal destination");

    let after = game.state();
    assert_eq!(after.units.len(), before.units.len());
    assert_eq!(after.units[0].position, PositionDto::new(3, 1));
    assert_eq!(after.cities, before.cities);
    assert_eq!(after.map, before.map);
    assert_eq!(after.players, before.players);
    assert_eq!(after.turn, before.turn);
    assert_eq!(after.selected_unit_id, Some(1));
}

#[test]
fn movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations() {
    let mut game = PlayableGame::new(params()).expect("default scenario is valid");
    game.select_unit(1).expect("human unit can be selected");

    assert_eq!(
        game.move_unit(1, PositionDto::new(8, 1)),
        Err(PlayableError::DestinationOutOfBounds(PositionDto::new(
            8, 1
        )))
    );
    assert_eq!(
        game.move_unit(1, PositionDto::new(0, 0)),
        Err(PlayableError::DestinationImpassable(PositionDto::new(0, 0)))
    );
    assert_eq!(
        game.move_unit(1, PositionDto::new(4, 1)),
        Err(PlayableError::DestinationOutOfRange {
            distance: 2,
            movement: 1,
        })
    );
    assert_eq!(game.state().units[0].position, PositionDto::new(2, 1));
}

#[test]
fn advance_turn_drains_the_canonical_phase_queue_and_refreshes_state() {
    let mut game = PlayableGame::new(params()).expect("default scenario is valid");
    game.select_unit(1).expect("human unit can be selected");
    game.move_unit(1, PositionDto::new(3, 1))
        .expect("adjacent plains tile is a legal destination");

    game.advance_turn().expect("turn can advance");

    assert_eq!(game.state().turn, 2);
    assert_eq!(game.state().phase, TurnPhase::PlayerActions);
    assert_eq!(game.state().last_advanced_phases, TurnPhase::all().to_vec());
    assert_eq!(game.state().units[0].movement, 1);
    assert_eq!(game.pending_phase_count(), TurnPhase::all().len());
}

#[test]
fn start_params_round_trip_with_frontend_camel_case_names() {
    let encoded = serde_json::to_value(params()).expect("params serialize");
    assert_eq!(encoded["civId"], "rzymianie");
    assert_eq!(encoded["epoch"], "Epoka Kamienia");
    assert_eq!(encoded["epochId"], "kamien");
    assert_eq!(encoded["mapSize"], "Standardowy");
    assert_eq!(encoded["rivals"], 6);
    assert_eq!(encoded["typSwiata"], "kontynenty");
    assert_eq!(encoded["mapQuality"], "medium");
    assert_eq!(encoded["renderQuality"], "medium");
    assert_eq!(encoded["mapDetailQuality"], "medium");
    assert_eq!(encoded["worldDensity"]["resources"], "medium");
    assert_eq!(encoded["worldDensityLabels"]["resources"], "Normalnie");
    assert_eq!(encoded["advanced"]["barbariansLevel"], "normalny");
    assert_eq!(encoded["advanced"]["kosztJednostekPace"], "niski");
    assert_eq!(encoded["advanced"]["wzrostLudnosciPace"], "wysoki");
    assert_eq!(encoded["advanced"]["ruchSwiataPace"], "krotki");
    assert_eq!(encoded["advanced"]["cityLimitBase"], 10);
    assert_eq!(encoded["landFractionPercent"], 30);
    assert_eq!(encoded["selectedAiCivIds"], serde_json::json!([]));
    assert_eq!(encoded["villageRewardsEnabled"], true);
    assert!(encoded["unsupportedFeatures"]
        .as_array()
        .expect("feature status array")
        .iter()
        .any(|entry| entry == "advanced:NOT_IMPLEMENTED"));

    let decoded: StartGameParams = serde_json::from_value(encoded).expect("params deserialize");
    assert_eq!(decoded, params());
}

#[test]
fn selected_start_values_change_the_scenario_without_claiming_unsupported_effects() {
    let selected = StartGameParams {
        civ_id: "grecy".to_owned(),
        civ_name: "Grecy".to_owned(),
        epoch: "Epoka Brązu".to_owned(),
        epoch_id: "braz".to_owned(),
        difficulty: "Trudny".to_owned(),
        map_size: "Mały".to_owned(),
        seed: 99,
        ..params()
    };

    let game = PlayableGame::new(selected).expect("selected scenario is valid");
    let state = game.state();
    assert_eq!(state.map.width, 6);
    assert_eq!(state.map.height, 4);
    assert_eq!(state.players[0].civilization, "grecy");
    assert_eq!(state.players[0].name, "Grecy");
    assert_eq!(state.cities[0].name, "Stolica Grecy");
    assert!(state.status.contains("Epoka Brązu"));
    assert_eq!(state.params.difficulty, "Trudny");
    assert!(state
        .params
        .unsupported_features
        .iter()
        .any(|entry| entry == "advanced:NOT_IMPLEMENTED"));

    let super_huge = PlayableGame::new(StartGameParams {
        map_size: "Super Huge".to_owned(),
        ..params()
    })
    .expect("super huge scenario is valid");
    assert_eq!(super_huge.state().map.width, 16);
    assert_eq!(super_huge.state().map.height, 10);
}

#[test]
fn frontend_non_default_payload_reaches_the_rust_start_dto() {
    let payload = serde_json::json!({
        "civId": "grecy",
        "civName": "Grecy",
        "epoch": "Epoka Brązu",
        "epochId": "braz",
        "difficulty": "Trudny",
        "mapSize": "Mały",
        "rivals": 3,
        "speed": "Szybka",
        "worldType": "Wyspy",
        "typSwiata": "wyspy",
        "seed": 99,
        "mapQuality": "high",
        "renderQuality": "high",
        "mapDetailQuality": "high",
        "worldDensity": {
            "resources": "low",
            "rivers": "high",
            "desert": "low",
            "forest": "high",
            "relief": "low"
        },
        "landFractionPercent": 40,
        "advanced": {
            "barbariansLevel": "trudny",
            "battleAlwaysManual": true,
            "victoryMode": "dominacja",
            "buildingCostPace": "wysoki",
            "kosztJednostekPace": "normalny",
            "wzrostLudnosciPace": "wolny",
            "ruchSwiataPace": "dlugi",
            "landFractionPercent": 40,
            "landFractionCustom": true,
            "cityStateDifficultyOverride": "hard",
            "cityLimitBase": 20
        },
        "selectedAiCivIds": ["egipcjanie"],
        "villageRewardsEnabled": false,
        "unsupportedFeatures": ["advanced:NOT_IMPLEMENTED"]
    });
    let params: StartGameParams =
        serde_json::from_value(payload).expect("frontend payload deserializes");
    assert_eq!(params.civ_id, "grecy");
    assert_eq!(params.epoch_id, "braz");
    assert_eq!(params.world_type_id, "wyspy");
    assert_eq!(params.map_quality, "high");
    assert_eq!(params.world_density.rivers, "high");
    assert_eq!(params.advanced.city_limit_base, 20);
    assert_eq!(params.selected_ai_civ_ids, vec!["egipcjanie"]);
    assert!(!params.village_rewards_enabled);

    let game = PlayableGame::new(params).expect("selected frontend payload starts a game");
    assert_eq!(game.state().params.seed, 99);
    assert_eq!(game.state().params.civ_id, "grecy");
}
