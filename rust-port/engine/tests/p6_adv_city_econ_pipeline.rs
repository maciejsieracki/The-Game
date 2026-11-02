//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1 (pin weba 4bbef081d): plastry zasobowe `advanceCityEconomy`
//! (`turn-economy.ts:2250-2913`) przez PRODUKCYJNEGO wolajacego `advance_city_economy_resources` na
//! `state::City`. Wektory z URUCHOMIONEGO, prawdziwego `advanceCityEconomy`
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1/gen-p6-adv-city-econ-vectors.mjs`):
//! stan koncowy `City.surowce`, pola `CityEconomyTick` ze stanu Spichlerza/Garncarni oraz wartosci
//! posrednie (liczniki, cap, przepustowosci, zbior Mennic, bonusy) zrzucone z funkcji weba.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::building_costs::p6_7b::StockRecord;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use civ_engine::domain::turn_economy_advance::{
    advance_city_economy_resources, owner_era_for, owner_resource_cap_for, owners_with_mennica,
    AdvanceCityEconomyInput, AdvanceResolvers,
};
use civ_engine::domain::turn_economy_resources::{
    ceramika_happiness_bonus, converter_throughputs_for_era, TerritoryResourceYield,
    WorkedMagazynYield,
};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_city_econ_vectors/advance.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("advance.json")
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

fn owner_map<T: Clone>(v: &Value, f: impl Fn(&Value) -> T) -> Option<BTreeMap<i64, T>> {
    v.as_object().map(|o| {
        o.iter()
            .map(|(k, x)| (k.parse::<i64>().expect("owner"), f(x)))
            .collect()
    })
}

fn count_map_enc(m: &BTreeMap<i64, f64>) -> Value {
    Value::Object(m.iter().map(|(k, v)| (k.to_string(), enc(*v))).collect())
}

struct Run {
    cities: Vec<City>,
    out: civ_engine::domain::turn_economy_advance::AdvanceResourceOutcome,
    cap: BTreeMap<i64, f64>,
    thr: BTreeMap<i64, BTreeMap<String, f64>>,
}

fn run_scenario(s: &Value) -> Run {
    let mut cities: Vec<City> = arr(s, "cities")
        .iter()
        .map(|c| City {
            id: text(&c["id"]),
            owner_id: c["owner"].as_i64().unwrap(),
            surowce: if c["surowce"].is_object() {
                Some(rec_of(&c["surowce"]))
            } else {
                None
            },
            ..City::default()
        })
        .collect();
    let built: BTreeMap<String, Vec<String>> = s["built"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), strings(v)))
        .collect();
    let terr: BTreeMap<String, TerritoryResourceYield> = s["terr"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| {
            let g = |key: &str| v.get(key).map(num);
            (
                k.clone(),
                TerritoryResourceYield {
                    drewno: g("drewno"),
                    kamien: g("kamien"),
                    glina: g("glina"),
                    ruda: g("ruda"),
                    ruda_zelaza: g("ruda_zelaza"),
                    ruda_cyny: g("ruda_cyny"),
                    sol: g("sol"),
                    zloto: g("zloto"),
                    kon: g("kon"),
                },
            )
        })
        .collect();
    let worked: BTreeMap<String, WorkedMagazynYield> = s["worked"]
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
        .collect();
    let zbadane: BTreeSet<String> = strings(&s["playerZbadane"]).into_iter().collect();
    let era = owner_map(&s["eraByOwner"], num);
    let tech = owner_map(&s["techByOwner"], |v| {
        strings(v).into_iter().collect::<BTreeSet<String>>()
    });
    let zloto = owner_map(&s["zlotoByOwner"], |v| v.as_bool().unwrap());
    let labels = owner_map(&s["labelsByOwner"], strings);
    let stock = owner_map(&s["stockByOwner"], rec_of);

    let era_f = |o: i64| era.as_ref().unwrap()[&o];
    let tech_f = |o: i64| tech.as_ref().unwrap()[&o].clone();
    let zloto_f = |o: i64| zloto.as_ref().map(|m| m[&o]).unwrap_or(true);
    let labels_f = |o: i64| labels.as_ref().unwrap()[&o].clone();
    let stock_f = |o: i64| stock.as_ref().unwrap()[&o].clone();
    let diff = text(&s["difficulty"]);
    let input = AdvanceCityEconomyInput {
        built_by_city: &built,
        econ_params: Some(&s["econ"]),
        difficulty: &diff,
        player_era: num(&s["playerEra"]),
        player_zbadane: &zbadane,
        resolvers: AdvanceResolvers {
            owner_era: era.as_ref().map(|_| &era_f as &dyn Fn(i64) -> f64),
            owner_tech: tech
                .as_ref()
                .map(|_| &tech_f as &dyn Fn(i64) -> BTreeSet<String>),
            owner_zloto_access: &zloto_f,
            owner_active_labels: labels
                .as_ref()
                .map(|_| &labels_f as &dyn Fn(i64) -> Vec<String>),
            owner_empire_stock: stock
                .as_ref()
                .map(|_| &stock_f as &dyn Fn(i64) -> StockRecord),
        },
        territory_resource_by_city: &terr,
        worked_magazyn_by_city: &worked,
    };
    // wartosci posrednie liczone ze STANU WEJSCIOWEGO (przed mutacja): zbior Mennic i cap/przepustowosci
    let mennica_in = owners_with_mennica(&cities, &built);
    let out = advance_city_economy_resources(&mut cities, &input);
    assert_eq!(out.mennica_owners, mennica_in, "owners_with_mennica");
    let owners: BTreeSet<i64> = cities.iter().map(|c| c.owner_id).collect();
    let raw = &s["econ"];
    let cap = owners
        .iter()
        .map(|&o| {
            (
                o,
                owner_resource_cap_for(&input, &out.magazyn_count_by_owner, o),
            )
        })
        .collect();
    let thr = owners
        .iter()
        .map(|&o| {
            (
                o,
                converter_throughputs_for_era(raw, &diff, owner_era_for(&input, o)),
            )
        })
        .collect();
    Run {
        cities,
        out,
        cap,
        thr,
    }
}

#[test]
fn advance_resources_match_running_web() {
    let d = data();
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 400);
    let (mut drained, mut clamped, mut spich, mut mennica_n) = (0, 0, 0, 0);
    for s in scenarios {
        let name = text(&s["name"]);
        let w = &s["out"];
        let r = run_scenario(s);

        // stan koncowy City.surowce (rozdzial puli po miastach: bitowo)
        let got_cities: Vec<Value> = r
            .cities
            .iter()
            .map(|c| {
                json!({"id": c.id, "surowce": c.surowce.as_ref().map(rec_enc).unwrap_or(Value::Null)})
            })
            .collect();
        assert_values(
            &format!("{name} cities"),
            &Value::Array(got_cities),
            &w["cities"],
        );

        // pola krotki CityEconomyTick zalezne od Spichlerza/Garncarni
        let got_pc: Vec<Value> = r
            .out
            .per_city
            .iter()
            .map(|v| {
                json!({"id": v.city_id, "maSpichlerz": v.ma_spichlerz, "maSpichlerzII": v.ma_spichlerz_ii,
                       "spichlerzCeramika": v.spichlerz_ceramika, "spichlerzSol": v.spichlerz_sol,
                       "garncarnia": enc(v.garncarnia_surplus_zadowolenie)})
            })
            .collect();
        assert_values(
            &format!("{name} perCity"),
            &Value::Array(got_pc),
            &w["perCity"],
        );

        // wartosci posrednie zrzucone z weba
        assert_values(&format!("{name} cap"), &count_map_enc(&r.cap), &w["cap"]);
        let thr_v = Value::Object(
            r.thr
                .iter()
                .map(|(o, t)| (o.to_string(), rec_enc(t)))
                .collect(),
        );
        assert_values(&format!("{name} thr"), &thr_v, &w["thr"]);
        assert_values(
            &format!("{name} stol"),
            &count_map_enc(&r.out.stolarnia_count_by_owner),
            &w["stol"],
        );
        assert_values(
            &format!("{name} kam"),
            &count_map_enc(&r.out.kamieniarski_count_by_owner),
            &w["kam"],
        );
        assert_values(
            &format!("{name} mag"),
            &count_map_enc(&r.out.magazyn_count_by_owner),
            &w["mag"],
        );
        let mut mennica: Vec<String> = r.out.mennica_owners.iter().map(i64::to_string).collect();
        mennica.sort();
        assert_eq!(mennica, strings(&w["mennica"]), "{name} mennica");
        assert_bits(
            &format!("{name} stolBonus"),
            r.out.stolarnia_bonus_drewna_civ,
            num(&w["stolBonus"]),
        );
        assert_bits(
            &format!("{name} kamBonus"),
            r.out.kamieniarski_bonus_kamienia_civ,
            num(&w["kamBonus"]),
        );

        if !r.out.mennica_owners.is_empty() {
            mennica_n += 1;
        }
        if r.out
            .per_city
            .iter()
            .any(|v| v.spichlerz_ceramika || v.spichlerz_sol)
        {
            spich += 1;
        }
        // pokrycie: scenariusz, w ktorym cap realnie obcial zapas (suma wejsciowa > cap) i drenaz Mennicy
        for (o, cap) in &r.cap {
            let mut sums: BTreeMap<String, f64> = BTreeMap::new();
            for c in arr(s, "cities") {
                if c["owner"].as_i64() == Some(*o) && c["surowce"].is_object() {
                    for (k, v) in c["surowce"].as_object().unwrap() {
                        *sums.entry(k.clone()).or_insert(0.0) += num(v);
                    }
                }
            }
            if sums.values().any(|t| t > cap) {
                clamped += 1;
            }
        }
        if w["mennica"].as_array().is_some_and(|a| !a.is_empty()) && s["techByOwner"].is_object() {
            drained += 1;
        }
    }
    assert!(
        clamped >= 20,
        "za malo scenariuszy z clampem capu: {clamped}"
    );
    assert!(spich >= 20, "za malo scenariuszy ze Spichlerzem: {spich}");
    assert!(
        mennica_n >= 40,
        "za malo scenariuszy z Mennica: {mennica_n}"
    );
    assert!(drained >= 20, "za malo scenariuszy z drenazem: {drained}");
}

#[test]
fn converter_throughputs_for_era_match_running_web() {
    let d = data();
    let cases = arr(&d, "thrCases");
    assert!(cases.len() >= 300);
    for (i, c) in cases.iter().enumerate() {
        // econ w wektorze ma ksztalt {globalne, budynki}; `converter_throughputs_for_era` czyta `raw.budynki`
        let got =
            converter_throughputs_for_era(&c["econ"], &text(&c["difficulty"]), num(&c["era"]));
        assert_values(&format!("thr #{i}"), &rec_enc(&got), &c["out"]);
    }
}

#[test]
fn ceramika_happiness_bonus_matches_running_web() {
    let d = data();
    let cases = arr(&d, "happyCases");
    assert_eq!(cases.len(), 18);
    for (i, c) in cases.iter().enumerate() {
        let got = ceramika_happiness_bonus(num(&c["v"]), c["g"].as_bool().unwrap());
        assert_bits(&format!("happy #{i}"), got, num(&c["out"]));
    }
}

#[test]
fn owners_with_mennica_uses_raw_built_ids() {
    let mk = |id: &str, owner: i64| City {
        id: id.to_owned(),
        owner_id: owner,
        ..City::default()
    };
    let cities = vec![mk("a", 1), mk("b", 2), mk("c", 3)];
    let mut built: BTreeMap<String, Vec<String>> = BTreeMap::new();
    built.insert("a".into(), vec!["mennica".into()]);
    built.insert("b".into(), vec!["Mennica".into(), "magazyn".into()]);
    let got = owners_with_mennica(&cities, &built);
    assert_eq!(got, BTreeSet::from([1]));
}
