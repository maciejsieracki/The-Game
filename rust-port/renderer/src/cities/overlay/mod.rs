//! MOD-10 — city overlays (`R-RUSTPORT-P4-MOD-10-CITY-CHIP`, topic
//! `R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1`).
//!
//! Port 1:1 of three web modules of pin `edb8fb56` (paths relative to
//! `gra/src/`):
//!
//! | web module | here | what |
//! |---|---|---|
//! | `render/cityMapStatChip.ts` (1133 LOC) | [`stat_chip`] | the city badge ("pill") above a city: defence shield, civ medallion (portrait / sigil / ◆), capital crown, name, growth %, production glyph, population disc, hover row; its sprite and the pure helpers (`wallKindFromBuilt`, `civInitialForIconId`, …) |
//! | `render/cityOkolicaOverlay.ts` (347 LOC) | [`okolica`] | the city-surroundings overlay: range / centre / worked tints (through MOD-13 `rangeOverlay`, [`crate::models::misc::range`]) and the yield labels (🍞 🔨 💰 + 👤 badge) |
//! | `render/workerFieldOverlay.ts` (211 LOC) | [`worker_field`] | the 👤 worker icons on worked fields of the world map, the owner palette and the fog pass |
//!
//! **Data in, data out.** Nothing here reads game state: the caller passes
//! the badge input ([`stat_chip::CityMapBadgeInput`], the same struct as the
//! texture-key port [`crate::raster::atlas::keys`]), the hexes / yields /
//! worked keys of the surroundings ([`okolica::OkolicaMap`],
//! [`okolica::CityOkolicaOverlayParams`]) and the worked-field owners —
//! exactly what `render/cities.ts` / `main.ts` pass to the web functions.
//! Image sources are injected like `main.ts:8531-8535` injects them
//! ([`stat_chip::CityMapBadgeAssets`]).
//!
//! **Textures** are drawn with [`Canvas2dLite`] (every `ctx.*` call of the
//! web drawing functions, in order; text through [`crate::raster::text`],
//! emoji / symbols through [`crate::raster::image::emoji`], SVG and JPG
//! through [`crate::raster::image`]) and returned as [`CanvasTexture`]: an
//! RGBA8 buffer (straight alpha, row 0 at the top — `getImageData`) plus the
//! Three texture metadata. No GPU upload here (RR-T8d).
//!
//! **Layout** is returned as data: sprites ([`SpriteNode`]: position, scale,
//! `center`, `renderOrder`, `visible`, `userData`, material parameters with
//! the texture referenced by [`TextureRef`]) and, for the range tints, the
//! MOD-13 [`crate::models::misc::OverlayGroup`] buffers.

pub mod okolica;
pub mod stat_chip;
pub mod worker_field;

use crate::models::misc::HexKey;
use crate::raster::Canvas2dLite;
pub use crate::units::overlay::TextureFilter;

/// A canvas texture (`THREE.CanvasTexture` + its canvas).
#[derive(Clone, Debug, PartialEq)]
pub struct CanvasTexture {
    /// Canvas width in device px.
    pub width: u32,
    /// Canvas height in device px.
    pub height: u32,
    /// Straight-alpha RGBA8, row 0 at the top (`getImageData`).
    pub rgba: Vec<u8>,
    /// Premultiplied RGBA8 of the canvas (what [`Canvas2dLite`] holds).
    pub premultiplied: Vec<u8>,
    /// FNV-1a 64 of [`Self::premultiplied`] ([`Canvas2dLite::rgba_hash`]).
    pub hash: u64,
    /// `texture.minFilter` (`LinearFilter` for every texture of MOD-10).
    pub min_filter: TextureFilter,
    /// `texture.magFilter` (Three default `LinearFilter`).
    pub mag_filter: TextureFilter,
    /// `texture.generateMipmaps` (Three default `true`; irrelevant with
    /// `minFilter = LinearFilter`).
    pub generate_mipmaps: bool,
    /// `texture.colorSpace === SRGBColorSpace` (all MOD-10 textures).
    pub srgb: bool,
    /// `texture.flipY` (Three default `true`).
    pub flip_y: bool,
    /// `texture.version`: 1 after construction, +1 per `needsUpdate = true`
    /// (one per image that loaded and triggered a repaint).
    pub version: u32,
}

impl CanvasTexture {
    /// The texture of `c` as `new THREE.CanvasTexture(canvas)` +
    /// `minFilter = LinearFilter` + `colorSpace = SRGBColorSpace` leaves it.
    #[must_use]
    pub fn from_canvas(c: &Canvas2dLite, version: u32) -> Self {
        CanvasTexture {
            width: c.width(),
            height: c.height(),
            rgba: c.to_rgba8_straight(),
            premultiplied: c.pixels_premultiplied().to_vec(),
            hash: c.rgba_hash(),
            min_filter: TextureFilter::Linear,
            mag_filter: TextureFilter::Linear,
            generate_mipmaps: true,
            srgb: true,
            flip_y: true,
            version,
        }
    }
}

/// Which texture a sprite material uses.
#[derive(Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum TextureRef {
    /// City badge of the key [`stat_chip::city_map_badge_key`] (the web
    /// caches one texture per key in the caller's `texCache`).
    CityBadge(String),
    /// Worker icon of the key [`worker_field::worker_sprite_cache_key`] (web
    /// module cache `workerSpriteCache`).
    WorkerIcon(String),
    /// The yield label of one hex of an okolica overlay (not cached in the
    /// web: a new canvas per label and per build).
    YieldLabel(HexKey),
}

/// `THREE.SpriteMaterial` parameters as data (no shader here; RR-T5).
#[derive(Clone, Debug, PartialEq)]
pub struct SpriteMaterial {
    /// `color`, linear working space (always the default white here).
    pub color: [f64; 3],
    /// `map`.
    pub map: TextureRef,
    /// `transparent`.
    pub transparent: bool,
    /// `depthTest`.
    pub depth_test: bool,
    /// `depthWrite`.
    pub depth_write: bool,
    /// `toneMapped`.
    pub tone_mapped: bool,
    /// `opacity`.
    pub opacity: f64,
    /// `material.userData.fogBaseOpacity` (worker icons only).
    pub fog_base_opacity: Option<f64>,
}

impl SpriteMaterial {
    /// `new THREE.SpriteMaterial({ map, transparent: true, depthTest: false,
    /// toneMapped: false })` with every other parameter at its Three default
    /// (`depthWrite: true`, `opacity: 1`, white).
    #[must_use]
    pub fn overlay(map: TextureRef) -> Self {
        SpriteMaterial {
            color: [1.0, 1.0, 1.0],
            map,
            transparent: true,
            depth_test: false,
            depth_write: true,
            tone_mapped: false,
            opacity: 1.0,
            fog_base_opacity: None,
        }
    }
}

/// A `THREE.Sprite` (local coordinates of its parent group).
#[derive(Clone, Debug, PartialEq)]
pub struct SpriteNode {
    /// `object.name` (empty for every MOD-10 sprite).
    pub name: String,
    /// `position`.
    pub position: [f64; 3],
    /// `scale`.
    pub scale: [f64; 3],
    /// `sprite.center`.
    pub center: [f64; 2],
    /// `renderOrder`.
    pub render_order: i32,
    /// `visible`.
    pub visible: bool,
    /// `userData.hexKey` (worker icons).
    pub hex_key: Option<HexKey>,
    /// `userData.labelWorldHeight` (yield labels).
    pub label_world_height: Option<f64>,
    /// Material.
    pub material: SpriteMaterial,
}

impl SpriteNode {
    /// `new THREE.Sprite(material)`: origin, unit scale, centre (0.5, 0.5),
    /// `renderOrder` 0, visible, no `userData`.
    #[must_use]
    pub fn new(material: SpriteMaterial) -> Self {
        SpriteNode {
            name: String::new(),
            position: [0.0; 3],
            scale: [1.0; 3],
            center: [0.5, 0.5],
            render_order: 0,
            visible: true,
            hex_key: None,
            label_world_height: None,
            material,
        }
    }
}

/// JS `String(n)` / template-literal number formatting.
#[must_use]
pub fn js_number_string(n: f64) -> String {
    crate::models::cities::model::js_number_to_string(n)
}

/// JS `Math.round` (ties toward +∞).
#[must_use]
pub fn js_round(x: f64) -> f64 {
    crate::pick::hex::js_round(x)
}

/// `hexToRgba(hex, alpha)` (`workerFieldOverlay.ts:38-43`): `rgba(r,g,b,a)`
/// with the three bytes of `hex` (`undefined` → all 0, JS `>>` on
/// `undefined` is 0) and `alpha` printed by `String(number)`.
#[must_use]
pub fn hex_to_rgba(hex: Option<u32>, alpha: f64) -> String {
    let h = hex.unwrap_or(0);
    format!(
        "rgba({},{},{},{})",
        (h >> 16) & 255,
        (h >> 8) & 255,
        h & 255,
        js_number_string(alpha)
    )
}
