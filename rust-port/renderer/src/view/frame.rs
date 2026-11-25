//! T1 `R-RUSTPORT-P4-371-T1-FRAME-ADAPTER` (#371): ONE entry point from the
//! render DTO pair (`MapViewDto` + `RenderLayersDto`) and the client UI state
//! ([`MapUiState`] + `isSiegeMapPanelOpen()`) to the CPU state of the map
//! renderer ([`MapScene`]).
//!
//! No game rules and no new conversion: every value goes through the existing
//! adapters of [`super`] (Q1–Q6, R6); this module only
//! - builds their inputs from one frame ([`FrameInputs::from_dto`]), and
//! - calls the renderers in the order of the pin refreshes
//!   ([`MapScene::apply`]).
//!
//! Three parts:
//! - [`MapStatic`]: what is fixed for one game (`GetRenderMap`, once): the
//!   validated static map, the [`OverlayMap`] of the overlays and the hex
//!   grids of `new CityRenderer(scene, map)` / `new WonderRenderer(scene,
//!   map)` / `new UnitRenderer(scene, map)`. The surroundings map
//!   ([`super::okolica_map`]) and the terrain data ([`super::terrain_data`])
//!   read `hex_state` (`covering_improvement`, `terraces`), i.e. the dynamic
//!   layers, so they are built per frame in [`FrameInputs`];
//! - [`FrameInputs`]: every adapter input of one `GetRenderFrame` result;
//! - [`MapScene`]: the renderer state (terrain prisms, cities, revolt sprites,
//!   wonders, unit tokens, siege markers, overlay groups) and
//!   [`MapScene::apply`].
//!
//! Order of [`MapScene::apply`], pin `07d2fbd72` (`gra/src/main.ts` unless
//! stated). The reference sequence is the full map refresh after a load
//! (`main.ts:46138-46156`). [`MapScene`] makes the calls of that sequence
//! that reach the renderers it owns (terrain prisms, cities + revolt, wonders,
//! unit tokens, siege markers, overlay groups); the calls listed under "Not
//! synced by [`MapScene`]" below are NOT made, although some have CPU ports:
//! 1. `syncWonderRender()` (`:46139`) = `wonderRenderer.sync(placedWonderSnapshot(),
//!    { ownerColorFn: civColorFn })` (`:4316`) → [`WonderInputs::sync`]
//!    (its `reapplyWonderHexDecorHides()`, `:4317`, is not made, see below);
//! 2. `syncUnitsRender()` (`:46142`): `unitRenderer.setForceVisibleUnitId`,
//!    `setCityHexKeys(cities)`, `unitRenderer.sync(src, display, …)`
//!    (`:14550-14553`, `render/units.ts:6095-6263`) → [`super::sync_units`]
//!    after `set_city_hex_keys`;
//! 3. `cityRenderer.sync(cities, _cityRenderOpts())` (`:46143`) with its revolt
//!    calls (`render/cities.ts:541-599`) → [`CityInputs::sync_with_revolt`];
//! 4. `refreshTradeRoutesOverlay()` (`:46150`, body `:15379-15397`) → the
//!    trade route group of [`OverlayLayers`];
//! 5. `refreshSiegeMarkers()` (`:46151`, body `:17492-17530`) →
//!    `siegeMarkerRenderer.sync(oblegane, positions, { getTopY: (q, r) =>
//!    unitRenderer.topYAt(q, r), … })` (`:17521-17527`);
//! 6. `refreshFog()` (`:46152`, body `:13475-13519`): `setFog` (`:13491`,
//!    fog branch; `:13506` `setFog(ALL_KEYS, ALL_KEYS)` without fog) →
//!    [`super::apply_terrain_fog`] (both branches through [`FogSets`], whose
//!    sets are all keys when `viewer.fog_active` is off);
//!    `syncWorkerFieldOverlayFog` (`:13498`, `:13510`) is already applied by
//!    [`super::worker_field_overlay`]; `syncUnitsRender(visibleUnitsList(vis))`
//!    (`:13502`, `:13511`) repeats step 2 with the same list (the DTO units are
//!    already the visible ones), so it is not repeated;
//!    `cityRenderer.applyFogVisibility(vis, fogOn, ME())` (`:13503`, `:13512`)
//!    → [`super::apply_city_fog`]; `wonderRenderer.applyFogVisibility(vis,
//!    fogOn)` (`:13504`, `:13513`) → [`super::apply_wonder_fog`];
//!    `refreshTerritoryBorderOverlay()` (`:13518`) → the territory group;
//! 7. `refreshMapOverlayToggles()` (`:46156`, body `:15459-15463`): territory
//!    border (`:15582-15616`) and worker fields (`:15432-15448`); the ranges
//!    (`refreshRangeOverlays`, `:15626-15647`), the surroundings
//!    (`syncOkolicaOverlay`, `:6644-6666`) and the mine layer
//!    (`refreshMineEligibleOverlay`, `:15555-15568`) are the other groups of
//!    [`OverlayLayers`] (data only, no cross-order effect);
//! 8. `syncPlayerUnitSelectionOnMap()` (`:7115-7135`, called last after a turn,
//!    `:43792`) and `refreshBuildHighlight()` (`:16351-16396`) →
//!    [`super::UnitOverlayInputs::apply`] (selection ring, ONE highlight layer
//!    of decision Q6-2, route), after the siege map panel gate
//!    [`super::UnitOverlayInputs::with_siege_map_panel_open`] (`:7120-7122`).
//!
//! The order that changes the state: every `applyFogVisibility` comes AFTER
//! the `sync` of its renderer (a `sync` sets `group.visible` from `isVisible`
//! / builds new models visible, the fog call then overrides it,
//! `render/cities.ts:740-763`, `wonderRenderer.ts`), and the selection /
//! highlight calls come after the unit sync.
//!
//! The `setFog` options of the same `refreshFog` pass (`FogRevealDto`:
//! `revealAllLand`, `riverRevealKeys`, gaps L1/L2) come with the frame
//! (`RenderLayersDto::reveal`, R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME-Q1) and go
//! through [`FogReveal::from_dto`] into [`FrameInputs::land_reveal`],
//! [`FrameInputs::river_reveal_keys`] and [`FrameInputs::river_fog_active`].
//! [`MapScene`] draws no river ribbons, so the two river fields are data for
//! the river consumer only (debt RIVER-SCENE).
//!
//! Not carried by `RenderLayersDto` (so not invented here):
//! - the unit renderer resolvers set once by `wireUnitRendererRingStance`
//!   (`main.ts:10344-10384`: ring stance, owner colour, owner emblem) are not
//!   set by [`MapScene`]; they stay the renderer defaults
//!   (debt, see the T1 report);
//! - `dimmedUnitIds` is per unit in the DTO (`UnitViewDto::dimmed`).
//!
//! Not synced by [`MapScene`] (pin calls of the sequences above whose
//! renderers [`MapScene`] does not own; debt DŁUG-T1-NOT-SYNCED of the T1
//! report, for the client topic):
//! - `cityRenderer.syncStatChips(cities, _cityRenderOpts(sharedVis))`
//!   (`main.ts:14563`, end of `syncUnitsRender`) — CPU port
//!   `cities::sync::stat_chips` (`sync_stat_chips`);
//! - `syncForestForUnits(unitForestHexKeys)` (`main.ts:14562`) — CPU port
//!   `decor::placement` (`sync_forest_for_units`);
//! - in `refreshFog`: `syncCampMeshes()` / `syncVillageMeshes()`
//!   (`:13488-13489`) and `syncResourceOverlayFog` / `syncImprovementMeshFog` /
//!   `syncSettlementMeshFog` (`:13495-13497`, `:13507-13509` without fog) —
//!   CPU port `improvements::sync` (`MapObjectsLayer`);
//! - `reapplyWonderHexDecorHides()` (`:4317`, end of `syncWonderRender`) —
//!   CPU port `decor::placement` (`hide_decor_at_hex`).
//!
//! So the fields [`MapUiState::hover_stat_chip_city_id`] and
//! [`MapUiState::city_panel_view_city_id`] have no reader in [`MapScene`]
//! (they are read only by the stat chip sync above), and
//! [`MapUiState::is_city_panel_open`] is read in [`MapScene`] only by the
//! territory border gate of [`overlay_layers`] (`territoryBorderVisible ||
//! isCityPanelOpen()`), not as `hideStatChips`.

use std::collections::HashSet;

use civ_view_model as vm;

use super::cities::{apply_city_fog, apply_wonder_fog, CityAdapterError, CityInputs, WonderInputs};
use super::convert::{pick_hex, terrain};
use super::fog::{FogReveal, FogRevealError, FogSets};
use super::overlays::{
    overlay_layers, MapUiState, OverlayAdapterError, OverlayLayers, OverlayLayersInput,
};
use super::terrain::{apply_terrain_fog, okolica_map, overlay_map, terrain_data, TerrainData};
use super::units::{sync_units, HighlightPriority, UnitOverlayInputs};
use super::ViewAdapterError;
use crate::cities::revolt::RevoltRenderer;
use crate::map_units::MapUnitRenderer;
use crate::models::cities::renderer::CityRenderer;
use crate::models::misc::siege::SiegeMarkerRenderer;
use crate::models::misc::OverlayMap;
use crate::models::unit_core::registry::NotYetPorted;
use crate::models::wonders::WonderRenderer;
use crate::pick::hex::HexCoord;
use crate::pick::terrain::Terrain;
use crate::terrain::{build_terrain, MapDetailQuality, TerrainScene};

// ------------------------------------------------------------ errors

/// A frame the renderer cannot take. Every adapter error is passed on as is;
/// nothing is clamped, skipped or defaulted.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FrameError {
    /// `MapViewDto` failed [`civ_view_model::validate_map`] (the adapters key
    /// maps by coordinate and rely on it).
    Map(vm::ViewError),
    /// `RenderLayersDto.contract_version` differs from
    /// [`civ_view_model::CONTRACT_VERSION`].
    ContractVersion {
        /// [`civ_view_model::CONTRACT_VERSION`].
        expected: u16,
        /// The frame's value.
        actual: u16,
    },
    /// Terrain / fog adapters (e.g. `hex_state` or `fog.state` not parallel to
    /// `map.hexes`).
    View(ViewAdapterError),
    /// Cities / wonders adapters.
    City(CityAdapterError),
    /// Overlay adapters.
    Overlay(OverlayAdapterError),
    /// [`MapUnitRenderer::sync`] (missing unit model builder).
    Units(NotYetPorted),
    /// [`FogReveal::from_dto`]: `reveal` contradicts the map or the fog of
    /// the same frame.
    Reveal(FogRevealError),
}

impl From<FogRevealError> for FrameError {
    fn from(e: FogRevealError) -> Self {
        Self::Reveal(e)
    }
}

impl From<ViewAdapterError> for FrameError {
    fn from(e: ViewAdapterError) -> Self {
        Self::View(e)
    }
}

impl From<CityAdapterError> for FrameError {
    fn from(e: CityAdapterError) -> Self {
        Self::City(e)
    }
}

impl From<OverlayAdapterError> for FrameError {
    fn from(e: OverlayAdapterError) -> Self {
        Self::Overlay(e)
    }
}

impl From<NotYetPorted> for FrameError {
    fn from(e: NotYetPorted) -> Self {
        Self::Units(e)
    }
}

impl std::fmt::Display for FrameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Map(e) => write!(f, "map: {e}"),
            Self::ContractVersion { expected, actual } => {
                write!(f, "contractVersion {actual}, expected {expected}")
            }
            Self::View(e) => e.fmt(f),
            Self::City(e) => e.fmt(f),
            Self::Overlay(e) => e.fmt(f),
            Self::Units(e) => write!(f, "units: {e:?}"),
            Self::Reveal(e) => write!(f, "reveal: {e}"),
        }
    }
}

impl std::error::Error for FrameError {}

// ------------------------------------------------------------ static map

/// The parts of one game that do not change between frames (`GetRenderMap`,
/// once per session).
#[derive(Debug, Clone, PartialEq)]
pub struct MapStatic {
    map: vm::MapViewDto,
    overlay_map: OverlayMap,
}

impl MapStatic {
    /// Validates and keeps the static map.
    ///
    /// # Errors
    ///
    /// [`FrameError::Map`] when the map fails
    /// [`civ_view_model::validate_map`].
    pub fn from_dto(map: &vm::MapViewDto) -> Result<Self, FrameError> {
        vm::validate_map(map).map_err(FrameError::Map)?;
        Ok(Self {
            map: map.clone(),
            overlay_map: overlay_map(map),
        })
    }

    /// The static map.
    #[must_use]
    pub const fn map(&self) -> &vm::MapViewDto {
        &self.map
    }

    /// [`super::overlay_map`] of the map.
    #[must_use]
    pub const fn overlay_map(&self) -> &OverlayMap {
        &self.overlay_map
    }

    fn hex_grid(&self) -> impl Iterator<Item = (HexCoord, Terrain)> + '_ {
        self.map
            .hexes
            .iter()
            .map(|h| (pick_hex(h.coord), terrain(h.teren_bazowy)))
    }

    /// `new CityRenderer(scene, map)` ([`super::city_renderer`]).
    #[must_use]
    pub fn city_renderer(&self) -> CityRenderer {
        super::city_renderer(&self.map)
    }

    /// `new WonderRenderer(scene, map)` ([`super::wonder_renderer`]).
    #[must_use]
    pub fn wonder_renderer(&self) -> WonderRenderer {
        super::wonder_renderer(&self.map)
    }

    /// `new UnitRenderer(scene, map)` (`render/units.ts:5864-5867`).
    #[must_use]
    pub fn unit_renderer(&self) -> MapUnitRenderer {
        MapUnitRenderer::new(self.hex_grid())
    }
}

// ------------------------------------------------------------ frame inputs

/// `setFog(…)` called without options (`opts?.landReveal ?? false`,
/// `opts?.riverRevealKeys ?? null`, `scene.ts:3531-3532`): the reading of a
/// frame with `reveal = None`.
const NO_SET_FOG_OPTIONS: vm::map::FogRevealDto = vm::map::FogRevealDto {
    reveal_all_land: false,
    river_reveal_keys: None,
};

/// Every adapter input of one frame (`GetRenderFrame` result + UI state).
#[derive(Debug, Clone, PartialEq)]
pub struct FrameInputs {
    /// `viewer` (`ME()`, fog flag).
    pub viewer: vm::ViewerDto,
    /// `turn`.
    pub turn: u32,
    /// [`super::terrain_data`] of `map` + `hex_state`.
    pub terrain: TerrainData,
    /// [`FogSets::from_dto`] of `fog` with `viewer.fog_active`.
    pub fog: FogSets,
    /// `landReveal` of `setFog` (`main.ts:13491-13494`, `scene.ts:3532`):
    /// [`FogReveal::land_reveal`] of `reveal` (`false` without options).
    pub land_reveal: bool,
    /// `lastRiverRevealKeys` (`scene.ts:3531`): [`FogReveal::river_reveal_keys`]
    /// of `reveal` — the `"q,r"` keys of the start circle while the viewer
    /// awaits the first city (`startRevealKeysForRiverFog`,
    /// `main.ts:13074-13080`), else `None` (`null`). Data only: [`MapScene`]
    /// has no river ribbons (debt RIVER-SCENE); the reader is
    /// `decor::river_lod::merged_river_visible_in_fog` (`reveal`).
    pub river_reveal_keys: Option<HashSet<String>>,
    /// `lastAnyHidden = anyHiddenFinal && !landReveal` (`scene.ts:3629`,
    /// `:3654`): [`FogReveal::river_fog_active`] — the `fog_active` argument
    /// of `decor::river_lod::merged_river_visible_in_fog`. Data only, as
    /// [`Self::river_reveal_keys`].
    pub river_fog_active: bool,
    /// [`CityInputs::from_dto`] of `owners` + `cities`.
    pub cities: CityInputs,
    /// [`WonderInputs::from_dto`] of `owners` + `wonders`.
    pub wonders: WonderInputs,
    /// [`overlay_layers`] under the UI state; `units` already passed through
    /// [`super::UnitOverlayInputs::with_siege_map_panel_open`].
    pub overlays: OverlayLayers,
    /// `units[]` of [`super::sync_units`].
    pub units: Vec<vm::UnitViewDto>,
    /// `stacks` of [`super::sync_units`].
    pub stacks: vm::StackViewDto,
    /// `setCityHexKeys(new Set(cities.map(c => keyOf(c.q, c.r))))`
    /// (`main.ts:14551`).
    pub city_hexes: HashSet<HexCoord>,
    /// The UI state the frame was built with.
    pub ui: MapUiState,
    /// `isSiegeMapPanelOpen()` the frame was built with.
    pub siege_map_panel_open: bool,
}

impl FrameInputs {
    /// Builds every input of the frame. The contract version is checked
    /// first; then the adapters run and their first error is returned.
    ///
    /// # Errors
    ///
    /// - [`FrameError::ContractVersion`] for `contract_version !=
    ///   CONTRACT_VERSION`;
    /// - [`FrameError::View`] for `hex_state` / `fog.state` not parallel to
    ///   `map.hexes` (and other conversion errors);
    /// - [`FrameError::City`], [`FrameError::Overlay`] from the adapters;
    /// - [`FrameError::Reveal`] from [`FogReveal::from_dto`].
    pub fn from_dto(
        map: &MapStatic,
        layers: &vm::RenderLayersDto,
        ui: &MapUiState,
        siege_map_panel_open: bool,
    ) -> Result<Self, FrameError> {
        Self::from_dto_with_priority(
            map,
            layers,
            ui,
            siege_map_panel_open,
            HighlightPriority::Build,
        )
    }

    /// As [`Self::from_dto`], with the unit highlight layer chosen by
    /// `priority` (decision D-371-5b, [`super::units`]: the last writer of
    /// the single `setHighlight` layer, kept by the client). The selection
    /// ring and the route do not depend on it.
    ///
    /// # Errors
    ///
    /// As [`Self::from_dto`].
    pub fn from_dto_with_priority(
        map: &MapStatic,
        layers: &vm::RenderLayersDto,
        ui: &MapUiState,
        siege_map_panel_open: bool,
        priority: HighlightPriority,
    ) -> Result<Self, FrameError> {
        if layers.contract_version != vm::CONTRACT_VERSION {
            return Err(FrameError::ContractVersion {
                expected: vm::CONTRACT_VERSION,
                actual: layers.contract_version,
            });
        }
        let m = &map.map;
        let terrain = terrain_data(m, &layers.hex_state)?;
        let fog = FogSets::from_dto(m, &layers.fog, layers.viewer.fog_active)?;
        // `setFog(vis, exploredForRender, opts)` (`main.ts:13489-13494`); no
        // options = `setFog(ALL_KEYS, ALL_KEYS)` (`:13506`): `landReveal =
        // false`, `riverRevealKeys = null` (`scene.ts:3531-3532`).
        let reveal = FogReveal::from_dto(
            m,
            &fog,
            layers.reveal.as_ref().unwrap_or(&NO_SET_FOG_OPTIONS),
        )?;
        let river_fog_active = reveal.river_fog_active(&fog);
        let okolica = okolica_map(m, &layers.hex_state)?;
        let cities = CityInputs::from_dto(&layers.owners, &layers.cities)?;
        let wonders = WonderInputs::from_dto(&layers.owners, &layers.wonders)?;
        let mut overlays = overlay_layers(
            &OverlayLayersInput {
                map: &okolica,
                viewer: &layers.viewer,
                owners: &layers.owners,
                territory: &layers.territory,
                overlays: &layers.overlays,
                sieges: &layers.sieges,
                fog: &fog,
            },
            ui,
        )?;
        overlays.units = UnitOverlayInputs::from_overlays_with_priority(&layers.overlays, priority)
            .with_siege_map_panel_open(siege_map_panel_open);
        Ok(Self {
            viewer: layers.viewer,
            turn: layers.turn,
            terrain,
            fog,
            land_reveal: reveal.land_reveal,
            river_reveal_keys: reveal.river_reveal_keys,
            river_fog_active,
            cities,
            wonders,
            overlays,
            units: layers.units.clone(),
            stacks: layers.stacks.clone(),
            city_hexes: layers.cities.iter().map(|c| pick_hex(c.hex)).collect(),
            ui: *ui,
            siege_map_panel_open,
        })
    }
}

// ------------------------------------------------------------ scene

/// The CPU state of the strategic map renderer, fed only through
/// [`MapScene::apply`].
#[derive(Debug)]
pub struct MapScene {
    terrain: TerrainScene,
    show_ocean_backdrop: bool,
    cities: CityRenderer,
    revolt: RevoltRenderer,
    wonders: WonderRenderer,
    units: MapUnitRenderer,
    sieges: SiegeMarkerRenderer,
    overlays: Option<OverlayLayers>,
}

impl MapScene {
    /// `buildScene(map, …)` + the renderer constructors: the terrain is built
    /// ONCE from the terrain data of `first` (the pin builds the scene once
    /// per game, `main.ts:2173`, `:44769`; `terraces` are read only there,
    /// `scene.ts:2465-2470`). Nothing is synced yet: call [`Self::apply`].
    #[must_use]
    pub fn new(map: &MapStatic, first: &FrameInputs, detail: MapDetailQuality) -> Self {
        Self {
            terrain: build_terrain(&first.terrain.input(detail)),
            show_ocean_backdrop: true,
            cities: map.city_renderer(),
            revolt: RevoltRenderer::new(),
            wonders: map.wonder_renderer(),
            units: map.unit_renderer(),
            sieges: SiegeMarkerRenderer::default(),
            overlays: None,
        }
    }

    /// Synchronises the renderer state with one frame, in the pin order of
    /// the module header (steps 1–8). Applying the same frame again leaves the
    /// state unchanged (the pin calls `refreshFog()` from many places).
    ///
    /// # Errors
    ///
    /// [`FrameError::Units`] from [`MapUnitRenderer::sync`] (missing model
    /// builder); [`FrameError::City`] when `viewer.owner_id` does not fit the
    /// renderer's `i32` (city fog). The state may be partially updated then.
    pub fn apply(&mut self, f: &FrameInputs) -> Result<(), FrameError> {
        // 1. syncWonderRender (`main.ts:46139`, `:4316`).
        f.wonders.sync(&mut self.wonders);
        // 2. syncUnitsRender (`:46142`, `:14550-14553`).
        self.units.set_city_hex_keys(f.city_hexes.clone());
        sync_units(&mut self.units, &f.units, &f.stacks, &f.ui)?;
        // 3. cityRenderer.sync + revolt (`:46143`, `render/cities.ts:541-599`).
        f.cities
            .sync_with_revolt(&mut self.cities, &mut self.revolt);
        // 5. refreshSiegeMarkers (`:46151`, `:17521-17527`), getTopY =
        //    unitRenderer.topYAt(q, r) (`:17522`).
        let s = &f.overlays.sieges;
        let units = &self.units;
        #[allow(clippy::cast_possible_truncation)]
        let top_y = move |q: f64, r: f64| units.top_y_at(HexCoord::new(q as i32, r as i32));
        self.sieges.sync(&s.ids, &s.positions, &top_y, &s.options);
        // 6. refreshFog (`:46152`, `:13475-13519`).
        self.show_ocean_backdrop = apply_terrain_fog(&mut self.terrain, &f.fog, f.land_reveal);
        apply_city_fog(&mut self.cities, &f.fog, &f.viewer)?;
        apply_wonder_fog(&mut self.wonders, &f.fog);
        // 4./6./7. trade routes, territory, worker fields, ranges,
        //    surroundings, mine layer: the groups of the frame.
        self.overlays = Some(f.overlays.clone());
        // 8. syncPlayerUnitSelectionOnMap (`:7115-7135`) + refreshBuildHighlight
        //    (`:16351-16396`).
        f.overlays.units.apply(&mut self.units);
        Ok(())
    }

    /// The terrain prisms (`setFog` state).
    #[must_use]
    pub const fn terrain(&self) -> &TerrainScene {
        &self.terrain
    }

    /// `showOceanBackdrop` returned by the last `setFog`.
    #[must_use]
    pub const fn show_ocean_backdrop(&self) -> bool {
        self.show_ocean_backdrop
    }

    /// The city models and outlines.
    #[must_use]
    pub const fn cities(&self) -> &CityRenderer {
        &self.cities
    }

    /// The revolt sprites.
    #[must_use]
    pub const fn revolt(&self) -> &RevoltRenderer {
        &self.revolt
    }

    /// The wonder models.
    #[must_use]
    pub const fn wonders(&self) -> &WonderRenderer {
        &self.wonders
    }

    /// The unit tokens, highlight, selection ring and route.
    #[must_use]
    pub const fn units(&self) -> &MapUnitRenderer {
        &self.units
    }

    /// The unit renderer, for the resolvers [`MapScene`] does not set
    /// (`setRingStanceResolver`, `setOwnerColorFn`, `setOwnerEmblemResolver`,
    /// `main.ts:10344-10384`).
    pub fn units_mut(&mut self) -> &mut MapUnitRenderer {
        &mut self.units
    }

    /// The siege markers.
    #[must_use]
    pub const fn sieges(&self) -> &SiegeMarkerRenderer {
        &self.sieges
    }

    /// The overlay groups of the last applied frame (`None` before the first).
    #[must_use]
    pub const fn overlays(&self) -> Option<&OverlayLayers> {
        self.overlays.as_ref()
    }
}
