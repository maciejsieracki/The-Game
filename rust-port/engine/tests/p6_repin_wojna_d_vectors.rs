//! REPIN-WOJNA-NOWE-D: parity z URUCHOMIONYM webem `warAllInCapital.ts` @ dc8a3adc.
//! Wektory:
//! - `tests/p6_repin_wojna_d_vectors/web-dc8a3adc.json` (partia 1: tryby capital/rendezvous),
//! - `tests/p6_repin_wojna_d_vectors/web-dc8a3adc-w12.json` (runda 3: W1 `enemyArmies` oraz
//!   `engageRadius`, W2 `enemyStrength`, tryb `engage`).
//!
//! Wygenerowane przez zywe wywolanie `planWarAllInCapital` (tsc -> CommonJS, drzewo `gra/` z
//! `git archive dc8a3adc` w katalogu tymczasowym). Generatory: `dyspozycje/autobot/runs/
//! R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/evidence/gen-vectors.js` oraz `gen-vectors-w12.js`.
//! Test porownuje rozkazy, `noPath`, `held` i `groupsByTarget`.

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::war_all_in_capital::{
    plan_war_all_in_capital, WarAllInMode, WarAllInPlanOpts, WarAllInUnit, WarCapitalTarget,
};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use civ_engine::domain::war_rules_multiwar::{EnemyStrengthRef, EngageArmyHex};
use serde_json::Value;

const VECTORS_BASE: &str = include_str!("p6_repin_wojna_d_vectors/web-dc8a3adc.json");
const VECTORS_W12: &str = include_str!("p6_repin_wojna_d_vectors/web-dc8a3adc-w12.json");

fn teren(s: &str) -> TerenBazowy {
    match s {
        "laka" => TerenBazowy::Laka,
        "rownina" => TerenBazowy::Rownina,
        "wzgorza" => TerenBazowy::Wzgorza,
        "gory" => TerenBazowy::Gory,
        "plytkie_morze" => TerenBazowy::PlytkieMorze,
        "morze" => TerenBazowy::Morze,
        "pustynia" => TerenBazowy::Pustynia,
        "polarny" => TerenBazowy::Polarny,
        other => panic!("nieznany teren weba: {other}"),
    }
}

fn key(v: &Value) -> Klucz {
    let a = v.as_array().expect("para [q,r]");
    (
        a[0].as_i64().expect("q") as i32,
        a[1].as_i64().expect("r") as i32,
    )
}

fn mode_str(m: WarAllInMode) -> &'static str {
    match m {
        WarAllInMode::Capital => "capital",
        WarAllInMode::Rendezvous => "rendezvous",
        WarAllInMode::Engage => "engage",
    }
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|s| s.as_str().expect("napis").to_string())
        .collect()
}

/// Statystyki pokrycia jednego zbioru wektorow.
#[derive(Default)]
struct Coverage {
    scenarios: usize,
    orders: usize,
    rendezvous: usize,
    engage: usize,
    w1_scenarios: usize,
    w2_scenarios: usize,
}

/// Porownuje jeden zbior wektorow z planerem Rust; zwraca rozbieznosci i pokrycie.
fn check_vectors(label: &str, text: &str, expect_count: usize) -> (Vec<String>, Coverage) {
    let doc: Value = serde_json::from_str(text).expect("wektory weba: poprawny JSON");
    let scenarios = doc["scenarios"].as_array().expect("scenarios");
    assert_eq!(scenarios.len(), expect_count, "liczba scenariuszy: {label}");

    let mut mismatches: Vec<String> = Vec::new();
    let mut cov = Coverage::default();

    for sc in scenarios {
        let seed = sc["seed"].as_i64().expect("seed");
        cov.scenarios += 1;

        let mut map = RuchMapa::new();
        for h in sc["map"]["hexes"].as_array().expect("hexes") {
            let ulep = h["ulepszenie"].as_str().expect("ulepszenie");
            let hex = RuchHex {
                ulepszenie: if ulep == "brak" {
                    None
                } else {
                    Some(ulep.to_string())
                },
                las: h["las"].as_str() == Some("las"),
                rzeka: h["rzeka"].as_bool().expect("rzeka"),
                ..RuchHex::new(teren(h["teren"].as_str().expect("teren")))
            };
            map.insert(
                (
                    h["q"].as_i64().unwrap() as i32,
                    h["r"].as_i64().unwrap() as i32,
                ),
                hex,
            );
        }

        let units: Vec<WarAllInUnit> = sc["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| WarAllInUnit {
                id: u["id"].as_str().expect("id").to_string(),
                q: u["q"].as_i64().unwrap() as i32,
                r: u["r"].as_i64().unwrap() as i32,
                ruch_left: u.get("ruchLeft").and_then(Value::as_f64),
            })
            .collect();

        let targets: Vec<WarCapitalTarget> = sc["targets"]
            .as_array()
            .expect("targets")
            .iter()
            .map(|t| WarCapitalTarget {
                owner_id: t["ownerId"].as_i64().expect("ownerId"),
                city_id: t["cityId"].as_str().expect("cityId").to_string(),
                q: t["q"].as_i64().unwrap() as i32,
                r: t["r"].as_i64().unwrap() as i32,
            })
            .collect();

        let blocked: HashSet<Klucz> = sc["blocked"].as_array().unwrap().iter().map(key).collect();
        let occupied: Option<HashSet<Klucz>> = sc["occupied"]
            .as_array()
            .map(|a| a.iter().map(key).collect());
        let allow_sea = sc["allowSea"].as_bool().expect("allowSea");
        let march = sc["marchMainGroupWhileRendezvous"]
            .as_bool()
            .expect("march");

        // W1/W2 (runda 3): pola opcjonalne; brak klucza = `undefined` po stronie weba.
        let enemy_armies: Option<Vec<EngageArmyHex>> =
            sc.get("enemyArmies").and_then(Value::as_array).map(|a| {
                a.iter()
                    .map(|e| EngageArmyHex {
                        q: e["q"].as_i64().unwrap() as i32,
                        r: e["r"].as_i64().unwrap() as i32,
                        owner_id: e["ownerId"].as_i64().unwrap(),
                    })
                    .collect()
            });
        let engage_radius = sc.get("engageRadius").and_then(Value::as_i64).unwrap_or(0);
        let enemy_strength: Option<Vec<EnemyStrengthRef>> =
            sc.get("enemyStrength").and_then(Value::as_array).map(|a| {
                a.iter()
                    .map(|e| EnemyStrengthRef {
                        owner_id: e["ownerId"].as_i64().unwrap(),
                        strength: e["strength"].as_i64().unwrap(),
                    })
                    .collect()
            });
        if enemy_armies.is_some() {
            cov.w1_scenarios += 1;
        }
        if enemy_strength.is_some() {
            cov.w2_scenarios += 1;
        }

        let nav = WarAllInNav {
            map: &map,
            allow_sea,
            blocked: &blocked,
            occupied: occupied.as_ref(),
        };
        let plan = plan_war_all_in_capital(
            &units,
            &targets,
            &nav,
            WarAllInPlanOpts {
                march_main_group_while_rendezvous: march,
                enemy_armies,
                engage_radius,
                enemy_strength,
            },
        );

        let exp = &sc["expected"];
        let got_orders: Vec<(String, Klucz, String, i64, String)> = plan
            .orders
            .iter()
            .map(|o| {
                (
                    o.unit_id.clone(),
                    o.step,
                    o.target_city_id.clone(),
                    o.target_owner_id,
                    mode_str(o.mode).to_string(),
                )
            })
            .collect();
        let exp_orders: Vec<(String, Klucz, String, i64, String)> = exp["orders"]
            .as_array()
            .expect("orders")
            .iter()
            .map(|o| {
                (
                    o["unitId"].as_str().unwrap().to_string(),
                    key(&o["step"]),
                    o["targetCityId"].as_str().unwrap().to_string(),
                    o["targetOwnerId"].as_i64().unwrap(),
                    o["mode"].as_str().unwrap().to_string(),
                )
            })
            .collect();
        cov.orders += exp_orders.len();
        cov.rendezvous += exp_orders.iter().filter(|o| o.4 == "rendezvous").count();
        cov.engage += exp_orders.iter().filter(|o| o.4 == "engage").count();
        if got_orders != exp_orders {
            mismatches.push(format!(
                "{label} seed {seed}: orders {got_orders:?} != {exp_orders:?}"
            ));
        }

        if plan.no_path != strings(&exp["noPath"]) {
            mismatches.push(format!("{label} seed {seed}: noPath {:?}", plan.no_path));
        }
        if plan.held != strings(&exp["held"]) {
            mismatches.push(format!("{label} seed {seed}: held {:?}", plan.held));
        }

        let exp_groups: BTreeMap<String, Vec<usize>> = exp["groupsByTarget"]
            .as_object()
            .expect("groupsByTarget")
            .iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    v.as_array()
                        .unwrap()
                        .iter()
                        .map(|n| n.as_u64().unwrap() as usize)
                        .collect(),
                )
            })
            .collect();
        if plan.groups_by_target != exp_groups {
            mismatches.push(format!(
                "{label} seed {seed}: groups {:?} != {exp_groups:?}",
                plan.groups_by_target
            ));
        }
    }
    (mismatches, cov)
}

#[test]
fn web_vectors_match_rust_plan() {
    let (mut mismatches, base) = check_vectors("base", VECTORS_BASE, 300);
    // Pokrycie bazowe: wektory musza zawierac rozkazy, w tym rendezvous (galaz scalania).
    assert!(
        base.orders > 500,
        "zbyt malo rozkazow w wektorach: {}",
        base.orders
    );
    assert!(
        base.rendezvous > 50,
        "zbyt malo rozkazow rendezvous: {}",
        base.rendezvous
    );

    let (w12_mismatches, w12) = check_vectors("w12", VECTORS_W12, 300);
    mismatches.extend(w12_mismatches);
    // Pokrycie W1/W2: tryb engage (W1), galaz podzialu armii (W2), rendezvous i wielokrokowe.
    assert!(
        w12.w1_scenarios > 150,
        "za malo scenariuszy W1: {}",
        w12.w1_scenarios
    );
    assert!(
        w12.w2_scenarios > 100,
        "za malo scenariuszy W2: {}",
        w12.w2_scenarios
    );
    assert!(w12.engage > 100, "za malo rozkazow engage: {}", w12.engage);
    assert!(
        w12.rendezvous > 50,
        "zbyt malo rozkazow rendezvous (W12): {}",
        w12.rendezvous
    );

    assert!(
        mismatches.is_empty(),
        "rozbieznosci z webem ({}): {:#?}",
        mismatches.len(),
        mismatches.iter().take(10).collect::<Vec<_>>()
    );
}
