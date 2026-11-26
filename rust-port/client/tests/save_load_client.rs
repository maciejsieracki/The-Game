//! R-RUSTPORT-P4-409-CLIENT-API-GAPS-Q1 (#409, part B of #403): end-to-end test "engine -> bridge -> client ->
//! CPU renderer" of save -> load.
//!
//! The real bridge (`engine/src/bridge.rs` through `#[path]`, D-371-1) over `CivEngineAdapter` feeds
//! [`RenderClient`] through a counting [`BridgeSource`] (`RenderSource` + `SaveLoadSource`). Pin `07d2fbd72`:
//! `restoreGameFromSave` (`main.ts:46225`, its end `:47328-47332`) and the full rebuild of the map scene after it
//! (`:46138-46156`). The client refreshes as after `CreateSession` (D-371-4, D-409-OP-2): ONE `GetRenderMap` then ONE
//! `GetRenderFrame`; a rejected save changes nothing (D-409-OP-3).

#[path = "../../engine/src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeEvent, BridgeRequest, BridgeResult, CivEngineAdapter,
    EngineBridge, EngineCommand, StartGameParams,
};
use civ_client::{
    BuildMode, ClientError, ClientUiState, HighlightPriority, LoadGameError, MapDetailQuality,
    MapStatic, RenderClient, RenderFramePayload, RenderMapPayload, RenderSource, RenderUiParams,
    SaveLoadSource,
};
use civ_engine::domain::playable::PlayableState;
use civ_engine::PositionDto;
use civ_view_model::RenderLayersDto;

/// `STARTING_UNIT_ID` of the start scenario (`playable.rs:43`).
const WARRIOR: u64 = 1;

// ------------------------------------------------------------ source

/// One query of the client, in the order it reached the bridge.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Call {
    Map,
    Frame,
    Save,
    Load,
}

/// `RenderSource` + `SaveLoadSource` over the real bridge, counting and logging the client's queries.
struct BridgeSource {
    bridge: EngineBridge<CivEngineAdapter>,
    next_id: u64,
    log: Vec<Call>,
    /// The last `GetRenderMap` answer the client received.
    last_map: Option<RenderMapPayload>,
    /// `GetRenderMap` fails (transport) while set: the refresh path after an accepted load.
    fail_map: bool,
}

impl BridgeSource {
    fn new() -> Self {
        Self {
            bridge: EngineBridge::new(CivEngineAdapter::default()),
            next_id: 0,
            log: Vec::new(),
            last_map: None,
            fail_map: false,
        }
    }

    fn request(&mut self, command: EngineCommand) -> Result<BridgeDispatch, BridgeError> {
        self.next_id += 1;
        self.bridge
            .handle(BridgeRequest::new(format!("409-{}", self.next_id), command))
    }

    /// A game command; `true` when the answer carries `StateChanged`.
    fn command(&mut self, command: EngineCommand) -> bool {
        let label = format!("{command:?}");
        let d = self.request(command).expect(&label);
        d.events
            .iter()
            .any(|e| matches!(e, BridgeEvent::StateChanged { .. }))
    }

    /// The game state (`GetState`), uncounted.
    fn state(&mut self) -> PlayableState {
        match self
            .request(EngineCommand::GetState)
            .expect("GetState")
            .response
            .result
        {
            BridgeResult::State { state } => state,
            _ => panic!("State expected"),
        }
    }

    fn count(&self, call: Call) -> usize {
        self.log.iter().filter(|c| **c == call).count()
    }
}

fn unexpected(query: &str) -> BridgeError {
    BridgeError::internal(format!("{query}: unexpected result"))
}

impl RenderSource for BridgeSource {
    type Error = BridgeError;

    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        self.log.push(Call::Map);
        if self.fail_map {
            return Err(BridgeError::internal("transport: render map lost"));
        }
        let d = self.request(EngineCommand::GetRenderMap)?;
        match d.response.result {
            BridgeResult::RenderMap { map } => {
                self.last_map = Some(map.clone());
                Ok(map)
            }
            _ => Err(unexpected("get_render_map")),
        }
    }

    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        self.log.push(Call::Frame);
        let d = self.request(EngineCommand::GetRenderFrame { seat, ui })?;
        match d.response.result {
            BridgeResult::RenderFrame { frame } => Ok(frame),
            _ => Err(unexpected("get_render_frame")),
        }
    }
}

impl SaveLoadSource for BridgeSource {
    fn save_game(&mut self) -> Result<String, BridgeError> {
        self.log.push(Call::Save);
        let d = self.request(EngineCommand::SaveGame)?;
        assert!(d.events.is_empty(), "SaveGame emits no StateChanged");
        d.response.save_game.ok_or_else(|| unexpected("save_game"))
    }

    fn load_game(&mut self, save: &str) -> Result<(), BridgeError> {
        self.log.push(Call::Load);
        let d = self.request(EngineCommand::LoadGame {
            save: save.to_owned(),
        })?;
        assert!(
            d.events
                .iter()
                .any(|e| matches!(e, BridgeEvent::StateChanged { .. })),
            "an accepted LoadGame emits StateChanged"
        );
        Ok(())
    }
}

type Client = RenderClient<BridgeSource>;

// ------------------------------------------------------------ helpers

fn params(seed: u32) -> StartGameParams {
    StartGameParams {
        seed,
        ..StartGameParams::default()
    }
}

/// `CreateSession { seed }` -> `GetRenderMap` -> `GetRenderFrame`.
fn started(seed: u32) -> Client {
    let mut c = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    assert!(c.source_mut().command(EngineCommand::CreateSession {
        params: params(seed)
    }));
    c.on_session_created().expect("map");
    c.on_state_changed().expect("frame");
    c
}

fn frame(c: &Client) -> &RenderLayersDto {
    c.last_frame().expect("cached frame")
}

/// A game command through the client's bridge + the `StateChanged` refresh (D-371-4).
fn command(c: &mut Client, cmd: EngineCommand) {
    assert!(c.source_mut().command(cmd), "StateChanged");
    c.on_state_changed().expect("frame after StateChanged");
}

/// The map and the frame of `save` on an independent bridge (reference of "the loaded state").
fn reference(save: &str, ui: &RenderUiParams) -> (RenderMapPayload, RenderLayersDto) {
    let mut s = BridgeSource::new();
    s.load_game(save).expect("reference load");
    let map = s.render_map().expect("reference map");
    let frame = s
        .render_frame(None, Some(ui.clone()))
        .expect("reference frame");
    (map, frame.0)
}

fn json<T: serde::Serialize>(v: &T) -> String {
    serde_json::to_string(v).expect("json")
}

/// The renderer state mirrors the cached frame (inputs taken from it, scene built).
fn assert_renderer_fed(c: &Client) {
    let f = frame(c);
    let inputs = c.frame_inputs().expect("renderer inputs of the frame");
    assert_eq!(inputs.turn, f.turn, "inputs of the cached frame");
    assert_eq!(inputs.viewer, f.viewer);
    let scene = c.scene().expect("scene");
    assert_eq!(scene.overlays(), Some(&inputs.overlays));
    let units = scene.units();
    assert_eq!(units.token_count(), f.units.len(), "one token per DTO unit");
    for u in &f.units {
        let t = units.token(&u.id.to_string()).expect("token of a DTO unit");
        assert_eq!((t.hex.q, t.hex.r), (u.hex.q, u.hex.r), "token hex");
    }
}

// ------------------------------------------------------------ tests

/// Save -> change the state (turn, unit, UI) -> load: ONE `GetRenderMap` then ONE `GetRenderFrame`, the map and the
/// frame are those of the loaded state (not the previous one), the UI is that of the end of `restoreGameFromSave`.
#[test]
fn zapis_odczyt_mapa_i_ramka_stanu_wczytanego() {
    let mut c = started(7);
    // The UI the player had when saving (selection + hover).
    c.set_frame_ui(RenderUiParams {
        selected_unit_id: Some(WARRIOR),
        hover: Some(PositionDto::new(1, 1)),
        ..RenderUiParams::default()
    })
    .expect("ui");
    let saved_turn = frame(&c).turn;
    let save = c.save_game().expect("save");
    assert!(!save.is_empty());
    let saved_state = c.source_mut().state();

    // The game goes on: two turns.
    command(&mut c, EngineCommand::AdvanceTurn);
    command(&mut c, EngineCommand::AdvanceTurn);
    assert_eq!(frame(&c).turn, saved_turn + 2);
    let before_load = frame(&c).clone();
    let log_len = c.source().log.len();
    let maps = c.source().count(Call::Map);
    let frames = c.source().count(Call::Frame);

    c.load_game(&save).expect("load");

    // Order and counts: Load, then ONE map, then ONE frame.
    assert_eq!(
        &c.source().log[log_len..],
        &[Call::Load, Call::Map, Call::Frame],
        "LoadGame -> GetRenderMap -> GetRenderFrame"
    );
    assert_eq!(
        c.source().count(Call::Map),
        maps + 1,
        "GetRenderMap = 1 per load"
    );
    assert_eq!(
        c.source().count(Call::Frame),
        frames + 1,
        "GetRenderFrame = 1 per load"
    );

    // UI of `restoreGameFromSave` (`:47328-47332`).
    let ui = c.ui();
    assert_eq!(ui.frame_ui.selected_unit_id, None, "selectedId = null");
    assert_eq!(ui.frame_ui.hover, None, "hoverKey = null");
    assert!(!ui.frame_ui.unit_selected_after_build_open);
    assert_eq!(
        ui.highlight_last_writer,
        HighlightPriority::Cleared,
        "clearHighlight()"
    );

    // The frame is that of the loaded state.
    assert_eq!(frame(&c).turn, saved_turn, "turn of the save");
    assert_ne!(
        frame(&c),
        &before_load,
        "not the frame of the previous state"
    );
    let (ref_map, ref_frame) = reference(&save, &c.ui().frame_ui);
    assert_eq!(
        json(frame(&c)),
        json(&ref_frame),
        "frame = frame of the loaded state"
    );
    assert_eq!(
        c.map(),
        Some(&MapStatic::from_dto(&ref_map.0).expect("ref map")),
        "map = map of the loaded state"
    );
    assert_eq!(
        c.source_mut().state(),
        saved_state,
        "engine state = saved state"
    );
    assert_renderer_fed(&c);
    assert_eq!(frame(&c).overlays.selection, None, "no selection drawn");
}

/// A save of another game (another map): the client takes the map of the save, not the one of the session.
#[test]
fn odczyt_innej_mapy_buduje_nowa_scene() {
    let mut a = started(11);
    let save_a = a.save_game().expect("save a");
    let map_a = a.map().cloned().expect("map a");

    let mut c = started(4242);
    let map_b = c.map().cloned().expect("map b");
    assert_ne!(map_a, map_b, "the two seeds give two maps");

    c.load_game(&save_a).expect("load a");
    assert_eq!(c.map(), Some(&map_a), "map of the save");
    assert_eq!(
        c.source().last_map.as_ref().map(json),
        a.source().last_map.as_ref().map(json),
        "GetRenderMap answer = that of the saved game"
    );
    let (_, ref_frame) = reference(&save_a, &c.ui().frame_ui);
    assert_eq!(json(frame(&c)), json(&ref_frame));
    assert_renderer_fed(&c);
}

/// A rejected save: the engine session and the whole client state stay as they were; no map, no frame query.
#[test]
fn odrzucony_zapis_nie_zmienia_sesji() {
    let mut c = started(7);
    c.set_frame_ui(RenderUiParams {
        selected_unit_id: Some(WARRIOR),
        ..RenderUiParams::default()
    })
    .expect("ui");
    command(&mut c, EngineCommand::AdvanceTurn);
    let ui = c.ui().clone();
    let map = c.map().cloned();
    let frame_before = frame(&c).clone();
    let inputs = c.frame_inputs().cloned();
    let state = c.source_mut().state();
    let log_len = c.source().log.len();

    for bad in ["", "{", "{\"wersja\": \"nie\"}", "[]"] {
        let err = c.load_game(bad).expect_err("rejected save");
        assert!(
            matches!(err, LoadGameError::Rejected(_)),
            "{bad:?}: {err:?}"
        );
    }
    assert_eq!(
        &c.source().log[log_len..],
        &[Call::Load, Call::Load, Call::Load, Call::Load],
        "no GetRenderMap / GetRenderFrame after a rejected save"
    );
    assert_eq!(c.ui(), &ui, "UI unchanged");
    assert_eq!(c.map().cloned(), map, "map unchanged");
    assert_eq!(frame(&c), &frame_before, "frame unchanged");
    assert_eq!(
        c.frame_inputs().cloned(),
        inputs,
        "renderer inputs unchanged"
    );
    assert_eq!(c.source_mut().state(), state, "engine session unchanged");
    // The session keeps working.
    command(&mut c, EngineCommand::AdvanceTurn);
    assert_eq!(frame(&c).turn, frame_before.turn + 1);
}

/// Load from the main menu: no previous session in the client; the load opens one.
#[test]
fn odczyt_bez_poprzedniej_sesji() {
    let mut a = started(9);
    let save = a.save_game().expect("save");

    let mut c = RenderClient::new(BridgeSource::new(), MapDetailQuality::Low);
    assert!(matches!(c.on_state_changed(), Err(ClientError::NoSession)));
    c.load_game(&save).expect("load");
    assert_eq!(c.source().log, vec![Call::Load, Call::Map, Call::Frame]);
    let (ref_map, ref_frame) = reference(&save, &c.ui().frame_ui);
    assert_eq!(
        c.map(),
        Some(&MapStatic::from_dto(&ref_map.0).expect("map"))
    );
    assert_eq!(json(frame(&c)), json(&ref_frame));
    assert_renderer_fed(&c);
}

/// The build mode and the renderer gates are not touched by `restoreGameFromSave` (pin): kept after the load; the
/// selection is cleared.
#[test]
fn odczyt_zachowuje_tryb_budowy_i_bramki() {
    let mut c = started(7);
    let save = c.save_game().expect("save");
    c.set_build_mode(BuildMode {
        build_mode_open: true,
        ..BuildMode::default()
    })
    .expect("open build");
    c.select_unit(Some(WARRIOR)).expect("select in build mode");
    assert!(c.ui().frame_ui.unit_selected_after_build_open);
    let mut map_ui = c.ui().map_ui;
    map_ui.territory_border_visible = !map_ui.territory_border_visible;
    c.set_map_ui(map_ui).expect("gate");

    c.load_game(&save).expect("load");
    let ui: &ClientUiState = c.ui();
    assert!(ui.frame_ui.build_mode_open, "build mode kept");
    assert_eq!(ui.map_ui, map_ui, "renderer gates kept");
    assert_eq!(ui.frame_ui.selected_unit_id, None);
    assert!(!ui.frame_ui.unit_selected_after_build_open);
    let (_, ref_frame) = reference(&save, &ui.frame_ui);
    assert_eq!(json(frame(&c)), json(&ref_frame));
}

/// The engine loaded the save but the map query failed: typed `Refresh`, the previous client session is dropped (no
/// frame on a map that failed); the next successful load restores it.
#[test]
fn blad_odswiezenia_po_odczycie_jest_typowany() {
    let mut c = started(7);
    let save = c.save_game().expect("save");
    command(&mut c, EngineCommand::AdvanceTurn);
    c.source_mut().fail_map = true;
    let err = c.load_game(&save).expect_err("refresh fails");
    assert!(
        matches!(err, LoadGameError::Refresh(ClientError::Source(_))),
        "{err:?}"
    );
    assert!(c.map().is_none() && c.last_frame().is_none() && c.scene().is_none());
    c.source_mut().fail_map = false;
    c.load_game(&save).expect("load");
    let (_, ref_frame) = reference(&save, &c.ui().frame_ui);
    assert_eq!(json(frame(&c)), json(&ref_frame));
}

/// Two loads of the same save: one map and one frame each (no accumulation), identical frames.
#[test]
fn kazdy_odczyt_jedna_mapa_jedna_ramka() {
    let mut c = started(7);
    let save = c.save_game().expect("save");
    command(&mut c, EngineCommand::AdvanceTurn);
    let maps = c.source().count(Call::Map);
    let frames = c.source().count(Call::Frame);
    c.load_game(&save).expect("load 1");
    let first = frame(&c).clone();
    c.load_game(&save).expect("load 2");
    assert_eq!(c.source().count(Call::Map), maps + 2);
    assert_eq!(c.source().count(Call::Frame), frames + 2);
    assert_eq!(c.source().count(Call::Load), 2);
    assert_eq!(frame(&c), &first);
}
