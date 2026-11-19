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

/// Bitwa przez most w czasie rzeczywistym kawałkami `chunks` (cyklicznie) do końca + `FinishSiegeBattle`.
fn run_realtime(
    st: PlayableState,
    chunks: &[f64],
) -> (PlayableState, Vec<(f64, String)>, BridgeDispatch) {
    let mut b = bridge_for(st);
    let d = send(&mut b, start()).expect("start");
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
        // Każda odpowiedź: `t0` niemalejące (D-WIRB-6).
        assert!(p.actions.windows(2).all(|w| w[0].t0 <= w[1].t0));
        acts.extend(p.actions.iter().map(|a| (a.t0, format!("{a:?}"))));
        if battle(&d).phase == SiegeBattlePhaseDto::Finished {
            break;
        }
        assert!(k < 200_000, "bitwa bez konca");
    }
    let fin = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
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
    // Kotwica wroga: szturm tylko oblegajacy gracz (`ctx.oblegajacyOwnerId !== 0`).
    assert_eq!(
        err(&st, CITY, 8001),
        SiegeBattleError::NotHumanBesieger { unit_id: 8001 }
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
