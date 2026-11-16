//! River mouths: the short ribbon from the last land hex into the first
//! `PlytkieMorze` hex, with the "waterfall" step and the estuary funnel at a
//! delta (pin `07d2fbd72`, `gra/src/render/scene.ts`):
//!
//! - `buildCoastalRiverPointChain` (`:626-696`);
//! - `applyCoastalWaterfall` (`:734-771`);
//! - `buildEstuaryFunnelGeometry` (`:774-798`);
//! - `renderCoastalRiverExtension` (`:801-887`);
//! - the mouth loop of `buildScene` (`:2918-2992`).
//!
//! The mouth works on the **source** path (`riverPaths[pi]`), not on the
//! render path (`scene.ts:2946-2967`).

use std::collections::HashSet;

use crate::geom::{Mesh, Vec3};
use crate::jsmath::js_hypot;
use crate::pick::hex::HexCoord;
use crate::terrain::coast::TerrainAt;

use super::edges::{hex_center, shared_edge_midpoint, HEX_NEIGHBORS};
use super::land::{flush_river_bucket, queue_river_geo, river_hex_surface_y, RiverGeoBucket};
use super::ribbon::{build_ribbon_geometry, HalfWidth};
use super::{
    hex_key, RiverEntry, RiverMaterialKind, COAST_DELTA_RENDER_ORDER, RIVER_MOUTH_RENDER_ORDER,
};

/// `COAST_OFFSET = R * 0.14` of `buildCoastalRiverPointChain` (`scene.ts:636`).
pub const COAST_OFFSET_FRAC: f64 = 0.14;
/// `tIn` (`scene.ts:685`): how far the mouth enters the first coast hex.
pub const MOUTH_T_IN: f64 = 0.4;

fn js_or_one(x: f64) -> f64 {
    if x == 0.0 || x.is_nan() {
        1.0
    } else {
        x
    }
}

/// Result of [`build_coastal_river_point_chain`].
#[derive(Clone, Debug, PartialEq)]
pub struct CoastalChain {
    /// Mouth polyline after [`apply_coastal_waterfall`].
    pub pts: Vec<Vec3>,
    /// Last land hex and first water hex (empty when there is no mouth).
    pub hexes: Vec<HexCoord>,
}

/// `buildCoastalRiverPointChain(map, path, R, riverMouthY)` (`scene.ts:626-696`):
/// centre of the last land hex (land height, offset `R * 0.14`) → midpoint
/// of the land|water edge (land height) → `tIn = 0.4` into the first water
/// hex (mouth level), then [`apply_coastal_waterfall`]. When the path has
/// no water hex, the water hex is the first non-dry neighbour of the last
/// hex in [`HEX_NEIGHBORS`] order.
#[must_use]
pub fn build_coastal_river_point_chain(
    map: &TerrainAt,
    path: &[HexCoord],
    radius: f64,
    river_mouth_y: f64,
) -> CoastalChain {
    let empty = CoastalChain {
        pts: Vec::new(),
        hexes: Vec::new(),
    };
    let Some(&last) = path.last() else {
        return empty;
    };
    let coast_offset = radius * COAST_OFFSET_FRAC;
    let is_water = |h: HexCoord| map.get(&h).is_some_and(|t| !t.is_dry_land());
    let mut land_hex: Option<HexCoord> = None;
    let mut coast_hex: Option<HexCoord> = None;
    for (i, &h) in path.iter().enumerate() {
        if is_water(h) {
            coast_hex = Some(h);
            if i > 0 {
                land_hex = Some(path[i - 1]);
            }
            break;
        }
    }
    if coast_hex.is_none() {
        land_hex = Some(last);
        coast_hex = HEX_NEIGHBORS
            .iter()
            .map(|&(dq, dr)| HexCoord::new(last.q + dq, last.r + dr))
            .find(|&n| is_water(n));
    }
    let (Some(land), Some(coast)) = (land_hex, coast_hex) else {
        return empty;
    };

    let mut pts = Vec::with_capacity(5);
    let land_center = hex_center(land, radius);
    let land_y =
        river_hex_surface_y(map, land, river_mouth_y, coast_offset).unwrap_or(river_mouth_y);
    pts.push(Vec3::new(land_center.x, land_y, land_center.z));
    let edge_mid = shared_edge_midpoint(land, coast, radius);
    if let Some(e) = edge_mid {
        pts.push(Vec3::new(e.x, land_y, e.z));
    }
    let coast_center = hex_center(coast, radius);
    let (base_x, base_z) = edge_mid.map_or((land_center.x, land_center.z), |e| (e.x, e.z));
    let in_x = base_x + (coast_center.x - base_x) * MOUTH_T_IN;
    let in_z = base_z + (coast_center.z - base_z) * MOUTH_T_IN;
    pts.push(Vec3::new(in_x, river_mouth_y, in_z));
    CoastalChain {
        pts: apply_coastal_waterfall(&pts, river_mouth_y, land_y, radius),
        hexes: vec![land, coast],
    }
}

/// `applyCoastalWaterfall(pts, mouthY, landPlateauY, R)` (`scene.ts:734-771`):
/// land points flat at the plateau, then a near-vertical drop (two points
/// `R * 0.06` apart in XZ) to the mouth level, then flat at the mouth level.
#[must_use]
pub fn apply_coastal_waterfall(
    pts: &[Vec3],
    mouth_y: f64,
    land_plateau_y: f64,
    radius: f64,
) -> Vec<Vec3> {
    // `!(landPlateauY > mouthY + 1e-4)`: also true when either side is NaN.
    let plateau_above =
        land_plateau_y.partial_cmp(&(mouth_y + 1e-4)) == Some(std::cmp::Ordering::Greater);
    if pts.len() < 2 || !plateau_above {
        return pts.to_vec();
    }
    let sea_threshold = mouth_y + (land_plateau_y - mouth_y) * 0.5;
    let k = pts
        .iter()
        .position(|p| p.y < sea_threshold)
        .unwrap_or(pts.len());
    if k == 0 {
        return pts.iter().map(|p| Vec3::new(p.x, mouth_y, p.z)).collect();
    }
    if k >= pts.len() {
        return pts
            .iter()
            .map(|p| Vec3::new(p.x, land_plateau_y, p.z))
            .collect();
    }
    let mut out: Vec<Vec3> = pts[..k]
        .iter()
        .map(|p| Vec3::new(p.x, land_plateau_y, p.z))
        .collect();
    let edge = pts[k - 1];
    let sea = pts[k];
    let dx = sea.x - edge.x;
    let dz = sea.z - edge.z;
    let len = js_or_one(js_hypot(dx, dz));
    let nudge = radius * 0.06;
    let lip_x = edge.x + (dx / len) * nudge;
    let lip_z = edge.z + (dz / len) * nudge;
    out.push(Vec3::new(lip_x, land_plateau_y, lip_z));
    out.push(Vec3::new(
        lip_x + (dx / len) * nudge,
        mouth_y,
        lip_z + (dz / len) * nudge,
    ));
    out.extend(pts[k..].iter().map(|p| Vec3::new(p.x, mouth_y, p.z)));
    out
}

#[allow(clippy::cast_possible_truncation)]
fn f32_of(v: f64) -> f32 {
    v as f32
}

/// `buildEstuaryFunnelGeometry(apex, seaPt, halfWidthNarrow, halfWidthWide)`
/// (`scene.ts:774-798`): a flat trapezoid at `apex.y`, index
/// `[0, 1, 2, 1, 3, 2]`, `computeVertexNormals()`, no UVs.
#[must_use]
pub fn build_estuary_funnel_geometry(
    apex: Vec3,
    sea_pt: Vec3,
    half_narrow: f64,
    half_wide: f64,
) -> Mesh {
    let dx = sea_pt.x - apex.x;
    let dz = sea_pt.z - apex.z;
    let len = js_or_one(js_hypot(dx, dz));
    let px = -dz / len;
    let pz = dx / len;
    let y = apex.y;
    let positions = [
        apex.x + px * half_narrow,
        y,
        apex.z + pz * half_narrow,
        apex.x - px * half_narrow,
        y,
        apex.z - pz * half_narrow,
        sea_pt.x + px * half_wide,
        y,
        sea_pt.z + pz * half_wide,
        sea_pt.x - px * half_wide,
        y,
        sea_pt.z - pz * half_wide,
    ];
    let mut mesh = Mesh {
        positions: positions.iter().map(|&v| f32_of(v)).collect(),
        indices: Some(vec![0, 1, 2, 1, 3, 2]),
        ..Mesh::default()
    };
    mesh.compute_vertex_normals();
    mesh
}

/// Per-point half widths of a mouth ribbon (`scene.ts:840-843, 855-858,
/// 865-868`): `halfWidth * (1.08 + t * 2.65)`, `t = i / (segCount - 1)`
/// (`1` when `segCount <= 1`), for `i` in `range`.
fn mouth_widths(half_width: f64, seg_count: usize, range: std::ops::Range<usize>) -> Vec<f64> {
    range
        .map(|i| half_width * (1.08 + mouth_t(seg_count, i) * 2.65))
        .collect()
}

/// `t = segCount <= 1 ? 1 : i / (segCount - 1)` (`scene.ts:841, 849, 856, 866`).
fn mouth_t(seg_count: usize, i: usize) -> f64 {
    // Indices and counts are small (a mouth has ≤ 6 points): exact in f64.
    #[allow(clippy::cast_precision_loss)]
    if seg_count <= 1 {
        1.0
    } else {
        i as f64 / (seg_count - 1) as f64
    }
}

/// The three buckets of one mouth (`scene.ts:2923-2929, 2954-2962`).
#[derive(Clone, Debug, PartialEq)]
pub struct MouthBuckets {
    /// `riverWaterBucket` (water, render order 58).
    pub water: RiverGeoBucket,
    /// `riverDeltaTopBucket` (coast-delta colour, render order 58).
    pub delta_top: RiverGeoBucket,
    /// `coastFunnelBucket` (coast-delta colour, render order 50).
    pub funnel: RiverGeoBucket,
}

impl MouthBuckets {
    /// Fresh buckets with the web materials and render orders.
    #[must_use]
    pub fn new() -> Self {
        Self {
            water: RiverGeoBucket::new(RiverMaterialKind::Water, RIVER_MOUTH_RENDER_ORDER),
            delta_top: RiverGeoBucket::new(RiverMaterialKind::CoastDelta, RIVER_MOUTH_RENDER_ORDER),
            funnel: RiverGeoBucket::new(RiverMaterialKind::CoastDelta, COAST_DELTA_RENDER_ORDER),
        }
    }

    /// Flush order of `scene.ts:2968-2970` / `:2988-2990`: funnel, water, delta top.
    pub fn flush_into(&self, entries: &mut Vec<RiverEntry>) {
        for b in [&self.funnel, &self.water, &self.delta_top] {
            if let Some(e) = flush_river_bucket(b, None) {
                entries.push(e);
            }
        }
    }
}

impl Default for MouthBuckets {
    fn default() -> Self {
        Self::new()
    }
}

/// `renderCoastalRiverExtension(map, path, R, riverMouthY, …, halfWidth,
/// deltaKeys, _, dedupMinDist)` (`scene.ts:801-887`). `ribbonSegs` only feeds
/// the unused CatmullRom branch and has no counterpart.
#[allow(clippy::too_many_arguments)]
pub fn render_coastal_river_extension(
    map: &TerrainAt,
    path: &[HexCoord],
    radius: f64,
    river_mouth_y: f64,
    buckets: &mut MouthBuckets,
    half_width: f64,
    delta_keys: &HashSet<HexCoord>,
    dedup_min_dist: Option<f64>,
) {
    let chain = build_coastal_river_point_chain(map, path, radius, river_mouth_y);
    if chain.pts.len() < 2 {
        return;
    }
    let dedup = dedup_min_dist.unwrap_or(radius * 0.02);
    let mut pts: Vec<Vec3> = Vec::with_capacity(chain.pts.len());
    for &p in &chain.pts {
        if pts.last().is_none_or(|l| l.distance_to(p) > dedup) {
            pts.push(p);
        }
    }
    if pts.len() < 2 {
        return;
    }
    let keys: Vec<String> = chain.hexes.iter().map(|&h| hex_key(h)).collect();
    let key_refs = || keys.iter().map(String::as_str);
    let touches_delta = chain.hexes.iter().any(|h| delta_keys.contains(h));
    let seg_count = pts.len() - 1;

    if touches_delta {
        // scene.ts:847-873: water up to t >= 0.12, coast-delta colour after it.
        let delta_start = (0..seg_count)
            .find(|&i| mouth_t(seg_count, i) >= 0.12)
            .unwrap_or(pts.len());
        if delta_start > 0 {
            let pre = &pts[..(delta_start + 1).min(pts.len())];
            let widths = mouth_widths(half_width, seg_count, 0..pre.len());
            let geo = build_ribbon_geometry(pre, HalfWidth::PerPoint(&widths));
            queue_river_geo(&mut buckets.water, geo, key_refs());
        }
        let post = &pts[delta_start.min(pts.len())..];
        if post.len() >= 2 {
            let widths = mouth_widths(half_width, seg_count, delta_start..pts.len());
            let geo = build_ribbon_geometry(post, HalfWidth::PerPoint(&widths));
            queue_river_geo(&mut buckets.delta_top, geo, key_refs());
        }
    } else {
        // scene.ts:838-846: the whole mouth in the water colour (BUG-RZEKI-RENDER-B1).
        let widths = mouth_widths(half_width, seg_count, 0..pts.len());
        let geo = build_ribbon_geometry(&pts, HalfWidth::PerPoint(&widths));
        queue_river_geo(&mut buckets.water, geo, key_refs());
    }

    if pts.len() >= 3 && touches_delta {
        let apex = pts[pts.len() - 3];
        let sea_pt = pts[pts.len() - 1];
        if apex.distance_to(sea_pt) <= radius * 3.5 {
            let geo =
                build_estuary_funnel_geometry(apex, sea_pt, half_width * 1.35, half_width * 3.4);
            queue_river_geo(&mut buckets.funnel, geo, key_refs());
        }
    }
}
