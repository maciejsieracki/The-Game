//! Part 4 of MOD-14 "battle 3D" (topic R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4,
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §29–§37): the dynamics
//! and effects of `battle/battleScene.ts` at pin `edb8fb56` (three@0.169.0).
//!
//! The web drives every animation from `requestAnimationFrame` callbacks that
//! read the virtual clock (`_now()` = `vNow`) and write transforms; the
//! battle logic decides WHAT happens (who moves where, who is hit, routs,
//! retreats, morale — P6.13). This module ports the scene side only, as
//! deterministic functions of (state, t):
//!
//! | web | Rust |
//! |---|---|
//! | `MOVE_STEP_MS`, `STEP_GAP_MS`, `RANGED_FLY_MS`, `RANGED_GAP_MS`, `DEATH_FADE_MS`, `BLOW_LUNGE_MS`, `BLOW_HIT_T`, `BLOW_SETTLE_MS`, `MORALE_GATE_BREACH`, `MORALE_WALL_BREACH` (`:945-957`, `:1073-1074`) | `pub const` (test of equality) |
//! | `lerp` / `easeOut` / `easeIn` (`:19438-19441`) | [`lerp`], [`ease_out`], [`ease_in`] |
//! | `projectileKind` / `makeProjectileMesh` (`:1605-1717`) | [`projectile_kind`], [`make_projectile_mesh`] |
//! | `_doRangedAttack` (3D, `:8444-8489`) + `_tickProjectiles` (`:8584-8600`) | [`ranged_shot_endpoints`], [`launch_projectile`], [`tick_projectiles`] |
//! | `_doMove` (3D, `:8011-8072`) | [`MoveAnim`] |
//! | `_doMeleeAttack` (3D, `:8361-8440`) | [`MeleeLunge`] |
//! | `_startFade` / `_tickFades` (`:9082-9089`, `:8602-8622`) | [`Fade`], [`tick_fades`] |
//! | `_attackGate` (3D) / `_animateRam` (`:7000-7053`) | [`RamAnim`] |
//! | `_attackWallTile` (3D) / `_spawnCatapultBoulder` (`:7204-7269`) | [`wall_shot_endpoints`], [`Boulder`] |
//! | `_breachWallTile` (`:7302-7416`) | [`breach_wall_tile`], [`retreat_from_wall`] |
//! | `_breachGate` (`:7421-7474`) | [`breach_gate`] |
//! | `_startRout` (3D, `:8971-8972`), `_updateFacing` / attack facing | [`rout_facing`], [`set_facing`] |
//! | `_makeGroupNumberTexture`, `_removeGroupFrameMarker`, `_updateGroupFrameMarker`, `_syncAllGroupFrameMarkers`, `_groupDisplayNum` (`:18647-18739`, `:14413-14417`) | [`GroupNumberTexture`], [`GroupMarkers`], [`group_display_num`] |
//! | `hpBarGroup.lookAt(camera.position)` of the frame loop (`:8522-8524`, `:8546-8548`) | [`billboard`] |
//! | `_spawnDamageLabel` / `_spawnWallLabel` (3D data) / `_tickFloatLabels` (up to `worldToScreen`) | [`FloatLabel`] |
//! | `_setDeployZoneVisible` (3D), `_endDeployPhase` (3D), deploy-phase frame | [`set_deploy_zone_visible`], [`end_deploy_phase`], [`deploy_phase_frame`] |
//!
//! Everything is verified against vectors produced by RUNNING the web code
//! (`tests/battle3d_dynamics.rs`, `tests/fixtures/battle3d/gen_dynamics.ts`).

use std::f64::consts::PI;

use crate::geom::{Euler, Mat4 as GMat4, Quat as GQuat, Vec3};
use crate::jsmath::js_sin;
use crate::models::cities::model::js_number_to_string;
use crate::pick::three::{Mat4 as PMat4, Quat as PQuat, Vec3 as PVec3};
use crate::scene::{
    quat_from_unit_vectors, Geo, Material, MaterialKind, NodeId, NodeKind, Prim, Scene, ROOT,
};

use super::field::{
    bterrain, cell_to_world, euler_xyz_from_quaternion, lighten, tile_jitter, tile_top_y, FieldGeo,
    FieldScene, OutlineLine, TerrainGrid, BF_COLS, TILE_S,
};
use super::units::{dir_yaw, BattleScene3, BattleSide, PlacedUnit, PlacedWall, HPBAR_Y};

// ------------------------------------------------------------ constants

/// `MOVE_STEP_MS` (`:945`): time to walk one tile.
pub const MOVE_STEP_MS: f64 = 240.0;
/// `STEP_GAP_MS` (`:946`): pause between consecutive tile steps (scheduler).
pub const STEP_GAP_MS: f64 = 70.0;
/// `RANGED_FLY_MS` (`:947`): projectile flight time.
pub const RANGED_FLY_MS: f64 = 380.0;
/// `RANGED_GAP_MS` (`:948`): pause after a ranged shot resolves (scheduler).
pub const RANGED_GAP_MS: f64 = 320.0;
/// `DEATH_FADE_MS` (`:950`).
pub const DEATH_FADE_MS: f64 = 500.0;
/// `BLOW_LUNGE_MS` (`:955`).
pub const BLOW_LUNGE_MS: f64 = 260.0;
/// `BLOW_HIT_T` (`:956`): moment within the lunge the blow connects.
pub const BLOW_HIT_T: f64 = 150.0;
/// `BLOW_SETTLE_MS` (`:957`): settle after a blow (scheduler).
pub const BLOW_SETTLE_MS: f64 = 220.0;
/// `MORALE_GATE_BREACH` (`:1073`): morale loss of every live defender.
pub const MORALE_GATE_BREACH: f64 = 5.0;
/// `MORALE_WALL_BREACH` (`:1074`).
pub const MORALE_WALL_BREACH: f64 = 0.0;

/// `_animateRam` duration (`:7033`, virtual ms).
pub const RAM_MS: f64 = 320.0;
/// `_animateRam` forward distance (`addScaledVector(direction, 0.25)`, `:7032`).
pub const RAM_REACH: f64 = 0.25;
/// `_spawnCatapultBoulder` flight time (`:7244`).
pub const BOULDER_MS: f64 = 700.0;
/// `_spawnCatapultBoulder` arc height (`:7245`).
pub const BOULDER_ARC: f64 = 3.5;
/// Arc of `_tickProjectiles` (`Math.sin(prog * PI) * 0.6`, `:8589`).
pub const PROJECTILE_ARC: f64 = 0.6;
/// Hop of `_doMove` (`Math.sin(p * PI) * 0.12`, `:8059`).
pub const MOVE_HOP: f64 = 0.12;
/// Float-label life (`duration: 2000`, `:7489`, `:9114`).
pub const FLOAT_LABEL_MS: f64 = 2000.0;
/// Float-label rise per ms (`riseRate: 0.00012`).
pub const FLOAT_LABEL_RISE: f64 = 0.000_12;

// ------------------------------------------------------------ easing

/// `lerp(a, b, t)` (`:19438`).
#[must_use]
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

/// `easeOut(t)` (`:19439`).
#[must_use]
pub fn ease_out(t: f64) -> f64 {
    1.0 - (1.0 - t) * (1.0 - t)
}

/// `easeIn(t)` (`:19440`).
#[must_use]
pub fn ease_in(t: f64) -> f64 {
    t * t
}

// ------------------------------------------------------------ projectiles

/// `ProjectileKind` (`:1589`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProjectileKind {
    /// `'arrow'`.
    Arrow,
    /// `'javelin'`.
    Javelin,
    /// `'pilum'`.
    Pilum,
    /// `'sling'`.
    Sling,
}

impl ProjectileKind {
    /// The web string.
    #[must_use]
    pub const fn web_name(self) -> &'static str {
        match self {
            Self::Arrow => "arrow",
            Self::Javelin => "javelin",
            Self::Pilum => "pilum",
            Self::Sling => "sling",
        }
    }
}

/// `projectileKind(bu)` (`:1605-1615`) with `category = bu.kategoria ?? ''`
/// and `name = stats.Jednostka ?? bu.nazwa ?? ''` (the caller resolves the
/// `??` chain; `normName` = `models::unit_core::routing::norm_name`).
#[must_use]
pub fn projectile_kind(category: &str, name: &str) -> ProjectileKind {
    use crate::models::unit_core::routing::norm_name;
    let cat = norm_name(category);
    let name = norm_name(name);
    let hay = format!("{cat} {name}");
    if hay.contains("legionist") {
        return ProjectileKind::Pilum;
    }
    if cat == "procarz" || hay.contains("procar") || hay.contains("sling") {
        return ProjectileKind::Sling;
    }
    if cat == "oszczepnik"
        || hay.contains("oszczep")
        || hay.contains("javelin")
        || hay.contains("atlatl")
        || hay.contains("estolic")
    {
        return ProjectileKind::Javelin;
    }
    // 'lucznik' / 'rydwan' / bows → 'arrow'; anything else defaults to 'arrow'.
    ProjectileKind::Arrow
}

/// `makeProjectileMesh(kind)` (`:1628-1717`): a group laid out along local
/// +X (point at +X). Materials: wood `0x6b4a2b` (0.95 / 0), iron `0x9a9a9a`
/// (0.6 / 0.5), stone `0x8a8378` (0.9 / 0) for the sling.
#[must_use]
pub fn make_projectile_mesh(kind: ProjectileKind) -> Scene {
    let mut s = Scene::with_root(NodeKind::Group);
    let wood = s.add_material(Material::standard(0x006b_4a2b, 0.0, 0.95));
    let iron = s.add_material(Material::standard(0x009a_9a9a, 0.5, 0.6));
    if kind == ProjectileKind::Sling {
        let stone = s.add_material(Material::standard(0x008a_8378, 0.0, 0.9));
        let r = TILE_S * 0.05;
        let id = s.mesh(ROOT, sphere(r, 8, 6), stone);
        s.cast_shadow(id);
        return s;
    }
    let (shaft_len, shaft_r, head_len, head_r) = match kind {
        ProjectileKind::Arrow => {
            let shaft_r = TILE_S * 0.009;
            (TILE_S * 0.34, shaft_r, TILE_S * 0.06, shaft_r * 2.6)
        }
        ProjectileKind::Javelin => {
            let shaft_r = TILE_S * 0.028;
            (TILE_S * 0.60, shaft_r, TILE_S * 0.14, shaft_r * 2.0)
        }
        _ => {
            let shaft_r = TILE_S * 0.024;
            (TILE_S * 0.55, shaft_r, TILE_S * 0.13, shaft_r * 1.8)
        }
    };
    let shaft = s.mesh(ROOT, Prim::cyl(shaft_r, shaft_r, shaft_len, 6), wood);
    s.nodes[shaft].rot_z(-PI / 2.0);
    s.cast_shadow(shaft);

    let head = s.mesh(ROOT, Prim::cone(head_r, head_len, 6), iron);
    s.nodes[head].rot_z(-PI / 2.0);
    s.nodes[head].position.x = shaft_len * 0.5 + head_len * 0.5;
    s.cast_shadow(head);

    if kind == ProjectileKind::Pilum {
        let shank_len = TILE_S * 0.18;
        let shank_r = shaft_r * 0.45;
        let shank = s.mesh(ROOT, Prim::cyl(shank_r, shank_r, shank_len, 5), iron);
        s.nodes[shank].rot_z(-PI / 2.0);
        s.nodes[shank].position.x = shaft_len * 0.5 + shank_len * 0.5;
        s.cast_shadow(shank);
        s.nodes[head].position.x = shaft_len * 0.5 + shank_len + head_len * 0.5;
    } else if kind == ProjectileKind::Arrow {
        let fletch_len = TILE_S * 0.05;
        let fletch_r = shaft_r * 3.2;
        let fletch = s.mesh(ROOT, Prim::cone(fletch_r, fletch_len, 4), wood);
        s.nodes[fletch].rot_z(PI / 2.0);
        s.nodes[fletch].position.x = -(shaft_len * 0.5);
    }
    s
}

fn sphere(r: f64, ws: u32, hs: u32) -> Prim {
    Prim::Sphere {
        r,
        ws,
        hs,
        phi_start: 0.0,
        phi_len: PI * 2.0,
        theta_start: 0.0,
        theta_len: PI,
    }
}

/// Launch and target points of `_doRangedAttack` (`:8470-8471`): torso of the
/// shooter / of the target, each lifted by its own `tileTopY` + 0.5.
#[must_use]
pub fn ranged_shot_endpoints(
    grid: &TerrainGrid,
    attacker: (i32, i32),
    defender: (i32, i32),
) -> (Vec3, Vec3) {
    let (ax, az) = cell_to_world(f64::from(attacker.0), f64::from(attacker.1));
    let (dx, dz) = cell_to_world(f64::from(defender.0), f64::from(defender.1));
    (
        Vec3::new(ax, tile_top_y(grid, attacker.0, attacker.1) + 0.5, az),
        Vec3::new(dx, tile_top_y(grid, defender.0, defender.1) + 0.5, dz),
    )
}

/// One entry of `this.projectiles` (`:2568`).
#[derive(Debug, Clone, PartialEq)]
pub struct Projectile {
    /// The projectile group (a root child while in flight).
    pub node: NodeId,
    /// `from`.
    pub from: Vec3,
    /// `to`.
    pub to: Vec3,
    /// `t0` (virtual ms).
    pub t0: f64,
    /// `dur` (= [`RANGED_FLY_MS`]).
    pub dur: f64,
}

/// The 3D part of `_doRangedAttack` (`:8473-8489`): builds the projectile,
/// places it at `from`, aims its +X along the flight
/// (`setFromUnitVectors((1,0,0), dir)` when `|dir|² > 1e-6`; `quaternion.copy`
/// also rewrites `rotation`), appends it to the scene root.
pub fn launch_projectile(
    scene: &mut Scene,
    kind: ProjectileKind,
    from: Vec3,
    to: Vec3,
    t0: f64,
) -> Projectile {
    let node = scene.graft(ROOT, make_projectile_mesh(kind));
    scene.nodes[node].position = from;
    let dir = to.minus(from);
    let len_sq = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
    if len_sq > 1e-6 {
        let q = quat_from_unit_vectors(Vec3::new(1.0, 0.0, 0.0), dir.normalize());
        set_quaternion(scene, node, q);
    }
    Projectile {
        node,
        from,
        to,
        t0,
        dur: RANGED_FLY_MS,
    }
}

impl Projectile {
    /// Position at virtual time `t` and whether the flight ended
    /// (`_tickProjectiles`, `:8587-8592`).
    #[must_use]
    pub fn sample(&self, t: f64) -> (Vec3, bool) {
        let prog = js_min(1.0, (t - self.t0) / self.dur);
        let x = lerp(self.from.x, self.to.x, prog);
        let y = lerp(self.from.y, self.to.y, prog) + js_sin(prog * PI) * PROJECTILE_ARC;
        let z = lerp(self.from.z, self.to.z, prog);
        (Vec3::new(x, y, z), prog >= 1.0)
    }
}

/// `_tickProjectiles(t)` (`:8584-8600`): moves every projectile, removes the
/// landed ones from the scene and from `list`.
pub fn tick_projectiles(scene: &mut Scene, list: &mut Vec<Projectile>, t: f64) {
    list.retain(|p| {
        let (pos, done) = p.sample(t);
        scene.nodes[p.node].position = pos;
        if done {
            detach(scene, ROOT, p.node);
        }
        !done
    });
}

// ------------------------------------------------------------ walking

/// One `_doMove` step animation (`:8017-8072`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MoveAnim {
    from: (f64, f64),
    to: (f64, f64),
    from_top: f64,
    to_top: f64,
    t0: f64,
}

/// Group and bar positions of one animation frame.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UnitPose {
    /// `ru.group.position`.
    pub group: Vec3,
    /// `ru.hpBarGroup.position`.
    pub bars: Vec3,
}

impl MoveAnim {
    /// Starts a step of `u` to `(col, row)` at `t0`: both tile tops are read
    /// before the unit's cell changes; the unit's cell becomes the target.
    pub fn start(grid: &TerrainGrid, u: &mut PlacedUnit, col: i32, row: i32, t0: f64) -> Self {
        let from = cell_to_world(f64::from(u.col), f64::from(u.row));
        let to = cell_to_world(f64::from(col), f64::from(row));
        let from_top = tile_top_y(grid, u.col, u.row);
        let to_top = tile_top_y(grid, col, row);
        u.col = col;
        u.row = row;
        Self {
            from,
            to,
            from_top,
            to_top,
            t0,
        }
    }

    /// The frame at virtual time `now` (`step`, `:8050-8070`); `true` = last
    /// frame (snap to the target, `done()`).
    #[must_use]
    pub fn sample(&self, now: f64) -> (UnitPose, bool) {
        let p = js_min(1.0, (now - self.t0) / MOVE_STEP_MS);
        if p < 1.0 {
            let e = ease_out(p);
            let x = lerp(self.from.0, self.to.0, e);
            let z = lerp(self.from.1, self.to.1, e);
            let base_y = lerp(self.from_top, self.to_top, e);
            let hop = js_sin(p * PI) * MOVE_HOP;
            (
                UnitPose {
                    group: Vec3::new(x, base_y + hop, z),
                    bars: Vec3::new(x, base_y + HPBAR_Y, z),
                },
                false,
            )
        } else {
            (
                UnitPose {
                    group: Vec3::new(self.to.0, self.to_top, self.to.1),
                    bars: Vec3::new(self.to.0, self.to_top + HPBAR_Y, self.to.1),
                },
                true,
            )
        }
    }

    /// Applies the frame at `now` to `u`; returns `true` when finished.
    pub fn step(&self, scene: &mut Scene, u: &PlacedUnit, now: f64) -> bool {
        let (pose, done) = self.sample(now);
        apply_pose(scene, u, pose);
        done
    }
}

fn apply_pose(scene: &mut Scene, u: &PlacedUnit, pose: UnitPose) {
    scene.nodes[u.group].position = pose.group;
    scene.nodes[u.bars.group].position = pose.bars;
}

// ------------------------------------------------------------ melee

/// The lunge of `_doMeleeAttack` (`:8364-8440`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MeleeLunge {
    home: Vec3,
    lunge: (f64, f64),
    t0: f64,
    hit_done: bool,
}

/// What one frame of the lunge did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LungeStep {
    /// The blow connects in this frame (`localT >= BLOW_HIT_T`, once): the
    /// logic resolves `_singleBlow` (and a counter) now, before the attacker
    /// is moved.
    pub hit: bool,
    /// Last frame (`localT >= BLOW_LUNGE_MS`; `BLOW_SETTLE_MS` is scheduled).
    pub finished: bool,
}

impl MeleeLunge {
    /// Starts the lunge of the attacker at `attacker` towards `defender`
    /// (cells) at `t0`.
    #[must_use]
    pub fn start(grid: &TerrainGrid, attacker: (i32, i32), defender: (i32, i32), t0: f64) -> Self {
        let (ax, az) = cell_to_world(f64::from(attacker.0), f64::from(attacker.1));
        let (dx, dz) = cell_to_world(f64::from(defender.0), f64::from(defender.1));
        let home = Vec3::new(ax, tile_top_y(grid, attacker.0, attacker.1), az);
        let mid_x = (ax + dx) * 0.5;
        let mid_z = (az + dz) * 0.5;
        Self {
            home,
            lunge: (ax + (mid_x - ax) * 0.6, az + (mid_z - az) * 0.6),
            t0,
            hit_done: false,
        }
    }

    /// Attacker position at `local_t` ms into the lunge (`:8413-8421`).
    #[must_use]
    pub fn pose(&self, local_t: f64) -> UnitPose {
        let (mut ax, mut az) = (self.home.x, self.home.z);
        let half = BLOW_LUNGE_MS * 0.5;
        if local_t < half {
            let p = local_t / half;
            ax = lerp(self.home.x, self.lunge.0, ease_out(p));
            az = lerp(self.home.z, self.lunge.1, ease_out(p));
        } else if local_t < BLOW_LUNGE_MS {
            let p = (local_t - half) / half;
            ax = lerp(self.lunge.0, self.home.x, ease_in(p));
            az = lerp(self.lunge.1, self.home.z, ease_in(p));
        }
        UnitPose {
            group: Vec3::new(ax, self.home.y, az),
            bars: Vec3::new(ax, self.home.y + HPBAR_Y, az),
        }
    }

    /// Whether the blow would connect in a frame at `now` (not yet consumed).
    #[must_use]
    pub fn hit_due(&self, now: f64) -> bool {
        !self.hit_done && now - self.t0 >= BLOW_HIT_T
    }

    /// One frame at `now` (`stepAnim`). `attacker_alive` = `!dead &&
    /// !fadingOut` AFTER the blow of this frame was resolved by the logic
    /// (see [`Self::hit_due`]).
    pub fn step(
        &mut self,
        scene: &mut Scene,
        u: &PlacedUnit,
        now: f64,
        attacker_alive: bool,
    ) -> LungeStep {
        let local_t = now - self.t0;
        let hit = !self.hit_done && local_t >= BLOW_HIT_T;
        if hit {
            self.hit_done = true;
        }
        if attacker_alive {
            apply_pose(scene, u, self.pose(local_t));
        }
        let finished = local_t >= BLOW_LUNGE_MS;
        if finished && attacker_alive {
            apply_pose(
                scene,
                u,
                UnitPose {
                    group: self.home,
                    bars: Vec3::new(self.home.x, self.home.y + HPBAR_Y, self.home.z),
                },
            );
        }
        LungeStep { hit, finished }
    }
}

// ------------------------------------------------------------ facing / rout

/// `ru.group.rotation.y = dirYaw(facing)` (attack facing `:8370`, `:8405`,
/// `:8451`; `_updateFacing` `:7708`; `_startRout` `:8972`).
pub fn set_facing(scene: &mut Scene, u: &PlacedUnit, facing: i32) {
    scene.nodes[u.group].rot_y(dir_yaw(facing));
}

/// `_startRout` (`:8971`): a routed unit faces its own home edge — the
/// attacker west (`Dir.W` = 3), the defender east (`Dir.E` = 1).
#[must_use]
pub const fn rout_facing(side: BattleSide) -> i32 {
    match side {
        BattleSide::Atk => 3,
        BattleSide::Def => 1,
    }
}

// ------------------------------------------------------------ death fade

/// `_startFade(ru)` (`:9082-9089`): fade start in virtual ms.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Fade {
    /// `ru.fadeStart`.
    pub start: f64,
}

impl Fade {
    /// `p` of `_tickFades` at `t` (`:8605`).
    #[must_use]
    pub fn progress(&self, t: f64) -> f64 {
        js_min(1.0, (t - self.start) / DEATH_FADE_MS)
    }

    /// One `_tickFades` step for `u` (`:8605-8619`): every material of the
    /// model's `userData.mats` becomes transparent with opacity `1 - p`, the
    /// model scales by `1 - 0.6 p`; at `p >= 1` model and bars are hidden.
    /// Returns `true` when the fade ended (the unit is dead).
    pub fn step(&self, scene: &mut Scene, u: &PlacedUnit, t: f64) -> bool {
        let p = self.progress(t);
        let mats: Vec<usize> = scene.nodes[u.group]
            .user_data
            .mats("mats")
            .map(<[usize]>::to_vec)
            .unwrap_or_default();
        for m in mats {
            scene.materials[m].transparent = true;
            scene.materials[m].opacity = 1.0 - p;
        }
        scene.nodes[u.group].set_scale_scalar(1.0 - p * 0.6);
        if p >= 1.0 {
            scene.nodes[u.group].visible = false;
            scene.nodes[u.bars.group].visible = false;
            return true;
        }
        false
    }
}

/// `_tickFades(t)` over `(unit index, fade)` pairs of `units`; the finished
/// fades leave `list`.
pub fn tick_fades(scene: &mut Scene, units: &[PlacedUnit], list: &mut Vec<(usize, Fade)>, t: f64) {
    list.retain(|&(i, f)| !f.step(scene, &units[i], t));
}

// ------------------------------------------------------------ siege: ram

/// `_animateRam(ru.group, gateDir)` started by `_attackGate` (`:7007-7013`,
/// `:7029-7053`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RamAnim {
    start: Vec3,
    hit: Vec3,
    t0: f64,
}

impl RamAnim {
    /// `gateDir` = normalised (gate − ram) in XZ; the ram reaches
    /// `start + gateDir * 0.25`.
    #[must_use]
    pub fn start(start: Vec3, gate: (i32, i32), t0: f64) -> Self {
        let (gx, gz) = cell_to_world(f64::from(gate.0), f64::from(gate.1));
        let dir = Vec3::new(gx - start.x, 0.0, gz - start.z).normalize();
        let hit = Vec3::new(
            start.x + dir.x * RAM_REACH,
            start.y + dir.y * RAM_REACH,
            start.z + dir.z * RAM_REACH,
        );
        Self { start, hit, t0 }
    }

    /// Ram position at `now` and whether the animation ended. `finished` is
    /// the battle's `this.finished` (snap back to the start).
    #[must_use]
    pub fn sample(&self, now: f64, finished: bool) -> (Vec3, bool) {
        if finished {
            return (self.start, true);
        }
        let t = js_min(1.0, (now - self.t0) / RAM_MS);
        let forward = if t < 0.5 { t * 2.0 } else { (1.0 - t) * 2.0 };
        if t >= 1.0 {
            return (self.start, true);
        }
        (self.start.lerp(self.hit, forward), false)
    }

    /// Applies the frame to the ram group; `true` when ended.
    pub fn step(&self, scene: &mut Scene, group: NodeId, now: f64, finished: bool) -> bool {
        let (p, done) = self.sample(now, finished);
        scene.nodes[group].position = p;
        done
    }
}

// ------------------------------------------------------------ siege: boulder

/// Launch and impact points of `_attackWallTile` (`:7212-7215`): from the
/// catapult's tile top + 0.8 to the wall tile at height 1.5.
#[must_use]
pub fn wall_shot_endpoints(
    grid: &TerrainGrid,
    catapult: (i32, i32),
    wall_col: i32,
    wall_row: i32,
) -> (Vec3, Vec3) {
    let (ax, az) = cell_to_world(f64::from(catapult.0), f64::from(catapult.1));
    let (wx, wz) = cell_to_world(f64::from(wall_col), f64::from(wall_row));
    (
        Vec3::new(ax, tile_top_y(grid, catapult.0, catapult.1) + 0.8, az),
        Vec3::new(wx, 1.5, wz),
    )
}

/// The flying stone of `_spawnCatapultBoulder` (`:7235-7269`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Boulder {
    /// The sphere mesh (a root child while in flight).
    pub node: NodeId,
    from: Vec3,
    to: Vec3,
    t0: f64,
}

impl Boulder {
    /// `SphereGeometry(0.32, 7, 7)` + `MeshStandardMaterial({ color: 0x888888,
    /// roughness: 0.9, metalness: 0.1 })` at `from`, casting shadow, appended
    /// to the scene root.
    pub fn spawn(scene: &mut Scene, from: Vec3, to: Vec3, t0: f64) -> Self {
        let mat = scene.add_material(Material::standard(0x0088_8888, 0.1, 0.9));
        let node = scene.mesh(ROOT, sphere(0.32, 7, 7), mat);
        scene.nodes[node].position = from;
        scene.cast_shadow(node);
        Self { node, from, to, t0 }
    }

    /// Position at `now` and whether the flight ended (`animBoulder`).
    #[must_use]
    pub fn sample(&self, now: f64) -> (Vec3, bool) {
        let t = js_min(1.0, (now - self.t0) / BOULDER_MS);
        let x = self.from.x + (self.to.x - self.from.x) * t;
        let z = self.from.z + (self.to.z - self.from.z) * t;
        let y = self.from.y + (self.to.y - self.from.y) * t + BOULDER_ARC * js_sin(t * PI);
        (Vec3::new(x, y, z), t >= 1.0)
    }

    /// One frame: moves the stone; at the end (or when the battle `finished`)
    /// removes it from the scene. Returns `true` when removed.
    pub fn step(&self, scene: &mut Scene, now: f64, finished: bool) -> bool {
        if finished {
            detach(scene, ROOT, self.node);
            return true;
        }
        let (p, done) = self.sample(now);
        scene.nodes[self.node].position = p;
        if done {
            detach(scene, ROOT, self.node);
        }
        done
    }
}

// ------------------------------------------------------------ siege: breaches

/// Rubble colours of `_breachWallTile` (`:7328-7329`).
pub const RUBBLE_DUST_COLOR: i32 = 0x006b_5040;
/// Darker rock fragment.
pub const RUBBLE_ROCK_COLOR: i32 = 0x005a_5850;
/// Rubble pieces per breach (`:7330`).
pub const RUBBLE_PIECES: i32 = 7;

/// `wallGroup.userData.rowWallMeshes.get(row)` (JS `Map`, SameValueZero).
fn row_wall_meshes(wall: &PlacedWall, row: f64) -> Option<&[NodeId]> {
    wall.user_data
        .row_wall_meshes
        .as_ref()?
        .iter()
        .find(|(k, _)| *k == row || (k.is_nan() && row.is_nan()))
        .map(|(_, v)| v.as_slice())
}

/// The scene part of `_breachWallTile(wallRow)` (`:7302-7357`): the wall tile
/// becomes `Plains`, its wall segments are hidden and 7 rubble pieces
/// (seeded `tileJitter`) are appended to the scene root (only with a wall).
/// Returns the rubble nodes and the float label of `_spawnWallLabel`
/// (`'MUR WYBURZONY!'`) started at `wall_clock`. Defenders standing on the
/// tile are moved by [`retreat_from_wall`] (the cell is chosen by the logic).
pub fn breach_wall_tile(
    scene: &mut Scene,
    grid: &mut TerrainGrid,
    wall: Option<&PlacedWall>,
    wall_col: i32,
    wall_row: i32,
    wall_clock: f64,
) -> (Vec<NodeId>, FloatLabel) {
    let idx = i64::from(wall_row) * i64::from(BF_COLS) + i64::from(wall_col);
    if let Ok(i) = usize::try_from(idx) {
        if i < grid.tiles.len() {
            grid.tiles[i] = bterrain::PLAINS;
        }
    }
    let label = FloatLabel::wall(wall_col, wall_row, wall_clock);
    let mut rubble = Vec::new();
    let Some(wall) = wall else {
        return (rubble, label);
    };
    if let Some(segs) = row_wall_meshes(wall, f64::from(wall_row)) {
        for &m in segs {
            scene.nodes[m].visible = false;
        }
    }
    let (rx, rz) = cell_to_world(f64::from(wall_col), f64::from(wall_row));
    for i in 0..RUBBLE_PIECES {
        let s = 200 + i * 11;
        let j = |k: i32| tile_jitter(wall_col, wall_row, s + k);
        let ox = (j(1) - 0.5) * TILE_S * 0.85;
        let oz = (j(2) - 0.5) * TILE_S * 0.7;
        let sc = 0.55 + j(3) * 0.55;
        let is_rock = j(4) < 0.4;
        let color_jit = (j(5) - 0.5) * 0.16;
        let color = lighten(
            if is_rock {
                RUBBLE_ROCK_COLOR
            } else {
                RUBBLE_DUST_COLOR
            },
            color_jit,
        );
        let geo: Geo = if is_rock {
            Prim::Icosahedron {
                r: 0.16 * sc,
                detail: 0,
            }
            .into()
        } else {
            Prim::bx(0.34 * sc, 0.20 * sc, 0.30 * sc).into()
        };
        #[allow(clippy::cast_sign_loss)]
        let mat = scene.add_material(Material::lambert_flat(color as u32));
        let mesh = scene.mesh(ROOT, geo, mat);
        let oy = (if is_rock { 0.06 } else { 0.10 }) * sc;
        scene.nodes[mesh].set_pos(rx + ox, oy, rz + oz);
        scene.nodes[mesh].set_rot(j(6) * PI, j(7) * PI * 2.0, j(8) * PI);
        scene.shadows(mesh, true, true);
        rubble.push(mesh);
    }
    (rubble, label)
}

/// A defender leaving the breached wall tile (`:7371-7404`): model on
/// `tileTopY` of `(col, row)`, bars `HPBAR_Y` above, off the wall walk. The
/// cell (`wallCol + 1`, or the nearest free passable cell) is the logic's.
pub fn retreat_from_wall(
    scene: &mut Scene,
    grid: &TerrainGrid,
    u: &mut PlacedUnit,
    col: i32,
    row: i32,
) {
    u.col = col;
    u.row = row;
    u.on_wall_walkway = false;
    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
    let top = tile_top_y(grid, col, row);
    scene.nodes[u.group].set_pos(x, top, z);
    scene.nodes[u.bars.group].set_pos(x, top + HPBAR_Y, z);
}

/// The scene part of `_breachGate()` (`:7421-7466`): the two gate tiles
/// (`gateRow − 1 .. gateRow`) that are still `Gate` become `Plains`; the gate
/// group is hidden, and every MESH child of the wall group whose local X is
/// within `TILE_S·1.5 + TILE_S·0.6` of `gateCenterX` and which is either at
/// least `0.9·wallWalkY` high or within `0.9·TILE_S·1.5` of the centre.
pub fn breach_gate(
    scene: &mut Scene,
    grid: &mut TerrainGrid,
    wall: Option<&PlacedWall>,
    gate_col: i32,
    gate_row: i32,
) {
    if gate_col >= 0 {
        for r in (gate_row - 1)..=gate_row {
            let idx = i64::from(r) * i64::from(BF_COLS) + i64::from(gate_col);
            if let Ok(i) = usize::try_from(idx) {
                if i < grid.tiles.len() && grid.tiles[i] == bterrain::GATE {
                    grid.tiles[i] = bterrain::PLAINS;
                }
            }
        }
    }
    let Some(wall) = wall else { return };
    scene.nodes[wall.user_data.gate].visible = false;
    let gate_cx = wall.user_data.gate_center_x;
    let gate_half_w = TILE_S * 1.5;
    let wall_h = wall.user_data.wall_walk_y;
    let kids = scene.nodes[wall.group].children.clone();
    for c in kids {
        if !scene.nodes[c].is_mesh() {
            continue;
        }
        let lx = scene.nodes[c].position.x;
        if (lx - gate_cx).abs() < gate_half_w + TILE_S * 0.6 {
            let ly = scene.nodes[c].position.y;
            if ly >= wall_h * 0.9 || (lx - gate_cx).abs() < gate_half_w * 0.9 {
                scene.nodes[c].visible = false;
            }
        }
    }
}

// ------------------------------------------------------------ group markers

/// One drawing call of `_makeGroupNumberTexture` on its 2D context.
#[derive(Debug, Clone, PartialEq)]
pub enum CanvasOp {
    /// `ctx.fillStyle = …`.
    FillStyle(&'static str),
    /// `ctx.fillRect(x, y, w, h)`.
    FillRect(f64, f64, f64, f64),
    /// `ctx.strokeStyle = …`.
    StrokeStyle(&'static str),
    /// `ctx.lineWidth = …`.
    LineWidth(f64),
    /// `ctx.strokeRect(x, y, w, h)`.
    StrokeRect(f64, f64, f64, f64),
    /// `ctx.font = …`.
    Font(&'static str),
    /// `ctx.textAlign = …`.
    TextAlign(&'static str),
    /// `ctx.textBaseline = …`.
    TextBaseline(&'static str),
    /// `ctx.fillText(text, x, y)`.
    FillText(String, f64, f64),
}

/// `_makeGroupNumberTexture(label)` (`:18647-18665`) as data: a 28×28 canvas
/// (gold square, dark frame, centred number). Rasterising it is the text
/// rasteriser's job (like `scene::GlyphTexture`, D-MOD-6).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GroupNumberTexture {
    /// The text drawn (`String(num)`).
    pub label: String,
}

impl GroupNumberTexture {
    /// `canvas.width` = `canvas.height`.
    pub const SIZE: u32 = 28;

    /// The canvas calls in web order.
    #[must_use]
    pub fn ops(&self) -> Vec<CanvasOp> {
        vec![
            CanvasOp::FillStyle("#d4af37"),
            CanvasOp::FillRect(2.0, 2.0, 24.0, 24.0),
            CanvasOp::StrokeStyle("#1a1408"),
            CanvasOp::LineWidth(2.0),
            CanvasOp::StrokeRect(2.0, 2.0, 24.0, 24.0),
            CanvasOp::FillStyle("#1a1408"),
            CanvasOp::Font("bold 16px sans-serif"),
            CanvasOp::TextAlign("center"),
            CanvasOp::TextBaseline("middle"),
            CanvasOp::FillText(self.label.clone(), 14.0, 15.0),
        ]
    }
}

/// `parseInt(s, 10)` of ECMA-262 (leading white space, optional sign,
/// decimal digits; `NaN` without digits).
#[must_use]
pub fn js_parse_int10(s: &str) -> f64 {
    let t = s.trim_start_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
    let (neg, rest) = match t.as_bytes().first() {
        Some(b'-') => (true, &t[1..]),
        Some(b'+') => (false, &t[1..]),
        _ => (false, t),
    };
    let digits: &str = &rest[..rest.bytes().take_while(u8::is_ascii_digit).count()];
    if digits.is_empty() {
        return f64::NAN;
    }
    let v: f64 = digits.parse().unwrap_or(f64::NAN);
    if neg {
        -v
    } else {
        v
    }
}

/// `_groupDisplayNum(gid)` (`:14413-14417`): `parseInt(gid, 10)` when it is a
/// finite number > 0.
#[must_use]
pub fn group_display_num(gid: Option<&str>) -> Option<f64> {
    let g = gid.filter(|g| !g.is_empty())?;
    let n = js_parse_int10(g);
    (n.is_finite() && n > 0.0).then_some(n)
}

/// One `groupFrame` marker under a unit model.
#[derive(Debug, Clone, PartialEq)]
pub struct GroupMarker {
    /// `ru.bu.id`.
    pub unit_id: String,
    /// The `groupFrame` group (a child of the unit model while shown).
    pub group: NodeId,
    /// The frame `THREE.Line` (payload in [`FieldScene::lines`]).
    pub line: NodeId,
    /// The number sprite and its texture.
    pub sprite: Option<(NodeId, GroupNumberTexture)>,
}

/// `this._groupFrameMarkers` (unit id → marker).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct GroupMarkers {
    /// Markers in creation order.
    pub markers: Vec<GroupMarker>,
}

impl GroupMarkers {
    /// The marker of a unit.
    #[must_use]
    pub fn get(&self, unit_id: &str) -> Option<&GroupMarker> {
        self.markers.iter().find(|m| m.unit_id == unit_id)
    }

    /// `_removeGroupFrameMarker(ru)` (`:18668-18681`): detaches the marker
    /// from the unit model and forgets it.
    pub fn remove(&mut self, fs: &mut FieldScene, u: &PlacedUnit) {
        if let Some(i) = self.markers.iter().position(|m| m.unit_id == u.spawn.id) {
            let m = self.markers.remove(i);
            detach(&mut fs.scene, u.group, m.group);
        }
    }

    /// `_updateGroupFrameMarker(ru)` (`:18684-18728`): the previous marker
    /// goes; with a group (`groupId` non-empty) on a live unit a new
    /// `groupFrame` is appended to the model: a closed gold square `Line`
    /// (`0xffd700`, opacity 0.92, no depth write) at y 0.04, half-size
    /// `TILE_S·0.44`, plus — when [`group_display_num`] gives a number — a
    /// 0.55 sprite with the number texture at (−0.85·hs, 0.55, −0.85·hs).
    pub fn update(
        &mut self,
        fs: &mut FieldScene,
        u: &PlacedUnit,
        group_id: Option<&str>,
        dead: bool,
    ) {
        self.remove(fs, u);
        let gid = match group_id {
            Some(g) if !g.is_empty() && !dead && !u.removed => g,
            _ => return,
        };
        let g = fs.scene.detached_group();
        fs.scene.node(g).set_name("groupFrame");
        let hs = TILE_S * 0.44;
        let y = 0.04;
        let pts = vec![-hs, y, -hs, hs, y, -hs, hs, y, hs, -hs, y, hs, -hs, y, -hs];
        let mut lm = Material::new(MaterialKind::LineBasic, Some(0x00ff_d700));
        lm.transparent = true;
        lm.opacity = 0.92;
        lm.depth_write = false;
        let material = fs.scene.add_material(lm);
        let line = fs.scene.add_object3d(g);
        fs.lines.push(OutlineLine {
            node: line,
            geo: Geo::body(FieldGeo::Polyline(pts)),
            material,
            dash: None,
            line_distances: None,
        });
        let sprite = group_display_num(Some(gid)).map(|n| {
            let tex = GroupNumberTexture {
                label: js_number_to_string(n),
            };
            let mut sm = Material::with_color(MaterialKind::Sprite, None);
            sm.transparent = true;
            sm.depth_write = false;
            sm.depth_test = false;
            let mat = fs.scene.add_material(sm);
            let sp = fs.scene.sprite(g, mat);
            fs.scene.nodes[sp].set_scale(0.55, 0.55, 1.0);
            fs.scene.nodes[sp].set_pos(-hs * 0.85, 0.55, -hs * 0.85);
            (sp, tex)
        });
        fs.scene.attach(u.group, g);
        self.markers.push(GroupMarker {
            unit_id: u.spawn.id.clone(),
            group: g,
            line,
            sprite,
        });
    }

    /// `_syncAllGroupFrameMarkers()` (`:18731-18739`) over the player roster:
    /// `(unit, groupId, dead)`.
    pub fn sync_all(&mut self, fs: &mut FieldScene, roster: &[(&PlacedUnit, Option<&str>, bool)]) {
        for &(u, gid, dead) in roster {
            if gid.is_some_and(|g| !g.is_empty()) && !dead && !u.removed {
                self.update(fs, u, gid, dead);
            } else {
                self.remove(fs, u);
            }
        }
    }
}

// ------------------------------------------------------------ bar billboard

fn to_p(m: &GMat4) -> PMat4 {
    PMat4 { e: m.e }
}

/// World matrix of `node` after `updateWorldMatrix(true, false)`.
fn world_of(scene: &Scene, node: NodeId) -> GMat4 {
    let mut chain = vec![node];
    let mut p = scene.nodes[node].parent;
    while let Some(id) = p {
        chain.push(id);
        p = scene.nodes[id].parent;
    }
    let mut w: Option<GMat4> = None;
    for &id in chain.iter().rev() {
        let local = scene.local_matrix(id);
        w = Some(w.map_or(local, |pw| pw.mul(&local)));
    }
    w.unwrap_or_else(|| scene.local_matrix(node))
}

fn set_quaternion(scene: &mut Scene, node: NodeId, q: GQuat) {
    let e = euler_xyz_from_quaternion(PQuat {
        x: q.x,
        y: q.y,
        z: q.z,
        w: q.w,
    });
    let n = &mut scene.nodes[node];
    n.quaternion = q;
    n.rotation = Euler {
        x: e.x,
        y: e.y,
        z: e.z,
        ..n.rotation
    };
}

/// `Matrix4.extractRotation(m)` (three r169 `Matrix4.js:127-159`).
fn extract_rotation(m: &PMat4) -> PMat4 {
    let me = &m.e;
    let len = |a: f64, b: f64, c: f64| (a * a + b * b + c * c).sqrt();
    let sx = 1.0 / len(me[0], me[1], me[2]);
    let sy = 1.0 / len(me[4], me[5], me[6]);
    let sz = 1.0 / len(me[8], me[9], me[10]);
    PMat4 {
        e: [
            me[0] * sx,
            me[1] * sx,
            me[2] * sx,
            0.0,
            me[4] * sy,
            me[5] * sy,
            me[6] * sy,
            0.0,
            me[8] * sz,
            me[9] * sz,
            me[10] * sz,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        ],
    }
}

/// `Quaternion.multiplyQuaternions(a, b)`.
fn quat_mul(a: PQuat, b: PQuat) -> PQuat {
    PQuat {
        x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
        y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
        z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    }
}

/// `object.lookAt(target)` of a non-camera `Object3D` (three r169
/// `Object3D.js:271-311`) — the bar billboard of the frame loop
/// (`ru.hpBarGroup.lookAt(this.camera.position)`, `:8523`, `:8547`; called
/// for every unit that is not dead). `rotation` follows the quaternion.
pub fn billboard(scene: &mut Scene, node: NodeId, target: Vec3) {
    let world = world_of(scene, node);
    let pos = PVec3::new(world.e[12], world.e[13], world.e[14]);
    let m1 = PMat4::look_at(
        PVec3::new(target.x, target.y, target.z),
        pos,
        PVec3::new(0.0, 1.0, 0.0),
    );
    let mut q = PQuat::from_rotation_matrix(&m1);
    if let Some(parent) = scene.nodes[node].parent {
        let pr = extract_rotation(&to_p(&world_of(scene, parent)));
        let q1 = PQuat::from_rotation_matrix(&pr);
        let inv = PQuat {
            x: -q1.x,
            y: -q1.y,
            z: -q1.z,
            w: q1.w,
        };
        q = quat_mul(inv, q);
    }
    set_quaternion(
        scene,
        node,
        GQuat {
            x: q.x,
            y: q.y,
            z: q.z,
            w: q.w,
        },
    );
}

/// The bar billboards of one frame: `lookAt(camera)` for every unit that is
/// not dead (`alive` per unit, atk then def).
pub fn billboard_all(scene: &mut Scene, units: &[(&PlacedUnit, bool)], camera: Vec3) {
    for &(u, alive) in units {
        if alive {
            billboard(scene, u.bars.group, camera);
        }
    }
}

// ------------------------------------------------------------ float labels

/// The 3D data of a float label (`this.floatLabels` entry, `:7488-7492`,
/// `:9111-9117`); the DOM element and its text/colour are the UI's (P5), the
/// screen projection (`worldToScreen`) is part 5.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FloatLabel {
    /// `worldPos`.
    pub world: Vec3,
    /// `startTime` (WALL clock `vLastWall`, not the virtual clock).
    pub start: f64,
    /// `duration`.
    pub duration: f64,
    /// `riseRate`.
    pub rise_rate: f64,
}

impl FloatLabel {
    /// `_spawnDamageLabel(ru, dmg)`: above the unit's bars
    /// (`tileTopY + HPBAR_Y + 0.20`).
    #[must_use]
    pub fn damage(grid: &TerrainGrid, col: i32, row: i32, wall_clock: f64) -> Self {
        let (x, z) = cell_to_world(f64::from(col), f64::from(row));
        Self {
            world: Vec3::new(x, tile_top_y(grid, col, row) + HPBAR_Y + 0.20, z),
            start: wall_clock,
            duration: FLOAT_LABEL_MS,
            rise_rate: FLOAT_LABEL_RISE,
        }
    }

    /// `_spawnWallLabel(col, row, …)`: at height 3.2 over the wall tile.
    #[must_use]
    pub fn wall(col: i32, row: i32, wall_clock: f64) -> Self {
        let (x, z) = cell_to_world(f64::from(col), f64::from(row));
        Self {
            world: Vec3::new(x, 3.2, z),
            start: wall_clock,
            duration: FLOAT_LABEL_MS,
            rise_rate: FLOAT_LABEL_RISE,
        }
    }

    /// `_tickFloatLabels(t)` (`:8626-8641`) before the projection: `None`
    /// when expired (`p >= 1`, element removed), else the world point to
    /// project (`y + age·riseRate`) and the CSS opacity `1 − p²`.
    #[must_use]
    pub fn sample(&self, t: f64) -> Option<(Vec3, f64)> {
        let age = t - self.start;
        let p = js_min(1.0, age / self.duration);
        if p >= 1.0 {
            return None;
        }
        let mut w = self.world;
        w.y += age * self.rise_rate;
        Some((w, 1.0 - p * p))
    }
}

// ------------------------------------------------------------ deploy phase

/// `_setDeployZoneVisible(v)` (`:11695-11699`), 3D part (the half labels are
/// DOM, P5).
pub fn set_deploy_zone_visible(fs: &mut FieldScene, v: bool) {
    if let Some(g) = fs.deploy_group {
        fs.scene.nodes[g].visible = v;
    }
    for i in 0..fs.deploy_zone_meshes.len() {
        let m = fs.deploy_zone_meshes[i];
        fs.scene.nodes[m].visible = v;
    }
}

/// The deploy-phase branch of the frame loop (`:8515-8526`), 3D part: the
/// order preview is cleared and the order lines hidden; bars face the
/// camera (`alive` per unit, atk then def).
pub fn deploy_phase_frame(b: &mut BattleScene3, alive: &[bool]) {
    let scene = &mut b.field.field.scene;
    super::units::clear_order_preview(scene, &b.orders);
    scene.nodes[b.orders.lines].visible = false;
    let cam = b.field.camera.position;
    let cam = Vec3::new(cam.x, cam.y, cam.z);
    let mut alive_it = alive.iter().copied();
    for u in b.atk.iter().chain(b.def.iter()) {
        if alive_it.next().unwrap_or(true) {
            billboard(scene, u.bars.group, cam);
        }
    }
}

/// `_endDeployPhase()` (`:16364-16389`), 3D part: deploy ghosts, order
/// preview and queued arrows go, the order lines are shown again and the
/// deploy zone is hidden. (Selection, group registry, UI teardown and the
/// battle start are logic / UI.)
pub fn end_deploy_phase(b: &mut BattleScene3) {
    super::units::clear_deploy_ghosts(&mut b.field.field);
    let scene = &mut b.field.field.scene;
    super::units::clear_order_preview(scene, &b.orders);
    super::units::dispose_all_order_lines(scene, &mut b.orders);
    scene.nodes[b.orders.lines].visible = true;
    set_deploy_zone_visible(&mut b.field.field, false);
}

// ------------------------------------------------------------ helpers

/// `parent.remove(child)` (no-op when `child` is not a child of `parent`).
fn detach(scene: &mut Scene, parent: NodeId, child: NodeId) {
    if let Some(i) = scene.nodes[parent]
        .children
        .iter()
        .position(|&c| c == child)
    {
        scene.nodes[parent].children.remove(i);
        scene.nodes[child].parent = None;
    }
}

/// `Math.min(a, b)` (NaN-propagating; `-0 < +0`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_int_follows_ecma() {
        assert_eq!(js_parse_int10("3"), 3.0);
        assert_eq!(js_parse_int10(" 12x"), 12.0);
        assert_eq!(js_parse_int10("-2"), -2.0);
        assert_eq!(js_parse_int10("+7"), 7.0);
        assert_eq!(js_parse_int10("2.9"), 2.0);
        assert!(js_parse_int10("abc").is_nan());
        assert!(js_parse_int10("").is_nan());
        assert!(js_parse_int10("-").is_nan());
        assert_eq!(group_display_num(Some("0")), None);
        assert_eq!(group_display_num(Some("")), None);
        assert_eq!(group_display_num(None), None);
        assert_eq!(group_display_num(Some("\u{feff}\t5")), Some(5.0));
    }

    /// The edges of the `_breachGate` hiding rule (`battleScene.ts:7449-7462`
    /// @ `edb8fb56`): `|lx − gateCX| < TILE_S·1.5 + TILE_S·0.6` and
    /// (`ly ≥ wallWalkY·0.9` or `|lx − gateCX| < TILE_S·1.5·0.9`). Probe meshes
    /// just inside / outside each edge. No reachable wall has a mesh with
    /// `0.9·H ≤ ly < H` in the side band (P4-36 §38), so the web vectors alone
    /// cannot see the height edge; the band edge is also covered by the
    /// `pomiary.gateStyles` vectors (`egipt`, `celtowie`).
    #[test]
    fn breach_gate_edges_follow_web_rule() {
        use super::super::field::{SiegeLayout, BF_ROWS};
        use super::super::units::place_siege_wall;
        let mut scene = Scene::new();
        let layout = SiegeLayout {
            wall_col: 10,
            row_lo: 0,
            row_hi: BF_ROWS - 1,
            gate_col: 10,
            gate_row: 78,
            gate_hp: 1.0,
            gate_open: false,
            wall_tile_hp: Vec::new(),
        };
        let wall = place_siege_wall(&mut scene, "rzym", &layout).expect("wall");
        let h = wall.user_data.wall_walk_y;
        let cx = wall.user_data.gate_center_x;
        let band = TILE_S * 1.5 + TILE_S * 0.6;
        let centre = TILE_S * 1.5 * 0.9;
        let mat = scene.add_material(Material::standard(0, 0.0, 1.0));
        let probes = [
            (band - 0.05, h * 0.9, true),
            (band - 0.05, h * 0.95, true),
            (band - 0.05, h, true),
            (band - 0.05, h * 0.9 - 1e-9, false),
            (band, h, false),
            (-(band - 0.05), h * 0.95, true),
            (centre - 1e-9, 0.0, true),
            (centre, 0.0, false),
        ];
        let ids: Vec<NodeId> = probes
            .iter()
            .map(|&(dx, y, _)| {
                let id = scene.mesh(wall.group, Prim::cyl(0.1, 0.1, 0.1, 6), mat);
                scene.nodes[id].set_pos(cx + dx, y, 0.0);
                id
            })
            .collect();
        let mut grid = TerrainGrid::new(BF_COLS, BF_ROWS, vec![0; (BF_COLS * BF_ROWS) as usize]);
        breach_gate(&mut scene, &mut grid, Some(&wall), -1, layout.gate_row);
        for (&id, &(dx, y, hidden)) in ids.iter().zip(&probes) {
            assert_eq!(!scene.nodes[id].visible, hidden, "probe dx={dx} y={y}");
        }
    }

    /// `_startRout` (`battleScene.ts:8971` @ `edb8fb56`):
    /// `ru.side === 'atk' ? Dir.W : Dir.E` with `Dir.E = 1`, `Dir.W = 3`
    /// (`:292-297`); also in `pomiary.routs` of the web vectors.
    #[test]
    fn rout_facing_is_home_edge() {
        assert_eq!(rout_facing(BattleSide::Atk), 3);
        assert_eq!(rout_facing(BattleSide::Def), 1);
    }
}
