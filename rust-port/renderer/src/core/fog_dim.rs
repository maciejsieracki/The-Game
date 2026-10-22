//! `render/fogDim.ts` (web `edb8fb56`, 44 LOC): fog-of-war dimming of 3D
//! decor groups (explored hexes are drawn at `FOG_EXPLORED_BRIGHTNESS`).
//!
//! `FOG_EXPLORED_BRIGHTNESS` already exists ([`crate::terrain`], P4.11) and is
//! re-exported, not redefined. The prism part of the fog (`setFog`) is
//! `crate::terrain::TerrainScene::set_fog` (P4.11); this module is the decor
//! part that the model topics call on their groups.

use std::collections::HashSet;
use std::hash::{BuildHasher, Hash};

use crate::scene::{MaterialKind, NodeId, NodeKind, Scene, ROOT};
pub use crate::terrain::FOG_EXPLORED_BRIGHTNESS;

/// `fogBrightnessForHex(hexKey, visible, explored, fogActive)`
/// (`fogDim.ts:16-26`): 1 without fog or for a visible hex,
/// `FOG_EXPLORED_BRIGHTNESS` for an explored one, 0 otherwise. Generic over
/// the key type (the web uses `` `${q},${r}` `` strings, see
/// [`super::hexutil::hex_key`]).
#[must_use]
pub fn fog_brightness_for_hex<K: Eq + Hash, S: BuildHasher>(
    hex_key: &K,
    visible: &HashSet<K, S>,
    explored: &HashSet<K, S>,
    fog_active: bool,
) -> f64 {
    if !fog_active {
        return 1.0;
    }
    if visible.contains(hex_key) {
        return 1.0;
    }
    if explored.contains(hex_key) {
        return FOG_EXPLORED_BRIGHTNESS;
    }
    0.0
}

/// `DIM_MAT_TYPES.has(mat.constructor)` (`fogDim.ts:9-14`): exact classes
/// only.
#[must_use]
pub fn is_fog_dimmed_material(kind: MaterialKind) -> bool {
    matches!(
        kind,
        MaterialKind::Lambert | MaterialKind::Standard | MaterialKind::Basic | MaterialKind::Phong
    )
}

/// `applyFogDimToObject3D(root, brightness)` (`fogDim.ts:29-44`): for every
/// mesh of the tree (pre-order from the scene root, the root included), every
/// material of a dimmed class gets `color = fogBaseColor × brightness`, where
/// `fogBaseColor` is the colour captured on the first call. `brightness <= 0`
/// returns without touching anything (hidden hexes are not drawn at all);
/// `NaN` is *not* `<= 0` and propagates, as in the web.
///
/// Materials are shared by slot like three material objects; a slot visited
/// twice gets the same result because the base colour is captured once and
/// the operation is `base × brightness` (idempotent per call).
pub fn apply_fog_dim(root: &mut Scene, brightness: f64) {
    apply_fog_dim_from(root, ROOT, brightness);
}

/// [`apply_fog_dim`] on the sub-tree of `node`.
pub fn apply_fog_dim_from(scene: &mut Scene, node: NodeId, brightness: f64) {
    if brightness <= 0.0 {
        return;
    }
    for id in scene.traverse_from(node) {
        let NodeKind::Mesh(md) = &scene.nodes[id].kind else {
            continue;
        };
        for &slot in &md.materials {
            let m = &mut scene.materials[slot];
            if !is_fog_dimmed_material(m.kind) {
                continue;
            }
            let Some(color) = m.color else { continue };
            let base = *m.fog_base_color.get_or_insert(color);
            m.color = Some(base.scale(brightness));
        }
    }
}
