//! `render/zoomLod.ts` (web `edb8fb56`, 220 LOC): render-quality ladder by
//! camera distance (5 levels for zoom-out) and the city-badge texture LOD
//! (3 levels for zoom-in). Pure arithmetic; `Math.min`/`Math.max` keep their
//! JavaScript `NaN` semantics ([`super::jsnum`]).

use super::jsnum::{js_max_nan, js_min_nan};

/// `ZoomLodLevel = 0 | 1 | 2 | 3 | 4` (`zoomLod.ts:7`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum ZoomLodLevel {
    /// 0 — closest, everything on.
    L0,
    /// 1.
    L1,
    /// 2.
    L2,
    /// 3.
    L3,
    /// 4 — farthest.
    L4,
}

impl ZoomLodLevel {
    /// The numeric level of the web.
    #[must_use]
    pub fn as_u8(self) -> u8 {
        match self {
            Self::L0 => 0,
            Self::L1 => 1,
            Self::L2 => 2,
            Self::L3 => 3,
            Self::L4 => 4,
        }
    }

    /// From the numeric level; `None` outside `0..=4`.
    #[must_use]
    pub fn from_u8(v: u8) -> Option<Self> {
        Some(match v {
            0 => Self::L0,
            1 => Self::L1,
            2 => Self::L2,
            3 => Self::L3,
            4 => Self::L4,
            _ => return None,
        })
    }
}

/// `ZoomLodFlags` (`zoomLod.ts:9-34`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ZoomLodFlags {
    /// 3D decor groups (`buildStyle*`).
    pub styled_decor: bool,
    /// Forest crown instances.
    pub forest_inst: bool,
    /// Forest trunk instances.
    pub forest_trunk_inst: bool,
    /// Snow / shrubs / peaks / hills instances.
    pub terrain_detail_inst: bool,
    /// Beach / dunes / oases instances.
    pub coast_decor_inst: bool,
    /// River meshes.
    pub rivers: bool,
    /// Directional shadows.
    pub shadows: bool,
    /// `pixelRatio` multiplier relative to `preset.pixelRatioMax`.
    pub pixel_ratio_mul: f64,
    /// Decor density budget in `[0, 1]` (unused by `scene.ts` today).
    pub decor_density: f64,
}

/// `normalizedZoomT(dist, minDist, maxDist)` (`zoomLod.ts:36-39`).
#[must_use]
pub fn normalized_zoom_t(dist: f64, min_dist: f64, max_dist: f64) -> f64 {
    let span = js_max_nan(1e-6, max_dist - min_dist);
    js_min_nan(1.0, js_max_nan(0.0, (dist - min_dist) / span))
}

/// `resolveZoomLodLevel(t)` (`zoomLod.ts:42-48`); `NaN` falls through every
/// comparison to level 4, as in the web.
#[must_use]
pub fn resolve_zoom_lod_level(t: f64) -> ZoomLodLevel {
    if t < 0.20 {
        return ZoomLodLevel::L0;
    }
    if t < 0.40 {
        return ZoomLodLevel::L1;
    }
    if t < 0.60 {
        return ZoomLodLevel::L2;
    }
    if t < 0.80 {
        return ZoomLodLevel::L3;
    }
    ZoomLodLevel::L4
}

/// `zoomLodFlags(level, baseShadows)` (`zoomLod.ts:50-115`).
#[must_use]
pub fn zoom_lod_flags(level: ZoomLodLevel, base_shadows: bool) -> ZoomLodFlags {
    match level {
        ZoomLodLevel::L0 => ZoomLodFlags {
            styled_decor: true,
            forest_inst: true,
            forest_trunk_inst: true,
            terrain_detail_inst: true,
            coast_decor_inst: true,
            rivers: true,
            shadows: base_shadows,
            pixel_ratio_mul: 1.0,
            decor_density: 1.0,
        },
        ZoomLodLevel::L1 => ZoomLodFlags {
            styled_decor: true,
            forest_inst: true,
            forest_trunk_inst: false,
            terrain_detail_inst: true,
            coast_decor_inst: true,
            rivers: true,
            shadows: false,
            pixel_ratio_mul: 0.85,
            decor_density: 0.85,
        },
        ZoomLodLevel::L2 => ZoomLodFlags {
            styled_decor: false,
            forest_inst: true,
            forest_trunk_inst: false,
            terrain_detail_inst: false,
            coast_decor_inst: true,
            rivers: true,
            shadows: false,
            pixel_ratio_mul: 0.65,
            decor_density: 0.6,
        },
        ZoomLodLevel::L3 => ZoomLodFlags {
            styled_decor: false,
            forest_inst: false,
            forest_trunk_inst: false,
            terrain_detail_inst: false,
            coast_decor_inst: false,
            rivers: true,
            shadows: false,
            pixel_ratio_mul: 0.5,
            decor_density: 0.25,
        },
        ZoomLodLevel::L4 => ZoomLodFlags {
            styled_decor: false,
            forest_inst: false,
            forest_trunk_inst: false,
            terrain_detail_inst: false,
            coast_decor_inst: false,
            rivers: false,
            shadows: false,
            pixel_ratio_mul: 0.35,
            decor_density: 0.0,
        },
    }
}

/// `effectivePixelRatio(baseMax, mul)` (`zoomLod.ts:117-120`). The web reads
/// `window.devicePixelRatio` and uses 1 when there is no `window`; here the
/// caller passes it (`None` = no window = 1).
#[must_use]
pub fn effective_pixel_ratio(base_max: f64, mul: f64, device_pixel_ratio: Option<f64>) -> f64 {
    let cap = device_pixel_ratio.unwrap_or(1.0);
    js_min_nan(cap, js_max_nan(0.75, base_max * mul))
}

/// `CityBadgeLodLevel = 0 | 1 | 2` (`zoomLod.ts:158`): 0 = today's canvas
/// resolution, 1 = ×2 pixels, 2 = ×3 pixels.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum CityBadgeLodLevel {
    /// 0.
    L0,
    /// 1.
    L1,
    /// 2.
    L2,
}

impl CityBadgeLodLevel {
    /// The numeric level of the web.
    #[must_use]
    pub fn as_u8(self) -> u8 {
        match self {
            Self::L0 => 0,
            Self::L1 => 1,
            Self::L2 => 2,
        }
    }
}

/// `CITY_BADGE_LOD_NEAR_DIST` (`zoomLod.ts:161`).
pub const CITY_BADGE_LOD_NEAR_DIST: f64 = 5.5;
/// `CITY_BADGE_LOD_MID_DIST` (`zoomLod.ts:163`).
pub const CITY_BADGE_LOD_MID_DIST: f64 = 11.0;

/// `cityBadgeLodLevelForDist(dist)` (`zoomLod.ts:176-183`): non-finite
/// distances give level 0 (never the expensive one).
#[must_use]
pub fn city_badge_lod_level_for_dist(dist: f64) -> CityBadgeLodLevel {
    if !dist.is_finite() {
        return CityBadgeLodLevel::L0;
    }
    if dist < CITY_BADGE_LOD_NEAR_DIST {
        return CityBadgeLodLevel::L2;
    }
    if dist < CITY_BADGE_LOD_MID_DIST {
        return CityBadgeLodLevel::L1;
    }
    CityBadgeLodLevel::L0
}

/// `cityBadgeLodTextureScale(level)` (`zoomLod.ts:186-189`): the level is a
/// JS number; anything other than exactly 1 or 2 counts as level 0.
#[must_use]
#[allow(clippy::float_cmp)] // `level === 1 || level === 2`
pub fn city_badge_lod_texture_scale(level: f64) -> f64 {
    if level == 1.0 {
        2.0
    } else if level == 2.0 {
        3.0
    } else {
        1.0
    }
}

/// `ZOOM_LOD_MARKER` (`zoomLod.ts:192`).
pub const ZOOM_LOD_MARKER: &str = "civ-zoom-lod-a1a4";

/// `ZoomLodResult` (`zoomLod.ts:194-201`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ZoomLodResult {
    /// Level.
    pub level: ZoomLodLevel,
    /// Flags of the level.
    pub flags: ZoomLodFlags,
    /// Normalised `t` used to pick the level.
    pub t: f64,
    /// Always [`ZOOM_LOD_MARKER`].
    pub marker: &'static str,
}

/// `zoomLodForCamera(dist, minDist, maxDist, baseShadows)`
/// (`zoomLod.ts:210-220`).
#[must_use]
pub fn zoom_lod_for_camera(
    dist: f64,
    min_dist: f64,
    max_dist: f64,
    base_shadows: bool,
) -> ZoomLodResult {
    let t = normalized_zoom_t(dist, min_dist, max_dist);
    let level = resolve_zoom_lod_level(t);
    let flags = zoom_lod_flags(level, base_shadows);
    ZoomLodResult {
        level,
        flags,
        t,
        marker: ZOOM_LOD_MARKER,
    }
}
