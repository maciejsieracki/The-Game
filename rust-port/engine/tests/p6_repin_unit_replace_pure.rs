//! R-RUSTPORT-REPIN-UNIT-REPLACE-Q1: wektory z URUCHOMIONEGO weba (origin/main) dla czystej
//! logiki "Zastap": koszt pelny, brak zasobow, sklad sladu, limit AI, klasa armii, rezerwa AI.
//! Generator: tests/p6_repin_unit_replace_vectors/gen-unit-replace-vectors.cjs.

use civ_engine::domain::ai_zakup_jednostki::AiPurchaseReserveParams;
use civ_engine::domain::building_costs::p6_7b::{EpochInput, StockRecord, UnitStockCostSource};
use civ_engine::domain::unit_replace::{
    ai_replace_keeps_army_class, ai_replace_reserve_ok, ai_unit_replace_cap,
    can_afford_unit_replace, load_ai_unit_replace_max_fraction, merge_stock_paid,
    plan_ai_unit_replace_order, unit_replace_full_cost, unit_replace_stock_missing,
    AiReplaceReserveInput, AiReplaceUnitInfo,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_unit_replace_vectors/unit-replace-vectors.json");

fn doc() -> Value {
    serde_json::from_str(VECTORS).expect("poprawny JSON wektorow")
}

fn arr<'a>(d: &'a Value, key: &str) -> &'a Vec<Value> {
    d[key]
        .as_array()
        .unwrap_or_else(|| panic!("brak tablicy {key}"))
}

/// Liczba z wektora; `"NaN"` = NaN (JSON nie ma NaN).
fn num(v: &Value) -> f64 {
    if let Some(s) = v.as_str() {
        assert_eq!(s, "NaN", "nieznany tekst liczbowy {s}");
        return f64::NAN;
    }
    v.as_f64().expect("liczba w wektorze")
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn stock_of(v: &Value) -> StockRecord {
    let mut out = StockRecord::new();
    if let Some(obj) = v.as_object() {
        for (k, val) in obj {
            out.insert(k.clone(), num(val));
        }
    }
    out
}

fn stock_opt(v: &Value) -> Option<StockRecord> {
    if v.is_null() {
        None
    } else {
        Some(stock_of(v))
    }
}

fn def_of(v: &Value) -> Option<UnitStockCostSource> {
    if v.is_null() {
        return None;
    }
    let epoka = match v.get("Epoka").and_then(|e| e.as_str()) {
        Some(s) => EpochInput::Text(s.to_owned()),
        None => EpochInput::Other,
    };
    Some(UnitStockCostSource {
        jednostka: v
            .get("Jednostka")
            .and_then(|x| x.as_str())
            .map(str::to_owned),
        typ: v.get("Typ").and_then(|x| x.as_str()).map(str::to_owned),
        epoka,
        surowiec: v
            .get("Surowiec")
            .and_then(|x| x.as_str())
            .map(str::to_owned),
        surowiec_ilosc: v.get("Surowiec (ilość)").and_then(|x| x.as_f64()),
    })
}

fn assert_stock_eq(id: &str, got: &StockRecord, want: &Value) {
    let want = stock_of(want);
    assert_eq!(
        got.len(),
        want.len(),
        "{id}: liczba kluczy {got:?} vs {want:?}"
    );
    for (k, v) in &want {
        let g = got.get(k).copied().unwrap_or(f64::NAN);
        assert!((g - v).abs() < 1e-9, "{id}: klucz {k}: {g} != {v}");
    }
}

#[test]
fn koszt_pelny_zgodny_z_webem() {
    let d = doc();
    let cases = arr(&d, "cost");
    assert!(
        cases.len() >= 80,
        "za malo wektorow kosztu: {}",
        cases.len()
    );
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let money_in = if c["money"].is_null() {
            f64::NAN
        } else {
            num(&c["money"])
        };
        let cost = unit_replace_full_cost(def_of(&c["def"]).as_ref(), money_in);
        let want_money = num(&c["expected"]["money"]);
        assert_eq!(cost.money, want_money, "{id}: money");
        assert_stock_eq(id, &cost.stock, &c["expected"]["stock"]);
    }
}

#[test]
fn brak_srodkow_i_pula_panstwa_zgodne_z_webem() {
    let d = doc();
    let cases = arr(&d, "afford");
    assert!(cases.len() >= 80);
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let cost = civ_engine::domain::unit_replace::UnitReplaceCost {
            money: num(&c["cost"]["money"]),
            stock: stock_of(&c["cost"]["stock"]),
        };
        let treasury = num(&c["treasury"]);
        let pool = stock_opt(&c["pool"]);
        let got_ok = can_afford_unit_replace(&cost, treasury, pool.as_ref());
        assert_eq!(
            got_ok,
            c["expected"]["canAfford"].as_bool().unwrap(),
            "{id}: canAfford"
        );
        let missing = unit_replace_stock_missing(&cost, pool.as_ref());
        assert_stock_eq(id, &missing, &c["expected"]["missing"]);
    }
}

#[test]
fn scalenie_sladu_zuzycia_zgodne_z_webem() {
    let d = doc();
    for c in arr(&d, "merge") {
        let id = c["id"].as_str().unwrap();
        let prev = stock_opt(&c["previous"]);
        let added = stock_of(&c["added"]);
        let got = merge_stock_paid(prev.as_ref(), &added);
        assert_stock_eq(id, &got, &c["expected"]);
    }
}

#[test]
fn limit_zamian_ai_zgodny_z_webem() {
    let d = doc();
    for c in arr(&d, "cap") {
        let id = c["id"].as_str().unwrap();
        let got = ai_unit_replace_cap(num(&c["count"]), num(&c["fraction"]));
        assert_eq!(got, num(&c["expected"]), "{id}");
    }
    for c in arr(&d, "maxFraction") {
        let id = c["id"].as_str().unwrap();
        // value: null = brak wpisu lub nie-liczba; "NaN" = NaN; "brak" = brak wpisu aiParams
        let input = match &c["value"] {
            Value::Null => None,
            Value::String(s) if s == "NaN" => Some(f64::NAN),
            Value::String(_) => None,
            v => v.as_f64(),
        };
        let got = load_ai_unit_replace_max_fraction(input);
        let want = num(&c["expected"]);
        assert!(
            (got - want).abs() < 1e-12 || (got.is_nan() && want.is_nan()),
            "{id}: {got} != {want}"
        );
    }
}

#[test]
fn klasa_armii_przy_zamianie_zgodna_z_webem() {
    let d = doc();
    let cases = arr(&d, "armyKeep");
    assert_eq!(cases.len(), 144);
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let old = c["oldTyp"].as_str();
        let new = c["newTyp"].as_str();
        assert_eq!(
            ai_replace_keeps_army_class(old, new),
            c["expected"].as_bool().unwrap(),
            "{id}"
        );
    }
}

#[test]
fn kolejnosc_planu_ai_zgodna_z_webem() {
    let d = doc();
    for c in arr(&d, "plan") {
        let id = c["id"].as_str().unwrap();
        let units: Vec<AiReplaceUnitInfo> = c["units"]
            .as_array()
            .unwrap()
            .iter()
            .map(|u| AiReplaceUnitInfo {
                epoch: num(&u["epoch"]),
                power: num(&u["power"]),
                blocked: u["blocked"].as_bool().unwrap(),
            })
            .collect();
        let got = plan_ai_unit_replace_order(&units, |u| *u);
        let want: Vec<usize> = c["expectedOrder"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_u64().unwrap() as usize)
            .collect();
        assert_eq!(got, want, "{id}");
    }
}

#[test]
fn rezerwa_ai_zgodna_z_webem() {
    let d = doc();
    let params = arr(&d, "reserveParams");
    let cases = arr(&d, "reserve");
    assert!(cases.len() >= 27);
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let inp = &c["input"];
        let reserve =
            inp.get("reserve")
                .filter(|r| !r.is_null())
                .map(|r| AiPurchaseReserveParams {
                    rezerwa_tur: num(&r["rezerwaTur"]),
                    min_dochod_netto: num(&r["minDochodNetto"]),
                });
        // parametry poziomu zgodne z webem (loadAiPurchaseReserveParams)
        if let Some(r) = reserve {
            let level = c["level"].as_u64().unwrap();
            let p = params
                .iter()
                .find(|p| p["level"].as_u64() == Some(level))
                .unwrap();
            assert_eq!(r.rezerwa_tur, num(&p["rezerwaTur"]), "{id}: rezerwaTur");
            assert_eq!(
                r.min_dochod_netto,
                num(&p["minDochodNetto"]),
                "{id}: minDochodNetto"
            );
        }
        let input = AiReplaceReserveInput {
            treasury: num(&inp["treasury"]),
            money_cost: num(&inp["moneyCost"]),
            reserve,
            net_income_per_turn: opt_num(&inp["netIncomePerTurn"]),
            upkeep_per_turn: opt_num(&inp["upkeepPerTurn"]),
            unit_upkeep_per_turn: opt_num(&inp["unitUpkeepPerTurn"]),
        };
        assert_eq!(
            ai_replace_reserve_ok(&input),
            c["expected"].as_bool().unwrap(),
            "{id}"
        );
    }
}
