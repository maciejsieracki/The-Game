//! Part 5 of MOD-14 "battle 3D" (picking half): **raycasting the battle
//! scene** of `battle/battleScene.ts` (web `edb8fb56`, topic
//! R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5, document
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md` §39–§48).
//!
//! - [`PickScene`] = the scene graph after a render (`scene.updateMatrixWorld()`):
//!   world matrices, `traverse` order and the side tables of part 2
//!   (instanced meshes, lines);
//! - [`intersect_objects`] = three r169 `Raycaster.intersectObjects(objects,
//!   recursive)` over that scene: `Mesh.raycast` (bounding-sphere cull,
//!   local ray, `material.side`, material groups), `InstancedMesh.raycast`
//!   (whole-mesh sphere cull, then every instance), `Line.raycast` (threshold
//!   1, `Ray.distanceSqToSegment`), `Sprite.raycast` (camera-facing quad),
//!   visibility ignored as in three, then a stable sort by distance;
//! - ground picking: `clampBattleTile` (`:1743`), `battlePickMeshUpNormal`
//!   (`:1749`), `pickBattleGroundTilePlane` (`:1761`),
//!   `pickBattleGroundTileFromMeshes` (`:1786`), `_pickGroundTile` (`:10437`);
//! - unit picking and clicks: `_pickUnitAtScreen` (`:11084`), `_onDeployClick`
//!   (`:15063`), `_handleDeployUnitPick` (`:14369`), `_onBattleClick`
//!   (`:17510`), `_doBoxSelect` (`:16498`, hit test).
//!
//! **Input** (ZAŁOŻENIE Z-36-19): the scene of parts 2–4, the camera
//! ([`super::view::BattleView`]), the canvas, the terrain grid, and the
//! battle state the pickers filter on as a DTO ([`PickUnit`]: dead /
//! fading / removed / routed, the occupancy map `occByKey`, the selection,
//! the deploy-zone predicate). **Output**: what was hit, and for clicks the
//! decision ([`DeployClick`], [`BattleClick`]) — what the logic then does
//! with it (placement, orders, UI) is P6.13 / P5.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use super::field::{tile_top_y, FieldScene, TerrainGrid, BF_COLS, BF_ROWS, TILE_S};
use super::units::{
    add_selection_ring, refresh_deploy_selection_visuals, refresh_unit_ring_color,
    remove_selection_ring, BattleSide, PlacedUnit, RosterUnit, SelectionRings,
};
use super::view::{BattleView, Canvas};
use crate::geom::Group as GeoGroup;
use crate::pick::raycast::TriGeometry;
use crate::pick::three::{triangle_normal, Mat4, Ray, Sphere, Vec3};
use crate::scene::{Geo, NodeId, NodeKind, Scene, Side};

/// `raycaster.params.Line.threshold` (three r169 default).
pub const LINE_THRESHOLD: f64 = 1.0;
/// `battlePickMeshUpNormal(h) < 0.3` rejects steep faces (`:1798`).
pub const GROUND_MIN_UP: f64 = 0.3;
/// `heightMatch * 10 + h.point.y` (`:1803`).
pub const GROUND_HEIGHT_WEIGHT: f64 = 10.0;
/// `for (let i = 0; i < 4; i++)` of `pickBattleGroundTilePlane` (`:1769`).
pub const PLANE_ITERATIONS: usize = 4;

// ------------------------------------------------------------ the rendered scene

/// Triangle data of one geometry, built once.
#[derive(Debug)]
struct Prep {
    positions: Vec<f32>,
    index: Option<Vec<u32>>,
    groups: Vec<GeoGroup>,
    sphere: Sphere,
}

impl Prep {
    fn new(geo: &Geo) -> Self {
        let m = geo.build();
        let sphere = TriGeometry::new(m.positions.clone(), m.indices.clone()).bounding_sphere();
        Self {
            positions: m.positions,
            index: m.indices,
            groups: m.groups,
            sphere,
        }
    }

    fn vertex(&self, i: usize) -> Vec3 {
        Vec3::new(
            f64::from(self.positions[3 * i]),
            f64::from(self.positions[3 * i + 1]),
            f64::from(self.positions[3 * i + 2]),
        )
    }

    fn count(&self) -> usize {
        self.positions.len() / 3
    }
}

/// The battle scene as a raycaster sees it after a render: every node's
/// `matrixWorld` (`scene.updateMatrixWorld()`), the `traverse` order, the
/// placeholder side tables (instanced meshes, lines) and a geometry cache.
#[derive(Debug)]
pub struct PickScene<'a> {
    /// The scene of parts 2–4.
    pub fs: &'a FieldScene,
    world: Vec<Mat4>,
    order: Vec<usize>,
    instanced_of: Vec<Option<usize>>,
    line_of: Vec<Option<usize>>,
    cache: RefCell<Vec<Option<Rc<Prep>>>>,
    shared: RefCell<Vec<(Geo, Rc<Prep>)>>,
}

impl<'a> PickScene<'a> {
    /// The scene after `renderer.render` (`scene.updateMatrixWorld()`).
    #[must_use]
    pub fn new(fs: &'a FieldScene) -> Self {
        let world = fs
            .scene
            .world_matrices(None)
            .into_iter()
            .map(|m| Mat4 { e: m.e })
            .collect();
        let n = fs.scene.nodes.len();
        let mut order = vec![usize::MAX; n];
        for (i, id) in fs.scene.traverse().into_iter().enumerate() {
            order[id] = i;
        }
        let mut instanced_of = vec![None; n];
        for (i, m) in fs.instanced.iter().enumerate() {
            instanced_of[m.node] = Some(i);
        }
        let mut line_of = vec![None; n];
        for (i, l) in fs.lines.iter().enumerate() {
            line_of[l.node] = Some(i);
        }
        Self {
            fs,
            world,
            order,
            instanced_of,
            line_of,
            cache: RefCell::new(vec![None; n]),
            shared: RefCell::new(Vec::new()),
        }
    }

    /// Index of `node` in `scene.traverse` order (`usize::MAX` when detached).
    #[must_use]
    pub fn traverse_index(&self, node: NodeId) -> usize {
        self.order[node]
    }

    /// `node.matrixWorld`.
    #[must_use]
    pub fn world(&self, node: NodeId) -> Mat4 {
        self.world[node]
    }

    fn prep(&self, node: NodeId, geo: &Geo) -> Rc<Prep> {
        if let Some(p) = &self.cache.borrow()[node] {
            return Rc::clone(p);
        }
        let found = self
            .shared
            .borrow()
            .iter()
            .find(|(g, _)| g == geo)
            .map(|(_, p)| Rc::clone(p));
        let p = found.unwrap_or_else(|| {
            let p = Rc::new(Prep::new(geo));
            self.shared.borrow_mut().push((geo.clone(), Rc::clone(&p)));
            p
        });
        self.cache.borrow_mut()[node] = Some(Rc::clone(&p));
        p
    }
}

/// The camera state a `Raycaster` carries after `setFromCamera` (needed by
/// `Sprite.raycast`): `camera.matrixWorld` and `matrixWorldInverse`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RayCamera {
    /// `raycaster.camera.matrixWorld`.
    pub matrix_world: Mat4,
    /// `raycaster.camera.matrixWorldInverse`.
    pub matrix_world_inverse: Mat4,
}

impl RayCamera {
    /// The camera of a [`BattleView`] (after [`BattleView::ray_from_canvas`]).
    #[must_use]
    pub fn of(view: &BattleView) -> Self {
        Self {
            matrix_world: view.matrix_world,
            matrix_world_inverse: view.matrix_world_inverse,
        }
    }
}

/// One intersection (`Raycaster` intersection object).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Hit {
    /// `distance`.
    pub distance: f64,
    /// `point` (world).
    pub point: Vec3,
    /// `face.normal` (local space of the geometry), `None` for `face: null`
    /// (lines, sprites).
    pub face_normal: Option<Vec3>,
    /// `object` (the node; for an instanced mesh its placeholder node).
    pub object: NodeId,
    /// `instanceId`.
    pub instance: Option<usize>,
}

fn side_of(fs: &FieldScene, mat: usize) -> Side {
    fs.scene.materials[mat].side
}

/// `checkIntersection` of `Mesh.js` for one triangle.
#[allow(clippy::too_many_arguments)]
fn mesh_triangle(
    ray: &Ray,
    local: &Ray,
    world: &Mat4,
    p: &Prep,
    side: Side,
    (a, b, c): (usize, usize, usize),
    object: NodeId,
    instance: Option<usize>,
    out: &mut Vec<Hit>,
) {
    let (va, vb, vc) = (p.vertex(a), p.vertex(b), p.vertex(c));
    let hit = match side {
        Side::Back => local.intersect_triangle(vc, vb, va, true),
        Side::Front => local.intersect_triangle(va, vb, vc, true),
        Side::Double => local.intersect_triangle(va, vb, vc, false),
    };
    let Some(pt) = hit else { return };
    let point = pt.apply_matrix4(world);
    let distance = ray.origin.distance_to(point);
    // raycaster.near = 0, far = Infinity: never rejects a finite distance.
    out.push(Hit {
        distance,
        point,
        face_normal: Some(triangle_normal(va, vb, vc)),
        object,
        instance,
    });
}

/// `Mesh.raycast` + `_computeIntersections` (three r169 `Mesh.js:142-322`).
#[allow(clippy::too_many_arguments)]
fn raycast_mesh(
    fs: &FieldScene,
    ray: &Ray,
    world: &Mat4,
    p: &Prep,
    materials: &[usize],
    material_array: bool,
    object: NodeId,
    instance: Option<usize>,
    out: &mut Vec<Hit>,
) {
    let sphere = p.sphere.apply_matrix4(world);
    // _ray.recast(near = 0) keeps the origin.
    if !sphere.contains_point(ray.origin) && ray.intersect_sphere(&sphere).is_none() {
        return;
    }
    let local = ray.apply_matrix4(&world.invert());
    // geometry.boundingBox is null for every geometry of the battle scene
    // (measured by the generator with PICK_VERBOSE=1, P4-36 Z-36-21).
    let n_idx = p.index.as_ref().map_or(p.count(), Vec::len);
    let tri = |j: usize| -> (usize, usize, usize) {
        match &p.index {
            Some(ix) => (ix[j] as usize, ix[j + 1] as usize, ix[j + 2] as usize),
            None => (j, j + 1, j + 2),
        }
    };
    if material_array {
        for g in &p.groups {
            let side = side_of(fs, materials[g.material_index as usize]);
            let start = g.start as usize;
            let end = n_idx.min(start + g.count as usize);
            let mut j = start;
            while j < end {
                mesh_triangle(ray, &local, world, p, side, tri(j), object, instance, out);
                j += 3;
            }
        }
    } else {
        let side = side_of(fs, materials[0]);
        let mut j = 0;
        while j < n_idx {
            mesh_triangle(ray, &local, world, p, side, tri(j), object, instance, out);
            j += 3;
        }
    }
}

/// `Ray.distanceSqToPoint(point)`.
fn distance_sq_to_point(ray: &Ray, point: Vec3) -> f64 {
    let direction_distance = point.sub_vec(ray.origin).dot(ray.direction);
    if direction_distance < 0.0 {
        return ray.origin.distance_to_squared(point);
    }
    ray.origin
        .add_scaled(ray.direction, direction_distance)
        .distance_to_squared(point)
}

/// `Ray.intersectsSphere(sphere)`.
fn intersects_sphere(ray: &Ray, s: &Sphere) -> bool {
    distance_sq_to_point(ray, s.center) <= s.radius * s.radius
}

/// `Ray.distanceSqToSegment(v0, v1, pointOnRay, pointOnSegment)` (three
/// r169 `Ray.js`): `(sqrDist, pointOnRay, pointOnSegment)`.
#[allow(clippy::many_single_char_names)]
#[must_use]
pub fn distance_sq_to_segment(ray: &Ray, v0: Vec3, v1: Vec3) -> (f64, Vec3, Vec3) {
    let seg_center = v0.add_vec(v1).scale(0.5);
    let seg_dir = v1.sub_vec(v0).normalize();
    let diff = ray.origin.sub_vec(seg_center);
    let seg_extent = v0.distance_to(v1) * 0.5;
    let a01 = -ray.direction.dot(seg_dir);
    let b0 = diff.dot(ray.direction);
    let b1 = -diff.dot(seg_dir);
    let c = diff.length_sq();
    let det = (1.0 - a01 * a01).abs();
    let (s0, s1, sqr_dist);
    if det > 0.0 {
        let mut t0 = a01 * b1 - b0;
        let mut t1 = a01 * b0 - b1;
        let ext_det = seg_extent * det;
        if t0 >= 0.0 {
            if t1 >= -ext_det {
                if t1 <= ext_det {
                    let inv_det = 1.0 / det;
                    t0 *= inv_det;
                    t1 *= inv_det;
                    s0 = t0;
                    s1 = t1;
                    sqr_dist =
                        s0 * (s0 + a01 * s1 + 2.0 * b0) + s1 * (a01 * s0 + s1 + 2.0 * b1) + c;
                } else {
                    s1 = seg_extent;
                    s0 = js_max0(-(a01 * s1 + b0));
                    sqr_dist = -s0 * s0 + s1 * (s1 + 2.0 * b1) + c;
                }
            } else {
                s1 = -seg_extent;
                s0 = js_max0(-(a01 * s1 + b0));
                sqr_dist = -s0 * s0 + s1 * (s1 + 2.0 * b1) + c;
            }
        } else if t1 <= -ext_det {
            s0 = js_max0(-(-a01 * seg_extent + b0));
            s1 = if s0 > 0.0 {
                -seg_extent
            } else {
                clamp_ext(-b1, seg_extent)
            };
            sqr_dist = -s0 * s0 + s1 * (s1 + 2.0 * b1) + c;
        } else if t1 <= ext_det {
            s0 = 0.0;
            s1 = clamp_ext(-b1, seg_extent);
            sqr_dist = s1 * (s1 + 2.0 * b1) + c;
        } else {
            s0 = js_max0(-(a01 * seg_extent + b0));
            s1 = if s0 > 0.0 {
                seg_extent
            } else {
                clamp_ext(-b1, seg_extent)
            };
            sqr_dist = -s0 * s0 + s1 * (s1 + 2.0 * b1) + c;
        }
    } else {
        s1 = if a01 > 0.0 { -seg_extent } else { seg_extent };
        s0 = js_max0(-(a01 * s1 + b0));
        sqr_dist = -s0 * s0 + s1 * (s1 + 2.0 * b1) + c;
    }
    (
        sqr_dist,
        ray.origin.add_scaled(ray.direction, s0),
        seg_center.add_scaled(seg_dir, s1),
    )
}

/// `Math.max(0, x)`.
fn js_max0(x: f64) -> f64 {
    super::view::js_max(0.0, x)
}

/// `Math.min(Math.max(-ext, x), ext)`.
fn clamp_ext(x: f64, ext: f64) -> f64 {
    super::view::js_min(super::view::js_max(-ext, x), ext)
}

/// `Line.raycast` (three r169 `Line.js`), non-indexed `Line` / `LineLoop`.
fn raycast_line(
    ray: &Ray,
    world: &Mat4,
    scale: Vec3,
    p: &Prep,
    is_loop: bool,
    object: NodeId,
    out: &mut Vec<Hit>,
) {
    let mut sphere = p.sphere.apply_matrix4(world);
    sphere.radius += LINE_THRESHOLD;
    if !intersects_sphere(ray, &sphere) {
        return;
    }
    let local = ray.apply_matrix4(&world.invert());
    let local_threshold = LINE_THRESHOLD / ((scale.x + scale.y + scale.z) / 3.0);
    let local_threshold_sq = local_threshold * local_threshold;
    let mut check = |a: usize, b: usize| {
        let (dist_sq, on_ray, on_seg) = distance_sq_to_segment(&local, p.vertex(a), p.vertex(b));
        if dist_sq > local_threshold_sq {
            return;
        }
        let on_ray_world = on_ray.apply_matrix4(world);
        let distance = ray.origin.distance_to(on_ray_world);
        out.push(Hit {
            distance,
            point: on_seg.apply_matrix4(world),
            face_normal: None,
            object,
            instance: None,
        });
    };
    let end = p.count();
    let mut i = 0;
    while i + 1 < end {
        check(i, i + 1);
        i += 1;
    }
    if is_loop && end > 0 {
        check(end - 1, 0);
    }
}

/// `Sprite.raycast` (three r169 `Sprite.js`): `sizeAttenuation` true,
/// `material.rotation` 0, `center` (0.5, 0.5).
fn raycast_sprite(ray: &Ray, world: &Mat4, cam: &RayCamera, object: NodeId, out: &mut Vec<Hit>) {
    let e = &world.e;
    // _worldScale.setFromMatrixScale(matrixWorld)
    let scale = Vec3::new(
        Vec3::new(e[0], e[1], e[2]).length(),
        Vec3::new(e[4], e[5], e[6]).length(),
        Vec3::new(e[8], e[9], e[10]).length(),
    );
    let mv = Mat4::multiply(&cam.matrix_world_inverse, world);
    let mv_pos = mv.position();
    let vertex = |x: f64, y: f64| -> Vec3 {
        // _alignedPosition = (v - center + 0.5) * scale (x, y; z is not used)
        let ax = (x - 0.5 + 0.5) * scale.x;
        let ay = (y - 0.5 + 0.5) * scale.y;
        Vec3::new(mv_pos.x + ax, mv_pos.y + ay, mv_pos.z).apply_matrix4(&cam.matrix_world)
    };
    let va = vertex(-0.5, -0.5);
    let vb = vertex(0.5, -0.5);
    let vc = vertex(0.5, 0.5);
    let hit = ray.intersect_triangle(va, vb, vc, false).or_else(|| {
        let vb2 = vertex(-0.5, 0.5);
        ray.intersect_triangle(va, vc, vb2, false)
    });
    let Some(point) = hit else { return };
    out.push(Hit {
        distance: ray.origin.distance_to(point),
        point,
        face_normal: None,
        object,
        instance: None,
    });
}

/// `object.raycast(raycaster, intersects)` for one node.
fn raycast_node(ps: &PickScene<'_>, ray: &Ray, cam: &RayCamera, node: NodeId, out: &mut Vec<Hit>) {
    let fs = ps.fs;
    let world = ps.world(node);
    if let Some(ii) = ps.instanced_of[node] {
        let m = &fs.instanced[ii];
        let p = ps.prep(node, &m.geo);
        // InstancedMesh.raycast: whole-mesh sphere (refreshInstancedPickBounds,
        // or computed lazily on the first raycast).
        let bs = m
            .bounding_sphere
            .unwrap_or_else(|| instanced_sphere(&p, &m.matrices, m.count));
        if !intersects_sphere(ray, &bs.apply_matrix4(&world)) {
            return;
        }
        for i in 0..m.count {
            let mut a = [0.0f32; 16];
            a.copy_from_slice(&m.matrices[i * 16..i * 16 + 16]);
            let iw = Mat4::multiply(&world, &Mat4::from_f32(&a));
            raycast_mesh(fs, ray, &iw, &p, &[m.material], false, node, Some(i), out);
        }
        return;
    }
    if let Some(li) = ps.line_of[node] {
        let l = &fs.lines[li];
        let p = ps.prep(node, &l.geo);
        let n = &fs.scene.nodes[node];
        let s = n.scale;
        raycast_line(ray, &world, Vec3::new(s.x, s.y, s.z), &p, false, node, out);
        return;
    }
    let n = &fs.scene.nodes[node];
    match &n.kind {
        NodeKind::Mesh(md) => {
            let p = ps.prep(node, &md.geo);
            raycast_mesh(
                fs,
                ray,
                &world,
                &p,
                &md.materials,
                md.material_array,
                node,
                None,
                out,
            );
        }
        NodeKind::LineLoop(md) => {
            let p = ps.prep(node, &md.geo);
            let s = n.scale;
            raycast_line(ray, &world, Vec3::new(s.x, s.y, s.z), &p, true, node, out);
        }
        NodeKind::Sprite(_) => raycast_sprite(ray, &world, cam, node, out),
        NodeKind::Group | NodeKind::Object3D => {}
    }
}

/// `InstancedMesh.computeBoundingSphere()` (three r169).
fn instanced_sphere(p: &Prep, matrices: &[f32], count: usize) -> Sphere {
    let mut s = Sphere {
        center: Vec3::new(0.0, 0.0, 0.0),
        radius: -1.0,
    };
    for i in 0..count {
        let mut a = [0.0f32; 16];
        a.copy_from_slice(&matrices[i * 16..i * 16 + 16]);
        let t = p.sphere.apply_matrix4(&Mat4::from_f32(&a));
        s = sphere_union(s, t);
    }
    s
}

fn sphere_expand(s: Sphere, pt: Vec3) -> Sphere {
    if s.radius < 0.0 {
        return Sphere {
            center: pt,
            radius: 0.0,
        };
    }
    let v = pt.sub_vec(s.center);
    let len_sq = v.length_sq();
    if len_sq > s.radius * s.radius {
        let len = len_sq.sqrt();
        let delta = (len - s.radius) * 0.5;
        Sphere {
            center: s.center.add_scaled(v, delta / len),
            radius: s.radius + delta,
        }
    } else {
        s
    }
}

fn sphere_union(s: Sphere, o: Sphere) -> Sphere {
    if o.radius < 0.0 {
        return s;
    }
    if s.radius < 0.0 {
        return o;
    }
    if s.center == o.center {
        return Sphere {
            center: s.center,
            radius: super::view::js_max(s.radius, o.radius),
        };
    }
    let v = o.center.sub_vec(s.center).normalize().scale(o.radius);
    let s = sphere_expand(s, o.center.add_vec(v));
    sphere_expand(s, o.center.sub_vec(v))
}

/// `raycaster.intersectObjects(objects, recursive)` (three r169
/// `Raycaster.js`): `raycast` of every object (and, when `recursive`, of its
/// descendants in `children` order — visibility is not consulted), then a
/// stable sort by distance (`ascSort`).
#[must_use]
pub fn intersect_objects(
    ps: &PickScene<'_>,
    ray: &Ray,
    cam: &RayCamera,
    objects: &[NodeId],
    recursive: bool,
) -> Vec<Hit> {
    let mut out = Vec::new();
    for &o in objects {
        if recursive {
            for n in ps.fs.scene.traverse_from(o) {
                raycast_node(ps, ray, cam, n, &mut out);
            }
        } else {
            raycast_node(ps, ray, cam, o, &mut out);
        }
    }
    out.sort_by(|a, b| {
        a.distance
            .partial_cmp(&b.distance)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    out
}

// ------------------------------------------------------------ ground

/// `clampBattleTile(col, row)` (`:1743-1746`): `None` outside the big field.
#[must_use]
pub fn clamp_battle_tile(col: f64, row: f64) -> Option<(f64, f64)> {
    if col < 0.0 || col >= f64::from(BF_COLS) || row < 0.0 || row >= f64::from(BF_ROWS) {
        return None;
    }
    Some((col, row))
}

/// A tile from `clampBattleTile(Math.round(x / TILE_S), Math.round(z / TILE_S))`
/// as integers (the rounded values are integral; `-0` → 0).
#[allow(clippy::cast_possible_truncation)]
fn tile_of(x: f64, z: f64) -> Option<(i32, i32)> {
    let col = super::siege_wall::js_round(x / TILE_S);
    let row = super::siege_wall::js_round(z / TILE_S);
    clamp_battle_tile(col, row).map(|(c, r)| (c as i32, r as i32))
}

/// `battlePickMeshUpNormal(hit)` (`:1749-1755`): the Y of `face.normal`
/// transformed by the hit OBJECT's `matrixWorld` (for an instanced mesh the
/// mesh's own matrix, not the instance's — W-24); 0 without a face.
#[must_use]
pub fn battle_pick_mesh_up_normal(ps: &PickScene<'_>, hit: &Hit) -> f64 {
    match hit.face_normal {
        None => 0.0,
        Some(n) => n.transform_direction(&ps.world(hit.object)).y,
    }
}

/// `pickBattleGroundTilePlane(raycaster, tm)` (`:1761-1780`): up to four
/// plane intersections at the `tileTopY` of the previous guess.
#[must_use]
pub fn pick_ground_tile_plane(ray: &Ray, grid: &TerrainGrid) -> Option<(i32, i32)> {
    let mut y = 0.0;
    let mut col = 0.0;
    let mut row = 0.0;
    for i in 0..PLANE_ITERATIONS {
        // new THREE.Plane(new Vector3(0, 1, 0), -y)
        let pt = ray.intersect_plane(Vec3::new(0.0, 1.0, 0.0), -y)?;
        let n_col = super::siege_wall::js_round(pt.x / TILE_S);
        let n_row = super::siege_wall::js_round(pt.z / TILE_S);
        if i > 0 && n_col == col && n_row == row {
            break;
        }
        col = n_col;
        row = n_row;
        y = tile_top_y(grid, js_int(col), js_int(row));
    }
    clamp_battle_tile(col, row).map(|(c, r)| (js_int(c), js_int(r)))
}

/// An integral JS number as `i32` for `tm.at` (values outside `i32` read as
/// out of the field, like the web's bounds check).
#[allow(clippy::cast_possible_truncation)]
fn js_int(v: f64) -> i32 {
    if v >= f64::from(i32::MAX) {
        i32::MAX
    } else if v <= f64::from(i32::MIN) {
        i32::MIN
    } else {
        v as i32
    }
}

/// `pickBattleGroundTileFromMeshes(raycaster, tm, meshes)` (`:1786-1812`):
/// among the hits on the ground meshes (not recursive) facing up
/// (`normal.y ≥ 0.3`), the one whose height best matches the tile's
/// `tileTopY` (`−|Δy|·10 + y`, first maximum wins).
#[must_use]
pub fn pick_ground_tile_from_meshes(
    ps: &PickScene<'_>,
    ray: &Ray,
    cam: &RayCamera,
    grid: &TerrainGrid,
    meshes: &[NodeId],
) -> Option<(i32, i32)> {
    if meshes.is_empty() {
        return None;
    }
    let hits = intersect_objects(ps, ray, cam, meshes, false);
    let mut best = None;
    let mut best_score = f64::NEG_INFINITY;
    for h in &hits {
        if battle_pick_mesh_up_normal(ps, h) < GROUND_MIN_UP {
            continue;
        }
        let Some((c, r)) = tile_of(h.point.x, h.point.z) else {
            continue;
        };
        let expected_y = tile_top_y(grid, c, r);
        let height_match = -(h.point.y - expected_y).abs();
        let score = height_match * GROUND_HEIGHT_WEIGHT + h.point.y;
        if score > best_score {
            best_score = score;
            best = Some((c, r));
        }
    }
    best
}

/// `_pickGroundTile(cx, cy)` (`:10437-10454`) for an already cast ray: the
/// mesh pick and the plane pick; on disagreement the higher `tileTopY` wins
/// (ties → meshes).
#[must_use]
pub fn pick_ground_tile(
    ps: &PickScene<'_>,
    ray: &Ray,
    cam: &RayCamera,
    grid: &TerrainGrid,
    meshes: &[NodeId],
) -> Option<(i32, i32)> {
    let from_meshes = pick_ground_tile_from_meshes(ps, ray, cam, grid, meshes);
    let from_plane = pick_ground_tile_plane(ray, grid);
    match (from_meshes, from_plane) {
        (Some(m), Some(p)) => {
            if m == p {
                return Some(m);
            }
            let mesh_y = tile_top_y(grid, m.0, m.1);
            let plane_y = tile_top_y(grid, p.0, p.1);
            if mesh_y > plane_y {
                Some(m)
            } else if plane_y > mesh_y {
                Some(p)
            } else {
                Some(m)
            }
        }
        (m, p) => m.or(p),
    }
}

/// `_pickGroundTile(cx, cy)` from client pixels (`_raycastFromCanvas` +
/// the ground meshes of part 2, `FieldScene::ground_pick`).
pub fn pick_ground_tile_at(
    view: &mut BattleView,
    ps: &PickScene<'_>,
    grid: &TerrainGrid,
    client: (f64, f64),
    canvas: &Canvas,
) -> Option<(i32, i32)> {
    let ray = view.ray_from_canvas(client.0, client.1, canvas)?;
    let cam = RayCamera::of(view);
    pick_ground_tile(ps, &ray, &cam, grid, &ps.fs.ground_pick)
}

// ------------------------------------------------------------ units

/// A unit as the pickers see it: its scene nodes (part 3) and the battle
/// flags they filter on (P6.13 state; Z-36-19).
#[derive(Debug, Clone, Copy)]
pub struct PickUnit<'a> {
    /// The placed unit (`group`, `q`/`r` = `col`/`row`, `spawn.id`, side).
    pub unit: &'a PlacedUnit,
    /// `dead`.
    pub dead: bool,
    /// `fadingOut`.
    pub fading_out: bool,
    /// `removed`.
    pub removed: bool,
    /// `routed`.
    pub routed: bool,
}

impl PickUnit<'_> {
    /// A live unit: not dead, not fading, not removed (`_pickUnitAtScreen`).
    #[must_use]
    pub fn live(&self) -> bool {
        !self.dead && !self.fading_out && !self.removed
    }
}

/// `occByKey`: `cellKey(col, row)` → index into the unit list.
pub type Occupancy = HashMap<(i32, i32), usize>;

/// The unit list in web order (`[...this.atk, ...this.def]`).
fn unit_of_node(units: &[PickUnit<'_>], node: NodeId) -> Option<usize> {
    units.iter().position(|u| u.unit.group == node)
}

/// The first unit whose group is `hit.object` or one of its ancestors,
/// walking up while `accept` rejects (`while (obj) { found = …; obj = obj.parent }`).
fn hit_unit<'u>(
    ps: &PickScene<'_>,
    units: &[PickUnit<'u>],
    hit: &Hit,
    accept: impl Fn(&PickUnit<'u>) -> bool,
) -> Option<usize> {
    let mut obj = Some(hit.object);
    while let Some(o) = obj {
        if let Some(i) = unit_of_node(units, o) {
            if accept(&units[i]) {
                return Some(i);
            }
        }
        obj = ps.fs.scene.nodes[o].parent;
    }
    None
}

/// `_pickUnitAtScreen(cx, cy)` (`:11084-11108`): the live unit standing on
/// the picked ground tile, else the unit whose model the ray hits first —
/// but only when it stands on that tile (K2) or no tile was picked.
#[allow(clippy::too_many_arguments)]
pub fn pick_unit_at_screen(
    view: &mut BattleView,
    ps: &PickScene<'_>,
    grid: &TerrainGrid,
    units: &[PickUnit<'_>],
    occ: &Occupancy,
    client: (f64, f64),
    canvas: &Canvas,
) -> Option<usize> {
    let tile = pick_ground_tile_at(view, ps, grid, client, canvas);
    if let Some(t) = tile {
        if let Some(&i) = occ.get(&t) {
            if units[i].live() {
                return Some(i);
            }
        }
    }
    let ray = view.ray_from_canvas(client.0, client.1, canvas)?;
    let cam = RayCamera::of(view);
    let groups: Vec<NodeId> = units
        .iter()
        .filter(|u| u.live())
        .map(|u| u.unit.group)
        .collect();
    let hits = intersect_objects(ps, &ray, &cam, &groups, true);
    for h in &hits {
        if let Some(i) = hit_unit(ps, units, h, PickUnit::live) {
            let u = units[i].unit;
            return match tile {
                None => Some(i),
                Some((c, r)) if u.col == c && u.row == r => Some(i),
                Some(_) => None,
            };
        }
    }
    None
}

// ------------------------------------------------------------ clicks

/// The decision of `_onDeployClick` (`:15063-15150`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DeployClick {
    /// `_handleDeployUnitPick(unit, ctrl, shift)` (see [`handle_deploy_unit_pick`]).
    Pick(usize),
    /// `_applyDeployPlacement(selected, col, row, col, row)` (logic) +
    /// `_clearDeployGhosts()` ([`super::units::clear_deploy_ghosts`]).
    Place {
        /// Target column.
        col: i32,
        /// Target row.
        row: i32,
    },
    /// With a selection that cannot move there: `_showDeployFeedback(msg)`
    /// (when `Some`) and `_clearDeploySelectionState()` (UI / logic).
    Clear {
        /// `'Poza strefą rozstawienia'` / `'Pole nieprzechodne'`.
        feedback: Option<&'static str>,
    },
    /// Nothing happens.
    Nothing,
}

/// `'Poza strefą rozstawienia'` (`:15146`).
pub const FEEDBACK_OUT_OF_ZONE: &str = "Poza strefą rozstawienia";
/// `'Pole nieprzechodne'` (`:15147`).
pub const FEEDBACK_IMPASSABLE: &str = "Pole nieprzechodne";

/// The deploy selection (`_selectedUnits` in `Set` order, `_deploySelected`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct DeploySelection {
    /// `_selectedUnits` (unit ids, insertion order).
    pub selected: Vec<String>,
    /// `_deploySelected` (unit id).
    pub deploy_selected: Option<String>,
}

impl DeploySelection {
    fn has(&self, id: &str) -> bool {
        self.selected.iter().any(|s| s == id)
    }
    fn add(&mut self, id: &str) {
        if !self.has(id) {
            self.selected.push(id.to_owned());
        }
    }
    fn delete(&mut self, id: &str) {
        self.selected.retain(|s| s != id);
    }
}

/// The deploy-click inputs owned by the battle logic (Z-36-19).
pub struct DeployCtx<'a> {
    /// `[...this.atk, ...this.def]` with flags.
    pub units: &'a [PickUnit<'a>],
    /// `_playerControlSide()`.
    pub player: BattleSide,
    /// `occByKey`.
    pub occ: &'a Occupancy,
    /// `_inDeployPlayerZone(col, row)` (P6.13).
    pub in_zone: &'a dyn Fn(i32, i32) -> bool,
}

impl DeployCtx<'_> {
    fn roster(&self) -> impl Iterator<Item = usize> + '_ {
        self.units
            .iter()
            .enumerate()
            .filter(|(_, u)| u.unit.spawn.side == self.player)
            .map(|(i, _)| i)
    }
}

/// `_onDeployClick(cx, cy, preferPlacement)` (`:15063-15150`, deploy phase):
/// a model hit of an own unit standing on the picked tile selects it (K2);
/// otherwise the own unit on the tile; otherwise the selection moves to a
/// free, passable tile of the zone, or is cleared with feedback.
#[allow(clippy::too_many_arguments)]
pub fn deploy_click(
    view: &mut BattleView,
    ps: &PickScene<'_>,
    grid: &TerrainGrid,
    ctx: &DeployCtx<'_>,
    sel: &DeploySelection,
    prefer_placement: bool,
    client: (f64, f64),
    canvas: &Canvas,
) -> DeployClick {
    let tile = pick_ground_tile_at(view, ps, grid, client, canvas);
    if !prefer_placement {
        if let Some(ray) = view.ray_from_canvas(client.0, client.1, canvas) {
            let cam = RayCamera::of(view);
            let groups: Vec<NodeId> = ctx
                .roster()
                .filter(|&i| !ctx.units[i].dead && !ctx.units[i].removed)
                .map(|i| ctx.units[i].unit.group)
                .collect();
            let hits = intersect_objects(ps, &ray, &cam, &groups, true);
            if !hits.is_empty() {
                let mut hit = None;
                for h in &hits {
                    hit = hit_unit(ps, ctx.units, h, |u| {
                        u.unit.spawn.side == ctx.player && !u.dead && !u.removed
                    });
                    if hit.is_some() {
                        break;
                    }
                }
                if let Some(i) = hit {
                    let u = ctx.units[i].unit;
                    if tile.is_some_and(|(c, r)| u.col == c && u.row == r) {
                        return DeployClick::Pick(i);
                    }
                }
            }
        }
    }
    let Some((col, row)) = tile else {
        return DeployClick::Nothing;
    };
    if !prefer_placement {
        if let Some(&i) = ctx.occ.get(&(col, row)) {
            if ctx.units[i].unit.spawn.side == ctx.player {
                return DeployClick::Pick(i);
            }
        }
    }
    let has_selection = sel.deploy_selected.is_some() || !sel.selected.is_empty();
    let in_zone = (ctx.in_zone)(col, row);
    let passable = grid.passable(col, row);
    if has_selection && in_zone && passable {
        // _getDeploySelectedUnits(): selected ids → live, not removed roster units
        let any = sel.selected.iter().any(|id| {
            ctx.roster().any(|i| {
                let u = &ctx.units[i];
                u.unit.spawn.id == *id && !u.dead && !u.removed
            })
        });
        if any {
            return DeployClick::Place { col, row };
        }
    }
    if has_selection {
        let feedback = if !in_zone {
            Some(FEEDBACK_OUT_OF_ZONE)
        } else if !passable {
            Some(FEEDBACK_IMPASSABLE)
        } else {
            None
        };
        return DeployClick::Clear { feedback };
    }
    DeployClick::Nothing
}

/// A player unit for [`handle_deploy_unit_pick`]: the [`PickUnit`] plus its
/// `groupId` (logic state).
#[derive(Debug, Clone)]
pub struct RosterPick<'a> {
    /// The unit and its flags.
    pub pick: PickUnit<'a>,
    /// `ru.groupId` (non-empty = in a group).
    pub group_id: Option<String>,
}

impl RosterPick<'_> {
    fn in_group(&self) -> bool {
        self.group_id.as_deref().is_some_and(|g| !g.is_empty())
    }
    fn id(&self) -> &str {
        &self.pick.unit.spawn.id
    }
}

/// `_handleDeployUnitPick(ru, ctrl, shift)` (`:14369-14410`) with the 3D
/// part of `_refreshDeploySelectionVisuals` (part 3) and its
/// `_deploySelected = _primarySelectedUnit()` (`:14978-14980`, `:10417-10423`).
/// `roster` = `_playerRoster()`; `all` = every unit (`_findUnitById`
/// searches `atk` then `def`). UI refreshes (roster bar, toolbar) → P5.
/// Returns `false` when nothing happened (dead / removed unit, or a plain
/// click on the only selected unit), `true` after the visuals refresh.
#[allow(clippy::too_many_arguments)]
pub fn handle_deploy_unit_pick(
    fs: &mut FieldScene,
    rings: &mut SelectionRings,
    sel: &mut DeploySelection,
    roster: &[RosterPick<'_>],
    all: &[PickUnit<'_>],
    unit: usize,
    ctrl: bool,
    shift: bool,
) -> bool {
    let ru = &roster[unit];
    if ru.pick.dead || ru.pick.removed {
        return false;
    }
    let additive = ctrl || shift;
    let id = ru.id().to_owned();
    let group = ru.pick.unit.group;
    if ru.in_group() && additive {
        if sel.has(&id) {
            sel.delete(&id);
            remove_selection_ring(&mut fs.scene, rings, &id, group);
        } else {
            sel.add(&id);
            add_selection_ring(&mut fs.scene, rings, &id, group, ru.in_group());
            refresh_unit_ring_color(&mut fs.scene, rings, &id, ru.in_group());
        }
        refresh_visuals(fs, rings, sel, roster);
        return true;
    }
    if additive {
        if sel.has(&id) {
            sel.delete(&id);
            remove_selection_ring(&mut fs.scene, rings, &id, group);
            if sel.deploy_selected.as_deref() == Some(id.as_str()) {
                sel.deploy_selected = None;
            }
        } else {
            sel.add(&id);
            add_selection_ring(&mut fs.scene, rings, &id, group, ru.in_group());
        }
    } else {
        if sel.selected.len() == 1 && sel.has(&id) {
            return false;
        }
        for sid in sel.selected.clone() {
            if let Some(u) = all.iter().find(|u| u.unit.spawn.id == sid) {
                remove_selection_ring(&mut fs.scene, rings, &sid, u.unit.group);
                fs.scene.set_scale_scalar(u.unit.group, 1.0);
            }
        }
        sel.selected.clear();
        sel.add(&id);
        add_selection_ring(&mut fs.scene, rings, &id, group, ru.in_group());
        sel.deploy_selected = Some(id);
    }
    refresh_visuals(fs, rings, sel, roster);
    true
}

/// `_refreshDeploySelectionVisuals()` (`:14967-14980`): 3D part (part 3) +
/// `_deploySelected = _primarySelectedUnit()`.
fn refresh_visuals(
    fs: &mut FieldScene,
    rings: &SelectionRings,
    sel: &mut DeploySelection,
    roster: &[RosterPick<'_>],
) {
    let ru: Vec<RosterUnit> = roster
        .iter()
        .map(|r| RosterUnit {
            id: r.id().to_owned(),
            group: r.pick.unit.group,
            dead: r.pick.dead,
            removed: r.pick.removed,
        })
        .collect();
    refresh_deploy_selection_visuals(fs, &ru, &sel.selected, rings);
    sel.deploy_selected = sel
        .selected
        .iter()
        .find(|id| {
            roster
                .iter()
                .any(|r| r.id() == id.as_str() && !r.pick.dead && !r.pick.removed && !r.pick.routed)
        })
        .cloned();
}

/// The decision of `_onBattleClick` (`:17510-17576`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BattleClick {
    /// `_handleBattleUnitPick(unit, ctrl, shift)` (selection → P6.13 / P5).
    PickOwn(usize),
    /// `_issueBattleAttack(target id, queueOnly)`.
    Attack(usize),
    /// `_issueBattleMove(col, row, queueOnly)`.
    Move(i32, i32),
    /// Nothing happens.
    Nothing,
}

/// `queueOnly` of `_onBattleClick` (`:17511-17512`).
#[must_use]
pub fn battle_queue_only(ctrl: bool, shift: bool, awaiting_orders: bool, round_no: f64) -> bool {
    ctrl || shift || (awaiting_orders && round_no < 1.0)
}

/// `_onBattleClick(cx, cy)` (`:17510-17576`): like [`deploy_click`] over
/// both armies (not dead, not fading — `removed` is not filtered here):
/// own unit → select, enemy with a selection → attack, else a selection
/// moves to the picked tile.
#[allow(clippy::too_many_arguments)]
pub fn battle_click(
    view: &mut BattleView,
    ps: &PickScene<'_>,
    grid: &TerrainGrid,
    units: &[PickUnit<'_>],
    occ: &Occupancy,
    player: BattleSide,
    selected_count: usize,
    client: (f64, f64),
    canvas: &Canvas,
) -> BattleClick {
    let tile = pick_ground_tile_at(view, ps, grid, client, canvas);
    let Some(ray) = view.ray_from_canvas(client.0, client.1, canvas) else {
        return BattleClick::Nothing;
    };
    let cam = RayCamera::of(view);
    let alive = |u: &PickUnit<'_>| !u.dead && !u.fading_out;
    let groups: Vec<NodeId> = units
        .iter()
        .filter(|u| alive(u))
        .map(|u| u.unit.group)
        .collect();
    let hits = intersect_objects(ps, &ray, &cam, &groups, true);
    let mut hit = None;
    for h in &hits {
        hit = hit_unit(ps, units, h, alive);
        if hit.is_some() {
            break;
        }
    }
    if let Some(i) = hit {
        let u = units[i].unit;
        if !tile.is_some_and(|(c, r)| u.col == c && u.row == r) {
            hit = None;
        }
    }
    if let Some(i) = hit {
        if units[i].unit.spawn.side == player {
            return BattleClick::PickOwn(i);
        }
        if selected_count > 0 {
            return BattleClick::Attack(i);
        }
    }
    let Some((col, row)) = tile else {
        return BattleClick::Nothing;
    };
    if hit.is_none() {
        if let Some(&i) = occ.get(&(col, row)) {
            if alive(&units[i]) {
                if units[i].unit.spawn.side == player {
                    return BattleClick::PickOwn(i);
                }
                if selected_count > 0 {
                    return BattleClick::Attack(i);
                }
            }
        }
    }
    if selected_count > 0 {
        return BattleClick::Move(col, row);
    }
    BattleClick::Nothing
}

/// The hit test of `_doBoxSelect(x1, y1, x2, y2)` (`:16498-16508`): units of
/// `roster` (indices into `units`; `_playerRoster()` in deploy / manual
/// mode, else `this.atk`) that are not dead / fading / removed / routed and
/// whose group position projects (`worldToClientPx`, fresh camera matrix)
/// inside the closed rectangle. Selection and UI → P6.13 / P5.
pub fn box_select(
    view: &mut BattleView,
    fs: &FieldScene,
    units: &[PickUnit<'_>],
    roster: &[usize],
    (x1, y1, x2, y2): (f64, f64, f64, f64),
    canvas: &Canvas,
) -> Vec<usize> {
    view.update_matrix_world();
    let mut found = Vec::new();
    for &i in roster {
        let u = &units[i];
        if u.dead || u.fading_out || u.removed || u.routed {
            continue;
        }
        let p = fs.scene.nodes[u.unit.group].position;
        let Some((px, py)) = view.world_to_client_px(Vec3::new(p.x, p.y, p.z), canvas) else {
            continue;
        };
        if px >= x1 && px <= x2 && py >= y1 && py <= y2 {
            found.push(i);
        }
    }
    found
}

/// `_onKeyToggleBars(e)` (`:9993-10004`, in the line range of the
/// `_tickCameraPanKeys` inventory row; the settings toggle `:3179-3185` has
/// the same 3D effect): `h` / `H` without modifiers outside an editable
/// target flips `barsVisible` and shows / hides the bar group of every unit
/// that is not dead or removed (`bars` = `(bar group, dead || removed)`).
/// Returns `preventDefault`.
pub fn on_key_toggle_bars(
    scene: &mut Scene,
    bars: &[(NodeId, bool)],
    bars_visible: &mut bool,
    key: &str,
    editable: bool,
    modifier: bool,
) -> bool {
    if key != "h" && key != "H" {
        return false;
    }
    if editable || modifier {
        return false;
    }
    *bars_visible = !*bars_visible;
    for &(group, skip) in bars {
        if !skip {
            scene.nodes[group].visible = *bars_visible;
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ray(o: (f64, f64, f64), d: (f64, f64, f64)) -> Ray {
        Ray {
            origin: Vec3::new(o.0, o.1, o.2),
            direction: Vec3::new(d.0, d.1, d.2).normalize(),
        }
    }

    #[test]
    fn clamp_battle_tile_bounds() {
        // `:1743-1746`
        assert_eq!(clamp_battle_tile(-1.0, 0.0), None);
        assert_eq!(clamp_battle_tile(0.0, 0.0), Some((0.0, 0.0)));
        assert_eq!(clamp_battle_tile(67.0, 155.0), Some((67.0, 155.0)));
        assert_eq!(clamp_battle_tile(68.0, 0.0), None);
        assert_eq!(clamp_battle_tile(0.0, 156.0), None);
    }

    #[test]
    fn segment_distance_branches() {
        // Perpendicular ray above the middle of a segment: distance = height.
        let r = ray((0.0, 2.0, 0.0), (0.0, -1.0, 0.0));
        let (d, on_ray, on_seg) =
            distance_sq_to_segment(&r, Vec3::new(-1.0, 0.5, 0.0), Vec3::new(1.0, 0.5, 0.0));
        assert_eq!(d, 0.0);
        assert_eq!(on_ray, Vec3::new(0.0, 0.5, 0.0));
        assert_eq!(on_seg, Vec3::new(0.0, 0.5, 0.0));
        // Parallel ray (det = 0) beside the segment.
        let r = ray((-5.0, 0.0, 1.0), (1.0, 0.0, 0.0));
        let (d, _, on_seg) =
            distance_sq_to_segment(&r, Vec3::new(-1.0, 0.0, 0.0), Vec3::new(1.0, 0.0, 0.0));
        // det = 0, a01 = -1 → s1 = +extent (three's branch), s0 = 6
        assert_eq!(d, 1.0);
        assert_eq!(on_seg.x, 1.0);
        // Segment behind the ray origin: s0 clamps to 0.
        let r = ray((0.0, 0.0, 0.0), (0.0, 0.0, 1.0));
        let (d, on_ray, _) =
            distance_sq_to_segment(&r, Vec3::new(-1.0, 0.0, -3.0), Vec3::new(1.0, 0.0, -3.0));
        assert_eq!(on_ray, Vec3::new(0.0, 0.0, 0.0));
        assert_eq!(d, 9.0);
    }

    /// Material arrays: every geometry group is raycast with its own
    /// material's side (three r169 `Mesh.js:207-235`), `BackSide` reverses
    /// the winding (`checkIntersection`). No battle model uses a material
    /// array or `BackSide` (P4-36 Z-36-21), so this pins the rule directly.
    #[test]
    fn material_groups_and_back_side() {
        use crate::scene::{Material, Prim, ROOT};
        let mut fs = FieldScene::new();
        let front = fs.scene.add_material(Material::basic(0x00ff_ffff));
        let mut m = Material::basic(0x00ff_ffff);
        m.side = Side::Double;
        let double = fs.scene.add_material(m);
        let mut m = Material::basic(0x00ff_ffff);
        m.side = Side::Back;
        let back = fs.scene.add_material(m);
        // BoxGeometry groups: px, nx, py, ny, pz, nz
        let a = fs.scene.add_mesh_multi(
            ROOT,
            Prim::bx(2.0, 2.0, 2.0),
            vec![front, double, front, front, front, front],
        );
        let b = fs.scene.add_mesh_multi(
            ROOT,
            Prim::bx(2.0, 2.0, 2.0),
            vec![front, back, front, front, front, front],
        );
        let ps = PickScene::new(&fs);
        let cam = RayCamera {
            matrix_world: Mat4::IDENTITY,
            matrix_world_inverse: Mat4::IDENTITY,
        };
        let inside = |d: f64| ray((0.0, 0.3, 0.2), (d, 0.0, 0.0));
        for node in [a, b] {
            // toward -X the nx face (group 1: double / back) is seen from inside: hit
            let hits = intersect_objects(&ps, &inside(-1.0), &cam, &[node], false);
            assert_eq!(hits.len(), 1, "node {node}");
            assert_eq!(hits[0].point.x, -1.0);
            // toward +X the px face (group 0, front) is culled from inside
            assert!(intersect_objects(&ps, &inside(1.0), &cam, &[node], false).is_empty());
        }
        // from outside, the back-side face is culled, the double one is not
        let outside = ray((-5.0, 0.3, 0.2), (1.0, 0.0, 0.0));
        assert_eq!(intersect_objects(&ps, &outside, &cam, &[a], false).len(), 1);
        let hits = intersect_objects(&ps, &outside, &cam, &[b], false);
        // nx (back) culled from outside; px (front) culled from behind as well
        assert!(hits.is_empty());
    }

    #[test]
    fn queue_only_rule() {
        // `:17511-17512`
        assert!(battle_queue_only(true, false, false, 3.0));
        assert!(battle_queue_only(false, true, false, 3.0));
        assert!(battle_queue_only(false, false, true, 0.0));
        assert!(!battle_queue_only(false, false, true, 1.0));
        assert!(!battle_queue_only(false, false, false, 0.0));
    }

    #[test]
    fn plane_pick_iterates_on_relief() {
        // A ray from above at 45°: on flat ground the first guess is final.
        let flat = TerrainGrid::new(BF_COLS, BF_ROWS, vec![0; (BF_COLS * BF_ROWS) as usize]);
        let r = ray((10.0, 5.0, 20.0), (0.0, -1.0, 1.0));
        assert_eq!(pick_ground_tile_plane(&r, &flat), Some((10, 25)));
        // Behind the camera / outside the field.
        let up = ray((10.0, 5.0, 20.0), (0.0, 1.0, 0.0));
        assert_eq!(pick_ground_tile_plane(&up, &flat), None);
        let out = ray((-10.0, 5.0, 20.0), (0.0, -1.0, 0.0));
        assert_eq!(pick_ground_tile_plane(&out, &flat), None);
    }
}
