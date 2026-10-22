//! `terrain` — CPU build of the world-map terrain meshes of the web
//! `buildScene` (roblox style, D-RR-8 = A) and of its fog-of-war pass
//! (`setFog`), as GPU-ready buffers (topic RR-T2a, P4-11).
//!
//! What is built (web `edb8fb56`, `render/scene.ts`):
//! - **hex prisms**: one instanced layer per terrain type present, in
//!   `TerenBazowy` order, geometry `hexPrismNoBottomGeo(1.008·R, height)`
//!   (`scene.ts:1563-1576`, `:1760-1791`), instance matrices and colours from
//!   the hex loop (`scene.ts:2246-2339`): heights of `terrainVisualForStyle`,
//!   `coastalDrop = 0.045·R` on dry land next to `PlytkieMorze`, water prisms
//!   on `seaSurfaceY = 0.18`, colours `LAKA_SHADES`/`ROWNINA_SHADES`, the
//!   `PlytkieMorze` flat colour or `jitteredTerrainColor(blendedTerrainHex)`;
//! - **mountain / hill solids**: placement matrices of the 5+5 instanced
//!   variants (`scene.ts:2414-2430`, `:2461-2478`; no hill solid on
//!   `tarasy`). The solid geometries (`goraGeometria`/`wzgorzeGeometria`)
//!   belong to the model topics (RR-T4/RR-T7) and are not built here;
//! - **coast** ("plaże"): the five instanced layers of FALA 141
//!   ([`coast`], `scene.ts:2520-2534`, `:2749-2786`);
//! - **ocean backdrop and world frame** (`scene.ts:2997-3062`);
//! - **fog of war on the prisms** ([`TerrainScene::set_fog`],
//!   `scene.ts:3522-3637`): unknown hexes get `ZERO_MATRIX`, explored ones
//!   `baseColor × FOG_EXPLORED_BRIGHTNESS` (0.175), and the roblox
//!   "ocean-hide" rule zeroes every water prism while the ocean backdrop is
//!   shown. The dirty-set cache of the web is reproduced, so a sequence of
//!   calls ends in the same buffers as in the browser.
//!
//! Not built here (see `dyspozycje/rust-port/p4/P4-11-CAMERA-TERRAIN-CPU.md`):
//! fog / LOD of solids and coast (`applyZoomLodDecor`), forests, rivers,
//! oases, dunes, decor, improvements, materials/shaders and anything that
//! needs a GPU or an image.
//!
//! All arithmetic follows the TypeScript order of IEEE 754 operations; the
//! buffers are compared with vectors produced by the web code itself
//! (`tests/terrain_web_parity.rs`).

pub mod coast;
pub mod color;
pub mod jsmath;

use std::collections::{HashMap, HashSet};

use crate::geom::{box_geometry, cylinder_geometry, plane_geometry, Mesh};
use crate::jsmath::{js_cos, js_sin};
use crate::pick::camera::max_zoom_dist;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::{
    rotacja_dla_heksa, wariant_dla_heksa, Terrain, COASTAL_DROP_FACTOR, ROBLOX_PRISM_RADIUS_FACTOR,
    TERRAIN_SOLID_VARIANTS,
};
use crate::pick::three::{js_max, js_min, Mat4, Quat, Vec3};

use coast::{CoastBuffers, CoastLayerKind, TerrainAt};
use color::Color;

/// `FOG_EXPLORED_BRIGHTNESS` (`game/visibility.ts:31`).
pub const FOG_EXPLORED_BRIGHTNESS: f64 = 0.175;
/// `FOG_HIDDEN_COLOR = new Color(0x0b0d12)` (`scene.ts:164`).
pub const FOG_HIDDEN_HEX: u32 = 0x000b_0d12;
/// `LAKA_SHADES` (`scene.ts:206`).
pub const LAKA_SHADES: [u32; 5] = [
    0x0054_923a,
    0x005f_9e42,
    0x006c_ab4f,
    0x0079_b85c,
    0x0086_c469,
];
/// `ROWNINA_SHADES` (`scene.ts:207`).
pub const ROWNINA_SHADES: [u32; 5] = [
    0x009a_c968,
    0x00a6_d074,
    0x00b4_dc84,
    0x00c0_e693,
    0x00ca_ec9f,
];
/// `MAP_DETAIL_MEDIUM_HEX_THRESHOLD` (`mapRenderStyle.ts:50`).
pub const MAP_DETAIL_MEDIUM_HEX_THRESHOLD: usize = 3000;
/// `LARGE_MAP_LITE_HEX_THRESHOLD` (`mapRenderStyle.ts:52`).
pub const LARGE_MAP_LITE_HEX_THRESHOLD: usize = 8000;

/// `TERRAIN_ROBLOX[t]` (`mapRenderStyle.ts:512-522`, `styleTerrainColor` `:535-539`).
#[must_use]
pub fn roblox_terrain_hex(t: Terrain) -> u32 {
    match t {
        Terrain::Morze => 0x0055_94ad,
        Terrain::PlytkieMorze => 0x0082_c8e0,
        Terrain::Laka => 0x0094_bf78,
        Terrain::Rownina => 0x00b0_ca7e,
        Terrain::Pustynia => 0x00e0_c88e,
        Terrain::Wzgorza => 0x007e_a872,
        Terrain::Gory => 0x009d_a8b4,
        Terrain::Polarny => 0x00ee_f2f8,
    }
}

/// `styleScenePalette('roblox')` colours used by the terrain
/// (`mapRenderStyle.ts:555-568`): `deepOcean`.
pub const PALETTE_DEEP_OCEAN: u32 = 0x0048_7892;
/// `styleScenePalette('roblox').frame`.
pub const PALETTE_FRAME: u32 = 0x009a_8060;

/// `hash2D(q, r, seed, salt)` (`scene.ts:188-196`), `Math.imul`/`>>>`
/// semantics in wrapping `u32` arithmetic.
#[must_use]
#[allow(clippy::cast_sign_loss)] // ToInt32 → ToUint32 reinterpretation is the point
pub fn hash2d(q: i32, r: i32, seed: i32, salt: i32) -> f64 {
    let mut h = (q as u32).wrapping_mul(0x27d4_eb2d)
        ^ (r as u32).wrapping_mul(0x1656_67b1)
        ^ (seed as u32).wrapping_mul(0x9e37_79b1)
        ^ (salt as u32).wrapping_mul(0x85eb_ca6b);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297a_2d39);
    h ^= h >> 15;
    f64::from(h) / 4_294_967_296.0
}

/// `Quaternion.setFromEuler(new Euler(x, y, z, 'XYZ'))` (three r169
/// `Quaternion.js`, case `'XYZ'`), with `Math.sin/cos` taken from the shared
/// V8-exact [`crate::jsmath`] instead of the platform `libm`
/// (R-RUSTPORT-P4-16-JSMATH-Q1). Same operand order as
/// `pick::three::Quat::from_euler_xyz`, which `terrain` must not call
/// because it uses `f64::sin/cos`.
#[must_use]
pub fn quat_from_euler_xyz(x: f64, y: f64, z: f64) -> Quat {
    let c1 = js_cos(x / 2.0);
    let c2 = js_cos(y / 2.0);
    let c3 = js_cos(z / 2.0);
    let s1 = js_sin(x / 2.0);
    let s2 = js_sin(y / 2.0);
    let s3 = js_sin(z / 2.0);
    Quat {
        x: s1 * c2 * c3 + c1 * s2 * s3,
        y: c1 * s2 * c3 - s1 * c2 * s3,
        z: c1 * c2 * s3 + s1 * s2 * c3,
        w: c1 * c2 * c3 - s1 * s2 * s3,
    }
}

/// `dummy.position / rotation(0, yaw, 0) / scale(1,1,1) / updateMatrix()`
/// stored with `setMatrixAt` into a `Float32Array`.
#[must_use]
pub fn instance_matrix(position: Vec3, yaw: f64) -> [f32; 16] {
    let q = quat_from_euler_xyz(0.0, yaw, 0.0);
    Mat4::compose(position, q, Vec3::new(1.0, 1.0, 1.0)).to_f32()
}

/// `ZERO_MATRIX = new Matrix4().makeScale(0, 0, 0)` (`scene.ts:3139`).
#[must_use]
pub fn zero_matrix() -> [f32; 16] {
    Mat4::make_scale(0.0, 0.0, 0.0).to_f32()
}

/// River kind of `map.riverPathKinds` (`types/map.ts:49`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RiverKind {
    /// `'main'`.
    Main,
    /// `'medium'`.
    Medium,
    /// `'short'`.
    Short,
    /// `'tributary'`.
    Tributary,
}

impl RiverKind {
    /// Web string value.
    #[must_use]
    pub fn from_web_id(id: &str) -> Option<Self> {
        Some(match id {
            "main" => Self::Main,
            "medium" => Self::Medium,
            "short" => Self::Short,
            "tributary" => Self::Tributary,
            _ => return None,
        })
    }
}

/// One `map.riverPaths[i]` with its kind (`None` = no `riverPathKinds`
/// entry, which the web treats as `'main'`).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RiverPath {
    /// Hexes of the path, source first.
    pub hexes: Vec<HexCoord>,
    /// `riverPathKinds[i]`.
    pub kind: Option<RiverKind>,
}

/// One map hex, in `Object.values(map.hexes)` order.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TerrainHex {
    /// Axial coordinate.
    pub coord: HexCoord,
    /// `terenBazowy`.
    pub terrain: Terrain,
    /// The hex carries the `tarasy` improvement (no hill solid).
    pub terraces: bool,
}

/// `mapDetailQuality` of the render options.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MapDetailQuality {
    /// `'low'`.
    Low,
    /// `'medium'`.
    Medium,
    /// `'high'` (default).
    High,
}

/// `resolveRenderPreset(...).robloxLite` for the roblox style
/// (`mapRenderStyle.ts:114-127`; used as `robloxLite`, `scene.ts:1600, 2216`).
#[must_use]
pub fn roblox_lite(detail: MapDetailQuality, hex_count: usize) -> bool {
    let mut lite = match detail {
        MapDetailQuality::Low => true,
        MapDetailQuality::Medium => hex_count > MAP_DETAIL_MEDIUM_HEX_THRESHOLD,
        MapDetailQuality::High => false,
    };
    if hex_count > LARGE_MAP_LITE_HEX_THRESHOLD {
        lite = true;
    }
    lite
}

/// Input of [`build_terrain`].
#[derive(Clone, Copy, Debug)]
pub struct TerrainInput<'a> {
    /// `map.seed` as `ToInt32` (`seed | 0`).
    pub seed: i32,
    /// `map.szerokoscQ`.
    pub width: u32,
    /// `map.wysokoscR`.
    pub height: u32,
    /// `Object.values(map.hexes)`.
    pub hexes: &'a [TerrainHex],
    /// `map.riverPaths` with kinds.
    pub rivers: &'a [RiverPath],
    /// Render option `mapDetailQuality`.
    pub detail: MapDetailQuality,
}

/// One `InstancedMesh`: shared geometry + per-instance buffers.
#[derive(Clone, Debug, PartialEq)]
pub struct InstanceLayer {
    /// Shared geometry (positions, normals, uvs, indices).
    pub geometry: Mesh,
    /// `material.color` (linear, double precision).
    pub material_color: [f64; 3],
    /// `material.flatShading`.
    pub flat_shading: bool,
    /// `mesh.renderOrder`.
    pub render_order: i32,
    /// `instanceMatrix` (column-major `Float32`, 16 per instance).
    pub matrices: Vec<[f32; 16]>,
    /// `instanceColor` (`Float32`, rgb per instance).
    pub colors: Vec<[f32; 3]>,
    /// Hex of each instance (`terrainPickKeys` / coast hex keys).
    pub hexes: Vec<HexCoord>,
}

impl InstanceLayer {
    /// Instance matrices as one flat buffer (16 floats per instance).
    #[must_use]
    pub fn matrices_flat(&self) -> Vec<f32> {
        self.matrices.iter().flatten().copied().collect()
    }

    /// Instance colours as one flat buffer (3 floats per instance).
    #[must_use]
    pub fn colors_flat(&self) -> Vec<f32> {
        self.colors.iter().flatten().copied().collect()
    }
}

/// Placement of one mountain / hill solid variant (geometry external).
#[derive(Clone, Debug, PartialEq)]
pub struct SolidLayer {
    /// Variant `0..5` (`wariantDlaHeksa`).
    pub variant: usize,
    /// `instanceMatrix` (`Float32`).
    pub matrices: Vec<[f32; 16]>,
    /// Hex of each instance.
    pub hexes: Vec<HexCoord>,
}

/// A single (non-instanced) mesh with its world matrix.
#[derive(Clone, Debug, PartialEq)]
pub struct PlacedMesh {
    /// Geometry.
    pub geometry: Mesh,
    /// `matrixWorld` (double precision, like `Object3D`).
    pub world: Mat4,
}

/// Ocean backdrop plane and world frame (`scene.ts:2997-3062`); both are
/// visible only while [`TerrainScene::set_fog`] reports the backdrop.
#[derive(Clone, Debug, PartialEq)]
pub struct Backdrop {
    /// `OCEAN_BED_Y`.
    pub bed_y: f64,
    /// Ocean plane (`renderOrder = -10`).
    pub ocean: PlacedMesh,
    /// Ocean colour (`palette.deepOcean`, linear).
    pub ocean_color: [f64; 3],
    /// The four frame bars (top, bottom, left, right).
    pub frame: Vec<PlacedMesh>,
    /// Frame colour (`palette.frame`, linear).
    pub frame_color: [f64; 3],
}

#[derive(Clone, Copy, Debug, PartialEq)]
struct HexEntry {
    layer: usize,
    index: usize,
    base_color: Color,
    orig: [f32; 16],
    terrain: Terrain,
}

/// Result of [`build_terrain`].
#[derive(Clone, Debug, PartialEq)]
pub struct TerrainScene {
    /// Prism layers in `TerenBazowy` order (only types present).
    pub prisms: Vec<(Terrain, InstanceLayer)>,
    /// Mountain solids, variants `0..5`.
    pub gora: Vec<SolidLayer>,
    /// Hill solids, variants `0..5`.
    pub wzgorze: Vec<SolidLayer>,
    /// Non-empty coast layers in flush order.
    pub coast: Vec<(CoastLayerKind, InstanceLayer)>,
    /// Ocean backdrop and frame.
    pub backdrop: Option<Backdrop>,
    /// `preset.robloxLite` used for the coast.
    pub roblox_lite: bool,
    /// `blendedTerrainHex` (or the base hex) of every hex, diagnostics.
    pub blended_hex: Vec<(HexCoord, u32)>,
    /// River delta hexes (`computeRiverDeltaHexKeys`).
    pub delta_hexes: HashSet<HexCoord>,
    /// River mouth edges `(land, coast)` (`computeRiverMouthEdgeKeys`).
    pub mouth_edges: HashSet<(HexCoord, HexCoord)>,
    entries: HashMap<HexCoord, HexEntry>,
    order: Vec<HexCoord>,
    fog: FogCache,
}

#[derive(Clone, Debug, Default, PartialEq)]
struct FogCache {
    last_visible: Option<HashSet<HexCoord>>,
    last_sig: HashMap<HexCoord, u8>,
    last_show_ocean: Option<bool>,
}

/// `blendedTerrainHex(map, q, r, baseHex, isWater, 'roblox', self)`
/// (`scene.ts:484-519`).
fn blended_terrain_hex(
    map: &TerrainAt,
    h: HexCoord,
    base_hex: u32,
    is_water: bool,
    self_t: Terrain,
) -> u32 {
    let base = Color::from_hex(base_hex);
    let mut acc = Color::rgb(0.0, 0.0, 0.0);
    let mut n = 0u32;
    for (dq, dr) in coast::AXIAL_NEIGHBORS {
        let Some(&nb) = map.get(&HexCoord::new(h.q + dq, h.r + dr)) else {
            continue;
        };
        if self_t.is_dry_land() && !nb.is_dry_land() {
            continue;
        }
        if self_t == Terrain::PlytkieMorze && nb.is_dry_land() {
            continue;
        }
        acc = acc.plus(Color::from_hex(roblox_terrain_hex(nb)));
        n += 1;
    }
    if n == 0 {
        return base_hex;
    }
    acc = acc.scale(1.0 / f64::from(n));
    base.lerp(acc, if is_water { 0.07 } else { 0.18 }).to_hex()
}

/// `jitteredTerrainColor(baseHex, q, r, seed, isWater)` (`scene.ts:209-232`).
#[must_use]
pub fn jittered_terrain_color(base_hex: u32, h: HexCoord, seed: i32, is_water: bool) -> Color {
    let c = Color::from_hex(base_hex);
    let hsl = c.hsl();
    let n_h = hash2d(h.q, h.r, seed, 101) - 0.5;
    let n_s = hash2d(h.q, h.r, seed, 202) - 0.5;
    let n_l = hash2d(h.q, h.r, seed, 303) - 0.5;
    let hue_amt = if is_water { 0.010 } else { 0.022 };
    let sat_amt = if is_water { 0.05 } else { 0.10 };
    let lit_amt = if is_water { 0.030 } else { 0.060 };
    let mut hue = hsl.h + n_h * hue_amt;
    hue -= hue.floor();
    let s = js_max(0.0, js_min(1.0, hsl.s + n_s * sat_amt));
    let l = js_max(0.0, js_min(1.0, hsl.l + n_l * lit_amt));
    Color::from_hsl(hue, s, l)
}

/// Base (unfogged) colour of a hex prism (`scene.ts:2315-2331`) and the hex
/// that fed the jitter (`blendedHex`, diagnostics).
fn base_color(map: &TerrainAt, h: HexCoord, t: Terrain, seed: i32) -> (Color, u32) {
    let base_hex = roblox_terrain_hex(t);
    if t == Terrain::PlytkieMorze {
        return (Color::from_hex(base_hex), base_hex);
    }
    let is_water = !t.is_dry_land();
    let blended = blended_terrain_hex(map, h, base_hex, is_water, t);
    let shades = match t {
        Terrain::Laka => Some(&LAKA_SHADES),
        Terrain::Rownina => Some(&ROWNINA_SHADES),
        _ => None,
    };
    if let Some(sh) = shades {
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // floor of [0, 5)
        let i = ((hash2d(h.q, h.r, seed, 4242) * 5.0).floor() as usize) % 5;
        return (Color::from_hex(sh[i]), blended);
    }
    (jittered_terrain_color(blended, h, seed, is_water), blended)
}

/// `hexPrismNoBottomGeo(radius, height)` (`scene.ts:1563-1576`) with all
/// attributes: `CylinderGeometry(r, r, h, 6, 1)` whose index keeps the side
/// and top-cap triangles (bottom-cap group removed, groups cleared).
#[must_use]
pub fn hex_prism_no_bottom_mesh(radius: f64, height: f64) -> Mesh {
    let mut g = cylinder_geometry(
        radius,
        radius,
        height,
        6,
        1,
        false,
        0.0,
        std::f64::consts::PI * 2.0,
    );
    if let Some(bottom) = g.groups.iter().find(|gr| gr.material_index == 2).copied() {
        if let Some(idx) = g.indices.as_mut() {
            idx.truncate(bottom.start as usize);
        }
        g.groups.clear();
    }
    g
}

fn material(hex: u32) -> [f64; 3] {
    Color::from_hex(hex).to_array()
}

/// Builds the terrain like `buildScene` (roblox style), before any fog.
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_terrain(input: &TerrainInput<'_>) -> TerrainScene {
    let r = HEX_R;
    let seed = input.seed;
    let map: TerrainAt = input.hexes.iter().map(|h| (h.coord, h.terrain)).collect();
    let lite = roblox_lite(input.detail, map.len());

    // Prism layers (scene.ts:1760-1791).
    let mut prisms: Vec<(Terrain, InstanceLayer)> = Vec::new();
    let mut layer_of: HashMap<Terrain, usize> = HashMap::new();
    for t in Terrain::ALL {
        if !input.hexes.iter().any(|h| h.terrain == t) {
            continue;
        }
        let (height, _) = t.visual();
        layer_of.insert(t, prisms.len());
        prisms.push((
            t,
            InstanceLayer {
                geometry: hex_prism_no_bottom_mesh(r * ROBLOX_PRISM_RADIUS_FACTOR, height),
                material_color: material(roblox_terrain_hex(t)),
                flat_shading: true,
                render_order: 0,
                matrices: Vec::new(),
                colors: Vec::new(),
                hexes: Vec::new(),
            },
        ));
    }
    let mut gora: Vec<SolidLayer> = (0..TERRAIN_SOLID_VARIANTS)
        .map(|variant| SolidLayer {
            variant,
            matrices: Vec::new(),
            hexes: Vec::new(),
        })
        .collect();
    let mut wzgorze = gora.clone();

    let (sea_h, sea_yo) = Terrain::Morze.visual();
    let sea_surface_y = sea_h + sea_yo;
    let delta_hexes = coast::river_delta_hexes(&map, input.rivers);
    let mouth_edges = coast::river_mouth_edges(&map, input.rivers);
    let mut coast_buf = CoastBuffers::default();
    let mut entries = HashMap::new();
    let mut order = Vec::new();
    let mut blended_hex = Vec::new();

    for h in input.hexes {
        let t = h.terrain;
        let (height, y_offset) = t.visual();
        let (x, z) = axial_to_world(h.coord, r);
        let sand = coast::land_coast_sand_needed(&map, h.coord, t);
        let coastal_drop = if sand { r * COASTAL_DROP_FACTOR } else { 0.0 };
        let surface_top_y = height + y_offset - coastal_drop;
        let mut y = surface_top_y - height / 2.0;
        if !t.is_dry_land() {
            y = sea_surface_y - height / 2.0;
        }

        // Hex prism (scene.ts:2294-2339).
        let li = layer_of[&t];
        let layer = &mut prisms[li].1;
        let m = instance_matrix(Vec3::new(x, y, z), 0.0);
        let (bc, blended) = base_color(&map, h.coord, t, seed);
        let index = layer.matrices.len();
        layer.matrices.push(m);
        layer.colors.push(bc.to_f32());
        layer.hexes.push(h.coord);
        blended_hex.push((h.coord, blended));
        entries.insert(
            h.coord,
            HexEntry {
                layer: li,
                index,
                base_color: bc,
                orig: m,
                terrain: t,
            },
        );
        order.push(h.coord);

        // Solids (scene.ts:2414-2430, 2461-2478).
        let solid = match t {
            Terrain::Gory => Some(&mut gora),
            Terrain::Wzgorza if !h.terraces => Some(&mut wzgorze),
            _ => None,
        };
        if let Some(layers) = solid {
            let top = height + y_offset;
            let v = wariant_dla_heksa(h.coord.q, h.coord.r, TERRAIN_SOLID_VARIANTS, seed);
            let yaw = rotacja_dla_heksa(h.coord.q, h.coord.r, seed);
            layers[v]
                .matrices
                .push(instance_matrix(Vec3::new(x, top, z), yaw));
            layers[v].hexes.push(h.coord);
        }

        // Coast (scene.ts:2520-2534).
        if t == Terrain::PlytkieMorze {
            coast::collect_coast_water(
                &mut coast_buf,
                &map,
                h.coord,
                x,
                z,
                sea_surface_y,
                lite,
                delta_hexes.contains(&h.coord),
                &mouth_edges,
            );
        } else if sand {
            coast::collect_land_sand(&mut coast_buf, &map, h.coord, (x, z), surface_top_y, lite);
        }
    }

    // Coast flush (scene.ts:2749-2786): white instance colours.
    let white = Color::rgb(1.0, 1.0, 1.0).to_f32();
    let mut coast_layers = Vec::new();
    for (i, kind) in CoastLayerKind::ORDER.iter().enumerate() {
        let slots = &coast_buf.layers[i];
        if slots.is_empty() {
            continue;
        }
        coast_layers.push((
            *kind,
            InstanceLayer {
                geometry: coast::coast_geometry(*kind, lite),
                material_color: material(kind.material_hex()),
                flat_shading: true,
                render_order: kind.render_order(),
                matrices: slots.iter().map(|s| s.0).collect(),
                colors: vec![white; slots.len()],
                hexes: slots.iter().map(|s| s.1).collect(),
            },
        ));
    }

    TerrainScene {
        prisms,
        gora,
        wzgorze,
        coast: coast_layers,
        backdrop: build_backdrop(input),
        roblox_lite: lite,
        blended_hex,
        delta_hexes,
        mouth_edges,
        entries,
        order,
        fog: FogCache::default(),
    }
}

/// Ocean plane + frame (`scene.ts:2997-3062`); `None` for an empty map.
fn build_backdrop(input: &TerrainInput<'_>) -> Option<Backdrop> {
    if input.hexes.is_empty() {
        return None;
    }
    let r = HEX_R;
    let max_zoom = max_zoom_dist(input.width, input.height);
    let (mut min_x, mut max_x, mut min_z, mut max_z) = (
        f64::INFINITY,
        f64::NEG_INFINITY,
        f64::INFINITY,
        f64::NEG_INFINITY,
    );
    for h in input.hexes {
        let (x, z) = axial_to_world(h.coord, r);
        if x < min_x {
            min_x = x;
        }
        if x > max_x {
            max_x = x;
        }
        if z < min_z {
            min_z = z;
        }
        if z > max_z {
            max_z = z;
        }
    }
    let (sea_h, sea_yo) = Terrain::Morze.visual();
    let sea_top = sea_h + sea_yo;
    let span = js_max(max_x - min_x, max_z - min_z);
    let depth = js_min(28.0, js_max(14.0, span * 0.012));
    let bed_y = sea_top - depth;
    let pad_o = js_max(js_max(r * 7.0, max_zoom * 3.2), span * 0.85);
    let pad_f = r * 1.4;
    let (cxb, czb) = ((min_x + max_x) / 2.0, (min_z + max_z) / 2.0);
    let ocean_geo = plane_geometry(
        (max_x - min_x) + pad_o * 2.0,
        (max_z - min_z) + pad_o * 2.0,
        1,
        1,
    );
    let ocean_world = Mat4::compose(
        Vec3::new(cxb, bed_y, czb),
        quat_from_euler_xyz(-std::f64::consts::PI / 2.0, 0.0, 0.0),
        Vec3::new(1.0, 1.0, 1.0),
    );
    let (fx0, fx1, fz0, fz1) = (min_x - pad_f, max_x + pad_f, min_z - pad_f, max_z + pad_f);
    let (bar_h, bar_t, frame_y) = (r * 0.6, r * 0.7, sea_top + r * 0.12);
    let bar = |w: f64, d: f64, px: f64, pz: f64| PlacedMesh {
        geometry: box_geometry(w, bar_h, d, 1, 1, 1),
        world: Mat4::compose(
            Vec3::new(px, frame_y, pz),
            quat_from_euler_xyz(0.0, 0.0, 0.0),
            Vec3::new(1.0, 1.0, 1.0),
        ),
    };
    let span_x = (fx1 - fx0) + bar_t * 2.0;
    let frame = vec![
        bar(span_x, bar_t, (fx0 + fx1) / 2.0, fz0 - bar_t / 2.0),
        bar(span_x, bar_t, (fx0 + fx1) / 2.0, fz1 + bar_t / 2.0),
        bar(bar_t, fz1 - fz0, fx0 - bar_t / 2.0, (fz0 + fz1) / 2.0),
        bar(bar_t, fz1 - fz0, fx1 + bar_t / 2.0, (fz0 + fz1) / 2.0),
    ];
    Some(Backdrop {
        bed_y,
        ocean: PlacedMesh {
            geometry: ocean_geo,
            world: ocean_world,
        },
        ocean_color: material(PALETTE_DEEP_OCEAN),
        frame,
        frame_color: material(PALETTE_FRAME),
    })
}

impl TerrainScene {
    /// Prism layer of a terrain type, if present.
    #[must_use]
    pub fn prism_layer(&self, t: Terrain) -> Option<&InstanceLayer> {
        self.prisms.iter().find(|(tt, _)| *tt == t).map(|(_, l)| l)
    }

    /// Base (unfogged) colour of a hex prism.
    #[must_use]
    pub fn base_color(&self, h: HexCoord) -> Option<Color> {
        self.entries.get(&h).map(|e| e.base_color)
    }

    /// `setFog(visible, explored, { landReveal })` for the prisms
    /// (`scene.ts:3522-3637`), including the dirty-set cache (A5) and the
    /// roblox ocean-hide rule. Returns `showOceanBackdrop` (ocean plane and
    /// frame visible).
    pub fn set_fog(
        &mut self,
        visible: &HashSet<HexCoord>,
        explored: &HashSet<HexCoord>,
        land_reveal: bool,
    ) -> bool {
        let prev_visible = self.fog.last_visible.replace(visible.clone());
        let is_hidden = |k: &HexCoord| !visible.contains(k) && !explored.contains(k);
        let any_hidden = self.order.iter().any(is_hidden);
        let show_now = !any_hidden || land_reveal;
        let context_changed = Some(show_now) != self.fog.last_show_ocean;
        if context_changed {
            self.fog.last_sig.clear();
            self.fog.last_show_ocean = Some(show_now);
        }
        let keys: Vec<HexCoord> = match prev_visible {
            Some(prev) if !context_changed => {
                let mut changed: Vec<HexCoord> = visible
                    .iter()
                    .filter(|k| !prev.contains(k))
                    .copied()
                    .collect();
                changed.extend(prev.iter().filter(|k| !visible.contains(k)).copied());
                changed
            }
            _ => self.order.clone(),
        };
        let hidden_color = Color::from_hex(FOG_HIDDEN_HEX);
        for key in keys {
            let Some(e) = self.entries.get(&key).copied() else {
                continue;
            };
            let sig: u8 = if visible.contains(&key) {
                0
            } else if explored.contains(&key) {
                1
            } else {
                2
            };
            if self.fog.last_sig.get(&key) == Some(&sig) {
                continue;
            }
            let color = match sig {
                0 => e.base_color,
                1 => e.base_color.scale(FOG_EXPLORED_BRIGHTNESS),
                _ => hidden_color,
            };
            let layer = &mut self.prisms[e.layer].1;
            layer.colors[e.index] = color.to_f32();
            layer.matrices[e.index] = if sig == 2 { zero_matrix() } else { e.orig };
            self.fog.last_sig.insert(key, sig);
        }
        if show_now {
            for key in &self.order {
                let e = self.entries[key];
                if e.terrain.is_dry_land() {
                    continue;
                }
                self.prisms[e.layer].1.matrices[e.index] = zero_matrix();
            }
        }
        show_now
    }
}
