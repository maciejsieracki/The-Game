//! City badges ("stat chips") on the world map: the badge bookkeeping of
//! `CityRenderer` (`gra/src/render/cities.ts` @ `07d2fbd72`, `:N` = line `N`
//! of that file) as data.
//!
//! Web state → here:
//! - `statSprites` + `statSpriteKeys` (`:452-453`, two `Map`s keyed by
//!   `city.id`, always set and deleted together) → [`CityStatChips::chips`],
//!   one [`StatChip`] per city in the `Map` insertion order (a `delete`
//!   followed by `set` moves the city to the end, exactly like the web);
//! - `statTexCache` (`:454`, `Map` key → `CanvasTexture`) →
//!   [`CityStatChips::textures`]: the key, the input that painted the
//!   texture (the first one for that key, `makeCityMapBadgeSprite`,
//!   `cityMapStatChip.ts:1071-1080`) and the canvas size the sprite scale is
//!   computed from (`img.width / img.height`, `cityMapStatChip.ts:1118-1121`).
//!   The pixels are painted by the caller with
//!   [`crate::cities::overlay::stat_chip::render_city_map_badge`] from that
//!   input (texture upload is RR-T8d / [`crate::raster::atlas::cache`]);
//! - `badgeLodLevel` / `badgeLodPurgePending` (`:462`, `:470`) →
//!   [`CityStatChips::lod_level`] and the pending flag.
//!
//! The web sprite is a child of the city group (`parent.add(sprite)`,
//! `:957`), so it is drawn only while the group is visible. Here the chip is
//! keyed by city id and [`StatChip::group_visual_key`] remembers which group
//! (`RenderedCity::visual_key`) it hangs on: when `CityRenderer.sync`
//! rebuilds the group (other visual key) the web removes the chip first
//! (`_removeStatChip`, `:552`) and the following `_syncStatChip` (`:587`)
//! creates a new one at the end of the `Map`.
//!
//! Visibility inputs (`_cityRenderOpts`, `main.ts:2939-3005`):
//! - `isVisible(city)` (`main.ts:2973-2976`): the city panel view
//!   (`cityPanelViewCityId`, UI state, gap L4) or else the fog part
//!   `cityFogVisible` = DTO `cities[].fog_visible` (producer);
//! - `hideStatChips: isCityPanelOpen()` (`main.ts:2977`, UI state);
//! - `hoverStatChipCityId: statChipHoverCityId` (`main.ts:2938`, `:2987`, UI
//!   state) → `hoverExpanded` (`:889`);
//! - `grp.visible` of the city group (`syncStatChips`, `:652`), which
//!   `applyFogVisibility` also sets ([`CityRenderer::apply_fog_visibility`]).
//!
//! The UI part is the one map UI state [`MapUiState`] (`view/overlays.rs`,
//! gap L4 of the document §5, contract D-CMD-12: selection and switches are
//! UI, not engine DTO); nothing is guessed.

use std::collections::HashSet;

use civ_view_model as vm;

use crate::cities::overlay::stat_chip::{
    badge_layout, city_map_badge_key, city_map_badge_sprite, CityMapBadgeInput,
};
use crate::cities::overlay::SpriteNode;
use crate::core::zoom_lod::{city_badge_lod_level_for_dist, CityBadgeLodLevel};
use crate::models::cities::renderer::{CityRenderer, RenderedCity};
use crate::raster::atlas::keys::city_badge_lod_suffix;
use crate::raster::atlas::scale::badge_canvas_px;
use crate::raster::RasterError;
use crate::view::{city_badge_input, city_id_string, MapUiState};

/// `options.isVisible(city)` of `_cityRenderOpts` (`main.ts:2973-2976`):
/// `cityPanelViewCityId !== null ? city.id === cityPanelViewCityId :
/// cityFogVisible(city) ?? true`, the fog part being the producer's
/// `fog_visible`.
#[must_use]
pub fn stat_chip_city_visible(city: &vm::CityViewDto, ui: &MapUiState) -> bool {
    match ui.city_panel_view_city_id {
        Some(panel) => city.id == panel,
        None => city.fog_visible,
    }
}

/// A badge failed to lay out (canvas error of the text measurement; never
/// for a reachable badge).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StatChipSyncError {
    /// [`badge_layout`] failed.
    Raster(RasterError),
}

impl From<RasterError> for StatChipSyncError {
    fn from(e: RasterError) -> Self {
        Self::Raster(e)
    }
}

impl std::fmt::Display for StatChipSyncError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Raster(e) => write!(f, "city badge layout failed: {e:?}"),
        }
    }
}

impl std::error::Error for StatChipSyncError {}

/// One live badge sprite (`statSprites.get(id)` + `statSpriteKeys.get(id)`).
#[derive(Debug, Clone, PartialEq)]
pub struct StatChip {
    /// `city.id` (`sprite.userData.cityId`, `:956`).
    pub city_id: String,
    /// `cityMapBadgeKey(badge)` (`:947`) = the texture of the sprite.
    pub key: String,
    /// The badge input this sprite was built from (`_buildBadgeInput`).
    pub input: CityMapBadgeInput,
    /// The sprite (local coordinates of the city group).
    pub sprite: SpriteNode,
    /// `RenderedCity::visual_key` of the city group the sprite hangs on.
    pub group_visual_key: String,
}

/// One `statTexCache` entry.
#[derive(Debug, Clone, PartialEq)]
pub struct BadgeTextureEntry {
    /// The cache key (`cityMapBadgeKey`).
    pub key: String,
    /// The input that painted the texture (first sprite of that key).
    pub input: CityMapBadgeInput,
    /// `canvas.width` (device px, [`badge_canvas_px`]).
    pub width: u32,
    /// `canvas.height`.
    pub height: u32,
}

/// The badge bookkeeping of one `CityRenderer`.
#[derive(Debug, Clone, PartialEq)]
pub struct CityStatChips {
    chips: Vec<StatChip>,
    textures: Vec<BadgeTextureEntry>,
    lod_level: CityBadgeLodLevel,
    lod_purge_pending: bool,
    device_pixel_ratio: Option<f64>,
}

impl CityStatChips {
    /// No badges, LOD 0 (`badgeLodLevel = 0`, `:462`), nothing pending.
    /// `device_pixel_ratio` is `window.devicePixelRatio` (`None` = no
    /// `window`), as in [`badge_canvas_px`].
    #[must_use]
    pub fn new(device_pixel_ratio: Option<f64>) -> Self {
        Self {
            chips: Vec::new(),
            textures: Vec::new(),
            lod_level: CityBadgeLodLevel::L0,
            lod_purge_pending: false,
            device_pixel_ratio,
        }
    }

    /// The live badges in `statSprites` order.
    #[must_use]
    pub fn chips(&self) -> &[StatChip] {
        &self.chips
    }

    /// The badge of a city id (`None` = no sprite).
    #[must_use]
    pub fn chip(&self, city_id: &str) -> Option<&StatChip> {
        self.chips.iter().find(|c| c.city_id == city_id)
    }

    /// The texture cache in `statTexCache` order.
    #[must_use]
    pub fn textures(&self) -> &[BadgeTextureEntry] {
        &self.textures
    }

    /// `getBadgeZoomLod()` (`:684-686`).
    #[must_use]
    pub fn lod_level(&self) -> CityBadgeLodLevel {
        self.lod_level
    }

    /// `true` between a LOD change and the next [`Self::sync_stat_chips`].
    #[must_use]
    pub fn lod_purge_pending(&self) -> bool {
        self.lod_purge_pending
    }

    /// `setBadgeZoomLod(dist)` (`:676-682`): `true` only when the level
    /// changes; the caller then calls [`Self::sync_stat_chips`]
    /// (`main.ts:44302-44303`).
    pub fn set_badge_zoom_lod(&mut self, dist: f64) -> bool {
        let level = city_badge_lod_level_for_dist(dist);
        if level == self.lod_level {
            return false;
        }
        self.lod_level = level;
        self.lod_purge_pending = true;
        true
    }

    /// `syncStatChips(cities, options)` (`:644-660`), called after a unit
    /// sync (`main.ts:14563`), on badge hover (`:32265`, `:32269`, `:32348`)
    /// and on a LOD change (`:44303`).
    ///
    /// For each city of `cities` in order: no group in `models` → skipped;
    /// else the badge is shown iff `isVisible(city) && grp.visible &&
    /// !hideStatChips`. Then, if the LOD changed, every cached texture of
    /// another LOD is dropped (`disposeCityMapBadgeTexturesForOtherLod`).
    ///
    /// # Errors
    /// [`StatChipSyncError::Raster`] when a new badge cannot be laid out.
    pub fn sync_stat_chips(
        &mut self,
        cities: &[vm::CityViewDto],
        models: &CityRenderer,
        ui: &MapUiState,
    ) -> Result<(), StatChipSyncError> {
        for city in cities {
            let id = city_id_string(city.id);
            let Some(grp) = models.city(&id) else {
                continue;
            };
            let visible = stat_chip_city_visible(city, ui);
            let show = visible && grp.visible() && !ui.hide_stat_chips();
            self.sync_stat_chip(city, id, grp, show, ui)?;
        }
        if self.lod_purge_pending {
            self.lod_purge_pending = false;
            let keep = city_badge_lod_suffix(Some(self.lod_f64()));
            self.textures.retain(|t| t.key.ends_with(&keep));
        }
        Ok(())
    }

    /// The badge part of `sync(cities, options)` (`:502-611`); call it right
    /// after [`CityRenderer::sync`] (`view::CityInputs::sync`) with the same
    /// cities.
    ///
    /// For each city in order whose group exists: a group rebuilt since the
    /// badge was made loses the badge first (`:552`); then the badge is shown
    /// iff `isVisible(city) && !hideStatChips` (`:542-547`, `:587-592`).
    /// Afterwards the badges of cities without a group are removed (`:597-606`)
    /// and the textures no live badge uses are dropped
    /// (`pruneUnusedStatChipTextures`, `:610`).
    ///
    /// # Errors
    /// [`StatChipSyncError::Raster`] when a new badge cannot be laid out.
    pub fn sync_after_city_models(
        &mut self,
        cities: &[vm::CityViewDto],
        models: &CityRenderer,
        ui: &MapUiState,
    ) -> Result<(), StatChipSyncError> {
        for city in cities {
            let id = city_id_string(city.id);
            let Some(grp) = models.city(&id) else {
                continue;
            };
            let visible = stat_chip_city_visible(city, ui);
            let show = visible && !ui.hide_stat_chips();
            self.sync_stat_chip(city, id, grp, show, ui)?;
        }
        self.chips.retain(|c| models.city(&c.city_id).is_some());
        self.prune_unused_stat_chip_textures();
        Ok(())
    }

    /// `pruneUnusedStatChipTextures()` (`:625-636`): drops every cached
    /// texture whose key is not the key of a live badge; returns how many.
    pub fn prune_unused_stat_chip_textures(&mut self) -> usize {
        if self.textures.is_empty() {
            return 0;
        }
        let live: HashSet<&str> = self.chips.iter().map(|c| c.key.as_str()).collect();
        let before = self.textures.len();
        self.textures.retain(|t| live.contains(t.key.as_str()));
        before - self.textures.len()
    }

    /// The badge part of `dispose()` (`:778-780`): no sprite, no texture.
    /// The LOD level stays (the web does not reset `badgeLodLevel`).
    pub fn dispose(&mut self) {
        self.chips.clear();
        self.textures.clear();
    }

    fn lod_f64(&self) -> f64 {
        f64::from(self.lod_level.as_u8())
    }

    fn remove_stat_chip(&mut self, city_id: &str) {
        if let Some(i) = self.chips.iter().position(|c| c.city_id == city_id) {
            self.chips.remove(i);
        }
    }

    /// `_syncStatChip(city, parent, show, options)` (`:933-960`).
    fn sync_stat_chip(
        &mut self,
        city: &vm::CityViewDto,
        city_id: String,
        grp: &RenderedCity,
        show: bool,
        ui: &MapUiState,
    ) -> Result<(), StatChipSyncError> {
        // The sprite was a child of a group `CityRenderer.sync` replaced:
        // it left the scene with that group (`_removeStatChip`, `:552`).
        if self
            .chip(&city_id)
            .is_some_and(|c| c.group_visual_key != grp.visual_key)
        {
            self.remove_stat_chip(&city_id);
        }
        if !show {
            self.remove_stat_chip(&city_id);
            return Ok(());
        }
        // `hoverExpanded = options.hoverStatChipCityId === city.id` (`:889`),
        // `lodLevel: this.badgeLodLevel` (`:929`).
        let hover = ui.hover_stat_chip_city_id == Some(city.id);
        let badge = city_badge_input(&city.badge, hover, Some(self.lod_f64()));
        let key = city_map_badge_key(&badge);
        if let Some(c) = self.chips.iter_mut().find(|c| c.city_id == city_id) {
            if c.key == key {
                c.sprite.visible = true;
                return Ok(());
            }
        }
        self.remove_stat_chip(&city_id);
        let (width, height) = self.texture_size(&key, &badge)?;
        let sprite = city_map_badge_sprite(&key, width, height);
        self.chips.push(StatChip {
            city_id,
            key,
            input: badge,
            sprite,
            group_visual_key: grp.visual_key.clone(),
        });
        Ok(())
    }

    /// `texCache.get(key)` or a new texture (`cityMapStatChip.ts:1071-1080`):
    /// the canvas size of the cached texture, else of `badge` painted now.
    fn texture_size(
        &mut self,
        key: &str,
        badge: &CityMapBadgeInput,
    ) -> Result<(u32, u32), StatChipSyncError> {
        if let Some(t) = self.textures.iter().find(|t| t.key == key) {
            return Ok((t.width, t.height));
        }
        let l = badge_layout(badge)?;
        let px = badge_canvas_px(l.width, l.height, self.device_pixel_ratio, badge.lod_level);
        self.textures.push(BadgeTextureEntry {
            key: key.to_owned(),
            input: badge.clone(),
            width: px.width,
            height: px.height,
        });
        Ok((px.width, px.height))
    }
}
