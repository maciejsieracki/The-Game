//! R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1: produkcyjna sciezka zdobycia stolicy
//! (`apply_capital_capture_with_plunder`) = Transfer + `run_capital_capture_plunder` + akumulator zdobyczy w `PlayableState`.
//!
//! Wejscie i oczekiwania sa CZYTANE z `tests/p6_siege_capital_plunder_vectors/vectors.json` (wygenerowany przez
//! `p6_siege_capital_plunder_gen.mjs` z pinu 07d2fbd72). Porownywane sa: pelny stan ekonomii wszystkich wlascicieli
//! (skarbiec, praca, nauka, techy, zywnosc), akumulator zdobyczy, zwrot eliminacji, slot raportu, spektakl, mapa stolic
//! i cala sekwencja wywolan UI (fn + args).
//!
//! Granice jawne:
//! * SHA-256 pliku wektorow NIE jest sprawdzany (brak zaleznosci sha2 w Cargo.toml - poza allowlista tematu).
//! * `lost_power` jest podawane jako stala z wektora (atrapa `buildObjectivePowerForOwner`). Pin liczy je PO
//!   `applyBarbarianAware` (main.ts:35672 vs 35611); kolejnosci tej wrapper nie odtwarza (patrz raport obrony).
//! * Wejscie garnizonu (`enterCityAfterSurrender`) nie jest wolane przez wrapper.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::playable::PlayableState;
use civ_engine::domain::siege_capital_plunder::{
    OwnerResourceAccess, PlunderCity, PlunderLabels, PlunderState,
};
use civ_engine::domain::siege_transfer::{
    apply_capital_capture_with_plunder, CapitalCaptureResult, CapitalPlunderCtx,
    CapitalTransferArgs, TransferCity, TransferExtras,
};
use serde_json::{json, Value};

const DATA: &str = include_str!("p6_siege_capital_plunder_vectors/vectors.json");
const OWNERS: [i64; 6] = [-99, -1, 0, 1, 2, 3];

fn norm(v: &Value) -> Value {
    match v {
        Value::Number(n) => json!(n.as_f64().expect("liczba")),
        Value::Array(a) => Value::Array(a.iter().map(norm).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, v)| (k.clone(), norm(v))).collect()),
        other => other.clone(),
    }
}

fn pin_case(id: &str) -> Value {
    let data: Value = serde_json::from_str(DATA).expect("vectors.json");
    data["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["id"] == id)
        .cloned()
        .unwrap_or_else(|| panic!("brak wektora {id}"))
}

fn num_map(v: &Value) -> BTreeMap<i64, f64> {
    v.as_object()
        .map(|o| {
            o.iter()
                .map(|(k, v)| {
                    (
                        k.parse().expect("klucz wlasciciela"),
                        v.as_f64().expect("liczba"),
                    )
                })
                .collect()
        })
        .unwrap_or_default()
}

fn pin_num(map: &Value, key: &str) -> f64 {
    map.get(key).and_then(Value::as_f64).unwrap_or(0.0)
}

fn acc(m: &BTreeMap<i64, f64>, o: i64) -> f64 {
    m.get(&o).copied().unwrap_or(0.0)
}

#[derive(Default)]
struct Store {
    treasury: BTreeMap<i64, f64>,
    praca: BTreeMap<i64, f64>,
    nauka: BTreeMap<i64, f64>,
    techs: BTreeMap<i64, BTreeSet<String>>,
    food: BTreeMap<i64, f64>,
    cap: BTreeMap<i64, f64>,
    food_supported: bool,
}

impl Store {
    fn from_input(input: &Value) -> Self {
        let s = &input["store"];
        assert_eq!(input["capMode"], "value", "wektor w trybie cap=value");
        let techs: BTreeMap<i64, BTreeSet<String>> = s["techs"]
            .as_object()
            .expect("techs")
            .iter()
            .map(|(k, v)| {
                (
                    k.parse().expect("klucz"),
                    v.as_array()
                        .expect("lista")
                        .iter()
                        .map(|x| x.as_str().expect("tech").to_string())
                        .collect(),
                )
            })
            .collect();
        Store {
            treasury: num_map(&s["treasury"]),
            praca: num_map(&s["praca"]),
            nauka: num_map(&s["nauka"]),
            techs,
            food: num_map(&s["food"]),
            cap: num_map(&input["cap"]),
            food_supported: input["foodSupported"].as_bool().expect("foodSupported"),
        }
    }
}

impl OwnerResourceAccess for Store {
    fn get_treasury(&self, o: i64) -> f64 {
        acc(&self.treasury, o)
    }
    fn set_treasury(&mut self, o: i64, v: f64) {
        self.treasury.insert(o, v);
    }
    fn get_praca_pool(&self, o: i64) -> f64 {
        acc(&self.praca, o)
    }
    fn set_praca_pool(&mut self, o: i64, v: f64) {
        self.praca.insert(o, v);
    }
    fn get_nauka_pool(&self, o: i64) -> f64 {
        acc(&self.nauka, o)
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
        self.food_supported
    }
    fn get_food_reserve(&self, o: i64) -> f64 {
        acc(&self.food, o)
    }
    fn set_food_reserve(&mut self, o: i64, v: f64) {
        self.food.insert(o, v);
    }
    fn get_food_capacity(&self, o: i64) -> Option<f64> {
        self.cap.get(&o).copied()
    }
}

/// Etykiety zgodne ze stubami generatora (civLabelForOwner = civ{o}, mocLabel = Moc, oneLine = OL:{kind}, ...).
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

fn city_from(v: &Value) -> PlunderCity {
    let id = v["id"].as_str().expect("id miasta").to_string();
    PlunderCity {
        name: format!("N-{id}"),
        id,
        owner_id: v["ownerId"].as_i64().expect("ownerId"),
        population: v["population"].as_f64().expect("population"),
        surowce: v["surowce"]
            .as_object()
            .map(|o| {
                o.iter()
                    .map(|(k, v)| (k.clone(), v.as_f64().expect("surowiec")))
                    .collect()
            })
            .unwrap_or_default(),
    }
}

struct Run {
    res: CapitalCaptureResult,
    store: Store,
    playable: PlayableState,
    plunder: PlunderState,
}

/// Odtwarza wejscie wektora przez produkcyjna sciezke (wrapper), bez zmian w danych wektora.
fn run_pin_case(case: &Value) -> Run {
    let input = &case["input"];
    let city_id = input["city"].as_str().expect("city");
    let mut cities: Vec<PlunderCity> = input["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .map(city_from)
        .collect();
    let city_index = cities
        .iter()
        .position(|c| c.id == city_id)
        .expect("miasto zdobywane jest na liscie miast");
    assert!(
        input["zdobycze"].as_object().expect("zdobycze").is_empty(),
        "wektor startuje z pustym akumulatorem zdobyczy"
    );
    let old_owner = input["oldOwner"].as_i64().expect("oldOwner");
    let new_owner = input["newOwner"].as_i64().expect("newOwner");
    let building_count = input["cityBuilt"][city_id].as_u64().expect("cityBuilt") as usize;
    let lost_power = input["lostPower"].as_f64().expect("lostPower");

    let mut tc = TransferCity {
        owner_id: old_owner,
        population: cities[city_index].population,
        q: 0,
        r: 0,
        found_by_owner: None,
        rebel_state: None,
        start_city_state: None,
    };
    let mut store = Store::from_input(input);
    let mut plunder = PlunderState::default();
    for (k, v) in input["capitalMap"].as_object().expect("capitalMap") {
        plunder.capital_city_id_by_owner.insert(
            k.parse().expect("klucz"),
            v.as_str().expect("id").to_string(),
        );
    }
    let mut playable = PlayableState::empty();
    let mut units = Vec::new();
    let labels = Labels;
    let res = {
        let ctx = CapitalPlunderCtx {
            access: &mut store,
            labels: &labels,
            plunder_state: &mut plunder,
            cities: &mut cities,
            city_index,
            building_count,
            triumph_unification: input["triumph"].as_bool().expect("triumph"),
        };
        apply_capital_capture_with_plunder(
            &mut tc,
            CapitalTransferArgs {
                new_owner,
                was_independent_city_state: false,
                units: &mut units,
                production: None,
                extras: TransferExtras::default(),
            },
            ctx,
            &mut playable,
            || lost_power,
        )
    };
    assert_eq!(
        tc.owner_id, new_owner,
        "Transfer zmienia wlasciciela miasta"
    );
    Run {
        res,
        store,
        playable,
        plunder,
    }
}

/// Porownanie z pinem: stan ekonomii (wszyscy wlasciciele), zdobycze, zwrot, slot, spektakl, stolice, wywolania UI.
fn assert_matches_pin(case: &Value, run: &Run) {
    let main = &case["main"];
    let pin_store = &main["store"];
    for o in OWNERS {
        let k = o.to_string();
        assert_eq!(
            run.store.get_treasury(o),
            pin_num(&pin_store["treasury"], &k),
            "skarbiec {o}"
        );
        assert_eq!(
            run.store.get_praca_pool(o),
            pin_num(&pin_store["praca"], &k),
            "praca {o}"
        );
        assert_eq!(
            run.store.get_nauka_pool(o),
            pin_num(&pin_store["nauka"], &k),
            "nauka {o}"
        );
        assert_eq!(
            run.store.get_food_reserve(o),
            pin_num(&pin_store["food"], &k),
            "zywnosc {o}"
        );
        let pin_techs: BTreeSet<String> = pin_store["techs"][&k]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|x| x.as_str().expect("tech").to_string())
                    .collect()
            })
            .unwrap_or_default();
        assert_eq!(run.store.get_researched_techs(o), pin_techs, "techy {o}");
        assert_eq!(
            run.playable.war.zdobycze_power_for(o),
            pin_num(&main["zdobycze"], &k),
            "zdobycze Power {o}"
        );
    }
    match main["ret"].as_object() {
        None => assert!(run.res.elimination.is_none(), "pin: ret = null"),
        Some(r) => {
            let e = run.res.elimination.as_ref().expect("pin: ret != null");
            assert_eq!(
                e.eliminated_civ_label, r["eliminatedCivLabel"],
                "etykieta eliminacji"
            );
            assert_eq!(
                e.eliminated_details, r["eliminatedDetails"],
                "szczegoly eliminacji"
            );
        }
    }
    let pin_slot = &main["slot"];
    let slot = run
        .plunder
        .capital_capture_report_slot
        .as_ref()
        .map(|(k, l)| json!({ "kind": k, "oneLine": l }))
        .unwrap_or(Value::Null);
    assert_eq!(slot, *pin_slot, "slot raportu kapitału");
    let spectacle: BTreeMap<String, String> = run.plunder.elimination_spectacle_by_label.clone();
    let pin_spectacle: BTreeMap<String, String> = main["spectacle"]
        .as_object()
        .expect("spectacle")
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().expect("spec").to_string()))
        .collect();
    assert_eq!(spectacle, pin_spectacle, "spektakl eliminacji");
    let capitals: BTreeMap<String, String> = run
        .plunder
        .capital_city_id_by_owner
        .iter()
        .map(|(k, v)| (k.to_string(), v.clone()))
        .collect();
    let pin_capitals: BTreeMap<String, String> = main["capitalMap"]
        .as_object()
        .expect("capitalMap")
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().expect("id").to_string()))
        .collect();
    assert_eq!(capitals, pin_capitals, "mapa stolic po zdobyciu");
    // Licznik niepustosci: wektor musi miec wywolania UI, a wrapper musi je wyprodukowac.
    let pin_calls = main["calls"].as_array().expect("calls");
    assert!(!pin_calls.is_empty(), "wektor ma wywolania UI");
    assert!(
        !run.res.ui_calls.is_empty(),
        "wrapper wyprodukowal wywolania UI"
    );
    assert_eq!(
        norm(&Value::Array(run.res.ui_calls.clone())),
        norm(&Value::Array(pin_calls.clone())),
        "kolejnosc i argumenty wywolan UI"
    );
}

#[test]
fn pin_h04_capital_capture_keeps_cities_matches_full_state() {
    let case = pin_case("h04-capital-ai-keeps-cities");
    let run = run_pin_case(&case);
    assert_matches_pin(&case, &run);
    assert!(run.res.elimination.is_none());
    assert!(
        !run.res.zdobycze_recorded,
        "brak zdobyczy w galezi przejecia stolicy"
    );
    assert_eq!(run.res.lost_power, 120.0);
}

#[test]
fn pin_h05_elimination_by_player_matches_full_state_and_records_zdobycz() {
    let case = pin_case("h05-elim-player-wins-triumph");
    let run = run_pin_case(&case);
    assert_matches_pin(&case, &run);
    // Pin h05: triumph = true, wiec ret = null, a zdobycz 120 zapisana w stanie gry.
    assert!(run.res.elimination.is_none());
    assert!(run.res.zdobycze_recorded);
    assert_eq!(run.playable.war.zdobycze_power_for(0), 120.0);
    assert_eq!(run.res.lost_power, 120.0);
}

#[test]
fn pin_h09_barbarian_captor_elimination_records_no_zdobycz() {
    let case = pin_case("h09-elim-barb-captor");
    let run = run_pin_case(&case);
    assert_matches_pin(&case, &run);
    assert!(run.res.elimination.is_none(), "pin h09: ret = null");
    assert!(!run.res.zdobycze_recorded, "pin h09: zdobycze = {{}}");
    assert_eq!(
        run.store.get_treasury(-1),
        20.0,
        "barbarzynca nie dostaje zasobow (pin h09)"
    );
    assert_eq!(
        run.store.get_treasury(2),
        0.0,
        "ofiara traci skarbiec (pin h09)"
    );
}
