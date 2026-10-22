//! Object tree of a city model: the CPU equivalent of the `THREE.Group` that
//! the web city builders return.
//!
//! The tree itself is the shared [`UnitModel`] arena of
//! `models::unit_core::model` (nodes, parent/children, `position` /
//! `rotation` / `quaternion` / `scale`, V8-exact `setFromEuler`), as the
//! dispatch requires (no new tree type). Its mesh payload
//! (`unit_core::model::Geo`, `Material`) is a closed enum outside this
//! topic's allowlist and cannot express what the city files draw
//! (`CircleGeometry`, the extruded hex wall ring, `LineLoop` outlines,
//! `MeshLambertMaterial` / `LineBasicMaterial` with linear-space colours),
//! so the tree's own `mesh` field stays `None` and every drawable is kept
//! in [`CityModel::drawables`], indexed by the same [`NodeId`] (the
//! "minimal type in the own module" of the dispatch).

use std::f64::consts::PI;

use crate::core::hex_shape::{append_pointy_top_hex, hex_ring_points_xz};
use crate::geom::{self, Mat4, Vec3};
use crate::models::unit_core::model::{quat_from_euler, NodeId, UnitModel, ROOT};
use crate::pick::three::{js_max, js_min};
use crate::terrain::color::Color;

/// Geometry of one drawable (Three.js constructor arguments; every other
/// argument is the Three r169 default).
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
    /// `getHexWallRingGeo(outerR, innerR, height)` of
    /// `bronzeCityRoblox.ts:72-85` / `stoneCityRoblox.ts:114-127`: a
    /// pointy-top hex ring (outer outline + reversed inner hole) extruded by
    /// `height` without bevel, then `rotateX(-π/2)`.
    HexWallRing {
        /// Outer radius.
        outer: f64,
        /// Inner radius.
        inner: f64,
        /// Extrusion depth.
        height: f64,
    },
    /// `new BufferGeometry().setFromPoints(hexRingPointsXZ(r, y))`
    /// (`cityMapOutline.ts:25`): 6 points, positions only, no index.
    HexLoop {
        /// Ring radius.
        r: f64,
        /// Ring height.
        y: f64,
    },
}

impl CityGeo {
    /// Builds the CPU geometry (vertex-for-vertex Three r169, see [`crate::geom`]).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        match *self {
            Self::Box { w, h, d } => geom::box_geometry(w, h, d, 1, 1, 1),
            Self::Cylinder { rt, rb, h, radial } => {
                geom::cylinder_geometry(rt, rb, h, radial, 1, false, 0.0, PI * 2.0)
            }
            Self::Cone { r, h, radial } => {
                geom::cone_geometry(r, h, radial, 1, false, 0.0, PI * 2.0)
            }
            Self::Circle { r, segments } => geom::circle_geometry(r, segments, 0.0, PI * 2.0),
            Self::HexWallRing {
                outer,
                inner,
                height,
            } => {
                // `tracePointyTopHex` (`bronzeCityRoblox.ts:57-68`, identical in
                // `stoneCityRoblox.ts:99-110`) == `appendPointyTopHex`
                // (`hexShape.ts:17-32`) on a fresh path: reuse `core::hex_shape`.
                let mut outline = geom::Path2::new();
                append_pointy_top_hex(&mut outline, outer, false);
                let mut hole = geom::Path2::new();
                append_pointy_top_hex(&mut hole, inner, true);
                let shape = geom::Shape {
                    outline,
                    holes: vec![hole],
                };
                let mut m = geom::extrude_geometry(&[shape], &geom::ExtrudeOptions::flat(height));
                m.rotate_x(-PI / 2.0);
                m
            }
            Self::HexLoop { r, y } => {
                let mut positions = Vec::with_capacity(18);
                for p in hex_ring_points_xz(r, y) {
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
        }
    }
}

/// Material parameters as data (shading is RR-T5).
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

impl CityMaterial {
    /// `material.color` (linear).
    #[must_use]
    pub const fn color(&self) -> Color {
        match *self {
            Self::Lambert { color, .. } | Self::LineBasic { color, .. } => color,
        }
    }
}

/// Index of a material in [`CityModel::materials`].
pub type CityMatId = usize;

/// How a drawable is drawn.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DrawKind {
    /// `THREE.Mesh` (triangles).
    Mesh,
    /// `THREE.LineLoop`.
    LineLoop,
}

/// The drawable attached to a node.
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

/// A built city (or outline) model.
#[derive(Debug, Clone, PartialEq)]
pub struct CityModel {
    /// Object tree (shared unit-core arena); [`ROOT`] is the returned group.
    pub tree: UnitModel,
    /// Drawable per node id (`None` = `THREE.Group`).
    pub drawables: Vec<Option<Drawable>>,
    /// Materials in creation order (unused ones included, like the web
    /// palettes that create every material up front).
    pub materials: Vec<CityMaterial>,
    /// `root.userData` of the `miasto-*` builders.
    pub user_data: CityUserData,
}

impl Default for CityModel {
    fn default() -> Self {
        Self::new()
    }
}

impl CityModel {
    /// Empty root group.
    #[must_use]
    pub fn new() -> Self {
        Self {
            tree: UnitModel::new(),
            drawables: vec![None],
            materials: Vec::new(),
            user_data: CityUserData::default(),
        }
    }

    /// `new MeshLambertMaterial({ color: hex, flatShading })`.
    pub fn lambert(&mut self, hex: u32, flat_shading: bool) -> CityMatId {
        self.lambert_color(Color::from_hex(hex), flat_shading)
    }

    /// `new MeshLambertMaterial({ color: <THREE.Color>, flatShading })`.
    pub fn lambert_color(&mut self, color: Color, flat_shading: bool) -> CityMatId {
        self.add_material(CityMaterial::Lambert {
            color,
            flat_shading,
        })
    }

    /// Adds a material.
    pub fn add_material(&mut self, m: CityMaterial) -> CityMatId {
        self.materials.push(m);
        self.materials.len() - 1
    }

    /// `parent.add(new THREE.Group())`.
    pub fn group(&mut self, parent: NodeId) -> NodeId {
        let id = self.tree.add_group(parent);
        self.drawables.push(None);
        id
    }

    /// `new THREE.Group()` not yet attached.
    pub fn detached_group(&mut self) -> NodeId {
        let id = self.tree.detached_group();
        self.drawables.push(None);
        id
    }

    /// `parent.add(child)`.
    pub fn attach(&mut self, parent: NodeId, child: NodeId) {
        self.tree.attach(parent, child);
    }

    /// `parent.add(new THREE.Mesh(geo, material))` (no shadow flags).
    pub fn mesh(&mut self, parent: NodeId, geo: CityGeo, material: CityMatId) -> NodeId {
        self.drawable(parent, DrawKind::Mesh, geo, material)
    }

    /// `parent.add(new THREE.<kind>(geo, material))`.
    pub fn drawable(
        &mut self,
        parent: NodeId,
        kind: DrawKind,
        geo: CityGeo,
        material: CityMatId,
    ) -> NodeId {
        let id = self.tree.add_group(parent);
        self.drawables.push(Some(Drawable {
            kind,
            geo,
            material,
            cast_shadow: false,
            receive_shadow: false,
            render_order: 0,
        }));
        id
    }

    /// Mutable drawable of a node (panics on a group).
    pub fn drawable_mut(&mut self, id: NodeId) -> &mut Drawable {
        self.drawables[id]
            .as_mut()
            .unwrap_or_else(|| panic!("node {id} is a group"))
    }

    /// `object.position.set(x, y, z)`.
    pub fn set_pos(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        self.tree.node(id).set_pos(x, y, z);
    }

    /// `object.rotation.set(x, y, z)` (order `XYZ`; quaternion recomputed
    /// with V8 trig).
    pub fn set_rot(&mut self, id: NodeId, x: f64, y: f64, z: f64) {
        let n = self.tree.node(id);
        n.rotation.x = x;
        n.rotation.y = y;
        n.rotation.z = z;
        n.quaternion = quat_from_euler(n.rotation);
    }

    /// `object.rotation.y = v`.
    pub fn set_rot_y(&mut self, id: NodeId, v: f64) {
        self.tree.node(id).rot_y(v);
    }

    /// `object.scale.setScalar(s)`.
    pub fn set_scale_scalar(&mut self, id: NodeId, s: f64) {
        self.tree.node(id).set_scale_scalar(s);
    }

    /// Node ids in `Object3D.traverse` order from [`ROOT`].
    #[must_use]
    pub fn traverse(&self) -> Vec<NodeId> {
        self.tree.traverse()
    }

    /// Drawable nodes in traverse order.
    #[must_use]
    pub fn drawable_nodes(&self) -> Vec<NodeId> {
        self.traverse()
            .into_iter()
            .filter(|&n| self.drawables[n].is_some())
            .collect()
    }

    /// `updateMatrixWorld(true)` with the root under `root_parent` (`None`
    /// = the root is a scene-graph root, whose `matrixWorld` is its
    /// `matrix`). One matrix per node id.
    #[must_use]
    pub fn world_matrices(&self, root_parent: Option<&Mat4>) -> Vec<Mat4> {
        let mut world = vec![Mat4::IDENTITY; self.tree.nodes.len()];
        for id in self.traverse() {
            let local = self.tree.local_matrix(id);
            world[id] = match self.tree.nodes[id].parent {
                Some(p) => world[p].mul(&local),
                None => match root_parent {
                    Some(m) if id == ROOT => m.mul(&local),
                    _ => local,
                },
            };
        }
        world
    }

    /// `new Box3().setFromObject(root, true)` as
    /// `[min.x, min.y, min.z, max.x, max.y, max.z]` (every drawable vertex,
    /// meshes and line loops).
    #[must_use]
    pub fn bounding_box(&self, root_parent: Option<&Mat4>) -> [f64; 6] {
        let world = self.world_matrices(root_parent);
        let mut b = [
            f64::INFINITY,
            f64::INFINITY,
            f64::INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
            f64::NEG_INFINITY,
        ];
        for id in self.drawable_nodes() {
            let Some(d) = self.drawables[id] else {
                continue;
            };
            let g = d.geo.build();
            for v in g.positions.chunks_exact(3) {
                let p = Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                    .apply_mat4(&world[id]);
                b[0] = js_min(b[0], p.x);
                b[1] = js_min(b[1], p.y);
                b[2] = js_min(b[2], p.z);
                b[3] = js_max(b[3], p.x);
                b[4] = js_max(b[4], p.y);
                b[5] = js_max(b[5], p.z);
            }
        }
        b
    }

    /// Number of `THREE.Mesh` nodes.
    #[must_use]
    pub fn mesh_count(&self) -> usize {
        self.drawables
            .iter()
            .flatten()
            .filter(|d| d.kind == DrawKind::Mesh)
            .count()
    }

    /// Number of triangles over every mesh (line loops excluded).
    #[must_use]
    pub fn triangle_count(&self) -> usize {
        self.drawables
            .iter()
            .flatten()
            .filter(|d| d.kind == DrawKind::Mesh)
            .map(|d| d.geo.build().triangle_count())
            .sum()
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
