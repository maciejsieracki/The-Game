//! R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1 (etap 1 wiringu, dlug L-3): adaptery
//! `UnitDef` / `City` / `Unit` -> `UnitReplaceTarget` / `UnitReplaceDeps`.
//!
//! Zakres tego modulu:
//! - `ReplaceUnitDef`: pola definicji jednostki z units.json potrzebne do zamiany
//!   (kategoria, koszt Pieniadz, zrodlo kosztu surowcowego, maks. HP),
//! - `ReplaceCity`: skarbiec i pula surowcow miasta (web: `city.surowce`),
//! - `WiredReplaceDeps`: implementacja `UnitReplaceDeps` nad powyzszymi,
//! - `replace_unit_wired`: jedyne wejscie do `execute_unit_replace` z adapterami.
//!
//! Blokady (`gate`) sa dostarczane przez wywolujacego (reguly pinu, np. limit
//! Super-jednostki, faza tury); adapter nie zgaduje ich sam.
//! Brak definicji nowego typu = blokada `Gate` z jawnym powodem (nie cicha zamiana).

use super::building_costs::p6_7b::{unit_stock_cost, StockRecord, UnitStockCostSource};
use super::unit_replace::{
    execute_unit_replace, UnitReplaceDeps, UnitReplaceResult, UnitReplaceTarget,
};
use std::collections::BTreeMap;

/// Powod blokady dla nieznanego typu docelowego (brak wpisu w tabeli definicji).
pub const UNKNOWN_NEW_TYPE_DETAIL: &str = "Brak definicji nowego typu jednostki";

/// Pola `UnitDef` (units.json) wspolne dla zamiany gracza i AI.
#[derive(Debug, Clone, PartialEq)]
pub struct ReplaceUnitDef {
    /// Kategoria jednostki po zamianie (web: `unit.category`).
    pub category: String,
    /// Pelny koszt Pieniadz (przed zaokragleniem; zaokragla `execute_unit_replace`).
    pub money_cost: f64,
    /// Zrodlo kosztu surowcowego (`Surowiec`, `Surowiec (ilość)`, `Epoka`, `Typ`).
    pub stock_source: Option<UnitStockCostSource>,
    /// Maks. HP definicji (web: `maxHp`).
    pub max_hp: f64,
}

/// Miasto jako zrodlo finansow i surowcow zamiany (web: `city` + `city.surowce`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ReplaceCity {
    /// Skarbiec panstwa, z ktorego placony jest Pieniadz.
    pub treasury: f64,
    /// Pula surowcow miasta.
    pub pool: StockRecord,
}

/// Adapter `UnitReplaceDeps` nad tabela definicji, miastem i blokada.
pub struct WiredReplaceDeps<'a> {
    defs: &'a BTreeMap<String, ReplaceUnitDef>,
    city: &'a mut ReplaceCity,
    new_type_id: String,
    gate: Option<String>,
    sync_hp_max: bool,
}

impl<'a> WiredReplaceDeps<'a> {
    fn new_def(&self) -> Option<&ReplaceUnitDef> {
        self.defs.get(&self.new_type_id)
    }
}

impl UnitReplaceDeps for WiredReplaceDeps<'_> {
    fn gate_reason(&self, _unit: &UnitReplaceTarget, new_type_id: &str) -> Option<String> {
        if !self.defs.contains_key(new_type_id) {
            return Some(UNKNOWN_NEW_TYPE_DETAIL.to_owned());
        }
        self.gate.clone()
    }

    fn money_cost(&self, _new_type_id: &str, _unit: &UnitReplaceTarget) -> f64 {
        self.new_def().map_or(0.0, |d| d.money_cost)
    }

    fn stock_cost(&self, _new_type_id: &str, _unit: &UnitReplaceTarget) -> StockRecord {
        unit_stock_cost(self.new_def().and_then(|d| d.stock_source.as_ref()))
    }

    fn can_pay_stock(&self, cost: &StockRecord, _unit: &UnitReplaceTarget) -> bool {
        super::building_costs::p6_7b::missing_stock_for(Some(&self.city.pool), cost).is_empty()
    }

    fn pay_stock(&mut self, cost: &StockRecord, _unit: &UnitReplaceTarget) {
        for (key, amount) in cost {
            if amount.is_finite() && *amount > 0.0 {
                let entry = self.city.pool.entry(key.clone()).or_insert(0.0);
                *entry -= amount;
            }
        }
    }

    fn current_treasury(&self) -> f64 {
        self.city.treasury
    }

    fn set_treasury(&mut self, value: f64) {
        self.city.treasury = value;
    }

    fn old_max_hp(&self, unit: &UnitReplaceTarget) -> f64 {
        // Brak definicji starego typu -> 0 (execute_unit_replace traktuje to jako ratio 1.0).
        self.defs.get(&unit.type_id).map_or(0.0, |d| d.max_hp)
    }

    fn new_max_hp(&self, _unit: &UnitReplaceTarget, _new_type_id: &str) -> f64 {
        self.new_def().map_or(0.0, |d| d.max_hp)
    }

    fn category(&self, _new_type_id: &str) -> String {
        self.new_def()
            .map_or_else(String::new, |d| d.category.clone())
    }

    fn sync_hp_max(&self) -> bool {
        self.sync_hp_max
    }
}

/// Wykonuje zamiane jednostki przez adaptery. Mutuje `unit` i `city` wylacznie przy sukcesie
/// (zgodnie z `execute_unit_replace`). `sync_hp_max`: true dla AI (web aktualizuje hpMax).
pub fn replace_unit_wired(
    unit: &mut UnitReplaceTarget,
    new_type_id: &str,
    defs: &BTreeMap<String, ReplaceUnitDef>,
    city: &mut ReplaceCity,
    gate: Option<String>,
    sync_hp_max: bool,
) -> UnitReplaceResult {
    let mut deps = WiredReplaceDeps {
        defs,
        city,
        new_type_id: new_type_id.to_owned(),
        gate,
        sync_hp_max,
    };
    execute_unit_replace(unit, new_type_id, &mut deps)
}

#[cfg(test)]
mod tests {
    //! Wektory z pinu przez ADAPTER (nie tylko przez czyste funkcje). Adapter wylicza koszt
    //! surowcowy z `UnitStockCostSource`, a wektory podaja rekord wprost, wiec dekorator
    //! `WithStockRecord` podstawia rekord kosztu i deleguje wszystko inne do adaptera.
    //! Stan zapasu: `canPay` z wektora jest odtwarzany przez pule (pelna przy true, pusta przy false).
    use super::*;
    use crate::domain::building_costs::p6_7b::StockRecord;
    use crate::domain::unit_replace::{
        execute_unit_replace, UnitReplaceDeps, UnitReplaceFail, UnitReplaceResult,
        UnitReplaceTarget,
    };
    use serde_json::Value;

    const VECTORS: &str =
        include_str!("../../tests/p6_repin_unit_replace_vectors/unit-replace-vectors.json");

    /// Dekorator: koszt surowcowy z rekordu wektora; reszta = adapter `WiredReplaceDeps`.
    struct WithStockRecord<'a> {
        inner: WiredReplaceDeps<'a>,
        stock: StockRecord,
    }

    impl UnitReplaceDeps for WithStockRecord<'_> {
        fn gate_reason(&self, unit: &UnitReplaceTarget, new: &str) -> Option<String> {
            self.inner.gate_reason(unit, new)
        }
        fn money_cost(&self, new: &str, unit: &UnitReplaceTarget) -> f64 {
            self.inner.money_cost(new, unit)
        }
        fn stock_cost(&self, _new: &str, _unit: &UnitReplaceTarget) -> StockRecord {
            self.stock.clone()
        }
        fn can_pay_stock(&self, cost: &StockRecord, unit: &UnitReplaceTarget) -> bool {
            self.inner.can_pay_stock(cost, unit)
        }
        fn pay_stock(&mut self, cost: &StockRecord, unit: &UnitReplaceTarget) {
            self.inner.pay_stock(cost, unit);
        }
        fn current_treasury(&self) -> f64 {
            self.inner.current_treasury()
        }
        fn set_treasury(&mut self, value: f64) {
            self.inner.set_treasury(value);
        }
        fn old_max_hp(&self, unit: &UnitReplaceTarget) -> f64 {
            self.inner.old_max_hp(unit)
        }
        fn new_max_hp(&self, unit: &UnitReplaceTarget, new: &str) -> f64 {
            self.inner.new_max_hp(unit, new)
        }
        fn category(&self, new: &str) -> String {
            self.inner.category(new)
        }
        fn sync_hp_max(&self) -> bool {
            self.inner.sync_hp_max()
        }
    }

    fn num(v: &Value) -> f64 {
        if let Some(s) = v.as_str() {
            assert_eq!(s, "NaN", "nieznany tekst liczbowy {s}");
            return f64::NAN;
        }
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

    fn opt_num(v: &Value) -> Option<f64> {
        if v.is_null() {
            None
        } else {
            Some(num(v))
        }
    }

    /// Uruchamia `execute_unit_replace` na adapterze z wejsciami wektora.
    /// Zwraca wynik, zmieniona jednostke i stan miasta.
    #[allow(clippy::too_many_arguments)]
    fn run_adapter(
        unit: &mut UnitReplaceTarget,
        new_type: &str,
        money: f64,
        stock: StockRecord,
        pool: StockRecord,
        treasury: f64,
        old_max_hp: f64,
        new_max_hp: f64,
        category: &str,
        gate: Option<String>,
        sync: bool,
    ) -> (UnitReplaceResult, ReplaceCity) {
        let mut defs = BTreeMap::new();
        defs.insert(
            unit.type_id.clone(),
            ReplaceUnitDef {
                category: "Wrecz".to_owned(),
                money_cost: 0.0,
                stock_source: None,
                max_hp: old_max_hp,
            },
        );
        defs.insert(
            new_type.to_owned(),
            ReplaceUnitDef {
                category: category.to_owned(),
                money_cost: money,
                stock_source: None,
                max_hp: new_max_hp,
            },
        );
        let mut city = ReplaceCity { treasury, pool };
        let res = {
            let mut deps = WithStockRecord {
                inner: WiredReplaceDeps {
                    defs: &defs,
                    city: &mut city,
                    new_type_id: new_type.to_owned(),
                    gate,
                    sync_hp_max: sync,
                },
                stock,
            };
            execute_unit_replace(unit, new_type, &mut deps)
        };
        (res, city)
    }

    #[test]
    fn pay_stock_pomija_wartosci_niepoprawne() {
        let defs = BTreeMap::new();
        let mut city = ReplaceCity {
            treasury: 0.0,
            pool: StockRecord::from([
                ("drewno".to_owned(), 10.0),
                ("braz".to_owned(), 5.0),
                ("zelazo".to_owned(), 7.0),
            ]),
        };
        let mut deps = WiredReplaceDeps {
            defs: &defs,
            city: &mut city,
            new_type_id: "Nowy".to_owned(),
            gate: None,
            sync_hp_max: false,
        };
        let unit = UnitReplaceTarget {
            type_id: "Stary".to_owned(),
            category: None,
            hp: None,
            hp_max: None,
            ruch_left: 0.0,
            replace_used_this_turn: false,
        };
        let cost = StockRecord::from([
            ("drewno".to_owned(), 3.0),
            ("braz".to_owned(), f64::NAN),
            ("zelazo".to_owned(), 0.0),
            ("kamien".to_owned(), -2.0),
            ("glina".to_owned(), f64::INFINITY),
        ]);
        deps.pay_stock(&cost, &unit);
        assert_eq!(city.pool["drewno"], 7.0, "poprawna wartosc zuzyta");
        assert_eq!(city.pool["braz"], 5.0, "NaN nie zmienia puli");
        assert_eq!(city.pool["zelazo"], 7.0, "zero nie zmienia puli");
        assert!(!city.pool.contains_key("kamien"), "ujemna nie tworzy wpisu");
        assert!(
            !city.pool.contains_key("glina"),
            "nieskonczona nie tworzy wpisu"
        );
    }

    #[test]
    fn wektory_execute_przez_adapter_zgodne_z_webem() {
        let d: Value = serde_json::from_str(VECTORS).unwrap();
        let cases = d["execute"].as_array().unwrap();
        assert_eq!(cases.len(), 21);
        for c in cases {
            let id = c["id"].as_str().unwrap();
            let u = &c["unit"];
            let mut unit = UnitReplaceTarget {
                type_id: u["typeId"].as_str().unwrap().to_owned(),
                category: u["category"].as_str().map(str::to_owned),
                hp: opt_num(&u["hp"]),
                hp_max: opt_num(&u["hpMax"]),
                ruch_left: num(&u["ruchLeft"]),
                replace_used_this_turn: u["replaceUsedThisTurn"].as_bool().unwrap(),
            };
            let dp = &c["deps"];
            let stock = stock_of(&dp["stock"]);
            // canPay z wektora -> pula: pelna (kazdy klucz z zapasem) albo pusta.
            let can_pay = dp["canPay"].as_bool().unwrap();
            let pool = if can_pay {
                stock.clone()
            } else {
                StockRecord::new()
            };
            let pool_before = pool.clone();
            let treasury = num(&dp["treasury"]);
            let e = &c["expected"];
            let (res, city) = run_adapter(
                &mut unit,
                c["newTypeId"].as_str().unwrap(),
                num(&dp["money"]),
                stock,
                pool,
                treasury,
                num(&dp["oldMaxHp"]),
                num(&dp["newMaxHp"]),
                dp["category"].as_str().unwrap(),
                dp["gate"].as_str().map(str::to_owned),
                dp["syncHpMax"].as_bool().unwrap(),
            );
            match res {
                UnitReplaceResult::Ok {
                    old_type_id,
                    money,
                    stock: got_stock,
                } => {
                    assert!(e["ok"].as_bool().unwrap(), "{id}: oczekiwano niepowodzenia");
                    assert_eq!(old_type_id, e["oldTypeId"].as_str().unwrap(), "{id}");
                    assert_eq!(money, num(&e["money"]), "{id}: money");
                    assert_eq!(got_stock, stock_of(&e["stock"]), "{id}: stock");
                }
                UnitReplaceResult::Fail {
                    reason,
                    detail,
                    money,
                    stock: got_stock,
                } => {
                    assert!(!e["ok"].as_bool().unwrap(), "{id}: oczekiwano sukcesu");
                    let want = match e["reason"].as_str().unwrap() {
                        "used" => UnitReplaceFail::Used,
                        "gate" => UnitReplaceFail::Gate,
                        "stock" => UnitReplaceFail::Stock,
                        "money" => UnitReplaceFail::Money,
                        other => panic!("{id}: nieznany powod {other}"),
                    };
                    assert_eq!(reason, want, "{id}: powod");
                    assert_eq!(
                        detail,
                        e["detail"].as_str().map(str::to_owned),
                        "{id}: detail"
                    );
                    assert_eq!(money, num(&e["money"]), "{id}: money");
                    assert_eq!(got_stock, stock_of(&e["stock"]), "{id}: stock");
                }
            }
            assert_eq!(
                city.treasury,
                num(&e["treasuryAfter"]),
                "{id}: treasuryAfter"
            );
            // Zuzycie puli = wektorowe `paid` (zero wpisow = brak zuzycia).
            let paid = e["paid"].as_array().unwrap();
            assert!(paid.len() <= 1, "{id}: wektor z wieloma wplatami");
            for (k, v) in &pool_before {
                let want_paid = paid.first().map_or(0.0, |p| p.get(k).map_or(0.0, num));
                assert_eq!(city.pool[k], v - want_paid, "{id}: pula {k}");
            }
            let eu = &e["unit"];
            assert_eq!(unit.type_id, eu["typeId"].as_str().unwrap(), "{id}: typeId");
            assert_eq!(
                unit.category.as_deref(),
                eu["category"].as_str(),
                "{id}: category"
            );
            assert_eq!(unit.hp, opt_num(&eu["hp"]), "{id}: hp");
            assert_eq!(unit.hp_max, opt_num(&eu["hpMax"]), "{id}: hpMax");
            assert_eq!(unit.ruch_left, num(&eu["ruchLeft"]), "{id}: ruchLeft");
            assert_eq!(
                unit.replace_used_this_turn,
                eu["replaceUsedThisTurn"].as_bool().unwrap(),
                "{id}: replaceUsedThisTurn"
            );
        }
    }

    #[test]
    fn wektory_afford_przez_adapter_zgodne_z_webem() {
        let d: Value = serde_json::from_str(VECTORS).unwrap();
        let cases = d["afford"].as_array().unwrap();
        let mut sprawdzone = 0usize;
        let mut pominiete_pool_null = 0usize;
        for c in cases {
            let id = c["id"].as_str().unwrap();
            // Adapter zawsze ma miasto (`ReplaceCity`), wiec pula `null` z wektora nie ma odpowiednika.
            if c["pool"].is_null() {
                pominiete_pool_null += 1;
                continue;
            }
            let money = num(&c["cost"]["money"]);
            let stock = stock_of(&c["cost"]["stock"]);
            let pool = stock_of(&c["pool"]);
            let treasury = num(&c["treasury"]);
            let mut unit = UnitReplaceTarget {
                type_id: "Stary".to_owned(),
                category: Some("Wrecz".to_owned()),
                hp: Some(5.0),
                hp_max: Some(10.0),
                ruch_left: 1.0,
                replace_used_this_turn: false,
            };
            let (res, _) = run_adapter(
                &mut unit, "Nowy", money, stock, pool, treasury, 10.0, 10.0, "Wrecz", None, false,
            );
            let got_ok = matches!(res, UnitReplaceResult::Ok { .. });
            assert_eq!(
                got_ok,
                c["expected"]["canAfford"].as_bool().unwrap(),
                "{id}: canAfford przez adapter"
            );
            sprawdzone += 1;
        }
        assert!(
            sprawdzone >= 60,
            "za malo wektorow afford z pula: {sprawdzone}"
        );
        assert_eq!(sprawdzone + pominiete_pool_null, cases.len());
    }
}
