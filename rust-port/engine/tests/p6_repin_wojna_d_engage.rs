//! REPIN-WOJNA-NOWE-D (runda 3): testy jednostkowe galezi W1/W2 portu `war-rules-multiwar.ts`
//! (pin `dc8a3adc`). Oczekiwane wartosci wyprowadzone recznie z kodu weba:
//! `pickEngagementArmy` (`gra/src/game/war-rules-multiwar.ts:168`): dystans <= promien,
//! remis: mniejsze q, potem r, potem ownerId (ta sama kolejnosc porownan).
//! `allocateGroupsToEnemies` (`gra/src/game/war-rules-multiwar.ts:207`): min. 1 grupa na wroga
//! (najsilniejszy dostaje najwieksza grupe), reszta do wroga z najwiekszym deficytem
//! (idealny udzial minus przydzielone); remis: mniejszy ownerId.
//! Ten plik pokrywa remisy i progi, ktorych nie pokrywaja wektory `web-dc8a3adc-w12.json`
//! (np. dwie armie na tym samym heksie, rozne ownerId -- niemozliwe w grze, ale definiowane przez web).

use civ_engine::domain::pathfinding::ruch_jednostek::hex_distance;
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
