//! R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 część B): wektory z wykonania tekstu pinu `07d2fbd72`
//! (`tests/p6_zdobycie_miasta_b_gen.mjs`) dla kroków P1/P9 dopisanych w części B: religia miasta
//! (`onCityCapturedReligion` przez `apply_capture_religion`), kolejka produkcji (`main.ts:36134-36184`),
//! prawo po przejęciu (`applyPostCaptureLawOnCapture`) i kronika (`noteCityCapture`).

use std::collections::BTreeMap;

use civ_engine::domain::city_capture_apply::{
    apply_capture_law, apply_capture_production, apply_capture_religion, apply_note_city_capture,
    on_city_captured_religion, CityCaptureResultDto, PlayableCityProduction, PlayableCivChronicle,
    PlayablePostCaptureLaw, NOT_APPLIED_ALWAYS, PIN_STEPS,
};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableState, StartGameParams,
};
use civ_engine::domain::territory::ReligionState;
use civ_engine::{CityId, PlayerId, PositionDto};
use serde_json::Value;

const ATK: u64 = 1;
const OLD: u64 = 101;
const CITY: u64 = 900;

fn vectors() -> Value {
    let text = include_str!("p6_zdobycie_miasta_b_vectors/vectors.json");
    serde_json::from_str(text).expect("vectors.json")
}

fn base(civ_new: &str, civ_prev: &str, pop: u32) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    st.cities.clear();
    st.players.retain(|p| p.id.get() != OLD);
    for p in &mut st.players {
        if p.id.get() == ATK {
            p.civilization = civ_new.to_owned();
        }
    }
    st.players.push(PlayablePlayer {
        id: PlayerId::new(OLD),
        name: "ofiara".into(),
        civilization: civ_prev.to_owned(),
        is_human: false,
    });
    // Miasto po zmianie właściciela (pin czyta religię i kolejkę po `applyCityCaptureAfterBattle`).
    for (id, owner, pos) in [(CITY, ATK, (3, 3)), (905, ATK, (0, 0)), (906, OLD, (6, 6))] {
        st.cities.push(PlayableCity {
            id: CityId::new(id),
            owner_id: PlayerId::new(owner),
            name: format!("m{id}"),
            position: PositionDto::new(pos.0, pos.1),
            is_capital: false,
            population: if id == CITY { pop } else { 2 },
            culture: 0,
        });
    }
    st
}

fn counts_u32(v: &Value) -> BTreeMap<String, u32> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, n)| (k.clone(), u32::try_from(n.as_u64().unwrap()).unwrap()))
        .collect()
}

#[test]
fn dane_rust_rowne_danym_pinu() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    assert_eq!(v["dataSame"]["civs"], true);
    assert_eq!(v["dataSame"]["society"], true);
    assert_eq!(v["dataSame"]["buildingsLokalizacja"], true);
}

#[test]
fn religia_po_zdobyciu_zgodna_z_pinem() {
    let v = vectors();
    let cases = v["religionCases"].as_array().unwrap();
    assert!(cases.len() >= 280, "pokrycie wektorow religii");
    let mut mixed = 0;
    let mut same = 0;
    let mut hamilton = 0;
    for (i, c) in cases.iter().enumerate() {
        let pop = c["population"].as_f64().unwrap();
        let expected = counts_u32(&c["out"]);
        if c["sameOwner"] == true {
            let st = ReligionState {
                counts: c["counts"]
                    .as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, n)| (k.clone(), n.as_f64().unwrap()))
                    .collect(),
            };
            let out = on_city_captured_religion(
                &st,
                pop,
                c["newRel"].as_str(),
                c["prevRel"].as_str(),
                Some(101),
                Some(101),
                false,
            );
            assert_eq!(out, st, "przypadek {i}: ten sam wlasciciel = bez zmian");
            continue;
        }
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let mut st = base(
            c["civNew"].as_str().unwrap(),
            c["civPrev"].as_str().unwrap(),
            pop as u32,
        );
        st.stores
            .religion_by_city
            .insert(CITY, counts_u32(&c["counts"]));
        apply_capture_religion(&mut st, CityId::new(CITY), 101, 1);
        assert_eq!(
            st.stores.religion_by_city.get(&CITY),
            Some(&expected),
            "przypadek {i}: {c}"
        );
        if c["same"] == true {
            same += 1;
        } else if expected.len() >= 2 {
            mixed += 1;
        }
        if c["counts"].as_object().unwrap().len() >= 3 && c["same"] == false {
            hamilton += 1;
        }
    }
    assert!(
        same > 10 && mixed > 10 && hamilton > 10,
        "pokrycie galezi: same={same} mixed={mixed} hamilton={hamilton}"
    );
}

#[test]
fn religia_brak_wpisu_zapisuje_wynik_pinu() {
    // `cityRelig.get(city.id) ?? { counts: {} }`: brak wpisu = pusty stan; wynik zawsze zapisany (`cityRelig.set`).
    let mut st = base("rzymianie", "grecy", 3);
    apply_capture_religion(&mut st, CityId::new(CITY), 101, 1);
    let got = st.stores.religion_by_city.get(&CITY).cloned().unwrap();
    assert_eq!(got.values().sum::<u32>(), 3, "{got:?}");
}

#[test]
fn kolejka_produkcji_zgodna_z_pinem() {
    let v = vectors();
    for c in v["prodCases"].as_array().unwrap() {
        let name = c["name"].as_str().unwrap();
        let mut st = base("rzymianie", "grecy", 3);
        st.economy.praca_pool_by_owner.insert(OLD, 10.0);
        st.economy.praca_pool_by_owner.insert(ATK, 3.0);
        if !c["prod"].is_null() {
            let p: PlayableCityProduction = serde_json::from_value(c["prod"].clone()).unwrap();
            st.city_prod_by_city.insert(CityId::new(CITY), p);
        }
        let capital = if c["isNewCapital"] == true { CITY } else { 905 };
        let designated: BTreeMap<i64, CityId> =
            BTreeMap::from([(1_i64, CityId::new(capital)), (101, CityId::new(906))]);
        let mut out = dummy_out();
        apply_capture_production(&mut st, CityId::new(CITY), 101, 1, &designated, &mut out);
        let expected: Option<PlayableCityProduction> = if c["out"].is_null() {
            None
        } else {
            Some(serde_json::from_value(c["out"].clone()).unwrap())
        };
        assert_eq!(
            st.city_prod_by_city.get(&CityId::new(CITY)).cloned(),
            expected,
            "{name}"
        );
        assert_eq!(
            st.economy.praca_pool_by_owner.get(&OLD).copied(),
            c["poolAfter"]["old"].as_f64(),
            "{name}: pula starego"
        );
        assert_eq!(
            st.economy.praca_pool_by_owner.get(&ATK).copied(),
            c["poolAfter"]["atk"].as_f64(),
            "{name}: pula zdobywcy"
        );
        assert!(out.not_applied.is_empty(), "{name}: brak cudow w kolejce");
    }
}

#[test]
fn kolejka_z_cudem_jawnie_w_not_applied() {
    let mut st = base("rzymianie", "grecy", 3);
    let p: PlayableCityProduction = serde_json::from_value(serde_json::json!({
        "kolejka": [{"kind": "budynek", "id": "__wonder__:piramidy", "nazwa": "x", "koszt": 1}], "postep": 0
    }))
    .unwrap();
    st.city_prod_by_city.insert(CityId::new(CITY), p);
    let mut out = dummy_out();
    apply_capture_production(
        &mut st,
        CityId::new(CITY),
        101,
        1,
        &BTreeMap::new(),
        &mut out,
    );
    assert_eq!(out.not_applied, vec!["wonderGateOk".to_owned()]);
}

#[test]
fn oldest_city_fallback_dla_nowej_stolicy() {
    // `capitalCityIdForOwner`: brak jawnej stolicy zdobywcy -> najstarsze miasto (`city900` < `city905`): nowa stolica,
    // budynek-stolica zostaje w kolejce (pin `isCaptureNewCapital`).
    let mut st = base("rzymianie", "grecy", 3);
    let p: PlayableCityProduction = serde_json::from_value(serde_json::json!({
        "kolejka": [{"kind": "budynek", "id": "palac", "nazwa": "p", "koszt": 1}], "postep": 4
    }))
    .unwrap();
    st.city_prod_by_city.insert(CityId::new(CITY), p.clone());
    let mut out = dummy_out();
    apply_capture_production(
        &mut st,
        CityId::new(CITY),
        101,
        1,
        &BTreeMap::new(),
        &mut out,
    );
    assert_eq!(st.city_prod_by_city.get(&CityId::new(CITY)), Some(&p));
}

#[test]
fn prawo_po_przejeciu_zgodne_z_pinem() {
    let v = vectors();
    for c in v["lawCases"].as_array().unwrap() {
        let mut st = base("rzymianie", "grecy", 3);
        if !c["before"].is_null() {
            let b: PlayablePostCaptureLaw = serde_json::from_value(c["before"].clone()).unwrap();
            st.post_capture_law_by_city.insert(CityId::new(CITY), b);
        }
        apply_capture_law(&mut st, CityId::new(CITY), 101, 1);
        let got = st.post_capture_law_by_city.get(&CityId::new(CITY)).unwrap();
        assert_eq!(
            got.post_capture_law_turns_remaining,
            c["out"]["postCaptureLawTurnsRemaining"].as_f64()
        );
        assert_eq!(
            got.was_rebellion_reconquest,
            c["out"]["wasRebellionReconquest"] == true
        );
    }
    // Ten sam właściciel = no-op (pin: wczesny return).
    let mut st = base("rzymianie", "grecy", 3);
    apply_capture_law(&mut st, CityId::new(CITY), 1, 1);
    assert!(st.post_capture_law_by_city.is_empty());
}

fn chronicles(v: &Value) -> BTreeMap<u64, PlayableCivChronicle> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|e| {
            (
                e[0].as_u64().unwrap(),
                serde_json::from_value(e[1].clone()).unwrap(),
            )
        })
        .collect()
}

#[test]
fn kronika_zgodna_z_pinem() {
    let v = vectors();
    for c in v["chronicleCases"].as_array().unwrap() {
        let mut st = base("rzymianie", "grecy", 3);
        st.turn = u32::try_from(c["turn"].as_u64().unwrap()).unwrap();
        // Stan sprzed: wejście = te same pola co `newChronicle(sinceTurn)` + nadpisania (wynik pinu dla właścicieli
        // niedotkniętych byłby identyczny, więc wejście bierzemy z wyjścia pinu i cofamy zmianę liczników).
        let mut before = chronicles(&c["out"]);
        if let Some(e) = before.get_mut(&ATK) {
            e.cities_taken -= 1.0;
        }
        if let Some(e) = before.get_mut(&OLD) {
            e.cities_lost -= 1.0;
        }
        let existing: Vec<u64> = c["before"]
            .as_array()
            .unwrap()
            .iter()
            .map(|e| e[0].as_u64().unwrap())
            .collect();
        before.retain(|k, _| existing.contains(k));
        st.civ_chronicle_by_owner = before;
        apply_note_city_capture(&mut st, 101, 1);
        assert_eq!(st.civ_chronicle_by_owner, chronicles(&c["out"]), "{c}");
    }
}

#[test]
fn tabela_krokow_bez_pominietych_krokow_b() {
    for s in [
        "noteCityCapture",
        "applyPostCaptureLawOnCapture",
        "cityProd",
        "onCityCapturedReligion",
    ] {
        assert!(!NOT_APPLIED_ALWAYS.contains(&s), "{s} nadal w NOT_APPLIED");
    }
    for s in [
        "noteCityCapture",
        "applyPostCaptureLawOnCapture",
        "sanitizeProductionQueue",
        "onCityCapturedReligion",
    ] {
        let (_, port) = PIN_STEPS.iter().find(|(n, _)| *n == s).unwrap();
        assert!(!port.starts_with("NOT_APPLIED"), "{s}: {port}");
    }
}

fn dummy_out() -> CityCaptureResultDto {
    CityCaptureResultDto {
        captured: false,
        skipped: None,
        old_owner_id: OLD,
        new_owner_id: ATK,
        removed_unit_ids: Vec::new(),
        entered_unit_ids: Vec::new(),
        population_before: 0,
        population_after: 0,
        wonders_transferred: Vec::new(),
        capital_event: None,
        eliminated_owner_id: None,
        treasury_taken: 0.0,
        techs_copied: Vec::new(),
        siege_ended: false,
        not_applied: Vec::new(),
    }
}
