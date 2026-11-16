//! R4 (`R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES`,
//! `P4-1G-ADAPTER-ROZPOZNANIE.md` §4): the per-hex integrator of
//! improvement meshes, resource (deposit) overlays and neutral villages,
//! fed by the DTO fields that had no renderer consumer
//! (`HexDynDto.ulepszenia`, `improvement_key`, `road_mask`, `zloze`,
//! `village_present`, `view-model/src/map.rs`).
//!
//! Pin `07d2fbd72`, `gra/src/main.ts`:
//! - `spawnImprovementMesh(hexKey)` (`:17043-17102`) →
//!   [`MapObjectsLayer::spawn_improvement_mesh`]: merged layers
//!   (`mergedImprovementLayers`, `:3126-3137`), sectored model with the road
//!   mask (`buildImprovementVisual`, `:3162-3173`), hill + terraces,
//!   placement (`improvementMeshPlacement`, `:16867-16875`), then
//!   `syncResourceOverlayAtHex(hexKey)` (`:17101`);
//! - `syncResourceOverlayAtHex` (`:3199-3231`) / `rebuildResourceOverlays`
//!   (`:3233-3264`) → [`MapObjectsLayer::sync_resource_overlay_at_hex`] /
//!   [`MapObjectsLayer::rebuild_resource_overlays`], placement
//!   `compactDepositAtEdge` (`:3058-3094`);
//! - `syncLivestockAndPlacedMeshes` (`:16234-16251`) →
//!   [`MapObjectsLayer::sync_livestock_and_placed_meshes`];
//! - `syncVillageMeshes` (`:3360-3399`) → [`MapObjectsLayer::sync_village_meshes`];
//! - fog: `refreshFog` (`:13475-13520`) calls, in this order,
//!   `syncCampMeshes()`, `syncVillageMeshes()` (`:13488-13489`), then
//!   `syncResourceOverlayFog`, `syncImprovementMeshFog`,
//!   `syncSettlementMeshFog` (`:13495-13497`, `:13507-13509` without fog) →
//!   [`MapObjectsLayer::apply_fog`].
//!
//! **D-DTO-1 = A**: the renderer reads the DTO values as they are and holds
//! no game rule. What the pin reads on these paths that the DTO does not
//! carry is taken from [`ExternalInputs`] (no `Default`) or left out, never
//! derived here:
//! - G1 `visibleZloze(hex, overlayDepositEra)` (deposit era, `wegiel`):
//!   [`ExternalInputs::zloze_hidden`]; the DTO `zloze` is the raw
//!   `HexExt.zloze` (`engine/src/domain/map_view.rs`, `build_hex_dyn`);
//! - G2 `hexSuppressesResourceOverlay` (dedicated improvement):
//!   [`ExternalInputs::deposit_overlay_suppressed`];
//! - G3 `isLamaDepositVisibleForCiv(civ)`: [`ExternalInputs::lama_deposit_visible`];
//! - G4 `showResourceDepositOverlay` (UI): [`ExternalInputs::show_resource_deposit_overlay`];
//! - G5 `improvementKeysForHex` normalisation (`LEGACY_KEY_ALIASES`, unknown
//!   keys, fallback to `hex.ulepszenie` when `ulepszenia` is absent,
//!   `game/terrain-improvements.ts:117-123`, `:358-380`): not done; layers
//!   come from `ulepszenia` as sent. A hex that has only `ulepszenie` set
//!   (no `ulepszenia`) gets no improvement mesh here;
//! - G6 `preservesHillRelief(layers)`: [`ExternalInputs::preserves_hill_relief`].
//!
//! Proposed fix for G1, G2, G5, G6 (separate topic, contract change of
//! `view-model`, not done here): producer-computed per-hex fields
//! (`zloze` already filtered by `visibleZloze`, `deposit_overlay_suppressed`,
//! `layers = improvementKeysForHex`, `keeps_relief`).
//!
//! **Barbarian camps** (`syncCampMeshes`, `:3401-3427`, `barbCamps`):
//! NIE_ZMIERZONO — the DTO has no field for them (`SiegeCampDto` is the
//! siege camp of a besieged city, a different object), so nothing is drawn
//! and no field is invented.
//!
//! **Not ported here** (other topics or events, not DTO state):
//! `syncImprovementDecorForHex` / `hideDecorAtHex` (`:16877-16946`, decor
//! R2), forest clearing meshes (`clearingMeshes`, `:3322-3328`), build
//! ghosts (`showGhostImprovement`, `:15817-15844`), GPU disposal
//! (`disposeMergedDecor`, `releaseMergedDecorCpuArraysAfterUpload`), and
//! the neighbour pass of `syncRoadNetworkAt` (`:17031-17041`): the DTO
//! already carries the final `road_mask` of every hex and
//! [`MapObjectsLayer::sync_snapshot`] re-spawns every hex with layers, so
//! a single [`MapObjectsLayer::spawn_improvement_mesh`] behaves like the
//! pin under `bulkImprovementRebuild = true`.
//!
//! **Technical decision T1 (snapshot reconcile).** The pin removes an
//! improvement mesh only when an event calls `spawnImprovementMesh` on that
//! hex. A DTO snapshot has no events, so [`MapObjectsLayer::sync_snapshot`]
//! also re-spawns every hex that still holds a mesh; one whose layers are
//! now empty loses it exactly as in `:17067-17071`.
//!
//! No GPU here: groups are [`Scene`] values for [`Scene::export_gpu`]; a
//! hidden group is `root.visible == false`.

pub mod build;
pub mod input;

pub use build::{
    apply_hex_fog, build_improvement_group, build_improvement_visual, build_resource_overlay,
    build_village_group, compact_deposit_at_edge, food_layer_from_animal_deposit,
    improvement_mesh_placement, improvement_relief_sampler, is_deposit_overlay_suppressed,
    is_livestock_deposit_nakladka, is_water_terrain, keeps_relief_under_improvement,
    maybe_collapse_resource_overlay, merged_improvement_layers, zloze_shown, DEPOSIT_EDGE_R,
    DEPOSIT_EDGE_R_ELEVATED, DEPOSIT_MAX_SCALE, DEPOSIT_TARGET_SPAN, DEPOSIT_TARGET_SPAN_ELEVATED,
    IMPROVEMENT_OWNER_COL, OVERLAY_COLLAPSE_MIN_MESHES, SURFACE_LIFT, TARASY,
};
pub use input::{nakladka, ExternalInputs, HexObjectsInput, MapObjectsInput};

use crate::models::misc::HexKey;
use crate::scene::Scene;
use crate::view::FogSets;

/// One placed group and the hex it belongs to (`{ group, hexKey }` of
/// `resourceOverlays`, an entry of `improvementMeshes` / `villageMeshes`).
#[derive(Debug, Clone, PartialEq)]
pub struct HexGroup {
    /// `keyOf(q, r)`.
    pub hex: HexKey,
    /// The group as added to the scene.
    pub group: Scene,
}

/// `Map.set(key, value)`: replaces in place (insertion position kept) or
/// appends.
fn map_set(v: &mut Vec<HexGroup>, hex: HexKey, group: Scene) {
    match v.iter_mut().find(|e| e.hex == hex) {
        Some(e) => e.group = group,
        None => v.push(HexGroup { hex, group }),
    }
}

/// `Map.delete(key)`.
fn map_delete(v: &mut Vec<HexGroup>, hex: HexKey) -> bool {
    let n = v.len();
    v.retain(|e| e.hex != hex);
    v.len() != n
}

/// The R4 state of `main.ts`: `improvementMeshes` (`:15941`),
/// `resourceOverlays` (`:3047`), `villageMeshes` (`:3336`), each in its
/// web insertion order.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct MapObjectsLayer {
    improvement_meshes: Vec<HexGroup>,
    resource_overlays: Vec<HexGroup>,
    village_meshes: Vec<HexGroup>,
    shadow_map_needs_update: bool,
}

impl MapObjectsLayer {
    /// An empty layer.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// `improvementMeshes` in `Map` order.
    #[must_use]
    pub fn improvement_meshes(&self) -> &[HexGroup] {
        &self.improvement_meshes
    }

    /// `resourceOverlays` in array order.
    #[must_use]
    pub fn resource_overlays(&self) -> &[HexGroup] {
        &self.resource_overlays
    }

    /// `villageMeshes` in `Map` order.
    #[must_use]
    pub fn village_meshes(&self) -> &[HexGroup] {
        &self.village_meshes
    }

    /// `improvementMeshes.get(hexKey)`.
    #[must_use]
    pub fn improvement_mesh(&self, hex: HexKey) -> Option<&Scene> {
        self.improvement_meshes
            .iter()
            .find(|e| e.hex == hex)
            .map(|e| &e.group)
    }

    /// The overlays of one hex (at most one after any pin path).
    #[must_use]
    pub fn resource_overlay(&self, hex: HexKey) -> Option<&Scene> {
        self.resource_overlays
            .iter()
            .find(|e| e.hex == hex)
            .map(|e| &e.group)
    }

    /// `villageMeshes.get(hexKey)`.
    #[must_use]
    pub fn village_mesh(&self, hex: HexKey) -> Option<&Scene> {
        self.village_meshes
            .iter()
            .find(|e| e.hex == hex)
            .map(|e| &e.group)
    }

    /// `renderer.shadowMap.needsUpdate = true` was requested since the last
    /// call (`main.ts:17100`, `:3398`); clears the flag.
    pub fn take_shadow_map_update(&mut self) -> bool {
        std::mem::take(&mut self.shadow_map_needs_update)
    }

    /// `spawnImprovementMesh(hexKey)` (`main.ts:17043-17102`), with
    /// `bulkImprovementRebuild = true` (module docs).
    pub fn spawn_improvement_mesh(
        &mut self,
        map: &MapObjectsInput,
        hex: HexKey,
        ext: &ExternalInputs,
    ) {
        let group = map
            .hex(hex)
            .and_then(|h| build_improvement_group(h, map.seed, ext));
        match group {
            None => {
                map_delete(&mut self.improvement_meshes, hex);
            }
            Some(g) => {
                map_set(&mut self.improvement_meshes, hex, g);
                self.shadow_map_needs_update = true;
            }
        }
        self.sync_resource_overlay_at_hex(map, hex, ext);
    }

    /// `syncResourceOverlayAtHex(hexKey)` (`main.ts:3199-3231`): drop every
    /// overlay of the hex, then append the new one (if any) at the end.
    pub fn sync_resource_overlay_at_hex(
        &mut self,
        map: &MapObjectsInput,
        hex: HexKey,
        ext: &ExternalInputs,
    ) {
        map_delete(&mut self.resource_overlays, hex);
        let Some(h) = map.hex(hex) else { return };
        if let Some(ov) = build_resource_overlay(h, map.seed, ext) {
            self.resource_overlays.push(HexGroup { hex, group: ov });
        }
    }

    /// `rebuildResourceOverlays()` (`main.ts:3233-3264`): clear, then one
    /// overlay per qualifying hex in `map.hexes` order. Returns the count.
    pub fn rebuild_resource_overlays(
        &mut self,
        map: &MapObjectsInput,
        ext: &ExternalInputs,
    ) -> usize {
        self.resource_overlays.clear();
        for h in &map.hexes {
            if let Some(ov) = build_resource_overlay(h, map.seed, ext) {
                self.resource_overlays.push(HexGroup {
                    hex: h.key(),
                    group: ov,
                });
            }
        }
        self.resource_overlays.len()
    }

    /// `syncLivestockAndPlacedMeshes()` (`main.ts:16234-16251`): every hex
    /// with a livestock deposit or placed layers (`placedImprovements` =
    /// `ulepszenia`, module docs of [`input`]), in `map.hexes` order.
    pub fn sync_livestock_and_placed_meshes(
        &mut self,
        map: &MapObjectsInput,
        ext: &ExternalInputs,
    ) {
        for h in &map.hexes {
            if wants_improvement_mesh(h) {
                self.spawn_improvement_mesh(map, h.key(), ext);
            }
        }
    }

    /// `syncVillageMeshes()` (`main.ts:3360-3399`): keep the groups of hexes
    /// that still have a village, build the missing ones in `map.hexes`
    /// order, drop the rest. `village_present` already excludes city hexes
    /// (producer rule, `:3368`).
    pub fn sync_village_meshes(&mut self, map: &MapObjectsInput) {
        let mut changed = false;
        let mut wanted: Vec<HexKey> = Vec::new();
        for h in map.hexes.iter().filter(|h| h.village_present) {
            let key = h.key();
            wanted.push(key);
            if self.village_mesh(key).is_some() {
                continue;
            }
            self.village_meshes.push(HexGroup {
                hex: key,
                group: build_village_group(h),
            });
            changed = true;
        }
        let before = self.village_meshes.len();
        self.village_meshes.retain(|e| wanted.contains(&e.hex));
        changed |= self.village_meshes.len() != before;
        if changed {
            self.shadow_map_needs_update = true;
        }
    }

    /// `syncResourceOverlayFog(vis, explored)` (`main.ts:3284-3292`).
    pub fn sync_resource_overlay_fog(&mut self, fog: &FogSets) {
        for e in &mut self.resource_overlays {
            apply_hex_fog(&mut e.group, e.hex, fog);
        }
    }

    /// `syncImprovementMeshFog(vis, explored)` (`main.ts:3314-3329`),
    /// `improvementMeshes` part (no `clearingMeshes`, module docs).
    pub fn sync_improvement_mesh_fog(&mut self, fog: &FogSets) {
        for e in &mut self.improvement_meshes {
            apply_hex_fog(&mut e.group, e.hex, fog);
        }
    }

    /// `syncSettlementMeshFog(vis, explored)` (`main.ts:3430-3443`),
    /// villages part (no camps, module docs).
    pub fn sync_settlement_mesh_fog(&mut self, fog: &FogSets) {
        for e in &mut self.village_meshes {
            apply_hex_fog(&mut e.group, e.hex, fog);
        }
    }

    /// The fog calls of `refreshFog` in pin order (`main.ts:13495-13497`,
    /// `:13507-13509`).
    pub fn apply_fog(&mut self, fog: &FogSets) {
        self.sync_resource_overlay_fog(fog);
        self.sync_improvement_mesh_fog(fog);
        self.sync_settlement_mesh_fog(fog);
    }

    /// One DTO snapshot, in the order of `runDeferredResourceOverlaysAfterHide`
    /// (`main.ts:3272-3281`): `rebuildResourceOverlays()`,
    /// `syncLivestockAndPlacedMeshes()`, then `refreshFog()` (villages,
    /// then fog). Hexes that still hold a mesh are re-spawned too (T1,
    /// module docs).
    pub fn sync_snapshot(&mut self, map: &MapObjectsInput, ext: &ExternalInputs, fog: &FogSets) {
        self.rebuild_resource_overlays(map, ext);
        self.sync_livestock_and_placed_meshes(map, ext);
        let stale: Vec<HexKey> = self
            .improvement_meshes
            .iter()
            .map(|e| e.hex)
            .filter(|k| !map.hex(*k).is_some_and(wants_improvement_mesh))
            .collect();
        for k in stale {
            self.spawn_improvement_mesh(map, k, ext);
        }
        self.sync_village_meshes(map);
        self.apply_fog(fog);
    }
}

/// `hasDeposit || hasPlaced` of `syncLivestockAndPlacedMeshes`
/// (`main.ts:16242-16244`).
fn wants_improvement_mesh(h: &HexObjectsInput) -> bool {
    is_livestock_deposit_nakladka(h.nakladka)
        || h.ulepszenia.as_ref().is_some_and(|v| !v.is_empty())
}
