//! P6 SIEGE-TAKTYKA K1 (#217, runda 1 Operatora): testy zgodnosci `_siegeMoveRefused` (wiersz 29) i czesci
//! decyzyjnej `_siegeSafeApproach` (wiersz 30) z kodem weba.
//!
//! Wektory: sekcje `moveRefused` i `safeApproachGoal` w `p6_siege_tactics_approach_vectors/vectors.json`, generowane
//! przez `p6_siege_tactics_approach_gen.mjs` (Node, seed 217) z wycietych fragmentow `gra/src/battle/battleScene.ts`
//! (pin 07d2fbd72): `_siegeMoveRefused` 7962-7970, `_siegeSafeApproach` 8107-8136 (straznik SHA-256 w generatorze).

use civ_engine::domain::siege_tactics_approach::{
    siege_move_refused, siege_safe_approach_goal, ApproachUnit, ApproachWallState, Threat, BF_COLS,
    BF_ROWS, SAFE_APPROACH_MAX_VISITED,
};
use std::collections::{BTreeMap, HashSet};

const VECTORS: &str = include_str!("p6_siege_tactics_approach_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn b(v: &serde_json::Value) -> bool {
    v.as_bool().expect("bool")
}

/// Liczba z wektora; generator koduje NaN / +-Infinity napisami (JSON ich nie zna).
fn numf(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznany napis liczbowy: {other}"),
        },
        other => other.as_f64().expect("liczba"),
    }
}

fn threats_of(v: &serde_json::Value) -> Vec<Threat> {
    v.as_array()
        .expect("lista zagrozen")
        .iter()
        .map(|t| Threat {
            q: numf(&t["q"]),
            r: numf(&t["r"]),
            range: numf(&t["range"]),
        })
        .collect()
}

fn unit_of(ru_v: &serde_json::Value) -> ApproachUnit {
    ApproachUnit {
        side_atk: ru_v["side"].as_str().expect("side") == "atk",
        routed: b(&ru_v["routed"]),
        on_wall_walkway: b(&ru_v["onWallWalkway"]),
        is_siege_unit: b(&ru_v["isSiegeUnit"]),
        primary_ranged: b(&ru_v["primaryRanged"]),
        can_shoot: b(&ru_v["canShoot"]),
        // undefined w JSON nie jest wylaczeniem; tylko jawne false.
        shooting_disabled: ru_v["shootingEnabled"].as_bool() == Some(false),
        mounted: b(&ru_v["mounted"]),
    }
}

fn wall_of(s_v: &serde_json::Value) -> ApproachWallState {
    ApproachWallState {
        wall_col_ge0: numf(&s_v["wallCol"]) >= 0.0,
        gate_open: b(&s_v["gateOpen"]),
        wall_ever_breached: b(&s_v["wallEverBreached"]),
        wall_tiles_init: s_v["siegeWallTilesInit"].as_u64().expect("init") as usize,
        wall_tiles_alive: s_v["wallTileHpSize"].as_u64().expect("alive") as usize,
        tower_at_wall_rows_count: s_v["towerAtWallRowsCount"].as_u64().expect("towers") as usize,
    }
}

fn infantry() -> ApproachUnit {
    ApproachUnit {
        side_atk: true,
        routed: false,
        on_wall_walkway: false,
        is_siege_unit: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        mounted: false,
    }
}

fn wall_open() -> ApproachWallState {
    ApproachWallState {
        wall_col_ge0: true,
        gate_open: false,
        wall_ever_breached: false,
        wall_tiles_init: 0,
        wall_tiles_alive: 0,
        tower_at_wall_rows_count: 0,
    }
}

#[test]
fn wektory_move_refused_zgodne_z_webem() {
    let v = load();
    let cases = v["moveRefused"].as_array().expect("moveRefused");
    assert!(cases.len() >= 500, "wektory: {}", cases.len());
    let mut gates: BTreeMap<String, usize> = BTreeMap::new();
    let mut special = 0;
    for (i, c) in cases.iter().enumerate() {
        let ru = unit_of(&c["ru"]);
        let wall = wall_of(&c["wall"]);
        let threats = threats_of(&c["threats"]);
        let from = (numf(&c["from"]["c"]), numf(&c["from"]["r"]));
        let to = (numf(&c["to"]["c"]), numf(&c["to"]["r"]));
        if c.get("special").is_some() {
            special += 1;
        }
        let got = siege_move_refused(&ru, &wall, &threats, from, to);
        assert_eq!(got, b(&c["expect"]), "przypadek {i} brama {}", c["gate"]);
        let gate = c["gate"].as_str().expect("gate").to_string();
        *gates.entry(gate).or_default() += 1;
    }
    // Pokrycie wszystkich bram funkcji, w tym odmowy i dopuszczenia.
    for g in [
        "unrestricted",
        "no-threats",
        "safe-to",
        "refused",
        "allowed",
    ] {
        assert!(
            gates.get(g).copied().unwrap_or(0) > 0,
            "brak pokrycia bramy {g}: {gates:?}"
        );
    }
    assert!(special >= 100, "przypadki NaN/Infinity: {special}");
}

#[test]
fn move_refused_odmowa_gdy_krok_zbliza_do_zagrozenia() {
    let ru = infantry();
    let wall = wall_open();
    // Zagrozenie (0,0) zasieg 1: slack(c,r) = |c|+|r|-1.
    let th = [Threat {
        q: 0.0,
        r: 0.0,
        range: 1.0,
    }];
    // Z (5,0) slack 4 do (1,0) slack 0: krok zmniejsza zagrozenie -> odmowa.
    assert!(siege_move_refused(&ru, &wall, &th, (5.0, 0.0), (1.0, 0.0)));
    // Z (0,0) slack -1 do (1,0) slack 0: krok oddala od zagrozenia -> dopuszczone.
    assert!(!siege_move_refused(&ru, &wall, &th, (0.0, 0.0), (1.0, 0.0)));
    // Cel bezpieczny (slack > 0): zawsze dopuszczone.
    assert!(!siege_move_refused(&ru, &wall, &th, (5.0, 0.0), (9.0, 0.0)));
    // Brak zagrozen: dopuszczone.
    assert!(!siege_move_refused(&ru, &wall, &[], (5.0, 0.0), (1.0, 0.0)));
    // Strzelec z amunicja spoza blokady podejscia: dopuszczone niezaleznie od zagrozen.
    let shooter = ApproachUnit {
        primary_ranged: true,
        can_shoot: true,
        ..ru
    };
    assert!(!siege_move_refused(
        &shooter,
        &wall,
        &th,
        (5.0, 0.0),
        (1.0, 0.0)
    ));
}

/// NaN / Infinity w wejsciach: porownania na NaN sa fałszywe (jak w JS), nieskonczonosci propaguja sie jak w `Math.min`.
#[test]
fn move_refused_nan_i_infinity_jak_w_webie() {
    let ru = infantry();
    let wall = wall_open();
    // NaN w pozycji startowej: slack(from)=NaN, `slack(to) < NaN` fałszywe -> dopuszczone.
    let th = [Threat {
        q: 0.0,
        r: 0.0,
        range: 0.0,
    }];
    assert!(!siege_move_refused(
        &ru,
        &wall,
        &th,
        (f64::NAN, 0.0),
        (0.0, 0.0)
    ));
    // NaN zasiegu: slack(to)=NaN, `NaN > 0` i `NaN < x` fałszywe -> dopuszczone.
    let th_nan = [Threat {
        q: 0.0,
        r: 0.0,
        range: f64::NAN,
    }];
    assert!(!siege_move_refused(
        &ru,
        &wall,
        &th_nan,
        (5.0, 0.0),
        (0.0, 0.0)
    ));
    // Nieskonczony zasieg: slack = -Infinity -> `-Inf < -Inf` fałszywe -> dopuszczone.
    let th_inf = [Threat {
        q: 0.0,
        r: 0.0,
        range: f64::INFINITY,
    }];
    assert!(!siege_move_refused(
        &ru,
        &wall,
        &th_inf,
        (5.0, 0.0),
        (1.0, 0.0)
    ));
    // Nieskonczona wspolrzedna celu: slack(to)=+Infinity > 0 -> dopuszczone.
    assert!(!siege_move_refused(
        &ru,
        &wall,
        &th,
        (5.0, 0.0),
        (f64::INFINITY, 0.0)
    ));
}

#[test]
fn wektory_safe_approach_goal_zgodne_z_webem() {
    let v = load();
    let cases = v["safeApproachGoal"].as_array().expect("safeApproachGoal");
    assert!(cases.len() >= 600, "wektory: {}", cases.len());
    let (mut found, mut not_found, mut start_safe, mut start_unsafe) =
        (0usize, 0usize, 0usize, 0usize);
    let (mut with_blocks, mut special) = (0usize, 0usize);
    for (i, c) in cases.iter().enumerate() {
        let start = (
            c["start"]["q"].as_i64().expect("q"),
            c["start"]["r"].as_i64().expect("r"),
        );
        let target = (numf(&c["target"]["c"]), numf(&c["target"]["r"]));
        let threats = threats_of(&c["threats"]);
        let blocked: HashSet<(i64, i64)> = c["blocked"]
            .as_array()
            .expect("blocked")
            .iter()
            .map(|k| {
                let s = k.as_str().expect("klucz c,r");
                let (cc, rr) = s.split_once(',').expect("przecinek");
                (cc.parse().expect("c"), rr.parse().expect("r"))
            })
            .collect();
        if !blocked.is_empty() {
            with_blocks += 1;
        }
        if c.get("special").is_some() {
            special += 1;
        }
        let got = siege_safe_approach_goal(start, target, &threats, |col, row| {
            !blocked.contains(&(col, row))
        });
        let expect: Option<(i64, i64)> = match &c["expect"] {
            serde_json::Value::Null => None,
            arr => Some((arr[0].as_i64().expect("c"), arr[1].as_i64().expect("r"))),
        };
        assert_eq!(got, expect, "przypadek {i}");
        if expect.is_some() {
            found += 1;
        } else {
            not_found += 1;
        }
        if c["startSafe"].as_bool() == Some(true) {
            start_safe += 1;
        } else {
            start_unsafe += 1;
        }
    }
    assert!(
        found > 0 && not_found > 0,
        "pokrycie wyniku: found={found} brak={not_found}"
    );
    assert!(
        start_safe > 0 && start_unsafe > 0,
        "pokrycie startu: {start_safe}/{start_unsafe}"
    );
    assert!(
        with_blocks > 0 && special >= 6,
        "bloki={with_blocks} specjalne={special}"
    );
}

#[test]
fn safe_approach_brzegi_siatki_i_stale() {
    assert_eq!(BF_COLS, 68);
    assert_eq!(BF_ROWS, 156);
    assert_eq!(SAFE_APPROACH_MAX_VISITED, 6000);
    // Start w rogu, cel na zewnatrz siatki w kierunku ujemnym: zaden sasiad nie jest blizej -> brak kandydata.
    assert_eq!(
        siege_safe_approach_goal((0, 0), (-5.0, -5.0), &[], |_, _| true),
        None
    );
    // Cel daleko na prawo: najblizszy kafel to ostatnia kolumna (BF_COLS - 1) w tym samym rzedzie.
    assert_eq!(
        siege_safe_approach_goal((60, 10), (100.0, 10.0), &[], |_, _| true),
        Some((BF_COLS - 1, 10))
    );
}

#[test]
fn safe_approach_nan_i_infinity_jak_w_webie() {
    // NaN celu: dystans NaN nigdy nie jest `< bestD` -> brak kandydata.
    assert_eq!(
        siege_safe_approach_goal((5, 5), (f64::NAN, 5.0), &[], |_, _| true),
        None
    );
    // Nieskonczony cel: bestD=Infinity, `Infinity < Infinity` fałszywe -> brak kandydata.
    assert_eq!(
        siege_safe_approach_goal((5, 5), (f64::INFINITY, 5.0), &[], |_, _| true),
        None
    );
    // NaN zasiegu zagrozenia: zadne kafle nie sa bezpieczne (NaN > 0 fałszywe) -> brak kandydata.
    let th = [Threat {
        q: 0.0,
        r: 0.0,
        range: f64::NAN,
    }];
    assert_eq!(
        siege_safe_approach_goal((5, 5), (6.0, 5.0), &th, |_, _| true),
        None
    );
}
