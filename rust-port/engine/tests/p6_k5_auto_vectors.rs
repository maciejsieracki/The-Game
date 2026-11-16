//! P6 K5 AUTO-WEKTORY (dispatch R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1, runda 2 - obrona): wektory pinu `07d2fbd72` dla
//! `_finishAutoBatchPhase` (V5, `battleScene.ts:5961-5973`) i `_haltAutoBattleTurn` (V6, `battleScene.ts:17333-17344`).
//!
//! Zrodlo wartosci oczekiwanych: `tests/p6_k5_auto_vectors/pin_fragments.txt` (wyciete z pinu przez
//! `tests/p6_k5_auto_vectors/gen_pin_fragments.sh`; straznik SHA-256 = `sha256sum -c pin_fragments.sha256`,
//! tryb `--check` w skrypcie). Test `pin_fragments_hold_pinned_lines` sprawdza, ze wyciete fragmenty zawieraja
//! dokladne linie pinu, na ktorych opieraja sie wektory.
//!
//! Oczekiwane wartosci (plik:linia pinu):
//! - `TURN_GAP_MS = 240` (`battleScene.ts:1023`), zegar przez `_schedule(TURN_GAP_MS, () => this._beginTurn())` (`:5971`).
//! - filtr obroncow `!u.dead && !u.fadingOut && !u.removed && !u.acted` (`:5964`) == `alive_power && !acted` w porcie.
//! - straznik `token !== _autoBatchToken || finished || _autoBattleSuspended || _manualMode` (`:5962`).
//!
//! Port: `domain::siege_tactics_autobatch::{finish_auto_batch_phase, halt_auto_battle_turn, fire_timers}`.
//! `_checkEnd` (pin `:10172-10220`) NIE jest objete tymi wektorami: w porcie jest wstrzykiwany przez
//! `AutoBatchEnv::check_end`; V5c sprawdza tylko kontrakt wywolania. Realne kryteria konca sa w
//! `domain::siege_tactics_endcheck` (osobny temat, NIE_ZMIERZONO tutaj).
//! V15 (`_executeQueuedOrders`, pin `:3603`) i V16 (`_ffEnterAuto`, pin `:3709`) NIE maja odpowiednika w porcie
//! Rust (brak funkcji `execute_queued_orders` / `ff_enter_auto` w `rust-port/engine/src`); patrz raport, BLOCK.

use civ_engine::domain::siege_tactics_autobatch::*;
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchResolution,
};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

/// Pin `battleScene.ts:1023`: `const TURN_GAP_MS = 240;`.
const PIN_TURN_GAP_MS: f64 = 240.0;

/// Wyciete fragmenty pinu (generator `gen_pin_fragments.sh`).
const PIN_FRAGMENTS: &str = include_str!("p6_k5_auto_vectors/pin_fragments.txt");

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

/// Jednostka z ustawioną jedną flagą stanu (kazda flaga filtra obroncow pinu `:5964` osobno).
fn with_flag(mut u: BatchUnit, set: impl FnOnce(&mut CombatUnit)) -> BatchUnit {
    set(&mut u.c);
    u
}

/// Plansza: atakujacy `a0` + obroncy `d0..` w osobnych kratkach.
fn board(defenders: Vec<BatchUnit>) -> BatchBoard {
    let mut b = BatchBoard::default();
    b.atk.push(unit("a0", AutoBatchPhase::Atk, 0.0, 0.0));
    b.def.extend(defenders);
    b
}

/// Obroncy V5a: `d0` zywy i nieaktywny (przechodzi filtr); pozostali odpadaja po jednej fladze filtra pinu.
fn v5a_defenders() -> Vec<BatchUnit> {
    vec![
        unit("d0", AutoBatchPhase::Def, 3.0, 0.0),
        with_flag(unit("d1", AutoBatchPhase::Def, 4.0, 0.0), |c| {
            c.fading_out = true
        }),
        with_flag(unit("d2", AutoBatchPhase::Def, 5.0, 0.0), |c| {
            c.acted = true
        }),
        with_flag(unit("d3", AutoBatchPhase::Def, 6.0, 0.0), |c| c.dead = true),
        with_flag(unit("d4", AutoBatchPhase::Def, 7.0, 0.0), |c| {
            c.removed = true
        }),
    ]
}

fn schedules(out: &[BatchEvent]) -> Vec<(f64, bool)> {
    out.iter()
        .filter_map(|e| match e {
            BatchEvent::Schedule { ms, queued, .. } => Some((*ms, *queued)),
            _ => None,
        })
        .collect()
}

fn dummy_resolution(id: &str, side: AutoBatchPhase) -> AutoBatchResolution {
    AutoBatchResolution {
        unit_id: id.to_string(),
        side,
        kind: AutoBatchIntentKind::Hold,
        steps: Vec::new(),
        target_id: None,
        blocked: false,
    }
}

// ---- pin-guard ----

/// Straznik fragmentow: wyciete linie pinu obecne i zgodne z wektorami (mutacja wartosci w wektorze = FAIL).
#[test]
fn pin_fragments_hold_pinned_lines() {
    assert!(PIN_FRAGMENTS.contains("TURN_GAP_MS     = 240;"));
    assert!(PIN_FRAGMENTS.contains(
        "if (token !== this._autoBatchToken || this.finished || this._autoBattleSuspended || this._manualMode) return;"
    ));
    assert!(PIN_FRAGMENTS.contains(
        "const defenders = this.def.filter(u => !u.dead && !u.fadingOut && !u.removed && !u.acted);"
    ));
    assert!(PIN_FRAGMENTS.contains("this._schedule(TURN_GAP_MS, () => this._beginTurn());"));
    assert!(PIN_FRAGMENTS.contains("this._autoBatchResolutions = [];"));
}

// ---- V5: _finishAutoBatchPhase (pin 5961-5973) ----

/// V5a: koniec fali atakujacego bez konca bitwy -> start fazy obrony wylacznie na obroncach przechodzacych filtr
/// pinu `:5964` (`!dead && !fadingOut && !removed && !acted`). Z piecioma obroncami tylko `d0` ma wejsc do fazy.
#[test]
fn v5a_atk_phase_end_starts_def_phase_with_filtered_defenders() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(v5a_defenders()));
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
    // Rosnik fazy Def: jedna kopia na jednego obroncę wchodzącego do fazy.
    assert_eq!(st.hits.get("plan_clone").copied(), Some(1));
    let ids: Vec<&str> = st.resolutions.iter().map(|r| r.unit_id.as_str()).collect();
    assert_eq!(ids, vec!["d0"]);
    assert_eq!(st.phase, Some(AutoBatchPhase::Def));
}

/// V5b: koniec fali obrony -> faza null, czyszczenie rozstrzygniec (niepustych przed wywolaniem), `_schedule(TURN_GAP_MS, _beginTurn)`
/// (pin `:5968-5971`).
#[test]
fn v5b_def_phase_end_schedules_next_turn_after_pin_turn_gap() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(vec![unit("d0", AutoBatchPhase::Def, 3.0, 0.0)]));
    st.phase = Some(AutoBatchPhase::Def);
    st.resolutions = vec![dummy_resolution("d0", AutoBatchPhase::Def)];
    st.completed = vec![true];
    st.pending = 2;
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert_eq!(st.phase, None);
    assert!(st.resolutions.is_empty());
    assert!(st.completed.is_empty());
    assert_eq!(st.pending, 0);
    assert_eq!(schedules(&out), vec![(PIN_TURN_GAP_MS, true)]);
    assert_eq!(st.hits.get("finish_turn_gap").copied(), Some(1));
    assert_eq!(st.clock.timers.len(), 1);
    assert_eq!(st.clock.timers[0].payload, BatchTimer::BeginTurn);
}

/// V5c: `_checkEnd()` true -> wyjscie przed fazami (pin `:5963`), bez planowania tury i bez fazy obrony.
/// Kontrakt wywolania (`check_end` wstrzykiwany); realne kryteria `_checkEnd` poza zakresem tego pliku.
#[test]
fn v5c_end_of_battle_short_circuits_before_phase_switch() {
    let mut env = NoopEnv { end: true };
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Atk);
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert_eq!(out, vec![BatchEvent::EndCheck { ended: true }]);
    assert!(st.finished());
    assert_eq!(st.hits.get("finish_end").copied(), Some(1));
    assert_eq!(st.hits.get("finish_to_def").copied(), None);
    assert_eq!(st.hits.get("plan_clone").copied(), None);
    assert_eq!(st.phase, Some(AutoBatchPhase::Atk));
    assert!(st.clock.timers.is_empty());
}

/// V5d: straznik tokenu (pin `:5962`): stary token -> brak efektow.
#[test]
fn v5d_stale_token_is_ignored() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(v5a_defenders()));
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
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Def);
    st.manual_mode = true;
    let mut out = Vec::new();
    let tok = st.token;
    finish_auto_batch_phase(&mut st, &mut env, tok, &mut out);
    assert!(out.is_empty());
    assert_eq!(st.phase, Some(AutoBatchPhase::Def));
}

// ---- V6: _haltAutoBattleTurn (pin 17333-17344) ----

/// V6a: przerwanie w polowie fali (pin `:17334-17343`): zegar czyszczony, token +1, faza/rozstrzygniecia/completed/pending
/// zerowane (stan niepusty przed wywolaniem), czekanie na rozkazy, zawieszenie.
#[test]
fn v6a_halt_mid_wave_resets_state_and_bumps_token() {
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Atk);
    st.resolutions = vec![
        dummy_resolution("a0", AutoBatchPhase::Atk),
        dummy_resolution("a0", AutoBatchPhase::Atk),
    ];
    st.completed = vec![true, false];
    st.pending = 3;
    st.busy = true;
    let before = st.token;
    schedule_test_timer(&mut st);
    halt_auto_battle_turn(&mut st, true);
    assert_eq!(st.token, before + 1);
    assert!(st.clock.timers.is_empty());
    assert!(!st.busy);
    assert_eq!(st.phase, None);
    assert!(st.resolutions.is_empty());
    assert!(st.completed.is_empty());
    assert_eq!(st.pending, 0);
    assert!(st.battle_awaiting_orders);
    assert!(st.auto_battle_suspended);
}

/// V6b: spozniony `finish` z tokenem sprzed przerwania nie zmienia stanu (pin `:5962`): pelne porownanie stanu,
/// jedyna dozwolona roznica to licznik galezi `finish_stale`.
#[test]
fn v6b_late_finish_with_old_token_does_nothing() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Atk);
    st.resolutions = vec![dummy_resolution("a0", AutoBatchPhase::Atk)];
    st.completed = vec![false];
    st.pending = 1;
    let old = st.token;
    halt_auto_battle_turn(&mut st, true);
    let mut expected = st.clone();
    let mut out = Vec::new();
    finish_auto_batch_phase(&mut st, &mut env, old, &mut out);
    assert!(out.is_empty());
    *expected.hits.entry("finish_stale").or_insert(0) += 1;
    assert_eq!(st, expected);
}

/// V6d: spozniony callback `FinishPhase{token: stary}` odpalony przez `fire_timers` (realna sciezka zegara, nie
/// bezposrednie wywolanie) po przerwaniu nie zmienia stanu gry; po przerwaniu nie ma zadnych zaplanowanych efektow.
#[test]
fn v6d_late_callback_fired_via_clock_after_halt_is_dropped() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Atk);
    let old = st.token;
    halt_auto_battle_turn(&mut st, true);
    let mut expected = st.clone();
    // Callback zlapany przed przerwaniem, doplynal po nim: zegar planuje go juz po halt (vTimers wyczyszczone).
    let _ = st
        .clock
        .schedule(0.0, BatchTimer::FinishPhase { token: old }, false);
    let mut out = Vec::new();
    let fired = fire_timers(&mut st, &mut env, &mut out);
    assert_eq!(fired, 1);
    assert!(out.is_empty());
    assert_eq!(st.phase, None);
    assert_eq!(st.token, expected.token);
    assert_eq!(st.pending, 0);
    assert!(st.resolutions.is_empty());
    assert!(st.auto_battle_suspended);
    assert!(st.battle_awaiting_orders);
    assert!(st.clock.timers.is_empty());
    assert_eq!(st.hits.get("finish_stale").copied(), Some(1));
    // Jedyna roznica wzgledem stanu po halt: licznik galezi i sekwencja zegara.
    expected.clock.timer_seq = st.clock.timer_seq;
    *expected.hits.entry("finish_stale").or_insert(0) += 1;
    assert_eq!(st.hits, expected.hits);
    assert_eq!(st.clock.v_now, expected.clock.v_now);
    assert_eq!(st.clock.finished, expected.clock.finished);
}

/// V6e: jak V6d, ale bez zawieszenia (`suspendInFlight = false`): jedynym strazem jest token. Bez podbicia tokenu
/// (mutacja: brak `token += 1` w halt) spozniony callback przeszedlby i wywolalby faze - test musi dac FAIL.
#[test]
fn v6e_late_callback_dropped_by_token_alone_when_not_suspended() {
    let mut env = NoopEnv { end: false };
    let mut st = BatchState::new(board(v5a_defenders()));
    st.phase = Some(AutoBatchPhase::Atk);
    let old = st.token;
    halt_auto_battle_turn(&mut st, false);
    assert!(!st.auto_battle_suspended);
    let _ = st
        .clock
        .schedule(0.0, BatchTimer::FinishPhase { token: old }, false);
    let mut out = Vec::new();
    assert_eq!(fire_timers(&mut st, &mut env, &mut out), 1);
    assert!(out.is_empty());
    assert_eq!(st.phase, None);
    assert_eq!(st.hits.get("finish_stale").copied(), Some(1));
    assert_eq!(st.hits.get("finish_to_def").copied(), None);
    assert_eq!(st.hits.get("finish_turn_gap").copied(), None);
}

/// V6c: `suspendInFlight = false` (pin `:17342` `if (suspendInFlight)`) -> brak zawieszenia, reszta bez zmian.
#[test]
fn v6c_halt_without_suspend_keeps_flag_clear() {
    let mut st = BatchState::new(board(v5a_defenders()));
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
