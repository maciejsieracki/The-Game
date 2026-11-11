//! P6-WIRE-WAR-WORLDVIEW (W2): adaptery `WarWorldView` vs wartosci z URUCHOMIONEGO weba.
//! Wektory: `tests/p6_wire_war_view_vectors.json` (generator: `tests/p6_wire_war_view_gen.mjs`,
//! Node 22 `--experimental-strip-types` na `gra/src/game/ai-war-target-select.ts` z `origin/main`).
//! Test: wejscia zbudowane w `PlayableState` -> adaptery -> `build_war_city_targets` == wynik weba.

use std::collections::HashMap;

use civ_engine::domain::playable::{
    PlayableCity, PlayablePlayer, PlayableState, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::war_target_select::{build_war_city_targets, BuildWarTargetsInput};
use civ_engine::domain::war_world_view::{CityWarExtras, WarWorldView, WAVE_UNIT_CATEGORY_LAND};
use civ_engine::domain::{CityId, PlayerId, UnitId};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_wire_war_view_vectors.json");

fn build_state(s: &Value) -> PlayableState {
    let mut state = PlayableState::empty();
    state.players = s["players"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| PlayablePlayer {
            id: PlayerId::new(p["id"].as_u64().unwrap()),
            name: format!("p{}", p["id"]),
            civilization: String::new(),
            is_human: p["isHuman"].as_bool().unwrap(),
        })
        .collect();
    state.cities = s["cities"]
        .as_array()
        .unwrap()
        .iter()
        .map(|c| PlayableCity {
            id: CityId::new(c["id"].as_str().unwrap().parse().unwrap()),
            owner_id: PlayerId::new(c["owner"].as_u64().unwrap()),
            name: format!("c{}", c["id"]),
            position: PositionDto::new(
                c["x"].as_u64().unwrap() as u16,
                c["y"].as_u64().unwrap() as u16,
            ),
            is_capital: c["isCapital"].as_bool().unwrap(),
        })
        .collect();
    state.units = s["combatUnits"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
        .map(|(i, u)| PlayableUnit {
            id: UnitId::new(i as u64 + 1),
            owner_id: PlayerId::new(u["owner"].as_u64().unwrap()),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(
                u["x"].as_u64().unwrap() as u16,
                u["y"].as_u64().unwrap() as u16,
            ),
            movement: 2,
            movement_max: 2,
            selected: false,
        })
        .collect();
    state
}

fn ids(v: &Value, key: &str) -> Vec<i64> {
    v[key]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_i64().unwrap())
        .collect()
}

#[test]
fn war_target_adapters_match_web_build_war_city_targets() {
    let doc: Value = serde_json::from_str(VECTORS).unwrap();
    let scenarios = doc["scenarios"].as_array().unwrap();
    assert!(scenarios.len() >= 3, "wymagane >= 3 scenariusze");
    let extras = HashMap::new();
    for s in scenarios {
        let state = build_state(s);
        let view = WarWorldView::new(&state, &extras);
        let barbarians = ids(s, "barbarianOwnerIds");
        let engage = ids(s, "engageOwnerIds");
        let enemies = ids(s, "enemyOwnerIds");
        let cities = view.war_target_cities();
        let units = view.war_target_units();
        let inp = BuildWarTargetsInput {
            self_owner_id: s["selfOwnerId"].as_i64().unwrap(),
            enemy_owner_ids: &enemies,
            engage: &|o| engage.contains(&o),
            cities: &cities,
            combat_units: &units,
            is_human: &|o| view.is_human(o),
            is_barbarian: &|o| barbarians.contains(&o),
            capital_city_id_for_owner: &|o| view.capital_city_id(o),
        };
        let got: Vec<Value> = build_war_city_targets(&inp)
            .into_iter()
            .map(|t| {
                serde_json::json!({
                    "ownerId": t.target.owner_id,
                    "cityId": t.target.city_id,
                    "q": t.target.q,
                    "r": t.target.r,
                    "defenders": t.defenders,
                })
            })
            .collect();
        let want = s["expected"].as_array().unwrap();
        assert_eq!(got.len(), want.len(), "scenariusz: {}", s["name"]);
        for (g, w) in got.iter().zip(want.iter()) {
            assert_eq!(g, w, "scenariusz: {}", s["name"]);
        }
    }
}

#[test]
fn adapters_are_deterministic_and_do_not_mutate_state() {
    let doc: Value = serde_json::from_str(VECTORS).unwrap();
    let state = build_state(&doc["scenarios"][0]);
    let snapshot = state.clone();
    let extras = HashMap::new();
    let view = WarWorldView::new(&state, &extras);
    let strength = |_: &PlayableUnit| 3.0;
    assert_eq!(view.war_target_cities(), view.war_target_cities());
    assert_eq!(
        view.home_war_units(&strength),
        view.home_war_units(&strength)
    );
    assert_eq!(view.forced_war_neighbors(2), view.forced_war_neighbors(2));
    assert_eq!(state, snapshot);
}

#[test]
fn city_extras_flow_into_home_war_and_siege_adapters() {
    let doc: Value = serde_json::from_str(VECTORS).unwrap();
    let state = build_state(&doc["scenarios"][0]);
    let first_id = state.cities[0].id.get().to_string();
    let mut extras = HashMap::new();
    extras.insert(
        first_id.clone(),
        CityWarExtras {
            founded_by: Some(7),
            founded_by_owner: Some(false),
            captured_from_owner_id: Some(5),
            ma_mur: true,
            oblegane: true,
        },
    );
    let view = WarWorldView::new(&state, &extras);
    let home = view.home_war_cities();
    assert_eq!(home[0].founded_by, Some(7));
    assert_eq!(home[0].founded_by_owner, Some(false));
    assert_eq!(home[0].captured_from_owner_id, Some(5));
    assert_eq!(home[1].founded_by, None, "brak wpisu = wartosci domyslne");
    let sieg = view.siege_cities();
    assert!(sieg[0].ma_mur && sieg[0].oblegane);
    assert!(!sieg[1].ma_mur && !sieg[1].oblegane);
}

#[test]
fn wave_units_use_non_galley_category_and_units_are_field_units() {
    let doc: Value = serde_json::from_str(VECTORS).unwrap();
    let state = build_state(&doc["scenarios"][0]);
    let extras = HashMap::new();
    let view = WarWorldView::new(&state, &extras);
    let waves = view.wave_units();
    assert!(!waves.is_empty());
    assert!(waves
        .iter()
        .all(|u| u.category == WAVE_UNIT_CATEGORY_LAND && u.category != "galera"));
    let home = view.home_war_units(&|_| 1.5);
    assert!(home
        .iter()
        .all(|u| u.is_field && !u.embarked && u.strength == 1.5));
    assert_eq!(home[0].ruch_left, 2.0);
}

#[test]
fn forced_war_neighbors_use_capital_and_skip_self() {
    let doc: Value = serde_json::from_str(VECTORS).unwrap();
    // Scenariusz 3 (gracz 0 jako atakujacy): wrogowie 1 i 2, stolice (5,4) i (6,1).
    let state = build_state(&doc["scenarios"][2]);
    let extras = HashMap::new();
    let view = WarWorldView::new(&state, &extras);
    let n = view.forced_war_neighbors(0);
    assert_eq!(n.len(), 2);
    assert_eq!((n[0].owner_id, n[0].q, n[0].r), (1, 5, 4));
    assert_eq!((n[1].owner_id, n[1].q, n[1].r), (2, 6, 1));
    assert!(view.forced_war_neighbors(1).iter().all(|c| c.owner_id != 1));
}
