#[allow(dead_code)]
#[path = "../src/domain/combat.rs"]
mod combat;

use combat::{
    counter_multiplier, effective_strength, resolve_combat, CombatInput, CombatUnit,
    DefenseStructures, Terrain, Winner,
};

fn unit(id: u64, unit_type: &str, attack: u32, hp: u32) -> CombatUnit {
    CombatUnit::new(id, format!("Unit {id}"), unit_type, attack, hp, 100)
}

#[test]
fn effective_strength_applies_counters_terrain_and_siege_structures() {
    let attacker = unit(1, "Swordsman", 10, 100);
    let defender = unit(2, "Spearman", 10, 100);
    let structures = DefenseStructures {
        wall: true,
        fort: true,
        outpost: true,
    };

    let attack_strength = effective_strength(
        std::slice::from_ref(&attacker),
        std::slice::from_ref(&defender),
        Terrain::Plain,
        DefenseStructures::default(),
        false,
        false,
    );
    let defense_strength = effective_strength(
        std::slice::from_ref(&defender),
        std::slice::from_ref(&attacker),
        Terrain::Hills,
        structures,
        true,
        true,
    );

    assert_eq!(
        counter_multiplier("Swordsman", "Spearman", &attacker.bonuses_vs_type),
        1.15
    );
    assert_eq!(attack_strength, 1_150.0);
    assert_eq!(defense_strength, 6_750.0);
}

#[test]
fn canonical_counter_table_matches_confirmed_attack_rows() {
    let cases = [
        ("Spearman", "Mount", 1.50),
        ("Mount", "Distance", 1.50),
        ("Mount", "Slinger", 1.50),
        ("Slinger", "Spearman", 1.50),
        ("Swordsman", "Spearman", 1.15),
        ("Mount", "Offensive", 1.25),
        ("Spearman", "Spearman", 1.15),
        ("Mount", "Spearman", 1.15),
        ("Swordsman", "Mount", 1.50),
        ("Offensive", "Swordsman", 1.25),
        ("Falangite", "Mount", 1.50),
        ("Distance", "Spearman", 1.15),
        ("Naval", "Spearman", 1.15),
        ("Offensive", "Distance", 1.15),
        ("Offensive", "Slinger", 1.15),
    ];

    for (attacker, defender, expected) in cases {
        assert_eq!(
            counter_multiplier(attacker, defender, &[]),
            expected,
            "unexpected counter for {attacker} -> {defender}"
        );
    }
}

#[test]
fn resolver_returns_deterministic_winner_and_per_unit_losses() {
    let result = resolve_combat(CombatInput::new(
        vec![unit(1, "Swordsman", 20, 100)],
        vec![unit(2, "Spearman", 10, 100)],
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));

    assert_eq!(result.winner, Winner::Attacker);
    assert_eq!(result.attacker_results[0].hp_after, 81);
    assert_eq!(result.defender_results[0].hp_after, 19);
    assert!(!result.attacker_results[0].destroyed);
    assert!(result.defender_results[0].broken);
    assert_eq!(result.survivors_attacker(), 1);
    assert_eq!(result.survivors_defender(), 1);
}

#[test]
fn resolver_is_order_independent_and_preserves_ids() {
    let attackers = vec![unit(7, "Swordsman", 10, 100), unit(8, "Swordsman", 10, 50)];
    let defenders = vec![unit(20, "Spearman", 10, 100)];
    let first = resolve_combat(CombatInput::new(
        attackers.clone(),
        defenders.clone(),
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));
    let second = resolve_combat(CombatInput::new(
        attackers.into_iter().rev().collect(),
        defenders,
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));

    assert_eq!(first, second);
    assert_eq!(
        first
            .attacker_results
            .iter()
            .map(|outcome| outcome.id)
            .collect::<Vec<_>>(),
        vec![7, 8]
    );
}

#[test]
fn empty_attacker_side_gives_non_empty_defender_the_win() {
    let result = resolve_combat(CombatInput::new(
        Vec::new(),
        vec![unit(2, "Spearman", 10, 100)],
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));

    assert_eq!(result.winner, Winner::Defender);
    assert_eq!(result.survivors_defender(), 1);
}

#[test]
fn empty_defender_side_gives_non_empty_attacker_the_win() {
    let result = resolve_combat(CombatInput::new(
        vec![unit(1, "Swordsman", 10, 100)],
        Vec::new(),
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));

    assert_eq!(result.winner, Winner::Attacker);
    assert_eq!(result.survivors_attacker(), 1);
}

#[test]
fn losses_are_smaller_for_the_winner_in_a_decisive_matchup() {
    let close = resolve_combat(CombatInput::new(
        vec![unit(1, "Offensive", 10, 100)],
        vec![unit(2, "Naval", 9, 100)],
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));
    let decisive = resolve_combat(CombatInput::new(
        vec![unit(1, "Offensive", 100, 100)],
        vec![unit(2, "Naval", 10, 100)],
        Terrain::Plain,
        DefenseStructures::default(),
        false,
    ));

    assert_eq!(close.winner, Winner::Attacker);
    assert_eq!(close.attacker_results[0].hp_after, 76);
    assert_eq!(close.defender_results[0].hp_after, 24);
    assert_eq!(decisive.winner, Winner::Attacker);
    assert_eq!(decisive.attacker_results[0].hp_after, 87);
    assert_eq!(decisive.defender_results[0].hp_after, 13);
    assert!(decisive.attacker_results[0].hp_after > close.attacker_results[0].hp_after);
    assert!(decisive.defender_results[0].hp_after < close.defender_results[0].hp_after);
}
