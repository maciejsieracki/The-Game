//! P6.8B2-P2 (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba dla symboli
//! production.ts 2004-2541: rekrutacja (enqueue/dequeue/advance/advanceGated), rush, praca
//! (splitPraca/pracaImperialPoolGain/previewPracaPoolBrutto), koszt jednostki, podzial outputu,
//! katalog epoki (eraBuildingCatalog).
//!
//! Wektory: `tests/p6_8b2_vectors/p2-*.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B2-PRODUKCJA-REKRUTACJA-Q1/gen-p6-8b2-vectors.mjs`
//! (Node 22 + loader TS: PRAWDZIWE production.ts, units.json i buildings.json z pinu 91dc998a).
//!
//! Kodowanie liczb: calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."}.
//! Nieobecne pole = {"absent": true}; null = null.

use civ_engine::domain::economy_yield::city_praca_integer;
use civ_engine::domain::production_units::{
    advance_recruitment, advance_recruitment_gated, buildable_production, city_money_output,
    city_science_output, dequeue_recruitment, enqueue_recruitment, era_building_catalog,
    praca_imperial_pool_gain, preview_praca_pool_brutto, purchasable_units, rush_cost,
    rush_production, split_output, split_praca, unit_cost_mode, unit_purchase_cost,
    AdvanceRecruitmentGatedResult, AdvanceRecruitmentResult, AvailabilityContext, BuildingAvailRow,
    BuildingCatalogEntry, BuildingCatalogStatus, BuildingCostRow, CityProduction, EraBuildingRow,
    EraCatalogCtx, OutputShares, PracaSplitTick, ProductionAvailabilityCtx, ProductionItem,
    ProductionKind, UnitCostRow, UnitReplaceRow,
};
use civ_engine::domain::types::Difficulty;
use serde_json::Value;
use std::collections::BTreeMap;

const RECRUIT_JSON: &str = include_str!("p6_8b2_vectors/p2-recruit.json");
const PRAJA_JSON: &str = include_str!("p6_8b2_vectors/p2-praca.json");
const OUTPUT_JSON: &str = include_str!("p6_8b2_vectors/p2-output.json");
const UNIT_COST_JSON: &str = include_str!("p6_8b2_vectors/p2-unit-cost.json");
const CATALOG_JSON: &str = include_str!("p6_8b2_vectors/p2-catalog.json");

type StockMap = BTreeMap<String, f64>;

fn load(text: &str) -> Value {
    serde_json::from_str(text).expect("wektor JSON P2")
}

/// Liczba z kodowania wektora (`$f`, `$n`, JSON number).
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

/// Pole opcjonalne liczbowe: `{"absent": true}` lub brak = None.
fn dec_opt(v: Option<&Value>) -> Option<f64> {
    match v {
        None => None,
        Some(x) if x.get("absent").is_some() => None,
        Some(x) => Some(dec(x)),
    }
}

/// Wartosc JS-owa (`Object.is`-rowna): NaN = NaN, -0 != +0.
fn same(actual: f64, expected: f64) -> bool {
    if expected.is_nan() {
        return actual.is_nan();
    }
    if expected == 0.0 && expected.is_sign_negative() {
        return actual == 0.0 && actual.is_sign_negative();
    }
    if actual == 0.0 && actual.is_sign_negative() {
        return false;
    }
    actual == expected
}

fn assert_num(ctx: &str, actual: f64, expected: &Value) {
    let e = dec(expected);
    assert!(
        same(actual, e),
        "{ctx}: actual={actual:?} expected={e:?} ({expected})"
    );
}

fn opt_bool(v: Option<&Value>) -> Option<bool> {
    match v {
        None => None,
        Some(x) if x.get("absent").is_some() => None,
        Some(x) => x.as_bool(),
    }
}

fn opt_str(v: Option<&Value>) -> Option<String> {
    match v {
        None => None,
        Some(x) if x.get("absent").is_some() => None,
        Some(x) => x.as_str().map(str::to_string),
    }
}

fn kind_of(s: &str) -> ProductionKind {
    match s {
        "budynek" => ProductionKind::Budynek,
        "jednostka" => ProductionKind::Jednostka,
        other => panic!("nieznany kind {other}"),
    }
}

fn item_from(v: &Value) -> ProductionItem {
    ProductionItem {
        kind: kind_of(v["kind"].as_str().expect("kind")),
        id: v["id"].as_str().expect("id").to_string(),
        nazwa: v["nazwa"].as_str().expect("nazwa").to_string(),
        koszt: dec(&v["koszt"]),
        postep: dec_opt(v.get("postep")),
        is_general: opt_bool(v.get("isGeneral")),
    }
}

fn items_from(v: &Value) -> Vec<ProductionItem> {
    v.as_array()
        .expect("tablica pozycji")
        .iter()
        .map(item_from)
        .collect()
}

fn prod_from(v: &Value) -> CityProduction {
    CityProduction {
        kolejka: items_from(&v["kolejka"]),
        postep: dec(&v["postep"]),
        wstrzymana: opt_bool(v.get("wstrzymana")),
        rekrutacja: v.get("rekrutacja").map(items_from),
    }
}

fn assert_item(ctx: &str, actual: &ProductionItem, expected: &Value) {
    assert_eq!(
        actual.kind,
        kind_of(expected["kind"].as_str().unwrap()),
        "{ctx} kind"
    );
    assert_eq!(actual.id, expected["id"].as_str().unwrap(), "{ctx} id");
    assert_eq!(
        actual.nazwa,
        expected["nazwa"].as_str().unwrap(),
        "{ctx} nazwa"
    );
    assert_num(&format!("{ctx} koszt"), actual.koszt, &expected["koszt"]);
    match (actual.postep, dec_opt(expected.get("postep"))) {
        (None, None) => {}
        (Some(a), Some(e)) => assert!(same(a, e), "{ctx} postep {a} vs {e}"),
        other => panic!("{ctx} postep mismatch {other:?}"),
    }
    assert_eq!(
        actual.is_general,
        opt_bool(expected.get("isGeneral")),
        "{ctx} isGeneral"
    );
}

fn assert_items(ctx: &str, actual: &[ProductionItem], expected: &Value) {
    let exp = expected.as_array().expect("tablica");
    assert_eq!(actual.len(), exp.len(), "{ctx} dlugosc");
    for (i, (a, e)) in actual.iter().zip(exp.iter()).enumerate() {
        assert_item(&format!("{ctx}[{i}]"), a, e);
    }
}

fn assert_prod(ctx: &str, actual: &CityProduction, expected: &Value) {
    assert_items(
        &format!("{ctx}.kolejka"),
        &actual.kolejka,
        &expected["kolejka"],
    );
    assert_num(&format!("{ctx}.postep"), actual.postep, &expected["postep"]);
    assert_eq!(
        actual.wstrzymana,
        opt_bool(expected.get("wstrzymana")),
        "{ctx}.wstrzymana"
    );
    match (&actual.rekrutacja, expected.get("rekrutacja")) {
        (None, None) => {}
        (Some(a), Some(e)) => assert_items(&format!("{ctx}.rekrutacja"), a, e),
        (a, e) => panic!("{ctx}.rekrutacja: actual={a:?} expected={e:?}"),
    }
}

// ---------------------------------------------------------------- rekrutacja (enqueue / dequeue)

#[test]
fn enqueue_and_dequeue_match_web() {
    let root = load(RECRUIT_JSON);
    let mut n = 0;
    for c in root["prodCases"].as_array().unwrap() {
        let prod = prod_from(&c["prod"]);
        match c["op"].as_str().unwrap() {
            "enqueue" => {
                let item = item_from(&c["item"]);
                assert_prod("enqueue", &enqueue_recruitment(&prod, &item), &c["out"]);
            }
            "dequeue" => {
                let idx = c["index"].as_i64().expect("index");
                assert_prod("dequeue", &dequeue_recruitment(&prod, idx), &c["out"]);
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 44, "liczba przypadkow kolejki");
}

// ---------------------------------------------------------------- advance / rush

#[test]
fn advance_recruitment_matches_web() {
    let root = load(RECRUIT_JSON);
    let mut n = 0;
    for c in root["advCases"].as_array().unwrap() {
        let prod = prod_from(&c["prod"]);
        match c["op"].as_str().unwrap() {
            "advanceRecruitment" => {
                // Brak `max` = domyslny RECRUIT_UNITS_PER_TURN (1).
                let max = dec_opt(c.get("max")).unwrap_or(1.0);
                let out: AdvanceRecruitmentResult = advance_recruitment(&prod, max);
                assert_prod("advance", &out.prod, &c["out"]["prod"]);
                assert_items("advance.completed", &out.completed, &c["out"]["completed"]);
            }
            "advanceRecruitmentGated" => {
                let city = &c["city"];
                let out: AdvanceRecruitmentGatedResult = advance_recruitment_gated(
                    &prod,
                    (dec(&city["population"]), dec_opt(city.get("manpower"))),
                    c["epoka"].as_f64().expect("epoka"),
                    1.0,
                    c["costAlreadyPaid"].as_bool().unwrap(),
                    1.0,
                    1.0,
                );
                assert_prod("gated", &out.prod, &c["out"]["prod"]);
                assert_items("gated.completed", &out.completed, &c["out"]["completed"]);
                assert_num("gated.population", out.population, &c["out"]["population"]);
                assert_num("gated.manpower", out.manpower, &c["out"]["manpower"]);
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 444, "liczba przypadkow advance");
}

#[test]
fn rush_matches_web() {
    let root = load(RECRUIT_JSON);
    let mut n = 0;
    for c in root["rushCases"].as_array().unwrap() {
        let prod = prod_from(&c["prod"]);
        match c["op"].as_str().unwrap() {
            "rushProduction" => {
                let out = rush_production(&prod);
                assert_prod("rush", &out.prod, &c["out"]["prod"]);
                match (&out.completed, c["out"]["completed"].is_null()) {
                    (None, true) => {}
                    (Some(item), false) => {
                        assert_item("rush.completed", item, &c["out"]["completed"])
                    }
                    other => panic!("rush.completed {other:?}"),
                }
            }
            "rushCost" => {
                let modifier = dec_opt(c.get("modifier")).unwrap_or(0.0);
                assert_num("rushCost", rush_cost(&prod, modifier), &c["out"]);
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 36, "liczba przypadkow rush");
}

// ---------------------------------------------------------------- praca / podzial

#[test]
fn praca_split_matches_web() {
    let root = load(PRAJA_JSON);
    let mut n = 0;
    for c in root["pracaCases"].as_array().unwrap() {
        match c["op"].as_str().unwrap() {
            "cityPracaInteger" => {
                assert_num(
                    "cityPracaInteger",
                    city_praca_integer(dec(&c["in"])),
                    &c["out"],
                );
            }
            "splitPraca" => {
                // Brak `u` = undefined w webie = udzial nie-skonczony -> 1 (NaN daje ten sam wynik).
                let u = dec_opt(c.get("u")).unwrap_or(f64::NAN);
                let out = split_praca(dec(&c["total"]), u);
                assert_num("splitPraca.total", out.total, &c["out"]["total"]);
                assert_num(
                    "splitPraca.doBudynkow",
                    out.do_budynkow,
                    &c["out"]["doBudynkow"],
                );
                assert_num("splitPraca.doPuli", out.do_puli, &c["out"]["doPuli"]);
            }
            "pracaImperialPoolGain" => {
                let split = PracaSplitTick {
                    do_budynkow: c["split"]["doBudynkow"].as_f64().unwrap(),
                    do_puli: c["split"]["doPuli"].as_f64().unwrap(),
                };
                let qe = c["queueEmpty"].as_bool().unwrap();
                assert_num(
                    "pracaImperialPoolGain",
                    praca_imperial_pool_gain(&split, qe),
                    &c["out"],
                );
            }
            "previewPracaPoolBrutto" => {
                let ticks: Vec<PracaSplitTick> = c["ticks"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|t| PracaSplitTick {
                        do_budynkow: t["doBudynkow"].as_f64().unwrap(),
                        do_puli: t["doPuli"].as_f64().unwrap(),
                    })
                    .collect();
                let qe: Vec<bool> = c["queueEmpty"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|b| b.as_bool().unwrap())
                    .collect();
                let paused: Option<Vec<bool>> = match c.get("paused") {
                    None => None,
                    Some(x) if x.get("absent").is_some() => None,
                    Some(x) => Some(
                        x.as_array()
                            .unwrap()
                            .iter()
                            .map(|b| b.as_bool().unwrap())
                            .collect(),
                    ),
                };
                let out = preview_praca_pool_brutto(&ticks, &qe, paused.as_deref());
                assert_num("previewPracaPoolBrutto", out, &c["out"]);
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 232, "liczba przypadkow praca");
}

// ---------------------------------------------------------------- podzial outputu

fn shares_from(v: &Value) -> Option<OutputShares> {
    if v.get("absent").is_some() {
        return None;
    }
    Some(OutputShares {
        produkcja: dec(&v["produkcja"]),
        pieniadz: dec(&v["pieniadz"]),
        nauka: dec(&v["nauka"]),
        rozwoj: dec(&v["rozwoj"]),
    })
}

#[test]
fn output_split_matches_web() {
    let root = load(OUTPUT_JSON);
    let mut n = 0;
    for c in root["outCases"].as_array().unwrap() {
        let total = dec(&c["total"]);
        let shares = shares_from(&c["shares"]);
        match c["op"].as_str().unwrap() {
            "splitOutput" => {
                let out = split_output(total, shares.as_ref());
                assert_num(
                    "splitOutput.produkcja",
                    out.produkcja,
                    &c["out"]["produkcja"],
                );
                assert_num("splitOutput.pieniadz", out.pieniadz, &c["out"]["pieniadz"]);
                assert_num("splitOutput.nauka", out.nauka, &c["out"]["nauka"]);
                assert_num("splitOutput.rozwoj", out.rozwoj, &c["out"]["rozwoj"]);
            }
            "cityScienceMoneyOutput" => {
                assert_num(
                    "cityScience",
                    city_science_output(total, shares.as_ref()),
                    &c["nauka"],
                );
                assert_num(
                    "cityMoney",
                    city_money_output(total, shares.as_ref()),
                    &c["pieniadz"],
                );
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 360, "liczba przypadkow output");
}

// ---------------------------------------------------------------- koszt jednostki

/// Wiersz jednostki z projekcji `unitsProj` (pola UnitDef czytane przez production.ts 1-692).
fn unit_row_from(v: &Value) -> UnitCostRow {
    UnitCostRow {
        jednostka: v["Jednostka"].as_str().unwrap_or("").to_string(),
        epoka: opt_str(v.get("Epoka")),
        pieniadz_koszt: dec_opt(v.get("Pieniądz (koszt)")),
        super_jednostka: opt_str(v.get("Super-jednostka")),
        rola: opt_str(v.get("Rola (linia)")),
        surowiec: opt_str(v.get("Surowiec")),
    }
}

#[test]
fn unit_cost_matches_web() {
    let root = load(UNIT_COST_JSON);
    let catalog = load(CATALOG_JSON);
    let units: Vec<UnitCostRow> = catalog["unitsProj"]
        .as_array()
        .unwrap()
        .iter()
        .map(unit_row_from)
        .collect();
    // Definicje syntetyczne jak w generatorze (Syn-A..Syn-D).
    let synth: BTreeMap<&str, UnitCostRow> = [
        (
            "Syn-A",
            UnitCostRow {
                jednostka: "Syn-A".into(),
                epoka: Some("Kamień".into()),
                pieniadz_koszt: Some(0.0),
                rola: Some("Wsparcie".into()),
                ..Default::default()
            },
        ),
        (
            "Syn-B",
            UnitCostRow {
                jednostka: "Syn-B".into(),
                epoka: Some("Żelazo".into()),
                pieniadz_koszt: Some(7.6),
                rola: Some("Konnica".into()),
                ..Default::default()
            },
        ),
        (
            "Syn-C",
            UnitCostRow {
                jednostka: "Syn-C".into(),
                epoka: None,
                pieniadz_koszt: Some(f64::NAN),
                rola: Some("Dystans".into()),
                ..Default::default()
            },
        ),
        (
            "Syn-D",
            UnitCostRow {
                jednostka: "Syn-D".into(),
                epoka: Some("Brąz".into()),
                pieniadz_koszt: Some(-3.0),
                rola: Some("Wrecz".into()),
                ..Default::default()
            },
        ),
    ]
    .into_iter()
    .collect();
    let mut n = 0;
    for c in root["unitCases"].as_array().unwrap() {
        let def: UnitCostRow = match c.get("name").and_then(Value::as_str) {
            Some(name) => units
                .iter()
                .find(|u| u.jednostka == name)
                .cloned()
                .expect("jednostka w units.json"),
            None => synth[c["synth"].as_str().unwrap()].clone(),
        };
        match c["op"].as_str().unwrap() {
            "unitCostMode" => assert_eq!(unit_cost_mode(&def), c["out"].as_str().unwrap()),
            "unitPurchaseCost" => {
                let out = unit_purchase_cost(&def, &[], None, 0, Difficulty::Normal);
                assert_num(
                    &format!("unitPurchaseCost {}", def.jednostka),
                    out,
                    &c["out"],
                );
            }
            other => panic!("op {other}"),
        }
        n += 1;
    }
    assert_eq!(n, 158, "liczba przypadkow koszt jednostki");
}

// ---------------------------------------------------------------- katalog epoki (realne dane)

fn bmap_from(v: &Value) -> Option<BTreeMap<String, Option<f64>>> {
    if v.get("absent").is_some() {
        return None;
    }
    v.as_object().map(|o| {
        o.iter()
            .map(|(k, x)| (k.clone(), if x.is_null() { None } else { Some(dec(x)) }))
            .collect()
    })
}

fn era_row_from(v: &Value) -> EraBuildingRow {
    EraBuildingRow {
        avail: BuildingAvailRow {
            cost: BuildingCostRow {
                id: v["id"].as_str().unwrap_or("").to_string(),
                nazwa: v["nazwa"].as_str().unwrap_or("").to_string(),
                koszt_budowy: dec_opt(v.get("kosztBudowy")).unwrap_or(f64::NAN),
                przyrost_kosztu: dec_opt(v.get("przyrostKosztu")).unwrap_or(f64::NAN),
                epoka_wejscia: dec_opt(v.get("epokaWejscia")),
                lokalizacja: opt_str(v.get("lokalizacja")),
            },
            upgrade_from: opt_str(v.get("upgradeFrom")),
            suppressed: opt_bool(v.get("suppressed")),
            tech_unlock: opt_str(v.get("techUnlock")),
            wymagany_surowiec: opt_str(v.get("wymaganySurowiec")),
            odblokowuje: opt_str(v.get("odblokowuje")),
        },
        kategoria: opt_str(v.get("kategoria")).unwrap_or_default(),
        wielokrotny: opt_bool(v.get("wielokrotny")),
        wymagania: opt_str(v.get("wymagania")),
        koszt_surowce: v.get("koszt_surowce").and_then(bmap_from),
    }
}

fn status_of(s: &str) -> BuildingCatalogStatus {
    match s {
        "ready" => BuildingCatalogStatus::Ready,
        "locked" => BuildingCatalogStatus::Locked,
        "built" => BuildingCatalogStatus::Built,
        "queued" => BuildingCatalogStatus::Queued,
        other => panic!("status {other}"),
    }
}

fn assert_entry(ctx: &str, actual: &BuildingCatalogEntry, expected: &Value) {
    assert_eq!(actual.id, expected["id"].as_str().unwrap(), "{ctx} id");
    assert_eq!(
        actual.nazwa,
        expected["nazwa"].as_str().unwrap(),
        "{ctx} nazwa"
    );
    assert_eq!(
        actual.kategoria,
        expected["kategoria"].as_str().unwrap_or(""),
        "{ctx} kategoria"
    );
    assert_num(&format!("{ctx} koszt"), actual.koszt, &expected["koszt"]);
    assert_eq!(
        actual.status,
        status_of(expected["status"].as_str().unwrap()),
        "{ctx} status"
    );
    assert_eq!(
        actual.missing_tech,
        expected["missingTech"].as_str().unwrap(),
        "{ctx} missingTech"
    );
    assert_eq!(
        actual.wymagania,
        expected["wymagania"].as_str().unwrap(),
        "{ctx} wymagania"
    );
    assert_eq!(
        actual.location_blocked,
        opt_str(expected.get("locationBlocked")),
        "{ctx} locationBlocked"
    );
}

#[test]
fn era_building_catalog_matches_web() {
    let root = load(CATALOG_JSON);
    let rows: Vec<EraBuildingRow> = root["buildingsProj"]
        .as_array()
        .unwrap()
        .iter()
        .map(era_row_from)
        .collect();
    let mut n = 0;
    for c in root["catCases"].as_array().unwrap() {
        let cx = &c["ctx"];
        let built: Vec<&str> = cx["builtBuildingIds"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap())
            .collect();
        let queue: Vec<ProductionItem> = items_from(&cx["productionQueue"]);
        let techs: Vec<&str> = c["techs"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap())
            .collect();
        let stock: Option<StockMap> = match cx.get("empireResourceStock") {
            None => None,
            Some(x) if x.get("absent").is_some() => None,
            Some(x) => Some(
                x.as_object()
                    .unwrap()
                    .iter()
                    .map(|(k, val)| (k.clone(), dec(val)))
                    .collect(),
            ),
        };
        let empire_built: Option<Vec<String>> = match cx.get("empireBuiltIds") {
            None => None,
            Some(x) if x.get("absent").is_some() => None,
            Some(x) => Some(
                x.as_array()
                    .unwrap()
                    .iter()
                    .map(|s| s.as_str().unwrap().to_string())
                    .collect(),
            ),
        };
        let ctx = EraCatalogCtx {
            epoch: dec(&cx["epoch"]),
            building_level: dec(&cx["buildingLevel"]),
            built_building_ids: &built,
            production_queue: &queue,
            is_capital: opt_bool(cx.get("isCapital")),
            empire_resource_stock: stock.as_ref(),
            empire_built_ids: empire_built.as_deref(),
            owner_id: cx["ownerId"].as_i64().unwrap(),
            difficulty: Difficulty::Normal,
        };
        let out = era_building_catalog(&rows, &techs, &ctx);
        let exp = c["out"].as_array().unwrap();
        assert_eq!(out.len(), exp.len(), "{} dlugosc", c["name"]);
        for (i, (a, e)) in out.iter().zip(exp.iter()).enumerate() {
            assert_entry(&format!("{}[{i}]", c["name"]), a, e);
        }
        n += 1;
    }
    assert_eq!(n, 450, "liczba kontekstow katalogu");
}

// ---------------------------------------------------------------- filtry dostepnosci (sanity)

#[test]
fn buildable_and_purchasable_empty_input() {
    let ctx = ProductionAvailabilityCtx {
        epoch: 1.0,
        building_level: 1.0,
        built_building_ids: &[],
        production_queue: &[],
        unlocked_techs: &[],
        civ_key: None,
        civ_unit_nacja: None,
        city_has_coast_or_river: false,
        show_stock_gated_units: true,
        show_resource_gated_buildings: true,
        alive_unit_type_names: &[],
        empire_built_ids: None,
        cost: AvailabilityContext::default(),
    };
    let buildings: Vec<BuildingAvailRow> = Vec::new();
    let units: Vec<UnitReplaceRow> = Vec::new();
    assert!(buildable_production(&buildings, &units, &ctx).is_empty());
    assert!(purchasable_units(&buildings, &units, &ctx).is_empty());
}

#[test]
fn enqueue_non_unit_is_identity() {
    let prod = CityProduction {
        kolejka: vec![],
        postep: 3.0,
        wstrzymana: Some(true),
        rekrutacja: None,
    };
    let item = ProductionItem {
        kind: ProductionKind::Budynek,
        id: "koszary".into(),
        nazwa: "Koszary".into(),
        koszt: 30.0,
        postep: None,
        is_general: None,
    };
    assert_eq!(enqueue_recruitment(&prod, &item), prod);
}

// ---------------------------------------------------------------- progi N-1 / N / N+1, NaN, brakujace klucze

fn item(kind: ProductionKind, id: &str, koszt: f64) -> ProductionItem {
    ProductionItem {
        kind,
        id: id.into(),
        nazwa: id.into(),
        koszt,
        postep: None,
        is_general: None,
    }
}

#[test]
fn praca_rounding_thresholds_n_minus_n_plus() {
    // cityPracaInteger: Math.round z polowka w strone +Infinity; <=0 i NaN -> 0.
    assert_eq!(city_praca_integer(0.49), 0.0);
    assert_eq!(city_praca_integer(0.5), 1.0);
    assert_eq!(city_praca_integer(0.51), 1.0);
    assert_eq!(city_praca_integer(f64::NAN), 0.0);
    assert_eq!(city_praca_integer(-0.5), 0.0);
    // splitPraca: doBudynkow = Math.round(total * u); pula dostaje reszte.
    assert_eq!(split_praca(3.0, 0.5).do_budynkow, 2.0); // 1.5 -> 2
    assert_eq!(split_praca(3.0, 0.5).do_puli, 1.0);
    assert_eq!(split_praca(3.0, 0.49).do_budynkow, 1.0); // 1.47 -> 1
                                                         // Udzial NaN = 1 (wszystko do budynkow); u > 1 zaciskane do 1; u < 0 do 0.
    assert_eq!(split_praca(5.0, f64::NAN).do_puli, 0.0);
    assert_eq!(split_praca(5.0, 2.0).do_puli, 0.0);
    assert_eq!(split_praca(5.0, -1.0).do_budynkow, 0.0);
}

#[test]
fn rush_cost_boundaries() {
    // Reszta = ceil(koszt - postep), nigdy ponizej 0; modyfikator nie-skonczony = 0.
    let prod = |koszt: f64, postep: f64| CityProduction {
        kolejka: vec![item(ProductionKind::Budynek, "koszary", koszt)],
        postep,
        wstrzymana: None,
        rekrutacja: None,
    };
    assert_eq!(rush_cost(&prod(30.0, 29.0), 0.0), 1.0); // N-1 reszty
    assert_eq!(rush_cost(&prod(30.0, 30.0), 0.0), 0.0); // N
    assert_eq!(rush_cost(&prod(30.0, 31.0), 0.0), 0.0); // N+1: nie ujemne
    assert_eq!(rush_cost(&prod(30.0, 29.5), 0.0), 1.0); // ulamek w gore
    assert_eq!(rush_cost(&prod(30.0, 0.0), f64::NAN), 30.0);
    assert_eq!(rush_cost(&prod(30.0, 0.0), f64::INFINITY), 30.0);
    assert_eq!(rush_cost(&prod(30.0, 0.0), 1.0), 60.0);
    assert_eq!(rush_cost(&CityProduction::default(), 1.0), 0.0);
}

#[test]
fn gated_manpower_n_minus_n_plus() {
    // Koszt manpower jednostki (epoka 1) z danych pinu; N = dokladnie wystarczajaca pula.
    let prod = CityProduction {
        kolejka: vec![],
        postep: 0.0,
        wstrzymana: None,
        rekrutacja: Some(vec![item(ProductionKind::Jednostka, "Wojownik", 10.0)]),
    };
    let mp_need = civ_engine::domain::recruitment::manpower::unit_manpower_cost_for_type(
        Some("Wojownik"),
        1.0,
        1.0,
        1.0,
    );
    assert!(mp_need > 0.0, "dane: koszt manpower > 0 (bylo {mp_need})");
    let at = advance_recruitment_gated(&prod, (100.0, Some(mp_need)), 1.0, 1.0, false, 1.0, 1.0);
    assert_eq!(at.completed.len(), 1, "N: zdjete");
    let below = advance_recruitment_gated(
        &prod,
        (100.0, Some(mp_need - 1.0)),
        1.0,
        1.0,
        false,
        1.0,
        1.0,
    );
    assert_eq!(below.completed.len(), 0, "N-1: nic nie zdjete");
    assert_eq!(below.prod.rekrutacja.as_ref().map(Vec::len), Some(1));
    // Brak pola manpower (undefined) = pula maksymalna -> zdjete.
    let absent = advance_recruitment_gated(&prod, (100.0, None), 1.0, 1.0, false, 1.0, 1.0);
    assert_eq!(absent.completed.len(), 1, "brak manpower = max");
    // costAlreadyPaid: zdejmuje bez sprawdzania puli.
    let paid = advance_recruitment_gated(&prod, (0.0, Some(0.0)), 1.0, 1.0, true, 1.0, 1.0);
    assert_eq!(paid.completed.len(), 1, "oplacone: zdjete");
}

#[test]
fn advance_recruitment_nan_limit_completes_nothing() {
    let prod = CityProduction {
        kolejka: vec![],
        postep: 0.0,
        wstrzymana: None,
        rekrutacja: Some(vec![
            item(ProductionKind::Jednostka, "Wojownik", 10.0),
            item(ProductionKind::Jednostka, "Galera", 7.5),
        ]),
    };
    // JS slice(0, NaN) = pusty: nic nie zdjete, cala kolejka zostaje.
    let out = advance_recruitment(&prod, f64::NAN);
    assert!(out.completed.is_empty());
    assert_eq!(out.prod.rekrutacja.as_ref().map(Vec::len), Some(2));
    // N-1 / N / N+1 jako limit.
    assert_eq!(advance_recruitment(&prod, 1.0).completed.len(), 1);
    assert_eq!(advance_recruitment(&prod, 2.0).completed.len(), 2);
    assert_eq!(advance_recruitment(&prod, 3.0).completed.len(), 2);
}

#[test]
fn output_split_sums_to_total_and_falls_back() {
    let shares = OutputShares {
        produkcja: 1.0,
        pieniadz: 1.0,
        nauka: 1.0,
        rozwoj: 1.0,
    };
    for total in [1.0, 2.0, 7.0, 10.0, 1234.0] {
        let s = split_output(total, Some(&shares));
        assert_eq!(
            s.produkcja + s.pieniadz + s.nauka + s.rozwoj,
            total,
            "suma == total dla {total}"
        );
    }
    let zero = OutputShares {
        produkcja: 0.0,
        pieniadz: 0.0,
        nauka: 0.0,
        rozwoj: 0.0,
    };
    let s = split_output(9.0, Some(&zero));
    assert_eq!(
        (s.produkcja, s.pieniadz, s.nauka, s.rozwoj),
        (9.0, 0.0, 0.0, 0.0)
    );
    assert_eq!(split_output(f64::NAN, None).produkcja, 0.0);
    assert_eq!(split_output(-4.0, None).rozwoj, 0.0);
}
