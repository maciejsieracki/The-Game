//! P6.7A - `applyPostCentralPopulationGrowth` / `applyCentralFoodPopulationGrowth` (population-growth-v85.ts)
//! oraz `refreshManpowerAfterPopChange` (wywolywana w tym przeplywie; port z P6.5B).
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_7a_vectors/post_central.json` i `manpower.json`.
//!
//! Zaleznosci spoza zakresu wstrzykiwane przez `PopulationChangeHooks`: `rebalanceWorkersAfterPopulationChange`
//! (okolica.ts) i `onCityPopulationChanged`. Rejestrator wywolan sprawdza KOLEJNOSC, argumenty i zbior
//! wykluczonych heksow; efekt prawdziwego `rebalance...` (tryb `reczny`) nie jest tu mierzony (RUNDA-2 / okolica.ts).

#[path = "p6_7a_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::city_growth::p6_7a::empire_food::EmpireFoodTickResult;
use civ_engine::domain::city_growth::p6_7a::growth_v85::{
    PopulationChangeHooks, PostCentralGrowthOpts,
};
use civ_engine::domain::city_growth::p6_7a::{
    apply_central_food_population_growth, apply_post_central_population_growth,
    game_difficulty_from_web, GameDifficulty, GrowthCity, PopCapParams, PopulationMatrixResolved,
    RationParams,
};
use civ_engine::domain::recruitment::manpower::{
    refresh_manpower_after_pop_change, CivBonusPoborLite, ManpowerCity,
};
use common::*;
use serde_json::{json, Value};

#[derive(Default)]
struct Recorder {
    rebalance: Vec<(String, f64, f64, Option<BTreeSet<String>>)>,
    changed: Vec<String>,
}

impl PopulationChangeHooks for Recorder {
    fn rebalance_workers_after_population_change(
        &mut self,
        city: &mut GrowthCity,
        pop_before: f64,
        pop_after: f64,
        exclude_hex_keys: Option<&BTreeSet<String>>,
    ) {
        self.rebalance.push((
            city.city.id.clone(),
            pop_before,
            pop_after,
            exclude_hex_keys.cloned(),
        ));
    }

    fn on_city_population_changed(&mut self, city_id: &str) {
        self.changed.push(city_id.to_string());
    }
}

fn id_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<i64, T> {
    pairs(v)
        .into_iter()
        .map(|(k, x)| (k.as_i64().expect("owner"), f(&x)))
        .collect()
}

#[test]
fn post_central_growth_matches_web() {
    let data = load("post_central.json");
    let ration: RationParams =
        civ_engine::domain::city_growth::p6_7a::growth_v85::build_ration_params(
            &json!({}),
            GameDifficulty::Normal,
        );
    // `scenarios` z post_central.json + przypadki graniczne z edge.json (brak wpisow `fedByCityId`;
    // runda 2: `postCentralSiege` - miasta oblezone po zlozeniu migawki centrali)
    let edge = load("edge.json");
    let cases = arr(&data, "scenarios")
        .iter()
        .chain(arr(&edge, "postCentral"))
        .chain(arr(&edge, "postCentralSiege"));
    for (i, sc) in cases.enumerate() {
        let mut cities: Vec<GrowthCity> = arr(sc, "cities").iter().map(growth_city).collect();
        let before: BTreeMap<String, f64> = cities
            .iter()
            .map(|c| (c.city.id.clone(), c.city.population))
            .collect();
        let mut econ_state = econ(&sc["econ"]);
        let mut ef = EmpireFoodTickResult {
            per_owner: arr(sc, "ef").iter().map(ef_tick_from).collect(),
        };

        let owner_civ: BTreeMap<i64, String> = id_map(&sc["ownerCiv"], text);
        let happiness: BTreeMap<String, f64> = f64_map(&sc["happiness"]).expect("happiness");
        let era: BTreeMap<i64, f64> = id_map(&sc["eraByOwner"], num);
        let matrix_by_owner: BTreeMap<i64, PopulationMatrixResolved> =
            id_map(&sc["matrixByOwner"], matrix);
        let civ_bonusy: BTreeMap<i64, Vec<CivBonusPoborLite>> = id_map(&sc["civBonusy"], |list| {
            list.as_array()
                .expect("lista")
                .iter()
                .map(|b| CivBonusPoborLite {
                    typ: opt_text(&b["typ"]),
                    wartosc: js_num(&b["wartosc"]),
                })
                .collect()
        });
        let citizen: BTreeMap<String, f64> = f64_map(&sc["citizenGrowth"]).expect("citizen");
        let exclude: BTreeMap<String, BTreeSet<String>> = pairs(&sc["exclude"])
            .into_iter()
            .map(|(k, keys)| (text(&k), strings(&keys).into_iter().collect()))
            .collect();
        let spichlerz = spichlerz_map(&sc["spichlerz"]);
        let built = built_map(&sc["built"]);
        let d = game_difficulty_from_web(sc["d"].as_str().expect("d")).expect("trudnosc");
        let opts = PostCentralGrowthOpts {
            pop_cap_params: PopCapParams {
                akwedukt_prog_ludnosci: num(&sc["econParams"]["akweduktProgLudnosci"]),
                spichlerz_prog_ludnosci: num(&sc["econParams"]["spichlerzProgLudnosci"]),
                akwedukt_max_ludnosci: num(&sc["econParams"]["akweduktMaxLudnosci"]),
            },
            ration_params: ration,
            owner_civ_by_owner_id: Some(&owner_civ),
            spichlerz_by_city: spichlerz.as_ref(),
            happiness_by_city_id: Some(&happiness),
            built_by_city: built.as_ref(),
            owner_era_by_owner: Some(&era),
            difficulty: Some(d),
            population_matrix_by_owner_id: Some(&matrix_by_owner),
            civ_bonusy_by_owner: Some(&civ_bonusy),
            citizen_growth_pct_by_city_id: Some(&citizen),
            exclude_hex_keys_by_city: Some(&exclude),
        };
        let mut rec = Recorder::default();
        match sc["via"].as_str().expect("via") {
            "central2" => apply_central_food_population_growth(
                &mut ef,
                &mut cities,
                &mut econ_state,
                &opts,
                &mut rec,
            ),
            _ => apply_post_central_population_growth(
                &mut cities,
                &mut econ_state,
                &mut ef.per_owner,
                &opts,
                &mut rec,
            ),
        }

        let want = &sc["out"];
        assert_values(
            &format!("cities[{i}]"),
            &Value::Array(cities.iter().map(growth_city_full_value).collect()),
            &Value::Array(
                arr(want, "cities")
                    .iter()
                    .map(|c| {
                        // z wyjscia weba wybieramy te same pola, ktore modeluje Rust
                        let mut o = serde_json::Map::new();
                        for k in [
                            "id",
                            "poziomRacji",
                            "rationMigratedV114",
                            "wzrostUlamkowy",
                            "turyBezDoplaty",
                            "hungerLossUlamkowy",
                            "population",
                            "manpower",
                        ] {
                            if let Some(x) = c.get(k) {
                                o.insert(k.to_string(), x.clone());
                            }
                        }
                        Value::Object(o)
                    })
                    .collect(),
            ),
        );
        assert_values(
            &format!("econ[{i}]"),
            &econ_value(&econ_state),
            &want["econ"],
        );
        assert_values(
            &format!("ef[{i}]"),
            &Value::Array(ef.per_owner.iter().map(ef_tick_value).collect()),
            &want["efPerOwner"],
        );

        // wywolania hookow: kolejnosc i argumenty
        let web_calls: Vec<String> = strings(&want["calls"]);
        assert_eq!(rec.changed, web_calls, "onCityPopulationChanged[{i}]");
        let rebalance_ids: Vec<String> = rec.rebalance.iter().map(|r| r.0.clone()).collect();
        assert_eq!(rebalance_ids, web_calls, "rebalance[{i}] kolejnosc");
        for (id, pop_before, pop_after, excl) in &rec.rebalance {
            assert_bits(&format!("before[{i}] {id}"), *pop_before, before[id]);
            let after = cities
                .iter()
                .find(|c| c.city.id == *id)
                .map(|c| c.city.population)
                .expect("miasto");
            assert_bits(&format!("after[{i}] {id}"), *pop_after, after);
            assert!(*pop_before != *pop_after || pop_before.is_nan(), "{id}");
            assert_eq!(excl.as_ref(), exclude.get(id), "exclude[{i}] {id}");
        }
        // liczniki econ: wzrost/glod
        assert_bits(
            &format!("growth[{i}]"),
            econ_state.growth,
            num(&want["econ"]["growth"]),
        );
    }
}

#[test]
fn manpower_refresh_used_by_growth_matches_web() {
    let data = load("manpower.json");
    for (i, c) in data.as_array().expect("lista").iter().enumerate() {
        let city = ManpowerCity {
            id: "x".to_string(),
            owner_id: 0,
            population: num(&c["city"]["population"]),
            manpower: js_num(&c["city"]["manpower"]),
            q: 0,
            r: 0,
            oblegane: None,
        };
        let prev = if absent(&c["prev"]) {
            None
        } else {
            Some(num(&c["prev"]))
        };
        let got = refresh_manpower_after_pop_change(&city, num(&c["epoka"]), prev, num(&c["mult"]));
        assert_bits(&format!("manpower[{i}]"), got, num(&c["out"]));
    }
}
