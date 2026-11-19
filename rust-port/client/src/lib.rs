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
    /// The running siege battle (P4-1I6).
    battle: Option<SiegeBattleView>,
    /// How the last siege battle ended (P4-1I6, D-1I6-5).
    battle_end: Option<SiegeBattleEnd>,
    /// The battle screen of the last closed battle (web: the scene stays
    /// until `bs.dispose()` after the summary, `:37030`).
    battle_closed: Option<SiegeBattleView>,
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
            battle: None,
            battle_end: None,
            battle_closed: None,
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
        // A new session has no battle (`CreateSession` = new game, D-WIRB-2).
        self.battle = None;
        self.battle_end = None;
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

// ------------------------------------------------------------ siege battle (P4-1I6)
//
// R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371): the client as the
// production caller of the siege battle commands of the bridge
// (`StartSiegeStorm` / `StepSiegeBattle` / `SkipSiegeBattle` /
// `FinishSiegeBattle`, R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1, D-WIRB-5) feeding the
// renderer battle playback (`civ_renderer::battle::playback`, P4-1I4/I5).
//
// Pin `07d2fbd72` (`gra/src/main.ts`):
// - `launchSiegeStormFromMap` (`:36799-37024`): `hideSiegeMapPanel()`
//   (`:36885`), `onBattlefield` -> `new BattleScene({ attacker:
//   rosterToBattleUnits(atkRosterRef, 0xffd54a), defender:
//   rosterToBattleUnits(defRosterRef, 0xc84040), deployPlayerSide: 'atk',
//   siege: { defCiv, ... } })` -> `bs.play(res => ...)` (`:36962-37033`);
// - the scene: real-time play, the `Pomin` button (`skip()`), the end screen
//   (`finished`);
// - `bs.play` callback: `consumeReadyMachines(city)` + `finishSiegeStormBattle`
//   (`:36596-36725`) -> `afterSiegeUi` (`:36628-36672`) and, after the
//   summary, `afterSummary` -> `clearBattleUiState()` (`:36904-36908`:
//   `clearPlayerUnitSelection()`) + `bs.dispose()`.
//
// Technical decisions (entered in `REJESTR-RUST.md` by the orchestrator):
// - D-1I6-1 (seam): the bridge is included through `#[path]` by every consumer
//   (D-371-1), so the client talks to it through [`SiegeBattleSource`] over the
//   library types `SiegeBattlePayload` / `SiegeBattleError`; the caller maps
//   `BridgeError` back to `SiegeBattleError` (the bridge carries only its
//   `Display`, debt D-1I6-ERR).
// - D-1I6-2 (order): every answer passes the client stream guard
//   [`StreamOrder`], the rule of `BattlePlayback::check_order`
//   (`playback.rs:584-625`: all-or-nothing actions, then the frame, times
//   never decreasing over the whole battle), with or without a scene, so a
//   violation is reported before any renderer state changes.
// - D-1I6-3 (scene): the bridge answer has no `BattleSetupDto` (grid, fort,
//   models; its producer is engine work, debt D-1I6-SETUP). The client builds
//   the setup from the start answer (`units`, start `frame`: cells, facing,
//   wall walk, HP, morale, ammunition; owner colours of the pin
//   `0xffd54a` / `0xc84040`; `deployPlayerSide: 'atk'`; siege) plus the part
//   the bridge does not carry ([`SiegeSceneStatic`]). Without it the client
//   still drives the battle headless (guard, counts, result, map refresh).
// - D-1I6-4 (skip): after `SkipSiegeBattle` the client plays to the frame and
//   calls `BattlePlayback::apply_snapshot` with it (the fast-forward emits no
//   `Damage`, contract of `BattlePlayback`).
// - D-1I6-5 (end of battle, D-WIRB-8): `Finish` = result applied (one
//   `GetRenderFrame`, the `StateChanged` rule D-371-4, with the UI of
//   `clearBattleUiState`) / `NotFinished` (battle kept, `Skip` available) /
//   `Aborted` (battle closed, game state unchanged, no `StateChanged`, the
//   same UI exit as the web end of a battle).

use civ_engine::domain::siege_battle_apply::SiegeBattleUnitRefDto;
pub use civ_engine::domain::siege_battle_apply::{
    SiegeBattleError, SiegeBattlePayload, SiegeBattlePhaseDto, SiegeBattleResultDto,
};
use civ_engine::domain::siege_battle_session::SessionError;
pub use civ_renderer::battle::dynamics::ProjectileKind;
pub use civ_renderer::battle::playback::{BattlePlayback, PlaybackError, PlaybackOpts};
use civ_renderer::battle::units::build_battle_scene_with_units_fort;
pub use civ_renderer::battle::units::BattleScene3;
pub use civ_renderer::view::BattleAdapterError;
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto, BattleFortDto, BattleFrameDto, BattleGridDto,
    BattleSetupDto, BattleSide, BattleUnitSpawnDto, BattleWinner,
};

/// `rosterToBattleUnits(atkRosterRef, 0xffd54a)` (`main.ts:36981`).
pub const SIEGE_ATTACKER_COLOR: u32 = 0x00ff_d54a;
/// `rosterToBattleUnits(defRosterRef, 0xc84040)` (`main.ts:36982`).
pub const SIEGE_DEFENDER_COLOR: u32 = 0x00c8_4040;

/// One siege battle command of the bridge.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SiegeBattleCommand {
    /// `StartSiegeStorm { city_id, unit_id }`.
    Start {
        /// Stormed city.
        city_id: u64,
        /// Anchor unit of the human besieger.
        unit_id: u64,
    },
    /// `StepSiegeBattle { wall_ms }`.
    Step {
        /// Wall clock of the step (ms).
        wall_ms: f64,
    },
    /// `SkipSiegeBattle`.
    Skip,
    /// `FinishSiegeBattle`.
    Finish,
}

/// The answer of a siege battle command: the `siegeBattle` field and whether
/// the bridge emitted `StateChanged` (only `Finish`, D-WIRB-2).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeBattleAnswer {
    /// `BridgeResponse.siege_battle`.
    pub battle: SiegeBattlePayload,
    /// The dispatch carried `BridgeEvent::StateChanged`.
    pub state_changed: bool,
}

/// Error of a [`SiegeBattleSource`].
#[derive(Debug, Clone, PartialEq)]
pub enum SiegeSourceError<E> {
    /// The engine rejected the command (`SiegeBattleError`, D-WIRB-7 / D-WIRB-8).
    Battle(SiegeBattleError),
    /// Transport / bridge error that is not a battle error.
    Source(E),
}

/// The siege battle commands (D-1I6-1): the caller implements it over its
/// `EngineBridge` (`EngineCommand::StartSiegeStorm` ... and
/// `BridgeResponse.siege_battle`).
pub trait SiegeBattleSource: RenderSource {
    /// Sends one command.
    ///
    /// # Errors
    ///
    /// [`SiegeSourceError`].
    fn siege_battle(
        &mut self,
        command: SiegeBattleCommand,
    ) -> Result<SiegeBattleAnswer, SiegeSourceError<Self::Error>>;
}

/// The stream contract of `BattlePlayback` (D-1I6-2): the actions of one
/// answer are all-or-nothing with non-decreasing `t0` from the last queued
/// item, then the frame with `vNow` not lower than them; the last time lives
/// through the whole battle.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StreamOrder {
    last_queued: f64,
}

impl Default for StreamOrder {
    fn default() -> Self {
        Self::new()
    }
}

impl StreamOrder {
    /// Nothing queued yet.
    #[must_use]
    pub const fn new() -> Self {
        Self {
            last_queued: f64::NEG_INFINITY,
        }
    }

    /// Time of the last accepted item.
    #[must_use]
    pub const fn last_queued(&self) -> f64 {
        self.last_queued
    }

    /// Checks `actions` then `frame` (one answer) and, when all pass,
    /// advances the last time. All-or-nothing.
    ///
    /// # Errors
    ///
    /// [`PlaybackError::OutOfOrder`] with the previous time and the first
    /// rejected time (a `NaN` time is rejected too).
    pub fn accept(
        &mut self,
        actions: &[BattleActionDto],
        frame: Option<&BattleFrameDto>,
    ) -> Result<(), PlaybackError> {
        let mut prev = self.last_queued;
        for t in actions.iter().map(|a| a.t0).chain(frame.map(|f| f.v_now)) {
            if t.is_nan() || t < prev {
                return Err(PlaybackError::OutOfOrder { prev, t0: t });
            }
            prev = t;
        }
        self.last_queued = prev;
        Ok(())
    }
}

/// Unit data of the scene setup the bridge answer does not carry (D-1I6-3).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeUnitLook {
    /// Battle id (`SiegeBattleUnitRefDto::battle_id`).
    pub battle_id: u64,
    /// `bu.kategoria`.
    pub category: String,
    /// `String(bu.stats?.Jednostka ?? bu.nazwa)`.
    pub model_name: String,
    /// `bu.maxHp`.
    pub max_hp: f64,
    /// `moraleMax`.
    pub morale_max: f64,
    /// `ammoMax`; `None` = unlimited.
    pub ammo_max: Option<f64>,
}

/// The part of the battle scene setup the bridge answer does not carry
/// (D-1I6-3, debt D-1I6-SETUP): terrain grid, palette, wall civ, fort and the
/// per-unit models and maxima, plus the tower projectile kind
/// (`PlaybackOpts::tower_projectile`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeSceneStatic {
    /// Battle grid after carving.
    pub grid: BattleGridDto,
    /// `terrainPreset.desertPalette`.
    pub desert_palette: bool,
    /// `siege_wall_civ(civ, defCiv)`.
    pub siege_civ: String,
    /// Wall / towers.
    pub fort: BattleFortDto,
    /// One entry per scene unit.
    pub units: Vec<SiegeUnitLook>,
    /// `projectileKind` of the tower shooter; `None` = no tower shots.
    pub tower_projectile: Option<ProjectileKind>,
}

/// Why a siege battle call of the client failed.
#[derive(Debug, Clone, PartialEq)]
pub enum SiegeClientError<E> {
    /// No map session ([`RenderClient::on_session_created`] not called).
    NoSession,
    /// A battle is already running (web: the scene covers the map).
    BattleActive {
        /// City of the running battle.
        city_id: u64,
    },
    /// No battle running.
    NoBattle,
    /// `Step` / `Skip` after the end of the battle (the web scene shows the
    /// end screen; only `Finish` remains). No engine call.
    BattleFinished,
    /// The engine rejected the command.
    Engine(SiegeBattleError),
    /// Transport error of the source.
    Source(E),
    /// The answer breaks the stream contract (D-1I6-2); nothing was queued.
    Order(PlaybackError),
    /// The start answer cannot give a scene setup (D-1I6-3).
    Setup(String),
    /// The renderer battle adapter rejected the setup.
    Adapter(BattleAdapterError),
    /// The renderer playback rejected an item.
    Playback(PlaybackError),
    /// Map refresh after the battle failed (the battle is closed).
    Refresh(ClientError<E>),
}

impl<E: fmt::Display> fmt::Display for SiegeClientError<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoSession => write!(f, "siege battle: no map session"),
            Self::BattleActive { city_id } => {
                write!(f, "siege battle at city {city_id} is running")
            }
            Self::NoBattle => write!(f, "siege battle: none running"),
            Self::BattleFinished => write!(f, "siege battle: already finished"),
            Self::Engine(e) => write!(f, "{e}"),
            Self::Source(e) => write!(f, "siege battle source: {e}"),
            Self::Order(e) | Self::Playback(e) => write!(f, "siege battle playback: {e}"),
            Self::Setup(s) => write!(f, "siege battle setup: {s}"),
            Self::Adapter(e) => write!(f, "siege battle setup: {e}"),
            Self::Refresh(e) => write!(f, "after siege battle: {e}"),
        }
    }
}

impl<E: fmt::Debug + fmt::Display> std::error::Error for SiegeClientError<E> {}

impl<E> From<SiegeSourceError<E>> for SiegeClientError<E> {
    fn from(e: SiegeSourceError<E>) -> Self {
        match e {
            SiegeSourceError::Battle(b) => Self::Engine(b),
            SiegeSourceError::Source(s) => Self::Source(s),
        }
    }
}

/// `afterSiegeUi` branch of the result (`main.ts:36628-36672`): which
/// message and map refresh the pin shows after the scene.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SiegeAfterUi {
    /// `winner === 'atakujacy' && city.ownerId === atkOwner && oldOwner !==
    /// atkOwner`: `refreshMapAfterCityCapture` + "Szturm udany".
    Captured,
    /// `stormCaptureBlocked`: "obroncy rozbici, ale mur/palisada stoi".
    CaptureBlocked,
    /// `winner === 'obronca'`: "Szturm odparty".
    Repelled,
    /// `winner === 'remis'`: "remis ... oblezenie zniesione".
    Draw,
    /// None of the branches (attacker won with a breach but the city was not
    /// taken, e.g. no war at apply time): the pin shows nothing.
    Silent,
}

impl SiegeAfterUi {
    /// The branch of `afterSiegeUi` for `result`, in the order of the pin's
    /// `if` chain.
    #[must_use]
    pub fn of(result: &SiegeBattleResultDto) -> Self {
        let captured = result.capture.as_ref().is_some_and(|c| c.captured);
        if result.winner == BattleWinner::Atakujacy && captured {
            Self::Captured
        } else if result.capture_blocked {
            Self::CaptureBlocked
        } else if result.winner == BattleWinner::Obronca {
            Self::Repelled
        } else if result.winner == BattleWinner::Remis {
            Self::Draw
        } else {
            Self::Silent
        }
    }
}

/// How the last battle ended (D-1I6-5).
#[derive(Debug, Clone, PartialEq)]
pub enum SiegeBattleEnd {
    /// `FinishSiegeBattle` applied the result.
    Applied {
        /// City.
        city_id: u64,
        /// The result.
        result: SiegeBattleResultDto,
        /// `afterSiegeUi` branch.
        after: SiegeAfterUi,
    },
    /// D-WIRB-8: closed without a result, game state unchanged.
    Aborted {
        /// City.
        city_id: u64,
        /// Source error of the engine.
        reason: String,
    },
}

/// The battle screen of the client (web `BattleScene` + its UI).
#[derive(Debug, Clone)]
pub struct SiegeBattleView {
    city_id: u64,
    phase: SiegeBattlePhaseDto,
    units: Vec<SiegeBattleUnitRefDto>,
    last_frame: Option<BattleFrameDto>,
    order: StreamOrder,
    actions_received: usize,
    answers: usize,
    wall_clock: f64,
    skipped: bool,
    scene: Option<(BattleScene3, BattlePlayback)>,
}

impl SiegeBattleView {
    /// City of the battle.
    #[must_use]
    pub const fn city_id(&self) -> u64 {
        self.city_id
    }

    /// Phase of the last answer.
    #[must_use]
    pub const fn phase(&self) -> SiegeBattlePhaseDto {
        self.phase
    }

    /// Scene units of the start answer (battle id -> roster id, side).
    #[must_use]
    pub fn units(&self) -> &[SiegeBattleUnitRefDto] {
        &self.units
    }

    /// Frame of the last answer that had one.
    #[must_use]
    pub const fn last_frame(&self) -> Option<&BattleFrameDto> {
        self.last_frame.as_ref()
    }

    /// Actions received so far (every answer; none is dropped).
    #[must_use]
    pub const fn actions_received(&self) -> usize {
        self.actions_received
    }

    /// Answers received (start included).
    #[must_use]
    pub const fn answers(&self) -> usize {
        self.answers
    }

    /// Accumulated wall clock of the steps (`vLastWall` of the labels).
    #[must_use]
    pub const fn wall_clock(&self) -> f64 {
        self.wall_clock
    }

    /// `Pomin` was used.
    #[must_use]
    pub const fn skipped(&self) -> bool {
        self.skipped
    }

    /// The stream guard (D-1I6-2).
    #[must_use]
    pub const fn order(&self) -> &StreamOrder {
        &self.order
    }

    /// The `Pomin` button: shown while the battle runs.
    #[must_use]
    pub fn skip_available(&self) -> bool {
        self.phase == SiegeBattlePhaseDto::Running
    }

    /// The end screen (`finished`): only `Finish` remains.
    #[must_use]
    pub fn end_screen(&self) -> bool {
        self.phase == SiegeBattlePhaseDto::Finished
    }

    /// The renderer scene and playback (`None` = headless, D-1I6-3).
    #[must_use]
    pub fn scene(&self) -> Option<(&BattleScene3, &BattlePlayback)> {
        self.scene.as_ref().map(|(s, p)| (s, p))
    }
}

/// The battle setup of the scene (D-1I6-3) from the start answer and the
/// static part.
///
/// # Errors
///
/// A text naming the missing piece: no start frame, a frame unit without a
/// side in `units` or without a look in `scene.units`, an unknown side tag.
pub fn compose_siege_battle_setup(
    start: &SiegeBattlePayload,
    scene: &SiegeSceneStatic,
) -> Result<BattleSetupDto, String> {
    let frame = start
        .frame
        .as_ref()
        .ok_or_else(|| "start answer without a frame".to_owned())?;
    // D-1I6-3b: the start frame is the scene AFTER the start actions (`t0 <=
    // vNow`); the spawn is before them. A cell-changing action carries the
    // cell before it, so the spawn cell of a unit is the `from` of its first
    // one (steps chain, `MoveFrom`); a unit without one stands on its frame
    // cell. An action that changes HP, morale or presence cannot be rewound
    // from the frame: such a start answer is refused, never guessed.
    let mut spawn_cell: Vec<(u64, (i32, i32), bool)> = Vec::new();
    for a in &start.actions {
        let (id, from, wall) = match &a.action {
            BattleActionKindDto::Move {
                id,
                from_col,
                from_row,
                ..
            } => (*id, (*from_col, *from_row), None),
            BattleActionKindDto::ClimbWall {
                id,
                from_col,
                from_row,
                ..
            } => (*id, (*from_col, *from_row), Some(false)),
            BattleActionKindDto::LeaveField {
                id,
                from_col,
                from_row,
                ..
            } => (*id, (*from_col, *from_row), Some(true)),
            BattleActionKindDto::Damage { .. }
            | BattleActionKindDto::Kill { .. }
            | BattleActionKindDto::Leave { .. }
            | BattleActionKindDto::Shaken { .. }
            | BattleActionKindDto::Rout { .. } => {
                return Err(format!(
                    "start answer changes HP / morale / presence at t0 {}",
                    a.t0
                ));
            }
            _ => continue,
        };
        if !spawn_cell.iter().any(|(u, _, _)| *u == id.get()) {
            let fu_wall = frame
                .units
                .iter()
                .find(|u| u.id == id)
                .is_some_and(|u| u.on_wall_walkway);
            spawn_cell.push((id.get(), from, wall.unwrap_or(fu_wall)));
        }
    }
    let mut units = Vec::with_capacity(frame.units.len());
    for fu in &frame.units {
        let id = fu.id.get();
        let (col, row, on_wall_walkway) = spawn_cell
            .iter()
            .find(|(u, _, _)| *u == id)
            .map_or((fu.col, fu.row, fu.on_wall_walkway), |(_, c, w)| {
                (c.0, c.1, *w)
            });
        let side = match start
            .units
            .iter()
            .find(|u| u.battle_id == id)
            .map(|u| u.side.as_str())
        {
            Some("atk") => BattleSide::Atk,
            Some("def") => BattleSide::Def,
            Some(other) => return Err(format!("unit {id}: side {other:?}")),
            None => return Err(format!("unit {id}: not in the start units")),
        };
        let look = scene
            .units
            .iter()
            .find(|l| l.battle_id == id)
            .ok_or_else(|| format!("unit {id}: no scene look"))?;
        units.push(BattleUnitSpawnDto {
            id: fu.id,
            side,
            category: look.category.clone(),
            model_name: look.model_name.clone(),
            owner_color: match side {
                BattleSide::Atk => SIEGE_ATTACKER_COLOR,
                BattleSide::Def => SIEGE_DEFENDER_COLOR,
            },
            col,
            row,
            facing: fu.facing,
            on_wall_walkway,
            hp: fu.hp,
            max_hp: look.max_hp,
            morale: fu.morale,
            morale_max: look.morale_max,
            ammo_left: fu.ammo_left,
            ammo_max: look.ammo_max,
        });
    }
    Ok(BattleSetupDto {
        grid: scene.grid.clone(),
        desert_palette: scene.desert_palette,
        siege: true,
        // `deploy: atkRosterRef.some(u => u.isGeneral)`: a general is the
        // manual mode (`ManualModeNotPorted`, out of scope), so no deploy.
        deploy: None,
        siege_civ: scene.siege_civ.clone(),
        // `deployPlayerSide: 'atk'`: the human is the besieger (`:36800`).
        player_side: BattleSide::Atk,
        units,
        fort: scene.fort.clone(),
    })
}

/// `SessionError::NotFinished`: the engine error of a `Finish` before the
/// end (D-WIRB-8: the battle stays, `Skip` is available).
#[must_use]
pub const fn is_not_finished(e: &SiegeBattleError) -> bool {
    matches!(e, SiegeBattleError::Session(SessionError::NotFinished))
}

/// Siege battle API of the client (D-1I6-1..5).
impl<S: SiegeBattleSource> RenderClient<S> {
    /// The running battle (`None` outside a battle).
    #[must_use]
    pub const fn siege_battle(&self) -> Option<&SiegeBattleView> {
        self.battle.as_ref()
    }

    /// How the last battle ended.
    #[must_use]
    pub const fn last_siege_battle_end(&self) -> Option<&SiegeBattleEnd> {
        self.battle_end.as_ref()
    }

    /// The battle screen of the last closed battle (its scene and counts;
    /// `None` after an `Aborted` end, whose scene is dropped).
    #[must_use]
    pub const fn last_siege_battle_view(&self) -> Option<&SiegeBattleView> {
        self.battle_closed.as_ref()
    }

    /// `launchSiegeStormFromMap` -> `onBattlefield` -> `bs.play`:
    /// `StartSiegeStorm`, then the stream guard and, with `scene`, the battle
    /// scene (D-1I6-3) fed with the start actions and frame. The siege map
    /// panel closes (`hideSiegeMapPanel()`, `main.ts:36885`; the map is
    /// covered, no recomposition). The game state does not change (no
    /// `StateChanged`, no frame request).
    ///
    /// # Errors
    ///
    /// [`SiegeClientError::NoSession`], [`SiegeClientError::BattleActive`]
    /// (no engine call); the engine / source error (no battle, UI
    /// unchanged); setup / adapter errors (no battle in the client; the
    /// engine battle stays open and the caller ends it); order / playback
    /// errors of the start answer (battle kept).
    pub fn start_siege_storm(
        &mut self,
        city_id: u64,
        unit_id: u64,
        scene: Option<&SiegeSceneStatic>,
    ) -> Result<(), SiegeClientError<S::Error>> {
        if self.map.is_none() {
            return Err(SiegeClientError::NoSession);
        }
        if let Some(b) = &self.battle {
            return Err(SiegeClientError::BattleActive { city_id: b.city_id });
        }
        let answer = self
            .source
            .siege_battle(SiegeBattleCommand::Start { city_id, unit_id })?;
        let p = answer.battle;
        let mut view = SiegeBattleView {
            city_id: p.city_id,
            phase: p.phase,
            units: p.units.clone(),
            last_frame: None,
            order: StreamOrder::new(),
            actions_received: 0,
            answers: 0,
            wall_clock: 0.0,
            skipped: false,
            scene: None,
        };
        if let Some(st) = scene {
            let setup = compose_siege_battle_setup(&p, st).map_err(SiegeClientError::Setup)?;
            let inputs =
                civ_renderer::view::battle_inputs(&setup).map_err(SiegeClientError::Adapter)?;
            let b = build_battle_scene_with_units_fort(inputs.opts, &inputs.fort);
            let pb = BattlePlayback::new(
                &b,
                PlaybackOpts {
                    tower_projectile: st.tower_projectile,
                },
            );
            view.scene = Some((b, pb));
        }
        self.battle_end = None;
        self.battle_closed = None;
        self.ui.siege_map_panel_open = false;
        let fed = feed(&mut view, &p, false);
        self.battle = Some(view);
        fed
    }

    /// One real-time step of `wall_ms` (the scene's rAF, D-WIR-3): the
    /// actions and the frame of the answer pass the guard and are played up
    /// to the frame's `vNow`.
    ///
    /// # Errors
    ///
    /// [`SiegeClientError::NoBattle`]; [`SiegeClientError::BattleFinished`]
    /// after the end (no engine call); engine / source / order / playback
    /// errors.
    pub fn step_siege_battle(&mut self, wall_ms: f64) -> Result<(), SiegeClientError<S::Error>> {
        self.running_battle()?;
        let answer = self
            .source
            .siege_battle(SiegeBattleCommand::Step { wall_ms })?;
        let view = self.battle.as_mut().ok_or(SiegeClientError::NoBattle)?;
        view.wall_clock += wall_ms;
        feed(view, &answer.battle, false)
    }

    /// The scene's `Pomin` (`skip()`): fast-forward to the end; the frame of
    /// the answer resyncs all bars (`apply_snapshot`, D-1I6-4).
    ///
    /// # Errors
    ///
    /// As [`Self::step_siege_battle`].
    pub fn skip_siege_battle(&mut self) -> Result<(), SiegeClientError<S::Error>> {
        self.running_battle()?;
        let answer = self.source.siege_battle(SiegeBattleCommand::Skip)?;
        let view = self.battle.as_mut().ok_or(SiegeClientError::NoBattle)?;
        view.skipped = true;
        feed(view, &answer.battle, true)
    }

    /// The `bs.play` callback: `FinishSiegeBattle` (D-1I6-5, D-WIRB-8).
    /// - result applied: the held actions are played, the battle closes, the
    ///   UI of `afterSiegeUi` + `clearBattleUiState` (no selection, no hover,
    ///   highlight cleared; the capture's `forceVisibleUnitId` is cleared on
    ///   the next frame, `:36303`) and ONE `GetRenderFrame` (`StateChanged`,
    ///   D-371-4);
    /// - `NotFinished`: the battle stays (`Skip` available), returned as
    ///   [`SiegeClientError::Engine`] ([`is_not_finished`]);
    /// - `Aborted`: the battle closes, game state unchanged (no
    ///   `StateChanged`), the same UI exit; `Ok` with
    ///   [`SiegeBattleEnd::Aborted`].
    ///
    /// # Errors
    ///
    /// [`SiegeClientError::NoBattle`]; `NotFinished` and other engine /
    /// source errors (battle kept); order / playback errors of the last
    /// answer (battle closed, end kept); [`SiegeClientError::Refresh`].
    pub fn finish_siege_battle(&mut self) -> Result<&SiegeBattleEnd, SiegeClientError<S::Error>> {
        if self.battle.is_none() {
            return Err(SiegeClientError::NoBattle);
        }
        let answer = match self.source.siege_battle(SiegeBattleCommand::Finish) {
            Ok(a) => a,
            Err(SiegeSourceError::Battle(SiegeBattleError::Aborted { city_id, reason })) => {
                self.battle = None;
                self.battle_end = Some(SiegeBattleEnd::Aborted { city_id, reason });
                self.exit_battle_ui(false)
                    .map_err(SiegeClientError::Refresh)?;
                return self.battle_end.as_ref().ok_or(SiegeClientError::NoBattle);
            }
            Err(e) => return Err(e.into()),
        };
        let mut view = self.battle.take().ok_or(SiegeClientError::NoBattle)?;
        let fed = feed(&mut view, &answer.battle, false);
        let city_id = answer.battle.city_id;
        self.battle_end = Some(match answer.battle.result {
            Some(result) => SiegeBattleEnd::Applied {
                city_id,
                after: SiegeAfterUi::of(&result),
                result,
            },
            None => SiegeBattleEnd::Aborted {
                city_id,
                reason: "finish answer without a result".to_owned(),
            },
        });
        self.battle_closed = Some(view);
        self.exit_battle_ui(answer.state_changed)
            .map_err(SiegeClientError::Refresh)?;
        fed?;
        self.battle_end.as_ref().ok_or(SiegeClientError::NoBattle)
    }

    fn running_battle(&self) -> Result<(), SiegeClientError<S::Error>> {
        let b = self.battle.as_ref().ok_or(SiegeClientError::NoBattle)?;
        if b.phase == SiegeBattlePhaseDto::Running {
            Ok(())
        } else {
            Err(SiegeClientError::BattleFinished)
        }
    }

    /// `clearBattleUiState` (`:36904-36908`) after `afterSiegeUi`:
    /// selection, hover and highlight cleared, no forced visible unit
    /// (`:36303`). With `state_changed` the engine is asked for ONE frame with
    /// that UI; without it only a [`RenderUiParams`] change asks (D-371-4).
    fn exit_battle_ui(&mut self, state_changed: bool) -> Result<(), ClientError<S::Error>> {
        let mut frame_ui = self.ui.frame_ui.clone();
        frame_ui.selected_unit_id = None;
        frame_ui.unit_selected_after_build_open = false;
        frame_ui.hover = None;
        self.ui.map_ui.force_visible_unit_id = None;
        self.ui.highlight_last_writer = HighlightPriority::Cleared;
        if state_changed {
            self.ui.frame_ui = frame_ui;
            return self.on_state_changed();
        }
        if frame_ui != self.ui.frame_ui {
            return self.set_frame_ui(frame_ui);
        }
        self.recompose()
    }
}

/// One answer into the view: guard (D-1I6-2), counts, then the scene. A
/// frame plays the queue up to its `vNow` (with the snapshot after `Skip`,
/// D-1I6-4); an answer without a frame (`Finish`) plays up to its last
/// action.
fn feed<E>(
    view: &mut SiegeBattleView,
    p: &SiegeBattlePayload,
    skip: bool,
) -> Result<(), SiegeClientError<E>> {
    view.order
        .accept(&p.actions, p.frame.as_ref())
        .map_err(SiegeClientError::Order)?;
    view.answers += 1;
    view.actions_received += p.actions.len();
    view.phase = p.phase;
    if let Some(f) = &p.frame {
        view.last_frame = Some(f.clone());
    }
    let wall = view.wall_clock;
    let Some((scene, pb)) = view.scene.as_mut() else {
        return Ok(());
    };
    pb.push_actions(&p.actions)
        .map_err(SiegeClientError::Playback)?;
    if let Some(f) = &p.frame {
        pb.push_frame(f).map_err(SiegeClientError::Playback)?;
        pb.play_until(scene, f.v_now, wall)
            .map_err(SiegeClientError::Playback)?;
        if skip {
            pb.apply_snapshot(scene, f)
                .map_err(SiegeClientError::Playback)?;
        }
    } else if let Some(last) = p.actions.last() {
        pb.play_until(scene, last.t0, wall)
            .map_err(SiegeClientError::Playback)?;
    }
    Ok(())
}
