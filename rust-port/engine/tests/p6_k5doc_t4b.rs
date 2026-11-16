//! P6 SIEGE-TAKTYKA K5DOC-T4b (dispatch R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE): testy zgodnosci decyzji `_advanceStep`
//! z pinem `07d2fbd72` (`gra/src/battle/battleScene.ts:8198-8285`) z portem `advance_step_decide` i `advance_after_move`.
//!
//! Wektory: `p6_k5doc_t4b_vectors/vectors.json`, generowane przez `p6_k5doc_t4b_gen.mjs`, ktory WYKONUJE tekst pina
//! (transpilacja TypeScript). Stan sceny (`_canAttackFrom`, `_pickAdjacentTargetByPriority`, `_nearestEnemy`,
//! `_shouldAvoidAutoBacktrack`, `_compactAttackAllowsStep`, `_passableForUnit`, `occByKey`) jest wstrzykiwany z wektora;
//! krok 2 (C-FLANK) jest nieosiagalny dla `attackDirection = front`.
//!
//! Nazwane przypadki (asercje wprost, z odniesieniem do linii pina) pokrywaja zakres dispatchu:
//! * prelude `finished` / `dead` / `fadingOut` / `moveLeft <= 0` (`:8199-8202`),
//! * atak z obecnej pozycji (`:8241-8246`) i brak wroga (`:8248-8249`),
//! * marsz BFS pierwszym krokiem (`:8256-8260`), zapis `then` = `previousPosition` (`:8272`),
//! * anty-cofanie `lastAutoMoveFrom` (`:8259`),
//! * bramka kompaktu na kroku zachlannym (`:8270`) i asymetria `allowFirstStep` (`:8593`),
//! * callback po ruchu (`:8273-8284`): `Done` albo `Schedule(STEP_GAP_MS = 70)`.

use std::collections::HashSet;

use civ_engine::domain::siege_tactics_advance::{
    advance_after_move, advance_step_decide, AdvanceDecision, AdvanceUnit, AdvanceWorld, AfterStep,
};
use civ_engine::domain::siege_tactics_autobatch::{
    cell_key, AutoBatchEnv, BatchBoard, BatchState, CellKey,
};
use civ_engine::domain::siege_tactics_autophase::AutoBatchIntent;
use civ_engine::domain::siege_tactics_pathstep::Tile;
use serde::Deserialize;

const VECTORS: &str = include_str!("p6_k5doc_t4b_vectors/vectors.json");

/// Web `STEP_GAP_MS = 70` (`battleScene.ts:1011`).
const PIN_STEP_GAP_MS: u32 = 70;

#[derive(Deserialize)]
struct Vectors {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct UnitIn {
    id: String,
    q: f64,
    r: f64,
    dead: bool,
    fading_out: bool,
    move_left: f64,
    last_auto_move_from: Option<[f64; 2]>,
    avoid: bool,
}

#[derive(Deserialize, Clone)]
struct EnemyIn {
    id: String,
    q: f64,
    r: f64,
}

#[derive(Deserialize)]
struct AfterIn {
    finished: bool,
    move_left: f64,
}

#[derive(Deserialize)]
struct Expect {
    kind: String,
    #[serde(default)]
    target: Option<String>,
    #[serde(default)]
    col: Option<f64>,
    #[serde(default)]
    row: Option<f64>,
    #[serde(default)]
    then: Option<[f64; 2]>,
    #[serde(default)]
    after: Option<String>,
}

#[derive(Deserialize)]
struct Case {
    name: String,
    pin: String,
    finished: bool,
    unit: UnitIn,
    goal: Vec<[f64; 2]>,
    adjacent: Option<String>,
    target: Option<EnemyIn>,
    occupied: Vec<[f64; 2]>,
    impassable: Vec<[f64; 2]>,
    compact_forbidden_cols: Vec<f64>,
    after: AfterIn,
    expect: Expect,
}

fn vectors() -> Vec<Case> {
    serde_json::from_str::<Vectors>(VECTORS)
        .expect("vectors.json poprawny")
        .cases
}

fn named(name: &str) -> Case {
    vectors()
        .into_iter()
        .find(|c| c.name == name)
        .unwrap_or_else(|| panic!("brak nazwanego wektora {name}"))
}

/// Scena jednostki: zbiory z wektora (web `_makeCanAttackFromTest`, `_compactAttackAllowsStep` itd.).
struct Scene {
    goal: HashSet<CellKey>,
    adjacent: Option<String>,
    target: Option<(String, Tile)>,
    avoid: bool,
    compact_forbidden: Vec<f64>,
}

impl AdvanceWorld for Scene {
    fn can_attack_from(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        self.goal.contains(&cell_key(col, row))
    }
    fn pick_adjacent_target(&self, _unit_id: &str) -> Option<String> {
        self.adjacent.clone()
    }
    fn nearest_enemy(&self, _unit_id: &str) -> Option<(String, Tile)> {
        self.target.clone()
    }
    fn avoid_auto_backtrack(&self, _unit_id: &str) -> bool {
        self.avoid
    }
    fn compact_attack_allows_step(&self, _unit_id: &str, col: f64) -> bool {
        !self.compact_forbidden.contains(&col)
    }
}

/// Srodowisko `AutoBatchEnv`: jedyna uzywana metoda to `passable_for_unit` (web `_passableForUnit`).
struct TileEnv {
    impassable: HashSet<CellKey>,
}

impl AutoBatchEnv for TileEnv {
    fn plan_unit(
        &mut self,
        _board: &mut BatchBoard,
        _unit_id: &str,
        _intent: &mut AutoBatchIntent,
    ) {
        panic!("plan_unit poza zakresem K5DOC-T4b");
    }
    fn check_end(&mut self, _st: &mut BatchState) -> bool {
        panic!("check_end poza zakresem K5DOC-T4b");
    }
    fn passable_for_unit(&mut self, _st: &BatchState, _unit_id: &str, col: f64, row: f64) -> bool {
        !self.impassable.contains(&cell_key(col, row))
    }
    fn do_move(&mut self, _st: &mut BatchState, _unit_id: &str, _col: f64, _row: f64) {
        panic!("do_move poza zakresem K5DOC-T4b");
    }
    fn apply_terrain_range(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("apply_terrain_range poza zakresem K5DOC-T4b");
    }
    fn do_attack(&mut self, _st: &mut BatchState, _attacker_id: &str, _target_id: &str) {
        panic!("do_attack poza zakresem K5DOC-T4b");
    }
    fn flee_step(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("flee_step poza zakresem K5DOC-T4b");
    }
    fn remove_unit_from_scene(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("remove_unit_from_scene poza zakresem K5DOC-T4b");
    }
    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _unit_id: &str) {
        panic!("shake_allies_on_loss poza zakresem K5DOC-T4b");
    }
    fn can_strike_target_from(
        &mut self,
        _st: &BatchState,
        _attacker_id: &str,
        _col: f64,
        _row: f64,
        _target_id: &str,
    ) -> bool {
        panic!("can_strike_target_from poza zakresem K5DOC-T4b");
    }
}

/// Buduje stan z wektora: `st` (occ, finished), jednostka, scena i srodowisko.
fn build(case: &Case) -> (BatchState, TileEnv, Scene, AdvanceUnit) {
    let mut board = BatchBoard::default();
    for [c, r] in &case.occupied {
        board.occ.insert(cell_key(*c, *r), format!("occ@{c},{r}"));
    }
    let mut st = BatchState::new(board);
    st.clock.finished = case.finished;
    let env = TileEnv {
        impassable: case
            .impassable
            .iter()
            .map(|[c, r]| cell_key(*c, *r))
            .collect(),
    };
    let scene = Scene {
        goal: case.goal.iter().map(|[c, r]| cell_key(*c, *r)).collect(),
        adjacent: case.adjacent.clone(),
        target: case.target.clone().map(|t| (t.id, (t.q, t.r))),
        avoid: case.unit.avoid,
        compact_forbidden: case.compact_forbidden_cols.clone(),
    };
    let unit = AdvanceUnit {
        id: case.unit.id.clone(),
        q: case.unit.q,
        r: case.unit.r,
        dead: case.unit.dead,
        fading_out: case.unit.fading_out,
        move_left: case.unit.move_left,
        last_auto_move_from: case.unit.last_auto_move_from.map(|[c, r]| (c, r)),
    };
    (st, env, scene, unit)
}

fn decide(case: &Case) -> AdvanceDecision {
    let (st, mut env, scene, unit) = build(case);
    advance_step_decide(&scene, &mut env, &st, &unit)
}

/// Callback po ruchu na kafelek (col, row) z `move_left` i `finished` z wektora `after`.
fn after_move(case: &Case, col: f64, row: f64) -> AfterStep {
    let (mut st, _env, scene, mut unit) = build(case);
    st.clock.finished = case.after.finished;
    unit.q = col;
    unit.r = row;
    unit.move_left = case.after.move_left;
    advance_after_move(&scene, &st, &unit)
}

/// Porownuje wynik Rust z oczekiwaniem z pina (wektor): rodzaj, cel/kafelek, `then` i wynik callbacku.
fn check(case: &Case) {
    let got = decide(case);
    let e = &case.expect;
    let ctx = format!("{} ({})", case.name, case.pin);
    match got {
        AdvanceDecision::Done => {
            assert_eq!(e.kind, "done", "{ctx}: rust=Done");
        }
        AdvanceDecision::Attack { target_id } => {
            assert_eq!(e.kind, "attack", "{ctx}: rust=Attack");
            assert_eq!(
                e.target.as_deref(),
                Some(target_id.as_str()),
                "{ctx}: cel ataku"
            );
        }
        AdvanceDecision::Move { col, row, then } => {
            assert_eq!(e.kind, "move", "{ctx}: rust=Move");
            assert_eq!(e.col, Some(col), "{ctx}: kolumna kroku");
            assert_eq!(e.row, Some(row), "{ctx}: wiersz kroku");
            assert_eq!(
                e.then,
                then.map(|(c, r)| [c, r]),
                "{ctx}: then (lastAutoMoveFrom)"
            );
            let want = match after_move(case, col, row) {
                AfterStep::Done => "done".to_string(),
                AfterStep::Schedule { ms } => {
                    assert_eq!(ms, PIN_STEP_GAP_MS, "{ctx}: STEP_GAP_MS");
                    "schedule".to_string()
                }
            };
            assert_eq!(
                e.after.as_deref(),
                Some(want.as_str()),
                "{ctx}: wynik callbacku"
            );
        }
    }
}

#[test]
fn wszystkie_wektory_zgodne_z_pinem() {
    let cases = vectors();
    assert!(cases.len() >= 500, "za malo wektorow: {}", cases.len());
    for case in &cases {
        check(case);
    }
}

#[test]
fn pokrycie_galezi_wektorow() {
    let cases = vectors();
    let has = |kind: &str| cases.iter().any(|c| c.expect.kind == kind);
    assert!(has("done") && has("attack") && has("move"));
    assert!(cases
        .iter()
        .any(|c| c.expect.after.as_deref() == Some("done")));
    assert!(cases
        .iter()
        .any(|c| c.expect.after.as_deref() == Some("schedule")));
    assert!(cases.iter().any(|c| c.expect.then.is_some()));
}

#[test]
fn prelude_zatrzymuje_przed_atakiem_i_marszem() {
    // pin :8199-8202: finished, dead/fadingOut, moveLeft <= 0 -> done (przed krokiem 3 i przed atakiem).
    assert_eq!(decide(&named("prelude_finished")), AdvanceDecision::Done);
    assert_eq!(decide(&named("prelude_dead")), AdvanceDecision::Done);
    assert_eq!(decide(&named("prelude_fading_out")), AdvanceDecision::Done);
    assert_eq!(
        decide(&named("prelude_move_left_zero_przed_atakiem")),
        AdvanceDecision::Done
    );
}

#[test]
fn atak_z_pozycji_i_brak_wroga() {
    // pin :8241-8246: sasiad -> _doAttack; brak sasiada -> done (:8244). :8248-8249: brak wroga -> done.
    assert_eq!(
        decide(&named("attack_sasiad")),
        AdvanceDecision::Attack {
            target_id: "e2".to_string()
        }
    );
    assert_eq!(
        decide(&named("attack_brak_sasiada_done")),
        AdvanceDecision::Done
    );
    assert_eq!(decide(&named("brak_wroga_done")), AdvanceDecision::Done);
}

#[test]
fn marsz_pierwszym_krokiem_i_zapis_then() {
    // pin :8256-8260: BFS pierwszy krok (5,6); then = previousPosition (:8272) tylko przy avoidAutoBacktrack.
    assert_eq!(
        decide(&named("marsz_bfs_pierwszy_krok")),
        AdvanceDecision::Move {
            col: 5.0,
            row: 6.0,
            then: None
        }
    );
    assert_eq!(
        decide(&named("marsz_avoid_zapisuje_then")),
        AdvanceDecision::Move {
            col: 5.0,
            row: 6.0,
            then: Some((5.0, 5.0))
        }
    );
}

#[test]
fn anty_cofanie_omija_last_auto_move_from() {
    // pin :8259: avoid && lastAutoMoveFrom == kandydat -> niedozwolony pierwszy krok (5,6).
    let d = decide(&named("marsz_avoid_omija_lastAutoMoveFrom"));
    assert!(
        !matches!(d, AdvanceDecision::Move { col, row, .. } if col == 5.0 && row == 6.0),
        "krok na lastAutoMoveFrom przy avoid: {d:?}"
    );
    // bez avoid lastAutoMoveFrom nie blokuje.
    assert_eq!(
        decide(&named("marsz_bez_avoid_ignoruje_lastAutoMoveFrom")),
        AdvanceDecision::Move {
            col: 5.0,
            row: 6.0,
            then: None
        }
    );
}

#[test]
fn greedy_bramka_kompaktu_i_asymetria_allow_first_step() {
    // pin :8270: kompakt odrzuca krok zachlanny -> done (BFS nieosiagalny, greedy (5,6) kolumna 5).
    assert_eq!(
        decide(&named("greedy_bramka_8270_zabija_krok")),
        AdvanceDecision::Done
    );
    assert_eq!(
        decide(&named("greedy_krok_dozwolony")),
        AdvanceDecision::Move {
            col: 5.0,
            row: 6.0,
            then: None
        }
    );
    // pin :8593: zakaz kompaktu dla kroku z cur != start NIE dotyczy dalszych krokow BFS.
    assert_eq!(
        decide(&named("asymetria_allowFirst_dalszy_krok_dozwolony")),
        AdvanceDecision::Move {
            col: 5.0,
            row: 6.0,
            then: None
        }
    );
    assert_eq!(
        decide(&named("brak_kroku_bfs_i_greedy_done")),
        AdvanceDecision::Done
    );
}

#[test]
fn callback_po_ruchu_done_albo_schedule() {
    // pin :8273-8284: finished (:8275) / pozycja ataku (:8277) / brak ruchu (:8281-8282) -> done; zostal ruch (:8279-8280) -> _schedule(STEP_GAP_MS).
    assert_eq!(
        after_move(&named("po_ruchu_schedule_gdy_zostal_ruch"), 5.0, 6.0),
        AfterStep::Schedule {
            ms: PIN_STEP_GAP_MS
        }
    );
    assert_eq!(
        after_move(&named("po_ruchu_done_pozycja_ataku"), 5.0, 6.0),
        AfterStep::Done
    );
    assert_eq!(
        after_move(&named("po_ruchu_done_brak_ruchu"), 5.0, 6.0),
        AfterStep::Done
    );
    assert_eq!(
        after_move(&named("po_ruchu_done_finished"), 5.0, 6.0),
        AfterStep::Done
    );
}
