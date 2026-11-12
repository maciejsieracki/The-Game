//! P6 SIEGE-TAKTYKA K1b (#217, runda 1 Operatora): czysta czesc petli marszu oblezniczego.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`bfs_first_step`] = `_bfsFirstStep` (`battleScene.ts:7973-8003`): BFS pierwszego kroku do najblizszego kafla
//!   spelniajacego `isGoal`; `prefRow` sortuje kierunki (stabilnie, jak `Array.prototype.sort`), `maxVisited` = limit
//!   odwiedzin (domyslnie 6000).
//! * [`walk_decide`] = poczatek `_siegeWalkTo` (`:8010-8013`): warunki zakonczenia i wybor kroku.
//! * [`walk_after_move`] = kontynuacja po `_doMove` (`:8015-8017`): warunki zakonczenia albo zaplanowanie kolejnego kroku
//!   (`_schedule(STEP_GAP_MS, ...)`).
//! * [`do_move_gate`] = galaz odmowy `_doMove` (`:8689-8693`): `siegeWallCol >= 0 && _siegeMoveRefused(ru, col, row)`.
//! * [`siege_walk_to`] = petla `_siegeWalkTo` zlozona z powyzszych krokow, zwracajaca LISTE ZDARZEN (patrz nizej).
//!
//! EFEKTY SCENY NIE SA PORTOWANE (jawne wyjscie, bez stubow): `_doMove` poza bramka (przeniesienie w `occByKey`,
//! koszt wejscia `_moveCostForUnit` i bród, `_updateFacing`, `intent.steps`, animacja `tileTopY`/`cellToWorld`,
//! `busy`) oraz `_schedule` (kolejka timerow sceny) naleza do WOLAJACEGO. Kontrakt:
//! * [`WalkWorld::do_move`] wykonuje efekt sceny TYLKO gdy zwraca [`DoMoveGate::Proceed`]; przy [`DoMoveGate::Refused`]
//!   nie zmienia stanu (driver ustawia `unit.move_left = 0`, jak web `ru.moveLeft = 0`),
//! * [`WalkEvent::Schedule`] oznacza `_schedule(STEP_GAP_MS, ...)`: scena ma ponowic [`walk_decide`] po `ms` milisekundach
//!   (tu driver kontynuuje synchronicznie, co jest rownowazne tylko przy jednej jednostce bez przeplatajacych sie timerow),
//! * `finished`, `pref_row`, `allow_tile`, `is_goal`, `passable_free` sa odczytami sceny w chwili wywolania (argumenty
//!   `_siegeWalkTo`), `passable_free` = web `!this.occByKey.has(k) && this._passableForUnit(ru, c, r)`.
//!
//! Wejscia `NaN`: `prefRow` nie jest `f64` (web: liczba calkowita z `siegeGateRow`), wiec NaN nie wystepuje w tej sciezce.
//! `ru.moveLeft` i `ru.moveLeft <= 0` sa `f64` z ta sama semantyka porownan JS (NaN nie konczy marszu).
//!
//! Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (wiersze 30, 33.22, 32.18).

use std::collections::{HashMap, HashSet};

use super::siege_tactics_approach::{
    siege_move_refused, ApproachUnit, ApproachWallState, Threat, BF_COLS, BF_ROWS,
};

/// Web `battleScene.ts:1011` `STEP_GAP_MS = 70`.
pub const STEP_GAP_MS: u32 = 70;
/// Web `battleScene.ts:7978` domyslne `maxVisited = 6000` w `_bfsFirstStep`.
pub const WALK_BFS_MAX_VISITED: usize = 6000;
/// Web `battleScene.ts:326-331` `DIR_DELTA` = `DIRS4` (kolejnosc N, E, S, W).
const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Stan jednostki potrzebny petli marszu (pola `ru`, ktore czyta `_siegeWalkTo`/`_doMove`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WalkUnit {
    pub q: i64,
    pub r: i64,
    /// Web `ru.moveLeft` (liczba; NaN nie spelnia `<= 0`, jak w JS).
    pub move_left: f64,
    pub dead: bool,
    pub fading_out: bool,
}

/// Wynik bramki `_doMove`: `Refused` = web `if (siegeWallCol >= 0 && _siegeMoveRefused(...)) { ru.moveLeft = 0; done(); }`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DoMoveGate {
    Refused,
    Proceed,
}

/// Decyzja `_siegeWalkTo` przed krokiem.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WalkDecision {
    /// web `done()`.
    Done,
    /// web `this._doMove(ru, nc, nr, ...)` z pierwszym krokiem BFS.
    Move { col: i64, row: i64 },
}

/// Kontynuacja po `_doMove` (web `:8016-8017`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AfterMove {
    Done,
    /// web `this._schedule(STEP_GAP_MS, () => this._siegeWalkTo(...))`.
    ScheduleNext {
        ms: u32,
    },
}

/// Zdarzenie wyjsciowe [`siege_walk_to`] (lista zdarzen = jawny opis efektow dla wolajacego).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WalkEvent {
    /// `_doMove` przeszedl (wolajacy wykonal efekt sceny, patrz [`WalkWorld::do_move`]).
    Move { col: i64, row: i64 },
    /// `_doMove` odrzucony bramka `_siegeMoveRefused`; `move_left` ustawione na 0, marsz konczy sie.
    Refused { col: i64, row: i64 },
    /// `_schedule(ms, ...)`: kolejny krok po `ms` milisekundach.
    Schedule { ms: u32 },
    /// web `done()`.
    Done,
}

/// Odczyty sceny i efekt `_doMove` potrzebne petli marszu (wejscia jawne; implementacja po stronie sceny lub testu).
pub trait WalkWorld {
    /// web `this.finished`.
    fn finished(&self) -> bool;
    /// web `isGoal(col, row)` przekazywane do `_siegeWalkTo`.
    fn is_goal(&self, col: i64, row: i64) -> bool;
    /// web `!this.occByKey.has(k) && this._passableForUnit(ru, col, row)`.
    fn passable_free(&self, col: i64, row: i64) -> bool;
    /// web `allowTile(col, row)`; `undefined` w webie = wszystkie kafle dopuszczone (domyslna implementacja).
    fn allow_tile(&self, _col: i64, _row: i64) -> bool {
        true
    }
    /// web `prefRow` (`undefined`/`null` = `None`).
    fn pref_row(&self) -> Option<i64> {
        None
    }
    /// Efekt `_doMove(ru, col, row)`: bramka + (dla `Proceed`) przeniesienie jednostki i jej koszt.
    fn do_move(&mut self, unit: &mut WalkUnit, col: i64, row: i64) -> DoMoveGate;
}

/// Web `battleScene.ts:7973-8003` `_bfsFirstStep(ru, isGoal, allowTile, prefRow, maxVisited)`.
///
/// Zwraca PIERWSZY krok (kafel sasiedni startu) prowadzacy do najblizszego kafla spelniajacego `is_goal`, albo `None`.
/// Start nie jest kandydatem (jest w `seen`). Kafel celu musi przejsc `passable` i `allow_tile` (jak w webie: sprawdzenia
/// przed `isGoal`). Cel jest zwracany w chwili odkrycia (nie przy zdejmowaniu z kolejki).
pub fn bfs_first_step<G, P, A>(
    start: (i64, i64),
    is_goal: G,
    passable: P,
    allow_tile: A,
    pref_row: Option<i64>,
    max_visited: usize,
) -> Option<(i64, i64)>
where
    G: Fn(i64, i64) -> bool,
    P: Fn(i64, i64) -> bool,
    A: Fn(i64, i64) -> bool,
{
    let mut first: HashMap<(i64, i64), (i64, i64)> = HashMap::new();
    let mut seen: HashSet<(i64, i64)> = HashSet::new();
    seen.insert(start);
    let mut frontier: Vec<(i64, i64)> = vec![start];
    let mut head = 0usize;
    while head < frontier.len() && head < max_visited {
        let (cc, cr) = frontier[head];
        head += 1;
        // Web: prefRow == null -> DIRS4; inaczej stabilne sortowanie wg |cr + dr - prefRow|.
        let mut dirs = DIRS4;
        if let Some(pr) = pref_row {
            dirs.sort_by_key(|&(_, dr)| (cr + dr - pr).abs());
        }
        for (dc, dr) in dirs {
            let (nc, nr) = (cc + dc, cr + dr);
            if nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS {
                continue;
            }
            let k = (nc, nr);
            if !seen.insert(k) {
                continue;
            }
            if !passable(nc, nr) {
                continue;
            }
            if !allow_tile(nc, nr) {
                continue;
            }
            // web: first.set(k, cc === ru.q && cr === ru.r ? k : first.get(cc) ?? k)
            let f = if (cc, cr) == start {
                k
            } else {
                first.get(&(cc, cr)).copied().unwrap_or(k)
            };
            first.insert(k, f);
            if is_goal(nc, nr) {
                return Some(f);
            }
            frontier.push(k);
        }
    }
    None
}

/// Web `battleScene.ts:8010-8013`: warunki zakonczenia `_siegeWalkTo` i wybor pierwszego kroku.
pub fn walk_decide<W: WalkWorld + ?Sized>(world: &W, unit: &WalkUnit) -> WalkDecision {
    if world.finished() || unit.dead || unit.fading_out || unit.move_left <= 0.0 {
        return WalkDecision::Done;
    }
    if world.is_goal(unit.q, unit.r) {
        return WalkDecision::Done;
    }
    match bfs_first_step(
        (unit.q, unit.r),
        |c, r| world.is_goal(c, r),
        |c, r| world.passable_free(c, r),
        |c, r| world.allow_tile(c, r),
        world.pref_row(),
        WALK_BFS_MAX_VISITED,
    ) {
        Some((col, row)) => WalkDecision::Move { col, row },
        None => WalkDecision::Done,
    }
}

/// Web `battleScene.ts:8016-8017`: po udanym `_doMove` -- koniec albo kolejny krok po `STEP_GAP_MS`.
/// (Uwaga: web nie sprawdza `fadingOut` w tej galezi, tylko `dead`.)
pub fn walk_after_move<W: WalkWorld + ?Sized>(world: &W, unit: &WalkUnit) -> AfterMove {
    if world.finished() || unit.dead || world.is_goal(unit.q, unit.r) || unit.move_left <= 0.0 {
        AfterMove::Done
    } else {
        AfterMove::ScheduleNext { ms: STEP_GAP_MS }
    }
}

/// Web `battleScene.ts:8689-8693` (galaz odmowy `_doMove`): `siegeWallCol >= 0 && _siegeMoveRefused(ru, col, row)`.
///
/// `threats` = wynik `_siegeShooterThreats()` (wejscie jawne, patrz `siege_tactics_approach::siege_move_refused`).
/// `from` = `(ru.q, ru.r)` przed krokiem, `to` = `(col, row)`.
pub fn do_move_gate(
    wall_col_ge0: bool,
    ru: &ApproachUnit,
    wall: &ApproachWallState,
    threats: &[Threat],
    from: (i64, i64),
    to: (i64, i64),
) -> DoMoveGate {
    let refused = wall_col_ge0
        && siege_move_refused(
            ru,
            wall,
            threats,
            (from.0 as f64, from.1 as f64),
            (to.0 as f64, to.1 as f64),
        );
    if refused {
        DoMoveGate::Refused
    } else {
        DoMoveGate::Proceed
    }
}

/// Pelna petla `_siegeWalkTo` dla jednej jednostki jako sekwencja zdarzen (patrz kontrakt w opisie modulu).
///
/// Kolejnosc zdarzen odpowiada wywolaniom webowym: `Move` lub `Refused` po kazdym `_doMove`, potem `Schedule` (gdy
/// marsz trwa) i w koncu dokladnie jedno `Done`.
pub fn siege_walk_to<W: WalkWorld>(world: &mut W, unit: &mut WalkUnit) -> Vec<WalkEvent> {
    let mut events = Vec::new();
    loop {
        let (col, row) = match walk_decide(&*world, unit) {
            WalkDecision::Done => {
                events.push(WalkEvent::Done);
                return events;
            }
            WalkDecision::Move { col, row } => (col, row),
        };
        match world.do_move(unit, col, row) {
            DoMoveGate::Refused => {
                // web _doMove: ru.moveLeft = 0; done();
                unit.move_left = 0.0;
                events.push(WalkEvent::Refused { col, row });
                events.push(WalkEvent::Done);
                return events;
            }
            DoMoveGate::Proceed => events.push(WalkEvent::Move { col, row }),
        }
        match walk_after_move(&*world, unit) {
            AfterMove::Done => {
                events.push(WalkEvent::Done);
                return events;
            }
            AfterMove::ScheduleNext { ms } => events.push(WalkEvent::Schedule { ms }),
        }
    }
}
