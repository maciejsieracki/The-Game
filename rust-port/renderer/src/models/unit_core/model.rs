//! CPU object tree of a unit model — the Rust counterpart of the
//! `THREE.Group` that the web builders return (no GPU, no upload).
//!
//! A [`UnitModel`] is an arena of [`Node`]s (index 0 = root group). Every node
//! carries `position` / `rotation` (Euler, XYZ) / `quaternion` / `scale`
//! exactly like `THREE.Object3D`; setting an Euler angle recomputes the
//! quaternion (`Quaternion.setFromEuler`), and [`UnitModel::world_matrices`]
//! reproduces `Object3D.updateMatrixWorld(true)`
//! (`matrixWorld = parent.matrixWorld * compose(p, q, s)`).
//!
//! Mesh nodes reference a geometry description ([`Geo`]) and a material slot
//! ([`MatId`]). Materials are plain data ([`Material`]); the ones created by
//! the per-token factory are "tracked" in creation order, which is the
//! `group.userData['mats']` list of the web (used by fog dimming and
//! disposal there).

use crate::geom::{self, Euler, Mat4, Quat, Vec3};

use super::jstrig::JsTrig;
use super::parts::{HorsePart, UnitPart};

/// Index of a node inside [`UnitModel::nodes`].
pub type NodeId = usize;
/// Index of a material inside [`UnitModel::materials`].
pub type MatId = usize;

/// The root node of every model.
pub const ROOT: NodeId = 0;

/// `MeshStandardMaterial` parameters as data (the material model itself is
/// RR-T5). `color` is the sRGB hex given to the web constructor.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Material {
    /// sRGB colour, `0xRRGGBB` (`material.color.getHex()`).
    pub color: u32,
    /// `metalness`.
    pub metalness: f64,
    /// `roughness`.
    pub roughness: f64,
    /// `transparent`.
    pub transparent: bool,
    /// `opacity`.
    pub opacity: f64,
    /// `flatShading`.
    pub flat_shading: bool,
}

impl Material {
    /// `new MeshStandardMaterial({ color, metalness, roughness })`.
    #[must_use]
    pub const fn standard(color: u32, metalness: f64, roughness: f64) -> Self {
        Self {
            color,
            metalness,
            roughness,
            transparent: false,
            opacity: 1.0,
            flat_shading: false,
        }
    }
}

/// Parametric primitive (constructor arguments of the Three geometry; the
/// remaining arguments take the Three r169 defaults).
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
    /// `ShapeGeometry` of a pointy-top hex ring (`appendPointyTopHex`,
    /// `units.ts:475-486`): outer outline + reversed inner hole.
    HexRing {
        /// Outer radius.
        outer: f64,
        /// Inner radius.
        inner: f64,
    },
    /// Leaf-shaped bronze blade (`makeLeafBladeGeo`,
    /// `jednostki-p1-rdzen.ts:580-598`).
    LeafBlade {
        /// Length.
        len: f64,
        /// Maximum width.
        w_max: f64,
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

    /// `geometry.parameters.height` as read by `p1Span`
    /// (`jednostki-p1-rdzen.ts:139`: `parameters?.height ?? 1`).
    #[must_use]
    pub const fn parameters_height(&self) -> f64 {
        match *self {
            Self::Box { h, .. } | Self::Cylinder { h, .. } | Self::Cone { h, .. } => h,
            _ => 1.0,
        }
    }

    /// Builds the geometry (vertex-for-vertex like Three r169).
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        use std::f64::consts::PI;
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
            Self::HexRing { outer, inner } => hex_ring_geometry(outer, inner),
            Self::LeafBlade { len, w_max } => leaf_blade_geometry(len, w_max),
        }
    }
}

/// `appendPointyTopHex(path, radius, reverse)` (`units.ts:475-486`).
fn pointy_top_hex(radius: f64, reverse: bool) -> geom::Path2 {
    use std::f64::consts::PI;
    let order: [u32; 6] = if reverse {
        [5, 4, 3, 2, 1, 0]
    } else {
        [0, 1, 2, 3, 4, 5]
    };
    let mut path = geom::Path2::new();
    for (j, &i) in order.iter().enumerate() {
        let angle = PI / 2.0 + (f64::from(i) * PI) / 3.0;
        let x = radius * angle.js_cos();
        let y = radius * angle.js_sin();
        if j == 0 {
            path.move_to(x, y);
        } else {
            path.line_to(x, y);
        }
    }
    path.close_path();
    path
}

/// `getGeoSelectionHexRing` / `getGeoOwnerHexRing` body (`units.ts:487-508`).
fn hex_ring_geometry(outer: f64, inner: f64) -> geom::Mesh {
    let shape = geom::Shape {
        outline: pointy_top_hex(outer, false),
        holes: vec![pointy_top_hex(inner, true)],
    };
    geom::shape_geometry(&shape)
}

/// `makeLeafBladeGeo(len, wMax)` (`jednostki-p1-rdzen.ts:580-598`): a flat
/// two-layer ribbon, non-indexed, `computeVertexNormals()`, no UVs.
fn leaf_blade_geometry(len: f64, w_max: f64) -> geom::Mesh {
    const PROF: [(f64, f64); 6] = [
        (0.00, 0.28),
        (0.16, 0.34),
        (0.42, 0.50),
        (0.62, 0.42),
        (0.84, 0.24),
        (1.00, 0.0),
    ];
    let prof: Vec<(f64, f64)> = PROF.iter().map(|&(t, w)| (t * len, w * w_max)).collect();
    let mut pos: Vec<f64> = Vec::new();
    let mut quad = |x1: f64, y1: f64, x2: f64, y2: f64, z: f64, flip: bool| {
        if flip {
            pos.extend_from_slice(&[
                -x1, y1, z, x2, y2, z, x1, y1, z, -x1, y1, z, -x2, y2, z, x2, y2, z,
            ]);
        } else {
            pos.extend_from_slice(&[
                -x1, y1, z, x1, y1, z, x2, y2, z, -x1, y1, z, x2, y2, z, -x2, y2, z,
            ]);
        }
    };
    for i in 0..prof.len() - 1 {
        let (y1, w1) = prof[i];
        let (y2, w2) = prof[i + 1];
        quad(w1, y1, w2, y2, 0.006, false);
        quad(w1, y1, w2, y2, -0.006, true);
    }
    #[allow(clippy::cast_possible_truncation)]
    let positions: Vec<f32> = pos.iter().map(|&v| v as f32).collect();
    let mut m = geom::Mesh {
        positions,
        normals: Vec::new(),
        uvs: Vec::new(),
        indices: None,
        groups: Vec::new(),
    };
    m.compute_vertex_normals();
    m
}

/// Geometry of a mesh node: a shared catalogue part or a per-token primitive.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Geo {
    /// One of the 88 `getGeo*` singletons of `units.ts`.
    Part(UnitPart),
    /// One of the 20 `getGeoNH*` singletons of `kon-nowy-model.ts`.
    Horse(HorsePart),
    /// Any other geometry (per-token allocations, the `p1Geos` registry of
    /// `jednostki-p1-rdzen.ts`, galley boxes, ...).
    Prim(Prim),
}

impl Geo {
    /// The primitive behind this geometry.
    #[must_use]
    pub fn prim(&self) -> Prim {
        match *self {
            Self::Part(p) => p.prim(),
            Self::Horse(p) => p.prim(),
            Self::Prim(p) => p,
        }
    }

    /// Builds the CPU geometry.
    #[must_use]
    pub fn build(&self) -> geom::Mesh {
        self.prim().build()
    }
}

/// A mesh attached to a node.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MeshData {
    /// Geometry.
    pub geo: Geo,
    /// Material slot.
    pub material: MatId,
}

/// One `THREE.Object3D` (group or mesh).
#[derive(Debug, Clone, PartialEq)]
pub struct Node {
    /// `object.name`.
    pub name: String,
    /// Parent node (`None` = root or not yet attached).
    pub parent: Option<NodeId>,
    /// Children in `add()` order.
    pub children: Vec<NodeId>,
    /// `position`.
    pub position: Vec3,
    /// `rotation` (always kept in sync with `quaternion` when set through
    /// the Euler setters).
    pub rotation: Euler,
    /// `quaternion` — what `updateMatrix()` composes.
    pub quaternion: Quat,
    /// `scale`.
    pub scale: Vec3,
    /// `Some` for a `THREE.Mesh`.
    pub mesh: Option<MeshData>,
}

impl Node {
    fn new(mesh: Option<MeshData>) -> Self {
        Self {
            name: String::new(),
            parent: None,
            children: Vec::new(),
            position: Vec3::new(0.0, 0.0, 0.0),
            rotation: Euler::default(),
            quaternion: Quat::default(),
            scale: Vec3::new(1.0, 1.0, 1.0),
            mesh,
        }
    }

    /// `position.set(x, y, z)`.
    pub fn set_pos(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.position = Vec3::new(x, y, z);
        self
    }

    /// `position.copy(v)`.
    pub fn set_pos_v(&mut self, v: Vec3) -> &mut Self {
        self.position = v;
        self
    }

    /// `rotation.x = v` (recomputes the quaternion like `onRotationChange`).
    pub fn rot_x(&mut self, v: f64) -> &mut Self {
        self.rotation.x = v;
        self.quaternion = quat_from_euler(self.rotation);
        self
    }

    /// `rotation.y = v`.
    pub fn rot_y(&mut self, v: f64) -> &mut Self {
        self.rotation.y = v;
        self.quaternion = quat_from_euler(self.rotation);
        self
    }

    /// `rotation.z = v`.
    pub fn rot_z(&mut self, v: f64) -> &mut Self {
        self.rotation.z = v;
        self.quaternion = quat_from_euler(self.rotation);
        self
    }

    /// `quaternion.setFromUnitVectors(from, to)` (Three r169
    /// `Quaternion.js:352-392`, then `normalize()`).
    pub fn quat_from_unit_vectors(&mut self, from: Vec3, to: Vec3) -> &mut Self {
        self.quaternion = quat_from_unit_vectors(from, to);
        self
    }

    /// `scale.set(x, y, z)`.
    pub fn set_scale(&mut self, x: f64, y: f64, z: f64) -> &mut Self {
        self.scale = Vec3::new(x, y, z);
        self
    }

    /// `scale.setScalar(s)`.
    pub fn set_scale_scalar(&mut self, s: f64) -> &mut Self {
        self.scale = Vec3::new(s, s, s);
        self
    }

    /// `object.name = name`.
    pub fn set_name(&mut self, name: &str) -> &mut Self {
        self.name = name.to_owned();
        self
    }
}

/// `Quaternion.setFromEuler(euler)` for the default `XYZ` order with V8's
/// `Math.sin/cos` ([`super::jstrig`]); `geom::Quat::from_euler` uses the
/// platform libm, which is 1 ulp off V8 for some angles of the unit models.
/// Every rotation in the unit builders uses the default order.
#[must_use]
pub fn quat_from_euler(eu: Euler) -> Quat {
    debug_assert_eq!(eu.order, crate::geom::EulerOrder::Xyz);
    let c1 = (eu.x / 2.0).js_cos();
    let c2 = (eu.y / 2.0).js_cos();
    let c3 = (eu.z / 2.0).js_cos();
    let s1 = (eu.x / 2.0).js_sin();
    let s2 = (eu.y / 2.0).js_sin();
    let s3 = (eu.z / 2.0).js_sin();
    Quat {
        x: s1 * c2 * c3 + c1 * s2 * s3,
        y: c1 * s2 * c3 - s1 * c2 * s3,
        z: c1 * c2 * s3 + s1 * s2 * c3,
        w: c1 * c2 * c3 - s1 * s2 * s3,
    }
}

/// `Quaternion.setFromUnitVectors(vFrom, vTo)` + `normalize()`.
#[must_use]
pub fn quat_from_unit_vectors(v_from: Vec3, v_to: Vec3) -> Quat {
    let mut r = v_from.dot(v_to) + 1.0;
    let (x, y, z, w);
    if r < f64::EPSILON {
        r = 0.0;
        if v_from.x.abs() > v_from.z.abs() {
            x = -v_from.y;
            y = v_from.x;
            z = 0.0;
            w = r;
        } else {
            x = 0.0;
            y = -v_from.z;
            z = v_from.y;
            w = r;
        }
    } else {
        x = v_from.y * v_to.z - v_from.z * v_to.y;
        y = v_from.z * v_to.x - v_from.x * v_to.z;
        z = v_from.x * v_to.y - v_from.y * v_to.x;
        w = r;
    }
    let l = (x * x + y * y + z * z + w * w).sqrt();
    if l == 0.0 {
        Quat::default()
    } else {
        let l = 1.0 / l;
        Quat {
            x: x * l,
            y: y * l,
            z: z * l,
            w: w * l,
        }
    }
}

/// Counters written by `decorateChariot(…, celtic = true)` into
/// `group.userData['celticRetint']` (`units.ts:1418-1423`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CelticRetint {
    /// Materials re-tinted bronze → iron.
    pub iron: u32,
    /// Materials re-tinted lacquer → woad.
    pub tunic: u32,
    /// Materials re-tinted red → trousers.
    pub crest: u32,
}

/// A unit model: object tree + materials.
#[derive(Debug, Clone, PartialEq)]
pub struct UnitModel {
    /// All nodes; [`ROOT`] is the returned `THREE.Group`.
    pub nodes: Vec<Node>,
    /// All materials referenced by meshes, in creation order.
    pub materials: Vec<Material>,
    /// The `group.userData['mats']` list (material slots, in push order).
    pub tracked: Vec<MatId>,
    /// `group.userData['celticRetint']`, if set.
    pub celtic_retint: Option<CelticRetint>,
}

impl Default for UnitModel {
    fn default() -> Self {
        Self::new()
    }
}

impl UnitModel {
    /// A new model with an empty root group.
    #[must_use]
    pub fn new() -> Self {
        Self {
            nodes: vec![Node::new(None)],
            materials: Vec::new(),
            tracked: Vec::new(),
            celtic_retint: None,
        }
    }

    /// Per-token material factory `mat(color, metalness, roughness)`
    /// (`makeMatFactory`, `units.ts:748-760`): creates and tracks it.
    pub fn mat(&mut self, color: u32, metalness: f64, roughness: f64) -> MatId {
        self.materials
            .push(Material::standard(color, metalness, roughness));
        let id = self.materials.len() - 1;
        self.tracked.push(id);
        id
    }

    /// A material that is NOT pushed to `userData['mats']`.
    pub fn untracked_mat(&mut self, m: Material) -> MatId {
        self.materials.push(m);
        self.materials.len() - 1
    }

    /// Node access.
    pub fn node(&mut self, id: NodeId) -> &mut Node {
        &mut self.nodes[id]
    }

    fn push(&mut self, parent: Option<NodeId>, mesh: Option<MeshData>) -> NodeId {
        self.nodes.push(Node::new(mesh));
        let id = self.nodes.len() - 1;
        if let Some(p) = parent {
            self.attach(p, id);
        }
        id
    }

    /// `parent.add(new THREE.Mesh(geo, material))`.
    pub fn add_mesh(&mut self, parent: NodeId, geo: Geo, material: MatId) -> &mut Node {
        let id = self.push(Some(parent), Some(MeshData { geo, material }));
        &mut self.nodes[id]
    }

    /// Like [`Self::add_mesh`], returning the id.
    pub fn add_mesh_id(&mut self, parent: NodeId, geo: Geo, material: MatId) -> NodeId {
        self.push(Some(parent), Some(MeshData { geo, material }))
    }

    /// `parent.add(new THREE.Group())`.
    pub fn add_group(&mut self, parent: NodeId) -> NodeId {
        self.push(Some(parent), None)
    }

    /// `new THREE.Group()` not yet attached anywhere.
    pub fn detached_group(&mut self) -> NodeId {
        self.push(None, None)
    }

    /// `parent.add(child)` (child must be detached).
    pub fn attach(&mut self, parent: NodeId, child: NodeId) {
        debug_assert!(self.nodes[child].parent.is_none());
        self.nodes[child].parent = Some(parent);
        self.nodes[parent].children.push(child);
    }

    /// `Object3D.traverse` order (pre-order, children in `add()` order),
    /// starting at [`ROOT`].
    #[must_use]
    pub fn traverse(&self) -> Vec<NodeId> {
        let mut out = Vec::with_capacity(self.nodes.len());
        let mut stack = vec![ROOT];
        while let Some(n) = stack.pop() {
            out.push(n);
            for &c in self.nodes[n].children.iter().rev() {
                stack.push(c);
            }
        }
        out
    }

    /// Local matrix `compose(position, quaternion, scale)`.
    #[must_use]
    pub fn local_matrix(&self, id: NodeId) -> Mat4 {
        let n = &self.nodes[id];
        Mat4::compose(n.position, n.quaternion, n.scale)
    }

    /// `updateMatrixWorld(true)` from the root: one matrix per node id
    /// (detached nodes get their local matrix).
    #[must_use]
    pub fn world_matrices(&self) -> Vec<Mat4> {
        let mut world = vec![Mat4::IDENTITY; self.nodes.len()];
        let mut done = vec![false; self.nodes.len()];
        for id in self.traverse() {
            let local = self.local_matrix(id);
            world[id] = match self.nodes[id].parent {
                Some(p) if done[p] => world[p].mul(&local),
                _ => local,
            };
            done[id] = true;
        }
        world
    }

    /// World-space bounding box `[min, max]` over every mesh vertex
    /// (`Vector3.fromBufferAttribute(...).applyMatrix4(matrixWorld)`, then
    /// `Math.min`/`Math.max`), i.e. `Box3.setFromObject(root, true)`.
    #[must_use]
    pub fn bbox(&self) -> [Vec3; 2] {
        use crate::pick::three::{js_max, js_min};
        let world = self.world_matrices();
        let mut lo = Vec3::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
        let mut hi = Vec3::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);
        for id in self.meshes() {
            let Some(md) = self.nodes[id].mesh else {
                continue;
            };
            let g = md.geo.build();
            for v in g.positions.chunks_exact(3) {
                let p = Vec3::new(f64::from(v[0]), f64::from(v[1]), f64::from(v[2]))
                    .apply_mat4(&world[id]);
                lo = Vec3::new(js_min(lo.x, p.x), js_min(lo.y, p.y), js_min(lo.z, p.z));
                hi = Vec3::new(js_max(hi.x, p.x), js_max(hi.y, p.y), js_max(hi.z, p.z));
            }
        }
        [lo, hi]
    }

    /// Mesh nodes in traverse order.
    #[must_use]
    pub fn meshes(&self) -> Vec<NodeId> {
        self.traverse()
            .into_iter()
            .filter(|&n| self.nodes[n].mesh.is_some())
            .collect()
    }

    /// Re-tints every tracked material whose colour is `from` to `to`;
    /// returns how many changed (`retint`, `units.ts:1410-1417`).
    pub fn retint(&mut self, from: u32, to: u32) -> u32 {
        let mut n = 0;
        for &m in &self.tracked {
            if self.materials[m].color == from {
                self.materials[m].color = to;
                n += 1;
            }
        }
        n
    }
}

// ------------------------------------------------------------------ hashing

/// FNV-1a 32-bit over little-endian bytes — the same routine as the web
/// generator (`tests/fixtures/unit_core/gen.ts`, class `Fnv`).
#[derive(Debug, Clone, Copy)]
pub struct Fnv(u32);

impl Default for Fnv {
    fn default() -> Self {
        Self(0x811c_9dc5)
    }
}

impl Fnv {
    /// One byte.
    pub fn byte(&mut self, b: u8) {
        self.0 ^= u32::from(b);
        self.0 = self.0.wrapping_mul(0x0100_0193);
    }
    /// `u32` little-endian.
    pub fn u32(&mut self, v: u32) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// `f32` little-endian bits.
    pub fn f32(&mut self, v: f32) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// `f64` little-endian bits.
    pub fn f64(&mut self, v: f64) {
        for b in v.to_le_bytes() {
            self.byte(b);
        }
    }
    /// Current hash.
    #[must_use]
    pub const fn finish(self) -> u32 {
        self.0
    }
}

fn len_u32(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

/// Geometry hash: vertex count, position/normal/uv floats, index, groups —
/// same byte stream as `geoHash` in `gen.ts`.
#[must_use]
pub fn geo_hash(m: &geom::Mesh) -> u32 {
    let mut f = Fnv::default();
    f.u32(len_u32(m.vertex_count()));
    for arr in [&m.positions, &m.normals, &m.uvs] {
        f.u32(len_u32(arr.len()));
        for &v in arr {
            f.f32(v);
        }
    }
    match &m.indices {
        Some(idx) => {
            f.byte(1);
            f.u32(len_u32(idx.len()));
            for &i in idx {
                f.u32(i);
            }
        }
        None => f.byte(0),
    }
    f.u32(len_u32(m.groups.len()));
    for g in &m.groups {
        f.u32(g.start);
        f.u32(g.count);
        f.u32(g.material_index);
    }
    f.finish()
}

/// Model signature (`signature` in `gen.ts`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Signature {
    /// Number of meshes.
    pub meshes: u32,
    /// Number of triangles.
    pub tris: u32,
    /// FNV-1a over (geometry hash, material, world matrix) of every mesh.
    pub sig: u32,
}

impl UnitModel {
    /// Signature: mesh count, triangle count and a hash of every mesh's
    /// geometry, material parameters and world matrix, in traverse order.
    #[must_use]
    pub fn signature(&self) -> Signature {
        let world = self.world_matrices();
        let mut f = Fnv::default();
        let mut meshes = 0u32;
        let mut tris = 0u32;
        for id in self.meshes() {
            let Some(md) = self.nodes[id].mesh else {
                continue;
            };
            let g = md.geo.build();
            meshes += 1;
            tris += len_u32(g.triangle_count());
            f.u32(geo_hash(&g));
            let mt = &self.materials[md.material];
            f.u32(mt.color);
            f.f64(mt.metalness);
            f.f64(mt.roughness);
            f.byte(u8::from(mt.transparent));
            f.f64(mt.opacity);
            f.byte(u8::from(mt.flat_shading));
            for e in world[id].e {
                f.f64(e);
            }
        }
        f.u32(meshes);
        Signature {
            meshes,
            tris,
            sig: f.finish(),
        }
    }
}
