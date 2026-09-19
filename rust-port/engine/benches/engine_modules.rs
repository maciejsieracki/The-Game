//! Stable standard-library microbenchmarks for the public engine modules.
//!
//! The crate intentionally has no benchmark-only dependency in this stage, so
//! these targets use Cargo's stable bench harness and `std::time::Instant`.
//! Each workload is deterministic, reports a checksum to prevent elimination,
//! and is scoped to a public Rust engine module.  They are measurements for
//! regression tracking, not a release-performance claim.

use std::collections::{BTreeMap, BTreeSet};
use std::hint::black_box;
use std::time::Instant;

use civ_engine::domain::pathfinding::{find_path, HexCoord, PathMap, TerrainType, Tile};
use civ_engine::domain::resource_production::{stack_resource_production, ResourceKey};
use civ_engine::domain::turn_economy::{EconomyBalances, EconomyFlow};
use civ_engine::{
    advance_city_growth, generate_map, recruitment_for, resolve_turn, CityGrowthParams,
    CityGrowthState, WorldType,
};

fn report(name: &str, iterations: u32, started: Instant, checksum: u64) {
    assert_ne!(checksum, 0, "benchmark checksum must observe the workload");
    println!(
        "BENCH name={name} iterations={iterations} elapsed_ns={} checksum={checksum}",
        started.elapsed().as_nanos()
    );
}

#[test]
fn map_generation_benchmark() {
    let iterations = 8;
    let started = Instant::now();
    let mut checksum = 0_u64;
    for seed in 1..=iterations {
        let map = generate_map(32, 24, seed, WorldType::Continents).expect("valid map workload");
        checksum = checksum
            .wrapping_add(map.tiles.len() as u64)
            .wrapping_add(map.terrain_counts().iter().sum::<usize>() as u64);
        black_box(map);
    }
    report("map_generation", iterations, started, checksum);
}

#[test]
fn pathfinding_benchmark() {
    let iterations = 2_000;
    let coordinates = (0..=64).map(|q| (HexCoord::new(q, 0), Tile::new(TerrainType::Grassland)));
    let map = PathMap::from_tiles(coordinates);
    let occupied = BTreeSet::new();
    let started = Instant::now();
    let mut checksum = 0_u64;
    for _ in 0..iterations {
        let path = find_path(&map, HexCoord::new(0, 0), HexCoord::new(64, 0), &occupied)
            .expect("line path workload");
        checksum = checksum.wrapping_add(path.len() as u64);
        black_box(path);
    }
    report("pathfinding", iterations, started, checksum);
}

#[test]
fn economy_benchmark() {
    let iterations = 5_000;
    let income = EconomyFlow {
        treasury: 20,
        science: 4,
        culture: 3,
        food: 10,
        work: 6,
        resources: BTreeMap::from([(String::from("wood"), 4)]),
    };
    let expenses = EconomyFlow {
        treasury: 5,
        science: 2,
        culture: 1,
        food: 4,
        work: 3,
        resources: BTreeMap::from([(String::from("wood"), 2)]),
    };
    let balances = EconomyBalances::zero();
    let started = Instant::now();
    let mut checksum = 0_u64;
    for turn in 1..=iterations {
        let settlement = resolve_turn(turn, &balances, income.clone(), &expenses)
            .expect("bounded economy workload");
        checksum = checksum
            .wrapping_add(u64::from(settlement.next_turn))
            .wrapping_add(settlement.after.treasury);
        black_box(settlement);
    }
    report("turn_economy", iterations, started, checksum);
}

#[test]
fn growth_and_resource_catalogue_benchmark() {
    let iterations = 20_000;
    let growth_params = CityGrowthParams::normal();
    let growth_state = CityGrowthState {
        population: 3,
        health: 5.0,
        food_store: 10,
        ..CityGrowthState::default()
    };
    let resource_keys = ["tartak", "kamieniolom", "glinianka", "kopalnia_miedzi"];
    let started = Instant::now();
    let mut checksum = 0_u64;
    for iteration in 0..iterations {
        let growth = advance_city_growth(&growth_state, f64::from(iteration % 64), &growth_params);
        let totals = stack_resource_production(resource_keys, (iteration % 3 + 1) as u8);
        let warrior = recruitment_for("Wojownik").expect("canonical recruitment workload");
        checksum = checksum
            .wrapping_add(u64::from(growth.population))
            .wrapping_add(u64::from(totals.amount_for(ResourceKey::Wood)))
            .wrapping_add(u64::from(warrior.gold_cost));
        black_box((growth, totals, warrior));
    }
    report("growth_resource_catalogue", iterations, started, checksum);
}
