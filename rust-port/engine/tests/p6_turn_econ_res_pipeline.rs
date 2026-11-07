//! R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1 (pin weba 4bbef081d): pipeline zasobow per tura
//! (`turn-economy.ts: tickEmpireResourcePipeline`, `computeGarncarniaSurplusZadowolenieByOwner`,
//! `applyStolarniaDrewnoMapInflow`; `converters.ts: runConverter`, `converterThroughputForEra`).
//!
//! Wektory: `tests/p6_turn_econ_res_vectors/pipeline.json` z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1/gen-p6-turn-econ-res-vectors.mjs`).
//! Porownanie: `enc(rust) == wektor` (liczby bitowo; niecalkowite jako `~String(x)`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::building_costs::p6_7b::{
    SpichlerzCityBonusState, SpichlerzDrainParams, StockCity, StockCitySource, StockRecord,
};
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use civ_engine::domain::turn_economy_resources::{
    apply_stolarnia_drewno_map_inflow, compute_garncarnia_surplus_zadowolenie_by_owner,
    converter_output_multiplier_for_era, converter_throughput_for_era,
    run_city_economy_resource_phase, run_converter_with_output_multiplier,
    tick_empire_resource_pipeline, ConverterReason, EmpireResourceTickInput, ResourceTickResolvers,
    TerritoryResourceYield, WorkedMagazynYield, DEFAULT_CONVERTER_RECIPES,
};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_turn_econ_res_vectors/pipeline.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("pipeline.json")
}

fn recipe(id: &str) -> &'static civ_engine::domain::turn_economy_resources::ConverterRecipe {
    DEFAULT_CONVERTER_RECIPES
        .iter()
        .find(|r| r.id == id)
        .unwrap_or_else(|| panic!("brak receptury {id}"))
}

fn rec_of(v: &Value) -> StockRecord {
    v.as_object()
        .unwrap_or_else(|| panic!("nie obiekt: {v}"))
        .iter()
        .map(|(k, x)| (k.clone(), num(x)))
        .collect()
}

fn rec_enc(m: &StockRecord) -> Value {
    Value::Object(m.iter().map(|(k, x)| (k.clone(), enc(*x))).collect())
}

fn same(label: &str, got: &Value, want: &Value) {
    assert_values(label, got, want);
}

#[test]
fn recipes_match_web() {
    let d = data();
    let web = arr(&d, "recipes");
    assert_eq!(web.len(), DEFAULT_CONVERTER_RECIPES.len());
    for (i, w) in web.iter().enumerate() {
        let r = &DEFAULT_CONVERTER_RECIPES[i];
        assert_eq!(r.id, w["id"].as_str().unwrap(), "id #{i}");
        assert_eq!(r.building_id, w["buildingId"].as_str(), "building {}", r.id);
        assert_eq!(r.output, w["output"].as_str().unwrap(), "output {}", r.id);
        assert_eq!(r.output_amount, w["outputAmount"].as_f64().unwrap());
        assert_eq!(r.throughput_param_key, w["key"].as_str().unwrap());
        assert_eq!(r.throughput_fallback, w["fallback"].as_f64().unwrap());
        let inputs = w["inputs"].as_array().unwrap();
        assert_eq!(inputs.len(), r.inputs.len(), "inputs {}", r.id);
        for (j, pair) in inputs.iter().enumerate() {
            assert_eq!(r.inputs[j].0, pair[0].as_str().unwrap());
            assert_bits(
                &format!("{} {}", r.id, r.inputs[j].0),
                r.inputs[j].1,
                num(&pair[1]),
            );
        }
    }
}

#[test]
fn run_converter_matches_running_web() {
    let d = data();
    let cases = arr(&d, "convCases");
    assert!(cases.len() >= 4000);
    let mut reasons = BTreeSet::new();
    let mut produced_pos = 0;
    for (i, c) in cases.iter().enumerate() {
        let r = recipe(c["recipe"].as_str().unwrap());
        let stores = rec_of(&c["stores"]);
        let got = run_converter_with_output_multiplier(
            r,
            &stores,
            num(&c["tput"]),
            num(&c["outCap"]),
            num(&c["outMult"]),
        );
        let want = &c["out"];
        let reason = match got.reason {
            ConverterReason::Ok => "ok",
            ConverterReason::BrakWejscia => "brak-wejscia",
            ConverterReason::PelnyMagazyn => "pelny-magazyn",
            ConverterReason::ZeroPrzepustowosci => "zero-przepustowosci",
        };
        reasons.insert(reason);
        if got.produced > 0.0 {
            produced_pos += 1;
        }
        let got_v = json!({
            "produced": enc(got.produced), "cykle": enc(got.cykle),
            "consumed": rec_enc(&got.consumed), "stores": rec_enc(&got.stores), "reason": reason,
        });
        same(&format!("conv #{i} {}", c["recipe"]), &got_v, want);
    }
    assert_eq!(reasons.len(), 4, "pokryte powody: {reasons:?}");
    assert!(produced_pos > 100);
}

#[test]
fn throughput_for_era_and_stolarnia_inflow_match_web() {
    let d = data();
    for (i, c) in arr(&d, "eraCases").iter().enumerate() {
        let got = converter_throughput_for_era(
            c["id"].as_str().unwrap(),
            num(&c["base"]),
            num(&c["era"]),
        );
        same(&format!("era #{i}"), &enc(got), &c["out"]);
    }
    for (i, c) in arr(&d, "outMultCases").iter().enumerate() {
        let got = converter_output_multiplier_for_era(c["id"].as_str().unwrap(), num(&c["era"]));
        same(&format!("outMult #{i}"), &enc(got), &c["out"]);
    }
    for (i, c) in arr(&d, "inflowCases").iter().enumerate() {
        let got =
            apply_stolarnia_drewno_map_inflow(num(&c["base"]), num(&c["n"]), num(&c["bonus"]));
        same(&format!("inflow #{i}"), &enc(got), &c["out"]);
    }
}

struct Prepared {
    built: BTreeMap<String, Vec<String>>,
    terr: BTreeMap<String, TerritoryResourceYield>,
    worked: BTreeMap<String, WorkedMagazynYield>,
    stol: BTreeMap<i64, f64>,
    kam: BTreeMap<i64, f64>,
    thr: BTreeMap<i64, BTreeMap<String, f64>>,
    cap: BTreeMap<i64, f64>,
    labels: Option<BTreeMap<i64, Vec<String>>>,
    zloto: Option<BTreeMap<i64, bool>>,
    drain: SpichlerzDrainParams,
    stol_bonus: f64,
    kam_bonus: f64,
}

fn opt(v: &Value, k: &str) -> Option<f64> {
    v.get(k).map(num)
}

fn prepare(s: &Value) -> Prepared {
    let by_owner = |v: &Value| -> BTreeMap<i64, f64> {
        v.as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.parse().unwrap(), num(x)))
            .collect()
    };
    Prepared {
        built: s["built"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), strings(v)))
            .collect(),
        terr: s["terr"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    TerritoryResourceYield {
                        drewno: opt(v, "drewno"),
                        kamien: opt(v, "kamien"),
                        glina: opt(v, "glina"),
                        ruda: opt(v, "ruda"),
                        ruda_zelaza: opt(v, "ruda_zelaza"),
                        ruda_cyny: opt(v, "ruda_cyny"),
                        sol: opt(v, "sol"),
                        zloto: opt(v, "zloto"),
                        kon: opt(v, "kon"),
                    },
                )
            })
            .collect(),
        worked: s["worked"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    WorkedMagazynYield {
                        drewno: num(&v["drewno"]),
                        kamien: num(&v["kamien"]),
                        glina: num(&v["glina"]),
                    },
                )
            })
            .collect(),
        stol: by_owner(&s["stol"]),
        kam: by_owner(&s["kam"]),
        thr: s["throughputs"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.parse().unwrap(), rec_of(v).into_iter().collect()))
            .collect(),
        cap: by_owner(&s["cap"]),
        labels: s["labels"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse().unwrap(), strings(v)))
                .collect()
        }),
        zloto: s["zloto"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse().unwrap(), v.as_bool().unwrap()))
                .collect()
        }),
        drain: SpichlerzDrainParams {
            ceramika_i: num(&s["drain"]["ceramikaI"]),
            ceramika_ii: num(&s["drain"]["ceramikaII"]),
            sol_ii: num(&s["drain"]["solII"]),
        },
        stol_bonus: num(&s["stolBonus"]),
        kam_bonus: num(&s["kamBonus"]),
    }
}

fn stock_cities(s: &Value) -> Vec<StockCity> {
    arr(s, "cities")
        .iter()
        .map(|c| StockCity {
            id: c["id"].as_str().unwrap().to_owned(),
            owner_id: c["owner"].as_i64().unwrap(),
            surowce: if c["surowce"].is_null() {
                None
            } else {
                Some(rec_of(&c["surowce"]))
            },
        })
        .collect()
}

fn real_cities(s: &Value) -> Vec<City> {
    stock_cities(s)
        .into_iter()
        .map(|c| City {
            id: c.id,
            owner_id: c.owner_id,
            surowce: c.surowce,
            ..City::default()
        })
        .collect()
}

struct Observed {
    cities: Vec<(String, Option<StockRecord>)>,
    spichlerz: BTreeMap<String, SpichlerzCityBonusState>,
    sol_army: BTreeSet<i64>,
    sol_cities: BTreeMap<i64, BTreeSet<String>>,
    garn_pre: BTreeMap<i64, f64>,
    garn_true: BTreeMap<i64, f64>,
    garn_false_post: BTreeMap<i64, f64>,
}

/// Przebieg jak `advanceCityEconomy` `:2476-2500` (przez PRODUKCYJNEGO wolajacego) + trzy odczyty Garncarni
/// jak w generatorze (przed ticku `false`, po ticku `true` i `false`).
fn run_rust<T: StockCitySource>(cities: &mut [T], p: &Prepared) -> Observed {
    let garn_pre =
        compute_garncarnia_surplus_zadowolenie_by_owner(cities, &p.built, false, &p.drain);
    let thr = |o: i64| p.thr.get(&o).cloned().unwrap_or_default();
    let cap = |o: i64| p.cap[&o];
    let labels = |o: i64| p.labels.as_ref().unwrap()[&o].clone();
    let zloto = |o: i64| p.zloto.as_ref().unwrap()[&o];
    let input = EmpireResourceTickInput {
        built_by_city: &p.built,
        territory_resource_by_city: &p.terr,
        worked_magazyn_by_city: &p.worked,
        stolarnia_count_by_owner: &p.stol,
        kamieniarski_count_by_owner: &p.kam,
        stolarnia_bonus_drewna_civ: p.stol_bonus,
        kamieniarski_bonus_kamienia_civ: p.kam_bonus,
        converter_throughputs_for_owner: &thr,
        owner_resource_cap_for: &cap,
        resolvers: ResourceTickResolvers {
            owner_active_labels: if p.labels.is_some() {
                Some(&labels)
            } else {
                None
            },
            owner_zloto_access: if p.zloto.is_some() {
                Some(&zloto)
            } else {
                None
            },
        },
        // celowo zly: faza produkcyjna nadpisuje to wynikiem `load_spichlerz_drain_params`
        spichlerz_drain_params: SpichlerzDrainParams {
            ceramika_i: -1.0,
            ceramika_ii: -1.0,
            sol_ii: -1.0,
        },
    };
    // econ_params z trzema kluczami = wektorowe stawki (jak `loadSpichlerzDrainParams` z JSON weba).
    let econ = json!({"budynki": {
        "budynek_spichlerz_zuzywa_ceramika": {"normal": p.drain.ceramika_i},
        "budynek_spichlerz_ii_zuzywa_ceramika": {"normal": p.drain.ceramika_ii},
        "budynek_spichlerz_ii_zuzywa_sol": {"normal": p.drain.sol_ii},
    }});
    let out = run_city_economy_resource_phase(cities, input, Some(&econ), "normal");
    assert_eq!(out.drain_params, p.drain, "load_spichlerz_drain_params");
    let garn_false_post =
        compute_garncarnia_surplus_zadowolenie_by_owner(cities, &p.built, false, &p.drain);
    Observed {
        cities: cities
            .iter()
            .map(|c| (c.id().to_owned(), c.surowce().cloned()))
            .collect(),
        spichlerz: out.tick.spichlerz_by_city,
        sol_army: out.tick.sol_army_by_owner,
        sol_cities: out.tick.sol_city_ids_by_owner,
        garn_pre,
        garn_true: out.garncarnia_surplus_zadowolenie_by_owner,
        garn_false_post,
    }
}

fn compare(label: &str, s: &Value, o: &Observed) {
    let want = &s["out"];
    let cities: Vec<Value> = o
        .cities
        .iter()
        .map(|(id, sur)| json!({"id": id, "surowce": sur.as_ref().map(rec_enc)}))
        .collect();
    same(
        &format!("{label} cities"),
        &Value::Array(cities),
        &want["cities"],
    );
    let sp: serde_json::Map<String, Value> = o
        .spichlerz
        .iter()
        .map(|(k, v)| {
            (
                k.clone(),
                json!({
                    "ceramikaActive": v.ceramika_active, "solActive": v.sol_active,
                    "maSpichlerzPop": v.ma_spichlerz_pop, "maSpichlerzIIPop": v.ma_spichlerz_ii_pop,
                }),
            )
        })
        .collect();
    same(
        &format!("{label} spichlerz"),
        &Value::Object(sp),
        &want["spichlerz"],
    );
    // mapy Soli: kontrakt `:1800-1805` = z `solActive`
    let web_sol: BTreeSet<String> = want["spichlerz"]
        .as_object()
        .unwrap()
        .iter()
        .filter(|(_, v)| v["solActive"] == json!(true))
        .map(|(k, _)| k.clone())
        .collect();
    let got_sol: BTreeSet<String> = o.sol_cities.values().flatten().cloned().collect();
    assert_eq!(got_sol, web_sol, "{label} sol cities");
    let owners_of_sol: BTreeSet<i64> = s["cities"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|c| web_sol.contains(c["id"].as_str().unwrap()))
        .map(|c| c["owner"].as_i64().unwrap())
        .collect();
    assert_eq!(o.sol_army, owners_of_sol, "{label} sol army");
    let gm = |m: &BTreeMap<i64, f64>| -> Value {
        Value::Object(m.iter().map(|(k, v)| (k.to_string(), enc(*v))).collect())
    };
    same(
        &format!("{label} garnPre"),
        &gm(&o.garn_pre),
        &want["garnPre"],
    );
    same(
        &format!("{label} garnTrue"),
        &gm(&o.garn_true),
        &want["garnTrue"],
    );
    same(
        &format!("{label} garnFalsePost"),
        &gm(&o.garn_false_post),
        &want["garnFalsePost"],
    );
}

#[test]
fn pipeline_matches_running_web_stock_city() {
    let d = data();
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 450);
    let (mut sol_active, mut pop_ii, mut pop_i, mut unpaid, mut garn_one) = (0, 0, 0, 0, 0);
    for s in scenarios {
        let p = prepare(s);
        let mut cities = stock_cities(s);
        let o = run_rust(&mut cities, &p);
        compare(s["name"].as_str().unwrap(), s, &o);
        for st in o.spichlerz.values() {
            sol_active += st.sol_active as u32;
            pop_ii += st.ma_spichlerz_ii_pop as u32;
            pop_i += st.ma_spichlerz_pop as u32;
        }
        unpaid += o
            .spichlerz
            .values()
            .filter(|st| !st.ceramika_active && !st.ma_spichlerz_pop)
            .count();
        garn_one += o.garn_true.values().filter(|v| **v == 1.0).count();
    }
    // pokrycie: wszystkie galezie stanu Spichlerza i bonus Garncarni wystapily w wektorach
    assert!(
        sol_active > 10 && pop_ii > 10 && pop_i > 10 && unpaid > 50 && garn_one > 10,
        "pokrycie {sol_active} {pop_ii} {pop_i} {unpaid} {garn_one}"
    );
}

/// PRODUKCYJNY typ miasta silnika (`state::City`): te same wektory, ten sam wynik co `StockCity`.
#[test]
fn pipeline_matches_running_web_engine_city() {
    let d = data();
    for s in arr(&d, "scenarios") {
        let p = prepare(s);
        let mut cities = real_cities(s);
        let o = run_rust(&mut cities, &p);
        compare(s["name"].as_str().unwrap(), s, &o);
    }
}

/// Bezposredni test niskiego poziomu: `tick_empire_resource_pipeline` z jawnie podanymi parametrami
/// drenazu (bez `run_city_economy_resource_phase`) - brzegi N-1/N/N+1 i stan "brak surowca -> brak bonusow".
#[test]
fn tick_direct_edges_n_minus_1_n_plus_1() {
    let built: BTreeMap<String, Vec<String>> = [("s".to_owned(), vec!["spichlerz".to_owned()])]
        .into_iter()
        .collect();
    for (stock, paid) in [(24.0, false), (25.0, true), (26.0, true)] {
        let mut cities = vec![StockCity {
            id: "s".into(),
            owner_id: 1,
            surowce: Some([("ceramika".to_owned(), stock)].into_iter().collect()),
        }];
        let empty_t = BTreeMap::new();
        let empty_w = BTreeMap::new();
        let empty_n = BTreeMap::new();
        let thr = |_o: i64| BTreeMap::new();
        let cap = |_o: i64| 1000.0;
        let out = tick_empire_resource_pipeline(
            &mut cities,
            &EmpireResourceTickInput {
                built_by_city: &built,
                territory_resource_by_city: &empty_t,
                worked_magazyn_by_city: &empty_w,
                stolarnia_count_by_owner: &empty_n,
                kamieniarski_count_by_owner: &empty_n,
                stolarnia_bonus_drewna_civ: 0.1,
                kamieniarski_bonus_kamienia_civ: 0.1,
                converter_throughputs_for_owner: &thr,
                owner_resource_cap_for: &cap,
                resolvers: ResourceTickResolvers {
                    owner_active_labels: None,
                    owner_zloto_access: None,
                },
                spichlerz_drain_params: SpichlerzDrainParams::FALLBACK,
            },
        );
        let st = out.spichlerz_by_city["s"];
        assert_eq!(st.ceramika_active, paid, "stock {stock}");
        assert_eq!(
            st.ma_spichlerz_pop, paid,
            "brak surowca => brak bonusu ludnosci (stock {stock})"
        );
        let left = cities[0]
            .surowce
            .as_ref()
            .unwrap()
            .get("ceramika")
            .copied()
            .unwrap_or(0.0);
        assert_eq!(left, if paid { stock - 25.0 } else { stock });
    }
}

/// Zarzut Evaluatora R1 nr 2: `converter_throughputs_for_era` (web `turn-economy.ts:1428-1435`) ma wlasny test.
/// Kazda receptura: `loadThroughput` z `raw` (tu 50 dla wszystkich kluczy) + skalowanie epoka; oczekiwanie
/// z wektorow `eraCases` z URUCHOMIONEGO weba (receptury spoza wektorow = nieskalowane jak `nieznany`).
#[test]
fn converter_throughputs_for_era_match_web_vectors() {
    use civ_engine::domain::turn_economy_resources::converter_throughputs_for_era;
    let d = data();
    let raw = json!({"budynki": {
        "budynek_cegielnia_przepustowosc": {"normalny": 50},
        "budynek_garncarnia_przepustowosc": {"normalny": 50},
        "budynek_huta_przepustowosc": {"normalny": 50},
        "budynek_odlewnia_zelaza_przepustowosc": {"normalny": 50},
        "budynek_wielka_odlewnia_przepustowosc": {"normalny": 50},
    }});
    let cases = arr(&d, "eraCases");
    let covered = [
        "cegielnia",
        "garncarnia",
        "huta",
        "odlewnia_brazu",
        "odlewnia_zelaza__braz",
        "odlewnia_zelaza__zelazo",
        "wielka_odlewnia__braz",
        "wielka_odlewnia__zelazo",
        "wielka_odlewnia__stal",
    ];
    let mut scaled_checked = 0;
    let mut out_mult_checked = 0;
    for era_case in cases
        .iter()
        .filter(|c| c["id"] == "cegielnia" && num(&c["base"]) == 50.0)
    {
        let era = num(&era_case["era"]);
        let got = converter_throughputs_for_era(&raw, "normalny", era);
        let has_out_mult = got.contains_key("cegielnia#outMult");
        // Web `converterThroughputsForEra`: klucz `<id>#outMult` tylko gdy mnoznik != 1 (tu: cegielnia).
        assert_eq!(
            got.len(),
            DEFAULT_CONVERTER_RECIPES.len() + usize::from(has_out_mult)
        );
        assert_eq!(
            has_out_mult,
            era.is_finite() && era >= 2.0,
            "outMult @{era}"
        );
        for r in DEFAULT_CONVERTER_RECIPES.iter() {
            let lookup = if covered.contains(&r.id) {
                r.id
            } else {
                "nieznany"
            };
            let want = cases
                .iter()
                .find(|c| {
                    c["id"] == lookup && num(&c["base"]) == 50.0 && c["era"] == era_case["era"]
                })
                .unwrap_or_else(|| panic!("brak wektora {lookup}/{era}"));
            same(
                &format!("throughputs_for_era {}@{}", r.id, era),
                &enc(got[r.id]),
                &want["out"],
            );
            // Od REPIN-EKONOMIA-F: tylko Garncarnia skaluje cykle +10%; Cegielnia/Huta plaskie;
            // odlewnie x m(e).
            if r.id == "garncarnia" && era > 1.0 && era.is_finite() {
                assert!(got[r.id] > 50.0, "skalowanie epoka {} {}", r.id, era);
                scaled_checked += 1;
            }
            if r.id == "cegielnia" || r.id == "huta" {
                assert_eq!(got[r.id], 50.0, "plaska {} @{}", r.id, era);
            }
            if r.id == "odlewnia_brazu" && era.is_finite() && era >= 2.0 {
                assert_eq!(got[r.id], 50.0 * (1.0 + 0.5 * (era.floor() - 1.0)));
                out_mult_checked += 1;
            }
        }
        if has_out_mult {
            assert_eq!(got["cegielnia#outMult"], 1.0 + 0.5 * (era.floor() - 1.0));
        }
    }
    assert_eq!(scaled_checked, 9, "era >1 skonczone x garncarnia");
    assert_eq!(out_mult_checked, 7, "era >= 2 skonczone x odlewnia_brazu");
    // brak wpisu w raw -> fallback receptury (nie 50)
    let fb = converter_throughputs_for_era(&json!({}), "normalny", 1.0);
    for r in DEFAULT_CONVERTER_RECIPES.iter() {
        assert_eq!(fb[r.id], r.throughput_fallback, "fallback {}", r.id);
    }
}

/// Zarzut Evaluatora R1 nr 6: `ceramika_happiness_bonus` jako publiczne API, brzeg `> 0` (M23 zabijalny przez API).
#[test]
fn ceramika_happiness_bonus_public_edges() {
    use civ_engine::domain::turn_economy_resources::ceramika_happiness_bonus;
    assert_eq!(ceramika_happiness_bonus(0.0, true), 0.0);
    assert_eq!(ceramika_happiness_bonus(1.0, true), 1.0);
    assert_eq!(ceramika_happiness_bonus(0.5, true), 1.0);
    assert_eq!(ceramika_happiness_bonus(-1.0, true), 0.0);
    assert_eq!(ceramika_happiness_bonus(f64::NAN, true), 0.0);
    assert_eq!(ceramika_happiness_bonus(f64::INFINITY, true), 0.0);
    assert_eq!(ceramika_happiness_bonus(5.0, false), 0.0);
}
