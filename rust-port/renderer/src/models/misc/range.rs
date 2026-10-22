//! `render/rangeOverlay.ts` (web `edb8fb56`, 909 LOC): culture / religion /
//! mine-eligibility range overlays ([`build_range_overlay_group`]) and the
//! per-owner territory border bands ([`build_territory_border_group`]) as
//! CPU buffers ([`OverlayGroup`]).
//!
//! The relief drape (`hugTerrainRelief`, `buildReliefDrapeMesh`) samples the
//! hill / mountain solid through `reliefSurfaceSampler`
//! (`mapRenderStyle.ts:1107-1121` → `powierzchniaReliefuY` of
//! `teren-gory-wzgorza.ts`, a raycast into the relief variant). That
//! raycaster is not part of MOD-13; the sampler is injected through
//! [`ReliefSource`]. [`FlatRelief`] reproduces the web exactly for every
//! terrain whose sampler is `null` (all but `Wzgorza` / `Gory`).

use std::collections::HashMap;
use std::f64::consts::PI;

use super::model::{MatKind, MiscMaterial, Side};
use super::overlay::{
    buffer_geometry, js_to_fixed, DrapeInfo, HexKey, HexKeySet, OverlayGroup, OverlayKind,
    OverlayMap, OverlayObject,
};
use super::territory::{compute_territory_border_loops, LoopPoint, HEX_DIRS};
use crate::core::map_style::{terrain_surface_top_y, GAME_MAP_RENDER_STYLE};
use crate::geom::{self, Mat4, Quat, Vec3};
use crate::jsmath::{js_cos, js_hypot, js_hypot_n, js_sin};
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::pick::three::{js_max, js_min};

/// `RangeOverlayStyle` (`rangeOverlay.ts:225-241`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RangeOverlayStyle {
    /// `tintColor`.
    pub tint_color: u32,
    /// `tintOpacity`.
    pub tint_opacity: f64,
    /// `borderColor`.
    pub border_color: u32,
    /// `borderOpacity`.
    pub border_opacity: f64,
    /// `borderBandWidth?` (`None` = 0, thin line).
    pub border_band_width: Option<f64>,
    /// `yOffset?` (`None` = 0.05).
    pub y_offset: Option<f64>,
    /// `hugTerrainRelief?` (`true` only when explicitly `true`).
    pub hug_terrain_relief: bool,
}

/// `CULTURE_RANGE_STYLE` (`:438-444`).
pub const CULTURE_RANGE_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: 0xcc_66ff,
    tint_opacity: 0.24,
    border_color: 0xee_99ff,
    border_opacity: 0.85,
    border_band_width: None,
    y_offset: Some(0.05),
    hug_terrain_relief: false,
};

/// `RELIGION_RANGE_STYLE` (`:446-452`).
pub const RELIGION_RANGE_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: 0xff_b040,
    tint_opacity: 0.22,
    border_color: 0xff_d070,
    border_opacity: 0.85,
    border_band_width: None,
    y_offset: Some(0.055),
    hug_terrain_relief: false,
};

/// `MINE_ELIGIBLE_TINT_COLOR` (`:474`).
pub const MINE_ELIGIBLE_TINT_COLOR: u32 = 0x66_ccff;
/// `MINE_ELIGIBLE_TINT_OPACITY` (`:476`).
pub const MINE_ELIGIBLE_TINT_OPACITY: f64 = 0.30;
/// `MINE_ELIGIBLE_STYLE` (`:477-484`).
pub const MINE_ELIGIBLE_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_color: MINE_ELIGIBLE_TINT_COLOR,
    tint_opacity: MINE_ELIGIBLE_TINT_OPACITY,
    border_color: 0x99_ddff,
    border_opacity: 0.9,
    border_band_width: None,
    y_offset: Some(0.06),
    hug_terrain_relief: true,
};

/// `TERRITORY_BORDER_BAND_WIDTH` (`:516`).
pub const TERRITORY_BORDER_BAND_WIDTH: f64 = 0.45;
/// `TERRITORY_RELATION_BAND_WIDTH` (`:524`).
pub const TERRITORY_RELATION_BAND_WIDTH: f64 = TERRITORY_BORDER_BAND_WIDTH / 2.0;
/// `TERRITORY_BORDER_OPACITY` (`:526`).
pub const TERRITORY_BORDER_OPACITY: f64 = 0.7;
/// `TERRITORY_BORDER_Y_OFFSET` (`:527`).
pub const TERRITORY_BORDER_Y_OFFSET: f64 = 0.042;
/// `TERRITORY_BORDER_Y_BUMP` (`:529`).
pub const TERRITORY_BORDER_Y_BUMP: f64 = 0.004;
/// `TERRITORY_RELATION_Y_BUMP` (`:537`).
pub const TERRITORY_RELATION_Y_BUMP: f64 = 0.008;

/// `HUG_RELIEF_TINT_ORDER` (`:251`).
pub const HUG_RELIEF_TINT_ORDER: i32 = 8;
/// `HUG_RELIEF_BORDER_ORDER` (`:252`).
pub const HUG_RELIEF_BORDER_ORDER: i32 = 9;
/// `HUG_RELIEF_SUBDIVISIONS` (`:261`).
pub const HUG_RELIEF_SUBDIVISIONS: u32 = 4;
/// `HUG_RELIEF_SURFACE_LIFT` (`:270`).
pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.012;
/// `HUG_RELIEF_RADIUS_FRAC` (`:273`).
pub const HUG_RELIEF_RADIUS_FRAC: f64 = 0.97;

/// A relief height field of one hex: `(x, z)` local to the hex centre →
/// height above the prism top.
pub type ReliefFn<'a> = Box<dyn Fn(f64, f64) -> f64 + 'a>;

/// `reliefSurfaceSampler(teren, q, r, seed, R)` as an injected dependency.
pub trait ReliefSource {
    /// The sampler of hex `(q, r)` or `None` (web `null`: flat).
    fn sampler(
        &self,
        terrain: Terrain,
        q: i32,
        r: i32,
        seed: f64,
        radius: f64,
    ) -> Option<ReliefFn<'_>>;
}

/// Every sampler is `null`. Identical to the web for all terrains except
/// `Wzgorza` / `Gory`, whose real sampler is the relief raycaster of
/// `teren-gory-wzgorza.ts` (not ported here).
#[derive(Debug, Clone, Copy, Default)]
pub struct FlatRelief;

impl ReliefSource for FlatRelief {
    fn sampler(
        &self,
        _t: Terrain,
        _q: i32,
        _r: i32,
        _seed: f64,
        _radius: f64,
    ) -> Option<ReliefFn<'_>> {
        None
    }
}

fn world(k: HexKey) -> (f64, f64) {
    axial_to_world(HexCoord { q: k.0, r: k.1 }, HEX_R)
}

/// `hexVertices(cx, y, cz, R)` (`:24-35`).
fn hex_vertices(cx: f64, y: f64, cz: f64, radius: f64) -> [Vec3; 6] {
    let mut out = [Vec3::new(0.0, 0.0, 0.0); 6];
    for (i, v) in (0u32..).zip(out.iter_mut()) {
        let a = (PI / 3.0) * f64::from(i);
        *v = Vec3::new(cx + radius * js_sin(a), y, cz + radius * js_cos(a));
    }
    out
}

fn basic(color: u32, opacity: f64, double: bool) -> MiscMaterial {
    let mut m = MiscMaterial::new(MatKind::Basic, color);
    m.transparent = true;
    m.opacity = opacity;
    m.depth_write = false;
    if double {
        m.side = Side::Double;
    }
    m
}

fn line_basic(color: u32, opacity: f64) -> MiscMaterial {
    let mut m = MiscMaterial::new(MatKind::LineBasic, color);
    m.transparent = true;
    m.opacity = opacity;
    m.depth_write = false;
    m
}

#[allow(clippy::cast_possible_truncation)]
fn mat_f32(m: &Mat4) -> [f32; 16] {
    let mut out = [0.0_f32; 16];
    for (o, &e) in out.iter_mut().zip(m.e.iter()) {
        *o = e as f32;
    }
    out
}

/// `buildTintMesh` (`:43-81`).
fn build_tint_mesh(
    map: &OverlayMap,
    keys: &HexKeySet,
    color: u32,
    opacity: f64,
    y_offset: f64,
) -> Option<OverlayObject> {
    let hexes: Vec<(HexKey, f64)> = keys
        .iter()
        .filter(|&k| map.terrain(k).is_some())
        .map(|k| (k, map.hex_top_y(k, y_offset)))
        .collect();
    if hexes.is_empty() {
        return None;
    }
    let geo = geom::cylinder_geometry(
        HEX_R * 0.97,
        HEX_R * 0.97,
        0.002,
        6,
        1,
        false,
        0.0,
        PI * 2.0,
    );
    let mut o = OverlayObject::new(OverlayKind::InstancedMesh, basic(color, opacity, true), geo);
    o.render_order = 3;
    for (k, y) in hexes {
        let (x, z) = world(k);
        let m = Mat4::compose(
            Vec3::new(x, y, z),
            Quat::default(),
            Vec3::new(1.0, 1.0, 1.0),
        );
        o.instances.push(mat_f32(&m));
    }
    Some(o)
}

/// `buildBorderLine` (`:83-132`).
fn build_border_line(
    map: &OverlayMap,
    keys: &HexKeySet,
    color: u32,
    opacity: f64,
    y_offset: f64,
    flat_y: Option<f64>,
    per_hex_y: bool,
) -> Option<OverlayObject> {
    let mut positions: Vec<f64> = Vec::new();
    let border_y = flat_y
        .unwrap_or_else(|| terrain_surface_top_y(Terrain::Laka, GAME_MAP_RENDER_STYLE, y_offset));
    for k in keys.iter() {
        if map.terrain(k).is_none() {
            continue;
        }
        let (cx, cz) = world(k);
        let y = if per_hex_y {
            map.hex_top_y(k, y_offset)
        } else {
            border_y
        };
        let verts = hex_vertices(cx, y, cz, HEX_R);
        for (i, &(dq, dr)) in HEX_DIRS.iter().enumerate() {
            if !keys.has((k.0 + dq, k.1 + dr)) {
                let va = verts[(i + 1) % 6];
                let vb = verts[(i + 2) % 6];
                positions.extend_from_slice(&[va.x, va.y, va.z, vb.x, vb.y, vb.z]);
            }
        }
    }
    if positions.is_empty() {
        return None;
    }
    let mut o = OverlayObject::new(
        OverlayKind::LineSegments,
        line_basic(color, opacity),
        buffer_geometry(&positions, None),
    );
    o.render_order = 5;
    Some(o)
}

/// `edgeOutwardNormal` (`:134-154`).
fn edge_outward_normal(cx: f64, cz: f64, ax: f64, az: f64, bx: f64, bz: f64) -> (f64, f64) {
    let edx = bx - ax;
    let edz = bz - az;
    let len = js_hypot(edx, edz);
    let len = if len == 0.0 { 1.0 } else { len };
    let mut nx = -edz / len;
    let mut nz = edx / len;
    let midx = (ax + bx) * 0.5;
    let midz = (az + bz) * 0.5;
    if (midx - cx) * nx + (midz - cz) * nz < 0.0 {
        nx = -nx;
        nz = -nz;
    }
    (nx, nz)
}

fn indexed_mesh(positions: &[f64], indices: Vec<u32>) -> geom::Mesh {
    let mut g = buffer_geometry(positions, Some(indices));
    g.compute_vertex_normals();
    g
}

fn len_u32(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

/// `buildBorderBandMesh` (`:157-223`).
fn build_border_band_mesh(
    map: &OverlayMap,
    keys: &HexKeySet,
    color: u32,
    opacity: f64,
    y_offset: f64,
    band_width: f64,
) -> Option<OverlayObject> {
    if band_width <= 0.0 {
        return None;
    }
    let mut positions: Vec<f64> = Vec::new();
    let mut indices: Vec<u32> = Vec::new();
    let mut vi = 0u32;
    for k in keys.iter() {
        if map.terrain(k).is_none() {
            continue;
        }
        let hex_y = map.hex_top_y(k, y_offset);
        let (cx, cz) = world(k);
        let verts = hex_vertices(cx, hex_y, cz, HEX_R);
        for (i, &(dq, dr)) in HEX_DIRS.iter().enumerate() {
            if keys.has((k.0 + dq, k.1 + dr)) {
                continue;
            }
            let va = verts[(i + 1) % 6];
            let vb = verts[(i + 2) % 6];
            let (nx, nz) = edge_outward_normal(cx, cz, va.x, va.z, vb.x, vb.z);
            let (ax0, az0, bx0, bz0) = (va.x, va.z, vb.x, vb.z);
            let ax1 = ax0 + nx * band_width;
            let az1 = az0 + nz * band_width;
            let bx1 = bx0 + nx * band_width;
            let bz1 = bz0 + nz * band_width;
            let y = hex_y + 0.004;
            positions.extend_from_slice(&[ax0, y, az0, bx0, y, bz0, bx1, y, bz1, ax1, y, az1]);
            indices.extend_from_slice(&[vi, vi + 1, vi + 2, vi, vi + 2, vi + 3]);
            vi += 4;
        }
    }
    if positions.is_empty() {
        return None;
    }
    let mut o = OverlayObject::new(
        OverlayKind::Mesh,
        basic(color, opacity, true),
        indexed_mesh(&positions, indices),
    );
    o.render_order = 6;
    Some(o)
}

/// `makeReliefHeightFn(sampler)` (`:280-293`): memoised by
/// `` `${x.toFixed(4)},${z.toFixed(4)}` `` — the first value computed for a
/// key is returned for every later point with the same key.
struct ReliefHeight<'a> {
    sampler: Option<ReliefFn<'a>>,
    cache: HashMap<String, f64>,
}

impl ReliefHeight<'_> {
    fn at(&mut self, x: f64, z: f64) -> f64 {
        let Some(s) = &self.sampler else {
            return 0.0;
        };
        let key = format!("{},{}", js_to_fixed(x, 4), js_to_fixed(z, 4));
        if let Some(&h) = self.cache.get(&key) {
            return h;
        }
        let y = s(x, z);
        self.cache.insert(key, y);
        y
    }
}

type P3 = [f64; 3];

/// `pushDrapeTriangle` (`:296-337`).
fn push_drape_triangle(positions: &mut Vec<f64>, p0: P3, p1: P3, p2: P3, lift: f64) {
    let ux = p1[0] - p0[0];
    let uy = p1[1] - p0[1];
    let uz = p1[2] - p0[2];
    let vx = p2[0] - p0[0];
    let vy = p2[1] - p0[1];
    let vz = p2[2] - p0[2];
    let mut nx = uy * vz - uz * vy;
    let mut ny = uz * vx - ux * vz;
    let mut nz = ux * vy - uy * vx;
    let len = js_hypot_n(&[nx, ny, nz]);
    if len > 1e-9 {
        nx /= len;
        ny /= len;
        nz /= len;
        if ny < 0.0 {
            nx = -nx;
            ny = -ny;
            nz = -nz;
        }
    } else {
        nx = 0.0;
        ny = 1.0;
        nz = 0.0;
    }
    let dx = nx * lift;
    let dy = ny * lift;
    let dz = nz * lift;
    positions.extend_from_slice(&[
        p0[0] + dx,
        p0[1] + dy,
        p0[2] + dz,
        p1[0] + dx,
        p1[1] + dy,
        p1[2] + dz,
        p2[0] + dx,
        p2[1] + dy,
        p2[2] + dz,
    ]);
}

/// `appendSectorDrape` (`:345-368`). Grid points are evaluated in the web's
/// argument order (the height cache makes the order observable).
#[allow(clippy::too_many_arguments)]
fn append_sector_drape(
    positions: &mut Vec<f64>,
    cx: f64,
    base_y: f64,
    cz: f64,
    a: (f64, f64),
    b: (f64, f64),
    height: &mut ReliefHeight<'_>,
) {
    let n = HUG_RELIEF_SUBDIVISIONS;
    let nf = f64::from(n);
    let mut at = |i: u32, j: u32| -> P3 {
        let (fi, fj) = (f64::from(i), f64::from(j));
        let lx = (a.0 * fi + b.0 * fj) / nf;
        let lz = (a.1 * fi + b.1 * fj) / nf;
        [cx + lx, base_y + height.at(lx, lz), cz + lz]
    };
    for i in 0..n {
        let mut j = 0;
        while i + j < n {
            let p0 = at(i, j);
            let p1 = at(i + 1, j);
            let p2 = at(i, j + 1);
            push_drape_triangle(positions, p0, p1, p2, HUG_RELIEF_SURFACE_LIFT);
            if i + j < n - 1 {
                let q0 = at(i + 1, j);
                let q1 = at(i + 1, j + 1);
                let q2 = at(i, j + 1);
                push_drape_triangle(positions, q0, q1, q2, HUG_RELIEF_SURFACE_LIFT);
            }
            j += 1;
        }
    }
}

/// `buildReliefDrapeMesh` (`:383-436`).
fn build_relief_drape_mesh(
    map: &OverlayMap,
    keys: &HexKeySet,
    color: u32,
    opacity: f64,
    y_offset: f64,
    relief: &dyn ReliefSource,
) -> Option<OverlayObject> {
    let mut positions: Vec<f64> = Vec::new();
    let mut draped: Vec<HexKey> = Vec::new();
    let corners: Vec<(f64, f64)> = hex_vertices(0.0, 0.0, 0.0, HEX_R * HUG_RELIEF_RADIUS_FRAC)
        .iter()
        .map(|v| (v.x, v.z))
        .collect();
    for k in keys.iter() {
        let Some(teren) = map.terrain(k) else {
            continue;
        };
        let base_y = map.hex_top_y(k, y_offset);
        let (cx, cz) = world(k);
        let mut height = ReliefHeight {
            sampler: relief.sampler(teren, k.0, k.1, map.seed.unwrap_or(0.0), HEX_R),
            cache: HashMap::new(),
        };
        for i in 0..6 {
            append_sector_drape(
                &mut positions,
                cx,
                base_y,
                cz,
                corners[i],
                corners[(i + 1) % 6],
                &mut height,
            );
        }
        draped.push(k);
    }
    if positions.is_empty() {
        return None;
    }
    let mut geo = buffer_geometry(&positions, None);
    geo.compute_vertex_normals();
    let mut mat = basic(color, opacity, true);
    mat.polygon_offset = Some((-2.0, -2.0));
    let mut o = OverlayObject::new(OverlayKind::Mesh, mat, geo);
    o.name = "range-overlay-relief-drape".to_owned();
    o.render_order = HUG_RELIEF_TINT_ORDER;
    o.drape = Some(DrapeInfo {
        hex_keys: draped,
        triangles: len_u32(positions.len() / 9),
        subdivisions: HUG_RELIEF_SUBDIVISIONS,
    });
    Some(o)
}

/// `segmentOutwardNormal` (`:565-575`).
fn segment_outward_normal(ax: f64, az: f64, bx: f64, bz: f64) -> (f64, f64) {
    let dx = bx - ax;
    let dz = bz - az;
    let len = js_hypot(dx, dz);
    let len = if len == 0.0 { 1.0 } else { len };
    (-dz / len, dx / len)
}

/// `distanceToBoundary` (`:578-597`).
fn distance_to_boundary(px: f64, pz: f64, loops: &[Vec<LoopPoint>]) -> f64 {
    let mut best = f64::INFINITY;
    for lp in loops {
        let n = lp.len();
        for i in 0..n {
            let a = lp[i];
            let b = lp[(i + 1) % n];
            let dx = b.x - a.x;
            let dz = b.z - a.z;
            let l2 = dx * dx + dz * dz;
            let t = if l2 > 0.0 {
                ((px - a.x) * dx + (pz - a.z) * dz) / l2
            } else {
                0.0
            };
            // `t < 0 ? 0 : t > 1 ? 1 : t` — `clamp` gives the same result
            // for NaN (stays NaN) and for -0 (stays -0).
            let t = t.clamp(0.0, 1.0);
            let ex = px - (a.x + dx * t);
            let ez = pz - (a.z + dz * t);
            let d2 = ex * ex + ez * ez;
            if d2 < best {
                best = d2;
            }
        }
    }
    best.sqrt()
}

/// `insetBorderLoop` (`:612-677`).
fn inset_border_loop(lp: &[LoopPoint], inset: f64, all: &[Vec<LoopPoint>]) -> Vec<LoopPoint> {
    if inset == 0.0 {
        return lp.to_vec();
    }
    const EPS: f64 = 1e-4;
    const STEPS: u32 = 24;
    let n = lp.len();
    let mut out = Vec::with_capacity(n);
    for i in 0..n {
        let prev = lp[(i + n - 1) % n];
        let cur = lp[i];
        let next = lp[(i + 1) % n];
        let a = segment_outward_normal(prev.x, prev.z, cur.x, cur.z);
        let b = segment_outward_normal(cur.x, cur.z, next.x, next.z);
        let denom = js_max(1.0 + (a.0 * b.0 + a.1 * b.1), 0.5);
        let bx = -(a.0 + b.0) / denom;
        let bz = -(a.1 + b.1) / denom;
        let mut k = inset;
        if distance_to_boundary(cur.x + bx * k, cur.z + bz * k, all) < inset - EPS {
            let mut best_t = 0.0;
            let mut best_d = f64::NEG_INFINITY;
            let mut keep_t = -1.0;
            for s in 1..=STEPS {
                let t = (inset * f64::from(s)) / f64::from(STEPS);
                let d = distance_to_boundary(cur.x + bx * t, cur.z + bz * t, all);
                if d > best_d {
                    best_d = d;
                    best_t = t;
                }
                if d >= inset - EPS {
                    keep_t = t;
                }
            }
            if keep_t >= 0.0 {
                let mut lo = keep_t;
                let mut hi = js_min(keep_t + inset / f64::from(STEPS), inset);
                for _ in 0..12 {
                    let mid = (lo + hi) / 2.0;
                    if distance_to_boundary(cur.x + bx * mid, cur.z + bz * mid, all) >= inset - EPS
                    {
                        lo = mid;
                    } else {
                        hi = mid;
                    }
                }
                k = lo;
            } else {
                k = best_t;
            }
        }
        out.push(LoopPoint {
            x: cur.x + bx * k,
            z: cur.z + bz * k,
        });
    }
    out
}

/// `appendBandBetweenLoops` (`:699-726`).
fn append_band_between_loops(
    outer: &[LoopPoint],
    inner: &[LoopPoint],
    y: f64,
    positions: &mut Vec<f64>,
    indices: &mut Vec<u32>,
    vi: &mut u32,
) {
    let n = outer.len();
    if n < 3 || inner.len() != n {
        return;
    }
    for i in 0..n {
        let j = (i + 1) % n;
        let (a0, a1, b1, b0) = (outer[i], outer[j], inner[j], inner[i]);
        positions.extend_from_slice(&[a0.x, y, a0.z, a1.x, y, a1.z, b1.x, y, b1.z, b0.x, y, b0.z]);
        let v = *vi;
        indices.extend_from_slice(&[v, v + 1, v + 2, v, v + 2, v + 3]);
        *vi += 4;
    }
}

/// `buildTerritoryBorderMesh` (`:732-792`).
#[allow(clippy::too_many_arguments)]
fn build_territory_border_mesh(
    map: &OverlayMap,
    keys: &HexKeySet,
    color: u32,
    band_width: f64,
    flat_y: f64,
    opacity: f64,
    inset: f64,
    y_bump: f64,
) -> Option<OverlayObject> {
    if band_width <= 0.0 {
        return None;
    }
    let y = flat_y + y_bump;
    let center = |q: i32, r: i32| map.terrain((q, r)).map(|_| world((q, r)));
    let loops = compute_territory_border_loops(keys, &center);
    if loops.is_empty() {
        return None;
    }
    let mut positions = Vec::new();
    let mut indices = Vec::new();
    let mut vi = 0u32;
    for lp in &loops {
        let outer = inset_border_loop(lp, inset - band_width, &loops);
        let inner = inset_border_loop(lp, inset, &loops);
        append_band_between_loops(&outer, &inner, y, &mut positions, &mut indices, &mut vi);
    }
    if positions.is_empty() {
        return None;
    }
    let mut o = OverlayObject::new(
        OverlayKind::Mesh,
        basic(color, opacity, true),
        indexed_mesh(&positions, indices),
    );
    o.render_order = 6;
    Some(o)
}

/// Optional parameters of [`build_territory_border_group`] (`undefined` →
/// web default).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct TerritoryBorderParams {
    /// `bandWidth` (default [`TERRITORY_BORDER_BAND_WIDTH`]).
    pub band_width: Option<f64>,
    /// `opacity` (default [`TERRITORY_BORDER_OPACITY`]).
    pub opacity: Option<f64>,
    /// `relationBandWidth` (default `bandWidth / 2`).
    pub relation_band_width: Option<f64>,
}

/// `buildTerritoryBorderGroup(map, hexKeysByOwner, colorFn, bandWidth,
/// opacity, relationColorFn?, relationBandWidth)` (`:810-857`).
/// `by_owner` is the `Map` in insertion order.
pub fn build_territory_border_group(
    map: &OverlayMap,
    by_owner: &[(i64, HexKeySet)],
    color_fn: &dyn Fn(i64) -> u32,
    params: TerritoryBorderParams,
    relation_color_fn: Option<&dyn Fn(i64) -> u32>,
) -> OverlayGroup {
    let band_width = params.band_width.unwrap_or(TERRITORY_BORDER_BAND_WIDTH);
    let opacity = params.opacity.unwrap_or(TERRITORY_BORDER_OPACITY);
    let relation_band_width = params.relation_band_width.unwrap_or(band_width / 2.0);
    let mut group = OverlayGroup {
        name: "territory-border-overlay".to_owned(),
        objects: Vec::new(),
    };
    let flat_y = terrain_surface_top_y(
        Terrain::Laka,
        GAME_MAP_RENDER_STYLE,
        TERRITORY_BORDER_Y_OFFSET + 0.008,
    );
    for (owner, keys) in by_owner {
        if keys.is_empty() {
            continue;
        }
        if let Some(mut b) = build_territory_border_mesh(
            map,
            keys,
            color_fn(*owner),
            band_width,
            flat_y,
            opacity,
            band_width,
            TERRITORY_BORDER_Y_BUMP,
        ) {
            b.name = format!("territory-border-{owner}");
            group.objects.push(b);
        }
        let Some(rel) = relation_color_fn else {
            continue;
        };
        if let Some(mut r) = build_territory_border_mesh(
            map,
            keys,
            rel(*owner),
            relation_band_width,
            flat_y,
            opacity,
            band_width + relation_band_width,
            TERRITORY_RELATION_Y_BUMP,
        ) {
            r.name = format!("territory-relation-{owner}");
            group.objects.push(r);
        }
    }
    group
}

/// `buildRangeOverlayGroup(map, hexKeys, style)` (`:860-895`).
pub fn build_range_overlay_group(
    map: &OverlayMap,
    keys: &HexKeySet,
    style: &RangeOverlayStyle,
    relief: &dyn ReliefSource,
) -> OverlayGroup {
    let mut group = OverlayGroup {
        name: "range-overlay".to_owned(),
        objects: Vec::new(),
    };
    let y_off = style.y_offset.unwrap_or(0.05);
    let flat_border_y = terrain_surface_top_y(Terrain::Laka, GAME_MAP_RENDER_STYLE, y_off + 0.008);
    let hug = style.hug_terrain_relief;
    let tint = if hug {
        build_relief_drape_mesh(
            map,
            keys,
            style.tint_color,
            style.tint_opacity,
            y_off,
            relief,
        )
    } else {
        build_tint_mesh(map, keys, style.tint_color, style.tint_opacity, y_off)
    };
    if let Some(t) = tint {
        group.objects.push(t);
    }
    let band_w = style.border_band_width.unwrap_or(0.0);
    if band_w > 0.0 {
        if let Some(mut band) = build_border_band_mesh(
            map,
            keys,
            style.border_color,
            style.border_opacity,
            y_off + 0.006,
            band_w,
        ) {
            if hug {
                band.render_order = HUG_RELIEF_BORDER_ORDER;
            }
            group.objects.push(band);
        }
    } else if let Some(mut border) = build_border_line(
        map,
        keys,
        style.border_color,
        style.border_opacity,
        y_off + 0.008,
        if hug { None } else { Some(flat_border_y) },
        hug,
    ) {
        if hug {
            border.render_order = HUG_RELIEF_BORDER_ORDER;
        }
        group.objects.push(border);
    }
    group
}
