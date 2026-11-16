//! The per-hex builders of R4: one improvement group, one resource overlay,
//! one village, and the fog of one placed group. Every function mirrors one
//! pin function of `gra/src/main.ts` at `07d2fbd72` (line ranges below).

use std::sync::Arc;

use super::input::{ExternalInputs, HexObjectsInput};
use crate::core::fog_dim::{apply_fog_dim, fog_brightness_for_hex};
use crate::core::merge_decor::{collapse_to_merged_mesh, count_meshes_in_group};
use crate::decor::relief::build_wzgorze;
use crate::decor::style::ReliefSampler;
use crate::decor::terraces::{build_tarasy, tarasy_wariant_dla_heksa};
use crate::models::cities::renderer::terrain_top_y;
use crate::models::improvements::model::{js_max_nan, js_min_nan, ImprovementExt};
use crate::models::improvements::registry::{
    build_improvement_sectored, SectorRelief, SECTOR_R_ELEVATED,
};
use crate::models::improvements::{build_styled_resource_overlay, ImprovementModel, Nakladka};
use crate::models::misc::wioska::{build_wioska, WIOSKA_LAYOUT};
use crate::models::misc::HexKey;
use crate::pick::hex::{axial_to_world, HEX_R};
use crate::pick::terrain::{rotacja_dla_heksa, Terrain};
use crate::scene::{Geo, Geometry, Scene, ROOT};
use crate::view::FogSets;

/// `ownerCol` of `buildImprovementVisual` (`main.ts:3172`).
pub const IMPROVEMENT_OWNER_COL: u32 = 0xff_d54a;
/// `+ 0.01` above the prism top (`improvementMeshPlacement`, `main.ts:16870`,
/// `:16874`; `compactDepositAtEdge`, `:3092`).
pub const SURFACE_LIFT: f64 = 0.01;
/// `DEPOSIT_EDGE_R` (`main.ts:3050`).
pub const DEPOSIT_EDGE_R: f64 = 0.62;
/// `DEPOSIT_TARGET_SPAN` (`main.ts:3051`).
pub const DEPOSIT_TARGET_SPAN: f64 = 0.55;
/// `DEPOSIT_EDGE_R_ELEVATED` (`main.ts:3055`).
pub const DEPOSIT_EDGE_R_ELEVATED: f64 = 0.80;
/// `DEPOSIT_TARGET_SPAN_ELEVATED` (`main.ts:3056`).
pub const DEPOSIT_TARGET_SPAN_ELEVATED: f64 = 0.34;
/// `Math.min(0.6, …)` cap of the deposit scale (`main.ts:3079`).
pub const DEPOSIT_MAX_SCALE: f64 = 0.6;
/// `OVERLAY_COLLAPSE_MIN_MESHES` (`main.ts:3177`).
pub const OVERLAY_COLLAPSE_MIN_MESHES: usize = 7;
/// The terraces layer key (`main.ts:16844`, `:16871`, `:17076`).
pub const TARASY: &str = "tarasy";

// ------------------------------------------------------------ layers

/// `isLivestockDepositNakladka(n)` (`main.ts:3098-3100`).
#[must_use]
pub const fn is_livestock_deposit_nakladka(n: Nakladka) -> bool {
    matches!(n, Nakladka::ZlozeBydla | Nakladka::ZlozeOwiec)
}

/// `foodLayerFromAnimalDeposit(nakladka)`
/// (`game/terrain-improvements.ts:349-353`), read by the render-only
/// `mergedImprovementLayers` (`main.ts:3124-3136`: "Warstwy gracza +
/// implicit hodowla ze złoża zwierzęcego (render)"). The two livestock
/// deposits have no resource overlay ([`is_deposit_overlay_suppressed`]),
/// they are drawn only through this layer.
#[must_use]
pub const fn food_layer_from_animal_deposit(n: Nakladka) -> Option<&'static str> {
    match n {
        Nakladka::ZlozeBydla => Some("bydlo"),
        Nakladka::ZlozeOwiec => Some("owce"),
        _ => None,
    }
}

/// `mergedImprovementLayers(hexKey)` (`main.ts:3126-3137`): a `Set` of
/// `improvementKeysForHex(hex)`, then the animal deposit layer, then the
/// placed layers, in insertion order.
///
/// `improvementKeysForHex` is taken from `HexDynDto.ulepszenia` as the
/// producer sends it: empty keys and `'brak'` are skipped (what
/// `normalizeImprovementKey` returns `undefined` for, `:117-118`),
/// duplicates keep the first position. The placed layers are the same list
/// (`syncHexUlepszenieFields`, `main.ts:16280`), so adding them again
/// changes nothing. Key normalisation (`LEGACY_KEY_ALIASES`, unknown keys)
/// and the fallback to `hex.ulepszenie` are not done here (gap G5).
#[must_use]
pub fn merged_improvement_layers(hex: &HexObjectsInput) -> Vec<String> {
    let mut keys: Vec<String> = Vec::new();
    let mut add = |k: &str| {
        if !keys.iter().any(|x| x == k) {
            keys.push(k.to_owned());
        }
    };
    for k in hex.ulepszenia.iter().flatten() {
        if !k.is_empty() && k != "brak" {
            add(k);
        }
    }
    if let Some(d) = food_layer_from_animal_deposit(hex.nakladka) {
        add(d);
    }
    keys
}

// ------------------------------------------------------------ improvement

/// `buildImprovementVisual(layers, relief, roadMask)` (`main.ts:3162-3173`):
/// an empty group for no layers, otherwise `buildImprovementSectored(layers,
/// 0xffd54a, undefined, HEX_R, relief, roadMask)`. The mask is required (no
/// default), as in the pin.
#[must_use]
pub fn build_improvement_visual(
    layers: &[&str],
    relief: &SectorRelief<'_>,
    road_mask: u8,
) -> ImprovementModel {
    if layers.is_empty() {
        return ImprovementModel::new();
    }
    build_improvement_sectored(
        layers,
        IMPROVEMENT_OWNER_COL,
        HEX_R,
        relief,
        u32::from(road_mask),
    )
}

/// `keepsReliefUnderImprovement(hexKey, layers)` (`main.ts:16839-16849`).
/// `preservesHillRelief(layers)` is a game predicate, read from
/// [`ExternalInputs::preserves_hill_relief`] (gap G6).
#[must_use]
pub fn keeps_relief_under_improvement(
    hex: &HexObjectsInput,
    layers: &[String],
    ext: &ExternalInputs,
) -> bool {
    if layers.is_empty() {
        return false;
    }
    if !matches!(hex.terrain, Terrain::Wzgorza | Terrain::Gory) {
        return false;
    }
    if layers.iter().any(|k| k == TARASY) {
        return false;
    }
    let food_on_forest =
        hex.nakladka == Nakladka::Las && layers.iter().any(|k| k == "farma" || k == "bydlo");
    if food_on_forest {
        return false;
    }
    ext.preserves_hill_relief.contains(&hex.key())
}

/// The sampler of `improvementReliefOpts(q, r, layers)`
/// (`main.ts:16857-16864`): `None` = `{}`; `Some(s)` = `{ sectorR:
/// SECTOR_R_ELEVATED, surfaceY: s }`.
#[must_use]
pub fn improvement_relief_sampler(
    hex: &HexObjectsInput,
    layers: &[String],
    seed: i32,
    ext: &ExternalInputs,
) -> Option<ReliefSampler> {
    if !keeps_relief_under_improvement(hex, layers, ext) {
        return None;
    }
    ReliefSampler::new(hex.terrain, hex.coord.q, hex.coord.r, seed, HEX_R)
}

/// `improvementMeshPlacement(q, r, layers)` (`main.ts:16867-16875`):
/// `topYAt(q, r)` for terraces on a hill, `topYAt(q, r) + 0.01` otherwise.
#[must_use]
pub fn improvement_mesh_placement(hex: &HexObjectsInput, layers: &[String]) -> f64 {
    let top_y = terrain_top_y(hex.terrain);
    if layers.iter().any(|k| k == TARASY) && hex.terrain == Terrain::Wzgorza {
        return top_y;
    }
    top_y + SURFACE_LIFT
}

/// The group `spawnImprovementMesh(hexKey)` adds to the scene
/// (`main.ts:17043-17102`), `None` when the merged layers are empty (the
/// pin then deletes the entry, `:17067-17071`). Order of the pin: sectored
/// visual without `tarasy` (`:17076-17084`), hill + terraces for terraces on
/// a hill (`:17085-17090`), `collapseToMergedMesh` (`:17091`), position
/// (`:17094-17095`), `matrixAutoUpdate = false` (`:17097`).
#[must_use]
pub fn build_improvement_group(
    hex: &HexObjectsInput,
    seed: i32,
    ext: &ExternalInputs,
) -> Option<Scene> {
    let layers = merged_improvement_layers(hex);
    if layers.is_empty() {
        return None;
    }
    let has_tarasy = layers.iter().any(|k| k == TARASY);
    let is_hill = hex.terrain == Terrain::Wzgorza;
    let sectored: Vec<&str> = layers
        .iter()
        .map(String::as_str)
        .filter(|k| !has_tarasy || *k != TARASY)
        .collect();
    let sampler = improvement_relief_sampler(hex, &layers, seed, ext);
    let surface = sampler.map(|s| move |x: f64, z: f64| s.sample(x, z));
    let relief = match &surface {
        Some(f) => SectorRelief {
            sector_r: Some(SECTOR_R_ELEVATED),
            surface_y: Some(f as &dyn Fn(f64, f64) -> f64),
        },
        None => SectorRelief::default(),
    };
    let mut g = build_improvement_visual(&sectored, &relief, hex.road_mask);
    if has_tarasy && is_hill {
        let (q, r) = (hex.coord.q, hex.coord.r);
        let tv = tarasy_wariant_dla_heksa(q, r, seed);
        let rot_y = rotacja_dla_heksa(q, r, seed);
        let mut hill = build_wzgorze(i32::from(tv.web()));
        hill.root_mut().rot_y(rot_y);
        g.graft(ROOT, hill);
        let mut ter = build_tarasy(tv);
        ter.root_mut().rot_y(rot_y);
        g.graft(ROOT, ter);
    }
    collapse_to_merged_mesh(&mut g);
    let (x, z) = axial_to_world(hex.coord, HEX_R);
    let y = improvement_mesh_placement(hex, &layers);
    let root = g.root_mut();
    root.set_pos(x, y, z);
    root.matrix_auto_update = false;
    Some(g)
}

// ------------------------------------------------------------ resources

/// `isWaterTerrain(t)` (`units/setup.ts:664-666`), the first gate of the
/// resource overlay (`main.ts:3211`, `:3240`).
#[must_use]
pub const fn is_water_terrain(t: Terrain) -> bool {
    matches!(t, Terrain::Morze | Terrain::PlytkieMorze)
}

/// `isDepositOverlaySuppressed(n)` (`main.ts:3102-3110`): livestock
/// deposits always (drawn through [`food_layer_from_animal_deposit`]), the
/// llama deposit when the viewer's civ does not see it (gap G3).
#[must_use]
pub fn is_deposit_overlay_suppressed(n: Nakladka, ext: &ExternalInputs) -> bool {
    if is_livestock_deposit_nakladka(n) {
        return true;
    }
    if n == Nakladka::ZlozeLamy {
        return !ext.lama_deposit_visible;
    }
    false
}

/// `visibleZloze(hexZ, overlayDepositEra)` (`main.ts:3213`;
/// `map/deposit-era.ts:25-28`): `undefined` for a falsy `zloze` (absent or
/// `''`), `undefined` for a hidden one (gap G1), else `zloze` unchanged.
#[must_use]
pub fn zloze_shown<'a>(hex: &'a HexObjectsInput, ext: &ExternalInputs) -> Option<&'a str> {
    let z = hex.zloze.as_deref()?;
    if z.is_empty() || ext.zloze_hidden.contains(&hex.key()) {
        return None;
    }
    Some(z)
}

/// `maybeCollapseResourceOverlay(ov)` (`main.ts:3178-3180`).
pub fn maybe_collapse_resource_overlay(ov: &mut Scene) {
    if count_meshes_in_group(ov) >= OVERLAY_COLLAPSE_MIN_MESHES {
        collapse_to_merged_mesh(ov);
    }
}

/// `geo.translate(dx, dy, dz)` on a direct child of the group
/// (`main.ts:3074-3077`). The CPU mesh is rebuilt as a buffer (vertex
/// colours kept); three translates the geometry object in place, which for
/// a geometry shared with another object also moves that object — here the
/// copy is local to the overlay.
fn translate_child_geometry(scene: &mut Scene, id: usize, dx: f64, dy: f64, dz: f64) {
    let Some(md) = scene.nodes[id].mesh_mut() else {
        return;
    };
    let mut mesh = md.geo.build();
    mesh.translate(dx, dy, dz);
    let colors = md.geo.colors().map(<[f32]>::to_vec);
    md.geo = Geo::Buffer(Arc::new(Geometry { mesh, colors }));
}

/// `compactDepositAtEdge(ov, x, z, baseY, rotY, surfaceY)`
/// (`main.ts:3058-3094`): centre the model in XZ on its bounding box, scale
/// it to the marker span (× `userData.depositDisplayScale`), push it to the
/// edge of side 1 (`-Z`), lift it onto the relief under its whole outline.
pub fn compact_deposit_at_edge(
    ov: &mut Scene,
    x: f64,
    z: f64,
    base_y: f64,
    rot_y: f64,
    surface: Option<&ReliefSampler>,
) {
    let edge_r = if surface.is_some() {
        DEPOSIT_EDGE_R_ELEVATED
    } else {
        DEPOSIT_EDGE_R
    } * HEX_R;
    let target_span = if surface.is_some() {
        DEPOSIT_TARGET_SPAN_ELEVATED
    } else {
        DEPOSIT_TARGET_SPAN
    };
    let mut half = 0.0;
    let bb = ov.box_from_object(ROOT);
    if !bb.is_empty() {
        let cx = (bb.min.x + bb.max.x) / 2.0;
        let cz = (bb.min.z + bb.max.z) / 2.0;
        // `Math.max(…) || 1`: 0, -0 and NaN fall back to 1.
        let span = js_max_nan(bb.max.x - bb.min.x, bb.max.z - bb.min.z);
        let max_span = if span == 0.0 || span.is_nan() {
            1.0
        } else {
            span
        };
        for c in ov.nodes[ROOT].children.clone() {
            translate_child_geometry(ov, c, -cx, 0.0, -cz);
        }
        // `(ov.userData.depositDisplayScale as number) || 1`.
        let dds = ov.nodes[ROOT]
            .user_data
            .num("depositDisplayScale")
            .filter(|v| *v != 0.0 && !v.is_nan())
            .unwrap_or(1.0);
        let scale = js_min_nan(DEPOSIT_MAX_SCALE, (target_span * HEX_R) / max_span) * dds;
        ov.root_mut().set_scale_scalar(scale);
        half = (max_span * scale) / 2.0;
    }
    let mut relief = 0.0;
    if let Some(s) = surface {
        relief = f64::INFINITY;
        for dx in [-half, 0.0, half] {
            for dz in [-half, 0.0, half] {
                relief = js_min_nan(relief, s.sample(dx, -edge_r + dz));
            }
        }
        relief = if relief.is_finite() {
            js_max_nan(0.0, relief)
        } else {
            0.0
        };
    }
    let root = ov.root_mut();
    root.set_pos(x, base_y + relief + SURFACE_LIFT, z - edge_r);
    root.rot_y(rot_y);
}

/// The overlay `syncResourceOverlayAtHex(hexKey)` adds for one hex
/// (`main.ts:3206-3227`; the same per-hex body as `rebuildResourceOverlays`,
/// `:3235-3256`), `None` where the pin adds nothing. Gates in pin order:
/// UI toggle, water, overlay/deposit present, suppressed overlay kind,
/// dedicated improvement, builder `null`.
#[must_use]
pub fn build_resource_overlay(
    hex: &HexObjectsInput,
    seed: i32,
    ext: &ExternalInputs,
) -> Option<Scene> {
    if !ext.show_resource_deposit_overlay {
        return None;
    }
    if is_water_terrain(hex.terrain) {
        return None;
    }
    let has_nakladka = !matches!(hex.nakladka, Nakladka::Brak | Nakladka::Las);
    let shown = zloze_shown(hex, ext);
    if !has_nakladka && shown.is_none() {
        return None;
    }
    if is_deposit_overlay_suppressed(hex.nakladka, ext) {
        return None;
    }
    if ext.deposit_overlay_suppressed.contains(&hex.key()) {
        return None;
    }
    let mut ov = build_styled_resource_overlay(hex.nakladka, shown)?;
    maybe_collapse_resource_overlay(&mut ov);
    let (x, z) = axial_to_world(hex.coord, HEX_R);
    let top_y = terrain_top_y(hex.terrain);
    let (q, r) = (hex.coord.q, hex.coord.r);
    let relief = ReliefSampler::new(hex.terrain, q, r, seed, HEX_R);
    let rot_y = f64::from(q) * 1.3 + f64::from(r) * 0.7;
    compact_deposit_at_edge(&mut ov, x, z, top_y, rot_y, relief.as_ref());
    ov.root_mut().matrix_auto_update = false;
    Some(ov)
}

// ------------------------------------------------------------ village

/// The village group of `syncVillageMeshes` (`main.ts:3381-3386`):
/// `buildWioska()`, `collapseToMergedMesh`, centre of the hex at
/// `topYAt(q, r)`, `rotation.y = WIOSKA_OBOZ_LAYOUT.wioska.budynek.rotY`.
#[must_use]
pub fn build_village_group(hex: &HexObjectsInput) -> Scene {
    let mut g = build_wioska();
    collapse_to_merged_mesh(&mut g);
    let (x, z) = axial_to_world(hex.coord, HEX_R);
    let root = g.root_mut();
    root.set_pos(x, terrain_top_y(hex.terrain), z);
    root.rot_y(WIOSKA_LAYOUT.rot_y);
    root.matrix_auto_update = false;
    g
}

// ------------------------------------------------------------ fog

/// The per-group body shared by `syncResourceOverlayFog` (`main.ts:3284-3292`),
/// `syncImprovementMeshFog` (`:3314-3329`) and `syncSettlementMeshFog`
/// (`:3430-3443`): a hex neither visible nor explored hides the group;
/// otherwise the group is shown and dimmed by `fogBrightnessForHex(…,
/// true)`. The sets are the DTO fog ([`FogSets`]): "no fog" is `ALL_KEYS`
/// in both sets, so every group is shown at brightness 1.
pub fn apply_hex_fog(group: &mut Scene, key: HexKey, fog: &FogSets) {
    let hidden = !fog.visible_hex_keys.contains(&key) && !fog.explored_hex_keys.contains(&key);
    group.root_mut().visible = !hidden;
    if hidden {
        return;
    }
    let bri = fog_brightness_for_hex(&key, &fog.visible_hex_keys, &fog.explored_hex_keys, true);
    apply_fog_dim(group, bri);
}
