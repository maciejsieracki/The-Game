//! P6 K5 AUTO-WEKTORY (dispatch R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1, runda 1): wektory pinu `07d2fbd72` dla
//! `_finishAutoBatchPhase` (V5, `battleScene.ts:5961-5973`) i `_haltAutoBattleTurn` (V6, `battleScene.ts:17333-17344`).
//!
//! Oczekiwane wartosci wyciagniete z pinu recznie (plik:linia przy kazdym przypadku):
//! - `TURN_GAP_MS = 240` (`battleScene.ts:1023`), zegar przez `_schedule(TURN_GAP_MS, () => this._beginTurn())` (`:5971`).
//! - filtr obroncow `!u.dead && !u.fadingOut && !u.removed && !u.acted` (`:5964`) == `alive_power && !acted` w porcie.
//! - straznik `token !== _autoBatchToken || finished || _autoBattleSuspended || _manualMode` (`:5962`).
//!
//! Port: `domain::siege_tactics_autobatch::{finish_auto_batch_phase, halt_auto_battle_turn}`.
//! Uwaga: V15 (`_executeQueuedOrders`, pin `:3603`) i V16 (`_ffEnterAuto`, pin `:3709`) NIE maja odpowiednika w porcie
//! Rust (brak funkcji `execute_queued_orders` / `ff_enter_auto` w `rust-port/engine/src`); patrz raport, BLOCK.

use civ_engine::domain::siege_tactics_autobatch::*;
use civ_engine::domain::siege_tactics_autophase::{AutoBatchIntent, AutoBatchPhase};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

/// Pin `battleScene.ts:1023`: `const TURN_GAP_MS = 240;`.
const PIN_TURN_GAP_MS: f64 = 240.0;

struct NoopEnv {
    end: bool,
}

impl AutoBatchEnv for NoopEnv {
    fn plan_unit(
        &mut self,
        _board: &mut BatchBoard,
        _unit_id: &str,
        _intent: &mut AutoBatchIntent,
    ) {
    }
    fn check_end(&mut self, st: &mut BatchState) -> bool {
        if self.end {
            st.clock.finished = true;
        }
        self.end
    }
    fn passable_for_unit(&mut self, _st: &BatchState, _id: &str, _col: f64, _row: f64) -> bool {
        true
    }
    fn do_move(&mut self, _st: &mut BatchState, _unit_id: &str, _col: f64, _row: f64) {}
    fn apply_terrain_range(&mut self, _st: &mut BatchState, _unit_id: &str) {}
    fn do_attack(&mut self, _st: &mut BatchState, _attacker_id: &str, _target_id: &str) {}
    fn flee_step(&mut self, _st: &mut BatchState, _unit_id: &str) {}
    fn remove_unit_from_scene(&mut self, _st: &mut BatchState, _unit_id: &str) {}
    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _unit_id: &str) {}
    fn can_strike_target_from(
        &mut self,
        _st: &BatchState,
        _attacker_id: &str,
        _col: f64,
        _row: f64,
        _target_id: &str,
    ) -> bool {
        false
    }
}

fn unit(id: &str, side: AutoBatchPhase, q: f64, r: f64) -> BatchUnit {
    BatchUnit {
        id: id.to_string(),
        side,
        q,
        r,
        c: CombatUnit {
            hp: 30.0,
            morale: 50.0,
            flee_morale: 20.0,
            move_left: 3.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        },
    }
}

fn board(defenders: &[(&str, bool)]) -> BatchBoard {
    let mut b = BatchBoard::default();
    b.atk.push(unit("a0", AutoBatchPhase::Atk, 0.0, 0.0));
    for (id, ok) in defenders {
        let mut d = unit(id, AutoBatchPhase::Def, 3.0, 0.0);
        if !ok {
            d.c.fading_out = true;
        }
        b.def.push(d);
    }
    b
}

fn schedules(out: &[BatchEvent]) -> Vec<(f64, bool)> {
    out.iter()
        .filter_map(|e| match e {
            BatchEvent::Schedule { ms, queued, .. } => Some((*ms, *queued)),
            _ => None,
        })
        .collect()
}

// ---- V5: _finishAutoBatchPhase (pin 5961-5973) ----

/// V5a: koniec fali atakujacego bez konca bitwy -> start fazy obrony na zywych, nieaktywnych obroncach
/// (pin `:5964-5966`); obrońca z `fadingOut` jest pomijany.
#[test]
fn v5a_atk_phase_end_starts_def_phase_with_filtered_defenders() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(&[("d0", true), ("d1", false)]));
    st.phase = Some(AutoBatchPhase::Atk);
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert!(matches!(
        out.first(),
        Some(BatchEvent::EndCheck { ended: false })
    ));
    assert_eq!(st.hits.get("finish_to_def").copied(), Some(1));
    assert_eq!(st.hits.get("finish_turn_gap").copied(), None);
}

/// V5b: koniec fali obrony -> faza null, czyszczenie rozstrzygniec, `_schedule(TURN_GAP_MS, _beginTurn)` (pin `:5968-5971`).
#[test]
fn v5b_def_phase_end_schedules_next_turn_after_pin_turn_gap() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Def);
    st.pending = 2;
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert_eq!(st.phase, None);
    assert!(st.resolutions.is_empty());
    assert_eq!(st.pending, 0);
    assert_eq!(schedules(&out), vec![(PIN_TURN_GAP_MS, true)]);
    assert_eq!(st.hits.get("finish_turn_gap").copied(), Some(1));
    assert_eq!(st.clock.timers.len(), 1);
    assert_eq!(st.clock.timers[0].payload, BatchTimer::BeginTurn);
}

/// V5c: `_checkEnd()` true -> wyjscie przed fazami (pin `:5963`), bez planowania tury.
#[test]
fn v5c_end_of_battle_short_circuits_before_phase_switch() {
    let mut env = NoopEnv { end: true };
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Atk);
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert_eq!(out, vec![BatchEvent::EndCheck { ended: true }]);
    assert_eq!(st.hits.get("finish_end").copied(), Some(1));
    assert_eq!(st.hits.get("finish_to_def").copied(), None);
    assert!(st.clock.timers.is_empty());
}

/// V5d: straznik tokenu (pin `:5962`): stary token -> brak efektow.
#[test]
fn v5d_stale_token_is_ignored() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Atk);
    let stale = st.token + 7;
    let mut out = Vec::new();
    finish_auto_batch_phase(&mut st, &mut env, stale, &mut out);
    assert!(out.is_empty());
    assert_eq!(st.hits.get("finish_stale").copied(), Some(1));
    assert_eq!(st.phase, Some(AutoBatchPhase::Atk));
}

/// V5e: tryb reczny (pin `:5962` `_manualMode`) -> brak efektow, faza zachowana.
#[test]
fn v5e_manual_mode_blocks_finish() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Def);
    st.manual_mode = true;
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert!(out.is_empty());
    assert_eq!(st.phase, Some(AutoBatchPhase::Def));
}

// ---- V6: _haltAutoBattleTurn (pin 17333-17344) ----

/// V6a: przerwanie w polowie fali (pin `:17334-17343`): zegar czyszczony, token +1, faza/rozstrzygniecia/pending zerowane,
/// czekanie na rozkazy, zawieszenie.
#[test]
fn v6a_halt_mid_wave_resets_state_and_bumps_token() {
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Atk);
    st.pending = 3;
    st.busy = true;
    let before = st.token;
    schedule_test_timer(&mut st);
    halt_auto_battle_turn(&mut st, true);
    assert_eq!(st.token, before + 1);
    assert!(st.clock.timers.is_empty());
    assert!(!st.busy);
    assert_eq!(st.phase, None);
    assert_eq!(st.pending, 0);
    assert!(st.battle_awaiting_orders);
    assert!(st.auto_battle_suspended);
}

/// V6b: spozniony `FinishPhase` z tokenem sprzed przerwania nie zmienia stanu (pin `:5962`).
#[test]
fn v6b_late_finish_with_old_token_does_nothing() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(&[("d0", true)]));
    st.phase = Some(AutoBatchPhase::Atk);
    let old = st.token;
    halt_auto_battle_turn(&mut st, true);
    let snapshot = st.clone();
    let mut out = Vec::new();
    finish_auto_batch_phase(&mut st, &mut env, old, &mut out);
    assert!(out.is_empty());
    assert_eq!(st.phase, snapshot.phase);
    assert_eq!(st.token, snapshot.token);
    assert!(st.clock.timers.is_empty());
}

/// V6c: `suspendInFlight = false` (pin `:17342` `if (suspendInFlight)`) -> brak zawieszenia, reszta bez zmian.
#[test]
fn v6c_halt_without_suspend_keeps_flag_clear() {
    let mut st = BatchState::new(board(&[("d0", true)]));
    halt_auto_battle_turn(&mut st, false);
    assert!(!st.auto_battle_suspended);
    assert!(st.battle_awaiting_orders);
}

/// Zaplanowany timer w kolejce zegara (stan "w polowie fali" do skasowania przez halt).
fn schedule_test_timer(st: &mut BatchState) {
    let _ = st
        .clock
        .schedule(PIN_TURN_GAP_MS, BatchTimer::BeginTurn, false);
    assert_eq!(st.clock.timers.len(), 1);
}
