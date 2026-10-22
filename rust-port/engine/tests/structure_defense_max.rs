//! Regula P3-23 etap 3 (WALKA — struktury): obrona strukturalna = NAJWYZSZY bonus, nie suma.
//!
//! Zrodlo: web `structureDefenseBonusFor` (gra/src/main.ts:26953-26979) zwraca jeden
//! najwyzszy bonus. Testy sprawdzaja RELACJE (max zamiast sumy), nie pinuja wartosci
//! procentow -- wartosci zyja w data/derived/combat-ai-multipliers.json.

use civ_engine::domain::combat::{structure_defense_multiplier, DefenseStructures};

fn structures(wall: bool, fort: bool, outpost: bool) -> DefenseStructures {
    DefenseStructures {
        wall,
        fort,
        outpost,
    }
}

#[test]
fn no_structure_gives_neutral_multiplier() {
    assert_eq!(
        structure_defense_multiplier(structures(false, false, false), true),
        1.0
    );
}

#[test]
fn structures_are_ignored_outside_siege() {
    assert_eq!(
        structure_defense_multiplier(structures(true, true, true), false),
        1.0
    );
}

#[test]
fn combined_structures_equal_the_strongest_single_structure() {
    let wall = structure_defense_multiplier(structures(true, false, false), true);
    let fort = structure_defense_multiplier(structures(false, true, false), true);
    let outpost = structure_defense_multiplier(structures(false, false, true), true);
    let all = structure_defense_multiplier(structures(true, true, true), true);
    let fort_outpost = structure_defense_multiplier(structures(false, true, true), true);

    assert!(wall > fort && fort > outpost && outpost > 1.0);
    assert_eq!(all, wall, "wall+fort+outpost must not stack");
    assert_eq!(fort_outpost, fort, "fort+outpost must not stack");
}
