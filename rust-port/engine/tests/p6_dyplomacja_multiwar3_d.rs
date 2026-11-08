//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia D): zgodnosc `diplomacy_siege_war_gate` z URUCHOMIONYM
//! webem (origin/main, `gra/src/game/diplomacy-siege-war-gate.ts` + `mapSiegeDetect.ts` `classifyCityAttack`).
//! Wektory: `tests/p6_dyplomacja_multiwar3_d_data/siege.json`, generator `gen-de.mts` (Node 22,
//! `--import reg2.mjs` z transpilacja TS przez `typescript`; web wypakowany `git archive origin/main gra/src gra/data` poza repo).
//! Jednostki w wektorach identyfikowane indeksem w `units` (web `units.indexOf`).

use std::collections::HashSet;

use civ_engine::domain::diplomacy_siege_war_gate::{
    ai_auto_siege_allowed, auto_siege_candidate_for_scan, detect_war_auto_siege_on_city,
    enemy_units_adjacent_to_city, hex_distance, is_siege_still_valid, siege_allowed_between,
    MapSiegeContext, MapStarcieTryb, SiegeCity, SiegeUnit,
};
use serde_json::Value;

const SIEGE: &str = include_str!("p6_dyplomacja_multiwar3_d_data/siege.json");

fn int(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| panic!("int oczekiwany: {v}"))
}

fn opt_idx(v: &Value) -> Option<usize> {
    if v.is_null() {
        None
    } else {
        Some(int(v) as usize)
    }
}

fn city_of(v: &Value) -> SiegeCity {
    SiegeCity {
        q: int(&v["q"]),
        r: int(&v["r"]),
        owner_id: int(&v["ownerId"]),
        ma_mur: v["maMur"].as_bool().unwrap(),
        oblegane: v["oblegane"].as_bool().unwrap(),
    }
}

fn units_of(v: &Value) -> Vec<SiegeUnit> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|u| SiegeUnit {
            q: int(&u["q"]),
            r: int(&u["r"]),
            owner_id: int(&u["ownerId"]),
        })
        .collect()
}

fn tryb_of(s: &str) -> MapStarcieTryb {
    match s {
        "oblezenie" => MapStarcieTryb::Oblezenie,
        "zdobycie_z_marszu" => MapStarcieTryb::ZdobycieZMarszu,
        "bitwa_polowa" => MapStarcieTryb::BitwaPolowa,
        other => panic!("nieznany tryb {other}"),
    }
}

/// Oczekiwany kontekst z wektora (web `ctxOut`) porownany z wynikiem Rust.
fn assert_ctx(got: Option<MapSiegeContext>, want: &Value, ctx: &str) {
    if want.is_null() {
        assert!(got.is_none(), "oczekiwano null {ctx}");
        return;
    }
    let g = got.unwrap_or_else(|| panic!("oczekiwano kontekstu {ctx}"));
    assert_eq!(
        g.tryb,
        tryb_of(want["tryb"].as_str().unwrap()),
        "tryb {ctx}"
    );
    assert_eq!(
        g.atakujacy_idx,
        int(&want["atakujacyIdx"]) as usize,
        "atakujacy {ctx}"
    );
    assert_eq!(
        g.garnizon_idx,
        opt_idx(&want["garnizonIdx"]),
        "garnizon {ctx}"
    );
    assert_eq!(
        g.oblegajacy_owner_id,
        int(&want["oblegajacyOwnerId"]),
        "oblegajacy {ctx}"
    );
}

#[test]
fn siege_gate_matches_web_vectors() {
    let doc: Value = serde_json::from_str(SIEGE).expect("siege.json");
    let pairs: HashSet<(i64, i64)> = doc["enemyPairs"]
        .as_array()
        .unwrap()
        .iter()
        .flat_map(|p| {
            let a = int(&p[0]);
            let b = int(&p[1]);
            [(a, b), (b, a)]
        })
        .collect();
    let are_enemies = |a: i64, b: i64| pairs.contains(&(a, b));
    let human = int(&doc["humanOwner"]);
    let barb = int(&doc["barbarianOwner"]);
    let is_human = |id: i64| id == human;
    let is_barb = |id: i64| id == barb;

    let cases = doc["cases"].as_array().unwrap();
    assert_eq!(cases.len(), 1500);
    for (i, row) in cases.iter().enumerate() {
        let city = city_of(&row["city"]);
        let units = units_of(&row["units"]);
        let besieger = int(&row["besieger"]);
        let ctx = format!("przypadek {i}: {row}");

        assert_eq!(
            siege_allowed_between(besieger, city.owner_id, are_enemies),
            row["allowed"].as_bool().unwrap(),
            "allowed {ctx}"
        );
        let adj: Vec<i64> = enemy_units_adjacent_to_city(&city, &units, are_enemies)
            .into_iter()
            .map(|x| x as i64)
            .collect();
        let want_adj: Vec<i64> = row["adjIdx"].as_array().unwrap().iter().map(int).collect();
        assert_eq!(adj, want_adj, "adjIdx {ctx}");
        assert_ctx(
            detect_war_auto_siege_on_city(&city, &units, are_enemies),
            &row["detect"],
            &ctx,
        );
        assert_eq!(
            is_siege_still_valid(&city, besieger, &units, are_enemies),
            row["stillValid"].as_bool().unwrap(),
            "stillValid {ctx}"
        );
        assert_ctx(
            auto_siege_candidate_for_scan(&city, &units, are_enemies, is_human, is_barb),
            &row["cand"],
            &ctx,
        );
    }

    for row in doc["aiAllow"].as_array().unwrap() {
        let got = ai_auto_siege_allowed(
            int(&row["cityOwner"]),
            int(&row["besieger"]),
            is_human,
            is_barb,
        );
        assert_eq!(got, row["out"].as_bool().unwrap(), "aiAllow {row}");
    }
}

#[test]
fn siege_anchor_boundary_n_minus_1_n_n_plus_1() {
    // Jednostka wroga w odleglosci N-1 (0 = na heksie miasta), N (1 = przy murze), N+1 (2 = dalej) od miasta.
    let city = SiegeCity {
        q: 5,
        r: 5,
        owner_id: 1,
        ma_mur: true,
        oblegane: false,
    };
    let are_enemies = |a: i64, b: i64| (a, b) == (2, 1) || (a, b) == (1, 2);
    assert_eq!(hex_distance(5, 5, 5, 5), 0);
    assert_eq!(hex_distance(6, 5, 5, 5), 1);
    assert_eq!(hex_distance(7, 5, 5, 5), 2);

    // N-1: wrog na heksie miasta -> nie jest kotwica (dystans 0 != 1).
    let at_city = [SiegeUnit {
        q: 5,
        r: 5,
        owner_id: 2,
    }];
    assert!(detect_war_auto_siege_on_city(&city, &at_city, are_enemies).is_none());
    // N: wrog przy murze -> kotwica, oblezenie.
    let adjacent = [SiegeUnit {
        q: 6,
        r: 5,
        owner_id: 2,
    }];
    let got = detect_war_auto_siege_on_city(&city, &adjacent, are_enemies).expect("kotwica");
    assert_eq!(got.tryb, MapStarcieTryb::Oblezenie);
    // N+1: wrog dwa heksy dalej -> brak kotwicy.
    let far = [SiegeUnit {
        q: 7,
        r: 5,
        owner_id: 2,
    }];
    assert!(detect_war_auto_siege_on_city(&city, &far, are_enemies).is_none());
    // Obca jednostka przy murze, ale NIE wroga (pokoj) -> brak oblezenia (sedno R-WEB-AI-SIEGE-WITHOUT-WAR-Q1).
    let peace = |_: i64, _: i64| false;
    assert!(detect_war_auto_siege_on_city(&city, &adjacent, peace).is_none());
    assert!(!siege_allowed_between(2, 1, peace));
}
