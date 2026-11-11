//! R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1: parytet `domain::siege_engine_build` z wektorami wygenerowanymi
//! z uruchomionego weba (`gra/src/game/siege-engine-build.ts` + `building-stock-cost.ts`, web origin/main 6218f2ab1).
//! Wektory: `tests/p6_repin_oblezenie_maszyny_web_vectors.json` (generator: dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1/vectors-gen/gen.ts).

use std::collections::BTreeSet;

use civ_engine::domain::building_costs::p6_7b::{EpochInput, StockRecord, UnitStockCostSource};
use civ_engine::domain::siege_engine_build::{
    is_siege_engine_def, qualifying_siege_army_count, siege_engine_build_option,
    siege_engine_quota, ArmyUnit, SiegeEngineBuildContext, SiegeEngineUnitDef, TurnState,
    SIEGE_ENGINE_UNITS_PER_MACHINE,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_repin_oblezenie_maszyny_web_vectors.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

fn opt_str(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(Value::as_str).map(str::to_owned)
}

fn epoch(v: &Value) -> EpochInput {
    match v {
        Value::Number(n) => EpochInput::Number(n.as_f64().unwrap_or(0.0)),
        Value::String(s) => EpochInput::Text(s.clone()),
        _ => EpochInput::Other,
    }
}

fn unit_def(u: &Value) -> SiegeEngineUnitDef {
    SiegeEngineUnitDef {
        typ: opt_str(u, "Typ"),
        tech: opt_str(u, "Tech"),
        stock_source: UnitStockCostSource {
            jednostka: opt_str(u, "Jednostka"),
            typ: opt_str(u, "Typ"),
            epoka: epoch(u.get("Epoka").unwrap_or(&Value::Null)),
            surowiec: opt_str(u, "Surowiec"),
            surowiec_ilosc: u.get("Surowiec (ilość)").and_then(Value::as_f64),
        },
    }
}

fn stock_record(v: &Value) -> StockRecord {
    v.as_object()
        .map(|m| {
            m.iter()
                .map(|(k, x)| (k.clone(), x.as_f64().unwrap_or(0.0)))
                .collect()
        })
        .unwrap_or_default()
}

fn reason_key(v: &Value) -> Option<&str> {
    v.as_str()
}

#[test]
fn units_per_machine_matches_web_params() {
    assert_eq!(
        SIEGE_ENGINE_UNITS_PER_MACHINE,
        web()["unitsPerSiegeEngine"]
            .as_u64()
            .expect("web unitsPerSiegeEngine")
    );
}

#[test]
fn quota_examples_match_web() {
    let w = web();
    for ex in w["quotaExamples"].as_array().expect("quotaExamples") {
        let n = ex["n"].as_u64().expect("n") as usize;
        let army: Vec<ArmyUnit> = (0..n)
            .map(|_| ArmyUnit {
                owner_id: 1,
                obleznicza: false,
            })
            .collect();
        assert_eq!(
            siege_engine_quota(&army),
            ex["quota"].as_u64().expect("quota"),
            "n={n}"
        );
    }
}

#[test]
fn def_and_army_helpers_handle_edges() {
    assert!(is_siege_engine_def(Some(" Siege ")));
    assert!(!is_siege_engine_def(Some("Siege2")));
    assert!(!is_siege_engine_def(None));
    let army = [
        ArmyUnit {
            owner_id: 1,
            obleznicza: true,
        },
        ArmyUnit {
            owner_id: 1,
            obleznicza: false,
        },
    ];
    assert_eq!(qualifying_siege_army_count(&army), 1);
}

#[test]
fn every_web_case_matches_reason_allowed_and_numbers() {
    let w = web();
    let cases = w["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 30,
        "wektory weba musza pokrywac cala kombinatoryke"
    );
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let unit = unit_def(&case["unit"]);
        let c = &case["ctx"];
        let army: Vec<ArmyUnit> = c["army"]
            .as_array()
            .expect("army")
            .iter()
            .map(|u| ArmyUnit {
                owner_id: u["ownerId"].as_i64().expect("ownerId"),
                obleznicza: u["category"].as_str() == Some("obleznicza"),
            })
            .collect();
        let techs: BTreeSet<String> = c["unlockedTechs"]
            .as_array()
            .expect("techs")
            .iter()
            .map(|t| t.as_str().expect("tech").to_owned())
            .collect();
        let stock = stock_record(&c["stock"]);
        let turn_state = c["turnState"].as_object().map(|t| TurnState {
            turn: t["turn"].as_i64().expect("ts.turn"),
            count: t["count"].as_f64().expect("ts.count"),
        });
        let ctx = SiegeEngineBuildContext {
            active_siege: c["activeSiege"].as_bool().expect("activeSiege"),
            at_war: c["atWar"].as_bool().expect("atWar"),
            owner_id: c["ownerId"].as_i64().expect("ownerId"),
            turn: c["turn"].as_i64().expect("turn"),
            army: &army,
            turn_state,
            unlocked_techs: &techs,
            treasury: c["treasury"].as_f64().expect("treasury"),
            stock: &stock,
        };
        let cost_money = case["costMoney"].as_f64().expect("costMoney");
        let got = siege_engine_build_option(&unit, &ctx, cost_money);
        let exp = &case["expect"];

        assert_eq!(
            got.allowed,
            exp["allowed"].as_bool().expect("allowed"),
            "{name}: allowed"
        );
        assert_eq!(
            got.reason.map(|r| r.web_key()),
            reason_key(&exp["reason"]),
            "{name}: reason"
        );
        assert_eq!(
            got.quota,
            exp["quota"].as_u64().expect("quota"),
            "{name}: quota"
        );
        assert_eq!(
            got.built_this_turn,
            exp["builtThisTurn"].as_f64().expect("builtThisTurn"),
            "{name}: builtThisTurn"
        );
        assert_eq!(
            got.qualifying_army_count,
            exp["qualifyingArmyCount"]
                .as_u64()
                .expect("qualifyingArmyCount"),
            "{name}: qualifyingArmyCount"
        );
        assert_eq!(
            got.cost_money,
            exp["costMoney"].as_f64().expect("costMoney"),
            "{name}: costMoney"
        );
        assert_eq!(
            got.cost_stock,
            stock_record(&exp["costStock"]),
            "{name}: costStock"
        );
    }
}
