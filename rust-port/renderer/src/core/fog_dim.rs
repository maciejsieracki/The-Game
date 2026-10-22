//! `render/fogDim.ts` (web `edb8fb56`, 44 LOC): fog-of-war dimming of 3D
//! decor groups (explored hexes are drawn at `FOG_EXPLORED_BRIGHTNESS`).
//!
//! `FOG_EXPLORED_BRIGHTNESS` already exists ([`crate::terrain`], P4.11) and is
//! re-exported, not redefined. The prism part of the fog (`setFog`) is
//! `crate::terrain::TerrainScene::set_fog` (P4.11); this module is the decor
//! part that the model topics call on their groups.

use std::collections::HashSet;
use std::hash::{BuildHasher, Hash};

use super::scene::{MaterialKind, NodeKind, SceneNode};
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
/// mesh of the tree (pre-order, the root included), every material of a
/// dimmed class gets `color = fogBaseColor × brightness`, where
/// `fogBaseColor` is the colour captured on the first call. `brightness <= 0`
/// returns without touching anything (hidden hexes are not drawn at all);
/// `NaN` is *not* `<= 0` and propagates, as in the web.
///
/// Difference in representation (not in result): three materials may be
/// shared by several meshes, here every mesh owns its copy. The web result is
/// the same either way because the base colour is captured once and the
/// operation is `base × brightness` (idempotent per call).
pub fn apply_fog_dim(root: &mut SceneNode, brightness: f64) {
    if brightness <= 0.0 {
        return;
    }
    root.traverse_mut(&mut |node| {
        let NodeKind::Mesh { materials, .. } = &mut node.kind else {
            return;
        };
        for m in materials.iter_mut() {
            if !is_fog_dimmed_material(m.kind) {
                continue;
            }
            let Some(color) = m.color else { continue };
            let base = *m.fog_base_color.get_or_insert(color);
            m.color = Some(base.scale(brightness));
        }
    });
}
