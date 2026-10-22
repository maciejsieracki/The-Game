//! Geometry of a mesh node: a parametric Three.js primitive ([`Prim`]), a
//! procedural body owned by a model module ([`GeoBody`]) or a prebuilt CPU
//! buffer shared by pointer ([`Geometry`], e.g. the decor singletons).
//!
//! The three cases replace the per-module geometry enums of the earlier
//! topics (`core::scene::Geometry`, `wonders::Primitive`,
//! `unit_core::model::{Geo, Prim}` with its `Prim::Kamien/Braz/Zelazo`
//! hooks, `misc::MiscGeo`, `improvements::ExtraGeo`, `cities::CityGeo`).
//! Every builder call is unchanged, so the CPU buffers stay vertex-for-vertex
//! Three r169 (see [`crate::geom`]).

use std::any::Any;
use std::borrow::Cow;
use std::f64::consts::PI;
use std::fmt;
use std::sync::Arc;

use crate::geom::{self, Mesh};

/// CPU geometry of a mesh: the `position` / `normal` / `uv` / `index` of
/// [`Mesh`] plus the optional `color` attribute (3 floats per vertex, like a
/// `Float32BufferAttribute`).
#[derive(Clone, Debug, PartialEq, Default)]
pub struct Geometry {
    /// Positions, normals, UVs, index and groups.
    pub mesh: Mesh,
    /// `geometry.getAttribute('color')`.
    pub colors: Option<Vec<f32>>,
}

impl From<Mesh> for Geometry {
    fn from(mesh: Mesh) -> Self {
        Self { mesh, colors: None }
    }
}

/// Parametric Three.js primitive: the constructor arguments the web passes
/// (every other argument takes the Three r169 default).
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Prim {
    /// `BoxGeometry(w, h, d)`.
    Box {
        /// Width.
        w: f64,
        /// Height.
        h: f64,
        /// Depth.
        d: f64,
    },
    /// `CylinderGeometry(rt, rb, h, radial, 1, open)`.
    Cylinder {
        /// Top radius.
        rt: f64,
        /// Bottom radius.
        rb: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
        /// `openEnded`.
        open: bool,
    },
    /// `ConeGeometry(r, h, radial, 1)`.
    Cone {
        /// Radius.
        r: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
    },
    /// `SphereGeometry(r, ws, hs, phiStart, phiLength, thetaStart, thetaLength)`.
    Sphere {
        /// Radius.
        r: f64,
        /// Width segments.
        ws: u32,
        /// Height segments.
        hs: u32,
        /// `phiStart`.
        phi_start: f64,
        /// `phiLength`.
        phi_len: f64,
        /// `thetaStart`.
        theta_start: f64,
        /// `thetaLength`.
        theta_len: f64,
    },
    /// `TorusGeometry(r, tube, radial, tubular, arc)`.
    Torus {
        /// Radius.
        r: f64,
        /// Tube radius.
        tube: f64,
        /// Radial segments.
        radial: u32,
        /// Tubular segments.
        tubular: u32,
        /// Arc.
        arc: f64,
    },
    /// `IcosahedronGeometry(r, detail)`.
    Icosahedron {
        /// Radius.
        r: f64,
        /// Detail.
        detail: u32,
    },
    /// `DodecahedronGeometry(r, detail)`.
    Dodecahedron {
        /// Radius.
        r: f64,
        /// Detail.
        detail: u32,
    },
    /// `CircleGeometry(r, segments)` (XY plane, full circle).
    Circle {
        /// Radius.
        r: f64,
        /// Segments.
        segments: u32,
    },
    /// `RingGeometry(inner, outer, thetaSegments)` (1 phi segment, full ring).
    Ring {
        /// Inner radius.
        inner: f64,
        /// Outer radius.
        outer: f64,
        /// Theta segments.
        segments: u32,
    },
}

impl Prim {
    /// `BoxGeometry(w, h, d)`.
    #[must_use]
    pub const fn bx(w: f64, h: f64, d: f64) -> Self {
        Self::Box { w, h, d }
    }

    /// `CylinderGeometry(rt, rb, h, radial, 1)` (closed).
    #[must_use]
    pub const fn cyl(rt: f64, rb: f64, h: f64, radial: u32) -> Self {
        Self::Cylinder {
            rt,
            rb,
            h,
            radial,
            open: false,
        }
    }

    /// `CylinderGeometry(rt, rb, h, radial, 1, true)` (open-ended).
    #[must_use]
    pub const fn cyl_open(rt: f64, rb: f64, h: f64, radial: u32) -> Self {
        Self::Cylinder {
            rt,
            rb,
            h,
            radial,
            open: true,
        }
    }

    /// `ConeGeometry(r, h, radial)`.
    #[must_use]
    pub const fn cone(r: f64, h: f64, radial: u32) -> Self {
        Self::Cone { r, h, radial }
    }

    /// `geometry.parameters.height` with the `?? 1` fallback of
    /// `jednostki-p1-rdzen.ts:139` (`parameters?.height ?? 1`).
    #[must_use]
    pub const fn parameters_height(&self) -> f64 {
        match *self {
            Self::Box { h, .. } | Self::Cylinder { h, .. } | Self::Cone { h, .. } => h,
            _ => 1.0,
        }
    }

    /// `geometry.type` of three r169.
    #[must_use]
    pub const fn three_type(&self) -> &'static str {
        match self {
            Self::Box { .. } => "BoxGeometry",
            Self::Cylinder { .. } => "CylinderGeometry",
            Self::Cone { .. } => "ConeGeometry",
            Self::Sphere { .. } => "SphereGeometry",
            Self::Torus { .. } => "TorusGeometry",
            Self::Icosahedron { .. } => "IcosahedronGeometry",
            Self::Dodecahedron { .. } => "DodecahedronGeometry",
            Self::Circle { .. } => "CircleGeometry",
            Self::Ring { .. } => "RingGeometry",
        }
    }

    /// Builds the geometry (vertex-for-vertex like Three r169).
    #[must_use]
    pub fn build(&self) -> Mesh {
        match *self {
            Self::Box { w, h, d } => geom::box_geometry(w, h, d, 1, 1, 1),
            Self::Cylinder {
                rt,
                rb,
                h,
                radial,
                open,
            } => geom::cylinder_geometry(rt, rb, h, radial, 1, open, 0.0, PI * 2.0),
            Self::Cone { r, h, radial } => {
                geom::cone_geometry(r, h, radial, 1, false, 0.0, PI * 2.0)
            }
            Self::Sphere {
                r,
                ws,
                hs,
                phi_start,
                phi_len,
                theta_start,
                theta_len,
            } => geom::sphere_geometry(r, ws, hs, phi_start, phi_len, theta_start, theta_len),
            Self::Torus {
                r,
                tube,
                radial,
                tubular,
                arc,
            } => geom::torus_geometry(r, tube, radial, tubular, arc),
            Self::Icosahedron { r, detail } => geom::icosahedron_geometry(r, detail),
            Self::Dodecahedron { r, detail } => geom::dodecahedron_geometry(r, detail),
            Self::Circle { r, segments } => geom::circle_geometry(r, segments, 0.0, PI * 2.0),
            Self::Ring {
                inner,
                outer,
                segments,
            } => geom::ring_geometry(inner, outer, segments, 1, 0.0, PI * 2.0),
        }
    }
}

/// Object-safe equality for [`GeoBody`] (implemented for every
/// `PartialEq + 'static` type by a blanket impl; do not implement by hand).
pub trait DynEq {
    /// `self == other` when `other` has the same concrete type.
    fn dyn_eq(&self, other: &dyn Any) -> bool;
    /// Upcast for [`DynEq::dyn_eq`] and downcasting.
    fn as_any(&self) -> &dyn Any;
}

impl<T: PartialEq + 'static> DynEq for T {
    fn dyn_eq(&self, other: &dyn Any) -> bool {
        other.downcast_ref::<T>().is_some_and(|o| self == o)
    }
    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// A procedural geometry owned by a model module (non-parametric
/// `BufferGeometry` bodies, extrusions, shapes with holes, ...): the module
/// keeps its own parameter type and only tells the scene how to build it.
pub trait GeoBody: fmt::Debug + Send + Sync + DynEq {
    /// Builds the CPU geometry.
    fn build(&self) -> Mesh;
    /// `geometry.type` of three r169 (e.g. `"BufferGeometry"`).
    fn three_type(&self) -> &'static str;
}

impl PartialEq for dyn GeoBody {
    fn eq(&self, other: &Self) -> bool {
        self.dyn_eq(other.as_any())
    }
}

/// Geometry of a mesh node.
#[derive(Debug, Clone, PartialEq)]
pub enum Geo {
    /// A parametric Three.js primitive.
    Prim(Prim),
    /// A procedural body of a model module.
    Body(Arc<dyn GeoBody>),
    /// A prebuilt CPU buffer (shared by pointer like a three singleton).
    Buffer(Arc<Geometry>),
}

impl From<Prim> for Geo {
    fn from(p: Prim) -> Self {
        Self::Prim(p)
    }
}

impl From<Arc<Geometry>> for Geo {
    fn from(g: Arc<Geometry>) -> Self {
        Self::Buffer(g)
    }
}

impl Geo {
    /// Wraps a module body.
    #[must_use]
    pub fn body(b: impl GeoBody + 'static) -> Self {
        Self::Body(Arc::new(b))
    }

    /// The parametric primitive, if this is one.
    #[must_use]
    pub const fn prim(&self) -> Option<Prim> {
        match self {
            Self::Prim(p) => Some(*p),
            _ => None,
        }
    }

    /// The module body downcast to `T`, if it is one.
    #[must_use]
    pub fn body_as<T: 'static>(&self) -> Option<&T> {
        match self {
            Self::Body(b) => b.as_any().downcast_ref::<T>(),
            _ => None,
        }
    }

    /// The shared buffer, if this is one.
    #[must_use]
    pub const fn buffer(&self) -> Option<&Arc<Geometry>> {
        match self {
            Self::Buffer(g) => Some(g),
            _ => None,
        }
    }

    /// `geometry.parameters?.height ?? 1`.
    #[must_use]
    pub const fn parameters_height(&self) -> f64 {
        match self {
            Self::Prim(p) => p.parameters_height(),
            _ => 1.0,
        }
    }

    /// `geometry.type` of three r169.
    #[must_use]
    pub fn three_type(&self) -> &'static str {
        match self {
            Self::Prim(p) => p.three_type(),
            Self::Body(b) => b.three_type(),
            Self::Buffer(_) => "BufferGeometry",
        }
    }

    /// The CPU mesh (borrowed for a shared buffer, built otherwise).
    #[must_use]
    pub fn mesh(&self) -> Cow<'_, Mesh> {
        match self {
            Self::Prim(p) => Cow::Owned(p.build()),
            Self::Body(b) => Cow::Owned(b.build()),
            Self::Buffer(g) => Cow::Borrowed(&g.mesh),
        }
    }

    /// Builds (or clones) the CPU mesh.
    #[must_use]
    pub fn build(&self) -> Mesh {
        self.mesh().into_owned()
    }

    /// The `color` vertex attribute (only shared buffers carry one).
    #[must_use]
    pub fn colors(&self) -> Option<&[f32]> {
        match self {
            Self::Buffer(g) => g.colors.as_deref(),
            _ => None,
        }
    }
}
