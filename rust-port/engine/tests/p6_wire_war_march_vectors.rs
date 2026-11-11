//! P6-WIRE-WAR-MARCH-PLAN (W5): wektory z URUCHOMIONEGO weba (czesc 3/3), D3 = 1:1.
//!
//! Wektory: `tests/p6_wire_war_march_vectors.json`; generator i przepis:
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/gen-w5-march-vectors.mjs`
//! (Node 22 + esbuild; prawdziwe `planHomeWar` z `ai-war-home-defense.ts` i `planForcedWarWave`
//! z `forced-war-waves.ts`, `origin/main` cffe39cb9; PRNG seed 5005; 500 scenariuszy).
//!
//! Porownanie: komendy `MarchCommand::Home` i `MarchCommand::ForcedWave` zwrocone przez
//! `plan_war_march_core` (kampania i all-in wylaczone) == wynik weba (obrona domu na swiezej histerezie Z3,
//! potem fala na jednostkach bez locked i bez jednostek obrony domu Z5). `planWarAllInCapital` i
//! `buildWarCityTargets` maja wlasne wektory z weba w testach modulow skladowych
//! (`p6_repin_wojna_d_vectors.rs`, `p6_wire_war_view_vectors.json`); uzasadnienie w dokumencie W5.

use std::collections::{BTreeSet, HashSet};

use civ_engine::domain::ai_war_march_plan::{plan_war_march_core, MarchCommand, MarchCoreInput};
use civ_engine::domain::war_forced_waves::{
    ForcedWarWave, ForcedWarWaveHistory, WaveCity, WaveHex, WaveUnit,
};
use civ_engine::domain::war_home_defense::{HomeWarCity, HomeWarOrder, HomeWarTask, HomeWarUnit};
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_wire_war_march_vectors.json");

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}

fn s(v: &Value) -> String {
    v.as_str().expect("tekst").to_owned()
}

fn home_unit(v: &Value) -> HomeWarUnit {
    HomeWarUnit {
        id: s(&v["id"]),
        owner_id: v["ownerId"].as_i64().unwrap(),
        q: v["q"].as_i64().unwrap() as i32,
        r: v["r"].as_i64().unwrap() as i32,
        is_field: v["isField"].as_bool().unwrap(),
        embarked: v["embarked"].as_bool().unwrap(),
        ruch_left: num(&v["ruchLeft"]),
        oblega_city_id: v["oblegaCityId"].as_str().map(str::to_owned),
        strength: num(&v["strength"]),
    }
}

fn wave_unit(v: &Value) -> WaveUnit {
    WaveUnit {
        id: s(&v["id"]),
        owner_id: v["ownerId"].as_i64().unwrap(),
        category: s(&v["category"]),
        q: num(&v["q"]),
        r: num(&v["r"]),
        ruch_left: num(&v["ruchLeft"]),
        is_civilian: v["isCivilian"].as_bool().unwrap(),
        in_garnizon: v["inGarnizon"].as_bool().unwrap(),
        oblega_city_id: v["oblegaCityId"].as_str().map(str::to_owned),
        embarked: v["embarked"].as_bool().unwrap(),
        sea_raider: v["seaRaider"].as_bool().unwrap(),
    }
}

fn home_city(v: &Value) -> HomeWarCity {
    HomeWarCity {
        id: s(&v["id"]),
        q: v["q"].as_i64().unwrap() as i32,
        r: v["r"].as_i64().unwrap() as i32,
        owner_id: v["ownerId"].as_i64().unwrap(),
        captured_from_owner_id: v["capturedFromOwnerId"].as_i64(),
        founded_by: v["foundedBy"].as_i64(),
        founded_by_owner: v["foundedByOwner"].as_bool(),
    }
}

fn wave_city(v: &Value) -> WaveCity {
    WaveCity {
        id: s(&v["id"]),
        owner_id: v["ownerId"].as_i64().unwrap(),
        q: num(&v["q"]),
        r: num(&v["r"]),
    }
}

fn hex(v: &Value) -> WaveHex {
    WaveHex {
        q: num(&v["q"]),
        r: num(&v["r"]),
    }
}

fn active_wave(v: &Value) -> ForcedWarWave {
    ForcedWarWave {
        id: s(&v["id"]),
        target_city_id: s(&v["targetCityId"]),
        unit_ids: v["unitIds"].as_array().unwrap().iter().map(s).collect(),
        origin_hex: hex(&v["originHex"]),
        rally_point: hex(&v["rallyPoint"]),
        approach_sector: num(&v["approachSector"]),
        created_turn: num(&v["createdTurn"]),
    }
}

fn history_row(v: &Value) -> ForcedWarWaveHistory {
    ForcedWarWaveHistory {
        target_city_id: s(&v["targetCityId"]),
        origin_hex: hex(&v["originHex"]),
        rally_point: hex(&v["rallyPoint"]),
        approach_sector: num(&v["approachSector"]),
        created_turn: num(&v["createdTurn"]),
    }
}

fn task_str(t: HomeWarTask) -> &'static str {
    match t {
        HomeWarTask::P1 => "p1",
        HomeWarTask::P2 => "p2",
    }
}

fn order_json(o: &HomeWarOrder) -> Value {
    match o {
        HomeWarOrder::Attack {
            unit_id,
            target_unit_id,
            task,
        } => json!({
            "unitId": unit_id, "kind": "attack", "targetUnitId": target_unit_id, "task": task_str(*task),
        }),
        HomeWarOrder::Approach {
            unit_id,
            to_q,
            to_r,
            task,
            target_city_id,
        } => {
            let mut v = json!({
                "unitId": unit_id, "kind": "approach", "toQ": to_q, "toR": to_r, "task": task_str(*task),
            });
            if let Some(c) = target_city_id {
                v["targetCityId"] = json!(c);
            }
            v
        }
        HomeWarOrder::Hold {
            unit_id,
            to_q,
            to_r,
            city_id,
            task,
        } => json!({
            "unitId": unit_id, "kind": "hold", "toQ": to_q, "toR": to_r, "cityId": city_id, "task": task_str(*task),
        }),
    }
}

fn hex_eq(h: &WaveHex, v: &Value) -> bool {
    h.q == num(&v["q"]) && h.r == num(&v["r"])
}

#[test]
fn home_and_wave_commands_match_web_vectors() {
    let root: Value = serde_json::from_str(VECTORS).expect("json");
    let scenarios = root["scenarios"].as_array().unwrap();
    assert!(scenarios.len() >= 500, "za malo scenariuszy");
    let (mut homes, mut waves, mut both) = (0usize, 0usize, 0usize);
    for sc in scenarios {
        let inp = &sc["input"];
        let owner = inp["ownerId"].as_i64().unwrap();
        let turn = inp["turn"].as_i64().unwrap();
        let units = inp["units"].as_array().unwrap();
        let cities = inp["cities"].as_array().unwrap();
        let home_units: Vec<HomeWarUnit> = units.iter().map(home_unit).collect();
        let wave_units: Vec<WaveUnit> = units.iter().map(wave_unit).collect();
        let home_cities: Vec<HomeWarCity> = cities.iter().map(home_city).collect();
        let wave_cities: Vec<WaveCity> = cities.iter().map(wave_city).collect();
        let enemies: BTreeSet<i64> = inp["engage"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_i64().unwrap())
            .collect();
        let locked: HashSet<String> = inp["locked"].as_array().unwrap().iter().map(s).collect();
        let own: HashSet<(i32, i32)> = inp["ownTerritory"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap() as i32, p[1].as_i64().unwrap() as i32))
            .collect();
        let active: Vec<ForcedWarWave> = inp["activeWaves"]
            .as_array()
            .unwrap()
            .iter()
            .map(active_wave)
            .collect();
        let history: Vec<ForcedWarWaveHistory> = inp["history"]
            .as_array()
            .unwrap()
            .iter()
            .map(history_row)
            .collect();
        let is_own = |q: i32, r: i32| own.contains(&(q, r));
        let cmds = plan_war_march_core(&MarchCoreInput {
            owner_id: owner,
            turn,
            enemy_owners: &enemies,
            locked_unit_ids: &locked,
            is_own_territory: &is_own,
            all_home_cities: &home_cities,
            all_home_units: &home_units,
            wave_cities: &wave_cities,
            wave_units: &wave_units,
            active_waves: &active,
            wave_history: &history,
            campaign: None,
            campaign_candidates: &[],
            all_in_targets: &[],
            all_in: None,
        });
        let got_home: Vec<Value> = cmds
            .iter()
            .filter_map(|c| match c {
                MarchCommand::Home(o) => Some(order_json(o)),
                _ => None,
            })
            .collect();
        let got_wave: Option<&_> = cmds.iter().find_map(|c| match c {
            MarchCommand::ForcedWave(p) => Some(p),
            _ => None,
        });
        let exp = &sc["expected"];
        let exp_home = exp["homeOrders"].as_array().unwrap();
        let idx = sc["sIdx"].as_i64().unwrap();
        assert_eq!(got_home.len(), exp_home.len(), "scenariusz {idx}: dom");
        for (g, e) in got_home.iter().zip(exp_home) {
            assert_eq!(g, e, "scenariusz {idx}: rozkaz domu");
        }
        match (got_wave, exp["wave"].as_object()) {
            (None, None) => {}
            (Some(p), Some(w)) => {
                let ids = |a: &[String]| -> Vec<String> { a.to_vec() };
                let ev =
                    |k: &str| -> Vec<String> { w[k].as_array().unwrap().iter().map(s).collect() };
                assert_eq!(s(&w["targetCityId"]), p.target_city_id, "sc {idx} cel");
                assert_eq!(ev("unitIds"), ids(&p.unit_ids), "sc {idx} unitIds");
                assert_eq!(ev("moveUnitIds"), ids(&p.move_unit_ids), "sc {idx} move");
                assert_eq!(
                    ev("deferredUnitIds"),
                    ids(&p.deferred_unit_ids),
                    "sc {idx} def"
                );
                assert!(hex_eq(&p.origin_hex, &w["originHex"]), "sc {idx} origin");
                assert!(hex_eq(&p.rally_point, &w["rallyPoint"]), "sc {idx} rally");
                assert_eq!(
                    num(&w["approachSector"]),
                    p.approach_sector,
                    "sc {idx} sektor"
                );
                assert_eq!(num(&w["createdTurn"]), p.created_turn, "sc {idx} tura");
                waves += 1;
                if !got_home.is_empty() {
                    both += 1;
                }
            }
            (g, e) => panic!("scenariusz {idx}: fala got={g:?} web={e:?}"),
        }
        if !got_home.is_empty() {
            homes += 1;
        }
    }
    // Pokrycie: wektory cos testuja (liczby z generatora: homeOrders 472, waves 97, homeAndWave 10).
    assert!(homes >= 40, "za malo scenariuszy z rozkazami domu: {homes}");
    assert!(waves >= 90, "za malo scenariuszy z fala: {waves}");
    assert!(both >= 8, "za malo scenariuszy dom+fala: {both}");
}
