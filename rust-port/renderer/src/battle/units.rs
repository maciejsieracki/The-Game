//! Part 3 of MOD-14 "battle 3D": **units and overlays** of
//! `battle/battleScene.ts` (web `edb8fb56`, topic
//! R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3, document
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §19–§26).
//!
//! The scene side of
//! - unit placement — `_placeUnits` (`:4969-5252`), `_placeUnitsOneSide`
//!   (`:16143-16355`), `_placeSiegeDefenders` (`:4139-4437`): per unit the
//!   model of `buildUnitModel` (via [`crate::models::unit_core`]) or
//!   `makeFallbackAvatar` (`:19321-19342`), its transform (`cellToWorld`,
//!   `tileTopY` or the wall walk height 2.5, `dirYaw` `:1871-1875`), the
//!   over-head bar stack `makeUnitBars` (`:19343-19418`) in the side colour
//!   `sideColor` (`:1009-1011`) and the initial bar state
//!   (`_updateHpBar` / `_updateMoraleBar` / `_updateAmmoBar`,
//!   `:8795-8845`);
//! - the siege wall placement `_placeSiegeWall` (`:3897-3933`; the wall
//!   mesh itself is part 1, [`super::siege_wall`]);
//! - unit removal (`_removeUnitFromScene` `:9065-9080`,
//!   `_removeAllUnitsFromField` `:9600-9630`, `_resetDeploySide`
//!   `:16120-16133`) and the 3D effect of the siege-tower climb of
//!   `_activateUnit` (`:5860-5892`, positions `:5886-5889`);
//! - selection rings (`_addSelectionRing` `:17631-17644`,
//!   `_removeSelectionRing`, `_refreshUnitRingColor` `:18634-18644`,
//!   `_refreshDeploySelectionVisuals` `:14967-14980`);
//! - order arrows and previews (`_makeOrderArrow` `:10480-10522`,
//!   `_clearOrderPreview`, `_disposeQueuedOrderArrows`,
//!   `_refreshQueuedOrderVisuals` `:10626-10647`, `_addOrderPreviewArrow`,
//!   `_updateOrderPreview` `:10683-10752`, `_worldAtTile`,
//!   `_unitWorldPos`, `_moveTargetForUnit`);
//! - ghosts (`_clearDeployGhosts` `:15230-15240`,
//!   `_updateDeployPlacementPreview` `:15277-15292`,
//!   `_refreshDeployGhosts` `:15811-15904`, `_refreshDeployGhostsAt`
//!   `:15907-15953`, `_refreshBattleMoveGhosts` `:17471-17489`,
//!   `_addBattleGhostDisc` `:17491-17508`).
//!
//! **Input is a DTO** (ZAŁOŻENIE Z-36-7): where a unit stands (column,
//! row, facing, on the wall walkway or not), its model key (category +
//! `Jednostka` name + owner colour) and its HP / morale / ammo come from the
//! battle domain (P6.13: the placement scoring, `arrangeFlankCavalry`,
//! `ammoCount`, `moraleBaseFor`, the siege-defender row assignment). Picking,
//! selection, group formations and deploy layouts are queried through
//! [`BattleQueries`] (logic → P6.13, picking → part 5). The scene only turns
//! that state into nodes, bit for bit like the web.
//!
//! Verified against vectors produced by running the web code
//! (`tests/battle3d_units.rs`, `tests/fixtures/battle3d/units.json`).

use std::f64::consts::PI;

use crate::geom::{self, Mesh};
use crate::jsmath::js_atan2;
use crate::models::unit_core::{build_model, legacy_route};
use crate::scene::{Geo, GeoBody, MatId, Material, NodeId, Prim, Scene, Side, ROOT};
use crate::terrain::color::Color;

use super::field::{
    self, build_battle_scene, carve_wall_tiles, cell_to_world, tile_top_y, BattleField,
    BattleSceneOpts, DeploySide, FieldGeo, FieldScene, SiegeLayout, TerrainGrid, BF_COLS, BF_ROWS,
    TILE_S,
};
use super::siege_wall::{
    attach_row_breach_panels, build_siege_wall_web_id, js_round, SiegeWall, SiegeWallOpts,
    SiegeWallUserData,
};

// ------------------------------------------------------------ constants

/// `HPBAR_W` (`battleScene.ts:967`): bar length.
pub const HPBAR_W: f64 = 0.32;
/// `HPBAR_H = 0.08 / 3` (`:968`): bar thickness.
pub const HPBAR_H: f64 = 0.08 / 3.0;
/// `HPBAR_Y` (`:978`): bar stack height above the tile top.
pub const HPBAR_Y: f64 = 0.72;
/// `BAR_GAP_Y = HPBAR_H * 1.35` (`:992`).
pub const BAR_GAP_Y: f64 = HPBAR_H * 1.35;
/// `MORALEBAR_Y = BAR_GAP_Y` (`:993`).
pub const MORALEBAR_Y: f64 = BAR_GAP_Y;
/// `AMMOBAR_Y = BAR_GAP_Y * 2` (`:994`).
pub const AMMOBAR_Y: f64 = BAR_GAP_Y * 2.0;
/// `AMMOBAR_COLOR` (`:995`).
pub const AMMOBAR_COLOR: u32 = 0x002f_7adf;
/// `BAR_OUTLINE_PAD = HPBAR_H * 0.5` (`:1014`).
pub const BAR_OUTLINE_PAD: f64 = HPBAR_H * 0.5;
/// `BAR_OUTLINE_Z` (`:1017`).
pub const BAR_OUTLINE_Z: f64 = -0.004;
/// `ORDER_LINE_Y` (`:667`).
pub const ORDER_LINE_Y: f64 = 0.12;
/// `ORDER_COLOR_MOVE` (`:668`).
pub const ORDER_COLOR_MOVE: u32 = 0x0030_80ff;
/// `ORDER_COLOR_ATTACK` (`:669`).
pub const ORDER_COLOR_ATTACK: u32 = 0x00e0_4040;
/// `ORDER_MOVE_OPACITY` (`:670`).
pub const ORDER_MOVE_OPACITY: f64 = 0.30;
/// `ORDER_ATTACK_OPACITY` (`:671`).
pub const ORDER_ATTACK_OPACITY: f64 = 0.45;
/// `DIR_DELTA` (`:303-308`): `(dCol, dRow)` per `Dir` (N, E, S, W).
pub const DIR_DELTA: [(i32, i32); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];
/// The wall walk height the siege code stands units on (`topY = 2.5`,
/// `:4361`, `:5880`; `siegeWall` `height`).
pub const WALL_WALK_Y: f64 = 2.5;

/// HP bar colours of `_updateHpBar` (`:8799-8801`).
const HP_GREEN: u32 = 0x0030_c030;
const HP_YELLOW: u32 = 0x00d0_a020;
const HP_RED: u32 = 0x00d0_2020;

// ------------------------------------------------------------ JS numerics

/// `Math.max(a, b)` for two numbers (NaN propagates; `+0 > -0`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// `Math.min(a, b)` for two numbers (NaN propagates; `-0 < +0`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

// ------------------------------------------------------------ small types

/// `'atk' | 'def'`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum BattleSide {
    /// Attacker.
    Atk,
    /// Defender.
    Def,
}

impl From<DeploySide> for BattleSide {
    fn from(d: DeploySide) -> Self {
        match d {
            DeploySide::Atk => Self::Atk,
            DeploySide::Def => Self::Def,
        }
    }
}

/// `dirYaw(d)` (`:1871-1875`): the model yaw for a facing index
/// (`Dir.N/E/S/W` = 0..3; any other index falls back to `Dir.E` like
/// `DIR_DELTA[d] ?? DIR_DELTA[Dir.E]`).
#[must_use]
pub fn dir_yaw(d: i32) -> f64 {
    let (dc, dr) = usize::try_from(d)
        .ok()
        .and_then(|i| DIR_DELTA.get(i).copied())
        .unwrap_or(DIR_DELTA[1]);
    let (x, z) = cell_to_world(f64::from(dc), f64::from(dr));
    js_atan2(x, z)
}

/// `sideColor(side, playerSide)` (`:1009-1011`).
#[must_use]
pub fn side_color(side: BattleSide, player: BattleSide) -> u32 {
    if side == player {
        0x003a_6ad0
    } else {
        0x00c8_4040
    }
}

/// Geometries of this module the scene [`Prim`]s cannot express
/// (rotated rings, discs and cones; `geom/**` is not changed).
#[derive(Debug, Clone, PartialEq)]
pub enum UnitGeo {
    /// `new RingGeometry(inner, outer, segments).rotateX(-Math.PI / 2)`.
    FlatRing {
        /// Inner radius.
        inner: f64,
        /// Outer radius.
        outer: f64,
        /// Theta segments.
        segments: u32,
    },
    /// `new CircleGeometry(r, segments).rotateX(-Math.PI / 2)`.
    FlatCircle {
        /// Radius.
        r: f64,
        /// Segments.
        segments: u32,
    },
    /// `new ConeGeometry(r, h, radial).rotateX(Math.PI / 2)` (arrow head).
    ConeX {
        /// Radius.
        r: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
    },
}

impl GeoBody for UnitGeo {
    fn build(&self) -> Mesh {
        match *self {
            Self::FlatRing {
                inner,
                outer,
                segments,
            } => {
                let mut m = geom::ring_geometry(inner, outer, segments, 1, 0.0, PI * 2.0);
                m.rotate_x(-PI / 2.0);
                m
            }
            Self::FlatCircle { r, segments } => {
                let mut m = geom::circle_geometry(r, segments, 0.0, PI * 2.0);
                m.rotate_x(-PI / 2.0);
                m
            }
            Self::ConeX { r, h, radial } => {
                let mut m = geom::cone_geometry(r, h, radial, 1, false, 0.0, PI * 2.0);
                m.rotate_x(PI / 2.0);
                m
            }
        }
    }
    fn three_type(&self) -> &'static str {
        match self {
            Self::FlatRing { .. } => "RingGeometry",
            Self::FlatCircle { .. } => "CircleGeometry",
            Self::ConeX { .. } => "ConeGeometry",
        }
    }
}

/// `geometry.parameters` in three's key order for the geometries of this
/// module, then those of [`field::geo_parameters`].
#[must_use]
pub fn geo_parameters(g: &Geo) -> Vec<f64> {
    if let Some(u) = g.body_as::<UnitGeo>() {
        return match *u {
            UnitGeo::FlatRing {
                inner,
                outer,
                segments,
            } => vec![inner, outer, f64::from(segments), 1.0, 0.0, PI * 2.0],
            UnitGeo::FlatCircle { r, segments } => vec![r, f64::from(segments), 0.0, PI * 2.0],
            UnitGeo::ConeX { r, h, radial } => {
                vec![r, h, f64::from(radial), 1.0, 0.0, 0.0, PI * 2.0]
            }
        };
    }
    field::geo_parameters(g)
}

/// `new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side? })`.
fn overlay_mat(color: u32, opacity: f64, double: bool) -> Material {
    let mut m = Material::basic(color);
    m.transparent = true;
    m.opacity = opacity;
    m.depth_write = false;
    if double {
        m.side = Side::Double;
    }
    m
}

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

/// `while (g.children.length > 0) g.remove(g.children[0])`.
fn detach_all(scene: &mut Scene, parent: NodeId) {
    let kids = std::mem::take(&mut scene.nodes[parent].children);
    for k in kids {
        scene.nodes[k].parent = None;
    }
}

// ------------------------------------------------------------ bars

/// The meshes of `makeUnitBars` (`:19343-19418`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitBars {
    /// `hpBarGroup` (billboard group).
    pub group: NodeId,
    /// Side-colour frame behind the bars.
    pub frame: NodeId,
    /// `hpBarFg`.
    pub hp_fg: NodeId,
    /// `hpBarBg`.
    pub hp_bg: NodeId,
    /// `ammoBarFg`.
    pub ammo_fg: NodeId,
    /// `ammoBarBg`.
    pub ammo_bg: NodeId,
    /// `moraleBarFg`.
    pub morale_fg: NodeId,
    /// `moraleBarBg`.
    pub morale_bg: NodeId,
    /// Pennant mast.
    pub mast: NodeId,
    /// Pennant flag.
    pub flag: NodeId,
}

/// `makeUnitBars(outlineColor, ammoShown)`: a detached group (the caller
/// positions it and adds it to the scene, like the web).
pub fn make_unit_bars(scene: &mut Scene, outline_color: u32, ammo_shown: bool) -> UnitBars {
    let group = scene.detached_group();
    let frame_h = (MORALEBAR_Y - 0.0) + HPBAR_H + BAR_OUTLINE_PAD * 2.0;
    let frame_w = HPBAR_W + BAR_OUTLINE_PAD * 2.0;
    let mut frame_mat = Material::basic(outline_color);
    frame_mat.side = Side::Double;
    let fm = scene.add_material(frame_mat);
    let frame = scene.mesh(
        group,
        Geo::body(FieldGeo::Plane {
            w: frame_w,
            h: frame_h,
        }),
        fm,
    );
    scene.set_pos(frame, 0.0, MORALEBAR_Y * 0.5, BAR_OUTLINE_Z);

    let make_bar = |scene: &mut Scene, y: f64, fg_color: u32| -> (NodeId, NodeId) {
        let mut bg_mat = Material::basic(0x001a_1410);
        bg_mat.side = Side::Double;
        let bm = scene.add_material(bg_mat);
        let bg = scene.mesh(
            group,
            Geo::body(FieldGeo::Plane {
                w: HPBAR_W,
                h: HPBAR_H,
            }),
            bm,
        );
        scene.nodes[bg].position.y = y;
        let mut fg_mat = Material::basic(fg_color);
        fg_mat.side = Side::Double;
        let gm = scene.add_material(fg_mat);
        let fg = scene.mesh(
            group,
            Geo::body(FieldGeo::Plane {
                w: HPBAR_W,
                h: HPBAR_H * 0.75,
            }),
            gm,
        );
        scene.set_pos(fg, 0.0, y, 0.002);
        (fg, bg)
    };
    let (hp_fg, hp_bg) = make_bar(scene, 0.0, HP_GREEN);
    let (ammo_fg, ammo_bg) = make_bar(scene, AMMOBAR_Y, AMMOBAR_COLOR);
    let (morale_fg, morale_bg) = make_bar(scene, MORALEBAR_Y, HP_GREEN);
    if !ammo_shown {
        scene.nodes[ammo_fg].visible = false;
        scene.nodes[ammo_bg].visible = false;
    }

    let mast_h = 0.22;
    let mast_top_y = AMMOBAR_Y + BAR_OUTLINE_PAD + mast_h;
    let mm = scene.add_material(Material::basic(0x002a_2018));
    let mast = scene.mesh(
        group,
        Prim::Cylinder {
            rt: 0.006,
            rb: 0.008,
            h: mast_h,
            radial: 5,
            open: false,
        },
        mm,
    );
    scene.set_pos(
        mast,
        0.0,
        AMMOBAR_Y + BAR_OUTLINE_PAD + mast_h * 0.5,
        BAR_OUTLINE_Z,
    );
    let (flag_w, flag_h) = (0.16, 0.11);
    let mut flag_mat = Material::basic(outline_color);
    flag_mat.side = Side::Double;
    let flm = scene.add_material(flag_mat);
    let flag = scene.mesh(
        group,
        Geo::body(FieldGeo::Plane {
            w: flag_w,
            h: flag_h,
        }),
        flm,
    );
    scene.set_pos(flag, flag_w * 0.5, mast_top_y - flag_h * 0.5, BAR_OUTLINE_Z);
    UnitBars {
        group,
        frame,
        hp_fg,
        hp_bg,
        ammo_fg,
        ammo_bg,
        morale_fg,
        morale_bg,
        mast,
        flag,
    }
}

fn mat_of(scene: &Scene, n: NodeId) -> MatId {
    scene.nodes[n].mesh().expect("bar mesh").material()
}

/// `_updateHpBar(ru)` (`:8795-8804`).
pub fn update_hp_bar(scene: &mut Scene, bars: &UnitBars, hp: f64, max_hp: f64) {
    let ratio = js_max(0.0, js_min(1.0, hp / max_hp));
    let fg = bars.hp_fg;
    scene.nodes[fg].scale.x = ratio;
    scene.nodes[fg].position.x = (ratio - 1.0) * HPBAR_W * 0.5;
    let color = if ratio > 0.60 {
        HP_GREEN
    } else if ratio > 0.30 {
        HP_YELLOW
    } else {
        HP_RED
    };
    let m = mat_of(scene, fg);
    scene.materials[m].set_hex(color);
}

/// `_updateMoraleBar(ru)` (`:8811-8820`): `color.setRGB` writes the linear
/// working colour directly (no sRGB conversion).
pub fn update_morale_bar(scene: &mut Scene, bars: &UnitBars, morale: f64, morale_max: f64) {
    let frac = if morale_max > 0.0 {
        js_max(0.0, js_min(1.0, morale / morale_max))
    } else {
        0.0
    };
    let fg = bars.morale_fg;
    scene.nodes[fg].scale.x = js_max(0.0001, frac);
    scene.nodes[fg].position.x = (frac - 1.0) * HPBAR_W * 0.5;
    let r = js_round(f64::from(0xd0) + f64::from(0x30 - 0xd0) * frac);
    let g = js_round(f64::from(0x20) + f64::from(0xc0 - 0x20) * frac);
    let b = f64::from(0x20);
    let m = mat_of(scene, fg);
    scene.materials[m].color = Some(Color::rgb(r / 255.0, g / 255.0, b / 255.0));
}

/// `_updateAmmoBar(ru)` (`:8830-8843`).
pub fn update_ammo_bar(
    scene: &mut Scene,
    bars: &UnitBars,
    shown: bool,
    ammo_left: f64,
    ammo_max: f64,
) {
    if !shown {
        return;
    }
    let frac = if ammo_max > 0.0 && ammo_max.is_finite() {
        js_max(0.0, js_min(1.0, ammo_left / ammo_max))
    } else {
        0.0
    };
    let fg = bars.ammo_fg;
    scene.nodes[fg].scale.x = js_max(0.0001, frac);
    scene.nodes[fg].position.x = (frac - 1.0) * HPBAR_W * 0.5;
    scene.nodes[fg].visible = frac > 0.0;
    scene.nodes[bars.ammo_bg].visible = true;
}

/// `makeFallbackAvatar(color)` (`:19321-19342`): the model used when
/// `buildUnitModel` throws.
#[must_use]
pub fn make_fallback_avatar(color: u32) -> Scene {
    let mut s = Scene::new();
    let mat = s.add_material(Material::lambert(color));
    let body = s.mesh(ROOT, Prim::bx(0.18, 0.28, 0.12), mat);
    let head = s.mesh(ROOT, Prim::bx(0.14, 0.14, 0.14), mat);
    s.nodes[body].position.y = 0.14;
    s.nodes[head].position.y = 0.35;
    s.cast_shadow(body);
    s.cast_shadow(head);
    s
}

// ------------------------------------------------------------ units

/// One unit to place (the DTO of ZAŁOŻENIE Z-36-7): the state
/// `_placeUnits` / `_placeUnitsOneSide` / `_placeSiegeDefenders` give a
/// `RuntimeBattleUnit` at spawn.
#[derive(Debug, Clone, PartialEq)]
pub struct UnitSpawn {
    /// `bu.id`.
    pub id: String,
    /// `side`.
    pub side: BattleSide,
    /// Category key `bu.kategoria` (model routing).
    pub category: String,
    /// `String(bu.stats?.Jednostka ?? bu.nazwa)` (model routing).
    pub model_name: String,
    /// `bu.ownerColor`.
    pub owner_color: u32,
    /// Column `q`.
    pub col: i32,
    /// Row `r`.
    pub row: i32,
    /// `facing` (`Dir` 0..3).
    pub facing: i32,
    /// `onWallWalkway` (stands at [`WALL_WALK_Y`] instead of `tileTopY`).
    pub on_wall_walkway: bool,
    /// `bu.hp`.
    pub hp: f64,
    /// `bu.maxHp`.
    pub max_hp: f64,
    /// `morale` at spawn.
    pub morale: f64,
    /// `moraleMax`.
    pub morale_max: f64,
    /// `ammoLeft` at spawn (`ammoCount(bu)`; `Infinity` = unlimited).
    pub ammo_left: f64,
    /// `ammoMax`.
    pub ammo_max: f64,
}

/// A unit in the scene (the 3D fields of `RuntimeBattleUnit`).
#[derive(Debug, Clone, PartialEq)]
pub struct PlacedUnit {
    /// The input.
    pub spawn: UnitSpawn,
    /// `ru.group` (model root).
    pub group: NodeId,
    /// The bar stack.
    pub bars: UnitBars,
    /// `ammoBarShown`.
    pub ammo_bar_shown: bool,
    /// `true` when the model is `makeFallbackAvatar` (`buildUnitModel` threw
    /// — in Rust: [`crate::models::unit_core::NotYetPorted`]).
    pub fallback_model: bool,
    /// `ru.q` (changes with the climb).
    pub col: i32,
    /// `ru.r`.
    pub row: i32,
    /// `ru.onWallWalkway`.
    pub on_wall_walkway: bool,
    /// `ru.removed`.
    pub removed: bool,
}

/// The body of the per-unit spawn shared by `_placeUnits`' `place`,
/// `_placeUnitsOneSide`, `placeOne` and the wall-crown loop of
/// `_placeSiegeDefenders` (`:5090-5198`, `:4191-4279`, `:4359-4422`): model,
/// transform, bars, initial bar state; group then bars are appended to the
/// scene root.
pub fn spawn_unit(
    scene: &mut Scene,
    grid: &TerrainGrid,
    player: BattleSide,
    s: &UnitSpawn,
) -> PlacedUnit {
    let (x, z) = cell_to_world(f64::from(s.col), f64::from(s.row));
    let top_y = if s.on_wall_walkway {
        WALL_WALK_Y
    } else {
        tile_top_y(grid, s.col, s.row)
    };
    let (model, fallback_model) = match build_model(
        legacy_route(&s.category, Some(&s.model_name)),
        s.owner_color,
    ) {
        Ok(m) => (m, false),
        Err(_) => (make_fallback_avatar(s.owner_color), true),
    };
    let group = scene.graft(ROOT, model);
    scene.nodes[group].set_pos(x, top_y, z);
    scene.nodes[group].rot_y(dir_yaw(s.facing));

    let ammo_shown = s.ammo_max.is_finite() && s.ammo_max > 0.0;
    let bars = make_unit_bars(scene, side_color(s.side, player), ammo_shown);
    scene.set_pos(bars.group, x, top_y + HPBAR_Y, z);
    scene.attach(ROOT, bars.group);
    update_hp_bar(scene, &bars, s.hp, s.max_hp);
    update_morale_bar(scene, &bars, s.morale, s.morale_max);
    update_ammo_bar(scene, &bars, ammo_shown, s.ammo_left, s.ammo_max);
    PlacedUnit {
        spawn: s.clone(),
        group,
        bars,
        ammo_bar_shown: ammo_shown,
        fallback_model,
        col: s.col,
        row: s.row,
        on_wall_walkway: s.on_wall_walkway,
        removed: false,
    }
}

/// `_removeUnitFromScene(ru)` (`:9065-9080`), scene part.
pub fn remove_unit_from_scene(scene: &mut Scene, u: &mut PlacedUnit) {
    if u.removed {
        return;
    }
    u.removed = true;
    detach(scene, ROOT, u.group);
    detach(scene, ROOT, u.bars.group);
    scene.nodes[u.group].visible = false;
    scene.nodes[u.bars.group].visible = false;
}

/// `_moveDeployUnit(ru, col, row)` (`:16092-16105`), scene part: the unit
/// and its bars stand on `tileTopY` of the new cell (also a defender placed on
/// the wall walk — `onWallWalkway` is not touched, like the web).
pub fn move_deploy_unit(
    scene: &mut Scene,
    grid: &TerrainGrid,
    u: &mut PlacedUnit,
    col: i32,
    row: i32,
) {
    u.col = col;
    u.row = row;
    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
    let top_y = tile_top_y(grid, col, row);
    scene.set_pos(u.group, x, top_y, z);
    scene.set_pos(u.bars.group, x, top_y + HPBAR_Y, z);
}

/// The siege-tower climb of `_activateUnit` (`:5860-5892`, positions
/// `:5886-5889`), scene part: the unit and its bars move onto the wall walk
/// at `(wallCol, row)`.
pub fn climb_onto_wall_walkway(scene: &mut Scene, u: &mut PlacedUnit, wall_col: i32, row: i32) {
    u.col = wall_col;
    u.row = row;
    u.on_wall_walkway = true;
    let (x, z) = cell_to_world(f64::from(wall_col), f64::from(row));
    scene.set_pos(u.group, x, WALL_WALK_Y, z);
    scene.set_pos(u.bars.group, x, WALL_WALK_Y + HPBAR_Y, z);
}

// ------------------------------------------------------------ siege wall

/// The placed wall of `_placeSiegeWall`.
#[derive(Debug, Clone, PartialEq)]
pub struct PlacedWall {
    /// `siegeWallGroup` in the battle scene.
    pub group: NodeId,
    /// Which builder ran.
    pub style: super::siege_wall::WallStyle,
    /// `wallGroup.userData` with node ids of the battle scene.
    pub user_data: SiegeWallUserData,
}

/// `(opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym'` (`:3371`).
#[must_use]
pub fn siege_wall_civ<'a>(civ: Option<&'a str>, def_civ: Option<&'a str>) -> &'a str {
    def_civ.or(civ).unwrap_or("rzym")
}

fn shift_user_data(ud: &SiegeWallUserData, base: NodeId) -> SiegeWallUserData {
    let sh = |v: &Vec<(f64, Vec<NodeId>)>| -> Vec<(f64, Vec<NodeId>)> {
        v.iter()
            .map(|(k, ids)| (*k, ids.iter().map(|&i| i + base).collect()))
            .collect()
    };
    SiegeWallUserData {
        wall_segs_by_local_x: ud
            .wall_segs_by_local_x
            .iter()
            .map(|&(k, n)| (k, n + base))
            .collect(),
        wall_walk_y: ud.wall_walk_y,
        depth: ud.depth,
        gate_center_x: ud.gate_center_x,
        gate: ud.gate + base,
        gate_open: ud.gate_open,
        row_wall_meshes: ud.row_wall_meshes.as_ref().map(sh),
        row_breach_panels: ud.row_breach_panels.as_ref().map(sh),
    }
}

/// `_placeSiegeWall(civ)` (`:3897-3933`, 3D part; the siege HUD is DOM → P5):
/// builds the wall (`buildSiegeWall`, part 1), turns it `π/2` about Y, puts it
/// at `(cellToWorld(wallCol).x, 0, cellToWorld(centre row).z)`, appends it to
/// the scene root and registers the row breach panels. `None` when
/// `wallCol < 0`.
pub fn place_siege_wall(scene: &mut Scene, civ: &str, layout: &SiegeLayout) -> Option<PlacedWall> {
    let wall_col = layout.wall_col;
    if wall_col < 0 {
        return None;
    }
    let (r_lo, r_hi) = (layout.row_lo, layout.row_hi);
    let wall_length_tiles = f64::from(r_hi - r_lo + 1);
    let mut wall: SiegeWall =
        build_siege_wall_web_id(civ, &SiegeWallOpts::battle(wall_length_tiles, TILE_S));
    let wall_center_row = (f64::from(r_lo) + f64::from(r_hi)) / 2.0;
    let (wall_x, _) = cell_to_world(f64::from(wall_col), 0.0);
    let (_, wall_z) = cell_to_world(0.0, wall_center_row);
    // attachRowBreachPanels only fills userData (W-4: no nodes), so running it
    // before the graft keeps the subtree identical.
    attach_row_breach_panels(
        &mut wall,
        wall_center_row,
        f64::from(r_lo),
        f64::from(r_hi),
        f64::from(layout.gate_row - 1),
        f64::from(layout.gate_row),
        TILE_S,
    );
    let style = wall.style;
    let ud = wall.user_data.clone();
    let group = scene.graft(ROOT, wall.scene);
    scene.nodes[group].rot_y(PI / 2.0);
    scene.nodes[group].set_pos(wall_x, 0.0, wall_z);
    Some(PlacedWall {
        group,
        style,
        user_data: shift_user_data(&ud, group),
    })
}

// ------------------------------------------------------------ the scene with units

/// Options of `new BattleScene(opts)` with armies (3D part).
#[derive(Debug, Clone, PartialEq)]
pub struct BattleUnitsOpts {
    /// Field options (terrain DTO, palette, siege flag, deploy side).
    pub field: BattleSceneOpts,
    /// The resolved wall civ key ([`siege_wall_civ`]); used when `field.siege`.
    pub siege_civ: String,
    /// `_playerControlSide()` = `opts.deployPlayerSide ?? 'atk'`.
    pub player_side: BattleSide,
    /// Units in the web's spawn order (attackers, then defenders; for a
    /// siege the defenders' wall crown first, then the rest).
    pub units: Vec<UnitSpawn>,
}

/// The battle scene after the constructor, with units.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleScene3 {
    /// Field, camera, renderer, grid, siege layout.
    pub field: BattleField,
    /// The wall (siege).
    pub wall: Option<PlacedWall>,
    /// `this.atk`.
    pub atk: Vec<PlacedUnit>,
    /// `this.def`.
    pub def: Vec<PlacedUnit>,
    /// `_playerControlSide()`.
    pub player_side: BattleSide,
    /// `orderLines` / `orderPreview` groups.
    pub orders: OrderLayer,
}

/// The 3D part of `new BattleScene(opts)` with armies (`:3304-3389`): the
/// static field of part 2, then the siege wall (`_placeSiegeWall`) before the
/// city interior, the units (`_placeUnits`), and the deploy zone + ghost
/// layer — the web's insertion order.
#[must_use]
pub fn build_battle_scene_with_units(opts: BattleUnitsOpts) -> BattleScene3 {
    let mut grid = opts.field.grid;
    let siege = opts.field.siege.then(|| carve_wall_tiles(&mut grid));
    let mut bf = build_battle_scene(BattleSceneOpts {
        grid,
        desert_palette: opts.field.desert_palette,
        siege: false,
        deploy: None,
    });
    let mut wall = None;
    if let Some(s) = &siege {
        wall = place_siege_wall(&mut bf.field.scene, &opts.siege_civ, s);
        bf.field
            .build_siege_interior_buildings(&bf.grid, s.wall_col, s.gate_row);
    }
    let mut atk = Vec::new();
    let mut def = Vec::new();
    for u in &opts.units {
        let p = spawn_unit(&mut bf.field.scene, &bf.grid, opts.player_side, u);
        match u.side {
            BattleSide::Atk => atk.push(p),
            BattleSide::Def => def.push(p),
        }
    }
    if let Some(side) = opts.field.deploy {
        bf.field.build_deploy_zone(&bf.grid, side);
        // `_initDeployUI` (`:12883-12890`): every player unit back to scale 1
        // (resets a model's own root scale), then the ghost layer.
        let roster = match opts.player_side {
            BattleSide::Atk => &atk,
            BattleSide::Def => &def,
        };
        for u in roster {
            bf.field.scene.set_scale_scalar(u.group, 1.0);
        }
        bf.field.init_deploy_ghost_layer();
    }
    bf.siege = siege;
    let orders = OrderLayer::find(&bf.field.scene).expect("orderLines group");
    BattleScene3 {
        field: bf,
        wall,
        atk,
        def,
        player_side: opts.player_side,
        orders,
    }
}

impl BattleScene3 {
    /// `_resetDeploySide(side)` + `_placeUnitsOneSide(side)` (`:16120-16133`),
    /// scene part: the side's live units leave the scene, `spawns` (the new
    /// placement from the domain) are appended.
    pub fn reset_side(&mut self, side: BattleSide, spawns: &[UnitSpawn]) {
        let scene = &mut self.field.field.scene;
        let roster = match side {
            BattleSide::Atk => &mut self.atk,
            BattleSide::Def => &mut self.def,
        };
        for u in roster.iter() {
            if u.removed {
                continue;
            }
            detach(scene, ROOT, u.group);
            detach(scene, ROOT, u.bars.group);
        }
        roster.clear();
        for s in spawns {
            roster.push(spawn_unit(scene, &self.field.grid, self.player_side, s));
        }
    }

    /// [`move_deploy_unit`] for the unit `id` (deploy layout moves; `false`
    /// when no such unit).
    pub fn move_deploy_unit(&mut self, id: &str, col: i32, row: i32) -> bool {
        let grid = &self.field.grid;
        let scene = &mut self.field.field.scene;
        match self
            .atk
            .iter_mut()
            .chain(self.def.iter_mut())
            .find(|u| u.spawn.id == id)
        {
            Some(u) => {
                move_deploy_unit(scene, grid, u, col, row);
                true
            }
            None => false,
        }
    }

    /// The player's roster (`_playerRoster()`) as [`RosterUnit`]s.
    #[must_use]
    pub fn player_roster(&self) -> Vec<RosterUnit> {
        let r = match self.player_side {
            BattleSide::Atk => &self.atk,
            BattleSide::Def => &self.def,
        };
        r.iter()
            .map(|u| RosterUnit {
                id: u.spawn.id.clone(),
                group: u.group,
                dead: u.removed,
                removed: u.removed,
            })
            .collect()
    }

    /// `_resetDeploySide(side)` in the deploy phase (`:16120-16137`), scene
    /// part: [`Self::reset_side`], then `_clearAllSelection()` — the rings of
    /// the selected units go, the selection empties and
    /// `_refreshDeploySelectionVisuals()` puts every live player unit back to
    /// scale 1 (`_clearDeploySelection` only rescales that same unit again).
    pub fn reset_deploy_side(
        &mut self,
        side: BattleSide,
        spawns: &[UnitSpawn],
        rings: &mut SelectionRings,
        selected: &mut Vec<String>,
    ) {
        self.reset_side(side, spawns);
        for id in selected.iter() {
            if let Some(u) = self
                .atk
                .iter()
                .chain(self.def.iter())
                .find(|u| &u.spawn.id == id)
            {
                remove_selection_ring(&mut self.field.field.scene, rings, id, u.group);
            }
        }
        selected.clear();
        let roster = self.player_roster();
        refresh_deploy_selection_visuals(&mut self.field.field, &roster, selected, rings);
    }

    /// `_removeAllUnitsFromField()` (`:9600-9630`), scene part.
    pub fn remove_all_units(&mut self) {
        let scene = &mut self.field.field.scene;
        for u in self.atk.iter().chain(self.def.iter()) {
            if u.removed {
                continue;
            }
            detach(scene, ROOT, u.group);
            detach(scene, ROOT, u.bars.group);
        }
        self.atk.clear();
        self.def.clear();
        // `_disposeAllOrderLines(); _clearOrderPreview(); _disposeQueuedOrderArrows();`
        dispose_all_order_lines(scene, &mut self.orders);
    }
}

// ------------------------------------------------------------ selection rings

/// `_selectionRings` (a JS `Map` in insertion order).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SelectionRings {
    /// `(unit id, ring mesh)`.
    pub rings: Vec<(String, NodeId)>,
}

impl SelectionRings {
    /// `get(id)`.
    #[must_use]
    pub fn get(&self, id: &str) -> Option<NodeId> {
        self.rings.iter().find(|(k, _)| k == id).map(|&(_, n)| n)
    }
}

const RING_GROUP: u32 = 0x00ff_d700;
const RING_PLAIN: u32 = 0x0000_ffcc;

/// `_addSelectionRing(ru)` (`:17631-17644`): a flat ring under the unit's
/// model group (golden when the unit is in a group).
pub fn add_selection_ring(
    scene: &mut Scene,
    rings: &mut SelectionRings,
    id: &str,
    group: NodeId,
    in_group: bool,
) {
    if rings.get(id).is_some() {
        return;
    }
    let mut m = Material::basic(if in_group { RING_GROUP } else { RING_PLAIN });
    m.transparent = true;
    m.opacity = 0.85;
    m.depth_write = false;
    let mat = scene.add_material(m);
    let ring = scene.mesh(
        group,
        Geo::body(UnitGeo::FlatRing {
            inner: 0.45,
            outer: 0.58,
            segments: 24,
        }),
        mat,
    );
    scene.set_pos(ring, 0.0, 0.03, 0.0);
    rings.rings.push((id.to_owned(), ring));
}

/// `_removeSelectionRing(ru)` (`:17647-17652`).
pub fn remove_selection_ring(
    scene: &mut Scene,
    rings: &mut SelectionRings,
    id: &str,
    group: NodeId,
) {
    let Some(i) = rings.rings.iter().position(|(k, _)| k == id) else {
        return;
    };
    let ring = rings.rings[i].1;
    detach(scene, group, ring);
    rings.rings.remove(i);
}

/// `_refreshUnitRingColor(ru)` (`:18634-18644`).
pub fn refresh_unit_ring_color(
    scene: &mut Scene,
    rings: &SelectionRings,
    id: &str,
    in_group: bool,
) {
    let Some(ring) = rings.get(id) else {
        return;
    };
    scene.set_pos(ring, 0.0, 0.03, 0.0);
    let m = mat_of(scene, ring);
    scene.materials[m].set_hex(if in_group { RING_GROUP } else { RING_PLAIN });
}

/// A player unit as `_refreshDeploySelectionVisuals` sees it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RosterUnit {
    /// `bu.id`.
    pub id: String,
    /// `group`.
    pub group: NodeId,
    /// `dead`.
    pub dead: bool,
    /// `removed`.
    pub removed: bool,
}

/// `_refreshDeploySelectionVisuals()` (`:14967-14980`), 3D part (the DOM
/// panels it refreshes afterwards are P5): ghosts cleared, every live player
/// unit back to scale 1, the selected units' rings re-centred.
pub fn refresh_deploy_selection_visuals(
    fs: &mut FieldScene,
    roster: &[RosterUnit],
    selected: &[String],
    rings: &SelectionRings,
) {
    clear_deploy_ghosts(fs);
    for u in roster {
        if u.dead || u.removed {
            continue;
        }
        fs.scene.set_scale_scalar(u.group, 1.0);
        if selected.iter().any(|s| s == &u.id) {
            if let Some(ring) = rings.get(&u.id) {
                fs.scene.set_pos(ring, 0.0, 0.03, 0.0);
            }
        }
    }
}

// ------------------------------------------------------------ orders

/// The `orderLines` group, its `orderPreview` child and the queued arrows
/// (`_orderLinesGroup`, `_orderPreviewGroup`, `_queuedOrderArrows`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLayer {
    /// `_orderLinesGroup`.
    pub lines: NodeId,
    /// `_orderPreviewGroup`.
    pub preview: NodeId,
    /// `_queuedOrderArrows`.
    pub queued: Vec<NodeId>,
}

impl OrderLayer {
    /// The groups the constructor created (`:3361-3366`): the root child
    /// named `orderLines` and its first child `orderPreview`.
    #[must_use]
    pub fn find(scene: &Scene) -> Option<Self> {
        let lines = scene.nodes[ROOT]
            .children
            .iter()
            .copied()
            .find(|&c| scene.nodes[c].name == "orderLines")?;
        let preview = scene.nodes[lines]
            .children
            .iter()
            .copied()
            .find(|&c| scene.nodes[c].name == "orderPreview")?;
        Some(Self {
            lines,
            preview,
            queued: Vec::new(),
        })
    }

    /// Creates the two groups under `parent` like the constructor.
    pub fn create(scene: &mut Scene, parent: NodeId) -> Self {
        let lines = scene.add_group(parent);
        scene.node(lines).set_name("orderLines");
        let preview = scene.add_group(lines);
        scene.node(preview).set_name("orderPreview");
        Self {
            lines,
            preview,
            queued: Vec::new(),
        }
    }
}

/// A point (`THREE.Vector3`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct P3 {
    /// X.
    pub x: f64,
    /// Y.
    pub y: f64,
    /// Z.
    pub z: f64,
}

impl P3 {
    /// `new Vector3(x, y, z)`.
    #[must_use]
    pub const fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
}

/// `_makeOrderArrow(from, to, isAttack, preview)` (`:10480-10522`): a
/// detached group with a box shaft and a cone head (empty when the arrow is
/// shorter than 0.08).
pub fn make_order_arrow(
    scene: &mut Scene,
    from: P3,
    to: P3,
    is_attack: bool,
    preview: bool,
) -> NodeId {
    let g = scene.detached_group();
    scene.node(g).set_name(if preview {
        "orderArrowPreview"
    } else {
        "orderArrow"
    });
    let (dx, dy, dz) = (to.x - from.x, 0.0, to.z - from.z);
    let len = (dx * dx + dy * dy + dz * dz).sqrt();
    if len < 0.08 {
        return g;
    }
    let color = if is_attack {
        ORDER_COLOR_ATTACK
    } else {
        ORDER_COLOR_MOVE
    };
    let opacity = if preview {
        0.38
    } else if is_attack {
        ORDER_ATTACK_OPACITY
    } else {
        ORDER_MOVE_OPACITY
    };
    let angle = js_atan2(dx, dz);
    let head_len = js_min(0.48, len * 0.24);
    let shaft_len = js_max(0.06, len - head_len * 0.75);
    let y = from.y;

    let shaft_mat = scene.add_material(overlay_mat(color, opacity, false));
    let shaft = scene.mesh(g, Prim::bx(0.34, 0.05, shaft_len), shaft_mat);
    scene.set_pos(shaft, (from.x + to.x) * 0.5, y, (from.z + to.z) * 0.5);
    scene.nodes[shaft].rot_y(angle);

    let cone_mat = scene.add_material(overlay_mat(color, js_min(0.55, opacity + 0.12), false));
    let cone = scene.mesh(
        g,
        Geo::body(UnitGeo::ConeX {
            r: 0.26,
            h: head_len,
            radial: 12,
        }),
        cone_mat,
    );
    // dir.normalize() (divideScalar(length || 1) = multiplyScalar(1 / length)), then * len.
    let l2 = (dx * dx + dy * dy + dz * dz).sqrt();
    let inv = 1.0 / if l2 == 0.0 { 1.0 } else { l2 };
    let (nx, ny, nz) = (dx * inv * len, dy * inv * len, dz * inv * len);
    scene.set_pos(cone, from.x + nx, y + ny, from.z + nz);
    scene.nodes[cone].rot_y(angle);
    g
}

/// `_clearOrderPreview()` (`:10524-10531`).
pub fn clear_order_preview(scene: &mut Scene, layer: &OrderLayer) {
    detach_all(scene, layer.preview);
}

/// `_disposeQueuedOrderArrows()` (`:10533-10540`).
pub fn dispose_queued_order_arrows(scene: &mut Scene, layer: &mut OrderLayer) {
    for a in std::mem::take(&mut layer.queued) {
        detach(scene, layer.lines, a);
    }
}

/// `_disposeAllOrderLines()` (`:10542-10545`).
pub fn dispose_all_order_lines(scene: &mut Scene, layer: &mut OrderLayer) {
    clear_order_preview(scene, layer);
    dispose_queued_order_arrows(scene, layer);
}

/// `_addOrderPreviewArrow(from, to, isAttack)` (`:10649-10653`).
pub fn add_order_preview_arrow(
    scene: &mut Scene,
    layer: &OrderLayer,
    from: P3,
    to: P3,
    is_attack: bool,
) {
    let a = make_order_arrow(scene, from, to, is_attack, true);
    scene.attach(layer.preview, a);
}

/// `_worldAtTile(col, row)` (`:10456-10460`).
#[must_use]
pub fn world_at_tile(grid: &TerrainGrid, col: i32, row: i32) -> P3 {
    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
    P3::new(x, tile_top_y(grid, col, row) + ORDER_LINE_Y, z)
}

/// `ru.playerOrder`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlayerOrder {
    /// `{ type: 'none' }` or any order without an arrow (`hold`, …).
    None,
    /// `{ type: 'move', col, row }`.
    Move {
        /// Target column.
        col: i32,
        /// Target row.
        row: i32,
    },
    /// `{ type: 'attack', targetId }`.
    Attack {
        /// `targetId`.
        target: String,
    },
}

/// A runtime unit as the order / preview overlays read it.
#[derive(Debug, Clone, PartialEq)]
pub struct OrderUnit {
    /// `bu.id`.
    pub id: String,
    /// `side`.
    pub side: BattleSide,
    /// `q`.
    pub col: i32,
    /// `r`.
    pub row: i32,
    /// `group.position.x`.
    pub x: f64,
    /// `group.position.z`.
    pub z: f64,
    /// `dead`.
    pub dead: bool,
    /// `removed`.
    pub removed: bool,
    /// `routed`.
    pub routed: bool,
    /// `groupId`.
    pub group_id: Option<String>,
    /// `formationOffset` `(dc, dr)`.
    pub formation_offset: Option<(i32, i32)>,
    /// `playerOrder`.
    pub order: PlayerOrder,
}

/// `_unitWorldPos(ru)` (`:10462-10466`).
#[must_use]
pub fn unit_world_pos(grid: &TerrainGrid, u: &OrderUnit) -> P3 {
    P3::new(u.x, tile_top_y(grid, u.col, u.row) + ORDER_LINE_Y, u.z)
}

/// `_moveTargetForUnit(u, col, row)` (`:10550-10556`).
#[must_use]
pub fn move_target_for_unit(u: &OrderUnit, col: i32, row: i32) -> (i32, i32) {
    let (dc, dr) = u.formation_offset.unwrap_or((0, 0));
    (
        (col + dc).clamp(0, BF_COLS - 1),
        (row + dr).clamp(0, BF_ROWS - 1),
    )
}

/// `_refreshQueuedOrderVisuals()` (`:10626-10647`): one arrow per live
/// player unit with a move order, or an attack order on a live target.
pub fn refresh_queued_order_visuals(
    scene: &mut Scene,
    layer: &mut OrderLayer,
    grid: &TerrainGrid,
    started_and_running: bool,
    roster: &[OrderUnit],
    enemies: &[OrderUnit],
    queued: &[String],
) {
    dispose_queued_order_arrows(scene, layer);
    if !started_and_running {
        return;
    }
    for ru in roster {
        if ru.dead || ru.removed || ru.routed {
            continue;
        }
        let is_queued = queued.iter().any(|q| q == &ru.id);
        match &ru.order {
            PlayerOrder::Move { col, row } => {
                let to = world_at_tile(grid, *col, *row);
                let a = make_order_arrow(scene, unit_world_pos(grid, ru), to, false, is_queued);
                scene.attach(layer.lines, a);
                layer.queued.push(a);
            }
            PlayerOrder::Attack { target } => {
                if let Some(tgt) = enemies
                    .iter()
                    .find(|d| &d.id == target && !d.dead && !d.removed)
                {
                    let a = make_order_arrow(
                        scene,
                        unit_world_pos(grid, ru),
                        unit_world_pos(grid, tgt),
                        true,
                        is_queued,
                    );
                    scene.attach(layer.lines, a);
                    layer.queued.push(a);
                }
            }
            PlayerOrder::None => {}
        }
    }
}

/// `_deployDrag`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DeployDrag {
    /// `anchorCol`.
    pub anchor_col: i32,
    /// `anchorRow`.
    pub anchor_row: i32,
    /// `curCol`.
    pub cur_col: i32,
    /// `curRow`.
    pub cur_row: i32,
}

/// Battle-state lookups the overlays query (logic → P6.13, picking → part 5).
pub trait BattleQueries {
    /// `_findPlayerUnit(id)`.
    fn player_unit(&self, id: &str) -> Option<&OrderUnit>;
    /// `occByKey.get(cellKey(col, row))`.
    fn occupant(&self, col: i32, row: i32) -> Option<&OrderUnit>;
    /// `_passableForUnit(ru, col, row)` for `Some`, `terrainMap.passable` for `None`.
    fn passable_for(&self, unit: Option<&OrderUnit>, col: i32, row: i32) -> bool;
    /// `_liveGroupMemberIds(gid)`.
    fn group_members(&self, gid: &str) -> Vec<String>;
    /// `_moveDestinationsForSelection(col, row)` (`Map` order).
    fn move_destinations(&self, col: i32, row: i32) -> Vec<(String, i32, i32)>;
    /// `_inDeployPlayerZone(col, row)`.
    fn in_deploy_player_zone(&self, col: i32, row: i32) -> bool;
    /// `_computeDeployPlacementLayout(units, col, row, col, row)`.
    fn deploy_placement_layout(
        &self,
        units: &[&OrderUnit],
        col: i32,
        row: i32,
    ) -> Vec<(String, i32, i32)>;
    /// `_computeDeployGhostLayout(units, anchorCol, anchorRow, dragCol, dragRow)`.
    fn deploy_ghost_layout(
        &self,
        units: &[&OrderUnit],
        drag: DeployDrag,
    ) -> Vec<(String, i32, i32)>;
    /// `_isDeployCellOk(col, row, skipIds)`.
    fn deploy_cell_ok(&self, col: i32, row: i32, skip: &[String]) -> bool;
}

/// Pointer state of `_updateOrderPreview` (`_pickUnitAtScreen` /
/// `_pickGroundTile` results and the selection).
#[derive(Debug, Clone, PartialEq)]
pub struct PreviewState {
    /// `deployPhase`.
    pub deploy_phase: bool,
    /// `_deployDrag`.
    pub drag: Option<DeployDrag>,
    /// `_isManualInputActive()`.
    pub manual_input_active: bool,
    /// `_selectedUnits` in insertion order.
    pub selected: Vec<String>,
    /// `_playerControlSide()`.
    pub player_side: BattleSide,
    /// `_pickUnitAtScreen(cx, cy)`: the picked unit (any side; picking = part 5).
    pub hover_unit: Option<OrderUnit>,
    /// `_pickGroundTile(cx, cy)`.
    pub tile: Option<(i32, i32)>,
}

fn find_in<'a>(q: &'a dyn BattleQueries, id: &str) -> Option<&'a OrderUnit> {
    q.player_unit(id)
}

/// `_updateOrderPreview(cx, cy)` (`:10683-10752`).
pub fn update_order_preview(
    fs: &mut FieldScene,
    layer: &OrderLayer,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    st: &PreviewState,
) {
    if st.deploy_phase {
        clear_order_preview(&mut fs.scene, layer);
        if st.drag.is_none() {
            update_deploy_placement_preview(fs, grid, q, st);
        }
        return;
    }
    clear_order_preview(&mut fs.scene, layer);
    if !st.manual_input_active || st.selected.is_empty() {
        clear_deploy_ghosts(fs);
        return;
    }
    let enemy_side = match st.player_side {
        BattleSide::Atk => BattleSide::Def,
        BattleSide::Def => BattleSide::Atk,
    };
    if let Some(h) = &st.hover_unit {
        if h.side == enemy_side && !h.dead && !h.removed {
            let to = unit_world_pos(grid, h);
            for id in &st.selected {
                let Some(u) = find_in(q, id) else { continue };
                if u.dead || u.removed || u.routed {
                    continue;
                }
                add_order_preview_arrow(&mut fs.scene, layer, unit_world_pos(grid, u), to, true);
            }
            return;
        }
    }
    let Some((tc, tr)) = st.tile else {
        clear_deploy_ghosts(fs);
        return;
    };
    if let Some(occ) = q.occupant(tc, tr) {
        if occ.side == enemy_side && !occ.dead {
            clear_deploy_ghosts(fs);
            let to = unit_world_pos(grid, occ);
            for id in &st.selected {
                let Some(u) = find_in(q, id) else { continue };
                if u.dead || u.removed || u.routed {
                    continue;
                }
                add_order_preview_arrow(&mut fs.scene, layer, unit_world_pos(grid, u), to, true);
            }
            return;
        }
    }
    let mut issued_groups: Vec<String> = Vec::new();
    let dest_map = q.move_destinations(tc, tr);
    let dest_of = |id: &str| {
        dest_map
            .iter()
            .find(|(k, _, _)| k == id)
            .map(|&(_, c, r)| (c, r))
    };
    for id in &st.selected {
        let Some(u) = find_in(q, id) else { continue };
        if u.dead || u.removed || u.routed {
            continue;
        }
        if let Some(gid) = &u.group_id {
            if issued_groups.iter().any(|g| g == gid) {
                continue;
            }
            issued_groups.push(gid.clone());
            for mid in q.group_members(gid) {
                let Some(mu) = find_in(q, &mid) else { continue };
                if mu.dead || mu.removed {
                    continue;
                }
                let (dc, dr) = dest_of(&mid).unwrap_or_else(|| move_target_for_unit(mu, tc, tr));
                add_order_preview_arrow(
                    &mut fs.scene,
                    layer,
                    unit_world_pos(grid, mu),
                    world_at_tile(grid, dc, dr),
                    false,
                );
            }
        } else {
            let (dc, dr) = dest_of(id).unwrap_or((tc, tr));
            add_order_preview_arrow(
                &mut fs.scene,
                layer,
                unit_world_pos(grid, u),
                world_at_tile(grid, dc, dr),
                false,
            );
        }
    }
    refresh_battle_move_ghosts(fs, grid, q, &st.selected, tc, tr);
}

// ------------------------------------------------------------ ghosts

/// `_clearDeployGhosts()` (`:15230-15240`).
pub fn clear_deploy_ghosts(fs: &mut FieldScene) {
    if let Some(g) = fs.deploy_ghost_group {
        detach_all(&mut fs.scene, g);
    }
}

/// `_addBattleGhostDisc(geo, col, row, skipIds, ru)` (`:17491-17508`).
fn add_battle_ghost_disc(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    col: i32,
    row: i32,
    skip: &[String],
    unit: Option<&OrderUnit>,
) {
    let Some(ghost) = fs.deploy_ghost_group else {
        return;
    };
    let passable = q.passable_for(unit, col, row);
    let ok = passable
        && q.occupant(col, row)
            .is_none_or(|o| skip.iter().any(|s| s == &o.id));
    let mat = fs.scene.add_material(overlay_mat(
        if ok { 0x0044_aaff } else { 0x00ff_5555 },
        0.38,
        true,
    ));
    let mesh = fs.scene.mesh(
        ghost,
        Geo::body(UnitGeo::FlatCircle {
            r: 0.38,
            segments: 20,
        }),
        mat,
    );
    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
    fs.scene
        .set_pos(mesh, x, tile_top_y(grid, col, row) + 0.06, z);
}

/// `_refreshBattleMoveGhosts(col, row)` (`:17471-17489`).
pub fn refresh_battle_move_ghosts(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    selected: &[String],
    col: i32,
    row: i32,
) {
    if fs.deploy_ghost_group.is_none() || selected.is_empty() {
        return;
    }
    clear_deploy_ghosts(fs);
    for (id, dc, dr) in q.move_destinations(col, row) {
        let u = q.player_unit(&id);
        add_battle_ghost_disc(fs, grid, q, dc, dr, selected, u);
    }
}

/// `_getDeploySelectedUnits()` (`:15224-15228`).
fn deploy_selected_units<'a>(q: &'a dyn BattleQueries, selected: &[String]) -> Vec<&'a OrderUnit> {
    selected
        .iter()
        .filter_map(|id| q.player_unit(id))
        .filter(|u| !u.dead && !u.removed)
        .collect()
}

fn ghost_disc(fs: &mut FieldScene, ghost: NodeId, color: u32, opacity: f64, geo: UnitGeo, at: P3) {
    let mat = fs.scene.add_material(overlay_mat(color, opacity, true));
    let mesh = fs.scene.mesh(ghost, Geo::body(geo), mat);
    fs.scene.set_pos(mesh, at.x, at.y, at.z);
}

/// `_refreshDeployGhosts()` (`:15811-15904`): drag preview — a disc and a
/// ring per selected unit, the golden outline of the covered cells and the
/// anchor ring.
pub fn refresh_deploy_ghosts(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    selected: &[String],
    drag: Option<DeployDrag>,
) {
    fs.init_deploy_ghost_layer();
    clear_deploy_ghosts(fs);
    let Some(ghost) = fs.deploy_ghost_group else {
        return;
    };
    if selected.is_empty() {
        return;
    }
    fs.scene.nodes[ghost].visible = true;
    let units = deploy_selected_units(q, selected);
    if units.is_empty() {
        return;
    }
    let Some(d) = drag else {
        return;
    };
    let layout = q.deploy_ghost_layout(&units, d);
    let skip: Vec<String> = units.iter().map(|u| u.id.clone()).collect();
    let (mut min_c, mut max_c, mut min_r, mut max_r) = (d.cur_col, d.cur_col, d.cur_row, d.cur_row);
    for u in &units {
        let Some(&(_, pc, pr)) = layout.iter().find(|(k, _, _)| k == &u.id) else {
            continue;
        };
        min_c = min_c.min(pc);
        max_c = max_c.max(pc);
        min_r = min_r.min(pr);
        max_r = max_r.max(pr);
        let ok = q.deploy_cell_ok(pc, pr, &skip);
        let (x, z) = cell_to_world(f64::from(pc), f64::from(pr));
        let top_y = tile_top_y(grid, pc, pr);
        ghost_disc(
            fs,
            ghost,
            if ok { 0x0044_ffcc } else { 0x00ff_5555 },
            if ok { 0.55 } else { 0.45 },
            UnitGeo::FlatCircle {
                r: 0.42,
                segments: 24,
            },
            P3::new(x, top_y + 0.06, z),
        );
        ghost_disc(
            fs,
            ghost,
            if ok { 0x00d4_af37 } else { 0x00ff_8888 },
            0.85,
            UnitGeo::FlatRing {
                inner: 0.38,
                outer: 0.48,
                segments: 24,
            },
            P3::new(x, top_y + 0.07, z),
        );
    }
    fs.append_deploy_cell_outline(grid, min_c, min_r, max_c, max_r, 0x00ff_d700, 0.75, false);
    let (ax, az) = cell_to_world(f64::from(d.anchor_col), f64::from(d.anchor_row));
    let ay = tile_top_y(grid, d.anchor_col, d.anchor_row);
    ghost_disc(
        fs,
        ghost,
        0x00ff_ffff,
        0.9,
        UnitGeo::FlatRing {
            inner: 0.2,
            outer: 0.32,
            segments: 16,
        },
        P3::new(ax, ay + 0.09, az),
    );
}

/// `_refreshDeployGhostsAt(col, row)` (`:15907-15953`): hover preview of the
/// placement layout.
pub fn refresh_deploy_ghosts_at(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    st: &PreviewState,
    col: i32,
    row: i32,
) {
    if !st.deploy_phase || st.selected.is_empty() || st.drag.is_some() {
        return;
    }
    fs.init_deploy_ghost_layer();
    let units = deploy_selected_units(q, &st.selected);
    if units.is_empty() {
        return;
    }
    clear_deploy_ghosts(fs);
    let Some(ghost) = fs.deploy_ghost_group else {
        return;
    };
    fs.scene.nodes[ghost].visible = true;
    let layout = q.deploy_placement_layout(&units, col, row);
    let skip: Vec<String> = units.iter().map(|u| u.id.clone()).collect();
    for u in &units {
        let Some(&(_, pc, pr)) = layout.iter().find(|(k, _, _)| k == &u.id) else {
            continue;
        };
        let ok = q.deploy_cell_ok(pc, pr, &skip);
        let (x, z) = cell_to_world(f64::from(pc), f64::from(pr));
        let top_y = tile_top_y(grid, pc, pr);
        ghost_disc(
            fs,
            ghost,
            if ok { 0x0044_ffcc } else { 0x00ff_5555 },
            if ok { 0.5 } else { 0.4 },
            UnitGeo::FlatCircle {
                r: 0.42,
                segments: 24,
            },
            P3::new(x, top_y + 0.06, z),
        );
    }
    let (mut min_c, mut max_c, mut min_r, mut max_r) = (col, col, row, row);
    for u in &units {
        let Some(&(_, pc, pr)) = layout.iter().find(|(k, _, _)| k == &u.id) else {
            continue;
        };
        min_c = min_c.min(pc);
        max_c = max_c.max(pc);
        min_r = min_r.min(pr);
        max_r = max_r.max(pr);
    }
    fs.append_deploy_cell_outline(grid, min_c, min_r, max_c, max_r, 0x0000_ffcc, 0.9, true);
}

/// `_updateDeployPlacementPreview(cx, cy)` (`:15277-15292`).
pub fn update_deploy_placement_preview(
    fs: &mut FieldScene,
    grid: &TerrainGrid,
    q: &dyn BattleQueries,
    st: &PreviewState,
) {
    if !st.deploy_phase || st.selected.is_empty() {
        clear_deploy_ghosts(fs);
        return;
    }
    if st.drag.is_some() {
        refresh_deploy_ghosts(fs, grid, q, &st.selected, st.drag);
        return;
    }
    match st.tile {
        Some((c, r)) if q.in_deploy_player_zone(c, r) => {
            refresh_deploy_ghosts_at(fs, grid, q, st, c, r)
        }
        _ => clear_deploy_ghosts(fs),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scene::MaterialKind;

    #[test]
    fn constants_follow_their_web_formulas() {
        assert_eq!(HPBAR_H.to_bits(), (0.08f64 / 3.0).to_bits());
        assert_eq!(AMMOBAR_Y.to_bits(), (HPBAR_H * 1.35 * 2.0).to_bits());
        assert_eq!(MaterialKind::Basic.three_type(), "MeshBasicMaterial");
    }

    #[test]
    fn dir_yaw_falls_back_to_east() {
        assert_eq!(dir_yaw(4).to_bits(), dir_yaw(1).to_bits());
        assert_eq!(dir_yaw(-1).to_bits(), dir_yaw(1).to_bits());
        assert_eq!(dir_yaw(1).to_bits(), (PI / 2.0).to_bits());
    }

    #[test]
    fn js_min_max_follow_ecmascript() {
        assert!(js_max(0.0, f64::NAN).is_nan());
        assert!(js_max(f64::NAN, 0.0).is_nan());
        assert!(js_min(f64::NAN, 1.0).is_nan());
        assert!(js_min(1.0, f64::NAN).is_nan());
        assert!(js_max(-0.0, 0.0).is_sign_positive());
        assert!(js_min(0.0, -0.0).is_sign_negative());
        assert_eq!(js_max(0.0001, 0.5), 0.5);
    }
}
