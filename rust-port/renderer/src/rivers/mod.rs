//! River ribbons on the map (R3 of `P4-1G-ADAPTER-ROZPOZNANIE.md` §4,
//! topic R-RUSTPORT-P4-1-R3-RIVER-RIBBONS).
//!
//! Port of the river part of `buildScene` (pin `07d2fbd72`,
//! `gra/src/render/scene.ts:2860-2995`) and of the helpers it calls:
//! land ribbons along the inner side of the hex walls ([`land`],
//! `scene.ts:1124-1441`), the ribbon geometry ([`ribbon`], `:385-460`), the
//! per-hex wall walk ([`edges`], `:466-1104`) and the river mouths
//! ([`coast`], `:626-887`).
//!
//! Inputs are renderer types only (decision D-DTO-1 = A: the engine produces
//! the DTO, the renderer builds geometry): the terrain per hex, the river
//! paths with kinds (`MapViewDto.rivers`), the render paths
//! (`MapViewDto.river_render_paths`, the web `landPath` of `scene.ts:1312-1318`
//! computed by the engine) and the delta hexes (`computeRiverDeltaHexKeys`,
//! [`crate::terrain::coast::river_delta_hexes`], computed once per scene by
//! the caller, `scene.ts:2094`). No game rule and no game state is read.
//!
//! `Hex.rzeka.krawedzie` (`MapViewDto.hexes[].rzeka_krawedzie`) has **no**
//! consumer in the web renderer: `scene.ts:1263-1264` says the edges stay for
//! the game logic and the render goes along the full path, and nothing else
//! in `render/` reads them (`git grep -n krawedzie 07d2fbd72 -- gra/src/render`).
//! The per-hex edges of the ribbon are derived from consecutive hexes of the
//! render path ([`edges::river_corners_along_hex_edges`]).
//!
//! What is not here: the `THREE.Mesh` objects and `scene.add` (the entries
//! carry geometry, material class and render order as data, like
//! [`crate::decor::river_lod`]), the frame yielding of the chunked build, and
//! the fog/LOD index of the entries (already in [`crate::decor::river_lod`]).

pub mod coast;
pub mod edges;
pub mod land;
pub mod ribbon;

use std::collections::HashSet;

use crate::core::map_style::{
    coast_water_cap_top_y, river_surface_lift_y, style_scene_palette, style_terrain_color,
    terrain_surface_top_y, MapRenderStyle,
};
use crate::decor::river_lod::KeySet;
use crate::geom::Mesh;
use crate::pick::hex::HexCoord;
use crate::pick::terrain::Terrain;
use crate::scene::{Material, MaterialKind, Side};
use crate::terrain::coast::TerrainAt;
use crate::terrain::color::Color;
use crate::terrain::{RiverKind, RiverPath};

use coast::{render_coastal_river_extension, MouthBuckets};
use land::{render_land_rivers_from_paths, LandRiverOpts, LandRiverPath};

/// `RIVER_MAIN_HALF_WIDTH = R * 0.052` (`scene.ts:2891`).
pub const RIVER_MAIN_HALF_WIDTH_FRAC: f64 = 0.052;
/// `LAND_RIVER_RENDER_ORDER` (`scene.ts:2894`).
pub const LAND_RIVER_RENDER_ORDER: i32 = 55;
/// `RIVER_MOUTH_RENDER_ORDER` (`scene.ts:2897`).
pub const RIVER_MOUTH_RENDER_ORDER: i32 = 58;
/// Render order of the estuary funnels (`coastDeltaBucket`, `scene.ts:2924, 2961`).
pub const COAST_DELTA_RENDER_ORDER: i32 = 50;
/// `RIVER_BATCH_PATHS_DENSE` (`scene.ts:1472`).
pub const RIVER_BATCH_PATHS_DENSE: usize = 128;
/// Default of `getRiverRenderStage()` (`scene.ts:1531`: main + medium).
pub const DEFAULT_RIVER_RENDER_STAGE: u8 = 2;
/// `emissive` of `riverWaterMat` in the roblox style (`scene.ts:2007`).
pub const RIVER_WATER_EMISSIVE_ROBLOX: u32 = 0x0022_88dd;
/// `emissiveIntensity` of `riverWaterMat` (`scene.ts:2008`).
pub const RIVER_WATER_EMISSIVE_INTENSITY: f64 = 0.65;

/// Web hex key `` `${q},${r}` ``.
#[must_use]
pub fn hex_key(h: HexCoord) -> String {
    format!("{},{}", h.q, h.r)
}

/// Material class of a river entry: the two materials of the river code.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum RiverMaterialKind {
    /// `riverWaterMat` (`scene.ts:2005-2017`).
    Water,
    /// `coastDeltaMat` (`scene.ts:2024-2029`).
    CoastDelta,
}

/// Material parameters of a river material. [`Material`] has no
/// `emissiveIntensity` and no `fog` flag, so they are kept next to it.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RiverMaterial {
    /// `MeshLambertMaterial` parameters.
    pub material: Material,
    /// `emissiveIntensity` (three default `1`).
    pub emissive_intensity: f64,
    /// `fog` (`false`: ribbons ignore `scene.fog`, `scene.ts:2014-2016, 2027`).
    pub fog: bool,
}

/// The parameters of [`RiverMaterialKind`] in the game style (roblox,
/// D-RR-8 = A).
#[must_use]
pub fn river_material(kind: RiverMaterialKind) -> RiverMaterial {
    match kind {
        // scene.ts:2005-2017: color palette.river (mapRenderStyle.ts:568, roblox
        // 0x6aadbe — NOT the unused constant RIVER_COLOR 0x5fb4e8 of scene.ts:161),
        // emissive 0x2288dd × 0.65, DoubleSide, depthWrite, polygonOffset 2/2, fog off.
        RiverMaterialKind::Water => {
            let mut m = Material::lambert(style_scene_palette(MapRenderStyle::Roblox).river);
            m.emissive = Color::from_hex(RIVER_WATER_EMISSIVE_ROBLOX);
            m.side = Side::Double;
            m.depth_write = true;
            m.polygon_offset = Some((2.0, 2.0));
            RiverMaterial {
                material: m,
                emissive_intensity: RIVER_WATER_EMISSIVE_INTENSITY,
                fog: false,
            }
        }
        // scene.ts:2024-2029: color styleTerrainColor(PlytkieMorze, roblox), DoubleSide, fog off.
        RiverMaterialKind::CoastDelta => {
            let mut m = Material::new(
                MaterialKind::Lambert,
                Some(style_terrain_color(
                    Terrain::PlytkieMorze,
                    MapRenderStyle::Roblox,
                )),
            );
            m.side = Side::Double;
            RiverMaterial {
                material: m,
                emissive_intensity: 1.0,
                fog: false,
            }
        }
    }
}

/// One `RiverEntry` (`scene.ts:247-275`) without the `THREE.Mesh`: one mesh
/// of river geometry with its fog bookkeeping.
#[derive(Clone, Debug, PartialEq)]
pub struct RiverEntry {
    /// `waterGeo` (= `bankGeo`, the web stores the same geometry twice).
    pub geometry: Mesh,
    /// `mesh.material`.
    pub material: RiverMaterialKind,
    /// `mesh.renderOrder`.
    pub render_order: i32,
    /// `hexKeys`.
    pub hex_keys: KeySet,
    /// `merged` (more than one source geometry).
    pub merged: bool,
    /// `pointHex` (single-ribbon land entries).
    pub point_hex: Option<Vec<String>>,
    /// `segPointHex` (land batches, one list per ribbon).
    pub seg_point_hex: Option<Vec<Vec<String>>>,
}

/// `riverMouthY` (`scene.ts:2886-2888`): above the top of the coast water cap
/// and of the `PlytkieMorze` prism.
#[must_use]
pub fn river_mouth_y(radius: f64) -> f64 {
    let cap_top_y = coast_water_cap_top_y(MapRenderStyle::Roblox);
    let coast_prism_top_y =
        terrain_surface_top_y(Terrain::PlytkieMorze, MapRenderStyle::Roblox, 0.0);
    (cap_top_y + radius * 0.026).max(coast_prism_top_y + radius * 0.035)
}

/// Indices of the rivers drawn at `stage` (`scene.ts:2864-2877` with
/// `filterRiverPathsForStage`, `:1534-1558`): `0` none, `1` main, `2` +medium,
/// `3`/`4` +short/tributary, `≥ 5` all (no filter). A missing kind is `'main'`.
#[must_use]
pub fn river_indices_for_stage(rivers: &[RiverPath], stage: u8) -> Vec<usize> {
    if stage >= 5 {
        return (0..rivers.len()).collect();
    }
    if stage == 0 {
        return Vec::new();
    }
    let allowed = |k: RiverKind| match k {
        RiverKind::Main => true,
        RiverKind::Medium => stage >= 2,
        RiverKind::Short | RiverKind::Tributary => stage >= 3,
    };
    rivers
        .iter()
        .enumerate()
        .filter(|(_, r)| allowed(r.kind.unwrap_or(RiverKind::Main)))
        .map(|(i, _)| i)
        .collect()
}

/// Input of [`build_river_ribbons`].
#[derive(Clone, Copy, Debug)]
pub struct RiverRibbonInput<'a> {
    /// Hex radius `R` (`HEX_R` in the game, `scene.ts:1612`).
    pub radius: f64,
    /// Terrain per hex (`map.hexes[k].terenBazowy`).
    pub terrain: &'a TerrainAt,
    /// `map.riverPaths` with `riverPathKinds` (`MapViewDto.rivers`).
    pub rivers: &'a [RiverPath],
    /// `MapViewDto.river_render_paths`, 1:1 with `rivers`.
    pub render_paths: &'a [Vec<HexCoord>],
    /// `computeRiverDeltaHexKeys(map)` (`scene.ts:2094`).
    pub delta_hexes: &'a HashSet<HexCoord>,
    /// River render stage (`getRiverRenderStage()`, default
    /// [`DEFAULT_RIVER_RENDER_STAGE`]).
    pub stage: u8,
    /// `isRiverRenderFast(hexCount, map)` (`scene.ts:1606`,
    /// [`crate::core::map_style::is_river_render_fast`]).
    pub river_render_fast: bool,
    /// `isSceneBuildFastPath(hexCount)` (`scene.ts:1605`).
    pub scene_build_fast: bool,
}

/// Output of [`build_river_ribbons`].
#[derive(Clone, Debug, PartialEq)]
pub struct RiverRibbons {
    /// `riverEntries` in creation order (land ribbons, then mouths).
    pub entries: Vec<RiverEntry>,
    /// `riverHexKeys` (hexes of the land ribbons, `scene.ts:2914`).
    pub river_hex_keys: KeySet,
}

/// Inconsistent input of [`build_river_ribbons`].
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RiverRibbonError {
    /// `render_paths` is not 1:1 with `rivers`.
    RenderPathCount {
        /// `rivers.len()`.
        rivers: usize,
        /// `render_paths.len()`.
        render_paths: usize,
    },
}

impl std::fmt::Display for RiverRibbonError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::RenderPathCount {
                rivers,
                render_paths,
            } => {
                write!(
                    f,
                    "river_render_paths has {render_paths} entries for {rivers} rivers"
                )
            }
        }
    }
}

impl std::error::Error for RiverRibbonError {}

/// Land-ribbon options of `buildScene` (`scene.ts:2899-2912`): the dense
/// batching and decimation when `river_render_fast`, the defaults otherwise.
#[must_use]
pub fn scene_land_river_opts(
    radius: f64,
    river_render_fast: bool,
    scene_build_fast: bool,
) -> LandRiverOpts {
    if river_render_fast {
        LandRiverOpts {
            batch_size: RIVER_BATCH_PATHS_DENSE,
            tributary_decimate_dist: Some(radius * if scene_build_fast { 0.10 } else { 0.065 }),
        }
    } else {
        LandRiverOpts::default()
    }
}

/// Mouth ribbons of every main river that reaches the sea (`scene.ts:2918-2992`):
/// one set of buckets per river, or (when `river_render_fast`) three shared
/// buckets flushed at the end; flush order funnel, water, delta top.
#[must_use]
pub fn render_coastal_mouths(
    input: &RiverRibbonInput<'_>,
    indices: &[usize],
    river_mouth_y: f64,
) -> Vec<RiverEntry> {
    let radius = input.radius;
    let main_half_width = radius * RIVER_MAIN_HALF_WIDTH_FRAC;
    let dedup = if input.river_render_fast {
        radius * if input.scene_build_fast { 0.045 } else { 0.032 }
    } else {
        radius * 0.02
    };
    let mut entries = Vec::new();
    let mut agg = input.river_render_fast.then(MouthBuckets::new);
    for &i in indices {
        let river = &input.rivers[i];
        let path = river.hexes.as_slice();
        if path.len() < 2 || river.kind.unwrap_or(RiverKind::Main) != RiverKind::Main {
            continue;
        }
        if !land::path_reaches_open_sea_render(input.terrain, path) {
            continue;
        }
        let mut own = MouthBuckets::new();
        let buckets = agg.as_mut().unwrap_or(&mut own);
        render_coastal_river_extension(
            input.terrain,
            path,
            radius,
            river_mouth_y,
            buckets,
            main_half_width,
            input.delta_hexes,
            Some(dedup),
        );
        if agg.is_none() {
            own.flush_into(&mut entries);
        }
    }
    if let Some(a) = agg {
        a.flush_into(&mut entries);
    }
    entries
}

/// Land ribbons of the rivers at `indices` (`scene.ts:2899-2914`).
#[must_use]
pub fn render_land_rivers(
    input: &RiverRibbonInput<'_>,
    indices: &[usize],
    river_mouth_y: f64,
    opts: LandRiverOpts,
) -> land::LandRivers {
    let paths: Vec<LandRiverPath<'_>> = indices
        .iter()
        .map(|&i| LandRiverPath {
            source: &input.rivers[i].hexes,
            kind: input.rivers[i].kind,
            render: &input.render_paths[i],
        })
        .collect();
    render_land_rivers_from_paths(
        input.terrain,
        &paths,
        input.radius,
        river_mouth_y,
        river_surface_lift_y(input.radius),
        input.radius * RIVER_MAIN_HALF_WIDTH_FRAC,
        LAND_RIVER_RENDER_ORDER,
        opts,
    )
}

/// The river meshes of `buildScene` (`scene.ts:2860-2995`).
///
/// # Errors
/// [`RiverRibbonError::RenderPathCount`] when `render_paths` is not 1:1 with
/// `rivers`.
pub fn build_river_ribbons(input: &RiverRibbonInput<'_>) -> Result<RiverRibbons, RiverRibbonError> {
    if input.render_paths.len() != input.rivers.len() {
        return Err(RiverRibbonError::RenderPathCount {
            rivers: input.rivers.len(),
            render_paths: input.render_paths.len(),
        });
    }
    let mut out = RiverRibbons {
        entries: Vec::new(),
        river_hex_keys: KeySet::default(),
    };
    if input.stage == 0 {
        return Ok(out);
    }
    let indices = river_indices_for_stage(input.rivers, input.stage);
    let mouth_y = river_mouth_y(input.radius);
    let opts = scene_land_river_opts(
        input.radius,
        input.river_render_fast,
        input.scene_build_fast,
    );
    let land = render_land_rivers(input, &indices, mouth_y, opts);
    out.entries = land.entries;
    out.river_hex_keys = land.land_hex_keys;
    out.entries
        .extend(render_coastal_mouths(input, &indices, mouth_y));
    Ok(out)
}
