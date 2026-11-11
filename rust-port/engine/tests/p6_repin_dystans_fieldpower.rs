//! R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1 -- port `fieldPower` (web `unit-power.ts:122`).
//! Wektory `dystans-fieldpower.json` z uruchomionego kodu weba (generator
//! `p6_repin_dystans_petla_gen.mjs`), w tym polowki (.5/.25) sprawdzajace `Math.round`.

use civ_engine::domain::unit_power::{field_power, UnitPowerCoeffs, UnitPowerInput};
use serde_json::Value;

const VEC: &str = include_str!("p6_repin_dystans_vectors/dystans-fieldpower.json");

fn f(v: &Value, k: &str) -> f64 {
    v[k].as_f64().unwrap_or(0.0)
}

#[test]
fn p6_repin_dystans_field_power_matches_web() {
    let rows: Vec<Value> = serde_json::from_str(VEC).expect("dystans-fieldpower.json");
    assert_eq!(rows.len(), 400);
    let coeffs = UnitPowerCoeffs::from_params();
    for (n, row) in rows.iter().enumerate() {
        let i = &row["input"];
        let input = UnitPowerInput {
            melee_attack: f(i, "meleeAttack"),
            melee_defence: f(i, "meleeDefence"),
            weapon_damage: f(i, "weaponDamage"),
            piercing: f(i, "piercing"),
            armor: f(i, "armor"),
            charge_bonus: f(i, "chargeBonus"),
            health: f(i, "health"),
            missile_attack: f(i, "missileAttack"),
            typ: i["Typ"].as_str().map(str::to_owned),
            jednostka: i["Jednostka"].as_str().map(str::to_owned),
        };
        let got = field_power(&input, &coeffs);
        let e = &row["expected"];
        assert_eq!(got.attack, f(e, "attack"), "przypadek {n} attack");
        assert_eq!(got.defense, f(e, "defense"), "przypadek {n} defense");
        assert_eq!(got.total, f(e, "total"), "przypadek {n} total");
    }
}
