//! P6 SIEGE-TAKTYKA K5DOC-T4b (dispatch R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE, runda 1, Operator): decyzja `_advanceStep`
//! (kroki 1-10 wg `dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` §3.1).
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`, `_advanceStep` `:8198-8285`):
//! * [`advance_step_decide`] zwraca [`AdvanceDecision`]: `Done` (web `done()`), `Attack` (web `_doAttack`) albo `Move`
//!   (web `_doMove`). Pole `then` = wartosc zapisywana do `lastAutoMoveFrom` w callbacku `_doMove` (web `previousPosition`,
//!   tylko gdy `avoidAutoBacktrack`); `None` = callback nic nie zapisuje.
//! * [`advance_after_move`] = callback `_doMove` po przesunieciu (`:8273-8284`): `Done` albo `Schedule` (web
//!   `_schedule(STEP_GAP_MS, ...)`).
//!
//! CELOWO POMINIETE: krok 2 (C-FLANK, `:8201-8227`, tylko `attackDirection` bok/tyl; osobny klocek T4d). Wejscie jest
//! z definicji `front`, wiec ten blok nie wystepuje w decyzji. Efekty `_doMove`, `_doAttack` i `_schedule` naleza do
//! wolajacego (T4c/T4e); ta funkcja ich nie wykonuje.
//!
//! Odczyty sceny (`_canAttackFrom`, `_pickAdjacentTargetByPriority`, `_nearestEnemy`, `_shouldAvoidAutoBacktrack`,
//! `_compactAttackAllowsStep`) wchodza przez [`AdvanceWorld`]. Helpery sciezki (`_firstStepAlongPathToAttack`, `_stepToward`)
//! sa portami z [`super::siege_tactics_pathstep`] (T4a), z zachowana asymetria `allowFirstStep` (tylko pierwszy krok).
//! Kolejnosc decyzji: prelude (1), atak z obecnej pozycji (3), najblizszy wrog (4), marsz BFS albo greedy (5-6),
//! bramka kompaktu na kroku koncowym (8), zapis `previousPosition` (9), `Move` (10).

use super::siege_tactics_autobatch::{AutoBatchEnv, BatchState};
use super::siege_tactics_pathstep::{first_step_along_path_to_attack, step_toward, Tile};
use super::siege_tactics_walk::STEP_GAP_MS;

/// Jednostka wchodzaca w decyzje (pola `ru` czytane przez `_advanceStep`). `id` identyfikuje jednostke w
/// [`AdvanceWorld`] i w [`BatchState`].
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceUnit {
    pub id: String,
    pub q: f64,
    pub r: f64,
    pub dead: bool,
    pub fading_out: bool,
    /// Web `ru.moveLeft` (liczba skonczona; `NaN` nie spelnia `<= 0`, jak w JS).
    pub move_left: f64,
    /// Web `ru.lastAutoMoveFrom` (`undefined` = `None`).
    pub last_auto_move_from: Option<Tile>,
}

/// Wynik decyzji `_advanceStep` przed efektami sceny.
#[derive(Debug, Clone, PartialEq)]
pub enum AdvanceDecision {
    /// Web `done()`.
    Done,
    /// Web `this._doAttack(ru, adjacent, done)` z sasiadem wybranym przez `_pickAdjacentTargetByPriority`.
    Attack { target_id: String },
    /// Web `this._doMove(ru, nc, nr, cb)`. `then` = wartosc `lastAutoMoveFrom` z callbacku (`previousPosition`).
    Move {
        col: f64,
        row: f64,
        then: Option<Tile>,
    },
}

/// Wynik callbacku `_doMove` po przesunieciu (web `:8273-8284`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AfterStep {
    /// Web `done()`.
    Done,
    /// Web `this._schedule(STEP_GAP_MS, () => this._advanceStep(ru, done))`.
    Schedule { ms: u32 },
}

/// Odczyty sceny potrzebne decyzji (wejscia jawne; implementacja w scenie albo w tescie).
pub trait AdvanceWorld {
    /// Web `_canAttackFrom(ru, col, row)` (oraz `_makeCanAttackFromTest(ru)` dla BFS: ten sam wynik).
    fn can_attack_from(&self, unit_id: &str, col: f64, row: f64) -> bool;
    /// Web `_pickAdjacentTargetByPriority(ru)`: sasiad do ataku albo `None`.
    fn pick_adjacent_target(&self, unit_id: &str) -> Option<String>;
    /// Web `_nearestEnemy(ru)`: id i kafelek najblizszego wroga albo `None`.
    fn nearest_enemy(&self, unit_id: &str) -> Option<(String, Tile)>;
    /// Web `_shouldAvoidAutoBacktrack(ru)`.
    fn avoid_auto_backtrack(&self, unit_id: &str) -> bool;
    /// Web `_compactAttackAllowsStep(ru, col)`: bramka kroku zwarcia dla kolumny kandydata.
    fn compact_attack_allows_step(&self, unit_id: &str, col: f64) -> bool;
}

/// Web `_advanceStep(ru, done)` bez C-FLANK i bez efektow: decyzja na podstawie stanu sceny i jednostki.
pub fn advance_step_decide<W, E>(
    world: &W,
    env: &mut E,
    st: &BatchState,
    unit: &AdvanceUnit,
) -> AdvanceDecision
where
    W: AdvanceWorld + ?Sized,
    E: AutoBatchEnv,
{
    // Web :8199-8203: finished, dead/fadingOut, moveLeft <= 0.
    if st.finished() || unit.dead || unit.fading_out || unit.move_left <= 0.0 {
        return AdvanceDecision::Done;
    }
    // Web :8229-8236: atak z obecnej pozycji, bez sasiada -> done.
    if world.can_attack_from(&unit.id, unit.q, unit.r) {
        return match world.pick_adjacent_target(&unit.id) {
            Some(target_id) => AdvanceDecision::Attack { target_id },
            None => AdvanceDecision::Done,
        };
    }
    // Web :8238-8239: brak wroga -> done.
    let Some((_target_id, target_pos)) = world.nearest_enemy(&unit.id) else {
        return AdvanceDecision::Done;
    };
    // Web :8241-8247: avoidAutoBacktrack i allow = bramka kompaktu && brak powrotu na lastAutoMoveFrom.
    let start = (unit.q, unit.r);
    let avoid = world.avoid_auto_backtrack(&unit.id);
    let last = unit.last_auto_move_from;
    let is_goal = |c: f64, r: f64| world.can_attack_from(&unit.id, c, r);
    let allow = |c: f64, r: f64| {
        world.compact_attack_allows_step(&unit.id, c) && !(avoid && last == Some((c, r)))
    };
    // Web :8245-8247: `_firstStepAlongPathToAttack(ru, allow) ?? _stepToward(ru, target)`.
    let bfs = first_step_along_path_to_attack(
        env,
        st,
        &unit.id,
        start,
        &is_goal,
        Some(&allow as &dyn Fn(f64, f64) -> bool),
    );
    let step = match bfs {
        Some(tile) => Some(tile),
        None => step_toward(env, st, &unit.id, start, target_pos),
    };
    // Web :8248-8250: brak kroku -> done.
    let Some((col, row)) = step else {
        return AdvanceDecision::Done;
    };
    // Web :8251: bramka kompaktu takze dla kroku zachlannego (poza filtrem BFS).
    if !world.compact_attack_allows_step(&unit.id, col) {
        return AdvanceDecision::Done;
    }
    // Web :8252-8253: previousPosition tylko gdy avoidAutoBacktrack; zapisywane w callbacku `_doMove`.
    AdvanceDecision::Move {
        col,
        row,
        then: avoid.then_some(start),
    }
}

/// Web `_advanceStep` callback `_doMove` (`:8273-8284`): po przesunieciu koniec albo kolejny krok po `STEP_GAP_MS`.
/// `unit` = stan PO przesunieciu; `st` = stan sceny PO przesunieciu (`finished`). Zapis `lastAutoMoveFrom` wykonuje
/// wolajacy wedlug `then` z [`AdvanceDecision::Move`].
pub fn advance_after_move<W>(world: &W, st: &BatchState, unit: &AdvanceUnit) -> AfterStep
where
    W: AdvanceWorld + ?Sized,
{
    if st.finished() {
        return AfterStep::Done;
    }
    if world.can_attack_from(&unit.id, unit.q, unit.r) {
        return AfterStep::Done;
    }
    if unit.move_left > 0.0 {
        AfterStep::Schedule { ms: STEP_GAP_MS }
    } else {
        AfterStep::Done
    }
}
