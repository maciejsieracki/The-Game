//! R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1 (runda 3, A): zakup AI na REALNYM stanie panstwa.
//! Wektory z URUCHOMIONEGO weba (origin/main): `unitStockCost` + `canAffordUnitRecruitStock` +
//! `missingStockFor` dla wszystkich 75 jednostek x 472 pule magazynu.
//! Generator: tests/p6_repin_ai_zakup_purchase_vectors/gen-purchase-vectors.mjs (Node 22).

use std::collections::BTreeMap;

use civ_engine::data::economy_society_part2::parse_ai_params;
use civ_engine::domain::ai_zakup_jednostki::{
    ai_purchase_resource_needs, ai_try_purchase_unit, load_ai_purchase_reserve_params,
    AiPurchaseDecline, AiPurchaseOutcome, AiPurchaseParams, AiPurchaseState,
};
use civ_engine::domain::recruitment::{recruitment_for, ResourceStock, UnitRecruitment};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ai_zakup_purchase_vectors/purchase-vectors.json");

fn stock_of(v: &Value) -> ResourceStock {
    v.as_object()
        .expect("obiekt puli")
        .iter()
        .map(|(k, n)| {
            // web dopuszcza ujemne ilosci w puli (minus1 przy koszcie 0 nie wystepuje); clamp do 0.
            let n = n.as_f64().expect("liczba");
            (k.clone(), if n < 0.0 { 0 } else { n as u32 })
        })
        .collect()
}

/// Stan bogaty w zloto i Manpower: izoluje decyzje magazynowa (jak web `pickUnitRecruitHint`).
fn rich_state(stock: ResourceStock) -> AiPurchaseState {
    AiPurchaseState {
        treasury: 1.0e9,
        stock,
        manpower: 1.0e9,
    }
}

fn plain_params() -> AiPurchaseParams {
    AiPurchaseParams {
        manpower_cost: 1.0,
        reserve: None,
        net_income_per_turn: None,
        upkeep_per_turn: None,
        unit_upkeep_per_turn: None,
    }
}

#[test]
fn purchase_stock_gate_matches_web_for_all_units() {
    let v: Value = serde_json::from_str(VECTORS).expect("purchase-vectors.json parses");
    let cases = v["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 75, "wszystkie jednostki units.json");
    let mut failures: Vec<String> = Vec::new();
    let mut n_pools = 0;
    for c in cases {
        let name = c["unit"].as_str().expect("unit");
        let unit = recruitment_for(name).unwrap_or_else(|| panic!("brak jednostki {name}"));
        // Koszt surowcowy Rust == web `unitStockCost`.
        let web_cost = stock_of(&c["stockCost"]);
        if unit.stock_cost != web_cost {
            failures.push(format!(
                "{name}: koszt rust {:?} != web {:?}",
                unit.stock_cost, web_cost
            ));
        }
        for p in c["pools"].as_array().expect("pools") {
            n_pools += 1;
            let label = p["label"].as_str().expect("label");
            let pool = stock_of(&p["pool"]);
            let web_afford = p["canAfford"].as_bool().expect("canAfford");
            let web_missing: BTreeMap<String, u32> = p["missing"]
                .as_object()
                .expect("missing")
                .iter()
                .map(|(k, n)| (k.clone(), n.as_f64().expect("liczba") as u32))
                .collect();
            let mut state = rich_state(pool.clone());
            let before = state.clone();
            let out = ai_try_purchase_unit(&mut state, &unit, &plain_params());
            match (&out, web_afford) {
                (AiPurchaseOutcome::Purchased { .. }, true) => {
                    // pobrane dokladnie koszt z magazynu
                    for (k, need) in &unit.stock_cost {
                        let had = before.stock.get(k).copied().unwrap_or(0);
                        if state.stock.get(k).copied().unwrap_or(0) != had - need {
                            failures.push(format!("{name}/{label}: zle pobranie {k}"));
                        }
                    }
                }
                (AiPurchaseOutcome::Declined(AiPurchaseDecline::MissingStock(m)), false) => {
                    if *m != web_missing {
                        failures.push(format!(
                            "{name}/{label}: missing {m:?} != web {web_missing:?}"
                        ));
                    }
                    if state != before {
                        failures.push(format!("{name}/{label}: odmowa zmienila stan"));
                    }
                }
                _ => failures.push(format!(
                    "{name}/{label}: rust {out:?}, web canAfford={web_afford}"
                )),
            }
        }
    }
    assert!(n_pools >= 400, "za malo pul: {n_pools}");
    assert!(
        failures.is_empty(),
        "{} rozbieznosci:\n{}",
        failures.len(),
        failures.join("\n")
    );
}

fn unit_with_cost() -> UnitRecruitment {
    UnitRecruitment::new("test_unit", "Melee", 100, 2)
        .with_stock_cost("zelazo", 5)
        .with_stock_cost("drewno", 3)
}

#[test]
fn buys_with_real_stock_and_deducts_atomically() {
    let unit = unit_with_cost();
    let mut state = AiPurchaseState {
        treasury: 150.0,
        stock: [("zelazo".to_string(), 7), ("drewno".to_string(), 3)].into(),
        manpower: 5.0,
    };
    let out = ai_try_purchase_unit(&mut state, &unit, &plain_params());
    assert!(matches!(out, AiPurchaseOutcome::Purchased { gold_spent, .. } if gold_spent == 100.0));
    assert_eq!(state.treasury, 50.0);
    assert_eq!(state.manpower, 4.0);
    assert_eq!(state.stock.get("zelazo"), Some(&2));
    assert_eq!(state.stock.get("drewno"), Some(&0));
}

#[test]
fn missing_resource_blocks_and_leaves_state_untouched() {
    let unit = unit_with_cost();
    let mut state = AiPurchaseState {
        treasury: 1000.0,
        stock: [("zelazo".to_string(), 9), ("drewno".to_string(), 2)].into(),
        manpower: 5.0,
    };
    let before = state.clone();
    let out = ai_try_purchase_unit(&mut state, &unit, &plain_params());
    let want: BTreeMap<String, u32> = [("drewno".to_string(), 1)].into();
    assert_eq!(
        out,
        AiPurchaseOutcome::Declined(AiPurchaseDecline::MissingStock(want))
    );
    assert_eq!(
        state, before,
        "zloto/Manpower/zelazo nietkniete przy braku drewna"
    );
}

#[test]
fn no_magic_resources_gold_cannot_replace_stock() {
    let unit = unit_with_cost();
    let mut state = AiPurchaseState {
        treasury: 1.0e12,
        stock: ResourceStock::new(),
        manpower: 1.0e9,
    };
    assert!(matches!(
        ai_try_purchase_unit(&mut state, &unit, &plain_params()),
        AiPurchaseOutcome::Declined(AiPurchaseDecline::MissingStock(_))
    ));
}

#[test]
fn gold_and_manpower_gates_block_before_stock() {
    let unit = unit_with_cost();
    let stock: ResourceStock = [("zelazo".to_string(), 9), ("drewno".to_string(), 9)].into();
    let mut poor = AiPurchaseState {
        treasury: 99.0,
        stock: stock.clone(),
        manpower: 5.0,
    };
    let mut no_mp = AiPurchaseState {
        treasury: 500.0,
        stock,
        manpower: 0.5,
    };
    assert_eq!(
        ai_try_purchase_unit(&mut poor, &unit, &plain_params()),
        AiPurchaseOutcome::Declined(AiPurchaseDecline::Gate)
    );
    assert_eq!(
        ai_try_purchase_unit(&mut no_mp, &unit, &plain_params()),
        AiPurchaseOutcome::Declined(AiPurchaseDecline::Gate)
    );
}

#[test]
fn reserve_10_3_0_blocks_through_executor() {
    let ai = parse_ai_params().expect("ai-params.json parses");
    let unit = unit_with_cost();
    let stock: ResourceStock = [("zelazo".to_string(), 9), ("drewno".to_string(), 9)].into();
    // po zakupie: skarbiec 100, utrzymanie lacznie 20+2=22/ture. Poziom 1 (rezerwa 10 tur = 220) blokuje,
    // poziom 3 (0 tur) przepuszcza; poziom 2 (3 tury = 66) przepuszcza.
    let mk = |poziom: u8| AiPurchaseParams {
        manpower_cost: 1.0,
        reserve: Some(load_ai_purchase_reserve_params(&ai, poziom)),
        net_income_per_turn: Some(50.0),
        upkeep_per_turn: Some(20.0),
        unit_upkeep_per_turn: Some(2.0),
    };
    let mut results = Vec::new();
    for poziom in [1u8, 2, 3] {
        let mut st = AiPurchaseState {
            treasury: 200.0,
            stock: stock.clone(),
            manpower: 5.0,
        };
        let before = st.clone();
        let out = ai_try_purchase_unit(&mut st, &unit, &mk(poziom));
        if matches!(out, AiPurchaseOutcome::Declined(_)) {
            assert_eq!(st, before, "odmowa nie zmienia stanu (poziom {poziom})");
        }
        results.push(matches!(out, AiPurchaseOutcome::Purchased { .. }));
    }
    assert_eq!(results, vec![false, true, true]);
}

#[test]
fn needs_link_reports_missing_resource_of_declined_purchase() {
    let unit = unit_with_cost();
    let state = AiPurchaseState {
        treasury: 1000.0,
        stock: [("zelazo".to_string(), 9), ("drewno".to_string(), 2)].into(),
        manpower: 5.0,
    };
    let needs = ai_purchase_resource_needs(&state, &unit, &[], 1.0);
    assert_eq!(needs.deficit_keys, vec!["drewno".to_string()]);
    assert_eq!(needs.needs_resource.get("drewno"), Some(&true));
    assert!(!needs.needs_resource.contains_key("zelazo"));
}
