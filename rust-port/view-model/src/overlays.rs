//! Sieges and wonders (contract §3.1, §3.5), territory (§3.6) and overlays
//! (§3.7).
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::{CityId, HexCoord, OwnerRef};
use serde::{Deserialize, Serialize};

/// `SiegeMachineKind` (`game/siegeMachines.ts:6`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SiegeMachineKind {
    /// `'taran'`.
    Taran,
    /// `'wieza'`.
    Wieza,
}

/// One besieged city (contract §3.5 `SiegeViewDto`); order as `cities[]`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SiegeViewDto {
    /// The besieged city.
    pub city_id: CityId,
    /// Its hex.
    pub city_hex: HexCoord,
    /// Siege camp hexes (rule of `main.ts:17499-17510`, computed in the engine).
    pub camp_hexes: Vec<HexCoord>,
    /// `city.siegeMachines.ready`.
    pub ready_machines: Vec<SiegeMachineKind>,
}

/// One placed wonder (contract §3.1 `wonders`): web `PlacedWonder`
/// (`render/wonderRenderer.ts:12-19`) with `q/r` as one `hex` (like
/// `CityViewDto.hex`) and `ruin?` as a plain flag (`undefined` = `false`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PlacedWonderDto {
    /// `wonderId`.
    pub wonder_id: String,
    /// `q/r`.
    pub hex: HexCoord,
    /// `ownerId`.
    pub owner_id: OwnerRef,
    /// `ruin === true`.
    pub ruin: bool,
}

/// Hexes of one owner (`{ownerId, hexes}`), used by territory and ranges.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OwnerHexesDto {
    /// The owner.
    pub owner_id: OwnerRef,
    /// Its hexes, in web insertion order.
    pub hexes: Vec<HexCoord>,
}

/// Territory borders (contract §3.6 `TerritoryViewDto`). The producer applies
/// the fog rule of `refreshTerritoryBorderOverlay` (`main.ts:15582-15616`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TerritoryViewDto {
    /// In `Map` insertion order.
    pub by_owner: Vec<OwnerHexesDto>,
}

/// Trade route medium (`render/tradeRoutesOverlay.ts:23`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TradeMedium {
    /// `'lad'`.
    Lad,
    /// `'morze'`.
    Morze,
}

/// One trade route (contract §3.7 `tradeRoutes[]`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TradeRouteDto {
    /// From hex.
    pub from: HexCoord,
    /// To hex.
    pub to: HexCoord,
    /// Land or sea.
    pub medium: TradeMedium,
}

/// Tile yield, web `TileYield` (`game/okolica.ts:206`): every field optional.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TileYieldDto {
    /// `zywnosc?`.
    pub zywnosc: Option<f64>,
    /// `praca?`.
    pub praca: Option<f64>,
    /// `handel?`.
    pub handel: Option<f64>,
}

/// City surroundings overlay (contract §3.7 `okolica`): web
/// `CityOkolicaOverlayParams` (`render/cityOkolicaOverlay.ts:47-60`) with the
/// `yieldOf` callback as a table.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OkolicaViewDto {
    /// The city.
    pub city_id: CityId,
    /// `cityQ/cityR`.
    pub city_hex: HexCoord,
    /// `range`.
    pub range: f64,
    /// `workedKeys` (without the city centre).
    pub worked_hexes: Vec<HexCoord>,
    /// `yieldOf(q, r)` for every shown hex.
    pub yields: Vec<(HexCoord, TileYieldDto)>,
    /// `showYields?`.
    pub show_yields: Option<bool>,
    /// `ownerId`.
    pub owner_id: OwnerRef,
}

/// One worked field (contract §3.7 `workerFields[]`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WorkerFieldDto {
    /// The hex.
    pub hex: HexCoord,
    /// Owner of the worker.
    pub owner_id: OwnerRef,
}

/// Build highlight kind (contract §3.7, a kind new in the contract; the web
/// picks the layer in `refreshBuildHighlight`, `main.ts:16350-16395`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BuildHighlightKind {
    /// Generic disc (`setHighlight`).
    Generic,
    /// Deposit mine layer (`refreshMineEligibleOverlay`).
    Mine,
    /// City founding hexes (`foundCityMode`).
    FoundCity,
}

/// Build highlight (contract §3.7 `buildHighlight`). Empty `hexes` = no layer.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BuildHighlightDto {
    /// Layer kind.
    pub kind: BuildHighlightKind,
    /// Hexes, already filtered by the producer (`filterBuildHighlightHexes`).
    pub hexes: Vec<HexCoord>,
}

/// Selected unit marker (contract §3.7 `selection`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SelectionDto {
    /// Hex of the selected unit.
    pub hex: HexCoord,
    /// Its owner.
    pub owner_id: OwnerRef,
}

/// Overlays (contract §3.7 `OverlaysViewDto`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OverlaysViewDto {
    /// Culture ranges (when enabled by the UI).
    pub culture_range: Option<Vec<OwnerHexesDto>>,
    /// Religion ranges (when enabled by the UI).
    pub religion_range: Option<Vec<OwnerHexesDto>>,
    /// Trade routes.
    pub trade_routes: Vec<TradeRouteDto>,
    /// City surroundings.
    pub okolica: Option<OkolicaViewDto>,
    /// Worked fields, `Map` order.
    pub worker_fields: Vec<WorkerFieldDto>,
    /// Reachable hexes of the selected unit.
    pub reachable: Vec<HexCoord>,
    /// Build highlight.
    pub build_highlight: BuildHighlightDto,
    /// Selected unit marker (UI state).
    pub selection: Option<SelectionDto>,
    /// Planned route of the selected unit.
    pub path_route: Option<Vec<HexCoord>>,
}
