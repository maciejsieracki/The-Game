//! Material parameters as data (no shader, no GPU state): the union of what
//! the ported web builders set on `MeshStandardMaterial`,
//! `MeshLambertMaterial`, `MeshBasicMaterial`, `SpriteMaterial` and
//! `LineBasicMaterial` (and the classes `fogDim.ts` distinguishes).
//!
//! Colours are kept like three keeps them: `material.color` in the linear
//! working space ([`Color`], `Color.setHex` = sRGB → linear). The sRGB hex the
//! builders pass is recovered exactly with [`Material::hex`]
//! (`Color.getHex()`; the round trip `from_hex → to_hex` is the identity on
//! all 2^24 values, checked by a unit test of this module).

use crate::terrain::color::Color;

/// Material class. It matters for `fogDim.ts`, which dims by **exact
/// constructor** (`DIM_MAT_TYPES.has(mat.constructor)`, `fogDim.ts:9-14`):
/// subclasses such as `MeshPhysicalMaterial` are *not* dimmed.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MaterialKind {
    /// `MeshLambertMaterial`.
    Lambert,
    /// `MeshStandardMaterial`.
    Standard,
    /// `MeshBasicMaterial`.
    Basic,
    /// `MeshPhongMaterial`.
    Phong,
    /// `MeshPhysicalMaterial` (subclass of Standard).
    Physical,
    /// `MeshToonMaterial`.
    Toon,
    /// `MeshNormalMaterial` (no `color`).
    Normal,
    /// `SpriteMaterial`.
    Sprite,
    /// `LineBasicMaterial`.
    LineBasic,
}

impl MaterialKind {
    /// `material.type` string of three r169.
    #[must_use]
    pub const fn three_type(self) -> &'static str {
        match self {
            Self::Lambert => "MeshLambertMaterial",
            Self::Standard => "MeshStandardMaterial",
            Self::Basic => "MeshBasicMaterial",
            Self::Phong => "MeshPhongMaterial",
            Self::Physical => "MeshPhysicalMaterial",
            Self::Toon => "MeshToonMaterial",
            Self::Normal => "MeshNormalMaterial",
            Self::Sprite => "SpriteMaterial",
            Self::LineBasic => "LineBasicMaterial",
        }
    }

    /// Whether the class has a `color` property (all except `Normal`).
    #[must_use]
    pub const fn has_color(self) -> bool {
        !matches!(self, Self::Normal)
    }
}

/// `material.side`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    /// `THREE.FrontSide` (0, the default).
    Front,
    /// `THREE.BackSide` (1).
    Back,
    /// `THREE.DoubleSide` (2).
    Double,
}

impl Side {
    /// Numeric Three.js constant.
    #[must_use]
    pub const fn three_value(self) -> u32 {
        match self {
            Self::Front => 0,
            Self::Back => 1,
            Self::Double => 2,
        }
    }
}

/// A canvas texture drawn from one glyph (`siegeSpriteTexture`,
/// `siegeMarker.ts:35-49`), kept as data: rasterising it is the text/SVG
/// rasteriser's job (D-MOD-6).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GlyphTexture {
    /// Canvas width and height.
    pub size: u32,
    /// `ctx.font`.
    pub font: &'static str,
    /// The glyph.
    pub glyph: char,
    /// `fillText` x, with `textAlign = 'center'`.
    pub x: u32,
    /// `fillText` y, with `textBaseline = 'middle'`.
    pub y: u32,
}

/// `material.map` as data.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Texture {
    /// A canvas with one centred glyph.
    Glyph(GlyphTexture),
}

/// Material parameters as data.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Material {
    /// Class.
    pub kind: MaterialKind,
    /// `material.color` in the linear working space; `None` for classes
    /// without colour.
    pub color: Option<Color>,
    /// `material.emissive` (linear; black by default; Standard/Lambert/Phong).
    pub emissive: Color,
    /// `metalness` (Standard; `0` for classes without it).
    pub metalness: f64,
    /// `roughness` (Standard; `1` for classes without it).
    pub roughness: f64,
    /// `transparent`.
    pub transparent: bool,
    /// `opacity`.
    pub opacity: f64,
    /// `flatShading`.
    pub flat_shading: bool,
    /// `vertexColors`.
    pub vertex_colors: bool,
    /// `depthWrite`.
    pub depth_write: bool,
    /// `depthTest`.
    pub depth_test: bool,
    /// `side`.
    pub side: Side,
    /// `polygonOffset` with (`polygonOffsetFactor`, `polygonOffsetUnits`).
    pub polygon_offset: Option<(f64, f64)>,
    /// `map`.
    pub map: Option<Texture>,
    /// `userData.fogBaseColor` written by `applyFogDimToObject3D`.
    pub fog_base_color: Option<Color>,
}

const BLACK: Color = Color::rgb(0.0, 0.0, 0.0);

impl Material {
    /// Three r169 defaults of a material of `kind` with a linear colour
    /// (`None` keeps the class default: white, or no colour for `Normal`).
    #[must_use]
    pub fn with_color(kind: MaterialKind, color: Option<Color>) -> Self {
        let color = kind
            .has_color()
            .then(|| color.unwrap_or(Color::rgb(1.0, 1.0, 1.0)));
        Self {
            kind,
            color,
            emissive: BLACK,
            metalness: 0.0,
            roughness: 1.0,
            transparent: false,
            opacity: 1.0,
            flat_shading: false,
            vertex_colors: false,
            depth_write: true,
            depth_test: true,
            side: Side::Front,
            polygon_offset: None,
            map: None,
            fog_base_color: None,
        }
    }

    /// `new <Kind>Material({ color })` with an sRGB hex like in the web
    /// (`Color.setHex`); white (`0xffffff`) when `None` — the three r169
    /// default for every class with a colour.
    #[must_use]
    pub fn new(kind: MaterialKind, color: Option<u32>) -> Self {
        Self::with_color(kind, Some(Color::from_hex(color.unwrap_or(0x00ff_ffff))))
    }

    /// `new MeshLambertMaterial({ color })`.
    #[must_use]
    pub fn lambert(color: u32) -> Self {
        Self::new(MaterialKind::Lambert, Some(color))
    }

    /// `new MeshLambertMaterial({ color, flatShading: true })`.
    #[must_use]
    pub fn lambert_flat(color: u32) -> Self {
        let mut m = Self::lambert(color);
        m.flat_shading = true;
        m
    }

    /// `new MeshBasicMaterial({ color })`.
    #[must_use]
    pub fn basic(color: u32) -> Self {
        Self::new(MaterialKind::Basic, Some(color))
    }

    /// `new MeshStandardMaterial({ color, metalness, roughness })`.
    #[must_use]
    pub fn standard(color: u32, metalness: f64, roughness: f64) -> Self {
        let mut m = Self::new(MaterialKind::Standard, Some(color));
        m.metalness = metalness;
        m.roughness = roughness;
        m
    }

    /// `material.color.getHex()` (sRGB), `0` for a class without colour.
    #[must_use]
    pub fn hex(&self) -> u32 {
        self.color.map_or(0, Color::to_hex)
    }

    /// `material.color.setHex(hex)`.
    pub fn set_hex(&mut self, hex: u32) {
        if self.kind.has_color() {
            self.color = Some(Color::from_hex(hex));
        }
    }

    /// `material.color` (linear), white for a class without colour.
    #[must_use]
    pub fn linear_color(&self) -> Color {
        self.color.unwrap_or(Color::rgb(1.0, 1.0, 1.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_round_trip_is_exact_for_every_24_bit_colour() {
        // Stored as linear (`Color.setHex`), read back as `getHex()`: the
        // unified material must give every builder its hex back unchanged.
        // `from_hex` / `to_hex` convert the three channels independently
        // with the same per-channel function, so the 256 values of each
        // channel position cover all 2^24 colours (an exhaustive 2^24 loop
        // was also run once in release mode while writing P4.27: 0 misses).
        for v in 0..=255u32 {
            for shift in [0u32, 8, 16] {
                let h = v << shift;
                assert_eq!(Color::from_hex(h).to_hex(), h, "{h:06x}");
            }
            let h = v * 0x01_0101;
            assert_eq!(Color::from_hex(h).to_hex(), h, "{h:06x}");
        }
    }

    #[test]
    fn defaults_follow_three() {
        let m = Material::new(MaterialKind::Normal, Some(0x12_3456));
        assert!(m.color.is_none());
        let s = Material::standard(0xab_cdef, 0.25, 0.75);
        assert_eq!(s.hex(), 0xab_cdef);
        assert_eq!((s.metalness, s.roughness), (0.25, 0.75));
        assert!(s.depth_write && s.depth_test && !s.transparent);
    }
}
