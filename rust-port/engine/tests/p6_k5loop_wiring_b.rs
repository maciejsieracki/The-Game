//! R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 część B): bitwa oblężnicza gracza przez most —
//! `StartSiegeStorm` → `StepSiegeBattle`×N / `SkipSiegeBattle` → `FinishSiegeBattle`, wynik zastosowany do stanu,
//! jawne błędy poza fazą, determinizm (ziarno gry, niezależność od podziału kroków), kontrakt JSON addytywny,
//! D-ADP-11 (sojusz = umowa).

#![allow(dead_code)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult,
    CivEngineAdapter, EngineBridge, EngineCommand, StartGameParams, WallMs,
};
use civ_engine::domain::diplomacy::{
    ActiveDeal, CivilizationPair, Relation, RelationStatus, TreatyKind,
};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_apply::{
    self, SiegeBattleError, SiegeBattlePayload, SiegeBattlePhaseDto,
};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_view_model::battle::{BattleActionKindDto, BattleWinner};

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const ALLY: u64 = 102;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);

#[derive(Clone)]
struct Scn {
    atk: Vec<&'static str>,
    def: Vec<&'static str>,
    built: Vec<&'static str>,
    machines: Vec<PlayableSiegeMachineKind>,
    seed: u32,
}

fn scn_quick() -> Scn {
    Scn {
        atk: vec![
            "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Łucznik",
        ],
        def: vec!["Wojownik"],
        built: vec!["palisada"],
        machines: vec![PlayableSiegeMachineKind::Taran],
        seed: 11,
    }
}

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

/// Gra: gracz (1) oblega obwarowane miasto wroga (101) na (4,3); atakujący na (5,3), obrońcy w mieście.
fn state_for(s: &Scn) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams {
        seed: s.seed,
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
        is_capital: false,
        population: 3,
        culture: 0,
    });
    st.stores
        .buildings_by_city
        .insert(CITY, s.built.iter().map(|b| (*b).to_owned()).collect());
    st.oblegane.insert(CityId::new(CITY));
    if !s.machines.is_empty() {
        st.siege_machines_ready
            .insert(CityId::new(CITY), s.machines.clone());
    }
    let mut id = 7000;
    for t in &s.atk {
        id += 1;
        add_unit(&mut st, id, HUMAN, (CITY_POS.0 + 1, CITY_POS.1), t);
    }
    id = 8000;
    for t in &s.def {
        id += 1;
        add_unit(&mut st, id, ENEMY, CITY_POS, t);
    }
    st
}

const ANCHOR: u64 = 7001;

fn bridge_for(st: PlayableState) -> EngineBridge<CivEngineAdapter> {
    EngineBridge::new(CivEngineAdapter::from_game(PlayableGame::from_state(st)))
}

fn send(
    b: &mut EngineBridge<CivEngineAdapter>,
    cmd: EngineCommand,
) -> Result<BridgeDispatch, BridgeError> {
    b.handle(BridgeRequest::new("r", cmd))
}

fn battle(d: &BridgeDispatch) -> &SiegeBattlePayload {
    d.response
        .siege_battle
        .as_ref()
        .expect("odpowiedz bitwy niesie siegeBattle")
}

fn state_of(d: &BridgeDispatch) -> &PlayableState {
    match &d.response.result {
        BridgeResult::State { state } => state,
        _ => panic!("komendy bitwy odpowiadaja State"),
    }
}

fn start() -> EngineCommand {
    EngineCommand::StartSiegeStorm {
        city_id: CITY,
        unit_id: ANCHOR,
    }
}

fn step(ms: f64) -> EngineCommand {
    EngineCommand::StepSiegeBattle {
        wall_ms: WallMs(ms),
    }
}

/// Obrona r1 (Z1): kontrakt konsumenta `renderer/src/battle/playback.rs` — `push_actions(actions)` (wszystko albo nic,
/// `t0` niemalejące od `last_queued`), potem `push_frame(frame)` (`vNow >= last_queued`); `last_queued` żyje przez całą
/// bitwę (`check_order`, `playback.rs:584-625`). Odwzorowanie testu Evaluatora `eval_playback_kontrakt_*`.
struct PlaybackOrder {
    last: f64,
    bad: Vec<String>,
}

impl PlaybackOrder {
    fn new() -> Self {
        Self {
            last: f64::NEG_INFINITY,
            bad: Vec::new(),
        }
    }

    fn feed(&mut self, k: usize, p: &SiegeBattlePayload) {
        let mut prev = self.last;
        for a in &p.actions {
            if a.t0 < prev {
                self.bad
                    .push(format!("resp {k}: action t0 {} < {prev}", a.t0));
                return;
            }
            prev = a.t0;
        }
        self.last = prev;
        if let Some(f) = &p.frame {
            if f.v_now < self.last {
                self.bad
                    .push(format!("resp {k}: frame vNow {} < {}", f.v_now, self.last));
            } else {
                self.last = f.v_now;
            }
        }
    }
}

/// Bitwa przez most w czasie rzeczywistym kawałkami `chunks` (cyklicznie) do końca + `FinishSiegeBattle`.
fn run_realtime(
    st: PlayableState,
    chunks: &[f64],
) -> (PlayableState, Vec<(f64, String)>, BridgeDispatch) {
    let mut b = bridge_for(st);
    let d = send(&mut b, start()).expect("start");
    let mut order = PlaybackOrder::new();
    order.feed(0, battle(&d));
    let mut acts: Vec<(f64, String)> = battle(&d)
        .actions
        .iter()
        .map(|a| (a.t0, format!("{a:?}")))
        .collect();
    let mut k = 0;
    loop {
        let d = send(&mut b, step(chunks[k % chunks.len()])).expect("step");
        k += 1;
        let p = battle(&d);
        order.feed(k, p);
        // Każda odpowiedź: `t0` niemalejące (D-WIRB-6).
        assert!(p.actions.windows(2).all(|w| w[0].t0 <= w[1].t0));
        acts.extend(p.actions.iter().map(|a| (a.t0, format!("{a:?}"))));
        if battle(&d).phase == SiegeBattlePhaseDto::Finished {
            break;
        }
        assert!(k < 200_000, "bitwa bez konca");
    }
    let fin = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    order.feed(k + 1, battle(&fin));
    acts.extend(
        battle(&fin)
            .actions
            .iter()
            .map(|a| (a.t0, format!("{a:?}"))),
    );
    assert!(
        order.bad.is_empty(),
        "{} naruszen kolejnosci konsumenta playback: {:?}",
        order.bad.len(),
        order.bad.iter().take(5).collect::<Vec<_>>()
    );
    // Kolejność globalna = stabilne sortowanie po `t0` (podział na odpowiedzi zmienia tylko granice porcji).
    acts.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    (state_of(&fin).clone(), acts, fin)
}

#[test]
fn most_start_krok_pomin_koniec_stosuje_wynik() {
    let st0 = state_for(&scn_quick());
    let mut b = bridge_for(st0.clone());
    let d = send(&mut b, start()).expect("start szturmu");
    assert!(
        d.events.is_empty(),
        "start nie zmienia stanu (brak StateChanged)"
    );
    assert_eq!(
        state_of(&d),
        &st0,
        "start: stan gry bez zmian (machiny zuzywa wynik)"
    );
    let p = battle(&d);
    assert_eq!(p.city_id, CITY);
    assert_eq!(p.phase, SiegeBattlePhaseDto::Running);
    assert!(p.frame.is_some() && p.result.is_none());
    assert!(
        p.units
            .iter()
            .any(|u| u.unit_id == ANCHOR.to_string() && u.side == "atk"),
        "kotwica w scenie"
    );
    assert!(p.units.iter().any(|u| u.side == "def"));
    assert!(
        p.actions
            .iter()
            .any(|a| matches!(a.action, BattleActionKindDto::Turn { round_no: 1 })),
        "start = pierwsza tura (_kickoffBattleTurn)"
    );
    // Krok czasu rzeczywistego: ramka z czasem wirtualnym.
    let d = send(&mut b, step(160.0)).expect("krok");
    assert!(d.events.is_empty());
    let f = battle(&d).frame.as_ref().expect("ramka");
    assert!(f.v_now > 0.0);
    // Pomiń -> koniec.
    let d = send(&mut b, EngineCommand::SkipSiegeBattle).expect("pomin");
    assert!(d.events.is_empty());
    assert_eq!(battle(&d).phase, SiegeBattlePhaseDto::Finished);
    assert!(battle(&d).frame.as_ref().is_some_and(|f| f.finished));
    // Zastosowanie wyniku.
    let d = send(&mut b, EngineCommand::FinishSiegeBattle).expect("koniec");
    assert_eq!(d.events.len(), 1, "wynik zmienia stan: StateChanged");
    assert!(matches!(d.events[0], BridgeEvent::StateChanged { .. }));
    let p = battle(&d);
    assert_eq!(p.phase, SiegeBattlePhaseDto::Applied);
    let r = p.result.as_ref().expect("wynik");
    let st1 = state_of(&d).clone();
    assert_eq!(
        r.consumed_machines,
        vec![PlayableSiegeMachineKind::Taran],
        "consumeReadyMachines"
    );
    assert!(!st1.siege_machines_ready.contains_key(&CityId::new(CITY)));
    for id in &r.removed_unit_ids {
        assert!(!st1.units.iter().any(|u| u.id.get() == *id));
        assert!(!st1.economy.units.contains_key(id));
    }
    for h in &r.hp {
        assert_eq!(st1.economy.units[&h.unit_id].hp, Some(h.hp));
        assert!(h.hp > 0.0);
    }
    match r.winner {
        BattleWinner::Atakujacy => {
            // Przegrana strona (logowana) usunięta w całości.
            assert!(!st1.units.iter().any(|u| u.owner_id.get() == ENEMY));
            assert_eq!(r.capture_blocked, !r.wall_breached);
            assert_eq!(r.capture_requested.is_some(), r.wall_breached);
        }
        BattleWinner::Obronca => {
            assert!(!st1.units.iter().any(|u| u.owner_id.get() == HUMAN));
        }
        BattleWinner::Remis => assert!(r.siege_ended),
    }
    // Bitwa zamknięta: kolejne komendy bitwy = jawne błędy; GetState = stan po wyniku.
    let e = send(&mut b, EngineCommand::FinishSiegeBattle).expect_err("brak bitwy");
    assert_eq!(e.code, BridgeErrorCode::EngineRejected);
    let g = send(&mut b, EngineCommand::GetState).expect("get");
    assert_eq!(state_of(&g), &st1);
    assert_eq!(b.adapter().state(), &st1);
}

#[test]
fn czas_rzeczywisty_niezalezny_od_podzialu_i_deterministyczny() {
    let st = state_for(&scn_quick());
    let (a, acts_a, fin_a) = run_realtime(st.clone(), &[16.0]);
    let (b, acts_b, fin_b) = run_realtime(st.clone(), &[7.5, 40.25, 1000.0, 3.0, 250.0]);
    assert_eq!(a, b, "stan po wyniku nie zalezy od podzialu krokow");
    assert_eq!(acts_a, acts_b, "te same akcje w tej samej kolejnosci");
    assert_eq!(battle(&fin_a).result, battle(&fin_b).result);
    // Ten sam seed gry -> ten sam wynik w osobnej grze.
    let (c, _, _) = run_realtime(st, &[16.0]);
    assert_eq!(a, c);
}

/// D-WIRB-1: ścieżka odtworzenia z zapisu operacji (każda komenda bez pamięci podręcznej wątku, jak komenda z innego
/// wątku Tauri) daje te same akcje, ramki i wynik co sesja żywa.
#[test]
fn odtworzenie_z_zapisu_rowne_sesji_zywej() {
    let st = state_for(&scn_quick());
    let run = |cold: bool| {
        let mut b = bridge_for(st.clone());
        let mut out = Vec::new();
        let d = send(&mut b, start()).expect("start");
        out.push(format!("{:?}", battle(&d)));
        for ms in [100.0, 333.5, 16.0, 2000.0, 777.25] {
            if cold {
                siege_battle_apply::clear_live_session_cache();
            }
            let d = send(&mut b, step(ms)).expect("krok");
            out.push(format!("{:?}", battle(&d)));
            if battle(&d).phase == SiegeBattlePhaseDto::Finished {
                break;
            }
        }
        if cold {
            siege_battle_apply::clear_live_session_cache();
        }
        if b.adapter().state().units.iter().any(|_| true) {
            if let Ok(d) = send(&mut b, EngineCommand::SkipSiegeBattle) {
                out.push(format!("{:?}", battle(&d)));
            }
        }
        if cold {
            siege_battle_apply::clear_live_session_cache();
        }
        let d = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
        out.push(format!("{:?}", battle(&d)));
        (out, state_of(&d).clone())
    };
    let warm = run(false);
    let cold = run(true);
    assert_eq!(warm.0, cold.0, "akcje/ramki/wynik identyczne");
    assert_eq!(warm.1, cold.1, "stan po wyniku identyczny");
}

#[test]
fn ziarno_gry_wchodzi_do_rng_bitwy() {
    let st = state_for(&scn_quick());
    let a = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1).expect("a");
    let mut st2 = st.clone();
    st2.params.seed = st.params.seed + 1;
    let b = siege_battle_apply::prepare_storm(&st2, CITY, ANCHOR, 1).expect("b");
    let c = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 2).expect("c");
    assert_eq!(a.input().battle_index, 1);
    assert_eq!(c.input().battle_index, 2);
    let rolls = |x: &siege_battle_apply::ActiveSiegeBattle| {
        let mut s = x.rebuild().expect("sesja");
        s.skip().expect("skip");
        s.finish().expect("wynik").rolls_drawn
    };
    let fin = |x: &siege_battle_apply::ActiveSiegeBattle| {
        let mut s = x.rebuild().expect("sesja");
        s.skip().expect("skip");
        format!("{:?}", s.finish().expect("wynik").units)
    };
    assert!(rolls(&a) > 0, "bitwa zuzywa rzuty");
    // Seed/numer bitwy zmieniaja strumien: co najmniej jeden z dwoch wariantow daje inny przebieg.
    assert!(
        fin(&a) != fin(&b) || fin(&a) != fin(&c),
        "ziarno gry i numer bitwy wchodza do RNG"
    );
    // Numer bitwy rośnie w grze.
    let mut g = PlayableGame::from_state(st);
    g.start_siege_storm(CITY, ANCHOR).expect("start");
    assert_eq!(g.siege_battle().expect("bitwa").input().battle_index, 1);
    g.skip_siege_battle().expect("skip");
    g.finish_siege_battle().expect("finish");
    assert!(g.siege_battle().is_none());
}

#[test]
fn komendy_poza_faza_to_jawne_bledy_bez_zmiany_stanu() {
    let st0 = state_for(&scn_quick());
    let mut b = bridge_for(st0.clone());
    for cmd in [
        step(16.0),
        EngineCommand::SkipSiegeBattle,
        EngineCommand::FinishSiegeBattle,
    ] {
        let e = send(&mut b, cmd).expect_err("bez bitwy");
        assert_eq!(e.code, BridgeErrorCode::EngineRejected);
        assert!(e.message.contains("no battle in progress"), "{e:?}");
    }
    send(&mut b, start()).expect("start");
    // Drugi szturm, koniec tury, ruch i anulowanie marszu w trakcie bitwy: odrzucone.
    for cmd in [
        start(),
        EngineCommand::AdvanceTurn,
        EngineCommand::MoveUnit {
            unit_id: ANCHOR,
            destination: PositionDto::new(6, 3),
            attack_unit_id: None,
        },
        EngineCommand::CancelPlannedMarch {
            unit_id: ANCHOR,
            force: true,
        },
        // Obrona r1 (U1): stan w trakcie bitwy = migawka startu (scena zaslania mape).
        EngineCommand::SelectUnit { unit_id: ANCHOR },
        EngineCommand::AddPlayer {
            id: 777,
            name: "nowy".into(),
        },
    ] {
        let e = send(&mut b, cmd.clone()).expect_err("bitwa w toku");
        assert_eq!(e.code, BridgeErrorCode::EngineRejected, "{cmd:?}");
        assert!(e.message.contains("in progress"), "{cmd:?}: {e:?}");
    }
    assert_eq!(
        b.adapter().state(),
        &st0,
        "odrzucone komendy nie zmieniaja stanu"
    );
    // Wynik przed koncem bitwy: jawny blad, bitwa trwa dalej.
    let e = send(&mut b, EngineCommand::FinishSiegeBattle).expect_err("bitwa trwa");
    assert!(e.message.contains("NotFinished"), "{e:?}");
    // Niepoprawny czas: blad, operacja nie zapisana (kolejne kroki dzialaja).
    for bad in [-1.0, f64::NAN, f64::INFINITY] {
        let e = send(&mut b, step(bad)).expect_err("zly czas");
        assert!(e.message.contains("InvalidData"), "{e:?}");
    }
    send(&mut b, step(16.0)).expect("krok po bledzie");
    send(&mut b, EngineCommand::SkipSiegeBattle).expect("pomin");
    // Po koncu bitwy: krok i pominiecie = AlreadyFinished; stan wciaz bez zmian do FinishSiegeBattle.
    for cmd in [step(16.0), EngineCommand::SkipSiegeBattle] {
        let e = send(&mut b, cmd).expect_err("po koncu");
        assert!(e.message.contains("AlreadyFinished"), "{e:?}");
    }
    assert_eq!(b.adapter().state(), &st0);
    send(&mut b, EngineCommand::FinishSiegeBattle).expect("wynik");
    // CreateSession w trakcie/po bitwie = nowa gra bez bitwy.
    send(&mut b, start()).expect_err("miasto zniknelo albo brak kotwicy po wyniku");
}

#[test]
fn create_session_porzuca_trwajaca_bitwe() {
    let mut b = bridge_for(state_for(&scn_quick()));
    send(&mut b, start()).expect("start");
    send(
        &mut b,
        EngineCommand::CreateSession {
            params: StartGameParams::default(),
        },
    )
    .expect("nowa gra");
    let e = send(&mut b, step(16.0)).expect_err("nowa gra bez bitwy");
    assert!(e.message.contains("no battle in progress"));
    send(&mut b, EngineCommand::AdvanceTurn).expect("tura dziala");
}

#[test]
fn bramki_startu_wg_launch_siege_storm() {
    let st = state_for(&scn_quick());
    let err = |st: &PlayableState, city, unit| {
        siege_battle_apply::prepare_storm(st, city, unit, 1).expect_err("odrzucone")
    };
    assert_eq!(err(&st, 4242, ANCHOR), SiegeBattleError::CityNotFound(4242));
    assert_eq!(err(&st, CITY, 4242), SiegeBattleError::UnitNotFound(4242));
    // Miasto oblegane: szturm z panelu oblezenia wydaje pierwsza jednostka obca w odleglosci 1 (`siege_panel`).
    assert_eq!(
        err(&st, CITY, 8001),
        SiegeBattleError::NotSiegeAnchor {
            unit_id: 8001,
            besieger_id: ANCHOR
        }
    );
    assert_eq!(
        err(&st, CITY, 7002),
        SiegeBattleError::NotSiegeAnchor {
            unit_id: 7002,
            besieger_id: ANCHOR
        }
    );
    // Pierwszy oblegajacy to AI (trzecia strona): szturm tylko oblegajacy gracz (`ctx.oblegajacyOwnerId !== 0`).
    let mut ai_first = st.clone();
    let mut ai_unit = ai_first.units[0].clone();
    ai_unit.id = UnitId::new(6001);
    ai_unit.owner_id = PlayerId::new(ALLY);
    ai_first.units.insert(0, ai_unit);
    assert_eq!(
        err(&ai_first, CITY, 6001),
        SiegeBattleError::NotHumanBesieger { unit_id: 6001 }
    );
    // Miasto bez muru: `Miasto bez muru — uzyj zwyklej potyczki`.
    let mut no_wall = st.clone();
    no_wall.stores.buildings_by_city.insert(CITY, vec![]);
    assert!(matches!(
        err(&no_wall, CITY, ANCHOR),
        SiegeBattleError::Adapter(_)
    ));
    // Bez obroncow: bez machin = mur nienaruszony; z machinami = zdobycie bez bitwy (hak T8).
    let mut empty = st.clone();
    empty.units.retain(|u| u.owner_id.get() != ENEMY);
    assert_eq!(
        err(&empty, CITY, ANCHOR),
        SiegeBattleError::NoDefendersCaptureRequested { city_id: CITY }
    );
    empty.siege_machines_ready.clear();
    assert_eq!(
        err(&empty, CITY, ANCHOR),
        SiegeBattleError::NoDefendersWallIntact { city_id: CITY }
    );
    // Przez most: blad bez zmiany stanu.
    let mut b = bridge_for(empty.clone());
    let e = send(&mut b, start()).expect_err("mur nienaruszony");
    assert_eq!(e.code, BridgeErrorCode::EngineRejected);
    assert_eq!(b.adapter().state(), &empty);
}

#[test]
fn sojusz_z_umowy_d_adp_11() {
    let mut st = state_for(&scn_quick());
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ALLY),
        name: "sojusznik".into(),
        civilization: "grecy".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(ALLY), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    add_unit(
        &mut st,
        7600,
        ALLY,
        (CITY_POS.0, CITY_POS.1 + 1),
        "Wojownik",
    );
    let ally_in_scene = |st: &PlayableState| {
        let a = siege_battle_apply::prepare_storm(st, CITY, ANCHOR, 1).expect("start");
        let s = a.rebuild().expect("sesja");
        s.roster_ids()[0].iter().any(|id| id == "7600")
    };
    // Sam status relacji `Alliance` (bez umowy) nie czyni sojusznika w pinie.
    let mut status_only = st.clone();
    status_only.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ALLY)),
        Relation::new(50.0, 50.0, RelationStatus::Alliance),
    );
    assert!(!ally_in_scene(&status_only), "status bez umowy != sojusz");
    // Umowa sojusznicza zawarta w tej samej turze (bez synchronizacji statusu) = sojusz.
    let mut with_deal = st.clone();
    with_deal.war.diplomacy.deals.push(ActiveDeal::new(
        TreatyKind::FullAlliance,
        PlayerId::new(HUMAN),
        PlayerId::new(ALLY),
        with_deal.turn,
        None,
    ));
    assert_eq!(
        siege_battle_apply::alliance_pairs_from_deals(&with_deal)
            .into_iter()
            .collect::<Vec<_>>(),
        vec![(1, 102)]
    );
    assert!(
        ally_in_scene(&with_deal),
        "umowa sojusznicza dolacza sojusznika"
    );
    // Pakt nieagresji to nie sojusz.
    let mut nap = st;
    nap.war.diplomacy.deals.push(ActiveDeal::new(
        TreatyKind::Nap,
        PlayerId::new(HUMAN),
        PlayerId::new(ALLY),
        nap.turn,
        None,
    ));
    assert!(siege_battle_apply::alliance_pairs_from_deals(&nap).is_empty());
}

#[test]
fn odpowiedz_bitwy_json_i_kontrakt_addytywny() {
    let mut b = bridge_for(state_for(&scn_quick()));
    let d = send(&mut b, start()).expect("start");
    let v = serde_json::to_value(&d.response).expect("json");
    assert_eq!(v["result"]["kind"], "state");
    assert_eq!(v["siegeBattle"]["cityId"], CITY);
    assert_eq!(v["siegeBattle"]["phase"], "running");
    assert!(v["siegeBattle"]["units"]
        .as_array()
        .is_some_and(|a| !a.is_empty()));
    assert!(v["siegeBattle"]["frame"]["vNow"].is_number());
    assert!(v["siegeBattle"].get("result").is_none());
    // Odczyt pola `siegeBattle` (całej odpowiedzi nie: `BridgeResult` jest wewnętrznie tagowany, a serde nie czyta
    // kluczy `u64` mapy `economy.units` z bufora treści — istniejące ograniczenie mostu, nie tego tematu).
    let back: SiegeBattlePayload =
        serde_json::from_value(v["siegeBattle"].clone()).expect("round trip");
    assert_eq!(Some(&back), d.response.siege_battle.as_ref());
    send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip");
    let d = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    let v = serde_json::to_value(&d.response).expect("json");
    assert_eq!(v["siegeBattle"]["phase"], "applied");
    assert!(v["siegeBattle"].get("frame").is_none());
    assert!(v["siegeBattle"]["result"]["winner"].is_string());
    let back: SiegeBattlePayload =
        serde_json::from_value(v["siegeBattle"].clone()).expect("round trip");
    assert_eq!(Some(&back), d.response.siege_battle.as_ref());
}

/// Obrona r1 (Z1): strumień odpowiedzi mostu przyjmuje konsument `playback.rs` (start, kroki 16 ms i nieregularne,
/// `Skip`, `Finish`); żadna akcja nie ginie (suma akcji = akcje sesji wywołanej bezpośrednio).
#[test]
fn strumien_przyjmuje_konsument_playback() {
    let st = state_for(&scn_quick());
    // Kroki 16 ms i nieregularne: `run_realtime` sprawdza kontrakt konsumenta w każdej odpowiedzi (z `Finish`).
    let (_, acts16, _) = run_realtime(st.clone(), &[16.0]);
    let (_, acts_mix, _) = run_realtime(st.clone(), &[7.5, 40.25, 1000.0, 3.0, 250.0]);
    assert_eq!(acts16, acts_mix);
    // Akcje sesji bez mostu (te same wywołania: start + kroki 16 ms do końca).
    let a = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1).expect("bitwa");
    let data = siege_battle_apply::session_data().expect("dane");
    let mut s =
        civ_engine::domain::siege_battle_session::SiegeBattleSession::start(&st, a.input(), data)
            .expect("sesja");
    let mut direct = s.battle_loop_mut().take_actions().len();
    while s.phase() != civ_engine::domain::siege_battle_session::SessionPhase::Finished {
        direct += s.step(16.0).expect("krok").actions.len();
    }
    assert_eq!(acts16.len(), direct, "wstrzymanie akcji nie gubi akcji");
    // Start -> krok -> Skip -> Finish (pomiar Evaluatora: ramka startu vNow 0 przy akcji t0 930).
    let mut b = bridge_for(st);
    let mut order = PlaybackOrder::new();
    for (k, cmd) in [
        start(),
        step(16.0),
        EngineCommand::SkipSiegeBattle,
        EngineCommand::FinishSiegeBattle,
    ]
    .into_iter()
    .enumerate()
    {
        let d = send(&mut b, cmd).expect("komenda");
        let p = battle(&d);
        if let Some(f) = &p.frame {
            assert!(
                p.actions.iter().all(|x| x.t0 <= f.v_now),
                "akcja z przyszlym t0 oddana przed ramka"
            );
        }
        order.feed(k, p);
    }
    assert!(order.bad.is_empty(), "{:?}", order.bad);
}

/// Obrona r1 (Z2): bramki wejścia pinu — miasto gracza, odległość, wojna, cywil, punkt ruchu (ścieżka `attack_choice`).
#[test]
fn bramki_wejscia_szturmu_wg_pinu() {
    let st = state_for(&scn_quick());
    let err = |st: &PlayableState, unit| {
        siege_battle_apply::prepare_storm(st, CITY, unit, 1).expect_err("odrzucone")
    };
    // Pokój: web pyta o wypowiedzenie wojny (`withPlayerWarConsent`); most nie wypowiada wojny w tej komendzie.
    let mut peace = st.clone();
    peace.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::Peace),
    );
    assert_eq!(
        err(&peace, ANCHOR),
        SiegeBattleError::NotAtWar { city_id: CITY }
    );
    let mut empty_peace = peace.clone();
    empty_peace.units.retain(|u| u.owner_id.get() != ENEMY);
    assert_eq!(
        err(&empty_peace, ANCHOR),
        SiegeBattleError::NotAtWar { city_id: CITY },
        "pokoj nie daje haka zdobycia bez bitwy"
    );
    // Kotwica w odległości 3 (pomiar Evaluatora: bitwa startowala).
    let mut far = st.clone();
    for u in &mut far.units {
        if u.owner_id.get() == HUMAN {
            u.position = PositionDto::new(CITY_POS.0 + 3, CITY_POS.1);
        }
    }
    assert_eq!(
        err(&far, ANCHOR),
        SiegeBattleError::NotAdjacent {
            unit_id: ANCHOR,
            city_id: CITY
        }
    );
    // Miasto gracza (`not_enemy`).
    let mut own = st.clone();
    own.cities
        .iter_mut()
        .find(|c| c.id.get() == CITY)
        .unwrap()
        .owner_id = PlayerId::new(HUMAN);
    assert_eq!(
        err(&own, ANCHOR),
        SiegeBattleError::NotEnemyCity { city_id: CITY }
    );
    // Bez oblężenia (`attack_choice`): cywil i jednostka bez ruchu nie atakują.
    let mut open = st.clone();
    open.oblegane.clear();
    siege_battle_apply::prepare_storm(&open, CITY, ANCHOR, 1).expect("attack_choice");
    let mut civ = open.clone();
    civ.economy.units.get_mut(&ANCHOR).unwrap().type_id = Some("Osadnik".into());
    assert_eq!(
        err(&civ, ANCHOR),
        SiegeBattleError::AnchorCannotAttack {
            unit_id: ANCHOR,
            reason: "cywil"
        }
    );
    let mut tired = open.clone();
    tired.units[0].movement = 0u8.into();
    assert_eq!(
        err(&tired, ANCHOR),
        SiegeBattleError::AnchorCannotAttack {
            unit_id: ANCHOR,
            reason: "ruchLeft = 0"
        }
    );
    // Panel oblężenia (`siege_panel`): bez wymogu ruchu (pin nie filtruje `ruchLeft` na tej ścieżce).
    let mut tired_siege = st.clone();
    tired_siege.units[0].movement = 0u8.into();
    siege_battle_apply::prepare_storm(&tired_siege, CITY, ANCHOR, 1).expect("siege_panel");
    // Przez most: błąd bez zmiany stanu.
    let mut b = bridge_for(far.clone());
    let e = send(&mut b, start()).expect_err("daleko");
    assert_eq!(e.code, BridgeErrorCode::EngineRejected);
    assert_eq!(b.adapter().state(), &far);
}

/// Obrona r1 (Z3): dwa klony gry z tą samą bitwą i rozbieżnymi krokami (test Evaluatora `eval_klony_pamiec_podreczna`).
#[test]
fn klony_gry_nie_dziela_sesji_z_pamieci_podrecznej() {
    let st = state_for(&scn_quick());
    let mut g = PlayableGame::from_state(st);
    g.start_siege_storm(CITY, ANCHOR).expect("start");
    let mut a = g.clone();
    let mut bb = g.clone();
    let mut reference = g.clone();
    a.step_siege_battle(500.0).expect("a1");
    bb.step_siege_battle(3000.0).expect("b1");
    let pa = a.step_siege_battle(16.0).expect("a2");
    siege_battle_apply::clear_live_session_cache();
    reference.step_siege_battle(500.0).expect("r1");
    siege_battle_apply::clear_live_session_cache();
    let pr = reference.step_siege_battle(16.0).expect("r2");
    assert_eq!(
        format!("{pa:?}"),
        format!("{pr:?}"),
        "klon a uzyl sesji klona b z pamieci podrecznej"
    );
}

/// Obrona r1 (Z5, E03): numer bitwy D-WIR-5 rośnie w grze (druga bitwa = 2).
#[test]
fn druga_bitwa_w_grze_ma_numer_2() {
    const CITY2: u64 = 901;
    let mut st = state_for(&scn_quick());
    let c2 = (1u16, 1u16);
    st.cities.push(PlayableCity {
        id: CityId::new(CITY2),
        owner_id: PlayerId::new(ENEMY),
        name: "Druga".into(),
        position: PositionDto::new(c2.0, c2.1),
        is_capital: false,
        population: 3,
        culture: 0,
    });
    st.stores
        .buildings_by_city
        .insert(CITY2, vec!["palisada".to_owned()]);
    st.oblegane.insert(CityId::new(CITY2));
    for i in 0..6 {
        add_unit(&mut st, 7101 + i, HUMAN, (c2.0 + 1, c2.1), "Wojownik");
    }
    add_unit(&mut st, 8101, ENEMY, c2, "Wojownik");
    let mut g = PlayableGame::from_state(st);
    g.start_siege_storm(CITY, ANCHOR).expect("start 1");
    assert_eq!(g.siege_battle().expect("bitwa").input().battle_index, 1);
    g.skip_siege_battle().expect("skip");
    g.finish_siege_battle().expect("finish 1");
    // Kotwica panelu oblężenia = pierwsza obca jednostka w odległości 1 (po fan-out pierwszej bitwy może to być inna).
    let anchor2 = g
        .state()
        .units
        .iter()
        .find(|u| {
            u.owner_id.get() != ENEMY && {
                let (dq, dr) = (
                    i32::from(u.position.x()) - i32::from(c2.0),
                    i32::from(u.position.y()) - i32::from(c2.1),
                );
                (dq.abs() + dr.abs() + (dq + dr).abs()) / 2 == 1
            }
        })
        .expect("oblegajacy")
        .id
        .get();
    g.start_siege_storm(CITY2, anchor2).expect("start 2");
    assert_eq!(g.siege_battle().expect("bitwa").input().battle_index, 2);
}

/// Obrona r1 (Z4): producent wejścia sesji (D-WIRB-4) — trudność AI, las jako nakładka, `defCiv`, epoki właściciela
/// miasta (milicja) i obrońcy (`defRosterRef[0].ownerId`).
#[test]
fn producent_wejscia_sesji_wg_pinu() {
    use civ_engine::domain::turn_war_epoch::{EpochSource, OwnerEraFacts};
    let st = state_for(&scn_quick());
    let input = |s: &PlayableState| {
        siege_battle_apply::prepare_storm(s, CITY, ANCHOR, 1)
            .expect("bitwa")
            .input()
            .clone()
    };
    // E07: `difficultyCombatMultForOwner` = `1 + bonusWalka` poziomu dla AI, 1 dla gracza (`main.ts:9523-9527`).
    let ai = civ_engine::data::economy_society_part2::parse_ai_params().expect("ai-params");
    let lv1 = ai.trudnosc_poziom1_bonus_walka.wartosc;
    let lv3 = ai.trudnosc_poziom3_bonus_walka.wartosc;
    assert!(
        lv1 != 0.0 && lv3 != 0.0,
        "dane trudnosci rozrozniaja poziomy"
    );
    for (lvl, bonus) in [("Łatwy", lv1), ("Trudny", lv3)] {
        let mut s = st.clone();
        s.params.difficulty = lvl.into();
        let i = input(&s);
        assert_eq!(i.owners[&101].difficulty_combat_mult, 1.0 + bonus, "{lvl}");
        assert_eq!(i.owners[&1].difficulty_combat_mult, 1.0, "{lvl}: gracz");
    }
    // E08: las = nakładka na równinie (`worldTerrainFromHex`, `main.ts:1934-1943`).
    let mut forest = st.clone();
    let pos = PositionDto::new(CITY_POS.0, CITY_POS.1);
    forest
        .map
        .tiles
        .iter_mut()
        .find(|t| t.position == pos)
        .expect("heks miasta")
        .terrain = PlayableTerrain::Forest;
    let w = input(&forest).world_terrain.expect("teren");
    assert_eq!((w.baza.as_str(), w.las, w.rzeka), ("rownina", true, false));
    let w = input(&st).world_terrain.expect("teren");
    assert_eq!((w.baza.as_str(), w.las), ("rownina", false));
    // E18: `defCiv` = `ikonaIdToBronzeCiv(civ właściciela miasta)` (`main.ts:36861-36863`, `:36989`).
    assert_eq!(input(&st).def_civ.as_deref(), Some("rzym"));
    let mut chiny = st.clone();
    chiny
        .players
        .iter_mut()
        .find(|p| p.id.get() == ENEMY)
        .unwrap()
        .civilization = "chinczycy".into();
    assert_eq!(input(&chiny).def_civ.as_deref(), Some("chiny"));
    // E15/E17: epoki z jawnych faktów (`PlayableState` nie niesie epoki per właściciel; `owner_era_facts`).
    let facts = OwnerEraFacts {
        human_ids: [1].into_iter().collect(),
        human_era: [(1, (1.0, EpochSource::Tracked))].into_iter().collect(),
        owner_era_by_owner: [(101, 3.0), (102, 4.0)].into_iter().collect(),
    };
    let i = siege_battle_apply::prepare_storm_with_eras(&st, CITY, ANCHOR, 1, &facts, 1.0)
        .expect("bitwa")
        .input()
        .clone();
    assert_eq!(i.owner_era, Some(3.0), "milicja: epoka wlasciciela miasta");
    assert_eq!(i.defender_era, Some(3.0), "obronca 8001 (wlasciciel 101)");
    // Obrońca pierwszy w rosterze należy do sojusznika (miasto bez własnych jednostek, sojusz z umowy D-ADP-11).
    let mut ally = st.clone();
    ally.players.push(PlayablePlayer {
        id: PlayerId::new(ALLY),
        name: "sojusznik".into(),
        civilization: "grecy".into(),
        is_human: false,
    });
    ally.units.retain(|u| u.owner_id.get() != ENEMY);
    add_unit(&mut ally, 8501, ALLY, CITY_POS, "Wojownik");
    ally.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ALLY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    ally.war.diplomacy.deals.push(ActiveDeal::new(
        TreatyKind::FullAlliance,
        PlayerId::new(ENEMY),
        PlayerId::new(ALLY),
        ally.turn,
        None,
    ));
    // E17: `defRosterRef[0]` należy zawsze do właściciela miasta — sam sojusznik nie broni miasta (adapter T6 =
    // `cityHasDefenders`/`collectSiegeDefRoster`, kolejność `owner_first`), więc `defenderEra` = epoka właściciela miasta
    // w każdym stanie osiągalnym; mutant E17 jest równoważny (obrona r1, dowód w 02a-obrona.md).
    assert_eq!(
        siege_battle_apply::prepare_storm_with_eras(&ally, CITY, ANCHOR, 1, &facts, 1.0)
            .expect_err("sam sojusznik nie broni"),
        SiegeBattleError::NoDefendersCaptureRequested { city_id: CITY }
    );
}

#[test]
fn zz_pomiar_finish_pending() {
    for seed in 1..=12u32 {
        for skip in [false, true] {
            let mut s = scn_quick();
            s.seed = seed;
            let mut b = bridge_for(state_for(&s));
            send(&mut b, start()).expect("start");
            if skip {
                send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip");
            } else {
                loop {
                    let d = send(&mut b, step(16.0)).expect("step");
                    if battle(&d).phase == SiegeBattlePhaseDto::Finished {
                        break;
                    }
                }
            }
            let f = send(&mut b, EngineCommand::FinishSiegeBattle).expect("fin");
            eprintln!("POMIAR seed {seed} skip {skip}: finish actions {}", battle(&f).actions.len());
        }
    }
}
