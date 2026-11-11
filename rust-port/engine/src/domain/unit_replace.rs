//! R-RUSTPORT-REPIN-UNIT-REPLACE-Q1: port mechanizmu "Zastap" (gracz i AI) z weba.
//!
//! web (pin origin/main, 2026-11-11):
//! - gra/src/game/unit-replace-cost.ts: `unitReplaceFullCost`, `unitReplaceStockMissing`,
//!   `canAffordUnitReplace`, `mergeStockPaid` (etykiety UI `unitReplaceStockMissingLabel`,
//!   `unitReplaceStockText` NIE portowane: prezentacja, zob. P6-REPIN-UNIT-REPLACE.md),
//! - gra/src/game/unit-replace-execute.ts: `executeUnitReplace` (wspolna mutacja gracz/AI),
//! - gra/src/game/unit-replace-context.ts: `buildReplaceAvailabilityCtx` (JUZ w Rust:
//!   `recruitment.rs` `build_replace_availability_ctx`, tozsamosciowa skladania pol),
//! - gra/src/game/ai-unit-replace-plan.ts: `AI_UNIT_REPLACE_MAX_FRACTION`,
//!   `loadAiUnitReplaceMaxFraction`, `aiUnitReplaceCap`, `planAiUnitReplaceOrder`,
//!   `aiReplaceKeepsArmyClass`, `aiReplaceReserveOk`,
//! - gra/src/game/ai-army-composition.ts:42-61 `armyClassOfTyp` (port lokalny: w Rust brak
//!   osobnego modulu skladu armii; mapowanie 1:1).
//!
//! Wejscia i wyjscia sa zgodne z wektorami z uruchomionego weba
//! (`tests/p6_repin_unit_replace_vectors/`). Pieniadz liczony jako f64 (JS number).

use crate::domain::ai_zakup_jednostki::{
    should_ai_purchase_unit, AiPurchaseInput, AiPurchaseReserveParams,
};
use crate::domain::building_costs::p6_7b::{
    missing_stock_for, unit_stock_cost, StockRecord, UnitStockCostSource,
};
use crate::domain::civ_matrix::js_compat::{js_math_round, js_max};
use std::cmp::Ordering;

/// Web `AI_UNIT_REPLACE_MAX_FRACTION`: maks. odsetek armii zamienianej w jednej turze AI.
pub const AI_UNIT_REPLACE_MAX_FRACTION: f64 = 0.1;

/// Klasa armii (web `ArmyClass`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArmyClass {
    Wrecz,
    Dystans,
    Konnica,
}

/// Web `armyClassOfTyp`: Typ units.json -> klasa; Siege/Civilian/Naval/nieznane -> None.
pub fn army_class_of_typ(typ: Option<&str>) -> Option<ArmyClass> {
    match typ.unwrap_or("").trim() {
        "Swordsman" | "Spearman" | "Falangite" | "Offensive" => Some(ArmyClass::Wrecz),
        "Distance" | "Slinger" => Some(ArmyClass::Dystans),
        "Mount" => Some(ArmyClass::Konnica),
        _ => None,
    }
}

/// Web `aiReplaceKeepsArmyClass`: klasa nieznana po ktorejkolwiek stronie = dozwolone.
pub fn ai_replace_keeps_army_class(old_typ: Option<&str>, new_typ: Option<&str>) -> bool {
    let a = army_class_of_typ(old_typ);
    let b = army_class_of_typ(new_typ);
    a.is_none() || b.is_none() || a == b
}

/// Web `UnitReplaceCost`: pelny koszt rekrutacji nowej jednostki (Pieniadz + surowiec z puli).
#[derive(Debug, Clone, PartialEq)]
pub struct UnitReplaceCost {
    pub money: f64,
    pub stock: StockRecord,
}

/// Web `unitReplaceFullCost(newDef, moneyCost)` (D1 = C: pelny koszt, nie roznica).
pub fn unit_replace_full_cost(
    new_def: Option<&UnitStockCostSource>,
    money_cost: f64,
) -> UnitReplaceCost {
    let money = if money_cost.is_finite() && money_cost > 0.0 {
        js_math_round(money_cost)
    } else {
        0.0
    };
    UnitReplaceCost {
        money,
        stock: unit_stock_cost(new_def),
    }
}

/// Web `unitReplaceStockMissing`: brakujace surowce w puli panstwa (pusta = pokryte).
pub fn unit_replace_stock_missing(
    cost: &UnitReplaceCost,
    pool: Option<&StockRecord>,
) -> StockRecord {
    missing_stock_for(pool, &cost.stock)
}

/// Web `canAffordUnitReplace`: skarbiec >= Pieniadz i pula pokrywa surowce.
pub fn can_afford_unit_replace(
    cost: &UnitReplaceCost,
    treasury: f64,
    pool: Option<&StockRecord>,
) -> bool {
    if treasury < cost.money {
        return false;
    }
    unit_replace_stock_missing(cost, pool).is_empty()
}

/// Web `mergeStockPaid`: dolicza zuzyte surowce do sladu (tylko skonczone wartosci > 0).
pub fn merge_stock_paid(previous: Option<&StockRecord>, added: &StockRecord) -> StockRecord {
    let mut out = previous.cloned().unwrap_or_default();
    for (key, amount) in added {
        if amount.is_finite() && *amount > 0.0 {
            *out.entry(key.clone()).or_insert(0.0) += amount;
        }
    }
    out
}

/// Web `aiUnitReplaceCap`: <= 10% armii, co najmniej 1 gdy armia niepusta.
pub fn ai_unit_replace_cap(military_count: f64, fraction: f64) -> f64 {
    // JS `!(n > 0)`: NaN i n <= 0 daja 0 (bez negacji porownania, zob. clippy).
    if military_count.is_nan() || military_count <= 0.0 {
        return 0.0;
    }
    js_max(1.0, (military_count * fraction).floor())
}

/// Web `loadAiUnitReplaceMaxFraction`: `None` = brak/niepoprawny wpis (zachowuje 10%).
pub fn load_ai_unit_replace_max_fraction(value: Option<f64>) -> f64 {
    match value {
        Some(v) if v.is_finite() && v >= 0.0 => v,
        _ => AI_UNIT_REPLACE_MAX_FRACTION,
    }
}

/// Web `AiReplaceUnitInfo`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiReplaceUnitInfo {
    /// Numer epoki aktualnej definicji jednostki.
    pub epoch: f64,
    /// Sila aktualnej definicji (mniejsza = wczesniej).
    pub power: f64,
    /// Jednostka zablokowana (bitwa, oblezenie, marsz, ...).
    pub blocked: bool,
}

/// Web `planAiUnitReplaceOrder`: indeksy jednostek od najstarszych/najslabszych; zablokowane
/// odfiltrowane. Remis -> kolejnosc wejsciowa (stabilnie).
pub fn plan_ai_unit_replace_order<U>(
    units: &[U],
    info: impl Fn(&U) -> AiReplaceUnitInfo,
) -> Vec<usize> {
    let mut rows: Vec<(usize, AiReplaceUnitInfo)> = units
        .iter()
        .enumerate()
        .map(|(i, u)| (i, info(u)))
        .filter(|(_, inf)| !inf.blocked)
        .collect();
    rows.sort_by(|(ia, a), (ib, b)| {
        a.epoch
            .partial_cmp(&b.epoch)
            .unwrap_or(Ordering::Equal)
            .then(a.power.partial_cmp(&b.power).unwrap_or(Ordering::Equal))
            .then(ia.cmp(ib))
    });
    rows.into_iter().map(|(i, _)| i).collect()
}

/// Web `AiReplaceReserveInput` (argumenty `aiReplaceReserveOk`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiReplaceReserveInput {
    pub treasury: f64,
    /// Pelny koszt Pieniadza nowej jednostki.
    pub money_cost: f64,
    pub reserve: Option<AiPurchaseReserveParams>,
    pub net_income_per_turn: Option<f64>,
    pub upkeep_per_turn: Option<f64>,
    pub unit_upkeep_per_turn: Option<f64>,
}

/// Web `aiReplaceReserveOk`: ta sama regula rezerwy co zakup AI (`shouldAIPurchaseUnit`),
/// hasManpower = true (zamiana nie zwieksza liczby jednostek).
pub fn ai_replace_reserve_ok(inp: &AiReplaceReserveInput) -> bool {
    should_ai_purchase_unit(&AiPurchaseInput {
        treasury: inp.treasury,
        gold_cost: js_max(0.0, inp.money_cost),
        has_manpower: true,
        reserve: inp.reserve,
        net_income_per_turn: inp.net_income_per_turn,
        upkeep_per_turn: inp.upkeep_per_turn,
        unit_upkeep_per_turn: inp.unit_upkeep_per_turn,
    })
}

/// Stan jednostki potrzebny do zamiany (pola `UnitDef`-owe wspolne dla gracza i AI).
#[derive(Debug, Clone, PartialEq)]
pub struct UnitReplaceTarget {
    pub type_id: String,
    pub category: Option<String>,
    /// `None` = brak pola w web (`unit.hp ?? oldMaxHp`).
    pub hp: Option<f64>,
    pub hp_max: Option<f64>,
    pub ruch_left: f64,
    pub replace_used_this_turn: bool,
}

/// Zaleznosci wykonania zamiany (web `UnitReplaceExecuteDeps`).
pub trait UnitReplaceDeps {
    /// Powod blokady przed kosztem albo None.
    fn gate_reason(&self, unit: &UnitReplaceTarget, new_type_id: &str) -> Option<String>;
    fn money_cost(&self, new_type_id: &str, unit: &UnitReplaceTarget) -> f64;
    fn stock_cost(&self, new_type_id: &str, unit: &UnitReplaceTarget) -> StockRecord;
    fn can_pay_stock(&self, cost: &StockRecord, unit: &UnitReplaceTarget) -> bool;
    fn pay_stock(&mut self, cost: &StockRecord, unit: &UnitReplaceTarget);
    fn current_treasury(&self) -> f64;
    fn set_treasury(&mut self, value: f64);
    fn old_max_hp(&self, unit: &UnitReplaceTarget) -> f64;
    fn new_max_hp(&self, unit: &UnitReplaceTarget, new_type_id: &str) -> f64;
    fn category(&self, new_type_id: &str) -> String;
    /// true = aktualizuj tez `hp_max` (AI).
    fn sync_hp_max(&self) -> bool;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnitReplaceFail {
    Used,
    Gate,
    Stock,
    Money,
}

/// Web `UnitReplaceResult`.
#[derive(Debug, Clone, PartialEq)]
pub enum UnitReplaceResult {
    Ok {
        old_type_id: String,
        money: f64,
        stock: StockRecord,
    },
    Fail {
        reason: UnitReplaceFail,
        detail: Option<String>,
        money: f64,
        stock: StockRecord,
    },
}

/// Web `executeUnitReplace`: mutuje wylacznie przy sukcesie; brak zasobow = brak mutacji.
pub fn execute_unit_replace<D: UnitReplaceDeps>(
    unit: &mut UnitReplaceTarget,
    new_type_id: &str,
    deps: &mut D,
) -> UnitReplaceResult {
    let empty = StockRecord::new();
    if unit.replace_used_this_turn {
        return UnitReplaceResult::Fail {
            reason: UnitReplaceFail::Used,
            detail: None,
            money: 0.0,
            stock: empty,
        };
    }
    if let Some(detail) = deps.gate_reason(unit, new_type_id) {
        return UnitReplaceResult::Fail {
            reason: UnitReplaceFail::Gate,
            detail: Some(detail),
            money: 0.0,
            stock: empty,
        };
    }

    let raw_money = deps.money_cost(new_type_id, unit);
    let money = if raw_money.is_finite() && raw_money > 0.0 {
        js_math_round(raw_money)
    } else {
        0.0
    };
    let stock = deps.stock_cost(new_type_id, unit);
    let has_stock = stock.values().any(|amount| *amount > 0.0);
    if has_stock && !deps.can_pay_stock(&stock, unit) {
        return UnitReplaceResult::Fail {
            reason: UnitReplaceFail::Stock,
            detail: None,
            money,
            stock,
        };
    }
    let treasury = deps.current_treasury();
    if treasury < money {
        return UnitReplaceResult::Fail {
            reason: UnitReplaceFail::Money,
            detail: None,
            money,
            stock,
        };
    }

    let old_max_hp = deps.old_max_hp(unit);
    let new_max_hp = deps.new_max_hp(unit, new_type_id);
    let old_hp = unit.hp.unwrap_or(old_max_hp);
    let ratio = if old_max_hp > 0.0 {
        old_hp / old_max_hp
    } else {
        1.0
    };
    let new_hp = js_max(1.0, js_math_round(new_max_hp * ratio));

    if money > 0.0 {
        deps.set_treasury(treasury - money);
    }
    if has_stock {
        deps.pay_stock(&stock, unit);
    }

    let old_type_id = unit.type_id.clone();
    unit.type_id = new_type_id.to_owned();
    unit.category = Some(deps.category(new_type_id));
    unit.hp = Some(new_hp);
    if deps.sync_hp_max() {
        unit.hp_max = Some(new_max_hp);
    }
    unit.ruch_left = 0.0;
    unit.replace_used_this_turn = true;
    UnitReplaceResult::Ok {
        old_type_id,
        money,
        stock,
    }
}
