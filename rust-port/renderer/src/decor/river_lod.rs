//! `render/riverLod.ts` (web `edb8fb56`): merge buckets of river-ribbon
//! geometries into one mesh per layer, LOD hiding, and the per-hex fog index
//! of ribbons and merged ribbon batches.
//!
//! Line references are to `gra/src/render/riverLod.ts`.
//!
//! Differences in form (not behaviour): the web `flushRiverBucket(scene, …)`
//! also does `scene.add(mesh)`; the returned [`RiverBucketMesh`] (its mesh is a
//! one-node [`Scene`]) is what the caller inserts into its scene. `dispose`
//! of source geometries is memory management in WebGL and has no CPU
//! counterpart (dropping the `Arc`s frees them). Hex keys are the web
//! `"q,r"` strings; the `Set` keeps insertion order like a JS `Set`.

use std::collections::HashSet;
use std::sync::Arc;

use crate::geom::merge_geometries;
use crate::scene::{Geometry, Material, Scene, ROOT};

/// `RIVER_LOD_MARKER` (`:33`).
pub const RIVER_LOD_MARKER: &str = "civ-river-lod-merge";

/// An insertion-ordered set of hex keys (JS `Set<string>`).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct KeySet {
    order: Vec<String>,
    seen: HashSet<String>,
}

impl KeySet {
    /// `set.add(k)`.
    pub fn add(&mut self, k: &str) {
        if self.seen.insert(k.to_owned()) {
            self.order.push(k.to_owned());
        }
    }
    /// `set.has(k)`.
    #[must_use]
    pub fn has(&self, k: &str) -> bool {
        self.seen.contains(k)
    }
    /// `set.size`.
    #[must_use]
    pub fn size(&self) -> usize {
        self.order.len()
    }
    /// Iteration in insertion order.
    pub fn iter(&self) -> impl Iterator<Item = &str> {
        self.order.iter().map(String::as_str)
    }
}

/// `RiverGeoBucket` (`:42-51`).
#[derive(Clone, Debug, PartialEq)]
pub struct RiverGeoBucket {
    /// `mat`.
    pub mat: Material,
    /// `geos` (queued segment geometries).
    pub geos: Vec<Arc<Geometry>>,
    /// `hexKeys`.
    pub hex_keys: KeySet,
    /// `renderOrder`.
    pub render_order: i32,
}

/// `RiverBucketMesh` (`:58-67`).
#[derive(Clone, Debug, PartialEq)]
pub struct RiverBucketMesh {
    /// `mesh` (castShadow / receiveShadow `false`), as a scene whose root is
    /// the mesh. `mesh.renderOrder` and `mesh.visible` live on that root
    /// node only (P4.27 r2: no side copies), read through
    /// [`RiverBucketMesh::render_order`] / [`RiverBucketMesh::visible`].
    pub mesh: Scene,
    /// `geometry` (the merged buffer).
    pub geometry: Arc<Geometry>,
    /// `hexKeys`.
    pub hex_keys: KeySet,
    /// `merged` (`> 1` segment).
    pub merged: bool,
}

impl RiverBucketMesh {
    /// `mesh.renderOrder` (the root node of [`Self::mesh`]).
    #[must_use]
    pub fn render_order(&self) -> i32 {
        self.mesh.nodes[ROOT].render_order
    }

    /// `mesh.visible` (the root node of [`Self::mesh`]).
    #[must_use]
    pub fn visible(&self) -> bool {
        self.mesh.nodes[ROOT].visible
    }

    /// `mesh.visible = v`.
    pub fn set_visible(&mut self, v: bool) {
        self.mesh.nodes[ROOT].visible = v;
    }
}

/// `createRiverBucket(mat, renderOrder)` (`:70-75`).
#[must_use]
pub fn create_river_bucket(mat: Material, render_order: i32) -> RiverGeoBucket {
    RiverGeoBucket {
        mat,
        geos: Vec::new(),
        hex_keys: KeySet::default(),
        render_order,
    }
}

/// `queueRiverGeo(bucket, geo, hexKeys)` (`:81-88`).
pub fn queue_river_geo<'a>(
    bucket: &mut RiverGeoBucket,
    geo: Arc<Geometry>,
    hex_keys: impl IntoIterator<Item = &'a str>,
) {
    bucket.geos.push(geo);
    for k in hex_keys {
        bucket.hex_keys.add(k);
    }
}

/// `mergeGeometries(geos)` (`BufferGeometryUtils`, `useGroups = false`) on
/// [`Geometry`]: the mesh part via [`merge_geometries`], the optional
/// `color` attribute concatenated; `None` where three returns `null`
/// (incompatible index / attribute sets, including `color` present on only
/// some inputs).
#[must_use]
pub fn merge_river_geometries(geos: &[Arc<Geometry>]) -> Option<Geometry> {
    let meshes: Vec<&crate::geom::Mesh> = geos.iter().map(|g| &g.mesh).collect();
    let mesh = merge_geometries(&meshes, false).ok()?;
    let has_color = geos.first()?.colors.is_some();
    if geos.iter().any(|g| g.colors.is_some() != has_color) {
        return None;
    }
    let colors = has_color.then(|| {
        geos.iter()
            .flat_map(|g| g.colors.as_deref().unwrap_or(&[]).iter().copied())
            .collect()
    });
    Some(Geometry { mesh, colors })
}

/// `flushRiverBucket(scene, bucket)` (`:100-130`): `None` for an empty bucket
/// or when merging fails; the bucket queue is cleared after a flush.
pub fn flush_river_bucket(bucket: &mut RiverGeoBucket) -> Option<RiverBucketMesh> {
    if bucket.geos.is_empty() {
        return None;
    }
    let merged: Arc<Geometry> = if bucket.geos.len() == 1 {
        Arc::clone(&bucket.geos[0])
    } else {
        Arc::new(merge_river_geometries(&bucket.geos)?)
    };
    let mut mesh = Scene::mesh_root(Arc::clone(&merged), bucket.mat);
    mesh.root_mut().shadows(false, false);
    mesh.root_mut().render_order = bucket.render_order;
    let was_merged = bucket.geos.len() > 1;
    bucket.geos.clear();
    Some(RiverBucketMesh {
        mesh,
        geometry: merged,
        hex_keys: bucket.hex_keys.clone(),
        merged: was_merged,
    })
}

/// `mergeRiverBuckets(scene, buckets)` (`:137-147`).
pub fn merge_river_buckets(buckets: &mut [RiverGeoBucket]) -> Vec<RiverBucketMesh> {
    buckets.iter_mut().filter_map(flush_river_bucket).collect()
}

/// `RIVER_LOD_HIDE_FROM_LEVEL` (`:160`).
pub const RIVER_LOD_HIDE_FROM_LEVEL: f64 = 3.0;

/// `riversVisibleAtLod(level, hideFromLevel)` (`:169-174`).
#[must_use]
pub fn rivers_visible_at_lod(level: f64, hide_from_level: f64) -> bool {
    level < hide_from_level
}

/// `applyRiverLodVisibility(entries, level, hideFromLevel)` (`:194-204`).
pub fn apply_river_lod_visibility(
    entries: &mut [RiverBucketMesh],
    level: f64,
    hide_from_level: f64,
) -> bool {
    let visible = rivers_visible_at_lod(level, hide_from_level);
    if !visible {
        for e in entries.iter_mut() {
            e.set_visible(false);
        }
    }
    visible
}

/// `RIVER_FOG_SIG_OFF` (`:231`).
pub const RIVER_FOG_SIG_OFF: i32 = -1;

/// `(Math.imul(sig, 31) + bit) | 0`.
fn sig_step(sig: i32, add: i32) -> i32 {
    sig.wrapping_mul(31).wrapping_add(add)
}

/// `computeRiverFogSig(pointHex, riverHidden)` (`:234-243`).
#[must_use]
pub fn compute_river_fog_sig(point_hex: &[&str], river_hidden: &dyn Fn(&str) -> bool) -> i32 {
    point_hex
        .iter()
        .fold(0, |sig, k| sig_step(sig, i32::from(river_hidden(k))))
}

fn push_quad(idx: &mut Vec<u32>, b: u32) {
    idx.extend_from_slice(&[b, b + 2, b + 1, b + 1, b + 2, b + 3]);
}

/// `buildRiverRibbonFullIndex(pointCount)` (`:246-253`).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn build_river_ribbon_full_index(point_count: usize) -> Vec<u32> {
    let mut idx = Vec::new();
    for j in 0..point_count.saturating_sub(1) {
        push_quad(&mut idx, 2 * j as u32);
    }
    idx
}

/// `buildRiverRibbonFogIndex(pointHex, riverHidden)` (`:256-267`).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn build_river_ribbon_fog_index(
    point_hex: &[&str],
    river_hidden: &dyn Fn(&str) -> bool,
) -> Vec<u32> {
    let mut idx = Vec::new();
    for j in 0..point_hex.len().saturating_sub(1) {
        if river_hidden(point_hex[j]) || river_hidden(point_hex[j + 1]) {
            continue;
        }
        push_quad(&mut idx, 2 * j as u32);
    }
    idx
}

/// `needsRiverRibbonIndexUpdate(fogActive, lastFogSig, fogSig)` (`:273-280`);
/// `last_fog_sig = None` is `undefined`.
#[must_use]
pub fn needs_river_ribbon_index_update(
    fog_active: bool,
    last_fog_sig: Option<i32>,
    fog_sig: i32,
) -> bool {
    if !fog_active {
        return last_fog_sig != Some(RIVER_FOG_SIG_OFF);
    }
    last_fog_sig != Some(fog_sig)
}

/// `buildMergedRiverFullIndex(segments)` (`:303-314`).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn build_merged_river_full_index(segments: &[Vec<&str>]) -> Vec<u32> {
    let mut idx = Vec::new();
    let mut base = 0u32;
    for seg in segments {
        for j in 0..seg.len().saturating_sub(1) {
            push_quad(&mut idx, base + 2 * j as u32);
        }
        base += 2 * seg.len() as u32;
    }
    idx
}

/// `buildMergedRiverFogIndex(segments, riverHidden)` (`:317-332`).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn build_merged_river_fog_index(
    segments: &[Vec<&str>],
    river_hidden: &dyn Fn(&str) -> bool,
) -> Vec<u32> {
    let mut idx = Vec::new();
    let mut base = 0u32;
    for seg in segments {
        for j in 0..seg.len().saturating_sub(1) {
            if river_hidden(seg[j]) || river_hidden(seg[j + 1]) {
                continue;
            }
            push_quad(&mut idx, base + 2 * j as u32);
        }
        base += 2 * seg.len() as u32;
    }
    idx
}

/// `computeMergedRiverFogSig(segments, riverHidden)` (`:335-348`).
#[must_use]
pub fn compute_merged_river_fog_sig(
    segments: &[Vec<&str>],
    river_hidden: &dyn Fn(&str) -> bool,
) -> i32 {
    let mut sig = 0i32;
    for seg in segments {
        for k in seg {
            sig = sig_step(sig, i32::from(river_hidden(k)));
        }
        sig = sig_step(sig, 2);
    }
    sig
}

/// `mergedRiverVisibleInFog(fogActive, riverRevealKeys, isHidden, hexKeys)`
/// (`:359-377`); `reveal = None` is `null`/`undefined` (an empty set is
/// truthy in JS and takes the reveal branch).
#[must_use]
pub fn merged_river_visible_in_fog<'a>(
    fog_active: bool,
    reveal: Option<&HashSet<String>>,
    is_hidden: &dyn Fn(&str) -> bool,
    hex_keys: impl IntoIterator<Item = &'a str>,
) -> bool {
    if !fog_active {
        return true;
    }
    let river_hidden = |k: &str| is_hidden(k) && !reveal.is_some_and(|r| r.contains(k));
    if reveal.is_some() {
        for hk in hex_keys {
            if !river_hidden(hk) {
                return true;
            }
        }
        return false;
    }
    for hk in hex_keys {
        if river_hidden(hk) {
            return false;
        }
    }
    true
}

/// `applyRiverVisibility(entries, level, anyHidden, isVisible, isExplored,
/// hideFromLevel)` (`:379-405`).
pub fn apply_river_visibility(
    entries: &mut [RiverBucketMesh],
    level: f64,
    any_hidden: bool,
    is_visible: &dyn Fn(&str) -> bool,
    is_explored: &dyn Fn(&str) -> bool,
    hide_from_level: f64,
) {
    let lod_visible = rivers_visible_at_lod(level, hide_from_level);
    for e in entries.iter_mut() {
        if !lod_visible {
            e.set_visible(false);
            continue;
        }
        if !any_hidden {
            e.set_visible(true);
            continue;
        }
        let mut show = e.hex_keys.size() > 0;
        if show {
            for k in e.hex_keys.iter() {
                if !is_visible(k) && !is_explored(k) {
                    show = false;
                    break;
                }
            }
        }
        e.set_visible(show);
    }
}

/// `disposeRiverBuckets(entries)` (`:408-413`): GPU-side release in the web;
/// on the CPU it drops the entries.
pub fn dispose_river_buckets(entries: Vec<RiverBucketMesh>) {
    drop(entries);
}
