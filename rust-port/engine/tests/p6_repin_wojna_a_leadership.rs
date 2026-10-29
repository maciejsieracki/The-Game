//! REPIN-WOJNA-NOWE-A - `gra/src/game/army-leadership.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_a_vectors/army-leadership.json`).

use civ_engine::domain::army_leadership::{
    army_leader_morale_bonus_frac, army_leader_title, army_leader_title_text,
    army_morale_ratio_without_commander, commanders_to_withdraw_after_army_break,
    has_military_academy, morale_with_army_leader_bonus, ArmyLeaderCombatant,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_a_vectors/army-leadership.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("army-leadership.json parse")
}

fn num(value: &Value) -> f64 {
    value
        .as_str()
        .expect("liczba zapisana jako tekst")
        .parse::<f64>()
        .expect("poprawna liczba")
}

/// Porownanie bit-w-bit (rozroznia -0 i zachowuje NaN = NaN).
fn same(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn combatant(v: &Value) -> ArmyLeaderCombatant {
    ArmyLeaderCombatant {
        is_army_commander: v["isArmyCommander"].as_bool().unwrap_or(false),
        morale: num(&v["morale"]),
        morale_max: num(&v["moraleMax"]),
        dead: v["dead"].as_bool().unwrap_or(false),
        fading_out: v["fadingOut"].as_bool().unwrap_or(false),
        routed: v["routed"].as_bool().unwrap_or(false),
    }
}

#[test]
fn academy_title_and_bonus_match_web() {
    let v = root();
    let cases = v["academyCases"].as_array().expect("academyCases");
    assert!(cases.len() >= 200);
    for (i, case) in cases.iter().enumerate() {
        let ids: Vec<&str> = case["ids"]
            .as_array()
            .expect("ids")
            .iter()
            .map(|x| x.as_str().expect("id"))
            .collect();
        assert_eq!(
            has_military_academy(ids.iter().copied()),
            case["academy"].as_bool().expect("academy"),
            "przypadek {i}"
        );
        let title = army_leader_title_text(army_leader_title(ids.iter().copied()));
        assert_eq!(
            title,
            case["title"].as_str().expect("title"),
            "przypadek {i}"
        );
        assert!(
            same(
                army_leader_morale_bonus_frac(true, ids.iter().copied()),
                num(&case["bonus"])
            ),
            "przypadek {i}: bonus"
        );
        assert!(
            same(
                army_leader_morale_bonus_frac(false, ids.iter().copied()),
                num(&case["bonusAbsent"])
            ),
            "przypadek {i}: bonus bez dowodcy"
        );
    }
}

#[test]
fn morale_with_bonus_matches_web() {
    let v = root();
    let cases = v["moraleCases"].as_array().expect("moraleCases");
    assert!(cases.len() >= 400);
    for (i, case) in cases.iter().enumerate() {
        let got = morale_with_army_leader_bonus(num(&case["base"]), num(&case["bonus"]));
        assert!(same(got, num(&case["out"])), "przypadek {i}: {case}");
    }
}

#[test]
fn morale_ratio_matches_web() {
    let v = root();
    let cases = v["ratioCases"].as_array().expect("ratioCases");
    assert!(cases.len() >= 1200);
    for (i, case) in cases.iter().enumerate() {
        let units: Vec<ArmyLeaderCombatant> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(combatant)
            .collect();
        let got = army_morale_ratio_without_commander(&units);
        assert!(same(got, num(&case["out"])), "przypadek {i}: {case}");
    }
}

#[test]
fn withdraw_commanders_matches_web() {
    let v = root();
    let cases = v["withdrawCases"].as_array().expect("withdrawCases");
    assert!(cases.len() >= 1200);
    for (i, case) in cases.iter().enumerate() {
        let units: Vec<ArmyLeaderCombatant> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(combatant)
            .collect();
        let want: Vec<usize> = case["outIndices"]
            .as_array()
            .expect("outIndices")
            .iter()
            .map(|x| x.as_u64().expect("indeks") as usize)
            .collect();
        let got = commanders_to_withdraw_after_army_break(&units, num(&case["threshold"]));
        assert_eq!(got, want, "przypadek {i}");
    }
}

/// Zachowanie z kodu weba: przy braku niedowodcow armia z dowodca ma stosunek 0 (rozbita),
/// bez dowodcy i bez jednostek 1 (nie rozbita).
#[test]
fn empty_army_ratio_edge_cases() {
    assert!(same(army_morale_ratio_without_commander(&[]), 1.0));
    let commander_only = [ArmyLeaderCombatant {
        is_army_commander: true,
        morale: 5.0,
        ..Default::default()
    }];
    assert!(same(
        army_morale_ratio_without_commander(&commander_only),
        0.0
    ));
}
