//! P6-WIRE-WAR-MARCH-PLAN (W5): testy adaptera `plan_war_march` (czesc 2/3) na `PlayableState`.
//!
//! Rdzen: `p6_wire_war_march_core.rs`; wektory z weba: `p6_wire_war_march_vectors.rs`.

use std::collections::{BTreeSet, HashMap, HashSet};

use civ_engine::domain::ai_war_march_plan::{
    plan_war_march, waves_from_state, AllInParams, MarchCommand, MarchParams, FORCED_WAR_WAVES_KEY,
};
use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::playable::{
    PlayableCity, PlayablePlayer, PlayableState, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::war_all_in_capital::{WarAllInPlanOpts, WarAllInUnit};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use civ_engine::domain::war_home_defense::HomeWarOrder;
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::war_world_view::{CityWarExtras, WarWorldView};
use civ_engine::domain::{CityId, PlayerId, UnitId};
use serde_json::json;

fn unit_id_of(cmd: &MarchCommand) -> Vec<String> {
    match cmd {
        MarchCommand::CampaignTarget(_) => vec![],
        MarchCommand::Home(o) => match o {
            HomeWarOrder::Attack { unit_id, .. }
            | HomeWarOrder::Approach { unit_id, .. }
            | HomeWarOrder::Hold { unit_id, .. } => vec![unit_id.clone()],
        },
        MarchCommand::ForcedWave(p) => p.unit_ids.clone(),
        MarchCommand::AllIn(o) => vec![o.unit_id.clone()],
    }
}

fn land_map(w: i32, h: i32) -> RuchMapa {
    let mut map = RuchMapa::new();
    for q in 0..w {
        for r in 0..h {
            map.insert((q, r), RuchHex::new(TerenBazowy::Laka));
        }
    }
    map
}

fn owners(list: &[i64]) -> BTreeSet<i64> {
    list.iter().copied().collect()
}

#[test]
fn adapter_with_enemy_city_orders_all_in_for_owner_only() {
    let mut playable = adapter_state();
    // Bez wrogich jednostek (home nic nie dostaje), miasto wroga zostaje -> cel all-in z build_war_city_targets.
    playable.units.retain(|u| u.owner_id.get() == 1);
    // Drugi wlasny wojownik (id 3) -- pierwszy (id 1) zostanie rozkazany obronie domu, wiec all-in
    // (Z7) dostaje wolna jednostke 3.
    playable.units.push(PlayableUnit {
        id: UnitId::new(3),
        owner_id: PlayerId::new(1),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 2),
        movement: 2,
        movement_max: 2,
        selected: false,
    });
    let extras: HashMap<String, CityWarExtras> = HashMap::new();
    let world = WarWorldView::new(&playable, &extras);
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let strength = |_: &PlayableUnit| 5.0;
    let map = land_map(10, 4);
    let blocked: HashSet<Klucz> = HashSet::new();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let all_units = [
        WarAllInUnit {
            id: "1".to_owned(),
            q: 0,
            r: 1,
            ruch_left: None,
        },
        WarAllInUnit {
            id: "3".to_owned(),
            q: 0,
            r: 2,
            ruch_left: None,
        },
    ];
    let ai = AllInParams {
        units: &all_units,
        nav,
        opts: WarAllInPlanOpts::default(),
        is_barbarian: &|_: i64| false,
    };
    let params = MarchParams {
        enemy_owners: &enemies,
        locked_unit_ids: &locked,
        is_own_territory: &territory,
        strength_of: &strength,
        campaign: None,
        campaign_candidates: &[],
        all_in: Some(ai),
    };
    let state = WarTurnState::default();
    let cmds = plan_war_march(&world, &state, 1, 100, &params);
    assert!(
        cmds.iter()
            .any(|c| matches!(c, MarchCommand::AllIn(o) if o.unit_id == "3")),
        "adapter all-in for owner-1 unit 3 expected: {cmds:?}"
    );
    assert!(
        cmds.iter().all(|c| !matches!(c, MarchCommand::Home(_))),
        "no enemy units -> no home orders: {cmds:?}"
    );
    for cmd in &cmds {
        for id in unit_id_of(cmd) {
            assert!(
                id == "1" || id == "3",
                "only owner 1 units may be ordered, got {id}"
            );
        }
    }
    assert_eq!(cmds, plan_war_march(&world, &state, 1, 100, &params));
}

#[test]
fn waves_from_null_state_are_empty() {
    let state = WarTurnState::default();
    let (waves, history) = waves_from_state(&state);
    assert!(waves.is_empty() && history.is_empty());
}

fn adapter_state() -> PlayableState {
    let mut state = PlayableState::empty();
    state.players = vec![
        PlayablePlayer {
            id: PlayerId::new(1),
            name: "p1".into(),
            civilization: String::new(),
            is_human: true,
        },
        PlayablePlayer {
            id: PlayerId::new(2),
            name: "p2".into(),
            civilization: String::new(),
            is_human: false,
        },
    ];
    state.cities = vec![
        PlayableCity {
            id: CityId::new(1),
            owner_id: PlayerId::new(1),
            name: "a".into(),
            position: PositionDto::new(0, 0),
            is_capital: true,
        },
        PlayableCity {
            id: CityId::new(2),
            owner_id: PlayerId::new(2),
            name: "b".into(),
            position: PositionDto::new(3, 0),
            is_capital: true,
        },
    ];
    let mk = |id: u64, owner: u64, x: u16, y: u16| PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement: 2,
        movement_max: 2,
        selected: false,
    };
    state.units = vec![mk(1, 1, 0, 1), mk(2, 2, 3, 1)];
    state
}

#[test]
fn adapter_without_enemies_orders_only_own_units() {
    let playable = adapter_state();
    let extras: HashMap<String, CityWarExtras> = HashMap::new();
    let world = WarWorldView::new(&playable, &extras);
    let enemies = owners(&[]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let strength = |_: &PlayableUnit| 5.0;
    let params = MarchParams {
        enemy_owners: &enemies,
        locked_unit_ids: &locked,
        is_own_territory: &territory,
        strength_of: &strength,
        campaign: None,
        campaign_candidates: &[],
        all_in: None,
    };
    let state = WarTurnState::default();
    let cmds = plan_war_march(&world, &state, 1, 100, &params);
    // Bez wojny nie ma atakow na jednostki ani fal (brak wrogich miast).
    assert!(cmds
        .iter()
        .all(|c| !matches!(c, MarchCommand::ForcedWave(_))));
    for cmd in &cmds {
        for id in unit_id_of(cmd) {
            assert_eq!(id, "1", "only owner 1 unit may be ordered, got {id}");
        }
    }
    let again = plan_war_march(&world, &state, 1, 100, &params);
    assert_eq!(cmds, again);
}

/// Stan z niepusta pamiecia fal (`forcedWarWavesByPairKey`) w formacie zapisu weba.
fn state_with_history(target_city: &str) -> WarTurnState {
    let mut state = WarTurnState::default();
    state.opaque.insert(
        FORCED_WAR_WAVES_KEY.to_owned(),
        json!([["1:2", {
            "nextWaveId": 3,
            "waves": [{
                "id": "wave-1", "targetCityId": "9", "unitIds": ["7", "8"],
                "originHex": {"q": 0, "r": 0}, "rallyPoint": {"q": 1, "r": 0},
                "approachSector": 2, "createdTurn": 40
            }],
            "history": [{
                "targetCityId": target_city,
                "originHex": {"q": 0, "r": 1}, "rallyPoint": {"q": 0, "r": 1},
                "approachSector": 3, "createdTurn": 30
            }]
        }]]),
    );
    state
}

#[test]
fn waves_from_state_reads_waves_and_history() {
    let (waves, history) = waves_from_state(&state_with_history("2"));
    assert_eq!(waves.len(), 1);
    assert_eq!(waves[0].id, "wave-1");
    assert_eq!(waves[0].target_city_id, "9");
    assert_eq!(waves[0].unit_ids, vec!["7".to_owned(), "8".to_owned()]);
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].target_city_id, "2");
    assert_eq!(history[0].created_turn, 30.0);
}

/// Wrog (dwa miasta) + niepusty `opaque`: historia fal zmienia cel fali (poprzednio atakowane miasto jest
/// mniej preferowane), czyli adapter realnie czyta `waves_from_state`.
#[test]
fn adapter_enemy_and_opaque_state_changes_wave_target() {
    let mut playable = adapter_state();
    playable.units.retain(|u| u.owner_id.get() == 1);
    for (id, x, y) in [(3u64, 1u16, 1u16), (4, 0, 2)] {
        playable.units.push(PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(1),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(x, y),
            movement: 2,
            movement_max: 2,
            selected: false,
        });
    }
    playable.cities.push(PlayableCity {
        id: CityId::new(3),
        owner_id: PlayerId::new(2),
        name: "c".into(),
        position: PositionDto::new(8, 0),
        is_capital: false,
    });
    let extras: HashMap<String, CityWarExtras> = HashMap::new();
    let world = WarWorldView::new(&playable, &extras);
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let strength = |_: &PlayableUnit| 5.0;
    let params = MarchParams {
        enemy_owners: &enemies,
        locked_unit_ids: &locked,
        is_own_territory: &territory,
        strength_of: &strength,
        campaign: None,
        campaign_candidates: &[],
        all_in: None,
    };
    let wave_target = |state: &WarTurnState| {
        plan_war_march(&world, state, 1, 100, &params)
            .into_iter()
            .find_map(|c| match c {
                MarchCommand::ForcedWave(p) => Some(p.target_city_id),
                _ => None,
            })
    };
    // Pusty stan: najblizsze miasto wroga (id 2 w (3,0)).
    assert_eq!(wave_target(&WarTurnState::default()).as_deref(), Some("2"));
    // Historia atakowala miasto 2 -> wybor przechodzi na miasto 3.
    assert_eq!(wave_target(&state_with_history("2")).as_deref(), Some("3"));
}
