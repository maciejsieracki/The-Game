//! R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1: zgodnosc `siege_allowed_between` (port web `siegeAllowedBetween`,
//! `gra/src/game/diplomacy-siege-war-gate.ts` @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_w6s_siege_vectors/siege.json`, generator `tests/p6_w6s_siege_gen.mjs` (esbuild, poza repo).
//! Relacja wojny jest kierunkowa (`are_enemies(besieger, defender)`), a sprawdzane pary obejmuja przekatna.

use civ_engine::domain::diplomacy_siege_war_gate::{
    enemy_units_adjacent_to_city, siege_allowed_between, SiegeCity, SiegeUnit,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_w6s_siege_vectors/siege.json");

fn int(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| panic!("int oczekiwany: {v}"))
}

#[test]
fn siege_allowed_between_matches_web_vectors() {
    let doc: Value = serde_json::from_str(VECTORS).expect("siege.json");
    let owners: Vec<i64> = doc["owners"].as_array().unwrap().iter().map(int).collect();
    let matrices: Vec<Vec<Vec<bool>>> = doc["matrices"]
        .as_array()
        .unwrap()
        .iter()
        .map(|m| {
            m.as_array()
                .unwrap()
                .iter()
                .map(|row| {
                    row.as_array()
                        .unwrap()
                        .iter()
                        .map(|x| x.as_bool().unwrap())
                        .collect()
                })
                .collect()
        })
        .collect();
    assert_eq!(owners.len(), 6);
    assert_eq!(matrices.len(), 6);

    let cases = doc["cases"].as_array().unwrap();
    assert_eq!(cases.len(), matrices.len() * owners.len() * owners.len());

    for (i, row) in cases.iter().enumerate() {
        let mi = int(&row["matrix"]) as usize;
        let besieger = int(&row["besieger"]);
        let defender = int(&row["defender"]);
        let bi = owners.iter().position(|&o| o == besieger).expect("owner");
        let di = owners.iter().position(|&o| o == defender).expect("owner");
        let table = &matrices[mi];
        let are_enemies = |a: i64, b: i64| {
            let ai = owners.iter().position(|&o| o == a).expect("owner");
            let bi = owners.iter().position(|&o| o == b).expect("owner");
            table[ai][bi]
        };
        let got = siege_allowed_between(besieger, defender, are_enemies);
        assert_eq!(
            got,
            row["allowed"].as_bool().unwrap(),
            "przypadek {i}: m={mi} besieger={besieger} defender={defender} (bi={bi}, di={di})"
        );
        if besieger == defender {
            assert!(
                !got,
                "przypadek {i}: ten sam wlasciciel nie oblega sam siebie"
            );
        }
    }
}

#[test]
fn siege_allowed_between_requires_directed_war() {
    // Wojna tylko w jedna strone: web `areEnemies(besieger, defender)` decyduje, kto moze oblegac.
    let are_enemies = |a: i64, b: i64| (a, b) == (2, 1);
    assert!(siege_allowed_between(2, 1, are_enemies));
    assert!(!siege_allowed_between(1, 2, are_enemies));
    // Pokoj (brak wojny) -> brak oblezenia, nawet przy obcej jednostce przy murze.
    let peace = |_: i64, _: i64| false;
    assert!(!siege_allowed_between(2, 1, peace));
}

#[test]
fn enemy_units_adjacent_uses_siege_allowed_between() {
    // Wywolujacy w Rust: `enemy_units_adjacent_to_city` filtruje przez `siege_allowed_between`.
    let city = SiegeCity {
        q: 0,
        r: 0,
        owner_id: 1,
        ma_mur: true,
        oblegane: false,
    };
    let units = [
        SiegeUnit {
            q: 1,
            r: 0,
            owner_id: 2,
        },
        SiegeUnit {
            q: 0,
            r: 1,
            owner_id: 3,
        },
        SiegeUnit {
            q: 0,
            r: -1,
            owner_id: 1,
        },
    ];
    let are_enemies = |a: i64, b: i64| (a, b) == (2, 1);
    assert_eq!(
        enemy_units_adjacent_to_city(&city, &units, are_enemies),
        vec![0]
    );
}
