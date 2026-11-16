//! R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW: wektory producenta nakladek `tradeRoutes`,
//! `workerFields`, `okolica` (`domain::overlays_view`) i wariantu `collectWorkedHexOwnerMap` z epoka per
//! wlasciciel (`okolica::collect_worked_hex_owner_map_by_owner_yield`).
//!
//! Wektory WYKONUJA kod pinu `07d2fbd72` (generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F4-TRADE-WORKERS-OKOLICA-VIEW/gen_vectors.mjs`, wynik w [`VECTORS`]):
//! * `refreshTradeRoutesOverlay` `gra/src/main.ts:15379-15397` (filtr `:15387-15391`);
//! * `refreshWorkerFieldOverlay` `main.ts:15432-15448` -> `collectWorkedHexOwnerMap` `game/okolica.ts:811-834`;
//! * `syncOkolicaOverlay` `main.ts:6644-6666` z `okolicaWorkedKeySet` `main.ts:6625-6635`,
//!   `siblingClaimedHexKeysForCity` `main.ts:5701-5703`, `buildAllTerritoryNodes` `main.ts:5667-5678`;
//! * `collectRangeKeys` `render/cityOkolicaOverlay.ts:239-249` + `yieldOfMapHex` `game/okolica.ts:459-477`;
//! * `computeLostToNearerSiblingByCity` `game/okolica.ts:859`.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::okolica::{
    collect_worked_hex_owner_map_by_owner_yield, compute_lost_to_nearer_sibling_by_city,
    is_land_workable_hex, OkolicaYield,
};
use civ_engine::domain::overlays_view::{
    okolica_view, trade_routes_view, worker_fields_view, OverlaysUi, OverlaysWorld,
};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use civ_engine::domain::terrain::CityNode;
use civ_engine::domain::territory::TerritoryNode;
use civ_engine::domain::trade::TradeRoute;
use civ_engine::domain::turn_economy_territory::{hex_tile_yield, okolica_city_of};
use civ_view_model::{CityId, HexCoord, OwnerRef, TileYieldDto, TradeMedium};
use serde_json::Value;

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("wektory")
}

fn scenario<'a>(d: &'a Value, name: &str) -> &'a Value {
    d["scenarios"]
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["name"] == name)
        .unwrap_or_else(|| panic!("brak scenariusza {name}"))
}

fn build_map(rows: &Value) -> BuildMap {
    let hexes = rows
        .as_array()
        .unwrap()
        .iter()
        .map(|h| {
            let a = h.as_array().unwrap();
            let mut hex = BuildHex::new(
                a[0].as_i64().unwrap() as i32,
                a[1].as_i64().unwrap() as i32,
                terrain_from_web_value(a[2].as_str().unwrap()).expect("teren"),
                Overlay::from_web_value(a[3].as_str().unwrap()).expect("nakladka"),
            );
            hex.river_present = a[4].as_i64().unwrap() == 1;
            hex.ulepszenie = a[5].as_str().map(str::to_owned);
            hex.ulepszenia = a[6]
                .as_array()
                .map(|l| l.iter().map(|x| x.as_str().unwrap().to_owned()).collect());
            hex.zloze = a[7].as_str().map(str::to_owned);
            hex
        })
        .collect();
    BuildMap::new(hexes, vec![])
}

fn cities_of(v: &Value) -> Vec<City> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|c| City {
            id: c["id"].as_str().unwrap().to_owned(),
            owner_id: c["ownerId"].as_i64().unwrap(),
            q: c["q"].as_f64().unwrap(),
            r: c["r"].as_f64().unwrap(),
            population: c["population"].as_f64().unwrap(),
            ..City::default()
        })
        .collect()
}

/// Web `buildAllTerritoryNodes` (`main.ts:5667-5678`) bez fortow (`fortNodes` puste w wektorach).
fn nodes_of(cities: &[City]) -> Vec<TerritoryNode> {
    cities
        .iter()
        .map(|c| {
            TerritoryNode::new(
                CityNode::city(c.q as i32, c.r as i32, c.population),
                c.owner_id,
            )
        })
        .collect()
}

fn era_of(v: &Value) -> BTreeMap<i64, f64> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.parse().unwrap(), x.as_f64().unwrap()))
        .collect()
}

fn ui_of(v: &Value) -> OverlaysUi {
    OverlaysUi {
        show_trade_routes: v["showTradeRoutes"].as_bool().unwrap(),
        show_worker_overlay: v["showWorkerOverlay"].as_bool().unwrap(),
        city_panel_open: v["cityPanelOpen"].as_bool().unwrap(),
        open_city_id: v["openCityId"]
            .as_str()
            .map(|s| CityId::try_new(s.parse().unwrap()).unwrap()),
        viewer_owner_id: v["viewer"].as_i64().unwrap(),
    }
}

fn routes_of(v: &Value) -> Vec<TradeRoute> {
    serde_json::from_value(v.clone()).expect("tradeRoutes")
}

fn key_hex(k: &str) -> HexCoord {
    let mut p = k.split(',').map(|x| x.parse::<i32>().unwrap());
    HexCoord::new(p.next().unwrap(), p.next().unwrap())
}

fn owner(o: i64) -> OwnerRef {
    OwnerRef::from_legacy_i64(o).unwrap()
}

/// `entries` z `syncWorkerFieldOverlay(..., workedByOwner, ME())` (`null` = brak warstwy).
fn expected_workers(v: &Value) -> Vec<(HexCoord, OwnerRef)> {
    if v.is_null() {
        return Vec::new();
    }
    v["entries"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| {
            (
                key_hex(e[0].as_str().unwrap()),
                owner(e[1].as_i64().unwrap()),
            )
        })
        .collect()
}

fn yield_dto(v: &Value) -> TileYieldDto {
    TileYieldDto {
        zywnosc: v["zywnosc"].as_f64(),
        praca: v["praca"].as_f64(),
        handel: v["handel"].as_f64(),
    }
}

struct Fixture {
    map: BuildMap,
    cities: Vec<City>,
    nodes: Vec<TerritoryNode>,
    era: BTreeMap<i64, f64>,
    ty: TerrainYieldsFile,
}

impl Fixture {
    fn of(s: &Value) -> Self {
        let cities = cities_of(&s["cities"]);
        Self {
            map: build_map(&s["rows"]),
            nodes: nodes_of(&cities),
            cities,
            era: era_of(&s["era"]),
            ty: parse_terrain_yields().expect("terrain-yields.json"),
        }
    }

    fn with_world<R>(&self, f: impl FnOnce(&OverlaysWorld<'_>) -> R) -> R {
        let era = |o: i64| *self.era.get(&o).unwrap_or_else(|| panic!("brak epoki {o}"));
        let world = OverlaysWorld {
            cities: &self.cities,
            map: &self.map,
            terrain_yields: &self.ty,
            territory_nodes: &self.nodes,
            era_for_owner: &era,
        };
        f(&world)
    }
}

fn workers_of(s: &Value) -> Vec<(HexCoord, OwnerRef)> {
    let fx = Fixture::of(s);
    fx.with_world(|w| worker_fields_view(w, &ui_of(&s["ui"])))
        .expect("workerFields")
        .into_iter()
        .map(|f| (f.hex, f.owner_id))
        .collect()
}

/// `collectWorkedHexOwnerMap` z `eraForOwner` (`okolica.ts:811-834`, `yieldOfForOwner` `:822`):
/// 2 wlascicieli w roznych epokach (0 -> 1, 1 -> 3), identyczne otoczenie miast. Wektor jest
/// rozrozniajacy: epoka globalna 1 albo 3 daje INNY wynik (kontrolne wywolania pinu w wektorze).
#[test]
fn workers_era_per_owner_matches_pin() {
    let d = data();
    let s = scenario(&d, "S1_era_per_owner");
    let want = expected_workers(&s["expected"]["workers"]);
    assert_eq!(want.len(), 2);
    assert_eq!(workers_of(s), want);
    // `main.ts:15441`: widz `ME()` idzie do renderera, nie filtruje wpisow.
    assert_eq!(s["expected"]["workers"]["me"], 0);
    assert_ne!(expected_workers(&s["control_global_era1"]), want);
    assert_ne!(expected_workers(&s["control_global_era3"]), want);
}

/// Spor sasiadow tego samego wlasciciela (`computeLostToNearerSiblingByCity`, `okolica.ts:859`;
/// `collectWorkedHexOwnerMap` liczy go RAZ, `:824`) + trzeci wlasciciel w innej epoce
/// (`refreshWorkerFieldOverlay`, `main.ts:15432-15448`).
#[test]
fn workers_sibling_dispute_matches_pin() {
    let d = data();
    let s = scenario(&d, "S2_sibling_workers");
    let fx = Fixture::of(s);
    let okc: Vec<_> = fx.cities.iter().map(okolica_city_of).collect();
    let lost = compute_lost_to_nearer_sibling_by_city(&okc, &fx.map);
    let want_lost: BTreeMap<String, BTreeSet<String>> = s["lost"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| {
            (
                e[0].as_str().unwrap().to_owned(),
                e[1].as_array()
                    .unwrap()
                    .iter()
                    .map(|k| k.as_str().unwrap().to_owned())
                    .collect(),
            )
        })
        .collect();
    assert_eq!(lost, want_lost);
    assert!(lost.contains_key("5") && lost.contains_key("6"));
    assert_eq!(workers_of(s), expected_workers(&s["expected"]["workers"]));
}

/// Kolejnosc `Map` i nadpisanie klucza (`byKey.set(t.key, city.ownerId)`, `okolica.ts:831`): bez wezlow
/// terytorium miasta roznych wlascicieli dziela heks `3,0`; drugi zapis zmienia wlasciciela, NIE pozycje.
/// Kolejnosc wstawiania != kolejnosc leksykograficzna kluczy.
#[test]
fn owner_map_keeps_js_map_insertion_order() {
    let d = data();
    let s = scenario(&d, "S4_map_order_no_territory");
    let fx = Fixture::of(s);
    let okc: Vec<_> = fx.cities.iter().map(okolica_city_of).collect();
    let land = |q: i32, r: i32| is_land_workable_hex(&fx.map, q, r);
    let yield_of = |o: i64, q: i32, r: i32| {
        let h = fx.map.hex(&format!("{q},{r}")).expect("heks");
        let y = hex_tile_yield(&fx.ty, h, Some(fx.era[&o]));
        OkolicaYield {
            zywnosc: y.zywnosc,
            praca: y.praca,
            handel: y.handel,
        }
    };
    let got =
        collect_worked_hex_owner_map_by_owner_yield(&okc, &fx.map, &yield_of, Some(&land), None);
    let want: Vec<(String, i64)> = s["direct"]
        .as_array()
        .unwrap()
        .iter()
        .map(|e| (e[0].as_str().unwrap().to_owned(), e[1].as_i64().unwrap()))
        .collect();
    assert_eq!(got, want);
    let mut sorted = want.clone();
    sorted.sort();
    assert_ne!(
        sorted, want,
        "wektor musi rozrozniac kolejnosc Map od sortowania"
    );
    // Heks wspolny dwoch miast (`perCity`): pierwszy zapis wyznacza pozycje, ostatni wlasciciela.
    assert_eq!(want[0], ("3,0".to_owned(), 0));
}

/// Okolica otwartego miasta gracza (`syncOkolicaOverlay`, `main.ts:6644-6666`): miasto `6` przegrywa
/// spor z `5` (`siblingClaimedHexKeysForCity`, `:5701-5703`), epoka wlasciciela 2 (`:6660`), zasieg
/// `cityRangeForPopulation(city.population)` (`:6658`), plony dla `collectRangeKeys`
/// (`cityOkolicaOverlay.ts:239-249`).
#[test]
fn okolica_open_city_matches_pin() {
    let d = data();
    for name in ["S2_sibling_okolica", "S3_trade_panel_open"] {
        let s = scenario(&d, name);
        let fx = Fixture::of(s);
        let ui = ui_of(&s["ui"]);
        let got = fx
            .with_world(|w| okolica_view(w, &ui))
            .expect("okolica")
            .expect("warstwa okolicy");
        let e = &s["expected"]["okolica"];
        assert_eq!(got.city_id, ui.open_city_id.unwrap(), "{name}");
        assert_eq!(
            got.city_hex,
            HexCoord::new(
                e["cityQ"].as_i64().unwrap() as i32,
                e["cityR"].as_i64().unwrap() as i32
            ),
            "{name}"
        );
        assert_eq!(got.range, e["range"].as_f64().unwrap(), "{name}");
        let worked: Vec<HexCoord> = e["workedKeys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| key_hex(k.as_str().unwrap()))
            .collect();
        assert_eq!(got.worked_hexes, worked, "{name}");
        let yields: Vec<(HexCoord, TileYieldDto)> = e["yields"]
            .as_array()
            .unwrap()
            .iter()
            .map(|y| (key_hex(y[0].as_str().unwrap()), yield_dto(&y[1])))
            .collect();
        assert!(!yields.is_empty());
        assert_eq!(got.yields, yields, "{name}");
        assert_eq!(got.show_yields, e["showYields"].as_bool(), "{name}");
        assert_eq!(
            got.owner_id,
            owner(e["ownerId"].as_i64().unwrap()),
            "{name}"
        );
    }
}

/// Brak warstwy okolicy: miasto innego wlasciciela niz `ME()` (`isMe`, `main.ts:6651`, `:13748-13750`),
/// zamkniety panel (`:6645`) i panel bez `activeCity` (`:6649-6651`).
#[test]
fn okolica_absent_cases_match_pin() {
    let d = data();
    let s = scenario(&d, "S2_okolica_foreign_city");
    assert!(s["expected"]["okolica"].is_null());
    let fx = Fixture::of(s);
    let ui = ui_of(&s["ui"]);
    assert_eq!(fx.with_world(|w| okolica_view(w, &ui)), Ok(None));
    let closed = OverlaysUi {
        city_panel_open: false,
        ..ui
    };
    assert_eq!(fx.with_world(|w| okolica_view(w, &closed)), Ok(None));
    let no_city = OverlaysUi {
        open_city_id: None,
        ..ui
    };
    assert_eq!(fx.with_world(|w| okolica_view(w, &no_city)), Ok(None));
    // Panel otwarty = brak pol robotnikow (`:15434`).
    let s2 = scenario(&d, "S2_sibling_okolica");
    assert!(s2["expected"]["workers"].is_null());
    assert!(workers_of(s2).is_empty());
}

fn trade_of(s: &Value) -> Vec<(HexCoord, HexCoord, TradeMedium)> {
    let cities = cities_of(&s["cities"]);
    trade_routes_view(&routes_of(&s["tradeRoutes"]), &cities, &ui_of(&s["ui"]))
        .into_iter()
        .map(|t| (t.from, t.to, t.medium))
        .collect()
}

fn expected_trade(v: &Value) -> Vec<(HexCoord, HexCoord, TradeMedium)> {
    if v.is_null() {
        return Vec::new();
    }
    v.as_array()
        .unwrap()
        .iter()
        .map(|t| {
            let hex = |q: &str, r: &str| {
                HexCoord::new(t[q].as_i64().unwrap() as i32, t[r].as_i64().unwrap() as i32)
            };
            let medium = match t["medium"].as_str().unwrap() {
                "lad" => TradeMedium::Lad,
                "morze" => TradeMedium::Morze,
                other => panic!("medium {other}"),
            };
            (hex("fromQ", "fromR"), hex("toQ", "toR"), medium)
        })
        .collect()
}

/// Filtr tras (`main.ts:15386-15392`): `brak_polaczenia` (trasa `c`), AI<->AI (`b`, `f`; literal `0`,
/// `:15388`), brak miasta (`d`, `g`), zdublowane id miasta (`new Map`, `:15384`: ostatni wpis — trasa `a`
/// konczy sie na `5,1`), trasa AI -> gracz (`e`) przechodzi.
#[test]
fn trade_filter_matches_pin() {
    let d = data();
    let s = scenario(&d, "S3_trade_filter");
    let want = expected_trade(&s["expected"]["trade"]);
    assert_eq!(want.len(), 2);
    assert_eq!(trade_of(s), want);
    assert_eq!(want[0].1, HexCoord::new(5, 1));
}

/// Hot-seat: widz `1`, filtr dalej po literale `0` (`main.ts:15388`, rozpoznanie P4-1F §5 pkt 3);
/// otwarty panel miasta (`:15382`) i wylaczony przelacznik (`:15381`) = brak tras.
#[test]
fn trade_gates_match_pin() {
    let d = data();
    let hot = scenario(&d, "S3_trade_hotseat_literal0");
    assert_eq!(trade_of(hot), expected_trade(&hot["expected"]["trade"]));
    assert_eq!(
        trade_of(hot),
        expected_trade(&scenario(&d, "S3_trade_filter")["expected"]["trade"])
    );
    let panel = scenario(&d, "S3_trade_panel_open");
    assert!(panel["expected"]["trade"].is_null());
    assert!(trade_of(panel).is_empty());
    let s = scenario(&d, "S3_trade_filter");
    let cities = cities_of(&s["cities"]);
    let off = OverlaysUi {
        show_trade_routes: false,
        ..ui_of(&s["ui"])
    };
    assert!(trade_routes_view(&routes_of(&s["tradeRoutes"]), &cities, &off).is_empty());
    // Trasa AI -> gracz: `ownerId` 2, `toOwnerId` 0 (`PlayerId` z wektora).
    let routes = routes_of(&s["tradeRoutes"]);
    assert_eq!(
        (routes[4].owner_id.get(), routes[4].to_owner_id.get()),
        (2, 0)
    );
}

/// Wynik `gen_vectors.mjs` (pin `07d2fbd72`), skopiowany 1:1 (JSON zwarty).
const VECTORS: &str = r##"{"pin":"07d2fbd72","slices":{"refreshTradeRoutesOverlay":"main.ts:15379-15397","refreshWorkerFieldOverlay":"main.ts:15432-15448","syncOkolicaOverlay":"main.ts:6644-6666","okolicaWorkedKeySet":"main.ts:6625-6635","okolicaHexWorkable":"main.ts:6617-6623","siblingClaimedHexKeysForCity":"main.ts:5701-5703","buildAllTerritoryNodes":"main.ts:5667-5678","isMe":"main.ts:13748-13750","collectRangeKeys":"render/cityOkolicaOverlay.ts:239-249"},"scenarios":[{"name":"S1_era_per_owner","rows":[[-4,-4,"rownina","brak",0,null,null,null],[-3,-4,"rownina","brak",0,null,null,null],[-2,-4,"rownina","brak",0,null,null,null],[-1,-4,"rownina","brak",0,null,null,null],[0,-4,"rownina","brak",0,null,null,null],[1,-4,"rownina","brak",0,null,null,null],[2,-4,"rownina","brak",0,null,null,null],[3,-4,"rownina","brak",0,null,null,null],[4,-4,"rownina","brak",0,null,null,null],[5,-4,"rownina","brak",0,null,null,null],[6,-4,"rownina","brak",0,null,null,null],[7,-4,"rownina","brak",0,null,null,null],[8,-4,"rownina","brak",0,null,null,null],[9,-4,"rownina","brak",0,null,null,null],[10,-4,"rownina","brak",0,null,null,null],[11,-4,"rownina","brak",0,null,null,null],[12,-4,"rownina","brak",0,null,null,null],[13,-4,"rownina","brak",0,null,null,null],[14,-4,"rownina","brak",0,null,null,null],[-4,-3,"rownina","brak",0,null,null,null],[-3,-3,"rownina","brak",0,null,null,null],[-2,-3,"rownina","brak",0,null,null,null],[-1,-3,"rownina","brak",0,null,null,null],[0,-3,"rownina","brak",0,null,null,null],[1,-3,"rownina","brak",0,null,null,null],[2,-3,"rownina","brak",0,null,null,null],[3,-3,"rownina","brak",0,null,null,null],[4,-3,"rownina","brak",0,null,null,null],[5,-3,"rownina","brak",0,null,null,null],[6,-3,"rownina","brak",0,null,null,null],[7,-3,"rownina","brak",0,null,null,null],[8,-3,"rownina","brak",0,null,null,null],[9,-3,"rownina","brak",0,null,null,null],[10,-3,"rownina","brak",0,null,null,null],[11,-3,"rownina","brak",0,null,null,null],[12,-3,"rownina","brak",0,null,null,null],[13,-3,"rownina","brak",0,null,null,null],[14,-3,"rownina","brak",0,null,null,null],[-4,-2,"rownina","brak",0,null,null,null],[-3,-2,"rownina","brak",0,null,null,null],[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[7,-2,"rownina","brak",0,null,null,null],[8,-2,"rownina","brak",0,null,null,null],[9,-2,"rownina","brak",0,null,null,null],[10,-2,"rownina","brak",0,null,null,null],[11,-2,"rownina","brak",0,null,null,null],[12,-2,"rownina","brak",0,null,null,null],[13,-2,"rownina","brak",0,null,null,null],[14,-2,"rownina","brak",0,null,null,null],[-4,-1,"rownina","brak",0,null,null,null],[-3,-1,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,["kopalnia_zlota"],null],[1,-1,"rownina","brak",0,null,null,null],[2,-1,"rownina","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[7,-1,"rownina","brak",0,null,null,null],[8,-1,"rownina","brak",0,null,null,null],[9,-1,"rownina","brak",0,null,null,null],[10,-1,"rownina","brak",0,null,["kopalnia_zlota"],null],[11,-1,"rownina","brak",0,null,null,null],[12,-1,"rownina","brak",0,null,null,null],[13,-1,"rownina","brak",0,null,null,null],[14,-1,"rownina","brak",0,null,null,null],[-4,0,"rownina","brak",0,null,null,null],[-3,0,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"wzgorza","las",1,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"laka","brak",0,null,["farma"],null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[7,0,"rownina","brak",0,null,null,null],[8,0,"rownina","brak",0,null,null,null],[9,0,"wzgorza","las",1,null,null,null],[10,0,"rownina","brak",0,null,null,null],[11,0,"laka","brak",0,null,["farma"],null],[12,0,"rownina","brak",0,null,null,null],[13,0,"rownina","brak",0,null,null,null],[14,0,"rownina","brak",0,null,null,null],[-4,1,"rownina","brak",0,null,null,null],[-3,1,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"laka","brak",1,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[7,1,"rownina","brak",0,null,null,null],[8,1,"rownina","brak",0,null,null,null],[9,1,"rownina","brak",0,null,null,null],[10,1,"laka","brak",1,null,null,null],[11,1,"rownina","brak",0,null,null,null],[12,1,"rownina","brak",0,null,null,null],[13,1,"rownina","brak",0,null,null,null],[14,1,"rownina","brak",0,null,null,null],[-4,2,"rownina","brak",0,null,null,null],[-3,2,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[7,2,"rownina","brak",0,null,null,null],[8,2,"rownina","brak",0,null,null,null],[9,2,"rownina","brak",0,null,null,null],[10,2,"rownina","brak",0,null,null,null],[11,2,"rownina","brak",0,null,null,null],[12,2,"rownina","brak",0,null,null,null],[13,2,"rownina","brak",0,null,null,null],[14,2,"rownina","brak",0,null,null,null],[-4,3,"rownina","brak",0,null,null,null],[-3,3,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[7,3,"rownina","brak",0,null,null,null],[8,3,"rownina","brak",0,null,null,null],[9,3,"rownina","brak",0,null,null,null],[10,3,"rownina","brak",0,null,null,null],[11,3,"rownina","brak",0,null,null,null],[12,3,"rownina","brak",0,null,null,null],[13,3,"rownina","brak",0,null,null,null],[14,3,"rownina","brak",0,null,null,null],[-4,4,"rownina","brak",0,null,null,null],[-3,4,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null],[7,4,"rownina","brak",0,null,null,null],[8,4,"rownina","brak",0,null,null,null],[9,4,"rownina","brak",0,null,null,null],[10,4,"rownina","brak",0,null,null,null],[11,4,"rownina","brak",0,null,null,null],[12,4,"rownina","brak",0,null,null,null],[13,4,"rownina","brak",0,null,null,null],[14,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"1","ownerId":0,"q":0,"r":0,"population":1},{"id":"2","ownerId":1,"q":10,"r":0,"population":1}],"era":{"0":1,"1":3},"ui":{"showTradeRoutes":true,"showWorkerOverlay":true,"cityPanelOpen":false,"openCityId":null,"viewer":0},"tradeRoutes":[],"expected":{"trade":null,"workers":{"entries":[["0,1",0],["11,0",1]],"me":0},"okolica":null},"control_global_era1":{"entries":[["0,1",0],["10,1",1]],"me":0},"control_global_era3":{"entries":[["1,0",0],["11,0",1]],"me":0}},{"name":"S2_sibling_workers","rows":[[-4,-4,"rownina","brak",0,null,null,null],[-3,-4,"rownina","brak",0,null,null,null],[-2,-4,"rownina","brak",0,null,null,null],[-1,-4,"rownina","brak",0,null,null,null],[0,-4,"rownina","brak",0,null,null,null],[1,-4,"rownina","brak",0,null,null,null],[2,-4,"rownina","brak",0,null,null,null],[3,-4,"rownina","brak",0,null,null,null],[4,-4,"rownina","brak",0,null,null,null],[5,-4,"rownina","brak",0,null,null,null],[6,-4,"rownina","brak",0,null,null,null],[-4,-3,"rownina","brak",0,null,null,null],[-3,-3,"rownina","brak",0,null,null,null],[-2,-3,"rownina","brak",0,null,null,null],[-1,-3,"rownina","brak",0,null,null,null],[0,-3,"rownina","brak",0,null,null,null],[1,-3,"rownina","brak",0,null,null,null],[2,-3,"rownina","brak",0,null,null,null],[3,-3,"rownina","brak",0,null,null,null],[4,-3,"rownina","brak",0,null,null,null],[5,-3,"rownina","brak",0,null,null,null],[6,-3,"rownina","brak",0,null,null,null],[-4,-2,"rownina","brak",0,null,null,null],[-3,-2,"rownina","brak",0,null,null,null],[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[-4,-1,"rownina","brak",0,null,null,null],[-3,-1,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"laka","brak",0,null,null,null],[2,-1,"wzgorza","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[-4,0,"rownina","brak",0,null,null,null],[-3,0,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"gory","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"laka","brak",1,null,["farma"],null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[-4,1,"rownina","brak",0,null,null,null],[-3,1,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"morze","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[-4,2,"rownina","brak",0,null,null,null],[-3,2,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[-4,3,"rownina","brak",0,null,null,null],[-3,3,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[-4,4,"rownina","brak",0,null,null,null],[-3,4,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"5","ownerId":0,"q":0,"r":0,"population":3},{"id":"6","ownerId":0,"q":2,"r":0,"population":3},{"id":"7","ownerId":2,"q":-3,"r":3,"population":2}],"era":{"0":2,"2":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":true,"cityPanelOpen":false,"openCityId":null,"viewer":0},"tradeRoutes":[],"expected":{"trade":null,"workers":{"entries":[["1,0",0],["1,-1",0],["-1,1",0],["1,1",0],["2,1",0],["3,-1",0],["-2,2",2],["-2,3",2]],"me":0},"okolica":null},"lost":[["5",["1,1","1,2","1,3","1,4","2,-1","2,0","2,1","2,2","2,3","3,-2","3,-1","3,0","3,1","3,2","4,-3","4,-2","4,-1","4,0","4,1","5,-4","5,-3","5,-2","5,-1","5,0"]],["6",["-3,0","-3,1","-3,2","-3,3","-3,4","-2,-1","-2,0","-2,1","-2,2","-2,3","-2,4","-1,-2","-1,-1","-1,0","-1,1","-1,2","-1,3","-1,4","0,-3","0,-2","0,-1","0,0","0,1","0,2","0,3","0,4","1,-4","1,-3","1,-2","1,-1","1,0","2,-4","2,-3","2,-2","3,-4","3,-3","4,-4"]]]},{"name":"S2_sibling_okolica","rows":[[-4,-4,"rownina","brak",0,null,null,null],[-3,-4,"rownina","brak",0,null,null,null],[-2,-4,"rownina","brak",0,null,null,null],[-1,-4,"rownina","brak",0,null,null,null],[0,-4,"rownina","brak",0,null,null,null],[1,-4,"rownina","brak",0,null,null,null],[2,-4,"rownina","brak",0,null,null,null],[3,-4,"rownina","brak",0,null,null,null],[4,-4,"rownina","brak",0,null,null,null],[5,-4,"rownina","brak",0,null,null,null],[6,-4,"rownina","brak",0,null,null,null],[-4,-3,"rownina","brak",0,null,null,null],[-3,-3,"rownina","brak",0,null,null,null],[-2,-3,"rownina","brak",0,null,null,null],[-1,-3,"rownina","brak",0,null,null,null],[0,-3,"rownina","brak",0,null,null,null],[1,-3,"rownina","brak",0,null,null,null],[2,-3,"rownina","brak",0,null,null,null],[3,-3,"rownina","brak",0,null,null,null],[4,-3,"rownina","brak",0,null,null,null],[5,-3,"rownina","brak",0,null,null,null],[6,-3,"rownina","brak",0,null,null,null],[-4,-2,"rownina","brak",0,null,null,null],[-3,-2,"rownina","brak",0,null,null,null],[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[-4,-1,"rownina","brak",0,null,null,null],[-3,-1,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"laka","brak",0,null,null,null],[2,-1,"wzgorza","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[-4,0,"rownina","brak",0,null,null,null],[-3,0,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"gory","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"laka","brak",1,null,["farma"],null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[-4,1,"rownina","brak",0,null,null,null],[-3,1,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"morze","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[-4,2,"rownina","brak",0,null,null,null],[-3,2,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[-4,3,"rownina","brak",0,null,null,null],[-3,3,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[-4,4,"rownina","brak",0,null,null,null],[-3,4,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"5","ownerId":0,"q":0,"r":0,"population":3},{"id":"6","ownerId":0,"q":2,"r":0,"population":3},{"id":"7","ownerId":2,"q":-3,"r":3,"population":2}],"era":{"0":2,"2":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":true,"cityPanelOpen":true,"openCityId":"6","viewer":0},"tradeRoutes":[],"expected":{"trade":null,"workers":null,"okolica":{"cityQ":2,"cityR":0,"range":5,"workedKeys":["1,1","2,1","3,-1"],"showYields":true,"ownerId":0,"yields":[["-3,0",{"zywnosc":2,"praca":2,"handel":1}],["-3,1",{"zywnosc":2,"praca":2,"handel":1}],["-3,2",{"zywnosc":2,"praca":2,"handel":1}],["-3,3",{"zywnosc":2,"praca":2,"handel":1}],["-3,4",{"zywnosc":2,"praca":2,"handel":1}],["-2,-1",{"zywnosc":2,"praca":2,"handel":1}],["-2,0",{"zywnosc":2,"praca":2,"handel":1}],["-2,1",{"zywnosc":2,"praca":2,"handel":1}],["-2,2",{"zywnosc":2,"praca":2,"handel":1}],["-2,3",{"zywnosc":2,"praca":2,"handel":1}],["-2,4",{"zywnosc":2,"praca":2,"handel":1}],["-1,-2",{"zywnosc":2,"praca":2,"handel":1}],["-1,-1",{"zywnosc":2,"praca":2,"handel":1}],["-1,0",{"zywnosc":0,"praca":4,"handel":0}],["-1,1",{"zywnosc":2,"praca":2,"handel":1}],["-1,2",{"zywnosc":2,"praca":2,"handel":1}],["-1,3",{"zywnosc":2,"praca":2,"handel":1}],["-1,4",{"zywnosc":2,"praca":2,"handel":1}],["0,-3",{"zywnosc":2,"praca":2,"handel":1}],["0,-2",{"zywnosc":2,"praca":2,"handel":1}],["0,-1",{"zywnosc":2,"praca":2,"handel":1}],["0,0",{"zywnosc":2,"praca":2,"handel":1}],["0,1",{"zywnosc":2,"praca":0,"handel":2}],["0,2",{"zywnosc":2,"praca":2,"handel":1}],["0,3",{"zywnosc":2,"praca":2,"handel":1}],["0,4",{"zywnosc":2,"praca":2,"handel":1}],["1,-4",{"zywnosc":2,"praca":2,"handel":1}],["1,-3",{"zywnosc":2,"praca":2,"handel":1}],["1,-2",{"zywnosc":2,"praca":2,"handel":1}],["1,-1",{"zywnosc":3,"praca":1,"handel":2}],["1,0",{"zywnosc":10,"praca":7,"handel":9}],["1,1",{"zywnosc":2,"praca":2,"handel":1}],["1,2",{"zywnosc":2,"praca":2,"handel":1}],["1,3",{"zywnosc":2,"praca":2,"handel":1}],["1,4",{"zywnosc":2,"praca":2,"handel":1}],["2,-4",{"zywnosc":2,"praca":2,"handel":1}],["2,-3",{"zywnosc":2,"praca":2,"handel":1}],["2,-2",{"zywnosc":2,"praca":2,"handel":1}],["2,-1",{"zywnosc":1,"praca":3,"handel":0}],["2,0",{"zywnosc":2,"praca":2,"handel":1}],["2,1",{"zywnosc":2,"praca":2,"handel":1}],["2,2",{"zywnosc":2,"praca":2,"handel":1}],["2,3",{"zywnosc":2,"praca":2,"handel":1}],["2,4",{"zywnosc":2,"praca":2,"handel":1}],["3,-4",{"zywnosc":2,"praca":2,"handel":1}],["3,-3",{"zywnosc":2,"praca":2,"handel":1}],["3,-2",{"zywnosc":2,"praca":2,"handel":1}],["3,-1",{"zywnosc":2,"praca":2,"handel":1}],["3,0",{"zywnosc":2,"praca":2,"handel":1}],["3,1",{"zywnosc":2,"praca":2,"handel":1}],["3,2",{"zywnosc":2,"praca":2,"handel":1}],["3,3",{"zywnosc":2,"praca":2,"handel":1}],["3,4",{"zywnosc":2,"praca":2,"handel":1}],["4,-4",{"zywnosc":2,"praca":2,"handel":1}],["4,-3",{"zywnosc":2,"praca":2,"handel":1}],["4,-2",{"zywnosc":2,"praca":2,"handel":1}],["4,-1",{"zywnosc":2,"praca":2,"handel":1}],["4,0",{"zywnosc":2,"praca":2,"handel":1}],["4,1",{"zywnosc":2,"praca":2,"handel":1}],["4,2",{"zywnosc":2,"praca":2,"handel":1}],["4,3",{"zywnosc":2,"praca":2,"handel":1}],["5,-4",{"zywnosc":2,"praca":2,"handel":1}],["5,-3",{"zywnosc":2,"praca":2,"handel":1}],["5,-2",{"zywnosc":2,"praca":2,"handel":1}],["5,-1",{"zywnosc":2,"praca":2,"handel":1}],["5,0",{"zywnosc":2,"praca":2,"handel":1}],["5,1",{"zywnosc":2,"praca":2,"handel":1}],["5,2",{"zywnosc":2,"praca":2,"handel":1}],["6,-4",{"zywnosc":2,"praca":2,"handel":1}],["6,-3",{"zywnosc":2,"praca":2,"handel":1}],["6,-2",{"zywnosc":2,"praca":2,"handel":1}],["6,-1",{"zywnosc":2,"praca":2,"handel":1}],["6,0",{"zywnosc":2,"praca":2,"handel":1}],["6,1",{"zywnosc":2,"praca":2,"handel":1}]]}}},{"name":"S2_okolica_foreign_city","rows":[[-4,-4,"rownina","brak",0,null,null,null],[-3,-4,"rownina","brak",0,null,null,null],[-2,-4,"rownina","brak",0,null,null,null],[-1,-4,"rownina","brak",0,null,null,null],[0,-4,"rownina","brak",0,null,null,null],[1,-4,"rownina","brak",0,null,null,null],[2,-4,"rownina","brak",0,null,null,null],[3,-4,"rownina","brak",0,null,null,null],[4,-4,"rownina","brak",0,null,null,null],[5,-4,"rownina","brak",0,null,null,null],[6,-4,"rownina","brak",0,null,null,null],[-4,-3,"rownina","brak",0,null,null,null],[-3,-3,"rownina","brak",0,null,null,null],[-2,-3,"rownina","brak",0,null,null,null],[-1,-3,"rownina","brak",0,null,null,null],[0,-3,"rownina","brak",0,null,null,null],[1,-3,"rownina","brak",0,null,null,null],[2,-3,"rownina","brak",0,null,null,null],[3,-3,"rownina","brak",0,null,null,null],[4,-3,"rownina","brak",0,null,null,null],[5,-3,"rownina","brak",0,null,null,null],[6,-3,"rownina","brak",0,null,null,null],[-4,-2,"rownina","brak",0,null,null,null],[-3,-2,"rownina","brak",0,null,null,null],[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[-4,-1,"rownina","brak",0,null,null,null],[-3,-1,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"laka","brak",0,null,null,null],[2,-1,"wzgorza","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[-4,0,"rownina","brak",0,null,null,null],[-3,0,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"gory","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"laka","brak",1,null,["farma"],null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[-4,1,"rownina","brak",0,null,null,null],[-3,1,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"morze","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[-4,2,"rownina","brak",0,null,null,null],[-3,2,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[-4,3,"rownina","brak",0,null,null,null],[-3,3,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[-4,4,"rownina","brak",0,null,null,null],[-3,4,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"5","ownerId":0,"q":0,"r":0,"population":3},{"id":"6","ownerId":0,"q":2,"r":0,"population":3},{"id":"7","ownerId":2,"q":-3,"r":3,"population":2}],"era":{"0":2,"2":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":true,"cityPanelOpen":true,"openCityId":"7","viewer":0},"tradeRoutes":[],"expected":{"trade":null,"workers":null,"okolica":null}},{"name":"S3_trade_filter","rows":[[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[7,-2,"rownina","brak",0,null,null,null],[8,-2,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"rownina","brak",0,null,null,null],[2,-1,"rownina","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[7,-1,"rownina","brak",0,null,null,null],[8,-1,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"rownina","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"rownina","brak",0,null,null,null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[7,0,"rownina","brak",0,null,null,null],[8,0,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"rownina","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[7,1,"rownina","brak",0,null,null,null],[8,1,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[7,2,"rownina","brak",0,null,null,null],[8,2,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[7,3,"rownina","brak",0,null,null,null],[8,3,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null],[7,4,"rownina","brak",0,null,null,null],[8,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"10","ownerId":0,"q":0,"r":0,"population":1},{"id":"11","ownerId":1,"q":4,"r":0,"population":1},{"id":"12","ownerId":2,"q":0,"r":3,"population":1},{"id":"13","ownerId":3,"q":6,"r":2,"population":1},{"id":"11","ownerId":1,"q":5,"r":1,"population":1}],"era":{"0":1,"1":1,"2":1,"3":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":false,"cityPanelOpen":false,"openCityId":null,"viewer":0},"tradeRoutes":[{"id":"a","fromCityId":"10","toCityId":"11","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"b","fromCityId":"11","toCityId":"12","ownerId":1,"toOwnerId":2,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"c","fromCityId":"10","toCityId":"12","ownerId":0,"toOwnerId":2,"medium":"morze","dystans":3,"status":"brak_polaczenia","budynekOdblokowany":false},{"id":"d","fromCityId":"10","toCityId":"99","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"e","fromCityId":"12","toCityId":"10","ownerId":2,"toOwnerId":0,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"f","fromCityId":"13","toCityId":"12","ownerId":3,"toOwnerId":2,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"g","fromCityId":"98","toCityId":"10","ownerId":1,"toOwnerId":0,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false}],"expected":{"trade":[{"fromQ":0,"fromR":0,"toQ":5,"toR":1,"medium":"lad"},{"fromQ":0,"fromR":3,"toQ":0,"toR":0,"medium":"morze"}],"workers":null,"okolica":null}},{"name":"S3_trade_hotseat_literal0","rows":[[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[7,-2,"rownina","brak",0,null,null,null],[8,-2,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"rownina","brak",0,null,null,null],[2,-1,"rownina","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[7,-1,"rownina","brak",0,null,null,null],[8,-1,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"rownina","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"rownina","brak",0,null,null,null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[7,0,"rownina","brak",0,null,null,null],[8,0,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"rownina","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[7,1,"rownina","brak",0,null,null,null],[8,1,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[7,2,"rownina","brak",0,null,null,null],[8,2,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[7,3,"rownina","brak",0,null,null,null],[8,3,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null],[7,4,"rownina","brak",0,null,null,null],[8,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"10","ownerId":0,"q":0,"r":0,"population":1},{"id":"11","ownerId":1,"q":4,"r":0,"population":1},{"id":"12","ownerId":2,"q":0,"r":3,"population":1},{"id":"13","ownerId":3,"q":6,"r":2,"population":1},{"id":"11","ownerId":1,"q":5,"r":1,"population":1}],"era":{"0":1,"1":1,"2":1,"3":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":false,"cityPanelOpen":false,"openCityId":null,"viewer":1},"tradeRoutes":[{"id":"a","fromCityId":"10","toCityId":"11","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"b","fromCityId":"11","toCityId":"12","ownerId":1,"toOwnerId":2,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"c","fromCityId":"10","toCityId":"12","ownerId":0,"toOwnerId":2,"medium":"morze","dystans":3,"status":"brak_polaczenia","budynekOdblokowany":false},{"id":"d","fromCityId":"10","toCityId":"99","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"e","fromCityId":"12","toCityId":"10","ownerId":2,"toOwnerId":0,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"f","fromCityId":"13","toCityId":"12","ownerId":3,"toOwnerId":2,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"g","fromCityId":"98","toCityId":"10","ownerId":1,"toOwnerId":0,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false}],"expected":{"trade":[{"fromQ":0,"fromR":0,"toQ":5,"toR":1,"medium":"lad"},{"fromQ":0,"fromR":3,"toQ":0,"toR":0,"medium":"morze"}],"workers":null,"okolica":null}},{"name":"S3_trade_panel_open","rows":[[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[7,-2,"rownina","brak",0,null,null,null],[8,-2,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"rownina","brak",0,null,null,null],[2,-1,"rownina","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[7,-1,"rownina","brak",0,null,null,null],[8,-1,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"rownina","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"rownina","brak",0,null,null,null],[2,0,"rownina","brak",0,null,null,null],[3,0,"rownina","brak",0,null,null,null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[7,0,"rownina","brak",0,null,null,null],[8,0,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"rownina","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[7,1,"rownina","brak",0,null,null,null],[8,1,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[7,2,"rownina","brak",0,null,null,null],[8,2,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null],[7,3,"rownina","brak",0,null,null,null],[8,3,"rownina","brak",0,null,null,null],[-2,4,"rownina","brak",0,null,null,null],[-1,4,"rownina","brak",0,null,null,null],[0,4,"rownina","brak",0,null,null,null],[1,4,"rownina","brak",0,null,null,null],[2,4,"rownina","brak",0,null,null,null],[3,4,"rownina","brak",0,null,null,null],[4,4,"rownina","brak",0,null,null,null],[5,4,"rownina","brak",0,null,null,null],[6,4,"rownina","brak",0,null,null,null],[7,4,"rownina","brak",0,null,null,null],[8,4,"rownina","brak",0,null,null,null]],"cities":[{"id":"10","ownerId":0,"q":0,"r":0,"population":1},{"id":"11","ownerId":1,"q":4,"r":0,"population":1},{"id":"12","ownerId":2,"q":0,"r":3,"population":1},{"id":"13","ownerId":3,"q":6,"r":2,"population":1},{"id":"11","ownerId":1,"q":5,"r":1,"population":1}],"era":{"0":1,"1":1,"2":1,"3":1},"ui":{"showTradeRoutes":true,"showWorkerOverlay":false,"cityPanelOpen":true,"openCityId":"10","viewer":0},"tradeRoutes":[{"id":"a","fromCityId":"10","toCityId":"11","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"b","fromCityId":"11","toCityId":"12","ownerId":1,"toOwnerId":2,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"c","fromCityId":"10","toCityId":"12","ownerId":0,"toOwnerId":2,"medium":"morze","dystans":3,"status":"brak_polaczenia","budynekOdblokowany":false},{"id":"d","fromCityId":"10","toCityId":"99","ownerId":0,"toOwnerId":1,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"e","fromCityId":"12","toCityId":"10","ownerId":2,"toOwnerId":0,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"f","fromCityId":"13","toCityId":"12","ownerId":3,"toOwnerId":2,"medium":"morze","dystans":3,"status":"polaczony","budynekOdblokowany":false},{"id":"g","fromCityId":"98","toCityId":"10","ownerId":1,"toOwnerId":0,"medium":"lad","dystans":3,"status":"polaczony","budynekOdblokowany":false}],"expected":{"trade":null,"workers":null,"okolica":{"cityQ":0,"cityR":0,"range":5,"workedKeys":["-1,0"],"showYields":true,"ownerId":0,"yields":[["-2,-2",{"zywnosc":2,"praca":2,"handel":1}],["-2,-1",{"zywnosc":2,"praca":2,"handel":1}],["-2,0",{"zywnosc":2,"praca":2,"handel":1}],["-2,1",{"zywnosc":2,"praca":2,"handel":1}],["-2,2",{"zywnosc":2,"praca":2,"handel":1}],["-2,3",{"zywnosc":2,"praca":2,"handel":1}],["-2,4",{"zywnosc":2,"praca":2,"handel":1}],["-1,-2",{"zywnosc":2,"praca":2,"handel":1}],["-1,-1",{"zywnosc":2,"praca":2,"handel":1}],["-1,0",{"zywnosc":2,"praca":2,"handel":1}],["-1,1",{"zywnosc":2,"praca":2,"handel":1}],["-1,2",{"zywnosc":2,"praca":2,"handel":1}],["-1,3",{"zywnosc":2,"praca":2,"handel":1}],["-1,4",{"zywnosc":2,"praca":2,"handel":1}],["0,-2",{"zywnosc":2,"praca":2,"handel":1}],["0,-1",{"zywnosc":2,"praca":2,"handel":1}],["0,0",{"zywnosc":2,"praca":2,"handel":1}],["0,1",{"zywnosc":2,"praca":2,"handel":1}],["0,2",{"zywnosc":2,"praca":2,"handel":1}],["0,3",{"zywnosc":2,"praca":2,"handel":1}],["0,4",{"zywnosc":2,"praca":2,"handel":1}],["1,-2",{"zywnosc":2,"praca":2,"handel":1}],["1,-1",{"zywnosc":2,"praca":2,"handel":1}],["1,0",{"zywnosc":2,"praca":2,"handel":1}],["1,1",{"zywnosc":2,"praca":2,"handel":1}],["1,2",{"zywnosc":2,"praca":2,"handel":1}],["1,3",{"zywnosc":2,"praca":2,"handel":1}],["1,4",{"zywnosc":2,"praca":2,"handel":1}],["2,-2",{"zywnosc":2,"praca":2,"handel":1}],["2,-1",{"zywnosc":2,"praca":2,"handel":1}],["2,0",{"zywnosc":2,"praca":2,"handel":1}],["2,1",{"zywnosc":2,"praca":2,"handel":1}],["2,2",{"zywnosc":2,"praca":2,"handel":1}],["2,3",{"zywnosc":2,"praca":2,"handel":1}],["3,-2",{"zywnosc":2,"praca":2,"handel":1}],["3,-1",{"zywnosc":2,"praca":2,"handel":1}],["3,0",{"zywnosc":2,"praca":2,"handel":1}],["3,1",{"zywnosc":2,"praca":2,"handel":1}],["3,2",{"zywnosc":2,"praca":2,"handel":1}],["4,-2",{"zywnosc":2,"praca":2,"handel":1}],["4,-1",{"zywnosc":2,"praca":2,"handel":1}],["4,0",{"zywnosc":2,"praca":2,"handel":1}],["4,1",{"zywnosc":2,"praca":2,"handel":1}],["5,-2",{"zywnosc":2,"praca":2,"handel":1}],["5,-1",{"zywnosc":2,"praca":2,"handel":1}],["5,0",{"zywnosc":2,"praca":2,"handel":1}]]}}},{"name":"S4_map_order_no_territory","rows":[[-4,-3,"rownina","brak",0,null,null,null],[-3,-3,"rownina","brak",0,null,null,null],[-2,-3,"rownina","brak",0,null,null,null],[-1,-3,"rownina","brak",0,null,null,null],[0,-3,"rownina","brak",0,null,null,null],[1,-3,"rownina","brak",0,null,null,null],[2,-3,"rownina","brak",0,null,null,null],[3,-3,"rownina","brak",0,null,null,null],[4,-3,"rownina","brak",0,null,null,null],[5,-3,"rownina","brak",0,null,null,null],[6,-3,"rownina","brak",0,null,null,null],[-4,-2,"rownina","brak",0,null,null,null],[-3,-2,"rownina","brak",0,null,null,null],[-2,-2,"rownina","brak",0,null,null,null],[-1,-2,"rownina","brak",0,null,null,null],[0,-2,"rownina","brak",0,null,null,null],[1,-2,"rownina","brak",0,null,null,null],[2,-2,"rownina","brak",0,null,null,null],[3,-2,"rownina","brak",0,null,null,null],[4,-2,"rownina","brak",0,null,null,null],[5,-2,"rownina","brak",0,null,null,null],[6,-2,"rownina","brak",0,null,null,null],[-4,-1,"rownina","brak",0,null,null,null],[-3,-1,"rownina","brak",0,null,null,null],[-2,-1,"rownina","brak",0,null,null,null],[-1,-1,"rownina","brak",0,null,null,null],[0,-1,"rownina","brak",0,null,null,null],[1,-1,"rownina","brak",0,null,null,null],[2,-1,"rownina","brak",0,null,null,null],[3,-1,"rownina","brak",0,null,null,null],[4,-1,"rownina","brak",0,null,null,null],[5,-1,"rownina","brak",0,null,null,null],[6,-1,"rownina","brak",0,null,null,null],[-4,0,"rownina","brak",0,null,null,null],[-3,0,"rownina","brak",0,null,null,null],[-2,0,"rownina","brak",0,null,null,null],[-1,0,"rownina","brak",0,null,null,null],[0,0,"rownina","brak",0,null,null,null],[1,0,"rownina","brak",0,null,null,null],[2,0,"rownina","brak",0,null,null,null],[3,0,"laka","brak",1,null,["farma"],null],[4,0,"rownina","brak",0,null,null,null],[5,0,"rownina","brak",0,null,null,null],[6,0,"rownina","brak",0,null,null,null],[-4,1,"rownina","brak",0,null,null,null],[-3,1,"rownina","brak",0,null,null,null],[-2,1,"rownina","brak",0,null,null,null],[-1,1,"rownina","brak",0,null,null,null],[0,1,"rownina","brak",0,null,null,null],[1,1,"rownina","brak",0,null,null,null],[2,1,"rownina","brak",0,null,null,null],[3,1,"rownina","brak",0,null,null,null],[4,1,"rownina","brak",0,null,null,null],[5,1,"rownina","brak",0,null,null,null],[6,1,"rownina","brak",0,null,null,null],[-4,2,"rownina","brak",0,null,null,null],[-3,2,"rownina","brak",0,null,null,null],[-2,2,"rownina","brak",0,null,null,null],[-1,2,"rownina","brak",0,null,null,null],[0,2,"rownina","brak",0,null,null,null],[1,2,"rownina","brak",0,null,null,null],[2,2,"rownina","brak",0,null,null,null],[3,2,"rownina","brak",0,null,null,null],[4,2,"rownina","brak",0,null,null,null],[5,2,"rownina","brak",0,null,null,null],[6,2,"rownina","brak",0,null,null,null],[-4,3,"rownina","brak",0,null,null,null],[-3,3,"rownina","brak",0,null,null,null],[-2,3,"rownina","brak",0,null,null,null],[-1,3,"rownina","brak",0,null,null,null],[0,3,"rownina","brak",0,null,null,null],[1,3,"rownina","brak",0,null,null,null],[2,3,"rownina","brak",0,null,null,null],[3,3,"rownina","brak",0,null,null,null],[4,3,"rownina","brak",0,null,null,null],[5,3,"rownina","brak",0,null,null,null],[6,3,"rownina","brak",0,null,null,null]],"cities":[{"id":"20","ownerId":1,"q":4,"r":0,"population":3},{"id":"21","ownerId":0,"q":1,"r":0,"population":3},{"id":"22","ownerId":1,"q":2,"r":1,"population":1}],"era":{"0":1,"1":3},"direct":[["3,0",0],["3,1",1],["4,-1",1],["0,0",0],["0,1",0],["1,1",1]],"perCity":[["3,0","3,1","4,-1"],["3,0","0,0","0,1"],["1,1"]]}]}"##;
