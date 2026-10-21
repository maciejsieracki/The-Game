//! Triangle raycasting with the semantics of Three.js r169 `Mesh.raycast`,
//! `InstancedMesh.raycast` and `Raycaster.intersectObjects`
//! (`three@0.169.0`, `src/objects/{Mesh,InstancedMesh}.js`,
//! `src/core/Raycaster.js`).
//!
//! Reproduced exactly: per-mesh bounding-sphere cull, transformation of the
//! ray into the local space of each (instance) matrix through
//! `Matrix4.invert`, `Ray.intersectTriangle` with the material side
//! (front = back-face culling, back = reversed winding, double = both),
//! hit point back to world space, `distance = origin.distanceTo(point)`,
//! face normal from `Triangle.getNormal` of the local vertices, and the
//! final **stable** sort by distance (V8 `Array.prototype.sort` is stable,
//! as is `slice::sort_by`). Instance matrices are kept as `f32`, like the
//! `Float32Array` behind `InstancedMesh.instanceMatrix`.
//!
//! Not reproduced (conservative culls that cannot remove a real triangle
//! hit, except for rounding on a ray grazing the cull volume — measure
//! zero): the whole-`InstancedMesh` bounding sphere of
//! `refreshInstancedPickBounds` (`picker.ts:146-150`) and the optional
//! local bounding-box test (`geometry.boundingBox`, `null` for the
//! web terrain geometries).

use super::three::{js_max, triangle_normal, Mat4, Ray, Sphere, Vec3};

/// `material.side`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Side {
    /// `THREE.FrontSide` (default): back faces are culled.
    Front,
    /// `THREE.BackSide`: winding reversed, culled like front.
    Back,
    /// `THREE.DoubleSide`: no culling.
    Double,
}

/// Triangle geometry as Three stores it: `Float32` positions, optional
/// index (`Uint16`/`Uint32`).
#[derive(Clone, Debug, PartialEq)]
pub struct TriGeometry {
    /// Flat `xyz` positions (`attributes.position.array`).
    pub positions: Vec<f32>,
    /// Index buffer (`geometry.index.array`), `None` for non-indexed.
    pub index: Option<Vec<u32>>,
    bounding_sphere: Sphere,
}

impl TriGeometry {
    /// Builds a geometry and its bounding sphere
    /// (`BufferGeometry.computeBoundingSphere`).
    ///
    /// # Panics
    /// When `positions.len()` is not a multiple of 3 or an index is out of
    /// range.
    #[must_use]
    pub fn new(positions: Vec<f32>, index: Option<Vec<u32>>) -> Self {
        assert!(
            positions.len().is_multiple_of(3),
            "positions must be xyz triples"
        );
        let count = positions.len() / 3;
        if let Some(idx) = &index {
            assert!(
                idx.iter().all(|&i| (i as usize) < count),
                "index out of range"
            );
        }
        let bounding_sphere = compute_bounding_sphere(&positions);
        Self {
            positions,
            index,
            bounding_sphere,
        }
    }

    /// Bounding sphere computed like `computeBoundingSphere`.
    #[must_use]
    pub fn bounding_sphere(&self) -> Sphere {
        self.bounding_sphere
    }

    /// Vertex `i` widened to doubles (`fromBufferAttribute`).
    #[must_use]
    pub fn vertex(&self, i: usize) -> Vec3 {
        Vec3::new(
            f64::from(self.positions[3 * i]),
            f64::from(self.positions[3 * i + 1]),
            f64::from(self.positions[3 * i + 2]),
        )
    }

    /// Number of triangles walked by `Mesh._computeIntersections`.
    #[must_use]
    pub fn triangle_count(&self) -> usize {
        match &self.index {
            Some(idx) => idx.len() / 3,
            None => self.positions.len() / 9,
        }
    }

    fn triangle(&self, t: usize) -> (usize, usize, usize) {
        match &self.index {
            Some(idx) => (
                idx[3 * t] as usize,
                idx[3 * t + 1] as usize,
                idx[3 * t + 2] as usize,
            ),
            None => (3 * t, 3 * t + 1, 3 * t + 2),
        }
    }
}

fn compute_bounding_sphere(positions: &[f32]) -> Sphere {
    let count = positions.len() / 3;
    let vertex = |i: usize| {
        Vec3::new(
            f64::from(positions[3 * i]),
            f64::from(positions[3 * i + 1]),
            f64::from(positions[3 * i + 2]),
        )
    };
    // Box3.setFromBufferAttribute + getCenter.
    let mut min = Vec3::new(f64::INFINITY, f64::INFINITY, f64::INFINITY);
    let mut max = Vec3::new(f64::NEG_INFINITY, f64::NEG_INFINITY, f64::NEG_INFINITY);
    for i in 0..count {
        let v = vertex(i);
        min = min.min(v);
        max = max.max(v);
    }
    let empty = max.x < min.x || max.y < min.y || max.z < min.z;
    let center = if empty {
        Vec3::new(0.0, 0.0, 0.0)
    } else {
        min.add_vec(max).scale(0.5)
    };
    let mut max_radius_sq = 0.0f64;
    for i in 0..count {
        max_radius_sq = js_max(max_radius_sq, center.distance_to_squared(vertex(i)));
    }
    Sphere {
        center,
        radius: max_radius_sq.sqrt(),
    }
}

/// One raw intersection (`Raycaster` intersection object).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RawHit {
    /// `intersection.distance` (world units from the ray origin).
    pub distance: f64,
    /// `intersection.point` (world space).
    pub point: Vec3,
    /// `intersection.face.normal` (local space of the geometry).
    pub face_normal: Vec3,
    /// Index of the object in the list passed to [`intersect_objects`].
    pub object: usize,
    /// `intersection.instanceId` for instanced objects.
    pub instance: Option<usize>,
}

/// `Mesh.raycast` for one world matrix; pushes hits in triangle order.
fn raycast_mesh(
    ray: &Ray,
    world: &Mat4,
    geometry: &TriGeometry,
    side: Side,
    object: usize,
    instance: Option<usize>,
    out: &mut Vec<RawHit>,
) {
    // Bounding sphere in world space; raycaster.near = 0 → recast(0) is a no-op.
    let sphere = geometry.bounding_sphere.apply_matrix4(world);
    if !sphere.contains_point(ray.origin) && ray.intersect_sphere(&sphere).is_none() {
        return;
    }
    // (distanceToSquared > (far - near)^2 with far = Infinity never culls.)
    let inverse = world.invert();
    let local = ray.apply_matrix4(&inverse);
    for t in 0..geometry.triangle_count() {
        let (a, b, c) = geometry.triangle(t);
        let (va, vb, vc) = (geometry.vertex(a), geometry.vertex(b), geometry.vertex(c));
        let hit = match side {
            Side::Back => local.intersect_triangle(vc, vb, va, true),
            Side::Front => local.intersect_triangle(va, vb, vc, true),
            Side::Double => local.intersect_triangle(va, vb, vc, false),
        };
        let Some(p) = hit else { continue };
        let point = p.apply_matrix4(world);
        let distance = ray.origin.distance_to(point);
        // raycaster.near = 0, far = Infinity: `distance < near || distance > far` never holds
        // for a finite distance; a NaN distance compares false as in JS.
        out.push(RawHit {
            distance,
            point,
            face_normal: triangle_normal(va, vb, vc),
            object,
            instance,
        });
    }
}

/// An `InstancedMesh` of the picking list: shared geometry, `f32` instance
/// matrices (the mesh's own `matrixWorld` is the identity, as in the web
/// scene where pick meshes hang directly under the scene root).
#[derive(Clone, Debug, PartialEq)]
pub struct InstancedPickMesh {
    /// Shared geometry.
    pub geometry: TriGeometry,
    /// `material.side`.
    pub side: Side,
    /// `mesh.visible` (hits on invisible meshes are skipped by the picker).
    pub visible: bool,
    /// Instance matrices (`instanceMatrix`, first `count` entries).
    pub matrices: Vec<[f32; 16]>,
    /// Hex resolved for each instance (`resolveTerrainPick`), `None` when the
    /// web resolver would return `null`.
    pub hexes: Vec<Option<super::hex::HexCoord>>,
}

/// A plain `Mesh` with an explicit world matrix (unit models).
#[derive(Clone, Debug, PartialEq)]
pub struct PickMesh {
    /// Geometry.
    pub geometry: TriGeometry,
    /// `mesh.matrixWorld` (double precision, as `Object3D` keeps it).
    pub world: Mat4,
    /// `material.side`.
    pub side: Side,
}

/// Object accepted by [`intersect_objects`].
#[derive(Clone, Copy, Debug)]
pub enum PickObject<'a> {
    /// `InstancedMesh`.
    Instanced(&'a InstancedPickMesh),
    /// Plain `Mesh`.
    Mesh(&'a PickMesh),
}

/// `raycaster.intersectObjects(objects)`: hits in traversal order, then a
/// stable sort by distance.
#[must_use]
pub fn intersect_objects(ray: &Ray, objects: &[PickObject<'_>]) -> Vec<RawHit> {
    let mut out = Vec::new();
    for (oi, obj) in objects.iter().enumerate() {
        match obj {
            PickObject::Instanced(m) => {
                // InstancedMesh.raycast: _instanceWorldMatrix = matrixWorld (identity) * local.
                for (ii, local) in m.matrices.iter().enumerate() {
                    let world = Mat4::multiply(&Mat4::IDENTITY, &Mat4::from_f32(local));
                    raycast_mesh(ray, &world, &m.geometry, m.side, oi, Some(ii), &mut out);
                }
            }
            PickObject::Mesh(m) => {
                raycast_mesh(ray, &m.world, &m.geometry, m.side, oi, None, &mut out)
            }
        }
    }
    // ascSort: a.distance - b.distance (stable).
    out.sort_by(|a, b| {
        a.distance
            .partial_cmp(&b.distance)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    out
}
