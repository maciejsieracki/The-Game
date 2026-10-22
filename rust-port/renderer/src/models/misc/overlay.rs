//! CPU buffers of the map overlays (`rangeOverlay.ts`,
//! `tradeRoutesOverlay.ts`): what the web puts into `THREE.Group`s of
//! `InstancedMesh` / `Mesh` / `LineSegments` / `Line`, as plain data —
//! geometry ([`crate::geom::Mesh`], `Float32` like the web attributes),
//! instance matrices (`Float32`, like `instanceMatrix`), material parameters
//! and draw-order flags. No GPU upload.

use std::collections::{HashMap, HashSet};

use super::model::MiscMaterial;
use crate::core::map_style::{terrain_surface_top_y, GAME_MAP_RENDER_STYLE};
use crate::geom;
use crate::pick::terrain::Terrain;

/// Axial hex key (`"q,r"` in the web).
pub type HexKey = (i32, i32);

/// The part of `GameMap` the overlays read: `hexes[key].terenBazowy`
/// (`hex.coords` is assumed equal to the key, as `generator.ts` builds it)
/// and `seed`.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct OverlayMap {
    /// Existing hexes and their base terrain.
    pub hexes: HashMap<HexKey, Terrain>,
    /// `map.seed` (`None` = `undefined`, read as `0` by the relief drape).
    pub seed: Option<f64>,
}

impl OverlayMap {
    /// `map.hexes[key]?.terenBazowy`.
    #[must_use]
    pub fn terrain(&self, k: HexKey) -> Option<Terrain> {
        self.hexes.get(&k).copied()
    }

    /// `hexTopY(map, key, yOffset)` (`rangeOverlay.ts:37-41`,
    /// `tradeRoutesOverlay.ts:37-41`): terrain top of the hex (missing hex →
    /// `Laka`) in the game map style, plus `y_offset`.
    #[must_use]
    pub fn hex_top_y(&self, k: HexKey, y_offset: f64) -> f64 {
        let t = self.terrain(k).unwrap_or(Terrain::Laka);
        terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, y_offset)
    }
}

/// A `Set<string>` of hex keys: insertion order + membership.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct HexKeySet {
    order: Vec<HexKey>,
    set: HashSet<HexKey>,
}

impl HexKeySet {
    /// `new Set(keys)` (duplicates keep the first position).
    #[must_use]
    pub fn new(keys: &[HexKey]) -> Self {
        let mut s = Self::default();
        for &k in keys {
            if s.set.insert(k) {
                s.order.push(k);
            }
        }
        s
    }

    /// `set.has(key)`.
    #[must_use]
    pub fn has(&self, k: HexKey) -> bool {
        self.set.contains(&k)
    }

    /// `set.size`.
    #[must_use]
    pub fn len(&self) -> usize {
        self.order.len()
    }

    /// `set.size === 0`.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.order.is_empty()
    }

    /// Iteration order.
    pub fn iter(&self) -> impl Iterator<Item = HexKey> + '_ {
        self.order.iter().copied()
    }
}

/// `Object3D` class of an overlay object.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OverlayKind {
    /// `THREE.InstancedMesh`.
    InstancedMesh,
    /// `THREE.Mesh`.
    Mesh,
    /// `THREE.LineSegments`.
    LineSegments,
    /// `THREE.Line`.
    Line,
}

impl OverlayKind {
    /// Class name.
    #[must_use]
    pub const fn three_type(self) -> &'static str {
        match self {
            Self::InstancedMesh => "InstancedMesh",
            Self::Mesh => "Mesh",
            Self::LineSegments => "LineSegments",
            Self::Line => "Line",
        }
    }
}

/// `mesh.userData` of the relief drape (`rangeOverlay.ts:430-434`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DrapeInfo {
    /// `hexKeys`: the draped hexes, in order.
    pub hex_keys: Vec<HexKey>,
    /// `triangles`.
    pub triangles: u32,
    /// `subdivisions`.
    pub subdivisions: u32,
}

/// One child of an overlay group.
#[derive(Debug, Clone, PartialEq)]
pub struct OverlayObject {
    /// Class.
    pub kind: OverlayKind,
    /// `name`.
    pub name: String,
    /// `renderOrder`.
    pub render_order: i32,
    /// `frustumCulled`.
    pub frustum_culled: bool,
    /// Material parameters.
    pub material: MiscMaterial,
    /// Geometry (CPU, `Float32` attributes).
    pub geometry: geom::Mesh,
    /// `instanceMatrix` (column-major `Float32`), one per instance; empty
    /// unless [`OverlayKind::InstancedMesh`].
    pub instances: Vec<[f32; 16]>,
    /// Relief-drape `userData`, if any.
    pub drape: Option<DrapeInfo>,
}

impl OverlayObject {
    /// An object with the Three.js defaults (`renderOrder = 0`,
    /// `frustumCulled = true`, unnamed).
    #[must_use]
    pub fn new(kind: OverlayKind, material: MiscMaterial, geometry: geom::Mesh) -> Self {
        Self {
            kind,
            name: String::new(),
            render_order: 0,
            frustum_culled: true,
            material,
            geometry,
            instances: Vec::new(),
            drape: None,
        }
    }
}

/// An overlay `THREE.Group`.
#[derive(Debug, Clone, PartialEq)]
pub struct OverlayGroup {
    /// `group.name`.
    pub name: String,
    /// `group.children`, in order.
    pub objects: Vec<OverlayObject>,
}

/// `new THREE.BufferGeometry()` with a `Float32BufferAttribute` position
/// (and optionally an index), no normals / uvs.
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn buffer_geometry(positions: &[f64], indices: Option<Vec<u32>>) -> geom::Mesh {
    geom::Mesh {
        positions: positions.iter().map(|&v| v as f32).collect(),
        normals: Vec::new(),
        uvs: Vec::new(),
        indices,
        groups: Vec::new(),
    }
}

/// `Number.prototype.toFixed(digits)`. The single implementation is
/// [`crate::core::jsnum::js_to_fixed`] (P4.24, tested against V8 on
/// ≥ 20 000 values); re-exported here so the P4.22 public path stays valid.
pub use crate::core::jsnum::js_to_fixed;

#[cfg(test)]
mod tests {
    use super::js_to_fixed;

    /// Expected strings printed by node v22.22.0:
    /// `[0.015625,-0.015625,0.000005,-4.44e-16,-0,1.5,0.123455,2.5e-5].map(x=>x.toFixed(5))`
    /// → `0.01563 -0.01563 0.00001 -0.00000 0.00000 1.50000 0.12345 0.00003`
    /// (`0.000005` and `0.123455` are not exact ties in binary).
    #[test]
    fn to_fixed5_matches_node() {
        let cases = [
            (0.015_625, "0.01563"),
            (-0.015_625, "-0.01563"),
            (0.000_005, "0.00001"),
            (-4.44e-16, "-0.00000"),
            (-0.0, "0.00000"),
            (1.5, "1.50000"),
            (0.123_455, "0.12345"),
            (2.5e-5, "0.00003"),
        ];
        for (x, want) in cases {
            assert_eq!(js_to_fixed(x, 5), want, "{x}");
        }
        assert_eq!(js_to_fixed(0.03125, 4), "0.0313");
        assert_eq!(js_to_fixed(-0.03125, 4), "-0.0313");
    }

    /// `js_to_fixed(x, 3)` agrees with the P4.12 core helper (since P4.24
    /// both are the same `core::jsnum` function; kept as a regression guard).
    #[test]
    fn to_fixed_d3_equals_core_to_fixed3() {
        use crate::core::jsnum::js_to_fixed3;
        let mut cases = vec![
            0.0, -0.0, 0.0625, -0.0625, 0.1875, 1.0005, -1.0005, 2.5e-4, -4.44e-16, 123.456_5,
        ];
        // Step 1/256 is exact in binary and hits every exact 3-decimal tie (odd/16).
        for i in -1792_i32..=1792 {
            cases.push(f64::from(i) / 256.0);
        }
        for x in cases {
            assert_eq!(js_to_fixed(x, 3), js_to_fixed3(x), "{x}");
        }
    }
}
