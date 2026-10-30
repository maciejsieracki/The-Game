//! REPIN-WOJNA-NOWE-D (partia 1): parity z URUCHOMIONYM webem `warAllInCapital.ts` @ dc8a3adc.
//! Wektory: `tests/p6_repin_wojna_d_vectors/web-dc8a3adc.json` -- wygenerowane przez zywe
//! wywolanie `planWarAllInCapital` (tsc -> CommonJS, drzewo `gra/` z `git archive dc8a3adc`
//! w katalogu tymczasowym). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/
//! evidence/gen-vectors.js`. Ten test porownuje rozkazy, `noPath`, `held` i `groupsByTarget`.

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchHex, RuchMapa, TerenBazowy};
use civ_engine::domain::war_all_in_capital::{
    plan_war_all_in_capital, WarAllInMode, WarAllInPlanOpts, WarAllInUnit, WarCapitalTarget,
};
use civ_engine::domain::war_all_in_capital_nav::WarAllInNav;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_d_vectors/web-dc8a3adc.json");

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
    }
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|s| s.as_str().expect("napis").to_string())
        .collect()
}

#[test]
fn web_vectors_match_rust_plan() {
    let doc: Value = serde_json::from_str(VECTORS).expect("wektory weba: poprawny JSON");
    let scenarios = doc["scenarios"].as_array().expect("scenarios");
    assert_eq!(scenarios.len(), 300, "liczba scenariuszy wektorow");

    let mut mismatches: Vec<String> = Vec::new();
    let mut rendezvous_orders = 0usize;
    let mut orders_total = 0usize;

    for sc in scenarios {
        let seed = sc["seed"].as_i64().expect("seed");

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
        orders_total += exp_orders.len();
        rendezvous_orders += exp_orders.iter().filter(|o| o.4 == "rendezvous").count();
        if got_orders != exp_orders {
            mismatches.push(format!(
                "seed {seed}: orders {got_orders:?} != {exp_orders:?}"
            ));
        }

        if plan.no_path != strings(&exp["noPath"]) {
            mismatches.push(format!("seed {seed}: noPath {:?}", plan.no_path));
        }
        if plan.held != strings(&exp["held"]) {
            mismatches.push(format!("seed {seed}: held {:?}", plan.held));
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
                "seed {seed}: groups {:?} != {exp_groups:?}",
                plan.groups_by_target
            ));
        }
    }

    assert!(
        mismatches.is_empty(),
        "rozbieznosci z webem ({}): {:#?}",
        mismatches.len(),
        mismatches.iter().take(10).collect::<Vec<_>>()
    );
    // Pokrycie: wektory musza zawierac rozkazy, w tym rendezvous (galaz scalania).
    assert!(
        orders_total > 500,
        "zbyt malo rozkazow w wektorach: {orders_total}"
    );
    assert!(
        rendezvous_orders > 50,
        "zbyt malo rozkazow rendezvous: {rendezvous_orders}"
    );
}
