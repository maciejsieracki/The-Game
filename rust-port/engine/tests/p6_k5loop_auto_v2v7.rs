//! P6 K5-LOOP-AUTO-WEKTORY V2/V7 (dispatch R-RUSTPORT-P6-AUTO-V2-V7-Q1): wektory pinu `07d2fbd72` dla planowania
//! fal AUTO (migawka klonow) i doktryny steady bez oblezenia.
//!
//! * V2 (`battleScene.ts:5752-5815`, galezie planowania `_doMove` :8694-8712 i `_doAttack` :8788-8795):
//!   `snapshot_auto_batch_intents` planuje kazda jednostke na osobnym klonie migawki; zywa plansza zostaje nietknieta.
//! * V7 (`battleScene.ts:17966` galaz steady, `:17645` cel marszu dwie kolumny w przod, `:17890-17895` cel grupy steady):
//!   geometria celu marszu steady (`forward_col(side, kolumna, 2)`, zacisk do planszy) zgodna z pinem.
//!
//! Wartosci oczekiwane generuje `tests/p6_k5loop_auto_v2v7_gen.mjs`, ktory WYKONUJE ciala metod pinu (nie przepisuje ich),
//! zapisane w `tests/p6_k5loop_auto_v2v7_vectors/vectors.json` (straznik SHA-256 w `SHA256SUMS`).
//!
//! NIE_ZMIERZONO w Rust: wybor galezi kroku doktryny steady (`_advanceStep` / `_cavalryAction`, pole `branch` w JSON)
//! -- krok doktryny nie jest jeszcze portowany (K5DOC-T8, #264). Ten test sprawdza tylko geometrie celu (V7)
//! i plan z klonow (V2); pole `branch` zostaje w wektorze jako wynik pinu do przyszlego portu.

use civ_engine::domain::siege_tactics_autobatch::*;
use civ_engine::domain::siege_tactics_autophase::{
    AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase, AutoBatchStep,
};
use civ_engine::domain::siege_tactics_doctrine_state::{forward_col, GroupDoctrine};
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_k5loop_auto_v2v7_vectors/vectors.json");

/// Operacja skryptu jednostki (zastepstwo `_activateUnit` z pinu, patrz naglowek generatora).
#[derive(Debug, Clone, PartialEq)]
enum PlanOp {
    /// Ruch przez `_doMove` w galezi planowania: zajety kafelek w klonie przerywa skrypt (hold).
    Move { col: f64, row: f64 },
    /// Zmiana q/r poza `_doMove` (galaz specjalna): bez krokow i bez zmiany zajetosci.
    Set { col: f64, row: f64 },
    /// Atak przez `_doAttack` w galezi planowania.
    Attack { target: String },
}

/// Srodowisko planowania: `plan_unit` odtwarza galezie planowania `_doMove` / `_doAttack` pinu na klonie.
struct PlanEnv {
    scripts: HashMap<String, Vec<PlanOp>>,
}

impl AutoBatchEnv for PlanEnv {
    fn plan_unit(&mut self, board: &mut BatchBoard, unit_id: &str, intent: &mut AutoBatchIntent) {
        let ops = self.scripts.get(unit_id).cloned().unwrap_or_default();
        for op in ops {
            match op {
                PlanOp::Move { col, row } => {
                    if board.occ.contains_key(&cell_key(col, row)) {
                        break;
                    }
                    let (old_col, old_row) = board
                        .find(unit_id)
                        .map(|u| (u.q, u.r))
                        .expect("zrodlo planu musi istniec na klonie");
                    board.occ.remove(&cell_key(old_col, old_row));
                    board.occ.insert(cell_key(col, row), unit_id.to_string());
                    let unit = board
                        .find_mut(unit_id)
                        .expect("zrodlo planu musi istniec na klonie");
                    unit.q = col;
                    unit.r = row;
                    if intent.kind != AutoBatchIntentKind::Attack {
                        intent.kind = AutoBatchIntentKind::Move;
                    }
                    intent.steps.push(AutoBatchStep { col, row });
                }
                PlanOp::Set { col, row } => {
                    let unit = board
                        .find_mut(unit_id)
                        .expect("zrodlo planu musi istniec na klonie");
                    unit.q = col;
                    unit.r = row;
                }
                PlanOp::Attack { target } => {
                    intent.kind = AutoBatchIntentKind::Attack;
                    intent.target_id = Some(target);
                }
            }
        }
    }

    fn check_end(&mut self, _st: &mut BatchState) -> bool {
        false
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

fn battle_side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("nieznana strona wektora: {other}"),
    }
}

fn side_str(s: AutoBatchPhase) -> &'static str {
    match s {
        AutoBatchPhase::Atk => "atk",
        AutoBatchPhase::Def => "def",
    }
}

fn kind_str(k: AutoBatchIntentKind) -> &'static str {
    match k {
        AutoBatchIntentKind::Hold => "hold",
        AutoBatchIntentKind::Move => "move",
        AutoBatchIntentKind::Attack => "attack",
    }
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
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        },
    }
}

/// Stan startowy planowania z wektora V2: zywe rostery i zajetosc kafelkow (jak `occByKey` sceny).
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
    BatchState::new(board)
}

fn scripts_of(setup: &Value) -> HashMap<String, Vec<PlanOp>> {
    setup["scripts"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(id, ops)| {
            let ops = ops
                .as_array()
                .unwrap()
                .iter()
                .map(|op| match op["op"].as_str().unwrap() {
                    "move" => PlanOp::Move {
                        col: op["col"].as_f64().unwrap(),
                        row: op["row"].as_f64().unwrap(),
                    },
                    "set" => PlanOp::Set {
                        col: op["col"].as_f64().unwrap(),
                        row: op["row"].as_f64().unwrap(),
                    },
                    "attack" => PlanOp::Attack {
                        target: op["target"].as_str().unwrap().to_string(),
                    },
                    other => panic!("nieznana operacja skryptu: {other}"),
                })
                .collect();
            (id.clone(), ops)
        })
        .collect()
}

fn vectors_of(family: &str) -> Vec<Value> {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    doc["vectors"]
        .as_array()
        .expect("vectors")
        .iter()
        .filter(|v| v["family"] == family)
        .cloned()
        .collect()
}

/// Oczekiwana intencja z pinu: (unit_id, side, kind, kroki, target_id).
type IntentRow = (String, String, String, Vec<(f64, f64)>, Option<String>);

#[test]
fn v2_snapshot_intents_match_pin() {
    let vectors = vectors_of("v2");
    assert_eq!(vectors.len(), 6, "liczba wektorow V2");
    for v in &vectors {
        let id = v["id"].as_str().unwrap();
        let setup = &v["setup"];
        let mut st = build_state(setup);
        let mut env = PlanEnv {
            scripts: scripts_of(setup),
        };
        let units: Vec<String> = setup["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| u.as_str().unwrap().to_string())
            .collect();
        let side = side_of(setup["side"].as_str().unwrap());

        let got: Vec<IntentRow> = snapshot_auto_batch_intents(&mut st, &mut env, side, &units)
            .into_iter()
            .map(|i| {
                (
                    i.unit_id,
                    side_str(i.side).to_string(),
                    kind_str(i.kind).to_string(),
                    i.steps.iter().map(|s| (s.col, s.row)).collect(),
                    i.target_id,
                )
            })
            .collect();
        let want: Vec<IntentRow> = v["expect"]["intents"]
            .as_array()
            .unwrap()
            .iter()
            .map(|i| {
                (
                    i["unit_id"].as_str().unwrap().to_string(),
                    i["side"].as_str().unwrap().to_string(),
                    i["kind"].as_str().unwrap().to_string(),
                    i["steps"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|s| (s["col"].as_f64().unwrap(), s["row"].as_f64().unwrap()))
                        .collect(),
                    i["target_id"].as_str().map(str::to_string),
                )
            })
            .collect();
        assert_eq!(got, want, "intencje wektora {id}");

        // Zywa plansza po planowaniu musi byc identyczna jak przed (klony, nie live).
        let live: Vec<Value> = st
            .board
            .all()
            .map(|u| serde_json::json!({ "id": u.id, "q": u.q, "r": u.r }))
            .collect();
        let live_want = v["expect"]["live_after"].as_array().unwrap();
        assert_eq!(live.len(), live_want.len(), "liczba zywych jednostek {id}");
        for (g, w) in live.iter().zip(live_want) {
            assert_eq!(g["id"], w["id"], "id zywej jednostki {id}");
            assert_eq!(g["q"].as_f64(), w["q"].as_f64(), "q zywej jednostki {id}");
            assert_eq!(g["r"].as_f64(), w["r"].as_f64(), "r zywej jednostki {id}");
        }
        assert_eq!(
            st.board.occ.len(),
            v["expect"]["live_occ_after"].as_array().unwrap().len(),
            "zajetosc zywej planszy {id}"
        );
    }
}

#[test]
fn v7_steady_rally_matches_pin() {
    let vectors = vectors_of("v7");
    assert_eq!(vectors.len(), 6, "liczba wektorow V7");
    for v in &vectors {
        let id = v["id"].as_str().unwrap();
        let setup = &v["setup"];
        let unit = &setup["unit"];
        let meta = &v["expect"]["meta"];
        let side = battle_side_of(unit["side"].as_str().unwrap());
        let q = unit["q"].as_i64().unwrap();

        assert_eq!(
            GroupDoctrine::parse(meta["doctrine"].as_str().unwrap()),
            Some(GroupDoctrine::Steady),
            "doktryna {id}"
        );
        assert_eq!(meta["auto_play"].as_bool(), Some(true), "autoPlay {id}");
        let rally_col = meta["rally_col"].as_i64().unwrap();
        let rally_row = meta["rally_row"].as_i64().unwrap();

        if unit["group"].is_null() {
            // Pojedyncza jednostka: cel = _forwardCol(side, q, 2), wiersz = r (pin :17645-17646).
            assert_eq!(rally_col, forward_col(side, q, 2), "cel dwoch kolumn {id}");
            assert_eq!(rally_row, unit["r"].as_i64().unwrap(), "wiersz celu {id}");
        } else {
            // Grupa steady: cel zapisany przez _setGroupDoctrine = _forwardCol(side, centroid.col, 2) (pin :17894).
            let centroid = setup["group_centroid_col"].as_i64().unwrap();
            assert_eq!(rally_col, forward_col(side, centroid, 2), "cel grupy {id}");
        }
    }
}

#[test]
fn v7_forward_col_clamps_to_board() {
    // Granice z wektorow: lewy brzeg (obrona, kolumna 1 -> 0) i prawy brzeg (atak, 66 -> 67).
    assert_eq!(forward_col(BattleSide::Defender, 1, 2), 0);
    assert_eq!(forward_col(BattleSide::Attacker, 66, 2), 67);
}
