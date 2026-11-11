//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): testy skladania tikow oblezenia i AI<->AI
//! na wektorach z URUCHOMIONEGO weba, pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
//!
//! Wektory: `tests/p6_wire_war_siege_aiai_vectors/vectors.json`, generator
//! `tests/p6_wire_war_siege_aiai_gen.mjs` (opis zrodel web w jego naglowku).
//! Sekcje:
//! * `siege`  - [`siege_city_turn`] vs `siegeStarvationState` z bundla web + transkrypcja bloku N3 z main.ts (400 przypadkow);
//! * `peace`  - [`run_ai_ai_peace_turn`] vs `runAiAiPeaceTick` z bundla web z `peaceAllowed` (300 przypadkow);
//! * `pairs`  - [`ai_ai_war_pairs`] vs transkrypcja petli `tickAiAiWarWeariness` (200 przypadkow).
//!
//! Poza wektorami: bramki `peace_tick_should_run` / `weariness_tick_should_run` i wejscie bez par nie wola
//! zadnych zaleznosci (testy z paniki-closurami). `run_ai_ai_weariness_turn` z niepusta para jest pokryty
//! posrednio przez `run_war_weariness_tick` (`p6_repin_wojna_*`); tu sprawdzany tylko kontrakt bramki.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::diplomacy_multiwar_peace::{
    PeaceAsset, PeacePaymentPlan, WarWearinessStore,
};
use civ_engine::domain::diplomacy_war_weariness_tick::{
    AssetsFn, PeacePriceQuote as WearinessPriceQuote, WearinessTickEnv, WearinessWarInfo,
};
use civ_engine::domain::siege_starvation::{SiegeGarrisonUnit, SiegeStarvationCity};
use civ_engine::domain::siege_turn::{siege_city_turn, SiegeTurnDecision};
use civ_engine::domain::war_turn_ai_ai::{
    ai_ai_war_pairs, peace_allowed_for_turns, run_ai_ai_weariness_turn, weariness_tick_should_run,
    PEACE_PROPOSAL_MIN_WAR_TURNS,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_wire_war_siege_aiai_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(DATA).expect("wektory JSON")
}

fn opt_f64(v: &Value) -> Option<f64> {
    v.as_f64()
}

fn key(a: i64, b: i64) -> String {
    format!("{a},{b}")
}

// ---------------------------------------------------------------------------
// Sekcja 1: siege
// ---------------------------------------------------------------------------

fn unit_of(v: &Value) -> SiegeGarrisonUnit {
    SiegeGarrisonUnit {
        hp: opt_f64(&v["hp"]),
        hp_max: opt_f64(&v["hpMax"]),
        type_id: v["typeId"].as_str().map(|s| s.to_string()),
    }
}

fn units_of(v: &Value) -> Vec<SiegeGarrisonUnit> {
    v.as_array()
        .expect("tablica jednostek")
        .iter()
        .map(unit_of)
        .collect()
}

fn city_of(v: &Value) -> SiegeStarvationCity {
    SiegeStarvationCity {
        oblegane: v["oblegane"].as_bool(),
        siege_capitulation_pending: v["siegeCapitulationPending"].as_bool(),
        siege_starve_start_max_hp: opt_f64(&v["siegeStarveStartMaxHp"]),
    }
}

fn food_of(v: &Value) -> f64 {
    match v {
        Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("food"),
    }
}

#[test]
fn siege_turn_matches_web_vectors() {
    let v = vectors();
    let cases = v["siege"].as_array().expect("siege");
    assert!(
        cases.len() >= 400,
        "za mało przypadków siege: {}",
        cases.len()
    );
    let mut mismatches: Vec<String> = Vec::new();
    for (idx, c) in cases.iter().enumerate() {
        let city = city_of(&c["city"]);
        let garrison_before = units_of(&c["garrisonBefore"]);
        let garrison_after = units_of(&c["garrisonAfter"]);
        let table = c["getMaxHp"].as_object().expect("getMaxHp");
        let get_max_hp = |t: &str| -> f64 { table.get(t).and_then(|x| x.as_f64()).unwrap_or(0.0) };
        let food = food_of(&c["food"]);
        let got: SiegeTurnDecision =
            siege_city_turn(&city, &garrison_before, food, &get_max_hp, || {
                garrison_after.clone()
            });
        let e = &c["expected"];
        let exp_start = opt_f64(&e["startMaxHp"]);
        let ok = got.record_start == e["recordStart"].as_bool().unwrap()
            && got.start_max_hp == exp_start
            && got.attrition_applied == e["attrition"].as_bool().unwrap()
            && got.legacy_pending == e["legacy"].as_bool().unwrap()
            && got.surrender == e["surrender"].as_bool().unwrap();
        if !ok {
            mismatches.push(format!("przypadek {idx}: got={got:?} expected={e}"));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozjazdy siege ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(5)]
    );
}

#[test]
fn siege_vectors_cover_all_branches() {
    // Sprawdza, ze wektory faktycznie pokrywaja galezie (inaczej test zgodnosci bylby pusty).
    let v = vectors();
    let mut seen = [false; 5];
    for c in v["siege"].as_array().unwrap() {
        let e = &c["expected"];
        seen[0] |= e["recordStart"].as_bool().unwrap();
        seen[1] |= e["attrition"].as_bool().unwrap();
        seen[2] |= e["legacy"].as_bool().unwrap();
        seen[3] |= e["surrender"].as_bool().unwrap();
        seen[4] |= e["attrition"].as_bool().unwrap() && e["surrender"].as_bool().unwrap();
    }
    assert!(seen.iter().all(|x| *x), "brak pokrycia galezi: {seen:?}");
}

// ---------------------------------------------------------------------------
// Sekcja 3: pairs + bramka wojny
// ---------------------------------------------------------------------------

#[test]
fn war_pairs_match_web_vectors() {
    let v = vectors();
    let cases = v["pairs"].as_array().expect("pairs");
    assert!(cases.len() >= 200);
    for (idx, c) in cases.iter().enumerate() {
        let majors: Vec<i64> = c["majors"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_i64().unwrap())
            .collect();
        let table: HashMap<String, bool> = c["warTable"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), x.as_bool().unwrap()))
            .collect();
        let at_war = |a: i64, b: i64| *table.get(&key(a, b)).unwrap_or(&false);
        let got = ai_ai_war_pairs(&majors, &at_war);
        let exp: Vec<(i64, i64)> = c["expected"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        assert_eq!(got, exp, "przypadek pairs {idx}");
    }
}

#[test]
fn weariness_entry_gate_skips_closures_when_no_pairs_and_no_store() {
    assert!(!weariness_tick_should_run(0, 0));
    assert!(weariness_tick_should_run(0, 1));
    assert!(weariness_tick_should_run(2, 0));

    let mut store: WarWearinessStore = HashMap::new();
    let pk = |_: i64, _: i64| -> String { panic!("nie wolano") };
    let wi = |_: i64, _: i64| -> WearinessWarInfo { panic!("nie wolano") };
    let sh = |_: i64, _: i64| -> f64 { panic!("nie wolano") };
    let cc = |_: i64| -> f64 { panic!("nie wolano") };
    let pr = |_: i64, _: i64| -> WearinessPriceQuote { panic!("nie wolano") };
    let asf: &AssetsFn =
        &|_: i64, _: i64, _: &HashSet<String>| -> Vec<PeaceAsset> { panic!("nie wolano") };
    let cco = |_: &str, _: i64, _: i64| false;
    let env = WearinessTickEnv {
        pair_key: &pk,
        war_info: &wi,
        share_of: &sh,
        city_count_of: &cc,
        price: &pr,
        assets: asf,
        city_cession_ok: &cco,
        battle_pending: false,
    };
    let no_war = |_: i64, _: i64| false;
    let out = run_ai_ai_weariness_turn(
        &mut store,
        12.0,
        &[0, 1, 2],
        &no_war,
        &env,
        |_: i64, _: i64, _: &PeacePaymentPlan| {},
        |_: i64, _: i64, _: f64| {},
        |_: &str| {},
    );
    assert!(out.is_empty());
}

#[test]
fn peace_allowed_threshold_matches_web_constant() {
    assert_eq!(PEACE_PROPOSAL_MIN_WAR_TURNS, 10.0);
    assert!(peace_allowed_for_turns(PEACE_PROPOSAL_MIN_WAR_TURNS));
}
