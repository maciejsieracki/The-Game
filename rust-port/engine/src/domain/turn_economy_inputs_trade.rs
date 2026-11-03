//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: wejscia handlowe `advanceCityEconomy` 1:1 z pinem weba `4bbef081d`
//! (`gra/src/game/trade-routes.ts:1535-1790` + sklejka `gra/src/main.ts:34503-34524`).
//!
//! UWAGA (rozbieznosc znaleziona w -Q6): istniejace `domain/trade.rs` (`compute_trade_route_income_by_city*`,
//! `load_trade_route_income_params`, `trade_route_distance_income`) liczy dochod trasy INNYM wzorem niz pin
//! (interpolacja `dochod_podloga/dochod_szczyt`, skala morza x2, zaokraglenie /5), podczas gdy pin czyta krzywe
//! `handel_szlaki.dochody_ladowe/dochody_morskie` (`:1584-1597`), mnozy x2 trase miedzy roznymi ownerami i dzieli
//! `ceil(x/2)` (`:1557-1566`). Tego pliku `trade.rs` NIE ruszamy (poza allowlista zmian zachowania); wejscia ticku
//! liczy ten modul, a `trade.rs` zostaje dlugiem -Q7 (zob. `P6-ADVANCE-CITY-ECONOMY-Q6.md`).
//!
//! Mapy `Map` weba -> `BTreeMap` (Z-Q5-4, porownanie po kluczach).

use std::collections::BTreeMap;

use serde_json::Value;

use crate::domain::trade::{TradeRoute, TradeRouteMedium};

/// Web `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` (`trade-routes.ts:1548-1551`).
pub const DEFAULT_DOCHODY_LADOWE: [f64; 13] = [
    1.0, 1.0, 2.0, 3.0, 3.0, 4.0, 4.0, 5.0, 6.0, 6.0, 7.0, 7.0, 8.0,
];
pub const DEFAULT_DOCHODY_MORSKIE: [f64; 21] = [
    2.0, 2.0, 3.0, 4.0, 5.0, 5.0, 6.0, 7.0, 8.0, 8.0, 9.0, 10.0, 10.0, 11.0, 12.0, 12.0, 13.0,
    14.0, 14.0, 15.0, 16.0,
];
/// Web `TRADE_ROUTE_INTERNATIONAL_MULTIPLIER` (`:1555`) i `TRADE_ROUTE_INCOME_HALF_DIVISOR` (`:1565`).
pub const TRADE_ROUTE_INTERNATIONAL_MULTIPLIER: f64 = 2.0;
pub const TRADE_ROUTE_INCOME_HALF_DIVISOR: f64 = 2.0;
/// Web `TRADE_ROUTE_BUILDING_BONUS_RATE` (`:1700`).
pub const TRADE_ROUTE_BUILDING_BONUS_RATE: f64 = 0.05;
/// Web `PORT_SEA_TRADE_BONUS_PIENIADZ` (`:1771`).
pub const PORT_SEA_TRADE_BONUS_PIENIADZ: f64 = 1.0;

/// Web `TradeRouteIncomeParams` (krzywe indeksowane dystansem heksowym).
#[derive(Debug, Clone, PartialEq)]
pub struct PinTradeIncomeParams {
    pub dochody_ladowe: Vec<f64>,
    pub dochody_morskie: Vec<f64>,
}

impl Default for PinTradeIncomeParams {
    fn default() -> Self {
        Self {
            dochody_ladowe: DEFAULT_DOCHODY_LADOWE.to_vec(),
            dochody_morskie: DEFAULT_DOCHODY_MORSKIE.to_vec(),
        }
    }
}

/// Web `loadTradeRouteIncomeParams` (`:1584-1604`): `raw.handel_szlaki?.[key]?.[difficulty]` musi byc niepusta
/// tablica liczb skonczonych, inaczej krzywa domyslna.
pub fn load_pin_trade_income_params(econ: Option<&Value>, difficulty: &str) -> PinTradeIncomeParams {
    let grp = econ.and_then(|e| e.get("handel_szlaki"));
    let read = |key: &str, fallback: &[f64]| -> Vec<f64> {
        let v = grp
            .and_then(|g| g.get(key))
            .and_then(|row| row.get(difficulty))
            .and_then(Value::as_array);
        match v {
            Some(a) if !a.is_empty() && a.iter().all(|x| x.as_f64().is_some_and(f64::is_finite)) => {
                a.iter().map(|x| x.as_f64().unwrap()).collect()
            }
            _ => fallback.to_vec(),
        }
    };
    PinTradeIncomeParams {
        dochody_ladowe: read("dochody_ladowe", &DEFAULT_DOCHODY_LADOWE),
        dochody_morskie: read("dochody_morskie", &DEFAULT_DOCHODY_MORSKIE),
    }
}

/// Web `tradeRouteIncomeByDistance` (`:1554-1562`).
pub fn pin_route_income_by_distance(
    dystans: f64,
    medium: TradeRouteMedium,
    params: &PinTradeIncomeParams,
) -> f64 {
    let curve = match medium {
        TradeRouteMedium::Land => &params.dochody_ladowe,
        TradeRouteMedium::Sea => &params.dochody_morskie,
    };
    let hi = curve.len() as f64 - 1.0;
    let idx = dystans.floor().min(hi).max(0.0);
    if idx.is_nan() {
        // `curve[NaN]` -> undefined -> 0 (`?? 0`).
        return 0.0;
    }
    curve.get(idx as usize).copied().unwrap_or(0.0)
}

/// Web `tradeRouteIncomeForRoute` (`:1568-1577`).
pub fn pin_route_income_for_route(route: &TradeRoute, params: &PinTradeIncomeParams) -> f64 {
    let base = pin_route_income_by_distance(f64::from(route.distance), route.medium, params);
    let before_half = if route.owner_id == route.to_owner_id {
        base
    } else {
        base * TRADE_ROUTE_INTERNATIONAL_MULTIPLIER
    };
    (before_half / TRADE_ROUTE_INCOME_HALF_DIVISOR).ceil()
}

/// Web `TradeRouteIncomeByCityBreakdown` (`:1625-1628`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct TradeIncomeBreakdown {
    pub total_by_city: BTreeMap<String, f64>,
    pub maritime_by_city: BTreeMap<String, f64>,
}

/// Web `computeTradeRouteIncomeByCityBreakdown` (`:1631-1659`).
pub fn compute_pin_trade_income_breakdown(
    routes: &[TradeRoute],
    params: &PinTradeIncomeParams,
    wonder_trade_bonus_for_owner: &dyn Fn(i64, TradeRouteMedium) -> f64,
    targowisko_bonus_for_city: &dyn Fn(&str) -> f64,
) -> TradeIncomeBreakdown {
    let mut out = TradeIncomeBreakdown::default();
    for route in routes {
        if !route.is_connected() {
            continue;
        }
        let route_income = pin_route_income_for_route(route, params);
        let from_wonder = wonder_trade_bonus_for_owner(route.owner_id.get() as i64, route.medium);
        let to_wonder = wonder_trade_bonus_for_owner(route.to_owner_id.get() as i64, route.medium);
        let from_after_wonder = if from_wonder == 0.0 {
            route_income
        } else {
            (route_income * (1.0 + from_wonder)).floor()
        };
        let to_after_wonder = if to_wonder == 0.0 {
            route_income
        } else {
            (route_income * (1.0 + to_wonder)).floor()
        };
        let from_targ = targowisko_bonus_for_city(&route.from_city_id);
        let to_targ = targowisko_bonus_for_city(&route.to_city_id);
        let from_income = if from_targ == 0.0 {
            from_after_wonder
        } else {
            (from_after_wonder * (1.0 + from_targ)).floor()
        };
        let to_income = if to_targ == 0.0 {
            to_after_wonder
        } else {
            (to_after_wonder * (1.0 + to_targ)).floor()
        };
        *out.total_by_city.entry(route.from_city_id.clone()).or_insert(0.0) += from_income;
        *out.total_by_city.entry(route.to_city_id.clone()).or_insert(0.0) += to_income;
        if route.medium == TradeRouteMedium::Sea {
            *out.maritime_by_city.entry(route.from_city_id.clone()).or_insert(0.0) += from_income;
            *out.maritime_by_city.entry(route.to_city_id.clone()).or_insert(0.0) += to_income;
        }
    }
    out
}

/// Web `computeTradeRouteBuildingBonusByCity` (`:1712-1729`) z domyslnymi parametrami (wolajacy `main.ts:16711`
/// NIE podaje `params`, wiec `DEFAULT_TRADE_ROUTE_INCOME_PARAMS`, nie krzywe z trudnosci).
pub fn compute_pin_trade_route_building_bonus_by_city(
    routes: &[TradeRoute],
    params: &PinTradeIncomeParams,
) -> BTreeMap<String, f64> {
    let mut out: BTreeMap<String, f64> = BTreeMap::new();
    for route in routes {
        if !route.is_connected() || !route.building_unlocked {
            continue;
        }
        let bonus = TRADE_ROUTE_BUILDING_BONUS_RATE * pin_route_income_for_route(route, params);
        *out.entry(route.from_city_id.clone()).or_insert(0.0) += bonus;
        *out.entry(route.to_city_id.clone()).or_insert(0.0) += bonus;
    }
    out
}

/// Web `computeSeaTradeRouteCountByCity` (`:1739-1749`).
pub fn compute_pin_sea_trade_route_count_by_city(routes: &[TradeRoute]) -> BTreeMap<String, f64> {
    let mut out: BTreeMap<String, f64> = BTreeMap::new();
    for route in routes {
        if !route.is_connected() || route.medium != TradeRouteMedium::Sea {
            continue;
        }
        *out.entry(route.from_city_id.clone()).or_insert(0.0) += 1.0;
        *out.entry(route.to_city_id.clone()).or_insert(0.0) += 1.0;
    }
    out
}

/// Web `computeSeaTradeBonusIncomeByCity` (`:1773-1783`).
pub fn compute_pin_sea_trade_bonus_income_by_city(
    sea_count_by_city: &BTreeMap<String, f64>,
    bonus_per_route: f64,
) -> BTreeMap<String, f64> {
    let mut out = BTreeMap::new();
    for (city, count) in sea_count_by_city {
        let extra = (count - 1.0).max(0.0);
        if extra > 0.0 {
            out.insert(city.clone(), extra * bonus_per_route);
        }
    }
    out
}

/// Trzy mapy handlowe podawane do `advanceCityEconomy` (`main.ts:34503-34524`, `:16711`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct TradeTickInputs {
    pub trade_income_by_city: BTreeMap<String, f64>,
    pub maritime_trade_income_by_city: BTreeMap<String, f64>,
    pub trade_route_building_bonus_by_city: BTreeMap<String, f64>,
}

/// Sklejka `main.ts:34503-34524` (+ `:16711`): dochod z tras, podzbior morski, premia budynkowa, bonus Portu
/// za szlaki morskie ponad pierwszy dopisany do OBU map dochodu.
pub fn build_trade_tick_inputs(
    routes: &[TradeRoute],
    income_params: &PinTradeIncomeParams,
    wonder_trade_bonus_for_owner: &dyn Fn(i64, TradeRouteMedium) -> f64,
    targowisko_bonus_for_city: &dyn Fn(&str) -> f64,
) -> TradeTickInputs {
    let mut b = compute_pin_trade_income_breakdown(
        routes,
        income_params,
        wonder_trade_bonus_for_owner,
        targowisko_bonus_for_city,
    );
    let sea_bonus = compute_pin_sea_trade_bonus_income_by_city(
        &compute_pin_sea_trade_route_count_by_city(routes),
        PORT_SEA_TRADE_BONUS_PIENIADZ,
    );
    for (city, bonus) in &sea_bonus {
        *b.total_by_city.entry(city.clone()).or_insert(0.0) += bonus;
        *b.maritime_by_city.entry(city.clone()).or_insert(0.0) += bonus;
    }
    TradeTickInputs {
        trade_income_by_city: b.total_by_city,
        maritime_trade_income_by_city: b.maritime_by_city,
        trade_route_building_bonus_by_city: compute_pin_trade_route_building_bonus_by_city(
            routes,
            &PinTradeIncomeParams::default(),
        ),
    }
}
