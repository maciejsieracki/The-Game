//! MOD-08 — unit-token overlays (`R-RUSTPORT-P4-MOD-08-UNIT-OVERLAY`,
//! topic `R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1`).
//!
//! Port 1:1 of four web modules of pin `edb8fb56` (paths relative to
//! `gra/src/`):
//!
//! | web module | here | what |
//! |---|---|---|
//! | `render/unitOwnerEmblem.ts` (516 LOC) | [`emblem`] | owner medallion texture (portrait / culture sigil / barbarian skull / fallback glyph), its variant key, the legacy medallion sprite |
//! | `render/unitStatPlate.ts` (936 LOC) | [`stat_plate`] | the plate above the token: background texture, movement / HP bars, gold divider, owner icon, army-power box with per-digit textures |
//! | `render/unitUpgradeBadges.ts` (459 LOC) | [`upgrade_badges`] | Barracks / Forge badge textures and the badge row |
//! | `render/unitVeteranBadges.ts` (294 LOC) | [`veteran_badges`] | the extruded veteran stars |
//!
//! **Data in, data out.** Nothing here reads game state: the caller passes
//! the owner context ([`emblem::OwnerEmblemContext`]), the vitals
//! ([`stat_plate::StatPlateVitals`]), the badge levels and the star count —
//! exactly the values `render/units.ts:6141-6170` passes to the web
//! functions. Image sources (portraits, SVG icons) are injected like
//! `main.ts:8526-8541` injects them ([`emblem::OwnerEmblemAssets`],
//! [`upgrade_badges::UpgradeBadgeAssets`]).
//!
//! **Textures** are drawn with [`Canvas2dLite`] (every `ctx.*` call of the web
//! drawing functions, in order) and returned as [`OverlayTexture`]: an RGBA8
//! buffer (straight alpha, row 0 at the top — what `getImageData` returns and
//! what WebGL uploads from a canvas) plus the Three texture metadata
//! (filters, mipmaps, colour space) and the nominal quad (anchor + world
//! size) the texture is drawn on. No GPU upload here (RR-T8d).
//!
//! **Layout** is returned as an [`OverlayTree`]: the Three sub-group the web
//! adds to the token (`THREE.Group` with meshes / sprites), as data —
//! local position / rotation / scale, `renderOrder`, `visible`, geometry kind
//! ([`GeometryKind`], CPU mesh via [`GeometryKind::mesh`]) and material
//! parameters ([`OverlayMaterial`], textures referenced by [`TextureRef`]).
//!
//! The async two-phase drawing of the web (`loadImageInto` → `img.onload` →
//! redraw + `needsUpdate`) is represented by two textures: the synchronous
//! first state (`initial`) and the state after the image has loaded
//! (`texture`); when no image ever loads (no asset source, empty SVG, decode
//! error — the web `onerror` path) both are identical.

pub mod emblem;
pub mod stat_plate;
pub mod upgrade_badges;
pub mod veteran_badges;

use crate::geom::{plane_geometry, Mesh};
use crate::raster::{Canvas2dLite, RasterError};
use crate::terrain::color::Color;

/// Three `minFilter` / `magFilter` values used by the overlays.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TextureFilter {
    /// `THREE.LinearFilter` (1006).
    Linear,
    /// `THREE.LinearMipmapLinearFilter` (1008).
    LinearMipmapLinear,
}

impl TextureFilter {
    /// The Three constant.
    #[must_use]
    pub const fn three_constant(self) -> u32 {
        match self {
            TextureFilter::Linear => 1006,
            TextureFilter::LinearMipmapLinear => 1008,
        }
    }
}

/// Where the nominal quad of a texture is anchored.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Anchor {
    /// Quad centred on its origin ([`GeometryKind::QuadCenter`]).
    Center,
    /// Quad starting at its origin, growing to +x ([`GeometryKind::QuadLeft`]).
    LeftEdge,
}

/// A canvas texture of an overlay (`THREE.CanvasTexture` + its canvas).
#[derive(Clone, Debug, PartialEq)]
pub struct OverlayTexture {
    /// Canvas width in px.
    pub width: u32,
    /// Canvas height in px.
    pub height: u32,
    /// Straight-alpha RGBA8, row 0 at the top (`getImageData`).
    pub rgba: Vec<u8>,
    /// Premultiplied RGBA8 of the canvas (what [`Canvas2dLite`] holds).
    pub premultiplied: Vec<u8>,
    /// FNV-1a 64 of [`Self::premultiplied`] ([`Canvas2dLite::rgba_hash`]).
    pub hash: u64,
    /// `texture.minFilter`.
    pub min_filter: TextureFilter,
    /// `texture.magFilter` (Three default `LinearFilter` everywhere here).
    pub mag_filter: TextureFilter,
    /// `texture.generateMipmaps` (Three default `true`, also where the web
    /// keeps `minFilter = LinearFilter`, which makes it irrelevant).
    pub generate_mipmaps: bool,
    /// `texture.colorSpace === SRGBColorSpace` (all overlay textures).
    pub srgb: bool,
    /// `texture.flipY` (Three default `true`).
    pub flip_y: bool,
    /// Anchor of the nominal quad the texture is drawn on.
    pub anchor: Anchor,
    /// World size (x, y) of that nominal quad, in `HEX_R` units (the mesh
    /// `scale` the web gives it; the actual scale of every use is in the
    /// [`OverlayNode`]).
    pub world_size: [f64; 2],
    /// `true` when the web redraws the canvas after an image has loaded
    /// (`texture.needsUpdate = true`, i.e. `texture.version` 2).
    pub redrawn_after_load: bool,
}

impl OverlayTexture {
    fn from_canvas(
        c: &Canvas2dLite,
        min_filter: TextureFilter,
        anchor: Anchor,
        world_size: [f64; 2],
    ) -> Self {
        OverlayTexture {
            width: c.width(),
            height: c.height(),
            rgba: c.to_rgba8_straight(),
            premultiplied: c.pixels_premultiplied().to_vec(),
            hash: c.rgba_hash(),
            min_filter,
            mag_filter: TextureFilter::Linear,
            generate_mipmaps: true,
            srgb: true,
            flip_y: true,
            anchor,
            world_size,
            redrawn_after_load: false,
        }
    }
}

/// Which texture a material uses (the web caches each of them once per game).
#[derive(Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum TextureRef {
    /// Owner medallion of the variant key [`emblem::owner_emblem_key`].
    OwnerEmblem(String),
    /// The single plate background (`unitStatPlate.ts:403-447`).
    PlateBackground,
    /// The single white army-power frame (`unitStatPlate.ts:556-577`).
    PowerFrame,
    /// One army-power digit 0–9 (`unitStatPlate.ts:600-626`).
    PowerDigit(u8),
    /// Upgrade badge of a path and level 1–3 (`unitUpgradeBadges.ts:311-342`).
    UpgradeBadge(upgrade_badges::BadgePath, u8),
}

/// `material.side`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Side {
    /// `THREE.FrontSide` (0).
    Front,
    /// `THREE.DoubleSide` (2).
    Double,
}

/// Material model of a node.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MaterialKind {
    /// `THREE.MeshStandardMaterial`.
    Standard,
    /// `THREE.SpriteMaterial` (legacy medallion only).
    Sprite,
}

/// Material parameters as data (no shader here; RR-T5).
#[derive(Clone, Debug, PartialEq)]
pub struct OverlayMaterial {
    /// Material model.
    pub kind: MaterialKind,
    /// `color`, linear working space (`new THREE.Color(hex)`).
    pub color: [f64; 3],
    /// `emissive`, linear (`None` for a sprite material, which has none).
    pub emissive: Option<[f64; 3]>,
    /// `map`.
    pub map: Option<TextureRef>,
    /// `emissiveMap`.
    pub emissive_map: Option<TextureRef>,
    /// `transparent`.
    pub transparent: bool,
    /// `depthTest`.
    pub depth_test: bool,
    /// `depthWrite`.
    pub depth_write: bool,
    /// `toneMapped`.
    pub tone_mapped: bool,
    /// `side`.
    pub side: Side,
    /// `opacity`.
    pub opacity: f64,
    /// `roughness` (standard only).
    pub roughness: Option<f64>,
    /// `metalness` (standard only).
    pub metalness: Option<f64>,
}

fn lin(c: Color) -> [f64; 3] {
    [c.r, c.g, c.b]
}

/// `makeFlatMaterial(color, map)` (`unitStatPlate.ts:379-393`): unlit plate —
/// black diffuse, the whole colour through `emissive` (and `emissiveMap`).
#[must_use]
pub fn flat_material(color: u32, map: Option<TextureRef>) -> OverlayMaterial {
    OverlayMaterial {
        kind: MaterialKind::Standard,
        color: lin(Color::from_hex(0x000000)),
        emissive: Some(lin(Color::from_hex(color))),
        map: map.clone(),
        emissive_map: map,
        transparent: true,
        depth_test: false,
        depth_write: false,
        tone_mapped: false,
        side: Side::Double,
        opacity: 1.0,
        roughness: Some(1.0),
        metalness: Some(0.0),
    }
}

/// Geometry of an overlay mesh. All are module singletons in the web.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GeometryKind {
    /// `new THREE.PlaneGeometry(1, 1)` — origin in the centre
    /// (`unitStatPlate.ts:332-336`).
    QuadCenter,
    /// The same plane translated by (+0.5, 0, 0) — origin at the left edge
    /// (`unitStatPlate.ts:357-370`).
    QuadLeft,
    /// The extruded five-pointed veteran star (`unitVeteranBadges.ts:153-169`).
    VeteranStar,
}

impl GeometryKind {
    /// The CPU mesh (Three `BufferGeometry` layout).
    #[must_use]
    pub fn mesh(self) -> Mesh {
        match self {
            GeometryKind::QuadCenter => plane_geometry(1.0, 1.0, 1, 1),
            GeometryKind::QuadLeft => {
                let mut g = plane_geometry(1.0, 1.0, 1, 1);
                g.translate(0.5, 0.0, 0.0);
                g
            }
            GeometryKind::VeteranStar => veteran_badges::veteran_star_geometry(),
        }
    }
}

/// What a node is.
#[derive(Clone, Debug, PartialEq)]
pub enum NodeKind {
    /// `THREE.Group`.
    Group,
    /// `THREE.Mesh`.
    Mesh {
        /// Geometry.
        geometry: GeometryKind,
        /// Material.
        material: OverlayMaterial,
    },
    /// `THREE.Sprite` (legacy medallion).
    Sprite {
        /// `sprite.center`.
        center: [f64; 2],
        /// Material.
        material: OverlayMaterial,
    },
}

/// One object of an overlay sub-tree, in local coordinates of its parent.
#[derive(Clone, Debug, PartialEq)]
pub struct OverlayNode {
    /// `object.name`.
    pub name: &'static str,
    /// Index of the parent in [`OverlayTree::nodes`]; `None` for the root.
    pub parent: Option<usize>,
    /// `position`.
    pub position: [f64; 3],
    /// `rotation` (Euler XYZ).
    pub rotation: [f64; 3],
    /// `scale`.
    pub scale: [f64; 3],
    /// `renderOrder`.
    pub render_order: i32,
    /// `visible`.
    pub visible: bool,
    /// `userData[VETERAN_BADGE_HIT_UD] === true` (`unitVeteranBadges.ts:205`).
    pub veteran_badge_hit: bool,
    /// Group / mesh / sprite.
    pub kind: NodeKind,
}

impl OverlayNode {
    fn group(name: &'static str, parent: Option<usize>) -> Self {
        OverlayNode {
            name,
            parent,
            position: [0.0; 3],
            rotation: [0.0; 3],
            scale: [1.0; 3],
            render_order: 0,
            visible: true,
            veteran_badge_hit: false,
            kind: NodeKind::Group,
        }
    }

    fn mesh(
        parent: usize,
        geometry: GeometryKind,
        material: OverlayMaterial,
        position: [f64; 3],
        scale: [f64; 3],
        render_order: i32,
    ) -> Self {
        OverlayNode {
            name: "",
            parent: Some(parent),
            position,
            rotation: [0.0; 3],
            scale,
            render_order,
            visible: true,
            veteran_badge_hit: false,
            kind: NodeKind::Mesh { geometry, material },
        }
    }
}

/// The sub-tree an overlay function adds to a token, in depth-first
/// (Three `traverse`) order; `nodes[0]` is its root.
#[derive(Clone, Debug, PartialEq, Default)]
pub struct OverlayTree {
    /// Nodes, parents before children.
    pub nodes: Vec<OverlayNode>,
}

impl OverlayTree {
    fn push(&mut self, n: OverlayNode) -> usize {
        self.nodes.push(n);
        self.nodes.len() - 1
    }

    /// Every texture referenced by a material of the tree, in node order.
    #[must_use]
    pub fn textures(&self) -> Vec<&TextureRef> {
        let mut out = Vec::new();
        for n in &self.nodes {
            if let NodeKind::Mesh { material, .. } | NodeKind::Sprite { material, .. } = &n.kind {
                if let Some(t) = &material.map {
                    out.push(t);
                }
            }
        }
        out
    }
}

/// JS `String(n)` for the numbers the overlays print: integers (after
/// `Math.round`) and ±Infinity. Integers below 1e21 print as plain digits;
/// from 1e21 on, JS switches to the exponent form (`1e+21`).
#[must_use]
pub fn js_number_string(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();
    }
    if n == 0.0 {
        return "0".into();
    }
    if n.abs() >= 1e21 {
        // Rust `{:e}` prints the shortest round-trip mantissa, like JS.
        return format!("{n:e}").replacen('e', "e+", 1);
    }
    format!("{n}")
}

/// JS `String.prototype.trim` (ECMA-262 WhiteSpace + LineTerminator).
#[must_use]
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(|c: char| {
        matches!(
            c,
            '\u{9}'..='\u{d}'
                | ' '
                | '\u{a0}'
                | '\u{1680}'
                | '\u{2000}'..='\u{200a}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202f}'
                | '\u{205f}'
                | '\u{3000}'
                | '\u{feff}'
        )
    })
}

/// A new transparent canvas.
fn canvas(w: u32, h: u32) -> Result<Canvas2dLite, RasterError> {
    Canvas2dLite::new(w, h)
}
