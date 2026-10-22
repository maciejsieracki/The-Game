//! Port of `gra/src/render/wonderRenderer.ts` (pin `edb8fb56`), CPU part:
//! which model each placed wonder gets, where it stands on its hex, its
//! scale, model reuse (`visualKey`) and fog visibility. The `THREE.Scene`
//! is replaced by an ordered list of [`RenderedWonder`]s (same order as the
//! web `scene.children` / `this.models` insertion order); material
//! `dispose()` has no CPU counterpart.

use std::collections::{HashMap, HashSet};

use super::builders::{build_wonder_model, WonderModelOptions};
use super::model::WonderModel;
use crate::geom::{Mat4, Quat, Vec3};
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;

/// `OWNER_COLORS` (`wonderRenderer.ts:21-24`).
pub const OWNER_COLORS: [u32; 8] = [
    0x00ff_d54a,
    0x00e5_3935,
    0x0043_a047,
    0x001e_88e5,
    0x00fb_8c00,
    0x008e_24aa,
    0x0000_acc1,
    0x00f0_6292,
];

/// `WONDER_LIFT = 0.004 * HEX_R` (`wonderRenderer.ts:26`).
pub const WONDER_LIFT: f64 = 0.004 * HEX_R;
/// `WONDER_SCALE` (`wonderRenderer.ts:27`).
pub const WONDER_SCALE: f64 = 1.15;

/// `PlacedWonder` (`wonderRenderer.ts:12-19`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlacedWonder {
    /// Wonder id (`wonders.json`).
    pub wonder_id: String,
    /// Axial `q`.
    pub q: i32,
    /// Axial `r`.
    pub r: i32,
    /// Owner id.
    pub owner_id: i32,
    /// Ruin after an "absolute" (`ruin ?? false`).
    pub ruin: bool,
}

/// Default owner colour `OWNER_COLORS[ownerId % 8]` (`wonderRenderer.ts:51-53`).
///
/// JavaScript `%` keeps the dividend's sign: a negative owner id with a
/// non-zero remainder reads `OWNER_COLORS[-k]`, which is `undefined`, so the
/// model gets no banner (`None`). `-8 % 8` is `-0`, which indexes element 0.
#[must_use]
pub fn default_owner_color(owner_id: i32) -> Option<u32> {
    let i = owner_id % 8;
    usize::try_from(i).ok().map(|i| OWNER_COLORS[i])
}

/// `WonderRenderOptions` (`wonderRenderer.ts:55-59`).
#[derive(Default, Clone, Copy)]
pub struct WonderRenderOptions<'a> {
    /// `isVisible(w)`; `None` = visible.
    pub is_visible: Option<&'a dyn Fn(&PlacedWonder) -> bool>,
    /// `ownerColorFn(ownerId)`; `None` = [`default_owner_color`].
    pub owner_color_fn: Option<&'a dyn Fn(i32) -> u32>,
}

/// One wonder group on the map (`THREE.Group` added to the scene).
#[derive(Debug, Clone, PartialEq)]
pub struct RenderedWonder {
    /// `userData.wonderKey` = `` `${wonderId}@${q},${r}` ``.
    pub key: String,
    /// `userData.visualKey` = `` `${wonderId}|${ownerId}|${ruin ? 1 : 0}` ``.
    pub visual_key: String,
    /// The built model (its root transform is replaced by `position`/`scale`).
    pub model: WonderModel,
    /// `group.position`.
    pub position: Vec3,
    /// `group.scale` (`setScalar(WONDER_SCALE)`).
    pub scale: Vec3,
    /// `group.visible`.
    pub visible: bool,
}

impl RenderedWonder {
    /// `group.matrixWorld` under the scene (`scene.matrixWorld × group.matrix`).
    #[must_use]
    pub fn world_matrix(&self) -> Mat4 {
        Mat4::IDENTITY.mul(&Mat4::compose(self.position, Quat::default(), self.scale))
    }
}

/// `WonderRenderer` (`wonderRenderer.ts:61-143`).
#[derive(Debug, Clone, Default)]
pub struct WonderRenderer {
    hex_grid: HashMap<HexCoord, Terrain>,
    models: Vec<RenderedWonder>,
}

impl WonderRenderer {
    /// `new WonderRenderer(scene, map)`: `hexGrid` from `map.hexes`.
    ///
    /// ZAŁOŻENIE: the web keys `map.hexes` by `` `${q},${r}` `` and looks up
    /// `` `${w.q},${w.r}` ``; here the key is the [`HexCoord`] itself.
    #[must_use]
    pub fn new(hexes: impl IntoIterator<Item = (HexCoord, Terrain)>) -> Self {
        Self {
            hex_grid: hexes.into_iter().collect(),
            models: Vec::new(),
        }
    }

    /// The wonder groups in scene order.
    #[must_use]
    pub fn wonders(&self) -> &[RenderedWonder] {
        &self.models
    }

    /// `terrainTopY(hex)` (`wonderRenderer.ts:45-49`) in the `roblox` style.
    fn top_y(&self, q: i32, r: i32) -> f64 {
        self.hex_grid
            .get(&HexCoord::new(q, r))
            .map_or(0.0, |t| t.top_y())
    }

    fn find(&self, key: &str) -> Option<usize> {
        self.models.iter().position(|m| m.key == key)
    }

    /// `sync(placed, options)` (`wonderRenderer.ts:71-112`).
    pub fn sync(&mut self, placed: &[PlacedWonder], options: WonderRenderOptions<'_>) {
        let mut present: HashSet<String> = HashSet::new();
        for w in placed {
            let key = format!("{}@{},{}", w.wonder_id, w.q, w.r);
            present.insert(key.clone());
            let visible = options.is_visible.is_none_or(|f| f(w));
            let y_base = self.top_y(w.q, w.r) + WONDER_LIFT;
            let visual_key = format!(
                "{}|{}|{}",
                w.wonder_id,
                w.owner_id,
                if w.ruin { 1 } else { 0 }
            );

            if let Some(i) = self.find(&key) {
                let grp = &mut self.models[i];
                grp.visible = visible;
                if grp.visual_key == visual_key {
                    let (x, z) = axial_to_world(HexCoord::new(w.q, w.r), HEX_R);
                    grp.position = Vec3::new(x, y_base, z);
                    continue;
                }
                self.models.remove(i);
            }

            let owner_color = match options.owner_color_fn {
                Some(f) => Some(f(w.owner_id)),
                None => default_owner_color(w.owner_id),
            };
            let model = build_wonder_model(
                &w.wonder_id,
                WonderModelOptions {
                    ruin: w.ruin,
                    owner_color,
                },
            );
            let (x, z) = axial_to_world(HexCoord::new(w.q, w.r), HEX_R);
            self.models.push(RenderedWonder {
                key,
                visual_key,
                model,
                position: Vec3::new(x, y_base, z),
                scale: Vec3::new(WONDER_SCALE, WONDER_SCALE, WONDER_SCALE),
                visible,
            });
        }
        self.models.retain(|m| present.contains(&m.key));
    }

    /// `applyFogVisibility(vis, fogOn)` (`wonderRenderer.ts:114-123`): `vis`
    /// holds `` `${q},${r}` `` keys; the hex part of a wonder key is the text
    /// after its first `@` (`key.split('@')[1] ?? ''`).
    pub fn apply_fog_visibility(&mut self, vis: &HashSet<String>, fog_on: bool) {
        for grp in &mut self.models {
            if !fog_on {
                grp.visible = true;
                continue;
            }
            let hex_key = grp.key.split('@').nth(1).unwrap_or("");
            grp.visible = vis.contains(hex_key);
        }
    }

    /// `dispose()` (`wonderRenderer.ts:125-127`).
    pub fn dispose(&mut self) {
        self.models.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_owner_color_follows_js_remainder() {
        assert_eq!(default_owner_color(0), Some(0x00ff_d54a));
        assert_eq!(default_owner_color(9), Some(0x00e5_3935));
        assert_eq!(default_owner_color(-1), None);
        assert_eq!(default_owner_color(-8), Some(0x00ff_d54a));
    }
}
