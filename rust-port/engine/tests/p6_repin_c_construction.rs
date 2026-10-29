//! REPIN krok 4b, część C (web 91dc998a): mnożnik kosztu BUDOWY ulepszeń terenu.
//!
//! Web `terrainImprovementConstructionEraMultiplier` (`gra/src/game/terrain-improvements.ts:91`):
//! Kamień 0.5x (epoka <= 1 albo brak), Brąz 1x (epoka 2), Żelazo 2x (epoka 3), potem podwajanie.
//! Web `scaleTerrainImprovementWorkCost` (`terrain-improvements.ts:108`) = FALA2-scaled Stone base
//! x ten mnożnik. Utrzymanie (upkeep, `terrainImprovementEraMultiplier`) pozostaje 1/2/4.
//!
//! Testy granic (N-1 / N / N+1 wokół epok 1, 2, 3) i rozdzielenia budowy od utrzymania.
//! Oczekiwane wartości wyprowadzone ręcznie z formuły webowej, nie z kodu Rust.

use civ_engine::domain::improvements::{
    scale_improvement_work_cost, scale_terrain_improvement_work_cost,
    terrain_improvement_construction_era_multiplier, terrain_improvement_era_multiplier,
};

fn assert_exact(label: &str, got: f64, want: f64) {
    assert!(
        got.to_bits() == want.to_bits(),
        "{label}: got {got:?}, want {want:?}"
    );
}

#[test]
fn construction_multiplier_stone_bronze_iron_boundaries() {
    // N-1 / N / N+1 wokół epok 1 (kamień), 2 (brąz), 3 (żelazo).
    let cases: [(f64, f64); 9] = [
        (0.0, 0.5), // N-1 dla epoki 1 (poniżej dolnej granicy -> kamień)
        (1.0, 0.5), // N kamień
        (1.5, 0.5), // floor -> 1 -> kamień
        (2.0, 1.0), // N brąz
        (2.9, 1.0), // floor -> 2 -> brąz
        (3.0, 2.0), // N żelazo
        (3.5, 2.0), // floor -> 3 -> żelazo
        (4.0, 4.0), // N+1 kontynuacja podwajania
        (5.0, 8.0),
    ];
    for (era, want) in cases {
        assert_exact(
            &format!("construction era {era}"),
            terrain_improvement_construction_era_multiplier(Some(era)),
            want,
        );
    }
}

#[test]
fn construction_multiplier_missing_or_invalid_era_is_stone() {
    // Web: brak / niepoprawna epoka -> domyślne era = 1 -> 0.5.
    for era in [
        None,
        Some(f64::NAN),
        Some(f64::INFINITY),
        Some(f64::NEG_INFINITY),
    ] {
        assert_exact(
            &format!("construction era {era:?}"),
            terrain_improvement_construction_era_multiplier(era),
            0.5,
        );
    }
    // Ujemna epoka: floor(-3) = -3 <= 1 -> kamień.
    assert_exact(
        "construction era -3",
        terrain_improvement_construction_era_multiplier(Some(-3.0)),
        0.5,
    );
}

#[test]
fn scale_work_cost_uses_construction_rates_at_boundaries() {
    // base 1 -> FALA2 Stone base 2 (scale_improvement_work_cost).
    let stone_base = scale_improvement_work_cost(1.0);
    assert_exact("stone base", stone_base, 2.0);
    assert_exact(
        "cost era None",
        scale_terrain_improvement_work_cost(1.0, None),
        1.0,
    );
    assert_exact(
        "cost era 1",
        scale_terrain_improvement_work_cost(1.0, Some(1.0)),
        1.0,
    );
    assert_exact(
        "cost era 2",
        scale_terrain_improvement_work_cost(1.0, Some(2.0)),
        2.0,
    );
    assert_exact(
        "cost era 3",
        scale_terrain_improvement_work_cost(1.0, Some(3.0)),
        4.0,
    );
    assert_exact(
        "cost era 4",
        scale_terrain_improvement_work_cost(1.0, Some(4.0)),
        8.0,
    );
    // Zero / ujemny koszt bazowy zostaje zerem (zachowanie webowe).
    assert_exact(
        "cost base 0",
        scale_terrain_improvement_work_cost(0.0, Some(3.0)),
        0.0,
    );
}

#[test]
fn construction_is_separated_from_upkeep_multiplier() {
    // Upkeep nadal 1/2/4 (nie zmieniony przez 91dc998a) - strażnik przed pomyłką obu ścieżek.
    assert_exact(
        "upkeep era 1",
        terrain_improvement_era_multiplier(Some(1.0)),
        1.0,
    );
    assert_exact(
        "upkeep era 2",
        terrain_improvement_era_multiplier(Some(2.0)),
        2.0,
    );
    assert_exact(
        "upkeep era 3",
        terrain_improvement_era_multiplier(Some(3.0)),
        4.0,
    );
    // Budowa w epoce 3 (x2) rozni sie od utrzymania w epoce 3 (x4).
    assert!(
        terrain_improvement_construction_era_multiplier(Some(3.0))
            != terrain_improvement_era_multiplier(Some(3.0))
    );
}
