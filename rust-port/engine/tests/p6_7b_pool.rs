//! P6.7B - pula surowcow panstwa po miastach wlasciciela (`building-stock-cost.ts`): suma, zapas,
//! pobor (najwiekszy zapas pierwszy), zwrot, kredyt (najmniejszy zapas, cap), przypisanie z puli.
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_7b_vectors/pool.json`; zmutowane miasta porownywane z koncowym stanem z weba.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use civ_engine::domain::building_costs::p6_7b::{
    assign_owner_resource_stock_from_pool, credit_owner_resource_stock,
    deduct_building_stock_cost_across_cities, owner_resource_stock, owner_resource_stock_all,
    refund_building_stock_cost_across_cities,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("pool.json")
}

#[test]
fn owner_resource_stock_all_matches_running_web() {
    let d = data();
    let cases = arr(&d, "ownerAll");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        assert_values(
            &format!("ownerAll #{i}"),
            &rec_value(&owner_resource_stock_all(&cities, owner)),
            &c["out"],
        );
    }
}

#[test]
fn owner_resource_stock_matches_running_web() {
    let d = data();
    let cases = arr(&d, "ownerOne");
    assert!(cases.len() >= 500);
    for (i, c) in cases.iter().enumerate() {
        let cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        assert_bits(
            &format!("ownerOne #{i}"),
            owner_resource_stock(&cities, owner, &text(&c["key"])),
            num(&c["out"]),
        );
    }
}

#[test]
fn deduct_across_cities_matches_running_web() {
    let d = data();
    let cases = arr(&d, "deduct");
    assert!(cases.len() >= 900);
    for (i, c) in cases.iter().enumerate() {
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        deduct_building_stock_cost_across_cities(&mut cities, owner, &stock_rec(&c["cost"]));
        assert_values(&format!("deduct #{i}"), &cities_value(&cities), &c["after"]);
    }
}

#[test]
fn refund_across_cities_matches_running_web() {
    let d = data();
    let cases = arr(&d, "refund");
    assert!(cases.len() >= 700);
    for (i, c) in cases.iter().enumerate() {
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        refund_building_stock_cost_across_cities(&mut cities, owner, &stock_rec(&c["cost"]));
        assert_values(&format!("refund #{i}"), &cities_value(&cities), &c["after"]);
    }
}

#[test]
fn credit_owner_resource_stock_matches_running_web() {
    let d = data();
    let cases = arr(&d, "credit");
    assert!(cases.len() >= 1200);
    for (i, c) in cases.iter().enumerate() {
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        let cap = c.get("cap").map(num);
        let ret = credit_owner_resource_stock(
            &mut cities,
            owner,
            &text(&c["key"]),
            num(&c["amount"]),
            cap,
        );
        assert_bits(&format!("credit ret #{i}"), ret, num(&c["ret"]));
        assert_values(&format!("credit #{i}"), &cities_value(&cities), &c["after"]);
    }
}

#[test]
fn assign_from_pool_matches_running_web() {
    let d = data();
    let cases = arr(&d, "assign");
    assert!(cases.len() >= 600);
    for (i, c) in cases.iter().enumerate() {
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        assign_owner_resource_stock_from_pool(&mut cities, owner, &stock_rec(&c["pool"]));
        assert_values(&format!("assign #{i}"), &cities_value(&cities), &c["after"]);
    }
}

#[test]
fn explicit_utf16_tie_break_matches_running_web() {
    let d = data();
    for c in arr(&d, "explicit") {
        let name = text(&c["name"]);
        let mut cities = cities_from(&c["cities"]);
        let owner = c["owner"].as_i64().expect("owner");
        match text(&c["op"]).as_str() {
            "deduct" => {
                deduct_building_stock_cost_across_cities(&mut cities, owner, &stock_rec(&c["cost"]))
            }
            "credit" => {
                let ret = credit_owner_resource_stock(
                    &mut cities,
                    owner,
                    &text(&c["key"]),
                    num(&c["amount"]),
                    None,
                );
                assert_bits(&format!("{name} ret"), ret, num(&c["ret"]));
            }
            other => panic!("nieznana operacja {other}"),
        }
        assert_values(&name, &cities_value(&cities), &c["after"]);
    }
}
