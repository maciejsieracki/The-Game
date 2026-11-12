//! P6 SIEGE-TAKTYKA K5i-2a3: testy zgodnosci `domain::siege_tactics_inputs_wall` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_inputs_wall_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_inputs_wall_gen.mjs` (Node 22), ktory WYKONUJE zakresy linii tekstu pinu `07d2fbd72`
//! (battleScene.ts, city-defense.ts); straznik SHA-256 fragmentow jest w generatorze.

use civ_engine::domain::siege_tactics_inputs_wall::{
    city_terr_mult, city_wall_defense_bonus_percent, defender_inside_fortification,
    field_fortify_defense_bonus, fortification_defense_bonus_for_unit, has_mur, terr_def_mult,
    wall_bonus_proc_for, wall_defense_totals, CityDefenseBonusParams, MiastoWallParamValues,
};

const VECTORS: &str = include_str!("p6_siege_tactics_inputs_wall_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: NaN/Infinity oraz liczby niecalkowite sa zapisane jako tekst (f64::from_str jest
/// dokladnie zaokraglane, w odroznieniu od serde_json bez `float_roundtrip`).
fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other
                .parse::<f64>()
                .unwrap_or_else(|_| panic!("nieznana liczba w wektorze: {other}")),
        };
    }
    v.as_f64().expect("liczba")
}

fn opt_num(v: &serde_json::Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn built_of(v: &serde_json::Value) -> Option<Vec<String>> {
    v.as_array().map(|a| {
        a.iter()
            .map(|s| s.as_str().expect("id budynku").to_string())
            .collect()
    })
}

fn is_def(v: &serde_json::Value) -> bool {
    v.as_str().expect("side") == "def"
}

fn cases<'a>(v: &'a serde_json::Value, key: &str) -> &'a Vec<serde_json::Value> {
    let a = v[key].as_array().expect(key);
    assert!(!a.is_empty(), "{key}: brak wektorow");
    a
}

#[test]
fn guard_pin_i_liczba_wektorow() {
    let v = load();
    assert_eq!(v["fragmentSha256"].as_str().unwrap().len(), 64);
    let total: usize = [
        "cityWall",
        "ctorWall",
        "inside",
        "fortBonus",
        "wallBonusProcFor",
        "hasMur",
        "cityTerrMult",
        "terrDefMult",
        "fortify",
    ]
    .iter()
    .map(|k| cases(&v, k).len())
    .sum();
    assert!(total >= 500, "za malo wektorow: {total}");
    // pokrycie galezi (liczniki z generatora) - kazda galaz > 0
    let counts = v["branchCounts"].as_object().expect("branchCounts");
    for tag in [
        "built-null",
        "built-list",
        "mury",
        "mury+fort",
        "kamienne",
        "kamienne+fort",
        "fort-solo",
        "palisada",
        "brak-muru",
        "baszta",
        "bez-baszty",
        "palisada-domyslna",
        "palisada-jawna",
        "kamienny-domyslny",
        "kamienny-jawny",
        "ctor-brak-miasto-params",
        "ctor-miasto-params",
        "inside-atk",
        "inside-korona",
        "inside-za-murem",
        "inside-poza",
        "bonus-zero",
        "bonus-wewnatrz",
        "bonus-nan",
        "hasMur-true",
        "hasMur-false",
        "cityTerr-miasto",
        "cityTerr-pole",
        "terrDef-miasto",
        "terrDef-pole",
        "fortify-tak",
        "fortify-nie",
    ] {
        assert!(
            counts.get(tag).and_then(|c| c.as_u64()).unwrap_or(0) > 0,
            "galaz bez pokrycia: {tag}"
        );
    }
}

#[test]
fn city_wall_defense_bonus_percent_z_pinu() {
    let v = load();
    let (mut nan, mut inf) = (0, 0);
    for (i, c) in cases(&v, "cityWall").iter().enumerate() {
        let built = built_of(&c["built"]);
        let p = &c["params"];
        let params = CityDefenseBonusParams {
            mur: num(&p["mur"]),
            cytadela: num(&p["cytadela"]),
            baszta: num(&p["baszta"]),
            palisada: opt_num(&p["palisada"]),
            mur_kamienny: opt_num(&p["murKamienny"]),
        };
        let got = city_wall_defense_bonus_percent(built.as_deref(), &params);
        let exp = num(&c["expect"]);
        assert!(same(got, exp), "cityWall #{i}: {got} != {exp}");
        nan += got.is_nan() as u32;
        inf += got.is_infinite() as u32;
    }
    assert!(nan > 0 && inf > 0, "brak NaN/Inf w wynikach");
}

#[test]
fn blok_konstruktora_wall_defense_mult_z_pinu() {
    let v = load();
    for (i, c) in cases(&v, "ctorWall").iter().enumerate() {
        let built = built_of(&c["built"]);
        let w = &c["vals"];
        let values = MiastoWallParamValues {
            mur: w.get("mur").and_then(opt_num),
            mur_kamienny: w.get("murKamienny").and_then(opt_num),
            cytadela: w.get("cytadela").and_then(opt_num),
            baszta: w.get("baszta").and_then(opt_num),
            palisada: w.get("palisada").and_then(opt_num),
        };
        let got = wall_defense_totals(built.as_deref(), &values);
        assert!(
            same(got.total_proc, num(&c["expect"]["total"])),
            "ctor #{i} total: {} != {}",
            got.total_proc,
            num(&c["expect"]["total"])
        );
        assert!(
            same(got.mult, num(&c["expect"]["mult"])),
            "ctor #{i} mult: {} != {}",
            got.mult,
            num(&c["expect"]["mult"])
        );
    }
}

#[test]
fn obronca_wewnatrz_obwarowania_z_pinu() {
    let v = load();
    for (i, c) in cases(&v, "inside").iter().enumerate() {
        let got = defender_inside_fortification(
            is_def(&c["side"]),
            c["walk"].as_bool().unwrap(),
            num(&c["q"]),
            num(&c["col"]),
        );
        assert_eq!(got, c["expect"].as_bool().unwrap(), "inside #{i}");
    }
    for (i, c) in cases(&v, "fortBonus").iter().enumerate() {
        let got = fortification_defense_bonus_for_unit(
            is_def(&c["side"]),
            c["walk"].as_bool().unwrap(),
            num(&c["q"]),
            num(&c["col"]),
            num(&c["total"]),
        );
        assert!(
            same(got, num(&c["expect"])),
            "fortBonus #{i}: {got} != {}",
            num(&c["expect"])
        );
    }
    for (i, c) in cases(&v, "wallBonusProcFor").iter().enumerate() {
        // pin: `onWallWalkway === true` - undefined/false => brak korony
        let walk = c["walk"].as_bool() == Some(true);
        let got = wall_bonus_proc_for(
            is_def(&c["side"]),
            walk,
            num(&c["q"]),
            num(&c["col"]),
            num(&c["total"]),
        );
        assert!(
            same(got, num(&c["expect"])),
            "wallBonusProcFor #{i}: {got} != {}",
            num(&c["expect"])
        );
    }
}

#[test]
fn zlozenie_mnoznika_terenu_obroncy_z_pinu() {
    let v = load();
    for (i, c) in cases(&v, "hasMur").iter().enumerate() {
        assert_eq!(
            has_mur(num(&c["total"])),
            c["expect"].as_bool().unwrap(),
            "hasMur #{i}"
        );
    }
    for (i, c) in cases(&v, "cityTerrMult").iter().enumerate() {
        let got = city_terr_mult(c["isCity"].as_bool().unwrap(), num(&c["gated"]));
        assert!(same(got, num(&c["expect"])), "cityTerrMult #{i}");
    }
    for (i, c) in cases(&v, "terrDefMult").iter().enumerate() {
        let got = terr_def_mult(
            c["isCity"].as_bool().unwrap(),
            num(&c["wallBonus"]),
            num(&c["cityTerr"]),
            num(&c["field"]),
        );
        assert!(
            same(got, num(&c["expect"])),
            "terrDefMult #{i}: {got} != {}",
            num(&c["expect"])
        );
    }
}

#[test]
fn field_fortify_defense_bonus_z_pinu() {
    let v = load();
    for (i, c) in cases(&v, "fortify").iter().enumerate() {
        let got = field_fortify_defense_bonus(
            num(&c["base"]),
            c["fort"].as_bool().unwrap(),
            num(&c["proc"]),
        );
        assert!(
            same(got, num(&c["expect"])),
            "fortify #{i}: {got} != {}",
            num(&c["expect"])
        );
    }
}
