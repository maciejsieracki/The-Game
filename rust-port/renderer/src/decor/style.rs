//! The `build*` decor factories of `render/mapRenderStyle.ts` (web
//! `edb8fb56`) for the game style `'roblox'` (owner decision D-RR-8 = A:
//! only the roblox map style is ported; the `'civ'` early returns and the
//! `'minecraft'` branches are unreachable in the game, `mapRenderStyle.ts:40`).
//!
//! Already ported elsewhere and reused, not duplicated: palettes, heights,
//! `styleHillBumpSurfaceY`, `styleMountainPeakSurfaceY`,
//! `galleryDecorSurfaceY`, `elevatedTerrainEdgeSurfaceY`, `styleTerrainColor`
//! (`crate::core::map_style`, P4.12); `landCoastSandNeeded`,
//! `computeRiverDeltaHexKeys`, `computeRiverMouthEdgeKeys`,
//! `getCoastSharedGeometries`, `collectRobloxCoastWaterInst`,
//! `collectRobloxLandCoastSandInst` (`crate::terrain::coast`, P4.11).
//!
//! Not ported: `robloxCliffUnder` (`:486-495`) — a private function with
//! no caller in the file (`grep -n robloxCliffUnder gra/src/render` → only
//! the definition), and `addMinecraftSpruce` (minecraft only).
//!
//! Line references are to `gra/src/render/mapRenderStyle.ts`.

use std::collections::HashSet;
use std::sync::Arc;

use crate::core::map_style::{style_terrain_color, MapRenderStyle};
use crate::core::scene::{Geometry, SceneNode};
use crate::geom::{
    box_geometry, cone_geometry, cylinder_geometry, icosahedron_geometry, Euler, Vec3,
};
use crate::pick::hex::{axial_to_world, js_round, sqrt3, HexCoord, HEX_R};
use crate::pick::terrain::{hash_heksa as hash2d, Terrain};
use crate::terrain::coast::{TerrainAt, AXIAL_NEIGHBORS, COAST_SAND_ROBLOX, LAND_COAST_SAND_FRAC};
use crate::terrain::roblox_terrain_hex;

use super::js::{js_cos, js_hypot, js_max, js_sin, PI};
use super::object::{DecorObject, GroupBuilder};
use super::parts::lambert;
use super::relief::{
    gora_geometria, powierzchnia_reliefu_y, rotacja_dla_heksa, teren_material, wariant_dla_heksa,
    wzgorze_geometria, ReliefKind, LICZBA_WARIANTOW_TERENU,
};

/// `mat(color, flat = true)` (`:353-355`).
fn mat(color: u32) -> crate::core::scene::Material {
    lambert(color, true)
}

fn geo(m: crate::geom::Mesh) -> Arc<Geometry> {
    Arc::new(m.into())
}

/// `new THREE.CylinderGeometry(rt, rb, h, seg)` (other parameters default).
fn cyl(rt: f64, rb: f64, h: f64, seg: u32) -> Arc<Geometry> {
    geo(cylinder_geometry(rt, rb, h, seg, 1, false, 0.0, PI * 2.0))
}

/// `new THREE.ConeGeometry(r, h, seg)`.
fn cone(r: f64, h: f64, seg: u32) -> Arc<Geometry> {
    geo(cone_geometry(r, h, seg, 1, false, 0.0, PI * 2.0))
}

/// `new THREE.BoxGeometry(w, h, d)`.
fn boxg(w: f64, h: f64, d: f64) -> Arc<Geometry> {
    geo(box_geometry(w, h, d, 1, 1, 1))
}

fn mesh(g: Arc<Geometry>, color: u32, x: f64, y: f64, z: f64) -> SceneNode {
    let mut m = SceneNode::mesh(g, mat(color));
    m.position = Vec3::new(x, y, z);
    m
}

/// `decorVariant5(q, r, seed, salt)` (`:358-360`).
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn decor_variant5(q: i32, r: i32, seed: i32, salt: i32) -> usize {
    (hash2d(q, r, seed, salt) * 5.0).floor() as usize
}

// ---------------------------------------------------------------------------
// Tree colour variants (`:366-411`)

/// `TreeColorVariant` (`:366-372`).
#[derive(Clone, Copy)]
struct TreeColorVariant {
    is_pine: bool,
    trunk: u32,
    leaf1: u32,
    leaf2: u32,
    pine_layers: [u32; 4],
}

/// `TREE_VARIANTS` (`:375-411`).
const TREE_VARIANTS: [TreeColorVariant; 5] = [
    TreeColorVariant {
        is_pine: true,
        trunk: 0x8b_5a2b,
        leaf1: 0x3d_6b45,
        leaf2: 0x4a_7a52,
        pine_layers: [0x2d_4a32, 0x3d_6b45, 0x4a_7a52, 0x5a_8f5a],
    },
    TreeColorVariant {
        is_pine: true,
        trunk: 0x6a_5040,
        leaf1: 0x4a_6a58,
        leaf2: 0x5a_7a68,
        pine_layers: [0x3a_5a48, 0x4a_6a58, 0x5a_7a68, 0x6a_8a78],
    },
    TreeColorVariant {
        is_pine: false,
        trunk: 0x7a_5a32,
        leaf1: 0x5a_8f5a,
        leaf2: 0x6b_9f62,
        pine_layers: [0x2d_4a32, 0x3d_6b45, 0x4a_7a52, 0x5a_8f5a],
    },
    TreeColorVariant {
        is_pine: false,
        trunk: 0xc4_b498,
        leaf1: 0xa8_d4a0,
        leaf2: 0x8f_bf7a,
        pine_layers: [0x2d_4a32, 0x3d_6b45, 0x4a_7a52, 0x5a_8f5a],
    },
    TreeColorVariant {
        is_pine: false,
        trunk: 0x5a_4028,
        leaf1: 0x3d_6b45,
        leaf2: 0x2d_4a32,
        pine_layers: [0x2d_4a32, 0x3d_6b45, 0x4a_7a52, 0x5a_8f5a],
    },
];

/// `addRobloxTree(g, tx, tz, baseY, treeH, yaw, variant, lite)` (`:608-662`).
#[allow(clippy::too_many_arguments)]
fn add_roblox_tree(
    g: &mut GroupBuilder,
    tx: f64,
    tz: f64,
    base_y: f64,
    tree_h: f64,
    yaw: f64,
    v: &TreeColorVariant,
    lite: bool,
) {
    let sc = if lite { 1.12 } else { 1.45 };
    let trunk_h = HEX_R * (if v.is_pine { 0.28 } else { 0.22 }) * sc;
    let mut trunk = mesh(
        boxg(HEX_R * 0.07 * sc, trunk_h, HEX_R * 0.07 * sc),
        v.trunk,
        tx,
        base_y + trunk_h / 2.0,
        tz,
    );
    trunk.rotation.y = yaw;
    trunk.cast_shadow = !lite;
    g.add_leaf(trunk, 0);

    if v.is_pine {
        let layers = if lite { 2 } else { 4 };
        let cone_segs = if lite { 5 } else { 6 };
        for layer in 0..layers {
            let lf = f64::from(layer);
            let mut c = mesh(
                cone(
                    HEX_R * (0.28 - lf * 0.045) * sc,
                    HEX_R * 0.22 * sc,
                    cone_segs,
                ),
                v.pine_layers[layer as usize % 4],
                tx,
                base_y + trunk_h * 0.15 + lf * HEX_R * 0.14 * sc,
                tz,
            );
            c.rotation.y = yaw + lf * 0.2;
            c.cast_shadow = !lite;
            g.add_leaf(c, 0);
        }
        return;
    }

    let crowns: Vec<[f64; 4]> = if lite {
        vec![[0.0, tree_h * 0.38 * sc, 0.0, 0.22 * sc]]
    } else {
        vec![
            [0.0, tree_h * 0.38 * sc, 0.0, 0.26 * sc],
            [0.06 * sc, tree_h * 0.28 * sc, 0.04 * sc, 0.18 * sc],
            [-0.05 * sc, tree_h * 0.32 * sc, -0.03 * sc, 0.16 * sc],
        ]
    };
    for (ci, [ox, oy, oz, rad]) in crowns.into_iter().enumerate() {
        let mut c = mesh(
            geo(icosahedron_geometry(HEX_R * rad, 0)),
            if ci == 0 { v.leaf1 } else { v.leaf2 },
            tx + ox,
            base_y + trunk_h + oy,
            tz + oz,
        );
        c.cast_shadow = !lite;
        g.add_leaf(c, 0);
    }
}

/// `addRobloxPalm(g, tx, tz, baseY, yaw, lite, variant)` (`:665-696`).
#[allow(clippy::too_many_arguments)]
fn add_roblox_palm(
    g: &mut GroupBuilder,
    tx: f64,
    tz: f64,
    base_y: f64,
    yaw: f64,
    lite: bool,
    v: &TreeColorVariant,
) {
    let sc = if lite { 1.0 } else { 1.2 };
    let mut trunk = mesh(
        cyl(HEX_R * 0.035 * sc, HEX_R * 0.05 * sc, HEX_R * 0.48 * sc, 5),
        v.trunk,
        tx,
        base_y + HEX_R * 0.24 * sc,
        tz,
    );
    trunk.cast_shadow = !lite;
    g.add_leaf(trunk, 0);
    let frond_greens = [v.leaf2, v.leaf1, v.pine_layers[0]];
    let frond_count = if lite { 2 } else { 4 };
    for fi in 0..frond_count {
        let fa = yaw + (f64::from(fi) / 4.0) * PI * 2.0;
        let mut f = mesh(
            cone(HEX_R * 0.14 * sc, HEX_R * 0.24 * sc, 4),
            frond_greens[fi as usize % 3],
            tx + js_cos(fa) * HEX_R * 0.16 * sc,
            base_y + HEX_R * 0.5 * sc,
            tz + js_sin(fa) * HEX_R * 0.16 * sc,
        );
        f.rotation.z = 0.55;
        f.rotation.y = fa;
        f.cast_shadow = !lite;
        g.add_leaf(f, 0);
    }
}

/// `addRobloxJungleUmbrella(g, tx, tz, baseY, yaw, lite, variant)` (`:699-727`).
#[allow(clippy::too_many_arguments)]
fn add_roblox_jungle_umbrella(
    g: &mut GroupBuilder,
    tx: f64,
    tz: f64,
    base_y: f64,
    yaw: f64,
    lite: bool,
    v: &TreeColorVariant,
) {
    let sc = if lite { 1.0 } else { 1.25 };
    let trunk_h = HEX_R * 0.38 * sc;
    let mut trunk = mesh(
        cyl(HEX_R * 0.04 * sc, HEX_R * 0.055 * sc, trunk_h, 5),
        v.trunk,
        tx,
        base_y + trunk_h / 2.0,
        tz,
    );
    trunk.cast_shadow = !lite;
    g.add_leaf(trunk, 0);
    if !lite {
        let mut cap = mesh(
            cyl(HEX_R * 0.32 * sc, HEX_R * 0.28 * sc, HEX_R * 0.06 * sc, 6),
            v.leaf1,
            tx,
            base_y + trunk_h + HEX_R * 0.04 * sc,
            tz,
        );
        cap.rotation.y = yaw;
        cap.cast_shadow = true;
        g.add_leaf(cap, 0);
    }
}

// ---------------------------------------------------------------------------
// Climate (`map/gen-helpers.ts:176-221`), procedural maps (`isEarth = false`)

/// `CLIMATE_POLAR_FRAC` (`gen-helpers.ts:178`).
const CLIMATE_POLAR_FRAC: f64 = 0.05;
/// `CLIMATE_DESERT_HALF_ROWS` (`gen-helpers.ts:180`).
const CLIMATE_DESERT_HALF_ROWS: f64 = 3.5;
/// `CLIMATE_PLAINS_HALF_FRAC` (`gen-helpers.ts:184`).
const CLIMATE_PLAINS_HALF_FRAC: f64 = 0.075;
/// `CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC` (`gen-helpers.ts:187`).
const CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC: f64 = 0.05;

/// `ClimateZone` (`gen-helpers.ts:161`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ClimateZone {
    /// `'arid'`.
    Arid,
    /// `'tropical'`.
    Tropical,
    /// `'temperate'`.
    Temperate,
}

/// `climateZoneAt(q, r, height)` with `isEarth = false` (the only call of
/// the renderer, `mapRenderStyle.ts:773`): `climateBandAt` (`gen-helpers.ts:193-213`)
/// folded into zones (`:216-221`). `latitudinalOceanBufferRows(height, false)`
/// = `Math.max(2, Math.round(height * 0.05))` (`:228-231`).
#[must_use]
// `relR < 0 || relR > 1` kept literally: false for NaN, unlike `!contains`.
#[allow(clippy::manual_range_contains)]
pub fn climate_zone_at(r: i32, height: f64) -> ClimateZone {
    let buf = js_max(2.0, js_round(height * CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC));
    let inner_h = js_max(1.0, height - 2.0 * buf);
    let rel_r = (f64::from(r) - buf) / js_max(1.0, inner_h - 1.0);
    if rel_r < 0.0 || rel_r > 1.0 {
        return ClimateZone::Temperate; // polar_north / polar_south
    }
    let desert_half_frac = CLIMATE_DESERT_HALF_ROWS / inner_h;
    let center = 0.5;
    let desert_lo = center - desert_half_frac;
    let desert_hi = center + desert_half_frac;
    let plains_north_lo = desert_lo - CLIMATE_PLAINS_HALF_FRAC;
    let plains_south_hi = desert_hi + CLIMATE_PLAINS_HALF_FRAC;
    if rel_r < CLIMATE_POLAR_FRAC || rel_r < plains_north_lo {
        return ClimateZone::Temperate;
    }
    if rel_r < desert_lo {
        return ClimateZone::Tropical;
    }
    if rel_r < desert_hi {
        return ClimateZone::Arid;
    }
    if rel_r < plains_south_hi {
        return ClimateZone::Tropical;
    }
    ClimateZone::Temperate
}

/// `isWarmJungleForestHex(q, r, mapHeight)` (`:772-774`).
#[must_use]
pub fn is_warm_jungle_forest_hex(r: i32, map_height: f64) -> bool {
    climate_zone_at(r, map_height) == ClimateZone::Tropical
}

/// `forestTreeCountForHex(q, r, seed)` (`:767-769`).
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
pub fn forest_tree_count_for_hex(q: i32, r: i32, seed: i32) -> u32 {
    3 + (hash2d(q, r, seed, 1) * 3.0).floor() as u32
}

/// `jungleForestTreeCountForHex(q, r, seed)` (`:776-778`).
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
pub fn jungle_forest_tree_count_for_hex(q: i32, r: i32, seed: i32) -> u32 {
    5 + (hash2d(q, r, seed, 889) * 3.0).floor() as u32
}

/// `ForestParams` (`:597-606`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ForestParams {
    /// `q`.
    pub q: i32,
    /// `r`.
    pub r: i32,
    /// World `x`.
    pub x: f64,
    /// World `z`.
    pub z: f64,
    /// `baseY`.
    pub base_y: f64,
    /// Map seed.
    pub seed: i32,
    /// Hex radius.
    pub radius: f64,
    /// `mapHeight`.
    pub map_height: f64,
}

/// `buildStyleForestCluster('roblox', p, lite)` (`:781-810`).
#[must_use]
pub fn build_style_forest_cluster(p: &ForestParams, lite: bool) -> DecorObject {
    let mut root = GroupBuilder::new();
    let (q, r, x, z, base_y, seed) = (p.q, p.r, p.x, p.z, p.base_y, p.seed);
    let jungle = is_warm_jungle_forest_hex(r, p.map_height);
    let tree_count = if jungle {
        jungle_forest_tree_count_for_hex(q, r, seed)
    } else {
        forest_tree_count_for_hex(q, r, seed)
    };
    let hex_tree_bias = decor_variant5(q, r, seed, 300);
    for ti in 0..tree_count {
        #[allow(clippy::cast_possible_wrap)]
        let t = ti as i32;
        let angle = hash2d(q, r, seed, 10 + t) * PI * 2.0;
        let spread = (0.12 + hash2d(q, r, seed, 40 + t) * 0.36) * p.radius;
        let tx = x + js_cos(angle) * spread;
        let tz = z + js_sin(angle) * spread;
        let tree_h = 0.26 + hash2d(q, r, seed, 70 + t) * 0.30;
        let yaw = hash2d(q, r, seed, 100 + t) * PI * 2.0;
        let v = &TREE_VARIANTS[(hex_tree_bias + ti as usize) % 5];
        if jungle {
            let kind = hash2d(q, r, seed, 160 + t);
            if kind > 0.66 {
                add_roblox_palm(&mut root, tx, tz, base_y, yaw, lite, v);
            } else if kind > 0.33 {
                add_roblox_jungle_umbrella(&mut root, tx, tz, base_y, yaw, lite, v);
            } else {
                add_roblox_tree(&mut root, tx, tz, base_y, tree_h, yaw, v, lite);
            }
        } else {
            add_roblox_tree(&mut root, tx, tz, base_y, tree_h, yaw, v, lite);
        }
    }
    root.finish()
}

/// `PeakParams` (`:812-820`) / `HillParams` (`:875-883`) (`topY` / `baseY`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ReliefParams {
    /// `q`.
    pub q: i32,
    /// `r`.
    pub r: i32,
    /// World `x`.
    pub x: f64,
    /// World `z`.
    pub z: f64,
    /// `topY` (peak) / `baseY` (hill).
    pub y: f64,
    /// Map seed.
    pub seed: i32,
    /// Hex radius (unused by the roblox branch, kept for the signature).
    pub radius: f64,
}

fn relief_group(p: &ReliefParams, g: Arc<Geometry>) -> DecorObject {
    let mut root = GroupBuilder::new();
    root.group_mut().position = Vec3::new(p.x, 0.0, p.z);
    let mut m = SceneNode::mesh(g, teren_material());
    m.position = Vec3::new(0.0, p.y, 0.0);
    m.rotation.y = rotacja_dla_heksa(p.q, p.r, p.seed);
    m.cast_shadow = true;
    m.receive_shadow = true;
    root.add_leaf(m, 0);
    root.finish()
}

/// `buildStyleMountainPeak('roblox', p, lite)` (`:822-873`): a group at
/// `(x, 0, z)` with the shared mountain mesh of variant `wariantDlaHeksa`
/// at `topY`, rotated by `rotacjaDlaHeksa` (`lite` has no effect).
#[must_use]
#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
pub fn build_style_mountain_peak(p: &ReliefParams) -> DecorObject {
    let w = wariant_dla_heksa(p.q, p.r, LICZBA_WARIANTOW_TERENU, p.seed) as i32;
    relief_group(p, gora_geometria(w))
}

/// `buildStyleHillBump('roblox', p, lite)` (`:1003-1026`).
#[must_use]
#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
pub fn build_style_hill_bump(p: &ReliefParams) -> DecorObject {
    let w = wariant_dla_heksa(p.q, p.r, LICZBA_WARIANTOW_TERENU, p.seed) as i32;
    relief_group(p, wzgorze_geometria(w))
}

/// `addSteppedTerraceHill(g, p, 'roblox', lite, 'cultivated')` (`:886-985`),
/// `p.y` = `baseY`. The `'natural'` mode is used only by the minecraft hill
/// (`:1023-1024`; the roblox hill is the relief mesh), so it is not ported.
fn add_stepped_terrace_hill(g: &mut GroupBuilder, p: &ReliefParams, lite: bool) {
    let (q, r, x, z, base_y, seed, rr) = (p.q, p.r, p.x, p.z, p.y, p.seed, p.radius);
    let tiers = if lite { 3 } else { 5 };
    let yaw = (hash2d(q, r, seed, 4) * 6.0).floor() * (PI / 3.0);
    let (wall_color, wall_dk, grass_a, grass_b) = (0xc4_a574, 0xa0_8050, 0x55_ee55, 0x44_cc55);
    let face_color = wall_dk;
    let mut radius = rr * 0.9;
    let mut y = base_y;
    for i in 0..tiers {
        let wall_h = 0.048 + if i == 0 { 0.012 } else { 0.0 };
        let mut wall = mesh(
            cyl(radius, radius * 1.03, wall_h, 6),
            if i % 2 == 1 { wall_color } else { wall_dk },
            x,
            y + wall_h / 2.0,
            z,
        );
        wall.rotation.y = yaw;
        wall.cast_shadow = true;
        wall.receive_shadow = true;
        g.add_leaf(wall, 0);

        let top_h = 0.028;
        let top_r = radius * 0.86;
        let top_col = if i == tiers - 1 {
            grass_a
        } else if i % 2 == 1 {
            grass_b
        } else {
            grass_a
        };
        let mut top = mesh(
            cyl(top_r, top_r, top_h, 6),
            top_col,
            x,
            y + wall_h + top_h / 2.0,
            z,
        );
        top.rotation.y = yaw;
        top.cast_shadow = true;
        top.receive_shadow = true;
        g.add_leaf(top, 0);

        if !lite && i >= 1 {
            let mut face = mesh(
                boxg(radius * 0.92, wall_h * 1.15, 0.07),
                face_color,
                x + js_cos(yaw) * radius * 0.52,
                y + wall_h / 2.0,
                z + js_sin(yaw) * radius * 0.52,
            );
            face.rotation.y = yaw;
            face.cast_shadow = true;
            g.add_leaf(face, 0);
        }

        y += wall_h + top_h;
        radius *= 0.74;
    }

    if !lite {
        #[allow(clippy::cast_possible_truncation)]
        let shrub_count = 1 + (hash2d(q, r, seed, 8) * 2.0).floor() as i32;
        for si in 0..shrub_count {
            let angle = yaw + hash2d(q, r, seed, 200 + si) * 0.8 - 0.4;
            let spread = hash2d(q, r, seed, 230 + si) * rr * 0.22;
            let sx = x + js_cos(angle) * spread;
            let sz = z + js_sin(angle) * spread;
            let b = rr * 0.07;
            let mut shrub = mesh(boxg(b, b * 1.3, b), 0x2d_8a27, sx, y + b * 0.5, sz);
            shrub.cast_shadow = true;
            g.add_leaf(shrub, 0);
        }
    }
}

/// `buildStyleTarasyTerrace('roblox', lite, R)` (`:988-1000`): the stepped
/// mound in `'cultivated'` mode at the origin with seed 17.
#[must_use]
pub fn build_style_tarasy_terrace(lite: bool, radius: f64) -> DecorObject {
    let mut g = GroupBuilder::new();
    add_stepped_terrace_hill(
        &mut g,
        &ReliefParams {
            q: 0,
            r: 0,
            x: 0.0,
            z: 0.0,
            y: 0.0,
            seed: 17,
            radius,
        },
        lite,
    );
    g.finish()
}

/// `reliefSurfaceSampler(teren, q, r, seed, R)` (`:1107-1121`) as a value:
/// `None` for flat terrain.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ReliefSampler {
    kind: ReliefKind,
    wariant: i32,
    rot_y: f64,
    radius: f64,
}

impl ReliefSampler {
    /// `reliefSurfaceSampler(teren, q, r, seed, R)`.
    #[must_use]
    #[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
    pub fn new(teren: Terrain, q: i32, r: i32, seed: i32, radius: f64) -> Option<Self> {
        let kind = match teren {
            Terrain::Gory => ReliefKind::Gora,
            Terrain::Wzgorza => ReliefKind::Wzgorze,
            _ => return None,
        };
        Some(Self {
            kind,
            wariant: wariant_dla_heksa(q, r, LICZBA_WARIANTOW_TERENU, seed) as i32,
            rot_y: rotacja_dla_heksa(q, r, seed),
            radius,
        })
    }

    /// The returned closure: `powierzchniaReliefuY(typ, wariant, rotY, x / R, z / R) * R`.
    #[must_use]
    pub fn sample(&self, x: f64, z: f64) -> f64 {
        powierzchnia_reliefu_y(
            self.kind,
            self.wariant,
            self.rot_y,
            x / self.radius,
            z / self.radius,
        ) * self.radius
    }
}

/// `{ group, surfaceY }` of the gallery pads.
#[derive(Clone, Debug, PartialEq)]
pub struct Mount {
    /// `group`.
    pub group: DecorObject,
    /// `surfaceY`.
    pub surface_y: f64,
}

/// `buildGalleryBuildingPad(teren, x, hexTopY, z, R, wide)` (`:1127-1160`).
#[must_use]
pub fn build_gallery_building_pad(
    teren: Terrain,
    x: f64,
    hex_top_y: f64,
    z: f64,
    radius: f64,
    wide: bool,
) -> Mount {
    let mut g = GroupBuilder::new();
    let gory = teren == Terrain::Gory;
    let pad_h = if gory { 0.16 } else { 0.14 };
    let top_col = if gory {
        0x88_99aa
    } else {
        style_terrain_color(teren, MapRenderStyle::Roblox)
    };
    let rim_col = if gory { 0x6a_7380 } else { 0x3a_9e42 };
    let top_r = radius * (if wide { 0.99 } else { 0.94 });
    let bot_r = radius * (if wide { 1.0 } else { 0.98 });
    let mut pad = mesh(
        cyl(top_r, bot_r, pad_h, 6),
        top_col,
        x,
        hex_top_y + pad_h / 2.0,
        z,
    );
    pad.cast_shadow = true;
    pad.receive_shadow = true;
    g.add_leaf(pad, 0);
    let mut rim = mesh(
        cyl(radius * 0.97, radius * 1.0, pad_h * 0.32, 6),
        rim_col,
        x,
        hex_top_y + pad_h * 0.18,
        z,
    );
    rim.cast_shadow = true;
    g.add_leaf(rim, 0);
    Mount {
        group: g.finish(),
        surface_y: hex_top_y + pad_h,
    }
}

/// `buildGalleryFortMount(teren, x, hexTopY, z, R)` (`:1163-1217`); any
/// terrain other than `Wzgorza` takes the mountain branch, like the web.
#[must_use]
pub fn build_gallery_fort_mount(
    teren: Terrain,
    x: f64,
    hex_top_y: f64,
    z: f64,
    radius: f64,
) -> Mount {
    let mut g = GroupBuilder::new();
    if teren == Terrain::Wzgorza {
        let pad_h = 0.08;
        let top_r = radius * 0.50;
        let grass = style_terrain_color(Terrain::Wzgorza, MapRenderStyle::Roblox);
        let mut pad = mesh(
            cyl(top_r, top_r * 1.04, pad_h, 6),
            grass,
            x,
            hex_top_y + pad_h / 2.0,
            z,
        );
        pad.cast_shadow = true;
        pad.receive_shadow = true;
        g.add_leaf(pad, 0);
        let mut rim = mesh(
            cyl(top_r * 1.02, top_r * 1.08, pad_h * 0.35, 6),
            0x3a_9e42,
            x,
            hex_top_y + pad_h * 0.22,
            z,
        );
        rim.cast_shadow = true;
        g.add_leaf(rim, 0);
        return Mount {
            group: g.finish(),
            surface_y: hex_top_y + pad_h,
        };
    }
    let pad_h = 0.11;
    let top_r = radius * 0.44;
    let mut embed = mesh(
        cyl(top_r * 1.15, top_r * 1.28, pad_h * 0.5, 6),
        0x5a_6270,
        x,
        hex_top_y + pad_h * 0.25,
        z,
    );
    embed.cast_shadow = true;
    embed.receive_shadow = true;
    g.add_leaf(embed, 0);
    let mut shelf = mesh(
        cyl(top_r, top_r * 0.88, pad_h * 0.5, 6),
        0x88_99aa,
        x,
        hex_top_y + pad_h * 0.72,
        z,
    );
    shelf.cast_shadow = true;
    shelf.receive_shadow = true;
    g.add_leaf(shelf, 0);
    Mount {
        group: g.finish(),
        surface_y: hex_top_y + pad_h,
    }
}

/// `buildStyleBeachRing('roblox', x, topY, z, R)` (`:1220-1232`).
#[must_use]
pub fn build_style_beach_ring(x: f64, top_y: f64, z: f64, radius: f64) -> DecorObject {
    let mut g = GroupBuilder::new();
    let mut ring = mesh(
        cyl(radius * 0.92, radius * 0.96, radius * 0.045, 6),
        COAST_SAND_ROBLOX,
        x,
        top_y + radius * 0.022,
        z,
    );
    ring.receive_shadow = true;
    g.add_leaf(ring, 0);
    g.finish()
}

/// `buildStyleCoastSandTopCap('roblox', x, topY, z, R, lite)` (`:1415-1434`):
/// a single mesh, `renderOrder = 2`.
#[must_use]
pub fn build_style_coast_sand_top_cap(
    x: f64,
    top_y: f64,
    z: f64,
    radius: f64,
    lite: bool,
) -> DecorObject {
    let cap_h = if lite { radius * 0.048 } else { radius * 0.058 };
    let mut cap = mesh(
        cyl(radius * 0.90, radius * 0.93, cap_h, 6),
        COAST_SAND_ROBLOX,
        x,
        top_y + cap_h * 0.52 + 0.012,
        z,
    );
    cap.receive_shadow = true;
    cap.cast_shadow = !lite;
    let mut o = DecorObject::new(cap);
    o.meta[0].render_order = 2;
    o
}

/// `CoastSandParams` (`:1239-1248`).
#[derive(Clone, Copy, Debug)]
pub struct CoastSandParams<'a> {
    /// `map.hexes` terrain lookup.
    pub map: &'a TerrainAt,
    /// `q`.
    pub q: i32,
    /// `r`.
    pub r: i32,
    /// World `x`.
    pub x: f64,
    /// World `z`.
    pub z: f64,
    /// `topY`.
    pub top_y: f64,
    /// Hex radius.
    pub radius: f64,
    /// Terrain of this hex (`self`).
    pub teren: Terrain,
}

/// Unit direction to neighbour `(lq, lr)` and its `Math.atan2(nx, nz)`.
fn edge_dir(x: f64, z: f64, lq: i32, lr: i32, radius: f64) -> (f64, f64, f64) {
    let (wx, wz) = axial_to_world(HexCoord::new(lq, lr), radius);
    let dx = wx - x;
    let dz = wz - z;
    let d = js_hypot(dx, dz);
    let dist = if d == 0.0 || d.is_nan() { 1.0 } else { d };
    let nx = dx / dist;
    let nz = dz / dist;
    (nx, nz, nx.atan2(nz))
}

fn terrain_at(map: &TerrainAt, q: i32, r: i32) -> Option<Terrain> {
    map.get(&HexCoord::new(q, r)).copied()
}

/// `buildStyleLandCoastSandCap('roblox', p, lite)` (`:1656-1702`):
/// `renderOrder = 3` on every strip.
#[must_use]
pub fn build_style_land_coast_sand_cap(p: &CoastSandParams<'_>, lite: bool) -> DecorObject {
    let mut g = GroupBuilder::new();
    if !p.teren.is_dry_land() {
        return g.finish();
    }
    let rr = p.radius;
    let apothem = rr * (sqrt3() / 2.0);
    let edge_len = rr * 1.02;
    let strip_depth = rr * LAND_COAST_SAND_FRAC;
    let strip_h = if lite { rr * 0.010 } else { rr * 0.013 };
    let flush_lift = 0.002;
    for (dq, dr) in AXIAL_NEIGHBORS {
        let (lq, lr) = (p.q + dq, p.r + dr);
        if terrain_at(p.map, lq, lr) != Some(Terrain::PlytkieMorze) {
            continue;
        }
        let (nx, nz, yaw) = edge_dir(p.x, p.z, lq, lr, rr);
        let edge_dist = apothem;
        let ex = p.x + nx * (edge_dist - strip_depth * 0.52);
        let ez = p.z + nz * (edge_dist - strip_depth * 0.52);
        let mut sand = mesh(
            boxg(edge_len, strip_h, strip_depth),
            COAST_SAND_ROBLOX,
            ex,
            p.top_y + flush_lift + strip_h * 0.5,
            ez,
        );
        sand.rotation.y = yaw;
        sand.receive_shadow = true;
        sand.cast_shadow = false;
        g.add_leaf(sand, 3);
    }
    g.finish()
}

/// River-mouth edges `(land, coast)` from `computeRiverMouthEdgeKeys`
/// (`crate::terrain::coast::river_mouth_edges`).
pub type MouthEdges = HashSet<(HexCoord, HexCoord)>;

/// `buildStyleCoastSandEdges('roblox', p, lite, mouthEdges)` (`:1753-1801`).
/// The web computes `mouthEdges` from `map.riverPaths` when omitted; here the
/// caller passes it (from [`crate::terrain::coast::river_mouth_edges`]).
#[must_use]
pub fn build_style_coast_sand_edges(
    p: &CoastSandParams<'_>,
    lite: bool,
    mouth_edges: &MouthEdges,
) -> DecorObject {
    let mut g = GroupBuilder::new();
    let rr = p.radius;
    let apothem = rr * (sqrt3() / 2.0);
    let edge_len = rr * 1.02;
    let strip_depth = if lite { rr * 0.10 } else { rr * 0.12 };
    let strip_h = rr * 0.065;
    for (dq, dr) in AXIAL_NEIGHBORS {
        let (lq, lr) = (p.q + dq, p.r + dr);
        let nb = terrain_at(p.map, lq, lr);
        // coastEdgeNeedsSand(self, nb) (`:1707-1710`)
        let needs = p.teren == Terrain::PlytkieMorze && nb.is_some_and(Terrain::is_dry_land);
        if !needs {
            continue;
        }
        if mouth_edges.contains(&(HexCoord::new(lq, lr), HexCoord::new(p.q, p.r))) {
            continue;
        }
        let (nx, nz, yaw) = edge_dir(p.x, p.z, lq, lr, rr);
        let edge_dist = apothem;
        let ex = p.x + nx * (edge_dist + strip_depth * 0.48);
        let ez = p.z + nz * (edge_dist + strip_depth * 0.48);
        let mut sand = mesh(
            boxg(edge_len, strip_h, strip_depth),
            COAST_SAND_ROBLOX,
            ex,
            p.top_y + strip_h * 0.52 + 0.014,
            ez,
        );
        sand.rotation.y = yaw;
        sand.receive_shadow = true;
        sand.cast_shadow = !lite;
        g.add_leaf(sand, 3);
    }
    g.finish()
}

/// Options of `buildStyleCoastWaterCap` (`:1813`).
#[derive(Clone, Copy, Debug, Default)]
pub struct CoastWaterOpts<'a> {
    /// `lite`.
    pub lite: bool,
    /// `deltaKeys`.
    pub delta_keys: Option<&'a HashSet<HexCoord>>,
    /// `isDelta` (wins over `deltaKeys`).
    pub is_delta: Option<bool>,
}

/// `buildStyleCoastWaterCap('roblox', map, q, r, x, z, seaTopY, R, opts)`
/// (`:1804-1913`); `mouthEdges` passed explicitly (see
/// [`build_style_coast_sand_edges`]).
#[must_use]
#[allow(clippy::too_many_arguments, clippy::too_many_lines)]
pub fn build_style_coast_water_cap(
    map: &TerrainAt,
    q: i32,
    r: i32,
    x: f64,
    z: f64,
    sea_top_y: f64,
    radius: f64,
    opts: &CoastWaterOpts<'_>,
    mouth_edges: &MouthEdges,
) -> DecorObject {
    let mut g = GroupBuilder::new();
    let lite = opts.lite;
    let water_color = roblox_terrain_hex(Terrain::PlytkieMorze);
    let rr = radius;
    let apothem = rr * (sqrt3() / 2.0);
    let edge_len = rr * 1.04;
    let is_delta = opts
        .is_delta
        .or_else(|| opts.delta_keys.map(|k| k.contains(&HexCoord::new(q, r))))
        .unwrap_or(false);
    let strip_depth = if is_delta { rr * 0.62 } else { rr * 0.50 };
    let strip_h = if lite { 0.028 } else { 0.038 };

    if !is_delta {
        let mut base_pool = mesh(
            cyl(rr * 0.91, rr * 0.93, strip_h * 1.15, 6),
            water_color,
            x,
            sea_top_y + strip_h * 0.55,
            z,
        );
        base_pool.receive_shadow = true;
        g.add_leaf(base_pool, 0);
    }

    for (dq, dr) in AXIAL_NEIGHBORS {
        let (lq, lr) = (q + dq, r + dr);
        if terrain_at(map, lq, lr) != Some(Terrain::Morze) {
            continue;
        }
        if mouth_edges.contains(&(HexCoord::new(lq, lr), HexCoord::new(q, r))) {
            continue;
        }
        let (nx, nz, yaw) = edge_dir(x, z, lq, lr, rr);
        let ex = x + nx * (apothem + strip_depth * 0.42);
        let ez = z + nz * (apothem + strip_depth * 0.42);
        let mut water = mesh(
            boxg(edge_len, strip_h, strip_depth),
            water_color,
            ex,
            sea_top_y + strip_h * 0.52 + 0.014,
            ez,
        );
        water.rotation.y = yaw;
        water.receive_shadow = true;
        g.add_leaf(water, 1);
    }

    if is_delta {
        let mut lagoon = mesh(
            cyl(rr * 0.86, rr * 0.88, strip_h * 1.35, 6),
            water_color,
            x,
            sea_top_y + strip_h * 0.58 + 0.012,
            z,
        );
        lagoon.receive_shadow = true;
        g.add_leaf(lagoon, 1);

        let mut best_sea: Option<(f64, f64)> = None;
        let mut best_score = f64::NEG_INFINITY;
        for (dq, dr) in AXIAL_NEIGHBORS {
            if terrain_at(map, q + dq, r + dr) != Some(Terrain::Morze) {
                continue;
            }
            let (wx, wz) = axial_to_world(HexCoord::new(q + dq, r + dr), rr);
            let dx = wx - x;
            let dz = wz - z;
            let d = js_hypot(dx, dz);
            let dist = if d == 0.0 || d.is_nan() { 1.0 } else { d };
            let score = 1.0 / dist;
            if score > best_score {
                best_score = score;
                best_sea = Some((dx / dist, dz / dist));
            }
        }
        if let Some((nx, nz)) = best_sea {
            let tongue_len = rr * 1.22;
            let tongue_w = rr * 0.78;
            let ex = x + nx * (apothem + tongue_len * 0.44);
            let ez = z + nz * (apothem + tongue_len * 0.44);
            let mut tongue = mesh(
                boxg(tongue_w, strip_h * 1.25, tongue_len),
                water_color,
                ex,
                sea_top_y + strip_h * 0.58 + 0.014,
                ez,
            );
            tongue.rotation.y = nx.atan2(nz);
            tongue.receive_shadow = true;
            g.add_leaf(tongue, 1);
        }
    }
    g.finish()
}

/// `buildStyleDune('roblox', q, r, x, z, baseY, seed, R)` (`:1915-1942`):
/// `None` for ~66 % of hexes (`hash2D(…, 9) >= 0.34`).
#[must_use]
#[allow(clippy::too_many_arguments)]
pub fn build_style_dune(
    q: i32,
    r: i32,
    x: f64,
    z: f64,
    base_y: f64,
    seed: i32,
    radius: f64,
) -> Option<DecorObject> {
    if hash2d(q, r, seed, 9) >= 0.34 {
        return None;
    }
    let mut g = GroupBuilder::new();
    let dune_h = 0.06 + hash2d(q, r, seed, 11) * 0.10;
    let dune_w = 0.7 + hash2d(q, r, seed, 12) * 0.5;
    let d_ang = hash2d(q, r, seed, 13) * PI * 2.0;
    let d_off = hash2d(q, r, seed, 14) * radius * 0.25;
    let px = x + js_cos(d_ang) * d_off;
    let pz = z + js_sin(d_ang) * d_off;
    let mut dune = mesh(
        geo(icosahedron_geometry(radius * 0.35 * dune_w, 0)),
        0xff_d54a,
        px,
        base_y + dune_h,
        pz,
    );
    dune.scale.y = dune_h / 0.25;
    dune.cast_shadow = true;
    g.add_leaf(dune, 0);
    Some(g.finish())
}

/// `buildStyleOasis('roblox', x, z, baseY, R, palmCount, rnd)` (`:1944-1996`).
#[must_use]
pub fn build_style_oasis(
    x: f64,
    z: f64,
    base_y: f64,
    radius: f64,
    palm_count: u32,
    rnd: &mut dyn FnMut() -> f64,
) -> DecorObject {
    let mut g = GroupBuilder::new();
    let mut pool = mesh(
        cyl(radius * 0.35, radius * 0.35, radius * 0.04, 16),
        0x00_bfff,
        x,
        base_y + radius * 0.02,
        z,
    );
    pool.receive_shadow = true;
    g.add_leaf(pool, 0);
    for _ in 0..palm_count {
        let palm_angle = rnd() * PI * 2.0;
        let palm_dist = radius * (0.30 + rnd() * 0.15);
        let px = x + js_cos(palm_angle) * palm_dist;
        let pz = z + js_sin(palm_angle) * palm_dist;
        let mut trunk = mesh(
            cyl(radius * 0.035, radius * 0.05, radius * 0.5, 5),
            0x8b_5a2b,
            px,
            base_y + radius * 0.27,
            pz,
        );
        trunk.cast_shadow = true;
        g.add_leaf(trunk, 0);
        for fi in 0..4 {
            let fa = (f64::from(fi) / 4.0) * PI * 2.0;
            let mut frond = mesh(
                cone(radius * 0.12, radius * 0.22, 4),
                0x33_dd55,
                px + js_cos(fa) * radius * 0.15,
                base_y + radius * 0.52,
                pz + js_sin(fa) * radius * 0.15,
            );
            frond.rotation = Euler::xyz(0.0, fa, 0.6);
            g.add_leaf(frond, 0);
        }
    }
    g.finish()
}
