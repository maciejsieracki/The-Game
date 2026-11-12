//! P6 SIEGE-TAKTYKA K4 (#217): testy zgodnosci `domain::siege_tactics_breach` z kodem weba.
//!
//! Wektory: `p6_siege_tactics_breach_vectors/vectors.json`, generowane przez `p6_siege_tactics_breach_gen.mjs` (Node 22)
//! z wycietych fragmentow `gra/src/battle/battleScene.ts` (pin 07d2fbd72; straznik SHA-256 w generatorze).
//! Test kompozycji: stan po sekwencji zdarzen zasila `siege_approach_restricted`, `siege_no_breach_repels_attack`
//! i `battle_winner` (wektory z pinu, sekcja `sequences`).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::siege_tactics_approach::{siege_approach_restricted, ApproachUnit};
use civ_engine::domain::siege_tactics_breach::{
    attack_gate, attack_wall_tile, breach_gate, breach_wall_tile, skip_instant_fallback,
    tower_climb_enter_wall, wall_attack_allowed, WallState,
};
use civ_engine::domain::siege_tactics_end::{
    battle_winner, siege_no_breach_repels_attack, BattleSide,
};

const VECTORS: &str = include_str!("p6_siege_tactics_breach_vectors/vectors.json");

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: JSON nie ma NaN/Infinity, wiec sa zapisane jako tekst.
fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nieznana liczba w wektorze: {other}"),
        };
    }
    v.as_f64().expect("liczba")
}

/// Rownosc jak w wektorach: NaN == NaN (wartosci z webu sa porownywane po tekstowym kodowaniu).
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn hp_map(v: &serde_json::Value) -> BTreeMap<i32, f64> {
    v.as_object()
        .expect("wallTileHp jako obiekt")
        .iter()
        .map(|(k, hp)| (k.parse::<i32>().expect("klucz rzedu"), num(hp)))
        .collect()
}

fn state_from(v: &serde_json::Value) -> WallState {
    let towers: BTreeSet<i32> = v["towerRows"]
        .as_array()
        .expect("towerRows")
        .iter()
        .map(|x| x.as_i64().expect("rzad wiezy") as i32)
        .collect();
    WallState {
        wall_col: v["wallCol"].as_i64().expect("wallCol") as i32,
        gate_col: v["gateCol"].as_i64().expect("gateCol") as i32,
        gate_hp: num(&v["gateHp"]),
        gate_open: v["gateOpen"].as_bool().expect("gateOpen"),
        wall_tile_hp: hp_map(&v["wallTileHp"]),
        wall_tiles_init: v["wallTilesInit"].as_u64().expect("wallTilesInit") as usize,
        tower_at_wall_rows: towers,
        wall_ever_breached: v["wallEverBreached"].as_bool().expect("wallEverBreached"),
    }
}

fn assert_state(got: &WallState, expect: &serde_json::Value, ctx: &str) {
    assert!(
        same(got.gate_hp, num(&expect["gateHp"])),
        "{ctx}: gateHp {} != {:?}",
        got.gate_hp,
        expect["gateHp"]
    );
    assert_eq!(
        got.gate_open,
        expect["gateOpen"].as_bool().unwrap(),
        "{ctx}: gateOpen"
    );
    assert_eq!(
        got.wall_ever_breached,
        expect["wallEverBreached"].as_bool().unwrap(),
        "{ctx}: wallEverBreached"
    );
    let want = hp_map(&expect["wallTileHp"]);
    assert_eq!(
        got.wall_tile_hp.keys().collect::<Vec<_>>(),
        want.keys().collect::<Vec<_>>(),
        "{ctx}: klucze wallTileHp"
    );
    for (k, hp) in &want {
        assert!(
            same(got.wall_tile_hp[k], *hp),
            "{ctx}: wallTileHp[{k}] {} != {hp}",
            got.wall_tile_hp[k]
        );
    }
}

#[test]
fn wektory_attack_wall_tile_zgodne_z_webem() {
    let v = load();
    let cases = v["attackWallTile"].as_array().expect("attackWallTile");
    assert!(cases.len() >= 150, "przypadki: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let s = state_from(&c["input"]);
        let got = attack_wall_tile(
            &s,
            c["row"].as_i64().unwrap() as i32,
            num(&c["dmg"]),
            c["terrainTilesPresent"].as_bool().unwrap(),
        );
        assert_state(&got, &c["expect"], &format!("attackWallTile #{i}"));
    }
}

#[test]
fn wektory_breach_wall_tile_zgodne_z_webem() {
    let v = load();
    let cases = v["breachWallTile"].as_array().expect("breachWallTile");
    assert!(cases.len() >= 100, "przypadki: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let s = state_from(&c["input"]);
        let got = breach_wall_tile(
            &s,
            c["row"].as_i64().unwrap() as i32,
            c["terrainTilesPresent"].as_bool().unwrap(),
        );
        assert_state(&got, &c["expect"], &format!("breachWallTile #{i}"));
    }
}

#[test]
fn wektory_attack_gate_zgodne_z_webem() {
    let v = load();
    let cases = v["attackGate"].as_array().expect("attackGate");
    assert!(cases.len() >= 150, "przypadki: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let s = state_from(&c["input"]);
        let got = attack_gate(&s, num(&c["dmg"]));
        assert_state(&got, &c["expect"], &format!("attackGate #{i}"));
    }
}

#[test]
fn wektory_tower_climb_zgodne_z_webem() {
    let v = load();
    let cases = v["towerClimbEnterWall"]
        .as_array()
        .expect("towerClimbEnterWall");
    assert!(cases.len() >= 60, "przypadki: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let s = state_from(&c["input"]);
        let got = tower_climb_enter_wall(&s, c["sideAtk"].as_bool().unwrap());
        assert_state(&got, &c["expect"], &format!("towerClimb #{i}"));
    }
}

#[test]
fn wektory_skip_zgodne_z_webem() {
    let v = load();
    let cases = v["skipInstantFallback"]
        .as_array()
        .expect("skipInstantFallback");
    assert!(cases.len() >= 60, "przypadki: {}", cases.len());
    for (i, c) in cases.iter().enumerate() {
        let s = state_from(&c["input"]);
        let got = skip_instant_fallback(&s, c["atkHasAliveSiegeUnit"].as_bool().unwrap());
        assert_state(&got, &c["expect"], &format!("skip #{i}"));
    }
}

fn mounted_unit(atk: bool) -> ApproachUnit {
    ApproachUnit {
        side_atk: atk,
        routed: false,
        on_wall_walkway: false,
        is_siege_unit: false,
        primary_ranged: false,
        can_shoot: false,
        shooting_disabled: false,
        mounted: true,
    }
}

#[test]
fn wektory_sekwencje_kompozycja_zgodna_z_webem() {
    let v = load();
    let seqs = v["sequences"].as_array().expect("sequences");
    assert!(seqs.len() >= 80, "sekwencje: {}", seqs.len());
    let mut total_steps = 0usize;
    for (si, seq) in seqs.iter().enumerate() {
        let mut s = state_from(&seq["init"]);
        for (ki, step) in seq["steps"].as_array().unwrap().iter().enumerate() {
            let kind = step["kind"].as_str().unwrap();
            s = match kind {
                "attackWall" => attack_wall_tile(
                    &s,
                    step["row"].as_i64().unwrap() as i32,
                    num(&step["dmg"]),
                    step["terrainTilesPresent"].as_bool().unwrap(),
                ),
                "breachWall" => breach_wall_tile(
                    &s,
                    step["row"].as_i64().unwrap() as i32,
                    step["terrainTilesPresent"].as_bool().unwrap(),
                ),
                "attackGate" => attack_gate(&s, num(&step["dmg"])),
                "climb" => tower_climb_enter_wall(&s, step["sideAtk"].as_bool().unwrap()),
                "skip" => {
                    skip_instant_fallback(&s, step["atkHasAliveSiegeUnit"].as_bool().unwrap())
                }
                other => panic!("nieznany krok {other}"),
            };
            let e = &step["expect"];
            let ctx = format!("seq #{si} krok #{ki} ({kind})");
            assert_eq!(
                s.wall_ever_breached,
                e["wallEverBreached"].as_bool().unwrap(),
                "{ctx}: flaga"
            );
            assert_eq!(
                s.gate_open,
                e["gateOpen"].as_bool().unwrap(),
                "{ctx}: gateOpen"
            );
            assert_eq!(
                s.tile_breached(),
                e["tileBreached"].as_bool().unwrap(),
                "{ctx}: tileBreached"
            );
            let rows: Vec<i64> = s.wall_tile_hp.keys().map(|k| *k as i64).collect();
            let want_rows: Vec<i64> = e["wallTileRows"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_i64().unwrap())
                .collect();
            assert_eq!(rows, want_rows, "{ctx}: wiersze kafli");

            // Kompozycja: stan automatu zasila predykaty podejscia (galezie d, e) z tym samym wejsciem muru.
            let approach = s.to_approach_state();
            let ped = ApproachUnit {
                mounted: false,
                ..mounted_unit(true)
            };
            assert_eq!(
                siege_approach_restricted(&mounted_unit(true), &approach),
                e["approachMounted"].as_bool().unwrap(),
                "{ctx}: approach mounted"
            );
            assert_eq!(
                siege_approach_restricted(&ped, &approach),
                e["approachFoot"].as_bool().unwrap(),
                "{ctx}: approach piechota"
            );

            // Kompozycja: repels -> rozstrzygniecie bitwy (obie strony zyja bez repels).
            let repels = siege_no_breach_repels_attack(true, s.wall_ever_breached);
            assert_eq!(repels, e["repels"].as_bool().unwrap(), "{ctx}: repels");
            let winner = battle_winner(!repels, true, &[10.0], &[10.0]);
            let want_winner = match e["winnerIfStalled"].as_str() {
                None => None,
                Some("obronca") => Some(BattleSide::Defender),
                Some(other) => panic!("nieznany zwyciezca {other}"),
            };
            assert_eq!(winner, want_winner, "{ctx}: zwyciezca");
            total_steps += 1;
        }
    }
    assert!(total_steps >= 500, "kroki sekwencji: {total_steps}");
}

#[test]
fn mur_bez_terenu_nie_ustawia_wylomu() {
    // Web `_breachWallTile`: `if (!tiles) return;` przed flaga.
    let s = WallState {
        wall_col: 3,
        gate_col: -1,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::from([(1, 0.0)]),
        wall_tiles_init: 1,
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    };
    let out = breach_wall_tile(&s, 1, false);
    assert!(!out.wall_ever_breached);
    assert_eq!(out, s);
}

#[test]
fn brak_kafla_liczy_sie_jak_hp_zero() {
    // Web `wallTileHp.get(row) ?? 0`: trafienie w brakujacy kafel wola `_breachWallTile` (flaga ustawiona).
    let s = WallState {
        wall_col: 3,
        gate_col: -1,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::new(),
        wall_tiles_init: 0,
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    };
    let out = attack_wall_tile(&s, 2, 5.0, true);
    assert!(out.wall_ever_breached);
    assert!(!out.wall_tile_hp.contains_key(&2));
}

#[test]
fn nan_w_dmg_nie_ustawia_wylomu() {
    // JS: Math.max(0, NaN) = NaN; NaN <= 0 jest fałszywe -> brak wylomu, a kafel zapisany jako NaN.
    let s = WallState {
        wall_col: 3,
        gate_col: 4,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::from([(0, 90.0)]),
        wall_tiles_init: 1,
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    };
    let out = attack_wall_tile(&s, 0, f64::NAN, true);
    assert!(!out.wall_ever_breached);
    assert!(out.wall_tile_hp[&0].is_nan());
    let g = attack_gate(&s, f64::NAN);
    assert!(!g.gate_open && g.gate_hp.is_nan());
}

#[test]
fn bramka_zamknieta_i_brak_bramy_nie_atakowane() {
    let mut s = WallState {
        wall_col: 3,
        gate_col: -1,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::new(),
        wall_tiles_init: 0,
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    };
    assert_eq!(
        attack_gate(&s, 1000.0),
        s,
        "brak bramy: guard siegeGateCol < 0"
    );
    s.gate_col = 4;
    s.gate_open = true;
    s.gate_hp = 0.0;
    assert_eq!(attack_gate(&s, 1000.0), s, "brama otwarta: guard gateOpen");
    assert!(breach_gate(&s).wall_ever_breached);
    assert!(wall_attack_allowed(&WallState {
        wall_col: 0,
        ..s.clone()
    }));
    assert!(!wall_attack_allowed(&WallState { wall_col: -1, ..s }));
}

#[test]
fn wejscie_na_mur_po_wiezy_tylko_dla_atakujacego() {
    let s = WallState {
        wall_col: 3,
        gate_col: -1,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::new(),
        wall_tiles_init: 0,
        tower_at_wall_rows: BTreeSet::from([2]),
        wall_ever_breached: false,
    };
    assert!(!tower_climb_enter_wall(&s, false).wall_ever_breached);
    assert!(tower_climb_enter_wall(&s, true).wall_ever_breached);
}

#[test]
fn pomin_z_machina_ustawia_wylom_tylko_gdy_jest_mur() {
    let s = WallState {
        wall_col: -1,
        gate_col: -1,
        gate_hp: 400.0,
        gate_open: false,
        wall_tile_hp: BTreeMap::new(),
        wall_tiles_init: 0,
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    };
    assert!(!skip_instant_fallback(&s, true).wall_ever_breached);
    let with_wall = WallState { wall_col: 3, ..s };
    assert!(skip_instant_fallback(&with_wall, true).wall_ever_breached);
    assert!(!skip_instant_fallback(&with_wall, false).wall_ever_breached);
}
