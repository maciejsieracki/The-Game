//! `render/mapRenderStyle.ts` (web `edb8fb56`, 1 996 LOC) **without the
//! builders**: styles and quality presets, surface heights, terrain colours
//! and the scene palette, the deterministic per-hex decor counts, and the
//! decor surface heights that do not need a model geometry.
//!
//! Reused, not redefined (P4.10/P4.11):
//! - [`Terrain`] (`TerenBazowy`), `TERRAIN_SURFACE_Y` (= [`Terrain::surface_y`]),
//!   the roblox `terrainVisualForStyle` (= [`Terrain::visual`]),
//!   `SEA_SURFACE_TOP_Y`, `WYBRZEZE_SURFACE_TOP_Y`,
//!   `LAND_MIN_CLEARANCE_ABOVE_SEA` (`crate::pick::terrain`);
//! - `MAP_DETAIL_MEDIUM_HEX_THRESHOLD`, `LARGE_MAP_LITE_HEX_THRESHOLD`,
//!   the roblox `robloxLite` rule (= [`roblox_lite`]), `TERRAIN_ROBLOX`
//!   (= [`roblox_terrain_hex`]), `deepOcean`/`frame` of the roblox palette,
//!   `MapDetailQuality` (here also [`QualityTier`]) (`crate::terrain`);
//! - `LAND_COAST_SAND_FRAC`, `COAST_SAND_ROBLOX` (`crate::terrain::coast`);
//! - `hash2D` of this file is the same function as `hashHeksa` of
//!   `teren-gory-wzgorza.ts` (identical operations, `mapRenderStyle.ts:345-351`
//!   vs `teren-gory-wzgorza.ts:101-110`) = [`hash_heksa`].
//!
//! Out of scope (MOD-03 decor topic): every `build*` function, the coast
//! instance collectors (P4.11 has them), `isWarmJungleForestHex` (needs
//! `map/gen-helpers` climate zones) and `reliefSurfaceSampler` (needs the
//! relief geometry of `teren-gory-wzgorza.ts`).

pub use crate::pick::terrain::{
    hash_heksa, wariant_dla_heksa, Terrain, LAND_MIN_CLEARANCE_ABOVE_SEA, SEA_SURFACE_TOP_Y,
    TERRAIN_SOLID_VARIANTS, WYBRZEZE_SURFACE_TOP_Y,
};
pub use crate::terrain::coast::{COAST_SAND_ROBLOX, LAND_COAST_SAND_FRAC};
pub use crate::terrain::{
    roblox_lite, roblox_terrain_hex, MapDetailQuality as QualityTier, LARGE_MAP_LITE_HEX_THRESHOLD,
    MAP_DETAIL_MEDIUM_HEX_THRESHOLD, PALETTE_DEEP_OCEAN, PALETTE_FRAME,
};

use super::jsnum::js_to_fixed3;

// ---------------------------------------------------------------------------
// Styles, options, presets (`mapRenderStyle.ts:16-160`)

/// `MapRenderStyle` (`mapRenderStyle.ts:16`). Only `Roblox` is used by the
/// game (D-RR-8 = A); the other two are kept because the palette / height
/// functions are total over the type.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MapRenderStyle {
    /// `'civ'`.
    Civ,
    /// `'roblox'` (the game style).
    Roblox,
    /// `'minecraft'`.
    Minecraft,
}

impl MapRenderStyle {
    /// All styles.
    pub const ALL: [Self; 3] = [Self::Civ, Self::Roblox, Self::Minecraft];

    /// Web string.
    #[must_use]
    pub fn web_id(self) -> &'static str {
        match self {
            Self::Civ => "civ",
            Self::Roblox => "roblox",
            Self::Minecraft => "minecraft",
        }
    }

    /// From the web string.
    #[must_use]
    pub fn from_web_id(s: &str) -> Option<Self> {
        Some(match s {
            "civ" => Self::Civ,
            "roblox" => Self::Roblox,
            "minecraft" => Self::Minecraft,
            _ => return None,
        })
    }
}

/// Web string of a [`QualityTier`].
#[must_use]
pub fn quality_web_id(q: QualityTier) -> &'static str {
    match q {
        QualityTier::Low => "low",
        QualityTier::Medium => "medium",
        QualityTier::High => "high",
    }
}

/// [`QualityTier`] from the web string.
#[must_use]
pub fn quality_from_web_id(s: &str) -> Option<QualityTier> {
    Some(match s {
        "low" => QualityTier::Low,
        "medium" => QualityTier::Medium,
        "high" => QualityTier::High,
        _ => return None,
    })
}

/// Web string of a [`Terrain`] (`TerenBazowy` value, `types/hex.ts:12-24`).
#[must_use]
pub fn terrain_web_id(t: Terrain) -> &'static str {
    match t {
        Terrain::Laka => "laka",
        Terrain::Rownina => "rownina",
        Terrain::Wzgorza => "wzgorza",
        Terrain::Gory => "gory",
        Terrain::PlytkieMorze => "plytkie_morze",
        Terrain::Morze => "morze",
        Terrain::Pustynia => "pustynia",
        Terrain::Polarny => "polarny",
    }
}

/// `PreviewViewport` (`mapRenderStyle.ts:22-28`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct PreviewViewport {
    /// `width`.
    pub width: f64,
    /// `height`.
    pub height: f64,
    /// `panelColumns?`.
    pub panel_columns: Option<f64>,
}

/// `MapRenderOptions` (`mapRenderStyle.ts:30-37`) without
/// `sharedRenderer` (a WebGL handle; the GPU layer owns the device here).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct MapRenderOptions {
    /// `style`.
    pub style: MapRenderStyle,
    /// `renderQuality`.
    pub render_quality: QualityTier,
    /// `mapDetailQuality`.
    pub map_detail_quality: QualityTier,
    /// `previewViewport?`.
    pub preview_viewport: Option<PreviewViewport>,
}

/// `GAME_MAP_RENDER_STYLE` (`mapRenderStyle.ts:40`).
pub const GAME_MAP_RENDER_STYLE: MapRenderStyle = MapRenderStyle::Roblox;

/// `DEFAULT_MAP_RENDER_OPTIONS` (`mapRenderStyle.ts:43-47`).
pub const DEFAULT_MAP_RENDER_OPTIONS: MapRenderOptions = MapRenderOptions {
    style: GAME_MAP_RENDER_STYLE,
    render_quality: QualityTier::Medium,
    map_detail_quality: QualityTier::High,
    preview_viewport: None,
};

/// `SCENE_BUILD_FAST_HEX_THRESHOLD` (`mapRenderStyle.ts:54`).
pub const SCENE_BUILD_FAST_HEX_THRESHOLD: usize = 32_000;

/// `isSceneBuildFastPath(hexCount)` (`mapRenderStyle.ts:57-59`).
#[must_use]
pub fn is_scene_build_fast_path(hex_count: usize) -> bool {
    hex_count >= SCENE_BUILD_FAST_HEX_THRESHOLD
}

/// `isDenseLandmassMap(map)` (`mapRenderStyle.ts:75-86`). The web reads only
/// `map.riverPaths?.length` (`river_paths`, 0 when absent) and the
/// `terenBazowy` of every hex (`hexes`, in any order).
#[must_use]
#[allow(clippy::cast_precision_loss)] // hex counts are far below 2^53
pub fn is_dense_landmass_map(river_paths: usize, hexes: &[Terrain]) -> bool {
    if river_paths >= 120 {
        return true;
    }
    if river_paths < 80 {
        return false;
    }
    let land = hexes.iter().filter(|t| t.is_dry_land()).count();
    land as f64 / (hexes.len().max(1)) as f64 > 0.50
}

/// `isRiverRenderFast(hexCount, map)` (`mapRenderStyle.ts:62-64`).
#[must_use]
pub fn is_river_render_fast(hex_count: usize, river_paths: usize, hexes: &[Terrain]) -> bool {
    is_scene_build_fast_path(hex_count) || is_dense_landmass_map(river_paths, hexes)
}

/// `isSceneBuildAggressive` (`mapRenderStyle.ts:67-69`, deprecated alias).
#[must_use]
pub fn is_scene_build_aggressive(hex_count: usize, river_paths: usize, hexes: &[Terrain]) -> bool {
    is_river_render_fast(hex_count, river_paths, hexes)
}

/// `ResolvedRenderPreset` (`mapRenderStyle.ts:88-95`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ResolvedRenderPreset {
    /// Simpler meshes (GPU cost), not a logical map layer.
    pub roblox_lite: bool,
    /// MSAA.
    pub antialias: bool,
    /// Max device pixel ratio.
    pub pixel_ratio_max: f64,
    /// Shadow maps on.
    pub shadows_enabled: bool,
    /// Shadow map size.
    pub shadow_map_size: u32,
    /// Scene fog `far` multiplier.
    pub fog_far_mul: f64,
}

/// The partial object form of the `normalizeMapRenderOptions` input.
#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct PartialMapRenderOptions {
    /// `style?`.
    pub style: Option<MapRenderStyle>,
    /// `renderQuality?`.
    pub render_quality: Option<QualityTier>,
    /// `mapDetailQuality?`.
    pub map_detail_quality: Option<QualityTier>,
    /// `previewViewport?`.
    pub preview_viewport: Option<PreviewViewport>,
}

/// `input?: MapRenderStyle | MapRenderOptions`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum MapRenderOptionsInput {
    /// A bare style string.
    Style(MapRenderStyle),
    /// An options object (missing fields allowed).
    Options(PartialMapRenderOptions),
}

/// `normalizeMapRenderOptions(input?)` (`mapRenderStyle.ts:97-112`).
#[must_use]
pub fn normalize_map_render_options(input: Option<&MapRenderOptionsInput>) -> MapRenderOptions {
    match input {
        None => DEFAULT_MAP_RENDER_OPTIONS,
        Some(MapRenderOptionsInput::Style(style)) => MapRenderOptions {
            style: *style,
            ..DEFAULT_MAP_RENDER_OPTIONS
        },
        Some(MapRenderOptionsInput::Options(o)) => MapRenderOptions {
            style: o.style.unwrap_or(GAME_MAP_RENDER_STYLE),
            render_quality: o.render_quality.unwrap_or(QualityTier::Medium),
            map_detail_quality: o.map_detail_quality.unwrap_or(QualityTier::High),
            preview_viewport: o.preview_viewport,
        },
    }
}

/// `resolveRenderPreset(options, hexCount)` (`mapRenderStyle.ts:114-160`).
/// `robloxLite` is the existing [`roblox_lite`] rule for the roblox style and
/// `false` otherwise.
#[must_use]
pub fn resolve_render_preset(options: &MapRenderOptions, hex_count: usize) -> ResolvedRenderPreset {
    let roblox_lite = options.style == MapRenderStyle::Roblox
        && roblox_lite(options.map_detail_quality, hex_count);
    match options.render_quality {
        QualityTier::Low => ResolvedRenderPreset {
            roblox_lite,
            antialias: false,
            pixel_ratio_max: 1.0,
            shadows_enabled: false,
            shadow_map_size: 512,
            fog_far_mul: 0.72,
        },
        QualityTier::High => ResolvedRenderPreset {
            roblox_lite,
            antialias: true,
            pixel_ratio_max: 2.0,
            shadows_enabled: true,
            shadow_map_size: 1024,
            fog_far_mul: 1.0,
        },
        QualityTier::Medium => ResolvedRenderPreset {
            roblox_lite,
            antialias: false,
            pixel_ratio_max: 1.5,
            shadows_enabled: false,
            shadow_map_size: 1024,
            fog_far_mul: 0.9,
        },
    }
}

// ---------------------------------------------------------------------------
// Heights (`mapRenderStyle.ts:163-343`)

/// `RIVER_LIFT_ABOVE_TERRAIN_FRAC` (`mapRenderStyle.ts:175`).
pub const RIVER_LIFT_ABOVE_TERRAIN_FRAC: f64 = 0.08;

/// `riverSurfaceLiftY(R)` (`mapRenderStyle.ts:177-179`).
#[must_use]
pub fn river_surface_lift_y(radius: f64) -> f64 {
    radius * RIVER_LIFT_ABOVE_TERRAIN_FRAC
}

/// `FLAT_LAND_SURFACE_Y` (`mapRenderStyle.ts:182`).
pub const FLAT_LAND_SURFACE_Y: f64 = SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA;

/// `TERRAIN_SURFACE_Y[t]` (`mapRenderStyle.ts:185-194`) = [`Terrain::surface_y`].
#[must_use]
pub fn terrain_surface_y(t: Terrain) -> f64 {
    t.surface_y()
}

/// `LAND_HEX_Y_LIFT` (`mapRenderStyle.ts:200`, deprecated; still the `civ`
/// style lift of `terrainVisualForStyle`).
pub const LAND_HEX_Y_LIFT: f64 = 0.05;
/// `PUSTYNIA_EXTRA_Y_LIFT` (`mapRenderStyle.ts:202`, deprecated).
pub const PUSTYNIA_EXTRA_Y_LIFT: f64 = 0.10;
/// `FLAT_LAND_COAST_EXTRA_Y_LIFT` (`mapRenderStyle.ts:204`, deprecated).
pub const FLAT_LAND_COAST_EXTRA_Y_LIFT: f64 = 0.08;

/// `TerrainVisualSpec` (`mapRenderStyle.ts:207-210`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TerrainVisualSpec {
    /// Prism height.
    pub height: f64,
    /// Prism bottom offset.
    pub y_offset: f64,
}

const fn spec(height: f64, y_offset: f64) -> TerrainVisualSpec {
    TerrainVisualSpec { height, y_offset }
}

/// `ROBLOX_TERRAIN_VIS[t]` as the table literal (`mapRenderStyle.ts:212-224`).
/// Only `height` is used by `terrainVisualForStyle`; the `yOffset` of the
/// table is recomputed from `TERRAIN_SURFACE_Y`.
#[must_use]
pub fn roblox_terrain_vis(t: Terrain) -> TerrainVisualSpec {
    match t {
        Terrain::Morze => spec(0.30, 0.00),
        Terrain::PlytkieMorze => spec(0.30, 0.10),
        Terrain::Laka => spec(0.38, 0.07),
        Terrain::Rownina => spec(0.40, 0.07),
        Terrain::Pustynia | Terrain::Wzgorza => spec(0.42, 0.08),
        Terrain::Gory => spec(0.46, 0.12),
        Terrain::Polarny => spec(0.36, 0.06),
    }
}

/// `CIV_TERRAIN_VIS[t]` (`mapRenderStyle.ts:324-333`, private in the web,
/// the `civ` argument of `terrainSurfaceTopY`).
#[must_use]
pub fn civ_terrain_vis(t: Terrain) -> TerrainVisualSpec {
    match t {
        Terrain::Morze => spec(0.30, 0.00),
        Terrain::PlytkieMorze => spec(0.35, 0.05),
        Terrain::Laka => spec(0.40, 0.05),
        Terrain::Rownina => spec(0.45, 0.08),
        Terrain::Pustynia => spec(0.42, 0.08),
        Terrain::Wzgorza => spec(0.70, 0.15),
        Terrain::Gory => spec(1.20, 0.40),
        Terrain::Polarny => spec(0.38, 0.06),
    }
}

/// `terrainVisualForStyle(t, style, civ)` (`mapRenderStyle.ts:226-242`).
/// The roblox branch is the existing [`Terrain::visual`].
#[must_use]
pub fn terrain_visual_for_style(
    t: Terrain,
    style: MapRenderStyle,
    civ: TerrainVisualSpec,
) -> TerrainVisualSpec {
    if style == MapRenderStyle::Roblox {
        let (height, y_offset) = t.visual();
        return TerrainVisualSpec { height, y_offset };
    }
    let base = civ;
    if !t.is_dry_land() {
        return base;
    }
    let extra_lift = if style == MapRenderStyle::Civ {
        LAND_HEX_Y_LIFT
    } else {
        0.0
    };
    let top_y = t.surface_y() + extra_lift;
    TerrainVisualSpec {
        height: base.height,
        y_offset: top_y - base.height,
    }
}

/// `terrainSurfaceTopY(teren, style = GAME_MAP_RENDER_STYLE, extraYOffset = 0)`
/// (`mapRenderStyle.ts:336-343`).
#[must_use]
pub fn terrain_surface_top_y(t: Terrain, style: MapRenderStyle, extra_y_offset: f64) -> f64 {
    let s = terrain_visual_for_style(t, style, civ_terrain_vis(t));
    s.height + s.y_offset + extra_y_offset
}

/// `COAST_WATER_CAP_THICKNESS` (`mapRenderStyle.ts:265`).
pub const COAST_WATER_CAP_THICKNESS: f64 = 0.038 * 1.15;

/// `coastWaterCapTopY(style = GAME_MAP_RENDER_STYLE)` (`mapRenderStyle.ts:268-270`).
#[must_use]
pub fn coast_water_cap_top_y(style: MapRenderStyle) -> f64 {
    terrain_surface_top_y(Terrain::Morze, style, 0.0) + COAST_WATER_CAP_THICKNESS
}

/// One land row of [`TerrainHeightAudit`].
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TerrainHeightAuditRow {
    /// Terrain.
    pub teren: Terrain,
    /// Surface top.
    pub top_y: f64,
    /// `topY - seaTopY`.
    pub gap_above_sea: f64,
}

/// `TerrainHeightAudit` (`mapRenderStyle.ts:250-258`).
#[derive(Clone, Debug, PartialEq)]
pub struct TerrainHeightAudit {
    /// Style audited.
    pub style: MapRenderStyle,
    /// Sea top.
    pub sea_top_y: f64,
    /// Shallow-sea top.
    pub plytkie_morze_top_y: f64,
    /// Coast water cap top.
    pub coast_water_cap_top_y: f64,
    /// Dry terrains: 4 flat ones then hills, mountains.
    pub land: Vec<TerrainHeightAuditRow>,
    /// Smallest `gap_above_sea`.
    pub min_land_gap: f64,
    /// Messages, in the web wording (Polish, `toFixed(3)`).
    pub violations: Vec<String>,
}

/// `terrainHeightAudit(style)` (`mapRenderStyle.ts:273-321`).
#[must_use]
pub fn terrain_height_audit(style: MapRenderStyle) -> TerrainHeightAudit {
    const FLAT: [Terrain; 4] = [
        Terrain::Laka,
        Terrain::Rownina,
        Terrain::Pustynia,
        Terrain::Polarny,
    ];
    let sea_top_y = terrain_surface_top_y(Terrain::Morze, style, 0.0);
    let plytkie_morze_top_y = terrain_surface_top_y(Terrain::PlytkieMorze, style, 0.0);
    let coast_water_cap_top_y = sea_top_y + COAST_WATER_CAP_THICKNESS;
    let land: Vec<TerrainHeightAuditRow> = FLAT
        .iter()
        .chain([Terrain::Wzgorza, Terrain::Gory].iter())
        .map(|&teren| {
            let top_y = terrain_surface_top_y(teren, style, 0.0);
            TerrainHeightAuditRow {
                teren,
                top_y,
                gap_above_sea: top_y - sea_top_y,
            }
        })
        .collect();
    let min_land_gap = land
        .iter()
        .map(|r| r.gap_above_sea)
        .fold(f64::INFINITY, f64::min);
    let mut violations = Vec::new();
    if plytkie_morze_top_y <= sea_top_y {
        violations.push(format!(
            "płytkie morze ({}) <= morze ({})",
            js_to_fixed3(plytkie_morze_top_y),
            js_to_fixed3(sea_top_y)
        ));
    }
    let flat_tops: Vec<f64> = FLAT
        .iter()
        .map(|&t| terrain_surface_top_y(t, style, 0.0))
        .collect();
    let flat_spread = flat_tops.iter().copied().fold(f64::NEG_INFINITY, f64::max)
        - flat_tops.iter().copied().fold(f64::INFINITY, f64::min);
    if flat_spread > 0.001 {
        violations.push(format!(
            "płaski ląd: rozrzut topY {} (wymagane 0)",
            js_to_fixed3(flat_spread)
        ));
    }
    for row in &land {
        let id = terrain_web_id(row.teren);
        if row.gap_above_sea < LAND_MIN_CLEARANCE_ABOVE_SEA - 0.001 {
            violations.push(format!(
                "{id}: luka {} < min {LAND_MIN_CLEARANCE_ABOVE_SEA}",
                js_to_fixed3(row.gap_above_sea)
            ));
        }
        if row.top_y <= coast_water_cap_top_y {
            violations.push(format!(
                "{id}: wierzchołek <= tafla wybrzeża 3D ({})",
                js_to_fixed3(coast_water_cap_top_y)
            ));
        }
    }
    TerrainHeightAudit {
        style,
        sea_top_y,
        plytkie_morze_top_y,
        coast_water_cap_top_y,
        land,
        min_land_gap,
        violations,
    }
}

// ---------------------------------------------------------------------------
// Colours (`mapRenderStyle.ts:497-595`)

/// `TERRAIN_CIV[t]` (`mapRenderStyle.ts:497-506`).
#[must_use]
pub fn civ_terrain_hex(t: Terrain) -> u32 {
    match t {
        Terrain::Morze => 0x001f_5a86,
        Terrain::PlytkieMorze => 0x0046_a3d6,
        Terrain::Laka => 0x006a_a53f,
        Terrain::Rownina => 0x00a9_b257,
        Terrain::Pustynia => 0x00d9_c179,
        Terrain::Wzgorza => 0x004f_7d34,
        Terrain::Gory => 0x009a_a1a9,
        Terrain::Polarny => 0x00e8_eef5,
    }
}

/// `TERRAIN_MINECRAFT[t]` (`mapRenderStyle.ts:524-533`).
#[must_use]
pub fn minecraft_terrain_hex(t: Terrain) -> u32 {
    match t {
        Terrain::Morze => 0x002b_5ea8,
        Terrain::PlytkieMorze => 0x003d_8fd9,
        Terrain::Laka => 0x005b_8f3c,
        Terrain::Rownina => 0x006e_a043,
        Terrain::Pustynia => 0x00db_c35c,
        Terrain::Wzgorza => 0x004a_7a32,
        Terrain::Gory => 0x008a_9099,
        Terrain::Polarny => 0x00dc_e4ee,
    }
}

/// `styleTerrainColor(t, style)` (`mapRenderStyle.ts:535-539`); the roblox
/// table is the existing [`roblox_terrain_hex`].
#[must_use]
pub fn style_terrain_color(t: Terrain, style: MapRenderStyle) -> u32 {
    match style {
        MapRenderStyle::Roblox => roblox_terrain_hex(t),
        MapRenderStyle::Minecraft => minecraft_terrain_hex(t),
        MapRenderStyle::Civ => civ_terrain_hex(t),
    }
}

/// `StyleScenePalette` (`mapRenderStyle.ts:541-553`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct StyleScenePalette {
    /// Background.
    pub sky: u32,
    /// Fog colour.
    pub fog_color: u32,
    /// `FogExp2` density (civ only).
    pub fog_exp: Option<f64>,
    /// Linear fog near (roblox, minecraft).
    pub fog_near: Option<f64>,
    /// Linear fog far (roblox, minecraft).
    pub fog_far: Option<f64>,
    /// Ocean backdrop.
    pub deep_ocean: u32,
    /// World frame.
    pub frame: u32,
    /// River water.
    pub river: u32,
    /// River bank.
    pub river_bank: u32,
    /// Flat shading.
    pub flat_shading: bool,
    /// Antialias.
    pub antialias: bool,
}

/// `styleScenePalette(style)` (`mapRenderStyle.ts:555-595`).
#[must_use]
pub fn style_scene_palette(style: MapRenderStyle) -> StyleScenePalette {
    match style {
        MapRenderStyle::Roblox => StyleScenePalette {
            sky: 0x00d4_e0e8,
            fog_color: 0x00c8_d6e0,
            fog_exp: None,
            fog_near: Some(60.0),
            fog_far: Some(680.0),
            deep_ocean: PALETTE_DEEP_OCEAN,
            frame: PALETTE_FRAME,
            river: 0x006a_adbe,
            river_bank: 0x005a_9aa8,
            flat_shading: true,
            antialias: true,
        },
        MapRenderStyle::Minecraft => StyleScenePalette {
            sky: 0x0078_a7ff,
            fog_color: 0x00c0_d8ff,
            fog_exp: None,
            fog_near: Some(45.0),
            fog_far: Some(220.0),
            deep_ocean: 0x001a_4a7a,
            frame: 0x005a_4a3a,
            river: 0x003a_7bd5,
            river_bank: 0x002a_6ab5,
            flat_shading: true,
            antialias: false,
        },
        MapRenderStyle::Civ => StyleScenePalette {
            sky: 0x0087_ceeb,
            fog_color: 0x009f_cfe6,
            fog_exp: Some(0.0075),
            fog_near: None,
            fog_far: None,
            deep_ocean: 0x0016_3d5c,
            frame: 0x0024_1c12,
            river: 0x005f_b4e8,
            river_bank: 0x004a_a6dc,
            flat_shading: false,
            antialias: true,
        },
    }
}

// ---------------------------------------------------------------------------
// Deterministic per-hex decor counts (`mapRenderStyle.ts:345-360, 767-779`)

/// `decorVariant5(q, r, seed, salt)` (`mapRenderStyle.ts:358-360`): colour
/// variant 0..=4.
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // floor of [0, 5)
pub fn decor_variant5(q: i32, r: i32, seed: i32, salt: i32) -> u32 {
    (hash_heksa(q, r, seed, salt) * 5.0).floor() as u32
}

/// `forestTreeCountForHex(q, r, seed)` (`mapRenderStyle.ts:767-769`): 3..=5.
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // floor of [0, 3)
pub fn forest_tree_count_for_hex(q: i32, r: i32, seed: i32) -> u32 {
    3 + (hash_heksa(q, r, seed, 1) * 3.0).floor() as u32
}

/// `jungleForestTreeCountForHex(q, r, seed)` (`mapRenderStyle.ts:776-778`): 5..=7.
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // floor of [0, 3)
pub fn jungle_forest_tree_count_for_hex(q: i32, r: i32, seed: i32) -> u32 {
    5 + (hash_heksa(q, r, seed, 889) * 3.0).floor() as u32
}

// ---------------------------------------------------------------------------
// Decor surface heights (`mapRenderStyle.ts:1029-1097`)

/// `WZGORZE_SZCZYT_Y` (`teren-gory-wzgorza.ts:87`): hill plateau above the
/// hex top. Data of the relief models (MOD-03), needed here by
/// [`elevated_terrain_edge_surface_y`]; MOD-03 should reuse this constant.
pub const WZGORZE_SZCZYT_Y: f64 = 0.392;
/// `GORA_APEX_Y` (`teren-gory-wzgorza.ts:90`): mountain apex per variant.
pub const GORA_APEX_Y: [f64; TERRAIN_SOLID_VARIANTS] = [1.25, 1.15, 1.20, 1.18, 1.10];

/// `styleHillBumpSurfaceY(baseY, lite = false)` (`mapRenderStyle.ts:1029-1037`).
#[must_use]
pub fn style_hill_bump_surface_y(base_y: f64, lite: bool) -> f64 {
    let tiers = if lite { 3 } else { 5 };
    let mut y = base_y;
    for i in 0..tiers {
        let wall_h = 0.048 + if i == 0 { 0.012 } else { 0.0 };
        y += wall_h + 0.028;
    }
    y
}

/// `styleMountainPeakSurfaceY(topY, q, r, seed, R, lite)`
/// (`mapRenderStyle.ts:1040-1051`); `R` and `lite` are ignored by the web.
#[must_use]
pub fn style_mountain_peak_surface_y(top_y: f64, q: i32, r: i32, seed: i32) -> f64 {
    top_y + GORA_APEX_Y[wariant_dla_heksa(q, r, TERRAIN_SOLID_VARIANTS, seed)]
}

/// `opts` of `galleryDecorSurfaceY` (`mapRenderStyle.ts:1061`); `None` =
/// the web default (`lite = false`, `q = r = seed = 0`, `R = 1`).
#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct GalleryDecorOpts {
    /// `lite`.
    pub lite: Option<bool>,
    /// `q`.
    pub q: Option<i32>,
    /// `r`.
    pub r: Option<i32>,
    /// `seed`.
    pub seed: Option<i32>,
    /// `R` (unused by the result, kept for the interface).
    pub radius: Option<f64>,
}

/// `galleryDecorSurfaceY(teren, hexTopY, improvementKeys, opts)`
/// (`mapRenderStyle.ts:1057-1076`).
#[must_use]
pub fn gallery_decor_surface_y<S: AsRef<str>>(
    teren: Terrain,
    hex_top_y: f64,
    improvement_keys: &[S],
    opts: GalleryDecorOpts,
) -> f64 {
    let lite = opts.lite.unwrap_or(false);
    let q = opts.q.unwrap_or(0);
    let r = opts.r.unwrap_or(0);
    let seed = opts.seed.unwrap_or(0);
    if teren == Terrain::Wzgorza && !improvement_keys.iter().any(|k| k.as_ref() == "tarasy") {
        return style_hill_bump_surface_y(hex_top_y, lite);
    }
    if teren == Terrain::Gory {
        return style_mountain_peak_surface_y(hex_top_y, q, r, seed);
    }
    hex_top_y
}

/// `WZGORZE_EDGE_RELIEF_FRAC` (`mapRenderStyle.ts:1079`, private).
const WZGORZE_EDGE_RELIEF_FRAC: f64 = 0.38;

/// `elevatedTerrainEdgeSurfaceY(teren, hexTopY)` (`mapRenderStyle.ts:1086-1097`).
#[must_use]
pub fn elevated_terrain_edge_surface_y(teren: Terrain, hex_top_y: f64) -> f64 {
    if teren == Terrain::Wzgorza {
        return hex_top_y + WZGORZE_SZCZYT_Y * WZGORZE_EDGE_RELIEF_FRAC;
    }
    hex_top_y
}
