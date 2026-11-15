//! R-RUSTPORT-P6-WIEZE-2B2-Q1: strzał wieży oblężniczej (web `_fireOneTower`, pin 07d2fbd72 `battleScene.ts:4223-4262`).
//!
//! Zakres testów: cel wybierany w chwili wystrzału, zniszczona wieża nie strzela, brak wiersza strzelca = brak
//! planowania, obrażenia przez wspólną ścieżkę `single_blow_full` (ranged = true) z aktualizacją HP celu.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_blow_full::single_blow_full;
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    neutral_tower_shot_template, tower_blow_on_target, LoopBody, LoopTimer, SiegeEnv, SiegeLoop,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

/// Ciało z pozycjami atakujących; strzał wieży woła wspólną ścieżkę `tower_blow_on_target` z własnymi rzutami.
struct TowerBody {
    atk_cells: Vec<Option<(i64, i64)>>,
    rolls: SequenceRolls,
    tower_blows: usize,
}

impl LoopBody for TowerBody {
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
    fn tower_blow(
        &mut self,
        tmpl: &civ_engine::domain::siege_tactics_blow_full::FullBlowInput,
        target: usize,
        st: &mut TurnSeqState,
    ) {
        self.tower_blows += 1;
        let _ = tower_blow_on_target(tmpl, st, target, &mut self.rolls);
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

fn state(atk_hp: &[f64]) -> TurnSeqState {
    TurnSeqState {
        atk: atk_hp
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
    with_shooter: bool,
) -> SiegeEnv<TowerBody> {
    SiegeEnv {
        body: TowerBody {
            atk_cells: cells,
            rolls: SequenceRolls::new(vec![0.0]),
            tower_blows: 0,
        },
        tower_rows,
        pending_tower_shots: Vec::new(),
        tower_range: 2.0,
        wall_tile_rows,
        wall_ever_breached: false,
        no_breach_cap: 10,
        move_points: [vec![3.0], vec![3.0]],
        morale_max: [vec![100.0], vec![100.0]],
        tower_shot: if with_shooter {
            Some(neutral_tower_shot_template())
        } else {
            None
        },
    }
}

/// Wieża (5,3), zasięg 2, jedyny atakujący (7,3) w zasięgu. Obrońca żywy, bitwa nie kończy się przed strzałem.
fn live_state(hp: f64) -> TurnSeqState {
    let mut st = state(&[hp]);
    st.def = vec![SeqUnit {
        id: 100,
        c: cu(10.0),
    }];
    st
}

/// Uruchamia sterownik do wyczerpania zegara (wystrzał planowany w `BeginTurn`, trafienie po locie).
fn run_loop(sl: &mut SiegeLoop<TowerBody>) {
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = sl.run(&mut clock, 10_000);
}

#[test]
fn tower_shot_damages_target_through_single_blow_full() {
    // Oczekiwana wartość: ta sama ścieżka `single_blow_full` (ranged) na szablonie z tym samym rzutem 0.0.
    let tmpl = neutral_tower_shot_template();
    let expected = single_blow_full(&tmpl, &mut SequenceRolls::new(vec![0.0]))
        .blow
        .def_hp_after;
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    run_loop(&mut sl);
    assert!(sl.env.body.tower_blows >= 1, "wystrzał wieży nie zaszedł");
    assert_eq!(sl.st.atk[0].c.hp, expected, "HP celu po strzale wieży");
    assert!(expected < 10.0, "wzorcowy cios powinien zadać obrażenia");
}

#[test]
fn no_shooter_row_means_no_planning_and_no_shot() {
    // Guard pina `!this.towerShooterRow` → `return`: bez szablonu strzelca nic nie jest planowane.
    let mut st = live_state(10.0);
    let mut e = env(vec![Some((7, 3))], vec![3], vec![3], false);
    e.fire_siege_towers(&mut st);
    assert!(
        e.pending_tower_shots.is_empty(),
        "bez wiersza strzelca brak planowania"
    );
    let mut sl = SiegeLoop::new(live_state(10.0), e);
    run_loop(&mut sl);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "bez wiersza strzelca brak strzału"
    );
    assert_eq!(sl.st.atk[0].c.hp, 10.0, "bez strzału HP bez zmian");
}

#[test]
fn destroyed_tower_does_not_shoot() {
    // Wieża planowana (kafel muru jest), ale kafel zostaje zburzony przed wystrzałem: web `t.destroyed` → brak strzału.
    let mut clock = VirtualClock::<LoopTimer>::new();
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    // Kafel muru na wieży (5,3) zostaje zburzony po zaplanowaniu wystrzału, przed jego wykonaniem.
    sl.env.wall_tile_rows.clear();
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 0, "zniszczona wieża nie strzela");
    assert_eq!(sl.st.atk[0].c.hp, 10.0, "HP celu bez zmian");
}

#[test]
fn live_wall_tile_control_case_shoots() {
    // Kontrola do testu wyżej: ten sam zegar z kaflem muru na miejscu daje strzał.
    let mut clock = VirtualClock::<LoopTimer>::new();
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert!(
        sl.env.body.tower_blows >= 1,
        "kontrola: wieża z kaflem muru strzela"
    );
}

#[test]
fn dead_target_is_not_chosen_at_shot_time() {
    // Cel martwy w chwili wystrzału nie jest wybierany (filtr `pick_tower_target` jak w pinie): brak strzału.
    let mut st = live_state(10.0);
    st.atk[0].c.dead = true;
    let mut sl = SiegeLoop::new(st, env(vec![Some((7, 3))], vec![3], vec![3], true));
    run_loop(&mut sl);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "martwy cel nie jest celem wieży"
    );
}

/// Trafienie pocisku (web callback `_schedule(RANGED_FLY_MS)`, `battleScene.ts:4263-4269`) pomija cel martwy
/// PO wystrzale, a nie tylko w chwili wyboru. Test steruje zegarem bezposrednio przez `LoopTimer::TowerHit`.
#[test]
fn tower_hit_skips_target_dead_before_impact() {
    // Drugi atakujący żyje, więc bitwa nie kończy się przed trafieniem (inaczej `finished` maskuje guard).
    let mut st = two_attacker_state();
    st.atk[0].c.dead = true;
    let mut sl = SiegeLoop::new(st, two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "cel martwy przed trafieniem nie dostaje ciosu wieży"
    );
}

/// Stan z dwoma atakującymi (oba żywe) i żywym obrońcą; cele w (7,3) i (7,4), wieża (5,3).
fn two_attacker_state() -> TurnSeqState {
    let mut st = state(&[10.0, 10.0]);
    st.def = vec![SeqUnit {
        id: 100,
        c: cu(10.0),
    }];
    st
}

fn two_attacker_env() -> SiegeEnv<TowerBody> {
    let mut e = env(vec![Some((7, 3)), Some((7, 4))], vec![3], vec![3], true);
    e.move_points[0] = vec![3.0, 3.0];
    e.morale_max[0] = vec![100.0, 100.0];
    e
}

#[test]
fn tower_hit_skips_target_fading_out_before_impact() {
    let mut st = two_attacker_state();
    st.atk[0].c.fading_out = true;
    let mut sl = SiegeLoop::new(st, two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "cel znikający przed trafieniem nie dostaje ciosu wieży"
    );
}

/// Kontrola do dwóch testów wyżej: żywy cel w `TowerHit` dostaje cios (guard nie jest tautologią).
#[test]
fn tower_hit_on_live_target_blows() {
    let mut sl = SiegeLoop::new(two_attacker_state(), two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 1, "żywy cel dostaje cios wieży");
}

/// Opóźnienie lotu: trafienie następuje po `TOWER_FLY_MS` (380 ms, web `RANGED_FLY_MS`) od wystrzału.
#[test]
fn tower_hit_lands_after_tower_fly_ms() {
    use civ_engine::domain::siege_tactics_loop::TOWER_FLY_MS;
    assert_eq!(TOWER_FLY_MS, 380.0, "stała zgodna z pinem RANGED_FLY_MS");
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 1, "strzał dociera do trafienia");
    assert!(
        clock.now() >= TOWER_FLY_MS,
        "trafienie nie wcześniej niż po locie: now={}",
        clock.now()
    );
}
