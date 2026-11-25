//! R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 (#371): end-to-end test "engine -> bridge -> client -> renderer battle
//! playback" of the siege storm, headless (renderer feature `gpu` OFF).
//!
//! The real bridge (`engine/src/bridge.rs` through `#[path]`, D-371-1) over `CivEngineAdapter` feeds
//! [`RenderClient`] through [`BridgeSource`] (`RenderSource` + `SiegeBattleSource`). The client sends
//! `StartSiegeStorm` -> `StepSiegeBattle` (16 ms and irregular) / `SkipSiegeBattle` -> `FinishSiegeBattle` and feeds
//! the renderer `BattlePlayback` on a `BattleScene3` built from the start answer (D-1I6-3).
//!
//! The session: `CreateSession` builds the start scenario, which has no enemy city and no siege; the bridge has no
//! `Load` (#375). The siege scenario of the engine tests (`engine/tests/p6_zdobycie_miasta_a_bridge.rs`: the player
//! besieges a palisaded enemy capital with a ram) is therefore given to the bridge as its game
//! (`CivEngineAdapter::from_game`), and `CreateSession` is checked separately (a storm on the start scenario is an
//! explicit engine error, no battle in the client).
//!
//! R-RUSTPORT-P4-1I6-DLUGI-Q1: the scene comes from the engine (`siegeBattle.setup`, D-1I6-SETUP); the client composes
//! nothing (the former fixture `SiegeSceneStatic`, debts D-1I6-FIXTURE / D-1I6-SPAWN-FACING, is gone). The rewind of
//! the start frame (D-1I6-3b, the former client composition) stays here only as an independent cross-check of the
//! engine setup. Battle errors arrive typed (`BridgeError.siegeBattle`, D-1I6-ERR); a scene that cannot be built
//! aborts the engine battle (`AbortSiegeBattle`, D-1I6-ORPHAN / D-1I6-ABORT-E2E).

#![allow(clippy::float_cmp)]

#[path = "../../engine/src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeEvent, BridgeRequest, BridgeResult, CivEngineAdapter,
    EngineBridge, EngineCommand, StartGameParams, WallMs,
};
use civ_client::{
    is_not_finished, tower_projectile_of, ClientError, HighlightPriority, MapDetailQuality,
    RenderClient, RenderFramePayload, RenderMapPayload, RenderSource, RenderUiParams, SiegeAfterUi,
    SiegeBattleAnswer, SiegeBattleCommand, SiegeBattleEnd, SiegeBattleErrorDto, SiegeBattlePayload,
    SiegeBattlePhaseDto, SiegeBattleSource, SiegeClientError, SiegeSourceError, StreamOrder,
    SIEGE_ATTACKER_COLOR, SIEGE_DEFENDER_COLOR,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_apply;
use civ_engine::domain::siege_battle_session::{SessionPhase, SiegeBattleSession};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_renderer::battle::playback::PlaybackError;
use civ_renderer::battle::siege_towers::tower_projectile_kind;
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto, BattleFrameDto, BattleSetupDto, BattleSide,
    BattleUnitSpawnDto, BattleWinner,
};
use civ_view_model::{OwnerRef, RenderLayersDto};

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);
const ANCHOR: u64 = 7001;
const IRREGULAR: [f64; 5] = [7.5, 40.25, 1000.0, 3.0, 250.0];

// ------------------------------------------------------------ scenario (engine/tests/p6_zdobycie_miasta_a_bridge.rs)

fn add_unit(st: &mut PlayableState, id: u64, owner: u64, pos: (u16, u16), ty: &str) {
    st.units.push(PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(pos.0, pos.1),
        movement: 1u8.into(),
        movement_max: 1u8.into(),
        selected: false,
    });
    st.economy.units.insert(
        id,
        PlayableReplaceUnit {
            type_id: Some(ty.to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
}

/// The player (1) besieges the palisaded capital of 101 with a ram: the attacker wins with a breach.
fn siege_state(seed: u32) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams {
        seed,
        ..StartGameParams::default()
    })
    .expect("start")
    .state()
    .clone();
    for t in &mut st.map.tiles {
        t.terrain = PlayableTerrain::Plains;
        t.passable = true;
    }
    st.units.clear();
    st.economy.units.clear();
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    st.cities.push(PlayableCity {
        id: CityId::new(CITY),
        owner_id: PlayerId::new(ENEMY),
        name: "Twierdza".into(),
        position: PositionDto::new(CITY_POS.0, CITY_POS.1),
        is_capital: true,
        population: 3,
        culture: 0,
    });
    st.cities.push(PlayableCity {
        id: CityId::new(905),
        owner_id: PlayerId::new(ENEMY),
        name: "Druga".into(),
        position: PositionDto::new(0, 0),
        is_capital: false,
        population: 2,
        culture: 0,
    });
    st.stores
        .buildings_by_city
        .insert(CITY, vec!["palisada".to_owned()]);
    st.oblegane.insert(CityId::new(CITY));
    st.siege_machines_ready
        .insert(CityId::new(CITY), vec![PlayableSiegeMachineKind::Taran]);
    st.economy.ai_treasury_by_owner.insert(ENEMY, 40.0);
    let mut id = 7000;
    for t in [
        "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Łucznik",
    ] {
        id += 1;
        add_unit(&mut st, id, HUMAN, (CITY_POS.0 + 1, CITY_POS.1), t);
    }
    add_unit(&mut st, 8001, ENEMY, CITY_POS, "Wojownik");
    st
}

// ------------------------------------------------------------ source

/// What the source saw (independent of the client's own counters).
#[derive(Debug, Default, Clone, PartialEq)]
struct Seen {
    map_calls: usize,
    frame_calls: usize,
    /// Siege commands sent, in order (`start`, `step`, `skip`, `finish`).
    siege: Vec<&'static str>,
    /// Actions of every siege answer, in order.
    actions: Vec<BattleActionDto>,
    /// Frames of every siege answer.
    frames: Vec<BattleFrameDto>,
}

/// `RenderSource` + `SiegeBattleSource` over the real bridge.
struct BridgeSource {
    bridge: EngineBridge<CivEngineAdapter>,
    next_id: u64,
    seen: Seen,
    /// Applied to the `siegeBattle` of a start answer before the client sees it (a transport that loses or breaks the
    /// setup, for the D-1I6-ORPHAN path); `None` = untouched.
    tamper_start: Option<fn(&mut SiegeBattlePayload)>,
    /// R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1: applied to the `siegeBattle` of a `SetSiegeBattleSpeed` answer.
    tamper_speed: Option<fn(&mut SiegeBattlePayload)>,
}

impl BridgeSource {
    fn new(bridge: EngineBridge<CivEngineAdapter>) -> Self {
        Self {
            bridge,
            next_id: 0,
            seen: Seen::default(),
            tamper_start: None,
            tamper_speed: None,
        }
    }

    fn request(&mut self, command: EngineCommand) -> Result<BridgeDispatch, BridgeError> {
        self.next_id += 1;
        self.bridge
            .handle(BridgeRequest::new(format!("1i6-{}", self.next_id), command))
    }

    /// The game state (`GetState`).
    fn state(&mut self) -> PlayableState {
        let d = self.request(EngineCommand::GetState).expect("GetState");
        match d.response.result {
            BridgeResult::State { state } => state,
            _ => panic!("State expected"),
        }
    }
}

fn unexpected(kind: &str, query: &str) -> BridgeError {
    BridgeError::internal(format!("{query}: unexpected result {kind}"))
}

impl RenderSource for BridgeSource {
    type Error = BridgeError;

    fn render_map(&mut self) -> Result<RenderMapPayload, BridgeError> {
        self.seen.map_calls += 1;
        let d = self.request(EngineCommand::GetRenderMap)?;
        match d.response.result {
            BridgeResult::RenderMap { map } => Ok(map),
            _ => Err(unexpected("other", "get_render_map")),
        }
    }

    fn render_frame(
        &mut self,
        seat: Option<u64>,
        ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, BridgeError> {
        self.seen.frame_calls += 1;
        let d = self.request(EngineCommand::GetRenderFrame { seat, ui })?;
        match d.response.result {
            BridgeResult::RenderFrame { frame } => Ok(frame),
            _ => Err(unexpected("other", "get_render_frame")),
        }
    }
}

/// D-1I6-1 / D-1I6-ERR: the bridge carries the battle error as a type (`BridgeError.siegeBattle`); any other bridge
/// error is a transport / source error.
fn battle_error(e: BridgeError) -> SiegeSourceError<BridgeError> {
    match e.siege_battle.clone() {
        Some(dto) => SiegeSourceError::Battle(dto),
        None => SiegeSourceError::Source(e),
    }
}

impl SiegeBattleSource for BridgeSource {
    fn siege_battle(
        &mut self,
        command: SiegeBattleCommand,
    ) -> Result<SiegeBattleAnswer, SiegeSourceError<BridgeError>> {
        let (tag, cmd) = match command {
            SiegeBattleCommand::Start { city_id, unit_id } => {
                ("start", EngineCommand::StartSiegeStorm { city_id, unit_id })
            }
            SiegeBattleCommand::Step { wall_ms } => (
                "step",
                EngineCommand::StepSiegeBattle {
                    wall_ms: WallMs(wall_ms),
                },
            ),
            SiegeBattleCommand::Skip => ("skip", EngineCommand::SkipSiegeBattle),
            SiegeBattleCommand::Finish => ("finish", EngineCommand::FinishSiegeBattle),
            SiegeBattleCommand::Abort => ("abort", EngineCommand::AbortSiegeBattle),
            SiegeBattleCommand::SetSpeed { idx, clamp } => {
                ("speed", EngineCommand::SetSiegeBattleSpeed { idx, clamp })
            }
        };
        self.seen.siege.push(tag);
        let d = self.request(cmd).map_err(battle_error)?;
        let state_changed = d
            .events
            .iter()
            .any(|e| matches!(e, BridgeEvent::StateChanged { .. }));
        let mut battle = d
            .response
            .siege_battle
            .ok_or_else(|| SiegeSourceError::Source(unexpected("no siegeBattle", tag)))?;
        if let (SiegeBattleCommand::Start { .. }, Some(f)) = (command, self.tamper_start) {
            f(&mut battle);
        }
        if let (SiegeBattleCommand::SetSpeed { .. }, Some(f)) = (command, self.tamper_speed) {
            f(&mut battle);
        }
        self.seen.actions.extend(battle.actions.iter().cloned());
        if let Some(f) = &battle.frame {
            self.seen.frames.push(f.clone());
        }
        Ok(SiegeBattleAnswer {
            battle,
            state_changed,
        })
    }
}

type Client = RenderClient<BridgeSource>;

/// Number of actions the session emits when driven directly (start + `step(16)` to the end, or start + `step(16)` +
/// `skip`), the reference of "no action is lost".
fn direct_actions(st: &PlayableState, skip_after_one_step: bool) -> usize {
    let a = siege_battle_apply::prepare_storm(st, CITY, ANCHOR, 1).expect("storm");
    let data = siege_battle_apply::session_data().expect("data");
    let mut s = SiegeBattleSession::start(st, a.input(), data).expect("session");
    let mut n = s.battle_loop_mut().take_actions().len();
    if skip_after_one_step {
        n += s.step(16.0).expect("step").actions.len();
        n += s.skip().expect("skip").actions.len();
        return n;
    }
    while s.phase() != SessionPhase::Finished {
        n += s.step(16.0).expect("step").actions.len();
    }
    n
}

// ------------------------------------------------------------ helpers

fn client_for(st: PlayableState) -> Client {
    let bridge = EngineBridge::new(CivEngineAdapter::from_game(PlayableGame::from_state(st)));
    let mut c = RenderClient::new(BridgeSource::new(bridge), MapDetailQuality::Low);
    c.on_session_created().expect("GetRenderMap");
    c.on_state_changed().expect("first frame");
    c
}

fn frame(c: &Client) -> &RenderLayersDto {
    c.last_frame().expect("cached frame")
}

/// Owner of the city at `CITY_POS` in the frame.
fn city_owner(f: &RenderLayersDto) -> OwnerRef {
    f.cities
        .iter()
        .find(|c| (c.hex.q, c.hex.r) == (i32::from(CITY_POS.0), i32::from(CITY_POS.1)))
        .map(|c| c.owner_id)
        .expect("city in frame")
}

/// D-WIRB-6 v2 seen from the client: over the whole battle the delivered actions never go back in time (each answer
/// starts at or after the previous frame and the frames advance).
fn assert_stream_valid(seen: &Seen) {
    assert!(
        seen.actions.windows(2).all(|w| w[0].t0 <= w[1].t0),
        "actions over the whole battle are non-decreasing"
    );
    assert!(seen.frames.windows(2).all(|w| w[0].v_now <= w[1].v_now));
}

struct Run {
    end: SiegeBattleEnd,
    seen: Seen,
    state: PlayableState,
    frame: RenderLayersDto,
    hp: Vec<(u64, Option<f64>)>,
    calls_len: usize,
    labels: usize,
    actions_received: usize,
    answers: usize,
}

/// The storm through the client: `chunks` real-time steps to the end (empty = one 16 ms step then `Skip`), `Finish`.
fn storm(st: PlayableState, chunks: &[f64], with_scene: bool) -> Run {
    let mut c = client_for(st);
    let frames_before = c.source().seen.frame_calls;
    c.start_siege_storm(CITY, ANCHOR, with_scene)
        .expect("start");
    // r2 (E01): the wall clock after each answer (`vLastWall` of the labels created by that answer).
    let mut walls = vec![0.0];
    let mut wall = 0.0;
    if chunks.is_empty() {
        c.step_siege_battle(16.0).expect("step");
        wall += 16.0;
        walls.push(wall);
        assert!(!c.siege_battle().expect("battle").skipped(), "no Pomin yet");
        c.skip_siege_battle().expect("skip");
    } else {
        let mut k = 0;
        while c.siege_battle().expect("battle").phase() == SiegeBattlePhaseDto::Running {
            c.step_siege_battle(chunks[k % chunks.len()]).expect("step");
            wall += chunks[k % chunks.len()];
            walls.push(wall);
            k += 1;
            assert!(k < 200_000, "battle without end");
        }
    }
    let b = c.siege_battle().expect("battle");
    assert!(b.end_screen(), "Finished: end screen");
    assert!(!b.skip_available(), "no Pomin on the end screen");
    // r2 (E01/E02/E03): the accessors of the battle screen.
    assert_eq!(b.wall_clock(), wall, "wall clock = sum of the steps");
    assert_eq!(b.skipped(), chunks.is_empty(), "Pomin flag");
    assert_eq!(
        b.last_frame(),
        c.source().seen.frames.last(),
        "last frame = frame of the last answer"
    );
    if let Some((_, pb)) = b.scene() {
        for l in pb.labels() {
            assert!(
                walls.contains(&l.label.start),
                "label start {} is the wall clock of an answer {walls:?}",
                l.label.start
            );
        }
        if !chunks.is_empty() {
            assert!(
                pb.labels().iter().any(|l| l.label.start > 0.0),
                "labels of the steps start at the accumulated wall clock"
            );
        }
    }
    // D-WIRB-2: no StateChanged during the battle -> no frame request.
    assert_eq!(c.source().seen.frame_calls, frames_before);
    let end = c.finish_siege_battle().expect("finish").clone();
    assert_eq!(
        c.source().seen.frame_calls,
        frames_before + 1,
        "ONE GetRenderFrame after the result (StateChanged, D-371-4)"
    );
    assert!(c.siege_battle().is_none(), "battle closed");
    let v = c.last_siege_battle_view().expect("closed view");
    if let Some((_, pb)) = v.scene() {
        // No action is left in the playback queue: the held actions of `Finish` were played too.
        assert_eq!(pb.queued(), 0, "every queued item played");
    }
    let (hp, calls_len, labels) = match v.scene() {
        Some((_, pb)) => (
            v.units()
                .iter()
                .map(|u| {
                    (
                        u.battle_id,
                        pb.hp(civ_view_model::ids::UnitId::try_new(u.battle_id).expect("id")),
                    )
                })
                .collect(),
            pb.calls().len(),
            pb.labels().len(),
        ),
        None => (Vec::new(), 0, 0),
    };
    let actions_received = v.actions_received();
    let answers = v.answers();
    let state = c.source_mut().state();
    Run {
        end,
        frame: frame(&c).clone(),
        seen: c.source().seen.clone(),
        state,
        hp,
        calls_len,
        labels,
        actions_received,
        answers,
    }
}

fn applied(end: &SiegeBattleEnd) -> (&civ_client::SiegeBattleResultDto, SiegeAfterUi) {
    match end {
        SiegeBattleEnd::Applied { result, after, .. } => (result, *after),
        SiegeBattleEnd::Aborted { .. } => panic!("result expected: {end:?}"),
    }
}

// ------------------------------------------------------------ tests

/// E2E: start -> 16 ms steps to the end -> Finish, with the renderer scene: no order violation, every action of the
/// session reaches the client and the playback, the map after the capture equals the bridge state.
#[test]
fn e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem() {
    let st = siege_state(11);
    let direct = direct_actions(&st, false);
    let r = storm(st, &[16.0], true);
    let (res, after) = applied(&r.end);
    assert_eq!(
        res.winner,
        BattleWinner::Atakujacy,
        "scenario: attacker wins"
    );
    assert!(res.wall_breached, "scenario: breach (ram)");
    let cap = res.capture.as_ref().expect("capture consumed in Finish");
    assert!(cap.captured);
    assert_eq!(after, SiegeAfterUi::Captured);
    // No action lost: the source, the client and the direct session agree.
    assert_eq!(r.seen.actions.len(), direct, "bridge = direct session");
    assert_eq!(r.actions_received, direct, "client = direct session");
    assert_eq!(r.answers, r.seen.siege.len(), "every answer fed");
    assert!(
        r.calls_len > 0 && r.labels > 0,
        "the scene played the actions"
    );
    assert_stream_valid(&r.seen);
    // Map after the capture: the bridge state and the client frame agree.
    let city = r
        .state
        .cities
        .iter()
        .find(|c| c.id.get() == CITY)
        .expect("city");
    assert_eq!(city.owner_id, PlayerId::new(HUMAN), "bridge: city captured");
    assert_eq!(
        city_owner(&r.frame),
        OwnerRef::Player(civ_view_model::PlayerId::try_new(HUMAN).expect("id")),
        "client frame: city owned by the player"
    );
    for id in &res.removed_unit_ids {
        assert!(
            !r.frame.units.iter().any(|u| u.id.get() == *id),
            "removed unit {id} not in the frame"
        );
        assert!(!r.state.units.iter().any(|u| u.id.get() == *id));
    }
    assert!(
        r.seen.frames.last().is_some_and(|f| f.finished),
        "last frame finished"
    );
}

/// Irregular real-time steps give the same result, the same actions and the same scene HP as 16 ms; the frame of the
/// client equals a direct `GetRenderFrame` with the same UI.
#[test]
fn e2e_kroki_nieregularne_rowne_16ms() {
    let a = storm(siege_state(11), &[16.0], true);
    let b = storm(siege_state(11), &IRREGULAR, true);
    assert_eq!(a.end, b.end);
    let mut x: Vec<String> = a.seen.actions.iter().map(|v| format!("{v:?}")).collect();
    let mut y: Vec<String> = b.seen.actions.iter().map(|v| format!("{v:?}")).collect();
    x.sort();
    y.sort();
    assert_eq!(x, y, "same actions (chunk borders only)");
    assert_eq!(a.hp, b.hp, "same HP tracked by the playback");
    assert_eq!(a.labels, b.labels, "same damage labels");
    assert_eq!(a.state, b.state);
    assert_eq!(a.frame, b.frame);
}

/// Start -> 16 ms -> Skip (`Pomin`) -> Finish: no order violation, every action delivered, the snapshot after the
/// fast-forward (D-1I6-4) and determinism (two runs = identical scene trace).
#[test]
fn e2e_pomin_i_determinizm() {
    let st = siege_state(11);
    let direct = direct_actions(&st, true);
    let a = storm(st.clone(), &[], true);
    let b = storm(st, &[], true);
    assert_eq!(a.seen.siege, vec!["start", "step", "skip", "finish"]);
    assert_eq!(
        a.actions_received, direct,
        "no action lost on the Skip path"
    );
    assert_eq!(a.end, b.end);
    assert_eq!(a.seen, b.seen, "deterministic stream");
    assert_eq!(a.hp, b.hp);
    assert_eq!(a.calls_len, b.calls_len);
    assert_eq!(a.state, b.state);
    // Skip and real time reach the same result and state (D-WIRB-1).
    let c = storm(siege_state(11), &[16.0], true);
    assert_eq!(a.end, c.end);
    assert_eq!(a.state, c.state);
    // After the snapshot the playback HP equals the engine HP of the last frame for every unit still on the field.
    let last = a.seen.frames.last().expect("frame");
    for fu in &last.units {
        if fu.removed || fu.dead {
            continue;
        }
        let tracked =
            a.hp.iter()
                .find(|(id, _)| *id == fu.id.get())
                .and_then(|(_, hp)| *hp)
                .expect("tracked");
        assert_eq!(tracked, fu.hp, "unit {} HP after snapshot", fu.id);
    }
}

/// Headless (no scene, D-1I6-3): the same stream and result as with the scene.
#[test]
fn e2e_bez_sceny_ten_sam_wynik() {
    let a = storm(siege_state(11), &[16.0], false);
    let b = storm(siege_state(11), &[16.0], true);
    assert_eq!(a.end, b.end);
    assert_eq!(a.seen, b.seen);
    assert_eq!(a.state, b.state);
    assert_eq!(a.calls_len, 0);
}

/// UI after the battle (`afterSiegeUi` + `clearBattleUiState`): no selection, no hover, highlight cleared, no forced
/// unit, the siege map panel closed at the start (`hideSiegeMapPanel`).
#[test]
fn stan_ui_po_bitwie() {
    let mut c = client_for(siege_state(11));
    c.set_siege_map_panel_open(true).expect("panel");
    c.select_unit(Some(ANCHOR)).expect("select");
    let mut ui = c.ui().frame_ui.clone();
    ui.hover = Some(PositionDto::new(CITY_POS.0, CITY_POS.1));
    // r2 (E04): the flag the frame may carry is zeroed by `clearBattleUiState` too.
    ui.unit_selected_after_build_open = true;
    c.set_frame_ui(ui).expect("hover");
    assert!(c.ui().frame_ui.unit_selected_after_build_open);
    let mut map_ui = c.ui().map_ui;
    map_ui.force_visible_unit_id = Some(civ_view_model::ids::UnitId::try_new(ANCHOR).expect("id"));
    c.set_map_ui(map_ui).expect("force");
    let ui_before = c.ui().clone();
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    assert!(!c.ui().siege_map_panel_open, "hideSiegeMapPanel (:36885)");
    assert_eq!(
        c.ui().frame_ui,
        ui_before.frame_ui,
        "the map UI waits under the scene"
    );
    let v = c.siege_battle().expect("battle");
    assert!(v.skip_available() && !v.end_screen());
    assert_eq!(v.city_id(), CITY);
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    let ui = c.ui();
    assert_eq!(ui.frame_ui.selected_unit_id, None);
    assert_eq!(ui.frame_ui.hover, None);
    assert!(!ui.frame_ui.unit_selected_after_build_open);
    assert_eq!(ui.highlight_last_writer, HighlightPriority::Cleared);
    assert_eq!(ui.map_ui.force_visible_unit_id, None);
    assert!(!ui.siege_map_panel_open);
    // The cached frame was composed with that UI.
    let ui_now = c.ui().frame_ui.clone();
    let direct = c
        .source_mut()
        .render_frame(None, Some(ui_now))
        .expect("direct");
    assert_eq!(
        &direct.0,
        frame(&c),
        "client frame = bridge frame with the same UI"
    );
}

/// `Finish` before the end = `NotFinished` (D-WIRB-8): the battle stays, `Pomin` available; `Skip` + `Finish` close it.
/// `Step` / `Skip` after the end and a second `Start` are refused without an engine call.
#[test]
fn faza_bitwy_not_finished_i_odmowy_bez_wolania_silnika() {
    let st = siege_state(11);
    let mut c = client_for(st);
    // Before Start: no battle.
    assert_eq!(
        c.finish_siege_battle().err(),
        Some(SiegeClientError::NoBattle)
    );
    assert_eq!(
        c.step_siege_battle(16.0).err(),
        Some(SiegeClientError::NoBattle)
    );
    assert!(c.source().seen.siege.is_empty(), "no engine call");
    c.start_siege_storm(CITY, ANCHOR, false).expect("start");
    let frames = c.source().seen.frame_calls;
    match c.finish_siege_battle() {
        Err(SiegeClientError::Engine(e)) => assert!(is_not_finished(&e), "{e:?}"),
        other => panic!("NotFinished expected: {other:?}"),
    }
    let v = c.siege_battle().expect("battle kept");
    assert!(v.skip_available());
    assert_eq!(c.source().seen.frame_calls, frames, "no refresh");
    // Second start while the battle runs: refused without an engine call.
    let n = c.source().seen.siege.len();
    assert_eq!(
        c.start_siege_storm(CITY, ANCHOR, false).err(),
        Some(SiegeClientError::BattleActive { city_id: CITY })
    );
    assert_eq!(c.source().seen.siege.len(), n);
    c.skip_siege_battle().expect("skip");
    let n = c.source().seen.siege.len();
    assert_eq!(
        c.step_siege_battle(16.0).err(),
        Some(SiegeClientError::BattleFinished)
    );
    assert_eq!(
        c.skip_siege_battle().err(),
        Some(SiegeClientError::BattleFinished)
    );
    assert_eq!(
        c.source().seen.siege.len(),
        n,
        "no engine call after the end"
    );
    c.finish_siege_battle().expect("finish");
    assert!(c.siege_battle().is_none());
    assert!(matches!(
        c.last_siege_battle_end(),
        Some(SiegeBattleEnd::Applied { .. })
    ));
}

/// `CreateSession` (start scenario, no enemy city): the storm is an explicit engine error, no battle, no UI change.
/// No map session: refused before any engine call.
#[test]
fn create_session_i_bledy_startu() {
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    bridge
        .handle(BridgeRequest::new(
            "cs",
            EngineCommand::CreateSession {
                params: StartGameParams::default(),
            },
        ))
        .expect("CreateSession");
    let mut c = RenderClient::new(BridgeSource::new(bridge), MapDetailQuality::Low);
    assert_eq!(
        c.start_siege_storm(CITY, ANCHOR, false).err(),
        Some(SiegeClientError::NoSession)
    );
    assert!(c.source().seen.siege.is_empty());
    c.on_session_created().expect("map");
    c.on_state_changed().expect("frame");
    let ui = c.ui().clone();
    // D-1I6-ERR: the battle error arrives typed (no city 900 in the start scenario).
    match c.start_siege_storm(CITY, ANCHOR, false) {
        Err(SiegeClientError::Engine(e)) => {
            assert_eq!(e, SiegeBattleErrorDto::CityNotFound { city_id: CITY });
        }
        other => panic!("engine error expected: {other:?}"),
    }
    assert!(c.siege_battle().is_none());
    assert_eq!(c.ui(), &ui);
}

// ------------------------------------------------------------ scripted source (Aborted, order)

/// A source that replays recorded answers and returns a scripted `Finish` (D-WIRB-8 `Aborted` is not reachable from
/// a human storm on `PlayableState` today: its sources are `outcome.unported`, `LoopUnsupported` and apply errors).
struct Scripted {
    answers: Vec<SiegeBattlePayload>,
    finish: Option<SiegeBattleErrorDto>,
    /// Answer of `AbortSiegeBattle`: `None` = success (`aborted` payload), `Some` = that error.
    abort: Option<SiegeBattleErrorDto>,
    /// `AbortSiegeBattle` calls.
    aborts: usize,
    frame: RenderFramePayload,
    map: RenderMapPayload,
    frame_calls: usize,
    sent: usize,
}

impl RenderSource for Scripted {
    type Error = String;
    fn render_map(&mut self) -> Result<RenderMapPayload, String> {
        Ok(self.map.clone())
    }
    fn render_frame(
        &mut self,
        _seat: Option<u64>,
        _ui: Option<RenderUiParams>,
    ) -> Result<RenderFramePayload, String> {
        self.frame_calls += 1;
        Ok(self.frame.clone())
    }
}

impl SiegeBattleSource for Scripted {
    fn siege_battle(
        &mut self,
        command: SiegeBattleCommand,
    ) -> Result<SiegeBattleAnswer, SiegeSourceError<String>> {
        self.sent += 1;
        if command == SiegeBattleCommand::Abort {
            self.aborts += 1;
            return match self.abort.take() {
                Some(e) => Err(SiegeSourceError::Battle(e)),
                None => Ok(SiegeBattleAnswer {
                    battle: SiegeBattlePayload::aborted(CITY),
                    state_changed: false,
                }),
            };
        }
        if command == SiegeBattleCommand::Finish {
            if let Some(e) = self.finish.take() {
                return Err(SiegeSourceError::Battle(e));
            }
        }
        if self.answers.is_empty() {
            return Err(SiegeSourceError::Source("script ended".into()));
        }
        Ok(SiegeBattleAnswer {
            battle: self.answers.remove(0),
            state_changed: command == SiegeBattleCommand::Finish,
        })
    }
}

/// Recorded answers of start, one 16 ms step and skip, plus the map and a frame.
fn recorded() -> (
    Vec<SiegeBattlePayload>,
    RenderMapPayload,
    RenderFramePayload,
) {
    let mut c = client_for(siege_state(11));
    let map = c.source_mut().render_map().expect("map");
    let frame = c.source_mut().render_frame(None, None).expect("frame");
    let mut out = Vec::new();
    for cmd in [
        SiegeBattleCommand::Start {
            city_id: CITY,
            unit_id: ANCHOR,
        },
        SiegeBattleCommand::Step { wall_ms: 16.0 },
        SiegeBattleCommand::Skip,
        SiegeBattleCommand::Finish,
    ] {
        out.push(c.source_mut().siege_battle(cmd).expect("answer").battle);
    }
    (out, map, frame)
}

/// `Finish` carrying actions held after the last frame (D-WIRB-6 v2: `t0` beyond the last `vNow`): the client plays
/// them before closing the battle, nothing stays in the playback queue.
#[test]
fn finish_odtwarza_wstrzymane_akcje() {
    let (mut answers, _, _) = recorded();
    let last = answers[2].frame.clone().expect("skip frame");
    let unit = last
        .units
        .iter()
        .find(|u| !u.removed && !u.dead)
        .expect("unit on the field")
        .id;
    let dir = (last
        .units
        .iter()
        .find(|u| u.id == unit)
        .expect("unit")
        .facing
        + 1)
        % 4;
    assert!(answers[3].frame.is_none(), "Finish has no frame");
    answers[3].actions.push(BattleActionDto {
        t0: last.v_now + 1.0,
        action: BattleActionKindDto::Facing { id: unit, dir },
    });
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    let v = c.last_siege_battle_view().expect("closed view");
    let (_, pb) = v.scene().expect("scene");
    assert_eq!(pb.queued(), 0, "held actions played");
    assert_eq!(
        pb.calls().last(),
        Some(&civ_renderer::battle::playback::SceneCall::SetFacing { id: unit, dir }),
        "the held action is the last scene call"
    );
}

fn scripted(
    answers: Vec<SiegeBattlePayload>,
    finish: Option<SiegeBattleErrorDto>,
) -> RenderClient<Scripted> {
    let (_, map, frame) = recorded();
    let mut c = RenderClient::new(
        Scripted {
            answers,
            finish,
            abort: None,
            aborts: 0,
            frame,
            map,
            frame_calls: 0,
            sent: 0,
        },
        MapDetailQuality::Low,
    );
    c.on_session_created().expect("map");
    c.on_state_changed().expect("frame");
    c
}

/// D-WIRB-8 `Aborted`: the battle and its scene are dropped, the end is reported, the game state is not refreshed
/// (no `StateChanged`), the UI leaves the battle as in the web, and a new storm can start.
#[test]
fn aborted_sprzata_bitwe() {
    let (answers, _, _) = recorded();
    let mut c = scripted(
        answers.clone(),
        Some(SiegeBattleErrorDto::Aborted {
            city_id: CITY,
            reason: "test".into(),
        }),
    );
    c.select_unit(Some(ANCHOR)).expect("select");
    let frames = c.source().frame_calls;
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    c.step_siege_battle(16.0).expect("step");
    let end = c.finish_siege_battle().expect("aborted is an exit").clone();
    assert_eq!(
        end,
        SiegeBattleEnd::Aborted {
            city_id: CITY,
            reason: "test".into()
        }
    );
    assert!(c.siege_battle().is_none(), "battle dropped");
    assert!(c.last_siege_battle_view().is_none(), "scene dropped");
    assert_eq!(c.ui().frame_ui.selected_unit_id, None, "clearBattleUiState");
    assert_eq!(c.ui().highlight_last_writer, HighlightPriority::Cleared);
    // One frame for the UI change (selection cleared), none for a state change.
    assert_eq!(c.source().frame_calls, frames + 1);
    // A new storm starts cleanly.
    c.source_mut().answers = answers;
    c.start_siege_storm(CITY, ANCHOR, true).expect("restart");
    assert_eq!(c.siege_battle().expect("battle").answers(), 1);
    assert_eq!(c.last_siege_battle_end(), None);
    // r2 (E18): `Aborted` with nothing to clear in the UI asks the engine for no frame (no `StateChanged`, no UI
    // change, D-371-4): the map is only recomposed from the cached frame.
    c.source_mut().finish = Some(SiegeBattleErrorDto::Aborted {
        city_id: CITY,
        reason: "again".into(),
    });
    c.step_siege_battle(16.0).expect("step");
    let frames = c.source().frame_calls;
    c.finish_siege_battle().expect("aborted again");
    assert!(c.siege_battle().is_none());
    assert_eq!(c.source().frame_calls, frames, "no frame request");
}

/// D-1I6-2: an answer whose first action is earlier than the previous frame is refused before the scene changes
/// (`OutOfOrder`), all-or-nothing; the guard state does not move.
#[test]
fn naruszenie_kolejnosci_odrzucone_przed_scena() {
    let (mut answers, _, _) = recorded();
    let start_v = answers[0].frame.as_ref().expect("frame").v_now;
    // A step answer with an action at `vNow(start) - 1`.
    let mut bad = answers[1].clone();
    let mut a = answers[0]
        .actions
        .first()
        .cloned()
        .or_else(|| answers[2].actions.first().cloned())
        .expect("an action");
    a.t0 = start_v - 1.0;
    bad.actions.insert(0, a);
    // r2 (E22): the refused answer claims the end; the phase must not move either.
    bad.phase = SiegeBattlePhaseDto::Finished;
    answers[1] = bad;
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    let v = c.siege_battle().expect("battle");
    let (last, received, calls) = (
        v.order().last_queued(),
        v.actions_received(),
        v.scene().map(|(_, pb)| pb.calls().len()),
    );
    match c.step_siege_battle(16.0) {
        Err(SiegeClientError::Order(PlaybackError::OutOfOrder { prev, t0 })) => {
            assert_eq!(prev, last);
            assert_eq!(t0, start_v - 1.0);
        }
        other => panic!("OutOfOrder expected: {other:?}"),
    }
    let v = c.siege_battle().expect("battle");
    assert_eq!(v.order().last_queued(), last, "guard unchanged");
    assert_eq!(v.phase(), SiegeBattlePhaseDto::Running, "phase unchanged");
    assert!(v.skip_available() && !v.end_screen());
    assert_eq!(v.actions_received(), received, "nothing counted");
    assert_eq!(
        v.scene().map(|(_, pb)| pb.calls().len()),
        calls,
        "scene unchanged"
    );
}

/// The guard alone: equal times pass, a lower time or `NaN` fails, all-or-nothing, the frame counts.
#[test]
fn straznik_kolejnosci() {
    let (answers, _, _) = recorded();
    let f = answers[0].frame.clone().expect("frame");
    let mut g = StreamOrder::new();
    assert!(g.accept(&[], Some(&f)).is_ok());
    assert_eq!(g.last_queued(), f.v_now);
    assert!(g.accept(&[], Some(&f)).is_ok(), "equal time passes");
    let mut a = answers
        .iter()
        .flat_map(|p| p.actions.iter())
        .next()
        .cloned()
        .expect("action");
    a.t0 = f.v_now + 10.0;
    let mut early = a.clone();
    early.t0 = f.v_now + 5.0;
    assert!(
        g.accept(&[a.clone(), early], None).is_err(),
        "decreasing inside one answer"
    );
    assert_eq!(g.last_queued(), f.v_now, "all-or-nothing");
    let mut later_frame = f.clone();
    later_frame.v_now = f.v_now + 9.0;
    assert!(
        g.accept(std::slice::from_ref(&a), Some(&later_frame))
            .is_err(),
        "frame earlier than the actions"
    );
    let mut nan = a.clone();
    nan.t0 = f64::NAN;
    assert!(g.accept(&[nan], None).is_err(), "NaN time");
    assert!(g.accept(&[a], None).is_ok());
    assert_eq!(g.last_queued(), f.v_now + 10.0);
}

/// `afterSiegeUi` branches in the pin's order.
#[test]
fn after_siege_ui_galezie() {
    let r = storm(siege_state(11), &[], false);
    let (res, after) = applied(&r.end);
    assert_eq!(after, SiegeAfterUi::Captured);
    let mut x = res.clone();
    x.capture = None;
    assert_eq!(
        SiegeAfterUi::of(&x),
        SiegeAfterUi::Silent,
        "won with breach, not taken"
    );
    x.capture_blocked = true;
    assert_eq!(SiegeAfterUi::of(&x), SiegeAfterUi::CaptureBlocked);
    x.capture_blocked = false;
    x.winner = BattleWinner::Obronca;
    assert_eq!(SiegeAfterUi::of(&x), SiegeAfterUi::Repelled);
    x.winner = BattleWinner::Remis;
    assert_eq!(SiegeAfterUi::of(&x), SiegeAfterUi::Draw);
    // Captured wins over a stale `capture_blocked` only with `captured`.
    let mut y = res.clone();
    y.capture_blocked = true;
    assert_eq!(SiegeAfterUi::of(&y), SiegeAfterUi::Captured);
}

/// A new session drops the battle (`CreateSession` = new game, D-WIRB-2).
#[test]
fn nowa_sesja_porzuca_bitwe() {
    let mut c = client_for(siege_state(11));
    c.start_siege_storm(CITY, ANCHOR, false).expect("start");
    assert!(c.siege_battle().is_some());
    c.on_session_created().expect("map");
    assert!(c.siege_battle().is_none());
    assert!(c.last_siege_battle_end().is_none());
    assert!(c.last_siege_battle_view().is_none());
    let _: Option<ClientError<BridgeError>> = None;
}

/// r2 (Z2, E08): a closed battle leaves its end and its screen; a new session drops both (the two "last battle"
/// accessors agree), and a new start drops the screen of the previous battle.
#[test]
fn ostatnia_bitwa_po_nowej_sesji_i_nowym_starcie() {
    let (answers, _, _) = recorded();
    let mut c = scripted(answers.clone(), None);
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    assert!(c.last_siege_battle_view().is_some());
    assert!(c.last_siege_battle_end().is_some());
    // A new start: the previous screen and end are gone while the new battle runs.
    c.source_mut().answers = answers.clone();
    c.start_siege_storm(CITY, ANCHOR, true).expect("restart");
    assert!(
        c.last_siege_battle_view().is_none(),
        "start drops the screen"
    );
    assert!(c.last_siege_battle_end().is_none());
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    assert!(c.last_siege_battle_view().is_some());
    // A new session: neither the end nor the screen of the last battle stays.
    c.on_session_created().expect("map");
    assert!(c.siege_battle().is_none());
    assert!(c.last_siege_battle_end().is_none());
    assert!(
        c.last_siege_battle_view().is_none(),
        "new session drops the screen (Z2)"
    );
}

/// r2 (E09): a `Finish` answer without a result closes the battle as `Aborted` (D-1I6-5), keeps its screen and
/// refreshes the map once (the answer carried `StateChanged`).
#[test]
fn finish_bez_wyniku_to_aborted() {
    let (mut answers, _, _) = recorded();
    answers[3].result = None;
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    let frames = c.source().frame_calls;
    let end = c.finish_siege_battle().expect("finish").clone();
    assert_eq!(
        end,
        SiegeBattleEnd::Aborted {
            city_id: CITY,
            reason: "finish answer without a result".into()
        }
    );
    assert!(c.siege_battle().is_none(), "battle closed");
    assert!(c.last_siege_battle_view().is_some(), "screen kept");
    assert_eq!(c.source().frame_calls, frames + 1, "one refresh");
}

// ------------------------------------------------------------ R-RUSTPORT-P4-1I6-DLUGI-Q1

/// The engine setup of the start answer (`siegeBattle.setup`).
fn engine_setup(p: &SiegeBattlePayload) -> &BattleSetupDto {
    p.setup
        .as_ref()
        .expect("start answer carries the engine setup")
}

/// Independent reference (the former client composition, D-1I6-3b): the spawn rewound from the start frame and the
/// start actions. The cell of a unit is the `from` of its first cell-changing start action, else its frame cell; the
/// wall flag is the one before its first flag-changing action (`ClimbWall`: off, `LeaveField`: on), else the frame
/// flag; HP, morale, ammunition and facing are those of the frame. The rest (grid, fort, models, maxima) is taken from
/// `look`.
fn rewound_setup(start: &SiegeBattlePayload, look: &BattleSetupDto) -> BattleSetupDto {
    let frame = start.frame.as_ref().expect("start frame");
    let mut cell: Vec<(u64, (i32, i32))> = Vec::new();
    let mut wall: Vec<(u64, bool)> = Vec::new();
    for a in &start.actions {
        let (id, from, w) = match &a.action {
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
                panic!("start answer changes HP / morale / presence")
            }
            _ => continue,
        };
        if !cell.iter().any(|(u, _)| *u == id.get()) {
            cell.push((id.get(), from));
        }
        if let Some(w) = w {
            if !wall.iter().any(|(u, _)| *u == id.get()) {
                wall.push((id.get(), w));
            }
        }
    }
    let units = frame
        .units
        .iter()
        .map(|fu| {
            let id = fu.id.get();
            let l = look.units.iter().find(|u| u.id == fu.id).expect("look");
            let side = match start
                .units
                .iter()
                .find(|u| u.battle_id == id)
                .map(|u| u.side.as_str())
            {
                Some("atk") => BattleSide::Atk,
                Some("def") => BattleSide::Def,
                other => panic!("side {other:?}"),
            };
            let (col, row) = cell
                .iter()
                .find(|(u, _)| *u == id)
                .map_or((fu.col, fu.row), |(_, c)| *c);
            BattleUnitSpawnDto {
                id: fu.id,
                side,
                category: l.category.clone(),
                model_name: l.model_name.clone(),
                owner_color: match side {
                    BattleSide::Atk => SIEGE_ATTACKER_COLOR,
                    BattleSide::Def => SIEGE_DEFENDER_COLOR,
                },
                col,
                row,
                facing: fu.facing,
                on_wall_walkway: wall
                    .iter()
                    .find(|(u, _)| *u == id)
                    .map_or(fu.on_wall_walkway, |(_, w)| *w),
                hp: fu.hp,
                max_hp: l.max_hp,
                morale: fu.morale,
                morale_max: l.morale_max,
                ammo_left: fu.ammo_left,
                ammo_max: l.ammo_max,
            }
        })
        .collect();
    BattleSetupDto {
        grid: look.grid.clone(),
        desert_palette: look.desert_palette,
        siege: true,
        deploy: None,
        siege_civ: look.siege_civ.clone(),
        player_side: BattleSide::Atk,
        units,
        fort: look.fort.clone(),
    }
}

/// D-1I6-SETUP x D-1I6-3b: the engine setup equals the rewind of the start frame (cells before the start steps, wall
/// flags, HP, morale, ammunition, facing, sides, colours, `deployPlayerSide: 'atk'`), so the client needs no composition.
#[test]
fn setup_silnika_rowny_cofnieciu_ramki_startu() {
    for seed in [11, 12, 13] {
        let (answers, _, _) = recorded_for(seed);
        let start = &answers[0];
        let setup = engine_setup(start);
        assert_eq!(&rewound_setup(start, setup), setup, "seed {seed}");
        assert!(
            start
                .actions
                .iter()
                .any(|a| matches!(a.action, BattleActionKindDto::Move { .. })),
            "scenario: the start answer moves units (the rewind is exercised)"
        );
        // Only the start answer carries the setup.
        assert!(answers[1..].iter().all(|p| p.setup.is_none()));
        assert!(answers[1..].iter().all(|p| p.tower_shooter.is_none()));
    }
}

/// D-1I6-3: the scene of the client is built from the engine setup (no client composition): one model per setup unit,
/// the tower projectile from the engine shooter row.
#[test]
fn scena_z_setupu_silnika() {
    let mut c = client_for(siege_state(11));
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    let start = c.source().seen.siege.clone();
    assert_eq!(start, vec!["start"]);
    let v = c.siege_battle().expect("battle");
    assert!(v.scene().is_some(), "scene from the engine setup");
    let (answers, _, _) = recorded_for(11);
    let shooter = answers[0]
        .tower_shooter
        .clone()
        .expect("palisade: tower shooter");
    assert_eq!(
        tower_projectile_of(&answers[0]),
        Some(tower_projectile_kind(
            shooter.typ.as_deref(),
            shooter.jednostka.as_deref()
        ))
    );
    let mut none = answers[0].clone();
    none.tower_shooter = None;
    assert_eq!(
        tower_projectile_of(&none),
        None,
        "no shooter, no tower shots"
    );
}

fn drop_setup(p: &mut SiegeBattlePayload) {
    p.setup = None;
}

fn break_grid(p: &mut SiegeBattlePayload) {
    if let Some(s) = p.setup.as_mut() {
        s.grid.tiles.pop();
    }
}

/// D-1I6-ORPHAN / D-1I6-ABORT-E2E through the real bridge: the start answer loses its setup, the client cannot build
/// the scene and closes the engine battle (`AbortSiegeBattle`): no battle in the engine (`Step` = `noActiveBattle`),
/// game state and machines unchanged, no `StateChanged`, the end is `Aborted`, the map stays usable and a new storm
/// starts.
#[test]
fn blad_setupu_porzuca_bitwe_w_silniku_e2e() {
    for (tamper, setup_error) in [
        (drop_setup as fn(&mut SiegeBattlePayload), true),
        (break_grid as fn(&mut SiegeBattlePayload), false),
    ] {
        let mut c = client_for(siege_state(11));
        let state_before = c.source_mut().state();
        let frames = c.source().seen.frame_calls;
        let ui = c.ui().clone();
        c.source_mut().tamper_start = Some(tamper);
        match c.start_siege_storm(CITY, ANCHOR, true) {
            Err(SiegeClientError::Setup(_)) if setup_error => {}
            Err(SiegeClientError::Adapter(_)) if !setup_error => {}
            other => panic!("setup / adapter error expected: {other:?}"),
        }
        assert_eq!(c.source().seen.siege, vec!["start", "abort"]);
        assert!(c.siege_battle().is_none(), "no battle in the client");
        assert!(c.last_siege_battle_view().is_none());
        match c.last_siege_battle_end() {
            Some(SiegeBattleEnd::Aborted { city_id, reason }) => {
                assert_eq!(*city_id, CITY);
                assert!(reason.starts_with("siege battle setup"), "{reason}");
            }
            other => panic!("Aborted end expected: {other:?}"),
        }
        assert_eq!(c.source().seen.frame_calls, frames, "no StateChanged");
        assert_eq!(c.ui(), &ui, "UI unchanged");
        // The engine battle is closed: a battle command is `noActiveBattle`, the state is unchanged.
        let e = c
            .source_mut()
            .request(EngineCommand::StepSiegeBattle {
                wall_ms: WallMs(16.0),
            })
            .expect_err("no battle in the engine");
        assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
        let state_after = c.source_mut().state();
        assert_eq!(state_after, state_before, "game state unchanged");
        assert_eq!(
            state_after.siege_machines_ready.get(&CityId::new(CITY)),
            Some(&vec![PlayableSiegeMachineKind::Taran]),
            "machines not consumed"
        );
        // A new storm starts (engine and client) and runs to its result.
        c.source_mut().tamper_start = None;
        c.start_siege_storm(CITY, ANCHOR, true).expect("restart");
        assert!(c.last_siege_battle_end().is_none());
        c.skip_siege_battle().expect("skip");
        c.finish_siege_battle().expect("finish");
        assert!(matches!(
            c.last_siege_battle_end(),
            Some(SiegeBattleEnd::Applied { .. })
        ));
    }
}

/// D-1I6-DOC (Evaluator r1, E13): an aborted start drops the screen of the EARLIER closed battle too
/// (`last_siege_battle_view() == None`), so both "last battle" accessors describe the aborted start.
#[test]
fn porzucony_start_czysci_ekran_poprzedniej_bitwy() {
    // Recorded answers (start, step, skip, finish) of a captured city, then a second start that lost its setup
    // (on the real bridge the city is taken after the first battle, so the second start is scripted).
    let (mut answers, _, _) = recorded();
    let mut second = answers[0].clone();
    drop_setup(&mut second);
    answers.push(second);
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    assert!(
        c.last_siege_battle_view().is_some(),
        "the applied battle keeps its screen"
    );
    match c.start_siege_storm(CITY, ANCHOR, true) {
        Err(SiegeClientError::Setup(_)) => {}
        other => panic!("setup error expected: {other:?}"),
    }
    assert!(
        c.last_siege_battle_view().is_none(),
        "aborted start: no screen of the earlier battle"
    );
    assert!(matches!(
        c.last_siege_battle_end(),
        Some(SiegeBattleEnd::Aborted { city_id: CITY, .. })
    ));
    assert_eq!(c.source().aborts, 1, "the engine battle was closed");
}

/// The abort of D-1I6-ORPHAN fails too: both errors are reported (`AbortFailed`), nothing is kept in the client.
#[test]
fn nieudane_porzucenie_to_abort_failed() {
    let (mut answers, _, _) = recorded();
    answers[0].setup = None;
    let mut c = scripted(answers, None);
    c.source_mut().abort = Some(SiegeBattleErrorDto::NoActiveBattle);
    match c.start_siege_storm(CITY, ANCHOR, true) {
        Err(SiegeClientError::AbortFailed { cause, abort }) => {
            assert!(matches!(*cause, SiegeClientError::Setup(_)), "{cause:?}");
            assert_eq!(
                *abort,
                SiegeClientError::Engine(SiegeBattleErrorDto::NoActiveBattle)
            );
        }
        other => panic!("AbortFailed expected: {other:?}"),
    }
    assert_eq!(c.source().aborts, 1);
    assert!(c.siege_battle().is_none());
    assert!(
        c.last_siege_battle_end().is_none(),
        "no end without an abort"
    );
    // Headless start does not need the setup: no abort.
    let (mut answers, _, _) = recorded();
    answers[0].setup = None;
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, false).expect("headless");
    assert_eq!(c.source().aborts, 0);
    assert!(c.siege_battle().is_some());
}

/// D-1I6-ERR in the client: the engine errors arrive as types (`NotFinished`, `BattleInProgress`), the order of the
/// checks of the client is unchanged.
#[test]
fn bledy_silnika_typowane_w_kliencie() {
    let mut c = client_for(siege_state(11));
    c.start_siege_storm(CITY, ANCHOR, false).expect("start");
    match c.finish_siege_battle() {
        Err(SiegeClientError::Engine(e)) => {
            assert_eq!(e, SiegeBattleErrorDto::NotFinished);
            assert!(is_not_finished(&e));
        }
        other => panic!("NotFinished expected: {other:?}"),
    }
    // The engine refuses an abort after the end of the battle (D-1I6D-4: phase `finished`, the pin only offers
    // "Zakończ bitwę"); the client battle is kept and finishes with its result.
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    let e = c
        .source_mut()
        .request(EngineCommand::AbortSiegeBattle)
        .expect_err("abort after the end");
    assert_eq!(
        e.siege_battle,
        Some(SiegeBattleErrorDto::AbortNotAllowed { city_id: CITY })
    );
    c.finish_siege_battle().expect("finish");
    assert!(!is_not_finished(&SiegeBattleErrorDto::NoActiveBattle));
}

/// Recorded answers of start, one 16 ms step, skip and finish for `siege_state(seed)`.
fn recorded_for(
    seed: u32,
) -> (
    Vec<SiegeBattlePayload>,
    RenderMapPayload,
    RenderFramePayload,
) {
    let mut c = client_for(siege_state(seed));
    let map = c.source_mut().render_map().expect("map");
    let frame = c.source_mut().render_frame(None, None).expect("frame");
    let mut out = Vec::new();
    for cmd in [
        SiegeBattleCommand::Start {
            city_id: CITY,
            unit_id: ANCHOR,
        },
        SiegeBattleCommand::Step { wall_ms: 16.0 },
        SiegeBattleCommand::Skip,
        SiegeBattleCommand::Finish,
    ] {
        out.push(c.source_mut().siege_battle(cmd).expect("answer").battle);
    }
    (out, map, frame)
}

// ------------------------------------------------------------ FQ-SPEED-Q1

/// R-RUSTPORT-P4-FQ-SPEED-Q1: the actions of the engine session at `speedMul` (`_setSpeedIdx`, `battleScene.ts:9518`)
/// played on the scene of the bridge start answer with `PlaybackOpts` from the client ([`civ_client::playback_opts_of`],
/// frame `16 * speedMul` = `SiegeBattleSession::frame_ms`). Returns the playback error, if any, and the number of
/// actions whose time is quantized to the frame (`Melee`, `Shot`, `TowerShot`, `Boulder`).
fn play_session_at_speed(
    speed_idx: i64,
    frame_ms: Option<f64>,
) -> (Result<(), PlaybackError>, usize) {
    use civ_engine::domain::siege_tactics_actions::actions_to_dto;
    let st = siege_state(11);
    let (answers, _, _) = recorded();
    let start = &answers[0];
    let a = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1).expect("storm");
    let data = siege_battle_apply::session_data().expect("data");
    let mut s = SiegeBattleSession::prepare(&st, a.input(), data).expect("session");
    let k = s.set_speed_idx(speed_idx, false);
    assert_eq!(s.frame_ms(), civ_client::siege_battle_frame_ms(k));
    s.play();
    let mut timed = s.battle_loop_mut().take_actions();
    let mut steps = 0;
    while s.phase() != SessionPhase::Finished {
        timed.extend(s.step(16.0).expect("step").actions);
        steps += 1;
        assert!(steps < 2_000_000, "battle without end");
    }
    timed.sort_by(|x, y| x.t0.partial_cmp(&y.t0).unwrap_or(std::cmp::Ordering::Equal));
    let dto = actions_to_dto(&timed, &s.battle_loop().st).expect("dto");
    let quantized = dto
        .iter()
        .filter(|x| {
            matches!(
                x.action,
                BattleActionKindDto::Melee { .. }
                    | BattleActionKindDto::Shot { .. }
                    | BattleActionKindDto::TowerShot { .. }
                    | BattleActionKindDto::Boulder { .. }
            )
        })
        .count();
    let setup = civ_renderer::view::battle_inputs(engine_setup(start)).expect("inputs");
    let mut scene =
        civ_renderer::battle::units::build_battle_scene_with_units_fort(setup.opts, &setup.fort);
    let mut opts = civ_client::playback_opts_of(start, k);
    if let Some(f) = frame_ms {
        opts.frame_ms = f;
    }
    let mut pb = civ_client::BattlePlayback::new(&scene, opts);
    let last = dto.last().map_or(0.0, |x| x.t0);
    let r = pb
        .push_actions(&dto)
        .and_then(|()| pb.play_until(&mut scene, last + 10_000.0, 0.0));
    (r, quantized)
}

/// R-RUSTPORT-P4-FQ-SPEED-Q1: the same storm at speed 1, 4 and 16: the playback built from the client's
/// `PlaybackOpts` (frame of the session speed) accepts every action of the session; with the 16 ms frame of speed 1
/// the faster battles are rejected (a step arrival / hit / landing time off the 16 ms grid), so the frame really comes
/// from the speed.
#[test]
fn fq_speed_klatka_playbacku_z_predkosci_sesji() {
    assert_eq!(civ_client::SIEGE_BATTLE_START_SPEED_MUL, 1.0);
    for (k, f) in [(1.0, 16.0), (2.0, 32.0), (4.0, 64.0), (512.0, 8192.0)] {
        assert_eq!(civ_client::siege_battle_frame_ms(k), f);
    }
    let (r1, q1) = play_session_at_speed(0, None);
    assert_eq!(r1, Ok(()), "x1");
    assert!(q1 > 0, "x1: quantized actions present");
    for idx in [2, 4] {
        let (r, q) = play_session_at_speed(idx, None);
        assert_eq!(r, Ok(()), "speed idx {idx}");
        assert!(q > 0, "speed idx {idx}: quantized actions present");
        let (bad, _) = play_session_at_speed(idx, Some(16.0));
        assert!(
            matches!(
                bad,
                Err(PlaybackError::HitAt { .. }
                    | PlaybackError::ArriveAt { .. }
                    | PlaybackError::LandAt { .. }
                    | PlaybackError::ShotLandAt { .. }
                    | PlaybackError::BoulderLandAt { .. })
            ),
            "speed idx {idx} with the 16 ms frame: {bad:?}"
        );
    }
}

// ------------------------------------------------------------ FQ-SPEED-BRIDGE-Q1 (#407)

/// R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1: `(speedIdx, speedMul, playback frame)` of the running battle.
fn speed_of(c: &Client) -> (usize, f64, f64) {
    let b = c.siege_battle().expect("battle");
    let (_, pb) = b.scene().expect("scene");
    assert_eq!(
        pb.opts().frame_ms,
        b.frame_ms(),
        "playback frame = frame of the view"
    );
    (b.speed_idx(), b.speed_mul(), pb.opts().frame_ms)
}

/// The quantized actions (`Melee` / `Shot` / `TowerShot` / `Move` / `Boulder`) of `acts` with `t0 > after` sit on the
/// grid of `frame` (`frame_raf(frame, nominal)`, the contract of `speed_vectors.json`); returns how many were checked.
fn on_grid(acts: &[BattleActionDto], after: f64, frame: f64) -> usize {
    use civ_engine::domain::siege_tactics_loop::frame_raf;
    let mut n = 0;
    for a in acts.iter().filter(|a| a.t0 > after) {
        let (got, nominal) = match &a.action {
            BattleActionKindDto::Melee { hit_at, .. } => (hit_at - a.t0, 150.0),
            BattleActionKindDto::Shot { land_at, .. }
            | BattleActionKindDto::TowerShot { land_at, .. } => (land_at - a.t0, 380.0),
            BattleActionKindDto::Move { arrive_at, .. } => (arrive_at - a.t0, 240.0),
            BattleActionKindDto::Boulder { land_at, .. } => (land_at - a.t0, 700.0),
            _ => continue,
        };
        assert_eq!(got, frame_raf(frame, nominal), "frame {frame}: {a:?}");
        n += 1;
    }
    n
}

/// Kryterium 2/3 (E2E engine -> bridge -> client -> renderer playback): Start, speed `idx` (4x / 64x and others)
/// before the first step, 16 ms steps to the end, Finish. The view and the playback take `speedMul` of the answer, the
/// frame is `16 * speedMul`; every action of the battle is accepted by the playback on that grid; the speed change
/// alone asks no `GetRenderFrame` and recomposes nothing; the battle is shorter in wall time at a higher speed.
#[test]
fn fq_speed_bridge_e2e_klatka_playbacku_po_zmianie() {
    let mut steps_at = Vec::new();
    for (idx, k) in [(2_i64, 4.0), (6, 64.0), (0, 1.0), (9, 512.0)] {
        let mut c = client_for(siege_state(11));
        c.start_siege_storm(CITY, ANCHOR, true).expect("start");
        assert_eq!(
            speed_of(&c),
            (0, 1.0, 16.0),
            "start: speedIdx 0 (`:2554`, `:3370`)"
        );
        let frames = c.source().seen.frame_calls;
        let map_frame = c.last_frame().cloned();
        let answers = c.siege_battle().expect("battle").answers();
        c.set_siege_battle_speed(idx, false).expect("speed");
        assert_eq!(speed_of(&c), (usize::try_from(idx).unwrap(), k, 16.0 * k));
        assert_eq!(
            c.source().seen.frame_calls,
            frames,
            "no GetRenderFrame after a speed change"
        );
        assert_eq!(c.last_frame().cloned(), map_frame, "map frame unchanged");
        assert_eq!(
            c.siege_battle().expect("battle").answers(),
            answers,
            "the speed answer is not a stream item"
        );
        assert_eq!(c.source().seen.siege.last(), Some(&"speed"));
        let before = c.source().seen.actions.len();
        let mut n = 0;
        while c.siege_battle().expect("battle").phase() == SiegeBattlePhaseDto::Running {
            c.step_siege_battle(16.0).expect("step at the new speed");
            n += 1;
            assert!(n < 200_000, "battle without end");
        }
        let checked = on_grid(&c.source().seen.actions[before..], 0.0, 16.0 * k);
        assert!(checked > 0, "x{k}: quantized actions after the change");
        assert_eq!(
            c.source().seen.frame_calls,
            frames,
            "no GetRenderFrame during the battle"
        );
        c.finish_siege_battle().expect("finish");
        assert_eq!(
            c.source().seen.frame_calls,
            frames + 1,
            "ONE GetRenderFrame after the result"
        );
        let v = c.last_siege_battle_view().expect("closed view");
        assert_eq!(
            v.scene().expect("scene").1.queued(),
            0,
            "every action played"
        );
        steps_at.push((k, n));
    }
    assert!(
        steps_at[1].1 < steps_at[2].1,
        "64x ends in fewer wall frames than 1x: {steps_at:?}"
    );
}

/// Kryterium 2: the change in the MIDDLE of the battle (after 1x steps) and the scene buttons: `cycle` wraps 512x -> 1x,
/// the panel ± clamps at both ends; after every change the next steps play on the grid of the new frame and the whole
/// battle is accepted by the playback (Finish included).
#[test]
fn fq_speed_bridge_zmiana_w_trakcie_cycle_i_panel() {
    let mut c = client_for(siege_state(11));
    c.start_siege_storm(CITY, ANCHOR, true).expect("start");
    for _ in 0..30 {
        c.step_siege_battle(16.0).expect("step x1");
    }
    // Panel ±: from 0 down = clamp at 0.
    c.adjust_siege_battle_speed(-1).expect("minus at 0");
    assert_eq!(speed_of(&c), (0, 1.0, 16.0));
    // 0 -> 3 (8x).
    c.set_siege_battle_speed(3, false).expect("idx 3");
    assert_eq!(speed_of(&c), (3, 8.0, 128.0));
    let mut v_change = c
        .siege_battle()
        .expect("b")
        .last_frame()
        .expect("frame")
        .v_now;
    let mut from = c.source().seen.actions.len();
    for _ in 0..20 {
        c.step_siege_battle(16.0).expect("step x8");
    }
    assert!(
        on_grid(&c.source().seen.actions[from..], v_change, 128.0) > 0,
        "x8 actions on the 128 ms grid"
    );
    // Panel +: 3 -> 4 (16x), then up to the top and clamp at 9 (512x).
    c.adjust_siege_battle_speed(1).expect("plus");
    assert_eq!(speed_of(&c), (4, 16.0, 256.0));
    c.adjust_siege_battle_speed(100).expect("plus many");
    assert_eq!(speed_of(&c), (9, 512.0, 8192.0));
    c.adjust_siege_battle_speed(1).expect("plus at 9");
    assert_eq!(speed_of(&c), (9, 512.0, 8192.0), "panel ± does not wrap");
    // `_cycleSpeed`: 512x -> 1x -> 2x.
    c.cycle_siege_battle_speed().expect("cycle at 9");
    assert_eq!(
        speed_of(&c),
        (0, 1.0, 16.0),
        "the speed button wraps 512x -> 1x"
    );
    c.cycle_siege_battle_speed().expect("cycle");
    assert_eq!(speed_of(&c), (1, 2.0, 32.0));
    // 4x for the rest of the battle (the steps after the change on the 64 ms grid).
    c.set_siege_battle_speed(2, true).expect("idx 2");
    assert_eq!(speed_of(&c), (2, 4.0, 64.0));
    v_change = c
        .siege_battle()
        .expect("b")
        .last_frame()
        .expect("frame")
        .v_now;
    from = c.source().seen.actions.len();
    let frames = c.source().seen.frame_calls;
    let mut n = 0;
    while c.siege_battle().expect("battle").phase() == SiegeBattlePhaseDto::Running {
        c.step_siege_battle(16.0).expect("step x4");
        n += 1;
        assert!(n < 200_000, "battle without end");
    }
    on_grid(&c.source().seen.actions[from..], v_change, 64.0);
    // End screen: the speed may still change (the engine accepts it in `Finished`).
    c.set_siege_battle_speed(5, false)
        .expect("speed on the end screen");
    assert_eq!(
        c.siege_battle().expect("b").phase(),
        SiegeBattlePhaseDto::Finished
    );
    assert_eq!(c.source().seen.frame_calls, frames, "no GetRenderFrame");
    let speeds = c
        .source()
        .seen
        .siege
        .iter()
        .filter(|t| **t == "speed")
        .count();
    assert_eq!(speeds, 9, "every speed change is one engine call");
    c.finish_siege_battle().expect("finish");
    assert!(c.last_siege_battle_end().is_some());
}

/// Kryterium 2/3: without a battle the client refuses with no engine call; after `Finish` likewise (the battle is
/// closed); the engine itself answers `noActiveBattle` (typed) when asked directly.
#[test]
fn fq_speed_bridge_bez_bitwy() {
    let mut c = client_for(siege_state(11));
    assert!(matches!(
        c.set_siege_battle_speed(1, false),
        Err(SiegeClientError::NoBattle)
    ));
    assert!(matches!(
        c.cycle_siege_battle_speed(),
        Err(SiegeClientError::NoBattle)
    ));
    assert!(matches!(
        c.adjust_siege_battle_speed(1),
        Err(SiegeClientError::NoBattle)
    ));
    assert!(c.source().seen.siege.is_empty(), "no engine call");
    let e = c
        .source_mut()
        .siege_battle(SiegeBattleCommand::SetSpeed {
            idx: 1,
            clamp: false,
        })
        .expect_err("engine without a battle");
    assert_eq!(
        e,
        SiegeSourceError::Battle(SiegeBattleErrorDto::NoActiveBattle)
    );
    c.start_siege_storm(CITY, ANCHOR, false).expect("start");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    let calls = c.source().seen.siege.len();
    assert!(matches!(
        c.set_siege_battle_speed(1, false),
        Err(SiegeClientError::NoBattle)
    ));
    assert_eq!(
        c.source().seen.siege.len(),
        calls,
        "no engine call after Finish"
    );
    let e = c
        .source_mut()
        .siege_battle(SiegeBattleCommand::SetSpeed {
            idx: 1,
            clamp: true,
        })
        .expect_err("engine after Finish");
    assert_eq!(
        e,
        SiegeSourceError::Battle(SiegeBattleErrorDto::NoActiveBattle)
    );
}

/// A transport that changes the `siegeBattle` of an answer.
type Tamper = fn(&mut SiegeBattlePayload);

fn drop_speed(p: &mut SiegeBattlePayload) {
    p.speed_mul = None;
}

fn wrong_speed(p: &mut SiegeBattlePayload) {
    p.speed_mul = Some(2.0);
}

/// Kryterium 3 (order of the frame update): the frame changes only from an ACCEPTED answer and with ITS `speedMul`; an
/// answer without the speed or with `speedMul != SPEED_STEPS[speedIdx]` leaves the speed and the playback frame as
/// they were (the engine call happened). Headless view: the speed is tracked without a scene.
#[test]
fn fq_speed_bridge_klatka_tylko_z_przyjetej_odpowiedzi() {
    let cases: [(Tamper, &str); 2] = [(drop_speed, "missing"), (wrong_speed, "wrong")];
    for (tamper, what) in cases {
        let mut c = client_for(siege_state(11));
        c.start_siege_storm(CITY, ANCHOR, true).expect("start");
        c.set_siege_battle_speed(2, false).expect("4x");
        c.source_mut().tamper_speed = Some(tamper);
        let e = c.set_siege_battle_speed(6, false).expect_err(what);
        assert!(
            matches!(e, SiegeClientError::SpeedAnswer(_)),
            "{what}: {e:?}"
        );
        assert_eq!(
            speed_of(&c),
            (2, 4.0, 64.0),
            "{what}: speed and frame unchanged"
        );
    }
    // Headless: no scene, the view still follows the engine.
    let mut c = client_for(siege_state(11));
    c.start_siege_storm(CITY, ANCHOR, false).expect("start");
    c.set_siege_battle_speed(-1, false).expect("wrap");
    let b = c.siege_battle().expect("battle");
    assert_eq!(
        (b.speed_idx(), b.speed_mul(), b.frame_ms()),
        (9, 512.0, 8192.0)
    );
    assert!(b.scene().is_none());
}
