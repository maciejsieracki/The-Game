//! R-RUSTPORT-P6-ECON-TICK-POST-Q1: testy jednostkowe czystych funkcji (`turn_economy_post.rs`, `city_growth.rs` ext).
//! Wartosci oczekiwane = wyniki JS (`Math.max/isFinite`), policzone recznie z kodu weba (pin `4bbef081d`).

use std::collections::BTreeMap;

use civ_engine::domain::city_growth::p6_7a::growth_percent_with_order_multiplier;
use civ_engine::domain::order_effects_lane::{OrderLaneCityReport, OrderLaneOutput};
use civ_engine::domain::turn_economy_post::{
    apply_praca_upkeep_post, growth_inputs_from_order_lane, PostPracaPools,
};
use civ_engine::domain::types::porzadek::OrderTier;

#[test]
fn growth_percent_with_order_multiplier_matches_js() {
    // `population-growth-v85.ts:288-295`
    assert_eq!(growth_percent_with_order_multiplier(10.0, 1.0), 10.0);
    assert_eq!(growth_percent_with_order_multiplier(10.0, 0.5), 5.0);
    assert_eq!(growth_percent_with_order_multiplier(10.0, -3.0), 0.0); // max(0, -3)
    assert_eq!(growth_percent_with_order_multiplier(10.0, f64::NAN), 10.0); // !isFinite -> 1
    assert_eq!(growth_percent_with_order_multiplier(10.0, f64::INFINITY), 10.0);
    assert_eq!(growth_percent_with_order_multiplier(-4.0, 2.0), -8.0);
}

#[test]
fn praca_upkeep_post_matches_web_branches() {
    // `main.ts:36097-36116`
    let mut pools = PostPracaPools {
        player_praca_pool: 10.0,
        ai_praca_pool_by_owner: BTreeMap::from([(2, 5.0), (3, 1.0)]),
    };
    let up = BTreeMap::from([(0, 4.0), (2, 8.0), (3, 0.0), (5, 2.0)]);
    let o = apply_praca_upkeep_post(&mut pools, &up, 1.5);
    assert_eq!(pools.player_praca_pool, 6.0);
    assert_eq!(pools.ai_praca_pool_by_owner[&2], 0.0); // max(0, 5-8)
    assert_eq!(pools.ai_praca_pool_by_owner[&3], 1.0); // up <= 0 pomijane
    assert_eq!(pools.ai_praca_pool_by_owner[&5], 0.0); // brak puli -> 0 - 2 -> 0
    assert_eq!(o.last_praca_upkeep, 4.0);
    assert_eq!(o.last_praca_rate, -2.5);
    // upkeep gracza == 0: pula bez zmian, rate -= 0
    let mut p2 = PostPracaPools {
        player_praca_pool: -2.5,
        ai_praca_pool_by_owner: BTreeMap::new(),
    };
    let o2 = apply_praca_upkeep_post(&mut p2, &BTreeMap::new(), 7.0);
    assert_eq!(p2.player_praca_pool, -2.5);
    assert_eq!(o2.last_praca_rate, 7.0);
    // NaN w puli: Math.max(0, NaN) = NaN
    let mut p3 = PostPracaPools {
        player_praca_pool: f64::NAN,
        ai_praca_pool_by_owner: BTreeMap::new(),
    };
    apply_praca_upkeep_post(&mut p3, &BTreeMap::from([(0, 1.0)]), 0.0);
    assert!(p3.player_praca_pool.is_nan());
}

#[test]
fn growth_inputs_from_order_lane_maps_reports() {
    let rep = |id: &str, sz: f64, cz: f64| OrderLaneCityReport {
        city_id: id.to_string(),
        por_pct: 0.0,
        sz_pct: 0.0,
        praw_pct: 0.0,
        tier: OrderTier::Neutral,
        ha_kult: 0.0,
        ha_rel: 0.0,
        own_culture_share: 1.0,
        bunt: false,
        revolt_warning: false,
        revolt_grace_turns_left: None,
        szczescie: sz,
        citizen_growth_pct_delta: cz,
    };
    let out = OrderLaneOutput {
        reports: vec![rep("a", 12.5, -2.0), rep("b", -1.0, 0.0)],
        ..OrderLaneOutput::default()
    };
    let (h, c) = growth_inputs_from_order_lane(&out);
    assert_eq!(h["a"], 12.5);
    assert_eq!(h["b"], -1.0);
    assert_eq!(c["a"], -2.0);
    assert_eq!(c["b"], 0.0);
    assert_eq!(h.len(), 2);
}
