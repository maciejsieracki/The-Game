//! Terrain pick scene: the meshes the web puts into `terrainPickMeshes`
//! (`scene.ts:3684`) — hex prisms per terrain type plus the instanced
//! mountain / hill solids — with the same heights, instance order and
//! `Float32` instance matrices, and `unitRenderer.topYAt` for the plane
//! fallback.
//!
//! Sources (web `edb8fb56`): `render/mapRenderStyle.ts:163-195, 211-243,
//! 1235-1263`, `render/scene.ts:166-170, 578-580, 1563-1576, 1702-1790,
//! 1852-1872, 2088-2089, 2213, 2246-2309, 2414-2430, 2462-2480, 2717-2727,
//! 3088-3098, 3139, 3684`, `render/units.ts:214-217, 6409-6412`,
//! `render/teren-gory-wzgorza.ts:100-126`, types `types/hex.ts:12-24`.
//! Only the `roblox` map style exists here (D-RR-8 = A).

use std::collections::HashMap;

use super::hex::{axial_to_world, HexCoord, HEX_R};
use super::raycast::{InstancedPickMesh, Side, TriGeometry};
use super::three::{Mat4, Quat, Vec3};
use crate::jsmath::{js_cos, js_sin};

/// `TerenBazowy`, in declaration order (= `Object.values(TerenBazowy)`,
/// which fixes the order of the prism meshes, `scene.ts:1768-1769`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Terrain {
    /// `laka` (grassland).
    Laka,
    /// `rownina` (plains).
    Rownina,
    /// `wzgorza` (hills).
    Wzgorza,
    /// `gory` (mountains).
    Gory,
    /// `plytkie_morze` (shallow sea, "Wybrzeże").
    PlytkieMorze,
    /// `morze` (sea).
    Morze,
    /// `pustynia` (desert).
    Pustynia,
    /// `polarny` (polar).
    Polarny,
}

impl Terrain {
    /// All variants in `TerenBazowy` order.
    pub const ALL: [Self; 8] = [
        Self::Laka,
        Self::Rownina,
        Self::Wzgorza,
        Self::Gory,
        Self::PlytkieMorze,
        Self::Morze,
        Self::Pustynia,
        Self::Polarny,
    ];

    /// Web string value (`'laka'`, `'plytkie_morze'`, ...).
    #[must_use]
    pub fn from_web_id(id: &str) -> Option<Self> {
        Some(match id {
            "laka" => Self::Laka,
            "rownina" => Self::Rownina,
            "wzgorza" => Self::Wzgorza,
            "gory" => Self::Gory,
            "plytkie_morze" => Self::PlytkieMorze,
            "morze" => Self::Morze,
            "pustynia" => Self::Pustynia,
            "polarny" => Self::Polarny,
            _ => return None,
        })
    }

    /// `isDryLandTeren` (`scene.ts:578-580`, `mapRenderStyle.ts` twin).
    #[must_use]
    pub fn is_dry_land(self) -> bool {
        !matches!(self, Self::Morze | Self::PlytkieMorze)
    }

    /// `ROBLOX_TERRAIN_VIS[t].height` (`mapRenderStyle.ts:211-222`).
    #[must_use]
    pub fn roblox_height(self) -> f64 {
        match self {
            Self::Morze | Self::PlytkieMorze => 0.30,
            Self::Laka => 0.38,
            Self::Rownina => 0.40,
            Self::Pustynia | Self::Wzgorza => 0.42,
            Self::Gory => 0.46,
            Self::Polarny => 0.36,
        }
    }

    /// `TERRAIN_SURFACE_Y[t]` (`mapRenderStyle.ts:163-195`), evaluated with
    /// the same left-to-right additions.
    #[must_use]
    pub fn surface_y(self) -> f64 {
        let flat = SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA;
        match self {
            Self::Morze => SEA_SURFACE_TOP_Y,
            Self::PlytkieMorze => WYBRZEZE_SURFACE_TOP_Y,
            Self::Laka | Self::Rownina | Self::Pustynia | Self::Polarny => flat,
            Self::Wzgorza => SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.18,
            Self::Gory => SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.32,
        }
    }

    /// `terrainVisualForStyle(t, 'roblox', ·)` → `(height, yOffset)`
    /// (`mapRenderStyle.ts:226-243`): `yOffset = topY - height`.
    #[must_use]
    pub fn visual(self) -> (f64, f64) {
        let height = self.roblox_height();
        if self.is_dry_land() {
            // extraLift = 0 in the roblox style.
            let top_y = self.surface_y() + 0.0;
            (height, top_y - height)
        } else {
            (height, self.surface_y() - height)
        }
    }

    /// `vis.height + vis.yOffset`: the nominal prism top. This is also
    /// `unitRenderer.topYAt` (`units.ts:214-217`) used by the plane
    /// fallback — note it ignores `coastalDrop` and is 0.22 for
    /// `PlytkieMorze`, whose drawn prism top is 0.18 (P4-3 §3.6).
    #[must_use]
    pub fn top_y(self) -> f64 {
        let (h, yo) = self.visual();
        h + yo
    }
}

/// `SEA_SURFACE_TOP_Y` (`mapRenderStyle.ts:163`).
pub const SEA_SURFACE_TOP_Y: f64 = 0.18;
/// `WYBRZEZE_SURFACE_TOP_Y` (`mapRenderStyle.ts:167`).
pub const WYBRZEZE_SURFACE_TOP_Y: f64 = 0.22;
/// `LAND_MIN_CLEARANCE_ABOVE_SEA` (`mapRenderStyle.ts:169`).
pub const LAND_MIN_CLEARANCE_ABOVE_SEA: f64 = 0.28;
/// Prism radius factor of the roblox style (`scene.ts:1774`): neighbouring
/// prisms overlap by 0.8 %.
pub const ROBLOX_PRISM_RADIUS_FACTOR: f64 = 1.008;
/// Beach drop of the prism top for dry land touching `PlytkieMorze`
/// (`scene.ts:2252-2255`, factor of `R`).
pub const COASTAL_DROP_FACTOR: f64 = 0.045;
/// `LICZBA_WARIANTOW_TERENU` (`teren-gory-wzgorza.ts:84`).
pub const TERRAIN_SOLID_VARIANTS: usize = 5;

/// `AXIAL_NEIGHBORS` (`mapRenderStyle.ts:1235`).
const AXIAL_NEIGHBORS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// `hashHeksa` (`teren-gory-wzgorza.ts:100-109`) with `Math.imul` / `>>>`
/// semantics (bit patterns are identical in `u32` wrapping arithmetic).
#[must_use]
#[allow(clippy::cast_sign_loss)] // ToInt32 → ToUint32 reinterpretation is the point
pub fn hash_heksa(q: i32, r: i32, seed: i32, salt: i32) -> f64 {
    let mut h = (q as u32).wrapping_mul(0x27d4_eb2d)
        ^ (r as u32).wrapping_mul(0x1656_67b1)
        ^ (seed as u32).wrapping_mul(0x9e37_79b1)
        ^ (salt as u32).wrapping_mul(0x85eb_ca6b);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2c1b_3c6d);
    h ^= h >> 12;
    f64::from(h) / 4_294_967_296.0
}

/// `wariantDlaHeksa(q, r, n, seed)` (salt 911).
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // floor of [0, n)
pub fn wariant_dla_heksa(q: i32, r: i32, n: usize, seed: i32) -> usize {
    #[allow(clippy::cast_precision_loss)]
    let nf = n as f64;
    (hash_heksa(q, r, seed, 911) * nf).floor() as usize
}

/// `rotacjaDlaHeksa(q, r, seed)`: a multiple of 60° (salt 613).
#[must_use]
pub fn rotacja_dla_heksa(q: i32, r: i32, seed: i32) -> f64 {
    (hash_heksa(q, r, seed, 613) * 6.0).floor() * (std::f64::consts::PI / 3.0)
}

/// `new CylinderGeometry(radius, radius, height, 6, 1)` with the bottom
/// cap removed from the index (`hexPrismNoBottomGeo`, `scene.ts:1563-1576`).
/// Positions keep the bottom-cap vertices, as in the web (they still feed
/// the bounding sphere).
#[must_use]
#[allow(clippy::cast_possible_truncation)] // Float32BufferAttribute store
pub fn hex_prism_no_bottom(radius: f64, height: f64) -> TriGeometry {
    const RADIAL: u32 = 6;
    let theta_length = std::f64::consts::PI * 2.0;
    let half_height = height / 2.0;
    let mut pos: Vec<f32> = Vec::new();
    let mut idx: Vec<u32> = Vec::new();
    let mut push = |x: f64, y: f64, z: f64| {
        pos.push(x as f32);
        pos.push(y as f32);
        pos.push(z as f32);
    };
    // generateTorso (radiusTop == radiusBottom, heightSegments = 1).
    let mut rows: [[u32; RADIAL as usize + 1]; 2] = [[0; RADIAL as usize + 1]; 2];
    let mut index = 0u32;
    for (yi, row) in rows.iter_mut().enumerate() {
        let v = f64::from(u32::try_from(yi).unwrap_or(0)) / 1.0;
        // v * (radiusBottom - radiusTop) + radiusTop == radius exactly (difference is 0).
        let r = radius;
        for (xi, slot) in row.iter_mut().enumerate() {
            let u = f64::from(u32::try_from(xi).unwrap_or(0)) / f64::from(RADIAL);
            let theta = u * theta_length + 0.0;
            let (sin_t, cos_t) = (js_sin(theta), js_cos(theta));
            push(r * sin_t, -v * height + half_height, r * cos_t);
            *slot = index;
            index += 1;
        }
    }
    for x in 0..RADIAL as usize {
        let a = rows[0][x];
        let b = rows[1][x];
        let c = rows[1][x + 1];
        let d = rows[0][x + 1];
        idx.extend_from_slice(&[a, b, d, b, c, d]);
    }
    // generateCap(top) then generateCap(bottom); bottom indices dropped.
    for (top, sign) in [(true, 1.0f64), (false, -1.0f64)] {
        let center_start = index;
        for _ in 0..RADIAL {
            push(0.0, half_height * sign, 0.0);
            index += 1;
        }
        let center_end = index;
        for x in 0..=RADIAL {
            let u = f64::from(x) / f64::from(RADIAL);
            let theta = u * theta_length + 0.0;
            let (cos_t, sin_t) = (js_cos(theta), js_sin(theta));
            push(radius * sin_t, half_height * sign, radius * cos_t);
            index += 1;
        }
        if top {
            for x in 0..RADIAL {
                let c = center_start + x;
                let i = center_end + x;
                idx.extend_from_slice(&[i, i + 1, c]);
            }
        }
    }
    TriGeometry::new(pos, Some(idx))
}

/// One hex of the map, in the web's `Object.values(map.hexes)` order.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct MapHex {
    /// Axial coordinate.
    pub coord: HexCoord,
    /// `terenBazowy`.
    pub terrain: Terrain,
    /// Prism hidden by fog (`ZERO_MATRIX`, unknown hex); hides its solid too.
    pub prism_hidden: bool,
    /// Solid hidden although the prism is visible (city on the hex,
    /// `hideDecorAtHex`, `scene.ts:3181-3183`).
    pub solid_hidden: bool,
    /// Hill carries the `tarasy` improvement: no hill solid is placed
    /// (`scene.ts:2465-2466`).
    pub terraces: bool,
}

/// Shared mountain / hill geometries (`goraGeometria(v)`,
/// `wzgorzeGeometria(v)`, 5 variants each). Built by the model library
/// (RR-T4/RR-T7); tests load them from the web reference fixture.
#[derive(Clone, Debug, PartialEq)]
pub struct TerrainSolids {
    /// `goraGeometria(0..5)`.
    pub gora: Vec<TriGeometry>,
    /// `wzgorzeGeometria(0..5)`.
    pub wzgorze: Vec<TriGeometry>,
}

/// Options of [`build_terrain_pick_scene`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TerrainSceneOptions {
    /// `map.seed` after `ToInt32` (`seed | 0` in `hashHeksa`).
    pub seed: i32,
    /// `zoomFlags.styledDecor` (`scene.ts:3371-3373`): solids visible.
    pub solids_visible: bool,
}

/// What a terrain pick mesh contains.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TerrainMeshKind {
    /// Hex prisms of one terrain type.
    Prism(Terrain),
    /// Mountain solid variant.
    Gora(usize),
    /// Hill solid variant.
    Wzgorze(usize),
}

/// The terrain pick list plus `topYAt`.
#[derive(Clone, Debug, PartialEq)]
pub struct TerrainPickScene {
    /// `terrainPickMeshes`, in web order.
    pub meshes: Vec<InstancedPickMesh>,
    /// Kind of each mesh in [`Self::meshes`].
    pub kinds: Vec<TerrainMeshKind>,
    top_y: HashMap<HexCoord, f64>,
}

impl TerrainPickScene {
    /// `unitRenderer.topYAt(q, r)` (`units.ts:6409-6412`): nominal prism top
    /// of an existing hex (fog does not matter), 0 outside the map.
    #[must_use]
    pub fn top_y_at(&self, h: HexCoord) -> f64 {
        self.top_y.get(&h).copied().unwrap_or(0.0)
    }
}

fn instance_matrix(position: Vec3, yaw: f64) -> [f32; 16] {
    // dummy.position / rotation.set(0, yaw, 0) / scale(1,1,1) / updateMatrix().
    let q = Quat::from_euler_xyz(0.0, yaw, 0.0);
    Mat4::compose(position, q, Vec3::new(1.0, 1.0, 1.0)).to_f32()
}

/// `ZERO_MATRIX = new Matrix4().makeScale(0, 0, 0)` (`scene.ts:3139`).
#[must_use]
pub fn zero_matrix() -> [f32; 16] {
    Mat4::make_scale(0.0, 0.0, 0.0).to_f32()
}

/// Builds the terrain pick scene like `buildScene` (roblox style) followed
/// by fog / city hiding and the LOD visibility of the solids.
///
/// `solids = None` corresponds to `styledTerrain == false` (no solids).
///
/// # Panics
/// When `solids` does not hold exactly [`TERRAIN_SOLID_VARIANTS`]
/// geometries of each kind.
#[must_use]
pub fn build_terrain_pick_scene(
    hexes: &[MapHex],
    solids: Option<&TerrainSolids>,
    opts: TerrainSceneOptions,
) -> TerrainPickScene {
    if let Some(s) = solids {
        assert!(
            s.gora.len() == TERRAIN_SOLID_VARIANTS && s.wzgorze.len() == TERRAIN_SOLID_VARIANTS,
            "expected {TERRAIN_SOLID_VARIANTS} solid variants of each kind"
        );
    }
    let terrain_at: HashMap<HexCoord, Terrain> =
        hexes.iter().map(|h| (h.coord, h.terrain)).collect();
    let coast_sand_needed = |h: &MapHex| -> bool {
        // landCoastSandNeeded (mapRenderStyle.ts:1257-1263)
        h.terrain.is_dry_land()
            && AXIAL_NEIGHBORS.iter().any(|(dq, dr)| {
                terrain_at.get(&HexCoord::new(h.coord.q + dq, h.coord.r + dr))
                    == Some(&Terrain::PlytkieMorze)
            })
    };

    // Prism meshes: one per terrain type present, in TerenBazowy order.
    let mut meshes: Vec<InstancedPickMesh> = Vec::new();
    let mut kinds: Vec<TerrainMeshKind> = Vec::new();
    let mut mesh_of: HashMap<Terrain, usize> = HashMap::new();
    for t in Terrain::ALL {
        if !hexes.iter().any(|h| h.terrain == t) {
            continue;
        }
        let (height, _) = t.visual();
        mesh_of.insert(t, meshes.len());
        meshes.push(InstancedPickMesh {
            geometry: hex_prism_no_bottom(HEX_R * ROBLOX_PRISM_RADIUS_FACTOR, height),
            side: Side::Front,
            visible: true,
            matrices: Vec::new(),
            hexes: Vec::new(),
        });
        kinds.push(TerrainMeshKind::Prism(t));
    }
    let first_solid = meshes.len();
    if let Some(s) = solids {
        for (kind, geos) in [(0usize, &s.gora), (1usize, &s.wzgorze)] {
            for (v, g) in geos.iter().enumerate() {
                meshes.push(InstancedPickMesh {
                    geometry: g.clone(),
                    side: Side::Front,
                    visible: opts.solids_visible,
                    matrices: Vec::new(),
                    hexes: Vec::new(),
                });
                kinds.push(if kind == 0 {
                    TerrainMeshKind::Gora(v)
                } else {
                    TerrainMeshKind::Wzgorze(v)
                });
            }
        }
    }

    let (sea_h, sea_yo) = Terrain::Morze.visual();
    let sea_surface_y = sea_h + sea_yo;
    let mut top_y = HashMap::new();
    for h in hexes {
        let t = h.terrain;
        let (height, y_offset) = t.visual();
        let (x, z) = axial_to_world(h.coord, HEX_R);
        let coastal_drop = if coast_sand_needed(h) {
            HEX_R * COASTAL_DROP_FACTOR
        } else {
            0.0
        };
        let surface_top_y = height + y_offset - coastal_drop;
        let mut y = surface_top_y - height / 2.0;
        if !t.is_dry_land() {
            y = sea_surface_y - height / 2.0;
        }
        top_y.insert(h.coord, height + y_offset);

        let prism = &mut meshes[mesh_of[&t]];
        prism.matrices.push(if h.prism_hidden {
            zero_matrix()
        } else {
            instance_matrix(Vec3::new(x, y, z), 0.0)
        });
        prism.hexes.push(Some(h.coord));

        let Some(_) = solids else { continue };
        let solid_mesh = match t {
            Terrain::Gory => Some(0usize),
            Terrain::Wzgorza if !h.terraces => Some(1usize),
            _ => None,
        };
        if let Some(kind) = solid_mesh {
            let top = height + y_offset;
            let v = wariant_dla_heksa(h.coord.q, h.coord.r, TERRAIN_SOLID_VARIANTS, opts.seed);
            let m = &mut meshes[first_solid + kind * TERRAIN_SOLID_VARIANTS + v];
            m.matrices.push(if h.prism_hidden || h.solid_hidden {
                zero_matrix()
            } else {
                instance_matrix(
                    Vec3::new(x, top, z),
                    rotacja_dla_heksa(h.coord.q, h.coord.r, opts.seed),
                )
            });
            m.hexes.push(Some(h.coord));
        }
    }
    TerrainPickScene {
        meshes,
        kinds,
        top_y,
    }
}
