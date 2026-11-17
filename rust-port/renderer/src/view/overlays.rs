//! Q5 `R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS`: territory, ranges, trade
//! routes, city surroundings, worker fields, the deposit-mine layer and the
//! siege markers (`P4-1G-ADAPTER-ROZPOZNANIE.md` §3.6, §3.7, §7 row Q5).
//!
//! DTO → renderer input, pin `07d2fbd72` (`gra/src/…`):
//! - `territory.by_owner` + `owners[]` → [`build_territory_border_group`]
//!   with `civColorFn` and `relationColorFn` (`main.ts:4065-4068`,
//!   `:15582-15616`); the relation colours are the constants
//!   `RELATION_BORDER_COLOR_*` of `game/civ-visual.ts:84-86` (here
//!   [`RELATION_BORDER_COLOR_WOJNA`], …) chosen by `relationBorderColor`
//!   (`civ-visual.ts:100-104`);
//! - `overlays.culture_range` / `religion_range` →
//!   [`build_range_overlay_group_game`] with `CULTURE_RANGE_STYLE` /
//!   `RELIGION_RANGE_STYLE` (`refreshRangeOverlays`, `main.ts:15625-15647`);
//! - `overlays.trade_routes` → [`TradeRouteOverlayInput`] +
//!   [`build_trade_routes_overlay_group`] (`refreshTradeRoutesOverlay`,
//!   `main.ts:15379-15397`);
//! - `overlays.worker_fields` → [`sync_worker_field_overlay`] +
//!   [`sync_worker_field_overlay_fog`] (`refreshWorkerFieldOverlay`,
//!   `main.ts:15432-15448`);
//! - `overlays.okolica` → [`CityOkolicaOverlayParams`] +
//!   [`build_city_okolica_overlay`] (`syncOkolicaOverlay`,
//!   `main.ts:6644-6666`);
//! - `overlays.build_highlight` of kind `Mine` → the mine-eligible layer
//!   (`refreshMineEligibleOverlay`, `main.ts:15559-15568`, called from
//!   `refreshBuildHighlight`, `:16386-16390`);
//! - `sieges[]` + `owners[]` → the arguments of [`SiegeMarkerRenderer::sync`]
//!   (`refreshSiegeMarkers`, `main.ts:17492-17530`), with `getTopY` =
//!   [`TerrainPickScene::top_y_at`] (Q2 picking scene; no unit renderer, R1).
//!
//! UI state (gap L4, contract D-CMD-12): every switch and the city panel are
//! ONE input, [`MapUiState`]; the adapter never guesses them.
//!
//! The DTO shape this module reads is the one after P4-1F1 (`CONTRACT_VERSION`
//! 2), which differs from the older wording of the Q5 row:
//! - ranges are already ONE hex list (the web set of owner `0`,
//!   `main.ts:15632`, `:15640-15642`; P4-1F1 c), so the adapter's
//!   "flattening" is only `new Set(keys)` ([`range_hex_key_set`]);
//! - every siege camp carries its owner (`SiegeCampDto.owner_id`, computed by
//!   the producer from the FULL unit list, `campOwnerByHex`,
//!   `render/siegeCampSync.ts:30-47`; P4-1F1 d). The renderer's
//!   `camp_owner_by_hex` cannot be fed from `units[]`, which the producer
//!   filters by fog: it would lose camps of units hidden in the fog
//!   (D-DTO-1 = A, the rule stays in the producer). The adapter only merges
//!   the per-city owners into the web's single `allCampOwners` map
//!   (`main.ts:17514-17516`).
//!
//! No game rules here: the `Map`/`Set` container semantics of the pin
//! (insertion order, `set` on an existing key keeps its position) are the
//! only logic, plus the lookups by owner.

use std::collections::HashMap;

use civ_view_model as vm;

use super::convert::{city_id_string, hex_f64, hex_key, hex_key_string, owner_f64, owner_i64};
use super::convert::{siege_machine_kind, trade_medium};
use super::terrain::tile_yield;
use super::FogSets;
use crate::cities::overlay::okolica::{
    build_city_okolica_overlay, collect_range_keys, CityOkolicaOverlay, CityOkolicaOverlayParams,
    OkolicaMap, TileYield,
};
use crate::cities::overlay::worker_field::{
    sync_worker_field_overlay, sync_worker_field_overlay_fog, WorkerFieldOverlay,
};
use crate::models::misc::build_highlight::MINE_BUILD_HIGHLIGHT_OPACITY;
use crate::models::misc::range::{
    build_range_overlay_group_game, build_territory_border_group, RangeOverlayStyle,
    TerritoryBorderParams, CULTURE_RANGE_STYLE, MINE_ELIGIBLE_STYLE, RELIGION_RANGE_STYLE,
    TERRITORY_BORDER_BAND_WIDTH, TERRITORY_BORDER_OPACITY,
};
use crate::models::misc::siege::{
    machines_by_camp_hex, SiegeMachineKind, SiegeMarkerRenderer, SiegeMarkerSyncOptions,
};
use crate::models::misc::trade::{build_trade_routes_overlay_group, TradeRouteOverlayInput};
use crate::models::misc::{HexKey, HexKeySet, OverlayGroup, OverlayMap};
use crate::pick::hex::HexCoord;
use crate::pick::terrain::TerrainPickScene;
use crate::raster::RasterError;

// ------------------------------------------------------------ errors

/// An overlays DTO the renderer input cannot represent. Reported, never
/// replaced by a default.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum OverlayAdapterError {
    /// Two `owners[]` entries for one owner.
    DuplicateOwner {
        /// Legacy owner number.
        owner: i64,
    },
    /// A territory or siege-camp owner without an `owners[]` entry: its
    /// colour would have to be invented.
    MissingOwner {
        /// Legacy owner number.
        owner: i64,
    },
    /// `relation_to_viewer` contradicts `viewer.owner_id`: the web takes the
    /// own colour exactly when `isMe(ownerId)` (`main.ts:4066`), so `self`
    /// must be set on the viewer's owner and only there.
    RelationMismatch {
        /// Legacy owner number of the entry.
        owner: i64,
        /// Legacy owner number of the viewer.
        viewer: i64,
    },
    /// A hex of the surroundings range without an `okolica.yields` entry: the
    /// web `yieldOf(q, r)` callback is defined for every hex it is asked
    /// about, the table has to be too (producer decision Z-1F4-3).
    MissingYield {
        /// `q`.
        q: i32,
        /// `r`.
        r: i32,
    },
    /// Two `okolica.yields` entries for one hex (a callback has one value).
    DuplicateYield {
        /// `q`.
        q: i32,
        /// `r`.
        r: i32,
    },
    /// The label raster of the surroundings overlay failed.
    Raster(RasterError),
}

impl std::fmt::Display for OverlayAdapterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::DuplicateOwner { owner } => write!(f, "owner {owner} listed twice"),
            Self::MissingOwner { owner } => write!(f, "owner {owner} has no owners[] entry"),
            Self::RelationMismatch { owner, viewer } => write!(
                f,
                "owner {owner}: relation_to_viewer contradicts viewer {viewer}"
            ),
            Self::MissingYield { q, r } => write!(f, "okolica: no yield for hex {q},{r}"),
            Self::DuplicateYield { q, r } => write!(f, "okolica: hex {q},{r} yielded twice"),
            Self::Raster(e) => write!(f, "okolica label raster: {e:?}"),
        }
    }
}

impl std::error::Error for OverlayAdapterError {}

// ------------------------------------------------------------ UI state (L4)

/// The UI state the overlay refreshes of the pin read besides the game state
/// (gap L4 of the document §5; contract D-CMD-12: selection and switches are
/// UI, not engine DTO). One value, one entry point for every switch gate of
/// this module.
///
/// Q5 reads `territory_border_visible`, `show_trade_routes_overlay`,
/// `show_worker_overlay` and `is_city_panel_open`; the other fields belong to
/// the same L4 list and are read by the cities (Q3), city badge (R5,
/// [`crate::cities::sync::CityStatChips`]) and unit (Q6) parts.
///
/// No `Default`: an all-`false` value is not the web start state; use
/// [`MapUiState::WEB_INITIAL`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MapUiState {
    /// `territoryBorderVisible` (`main.ts:15338`).
    pub territory_border_visible: bool,
    /// `showTradeRoutesOverlay` (`main.ts:15358`).
    pub show_trade_routes_overlay: bool,
    /// `showWorkerOverlay` (`main.ts:15419`).
    pub show_worker_overlay: bool,
    /// `isCityPanelOpen()` (`ui/cityPanel.ts`, imported at `main.ts:735`).
    pub is_city_panel_open: bool,
    /// `cityPanelViewCityId` (`main.ts:6575`; read by `isVisible`,
    /// `:2973-2976`, Q3).
    pub city_panel_view_city_id: Option<vm::CityId>,
    /// `forceVisibleUnitId` (`main.ts:13644`; `setForceVisibleUnitId`,
    /// `:14550`, Q6).
    pub force_visible_unit_id: Option<vm::UnitId>,
    /// `hideStatChips` of `_cityRenderOpts` (`main.ts:2977`, Q3/R5). The pin
    /// sets it to `isCityPanelOpen()`; the R5 badge sync reads
    /// [`Self::is_city_panel_open`] for it.
    pub hide_stat_chips: bool,
    /// `statChipHoverCityId` = `hoverStatChipCityId` of `_cityRenderOpts`
    /// (`main.ts:2938`, `:2987`; set on hover, `main.ts:32264`, cleared
    /// `:32268`, `:32347`), R5.
    pub hover_stat_chip_city_id: Option<vm::CityId>,
}

impl MapUiState {
    /// The start values of the pin: borders, trade routes and worker icons
    /// on (`main.ts:15338`, `:15358`, `:15419`), no city panel
    /// (`cityPanelViewCityId = null`, `:6575`), no forced unit (`:13644`),
    /// `hideStatChips = isCityPanelOpen() = false` (`:2977`), no hovered
    /// badge (`statChipHoverCityId = null`, `:2938`).
    pub const WEB_INITIAL: Self = Self {
        territory_border_visible: true,
        show_trade_routes_overlay: true,
        show_worker_overlay: true,
        is_city_panel_open: false,
        city_panel_view_city_id: None,
        force_visible_unit_id: None,
        hide_stat_chips: false,
        hover_stat_chip_city_id: None,
    };
}

// ------------------------------------------------------------ owners

/// `owners[]` indexed by owner, duplicates rejected.
fn owner_table(
    owners: &[vm::OwnerViewDto],
) -> Result<HashMap<vm::OwnerRef, &vm::OwnerViewDto>, OverlayAdapterError> {
    let mut out = HashMap::with_capacity(owners.len());
    for o in owners {
        if out.insert(o.owner_id, o).is_some() {
            return Err(OverlayAdapterError::DuplicateOwner {
                owner: owner_i64(o.owner_id),
            });
        }
    }
    Ok(out)
}

fn lookup_owner<'a>(
    table: &HashMap<vm::OwnerRef, &'a vm::OwnerViewDto>,
    owner: vm::OwnerRef,
) -> Result<&'a vm::OwnerViewDto, OverlayAdapterError> {
    table
        .get(&owner)
        .copied()
        .ok_or(OverlayAdapterError::MissingOwner {
            owner: owner_i64(owner),
        })
}

// ------------------------------------------------------------ territory

/// `RELATION_BORDER_COLOR_WOJNA` (`game/civ-visual.ts:84`).
pub const RELATION_BORDER_COLOR_WOJNA: u32 = 0xff_5252;
/// `RELATION_BORDER_COLOR_SOJUSZ` (`game/civ-visual.ts:85`).
pub const RELATION_BORDER_COLOR_SOJUSZ: u32 = 0x4f_c3f7;
/// `RELATION_BORDER_COLOR_NEUTRALNY` (`game/civ-visual.ts:86`).
pub const RELATION_BORDER_COLOR_NEUTRALNY: u32 = 0xff_d700;

/// `relationBorderColor(status)` (`game/civ-visual.ts:100-104`): `wojna` →
/// red, `sojusz` → blue, `pokoj` / `neutralni` → gold. `None` for
/// [`vm::RelationToViewer::Own`]: the web does not ask for a status there,
/// it takes `civColorFn(ME())` (`main.ts:4066`, see [`relation_color`]).
#[must_use]
pub const fn relation_border_color(rel: vm::RelationToViewer) -> Option<u32> {
    match rel {
        vm::RelationToViewer::Own => None,
        vm::RelationToViewer::Wojna => Some(RELATION_BORDER_COLOR_WOJNA),
        vm::RelationToViewer::Sojusz => Some(RELATION_BORDER_COLOR_SOJUSZ),
        vm::RelationToViewer::Pokoj | vm::RelationToViewer::Neutralni => {
            Some(RELATION_BORDER_COLOR_NEUTRALNY)
        }
    }
}

/// `relationColorFn(ownerId)` (`main.ts:4065-4068`) for one `owners[]`
/// entry: `isMe(ownerId) ? civColorFn(ME()) :
/// relationBorderColor(getDiploRelation(ME(), ownerId).status)`. For the
/// viewer's own entry `civColorFn(ME())` is its own `color`.
///
/// # Errors
///
/// [`OverlayAdapterError::RelationMismatch`] when `relation_to_viewer` is
/// `self` on a foreign owner or not `self` on the viewer.
pub fn relation_color(
    entry: &vm::OwnerViewDto,
    viewer: &vm::ViewerDto,
) -> Result<u32, OverlayAdapterError> {
    let is_me = entry.owner_id == viewer.owner_id;
    match (is_me, relation_border_color(entry.relation_to_viewer)) {
        (true, None) => Ok(entry.color),
        (false, Some(c)) => Ok(c),
        _ => Err(OverlayAdapterError::RelationMismatch {
            owner: owner_i64(entry.owner_id),
            viewer: owner_i64(viewer.owner_id),
        }),
    }
}

/// `new Set(keys)` of a DTO hex list ([`HexKeySet::new`]: duplicates keep the
/// first position, as a JS `Set`).
#[must_use]
pub fn range_hex_key_set(hexes: &[vm::HexCoord]) -> HexKeySet {
    let keys: Vec<HexKey> = hexes.iter().copied().map(hex_key).collect();
    HexKeySet::new(&keys)
}

/// `territory.by_owner` → the `hexKeysByOwner` `Map` of
/// `buildTerritoryBorderGroup` (`(i64, HexKeySet)` in insertion order). The
/// fog filter is the producer's (contract §3.6).
#[must_use]
pub fn territory_by_owner(territory: &vm::TerritoryViewDto) -> Vec<(i64, HexKeySet)> {
    territory
        .by_owner
        .iter()
        .map(|o| (owner_i64(o.owner_id), range_hex_key_set(&o.hexes)))
        .collect()
}

/// Colour inputs of one territory owner: `civColorFn(ownerId)` and
/// `relationColorFn(ownerId)`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TerritoryColors {
    /// `civColorFn(ownerId)` (`owners[].color`).
    pub civ: u32,
    /// `relationColorFn(ownerId)` ([`relation_color`]).
    pub relation: u32,
}

/// The colours of every `territory.by_owner` owner, keyed by legacy number.
///
/// # Errors
///
/// [`OverlayAdapterError::DuplicateOwner`], [`OverlayAdapterError::MissingOwner`],
/// [`OverlayAdapterError::RelationMismatch`].
pub fn territory_colors(
    territory: &vm::TerritoryViewDto,
    owners: &[vm::OwnerViewDto],
    viewer: &vm::ViewerDto,
) -> Result<HashMap<i64, TerritoryColors>, OverlayAdapterError> {
    let table = owner_table(owners)?;
    let mut out = HashMap::new();
    for o in &territory.by_owner {
        let entry = lookup_owner(&table, o.owner_id)?;
        out.insert(
            owner_i64(o.owner_id),
            TerritoryColors {
                civ: entry.color,
                relation: relation_color(entry, viewer)?,
            },
        );
    }
    Ok(out)
}

/// `refreshTerritoryBorderOverlay` (`main.ts:15582-15616`) without the
/// signature cache (`territoryBorderSignature`, `:15603-15604`, a redraw
/// optimisation, not a rule):
/// - `!(territoryBorderVisible || isCityPanelOpen())` → no group (`:15583`);
/// - `byOwner.size === 0` → no group (`:15601`);
/// - else `buildTerritoryBorderGroup(map, byOwner, civColorFn,
///   TERRITORY_BORDER_BAND_WIDTH, TERRITORY_BORDER_OPACITY, relationColorFn)`
///   (`:15607-15614`).
///
/// # Errors
///
/// As [`territory_colors`].
pub fn territory_border_group(
    map: &OverlayMap,
    territory: &vm::TerritoryViewDto,
    owners: &[vm::OwnerViewDto],
    viewer: &vm::ViewerDto,
    ui: &MapUiState,
) -> Result<Option<OverlayGroup>, OverlayAdapterError> {
    if !(ui.territory_border_visible || ui.is_city_panel_open) {
        return Ok(None);
    }
    let colors = territory_colors(territory, owners, viewer)?;
    let by_owner = territory_by_owner(territory);
    if by_owner.is_empty() {
        return Ok(None);
    }
    // `build_territory_border_group` calls the colour functions only with the
    // owners of `by_owner`, all of which are in `colors` (checked above).
    let civ = |o: i64| colors[&o].civ;
    let relation = |o: i64| colors[&o].relation;
    Ok(Some(build_territory_border_group(
        map,
        &by_owner,
        &civ,
        TerritoryBorderParams {
            band_width: Some(TERRITORY_BORDER_BAND_WIDTH),
            opacity: Some(TERRITORY_BORDER_OPACITY),
            relation_band_width: None,
        },
        Some(&relation),
    )))
}

// ------------------------------------------------------------ ranges

fn range_group(
    map: &OverlayMap,
    hexes: Option<&[vm::HexCoord]>,
    style: &RangeOverlayStyle,
    ui: &MapUiState,
) -> Option<OverlayGroup> {
    if ui.is_city_panel_open {
        return None;
    }
    let keys = range_hex_key_set(hexes?);
    if keys.is_empty() {
        return None;
    }
    Some(build_range_overlay_group_game(map, &keys, style))
}

/// Culture range of `refreshRangeOverlays` (`main.ts:15628-15636`): nothing
/// when the city panel is open (`:15629`) or the set is empty (`:15633`);
/// the switch `cultureRangeVisible` is the producer's (`None`, P4-1F1 c).
#[must_use]
pub fn culture_range_group(
    map: &OverlayMap,
    overlays: &vm::OverlaysViewDto,
    ui: &MapUiState,
) -> Option<OverlayGroup> {
    range_group(
        map,
        overlays.culture_range.as_deref(),
        &CULTURE_RANGE_STYLE,
        ui,
    )
}

/// Religion range of `refreshRangeOverlays` (`main.ts:15637-15646`), the
/// same gates as [`culture_range_group`].
#[must_use]
pub fn religion_range_group(
    map: &OverlayMap,
    overlays: &vm::OverlaysViewDto,
    ui: &MapUiState,
) -> Option<OverlayGroup> {
    range_group(
        map,
        overlays.religion_range.as_deref(),
        &RELIGION_RANGE_STYLE,
        ui,
    )
}

// ------------------------------------------------------------ trade routes

/// `TradeRouteDto` → `TradeRouteOverlayInput` (`{fromQ, fromR, toQ, toR,
/// medium}`, `main.ts:15392`).
#[must_use]
pub const fn trade_route_input(r: &vm::TradeRouteDto) -> TradeRouteOverlayInput {
    TradeRouteOverlayInput {
        from_q: r.from.q,
        from_r: r.from.r,
        to_q: r.to.q,
        to_r: r.to.r,
        medium: trade_medium(r.medium),
    }
}

/// `refreshTradeRoutesOverlay` (`main.ts:15379-15397`): nothing when the
/// switch is off (`:15381`), the city panel is open (`:15382`) or no route
/// is left (`:15383`, `:15394`); the route filters (`polaczony`, routes of
/// owner `0`, missing cities, `:15387-15391`) are the producer's.
#[must_use]
pub fn trade_routes_group(
    map: &OverlayMap,
    routes: &[vm::TradeRouteDto],
    ui: &MapUiState,
) -> Option<OverlayGroup> {
    if !ui.show_trade_routes_overlay || ui.is_city_panel_open || routes.is_empty() {
        return None;
    }
    let inputs: Vec<TradeRouteOverlayInput> = routes.iter().map(trade_route_input).collect();
    Some(build_trade_routes_overlay_group(map, &inputs))
}

// ------------------------------------------------------------ worker fields

/// `workerFields[]` → the `workedByOwner` `Map<hexKey, ownerId>` of
/// `syncWorkerFieldOverlay` (`main.ts:15435-15441`), with `Map.set`
/// semantics (a repeated hex keeps its first position, takes the last
/// owner).
#[must_use]
pub fn worked_by_owner(fields: &[vm::WorkerFieldDto]) -> Vec<(HexKey, f64)> {
    let mut out: Vec<(HexKey, f64)> = Vec::with_capacity(fields.len());
    let mut index: HashMap<HexKey, usize> = HashMap::with_capacity(fields.len());
    for f in fields {
        let key = hex_key(f.hex);
        let owner = owner_f64(f.owner_id);
        if let Some(&i) = index.get(&key) {
            out[i].1 = owner;
        } else {
            index.insert(key, out.len());
            out.push((key, owner));
        }
    }
    out
}

/// `refreshWorkerFieldOverlay` (`main.ts:15432-15448`):
/// - nothing when `!showWorkerOverlay || isCityPanelOpen()` (`:15434`) or
///   the map is empty (`:15440`);
/// - `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())`
///   (`:15441`), `ME()` = `viewer.owner_id`;
/// - `syncWorkerFieldOverlayFog(group, vis, explored, fogOn)` from
///   [`FogSets`] (`:15442-15447`; fog off = `ALL_KEYS`, `false`, which is
///   what [`FogSets`] holds then). `useFogRender = fogOn || revealAllLand`:
///   `revealAllLand` is not in the DTO (gap L1), so only `fogOn` drives it.
#[must_use]
pub fn worker_field_overlay(
    map: &OverlayMap,
    fields: &[vm::WorkerFieldDto],
    viewer: &vm::ViewerDto,
    fog: &FogSets,
    ui: &MapUiState,
) -> Option<WorkerFieldOverlay> {
    if !ui.show_worker_overlay || ui.is_city_panel_open {
        return None;
    }
    let worked = worked_by_owner(fields);
    let mut group = sync_worker_field_overlay(map, &worked, Some(owner_f64(viewer.owner_id)))?;
    sync_worker_field_overlay_fog(
        Some(&mut group),
        &fog.visible_hex_keys,
        &fog.explored_hex_keys,
        fog.fog_on,
    );
    Some(group)
}

// ------------------------------------------------------------ okolica

/// Owned data behind the [`CityOkolicaOverlayParams`] of `syncOkolicaOverlay`
/// (`main.ts:6655-6665`), which only borrows its key set and callback.
#[derive(Debug, Clone, PartialEq)]
pub struct OkolicaInputs {
    /// `cityQ`.
    pub city_q: i32,
    /// `cityR`.
    pub city_r: i32,
    /// `range: cityRangeForPopulation(city.population)`.
    pub range: f64,
    /// `workedKeys` (`okolicaWorkedKeySet(city)`), `Set` order.
    pub worked_keys: HexKeySet,
    /// The `yieldOf(q, r)` table.
    pub yields: HashMap<HexKey, TileYield>,
    /// `showYields`.
    pub show_yields: Option<bool>,
    /// `ownerId: city.ownerId`.
    pub owner_id: Option<f64>,
}

impl OkolicaInputs {
    /// `buildCityOkolicaOverlayGroup(map, params)` with
    /// `yieldOf = (q, r) => yields[(q, r)]`.
    ///
    /// # Errors
    ///
    /// [`OverlayAdapterError::MissingYield`] when a hex of the range
    /// (`collectRangeKeys`, the only hexes the builder asks `yieldOf` about,
    /// `cityOkolicaOverlay.ts:283-296`) has no entry;
    /// [`OverlayAdapterError::Raster`] from the label raster.
    pub fn build(&self, map: &OkolicaMap) -> Result<CityOkolicaOverlay, OverlayAdapterError> {
        let range_keys = collect_range_keys(&map.map, self.city_q, self.city_r, self.range);
        if let Some((q, r)) = range_keys.iter().find(|k| !self.yields.contains_key(k)) {
            return Err(OverlayAdapterError::MissingYield { q, r });
        }
        // Every key the builder can ask for is in the range checked above.
        let yield_of = |q: i32, r: i32| self.yields[&(q, r)];
        let params = CityOkolicaOverlayParams {
            city_q: self.city_q,
            city_r: self.city_r,
            range: self.range,
            worked_keys: &self.worked_keys,
            yield_of: &yield_of,
            show_yields: self.show_yields,
            owner_id: self.owner_id,
        };
        build_city_okolica_overlay(map, &params).map_err(OverlayAdapterError::Raster)
    }
}

/// `OkolicaViewDto` → [`OkolicaInputs`], field by field.
///
/// # Errors
///
/// [`OverlayAdapterError::DuplicateYield`] for a hex listed twice in
/// `yields`.
pub fn okolica_inputs(dto: &vm::OkolicaViewDto) -> Result<OkolicaInputs, OverlayAdapterError> {
    let mut yields = HashMap::with_capacity(dto.yields.len());
    for (h, y) in &dto.yields {
        if yields.insert(hex_key(*h), tile_yield(y)).is_some() {
            return Err(OverlayAdapterError::DuplicateYield { q: h.q, r: h.r });
        }
    }
    Ok(OkolicaInputs {
        city_q: dto.city_hex.q,
        city_r: dto.city_hex.r,
        range: dto.range,
        worked_keys: range_hex_key_set(&dto.worked_hexes),
        yields,
        show_yields: dto.show_yields,
        owner_id: Some(owner_f64(dto.owner_id)),
    })
}

/// `syncOkolicaOverlay` (`main.ts:6644-6666`): nothing when the city panel
/// is closed (`:6645`); the panel city and `isMe(city.ownerId)` choice
/// (`:6649-6651`) is the producer's (`okolica = None`).
///
/// # Errors
///
/// As [`okolica_inputs`] and [`OkolicaInputs::build`].
pub fn okolica_overlay(
    map: &OkolicaMap,
    okolica: Option<&vm::OkolicaViewDto>,
    ui: &MapUiState,
) -> Result<Option<CityOkolicaOverlay>, OverlayAdapterError> {
    if !ui.is_city_panel_open {
        return Ok(None);
    }
    let Some(dto) = okolica else {
        return Ok(None);
    };
    okolica_inputs(dto)?.build(map).map(Some)
}

// ------------------------------------------------------------ mine layer

/// The style of `refreshMineEligibleOverlay` (`main.ts:15562-15565`):
/// `{ ...MINE_ELIGIBLE_STYLE, tintOpacity: MINE_BUILD_HIGHLIGHT_OPACITY }`.
pub const MINE_LAYER_STYLE: RangeOverlayStyle = RangeOverlayStyle {
    tint_opacity: MINE_BUILD_HIGHLIGHT_OPACITY,
    ..MINE_ELIGIBLE_STYLE
};

/// The deposit-mine layer (`refreshBuildHighlight` → `refreshMineEligibleOverlay`,
/// `main.ts:16386-16390`, `:15559-15568`): only for
/// [`vm::BuildHighlightKind::Mine`] with at least one hex (`:15561`). The
/// other kinds go to the unit renderer's highlight (`setHighlight`, Q6/R1).
#[must_use]
pub fn mine_eligible_group(
    map: &OverlayMap,
    highlight: &vm::BuildHighlightDto,
) -> Option<OverlayGroup> {
    if highlight.kind != vm::BuildHighlightKind::Mine || highlight.hexes.is_empty() {
        return None;
    }
    let keys = range_hex_key_set(&highlight.hexes);
    Some(build_range_overlay_group_game(
        map,
        &keys,
        &MINE_LAYER_STYLE,
    ))
}

// ------------------------------------------------------------ sieges

/// The arguments of `siegeMarkerRenderer.sync(oblegane, positions, {…})`
/// (`main.ts:17521-17527`) except `getTopY` (see [`SiegeInputs::sync`]).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeInputs {
    /// `oblegane`: the besieged city ids, `cities` order (`:17493`).
    pub ids: Vec<String>,
    /// `positions` (`:17494`). The pin maps every city; `sync` reads only
    /// the besieged ones (`siege.rs` `sync`, lookup by `ids`), so the
    /// adapter maps exactly those, from `sieges[].city_hex`.
    pub positions: Vec<(String, (f64, f64))>,
    /// `campHexesByCity`, `machinesByCampHex`, `campOwnerByHex`,
    /// `ownerColorById`.
    pub options: SiegeMarkerSyncOptions,
}

/// `(q, r)` as the `getTopY` closure: `unitRenderer.topYAt(q, r)`
/// (`main.ts:17522`) = `terrainTopY(hex)` (`render/units.ts:222-225`,
/// `:6515-6518`), ported as [`TerrainPickScene::top_y_at`]
/// (`pick/terrain.rs:303-308`). The `(q, r)` passed by
/// [`SiegeMarkerRenderer::sync`] are integral (they come from DTO hex
/// coordinates), so the conversion back to `i32` is exact.
pub fn siege_top_y(scene: &TerrainPickScene) -> impl Fn(f64, f64) -> f64 + '_ {
    #[allow(clippy::cast_possible_truncation)]
    move |q: f64, r: f64| scene.top_y_at(HexCoord::new(q as i32, r as i32))
}

/// `refreshSiegeMarkers` (`main.ts:17492-17530`) on the DTO:
/// - `ids` / `positions` from `sieges[]` (one per besieged city, `cities`
///   order, `:17493-17494`);
/// - `campHexesByCity.set(c.id, camps)` (`:17510`), camps as `"q,r"`, with
///   repetitions;
/// - `allMachinesByCamp`: `machinesByCampHex(camps, ready)` per city, lists
///   joined per hex (`[...prev, ...kinds]`, `:17511-17513`);
/// - `allCampOwners.set(hk, oid)` per camp, last city wins, first position
///   kept (`:17514-17516`), owners from `SiegeCampDto.owner_id`;
/// - `ownerColorById`: `[[0, civColorFn(0)]]` (`:17498`), then the colour
///   of every camp owner (`:17507`, `:17516`). Owner `0` is taken only when
///   `owners[]` has it: `sync` looks a colour up only for a camp owner, and
///   every camp owner is required below, so a missing owner `0` changes no
///   output.
///
/// # Errors
///
/// [`OverlayAdapterError::DuplicateOwner`];
/// [`OverlayAdapterError::MissingOwner`] for a camp owner without an
/// `owners[]` entry.
pub fn siege_inputs(
    sieges: &[vm::SiegeViewDto],
    owners: &[vm::OwnerViewDto],
) -> Result<SiegeInputs, OverlayAdapterError> {
    let table = owner_table(owners)?;
    let mut ids = Vec::with_capacity(sieges.len());
    let mut positions = Vec::with_capacity(sieges.len());
    let mut camp_hexes_by_city: Vec<(String, Vec<String>)> = Vec::with_capacity(sieges.len());
    let mut machines: Vec<(String, Vec<SiegeMachineKind>)> = Vec::new();
    let mut camp_owners: Vec<(String, i64)> = Vec::new();
    let mut colors: Vec<(i64, u32)> = Vec::new();

    let player0 = vm::PlayerId::try_new(0).map(vm::OwnerRef::Player);
    if let Some(o) = player0.ok().and_then(|p| table.get(&p)) {
        colors.push((0, o.color));
    }

    for s in sieges {
        let id = city_id_string(s.city_id);
        ids.push(id.clone());
        positions.push((id.clone(), hex_f64(s.city_hex)));
        let camps: Vec<String> = s.camp_hexes.iter().map(|c| hex_key_string(c.hex)).collect();
        let ready: Vec<SiegeMachineKind> = s
            .ready_machines
            .iter()
            .copied()
            .map(siege_machine_kind)
            .collect();
        for (hk, kinds) in machines_by_camp_hex(&camps, &ready) {
            map_set_with(&mut machines, hk, kinds, |prev, kinds| prev.extend(kinds));
        }
        for c in &s.camp_hexes {
            let owner = owner_i64(c.owner_id);
            let color = lookup_owner(&table, c.owner_id)?.color;
            map_set_with(&mut camp_owners, hex_key_string(c.hex), owner, |v, o| {
                *v = o;
            });
            map_set_with(&mut colors, owner, color, |v, new| *v = new);
        }
        camp_hexes_by_city.push((id, camps));
    }

    Ok(SiegeInputs {
        ids,
        positions,
        options: SiegeMarkerSyncOptions {
            camp_hexes_by_city,
            machines_by_camp_hex: machines,
            owner_color_by_id: colors,
            camp_owner_by_hex: camp_owners,
        },
    })
}

/// `Map.set` on an insertion-ordered list: a new key is appended, an existing
/// one is updated in place with `merge`.
fn map_set_with<K: PartialEq, V>(
    list: &mut Vec<(K, V)>,
    key: K,
    value: V,
    merge: impl FnOnce(&mut V, V),
) {
    if let Some((_, v)) = list.iter_mut().find(|(k, _)| *k == key) {
        merge(v, value);
    } else {
        list.push((key, value));
    }
}

impl SiegeInputs {
    /// `siegeMarkerRenderer.sync(oblegane, positions, { getTopY, … })`
    /// (`main.ts:17521-17527`) with `getTopY` = [`siege_top_y`].
    pub fn sync(&self, renderer: &mut SiegeMarkerRenderer, scene: &TerrainPickScene) {
        let top_y = siege_top_y(scene);
        renderer.sync(&self.ids, &self.positions, &top_y, &self.options);
    }
}

// ------------------------------------------------------------ all overlays

/// The DTO parts the overlays read, plus the fog of the snapshot.
#[derive(Debug, Clone, Copy)]
pub struct OverlayLayersInput<'a> {
    /// The static map as the overlays take it (Q2 [`super::okolica_map`]:
    /// terrain, `seed`, covering improvements); `map.map` is the
    /// [`OverlayMap`] of every other layer.
    pub map: &'a OkolicaMap,
    /// `viewer` (`ME()`).
    pub viewer: &'a vm::ViewerDto,
    /// `owners[]`.
    pub owners: &'a [vm::OwnerViewDto],
    /// `territory`.
    pub territory: &'a vm::TerritoryViewDto,
    /// `overlays`.
    pub overlays: &'a vm::OverlaysViewDto,
    /// `sieges[]`.
    pub sieges: &'a [vm::SiegeViewDto],
    /// Q1 fog sets of the snapshot.
    pub fog: &'a FogSets,
}

/// Every overlay of the snapshot that has a renderer input, after the
/// [`MapUiState`] gates. `None` = the pin draws no group.
#[derive(Debug, Clone, PartialEq)]
pub struct OverlayLayers {
    /// [`territory_border_group`].
    pub territory: Option<OverlayGroup>,
    /// [`culture_range_group`].
    pub culture_range: Option<OverlayGroup>,
    /// [`religion_range_group`].
    pub religion_range: Option<OverlayGroup>,
    /// [`trade_routes_group`].
    pub trade_routes: Option<OverlayGroup>,
    /// [`worker_field_overlay`].
    pub worker_fields: Option<WorkerFieldOverlay>,
    /// [`okolica_overlay`].
    pub okolica: Option<CityOkolicaOverlay>,
    /// [`mine_eligible_group`].
    pub mine_eligible: Option<OverlayGroup>,
    /// [`siege_inputs`] (no UI gate in the pin).
    pub sieges: SiegeInputs,
}

/// All overlays of one snapshot, the single entry point of the
/// [`MapUiState`] gates.
///
/// # Errors
///
/// The first error of [`territory_border_group`], [`okolica_overlay`] or
/// [`siege_inputs`].
pub fn overlay_layers(
    input: &OverlayLayersInput<'_>,
    ui: &MapUiState,
) -> Result<OverlayLayers, OverlayAdapterError> {
    let map = &input.map.map;
    Ok(OverlayLayers {
        territory: territory_border_group(map, input.territory, input.owners, input.viewer, ui)?,
        culture_range: culture_range_group(map, input.overlays, ui),
        religion_range: religion_range_group(map, input.overlays, ui),
        trade_routes: trade_routes_group(map, &input.overlays.trade_routes, ui),
        worker_fields: worker_field_overlay(
            map,
            &input.overlays.worker_fields,
            input.viewer,
            input.fog,
            ui,
        ),
        okolica: okolica_overlay(input.map, input.overlays.okolica.as_ref(), ui)?,
        mine_eligible: mine_eligible_group(map, &input.overlays.build_highlight),
        sieges: siege_inputs(input.sieges, input.owners)?,
    })
}
