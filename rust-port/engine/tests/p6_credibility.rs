//! P6-WIRE-WAR-CRED-Q1: testy `domain/credibility.rs` (rejestr wiarygodnosci) i jego wpiecia w D2/D4
//! (`turn_war_dipl_steps.rs`).
//!
//! - Wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (`p6_credibility_gen.mjs`, straznik SHA-256, TEKST pinu
//!   wykonany w node): 250 przypadkow funkcji czystych (suma calkowita, krzywa zapominania, strumien, pasma,
//!   waga strumienia, start) + 48 sekwencji tur (616 krokow) przez D2 -> zdarzenia dodatkowe -> hak wojny P4 -> D4
//!   (strumienie S1-S4, kamienie P4) z porownaniem CALEGO rejestru po kazdym kroku i wiarygodnosci calkowitej.
//! - Zgodnosc wsteczna zapisu: zapis sprzed zmiany (bez kluczy `wiarygodnosc*`) laduje sie jako pusty rejestr;
//!   zapis w formacie webu (klucze z pinu) round-tripuje bez zmian i jest kontynuowany.
//! - Test 3 tur przez `run_war_turn` z zapisem wiarygodnosci (D2 zapisuje, D4 tika, wygasniecie czysci strumien).

use std::collections::BTreeMap;

use civ_engine::domain::ai_diplomacy_turn::{PairKey, PairWarParams};
use civ_engine::domain::brake_inputs::OwnerFacts;
use civ_engine::domain::brake_power::{Component, ObjectivePowerRaw};
use civ_engine::domain::credibility::{
    append_credibility_event, credibility_band, credibility_start, credibility_sum,
    credibility_total, current_value, expiry_finish_events, fresh_stream_entry,
    stream_active_tuples, stream_kind_of, stream_sum, stream_weight, tick_stream_entry,
    CredibilityEvent, CredibilityEventRecord, CredibilityParams, CredibilityRegistry,
    CredibilityStreamEntry, CredibilityStreamEvent, EventSign, StreamDeal, StreamDealKind,
    KEY_EVENTS, KEY_LAST_WAR, KEY_P4_MILESTONES, KEY_STREAMS,
};
use civ_engine::domain::diplomacy::{RelationStatus, TreatyKind};
use civ_engine::domain::turn_war_dipl_steps::DiplStepsInputs;
use civ_engine::domain::turn_war_pipeline::{
    run_war_turn, PeaceLockFacts, WarTurnConfig, WarTurnContext, WarTurnError, WarTurnInputs,
    WarTurnReport,
};
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::war_turn_state::WarTurnState;
use civ_engine::domain::PlayerId;
use serde_json::{json, Map, Value};

const VECTORS: &str = include_str!("p6_credibility_vectors/vectors.json");
const GEN: &str = include_str!("p6_credibility_gen.mjs");
const SAVE_BEFORE: &str = include_str!("p6_credibility_vectors/save_before_cred.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";

/// Niecalkowite liczby wektorow sa tekstem `f64:<hex bitow>` (serde_json bez `float_roundtrip` myli sie o 1 ulp).
fn decode_floats(v: Value) -> Value {
    match v {
        Value::String(s) => match s.strip_prefix("f64:") {
            Some(hex) => {
                let bits = u64::from_str_radix(hex, 16).expect("bity f64");
                Value::from(f64::from_bits(bits))
            }
            None => Value::String(s),
        },
        Value::Array(a) => Value::Array(a.into_iter().map(decode_floats).collect()),
        Value::Object(o) => {
            Value::Object(o.into_iter().map(|(k, x)| (k, decode_floats(x))).collect())
        }
        other => other,
    }
}

fn vectors() -> Value {
    decode_floats(serde_json::from_str(VECTORS).expect("vectors.json"))
}

fn diff(v: &Value) -> Difficulty {
    serde_json::from_value(v.clone()).expect("difficulty")
}

fn event(v: &Value) -> CredibilityEvent {
    CredibilityEvent::from_web_key(v.as_str().unwrap()).expect("typ zdarzenia")
}

fn stream_ev(v: &Value) -> CredibilityStreamEvent {
    CredibilityStreamEvent::from_web_key(v.as_str().unwrap()).expect("typ strumienia")
}

fn rec(v: &Value) -> CredibilityEventRecord {
    CredibilityEventRecord {
        typ: event(&v["typ"]),
        original_value: v["wartoscPierwotna"].as_f64().unwrap(),
        turn_occurred: v["turaWystapienia"].as_f64().unwrap(),
        sign: EventSign::from_web_key(v["znak"].as_str().unwrap()).unwrap(),
    }
}

fn entry(v: &Value) -> CredibilityStreamEntry {
    CredibilityStreamEntry {
        typ: stream_ev(&v["typ"]),
        value_per_turn: v["wartoscNaTure"].as_f64().unwrap(),
        active_sum: v["sumaAktywna"].as_f64().unwrap(),
    }
}

// ---------------------------------------------------------------------------------------------
// Straznik pinu i parametry
// ---------------------------------------------------------------------------------------------

#[test]
fn guard_pin_sha_and_generator_agree() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    let sha = v["sha256"].as_object().unwrap();
    assert_eq!(
        sha.len(),
        6,
        "main.ts, credibility, treaties, types, difficulty, diplomacy.json"
    );
    for (file, hash) in sha {
        assert_eq!(hash.as_str().unwrap().len(), 64, "{file}");
        assert!(
            GEN.contains(hash.as_str().unwrap()),
            "generator nie zawiera SHA-256 {file}"
        );
    }
}

#[test]
fn rust_params_equal_pin_params() {
    // 47 parametrow `wiarygodnosc*` z `getBaseDiplomacyParams()` pinu vs `data/diplomacy.json` Rust.
    let v = vectors();
    let pin = v["params"].as_object().unwrap();
    assert!(pin.len() >= 40);
    let file = civ_engine::data::civilizations::parse_diplomacy().unwrap();
    let rust = serde_json::to_value(&file.params).unwrap();
    for (k, want) in pin {
        let got = rust
            .get(k)
            .unwrap_or_else(|| panic!("brak parametru {k} w Rust"));
        assert_eq!(got.as_f64(), want.as_f64(), "parametr {k}");
    }
}

// ---------------------------------------------------------------------------------------------
// Wektory: funkcje czyste
// ---------------------------------------------------------------------------------------------

#[test]
fn pure_vectors_match_pin() {
    let v = vectors();
    let p = CredibilityParams::load();
    let pure = v["pure"].as_array().unwrap();
    assert!(pure.len() >= 250);
    let (mut totals, mut dropped_zero, mut appended_n) = (0, 0, 0);
    for c in pure {
        match c["fn"].as_str().unwrap() {
            "streamWeight" => {
                let got = stream_weight(stream_ev(&c["typ"]), diff(&c["difficulty"]), p);
                assert_eq!(got, c["out"].as_f64().unwrap(), "{c}");
            }
            "start" => assert_eq!(
                credibility_start(diff(&c["difficulty"]), p),
                c["out"].as_f64().unwrap()
            ),
            "band" => assert_eq!(
                credibility_band(c["w"].as_f64().unwrap(), p).web_key(),
                c["out"].as_str().unwrap(),
                "{c}"
            ),
            "total" => {
                totals += 1;
                let d = diff(&c["difficulty"]);
                let turn = c["turn"].as_f64().unwrap();
                // append: ta sama sekwencja wywolan, te same decyzje no-op.
                let mut events: Vec<CredibilityEventRecord> = Vec::new();
                for a in c["appended"].as_array().unwrap() {
                    let did = append_credibility_event(
                        &mut events,
                        event(&a["typ"]),
                        a["value"].as_f64().unwrap(),
                        a["tura"].as_f64().unwrap(),
                    );
                    assert_eq!(did, a["appended"].as_bool().unwrap(), "{a}");
                    appended_n += 1;
                    if !did {
                        dropped_zero += 1;
                    }
                }
                let want_events: Vec<CredibilityEventRecord> =
                    c["events"].as_array().unwrap().iter().map(rec).collect();
                assert_eq!(events, want_events);
                // strumien: swiezy + N tikow == wpis z pinu (kolejnosc dodawan).
                let want_entries: Vec<CredibilityStreamEntry> = c["streamEntries"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(entry)
                    .collect();
                for (meta, want) in c["streams"].as_array().unwrap().iter().zip(&want_entries) {
                    let mut e = fresh_stream_entry(stream_ev(&meta["typ"]), d, p);
                    for _ in 0..meta["ticks"].as_u64().unwrap() {
                        e = tick_stream_entry(&e);
                    }
                    assert_eq!(&e, want);
                }
                let start = credibility_start(d, p);
                assert_eq!(
                    credibility_total(&events, &want_entries, start, turn, d, p),
                    c["outTotal"].as_f64().unwrap(),
                    "total {c}"
                );
                assert_eq!(
                    credibility_sum(&events, start, turn, d, p),
                    c["outSimple"].as_f64().unwrap()
                );
                let values: Vec<f64> = events
                    .iter()
                    .map(|e| current_value(e, turn, d, p))
                    .collect();
                let want_values: Vec<f64> = c["outEventValues"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| x.as_f64().unwrap())
                    .collect();
                assert_eq!(values, want_values);
                assert_eq!(
                    stream_sum(&want_entries),
                    c["outStreamSum"].as_f64().unwrap()
                );
            }
            other => panic!("nieznany wektor {other}"),
        }
    }
    assert!(
        totals >= 200 && appended_n > 500 && dropped_zero > 50,
        "pokrycie gałęzi: {totals} {appended_n} {dropped_zero}"
    );
}

// ---------------------------------------------------------------------------------------------
// Wektory: sekwencje tur (D2 -> zdarzenia -> wojna P4 -> D4)
// ---------------------------------------------------------------------------------------------

struct JsDeal {
    id: String,
    kind: TreatyKind,
    legacy_trade: bool,
    parties: (i64, i64),
    expires: Option<f64>,
    cyclic_len: usize,
    ever_failed: bool,
}

fn js_deal(v: &Value) -> JsDeal {
    let kind_s = v["rodzaj"].as_str().unwrap();
    let st = v["strony"].as_array().unwrap();
    JsDeal {
        id: v["id"].as_str().unwrap().to_owned(),
        kind: serde_json::from_value(Value::String(kind_s.to_owned())).expect("rodzaj"),
        legacy_trade: kind_s == "umowa_handlowa",
        parties: (st[0].as_i64().unwrap(), st[1].as_i64().unwrap()),
        expires: v["wygasaTura"].as_f64(),
        cyclic_len: v["handelSurowiecCykliczny"].as_array().map_or(0, Vec::len),
        ever_failed: v["handelCyklicznyKiedykolwiekNiedostarczono"]
            .as_bool()
            .unwrap_or(false),
    }
}

fn registry_json(r: &CredibilityRegistry) -> Value {
    Value::Object(r.to_meta())
}

#[test]
fn sequence_vectors_match_pin() {
    let v = vectors();
    let p = CredibilityParams::load();
    let seqs = v["sequences"].as_array().unwrap();
    let (mut steps_n, mut expired_n, mut p4_n, mut ticked_n, mut legacy_n) = (0, 0, 0, 0, 0);
    for s in seqs {
        let d = diff(&s["difficulty"]);
        let owners: Vec<i64> = s["owners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|o| o.as_i64().unwrap())
            .collect();
        let mut reg = CredibilityRegistry::default();
        for st in s["steps"].as_array().unwrap() {
            steps_n += 1;
            let turn = st["turn"].as_f64().unwrap();
            let deals: Vec<JsDeal> = st["dealsBefore"]
                .as_array()
                .unwrap()
                .iter()
                .map(js_deal)
                .collect();
            // D1/D2: wygasle (`wygasaTura <= tura`) dostaja finisz, obie strony, w kolejnosci listy.
            for dl in deals
                .iter()
                .filter(|x| x.expires.is_some_and(|e| e <= turn))
            {
                expired_n += 1;
                for (ev, val) in expiry_finish_events(dl.kind, dl.cyclic_len > 0, dl.ever_failed, p)
                {
                    reg.append_event(dl.parties.0, ev, val, turn);
                    reg.append_event(dl.parties.1, ev, val, turn);
                }
            }
            // zdarzenia dopisane po D2 (N6 z D3 itp.)
            for e in st["extra"].as_array().unwrap() {
                reg.append_event(
                    e["owner"].as_i64().unwrap(),
                    event(&e["typ"]),
                    e["value"].as_f64().unwrap(),
                    turn,
                );
            }
            // hak P4 przy wejsciu w wojne
            for w in st["wars"].as_array().unwrap() {
                reg.note_war_entered(w[0].as_i64().unwrap(), w[1].as_i64().unwrap(), turn);
            }
            // D4
            let alive: Vec<StreamDeal> = deals
                .iter()
                .filter(|x| !x.expires.is_some_and(|e| e <= turn))
                .map(|x| {
                    if x.legacy_trade {
                        legacy_n += 1;
                    }
                    StreamDeal {
                        id: x.id.clone(),
                        kind: if x.legacy_trade {
                            StreamDealKind::LegacyTradeAgreement
                        } else {
                            stream_kind_of(x.kind)
                        },
                        parties: x.parties,
                        cyclic_len: x.cyclic_len,
                    }
                })
                .collect();
            let cyc = st["cyc"].as_object().unwrap();
            let ok =
                |id: &str, idx: usize| cyc.get(&format!("{id}#{idx}")).and_then(Value::as_bool);
            let active = stream_active_tuples(&alive, &ok);
            ticked_n += active.len();
            reg.update_streams_this_turn(&active, d, p);
            for &o in &owners {
                reg.tick_no_war_milestone(o, turn, p).unwrap();
            }
            let after = &st["after"];
            let want = json!({
                KEY_EVENTS: after["events"],
                KEY_STREAMS: after["streams"],
                KEY_LAST_WAR: after["lastWar"],
                KEY_P4_MILESTONES: after["p4"],
            });
            assert_eq!(registry_json(&reg), want, "{} tura {turn}", s["name"]);
            p4_n = p4_n.max(after["p4"].as_array().unwrap().len());
            for &o in &owners {
                assert_eq!(
                    reg.total_of(o, turn, d, p),
                    after["totals"][o.to_string()].as_f64().unwrap(),
                    "{} tura {turn} wlasciciel {o}",
                    s["name"]
                );
            }
        }
    }
    assert!(steps_n >= 600 && expired_n >= 150 && ticked_n >= 1000 && legacy_n > 0 && p4_n > 0);
}

// ---------------------------------------------------------------------------------------------
// Jednostkowe: gałęzie, ktorych wektory nie pokrywaja wprost
// ---------------------------------------------------------------------------------------------

#[test]
fn append_noop_for_zero_and_non_finite() {
    let mut ev = Vec::new();
    assert!(!append_credibility_event(
        &mut ev,
        CredibilityEvent::ZlamaniePaktuNap,
        0.0,
        1.0
    ));
    assert!(!append_credibility_event(
        &mut ev,
        CredibilityEvent::ZlamaniePaktuNap,
        f64::NAN,
        1.0
    ));
    assert!(!append_credibility_event(
        &mut ev,
        CredibilityEvent::ZlamaniePaktuNap,
        f64::INFINITY,
        1.0
    ));
    assert!(ev.is_empty());
    assert!(append_credibility_event(
        &mut ev,
        CredibilityEvent::ZlamaniePaktuNap,
        -30.0,
        4.0
    ));
    assert_eq!(ev[0].sign, EventSign::Penalty);
}

#[test]
fn p4_zero_window_is_error_not_endless_loop() {
    let mut p = *CredibilityParams::load();
    p.p4_window = 0.0;
    let mut reg = CredibilityRegistry::default();
    let e = reg.tick_no_war_milestone(1, 100.0, &p).unwrap_err();
    assert!(e.to_string().contains("OknoBezWojny"), "{e}");
    assert_eq!(
        reg,
        CredibilityRegistry::default(),
        "brak zmian przy bledzie"
    );
}

#[test]
fn p4_award_repeats_and_war_resets() {
    let p = CredibilityParams::load();
    let mut reg = CredibilityRegistry::default();
    reg.tick_no_war_milestone(1, 29.0, p).unwrap();
    assert!(reg.events.is_empty());
    reg.tick_no_war_milestone(1, 95.0, p).unwrap(); // 3 okna naraz (kamienie nadrabiane petla)
    assert_eq!(reg.events_of(1).len(), 3);
    reg.tick_no_war_milestone(1, 95.0, p).unwrap();
    assert_eq!(
        reg.events_of(1).len(),
        3,
        "te same kamienie nie sa naliczane drugi raz"
    );
    reg.note_war_entered(1, 2, 95.0);
    reg.tick_no_war_milestone(1, 124.0, p).unwrap();
    // licznik P4 zostaje (web: `already` nie jest zerowane), wiec po wojnie `now` < `already` => brak zdarzenia
    assert_eq!(reg.events_of(1).len(), 3);
}

// ---------------------------------------------------------------------------------------------
// Zgodnosc wsteczna zapisu
// ---------------------------------------------------------------------------------------------

fn meta_of(v: &Value) -> Map<String, Value> {
    v.as_object().cloned().expect("obiekt")
}

#[test]
fn old_save_without_credibility_keys_loads_as_empty_registry() {
    let meta = meta_of(&serde_json::from_str::<Value>(SAVE_BEFORE).unwrap());
    for k in [KEY_EVENTS, KEY_STREAMS, KEY_LAST_WAR, KEY_P4_MILESTONES] {
        assert!(!meta.contains_key(k), "fixture sprzed zmiany nie ma {k}");
    }
    let war = WarTurnState::from_meta_json(&meta);
    assert_eq!(war.diplomacy.deals.len(), 3, "dane sprzed zmiany ladowane");
    assert_eq!(
        CredibilityRegistry::from_meta(&war.opaque).unwrap(),
        CredibilityRegistry::default()
    );
    // zapis nieruszonego stanu nie dopisuje kluczy wiarygodnosci (format sprzed zmiany bez zmian)
    let out = war.to_meta_json();
    for k in [KEY_EVENTS, KEY_STREAMS, KEY_LAST_WAR, KEY_P4_MILESTONES] {
        assert!(!out.contains_key(k), "{k}");
    }
    // serde calosci stanu (`#[serde(default)]` na polu stanu gry): brak klucza = domyslny rejestr
    let via_serde: WarTurnState = serde_json::from_value(Value::Object(meta)).unwrap();
    assert_eq!(via_serde, war);
}

#[test]
fn web_format_registry_round_trips_unchanged_and_survives_a_turn() {
    // Rejestr z KROKU WEKTORA (wyjscie pinu) jako zapis webu.
    let v = vectors();
    let step = v["sequences"][3]["steps"][5]["after"].clone();
    let mut meta = Map::new();
    meta.insert(KEY_EVENTS.into(), step["events"].clone());
    meta.insert(KEY_STREAMS.into(), step["streams"].clone());
    meta.insert(KEY_LAST_WAR.into(), step["lastWar"].clone());
    meta.insert(KEY_P4_MILESTONES.into(), step["p4"].clone());
    let war = WarTurnState::from_meta_json(&meta);
    let out = war.to_meta_json();
    for (k, want) in &meta {
        assert_eq!(out.get(k), Some(want), "{k} round-trip");
    }
    let reg = CredibilityRegistry::from_meta(&war.opaque).unwrap();
    assert_eq!(
        Value::Object(reg.to_meta()),
        Value::Object(meta),
        "typowany odczyt/zapis == web"
    );
}

#[test]
fn malformed_registry_is_an_error_not_a_silent_empty() {
    for (key, bad) in [
        (KEY_EVENTS, json!("nie-tablica")),
        (
            KEY_EVENTS,
            json!([[1, [{"typ": "nieznany", "wartoscPierwotna": 1, "turaWystapienia": 1, "znak": "kara"}]]]),
        ),
        (
            KEY_STREAMS,
            json!([[1, [["2_x", {"typ": "strumien_nap"}]]]]),
        ),
        (KEY_LAST_WAR, json!([[1]])),
    ] {
        let mut meta = Map::new();
        meta.insert(key.into(), bad);
        assert!(CredibilityRegistry::from_meta(&meta).is_err(), "{key}");
    }
}

// ---------------------------------------------------------------------------------------------
// Test 3 tur przez run_war_turn (D2 zapisuje, D4 tika)
// ---------------------------------------------------------------------------------------------

const HUMAN: i64 = 1;
const AI_A: i64 = 2;
const AI_B: i64 = 3;

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

#[allow(non_snake_case)]
fn P(v: f64) -> Component {
    Component::Provided(v)
}

fn power(owner_id: i64, miasta: f64, jednostki: f64) -> ObjectivePowerRaw {
    ObjectivePowerRaw {
        owner_id,
        epoka: 1.0,
        jednostki: P(jednostki),
        wygrane_bitwy: P(0.0),
        bitwy_pkt_sum: Component::ExplicitZero,
        suma_ludkow: P(0.0),
        rekrut_ekw: P(0.0),
        miasta: P(miasta),
        heksy_terytorium: P(0.0),
        budynki: P(0.0),
        tech_zbadane: P(0.0),
        ulepszenia_terenu: P(0.0),
        kultura_imperium: Component::ExplicitZero,
        miasta_jednosc_religii: Component::ExplicitZero,
        zdobycze_power: Component::ExplicitZero,
    }
}

fn facts(city_count: f64) -> OwnerFacts {
    OwnerFacts {
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count,
    }
}

fn world_inputs() -> WarTurnInputs {
    let mut inputs = WarTurnInputs {
        me_id: HUMAN,
        human_ids: vec![HUMAN],
        contacts: vec![AI_A, AI_B],
        city_owner_ids: vec![HUMAN, AI_A, AI_A, AI_B],
        ai_start_owner_ids: vec![AI_A, AI_B],
        ..WarTurnInputs::default()
    };
    inputs.owner_facts.insert(HUMAN, facts(1.0));
    inputs.owner_facts.insert(AI_A, facts(2.0));
    inputs.owner_facts.insert(AI_B, facts(1.0));
    for id in [HUMAN, AI_A, AI_B] {
        inputs.epochs.insert(id, 1.0);
    }
    inputs.power_raw.insert(HUMAN, power(HUMAN, 1.0, 1.0));
    inputs.power_raw.insert(AI_A, power(AI_A, 2.0, 3.0));
    inputs.power_raw.insert(AI_B, power(AI_B, 1.0, 1.0));
    inputs.peace_locks = Some(PeaceLockFacts::default());
    inputs.dipl = DiplStepsInputs {
        treasury: BTreeMap::from([(HUMAN, 100.0), (AI_A, 0.0), (AI_B, 50.0)]),
        capital_city: BTreeMap::from([(HUMAN, "10".to_owned())]),
        army_m: BTreeMap::from([(AI_A, 3.0), (AI_B, 1.0), (HUMAN, 1.0)]),
        ..DiplStepsInputs::default()
    };
    inputs
}

fn config() -> WarTurnConfig {
    let mut params: BTreeMap<PairKey, PairWarParams> = BTreeMap::new();
    params.insert(
        (AI_A, AI_B),
        PairWarParams {
            prog: 1000.0,
            n: 2.0,
        },
    );
    WarTurnConfig::new(params, false)
}

fn run_turn(
    war: &mut WarTurnState,
    turn: f64,
    inputs: &WarTurnInputs,
) -> Result<WarTurnReport, WarTurnError> {
    let cfg = config();
    let mut ctx = WarTurnContext {
        war,
        turn,
        inputs,
        config: &cfg,
    };
    run_war_turn(&mut ctx)
}

fn world_state() -> WarTurnState {
    // Swiat z fixture'a zapisu sprzed zmiany: NAP 1-2 (wygasa w t3), sojusz 1-3, szlaki 2-3.
    let meta = meta_of(&serde_json::from_str::<Value>(SAVE_BEFORE).unwrap());
    let mut war = WarTurnState::from_meta_json(&meta);
    war.diplomacy.set_relation(
        civ_engine::domain::diplomacy::CivilizationPair::new(p(AI_A), p(AI_B)),
        civ_engine::domain::diplomacy::Relation::new(50.0, 0.0, RelationStatus::Peace),
    );
    war
}

fn reg_of(war: &WarTurnState) -> CredibilityRegistry {
    CredibilityRegistry::from_meta(&war.opaque).expect("rejestr")
}

fn stream_sum_of(reg: &CredibilityRegistry, owner: i64, key: &str) -> Option<f64> {
    reg.streams
        .iter()
        .find(|(o, _)| *o == owner)?
        .1
        .iter()
        .find(|(k, _)| k == key)
        .map(|(_, e)| e.active_sum)
}

#[test]
fn three_turns_write_credibility_d2_finish_and_d4_streams() {
    let p_ = CredibilityParams::load();
    let inputs = world_inputs();
    let mut war = world_state();
    assert_eq!(reg_of(&war), CredibilityRegistry::default());

    // --- Tura 1: D4 tika S2 (NAP 1-2), S1 (sojusz 1-3), S3 (szlaki 2-3), po jednym razie na strone.
    let t1 = run_turn(&mut war, 1.0, &inputs).expect("tura 1");
    let r1 = reg_of(&war);
    assert_eq!(t1.dipl.credibility_stream_active.len(), 6);
    assert_eq!(stream_sum_of(&r1, HUMAN, "2_strumien_nap"), Some(p_.s2_nap));
    assert_eq!(stream_sum_of(&r1, AI_A, "1_strumien_nap"), Some(p_.s2_nap));
    assert_eq!(
        stream_sum_of(&r1, HUMAN, "3_strumien_sojusz"),
        Some(p_.s1_alliance)
    );
    assert_eq!(
        stream_sum_of(&r1, AI_B, "1_strumien_sojusz"),
        Some(p_.s1_alliance)
    );
    assert_eq!(
        stream_sum_of(&r1, AI_A, "3_strumien_handel"),
        Some(p_.s3_trade[1])
    );
    assert!(r1.events.is_empty(), "nic jeszcze nie wygaslo");
    assert!(war.opaque.contains_key(KEY_STREAMS) && !war.opaque.contains_key(KEY_EVENTS));
    let total_1 = r1.total_of(HUMAN, 1.0, Difficulty::Normal, p_);
    assert_eq!(total_1, p_.start_normal + p_.s2_nap + p_.s1_alliance);

    // --- Tura 2: strumienie narastaja.
    run_turn(&mut war, 2.0, &inputs).expect("tura 2");
    let r2 = reg_of(&war);
    assert_eq!(
        stream_sum_of(&r2, HUMAN, "2_strumien_nap"),
        Some(p_.s2_nap * 2.0)
    );
    assert_eq!(
        stream_sum_of(&r2, HUMAN, "3_strumien_sojusz"),
        Some(p_.s1_alliance * 2.0)
    );

    // --- Tura 3: NAP wygasa (D1): D2 ZAPISUJE `dotrwanie_nap` obu stronom, D4 czysci wpis strumienia NAP.
    let t3 = run_turn(&mut war, 3.0, &inputs).expect("tura 3");
    assert_eq!(t3.dipl.expired_deals, vec!["nap-12".to_owned()]);
    let r3 = reg_of(&war);
    for owner in [HUMAN, AI_A] {
        let ev = r3.events_of(owner);
        assert_eq!(ev.len(), 1, "wlasciciel {owner}");
        assert_eq!(ev[0].typ, CredibilityEvent::DotrwanieNap);
        assert_eq!(ev[0].original_value, p_.p2_nap);
        assert_eq!(ev[0].turn_occurred, 3.0);
        assert_eq!(ev[0].sign, EventSign::Reward);
    }
    assert!(r3.events_of(AI_B).is_empty());
    assert_eq!(
        stream_sum_of(&r3, HUMAN, "2_strumien_nap"),
        None,
        "C-WIAR-SLAD=A: wpis znika natychmiast"
    );
    assert_eq!(stream_sum_of(&r3, AI_A, "1_strumien_nap"), None);
    assert_eq!(
        stream_sum_of(&r3, HUMAN, "3_strumien_sojusz"),
        Some(p_.s1_alliance * 3.0)
    );
    // wlasciciel z oproznionym wpisem zostaje na liscie (jak pusta `Map` w webie)
    assert!(r3
        .streams
        .iter()
        .any(|(o, m)| *o == AI_A && m.iter().all(|(k, _)| k != "1_strumien_nap")));
    // rejestr w zapisie
    let meta = war.to_meta_json();
    assert!(meta.contains_key(KEY_EVENTS) && meta.contains_key(KEY_STREAMS));
    // R-RUSTPORT-P6-CRED-WOJNA-Q1: fixture ma wojne AI-AI z hamulca w turze 2 (N = 2), wiec hak P4
    // zapisuje licznik "ostatnia wojna" obu stron (web `main.ts:12223-12224`). Milestone P4 nadal brak.
    assert!(meta.contains_key(KEY_LAST_WAR) && !meta.contains_key(KEY_P4_MILESTONES));
    assert_eq!(
        reg_of(&war)
            .last_war_turn
            .iter()
            .filter(|(_, t)| *t == 2.0)
            .count(),
        2,
        "obie strony wojny AI-AI w turze 2"
    );

    // --- Zapis -> odczyt -> tura 4 daje to samo co ciagla gra (rejestr przechodzi przez zapis).
    let mut reloaded = WarTurnState::from_meta_json(&meta);
    assert_eq!(reg_of(&reloaded), r3);
    run_turn(&mut war, 4.0, &inputs).expect("tura 4");
    run_turn(&mut reloaded, 4.0, &inputs).expect("tura 4 po wczytaniu");
    assert_eq!(reg_of(&war), reg_of(&reloaded));
    assert_eq!(
        stream_sum_of(&reg_of(&war), HUMAN, "3_strumien_sojusz"),
        Some(p_.s1_alliance * 4.0)
    );
    // wiarygodnosc calkowita: start + nagroda (przy `turn == tura wyst.` bez zapominania) + strumienie
    let t = reg_of(&war).total_of(HUMAN, 3.0, Difficulty::Normal, p_);
    assert!(t > p_.start_normal, "{t}");
}

#[test]
fn difficulty_changes_stream_weights() {
    let mut inputs = world_inputs();
    inputs.dipl.difficulty = Difficulty::Hard;
    let mut war = world_state();
    run_turn(&mut war, 1.0, &inputs).expect("tura");
    let p_ = CredibilityParams::load();
    assert_eq!(
        stream_sum_of(&reg_of(&war), AI_A, "3_strumien_handel"),
        Some(p_.s3_trade[2])
    );
    assert_ne!(
        p_.s3_trade[2], p_.s3_trade[1],
        "wagi S3 zalezne od trudnosci"
    );
}

#[test]
fn p4_milestone_runs_in_pipeline_and_excludes_barbarians() {
    let mut inputs = world_inputs();
    inputs.dipl.credibility_excluded_owners.insert(AI_B);
    let mut war = world_state();
    let p_ = CredibilityParams::load();
    // tura 30 = pierwszy kamien (okno 30 tur od tury 0 bez zapisu `ostatniaWojnaTura`)
    run_turn(&mut war, p_.p4_window, &inputs).expect("tura 30");
    let reg = reg_of(&war);
    for owner in [HUMAN, AI_A] {
        let ev = reg.events_of(owner);
        assert!(
            ev.iter()
                .any(|e| e.typ == CredibilityEvent::WieloletniPokoj
                    && e.original_value == p_.p4_value),
            "wlasciciel {owner}"
        );
    }
    assert!(
        reg.events_of(AI_B).is_empty(),
        "wykluczony wlasciciel nie dostaje P4"
    );
    assert_eq!(
        reg.p4_milestones
            .iter()
            .find(|(o, _)| *o == HUMAN)
            .map(|(_, n)| *n),
        Some(1.0)
    );
    assert!(war.opaque.contains_key(KEY_P4_MILESTONES));
}

#[test]
fn malformed_registry_in_save_fails_turn_atomically() {
    let inputs = world_inputs();
    let mut war = world_state();
    war.opaque.insert(KEY_EVENTS.into(), json!("zepsuty"));
    let before = war.clone();
    let err = run_turn(&mut war, 1.0, &inputs).expect_err("zly zapis rejestru");
    assert!(
        matches!(err, WarTurnError::DiplStep(ref m) if m.contains(KEY_EVENTS)),
        "{err}"
    );
    assert_eq!(war, before, "blad = zadnej zmiany stanu");
}

#[test]
fn deal_adapter_maps_every_treaty_kind() {
    let kinds = [
        (TreatyKind::Nap, StreamDealKind::Nap),
        (
            TreatyKind::DefensiveAlliance,
            StreamDealKind::DefensiveAlliance,
        ),
        (TreatyKind::FullAlliance, StreamDealKind::FullAlliance),
        (TreatyKind::Exchange, StreamDealKind::Exchange),
        (TreatyKind::TradeRoute, StreamDealKind::TradeRoute),
        (TreatyKind::Vassalization, StreamDealKind::Vassalization),
        (TreatyKind::MilitaryMarch, StreamDealKind::MilitaryMarch),
        (TreatyKind::OpenBorders, StreamDealKind::OpenBorders),
        (
            TreatyKind::BarbarianCooperation,
            StreamDealKind::BarbarianCooperation,
        ),
    ];
    for (k, want) in kinds {
        assert_eq!(stream_kind_of(k), want);
    }
    // D2: wygasniecie traktatu bez finiszu (wasalizacja, przemarsz) nie zapisuje nic
    let p_ = CredibilityParams::load();
    for k in [
        TreatyKind::Vassalization,
        TreatyKind::OpenBorders,
        TreatyKind::MilitaryMarch,
    ] {
        assert!(expiry_finish_events(k, false, false, p_).is_empty());
    }
}
