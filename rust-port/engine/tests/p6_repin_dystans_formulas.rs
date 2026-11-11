//! R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1 (runda 1) -- testy formul pocisku z REPIN web FALA 603
//! (R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1, kod a259012fa).
//!
//! Wektory `p6_repin_dystans_vectors/*.json` wygenerowane z uruchomionego kodu weba
//! (origin/main 638e90bea: gra/src/game/unit-power.ts + combat.ts, esbuild bundle, Node 22).
//! Pokrywaja: kazdy typ strzelca (Slinger, Distance/Łucznik, Oszczepnik, Mount, odmiany nazw,
//! brak pol), zaokraglenie polowek (JS Math.round), podloge 1, celnosc max(wreczna, dystansowa),
//! hitChanceTw z tw_v3.

use civ_engine::domain::unit_power::{
    hit_chance_tw, range_damage_tw, ranged_damage_mult_for, ranged_shot_accuracy,
    ranged_shot_damage,
};
use serde_json::Value;

const MULT: &str = include_str!("p6_repin_dystans_vectors/dystans-mult.json");
const SHOTS: &str = include_str!("p6_repin_dystans_vectors/dystans-shots.json");
const ACC: &str = include_str!("p6_repin_dystans_vectors/dystans-acc.json");

fn text<'a>(v: &'a Value, key: &str) -> Option<&'a str> {
    v.get(key).and_then(Value::as_str)
}

fn num(v: &Value, key: &str) -> f64 {
    v[key]
        .as_f64()
        .unwrap_or_else(|| panic!("pole {key} musi byc liczba"))
}

#[test]
fn p6_repin_dystans_mult_vectors_match_web() {
    let rows: Vec<Value> = serde_json::from_str(MULT).expect("dystans-mult.json");
    assert!(
        rows.len() >= 19,
        "za malo wektorow mnoznika: {}",
        rows.len()
    );
    for row in &rows {
        let input = &row["input"];
        let got = ranged_damage_mult_for(text(input, "Typ"), text(input, "Jednostka"));
        let exp = row["expected"].as_f64().expect("expected");
        assert_eq!(got, exp, "mnoznik dla {input}");
    }
}

#[test]
fn p6_repin_dystans_shot_damage_vectors_match_web() {
    let root: Value = serde_json::from_str(SHOTS).expect("dystans-shots.json");
    let mut checked = 0usize;
    for group in ["shots", "halves"] {
        let rows = root[group].as_array().expect("tablica wektorow");
        for row in rows {
            let shooter = &row["shooter"];
            let got = ranged_shot_damage(
                text(shooter, "counterTyp"),
                text(shooter, "typNazwa"),
                num(row, "missile"),
                num(row, "armor"),
                num(row, "counterMult"),
            );
            let exp = row["expected"].as_i64().expect("expected int");
            assert_eq!(got, exp, "{group}: {row}");
            checked += 1;
        }
    }
    assert!(checked >= 2480, "za malo wektorow obrazen: {checked}");
}

#[test]
fn p6_repin_dystans_accuracy_and_hit_vectors_match_web() {
    let root: Value = serde_json::from_str(ACC).expect("dystans-acc.json");
    for row in root["acc"].as_array().expect("acc") {
        let got = ranged_shot_accuracy(num(row, "melee"), num(row, "missile"));
        assert_eq!(got, num(row, "expected"), "celnosc: {row}");
    }
    for row in root["hits"].as_array().expect("hits") {
        let got = hit_chance_tw(num(row, "atk"), num(row, "def"), 0.0);
        assert_eq!(got, num(row, "expected"), "hitChanceTw: {row}");
    }
    for row in root["hitsAcc"].as_array().expect("hitsAcc") {
        let acc = ranged_shot_accuracy(num(row, "melee"), num(row, "missile"));
        let got = hit_chance_tw(acc, num(row, "def"), 0.0);
        assert_eq!(got, num(row, "expected"), "hitChanceTw(celnosc): {row}");
    }
}

#[test]
fn p6_repin_dystans_procarz_x3_after_armor_and_counter() {
    // web: rangeDamageTw(5,3)=2; *1.5 = 3; *3 (Slinger) = 9
    assert_eq!(
        ranged_shot_damage(Some("Slinger"), Some("Procarz"), 5.0, 3.0, 1.5),
        9
    );
    assert_eq!(
        ranged_shot_damage(Some("Slinger"), Some("Procarz (Huaracoc)"), 5.0, 3.0, 1.5),
        9
    );
}

#[test]
fn p6_repin_dystans_lucznik_x2_and_oszczepnik_unchanged() {
    assert_eq!(
        ranged_damage_mult_for(Some("Distance"), Some("Łucznik")),
        2.0
    );
    assert_eq!(
        ranged_damage_mult_for(Some("Distance"), Some("Oszczepnik")),
        1.0
    );
    assert_eq!(
        ranged_damage_mult_for(Some("Mount"), Some("Łucznik konny")),
        1.0
    );
    assert_eq!(
        ranged_shot_damage(Some("Distance"), Some("Oszczepnik"), 7.0, 2.0, 1.0),
        5
    );
}

#[test]
fn p6_repin_dystans_minimum_damage_is_one() {
    // web: max(1, missile - armor) = 1; mnoznik x1 -> 1 (podloga po mnozeniu)
    assert_eq!(range_damage_tw(3.0, 40.0), 1.0);
    assert_eq!(
        ranged_shot_damage(Some("Distance"), Some("Oszczepnik"), 3.0, 40.0, 0.5),
        1
    );
    assert_eq!(ranged_shot_damage(None, None, 0.0, 0.0, 0.0), 1);
}

#[test]
fn p6_repin_dystans_multiplier_applies_before_rounding() {
    // web: rangeDamageTw(2,0)=2; *0.75 = 1.5 -> round 2 (polowka w gore); bez mnoznika klasy
    assert_eq!(
        ranged_shot_damage(Some("Distance"), Some("Oszczepnik"), 2.0, 0.0, 0.75),
        2
    );
    // Lucznik x2: rangeDamageTw(3,1)=2; *1.25 = 2.5; *2 = 5.0 -> 5
    assert_eq!(
        ranged_shot_damage(Some("Distance"), Some("Łucznik"), 3.0, 1.0, 1.25),
        5
    );
}

#[test]
fn p6_repin_dystans_accuracy_is_max_of_melee_and_missile() {
    assert_eq!(ranged_shot_accuracy(3.0, 9.0), 9.0);
    assert_eq!(ranged_shot_accuracy(9.0, 3.0), 9.0);
}
