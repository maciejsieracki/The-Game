//! P6 SIEGE-TAKTYKA K3 (#217, runda 1 Operatora): czesc decyzyjna trzech funkcji wiez oblezniczych.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`siege_ram_tower_step`] = `_siegeRamTowerStep` (`:8022-8054`): tarany do bramy, wieza pod mur.
//! * [`siege_tower_climb`] = `_trySiegeTowerClimb` (`:8056-8084`): piechota wchodzi na korone muru od wiezy.
//! * [`siege_infantry_to_tower_step`] = `_siegeInfantryToTowerStep` (`:8087-8102`): piechota idzie pod wieze.
//!
//! Modul NIE duplikuje marszu i BFS: `bfs_first_step`, `siege_walk_to` i `do_move_gate` pochodza z K1b
//! (`siege_tactics_walk.rs`), a bramka `_siegeMoveRefused` z K1 (`siege_tactics_approach.rs`).
//!
//! WEJSCIA KLASYFIKACJI (jawne, wyliczone przez pinowe `isSiegeUnit` / `isSiegeTower` / `_isRam` / `canShoot` w
//! harnessie generatora): `is_siege_unit`, `is_ram`, `is_siege_tower`, `can_shoot`. Ich port to osobny temat
//! (normName/stats), tu nie sa powtarzane.
//!
//! EFEKTY SCENY (jawne wyjscie [`TowerEvent`], nie wykonywane tutaj): `_advanceToward` -> [`TowerEvent::AdvanceToward`]
//! (bez `done`, wolajacy czeka na swoj callback; `then_arrive` niesie informacje, ze callbackiem jest `arrive` wiezy), `_attackGate` -> [`TowerEvent::AttackGate`] (bez `done`), `_schedule`
//! -> [`TowerEvent::Schedule`], `_doMove` -> [`TowerEvent::Move`] / [`TowerEvent::Gate`], wywolanie `done()` ->
//! [`TowerEvent::Done`], dopisanie do `towerAtWallRows` -> [`TowerEvent::AddRow`], komunikat WYLOM -> `scene.log`.
//! Wiezowe `arrive` (`towerAtWallRows.add` przed `done`) jest odtworzone przy zakonczeniu marszu.
//!
//! BRAK GALEZI ODMOWY BRAMKI w tych trzech funkcjach: `_siegeMoveRefused` wymaga `!isSiegeUnit`, a `_siegeInfantryToTowerStep`
//! wychodzi wczesnie, gdy `towerAtWallRows` jest puste, a `_siegeApproachRestricted` dla piechoty wymaga braku wiez.
//! Odmowa bramki (`Gate{refused: true}`) jest pokryta w K1/K1b; tu wystepuje strukturalnie niedostepna.
//!
//! NaN: `move_left` jest `f64` i ma semantyke JS (`NaN <= 0` = fałsz). Marsz z `NaN` nie konczy sie w pinie (pętla bez
//! konca), dlatego wektory marszu uzywaja skonczonych `moveLeft`; `NaN` testowany jest tylko przy wejsciu na mur
//! (`_trySiegeTowerClimb` ustawia `moveLeft = 0` i nie czyta go wczesniej).
//!
//! Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (wiersz 30).

use std::collections::{BTreeSet, HashSet};

use super::siege_tactics_approach::{ApproachUnit, ApproachWallState, Threat};
use super::siege_tactics_walk::{
    bfs_first_step, do_move_gate, siege_walk_to, DoMoveGate, WalkEvent, WalkUnit, WalkWorld,
    WALK_BFS_MAX_VISITED,
};

/// Web `battleScene.ts` `DIRS4` (N, E, S, W).
const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Web `battleScene.ts` `_trySiegeTowerClimb`: komunikat dziennika przy pierwszym wylomie przez wieze.
pub const WYLOM_LOG: &str =
    "=== WYLOM: atakujacy weszli na mur po wiezy oblezniczej -- miasto moze zostac zdobyte ===";

/// Web `battleScene.ts` `COST` z generatora (koszt wejscia; `_moveCostForUnit` jest atrapa harnessu).
pub fn move_cost(col: i64, row: i64) -> f64 {
    const COST: [f64; 5] = [0.5, 1.0, 1.5, 2.0, 3.0];
    COST[((3 * col + 5 * row).rem_euclid(5)) as usize]
}

/// Web `city-fortification.ts:96-98` `attackerWallEntryIsBreach(side, onWallWalkway)`.
pub fn attacker_wall_entry_is_breach(side_atk: bool, on_wall_walkway: bool) -> bool {
    side_atk && on_wall_walkway
}

/// Stan jednostki czytany i zapisywany przez trzy funkcje (pola `ru`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TowerUnit {
    /// `q`, `r`, `moveLeft`, `dead`, `fadingOut`.
    pub walk: WalkUnit,
    /// Web `ru.side === 'atk'`.
    pub side_atk: bool,
    pub routed: bool,
    pub on_wall_walkway: bool,
    pub mounted: bool,
    pub primary_ranged: bool,
    /// Wynik `canShoot(ru)` (wejscie).
    pub can_shoot: bool,
    /// Web `ru.shootingEnabled === false`.
    pub shooting_disabled: bool,
    /// Wynik `isSiegeUnit(ru.bu)` (wejscie).
    pub is_siege_unit: bool,
    /// Wynik `_isRam(ru.bu)` (wejscie).
    pub is_ram: bool,
    /// Wynik `isSiegeTower(ru.bu)` (wejscie).
    pub is_siege_tower: bool,
}

impl TowerUnit {
    fn approach(&self) -> ApproachUnit {
        ApproachUnit {
            side_atk: self.side_atk,
            routed: self.routed,
            on_wall_walkway: self.on_wall_walkway,
            is_siege_unit: self.is_siege_unit,
            primary_ranged: self.primary_ranged,
            can_shoot: self.can_shoot,
            shooting_disabled: self.shooting_disabled,
            mounted: self.mounted,
        }
    }
}

/// Odczyty i stan sceny potrzebne trzem funkcjom wiez (pola `this`).
#[derive(Debug, Clone, PartialEq)]
pub struct TowerScene {
    pub finished: bool,
    /// Web `siegeWallCol` (`-1` = brak muru).
    pub wall_col: i64,
    /// Web `siegeGateCol` / `siegeGateRow`.
    pub gate_col: i64,
    pub gate_row: i64,
    pub gate_open: bool,
    pub wall_ever_breached: bool,
    /// Web `siegeWallTilesInit`.
    pub wall_tiles_init: usize,
    /// Web `wallTileHp` (klucze = rzedy zywych kafli muru).
    pub wall_tile_rows: BTreeSet<i64>,
    /// Web `towerAtWallRows`.
    pub tower_rows: BTreeSet<i64>,
    /// Web `occByKey` (klucze kafli).
    pub occupied: HashSet<(i64, i64)>,
    /// Kafle, na ktorych `_passableForUnit` daje fałsz (wejscie).
    pub blocked: HashSet<(i64, i64)>,
    /// Wynik `_siegeShooterThreats()` (wejscie).
    pub threats: Vec<Threat>,
    /// Web `this.log`.
    pub log: Vec<String>,
}

impl TowerScene {
    fn wall_state(&self) -> ApproachWallState {
        ApproachWallState {
            wall_col_ge0: self.wall_col >= 0,
            gate_open: self.gate_open,
            wall_ever_breached: self.wall_ever_breached,
            wall_tiles_init: self.wall_tiles_init,
            wall_tiles_alive: self.wall_tile_rows.len(),
            tower_at_wall_rows_count: self.tower_rows.len(),
        }
    }
}

/// Zdarzenie wyjsciowe (efekty sceny zapisane jawnie; patrz opis modulu).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TowerEvent {
    /// Konsultacja bramki `_siegeMoveRefused` przy `_doMove` (tylko gdy `siegeWallCol >= 0`).
    Gate { col: i64, row: i64, refused: bool },
    /// `_doMove` przeszedl: przeniesienie w `occByKey`, `moveLeft -= koszt`.
    Move { col: i64, row: i64 },
    /// `_schedule(ms, ...)` (kolejny krok marszu).
    Schedule { ms: u32 },
    /// `towerAtWallRows.add(row)`.
    AddRow { row: i64 },
    /// `_attackGate(ru, done)` (efekt sceny, bez `done` w tej funkcji).
    AttackGate,
    /// `_advanceToward(ru, col, row, done)` (efekt sceny). `then_arrive = true` gdy `done` to closure `arrive` z galezi
    /// wiezy (`_siegeRamTowerStep`, `_advanceToward(ru, wallBase, ru.r, arrive)`): po dojsciu wolajacy MUSI wykonac
    /// `arrive` = gdy `ru.q >= col` dopisac `ru.r` do `towerAtWallRows`, potem `done()`. `false` = zwykle `done`
    /// (galez bramy). Ten flag jest jedynym nosnikiem tego skutku; bez niego zdarzenie tracilo `arrive` (zarzut 1 FC).
    AdvanceToward {
        col: i64,
        row: i64,
        then_arrive: bool,
    },
    /// `done()`.
    Done,
}

/// Wynik wywolania: `handled` = wartosc zwracana przez funkcje webowa (`true` = akcja obsluzona).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TowerOutcome {
    pub handled: bool,
    pub events: Vec<TowerEvent>,
}

fn not_handled() -> TowerOutcome {
    TowerOutcome {
        handled: false,
        events: Vec::new(),
    }
}

fn handled(events: Vec<TowerEvent>) -> TowerOutcome {
    TowerOutcome {
        handled: true,
        events,
    }
}

/// Cel marszu (predykat `isGoal` z pinu).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Goal {
    /// `c === wallCol - 1 && (r === gLo || r === gHi)` (taran do bramy).
    GateApproach { wall_col: i64, lo: i64, hi: i64 },
    /// `c === wallBase && !towerAtWallRows.has(r) && wallTileHp.has(r) && !occ(wallCol, r)` (wieza pod mur).
    TowerBase { wall_base: i64, wall_col: i64 },
    /// Piechota przy wiezy (`_siegeInfantryToTowerStep`).
    InfantryTower { wall_col: i64, wall_base: i64 },
}

fn goal_holds(scene: &TowerScene, goal: Goal, c: i64, r: i64) -> bool {
    match goal {
        Goal::GateApproach { wall_col, lo, hi } => c == wall_col - 1 && (r == lo || r == hi),
        Goal::TowerBase {
            wall_base,
            wall_col,
        } => {
            c == wall_base
                && !scene.tower_rows.contains(&r)
                && scene.wall_tile_rows.contains(&r)
                && !scene.occupied.contains(&(wall_col, r))
        }
        Goal::InfantryTower {
            wall_col,
            wall_base,
        } => {
            let crown_free =
                scene.wall_tile_rows.contains(&r) && !scene.occupied.contains(&(wall_col, r));
            let rows = &scene.tower_rows;
            ((c == wall_base - 1 && rows.contains(&r))
                || (c == wall_base
                    && !rows.contains(&r)
                    && (rows.contains(&(r - 1)) || rows.contains(&(r + 1)))))
                && crown_free
        }
    }
}

fn first_step(
    scene: &TowerScene,
    unit: &TowerUnit,
    goal: Goal,
    pref_row: Option<i64>,
) -> Option<(i64, i64)> {
    bfs_first_step(
        (unit.walk.q, unit.walk.r),
        |c, r| goal_holds(scene, goal, c, r),
        |c, r| !scene.occupied.contains(&(c, r)) && !scene.blocked.contains(&(c, r)),
        |_, _| true,
        pref_row,
        WALK_BFS_MAX_VISITED,
    )
}

/// Adapter sceny dla petli marszu K1b: odczyty `this` i efekt `_doMove` (bez bramki odmowy, ta jest w `do_move_gate`).
struct TowerWalk<'a> {
    scene: &'a mut TowerScene,
    goal: Goal,
    pref_row: Option<i64>,
    approach: ApproachUnit,
    wall: ApproachWallState,
    threats: Vec<Threat>,
}

impl WalkWorld for TowerWalk<'_> {
    fn finished(&self) -> bool {
        self.scene.finished
    }

    fn is_goal(&self, col: i64, row: i64) -> bool {
        goal_holds(self.scene, self.goal, col, row)
    }

    fn passable_free(&self, col: i64, row: i64) -> bool {
        !self.scene.occupied.contains(&(col, row)) && !self.scene.blocked.contains(&(col, row))
    }

    fn pref_row(&self) -> Option<i64> {
        self.pref_row
    }

    fn do_move(&mut self, unit: &mut WalkUnit, col: i64, row: i64) -> DoMoveGate {
        let gate = do_move_gate(
            self.scene.wall_col >= 0,
            &self.approach,
            &self.wall,
            &self.threats,
            (unit.q, unit.r),
            (col, row),
        );
        if gate == DoMoveGate::Proceed {
            self.scene.occupied.remove(&(unit.q, unit.r));
            self.scene.occupied.insert((col, row));
            unit.q = col;
            unit.r = row;
            unit.move_left -= move_cost(col, row);
        }
        gate
    }
}

/// Uruchamia `_siegeWalkTo` (K1b) i mapuje jego zdarzenia na [`TowerEvent`].
///
/// `arrive_base = Some(wallBase)` odtwarza closure `arrive` z `_siegeRamTowerStep` / tower: po koncu marszu, gdy
/// `ru.q >= wallBase`, dopisuje wiersz do `towerAtWallRows` przed `done()`.
fn run_walk(
    scene: &mut TowerScene,
    unit: &mut TowerUnit,
    goal: Goal,
    pref_row: Option<i64>,
    arrive_base: Option<i64>,
) -> Vec<TowerEvent> {
    let gate_on = scene.wall_col >= 0;
    let wall = scene.wall_state();
    let threats = scene.threats.clone();
    let approach = unit.approach();
    let walk_events = {
        let mut world = TowerWalk {
            scene: &mut *scene,
            goal,
            pref_row,
            approach,
            wall,
            threats,
        };
        siege_walk_to(&mut world, &mut unit.walk)
    };
    let mut out = Vec::new();
    for ev in walk_events {
        match ev {
            WalkEvent::Move { col, row } => {
                if gate_on {
                    out.push(TowerEvent::Gate {
                        col,
                        row,
                        refused: false,
                    });
                }
                out.push(TowerEvent::Move { col, row });
            }
            WalkEvent::Refused { col, row } => out.push(TowerEvent::Gate {
                col,
                row,
                refused: true,
            }),
            WalkEvent::Schedule { ms } => out.push(TowerEvent::Schedule { ms }),
            WalkEvent::Done => {
                if let Some(wall_base) = arrive_base {
                    if unit.walk.q >= wall_base {
                        scene.tower_rows.insert(unit.walk.r);
                        out.push(TowerEvent::AddRow { row: unit.walk.r });
                    }
                }
                out.push(TowerEvent::Done);
            }
        }
    }
    out
}

/// Web `battleScene.ts:8022-8054` `_siegeRamTowerStep(ru, done)`.
pub fn siege_ram_tower_step(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
    if !(scene.wall_col >= 0) || !unit.side_atk || !unit.is_siege_unit {
        return not_handled();
    }
    let wall_col = scene.wall_col;
    if unit.is_ram && !scene.gate_open {
        let g_lo = scene.gate_row - 1;
        let g_hi = scene.gate_row;
        let (q, r) = (unit.walk.q, unit.walk.r);
        let near_gate = (q - wall_col).abs() + (r - g_lo).abs().min((r - g_hi).abs()) <= 1;
        if near_gate {
            return handled(vec![TowerEvent::AttackGate]);
        }
        let goal = Goal::GateApproach {
            wall_col,
            lo: g_lo,
            hi: g_hi,
        };
        if first_step(scene, unit, goal, Some(scene.gate_row)).is_some() {
            let events = run_walk(scene, unit, goal, Some(scene.gate_row), None);
            return handled(events);
        }
        return handled(vec![TowerEvent::AdvanceToward {
            col: scene.gate_col,
            row: scene.gate_row,
            then_arrive: false,
        }]);
    }
    if unit.is_siege_tower {
        let wall_base = wall_col - 1;
        if unit.walk.q >= wall_base {
            scene.tower_rows.insert(unit.walk.r);
            return handled(vec![
                TowerEvent::AddRow { row: unit.walk.r },
                TowerEvent::Done,
            ]);
        }
        let goal = Goal::TowerBase {
            wall_base,
            wall_col,
        };
        if first_step(scene, unit, goal, None).is_some() {
            let events = run_walk(scene, unit, goal, None, Some(wall_base));
            return handled(events);
        }
        return handled(vec![TowerEvent::AdvanceToward {
            col: wall_base,
            row: unit.walk.r,
            then_arrive: true,
        }]);
    }
    not_handled()
}

/// Web `battleScene.ts:8056-8084` `_trySiegeTowerClimb(ru, done)`.
pub fn siege_tower_climb(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
    if unit.on_wall_walkway
        || !unit.side_atk
        || !(scene.wall_col >= 0)
        || unit.is_siege_unit
        || unit.mounted
    {
        return not_handled();
    }
    if scene.tower_rows.is_empty() {
        return not_handled();
    }
    let wall_base = scene.wall_col - 1;
    let (q, r) = (unit.walk.q, unit.walk.r);
    let can_climb = DIRS4
        .iter()
        .any(|&(dc, dr)| q + dc == wall_base && scene.tower_rows.contains(&(r + dr)));
    if !can_climb {
        return not_handled();
    }
    let wall_col = scene.wall_col;
    // Korona = zywy kafel muru (nie brama, nie wyburzony), wolna od jednostek.
    if !scene.wall_tile_rows.contains(&r) || scene.occupied.contains(&(wall_col, r)) {
        return not_handled();
    }
    scene.occupied.remove(&(q, r));
    unit.walk.q = wall_col;
    unit.on_wall_walkway = true;
    if attacker_wall_entry_is_breach(unit.side_atk, unit.on_wall_walkway)
        && !scene.wall_ever_breached
    {
        scene.wall_ever_breached = true;
        scene.log.push(WYLOM_LOG.to_string());
    }
    scene.occupied.insert((wall_col, r));
    unit.walk.move_left = 0.0;
    handled(vec![TowerEvent::Done])
}

/// Web `battleScene.ts:8087-8102` `_siegeInfantryToTowerStep(ru, done)`.
pub fn siege_infantry_to_tower_step(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
    if !(scene.wall_col >= 0)
        || !unit.side_atk
        || unit.on_wall_walkway
        || unit.mounted
        || unit.is_siege_unit
    {
        return not_handled();
    }
    if scene.tower_rows.is_empty() {
        return not_handled();
    }
    if unit.primary_ranged && unit.can_shoot && !unit.shooting_disabled {
        return not_handled();
    }
    let wall_col = scene.wall_col;
    let goal = Goal::InfantryTower {
        wall_col,
        wall_base: wall_col - 1,
    };
    // Przy wiezy -- czeka na wolna korone.
    if goal_holds(scene, goal, unit.walk.q, unit.walk.r) {
        return handled(vec![TowerEvent::Done]);
    }
    if first_step(scene, unit, goal, None).is_none() {
        return not_handled();
    }
    handled(run_walk(scene, unit, goal, None, None))
}
