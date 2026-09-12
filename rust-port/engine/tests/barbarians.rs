use civ_engine::domain::barbarians::*;
use std::collections::BTreeSet;

fn plain_map(q_start: i32, q_end: i32, r_start: i32, r_end: i32) -> BarbarianMap {
    BarbarianMap::from_tiles((q_start..=q_end).flat_map(|q| {
        (r_start..=r_end).map(move |r| (HexCoord::new(q, r), MapTile::new(Terrain::Plains)))
    }))
}

#[test]
fn camp_spawning_is_deterministic_and_honours_city_and_camp_spacing() {
    let map = plain_map(-8, 8, -4, 4);
    let cities = [CitySnapshot::new(7, 0, 0, 0)];
    let params = BarbParams {
        max_camps: 3,
        min_distance_from_city: 3,
        camp_spacing: 4,
        ..Default::default()
    };

    let first = spawn_camps(&map, &[], &cities, &params, 42);
    let second = spawn_camps(&map, &[], &cities, &params, 42);
    assert_eq!(first, second);
    assert_eq!(first.len(), 3);
    for camp in &first {
        assert!(camp.position().distance(cities[0].position()) >= 3);
    }
    for pair in first.windows(2) {
        assert!(pair[0].position().distance(pair[1].position()) >= 4);
    }
}

#[test]
fn camp_spawning_rejects_owned_and_permanently_cleared_hexes() {
    let owned = HexCoord::new(0, 0);
    let cleared = HexCoord::new(1, 0);
    let map = BarbarianMap::from_tiles([
        (owned, MapTile::owned(Terrain::Plains, 7)),
        (cleared, MapTile::new(Terrain::Plains)),
    ]);
    let params = BarbParams {
        max_camps: 1,
        min_distance_from_city: 0,
        camp_spacing: 0,
        ..Default::default()
    };
    let excluded = BTreeSet::from([cleared]);
    assert!(spawn_camps_with_cleared(&map, &[], &[], &params, 1, &excluded).is_empty());
}

#[test]
fn naval_camps_are_purged_without_spawning_sea_peoples() {
    let map = BarbarianMap::from_tiles([
        (HexCoord::new(0, 0), MapTile::new(Terrain::Plains)),
        (HexCoord::new(1, 0), MapTile::new(Terrain::ShallowWater)),
        (HexCoord::new(0, 1), MapTile::new(Terrain::Plains)),
    ]);
    let camp = BarbCamp {
        naval: true,
        ..BarbCamp::new(1, 0, 0)
    };
    let tick = tick_camps(&[camp], &[], &[], &map, &BarbParams::default());
    assert!(tick.0.is_empty());
    assert!(tick.1.is_empty());
}

#[test]
fn camp_tick_decrements_cooldown_and_respects_owned_unit_cap() {
    let map = plain_map(-2, 2, -2, 2);
    let params = BarbParams {
        units_per_camp: 1,
        spawn_interval: 4,
        ..Default::default()
    };
    let camp = BarbCamp::new(10, 0, 0);

    let (updated, spawns) = tick_camps(std::slice::from_ref(&camp), &[], &[], &map, &params);
    assert_eq!(spawns.len(), 1);
    assert_eq!(spawns[0].camp_id, 10);
    assert_eq!(updated[0].spawn_cooldown, 4);

    let owned = BarbUnit::new(99, 0, 1).with_camp(10);
    let (held, no_spawns) = tick_camps(&updated, &[owned], &[], &map, &params);
    assert!(no_spawns.is_empty());
    assert_eq!(held[0].spawn_cooldown, 3);

    let (ready, _) = tick_camps(
        &[BarbCamp {
            spawn_cooldown: 0,
            ..camp
        }],
        &[BarbUnit::new(99, 0, 1).with_camp(10)],
        &[],
        &map,
        &params,
    );
    assert_eq!(ready[0].spawn_cooldown, 0);
}

#[test]
fn camp_destruction_removes_only_the_entered_camp() {
    let camps = [BarbCamp::new(1, 2, 2), BarbCamp::new(2, 4, 4)];
    let (remaining, destroyed) = destroy_camp_at(&camps, HexCoord::new(2, 2));
    assert_eq!(destroyed, Some(1));
    assert_eq!(remaining, vec![BarbCamp::new(2, 4, 4)]);

    let (unchanged, missing) = destroy_camp_at(&remaining, HexCoord::new(9, 9));
    assert_eq!(missing, None);
    assert_eq!(unchanged, remaining);
}

#[test]
fn movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target() {
    let map = plain_map(-4, 8, -2, 2);
    let params = BarbParams::default();
    let camp = BarbCamp::new(1, 0, 0);

    let wounded = BarbUnit::new(1, 3, 0).with_camp(1).with_health(0.1);
    let enemy = BarbUnit {
        owner_id: 0,
        ..BarbUnit::new(20, 4, 0)
    };
    let mut units = vec![wounded.clone()];
    let commands = decide_barbarian_moves(
        &mut units,
        std::slice::from_ref(&enemy),
        &[],
        std::slice::from_ref(&camp),
        &map,
        &params,
        5,
    );
    assert_eq!(
        commands,
        vec![BarbCommand::Move {
            unit_id: 1,
            to: HexCoord::new(2, 0)
        }]
    );

    let mut adjacent = BarbUnit::new(2, 3, 0);
    let commands = decide_barbarian_moves(
        std::slice::from_mut(&mut adjacent),
        std::slice::from_ref(&enemy),
        &[],
        std::slice::from_ref(&camp),
        &map,
        &params,
        5,
    );
    assert_eq!(
        commands,
        vec![BarbCommand::Attack {
            unit_id: 2,
            target_unit_id: 20
        }]
    );

    let city = CitySnapshot::new(30, 0, 6, 0);
    let mut hunter = BarbUnit::new(3, 1, 0);
    let commands = decide_barbarian_moves(
        std::slice::from_mut(&mut hunter),
        &[],
        &[city],
        &[],
        &map,
        &params,
        5,
    );
    assert_eq!(commands.len(), 1);
    assert!(matches!(commands[0], BarbCommand::Move { unit_id: 3, .. }));
}

#[test]
fn rally_moves_multiple_units_toward_their_shared_camp() {
    let map = plain_map(-4, 4, -2, 2);
    let camp = BarbCamp::new(1, 0, 0);
    let units = vec![
        BarbUnit::new(1, 3, 0).with_camp(1),
        BarbUnit::new(2, 2, 0).with_camp(1),
    ];
    let commands = plan_barbarian_rally(&units, &[camp], &map, &units);
    assert_eq!(commands.len(), 2);
    assert!(commands
        .iter()
        .all(|command| matches!(command, BarbCommand::Move { .. })));
}

#[test]
fn empty_city_capture_is_hard_only_and_defenders_block_barbarians() {
    let city = CitySnapshot::new(5, 0, 2, 2);
    let barb_owner = BARBARIAN_OWNER_ID;
    assert!(!should_allow_barbarian_city_capture(Difficulty::Easy));
    assert!(!should_allow_barbarian_city_capture(Difficulty::Normal));
    assert!(should_allow_barbarian_city_capture(Difficulty::Hard));
    assert!(can_capture_empty_city(
        barb_owner,
        &city,
        &[],
        Difficulty::Hard
    ));

    let defender = BarbUnit {
        owner_id: 0,
        ..BarbUnit::new(8, 2, 2)
    };
    assert!(is_city_capture_blocked_by_defenders(
        barb_owner,
        std::slice::from_ref(&defender),
        &city
    ));
    assert!(!can_capture_empty_city(
        barb_owner,
        &city,
        &[defender],
        Difficulty::Hard
    ));
    assert!(!is_city_capture_blocked_by_defenders(
        0,
        &city_units(),
        &city
    ));
}

fn city_units() -> Vec<BarbUnit> {
    vec![BarbUnit {
        owner_id: 0,
        ..BarbUnit::new(8, 2, 2)
    }]
}

#[test]
fn barbarian_city_garrison_spawns_units_without_a_building_queue() {
    let map = plain_map(-1, 1, -1, 1);
    let params = BarbParams {
        units_per_camp: 2,
        spawn_interval: 3,
        ..Default::default()
    };
    let city = BarbCityGarrison {
        city_id: 4,
        q: 0,
        r: 0,
        spawn_cooldown: 0,
    };

    let tick = tick_barbarian_city_garrisons(&[city], &[], &[], &map, &params);
    assert_eq!(tick.spawns.len(), 1);
    assert_eq!(tick.spawns[0].city_id, 4);
    assert_eq!(tick.cities[0].spawn_cooldown, 3);
}

#[test]
fn state_round_trip_preserves_camp_identity_and_visit_memory() {
    let mut unit = BarbUnit::new(1, 2, 3).with_camp(9).with_health(0.4);
    unit.cleared_city_ids.insert(11);
    let encoded = serde_json::to_string(&unit).expect("unit serializes");
    let decoded: BarbUnit = serde_json::from_str(&encoded).expect("unit deserializes");
    assert_eq!(decoded, unit);
    assert!(is_barbarian(decoded.owner_id));
}
