//! Root of the view model (contract §3.1) and its split for decision
//! D-DTO-3 = B (static map once, dynamic layers in full).

use crate::battle::BattleViewDto;
use crate::map::{FogRevealDto, FogViewDto, HexDynDto, MapViewDto};
use crate::overlays::{OverlaysViewDto, PlacedWonderDto, SiegeViewDto, TerritoryViewDto};
use crate::owners::{CityViewDto, OwnerViewDto, ViewerDto};
use crate::units::{StackViewDto, UnitViewDto};
use serde::{Deserialize, Serialize};

/// Version of this contract (`contractVersion`), following the pattern of the
/// bridge version constant (`engine/src/bridge.rs:12-13`). Bump on any change
/// of a JSON key, type or encoding.
pub const CONTRACT_VERSION: u16 = 2;

/// Full render snapshot (contract §3.1 `RenderViewDto`): the static map plus
/// every dynamic layer. Sent at start/load; afterwards the engine sends
/// [`RenderLayersDto`] (D-DTO-3 = B).
///
/// `stacks` is not a row of the §3.1 table, but the contract defines
/// `StackViewDto` in §3.5 and reads it as `stacks` in §1.5.1 Δ4
/// (`hasCommander`), so it is a root field next to `units`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RenderViewDto {
    /// [`CONTRACT_VERSION`].
    pub contract_version: u16,
    /// The viewer.
    pub viewer: ViewerDto,
    /// `PlayableState.turn`.
    pub turn: u32,
    /// Static map.
    pub map: MapViewDto,
    /// Dynamic hex fields, parallel to `map.hexes`.
    pub hex_state: Vec<HexDynDto>,
    /// Fog for the viewer, parallel to `map.hexes`.
    pub fog: FogViewDto,
    /// Owners, ascending by `ownerId`.
    pub owners: Vec<OwnerViewDto>,
    /// Cities, engine order.
    pub cities: Vec<CityViewDto>,
    /// Units, engine order.
    pub units: Vec<UnitViewDto>,
    /// Stack display (§3.5).
    pub stacks: StackViewDto,
    /// One entry per besieged city, `cities` order.
    pub sieges: Vec<SiegeViewDto>,
    /// Placed wonders.
    pub wonders: Vec<PlacedWonderDto>,
    /// Territory borders.
    pub territory: TerritoryViewDto,
    /// Overlays.
    pub overlays: OverlaysViewDto,
    /// Battle scene start, when a battle is open.
    pub battle: Option<BattleViewDto>,
}

/// Dynamic part of the snapshot (D-DTO-3 = B): every field of
/// [`RenderViewDto`] except `map`, with the same JSON keys.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RenderLayersDto {
    /// [`CONTRACT_VERSION`].
    pub contract_version: u16,
    /// The viewer.
    pub viewer: ViewerDto,
    /// `PlayableState.turn`.
    pub turn: u32,
    /// Dynamic hex fields, parallel to the static `map.hexes`.
    pub hex_state: Vec<HexDynDto>,
    /// Fog for the viewer, parallel to the static `map.hexes`.
    pub fog: FogViewDto,
    /// Owners.
    pub owners: Vec<OwnerViewDto>,
    /// Cities.
    pub cities: Vec<CityViewDto>,
    /// Units.
    pub units: Vec<UnitViewDto>,
    /// Stack display.
    pub stacks: StackViewDto,
    /// Sieges.
    pub sieges: Vec<SiegeViewDto>,
    /// Wonders.
    pub wonders: Vec<PlacedWonderDto>,
    /// Territory.
    pub territory: TerritoryViewDto,
    /// Overlays.
    pub overlays: OverlaysViewDto,
    /// Battle.
    pub battle: Option<BattleViewDto>,
    /// R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1 (D-403A-1): the `setFog`
    /// options of the same `refreshFog` pass (`main.ts:13489-13494`), so one
    /// frame query per refresh carries them like the pin. `Some` = the fog
    /// branch (`useFogRender`, `:13485`), which passes `{ landReveal,
    /// riverRevealKeys }`; `None` = no options, i.e. the no-fog branch
    /// `setFog(ALL_KEYS, ALL_KEYS)` (`:13505-13506`), read by the renderer as
    /// `landReveal = false`, `riverRevealKeys = null` (`scene.ts:3531-3532`).
    ///
    /// Additive and optional: absent from the JSON when `None`
    /// (`skip_serializing_if`), accepted when missing (`default`), so a frame
    /// without it serialises byte for byte as before and the bridge
    /// `CONTRACT_VERSION` stays (precedent D-WIRB-5). Not part of
    /// [`RenderViewDto`]: [`RenderViewDto::split`] gives `None` and
    /// [`RenderViewDto::join`] drops it (the full snapshot is the start/load
    /// shape; the options travel with every frame).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reveal: Option<FogRevealDto>,
}

impl RenderViewDto {
    /// Splits the snapshot into the static map and the dynamic layers.
    #[must_use]
    pub fn split(self) -> (MapViewDto, RenderLayersDto) {
        let Self {
            contract_version,
            viewer,
            turn,
            map,
            hex_state,
            fog,
            owners,
            cities,
            units,
            stacks,
            sieges,
            wonders,
            territory,
            overlays,
            battle,
        } = self;
        (
            map,
            RenderLayersDto {
                contract_version,
                viewer,
                turn,
                hex_state,
                fog,
                owners,
                cities,
                units,
                stacks,
                sieges,
                wonders,
                territory,
                overlays,
                battle,
                reveal: None,
            },
        )
    }

    /// Joins a static map and dynamic layers into a full snapshot (inverse of
    /// [`RenderViewDto::split`]).
    #[must_use]
    pub fn join(map: MapViewDto, layers: RenderLayersDto) -> Self {
        let RenderLayersDto {
            contract_version,
            viewer,
            turn,
            hex_state,
            fog,
            owners,
            cities,
            units,
            stacks,
            sieges,
            wonders,
            territory,
            overlays,
            battle,
            reveal: _,
        } = layers;
        Self {
            contract_version,
            viewer,
            turn,
            map,
            hex_state,
            fog,
            owners,
            cities,
            units,
            stacks,
            sieges,
            wonders,
            territory,
            overlays,
            battle,
        }
    }
}
