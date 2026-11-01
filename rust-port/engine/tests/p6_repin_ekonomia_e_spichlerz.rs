//! REPIN-EKONOMIA-E (pin weba 4bbef081d), czesc 2: Spichlerz z JSON
//! (`building-resource-gate.ts`: `loadSpichlerzDrainParams`, `spichlerzCeramikaDrainAmount`,
//! `paySpichlerzDrainForCity(..., dryRun, params)`, `resolveOwnedBuildingInactiveStatus(..., drainParams)`;
//! `converters.ts: loadThroughput`).
//!
//! Wektory: `tests/p6_repin_ekonomia_e_vectors/spichlerz.json` z URUCHOMIONEGO weba @ 4bbef081d
//! (`gen-repin-ekonomia-e-vectors.mjs`). Porownanie BITOWE f64; wyjatek: znak zera w parametrach wczytanych z
//! JSON (`-0` nie przezywa `JSON.stringify`, wiec wejscie Rust ma `0`); zero porownywane wartosciowo.
//! `NaN`/`Infinity` w `raw` serializuja sie jako `null` - w webie i w Rust daja ten sam fallback.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use civ_engine::data::economy_society::parse_econ_params;
use civ_engine::domain::building_costs::p6_7b::{
    load_spichlerz_drain_params, load_throughput, pay_spichlerz_drain_for_city,
    resolve_owned_building_inactive_status, spichlerz_ceramika_drain_amount,
    spichlerz_drain_dry_run, InactiveStatusOptions, SpichlerzDrainParams,
    SPICHLERZ_DRAIN_FALLBACK_PER_TURN, SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I,
    SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II, SPICHLERZ_DRAIN_JSON_KEY_SOL_II,
};
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekonomia_e_vectors/spichlerz.json");
const ECON_PARAMS: &str = include_str!("../data/econ-params.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("spichlerz.json")
}

fn params_of(v: &Value) -> SpichlerzDrainParams {
    SpichlerzDrainParams {
        ceramika_i: num(&v["ceramikaI"]),
        ceramika_ii: num(&v["ceramikaII"]),
        sol_ii: num(&v["solII"]),
    }
}

fn zero_agnostic(label: &str, got: f64, want: f64) {
    if want == 0.0 {
        assert!(got == 0.0, "{label}: rust={got:?} web={want:?}");
    } else {
        assert_bits(label, got, want);
    }
}

#[test]
fn constants_and_keys_match_web() {
    let d = data();
    assert_bits(
        "fallback",
        SPICHLERZ_DRAIN_FALLBACK_PER_TURN,
        num(&d["fallback"]),
    );
    assert_eq!(
        SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I,
        d["keys"]["ceramikaI"].as_str().unwrap()
    );
    assert_eq!(
        SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II,
        d["keys"]["ceramikaII"].as_str().unwrap()
    );
    assert_eq!(
        SPICHLERZ_DRAIN_JSON_KEY_SOL_II,
        d["keys"]["solII"].as_str().unwrap()
    );
    assert_eq!(
        SpichlerzDrainParams::FALLBACK,
        SpichlerzDrainParams {
            ceramika_i: 25.0,
            ceramika_ii: 25.0,
            sol_ii: 25.0
        }
    );
}

/// Realny `econ-params.json` (kopia z pinu): 3 klucze Spichlerza = 25 dla easy/normal/hard i opisy nie sa juz
/// „MARTWY KLUCZ”; wartosci z `data/econ-params.json` rowne wartosciom z pliku weba @ 4bbef081d.
#[test]
fn real_econ_params_keys_match_pin_and_resolve_to_25() {
    let d = data();
    let raw: Value = serde_json::from_str(ECON_PARAMS).expect("econ-params.json");
    for key in [
        SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_I,
        SPICHLERZ_DRAIN_JSON_KEY_CERAMIKA_II,
        SPICHLERZ_DRAIN_JSON_KEY_SOL_II,
    ] {
        let mine = &raw["budynki"][key];
        let pin = &d["realEconKeys"][key];
        assert_eq!(mine, pin, "klucz {key} rozni sie od pinu");
        assert!(
            !mine["opis"].as_str().unwrap().contains("MARTWY KLUCZ"),
            "{key}: opis nadal martwy"
        );
    }
    parse_econ_params().expect("econ-params.json parsuje sie typem EconParams");
    for diff in ["easy", "normal", "hard"] {
        assert_eq!(
            load_spichlerz_drain_params(Some(&raw), diff),
            SpichlerzDrainParams::FALLBACK,
            "{diff}"
        );
    }
}

#[test]
fn load_params_matches_running_web() {
    let d = data();
    let cases = arr(&d, "params");
    assert!(cases.len() >= 90, "params {}", cases.len());
    let mut non_fallback = 0;
    for (i, c) in cases.iter().enumerate() {
        let raw: Option<Value> = if c["raw"]["undef"].as_bool() == Some(true) {
            None
        } else {
            Some(serde_json::from_str(c["raw"]["json"].as_str().expect("json")).expect("raw"))
        };
        // web `null` i `undefined` => `!raw` => trzy fallbacki; JSON `null` parsuje sie do `Value::Null`
        // (Some) - ale `load_throughput` na null daje fallback, wiec wynik jest ten sam co dla `None`.
        let got = load_spichlerz_drain_params(raw.as_ref(), c["difficulty"].as_str().unwrap());
        let want = params_of(&c["out"]);
        let name = &c["name"];
        zero_agnostic(
            &format!("params #{i} {name} ceramikaI"),
            got.ceramika_i,
            want.ceramika_i,
        );
        zero_agnostic(
            &format!("params #{i} {name} ceramikaII"),
            got.ceramika_ii,
            want.ceramika_ii,
        );
        zero_agnostic(
            &format!("params #{i} {name} solII"),
            got.sol_ii,
            want.sol_ii,
        );
        non_fallback += usize::from(got != SpichlerzDrainParams::FALLBACK);
    }
    assert!(non_fallback > 10, "za malo wartosci spoza fallbacku");
}

#[test]
fn load_throughput_matches_running_web() {
    let d = data();
    let cases = arr(&d, "throughput");
    assert!(cases.len() >= 140, "throughput {}", cases.len());
    let mut real = 0;
    for (i, c) in cases.iter().enumerate() {
        let raw: Value = serde_json::from_str(c["raw"].as_str().unwrap()).expect("raw");
        let fb = num(&c["fallback"]);
        let got = load_throughput(&raw, "k", c["difficulty"].as_str().unwrap(), fb);
        let want = num(&c["out"]);
        zero_agnostic(&format!("throughput #{i} {}", c["rowKind"]), got, want);
        real += usize::from(got != fb);
    }
    assert!(real > 20, "za malo wartosci z JSON (nie fallback): {real}");
}

#[test]
fn ceramika_amount_matches_running_web() {
    let d = data();
    let cases = arr(&d, "amount");
    assert!(cases.len() >= 40);
    for (i, c) in cases.iter().enumerate() {
        let built = strings(&c["built"]);
        let got = spichlerz_ceramika_drain_amount(&built, &params_of(&c["params"]));
        assert_bits(&format!("amount #{i} {built:?}"), got, num(&c["out"]));
    }
}

fn drain_result_eq(
    got: civ_engine::domain::building_costs::p6_7b::SpichlerzDrainPayResult,
    want: &Value,
) -> bool {
    got.ceramika_paid == want["ceramikaPaid"].as_bool().unwrap()
        && got.sol_paid == want["solPaid"].as_bool().unwrap()
}

#[test]
fn pay_and_inactive_status_match_running_web() {
    let d = data();
    let cases = arr(&d, "pay");
    assert!(cases.len() >= 1400, "pay {}", cases.len());
    let (mut paid, mut sol, mut inactive) = (0, 0, 0);
    for (i, c) in cases.iter().enumerate() {
        let owner = c["owner"].as_i64().expect("owner");
        let built = strings(&c["built"]);
        let params = params_of(&c["params"]);
        let label = format!("pay #{i} built={built:?} params={params:?}");
        for p in arr(c, "pay") {
            let dry = p["dry"].as_bool().unwrap();
            let mut cities = cities_from(&c["cities"]);
            let preview = spichlerz_drain_dry_run(&cities, owner, &built, &params);
            let got = pay_spichlerz_drain_for_city(&mut cities, owner, &built, dry, &params);
            assert!(
                drain_result_eq(got, &p["out"]),
                "{label} dry={dry}: {got:?} vs {}",
                p["out"]
            );
            if dry {
                assert!(drain_result_eq(preview, &p["out"]), "{label} preview");
            }
            assert_values(
                &format!("{label} dry={dry} after"),
                &cities_value(&cities),
                &p["after"],
            );
            if !dry {
                paid += usize::from(got.ceramika_paid);
                sol += usize::from(got.sol_paid);
            }
        }
        let cities = cities_from(&c["cities"]);
        for bid in ["spichlerz", "spichlerz_ii"] {
            let opts = InactiveStatusOptions {
                built_ids: &built,
                all_cities: &cities,
                owner_id: owner,
                runtime_active_built_ids: &[],
                empire_stock: None,
                building: None,
                resolve_owner_zloto_access: None,
                drain_params: params,
            };
            let got = resolve_owned_building_inactive_status(bid, &opts);
            let want = &c["inactive"][bid];
            assert_eq!(
                got.inactive,
                want["inactive"].as_bool().unwrap(),
                "{label} {bid} inactive"
            );
            assert_eq!(
                got.missing_labels,
                strings(&want["missingLabels"]),
                "{label} {bid} missing"
            );
            assert_eq!(got.tooltip, text(&want["tooltip"]), "{label} {bid} tooltip");
            inactive += usize::from(got.inactive);
        }
    }
    assert!(
        paid > 300 && sol > 150 && inactive > 300,
        "zbyt jednostronne dane: {paid}/{sol}/{inactive}"
    );
}

/// Brzegi N-1/N/N+1 dla progu Ceramiki per miasto (Spichlerz I = 10, II = 40, Sol II = 7).
#[test]
fn edges_n_minus_1_n_n_plus_1() {
    use civ_engine::domain::building_costs::p6_7b::{StockCity, StockRecord};
    let params = SpichlerzDrainParams {
        ceramika_i: 10.0,
        ceramika_ii: 40.0,
        sol_ii: 7.0,
    };
    let mk = |cer: f64, sol: f64| {
        vec![StockCity {
            id: "c".to_owned(),
            owner_id: 1,
            surowce: Some(StockRecord::from([
                ("ceramika".to_owned(), cer),
                ("sol".to_owned(), sol),
            ])),
        }]
    };
    let one = vec!["spichlerz".to_owned()];
    let two = vec!["spichlerz_ii".to_owned()];
    let both = vec!["spichlerz".to_owned(), "spichlerz_ii".to_owned()];
    for (cer, want) in [(9.0, false), (10.0, true), (11.0, true)] {
        let mut c = mk(cer, 0.0);
        assert_eq!(
            pay_spichlerz_drain_for_city(&mut c, 1, &one, true, &params).ceramika_paid,
            want,
            "I cer={cer}"
        );
    }
    for built in [&two, &both] {
        for (cer, want) in [(39.0, false), (40.0, true), (41.0, true)] {
            let mut c = mk(cer, 0.0);
            assert_eq!(
                pay_spichlerz_drain_for_city(&mut c, 1, built, true, &params).ceramika_paid,
                want,
                "II cer={cer}"
            );
        }
        for (sol, want) in [(6.0, false), (7.0, true), (8.0, true)] {
            let mut c = mk(1000.0, sol);
            assert_eq!(
                pay_spichlerz_drain_for_city(&mut c, 1, built, true, &params).sol_paid,
                want,
                "sol={sol}"
            );
        }
    }
    // Sol bez Spichlerza II nigdy nie jest placona (galaz `hasII`).
    let mut c = mk(1000.0, 1000.0);
    assert!(!pay_spichlerz_drain_for_city(&mut c, 1, &one, true, &params).sol_paid);
    // Realna wyplata: Spichlerz II odejmuje stawke II (40), nie I (10).
    let mut c = mk(100.0, 20.0);
    let r = pay_spichlerz_drain_for_city(&mut c, 1, &both, false, &params);
    assert!(r.ceramika_paid && r.sol_paid);
    let s = c[0].surowce.as_ref().unwrap();
    assert_eq!(s["ceramika"], 60.0);
    assert_eq!(s["sol"], 13.0);
}
