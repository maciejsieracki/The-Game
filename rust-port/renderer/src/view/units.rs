//! Q6 `R-RUSTPORT-P4-1G-Q6-UNITS-R1` (PRIO-3D-2, #270 / #328): units,
//! stacks, the reachable range, the build highlight (non-mine kinds), the
//! selection ring and the planned route → [`MapUnitRenderer`]
//! (`P4-1G-ADAPTER-ROZPOZNANIE.md` §3.7 rows `reachable`, `build_highlight`,
//! `selection`, `path_route`; §7 row Q6).
//!
//! DTO → renderer input, pin `07d2fbd72` (`gra/src/…`):
//! - `units[]` + `stacks` → [`MapUnitRenderer::sync`] (`unitRenderer.sync(
//!   units, stackDisplay, dimmedUnitIds)`, `render/units.ts:6095-6263`), with
//!   `forceVisibleUnitId` from [`MapUiState`] (`setForceVisibleUnitId`,
//!   `main.ts:14550`, `units.ts:5874-5876`);
//! - `overlays.reachable` → `unitRenderer.setHighlight(reachable)` with the
//!   default opacity (`syncPlayerUnitSelectionOnMap`, `main.ts:7123-7125`);
//!   the siege map panel clears it (`:7120-7122`);
//! - `overlays.build_highlight` → the branches of `refreshBuildHighlight`
//!   (`main.ts:16351-16396`): `FoundCity` / `Wonder` → `setHighlight(hexes)`
//!   (default opacity, `:16360`, `:16366`); `Improvement` →
//!   `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`);
//!   `Mine` → `clearHighlight()` (`:16387`; the mine layer itself is
//!   [`super::mine_eligible_group`], Q5);
//! - `overlays.selection` → `setSelectionHex(q, r, ownerId)` (`main.ts:7119`);
//! - `overlays.path_route` → `setPathRoute([start, ...fullPath], { turnStops })`
//!   (`main.ts:31175-31178`, `:31204-31207`); `None` → `clearPathRoute()`.
//!
//! Decision Q6-2 (one highlight layer, `P4-1G-ADAPTER-ROZPOZNANIE.md` §3.7
//! last row, NIE_ZMIERZONO before): the pin has ONE `setHighlight` layer and
//! the last call wins. In a snapshot the build mode is the later, modal
//! state (it is entered with a unit possibly still selected and
//! `refreshBuildHighlight` runs on every build-mode change), so a build
//! highlight with at least one hex wins over `reachable`; an empty
//! `build_highlight.hexes` means "no build layer" (contract §3.7, producer
//! `no_layer`) and the reachable range is shown.
//!
//! Former divergence of Q6-2, now CLOSED (defence r1, objection 3; closed by
//! R-RUSTPORT-P4-1Q6-2, `f263ad77a`). What it was: when a build mode is
//! ACTIVE but its hex set is EMPTY, the pin clears the reachable discs
//! (`refreshBuildHighlight`, `main.ts:16351-16396`: `setHighlight(new
//! Set())` for found city / wonder, `:16360`, `:16366`; `clearHighlight()`
//! for the deposit mine, `:16387`; an empty `setHighlight` for other
//! improvements, `:16392-16395`), while the snapshot still carried
//! `reachable` (e.g. a settler in found-city mode with no legal hex), so this
//! adapter showed the range. What it is now: the producer
//! (`engine/src/domain/overlays_view.rs`, `unit_overlays_view`) leaves
//! `reachable` EMPTY whenever `build_highlight_mode_active` is true, also for
//! an empty hex set, so "mode active, no hex" reaches this adapter as no
//! layer at all and the pin result (no discs) follows without a contract
//! change. Test: `engine/tests/p4_1q6_2_build_highlight.rs`. Caller contract:
//! opening the build panel without an improvement key is not a build mode
//! (`build_highlight_mode_active` is false, the reachable branch stays), so
//! the caller must clear the unit selection itself, as `onOpenBuild` does
//! with `clearPlayerUnitSelection()` (`main.ts:26702-26703`).
//!
//! Decision D-371-5b (#371 T5b, refinement of Q6-2 for the re-selection of
//! `R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE`): since T5a the frame can
//! carry BOTH layers at once (`selection` / `reachable` / `pathRoute` and
//! `buildHighlight`, `RenderUiParams::unit_selected_after_build_open`). The
//! pin still has one `setHighlight` layer where the last call wins:
//! `selectPlayerUnit` writes the reachable range (`main.ts:7253-7261`) and
//! `refreshBuildHighlight` writes the build set (`:16351-16396`). The frame is
//! stateless, so the client keeps the last writer and passes it as
//! [`HighlightPriority`]: [`HighlightPriority::Build`] (default) = Q6-2 above;
//! [`HighlightPriority::Reachable`] = the reachable range (with the siege map
//! panel open the reachable write is `clearHighlight()`, `:7253-7255`). The
//! selection ring and the route are separate renderer calls
//! (`setSelectionHex`, `setPathRoute`) and do not depend on the highlight
//! layer.
//!
//! Decision D-371-5c (#371 T5c PIN-PARITY, `R-RUSTPORT-P4-371-T5C-PIN-PARITY`):
//! - U-OP-1: `selectPlayerUnit` writes the reachable set even when it is
//!   EMPTY (`reachable = stackCanMove(u) && ... ? reachableWithMergeTargets(u)
//!   : new Set(); unitRenderer.setHighlight(reachable)`, `main.ts:7256-7261`),
//!   so [`HighlightPriority::Reachable`] with an empty `reachable` is no discs
//!   ([`UnitHighlight::Clear`]), never the build layer underneath (the T5b
//!   fallback to the build layer is removed);
//! - U-OP-3 / U-OP-4: `clearHighlight()` as the last write
//!   (`clearPlayerUnitSelectionStateOnly`, `main.ts:7097-7101`;
//!   `refreshBuildHighlight` outside build mode after `exitBuildMode`,
//!   `:16369-16372`, `:16526-16541`) is [`HighlightPriority::Cleared`]: no
//!   discs whatever the frame carries, until the next `setHighlight` writer
//!   (`selectPlayerUnit` / `refreshBuildHighlight`).
//!
//! No game rules here: only the order of the pin calls and the conversions.

use civ_view_model as vm;

use super::convert::{owner_i64, pick_hex, unit_id_string};
use super::overlays::MapUiState;
use crate::map_units::consts::{HIGHLIGHT_OPACITY, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY};
use crate::map_units::{MapUnitRenderer, PathRouteOptions, TurnStop};
use crate::models::unit_core::registry::NotYetPorted;
use crate::pick::hex::HexCoord;

/// Where the single highlight layer of [`MapUnitRenderer`] comes from.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HighlightSource {
    /// `overlays.reachable` (`main.ts:7125`).
    Reachable,
    /// `overlays.build_highlight` of the given kind (`main.ts:16351-16396`).
    Build(vm::BuildHighlightKind),
}

/// The highlight layer call of one snapshot.
#[derive(Debug, Clone, PartialEq)]
pub enum UnitHighlight {
    /// `clearHighlight()`.
    Clear,
    /// `setHighlight(hexes, opacity)`.
    Set {
        /// Which DTO field the hexes come from.
        source: HighlightSource,
        /// Hexes in DTO (`Set`) order.
        hexes: Vec<HexCoord>,
        /// `opacity`.
        opacity: f64,
    },
}

/// `refreshBuildHighlight` branch → highlight call; `None` = no build layer
/// (empty `hexes`, contract §3.7).
fn build_highlight_call(dto: &vm::BuildHighlightDto) -> Option<UnitHighlight> {
    if dto.hexes.is_empty() {
        return None;
    }
    let opacity = match dto.kind {
        // `unitRenderer.clearHighlight(); refreshMineEligibleOverlay(hexes)`
        // (`main.ts:16386-16390`).
        vm::BuildHighlightKind::Mine => return Some(UnitHighlight::Clear),
        // `setHighlight(qual)` / `setHighlight(new Set(...))` (`:16360`, `:16366`).
        vm::BuildHighlightKind::FoundCity | vm::BuildHighlightKind::Wonder => HIGHLIGHT_OPACITY,
        // `setHighlight(..., IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`).
        vm::BuildHighlightKind::Improvement => IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
    };
    Some(UnitHighlight::Set {
        source: HighlightSource::Build(dto.kind),
        hexes: dto.hexes.iter().copied().map(pick_hex).collect(),
        opacity,
    })
}

/// Which call wrote the single highlight layer last (decision D-371-5b in
/// the module header). The client keeps it (`highlight_last_writer`); the
/// frame DTO does not carry it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum HighlightPriority {
    /// `refreshBuildHighlight` wrote last (`main.ts:16351-16396`): decision
    /// Q6-2 (build highlight first). The behaviour without a client state.
    #[default]
    Build,
    /// `selectPlayerUnit` wrote last (`main.ts:7253-7261`): the reachable
    /// range, also when it is empty (= no discs, decision D-371-5c U-OP-1).
    Reachable,
    /// `clearHighlight()` wrote last (decision D-371-5c U-OP-3 / U-OP-4):
    /// `clearPlayerUnitSelection` (`main.ts:7090-7101`) or
    /// `refreshBuildHighlight` outside build mode after `exitBuildMode`
    /// (`:16369-16372`, `:16526-16541`): no discs.
    Cleared,
}

/// The reachable call of `selectPlayerUnit` / `syncPlayerUnitSelectionOnMap`
/// (`main.ts:7253-7261`, `:7120-7125`); `None` = empty `reachable`.
fn reachable_call(
    overlays: &vm::OverlaysViewDto,
    siege_map_panel_open: bool,
) -> Option<UnitHighlight> {
    if overlays.reachable.is_empty() {
        return None;
    }
    if siege_map_panel_open {
        return Some(UnitHighlight::Clear);
    }
    Some(UnitHighlight::Set {
        source: HighlightSource::Reachable,
        hexes: overlays.reachable.iter().copied().map(pick_hex).collect(),
        opacity: HIGHLIGHT_OPACITY,
    })
}

/// The single highlight layer of the snapshot.
///
/// - [`HighlightPriority::Build`] (decision Q6-2 in the module header): build
///   highlight first, then `reachable` unless the siege map panel is open
///   (`main.ts:7120-7122`), else `clearHighlight()`;
/// - [`HighlightPriority::Reachable`] (decisions D-371-5b, D-371-5c U-OP-1):
///   `reachable` only (`clearHighlight()` with the siege map panel open); an
///   empty `reachable` is `setHighlight(new Set())` = `clearHighlight()`
///   (`main.ts:7256-7261`), the build layer is never shown;
/// - [`HighlightPriority::Cleared`] (decision D-371-5c U-OP-3 / U-OP-4):
///   `clearHighlight()`.
#[must_use]
pub fn unit_highlight(
    overlays: &vm::OverlaysViewDto,
    siege_map_panel_open: bool,
    priority: HighlightPriority,
) -> UnitHighlight {
    let build = || build_highlight_call(&overlays.build_highlight);
    let reach = || reachable_call(overlays, siege_map_panel_open);
    let first = match priority {
        HighlightPriority::Build => build().or_else(reach),
        // `selectPlayerUnit`: `setHighlight(reachable)` also for an empty set
        // (`main.ts:7256-7261`), D-371-5c U-OP-1.
        HighlightPriority::Reachable => reach(),
        // `clearHighlight()` (`main.ts:7100`, `:16371`), D-371-5c U-OP-3/4.
        HighlightPriority::Cleared => None,
    };
    first.unwrap_or(UnitHighlight::Clear)
}

/// `setSelectionHex(q, r, ownerId)` arguments (`main.ts:7119`).
#[must_use]
pub fn selection_input(selection: Option<&vm::SelectionDto>) -> Option<(HexCoord, i64)> {
    selection.map(|s| (pick_hex(s.hex), owner_i64(s.owner_id)))
}

/// `setPathRoute(hexes, { turnStops })` arguments (`main.ts:31175-31178`):
/// the DTO hexes already start with the unit hex; every turn stop is passed
/// as is (`turnLabel` is not set by these call sites).
#[must_use]
pub fn path_route_input(
    route: Option<&vm::overlays::PathRouteDto>,
) -> Option<(Vec<HexCoord>, PathRouteOptions)> {
    let route = route?;
    let hexes = route.hexes.iter().copied().map(pick_hex).collect();
    let turn_stops = route
        .turn_stops
        .iter()
        .map(|s| TurnStop {
            hex: pick_hex(s.hex),
            turn: s.turn,
        })
        .collect();
    Some((
        hexes,
        PathRouteOptions {
            turn_label: None,
            turn_stops,
        },
    ))
}

/// The unit overlays of one snapshot as renderer calls (part of
/// [`super::OverlayLayers`]).
#[derive(Debug, Clone, PartialEq)]
pub struct UnitOverlayInputs {
    /// [`unit_highlight`].
    pub highlight: UnitHighlight,
    /// [`selection_input`].
    pub selection: Option<(HexCoord, i64)>,
    /// [`path_route_input`].
    pub path_route: Option<(Vec<HexCoord>, PathRouteOptions)>,
}

impl UnitOverlayInputs {
    /// The renderer calls of `overlays` (siege map panel closed: it is not
    /// part of [`MapUiState`]; see [`Self::with_siege_map_panel_open`]), with
    /// [`HighlightPriority::Build`] (decision Q6-2).
    #[must_use]
    pub fn from_overlays(overlays: &vm::OverlaysViewDto) -> Self {
        Self::from_overlays_with_priority(overlays, HighlightPriority::Build)
    }

    /// As [`Self::from_overlays`] with the highlight layer chosen by
    /// `priority` (decision D-371-5b). The selection ring and the route do
    /// not depend on `priority`.
    #[must_use]
    pub fn from_overlays_with_priority(
        overlays: &vm::OverlaysViewDto,
        priority: HighlightPriority,
    ) -> Self {
        Self {
            highlight: unit_highlight(overlays, false, priority),
            selection: selection_input(overlays.selection.as_ref()),
            path_route: path_route_input(overlays.path_route.as_ref()),
        }
    }

    /// `isSiegeMapPanelOpen()` (`main.ts:7120-7122`): the reachable range is
    /// cleared; a build highlight stays (it comes from another call site).
    #[must_use]
    pub fn with_siege_map_panel_open(mut self, open: bool) -> Self {
        if open
            && matches!(
                self.highlight,
                UnitHighlight::Set {
                    source: HighlightSource::Reachable,
                    ..
                }
            )
        {
            self.highlight = UnitHighlight::Clear;
        }
        self
    }

    /// Applies the calls to the renderer, in the pin order of
    /// `syncPlayerUnitSelectionOnMap` (`main.ts:7119-7132`): selection ring,
    /// highlight, route.
    pub fn apply(&self, renderer: &mut MapUnitRenderer) {
        match self.selection {
            Some((hex, owner)) => renderer.set_selection_hex(hex, owner),
            None => renderer.clear_selection_hex(),
        }
        match &self.highlight {
            UnitHighlight::Clear => renderer.clear_highlight(),
            UnitHighlight::Set { hexes, opacity, .. } => renderer.set_highlight(hexes, *opacity),
        }
        match &self.path_route {
            Some((hexes, opts)) => renderer.set_path_route(hexes, opts),
            None => renderer.clear_path_route(),
        }
    }
}

/// `units[]` + `stacks` → [`MapUnitRenderer::sync`], after
/// `setForceVisibleUnitId` from [`MapUiState::force_visible_unit_id`].
///
/// # Errors
///
/// [`NotYetPorted`] from [`MapUnitRenderer::sync`].
pub fn sync_units(
    renderer: &mut MapUnitRenderer,
    units: &[vm::UnitViewDto],
    stacks: &vm::StackViewDto,
    ui: &MapUiState,
) -> Result<(), NotYetPorted> {
    renderer.set_force_visible_unit_id(ui.force_visible_unit_id.map(unit_id_string));
    renderer.sync(units, Some(stacks))
}
