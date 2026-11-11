//! R-RUSTPORT-REPIN-UNIT-REPLACE-Q1: wektory z URUCHOMIONEGO weba (origin/main) dla
//! `executeUnitReplace` (wspolna mutacja gracz/AI): bramki, koszt, brak zasobow = brak mutacji,
//! zachowanie wyszkolenia/HP, sync hpMax dla AI, zuzycie ruchu i flagi.

use civ_engine::domain::building_costs::p6_7b::StockRecord;
use civ_engine::domain::unit_replace::{
    execute_unit_replace, UnitReplaceDeps, UnitReplaceFail, UnitReplaceResult, UnitReplaceTarget,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_unit_replace_vectors/unit-replace-vectors.json");

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

struct Deps {
    gate: Option<String>,
    money: f64,
    stock: StockRecord,
    can_pay: bool,
    treasury: f64,
    old_max_hp: f64,
    new_max_hp: f64,
    category: String,
    sync: bool,
    paid: Vec<StockRecord>,
}

impl UnitReplaceDeps for Deps {
    fn gate_reason(&self, _unit: &UnitReplaceTarget, _new: &str) -> Option<String> {
        self.gate.clone()
    }
    fn money_cost(&self, _new: &str, _unit: &UnitReplaceTarget) -> f64 {
        self.money
    }
    fn stock_cost(&self, _new: &str, _unit: &UnitReplaceTarget) -> StockRecord {
        self.stock.clone()
    }
    fn can_pay_stock(&self, _cost: &StockRecord, _unit: &UnitReplaceTarget) -> bool {
        self.can_pay
    }
    fn pay_stock(&mut self, cost: &StockRecord, _unit: &UnitReplaceTarget) {
        self.paid.push(cost.clone());
    }
    fn current_treasury(&self) -> f64 {
        self.treasury
    }
    fn set_treasury(&mut self, value: f64) {
        self.treasury = value;
    }
    fn old_max_hp(&self, _unit: &UnitReplaceTarget) -> f64 {
        self.old_max_hp
    }
    fn new_max_hp(&self, _unit: &UnitReplaceTarget, _new: &str) -> f64 {
        self.new_max_hp
    }
    fn category(&self, _new: &str) -> String {
        self.category.clone()
    }
    fn sync_hp_max(&self) -> bool {
        self.sync
    }
}

#[test]
fn wykonanie_zamiany_zgodne_z_webem() {
    let d: Value = serde_json::from_str(VECTORS).unwrap();
    let cases = d["execute"].as_array().unwrap();
    assert_eq!(cases.len(), 21);
    for c in cases {
        let id = c["id"].as_str().unwrap();
        let u = &c["unit"];
        let mut unit = UnitReplaceTarget {
            type_id: u["typeId"].as_str().unwrap().to_owned(),
            category: u["category"].as_str().map(str::to_owned),
            hp: if u["hp"].is_null() {
                None
            } else {
                Some(num(&u["hp"]))
            },
            hp_max: if u["hpMax"].is_null() {
                None
            } else {
                Some(num(&u["hpMax"]))
            },
            ruch_left: num(&u["ruchLeft"]),
            replace_used_this_turn: u["replaceUsedThisTurn"].as_bool().unwrap(),
        };
        let dp = &c["deps"];
        let mut deps = Deps {
            gate: dp["gate"].as_str().map(str::to_owned),
            money: num(&dp["money"]),
            stock: stock_of(&dp["stock"]),
            can_pay: dp["canPay"].as_bool().unwrap(),
            treasury: num(&dp["treasury"]),
            old_max_hp: num(&dp["oldMaxHp"]),
            new_max_hp: num(&dp["newMaxHp"]),
            category: dp["category"].as_str().unwrap().to_owned(),
            sync: dp["syncHpMax"].as_bool().unwrap(),
            paid: Vec::new(),
        };
        let new_type = c["newTypeId"].as_str().unwrap();
        let res = execute_unit_replace(&mut unit, new_type, &mut deps);
        let e = &c["expected"];

        match res {
            UnitReplaceResult::Ok {
                old_type_id,
                money,
                stock,
            } => {
                assert!(e["ok"].as_bool().unwrap(), "{id}: oczekiwano niepowodzenia");
                assert_eq!(
                    old_type_id,
                    e["oldTypeId"].as_str().unwrap(),
                    "{id}: oldTypeId"
                );
                assert_eq!(money, num(&e["money"]), "{id}: money");
                assert_eq!(stock, stock_of(&e["stock"]), "{id}: stock");
            }
            UnitReplaceResult::Fail {
                reason,
                detail,
                money,
                stock,
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
                assert_eq!(stock, stock_of(&e["stock"]), "{id}: stock");
            }
        }

        assert_eq!(
            deps.treasury,
            num(&e["treasuryAfter"]),
            "{id}: treasuryAfter"
        );
        let want_paid: Vec<StockRecord> =
            e["paid"].as_array().unwrap().iter().map(stock_of).collect();
        assert_eq!(deps.paid, want_paid, "{id}: paid");

        let eu = &e["unit"];
        assert_eq!(unit.type_id, eu["typeId"].as_str().unwrap(), "{id}: typeId");
        assert_eq!(
            unit.category.as_deref(),
            eu["category"].as_str(),
            "{id}: category"
        );
        assert_eq!(
            unit.hp,
            if eu["hp"].is_null() {
                None
            } else {
                Some(num(&eu["hp"]))
            },
            "{id}: hp"
        );
        assert_eq!(
            unit.hp_max,
            if eu["hpMax"].is_null() {
                None
            } else {
                Some(num(&eu["hpMax"]))
            },
            "{id}: hpMax"
        );
        assert_eq!(unit.ruch_left, num(&eu["ruchLeft"]), "{id}: ruchLeft");
        assert_eq!(
            unit.replace_used_this_turn,
            eu["replaceUsedThisTurn"].as_bool().unwrap(),
            "{id}: replaceUsedThisTurn"
        );
    }
}
