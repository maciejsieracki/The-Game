//! P6-WIRE-WAR-DIPLO-TURN (W6): testy `domain/ai_diplomacy_turn.rs` na wektorach WEBA.
//!
//! Wektory: `tests/p6_wire_war_diplo_vectors/{primitives,phase}.json`, generowane przez
//! `tests/p6_wire_war_diplo_gen.mjs` z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (origin/main).
//!
//!   - primitives: funkcje z `gra/src/game/diplomacy-tick-war-brake.ts` (bundle esbuild 0.24.2).
//!   - phase: transkrypcja galezi `brakeOn` z `gra/src/main.ts` `runDiplomacyTurnTick` (l.24229) na tych samych funkcjach.
//!
//! Liczby niefinite zapisane jako napisy ("NaN", "Infinity", "-Infinity") — `num()` je odczytuje.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::ai_diplomacy_turn::{
    brake_crisis_step, pair_key, run_brake_phase, BrakePhaseInput, BrakePhaseState, PairKey,
    PairWarParams, PhaseOwner,
};
use civ_engine::domain::diplomacy_tick_war_brake::{
    advance_crisis_counter, ai_ai_pairs, brake_war_outcome, crisis_pair_key, crisis_step_for_pair,
    dobra_wola_turn_step, is_ai_ai_eligible_owner, parse_crisis_counters, pick_war_declarer,
    sort_crisis_queue, AiAiOwnerInfo, CrisisQueueEntry, WarBrakeP6Params, WarPower,
};
use serde_json::Value;

const PRIMITIVES: &str = include_str!("p6_wire_war_diplo_vectors/primitives.json");
const PHASE: &str = include_str!("p6_wire_war_diplo_vectors/phase.json");

/// Parametry `diploTickP6` z webu (`gra/data/diplomacy-tick-params.json`, sekcja p6).
const P6: WarBrakeP6Params = WarBrakeP6Params {
    kryzys_prog_zaufania: 0.0,
    kryzys_tur_do_wojny: 5.0,
    kryzys_ostrzezenie_tur_przed: 2.0,
};

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("liczba w napisie"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn parse_key(s: &str) -> PairKey {
    let (a, b) = s.split_once('_').expect("klucz lo_hi");
    pair_key(a.parse().unwrap(), b.parse().unwrap())
}

fn key_map(v: &Value) -> BTreeMap<PairKey, f64> {
    v.as_object()
        .expect("obiekt")
        .iter()
        .map(|(k, v)| (parse_key(k), num(v)))
        .collect()
}

fn primitives() -> Value {
    serde_json::from_str(PRIMITIVES).expect("primitives.json")
}

fn phase() -> Value {
    serde_json::from_str(PHASE).expect("phase.json")
}

fn bool_of(v: &Value) -> bool {
    v.as_bool().expect("bool")
}

fn owner_info(v: &Value) -> AiAiOwnerInfo {
    AiAiOwnerInfo {
        is_player: bool_of(&v["isPlayer"]),
        is_barbarian: bool_of(&v["isBarbarian"]),
        is_city_copy: bool_of(&v["isCityCopy"]),
        eliminated: bool_of(&v["eliminated"]),
        city_count: num(&v["cityCount"]),
    }
}

fn war_power(v: &Value) -> WarPower {
    WarPower {
        owner_id: v["ownerId"].as_i64().unwrap(),
        power: num(&v["power"]),
    }
}

// ---------- primitives ----------

#[test]
fn advance_crisis_counter_matches_web() {
    let p = primitives();
    let rows = p["advanceCrisisCounter"].as_array().unwrap();
    assert!(!rows.is_empty());
    for r in rows {
        let got = advance_crisis_counter(num(&r["prev"]), num(&r["zaufanie"]), &P6);
        let out = &r["out"];
        assert!(same(got.counter, num(&out["counter"])), "row {r}");
        assert_eq!(
            got.warning_active,
            bool_of(&out["warningActive"]),
            "row {r}"
        );
        assert_eq!(
            got.war_trigger_ready,
            bool_of(&out["warTriggerReady"]),
            "row {r}"
        );
    }
}

#[test]
fn crisis_step_for_pair_matches_web() {
    let p = primitives();
    for r in p["crisisStepForPair"].as_array().unwrap() {
        let got = crisis_step_for_pair(
            num(&r["prev"]),
            num(&r["zaufanie"]),
            bool_of(&r["atWar"]),
            &P6,
        );
        let out = &r["out"];
        assert!(same(got.counter, num(&out["counter"])), "row {r}");
        assert_eq!(
            got.warning_active,
            bool_of(&out["warningActive"]),
            "row {r}"
        );
        assert_eq!(
            got.war_trigger_ready,
            bool_of(&out["warTriggerReady"]),
            "row {r}"
        );
    }
}

#[test]
fn crisis_pair_key_matches_web() {
    let p = primitives();
    for r in p["crisisPairKey"].as_array().unwrap() {
        let got = crisis_pair_key(r["a"].as_i64().unwrap(), r["b"].as_i64().unwrap());
        assert_eq!(got, r["out"].as_str().unwrap(), "row {r}");
    }
}

#[test]
fn pick_war_declarer_matches_web() {
    let p = primitives();
    for r in p["pickWarDeclarer"].as_array().unwrap() {
        let got = pick_war_declarer(war_power(&r["a"]), war_power(&r["b"]));
        assert_eq!(got, r["out"].as_i64().unwrap(), "row {r}");
    }
}

#[test]
fn brake_war_outcome_matches_web() {
    let p = primitives();
    for r in p["brakeWarOutcome"].as_array().unwrap() {
        let players: Vec<i64> = r["players"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let got = brake_war_outcome(war_power(&r["a"]), war_power(&r["b"]), |o| {
            players.contains(&o)
        });
        let out = &r["out"];
        assert_eq!(got.declarer, out["declarer"].as_i64().unwrap(), "row {r}");
        assert_eq!(got.victim, out["victim"].as_i64().unwrap(), "row {r}");
        assert_eq!(got.may_declare, bool_of(&out["mayDeclare"]), "row {r}");
    }
}

#[test]
fn sort_crisis_queue_matches_web() {
    let p = primitives();
    let row = &p["sortCrisisQueue"][0];
    let entries: Vec<CrisisQueueEntry> = row["entries"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| CrisisQueueEntry {
            owner_a: e["ownerA"].as_i64().unwrap(),
            owner_b: e["ownerB"].as_i64().unwrap(),
            counter: num(&e["counter"]),
        })
        .collect();
    let got = sort_crisis_queue(&entries);
    let want: Vec<(i64, i64)> = row["out"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| (e["ownerA"].as_i64().unwrap(), e["ownerB"].as_i64().unwrap()))
        .collect();
    let got_pairs: Vec<(i64, i64)> = got.iter().map(|e| (e.owner_a, e.owner_b)).collect();
    assert_eq!(got_pairs, want);
}

#[test]
fn dobra_wola_turn_step_matches_web() {
    let p = primitives();
    for r in p["dobraWolaTurnStep"].as_array().unwrap() {
        let got = dobra_wola_turn_step(num(&r["remaining"]));
        assert_eq!(
            got.active_this_turn,
            bool_of(&r["out"]["activeThisTurn"]),
            "row {r}"
        );
        assert!(same(got.next, num(&r["out"]["next"])), "row {r}");
    }
}

#[test]
fn ai_ai_eligibility_matches_web() {
    let p = primitives();
    for r in p["isAiAiEligibleOwner"].as_array().unwrap() {
        assert_eq!(
            is_ai_ai_eligible_owner(&owner_info(&r["o"])),
            bool_of(&r["out"]),
            "row {r}"
        );
    }
}

#[test]
fn ai_ai_pairs_matches_web() {
    let p = primitives();
    for r in p["aiAiPairs"].as_array().unwrap() {
        let owners: Vec<i64> = r["owners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let got = ai_ai_pairs(&owners);
        let want: Vec<(i64, i64)> = r["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        assert_eq!(got, want, "row {r}");
    }
}

#[test]
fn parse_crisis_counters_matches_web_as_set() {
    let p = primitives();
    let row = &p["parseCrisisCounters"][0];
    let got: BTreeMap<String, f64> = parse_crisis_counters(&row["raw"]).into_iter().collect();
    let want: BTreeMap<String, f64> = row["out"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| (p[0].as_str().unwrap().to_string(), num(&p[1])))
        .collect();
    assert_eq!(got, want);
}

// ---------- faza tury (ai_diplomacy_turn) ----------

#[test]
fn brake_crisis_step_updates_state_like_web() {
    // web: diploBrakeCrisisStep — wpis 0 usuwany, >0 zapisywany
    let mut st = BrakePhaseState::default();
    let params = PairWarParams { prog: 0.0, n: 5.0 };
    let s1 = brake_crisis_step(&mut st, (1, 2), -1.0, params, 2.0);
    assert_eq!(s1.counter, 1.0);
    assert_eq!(st.counters.get(&(1, 2)), Some(&1.0));
    let s2 = brake_crisis_step(&mut st, (1, 2), 3.0, params, 2.0);
    assert_eq!(s2.counter, 0.0);
    assert!(!st.counters.contains_key(&(1, 2)));
    st.at_war.insert((1, 2));
    let s3 = brake_crisis_step(&mut st, (1, 2), -9.0, params, 2.0);
    assert_eq!(s3.counter, 0.0);
    assert!(!st.counters.contains_key(&(1, 2)));
}

#[test]
fn phase_matches_web_transcription_over_turns() {
    let doc = phase();
    let mut scenarios_run = 0;
    let mut declared_in_five_turns = 0usize;
    for sc in doc["scenarios"].as_array().unwrap() {
        scenarios_run += 1;
        let me = sc["meId"].as_i64().unwrap();
        let contacts: Vec<i64> = sc["contacts"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let owners: Vec<PhaseOwner> = sc["owners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| {
                let id = v.as_i64().unwrap();
                PhaseOwner {
                    id,
                    info: AiAiOwnerInfo {
                        is_player: id == me,
                        is_barbarian: false,
                        is_city_copy: false,
                        eliminated: false,
                        city_count: sc["cityCount"].get(id.to_string()).map(num).unwrap_or(0.0),
                    },
                }
            })
            .collect();
        let power: BTreeMap<i64, f64> = sc["power"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.parse().unwrap(), num(v)))
            .collect();
        let params: BTreeMap<PairKey, PairWarParams> = sc["params"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| {
                (
                    parse_key(k),
                    PairWarParams {
                        prog: num(&v["prog"]),
                        n: num(&v["n"]),
                    },
                )
            })
            .collect();
        let mut state = BrakePhaseState {
            counters: key_map(&sc["initCounters"]),
            at_war: sc["war"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| parse_key(v.as_str().unwrap()))
                .collect(),
            dobra_remaining: key_map(&sc["initDobra"]),
        };
        for (ti, t) in sc["turns"].as_array().unwrap().iter().enumerate() {
            let rel = key_map(&t["input"]["rel"]);
            let peace: BTreeSet<PairKey> = t["input"]["peaceLocked"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| parse_key(v.as_str().unwrap()))
                .collect();
            let gate: BTreeSet<(i64, i64)> = t["input"]["gateBlocked"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| {
                    let s = v.as_str().unwrap();
                    let (d, vi) = s.split_once('>').unwrap();
                    (d.parse().unwrap(), vi.parse().unwrap())
                })
                .collect();
            let input = BrakePhaseInput {
                me_id: me,
                contacts: &contacts,
                owners: &owners,
                relation_after_tick: &rel,
                params: &params,
                ostrzezenie_tur_przed: P6.kryzys_ostrzezenie_tur_przed,
                power: &power,
                peace_locked: &peace,
                gate_blocked: &gate,
            };
            let out = run_brake_phase(&mut state, &input);
            let ex = &t["expect"];
            let label = format!("{} tura {}", sc["name"], ti + 1);

            let want_dobra: BTreeSet<PairKey> = ex["dobraActive"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| parse_key(v.as_str().unwrap()))
                .collect();
            assert_eq!(out.dobra_active, want_dobra, "{label}: dobraActive");

            let want_decl: Vec<(i64, i64)> = ex["declarations"]
                .as_array()
                .unwrap()
                .iter()
                .map(|d| {
                    (
                        d["declarer"].as_i64().unwrap(),
                        d["victim"].as_i64().unwrap(),
                    )
                })
                .collect();
            let got_decl: Vec<(i64, i64)> = out
                .declarations
                .iter()
                .map(|d| (d.declarer, d.victim))
                .collect();
            assert_eq!(got_decl, want_decl, "{label}: declarations");
            assert!(
                out.declarations.iter().all(|d| d.may_declare),
                "{label}: may_declare"
            );
            // Kontrakt pol declarations dla kazdej tury: deklaracja to para roznych
            // wlascicieli, nalezaca do wejscia tury, po ktorej para jest w `at_war`
            // i nie ma juz licznika kryzysu. Efekty (traktaty, UI) zostaja u callera.
            for d in &out.declarations {
                assert_ne!(d.declarer, d.victim, "{label}: declarer != victim");
                let key = pair_key(d.declarer, d.victim);
                assert!(
                    owners.iter().any(|o| o.id == d.declarer)
                        && owners.iter().any(|o| o.id == d.victim),
                    "{label}: deklarujacy i ofiara sa wlascicielami fazy"
                );
                assert!(
                    state.at_war.contains(&key),
                    "{label}: para po deklaracji w at_war"
                );
                assert!(
                    !state.counters.contains_key(&key),
                    "{label}: licznik usuniety po deklaracji"
                );
            }
            if sc["name"] == "ai_ai_five_turns_declare" {
                declared_in_five_turns += out.declarations.len();
            }

            assert_eq!(
                state.counters,
                key_map(&ex["counters"]),
                "{label}: counters"
            );
            let want_war: BTreeSet<PairKey> = ex["atWar"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| parse_key(v.as_str().unwrap()))
                .collect();
            assert_eq!(state.at_war, want_war, "{label}: atWar");
            assert_eq!(
                state.dobra_remaining,
                key_map(&ex["dobra"]),
                "{label}: dobra"
            );
        }
    }
    assert_eq!(scenarios_run, 6, "liczba scenariuszy z wektorow");
    assert!(
        declared_in_five_turns >= 1,
        "scenariusz ai_ai_five_turns_declare musi zawierac deklaracje wojny (kontrakt pol declarations)"
    );
}
