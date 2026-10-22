//! Object tree of a city model: the CPU equivalent of the `THREE.Group` that
//! the web city builders return.
//!
//! Since R-RUSTPORT-P4-27-SCENE-UNIFY-Q1 a city model is the renderer's one
//! scene-tree type, [`crate::scene::Scene`] ([`CityModel`] is an alias). The
//! P4.21 side table of drawables is gone: meshes and line loops are
//! [`NodeKind::Mesh`] / [`NodeKind::LineLoop`] nodes whose geometry is a
//! [`Geo`] and whose material is a scene [`Material`]; shadows and
//! `renderOrder` are node fields; `root.userData` is the root node's
//! `user_data`.
//!
//! The P4.21 names stay as constructor / read views of that data:
//! [`CityGeo`] (constructor arguments; converted into [`Geo`] when a mesh is
//! added, read back with [`CityGeo::of`]), [`CityMaterial`] (likewise for
//! [`Material`]), [`Drawable`] / [`DrawKind`] (read view of a drawable node,
//! [`drawable`]) and [`CityUserData`] ([`city_user_data`] /
//! [`set_city_user_data`]).

use std::f64::consts::PI;

use crate::core::hex_shape::{append_pointy_top_hex, hex_ring_points_xz};
use crate::geom;
use crate::models::unit_core::model::{NodeId, ROOT};
pub use crate::scene::{Geo, GeoBody, Material, MaterialKind, NodeKind, Prim, Scene};
use crate::scene::{MatId, UserValue};
use crate::terrain::color::Color;

/// A built city (or outline) model (alias of [`Scene`]).
pub type CityModel = Scene;

/// Index of a material in the model's `materials`.
pub type CityMatId = MatId;

/// `getHexWallRingGeo(outerR, innerR, height)` of
/// `bronzeCityRoblox.ts:72-85` / `stoneCityRoblox.ts:114-127`: a pointy-top
/// hex ring (outer outline + reversed inner hole) extruded by `height`
/// without bevel, then `rotateX(-π/2)`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HexWallRing {
    /// Outer radius.
    pub outer: f64,
    /// Inner radius.
    pub inner: f64,
    /// Extrusion depth.
    pub height: f64,
}

impl GeoBody for HexWallRing {
    fn build(&self) -> geom::Mesh {
        // `tracePointyTopHex` (`bronzeCityRoblox.ts:57-68`, identical in
        // `stoneCityRoblox.ts:99-110`) == `appendPointyTopHex`
        // (`hexShape.ts:17-32`) on a fresh path: reuse `core::hex_shape`.
        let mut outline = geom::Path2::new();
        append_pointy_top_hex(&mut outline, self.outer, false);
        let mut hole = geom::Path2::new();
        append_pointy_top_hex(&mut hole, self.inner, true);
        let shape = geom::Shape {
            outline,
            holes: vec![hole],
        };
        let mut m = geom::extrude_geometry(&[shape], &geom::ExtrudeOptions::flat(self.height));
        m.rotate_x(-PI / 2.0);
        m
    }
    fn three_type(&self) -> &'static str {
        "ExtrudeGeometry"
    }
}

/// `new BufferGeometry().setFromPoints(hexRingPointsXZ(r, y))`
/// (`cityMapOutline.ts:25`): 6 points, positions only, no index.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HexLoop {
    /// Ring radius.
    pub r: f64,
    /// Ring height.
    pub y: f64,
}

impl GeoBody for HexLoop {
    fn build(&self) -> geom::Mesh {
        let mut positions = Vec::with_capacity(18);
        for p in hex_ring_points_xz(self.r, self.y) {
            // `position.push(point.x, point.y, point.z || 0)`
            let z = if p.z == 0.0 || p.z.is_nan() { 0.0 } else { p.z };
            #[allow(clippy::cast_possible_truncation)]
            positions.extend_from_slice(&[p.x as f32, p.y as f32, z as f32]);
        }
        geom::Mesh {
            positions,
            normals: Vec::new(),
            uvs: Vec::new(),
            indices: None,
            groups: Vec::new(),
        }
    }
    fn three_type(&self) -> &'static str {
        "BufferGeometry"
    }
}

/// Geometry of one city drawable as Three.js constructor arguments (every
/// other argument is the Three r169 default) — a constructor / read view of
/// [`Geo`].
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CityGeo {
    /// `new BoxGeometry(w, h, d)`.
    Box {
        /// Width.
        w: f64,
        /// Height.
        h: f64,
        /// Depth.
        d: f64,
    },
    /// `new CylinderGeometry(rt, rb, h, radial)` (1 height segment, closed).
    Cylinder {
        /// Top radius.
        rt: f64,
        /// Bottom radius.
        rb: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
    },
    /// `new ConeGeometry(r, h, radial)`.
    Cone {
        /// Radius.
        r: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
    },
    /// `new CircleGeometry(r, segments)` (XY plane).
    Circle {
        /// Radius.
        r: f64,
        /// Segments.
        segments: u32,
    },
    /// [`HexWallRing`].
    HexWallRing {
        /// Outer radius.
        outer: f64,
        /// Inner radius.
        inner: f64,
        /// Extrusion depth.
        height: f64,
    },
    /// [`HexLoop`].
    HexLoop {
        /// Ring radius.
        r: f64,
        /// Ring height.
        y: f64,
    },
}

impl From<CityGeo> for Geo {
    fn from(g: CityGeo) -> Self {
        match g {
            CityGeo::Box { w, h, d } => Geo::Prim(Prim::bx(w, h, d)),
            CityGeo::Cylinder { rt, rb, h, radial } => Geo::Prim(Prim::cyl(rt, rb, h, radial)),
            CityGeo::Cone { r, h, radial } => Geo::Prim(Prim::cone(r, h, radial)),
            CityGeo::Circle { r, segments } => Geo::Prim(Prim::Circle { r, segments }),
            CityGeo::HexWallRing {
                outer,
                inner,
                height,
            } => Geo::body(HexWallRing {
                outer,
                inner,
                height,
            }),
            CityGeo::HexLoop { r, y } => Geo::body(HexLoop { r, y }),
        }
    }
}

impl CityGeo {
    /// The city view of a scene geometry (`None` for a geometry no city
    /// builder creates).
    #[must_use]
    pub fn of(g: &Geo) -> Option<Self> {
        match g {
            Geo::Prim(Prim::Box { w, h, d }) => Some(Self::Box {
                w: *w,
                h: *h,
                d: *d,
            }),
            Geo::Prim(Prim::Cylinder {
                rt,
                rb,
                h,
                radial,
                open: false,
            }) => Some(Self::Cylinder {
                rt: *rt,
                rb: *rb,
                h: *h,
                radial: *radial,
            }),
            Geo::Prim(Prim::Cone { r, h, radial }) => Some(Self::Cone {
                r: *r,
                h: *h,
                radial: *radial,
            }),
            Geo::Prim(Prim::Circle { r, segments }) => Some(Self::Circle {
                r: *r,
                segments: *segments,
            }),
            Geo::Body(_) => {
                if let Some(w) = g.body_as::<HexWallRing>() {
                    Some(Self::HexWallRing {
                        outer: w.outer,
                        inner: w.inner,
                        height: w.height,
                    })
                } else {
                    g.body_as::<HexLoop>()
                        .map(|l| Self::HexLoop { r: l.r, y: l.y })
                }
            }
            _ => None,
        }
    }

    /// Builds the CPU geometry (vertex-for-vertex Three r169, see [`crate::geom`]).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        Geo::from(*self).build()
    }
}

/// Material parameters of a city drawable — a constructor / read view of
/// [`Material`].
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CityMaterial {
    /// `new MeshLambertMaterial({ color, flatShading })` (front side, opaque).
    Lambert {
        /// `material.color` in the linear working space.
        color: Color,
        /// `flatShading`.
        flat_shading: bool,
    },
    /// `new LineBasicMaterial({ color, transparent, opacity, depthWrite })`.
    LineBasic {
        /// `material.color` in the linear working space.
        color: Color,
        /// `transparent`.
        transparent: bool,
        /// `opacity`.
        opacity: f64,
        /// `depthWrite`.
        depth_write: bool,
    },
}

impl From<CityMaterial> for Material {
    fn from(m: CityMaterial) -> Self {
        match m {
            CityMaterial::Lambert {
                color,
                flat_shading,
            } => {
                let mut mt = Material::with_color(MaterialKind::Lambert, Some(color));
                mt.flat_shading = flat_shading;
                mt
            }
            CityMaterial::LineBasic {
                color,
                transparent,
                opacity,
                depth_write,
            } => {
                let mut mt = Material::with_color(MaterialKind::LineBasic, Some(color));
                mt.transparent = transparent;
                mt.opacity = opacity;
                mt.depth_write = depth_write;
                mt
            }
        }
    }
}

impl CityMaterial {
    /// `material.color` (linear).
    #[must_use]
    pub const fn color(&self) -> Color {
        match *self {
            Self::Lambert { color, .. } | Self::LineBasic { color, .. } => color,
        }
    }

    /// The city view of a scene material (`None` for a class no city
    /// builder creates).
    #[must_use]
    pub fn of(m: &Material) -> Option<Self> {
        let color = m.linear_color();
        match m.kind {
            MaterialKind::Lambert => Some(Self::Lambert {
                color,
                flat_shading: m.flat_shading,
            }),
            MaterialKind::LineBasic => Some(Self::LineBasic {
                color,
                transparent: m.transparent,
                opacity: m.opacity,
                depth_write: m.depth_write,
            }),
            _ => None,
        }
    }
}

/// How a drawable is drawn.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DrawKind {
    /// `THREE.Mesh` (triangles).
    Mesh,
    /// `THREE.LineLoop`.
    LineLoop,
}

/// Read view of a drawable node.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Drawable {
    /// Mesh or line loop.
    pub kind: DrawKind,
    /// Geometry.
    pub geo: CityGeo,
    /// Material.
    pub material: CityMatId,
    /// `castShadow`.
    pub cast_shadow: bool,
    /// `receiveShadow`.
    pub receive_shadow: bool,
    /// `renderOrder`.
    pub render_order: i32,
}

/// The drawable of node `id` (`None` for a group).
#[must_use]
pub fn drawable(m: &Scene, id: NodeId) -> Option<Drawable> {
    let n = &m.nodes[id];
    let (kind, md) = match &n.kind {
        NodeKind::Mesh(md) => (DrawKind::Mesh, md),
        NodeKind::LineLoop(md) => (DrawKind::LineLoop, md),
        _ => return None,
    };
    Some(Drawable {
        kind,
        geo: CityGeo::of(&md.geo)?,
        material: md.material(),
        cast_shadow: n.cast_shadow,
        receive_shadow: n.receive_shadow,
        render_order: n.render_order,
    })
}

/// `Rozmiar` threshold (`RozmiarMiastaKamien` = `RozmiarMiastaBraz`,
/// `miasto-kamien.ts:78`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Rozmiar {
    /// `'male'` (levels 1-3).
    Male,
    /// `'srednie'` (levels 4-6).
    Srednie,
    /// `'duze'` (levels 7-10).
    Duze,
}

impl Rozmiar {
    /// Web string.
    #[must_use]
    pub const fn web_id(self) -> &'static str {
        match self {
            Self::Male => "male",
            Self::Srednie => "srednie",
            Self::Duze => "duze",
        }
    }
}

/// `root.userData` of the `miasto-*` builders (`model`, `poziom`, `rozmiar`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CityUserData {
    /// `'miasto-kamien'`, `'miasto-braz-grecja'` or `'miasto-braz-rzym'`.
    pub model: Option<&'static str>,
    /// Level after clamping (may be NaN, like the web).
    pub poziom: Option<f64>,
    /// Phase.
    pub rozmiar: Option<Rozmiar>,
}

/// `root.userData = { model, poziom, rozmiar }`.
pub fn set_city_user_data(m: &mut Scene, d: CityUserData) {
    let ud = &mut m.nodes[ROOT].user_data;
    if let Some(v) = d.model {
        ud.set("model", UserValue::Str(v.to_owned()));
    }
    if let Some(v) = d.poziom {
        ud.set("poziom", UserValue::Num(v));
    }
    if let Some(v) = d.rozmiar {
        ud.set("rozmiar", UserValue::Str(v.web_id().to_owned()));
    }
}

/// `root.userData` of a city model.
#[must_use]
pub fn city_user_data(m: &Scene) -> CityUserData {
    let ud = &m.nodes[ROOT].user_data;
    let model = ud.str("model").and_then(|s| {
        ["miasto-kamien", "miasto-braz-grecja", "miasto-braz-rzym"]
            .into_iter()
            .find(|k| *k == s)
    });
    let rozmiar = ud.str("rozmiar").and_then(|s| {
        [Rozmiar::Male, Rozmiar::Srednie, Rozmiar::Duze]
            .into_iter()
            .find(|r| r.web_id() == s)
    });
    CityUserData {
        model,
        poziom: ud.num("poziom"),
        rozmiar,
    }
}

/// JavaScript `Number.prototype.toString()` (radix 10) of a double: the
/// shortest round-trip digits laid out by ECMA-262 `Number::toString`
/// (used for the `visualKey` template strings).
#[must_use]
pub fn js_number_to_string(x: f64) -> String {
    if x.is_nan() {
        return "NaN".to_owned();
    }
    if x == 0.0 {
        return "0".to_owned();
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_owned();
    }
    let sign = if x < 0.0 { "-" } else { "" };
    let e = format!("{:e}", x.abs());
    let (mant, exp) = e.split_once('e').unwrap_or((&e, "0"));
    let digits: String = mant.chars().filter(char::is_ascii_digit).collect();
    let k = i64::try_from(digits.len()).unwrap_or(i64::MAX);
    let n = exp.parse::<i64>().unwrap_or(0) + 1;
    let body = if k <= n && n <= 21 {
        let zeros = usize::try_from(n - k).unwrap_or(0);
        format!("{digits}{}", "0".repeat(zeros))
    } else if 0 < n && n <= 21 {
        let cut = usize::try_from(n).unwrap_or(0);
        format!("{}.{}", &digits[..cut], &digits[cut..])
    } else if -6 < n && n <= 0 {
        let zeros = usize::try_from(-n).unwrap_or(0);
        format!("0.{}{digits}", "0".repeat(zeros))
    } else {
        let e = n - 1;
        let es = if e >= 0 {
            format!("+{e}")
        } else {
            format!("{e}")
        };
        if k == 1 {
            format!("{digits}e{es}")
        } else {
            format!("{}.{}e{es}", &digits[..1], &digits[1..])
        }
    };
    format!("{sign}{body}")
}

#[cfg(test)]
mod tests {
    use super::js_number_to_string as s;

    #[test]
    fn number_to_string_follows_ecma() {
        assert_eq!(s(3.0), "3");
        assert_eq!(s(-0.0), "0");
        assert_eq!(s(3.7), "3.7");
        assert_eq!(s(1e21), "1e+21");
        assert_eq!(s(1e20), "100000000000000000000");
        assert_eq!(s(1.5e-7), "1.5e-7");
        assert_eq!(s(0.000_001), "0.000001");
        assert_eq!(s(-2.5), "-2.5");
        assert_eq!(s(f64::NAN), "NaN");
        assert_eq!(s(f64::NEG_INFINITY), "-Infinity");
        assert_eq!(s(123.456), "123.456");
    }
}
