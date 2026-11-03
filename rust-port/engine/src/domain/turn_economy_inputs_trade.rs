//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: wejscia handlowe `advanceCityEconomy` 1:1 z pinem weba `4bbef081d`
//! (`gra/src/game/trade-routes.ts:1535-1790` + sklejka `gra/src/main.ts:34503-34524`).
//!
//! R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1: dlug -Q7 pkt 1 SPLACONY. Dawna, rownolegla implementacja dochodu zostala
//! USUNIETA; cala logika (krzywe `handel_szlaki`, x2 miedzy ownerami, `ceil/2`, bonusy, loader krzywych) zyje w
//! `domain/trade.rs` (jedno zrodlo prawdy). Ten modul zostawia tylko sklejke ticku (`build_trade_tick_inputs`) i
//! nazwy `*_pin_*` jako cienkie aliasy/delegacje dla istniejacych wolajacych (`turn_economy_wire`).
//!
//! Mapy `Map` weba -> `BTreeMap` (Z-Q5-4, porownanie po kluczach).

use std::collections::BTreeMap;

use serde_json::Value;

use crate::domain::trade::{
    self, compute_sea_trade_bonus_income_by_city, compute_sea_trade_route_count_by_city,
    compute_trade_route_building_bonus_by_city, compute_trade_route_income_by_city_breakdown,
    SeaTradeBonusParams, TradeRoute, TradeRouteIncomeParams, TradeRouteMedium,
};
use crate::domain::PlayerId;

pub use crate::domain::trade::{
    TradeIncomeBreakdown, DEFAULT_DOCHODY_LADOWE, DEFAULT_DOCHODY_MORSKIE,
    TRADE_ROUTE_INCOME_HALF_DIVISOR, TRADE_ROUTE_INTERNATIONAL_MULTIPLIER,
};

/// Web `TradeRouteIncomeParams` (alias na wspolny typ `trade.rs`).
pub type PinTradeIncomeParams = TradeRouteIncomeParams;

/// Web `loadTradeRouteIncomeParams` (`:1584-1604`) — delegacja do `trade::load_trade_route_income_params`.
pub fn load_pin_trade_income_params(
    econ: Option<&Value>,
    difficulty: &str,
) -> PinTradeIncomeParams {
    trade::load_trade_route_income_params(econ, difficulty)
}

/// Trzy mapy handlowe podawane do `advanceCityEconomy` (`main.ts:34503-34524`, `:16711`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct TradeTickInputs {
    pub trade_income_by_city: BTreeMap<String, f64>,
    pub maritime_trade_income_by_city: BTreeMap<String, f64>,
    pub trade_route_building_bonus_by_city: BTreeMap<String, f64>,
}

/// Sklejka `main.ts:34503-34524` (+ `:16711`): dochod z tras, podzbior morski, premia budynkowa, bonus Portu
/// za szlaki morskie ponad pierwszy dopisany do OBU map dochodu. Wolajacy `main.ts:16711` NIE podaje `params`
/// premii budynkowej, wiec `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` (nie krzywe z trudnosci).
pub fn build_trade_tick_inputs(
    routes: &[TradeRoute],
    income_params: &PinTradeIncomeParams,
    wonder_trade_bonus_for_owner: &dyn Fn(i64, TradeRouteMedium) -> f64,
    targowisko_bonus_for_city: &dyn Fn(&str) -> f64,
) -> TradeTickInputs {
    let mut b = compute_trade_route_income_by_city_breakdown(
        routes,
        income_params,
        |owner: PlayerId, medium| wonder_trade_bonus_for_owner(owner.get() as i64, medium),
        targowisko_bonus_for_city,
    );
    let sea_bonus = compute_sea_trade_bonus_income_by_city(
        &compute_sea_trade_route_count_by_city(routes),
        SeaTradeBonusParams::default(), // web `PORT_SEA_TRADE_BONUS_PIENIADZ` (`:1771`) = tabela derived
    );
    for (city, bonus) in &sea_bonus {
        *b.total_by_city.entry(city.clone()).or_insert(0.0) += bonus;
        *b.maritime_by_city.entry(city.clone()).or_insert(0.0) += bonus;
    }
    TradeTickInputs {
        trade_income_by_city: b.total_by_city,
        maritime_trade_income_by_city: b.maritime_by_city,
        trade_route_building_bonus_by_city: compute_trade_route_building_bonus_by_city(
            routes,
            &PinTradeIncomeParams::default(),
        ),
    }
}
