//! T2 `R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E` (#371): end-to-end test
//! "engine -> bridge -> adapter -> CPU renderer".
//!
//! The real bridge (`engine/src/bridge.rs`, included through `#[path]` like
//! `src-tauri/src/lib.rs` does, decision D-371-1) over `CivEngineAdapter`
//! feeds [`RenderClient`] through a counting [`RenderSource`]; the client feeds
//! `civ_renderer::view::frame::MapScene` (CPU, no `gpu`).
//!
//! Scenario: `CreateSession` -> `GetRenderMap` -> `GetRenderFrame` (start UI)
//! -> `SelectUnit` + UI `selected_unit_id` -> `MoveUnit` -> `GetRenderFrame` ->
//! `AdvanceTurn` -> `GetRenderFrame`, with the refresh rule of D-371-4
//! (`GetRenderFrame` after every `StateChanged` and every change of
//! `RenderUiParams`; a change of `MapUiState` / siege map panel alone does not
//! call the engine).

#[path = "../../engine/src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeEvent, BridgeRequest, BridgeResult, CivEngineAdapter,
    EngineBridge, EngineCommand, StartGameParams,
};
use civ_client::{
    BuildMode, ClientError, ClientUiState, FrameError, HighlightPriority, MapDetailQuality,
    MapScene, MapUiState, RenderClient, RenderFramePayload, RenderMapPayload, RenderSource,
    RenderUiParams, VIEWER_SEAT,
};
use civ_engine::{PlayerId, PositionDto};
use civ_renderer::map_units::{default_owner_color, default_ring_stance, RingStance};
use civ_renderer::models::cities::renderer::SceneObject;
use civ_renderer::terrain::{roblox_lite, LARGE_MAP_LITE_HEX_THRESHOLD};
use civ_view_model as vm;
use civ_view_model::{FogState, RenderLayersDto};

const HUMAN: u64 = 1;
const AI: u64 = 2;
/// `STARTING_UNIT_ID` of the start scenario (`playable.rs:43`).
const WARRIOR: u64 = 1;

// ------------------------------------------------------------ source

/// [`RenderSource`] over the real bridge, counting the queries.
struct BridgeSource {
    bridge: EngineBridge<CivEngineAdapter>,
    next_id: u64,
    map_calls: usize,
    frame_calls: usize,
}

impl BridgeSource {
    fn new() -> Self {
        Self {
            bridge: EngineBridge::new(CivEngineAdapter::default()),
            next_id: 0,
            map_calls: 0,
            frame_calls: 0,
        }
    }

    fn request(&mut self, command: EngineCommand) -> Result<BridgeDispatch, BridgeError> {
        self.next_id += 1;
        self.bridge
            .handle(BridgeRequest::new(format!("t2-{}", self.next_id), command))
    }

    /// A game command; `true` when the answer carries `StateChanged`.
    fn command(&mut self, command: EngineCommand) -> bool {
        let label = format!("{command:?}");
        let d = self.request(command).expect(&label);
        assert!(
            matches!(d.response.result, BridgeResult::State { .. }),
            "{label}: State expected"
        );
        d.events
            .iter()
            .any(|e| matches!(e, BridgeEvent::StateChanged { .. }))
    }

    /// The active seat of the session (web `ME()`).
    fn active_seat(&self) -> u64 {
        self.bridge.adapter().fog_session().active_seat.get()
    }

    /// `GetRenderFrame` sent directly (not through the client), uncounted.
    fn direct_frame(&mut self, seat: Option<u64>, ui: Option<RenderUiParams>) -> RenderLayersDto {
        let d = self
            .request(EngineCommand::GetRenderFrame { seat, ui })
            .expect("direct frame");
        match d.response.result {
            BridgeResult::RenderFrame { frame } => frame.0,
            BridgeResult::State { .. }
            | BridgeResult::RenderLayers { .. }
            | BridgeResult::RenderMap { .. } => panic!("RenderFrame expected"),
        }
    }
}

fn unexpected(kind: &str, query: &str) -> BridgeError {
    BridgeError::internal(format!("{query}: unexpected result {kind}"))
}

impl RenderSource for BridgeSource {
    type Error = BridgeError;

    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        self.map_calls += 1;
        let d = self.request(EngineCommand::GetRenderMap)?;
        assert!(d.events.is_empty(), "GetRenderMap emits no StateChanged");
        match d.response.result {
            BridgeResult::RenderMap { map } => Ok(map),
            BridgeResult::State { .. } => Err(unexpected("state", "get_render_map")),
            BridgeResult::RenderLayers { .. } => Err(unexpected("render_layers", "get_render_map")),
            BridgeResult::RenderFrame { .. } => Err(unexpected("render_frame", "get_render_map")),
        }
    }

    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        self.frame_calls += 1;
        let d = self.request(EngineCommand::GetRenderFrame { seat, ui })?;
        assert!(d.events.is_empty(), "GetRenderFrame emits no StateChanged");
        match d.response.result {
            BridgeResult::RenderFrame { frame } => Ok(frame),
            BridgeResult::State { .. } => Err(unexpected("state", "get_render_frame")),
            BridgeResult::RenderLayers { .. } => {
                Err(unexpected("render_layers", "get_render_frame"))
            }
            BridgeResult::RenderMap { .. } => Err(unexpected("render_map", "get_render_frame")),
        }
    }
}

type Client = RenderClient<BridgeSource>;

// ------------------------------------------------------------ helpers

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).expect("id"))
}

fn selected(id: u64) -> RenderUiParams {
    RenderUiParams {
        selected_unit_id: Some(id),
        ..RenderUiParams::default()
    }
}

/// A game command through the client's bridge; refreshes the client when the
/// answer carries `StateChanged` (D-371-4).
fn command(client: &mut Client, cmd: EngineCommand) {
    let changed = client.source_mut().command(cmd);
    assert!(changed, "mutating command emits StateChanged");
    client.on_state_changed().expect("frame after StateChanged");
}

fn frame(client: &Client) -> &RenderLayersDto {
    client.last_frame().expect("cached frame")
}

fn explored(f: &RenderLayersDto) -> usize {
    f.fog
        .state
        .iter()
        .filter(|s| **s != FogState::Unexplored)
        .count()
}

fn calls(client: &Client) -> (usize, usize) {
    (client.source().map_calls, client.source().frame_calls)
}

/// Every adapter took the frame, and the renderer state mirrors the DTO.
fn assert_renderer_mirrors_dto(client: &Client, step: &str) {
    let f = frame(client);
    let scene = client.scene().expect("scene");
    let inputs = client.frame_inputs().expect("inputs");
    // Units: one token per DTO unit, at the DTO hex.
    let units = scene.units();
    assert_eq!(units.token_count(), f.units.len(), "{step}: unit tokens");
    for u in &f.units {
        let t = units.token(&u.id.to_string()).expect("token of a DTO unit");
        assert_eq!((t.hex.q, t.hex.r), (u.hex.q, u.hex.r), "{step}: token hex");
    }
    // Cities: one city group per DTO city.
    let city_groups = scene
        .cities()
        .scene()
        .iter()
        .filter(|o| matches!(o, SceneObject::City(_)))
        .count();
    assert_eq!(city_groups, f.cities.len(), "{step}: city groups");
    for c in &f.cities {
        assert!(
            scene.cities().city(&c.id.to_string()).is_some(),
            "{step}: city {}",
            c.id
        );
    }
    // Overlays = the groups of the last composition.
    assert_eq!(scene.overlays(), Some(&inputs.overlays), "{step}: overlays");
    assert_eq!(inputs.viewer, f.viewer, "{step}: viewer");
    assert_eq!(inputs.turn, f.turn, "{step}: turn");
    assert_eq!(inputs.ui, client.ui().map_ui, "{step}: map ui");
    assert_eq!(
        inputs.siege_map_panel_open,
        client.ui().siege_map_panel_open,
        "{step}: siege panel"
    );
}

/// The cached frame is the frame of the ACTIVE seat with the client UI
/// (mutant (b): another seat gives another viewer / fog / units).
fn assert_active_seat_frame(client: &mut Client, step: &str) {
    let seat = client.source().active_seat();
    let ui = client.ui().frame_ui.clone();
    let cached = frame(client).clone();
    assert_eq!(cached.viewer.owner_id, player(seat), "{step}: viewer seat");
    let direct = client.source_mut().direct_frame(Some(seat), Some(ui));
    assert_eq!(cached, direct, "{step}: frame of the active seat");
}

/// `selection` / `reachable` of the DTO reach the renderer.
fn assert_selection_drawn(client: &Client, step: &str) {
    let f = frame(client);
    let sel = f.overlays.selection.expect("selection in the DTO");
    assert!(
        !f.overlays.reachable.is_empty(),
        "{step}: reachable in the DTO"
    );
    let units = client.scene().expect("scene").units();
    let ring = units.selection().expect("selection ring");
    assert_eq!(
        (ring.hex.q, ring.hex.r),
        (sel.hex.q, sel.hex.r),
        "{step}: ring hex"
    );
    let hl = units.highlight().expect("reachable highlight");
    assert_eq!(
        hl.hexes.len(),
        f.overlays.reachable.len(),
        "{step}: highlight"
    );
}

// ------------------------------------------------------------ e2e

#[test]
fn engine_bridge_adapter_renderer_end_to_end() {
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::High);
    assert_eq!(client.ui(), &ClientUiState::web_initial());

    // (a) A frame before `on_session_created`: typed error, no engine call.
    assert!(matches!(
        client.on_state_changed(),
        Err(ClientError::NoSession)
    ));
    assert_eq!(calls(&client), (0, 0));
    assert!(client.last_frame().is_none() && client.scene().is_none());

    // CreateSession -> GetRenderMap.
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("render map");
    assert_eq!(calls(&client), (1, 0));
    // A second seat (fog, units and viewer differ from the active one).
    assert!(client.source_mut().command(EngineCommand::AddPlayer {
        id: AI,
        name: "AI".to_owned(),
    }));
    assert_eq!(client.source().active_seat(), HUMAN);

    // GetRenderFrame with the start UI (no selection).
    client.on_state_changed().expect("first frame");
    assert_eq!(calls(&client), (1, 1));
    assert_renderer_mirrors_dto(&client, "start");
    assert_active_seat_frame(&mut client, "start");
    assert_eq!(frame(&client).units.len(), 1, "the start warrior");
    assert_eq!(frame(&client).overlays.selection, None);
    assert!(client.scene().expect("scene").units().selection().is_none());
    let mut seen = explored(frame(&client));
    assert!(seen > 0, "the start position is explored");

    // Idempotency: no state change -> identical DTO (the pin calls
    // `refreshFog()` from ~69 places).
    let before = frame(&client).clone();
    client.on_state_changed().expect("same frame");
    assert_eq!(calls(&client), (1, 2));
    assert_eq!(frame(&client), &before);
    assert_eq!(
        serde_json::to_string(frame(&client)).expect("json"),
        serde_json::to_string(&before).expect("json")
    );

    // SelectUnit + UI selectedId.
    command(&mut client, EngineCommand::SelectUnit { unit_id: WARRIOR });
    assert_eq!(calls(&client), (1, 3));
    // `selectedId` comes from the UI, not from the state.
    assert_eq!(frame(&client).overlays.selection, None);
    client.set_frame_ui(selected(WARRIOR)).expect("select ui");
    assert_eq!(
        calls(&client),
        (1, 4),
        "a RenderUiParams change asks the engine"
    );
    assert_eq!(client.ui().frame_ui, selected(WARRIOR));
    assert_renderer_mirrors_dto(&client, "selected");
    assert_active_seat_frame(&mut client, "selected");
    assert_selection_drawn(&client, "selected");
    // An equal value does not ask again.
    client.set_frame_ui(selected(WARRIOR)).expect("same ui");
    assert_eq!(calls(&client), (1, 4));

    // MapUiState / siege map panel: never the engine (D-371-4), the cached
    // frame is composed again.
    let cached = frame(&client).clone();
    let toggled = MapUiState {
        territory_border_visible: false,
        show_trade_routes_overlay: false,
        show_worker_overlay: false,
        ..MapUiState::WEB_INITIAL
    };
    client.set_map_ui(toggled).expect("map ui");
    assert_eq!(
        calls(&client),
        (1, 4),
        "MapUiState does not call the engine"
    );
    assert_eq!(frame(&client), &cached);
    assert_renderer_mirrors_dto(&client, "toggled");
    client.set_siege_map_panel_open(true).expect("siege panel");
    assert_eq!(
        calls(&client),
        (1, 4),
        "siege panel does not call the engine"
    );
    assert_renderer_mirrors_dto(&client, "siege panel");
    // `syncPlayerUnitSelectionOnMap` with the siege map panel open
    // (`main.ts:7119-7122`): ring kept, highlight cleared.
    let units = client.scene().expect("scene").units();
    assert!(units.selection().is_some(), "siege panel keeps the ring");
    assert!(
        units.highlight().is_none(),
        "siege panel clears the highlight"
    );
    let mut ui = client.ui().clone();
    ui.map_ui = MapUiState::WEB_INITIAL;
    ui.siege_map_panel_open = false;
    client.set_ui(ui).expect("ui back");
    assert_eq!(calls(&client), (1, 4), "set_ui without frame_ui change");
    assert_renderer_mirrors_dto(&client, "ui back");
    assert_selection_drawn(&client, "ui back");

    // Build mode open: no selection, no reachable (`onOpenBuild`,
    // `main.ts:26702-26703`).
    client
        .set_frame_ui(RenderUiParams {
            build_mode_open: true,
            ..selected(WARRIOR)
        })
        .expect("build mode");
    assert_eq!(calls(&client), (1, 5));
    assert_renderer_mirrors_dto(&client, "build mode");
    let f = frame(&client);
    assert_eq!(f.overlays.selection, None);
    assert!(f.overlays.reachable.is_empty());
    assert_eq!(f.overlays.path_route, None);
    let units = client.scene().expect("scene").units();
    assert!(units.selection().is_none(), "build mode: no ring");
    assert!(
        units.highlight().is_none_or(|h| h.hexes.is_empty()),
        "build mode: no reachable highlight"
    );
    let mut ui = client.ui().clone();
    ui.frame_ui = selected(WARRIOR);
    client.set_ui(ui).expect("build mode closed");
    assert_eq!(calls(&client), (1, 6), "set_ui with frame_ui change");
    assert_selection_drawn(&client, "build mode closed");

    // MoveUnit to a reachable hex -> GetRenderFrame.
    let start = frame(&client)
        .units
        .iter()
        .find(|u| u.id.to_string() == WARRIOR.to_string())
        .expect("warrior")
        .hex;
    let dest = *frame(&client)
        .overlays
        .reachable
        .iter()
        .find(|h| **h != start)
        .expect("a reachable hex");
    command(
        &mut client,
        EngineCommand::MoveUnit {
            unit_id: WARRIOR,
            destination: PositionDto::new(
                u16::try_from(dest.q).expect("q"),
                u16::try_from(dest.r).expect("r"),
            ),
            attack_unit_id: None,
        },
    );
    assert_eq!(calls(&client), (1, 7));
    assert_renderer_mirrors_dto(&client, "moved");
    assert_active_seat_frame(&mut client, "moved");
    let moved = frame(&client)
        .units
        .iter()
        .find(|u| u.id.to_string() == WARRIOR.to_string())
        .expect("warrior")
        .hex;
    assert_eq!(moved, dest, "the warrior stands on the destination");
    let now = explored(frame(&client));
    assert!(now >= seen, "exploration does not shrink ({seen} -> {now})");
    seen = now;

    // AdvanceTurn -> GetRenderFrame.
    let turn = frame(&client).turn;
    command(&mut client, EngineCommand::AdvanceTurn);
    assert_eq!(calls(&client), (1, 8));
    assert_eq!(frame(&client).turn, turn + 1, "next turn");
    assert_renderer_mirrors_dto(&client, "next turn");
    assert_active_seat_frame(&mut client, "next turn");
    assert_selection_drawn(&client, "next turn");
    let now = explored(frame(&client));
    assert!(now >= seen, "exploration does not shrink ({seen} -> {now})");

    // Idempotency after the turn.
    let before = frame(&client).clone();
    client.on_state_changed().expect("same frame");
    assert_eq!(frame(&client), &before);
    assert_eq!(calls(&client), (1, 9));
    // `GetRenderMap` was asked once per session.
    assert_eq!(client.source().map_calls, 1);
    assert_eq!(
        client.source().bridge.adapter().fog_session().active_seat,
        PlayerId::new(HUMAN)
    );
}

#[test]
fn ui_set_before_session_is_kept_and_used_by_the_first_frame() {
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    client.set_frame_ui(selected(WARRIOR)).expect("stored");
    client
        .set_map_ui(MapUiState {
            show_worker_overlay: false,
            ..MapUiState::WEB_INITIAL
        })
        .expect("stored");
    client.set_siege_map_panel_open(false).expect("stored");
    assert_eq!(calls(&client), (0, 0), "no session: nothing asked");
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map");
    client.on_state_changed().expect("frame");
    assert_eq!(calls(&client), (1, 1));
    assert_selection_drawn(&client, "first frame");
    assert_renderer_mirrors_dto(&client, "first frame");
}

#[test]
fn new_session_drops_the_frame_cache_and_the_scene() {
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::Medium);
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map");
    client.on_state_changed().expect("frame");
    assert!(client.last_frame().is_some() && client.scene().is_some());
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map again");
    assert_eq!(calls(&client), (2, 1));
    assert!(
        client.last_frame().is_none(),
        "cache of the old session dropped"
    );
    assert!(client.scene().is_none(), "scene of the old session dropped");
    assert!(client.frame_inputs().is_none());
    // A MapUiState change without a frame: stored, nothing drawn, no call.
    client
        .set_map_ui(MapUiState::WEB_INITIAL)
        .expect("no frame");
    assert_eq!(calls(&client), (2, 1));
    client.on_state_changed().expect("frame of the new session");
    assert_eq!(calls(&client), (2, 2));
    assert_renderer_mirrors_dto(&client, "new session");
}

#[test]
fn source_errors_are_typed_and_keep_the_cache() {
    // The bridge without a session still has the default game in
    // `CivEngineAdapter`, so an unknown seat is the reachable source error:
    // drive it through a source that asks for seat 99.
    struct BadSeat(BridgeSource);
    impl RenderSource for BadSeat {
        type Error = BridgeError;
        fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
            self.0.render_map()
        }
        fn render_frame(
            &mut self,
            seat: Option<u64>,
            ui: Option<RenderUiParams>,
        ) -> Result<RenderFramePayload, BridgeError> {
            assert_eq!(seat, VIEWER_SEAT, "the client asks for the active seat");
            self.0.render_frame(Some(99), ui)
        }
    }
    let mut client = RenderClient::new(BadSeat(BridgeSource::new()), MapDetailQuality::High);
    client
        .on_session_created()
        .expect("map of the default game");
    let err = client.on_state_changed().expect_err("unknown seat");
    assert!(matches!(err, ClientError::Source(_)), "{err:?}");
    assert!(err.to_string().starts_with("render source:"));
    assert!(client.last_frame().is_none());
    assert!(client.scene().is_none());
    assert!(ClientError::<BridgeError>::NoSession
        .to_string()
        .contains("on_session_created"));
}

// ------------------------------------------------------------ defence r1

/// Z1 (mutant E1): the scene is built ONCE per session (pin `main.ts:2173`,
/// `:44769`; `MapScene::new` doc). State the caller sets through
/// `scene_mut()` (the resolvers of DŁUG-T1-RESOLVERS, e.g.
/// `wireUnitRendererRingStance` -> `setRingStanceResolver`, `setOwnerColorFn`)
/// survives every later frame and every recomposition from the cache; a
/// rebuilt scene would fall back to `default_ring_stance` /
/// `default_owner_color`.
#[test]
fn scene_is_built_once_per_session_and_keeps_caller_state() {
    const COLOR: u32 = 0x0012_3456;
    let warrior = WARRIOR.to_string();
    let human = i64::try_from(HUMAN).expect("id");
    let stance = |c: &Client| {
        let t = c
            .scene()
            .expect("scene")
            .units()
            .token(&warrior)
            .expect("warrior token");
        (t.ring_stance, t.overlays.plate_vitals.owner_color)
    };
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::High);
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map");
    client.on_state_changed().expect("first frame");
    // Defaults of a fresh scene (`default_ring_stance`, `default_owner_color`).
    let defaults = (default_ring_stance(human), Some(default_owner_color(human)));
    assert_eq!(stance(&client), defaults);
    assert_ne!(defaults.0, RingStance::Neutral);
    assert_ne!(defaults.1, Some(COLOR));
    let units = client.scene_mut().expect("scene").units_mut();
    units.set_ring_stance_resolver(|_| RingStance::Neutral);
    units.set_owner_color_fn(|_| COLOR);
    let kept = (RingStance::Neutral, Some(COLOR));

    // GetRenderFrame after StateChanged: the same scene takes the frame.
    command(&mut client, EngineCommand::SelectUnit { unit_id: WARRIOR });
    assert_eq!(stance(&client), kept, "state changed");
    // RenderUiParams change (engine asked).
    client.set_frame_ui(selected(WARRIOR)).expect("select ui");
    assert_eq!(stance(&client), kept, "frame ui");
    assert_eq!(
        client
            .scene()
            .expect("scene")
            .units()
            .selection()
            .map(|s| s.owner_id),
        Some(human)
    );
    // MapUiState / siege panel: recomposition from the cache.
    client
        .set_map_ui(MapUiState {
            show_worker_overlay: false,
            ..MapUiState::WEB_INITIAL
        })
        .expect("map ui");
    assert_eq!(stance(&client), kept, "map ui");
    client.set_siege_map_panel_open(true).expect("siege panel");
    assert_eq!(stance(&client), kept, "siege panel");
    // AdvanceTurn.
    command(&mut client, EngineCommand::AdvanceTurn);
    assert_eq!(stance(&client), kept, "next turn");
    assert_renderer_mirrors_dto(&client, "next turn");

    // A new session drops the scene: the next one starts from the defaults.
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map again");
    client.on_state_changed().expect("frame of the new session");
    assert_eq!(stance(&client), defaults, "new session, new scene");
}

/// What [`FaultySource`] does with the next `GetRenderFrame`.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Fault {
    None,
    /// The bridge error of an unknown seat.
    Source,
    /// A real frame with a foreign `contract_version`.
    Contract,
    /// A real frame with `fog.state` not parallel to `map.hexes`.
    FogLen,
}

/// [`BridgeSource`] with injected faults.
struct FaultySource {
    inner: BridgeSource,
    fault: Fault,
}

impl RenderSource for FaultySource {
    type Error = BridgeError;
    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        self.inner.render_map()
    }
    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        match self.fault {
            Fault::None => self.inner.render_frame(seat, ui),
            Fault::Source => self.inner.render_frame(Some(99), ui),
            Fault::Contract => {
                let mut f = self.inner.render_frame(seat, ui)?;
                f.0.contract_version = vm::CONTRACT_VERSION + 1;
                Ok(f)
            }
            Fault::FogLen => {
                let mut f = self.inner.render_frame(seat, ui)?;
                f.0.fog.state.pop();
                Ok(f)
            }
        }
    }
}

/// Z2 (mutant E6): an error after a good frame keeps the cached frame, the
/// renderer inputs and the scene of that frame (`on_state_changed` doc), for
/// `ClientError::Source` and for `ClientError::Frame`; the client recovers
/// on the next good frame.
#[test]
fn errors_after_a_frame_keep_the_previous_frame() {
    let mut client = RenderClient::new(
        FaultySource {
            inner: BridgeSource::new(),
            fault: Fault::None,
        },
        MapDetailQuality::High,
    );
    assert!(client
        .source_mut()
        .inner
        .command(EngineCommand::CreateSession {
            params: StartGameParams::default(),
        }));
    client.on_session_created().expect("map");
    client.on_state_changed().expect("good frame");
    let good = client.last_frame().expect("cached").clone();
    let good_inputs = client.frame_inputs().expect("inputs").clone();
    let warrior = WARRIOR.to_string();
    let token_hex = |c: &RenderClient<FaultySource>| {
        let t = c
            .scene()
            .expect("scene")
            .units()
            .token(&warrior)
            .expect("warrior token");
        (t.hex.q, t.hex.r)
    };
    let good_hex = token_hex(&client);
    let check_kept = |c: &RenderClient<FaultySource>, step: &str| {
        assert_eq!(c.last_frame(), Some(&good), "{step}: cached frame kept");
        assert_eq!(c.frame_inputs(), Some(&good_inputs), "{step}: inputs kept");
        assert_eq!(token_hex(c), good_hex, "{step}: scene kept");
    };

    // The state changes (the warrior moves): a good frame would differ.
    let start = good.units[0].hex;
    let reach = client
        .source_mut()
        .inner
        .direct_frame(None, Some(selected(WARRIOR)));
    let dest = *reach
        .overlays
        .reachable
        .iter()
        .find(|h| **h != start)
        .expect("a reachable hex");
    assert!(client
        .source_mut()
        .inner
        .command(EngineCommand::SelectUnit { unit_id: WARRIOR }));
    assert!(client.source_mut().inner.command(EngineCommand::MoveUnit {
        unit_id: WARRIOR,
        destination: PositionDto::new(
            u16::try_from(dest.q).expect("q"),
            u16::try_from(dest.r).expect("r"),
        ),
        attack_unit_id: None,
    }));

    client.source_mut().fault = Fault::Source;
    let err = client.on_state_changed().expect_err("source error");
    assert!(matches!(err, ClientError::Source(_)), "{err:?}");
    check_kept(&client, "source");

    client.source_mut().fault = Fault::Contract;
    let err = client.on_state_changed().expect_err("contract error");
    assert!(
        matches!(
            err,
            ClientError::Frame(FrameError::ContractVersion { expected, actual })
                if expected == vm::CONTRACT_VERSION && actual == vm::CONTRACT_VERSION + 1
        ),
        "{err:?}"
    );
    assert!(err.to_string().starts_with("render frame:"), "{err}");
    check_kept(&client, "contract");

    client.source_mut().fault = Fault::FogLen;
    let err = client.on_state_changed().expect_err("fog length error");
    assert!(
        matches!(err, ClientError::Frame(FrameError::View(_))),
        "{err:?}"
    );
    check_kept(&client, "fog length");

    // A recomposition after the errors still uses the good cached frame.
    let calls_before = client.source().inner.frame_calls;
    client
        .set_map_ui(MapUiState {
            territory_border_visible: false,
            ..MapUiState::WEB_INITIAL
        })
        .expect("recompose from the cache");
    assert_eq!(client.source().inner.frame_calls, calls_before);
    assert_eq!(
        client.last_frame(),
        Some(&good),
        "recomposed from the good frame"
    );
    assert_eq!(token_hex(&client), good_hex);

    // Recovery: the next good frame replaces the cache.
    client.source_mut().fault = Fault::None;
    client.on_state_changed().expect("good frame again");
    let now = client.last_frame().expect("cached").clone();
    assert_ne!(now, good);
    assert_eq!(now.units[0].hex, dest, "the moved warrior");
    assert_eq!(token_hex(&client), (dest.q, dest.r));
}

/// Z3 (mutant E7): the `MapDetailQuality` of `RenderClient::new` is the one
/// the terrain is built with (`resolveRenderPreset(...).robloxLite`,
/// `mapRenderStyle.ts:114-127`).
#[test]
fn detail_quality_reaches_the_terrain() {
    let terrain_of = |detail: MapDetailQuality| {
        let mut client = RenderClient::new(BridgeSource::new(), detail);
        assert!(client.source_mut().command(EngineCommand::CreateSession {
            params: StartGameParams::default(),
        }));
        client.on_session_created().expect("map");
        client.on_state_changed().expect("frame");
        let map = client.map().expect("map");
        let hexes = map.map().hexes.len();
        let inputs = client.frame_inputs().expect("inputs");
        // The reference: a scene built by hand from the same first frame with
        // `detail`, then fed that frame (fog changes the prisms).
        let mut expected = MapScene::new(map, inputs, detail);
        expected.apply(inputs).expect("apply");
        let terrain = client.scene().expect("scene").terrain().clone();
        assert_eq!(&terrain, expected.terrain(), "{detail:?}: terrain");
        assert_eq!(
            terrain.roblox_lite,
            roblox_lite(detail, hexes),
            "{detail:?}"
        );
        (hexes, terrain)
    };
    let (hexes, low) = terrain_of(MapDetailQuality::Low);
    let (_, high) = terrain_of(MapDetailQuality::High);
    assert!(
        hexes <= LARGE_MAP_LITE_HEX_THRESHOLD,
        "the start map is not large"
    );
    assert!(low.roblox_lite, "low: lite");
    assert!(!high.roblox_lite, "high: not lite");
    assert_ne!(low, high, "the detail changes the terrain");
}

// ------------------------------------------------------------ D-371-5b (#371 T5b)

/// The improvement key of the scenario (`onSelectType`); the start capital
/// gives it a non-empty qualifying set (asserted below).
const KEY: &str = "farma";

fn highlight_hexes(client: &Client) -> Option<Vec<(i32, i32)>> {
    client
        .scene()
        .expect("scene")
        .units()
        .highlight()
        .map(|h| h.hexes.iter().map(|x| (x.q, x.r)).collect())
}

fn dto_hexes(hexes: &[vm::HexCoord]) -> Vec<(i32, i32)> {
    hexes.iter().map(|h| (h.q, h.r)).collect()
}

fn ring(client: &Client) -> Option<(i32, i32)> {
    client
        .scene()
        .expect("scene")
        .units()
        .selection()
        .map(|s| (s.hex.q, s.hex.r))
}

fn open_panel() -> BuildMode {
    BuildMode {
        build_mode_open: true,
        ..BuildMode::default()
    }
}

fn started_client() -> Client {
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    assert!(client.source_mut().command(EngineCommand::CreateSession {
        params: StartGameParams::default(),
    }));
    client.on_session_created().expect("map");
    client.on_state_changed().expect("frame");
    client
}

/// The web scenario of D-371-5b end to end (engine -> bridge -> client ->
/// renderer): `onOpenBuild` -> frame without selection -> `selectPlayerUnit`
/// in build mode -> frame with `selection` + `reachable` (+ `buildHighlight`
/// once a key is chosen), visible layer = range -> key change -> visible
/// layer = build, selection and ring kept -> panel closed -> flag `false`.
#[test]
fn t5b_web_scenario_build_mode_reselect_end_to_end() {
    let mut client = started_client();
    assert_eq!(calls(&client), (1, 1));
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);

    // 1. onOpenBuild: no selection, no reachable, no ring.
    client.set_build_mode(open_panel()).expect("open panel");
    assert_eq!(calls(&client), (1, 2));
    let ui = &client.ui().frame_ui;
    assert!(ui.build_mode_open && !ui.unit_selected_after_build_open);
    assert_eq!(ui.selected_unit_id, None);
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    let f = frame(&client);
    assert_eq!(f.overlays.selection, None);
    assert!(f.overlays.reachable.is_empty());
    assert_eq!(ring(&client), None);
    assert_renderer_mirrors_dto(&client, "panel open");

    // 2. selectPlayerUnit with the panel open: flag on, writer Reachable.
    client
        .select_unit(Some(WARRIOR))
        .expect("select in build mode");
    assert_eq!(calls(&client), (1, 3), "RenderUiParams changed");
    let ui = &client.ui().frame_ui;
    assert_eq!(ui.selected_unit_id, Some(WARRIOR));
    assert!(ui.unit_selected_after_build_open, "flag set in build mode");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );
    assert_active_seat_frame(&mut client, "reselected");
    assert_renderer_mirrors_dto(&client, "reselected");
    assert_selection_drawn(&client, "reselected");
    let reach = dto_hexes(&frame(&client).overlays.reachable);
    let sel = frame(&client).overlays.selection.expect("selection");
    assert_eq!(highlight_hexes(&client), Some(reach.clone()));

    // 3. Key chosen (`onSelectType` -> `refreshBuildHighlight`): both layers
    //    in the frame, the build layer wins; selection, flag and ring kept.
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    assert_eq!(calls(&client), (1, 4));
    let ui = &client.ui().frame_ui;
    assert_eq!(ui.selected_unit_id, Some(WARRIOR), "selection kept");
    assert!(
        ui.unit_selected_after_build_open,
        "flag kept on a key change (mutant c)"
    );
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_renderer_mirrors_dto(&client, "keyed");
    assert_active_seat_frame(&mut client, "keyed");
    let f = frame(&client).clone();
    assert_eq!(f.overlays.selection, Some(sel), "selection in the frame");
    assert_eq!(dto_hexes(&f.overlays.reachable), reach, "reachable kept");
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Improvement
    );
    let build = dto_hexes(&f.overlays.build_highlight.hexes);
    assert!(!build.is_empty(), "{KEY}: qualifying hexes of the capital");
    assert_ne!(build, reach);
    assert_eq!(highlight_hexes(&client), Some(build.clone()), "build wins");
    assert_eq!(
        ring(&client),
        Some((sel.hex.q, sel.hex.r)),
        "ring kept (mutant f)"
    );

    // 4. The writer alone never calls the engine (D-371-4, mutant e).
    client
        .set_highlight_last_writer(HighlightPriority::Reachable)
        .expect("writer");
    assert_eq!(calls(&client), (1, 4), "writer change: no GetRenderFrame");
    assert_eq!(highlight_hexes(&client), Some(reach.clone()));
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)));
    assert_renderer_mirrors_dto(&client, "writer reachable");
    client
        .set_highlight_last_writer(HighlightPriority::Build)
        .expect("writer back");
    assert_eq!(calls(&client), (1, 4));
    assert_eq!(highlight_hexes(&client), Some(build.clone()));
    // `selectPlayerUnit` again with the key: same RenderUiParams, only the
    // writer changes -> no engine call, the range wins.
    client.select_unit(Some(WARRIOR)).expect("select again");
    assert_eq!(
        calls(&client),
        (1, 4),
        "same RenderUiParams: no GetRenderFrame"
    );
    assert_eq!(highlight_hexes(&client), Some(reach.clone()));
    // An equal key does nothing (writer stays Reachable).
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("same key");
    assert_eq!(calls(&client), (1, 4));
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );

    // 5. Panel closed (`onOpenBuild` again): flag false, selection cleared.
    client
        .set_build_mode(BuildMode::default())
        .expect("close panel");
    assert_eq!(calls(&client), (1, 5));
    let ui = &client.ui().frame_ui;
    assert!(
        !ui.unit_selected_after_build_open,
        "flag zeroed on mode change"
    );
    assert!(!ui.build_mode_open);
    assert_eq!(ui.selected_unit_id, None);
    assert_eq!(ui.active_improvement_key, None);
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_eq!(frame(&client).overlays.selection, None);
    assert_eq!(ring(&client), None);
    assert_renderer_mirrors_dto(&client, "panel closed");

    // 6. Outside build mode: a plain selection, the flag stays false
    //    (mutant d).
    client.select_unit(Some(WARRIOR)).expect("plain select");
    assert_eq!(calls(&client), (1, 6));
    assert_eq!(client.ui().frame_ui, selected(WARRIOR));
    assert!(!client.ui().frame_ui.unit_selected_after_build_open);
    assert_selection_drawn(&client, "plain select");
    assert_active_seat_frame(&mut client, "plain select");
}

/// Mode switches inside the open panel (found city / wonder) make Build the
/// writer (D-371-5b) and keep the selection AND the flag: `onSelectFoundCity`
/// / `onSelectWonder` do not call `clearPlayerUnitSelection()`
/// (`main.ts:26758-26793`; decision D-371-5c U-OP-2, which replaces the T5b
/// assertion "flag zeroed, overlays hidden"): the ring stays, the visible
/// layer is the build set of the mode (`refreshBuildHighlight`), never the
/// range (mutant b: flag zeroed in found city / wonder).
#[test]
fn t5c_mode_switch_keeps_selection_and_flag_key_change_keeps_it() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client.select_unit(Some(WARRIOR)).expect("select");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    let before = calls(&client);

    // Key change: flag kept (mutant c).
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    client.set_active_improvement_key(None).expect("no key");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    assert_eq!(calls(&client).1, before.1 + 2);

    // Found city mode switched on inside the panel (`onSelectFoundCity`,
    // `:26758-26762`): selection and flag kept, writer Build.
    client.select_unit(Some(WARRIOR)).expect("select");
    let sel = frame(&client).overlays.selection.expect("selection");
    let reach = dto_hexes(&frame(&client).overlays.reachable);
    assert!(!reach.is_empty());
    client
        .set_build_mode(BuildMode {
            found_city_mode: true,
            ..open_panel()
        })
        .expect("found city");
    let ui = &client.ui().frame_ui;
    assert!(ui.unit_selected_after_build_open, "U-OP-2: flag kept");
    assert_eq!(ui.selected_unit_id, Some(WARRIOR));
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_active_seat_frame(&mut client, "found city");
    let f = frame(&client).clone();
    assert_eq!(f.overlays.selection, Some(sel), "U-OP-2: selection drawn");
    assert_eq!(
        dto_hexes(&f.overlays.reachable),
        reach,
        "range in the frame"
    );
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::FoundCity
    );
    let found = dto_hexes(&f.overlays.build_highlight.hexes);
    // `refreshBuildHighlight` with `foundCityMode`: `setHighlight(qual)`
    // (`:16352-16361`), an empty `qual` = no discs (D-T5C-5), never the range.
    let want = (!found.is_empty()).then_some(found);
    assert_eq!(highlight_hexes(&client), want, "found city layer");
    assert_ne!(highlight_hexes(&client), Some(reach.clone()));
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)), "ring kept");
    assert_renderer_mirrors_dto(&client, "found city");

    // selectPlayerUnit in found city mode: the flag is already on, so only
    // the writer changes (no engine call) and the range wins.
    let n = calls(&client);
    client.select_unit(Some(WARRIOR)).expect("select");
    assert_eq!(calls(&client), n, "same RenderUiParams: no GetRenderFrame");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    assert!(frame(&client).overlays.selection.is_some());
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );
    assert_eq!(highlight_hexes(&client), Some(reach.clone()));
    // Wonder switch (`onSelectWonder`, `:26766-26793`): flag and selection
    // kept, writer Build; an equal mode does nothing.
    client
        .set_build_mode(BuildMode {
            wonder_active: true,
            ..open_panel()
        })
        .expect("wonder");
    assert!(
        client.ui().frame_ui.unit_selected_after_build_open,
        "U-OP-2: flag kept"
    );
    assert_eq!(client.ui().frame_ui.selected_unit_id, Some(WARRIOR));
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_eq!(frame(&client).overlays.selection, Some(sel));
    assert_ne!(highlight_hexes(&client), Some(reach));
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)));
    let n = calls(&client);
    client
        .set_build_mode(BuildMode {
            wonder_active: true,
            ..open_panel()
        })
        .expect("same mode");
    assert_eq!(calls(&client), n);
}

/// Before a session the new setters only store the state (no engine call).
#[test]
fn t5b_setters_before_session_only_store() {
    let mut client = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    client.set_build_mode(open_panel()).expect("stored");
    client.select_unit(Some(WARRIOR)).expect("stored");
    client
        .set_highlight_last_writer(HighlightPriority::Build)
        .expect("stored");
    assert_eq!(calls(&client), (0, 0));
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    assert!(client.last_frame().is_none());
}

/// U-EV-1 (Obrona r1): `set_ui` carries `highlight_last_writer` — without a
/// `RenderUiParams` change it only recomposes (D-371-4), with one the new
/// frame is composed with the new writer.
#[test]
fn t5b_set_ui_carries_the_highlight_writer() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client.select_unit(Some(WARRIOR)).expect("select");
    let reach = dto_hexes(&frame(&client).overlays.reachable);
    let sel = frame(&client).overlays.selection.expect("selection");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    let build = dto_hexes(&frame(&client).overlays.build_highlight.hexes);
    assert!(!build.is_empty() && build != reach);
    assert_eq!(highlight_hexes(&client), Some(build.clone()));
    let n = calls(&client);

    // Writer alone through set_ui: no engine call, the range wins.
    let ui = ClientUiState {
        highlight_last_writer: HighlightPriority::Reachable,
        ..client.ui().clone()
    };
    client.set_ui(ui).expect("set_ui writer");
    assert_eq!(calls(&client), n, "set_ui writer only: no GetRenderFrame");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );
    assert_eq!(highlight_hexes(&client), Some(reach));

    // Writer back to Build together with a RenderUiParams change (hover):
    // one engine call, composed with the new writer.
    let mut ui = ClientUiState {
        highlight_last_writer: HighlightPriority::Build,
        ..client.ui().clone()
    };
    ui.frame_ui.hover = Some(PositionDto::new(
        u16::try_from(sel.hex.q).expect("q"),
        u16::try_from(sel.hex.r).expect("r"),
    ));
    client.set_ui(ui).expect("set_ui writer + frame_ui");
    assert_eq!(calls(&client), (n.0, n.1 + 1));
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_eq!(highlight_hexes(&client), Some(build));
}

/// U-EV-2 (Obrona r1): `onSelectFoundCity` (`main.ts:26758-26762`) and
/// `onSelectWonder` (`:26767-26770`) set `activeImprovementKey = null`.
/// U-EV-3: `onSelectType` (`:26733-26739`) switches found city and the wonder
/// off without clearing the selection (flag and ring kept, D-371-5b key rule).
#[test]
fn t5b_mode_switches_clear_the_key_and_key_choice_clears_the_modes() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");

    // onSelectFoundCity: key cleared.
    client
        .set_build_mode(BuildMode {
            found_city_mode: true,
            ..open_panel()
        })
        .expect("found city");
    assert_eq!(client.ui().frame_ui.active_improvement_key, None);
    assert!(client.ui().frame_ui.found_city_mode);

    // onSelectType in found city mode with a selected unit: found city off,
    // flag and selection kept, the build layer of the key wins, ring kept.
    client.select_unit(Some(WARRIOR)).expect("select");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    let sel = frame(&client).overlays.selection.expect("selection");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key in found city");
    let ui = &client.ui().frame_ui;
    assert!(!ui.found_city_mode && !ui.wonder_active, "onSelectType");
    assert!(ui.unit_selected_after_build_open, "flag kept");
    assert_eq!(ui.selected_unit_id, Some(WARRIOR));
    assert_eq!(ui.active_improvement_key.as_deref(), Some(KEY));
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    assert_active_seat_frame(&mut client, "key after found city");
    let f = frame(&client).clone();
    assert_eq!(
        f.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Improvement
    );
    assert_eq!(
        highlight_hexes(&client),
        Some(dto_hexes(&f.overlays.build_highlight.hexes))
    );
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)), "ring kept");

    // onSelectWonder: key cleared.
    client
        .set_build_mode(BuildMode {
            wonder_active: true,
            ..open_panel()
        })
        .expect("wonder");
    assert_eq!(client.ui().frame_ui.active_improvement_key, None);
    // onSelectType with the wonder active: wonder off.
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key in wonder");
    assert!(!client.ui().frame_ui.wonder_active);
    assert_eq!(
        client.ui().frame_ui.active_improvement_key.as_deref(),
        Some(KEY)
    );
}

// ------------------------------------------------------------ D-371-5c (#371 T5c)

/// The warrior hex in the cached frame.
fn warrior_hex(client: &Client) -> vm::HexCoord {
    frame(client)
        .units
        .iter()
        .find(|u| u.id.to_string() == WARRIOR.to_string())
        .expect("warrior")
        .hex
}

/// U-OP-1 end to end: `selectPlayerUnit` of a unit that cannot move
/// (`stackCanMove(u) == false`) writes `setHighlight(new Set())`
/// (`main.ts:7256-7261`): in build mode with a key the frame carries the
/// build layer and an EMPTY `reachable`, the visible layer is no discs (not
/// the build layer, mutant a); the ring is drawn.
#[test]
fn t5c_u_op_1_unit_without_moves_in_build_mode_is_no_discs() {
    let mut client = started_client();
    command(&mut client, EngineCommand::SelectUnit { unit_id: WARRIOR });
    client.select_unit(Some(WARRIOR)).expect("plain select");
    // Spend the moves of the warrior.
    let mut moves = 0;
    while !frame(&client).overlays.reachable.is_empty() {
        moves += 1;
        assert!(moves <= 8, "the warrior runs out of moves");
        let start = warrior_hex(&client);
        let dest = *frame(&client)
            .overlays
            .reachable
            .iter()
            .find(|h| **h != start)
            .expect("a reachable hex");
        command(
            &mut client,
            EngineCommand::MoveUnit {
                unit_id: WARRIOR,
                destination: PositionDto::new(
                    u16::try_from(dest.q).expect("q"),
                    u16::try_from(dest.r).expect("r"),
                ),
                attack_unit_id: None,
            },
        );
    }
    assert!(moves >= 1);
    assert_eq!(highlight_hexes(&client), None, "no moves: no discs");

    client.set_build_mode(open_panel()).expect("open");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    let n = calls(&client);
    client
        .select_unit(Some(WARRIOR))
        .expect("select without moves");
    assert_eq!(calls(&client), (n.0, n.1 + 1));
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    assert_active_seat_frame(&mut client, "no moves");
    let f = frame(&client).clone();
    let sel = f.overlays.selection.expect("selection in the frame");
    assert!(f.overlays.reachable.is_empty(), "no moves: empty reachable");
    let build = dto_hexes(&f.overlays.build_highlight.hexes);
    assert!(!build.is_empty(), "{KEY}: the build layer is in the frame");
    assert_eq!(highlight_hexes(&client), None, "U-OP-1: no discs");
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)), "ring drawn");
    assert_renderer_mirrors_dto(&client, "no moves");

    // refreshBuildHighlight (writer Build): the build layer; back to the
    // reachable writer: no discs again. Neither calls the engine.
    client
        .set_highlight_last_writer(HighlightPriority::Build)
        .expect("build writer");
    assert_eq!(highlight_hexes(&client), Some(build));
    client
        .set_highlight_last_writer(HighlightPriority::Reachable)
        .expect("reachable writer");
    assert_eq!(highlight_hexes(&client), None);
    assert_eq!(calls(&client), (n.0, n.1 + 1));
}

/// U-OP-4 end to end: `clearPlayerUnitSelection()` in build mode
/// (`main.ts:7090-7101`: `selectedId = null; ...;
/// unitRenderer.clearHighlight()`): no selection, flag `false`, writer
/// Cleared; the frame still carries the build layer, the visible layer is no
/// discs (mutant d) until the next `refreshBuildHighlight`; the build mode
/// is kept. One engine call (the selection changed), the writer alone none.
#[test]
fn t5c_u_op_4_deselect_in_build_mode_clears_the_layer() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    client.select_unit(Some(WARRIOR)).expect("select");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    let reach = dto_hexes(&frame(&client).overlays.reachable);
    assert_eq!(highlight_hexes(&client), Some(reach));
    let n = calls(&client);

    client.select_unit(None).expect("deselect");
    assert_eq!(calls(&client), (n.0, n.1 + 1), "selection changed");
    let ui = &client.ui().frame_ui;
    assert_eq!(ui.selected_unit_id, None);
    assert!(!ui.unit_selected_after_build_open, "no unit selected");
    assert!(ui.build_mode_open, "build mode kept");
    assert_eq!(ui.active_improvement_key.as_deref(), Some(KEY), "key kept");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Cleared
    );
    assert_active_seat_frame(&mut client, "deselected");
    let f = frame(&client).clone();
    assert_eq!(f.overlays.selection, None);
    let build = dto_hexes(&f.overlays.build_highlight.hexes);
    assert!(!build.is_empty(), "the build layer is in the frame");
    assert_eq!(highlight_hexes(&client), None, "U-OP-4: clearHighlight()");
    assert_eq!(ring(&client), None);
    assert_renderer_mirrors_dto(&client, "deselected");

    // The writer is kept by the calls that are not pin writers (mutant e).
    let n = calls(&client);
    client.set_map_ui(client.ui().map_ui).expect("map ui");
    client.set_siege_map_panel_open(false).expect("siege panel");
    assert_eq!(calls(&client), n);
    client.on_state_changed().expect("state changed");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Cleared
    );
    assert_eq!(highlight_hexes(&client), None);

    // The next refreshBuildHighlight (writer Build, no engine call).
    let n = calls(&client);
    client
        .set_highlight_last_writer(HighlightPriority::Build)
        .expect("refreshBuildHighlight");
    assert_eq!(calls(&client), n);
    assert_eq!(highlight_hexes(&client), Some(build));

    // A deselect without a selection (same RenderUiParams): only the
    // writer changes, no engine call.
    client.select_unit(None).expect("deselect again");
    assert_eq!(calls(&client), n);
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Cleared
    );
    assert_eq!(highlight_hexes(&client), None);

    // Outside build mode: deselect = no discs, no ring.
    client.set_build_mode(BuildMode::default()).expect("close");
    client.select_unit(Some(WARRIOR)).expect("plain select");
    assert!(highlight_hexes(&client).is_some());
    client.select_unit(None).expect("plain deselect");
    assert_eq!(client.ui().frame_ui, RenderUiParams::default());
    assert_eq!(highlight_hexes(&client), None);
    assert_eq!(ring(&client), None);
}

/// U-OP-3 end to end: `exitBuildMode()` (Escape / right click / `onExit`,
/// `main.ts:16526-16541`) closes the build mode and does NOT clear the
/// selection (mutant c); `refreshBuildHighlight` outside build mode is
/// `clearHighlight()` (`:16369-16372`): the ring stays, no discs, although
/// the frame carries the range again; the next `selectPlayerUnit` shows the
/// range without an engine call.
#[test]
fn t5c_u_op_3_exit_build_mode_keeps_the_selection() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    client.select_unit(Some(WARRIOR)).expect("select");
    let sel = frame(&client).overlays.selection.expect("selection");
    let n = calls(&client);

    client.exit_build_mode().expect("Escape");
    assert_eq!(calls(&client), (n.0, n.1 + 1), "build mode changed");
    let ui = &client.ui().frame_ui;
    assert!(!ui.build_mode_open && !ui.found_city_mode && !ui.wonder_active);
    assert_eq!(ui.active_improvement_key, None);
    assert!(!ui.unit_selected_after_build_open, "build mode closed");
    assert_eq!(ui.selected_unit_id, Some(WARRIOR), "U-OP-3: selection kept");
    assert_eq!(client.ui().frame_ui, selected(WARRIOR));
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Cleared
    );
    assert_active_seat_frame(&mut client, "exit");
    let f = frame(&client).clone();
    assert_eq!(f.overlays.selection, Some(sel));
    assert!(f.overlays.build_highlight.hexes.is_empty());
    let reach = dto_hexes(&f.overlays.reachable);
    assert!(!reach.is_empty(), "the range is in the frame again");
    assert_eq!(highlight_hexes(&client), None, "U-OP-3: clearHighlight()");
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)), "ring kept");
    assert_renderer_mirrors_dto(&client, "exit");

    // Not a writer: StateChanged keeps the layer (mutant e).
    client.on_state_changed().expect("state changed");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Cleared
    );
    assert_eq!(highlight_hexes(&client), None);

    // Escape again outside build mode: same RenderUiParams, only the
    // writer (refreshBuildHighlight -> clearHighlight), no engine call.
    let n = calls(&client);
    client.exit_build_mode().expect("exit again");
    assert_eq!(calls(&client), n, "no GetRenderFrame (D-371-4)");

    // selectPlayerUnit: same RenderUiParams, the range, no engine call.
    client.select_unit(Some(WARRIOR)).expect("reselect");
    assert_eq!(calls(&client), n, "no GetRenderFrame (mutant f)");
    assert_eq!(
        client.ui().highlight_last_writer,
        HighlightPriority::Reachable
    );
    assert_eq!(highlight_hexes(&client), Some(reach));
    assert_selection_drawn(&client, "reselect after exit");

    // Before a session: only stored.
    let mut fresh = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    fresh.set_build_mode(open_panel()).expect("stored");
    fresh.select_unit(Some(WARRIOR)).expect("stored");
    fresh.exit_build_mode().expect("stored");
    assert_eq!(calls(&fresh), (0, 0));
    assert_eq!(fresh.ui().frame_ui, selected(WARRIOR));
    assert_eq!(fresh.ui().highlight_last_writer, HighlightPriority::Cleared);
}

/// D-T5C-5: in build mode the writer Build never shows the range the frame
/// carries with `unit_selected_after_build_open`: an empty build set is
/// `setHighlight(new Set())` / `clearHighlight()` (`main.ts:16351-16372`).
/// End to end: panel open, unit selected (flag), key chosen then cleared
/// (`activeImprovementKey = null` -> `refreshBuildHighlight` ->
/// `clearHighlight()`, `:16369-16372`): ring kept, no discs.
#[test]
fn t5c_build_writer_in_build_mode_never_shows_the_range() {
    let mut client = started_client();
    client.set_build_mode(open_panel()).expect("open");
    client.select_unit(Some(WARRIOR)).expect("select");
    let sel = frame(&client).overlays.selection.expect("selection");
    let reach = dto_hexes(&frame(&client).overlays.reachable);
    client
        .set_active_improvement_key(Some(KEY.to_owned()))
        .expect("key");
    client.set_active_improvement_key(None).expect("no key");
    assert!(client.ui().frame_ui.unit_selected_after_build_open);
    assert_eq!(client.ui().highlight_last_writer, HighlightPriority::Build);
    let f = frame(&client).clone();
    assert!(f.overlays.build_highlight.hexes.is_empty());
    assert_eq!(
        dto_hexes(&f.overlays.reachable),
        reach,
        "range in the frame"
    );
    assert_eq!(highlight_hexes(&client), None, "no discs");
    assert_eq!(ring(&client), Some((sel.hex.q, sel.hex.r)));
    assert_eq!(
        civ_client::renderer_priority(client.ui(), &f),
        HighlightPriority::Cleared
    );

    // The rule on hand states: outside build mode the writer is passed as is
    // (Q6-2 for frames without a build mode); a non-empty build set too.
    let mut out = client.ui().clone();
    out.frame_ui = selected(WARRIOR);
    assert_eq!(
        civ_client::renderer_priority(&out, &f),
        HighlightPriority::Build
    );
    let mut keyed = f.clone();
    keyed.overlays.build_highlight.hexes = vec![sel.hex];
    assert_eq!(
        civ_client::renderer_priority(client.ui(), &keyed),
        HighlightPriority::Build
    );
    for w in [HighlightPriority::Reachable, HighlightPriority::Cleared] {
        let ui = ClientUiState {
            highlight_last_writer: w,
            ..client.ui().clone()
        };
        assert_eq!(civ_client::renderer_priority(&ui, &f), w);
    }
}
