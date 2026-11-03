//! R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1: przeplyw ilosciowy surowcow przez trasy handlowe 1:1 z pinem weba `4bbef081d`
//! (`gra/src/main.ts:34470-34498`, tuz przed dochodem tras). Liczenie przeplywow (`computeTradeRouteResourceFlow`)
//! zyje w `domain/trade.rs`; ten modul to SKLEJKA main.ts: pobor u dawcy po miastach
//! (`deductBuildingStockCostAcrossCities`) i dopisanie odbiorcy z limitem magazynu ODBIORCY
//! (`creditOwnerResourceStock` z `ownerResourceCap(.., flow.toOwnerId, ..)`).
//!
//! ZALOZENIE: `ownerResourceCap` (cap magazynu po epoce odbiorcy, `main.ts:34484-34487`) wchodzi jako domkniecie
//! `owner_resource_cap` (zrodlo capu: `turn_economy_advance::owner_resource_cap_for` i spichlerze/epoka wolajacego);
//! blok `try/catch` weba (`:34494-34496`, tylko `console.error`) nie ma odpowiednika — Rust nie panikuje na tych sciezkach.

use crate::domain::building_costs::p6_7b::{
    credit_owner_resource_stock, deduct_building_stock_cost_across_cities,
    owner_resource_stock_all, StockCitySource, StockRecord,
};
use crate::domain::trade::{
    compute_trade_route_resource_flow_with_options, TradeRoute, TradeRouteResourceFlow,
    TradeRouteResourceFlowParams, TRADE_ROUTE_STOCK_FLOW_KEYS,
};

/// Web `main.ts:34470-34498`: liczy przeplywy z biezacych zapasow panstw (`ownerResourceStockAll(cities, owner)[key]`),
/// potem dla kazdego przeplywu pobiera `amount` u dawcy i dopisuje odbiorcy (cap odbiorcy). Zwraca liste przeplywow.
pub fn apply_trade_route_resource_flows<T: StockCitySource>(
    cities: &mut [T],
    routes: &[TradeRoute],
    params: &TradeRouteResourceFlowParams,
    owner_resource_cap: &dyn Fn(i64) -> f64,
) -> Vec<TradeRouteResourceFlow> {
    let flows = {
        let snapshot: &[T] = cities;
        compute_trade_route_resource_flow_with_options(
            routes,
            |owner, key| {
                owner_resource_stock_all(snapshot, owner.get() as i64)
                    .get(key)
                    .copied()
                    .unwrap_or(0.0)
            },
            params,
            &TRADE_ROUTE_STOCK_FLOW_KEYS,
        )
    };
    for flow in &flows {
        let mut cost = StockRecord::new();
        cost.insert(flow.resource_key.clone(), flow.amount);
        deduct_building_stock_cost_across_cities(cities, flow.from_owner_id.get() as i64, &cost);
        let cap = owner_resource_cap(flow.to_owner_id.get() as i64);
        credit_owner_resource_stock(
            cities,
            flow.to_owner_id.get() as i64,
            &flow.resource_key,
            flow.amount,
            Some(cap),
        );
    }
    flows
}
