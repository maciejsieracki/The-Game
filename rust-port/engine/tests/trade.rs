#![allow(dead_code)]

use std::collections::BTreeMap;

use civ_engine::domain::trade;
use trade::{
    compute_sea_trade_bonus_income_by_city, compute_sea_trade_route_count_by_city,
    compute_trade_route_resource_grants, create_trade_route, diff_trade_routes,
    find_city_connection, find_city_connection_with_options, has_trade_route_resource_access,
    refresh_trade_routes, trade_route_pair_key, CityConnectionResult, HexCoord,
    SeaTradeBonusParams, TerrainType, TerritoryNode, TradeCity, TradeMap, TradeRoute,
    TradeRouteIncomeParams, TradeRouteMedium, TradeRouteResourceFlowParams, TradeRouteStatus,
    TradeTile, DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
};

fn line_map(length: i32) -> TradeMap {
    let mut map = TradeMap::new(length as u32, 1);
    for q in 0..length {
        map.insert(HexCoord::new(q, 0), TerrainType::Plains);
    }
    map
}

fn city(id: &str, owner_id: u64, q: i32, r: i32) -> TradeCity {
    TradeCity::new(id, owner_id, q, r)
}

#[allow(clippy::too_many_arguments)]
fn route(
    id: &str,
    from_city_id: &str,
    to_city_id: &str,
    owner_id: u64,
    to_owner_id: u64,
    medium: TradeRouteMedium,
    distance: u32,
    status: TradeRouteStatus,
    building_unlocked: bool,
) -> TradeRoute {
    TradeRoute::from_parts(
        id,
        from_city_id,
        to_city_id,
        owner_id,
        to_owner_id,
        medium,
        distance,
        status,
        building_unlocked,
    )
}

fn buildings(entries: &[(&str, &[&str])]) -> BTreeMap<String, Vec<String>> {
    entries
        .iter()
        .map(|(city_id, ids)| {
            (
                (*city_id).to_owned(),
                ids.iter().map(|id| (*id).to_owned()).collect(),
            )
        })
        .collect()
}

#[test]
fn land_and_sea_connection_follow_physical_terrain_without_distance_cap() {
    let mut map = line_map(21);
    let far_from = city("from", 0, 0, 0);
    let far_to = city("to", 1, 20, 0);

    let far = find_city_connection(&far_from, &far_to, &map, TradeRouteMedium::Land);
    assert!(far.connected);
    assert_eq!(far.distance, 20);
    assert_eq!(far.path_hexes.len(), 21);
    assert_eq!(far.path_hexes.first(), Some(&"0,0".to_owned()));
    assert_eq!(far.path_hexes.last(), Some(&"20,0".to_owned()));

    map.insert(HexCoord::new(10, 0), TerrainType::Mountains);
    let blocked = find_city_connection(&far_from, &far_to, &map, TradeRouteMedium::Land);
    assert!(!blocked.connected);
    assert!(blocked.path_hexes.is_empty());

    let mut sea_map = TradeMap::new(8, 1);
    for q in 0..8 {
        sea_map.insert(HexCoord::new(q, 0), TerrainType::ShallowWater);
    }
    // Cities stand on the water edge; the endpoint itself is accepted by the
    // BFS, while the connecting fields must be water.
    let sea_from = city("sea-from", 0, 0, 0);
    let sea_to = city("sea-to", 1, 7, 0);
    let no_ports = find_city_connection(&sea_from, &sea_to, &sea_map, TradeRouteMedium::Sea);
    assert!(!no_ports.connected);

    let built = buildings(&[("sea-from", &["port"]), ("sea-to", &["port_wielki"])]);
    let with_ports = find_city_connection_with_options(
        &sea_from,
        &sea_to,
        &sea_map,
        TradeRouteMedium::Sea,
        &built,
        None,
        true,
    );
    assert!(with_ports.connected);
    assert_eq!(with_ports.distance, 7);
    assert_eq!(with_ports.path_hexes.first(), Some(&"0,0".to_owned()));
    assert_eq!(with_ports.path_hexes.last(), Some(&"7,0".to_owned()));
}

#[test]
fn diagonal_path_uses_the_canonical_hex_neighbor_order() {
    let mut map = TradeMap::new(0, 0);
    for q in -5..=0 {
        for r in -5..=0 {
            map.insert(HexCoord::new(q, r), TerrainType::Plains);
        }
    }
    let from = city("from", 0, 0, 0);
    let to = city("to", 1, -5, -5);

    let result = find_city_connection(&from, &to, &map, TradeRouteMedium::Land);
    assert!(result.connected);
    assert_eq!(result.path_hexes.first(), Some(&"0,0".to_owned()));
    assert_eq!(result.path_hexes.get(1), Some(&"-1,0".to_owned()));
    assert_eq!(result.path_hexes.last(), Some(&"-5,-5".to_owned()));
}

#[test]
fn land_border_is_required_only_when_territory_data_is_supplied() {
    let map = line_map(11);
    let from = city("from", 10, 0, 0);
    let to = city("to", 20, 10, 0);

    let without_territory = find_city_connection(&from, &to, &map, TradeRouteMedium::Land);
    assert!(without_territory.connected);

    let separated = [
        TerritoryNode::new(10, 0, 0, 2),
        TerritoryNode::new(20, 10, 0, 2),
    ];
    let blocked = find_city_connection_with_options(
        &from,
        &to,
        &map,
        TradeRouteMedium::Land,
        &BTreeMap::new(),
        Some(&separated),
        true,
    );
    assert!(!blocked.connected);

    let touching = [
        TerritoryNode::new(10, 0, 0, 5),
        TerritoryNode::new(20, 10, 0, 5),
    ];
    let connected = find_city_connection_with_options(
        &from,
        &to,
        &map,
        TradeRouteMedium::Land,
        &BTreeMap::new(),
        Some(&touching),
        false,
    );
    assert!(connected.connected);
    assert!(connected.path_hexes.is_empty());
}

#[test]
fn route_identity_construction_and_building_limits_are_deterministic() {
    assert_eq!(
        trade::trade_route_id("a", "b", TradeRouteMedium::Land),
        "a->b:lad"
    );
    assert_eq!(trade_route_pair_key("z", "a"), "a~z");

    let map = line_map(6);
    let from = city("a", 0, 0, 0);
    let to = city("b", 1, 5, 0);
    let no_buildings: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let plain_route = create_trade_route(&from, &to, &map, TradeRouteMedium::Land);
    assert_eq!(plain_route.status, TradeRouteStatus::Connected);
    assert!(!plain_route.building_unlocked);
    assert_eq!(plain_route.distance, 5);

    let built = buildings(&[("a", &["targowisko"]), ("b", &["port_wielki"])]);
    let built_route = trade::create_trade_route_with_options(
        &from,
        &to,
        &map,
        TradeRouteMedium::Land,
        &built,
        None,
    );
    assert!(built_route.building_unlocked);
    assert_eq!(trade::trade_route_limit_for_city("a", &built), 1);
    assert_eq!(trade::trade_route_limit_for_city("b", &built), 1);
    assert_eq!(
        trade::trade_route_existence_limit_for_city("a", &no_buildings),
        1
    );
    assert_eq!(trade::trade_route_existence_limit_for_city("a", &built), 2);
}

#[test]
fn refresh_requires_treaty_and_war_free_route_but_allows_internal_trade() {
    let map = line_map(12);
    let a = city("a", 0, 0, 0);
    let b = city("b", 1, 5, 0);
    let c = city("c", 0, 10, 0);
    let all = [a.clone(), b.clone(), c.clone()];
    let built = buildings(&[("a", &["targowisko"]), ("b", &["targowisko"])]);

    let no_treaty = refresh_trade_routes(
        &all,
        &[],
        &map,
        &built,
        |_left, _right| false,
        |_left, _right| false,
    );
    assert_eq!(no_treaty.len(), 1);
    assert_eq!(no_treaty[0].owner_id, 0);
    assert_eq!(no_treaty[0].to_owner_id, 0);

    let with_treaty = refresh_trade_routes(
        &all,
        &[],
        &map,
        &built,
        |_left, _right| false,
        |_left, _right| true,
    );
    assert_eq!(with_treaty.len(), 2);
    assert!(with_treaty
        .iter()
        .any(|r| r.owner_id == 0 && r.to_owner_id == 1));
    assert!(with_treaty
        .iter()
        .any(|r| r.owner_id == 0 && r.to_owner_id == 0));

    let at_war = refresh_trade_routes(
        &all,
        &with_treaty,
        &map,
        &built,
        |left, right| (left == 0 && right == 1) || (left == 1 && right == 0),
        |_left, _right| true,
    );
    assert!(at_war
        .iter()
        .all(|r| !(r.owner_id == 0 && r.to_owner_id == 1)));
    assert!(at_war.iter().any(|r| r.owner_id == 0 && r.to_owner_id == 0));
}

#[test]
fn income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule() {
    let params = DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
    assert_eq!(
        trade::trade_route_distance_income_with_params(0, TradeRouteMedium::Land, &params),
        5
    );
    assert_eq!(
        trade::trade_route_distance_income_with_params(6, TradeRouteMedium::Land, &params),
        22
    );
    assert_eq!(
        trade::trade_route_distance_income_with_params(12, TradeRouteMedium::Land, &params),
        40
    );
    assert_eq!(
        trade::trade_route_distance_income_with_params(1_000, TradeRouteMedium::Land, &params),
        40
    );
    assert_eq!(
        trade::trade_route_distance_income_with_params(10, TradeRouteMedium::Sea, &params),
        22
    );
    assert_eq!(
        trade::trade_route_total_distance_income_with_params(0, TradeRouteMedium::Sea, &params),
        2
    );
    assert_eq!(
        trade::trade_route_total_distance_income_with_params(20, TradeRouteMedium::Sea, &params),
        16
    );
    assert_eq!(
        trade::trade_route_total_distance_income_with_params(12, TradeRouteMedium::Land, &params),
        8
    );

    let custom = TradeRouteIncomeParams::new(10, 20, 4, 8);
    assert_eq!(
        trade::trade_route_distance_income_with_params(2, TradeRouteMedium::Land, &custom),
        15
    );
    assert_eq!(
        trade::trade_route_distance_income_with_params(100, TradeRouteMedium::Sea, &custom),
        20
    );
}

#[test]
fn route_income_building_and_sea_bonuses_are_aggregated_per_city() {
    let params = DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
    let land = route(
        "land",
        "a",
        "b",
        0,
        1,
        TradeRouteMedium::Land,
        5,
        TradeRouteStatus::Connected,
        true,
    );
    let sea = route(
        "sea",
        "a",
        "c",
        0,
        2,
        TradeRouteMedium::Sea,
        10,
        TradeRouteStatus::Connected,
        false,
    );
    let inactive = route(
        "inactive",
        "a",
        "d",
        0,
        3,
        TradeRouteMedium::Land,
        1,
        TradeRouteStatus::NoConnection,
        true,
    );
    let routes = [land.clone(), sea.clone(), inactive];

    let income = trade::compute_trade_route_income_by_city_with_params(
        &routes,
        &params,
        |_owner, _medium| 0.0,
    );
    assert_eq!(income["a"], 4 + 9);
    assert_eq!(income["b"], 4);
    assert_eq!(income["c"], 9);
    assert!(!income.contains_key("d"));

    let with_wonder = trade::compute_trade_route_income_by_city_with_params(
        std::slice::from_ref(&land),
        &params,
        |owner, _| {
            if owner == 0 {
                0.5
            } else {
                0.0
            }
        },
    );
    assert_eq!(with_wonder["a"], 6);
    assert_eq!(with_wonder["b"], 4);

    let building_bonus =
        trade::compute_trade_route_building_bonus_by_city_with_params(&routes, &params);
    assert_eq!(building_bonus["a"], 0.2);
    assert_eq!(building_bonus["b"], 0.2);
    assert!(!building_bonus.contains_key("c"));
    assert_eq!(
        trade::trade_route_building_bonus_for_route_with_params(&land, &params),
        0.2
    );
    assert_eq!(
        trade::trade_route_building_bonus_for_route_with_params(&sea, &params),
        0.0
    );

    let sea_counts = compute_sea_trade_route_count_by_city(&routes);
    assert_eq!(sea_counts["a"], 1);
    assert_eq!(sea_counts["c"], 1);
    let sea_bonus =
        compute_sea_trade_bonus_income_by_city(&sea_counts, SeaTradeBonusParams::default());
    assert!(sea_bonus.is_empty());
}

#[test]
fn grants_are_symmetric_and_disappear_with_inactive_routes() {
    let active = route(
        "route-2",
        "city-a",
        "city-b",
        5,
        6,
        TradeRouteMedium::Land,
        4,
        TradeRouteStatus::Connected,
        false,
    );
    let inactive = TradeRoute {
        status: TradeRouteStatus::NoConnection,
        ..active.clone()
    };
    let native =
        |owner: u64, key: &str| (owner == 5 && key == "zelazo") || (owner == 6 && key == "braz");

    let grants = compute_trade_route_resource_grants(std::slice::from_ref(&active), native);
    assert_eq!(grants.len(), 2);
    assert!(has_trade_route_resource_access(&grants, 5, "braz"));
    assert!(has_trade_route_resource_access(&grants, 6, "zelazo"));
    assert!(!has_trade_route_resource_access(&grants, 5, "zelazo"));
    assert_eq!(grants[0].via_city_id, "city-a");
    assert_eq!(grants[0].route_id, "route-2");
    assert!(compute_trade_route_resource_grants(&[inactive], native).is_empty());

    let ordered = [
        trade::TradeRouteResourceGrant::new(5, "braz", 6, "city-a", "z-route"),
        trade::TradeRouteResourceGrant::new(5, "braz", 6, "city-a", "a-route"),
    ];
    assert_eq!(
        trade::first_trade_route_resource_grant(&ordered, 5, "braz")
            .expect("grant exists")
            .route_id,
        "a-route"
    );
}

#[test]
fn resource_flow_moves_only_surplus_and_uses_deterministic_ledger() {
    let routes = [
        route(
            "b-route",
            "a",
            "b",
            1,
            2,
            TradeRouteMedium::Land,
            1,
            TradeRouteStatus::Connected,
            false,
        ),
        route(
            "a-route",
            "a",
            "c",
            1,
            3,
            TradeRouteMedium::Land,
            1,
            TradeRouteStatus::Connected,
            false,
        ),
    ];
    let stocks = |owner: u64, key: &str| match (owner, key) {
        (1, "cegla") => 10,
        (2, "cegla") => 0,
        (3, "cegla") => 0,
        _ => 0,
    };
    let flows = trade::compute_trade_route_resource_flow_with_options(
        &routes,
        stocks,
        &TradeRouteResourceFlowParams::default(),
        &["cegla"],
    );
    assert_eq!(flows.len(), 1);
    assert_eq!(flows[0].route_id, "a-route");
    assert_eq!(flows[0].amount, 8);
    assert_eq!(flows[0].from_owner_id, 1);
    assert_eq!(flows[0].to_owner_id, 3);

    let at_reserve = trade::compute_trade_route_resource_flow_with_options(
        &[route(
            "only",
            "a",
            "b",
            1,
            2,
            TradeRouteMedium::Land,
            1,
            TradeRouteStatus::Connected,
            false,
        )],
        |_owner, _key| 2,
        &TradeRouteResourceFlowParams::default(),
        &["zloto"],
    );
    assert!(at_reserve.is_empty());
}

#[test]
fn diff_and_serialization_preserve_route_contract() {
    let old = route(
        "old",
        "a",
        "b",
        1,
        2,
        TradeRouteMedium::Land,
        3,
        TradeRouteStatus::Connected,
        true,
    );
    let new = route(
        "new",
        "a",
        "c",
        1,
        3,
        TradeRouteMedium::Sea,
        4,
        TradeRouteStatus::Connected,
        false,
    );
    let diff = diff_trade_routes(std::slice::from_ref(&old), std::slice::from_ref(&new));
    assert_eq!(diff.added, vec![new.clone()]);
    assert_eq!(diff.removed, vec![old.clone()]);

    let encoded = serde_json::to_string(&old).expect("route serializes");
    let decoded: TradeRoute = serde_json::from_str(&encoded).expect("route deserializes");
    assert_eq!(decoded, old);
}

#[test]
fn map_and_resource_dtos_use_json_safe_camel_case_contracts() {
    let mut map = TradeMap::new(8, 8);
    map.insert(HexCoord::new(-2, 3), TerrainType::Plains);
    map.insert(HexCoord::new(1, -4), TerrainType::Forest);
    let encoded_map = serde_json::to_value(&map).expect("trade map serializes");
    assert_eq!(encoded_map["tiles"]["-2,3"]["terrain"], "plains");
    assert_eq!(encoded_map["tiles"]["1,-4"]["terrain"], "forest");
    let decoded_map: TradeMap = serde_json::from_value(encoded_map).expect("trade map round-trips");
    assert_eq!(decoded_map, map);

    let grant = trade::TradeRouteResourceGrant::new(2, "braz", 1, "city-b", "route-1");
    let encoded_grant = serde_json::to_value(&grant).expect("grant serializes");
    assert_eq!(encoded_grant["resourceKey"], "braz");
    assert!(encoded_grant.get("resource_key").is_none());
    let decoded_grant: trade::TradeRouteResourceGrant =
        serde_json::from_value(encoded_grant).expect("grant deserializes");
    assert_eq!(decoded_grant, grant);

    let flow = trade::TradeRouteResourceFlow::new("route-1", "zloto", 1, 2, 3);
    let encoded_flow = serde_json::to_value(&flow).expect("flow serializes");
    assert_eq!(encoded_flow["resourceKey"], "zloto");
    assert!(encoded_flow.get("resource_key").is_none());
    let decoded_flow: trade::TradeRouteResourceFlow =
        serde_json::from_value(encoded_flow).expect("flow deserializes");
    assert_eq!(decoded_flow, flow);

    let flow_params = TradeRouteResourceFlowParams {
        min_stock_reserve: 7,
    };
    let encoded_flow_params = serde_json::to_value(flow_params).expect("flow params serialize");
    assert_eq!(encoded_flow_params["minStockReserve"], 7);
    assert!(encoded_flow_params.get("min_stock_reserve").is_none());

    let sea_params = SeaTradeBonusParams {
        bonus_per_extra_route: 4,
    };
    let encoded_sea_params = serde_json::to_value(sea_params).expect("sea params serialize");
    assert_eq!(encoded_sea_params["bonusPerExtraRoute"], 4);
    assert!(encoded_sea_params.get("bonus_per_extra_route").is_none());
}

#[test]
fn connection_result_and_tile_helpers_are_small_and_stable() {
    let result = CityConnectionResult::not_connected(7);
    assert!(!result.connected);
    assert_eq!(result.distance, 7);
    assert!(result.path_hexes.is_empty());
    let tile = TradeTile::new(TerrainType::Forest);
    assert!(tile.terrain.is_land_passable());
    assert!(!TerrainType::Ocean.is_land_passable());
    assert!(TerrainType::Ocean.is_water());
    assert_eq!(HexCoord::new(0, 0).distance(HexCoord::new(2, -1)), 2);
    assert_eq!(HexCoord::new(0, 0).neighbours().count(), 6);
}
