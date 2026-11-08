//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 551 AIDRA): zgodnosc `planHomeWar` z URUCHOMIONYM webem.
//!
//! Wektory: `tests/p6_repin_ai_home_vectors.json`, generator: `tests/p6_repin_ai_home_gen.mjs`
//! (Node 22, `origin/main` `gra/src/game/ai-war-home-defense.ts`, pin 14f2af1b0; PRNG seed 551).
//! Kazdy scenariusz to sekwencja tur z jedna pamiecia histerezy (`HomeWarMemoryStore`).

use std::collections::HashSet;

use civ_engine::domain::war_home_defense::{
    HomeWarCity, HomeWarMemoryStore, HomeWarMode, HomeWarOrder, HomeWarPlan, HomeWarRecapture,
    HomeWarTask, HomeWarUnit, RecaptureMode,
};
use civ_engine::domain::war_home_defense_plan::{plan_home_war, HomeWarInput};
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_repin_ai_home_vectors.json");
const ME: i64 = 0;

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn unit_from(v: &Value) -> HomeWarUnit {
    HomeWarUnit {
        id: v["id"].as_str().unwrap().to_string(),
        owner_id: v["ownerId"].as_i64().unwrap(),
        q: v["q"].as_i64().unwrap() as i32,
        r: v["r"].as_i64().unwrap() as i32,
        is_field: v["isField"].as_bool().unwrap(),
        embarked: v["embarked"].as_bool().unwrap(),
        ruch_left: num(&v["ruchLeft"]),
        oblega_city_id: v["oblegaCityId"].as_str().map(str::to_string),
        strength: num(&v["strength"]),
    }
}

fn city_from(v: &Value) -> HomeWarCity {
    HomeWarCity {
        id: v["id"].as_str().unwrap().to_string(),
        q: v["q"].as_i64().unwrap() as i32,
        r: v["r"].as_i64().unwrap() as i32,
        owner_id: v["ownerId"].as_i64().unwrap(),
        captured_from_owner_id: v["capturedFromOwnerId"].as_i64(),
        founded_by: v["foundedBy"].as_i64(),
        founded_by_owner: v["foundedByOwner"].as_bool(),
    }
}

fn task_str(t: HomeWarTask) -> &'static str {
    match t {
        HomeWarTask::P1 => "p1",
        HomeWarTask::P2 => "p2",
    }
}

fn mode_str(m: HomeWarMode) -> &'static str {
    match m {
        HomeWarMode::Attack => "attack",
        HomeWarMode::Hold => "hold",
        HomeWarMode::Released => "released",
    }
}

fn ratio_json(r: f64) -> Value {
    if r.is_finite() {
        json!(r)
    } else {
        Value::Null
    }
}

/// Plan -> ksztalt JSON z `generatora` (klucze jak w obiektach TS; `targetCityId` tylko dla P1).
fn plan_to_json(p: &HomeWarPlan) -> Value {
    let orders: Vec<Value> = p
        .orders
        .iter()
        .map(|o| match o {
            HomeWarOrder::Attack { unit_id, target_unit_id, task } => json!({
                "unitId": unit_id, "kind": "attack", "targetUnitId": target_unit_id, "task": task_str(*task),
            }),
            HomeWarOrder::Approach { unit_id, to_q, to_r, task, target_city_id } => {
                let mut v = json!({
                    "unitId": unit_id, "kind": "approach", "toQ": to_q, "toR": to_r, "task": task_str(*task),
                });
                if let Some(c) = target_city_id {
                    v["targetCityId"] = json!(c);
                }
                v
            }
            HomeWarOrder::Hold { unit_id, to_q, to_r, city_id, task } => json!({
                "unitId": unit_id, "kind": "hold", "toQ": to_q, "toR": to_r, "cityId": city_id, "task": task_str(*task),
            }),
        })
        .collect();
    let clusters: Vec<Value> = p
        .clusters
        .iter()
        .map(|c| {
            json!({
                "anchorId": c.anchor_id,
                "enemyOwnerId": c.enemy_owner_id,
                "size": c.size,
                "strength": c.strength,
                "presentStrength": c.present_strength,
                "ratio": ratio_json(c.ratio),
                "small": c.small,
                "mode": mode_str(c.mode),
                "assigned": c.assigned,
            })
        })
        .collect();
    let recapture = match &p.recapture {
        None => Value::Null,
        Some(HomeWarRecapture {
            city_id,
            mode,
            ratio,
            assigned,
        }) => json!({
            "cityId": city_id,
            "mode": if *mode == RecaptureMode::Go { "go" } else { "wait" },
            "ratio": ratio_json(*ratio),
            "assigned": assigned,
        }),
    };
    json!({ "orders": orders, "clusters": clusters, "recapture": recapture })
}

/// Porownanie JSON: liczby z tolerancja 1e-12 (serde_json bez `float_roundtrip` parsuje czasem o 1 ulp obok),
/// reszta dokladnie. Nie zmieniamy Cargo.toml (zakaz), wiec nie wlaczamy `float_roundtrip`.
fn approx_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => {
            let (x, y) = (x.as_f64().unwrap(), y.as_f64().unwrap());
            (x - y).abs() <= 1e-12 * x.abs().max(y.abs()).max(1.0)
        }
        (Value::Array(x), Value::Array(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| approx_eq(p, q))
        }
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len()
                && x.iter()
                    .all(|(k, p)| y.get(k).is_some_and(|q| approx_eq(p, q)))
        }
        _ => a == b,
    }
}

#[test]
fn plan_home_war_zgodny_z_webem_na_scenariuszach() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    let scenarios = root["scenarios"].as_array().unwrap();
    assert!(
        scenarios.len() >= 100,
        "za malo scenariuszy: {}",
        scenarios.len()
    );
    let mut steps_total = 0usize;
    let mut orders_total = 0usize;

    for (si, sc) in scenarios.iter().enumerate() {
        // Pamiec histerezy zyje przez cala sekwencje tur scenariusza (jak modul-owa mapa w webie).
        let mut store = HomeWarMemoryStore::new();
        for (ti, st) in sc["steps"].as_array().unwrap().iter().enumerate() {
            let inp_v = &st["input"];
            let units: Vec<HomeWarUnit> = inp_v["units"]
                .as_array()
                .unwrap()
                .iter()
                .map(unit_from)
                .collect();
            let cities: Vec<HomeWarCity> = inp_v["cities"]
                .as_array()
                .unwrap()
                .iter()
                .map(city_from)
                .collect();
            let my_units: Vec<HomeWarUnit> =
                units.iter().filter(|u| u.owner_id == ME).cloned().collect();
            let enemy_units: Vec<HomeWarUnit> =
                units.iter().filter(|u| u.owner_id != ME).cloned().collect();
            let my_cities: Vec<HomeWarCity> = cities
                .iter()
                .filter(|c| c.owner_id == ME)
                .cloned()
                .collect();

            let engage: HashSet<i64> = inp_v["engage"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_i64().unwrap())
                .collect();
            let contact: Option<HashSet<i64>> = inp_v["contact"]
                .as_array()
                .map(|a| a.iter().map(|x| x.as_i64().unwrap()).collect());
            let relevant: Option<HashSet<String>> = inp_v["relevantSieges"]
                .as_array()
                .map(|a| a.iter().map(|x| x.as_str().unwrap().to_string()).collect());
            let locked: HashSet<String> = inp_v["locked"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_string())
                .collect();
            let own: HashSet<(i32, i32)> = inp_v["ownTerritory"]
                .as_array()
                .unwrap()
                .iter()
                .map(|p| (p[0].as_i64().unwrap() as i32, p[1].as_i64().unwrap() as i32))
                .collect();

            let can_engage = |o: i64| engage.contains(&o);
            let contact_fn = contact.as_ref().map(|s| move |o: i64| s.contains(&o));
            let contact_dyn: Option<&dyn Fn(i64) -> bool> =
                contact_fn.as_ref().map(|f| f as &dyn Fn(i64) -> bool);
            let is_own = |q: i32, r: i32| own.contains(&(q, r));
            let relevant_fn = relevant.as_ref().map(|s| move |cid: &str| s.contains(cid));
            let relevant_dyn: Option<&dyn Fn(&str) -> bool> =
                relevant_fn.as_ref().map(|f| f as &dyn Fn(&str) -> bool);

            let current_turn = inp_v["currentTurn"].as_i64();
            let input = HomeWarInput {
                owner_id: ME,
                current_turn,
                all_units: &units,
                my_units: &my_units,
                my_cities: &my_cities,
                all_cities: &cities,
                enemy_units: &enemy_units,
                can_engage_owner: &can_engage,
                has_contact_with: contact_dyn,
                locked_unit_ids: &locked,
                is_own_territory: &is_own,
                is_relevant_siege: relevant_dyn,
            };
            let got = plan_to_json(&plan_home_war(&input, &mut store));
            let exp = &st["expected"];
            assert!(
                approx_eq(&got, exp),
                "scenariusz {si}, tura {ti}\n got={got}\n exp={exp}"
            );
            steps_total += 1;
            orders_total += exp["orders"].as_array().unwrap().len();
        }
    }
    assert!(steps_total >= 900, "za malo krokow: {steps_total}");
    assert!(orders_total > 0);
}

#[test]
fn pamiec_resetuje_sie_przy_cofnieciu_tury() {
    let mut s = HomeWarMemoryStore::new();
    s.memory_for(ME, 10).p1 = None;
    let m = s.memory_for(ME, 12);
    assert_eq!(m.last_turn, 12);
    // cofniecie tury (czysty zapis, jak nowa gra) -> nowa pamiec
    let m2 = s.memory_for(ME, 3);
    assert_eq!(m2.last_turn, 3);
    assert!(m2.p2.is_empty() && m2.p1.is_none() && m2.lost_seen.is_empty());
    s.reset();
    assert_eq!(s.memory_for(ME, 3).last_turn, 3);
}
