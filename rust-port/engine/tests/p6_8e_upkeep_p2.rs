//! P6.8E-P2 - `economy-upkeep.ts` (web pin 91dc998a), czesc P2: utrzymanie budynkow/jednostek, zywnosc
//! wojska i saldo skarbca (sekcja B). Wektory z URUCHOMIONEGO weba (`tests/p6_8e_vectors/economy_upkeep_p2.json`,
//! generator `gen-p6-8e-vectors-p2.mjs` w runie R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1; dane: buildings.json,
//! units.json, econ-params.json z pinu). Porownanie BITOWE f64. Kodowanie jak w P1.

use std::collections::BTreeMap;

use civ_engine::domain::building_costs::p6_7b::{EpochInput, StockRecord};
use civ_engine::domain::turn_economy::economy_upkeep_p1 as p1;
use civ_engine::domain::turn_economy::economy_upkeep_p2 as eu;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8e_vectors/economy_upkeep_p2.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory P2 parse")
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

fn try_num(v: &Value) -> Option<f64> {
    match v {
        Value::Number(n) => n.as_f64(),
        Value::Object(o) if o.contains_key("$f") => Some(
            o["$f"]
                .as_str()
                .expect("$f napis")
                .parse::<f64>()
                .expect("$f liczba"),
        ),
        Value::Object(o) if o.contains_key("$n") => Some(match o["$n"].as_str().expect("$n") {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            other => panic!("nieznana liczba specjalna {other}"),
        }),
        _ => None,
    }
}

fn num(v: &Value) -> f64 {
    try_num(v).unwrap_or_else(|| panic!("oczekiwano liczby, jest {v}"))
}

/// Opcjonalna liczba: brak klucza / null / nie-liczba -> None.
fn opt(v: Option<&Value>) -> Option<f64> {
    v.and_then(try_num)
}

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn assert_same(label: &str, got: f64, want: f64) {
    assert!(
        same(got, want),
        "{label}: got {got:?} ({:#018x}), web {want:?} ({:#018x})",
        got.to_bits(),
        want.to_bits()
    );
}

fn difficulty(s: &str) -> p1::Difficulty {
    match s {
        "easy" => p1::Difficulty::Easy,
        "normal" => p1::Difficulty::Normal,
        "hard" => p1::Difficulty::Hard,
        other => panic!("nieznana trudnosc {other}"),
    }
}

fn raw_from(v: &Value) -> p1::RawEconParamsForUpkeep {
    let group = |name: &str| -> Option<p1::RawGroup> {
        let g = v.get(name)?.as_object()?;
        let mut out = BTreeMap::new();
        for (key, row) in g {
            let mut r = BTreeMap::new();
            for (d, cell) in row.as_object().expect("wiersz obiekt") {
                let c = match try_num(cell) {
                    Some(x) => p1::RawCell::Num(x),
                    None => p1::RawCell::Other,
                };
                r.insert(d.clone(), c);
            }
            out.insert(key.clone(), r);
        }
        Some(out)
    };
    p1::RawEconParamsForUpkeep {
        ekonomia_miasta: group("ekonomia_miasta"),
        budynki: group("budynki"),
        globalne: group("globalne"),
    }
}

fn map_from(v: &Value) -> BTreeMap<String, f64> {
    v.as_object()
        .map(|o| {
            o.iter()
                .filter_map(|(k, x)| try_num(x).map(|n| (k.clone(), n)))
                .collect()
        })
        .unwrap_or_default()
}

fn assert_map(label: &str, got: &BTreeMap<String, f64>, want: &Value) {
    let want = want.as_object().expect("oczekiwana mapa");
    assert_eq!(
        got.keys().collect::<Vec<_>>(),
        want.keys().collect::<Vec<_>>(),
        "{label}: rozne klucze"
    );
    for (k, w) in want {
        assert_same(&format!("{label}[{k}]"), got[k], num(w));
    }
}

/// Wartosc JSON -> `Option<f64>` jako pole `Option` (brak / null / nie-liczba = None).
fn building_from(v: &Value) -> eu::BuildingRecord {
    let koszt = match v.get("koszt") {
        None | Some(Value::Null) => None,
        Some(obj) => Some(
            obj.as_object()
                .expect("koszt obiekt")
                .iter()
                .map(|(k, x)| (k.clone(), try_num(x)))
                .collect::<BTreeMap<String, Option<f64>>>(),
        ),
    };
    eu::BuildingRecord {
        id: v["id"].as_str().expect("id").to_string(),
        utrzymanie: opt(v.get("utrzymanie")),
        przyrost_utrzymania: opt(v.get("przyrost")),
        epoka_wejscia: opt(v.get("epoka")),
        koszt_surowce: koszt,
    }
}

fn catalog() -> Vec<eu::BuildingRecord> {
    arr(&vectors(), "fullCatalog")
        .iter()
        .map(building_from)
        .collect()
}

fn instances(v: &Value) -> Vec<eu::BuildingInstanceLike> {
    v.as_array()
        .expect("instancje")
        .iter()
        .map(|i| eu::BuildingInstanceLike {
            record: building_from(&i["rec"]),
            level: num(&i["level"]),
        })
        .collect()
}

fn epoch_from(v: Option<&Value>) -> EpochInput {
    match v {
        Some(Value::String(s)) => EpochInput::Text(s.clone()),
        Some(x) => match try_num(x) {
            Some(n) => EpochInput::Number(n),
            None => EpochInput::Other,
        },
        None => EpochInput::Other,
    }
}

fn str_opt(v: Option<&Value>) -> Option<String> {
    v.and_then(|x| x.as_str().map(|s| s.to_string()))
}

/// Definicja jednostki (pola z units.json, zakodowane) -> wejscie dla utrzymania surowcowego.
fn upkeep_src(v: &Value) -> eu::UnitResourceUpkeepSource {
    eu::UnitResourceUpkeepSource {
        epoka: epoch_from(v.get("Epoka")),
        utrzymanie_surowiec: str_opt(v.get("Utrzymanie surowiec")),
        utrzymanie_surowiec_ilosc: opt(v.get("Utrzymanie surowiec (ilość)")),
    }
}

fn recruit_src(v: &Value) -> eu::UnitRecruitSource {
    eu::UnitRecruitSource {
        jednostka: str_opt(v.get("Jednostka")),
        typ: str_opt(v.get("Typ")),
        epoka: epoch_from(v.get("Epoka")),
        surowiec: str_opt(v.get("Surowiec")),
        surowiec_ilosc: opt(v.get("Surowiec (ilość)")),
        utrzymanie_surowiec: str_opt(v.get("Utrzymanie surowiec")),
        utrzymanie_surowiec_ilosc: opt(v.get("Utrzymanie surowiec (ilość)")),
    }
}

/// Wiersz units.json: pary [klucz, komorka] w kolejnosci z JSON.
fn unit_row(v: &Value) -> eu::UnitRow {
    v.as_array()
        .expect("wiersz")
        .iter()
        .map(|pair| {
            let k = pair[0].as_str().expect("klucz").to_string();
            let cell = &pair[1];
            let c = match cell {
                Value::Null => eu::UnitCell::Null,
                Value::String(s) => eu::UnitCell::Text(s.clone()),
                other => match try_num(other) {
                    Some(n) => eu::UnitCell::Num(n),
                    None => eu::UnitCell::Other,
                },
            };
            (k, c)
        })
        .collect()
}

fn params_from(v: &Value) -> p1::UpkeepParams {
    let mut p = p1::DEFAULT_UPKEEP_PARAMS;
    p.zywnosc_jednostka_ruch = num(&v["ruch"]);
    p.zywnosc_jednostka_oboz = num(&v["oboz"]);
    p.zywnosc_mnoznik_terytorium = num(&v["terytorium"]);
    p.zywnosc_mnoznik_poza_terytorium = num(&v["poza"]);
    p.budynek_utrzymanie_flat = opt(v.get("flat"));
    p.jednostka_utrzymanie_std = num(&v["jednostka"]);
    p
}

/// Parametry zywnosci (4 pola z wektora); pola zlota/budynkow zostaja domyslne (nieuzywane przez zywnosc).
fn food_params_from(v: &Value) -> p1::UpkeepParams {
    let mut p = p1::DEFAULT_UPKEEP_PARAMS;
    p.zywnosc_jednostka_ruch = num(&v["ruch"]);
    p.zywnosc_jednostka_oboz = num(&v["oboz"]);
    p.zywnosc_mnoznik_terytorium = num(&v["terytorium"]);
    p.zywnosc_mnoznik_poza_terytorium = num(&v["poza"]);
    p
}

fn stock_from(v: &Value) -> StockRecord {
    v.as_object()
        .map(|o| {
            o.iter()
                .filter_map(|(k, x)| try_num(x).map(|n| (k.clone(), n)))
                .collect()
        })
        .unwrap_or_default()
}

fn pool_from(v: &Value) -> Option<StockRecord> {
    if v.is_null() {
        None
    } else {
        Some(stock_from(v))
    }
}

#[test]
fn defaults_and_load_upkeep_match_web() {
    let v = vectors();
    let d = &v["defaultsUpkeep"];
    let want_default = params_from(d);
    assert_eq!(want_default, p1::DEFAULT_UPKEEP_PARAMS);
    for (i, c) in arr(&v, "loadUpkeep").iter().enumerate() {
        let raw = raw_from(&c["raw"]);
        let got = eu::load_upkeep_params(&raw, difficulty(c["difficulty"].as_str().unwrap()));
        let want = params_from(&c["out"]);
        assert_eq!(
            got.budynek_utrzymanie_flat.is_some(),
            want.budynek_utrzymanie_flat.is_some(),
            "loadUpkeep[{i}] flat"
        );
        if let (Some(g), Some(w)) = (got.budynek_utrzymanie_flat, want.budynek_utrzymanie_flat) {
            assert_same(&format!("loadUpkeep[{i}].flat"), g, w);
        }
        assert_same(
            &format!("loadUpkeep[{i}].ruch"),
            got.zywnosc_jednostka_ruch,
            want.zywnosc_jednostka_ruch,
        );
        assert_same(
            &format!("loadUpkeep[{i}].oboz"),
            got.zywnosc_jednostka_oboz,
            want.zywnosc_jednostka_oboz,
        );
        assert_same(
            &format!("loadUpkeep[{i}].terytorium"),
            got.zywnosc_mnoznik_terytorium,
            want.zywnosc_mnoznik_terytorium,
        );
        assert_same(
            &format!("loadUpkeep[{i}].poza"),
            got.zywnosc_mnoznik_poza_terytorium,
            want.zywnosc_mnoznik_poza_terytorium,
        );
        assert_same(
            &format!("loadUpkeep[{i}].jednostka"),
            got.jednostka_utrzymanie_std,
            want.jednostka_utrzymanie_std,
        );
    }
}

#[test]
fn building_upkeep_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "buildingUpkeep").iter().enumerate() {
        let rec = building_from(&c["rec"]);
        let got = eu::building_upkeep(&rec, num(&c["level"]), opt(c.get("flat")));
        assert_same(
            &format!("buildingUpkeep[{i}] {}", rec.id),
            got,
            num(&c["out"]),
        );
    }
}

#[test]
fn total_building_upkeep_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "totalBuildingUpkeep").iter().enumerate() {
        let got = eu::total_building_upkeep(&instances(&c["inst"]), opt(c.get("flat")));
        assert_same(&format!("totalBuildingUpkeep[{i}]"), got, num(&c["out"]));
    }
}

#[test]
fn building_resource_upkeep_matches_web() {
    let v = vectors();
    assert_same(
        "BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE",
        eu::BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE,
        num(&v["buildingResourceUnits"]),
    );
    for (i, c) in arr(&v, "buildingResourceUpkeep").iter().enumerate() {
        let rec = building_from(&c["rec"]);
        let got = eu::building_resource_upkeep(Some(&rec));
        assert_map(
            &format!("buildingResourceUpkeep[{i}] {}", rec.id),
            &got,
            &c["out"],
        );
    }
    for (i, c) in arr(&v, "totalBuildingResourceUpkeep").iter().enumerate() {
        let got = eu::total_building_resource_upkeep(&instances(&c["inst"]));
        assert_map(
            &format!("totalBuildingResourceUpkeep[{i}]"),
            &got,
            &c["out"],
        );
    }
    let cat = catalog();
    for (i, c) in arr(&v, "buildingResourceUpkeepForBuiltIds")
        .iter()
        .enumerate()
    {
        let built: Vec<String> = c["built"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        let got = eu::building_resource_upkeep_for_built_ids(&built, &cat);
        assert_map(
            &format!("buildingResourceUpkeepForBuiltIds[{i}]"),
            &got,
            &c["out"],
        );
    }
}

#[test]
fn preview_and_add_costs_match_web() {
    let v = vectors();
    let cat = catalog();
    for (i, c) in arr(&v, "previewOwnerBuildingResourceUpkeep")
        .iter()
        .enumerate()
    {
        let cities: Vec<eu::CityRef> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| eu::CityRef {
                id: x["id"].as_str().unwrap().to_string(),
                owner_id: x["ownerId"].as_i64().unwrap(),
            })
            .collect();
        let built: BTreeMap<String, Vec<String>> = c["built"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, ids)| {
                (
                    k.clone(),
                    ids.as_array()
                        .unwrap()
                        .iter()
                        .map(|x| x.as_str().unwrap().to_string())
                        .collect(),
                )
            })
            .collect();
        let got = eu::preview_owner_building_resource_upkeep(
            c["owner"].as_i64().unwrap(),
            &cities,
            &cat,
            &built,
        );
        assert_map(
            &format!("previewOwnerBuildingResourceUpkeep[{i}]"),
            &got,
            &c["out"],
        );
    }
    for (i, c) in arr(&v, "addResourceCosts").iter().enumerate() {
        let mut acc = map_from(&c["acc"]);
        eu::add_resource_costs(&mut acc, &map_from(&c["add"]));
        assert_map(&format!("addResourceCosts[{i}]"), &acc, &c["out"]);
    }
}

#[test]
fn unit_resource_upkeep_and_reserve_match_web() {
    let v = vectors();
    for (i, c) in arr(&v, "unitResourceUpkeep").iter().enumerate() {
        let got = eu::unit_resource_upkeep(Some(&upkeep_src(&c["def"])));
        assert_map(&format!("unitResourceUpkeep[{i}]"), &got, &c["out"]);
    }
    for (i, c) in arr(&v, "unitRecruitUpkeepReserve").iter().enumerate() {
        let got = eu::unit_recruit_upkeep_reserve(Some(&upkeep_src(&c["def"])), num(&c["turns"]));
        assert_map(&format!("unitRecruitUpkeepReserve[{i}]"), &got, &c["out"]);
    }
    assert_same(
        "UNIT_RECRUIT_UPKEEP_RESERVE_TURNS",
        eu::UNIT_RECRUIT_UPKEEP_RESERVE_TURNS,
        num(&v["reserveTurnsDefault"]),
    );
    assert_eq!(
        eu::UNIT_RECRUIT_STOCK_ONLY_HINT,
        v["stockOnlyHint"].as_str().unwrap()
    );
}

#[test]
fn recruitment_gate_matches_web() {
    let v = vectors();
    for (i, c) in arr(&v, "recruit").iter().enumerate() {
        let pool = pool_from(&c["pool"]);
        let def = if c["def"].is_null() {
            None
        } else {
            Some(recruit_src(&c["def"]))
        };
        let pool_ref = pool.as_ref();
        let stock = eu::can_afford_unit_recruit_stock(pool_ref, def.as_ref());
        assert_eq!(stock, c["stock"].as_bool().unwrap(), "recruit[{i}] stock");
        assert_eq!(
            eu::can_afford_unit_recruit_full(pool_ref, def.as_ref()),
            c["full"].as_bool().unwrap(),
            "recruit[{i}] full"
        );
        let hint = eu::pick_unit_recruit_hint(pool_ref, def.as_ref());
        match (&hint, c["hint"].as_str()) {
            (None, None) => {}
            (Some(h), Some(w)) => assert_eq!(*h, w, "recruit[{i}] hint"),
            _ => panic!("recruit[{i}] hint: got {hint:?}, web {:?}", c["hint"]),
        }
        for ch in arr(c, "chip") {
            let key = ch["key"].as_str().unwrap();
            let got = eu::is_unit_recruit_stock_chip_missing(pool_ref, def.as_ref(), key);
            assert_eq!(got, ch["out"].as_bool().unwrap(), "recruit[{i}] chip {key}");
        }
    }
}

#[test]
fn default_unit_upkeep_by_category_matches_web() {
    let v = vectors();
    let want = arr(&v, "defaultUnitUpkeepByCategory");
    assert_eq!(eu::DEFAULT_UNIT_UPKEEP_BY_CATEGORY.len(), want.len());
    for ((k, val), w) in eu::DEFAULT_UNIT_UPKEEP_BY_CATEGORY.iter().zip(want) {
        assert_eq!(*k, w[0].as_str().unwrap());
        assert_same(&format!("kategoria {k}"), *val, num(&w[1]));
    }
}

#[test]
fn unit_gold_upkeep_tables_match_web() {
    let v = vectors();
    let t = &v["buildUnitUpkeepTable"];
    let rows: Vec<eu::UnitRow> = arr(t, "rows").iter().map(unit_row).collect();
    let got = eu::build_unit_upkeep_table(&rows);
    assert_map("buildUnitUpkeepTable", &got, &t["out"]);
    // Syntetyczne wiersze sa dopisane na koncu (generator: 10 wierszy).
    const SYNTHETIC_UNIT_ROWS: usize = 10;
    let synthetic_start = rows.len() - SYNTHETIC_UNIT_ROWS;
    let got_syn = eu::build_unit_upkeep_table(&rows[synthetic_start..]);
    assert_map(
        "buildUnitUpkeepTable(synthetic)",
        &got_syn,
        &t["outSynthetic"],
    );

    for (i, c) in arr(&v, "unitUpkeep").iter().enumerate() {
        let unit = eu::UnitUpkeepLike {
            type_id: c["unit"]["typeId"].as_str().unwrap().to_string(),
            category: c["unit"]["category"].as_str().unwrap().to_string(),
        };
        let table = map_from(&c["table"]);
        let got = eu::unit_upkeep(&unit, &table, num(&c["std"]));
        assert_same(&format!("unitUpkeep[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&v, "totalUnitUpkeep").iter().enumerate() {
        let units: Vec<eu::UnitUpkeepLike> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| eu::UnitUpkeepLike {
                type_id: u["typeId"].as_str().unwrap().to_string(),
                category: u["category"].as_str().unwrap().to_string(),
            })
            .collect();
        let table = map_from(&c["table"]);
        let got = eu::total_unit_upkeep(&units, &table, num(&c["std"]));
        assert_same(&format!("totalUnitUpkeep[{i}]"), got, num(&c["out"]));
    }
}

fn resolve_table(v: &Value) -> BTreeMap<String, eu::UnitResourceUpkeepSource> {
    v["resolveUnitTable"]
        .as_object()
        .expect("resolveUnitTable")
        .iter()
        .map(|(k, def)| (k.clone(), upkeep_src(def)))
        .collect()
}

#[test]
fn unit_resource_totals_match_web() {
    let v = vectors();
    let table = resolve_table(&v);
    let resolve = |id: &str| table.get(id).cloned();
    for (i, c) in arr(&v, "totalUnitResourceUpkeep").iter().enumerate() {
        let units: Vec<eu::UnitTypeRef> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| eu::UnitTypeRef {
                type_id: u["typeId"].as_str().unwrap().to_string(),
            })
            .collect();
        let got = eu::total_unit_resource_upkeep(&units, resolve);
        assert_map(&format!("totalUnitResourceUpkeep[{i}]"), &got, &c["out"]);
    }
    let cat = catalog();
    for (i, c) in arr(&v, "previewOwnerTotalResourceUpkeep")
        .iter()
        .enumerate()
    {
        let cities: Vec<eu::CityRef> = c["cities"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| eu::CityRef {
                id: x["id"].as_str().unwrap().to_string(),
                owner_id: x["ownerId"].as_i64().unwrap(),
            })
            .collect();
        let built: BTreeMap<String, Vec<String>> = c["built"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, ids)| {
                (
                    k.clone(),
                    ids.as_array()
                        .unwrap()
                        .iter()
                        .map(|x| x.as_str().unwrap().to_string())
                        .collect(),
                )
            })
            .collect();
        let units: Vec<(i64, eu::UnitTypeRef)> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| {
                (
                    u["ownerId"].as_i64().unwrap(),
                    eu::UnitTypeRef {
                        type_id: u["typeId"].as_str().unwrap().to_string(),
                    },
                )
            })
            .collect();
        let got = eu::preview_owner_total_resource_upkeep(
            c["owner"].as_i64().unwrap(),
            &cities,
            &cat,
            &built,
            &units,
            resolve,
        );
        assert_map(
            &format!("previewOwnerTotalResourceUpkeep[{i}]"),
            &got,
            &c["out"],
        );
    }
}

#[test]
fn food_and_balance_match_web() {
    let v = vectors();
    let t = &v["buildUnitFoodTable"];
    let rows: Vec<eu::UnitRow> = arr(t, "rows").iter().map(unit_row).collect();
    let food_table = eu::build_unit_food_table(&rows);
    assert_map("buildUnitFoodTable", &food_table, &t["out"]);

    for (i, c) in arr(&v, "unitFoodPerTurn").iter().enumerate() {
        let unit = eu::UnitFoodLike {
            type_id: str_opt(c["unit"].get("typeId")),
            camping: c["unit"]["camping"].as_bool().unwrap(),
            on_own_territory: c["unit"]
                .get("onOwnTerritory")
                .map(|b| b.as_bool().unwrap()),
        };
        let p = food_params_from(&c["p"]);
        let table = map_from(&c["table"]);
        let got = eu::unit_food_per_turn(&unit, &p, &table);
        assert_same(&format!("unitFoodPerTurn[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&v, "militaryFoodConsumption").iter().enumerate() {
        let units: Vec<eu::UnitFoodLike> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| eu::UnitFoodLike {
                type_id: str_opt(u.get("typeId")),
                camping: u["camping"].as_bool().unwrap(),
                on_own_territory: u.get("onOwnTerritory").map(|b| b.as_bool().unwrap()),
            })
            .collect();
        let p = food_params_from(&c["p"]);
        let table = map_from(&c["table"]);
        let got = eu::military_food_consumption(&units, &p, &table);
        assert_same(
            &format!("militaryFoodConsumption[{i}]"),
            got,
            num(&c["out"]),
        );
    }
    for (i, c) in arr(&v, "upkeepBalance").iter().enumerate() {
        let units: Vec<eu::UnitUpkeepLike> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| eu::UnitUpkeepLike {
                type_id: u["typeId"].as_str().unwrap().to_string(),
                category: u["category"].as_str().unwrap().to_string(),
            })
            .collect();
        let p = params_from(&c["p"]);
        let table = map_from(&c["table"]);
        let got = eu::upkeep_balance(
            num(&c["income"]),
            &instances(&c["inst"]),
            &units,
            &table,
            &p,
        );
        let w = &c["out"];
        assert_same(
            &format!("upkeepBalance[{i}].budynki"),
            got.utrzymanie_budynki,
            num(&w["utrzymanieBudynki"]),
        );
        assert_same(
            &format!("upkeepBalance[{i}].jednostki"),
            got.utrzymanie_jednostki,
            num(&w["utrzymanieJednostki"]),
        );
        assert_same(
            &format!("upkeepBalance[{i}].razem"),
            got.utrzymanie_razem,
            num(&w["utrzymanieRazem"]),
        );
        assert_same(
            &format!("upkeepBalance[{i}].saldo"),
            got.saldo,
            num(&w["saldo"]),
        );
        assert_eq!(
            got.deficyt,
            w["deficyt"].as_bool().unwrap(),
            "upkeepBalance[{i}].deficyt"
        );
    }
}

#[test]
fn building_upkeep_for_built_ids_matches_web() {
    let v = vectors();
    let cat = catalog();
    for (i, c) in arr(&v, "buildingUpkeepForBuiltIds").iter().enumerate() {
        let built: Vec<String> = c["built"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        let levels: BTreeMap<String, f64> = c["levels"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), num(x)))
            .collect();
        let level_for = |b: &eu::BuildingRecord| levels.get(&b.id).copied().unwrap_or(1.0);
        let got = eu::building_upkeep_for_built_ids(&built, &cat, level_for, opt(c.get("flat")));
        assert_same(
            &format!("buildingUpkeepForBuiltIds[{i}]"),
            got,
            num(&c["out"]),
        );
    }
}
