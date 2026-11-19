//! `civ-client` (T2 `R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E`, #371): the client
//! core between the engine bridge and the CPU map renderer, without Tauri and
//! without GPU (decisions D-371-1, D-371-3, D-371-4, D-371-7).
//!
//! The client owns only
//! - the UI state of the map ([`ClientUiState`], D-371-3),
//! - the refresh rule (when to ask the engine for a frame, D-371-4),
//! - the cache of the static map ([`MapStatic`]) and of the LAST frame DTO
//!   ([`RenderLayersDto`]), and
//! - the renderer CPU state ([`MapScene`]) fed through
//!   [`civ_renderer::view::frame`].
//!
//! It keeps NO game state: every game fact reaches it as the DTO of one
//! `GetRenderFrame` answer and is passed to the renderer as is.
//!
//! The bridge (`rust-port/engine/src/bridge.rs`) is not a module of the
//! `civ-engine` library: every consumer includes its own copy through
//! `#[path]` (`src-tauri/src/lib.rs`, the engine tests, this crate's test), so
//! its types (`EngineBridge`, `BridgeResult`, ...) have a different identity in
//! every crate. The client therefore talks to the bridge through the trait
//! [`RenderSource`] over the payload types of the library
//! ([`RenderMapPayload`], [`RenderFramePayload`], [`RenderUiParams`],
//! `civ_engine::domain::render_frame`), which have one identity; the caller
//! (`src-tauri`, the test) implements it over its `EngineBridge` (D-371-1).
//!
//! Refresh rule (D-371-4), pin `07d2fbd72` (`gra/src/main.ts`):
//! - `GetRenderMap` once after a successful `CreateSession`
//!   ([`RenderClient::on_session_created`]); the pin builds the map scene once
//!   per game (`main.ts:2173`, `:44769`);
//! - `GetRenderFrame` after every bridge answer carrying `StateChanged`
//!   ([`RenderClient::on_state_changed`]; the pin refreshes the layers after
//!   the mutations, e.g. the full refresh after a load `main.ts:46138-46156`,
//!   `refreshFog()` from ~69 places) and after every change of
//!   [`RenderUiParams`] ([`RenderClient::set_frame_ui`]; selection, hover and
//!   the build modes enter the frame: `syncPlayerUnitSelectionOnMap`
//!   `:7115-7135`, `refreshBuildHighlight` `:16351-16396`);
//! - a change of [`MapUiState`] or of `isSiegeMapPanelOpen()` alone does NOT
//!   call the engine: the frame is composed again from the cached DTO
//!   ([`RenderClient::set_map_ui`], [`RenderClient::set_siege_map_panel_open`]).
//!   In the pin the toggles only redraw their overlay from the game state
//!   already held by the client (`toggleTradeRoutesOverlayOnMap` →
//!   `refreshTradeRoutesOverlay`, `main.ts:15411-15416`;
//!   `toggleWorkerOverlayOnMap` → `refreshWorkerFieldOverlay`, `:15465-15469`;
//!   `refreshMapOverlayToggles`, `:15459-15463`), and the siege map panel gate
//!   is read by the renderer only (`:7120-7122`).
//!
//! Highlight writer (decision D-371-5b, #371 T5b): the pin has ONE
//! `unitRenderer.setHighlight` layer and the last call wins
//! (`selectPlayerUnit` writes the reachable range, `main.ts:7253-7261`;
//! `refreshBuildHighlight` writes the build set, `:16351-16396`). Since T5a
//! the frame can carry both (`RenderUiParams::unit_selected_after_build_open`),
//! so the client keeps the last writer ([`ClientUiState::highlight_last_writer`])
//! and passes it to the renderer ([`FrameInputs::from_dto_with_priority`]):
//! - [`RenderClient::select_unit`] in build mode (open panel, `foundCityMode`,
//!   `activeWonderId` or an improvement key): `selected_unit_id`, flag
//!   `unit_selected_after_build_open = true`, writer
//!   [`HighlightPriority::Reachable`]; outside build mode a plain selection
//!   (flag `false`);
//! - [`RenderClient::set_active_improvement_key`] (`onSelectType` then
//!   `refreshBuildHighlight`, `:26733-26739`): writer
//!   [`HighlightPriority::Build`]; the flag and `selected_unit_id` are kept
//!   (the pin does not clear the selection on a key change); a `Some` key
//!   switches found city and the wonder off, as `onSelectType` does;
//! - [`RenderClient::set_build_mode`] (open/close of the panel, found city,
//!   wonder): writer [`HighlightPriority::Build`]; opening or closing the
//!   panel clears the selection and zeroes the flag (`onOpenBuild` calls
//!   `clearPlayerUnitSelection()`, `:26702-26703`); found city on or a
//!   wonder switch clears the improvement key (`:26758-26770`) and keeps the
//!   selection and the flag (decision D-371-5c U-OP-2: `onSelectFoundCity` /
//!   `onSelectWonder` do not clear the selection, `:26758-26793`);
//! - [`RenderClient::exit_build_mode`] (`exitBuildMode`, Escape / right
//!   click / `onExit`, `:16526-16541`): the build mode closes, the selection
//!   stays, writer [`HighlightPriority::Cleared`] (decision D-371-5c U-OP-3);
//! - [`RenderClient::select_unit`]`(None)` (`clearPlayerUnitSelection`,
//!   `:7090-7101`): writer [`HighlightPriority::Cleared`] (decision D-371-5c
//!   U-OP-4);
//! - [`RenderClient::set_highlight_last_writer`]: the writer alone never calls
//!   the engine (D-371-4): the cached frame is composed again.
//!
//! In build mode ([`in_build_mode`]) the last `refreshBuildHighlight` never
//! shows the reachable range: an empty build set is `setHighlight(new Set())`
//! or `clearHighlight()` (`:16351-16372`). The client therefore passes
//! [`HighlightPriority::Cleared`] to the renderer for the writer
//! [`HighlightPriority::Build`] in build mode with an empty
//! `overlays.build_highlight` ([`renderer_priority`], decision D-T5C-5); the
//! renderer default Q6-2 (build, else reachable) stays for frames outside
//! build mode.
//!
//! Seat: the client always asks for the active seat (`seat = None` = web
//! `ME()`, `bridge.rs` `GetRenderFrame`), see [`VIEWER_SEAT`].

use std::fmt;

use civ_engine::domain::overlays_view::build_highlight_mode_active;
pub use civ_engine::domain::render_frame::{RenderFramePayload, RenderMapPayload, RenderUiParams};
pub use civ_renderer::terrain::MapDetailQuality;
pub use civ_renderer::view::units::HighlightPriority;
pub use civ_renderer::view::{FrameError, FrameInputs, MapScene, MapStatic, MapUiState};
use civ_view_model::RenderLayersDto;

/// The seat of every `GetRenderFrame` of the client: `None` = the active human
/// seat of the session (web `ME()`; `EngineCommand::GetRenderFrame`,
/// `bridge.rs`; `session_render_frame` defaults to `fog.active_seat`).
pub const VIEWER_SEAT: Option<u64> = None;

// ------------------------------------------------------------ UI state

/// The one UI state of the client (decision D-371-3).
///
/// - [`Self::frame_ui`] is what the web keeps in `selectedId`, `hoverKey`,
///   `foundCityMode`, `activeWonderId`, `buildModeOpen`, `activeImprovementKey`
///   and the engine needs to compose the frame (`render_frame.rs`
///   `RenderUiParams`);
/// - [`Self::map_ui`] is the pure drawing gates of the renderer
///   (`territoryBorderVisible`, `showTradeRoutesOverlay`, `showWorkerOverlay`,
///   `isCityPanelOpen()`, `cityPanelViewCityId`, `forceVisibleUnitId`,
///   `statChipHoverCityId`); the engine never receives it;
/// - [`Self::siege_map_panel_open`] is `isSiegeMapPanelOpen()` (`main.ts:7120`),
///   read by the renderer only
///   ([`civ_renderer::view::UnitOverlayInputs::with_siege_map_panel_open`]);
/// - [`Self::highlight_last_writer`] is the last writer of the single
///   `setHighlight` layer (decision D-371-5b), read by the renderer only.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClientUiState {
    /// UI parameters of `GetRenderFrame`.
    pub frame_ui: RenderUiParams,
    /// UI gates of the renderer.
    pub map_ui: MapUiState,
    /// `isSiegeMapPanelOpen()`.
    pub siege_map_panel_open: bool,
    /// Last writer of `unitRenderer.setHighlight` (D-371-5b).
    pub highlight_last_writer: HighlightPriority,
}

/// The build mode switches of `onOpenBuild` / `exitBuildMode` /
/// `onSelectFoundCity` / `onSelectWonder` (`main.ts:26702-26793`,
/// `:16526-16541`): web `buildModeOpen`, `foundCityMode`, `!!activeWonderId`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct BuildMode {
    /// `buildModeOpen`.
    pub build_mode_open: bool,
    /// `foundCityMode`.
    pub found_city_mode: bool,
    /// `!!activeWonderId`.
    pub wonder_active: bool,
}

impl BuildMode {
    /// The build mode switches of `ui`.
    #[must_use]
    pub const fn of(ui: &RenderUiParams) -> Self {
        Self {
            build_mode_open: ui.build_mode_open,
            found_city_mode: ui.found_city_mode,
            wonder_active: ui.wonder_active,
        }
    }
}

/// The engine build branch of the frame (`render_frame.rs`: `build_mode_open
/// || build_highlight_mode_active`): open panel, found city, wonder, or an
/// improvement key with the panel open.
#[must_use]
pub fn in_build_mode(ui: &RenderUiParams) -> bool {
    ui.build_mode_open || build_highlight_mode_active(&ui.build_ui())
}

impl ClientUiState {
    /// The start state of the pin: no selection, no hover, no build mode
    /// ([`RenderUiParams::default`]), [`MapUiState::WEB_INITIAL`], siege map
    /// panel closed, highlight writer [`HighlightPriority::Build`] (decision
    /// Q6-2, the renderer default).
    #[must_use]
    pub fn web_initial() -> Self {
        Self {
            frame_ui: RenderUiParams::default(),
            map_ui: MapUiState::WEB_INITIAL,
            siege_map_panel_open: false,
            highlight_last_writer: HighlightPriority::Build,
        }
    }
}

impl Default for ClientUiState {
    /// [`Self::web_initial`].
    fn default() -> Self {
        Self::web_initial()
    }
}

/// The priority passed to the renderer for `frame` (decision D-T5C-5): the
/// writer [`HighlightPriority::Build`] in build mode ([`in_build_mode`]) with
/// an empty `overlays.build_highlight` is [`HighlightPriority::Cleared`]: the
/// last `refreshBuildHighlight` wrote `setHighlight(new Set())` (found city /
/// wonder, `main.ts:16360`, `:16366`; improvement, `:16392-16395`) or
/// `clearHighlight()` (no key, `:16369-16372`), never the reachable range
/// the frame may carry with `unit_selected_after_build_open`. Every other
/// case is [`ClientUiState::highlight_last_writer`] as is.
#[must_use]
pub fn renderer_priority(ui: &ClientUiState, frame: &RenderLayersDto) -> HighlightPriority {
    let writer = ui.highlight_last_writer;
    if writer == HighlightPriority::Build
        && in_build_mode(&ui.frame_ui)
        && frame.overlays.build_highlight.hexes.is_empty()
    {
        return HighlightPriority::Cleared;
    }
    writer
}

// ------------------------------------------------------------ bridge seam

/// The two read-only bridge queries the client needs (D-371-1). The caller
/// implements it over its own `EngineBridge` by sending
/// `EngineCommand::GetRenderMap` / `EngineCommand::GetRenderFrame { seat, ui }`
/// through `EngineBridge::handle` and unwrapping `BridgeResult::RenderMap` /
/// `BridgeResult::RenderFrame`.
pub trait RenderSource {
    /// Error of the source (the bridge error in the shell and in the test).
    type Error;

    /// `GetRenderMap`.
    ///
    /// # Errors
    ///
    /// The source error (no session, rejected query, transport).
    fn render_map(&mut self) -> Result<RenderMapPayload, Self::Error>;

    /// `GetRenderFrame { seat, ui }`.
    ///
    /// # Errors
    ///
    /// The source error (no session, unknown seat, rejected query, transport).
    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, Self::Error>;
}

// ------------------------------------------------------------ errors

/// Why the client could not refresh. Nothing is defaulted or skipped.
#[derive(Debug, Clone, PartialEq)]
pub enum ClientError<E> {
    /// A frame was asked for before [`RenderClient::on_session_created`]
    /// (no static map): no engine call was made.
    NoSession,
    /// The [`RenderSource`] failed.
    Source(E),
    /// The renderer adapters rejected the DTO ([`FrameError`]).
    Frame(FrameError),
}

impl<E: fmt::Display> fmt::Display for ClientError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoSession => write!(f, "no render map: on_session_created was not called"),
            Self::Source(e) => write!(f, "render source: {e}"),
            Self::Frame(e) => write!(f, "render frame: {e}"),
        }
    }
}

impl<E: fmt::Debug + fmt::Display> std::error::Error for ClientError<E> {}

// ------------------------------------------------------------ client

/// The client: UI state + refresh rule + DTO cache + renderer CPU state.
#[derive(Debug)]
pub struct RenderClient<S> {
    source: S,
    detail: MapDetailQuality,
    ui: ClientUiState,
    /// `GetRenderMap` of the current session.
    map: Option<MapStatic>,
    /// Cache of the last `GetRenderFrame` DTO taken by the renderer.
    frame: Option<RenderFramePayload>,
    /// The renderer inputs of the last applied composition.
    inputs: Option<FrameInputs>,
    /// The renderer state; built from the first frame of a session.
    scene: Option<MapScene>,
}

impl<S: RenderSource> RenderClient<S> {
    /// A client without a session, with [`ClientUiState::web_initial`].
    /// `detail` is the `mapDetailQuality` of the terrain build.
    #[must_use]
    pub fn new(source: S, detail: MapDetailQuality) -> Self {
        Self {
            source,
            detail,
            ui: ClientUiState::web_initial(),
            map: None,
            frame: None,
            inputs: None,
            scene: None,
        }
    }

    /// The source.
    #[must_use]
    pub const fn source(&self) -> &S {
        &self.source
    }

    /// The source, e.g. to send game commands through the same bridge.
    pub fn source_mut(&mut self) -> &mut S {
        &mut self.source
    }

    /// The UI state.
    #[must_use]
    pub const fn ui(&self) -> &ClientUiState {
        &self.ui
    }

    /// The static map of the session (`None` before
    /// [`Self::on_session_created`]).
    #[must_use]
    pub const fn map(&self) -> Option<&MapStatic> {
        self.map.as_ref()
    }

    /// The cached DTO of the last frame taken by the renderer.
    #[must_use]
    pub fn last_frame(&self) -> Option<&RenderLayersDto> {
        self.frame.as_ref().map(|f| &f.0)
    }

    /// The renderer inputs of the last composition.
    #[must_use]
    pub const fn frame_inputs(&self) -> Option<&FrameInputs> {
        self.inputs.as_ref()
    }

    /// The renderer CPU state (`None` before the first frame of a session).
    #[must_use]
    pub const fn scene(&self) -> Option<&MapScene> {
        self.scene.as_ref()
    }

    /// The renderer CPU state, for the resolvers [`MapScene`] does not set
    /// ([`MapScene::units_mut`]).
    pub fn scene_mut(&mut self) -> Option<&mut MapScene> {
        self.scene.as_mut()
    }

    /// After a successful `CreateSession`: `GetRenderMap` and
    /// [`MapStatic::from_dto`]. The frame cache and the renderer state of the
    /// previous session are dropped (the next frame builds a new scene). The UI
    /// state is kept as it is (the caller sets it).
    ///
    /// # Errors
    ///
    /// [`ClientError::Source`] from `GetRenderMap`; [`ClientError::Frame`]
    /// when the map fails validation. The previous session state is dropped
    /// in both cases (no frame can be shown on a map that failed).
    pub fn on_session_created(&mut self) -> Result<(), ClientError<S::Error>> {
        self.map = None;
        self.frame = None;
        self.inputs = None;
        self.scene = None;
        let map = self.source.render_map().map_err(ClientError::Source)?;
        self.map = Some(MapStatic::from_dto(&map.0).map_err(ClientError::Frame)?);
        Ok(())
    }

    /// After every bridge answer carrying `StateChanged`: `GetRenderFrame`
    /// with the current [`ClientUiState::frame_ui`] for [`VIEWER_SEAT`], then
    /// the renderer is fed ([`FrameInputs::from_dto`] + [`MapScene::apply`]).
    ///
    /// # Errors
    ///
    /// [`ClientError::NoSession`] before [`Self::on_session_created`] (no
    /// engine call); [`ClientError::Source`]; [`ClientError::Frame`]. On an
    /// error the cache keeps the previous frame.
    pub fn on_state_changed(&mut self) -> Result<(), ClientError<S::Error>> {
        if self.map.is_none() {
            return Err(ClientError::NoSession);
        }
        let frame = self
            .source
            .render_frame(VIEWER_SEAT, Some(self.ui.frame_ui.clone()))
            .map_err(ClientError::Source)?;
        self.present(frame)
    }

    /// Sets the frame UI parameters. A change asks the engine for a new frame
    /// (they enter `GetRenderFrame`, D-371-4); an equal value does nothing.
    /// Before [`Self::on_session_created`] the value is only stored.
    ///
    /// # Errors
    ///
    /// As [`Self::on_state_changed`] (never [`ClientError::NoSession`]).
    pub fn set_frame_ui(&mut self, frame_ui: RenderUiParams) -> Result<(), ClientError<S::Error>> {
        if frame_ui == self.ui.frame_ui {
            return Ok(());
        }
        self.ui.frame_ui = frame_ui;
        if self.map.is_none() {
            return Ok(());
        }
        self.on_state_changed()
    }

    /// Sets the renderer UI gates. Never calls the engine (D-371-4): the
    /// cached frame is composed again and applied. Before the first frame the
    /// value is only stored.
    ///
    /// # Errors
    ///
    /// [`ClientError::Frame`] from the adapters.
    pub fn set_map_ui(&mut self, map_ui: MapUiState) -> Result<(), ClientError<S::Error>> {
        self.ui.map_ui = map_ui;
        self.recompose()
    }

    /// Sets `isSiegeMapPanelOpen()`. Never calls the engine (D-371-4), as
    /// [`Self::set_map_ui`].
    ///
    /// # Errors
    ///
    /// [`ClientError::Frame`] from the adapters.
    pub fn set_siege_map_panel_open(&mut self, open: bool) -> Result<(), ClientError<S::Error>> {
        self.ui.siege_map_panel_open = open;
        self.recompose()
    }

    /// Sets the whole UI state: when [`ClientUiState::frame_ui`] changes, the
    /// engine is asked for a new frame ([`Self::set_frame_ui`]); otherwise the
    /// cached frame is composed again ([`Self::set_map_ui`]).
    ///
    /// # Errors
    ///
    /// As [`Self::set_frame_ui`] / [`Self::set_map_ui`].
    pub fn set_ui(&mut self, ui: ClientUiState) -> Result<(), ClientError<S::Error>> {
        let ClientUiState {
            frame_ui,
            map_ui,
            siege_map_panel_open,
            highlight_last_writer,
        } = ui;
        self.ui.map_ui = map_ui;
        self.ui.siege_map_panel_open = siege_map_panel_open;
        self.ui.highlight_last_writer = highlight_last_writer;
        if frame_ui == self.ui.frame_ui || self.map.is_none() {
            self.ui.frame_ui = frame_ui;
            return self.recompose();
        }
        self.set_frame_ui(frame_ui)
    }

    /// `selectPlayerUnit` / `clearPlayerUnitSelection` (`main.ts:7233-7269`,
    /// `:7090-7106`), decision D-371-5b:
    /// - `Some(id)` in build mode ([`in_build_mode`]): `selected_unit_id`,
    ///   `unit_selected_after_build_open = true` (the pin does not close the
    ///   build mode), writer [`HighlightPriority::Reachable`];
    /// - `Some(id)` outside build mode: a plain selection, flag `false`,
    ///   writer [`HighlightPriority::Reachable`] (there is no build layer);
    /// - `None` (`clearPlayerUnitSelection` -> `clearPlayerUnitSelectionStateOnly`,
    ///   `:7090-7101`): `selected_unit_id = None`, flag `false` (no unit is
    ///   selected), writer [`HighlightPriority::Cleared`] (`unitRenderer
    ///   .clearHighlight()`, `:7100`; decision D-371-5c U-OP-4); the build
    ///   mode is kept (the pin does not touch it).
    ///
    /// A change of [`RenderUiParams`] asks the engine (D-371-4); a change of
    /// the writer alone composes the cached frame again.
    ///
    /// # Errors
    ///
    /// As [`Self::set_frame_ui`] / [`Self::set_highlight_last_writer`].
    pub fn select_unit(&mut self, unit_id: Option<u64>) -> Result<(), ClientError<S::Error>> {
        let mut frame_ui = self.ui.frame_ui.clone();
        let build = in_build_mode(&frame_ui);
        frame_ui.selected_unit_id = unit_id;
        let writer = if unit_id.is_some() {
            frame_ui.unit_selected_after_build_open = build;
            HighlightPriority::Reachable
        } else {
            // `clearPlayerUnitSelectionStateOnly` (`main.ts:7097-7101`):
            // `selectedId = null; ...; unitRenderer.clearHighlight()`.
            frame_ui.unit_selected_after_build_open = false;
            HighlightPriority::Cleared
        };
        self.update_ui(frame_ui, writer)
    }

    /// `onOpenBuild` / `onSelectFoundCity` / `onSelectWonder`
    /// (`main.ts:26702-26793`): the writer becomes [`HighlightPriority::Build`]
    /// (`refreshBuildHighlight` runs after each, decision D-371-5b); closing
    /// the panel makes it [`HighlightPriority::Cleared`] (`exitBuildMode` ->
    /// `clearHighlight()`, `:16369-16372`, D-T5C-7).
    /// Opening or closing the panel (`build_mode_open` changes) clears the
    /// selection and zeroes `unit_selected_after_build_open` (`onOpenBuild`
    /// calls `clearPlayerUnitSelection()`, `:26702-26703`); closing it clears
    /// the improvement key (`exitBuildMode`, `:16533-16536`). Switching found
    /// city on (`onSelectFoundCity`, `:26758-26762`) or changing the wonder
    /// switch (`onSelectWonder`, `:26767-26770`) clears the improvement key
    /// and keeps the selection and the flag: neither handler calls
    /// `clearPlayerUnitSelection()` (`:26758-26793`, decision D-371-5c
    /// U-OP-2). An equal value does nothing. Escape / right click
    /// (`exitBuildMode` without `clearPlayerUnitSelection`) is
    /// [`Self::exit_build_mode`].
    ///
    /// # Errors
    ///
    /// As [`Self::set_frame_ui`].
    pub fn set_build_mode(&mut self, mode: BuildMode) -> Result<(), ClientError<S::Error>> {
        let current = BuildMode::of(&self.ui.frame_ui);
        if mode == current {
            return Ok(());
        }
        let mut frame_ui = self.ui.frame_ui.clone();
        if mode.build_mode_open != current.build_mode_open {
            // `onOpenBuild`: `clearPlayerUnitSelection()` (`:26703`).
            frame_ui.selected_unit_id = None;
            frame_ui.unit_selected_after_build_open = false;
            if !mode.build_mode_open {
                frame_ui.active_improvement_key = None;
            }
        }
        // `onSelectFoundCity` (`:26758-26762`) and `onSelectWonder`
        // (`:26767-26770`) set `activeImprovementKey = null`.
        if (mode.found_city_mode && !current.found_city_mode)
            || mode.wonder_active != current.wonder_active
        {
            frame_ui.active_improvement_key = None;
        }
        frame_ui.build_mode_open = mode.build_mode_open;
        frame_ui.found_city_mode = mode.found_city_mode;
        frame_ui.wonder_active = mode.wonder_active;
        // Closing the panel (`onOpenBuild` with `buildModeOpen`,
        // `:26702-26706`) runs `clearPlayerUnitSelection()` then
        // `exitBuildMode()`, whose `refreshBuildHighlight()` outside build
        // mode is `clearHighlight()` (`:16369-16372`): the last writer is
        // Cleared, as in [`Self::exit_build_mode`] (U-EV-2, D-T5C-7).
        let writer = if current.build_mode_open && !mode.build_mode_open {
            HighlightPriority::Cleared
        } else {
            HighlightPriority::Build
        };
        self.update_ui(frame_ui, writer)
    }

    /// `exitBuildMode()` (`main.ts:16526-16541`; Escape through the
    /// `build-mode` overlay `:16544`, `buildMode.onExit`, `:26742`):
    /// `buildModeOpen = false; foundCityMode = false; activeImprovementKey =
    /// null; activeWonderId = null`, then `refreshBuildHighlight()`, which
    /// outside build mode is `clearHighlight()` (`:16369-16372`). The
    /// selection is NOT cleared (the pin does not call
    /// `clearPlayerUnitSelection()`, decision D-371-5c U-OP-3);
    /// `unit_selected_after_build_open` is zeroed (the build mode is closed,
    /// D-371-5b); the writer becomes [`HighlightPriority::Cleared`]: the ring
    /// stays, no discs, until the next writer (`selectPlayerUnit` =
    /// [`Self::select_unit`]). The guard `isAwaitingFirstPlayerCity()`
    /// (`:16532`) is game state: the caller does not call this method while
    /// it holds.
    ///
    /// A [`RenderUiParams`] change asks the engine (D-371-4); otherwise only
    /// the writer changes and the cached frame is composed again.
    ///
    /// # Errors
    ///
    /// As [`Self::set_frame_ui`] / [`Self::set_highlight_last_writer`].
    pub fn exit_build_mode(&mut self) -> Result<(), ClientError<S::Error>> {
        let mut frame_ui = self.ui.frame_ui.clone();
        frame_ui.build_mode_open = false;
        frame_ui.found_city_mode = false;
        frame_ui.active_improvement_key = None;
        frame_ui.wonder_active = false;
        frame_ui.unit_selected_after_build_open = false;
        self.update_ui(frame_ui, HighlightPriority::Cleared)
    }

    /// `onSelectType(key)` then `refreshBuildHighlight()`
    /// (`main.ts:26733-26739`): a change of the improvement key makes
    /// [`HighlightPriority::Build`] the writer; `unit_selected_after_build_open`
    /// and `selected_unit_id` are kept (decision D-371-5b: the pin does not
    /// clear the selection on a key change). A `Some` key also switches found
    /// city and the wonder off, as `onSelectType` does (`foundCityMode =
    /// false; activeWonderId = null`, `:26735-26736`), without zeroing the
    /// flag (the pin keeps the selection ring). An equal key does nothing.
    ///
    /// # Errors
    ///
    /// As [`Self::set_frame_ui`].
    pub fn set_active_improvement_key(
        &mut self,
        key: Option<String>,
    ) -> Result<(), ClientError<S::Error>> {
        if key == self.ui.frame_ui.active_improvement_key {
            return Ok(());
        }
        let mut frame_ui = self.ui.frame_ui.clone();
        if key.is_some() {
            frame_ui.found_city_mode = false;
            frame_ui.wonder_active = false;
        }
        frame_ui.active_improvement_key = key;
        self.update_ui(frame_ui, HighlightPriority::Build)
    }

    /// Sets the last writer of the highlight layer (e.g. `refreshBuildHighlight`
    /// without a change of [`RenderUiParams`]). Never calls the engine
    /// (D-371-4): the cached frame is composed again. An equal value does
    /// nothing.
    ///
    /// # Errors
    ///
    /// [`ClientError::Frame`] from the adapters.
    pub fn set_highlight_last_writer(
        &mut self,
        writer: HighlightPriority,
    ) -> Result<(), ClientError<S::Error>> {
        if writer == self.ui.highlight_last_writer {
            return Ok(());
        }
        self.ui.highlight_last_writer = writer;
        self.recompose()
    }

    /// New frame UI + writer: a [`RenderUiParams`] change asks the engine
    /// (composed with the new writer); a writer change alone recomposes.
    fn update_ui(
        &mut self,
        frame_ui: RenderUiParams,
        writer: HighlightPriority,
    ) -> Result<(), ClientError<S::Error>> {
        if frame_ui != self.ui.frame_ui {
            self.ui.highlight_last_writer = writer;
            return self.set_frame_ui(frame_ui);
        }
        self.set_highlight_last_writer(writer)
    }

    /// The cached frame with the current UI state, applied to the renderer.
    fn recompose(&mut self) -> Result<(), ClientError<S::Error>> {
        let Some(frame) = self.frame.take() else {
            return Ok(());
        };
        let result = self.present_ref(&frame);
        self.frame = Some(frame);
        result
    }

    /// Feeds the renderer with `frame` and caches it on success.
    fn present(&mut self, frame: RenderFramePayload) -> Result<(), ClientError<S::Error>> {
        self.present_ref(&frame)?;
        self.frame = Some(frame);
        Ok(())
    }

    fn present_ref(&mut self, frame: &RenderFramePayload) -> Result<(), ClientError<S::Error>> {
        let Some(map) = self.map.as_ref() else {
            return Err(ClientError::NoSession);
        };
        let inputs = FrameInputs::from_dto_with_priority(
            map,
            &frame.0,
            &self.ui.map_ui,
            self.ui.siege_map_panel_open,
            renderer_priority(&self.ui, &frame.0),
        )
        .map_err(ClientError::Frame)?;
        let detail = self.detail;
        let scene = self
            .scene
            .get_or_insert_with(|| MapScene::new(map, &inputs, detail));
        scene.apply(&inputs).map_err(ClientError::Frame)?;
        self.inputs = Some(inputs);
        Ok(())
    }
}
