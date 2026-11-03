//! R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1: zgodnosc z URUCHOMIONYM webem (pin `4bbef081d`).
//! Wektory: `tests/p6_dyplomacja_truce_aggressor_vectors/*.json` (generator w katalogu runu, esbuild + prawdziwe
//! funkcje weba). Kodowanie liczb: NaN -> "NaN", Infinity -> "Infinity", -Infinity -> "-Infinity", null = brak.

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

use civ_engine::domain::alliance_war_obligation::{
    alliance_obligations, alliance_obligations_for_war_declaration,
    is_defensive_alliance_war_obligation, should_honor_alliance_war_obligation,
    treaties_broken_by_refusal, treaties_broken_by_war, AllianceEvent, AllianceObligation,
    AllianceWarObligationInput,
};
use civ_engine::domain::diplomacy::{
    is_currency_proposal_forbidden_during_war as existing_gate, ActiveDeal, BasketItem,
    BasketItemKind, ProposalAction, ProposalPayload,
};
use civ_engine::domain::diplomacy_aggressor::{
    aggressor_params, casus_belli_key, czy_agresor, czy_daje_flage_agresora, delta_relacji_sojusz,
    js_number_to_string, ma_casus_belli, mnoznik_willingness_ally, przyczyna_wypowiedzenia,
    serializuj_mape, ustaw_casus_belli, ustaw_flage_agresora, wczytaj_mape, AggressorEngineState,
    AggressorParams, CasusBelliParams, FlagaAgresora, TurnMap, WarCause, WarCauseInput, WplywNaAi,
};
use civ_engine::domain::diplomacy_truce::{
    filter_alliance_obligations_respecting_peace_lock, is_peace_treaty_locked, is_truce_active,
    is_truce_breach, normalize_truce_duration, pair_meta_from_save, pair_meta_to_save,
    start_peace_treaty_lock, truce_expiry_action, truce_until_turn, PairMetaWeb,
    TruceExpiryAction, PEACE_TREATY_LOCK_TURNS, TRUCE_DEFAULT_TURNS, TRUCE_DURATION_OPTIONS,
};
use civ_engine::domain::diplomacy_war_gates::{
    is_currency_proposal_forbidden_during_war, is_nap_blocking_war_declaration,
    is_peace_currency_action, payload_has_currency_payment, CurrencyBasketItem,
    CurrencyPayloadSlice, PEACE_CURRENCY_ACTION_IDS,
};
use civ_engine::domain::PlayerId;
use serde_json::{json, Number, Value};

fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_dyplomacja_truce_aggressor_vectors")
        .join(name);
    serde_json::from_str(&std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{p:?}: {e}")))
        .unwrap()
}

fn dec(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().unwrap(),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => panic!("nie liczba: {other}"),
        },
        other => panic!("nie liczba: {other:?}"),
    }
}

fn dec_opt(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(dec(v))
    }
}

fn num_value(x: f64) -> Value {
    if x == 0.0 {
        return json!(0);
    }
    if x.fract() == 0.0 && x.abs() < 9.0e15 {
        return json!(x as i64);
    }
    Value::Number(Number::from_f64(x).unwrap())
}

fn enc(x: f64) -> Value {
    if x.is_nan() {
        json!("NaN")
    } else if x == f64::INFINITY {
        json!("Infinity")
    } else if x == f64::NEG_INFINITY {
        json!("-Infinity")
    } else {
        num_value(x)
    }
}

fn enc_opt(x: Option<f64>) -> Value {
    x.map_or(Value::Null, enc)
}

/// Kanonizacja liczb (5 == 5.0) do porownan struktur JSON.
fn canon(v: &Value) -> Value {
    match v {
        Value::Number(n) => num_value(n.as_f64().unwrap()),
        Value::Array(a) => Value::Array(a.iter().map(canon).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, v)| (k.clone(), canon(v))).collect()),
        other => other.clone(),
    }
}

fn map_dec(v: &Value) -> TurnMap {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), dec(v)))
        .collect()
}

fn map_enc(m: &TurnMap) -> Value {
    Value::Object(m.iter().map(|(k, v)| (k.clone(), enc(*v))).collect())
}

fn params_dec(v: &Value) -> AggressorParams {
    if v.is_null() {
        return *aggressor_params();
    }
    AggressorParams {
        flaga_agresora: FlagaAgresora {
            trwa_tur: dec(&v["flagaAgresora"]["trwaTur"]),
        },
        wplyw_na_ai: WplywNaAi {
            relacja_delta_sojusz: dec(&v["wplywNaAI"]["relacjaDeltaSojusz"]),
            willingness_ally_mnoznik: dec(&v["wplywNaAI"]["willingnessAllyMnoznik"]),
        },
        casus_belli: CasusBelliParams {
            trwa_tur: dec(&v["casusBelli"]["trwaTur"]),
        },
    }
}

fn cause_dec(s: &str) -> WarCause {
    serde_json::from_value(json!(s)).unwrap()
}

fn cause_enc(c: WarCause) -> Value {
    serde_json::to_value(c).unwrap()
}

fn pid(v: &Value) -> PlayerId {
    PlayerId::new(v.as_u64().unwrap())
}

#[test]
fn constants_and_params_match_pin() {
    let t = load("truce.json");
    let p = &t["params"];
    assert_eq!(PEACE_TREATY_LOCK_TURNS, dec(&p["peaceLockTurns"]));
    assert_eq!(TRUCE_DEFAULT_TURNS, dec(&p["truceDefault"]));
    let opts: Vec<f64> = p["truceOptions"].as_array().unwrap().iter().map(dec).collect();
    assert_eq!(TRUCE_DURATION_OPTIONS.to_vec(), opts);
    let ids: Vec<&str> = p["peaceCurrencyIds"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(PEACE_CURRENCY_ACTION_IDS.to_vec(), ids);
    // dane z pliku JSON == AGGRESSOR_PARAMS z uruchomionego weba
    let web = params_dec(&p["aggressor"]);
    assert_eq!(*aggressor_params(), web);
    assert_eq!(web.flaga_agresora.trwa_tur, 20.0);
    assert_eq!(web.casus_belli.trwa_tur, 15.0);
}

#[test]
fn truce_basic_fns_match_web() {
    let t = load("truce.json");
    let g = &t["truce"];
    for r in g["normalize"].as_array().unwrap() {
        assert_eq!(
            enc_opt(normalize_truce_duration(dec_opt(&r["in"]))),
            r["out"],
            "normalize {r}"
        );
    }
    for r in g["untilTurn"].as_array().unwrap() {
        let got = truce_until_turn(dec(&r["start"]), dec(&r["dur"]));
        assert_eq!(canon(&enc_opt(got)), canon(&r["out"]), "untilTurn {r}");
    }
    for r in g["active"].as_array().unwrap() {
        assert_eq!(
            is_truce_active(dec_opt(&r["until"]), dec(&r["turn"])),
            r["out"].as_bool().unwrap(),
            "active {r}"
        );
    }
    for r in g["expiry"].as_array().unwrap() {
        let got = serde_json::to_value(truce_expiry_action(dec_opt(&r["until"]), dec(&r["turn"])))
            .unwrap();
        assert_eq!(got, r["out"], "expiry {r}");
    }
    for r in g["breach"].as_array().unwrap() {
        assert_eq!(
            is_truce_breach(dec_opt(&r["until"]), dec(&r["turn"])),
            r["out"].as_bool().unwrap(),
            "breach {r}"
        );
    }
    assert_eq!(
        truce_expiry_action(Some(5.0), 5.0),
        TruceExpiryAction::RevertToWar
    );
}

#[test]
fn peace_lock_matches_web() {
    let t = load("truce.json");
    let g = &t["truce"];
    for r in g["locked"].as_array().unwrap() {
        let turn = dec(&r["turn"]);
        let mut m = PairMetaWeb::default();
        let got = match r["meta"].as_str().unwrap() {
            "undefined" => is_peace_treaty_locked(None, turn),
            "nofield" => is_peace_treaty_locked(Some(&m), turn),
            "truceonly" => {
                m.truce_until_turn = Some(30.0);
                is_peace_treaty_locked(Some(&m), turn)
            }
            "peace" => {
                m.peace_until_turn = dec_opt(&r["until"]);
                is_peace_treaty_locked(Some(&m), turn)
            }
            other => panic!("meta {other}"),
        };
        assert_eq!(got, r["out"].as_bool().unwrap(), "locked {r}");
    }
    for r in g["startLock"].as_array().unwrap() {
        let meta: PairMetaWeb = serde_json::from_value(r["meta"].clone()).unwrap();
        let got = start_peace_treaty_lock(&meta, dec(&r["turn"]), dec_opt(&r["lockTurns"]));
        let got_v = serde_json::to_value(&got).unwrap();
        assert_eq!(canon(&got_v), canon(&r["out"]), "startLock {r}");
        // wejscie nie jest mutowane (web: kopia)
        assert_eq!(
            canon(&serde_json::to_value(&meta).unwrap()),
            canon(&r["meta"])
        );
    }
}

#[test]
fn peace_lock_filter_matches_web_including_call_order() {
    let t = load("truce.json");
    for r in t["truce"]["filter"].as_array().unwrap() {
        let obs: Vec<AllianceObligation> = serde_json::from_value(r["obligations"].clone()).unwrap();
        let locked: BTreeSet<(u64, u64)> = r["locked"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_u64().unwrap(), p[1].as_u64().unwrap()))
            .collect();
        let calls = RefCell::new(Vec::<Value>::new());
        let got = filter_alliance_obligations_respecting_peace_lock(&obs, |a, b| {
            calls.borrow_mut().push(json!([a.get(), b.get()]));
            locked.contains(&(a.get(), b.get()))
        });
        assert_eq!(
            canon(&serde_json::to_value(&got).unwrap()),
            canon(&r["out"]),
            "filter {r}"
        );
        assert_eq!(Value::Array(calls.into_inner()), r["calls"], "calls {r}");
    }
}

#[test]
fn pair_state_save_load_round_trip() {
    let t = load("truce.json");
    for r in t["truce"]["saveRound"].as_array().unwrap() {
        let parsed = pair_meta_from_save(&r["entries"]);
        assert_eq!(
            parsed.len(),
            r["entries"].as_array().unwrap().len(),
            "wszystkie pary odczytane"
        );
        let back = pair_meta_to_save(&parsed);
        assert_eq!(canon(&back), canon(&r["entries"]), "round-trip {r}");
        for (_, m) in &parsed {
            // truceUntilTurn / peaceUntilTurn przezywaja zapis, brak pola = None
            let v = serde_json::to_value(m).unwrap();
            assert_eq!(v.get("truceUntilTurn").is_some(), m.truce_until_turn.is_some());
        }
    }
    // stary zapis bez pola rozejmu = brak rozejmu; zly ksztalt pomijany
    let legacy = json!([["0-1", {"trustPnGainedThisTurn": 1, "dobraWolaRemainingTur": 0}], 5, ["x"]]);
    let parsed = pair_meta_from_save(&legacy);
    assert_eq!(parsed.len(), 1);
    assert_eq!(parsed[0].1.truce_until_turn, None);
    assert!(pair_meta_from_save(&json!({"a": 1})).is_empty());
    assert!(pair_meta_from_save(&Value::Null).is_empty());
}

fn payload_dec(v: &Value) -> Option<CurrencyPayloadSlice> {
    if v.is_null() {
        return None;
    }
    let items = |x: &Value| -> Option<Vec<CurrencyBasketItem>> {
        x.as_array().map(|a| {
            a.iter()
                .map(|i| CurrencyBasketItem {
                    typ: i["typ"].as_str().unwrap().to_string(),
                })
                .collect()
        })
    };
    Some(CurrencyPayloadSlice {
        gold_once: dec_opt(&v["goldOnce"]),
        gold_per_turn: dec_opt(&v["goldPerTurn"]),
        give_items: items(&v["giveItems"]),
        receive_items: items(&v["receiveItems"]),
    })
}

#[test]
fn war_gates_match_web() {
    let t = load("gates.json");
    let g = &t["gates"];
    for r in g["peaceCurrency"].as_array().unwrap() {
        assert_eq!(
            is_peace_currency_action(r["id"].as_str().unwrap()),
            r["out"].as_bool().unwrap(),
            "peaceCurrency {r}"
        );
    }
    for r in g["nap"].as_array().unwrap() {
        let b = r["in"].as_bool().unwrap();
        assert_eq!(is_nap_blocking_war_declaration(b), r["out"].as_bool().unwrap());
    }
    for r in g["payload"].as_array().unwrap() {
        let p = payload_dec(&r["payload"]);
        assert_eq!(
            payload_has_currency_payment(p.as_ref()),
            r["out"].as_bool().unwrap(),
            "payload {r}"
        );
    }
    for r in g["forbidden"].as_array().unwrap() {
        let p = payload_dec(&r["payload"]);
        let at_war = r["atWar"].as_bool();
        assert_eq!(
            is_currency_proposal_forbidden_during_war(
                r["id"].as_str().unwrap(),
                p.as_ref(),
                at_war
            ),
            r["out"].as_bool().unwrap(),
            "forbidden {r}"
        );
    }
}

#[test]
fn war_gates_existing_rust_gate_diverges_from_pin() {
    // Zgodnosc na typowych wejsciach (reuse sensowne): zloto w handlu zabronione, w pokoju dozwolone.
    let gold = ProposalPayload {
        gold_once: Some(5.0),
        ..ProposalPayload::default()
    };
    let slice = CurrencyPayloadSlice {
        gold_once: Some(5.0),
        ..CurrencyPayloadSlice::default()
    };
    assert!(existing_gate(ProposalAction::Trade, &gold, true));
    assert!(is_currency_proposal_forbidden_during_war("handel", Some(&slice), None));
    assert!(!existing_gate(ProposalAction::Peace, &gold, true));
    assert!(!is_currency_proposal_forbidden_during_war("pokoj", Some(&slice), None));
    // Rozbieznosc 1: goldOnce = Infinity (web: Infinity > 0 = true; istniejacy Rust wymaga is_finite).
    let inf = ProposalPayload {
        gold_once: Some(f64::INFINITY),
        ..ProposalPayload::default()
    };
    let inf_slice = CurrencyPayloadSlice {
        gold_once: Some(f64::INFINITY),
        ..CurrencyPayloadSlice::default()
    };
    assert!(!existing_gate(ProposalAction::Trade, &inf, true));
    assert!(is_currency_proposal_forbidden_during_war("handel", Some(&inf_slice), None));
    // Rozbieznosc 2: pozycja zloto o ilosci 0 (web: liczy sie typ, nie ilosc).
    let zero = ProposalPayload {
        give_items: vec![BasketItem::new(BasketItemKind::Gold, "zloto", 0.0)],
        ..ProposalPayload::default()
    };
    let zero_slice = CurrencyPayloadSlice {
        give_items: Some(vec![CurrencyBasketItem { typ: "zloto".into() }]),
        ..CurrencyPayloadSlice::default()
    };
    assert!(!existing_gate(ProposalAction::Trade, &zero, true));
    assert!(is_currency_proposal_forbidden_during_war("handel", Some(&zero_slice), None));
    // Rozbieznosc 3: akcja `rozejm` istnieje tylko jako lancuch (ProposalAction nie ma wariantu).
    assert!(!is_currency_proposal_forbidden_during_war("rozejm", Some(&slice), Some(true)));
}

#[test]
fn honor_alliance_war_obligation_matches_web() {
    let t = load("honor_treaties.json");
    let rows = t["honor"].as_array().unwrap();
    assert!(rows.len() > 6000);
    let (mut yes, mut no) = (0, 0);
    for r in rows {
        let i = &r["in"];
        let inp = AllianceWarObligationInput {
            ally_id: dec(&i["allyId"]),
            must_declare_war_on: dec(&i["mustDeclareWarOn"]),
            attacker_id: dec(&i["attackerId"]),
            victim_id: dec(&i["victimId"]),
            military_ratio: dec(&i["militaryRatio"]),
            active_war_count: dec(&i["activeWarCount"]),
            peaceful_archetype: i["peacefulArchetype"].as_bool().unwrap(),
            min_ratio_honor: dec_opt(&i["minRatioHonor"]),
            min_ratio_honor_peaceful: dec_opt(&i["minRatioHonorPeaceful"]),
            max_wars_before_refuse: dec_opt(&i["maxWarsBeforeRefuse"]),
            trust_to_requesting_ally: dec_opt(&i["trustToRequestingAlly"]),
            min_trust_honor: dec_opt(&i["minTrustHonor"]),
        };
        let got = should_honor_alliance_war_obligation(&inp);
        assert_eq!(got, r["out"].as_bool().unwrap(), "honor {r}");
        if got {
            yes += 1
        } else {
            no += 1
        }
    }
    assert!(yes > 500 && no > 500, "oba wyniki pokryte: {yes}/{no}");
}

#[test]
fn treaties_obligations_and_broken_by_war_match_web() {
    let t = load("honor_treaties.json");
    let tr = &t["treaties"];
    let (mut non_empty, mut broken_non_empty) = (0, 0);
    for r in tr["obligations"].as_array().unwrap() {
        let deals: Vec<ActiveDeal> = serde_json::from_value(r["deals"].clone()).unwrap();
        let (a, b) = (pid(&r["a"]), pid(&r["b"]));
        let declared = alliance_obligations(
            &deals,
            AllianceEvent::DeclaredWar {
                declarer_owner_id: a,
                target_owner_id: b,
            },
        );
        assert_eq!(
            canon(&serde_json::to_value(&declared).unwrap()),
            canon(&r["declared"]),
            "declared {r}"
        );
        let attacked = alliance_obligations(
            &deals,
            AllianceEvent::Attacked {
                victim_owner_id: a,
                aggressor_owner_id: b,
            },
        );
        assert_eq!(
            canon(&serde_json::to_value(&attacked).unwrap()),
            canon(&r["attacked"]),
            "attacked {r}"
        );
        let both = alliance_obligations_for_war_declaration(&deals, a, b);
        assert_eq!(
            canon(&serde_json::to_value(&both).unwrap()),
            canon(&r["forDeclaration"]),
            "forDeclaration {r}"
        );
        if !both.is_empty() {
            non_empty += 1;
        }
        let broken = treaties_broken_by_war(&deals, a, b);
        assert_eq!(json!(broken), r["brokenByWar"], "brokenByWar {r}");
        if !broken.is_empty() {
            broken_non_empty += 1;
        }
    }
    assert!(non_empty > 100 && broken_non_empty > 100);
    for r in tr["refusal"].as_array().unwrap() {
        let obs: Vec<AllianceObligation> = serde_json::from_value(r["obligations"].clone()).unwrap();
        let joined: Vec<PlayerId> = r["joined"].as_array().unwrap().iter().map(pid).collect();
        assert_eq!(
            json!(treaties_broken_by_refusal(&obs, &joined)),
            r["out"],
            "refusal {r}"
        );
    }
    for r in tr["defensive"].as_array().unwrap() {
        assert_eq!(
            is_defensive_alliance_war_obligation(pid(&r["must"]), pid(&r["attacker"])),
            r["out"].as_bool().unwrap()
        );
    }
}

#[test]
fn aggressor_pure_fns_match_web() {
    let t = load("aggressor.json");
    let a = &t["agg"];
    for r in a["daje"].as_array().unwrap() {
        assert_eq!(
            czy_daje_flage_agresora(cause_dec(r["cause"].as_str().unwrap())),
            r["out"].as_bool().unwrap()
        );
    }
    for r in a["cause"].as_array().unwrap() {
        let i = &r["in"];
        let flag = |k: &str| i.get(k).and_then(Value::as_bool).unwrap_or(false);
        let inp = WarCauseInput {
            hamulec: flag("hamulec"),
            wymuszona_epoka: flag("wymuszonaEpoka"),
            wymuszona_inna: flag("wymuszonaInna"),
            casus_belli_aktywny: flag("casusBelliAktywny"),
            zlamanie_rozejmu: flag("zlamanieRozejmu"),
        };
        assert_eq!(cause_enc(przyczyna_wypowiedzenia(&inp)), r["out"], "cause {r}");
        // serde wejscia (camelCase, brak pola = false) daje to samo
        let via_serde: WarCauseInput = serde_json::from_value(i.clone()).unwrap();
        assert_eq!(via_serde, inp);
    }
    for r in a["ustawFlage"].as_array().unwrap() {
        let got = ustaw_flage_agresora(
            &map_dec(&r["state"]),
            dec(&r["owner"]),
            dec(&r["turn"]),
            cause_dec(r["cause"].as_str().unwrap()),
            &params_dec(&r["params"]),
        );
        assert_eq!(canon(&map_enc(&got)), canon(&r["out"]), "ustawFlage {r}");
    }
    for r in a["czyAgresor"].as_array().unwrap() {
        assert_eq!(
            czy_agresor(&map_dec(&r["state"]), dec(&r["owner"]), dec(&r["turn"])),
            r["out"].as_bool().unwrap(),
            "czyAgresor {r}"
        );
    }
    for r in a["mnoznik"].as_array().unwrap() {
        let got = mnoznik_willingness_ally(r["flag"].as_bool().unwrap(), &params_dec(&r["params"]));
        assert_eq!(canon(&enc(got)), canon(&r["out"]), "mnoznik {r}");
    }
    for r in a["delta"].as_array().unwrap() {
        let got = delta_relacji_sojusz(r["flag"].as_bool().unwrap(), &params_dec(&r["params"]));
        assert_eq!(canon(&enc(got)), canon(&r["out"]), "delta {r}");
    }
    for r in a["key"].as_array().unwrap() {
        assert_eq!(
            casus_belli_key(dec(&r["a"]), dec(&r["b"])),
            r["out"].as_str().unwrap(),
            "key {r}"
        );
    }
    for r in a["ustawCasus"].as_array().unwrap() {
        let got = ustaw_casus_belli(
            &map_dec(&r["state"]),
            dec(&r["req"]),
            dec(&r["tgt"]),
            dec(&r["turn"]),
            &params_dec(&r["params"]),
        );
        assert_eq!(canon(&map_enc(&got)), canon(&r["out"]), "ustawCasus {r}");
    }
    for r in a["maCasus"].as_array().unwrap() {
        assert_eq!(
            ma_casus_belli(&map_dec(&r["state"]), dec(&r["req"]), dec(&r["tgt"]), dec(&r["turn"])),
            r["out"].as_bool().unwrap(),
            "maCasus {r}"
        );
    }
    for r in a["serializuj"].as_array().unwrap() {
        assert_eq!(
            canon(&map_enc(&serializuj_mape(&map_dec(&r["state"])))),
            canon(&r["out"]),
            "serializuj {r}"
        );
    }
    for r in a["wczytaj"].as_array().unwrap() {
        assert_eq!(
            canon(&map_enc(&wczytaj_mape(&r["raw"]))),
            canon(&r["out"]),
            "wczytaj {r}"
        );
    }
}

#[test]
fn aggressor_engine_state_sequences_and_save_load_match_web() {
    let t = load("aggressor.json");
    let mut total_active = 0;
    for (si, s) in t["agg"]["seq"].as_array().unwrap().iter().enumerate() {
        let mut st = AggressorEngineState::default();
        let ops = s["ops"].as_array().unwrap();
        let snaps = s["snaps"].as_array().unwrap();
        for (k, op) in ops.iter().enumerate() {
            match op["op"].as_str().unwrap() {
                "wyp" => st.zarejestruj_wypowiedzenie(
                    dec(&op["attacker"]),
                    dec(&op["turn"]),
                    cause_dec(op["cause"].as_str().unwrap()),
                ),
                "cb" => st.zarejestruj_casus_belli(dec(&op["req"]), dec(&op["tgt"]), dec(&op["turn"])),
                "reset" => st.reset(),
                "save" => {
                    // zapis Rust == zapis weba, potem odczyt zapisu weba
                    let saved = &op["saved"];
                    assert_eq!(
                        canon(&st.to_save_meta()),
                        canon(saved),
                        "seq {si} op {k}: zapis"
                    );
                    st = AggressorEngineState::from_save_meta(saved);
                }
                other => panic!("op {other}"),
            }
            let snap = &snaps[k];
            assert_eq!(
                canon(&map_enc(&st.aggressor_flag_until_by_owner)),
                canon(&snap["agg"]),
                "seq {si} op {k}: agg"
            );
            assert_eq!(
                canon(&map_enc(&st.casus_belli_until_by_pair)),
                canon(&snap["cb"]),
                "seq {si} op {k}: cb"
            );
            for q in snap["q"].as_array().unwrap() {
                let q = q.as_array().unwrap();
                if !q[3].is_boolean() {
                    // [owner, turn, aktywna, doTury]
                    let (o, tu) = (dec(&q[0]), dec(&q[1]));
                    assert_eq!(st.czy_agresor_aktywny(o, tu), q[2].as_bool().unwrap(), "{si}/{k} {q:?}");
                    assert_eq!(
                        canon(&enc_opt(st.do_tury_flagi_agresora(o, tu))),
                        canon(&q[3]),
                        "{si}/{k} doTury {q:?}"
                    );
                    if q[2].as_bool().unwrap() {
                        total_active += 1;
                    }
                } else {
                    // [req, tgt, turn, ma]
                    assert_eq!(
                        st.ma_casus_belli_aktywne(dec(&q[0]), dec(&q[1]), dec(&q[2])),
                        q[3].as_bool().unwrap(),
                        "{si}/{k} cb {q:?}"
                    );
                }
            }
        }
    }
    assert!(total_active > 100, "scenariusze obejmuja aktywne flagi: {total_active}");
}

#[test]
fn js_number_to_string_matches_js() {
    assert_eq!(js_number_to_string(0.0), "0");
    assert_eq!(js_number_to_string(-0.0), "0");
    assert_eq!(js_number_to_string(1.0), "1");
    assert_eq!(js_number_to_string(-1.0), "-1");
    assert_eq!(js_number_to_string(1.5), "1.5");
    assert_eq!(js_number_to_string(100.0), "100");
    assert_eq!(js_number_to_string(1e21), "1e+21");
    assert_eq!(js_number_to_string(1e20), "100000000000000000000");
    assert_eq!(js_number_to_string(1e-7), "1e-7");
    assert_eq!(js_number_to_string(0.000001), "0.000001");
    assert_eq!(js_number_to_string(f64::NAN), "NaN");
    assert_eq!(js_number_to_string(f64::INFINITY), "Infinity");
    assert_eq!(js_number_to_string(f64::NEG_INFINITY), "-Infinity");
}

#[test]
fn engine_state_semantics_spot_checks() {
    // flaga trwa dokladnie 20 tur: aktywna dla tury 5..24, nieaktywna w 25 (web: turn < doTury)
    let mut st = AggressorEngineState::default();
    st.zarejestruj_wypowiedzenie(1.0, 5.0, WarCause::BezPowodu);
    assert!(st.czy_agresor_aktywny(1.0, 24.0));
    assert!(!st.czy_agresor_aktywny(1.0, 25.0));
    assert_eq!(st.do_tury_flagi_agresora(1.0, 24.0), Some(25.0));
    assert_eq!(st.do_tury_flagi_agresora(1.0, 25.0), None);
    // wypowiedzenie z casus belli nie nadaje flagi
    st.zarejestruj_wypowiedzenie(2.0, 5.0, WarCause::CasusBelli);
    assert!(!st.czy_agresor_aktywny(2.0, 5.0));
    // casus belli 15 tur, nie wobec samego siebie
    st.zarejestruj_casus_belli(1.0, 2.0, 10.0);
    st.zarejestruj_casus_belli(3.0, 3.0, 10.0);
    assert!(st.ma_casus_belli_aktywne(1.0, 2.0, 24.0));
    assert!(!st.ma_casus_belli_aktywne(1.0, 2.0, 25.0));
    assert!(!st.ma_casus_belli_aktywne(2.0, 1.0, 11.0));
    assert!(!st.ma_casus_belli_aktywne(3.0, 3.0, 11.0));
    // stary zapis bez pol = pusty stan
    let empty = AggressorEngineState::from_save_meta(&json!({}));
    assert_eq!(empty, AggressorEngineState::default());
    // klucze map tylko ze skonczonymi liczbami; BTreeMap w zapisie
    let m: BTreeMap<String, f64> = BTreeMap::from([("1".to_string(), f64::NAN)]);
    assert!(serializuj_mape(&m).is_empty());
}
