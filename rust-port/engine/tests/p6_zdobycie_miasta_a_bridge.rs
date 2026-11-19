//! R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 część A): end-to-end przez most — `StartSiegeStorm` →
//! `StepSiegeBattle`×N / `SkipSiegeBattle` → `FinishSiegeBattle` po szturmie z wyłomem zdobywa miasto (D-ZMA-2), wynik
//! w addytywnym polu `result.capture`, determinizm i niezależność od podziału na `StepSiegeBattle`, brak zdobycia w pokoju
//! (jawny powód), eliminacja ostatniego miasta, AI↔AI = `Aborted` bez zmiany stanu (D-ZMA-7).

#![allow(dead_code)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge,
    EngineCommand, StartGameParams, WallMs,
};
use civ_engine::domain::city_capture_apply::{
    apply_storm_capture, CapitalCaptureKind, CaptureSkipReason,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_adapter::RosterUnit;
use civ_engine::domain::siege_battle_apply::{
    ApplyRosters, CityCaptureRequested, SiegeBattleError, SiegeBattlePayload, SiegeBattlePhaseDto,
    SiegeBattleResultDto,
};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_view_model::battle::BattleWinner;

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);
const ANCHOR: u64 = 7001;

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

/// Gracz (1) oblega obwarowane miasto 101 z taranem: przewaga atakujących (wynik: wygrana z wyłomem).
fn state(seed: u32, enemy_extra_city: bool) -> PlayableState {
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
    if enemy_extra_city {
        st.cities.push(PlayableCity {
            id: CityId::new(905),
            owner_id: PlayerId::new(ENEMY),
            name: "Druga".into(),
            position: PositionDto::new(0, 0),
            is_capital: false,
            population: 2,
            culture: 0,
        });
    }
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

/// Szturm do końca kawałkami `chunks` (puste = `Skip`) i `FinishSiegeBattle`.
fn storm(st: PlayableState, chunks: &[f64]) -> (PlayableState, SiegeBattleResultDto) {
    let mut b = bridge_for(st);
    send(
        &mut b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect("start");
    if chunks.is_empty() {
        send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip");
    } else {
        let mut k = 0;
        loop {
            let d = send(
                &mut b,
                EngineCommand::StepSiegeBattle {
                    wall_ms: WallMs(chunks[k % chunks.len()]),
                },
            )
            .expect("krok");
            k += 1;
            if battle(&d).phase == SiegeBattlePhaseDto::Finished {
                break;
            }
            assert!(k < 200_000);
        }
    }
    let fin = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    let res = battle(&fin).result.clone().expect("wynik");
    (state_of(&fin).clone(), res)
}

#[test]
fn szturm_z_wylomem_zdobywa_miasto_przez_most() {
    // `playerEverOwnedCityByOwner.add(atkOwner)` (`main.ts:36218`): flaga gracza po wczytaniu = false (pin jej nie
    // zapisuje), zdobycie ją ustawia.
    let mut st0 = state(11, true);
    st0.gracz_kiedys_mial_miasto = false;
    let (st, res) = storm(st0, &[]);
    assert!(
        st.gracz_kiedys_mial_miasto,
        "playerEverOwnedCityByOwner.add"
    );
    assert_eq!(res.winner, BattleWinner::Atakujacy, "scenariusz: wygrana");
    assert!(res.wall_breached, "scenariusz: wylom (taran)");
    let cap = res
        .capture
        .as_ref()
        .expect("hak T8 skonsumowany w FinishSiegeBattle");
    assert!(cap.captured);
    assert_eq!((cap.old_owner_id, cap.new_owner_id), (ENEMY, HUMAN));
    let c = st.cities.iter().find(|c| c.id.get() == CITY).unwrap();
    assert_eq!(c.owner_id, PlayerId::new(HUMAN), "zmiana wlasciciela");
    assert_eq!(c.population, 2, "applyCapturePopulationLoss: -1");
    assert_eq!(cap.population_after, 2);
    assert_eq!(
        st.captured_from_owner_by_city.get(&CityId::new(CITY)),
        Some(&PlayerId::new(ENEMY))
    );
    assert!(!st.oblegane.contains(&CityId::new(CITY)) && res.siege_ended);
    assert!(!st.siege_machines_ready.contains_key(&CityId::new(CITY)));
    // Kotwica w mieście (garnizon), żadnych jednostek 101 na heksie.
    let anchor = st.units.iter().find(|u| u.id.get() == ANCHOR).unwrap();
    assert_eq!(anchor.position, PositionDto::new(CITY_POS.0, CITY_POS.1));
    assert!(cap.entered_unit_ids.contains(&ANCHOR));
    assert!(!st.units.iter().any(
        |u| u.owner_id.get() == ENEMY && u.position == PositionDto::new(CITY_POS.0, CITY_POS.1)
    ));
    // Stolica 101 zdobyta przy innym mieście 101: przejęcie skarbca i sukcesja stolicy.
    assert_eq!(
        cap.capital_event,
        Some(CapitalCaptureKind::PrzejecieStolicy)
    );
    assert_eq!(st.economy.treasury, 40.0);
    assert_eq!(st.economy.ai_treasury_by_owner.get(&ENEMY), Some(&0.0));
    assert!(
        st.cities
            .iter()
            .find(|c| c.id.get() == 905)
            .unwrap()
            .is_capital
    );
    assert!(!c.is_capital);
    // Meta wojny pary (recordWarCityLossForPair).
    let meta = st.war.opaque["diplomacyPairMeta"].clone();
    assert_eq!(meta[0][0], "1-101");
    assert_eq!(meta[0][1]["wojnaMiasta"]["utraty"]["101"], 1);
}

#[test]
fn eliminacja_ostatniego_miasta_przez_most() {
    // Jednostka 101 poza miastem: moc ofiary > 0 przy eliminacji (armia), usuwana przez `eliminateOwner`.
    let mut st0 = state(11, false);
    add_unit(&mut st0, 8100, ENEMY, (0, 5), "Wojownik");
    let (st, res) = storm(st0, &[]);
    let cap = res.capture.expect("zdobycie");
    assert!(cap.captured);
    assert_eq!(cap.capital_event, Some(CapitalCaptureKind::Eliminacja));
    assert_eq!(cap.eliminated_owner_id, Some(ENEMY));
    assert!(!st.units.iter().any(|u| u.owner_id.get() == ENEMY));
    assert!(st
        .war
        .diplomacy
        .relation(PlayerId::new(HUMAN), PlayerId::new(ENEMY))
        .is_none());
    assert_eq!(st.economy.treasury, 40.0);
    // Zdobycze Power (main.ts:35669-35675): akumulator zdobywcy rośnie o moc ofiary.
    assert!(st
        .war
        .zdobycze_power_by_owner
        .iter()
        .any(|(o, v)| *o == 1 && *v > 0.0));
}

#[test]
fn niezalezne_od_podzialu_krokow_i_deterministyczne() {
    let (a, ra) = storm(state(11, true), &[16.0]);
    let (b, rb) = storm(state(11, true), &[7.5, 33.0, 160.0]);
    let (c, rc) = storm(state(11, true), &[]);
    assert_eq!(a, b);
    assert_eq!(ra.capture, rb.capture);
    assert_eq!(a, c, "Skip = ten sam stan co kroki");
    assert_eq!(ra.capture, rc.capture);
    let (d, rd) = storm(state(11, true), &[]);
    assert_eq!(c, d);
    assert_eq!(rc, rd);
}

#[test]
fn wynik_json_addytywny_i_round_trip() {
    let (_, res) = storm(state(11, true), &[]);
    let v = serde_json::to_value(&res).unwrap();
    assert_eq!(v["capture"]["captured"], true);
    assert_eq!(v["capture"]["capitalEvent"], "przejecieStolicy");
    assert!(v["capture"]["notApplied"].as_array().unwrap().len() >= 10);
    let back: SiegeBattleResultDto = serde_json::from_value(v).unwrap();
    assert_eq!(back, res);
    // Bez zdobycia (`None`) klucz `capture` nie występuje (kontrakt T7b bez zmian).
    let mut none = res.clone();
    none.capture = None;
    assert!(serde_json::to_value(&none)
        .unwrap()
        .get("capture")
        .is_none());
}

/// Konsument haka bezpośrednio: pokój po wyłomie = brak zdobycia (jawny powód), ten sam właściciel = brak zdobycia.
#[test]
fn brak_zdobycia_jawne_powody() {
    let atk = vec![RosterUnit::new("7001", 1, "Wojownik", "miecznik", 5, 3)];
    let def = vec![RosterUnit::new("8001", 101, "Wojownik", "miecznik", 4, 3)];
    let rosters = ApplyRosters {
        city_id: CITY,
        anchor_unit_id: ANCHOR,
        atk_roster: &atk,
        def_roster: &def,
    };
    let req = CityCaptureRequested {
        city_id: CITY,
        attacker_owner_id: HUMAN,
        anchor_unit_id: ANCHOR,
    };
    let mut st = state(3, true);
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::Peace),
    );
    let cap = apply_storm_capture(&mut st, &rosters, &req).expect("bez paniki");
    assert!(!cap.captured);
    assert_eq!(cap.skipped, Some(CaptureSkipReason::NotEnemies));
    assert_eq!(
        st.cities
            .iter()
            .find(|c| c.id.get() == CITY)
            .unwrap()
            .owner_id,
        PlayerId::new(ENEMY)
    );
    assert!(
        cap.siege_ended,
        "pokoj konczy oblezenie (validateActiveSieges)"
    );
    let mut st = state(3, true);
    for c in &mut st.cities {
        c.owner_id = PlayerId::new(HUMAN);
    }
    let cap = apply_storm_capture(&mut st, &rosters, &req).expect("bez paniki");
    assert_eq!(cap.skipped, Some(CaptureSkipReason::SameOwner));
}

/// D-ZMA-7: para AI↔AI (nieosiągalna z komendy) = jawny błąd przed zmianą miasta.
#[test]
fn ai_ai_jawny_blad() {
    let atk = vec![RosterUnit::new("7001", 102, "Wojownik", "miecznik", 5, 3)];
    let def: Vec<RosterUnit> = Vec::new();
    let rosters = ApplyRosters {
        city_id: CITY,
        anchor_unit_id: ANCHOR,
        atk_roster: &atk,
        def_roster: &def,
    };
    let mut st = state(3, true);
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(102), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    let req = CityCaptureRequested {
        city_id: CITY,
        attacker_owner_id: 102,
        anchor_unit_id: ANCHOR,
    };
    let e = apply_storm_capture(&mut st, &rosters, &req).expect_err("AI-AI");
    assert!(
        matches!(e, SiegeBattleError::Producer(ref m) if m.contains("D-ZMA-7")),
        "{e:?}"
    );
}
