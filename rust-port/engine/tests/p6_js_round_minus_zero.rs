//! P6 JS-ROUND-MINUS-ZERO (R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1, #231 / #166).
//!
//! Pokrycie behawioralne galezi ujemnego zera w `js_round` (combat.rs, modul `melee_phase`).
//! `js_round` jest prywatne, wiec test wchodzi przez `resolve_melee_phase` i wymusza
//! `finalDmg = Math.round(rawDmg * ctrAtkVsDef)` z wartoscia, ktora w JS daje `-0`.
//!
//! Wartosci pinowe (`Math.round` w pinie `07d2fbd72`, `gra/src/game/combat.ts:1159`) zweryfikowane
//! w node: `Object.is(Math.round(-0.4), -0)`, `Object.is(Math.round(-0.5), -0)`,
//! `Object.is(Math.round(-0), -0)` -> true; `Math.round(0.5) = 1`, `Math.round(1.5) = 2`.
//!
//! Porownanie bit-w-bit (`to_bits`), zeby odroznic `-0.0` od `+0.0`.

use civ_engine::domain::combat::melee_phase::{
    resolve_melee_phase, MeleeMods, MeleePhaseInput, MeleeUnit, Side,
};

const NEG_ZERO_BITS: u64 = (-0.0f64).to_bits();
const POS_ONE_BITS: u64 = 1.0f64.to_bits();
const POS_TWO_BITS: u64 = 2.0f64.to_bits();

fn unit(weapon_damage: f64, armor: f64) -> MeleeUnit {
    MeleeUnit {
        counter_typ: String::new(),
        unbreakable: false,
        melee_attack: 10.0,
        melee_defence: 10.0,
        armor,
        charge_bonus: 0.0,
        weapon_damage,
        piercing: 0.0,
    }
}

fn neutral_mods() -> MeleeMods {
    MeleeMods {
        atk: 1.0,
        obrona: 1.0,
        pancerz: 1.0,
        uderzenie: 1.0,
    }
}

/// Jedna runda zwarcia: atakujacy (raw = `weapon_damage` przy pancerzu obroncy 0) z mnoznikiem
/// kontry `ctr_atk_vs_def`. Losowania zawsze 0.0, wiec atakujacy trafia (0 < hitPct).
/// Zwraca bity `damage` pierwszego trafienia atakujacego.
fn attacker_first_hit_damage_bits(weapon_damage: f64, ctr_atk_vs_def: f64) -> u64 {
    let input = MeleePhaseInput {
        attacker: unit(weapon_damage, 0.0),
        defender: unit(weapon_damage, 0.0),
        attacker_moved: false,
        atk_diff_mult: 1.0,
        def_diff_mult: 1.0,
        terr_river_mult: 1.0,
        hp_atk: 1000.0,
        hp_def: 1000.0,
        total_rounds: 0,
        max_rounds: 1,
        def_final_obrona: 10.0,
        ctr_atk_vs_def,
        ctr_def_vs_atk: 1.0,
        rout_atk: 0.0,
        rout_def: 0.0,
        mods_atk_charge: neutral_mods(),
        mods_atk_round: neutral_mods(),
        mods_def_charge: neutral_mods(),
        mods_def_round: neutral_mods(),
    };
    let res = resolve_melee_phase(input, || 0.0);
    let step = res
        .steps
        .iter()
        .find(|s| s.side == Side::Attacker && s.hit)
        .expect("atakujacy musi trafic przy losowaniu 0.0");
    step.damage.to_bits()
}

#[test]
fn melee_round_minus_zero_for_negative_fraction_below_half() {
    // Math.round(-0.4) === -0 (galez ujemnego zera js_round, x w (-0.5, 0)).
    assert_eq!(
        attacker_first_hit_damage_bits(1.0, -0.4),
        NEG_ZERO_BITS,
        "finalDmg dla x=-0.4 musi byc -0 (jak Math.round w pinie)"
    );
}

#[test]
fn melee_round_minus_zero_at_negative_half() {
    // Math.round(-0.5) === -0 (granica dolna galezi).
    assert_eq!(
        attacker_first_hit_damage_bits(1.0, -0.5),
        NEG_ZERO_BITS,
        "finalDmg dla x=-0.5 musi byc -0 (jak Math.round w pinie)"
    );
}

#[test]
fn melee_round_minus_zero_for_negative_zero_input() {
    // Math.round(-0) === -0: wejscie -0 zachowuje znak zera.
    assert_eq!(
        attacker_first_hit_damage_bits(1.0, -0.0),
        NEG_ZERO_BITS,
        "finalDmg dla x=-0 musi byc -0 (jak Math.round w pinie)"
    );
}

#[test]
fn melee_round_positive_half_rounds_up_to_plus_one() {
    // Math.round(0.5) === 1: kontrola, ze dodatnia galaz nie daje -0.
    assert_eq!(
        attacker_first_hit_damage_bits(1.0, 0.5),
        POS_ONE_BITS,
        "finalDmg dla x=0.5 musi byc +1"
    );
}

#[test]
fn melee_round_positive_one_and_half_rounds_to_two() {
    // Math.round(1.5) === 2: kontrola galezi dodatniej.
    assert_eq!(
        attacker_first_hit_damage_bits(1.0, 1.5),
        POS_TWO_BITS,
        "finalDmg dla x=1.5 musi byc +2"
    );
}
