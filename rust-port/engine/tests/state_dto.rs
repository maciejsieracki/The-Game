use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, TerrainDto,
    TurnDto, UnitDto, UnitId, UnitKindDto,
};

fn valid_state() -> GameStateDto {
    let map = MapDto::new(
        2,
        1,
        vec![
            civ_engine::TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            civ_engine::TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");

    GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(1).expect("turn one is valid"),
    )
    .expect("state is valid")
}

#[test]
fn canonical_state_round_trips_through_serde() {
    let state = valid_state();

    let encoded = serde_json::to_string(&state).expect("state serializes");
    let decoded: GameStateDto = serde_json::from_str(&encoded).expect("state deserializes");

    assert_eq!(decoded, state);
    assert_eq!(decoded.turn().number(), 1);
    assert_eq!(decoded.map().width(), 2);
    assert_eq!(decoded.cities().len(), 1);
    assert_eq!(decoded.units().len(), 1);
}

#[test]
fn invalid_one_based_turn_is_rejected_during_state_deserialization() {
    let invalid_state = r#"{
        "map":{"width":1,"height":1,"tiles":[{"position":{"x":0,"y":0},"terrain":"Plains"}]},
        "civilizations":[],
        "cities":[],
        "units":[],
        "turn":0
    }"#;

    let decoded: Result<GameStateDto, _> = serde_json::from_str(invalid_state);

    assert!(decoded.is_err());
}

#[test]
fn invalid_entity_reference_is_rejected_by_state_constructor() {
    let state = valid_state();
    let invalid_civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(999)],
        vec![UnitId::new(8)],
    )
    .expect("local civilization shape is valid");
    let result = GameStateDto::new(
        state.map().clone(),
        vec![invalid_civilization],
        state.cities().to_vec(),
        state.units().to_vec(),
        state.turn(),
    );

    assert!(result.is_err());
}

#[test]
fn map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds() {
    let tile = |position| civ_engine::TileDto::new(position, TerrainDto::Plains);

    assert_eq!(
        MapDto::new(0, 1, Vec::new()),
        Err(civ_engine::ValidationError::InvalidMapDimensions {
            width: 0,
            height: 1,
        })
    );
    assert_eq!(
        MapDto::new(2, 1, vec![tile(PositionDto::new(0, 0))]),
        Err(civ_engine::ValidationError::MapTileCount {
            expected: 2,
            actual: 1,
        })
    );
    assert_eq!(
        MapDto::new(
            2,
            1,
            vec![tile(PositionDto::new(0, 0)), tile(PositionDto::new(0, 0))]
        ),
        Err(civ_engine::ValidationError::DuplicateMapTile(
            PositionDto::new(0, 0)
        ))
    );
    assert_eq!(
        MapDto::new(1, 1, vec![tile(PositionDto::new(1, 0))]),
        Err(civ_engine::ValidationError::MapTileOutOfBounds {
            position: PositionDto::new(1, 0),
            width: 1,
            height: 1,
        })
    );
}

#[test]
fn civilization_rejects_empty_names_and_duplicate_entity_references() {
    assert_eq!(
        CivilizationDto::new(PlayerId::new(1), "  ", vec![], vec![]),
        Err(civ_engine::ValidationError::EmptyName {
            entity: "civilization"
        })
    );
    assert_eq!(
        CivilizationDto::new(
            PlayerId::new(1),
            "Rome",
            vec![CityId::new(7), CityId::new(7)],
            vec![]
        ),
        Err(civ_engine::ValidationError::DuplicateCityReference(
            CityId::new(7)
        ))
    );
    assert_eq!(
        CivilizationDto::new(
            PlayerId::new(1),
            "Rome",
            vec![],
            vec![UnitId::new(8), UnitId::new(8)]
        ),
        Err(civ_engine::ValidationError::DuplicateUnitReference(
            UnitId::new(8)
        ))
    );
}

#[test]
fn city_rejects_empty_names_and_zero_population() {
    assert_eq!(
        CityDto::new(
            CityId::new(7),
            PlayerId::new(1),
            "",
            PositionDto::new(0, 0),
            1
        ),
        Err(civ_engine::ValidationError::EmptyName { entity: "city" })
    );
    assert_eq!(
        CityDto::new(
            CityId::new(7),
            PlayerId::new(1),
            "Roma",
            PositionDto::new(0, 0),
            0
        ),
        Err(civ_engine::ValidationError::InvalidPopulation)
    );
}

#[test]
fn state_rejects_duplicate_civilization_city_and_unit_ids() {
    let state = valid_state();

    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            vec![
                state.civilizations()[0].clone(),
                state.civilizations()[0].clone()
            ],
            state.cities().to_vec(),
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::DuplicateCivilization(
            PlayerId::new(1)
        ))
    );
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            vec![state.cities()[0].clone(), state.cities()[0].clone()],
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::DuplicateCity(CityId::new(7)))
    );
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            state.cities().to_vec(),
            vec![state.units()[0].clone(), state.units()[0].clone()],
            state.turn(),
        ),
        Err(civ_engine::ValidationError::DuplicateUnit(UnitId::new(8)))
    );
}

#[test]
fn state_rejects_unknown_and_mismatched_entity_owners() {
    let state = valid_state();

    let unknown_city_owner = CityDto::new(
        CityId::new(7),
        PlayerId::new(2),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            vec![unknown_city_owner],
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::UnknownCityOwner(
            PlayerId::new(2)
        ))
    );

    let unknown_unit_owner = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(2),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            state.cities().to_vec(),
            vec![unknown_unit_owner],
            state.turn(),
        ),
        Err(civ_engine::ValidationError::UnknownUnitOwner(
            PlayerId::new(2)
        ))
    );

    let city_owner_mismatch =
        CivilizationDto::new(PlayerId::new(1), "Rome", vec![], vec![UnitId::new(8)])
            .expect("civilization shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            vec![city_owner_mismatch],
            state.cities().to_vec(),
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::CityOwnerMismatch {
            city: CityId::new(7),
            civilization: PlayerId::new(1),
        })
    );

    let unit_owner_mismatch =
        CivilizationDto::new(PlayerId::new(1), "Rome", vec![CityId::new(7)], vec![])
            .expect("civilization shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            vec![unit_owner_mismatch],
            state.cities().to_vec(),
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::UnitOwnerMismatch {
            unit: UnitId::new(8),
            civilization: PlayerId::new(1),
        })
    );
}

#[test]
fn state_rejects_city_and_unit_positions_outside_the_map() {
    let state = valid_state();
    let out_of_bounds_city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(2, 0),
        1,
    )
    .expect("city shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            vec![out_of_bounds_city],
            state.units().to_vec(),
            state.turn(),
        ),
        Err(civ_engine::ValidationError::EntityOutOfBounds {
            entity: "city",
            position: PositionDto::new(2, 0),
        })
    );

    let out_of_bounds_unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(2, 0),
    )
    .expect("unit shape is valid");
    assert_eq!(
        GameStateDto::new(
            state.map().clone(),
            state.civilizations().to_vec(),
            state.cities().to_vec(),
            vec![out_of_bounds_unit],
            state.turn(),
        ),
        Err(civ_engine::ValidationError::EntityOutOfBounds {
            entity: "unit",
            position: PositionDto::new(2, 0),
        })
    );
}

#[test]
fn state_rejects_unknown_unit_reference() {
    let state = valid_state();
    let invalid_civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(999)],
    )
    .expect("local civilization shape is valid");

    let result = GameStateDto::new(
        state.map().clone(),
        vec![invalid_civilization],
        state.cities().to_vec(),
        vec![],
        state.turn(),
    );

    assert_eq!(
        result,
        Err(civ_engine::ValidationError::UnknownUnitReference(
            UnitId::new(999)
        ))
    );
}
