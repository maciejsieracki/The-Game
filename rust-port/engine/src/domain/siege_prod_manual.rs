//! R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1 (zadanie #417A, krok H4/T5, część A): stan trybu ręcznego gracza i
//! tłumaczenie decyzji rozkazów na wykonanie w ciele bitwy ([`crate::domain::siege_tactics_loop::ProdBody`]).
//!
//! Web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, tylko odczyt):
//!   * `ru.playerOrder` (`:2034`, zapisy: `:6094`, `:18072-18077`, `:18112-18117`, `:18301`, `:18340`, `:18384`, `:18399`,
//!     `:18467`, `:18470`, `:18641`, `:18692`, `:18904`) -> [`ManualState`];
//!   * `if (this._manualMode && this._isPlayerSide(ru.side)) { if (this._performPlayerOrder(ru, done)) return; }`
//!     (`:6067-6069`) -> `ProdBody::start` z [`ManualState::exec`];
//!   * `_performPlayerOrder` (`:18280-18428`) i `_performSiegeManualOrder` (`:18435-18475`): decyzje liczą porty
//!     [`crate::domain::player_order_move::perform_player_order`] i [`crate::domain::player_order_siege_manual`]
//!     z predykatami ciała; tu wyłącznie tłumaczenie decyzji na [`ManualRun`] i skutek uboczny na `ru.playerOrder`;
//!   * `_executeUnitsImmediate` (`:18578-18614`) -> `ManualQueue` w `siege_tactics_loop.rs` (trait
//!     [`crate::domain::player_order_queue::PlayerOrderExec`]).
//!
//! Domyślnie tryb jest WYŁĄCZONY ([`ManualState::exec`] = `false`): ciało zachowuje się jak przed #417A (tag
//! `tryb-reczny` przy `scene.manual_mode`), więc wszystkie dotychczasowe wektory pozostają bez zmian.

use crate::domain::player_order_attack::AttackOrderStep;
use crate::domain::player_order_move::{MoveOrderStep, PlayerOrder};
use crate::domain::player_order_siege_manual::SiegeManualStep;
use crate::domain::siege_tactics_doctrine_state::GroupDoctrine;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_turnseq::UnitRef;

fn side_ix(side: BattleSide) -> usize {
    match side {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

/// Wykonanie rozkazu przez ciało (wynik tłumaczenia decyzji portów).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ManualRun {
    /// `done()` bez akcji (`hold`, `none` bez doktryny, brak drogi, odmowa bramki zwarcia/blokady).
    Done,
    /// `_doAttack(ru, enemy, done)`; indeks w liście strony przeciwnej.
    Attack(usize),
    /// `_doMove(ru, col, row, cb)`; `prev` = `previousPosition` callbacku (`lastAutoMoveFrom`).
    Move {
        tile: (i64, i64),
        prev: Option<(i64, i64)>,
    },
    /// `none` + doktryna AUTO: `_executeGroupDoctrineStep` (`:18288-18291`).
    Doctrine(GroupDoctrine),
    /// `_siegeRamTowerStep` obsłużył rozkaz (`:18440`).
    SiegeRamTower,
    /// `_trySiegeTowerClimb` (`:18458`).
    SiegeClimb,
    /// `_siegeInfantryToTowerStep` (`:18459`).
    SiegeInfantry,
    /// `_siegeSafeApproach` (`:18471`): `stepped` = pin znalazł cel marszu i go wykonuje (poza zakresem ciała:
    /// jawny tag), `false` = `done()`.
    SiegeSafeApproach { stepped: bool },
    /// Decyzja czyta przejezdność bez [`crate::domain::siege_tactics_move_effects::MoveTerrain`] (jawny tag).
    MissingTerrain,
}

/// Zapis jednej decyzji rozkazu gracza (obserwacja dla testów; odpowiednik śladu `orders` generatora wektorów).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ManualRecord {
    /// `vNow` wywołania `_performPlayerOrder`.
    pub t: f64,
    pub unit: UnitRef,
    pub order_before: PlayerOrder,
    pub order_after: PlayerOrder,
    pub run: ManualRun,
}

/// Stan trybu ręcznego gracza w ciele: flaga wykonania, strona gracza i `ru.playerOrder` każdej jednostki.
#[derive(Debug, Clone, PartialEq)]
pub struct ManualState {
    /// `true` = ciało WYKONUJE rozkazy gracza (`scene.manual_mode`, `_manualMode`, `battleScene.ts:6067`). `false`
    /// (domyślnie) = jawny tag `tryb-reczny` jak przed #417A.
    pub exec: bool,
    /// `this._playerControlSide()` (`:12420-12422`, `_isPlayerSide`).
    pub player_side: BattleSide,
    orders: [Vec<PlayerOrder>; 2],
    /// Cel rozkazu `move` wystawionego przez krok doktryny w trybie ręcznym (`:18072-18077`): callback `finish` ustawia
    /// `move` albo `none` zależnie od pozycji PO ruchu, więc rozstrzyga go [`Self::settle`] przy następnym odczycie.
    finish: [Vec<Option<(i64, i64)>>; 2],
    /// Ślad decyzji w kolejności wywołań.
    pub records: Vec<ManualRecord>,
}

impl ManualState {
    #[must_use]
    pub fn new(counts: [usize; 2]) -> Self {
        Self {
            exec: false,
            player_side: BattleSide::Attacker,
            orders: [
                vec![PlayerOrder::None; counts[0]],
                vec![PlayerOrder::None; counts[1]],
            ],
            finish: [vec![None; counts[0]], vec![None; counts[1]]],
            records: Vec::new(),
        }
    }

    /// `ru.playerOrder` bez rozstrzygania `finish` (patrz [`Self::settle`]).
    #[must_use]
    pub fn raw_order(&self, unit: UnitRef) -> PlayerOrder {
        self.orders[side_ix(unit.side)][unit.idx]
    }

    /// Zapis `ru.playerOrder = order` (UI: `:11509`, `:18641`, `:18692`, `:18904`; jednostka kasuje oczekujące `finish`).
    pub fn set_order(&mut self, unit: UnitRef, order: PlayerOrder) {
        let ix = side_ix(unit.side);
        self.orders[ix][unit.idx] = order;
        self.finish[ix][unit.idx] = None;
    }

    /// Callback `finish` kroku doktryny (`:18073-18079`): po ruchu `ru.playerOrder = move(dest)` gdy jednostka nie stoi
    /// na celu, inaczej `none`. Rozstrzygany leniwie przy najbliższym odczycie z aktualną pozycją.
    pub fn begin_doctrine_move(&mut self, unit: UnitRef, dest: (i64, i64)) {
        let ix = side_ix(unit.side);
        self.orders[ix][unit.idx] = PlayerOrder::Move {
            col: dest.0,
            row: dest.1,
        };
        self.finish[ix][unit.idx] = Some(dest);
    }

    /// Rozstrzyga oczekujące `finish` pozycją `pos` i zwraca `ru.playerOrder`.
    pub fn settle(&mut self, unit: UnitRef, pos: (i64, i64)) -> PlayerOrder {
        let ix = side_ix(unit.side);
        if let Some(dest) = self.finish[ix][unit.idx].take() {
            self.orders[ix][unit.idx] = if pos == dest {
                PlayerOrder::None
            } else {
                PlayerOrder::Move {
                    col: dest.0,
                    row: dest.1,
                }
            };
        }
        self.orders[ix][unit.idx]
    }

    /// `ru.playerOrder` z uwzględnieniem `finish` bez zmiany stanu.
    #[must_use]
    pub fn order_at(&self, unit: UnitRef, pos: (i64, i64)) -> PlayerOrder {
        let ix = side_ix(unit.side);
        match self.finish[ix][unit.idx] {
            Some(dest) if pos == dest => PlayerOrder::None,
            Some(dest) => PlayerOrder::Move {
                col: dest.0,
                row: dest.1,
            },
            None => self.orders[ix][unit.idx],
        }
    }
}

/// Tłumaczenie decyzji gałęzi `move` (`:18297-18352`): wykonanie i nowy `ru.playerOrder` (`None` = bez zmiany).
#[must_use]
pub fn run_of_move(step: MoveOrderStep) -> (ManualRun, Option<PlayerOrder>) {
    match step {
        MoveOrderStep::ReachedTarget => (ManualRun::Done, Some(PlayerOrder::None)),
        MoveOrderStep::Attack(t) => (ManualRun::Attack(t), None),
        MoveOrderStep::NoRoute | MoveOrderStep::CompactBlocked { .. } => (ManualRun::Done, None),
        MoveOrderStep::BlockadeBlocked { order_done, .. } => {
            (ManualRun::Done, order_done.then_some(PlayerOrder::None))
        }
        MoveOrderStep::Move {
            col,
            row,
            order_done,
            prev,
            ..
        } => (
            ManualRun::Move {
                tile: (col, row),
                prev,
            },
            order_done.then_some(PlayerOrder::None),
        ),
    }
}

/// Tłumaczenie decyzji gałęzi `attackMove` / `attack` (`:18353-18428`).
#[must_use]
pub fn run_of_attack(step: AttackOrderStep) -> (ManualRun, Option<PlayerOrder>) {
    match step {
        AttackOrderStep::OrderCleared => (ManualRun::Done, Some(PlayerOrder::None)),
        AttackOrderStep::Attack(t) => (ManualRun::Attack(t), None),
        AttackOrderStep::NoStep | AttackOrderStep::BlockadeBlocked { .. } => {
            (ManualRun::Done, None)
        }
        AttackOrderStep::Move { col, row, prev, .. } => (
            ManualRun::Move {
                tile: (col, row),
                prev,
            },
            None,
        ),
    }
}

/// Tłumaczenie decyzji `_performSiegeManualOrder` (`:18435-18475`). `id_to_enemy` zamienia `bu.id` celu na indeks wroga.
/// `None` = pin nie obsłużył rozkazu (`return false`, wołający przechodzi do gałęzi `none`/`attack`/`attackMove`).
#[must_use]
pub fn run_of_siege(
    step: &SiegeManualStep,
    id_to_enemy: impl Fn(u64) -> Option<usize>,
) -> Option<(ManualRun, Option<PlayerOrder>)> {
    match *step {
        SiegeManualStep::NotHandled(_) => None,
        SiegeManualStep::RamTower { handled } => {
            handled.then_some((ManualRun::SiegeRamTower, None))
        }
        SiegeManualStep::Shoot { target } | SiegeManualStep::ApproachStrike { target } => {
            Some((target_run(id_to_enemy(target)), None))
        }
        SiegeManualStep::WalkwayStrike { target } => Some((
            target.map_or(ManualRun::Done, |t| target_run(id_to_enemy(t))),
            None,
        )),
        SiegeManualStep::Climb => Some((ManualRun::SiegeClimb, None)),
        SiegeManualStep::InfantryToTower => Some((ManualRun::SiegeInfantry, None)),
        SiegeManualStep::ApproachClear(_) => Some((ManualRun::Done, Some(PlayerOrder::None))),
        SiegeManualStep::ApproachSafe { stepped, .. } => {
            Some((ManualRun::SiegeSafeApproach { stepped }, None))
        }
    }
}

fn target_run(idx: Option<usize>) -> ManualRun {
    idx.map_or(ManualRun::Done, ManualRun::Attack)
}
