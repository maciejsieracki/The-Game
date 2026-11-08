//! P6-FORCED-WAR-MODULES-Q1 (runda 2, partia G2a): zgodnosc parowania wojen wymuszonych i stanu zapisu
//! (`forced-war-common.ts`, pin `origin/main`) z URUCHOMIONYM webem.
//! Wektory: `tests/p6_forced_war_g2_data/cases.json` (generator: `gen_cases_g2.mjs`, Node 22, prawdziwe
//! funkcje weba). Liczby porownywane numerycznie (f64). Odleglosc heksowa: formula axialna
//! (rownowazna `hexDistance` z `units/setup.ts` przy dq+dr+ds=0; sprawdzona wektorami G1).

use std::collections::{HashMap, HashSet};

use civ_engine::domain::war_forced_bronze::*;
use civ_engine::domain::war_forced_common::{
    count_active_forced_wars_for_owner, ForcedWarNeighborCandidate,
    FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD,
};
use civ_engine::domain::war_forced_iron::*;
use civ_engine::domain::war_forced_pairing::*;
use serde_json::{json, Map, Value};

const G2: &str = include_str!("p6_forced_war_g2_data/cases.json");

/// Porownanie JSON z tolerancja typu liczbowego (JS nie rozroznia 5 i 5.0).
fn json_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => x.as_f64() == y.as_f64(),
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| json_eq(p, q))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, v)| y.get(k).is_some_and(|w| json_eq(v, w)))
        }
        _ => a == b,
    }
}

fn int(v: &Value) -> i64 {
    v.as_i64()
        .unwrap_or_else(|| v.as_f64().expect("liczba") as i64)
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn hd(aq: i32, ar: i32, bq: i32, br: i32) -> i64 {
    let dq = (aq - bq) as i64;
    let dr = (ar - br) as i64;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

fn era_of(v: &Value) -> Option<ForcedWarEraTag> {
    match v.as_str() {
        None => None,
        Some("bronze") => Some(ForcedWarEraTag::Bronze),
        Some("stone") => Some(ForcedWarEraTag::Stone),
        Some("iron") => Some(ForcedWarEraTag::Iron),
        Some(other) => panic!("nieznana epoka {other}"),
    }
}

fn era_json(e: ForcedWarEraTag) -> &'static str {
    match e {
        ForcedWarEraTag::Bronze => "bronze",
        ForcedWarEraTag::Stone => "stone",
        ForcedWarEraTag::Iron => "iron",
    }
}

fn pkey(a: i64, b: i64) -> (i64, i64) {
    (a.min(b), a.max(b))
}

fn subject(v: &Value) -> ForcedWarPairingSubject {
    ForcedWarPairingSubject {
        owner_id: int(&v["ownerId"]),
        q: int(&v["q"]) as i32,
        r: int(&v["r"]) as i32,
        era: era_of(&v["era"]),
    }
}

fn subjects(v: &Value) -> Vec<ForcedWarPairingSubject> {
    v.as_array()
        .expect("subjects")
        .iter()
        .map(subject)
        .collect()
}

/// Wejscie pairing -> wynik w formacie webowym (JSON).
fn run_pairing(input: &Value) -> Value {
    let subs = subjects(&input["subjects"]);
    let pairs: Vec<ForcedWarPairingExistingPair> = input["pairs"]
        .as_array()
        .expect("pairs")
        .iter()
        .map(|p| ForcedWarPairingExistingPair {
            attacker_id: int(&p["attackerId"]),
            target_id: int(&p["targetId"]),
            era: era_of(&p["era"]).expect("era pary"),
        })
        .collect();
    let pair_tuples: Vec<(i64, i64)> = pairs.iter().map(|p| (p.attacker_id, p.target_id)).collect();
    let blocked: HashSet<(i64, i64)> = input["blocked"]
        .as_array()
        .expect("blocked")
        .iter()
        .map(|b| pkey(int(&b[0]), int(&b[1])))
        .collect();
    let relations: Option<HashMap<(i64, i64), f64>> = input["relations"].as_array().map(|rows| {
        rows.iter()
            .map(|row| (pkey(int(&row[0]), int(&row[1])), num(&row[2])))
            .collect()
    });
    let exhausted: Option<HashSet<i64>> = input["exhausted"]
        .as_array()
        .map(|a| a.iter().map(int).collect());

    let is_pair_blocked = |a: i64, b: i64| blocked.contains(&pkey(a, b));
    let pair_relation = |a: i64, b: i64| -> f64 {
        relations
            .as_ref()
            .and_then(|m| m.get(&pkey(a, b)).copied())
            .unwrap_or(0.0)
    };
    let is_exhausted = |id: i64| exhausted.as_ref().is_some_and(|s| s.contains(&id));
    let total_active = |oid: i64| count_active_forced_wars_for_owner(oid, &pair_tuples);
    let hex = |aq: i32, ar: i32, bq: i32, br: i32| hd(aq, ar, bq, br);

    let pf_input = &input["playerFirst"];
    let gate_set: HashSet<i64>;
    let pf_candidates: Option<Vec<ForcedWarPairingSubject>>;
    let pf_owner: i64;
    let pf_storage;
    let player_first: Option<PlayerFirstOpts<'_>> = if pf_input.is_null() {
        None
    } else {
        gate_set = pf_input["gateOpen"]
            .as_array()
            .expect("gateOpen")
            .iter()
            .map(int)
            .collect();
        pf_candidates = pf_input["candidates"]
            .as_array()
            .map(|c| c.iter().map(subject).collect());
        pf_owner = int(&pf_input["playerOwnerId"]);
        pf_storage = (gate_set.clone(), pf_candidates);
        Some(PlayerFirstOpts {
            player_owner_id: pf_owner,
            is_player_pair_gate_open: &|oid| pf_storage.0.contains(&oid),
            candidates: pf_storage.1.as_deref(),
        })
    };

    let relation_fn = |a: i64, b: i64| pair_relation(a, b);
    let exhausted_fn = |id: i64| is_exhausted(id);
    let opts = ForcedWarPairingOpts {
        pair_relation_score: if relations.is_some() {
            Some(&relation_fn)
        } else {
            None
        },
        is_pair_blocked: &is_pair_blocked,
        is_era_war_exhausted: if exhausted.is_some() {
            Some(&exhausted_fn)
        } else {
            None
        },
        hex_distance: &hex,
        total_active_forced_wars_by_owner: &total_active,
        player_first,
    };
    let res = assign_forced_war_pairings(&subs, &pairs, &opts);

    let assignments: Vec<Value> = res
        .assignments
        .iter()
        .map(|a| json!({ "ownerId": a.owner_id, "era": era_json(a.era), "targetId": a.target_id }))
        .collect();
    json!({
        "assignments": assignments,
        "unresolvedOwnerIds": res.unresolved_owner_ids,
        "playerFirstPartnerId": res.player_first_partner_id,
    })
}

/// Zapis czesciowy z wektora (web `saved`; `null` = `undefined`).
fn saved_partial(v: &Value) -> Option<ForcedWarSavePartial> {
    if v.is_null() {
        return None;
    }
    let f = |k: &str| v.get(k).filter(|x| !x.is_null());
    Some(ForcedWarSavePartial {
        pending_owners: f("pendingOwners").map(|a| a.as_array().unwrap().iter().map(int).collect()),
        cycle_owners: f("cycleOwners").map(|a| a.as_array().unwrap().iter().map(int).collect()),
        rest_until_by_owner: f("restUntilByOwner").map(|a| {
            a.as_array()
                .unwrap()
                .iter()
                .map(|row| (int(&row[0]), num(&row[1])))
                .collect()
        }),
        active_by_pair_key: f("activeByPairKey").map(|a| {
            a.as_array()
                .unwrap()
                .iter()
                .map(|row| (row[0].as_str().unwrap().to_string(), pair_state(&row[1])))
                .collect()
        }),
    })
}

fn pair_state(v: &Value) -> ForcedWarPairState {
    ForcedWarPairState {
        attacker_id: int(&v["attackerId"]),
        target_id: int(&v["targetId"]),
        captured_by_attacker: int(&v["capturedByAttacker"]),
        captured_by_defender: int(&v["capturedByDefender"]),
        start_turn: v.get("startTurn").filter(|x| !x.is_null()).map(num),
    }
}

fn state_json(s: &ForcedWarSaveState) -> Value {
    let pairs: Vec<Value> = s
        .active_by_pair_key
        .iter()
        .map(|(k, p)| {
            let mut m = Map::new();
            m.insert("attackerId".into(), json!(p.attacker_id));
            m.insert("targetId".into(), json!(p.target_id));
            m.insert("capturedByAttacker".into(), json!(p.captured_by_attacker));
            m.insert("capturedByDefender".into(), json!(p.captured_by_defender));
            if let Some(t) = p.start_turn {
                m.insert("startTurn".into(), json!(t));
            }
            json!([k, Value::Object(m)])
        })
        .collect();
    json!({
        "pendingOwners": s.pending_owners,
        "cycleOwners": s.cycle_owners,
        "restUntilByOwner": s.rest_until_by_owner.iter().map(|(id, t)| json!([id, t])).collect::<Vec<_>>(),
        "activeByPairKey": pairs,
    })
}

fn run_roundtrip(input: &Value) -> Value {
    let partial = saved_partial(&input["saved"]);
    let restored = restore_forced_war_state(partial.as_ref());
    state_json(&serialize_forced_war_state(&restored))
}

#[test]
fn g2_pairing_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(G2).expect("cases.json");
    let mut checked = 0;
    let mut mismatches: Vec<String> = Vec::new();
    for (idx, c) in cases.iter().enumerate() {
        if c["fn"] != "assignForcedWarPairings" {
            continue;
        }
        checked += 1;
        let got = run_pairing(&c["in"]);
        if !json_eq(&got, &c["out"]) {
            mismatches.push(format!("#{idx} got={got} want={}", c["out"]));
        }
    }
    assert!(checked >= 80, "za malo wektorow parowania: {checked}");
    assert!(
        mismatches.is_empty(),
        "roznice parowania ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(5)]
    );
}

#[test]
fn g2_common_state_roundtrip_matches_web() {
    let cases: Vec<Value> = serde_json::from_str(G2).expect("cases.json");
    let mut checked = 0;
    for (idx, c) in cases.iter().enumerate() {
        if c["fn"] != "commonStateRoundtrip" {
            continue;
        }
        checked += 1;
        let got = run_roundtrip(&c["in"]);
        assert!(
            json_eq(&got, &c["out"]),
            "roznica roundtrip #{idx}: got={got} want={}",
            c["out"]
        );
    }
    assert!(checked >= 10, "za malo wektorow roundtrip: {checked}");
}

fn web_constant(name: &str) -> f64 {
    match name {
        "FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD" => FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD,
        "WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE" => {
            WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE as f64
        }
        "WOJNA_WYMUSZONA_ODPOCZYNEK_TUR" => WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
        "WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR" => {
            WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR
        }
        "WOJNA_WYMUSZONA_START_TURY_OD_EPOKI" => WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
        "WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR" => WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
        "EPOKA_ZELAZO_NUMER" => EPOKA_ZELAZO_NUMER as f64,
        "WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE" => {
            WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE as f64
        }
        "WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR" => {
            WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR
        }
        "WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR" => WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
        "WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR" => {
            WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR
        }
        "WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI" => WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI,
        other => panic!("nieznana stala {other}"),
    }
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn eligibility_input(v: &Value) -> (bool, bool, Option<f64>, Option<f64>) {
    (
        v["isMainAiCiv"].as_bool().expect("bool"),
        v["isAlreadyAtWarAnyRole"].as_bool().expect("bool"),
        v.get("currentTurn").and_then(opt_num),
        v.get("eraEnterTurn").and_then(opt_num),
    )
}

fn cands(v: &Value) -> Vec<ForcedWarNeighborCandidate> {
    v.as_array()
        .expect("kandydaci")
        .iter()
        .map(|c| ForcedWarNeighborCandidate {
            owner_id: int(&c["ownerId"]),
            q: int(&c["q"]) as i32,
            r: int(&c["r"]) as i32,
        })
        .collect()
}

fn target_input(
    v: &Value,
) -> (
    Vec<ForcedWarNeighborCandidate>,
    Option<(i32, i32)>,
    HashSet<i64>,
) {
    let reference = if v["ref"].is_null() {
        None
    } else {
        Some((int(&v["ref"]["q"]) as i32, int(&v["ref"]["r"]) as i32))
    };
    let blocked: HashSet<i64> = v["blocked"]
        .as_array()
        .expect("blocked")
        .iter()
        .map(int)
        .collect();
    (cands(&v["candidates"]), reference, blocked)
}

/// Wynik wyboru celu w formacie webowym (`null` gdy brak kandydata).
fn target_out(v: Option<i64>) -> Value {
    v.map_or(Value::Null, |id| json!(id))
}

#[test]
fn g2_bronze_iron_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(G2).expect("cases.json");
    let mut seen: HashMap<&str, usize> = HashMap::new();
    for (idx, c) in cases.iter().enumerate() {
        let fn_name = c["fn"].as_str().expect("fn");
        let inp = &c["in"];
        let got: Value = match fn_name {
            "assignForcedWarPairings" | "commonStateRoundtrip" => continue,
            "bronzeStateRoundtrip" | "ironStateRoundtrip" => {
                let partial = saved_partial(&inp["saved"]);
                let restored = if fn_name == "bronzeStateRoundtrip" {
                    restore_bronze_forced_war_state(partial.as_ref())
                } else {
                    restore_iron_forced_war_state(partial.as_ref())
                };
                let ser = if fn_name == "bronzeStateRoundtrip" {
                    serialize_bronze_forced_war_state(&restored)
                } else {
                    serialize_iron_forced_war_state(&restored)
                };
                state_json(&ser)
            }
            "isEligibleForBronzeForcedWar" | "isEligibleForIronForcedWar" => {
                let (main, war, cur, enter) = eligibility_input(inp);
                let e = BronzeForcedWarEligibilityInput {
                    is_main_ai_civ: main,
                    is_already_at_war_any_role: war,
                    current_turn: cur,
                    era_enter_turn: enter,
                };
                if fn_name == "isEligibleForBronzeForcedWar" {
                    json!(is_eligible_for_bronze_forced_war(&e))
                } else {
                    let ie = IronForcedWarEligibilityInput {
                        is_main_ai_civ: main,
                        is_already_at_war_any_role: war,
                        current_turn: cur,
                        era_enter_turn: enter,
                    };
                    json!(is_eligible_for_iron_forced_war(&ie))
                }
            }
            "pickBronzeForcedWarTargetId" | "pickIronForcedWarTargetId" => {
                let (cs, reference, blocked) = target_input(inp);
                let hex = |aq: i32, ar: i32, bq: i32, br: i32| hd(aq, ar, bq, br);
                let id = if fn_name == "pickBronzeForcedWarTargetId" {
                    pick_bronze_forced_war_target_id(&cs, reference, hex, &blocked)
                } else {
                    pick_iron_forced_war_target_id(&cs, reference, hex, &blocked)
                };
                target_out(id)
            }
            "isRestingFromBronzeForcedWar" => json!(is_resting_from_bronze_forced_war(
                num(&inp["cur"]),
                inp.get("rest").and_then(opt_num)
            )),
            "isRestingFromIronForcedWar" => json!(is_resting_from_iron_forced_war(
                num(&inp["cur"]),
                inp.get("rest").and_then(opt_num)
            )),
            "isIronEraEntry" => json!(is_iron_era_entry(int(&inp["prev"]), int(&inp["next"]))),
            "constant" => json!(web_constant(inp["name"].as_str().expect("name"))),
            other => panic!("nieznana funkcja {other}"),
        };
        *seen.entry(fn_name).or_insert(0) += 1;
        assert!(
            json_eq(&got, &c["out"]),
            "roznica #{idx} {fn_name}: got={got} want={}",
            c["out"]
        );
    }
    for name in [
        "isEligibleForBronzeForcedWar",
        "isEligibleForIronForcedWar",
        "pickBronzeForcedWarTargetId",
        "pickIronForcedWarTargetId",
        "bronzeStateRoundtrip",
        "ironStateRoundtrip",
        "isRestingFromBronzeForcedWar",
        "isRestingFromIronForcedWar",
        "isIronEraEntry",
        "constant",
    ] {
        assert!(
            seen.get(name).copied().unwrap_or(0) >= 1,
            "brak wektorow: {name}"
        );
    }
}
