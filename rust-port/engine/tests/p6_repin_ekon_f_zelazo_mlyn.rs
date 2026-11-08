//! REPIN-EKONOMIA-F runda 5, pozycja 4 (R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1):
//!  * natywny dostep do zelaza `ownerHasNativeZelazoAccess` (`zelazo-access.ts:101-107`, R-WEB-IRON-NATIVE-ACCESS-FIX-Q1),
//!  * `citySurowceSumForOwner` = `sumCitySurowce` (`diplomacy-goods.ts:126-138`, `main.ts:3485`),
//!  * bramka Mlyna `RIVER_ONLY_BUILDING_IDS` / `ctx.cityHasRiver` (`production.ts:172,1006`, R-WEB-MILL-RIVER-ONLY-GATE-Q1).
//! Wektory z URUCHOMIONEGO weba `origin/main` (`gen-ekonf-zelazo-mlyn-vectors.mjs`, `p6_repin_ekon_f_vectors/zelazo_mlyn.json`)
//! oraz testy progow N-1/N/N+1, NaN i brakujacych kluczy liczone recznie (mutacje: patrz dokument tematu, sekcja 10).

use std::collections::{BTreeMap, HashMap};

use civ_engine::domain::building_costs::p6_7b::StockRecord;
use civ_engine::domain::improvement_build::{BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::production_units::{
    available_production, is_river_only_building, AvailabilityContext, BuildingAvailRow,
    BuildingCostRow, ProductionAvailabilityCtx,
};
use civ_engine::domain::resource_access::{has_zelazo_access, owner_has_native_zelazo_access};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use civ_engine::domain::turn_economy_inputs_native::{
    city_surowce_sum_for_owner, owner_has_native_resource_access, StateSourcesWorld,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekon_f_vectors/zelazo_mlyn.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("zelazo_mlyn.json")
}

/// Liczba z wektora: liczba JSON albo napis ("NaN", "Infinity", "-Infinity", "-0").
fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba {other}"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn stock(v: &Value) -> Option<StockRecord> {
    match v {
        Value::Null => None,
        Value::Object(m) => Some(m.iter().map(|(k, x)| (k.clone(), num(x))).collect()),
        other => panic!("zapas: {other}"),
    }
}

fn strs(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|s| s.as_str().expect("napis").to_owned())
        .collect()
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

#[test]
fn has_zelazo_access_matches_web() {
    let v = vectors();
    let cases = v["zelazoAccess"].as_array().unwrap();
    assert!(cases.len() >= 80);
    for c in cases {
        let st = stock(&c["stock"]);
        let built = if c["built"].is_null() {
            None
        } else {
            Some(strs(&c["built"]))
        };
        assert_eq!(
            has_zelazo_access(st.as_ref(), built.as_deref()),
            c["out"].as_bool().unwrap(),
            "hasZelazoAccess {c}"
        );
    }
}

#[test]
fn owner_has_native_zelazo_access_matches_web() {
    let v = vectors();
    let cases = v["zelazoNative"].as_array().unwrap();
    assert!(cases.len() >= 160);
    let mut true_count = 0;
    for c in cases {
        let st = stock(&c["stock"]);
        let cities: Vec<Vec<String>> = c["cities"].as_array().unwrap().iter().map(strs).collect();
        let got = owner_has_native_zelazo_access(
            c["hasKopalnia"].as_bool().unwrap(),
            st.as_ref(),
            cities.iter().map(Vec::as_slice),
        );
        let want = c["out"].as_bool().unwrap();
        assert_eq!(got, want, "ownerHasNativeZelazoAccess {c}");
        if want {
            true_count += 1;
        }
    }
    // kontrola nietrywialnosci: przypadki `true` istnieja (stary kod weba dawal ZAWSZE false).
    assert!(true_count >= 10, "za malo przypadkow true: {true_count}");
}

fn city(id: &str, owner: i64, surowce: Option<&[(&str, f64)]>) -> City {
    City {
        id: id.to_owned(),
        owner_id: owner,
        q: 0.0,
        r: 0.0,
        population: 3.0,
        surowce: surowce.map(|s| s.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect()),
        ..City::default()
    }
}

struct Fx {
    cities: Vec<City>,
    built: BTreeMap<String, Vec<String>>,
    placed: Vec<(String, Vec<String>)>,
    map: BuildMap,
    hex_owners: HashMap<String, String>,
    kultura: BTreeMap<String, f64>,
}

impl Fx {
    fn world(&self) -> StateSourcesWorld<'_> {
        StateSourcesWorld {
            cities: &self.cities,
            built_by_city: &self.built,
            placed: &self.placed,
            extra_territory_nodes: &[],
            map: &self.map,
            hex_owners: &self.hex_owners,
            kultura_by_city: &self.kultura,
        }
    }
}

#[test]
fn city_surowce_sum_matches_web_sum_city_surowce() {
    let v = vectors();
    let cases = v["sumCases"].as_array().unwrap();
    assert!(cases.len() >= 10);
    for c in cases {
        // rekordy wektora -> miasta jednego ownera (kolejnosc zachowana); `absent`/`null` = miasto bez `surowce`.
        let cities: Vec<City> = c["records"]
            .as_array()
            .unwrap()
            .iter()
            .enumerate()
            .map(|(i, r)| {
                let recs: Option<Vec<(String, f64)>> = match r {
                    Value::Object(m) if m.contains_key("absent") => None,
                    Value::Object(m) => Some(m.iter().map(|(k, x)| (k.clone(), num(x))).collect()),
                    _ => None,
                };
                let borrowed: Option<Vec<(&str, f64)>> = recs
                    .as_ref()
                    .map(|r| r.iter().map(|(k, x)| (k.as_str(), *x)).collect());
                city(&format!("c{i}"), 1, borrowed.as_deref())
            })
            .collect();
        let fx = Fx {
            cities,
            built: BTreeMap::new(),
            placed: Vec::new(),
            map: BuildMap::new(Vec::new(), Vec::new()),
            hex_owners: HashMap::new(),
            kultura: BTreeMap::new(),
        };
        let got = city_surowce_sum_for_owner(&fx.world(), 1);
        let want = c["out"].as_object().unwrap();
        // web pomija NaN/Infinity przy SUMOWANIU wejsc, ale suma moze sama wyjsc nieskonczona (1e308+1e308).
        assert_eq!(got.len(), want.len(), "klucze {c}");
        for (k, w) in want {
            let g = got
                .get(k)
                .unwrap_or_else(|| panic!("brak klucza {k} w {c}"));
            assert!(same(*g, num(w)), "suma {k}: {g} vs {w} w {c}");
        }
    }
}

#[test]
fn city_surowce_sum_ignores_other_owners_and_missing_surowce() {
    let fx = Fx {
        cities: vec![
            city("a", 1, Some(&[("zelazo", 2.0)])),
            city("b", 2, Some(&[("zelazo", 100.0)])),
            city("c", 1, None),
            city("d", 1, Some(&[("zelazo", f64::NAN), ("braz", 1.0)])),
            city("e", 1, Some(&[("zelazo", f64::INFINITY)])),
        ],
        built: BTreeMap::new(),
        placed: Vec::new(),
        map: BuildMap::new(Vec::new(), Vec::new()),
        hex_owners: HashMap::new(),
        kultura: BTreeMap::new(),
    };
    let s = city_surowce_sum_for_owner(&fx.world(), 1);
    assert_eq!(s.get("zelazo"), Some(&2.0));
    assert_eq!(s.get("braz"), Some(&1.0));
    assert_eq!(s.len(), 2);
    assert!(city_surowce_sum_for_owner(&fx.world(), 3).is_empty());
}

/// Swiat: miasto ownera 1 w (0,0); Kopalnia zelaza na zlozu zelaza w (1,0) (w terytorium miasta).
fn iron_world(
    stock_zelazo: Option<f64>,
    built: &[&str],
    kopalnia: bool,
    zloze: Option<&str>,
) -> Fx {
    let mut hx = BuildHex::new(1, 0, TerrainType::Hills, Overlay::Brak);
    hx.zloze = zloze.map(str::to_owned);
    let center = BuildHex::new(0, 0, TerrainType::Plains, Overlay::Brak);
    let surowce: Option<Vec<(&str, f64)>> = stock_zelazo.map(|z| vec![("zelazo", z)]);
    let mut b = BTreeMap::new();
    b.insert(
        "c1".to_owned(),
        built.iter().map(|s| (*s).to_owned()).collect::<Vec<_>>(),
    );
    Fx {
        cities: vec![city("c1", 1, surowce.as_deref())],
        built: b,
        placed: if kopalnia {
            vec![("1,0".to_owned(), vec!["kopalnia_zelaza".to_owned()])]
        } else {
            Vec::new()
        },
        map: BuildMap::new(vec![center, hx], Vec::new()),
        hex_owners: HashMap::new(),
        kultura: BTreeMap::new(),
    }
}

#[test]
fn native_iron_end_to_end_stock_threshold_n_minus_1_n_n_plus_1() {
    // Prog zapasu: `(stock.zelazo ?? 0) > 0` (zelazo-access.ts:79): -1 / 0 -> false; 0.0001 / 1 -> true.
    for (z, want) in [
        (Some(-1.0), false),
        (Some(0.0), false),
        (Some(0.0001), true),
        (Some(1.0), true),
        (Some(f64::NAN), false),
        (None, false),
    ] {
        let fx = iron_world(z, &["odlewnia_zelaza"], true, Some("zelazo"));
        assert_eq!(
            owner_has_native_resource_access(&fx.world(), 1, "zelazo"),
            want,
            "zapas {z:?}"
        );
    }
}

#[test]
fn native_iron_requires_every_leg() {
    // Pelny zestaw: kopalnia na zlozu + zapas > 0 + odlewnia w miescie.
    let ok = iron_world(Some(1.0), &["odlewnia_zelaza"], true, Some("zelazo"));
    assert!(owner_has_native_resource_access(&ok.world(), 1, "zelazo"));
    // Wielka odlewnia tez liczy sie jako odlewnia.
    let wielka = iron_world(Some(1.0), &["wielka_odlewnia"], true, Some("zelazo"));
    assert!(owner_has_native_resource_access(
        &wielka.world(),
        1,
        "zelazo"
    ));
    // Brak odlewni (kuznia nie wystarcza).
    let no_cast = iron_world(Some(1.0), &["kuznia"], true, Some("zelazo"));
    assert!(!owner_has_native_resource_access(
        &no_cast.world(),
        1,
        "zelazo"
    ));
    // Brak kopalni.
    let no_mine = iron_world(Some(1.0), &["odlewnia_zelaza"], false, Some("zelazo"));
    assert!(!owner_has_native_resource_access(
        &no_mine.world(),
        1,
        "zelazo"
    ));
    // Kopalnia na zlozu innego surowca / bez zloza.
    let wrong = iron_world(Some(1.0), &["odlewnia_zelaza"], true, Some("miedz"));
    assert!(!owner_has_native_resource_access(
        &wrong.world(),
        1,
        "zelazo"
    ));
    let none = iron_world(Some(1.0), &["odlewnia_zelaza"], true, None);
    assert!(!owner_has_native_resource_access(
        &none.world(),
        1,
        "zelazo"
    ));
    // Inny wlasciciel: zapas i odlewnia sa ownera 1, pytamy o ownera 2.
    assert!(!owner_has_native_resource_access(&ok.world(), 2, "zelazo"));
}

#[test]
fn native_zelazo_access_direct_edge_cases() {
    let mut st = StockRecord::new();
    st.insert("zelazo".into(), 1.0);
    let cast = vec!["odlewnia_zelaza".to_owned()];
    let none: Vec<String> = Vec::new();
    // brak kopalni => false niezaleznie od reszty
    assert!(!owner_has_native_zelazo_access(
        false,
        Some(&st),
        [cast.as_slice()]
    ));
    // brak miast => false
    assert!(!owner_has_native_zelazo_access(
        true,
        Some(&st),
        std::iter::empty::<&[String]>()
    ));
    // brak zapasu (None) => false
    assert!(!owner_has_native_zelazo_access(
        true,
        None,
        [cast.as_slice()]
    ));
    // odlewnia dopiero w drugim miescie => true
    assert!(owner_has_native_zelazo_access(
        true,
        Some(&st),
        [none.as_slice(), cast.as_slice()]
    ));
    // klucz zelazo brakuje w zapasie
    let mut other = StockRecord::new();
    other.insert("braz".into(), 9.0);
    assert!(!owner_has_native_zelazo_access(
        true,
        Some(&other),
        [cast.as_slice()]
    ));
}

// ------------------------------------------------------------------------------------------- Mlyn

fn row(id: &str) -> BuildingAvailRow {
    BuildingAvailRow {
        cost: BuildingCostRow {
            id: id.to_owned(),
            nazwa: id.to_owned(),
            koszt_budowy: 100.0,
            przyrost_kosztu: 0.0,
            epoka_wejscia: Some(1.0),
            lokalizacja: None,
        },
        upgrade_from: None,
        suppressed: None,
        tech_unlock: None,
        wymagany_surowiec: None,
        odblokowuje: None,
    }
}

fn mlyn_ids(river: bool, coast: bool, built: &[&str]) -> Vec<String> {
    let rows = [row("mlyn"), row("port"), row("magazyn"), row("mlyn_wielki")];
    let ctx = ProductionAvailabilityCtx {
        epoch: f64::NAN,
        building_level: f64::NAN,
        built_building_ids: built,
        production_queue: &[],
        unlocked_techs: &[],
        civ_key: None,
        civ_unit_nacja: None,
        city_has_coast_or_river: coast,
        city_has_river: river,
        show_stock_gated_units: false,
        show_resource_gated_buildings: true,
        alive_unit_type_names: &[],
        empire_built_ids: None,
        cost: AvailabilityContext::default(),
    };
    available_production(&rows, &[], &ctx)
        .into_iter()
        .map(|i| i.id)
        .collect()
}

#[test]
fn mlyn_river_gate_matches_web() {
    let v = vectors();
    let cases = v["mlyn"].as_array().unwrap();
    let mut checked = 0;
    for c in cases {
        // Rust modeluje `ctx.cityHasRiver !== true` jako bool; wartosci nie-bool z weba (np. "true", 1, null) = !== true => false.
        let river = c["cityHasRiver"].as_bool().unwrap_or(false);
        let coast = c["cityHasCoastOrRiver"].as_bool().unwrap_or(false);
        let built: Vec<&str> = if c["mlynBuilt"].as_bool().unwrap() {
            vec!["mlyn"]
        } else {
            Vec::new()
        };
        let want = strs(&c["out"]);
        assert_eq!(mlyn_ids(river, coast, &built), want, "mlyn {c}");
        checked += 1;
    }
    assert!(checked >= 30);
}

#[test]
fn mlyn_gate_only_river_not_coast_and_only_for_mlyn() {
    // Morze/jezioro (coast) nie wystarcza; rzeka wystarcza; `port` zalezy od coast-or-river, nie od rzeki.
    assert!(!mlyn_ids(false, true, &[]).contains(&"mlyn".to_owned()));
    assert!(mlyn_ids(true, false, &[]).contains(&"mlyn".to_owned()));
    assert!(!mlyn_ids(false, false, &[]).contains(&"mlyn".to_owned()));
    // `mlyn_wielki` (prefiks) i `magazyn` nie sa bramkowane rzeka.
    let none = mlyn_ids(false, false, &[]);
    assert!(none.contains(&"mlyn_wielki".to_owned()) && none.contains(&"magazyn".to_owned()));
    assert!(!none.contains(&"port".to_owned()));
    assert!(mlyn_ids(false, true, &[]).contains(&"port".to_owned()));
    // zbiory ID: dokladnie `mlyn`
    assert!(is_river_only_building("mlyn"));
    assert!(!is_river_only_building("mlyn_wielki"));
    assert!(!is_river_only_building("Mlyn"));
    assert!(!is_river_only_building(""));
}
