//! P6 SIEGE-TAKTYKA KLASY (#217, R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASY-Q1): zgodnosc czterech klasyfikatorow wejscia
//! (`isSiegeUnit`, `isSiegeTower`, `_isRam`, `canShoot`) oraz `normName` z kodem weba (pin `07d2fbd72`).
//!
//! Wektory: `p6_siege_tactics_classify_vectors/vectors.json`, generowane przez `p6_siege_tactics_classify_gen.mts`,
//! ktory WYKONUJE doslowne linie pinu (Node, straznik SHA-256 fragmentow). Test wymaga:
//! (1) zgodnosci kazdego przypadku, (2) >= 300 przypadkow nazw, (3) pokrycia wszystkich galezi z `meta.categories`
//! (kazda kategoria > 0 i rowna wynikowi pinu), (4) pokrycia wszystkich 75 jednostek z `gra/data/units.json` pinu.

use civ_engine::domain::siege_tactics_classify::{
    can_shoot, is_ram, is_siege_tower, is_siege_unit, norm_name, ClassifyUnit, ShootUnit,
};
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_siege_tactics_classify_vectors/vectors.json");

fn opt_str(v: &serde_json::Value) -> Option<String> {
    if v.is_null() {
        None
    } else {
        Some(v.as_str().expect("napis albo null").to_string())
    }
}

fn ammo(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::Number(n) => n.as_f64().expect("liczba"),
        serde_json::Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("liczba w napisie"),
        },
        other => panic!("nieoczekiwany typ ammoLeft: {other}"),
    }
}

#[test]
fn vectors_meta_and_size() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let meta = &root["meta"];
    assert_eq!(
        meta["pin"].as_str().unwrap(),
        "07d2fbd72f758705f8e1d59cc4968027ffbafe75"
    );
    assert_eq!(
        meta["fragmentSha256"].as_str().unwrap(),
        "10c0ec94d60eb96440d396b114e81c81936374684f1f11648c7775fce9453c41"
    );
    let names = root["names"].as_array().unwrap();
    assert!(names.len() >= 300, "przypadkow nazw: {}", names.len());
    assert_eq!(meta["unitCount"].as_u64().unwrap(), 75);
}

#[test]
fn name_classifiers_match_pin() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let mut cats: BTreeMap<String, u64> = BTreeMap::new();
    for (i, c) in root["names"].as_array().unwrap().iter().enumerate() {
        let u = ClassifyUnit {
            typ: opt_str(&c["in"]["typ"]),
            jednostka: opt_str(&c["in"]["jednostka"]),
            nazwa: opt_str(&c["in"]["nazwa"]),
        };
        let exp_unit = c["isSiegeUnit"].as_bool().unwrap();
        let exp_tower = c["isSiegeTower"].as_bool().unwrap();
        let exp_ram = c["isRam"].as_bool().unwrap();
        assert_eq!(
            is_siege_unit(&u),
            exp_unit,
            "isSiegeUnit przypadek {i}: {u:?}"
        );
        assert_eq!(
            is_siege_tower(&u),
            exp_tower,
            "isSiegeTower przypadek {i}: {u:?}"
        );
        assert_eq!(is_ram(&u), exp_ram, "_isRam przypadek {i}: {u:?}");
        let typ_hit = u.typ.as_deref().unwrap_or("").trim() == "Siege";
        if exp_unit {
            *cats
                .entry(
                    if typ_hit {
                        "isSiegeUnit:typ"
                    } else {
                        "isSiegeUnit:name"
                    }
                    .into(),
                )
                .or_default() += 1;
        } else {
            *cats.entry("isSiegeUnit:false".into()).or_default() += 1;
        }
        *cats
            .entry(
                if exp_tower {
                    "isSiegeTower:true"
                } else {
                    "isSiegeTower:false"
                }
                .into(),
            )
            .or_default() += 1;
        *cats
            .entry(if exp_ram { "isRam:true" } else { "isRam:false" }.into())
            .or_default() += 1;
    }
    // Pokrycie galezi: rozklad wynikow Rust = rozklad z pinu (meta.categories).
    let meta_cats = root["meta"]["categories"].as_object().unwrap();
    for (k, v) in meta_cats
        .iter()
        .filter(|(k, _)| !k.starts_with("canShoot") && !k.starts_with("normName"))
    {
        let got = cats.get(k).copied().unwrap_or(0);
        assert_eq!(got, v.as_u64().unwrap(), "kategoria {k}");
        assert!(got > 0, "galaz bez pokrycia: {k}");
    }
    // Wszystkie jednostki z pinu (units.json) przez nazwe Jednostka.
    let all_units: Vec<String> = root["names"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|c| c["in"]["jednostka"].as_str().map(str::to_string))
        .collect();
    let unit_names = root["meta"]["unitNames"].as_array().unwrap();
    assert_eq!(unit_names.len(), 75);
    for n in unit_names {
        let n = n.as_str().unwrap();
        assert!(
            all_units.iter().any(|s| s == n),
            "jednostka z pinu bez przypadku: {n}"
        );
    }
}

#[test]
fn can_shoot_matches_pin_and_covers_branches() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let cases = root["canShoot"].as_array().unwrap();
    let mut t = 0u32;
    let mut f = 0u32;
    for c in cases {
        let ru = ShootUnit {
            ranged_base: c["in"]["rangedBase"].as_bool().unwrap(),
            ammo_left: ammo(&c["in"]["ammoLeft"]),
        };
        let exp = c["canShoot"].as_bool().unwrap();
        assert_eq!(can_shoot(&ru), exp, "canShoot {ru:?}");
        if exp {
            t += 1;
        } else {
            f += 1;
        }
    }
    assert!(t > 0 && f > 0, "galezi canShoot: true={t} false={f}");
    assert_eq!(
        t as u64,
        root["meta"]["categories"]["canShoot:true"]
            .as_u64()
            .unwrap()
    );
    assert_eq!(
        f as u64,
        root["meta"]["categories"]["canShoot:false"]
            .as_u64()
            .unwrap()
    );
}

#[test]
fn norm_name_matches_pin() {
    let root: serde_json::Value = serde_json::from_str(VECTORS).expect("json");
    let cases = root["normName"].as_array().unwrap();
    for c in cases {
        let input = c["in"].as_str().unwrap();
        let exp = c["out"].as_str().unwrap();
        assert_eq!(norm_name(input), exp, "normName({input:?})");
    }
    assert!(cases.len() >= 40);
}
