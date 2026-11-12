//! R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1: adaptery UnitDef/City/Unit -> UnitReplaceDeps.
//! Wektory koszt z uruchomionego weba (`p6_repin_unit_replace_vectors`) musza dac ten sam
//! wynik przez adapter; reguly odrzucenia (koszt, magazyn, blokada, limit uzycia) sa behawioralne.

use civ_engine::domain::building_costs::p6_7b::{EpochInput, StockRecord, UnitStockCostSource};
use civ_engine::domain::unit_replace::{UnitReplaceFail, UnitReplaceResult, UnitReplaceTarget};
use civ_engine::domain::unit_replace_wiring::{
    replace_unit_wired, ReplaceCity, ReplaceUnitDef, UNKNOWN_NEW_TYPE_DETAIL,
};
use serde_json::Value;
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_repin_unit_replace_vectors/unit-replace-vectors.json");

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
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

/// Odpowiednik `def_of` z `p6_repin_unit_replace_pure.rs` (pola units.json).
fn source_of(v: &Value) -> Option<UnitStockCostSource> {
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

fn def(
    category: &str,
    money: f64,
    source: Option<UnitStockCostSource>,
    max_hp: f64,
) -> ReplaceUnitDef {
    ReplaceUnitDef {
        category: category.to_owned(),
        money_cost: money,
        stock_source: source,
        max_hp,
    }
}

fn procarz_source() -> UnitStockCostSource {
    UnitStockCostSource {
        jednostka: Some("Procarz".to_owned()),
        typ: Some("Slinger".to_owned()),
        epoka: EpochInput::Text("Brąz".to_owned()),
        surowiec: Some("Drewno".to_owned()),
        surowiec_ilosc: Some(25.0),
    }
}

fn wounded_warrior() -> UnitReplaceTarget {
    UnitReplaceTarget {
        type_id: "Stary".to_owned(),
        category: Some("Wrecz".to_owned()),
        hp: Some(5.0),
        hp_max: Some(10.0),
        ruch_left: 1.0,
        replace_used_this_turn: false,
    }
}

fn table() -> BTreeMap<String, ReplaceUnitDef> {
    let mut defs = BTreeMap::new();
    defs.insert("Stary".to_owned(), def("Wrecz", 2.0, None, 10.0));
    defs.insert(
        "Nowy".to_owned(),
        def("Dystans", 4.0, Some(procarz_source()), 20.0),
    );
    defs
}

fn city_with_drewno(amount: f64, treasury: f64) -> ReplaceCity {
    let mut pool = StockRecord::new();
    pool.insert("drewno".to_owned(), amount);
    ReplaceCity { treasury, pool }
}

#[test]
fn koszt_adaptera_zgodny_z_wektorami_weba() {
    let d: Value = serde_json::from_str(VECTORS).unwrap();
    let cases = d["cost"].as_array().unwrap();
    assert!(!cases.is_empty());
    for c in cases {
        let id = c["id"].as_str().unwrap();
        // Wejscie: null / "NaN" = brak kosztu (web: `!(x > 0)` -> 0).
        let money = match c["money"].as_str() {
            Some("NaN") => f64::NAN,
            Some(other) => panic!("{id}: nieznany tekst liczbowy {other}"),
            None if c["money"].is_null() => f64::NAN,
            None => num(&c["money"]),
        };
        let expected = &c["expected"];
        let want_stock = stock_of(&expected["stock"]);
        // Pula z zapasem na kazdy klucz wektora, skarbiec wystarczajacy.
        let mut pool = StockRecord::new();
        for k in want_stock.keys() {
            pool.insert(k.clone(), 1.0e9);
        }
        let mut defs = BTreeMap::new();
        defs.insert(
            "Nowy".to_owned(),
            def("Dystans", money, source_of(&c["def"]), 10.0),
        );
        let mut city = ReplaceCity {
            treasury: 1.0e9,
            pool: pool.clone(),
        };
        let mut unit = wounded_warrior();
        let res = replace_unit_wired(
            &mut unit,
            "Nowy",
            &defs,
            &mut city,
            None,
            false,
            Default::default(),
        );
        match res {
            UnitReplaceResult::Ok {
                money: got_money,
                stock,
                ..
            } => {
                assert_eq!(got_money, num(&expected["money"]), "{id}: money");
                assert_eq!(stock, want_stock, "{id}: stock");
            }
            other => panic!("{id}: oczekiwano sukcesu, jest {other:?}"),
        }
        for (k, v) in &want_stock {
            assert_eq!(city.pool[k], pool[k] - v, "{id}: pula {k}");
        }
    }
}

#[test]
fn sukces_zmienia_typ_zasoby_skarbiec_i_hp() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 100.0);
    let mut unit = wounded_warrior();
    let res = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    assert!(matches!(res, UnitReplaceResult::Ok { .. }), "{res:?}");
    assert_eq!(unit.type_id, "Nowy");
    assert_eq!(unit.category.as_deref(), Some("Dystans"));
    // hp = round(20 * 5/10) = 10; hpMax bez sync (gracz) zostaje 10.
    assert_eq!(unit.hp, Some(10.0));
    assert_eq!(unit.hp_max, Some(10.0));
    assert_eq!(unit.ruch_left, 0.0);
    assert!(unit.replace_used_this_turn);
    assert_eq!(city.treasury, 96.0);
    assert_eq!(city.pool["drewno"], 150.0);
}

#[test]
fn sync_hp_max_dla_ai_aktualizuje_hp_max() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 100.0);
    let mut unit = wounded_warrior();
    let _ = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        None,
        true,
        Default::default(),
    );
    assert_eq!(unit.hp_max, Some(20.0));
}

#[test]
fn brak_pieniedzy_odrzuca_bez_mutacji() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 3.0);
    let mut unit = wounded_warrior();
    let before = unit.clone();
    let res = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    match res {
        UnitReplaceResult::Fail { reason, money, .. } => {
            assert_eq!(reason, UnitReplaceFail::Money);
            assert_eq!(money, 4.0);
        }
        other => panic!("oczekiwano Money, jest {other:?}"),
    }
    assert_eq!(unit, before);
    assert_eq!(city.treasury, 3.0);
    assert_eq!(city.pool["drewno"], 200.0);
}

#[test]
fn brak_surowca_odrzuca_bez_mutacji() {
    let defs = table();
    let mut city = city_with_drewno(10.0, 100.0);
    let mut unit = wounded_warrior();
    let before = unit.clone();
    let res = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    match res {
        UnitReplaceResult::Fail { reason, stock, .. } => {
            assert_eq!(reason, UnitReplaceFail::Stock);
            assert_eq!(stock["drewno"], 50.0);
        }
        other => panic!("oczekiwano Stock, jest {other:?}"),
    }
    assert_eq!(unit, before);
    assert_eq!(city.treasury, 100.0);
    assert_eq!(city.pool["drewno"], 10.0);
}

#[test]
fn blokada_pinu_odrzuca_z_powodem() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 100.0);
    let mut unit = wounded_warrior();
    let res = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        Some("Limit Super-jednostki".to_owned()),
        false,
        Default::default(),
    );
    match res {
        UnitReplaceResult::Fail { reason, detail, .. } => {
            assert_eq!(reason, UnitReplaceFail::Gate);
            assert_eq!(detail.as_deref(), Some("Limit Super-jednostki"));
        }
        other => panic!("oczekiwano Gate, jest {other:?}"),
    }
    assert_eq!(city.treasury, 100.0);
}

#[test]
fn nieznany_typ_docelowy_jest_blokada() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 100.0);
    let mut unit = wounded_warrior();
    let res = replace_unit_wired(
        &mut unit,
        "Brak",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    match res {
        UnitReplaceResult::Fail { reason, detail, .. } => {
            assert_eq!(reason, UnitReplaceFail::Gate);
            assert_eq!(detail.as_deref(), Some(UNKNOWN_NEW_TYPE_DETAIL));
        }
        other => panic!("oczekiwano Gate, jest {other:?}"),
    }
    assert_eq!(unit.type_id, "Stary");
}

#[test]
fn drugie_uzycie_w_turze_odrzucone() {
    let defs = table();
    let mut city = city_with_drewno(200.0, 100.0);
    let mut unit = wounded_warrior();
    let _ = replace_unit_wired(
        &mut unit,
        "Nowy",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    let res = replace_unit_wired(
        &mut unit,
        "Stary",
        &defs,
        &mut city,
        None,
        false,
        Default::default(),
    );
    match res {
        UnitReplaceResult::Fail { reason, .. } => assert_eq!(reason, UnitReplaceFail::Used),
        other => panic!("oczekiwano Used, jest {other:?}"),
    }
    assert_eq!(city.treasury, 96.0);
}
