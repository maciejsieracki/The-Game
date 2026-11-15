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
//! Not carried by the DTO (gaps L1/L2 of the document, outside Q1):
//! `revealAllLand` (`landReveal`) and `riverRevealKeys`. Without them a prism
//! is hidden exactly when its hex is unexplored under active fog.

use std::collections::HashSet;

use civ_view_model::{FogState, FogViewDto, MapViewDto};

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
