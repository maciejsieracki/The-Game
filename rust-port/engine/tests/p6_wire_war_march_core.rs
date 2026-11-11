//! P6-WIRE-WAR-MARCH-PLAN (W5): testy rdzenia planera marszu wojennego `ai_war_march_plan` (czesc 1/3).
//!
//! Zakres: `plan_war_march_core` na syntetycznych danych (kolejnosc komend, cel kampanii, wykluczenia
//! jednostek, determinizm). Adapter: `p6_wire_war_march_adapter.rs`; wektory z weba:
//! `p6_wire_war_march_vectors.rs` (generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/`).

use std::collections::{BTreeSet, HashSet};

use civ_engine::domain::ai_general_war_campaign::WarTargetCandidate;
use civ_engine::domain::ai_war_march_plan::{
    plan_war_march_core, AllInParams, MarchCommand, MarchCoreInput,
};
use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::war_all_in_capital::{WarAllInPlanOpts, WarAllInUnit, WarCapitalTarget};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use civ_engine::domain::war_forced_waves::{WaveCity, WaveUnit};
use civ_engine::domain::war_home_defense::{HomeWarCity, HomeWarOrder, HomeWarUnit};
use civ_engine::domain::war_target_select::WarCityTarget;

fn hu(id: &str, owner: i64, q: i32, r: i32, strength: f64) -> HomeWarUnit {
    HomeWarUnit {
        id: id.to_owned(),
        owner_id: owner,
        q,
        r,
        is_field: true,
        embarked: false,
        ruch_left: 2.0,
        oblega_city_id: None,
        strength,
    }
}

fn hc(id: &str, owner: i64, q: i32, r: i32) -> HomeWarCity {
    HomeWarCity {
        id: id.to_owned(),
        q,
        r,
        owner_id: owner,
        captured_from_owner_id: None,
        founded_by: None,
        founded_by_owner: None,
    }
}

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

#[allow(clippy::too_many_arguments)]
fn core<'a>(
    owner: i64,
    enemies: &'a BTreeSet<i64>,
    locked: &'a HashSet<String>,
    territory: &'a dyn Fn(i32, i32) -> bool,
    cities: &'a [HomeWarCity],
    units: &'a [HomeWarUnit],
    wave_cities: &'a [WaveCity],
    wave_units: &'a [WaveUnit],
    candidates: &'a [WarTargetCandidate],
) -> MarchCoreInput<'a> {
    MarchCoreInput {
        owner_id: owner,
        turn: 100,
        enemy_owners: enemies,
        locked_unit_ids: locked,
        is_own_territory: territory,
        all_home_cities: cities,
        all_home_units: units,
        wave_cities,
        wave_units,
        active_waves: &[],
        wave_history: &[],
        campaign: None,
        campaign_candidates: candidates,
        all_in_targets: &[],
        all_in: None,
    }
}

#[test]
fn empty_input_gives_no_commands() {
    let enemies = owners(&[]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let inp = core(1, &enemies, &locked, &territory, &[], &[], &[], &[], &[]);
    assert!(plan_war_march_core(&inp).is_empty());
}

#[test]
fn campaign_picks_nearest_reachable_target() {
    let enemies = owners(&[2, 3]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let candidates = [
        WarTargetCandidate {
            owner_id: 2,
            distance: 3.0,
            reachable: None,
        },
        WarTargetCandidate {
            owner_id: 3,
            distance: 1.0,
            reachable: None,
        },
    ];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &[],
        &[],
        &[],
        &[],
        &candidates,
    );
    let cmds = plan_war_march_core(&inp);
    assert_eq!(cmds.first(), Some(&MarchCommand::CampaignTarget(Some(3))));
}

#[test]
fn campaign_all_unreachable_gives_none_target() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let candidates = [WarTargetCandidate {
        owner_id: 2,
        distance: 1.0,
        reachable: Some(false),
    }];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &[],
        &[],
        &[],
        &[],
        &candidates,
    );
    assert_eq!(
        plan_war_march_core(&inp).first(),
        Some(&MarchCommand::CampaignTarget(None))
    );
}

#[test]
fn locked_units_are_never_ordered() {
    let enemies = owners(&[2]);
    let locked: HashSet<String> = ["u1".to_owned()].into_iter().collect();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 1, 0)];
    let units = [
        hu("u1", 1, 0, 1, 5.0),
        hu("u2", 1, 0, 2, 5.0),
        hu("e1", 2, 1, 1, 9.0),
    ];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &[],
        &[],
        &[],
    );
    for cmd in plan_war_march_core(&inp) {
        assert!(
            !unit_id_of(&cmd).contains(&"u1".to_owned()),
            "locked u1 ordered: {cmd:?}"
        );
    }
}

#[test]
fn enemy_units_are_never_our_orders() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 5, 0)];
    let units = [hu("u1", 1, 0, 1, 5.0), hu("e1", 2, 1, 1, 9.0)];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &[],
        &[],
        &[],
    );
    for cmd in plan_war_march_core(&inp) {
        assert!(
            !unit_id_of(&cmd).contains(&"e1".to_owned()),
            "enemy e1 ordered: {cmd:?}"
        );
    }
}

#[test]
fn forced_wave_excludes_units_already_ordered_at_home() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 2, 0)];
    let units = [hu("u1", 1, 0, 1, 5.0), hu("e1", 2, 1, 1, 9.0)];
    let wave_units: Vec<WaveUnit> = ["u1", "w1", "w2", "w3"]
        .iter()
        .map(|id| wave_unit(id, 1, 0.0, 1.0))
        .collect();
    let wave_cities = [WaveCity {
        id: "c2".to_owned(),
        owner_id: 2,
        q: 2.0,
        r: 0.0,
    }];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &wave_cities,
        &wave_units,
        &[],
    );
    let cmds = plan_war_march_core(&inp);
    // Niepusty test: u1 MUSI dostac rozkaz domu (inaczej wykluczenie nic nie dowodzi) ...
    let home_ids: HashSet<String> = cmds
        .iter()
        .filter(|c| matches!(c, MarchCommand::Home(_)))
        .flat_map(unit_id_of)
        .collect();
    assert!(
        home_ids.contains("u1"),
        "u1 should be home-ordered: {cmds:?}"
    );
    // ... a fala MUSI powstac z w1..w3 i pominac u1.
    let wave = cmds
        .iter()
        .find_map(|c| match c {
            MarchCommand::ForcedWave(p) => Some(p),
            _ => None,
        })
        .unwrap_or_else(|| panic!("forced wave expected: {cmds:?}"));
    assert_eq!(wave.unit_ids.len(), 3);
    assert!(!wave.unit_ids.contains(&"u1".to_owned()));
    for id in &wave.unit_ids {
        assert!(!home_ids.contains(id), "wave reuses home-ordered unit {id}");
    }
}

#[test]
fn home_defense_orders_attack_adjacent_enemy() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 6, 0)];
    let units = [
        hu("u1", 1, 0, 2, 5.0),
        hu("u2", 1, 0, 3, 5.0),
        hu("e1", 2, 1, 1, 9.0),
    ];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &[],
        &[],
        &[],
    );
    let cmds = plan_war_march_core(&inp);
    assert!(
        cmds.iter().any(|c| matches!(
            c,
            MarchCommand::Home(HomeWarOrder::Attack { unit_id, target_unit_id, .. })
                if unit_id == "u1" && target_unit_id == "e1"
        )),
        "expected Attack u1->e1, got {cmds:?}"
    );
}

#[test]
fn forced_wave_is_produced_for_three_units_and_enemy_city() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let wave_units: Vec<WaveUnit> = ["w1", "w2", "w3"]
        .iter()
        .map(|id| wave_unit(id, 1, 0.0, 1.0))
        .collect();
    let wave_cities = [WaveCity {
        id: "c2".to_owned(),
        owner_id: 2,
        q: 2.0,
        r: 0.0,
    }];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &[],
        &[],
        &wave_cities,
        &wave_units,
        &[],
    );
    let cmds = plan_war_march_core(&inp);
    let wave = cmds.iter().find_map(|c| match c {
        MarchCommand::ForcedWave(p) => Some(p),
        _ => None,
    });
    let wave = wave.unwrap_or_else(|| panic!("forced wave expected: {cmds:?}"));
    assert_eq!(wave.target_city_id, "c2");
    assert_eq!(wave.unit_ids.len(), 3);
}

#[test]
fn forced_wave_needs_enemy_city_and_is_skipped_without_war() {
    let enemies = owners(&[]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let wave_units: Vec<WaveUnit> = ["w1", "w2", "w3"]
        .iter()
        .map(|id| wave_unit(id, 1, 0.0, 1.0))
        .collect();
    let wave_cities = [WaveCity {
        id: "c2".to_owned(),
        owner_id: 2,
        q: 2.0,
        r: 0.0,
    }];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &[],
        &[],
        &wave_cities,
        &wave_units,
        &[],
    );
    assert!(plan_war_march_core(&inp)
        .iter()
        .all(|c| !matches!(c, MarchCommand::ForcedWave(_))));
}

#[test]
fn all_in_attack_comes_last_and_skips_locked_units() {
    let enemies = owners(&[2]);
    let locked: HashSet<String> = ["x1".to_owned()].into_iter().collect();
    let territory = |_: i32, _: i32| true;
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
            id: "x1".to_owned(),
            q: 0,
            r: 0,
            ruch_left: None,
        },
        WarAllInUnit {
            id: "x2".to_owned(),
            q: 0,
            r: 1,
            ruch_left: None,
        },
    ];
    let targets = vec![WarCityTarget {
        target: WarCapitalTarget {
            owner_id: 2,
            city_id: "b".to_owned(),
            q: 4,
            r: 1,
        },
        defenders: None,
    }];
    let ai = AllInParams {
        units: &all_units,
        nav,
        opts: WarAllInPlanOpts::default(),
        is_barbarian: &|_: i64| false,
    };
    let cities = [hc("c1", 1, 0, 0)];
    let units = [hu("x1", 1, 0, 0, 5.0), hu("x2", 1, 0, 1, 5.0)];
    let mut inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &[],
        &[],
        &[],
    );
    inp.all_in_targets = targets.as_slice();
    inp.all_in = Some(&ai);
    let cmds = plan_war_march_core(&inp);
    let allin: Vec<&MarchCommand> = cmds
        .iter()
        .filter(|c| matches!(c, MarchCommand::AllIn(_)))
        .collect();
    assert!(!allin.is_empty(), "all-in order expected: {cmds:?}");
    for c in &allin {
        assert!(
            !unit_id_of(c).contains(&"x1".to_owned()),
            "locked x1 in all-in"
        );
    }
    if let MarchCommand::AllIn(o) = allin[0] {
        assert_eq!(o.unit_id, "x2");
        assert_eq!(o.target_city_id, "b");
    }
    // Atak all-in jest ostatnim etapem.
    assert!(matches!(cmds.last(), Some(MarchCommand::AllIn(_))));
}

#[test]
fn core_is_deterministic() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 2, 0)];
    let units = [hu("u1", 1, 0, 1, 5.0), hu("e1", 2, 1, 1, 9.0)];
    let inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &[],
        &[],
        &[],
    );
    assert_eq!(plan_war_march_core(&inp), plan_war_march_core(&inp));
}

fn wave_unit(id: &str, owner: i64, q: f64, r: f64) -> WaveUnit {
    WaveUnit {
        id: id.to_owned(),
        owner_id: owner,
        category: "land".to_owned(),
        q,
        r,
        ruch_left: 2.0,
        is_civilian: false,
        in_garnizon: false,
        oblega_city_id: None,
        embarked: false,
        sea_raider: false,
    }
}

/// Kolejnosc komend (web S1 -> P1 -> S3 -> atak): kampania -> dom -> fala -> all-in.
#[test]
fn commands_come_in_order_campaign_home_wave_all_in() {
    let enemies = owners(&[2]);
    let locked = HashSet::new();
    let territory = |_: i32, _: i32| true;
    let cities = [hc("c1", 1, 0, 0), hc("c2", 2, 2, 0)];
    let units = [hu("u1", 1, 0, 1, 5.0), hu("e1", 2, 1, 1, 9.0)];
    let wave_units: Vec<WaveUnit> = ["u1", "w1", "w2", "w3"]
        .iter()
        .map(|id| wave_unit(id, 1, 0.0, 1.0))
        .collect();
    let wave_cities = [WaveCity {
        id: "c2".to_owned(),
        owner_id: 2,
        q: 2.0,
        r: 0.0,
    }];
    let candidates = [WarTargetCandidate {
        owner_id: 2,
        distance: 2.0,
        reachable: None,
    }];
    let map = land_map(10, 4);
    let blocked: HashSet<Klucz> = HashSet::new();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let all_units = [WarAllInUnit {
        id: "a1".to_owned(),
        q: 0,
        r: 3,
        ruch_left: None,
    }];
    let targets = vec![WarCityTarget {
        target: WarCapitalTarget {
            owner_id: 2,
            city_id: "c2".to_owned(),
            q: 2,
            r: 0,
        },
        defenders: None,
    }];
    let ai = AllInParams {
        units: &all_units,
        nav,
        opts: WarAllInPlanOpts::default(),
        is_barbarian: &|_: i64| false,
    };
    let mut inp = core(
        1,
        &enemies,
        &locked,
        &territory,
        &cities,
        &units,
        &wave_cities,
        &wave_units,
        &candidates,
    );
    inp.all_in_targets = targets.as_slice();
    inp.all_in = Some(&ai);
    let cmds = plan_war_march_core(&inp);
    let rank = |c: &MarchCommand| match c {
        MarchCommand::CampaignTarget(_) => 0,
        MarchCommand::Home(_) => 1,
        MarchCommand::ForcedWave(_) => 2,
        MarchCommand::AllIn(_) => 3,
    };
    let ranks: Vec<i32> = cmds.iter().map(rank).collect();
    for k in 0..=3 {
        assert!(ranks.contains(&k), "brak komendy rangi {k}: {cmds:?}");
    }
    assert!(
        ranks.windows(2).all(|w| w[0] <= w[1]),
        "zla kolejnosc (kampania, dom, fala, all-in): {ranks:?} {cmds:?}"
    );
    assert_eq!(ranks[0], 0);
    assert_eq!(*ranks.last().unwrap(), 3);
}
