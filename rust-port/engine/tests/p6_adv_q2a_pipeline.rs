//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1 (pin weba 4bbef081d): wejscia terenowe ticku ekonomii
//! (`computeTerritoryResourceYieldByCity`, `computeWorkedMagazynYieldsByCity`, wiazanie P1/P2:
//! `buildTerritoryNodesFromCities` + `computeLostToNearerSiblingByCity` + `reconcileAllWorkedTiles`)
//! liczone z `state::City` + mapy przez `advance_city_economy_resources_with_map`. Wektory z URUCHOMIONEGO
//! `advanceCityEconomy` (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1/gen-p6-adv-q2a-vectors.mjs`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::improvements::territory_resource_yield_for_improvement;
use civ_engine::domain::okolica::Reczne;
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{City, OkolicaFocus, OkolicaTryb};
use civ_engine::domain::territory::{CityNode, TerritoryNode, TerritoryOrder};
use civ_engine::domain::turn_economy_advance::{
    advance_city_economy_resources_with_map, AdvanceCityEconomyInput, AdvanceResolvers,
};
use civ_engine::domain::turn_economy_resources::{TerritoryResourceYield, WorkedMagazynYield};
use civ_engine::domain::turn_economy_territory::{
    compute_territory_resource_yield_by_city, compute_worked_magazyn_yields_by_city,
    okolica_city_of, territory_nodes_of, work_city_of, TerrainContext,
};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_q2a_vectors/q2a.json");
const ECON: &str = include_str!("../data/econ-params.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("q2a.json")
}

fn build_map(m: &Value) -> BuildMap {
    let hexes = m["hexes"]
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
            hex.ulepszenia = a[6].as_array().map(|l| l.iter().map(text).collect());
            hex.zloze = a[7].as_str().map(str::to_owned);
            hex
        })
        .collect();
    BuildMap::new(hexes, vec![])
}

fn reczne_of(v: &Value) -> Option<Reczne> {
    v.as_array().map(|pairs| {
        let mut r = Reczne::new();
        for p in pairs {
            r.set(p[0].as_str().unwrap(), num(&p[1]));
        }
        r
    })
}

fn reczne_value(r: &Option<Reczne>) -> Value {
    match r {
        None => Value::Null,
        Some(r) => Value::Array(r.iter().map(|(k, v)| json!([k, enc(v)])).collect()),
    }
}

fn tryb_of(v: &Value) -> Option<OkolicaTryb> {
    v.as_str().map(|s| OkolicaTryb::from_web(s).expect("tryb"))
}

fn focus_of(v: &Value) -> Option<OkolicaFocus> {
    v.as_str()
        .map(|s| OkolicaFocus::from_web(s).expect("focus"))
}

fn city_of(c: &Value) -> City {
    City {
        id: text(&c["id"]),
        owner_id: c["owner"].as_i64().unwrap(),
        q: num(&c["q"]),
        r: num(&c["r"]),
        name: text(&c["id"]),
        population: num(&c["pop"]),
        surowce: c.get("surowce").and_then(|s| {
            s.as_object()
                .map(|o| o.iter().map(|(k, x)| (k.clone(), num(x))).collect())
        }),
        okolica_tryb: tryb_of(&c["tryb"]),
        okolica_focus: focus_of(&c["focus"]),
        okolica_reczne: reczne_of(&c["reczne"]),
        ..City::default()
    }
}

fn terr_value(m: &BTreeMap<String, TerritoryResourceYield>) -> Value {
    let mut out = serde_json::Map::new();
    for (id, t) in m {
        let mut rec = serde_json::Map::new();
        for (k, v) in [
            ("drewno", t.drewno),
            ("kamien", t.kamien),
            ("glina", t.glina),
            ("ruda", t.ruda),
            ("ruda_zelaza", t.ruda_zelaza),
            ("ruda_cyny", t.ruda_cyny),
            ("sol", t.sol),
            ("zloto", t.zloto),
            ("kon", t.kon),
        ] {
            if let Some(x) = v {
                rec.insert(k.to_owned(), enc(x));
            }
        }
        out.insert(id.clone(), Value::Object(rec));
    }
    Value::Object(out)
}

fn worked_value(m: &BTreeMap<String, WorkedMagazynYield>) -> Value {
    Value::Object(
        m.iter()
            .map(|(id, w)| {
                (
                    id.clone(),
                    json!({"drewno": enc(w.drewno), "kamien": enc(w.kamien), "glina": enc(w.glina)}),
                )
            })
            .collect(),
    )
}

fn lost_value(m: &BTreeMap<String, BTreeSet<String>>) -> Value {
    Value::Object(
        m.iter()
            .map(|(id, s)| (id.clone(), json!(s.iter().collect::<Vec<_>>())))
            .collect(),
    )
}

/// Web zapisuje zbior w kolejnosci wstawiania; Rust zwraca `BTreeSet` - porownanie jako zbiory.
fn lost_expected(v: &Value) -> Value {
    Value::Object(
        v.as_object()
            .unwrap()
            .iter()
            .map(|(id, l)| {
                let set: BTreeSet<String> = strings(l).into_iter().collect();
                (id.clone(), json!(set.iter().collect::<Vec<_>>()))
            })
            .collect(),
    )
}

fn terrain_yields() -> TerrainYieldsFile {
    parse_terrain_yields().expect("terrain-yields.json")
}

fn city_nodes_tn(cities: &[City]) -> Vec<TerritoryNode> {
    territory_nodes_of(cities)
}

#[test]
fn advance_with_map_matches_running_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let ty = terrain_yields();
    let econ: Value = serde_json::from_str(ECON).expect("econ-params.json");
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 450);
    let (mut n_terr, mut n_worked, mut n_lost, mut n_reczne_cut) = (0, 0, 0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
        let mut cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
        let before: Vec<Option<Reczne>> = cities.iter().map(|c| c.okolica_reczne.clone()).collect();
        let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
            .iter()
            .map(|c| (text(&c["id"]), strings(&c["built"])))
            .collect();
        let era: Option<BTreeMap<i64, f64>> = s["eraByOwner"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse::<i64>().unwrap(), num(v)))
                .collect()
        });
        let era_f = |o: i64| era.as_ref().unwrap()[&o];
        let zloto = |_: i64| true;
        let diff = text(&s["difficulty"]);
        let zbadane = BTreeSet::new();
        let empty_terr = BTreeMap::new();
        let empty_worked = BTreeMap::new();
        let input = AdvanceCityEconomyInput {
            built_by_city: &built,
            econ_params: Some(&econ),
            difficulty: &diff,
            player_era: num(&s["playerEra"]),
            player_zbadane: &zbadane,
            resolvers: AdvanceResolvers {
                owner_era: era.as_ref().map(|_| &era_f as &dyn Fn(i64) -> f64),
                owner_tech: None,
                owner_zloto_access: &zloto,
                owner_active_labels: None,
                owner_empire_stock: None,
            },
            // IGNOROWANE przez wariant `_with_map` (celowo puste: wariant ma liczyc sam)
            territory_resource_by_city: &empty_terr,
            worked_magazyn_by_city: &empty_worked,
        };
        let ctx = TerrainContext {
            map: &maps[s["mapIdx"].as_u64().unwrap() as usize],
            terrain_yields: &ty,
        };
        let (out, ti) = advance_city_economy_resources_with_map(&mut cities, &ctx, &input);
        let w = &s["out"];

        assert_values(
            &format!("{name} terr"),
            &terr_value(&ti.territory_resource_by_city),
            &w["terr"],
        );
        assert_values(
            &format!("{name} worked"),
            &worked_value(&ti.worked_magazyn_by_city),
            &w["worked"],
        );
        assert_values(
            &format!("{name} lost"),
            &lost_value(&ti.lost_to_sibling_by_city),
            &lost_expected(&w["lost"]),
        );
        for (i, c) in cities.iter().enumerate() {
            // reczne PO reconcile (kolejnosc wstawiania zachowana), a nie surowe wejscie
            let want = w["reczne"][i].clone();
            let want = if want.is_null() {
                Value::Null
            } else {
                Value::Array(
                    want.as_array()
                        .unwrap()
                        .iter()
                        .map(|p| json!([p[0], enc(num(&p[1]))]))
                        .collect(),
                )
            };
            assert_values(
                &format!("{name} reczne {}", c.id),
                &reczne_value(&c.okolica_reczne),
                &want,
            );
            if before[i] != c.okolica_reczne {
                n_reczne_cut += 1;
            }
        }
        for (c, wc) in cities.iter().zip(arr(w, "cities")) {
            let got = c
                .surowce
                .as_ref()
                .map(|m| Value::Object(m.iter().map(|(k, v)| (k.clone(), enc(*v))).collect()))
                .unwrap_or(Value::Null);
            assert_values(&format!("{name} surowce {}", c.id), &got, &wc["surowce"]);
        }
        for (v, wv) in out.per_city.iter().zip(arr(w, "perCity")) {
            let id = format!("{name} perCity {}", v.city_id);
            assert_eq!(v.city_id, text(&wv["id"]), "{id}");
            assert_eq!(v.ma_spichlerz, wv["maSpichlerz"].as_bool().unwrap(), "{id}");
            assert_eq!(
                v.ma_spichlerz_ii,
                wv["maSpichlerzII"].as_bool().unwrap(),
                "{id}"
            );
            assert_eq!(
                v.spichlerz_ceramika,
                wv["spichlerzCeramika"].as_bool().unwrap(),
                "{id}"
            );
            assert_eq!(
                v.spichlerz_sol,
                wv["spichlerzSol"].as_bool().unwrap(),
                "{id}"
            );
            assert_bits(
                &id,
                v.garncarnia_surplus_zadowolenie,
                num(&wv["garncarnia"]),
            );
        }
        n_terr += usize::from(!ti.territory_resource_by_city.is_empty());
        n_worked += usize::from(!ti.worked_magazyn_by_city.is_empty());
        n_lost += usize::from(!ti.lost_to_sibling_by_city.is_empty());
    }
    // pokrycie: scenariusze realnie ćwiczą wszystkie trzy wejścia i reconcile
    assert!(n_terr >= 400, "terr niepuste: {n_terr}");
    assert!(n_worked >= 400, "worked niepuste: {n_worked}");
    assert!(n_lost >= 250, "lost niepuste: {n_lost}");
    assert!(n_reczne_cut >= 20, "reconcile ucial: {n_reczne_cut}");
}

#[test]
fn direct_calls_with_fort_and_outpost_nodes_match_web() {
    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let ty = terrain_yields();
    let mut ordered = 0;
    for s in arr(&d, "direct") {
        let name = text(&s["name"]);
        let cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
        let map = &maps[s["mapIdx"].as_u64().unwrap() as usize];
        let mut city_nodes = city_nodes_tn(&cities);
        let mut fort_nodes: Vec<TerritoryNode> = Vec::new();
        for f in arr(s, "forts") {
            let mut node = CityNode::city(
                f["q"].as_i64().unwrap() as i32,
                f["r"].as_i64().unwrap() as i32,
                0.0,
            );
            if f["kind"] == "fort" {
                node.is_fort = Some(true);
            } else {
                node.is_outpost = Some(true);
            }
            let order = f.get("order").map(|o| TerritoryOrder {
                turn: o["turn"].as_i64().unwrap(),
                seq: o["seq"].as_i64().unwrap(),
            });
            ordered += usize::from(order.is_some());
            fort_nodes.push(TerritoryNode::with_order(
                node,
                f["owner"].as_i64().unwrap(),
                order,
            ));
        }
        let nodes: Vec<TerritoryNode> = if s["fortsFirst"].as_bool().unwrap() {
            fort_nodes.append(&mut city_nodes);
            fort_nodes
        } else {
            city_nodes.append(&mut fort_nodes);
            city_nodes
        };
        let era_tbl: BTreeMap<i64, f64> = s["eraTbl"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.parse().unwrap(), num(v)))
            .collect();
        let terr = compute_territory_resource_yield_by_city(&cities, map, &nodes, &|o| era_tbl[&o]);
        assert_values(
            &format!("{name} terr"),
            &terr_value(&terr),
            &s["out"]["terr"],
        );
        let ocs: Vec<_> = cities.iter().map(okolica_city_of).collect();
        let lost = civ_engine::domain::okolica::compute_lost_to_nearer_sibling_by_city(&ocs, map);
        assert_values(
            &format!("{name} lost"),
            &lost_value(&lost),
            &lost_expected(&s["out"]["lost"]),
        );
        let ctx = TerrainContext {
            map,
            terrain_yields: &ty,
        };
        let worked = compute_worked_magazyn_yields_by_city(&cities, &ctx, &nodes, &lost);
        assert_values(
            &format!("{name} worked"),
            &worked_value(&worked),
            &s["out"]["worked"],
        );
    }
    assert!(ordered >= 20, "forty z order: {ordered}");
}

#[test]
fn territory_resource_keys_all_mapped() {
    // `add_territory_amount` panikuje na kluczu spoza 9 `TerritoryResourceKey`: kazdy klucz z danych musi byc znany.
    let known: BTreeSet<&str> = [
        "drewno",
        "kamien",
        "glina",
        "ruda",
        "ruda_zelaza",
        "ruda_cyny",
        "sol",
        "zloto",
        "kon",
    ]
    .into_iter()
    .collect();
    let mut produced = 0;
    for key in [
        "tartak",
        "kamieniolom",
        "glinianka",
        "kopalnia_miedzi",
        "kopalnia_zelaza",
        "kopalnia_cyny",
        "warzelnia_soli",
        "stadnina",
        "kopalnia_zlota",
        "farma",
        "irygacja",
        "droga",
        "fort",
        "posterunek",
        "kopalnia",
        "bydlo",
        "wyrab",
    ] {
        if let Some(y) = territory_resource_yield_for_improvement(Some(key), None, Some(1.0)) {
            assert!(known.contains(y.resource_key.as_str()), "{key}");
            produced += 1;
        }
    }
    assert_eq!(produced, 9);
}

#[test]
fn adapters_map_state_city_fields() {
    let mut r = Reczne::new();
    r.set("5,5", 1.0);
    r.set("1,2", 2.0);
    let c = City {
        id: "x".into(),
        owner_id: 2,
        q: 4.0,
        r: -3.0,
        population: 6.5,
        okolica_focus: Some(OkolicaFocus::Produkcja),
        okolica_tryb: Some(OkolicaTryb::Reczny),
        okolica_reczne: Some(r.clone()),
        ..City::default()
    };
    let w = work_city_of(&c);
    assert_eq!((w.q, w.r, w.owner_id, w.population), (4, -3, 2, 6.5));
    let m = w.okolica_reczne.unwrap();
    assert_eq!(m.len(), 2);
    assert_eq!((m["5,5"], m["1,2"]), (1.0, 2.0));
    let o = okolica_city_of(&c);
    assert_eq!((o.q, o.r, o.owner_id), (4, -3, 2));
    assert_eq!(o.focus, Some(OkolicaFocus::Produkcja));
    assert_eq!(o.tryb, Some(OkolicaTryb::Reczny));
    assert_eq!(o.reczne, Some(r));
    assert_eq!(work_city_of(&City::default()).okolica_reczne, None);
}

/// Wariant `_with_map` przekazuje WSZYSTKIE resolvery do funkcji bazowej: porownanie z recznym zlozeniem
/// (`compute_terrain_inputs` + `advance_city_economy_resources` z tymi samymi, NIEPUSTYMI resolverami).
#[test]
fn with_map_forwards_all_resolvers_like_manual_composition() {
    use civ_engine::domain::building_costs::p6_7b::StockRecord;
    use civ_engine::domain::turn_economy_advance::advance_city_economy_resources;
    use civ_engine::domain::turn_economy_territory::compute_terrain_inputs;

    let d = data();
    let maps: Vec<BuildMap> = arr(&d, "maps").iter().map(build_map).collect();
    let ty = terrain_yields();
    let mut econ: Value = serde_json::from_str(ECON).expect("econ-params.json");
    // male, ROZNE per trudnosc capy panstwa: cap wiaze, a `difficulty`/`econ_params` maja wplyw na wynik
    for (diff, base) in [("easy", 150), ("normal", 250), ("hard", 350)] {
        econ["globalne"]["magazyn_baza_surowce"][diff] = json!(base);
        econ["globalne"]["magazyn_bonus_surowce_na_budynek"][diff] = json!(25);
    }
    let tech = |o: i64| -> BTreeSet<String> {
        if o != 0 {
            ["Waluta".to_owned()].into_iter().collect()
        } else {
            BTreeSet::new()
        }
    };
    let zloto = |o: i64| o != 2;
    let labels = |o: i64| -> Vec<String> {
        if o == 2 {
            vec!["x".to_owned()]
        } else {
            vec!["zloto".to_owned(), "drewno".to_owned(), "kamien".to_owned()]
        }
    };
    let stock = |o: i64| -> StockRecord {
        [
            ("zloto".to_owned(), 5.0 + o as f64),
            ("drewno".to_owned(), 40.0),
        ]
        .into_iter()
        .collect()
    };
    let era = |o: i64| 1.0 + o as f64;
    let mut mennica_seen = 0;
    for s in arr(&d, "scenarios").iter().take(200) {
        let name = text(&s["name"]);
        let base_cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
        let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
            .iter()
            .map(|c| (text(&c["id"]), strings(&c["built"])))
            .collect();
        mennica_seen += built
            .values()
            .filter(|b| b.iter().any(|x| x == "mennica"))
            .count();
        let diff = text(&s["difficulty"]);
        let zbadane: BTreeSet<String> = BTreeSet::new();
        let (et, ew) = (BTreeMap::new(), BTreeMap::new());
        macro_rules! mk {
            ($terr:expr, $worked:expr $(,)?) => {
                AdvanceCityEconomyInput {
                    built_by_city: &built,
                    econ_params: Some(&econ),
                    difficulty: &diff,
                    player_era: num(&s["playerEra"]),
                    player_zbadane: &zbadane,
                    resolvers: AdvanceResolvers {
                        owner_era: Some(&era),
                        owner_tech: Some(&tech),
                        owner_zloto_access: &zloto,
                        owner_active_labels: Some(&labels),
                        owner_empire_stock: Some(&stock),
                    },
                    territory_resource_by_city: $terr,
                    worked_magazyn_by_city: $worked,
                }
            };
        }
        let ctx = TerrainContext {
            map: &maps[s["mapIdx"].as_u64().unwrap() as usize],
            terrain_yields: &ty,
        };
        let mut a = base_cities.clone();
        let (out_a, ti_a) = advance_city_economy_resources_with_map(&mut a, &ctx, &mk!(&et, &ew));
        let mut b = base_cities.clone();
        let ti_b = compute_terrain_inputs(&mut b, &ctx, &era);
        let out_b = advance_city_economy_resources(
            &mut b,
            &mk!(
                &ti_b.territory_resource_by_city,
                &ti_b.worked_magazyn_by_city,
            ),
        );
        assert_eq!(ti_a, ti_b, "{name} terrain inputs");
        assert_eq!(out_a, out_b, "{name} outcome");
        assert_eq!(a, b, "{name} cities");
    }
    assert!(mennica_seen >= 10, "mennica w probie: {mennica_seen}");
}
