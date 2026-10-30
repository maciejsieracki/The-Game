//! REPIN-WOJNA-NOWE-D (partia 1): testy portu `warAllInCapital.ts` (pin `dc8a3adc`).
//! Wektory z uruchomionego weba: NIE_ZMIERZONO w tej partii (patrz raport operatora);
//! testy ponizej sa wlasnorecznie wyliczone i sprawdzaja wlasnosci zachowania.

use std::collections::HashSet;

use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::war_all_in_capital::{
    classify_war_target_routes, cmp_target, is_war_all_in_capital_enabled, nearest_target,
    plan_war_all_in_capital, prefer_sea_reachable_war_targets, set_war_all_in_capital_override,
    war_allin_params, RoutedWarTargetCandidate, WarAllInMode, WarAllInPlanOpts, WarAllInUnit,
    WarCapitalTarget,
};
use civ_engine::domain::war_all_in_capital_nav::{
    distance_field, hex_neighbour_keys, nav_move_cost, WarAllInNav,
};

fn land_map(w: i32, h: i32) -> RuchMapa {
    let mut map = RuchMapa::new();
    for q in 0..w {
        for r in 0..h {
            map.insert((q, r), RuchHex::new(TerenBazowy::Laka));
        }
    }
    map
}

fn empty_set() -> HashSet<Klucz> {
    HashSet::new()
}

fn unit(id: &str, q: i32, r: i32) -> WarAllInUnit {
    WarAllInUnit {
        id: id.to_string(),
        q,
        r,
        ruch_left: None,
    }
}

fn target(owner: i64, city: &str, q: i32, r: i32) -> WarCapitalTarget {
    WarCapitalTarget {
        owner_id: owner,
        city_id: city.to_string(),
        q,
        r,
    }
}

fn nav<'a>(
    map: &'a RuchMapa,
    blocked: &'a HashSet<Klucz>,
    occupied: Option<&'a HashSet<Klucz>>,
) -> WarAllInNav<'a> {
    WarAllInNav {
        map,
        allow_sea: false,
        blocked,
        occupied,
    }
}

fn hex_dist(a: Klucz, b: Klucz) -> i64 {
    civ_engine::domain::pathfinding::ruch_jednostek::hex_distance(a.0, a.1, b.0, b.1)
}

#[test]
fn params_match_web_json() {
    let p = war_allin_params();
    assert_eq!(p.link_radius, 3);
    assert_eq!(p.merge_radius, 10);
    assert_eq!(p.no_merge_near_capital, 3);
}

#[test]
fn flag_default_and_override() {
    assert!(is_war_all_in_capital_enabled());
    set_war_all_in_capital_override(Some(false));
    assert!(!is_war_all_in_capital_enabled());
    set_war_all_in_capital_override(None);
    assert!(is_war_all_in_capital_enabled());
}

#[test]
fn nav_move_cost_land_and_sea_gate() {
    let map = land_map(1, 1);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let water = RuchHex::new(TerenBazowy::Morze);
    assert_eq!(nav_move_cost(&n, &water), f64::INFINITY);
    let sea_nav = WarAllInNav {
        allow_sea: true,
        ..n
    };
    assert_eq!(nav_move_cost(&sea_nav, &water), 1.0);
}

#[test]
fn distance_field_on_flat_line_is_hex_distance() {
    let map = land_map(8, 1);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let start: HashSet<Klucz> = [(0, 0)].into_iter().collect();
    let field = distance_field(&n, (5, 0), &start);
    let d = field.get(&(0, 0)).copied().expect("start ustalony");
    assert!(d >= 5.0, "koszt >= dystans heksowy na lądzie");
    assert_eq!(field.get(&(5, 0)).copied(), Some(0.0));
}

#[test]
fn neighbour_keys_are_six_and_adjacent() {
    let ns: Vec<Klucz> = hex_neighbour_keys(2, 2).collect();
    assert_eq!(ns.len(), 6);
    for n in ns {
        assert_eq!(hex_dist((2, 2), n), 1);
    }
}

#[test]
fn single_unit_steps_towards_capital() {
    let map = land_map(10, 3);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let t = [target(2, "cap2", 6, 1)];
    let plan = plan_war_all_in_capital(&[unit("u1", 1, 1)], &t, &n, WarAllInPlanOpts::default());
    assert_eq!(plan.orders.len(), 1, "jednostka dostaje rozkaz");
    let o = &plan.orders[0];
    assert_eq!(o.target_city_id, "cap2");
    assert_eq!(o.target_owner_id, 2);
    assert_eq!(o.mode, WarAllInMode::Capital);
    assert!(hex_dist((o.step.0, o.step.1), (6, 1)) < hex_dist((1, 1), (6, 1)));
    assert!(plan.no_path.is_empty());
}

#[test]
fn unit_on_capital_is_held() {
    let map = land_map(10, 3);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let t = [target(2, "cap2", 6, 1)];
    let plan = plan_war_all_in_capital(&[unit("u1", 6, 1)], &t, &n, WarAllInPlanOpts::default());
    assert!(plan.orders.is_empty());
    assert_eq!(plan.held, vec!["u1".to_string()]);
}

#[test]
fn units_within_link_radius_form_one_group() {
    let map = land_map(20, 5);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let t = [target(2, "cap2", 15, 2)];
    // odleglosc 3 == link_radius -> jedna grupa
    let units = [unit("a", 2, 2), unit("b", 5, 2)];
    let plan = plan_war_all_in_capital(&units, &t, &n, WarAllInPlanOpts::default());
    assert_eq!(plan.groups_by_target.get("cap2"), Some(&vec![2usize]));
}

#[test]
fn units_beyond_link_radius_form_two_groups() {
    let map = land_map(20, 5);
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let t = [target(2, "cap2", 15, 2)];
    // odleglosc 4 > link_radius -> dwie grupy
    let units = [unit("a", 2, 2), unit("b", 6, 2)];
    let plan = plan_war_all_in_capital(&units, &t, &n, WarAllInPlanOpts::default());
    let sizes = plan.groups_by_target.get("cap2").expect("grupy celu");
    assert_eq!(sizes.len(), 2);
    assert_eq!(sizes.iter().sum::<usize>(), 2);
}

#[test]
fn island_unit_without_sea_has_no_path() {
    let mut map = land_map(10, 3);
    // wyspa: jednostka otoczona morzem, brak trasy ladem do stolicy
    for q in 0..10 {
        for r in 0..3 {
            if (q, r) != (5, 1) && q >= 4 {
                map.insert((q, r), RuchHex::new(TerenBazowy::Morze));
            }
        }
    }
    map.insert((3, 1), RuchHex::new(TerenBazowy::Morze));
    let blocked = empty_set();
    let n = nav(&map, &blocked, None);
    let t = [target(2, "cap2", 8, 1)];
    let plan = plan_war_all_in_capital(&[unit("u1", 5, 1)], &t, &n, WarAllInPlanOpts::default());
    assert!(plan.orders.is_empty());
    assert_eq!(plan.no_path, vec!["u1".to_string()]);
}

#[test]
fn route_classification_land_only_on_flat_map() {
    let map = land_map(8, 3);
    let blocked = empty_set();
    let t = [target(2, "cap2", 6, 1)];
    let routes = classify_war_target_routes(&map, (1, 1), &t, &blocked, false);
    let r = routes.get("cap2").expect("trasa celu");
    assert!(r.land);
    assert!(!r.sea);
}

#[test]
fn route_classification_missing_start_is_empty() {
    let map = land_map(2, 2);
    let blocked = empty_set();
    let t = [target(2, "cap2", 1, 1)];
    let routes = classify_war_target_routes(&map, (9, 9), &t, &blocked, false);
    assert!(routes.is_empty());
}

#[derive(Clone)]
struct Cand {
    land: bool,
    sea: bool,
}

impl RoutedWarTargetCandidate for Cand {
    fn land_reachable(&self) -> bool {
        self.land
    }
    fn sea_reachable(&self) -> bool {
        self.sea
    }
}

#[test]
fn prefer_sea_targets_then_land_fallback() {
    let mixed = vec![
        Cand {
            land: true,
            sea: false,
        },
        Cand {
            land: true,
            sea: true,
        },
    ];
    let picked = prefer_sea_reachable_war_targets(&mixed);
    assert_eq!(picked.len(), 1);
    assert!(picked[0].sea);
    let land_only = vec![
        Cand {
            land: true,
            sea: false,
        },
        Cand {
            land: false,
            sea: false,
        },
    ];
    let picked = prefer_sea_reachable_war_targets(&land_only);
    assert_eq!(picked.len(), 1);
    assert!(picked[0].land);
}

#[test]
fn nearest_target_tie_break_by_city_id() {
    let t = [target(2, "b", 4, 0), target(3, "a", 4, 0)];
    let got = nearest_target(0, 0, &t).expect("cel");
    assert_eq!(got.city_id, "a");
    assert_eq!(cmp_target(&t[1], &t[0]), std::cmp::Ordering::Less);
}
