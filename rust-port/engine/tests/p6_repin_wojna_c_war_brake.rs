//! REPIN-WOJNA-NOWE-C - `gra/src/game/diplomacy-tick-war-brake.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_c_vectors/diplomacy-tick-war-brake.json`).

use civ_engine::domain::diplomacy_tick_war_brake::{
    advance_crisis_counter, ai_ai_pairs, crisis_pair_key, crisis_step_for_pair,
    dobra_wola_turn_step, is_ai_ai_eligible_owner, is_diplo_tick_war_brake_enabled,
    krok_pkt_wymiany, parse_crisis_counters, pick_war_declarer, sort_crisis_queue,
    trade_trust_bonus_per_tura, AiAiOwnerInfo, CrisisQueueEntry, CrisisStep, DobraWolaStep,
    TradeBonusInput, TradeBonusP7Params, WarBrakeP6Params, WarPower,
    DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT,
};
use serde_json::Value;
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_repin_wojna_c_vectors/diplomacy-tick-war-brake.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("diplomacy-tick-war-brake.json parse")
}

/// Liczba z wektora: tekst `String(x)` (`Infinity`, `-Infinity`, `NaN`, `-0`) albo liczba JSON.
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "NaN" => f64::NAN,
            "-0" => -0.0,
            other => other.parse::<f64>().expect("liczba"),
        },
        other => panic!("nieoczekiwany typ liczby: {other}"),
    }
}

fn p6_of(v: &Value) -> WarBrakeP6Params {
    WarBrakeP6Params {
        kryzys_prog_zaufania: num(&v["kryzysProgZaufania"]),
        kryzys_tur_do_wojny: num(&v["kryzysTurDoWojny"]),
        kryzys_ostrzezenie_tur_przed: num(&v["kryzysOstrzezenieTurPrzed"]),
    }
}

fn step_of(v: &Value) -> CrisisStep {
    CrisisStep {
        counter: num(&v["counter"]),
        warning_active: v["warningActive"].as_bool().expect("warningActive"),
        war_trigger_ready: v["warTriggerReady"].as_bool().expect("warTriggerReady"),
    }
}

/// Porownanie krokow: liczniki bit-w-bit (w tym -0 vs +0 nie wystepuje w wyjsciu).
fn assert_step(got: CrisisStep, want: CrisisStep, ctx: &str) {
    assert_eq!(
        got.counter.to_bits(),
        want.counter.to_bits(),
        "{ctx}: counter {got:?} vs {want:?}"
    );
    assert_eq!(got.warning_active, want.warning_active, "{ctx}: warning");
    assert_eq!(got.war_trigger_ready, want.war_trigger_ready, "{ctx}: war");
}

#[test]
fn default_and_flag_match_web() {
    assert_eq!(
        DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT,
        root()["defaultFlag"].as_bool().unwrap()
    );
    let root = root();
    let cases = root["flagCases"].as_array().expect("flagCases");
    assert_eq!(cases.len(), 3);
    for c in cases {
        let ov = c["override"].as_bool();
        assert_eq!(
            is_diplo_tick_war_brake_enabled(ov),
            c["enabled"].as_bool().unwrap(),
            "override {ov:?}"
        );
    }
}

#[test]
fn advance_crisis_counter_matches_web() {
    let root = root();
    let cases = root["advanceCases"].as_array().expect("advanceCases");
    assert!(cases.len() >= 900);
    for (i, c) in cases.iter().enumerate() {
        let got = advance_crisis_counter(num(&c["prev"]), num(&c["zaufanie"]), &p6_of(&c["p6"]));
        assert_step(got, step_of(&c["out"]), &format!("advanceCases[{i}]"));
    }
}

#[test]
fn crisis_step_for_pair_matches_web() {
    let root = root();
    let cases = root["stepCases"].as_array().expect("stepCases");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let got = crisis_step_for_pair(
            num(&c["prev"]),
            num(&c["zaufanie"]),
            c["atWar"].as_bool().unwrap(),
            &p6_of(&c["p6"]),
        );
        assert_step(got, step_of(&c["out"]), &format!("stepCases[{i}]"));
    }
}

#[test]
fn crisis_pair_key_matches_web() {
    let root = root();
    let cases = root["pairCases"].as_array().expect("pairCases");
    for (i, c) in cases.iter().enumerate() {
        let a = c["a"].as_i64().unwrap();
        let b = c["b"].as_i64().unwrap();
        assert_eq!(
            crisis_pair_key(a, b),
            c["out"].as_str().unwrap(),
            "pairCases[{i}]"
        );
        assert_eq!(crisis_pair_key(a, b), crisis_pair_key(b, a));
    }
}

// --- jawne przypadki brzegowe P6 ---

fn p6(prog: f64, tur: f64, ostrz: f64) -> WarBrakeP6Params {
    WarBrakeP6Params {
        kryzys_prog_zaufania: prog,
        kryzys_tur_do_wojny: tur,
        kryzys_ostrzezenie_tur_przed: ostrz,
    }
}

#[test]
fn crisis_counter_hysteresis_and_thresholds() {
    let p = p6(0.0, 5.0, 2.0);
    // Zaufanie rowne progowi liczy sie jako kryzys (<=).
    assert_eq!(advance_crisis_counter(0.0, 0.0, &p).counter, 1.0);
    // Zaufanie powyzej progu zeruje licznik.
    assert_eq!(advance_crisis_counter(4.0, 0.5, &p).counter, 0.0);
    // NaN Zaufania: porownanie falszywe -> brak kryzysu.
    assert_eq!(advance_crisis_counter(4.0, f64::NAN, &p).counter, 0.0);
    // Ostrzezenie od N - 2 = 3, wojna od N = 5.
    let s3 = advance_crisis_counter(2.0, -1.0, &p);
    assert!(s3.warning_active && !s3.war_trigger_ready);
    let s5 = advance_crisis_counter(4.0, -1.0, &p);
    assert!(s5.warning_active && s5.war_trigger_ready && s5.counter == 5.0);
    let s2 = advance_crisis_counter(1.0, -1.0, &p);
    assert!(!s2.warning_active && !s2.war_trigger_ready);
}

#[test]
fn crisis_counter_sanitizes_previous_value() {
    let p = p6(0.0, 5.0, 2.0);
    // Niefinite / ujemne / NaN poprzednie wartosci -> 0, ulamki obcinane w dol.
    assert_eq!(advance_crisis_counter(f64::NAN, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(f64::INFINITY, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(-7.0, -1.0, &p).counter, 1.0);
    assert_eq!(advance_crisis_counter(2.9, -1.0, &p).counter, 3.0);
}

#[test]
fn crisis_step_at_war_resets_counter() {
    let p = p6(0.0, 5.0, 2.0);
    let s = crisis_step_for_pair(4.0, -10.0, true, &p);
    assert_eq!(
        s,
        CrisisStep {
            counter: 0.0,
            warning_active: false,
            war_trigger_ready: false
        }
    );
}

#[test]
fn flag_override_wins_over_default() {
    assert!(is_diplo_tick_war_brake_enabled(None));
    assert!(!is_diplo_tick_war_brake_enabled(Some(false)));
    assert!(is_diplo_tick_war_brake_enabled(Some(true)));
}

/// Porownanie liczb jak `Object.is`: NaN = NaN, -0 != +0.
fn same_f64(got: f64, want: f64) -> bool {
    (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits()
}

fn p7_of(v: &Value) -> TradeBonusP7Params {
    let table: BTreeMap<i64, f64> = v["wymianaKrokPktPerEpoka"]
        .as_object()
        .expect("tabela krokow")
        .iter()
        .map(|(k, val)| (k.parse::<i64>().expect("klucz epoki"), num(val)))
        .collect();
    TradeBonusP7Params {
        wymiana_krok_pkt_per_epoka: table,
        wymiana_mnoznik_na_epoke: num(&v["wymianaMnoznikNaEpoke"]),
        wymiana_zaufanie_na_krok: num(&v["wymianaZaufanieNaKrok"]),
        wymiana_max_per_tura: num(&v["wymianaMaxPerTura"]),
        wymiana_sufit_zaufania: num(&v["wymianaSufitZaufania"]),
        wymiana_min_tur_dostaw: num(&v["wymianaMinTurDostaw"]),
    }
}

#[test]
fn krok_pkt_wymiany_matches_web() {
    let root = root();
    let cases = root["krokCases"].as_array().expect("krokCases");
    assert!(cases.len() >= 700);
    for (i, c) in cases.iter().enumerate() {
        let got = krok_pkt_wymiany(num(&c["epoka"]), &p7_of(&c["p7"]));
        assert!(
            same_f64(got, num(&c["out"])),
            "krokCases[{i}]: {got} vs {}",
            c["out"]
        );
    }
}

#[test]
fn trade_trust_bonus_matches_web() {
    let root = root();
    let cases = root["tradeCases"].as_array().expect("tradeCases");
    assert!(cases.len() >= 1000);
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["input"];
        let input = TradeBonusInput {
            nadwyzka_pn: num(&inp["nadwyzkaPn"]),
            epoka: num(&inp["epoka"]),
            zaufanie: num(&inp["zaufanie"]),
            kolejne_tury_dostaw: num(&inp["kolejneTuryDostaw"]),
        };
        let got = trade_trust_bonus_per_tura(&input, &p7_of(&c["p7"]));
        assert!(
            same_f64(got, num(&c["out"])),
            "tradeCases[{i}]: {got} vs {}",
            c["out"]
        );
    }
}

#[test]
fn parse_crisis_counters_matches_web() {
    let root = root();
    let cases = root["parseCases"].as_array().expect("parseCases");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let got = parse_crisis_counters(&c["raw"]);
        let mut got: Vec<(String, f64)> = got;
        got.sort_by(|a, b| a.0.cmp(&b.0));
        let mut want: Vec<(String, f64)> = c["out"]
            .as_object()
            .expect("out obiekt")
            .iter()
            .map(|(k, v)| (k.clone(), num(v)))
            .collect();
        want.sort_by(|a, b| a.0.cmp(&b.0));
        assert_eq!(got.len(), want.len(), "parseCases[{i}] dlugosc");
        for (g, w) in got.iter().zip(want.iter()) {
            assert!(
                g.0 == w.0 && same_f64(g.1, w.1),
                "parseCases[{i}]: {g:?} vs {w:?}"
            );
        }
    }
}

#[test]
fn sort_crisis_queue_matches_web() {
    let root = root();
    let cases = root["queueCases"].as_array().expect("queueCases");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let entries: Vec<CrisisQueueEntry> = c["entries"]
            .as_array()
            .expect("entries")
            .iter()
            .map(|e| CrisisQueueEntry {
                owner_a: e["ownerA"].as_i64().unwrap(),
                owner_b: e["ownerB"].as_i64().unwrap(),
                counter: num(&e["counter"]),
            })
            .collect();
        let got: Vec<(i64, i64, f64)> = sort_crisis_queue(&entries)
            .iter()
            .map(|e| (e.owner_a, e.owner_b, e.counter))
            .collect();
        let want: Vec<(i64, i64, f64)> = c["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|t| (t[0].as_i64().unwrap(), t[1].as_i64().unwrap(), num(&t[2])))
            .collect();
        assert_eq!(got, want, "queueCases[{i}]");
    }
}

#[test]
fn derived_params_file_matches_pinned_web_values() {
    let v: Value = serde_json::from_str(include_str!("../data/derived/diplomacy-tick-params.json"))
        .expect("diplomacy-tick-params.json parse");
    let got6 = p6_of(&v["p6"]);
    assert_eq!(got6, p6(0.0, 5.0, 2.0));
    let p7 = p7_of(&v["p7"]);
    let want: BTreeMap<i64, f64> = [(1, 100.0), (2, 200.0), (3, 400.0)].into_iter().collect();
    assert_eq!(p7.wymiana_krok_pkt_per_epoka, want);
    assert_eq!(p7.wymiana_mnoznik_na_epoke, 2.0);
    assert_eq!(p7.wymiana_zaufanie_na_krok, 0.5);
    assert_eq!(p7.wymiana_max_per_tura, 5.0);
    assert_eq!(p7.wymiana_sufit_zaufania, 60.0);
    assert_eq!(p7.wymiana_min_tur_dostaw, 2.0);
}

fn p7_default() -> TradeBonusP7Params {
    TradeBonusP7Params {
        wymiana_krok_pkt_per_epoka: [(1, 100.0), (2, 200.0), (3, 400.0)].into_iter().collect(),
        wymiana_mnoznik_na_epoke: 2.0,
        wymiana_zaufanie_na_krok: 0.5,
        wymiana_max_per_tura: 5.0,
        wymiana_sufit_zaufania: 60.0,
        wymiana_min_tur_dostaw: 2.0,
    }
}

#[test]
fn krok_edge_cases_explicit() {
    let p = p7_default();
    assert_eq!(krok_pkt_wymiany(2.0, &p), 200.0);
    // powyzej najwiekszego klucza: 400 * 2^(5-3)
    assert_eq!(krok_pkt_wymiany(5.0, &p), 1600.0);
    // luka w tabeli: najblizszy nizszy klucz
    let gap = TradeBonusP7Params {
        wymiana_krok_pkt_per_epoka: [(1, 100.0), (3, 400.0)].into_iter().collect(),
        ..p7_default()
    };
    assert_eq!(krok_pkt_wymiany(2.0, &gap), 100.0);
    // pusta tabela -> +Infinity
    let empty = TradeBonusP7Params {
        wymiana_krok_pkt_per_epoka: BTreeMap::new(),
        ..p7_default()
    };
    assert_eq!(krok_pkt_wymiany(2.0, &empty), f64::INFINITY);
    // NaN epoki: web idzie w galaz mnoznika -> NaN
    assert!(krok_pkt_wymiany(f64::NAN, &p).is_nan());
    // mnoznik 1 i nieskonczonosc epoki: Math.pow(1, Infinity) = NaN w JS
    let one = TradeBonusP7Params {
        wymiana_mnoznik_na_epoke: 1.0,
        ..p7_default()
    };
    assert!(krok_pkt_wymiany(f64::INFINITY, &one).is_nan());
}

#[test]
fn trade_bonus_stepwise_and_capped() {
    let p = p7_default();
    let base = |nadwyzka: f64, zaufanie: f64, tury: f64| TradeBonusInput {
        nadwyzka_pn: nadwyzka,
        epoka: 2.0,
        zaufanie,
        kolejne_tury_dostaw: tury,
    };
    // 399 / 200 = 1 pelny krok -> 0,5
    assert_eq!(trade_trust_bonus_per_tura(&base(399.0, 0.0, 2.0), &p), 0.5);
    // ponizej kroku -> 0
    assert_eq!(trade_trust_bonus_per_tura(&base(199.9, 0.0, 2.0), &p), 0.0);
    // limit 5,0 na ture
    assert_eq!(
        trade_trust_bonus_per_tura(&base(100_000.0, 0.0, 2.0), &p),
        5.0
    );
    // przyciete do wolnego miejsca pod sufitem (60 - 58 = 2)
    assert_eq!(
        trade_trust_bonus_per_tura(&base(1000.0, 58.0, 2.0), &p),
        2.0
    );
    // zaufanie na sufitem -> 0
    assert_eq!(
        trade_trust_bonus_per_tura(&base(1000.0, 60.0, 2.0), &p),
        0.0
    );
    // za krotka dostawa (1. tura) -> 0
    assert_eq!(trade_trust_bonus_per_tura(&base(1000.0, 0.0, 1.0), &p), 0.0);
    // NaN nadwyzki / zaufania -> 0 (warunki falszywe)
    assert_eq!(
        trade_trust_bonus_per_tura(&base(f64::NAN, 0.0, 2.0), &p),
        0.0
    );
    assert_eq!(
        trade_trust_bonus_per_tura(&base(1000.0, f64::NAN, 2.0), &p),
        0.0
    );
}

#[test]
fn sort_queue_ties_use_owner_ids() {
    let e = |a: i64, b: i64, c: f64| CrisisQueueEntry {
        owner_a: a,
        owner_b: b,
        counter: c,
    };
    let input = vec![e(2, 4, 3.0), e(3, 1, 3.0), e(2, 1, 3.0), e(5, 6, 5.0)];
    let got: Vec<(i64, i64)> = sort_crisis_queue(&input)
        .iter()
        .map(|x| (x.owner_a, x.owner_b))
        .collect();
    // counter 5 pierwszy; remis 3: min 1 (2-1 przed 3-1), potem min 2 (2-4)
    assert_eq!(got, vec![(5, 6), (2, 1), (3, 1), (2, 4)]);
    // wejscie nietkniete
    assert_eq!(input[0], e(2, 4, 3.0));
}

#[test]
fn parse_crisis_counters_drops_garbage() {
    let raw = serde_json::json!({ "1-2": 2.7, "0-3": 0, "a": "x", "c": -1, "d": null, "e": 4 });
    let mut got = parse_crisis_counters(&raw);
    got.sort_by(|a, b| a.0.cmp(&b.0));
    assert_eq!(got, vec![("1-2".to_string(), 2.0), ("e".to_string(), 4.0)]);
    assert!(parse_crisis_counters(&Value::Null).is_empty());
    assert!(parse_crisis_counters(&serde_json::json!([1, 2])).is_empty());
}

#[test]
fn pick_war_declarer_matches_web() {
    let root = root();
    let cases = root["declarerCases"].as_array().expect("declarerCases");
    assert!(cases.len() >= 400);
    for (i, c) in cases.iter().enumerate() {
        let w = |v: &Value| WarPower {
            owner_id: v["ownerId"].as_i64().expect("ownerId"),
            power: num(&v["power"]),
        };
        assert_eq!(
            pick_war_declarer(w(&c["a"]), w(&c["b"])),
            c["out"].as_i64().unwrap(),
            "declarerCases[{i}]"
        );
    }
}

#[test]
fn dobra_wola_turn_step_matches_web() {
    let root = root();
    let cases = root["dobraCases"].as_array().expect("dobraCases");
    assert_eq!(cases.len(), 12);
    for (i, c) in cases.iter().enumerate() {
        let got = dobra_wola_turn_step(num(&c["remaining"]));
        assert_eq!(
            got.active_this_turn,
            c["out"]["activeThisTurn"].as_bool().unwrap(),
            "dobraCases[{i}] active"
        );
        assert!(
            same_f64(got.next, num(&c["out"]["next"])),
            "dobraCases[{i}] next"
        );
    }
}

#[test]
fn ai_ai_eligibility_matches_web() {
    let root = root();
    let cases = root["eligCases"].as_array().expect("eligCases");
    assert!(cases.len() >= 300);
    for (i, c) in cases.iter().enumerate() {
        let o = &c["owner"];
        let info = AiAiOwnerInfo {
            is_player: o["isPlayer"].as_bool().unwrap(),
            is_barbarian: o["isBarbarian"].as_bool().unwrap(),
            is_city_copy: o["isCityCopy"].as_bool().unwrap(),
            eliminated: o["eliminated"].as_bool().unwrap(),
            city_count: num(&o["cityCount"]),
        };
        assert_eq!(
            is_ai_ai_eligible_owner(&info),
            c["out"].as_bool().unwrap(),
            "eligCases[{i}]"
        );
    }
}

#[test]
fn ai_ai_pairs_match_web() {
    let root = root();
    let cases = root["pairsCases"].as_array().expect("pairsCases");
    assert!(cases.len() >= 200);
    for (i, c) in cases.iter().enumerate() {
        let owners: Vec<i64> = c["owners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let want: Vec<(i64, i64)> = c["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        assert_eq!(ai_ai_pairs(&owners), want, "pairsCases[{i}]");
    }
}

#[test]
fn declarer_dobra_and_pairs_explicit_edges() {
    let w = |id: i64, power: f64| WarPower {
        owner_id: id,
        power,
    };
    assert_eq!(pick_war_declarer(w(4, 3.0), w(2, 3.0)), 2);
    assert_eq!(pick_war_declarer(w(4, 5.0), w(2, 3.0)), 4);
    // NaN potegi: `!==` prawdziwe, `>` falszywe -> strona b
    assert_eq!(pick_war_declarer(w(1, f64::NAN), w(9, 3.0)), 9);

    assert_eq!(
        dobra_wola_turn_step(3.0),
        DobraWolaStep {
            active_this_turn: true,
            next: 2.0
        }
    );
    assert_eq!(
        dobra_wola_turn_step(1.0),
        DobraWolaStep {
            active_this_turn: true,
            next: 0.0
        }
    );
    assert_eq!(
        dobra_wola_turn_step(0.5),
        DobraWolaStep {
            active_this_turn: false,
            next: 0.0
        }
    );
    assert_eq!(
        dobra_wola_turn_step(f64::NAN),
        DobraWolaStep {
            active_this_turn: false,
            next: 0.0
        }
    );

    let base = AiAiOwnerInfo {
        is_player: false,
        is_barbarian: false,
        is_city_copy: false,
        eliminated: false,
        city_count: 1.0,
    };
    assert!(is_ai_ai_eligible_owner(&base));
    assert!(!is_ai_ai_eligible_owner(&AiAiOwnerInfo {
        city_count: 0.0,
        ..base
    }));
    assert!(!is_ai_ai_eligible_owner(&AiAiOwnerInfo {
        city_count: f64::NAN,
        ..base
    }));
    assert!(!is_ai_ai_eligible_owner(&AiAiOwnerInfo {
        is_barbarian: true,
        ..base
    }));

    assert_eq!(ai_ai_pairs(&[1, 2, 3]), vec![(1, 2), (1, 3), (2, 3)]);
    assert!(ai_ai_pairs(&[7]).is_empty());
}
