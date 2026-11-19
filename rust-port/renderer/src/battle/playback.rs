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
//! | `Move` | `_doMove` 3D (`:8714-8776`): `ru.q = col; ru.r = row` (`:8731`), walk from `t0` (`:8752`) to `t0 + MOVE_STEP_MS`; its turn is the separate `Facing` with the same `t0` (`_updateFacing`, `:8750`) | [`MoveAnim::start`] (stepped by [`BattlePlayback::play_until`]) |
//! | `Shot` | `_doRangedAttack` 3D (`:9179-9221`): projectile of `projectileKind(attacker.bu)` (`:9203`) from the shooter's to the target's torso (`:9200-9201`), hit at `t0 + RANGED_FLY_MS` (`:9224`); its turn is the separate `Facing` (`:9182-9184`), the hit is the separate `Damage` (`:9226`) | [`projectile_kind`] + [`ranged_shot_endpoints`] + [`launch_projectile`], [`tick_projectiles`] |
//! | `Turn`, `Log`, `Clash` | `hint`, `this.log.push`, `_pushClash` | — (DOM / P5; recorded) |
//! | `End` | `this.finished = true` (`:10210`, `:9468`, `:9489`) + `_showEndScreen` | flag `finished`: the rAF callbacks of the stone and the ram snap / remove at their next frame (`:7347`, `:7585`) |
//! | `Leave` | `_fleeStep` → `_removeUnitFromScene` (`:9853-9857`, `:9910-9925`), after the last walk of the flight ended (`done()`, `:9884-9890`) | [`remove_unit_from_scene`] (a walk of the unit still in flight is finished at `t0` first) |
//! | `Shaken` | `_shakeAlliesOnLoss` → `_updateMoraleBar(a)` (`:9748-9749`) | [`update_morale_bar`] |
//! | `ClimbWall` | `_trySiegeTowerClimb` (`:8067-8079`): `ru.q = wallCol`, model at `(x, 2.5, z)`, bars `HPBAR_Y` above | [`climb_onto_wall_walkway`] |
//! | `Boulder` | `_attackWallTile` → `_spawnCatapultBoulder` (`:7547-7552`, `:7571-7600`), hit at `t0 + 700` (`:7555`) | [`wall_shot_endpoints`] + [`Boulder::spawn`], stepped by [`BattlePlayback::play_until`] |
//! | `WallDamage` | the `_schedule(700)` callback (`:7556-7561`): `wallTileHp.set`, HUD, `_spawnWallLabel(…, '-' + dmg + ' (mur)', '#ff8800')` | [`FloatLabel::wall`] ([`WallLabel`]) + tracked tile HP |
//! | `Ram` | `_attackGate` → `_animateRam(ru.group, gateDir)` (`:7316-7323`, `:7337-7360`), back at `t0 + 320` (`:7343`) | [`RamAnim::start`] from the ram's group position, stepped by [`BattlePlayback::play_until`] |
//! | `GateDamage` | `gateHp = Math.max(0, gateHp - dmg)` + HUD (`:7326-7331`) | tracked gate HP (HUD = P5) |
//! | `TowerDestroyed` | `_destroyTowerAtRow(row)` (`:4194-4200`) | [`destroy_tower_at_row`] |
//! | `WallBreach` | `_breachWallTile(row)` scene part (`:7638-7697`): tile `Plains`, label `'MUR WYBURZONY!'` `#ff4400`, segments hidden, rubble | [`breach_wall_tile`] ([`WallLabel`]); the tower is the `TowerDestroyed` before it |
//! | `LeaveField` | the defender leaving the breached tile (`:7700-7741`) | [`retreat_from_wall`] when a cell was found (`to != from`), else only `onWallWalkway = false` |
//! | `GateBreach` | `_breachGate()` scene part (`:7757-7801`) | [`breach_gate`] |
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
//! Walking and unit shots are P4-1I5a (D-WIR-6/7/8); the siege and flight
//! actions are P4-1I5b (#370, D-I5B-1..14). The `match` over
//! [`BattleActionKindDto`] stays exhaustive (no `_ =>` arm), so a new variant
//! does not compile until it has a consumer.
//!
//! `Kill` of a defender catapult standing on a breached wall tile
//! (`_breachWallTile` → `_startFade(u)`, `:7702-7704`) is not a blow: the pin
//! does not touch its HP bar (`_startFade` `:9927-9938`). The playback marks
//! the defenders on the breached cell at the `WallBreach` and skips the HP bar
//! of their `Kill` at the same `t0` (D-I5B-15).
//!
//! Gap of the DTO (reported, not filled in): `TowerShot` carries no projectile
//! kind; the web derives it from the tower shooter row
//! (`projectileKind` of the synthetic shooter, `:4238-4245`,
//! [`super::siege_towers::tower_projectile_kind`]). The caller passes it in
//! [`PlaybackOpts::tower_projectile`]; a `TowerShot` without it is an error.

use std::collections::{HashMap, HashSet, VecDeque};

use civ_view_model::battle::{BattleActionDto, BattleActionKindDto, BattleFrameDto};
use civ_view_model::ids::UnitId;

use super::dynamics::{
    breach_gate, breach_wall_tile, launch_projectile, projectile_kind, ranged_shot_endpoints,
    retreat_from_wall, set_facing, tick_projectiles, wall_shot_endpoints, Boulder, FloatLabel,
    MeleeLunge, MoveAnim, Projectile, ProjectileKind, RamAnim, BLOW_HIT_T, BOULDER_MS,
    MOVE_STEP_MS, RAM_MS, RANGED_FLY_MS,
};
use super::field::{BF_COLS, BF_ROWS};
use super::siege_towers::{destroy_tower_at_row, fire_one_tower, TowerTarget};
use super::units::{
    climb_onto_wall_walkway, kill_unit, remove_unit_from_scene, update_ammo_bar, update_hp_bar,
    update_morale_bar, BattleScene3, BattleSide, PlacedUnit,
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
    /// [`MoveAnim::start`] of a `Move` (`_doMove`).
    MoveStart {
        /// Unit.
        id: UnitId,
        /// Cell before the step.
        from: (i32, i32),
        /// Cell after the step.
        to: (i32, i32),
        /// `t0`.
        t0: f64,
    },
    /// [`launch_projectile`] of a `Shot` (`_doRangedAttack`).
    UnitProjectile {
        /// Shooter.
        attacker: UnitId,
        /// Target.
        target: UnitId,
        /// `projectileKind(attacker.bu)`.
        kind: ProjectileKind,
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
    /// `End`: `this.finished = true` (and `_showEndScreen`, P5).
    Finished {
        /// Virtual time of the action.
        t0: f64,
    },
    /// [`remove_unit_from_scene`] of a `Leave`; `removed` = the unit left
    /// the scene now (`false`: already removed, `_removeUnitFromScene` is
    /// idempotent, `:9911`).
    LeaveField {
        /// Unit.
        id: UnitId,
        /// `true` when the unit left the scene now.
        removed: bool,
    },
    /// [`update_morale_bar`] of a `Shaken` (`_shakeAlliesOnLoss`).
    Shaken {
        /// Ally.
        id: UnitId,
        /// Morale shown.
        morale: f64,
    },
    /// [`climb_onto_wall_walkway`].
    Climb {
        /// Unit.
        id: UnitId,
        /// Wall cell.
        to: (i32, i32),
    },
    /// [`Boulder::spawn`].
    BoulderLaunch {
        /// Catapult.
        id: UnitId,
        /// Wall row.
        row: i32,
        /// `t0`.
        t0: f64,
    },
    /// The stone hit of `WallDamage`: tile HP and the wall label.
    WallHit {
        /// Wall row.
        row: i32,
        /// Tile HP after the hit.
        hp: f64,
    },
    /// [`RamAnim::start`].
    RamStart {
        /// The ram.
        id: UnitId,
        /// `t0`.
        t0: f64,
    },
    /// `GateDamage`: gate HP (HUD, P5).
    GateHp {
        /// Gate HP after the hit.
        hp: f64,
    },
    /// [`destroy_tower_at_row`].
    TowerDestroyed {
        /// Wall row.
        row: i32,
    },
    /// [`breach_wall_tile`].
    WallBreach {
        /// Wall row.
        row: i32,
        /// Rubble pieces appended to the scene root.
        rubble: usize,
    },
    /// The defender leaving the breached tile: [`retreat_from_wall`]
    /// (`moved`) or only `onWallWalkway = false` (no free cell).
    WallRetreat {
        /// Unit.
        id: UnitId,
        /// Cell after.
        to: (i32, i32),
        /// `true` when the model was moved.
        moved: bool,
    },
    /// [`breach_gate`].
    GateBreach,
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

/// `_spawnWallLabel(wallCol, row, text, color)` (`:7814-7830`): the wall
/// hit label `'-' + dmg + ' (mur)'` in `#ff8800` (`:7561`) and the breach
/// label `'MUR WYBURZONY!'` in `#ff4400` (`:7649`); the DOM element is P5.
#[derive(Debug, Clone, PartialEq)]
pub struct WallLabel {
    /// Wall row.
    pub row: i32,
    /// Text.
    pub text: String,
    /// CSS colour.
    pub color: &'static str,
    /// The 3D data.
    pub label: FloatLabel,
}

/// Colour of the wall hit label (`:7561`).
pub const WALL_HIT_COLOR: &str = "#ff8800";
/// Colour of the breach label (`:7649`).
pub const WALL_BREACH_COLOR: &str = "#ff4400";
/// Text of the breach label (`:7649`).
pub const WALL_BREACH_TEXT: &str = "MUR WYBURZONY!";

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
    /// `Move.arriveAt != t0 + MOVE_STEP_MS` ([`MoveAnim`] ends at
    /// `MOVE_STEP_MS`, `:1010`, `:8754`).
    ArriveAt {
        /// `t0`.
        t0: f64,
        /// `arriveAt`.
        arrive_at: f64,
    },
    /// `Move.from` is not the unit's current cell in the scene (the steps of
    /// a unit chain: each starts where the previous one ended, `:8731`).
    MoveFrom {
        /// Unit.
        id: UnitId,
        /// `from` of the action.
        expected: (i32, i32),
        /// The unit's cell in the scene.
        actual: (i32, i32),
    },
    /// `Shot.landAt != t0 + RANGED_FLY_MS` (`:9224`).
    ShotLandAt {
        /// `t0`.
        t0: f64,
        /// `landAt`.
        land_at: f64,
    },
    /// `Boulder.landAt != t0 + BOULDER_MS` (`_schedule(700, …)`, `:7555`).
    BoulderLandAt {
        /// `t0`.
        t0: f64,
        /// `landAt`.
        land_at: f64,
    },
    /// `Ram.until != t0 + RAM_MS` (`duration = 320`, `:7343`).
    RamUntil {
        /// `t0`.
        t0: f64,
        /// `until`.
        until: f64,
    },
    /// A wall / gate action in a battle without a siege layout (no
    /// `siegeWallCol` / `siegeGateCol`; the pin's guards `:7311`, `:7541`).
    NoSiege,
    /// A target cell outside the battle grid (`BF_COLS` × `BF_ROWS`).
    CellOutOfGrid {
        /// Column.
        col: i32,
        /// Row.
        row: i32,
    },
    /// `ClimbWall` not onto the wall column, or not from beside the wall
    /// base (`ru.q + dc === siegeWallCol - 1`, `:8062`).
    Climb {
        /// Unit.
        id: UnitId,
        /// Cell before.
        from: (i32, i32),
        /// Cell after.
        to: (i32, i32),
        /// `siegeWallCol`.
        wall_col: i32,
    },
    /// `LeaveField` of a unit that is not on the wall walk (`:7701`).
    NotOnWall(UnitId),
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
            Self::ArriveAt { t0, arrive_at } => write!(f, "step at {t0} arrives at {arrive_at}"),
            Self::MoveFrom {
                id,
                expected,
                actual,
            } => write!(
                f,
                "unit {id} steps from {expected:?} but stands on {actual:?}"
            ),
            Self::ShotLandAt { t0, land_at } => write!(f, "unit shot at {t0} lands at {land_at}"),
            Self::BoulderLandAt { t0, land_at } => write!(f, "stone at {t0} lands at {land_at}"),
            Self::RamUntil { t0, until } => write!(f, "ram at {t0} ends at {until}"),
            Self::NoSiege => write!(f, "siege action in a battle without a siege wall"),
            Self::CellOutOfGrid { col, row } => write!(f, "cell ({col}, {row}) outside the grid"),
            Self::Climb {
                id,
                from,
                to,
                wall_col,
            } => write!(
                f,
                "unit {id} climbs from {from:?} to {to:?}, wall column {wall_col}"
            ),
            Self::NotOnWall(id) => write!(f, "unit {id} leaves the wall but is not on it"),
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

#[derive(Debug, Clone, Copy, PartialEq)]
struct ActiveMove {
    id: UnitId,
    anim: MoveAnim,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct ActiveRam {
    id: UnitId,
    anim: RamAnim,
}

/// Siege state the actions carry (HUD inputs, P5): `wallTileHp`, `gateHp`,
/// `gateOpen`.
#[derive(Debug, Clone, PartialEq, Default)]
struct SiegeTrack {
    wall_tile_hp: Vec<(i32, f64)>,
    gate_hp: Option<f64>,
    gate_open: bool,
}

/// The playback state: queued items, animations in flight, tracked HP,
/// damage labels and the trace of scene calls.
///
/// Contract of the caller (the P5 battle driver), the DTOs carry no flag for
/// it: during a fast-forward the pin keeps lowering `bu.hp` and calling
/// `_updateHpBar` at every blow (`:8991-8992`), but the engine emits no
/// `Damage` (`_spawnDamageLabel` returns under `_ffActive`, `:9940-9943`;
/// producer `engine/src/domain/siege_tactics_loop.rs` `emit`). The tracked
/// HP is then stale, so after every fast-forward (and before the next
/// `Damage` is played) the caller MUST call [`Self::apply_snapshot`] with the
/// frame of the end of the fast-forward. Without it the next `Damage` shows
/// `spawn / last tracked HP − dmg` instead of the engine HP (pinned by the
/// test `fast_forward_gap_is_closed_by_snapshot`).
#[derive(Debug, Clone, PartialEq)]
pub struct BattlePlayback {
    opts: PlaybackOpts,
    slots: HashMap<UnitId, (BattleSide, usize)>,
    hp: HashMap<UnitId, f64>,
    queue: VecDeque<Item>,
    last_queued: f64,
    lunges: Vec<ActiveLunge>,
    moves: Vec<ActiveMove>,
    projectiles: Vec<Projectile>,
    labels: Vec<DamageLabel>,
    calls: Vec<SceneCall>,
    rams: Vec<ActiveRam>,
    boulders: Vec<Boulder>,
    wall_labels: Vec<WallLabel>,
    siege: SiegeTrack,
    finished: bool,
    breach_fades: Vec<(UnitId, f64)>,
    /// `ru.routed` (`_startRout` `:9802`; never reset in the pin): from a `Rout` action or a frame with `routed`.
    /// The breach filter skips these units (`:7699`, D-I5B-16).
    routed: HashSet<UnitId>,
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
            moves: Vec::new(),
            projectiles: Vec::new(),
            labels: Vec::new(),
            calls: Vec::new(),
            rams: Vec::new(),
            boulders: Vec::new(),
            wall_labels: Vec::new(),
            siege: SiegeTrack::default(),
            finished: false,
            breach_fades: Vec::new(),
            routed: HashSet::new(),
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
    /// applied, the failing one is dropped, the items after it stay queued.
    /// The animation frame at `now` is stepped in both cases, so the
    /// animations already in flight do not stall on an error.
    pub fn play_until(
        &mut self,
        b: &mut BattleScene3,
        now: f64,
        wall_clock: f64,
    ) -> Result<(), PlaybackError> {
        let res = self.play_items(b, now, wall_clock);
        self.step_animations(b, now);
        res
    }

    fn play_items(
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
    /// `hitAt` / `landAt` / `arriveAt` / `until` other than the pin
    /// constants, a step / climb / retreat whose `from` is not the unit's
    /// cell, a climb not onto the wall from beside it, a retreat of a unit not
    /// on the wall, a target cell outside the grid, a siege action without a
    /// siege layout, or a tower shot without [`PlaybackOpts::tower_projectile`].
    pub fn apply_action(
        &mut self,
        b: &mut BattleScene3,
        a: &BattleActionDto,
        wall_clock: f64,
    ) -> Result<(), PlaybackError> {
        // The breach marks (D-I5B-15) hold only within the `t0` of their `WallBreach`.
        self.breach_fades
            .retain(|(_, t)| t.to_bits() == a.t0.to_bits());
        match &a.action {
            BattleActionKindDto::Turn { .. }
            | BattleActionKindDto::Log { .. }
            | BattleActionKindDto::Clash { .. } => {
                self.calls.push(SceneCall::Ui { t0: a.t0 });
            }
            BattleActionKindDto::End { .. } => {
                self.finished = true;
                self.calls.push(SceneCall::Finished { t0: a.t0 });
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
            BattleActionKindDto::Move {
                id,
                from_col,
                from_row,
                to_col,
                to_row,
                arrive_at,
            } => {
                if *arrive_at != a.t0 + MOVE_STEP_MS {
                    return Err(PlaybackError::ArriveAt {
                        t0: a.t0,
                        arrive_at: *arrive_at,
                    });
                }
                let u = match self.slot(*id)? {
                    (BattleSide::Atk, i) => &mut b.atk[i],
                    (BattleSide::Def, i) => &mut b.def[i],
                };
                let from = (*from_col, *from_row);
                if (u.col, u.row) != from {
                    return Err(PlaybackError::MoveFrom {
                        id: *id,
                        expected: from,
                        actual: (u.col, u.row),
                    });
                }
                // `_doMove` (`:8721-8731`): both tile tops read before `ru.q/ru.r` move, then the cell
                // changes at `t0`; the walk is stepped from `t0` (`:8752-8771`).
                let anim = MoveAnim::start(&b.field.grid, u, *to_col, *to_row, a.t0);
                // One walk per unit (the pin chains the steps through `done()`, `:8770`): a new
                // step replaces a walk still in flight; the new one starts from the logical cell.
                self.moves.retain(|m| m.id != *id);
                self.moves.push(ActiveMove { id: *id, anim });
                self.calls.push(SceneCall::MoveStart {
                    id: *id,
                    from,
                    to: (*to_col, *to_row),
                    t0: a.t0,
                });
            }
            BattleActionKindDto::Shot {
                attacker,
                target,
                land_at,
            } => {
                if *land_at != a.t0 + RANGED_FLY_MS {
                    return Err(PlaybackError::ShotLandAt {
                        t0: a.t0,
                        land_at: *land_at,
                    });
                }
                let ua = self.unit(b, *attacker)?;
                let ud = self.unit(b, *target)?;
                // `projectileKind(attacker.bu)` (`:9203`, `:1661-1671`): `bu.kategoria` and
                // `stats.Jednostka ?? bu.nazwa` = `spawn.category` / `spawn.model_name`.
                let kind = projectile_kind(&ua.spawn.category, &ua.spawn.model_name);
                let (from, to) =
                    ranged_shot_endpoints(&b.field.grid, (ua.col, ua.row), (ud.col, ud.row));
                let p = launch_projectile(&mut b.field.field.scene, kind, from, to, a.t0);
                self.projectiles.push(p);
                self.calls.push(SceneCall::UnitProjectile {
                    attacker: *attacker,
                    target: *target,
                    kind,
                    t0: a.t0,
                });
            }
            BattleActionKindDto::Rout { id } => {
                self.slot(*id)?;
                self.routed.insert(*id);
                self.calls.push(SceneCall::RoutSfx { id: *id });
            }
            BattleActionKindDto::Leave { id } => self.leave(b, *id, a.t0)?,
            BattleActionKindDto::Shaken { id, fallen, morale } => {
                self.slot(*fallen)?;
                let u = self.unit(b, *id)?;
                let (bars, morale_max) = (u.bars, u.spawn.morale_max);
                update_morale_bar(&mut b.field.field.scene, &bars, *morale, morale_max);
                self.calls.push(SceneCall::Shaken {
                    id: *id,
                    morale: *morale,
                });
            }
            BattleActionKindDto::ClimbWall {
                id,
                from_col,
                from_row,
                to_col,
                to_row,
            } => self.climb(b, *id, (*from_col, *from_row), (*to_col, *to_row))?,
            BattleActionKindDto::Boulder { id, row, land_at } => {
                if *land_at != a.t0 + BOULDER_MS {
                    return Err(PlaybackError::BoulderLandAt {
                        t0: a.t0,
                        land_at: *land_at,
                    });
                }
                let wall_col = Self::wall_col(b)?;
                let u = self.unit(b, *id)?;
                let (from, to) = wall_shot_endpoints(&b.field.grid, (u.col, u.row), wall_col, *row);
                let stone = Boulder::spawn(&mut b.field.field.scene, from, to, a.t0);
                self.boulders.push(stone);
                self.calls.push(SceneCall::BoulderLaunch {
                    id: *id,
                    row: *row,
                    t0: a.t0,
                });
            }
            BattleActionKindDto::WallDamage { row, dmg, hp_after } => {
                let wall_col = Self::wall_col(b)?;
                match self.siege.wall_tile_hp.iter_mut().find(|(r, _)| r == row) {
                    Some(e) => e.1 = *hp_after,
                    None => self.siege.wall_tile_hp.push((*row, *hp_after)),
                }
                self.wall_labels.push(WallLabel {
                    row: *row,
                    text: format!("-{} (mur)", js_number_to_string(*dmg)),
                    color: WALL_HIT_COLOR,
                    label: FloatLabel::wall(wall_col, *row, wall_clock),
                });
                self.calls.push(SceneCall::WallHit {
                    row: *row,
                    hp: *hp_after,
                });
            }
            BattleActionKindDto::Ram { id, until } => {
                if *until != a.t0 + RAM_MS {
                    return Err(PlaybackError::RamUntil {
                        t0: a.t0,
                        until: *until,
                    });
                }
                let gate = Self::gate_cell(b)?;
                let u = self.unit(b, *id)?;
                // `_attackGate` (`:7316-7323`): `gateDir` and `startPos` from `ru.group.position`.
                let start = b.field.field.scene.nodes[u.group].position;
                let anim = RamAnim::start(start, gate, a.t0);
                self.rams.retain(|r| r.id != *id);
                self.rams.push(ActiveRam { id: *id, anim });
                self.calls.push(SceneCall::RamStart { id: *id, t0: a.t0 });
            }
            BattleActionKindDto::GateDamage { hp_after, .. } => {
                Self::gate_cell(b)?;
                self.siege.gate_hp = Some(*hp_after);
                self.calls.push(SceneCall::GateHp { hp: *hp_after });
            }
            BattleActionKindDto::TowerDestroyed { row } => {
                let wall = b
                    .wall
                    .as_mut()
                    .ok_or(PlaybackError::NoTower { row: *row })?;
                destroy_tower_at_row(&mut b.field.field.scene, &mut wall.towers, *row)
                    .ok_or(PlaybackError::NoTower { row: *row })?;
                self.calls.push(SceneCall::TowerDestroyed { row: *row });
            }
            BattleActionKindDto::WallBreach { row } => {
                let wall_col = Self::wall_col(b)?;
                let (rubble, label) = breach_wall_tile(
                    &mut b.field.field.scene,
                    &mut b.field.grid,
                    b.wall.as_ref(),
                    wall_col,
                    *row,
                    wall_clock,
                );
                self.siege.wall_tile_hp.retain(|(r, _)| r != row);
                self.wall_labels.push(WallLabel {
                    row: *row,
                    text: WALL_BREACH_TEXT.to_owned(),
                    color: WALL_BREACH_COLOR,
                    label,
                });
                // `:7699-7701`: the defenders standing on the breached tile (catapults among them
                // are faded, D-I5B-15); `if (u.dead || u.fadingOut || u.routed) continue` (D-I5B-16).
                for u in &b.def {
                    if u.removed || !u.on_wall_walkway || u.col != wall_col || u.row != *row {
                        continue;
                    }
                    if let Some(id) = Self::spawn_id(u) {
                        if !self.routed.contains(&id) {
                            self.breach_fades.push((id, a.t0));
                        }
                    }
                }
                self.calls.push(SceneCall::WallBreach {
                    row: *row,
                    rubble: rubble.len(),
                });
            }
            BattleActionKindDto::GateBreach {} => {
                let (gate_col, gate_row) = Self::gate_cell(b)?;
                breach_gate(
                    &mut b.field.field.scene,
                    &mut b.field.grid,
                    b.wall.as_ref(),
                    gate_col,
                    gate_row,
                );
                self.siege.gate_open = true;
                self.calls.push(SceneCall::GateBreach);
            }
            BattleActionKindDto::LeaveField {
                id,
                from_col,
                from_row,
                to_col,
                to_row,
            } => self.wall_retreat(b, *id, (*from_col, *from_row), (*to_col, *to_row))?,
            BattleActionKindDto::Kill { id } => {
                // `_startFade` guard (`:9928`): a removed unit is a no-op.
                if self.unit(b, *id)?.removed {
                    self.calls.push(SceneCall::KillUnit {
                        id: *id,
                        removed: false,
                    });
                    return Ok(());
                }
                // A defender catapult on a breached tile (`_breachWallTile` → `_startFade`,
                // `:7702-7704`): no blow, the HP bar stays (D-I5B-15).
                let breach_fade = self.breach_fades.iter().any(|(u, _)| u == id);
                // Otherwise the killing blow: `hp = Math.max(0, hp - dmg)` with `hp - dmg <= 0`
                // (`_resolveBlowOutcome`, `:9044-9047`) and `_updateHpBar` (`:8992`).
                if !breach_fade {
                    self.set_hp_bar(b, *id, 0.0)?;
                }
                let mut u = self.unit(b, *id)?.clone();
                let removed = kill_unit(&mut b.field.field.scene, &mut u, false, false);
                *self.unit_mut(b, *id)? = u;
                self.calls.push(SceneCall::KillUnit { id: *id, removed });
            }
        }
        Ok(())
    }

    fn spawn_id(u: &PlacedUnit) -> Option<UnitId> {
        u.spawn
            .id
            .parse::<u64>()
            .ok()
            .and_then(|v| UnitId::try_new(v).ok())
    }

    fn wall_col(b: &BattleScene3) -> Result<i32, PlaybackError> {
        b.field
            .siege
            .as_ref()
            .map(|s| s.wall_col)
            .ok_or(PlaybackError::NoSiege)
    }

    /// `(siegeGateCol, siegeGateRow)`; the pin's guard `siegeGateCol < 0` (`:7311`).
    fn gate_cell(b: &BattleScene3) -> Result<(i32, i32), PlaybackError> {
        match b.field.siege.as_ref() {
            Some(s) if s.gate_col >= 0 => Ok((s.gate_col, s.gate_row)),
            _ => Err(PlaybackError::NoSiege),
        }
    }

    fn in_grid(c: (i32, i32)) -> Result<(), PlaybackError> {
        if (0..BF_COLS).contains(&c.0) && (0..BF_ROWS).contains(&c.1) {
            Ok(())
        } else {
            Err(PlaybackError::CellOutOfGrid { col: c.0, row: c.1 })
        }
    }

    fn check_from(u: &PlacedUnit, id: UnitId, from: (i32, i32)) -> Result<(), PlaybackError> {
        if (u.col, u.row) == from {
            Ok(())
        } else {
            Err(PlaybackError::MoveFrom {
                id,
                expected: from,
                actual: (u.col, u.row),
            })
        }
    }

    /// `Leave` (`_fleeStep` → `_removeUnitFromScene`): the flight's last walk ends at `done()` (`p >= 1`) before the
    /// removal (`:9884-9890`), so a walk of the unit still in flight is stepped to `t0` and dropped first.
    fn leave(&mut self, b: &mut BattleScene3, id: UnitId, t0: f64) -> Result<(), PlaybackError> {
        let slot = self.slot(id)?;
        if let Some(k) = self.moves.iter().position(|m| m.id == id) {
            let m = self.moves.remove(k);
            let u = self.unit(b, id)?.clone();
            m.anim.step(&mut b.field.field.scene, &u, t0);
        }
        let u = match slot {
            (BattleSide::Atk, i) => &mut b.atk[i],
            (BattleSide::Def, i) => &mut b.def[i],
        };
        let removed = !u.removed;
        remove_unit_from_scene(&mut b.field.field.scene, u);
        self.calls.push(SceneCall::LeaveField { id, removed });
        Ok(())
    }

    /// `ClimbWall` (`_trySiegeTowerClimb`, `:8056-8079`).
    fn climb(
        &mut self,
        b: &mut BattleScene3,
        id: UnitId,
        from: (i32, i32),
        to: (i32, i32),
    ) -> Result<(), PlaybackError> {
        let wall_col = Self::wall_col(b)?;
        Self::in_grid(to)?;
        let slot = self.slot(id)?;
        let u = match slot {
            (BattleSide::Atk, i) => &mut b.atk[i],
            (BattleSide::Def, i) => &mut b.def[i],
        };
        Self::check_from(u, id, from)?;
        // `ru.q + dc === wallBase` for a `DIRS4` step (`:8061-8062`), `ru.q = wallCol` with the row kept (`:8070`).
        let beside = (from.0 - (wall_col - 1)).abs() <= 1;
        if to != (wall_col, from.1) || !beside {
            return Err(PlaybackError::Climb {
                id,
                from,
                to,
                wall_col,
            });
        }
        climb_onto_wall_walkway(&mut b.field.field.scene, u, to.0, to.1);
        self.calls.push(SceneCall::Climb { id, to });
        Ok(())
    }

    /// `LeaveField` (`_breachWallTile`, `:7700-7741`).
    fn wall_retreat(
        &mut self,
        b: &mut BattleScene3,
        id: UnitId,
        from: (i32, i32),
        to: (i32, i32),
    ) -> Result<(), PlaybackError> {
        Self::in_grid(to)?;
        let slot = self.slot(id)?;
        let u = match slot {
            (BattleSide::Atk, i) => &mut b.atk[i],
            (BattleSide::Def, i) => &mut b.def[i],
        };
        Self::check_from(u, id, from)?;
        if !u.on_wall_walkway {
            return Err(PlaybackError::NotOnWall(id));
        }
        let moved = to != from;
        if moved {
            retreat_from_wall(&mut b.field.field.scene, &b.field.grid, u, to.0, to.1);
        } else {
            // No free cell (`:7717`): the unit stays where it is, off the wall walk (`:7739`).
            u.on_wall_walkway = false;
        }
        self.breach_fades.retain(|(f, _)| *f != id);
        self.calls.push(SceneCall::WallRetreat { id, to, moved });
        Ok(())
    }

    /// Applies a frame now: the morale and ammunition bars of every unit
    /// still in the scene (`_updateMoraleBar`, `_updateAmmoBar`). Removed
    /// units are skipped (detached, `_removeUnitFromScene` `:9915-9918`).
    /// The frame fields `dead` / `removed` / `hp` do not change the scene: a
    /// unit leaves it only through a `Kill` action (in P4-1I3 every death is a
    /// blow). Deaths without a blow (breach, `_fleeStep`) get their action in
    /// P4-1I5 (#249/#280), which revisits this.
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
            if fu.routed {
                self.routed.insert(fu.id);
            }
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

    /// One animation frame at `now`: every walk in flight ([`MoveAnim::step`],
    /// `_doMove` `step`, `:8753-8771`), every lunge in flight
    /// ([`MeleeLunge::step`] with `attacker_alive = !removed`, `:9147`) and
    /// the projectiles ([`tick_projectiles`]); finished ones are dropped.
    fn step_animations(&mut self, b: &mut BattleScene3, now: f64) {
        let mut keep_moves = Vec::with_capacity(self.moves.len());
        for m in std::mem::take(&mut self.moves) {
            let Ok(u) = self.unit(b, m.id) else {
                continue;
            };
            let u = u.clone();
            if !m.anim.step(&mut b.field.field.scene, &u, now) {
                keep_moves.push(m);
            }
        }
        self.moves = keep_moves;
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
        // `animRam` / `animBoulder` (`:7346-7360`, `:7584-7601`): one frame each, `this.finished` snaps / removes.
        let finished = self.finished;
        let mut keep_rams = Vec::with_capacity(self.rams.len());
        for r in std::mem::take(&mut self.rams) {
            let Ok(u) = self.unit(b, r.id) else {
                continue;
            };
            let group = u.group;
            if !r.anim.step(&mut b.field.field.scene, group, now, finished) {
                keep_rams.push(r);
            }
        }
        self.rams = keep_rams;
        self.boulders
            .retain(|s| !s.step(&mut b.field.field.scene, now, finished));
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

    /// Walks (`Move`) still in flight.
    #[must_use]
    pub fn moves_in_flight(&self) -> usize {
        self.moves.len()
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

    /// Ram animations still in flight.
    #[must_use]
    pub fn rams_in_flight(&self) -> usize {
        self.rams.len()
    }

    /// Catapult stones still in flight.
    #[must_use]
    pub fn boulders(&self) -> &[Boulder] {
        &self.boulders
    }

    /// The wall labels spawned so far, in order.
    #[must_use]
    pub fn wall_labels(&self) -> &[WallLabel] {
        &self.wall_labels
    }

    /// `wallTileHp.get(row)` as the actions left it (`None`: never hit, or
    /// breached and deleted, `:7646`).
    #[must_use]
    pub fn wall_tile_hp(&self, row: i32) -> Option<f64> {
        self.siege
            .wall_tile_hp
            .iter()
            .find(|(r, _)| *r == row)
            .map(|(_, hp)| *hp)
    }

    /// `gateHp` after the last `GateDamage` (`None`: none yet).
    #[must_use]
    pub fn gate_hp(&self) -> Option<f64> {
        self.siege.gate_hp
    }

    /// `gateOpen` (`GateBreach` played).
    #[must_use]
    pub const fn gate_open(&self) -> bool {
        self.siege.gate_open
    }

    /// `this.finished` (`End` played).
    #[must_use]
    pub const fn finished(&self) -> bool {
        self.finished
    }
}
