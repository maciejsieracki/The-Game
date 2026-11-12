//! P6 SIEGE-TAKTYKA (#217): testy zgodnosci `domain::siege_tactics_end` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_vectors/vectors.json`, generowane przez `p6_siege_tactics_gen.mjs` (Node 22) z wycietych
//! fragmentow `gra/src/battle/battleScene.ts` (pin 07d2fbd72): `_checkEnd` 10184-10186 i 10208-10220.

use civ_engine::domain::siege_tactics_end::{
    battle_winner, siege_no_breach_repels_attack, BattleSide,
};

const VECTORS: &str = include_str!("p6_siege_tactics_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn hp_list(v: &serde_json::Value) -> Vec<f64> {
    v.as_array()
        .expect("lista HP")
        .iter()
        .map(|x| x.as_f64().expect("HP jest liczba"))
        .collect()
}

fn side_name(s: Option<BattleSide>) -> serde_json::Value {
    match s {
        None => serde_json::Value::Null,
        Some(BattleSide::Attacker) => "atakujacy".into(),
        Some(BattleSide::Defender) => "obronca".into(),
    }
}

#[test]
fn wektory_repels_zgodne_z_webem() {
    let v = load();
    let cases = v["repels"].as_array().expect("repels");
    assert_eq!(cases.len(), 4, "pelna tablica prawdy 2x2");
    for c in cases {
        let is_siege = c["isSiege"].as_bool().unwrap();
        let breached = c["wallEverBreached"].as_bool().unwrap();
        let expect = c["expect"].as_bool().unwrap();
        assert_eq!(
            siege_no_breach_repels_attack(is_siege, breached),
            expect,
            "isSiege={is_siege} wallEverBreached={breached}"
        );
    }
}

#[test]
fn wektory_winner_zgodne_z_webem() {
    let v = load();
    let cases = v["winner"].as_array().expect("winner");
    assert!(cases.len() >= 400, "wektory: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let alive_a = c["aliveA"].as_bool().unwrap();
        let alive_d = c["aliveD"].as_bool().unwrap();
        let hp_a = hp_list(&c["atk"]);
        let hp_d = hp_list(&c["def"]);
        let got = side_name(battle_winner(alive_a, alive_d, &hp_a, &hp_d));
        assert_eq!(
            got, c["expect"],
            "przypadek #{i}: aliveA={alive_a} aliveD={alive_d} atk={hp_a:?} def={hp_d:?}"
        );
    }
}

#[test]
fn obie_strony_zyja_bitwa_trwa() {
    assert_eq!(battle_winner(true, true, &[50.0], &[1.0]), None);
}

#[test]
fn jedna_strona_zyje_wygrywa_niezaleznie_od_hp() {
    assert_eq!(
        battle_winner(true, false, &[0.0], &[999.0]),
        Some(BattleSide::Attacker)
    );
    assert_eq!(
        battle_winner(false, true, &[999.0], &[0.0]),
        Some(BattleSide::Defender)
    );
}

#[test]
fn mutual_elimination_remis_hp_to_atakujacy() {
    // web: hpA >= hpD ? 'atakujacy' : 'obronca' -- remis daje atakujacego
    assert_eq!(
        battle_winner(false, false, &[10.0], &[10.0]),
        Some(BattleSide::Attacker)
    );
    assert_eq!(
        battle_winner(false, false, &[9.0], &[10.0]),
        Some(BattleSide::Defender)
    );
}

#[test]
fn mutual_elimination_ujemne_hp_obcinane_do_zera() {
    // Math.max(0, -5) = 0 na jednostke: [-5, 3] -> 3, [2] -> 2 => atakujacy
    assert_eq!(
        battle_winner(false, false, &[-5.0, 3.0], &[2.0]),
        Some(BattleSide::Attacker)
    );
    // [-5] vs [-7]: obie sumy po obcieciu 0 => remis => atakujacy
    assert_eq!(
        battle_winner(false, false, &[-5.0], &[-7.0]),
        Some(BattleSide::Attacker)
    );
}

#[test]
fn mutual_elimination_pusta_strona() {
    assert_eq!(
        battle_winner(false, false, &[], &[]),
        Some(BattleSide::Attacker)
    );
    assert_eq!(
        battle_winner(false, false, &[], &[1.0]),
        Some(BattleSide::Defender)
    );
}

/// Galaz NaN (zarzut 6 audytu R1). Oczekiwania wyprowadzone z semantyki JS (sprawdzone w node 22):
/// `Math.max(0, NaN)` = NaN, suma NaN, `NaN >= x` = false -> 'obronca' (takze gdy strona atakujacego ma NaN, a obrona pusta).
#[test]
fn mutual_elimination_nan_hp_jak_web() {
    assert_eq!(
        battle_winner(false, false, &[f64::NAN], &[1.0]),
        Some(BattleSide::Defender)
    );
    assert_eq!(
        battle_winner(false, false, &[1.0], &[f64::NAN]),
        Some(BattleSide::Defender)
    );
    assert_eq!(
        battle_winner(false, false, &[f64::NAN], &[]),
        Some(BattleSide::Defender)
    );
}
