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
//! The scene part the bridge does not carry ([`SiegeSceneStatic`], debt D-1I6-SETUP) is read from the engine library
//! for the same state (`prepare_storm` + `rebuild`: grid, fort, tower rows, morale maxima, unit names; the battle is
//! deterministic, D-WIRB-1). `category` is a fixture value (model routing only); `max_hp` / `ammo_max` are the start
//! values of the scene (every unit of the scenario starts at full HP and full ammunition).

#![allow(clippy::float_cmp)]

#[path = "../../engine/src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult,
    CivEngineAdapter, EngineBridge, EngineCommand, StartGameParams, WallMs,
};
use civ_client::{
    compose_siege_battle_setup, is_not_finished, ClientError, HighlightPriority, MapDetailQuality,
    RenderClient, RenderFramePayload, RenderMapPayload, RenderSource, RenderUiParams, SiegeAfterUi,
    SiegeBattleAnswer, SiegeBattleCommand, SiegeBattleEnd, SiegeBattleError, SiegeBattlePayload,
    SiegeBattlePhaseDto, SiegeBattleSource, SiegeClientError, SiegeSceneStatic, SiegeSourceError,
    SiegeUnitLook, StreamOrder, SIEGE_ATTACKER_COLOR, SIEGE_DEFENDER_COLOR,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_apply;
use civ_engine::domain::siege_battle_session::{SessionError, SessionPhase, SiegeBattleSession};
use civ_engine::domain::siege_city_fortification::CityFortificationKind;
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_renderer::battle::playback::PlaybackError;
use civ_renderer::battle::siege_towers::tower_projectile_kind;
use civ_renderer::battle::units::siege_wall_civ;
use civ_view_model::battle::{
    BattleActionDto, BattleActionKindDto, BattleFortDto, BattleFrameDto, BattleGridDto, BattleSide,
    BattleWinner, FortKind, TowerMaterial,
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
}

impl BridgeSource {
    fn new(bridge: EngineBridge<CivEngineAdapter>) -> Self {
        Self {
            bridge,
            next_id: 0,
            seen: Seen::default(),
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

/// D-1I6-1 / debt D-1I6-ERR: the bridge carries `SiegeBattleError` only as its `Display` (`EngineRejected`); the
/// battle errors the client acts on (`NotFinished`, `Aborted`) are mapped back from that text.
fn battle_error(e: BridgeError) -> SiegeSourceError<BridgeError> {
    if e.code != BridgeErrorCode::EngineRejected {
        return SiegeSourceError::Source(e);
    }
    let not_finished = SiegeBattleError::Session(SessionError::NotFinished);
    if e.message == not_finished.to_string() {
        return SiegeSourceError::Battle(not_finished);
    }
    if let Some(rest) = e.message.strip_prefix("siege battle at city ") {
        if let Some((id, reason)) = rest.split_once(" closed without a result: ") {
            if let Ok(city_id) = id.parse() {
                return SiegeSourceError::Battle(SiegeBattleError::Aborted {
                    city_id,
                    reason: reason.to_owned(),
                });
            }
        }
    }
    SiegeSourceError::Source(e)
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
        };
        self.seen.siege.push(tag);
        let d = self.request(cmd).map_err(battle_error)?;
        let state_changed = d
            .events
            .iter()
            .any(|e| matches!(e, BridgeEvent::StateChanged { .. }));
        let battle = d
            .response
            .siege_battle
            .ok_or_else(|| SiegeSourceError::Source(unexpected("no siegeBattle", tag)))?;
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

// ------------------------------------------------------------ scene static (engine library, D-1I6-SETUP)

/// The scene part the bridge answer does not carry, for the storm of `CITY` from `ANCHOR` on `st`.
fn scene_static(st: &PlayableState) -> SiegeSceneStatic {
    let a = siege_battle_apply::prepare_storm(st, CITY, ANCHOR, 1).expect("storm");
    let s = a.rebuild().expect("session");
    let field = s.field();
    let siege = field.siege.as_ref().expect("siege field");
    let (kind, material) = match siege.fort_kind {
        CityFortificationKind::None => (FortKind::None, None),
        CityFortificationKind::Palisada => (FortKind::Palisada, Some(TowerMaterial::Drewno)),
        CityFortificationKind::Mur => (FortKind::Mur, Some(TowerMaterial::Kamien)),
    };
    let lp = s.battle_loop();
    let body = &lp.env.body;
    let mut units = Vec::new();
    for (side, list) in [(0usize, &lp.st.atk), (1usize, &lp.st.def)] {
        for (i, u) in list.iter().enumerate() {
            let ammo = body.ammo_left[side][i];
            assert!(u.c.hp > 0.0, "scenario: every unit starts alive");
            units.push(SiegeUnitLook {
                battle_id: u.id,
                category: "INFANTRY".to_owned(),
                model_name: body.names[side][i].clone(),
                max_hp: u.c.hp,
                morale_max: body.morale_max[side][i],
                ammo_max: ammo.is_finite().then_some(ammo),
            });
        }
    }
    SiegeSceneStatic {
        grid: BattleGridDto {
            cols: field.map.cols(),
            rows: field.map.rows(),
            tiles: field.map.tiles().to_vec(),
        },
        desert_palette: field.desert_palette,
        siege_civ: siege_wall_civ(None, a.input().def_civ.as_deref()).to_owned(),
        fort: BattleFortDto {
            kind,
            tower_material: material,
            tower_rows: siege
                .tower_rows
                .iter()
                .map(|r| i32::try_from(*r).expect("row"))
                .collect(),
        },
        units,
        tower_projectile: Some(tower_projectile_kind(None, Some(&body.tower_shooter_nazwa))),
    }
}

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
    let scene = with_scene.then(|| scene_static(&st));
    let mut c = client_for(st);
    let frames_before = c.source().seen.frame_calls;
    c.start_siege_storm(CITY, ANCHOR, scene.as_ref())
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = client_for(st);
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
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
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
    c.start_siege_storm(CITY, ANCHOR, None).expect("start");
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
        c.start_siege_storm(CITY, ANCHOR, None).err(),
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
        c.start_siege_storm(CITY, ANCHOR, None).err(),
        Some(SiegeClientError::NoSession)
    );
    assert!(c.source().seen.siege.is_empty());
    c.on_session_created().expect("map");
    c.on_state_changed().expect("frame");
    let ui = c.ui().clone();
    match c.start_siege_storm(CITY, ANCHOR, None) {
        Err(SiegeClientError::Source(e)) => {
            assert_eq!(e.code, BridgeErrorCode::EngineRejected, "{e:?}");
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
    finish: Option<SiegeBattleError>,
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
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
    finish: Option<SiegeBattleError>,
) -> RenderClient<Scripted> {
    let (_, map, frame) = recorded();
    let mut c = RenderClient::new(
        Scripted {
            answers,
            finish,
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = scripted(
        answers.clone(),
        Some(SiegeBattleError::Aborted {
            city_id: CITY,
            reason: "test".into(),
        }),
    );
    c.select_unit(Some(ANCHOR)).expect("select");
    let frames = c.source().frame_calls;
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
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
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("restart");
    assert_eq!(c.siege_battle().expect("battle").answers(), 1);
    assert_eq!(c.last_siege_battle_end(), None);
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
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

/// D-1I6-3: the setup takes cells, facing, HP, morale and ammunition from the start frame, the side from `units`, the
/// owner colours of the pin and `deployPlayerSide: 'atk'`; a unit without a look or a side is an error.
#[test]
fn setup_sceny_z_odpowiedzi_startu() {
    let (answers, _, _) = recorded();
    let st = siege_state(11);
    let scene = scene_static(&st);
    let start = &answers[0];
    let setup = compose_siege_battle_setup(start, &scene).expect("setup");
    let f = start.frame.as_ref().expect("frame");
    assert_eq!(setup.units.len(), f.units.len());
    assert!(setup.siege && setup.deploy.is_none());
    assert_eq!(setup.player_side, BattleSide::Atk);
    let mut rewound = 0;
    for (u, fu) in setup.units.iter().zip(&f.units) {
        assert_eq!(u.id, fu.id);
        // D-1I6-3b: the spawn cell is the `from` of the first start step, else the frame cell.
        let first_step = start.actions.iter().find_map(|a| match a.action {
            BattleActionKindDto::Move {
                id,
                from_col,
                from_row,
                ..
            } if id == fu.id => Some((from_col, from_row)),
            _ => None,
        });
        if let Some(c) = first_step {
            rewound += 1;
            assert_eq!((u.col, u.row), c, "unit {} spawn = first step from", fu.id);
        } else {
            assert_eq!((u.col, u.row), (fu.col, fu.row));
        }
        assert_eq!(u.facing, fu.facing);
        assert_eq!(
            (u.hp, u.morale, u.ammo_left),
            (fu.hp, fu.morale, fu.ammo_left)
        );
        assert_eq!(u.on_wall_walkway, fu.on_wall_walkway);
        let side = &start
            .units
            .iter()
            .find(|r| r.battle_id == fu.id.get())
            .expect("ref")
            .side;
        let (want_side, color) = if side == "atk" {
            (BattleSide::Atk, SIEGE_ATTACKER_COLOR)
        } else {
            (BattleSide::Def, SIEGE_DEFENDER_COLOR)
        };
        assert_eq!((u.side, u.owner_color), (want_side, color));
    }
    assert!(setup.units.iter().any(|u| u.side == BattleSide::Def));
    assert!(rewound > 0, "scenario: the start answer moves units");
    // `ClimbWall` at start: the spawn is before the climb (off the wall, `from` cell), whatever the frame says.
    let mut climb = start.clone();
    let cf = climb.frame.as_mut().expect("frame");
    let (cid, ccol, crow) = (cf.units[0].id, cf.units[0].col, cf.units[0].row);
    cf.units[0].on_wall_walkway = true;
    climb.actions.retain(|a| match a.action {
        BattleActionKindDto::Move { id, .. } | BattleActionKindDto::ClimbWall { id, .. } => {
            id != cid
        }
        _ => true,
    });
    climb.actions.insert(
        0,
        BattleActionDto {
            t0: 0.0,
            action: BattleActionKindDto::ClimbWall {
                id: cid,
                from_col: ccol - 1,
                from_row: crow,
                to_col: ccol,
                to_row: crow,
            },
        },
    );
    let cs = compose_siege_battle_setup(&climb, &scene).expect("climb setup");
    let cu = cs.units.iter().find(|u| u.id == cid).expect("unit");
    assert_eq!(
        (cu.col, cu.row, cu.on_wall_walkway),
        (ccol - 1, crow, false)
    );
    // A start answer that changes HP cannot be rewound: refused.
    let mut hurt = start.clone();
    hurt.actions.push(BattleActionDto {
        t0: 0.0,
        action: BattleActionKindDto::Kill { id: f.units[0].id },
    });
    assert!(compose_siege_battle_setup(&hurt, &scene).is_err());
    let mut no_look = scene.clone();
    no_look.units.pop();
    assert!(compose_siege_battle_setup(start, &no_look).is_err());
    let mut no_side = start.clone();
    no_side.units.pop();
    assert!(compose_siege_battle_setup(&no_side, &scene).is_err());
    let mut bad_side = start.clone();
    bad_side.units[0].side = "x".into();
    assert!(compose_siege_battle_setup(&bad_side, &scene).is_err());
    let mut no_frame = start.clone();
    no_frame.frame = None;
    assert!(compose_siege_battle_setup(&no_frame, &scene).is_err());
}

/// The start answer with the cell / wall actions of unit 0 replaced by `kinds` (all at `t0 = 0`) and the frame wall
/// flag of that unit set to `frame_wall`. Returns the answer, the unit and its frame cell.
fn start_with(
    start: &SiegeBattlePayload,
    frame_wall: bool,
    kinds: impl Fn(civ_view_model::ids::UnitId, i32, i32) -> Vec<BattleActionKindDto>,
) -> (SiegeBattlePayload, civ_view_model::ids::UnitId, (i32, i32)) {
    let mut p = start.clone();
    let f = p.frame.as_mut().expect("frame");
    let (id, col, row) = (f.units[0].id, f.units[0].col, f.units[0].row);
    f.units[0].on_wall_walkway = frame_wall;
    p.actions.retain(|a| match a.action {
        BattleActionKindDto::Move { id: u, .. }
        | BattleActionKindDto::ClimbWall { id: u, .. }
        | BattleActionKindDto::LeaveField { id: u, .. } => u != id,
        _ => true,
    });
    let new: Vec<BattleActionDto> = kinds(id, col, row)
        .into_iter()
        .map(|action| BattleActionDto { t0: 0.0, action })
        .collect();
    p.actions.splice(0..0, new);
    (p, id, (col, row))
}

fn mv(id: civ_view_model::ids::UnitId, from: (i32, i32), to: (i32, i32)) -> BattleActionKindDto {
    BattleActionKindDto::Move {
        id,
        from_col: from.0,
        from_row: from.1,
        to_col: to.0,
        to_row: to.1,
        arrive_at: 1.0,
    }
}

fn climb(id: civ_view_model::ids::UnitId, from: (i32, i32), to: (i32, i32)) -> BattleActionKindDto {
    BattleActionKindDto::ClimbWall {
        id,
        from_col: from.0,
        from_row: from.1,
        to_col: to.0,
        to_row: to.1,
    }
}

fn leave_field(
    id: civ_view_model::ids::UnitId,
    from: (i32, i32),
    to: (i32, i32),
) -> BattleActionKindDto {
    BattleActionKindDto::LeaveField {
        id,
        from_col: from.0,
        from_row: from.1,
        to_col: to.0,
        to_row: to.1,
    }
}

/// `(col, row, on_wall_walkway)` of the spawn of `id`.
fn spawn_of(
    p: &SiegeBattlePayload,
    scene: &SiegeSceneStatic,
    id: civ_view_model::ids::UnitId,
) -> (i32, i32, bool) {
    let s = compose_siege_battle_setup(p, scene).expect("setup");
    let u = s.units.iter().find(|u| u.id == id).expect("unit");
    (u.col, u.row, u.on_wall_walkway)
}

/// r2 (Z1, E12-E15): D-1I6-3b rewinds the cell and the wall flag separately. The cell is the `from` of the FIRST
/// cell-changing start action; the flag is the one before the FIRST flag-changing action (`ClimbWall`: off the wall,
/// `LeaveField`: on the wall); a `Move` keeps the frame flag. HP / morale / presence changes at the start are refused.
#[test]
fn setup_spawn_komorka_i_mur_przed_akcjami_startu() {
    let (answers, _, _) = recorded();
    let st = siege_state(11);
    let scene = scene_static(&st);
    let start = &answers[0];
    // Z1: Move then ClimbWall; the frame says "on the wall" (after the climb), the spawn is off the wall.
    let (p, id, (c, r)) = start_with(start, true, |id, c, r| {
        vec![
            mv(id, (c + 2, r), (c + 1, r)),
            climb(id, (c + 1, r), (c, r)),
        ]
    });
    assert_eq!(
        spawn_of(&p, &scene, id),
        (c + 2, r, false),
        "Move -> ClimbWall"
    );
    // Z1: Move then LeaveField; the frame says "off the wall", the spawn is on the wall.
    let (p, id, (c, r)) = start_with(start, false, |id, c, r| {
        vec![
            mv(id, (c + 2, r), (c + 1, r)),
            leave_field(id, (c + 1, r), (c, r)),
        ]
    });
    assert_eq!(
        spawn_of(&p, &scene, id),
        (c + 2, r, true),
        "Move -> LeaveField"
    );
    // E13: Move alone keeps the frame flag (on the wall walkway: a defender walking along the crown).
    let (p, id, (c, r)) = start_with(start, true, |id, c, r| vec![mv(id, (c + 1, r), (c, r))]);
    assert_eq!(
        spawn_of(&p, &scene, id),
        (c + 1, r, true),
        "Move keeps the flag"
    );
    // E14: LeaveField first; the frame says "off the wall", the spawn is on the wall.
    let (p, id, (c, r)) = start_with(start, false, |id, c, r| {
        vec![leave_field(id, (c + 1, r), (c, r))]
    });
    assert_eq!(spawn_of(&p, &scene, id), (c + 1, r, true), "LeaveField");
    // The FIRST flag change wins: ClimbWall then LeaveField = off the wall before the climb.
    let (p, id, (c, r)) = start_with(start, false, |id, c, r| {
        vec![
            climb(id, (c + 2, r), (c + 1, r)),
            leave_field(id, (c + 1, r), (c, r)),
        ]
    });
    assert_eq!(
        spawn_of(&p, &scene, id),
        (c + 2, r, false),
        "first flag change"
    );
    // E12: the FIRST cell change wins over the last one.
    let (p, id, (c, r)) = start_with(start, false, |id, c, r| {
        vec![mv(id, (c + 2, r), (c + 1, r)), mv(id, (c + 1, r), (c, r))]
    });
    assert_eq!(spawn_of(&p, &scene, id), (c + 2, r, false), "first step");
    // E15: every HP / morale / presence change at the start is refused, never guessed.
    let f = start.frame.as_ref().expect("frame");
    let (a, b) = (f.units[0].id, f.units[1].id);
    for kind in [
        BattleActionKindDto::Kill { id: a },
        BattleActionKindDto::Leave { id: a },
        BattleActionKindDto::Rout { id: a },
        BattleActionKindDto::Shaken {
            id: a,
            fallen: b,
            morale: 1.0,
        },
    ] {
        let mut p = start.clone();
        p.actions.push(BattleActionDto {
            t0: f.v_now,
            action: kind.clone(),
        });
        assert!(
            compose_siege_battle_setup(&p, &scene).is_err(),
            "{kind:?} at the start is refused"
        );
    }
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
    c.start_siege_storm(CITY, ANCHOR, None).expect("start");
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = scripted(answers.clone(), None);
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
    c.step_siege_battle(16.0).expect("step");
    c.skip_siege_battle().expect("skip");
    c.finish_siege_battle().expect("finish");
    assert!(c.last_siege_battle_view().is_some());
    assert!(c.last_siege_battle_end().is_some());
    // A new start: the previous screen and end are gone while the new battle runs.
    c.source_mut().answers = answers.clone();
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("restart");
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
    let st = siege_state(11);
    let scene = scene_static(&st);
    let mut c = scripted(answers, None);
    c.start_siege_storm(CITY, ANCHOR, Some(&scene))
        .expect("start");
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
