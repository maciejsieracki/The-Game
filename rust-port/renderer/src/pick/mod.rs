//! `pick` — CPU picking pixel → hex / unit, 1:1 with the web picker.
//!
//! Topic **RR-T3** (R-RUSTPORT-P4-10-PICKING-CPU-Q1; P4.3 §3.3–§3.8). Hover
//! picking of extra objects (veteran stars, city chips — **RR-T13**) is not
//! implemented; it plugs into the same [`raycast::intersect_objects`] with
//! its own [`raycast::PickObject`] lists.
//!
//! Decision D-RR-3 (orchestrator default, open for owner review): the web
//! behaviour is reproduced **as is**, quirks included (prism sides,
//! mountain/hill solids, units first, 1.008·R overlap and its hit order,
//! `coastalDrop` 0.045, 0.18 vs 0.22 for `PlytkieMorze`, the `picker.ts`
//! tie rule of `worldToAxial`, `Math.round`).
//!
//! Call chain mirrored (web `edb8fb56`):
//! `main.ts:1894-1901 pickMapTarget` → `units.ts:5867-5893 pickUnitIdAt`
//! (units first) → `main.ts:1885-1891 pickHexAt` →
//! `input/picker.ts:175-250 pixelToHex`.
//!
//! Layout:
//! - [`three`]: bit-exact replicas of the Three.js r169 math used on the way;
//! - [`hex`]: axial ↔ world, both `worldToAxial` variants, `Math.round`, NDC;
//! - [`camera`]: picking camera (fov 50°, near 0.5, 52°, yaw 0) and rays;
//! - [`raycast`]: `Mesh` / `InstancedMesh` raycast + stable distance sort;
//! - [`terrain`]: the terrain pick scene (prisms + solids) and `topYAt`.

pub mod camera;
pub mod hex;
pub mod raycast;
pub mod terrain;
pub mod three;

use hex::{world_to_axial_picker, ClientRect, HexCoord, HEX_R};
use raycast::{intersect_objects, InstancedPickMesh, PickMesh, PickObject, RawHit};
use terrain::TerrainPickScene;
use three::{Mat4, Ray, Vec3};

/// Which rule of `pixelToHex` produced the hex (diagnostics and test
/// coverage; the web returns only the hex).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum PickVia {
    /// Hit on a resolved instance with world normal `y > 0.5`
    /// (`picker.ts:211-212`).
    TopFace,
    /// Side hit whose `worldToAxial(point)` equals the instance hex
    /// (`picker.ts:215-216`).
    SideMatch,
    /// First side hit that did not match, used after the loop
    /// (`picker.ts:217, 225`).
    SideFallback,
    /// Hit without a resolved instance and normal `y > 0.5` →
    /// `worldToAxial(point)` (`picker.ts:221-223`). Unreachable with
    /// [`terrain::build_terrain_pick_scene`] (every instance has a hex).
    UnresolvedTopFace,
    /// First visible hit → `worldToAxial(point)` (`picker.ts:226-229`).
    FirstVisibleHit,
    /// No terrain hit: plane `y = 0` → coarse hex → plane `y = topYAt`
    /// (`picker.ts:239-245`).
    PlaneRefined,
    /// No terrain hit and `topYAt(coarse) <= 0` (outside the map) or the
    /// refined plane is behind the ray (`picker.ts:249`).
    PlaneCoarse,
}

/// Result of [`pixel_to_hex`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct HexPick {
    /// Picked hex.
    pub hex: HexCoord,
    /// Rule that produced it.
    pub via: PickVia,
}

fn world_up_normal(hit: &RawHit) -> f64 {
    // worldUpNormal (picker.ts:152-158): face.normal.transformDirection(object.matrixWorld);
    // pick meshes hang under the scene root → matrixWorld is the identity.
    hit.face_normal.transform_direction(&Mat4::IDENTITY).y
}

/// `pixelToHex` for an already built ray (`picker.ts:195-249`).
///
/// `meshes` is `terrainPickMeshes`; `top_y_at` is `unitRenderer.topYAt`.
/// Returns `None` only when the ray does not reach the plane `y = 0` in the
/// forward direction (camera looking up — impossible at 52° elevation).
#[must_use]
pub fn ray_to_hex(
    ray: &Ray,
    meshes: &[InstancedPickMesh],
    top_y_at: &dyn Fn(HexCoord) -> f64,
) -> Option<HexPick> {
    if !meshes.is_empty() {
        // Invisible meshes are skipped by both the loop (`visible === false`) and
        // `hits.find(visible)`, so they are not raycast at all.
        let visible: Vec<usize> = (0..meshes.len()).filter(|&i| meshes[i].visible).collect();
        let objects: Vec<PickObject<'_>> = visible
            .iter()
            .map(|&i| PickObject::Instanced(&meshes[i]))
            .collect();
        let hits = intersect_objects(ray, &objects);
        let mut side_resolved_fallback: Option<HexCoord> = None;
        for h in &hits {
            let mesh = &meshes[visible[h.object]];
            let resolved = h
                .instance
                .and_then(|i| mesh.hexes.get(i).copied().flatten());
            if let Some(resolved) = resolved {
                if world_up_normal(h) > 0.5 {
                    return Some(HexPick {
                        hex: resolved,
                        via: PickVia::TopFace,
                    });
                }
                let from_point = world_to_axial_picker(h.point.x, h.point.z, HEX_R);
                if from_point == resolved {
                    return Some(HexPick {
                        hex: resolved,
                        via: PickVia::SideMatch,
                    });
                }
                if side_resolved_fallback.is_none() {
                    side_resolved_fallback = Some(resolved);
                }
                continue;
            }
            if world_up_normal(h) > 0.5 {
                return Some(HexPick {
                    hex: world_to_axial_picker(h.point.x, h.point.z, HEX_R),
                    via: PickVia::UnresolvedTopFace,
                });
            }
        }
        if let Some(hex) = side_resolved_fallback {
            return Some(HexPick {
                hex,
                via: PickVia::SideFallback,
            });
        }
        if let Some(first) = hits.first() {
            return Some(HexPick {
                hex: world_to_axial_picker(first.point.x, first.point.z, HEX_R),
                via: PickVia::FirstVisibleHit,
            });
        }
    }
    let up = Vec3::new(0.0, 1.0, 0.0);
    let p0 = ray.intersect_plane(up, 0.0)?;
    let coarse = world_to_axial_picker(p0.x, p0.z, HEX_R);
    let top_y = top_y_at(coarse);
    if top_y > 0.0 {
        if let Some(p) = ray.intersect_plane(up, -top_y) {
            return Some(HexPick {
                hex: world_to_axial_picker(p.x, p.z, HEX_R),
                via: PickVia::PlaneRefined,
            });
        }
    }
    Some(HexPick {
        hex: coarse,
        via: PickVia::PlaneCoarse,
    })
}

/// `pixelToHex(clientX, clientY, canvas, camera, HEX_R, terrainPickMeshes,
/// resolveTerrainPick, topYAt)` — what `pickHexAt` calls (`main.ts:1885-1891`).
#[must_use]
pub fn pixel_to_hex(
    camera: &camera::CameraMatrices,
    rect: &ClientRect,
    client_x: f64,
    client_y: f64,
    scene: &TerrainPickScene,
) -> Option<HexPick> {
    let ray = camera.ray_from_client(client_x, client_y, rect)?;
    ray_to_hex(&ray, &scene.meshes, &|h| scene.top_y_at(h))
}

/// Pickable model of one **visible** unit token (`units.ts:5880`, roots
/// filtered by `visible`): its meshes in `Object3D.traverse` order with
/// world matrices. Every mesh counts, also invisible children: Three's
/// `intersectObjects(roots, true)` does not test `visible`.
#[derive(Clone, Debug, PartialEq)]
pub struct UnitPickModel {
    /// `userData.unitId`.
    pub id: String,
    /// Hex of the unit (`u.q, u.r`), returned instead of the hex under the cursor.
    pub hex: HexCoord,
    /// Meshes of the token.
    pub meshes: Vec<PickMesh>,
}

/// `unitRenderer.pickUnitIdAt` for a ray: index of the unit whose mesh is
/// hit first (all hits sorted by distance), or `None`.
#[must_use]
pub fn ray_to_unit(ray: &Ray, units: &[UnitPickModel]) -> Option<usize> {
    let mut owner = Vec::new();
    let mut objects = Vec::new();
    for (ui, u) in units.iter().enumerate() {
        for m in &u.meshes {
            owner.push(ui);
            objects.push(PickObject::Mesh(m));
        }
    }
    if objects.is_empty() {
        return None;
    }
    intersect_objects(ray, &objects)
        .first()
        .map(|h| owner[h.object])
}

/// Result of [`pick_map_target`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MapPick {
    /// A unit model was hit: its hex wins (`main.ts:1896-1899`).
    Unit {
        /// Index into the `units` slice.
        index: usize,
        /// Hex of that unit.
        hex: HexCoord,
    },
    /// Terrain pick.
    Terrain(HexPick),
}

impl MapPick {
    /// The hex the web `pickMapTarget` returns.
    #[must_use]
    pub fn hex(&self) -> HexCoord {
        match self {
            Self::Unit { hex, .. } => *hex,
            Self::Terrain(p) => p.hex,
        }
    }
}

/// `pickMapTarget(clientX, clientY)` (`main.ts:1894-1901`): units first,
/// then [`pixel_to_hex`].
#[must_use]
pub fn pick_map_target(
    camera: &camera::CameraMatrices,
    rect: &ClientRect,
    client_x: f64,
    client_y: f64,
    units: &[UnitPickModel],
    scene: &TerrainPickScene,
) -> Option<MapPick> {
    let ray = camera.ray_from_client(client_x, client_y, rect)?;
    if let Some(i) = ray_to_unit(&ray, units) {
        return Some(MapPick::Unit {
            index: i,
            hex: units[i].hex,
        });
    }
    ray_to_hex(&ray, &scene.meshes, &|h| scene.top_y_at(h)).map(MapPick::Terrain)
}
