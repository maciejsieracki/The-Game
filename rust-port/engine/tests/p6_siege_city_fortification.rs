//! P6 SIEGE-TAKTYKA K2: testy zgodnosci `domain::siege_city_fortification` z kodem weba.
//!
//! Wektory: `p6_siege_city_fortification_vectors/vectors.json`, generowane przez `p6_siege_city_fortification_gen.mjs`
//! (Node 22) z wycietych fragmentow `gra/src/game/city-fortification.ts` (pin 07d2fbd72): `cityFortificationKind`
//! 29-36, `MeleeWallContext` 61-70, `meleeBlockedByWall` 76-79, `attackerWallEntryIsBreach` 96-98.

use civ_engine::domain::siege_city_fortification::{
    attacker_wall_entry_is_breach, city_fortification_kind, melee_blocked_by_wall,
    CityFortificationKind, MeleeWallContext,
};
use std::collections::BTreeSet;

const VECTORS: &str = include_str!("p6_siege_city_fortification_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn branch_of(c: &serde_json::Value) -> String {
    c["branch"].as_str().expect("branch").to_string()
}

#[test]
fn wektory_city_fortification_kind_zgodne_z_webem() {
    let v = load();
    let cases = v["cityFortificationKind"]
        .as_array()
        .expect("cityFortificationKind");
    assert!(cases.len() >= 100, "wektory: {}", cases.len());
    let mut seen = BTreeSet::new();
    for (i, c) in cases.iter().enumerate() {
        // Brak klucza (undefined) i null daja ten sam wynik: oba to `None`.
        let built: Option<Vec<String>> = match &c["builtBuildingIds"] {
            serde_json::Value::Null => None,
            serde_json::Value::Array(xs) => Some(
                xs.iter()
                    .map(|x| x.as_str().expect("id budynku").to_string())
                    .collect(),
            ),
            other => panic!("przypadek {i}: nieoczekiwane wejscie {other}"),
        };
        let got = city_fortification_kind(built.as_deref());
        let expect = match c["expect"].as_str().expect("expect") {
            "mur" => CityFortificationKind::Mur,
            "palisada" => CityFortificationKind::Palisada,
            "none" => CityFortificationKind::None,
            other => panic!("przypadek {i}: nieznany wynik {other}"),
        };
        assert_eq!(got, expect, "przypadek {i}");
        seen.insert(branch_of(c));
    }
    for want in [
        "null",
        "none",
        "mur",
        "palisada",
        "list:none",
        "list:mur",
        "list:palisada",
    ] {
        assert!(
            seen.contains(want),
            "brak pokrycia galezi cityFortificationKind: {want}; widziane: {seen:?}"
        );
    }
}

#[test]
fn wektory_melee_blocked_by_wall_zgodne_z_webem() {
    let v = load();
    let cases = v["meleeBlockedByWall"]
        .as_array()
        .expect("meleeBlockedByWall");
    assert!(cases.len() >= 300, "wektory: {}", cases.len());
    let mut seen = BTreeSet::new();
    for (i, c) in cases.iter().enumerate() {
        let ctx_json = &c["ctx"];
        let ctx = MeleeWallContext {
            attacker_is_melee: ctx_json["attackerIsMelee"]
                .as_bool()
                .expect("attackerIsMelee"),
            attacker_on_wall: ctx_json["attackerOnWall"]
                .as_bool()
                .expect("attackerOnWall"),
            defender_on_wall: ctx_json["defenderOnWall"]
                .as_bool()
                .expect("defenderOnWall"),
            // Brak klucza `wallBreached` (undefined) == false, jak `ctx.wallBreached === true` w webie.
            wall_breached: ctx_json["wallBreached"].as_bool().unwrap_or(false),
        };
        let got = melee_blocked_by_wall(ctx);
        let expect = c["expect"].as_bool().expect("expect");
        assert_eq!(got, expect, "przypadek {i}: {ctx:?}");
        seen.insert(branch_of(c).split(':').next().unwrap().to_string());
    }
    for want in [
        "a-breached",
        "b-notMelee",
        "c-attackerOnWall",
        "d-defenderOffWall",
        "e-blocked",
    ] {
        assert!(
            seen.contains(want),
            "brak pokrycia galezi meleeBlockedByWall: {want}; widziane: {seen:?}"
        );
    }
}

#[test]
fn wektory_attacker_wall_entry_is_breach_zgodne_z_webem() {
    let v = load();
    let cases = v["attackerWallEntryIsBreach"]
        .as_array()
        .expect("attackerWallEntryIsBreach");
    assert!(cases.len() >= 100, "wektory: {}", cases.len());
    let mut seen = BTreeSet::new();
    for (i, c) in cases.iter().enumerate() {
        let side_atk = match c["side"].as_str().expect("side") {
            "atk" => true,
            "def" => false,
            other => panic!("przypadek {i}: nieznana strona {other}"),
        };
        // `null` (web `undefined`) i `false` daja ten sam wynik: web sprawdza `=== true`.
        let on_walkway = c["onWallWalkway"].as_bool().unwrap_or(false);
        let got = attacker_wall_entry_is_breach(side_atk, on_walkway);
        let expect = c["expect"].as_bool().expect("expect");
        assert_eq!(got, expect, "przypadek {i}");
        seen.insert(branch_of(c));
    }
    for want in ["def", "atk-noWalkway", "atk-walkway"] {
        assert!(
            seen.contains(want),
            "brak pokrycia galezi attackerWallEntryIsBreach: {want}; widziane: {seen:?}"
        );
    }
}

#[test]
fn melee_blocked_by_wall_jawne_galezie() {
    let base = MeleeWallContext {
        attacker_is_melee: true,
        attacker_on_wall: false,
        defender_on_wall: true,
        wall_breached: false,
    };
    // (e) blokada: wrecz, atakujacy poza murem, cel na murze, brak wylomu.
    assert!(melee_blocked_by_wall(base));
    // (a) wylom znosi blokade.
    assert!(!melee_blocked_by_wall(MeleeWallContext {
        wall_breached: true,
        ..base
    }));
    // (b) nie wrecz (strzelec / machina).
    assert!(!melee_blocked_by_wall(MeleeWallContext {
        attacker_is_melee: false,
        ..base
    }));
    // (c) atakujacy na murze (mur na murze).
    assert!(!melee_blocked_by_wall(MeleeWallContext {
        attacker_on_wall: true,
        ..base
    }));
    // (d) cel poza murem.
    assert!(!melee_blocked_by_wall(MeleeWallContext {
        defender_on_wall: false,
        ..base
    }));
}

#[test]
fn city_fortification_kind_priorytet_mur_nad_palisada() {
    assert_eq!(
        city_fortification_kind(Some(&["palisada", "mury"][..])),
        CityFortificationKind::Mur
    );
    assert_eq!(
        city_fortification_kind(Some(&["palisada"][..])),
        CityFortificationKind::Palisada
    );
    assert_eq!(
        city_fortification_kind::<&str>(None),
        CityFortificationKind::None
    );
    // Dopasowanie dokladne: wielkosc liter i sufiksy nie pasuja.
    assert_eq!(
        city_fortification_kind(Some(&["Mury", "palisada_x"][..])),
        CityFortificationKind::None
    );
}
