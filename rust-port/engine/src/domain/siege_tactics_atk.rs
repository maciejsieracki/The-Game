//! P6 K5LOOP-SIEGE-ATK-A (T2a, dispatch `R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-A-Q1`): decyzje gałęzi ATAKUJĄCEGO przy murze
//! wołanych przez `_activateUnit` (`gra/src/battle/battleScene.ts`, pin `07d2fbd72`):
//!
//! * [`tower_climb_allowed`] = `_trySiegeTowerClimb` (`:8056-8084`), część decyzyjna (wejście na koronę muru od wieży);
//! * [`infantry_to_tower_plan`] = `_siegeInfantryToTowerStep` (`:8087-8101`), część decyzyjna (marsz pod wieżę);
//! * [`ram_tower_plan`] = `_siegeRamTowerStep` (`:8022-8054`), część decyzyjna (taran do bramy, wieża pod mur);
//! * [`advance_toward_pick`] = wybór kafla `_advanceToward` (`:7892-7916`, jeden krok zachłanny);
//! * [`AtkGoal`] / [`goal_holds`] = predykaty `isGoal` przekazywane do `_bfsFirstStep` / `_siegeWalkTo`.
//!
//! WYKONANIE (zmiana pozycji, `occByKey`, `_doMove`, `_schedule`, `towerAtWallRows.add`, dziennik wyłomu) jest w
//! `ProdBody` (`siege_tactics_loop.rs`), które składa te decyzje z pętlą marszu K1b (`siege_walk_to`) i efektami
//! `_doMove` (`do_move_effects`, `move_step_core`). Ten moduł nie ma stanu i nie ma skutków ubocznych.
//!
//! Względem K3 (`siege_tactics_tower.rs`): K3 to czysty port z atrapą kosztu ruchu z harnessu (`move_cost` = tabela
//! generatora) i własnym adapterem marszu; ten moduł daje te same predykaty (`goal_holds` = te same warunki pinu) dla
//! produkcyjnego ciała, gdzie przechodniość i koszt pochodzą z `MoveTerrain` sceny. K3 nie jest zmieniany (poza
//! allowlistą tematu); stałe `attacker_wall_entry_is_breach` i `WYLOM_LOG` są stamtąd re-eksportowane.

use std::collections::BTreeSet;

use super::siege_tactics_approach::{BF_COLS, BF_ROWS};
pub use super::siege_tactics_tower::{attacker_wall_entry_is_breach, WYLOM_LOG};
use super::siege_tactics_walk::{bfs_first_step, WALK_BFS_MAX_VISITED};

/// Web `DIRS4` (`battleScene.ts:337`, N, E, S, W) czytane przez `_trySiegeTowerClimb` (`:8061`).
const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Web `_advanceToward` (`:7897`): `const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]` (N, S, W, E — INNA kolejność niż
/// `DIRS4`; remis odległości wygrywa pierwszy w tej kolejności, bo `d < bestDist` jest ostre).
pub const ADVANCE_TOWARD_DIRS: [(i64, i64); 4] = [(0, -1), (0, 1), (-1, 0), (1, 0)];

/// Pola `this` czytane przez gałęzie atakującego przy murze.
#[derive(Debug, Clone, PartialEq)]
pub struct AtkSiegeScene {
    /// Web `siegeWallCol` (`-1` = brak muru).
    pub wall_col: i64,
    /// Web `siegeGateCol` / `siegeGateRow` (pin `:2450`, `:2452`: inicjalnie `-1`; `_carveWallTiles` `:4045-4046`).
    pub gate_col: i64,
    pub gate_row: i64,
    /// Web `gateOpen`.
    pub gate_open: bool,
    /// Web `wallTileHp.has(row)`: KLUCZE mapy `wallTileHp` (bez względu na wartość HP; pin `.has` nie czyta HP).
    pub wall_tile_rows: BTreeSet<i64>,
    /// Web `towerAtWallRows` (`:2499`).
    pub tower_rows: BTreeSet<i64>,
}

/// Flagi jednostki `ru` czytane przez trzy funkcje wież (wejścia klas jak w K5H: `isSiegeUnit`, `isSiegeTower`,
/// `_isRam`, `canShoot`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AtkUnitFlags {
    pub side_atk: bool,
    pub on_wall_walkway: bool,
    pub mounted: bool,
    pub is_siege_unit: bool,
    pub is_siege_tower: bool,
    pub is_ram: bool,
    pub primary_ranged: bool,
    pub can_shoot: bool,
    /// Web `ru.shootingEnabled === false`.
    pub shooting_disabled: bool,
}

/// Predykat `isGoal` marszu (`_bfsFirstStep` / `_siegeWalkTo`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AtkGoal {
    /// Taran do bramy (`:8030`): `c === wallCol - 1 && (r === gLo || r === gHi)`.
    GateApproach { wall_col: i64, lo: i64, hi: i64 },
    /// Wieża pod mur (`:8042-8043`): `c === wallBase && !towerAtWallRows.has(r) && wallTileHp.has(r) &&
    /// !occByKey.has(cellKey(wallCol, r))`.
    TowerBase { wall_base: i64, wall_col: i64 },
    /// Piechota pod wieżę (`:8093-8096`): `((c === wallBase - 1 && rows.has(r)) || (c === wallBase && !rows.has(r) &&
    /// (rows.has(r - 1) || rows.has(r + 1)))) && crownFree(r)`, `crownFree(r) = wallTileHp.has(r) &&
    /// !occByKey.has(cellKey(wallCol, r))`.
    InfantryTower { wall_col: i64, wall_base: i64 },
}

/// `isGoal(c, r)` w chwili wywołania (`occupied` = `occByKey.has(cellKey(c, r))`).
pub fn goal_holds<O: Fn(i64, i64) -> bool>(
    scene: &AtkSiegeScene,
    occupied: &O,
    goal: AtkGoal,
    c: i64,
    r: i64,
) -> bool {
    match goal {
        AtkGoal::GateApproach { wall_col, lo, hi } => c == wall_col - 1 && (r == lo || r == hi),
        AtkGoal::TowerBase {
            wall_base,
            wall_col,
        } => {
            c == wall_base
                && !scene.tower_rows.contains(&r)
                && scene.wall_tile_rows.contains(&r)
                && !occupied(wall_col, r)
        }
        AtkGoal::InfantryTower {
            wall_col,
            wall_base,
        } => {
            let rows = &scene.tower_rows;
            let crown_free = scene.wall_tile_rows.contains(&r) && !occupied(wall_col, r);
            ((c == wall_base - 1 && rows.contains(&r))
                || (c == wall_base
                    && !rows.contains(&r)
                    && (rows.contains(&(r - 1)) || rows.contains(&(r + 1)))))
                && crown_free
        }
    }
}

/// `this._bfsFirstStep(ru, goal, undefined, prefRow)` z produkcyjną przechodniością (`passable` =
/// `!occByKey.has(k) && _passableForUnit(ru, c, r)`; `allowTile` = `undefined`).
pub fn first_step<O, P>(
    scene: &AtkSiegeScene,
    occupied: &O,
    passable: &P,
    start: (i64, i64),
    goal: AtkGoal,
    pref_row: Option<i64>,
) -> Option<(i64, i64)>
where
    O: Fn(i64, i64) -> bool,
    P: Fn(i64, i64) -> bool,
{
    bfs_first_step(
        start,
        |c, r| goal_holds(scene, occupied, goal, c, r),
        passable,
        |_, _| true,
        pref_row,
        WALK_BFS_MAX_VISITED,
    )
}

/// Web `_trySiegeTowerClimb` (`:8057-8066`): `true` = wejście na koronę `(wallCol, ru.r)` jest wykonywane (funkcja
/// zwraca `true`); `false` = `return false` (bez skutków).
pub fn tower_climb_allowed<O: Fn(i64, i64) -> bool>(
    scene: &AtkSiegeScene,
    occupied: &O,
    u: AtkUnitFlags,
    q: i64,
    r: i64,
) -> bool {
    if u.on_wall_walkway || !u.side_atk || !(scene.wall_col >= 0) || u.is_siege_unit || u.mounted {
        return false;
    }
    if scene.tower_rows.is_empty() {
        return false;
    }
    let wall_base = scene.wall_col - 1;
    let can_climb = DIRS4
        .iter()
        .any(|&(dc, dr)| q + dc == wall_base && scene.tower_rows.contains(&(r + dr)));
    if !can_climb {
        return false;
    }
    // Korona = żywy kafel muru (nie brama, nie wyburzony), wolna od jednostek (`:8066`).
    scene.wall_tile_rows.contains(&r) && !occupied(scene.wall_col, r)
}

/// Decyzja `_siegeInfantryToTowerStep` (`:8087-8101`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InfantryPlan {
    /// `return false`.
    NotHandled,
    /// `if (goal(ru.q, ru.r)) { done(); return true; }` — przy wieży czeka na wolną koronę.
    Wait,
    /// `this._siegeWalkTo(ru, goal, done); return true;` (BFS ma pierwszy krok).
    Walk(AtkGoal),
}

/// Web `_siegeInfantryToTowerStep` (`:8087-8101`), część decyzyjna. `passable` jest czytane wyłącznie przy BFS (po
/// wszystkich wczesnych wyjściach), więc brak danych terenu ujawnia się tylko na tej ścieżce.
pub fn infantry_to_tower_plan<O, P>(
    scene: &AtkSiegeScene,
    occupied: &O,
    passable: &P,
    u: AtkUnitFlags,
    q: i64,
    r: i64,
) -> InfantryPlan
where
    O: Fn(i64, i64) -> bool,
    P: Fn(i64, i64) -> bool,
{
    if !(scene.wall_col >= 0) || !u.side_atk || u.on_wall_walkway || u.mounted || u.is_siege_unit {
        return InfantryPlan::NotHandled;
    }
    if scene.tower_rows.is_empty() {
        return InfantryPlan::NotHandled;
    }
    if u.primary_ranged && u.can_shoot && !u.shooting_disabled {
        return InfantryPlan::NotHandled;
    }
    let goal = AtkGoal::InfantryTower {
        wall_col: scene.wall_col,
        wall_base: scene.wall_col - 1,
    };
    if goal_holds(scene, occupied, goal, q, r) {
        return InfantryPlan::Wait;
    }
    if first_step(scene, occupied, passable, (q, r), goal, None).is_none() {
        return InfantryPlan::NotHandled;
    }
    InfantryPlan::Walk(goal)
}

/// Decyzja `_siegeRamTowerStep` (`:8022-8054`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RamTowerPlan {
    /// `return false`.
    NotHandled,
    /// Taran przy bramie: `this._attackGate(ru, done); return true;` (`:8028`) — treść `_attackGate` to T2b.
    AttackGate,
    /// `this._siegeWalkTo(ru, goal, done|arrive, undefined, prefRow)` (`:8032`, `:8048`). `arrive_base = Some(wallBase)`
    /// = callback `arrive` wieży (`:8044-8047`: `if (ru.q >= wallBase) towerAtWallRows.add(ru.r); done();`).
    Walk {
        goal: AtkGoal,
        pref_row: Option<i64>,
        arrive_base: Option<i64>,
    },
    /// `this._advanceToward(ru, col, row, done|arrive)` (`:8035`, `:8049`), `arrive_base` jak wyżej.
    AdvanceToward {
        col: i64,
        row: i64,
        arrive_base: Option<i64>,
    },
    /// Wieża już pod murem (`:8040`): `this.towerAtWallRows.add(ru.r); done(); return true;`.
    AtWall { row: i64 },
}

/// Web `_siegeRamTowerStep` (`:8022-8054`), część decyzyjna. `passable` czytane tylko przez BFS.
pub fn ram_tower_plan<O, P>(
    scene: &AtkSiegeScene,
    occupied: &O,
    passable: &P,
    u: AtkUnitFlags,
    q: i64,
    r: i64,
) -> RamTowerPlan
where
    O: Fn(i64, i64) -> bool,
    P: Fn(i64, i64) -> bool,
{
    if !(scene.wall_col >= 0) || !u.side_atk || !u.is_siege_unit {
        return RamTowerPlan::NotHandled;
    }
    let wall_col = scene.wall_col;
    if u.is_ram && !scene.gate_open {
        let g_lo = scene.gate_row - 1;
        let g_hi = scene.gate_row;
        let near_gate = (q - wall_col).abs() + (r - g_lo).abs().min((r - g_hi).abs()) <= 1;
        if near_gate {
            return RamTowerPlan::AttackGate;
        }
        let goal = AtkGoal::GateApproach {
            wall_col,
            lo: g_lo,
            hi: g_hi,
        };
        if first_step(
            scene,
            occupied,
            passable,
            (q, r),
            goal,
            Some(scene.gate_row),
        )
        .is_some()
        {
            return RamTowerPlan::Walk {
                goal,
                pref_row: Some(scene.gate_row),
                arrive_base: None,
            };
        }
        return RamTowerPlan::AdvanceToward {
            col: scene.gate_col,
            row: scene.gate_row,
            arrive_base: None,
        };
    }
    if u.is_siege_tower {
        let wall_base = wall_col - 1;
        if q >= wall_base {
            return RamTowerPlan::AtWall { row: r };
        }
        let goal = AtkGoal::TowerBase {
            wall_base,
            wall_col,
        };
        if first_step(scene, occupied, passable, (q, r), goal, None).is_some() {
            return RamTowerPlan::Walk {
                goal,
                pref_row: None,
                arrive_base: Some(wall_base),
            };
        }
        return RamTowerPlan::AdvanceToward {
            col: wall_base,
            row: r,
            arrive_base: Some(wall_base),
        };
    }
    RamTowerPlan::NotHandled
}

/// Web `_advanceToward` (`:7896-7915`): wybór kafla sąsiedniego. `cost_is_infinity(c, r)` = `this._moveCostForUnit(ru,
/// c, r) === Infinity` (ŚCISŁA równość z `Infinity`: koszt `NaN` NIE odrzuca kafla, inaczej niż `_passableForUnit`),
/// `occupied(c, r)` = `occByKey.has(cellKey(c, r))`. Cel `(target_col, target_row)` liczony jako `f64` (`Math.abs`),
/// `d < bestDist` ostre (remis = pierwszy w [`ADVANCE_TOWARD_DIRS`]). `None` = `if (!bestKey) { done(); return; }`.
pub fn advance_toward_pick<C, O>(
    q: i64,
    r: i64,
    target_col: i64,
    target_row: i64,
    cost_is_infinity: &C,
    occupied: &O,
) -> Option<(i64, i64)>
where
    C: Fn(i64, i64) -> bool,
    O: Fn(i64, i64) -> bool,
{
    let mut best: Option<(i64, i64)> = None;
    let mut best_dist = f64::INFINITY;
    for (dc, dr) in ADVANCE_TOWARD_DIRS {
        let (nc, nr) = (q + dc, r + dr);
        if nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS {
            continue;
        }
        if cost_is_infinity(nc, nr) {
            continue;
        }
        if occupied(nc, nr) {
            continue;
        }
        let d = ((nc - target_col).abs() + (nr - target_row).abs()) as f64;
        if d < best_dist {
            best_dist = d;
            best = Some((nc, nr));
        }
    }
    best
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scene() -> AtkSiegeScene {
        AtkSiegeScene {
            wall_col: 10,
            gate_col: 10,
            gate_row: 5,
            gate_open: false,
            wall_tile_rows: [1, 2, 3, 6, 7, 8].into_iter().collect(),
            tower_rows: BTreeSet::new(),
        }
    }

    fn inf() -> AtkUnitFlags {
        AtkUnitFlags {
            side_atk: true,
            on_wall_walkway: false,
            mounted: false,
            is_siege_unit: false,
            is_siege_tower: false,
            is_ram: false,
            primary_ranged: false,
            can_shoot: false,
            shooting_disabled: false,
        }
    }

    #[test]
    fn wejscie_na_mur_wymaga_wiezy_obok_i_wolnej_korony() {
        let mut s = scene();
        let free = |_: i64, _: i64| false;
        assert!(!tower_climb_allowed(&s, &free, inf(), 9, 2));
        s.tower_rows.insert(3);
        // wieża w rzędzie r+1, jednostka na wallBase.
        assert!(tower_climb_allowed(&s, &free, inf(), 9, 2));
        // korona zajęta.
        let occ = |c: i64, r: i64| c == 10 && r == 2;
        assert!(!tower_climb_allowed(&s, &occ, inf(), 9, 2));
        // brak kafla muru w rzędzie jednostki (brama).
        s.tower_rows.insert(4);
        assert!(!tower_climb_allowed(&s, &free, inf(), 9, 5));
        let mut m = inf();
        m.mounted = true;
        assert!(!tower_climb_allowed(&s, &free, m, 9, 2));
    }

    #[test]
    fn marsz_zachlanny_kolejnosc_kierunkow_i_nan() {
        let none = |_: i64, _: i64| false;
        // Remis N (0,-1) i S (0,1) do celu w tym samym wierszu: wygrywa N (pierwszy).
        assert_eq!(advance_toward_pick(5, 5, 5, 5, &none, &none), Some((5, 4)));
        // Cel na wschodzie: E.
        assert_eq!(advance_toward_pick(5, 5, 9, 5, &none, &none), Some((6, 5)));
        // Wszystko Infinity: brak kafla.
        let all = |_: i64, _: i64| true;
        assert_eq!(advance_toward_pick(5, 5, 9, 5, &all, &none), None);
        // Krawędź planszy.
        assert_eq!(
            advance_toward_pick(0, 0, -5, -5, &none, &none),
            Some((0, 1))
        );
    }
}
