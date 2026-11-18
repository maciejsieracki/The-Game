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
    ClientError, ClientUiState, FrameError, MapDetailQuality, MapScene, MapUiState, RenderClient,
    RenderFramePayload, RenderMapPayload, RenderSource, RenderUiParams, VIEWER_SEAT,
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
