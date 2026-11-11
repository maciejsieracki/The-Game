//! R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1: zgodnosc `siege_allowed_between` (port web `siegeAllowedBetween`,
//! `gra/src/game/diplomacy-siege-war-gate.ts` @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_w6s_siege_vectors/siege.json`, generator `tests/p6_w6s_siege_gen.mjs` (esbuild, poza repo).
//! Relacja wojny jest kierunkowa (`are_enemies(besieger, defender)`), a sprawdzane pary obejmuja przekatna.

use civ_engine::domain::diplomacy_siege_war_gate::{
    enemy_units_adjacent_to_city, siege_allowed_between, siege_battle_side_owners, SiegeCity,
    SiegeUnit,
};
use serde_json::Value;
use std::collections::BTreeSet;

fn owner_set(v: &[i64]) -> BTreeSet<i64> {
    v.iter().copied().collect()
}

fn matrix_fn<'a>(owners: &'a [i64], table: &'a [Vec<bool>]) -> impl Fn(i64, i64) -> bool + 'a {
    move |a: i64, b: i64| {
        let ai = owners.iter().position(|&o| o == a).expect("owner");
        let bi = owners.iter().position(|&o| o == b).expect("owner");
        table[ai][bi]
    }
}

fn parse_matrices(v: &Value) -> Vec<Vec<Vec<bool>>> {
    v.as_array()
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
        .collect()
}

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

#[test]
fn siege_battle_side_owners_matches_web_vectors() {
    let doc: Value = serde_json::from_str(VECTORS).expect("siege.json");
    let owners: Vec<i64> = doc["owners"].as_array().unwrap().iter().map(int).collect();
    let enemy = parse_matrices(&doc["sideMatrices"]);
    let alliance = parse_matrices(&doc["sideAlliances"]);
    let cases = doc["sideCases"].as_array().unwrap();
    assert_eq!(enemy.len(), 6);
    assert_eq!(alliance.len(), 4);
    assert_eq!(
        cases.len(),
        enemy.len() * alliance.len() * owners.len() * owners.len()
    );

    for (i, row) in cases.iter().enumerate() {
        let em = int(&row["enemy"]) as usize;
        let am = int(&row["alliance"]) as usize;
        let besieger = int(&row["besieger"]);
        let city = int(&row["city"]);
        let are_enemies = matrix_fn(&owners, &enemy[em]);
        let has_alliance = matrix_fn(&owners, &alliance[am]);
        // Kandydaci = wszyscy wlasciciele z pinu (web: `OWNERS`).
        let got = siege_battle_side_owners(
            besieger,
            city,
            owners.iter().copied(),
            are_enemies,
            has_alliance,
        );
        let want_att: BTreeSet<i64> = row["attacker"]
            .as_array()
            .unwrap()
            .iter()
            .map(int)
            .collect();
        let want_def: BTreeSet<i64> = row["defender"]
            .as_array()
            .unwrap()
            .iter()
            .map(int)
            .collect();
        assert_eq!(
            got.attacker, want_att,
            "przypadek {i}: em={em} am={am} besieger={besieger} city={city} (attacker)"
        );
        assert_eq!(
            got.defender, want_def,
            "przypadek {i}: em={em} am={am} besieger={besieger} city={city} (defender)"
        );
    }
}

#[test]
fn siege_battle_side_owners_ally_of_besieger_joins_attack() {
    // 2 oblega 1; 3 jest formalnym sojusznikiem 2 i jest w wojnie z 1 -> 3 po stronie atakujacego.
    let are_enemies = |a: i64, b: i64| matches!((a, b), (2, 1) | (3, 1));
    let allied = |a: i64, b: i64| matches!((a, b), (3, 2) | (2, 3));
    let got = siege_battle_side_owners(2, 1, [1, 2, 3, 4], are_enemies, allied);
    assert_eq!(got.attacker, owner_set(&[2, 3]));
    assert_eq!(got.defender, owner_set(&[1]));
}

#[test]
fn siege_battle_side_owners_ally_of_city_joins_defence() {
    // 4 jest sojusznikiem miasta (1) i jest w wojnie z oblegajacym 2 -> 4 po stronie obrony.
    let are_enemies = |a: i64, b: i64| matches!((a, b), (2, 1) | (4, 2));
    let allied = |a: i64, b: i64| matches!((a, b), (4, 1) | (1, 4));
    let got = siege_battle_side_owners(2, 1, [1, 2, 4], are_enemies, allied);
    assert_eq!(got.attacker, owner_set(&[2]));
    assert_eq!(got.defender, owner_set(&[1, 4]));
}

#[test]
fn siege_battle_side_owners_third_party_at_war_with_city_stays_out() {
    // 5 jest w wojnie z miastem (1), ale nie jest sojusznikiem 2 -> nie trafia do strony oblegajacego.
    let are_enemies = |a: i64, b: i64| matches!((a, b), (2, 1) | (5, 1));
    let allied = |_: i64, _: i64| false;
    let got = siege_battle_side_owners(2, 1, [1, 2, 5], are_enemies, allied);
    assert_eq!(got.attacker, owner_set(&[2]));
    assert_eq!(got.defender, owner_set(&[1]));
}

#[test]
fn siege_battle_side_owners_ally_not_at_war_with_city_stays_out() {
    // 3 jest sojusznikiem 2, ale NIE jest w wojnie z miastem 1 -> brak wejscia na strone atakujacego.
    let are_enemies = |a: i64, b: i64| (a, b) == (2, 1);
    let allied = |a: i64, b: i64| matches!((a, b), (3, 2) | (2, 3));
    let got = siege_battle_side_owners(2, 1, [1, 2, 3], are_enemies, allied);
    assert_eq!(got.attacker, owner_set(&[2]));
    assert_eq!(got.defender, owner_set(&[1]));
}

#[test]
fn siege_battle_side_owners_contradictory_alliances_drop_shared_owner() {
    // 3 jest sojusznikiem obu stron i w wojnie z obiema -> bez usuniecia wystapilby po obu stronach.
    // Oczekiwane: 3 pominiety, obaj glowni zachowani.
    let are_enemies = |a: i64, b: i64| matches!((a, b), (2, 1) | (3, 1) | (3, 2));
    let allied = |a: i64, b: i64| matches!((a, b), (3, 2) | (2, 3) | (3, 1) | (1, 3));
    let got = siege_battle_side_owners(2, 1, [1, 2, 3], are_enemies, allied);
    assert_eq!(got.attacker, owner_set(&[2]));
    assert_eq!(got.defender, owner_set(&[1]));
}

#[test]
fn siege_battle_side_owners_no_war_yields_empty_sides() {
    // Pokoj miedzy oblegajacym a miastem -> oba zbiory puste, nawet przy sojuszach.
    let are_enemies = |_: i64, _: i64| false;
    let allied = |_: i64, _: i64| true;
    let got = siege_battle_side_owners(2, 1, [1, 2, 3], are_enemies, allied);
    assert!(got.attacker.is_empty());
    assert!(got.defender.is_empty());
    // Ten sam wlasciciel nie oblega wlasnego miasta.
    let got_self = siege_battle_side_owners(1, 1, [1, 2], |_, _| true, |_, _| true);
    assert!(got_self.attacker.is_empty());
    assert!(got_self.defender.is_empty());
}
