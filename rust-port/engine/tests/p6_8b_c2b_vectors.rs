//! P6.8B-P1b-c2b (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba dla
//! `availableReplacementsFor` (production.ts ~1136-1252).
//!
//! Wektory: `tests/p6_8b_vectors/p1b-c2b.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/gen-p6-8b-c2b-vectors.mjs`
//! (Node 22 + loader TS: PRAWDZIWE production.ts, units.json i buildings.json z pinu).
//!
//! Kodowanie liczb: calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."}.
//! Nieobecne pole = {"absent": true}; null = null.

use civ_engine::domain::production_units::{
    available_replacements_for, AvailabilityContext, BuildingLinkRow, ProductionItem,
    ProductionKind, ReplaceAvailabilityCtx, UnitCostRow, UnitReplaceRow,
};
use serde_json::Value;
use std::collections::BTreeMap;

const C2B_JSON: &str = include_str!("p6_8b_vectors/p1b-c2b.json");

fn root() -> Value {
    serde_json::from_str(C2B_JSON).expect("wektor JSON p1b-c2b")
}

fn dec(v: &Value) -> f64 {
    if let Some(n) = v.as_f64() {
        return n;
    }
    if let Some(s) = v.get("$f").and_then(Value::as_str) {
        return s.parse::<f64>().expect("$f");
    }
    match v.get("$n").and_then(Value::as_str).expect("$n") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => panic!("nieznana liczba {other}"),
    }
}

/// Pole tekstowe z surowego JSON (napis -> Some; brak / null / obiekt -> None).
fn raw_str(v: Option<&Value>) -> Option<String> {
    v.and_then(Value::as_str).map(str::to_string)
}

/// Pole liczbowe z surowego JSON (liczba -> Some; reszta -> None).
fn raw_num(v: Option<&Value>) -> Option<f64> {
    v.and_then(Value::as_f64)
}

fn unit_rows(root: &Value, key: &str) -> Vec<UnitReplaceRow> {
    root[key]
        .as_array()
        .expect("klucz unitsProj*")
        .iter()
        .map(|u| UnitReplaceRow {
            cost: UnitCostRow {
                jednostka: u["Jednostka"].as_str().expect("Jednostka").to_string(),
                epoka: raw_str(u.get("Epoka")),
                pieniadz_koszt: raw_num(u.get("Pieniądz (koszt)")),
                super_jednostka: raw_str(u.get("Super-jednostka")),
                rola: raw_str(u.get("Rola (linia)")),
                surowiec: raw_str(u.get("Surowiec")),
            },
            typ: raw_str(u.get("Typ")),
            nacja: raw_str(u.get("Nacja")),
            tech: raw_str(u.get("Tech")),
            w_zamian_za: raw_str(u.get("W zamian za")),
            zastap_specjalnie: raw_str(u.get("Zastąp specjalnie")),
        })
        .collect()
}

fn building_rows(root: &Value) -> Vec<BuildingLinkRow> {
    root["buildingsProj"]
        .as_array()
        .expect("buildingsProj")
        .iter()
        .map(|b| BuildingLinkRow {
            id: b["id"].as_str().expect("id").to_string(),
            upgrade_from: raw_str(b.get("upgradeFrom")),
            odblokowuje: raw_str(b.get("odblokowuje")),
        })
        .collect()
}

fn str_list(v: Option<&Value>) -> Option<Vec<String>> {
    v.and_then(Value::as_array).map(|a| {
        a.iter()
            .map(|x| x.as_str().expect("napis").to_string())
            .collect()
    })
}

fn expected_items(out: &Value) -> Vec<(String, f64, String)> {
    out.as_array()
        .expect("out")
        .iter()
        .map(|t| {
            let id = t[0].as_str().expect("id").to_string();
            let koszt = dec(&t[1]);
            // true = nazwa == id; napis = nazwa rozna od id (w danych: nie wystepuje).
            let nazwa = match &t[2] {
                Value::Bool(true) => id.clone(),
                other => other.as_str().expect("nazwa").to_string(),
            };
            (id, koszt, nazwa)
        })
        .collect()
}

#[test]
fn available_replacements_match_web_vectors() {
    let r = root();
    let units_real = unit_rows(&r, "unitsProj");
    let units_synth = unit_rows(&r, "unitsProjSynth");
    let buildings = building_rows(&r);
    let all_techs = str_list(r.get("allTechs")).expect("allTechs");
    let half_techs = str_list(r.get("halfTechs")).expect("halfTechs");

    let cases = r["cases"].as_array().expect("cases");
    assert!(cases.len() >= 1000, "za malo wektorow: {}", cases.len());
    let non_empty = cases
        .iter()
        .filter(|c| c["out"].as_array().is_some_and(|a| !a.is_empty()))
        .count();
    assert!(non_empty >= 400, "za malo niepustych wynikow: {non_empty}");

    let ctx_docs = r["ctxDoc"].as_array().expect("ctxDoc");
    for case in cases {
        let name = case["ctx"].as_str().expect("ctx");
        let doc = ctx_docs
            .iter()
            .find(|d| d["name"].as_str() == Some(name))
            .expect("ctxDoc");

        let epoch = match doc.get("epoch") {
            Some(v) if v.get("absent").is_none() => dec(v),
            _ => f64::NAN, // web: brak pola -> Number.isFinite(undefined) = false -> 1
        };
        let built_owned = str_list(doc.get("builtBuildingIds")).unwrap_or_default();
        let built: Vec<&str> = built_owned.iter().map(String::as_str).collect();
        let techs_owned: Vec<String> = match doc.get("techs") {
            Some(t) if t.get("list").and_then(Value::as_str) == Some("ALL") => all_techs.clone(),
            Some(t) if t.get("list").and_then(Value::as_str) == Some("HALF") => half_techs.clone(),
            _ => Vec::new(),
        };
        let techs: Vec<&str> = techs_owned.iter().map(String::as_str).collect();
        let civ_key_owned: Option<String>;
        let civ_key: Option<Option<&str>> = match doc.get("civKey") {
            None => None,
            Some(v) if v.get("absent").is_some() => None,
            Some(Value::Null) => Some(None),
            Some(v) => {
                civ_key_owned = Some(v.as_str().expect("civKey").to_string());
                Some(civ_key_owned.as_deref())
            }
        };
        let civ_nacja_owned = raw_str(doc.get("civUnitNacja"));
        let alive_owned = str_list(doc.get("aliveUnitTypeNames")).unwrap_or_default();
        let alive: Vec<&str> = alive_owned.iter().map(String::as_str).collect();
        let stock_map: Option<BTreeMap<String, f64>> = match doc.get("empireResourceStock") {
            Some(v) if v.get("absent").is_none() => v
                .as_object()
                .map(|o| o.iter().map(|(k, x)| (k.clone(), dec(x))).collect()),
            _ => None,
        };

        let ctx = ReplaceAvailabilityCtx {
            epoch,
            built_building_ids: &built,
            unlocked_techs: &techs,
            civ_key,
            civ_unit_nacja: civ_nacja_owned.as_deref(),
            city_has_coast_or_river: doc
                .get("cityHasCoastOrRiver")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            show_stock_gated_units: doc
                .get("showStockGatedUnits")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            alive_unit_type_names: &alive,
            cost: AvailabilityContext {
                empire_resource_stock: stock_map.as_ref(),
                ..Default::default()
            },
        };

        let units = match case["ds"].as_str().expect("ds") {
            "real" => &units_real,
            "synth" => &units_synth,
            other => panic!("nieznany zbior {other}"),
        };
        let current = case["current"].as_str().expect("current");
        let got: Vec<ProductionItem> = available_replacements_for(current, units, &buildings, &ctx);
        let want = expected_items(&case["out"]);
        assert_eq!(
            got.len(),
            want.len(),
            "dlugosc: ctx={name} current={current} got={:?}",
            got.iter().map(|i| &i.id).collect::<Vec<_>>()
        );
        for (g, (id, koszt, nazwa)) in got.iter().zip(&want) {
            assert_eq!(g.kind, ProductionKind::Jednostka);
            assert_eq!(&g.id, id, "id ctx={name} current={current}");
            assert_eq!(&g.nazwa, nazwa, "nazwa ctx={name} current={current}");
            assert!(
                g.koszt == *koszt,
                "koszt {id} ctx={name} current={current}: rust={} web={koszt}",
                g.koszt
            );
        }
    }
}

#[test]
fn unknown_current_unit_returns_empty_list() {
    let r = root();
    let units = unit_rows(&r, "unitsProj");
    let buildings = building_rows(&r);
    let ctx = ReplaceAvailabilityCtx {
        epoch: 4.0,
        built_building_ids: &["koszary"],
        unlocked_techs: &[],
        civ_key: None,
        civ_unit_nacja: Some("Grecja"),
        city_has_coast_or_river: true,
        show_stock_gated_units: true,
        alive_unit_type_names: &[],
        cost: AvailabilityContext::default(),
    };
    assert!(available_replacements_for("nieistnieje", &units, &buildings, &ctx).is_empty());
    assert!(available_replacements_for("", &units, &buildings, &ctx).is_empty());
}

#[test]
fn current_unit_is_never_its_own_replacement() {
    let r = root();
    let units = unit_rows(&r, "unitsProj");
    let buildings = building_rows(&r);
    let ctx = ReplaceAvailabilityCtx {
        epoch: f64::NAN,
        built_building_ids: &["koszary"],
        unlocked_techs: &[],
        civ_key: None,
        civ_unit_nacja: None,
        city_has_coast_or_river: true,
        show_stock_gated_units: true,
        alive_unit_type_names: &[],
        cost: AvailabilityContext::default(),
    };
    for u in &units {
        let got = available_replacements_for(&u.cost.jednostka, &units, &buildings, &ctx);
        assert!(got.iter().all(|i| i.id != u.cost.jednostka));
    }
}

/// Porzadek `localeCompare` (ICU en-US) dla nazw z diakrytykami -- pary zmierzone w Node 22
/// (`Intl.Collator('en-US')`): baza przed diakrytykiem, `Ł` jak `L` na poziomie 1.
#[test]
fn replacement_name_compare_matches_icu_measured_pairs() {
    use civ_engine::domain::production_units::replacement_name_compare;
    use std::cmp::Ordering::{Equal, Greater, Less};
    assert_eq!(replacement_name_compare("Łucznik", "Lucznik"), Greater);
    assert_eq!(replacement_name_compare("Łucznik", "Macha"), Less);
    assert_eq!(replacement_name_compare("Łucznik", "Oszczepnik"), Less);
    assert_eq!(replacement_name_compare("Żołnierz", "Zoldak"), Greater);
    assert_eq!(replacement_name_compare("Ąb", "Ab"), Greater);
    assert_eq!(replacement_name_compare("Wojownik", "Wojownik"), Equal);
    assert_eq!(replacement_name_compare("Wojownik", "wojownik"), Greater);
}

const ICU_NAMES_JSON: &str = include_str!("p6_8b_vectors/p1b-c2-icu-names.json");
const NAN_SORT_C2B_JSON: &str = include_str!("p6_8b_vectors/p1b-c2b-nan-sort.json");

/// P6.8B-P1b-c2 (r4 obrona, zarzut 3): 42 039 par nazw wg ICU (generator gen-p6-8b-c2-icu-nan.mjs),
/// w tym wszystkie pary o tej samej bazie z roznica liczby diakrytykow. Stary poziom 2 (liczba
/// diakrytykow) daje tu rozbieznosci (np. "źą" vs "ża": ICU -1); test zabija ten blad.
#[test]
fn replacement_name_compare_matches_icu_pairs_file() {
    use civ_engine::domain::production_units::replacement_name_compare;
    use std::cmp::Ordering::{Equal, Greater, Less};
    let pairs: Value = serde_json::from_str(ICU_NAMES_JSON).expect("p1b-c2-icu-names");
    let rows = pairs.as_array().expect("tablica par");
    assert_eq!(rows.len(), 42039);
    let mut bad = Vec::new();
    for row in rows {
        let a = row[0].as_str().expect("a");
        let b = row[1].as_str().expect("b");
        let want = row[2].as_i64().expect("znak");
        let got = match replacement_name_compare(a, b) {
            Less => -1,
            Equal => 0,
            Greater => 1,
        };
        if got != want {
            bad.push(format!("{a}|{b}: icu {want} rust {got}"));
        }
    }
    assert!(
        bad.is_empty(),
        "rozbieznosci z ICU ({}): {:?}",
        bad.len(),
        &bad[..bad.len().min(10)]
    );
}

/// Sortowanie jak web `items.sort` z kosztami NaN/Infinity i duplikatami nazw: wynik = V8
/// (`Array.prototype.sort`, komparator 1:1 z production.ts), 400 przypadkow, n = 2..63.
#[test]
fn replacement_sort_matches_v8_with_nan_costs() {
    use civ_engine::domain::production_units::{cost_then_name_order, js_array_sort_by};
    let cases: Value = serde_json::from_str(NAN_SORT_C2B_JSON).expect("p1b-c2b-nan-sort");
    let cases = cases.as_array().expect("tablica przypadkow");
    assert_eq!(cases.len(), 400);
    for (ci, case) in cases.iter().enumerate() {
        let mut items: Vec<ProductionItem> = case["items"]
            .as_array()
            .expect("items")
            .iter()
            .map(|it| ProductionItem {
                kind: ProductionKind::Jednostka,
                id: it["id"].as_str().expect("id").to_string(),
                nazwa: it["nazwa"].as_str().expect("nazwa").to_string(),
                koszt: dec(&it["koszt"]),
                postep: None,
                is_general: None,
            })
            .collect();
        js_array_sort_by(&mut items, cost_then_name_order);
        let got: Vec<&str> = items.iter().map(|it| it.id.as_str()).collect();
        let want: Vec<&str> = case["order"]
            .as_array()
            .expect("order")
            .iter()
            .map(|v| v.as_str().expect("id"))
            .collect();
        assert_eq!(got, want, "przypadek {ci}");
    }
}
