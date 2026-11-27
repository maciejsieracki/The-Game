//! R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 (zadanie #415, krok T4): rozkazy gracza `attack` i `attackMove` w pętli
//! bitwy.
//!
//! Port 1:1 z webu, pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt):
//!   * `_performPlayerOrder` gałąź `attackMove` (`:18353-18394`) -> [`attack_move_order_step`] (zagrożenia na trasie
//!     [`attack_move_threats`]);
//!   * `_performPlayerOrder` gałąź `attack` (`:18395-18428`) -> [`attack_order_step`];
//!   * `_attackMovePath` (`:18535-18566`) -> [`attack_move_path`];
//!   * `_firstStepOnAttackMovePath` (`:18568-18572`) -> [`first_step_on_attack_move_path`].
//!
//! Decyzja techniczna D-415-T1 (Operator): osobny moduł zamiast rozszerzenia `player_order_move.rs` (T3 = 438 linii;
//! T4 ma własne wejścia: lista wrogów z flagami, `_canStrikeTargetFrom`, `_priorityScore`, klasyfikacja zajętości dla
//! `allowEnemyCells`). `player_order_move.rs` dostaje wyłącznie warianty [`PlayerOrder::Attack`] /
//! [`PlayerOrder::AttackMove`] i rozgałęzienie w `perform_player_order` (ze ścieżką `_performSiegeManualOrder`, która
//! w pinie poprzedza także te rozkazy, `:18286`).
//!
//! Moduł jest czysty: stan sceny wchodzi jawnie ([`AttackPathGrid`], [`AttackOrderEnv`]), wynik to DECYZJA
//! ([`AttackOrderStep`]); wykonanie (`_doMove`, `_doAttack`, `done()`, `_refreshQueuedOrderVisuals` = render) należy do
//! wołającego. `_firstStepAlongPathToAttack(ru, allowFirstStep, target)` (`:8565-8622`) wchodzi przez
//! [`AttackOrderEnv::first_step_along_path_to_attack`]: wołający podaje port
//! [`crate::domain::siege_tactics_pathstep::first_step_along_path_to_attack`] z `is_goal` =
//! `_canStrikeTargetFrom(ru, ., ., target)` (`:8571-8573`).
//!
//! Poza zakresem (D-415-1): `_performSiegeManualOrder` (`:18435-18475`, H3; tu tylko jego WYNIK), kolejka rozkazów UI,
//! tryb ręczny gracza w ciele pętli (T5/H4), wiring mostu. Produkcyjny wołający gałęzi pozostaje za H4/T5 (w AUTO
//! `_activateUnit` zeruje `playerOrder`, `:6093`).

use std::cmp::Ordering;

use crate::domain::player_order_move::{BF_COLS, BF_ROWS, DIRS4};

/// Zajętość pola `occByKey.get(cellKey(col, row))` z punktu widzenia `_attackMovePath` (`:18556-18558`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Occupant {
    /// Pole wolne.
    Empty,
    /// Sama jednostka wykonująca rozkaz (`occupant === ru`).
    SelfUnit,
    /// Inna jednostka strony gracza (`this._isPlayerSide(occupant.side)`, `:12420-12422`).
    PlayerSide,
    /// Inna jednostka strony przeciwnej gracza.
    OtherSide,
}

/// Stan planszy czytany przez `_attackMovePath`.
pub trait AttackPathGrid {
    /// Web `this._passableForUnit(ru, col, row)` (`:7446-7448`).
    fn passable(&self, col: i64, row: i64) -> bool;
    /// Web `this.occByKey.get(cellKey(col, row))` sklasyfikowane ([`Occupant`]).
    fn occupant(&self, col: i64, row: i64) -> Occupant;
    /// Web `this._destAllowedByBlockade(ru, col)` (`:17809-17815`).
    fn blockade_allows(&self, col: i64) -> bool;
}

/// Web `_attackMovePath(ru, targetCol, targetRow, allowEnemyCells)` (`battleScene.ts:18535-18566`): najkrótsza droga
/// BFS po `DIRS4` od `start` do `target`, wynik `[start, ..., target]` albo `None`. Pole odrzucane: poza planszą, już
/// odwiedzone, `!_passableForUnit`, `!_destAllowedByBlockade`, zajęte przez inną jednostkę strony gracza albo (przy
/// `allow_enemy_cells == false`) przez dowolną inną jednostkę. Pętla `head < queue.length && queue.length <
/// BF_COLS * BF_ROWS` (`:18546`), wyjście przy zdjęciu celu (`:18548`).
#[must_use]
pub fn attack_move_path<G: AttackPathGrid + ?Sized>(
    grid: &G,
    start: (i64, i64),
    target: (i64, i64),
    allow_enemy_cells: bool,
) -> Option<Vec<(i64, i64)>> {
    let mut parent: std::collections::HashMap<(i64, i64), Option<(i64, i64)>> =
        std::collections::HashMap::new();
    parent.insert(start, None);
    let mut queue: Vec<(i64, i64)> = vec![start];
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let limit = (BF_COLS * BF_ROWS) as usize;
    let mut head = 0usize;
    while head < queue.len() && queue.len() < limit {
        let current = queue[head];
        head += 1;
        if current == target {
            break;
        }
        for (dq, dr) in DIRS4 {
            let nq = current.0 + dq;
            let nr = current.1 + dr;
            if !(0..BF_COLS).contains(&nq) || !(0..BF_ROWS).contains(&nr) {
                continue;
            }
            let next = (nq, nr);
            if parent.contains_key(&next) || !grid.passable(nq, nr) || !grid.blockade_allows(nq) {
                continue;
            }
            match grid.occupant(nq, nr) {
                Occupant::Empty | Occupant::SelfUnit => {}
                Occupant::PlayerSide => continue,
                Occupant::OtherSide => {
                    if !allow_enemy_cells {
                        continue;
                    }
                }
            }
            parent.insert(next, Some(current));
            queue.push(next);
        }
    }
    if !parent.contains_key(&target) {
        return None;
    }
    // Odtworzenie po rodzicach (`:18559-18565`): `node === start ? [start, ...path.reverse()] : null`.
    let mut path: Vec<(i64, i64)> = Vec::new();
    let mut node = Some(target);
    while let Some(n) = node {
        if n == start {
            break;
        }
        path.push(n);
        node = parent.get(&n).copied().flatten();
    }
    if node != Some(start) {
        return None;
    }
    path.push(start);
    path.reverse();
    Some(path)
}

/// Web `_firstStepOnAttackMovePath(ru, targetCol, targetRow)` (`:18568-18572`): drugi element drogi
/// `_attackMovePath(..., false)` albo `None` (brak drogi albo cel = start).
#[must_use]
pub fn first_step_on_attack_move_path<G: AttackPathGrid + ?Sized>(
    grid: &G,
    start: (i64, i64),
    target: (i64, i64),
) -> Option<(i64, i64)> {
    let path = attack_move_path(grid, start, target, false)?;
    path.get(1).copied()
}

/// Jednostka strony przeciwnej (`ru.side === 'atk' ? this.def : this.atk`, PRZED filtrem `_enemiesOf`, `:8291-8294`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AttackEnemy {
    /// `u.bu.id`.
    pub id: u64,
    pub q: i64,
    pub r: i64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub removed: bool,
}

/// Wejścia gałęzi `attack` / `attackMove` poza planszą (indeks wroga = indeks w [`AttackEnemy`] wołającego).
pub trait AttackOrderEnv: AttackPathGrid {
    /// Web `this._compactAttackAllowsStep(ru, col)` (`:8139-8172`).
    fn compact_allows(&self, col: i64) -> bool;
    /// Web `this._canStrikeTargetFrom(ru, col, row, enemy)` (`:8487-8494`).
    fn can_strike_from(&self, col: i64, row: i64, enemy: usize) -> bool;
    /// Web `this._priorityScore(ru, enemy)` (`:17512-17520`).
    fn priority_score(&self, enemy: usize) -> f64;
    /// Web `this._firstStepAlongPathToAttack(ru, allowFirstStep, enemy)` (`:8565-8622`); `allow` = `allowFirstStep`
    /// (`None` = `undefined`).
    fn first_step_along_path_to_attack(
        &self,
        allow: Option<&dyn Fn(i64, i64) -> bool>,
        enemy: usize,
    ) -> Option<(i64, i64)>;
}

/// Stan jednostki czytany przez gałęzie `attack` / `attackMove`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AttackOrderInput<'a> {
    /// `(ru.q, ru.r)`.
    pub pos: (i64, i64),
    /// Roster strony przeciwnej (przed filtrem `_enemiesOf`).
    pub enemies: &'a [AttackEnemy],
    /// `this._shouldAvoidAutoBacktrack(ru)` (`:8191-8196`), tylko gałąź `attack` (`:18409`).
    pub avoid_auto_backtrack: bool,
    /// `ru.lastAutoMoveFrom`.
    pub last_auto_move_from: Option<(i64, i64)>,
}

/// Skąd pochodzi krok rozkazu ataku.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AttackRoute {
    /// `attackMove`: krok `_firstStepAlongPathToAttack(ru, undefined, target)` ku zagrożeniu na trasie (`:18374-18381`).
    Threat,
    /// `attackMove`: krok `_firstStepOnAttackMovePath` ku punktowi trasy (`:18390-18393`).
    Waypoint,
    /// `attack`: krok `_firstStepAlongPathToAttack(ru, filtr, tgt)` ku celowi (`:18410-18427`).
    Target,
}

/// Decyzja gałęzi `attack` / `attackMove` `_performPlayerOrder`. Pin zwraca `true` w każdej z nich.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AttackOrderStep {
    /// `ru.playerOrder = { type: 'none' }`, `done()`: cel `attack` nieżywy / znikający / nieznaleziony (`:18397-18401`)
    /// albo `attackMove` stoi na punkcie trasy (`:18384-18388`).
    OrderCleared,
    /// `_doAttack(ru, enemy, done)` (`:18370-18372`, `:18403-18405`); indeks w [`AttackOrderInput::enemies`].
    Attack(usize),
    /// Brak kroku: `done()`, rozkaz bez zmian (`:18390`, `:18415`).
    NoStep,
    /// `_destAllowedByBlockade` odmawia kroku (`:18392`, `:18417`): `done()`, rozkaz bez zmian.
    BlockadeBlocked {
        col: i64,
        row: i64,
        route: AttackRoute,
    },
    /// `_doMove(ru, col, row, cb)`; rozkaz zachowany. `prev` = `previousPosition` zapisywane w callbacku jako
    /// `ru.lastAutoMoveFrom` (tylko `attack` przy `_shouldAvoidAutoBacktrack`, `:18418-18421`).
    Move {
        col: i64,
        row: i64,
        route: AttackRoute,
        prev: Option<(i64, i64)>,
    },
}

/// Web `_enemiesOf(ru)` (`:8291-8294`): indeksy wrogów nie martwych, nie znikających, nie uciekających.
fn enemies_of(enemies: &[AttackEnemy]) -> impl Iterator<Item = usize> + '_ {
    enemies
        .iter()
        .enumerate()
        .filter(|(_, u)| !u.dead && !u.fading_out && !u.routed)
        .map(|(i, _)| i)
}

/// Web `manhattan(ac, ar, bc, br)` (`battleScene.ts:1917-1919`).
fn manhattan(a: (i64, i64), b: (i64, i64)) -> i64 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

/// Zagrożenia na trasie `attackMove` (`:18358-18367`): wrogowie `_enemiesOf` bez `dead`/`fadingOut`/`removed`/`routed`,
/// stojący na polu trasy albo możliwi do uderzenia z któregoś pola trasy (`route.some(...)`, kolejność pól trasy),
/// posortowani stabilnie (`Array.prototype.sort`, TimSort) po `_priorityScore`, potem odległości Manhattan od `ru`.
/// Komparator pinu `a - b || m` = `m`, gdy różnica wyników to `0` albo `NaN`.
#[must_use]
pub fn attack_move_threats<E: AttackOrderEnv + ?Sized>(
    inp: &AttackOrderInput<'_>,
    route: Option<&[(i64, i64)]>,
    env: &E,
) -> Vec<usize> {
    let tiles: &[(i64, i64)] = route.unwrap_or(&[]);
    let mut out: Vec<usize> = enemies_of(inp.enemies)
        .filter(|&i| {
            let e = &inp.enemies[i];
            !e.dead && !e.fading_out && !e.removed && !e.routed
        })
        .filter(|&i| {
            let e = &inp.enemies[i];
            tiles.contains(&(e.q, e.r)) || tiles.iter().any(|&(q, r)| env.can_strike_from(q, r, i))
        })
        .collect();
    let scores: Vec<f64> = (0..inp.enemies.len())
        .map(|i| {
            if out.contains(&i) {
                env.priority_score(i)
            } else {
                0.0
            }
        })
        .collect();
    out.sort_by(|&a, &b| {
        let d = scores[a] - scores[b];
        #[allow(clippy::cast_precision_loss)]
        let v = if d != 0.0 && !d.is_nan() {
            d
        } else {
            let ea = &inp.enemies[a];
            let eb = &inp.enemies[b];
            (manhattan(inp.pos, (ea.q, ea.r)) - manhattan(inp.pos, (eb.q, eb.r))) as f64
        };
        if v < 0.0 {
            Ordering::Less
        } else if v > 0.0 {
            Ordering::Greater
        } else {
            Ordering::Equal
        }
    });
    out
}

/// Web `_performPlayerOrder` gałąź `attackMove` (`battleScene.ts:18353-18394`), `target` = `(ord.col, ord.row)`.
pub fn attack_move_order_step<E: AttackOrderEnv + ?Sized>(
    inp: &AttackOrderInput<'_>,
    target: (i64, i64),
    env: &E,
) -> AttackOrderStep {
    let route = attack_move_path(env, inp.pos, target, true);
    let threats = attack_move_threats(inp, route.as_deref(), env);
    if let Some(&t) = threats.first() {
        if env.can_strike_from(inp.pos.0, inp.pos.1, t) {
            return AttackOrderStep::Attack(t);
        }
        // Krok ku zagrożeniu blokującemu trasę z zachowaniem rozkazu (`:18374-18381`); odmowa blokady = dalej.
        if let Some((nc, nr)) = env.first_step_along_path_to_attack(None, t) {
            if env.blockade_allows(nc) {
                return AttackOrderStep::Move {
                    col: nc,
                    row: nr,
                    route: AttackRoute::Threat,
                    prev: None,
                };
            }
        }
    }
    if inp.pos == target {
        return AttackOrderStep::OrderCleared;
    }
    let Some((nc, nr)) = first_step_on_attack_move_path(env, inp.pos, target) else {
        return AttackOrderStep::NoStep;
    };
    if !env.blockade_allows(nc) {
        return AttackOrderStep::BlockadeBlocked {
            col: nc,
            row: nr,
            route: AttackRoute::Waypoint,
        };
    }
    AttackOrderStep::Move {
        col: nc,
        row: nr,
        route: AttackRoute::Waypoint,
        prev: None,
    }
}

/// Web `_performPlayerOrder` gałąź `attack` (`battleScene.ts:18395-18428`), `target_id` = `ord.targetId`.
pub fn attack_order_step<E: AttackOrderEnv + ?Sized>(
    inp: &AttackOrderInput<'_>,
    target_id: u64,
    env: &E,
) -> AttackOrderStep {
    let tgt = enemies_of(inp.enemies).find(|&i| {
        let u = &inp.enemies[i];
        u.id == target_id && !u.dead && !u.fading_out
    });
    let Some(tgt) = tgt else {
        return AttackOrderStep::OrderCleared;
    };
    if env.can_strike_from(inp.pos.0, inp.pos.1, tgt) {
        return AttackOrderStep::Attack(tgt);
    }
    let avoid = inp.avoid_auto_backtrack;
    let last = inp.last_auto_move_from;
    let allow = |q: i64, r: i64| env.compact_allows(q) && !(avoid && last == Some((q, r)));
    let allow_dyn: &dyn Fn(i64, i64) -> bool = &allow;
    let Some((nc, nr)) = env.first_step_along_path_to_attack(Some(allow_dyn), tgt) else {
        return AttackOrderStep::NoStep;
    };
    if !env.blockade_allows(nc) {
        return AttackOrderStep::BlockadeBlocked {
            col: nc,
            row: nr,
            route: AttackRoute::Target,
        };
    }
    AttackOrderStep::Move {
        col: nc,
        row: nr,
        route: AttackRoute::Target,
        prev: avoid.then_some(inp.pos),
    }
}
