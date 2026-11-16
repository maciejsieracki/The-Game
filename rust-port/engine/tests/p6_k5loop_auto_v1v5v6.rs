//! P6 K5-LOOP-AUTO-WEKTORY (dispatch R-RUSTPORT-P6-K5LOOP-AUTO-WEKTORY-V1V5V6-Q1): wektory pinu `07d2fbd72` dla
//! faz AUTO bez oblezenia i trybu recznego.
//!
//! * V1 (`battleScene.ts:5696-5704` + `:5707-5745`): wybor strony pierwszej fazy wsadowej i start fali.
//! * V5 (`battleScene.ts:5961-5973`): `_finishAutoBatchPhase` -- start obrony, koniec tury, koniec bitwy w fazie atakujacego.
//! * V6 (`battleScene.ts:17333-17344` + callback `:5865-5905`): przerwanie w polowie fali, spozniony callback.
//!
//! Wartosci oczekiwane sa generowane przez `tests/p6_k5loop_auto_gen.mjs`, ktory WYKONUJE ciala metod pinu
//! (nie przepisuje ich), a zapisane sa w `tests/p6_k5loop_auto_vectors/vectors.json` (straznik SHA-256 w `SHA256SUMS`).
//! Kazdy wektor porownuje obserwacje portu Rust (zdarzenia [`BatchEvent`] + stan [`BatchState`]) z obserwacja pinu
//! w tym samym formacie. Mutacje (a)(b)(c) z dispatchu sa wykonywane recznie w bramkach raportu.

use civ_engine::domain::siege_tactics_autobatch::*;
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchResolution,
};
use civ_engine::domain::siege_tactics_turnseq::{ACT_GAP_MS, TURN_GAP_MS};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_k5loop_auto_vectors/vectors.json");

/// Srodowisko wstrzykniete: bez RNG; koniec bitwy i zasieg ciosu sterowane z wektora.
struct VecEnv {
    end: bool,
}

impl AutoBatchEnv for VecEnv {
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
    fn passable_for_unit(
        &mut self,
        _st: &BatchState,
        _unit_id: &str,
        _col: f64,
        _row: f64,
    ) -> bool {
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
        true
    }
}

fn side_of(s: &str) -> AutoBatchPhase {
    match s {
        "atk" => AutoBatchPhase::Atk,
        "def" => AutoBatchPhase::Def,
        other => panic!("nieznana strona wektora: {other}"),
    }
}

fn flag(v: &Value, key: &str) -> bool {
    v[key].as_bool().unwrap_or(false)
}

fn unit_from(v: &Value) -> BatchUnit {
    BatchUnit {
        id: v["id"].as_str().unwrap().to_string(),
        side: side_of(v["side"].as_str().unwrap()),
        q: v["q"].as_f64().unwrap(),
        r: v["r"].as_f64().unwrap(),
        c: CombatUnit {
            hp: 30.0,
            morale: 50.0,
            flee_morale: 20.0,
            move_left: 3.0,
            never_rout: false,
            dead: flag(v, "dead"),
            fading_out: flag(v, "fading_out"),
            routed: flag(v, "routed"),
            removed: flag(v, "removed"),
            acted: flag(v, "acted"),
        },
    }
}

fn build_state(setup: &Value) -> BatchState {
    let mut board = BatchBoard::default();
    for u in setup["atk"].as_array().unwrap() {
        board.atk.push(unit_from(u));
    }
    for u in setup["def"].as_array().unwrap() {
        board.def.push(unit_from(u));
    }
    let cells: Vec<(String, f64, f64)> = board.all().map(|u| (u.id.clone(), u.q, u.r)).collect();
    for (id, q, r) in cells {
        board.occ.insert(cell_key(q, r), id);
    }

    let mut st = BatchState::new(board);
    st.clock.finished = flag(setup, "finished");
    st.manual_mode = flag(setup, "manual");
    st.auto_battle_suspended = flag(setup, "suspended");
    st.battle_awaiting_orders = flag(setup, "awaiting");
    st.siege_wall_col = setup["siege_wall_col"].as_i64().unwrap();
    st.phase = setup["phase"].as_str().map(side_of);
    st.token = setup["token"].as_u64().unwrap();
    st.pending = setup["pending"].as_u64().unwrap() as usize;
    st.resolutions = setup["resolutions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| AutoBatchResolution {
            unit_id: r["unit_id"].as_str().unwrap().to_string(),
            side: side_of(r["side"].as_str().unwrap()),
            kind: match r["kind"].as_str().unwrap() {
                "attack" => AutoBatchIntentKind::Attack,
                "hold" => AutoBatchIntentKind::Hold,
                other => panic!("nieznany rodzaj rozstrzygniecia: {other}"),
            },
            steps: Vec::new(),
            target_id: r["target_id"].as_str().map(str::to_string),
            blocked: false,
        })
        .collect();
    st.completed = vec![false; st.resolutions.len()];
    st
}

fn timer_name(t: &BatchTimer) -> &'static str {
    match t {
        BatchTimer::FinishPhase { .. } => "finishPhase",
        BatchTimer::BeginTurn => "beginTurn",
    }
}

fn phase_value(p: &Option<AutoBatchPhase>) -> Value {
    match p {
        None => Value::Null,
        Some(AutoBatchPhase::Atk) => json!("atk"),
        Some(AutoBatchPhase::Def) => json!("def"),
    }
}

/// Wykonuje operacje wektora na porcie i zwraca obserwacje w formacie `expect` z `vectors.json`.
fn run_vector(setup: &Value) -> Value {
    let mut st = build_state(setup);
    let mut env = VecEnv {
        end: flag(setup, "check_end"),
    };
    let mut out: Vec<BatchEvent> = Vec::new();
    let mut scanned = 0usize;
    // Odlozone ciosy: LaunchCtx z BatchEvent::Attack, dostarczany przez "deliver_attack_done" (FIFO jak w pinie).
    let mut attack_ctxs: Vec<LaunchCtx> = Vec::new();

    for op in setup["ops"].as_array().unwrap() {
        match op["op"].as_str().unwrap() {
            "begin_from_state" => {
                begin_auto_batch_turn_from_current_state(&mut st, &mut env, &mut out);
            }
            "begin_phase" => {
                let side = side_of(op["side"].as_str().unwrap());
                let ids: Vec<String> = op["ids"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_str().unwrap().to_string())
                    .collect();
                begin_auto_batch_phase(&mut st, &mut env, side, &ids, &mut out);
            }
            "finish" => {
                let token = op["token"].as_u64().unwrap();
                finish_auto_batch_phase(&mut st, &mut env, token, &mut out);
            }
            "halt" => {
                halt_auto_battle_turn(&mut st, op["suspend"].as_bool().unwrap());
            }
            "launch_attack" => {
                let attacker = op["attacker"].as_str().unwrap().to_string();
                let target = op["target"].as_str().unwrap().to_string();
                let token = op["token"].as_u64().unwrap();
                let side = if st.board.atk.iter().any(|u| u.id == attacker) {
                    AutoBatchPhase::Atk
                } else {
                    AutoBatchPhase::Def
                };
                let idx = st
                    .resolutions
                    .iter()
                    .position(|r| r.unit_id == attacker)
                    .unwrap_or(0);
                let ctx = LaunchCtx {
                    token,
                    idx,
                    resolution: AutoBatchResolution {
                        unit_id: attacker,
                        side,
                        kind: AutoBatchIntentKind::Attack,
                        steps: Vec::new(),
                        target_id: Some(target),
                        blocked: false,
                    },
                };
                launch_auto_batch_resolution(&mut st, &mut env, &ctx, &mut out);
            }
            "deliver_attack_done" => {
                assert!(
                    !attack_ctxs.is_empty(),
                    "brak odlozonego ciosu do dostarczenia"
                );
                let ctx = attack_ctxs.remove(0);
                complete_resolution(&mut st, &ctx, &mut out);
            }
            other => panic!("nieznana operacja wektora: {other}"),
        }
        for event in &out[scanned..] {
            if let BatchEvent::Attack { ctx, .. } = event {
                attack_ctxs.push(ctx.clone());
            }
        }
        scanned = out.len();
    }

    let mut banners: Vec<Value> = Vec::new();
    let mut end_checks: Vec<Value> = Vec::new();
    let mut scheduled: Vec<Value> = Vec::new();
    for event in &out {
        match event {
            BatchEvent::Banner { active } => banners.push(match active {
                Some(id) => json!(id),
                None => Value::Null,
            }),
            BatchEvent::EndCheck { ended } => end_checks.push(json!(ended)),
            BatchEvent::Schedule { ms, timer, .. } => {
                scheduled.push(json!({ "ms": *ms as u64, "timer": timer_name(timer) }))
            }
            _ => {}
        }
    }
    // Kazde wywolanie fazy emituje dokladnie jeden baner; w wektorach jest co najwyzej jedno takie wywolanie.
    let begin_phase_calls: Vec<Value> = if banners.is_empty() {
        Vec::new()
    } else {
        vec![json!({
            "side": phase_value(&st.phase).as_str().unwrap(),
            "ids": st.resolutions.iter().map(|r| r.unit_id.clone()).collect::<Vec<String>>(),
        })]
    };

    json!({
        "banners": banners,
        "begin_phase_calls": begin_phase_calls,
        "end_checks": end_checks,
        "scheduled": scheduled,
        "resolution_ids": st.resolutions.iter().map(|r| r.unit_id.clone()).collect::<Vec<String>>(),
        "phase_after": phase_value(&st.phase),
        "pending_after": st.pending,
        "token_after": st.token,
        "suspended_after": st.auto_battle_suspended,
        "awaiting_after": st.battle_awaiting_orders,
    })
}

fn vectors_doc() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn check(id: &str) {
    let doc = vectors_doc();
    let vector = doc["vectors"]
        .as_array()
        .unwrap()
        .iter()
        .find(|v| v["id"] == id)
        .unwrap_or_else(|| panic!("brak wektora {id}"));
    let got = run_vector(&vector["setup"]);
    assert_eq!(
        got, vector["expect"],
        "wektor {id} ({}) rozni sie od pinu",
        vector["pin"]
    );
}

/// Port stalych czasowych = pin (`ACT_GAP_MS` :1014 = 160, `TURN_GAP_MS` :1023 = 240).
#[test]
fn pin_gap_constants_match_vectors() {
    let doc = vectors_doc();
    assert_eq!(doc["act_gap_ms"].as_u64(), Some(ACT_GAP_MS as u64));
    assert_eq!(doc["turn_gap_ms"].as_u64(), Some(TURN_GAP_MS as u64));
    assert_eq!(ACT_GAP_MS as u64, 160);
    assert_eq!(TURN_GAP_MS as u64, 240);
}

// ---- V1: _beginAutoBatchTurnFromCurrentState + _beginAutoBatchPhase (pin :5696-5745) ----

#[test]
fn v1a_attackers_first_when_attackers_live() {
    check("v1a_attackers_first_when_attackers_live");
}

#[test]
fn v1b_defenders_first_when_no_attacker_left() {
    check("v1b_defenders_first_when_no_attacker_left");
}

#[test]
fn v1c_acted_attacker_is_skipped() {
    check("v1c_acted_attacker_is_skipped");
}

#[test]
fn v1d_siege_wall_blocks_turn_start() {
    check("v1d_siege_wall_blocks_turn_start");
}

#[test]
fn v1e_manual_mode_blocks_turn_start() {
    check("v1e_manual_mode_blocks_turn_start");
}

#[test]
fn v1f_finished_battle_blocks_turn_start() {
    check("v1f_finished_battle_blocks_turn_start");
}

#[test]
fn v1g_suspended_blocks_phase_start() {
    check("v1g_suspended_blocks_phase_start");
}

// ---- V5: _finishAutoBatchPhase (pin :5961-5973) ----

#[test]
fn v5a_attack_phase_end_starts_defense_with_filter() {
    check("v5a_attack_phase_end_starts_defense_with_filter");
}

#[test]
fn v5b_defense_phase_end_schedules_next_turn() {
    check("v5b_defense_phase_end_schedules_next_turn");
}

#[test]
fn v5c_attacker_wins_in_attack_phase_no_defense() {
    check("v5c_attacker_wins_in_attack_phase_no_defense");
}

#[test]
fn v5d_stale_token_is_ignored() {
    check("v5d_stale_token_is_ignored");
}

#[test]
fn v5e_manual_mode_blocks_finish() {
    check("v5e_manual_mode_blocks_finish");
}

// ---- V6: _haltAutoBattleTurn (pin :17333-17344) + spozniony callback (pin :5865-5905) ----

#[test]
fn v6a_halt_mid_wave_late_callback_dropped() {
    check("v6a_halt_mid_wave_late_callback_dropped");
}

#[test]
fn v6b_halt_without_suspend_keeps_flag_clear() {
    check("v6b_halt_without_suspend_keeps_flag_clear");
}

#[test]
fn v6c_callback_before_halt_counts_down() {
    check("v6c_callback_before_halt_counts_down");
}
