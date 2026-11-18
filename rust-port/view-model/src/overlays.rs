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

/// One siege camp entry (P4-1F1 d): one entry per attacking unit adjacent to
/// the city (`camps.push(keyOf(u.q, u.r))`, `main.ts:17501-17508` @
/// `07d2fbd72`, duplicates kept), with the camp owner the web derives in
/// `campOwnerByHex` (`render/siegeCampSync.ts:30-47`): the owner of the
/// **first** unit of the full `units` list standing on that hex whose
/// `ownerId !== cityOwnerId` (`:43`). The producer computes it from the full
/// unit list (no fog, `main.ts:17514`), because the renderer only gets the
/// fog-filtered `units[]` (P4-1F rozpoznanie §5 pt 1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SiegeCampDto {
    /// Camp hex (`keyOf(u.q, u.r)`).
    pub hex: HexCoord,
    /// `campOwnerByHex(...).get(hex)`.
    pub owner_id: OwnerRef,
}

/// One besieged city (contract §3.5 `SiegeViewDto`); order as `cities[]`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SiegeViewDto {
    /// The besieged city.
    pub city_id: CityId,
    /// Its hex.
    pub city_hex: HexCoord,
    /// Siege camps (rule of `main.ts:17499-17510`, computed in the engine),
    /// one entry per adjacent enemy unit, in `units` order, each with its
    /// camp owner ([`SiegeCampDto`]). The renderer spreads `readyMachines`
    /// round-robin over this list (`machinesByCampHex`,
    /// `siegeCampSync.ts:14-27`).
    pub camp_hexes: Vec<SiegeCampDto>,
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

/// Build highlight kind (contract §3.7): one variant per branch of
/// `refreshBuildHighlight` (`main.ts:16351-16396` @ `07d2fbd72`), so the
/// renderer picks the layer and its opacity from the kind alone (P4-1F1 b):
/// - `foundCity`: `setHighlight(qual)`, default opacity (`:16352-16361`);
/// - `wonder`: `setHighlight(...)`, default opacity (`:16363-16367`);
/// - `improvement`: `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)`
///   (`:16392-16395`);
/// - `mine`: separate `refreshMineEligibleOverlay(hexes)` layer, no disc
///   (`:16386-16390`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BuildHighlightKind {
    /// City founding hexes (`foundCityMode`).
    FoundCity,
    /// Wonder placement hexes (`activeWonderId`).
    Wonder,
    /// Improvement build hexes (`activeImprovementKey`, not a deposit mine).
    Improvement,
    /// Deposit mine layer (`isMineImprovementKey(activeImprovementKey)`).
    Mine,
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

/// One turn stop of a planned route (P4-1F1 a): web `PathTurnStop`
/// `{q, r, turn}` (`game/planned-march.ts:158-162` @ `07d2fbd72`) with `q/r`
/// as one `hex`. `turn` counts from 1 (`let turnNum = 1`, `:118`, `:244`) and
/// grows strictly along the list (`turnNum++` after each push, `:131`,
/// `:258`); checked by `validate`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PathTurnStopDto {
    /// `q/r`.
    pub hex: HexCoord,
    /// `turn`.
    pub turn: u32,
}

/// Planned route of the selected unit (P4-1F1 a): the arguments of
/// `unitRenderer.setPathRoute([{q: u.q, r: u.r}, ...plan.fullPath],
/// { turnStops: plan.turnStops })` (`main.ts:31175-31178` @ `07d2fbd72`),
/// drawn by `render/units.ts:6608-6680` (turn numbers at the stop hexes,
/// `:6666-6674`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PathRouteDto {
    /// The unit hex first, then `plan.fullPath`.
    pub hexes: Vec<HexCoord>,
    /// `plan.turnStops`, in plan order.
    pub turn_stops: Vec<PathTurnStopDto>,
}

/// Overlays (contract §3.7 `OverlaysViewDto`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OverlaysViewDto {
    /// Culture range (P4-1F1 c): ONE hex set, the one the web computes for
    /// owner `0` (`collectCultureRangeHexKeys(map, rangeCityInputs(), 0)`,
    /// `main.ts:15632` @ `07d2fbd72`; literal `0`, not the viewer), in `Set`
    /// insertion order (`map/range-hexes.ts:79-98`). `None` = no layer: the
    /// UI switch is off, the city panel is open, or the set is empty (the web
    /// adds the group only when `keys.size > 0`, `:15633`).
    pub culture_range: Option<Vec<HexCoord>>,
    /// Religion range (P4-1F1 c): ONE hex set for owner `0`
    /// (`collectReligionRangeHexKeys(..., 0)`, `main.ts:15640-15642`;
    /// `map/range-hexes.ts:101-140`), `Set` insertion order; `None` as for
    /// [`Self::culture_range`] (`:15643`).
    pub religion_range: Option<Vec<HexCoord>>,
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
    /// Planned route of the selected unit, with its turn stops.
    pub path_route: Option<PathRouteDto>,
}
