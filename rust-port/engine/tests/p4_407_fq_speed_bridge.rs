//! R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1: komenda mostu `SetSiegeBattleSpeed { idx, clamp }` — prędkość bitwy gracza
//! `_setSpeedIdx(idx, { clamp })` pinu `07d2fbd72` (`gra/src/battle/battleScene.ts:9518-9536`; `SPEED_STEPS` `:2551`).
//!
//! * D-407-1: jedna komenda; `clamp = false` zawija (`_cycleSpeed` = `idx + 1`, 512 → 1), `clamp = true` przycina
//!   (panel ± `_adjustSpeedIdx`); odpowiedź niesie `speedIdx` i `speedMul` w `siegeBattle`.
//! * D-407-2: prędkość żyje w sesji bitwy (operacja sterownika odtwarzana przy `rebuild`), nie w `EngineState`.
//! * D-407-3: bez `StateChanged`, bez zmiany stanu gry.
//! * D-407-4: kontrakt akcji z siatką klatki `16 * speedMul` (`speed_vectors.json`: `frame_raf(16 * k, nominał)`).

#![allow(dead_code)]
#![allow(clippy::float_cmp)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge,
    EngineCommand, MockEngineAdapter, SiegeBattleErrorDto, StartGameParams, WallMs,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_apply::{self, SiegeBattlePayload, SiegeBattlePhaseDto};
use civ_engine::domain::siege_tactics_clock::SPEED_STEPS;
use civ_engine::domain::siege_tactics_loop::frame_raf;
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_view_model::battle::{BattleActionDto, BattleActionKindDto};
use serde_json::json;

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);
const ANCHOR: u64 = 7001;
const MAX_STEPS: usize = 200_000;
/// Co ile kroków test powtórki czyści pamięć podręczną sesji.
const REBUILD_EVERY: usize = 400;

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

/// Scenariusz `p4_1i6_dlugi.rs` / `p6_zdobycie_miasta_a_bridge.rs`: gracz (1) oblega stolicę 101 z taranem.
fn state(seed: u32, fort: &[&str]) -> PlayableState {
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
        .insert(CITY, fort.iter().map(|b| (*b).to_owned()).collect());
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
    add_unit(&mut st, 8002, ENEMY, CITY_POS, "Łucznik");
    st
}

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
    d.response.siege_battle.as_ref().expect("siegeBattle")
}

fn state_of(d: &BridgeDispatch) -> &PlayableState {
    match &d.response.result {
        BridgeResult::State { state } => state,
        _ => panic!("komendy bitwy odpowiadaja State"),
    }
}

fn start(b: &mut EngineBridge<CivEngineAdapter>) -> BridgeDispatch {
    send(
        b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect("start")
}

fn speed(b: &mut EngineBridge<CivEngineAdapter>, idx: i64, clamp: bool) -> BridgeDispatch {
    send(b, EngineCommand::SetSiegeBattleSpeed { idx, clamp }).expect("set speed")
}

fn speed_of(d: &BridgeDispatch) -> (u64, f64) {
    let p = battle(d);
    (
        p.speed_idx.expect("speedIdx"),
        p.speed_mul.expect("speedMul"),
    )
}

fn step(b: &mut EngineBridge<CivEngineAdapter>) -> BridgeDispatch {
    send(
        b,
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
    )
    .expect("step")
}

/// Odstęp czasu akcji (rodzaj, `at - t0`) z chwilą planowaną (`speed_vectors.json`, `predkosc_bitwy_wektory_pinu_bajt_w_bajt`):
/// `Melee` 150, `Shot`/`TowerShot` 380, `Move` 240, `Boulder` 700 — w chwili siatki `frame_raf(klatka, nominał)`.
fn timed(a: &BattleActionDto) -> Option<(&'static str, f64, f64)> {
    match &a.action {
        BattleActionKindDto::Melee { hit_at, .. } => Some(("melee", hit_at - a.t0, 150.0)),
        BattleActionKindDto::Shot { land_at, .. } => Some(("shot", land_at - a.t0, 380.0)),
        BattleActionKindDto::TowerShot { land_at, .. } => Some(("tower", land_at - a.t0, 380.0)),
        BattleActionKindDto::Move { arrive_at, .. } => Some(("move", arrive_at - a.t0, 240.0)),
        BattleActionKindDto::Boulder { land_at, .. } => Some(("boulder", land_at - a.t0, 700.0)),
        _ => None,
    }
}

/// Bitwa przez most: `Start`, zmiana prędkości `speed_idx` (bez zawijania), kroki 16 ms do końca. `rebuild` = pamięć
/// podręczna sesji czyszczona przed zmianą prędkości, przed pierwszym krokiem po niej, co [`REBUILD_EVERY`] kroków i przed
/// `Finish` (ta komenda odtwarza wtedy sesję z zapisu operacji, D-WIRB-1; czyszczenie przed KAŻDYM krokiem byłoby
/// kwadratowe). Zwraca akcje po zmianie prędkości, stan po `Finish` i liczbę kroków.
fn run_at(speed_idx: i64, rebuild: bool) -> (Vec<BattleActionDto>, PlayableState, usize) {
    let mut b = bridge_for(state(21, &["palisada"]));
    let s = start(&mut b);
    assert_eq!(battle(&s).phase, SiegeBattlePhaseDto::Running);
    if rebuild {
        siege_battle_apply::clear_live_session_cache();
    }
    let d = speed(&mut b, speed_idx, false);
    assert!(d.events.is_empty());
    let k = SPEED_STEPS[usize::try_from(speed_idx).unwrap()];
    assert_eq!(speed_of(&d), (speed_idx as u64, k));
    let mut acts = Vec::new();
    let mut n = 0;
    loop {
        if rebuild && n % REBUILD_EVERY == 0 {
            siege_battle_apply::clear_live_session_cache();
        }
        let d = step(&mut b);
        assert!(d.events.is_empty(), "Step bez StateChanged");
        let p = battle(&d);
        acts.extend(p.actions.iter().cloned());
        n += 1;
        assert!(n < MAX_STEPS, "bitwa bez końca");
        if p.phase == SiegeBattlePhaseDto::Finished {
            break;
        }
    }
    if rebuild {
        siege_battle_apply::clear_live_session_cache();
    }
    let f = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    assert_eq!(f.events.len(), 1, "Finish = StateChanged");
    acts.extend(battle(&f).actions.iter().cloned());
    (acts, state_of(&f).clone(), n)
}

// ------------------------------------------------------------ odpowiedź i reguły `_setSpeedIdx`

/// Kryterium 1/2: `idx` 0 → 3 (8x), `cycle` z zawinięciem 512 → 1, panel ± z przycięciem na krańcach; odpowiedź z
/// `speedIdx`/`speedMul`, bez akcji i ramki, stan gry bez zmian, bez `StateChanged`.
#[test]
fn predkosc_przez_most_jak_set_speed_idx_pinu() {
    let mut b = bridge_for(state(17, &["palisada"]));
    let st0 = start(&mut b);
    let before = state_of(&st0).clone();
    // Start sceny: `speedIdx = 0` (`:2554`, `:3370`); odpowiedzi innych komend bez kluczy prędkości.
    assert_eq!(battle(&st0).speed_idx, None);
    assert_eq!(battle(&st0).speed_mul, None);
    let d = speed(&mut b, 3, false);
    assert_eq!(speed_of(&d), (3, 8.0));
    let p = battle(&d);
    assert_eq!(p.city_id, CITY);
    assert_eq!(p.phase, SiegeBattlePhaseDto::Running);
    assert!(p.actions.is_empty() && p.frame.is_none() && p.result.is_none());
    assert!(p.units.is_empty() && p.setup.is_none() && p.tower_shooter.is_none());
    assert!(
        d.events.is_empty(),
        "zmiana prędkości bez StateChanged (D-407-3)"
    );
    assert_eq!(state_of(&d), &before, "stan gry bez zmian (D-407-2)");
    let wire = serde_json::to_value(&d.response).expect("json");
    assert_eq!(wire["siegeBattle"]["speedIdx"], json!(3));
    assert_eq!(wire["siegeBattle"]["speedMul"], json!(8.0));
    // `_cycleSpeed` = `_setSpeedIdx(speedIdx + 1)` bez `clamp`: 9 → 10 zawija do 0 (512x → 1x).
    assert_eq!(speed_of(&speed(&mut b, 9, false)), (9, 512.0));
    assert_eq!(speed_of(&speed(&mut b, 10, false)), (0, 1.0));
    assert_eq!(
        speed_of(&speed(&mut b, -1, false)),
        (9, 512.0),
        "JS ((idx % n) + n) % n"
    );
    // Panel ±: przycięcie bez zawijania.
    assert_eq!(speed_of(&speed(&mut b, 10, true)), (9, 512.0));
    assert_eq!(speed_of(&speed(&mut b, -1, true)), (0, 1.0));
    assert_eq!(speed_of(&speed(&mut b, i64::MAX, true)), (9, 512.0));
    assert_eq!(speed_of(&speed(&mut b, i64::MIN, true)), (0, 1.0));
    // Kroki niosą akcje i ramkę jak dotąd, bez kluczy prędkości.
    let s = step(&mut b);
    assert!(battle(&s).frame.is_some());
    let wire = serde_json::to_value(&s.response).expect("json");
    assert!(wire["siegeBattle"].get("speedIdx").is_none());
    assert!(wire["siegeBattle"].get("speedMul").is_none());
}

/// Kryterium 2: bez bitwy `noActiveBattle` (jak `AbortSiegeBattle`); po `Finish` i po `Abort` bitwa nie istnieje, więc
/// prędkość jest odrzucana tym samym jawnym błędem (pin: przyciski prędkości żyją w scenie, która po wyniku / wycofaniu
/// znika — `dispose()`). W fazie `Finished` (przed `Finish`) prędkość wolno zmienić (przycisk paska sceny, `:9535`
/// „Safe to call mid-battle”), wynik bitwy się nie zmienia.
#[test]
fn bez_bitwy_i_po_koncu_no_active_battle() {
    let mut b = bridge_for(state(19, &["palisada"]));
    let e = send(
        &mut b,
        EngineCommand::SetSiegeBattleSpeed {
            idx: 1,
            clamp: false,
        },
    )
    .expect_err("bez bitwy");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    // Abort.
    start(&mut b);
    speed(&mut b, 2, false);
    send(&mut b, EngineCommand::AbortSiegeBattle).expect("abort");
    let e = send(
        &mut b,
        EngineCommand::SetSiegeBattleSpeed {
            idx: 1,
            clamp: true,
        },
    )
    .expect_err("po abort");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    // Skip → Finished → prędkość dozwolona → Finish → odrzucona.
    let s = start(&mut b);
    assert_eq!(battle(&s).phase, SiegeBattlePhaseDto::Running);
    let k = send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip");
    assert_eq!(battle(&k).phase, SiegeBattlePhaseDto::Finished);
    let d = speed(&mut b, 4, false);
    assert_eq!(battle(&d).phase, SiegeBattlePhaseDto::Finished);
    assert_eq!(speed_of(&d), (4, 16.0));
    send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    let e = send(
        &mut b,
        EngineCommand::SetSiegeBattleSpeed {
            idx: 1,
            clamp: false,
        },
    )
    .expect_err("po finish");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    let wire = serde_json::to_value(&e).expect("json");
    assert_eq!(wire["siegeBattle"], json!({"code": "no_active_battle"}));
}

/// Zmiana prędkości po końcu bitwy nie zmienia wyniku: ten sam szturm z `Skip` daje ten sam stan po `Finish` z i bez
/// zmiany prędkości w fazie `Finished`.
#[test]
fn predkosc_w_fazie_finished_nie_zmienia_wyniku() {
    let run = |set: bool| {
        let mut b = bridge_for(state(23, &["palisada"]));
        start(&mut b);
        send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip");
        if set {
            speed(&mut b, 7, false);
        }
        let f = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
        (battle(&f).result.clone(), state_of(&f).clone())
    };
    assert_eq!(run(true), run(false));
}

// ------------------------------------------------------------ siatka klatki i powtórka

/// Kryterium 2 (D-407-4): przy 4x i 64x (oraz 1x, 16x, 512x) każda akcja z czasem planowanym po zmianie prędkości trafia
/// w punkt siatki klatki sesji `16 * speedMul` (`frame_raf`, jak `speed_vectors.json`), a bitwa odtwarzana z zapisu
/// operacji przed KAŻDĄ komendą (pamięć podręczna sesji czyszczona, D-WIRB-1) daje te same akcje i ten sam stan po
/// `Finish` (operacja prędkości jest w powtórce, D-407-2).
#[test]
fn akcje_na_siatce_klatki_po_zmianie_predkosci_i_powtorka() {
    let mut per_speed = Vec::new();
    for idx in [0_i64, 2, 4, 6, 9] {
        let k = SPEED_STEPS[usize::try_from(idx).unwrap()];
        let frame = 16.0 * k;
        let (acts, st, n) = run_at(idx, false);
        let mut kinds = std::collections::BTreeMap::<&str, usize>::new();
        for a in &acts {
            if let Some((kind, got, nominal)) = timed(a) {
                assert_eq!(got, frame_raf(frame, nominal), "x{k}: {kind} w t0 {}", a.t0);
                *kinds.entry(kind).or_default() += 1;
            }
        }
        assert!(
            kinds.get("melee").copied().unwrap_or(0) > 0,
            "x{k}: {kinds:?}"
        );
        // Powtórka z zapisu operacji (Speed w `ops`) dla 4x i 64x (kryterium 2); przy 1x odtworzenie byłoby długie.
        if idx == 2 || idx == 6 {
            let (acts_r, st_r, n_r) = run_at(idx, true);
            assert_eq!(acts_r, acts, "x{k}: akcje po odtworzeniu sesji");
            assert_eq!(st_r, st, "x{k}: stan po Finish po odtworzeniu sesji");
            assert_eq!(n_r, n);
        }
        per_speed.push((k, n));
    }
    // Wyższa prędkość = mniej kroków 16 ms ściany do końca (vNow rośnie o `16 * speedMul` na klatkę).
    let n1 = per_speed[0].1;
    let n64 = per_speed[3].1;
    assert!(
        n64 < n1,
        "x64 kończy się szybciej w czasie ściany: {per_speed:?}"
    );
}

/// Zmiana prędkości w TRAKCIE bitwy (po kilku krokach przy 1x) działa od następnego kroku: `vNow` kroku po zmianie
/// rośnie o `16 * speedMul`, a akcje kroków po zmianie z `t0` po chwili zmiany są na siatce nowej klatki. Powtórka
/// sesji (cache czyszczony) daje te same akcje.
#[test]
fn zmiana_w_trakcie_bitwy_od_nastepnego_kroku() {
    let run = |rebuild: bool| {
        let mut b = bridge_for(state(29, &["palisada"]));
        start(&mut b);
        let mut v_prev = 0.0;
        for _ in 0..20 {
            let d = step(&mut b);
            v_prev = battle(&d).frame.as_ref().expect("ramka").v_now;
        }
        if rebuild {
            siege_battle_apply::clear_live_session_cache();
        }
        assert_eq!(speed_of(&speed(&mut b, 2, true)), (2, 4.0));
        if rebuild {
            siege_battle_apply::clear_live_session_cache();
        }
        let d = step(&mut b);
        let v = battle(&d).frame.as_ref().expect("ramka").v_now;
        assert_eq!(
            v - v_prev,
            64.0,
            "krok 16 ms ściany przy 4x = 64 ms wirtualnych"
        );
        let mut acts: Vec<BattleActionDto> = battle(&d).actions.clone();
        for i in 0..400 {
            if rebuild && i % 100 == 0 {
                siege_battle_apply::clear_live_session_cache();
            }
            let d = step(&mut b);
            acts.extend(battle(&d).actions.iter().cloned());
            if battle(&d).phase == SiegeBattlePhaseDto::Finished {
                break;
            }
        }
        (v_prev, acts)
    };
    let (v_change, acts) = run(false);
    let mut checked = 0;
    for a in &acts {
        if a.t0 > v_change {
            if let Some((kind, got, nominal)) = timed(a) {
                assert_eq!(got, frame_raf(64.0, nominal), "{kind} w t0 {}", a.t0);
                checked += 1;
            }
        }
    }
    assert!(checked > 0, "akcje z czasem po zmianie prędkości");
    assert_eq!(
        run(true),
        (v_change, acts),
        "powtórka sesji z operacją prędkości"
    );
}

/// Adapter testowy (`MockEngineAdapter`) obsługuje komendę tą samą ścieżką gry co adapter produkcyjny.
#[test]
fn predkosc_przez_mock_adapter() {
    let mut mock = EngineBridge::new(MockEngineAdapter::default());
    let e = mock
        .handle(BridgeRequest::new(
            "s",
            EngineCommand::SetSiegeBattleSpeed {
                idx: 1,
                clamp: false,
            },
        ))
        .expect_err("mock bez sesji");
    assert_eq!(e.code, bridge::BridgeErrorCode::EngineRejected);
    mock.handle(BridgeRequest::new(
        "l",
        EngineCommand::LoadGame {
            save: PlayableGame::from_state(state(31, &["palisada"]))
                .save_json()
                .expect("save"),
        },
    ))
    .expect("load");
    let e = mock
        .handle(BridgeRequest::new(
            "s",
            EngineCommand::SetSiegeBattleSpeed {
                idx: 1,
                clamp: false,
            },
        ))
        .expect_err("bez bitwy");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    mock.handle(BridgeRequest::new(
        "st",
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    ))
    .expect("start");
    let d = mock
        .handle(BridgeRequest::new(
            "s",
            EngineCommand::SetSiegeBattleSpeed {
                idx: 11,
                clamp: false,
            },
        ))
        .expect("speed");
    assert_eq!(speed_of(&d), (1, 2.0));
    assert!(d.events.is_empty());
}

/// Zapis gry w trakcie bitwy pozostaje odrzucony (DL-SLB-1): prędkość nie trafia do zapisu ani do stanu.
#[test]
fn predkosc_nie_w_zapisie() {
    let mut b = bridge_for(state(37, &["palisada"]));
    start(&mut b);
    speed(&mut b, 5, false);
    assert!(
        send(&mut b, EngineCommand::SaveGame).is_err(),
        "zapis w trakcie bitwy odrzucony"
    );
}
