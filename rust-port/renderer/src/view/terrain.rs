//! Terrain part of the view adapter (`R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN`,
//! `P4-1G-ADAPTER-ROZPOZNANIE.md` §3.1, §3.2, §3.6 row "ukrycie dekoru",
//! §3.7 row `overlays.okolica`): `MapViewDto` + `HexDynDto` + the cities and
//! wonders of the snapshot + [`FogSets`] → the inputs of the terrain scene
//! ([`TerrainInput`]), of the terrain picking ([`MapHex`]), of the map
//! overlays ([`OverlayMap`]) and of the city surroundings ([`OkolicaMap`],
//! [`TileYield`]).
//!
//! Pin `07d2fbd72`:
//! - `buildScene(map, …)` (`gra/src/render/scene.ts:1580`) reads
//!   `Object.values(map.hexes)`, `map.szerokoscQ/wysokoscR` and `map.seed`
//!   (`seed | 0`); the terraces flag is `improvementKeysForHex(hex)` containing
//!   `tarasy` (`scene.ts:2465-2469`), carried by `HexDynDto.terraces`;
//! - `hideDecorAtHex(keyOf(c.q, c.r))` for every city
//!   (`reapplyCityHexDecorHides`, `gra/src/main.ts:16209-16212`) and for every
//!   placed wonder (`reapplyWonderHexDecorHides`, `main.ts:4311-4313`), ruins
//!   included (the pin iterates all of `placedWorldWonders`);
//! - `setFog(vis, exploredForRender, { landReveal: revealAllLand, … })` under
//!   active fog, `setFog(ALL_KEYS, ALL_KEYS)` (no options → `landReveal =
//!   false`, `scene.ts:3532`) without it (`refreshFog`, `main.ts:13485-13514`).
//!
//! What the DTO does not carry (gaps of the document §5, NOT invented here):
//! - L5: wonder build sites (`wonderBuildSites`, `hideDecorAtHex` at
//!   `main.ts:5264`) — not in the DTO, so they do not hide solids here
//!   (NIE_ZMIERZONO);
//! - L1/L2: `revealAllLand` and `riverRevealKeys` are carried by
//!   `FogRevealDto` and translated by [`super::fog::FogReveal`];
//!   [`apply_terrain_fog`] still takes `land_reveal` as an explicit argument
//!   (pass `FogReveal::land_reveal`); the river keys go to the river ribbons
//!   (`FogReveal::river_reveal_keys`), not to `set_fog`;
//! - `HexDynDto.nakladka`: the pin hides decor for the forest only on
//!   *events* (forest cut: `main.ts:16801`, `:17014`, `:42967`; food
//!   improvement on forest: `syncImprovementDecorForHex`, `main.ts:16877-16946`).
//!   After a cut the overlay is `Brak`, the same as a hex that never had a
//!   forest, so the final state of `nakladka` does not determine
//!   `solid_hidden`; the improvement-driven hides (`syncImprovementDecorForHex`
//!   beyond `tarasy`) need the improvement predicates of the game
//!   (`preservesHillRelief`, `ULEPSZENIA_ZYWNOSCIOWE`,
//!   `isImprovementBlockedOnForest`), i.e. game rules, which the adapter does
//!   not hold. Both are NIE_ZMIERZONO and are not derived from `nakladka`.
//!   Consequence once the scene is integrated: a solid the pin hides after
//!   such an event (e.g. a hill/mountain solid under an improvement,
//!   `main.ts:16877-16946`, or a cut forest) is still shown here. Fix
//!   proposed for a separate topic (contract change, gap next to L5): a
//!   producer-computed `decor_hidden` flag in `HexDynDto`.
//!
//! Precondition: `map` passed [`civ_view_model::validate_map`] (r-major
//! order, no duplicate or missing coords, contract §1.4). [`overlay_map`]
//! and [`okolica_map`] key a map by coord, so duplicates would merge
//! silently; the adapter relies on the validator and does not re-check.
//!
//! Consumers: none in `src/` yet (only `tests/view_adapter_terrain.rs`).
//! The intended consumer is the scene integrator of the renderer (R1/R2 of
//! `P4-1G-ADAPTER-ROZPOZNANIE.md` §4: unit tokens, terrain decor placement),
//! which does not exist as a topic yet; it is not the W8 war pipeline.

use std::collections::HashSet;

use civ_view_model as vm;

use super::convert::{hex_key, pick_hex, river_kind, seed_i32, terrain};
use super::fog::FogSets;
use super::ViewAdapterError;
use crate::cities::overlay::okolica::{OkolicaMap, TileYield};
use crate::models::misc::OverlayMap;
use crate::pick::hex::HexCoord;
use crate::pick::terrain::{MapHex, TerrainSceneOptions};
use crate::terrain::{MapDetailQuality, RiverPath, TerrainHex, TerrainInput, TerrainScene};

/// Owned data behind a [`TerrainInput`] (which only borrows its slices).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TerrainData {
    /// `map.seed | 0` ([`seed_i32`]).
    pub seed: i32,
    /// `map.szerokoscQ`.
    pub width: u32,
    /// `map.wysokoscR`.
    pub height: u32,
    /// `Object.values(map.hexes)`, DTO order.
    pub hexes: Vec<TerrainHex>,
    /// `map.riverPaths` + `riverPathKinds`.
    pub rivers: Vec<RiverPath>,
}

impl TerrainData {
    /// The [`TerrainInput`] of [`crate::terrain::build_terrain`];
    /// `detail` is the render option `mapDetailQuality` (not in the DTO).
    #[must_use]
    pub fn input(&self, detail: MapDetailQuality) -> TerrainInput<'_> {
        TerrainInput {
            seed: self.seed,
            width: self.width,
            height: self.height,
            hexes: &self.hexes,
            rivers: &self.rivers,
            detail,
        }
    }
}

fn check_len(
    field: &'static str,
    map: &vm::MapViewDto,
    actual: usize,
) -> Result<(), ViewAdapterError> {
    if actual == map.hexes.len() {
        Ok(())
    } else {
        Err(ViewAdapterError::LengthMismatch {
            field,
            expected: map.hexes.len(),
            actual,
        })
    }
}

/// `MapViewDto` + `HexDynDto.terraces` → [`TerrainData`].
///
/// # Errors
///
/// [`ViewAdapterError::LengthMismatch`] when `hex_state` is not parallel to
/// `map.hexes`.
pub fn terrain_data(
    map: &vm::MapViewDto,
    hex_state: &[vm::HexDynDto],
) -> Result<TerrainData, ViewAdapterError> {
    check_len("hex_state", map, hex_state.len())?;
    let hexes = map
        .hexes
        .iter()
        .zip(hex_state)
        .map(|(h, d)| TerrainHex {
            coord: pick_hex(h.coord),
            terrain: terrain(h.teren_bazowy),
            terraces: d.terraces,
        })
        .collect();
    let rivers = map
        .rivers
        .iter()
        .map(|r| RiverPath {
            hexes: r.hexes.iter().copied().map(pick_hex).collect(),
            kind: r.kind.map(river_kind),
        })
        .collect();
    Ok(TerrainData {
        seed: seed_i32(map.seed),
        width: map.width,
        height: map.height,
        hexes,
        rivers,
    })
}

/// [`TerrainSceneOptions`] of [`crate::pick::terrain::build_terrain_pick_scene`]:
/// `seed | 0` from the DTO; `solids_visible` is the zoom LOD flag
/// `zoomFlags.styledDecor` (`scene.ts:3373-3376`), a renderer state, not DTO.
#[must_use]
pub fn terrain_scene_options(map: &vm::MapViewDto, solids_visible: bool) -> TerrainSceneOptions {
    TerrainSceneOptions {
        seed: seed_i32(map.seed),
        solids_visible,
    }
}

/// Hexes whose solid / decor the pin hides with `hideDecorAtHex`, as far as
/// the DTO carries them: every city hex (`main.ts:16211`) and every placed
/// wonder hex, ruins included (`main.ts:4312`).
///
/// Not included (see the module doc): wonder build sites (gap L5,
/// NIE_ZMIERZONO), forest-cut and improvement-driven hides.
#[must_use]
pub fn solid_hidden_hexes(
    cities: &[vm::CityViewDto],
    wonders: &[vm::PlacedWonderDto],
) -> HashSet<HexCoord> {
    let mut out: HashSet<HexCoord> = cities.iter().map(|c| pick_hex(c.hex)).collect();
    // L5: `wonderBuildSites` (`main.ts:5264`) would go here; not in the DTO.
    out.extend(wonders.iter().map(|w| pick_hex(w.hex)));
    out
}

/// `MapViewDto` + `HexDynDto` + fog + cities/wonders → the hexes of the
/// terrain picking (`pick::terrain::MapHex`, `pick/terrain.rs:244-259`).
///
/// - `prism_hidden` = [`FogSets::prism_hidden`] (`!explored`, Q1);
/// - `solid_hidden` = the hex is in [`solid_hidden_hexes`];
/// - `terraces` = `HexDynDto.terraces`, 1:1.
///
/// # Errors
///
/// [`ViewAdapterError::LengthMismatch`] when `hex_state` or
/// `fog.prism_hidden` is not parallel to `map.hexes`.
pub fn map_hexes(
    map: &vm::MapViewDto,
    hex_state: &[vm::HexDynDto],
    fog: &FogSets,
    cities: &[vm::CityViewDto],
    wonders: &[vm::PlacedWonderDto],
) -> Result<Vec<MapHex>, ViewAdapterError> {
    check_len("hex_state", map, hex_state.len())?;
    check_len("fog.prism_hidden", map, fog.prism_hidden.len())?;
    let hidden = solid_hidden_hexes(cities, wonders);
    Ok(map
        .hexes
        .iter()
        .zip(hex_state)
        .zip(&fog.prism_hidden)
        .map(|((h, d), &prism_hidden)| {
            let coord = pick_hex(h.coord);
            MapHex {
                coord,
                terrain: terrain(h.teren_bazowy),
                prism_hidden,
                solid_hidden: hidden.contains(&coord),
                terraces: d.terraces,
            }
        })
        .collect())
}

/// `MapViewDto` → [`OverlayMap`] (`models/misc/overlay.rs:22-27`): terrain per
/// hex key and `map.seed` as the raw JS number (`Some`, the DTO always has
/// one; the overlays read it as `map.seed ?? 0`, `range.rs:142`, `:514`).
#[must_use]
pub fn overlay_map(map: &vm::MapViewDto) -> OverlayMap {
    OverlayMap {
        hexes: map
            .hexes
            .iter()
            .map(|h| (hex_key(h.coord), terrain(h.teren_bazowy)))
            .collect(),
        seed: Some(map.seed),
    }
}

/// `MapViewDto` + `HexDynDto.covering_improvement` → [`OkolicaMap`]
/// (`cities/overlay/okolica.rs:354-359`): `covering_improvement` holds exactly
/// the hexes whose `hexHasCoveringTerrainImprovement` is `true`.
///
/// # Errors
///
/// [`ViewAdapterError::LengthMismatch`] when `hex_state` is not parallel to
/// `map.hexes`.
pub fn okolica_map(
    map: &vm::MapViewDto,
    hex_state: &[vm::HexDynDto],
) -> Result<OkolicaMap, ViewAdapterError> {
    check_len("hex_state", map, hex_state.len())?;
    Ok(OkolicaMap {
        map: overlay_map(map),
        covering_improvement: map
            .hexes
            .iter()
            .zip(hex_state)
            .filter(|(_, d)| d.covering_improvement)
            .map(|(h, _)| hex_key(h.coord))
            .collect(),
    })
}

/// `TileYieldDto` (`view-model/src/overlays.rs:93`) → [`TileYield`]
/// (`okolica.rs:114`), field by field.
#[must_use]
pub const fn tile_yield(y: &vm::TileYieldDto) -> TileYield {
    TileYield {
        zywnosc: y.zywnosc,
        praca: y.praca,
        handel: y.handel,
    }
}

/// The `setFog` call of `refreshFog` (`main.ts:13485-13514`) on the terrain
/// scene, from [`FogSets`]:
/// - fog on: `setFog(vis, explored, { landReveal })`;
/// - fog off: `setFog(ALL_KEYS, ALL_KEYS)` — the sets of [`FogSets`] are
///   already all keys; no hex is hidden, so `showOceanBackdrop = !anyHidden ||
///   landReveal` is `true` whatever `land_reveal` is (`scene.ts:3532-3548`).
///
/// `land_reveal` is `FogReveal::land_reveal` (gap L1, from `FogRevealDto`):
/// the caller states it explicitly, there is no default. With
/// `revealAllLand` on and `fogOn` off the pin takes the fog branch
/// (`useFogRender = fogOn || revealAllLand`, `main.ts:13485`); the producer
/// sets `ViewerDto.fog_active = fogOn || revealAllLand`, and
/// `FogReveal::from_dto` rejects `revealAllLand` without active fog.
/// `riverRevealKeys` (gap L2) is not a `setFog` input of the prisms: it goes
/// to the river ribbons (`FogReveal::river_reveal_keys`). Returns
/// `showOceanBackdrop` of [`TerrainScene::set_fog`].
pub fn apply_terrain_fog(scene: &mut TerrainScene, fog: &FogSets, land_reveal: bool) -> bool {
    scene.set_fog(&fog.visible, &fog.explored, land_reveal)
}
