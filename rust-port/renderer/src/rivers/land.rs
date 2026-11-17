//! Land ribbons: one continuous ribbon per river render path, along the
//! inner side of the hex walls (pin `07d2fbd72`, `gra/src/render/scene.ts`).
//!
//! - `riverHexSurfaceY` (`:937-954`), `pathReachesOpenSeaRender` (`:604-612`);
//! - `buildRiverPointsFromHexPath` (`:1124-1233`);
//! - `decimateRiverRibbonPoints` (`:1240-1261`);
//! - `renderLandRiversFromPaths` (`:1267-1375`), `queueRiverGeo` (`:1377-1384`),
//!   `flushRiverBucket` (`:1386-1422`), `pushRiverMesh` (`:1424-1441`).
//!
//! The render path of each river is **input** (`MapViewDto.river_render_paths`,
//! computed by the engine with `land/medium/trimMediumRenderPathAtMain`,
//! `scene.ts:1306-1318`, decision D-DTO-1 = A). Everything after it — the
//! length filters, the width class, the wall walk, the batching — is render
//! code and lives here. Frame yielding (`c3NextFrame`, `onSlice`) is
//! scheduling only and has no counterpart.

use crate::decor::river_lod::KeySet;
use crate::geom::{merge_geometries, Mesh, Vec3};
use crate::pick::hex::HexCoord;
use crate::pick::terrain::Terrain;
use crate::terrain::coast::TerrainAt;
use crate::terrain::RiverKind;

use super::edges::{
    hex_center, neighbor_dir_index, river_transit_corners_on_hex, shared_edge_midpoint,
    simplify_river_render_path, Xz, HEX_NEIGHBORS, RIVER_INSET_FRAC,
};
use super::ribbon::{build_ribbon_geometry, HalfWidth};
use super::{hex_key, RiverEntry, RiverMaterialKind};
use crate::core::map_style::FLAT_LAND_SURFACE_Y;

/// `RIVER_RIBBON_MAX_PTS` (`scene.ts:1468`).
pub const RIVER_RIBBON_MAX_PTS: usize = 6000;
/// `RIVER_BATCH_PATHS` (`scene.ts:1470`): non-main ribbons merged per mesh.
pub const RIVER_BATCH_PATHS: usize = 32;
/// Longest source path that is rendered (`scene.ts:1311`).
pub const RIVER_SOURCE_PATH_MAX: usize = 512;
/// Longest render path that is rendered (`scene.ts:1320`).
pub const RIVER_RENDER_PATH_MAX: usize = 480;

fn terrain_at(map: &TerrainAt, h: HexCoord) -> Option<Terrain> {
    map.get(&h).copied()
}

/// `riverHexSurfaceY(map, q, r, style, riverMouthY, surfaceOffset, R)`
/// (`scene.ts:937-954`): `None` for a missing hex or `Morze`, the mouth level
/// on `PlytkieMorze`, otherwise the flat land level plus the offset (every
/// land type, hills and mountains included — owner 2026-08-01, `:950-953`).
#[must_use]
pub fn river_hex_surface_y(
    map: &TerrainAt,
    h: HexCoord,
    river_mouth_y: f64,
    surface_offset: f64,
) -> Option<f64> {
    match terrain_at(map, h)? {
        Terrain::Morze => None,
        Terrain::PlytkieMorze => Some(river_mouth_y),
        _ => Some(FLAT_LAND_SURFACE_Y + surface_offset),
    }
}

fn has_neighbor_of(map: &TerrainAt, h: HexCoord, t: Terrain) -> bool {
    HEX_NEIGHBORS
        .iter()
        .any(|&(dq, dr)| terrain_at(map, HexCoord::new(h.q + dq, h.r + dr)) == Some(t))
}

/// `pathReachesOpenSeaRender(map, path)` (`scene.ts:604-612`): the last hex
/// is water, or dry land touching `PlytkieMorze` or `Morze`.
#[must_use]
pub fn path_reaches_open_sea_render(map: &TerrainAt, path: &[HexCoord]) -> bool {
    let Some(&last) = path.last() else {
        return false;
    };
    let Some(t) = terrain_at(map, last) else {
        return false;
    };
    if !t.is_dry_land() {
        return true;
    }
    has_neighbor_of(map, last, Terrain::PlytkieMorze) || has_neighbor_of(map, last, Terrain::Morze)
}

/// Result of [`build_river_points_from_hex_path`]: the polyline, the hex of
/// every point (`pointHex`, 1:1 with `pts`) and the keys of every hex of the
/// original path (`hexKeys`, for the fog). The web also returns a width
/// multiplier per point; no caller passes `widthAtHex`, so it is always `1`
/// and not kept.
#[derive(Clone, Debug, PartialEq)]
pub struct RiverPoints {
    /// Ribbon points.
    pub pts: Vec<Vec3>,
    /// `"q,r"` of the hex each point belongs to.
    pub point_hex: Vec<String>,
    /// `"q,r"` of every hex of the input path, in path order.
    pub hex_keys: KeySet,
}

/// `buildRiverPointsFromHexPath(map, path, R, style, riverMouthY,
/// surfaceOffset, _, extendToCenter)` (`scene.ts:1124-1233`).
///
/// After [`simplify_river_render_path`]: the midpoint of the first shared
/// edge (inset towards hex 1), the wall corners of every middle hex (inset
/// towards that hex), the midpoint of the last shared edge (inset towards
/// the last hex) and, with `extend_to_center`, the centre of the last hex.
/// A point closer than `R * 0.004` to the previous one is dropped.
#[must_use]
pub fn build_river_points_from_hex_path(
    map: &TerrainAt,
    path: &[HexCoord],
    radius: f64,
    river_mouth_y: f64,
    surface_offset: f64,
    extend_to_center: bool,
) -> RiverPoints {
    let mut out = RiverPoints {
        pts: Vec::new(),
        point_hex: Vec::new(),
        hex_keys: KeySet::default(),
    };
    if path.len() < 2 {
        return out;
    }
    for &h in path {
        out.hex_keys.add(&hex_key(h));
    }
    let y_at = |h: HexCoord| river_hex_surface_y(map, h, river_mouth_y, surface_offset);
    let rp = simplify_river_render_path(path);
    if rp.len() < 2 {
        return out;
    }
    let inset_toward = |p: Xz, h: HexCoord| {
        let c = hex_center(h, radius);
        Xz {
            x: p.x + (c.x - p.x) * RIVER_INSET_FRAC,
            z: p.z + (c.z - p.z) * RIVER_INSET_FRAC,
        }
    };
    let dedup = radius * 0.004;
    let mut push_pt = |x: f64, z: f64, y: f64, h: HexCoord| {
        let p = Vec3::new(x, y, z);
        if out
            .pts
            .last()
            .is_none_or(|last| last.distance_to(p) > dedup)
        {
            out.pts.push(p);
            out.point_hex.push(hex_key(h));
        }
    };

    // Start (scene.ts:1172-1184).
    let (a, b) = (rp[0], rp[1]);
    if let (Some(mid0), Some(ya), Some(yb)) = (shared_edge_midpoint(a, b, radius), y_at(a), y_at(b))
    {
        let p0 = inset_toward(mid0, b);
        push_pt(p0.x, p0.z, (ya + yb) * 0.5, b);
    }

    // Middle hexes: wall corners only (scene.ts:1186-1208).
    for i in 1..rp.len() - 1 {
        let (prev, cur, next) = (rp[i - 1], rp[i], rp[i + 1]);
        if neighbor_dir_index(prev, cur).is_none() || neighbor_dir_index(cur, next).is_none() {
            continue;
        }
        let Some(yc) = y_at(cur) else {
            continue;
        };
        for corner in river_transit_corners_on_hex(cur, prev, next, radius) {
            let pc = inset_toward(corner, cur);
            push_pt(pc.x, pc.z, yc, cur);
        }
    }

    // End (scene.ts:1210-1230).
    let pen = rp[rp.len() - 2];
    let last = rp[rp.len() - 1];
    let y_last = y_at(last);
    if let (Some(mid_end), Some(y_pen), Some(yl)) =
        (shared_edge_midpoint(pen, last, radius), y_at(pen), y_last)
    {
        let p_end = inset_toward(mid_end, last);
        push_pt(p_end.x, p_end.z, (y_pen + yl) * 0.5, last);
    }
    if extend_to_center {
        if let Some(yl) = y_last {
            let cl = hex_center(last, radius);
            push_pt(cl.x, cl.z, yl, last);
        }
    }
    out
}

/// `decimateRiverRibbonPoints(pts, pointHex, minDist)` (`scene.ts:1240-1261`):
/// keeps the first point, every middle point at least `min_dist` from the
/// last kept one, and the last point (the web compares the last kept point
/// with the last input point by object identity, `:1256`, which is never
/// true after the loop, so the last point is always appended).
#[must_use]
pub fn decimate_river_ribbon_points(
    pts: &[Vec3],
    point_hex: &[String],
    min_dist: f64,
) -> (Vec<Vec3>, Vec<String>) {
    if pts.len() < 3 || min_dist <= 0.0 {
        return (pts.to_vec(), point_hex.to_vec());
    }
    let hex_or_empty = |i: usize| point_hex.get(i).cloned().unwrap_or_default();
    let mut out = vec![pts[0]];
    let mut out_hex = vec![hex_or_empty(0)];
    for (i, &p) in pts.iter().enumerate().take(pts.len() - 1).skip(1) {
        if out[out.len() - 1].distance_to(p) >= min_dist {
            out.push(p);
            out_hex.push(hex_or_empty(i));
        }
    }
    let last_i = pts.len() - 1;
    out.push(pts[last_i]);
    out_hex.push(hex_or_empty(last_i));
    (out, out_hex)
}

/// `RiverGeoBucket` of `scene.ts:278-291`: geometries queued for one mesh.
#[derive(Clone, Debug, PartialEq)]
pub struct RiverGeoBucket {
    /// `mat`.
    pub material: RiverMaterialKind,
    /// `geos`.
    pub geos: Vec<Mesh>,
    /// `hexKeys`.
    pub hex_keys: KeySet,
    /// `renderOrder`.
    pub render_order: i32,
    /// `segPointHex` (`None` = `undefined`).
    pub seg_point_hex: Option<Vec<Vec<String>>>,
}

impl RiverGeoBucket {
    /// `{ mat, geos: [], hexKeys: new Set(), renderOrder }`.
    #[must_use]
    pub fn new(material: RiverMaterialKind, render_order: i32) -> Self {
        Self {
            material,
            geos: Vec::new(),
            hex_keys: KeySet::default(),
            render_order,
            seg_point_hex: None,
        }
    }
}

/// `queueRiverGeo(bucket, geo, hexKeys)` (`scene.ts:1377-1384`).
pub fn queue_river_geo<'a>(
    bucket: &mut RiverGeoBucket,
    geo: Mesh,
    hex_keys: impl IntoIterator<Item = &'a str>,
) {
    bucket.geos.push(geo);
    for k in hex_keys {
        bucket.hex_keys.add(k);
    }
}

/// `flushRiverBucket(scene, bucket, riverEntries, pointHex)`
/// (`scene.ts:1386-1422`) without `scene.add`: one entry for the bucket
/// (`None` when it is empty or the merge fails, web `mergeGeometries → null`).
/// `point_hex` is kept only for a single geometry; `segPointHex` only when it
/// has one list per geometry.
#[must_use]
pub fn flush_river_bucket(
    bucket: &RiverGeoBucket,
    point_hex: Option<&[String]>,
) -> Option<RiverEntry> {
    let n = bucket.geos.len();
    let geometry = match n {
        0 => return None,
        1 => bucket.geos[0].clone(),
        _ => {
            let refs: Vec<&Mesh> = bucket.geos.iter().collect();
            merge_geometries(&refs, false).ok()?
        }
    };
    Some(RiverEntry {
        geometry,
        material: bucket.material,
        render_order: bucket.render_order,
        hex_keys: bucket.hex_keys.clone(),
        merged: n > 1,
        point_hex: if n == 1 {
            point_hex.map(<[String]>::to_vec)
        } else {
            None
        },
        seg_point_hex: bucket.seg_point_hex.clone().filter(|s| s.len() == n),
    })
}

/// `pushRiverMesh(bucket, pts, hexKeys, halfWidth, _, true, pointHex)`
/// (`scene.ts:1424-1441`).
pub fn push_river_mesh(
    bucket: &mut RiverGeoBucket,
    pts: &[Vec3],
    hex_keys: &KeySet,
    half_width: HalfWidth<'_>,
    point_hex: Option<&[String]>,
) {
    if pts.len() < 2 {
        return;
    }
    let geo = build_ribbon_geometry(pts, half_width);
    queue_river_geo(bucket, geo, hex_keys.iter());
    if let Some(ph) = point_hex {
        if ph.len() == pts.len() {
            bucket
                .seg_point_hex
                .get_or_insert_with(Vec::new)
                .push(ph.to_vec());
        }
    }
}

/// `opts` of `renderLandRiversFromPaths` that change geometry
/// (`scene.ts:1280-1286`; `batchAllPaths`, `ribbonSegments` and
/// `yieldEvery` only change scheduling or the unused CatmullRom branch).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct LandRiverOpts {
    /// `batchSize` (default [`RIVER_BATCH_PATHS`]).
    pub batch_size: usize,
    /// `tributaryDecimateDist` (`None` = `undefined`; `0` and `NaN` are
    /// falsy in the web and also skip the decimation).
    pub tributary_decimate_dist: Option<f64>,
}

impl Default for LandRiverOpts {
    fn default() -> Self {
        Self {
            batch_size: RIVER_BATCH_PATHS,
            tributary_decimate_dist: None,
        }
    }
}

/// One river handed to [`render_land_rivers_from_paths`].
#[derive(Clone, Copy, Debug)]
pub struct LandRiverPath<'a> {
    /// `riverPaths[pi]` (source path; its length filter and the sea test).
    pub source: &'a [HexCoord],
    /// `riverPathKinds[pi]` (`None` = `'main'`).
    pub kind: Option<RiverKind>,
    /// Render path of the DTO (`river_render_paths[pi]`, the web `landPath`).
    pub render: &'a [HexCoord],
}

/// Output of [`render_land_rivers_from_paths`].
#[derive(Clone, Debug, PartialEq)]
pub struct LandRivers {
    /// Entries in `riverEntries.push` order.
    pub entries: Vec<RiverEntry>,
    /// The returned `landHexKeys` set.
    pub land_hex_keys: KeySet,
}

/// Width multiplier of a ribbon (`scene.ts:1323-1330`).
#[must_use]
pub fn river_width_mul(kind: RiverKind, land_len: usize) -> f64 {
    if kind == RiverKind::Main {
        // land_len <= 480: exact in f64.
        #[allow(clippy::cast_precision_loss)]
        let l = land_len as f64;
        (0.85 + l * 0.008).min(1.35)
    } else if land_len < 10 {
        0.4
    } else if land_len < 18 {
        0.55
    } else {
        0.7
    }
}

/// `renderLandRiversFromPaths(map, paths, kinds, R, style, riverMouthY,
/// surfaceOffset, mainHalfWidth, scene, riverEntries, riverMat, renderOrder,
/// _, opts)` (`scene.ts:1267-1375`).
///
/// Main rivers get their own mesh with `pointHex`; the other kinds are merged
/// in batches of `opts.batch_size` (flushed before every main river and at
/// the end) with one `segPointHex` list per ribbon.
// Mirrors the positional parameters of the web function (14 there).
#[allow(clippy::too_many_arguments)]
#[must_use]
pub fn render_land_rivers_from_paths(
    map: &TerrainAt,
    paths: &[LandRiverPath<'_>],
    radius: f64,
    river_mouth_y: f64,
    surface_offset: f64,
    main_half_width: f64,
    render_order: i32,
    opts: LandRiverOpts,
) -> LandRivers {
    let mut out = LandRivers {
        entries: Vec::new(),
        land_hex_keys: KeySet::default(),
    };
    let mut batch: Option<RiverGeoBucket> = None;
    let mut batch_count = 0usize;
    let flush_batch = |batch: &mut Option<RiverGeoBucket>, entries: &mut Vec<RiverEntry>| {
        if let Some(b) = batch.take() {
            if let Some(e) = flush_river_bucket(&b, None) {
                entries.push(e);
            }
        }
    };

    for p in paths {
        let path = p.source;
        if path.len() < 2 || path.len() > RIVER_SOURCE_PATH_MAX {
            continue;
        }
        let kind = p.kind.unwrap_or(RiverKind::Main);
        let land_path = p.render;
        if land_path.len() < 2 || land_path.len() > RIVER_RENDER_PATH_MAX {
            continue;
        }
        let half_width = main_half_width * river_width_mul(kind, land_path.len());
        // scene.ts:1332-1338: terminal edge always; centre of the last hex only at the sea.
        let reaches_sea = path_reaches_open_sea_render(map, path);
        let rp = build_river_points_from_hex_path(
            map,
            land_path,
            radius,
            river_mouth_y,
            surface_offset,
            reaches_sea,
        );
        if rp.pts.len() < 2 || rp.pts.len() > RIVER_RIBBON_MAX_PTS {
            continue;
        }
        if kind == RiverKind::Main {
            flush_batch(&mut batch, &mut out.entries);
            batch_count = 0;
            let mut bucket = RiverGeoBucket::new(RiverMaterialKind::Water, render_order);
            push_river_mesh(
                &mut bucket,
                &rp.pts,
                &rp.hex_keys,
                HalfWidth::Scalar(half_width),
                None,
            );
            if let Some(e) = flush_river_bucket(&bucket, Some(&rp.point_hex)) {
                out.entries.push(e);
            }
        } else {
            let bucket = batch
                .get_or_insert_with(|| RiverGeoBucket::new(RiverMaterialKind::Water, render_order));
            let decimate = opts
                .tributary_decimate_dist
                .filter(|d| *d != 0.0 && !d.is_nan());
            let (pts, point_hex) = match decimate {
                Some(d) => decimate_river_ribbon_points(&rp.pts, &rp.point_hex, d),
                None => (rp.pts.clone(), rp.point_hex.clone()),
            };
            push_river_mesh(
                bucket,
                &pts,
                &rp.hex_keys,
                HalfWidth::Scalar(half_width),
                Some(&point_hex),
            );
            batch_count += 1;
            if batch_count >= opts.batch_size {
                flush_batch(&mut batch, &mut out.entries);
                batch_count = 0;
            }
        }
        for k in rp.hex_keys.iter() {
            out.land_hex_keys.add(k);
        }
    }
    flush_batch(&mut batch, &mut out.entries);
    out
}
