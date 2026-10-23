//! `battle/siegeWall.ts` (web `edb8fb56`, 1 047 LOC): the procedural defensive
//! wall of the siege battle — 9 styles (Grecja, Rzym, Sumer, Egipt, Inka,
//! Chiny, Zulu, Celtowie, Germanie; `aztek`, `hetyci` and unknown keys fall
//! back to Grecja, `siegeWall.ts:998-999`) — and `attachRowBreachPanels`.
//!
//! The wall runs along X, its outer face (merlons) towards −Z, the gate in
//! the middle (`gateWidthTiles * tileSize` wide), the stairs on the inner
//! side (+Z). The result is a [`Scene`] (root = the wall `THREE.Group`) plus
//! the typed `userData` contract read by `battleScene.ts`
//! ([`SiegeWallUserData`]: `wallSegsByLocalX`, `wallWalkY`, `depth`,
//! `gateCenterX`, `gate`, `gateOpen`, `rowWallMeshes`, `rowBreachPanels`).
//! Materials are `MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 })`
//! (`siegeWall.ts:27-33`) shared exactly like in the web (one material per
//! `mk` call). Deterministic: `hash01` (`Math.sin`, through
//! [`crate::jsmath::js_sin`]), no random numbers.
//!
//! Verified bit for bit against the web (`tests/battle3d_siege_wall.rs`).

use std::f64::consts::PI;

use crate::core::bronze::BronzeCiv;
use crate::geom::{self, Mesh};
use crate::jsmath::{js_atan2, js_sin};
use crate::scene::{Geo, GeoBody, MatId, Material, NodeId, Prim, Scene, ROOT};

/// `MeshStandardMaterial.roughness` of every wall material (`siegeWall.ts:30`).
pub const WALL_ROUGHNESS: f64 = 0.92;
/// `MeshStandardMaterial.metalness` of every wall material (`siegeWall.ts:31`).
pub const WALL_METALNESS: f64 = 0.0;
/// Default `height` (`siegeWall.ts:983`).
pub const DEFAULT_HEIGHT: f64 = 3.0;
/// Default `ownerColor` (`siegeWall.ts:984`; unused by every style).
pub const DEFAULT_OWNER_COLOR: u32 = 0x00ff_ffff;
/// Default `gateWidthTiles` (`siegeWall.ts:985`).
pub const DEFAULT_GATE_WIDTH_TILES: f64 = 2.0;
/// Fallback of `userData.wallWalkY` in `attachRowBreachPanels`
/// (`siegeWall.ts:1028`; read, never used).
pub const BREACH_FALLBACK_H: f64 = 2.5;

/// `SiegeWallOpts` (`siegeWall.ts:19-25`); `None` = the field is absent.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SiegeWallOpts {
    /// `lengthTiles`.
    pub length_tiles: f64,
    /// `tileSize`.
    pub tile_size: f64,
    /// `height` (default [`DEFAULT_HEIGHT`]).
    pub height: Option<f64>,
    /// `ownerColor` (default [`DEFAULT_OWNER_COLOR`]; no style reads it).
    pub owner_color: Option<u32>,
    /// `gateWidthTiles` (default [`DEFAULT_GATE_WIDTH_TILES`]).
    pub gate_width_tiles: Option<f64>,
}

impl SiegeWallOpts {
    /// `{ lengthTiles, tileSize }` with every optional field absent.
    #[must_use]
    pub const fn new(length_tiles: f64, tile_size: f64) -> Self {
        Self {
            length_tiles,
            tile_size,
            height: None,
            owner_color: None,
            gate_width_tiles: None,
        }
    }

    /// The call of `BattleScene._placeSiegeWall` (`battleScene.ts:3905-3910`):
    /// `{ lengthTiles, tileSize, height: 2.5, gateWidthTiles: 2 }`.
    #[must_use]
    pub const fn battle(length_tiles: f64, tile_size: f64) -> Self {
        Self {
            length_tiles,
            tile_size,
            height: Some(2.5),
            owner_color: None,
            gate_width_tiles: Some(2.0),
        }
    }
}

/// The 9 builders of `siegeWall.ts` (`buildGrecja` … `buildGermanie`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WallStyle {
    /// `buildGrecja` (`:416-476`).
    Grecja,
    /// `buildRzym` (`:479-531`).
    Rzym,
    /// `buildSumer` (`:534-587`).
    Sumer,
    /// `buildEgipt` (`:590-648`).
    Egipt,
    /// `buildInka` (`:651-700`).
    Inka,
    /// `buildChiny` (`:703-758`).
    Chiny,
    /// `buildZulu` (`:761-842`).
    Zulu,
    /// `buildCeltowie` (`:845-907`).
    Celtowie,
    /// `buildGermanie` (`:910-976`).
    Germanie,
}

/// The 9 styles in the order of the web `switch` (`siegeWall.ts:988-997`).
pub const WALL_STYLES: [WallStyle; 9] = [
    WallStyle::Grecja,
    WallStyle::Rzym,
    WallStyle::Sumer,
    WallStyle::Egipt,
    WallStyle::Inka,
    WallStyle::Chiny,
    WallStyle::Zulu,
    WallStyle::Celtowie,
    WallStyle::Germanie,
];

impl WallStyle {
    /// The `switch (civ)` of `buildSiegeWall` (`siegeWall.ts:988-1000`):
    /// `aztek` and `hetyci` (default branch) build Grecja.
    #[must_use]
    pub const fn for_civ(civ: BronzeCiv) -> Self {
        match civ {
            BronzeCiv::Grecja | BronzeCiv::Aztek | BronzeCiv::Hetyci => Self::Grecja,
            BronzeCiv::Rzym => Self::Rzym,
            BronzeCiv::Sumer => Self::Sumer,
            BronzeCiv::Egipt => Self::Egipt,
            BronzeCiv::Inka => Self::Inka,
            BronzeCiv::Chiny => Self::Chiny,
            BronzeCiv::Zulu => Self::Zulu,
            BronzeCiv::Celtowie => Self::Celtowie,
            BronzeCiv::Germanie => Self::Germanie,
        }
    }

    /// The same `switch` on a raw string (exact match; anything else is the
    /// default branch, Grecja).
    #[must_use]
    pub fn for_web_id(s: &str) -> Self {
        BronzeCiv::from_web_id(s).map_or(Self::Grecja, Self::for_civ)
    }
}

/// `wallGroup.userData` written by `buildSiegeWall` and
/// `attachRowBreachPanels`. JS `Map`s are kept as insertion-ordered
/// `(key, value)` lists with `Map.set` semantics (SameValueZero keys).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeWallUserData {
    /// `wallSegsByLocalX`: segment key `Math.round(cx / T)` → wall-body
    /// segment mesh (`siegeWall.ts:196-212`).
    pub wall_segs_by_local_x: Vec<(f64, NodeId)>,
    /// `wallWalkY` (= `height`).
    pub wall_walk_y: f64,
    /// `depth` (wall depth `wallD`).
    pub depth: f64,
    /// `gateCenterX` (always `0`).
    pub gate_center_x: f64,
    /// `gate`: the portcullis / wooden-gate group.
    pub gate: NodeId,
    /// `gateOpen` (`false` at build time).
    pub gate_open: bool,
    /// `rowWallMeshes`: battlefield row → wall segment meshes
    /// (`attachRowBreachPanels`, `:1033-1043`); `None` until it runs.
    pub row_wall_meshes: Option<Vec<(f64, Vec<NodeId>)>>,
    /// `rowBreachPanels` (always an empty map, `:1046`); `None` until
    /// `attachRowBreachPanels` runs.
    pub row_breach_panels: Option<Vec<(f64, Vec<NodeId>)>>,
}

impl SiegeWallUserData {
    /// `Object.keys(wallGroup.userData)` (insertion order of the web).
    #[must_use]
    pub fn keys(&self) -> Vec<&'static str> {
        let mut k = vec![
            "wallSegsByLocalX",
            "wallWalkY",
            "depth",
            "gateCenterX",
            "gate",
            "gateOpen",
        ];
        if self.row_wall_meshes.is_some() {
            k.push("rowWallMeshes");
        }
        if self.row_breach_panels.is_some() {
            k.push("rowBreachPanels");
        }
        k
    }

    /// `wallSegsByLocalX.get(key)`.
    #[must_use]
    pub fn wall_seg(&self, key: f64) -> Option<NodeId> {
        map_get(&self.wall_segs_by_local_x, key).copied()
    }

    /// `rowWallMeshes.get(row)`.
    #[must_use]
    pub fn row_wall(&self, row: f64) -> Option<&[NodeId]> {
        self.row_wall_meshes
            .as_ref()
            .and_then(|m| map_get(m, row))
            .map(Vec::as_slice)
    }
}

/// A built wall: the group as a scene tree plus its `userData`.
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeWall {
    /// The wall `THREE.Group` (root, identity transform) and its meshes.
    pub scene: Scene,
    /// Which builder ran.
    pub style: WallStyle,
    /// `wallGroup.userData`.
    pub user_data: SiegeWallUserData,
}

// ------------------------------------------------------------ JS numerics

/// SameValueZero (the key equality of a JS `Map`).
fn same_value_zero(a: f64, b: f64) -> bool {
    a == b || (a.is_nan() && b.is_nan())
}

fn map_get<V>(m: &[(f64, V)], key: f64) -> Option<&V> {
    m.iter()
        .find(|(k, _)| same_value_zero(*k, key))
        .map(|(_, v)| v)
}

/// `Map.prototype.set`: overwrite in place, or append.
fn map_set<V>(m: &mut Vec<(f64, V)>, key: f64, v: V) {
    match m.iter_mut().find(|(k, _)| same_value_zero(*k, key)) {
        Some(e) => e.1 = v,
        None => m.push((key, v)),
    }
}

/// `Math.max(a, b)` (NaN-propagating, `max(-0, +0) = +0`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

/// `Math.min(a, b)` (NaN-propagating, `min(-0, +0) = -0`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.round` (ties toward +∞; `-0` for `[-0.5, -0]`).
#[must_use]
pub fn js_round(x: f64) -> f64 {
    if !x.is_finite() || x == 0.0 {
        return x;
    }
    let f = x.floor();
    let r = if x - f >= 0.5 { f + 1.0 } else { f };
    if r == 0.0 && x < 0.0 {
        -0.0
    } else {
        r
    }
}

/// `hash01(n)` (`siegeWall.ts:39-42`): `fract(sin(n·12.9898 + 78.233)·43758.5453123)`.
#[must_use]
pub fn hash01(n: f64) -> f64 {
    let x = js_sin(n * 12.9898 + 78.233) * 43_758.545_312_3;
    x - x.floor()
}

/// JS `ToInt32` of a value already in `[0, 255]` or NaN (NaN → 0).
fn to_i32(v: f64) -> i32 {
    // `as` saturates and maps NaN to 0, which equals ToInt32 on [0, 255].
    #[allow(clippy::cast_possible_truncation)]
    let r = v as i32;
    r
}

/// `shadeColor(hex, amt)` (`siegeWall.ts:47-52`): lightens (`amt > 0`) or
/// darkens (`amt < 0`) each channel by the fraction `amt`.
#[must_use]
pub fn shade_color(hex: u32, amt: f64) -> u32 {
    let adj = |c: u32| -> i32 {
        let c = f64::from(c);
        let v = if amt >= 0.0 {
            c + (255.0 - c) * amt
        } else {
            c + c * amt
        };
        to_i32(js_max(0.0, js_min(255.0, js_round(v))))
    };
    let r = adj((hex >> 16) & 0xff);
    let g = adj((hex >> 8) & 0xff);
    let b = adj(hex & 0xff);
    // `(r << 16) | (g << 8) | b` on int32, then used as a colour number.
    #[allow(clippy::cast_sign_loss)]
    let out = ((r << 16) | (g << 8) | b) as u32;
    out
}

// ------------------------------------------------------------ geometry

/// `new THREE.CylinderGeometry(r, r, h, radial, 1, true, 0, Math.PI)` — the
/// half-cylinder arch of the Sumer gate (`siegeWall.ts:562`); `Prim` has no
/// `thetaLength`, so the module owns this body.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ArchCylinder {
    /// `radiusTop` = `radiusBottom`.
    pub r: f64,
    /// `height`.
    pub h: f64,
    /// `radialSegments`.
    pub radial: u32,
}

impl GeoBody for ArchCylinder {
    fn build(&self) -> Mesh {
        geom::cylinder_geometry(self.r, self.r, self.h, self.radial, 1, true, 0.0, PI)
    }
    fn three_type(&self) -> &'static str {
        "CylinderGeometry"
    }
}

/// Constructor parameters of a wall geometry in the order of three's
/// `geometry.parameters` (Box: w, h, d, 1, 1, 1; Cylinder: rt, rb, h,
/// radial, 1, open, thetaStart, thetaLength; Cone: r, h, radial, 1, open,
/// thetaStart, thetaLength), booleans as 0/1. `None` for a geometry the
/// wall never builds.
#[must_use]
pub fn geo_parameters(g: &Geo) -> Option<Vec<f64>> {
    if let Some(a) = g.body_as::<ArchCylinder>() {
        return Some(vec![a.r, a.r, a.h, f64::from(a.radial), 1.0, 1.0, 0.0, PI]);
    }
    match g.prim()? {
        Prim::Box { w, h, d } => Some(vec![w, h, d, 1.0, 1.0, 1.0]),
        Prim::Cylinder {
            rt,
            rb,
            h,
            radial,
            open,
        } => Some(vec![
            rt,
            rb,
            h,
            f64::from(radial),
            1.0,
            f64::from(u8::from(open)),
            0.0,
            PI * 2.0,
        ]),
        Prim::Cone { r, h, radial } => Some(vec![r, h, f64::from(radial), 1.0, 0.0, 0.0, PI * 2.0]),
        _ => None,
    }
}

// ------------------------------------------------------------ builder state

/// Resolved options (`Required<SiegeWallOpts>`, `siegeWall.ts:980-986`).
#[derive(Debug, Clone, Copy)]
struct Resolved {
    length_tiles: f64,
    t: f64,
    h: f64,
    gate_width_tiles: f64,
}

struct W {
    m: Scene,
    segs: Vec<(f64, NodeId)>,
}

impl W {
    /// `const mk = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, metalness: 0.0 })`.
    fn mk(&mut self, c: u32) -> MatId {
        self.m
            .add_material(Material::standard(c, WALL_METALNESS, WALL_ROUGHNESS))
    }

    /// `new THREE.Mesh(geo, mat)`, `position.set(x, y, z)`, `parent.add(mesh)`.
    fn mesh(
        &mut self,
        parent: NodeId,
        geo: impl Into<Geo>,
        mat: MatId,
        x: f64,
        y: f64,
        z: f64,
    ) -> NodeId {
        let id = self.m.mesh(parent, geo, mat);
        self.m.node(id).set_pos(x, y, z);
        id
    }

    /// Same, with `castShadow = true`.
    fn cast(
        &mut self,
        parent: NodeId,
        geo: impl Into<Geo>,
        mat: MatId,
        x: f64,
        y: f64,
        z: f64,
    ) -> NodeId {
        let id = self.mesh(parent, geo, mat, x, y, z);
        self.m.cast_shadow(id);
        id
    }

    /// `addMerlonRow` (`siegeWall.ts:59-85`).
    #[allow(clippy::too_many_arguments)]
    fn merlon_row(
        &mut self,
        start_x: f64,
        span_w: f64,
        count: f64,
        blank_w: f64,
        blank_h: f64,
        blank_d: f64,
        ext_z: f64,
        h_top: f64,
        base_color: u32,
        seed: f64,
    ) {
        if count <= 0.0 {
            return;
        }
        let mat_light = self.mk(shade_color(base_color, 0.06));
        let mat_dark = self.mk(shade_color(base_color, -0.06));
        let mut i = 0u32;
        while f64::from(i) < count {
            let fi = f64::from(i);
            let bx = start_x + (fi + 0.5) * (span_w / count);
            let j = (hash01(seed + fi * 3.173) - 0.5) * 2.0 * 0.08;
            let h = blank_h * (1.0 + j);
            let mat = if i.is_multiple_of(2) {
                mat_light
            } else {
                mat_dark
            };
            self.cast(
                ROOT,
                Prim::bx(blank_w, h, blank_d),
                mat,
                bx,
                h_top + h / 2.0,
                ext_z,
            );
            i += 1;
        }
    }

    /// `addSimpleTurrets` (`siegeWall.ts:93-137`).
    #[allow(clippy::too_many_arguments)]
    fn simple_turrets(
        &mut self,
        gate_w: f64,
        h: f64,
        t: f64,
        body_color: u32,
        cap_color: u32,
        wood: bool,
    ) {
        let turret_r = t * 0.3;
        let turret_h = h * 1.25;
        let body_mat = self.mk(body_color);
        let cap_mat = self.mk(cap_color);
        for sx in [-1.0, 1.0] {
            let px = sx * (gate_w / 2.0 + turret_r * 0.7);
            if wood {
                self.cast(
                    ROOT,
                    Prim::cyl(turret_r * 0.85, turret_r, turret_h, 6),
                    body_mat,
                    px,
                    turret_h / 2.0,
                    0.0,
                );
                self.cast(
                    ROOT,
                    Prim::cone(turret_r * 1.05, turret_h * 0.22, 6),
                    cap_mat,
                    px,
                    turret_h + turret_h * 0.11,
                    0.0,
                );
            } else {
                self.cast(
                    ROOT,
                    Prim::bx(turret_r * 1.7, turret_h, turret_r * 1.7),
                    body_mat,
                    px,
                    turret_h / 2.0,
                    0.0,
                );
                self.cast(
                    ROOT,
                    Prim::bx(turret_r * 2.0, turret_h * 0.12, turret_r * 2.0),
                    cap_mat,
                    px,
                    turret_h + turret_h * 0.06,
                    0.0,
                );
            }
        }
    }

    /// `buildWallBodySegmented` (`siegeWall.ts:159-214`).
    #[allow(clippy::too_many_arguments)]
    fn wall_body_segmented(
        &mut self,
        l: f64,
        gate_w: f64,
        h: f64,
        wall_d: f64,
        t: f64,
        base_color: u32,
    ) {
        const BUCKETS: f64 = 5.0;
        let start_x = -l / 2.0;
        let end_x = l / 2.0;
        let gate_half_w = gate_w / 2.0;
        let mut segs: Vec<(f64, NodeId)> = Vec::new();
        let mut shade_cache: Vec<(f64, MatId)> = Vec::new();
        let mut sx = start_x;
        while sx < end_x - t * 0.01 {
            let cx = sx + t / 2.0;
            if cx.abs() < gate_half_w + t * 0.01 {
                sx += t;
                continue;
            }
            let key = js_round(cx / t);
            // getSegMat(key)
            let bucket = (hash01(key * 7.319 + 11.71) * BUCKETS).floor() % BUCKETS;
            let mat = if let Some(&m) = map_get(&shade_cache, bucket) {
                m
            } else {
                let amt = (bucket / (BUCKETS - 1.0) - 0.5) * 2.0 * 0.06;
                let m = self.mk(shade_color(base_color, amt));
                map_set(&mut shade_cache, bucket, m);
                m
            };
            let seg = self.mesh(ROOT, Prim::bx(t, h, wall_d), mat, cx, h / 2.0, 0.0);
            self.m.shadows(seg, true, true);
            map_set(&mut segs, key, seg);
            sx += t;
        }
        // `userData.wallSegsByLocalX`: set, or merged into an existing map
        // (`:207-213`; every builder calls this once, so it is always set).
        for (k, v) in segs {
            map_set(&mut self.segs, k, v);
        }
    }

    /// `addStairs` (`siegeWall.ts:224-262`).
    #[allow(clippy::too_many_arguments)]
    fn stairs(
        &mut self,
        left_start_x: f64,
        right_start_x: f64,
        section_w: f64,
        wall_d: f64,
        h: f64,
        cx: f64,
        mat: MatId,
    ) {
        let step_h = 0.22;
        let step_d = 0.20;
        let stair_w = js_min(section_w * 0.45, wall_d * 2.5);
        let n_steps = (h / step_h).ceil();
        let actual_step_h = h / n_steps;
        let wall_inner_z = cx + wall_d / 2.0;
        for start_x in [left_start_x, right_start_x] {
            let mut i = 0u32;
            while f64::from(i) < n_steps {
                let fi = f64::from(i);
                let y = fi * actual_step_h + actual_step_h / 2.0;
                let z = wall_inner_z + (n_steps - fi - 0.5) * step_d;
                let s = self.mesh(
                    ROOT,
                    Prim::bx(stair_w, actual_step_h, step_d),
                    mat,
                    start_x + stair_w / 2.0,
                    y,
                    z,
                );
                self.m.shadows(s, true, true);
                i += 1;
            }
        }
    }

    /// `addPortcullis` (`siegeWall.ts:271-333`); returns the gate group.
    fn portcullis(&mut self, gate_w: f64, gate_h: f64, wall_d: f64, gate_center_x: f64) -> NodeId {
        let iron = self.mk(0x3a_3a3a);
        let iron_dk = self.mk(0x25_2525);
        // `new THREE.Group()`; `g.add(gateGroup)` happens after its children
        // are built, and nothing else is added to `g` in between, so creating
        // it under the root now gives the same child order.
        let gg = self.m.group(ROOT);
        let bar_thick = js_max(0.045, gate_w * 0.038);
        let v_bars = js_max(3.0, js_round(gate_w / (gate_w * 0.18)));
        let v_spacing = gate_w / (v_bars + 1.0);
        let z = -wall_d / 2.0;
        let mut i = 1u32;
        while f64::from(i) <= v_bars {
            self.cast(
                gg,
                Prim::bx(bar_thick, gate_h, bar_thick),
                iron,
                gate_center_x - gate_w / 2.0 + f64::from(i) * v_spacing,
                gate_h / 2.0,
                z,
            );
            i += 1;
        }
        for i in 0..3u32 {
            let y = gate_h * (0.18 + f64::from(i) * 0.32);
            self.cast(
                gg,
                Prim::bx(gate_w, bar_thick * 1.2, bar_thick),
                iron_dk,
                gate_center_x,
                y,
                z,
            );
        }
        self.cast(
            gg,
            Prim::bx(bar_thick * 1.5, gate_h, bar_thick),
            iron_dk,
            gate_center_x - gate_w / 2.0 + bar_thick * 0.75,
            gate_h / 2.0,
            z,
        );
        self.cast(
            gg,
            Prim::bx(bar_thick * 1.5, gate_h, bar_thick),
            iron_dk,
            gate_center_x + gate_w / 2.0 - bar_thick * 0.75,
            gate_h / 2.0,
            z,
        );
        gg
    }

    /// `addWoodenGate` (`siegeWall.ts:342-413`); returns the gate group.
    #[allow(clippy::too_many_arguments)]
    fn wooden_gate(
        &mut self,
        gate_w: f64,
        gate_h: f64,
        wall_d: f64,
        gate_center_x: f64,
        wood_color: u32,
        wood_dk_color: u32,
    ) -> NodeId {
        let wood = self.mk(wood_color);
        let wood_dk = self.mk(wood_dk_color);
        let gg = self.m.group(ROOT);
        let z_pos = -wall_d / 2.0 + 0.02;
        let plan_thick = js_max(0.05, gate_h * 0.04);
        let wing_w = gate_w / 2.0 - 0.02;
        let plan_count = js_max(3.0, js_round(wing_w / (wing_w * 0.22)));
        let plan_spacing = wing_w / plan_count;
        for side in [-1.0_f64, 1.0] {
            let wing_center_x = gate_center_x + side * (gate_w / 4.0);
            let wing_start_x = gate_center_x + side * (gate_w / 2.0 - 0.01);
            let mut i = 0u32;
            while f64::from(i) < plan_count {
                let px = wing_start_x - side * (f64::from(i) + 0.5) * plan_spacing;
                self.cast(
                    gg,
                    Prim::bx(plan_spacing * 0.88, gate_h, plan_thick),
                    wood,
                    px,
                    gate_h / 2.0,
                    z_pos,
                );
                i += 1;
            }
            self.cast(
                gg,
                Prim::bx(wing_w, plan_thick * 1.4, plan_thick * 0.8),
                wood_dk,
                wing_center_x,
                gate_h * 0.5,
                z_pos + plan_thick * 0.6,
            );
            let diag_len = (wing_w * wing_w + (gate_h * 0.7) * (gate_h * 0.7)).sqrt();
            let diag_angle = js_atan2(gate_h * 0.7, wing_w) * if side == -1.0 { 1.0 } else { -1.0 };
            let d = self.cast(
                gg,
                Prim::bx(diag_len, plan_thick * 0.9, plan_thick * 0.7),
                wood_dk,
                wing_center_x,
                gate_h * 0.4,
                z_pos + plan_thick * 1.1,
            );
            self.m.node(d).rot_z(diag_angle);
        }
        self.cast(
            gg,
            Prim::bx(gate_w * 0.06, gate_h * 0.35, plan_thick * 1.2),
            wood_dk,
            gate_center_x,
            gate_h * 0.5,
            z_pos + plan_thick * 0.8,
        );
        gg
    }

    fn finish(self, style: WallStyle, h: f64, wall_d: f64, gate: NodeId) -> SiegeWall {
        SiegeWall {
            scene: self.m,
            style,
            user_data: SiegeWallUserData {
                wall_segs_by_local_x: self.segs,
                wall_walk_y: h,
                depth: wall_d,
                gate_center_x: 0.0,
                gate,
                gate_open: false,
                row_wall_meshes: None,
                row_breach_panels: None,
            },
        }
    }
}

/// Common prologue of every builder: `L`, `gateW`, `leftW`.
struct Dims {
    t: f64,
    h: f64,
    l: f64,
    gate_w: f64,
    left_w: f64,
}

fn dims(o: Resolved) -> Dims {
    let l = o.length_tiles * o.t;
    let gate_w = o.gate_width_tiles * o.t;
    Dims {
        t: o.t,
        h: o.h,
        l,
        gate_w,
        left_w: (l - gate_w) / 2.0,
    }
}

fn new_w() -> W {
    W {
        m: Scene::new(),
        segs: Vec::new(),
    }
}

// ------------------------------------------------------------ the 9 styles

/// `buildGrecja` (`siegeWall.ts:416-476`).
fn build_grecja(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.0);
    let stone_color = 0xd4_c5a9;
    let stone = w.mk(stone_color);
    let stone_dk = w.mk(0xc8_b596);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let (blank_w, blank_h, blank_d) = (t * 0.25, h * 0.25, wall_d * 0.35);
    let ext_z = -wall_d / 2.0 + blank_d / 2.0;
    let blank_count = (left_w / (t * 0.6)).floor();
    w.merlon_row(
        -l / 2.0,
        left_w,
        blank_count,
        blank_w,
        blank_h,
        blank_d,
        ext_z,
        h,
        0xc8_b596,
        1.0,
    );
    w.merlon_row(
        gate_w / 2.0,
        left_w,
        blank_count,
        blank_w,
        blank_h,
        blank_d,
        ext_z,
        h,
        0xc8_b596,
        2.0,
    );
    let ramp = w.mk(0xb8_a888);
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, ramp);
    w.cast(ROOT, Prim::bx(gate_w, h * 0.12, wall_d), stone, 0.0, h, 0.0);
    w.cast(
        ROOT,
        Prim::bx(gate_w, h * 0.06, wall_d),
        stone_dk,
        0.0,
        h + h * 0.03,
        0.0,
    );
    let (pillar_h, pillar_w) = (h, t * 0.2);
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::bx(pillar_w, pillar_h, wall_d),
            stone,
            sx * (gate_w / 2.0 + pillar_w / 2.0),
            pillar_h / 2.0,
            0.0,
        );
    }
    w.simple_turrets(gate_w, h, t, stone_color, 0xc8_b596, false);
    let gate = w.portcullis(gate_w, h, wall_d, 0.0);
    w.finish(WallStyle::Grecja, h, wall_d, gate)
}

/// `buildRzym` (`siegeWall.ts:479-531`).
fn build_rzym(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.1);
    let stone_color = 0xc8_b99a;
    let stone = w.mk(stone_color);
    let stone_dk = w.mk(0xb0_a080);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let ext_z = -wall_d / 2.0 + t * 0.1;
    let (blank_w, blank_h, blank_d) = (t * 0.2, h * 0.22, t * 0.15);
    let blank_count = (left_w / (t * 0.55)).floor();
    for (start, seed) in [(-l / 2.0, 3.0), (gate_w / 2.0, 4.0)] {
        w.merlon_row(
            start,
            left_w,
            blank_count,
            blank_w,
            blank_h,
            blank_d,
            ext_z,
            h,
            0xb0_a080,
            seed,
        );
    }
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, stone_dk);
    w.mesh(
        ROOT,
        Prim::bx(gate_w + t * 0.1, h * 0.07, wall_d),
        stone,
        0.0,
        h,
        0.0,
    );
    let (tower_r, tower_h) = (t * 0.35, h * 1.35);
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::cyl(tower_r, tower_r * 1.05, tower_h, 8),
            stone,
            sx * (gate_w / 2.0 + tower_r * 0.6),
            tower_h / 2.0,
            0.0,
        );
        w.cast(
            ROOT,
            Prim::cone(tower_r * 1.1, tower_h * 0.25, 8),
            stone_dk,
            sx * (gate_w / 2.0 + tower_r * 0.6),
            tower_h + tower_h * 0.125,
            0.0,
        );
    }
    let gate = w.portcullis(gate_w, h, wall_d, 0.0);
    w.finish(WallStyle::Rzym, h, wall_d, gate)
}

/// `buildSumer` (`siegeWall.ts:534-587`).
fn build_sumer(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.2);
    let stone_color = 0xc2_956c;
    let stone = w.mk(stone_color);
    let stone_dk = w.mk(0xa0_7850);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let ext_z = -wall_d / 2.0 + t * 0.1;
    let (blank_w, blank_h, blank_d) = (t * 0.28, h * 0.28, t * 0.15);
    let blank_count = (left_w / (t * 0.65)).floor();
    for (start, seed) in [(-l / 2.0, 5.0), (gate_w / 2.0, 6.0)] {
        w.merlon_row(
            start,
            left_w,
            blank_count,
            blank_w,
            blank_h,
            blank_d,
            ext_z,
            h,
            0xa0_7850,
            seed,
        );
    }
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, stone_dk);
    let arch_r = gate_w / 2.0;
    let arch = w.cast(
        ROOT,
        Geo::body(ArchCylinder {
            r: arch_r,
            h: wall_d,
            radial: 8,
        }),
        stone,
        0.0,
        h,
        0.0,
    );
    // `arch.rotation.z = PI/2; arch.rotation.y = PI/2;` (each assignment
    // recomputes the quaternion from the whole Euler; the last one wins).
    w.m.node(arch).rot_z(PI / 2.0).rot_y(PI / 2.0);
    w.mesh(
        ROOT,
        Prim::bx(gate_w, h * 0.06, wall_d),
        stone_dk,
        0.0,
        h + arch_r,
        0.0,
    );
    w.simple_turrets(gate_w, h, t, stone_color, 0xa0_7850, false);
    let gate = w.portcullis(gate_w, h, wall_d, 0.0);
    w.finish(WallStyle::Sumer, h, wall_d, gate)
}

/// `buildEgipt` (`siegeWall.ts:590-648`).
fn build_egipt(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.05);
    let stone_color = 0xd4_a96a;
    let stone = w.mk(stone_color);
    let stone_dk = w.mk(0xb0_8040);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let ext_z = -wall_d / 2.0 + t * 0.1;
    let (blank_w, blank_h, blank_d) = (t * 0.32, h * 0.22, t * 0.14);
    let blank_count = (left_w / (t * 0.7)).floor();
    for (start, seed) in [(-l / 2.0, 7.0), (gate_w / 2.0, 8.0)] {
        w.merlon_row(
            start,
            left_w,
            blank_count,
            blank_w,
            blank_h,
            blank_d,
            ext_z,
            h,
            0xb0_8040,
            seed,
        );
    }
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, stone_dk);
    let (pylon_w, pylon_h, pylon_d) = (t * 0.5, h * 1.4, wall_d * 1.1);
    for sx in [-1.0, 1.0] {
        let pylon_x = sx * (gate_w / 2.0 + pylon_w * 0.6);
        w.cast(
            ROOT,
            Prim::bx(pylon_w, pylon_h * 0.6, pylon_d),
            stone,
            pylon_x,
            pylon_h * 0.3,
            0.0,
        );
        w.cast(
            ROOT,
            Prim::bx(pylon_w * 0.72, pylon_h * 0.4, pylon_d * 0.85),
            stone_dk,
            pylon_x,
            pylon_h * 0.8,
            0.0,
        );
        let cap = w.cast(
            ROOT,
            Prim::cone(pylon_w * 0.38, pylon_h * 0.12, 4),
            stone_dk,
            pylon_x,
            pylon_h + pylon_h * 0.06,
            0.0,
        );
        w.m.node(cap).rot_y(PI / 4.0);
    }
    w.mesh(
        ROOT,
        Prim::bx(gate_w + pylon_w, h * 0.06, wall_d),
        stone_dk,
        0.0,
        h,
        0.0,
    );
    let gate = w.portcullis(gate_w, h, wall_d, 0.0);
    w.finish(WallStyle::Egipt, h, wall_d, gate)
}

/// `buildInka` (`siegeWall.ts:651-700`).
fn build_inka(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.1);
    let stone_color = 0x6b_6b5a;
    let _stone = w.mk(stone_color);
    let stone_dk = w.mk(0x4a_4a3c);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let ext_z = -wall_d / 2.0 + t * 0.08;
    let (blank_w, blank_h, blank_d) = (t * 0.22, h * 0.2, t * 0.12);
    let blank_count = (left_w / (t * 0.65)).floor();
    for (start, seed) in [(-l / 2.0, 9.0), (gate_w / 2.0, 10.0)] {
        w.merlon_row(
            start,
            left_w,
            blank_count,
            blank_w,
            blank_h,
            blank_d,
            ext_z,
            h,
            0x4a_4a3c,
            seed,
        );
    }
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, stone_dk);
    let gate_h = h * 0.88;
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::bx(t * 0.18, gate_h, wall_d * 1.1),
            stone_dk,
            sx * gate_w / 2.0,
            gate_h / 2.0,
            0.0,
        );
    }
    w.mesh(
        ROOT,
        Prim::bx(gate_w * 0.8, h * 0.06, wall_d),
        stone_dk,
        0.0,
        h,
        0.0,
    );
    w.simple_turrets(gate_w, h, t, stone_color, 0x4a_4a3c, false);
    let gate = w.portcullis(gate_w, h * 0.88, wall_d, 0.0);
    w.finish(WallStyle::Inka, h, wall_d, gate)
}

/// `buildChiny` (`siegeWall.ts:703-758`).
fn build_chiny(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.15);
    let brick_color = 0x8b_3a2a;
    let brick = w.mk(brick_color);
    let brick_dk = w.mk(0x6b_2a1a);
    let tile_m = w.mk(0x3a_5a2a);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, brick_color);
    let ext_z = -wall_d / 2.0 + t * 0.1;
    let blank_count = (left_w / (t * 0.55)).floor();
    for (start, seed) in [(-l / 2.0, 11.0), (gate_w / 2.0, 12.0)] {
        w.merlon_row(
            start,
            left_w,
            blank_count,
            t * 0.22,
            h * 0.2,
            t * 0.15,
            ext_z,
            h,
            0x6b_2a1a,
            seed,
        );
    }
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, brick_dk);
    let (tower_w, tower_h, tower_d) = (gate_w + t * 0.8, h * 0.65, wall_d * 1.5);
    w.cast(
        ROOT,
        Prim::bx(tower_w, tower_h, tower_d),
        brick,
        0.0,
        h + tower_h / 2.0,
        0.0,
    );
    let (eave_w, eave_d, eave_h) = (tower_w + t * 0.5, tower_d + t * 0.5, h * 0.08);
    w.cast(
        ROOT,
        Prim::bx(eave_w, eave_h, eave_d),
        tile_m,
        0.0,
        h + tower_h + eave_h / 2.0,
        0.0,
    );
    let roof_h = tower_h * 0.45;
    let roof = w.cast(
        ROOT,
        Prim::cyl(roof_h * 0.2, tower_w * 0.55, roof_h, 4),
        tile_m,
        0.0,
        h + tower_h + eave_h + roof_h / 2.0,
        0.0,
    );
    w.m.node(roof)
        .rot_y(PI / 4.0)
        .set_scale(1.0, 1.0, tower_d / tower_w);
    let gate = w.portcullis(gate_w, h, wall_d, 0.0);
    w.finish(WallStyle::Chiny, h, wall_d, gate)
}

/// `buildZulu` (`siegeWall.ts:761-842`).
#[allow(clippy::too_many_lines)]
fn build_zulu(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = t;
    let wood_color = 0x5c_3d1e;
    let wood_dk_color = 0x3d_2510;
    let wood = w.mk(wood_color);
    let wood_dk = w.mk(wood_dk_color);
    let thorn_color = 0x2d_3a18;
    let thorn_h = h * 0.2;
    w.wall_body_segmented(l, gate_w, thorn_h, wall_d, t, thorn_color);
    let (pole_r, pole_h) = (t * 0.07, h);
    let pole_spacing = t * 0.22;
    for side in 0..2 {
        let start_x = if side == 0 { -l / 2.0 } else { gate_w / 2.0 };
        let wd = left_w;
        let cnt = (wd / pole_spacing).floor();
        let mut i = 0u32;
        while f64::from(i) <= cnt {
            let px = start_x + f64::from(i) * (wd / cnt);
            let ph = pole_h * if i.is_multiple_of(2) { 1.0 } else { 0.88 };
            w.cast(
                ROOT,
                Prim::cyl(pole_r, pole_r * 1.1, ph, 6),
                wood,
                px,
                ph / 2.0,
                -wall_d * 0.3,
            );
            let h2 = ph * 0.92;
            w.cast(
                ROOT,
                Prim::cyl(pole_r, pole_r * 1.1, h2, 6),
                wood_dk,
                px,
                h2 / 2.0,
                wall_d * 0.3,
            );
            i += 1;
        }
    }
    for (px, pw) in [
        (-l / 2.0 + left_w / 2.0, left_w),
        (l / 2.0 - left_w / 2.0, left_w),
    ] {
        w.cast(
            ROOT,
            Prim::bx(pw, h * 0.06, wall_d * 0.85),
            wood_dk,
            px,
            h + h * 0.03,
            0.0,
        );
    }
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::cyl(t * 0.14, t * 0.16, h * 1.15, 8),
            wood_dk,
            sx * gate_w / 2.0,
            h * 0.575,
            0.0,
        );
    }
    let crossbar = w.cast(
        ROOT,
        Prim::cyl(pole_r * 1.5, pole_r * 1.5, gate_w + t * 0.3, 6),
        wood_dk,
        0.0,
        h * 1.1,
        0.0,
    );
    w.m.node(crossbar).rot_z(PI / 2.0);
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, wood_dk);
    w.simple_turrets(gate_w, h, t, wood_color, wood_dk_color, true);
    let gate = w.wooden_gate(gate_w, h, wall_d, 0.0, 0x5c_3d1e, 0x3d_2510);
    w.finish(WallStyle::Zulu, h, wall_d, gate)
}

/// Palisade poles on the wall crown of Celtowie / Germanie
/// (`siegeWall.ts:867-877` / `:932-942`).
#[allow(clippy::too_many_arguments)]
fn crown_poles(
    w: &mut W,
    l: f64,
    gate_w: f64,
    left_w: f64,
    h: f64,
    pole: Prim,
    pole_h: f64,
    pole_spacing: f64,
    ext_z: f64,
    mat: MatId,
) {
    for side in 0..2 {
        let start_x = if side == 0 { -l / 2.0 } else { gate_w / 2.0 };
        let cnt = (left_w / pole_spacing).floor();
        let mut i = 0u32;
        while f64::from(i) <= cnt {
            let px = start_x + f64::from(i) * (left_w / cnt);
            w.cast(ROOT, pole, mat, px, h + pole_h / 2.0, ext_z);
            i += 1;
        }
    }
}

/// `buildCeltowie` (`siegeWall.ts:845-907`).
fn build_celtowie(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.15);
    let stone_color = 0x88_8877;
    let _stone = w.mk(stone_color);
    let wood_color = 0x6b_4226;
    let wood_dk_color = 0x4a_2d18;
    let wood = w.mk(wood_color);
    let wood_dk = w.mk(wood_dk_color);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, stone_color);
    let (pole_r, pole_h) = (t * 0.055, h * 0.35);
    crown_poles(
        &mut w,
        l,
        gate_w,
        left_w,
        h,
        Prim::cyl(pole_r, pole_r * 1.1, pole_h, 5),
        pole_h,
        t * 0.25,
        -wall_d * 0.38,
        wood_dk,
    );
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, wood);
    w.mesh(
        ROOT,
        Prim::bx(gate_w + t * 0.1, h * 0.06, wall_d),
        wood,
        0.0,
        h,
        0.0,
    );
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::bx(t * 0.22, h, wall_d * 1.0),
            wood,
            sx * gate_w / 2.0,
            h / 2.0,
            0.0,
        );
    }
    w.simple_turrets(gate_w, h, t, wood_color, wood_dk_color, true);
    let gate = w.wooden_gate(gate_w, h, wall_d, 0.0, 0x6b_4226, 0x4a_2d18);
    w.finish(WallStyle::Celtowie, h, wall_d, gate)
}

/// `buildGermanie` (`siegeWall.ts:910-976`).
fn build_germanie(o: Resolved) -> SiegeWall {
    let mut w = new_w();
    let Dims {
        t,
        h,
        l,
        gate_w,
        left_w,
    } = dims(o);
    let wall_d = js_max(t, t * 1.3);
    let wood_color = 0x4a_3728;
    let wood_dk_color = 0x32_241a;
    let wood = w.mk(wood_color);
    let wood_dk = w.mk(wood_dk_color);
    let dirt_color = 0x5a_4530;
    let dirt = w.mk(dirt_color);
    w.wall_body_segmented(l, gate_w, h, wall_d, t, dirt_color);
    let (pole_r, pole_h) = (t * 0.065, h * 0.45);
    crown_poles(
        &mut w,
        l,
        gate_w,
        left_w,
        h,
        Prim::cyl(pole_r, pole_r * 1.15, pole_h, 6),
        pole_h,
        t * 0.28,
        -wall_d * 0.38,
        wood,
    );
    w.stairs(-l / 2.0, gate_w / 2.0, left_w, wall_d, h, 0.0, wood_dk);
    w.mesh(
        ROOT,
        Prim::bx(gate_w + t * 0.2, h * 0.06, wall_d),
        dirt,
        0.0,
        h,
        0.0,
    );
    for sx in [-1.0, 1.0] {
        w.cast(
            ROOT,
            Prim::bx(t * 0.2, h * 1.1, t * 0.5),
            wood_dk,
            sx * gate_w / 2.0,
            h * 0.55,
            0.0,
        );
    }
    w.cast(
        ROOT,
        Prim::bx(gate_w + t * 0.4, t * 0.15, t * 0.2),
        wood_dk,
        0.0,
        h * 0.88,
        0.0,
    );
    w.simple_turrets(gate_w, h, t, wood_color, wood_dk_color, true);
    let gate = w.wooden_gate(gate_w, h, wall_d, 0.0, 0x4a_3728, 0x32_241a);
    w.finish(WallStyle::Germanie, h, wall_d, gate)
}

// ------------------------------------------------------------ public API

/// `buildSiegeWall(civ, opts)` (`siegeWall.ts:979-1001`).
#[must_use]
pub fn build_siege_wall(civ: BronzeCiv, opts: &SiegeWallOpts) -> SiegeWall {
    build_siege_wall_style(WallStyle::for_civ(civ), opts)
}

/// `buildSiegeWall` called with a raw string key (unknown keys → Grecja).
#[must_use]
pub fn build_siege_wall_web_id(civ: &str, opts: &SiegeWallOpts) -> SiegeWall {
    build_siege_wall_style(WallStyle::for_web_id(civ), opts)
}

/// One of the 9 builders directly.
#[must_use]
pub fn build_siege_wall_style(style: WallStyle, opts: &SiegeWallOpts) -> SiegeWall {
    let o = Resolved {
        length_tiles: opts.length_tiles,
        t: opts.tile_size,
        h: opts.height.unwrap_or(DEFAULT_HEIGHT),
        gate_width_tiles: opts.gate_width_tiles.unwrap_or(DEFAULT_GATE_WIDTH_TILES),
    };
    match style {
        WallStyle::Grecja => build_grecja(o),
        WallStyle::Rzym => build_rzym(o),
        WallStyle::Sumer => build_sumer(o),
        WallStyle::Egipt => build_egipt(o),
        WallStyle::Inka => build_inka(o),
        WallStyle::Chiny => build_chiny(o),
        WallStyle::Zulu => build_zulu(o),
        WallStyle::Celtowie => build_celtowie(o),
        WallStyle::Germanie => build_germanie(o),
    }
}

/// `attachRowBreachPanels(wallGroup, wallCenterRow, rowLo, rowHi, gateRowLo,
/// gateRowHi, tileSize)` (`siegeWall.ts:1019-1047`): maps every non-gate
/// battlefield row to its wall segment (`localX = (r − wallCenterRow)·T`,
/// key `Math.round(localX / T)`) into `rowWallMeshes` (a new map each call)
/// and sets `rowBreachPanels` to an empty map.
///
/// Web quirk kept 1:1: the geometric gate is centred on local `x = 0`
/// (segments with `|cx| < gateW/2 + 0.01·T` are skipped), while the rows
/// the battle treats as gate are passed in separately; a row whose key has
/// no segment simply gets no entry (`battleScene.ts:3930-3938` with
/// `wallCenterRow = 77.5` and gate rows 76–77 leaves row 78 without a mesh).
#[allow(clippy::too_many_arguments)]
pub fn attach_row_breach_panels(
    wall: &mut SiegeWall,
    wall_center_row: f64,
    row_lo: f64,
    row_hi: f64,
    gate_row_lo: f64,
    gate_row_hi: f64,
    tile_size: f64,
) {
    let mut rows: Vec<(f64, Vec<NodeId>)> = Vec::new();
    let mut r = row_lo;
    while r <= row_hi {
        if !(r >= gate_row_lo && r <= gate_row_hi) {
            let local_x = (r - wall_center_row) * tile_size;
            let seg_key = js_round(local_x / tile_size);
            if let Some(seg) = wall.user_data.wall_seg(seg_key) {
                map_set(&mut rows, r, vec![seg]);
            }
        }
        r += 1.0;
    }
    wall.user_data.row_wall_meshes = Some(rows);
    wall.user_data.row_breach_panels = Some(Vec::new());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn js_round_matches_ecmascript() {
        for (x, want) in [
            (0.5, 1.0),
            (1.5, 2.0),
            (2.5, 3.0),
            (-0.5, -0.0),
            (-1.5, -1.0),
            (-2.5, -2.0),
            (0.499_999_999_999_999_94, 0.0),
            (-0.4, -0.0),
            (77.5, 78.0),
        ] {
            let got = js_round(x);
            assert_eq!(got.to_bits(), f64::to_bits(want), "round({x})");
        }
        assert!(js_round(f64::NAN).is_nan());
    }

    #[test]
    fn shade_color_clamps_and_rounds() {
        assert_eq!(shade_color(0x00_0000, 0.06), 0x0f_0f0f);
        assert_eq!(shade_color(0xff_ffff, -0.06), 0xf0_f0f0);
        assert_eq!(shade_color(0x80_8080, 0.0), 0x80_8080);
        assert_eq!(shade_color(0x12_3456, f64::NAN), 0);
    }

    #[test]
    fn style_dispatch_follows_the_web_switch() {
        assert_eq!(WallStyle::for_civ(BronzeCiv::Aztek), WallStyle::Grecja);
        assert_eq!(WallStyle::for_civ(BronzeCiv::Hetyci), WallStyle::Grecja);
        assert_eq!(WallStyle::for_web_id("Grecja"), WallStyle::Grecja);
        assert_eq!(WallStyle::for_web_id("zulu"), WallStyle::Zulu);
    }
}
