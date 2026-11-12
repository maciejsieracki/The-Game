//! P6 SIEGE-TAKTYKA K0b (#217): testy zgodnosci `domain::siege_tactics_approach` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_approach_vectors/vectors.json`, generowane przez `p6_siege_tactics_approach_gen.mjs`
//! (Node 22) z wycietych fragmentow `gra/src/battle/battleScene.ts` (pin 07d2fbd72): `_siegeShooterThreats`
//! 7924-7937, `_threatSlack` 7939-7943, `_siegeApproachRestricted` 7951-7960.

use civ_engine::domain::siege_tactics_approach::{
    siege_approach_restricted, siege_shooter_threats, threat_slack, ApproachUnit,
    ApproachWallState, ShooterDefender, SiegeTowerRef, Threat,
};

const VECTORS: &str = include_str!("p6_siege_tactics_approach_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn f(v: &serde_json::Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn b(v: &serde_json::Value) -> bool {
    v.as_bool().expect("bool")
}

fn threats_of(v: &serde_json::Value) -> Vec<Threat> {
    v.as_array()
        .expect("lista zagrozen")
        .iter()
        .map(|t| Threat {
            q: f(&t["q"]),
            r: f(&t["r"]),
            range: f(&t["range"]),
        })
        .collect()
}

#[test]
fn wektory_threat_slack_zgodne_z_webem() {
    let v = load();
    let cases = v["threatSlack"].as_array().expect("threatSlack");
    assert!(cases.len() >= 40, "wektory: {}", cases.len());
    let mut empty = 0;
    let mut multi = 0;
    for (i, c) in cases.iter().enumerate() {
        let threats = threats_of(&c["threats"]);
        if threats.is_empty() {
            empty += 1;
        }
        if threats.len() > 1 {
            multi += 1;
        }
        let got = threat_slack(&threats, f(&c["col"]), f(&c["row"]));
        // JSON nie koduje +Infinity; generator zapisuje ja jako napis "Infinity".
        let expect = match &c["expect"] {
            serde_json::Value::String(s) if s == "Infinity" => f64::INFINITY,
            other => f(other),
        };
        assert_eq!(got, expect, "przypadek {i}");
    }
    assert!(
        empty >= 2 && multi >= 40,
        "pokrycie galezi: pusta={empty} wiele={multi}"
    );
}

#[test]
fn threat_slack_pusta_lista_to_infinity() {
    assert_eq!(threat_slack(&[], 3.0, -1.0), f64::INFINITY);
}

/// Zarzut 4 obrony: NaN w danych wchodzi do `Math.min` i propaguje sie (node 22: `Math.min(Infinity, NaN)` = NaN,
/// `Math.min(0, NaN)` = NaN, `Math.min(0, Infinity)` = 0). Wartosci oczekiwane wyprowadzone z tego zachowania JS.
#[test]
fn threat_slack_nan_propaguje_jak_math_min() {
    let t = |q: f64, r: f64, range: f64| Threat { q, r, range };
    // NaN w kolumnie wywolania -> wynik NaN.
    assert!(threat_slack(&[t(1.0, 1.0, 1.0)], f64::NAN, 0.0).is_nan());
    // NaN w zasiegu -> wynik NaN.
    assert!(threat_slack(&[t(1.0, 1.0, f64::NAN)], 0.0, 0.0).is_nan());
    // NaN w pozycji zagrozenia -> wynik NaN.
    assert!(threat_slack(&[t(f64::NAN, 0.0, 0.0)], 0.0, 0.0).is_nan());
    // NaN na dowolnej pozycji listy psuje cala wartosc (kolejne Math.min nie leczą NaN).
    assert!(threat_slack(&[t(0.0, 0.0, 0.0), t(1.0, 1.0, f64::NAN)], 0.0, 0.0).is_nan());
    // Kontrola: bez NaN minimum z listy; -Infinity zasiegu daje +Infinity, wiec wygrywa 0.
    assert_eq!(
        threat_slack(
            &[t(0.0, 0.0, 0.0), t(1.0, 1.0, f64::NEG_INFINITY)],
            0.0,
            0.0
        ),
        0.0
    );
}

#[test]
fn wektory_shooter_threats_zgodne_z_webem() {
    let v = load();
    let cases = v["shooterThreats"].as_array().expect("shooterThreats");
    assert!(cases.len() >= 200, "wektory: {}", cases.len());
    let mut nonempty = 0;
    for (i, c) in cases.iter().enumerate() {
        let defenders: Vec<(ShooterDefender, f64)> = c["defenders"]
            .as_array()
            .expect("obroncy")
            .iter()
            .map(|d| {
                (
                    ShooterDefender {
                        q: f(&d["q"]),
                        r: f(&d["r"]),
                        dead: b(&d["dead"]),
                        fading_out: b(&d["fadingOut"]),
                        removed: b(&d["removed"]),
                        routed: b(&d["routed"]),
                        can_shoot: b(&d["canShoot"]),
                        range_base: f(&d["rangeBase"]),
                    },
                    f(&d["terrainAfter"]),
                )
            })
            .collect();
        let towers: Vec<SiegeTowerRef> = c["towers"]
            .as_array()
            .expect("wieze")
            .iter()
            .map(|t| SiegeTowerRef {
                destroyed: b(&t["destroyed"]),
                row: f(&t["row"]),
            })
            .collect();
        // Zasieg po _applyTerrainRange: wejscie jawne, indeksowane po obronca (wskaznik pozycji w liscie).
        let terrain: Vec<f64> = defenders.iter().map(|(_, t)| *t).collect();
        let plain: Vec<ShooterDefender> = defenders.iter().map(|(d, _)| *d).collect();
        let got = siege_shooter_threats(
            &plain,
            &towers,
            f(&c["siegeWallCol"]),
            f(&c["towerRange"]),
            |d| {
                let idx = plain
                    .iter()
                    .position(|x| std::ptr::eq(x, d))
                    .expect("obronca z listy");
                terrain[idx]
            },
        );
        let expect = threats_of(&c["expect"]);
        assert_eq!(got, expect, "przypadek {i}");
        if !got.is_empty() {
            nonempty += 1;
        }
    }
    assert!(nonempty >= 50, "niepuste wyniki: {nonempty}");
}

#[test]
fn wektory_approach_restricted_zgodne_z_webem() {
    let v = load();
    let cases = v["approach"].as_array().expect("approach");
    assert!(cases.len() >= 2000, "wektory: {}", cases.len());
    let mut branches = [0usize; 5];
    for (i, c) in cases.iter().enumerate() {
        let ru_v = &c["ru"];
        let s_v = &c["wall"];
        let shooting_enabled = &ru_v["shootingEnabled"];
        let ru = ApproachUnit {
            side_atk: ru_v["side"].as_str().expect("side") == "atk",
            routed: b(&ru_v["routed"]),
            on_wall_walkway: b(&ru_v["onWallWalkway"]),
            is_siege_unit: b(&ru_v["isSiegeUnit"]),
            primary_ranged: b(&ru_v["primaryRanged"]),
            can_shoot: b(&ru_v["canShoot"]),
            // undefined w JSON (brak klucza) i true nie sa wylaczeniem; tylko jawne false.
            shooting_disabled: shooting_enabled.as_bool() == Some(false),
            mounted: b(&ru_v["mounted"]),
        };
        let wall = ApproachWallState {
            wall_col_ge0: f(&s_v["wallCol"]) >= 0.0,
            gate_open: b(&s_v["gateOpen"]),
            wall_ever_breached: b(&s_v["wallEverBreached"]),
            wall_tiles_init: s_v["siegeWallTilesInit"].as_u64().expect("init") as usize,
            wall_tiles_alive: s_v["wallTileHpSize"].as_u64().expect("alive") as usize,
            tower_at_wall_rows_count: s_v["towerAtWallRowsCount"].as_u64().expect("towers")
                as usize,
        };
        let idx = match c["branch"].as_str().expect("branch") {
            "a" => 0,
            "b" => 1,
            "c" => 2,
            "d" => 3,
            _ => 4,
        };
        branches[idx] += 1;
        assert_eq!(
            siege_approach_restricted(&ru, &wall),
            b(&c["expect"]),
            "przypadek {i} galaz {}",
            c["branch"]
        );
    }
    assert!(
        branches.iter().all(|&n| n > 0),
        "pokrycie galezi (a)-(e): {branches:?}"
    );
}
