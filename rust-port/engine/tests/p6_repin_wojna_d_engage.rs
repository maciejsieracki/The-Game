//! REPIN-WOJNA-NOWE-D (runda 3): testy jednostkowe galezi W1/W2 portu `war-rules-multiwar.ts`
//! (pin `dc8a3adc`). Oczekiwane wartosci wyprowadzone recznie z kodu weba:
//! `pickEngagementArmy` (`gra/src/game/war-rules-multiwar.ts:168`): dystans <= promien,
//! remis: mniejsze q, potem r, potem ownerId (ta sama kolejnosc porownan).
//! `allocateGroupsToEnemies` (`gra/src/game/war-rules-multiwar.ts:207`): min. 1 grupa na wroga
//! (najsilniejszy dostaje najwieksza grupe), reszta do wroga z najwiekszym deficytem
//! (idealny udzial minus przydzielone); remis: mniejszy ownerId.
//! Ten plik pokrywa remisy i progi, ktorych nie pokrywaja wektory `web-dc8a3adc-w12.json`
//! (np. dwie armie na tym samym heksie, rozne ownerId -- niemozliwe w grze, ale definiowane przez web).

use std::collections::HashSet;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    hex_distance, Klucz, RuchHex, RuchMapa, TerenBazowy,
};
use civ_engine::domain::war_all_in_capital::{
    plan_war_all_in_capital, WarAllInMode, WarAllInOrder, WarAllInPlan, WarAllInPlanOpts,
    WarAllInUnit, WarCapitalTarget,
};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use civ_engine::domain::war_rules_multiwar::{
    allocate_groups_to_enemies, pick_engagement_army, ArmyGroupRef, EnemyStrengthRef, EngageArmyHex,
};

fn army(q: i32, r: i32, owner_id: i64) -> EngageArmyHex {
    EngageArmyHex { q, r, owner_id }
}

fn group(id: &str, size: i64) -> ArmyGroupRef {
    ArmyGroupRef {
        id: id.to_string(),
        size,
    }
}

fn enemy(owner_id: i64, strength: i64) -> EnemyStrengthRef {
    EnemyStrengthRef { owner_id, strength }
}

#[test]
fn engage_radius_boundary_n_hits_n_plus_1_misses() {
    // Kotwica (0,0); armia na dystansie 2 (= N) trafia, na dystansie 3 (= N+1) nie.
    let at_n = army(2, 0, 2);
    let beyond = army(3, 0, 2);
    assert_eq!(hex_distance(0, 0, 2, 0), 2);
    assert_eq!(hex_distance(0, 0, 3, 0), 3);
    let hit = pick_engagement_army((0, 0), &[at_n], hex_distance, 2);
    assert_eq!(hit, Some(at_n));
    let miss = pick_engagement_army((0, 0), &[beyond], hex_distance, 2);
    assert_eq!(miss, None);
}

#[test]
fn engage_tie_same_distance_prefers_smaller_q_then_r_then_owner() {
    let anchor = (0, 0);
    // Ten sam dystans (1): mniejsze q wygrywa niezaleznie od kolejnosci wejscia.
    let a = army(1, 0, 9);
    let b = army(0, 1, 2);
    assert_eq!(
        pick_engagement_army(anchor, &[a, b], hex_distance, 1),
        Some(b),
        "q=0 przed q=1"
    );
    assert_eq!(
        pick_engagement_army(anchor, &[b, a], hex_distance, 1),
        Some(b),
        "kolejnosc wejscia nie zmienia wyniku"
    );
}

#[test]
fn engage_full_tie_prefers_smaller_owner_id() {
    // Ten sam heks, rozne ownerId (web :~185: `e.ownerId < best.ownerId`). Wybor: mniejszy owner.
    let anchor = (0, 0);
    let owner5 = army(1, 0, 5);
    let owner2 = army(1, 0, 2);
    assert_eq!(
        pick_engagement_army(anchor, &[owner5, owner2], hex_distance, 1),
        Some(owner2),
        "owner 2 < 5"
    );
    assert_eq!(
        pick_engagement_army(anchor, &[owner2, owner5], hex_distance, 1),
        Some(owner2),
        "kolejnosc wejscia nie zmienia wyniku"
    );
}

#[test]
fn allocate_min_one_group_per_enemy_strongest_gets_largest() {
    // Grupy 3 (a) i 1 (b); wrogowie 2 (sila 1) i 3 (sila 1). Min. 1 grupa na wroga:
    // przy remisie sily wygrywa mniejszy ownerId -> owner 2 dostaje najwieksza grupe a.
    let groups = [group("a", 3), group("b", 1)];
    let alloc = allocate_groups_to_enemies(&groups, &[enemy(2, 1), enemy(3, 1)]);
    assert_eq!(alloc.get("a"), Some(&2));
    assert_eq!(alloc.get("b"), Some(&3));
}

#[test]
fn allocate_deficit_assigns_remaining_group_to_largest_deficit() {
    // Grupy a=4, b=2, c=2 (razem 8); sily: owner 2 = 3, owner 3 = 1 -> idealne 6 i 2.
    // Min. 1 grupa: owner 2 (sila 3) dostaje a=4, owner 3 dostaje b=2.
    // Reszta c=2: deficyt owner 2 = 6-4 = 2, owner 3 = 2-2 = 0 -> c idzie do owner 2.
    let groups = [group("a", 4), group("b", 2), group("c", 2)];
    let alloc = allocate_groups_to_enemies(&groups, &[enemy(2, 3), enemy(3, 1)]);
    assert_eq!(alloc.get("a"), Some(&2));
    assert_eq!(alloc.get("b"), Some(&3));
    assert_eq!(alloc.get("c"), Some(&2));
}

#[test]
fn allocate_fewer_groups_than_enemies_skips_min_one_phase() {
    // Jedna grupa, dwoch wrogow: min-1 pominiete (grup < wrogow); grupa idzie do deficytu.
    // Sily 1 i 3 (razem 4), rozmiar grupy 2 -> idealne: owner 2 = 0.5, owner 3 = 1.5.
    // Oba przydzielone 0 -> najwiekszy deficyt ma owner 3.
    let groups = [group("a", 2)];
    let alloc = allocate_groups_to_enemies(&groups, &[enemy(2, 1), enemy(3, 3)]);
    assert_eq!(alloc.get("a"), Some(&3));
}

#[test]
fn allocate_empty_inputs_return_empty_map() {
    assert!(allocate_groups_to_enemies(&[], &[enemy(2, 1)]).is_empty());
    assert!(allocate_groups_to_enemies(&[group("a", 1)], &[]).is_empty());
}

// --- Runda 3, odpowiedzi na zarzuty weryfikatora (Z1-Z4) ---

#[test]
fn engage_radius_boundary_n_minus_1_hits() {
    // Promien 2 (N): armia na dystansie 1 (N-1) trafia; na dystansie 2 (N) tez (patrz test wyzej).
    let near = army(1, 0, 2);
    assert_eq!(hex_distance(0, 0, 1, 0), 1);
    assert_eq!(
        pick_engagement_army((0, 0), &[near], hex_distance, 2),
        Some(near)
    );
}

#[test]
fn allocate_negative_strength_is_clamped_to_zero() {
    // Web `war-rules-multiwar.ts:214,218`: `Math.max(0, strength)` w sumie i w udziale.
    // Sily: owner 2 = -4 (-> 0), owner 3 = 2. Grupy a=3, b=1, c=1 (razem 5).
    // Min. 1 grupa: owner 3 (sila 2) dostaje a=3, owner 2 dostaje b=1.
    // Po klamrze suma = 2 -> idealne: owner 2 = 0, owner 3 = 5. Reszta c=1: deficyt owner 3 = 5-3 = 2
    // > owner 2 = 0-1 = -1 -> c idzie do owner 3.
    // Bez klamry suma = -2 (nie > 0) -> udzial 1/2 -> idealne 2.5 i 2.5 -> c trafia do owner 2.
    let groups = [group("a", 3), group("b", 1), group("c", 1)];
    let alloc = allocate_groups_to_enemies(&groups, &[enemy(2, -4), enemy(3, 2)]);
    assert_eq!(alloc.get("a"), Some(&3));
    assert_eq!(alloc.get("b"), Some(&2));
    assert_eq!(alloc.get("c"), Some(&3));
}

#[test]
fn allocate_equal_sizes_orders_groups_by_id() {
    // Web :223: rozmiar malejaco, potem id rosnaco. Grupy a=2, b=2; wrogowie owner 2 i 3, sila 1 each.
    // Min. 1 grupa: remis sily -> mniejszy owner (2) dostaje pierwsza grupe w porzadku = a.
    // Wejscie podane jako [b, a]: bez tie-breaku po id stabilny sort zostawilby b pierwsza.
    let groups = [group("b", 2), group("a", 2)];
    let alloc = allocate_groups_to_enemies(&groups, &[enemy(2, 1), enemy(3, 1)]);
    assert_eq!(alloc.get("a"), Some(&2));
    assert_eq!(alloc.get("b"), Some(&3));
}

// Planner (`plan_war_all_in_capital`) z jawnie podanymi wejsciami W1/W2.
fn planner_map() -> RuchMapa {
    let mut map = RuchMapa::new();
    for q in 0..30 {
        for r in 0..5 {
            map.insert((q, r), RuchHex::new(TerenBazowy::Laka));
        }
    }
    map
}

fn planner_unit(id: &str, q: i32, r: i32) -> WarAllInUnit {
    WarAllInUnit {
        id: id.to_string(),
        q,
        r,
        ruch_left: None,
    }
}

fn planner_target(owner: i64, city: &str, q: i32, r: i32) -> WarCapitalTarget {
    WarCapitalTarget {
        owner_id: owner,
        city_id: city.to_string(),
        q,
        r,
    }
}

fn order_for<'a>(plan: &'a WarAllInPlan, id: &str) -> Option<&'a WarAllInOrder> {
    plan.orders.iter().find(|o| o.unit_id == id)
}

#[test]
fn w2_empty_enemy_strength_list_still_splits_engage_pool() {
    // Web `warAllInCapital.ts:719`: `w2Split = enemyStrength !== undefined` (takze dla pustej listy).
    // Cel: stolica owner 2 (10,2). Wroga armia owner 3 na (3,2), dystans 1 <= promien 2.
    // None -> pula W1 = wszystkie armie -> trafienie (mode 'engage').
    // Some([]) -> pula zawezona do owner 2 -> brak trafienia (mode 'capital').
    let map = planner_map();
    let blocked: HashSet<Klucz> = HashSet::new();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let units = [planner_unit("a1", 2, 2)];
    let targets = [planner_target(2, "cap2", 10, 2)];
    let armies = vec![EngageArmyHex {
        q: 3,
        r: 2,
        owner_id: 3,
    }];
    let w1 = WarAllInPlanOpts {
        enemy_armies: Some(armies),
        engage_radius: 2,
        ..Default::default()
    };
    let w2_empty = WarAllInPlanOpts {
        enemy_strength: Some(vec![]),
        ..w1.clone()
    };
    let p1 = plan_war_all_in_capital(&units, &targets, &nav, w1);
    assert_eq!(
        order_for(&p1, "a1").map(|o| o.mode),
        Some(WarAllInMode::Engage)
    );
    let p2 = plan_war_all_in_capital(&units, &targets, &nav, w2_empty);
    assert_eq!(
        order_for(&p2, "a1").map(|o| o.mode),
        Some(WarAllInMode::Capital)
    );
}

#[test]
fn w2_empty_enemy_strength_list_blocks_spare_targets_of_other_owners() {
    // Web `warAllInCapital.ts:810`: zapasowy cel tylko u przydzielonego wroga, gdy
    // `enemyStrength !== undefined` (takze pusta lista). Sciana q=3 (r=0..4) odcina stolice
    // owner 2 (4,2) -> 'next'; zapasowa stolica owner 3 (0,0) osiagalna.
    // None -> rozkaz na stolice owner 3 (mode 'capital'); Some([]) -> brak rozkazu, a1 w noPath.
    let map = planner_map();
    let blocked: HashSet<Klucz> = (0..5).map(|r| (3, r)).collect();
    let nav = WarAllInNav {
        map: &map,
        allow_sea: false,
        blocked: &blocked,
        occupied: None,
    };
    let units = [planner_unit("a1", 2, 2)];
    let targets = [
        planner_target(2, "cap2", 4, 2),
        planner_target(3, "cap3", 0, 0),
    ];
    let p1 = plan_war_all_in_capital(&units, &targets, &nav, WarAllInPlanOpts::default());
    let o = order_for(&p1, "a1").expect("rozkaz na zapasowy cel");
    assert_eq!(
        (o.target_city_id.as_str(), o.target_owner_id, o.mode),
        ("cap3", 3, WarAllInMode::Capital)
    );
    let p2 = plan_war_all_in_capital(
        &units,
        &targets,
        &nav,
        WarAllInPlanOpts {
            enemy_strength: Some(vec![]),
            ..Default::default()
        },
    );
    assert!(order_for(&p2, "a1").is_none());
    assert_eq!(p2.no_path, vec!["a1".to_string()]);
}
