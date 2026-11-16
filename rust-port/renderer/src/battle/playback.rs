//! P4-1I4 (`R-RUSTPORT-P4-1I4-BATTLE-CONSUMER`, PRIO-3D-9 #277, #248): the
//! renderer-side consumer of the battle step DTOs of P4-1I2 / P4-1I3
//! (`view-model/src/battle.rs`: [`BattleActionDto`], [`BattleFrameDto`]).
//!
//! The web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`) has no event
//! stream: the battle logic calls scene methods directly (recon
//! `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §0, §1). The engine
//! records those calls as actions, each with the virtual time `t0` of the
//! call, in call order (P4-1I3). This module replays them on a
//! [`BattleScene3`] through the existing scene functions of
//! [`super::dynamics`], [`super::units`] and [`super::siege_towers`], in the
//! order of the list (a queue, never re-sorted):
//!
//! | action | pin call | scene function |
//! |---|---|---|
//! | `Facing` | `ru.group.rotation.y = dirYaw(ru.facing)` (`:8340`, `:9105`, `:9138`, `:9818`) | [`set_facing`] |
//! | `Melee` | `_doMeleeAttack` lunge (`:9096-9175`; hit at `t0 + BLOW_HIT_T`, `:9122`) | [`MeleeLunge`] (started at `t0`, stepped by [`BattlePlayback::play_until`]) |
//! | `TowerShot` | `_fireOneTower` projectile (`:4250-4261`; hit at `t0 + RANGED_FLY_MS`, `:4262`) | [`fire_one_tower`] → [`super::dynamics::launch_projectile`], [`tick_projectiles`] |
//! | `Damage` | `bu.hp = Math.max(0, bu.hp - dmg)` + `_updateHpBar` (`:8991-8992`), then `_spawnDamageLabel` (`:9125`, `:9142`, `:9940-9971`) | [`update_hp_bar`] + [`FloatLabel::damage`] |
//! | `Kill` | `_startFade` → `_removeUnitFromScene` (`:9927-9938`, `:9910-9925`) after the killing blow set `hp = 0` and `_updateHpBar` (`:8991-8992`, `:9045-9047`) | [`update_hp_bar`] (`hp = 0`) + [`kill_unit`] |
//! | `Rout` | `_startRout` (`:9799-9825`): `_sfxRout` only; its turn is the separate `Facing` (`:9817-9818`) | — (recorded, audio) |
//! | `Turn`, `Log`, `Clash`, `End` | `hint`, `this.log.push`, `_pushClash`, `_showEndScreen` | — (DOM / P5; recorded) |
//!
//! [`BattleFrameDto`] → bars: morale ([`update_morale_bar`], pin `_updateMoraleBar`
//! `:9652-9661`, called by every morale change `:9698`, `:9733`, `:9749`,
//! `:9770`, `:10003`) and ammunition ([`update_ammo_bar`], `_updateAmmoBar`
//! `:9671-9684`, `:9193`). The HP bar is NOT taken from a frame: in the pin
//! `_updateHpBar` runs only at the blow (`:8992`) and at spawn / replay reset
//! (`:4581`, `:4725`, `:5497`, `:17269`), so it follows the `Damage` / `Kill`
//! actions at their time. A full resync of all three bars from a frame (the
//! reset paths, and the end of a fast-forward, where the engine emits no
//! `Damage` because `_spawnDamageLabel` returns at once, `:9943`) is
//! [`BattlePlayback::apply_snapshot`], called explicitly by the caller.
//!
//! Not consumed here (no DTO variant yet, P4-1I5 #249/#280, blocked by the
//! siege loop K5LOOP): walking ([`super::dynamics::MoveAnim`]), unit shots
//! ([`super::dynamics::launch_projectile`] from `_doRangedAttack`), the ram
//! ([`super::dynamics::RamAnim`]), the catapult ([`super::dynamics::Boulder`])
//! and the breaches (`breach_*`). The DTO shapes of P4-1I2 / P4-1I3 are not
//! changed.
//!
//! Gap of the DTO (reported, not filled in): `TowerShot` carries no projectile
//! kind; the web derives it from the tower shooter row
//! (`projectileKind` of the synthetic shooter, `:4238-4245`,
//! [`super::siege_towers::tower_projectile_kind`]). The caller passes it in
//! [`PlaybackOpts::tower_projectile`]; a `TowerShot` without it is an error.

use std::collections::{HashMap, VecDeque};

use civ_view_model::battle::{BattleActionDto, BattleActionKindDto, BattleFrameDto};
use civ_view_model::ids::UnitId;

use super::dynamics::{
    set_facing, tick_projectiles, FloatLabel, MeleeLunge, Projectile, ProjectileKind, BLOW_HIT_T,
    RANGED_FLY_MS,
};
use super::siege_towers::{fire_one_tower, TowerTarget};
use super::units::{
    kill_unit, update_ammo_bar, update_hp_bar, update_morale_bar, BattleScene3, BattleSide,
    PlacedUnit,
};
use crate::models::cities::model::js_number_to_string;

/// Options of a playback (inputs the DTOs do not carry).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct PlaybackOpts {
    /// `projectileKind` of the tower shooter (`_fireOneTower`, `:4238-4245`;
    /// [`super::siege_towers::tower_projectile_kind`]). `None` = no tower
    /// shot expected.
    pub tower_projectile: Option<ProjectileKind>,
}

/// One scene call made by the playback, in call order (the trace the tests
/// compare with the pin order).
#[derive(Debug, Clone, PartialEq)]
pub enum SceneCall {
    /// `Turn`, `Log`, `Clash`, `End`: DOM / P5, no scene change.
    Ui {
        /// Virtual time of the action.
        t0: f64,
    },
    /// [`set_facing`].
    SetFacing {
        /// Unit.
        id: UnitId,
        /// `Dir`.
        dir: i32,
    },
    /// [`MeleeLunge::start`].
    LungeStart {
        /// Attacker.
        attacker: UnitId,
        /// Target.
        target: UnitId,
        /// `t0`.
        t0: f64,
    },
    /// [`fire_one_tower`].
    TowerProjectile {
        /// Wall row of the tower.
        row: i32,
        /// Target.
        target: UnitId,
        /// `t0`.
        t0: f64,
    },
    /// [`update_hp_bar`].
    HpBar {
        /// Unit.
        id: UnitId,
        /// HP shown.
        hp: f64,
    },
    /// [`FloatLabel::damage`].
    DamageLabel {
        /// Unit hit.
        id: UnitId,
        /// Damage.
        dmg: f64,
    },
    /// `_sfxRout` of `_startRout` (audio only).
    RoutSfx {
        /// Unit.
        id: UnitId,
    },
    /// [`kill_unit`]; `removed` = what it returned.
    KillUnit {
        /// Unit.
        id: UnitId,
        /// `true` when the unit left the scene now.
        removed: bool,
    },
    /// [`update_morale_bar`] from a frame.
    MoraleBar {
        /// Unit.
        id: UnitId,
        /// Morale shown.
        morale: f64,
    },
    /// [`update_ammo_bar`] from a frame.
    AmmoBar {
        /// Unit.
        id: UnitId,
        /// Ammunition shown (`Infinity` = unlimited).
        ammo: f64,
    },
}

/// A damage label of the playback (`this.floatLabels` entry of
/// `_spawnDamageLabel`; the DOM element is P5).
#[derive(Debug, Clone, PartialEq)]
pub struct DamageLabel {
    /// Unit hit.
    pub target: UnitId,
    /// Text `'-' + dmg` (`:9945`).
    pub text: String,
    /// `battleLossTextColor(this._isPlayerSide(ru.side))` input (`:9951`):
    /// `true` = a loss of the player side.
    pub player_side_loss: bool,
    /// The 3D data.
    pub label: FloatLabel,
}

/// A step input the playback cannot represent. Reported, never replaced by
/// a default.
#[derive(Debug, Clone, PartialEq)]
pub enum PlaybackError {
    /// A unit id not in the scene (`spawn.id` is the decimal id, adapter
    /// `view::convert::unit_id_string`).
    UnknownUnit(UnitId),
    /// `t0` / `vNow` lower than an item already queued (the engine emits in
    /// time order, `validate_actions`).
    OutOfOrder {
        /// Time of the previous item.
        prev: f64,
        /// Time of the rejected item.
        t0: f64,
    },
    /// `Melee.hitAt != t0 + BLOW_HIT_T` ([`MeleeLunge`] connects at
    /// `BLOW_HIT_T`, `:9122`).
    HitAt {
        /// `t0`.
        t0: f64,
        /// `hitAt`.
        hit_at: f64,
    },
    /// `TowerShot.landAt != t0 + RANGED_FLY_MS` (`:4262`).
    LandAt {
        /// `t0`.
        t0: f64,
        /// `landAt`.
        land_at: f64,
    },
    /// `TowerShot` in a battle without a siege wall or tower on that row.
    NoTower {
        /// Wall row.
        row: i32,
    },
    /// `TowerShot` without [`PlaybackOpts::tower_projectile`].
    MissingTowerProjectileKind,
}

impl std::fmt::Display for PlaybackError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnknownUnit(id) => write!(f, "unit {id} is not in the battle scene"),
            Self::OutOfOrder { prev, t0 } => write!(f, "item at {t0} after {prev}"),
            Self::HitAt { t0, hit_at } => write!(f, "melee at {t0} hits at {hit_at}"),
            Self::LandAt { t0, land_at } => write!(f, "tower shot at {t0} lands at {land_at}"),
            Self::NoTower { row } => write!(f, "no siege tower on row {row}"),
            Self::MissingTowerProjectileKind => write!(f, "tower shot without projectile kind"),
        }
    }
}

impl std::error::Error for PlaybackError {}

#[derive(Debug, Clone, PartialEq)]
enum Item {
    Action(BattleActionDto),
    Frame(BattleFrameDto),
}

impl Item {
    const fn time(&self) -> f64 {
        match self {
            Self::Action(a) => a.t0,
            Self::Frame(f) => f.v_now,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct ActiveLunge {
    attacker: UnitId,
    lunge: MeleeLunge,
}

/// The playback state: queued items, animations in flight, tracked HP,
/// damage labels and the trace of scene calls.
#[derive(Debug, Clone, PartialEq)]
pub struct BattlePlayback {
    opts: PlaybackOpts,
    slots: HashMap<UnitId, (BattleSide, usize)>,
    hp: HashMap<UnitId, f64>,
    queue: VecDeque<Item>,
    last_queued: f64,
    lunges: Vec<ActiveLunge>,
    projectiles: Vec<Projectile>,
    labels: Vec<DamageLabel>,
    calls: Vec<SceneCall>,
}

/// `Math.max(0, x)` (`:8991`): `NaN` stays `NaN`, `±0` and negatives give `+0`.
fn js_max0(x: f64) -> f64 {
    if x.is_nan() || x > 0.0 {
        x
    } else {
        0.0
    }
}

impl BattlePlayback {
    /// A playback of `b` (the scene after the battle constructor, P4-1G Q4):
    /// units are indexed by their decimal `spawn.id`; the tracked HP starts at
    /// `spawn.hp`. A unit whose id is not a decimal `UnitId` cannot be named
    /// by the DTOs and is left out (any action naming it is
    /// [`PlaybackError::UnknownUnit`]).
    #[must_use]
    pub fn new(b: &BattleScene3, opts: PlaybackOpts) -> Self {
        let mut slots = HashMap::new();
        let mut hp = HashMap::new();
        let sides = [(BattleSide::Atk, &b.atk), (BattleSide::Def, &b.def)];
        for (side, list) in sides {
            for (i, u) in list.iter().enumerate() {
                let Some(id) = u
                    .spawn
                    .id
                    .parse::<u64>()
                    .ok()
                    .and_then(|v| UnitId::try_new(v).ok())
                else {
                    continue;
                };
                slots.insert(id, (side, i));
                hp.insert(id, u.spawn.hp);
            }
        }
        Self {
            opts,
            slots,
            hp,
            queue: VecDeque::new(),
            last_queued: f64::NEG_INFINITY,
            lunges: Vec::new(),
            projectiles: Vec::new(),
            labels: Vec::new(),
            calls: Vec::new(),
        }
    }

    fn check_order(&mut self, t: f64) -> Result<(), PlaybackError> {
        if t < self.last_queued {
            return Err(PlaybackError::OutOfOrder {
                prev: self.last_queued,
                t0: t,
            });
        }
        self.last_queued = t;
        Ok(())
    }

    /// Queues the actions of one step in list order. All-or-nothing: on an
    /// out-of-order `t0` nothing is queued.
    ///
    /// # Errors
    /// [`PlaybackError::OutOfOrder`] when a `t0` is lower than the previous
    /// queued item.
    pub fn push_actions(&mut self, actions: &[BattleActionDto]) -> Result<(), PlaybackError> {
        let mut prev = self.last_queued;
        for a in actions {
            if a.t0 < prev {
                return Err(PlaybackError::OutOfOrder { prev, t0: a.t0 });
            }
            prev = a.t0;
        }
        for a in actions {
            self.check_order(a.t0)?;
            self.queue.push_back(Item::Action(a.clone()));
        }
        Ok(())
    }

    /// Queues a frame (applied at `vNow`, after the items queued before it).
    ///
    /// # Errors
    /// [`PlaybackError::OutOfOrder`] when `vNow` is lower than the previous
    /// queued item.
    pub fn push_frame(&mut self, frame: &BattleFrameDto) -> Result<(), PlaybackError> {
        self.check_order(frame.v_now)?;
        self.queue.push_back(Item::Frame(frame.clone()));
        Ok(())
    }

    /// Plays up to the virtual time `now`: every queued item with time
    /// `<= now`, in queue order (the scene calls of the pin at their time),
    /// then one animation frame at `now` (lunges, projectiles), the order of
    /// the web frame where the blow resolves before the lunge pose
    /// (`stepAnim`, `:9119-9156`). `wall_clock` = `vLastWall`, the start of
    /// the damage labels created now (`:9967`).
    ///
    /// # Errors
    /// The first item the scene cannot represent; items before it are
    /// applied, the failing one is dropped.
    pub fn play_until(
        &mut self,
        b: &mut BattleScene3,
        now: f64,
        wall_clock: f64,
    ) -> Result<(), PlaybackError> {
        while self.queue.front().is_some_and(|it| it.time() <= now) {
            let Some(item) = self.queue.pop_front() else {
                break;
            };
            match item {
                Item::Action(a) => self.apply_action(b, &a, wall_clock)?,
                Item::Frame(f) => self.apply_frame(b, &f)?,
            }
        }
        self.step_animations(b, now);
        Ok(())
    }

    fn slot(&self, id: UnitId) -> Result<(BattleSide, usize), PlaybackError> {
        self.slots
            .get(&id)
            .copied()
            .ok_or(PlaybackError::UnknownUnit(id))
    }

    fn unit<'a>(&self, b: &'a BattleScene3, id: UnitId) -> Result<&'a PlacedUnit, PlaybackError> {
        Ok(match self.slot(id)? {
            (BattleSide::Atk, i) => &b.atk[i],
            (BattleSide::Def, i) => &b.def[i],
        })
    }

    fn unit_mut<'a>(
        &self,
        b: &'a mut BattleScene3,
        id: UnitId,
    ) -> Result<&'a mut PlacedUnit, PlaybackError> {
        Ok(match self.slot(id)? {
            (BattleSide::Atk, i) => &mut b.atk[i],
            (BattleSide::Def, i) => &mut b.def[i],
        })
    }

    fn set_hp_bar(
        &mut self,
        b: &mut BattleScene3,
        id: UnitId,
        hp: f64,
    ) -> Result<(), PlaybackError> {
        let u = self.unit(b, id)?;
        let (bars, max_hp) = (u.bars, u.spawn.max_hp);
        update_hp_bar(&mut b.field.field.scene, &bars, hp, max_hp);
        self.hp.insert(id, hp);
        self.calls.push(SceneCall::HpBar { id, hp });
        Ok(())
    }

    /// Applies one action now (the scene call of the pin, see the module
    /// table). Normally called through [`Self::play_until`].
    ///
    /// # Errors
    /// [`PlaybackError`] for a unit / tower the scene does not have, a
    /// `hitAt` / `landAt` other than the pin constants, or a tower shot
    /// without [`PlaybackOpts::tower_projectile`].
    pub fn apply_action(
        &mut self,
        b: &mut BattleScene3,
        a: &BattleActionDto,
        wall_clock: f64,
    ) -> Result<(), PlaybackError> {
        match &a.action {
            BattleActionKindDto::Turn { .. }
            | BattleActionKindDto::Log { .. }
            | BattleActionKindDto::Clash { .. }
            | BattleActionKindDto::End { .. } => {
                self.calls.push(SceneCall::Ui { t0: a.t0 });
            }
            BattleActionKindDto::Facing { id, dir } => {
                let u = self.unit(b, *id)?.clone();
                set_facing(&mut b.field.field.scene, &u, *dir);
                self.calls.push(SceneCall::SetFacing { id: *id, dir: *dir });
            }
            BattleActionKindDto::Melee {
                attacker,
                target,
                hit_at,
            } => {
                if *hit_at != a.t0 + BLOW_HIT_T {
                    return Err(PlaybackError::HitAt {
                        t0: a.t0,
                        hit_at: *hit_at,
                    });
                }
                let ua = self.unit(b, *attacker)?;
                let ud = self.unit(b, *target)?;
                let lunge =
                    MeleeLunge::start(&b.field.grid, (ua.col, ua.row), (ud.col, ud.row), a.t0);
                self.lunges.push(ActiveLunge {
                    attacker: *attacker,
                    lunge,
                });
                self.calls.push(SceneCall::LungeStart {
                    attacker: *attacker,
                    target: *target,
                    t0: a.t0,
                });
            }
            BattleActionKindDto::TowerShot {
                row,
                target,
                land_at,
            } => {
                if *land_at != a.t0 + RANGED_FLY_MS {
                    return Err(PlaybackError::LandAt {
                        t0: a.t0,
                        land_at: *land_at,
                    });
                }
                let kind = self
                    .opts
                    .tower_projectile
                    .ok_or(PlaybackError::MissingTowerProjectileKind)?;
                let ud = self.unit(b, *target)?;
                let cell = (ud.col, ud.row);
                let wall_col = b
                    .field
                    .siege
                    .as_ref()
                    .map(|s| s.wall_col)
                    .ok_or(PlaybackError::NoTower { row: *row })?;
                let tower = b
                    .wall
                    .as_ref()
                    .and_then(|w| w.towers.iter().find(|t| t.row == *row))
                    .cloned()
                    .ok_or(PlaybackError::NoTower { row: *row })?;
                let shot = fire_one_tower(
                    &mut b.field.field.scene,
                    &b.field.grid,
                    &tower,
                    wall_col,
                    false,
                    Some(TowerTarget {
                        col: cell.0,
                        row: cell.1,
                        name: "",
                    }),
                    kind,
                    a.t0,
                )
                .ok_or(PlaybackError::NoTower { row: *row })?;
                self.projectiles.push(shot.projectile);
                self.calls.push(SceneCall::TowerProjectile {
                    row: *row,
                    target: *target,
                    t0: a.t0,
                });
            }
            BattleActionKindDto::Damage { target, dmg } => {
                let hp = js_max0(self.hp.get(target).copied().unwrap_or(f64::NAN) - dmg);
                self.set_hp_bar(b, *target, hp)?;
                let u = self.unit(b, *target)?;
                let label = FloatLabel::damage(&b.field.grid, u.col, u.row, wall_clock);
                let player_side_loss = u.spawn.side == b.player_side;
                self.labels.push(DamageLabel {
                    target: *target,
                    text: format!("-{}", js_number_to_string(*dmg)),
                    player_side_loss,
                    label,
                });
                self.calls.push(SceneCall::DamageLabel {
                    id: *target,
                    dmg: *dmg,
                });
            }
            BattleActionKindDto::Rout { id } => {
                self.slot(*id)?;
                self.calls.push(SceneCall::RoutSfx { id: *id });
            }
            BattleActionKindDto::Kill { id } => {
                // `_startFade` guard (`:9928`): a removed unit is a no-op.
                if self.unit(b, *id)?.removed {
                    self.calls.push(SceneCall::KillUnit {
                        id: *id,
                        removed: false,
                    });
                    return Ok(());
                }
                // The killing blow: `hp = Math.max(0, hp - dmg)` with `hp - dmg <= 0`
                // (the only `_startFade` of the producer is the `hp <= 0` branch of
                // `_resolveBlowOutcome`, `:9044-9047`) and `_updateHpBar` (`:8992`).
                self.set_hp_bar(b, *id, 0.0)?;
                let mut u = self.unit(b, *id)?.clone();
                let removed = kill_unit(&mut b.field.field.scene, &mut u, false, false);
                *self.unit_mut(b, *id)? = u;
                self.calls.push(SceneCall::KillUnit { id: *id, removed });
            }
        }
        Ok(())
    }

    /// Applies a frame now: the morale and ammunition bars of every unit
    /// still in the scene (`_updateMoraleBar`, `_updateAmmoBar`). Removed
    /// units are skipped (detached, `_removeUnitFromScene` `:9915-9918`).
    ///
    /// # Errors
    /// [`PlaybackError::UnknownUnit`] for a unit the scene does not have.
    pub fn apply_frame(
        &mut self,
        b: &mut BattleScene3,
        frame: &BattleFrameDto,
    ) -> Result<(), PlaybackError> {
        for fu in &frame.units {
            let u = self.unit(b, fu.id)?;
            if u.removed {
                continue;
            }
            let (bars, shown, morale_max, ammo_max) = (
                u.bars,
                u.ammo_bar_shown,
                u.spawn.morale_max,
                u.spawn.ammo_max,
            );
            let scene = &mut b.field.field.scene;
            update_morale_bar(scene, &bars, fu.morale, morale_max);
            self.calls.push(SceneCall::MoraleBar {
                id: fu.id,
                morale: fu.morale,
            });
            let ammo = fu.ammo_left.unwrap_or(f64::INFINITY);
            update_ammo_bar(scene, &bars, shown, ammo, ammo_max);
            self.calls.push(SceneCall::AmmoBar { id: fu.id, ammo });
        }
        Ok(())
    }

    /// Resync of all three bars from a frame (the reset paths of the pin,
    /// `_updateHpBar` + `_updateMoraleBar` + `_updateAmmoBar`, `:4581-4583`,
    /// `:4725-4727`, `:5497-5499`, `:17269-17271`; and the end of a
    /// fast-forward, which produces no `Damage`, `:9943`). The tracked HP
    /// becomes the frame HP. Removed units are skipped.
    ///
    /// # Errors
    /// [`PlaybackError::UnknownUnit`] for a unit the scene does not have.
    pub fn apply_snapshot(
        &mut self,
        b: &mut BattleScene3,
        frame: &BattleFrameDto,
    ) -> Result<(), PlaybackError> {
        for fu in &frame.units {
            if self.unit(b, fu.id)?.removed {
                continue;
            }
            self.set_hp_bar(b, fu.id, fu.hp)?;
        }
        self.apply_frame(b, frame)
    }

    /// One animation frame at `now`: every lunge in flight
    /// ([`MeleeLunge::step`] with `attacker_alive = !removed`, `:9147`) and
    /// the projectiles ([`tick_projectiles`]); finished ones are dropped.
    fn step_animations(&mut self, b: &mut BattleScene3, now: f64) {
        let mut keep = Vec::with_capacity(self.lunges.len());
        for mut l in std::mem::take(&mut self.lunges) {
            let Ok(u) = self.unit(b, l.attacker) else {
                continue;
            };
            let u = u.clone();
            let st = l.lunge.step(&mut b.field.field.scene, &u, now, !u.removed);
            if !st.finished {
                keep.push(l);
            }
        }
        self.lunges = keep;
        tick_projectiles(&mut b.field.field.scene, &mut self.projectiles, now);
    }

    /// The scene calls made so far, in order.
    #[must_use]
    pub fn calls(&self) -> &[SceneCall] {
        &self.calls
    }

    /// The damage labels spawned so far, in order.
    #[must_use]
    pub fn labels(&self) -> &[DamageLabel] {
        &self.labels
    }

    /// The tracked HP of a unit (spawn HP, then the `Damage` / `Kill` /
    /// snapshot updates).
    #[must_use]
    pub fn hp(&self, id: UnitId) -> Option<f64> {
        self.hp.get(&id).copied()
    }

    /// Lunges still in flight.
    #[must_use]
    pub fn lunges_in_flight(&self) -> usize {
        self.lunges.len()
    }

    /// Projectiles still in flight.
    #[must_use]
    pub fn projectiles(&self) -> &[Projectile] {
        &self.projectiles
    }

    /// Items still queued.
    #[must_use]
    pub fn queued(&self) -> usize {
        self.queue.len()
    }
}
