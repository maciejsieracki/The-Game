//! Roblox coast ("plaże", FALA 141): instanced water strips / pools on
//! `PlytkieMorze` and sand strips on dry land next to it, plus the river
//! delta and mouth-edge sets that shape them.
//!
//! Sources (web `edb8fb56`, `render/mapRenderStyle.ts`):
//! `AXIAL_NEIGHBORS` `:1235-1237`, `landCoastSandNeeded` `:1257-1263`,
//! `hasMorzeNeighbor` `:1275-1280`, `findRiverMouthWybrzeze` `:1283-1329`,
//! `pathReachesOpenSea` `:1335-1350`, `computeRiverDeltaHexKeys`
//! `:1357-1410`, `COAST_SAND_ROBLOX` `:509`, `coastWaterMaterial` /
//! `coastSandMaterial` `:1447-1453`, `getCoastSharedGeometries`
//! `:1486-1514`, `collectRobloxCoastWaterInst` `:1520-1609`,
//! `collectRobloxLandCoastSandInst` `:1612-1651`, `LAND_COAST_SAND_FRAC`
//! `:197`, `computeRiverMouthEdgeKeys` `:1716-1748`; V8 `Math.hypot`:
//! `src/builtins/math.tq:398-441` `MathHypot` (V8 12.4.254.21 = node v22.22.0), verified on
//! 2 048 vectors.

use std::collections::{HashMap, HashSet};

use crate::geom::{box_geometry, cylinder_geometry, Mesh};
use crate::pick::hex::{axial_to_world, sqrt3, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::pick::three::Vec3;

use super::{instance_matrix, RiverKind, RiverPath};

/// `AXIAL_NEIGHBORS` / `HEX_NEIGHBORS` (pointy-top axial directions).
pub const AXIAL_NEIGHBORS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// `COAST_SAND_ROBLOX` (`mapRenderStyle.ts:509`).
pub const COAST_SAND_ROBLOX: u32 = 0x00e8_d4a0;

/// `LAND_COAST_SAND_FRAC` (`mapRenderStyle.ts:197`).
pub const LAND_COAST_SAND_FRAC: f64 = 0.30;

/// Terrain lookup of the map (`map.hexes[key]?.terenBazowy`).
pub type TerrainAt = HashMap<HexCoord, Terrain>;

fn at(map: &TerrainAt, q: i32, r: i32) -> Option<Terrain> {
    map.get(&HexCoord::new(q, r)).copied()
}

/// `landCoastSandNeeded(map, q, r, self)`: dry land with a `PlytkieMorze`
/// neighbour (also the `coastalDrop` condition of the prism, `scene.ts:2252`).
#[must_use]
pub fn land_coast_sand_needed(map: &TerrainAt, h: HexCoord, t: Terrain) -> bool {
    t.is_dry_land()
        && AXIAL_NEIGHBORS
            .iter()
            .any(|(dq, dr)| at(map, h.q + dq, h.r + dr) == Some(Terrain::PlytkieMorze))
}

fn has_morze_neighbor(map: &TerrainAt, q: i32, r: i32) -> bool {
    AXIAL_NEIGHBORS
        .iter()
        .any(|(dq, dr)| at(map, q + dq, r + dr) == Some(Terrain::Morze))
}

/// `findRiverMouthWybrzeze(map, path)`.
fn find_river_mouth_wybrzeze(map: &TerrainAt, path: &[HexCoord]) -> Option<HexCoord> {
    if path.is_empty() {
        return None;
    }
    let last = path.len() - 1;
    let lo = path.len().saturating_sub(8);
    for i in (lo..=last).rev() {
        let pt = path[i];
        if at(map, pt.q, pt.r) == Some(Terrain::PlytkieMorze) {
            return Some(pt);
        }
    }
    for i in (lo..=last).rev() {
        let pt = path[i];
        match at(map, pt.q, pt.r) {
            Some(t) if t.is_dry_land() => {}
            _ => continue,
        }
        let prev = if i >= 1 { Some(path[i - 1]) } else { None };
        let mut best: Option<HexCoord> = None;
        let mut best_score = f64::NEG_INFINITY;
        for (dq, dr) in AXIAL_NEIGHBORS {
            let (nq, nr) = (pt.q + dq, pt.r + dr);
            if at(map, nq, nr) != Some(Terrain::PlytkieMorze) {
                continue;
            }
            let mut score = 1.0;
            if let Some(p) = prev {
                score = f64::from((nq - pt.q) * (pt.q - p.q) + (nr - pt.r) * (pt.r - p.r));
            }
            if score > best_score {
                best_score = score;
                best = Some(HexCoord::new(nq, nr));
            }
        }
        if best.is_some() {
            return best;
        }
    }
    for i in (lo..=last).rev() {
        let pt = path[i];
        if at(map, pt.q, pt.r) != Some(Terrain::Morze) {
            continue;
        }
        for (dq, dr) in AXIAL_NEIGHBORS {
            if at(map, pt.q + dq, pt.r + dr) == Some(Terrain::PlytkieMorze) {
                return Some(HexCoord::new(pt.q + dq, pt.r + dr));
            }
        }
    }
    None
}

/// `pathReachesOpenSea(map, path)`.
fn path_reaches_open_sea(map: &TerrainAt, path: &[HexCoord]) -> bool {
    let Some(&last) = path.last() else {
        return false;
    };
    let Some(t) = at(map, last.q, last.r) else {
        return false;
    };
    if t == Terrain::Morze {
        return true;
    }
    if t == Terrain::PlytkieMorze {
        return has_morze_neighbor(map, last.q, last.r);
    }
    AXIAL_NEIGHBORS.iter().any(|(dq, dr)| {
        at(map, last.q + dq, last.r + dr) == Some(Terrain::PlytkieMorze)
            && has_morze_neighbor(map, last.q + dq, last.r + dr)
    })
}

/// `computeRiverDeltaHexKeys(map, maxHexes = 3)`: `PlytkieMorze` hexes of
/// the river deltas (main rivers that reach the open sea).
#[must_use]
pub fn river_delta_hexes(map: &TerrainAt, rivers: &[RiverPath]) -> HashSet<HexCoord> {
    const MAX_HEXES: usize = 3;
    let mut keys: HashSet<HexCoord> = HashSet::new();
    let mut used_mouths: Vec<HexCoord> = Vec::new();
    for river in rivers {
        if river.kind.unwrap_or(RiverKind::Main) != RiverKind::Main {
            continue;
        }
        let path = &river.hexes;
        if !path_reaches_open_sea(map, path) {
            continue;
        }
        let Some(mouth) = find_river_mouth_wybrzeze(map, path) else {
            continue;
        };
        if at(map, mouth.q, mouth.r) != Some(Terrain::PlytkieMorze) {
            continue;
        }
        let too_close = used_mouths.iter().any(|m| {
            let dq = m.q - mouth.q;
            let dr = m.r - mouth.r;
            f64::from(dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0 < 3.0
        });
        if too_close {
            continue;
        }
        used_mouths.push(mouth);
        let mut queue: std::collections::VecDeque<HexCoord> = std::collections::VecDeque::new();
        queue.push_back(mouth);
        keys.insert(mouth);
        let mut mouth_count = 1usize;
        let path_set: HashSet<HexCoord> = path.iter().copied().collect();
        while mouth_count < MAX_HEXES {
            let Some(cur) = queue.pop_front() else { break };
            let mut scored: Vec<(HexCoord, i32)> = Vec::new();
            for (dq, dr) in AXIAL_NEIGHBORS {
                let n = HexCoord::new(cur.q + dq, cur.r + dr);
                if keys.contains(&n) {
                    continue;
                }
                if at(map, n.q, n.r) != Some(Terrain::PlytkieMorze) {
                    continue;
                }
                let mut score = if has_morze_neighbor(map, n.q, n.r) {
                    3
                } else {
                    1
                };
                if path_set.contains(&n) {
                    score += 2;
                }
                scored.push((n, score));
            }
            // Array.prototype.sort is stable (V8 TimSort): b.score - a.score;
            // `sort_by_key` is stable too.
            scored.sort_by_key(|c| std::cmp::Reverse(c.1));
            for (c, _) in scored {
                if mouth_count >= MAX_HEXES {
                    break;
                }
                keys.insert(c);
                queue.push_back(c);
                mouth_count += 1;
            }
        }
    }
    keys
}

/// `computeRiverMouthEdgeKeys(map)`: `(land, coast)` edges where a river
/// enters `PlytkieMorze` (no sea-side water strip there).
#[must_use]
pub fn river_mouth_edges(map: &TerrainAt, rivers: &[RiverPath]) -> HashSet<(HexCoord, HexCoord)> {
    let mut keys = HashSet::new();
    for river in rivers {
        let path = &river.hexes;
        let Some(&last) = path.last() else { continue };
        let Some(last_t) = at(map, last.q, last.r) else {
            continue;
        };
        let prev = if path.len() >= 2 {
            Some(path[path.len() - 2])
        } else {
            None
        };
        if last_t == Terrain::PlytkieMorze {
            if let Some(p) = prev {
                keys.insert((p, last));
                continue;
            }
        }
        if !last_t.is_dry_land() {
            continue;
        }
        let mut best: Option<HexCoord> = None;
        let mut best_score = f64::NEG_INFINITY;
        for (dq, dr) in AXIAL_NEIGHBORS {
            let (nq, nr) = (last.q + dq, last.r + dr);
            if at(map, nq, nr) != Some(Terrain::PlytkieMorze) {
                continue;
            }
            let mut score = 1.0;
            if let Some(p) = prev {
                score = f64::from((nq - last.q) * (last.q - p.q) + (nr - last.r) * (last.r - p.r));
            }
            if score > best_score {
                best_score = score;
                best = Some(HexCoord::new(nq, nr));
            }
        }
        if let Some(b) = best {
            keys.insert((last, b));
        }
    }
    keys
}

/// V8 `Math.hypot` for two arguments (`builtins/math.tq` `MathHypot`):
/// scale by the larger magnitude, Kahan-compensated sum, `sqrt(sum) * max`.
#[must_use]
pub fn js_hypot(a: f64, b: f64) -> f64 {
    if a.is_infinite() || b.is_infinite() {
        return f64::INFINITY;
    }
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    let abs = [a.abs(), b.abs()];
    let mut max = 0.0f64;
    for v in abs {
        if v > max {
            max = v;
        }
    }
    if max == 0.0 {
        return 0.0;
    }
    let mut sum = 0.0f64;
    let mut compensation = 0.0f64;
    for v in abs {
        let n = v / max;
        let summand = n * n - compensation;
        let preliminary = sum + summand;
        compensation = (preliminary - sum) - summand;
        sum = preliminary;
    }
    sum.sqrt() * max
}

/// The five instance buffers of `createCoastInstBuffers()`, in flush order.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum CoastLayerKind {
    /// Flat water pool over a non-delta `PlytkieMorze` hex.
    WaterPool,
    /// Water strip on each `Morze`-facing edge (full detail only).
    WaterEdge,
    /// Lagoon disc over a delta hex.
    WaterLagoon,
    /// Water tongue of a delta hex towards the closest sea (full detail only).
    WaterTongue,
    /// Sand strip on dry land along each `PlytkieMorze` edge.
    LandSand,
}

impl CoastLayerKind {
    /// Flush order (`scene.ts:2782-2786`).
    pub const ORDER: [Self; 5] = [
        Self::WaterPool,
        Self::WaterEdge,
        Self::WaterLagoon,
        Self::WaterTongue,
        Self::LandSand,
    ];

    /// `mesh.renderOrder` (`scene.ts:2782-2786`).
    #[must_use]
    pub fn render_order(self) -> i32 {
        match self {
            Self::WaterPool => 0,
            Self::WaterEdge | Self::WaterLagoon | Self::WaterTongue => 1,
            Self::LandSand => 3,
        }
    }

    /// Material colour hex: `PlytkieMorze` water or `COAST_SAND_ROBLOX`.
    #[must_use]
    pub fn material_hex(self) -> u32 {
        match self {
            Self::LandSand => COAST_SAND_ROBLOX,
            _ => super::roblox_terrain_hex(Terrain::PlytkieMorze),
        }
    }

    /// Name used in the web dump (`waterPool`, ...).
    #[must_use]
    pub fn web_name(self) -> &'static str {
        match self {
            Self::WaterPool => "waterPool",
            Self::WaterEdge => "waterEdge",
            Self::WaterLagoon => "waterLagoon",
            Self::WaterTongue => "waterTongue",
            Self::LandSand => "landSand",
        }
    }
}

/// `getCoastSharedGeometries(lite)` — the geometry of one layer (`R = HEX_R`).
#[must_use]
pub fn coast_geometry(kind: CoastLayerKind, lite: bool) -> Mesh {
    let r = HEX_R;
    let strip_h = if lite { 0.028 } else { 0.038 };
    let tau = std::f64::consts::PI * 2.0;
    match kind {
        CoastLayerKind::WaterPool => {
            cylinder_geometry(r * 0.91, r * 0.93, strip_h * 1.15, 6, 1, false, 0.0, tau)
        }
        CoastLayerKind::WaterEdge => box_geometry(r * 1.04, strip_h, r * 0.50, 1, 1, 1),
        CoastLayerKind::WaterLagoon => {
            cylinder_geometry(r * 0.86, r * 0.88, strip_h * 1.35, 6, 1, false, 0.0, tau)
        }
        CoastLayerKind::WaterTongue => box_geometry(r * 0.78, strip_h * 1.25, r * 1.22, 1, 1, 1),
        CoastLayerKind::LandSand => box_geometry(
            r * 1.02,
            if lite { r * 0.010 } else { r * 0.013 },
            r * LAND_COAST_SAND_FRAC,
            1,
            1,
            1,
        ),
    }
}

/// Collected coast instances (`CoastInstBuffers`): per layer, the
/// `Float32` matrices and the hex of each instance.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct CoastBuffers {
    /// `(matrix, hex)` per layer, indexed like [`CoastLayerKind::ORDER`].
    pub layers: [Vec<([f32; 16], HexCoord)>; 5],
}

impl CoastBuffers {
    fn push(&mut self, kind: CoastLayerKind, m: [f32; 16], h: HexCoord) {
        let i = CoastLayerKind::ORDER
            .iter()
            .position(|k| *k == kind)
            .unwrap_or(0);
        self.layers[i].push((m, h));
    }
}

/// `collectRobloxCoastWaterInst` for one `PlytkieMorze` hex.
#[allow(clippy::too_many_arguments)]
pub(crate) fn collect_coast_water(
    buf: &mut CoastBuffers,
    map: &TerrainAt,
    h: HexCoord,
    x: f64,
    z: f64,
    sea_top_y: f64,
    lite: bool,
    is_delta: bool,
    mouth_edges: &HashSet<(HexCoord, HexCoord)>,
) {
    let r = HEX_R;
    let apothem = r * (sqrt3() / 2.0);
    let strip_depth = if is_delta { r * 0.62 } else { r * 0.50 };
    let strip_h = if lite { 0.028 } else { 0.038 };
    if !is_delta {
        buf.push(
            CoastLayerKind::WaterPool,
            instance_matrix(Vec3::new(x, sea_top_y + strip_h * 0.55, z), 0.0),
            h,
        );
    }
    if !lite {
        for (dq, dr) in AXIAL_NEIGHBORS {
            let l = HexCoord::new(h.q + dq, h.r + dr);
            if at(map, l.q, l.r) != Some(Terrain::Morze) {
                continue;
            }
            if mouth_edges.contains(&(l, h)) {
                continue;
            }
            let (wx, wz) = axial_to_world(l, r);
            let dx = wx - x;
            let dz = wz - z;
            let d = js_hypot(dx, dz);
            let dist = if d == 0.0 || d.is_nan() { 1.0 } else { d };
            let nx = dx / dist;
            let nz = dz / dist;
            let ex = x + nx * (apothem + strip_depth * 0.42);
            let ez = z + nz * (apothem + strip_depth * 0.42);
            let yaw = nx.atan2(nz);
            buf.push(
                CoastLayerKind::WaterEdge,
                instance_matrix(Vec3::new(ex, sea_top_y + strip_h * 0.52 + 0.014, ez), yaw),
                h,
            );
        }
    }
    if is_delta {
        buf.push(
            CoastLayerKind::WaterLagoon,
            instance_matrix(Vec3::new(x, sea_top_y + strip_h * 0.58 + 0.012, z), 0.0),
            h,
        );
        if !lite {
            let mut best: Option<(f64, f64)> = None;
            let mut best_score = f64::NEG_INFINITY;
            for (dq, dr) in AXIAL_NEIGHBORS {
                let n = HexCoord::new(h.q + dq, h.r + dr);
                if at(map, n.q, n.r) != Some(Terrain::Morze) {
                    continue;
                }
                let (wx, wz) = axial_to_world(n, r);
                let dx = wx - x;
                let dz = wz - z;
                let d = js_hypot(dx, dz);
                let dist = if d == 0.0 || d.is_nan() { 1.0 } else { d };
                let score = 1.0 / dist;
                if score > best_score {
                    best_score = score;
                    best = Some((dx / dist, dz / dist));
                }
            }
            if let Some((nx, nz)) = best {
                let tongue_len = r * 1.22;
                let ex = x + nx * (apothem + tongue_len * 0.44);
                let ez = z + nz * (apothem + tongue_len * 0.44);
                buf.push(
                    CoastLayerKind::WaterTongue,
                    instance_matrix(
                        Vec3::new(ex, sea_top_y + strip_h * 0.58 + 0.014, ez),
                        nx.atan2(nz),
                    ),
                    h,
                );
            }
        }
    }
}

/// `collectRobloxLandCoastSandInst` for one dry-land hex.
pub(crate) fn collect_land_sand(
    buf: &mut CoastBuffers,
    map: &TerrainAt,
    h: HexCoord,
    (x, z): (f64, f64),
    top_y: f64,
    lite: bool,
) {
    let r = HEX_R;
    let apothem = r * (sqrt3() / 2.0);
    let strip_depth = r * LAND_COAST_SAND_FRAC;
    let strip_h = if lite { r * 0.010 } else { r * 0.013 };
    let flush_lift = 0.002;
    for (dq, dr) in AXIAL_NEIGHBORS {
        let l = HexCoord::new(h.q + dq, h.r + dr);
        if at(map, l.q, l.r) != Some(Terrain::PlytkieMorze) {
            continue;
        }
        let (wx, wz) = axial_to_world(l, r);
        let dx = wx - x;
        let dz = wz - z;
        let d = js_hypot(dx, dz);
        let dist = if d == 0.0 || d.is_nan() { 1.0 } else { d };
        let nx = dx / dist;
        let nz = dz / dist;
        let ex = x + nx * (apothem - strip_depth * 0.52);
        let ez = z + nz * (apothem - strip_depth * 0.52);
        let yaw = nx.atan2(nz);
        buf.push(
            CoastLayerKind::LandSand,
            instance_matrix(Vec3::new(ex, top_y + flush_lift + strip_h * 0.5, ez), yaw),
            h,
        );
    }
}
