//! R-RUSTPORT-P6-WIEZE-2B1-Q1: planowanie wystrzałów wież (`_fireSiegeTowers`, pin 07d2fbd72 `battleScene.ts:4208-4219`).

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    LoopBody, LoopTimer, PlannedTowerShot, SiegeEnv, SiegeLoop,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

struct CellBody {
    atk_cells: Vec<Option<(i64, i64)>>,
}

impl LoopBody for CellBody {
    fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
        0.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        match unit.side {
            BattleSide::Attacker => self.atk_cells.get(unit.idx).copied().flatten(),
            BattleSide::Defender => None,
        }
    }
}

fn cu(hp: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

fn state(atk: &[f64]) -> TurnSeqState {
    TurnSeqState {
        atk: atk
            .iter()
            .enumerate()
            .map(|(i, &hp)| SeqUnit {
                id: i as u64,
                c: cu(hp),
            })
            .collect(),
        def: Vec::new(),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: 5,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    }
}

fn env(
    cells: Vec<Option<(i64, i64)>>,
    tower_rows: Vec<i64>,
    wall_tile_rows: Vec<i64>,
) -> SiegeEnv<CellBody> {
    SiegeEnv {
        body: CellBody { atk_cells: cells },
        tower_rows,
        pending_tower_shots: Vec::new(),
        tower_range: 2.0,
        tower_shot: Some(civ_engine::domain::siege_tactics_loop::neutral_tower_shot_template()),
        wall_tile_rows,
        wall_ever_breached: false,
        no_breach_cap: 0,
        move_points: [Vec::new(), Vec::new()],
        morale_max: [Vec::new(), Vec::new()],
    }
}

fn planned(e: &SiegeEnv<CellBody>) -> Vec<(f64, usize)> {
    e.pending_tower_shots
        .iter()
        .map(|p: &PlannedTowerShot| (p.ms, p.tower))
        .collect()
}

#[test]
fn planning_does_not_set_dead_on_the_target() {
    // Wieża (5,3), zasięg 2, A0 (7,3) w zasięgu. Po planowaniu cel NIE może być jeszcze martwy (strzał w callbacku).
    let mut st = state(&[10.0]);
    let mut e = env(vec![Some((7, 3))], vec![3], vec![3]);
    e.fire_siege_towers(&mut st);
    assert!(
        !st.atk[0].c.dead,
        "placeholder dead ustawiony przy planowaniu"
    );
    assert_eq!(planned(&e), vec![(0.0, 0)], "jedna wieża: odroczenie 0 ms");
}

#[test]
fn three_towers_are_staggered_0_180_360() {
    // Trzy wieże na kafelkach muru, kolejność listy jak w pinie.
    let mut st = state(&[10.0]);
    let mut e = env(vec![Some((7, 3))], vec![3, 4, 5], vec![3, 4, 5]);
    e.fire_siege_towers(&mut st);
    assert_eq!(planned(&e), vec![(0.0, 0), (180.0, 1), (360.0, 2)]);
    assert!(!st.atk[0].c.dead);
}

#[test]
fn tower_without_wall_tile_is_skipped_and_does_not_advance_stagger() {
    // Wieża na wierszu 4 bez kafla muru (web `_destroyTowerAtRow`): nie planuje, więc wieża na 5 dostaje 180 ms, nie 360.
    let mut st = state(&[10.0]);
    let mut e = env(vec![Some((7, 3))], vec![3, 4, 5], vec![3, 5]);
    e.fire_siege_towers(&mut st);
    assert_eq!(planned(&e), vec![(0.0, 0), (180.0, 2)]);
}

#[test]
fn no_towers_means_no_planning() {
    let mut st = state(&[10.0]);
    let mut e = env(vec![Some((7, 3))], Vec::new(), Vec::new());
    e.fire_siege_towers(&mut st);
    assert!(e.pending_tower_shots.is_empty());
    assert!(!st.atk[0].c.dead);
}

#[test]
fn planning_flag_follows_auto_batch_planning() {
    let mut st = state(&[10.0]);
    st.auto_batch_planning = true;
    let mut e = env(vec![Some((7, 3))], vec![3], vec![3]);
    e.fire_siege_towers(&mut st);
    assert_eq!(
        e.pending_tower_shots,
        vec![PlannedTowerShot {
            ms: 0.0,
            tower: 0,
            planning: true
        }]
    );
}

#[test]
fn loop_schedules_tower_shots_on_clock_at_planned_delays() {
    // Pełna ścieżka: `begin_turn` -> `SeqEvent::FireSiegeTowers` -> zegar. Wystrzały są w kolejce z odroczeniami.
    // Obie strony żywe, inaczej `_checkEnd` kończy bitwę przed `_fireSiegeTowers`.
    let mut st = state(&[10.0, 4.0]);
    st.def = vec![SeqUnit {
        id: 100,
        c: cu(10.0),
    }];
    let mut e = env(
        vec![Some((7, 3)), Some((6, 4))],
        vec![3, 4, 5],
        vec![3, 4, 5],
    );
    // Limit rund bez wyłomu wyłączony (0 kończy bitwę remisem już na początku tury).
    e.no_breach_cap = 10;
    // Punkty ruchu i morale dla jednostek (używane przez `movement_points` i stan morale).
    e.move_points = [vec![3.0, 3.0], vec![3.0]];
    e.morale_max = [vec![100.0, 100.0], vec![100.0]];
    let mut sl = SiegeLoop::new(st, e);
    let mut clock = VirtualClock::<LoopTimer>::new();
    sl.start(&mut clock);
    let mut shots: Vec<(f64, usize)> = clock
        .timers
        .iter()
        .filter_map(|t| match t.payload {
            LoopTimer::TowerShot(i) => Some((t.due, i)),
            _ => None,
        })
        .collect();
    shots.sort_by(|a, b| a.0.total_cmp(&b.0));
    assert_eq!(shots, vec![(0.0, 0), (180.0, 1), (360.0, 2)]);
    assert!(
        sl.env.pending_tower_shots.is_empty(),
        "kolejka planowania opróżniona przez sterownik"
    );
    assert!(
        sl.st.atk.iter().all(|u| !u.c.dead),
        "planowanie nie zabija celu"
    );
}

// Wektory pinu (`p6_wieze_2b1_gen.mjs`): planowanie `_fireSiegeTowers` (odroczenia i wiersze) oraz pominięte wieże
// (web `_destroyTowerAtRow`, wieża bez kafla muru) w kolejności listy wież.
#[test]
fn planning_matches_pin_fire_siege_towers_on_all_vectors() {
    let v: Value = serde_json::from_str(include_str!("p6_wieze_2b1_vectors/vectors.json"))
        .expect("vectors.json");
    assert_eq!(
        v["source"]["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75")
    );
    assert_eq!(
        v["source"]["fragmentSha256"].as_str(),
        Some("c7522e637a4739b31bf95c94d3d8906f8726bc1ac87afbe015ac9db4794d4f8a"),
        "skrot wycietych fragmentow _fireSiegeTowers/_destroyTowerAtRow"
    );
    let cases = v["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 200,
        "wymagane >= 200 przypadkow, jest {}",
        cases.len()
    );

    let mut skipped_total = 0usize;
    let mut planned_total = 0usize;
    for case in cases {
        let id = case["id"].as_str().expect("id");
        let towers: Vec<i64> = case["towers"]
            .as_array()
            .expect("towers")
            .iter()
            .map(|r| r.as_i64().expect("tower row"))
            .collect();
        let walls: Vec<i64> = case["wallRows"]
            .as_array()
            .expect("wallRows")
            .iter()
            .map(|r| r.as_i64().expect("wall row"))
            .collect();
        let want: Vec<(f64, i64)> = case["planned"]
            .as_array()
            .expect("planned")
            .iter()
            .map(|p| (p[0].as_f64().expect("ms"), p[1].as_i64().expect("row")))
            .collect();
        let want_destroyed: Vec<i64> = case["destroyed"]
            .as_array()
            .expect("destroyed")
            .iter()
            .map(|r| r.as_i64().expect("destroyed row"))
            .collect();

        let mut st = state(&[10.0]);
        let mut e = env(vec![Some((7, 3))], towers.clone(), walls.clone());
        e.fire_siege_towers(&mut st);

        let got: Vec<(f64, i64)> = e
            .pending_tower_shots
            .iter()
            .map(|p| (p.ms, towers[p.tower]))
            .collect();
        assert_eq!(got, want, "{id}: planowanie");
        assert_eq!(
            atk_dead_flags(&st),
            vec![false],
            "{id}: planowanie nie zabija"
        );

        // Wieże POMINIĘTE przez Rust (brak wpisu w `pending_tower_shots`) muszą być dokładnie tymi, które pin niszczy
        // (`destroyed` z wykonania `_destroyTowerAtRow`). Zbiór wyprowadzony z wyjścia Rust, nie z wejść testu.
        // Sam efekt zniszczenia (stan `destroyed`) NIE jest jeszcze portowany (2B2) i nie jest tu asertowany.
        let planned_idx: BTreeSet<usize> = e.pending_tower_shots.iter().map(|p| p.tower).collect();
        let skipped: Vec<i64> = towers
            .iter()
            .enumerate()
            .filter(|(i, _)| !planned_idx.contains(i))
            .map(|(_, r)| *r)
            .collect();
        assert_eq!(
            skipped, want_destroyed,
            "{id}: wieże pominięte przez planowanie != destroyed z pinu"
        );

        skipped_total += skipped.len();
        planned_total += got.len();
    }
    assert!(skipped_total > 0, "brak wież bez kafla w wektorach");
    assert!(
        planned_total > 0,
        "brak zaplanowanych wystrzałów w wektorach"
    );
}

fn atk_dead_flags(st: &TurnSeqState) -> Vec<bool> {
    st.atk.iter().map(|u| u.c.dead).collect()
}
