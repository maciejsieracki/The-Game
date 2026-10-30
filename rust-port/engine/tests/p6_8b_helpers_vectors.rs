//! P6.8B-P1a (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba.
//!
//! Wektory: `tests/p6_8b_vectors/helpers.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/gen-p6-8b-helpers-vectors.mjs`
//! (Node 22 + loader TS, bez builda gra/; kod funkcji wycinany z `production.ts` 694-905 @91dc998a).
//!
//! Kodowanie: liczba calkowita = JSON number; niecalkowita = {"$f": "..."}; NaN/Infinity/-0 = {"$n": "..."};
//! wejscie nieobecne (undefined) = obiekt {"absent": true} (lub brak klucza w `ctx`); null = null.

use civ_engine::domain::production_units::{
    apply_completed_building_ids, availability_civ_nation, building_gold_purchase_cost,
    building_type_committed, building_type_queued, building_unlock_flag_for,
    civ_has_replacement_for, civ_special_unit_name_tokens, is_blank_replacement,
    is_building_superseded_by_upgrade, is_civ_special_replacement, unit_allowed_for_civ_nation,
    unit_matches_special_name, unit_nacja_for_civ_key, BuildingLinkRow, CivBonusValue,
    CivSpecialBonus, ProductionItem, ProductionKind, UnitReplacementRow,
};
use serde_json::Value;

const HELPERS_JSON: &str = include_str!("p6_8b_vectors/helpers.json");

fn root() -> Value {
    serde_json::from_str(HELPERS_JSON).expect("wektor JSON")
}

/// Wektor liczby: JSON number, {"$f": "..."} albo {"$n": "NaN"|"Infinity"|"-Infinity"|"-0"}.
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

fn same_num(actual: f64, expected: &Value) -> bool {
    let e = dec(expected);
    if e.is_nan() {
        return actual.is_nan();
    }
    if e == 0.0 && e.is_sign_negative() {
        return actual == 0.0 && actual.is_sign_negative();
    }
    actual == e
}

/// Argument napisowy: `{absent}` i `null` daja `None` (web: undefined / null).
fn arg(v: &Value) -> Option<&str> {
    v.as_str()
}

fn str_list(v: &Value) -> Vec<&str> {
    v.as_array()
        .expect("lista")
        .iter()
        .map(|x| x.as_str().expect("napis"))
        .collect()
}

fn unit_rows(data: &Value) -> Vec<UnitReplacementRow> {
    data["dane"]["units"]
        .as_array()
        .expect("units")
        .iter()
        .map(|u| UnitReplacementRow {
            jednostka: u["Jednostka"].as_str().expect("Jednostka").to_string(),
            nacja: u.get("Nacja").and_then(Value::as_str).map(str::to_string),
            w_zamian_za: u
                .get("W zamian za")
                .and_then(Value::as_str)
                .map(str::to_string),
        })
        .collect()
}

fn building_rows(data: &Value) -> Vec<BuildingLinkRow> {
    data["dane"]["buildings"]
        .as_array()
        .expect("buildings")
        .iter()
        .map(|b| BuildingLinkRow {
            id: b["id"].as_str().expect("id").to_string(),
            upgrade_from: b
                .get("upgradeFrom")
                .and_then(Value::as_str)
                .map(str::to_string),
            odblokowuje: b
                .get("odblokowuje")
                .and_then(Value::as_str)
                .map(str::to_string),
        })
        .collect()
}

fn queue_items(v: &Value) -> Vec<ProductionItem> {
    v.as_array()
        .expect("kolejka")
        .iter()
        .map(|it| ProductionItem {
            kind: match it["kind"].as_str().expect("kind") {
                "budynek" => ProductionKind::Budynek,
                "jednostka" => ProductionKind::Jednostka,
                other => panic!("kind {other}"),
            },
            id: it["id"].as_str().expect("id").to_string(),
            nazwa: it["nazwa"].as_str().expect("nazwa").to_string(),
            koszt: 1.0,
            postep: None,
            is_general: None,
        })
        .collect()
}

fn bonus_value(v: Option<&Value>) -> CivBonusValue {
    match v {
        None | Some(Value::Null) => CivBonusValue::Single(None),
        Some(Value::Array(items)) => CivBonusValue::List(
            items
                .iter()
                .map(|x| x.as_str().map(str::to_string))
                .collect(),
        ),
        Some(x) => CivBonusValue::Single(x.as_str().map(str::to_string)),
    }
}

#[test]
fn civ_key_to_nacja_matches_web() {
    let data = root();
    for case in data["civKey"].as_array().unwrap() {
        let key = &case["key"];
        let got = unit_nacja_for_civ_key(arg(key)).map(str::to_string);
        let want = case["out"].as_str().map(str::to_string);
        assert_eq!(got, want, "unitNacjaForCivKey({key})");
    }
}

#[test]
fn unit_allowed_for_civ_nation_matches_web() {
    let data = root();
    for case in data["allowed"].as_array().unwrap() {
        let unit = case["unit"].as_str().unwrap();
        let civ = arg(&case["civ"]);
        assert_eq!(
            unit_allowed_for_civ_nation(unit, civ),
            case["out"].as_bool().unwrap(),
            "unitAllowedForCivNation({unit:?}, {civ:?})"
        );
    }
}

#[test]
fn availability_civ_nation_matches_web() {
    let data = root();
    for case in data["availability"].as_array().unwrap() {
        let ctx = &case["ctx"];
        // ctx.civKey: brak klucza / {absent} = undefined; null = Some(None); napis = Some(Some).
        let civ_key: Option<Option<&str>> = match ctx.get("civKey") {
            None => None,
            Some(v) if v.is_object() => None,
            Some(Value::Null) => Some(None),
            Some(v) => Some(v.as_str()),
        };
        let civ_unit_nacja: Option<&str> = match ctx.get("civUnitNacja") {
            None => None,
            Some(v) if v.is_object() => None,
            Some(v) => v.as_str(),
        };
        let got = availability_civ_nation(civ_key, civ_unit_nacja);
        let want = case["out"].as_str().map(str::to_string);
        assert_eq!(got, want, "availabilityCivNation({ctx})");
    }
}

#[test]
fn blank_replacement_matches_web() {
    let data = root();
    for case in data["blank"].as_array().unwrap() {
        let z = case["z"].as_str().unwrap();
        assert_eq!(
            is_blank_replacement(z),
            case["out"].as_bool().unwrap(),
            "isBlankReplacement({z:?})"
        );
    }
}

#[test]
fn civ_special_replacement_matches_web() {
    let data = root();
    let units = unit_rows(&data);
    for case in data["specialReplacement"].as_array().unwrap() {
        let name = case["unit"].as_str().unwrap();
        let row = units
            .iter()
            .find(|u| u.jednostka == name)
            .expect("jednostka");
        let civ = arg(&case["civ"]);
        assert_eq!(
            is_civ_special_replacement(row, civ),
            case["out"].as_bool().unwrap(),
            "isCivSpecialReplacement({name:?}, {civ:?})"
        );
    }
}

#[test]
fn civ_has_replacement_for_matches_web() {
    let data = root();
    let units = unit_rows(&data);
    for case in data["hasReplacement"].as_array().unwrap() {
        let base = case["base"].as_str().unwrap();
        let civ = arg(&case["civ"]);
        assert_eq!(
            civ_has_replacement_for(&units, base, civ),
            case["out"].as_bool().unwrap(),
            "civHasReplacementFor({base:?}, {civ:?})"
        );
    }
}

#[test]
fn building_gold_purchase_cost_matches_web() {
    let data = root();
    for case in data["goldCost"].as_array().unwrap() {
        let praca = dec(&case["praca"]);
        let got = building_gold_purchase_cost(praca);
        assert!(
            same_num(got, &case["out"]),
            "buildingGoldPurchaseCost({praca}) = {got}"
        );
    }
}

#[test]
fn building_type_committed_matches_web() {
    let data = root();
    for case in data["committed"].as_array().unwrap() {
        let built = str_list(&case["built"]);
        let queue = queue_items(&case["queue"]);
        let id = case["id"].as_str().unwrap();
        assert_eq!(
            building_type_committed(id, &built, &queue),
            case["out"].as_bool().unwrap(),
            "buildingTypeCommitted({id})"
        );
    }
}

#[test]
fn building_type_queued_matches_web() {
    let data = root();
    for case in data["queued"].as_array().unwrap() {
        let queue = queue_items(&case["queue"]);
        let id = case["id"].as_str().unwrap();
        assert_eq!(
            building_type_queued(id, &queue),
            case["out"].as_bool().unwrap(),
            "buildingTypeQueued({id})"
        );
    }
}

#[test]
fn building_superseded_by_upgrade_matches_web() {
    let data = root();
    let buildings = building_rows(&data);
    for case in data["superseded"].as_array().unwrap() {
        let built = str_list(&case["built"]);
        let id = case["id"].as_str().unwrap();
        assert_eq!(
            is_building_superseded_by_upgrade(id, &built, &buildings),
            case["out"].as_bool().unwrap(),
            "isBuildingSupersededByUpgrade({id})"
        );
    }
}

#[test]
fn apply_completed_building_ids_matches_web() {
    let data = root();
    let buildings = building_rows(&data);
    for case in data["applyCompleted"].as_array().unwrap() {
        let built = str_list(&case["built"]);
        let completed = case["completed"].as_str().unwrap();
        let got = apply_completed_building_ids(&built, completed, &buildings);
        let want: Vec<String> = str_list(&case["out"])
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(
            got, want,
            "applyCompletedBuildingIds({built:?}, {completed})"
        );
    }
}

#[test]
fn building_unlock_flag_matches_web() {
    let data = root();
    let buildings = building_rows(&data);
    for case in data["unlockFlag"].as_array().unwrap() {
        let completed = case["completed"].as_str().unwrap();
        let got = building_unlock_flag_for(completed, &buildings);
        let want = case["out"].as_str().map(str::to_string);
        assert_eq!(got, want, "buildingUnlockFlagFor({completed})");
    }
}

#[test]
fn civ_special_unit_name_tokens_match_web() {
    let data = root();
    for case in data["tokens"].as_array().unwrap() {
        let bonusy_v = &case["bonusy"];
        let bonusy: Option<Vec<CivSpecialBonus>> = match bonusy_v {
            Value::Null => None,
            v if v.is_object() => None, // {absent: true}
            Value::Array(items) => Some(
                items
                    .iter()
                    .map(|b| CivSpecialBonus {
                        typ: b["typ"].as_str().unwrap_or("").to_string(),
                        wartosc: bonus_value(b.get("wartosc")),
                    })
                    .collect(),
            ),
            other => panic!("bonusy {other}"),
        };
        let got = civ_special_unit_name_tokens(bonusy.as_deref());
        let want: Vec<String> = str_list(&case["out"])
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(got, want, "civSpecialUnitNameTokens({bonusy_v})");
    }
}

#[test]
fn unit_matches_special_name_matches_web() {
    let data = root();
    for case in data["matchName"].as_array().unwrap() {
        let name = case["name"].as_str().unwrap();
        let tokens: Vec<String> = str_list(&case["tokens"])
            .iter()
            .map(|s| s.to_string())
            .collect();
        assert_eq!(
            unit_matches_special_name(name, &tokens),
            case["out"].as_bool().unwrap(),
            "unitMatchesSpecialName({name:?}, {tokens:?})"
        );
    }
}
