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
