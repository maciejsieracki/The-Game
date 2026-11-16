//! Port 1:1 of `gra/src/render/generalHexRing.ts` (pin `07d2fbd72`): the
//! band around the 7 hexes of a general (R-WEB-UI-GENERAL-HEX-RING-OUTLINE-Q1).
//!
//! The outline is the outer contour of the union of the general's hex and
//! its 6 neighbours (18 edges); the band lies just outside it
//! (`GENERAL_RING_GAP`), its width follows the camera
//! ([`general_ring_world_width`]) and its height is the highest terrain top
//! of the 7 hexes ([`general_ring_y`]).

use std::collections::HashMap;
use std::sync::{Arc, OnceLock};

use crate::geom::Mesh;
use crate::jsmath::{js_cos, js_hypot, js_sin, js_tan};
use crate::pick::hex::{axial_to_world_f, js_round, HEX_R};
use crate::pick::three::js_max;
use crate::scene::{Geo, Geometry, Material, MeshData, NodeKind, Scene, Side, ROOT};

/// `GENERAL_RING_HEX_OFFSETS` (`generalHexRing.ts:19-21`): centre + the 6
/// axial neighbours, in this order.
pub const GENERAL_RING_HEX_OFFSETS: [(i32, i32); 7] =
    [(0, 0), (1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];
/// `GENERAL_RING_BASE_WIDTH` (`:24`).
pub const GENERAL_RING_BASE_WIDTH: f64 = 0.12 * HEX_R;
/// `GENERAL_RING_MIN_PX` (`:26`).
pub const GENERAL_RING_MIN_PX: f64 = 4.0;
/// `GENERAL_RING_GAP` (`:28`).
pub const GENERAL_RING_GAP: f64 = 0.05 * HEX_R;
/// `GENERAL_RING_LIFT` (`:30`).
pub const GENERAL_RING_LIFT: f64 = 0.05 * HEX_R;
/// `GENERAL_RING_OPACITY` (`:31`).
pub const GENERAL_RING_OPACITY: f64 = 0.9;
/// `mesh.renderOrder = 13` (`:152`).
pub const GENERAL_RING_RENDER_ORDER: i32 = 13;

/// A point of the XZ plane (`type Pt`, `:33`).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Pt {
    /// World X.
    pub x: f64,
    /// World Z.
    pub z: f64,
}

/// `GeneralRingLoop` (`:48-55`).
#[derive(Clone, Debug, PartialEq)]
pub struct GeneralRingLoop {
    /// Outline corners in loop order (first not repeated).
    pub points: Vec<Pt>,
    /// Outward unit normal of edge `i` (point `i` → `i + 1`).
    pub normals: Vec<Pt>,
    /// Miter vectors at the corners (`m·n_{i-1} = 1`, `m·n_i = 1`).
    pub miters: Vec<Pt>,
}

/// `hexCorners(cx, cz)` (`:36-43`): pointy-top corners, `a = π/2 + iπ/3`.
fn hex_corners(cx: f64, cz: f64) -> [Pt; 6] {
    std::array::from_fn(|i| {
        #[allow(clippy::cast_precision_loss)]
        let a = std::f64::consts::PI / 2.0 + (i as f64 * std::f64::consts::PI) / 3.0;
        Pt {
            x: cx + HEX_R * js_cos(a),
            z: cz + HEX_R * js_sin(a),
        }
    })
}

/// `keyOf(p)` (`:46`): integer key so that a corner shared by two hexes
/// gives the same key.
#[allow(clippy::cast_possible_truncation)]
fn key_of(p: Pt) -> (i64, i64) {
    (js_round(p.x * 1e5) as i64, js_round(p.z * 1e5) as i64)
}

/// The web string key `"${x},${z}"` compared with `<` (`:71`): string order
/// of the decimal forms, not numeric order.
fn key_string(k: (i64, i64)) -> String {
    format!("{},{}", k.0, k.1)
}

/// `getGeneralRingLoop()` (`:60-122`): computed once and cached.
#[must_use]
pub fn general_ring_loop() -> &'static GeneralRingLoop {
    static LOOP: OnceLock<GeneralRingLoop> = OnceLock::new();
    LOOP.get_or_init(compute_loop)
}

fn compute_loop() -> GeneralRingLoop {
    // `edges` Map: insertion order + lookup by id.
    let mut edges: Vec<(Pt, Pt, u32)> = Vec::new();
    let mut index: HashMap<String, usize> = HashMap::new();
    for &(dq, dr) in &GENERAL_RING_HEX_OFFSETS {
        let (cx, cz) = axial_to_world_f(f64::from(dq), f64::from(dr), HEX_R);
        let corners = hex_corners(cx, cz);
        for i in 0..6 {
            let a = corners[i];
            let b = corners[(i + 1) % 6];
            let ka = key_string(key_of(a));
            let kb = key_string(key_of(b));
            let id = if ka < kb {
                format!("{ka}|{kb}")
            } else {
                format!("{kb}|{ka}")
            };
            if let Some(&e) = index.get(&id) {
                edges[e].2 += 1;
            } else {
                index.insert(id, edges.len());
                edges.push((a, b, 1));
            }
        }
    }
    // An edge shared by two hexes appears twice → not on the outline.
    let outer: Vec<(Pt, Pt)> = edges
        .iter()
        .filter(|e| e.2 == 1)
        .map(|e| (e.0, e.1))
        .collect();
    let mut next: HashMap<(i64, i64), usize> = HashMap::new();
    for (i, e) in outer.iter().enumerate() {
        next.insert(key_of(e.0), i);
    }
    let mut points = Vec::new();
    let mut cur = 0usize;
    for _guard in 0..outer.len() {
        points.push(outer[cur].0);
        let Some(&step) = next.get(&key_of(outer[cur].1)) else {
            break;
        };
        cur = step;
        if cur == 0 {
            break;
        }
    }
    let n = points.len();

    // Signed area: for a CW loop the outward normal is flipped.
    let mut area2 = 0.0;
    for i in 0..n {
        let p = points[i];
        let q = points[(i + 1) % n];
        area2 += p.x * q.z - q.x * p.z;
    }
    let orient = if area2 >= 0.0 { 1.0 } else { -1.0 };

    let mut normals = Vec::with_capacity(n);
    for i in 0..n {
        let p = points[i];
        let q = points[(i + 1) % n];
        let dx = q.x - p.x;
        let dz = q.z - p.z;
        let h = js_hypot(dx, dz);
        // `Math.hypot(dx, dz) || 1`: 0 and NaN are falsy.
        let len = if h == 0.0 || h.is_nan() { 1.0 } else { h };
        normals.push(Pt {
            x: (orient * dz) / len,
            z: (orient * -dx) / len,
        });
    }

    let mut miters = Vec::with_capacity(n);
    for i in 0..n {
        let n1 = normals[(i + n - 1) % n];
        let n2 = normals[i];
        let denom = 1.0 + (n1.x * n2.x + n1.z * n2.z);
        miters.push(Pt {
            x: (n1.x + n2.x) / denom,
            z: (n1.z + n2.z) / denom,
        });
    }

    GeneralRingLoop {
        points,
        normals,
        miters,
    }
}

/// `write(w)` of `createGeneralHexRing` (`:157-183`): the band positions
/// (`Float32Array`, two triangles per outline edge, y = 0).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn general_ring_positions(width: f64) -> Vec<f32> {
    let lp = general_ring_loop();
    let n = lp.points.len();
    let inner = GENERAL_RING_GAP;
    let outer_off = GENERAL_RING_GAP + width;
    let mut out = Vec::with_capacity(n * 2 * 3 * 3);
    let mut put = |x: f64, z: f64| {
        out.push(x as f32);
        out.push(0.0);
        out.push(z as f32);
    };
    for i in 0..n {
        let j = (i + 1) % n;
        let p = lp.points[i];
        let q = lp.points[j];
        let mi = lp.miters[i];
        let mj = lp.miters[j];
        let ai = Pt {
            x: p.x + mi.x * inner,
            z: p.z + mi.z * inner,
        };
        let bi = Pt {
            x: p.x + mi.x * outer_off,
            z: p.z + mi.z * outer_off,
        };
        let aj = Pt {
            x: q.x + mj.x * inner,
            z: q.z + mj.z * inner,
        };
        let bj = Pt {
            x: q.x + mj.x * outer_off,
            z: q.z + mj.z * outer_off,
        };
        // (ai, bi, bj) and (ai, bj, aj).
        put(ai.x, ai.z);
        put(bi.x, bi.z);
        put(bj.x, bj.z);
        put(ai.x, ai.z);
        put(bj.x, bj.z);
        put(aj.x, aj.z);
    }
    out
}

/// `GeneralHexRing` (`:124-132`) returned by `createGeneralHexRing`
/// (`:138-198`): one mesh (the scene root) whose positions are rewritten on
/// [`Self::set_width`].
#[derive(Clone, Debug, PartialEq)]
pub struct GeneralHexRing {
    /// The band: root = `THREE.Mesh` (`renderOrder = 13`, material
    /// `MeshBasicMaterial({ color, transparent, opacity: 0.9, depthWrite:
    /// false, side: DoubleSide })`). Not pickable (`mesh.raycast = () => {}`,
    /// `:154`): it never enters `UnitPickModel.meshes`.
    pub scene: Scene,
    width: f64,
    /// Number of `write(w)` calls (the web recomputes only on a real change).
    writes: u32,
}

impl GeneralHexRing {
    /// `createGeneralHexRing(color, width = GENERAL_RING_BASE_WIDTH)`.
    #[must_use]
    pub fn new(color: u32, width: f64) -> Self {
        let mut mat = Material::basic(color);
        mat.transparent = true;
        mat.opacity = GENERAL_RING_OPACITY;
        mat.depth_write = false;
        mat.side = Side::Double;
        let mut scene = Scene::new();
        let m = scene.add_material(mat);
        scene.nodes[ROOT].kind = NodeKind::Mesh(MeshData::new(ring_geo(width), m));
        scene.nodes[ROOT].render_order = GENERAL_RING_RENDER_ORDER;
        Self {
            scene,
            width,
            writes: 1,
        }
    }

    /// `ring.width` (current band width, world units).
    #[must_use]
    pub const fn width(&self) -> f64 {
        self.width
    }

    /// How many times the positions were written (1 at creation).
    #[must_use]
    pub const fn writes(&self) -> u32 {
        self.writes
    }

    /// `setWidth(w)` (`:189-192`): rewrite only on a real change.
    #[allow(clippy::float_cmp)]
    pub fn set_width(&mut self, w: f64) {
        if w == self.width {
            return;
        }
        if let NodeKind::Mesh(md) = &mut self.scene.nodes[ROOT].kind {
            md.geo = ring_geo(w);
        }
        self.width = w;
        self.writes += 1;
    }

    /// The band positions (`geometry.attributes.position.array`).
    #[must_use]
    pub fn positions(&self) -> Vec<f32> {
        self.scene.nodes[ROOT]
            .mesh()
            .map(|md| md.geo.mesh().positions.clone())
            .unwrap_or_default()
    }

    /// `mesh.visible`.
    #[must_use]
    pub fn visible(&self) -> bool {
        self.scene.nodes[ROOT].visible
    }

    /// `mesh.visible = v`.
    pub fn set_visible(&mut self, v: bool) {
        self.scene.nodes[ROOT].visible = v;
    }

    /// `mesh.position`.
    #[must_use]
    pub fn position(&self) -> (f64, f64, f64) {
        let p = self.scene.nodes[ROOT].position;
        (p.x, p.y, p.z)
    }

    /// `mesh.position.set(x, y, z)`.
    pub fn set_position(&mut self, x: f64, y: f64, z: f64) {
        self.scene.nodes[ROOT].set_pos(x, y, z);
    }

    /// `mesh.material.color.getHex()`.
    #[must_use]
    pub fn color(&self) -> u32 {
        self.scene.materials.first().map_or(0, Material::hex)
    }
}

fn ring_geo(width: f64) -> Geo {
    Geo::Buffer(Arc::new(Geometry::from(Mesh {
        positions: general_ring_positions(width),
        ..Mesh::default()
    })))
}

/// `generalRingWorldWidth(camDist, fovDeg, viewportH, minPx)` (`:204-213`).
#[must_use]
pub fn general_ring_world_width(cam_dist: f64, fov_deg: f64, viewport_h: f64, min_px: f64) -> f64 {
    // `!(x > 0)`: also true for NaN.
    let positive = |x: f64| x > 0.0;
    if !positive(viewport_h) || !positive(cam_dist) || !positive(fov_deg) {
        return GENERAL_RING_BASE_WIDTH;
    }
    let world_per_px =
        (2.0 * cam_dist * js_tan((fov_deg * std::f64::consts::PI) / 360.0)) / viewport_h;
    js_max(GENERAL_RING_BASE_WIDTH, min_px * world_per_px)
}

/// `generalRingY(topYs)` (`:221-230`): highest finite top + lift.
#[must_use]
pub fn general_ring_y(top_ys: &[f64]) -> f64 {
    let mut top = 0.0;
    let mut any = false;
    for &y in top_ys {
        if !y.is_finite() {
            continue;
        }
        top = if any { js_max(top, y) } else { y };
        any = true;
    }
    (if any { top } else { 0.0 }) + GENERAL_RING_LIFT
}
