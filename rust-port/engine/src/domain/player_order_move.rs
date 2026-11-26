//! R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (zadanie #404, krok T3): rozkaz ruchu jednostki w pętli bitwy.
//!
//! Port 1:1 z webu, pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt):
//!   * `_performPlayerOrder` gałęzie `hold`, `none`, `move` (`:18280-18353`) -> [`perform_player_order`],
//!     [`move_order_step`];
//!   * `_firstStepTowardMoveDestination` (`:18478-18527`) -> [`first_step_toward_move_destination`], z
//!     `firingTiles` strzelca (`:18484-18498`) -> [`firing_tiles`].
//!
//! Moduł jest czysty: stan sceny wchodzi jawnie (siatka przejezdności i zajętości [`MoveGrid`], predykaty bramek
//! [`MoveOrderGates`], wynik `_adjacentEnemy`), wynik to DECYZJA ([`MoveOrderStep`]); wykonanie (`_doMove`,
//! `_doAttack`, `done()`) należy do wołającego ([`crate::domain::siege_tactics_loop::ProdBody`]).
//!
//! Poza zakresem (D-404-1, jawne u wołającego): `attackMove` / `attack` (`:18354-18428`, T4), `_performSiegeManualOrder`
//! (`:18435-18475`, H3), kolejka rozkazów UI (`_refreshQueuedOrderVisuals` `:11520` = wyłącznie render).

use std::collections::{HashSet, VecDeque};

use crate::domain::siege_tactics_doctrine_state::GroupDoctrine as StateDoctrine;
use crate::domain::siege_tactics_doctrine_step::{effective_doctrine, is_unit_doctrine_auto};

/// Web `BF_COLS` (`battleScene.ts:661`).
pub const BF_COLS: i64 = 68;
/// Web `BF_ROWS` (`battleScene.ts:662`).
pub const BF_ROWS: i64 = 156;
/// Limit odwiedzin BFS rozkazu ruchu (`_firstStepTowardMoveDestination(ru, tc, tr, 1024, …)`, `:18334-18335`).
pub const MOVE_ORDER_MAX_VISITED: f64 = 1024.0;
/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-337`): N, E, S, W.
pub const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Stan planszy czytany przez rozkaz ruchu.
pub trait MoveGrid {
    /// Web `this._passableForUnit(ru, col, row)` (`:7446-7448`): teren (z mnożnikiem jazdy), bez zajętości.
    fn passable(&self, col: i64, row: i64) -> bool;
    /// Web `this.occByKey.has(cellKey(col, row))`.
    fn occupied(&self, col: i64, row: i64) -> bool;
}

/// Predykaty bramek rozkazu ruchu dla kolumny kandydata.
pub trait MoveOrderGates {
    /// Web `this._compactAttackAllowsStep(ru, col)` (`:8139-8172`).
    fn compact_allows(&self, col: i64) -> bool;
    /// Web `this._destAllowedByBlockade(ru, col)` (`:17809-17815`).
    fn blockade_allows(&self, col: i64) -> bool;
}

/// Wróg z listy `_enemiesOf(ru)` przed filtrem (`firingTiles` filtruje ponownie, `:18487`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FiringEnemy {
    pub q: i64,
    pub r: i64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
}

/// Pola `ru` czytane przez `firingTiles` (`:18486`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FiringShooter {
    pub ranged_base: bool,
    /// `canShoot(ru)` = `ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
    pub can_shoot: bool,
    /// `ru.shootingEnabled !== false`.
    pub shooting_enabled: bool,
    /// `ru.range`.
    pub range: f64,
}

/// Web `firingTiles` (`battleScene.ts:18484-18498`): pola w zasięgu Manhattan `ru.range` od żywego wroga (bez pola
/// wroga), w planszy. Pętle pinu idą `dc = -range .. range` krokiem 1 (liczby JS): przy zasięgu niecałkowitym każde
/// `col = q + dc` jest niecałkowite, więc klucz nie trafia w żadne pole BFS (zbiór pusty dla pól całkowitych);
/// `NaN` i zasięg ujemny = pętla pusta. Zasięg nieskończony = pętla bez końca w pinie (nieosiągalny; tu pusty).
#[must_use]
pub fn firing_tiles(shooter: &FiringShooter, enemies: &[FiringEnemy]) -> HashSet<(i64, i64)> {
    let mut out = HashSet::new();
    if !(shooter.ranged_base && shooter.can_shoot && shooter.shooting_enabled) {
        return out;
    }
    let range = shooter.range;
    if !range.is_finite() || range < 0.0 || range.fract() != 0.0 {
        return out;
    }
    #[allow(clippy::cast_possible_truncation)]
    let range = range as i64;
    for e in enemies {
        if e.dead || e.fading_out || e.routed {
            continue;
        }
        for dc in -range..=range {
            let remaining = range - dc.abs();
            for dr in -remaining..=remaining {
                if dc == 0 && dr == 0 {
                    continue;
                }
                let col = e.q + dc;
                let row = e.r + dr;
                if (0..BF_COLS).contains(&col) && (0..BF_ROWS).contains(&row) {
                    out.insert((col, row));
                }
            }
        }
    }
    out
}

/// Web `_firstStepTowardMoveDestination(ru, targetCol, targetRow, maxVisited, allowFirstStep)` (`:18478-18527`): BFS
/// po `DIRS4` od pozycji jednostki; zwraca PIERWSZY krok drogi do celu albo do najbliższego pola ostrzału (`firing`).
/// `steady_skip` = `ru.lastAutoMoveFrom`, gdy `_isUnitDoctrineAuto(ru) && meta.doctrine === 'steady'` (`:18509-18510`,
/// pole pomijane na każdym poziomie BFS), inaczej `None`. `allow_first_step` filtruje wyłącznie sąsiadów startu
/// (`:18511`). Kolejność testów pola jak w pinie: plansza, `steady_skip`, `allowFirstStep`, zajętość/teren, odwiedzone.
pub fn first_step_toward_move_destination<G: MoveGrid + ?Sized>(
    grid: &G,
    start: (i64, i64),
    target: (i64, i64),
    max_visited: f64,
    allow_first_step: Option<&dyn Fn(i64, i64) -> bool>,
    steady_skip: Option<(i64, i64)>,
    firing: &HashSet<(i64, i64)>,
) -> Option<(i64, i64)> {
    // `parent` (zbiór odwiedzonych) i `firstStepByKey` (`:18500-18501`).
    let mut visited: HashSet<(i64, i64)> = HashSet::new();
    visited.insert(start);
    let mut first_step: std::collections::HashMap<(i64, i64), (i64, i64)> =
        std::collections::HashMap::new();
    let mut frontier: VecDeque<(i64, i64)> = VecDeque::new();
    frontier.push_back(start);
    // `head < frontier.length && head < maxVisited` (`:18504`): `head` = liczba zdjętych pól.
    let mut head: u64 = 0;
    while let Some(&current) = frontier.front() {
        #[allow(clippy::cast_precision_loss)]
        if (head as f64) >= max_visited || max_visited.is_nan() {
            break;
        }
        frontier.pop_front();
        head += 1;
        for (dc, dr) in DIRS4 {
            let col = current.0 + dc;
            let row = current.1 + dr;
            if !(0..BF_COLS).contains(&col) || !(0..BF_ROWS).contains(&row) {
                continue;
            }
            if steady_skip == Some((col, row)) {
                continue;
            }
            if current == start {
                if let Some(allow) = allow_first_step {
                    if !allow(col, row) {
                        continue;
                    }
                }
            }
            if grid.occupied(col, row) || !grid.passable(col, row) {
                continue;
            }
            if !visited.insert((col, row)) {
                continue;
            }
            let fs = if current == start {
                (col, row)
            } else {
                first_step.get(&current).copied().unwrap_or((col, row))
            };
            first_step.insert((col, row), fs);
            if (col, row) == target || firing.contains(&(col, row)) {
                return Some(fs);
            }
            frontier.push_back((col, row));
        }
    }
    None
}

/// Wejście gałęzi `move` (`:18297-18352`) poza siatką i bramkami.
#[derive(Debug, Clone, PartialEq)]
pub struct MoveOrderInput {
    /// `(ru.q, ru.r)`.
    pub pos: (i64, i64),
    /// `(ord.col, ord.row)`.
    pub target: (i64, i64),
    /// `this._adjacentEnemy(ru)` (`:17481-17484` = `_pickAdjacentTargetByPriority`): indeks w liście wrogów.
    pub adjacent_enemy: Option<usize>,
    /// `this._shouldAvoidAutoBacktrack(ru)` (`:8191-8196`).
    pub avoid_auto_backtrack: bool,
    /// `ru.lastAutoMoveFrom`.
    pub last_auto_move_from: Option<(i64, i64)>,
    /// `_isUnitDoctrineAuto(ru) && _effectiveMetaForUnit(ru).doctrine === 'steady'` (bramka BFS `:18509`).
    pub bfs_steady: bool,
    /// `firingTiles` ([`firing_tiles`]).
    pub firing: HashSet<(i64, i64)>,
}

impl MoveOrderStep {
    /// Wynik `_firstStepTowardMoveDestination`, gdy wołany w tym rozkazie (`Some(None)` = brak drogi), inaczej `None`.
    #[must_use]
    pub fn bfs_result(&self) -> Option<Option<(i64, i64)>> {
        match *self {
            Self::NoRoute => Some(None),
            Self::CompactBlocked {
                col,
                row,
                route: MoveRoute::Bfs,
            }
            | Self::BlockadeBlocked {
                col,
                row,
                route: MoveRoute::Bfs,
                ..
            }
            | Self::Move {
                col,
                row,
                route: MoveRoute::Bfs,
                ..
            } => Some(Some((col, row))),
            _ => None,
        }
    }
}

/// Skąd pochodzi krok rozkazu ruchu (diagnostyka i pokrycie; decyzja jest w [`MoveOrderStep`]).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoveRoute {
    /// Krok zachłanny `(q + dc, r + dr)` (`:18311-18313`).
    Greedy,
    /// Obejście w kolumnie `(q + dc, r)` (`:18319-18320`).
    SideCol,
    /// Obejście w rzędzie `(q, r + dr)` (`:18321-18322`).
    SideRow,
    /// Pierwszy krok `_firstStepTowardMoveDestination` (`:18334-18341`).
    Bfs,
}

/// Decyzja gałęzi `move` `_performPlayerOrder` (`:18297-18352`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoveOrderStep {
    /// Cel = pozycja: `ru.playerOrder = { type: 'none' }`, `done()` (`:18300-18304`).
    ReachedTarget,
    /// `_doAttack(ru, adj, done)` (`:18305-18309`).
    Attack(usize),
    /// Brak drogi z BFS (`:18338`): `done()`, rozkaz bez zmian.
    NoRoute,
    /// `_compactAttackAllowsStep(ru, nc)` odmawia (`:18343`): `done()`, rozkaz bez zmian (test PRZED `nc === tc`).
    CompactBlocked {
        col: i64,
        row: i64,
        route: MoveRoute,
    },
    /// `_destAllowedByBlockade(ru, nc)` odmawia (`:18345-18348`): `done()`; `order_done` = `playerOrder` już `none`
    /// (`:18344`).
    BlockadeBlocked {
        col: i64,
        row: i64,
        route: MoveRoute,
        order_done: bool,
    },
    /// `_doMove(ru, nc, nr, cb)` (`:18349-18353`): `order_done` = krok na cel (`:18344`), `prev` = `previousPosition`
    /// zapisywane w callbacku kroku jako `ru.lastAutoMoveFrom` (tylko przy `_shouldAvoidAutoBacktrack`).
    Move {
        col: i64,
        row: i64,
        route: MoveRoute,
        order_done: bool,
        prev: Option<(i64, i64)>,
    },
}

/// Web `_performPlayerOrder` gałąź `move` (`battleScene.ts:18297-18352`).
pub fn move_order_step<G: MoveGrid + ?Sized, B: MoveOrderGates + ?Sized>(
    inp: &MoveOrderInput,
    grid: &G,
    gates: &B,
) -> MoveOrderStep {
    let (q, r) = inp.pos;
    let (tc, tr) = inp.target;
    if tc == q && tr == r {
        return MoveOrderStep::ReachedTarget;
    }
    if let Some(adj) = inp.adjacent_enemy {
        return MoveOrderStep::Attack(adj);
    }
    let dc = (tc - q).signum();
    let dr = (tr - r).signum();
    let mut nc = q + dc;
    let mut nr = r + dr;
    let mut route = MoveRoute::Greedy;
    let avoid = inp.avoid_auto_backtrack;
    let backtrack = |c: i64, rr: i64| avoid && inp.last_auto_move_from == Some((c, rr));
    let free = |c: i64, rr: i64| grid.passable(c, rr) && !grid.occupied(c, rr) && !backtrack(c, rr);
    if !free(nc, nr) {
        if dc != 0 && free(q + dc, r) {
            nc = q + dc;
            nr = r;
            route = MoveRoute::SideCol;
        } else if dr != 0 && free(q, r + dr) {
            nc = q;
            nr = r + dr;
            route = MoveRoute::SideRow;
        } else {
            let allow = |c: i64, _r: i64| gates.compact_allows(c);
            let allow_dyn: &dyn Fn(i64, i64) -> bool = &allow;
            let skip = if inp.bfs_steady {
                inp.last_auto_move_from
            } else {
                None
            };
            let step = first_step_toward_move_destination(
                grid,
                inp.pos,
                inp.target,
                MOVE_ORDER_MAX_VISITED,
                avoid.then_some(allow_dyn),
                skip,
                &inp.firing,
            );
            let Some((c, rr)) = step else {
                return MoveOrderStep::NoRoute;
            };
            nc = c;
            nr = rr;
            route = MoveRoute::Bfs;
        }
    }
    if !gates.compact_allows(nc) {
        return MoveOrderStep::CompactBlocked {
            col: nc,
            row: nr,
            route,
        };
    }
    let order_done = nc == tc && nr == tr;
    if !gates.blockade_allows(nc) {
        return MoveOrderStep::BlockadeBlocked {
            col: nc,
            row: nr,
            route,
            order_done,
        };
    }
    MoveOrderStep::Move {
        col: nc,
        row: nr,
        route,
        order_done,
        prev: avoid.then_some(inp.pos),
    }
}

/// Rozkaz jednostki `ru.playerOrder` w zakresie T3.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlayerOrder {
    /// `{ type: 'none' }`.
    None,
    /// `{ type: 'hold' }`.
    Hold,
    /// `{ type: 'move', col, row }`.
    Move { col: i64, row: i64 },
    /// `attack` / `attackMove` (`:18354-18428`): poza zakresem T3 (D-404-1, T4).
    Other,
}

/// Doktryna jednostki czytana przez gałąź `none` (`:18287-18293`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OrderDoctrine {
    /// `ru.unitDoctrine`.
    pub unit_doctrine: Option<StateDoctrine>,
    /// `ru.groupId` prawdziwe w JS.
    pub has_group: bool,
    /// Wpis `this._groupMeta.get(ru.groupId)` = `(doctrine, autoPlay)`.
    pub group: Option<(StateDoctrine, bool)>,
}

/// Wynik `_performPlayerOrder` dla gałęzi przed `attackMove` (`:18280-18353`). Pin zwraca `true` w każdej z nich.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PerformOrder {
    /// `hold` (`:18282-18285`): `done()`.
    Hold,
    /// `_performSiegeManualOrder` (`:18286`, H3) obsługuje rozkaz: poza zakresem T3 (jawne u wołającego).
    SiegeManual,
    /// `none` + doktryna AUTO bez `manual`: `_executeGroupDoctrineStep(ru, meta, done)` (`:18288-18291`) z doktryną.
    Doctrine(StateDoctrine),
    /// `none` bez doktryny AUTO albo z `manual` (`:18294-18295`): `done()`.
    NoneDone,
    /// Gałąź `move` ([`move_order_step`]).
    Move(MoveOrderStep),
    /// `attack` / `attackMove`: poza zakresem T3.
    Other,
}

/// Web `_performPlayerOrder(ru, done)` (`battleScene.ts:18280-18353`) dla `hold` / `none` / `move`. `siege_manual` =
/// pierwsza bramka `_performSiegeManualOrder` (`:18436`: `siegeWallCol >= 0 && ru.side === 'atk' && ord.type !==
/// 'move'`); gdy prawdziwa, rozkaz `none` przechodzi do oblężenia ręcznego (H3, poza zakresem). Wartość zwracana przez
/// pin = `true` dla każdej gałęzi ([`perform_player_order_returns`]).
pub fn perform_player_order<G: MoveGrid + ?Sized, B: MoveOrderGates + ?Sized>(
    order: PlayerOrder,
    siege_manual: bool,
    doctrine: OrderDoctrine,
    mv: impl FnOnce() -> MoveOrderInput,
    grid: &G,
    gates: &B,
) -> PerformOrder {
    match order {
        PlayerOrder::Hold => PerformOrder::Hold,
        PlayerOrder::Other => PerformOrder::Other,
        PlayerOrder::None if siege_manual => PerformOrder::SiegeManual,
        PlayerOrder::None => {
            let auto =
                is_unit_doctrine_auto(doctrine.unit_doctrine, doctrine.has_group, doctrine.group);
            if auto {
                let meta = effective_doctrine(
                    doctrine.unit_doctrine,
                    if doctrine.has_group {
                        doctrine.group.map(|g| g.0)
                    } else {
                        None
                    },
                );
                if meta != StateDoctrine::Manual {
                    return PerformOrder::Doctrine(meta);
                }
            }
            PerformOrder::NoneDone
        }
        PlayerOrder::Move { .. } => PerformOrder::Move(move_order_step(&mv(), grid, gates)),
    }
}

/// Wartość zwracana przez `_performPlayerOrder` (`:18280-18428`): każda ścieżka kończy się `return true` (także
/// `_executeGroupDoctrineStep`, `:17966-18084`). `false` zwraca wyłącznie `_performSiegeManualOrder`, którego wynik
/// pin ignoruje przez `if (…) return true` (`:18286`).
#[must_use]
pub fn perform_player_order_returns(_order: PlayerOrder) -> bool {
    true
}
