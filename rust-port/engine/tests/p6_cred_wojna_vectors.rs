//! P6-CRED-WOJNA-Q1 (runda 2): wektory haka wojny P4 z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`
//! (`p6_cred_wojna_gen.mjs` wykonuje TEKST `chargeWarDeclarationCredibility` + guard `isBarbarian` + P4 w node,
//! straznik SHA-256 plikow i wycietego kodu), test S3 dla `LegacyTradeAgreement` (3 tury) oraz zgodnosc wsteczna
//! zapisu bez klucza `wiarygodnoscOstatniaWojnaTuraByOwner`.
//!
//! Zakres wektorow: skutek haka na licznik P4 obu stron (`last_war_turn`), kamienie P4 (`p4_milestones`) i
//! zdarzenia `wieloletni_pokoj` w kolejnych turach. Stan domkniecia pinu: brak traktatow (`activeDeals = []`),
//! brak ofert rozejmu, poziom trudnosci Normal. Zdarzenia N2 i zwracany `truceBreach` NIE sa tu porownywane.

use civ_engine::domain::credibility::{
    stream_active_tuples, CredibilityEvent, CredibilityParams, CredibilityRegistry, StreamDeal,
    StreamDealKind, KEY_LAST_WAR,
};
use civ_engine::domain::turn_war_dipl_steps::note_war_declarations;
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::war_turn_state::WarTurnState;
use serde_json::{Map, Value};

const VECTORS: &str = include_str!("p6_cred_wojna_vectors/vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// SHA-256 wycietego tekstu funkcji pinu (`codeSha256` z generatora).
const CODE_SHA256: &str = "87ff18365edcfef806e92b30d6ce9b781f4894a3c0a3fbc03bdc64db9569c464";

const HUMAN: i64 = 1;
const AI_A: i64 = 2;

fn owners_of(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("owners")
        .iter()
        .map(|x| x.as_i64().expect("id wlasciciela"))
        .collect()
}

fn last_war_of(reg: &CredibilityRegistry, owner: i64) -> Option<f64> {
    reg.last_war_turn
        .iter()
        .find(|(k, _)| *k == owner)
        .map(|(_, t)| *t)
}

#[test]
fn zapis_wojny_i_odczyt_p4_zgodne_z_pinem_na_wektorach() {
    let v: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(v["pin"].as_str(), Some(PIN), "pin wektorow");
    assert_eq!(
        v["codeSha256"].as_str(),
        Some(CODE_SHA256),
        "SHA wyciętego kodu"
    );
    assert_eq!(v["difficulty"].as_str(), Some("normal"));
    let owners = owners_of(&v["owners"]);
    let p = CredibilityParams::load();
    assert_eq!(
        v["params"]["wiarygodnoscP4OknoBezWojnyTur"].as_f64(),
        Some(p.p4_window),
        "okno P4 z pinu"
    );
    assert_eq!(
        v["params"]["wiarygodnoscP4BezWojny30Tur"].as_f64(),
        Some(p.p4_value),
        "wartosc kamienia P4 z pinu"
    );

    let cases = v["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 150,
        "co najmniej 150 przypadkow, jest {}",
        cases.len()
    );
    let (mut steps_n, mut pairs_n, mut barb_n, mut p4_n) = (0, 0, 0, 0);
    for case in cases {
        let name = case["name"].as_str().expect("nazwa");
        let mut war = WarTurnState::default();
        for step in case["steps"].as_array().expect("steps") {
            let turn = step["turn"].as_f64().expect("tura");
            // D4 (produkcja: run_dipl_steps -> tick_no_war_milestone) PRZED hamulcem tej tury.
            let before = CredibilityRegistry::from_meta(&war.opaque).expect("odczyt rejestru");
            let mut reg = before.clone();
            for &o in &owners {
                reg.tick_no_war_milestone(o, turn, p).expect("tick P4");
            }
            reg.store_changes(&before, &mut war.opaque);

            // Hamulec (produkcja: run_war_turn -> note_war_declarations); pary jak w `chargeWarDeclarationCredibility`.
            let pairs: Vec<(i64, i64)> = step["pairs"]
                .as_array()
                .expect("pary")
                .iter()
                .map(|pr| (pr[0].as_i64().unwrap(), pr[1].as_i64().unwrap()))
                .collect();
            barb_n += pairs.iter().filter(|(a, b)| *a == -1 || *b == -1).count();
            pairs_n += pairs.len();
            note_war_declarations(&mut war, &pairs, turn).expect("hak wojny");
            steps_n += 1;

            let got = CredibilityRegistry::from_meta(&war.opaque).expect("odczyt rejestru");
            for item in step["after"]["lastWar"].as_array().expect("lastWar") {
                let o = item[0].as_i64().unwrap();
                assert_eq!(
                    last_war_of(&got, o),
                    item[1].as_f64(),
                    "{name}: licznik bez wojny owner {o} tura {turn}"
                );
            }
            for item in step["after"]["p4"].as_array().expect("p4") {
                let o = item[0].as_i64().unwrap();
                let want = item[1].as_f64().unwrap();
                let have = got
                    .p4_milestones
                    .iter()
                    .find(|(k, _)| *k == o)
                    .map(|(_, n)| *n)
                    .unwrap_or(0.0);
                assert_eq!(have, want, "{name}: kamienie P4 owner {o} tura {turn}");
            }
            for item in step["after"]["p4Events"].as_array().expect("p4Events") {
                let o = item[0].as_i64().unwrap();
                let want: Vec<(f64, f64)> = item[1]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|e| (e[0].as_f64().unwrap(), e[1].as_f64().unwrap()))
                    .collect();
                let have: Vec<(f64, f64)> = got
                    .events_of(o)
                    .iter()
                    .filter(|e| e.typ == CredibilityEvent::WieloletniPokoj)
                    .map(|e| (e.turn_occurred, e.original_value))
                    .collect();
                assert_eq!(
                    have, want,
                    "{name}: zdarzenia wieloletni_pokoj owner {o} tura {turn}"
                );
            }
        }
        let fin = CredibilityRegistry::from_meta(&war.opaque).expect("odczyt rejestru");
        p4_n += owners
            .iter()
            .map(|&o| {
                fin.events_of(o)
                    .iter()
                    .filter(|e| e.typ == CredibilityEvent::WieloletniPokoj)
                    .count()
            })
            .sum::<usize>();
    }
    assert!(steps_n >= 1000, "kroki: {steps_n}");
    assert!(pairs_n > 0, "pary wojny: {pairs_n}");
    assert!(barb_n > 0, "przypadki z barbarzyncą musza wystapic");
    assert!(p4_n > 0, "kamienie P4 musza wystapic w wektorach");
}

fn three_turns(kind: StreamDealKind, miss_turn3: bool) -> Vec<CredibilityRegistry> {
    let p = CredibilityParams::load();
    let mut reg = CredibilityRegistry::default();
    let mut out = Vec::new();
    for turn in 1..=3u32 {
        let deal = StreamDeal {
            id: "handel-1".to_string(),
            kind,
            parties: (HUMAN, AI_A),
            cyclic_len: 2,
        };
        let ok = move |_id: &str, idx: usize| -> Option<bool> {
            if miss_turn3 && turn == 3 && idx == 1 {
                Some(false)
            } else {
                Some(true)
            }
        };
        let active = stream_active_tuples(std::slice::from_ref(&deal), &ok);
        reg.update_streams_this_turn(&active, Difficulty::Normal, p);
        out.push(reg.clone());
    }
    out
}

fn has_stream(reg: &CredibilityRegistry, owner: i64, key: &str) -> bool {
    reg.streams
        .iter()
        .any(|(o, m)| *o == owner && m.iter().any(|(k, _)| k == key))
}

#[test]
fn s3_umowa_handlowa_legacy_kind_three_turns_matches_trade_route() {
    // Wariant `LegacyTradeAgreement` (web `umowa_handlowa`) podawany wprost do kroku strumieni (bez aliasu
    // w `stream_kind_of`, decyzja orkiestratora r2 (a)). Pin: gdy wszystkie dostawy ok, daje `strumien_handel`
    // identycznie jak szlaki; brak 100% dostaw w danej turze = brak strumienia w tej turze.
    const KEY: &str = "2_strumien_handel";
    let legacy_ok = three_turns(StreamDealKind::LegacyTradeAgreement, false);
    let route_ok = three_turns(StreamDealKind::TradeRoute, false);
    assert_eq!(
        legacy_ok, route_ok,
        "trzy tury: umowa_handlowa == szlaki przy 100% dostaw"
    );
    for (i, reg) in legacy_ok.iter().enumerate() {
        assert!(
            has_stream(reg, HUMAN, KEY),
            "tura {}: strumien handlu gracza",
            i + 1
        );
        assert!(
            has_stream(reg, AI_A, "1_strumien_handel"),
            "tura {}: strumien handlu AI",
            i + 1
        );
    }
    let missed = three_turns(StreamDealKind::LegacyTradeAgreement, true);
    assert_eq!(missed[0], legacy_ok[0], "tura 1 bez zmian");
    assert_eq!(missed[1], legacy_ok[1], "tura 2 bez zmian");
    assert!(
        !has_stream(&missed[2], HUMAN, KEY),
        "tura 3: niedostarczenie = brak strumienia (pin: allDelivered)"
    );
    assert!(
        has_stream(&route_ok[2], HUMAN, KEY),
        "kontrola: szlaki w turze 3 nadal daja strumien"
    );
}

#[test]
fn stary_zapis_bez_klucza_last_war_laduje_sie_jako_zero_i_pierwsza_wojna_go_zapisuje() {
    let p = CredibilityParams::load();
    // Zapis sprzed wpiecia haka: zdarzenie wiarygodnosci, bez KEY_LAST_WAR.
    let mut old = CredibilityRegistry::default();
    old.append_event(AI_A, CredibilityEvent::WieloletniPokoj, 3.0, 5.0);
    let mut meta = Map::new();
    old.store_changes(&CredibilityRegistry::default(), &mut meta);
    assert!(
        !meta.contains_key(KEY_LAST_WAR),
        "stary zapis nie ma klucza last-war"
    );

    let mut war = WarTurnState {
        opaque: meta,
        ..Default::default()
    };
    let loaded = CredibilityRegistry::from_meta(&war.opaque).expect("stary zapis czytelny");
    assert!(
        loaded.last_war_turn.is_empty(),
        "brak klucza = brak wojny (licznik od 0)"
    );
    assert_eq!(loaded.events_of(AI_A).len(), 1, "stare zdarzenie zachowane");

    // Brak wojny: odczyt P4 w turze 65 liczy od 0 (dwa kamienie), jak na pinie z pustym mapowaniem.
    let mut reg = loaded.clone();
    reg.tick_no_war_milestone(AI_A, 65.0, p).expect("tick");
    reg.store_changes(&loaded, &mut war.opaque);
    assert_eq!(
        CredibilityRegistry::from_meta(&war.opaque)
            .unwrap()
            .events_of(AI_A)
            .len(),
        3,
        "1 stare + 2 kamienie P4"
    );

    // Pierwsza wojna zapisuje klucz; ponowny odczyt i zapis sa spojne.
    note_war_declarations(&mut war, &[(AI_A, HUMAN)], 70.0).expect("wojna");
    assert!(
        war.opaque.contains_key(KEY_LAST_WAR),
        "klucz zapisany przez pierwsza wojne"
    );
    let r = CredibilityRegistry::from_meta(&war.opaque).unwrap();
    assert_eq!(last_war_of(&r, AI_A), Some(70.0));
    assert_eq!(last_war_of(&r, HUMAN), Some(70.0));
    let mut again = Map::new();
    r.store_changes(&CredibilityRegistry::default(), &mut again);
    assert_eq!(
        again.get(KEY_LAST_WAR),
        war.opaque.get(KEY_LAST_WAR),
        "round-trip klucza last-war"
    );
}
