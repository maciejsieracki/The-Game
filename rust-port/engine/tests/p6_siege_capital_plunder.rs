//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1: wektory z pinu dla `runCapitalCapturePlunder` (BRAK -> Ported).
//!
//! Zrodlo wektorow: `tests/p6_siege_capital_plunder_vectors/vectors.json` wygenerowane przez
//! `tests/p6_siege_capital_plunder_gen.mjs` (wycina funkcje z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75
//! i wykonuje je w node; atrapy tylko dla warstwy UI, zapisywane w `calls`).
//!
//! Sprawdzane: (a) `cityFoundOrder`, (b) galaz glowna `runCapitalCapturePlunder` (zwrot, mapa stolic, zdobycze Power,
//! spektakl, slot raportu, stan ekonomii, kolejnosc i argumenty wolan UI), (c) czysta sciezka
//! `applyBarbarianAwareCapitalCapturePlunder` (wynik zdarzenia i stan ekonomii).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::siege_capital_plunder::{
    apply_barbarian_aware_capital_capture_plunder, city_found_order, is_barbarian,
    run_capital_capture_plunder, CapitalCaptureOutcome, CaptureEvent, OwnerResourceAccess,
    PlunderCity, PlunderInput, PlunderLabels, PlunderState,
};
use serde_json::{json, Map, Value};

const DATA: &str = include_str!("p6_siege_capital_plunder_vectors/vectors.json");
const OWNERS: [i64; 6] = [-99, -1, 0, 1, 2, 3];

/// Normalizacja liczb: JSON `1` i `1.0` maja byc rowne.
fn norm(v: &Value) -> Value {
    match v {
        Value::Number(n) => json!(n.as_f64().expect("liczba")),
        Value::Array(a) => Value::Array(a.iter().map(norm).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, v)| (k.clone(), norm(v))).collect()),
        other => other.clone(),
    }
}

/// Stan ekonomii w pamieci (odpowiednik `capitalCaptureResourceAccess` w scenariuszu generatora).
#[derive(Default)]
struct Store {
    treasury: BTreeMap<i64, f64>,
    praca: BTreeMap<i64, f64>,
    nauka: BTreeMap<i64, f64>,
    techs: BTreeMap<i64, BTreeSet<String>>,
    food: BTreeMap<i64, f64>,
    food_on: bool,
    /// `Some` gdy akcesor `getFoodCapacity` istnieje (scenariusz `capMode: value`).
    cap: Option<BTreeMap<i64, f64>>,
}

impl OwnerResourceAccess for Store {
    fn get_treasury(&self, o: i64) -> f64 {
        self.treasury.get(&o).copied().unwrap_or(0.0)
    }
    fn set_treasury(&mut self, o: i64, v: f64) {
        self.treasury.insert(o, v);
    }
    fn get_praca_pool(&self, o: i64) -> f64 {
        self.praca.get(&o).copied().unwrap_or(0.0)
    }
    fn set_praca_pool(&mut self, o: i64, v: f64) {
        self.praca.insert(o, v);
    }
    fn get_nauka_pool(&self, o: i64) -> f64 {
        self.nauka.get(&o).copied().unwrap_or(0.0)
    }
    fn set_nauka_pool(&mut self, o: i64, v: f64) {
        self.nauka.insert(o, v);
    }
    fn get_researched_techs(&self, o: i64) -> BTreeSet<String> {
        self.techs.get(&o).cloned().unwrap_or_default()
    }
    fn add_researched_techs(&mut self, o: i64, ids: &[String]) {
        self.techs.entry(o).or_default().extend(ids.iter().cloned());
    }
    fn food_supported(&self) -> bool {
        self.food_on
    }
    fn get_food_reserve(&self, o: i64) -> f64 {
        self.food.get(&o).copied().unwrap_or(0.0)
    }
    fn set_food_reserve(&mut self, o: i64, v: f64) {
        self.food.insert(o, v.max(0.0));
    }
    fn get_food_capacity(&self, o: i64) -> Option<f64> {
        self.cap.as_ref().map(|m| m.get(&o).copied().unwrap_or(0.0))
    }
}

/// Etykiety UI o tym samym ksztalcie co atrapy w generatorze (`STUB_RET`).
struct Labels;

impl PlunderLabels for Labels {
    fn civ_label(&self, o: i64) -> String {
        format!("civ{o}")
    }
    fn moc_label(&self) -> String {
        "Moc".to_string()
    }
    fn civ_display_name(&self, o: i64) -> Option<String> {
        Some(format!("disp{o}"))
    }
    fn civ_key_for_owner_id(&self, o: i64) -> String {
        format!("key{o}")
    }
    fn one_line(&self, kind: &str) -> String {
        format!("OL:{kind}")
    }
    fn spectacle(&self, label: &str) -> String {
        format!("spec:{label}")
    }
}

fn owner_key(s: &str) -> i64 {
    s.parse::<i64>().expect("klucz wlasciciela")
}

fn f(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn parse_city(v: &Value) -> PlunderCity {
    let id = v["id"].as_str().expect("id").to_string();
    PlunderCity {
        name: format!("N-{id}"),
        id,
        owner_id: v["ownerId"].as_i64().expect("ownerId"),
        population: f(&v["population"]),
        surowce: v["surowce"]
            .as_object()
            .expect("surowce")
            .iter()
            .map(|(k, x)| (k.clone(), f(x)))
            .collect(),
    }
}

fn parse_store(input: &Value) -> Store {
    let st = &input["store"];
    let map_f = |m: &Value| -> BTreeMap<i64, f64> {
        m.as_object()
            .map(|o| o.iter().map(|(k, v)| (owner_key(k), f(v))).collect())
            .unwrap_or_default()
    };
    let techs: BTreeMap<i64, BTreeSet<String>> = st["techs"]
        .as_object()
        .expect("techs")
        .iter()
        .map(|(k, v)| {
            (
                owner_key(k),
                v.as_array()
                    .expect("tech list")
                    .iter()
                    .map(|x| x.as_str().unwrap().to_string())
                    .collect(),
            )
        })
        .collect();
    let food_on = input["foodSupported"].as_bool().expect("foodSupported");
    let cap = if input["capMode"].as_str() == Some("value") {
        Some(map_f(&input["cap"]))
    } else {
        None
    };
    Store {
        treasury: map_f(&st["treasury"]),
        praca: map_f(&st["praca"]),
        nauka: map_f(&st["nauka"]),
        techs,
        food: if food_on {
            map_f(&st["food"])
        } else {
            BTreeMap::new()
        },
        food_on,
        cap,
    }
}

fn store_json(st: &Store) -> Value {
    let per = |m: &BTreeMap<i64, f64>| -> Value {
        let mut o = Map::new();
        for owner in OWNERS {
            o.insert(
                owner.to_string(),
                json!(m.get(&owner).copied().unwrap_or(0.0)),
            );
        }
        Value::Object(o)
    };
    let mut techs = Map::new();
    for owner in OWNERS {
        let list: Vec<String> = st
            .techs
            .get(&owner)
            .cloned()
            .unwrap_or_default()
            .into_iter()
            .collect();
        techs.insert(owner.to_string(), json!(list));
    }
    json!({
        "treasury": per(&st.treasury),
        "praca": per(&st.praca),
        "nauka": per(&st.nauka),
        "techs": Value::Object(techs),
        "food": if st.food_on { per(&st.food) } else { Value::Null },
    })
}

fn outcome_json(o: &CapitalCaptureOutcome) -> Value {
    json!({
        "event": match o.event {
            CaptureEvent::PrzejecieStolicy => "przejecie_stolicy",
            CaptureEvent::Eliminacja => "eliminacja",
        },
        "skarbiecPrzejety": o.skarbiec_przejety,
        "naukaPrzejeta": o.nauka_przejeta,
        "pracaPoolPrzejeta": o.praca_pool_przejeta,
        "techSkopiowane": o.techs_skopiowane,
        "zywnoscPrzejeta": o.zywnosc_przejeta,
        "zywnoscUtracona": o.zywnosc_utracona,
        "zywnoscOfiaryRazem": o.zywnosc_ofiary_razem,
        "surowcePrzejete": o.surowce_przejete,
        "eliminacja": o.eliminacja,
        "newCapitalIdForOldOwner": o.new_capital_id_for_old_owner,
    })
}

#[test]
fn city_found_order_matches_pin() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    let rows = v["cityFoundOrder"].as_array().expect("cityFoundOrder");
    assert!(rows.len() >= 10);
    for row in rows {
        let id = row["id"].as_str().unwrap();
        let got = city_found_order(id);
        match &row["v"] {
            Value::String(s) if s == "Infinity" => {
                assert!(got.is_infinite() && got > 0.0, "id={id}")
            }
            other => assert_eq!(got, f(other), "id={id}"),
        }
    }
}

#[test]
fn run_capital_capture_plunder_matches_pin_vectors() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 30, "za malo przypadkow: {}", cases.len());

    let mut branch_hits: BTreeMap<&str, usize> = BTreeMap::new();
    for case in cases {
        let id = case["id"].as_str().unwrap();
        let inp = &case["input"];
        let old = inp["oldOwner"].as_i64().unwrap();
        let new = inp["newOwner"].as_i64().unwrap();
        let cities: Vec<PlunderCity> = inp["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(parse_city)
            .collect();
        let city_id = inp["city"].as_str().unwrap();
        let city = cities
            .iter()
            .find(|c| c.id == city_id)
            .expect("zdobyte miasto");
        let capital_map: BTreeMap<i64, String> = inp["capitalMap"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (owner_key(k), x.as_str().unwrap().to_string()))
            .collect();
        let zdobycze: BTreeMap<i64, f64> = inp["zdobycze"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (owner_key(k), f(x)))
            .collect();
        let building_count = inp["cityBuilt"][city_id].as_u64().unwrap_or(0) as usize;

        // Galaz glowna.
        let mut store = parse_store(inp);
        let mut state = PlunderState {
            capital_city_id_by_owner: capital_map.clone(),
            zdobycze_power_by_owner: zdobycze,
            ..Default::default()
        };
        let input = PlunderInput {
            city,
            old_owner: old,
            new_owner: new,
            cities: &cities,
            building_count,
            lost_power: f(&inp["lostPower"]),
            triumph_unification: inp["triumph"].as_bool().unwrap(),
        };
        let (ret, ui) = run_capital_capture_plunder(&input, &mut state, &mut store, &Labels);

        let ret_json = match &ret {
            Some(d) => {
                json!({"eliminatedCivLabel": d.eliminated_civ_label, "eliminatedDetails": d.eliminated_details})
            }
            None => Value::Null,
        };
        let map_json = |m: &BTreeMap<i64, String>| -> Value {
            Value::Object(m.iter().map(|(k, x)| (k.to_string(), json!(x))).collect())
        };
        let zdob_json: Value = Value::Object(
            state
                .zdobycze_power_by_owner
                .iter()
                .map(|(k, x)| (k.to_string(), json!(x)))
                .collect(),
        );
        let spec_json: Value = Value::Object(
            state
                .elimination_spectacle_by_label
                .iter()
                .map(|(k, x)| (k.clone(), json!(x)))
                .collect(),
        );
        let slot_json = match &state.capital_capture_report_slot {
            Some((kind, one)) => json!({"kind": kind, "oneLine": one}),
            None => Value::Null,
        };
        let got_main = json!({
            "ret": ret_json,
            "capitalMap": map_json(&state.capital_city_id_by_owner),
            "zdobycze": zdob_json,
            "spectacle": spec_json,
            "slot": slot_json,
            "store": store_json(&store),
            "calls": ui,
        });
        let exp = &case["main"];
        for key in [
            "ret",
            "capitalMap",
            "zdobycze",
            "spectacle",
            "slot",
            "store",
            "calls",
        ] {
            assert_eq!(
                norm(&got_main[key]),
                norm(&exp[key]),
                "case {id}, pole {key}"
            );
        }

        // Galezie (do raportu pokrycia).
        let branch = if old == -99 {
            "rebel"
        } else if is_barbarian(old) || ret.is_none() && exp["calls"].as_array().unwrap().is_empty()
        {
            "null-no-capital"
        } else if exp["calls"].as_array().unwrap().iter().any(|c| {
            c["fn"] == "recordCityCaptureEvent" && c["args"][0]["eliminatedCivLabel"].is_null()
        }) {
            "capital"
        } else {
            "elimination"
        };
        *branch_hits.entry(branch).or_default() += 1;

        // Czysta sciezka (applyBarbarianAware...) na swiezym stanie.
        let mut store2 = parse_store(inp);
        let designated = capital_map.get(&old).map(String::as_str);
        let outcome = apply_barbarian_aware_capital_capture_plunder(
            city,
            old,
            new,
            &cities,
            &mut store2,
            designated,
            is_barbarian,
        );
        let got_pure = json!({
            "outcome": outcome.as_ref().map(outcome_json).unwrap_or(Value::Null),
            "store": store_json(&store2),
        });
        assert_eq!(
            norm(&got_pure["outcome"]),
            norm(&case["pure"]["outcome"]),
            "case {id}, pure.outcome"
        );
        assert_eq!(
            norm(&got_pure["store"]),
            norm(&case["pure"]["store"]),
            "case {id}, pure.store"
        );
    }

    // Pokrycie galezi (wektory musza obejmowac wszystkie galezie glownej sciezki).
    for b in ["rebel", "null-no-capital", "capital", "elimination"] {
        assert!(
            branch_hits.get(b).copied().unwrap_or(0) >= 3,
            "za malo przypadkow galezi {b}: {branch_hits:?}"
        );
    }
}

/// Etykiety z `civDisplayNameForOwner` zwracajacym `null` (web: `civDisplayNameForOwner(0) ?? civLabelForOwner(0)`,
/// main.ts:35746). Atrapa z [`Labels`] zawsze zwraca `Some`, wiec ta galaz nie byla pokryta wektorami.
struct LabelsNoDisplayName;

impl PlunderLabels for LabelsNoDisplayName {
    fn civ_label(&self, o: i64) -> String {
        Labels.civ_label(o)
    }
    fn moc_label(&self) -> String {
        Labels.moc_label()
    }
    fn civ_display_name(&self, _o: i64) -> Option<String> {
        None
    }
    fn civ_key_for_owner_id(&self, o: i64) -> String {
        Labels.civ_key_for_owner_id(o)
    }
    fn one_line(&self, kind: &str) -> String {
        Labels.one_line(kind)
    }
    fn spectacle(&self, label: &str) -> String {
        Labels.spectacle(label)
    }
}

#[test]
fn triumph_display_name_none_falls_back_to_civ_label() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    let cases = v["cases"].as_array().expect("cases");
    let case = cases
        .iter()
        .find(|c| c["input"]["triumph"].as_bool() == Some(true))
        .expect("wektor z triumfem (triumph=true) w vectors.json");
    let inp = &case["input"];
    let old = inp["oldOwner"].as_i64().unwrap();
    let new = inp["newOwner"].as_i64().unwrap();
    assert_eq!(new, 0, "triumf dotyczy tylko zdobywcy-gracza");
    let cities: Vec<PlunderCity> = inp["cities"]
        .as_array()
        .unwrap()
        .iter()
        .map(parse_city)
        .collect();
    let city_id = inp["city"].as_str().unwrap();
    let city = cities
        .iter()
        .find(|c| c.id == city_id)
        .expect("zdobyte miasto");
    let capital_map: BTreeMap<i64, String> = inp["capitalMap"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (owner_key(k), x.as_str().unwrap().to_string()))
        .collect();
    let zdobycze: BTreeMap<i64, f64> = inp["zdobycze"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (owner_key(k), f(x)))
        .collect();
    let building_count = inp["cityBuilt"][city_id].as_u64().unwrap_or(0) as usize;
    let mut store = parse_store(inp);
    let mut state = PlunderState {
        capital_city_id_by_owner: capital_map,
        zdobycze_power_by_owner: zdobycze,
        ..Default::default()
    };
    let input = PlunderInput {
        city,
        old_owner: old,
        new_owner: new,
        cities: &cities,
        building_count,
        lost_power: f(&inp["lostPower"]),
        triumph_unification: true,
    };
    let (_ret, ui) =
        run_capital_capture_plunder(&input, &mut state, &mut store, &LabelsNoDisplayName);

    // Kolejnosc wolan: civDisplayNameForOwner(0) (zwraca null), potem civLabelForOwner(0) z fallbacku.
    let idx = ui
        .iter()
        .position(|c| c["fn"] == "civDisplayNameForOwner")
        .expect("civDisplayNameForOwner w ui_calls");
    assert_eq!(ui[idx]["args"], json!([0]));
    assert_eq!(
        ui[idx + 1]["fn"],
        json!("civLabelForOwner"),
        "fallback po null"
    );
    assert_eq!(ui[idx + 1]["args"], json!([0]));
    // Etykieta w powiadomieniu o triumfie = civ_label(0) (fallback), nie display name.
    let notice = ui
        .iter()
        .find(|c| c["fn"] == "showTriumphCityStateNotice")
        .expect("showTriumphCityStateNotice w ui_calls");
    assert_eq!(notice["args"][0]["civLabel"], json!("civ0"));
}
