//! R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1 (pin weba 23dd158e9; wektory zregenerowane z uruchomionego weba tego pinu (REPIN-VECTORS-POSTMERGE-Q1)): ZRODLA STANU ticku ekonomii
//! (`turn_economy_inputs_{civ,podzial,native}`) wobec URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1/gen-p6-state-src-vectors.mjs`).
//!
//! 1. `native_sources_match_running_web`: `placedImprovementsForOwner`, `ownerHasNativeResourceAccess` (5 kluczy),
//!    grant z trasy, `ownerHasZlotoAccessNow` (bez zapasu), `empireActiveResourceLabelsForOwner`.
//! 2. `owner_civ_map_matches_running_web`, 3. `owner_default_podzial_matches_running_web`.
//! 4. `e2e_tick_with_rust_sources_equals_tick_with_web_resolver_values`: `run_economy_tick_for_game` ze zrodlami Rust
//!    daje WYNIK IDENTYCZNY z ticku, ktoremu wejscia (`native_zloto_access`, `empire_active_labels`) podano jako
//!    wartosci policzone przez web; samo wiazanie jest zgodne z webem bit-w-bit (`tests/p6_adv_q6_wire.rs`).

use std::collections::{BTreeMap, BTreeSet, HashMap};

use civ_engine::data::buildings_tech::{parse_buildings, parse_wonders};
use civ_engine::data::terrain_map::parse_terrain_yields;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    City, CityPodzialHandlu, CityPodzialPracy,
};
use civ_engine::domain::terrain::CityNode;
use civ_engine::domain::territory::{TerritoryNode, TerritoryOrder};
use civ_engine::domain::trade::{
    TradeRoute, TradeRouteMedium, TradeRouteResourceGrant, TradeRouteStatus,
};
use civ_engine::domain::turn_economy_inputs_civ::build_owner_civ_map;
use civ_engine::domain::turn_economy_inputs_native::{
    empire_active_resource_labels_for_owner, owner_has_native_resource_access,
    placed_improvements_for_owner, StateSources, StateSourcesWorld,
};
use civ_engine::domain::turn_economy_inputs_podzial::{
    init_owner_default_podzial_handlu, init_owner_default_podzial_pracy,
    seed_city_owner_defaults_podzial,
};
use civ_engine::domain::turn_economy_inputs_state::MennicaZlotoGraceState;
use civ_engine::domain::turn_economy_loop::CityLoopExtra;
use civ_engine::domain::turn_economy_territory::TerrainContext;
use civ_engine::domain::turn_economy_upkeep::unit_rows_from_json_str;
use civ_engine::domain::turn_economy_wire::{run_economy_tick_for_game, GameEconomyContext};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_state_src_vectors/state_src.json");
const ECON: &str = include_str!("../data/econ-params.json");
const SOCIETY: &str = include_str!("../data/society-params.json");
const UNITS: &str = include_str!("../data/units.json");

const KEYS: [&str; 5] = ["braz", "zelazo", "cegla", "zloto", "kon"];

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("state_src.json")
}

fn s(v: &Value) -> String {
    v.as_str().expect("string").to_string()
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array().expect("array").iter().map(s).collect()
}

/// Wlasciciel jako klucz JSON obiektu.
fn owner_key(k: &str) -> i64 {
    k.parse().expect("owner")
}

struct World {
    cities: Vec<City>,
    built: BTreeMap<String, Vec<String>>,
    placed: Vec<(String, Vec<String>)>,
    forts: Vec<TerritoryNode>,
    map: BuildMap,
    hex_owners: HashMap<String, String>,
    kultura: BTreeMap<String, f64>,
    routes: Vec<TradeRoute>,
    era: BTreeMap<i64, f64>,
    owners: Vec<i64>,
}

fn build_world(inp: &Value) -> World {
    let mut hexes = Vec::new();
    let mut hex_owners = HashMap::new();
    for h in inp["hexes"].as_array().unwrap() {
        let (q, r) = (
            h["q"].as_i64().unwrap() as i32,
            h["r"].as_i64().unwrap() as i32,
        );
        let overlay = h["nakladka"].as_str().map_or(Overlay::Brak, |o| {
            Overlay::from_web_value(o).expect("nakladka")
        });
        let mut hex = BuildHex::new(
            q,
            r,
            terrain_from_web_value(h["teren"].as_str().unwrap()).expect("teren"),
            overlay,
        );
        hex.zloze = h["zloze"].as_str().map(str::to_owned);
        if let Some(w) = h["wlasciciel"].as_str() {
            hex_owners.insert(format!("{q},{r}"), w.to_string());
        }
        hexes.push(hex);
    }
    let mut cities = Vec::new();
    let mut kultura = BTreeMap::new();
    let mut built = BTreeMap::new();
    for c in inp["cities"].as_array().unwrap() {
        let id = s(&c["id"]);
        cities.push(City {
            id: id.clone(),
            owner_id: c["ownerId"].as_i64().unwrap(),
            q: c["q"].as_f64().unwrap(),
            r: c["r"].as_f64().unwrap(),
            name: id.clone(),
            population: c["population"].as_f64().unwrap(),
            ..City::default()
        });
        if let Some(k) = c["kultura"].as_f64() {
            kultura.insert(id.clone(), k);
        }
        built.insert(id.clone(), strings(&inp["builtByCity"][id.as_str()]));
    }
    let placed = inp["placed"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| (s(&p[0]), strings(&p[1])))
        .collect();
    let forts = inp["forts"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| {
            let mut n = CityNode::city(
                f["q"].as_i64().unwrap() as i32,
                f["r"].as_i64().unwrap() as i32,
                f["pop"].as_f64().unwrap(),
            );
            n.level = f["level"].as_f64().unwrap();
            n.is_fort = f["isFort"].as_bool();
            n.is_outpost = f["isOutpost"].as_bool();
            let order = f
                .get("order")
                .filter(|o| o.is_object())
                .map(|o| TerritoryOrder {
                    turn: o["turn"].as_i64().unwrap(),
                    seq: o["seq"].as_i64().unwrap(),
                });
            TerritoryNode::with_order(n, f["ownerId"].as_i64().unwrap(), order)
        })
        .collect();
    let routes = inp["routes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| {
            TradeRoute::from_parts(
                s(&r["id"]),
                s(&r["fromCityId"]),
                s(&r["toCityId"]),
                PlayerId::new(r["ownerId"].as_u64().unwrap()),
                PlayerId::new(r["toOwnerId"].as_u64().unwrap()),
                if r["medium"] == "lad" {
                    TradeRouteMedium::Land
                } else {
                    TradeRouteMedium::Sea
                },
                r["dystans"].as_u64().unwrap() as u32,
                if r["status"] == "polaczony" {
                    TradeRouteStatus::Connected
                } else {
                    TradeRouteStatus::NoConnection
                },
                r["budynekOdblokowany"].as_bool().unwrap(),
            )
        })
        .collect();
    let era = inp["eraByOwner"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (owner_key(k), v.as_f64().unwrap()))
        .collect();
    let mut owners: Vec<i64> = inp["owners"]
        .as_array()
        .unwrap()
        .iter()
        .map(|o| o.as_i64().unwrap())
        .collect();
    owners.push(7);
    owners.sort_unstable();
    owners.dedup();
    World {
        cities,
        built,
        placed,
        forts,
        map: BuildMap::new(hexes, Vec::new()),
        hex_owners,
        kultura,
        routes,
        era,
        owners,
    }
}

fn world_view(w: &World) -> StateSourcesWorld<'_> {
    StateSourcesWorld {
        cities: &w.cities,
        built_by_city: &w.built,
        placed: &w.placed,
        extra_territory_nodes: &w.forts,
        map: &w.map,
        hex_owners: &w.hex_owners,
        kultura_by_city: &w.kultura,
    }
}

fn border_fn(table: &Value) -> impl Fn(f64) -> f64 + '_ {
    move |k: f64| {
        let key = format!("{k}");
        table[key.as_str()]
            .as_f64()
            .unwrap_or_else(|| panic!("brak cityBorderRadius dla {key}"))
    }
}

fn grants_json(g: &[TradeRouteResourceGrant]) -> Vec<(u64, String, u64, String, String)> {
    g.iter()
        .map(|x| {
            (
                x.owner_id.get(),
                x.resource_key.clone(),
                x.via_owner_id.get(),
                x.via_city_id.clone(),
                x.route_id.clone(),
            )
        })
        .collect()
}

fn web_grants(v: &Value) -> Vec<(u64, String, u64, String, String)> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|g| {
            (
                g["ownerId"].as_u64().unwrap(),
                s(&g["resourceKey"]),
                g["viaOwnerId"].as_u64().unwrap(),
                s(&g["viaCityId"]),
                s(&g["routeId"]),
            )
        })
        .collect()
}

#[test]
fn native_sources_match_running_web() {
    let d = vectors();
    let mut checks = 0usize;
    for sc in d["scenarios"].as_array().unwrap() {
        let name = s(&sc["in"]["name"]);
        let w = build_world(&sc["in"]);
        let out = &sc["out"];
        let view = world_view(&w);
        let border = border_fn(&out["border"]);
        let era_f = |o: i64| w.era.get(&o).copied().unwrap_or(1.0);
        let src = StateSources::new(world_view(&w), &w.routes, &era_f, &border);
        assert_eq!(
            grants_json(&src.grants),
            web_grants(&out["grants"]),
            "{name}: grants"
        );
        for &o in &w.owners {
            let ok = o.to_string();
            let got: Vec<(String, Vec<String>)> = placed_improvements_for_owner(&view, o);
            let want: Vec<(String, Vec<String>)> = out["placedForOwner"][ok.as_str()]
                .as_array()
                .unwrap()
                .iter()
                .map(|p| (s(&p[0]), strings(&p[1])))
                .collect();
            assert_eq!(got, want, "{name}: placedForOwner {o}");
            for key in KEYS {
                let want = out["native"][ok.as_str()][key].as_bool().unwrap();
                assert_eq!(
                    owner_has_native_resource_access(&view, o, key),
                    want,
                    "{name}: native {o} {key}"
                );
                checks += 1;
            }
            assert_eq!(
                src.native_zloto_access(o),
                out["zlotoNT"][ok.as_str()].as_bool().unwrap(),
                "{name}: zloto native|trade {o}"
            );
            let eraw = era_f(o) as i64;
            assert_eq!(
                empire_active_resource_labels_for_owner(&view, o, eraw, &border),
                strings(&out["labels"][ok.as_str()]),
                "{name}: labels {o}"
            );
            checks += 3;
        }
    }
    assert!(checks > 5000, "za malo sprawdzen: {checks}");
}

#[test]
fn owner_civ_map_matches_running_web() {
    let d = vectors();
    for (i, c) in d["civCases"].as_array().unwrap().iter().enumerate() {
        let pairs = |v: &Value| -> BTreeMap<i64, String> {
            v.as_array()
                .unwrap()
                .iter()
                .map(|p| (p[0].as_i64().unwrap(), s(&p[1])))
                .collect()
        };
        let player = c["playerCiv"].as_str();
        let got = build_owner_civ_map(&pairs(&c["menu"]), player, &pairs(&c["ai"]));
        let want = pairs(&c["out"]);
        assert_eq!(got, want, "civCase {i}");
    }
}

fn handlu_of(v: &Value) -> CityPodzialHandlu {
    CityPodzialHandlu {
        procent_nauka: v["procentNauka"].as_f64().unwrap(),
        procent_pieniadz: v["procentPieniadz"].as_f64().unwrap(),
        procent_luksus: v["procentLuksus"].as_f64().unwrap(),
    }
}

#[test]
fn owner_default_podzial_matches_running_web() {
    let d = vectors();
    for (i, c) in d["podzialCases"].as_array().unwrap().iter().enumerate() {
        let ids = |k: &str| -> Vec<i64> {
            c[k].as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_i64().unwrap())
                .collect()
        };
        let (humans, ai_start, human_set, seed) = (
            ids("humans"),
            ids("aiStart"),
            ids("humanSet"),
            ids("seedOwners"),
        );
        let hmap = |v: &Value| -> BTreeMap<i64, CityPodzialHandlu> {
            v.as_array()
                .unwrap()
                .iter()
                .map(|p| (p[0].as_i64().unwrap(), handlu_of(&p[1])))
                .collect()
        };
        let pmap = |v: &Value| -> BTreeMap<i64, CityPodzialPracy> {
            v.as_array()
                .unwrap()
                .iter()
                .map(|p| {
                    (
                        p[0].as_i64().unwrap(),
                        CityPodzialPracy {
                            procent_budynki: p[1]["procentBudynki"].as_f64().unwrap(),
                        },
                    )
                })
                .collect()
        };
        let mut h = init_owner_default_podzial_handlu(&humans, &ai_start);
        let mut p = init_owner_default_podzial_pracy(&humans, &ai_start);
        assert_eq!(h, hmap(&c["init"]["handlu"]), "init handlu {i}");
        assert_eq!(p, pmap(&c["init"]["pracy"]), "init pracy {i}");
        let hs: BTreeSet<i64> = human_set.into_iter().collect();
        for o in seed {
            let city = City {
                owner_id: o,
                ..City::default()
            };
            seed_city_owner_defaults_podzial(&city, &|x| hs.contains(&x), &mut h, &mut p);
        }
        assert_eq!(h, hmap(&c["seeded"]["handlu"]), "seed handlu {i}");
        assert_eq!(p, pmap(&c["seeded"]["pracy"]), "seed pracy {i}");
    }
}

/// Jeden tick wiazania; `native`/`labels` jako zrodlo (Rust) albo wartosci web.
fn run_tick(
    w: &World,
    native: &dyn Fn(i64) -> bool,
    labels: &dyn Fn(i64) -> Vec<String>,
) -> String {
    let mut cities = w.cities.clone();
    let mut extras: BTreeMap<String, CityLoopExtra> = BTreeMap::new();
    let mut grace = MennicaZlotoGraceState::default();
    let ty = parse_terrain_yields().expect("terrain-yields");
    let matrix = load_civ_matrix().file.clone();
    let society: Value = serde_json::from_str(SOCIETY).unwrap();
    let econ: Value = serde_json::from_str(ECON).unwrap();
    let unit_rows = unit_rows_from_json_str(UNITS).expect("units");
    let buildings = parse_buildings().expect("buildings");
    let wonders = parse_wonders().expect("wonders");
    let tctx = TerrainContext {
        map: &w.map,
        terrain_yields: &ty,
    };
    let zbadane: BTreeSet<String> = BTreeSet::new();
    // Zrodla Rust: ownerCivMap + domyslne podzialy (te same dla obu przebiegow).
    let civs = ["grecy", "rzymianie", "egipt", "sumer"];
    let menu: BTreeMap<i64, String> = BTreeMap::new();
    let ai: BTreeMap<i64, String> = w
        .owners
        .iter()
        .filter(|&&o| o != 0)
        .map(|&o| {
            (
                o,
                civs[(o.unsigned_abs() as usize) % civs.len()].to_string(),
            )
        })
        .collect();
    let civ = build_owner_civ_map(&menu, Some("grecy"), &ai);
    let owners_on_map: Vec<i64> = {
        let mut v: Vec<i64> = w.cities.iter().map(|c| c.owner_id).collect();
        v.sort_unstable();
        v.dedup();
        v
    };
    let mut def_h = init_owner_default_podzial_handlu(&[0], &[]);
    let mut def_p = init_owner_default_podzial_pracy(&[0], &[]);
    for c in &w.cities {
        seed_city_owner_defaults_podzial(c, &|x| x == 0, &mut def_h, &mut def_p);
    }
    let built = w.built.clone();
    let order = BTreeMap::new();
    let routes = w.routes.clone();
    let placed_w = Vec::new();
    let tax = BTreeMap::new();
    let capital = BTreeMap::new();
    let humans: BTreeSet<i64> = [0].into_iter().collect();
    let era_f = |o: i64| w.era.get(&o).copied().unwrap_or(1.0);
    let tech_f = |_o: i64| BTreeSet::<String>::new();
    let econ_units = Vec::new();
    let gctx = GameEconomyContext {
        difficulty: "normal",
        player_era: 1.0,
        player_zbadane: &zbadane,
        econ_params: &econ,
        terrain: &tctx,
        matrix: &matrix,
        buildings: &buildings,
        unit_rows: &unit_rows,
        society_params: Some(&society),
        wonders: &wonders,
        built_by_city: &built,
        owner_civ_by_owner_id: &civ,
        order_mult_by_city: &order,
        owner_default_podzial_handlu_by_owner: &def_h,
        owner_default_podzial_pracy_by_owner: &def_p,
        trade_routes: &routes,
        placed_wonders: &placed_w,
        pending_manual_work_tax_by_owner: &tax,
        capital_city_id_by_owner: &capital,
        human_owner_ids: &humans,
        econ_units: &econ_units,
        owner_era: &era_f,
        owner_tech: &tech_f,
        native_zloto_access: native,
        empire_active_labels: labels,
    };
    let out = run_economy_tick_for_game(&mut cities, &mut extras, &mut grace, &gctx, None);
    let _ = owners_on_map;
    format!("{:?}|{:?}|{:?}|{:?}", out, cities, extras, grace)
}

#[test]
fn e2e_tick_with_rust_sources_equals_tick_with_web_resolver_values() {
    let d = vectors();
    let mut ran = 0usize;
    let mut diverged_when_flipped = 0usize;
    for sc in d["scenarios"].as_array().unwrap() {
        let name = s(&sc["in"]["name"]);
        let w = build_world(&sc["in"]);
        if w.cities.is_empty() {
            continue;
        }
        let out = &sc["out"];
        let border = border_fn(&out["border"]);
        let era_f = |o: i64| w.era.get(&o).copied().unwrap_or(1.0);
        let src = StateSources::new(world_view(&w), &w.routes, &era_f, &border);
        let web_native = |o: i64| {
            out["zlotoNT"][o.to_string().as_str()]
                .as_bool()
                .unwrap_or(false)
        };
        let web_labels = |o: i64| -> Vec<String> {
            out["labels"][o.to_string().as_str()]
                .as_array()
                .map(|a| a.iter().map(s).collect())
                .unwrap_or_default()
        };
        let rust_native = |o: i64| src.native_zloto_access(o);
        let rust_labels = |o: i64| src.empire_active_labels(o);
        let a = run_tick(&w, &rust_native, &rust_labels);
        let b = run_tick(&w, &web_native, &web_labels);
        assert_eq!(
            a, b,
            "{name}: tick ze zrodlami Rust != tick z wartosciami weba"
        );
        // Kontrola negatywna: odwrocony dostep do zlota zmienia wynik w czesci scenariuszy.
        let flipped = |o: i64| !web_native(o);
        if run_tick(&w, &flipped, &web_labels) != b {
            diverged_when_flipped += 1;
        }
        ran += 1;
    }
    assert!(ran > 200, "za malo scenariuszy: {ran}");
    assert!(
        diverged_when_flipped > 0,
        "kontrola negatywna: zadna zmiana wejscia nie wplynela na tick (test niczego nie dowodzi)"
    );
}
