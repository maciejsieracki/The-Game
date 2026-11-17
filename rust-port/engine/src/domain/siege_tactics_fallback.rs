//! P6 SIEGE-TAKTYKA K5DOC-T7b (dispatch R-RUSTPORT-P6-K5DOC-T7B-ODWROT, runda 1, Operator): ODWROT strzelca bez
//! amunicji, czyli `_bestFallBackStep` i `_fallBackStep`.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`best_fall_back_step`] = `_bestFallBackStep` `:7186-7225`: DIRS4 (N, E, S, W), odrzut zajetego pola, nieprzejezdnego
//!   pola, `dMin <= 1`, `dMin < dNow`; wynik `homeBias * 100 + dMin`, `homeBias = atk ? -nc : nc`; `>` = pierwszy wygrywa
//!   remis; `None` = zaklinowany.
//! * [`fall_back_step_decide`] = poczatek `_fallBackStep` `:7228-7243`: guard (`finished`, `dead`/`fadingOut`,
//!   `moveLeft <= 0`) i wybor kroku. Wynik [`FallBackDecision::Move`] = wolajacy wykonuje `_doMove` przez
//!   [`super::siege_tactics_move_effects::do_move_effects`] (T4c).
//! * [`fall_back_after_move`] = callback `_doMove` (`:7238-7241`): `Done` albo `Schedule` (`_schedule(STEP_GAP_MS, ...)`).
//!   `_schedule` NIE jest wykonywany tutaj (UI/czas nalezy do sceny), zwracany jest [`AfterStep::Schedule`].
//!
//! Wejscia sceny (`_enemiesOf`, `_nearestEnemy`, `occByKey`, `_passableForUnit`) wchodza przez [`FallBackWorld`].
//! CELOWO POMINIETE: wiring do `ActivateUnit` / `siege_tactics_loop.rs` (`FallBackStep` nadal `unported`) oraz galaz
//! U7.6 w `siege_tactics_activate.rs` (wolajacy, poza zakresem tego klocka). Stala `FALLBACK_TILES` jest w
//! [`super::siege_tactics_activate`] i nie jest tu duplikowana.
//!
//! Typ domeny: wspolrzedne sa `f64` (jak w `siege_tactics_pathstep`/`siege_tactics_move_effects`). Granice `BF_COLS`
//! i `BF_ROWS` pochodza z [`super::siege_tactics_approach`] (`i64`) i sa rzutowane na `f64` jednorazowo w tym module.

use super::siege_tactics_advance::AfterStep;
use super::siege_tactics_approach::{BF_COLS, BF_ROWS};
use super::siege_tactics_pathstep::Tile;
use super::siege_tactics_walk::STEP_GAP_MS;

/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-337`): kolejnosc N, E, S, W. Kolejnosc decyduje o remisie.
const DIRS4: [(f64, f64); 4] = [(0.0, -1.0), (1.0, 0.0), (0.0, 1.0), (-1.0, 0.0)];

/// Jednostka wchodzaca w odwrot (pola `ru` czytane przez `_bestFallBackStep` i `_fallBackStep`).
#[derive(Debug, Clone, PartialEq)]
pub struct FallBackUnit {
    /// Identyfikator jednostki (przekazywany do [`FallBackWorld`]).
    pub id: String,
    /// Web `ru.q` (kolumna).
    pub q: f64,
    /// Web `ru.r` (wiersz).
    pub r: f64,
    /// Web `ru.side === 'atk'`.
    pub is_atk: bool,
    /// Web `ru.dead`.
    pub dead: bool,
    /// Web `ru.fadingOut`.
    pub fading_out: bool,
    /// Web `ru.moveLeft`.
    pub move_left: f64,
}

/// Odczyty sceny potrzebne odwrotowi (wejscia jawne; implementacja w scenie albo w tescie).
pub trait FallBackWorld {
    /// Web `_enemiesOf(ru)`: kafelki zywych, niezanikajacych, nierozbitych wrogow (tylko polozenia).
    fn enemies(&self, unit_id: &str) -> Vec<Tile>;
    /// Web `_nearestEnemy(ru)`: kafelek najblizszego wroga albo `None`.
    fn nearest_enemy(&self, unit_id: &str) -> Option<Tile>;
    /// Web `occByKey.has(cellKey(col, row))`.
    fn is_occupied(&self, col: f64, row: f64) -> bool;
    /// Web `_passableForUnit(ru, col, row)`.
    fn passable(&self, unit_id: &str, col: f64, row: f64) -> bool;
}

/// Decyzja jednego kroku odwrotu przed efektami sceny.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum FallBackDecision {
    /// Web `done()` (guard albo brak kroku, czyli zaklinowany).
    Done,
    /// Web `this._doMove(ru, nc, nr, cb)`; efekty wykonuje wolajacy (T4c).
    Move { col: f64, row: f64 },
}

fn manhattan(a: Tile, b: Tile) -> f64 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

/// Web `_bestFallBackStep(ru)` (`battleScene.ts:7186-7225`). Zwraca kafelek kroku albo `None` (zaklinowany).
pub fn best_fall_back_step<W: FallBackWorld + ?Sized>(
    world: &W,
    unit: &FallBackUnit,
) -> Option<Tile> {
    let enemies = world.enemies(&unit.id);
    if enemies.is_empty() {
        return None;
    }
    // Web: dNow = nearestNow ? manhattan(...) : Infinity.
    let d_now = match world.nearest_enemy(&unit.id) {
        Some(nearest) => manhattan((unit.q, unit.r), nearest),
        None => f64::INFINITY,
    };
    let cols = BF_COLS as f64;
    let rows = BF_ROWS as f64;

    let mut best: Option<Tile> = None;
    let mut best_score = f64::NEG_INFINITY;
    for (dc, dr) in DIRS4 {
        let nc = unit.q + dc;
        let nr = unit.r + dr;
        if nc < 0.0 || nc >= cols || nr < 0.0 || nr >= rows {
            continue;
        }
        if world.is_occupied(nc, nr) {
            continue;
        }
        if !world.passable(&unit.id, nc, nr) {
            continue;
        }
        // Web: dMin = min po wrogach (start Infinity; `<` zachowuje pierwszy minimalny).
        let mut d_min = f64::INFINITY;
        for &e in &enemies {
            let dd = manhattan((nc, nr), e);
            if dd < d_min {
                d_min = dd;
            }
        }
        if d_min <= 1.0 {
            continue;
        }
        if d_min < d_now {
            continue;
        }
        // Web: homeBias = ru.side === 'atk' ? -nc : nc.
        let home_bias = if unit.is_atk { -nc } else { nc };
        let score = home_bias * 100.0 + d_min;
        // Web `score > bestScore`: w remisie wygrywa pierwszy w kolejnosci DIRS4.
        if score > best_score {
            best_score = score;
            best = Some((nc, nr));
        }
    }
    best
}

/// Web `_fallBackStep(ru, done)` do wyboru kroku (`battleScene.ts:7228-7237`): guard i wybor kroku.
/// `finished` = web `this.finished`. Efekt `_doMove` nalezy do wolajacego.
pub fn fall_back_step_decide<W: FallBackWorld + ?Sized>(
    world: &W,
    finished: bool,
    unit: &FallBackUnit,
) -> FallBackDecision {
    // Web :7229-7231: finished, dead/fadingOut, moveLeft <= 0.
    if finished || unit.dead || unit.fading_out || unit.move_left <= 0.0 {
        return FallBackDecision::Done;
    }
    // Web :7233-7234: brak kroku -> done().
    match best_fall_back_step(world, unit) {
        Some((col, row)) => FallBackDecision::Move { col, row },
        None => FallBackDecision::Done,
    }
}

/// Web callback `_doMove` w `_fallBackStep` (`battleScene.ts:7238-7241`), po przesunieciu.
/// `finished` i `move_left_after` = stan PO efektach ruchu (T4c). Zwraca `Done` albo `Schedule` (`STEP_GAP_MS`).
pub fn fall_back_after_move(finished: bool, move_left_after: f64) -> AfterStep {
    if finished {
        AfterStep::Done
    } else if move_left_after > 0.0 {
        AfterStep::Schedule { ms: STEP_GAP_MS }
    } else {
        AfterStep::Done
    }
}
