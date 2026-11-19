//! R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 część B): end-to-end przez most — szturm z wyłomem gracza zdobywa miasto,
//! a stan zawiera także prawo po przejęciu, wpis kroniki, przepisaną kolejkę produkcji i zmianę religii miasta zgodnie
//! z wektorem `e2e` generatora `p6_zdobycie_miasta_b_gen.mjs` (wykonanie tekstu pinu `07d2fbd72`). Stan bazowy jak w
//! `p6_zdobycie_miasta_a_bridge.rs` (kopia budowniczego stanu); miasto 900 nie jest stolicą (brak łupu stolicy).

#![allow(dead_code)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge,
    EngineCommand, StartGameParams, WallMs,
};
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_apply::{
    SiegeBattlePayload, SiegeBattlePhaseDto, SiegeBattleResultDto,
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

fn vectors() -> serde_json::Value {
    serde_json::from_str(include_str!("p6_zdobycie_miasta_b_vectors/vectors.json"))
        .expect("vectors")
}

fn rel_map(v: &serde_json::Value) -> std::collections::BTreeMap<String, u32> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, n)| (k.clone(), u32::try_from(n.as_u64().unwrap()).unwrap()))
        .collect()
}

/// Stan części B: 101 = grecy, 900 zwykłe miasto (stolica 101 = 905), gracz ma własną stolicę 950, magazyny wg `e2e`.
fn state_b(seed: u32) -> PlayableState {
    let v = vectors();
    let e = &v["e2e"];
    let mut st = state(seed, true);
    st.turn = u32::try_from(e["turn"].as_u64().unwrap()).unwrap();
    for p in &mut st.players {
        if p.id.get() == ENEMY {
            p.civilization = e["civ"]["101"].as_str().unwrap().to_owned();
        }
        if p.id.get() == HUMAN {
            p.civilization = e["civ"]["1"].as_str().unwrap().to_owned();
        }
    }
    for c in &mut st.cities {
        c.is_capital = c.id.get() == 905;
    }
    st.cities.retain(|c| c.owner_id.get() != HUMAN);
    st.cities.push(PlayableCity {
        id: CityId::new(950),
        owner_id: PlayerId::new(HUMAN),
        name: "Stolica".into(),
        position: PositionDto::new(0, 7),
        is_capital: true,
        population: 2,
        culture: 0,
    });
    st.stores
        .religion_by_city
        .insert(CITY, rel_map(&e["religionBefore"]));
    st.city_prod_by_city.insert(
        CityId::new(CITY),
        serde_json::from_value(e["prod"]["prod"].clone()).unwrap(),
    );
    st.economy.praca_pool_by_owner.insert(ENEMY, 10.0);
    st.economy.praca_pool_by_owner.insert(HUMAN, 3.0);
    // Gracz posiada miasto 950: flaga `playerEverOwnedCityByOwner` gracza jest prawdziwa (spójny stan wejścia).
    st.gracz_kiedys_mial_miasto = true;
    st
}

#[test]
fn szturm_zdobywa_miasto_z_krokami_czesci_b_przez_most() {
    let v = vectors();
    let e = &v["e2e"];
    let (st, res) = storm(state_b(11), &[]);
    assert_eq!(res.winner, BattleWinner::Atakujacy);
    let cap = res.capture.as_ref().expect("capture");
    assert!(cap.captured);
    assert_eq!(cap.capital_event, None, "zwykle miasto");
    assert_eq!(cap.population_after, 2);
    for s in [
        "noteCityCapture",
        "applyPostCaptureLawOnCapture",
        "cityProd",
        "onCityCapturedReligion",
        "wonderGateOk",
    ] {
        assert!(!cap.not_applied.iter().any(|n| n == s), "{s} w not_applied");
    }
    assert_eq!(
        st.stores.religion_by_city.get(&CITY),
        Some(&rel_map(&e["religionOut"]))
    );
    let law = st
        .post_capture_law_by_city
        .get(&CityId::new(CITY))
        .expect("prawo");
    assert_eq!(
        law.post_capture_law_turns_remaining,
        e["law"]["postCaptureLawTurnsRemaining"].as_f64()
    );
    assert_eq!(
        law.was_rebellion_reconquest,
        e["law"]["wasRebellionReconquest"] == true
    );
    let chron = e["chronicle"].as_array().unwrap();
    assert_eq!(chron.len(), 2);
    for entry in chron {
        let owner = entry[0].as_u64().unwrap();
        let got = st.civ_chronicle_by_owner.get(&owner).expect("kronika");
        let want: civ_engine::domain::city_capture_apply::PlayableCivChronicle =
            serde_json::from_value(entry[1].clone()).unwrap();
        assert_eq!(got, &want, "kronika {owner}");
    }
    let want: civ_engine::domain::city_capture_apply::PlayableCityProduction =
        serde_json::from_value(e["prod"]["out"].clone()).unwrap();
    assert_eq!(st.city_prod_by_city.get(&CityId::new(CITY)), Some(&want));
    assert_eq!(
        st.economy.praca_pool_by_owner.get(&ENEMY).copied(),
        e["prod"]["poolAfter"]["old"].as_f64()
    );
    assert_eq!(
        st.economy.praca_pool_by_owner.get(&HUMAN).copied(),
        e["prod"]["poolAfter"]["atk"].as_f64()
    );
}

#[test]
fn czesc_b_deterministyczna_i_niezalezna_od_podzialu_krokow() {
    // `gracz_kiedys_mial_miasto` ma `#[serde(skip)]` (pin go nie zapisuje; po wczytaniu = false): odpowiedzi mostu
    // różnią się nim zależnie od tego, czy stan przeszedł przez JSON — poza zakresem części B, normalizowane.
    let norm = |(mut s, r): (PlayableState, SiegeBattleResultDto)| {
        s.gracz_kiedys_mial_miasto = false;
        (s, r)
    };
    let (a, ra) = norm(storm(state_b(11), &[]));
    let (b, rb) = norm(storm(state_b(11), &[16.0]));
    let (c, rc) = norm(storm(state_b(11), &[7.5, 33.0, 160.0]));
    assert_eq!(a, b);
    assert_eq!(a, c);
    assert_eq!(ra.capture, rb.capture);
    assert_eq!(ra.capture, rc.capture);
    let json = serde_json::to_string(&a).unwrap();
    let back: PlayableState = serde_json::from_str(&json).unwrap();
    assert_eq!(back, a);
}
