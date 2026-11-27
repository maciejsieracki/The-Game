//! R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 (zadanie #416, krok H3): rozkazy gracza w RĘCZNEJ bitwie
//! oblężniczej.
//!
//! Port 1:1 z webu, pin `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt):
//!   * `_performSiegeManualOrder(ru, ord, done)` (`:18435-18475`) -> [`siege_manual_order_step`];
//!   * `_trySiegeTowerClimb(ru, done)` (`:8056-8084`) = istniejący port
//!     [`crate::domain::siege_tactics_tower::siege_tower_climb`] (K3, #217). Ten moduł go NIE duplikuje: adapter
//!     [`TowerSiegeEnv`] woła go wprost, a wektory kroku #416 sprawdzają go osobno (`siege_manual_order_step_vectors.json`,
//!     sekcja `climb`).
//!
//! Moduł jest czysty: wynik to DECYZJA ([`SiegeManualStep`]) z wartością zwracaną przez pin
//! ([`SiegeManualStep::handled`]); wykonanie (`_doAttack`, `done()`, `_refreshQueuedOrderVisuals` = render, przypisanie
//! `ru.playerOrder = { type: 'none' }`) należy do wołającego. Podfunkcje pinu wołane przez `_performSiegeManualOrder`
//! wchodzą przez [`SiegeManualEnv`] w KOLEJNOŚCI pinu i tylko wtedy, gdy pin je woła (krótkie spięcia `&&` / `||`):
//!   * `_siegeRamTowerStep` (`:8022-8054`) -> [`SiegeManualEnv::ram_tower_step`]
//!     ([`crate::domain::siege_tactics_tower::siege_ram_tower_step`]);
//!   * `_rangedTargetInRange` (`:7041-7052`) -> [`SiegeManualEnv::ranged_target_in_range`];
//!   * `_targetInRange` (`:8373-…`) -> [`SiegeManualEnv::target_in_range`];
//!   * `_trySiegeTowerClimb` (`:8056-8084`) -> [`SiegeManualEnv::tower_climb`];
//!   * `_siegeInfantryToTowerStep` (`:8087-8101`) -> [`SiegeManualEnv::infantry_to_tower_step`];
//!   * `_siegeApproachRestricted` (`:7951-7960`) -> [`SiegeManualEnv::approach_restricted`]
//!     ([`crate::domain::siege_tactics_approach::siege_approach_restricted`]);
//!   * `_siegeSafeApproach` (`:8107-8136`) -> [`SiegeManualEnv::safe_approach`].
//!
//! `doctrineAuto` (`:18443-18444`) liczy port doktryny ([`is_unit_doctrine_auto`], [`effective_doctrine`]) z
//! [`OrderDoctrine`], jak gałąź `none` w [`crate::domain::player_order_move::perform_player_order`]. Skutek uboczny pinu
//! `_effectiveMetaForUnit` -> `_ensureGroupMeta(groupId)` (dopisanie domyślnego wpisu grupy do `_groupMeta`, `:17633-17636`)
//! NIE jest tu wykonywany: należy do wołającego (stan grupy, H4/T5 #417); na `doctrine` wyniku nie wpływa.
//!
//! Wpięcie (D-416-1, zakres testów): wołający przekazuje [`SiegeManualStep::handled`] jako argument
//! `siege_manual_handled` funkcji [`crate::domain::player_order_move::perform_player_order`] (pin `:18286`:
//! `if (this._performSiegeManualOrder(ru, ord, done)) return true;`). `hold` jest w pinie sprawdzany wcześniej
//! (`:18282`), więc `_performSiegeManualOrder` nie dostaje go z produkcji; funkcja odwzorowuje jednak tekst pinu także
//! dla `hold` (bramka `:18438` go przepuszcza).

use crate::domain::player_order_move::{OrderDoctrine, PlayerOrder};
use crate::domain::siege_tactics_approach::{siege_approach_restricted, ApproachUnit};
use crate::domain::siege_tactics_doctrine_state::GroupDoctrine;
use crate::domain::siege_tactics_doctrine_step::{effective_doctrine, is_unit_doctrine_auto};
use crate::domain::siege_tactics_tower::{
    siege_infantry_to_tower_step, siege_ram_tower_step, siege_tower_climb, TowerEvent, TowerScene,
    TowerUnit,
};

/// Pola `ru` czytane wprost przez `_performSiegeManualOrder` (`:18435-18475`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeManualUnit {
    /// Web `ru.side === 'atk'`.
    pub side_atk: bool,
    /// Web `ru.q`, `ru.r` (porównanie z celem podejścia, `:18470`).
    pub q: i64,
    pub r: i64,
    /// Wynik `isSiegeUnit(ru.bu)` (wejście; port [`crate::domain::siege_tactics_classify::is_siege_unit`]).
    pub is_siege_unit: bool,
    /// Wynik `this._isRam(ru.bu)` (wejście; [`crate::domain::siege_tactics_classify::is_ram`]).
    pub is_ram: bool,
    /// Wynik `isSiegeTower(ru.bu)` (wejście; [`crate::domain::siege_tactics_classify::is_siege_tower`]).
    pub is_siege_tower: bool,
    /// Wynik `canShoot(ru)` (wejście; [`crate::domain::siege_tactics_classify::can_shoot`]).
    pub can_shoot: bool,
    /// Web `ru.shootingEnabled === false`.
    pub shooting_disabled: bool,
    /// Web `ru.onWallWalkway`.
    pub on_wall_walkway: bool,
}

/// Pola `this` czytane wprost przez `_performSiegeManualOrder`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeManualScene {
    /// Web `this.siegeWallCol >= 0`.
    pub wall_col_ge0: bool,
    /// Web `this.gateOpen`.
    pub gate_open: bool,
}

/// Wróg z listy `this._enemiesOf(ru)` przed filtrem (`:8291-8294`: `!dead && !fadingOut && !routed`), w kolejności
/// rosteru (`this.def` / `this.atk`); `find` (`:18466`) bierze pierwszy pasujący.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeEnemy {
    /// Web `u.bu.id`.
    pub id: u64,
    pub q: i64,
    pub r: i64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
}

/// Podfunkcje pinu wołane przez `_performSiegeManualOrder` (patrz opis modułu). Każda metoda = jedno wywołanie pinu;
/// implementacja wykonuje jej efekty (marsz, `done` podfunkcji) i zwraca jej wynik.
pub trait SiegeManualEnv {
    /// `this._siegeRamTowerStep(ru, done)` (`:18440`).
    fn ram_tower_step(&mut self) -> bool;
    /// `this._rangedTargetInRange(ru)` (`:18448`): `bu.id` celu albo `None`.
    fn ranged_target_in_range(&mut self) -> Option<u64>;
    /// `this._targetInRange(ru)` (`:18454`, `:18461`): `bu.id` celu albo `None`.
    fn target_in_range(&mut self) -> Option<u64>;
    /// `this._trySiegeTowerClimb(ru, done)` (`:18458`).
    fn tower_climb(&mut self) -> bool;
    /// `this._siegeInfantryToTowerStep(ru, done)` (`:18459`).
    fn infantry_to_tower_step(&mut self) -> bool;
    /// `this._siegeApproachRestricted(ru)` (`:18460`).
    fn approach_restricted(&mut self) -> bool;
    /// `this._siegeSafeApproach(ru, tc, tr, cb)` (`:18471`); `cb` = `_refreshQueuedOrderVisuals(); done()` należy do
    /// implementacji (wykonanie marszu).
    fn safe_approach(&mut self, col: i64, row: i64) -> bool;
}

/// Miejsce, w którym pin zwraca `false`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NotHandledAt {
    /// Bramka `:18438` (`siegeWallCol < 0`, strona obrońcy albo `move`).
    Gate,
    /// Machina oblężnicza inna niż taran przy zamkniętej bramie i wieża (`:18441`).
    OtherSiegeUnit,
    /// `none` bez doktryny AUTO i bez strzału (`:18451`).
    IdleNoShot,
    /// Koniec funkcji (`:18474`).
    Fallthrough,
}

/// Powód wyczyszczenia rozkazu w podejściu ograniczonym (`ru.playerOrder = { type: 'none' }`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApproachClear {
    /// `attack`: cel nieżywy / znikający / uciekający / nieznany (`:18467`).
    TargetGone,
    /// Jednostka stoi na polu celu (`:18470`).
    AtTarget,
}

/// Decyzja `_performSiegeManualOrder`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SiegeManualStep {
    /// `return false`.
    NotHandled(NotHandledAt),
    /// `return this._siegeRamTowerStep(ru, done)` (`:18440`): wynik podfunkcji (`done` należy do niej).
    RamTower { handled: bool },
    /// Bezczynny strzelec: `_doAttack(ru, tgt, done)` (`:18449`).
    Shoot { target: u64 },
    /// Pomost muru (`:18453-18456`): `Some` = `_doAttack(ru, adj, done)`, `None` = `done()`.
    WalkwayStrike { target: Option<u64> },
    /// `_trySiegeTowerClimb` zwróciło `true` (`:18458`).
    Climb,
    /// `_siegeInfantryToTowerStep` zwróciło `true` (`:18459`).
    InfantryToTower,
    /// Podejście ograniczone, cel w zasięgu: `_doAttack(ru, adj, done)` (`:18462`).
    ApproachStrike { target: u64 },
    /// Podejście ograniczone: `ru.playerOrder = { type: 'none' }; _refreshQueuedOrderVisuals(); done()`.
    ApproachClear(ApproachClear),
    /// Podejście ograniczone: `_siegeSafeApproach(ru, col, row, …)` (`:18471`); `stepped == false` -> `done()`.
    ApproachSafe { col: i64, row: i64, stepped: bool },
}

impl SiegeManualStep {
    /// Wartość zwracana przez pin (`true` = obsłużone).
    #[must_use]
    pub fn handled(&self) -> bool {
        match *self {
            SiegeManualStep::NotHandled(_) => false,
            SiegeManualStep::RamTower { handled } => handled,
            _ => true,
        }
    }

    /// Liczba bezpośrednich wywołań `done()` w ciele `_performSiegeManualOrder` (bez `done` przekazanego do
    /// podfunkcji i do `_doAttack`).
    #[must_use]
    pub fn direct_done_calls(&self) -> u32 {
        match *self {
            SiegeManualStep::WalkwayStrike { target: None }
            | SiegeManualStep::ApproachClear(_)
            | SiegeManualStep::ApproachSafe { stepped: false, .. } => 1,
            _ => 0,
        }
    }

    /// `_doAttack(ru, cel, done)` wołane wprost w ciele funkcji.
    #[must_use]
    pub fn attack_target(&self) -> Option<u64> {
        match *self {
            SiegeManualStep::Shoot { target }
            | SiegeManualStep::ApproachStrike { target }
            | SiegeManualStep::WalkwayStrike {
                target: Some(target),
            } => Some(target),
            _ => None,
        }
    }

    /// `ru.playerOrder = { type: 'none' }` w ciele funkcji.
    #[must_use]
    pub fn clears_order(&self) -> bool {
        matches!(self, SiegeManualStep::ApproachClear(_))
    }
}

/// Web `doctrineAuto` (`:18443-18444`): `ord.type === 'none' && _isUnitDoctrineAuto(ru) &&
/// _effectiveMetaForUnit(ru).doctrine !== 'manual'`.
#[must_use]
pub fn siege_manual_doctrine_auto(order: PlayerOrder, doctrine: OrderDoctrine) -> bool {
    if order != PlayerOrder::None {
        return false;
    }
    if !is_unit_doctrine_auto(doctrine.unit_doctrine, doctrine.has_group, doctrine.group) {
        return false;
    }
    let meta = effective_doctrine(
        doctrine.unit_doctrine,
        if doctrine.has_group {
            doctrine.group.map(|g| g.0)
        } else {
            None
        },
    );
    meta != GroupDoctrine::Manual
}

/// Web `_performSiegeManualOrder(ru, ord, done)` (`battleScene.ts:18435-18475`).
pub fn siege_manual_order_step<E: SiegeManualEnv + ?Sized>(
    unit: &SiegeManualUnit,
    scene: SiegeManualScene,
    order: PlayerOrder,
    doctrine: OrderDoctrine,
    enemies: &[SiegeEnemy],
    env: &mut E,
) -> SiegeManualStep {
    // :18438
    if !scene.wall_col_ge0 || !unit.side_atk || matches!(order, PlayerOrder::Move { .. }) {
        return SiegeManualStep::NotHandled(NotHandledAt::Gate);
    }
    // :18439-18442
    if unit.is_siege_unit {
        if (unit.is_ram && !scene.gate_open) || unit.is_siege_tower {
            return SiegeManualStep::RamTower {
                handled: env.ram_tower_step(),
            };
        }
        return SiegeManualStep::NotHandled(NotHandledAt::OtherSiegeUnit);
    }
    // :18443-18452
    let doctrine_auto = siege_manual_doctrine_auto(order, doctrine);
    if order == PlayerOrder::None && !doctrine_auto {
        if unit.can_shoot && !unit.shooting_disabled {
            if let Some(target) = env.ranged_target_in_range() {
                return SiegeManualStep::Shoot { target };
            }
        }
        return SiegeManualStep::NotHandled(NotHandledAt::IdleNoShot);
    }
    // :18453-18457
    if unit.on_wall_walkway {
        return SiegeManualStep::WalkwayStrike {
            target: env.target_in_range(),
        };
    }
    // :18458-18459
    if env.tower_climb() {
        return SiegeManualStep::Climb;
    }
    if env.infantry_to_tower_step() {
        return SiegeManualStep::InfantryToTower;
    }
    // :18460-18473
    let is_attack_order = matches!(
        order,
        PlayerOrder::Attack { .. } | PlayerOrder::AttackMove { .. }
    );
    if is_attack_order && env.approach_restricted() {
        if let Some(target) = env.target_in_range() {
            return SiegeManualStep::ApproachStrike { target };
        }
        let (tc, tr) = match order {
            PlayerOrder::AttackMove { col, row } => (col, row),
            PlayerOrder::Attack { target_id } => {
                // `_enemiesOf` (`!dead && !fadingOut && !routed`), potem `find(id && !dead && !fadingOut)`.
                let t = enemies
                    .iter()
                    .find(|u| !u.dead && !u.fading_out && !u.routed && u.id == target_id);
                match t {
                    Some(t) => (t.q, t.r),
                    None => return SiegeManualStep::ApproachClear(ApproachClear::TargetGone),
                }
            }
            _ => unreachable!("is_attack_order"),
        };
        if unit.q == tc && unit.r == tr {
            return SiegeManualStep::ApproachClear(ApproachClear::AtTarget);
        }
        let stepped = env.safe_approach(tc, tr);
        return SiegeManualStep::ApproachSafe {
            col: tc,
            row: tr,
            stepped,
        };
    }
    SiegeManualStep::NotHandled(NotHandledAt::Fallthrough)
}

/// Zewnętrzne odczyty sceny, których port leży poza K3 (`_rangedTargetInRange`, `_targetInRange`,
/// `_siegeSafeApproach` z wykonaniem marszu): dostarcza wołający.
pub trait SiegeTargets {
    /// `this._rangedTargetInRange(ru)`.
    fn ranged_target_in_range(&mut self) -> Option<u64>;
    /// `this._targetInRange(ru)`.
    fn target_in_range(&mut self) -> Option<u64>;
    /// `this._siegeSafeApproach(ru, col, row, cb)`.
    fn safe_approach(&mut self, col: i64, row: i64) -> bool;
}

/// Adapter [`SiegeManualEnv`] na porcie K3 (`siege_tactics_tower.rs`): `_siegeRamTowerStep`, `_trySiegeTowerClimb`,
/// `_siegeInfantryToTowerStep` i `_siegeApproachRestricted` liczone wprost na [`TowerScene`] / [`TowerUnit`];
/// zdarzenia sceny podfunkcji (marsz, `done`) zbierane w [`TowerSiegeEnv::events`] w kolejności wywołań.
pub struct TowerSiegeEnv<'a, T: SiegeTargets + ?Sized> {
    pub scene: &'a mut TowerScene,
    pub unit: &'a mut TowerUnit,
    pub targets: &'a mut T,
    pub events: Vec<TowerEvent>,
}

impl<T: SiegeTargets + ?Sized> SiegeManualEnv for TowerSiegeEnv<'_, T> {
    fn ram_tower_step(&mut self) -> bool {
        let out = siege_ram_tower_step(self.scene, self.unit);
        self.events.extend(out.events);
        out.handled
    }

    fn ranged_target_in_range(&mut self) -> Option<u64> {
        self.targets.ranged_target_in_range()
    }

    fn target_in_range(&mut self) -> Option<u64> {
        self.targets.target_in_range()
    }

    fn tower_climb(&mut self) -> bool {
        let out = siege_tower_climb(self.scene, self.unit);
        self.events.extend(out.events);
        out.handled
    }

    fn infantry_to_tower_step(&mut self) -> bool {
        let out = siege_infantry_to_tower_step(self.scene, self.unit);
        self.events.extend(out.events);
        out.handled
    }

    fn approach_restricted(&mut self) -> bool {
        let u = &*self.unit;
        let au = ApproachUnit {
            side_atk: u.side_atk,
            routed: u.routed,
            on_wall_walkway: u.on_wall_walkway,
            is_siege_unit: u.is_siege_unit,
            primary_ranged: u.primary_ranged,
            can_shoot: u.can_shoot,
            shooting_disabled: u.shooting_disabled,
            mounted: u.mounted,
        };
        siege_approach_restricted(&au, &tower_wall_state(self.scene))
    }

    fn safe_approach(&mut self, col: i64, row: i64) -> bool {
        self.targets.safe_approach(col, row)
    }
}

fn tower_wall_state(s: &TowerScene) -> crate::domain::siege_tactics_approach::ApproachWallState {
    crate::domain::siege_tactics_approach::ApproachWallState {
        wall_col_ge0: s.wall_col >= 0,
        gate_open: s.gate_open,
        wall_ever_breached: s.wall_ever_breached,
        wall_tiles_init: s.wall_tiles_init,
        wall_tiles_alive: s.wall_tile_rows.len(),
        tower_at_wall_rows_count: s.tower_rows.len(),
    }
}

/// Wejście [`siege_manual_order_step`] z [`TowerUnit`] / [`TowerScene`] (te same pola co w K3).
#[must_use]
pub fn siege_manual_unit_of(u: &TowerUnit) -> SiegeManualUnit {
    SiegeManualUnit {
        side_atk: u.side_atk,
        q: u.walk.q,
        r: u.walk.r,
        is_siege_unit: u.is_siege_unit,
        is_ram: u.is_ram,
        is_siege_tower: u.is_siege_tower,
        can_shoot: u.can_shoot,
        shooting_disabled: u.shooting_disabled,
        on_wall_walkway: u.on_wall_walkway,
    }
}

/// Wejście sceny [`siege_manual_order_step`] z [`TowerScene`].
#[must_use]
pub fn siege_manual_scene_of(s: &TowerScene) -> SiegeManualScene {
    SiegeManualScene {
        wall_col_ge0: s.wall_col >= 0,
        gate_open: s.gate_open,
    }
}
