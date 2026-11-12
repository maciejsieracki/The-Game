//! P6 TOWER-TARGET-WIRING (R-RUSTPORT-P6-TOWER-TARGET-Q1): podpięcie `pick_tower_target` do produkcyjnej pętli
//! oblężenia ([`SiegeLoop`], zdarzenie `FireSiegeTowers` na początku tury).
//!
//! Pin: `07d2fbd72` `gra/src/battle/battleScene.ts` `_fireOneTower` (filtr wrogów `!dead && !fadingOut && !routed
//! && !removed`, potem `pickTowerTarget`, ok. `:4226-4234`) i `_beginTurn` (`:5643`, wywołanie przed snapshotem tury).
//! Wektory: `p6_tower_target_vectors/vectors.json` (generator `p6_tower_target_gen.mjs`, straznik SHA-256 w `meta`).
//! Test NIE implementuje strzału wieży (obrażenia to #96).

use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    tower_target_index, LoopBody, LoopTimer, SiegeEnv, SiegeLoop, TowerTargeting,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;
use std::collections::BTreeSet;

const VECTORS: &str = include_str!("p6_tower_target_vectors/vectors.json");

fn num_or_nan(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba lub \"NaN\""),
    }
}

fn unit(hp: f64, dead: bool) -> CombatUnit {
    CombatUnit {
        hp,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

/// Ciało bez skutków: czas trwania > 0, więc zakończenie zostaje w zegarze (nie wykonuje się w `start`).
struct NoopBody;

impl LoopBody for NoopBody {
    fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
        1000.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
}

/// Przypadki z wektorów pinu: wejście wieży i wrogów; `dead` z wektora przechodzi do `CombatUnit.dead`.
#[test]
fn tower_target_index_zgodny_z_pinem_na_wektorach() {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = doc["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "za malo przypadkow: {}", cases.len());

    let mut picks = 0usize;
    let mut nones = 0usize;
    let mut mismatches: Vec<String> = Vec::new();
    for c in cases {
        let enemies = c["enemies"].as_array().expect("enemies");
        let atk: Vec<CombatUnit> = enemies
            .iter()
            .map(|e| {
                unit(
                    num_or_nan(&e["hp"]),
                    e.get("dead").and_then(|d| d.as_bool()).unwrap_or(false),
                )
            })
            .collect();
        let t = TowerTargeting {
            tower_q: c["tower"]["q"].as_i64().expect("tower.q"),
            tower_r: c["tower"]["r"].as_i64().expect("tower.r"),
            range: num_or_nan(&c["range"]),
            atk_pos: enemies
                .iter()
                .map(|e| (e["q"].as_i64().expect("q"), e["r"].as_i64().expect("r")))
                .collect(),
        };
        let got = tower_target_index(&atk, &t).map_or(-1, |i| i as i64);
        let want = c["expect"].as_i64().expect("expect");
        if got == want {
            if want < 0 {
                nones += 1;
            } else {
                picks += 1;
            }
        } else {
            mismatches.push(format!("{}: rust={} pin={}", c["id"], got, want));
        }
    }
    assert!(mismatches.is_empty(), "rozbieznosci: {mismatches:?}");
    assert!(picks > 0, "brak trafien wyboru celu w wektorach");
    assert!(nones > 0, "brak przypadkow bez celu w wektorach");
}

/// Produkcyjna ścieżka: `SiegeLoop::start` (= `_beginTurn`) emituje `FireSiegeTowers` i zapisuje wynik wyboru.
/// Wróg 0 jest martwy i najbliżej wieży: filtr pinu musi go pominąć, wybór to indeks 1.
#[test]
fn siege_loop_begin_turn_zapisuje_wybor_celu_wiezy() {
    let mut atk = vec![unit(5.0, false), unit(2.0, false), unit(9.0, false)];
    atk[0].dead = true;
    let t = TowerTargeting {
        tower_q: 3,
        tower_r: 1,
        range: 4.0,
        atk_pos: vec![(3, 2), (3, 3), (6, 6)],
    };
    // Wróg 1 (odl. 2) wygrywa; wróg 2 (odl. 6) poza zasięgiem 4.
    assert_eq!(tower_target_index(&atk, &t), Some(1));

    let st = TurnSeqState {
        atk: atk
            .iter()
            .enumerate()
            .map(|(i, u)| SeqUnit {
                id: i as u64,
                c: *u,
            })
            .collect(),
        def: vec![SeqUnit {
            id: 100,
            c: unit(10.0, false),
        }],
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: 3,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let env = SiegeEnv {
        body: NoopBody,
        tower: None,
        wall_ever_breached: false,
        no_breach_cap: 1_000,
        move_points: [vec![0.0; 3], vec![0.0]],
        morale_max: [vec![100.0; 3], vec![100.0]],
    };
    let mut sl = SiegeLoop::new(st, env);
    sl.tower_targeting = Some(t);
    let mut clock = VirtualClock::<LoopTimer>::new();
    sl.start(&mut clock);

    assert!(
        sl.trace.iter().any(|s| s.starts_with("turn:")),
        "brak zdarzenia początku tury: {:?}",
        sl.trace
    );
    assert_eq!(sl.tower_log, vec![Some(1)], "wynik wyboru celu w pętli");
}
