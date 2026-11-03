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
    assert_eq!(
        growth_percent_with_order_multiplier(10.0, f64::INFINITY),
        10.0
    );
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

// ---------------------------------------------------------------------------------------------------------------
// OBRONA R1: P11 (zapis hp/hpMax z powrotem po `applyGoldDeficitHpLoss`) i Z-POST-3 (kolejnosc wlascicieli).
// ---------------------------------------------------------------------------------------------------------------

use std::collections::BTreeSet;

use civ_engine::domain::turn_economy::gold_deficit::{
    GoldDeficitParams, GoldDeficitRuntime, GoldDeficitState,
};
use civ_engine::domain::turn_economy_attrition::AttritionUnit;
use civ_engine::domain::turn_economy_post::{run_gold_deficit_step, GoldDeficitStepInput};

fn attrition_unit(id: &str, owner: i64, hp: Option<f64>, hp_max: Option<f64>) -> AttritionUnit {
    AttritionUnit {
        id: id.to_string(),
        owner_id: owner,
        type_id: "Hoplita".to_string(),
        category: "Piechota".to_string(),
        hp,
        hp_max,
        oblega_city_id: None,
        in_garnizon: false,
        q: 0.0,
        r: 0.0,
    }
}

/// Web `gold-deficit.ts:239-240`: jednostka bez `hpMax`/`hp` dostaje `hpMax = getMaxHp(type)`, `hp = hpMax`
/// (przed odjeciem straty), a mutacja jest widoczna w globalnej liscie jednostek. Rust musi zapisac OBA pola
/// z powrotem (mutant P11 przezywal, bo fixture nie mial jednostek z `hpMax = None`).
#[test]
fn gold_deficit_step_writes_back_hp_and_hp_max_when_unset() {
    let params = GoldDeficitParams {
        zloto_deficyt_stat_mult: 0.5,
        zloto_deficyt_karencja_tur: 1.0,
        zloto_deficyt_hp_frac: 0.25,
    };
    let humans: BTreeSet<i64> = [0].into_iter().collect();
    let treasury = |_o: i64| -5.0;
    let health = |t: &str| if t == "Hoplita" { 40.0 } else { 0.0 };
    let input = GoldDeficitStepInput {
        params: &params,
        human_owner_ids: &humans,
        owner_treasury: &treasury,
        unit_health_by_type: &health,
    };
    let mut units = vec![
        attrition_unit("a", 0, None, None),
        attrition_unit("b", 0, Some(25.0), None),
        attrition_unit("c", 0, Some(30.0), Some(60.0)),
        attrition_unit("d", 7, None, None),
    ];
    let mut states: BTreeMap<i64, GoldDeficitState> = BTreeMap::new();
    let mut runtime = GoldDeficitRuntime::new();
    let mut sieges = Vec::new();
    let mut besieger = BTreeMap::new();
    let out = run_gold_deficit_step(
        &[],
        &mut states,
        &mut runtime,
        &mut units,
        &mut sieges,
        &mut besieger,
        &input,
    );
    assert_eq!(out.player_damaged_count, 3);
    assert_eq!(out.player_destroyed_count, 0);
    // a: hpMax=40, hp=40-10=30
    assert_eq!((units[0].hp, units[0].hp_max), (Some(30.0), Some(40.0)));
    // b: hpMax=40, hp=25-10=15
    assert_eq!((units[1].hp, units[1].hp_max), (Some(15.0), Some(40.0)));
    // c: hpMax bez zmian, hp=30-15=15
    assert_eq!((units[2].hp, units[2].hp_max), (Some(15.0), Some(60.0)));
    // d: obcy wlasciciel, nietkniety
    assert_eq!((units[3].hp, units[3].hp_max), (None, None));
}

/// Z-POST-3: web `new Set([0, ...ai, ...goldDeficitStates.keys()])` zachowuje kolejnosc wstawiania `Map`
/// (tu 5, 3 => [0, 5, 3]); Rust `BTreeMap` iteruje rosnaco => [0, 3, 5]. Udokumentowane odstepstwo: wlasciciele sa
/// niezalezni, wiec zmienia sie tylko kolejnosc `owner_ids`/`per_owner`, nie stany ani jednostki.
#[test]
fn gold_deficit_step_owner_order_is_ascending_z_post_3() {
    let params = GoldDeficitParams {
        zloto_deficyt_stat_mult: 0.5,
        zloto_deficyt_karencja_tur: 99.0,
        zloto_deficyt_hp_frac: 0.25,
    };
    let humans: BTreeSet<i64> = [0].into_iter().collect();
    let treasury = |o: i64| if o == 5 { -1.0 } else { 10.0 };
    let health = |_t: &str| 40.0;
    let input = GoldDeficitStepInput {
        params: &params,
        human_owner_ids: &humans,
        owner_treasury: &treasury,
        unit_health_by_type: &health,
    };
    let mut states: BTreeMap<i64, GoldDeficitState> = BTreeMap::new();
    states.insert(5, GoldDeficitState::default());
    states.insert(3, GoldDeficitState::default());
    let mut units: Vec<AttritionUnit> = Vec::new();
    let mut runtime = GoldDeficitRuntime::new();
    let mut sieges = Vec::new();
    let mut besieger = BTreeMap::new();
    let out = run_gold_deficit_step(
        &[],
        &mut states,
        &mut runtime,
        &mut units,
        &mut sieges,
        &mut besieger,
        &input,
    );
    assert_eq!(out.owner_ids, vec![0, 3, 5]);
    assert_eq!(states[&5].tury_deficytu_zlota, 1);
    assert_eq!(states[&3].tury_deficytu_zlota, 0);
}
