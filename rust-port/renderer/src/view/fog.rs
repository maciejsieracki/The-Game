//! `FogViewDto` + `ViewerDto.fog_active` → the fog inputs of the renderer
//! (`P4-1G-ADAPTER-ROZPOZNANIE.md` §2 "Mgła — cztery postacie", §3.3).
//!
//! Pin `07d2fbd72`, `refreshFog` (`gra/src/main.ts:13475-13520`):
//! - fog on: `setFog(vis, exploredForRender, …)` where `exploredForRender`
//!   already contains `vis` (`addExplored(…, vis)`, `:13483`);
//!   `cityRenderer.applyFogVisibility(vis, true, ME())`,
//!   `wonderRenderer.applyFogVisibility(vis, true)`,
//!   `syncWorkerFieldOverlayFog(group, vis, exploredForRender, true)`;
//! - fog off: every call gets `ALL_KEYS` for both sets and `fogOn = false`
//!   (`:13506-13513`).
//!
//! The DTO codes are `2` visible, `1` explored, `0` unexplored (D-DTO-10 = A),
//! so `visible = {state == 2}` and `explored = {state >= 1}`.
//!
//! A prism is hidden exactly when its hex is unexplored under active fog.
//!
//! Gaps L1/L2 (`revealAllLand` / `landReveal` and `riverRevealKeys`) are
//! carried by [`civ_view_model::map::FogRevealDto`] and translated by
//! [`FogReveal`] (topic `R-RUSTPORT-P4-1-L12-REVEAL-R1`).

use std::collections::HashSet;

use civ_view_model::map::FogRevealDto;
use civ_view_model::{FogState, FogViewDto, MapViewDto, Terrain};

use super::convert::{hex_key, hex_key_string, pick_hex};
use super::ViewAdapterError;
use crate::models::misc::HexKey;
use crate::pick::hex::HexCoord;

/// The fog of one snapshot in every shape the renderer takes.
///
/// Deliberately has no `Default`: an empty value (`fog_on = false`, empty
/// sets) matches no pin state. "No fog" in the pin is `ALL_KEYS` with
/// `fogOn = false`, so the only constructor is [`FogSets::from_dto`]
/// (with `fog_active = false` for "no fog").
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FogSets {
    /// `fogOn` of `apply_fog_visibility` / `fog_active` of
    /// `sync_worker_field_overlay_fog` (`ViewerDto.fog_active`).
    pub fog_on: bool,
    /// Set 1 — `TerrainScene::set_fog(visible, …)`: visible hexes.
    pub visible: HashSet<HexCoord>,
    /// Set 1 — `TerrainScene::set_fog(…, explored, …)`: explored or visible.
    pub explored: HashSet<HexCoord>,
    /// Set 2 — `CityRenderer` / `WonderRenderer::apply_fog_visibility(vis)`:
    /// visible hexes as `"q,r"`.
    pub visible_keys: HashSet<String>,
    /// Set 3 — `sync_worker_field_overlay_fog(visible, …)`.
    pub visible_hex_keys: HashSet<HexKey>,
    /// Set 3 — `sync_worker_field_overlay_fog(…, explored, …)`.
    pub explored_hex_keys: HashSet<HexKey>,
    /// `pick::terrain::MapHex.prism_hidden`, parallel to `map.hexes`.
    pub prism_hidden: Vec<bool>,
}

impl FogSets {
    /// Builds the sets from the static map (for the coordinates) and the fog
    /// of the viewer.
    ///
    /// # Errors
    ///
    /// [`ViewAdapterError::LengthMismatch`] when `fog.state` is not parallel
    /// to `map.hexes`.
    pub fn from_dto(
        map: &MapViewDto,
        fog: &FogViewDto,
        fog_active: bool,
    ) -> Result<Self, ViewAdapterError> {
        if fog.state.len() != map.hexes.len() {
            return Err(ViewAdapterError::LengthMismatch {
                field: "fog.state",
                expected: map.hexes.len(),
                actual: fog.state.len(),
            });
        }
        let n = map.hexes.len();
        let mut out = Self {
            fog_on: fog_active,
            visible: HashSet::with_capacity(n),
            explored: HashSet::with_capacity(n),
            visible_keys: HashSet::with_capacity(n),
            visible_hex_keys: HashSet::with_capacity(n),
            explored_hex_keys: HashSet::with_capacity(n),
            prism_hidden: Vec::with_capacity(n),
        };
        for (hex, &state) in map.hexes.iter().zip(&fog.state) {
            // Fog off: `ALL_KEYS` for both sets (pin `:13506-13513`).
            let (is_visible, is_explored) = if fog_active {
                (
                    state == FogState::Visible,
                    matches!(state, FogState::Visible | FogState::Explored),
                )
            } else {
                (true, true)
            };
            let c = hex.coord;
            if is_visible {
                out.visible.insert(pick_hex(c));
                out.visible_keys.insert(hex_key_string(c));
                out.visible_hex_keys.insert(hex_key(c));
            }
            if is_explored {
                out.explored.insert(pick_hex(c));
                out.explored_hex_keys.insert(hex_key(c));
            }
            out.prism_hidden.push(!is_explored);
        }
        Ok(out)
    }
}

/// A [`FogRevealDto`] that contradicts the fog it comes with. The adapter
/// reports it instead of guessing which of the two is right.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FogRevealError {
    /// `reveal_all_land` with `ViewerDto.fog_active == false`: the pin has
    /// `useFogRender = fogOn || revealAllLand` (`main.ts:13485`), so a
    /// revealed land always renders through the fog branch.
    RevealWithoutFog,
    /// `reveal_all_land` under active fog, but this non-`Morze` hex is
    /// unexplored in `fog.state`: the producer sent `explored` instead of
    /// `exploredSetForRender(explored, ALL_LAND_KEYS, true)`
    /// (`main.ts:12864-12866`, `visibility.ts:241-251`).
    RevealNotApplied {
        /// The first such hex in `map.hexes` order.
        hex: civ_view_model::HexCoord,
    },
    /// A `river_reveal_keys` hex that is not in `map.hexes`
    /// (`computeVisibleAt` keeps only `k in map.hexes`, `visibility.ts:74`).
    RiverKeyOutsideMap {
        /// The hex.
        hex: civ_view_model::HexCoord,
    },
}

impl std::fmt::Display for FogRevealError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::RevealWithoutFog => write!(f, "revealAllLand without active fog"),
            Self::RevealNotApplied { hex } => {
                write!(f, "revealAllLand: land hex {},{} unexplored", hex.q, hex.r)
            }
            Self::RiverKeyOutsideMap { hex } => {
                write!(f, "riverRevealKeys: hex {},{} not on the map", hex.q, hex.r)
            }
        }
    }
}

impl std::error::Error for FogRevealError {}

/// The `setFog` options of `refreshFog` (`main.ts:13489-13494`) as the scene
/// reads them (`scene.ts:3531-3532`), from [`FogRevealDto`]:
/// - fog on: `setFog(vis, exploredForRender, { landReveal: revealAllLand,
///   riverRevealKeys: startRevealKeysForRiverFog() })`;
/// - fog off: `setFog(ALL_KEYS, ALL_KEYS)` without options, so
///   `landReveal = opts?.landReveal ?? false` and `lastRiverRevealKeys =
///   opts?.riverRevealKeys ?? null` — whatever the DTO carries.
///
/// Deliberately has no `Default`, like [`FogSets`]: the only constructor is
/// [`FogReveal::from_dto`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FogReveal {
    /// `landReveal` of `TerrainScene::set_fog`
    /// ([`super::terrain::apply_terrain_fog`]).
    pub land_reveal: bool,
    /// `lastRiverRevealKeys` (`scene.ts:3531`) as `"q,r"` keys: the `reveal`
    /// argument of `decor::river_lod::merged_river_visible_in_fog`. `None` is
    /// `null`; `Some(empty)` stays distinct (truthy empty `Set`).
    pub river_reveal_keys: Option<HashSet<String>>,
}

impl FogReveal {
    /// Translates the DTO, checked against the fog sets of the same snapshot
    /// (`fog` from [`FogSets::from_dto`] with the same `map`).
    ///
    /// # Errors
    ///
    /// [`FogRevealError`] when the DTO contradicts `map` or `fog`.
    pub fn from_dto(
        map: &MapViewDto,
        fog: &FogSets,
        dto: &FogRevealDto,
    ) -> Result<Self, FogRevealError> {
        if let Some(keys) = &dto.river_reveal_keys {
            let on_map: HashSet<civ_view_model::HexCoord> =
                map.hexes.iter().map(|h| h.coord).collect();
            if let Some(&hex) = keys.iter().find(|k| !on_map.contains(k)) {
                return Err(FogRevealError::RiverKeyOutsideMap { hex });
            }
        }
        if !fog.fog_on {
            if dto.reveal_all_land {
                return Err(FogRevealError::RevealWithoutFog);
            }
            return Ok(Self {
                land_reveal: false,
                river_reveal_keys: None,
            });
        }
        if dto.reveal_all_land {
            // `isRevealLandTeren` (`visibility.ts:215-217`): everything but `Morze`.
            if let Some(h) = map.hexes.iter().find(|h| {
                h.teren_bazowy != Terrain::Morze && !fog.explored.contains(&pick_hex(h.coord))
            }) {
                return Err(FogRevealError::RevealNotApplied { hex: h.coord });
            }
        }
        Ok(Self {
            land_reveal: dto.reveal_all_land,
            river_reveal_keys: dto
                .river_reveal_keys
                .as_ref()
                .map(|keys| keys.iter().map(|&k| hex_key_string(k)).collect()),
        })
    }

    /// `anyHidden` of `setFog` (`scene.ts:3540-3543`): some hex neither
    /// visible nor explored.
    fn any_hidden(fog: &FogSets) -> bool {
        fog.prism_hidden.iter().any(|&h| h)
    }

    /// `showOceanBackdropNow = !anyHidden || landReveal` (`scene.ts:3548`);
    /// equals the return value of `TerrainScene::set_fog`.
    #[must_use]
    pub fn show_ocean_backdrop(&self, fog: &FogSets) -> bool {
        !Self::any_hidden(fog) || self.land_reveal
    }

    /// `lastAnyHidden = anyHiddenFinal && !landReveal` (`scene.ts:3629`,
    /// `:3654`): the `fogActive` of the river ribbons (`scene.ts:3431`) —
    /// the `fog_active` argument of
    /// `decor::river_lod::merged_river_visible_in_fog`.
    #[must_use]
    pub fn river_fog_active(&self, fog: &FogSets) -> bool {
        Self::any_hidden(fog) && !self.land_reveal
    }
}
