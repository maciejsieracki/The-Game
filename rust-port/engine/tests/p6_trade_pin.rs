//! R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1: `domain/trade.rs` 1:1 z pinem weba `4bbef081d` (`gra/src/game/trade-routes.ts`,
//! `map/territory.ts`). Wektory z URUCHOMIONEGO weba (generator `gen-p6-trade-pin-vectors.mjs` w katalogu runu):
//! odswiezanie tras, polaczenia (BFS, sciezki), granica ladowa, diagnoza, limity, dochod (krzywe `handel_szlaki`),
//! bonusy, granty, przeplyw surowcow, diff, loadery parametrow, kolejnosc `localeCompare`. Porownanie bit w bit.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::trade::{
    cities_have_trade_connection_with_options, compute_sea_trade_bonus_income_by_city,
    compute_sea_trade_route_count_by_city, compute_trade_route_building_bonus_by_city,
    compute_trade_route_income_by_city_breakdown, compute_trade_route_resource_flow_with_options,
    compute_trade_route_resource_grants_with_keys, create_trade_route_with_options,
    diagnose_missing_trade_route_for_partner_with_options, diff_trade_routes,
    find_city_connection_with_params, first_trade_route_resource_grant,
    has_trade_route_resource_access, load_trade_route_income_params, load_trade_route_params,
    load_trade_route_resource_flow_params, locale_compare, refresh_trade_routes_with_options,
    trade_route_building_bonus_for_route, trade_route_existence_limit_for_city,
    trade_route_income_by_distance, trade_route_income_for_route, trade_route_limit_for_city,
    HexCoord, SeaTradeBonusParams, TerrainType, TerritoryNode, TradeCity, TradeMap, TradeRoute,
    TradeRouteIncomeParams, TradeRouteMedium, TradeRouteParams, TradeRouteResourceFlowParams,
    TradeRouteStatus, TRADE_ROUTE_RESOURCE_KEYS, TRADE_ROUTE_STOCK_FLOW_KEYS,
};
use civ_engine::domain::building_costs::p6_7b::{StockCity, StockRecord};
use civ_engine::domain::trade_flow_apply::apply_trade_route_resource_flows;
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_trade_pin_vectors/trade.json");

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => other
                .strip_prefix('~')
                .unwrap_or_else(|| panic!("nieznany zapis liczby {other}"))
                .parse::<f64>()
                .expect("f64"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn same(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn s(v: &Value) -> &str {
    v.as_str().expect("string")
}

fn arr(v: &Value) -> &Vec<Value> {
    v.as_array().expect("array")
}

fn medium(key: &str) -> TradeRouteMedium {
    match key {
        "lad" => TradeRouteMedium::Land,
        "morze" => TradeRouteMedium::Sea,
        other => panic!("medium {other}"),
    }
}

fn terrain(key: &str) -> TerrainType {
    match key {
        "laka" => TerrainType::Grassland,
        "rownina" => TerrainType::Plains,
        "wzgorza" => TerrainType::Hills,
        "gory" => TerrainType::Mountains,
        "plytkie_morze" => TerrainType::ShallowWater,
        "morze" => TerrainType::Ocean,
        "pustynia" => TerrainType::Desert,
        "polarny" => TerrainType::Tundra,
        other => panic!("teren {other}"),
    }
}

fn pid(v: &Value) -> PlayerId {
    PlayerId::new(v.as_u64().expect("owner"))
}

fn curve(root: &Value, name: &str) -> TradeRouteIncomeParams {
    let c = &root["curves"][name];
    TradeRouteIncomeParams::new(
        arr(&c["ladowe"]).iter().map(num).collect(),
        arr(&c["morskie"]).iter().map(num).collect(),
    )
}

fn map_f64(v: &Value) -> BTreeMap<String, f64> {
    v.as_object()
        .expect("object")
        .iter()
        .map(|(k, x)| (k.clone(), num(x)))
        .collect()
}

fn check_map(label: &str, got: &BTreeMap<String, f64>, want: &Value) -> usize {
    let want = map_f64(want);
    assert_eq!(
        got.keys().collect::<Vec<_>>(),
        want.keys().collect::<Vec<_>>(),
        "{label}: klucze"
    );
    for (k, w) in &want {
        assert!(same(got[k], *w), "{label}[{k}]: rust {} web {}", got[k], w);
    }
    want.len() + 1
}

fn routes_of(v: &Value) -> Vec<TradeRoute> {
    serde_json::from_value(v.clone()).expect("trasy")
}

fn flows_json(flows: &[civ_engine::domain::trade::TradeRouteResourceFlow]) -> Vec<Value> {
    flows
        .iter()
        .map(|f| {
            serde_json::json!({
                "routeId": f.route_id, "resourceKey": f.resource_key,
                "fromOwnerId": f.from_owner_id.get(), "toOwnerId": f.to_owner_id.get(),
                "amount": f.amount,
            })
        })
        .collect()
}

fn check_flows(label: &str, got: &[civ_engine::domain::trade::TradeRouteResourceFlow], want: &Value) -> usize {
    let want = arr(want);
    assert_eq!(got.len(), want.len(), "{label}: liczba przeplywow");
    for (g, w) in got.iter().zip(want) {
        assert_eq!(g.route_id, s(&w["routeId"]), "{label}");
        assert_eq!(g.resource_key, s(&w["resourceKey"]), "{label}");
        assert_eq!(g.from_owner_id, pid(&w["fromOwnerId"]), "{label}");
        assert_eq!(g.to_owner_id, pid(&w["toOwnerId"]), "{label}");
        assert!(same(g.amount, num(&w["amount"])), "{label}: amount {} vs {}", g.amount, num(&w["amount"]));
    }
    want.len() + 1
}

fn build_map(sc: &Value) -> TradeMap {
    let dims = arr(&sc["dims"]);
    let mut map = TradeMap::new(
        dims[0].as_u64().unwrap() as u32,
        dims[1].as_u64().unwrap() as u32,
    );
    for h in arr(&sc["map_hexes"]) {
        let h = arr(h);
        map.insert(
            HexCoord::new(h[0].as_i64().unwrap() as i32, h[1].as_i64().unwrap() as i32),
            terrain(s(&h[2])),
        );
    }
    map
}

#[test]
fn trade_matches_the_running_web_pin() {
    let root: Value = serde_json::from_str(VECTORS).expect("wektory");
    assert_eq!(s(&root["pin"]).len(), 40);
    let mut checks = 0usize;

    // ---- kolejnosc localeCompare ----
    let mut ascii: Vec<char> = (32u8..127).map(char::from).collect();
    ascii.sort_by(|a, b| locale_compare(&a.to_string(), &b.to_string()));
    assert_eq!(ascii.iter().collect::<String>(), s(&root["ascii_order"]));
    for p in arr(&root["collation_pairs"]) {
        let p = arr(p);
        let want = p[2].as_i64().unwrap();
        let got = match locale_compare(s(&p[0]), s(&p[1])) {
            std::cmp::Ordering::Less => -1,
            std::cmp::Ordering::Equal => 0,
            std::cmp::Ordering::Greater => 1,
        };
        assert_eq!(got, want, "localeCompare({:?}, {:?})", p[0], p[1]);
        checks += 1;
    }

    // ---- dochod dystansowy (krzywe) ----
    for c in arr(&root["income_cases"]) {
        let params = curve(&root, s(&c["curve"]));
        let m = medium(s(&c["medium"]));
        let d = c["distance"].as_u64().unwrap();
        let by = trade_route_income_by_distance(d as f64, m, &params);
        assert!(same(by, num(&c["by_distance"])), "by_distance {c}");
        let to = if c["same_owner"].as_bool().unwrap() { 0 } else { 1 };
        let route = TradeRoute::from_parts(
            "r", "a", "b", PlayerId::new(0), PlayerId::new(to), m, d as u32,
            TradeRouteStatus::Connected, false,
        );
        let fr = trade_route_income_for_route(&route, &params);
        assert!(same(fr, num(&c["for_route"])), "for_route {c}");
        checks += 2;
    }

    // ---- loadery ----
    for l in arr(&root["loaders"]) {
        let raw = &l["raw"];
        let diff = s(&l["difficulty"]);
        let p = load_trade_route_params(Some(raw), diff);
        assert!(same(p.land_max_distance, num(&l["params"]["lad"])), "lad {l}");
        assert!(same(p.sea_max_distance, num(&l["params"]["morze"])), "morze {l}");
        let ip = load_trade_route_income_params(Some(raw), diff);
        let want_l: Vec<f64> = arr(&l["income"]["ladowe"]).iter().map(num).collect();
        let want_m: Vec<f64> = arr(&l["income"]["morskie"]).iter().map(num).collect();
        assert_eq!(ip.dochody_ladowe.len(), want_l.len(), "{l}");
        assert!(ip.dochody_ladowe.iter().zip(&want_l).all(|(a, b)| same(*a, *b)), "{l}");
        assert_eq!(ip.dochody_morskie.len(), want_m.len(), "{l}");
        assert!(ip.dochody_morskie.iter().zip(&want_m).all(|(a, b)| same(*a, *b)), "{l}");
        let fp = load_trade_route_resource_flow_params(Some(raw), diff);
        assert!(same(fp.min_stock_reserve, num(&l["flow_reserve"])), "reserve {l}");
        checks += 4;
    }
    // brak econ (`undefined`): wartosci domyslne jak w webie.
    assert_eq!(load_trade_route_income_params(None, "normal"), TradeRouteIncomeParams::default());

    // ---- scenariusze ----
    for sc in arr(&root["scenarios"]) {
        let map = build_map(sc);
        let cities: Vec<TradeCity> = arr(&sc["cities"])
            .iter()
            .map(|c| TradeCity::new(s(&c["id"]), pid(&c["ownerId"]), c["q"].as_i64().unwrap() as i32, c["r"].as_i64().unwrap() as i32))
            .collect();
        let params = TradeRouteParams::new(
            sc["params"]["ladMaxDist"].as_f64().unwrap(),
            sc["params"]["morzeMaxDist"].as_f64().unwrap(),
        );
        let income_params = curve(&root, s(&sc["curve"]));
        let mut prev: Vec<TradeRoute> = Vec::new();

        for tick in arr(&sc["ticks"]) {
            let built: BTreeMap<String, Vec<String>> = tick["built"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(k, v)| (k.clone(), arr(v).iter().map(|x| s(x).to_owned()).collect()))
                .collect();
            let pair_set = |v: &Value| -> BTreeSet<(u64, u64)> {
                arr(v)
                    .iter()
                    .map(|p| {
                        let (a, b) = (p[0].as_u64().unwrap(), p[1].as_u64().unwrap());
                        (a.min(b), a.max(b))
                    })
                    .collect()
            };
            let war = pair_set(&tick["war"]);
            let treaty = pair_set(&tick["treaty"]);
            let key = |a: PlayerId, b: PlayerId| (a.get().min(b.get()), a.get().max(b.get()));
            let is_war = |a: PlayerId, b: PlayerId| war.contains(&key(a, b));
            let has_treaty = |a: PlayerId, b: PlayerId| treaty.contains(&key(a, b));
            let tech: Option<BTreeSet<u64>> = if tick["tech"].is_null() {
                None
            } else {
                Some(arr(&tick["tech"]).iter().map(|x| x.as_u64().unwrap()).collect())
            };
            let has_tech = |o: PlayerId| tech.as_ref().is_none_or(|t| t.contains(&o.get()));
            let territory: Option<Vec<TerritoryNode>> = if tick["territory"].is_null() {
                None
            } else {
                Some(
                    arr(&tick["territory"])
                        .iter()
                        .map(|n| {
                            let mut node = TerritoryNode::new(
                                pid(&n["ownerId"]),
                                n["q"].as_i64().unwrap() as i32,
                                n["r"].as_i64().unwrap() as i32,
                                n["radius"].as_u64().unwrap() as u32,
                            );
                            node.fort = n["fort"].as_bool().unwrap();
                            node.outpost = n["outpost"].as_bool().unwrap();
                            node.order = if n["order"].is_null() {
                                None
                            } else {
                                Some((n["order"][0].as_i64().unwrap(), n["order"][1].as_i64().unwrap()))
                            };
                            node
                        })
                        .collect(),
                )
            };
            let terr = territory.as_deref();
            let existing = routes_of(&tick["existing"]);

            // refresh
            let got = refresh_trade_routes_with_options(
                &cities, &existing, &map, &built, is_war, has_treaty, &params, terr, &income_params, has_tech,
            );
            let got_json = serde_json::to_value(&got).unwrap();
            assert_eq!(got_json, tick["routes"], "scenariusz {} refresh", sc["idx"]);
            checks += got.len() + 1;

            // polaczenia
            for c in arr(&tick["conns"]) {
                let from = cities.iter().find(|x| x.id == s(&c["from"])).unwrap();
                let to = cities.iter().find(|x| x.id == s(&c["to"])).unwrap();
                if c.get("create").is_some() {
                    let want = &c["route"];
                    let m = medium(s(&want["medium"]));
                    let route = create_trade_route_with_options(from, to, &map, m, &built, None);
                    assert_eq!(&serde_json::to_value(&route).unwrap(), want, "create {} sc {}", c, sc["idx"]);
                } else {
                    let need_path = c["need_path"].as_bool().unwrap();
                    let r = find_city_connection_with_params(
                        from, to, &map, medium(s(&c["medium"])), &params, &built, terr, need_path,
                    );
                    assert_eq!(r.connected, c["connected"].as_bool().unwrap(), "conn {} sc {}", c, sc["idx"]);
                    assert_eq!(u64::from(r.distance), c["distance"].as_u64().unwrap(), "dist {c}");
                    if need_path {
                        let want: Vec<&str> = arr(&c["path"]).iter().map(s).collect();
                        assert_eq!(r.path_hexes.iter().map(String::as_str).collect::<Vec<_>>(), want, "path {} sc {}", c, sc["idx"]);
                    } else {
                        assert!(r.path_hexes.is_empty() || !r.connected || from.coordinate() == to.coordinate(), "{c}");
                    }
                }
                checks += 1;
            }
            for h in arr(&tick["have"]) {
                let (a, b) = (pid(&h["a"]), pid(&h["b"]));
                let ca: Vec<TradeCity> = cities.iter().filter(|c| c.owner_id == a).cloned().collect();
                let cb: Vec<TradeCity> = cities.iter().filter(|c| c.owner_id == b).cloned().collect();
                assert_eq!(cities_have_trade_connection_with_options(&ca, &cb, &map, &built, &params, terr), h["with_territory"].as_bool().unwrap(), "have {h}");
                assert_eq!(cities_have_trade_connection_with_options(&ca, &cb, &map, &built, &params, None), h["without"].as_bool().unwrap(), "have0 {h}");
                checks += 2;
            }
            for d in arr(&tick["diag"]) {
                let (a, b) = (pid(&d["a"]), pid(&d["b"]));
                let label = d["label"].as_str();
                let got = diagnose_missing_trade_route_for_partner_with_options(a, b, &cities, &map, &built, is_war, &params, label, terr);
                assert_eq!(got.as_deref(), d["msg"].as_str(), "diag {d} sc {}", sc["idx"]);
                let got0 = diagnose_missing_trade_route_for_partner_with_options(a, b, &cities, &map, &built, is_war, &params, label, None);
                assert_eq!(got0.as_deref(), d["msg_no_territory"].as_str(), "diag0 {d}");
                checks += 2;
            }
            for l in arr(&tick["limits"]) {
                let id = s(&l["id"]);
                assert_eq!(u64::from(trade_route_limit_for_city(id, &built)), l["limit"].as_u64().unwrap(), "limit {l}");
                assert_eq!(u64::from(trade_route_existence_limit_for_city(id, &built)), l["existence"].as_u64().unwrap(), "exist {l}");
                checks += 2;
            }

            // dochod i bonusy
            let inc = &tick["income"];
            let routes_in = routes_of(&inc["routes_in"]);
            let wonder = |o: PlayerId, m: TradeRouteMedium| inc["wonder"].get(format!("{}|{}", o.get(), m.key())).map_or(0.0, num);
            let targ = |id: &str| inc["targ"].get(id).map_or(0.0, num);
            let br = compute_trade_route_income_by_city_breakdown(&routes_in, &income_params, wonder, targ);
            checks += check_map("total", &br.total_by_city, &inc["total"]);
            checks += check_map("maritime", &br.maritime_by_city, &inc["maritime"]);
            let nb = compute_trade_route_income_by_city_breakdown(&routes_in, &income_params, |_, _| 0.0, |_| 0.0);
            checks += check_map("total_nobonus", &nb.total_by_city, &inc["total_nobonus"]);
            let counts = compute_sea_trade_route_count_by_city(&routes_in);
            let counts_f: BTreeMap<String, f64> = counts.iter().map(|(k, v)| (k.clone(), f64::from(*v))).collect();
            checks += check_map("sea_counts", &counts_f, &inc["sea_counts"]);
            let rate = num(&inc["sea_bonus_rate"]);
            checks += check_map("sea_bonus", &compute_sea_trade_bonus_income_by_city(&counts, rate), &inc["sea_bonus"]);
            checks += check_map("sea_bonus_default", &compute_sea_trade_bonus_income_by_city(&counts, SeaTradeBonusParams::default()), &inc["sea_bonus_default"]);
            checks += check_map("building_bonus", &compute_trade_route_building_bonus_by_city(&routes_in, &income_params), &inc["building_bonus"]);
            for (route, want) in routes_in.iter().zip(arr(&inc["per_route"])) {
                assert!(same(trade_route_income_for_route(route, &income_params), num(&want["income"])), "per-route income");
                assert!(same(trade_route_building_bonus_for_route(route, &income_params), num(&want["bonus"])), "per-route bonus");
                checks += 2;
            }

            // granty i przeplyw
            let res = &tick["res"];
            let native = |o: PlayerId, k: &str| res["native"].get(format!("{}|{k}", o.get())).and_then(Value::as_bool).unwrap_or(false);
            let stock = |o: PlayerId, k: &str| res["stock"].get(format!("{}|{k}", o.get())).map_or(0.0, num);
            let grants = compute_trade_route_resource_grants_with_keys(&routes_in, native, &TRADE_ROUTE_RESOURCE_KEYS);
            assert_eq!(serde_json::to_value(&grants).unwrap(), res["grants"], "grants");
            let grants2 = compute_trade_route_resource_grants_with_keys(&routes_in, native, &["braz", "cegla"]);
            assert_eq!(serde_json::to_value(&grants2).unwrap(), res["grants_keys2"], "grants keys");
            for f in arr(&res["firsts"]) {
                let (o, k) = (pid(&f["owner"]), s(&f["key"]));
                assert_eq!(has_trade_route_resource_access(&grants, o, k), f["has"].as_bool().unwrap(), "has {f}");
                let first = first_trade_route_resource_grant(&grants, o, k);
                assert_eq!(first.map(|g| g.route_id.as_str()), f["first_route"].as_str(), "first {f}");
                if let Some(g) = first {
                    assert_eq!(g.via_owner_id.get(), f["first_via"][0].as_u64().unwrap(), "via {f}");
                    assert_eq!(g.via_city_id, s(&f["first_via"][1]), "via city {f}");
                }
                checks += 2;
            }
            let reserve = TradeRouteResourceFlowParams { min_stock_reserve: num(&res["reserve"]) };
            let flows = compute_trade_route_resource_flow_with_options(&routes_in, stock, &reserve, &TRADE_ROUTE_STOCK_FLOW_KEYS);
            checks += check_flows("flows", &flows, &res["flows"]);
            let flows_def = civ_engine::domain::trade::compute_trade_route_resource_flow(&routes_in, stock);
            checks += check_flows("flows_default", &flows_def, &res["flows_default"]);
            let flows_k = compute_trade_route_resource_flow_with_options(
                &routes_in, stock, &TradeRouteResourceFlowParams { min_stock_reserve: 1.0 }, &["sol", "zloto"],
            );
            checks += check_flows("flows_keys", &flows_k, &res["flows_keys"]);
            let _ = flows_json(&flows);

            // sklejka `main.ts:34470-34498` (pobor u dawcy + cap odbiorcy) na zapasach miast
            let ap = &tick["apply"];
            let rec = |v: &Value| -> Option<StockRecord> {
                v.as_object()
                    .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
            };
            let mut stock_cities: Vec<StockCity> = arr(&ap["cities_in"])
                .iter()
                .map(|c| StockCity {
                    id: s(&c["id"]).to_owned(),
                    owner_id: c["ownerId"].as_i64().unwrap(),
                    surowce: rec(&c["surowce"]),
                })
                .collect();
            let caps = &ap["cap"];
            let cap_of = |o: i64| num(&caps[o.to_string()]);
            let applied = apply_trade_route_resource_flows(
                &mut stock_cities,
                &got,
                &TradeRouteResourceFlowParams { min_stock_reserve: num(&ap["reserve"]) },
                &cap_of,
            );
            checks += check_flows("apply flows", &applied, &ap["flows"]);
            for (city, want) in stock_cities.iter().zip(arr(&ap["cities_out"])) {
                assert_eq!(city.id, s(&want["id"]));
                let want_rec = rec(&want["surowce"]);
                match (&city.surowce, &want_rec) {
                    (None, None) => {}
                    (Some(g), Some(w)) => {
                        assert_eq!(g.keys().collect::<Vec<_>>(), w.keys().collect::<Vec<_>>(), "apply keys {}", city.id);
                        for (k, v) in w {
                            assert!(same(g[k], *v), "apply {}[{k}]: rust {} web {v}", city.id, g[k]);
                        }
                    }
                    (g, w) => panic!("apply surowce {}: rust {g:?} web {w:?}", city.id),
                }
                checks += 1;
            }

            // diff
            let d = diff_trade_routes(&prev, &got);
            let added: Vec<&str> = d.added.iter().map(|r| r.id.as_str()).collect();
            let removed: Vec<&str> = d.removed.iter().map(|r| r.id.as_str()).collect();
            assert_eq!(added, arr(&tick["diff"]["added"]).iter().map(s).collect::<Vec<_>>(), "diff added");
            assert_eq!(removed, arr(&tick["diff"]["removed"]).iter().map(s).collect::<Vec<_>>(), "diff removed");
            checks += 2;
            prev = got;
        }
    }
    assert!(checks > 40_000, "za malo sprawdzen: {checks}");
    eprintln!("p6_trade_pin: {checks} sprawdzen");
}

#[test]
fn pin_curves_and_international_halving_hand_checked() {
    // Reczne wartosci z pinu (`econ-params.json handel_szlaki`, `trade-routes.ts:1568-1577`), niezalezne od wektorow.
    let p = TradeRouteIncomeParams::default();
    let mk = |d: u32, m: TradeRouteMedium, to: u64| {
        TradeRoute::from_parts("r", "a", "b", PlayerId::new(0), PlayerId::new(to), m, d, TradeRouteStatus::Connected, false)
    };
    // lad dystans 12 -> 8; ten sam owner: ceil(8/2) = 4; inny owner: ceil(16/2) = 8.
    assert_eq!(trade_route_income_for_route(&mk(12, TradeRouteMedium::Land, 0), &p), 4.0);
    assert_eq!(trade_route_income_for_route(&mk(12, TradeRouteMedium::Land, 1), &p), 8.0);
    // lad dystans 0 -> 1: ceil(1/2) = 1; inny owner: ceil(2/2) = 1.
    assert_eq!(trade_route_income_for_route(&mk(0, TradeRouteMedium::Land, 0), &p), 1.0);
    assert_eq!(trade_route_income_for_route(&mk(0, TradeRouteMedium::Land, 1), &p), 1.0);
    // morze dystans 20 -> 16: 8 / 16; dystans poza koncem krzywej -> ostatnia wartosc.
    assert_eq!(trade_route_income_for_route(&mk(20, TradeRouteMedium::Sea, 0), &p), 8.0);
    assert_eq!(trade_route_income_for_route(&mk(500, TradeRouteMedium::Sea, 1), &p), 16.0);
    // lad dystans 3 -> 3: ceil(1.5) = 2; inny owner: ceil(6/2) = 3.
    assert_eq!(trade_route_income_for_route(&mk(3, TradeRouteMedium::Land, 0), &p), 2.0);
    assert_eq!(trade_route_income_for_route(&mk(3, TradeRouteMedium::Land, 1), &p), 3.0);
}
