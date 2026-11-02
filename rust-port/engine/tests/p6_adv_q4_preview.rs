//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1 (dlug -Q4b, pin weba 4bbef081d): `simulateResourcePipelineForPreview`
//! (`turn-economy.ts:1389-1560`) -> `simulate_resource_pipeline_for_preview`. Wektory z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1/gen-p6-adv-q4b-preview-vectors.mjs`):
//! 642 scenariusze petli Q4 (wejscia w `q4.json`, wyniki podgladu w `q4b.json`.`base`) + 270 scenariuszy `prev`
//! (brzegi Spichlerza/Soli/Ceramiki N-1/N/N+1, wejscia i wyniki w `q4b.json`.`extra`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::terrain_map::{parse_terrain_yields, TerrainYieldsFile};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{City, OkolicaFocus, OkolicaTryb};
use civ_engine::domain::turn_economy_advance::{AdvanceCityEconomyInput, AdvanceResolvers};
use civ_engine::domain::turn_economy_preview::simulate_resource_pipeline_for_preview;
use civ_engine::domain::turn_economy_territory::TerrainContext;
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_adv_q4_vectors/q4.json");
const PREVIEW: &str = include_str!("p6_adv_q4_vectors/q4b.json");
const ECON: &str = include_str!("../data/econ-params.json");

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
    BuildMap::new(hexes, Vec::new())
}

/// Tylko pola wplywajace na podglad (id, wlasciciel, pozycja, populacja, surowce, tryb okolicy).
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
        okolica_tryb: c["tryb"]
            .as_str()
            .map(|s| OkolicaTryb::from_web(s).expect("tryb")),
        okolica_focus: c["focus"]
            .as_str()
            .map(|s| OkolicaFocus::from_web(s).expect("focus")),
        ..City::default()
    }
}

fn owner_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<i64, T> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.parse::<i64>().unwrap(), f(x)))
        .collect()
}

#[derive(Default)]
struct Cover {
    scen: usize,
    cities: usize,
    ceramika_active: usize,
    sol_active: usize,
    pop_i: usize,
    pop_ii: usize,
    inactive_with_spichlerz: usize,
    gate: usize,
    nonzero_ceramika: usize,
}

fn check(
    s: &Value,
    want: &Value,
    maps: &[BuildMap],
    maps_b: &[BuildMap],
    ty: &TerrainYieldsFile,
    cov: &mut Cover,
) {
    let name = text(&s["name"]);
    let cities: Vec<City> = arr(s, "cities").iter().map(city_of).collect();
    let before = cities.clone();
    let built: BTreeMap<String, Vec<String>> = arr(s, "cities")
        .iter()
        .map(|c| (text(&c["id"]), strings(&c["built"])))
        .collect();
    let om = &s["om"];
    let era: Option<BTreeMap<i64, f64>> = om["era"].as_object().map(|_| owner_map(&om["era"], num));
    let era_f = |o: i64| era.as_ref().unwrap()[&o];
    let zloto_map: BTreeMap<i64, bool> = owner_map(&om["zloto"], |v| v.as_bool().unwrap());
    let zloto = |o: i64| zloto_map.get(&o).copied().unwrap_or(true);
    let gate_labels: Option<BTreeMap<i64, Vec<String>>> = om["gate"]
        .as_object()
        .map(|g| owner_map(&g["labels"], strings));
    let labels_f = |o: i64| {
        gate_labels
            .as_ref()
            .unwrap()
            .get(&o)
            .cloned()
            .unwrap_or_default()
    };
    let gate_stock: Option<BTreeMap<i64, BTreeMap<String, f64>>> =
        om["gate"].as_object().map(|g| {
            owner_map(&g["stock"], |v| {
                v.as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, x)| (k.clone(), num(x)))
                    .collect()
            })
        });
    let stock_f = |o: i64| gate_stock.as_ref().unwrap()[&o].clone();
    let zbadane: BTreeSet<String> = strings(&om["zbadane"]).into_iter().collect();
    let diff = text(&s["difficulty"]);
    let mut econ: Value = match &s["econ"] {
        Value::Null => serde_json::from_str(ECON).expect("econ-params.json"),
        e => e.clone(),
    };
    // `prevres`: maly cap magazynu (web: econ.globalne.magazyn_baza_surowce = capOverride dla easy/normal/hard).
    if let Some(c) = s.get("capOverride").filter(|c| !c.is_null()) {
        for d in ["easy", "normal", "hard"] {
            econ["globalne"]["magazyn_baza_surowce"][d] = c.clone();
            econ["globalne"]["magazyn_bonus_surowce_na_budynek"][d] = serde_json::json!(1);
        }
    }
    // `prevt`: wlasne wartosci econ per trudnosc: [grupa, klucz, [easy, normal, hard]].
    if let Some(patch) = s.get("econPatch").and_then(Value::as_array) {
        for p in patch {
            let (g, k) = (p[0].as_str().unwrap(), p[1].as_str().unwrap());
            for (i, d) in ["easy", "normal", "hard"].into_iter().enumerate() {
                econ[g][k][d] = p[2][i].clone();
            }
        }
    }
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
            owner_active_labels: gate_labels
                .as_ref()
                .map(|_| &labels_f as &dyn Fn(i64) -> Vec<String>),
            owner_empire_stock: gate_stock
                .as_ref()
                .map(|_| &stock_f as &dyn Fn(i64) -> BTreeMap<String, f64>),
        },
        territory_resource_by_city: &empty_terr,
        worked_magazyn_by_city: &empty_worked,
    };
    let idx = s["mapIdx"].as_u64().unwrap() as usize;
    let ctx = TerrainContext {
        map: if idx >= 100 {
            &maps_b[idx - 100]
        } else {
            &maps[idx]
        },
        terrain_yields: ty,
    };
    let got = simulate_resource_pipeline_for_preview(&cities, &ctx, None, &input);

    // Podglad jest tylko do odczytu.
    assert_eq!(cities, before, "{name}: podglad zmutowal miasta");

    let sp = want["sp"].as_object().unwrap();
    assert_eq!(
        got.spichlerz_by_city.len(),
        sp.len(),
        "{name}: liczba miast"
    );
    for (id, w) in sp {
        let g = got
            .spichlerz_by_city
            .get(id)
            .unwrap_or_else(|| panic!("{name}: brak miasta {id}"));
        let w = w.as_array().unwrap();
        let b = |i: usize| w[i].as_bool().unwrap();
        assert_eq!(g.ceramika_active, b(0), "{name} {id} ceramika_active");
        assert_eq!(g.sol_active, b(1), "{name} {id} sol_active");
        assert_eq!(g.ma_spichlerz_pop, b(2), "{name} {id} ma_spichlerz_pop");
        assert_eq!(
            g.ma_spichlerz_ii_pop,
            b(3),
            "{name} {id} ma_spichlerz_ii_pop"
        );
        cov.cities += 1;
        cov.ceramika_active += usize::from(g.ceramika_active);
        cov.sol_active += usize::from(g.sol_active);
        cov.pop_i += usize::from(g.ma_spichlerz_pop);
        cov.pop_ii += usize::from(g.ma_spichlerz_ii_pop);
        let has_sp = built[id.as_str()]
            .iter()
            .any(|b| b.starts_with("spichlerz"));
        cov.inactive_with_spichlerz += usize::from(has_sp && !g.ceramika_active);
    }
    let cer = want["cer"].as_object().unwrap();
    assert_eq!(
        got.ceramika_by_owner.len(),
        cer.len(),
        "{name}: liczba wlascicieli"
    );
    for (o, w) in cer {
        let g = got.ceramika_by_owner[&o.parse::<i64>().unwrap()];
        assert_bits(&format!("{name} ceramika owner {o}"), g, num(w));
        cov.nonzero_ceramika += usize::from(g != 0.0);
    }
    cov.scen += 1;
    cov.gate += usize::from(om["gate"].is_object());
}

#[test]
fn preview_pipeline_matches_running_web() {
    let q4: Value = serde_json::from_str(VECTORS).expect("q4.json");
    let q4b: Value = serde_json::from_str(PREVIEW).expect("q4b.json");
    let maps: Vec<BuildMap> = arr(&q4, "maps").iter().map(build_map).collect();
    let maps_b: Vec<BuildMap> = arr(&q4b, "maps").iter().map(build_map).collect();
    let ty: TerrainYieldsFile = parse_terrain_yields().expect("terrain-yields.json");

    let mut cov = Cover::default();
    let base = q4b["base"].as_object().unwrap();
    let scenarios = arr(&q4, "scenarios");
    assert_eq!(base.len(), scenarios.len());
    for s in scenarios {
        let name = text(&s["name"]);
        check(s, &base[&name], &maps, &[], &ty, &mut cov);
    }
    let n_base = cov.scen;
    assert!(n_base >= 600, "scenariuszy bazowych {n_base}");
    for s in arr(&q4b, "extra") {
        check(s, &s["prev"], &maps, &maps_b, &ty, &mut cov);
    }
    assert_eq!(cov.scen - n_base, arr(&q4b, "extra").len());
    assert!(
        cov.scen - n_base >= 900,
        "scenariuszy prev {}",
        cov.scen - n_base
    );
    // Pokrycie: wszystkie cztery stany Spichlerza, bramka runtime, nieaktywny Spichlerz, niezerowa Ceramika.
    assert!(cov.ceramika_active > 200, "{}", cov.ceramika_active);
    assert!(cov.sol_active > 100, "{}", cov.sol_active);
    assert!(cov.pop_i > 100 && cov.pop_ii > 100);
    assert!(cov.inactive_with_spichlerz > 20);
    assert!(cov.gate >= 70);
    assert!(cov.nonzero_ceramika > 100);
}
