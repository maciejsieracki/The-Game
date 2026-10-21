use std::{collections::BTreeMap, error::Error, fmt, sync::OnceLock};

use serde::{Deserialize, Serialize};

use crate::data::derived::{parse_unit_stock_costs, UnitStockRow};
use crate::data::units_combat::{parse_units, UnitRecord};

/// Empire-stock quantities used by recruitment and the next-turn resource upkeep.
pub type ResourceStock = BTreeMap<String, u32>;

/// The one-time recruitment price and the recurring upkeep of one unit.
///
/// Stock cost and upkeep are deliberately separate: upkeep is charged by the
/// economy tick after the unit exists and never blocks its recruitment.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct UnitRecruitment {
    pub unit_id: String,
    pub unit_type: String,
    pub gold_cost: u32,
    pub gold_upkeep: u32,
    #[serde(default)]
    pub stock_cost: ResourceStock,
    #[serde(default)]
    pub resource_upkeep: ResourceStock,
    #[serde(default)]
    pub super_unit: bool,
}

impl UnitRecruitment {
    pub fn new(
        unit_id: impl Into<String>,
        unit_type: impl Into<String>,
        gold_cost: u32,
        gold_upkeep: u32,
    ) -> Self {
        Self {
            unit_id: unit_id.into(),
            unit_type: unit_type.into(),
            gold_cost,
            gold_upkeep,
            stock_cost: ResourceStock::new(),
            resource_upkeep: ResourceStock::new(),
            super_unit: false,
        }
    }

    pub fn with_stock_cost(mut self, resource: impl Into<String>, amount: u32) -> Self {
        if amount > 0 {
            self.stock_cost.insert(resource.into(), amount);
        }
        self
    }

    pub fn with_resource_upkeep(mut self, resource: impl Into<String>, amount: u32) -> Self {
        if amount > 0 {
            self.resource_upkeep.insert(resource.into(), amount);
        }
        self
    }

    pub fn with_super_unit(mut self) -> Self {
        self.super_unit = true;
        self
    }

    pub fn stock_cost(&self, resource: &str) -> Option<u32> {
        self.stock_cost.get(resource).copied()
    }

    pub fn stock_costs(&self) -> &ResourceStock {
        &self.stock_cost
    }

    pub fn resource_upkeep(&self, resource: &str) -> Option<u32> {
        self.resource_upkeep.get(resource).copied()
    }

    pub fn resource_upkeep_costs(&self) -> &ResourceStock {
        &self.resource_upkeep
    }

    /// Resource upkeep projected over a number of future economy ticks.
    pub fn resource_upkeep_for_turns(&self, turns: u32) -> ResourceStock {
        self.resource_upkeep
            .iter()
            .map(|(resource, amount)| (resource.clone(), amount.saturating_mul(turns)))
            .filter(|(_, amount)| *amount > 0)
            .collect()
    }

    pub fn validate(&self, available_stock: &ResourceStock) -> Result<(), RecruitmentError> {
        validate_recruitment(available_stock, self)
    }

    /// Validate all resources before mutating either balance.
    pub fn try_spend(&self, available_stock: &mut ResourceStock) -> Result<(), RecruitmentError> {
        validate_recruitment(available_stock, self)?;
        for (resource, required) in &self.stock_cost {
            let available = available_stock.get(resource).copied().unwrap_or_default();
            if *required > 0 {
                available_stock.insert(resource.clone(), available - required);
            }
        }
        Ok(())
    }
}

/// Why a one-time recruitment purchase was rejected.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RecruitmentError {
    InsufficientStock {
        resource: String,
        required: u32,
        available: u32,
    },
}

impl fmt::Display for RecruitmentError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InsufficientStock {
                resource,
                required,
                available,
            } => write!(
                formatter,
                "insufficient recruitment stock {resource}: need {required}, available {available}"
            ),
        }
    }
}

impl Error for RecruitmentError {}

/// Remaining empire stock after a successful one-time purchase.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecruitmentSpendResult {
    pub remaining_stock: ResourceStock,
}

/// Check only the one-time stock cost; future upkeep is intentionally excluded.
pub fn can_afford_recruitment(available_stock: &ResourceStock, unit: &UnitRecruitment) -> bool {
    validate_recruitment(available_stock, unit).is_ok()
}

pub fn validate_recruitment(
    available_stock: &ResourceStock,
    unit: &UnitRecruitment,
) -> Result<(), RecruitmentError> {
    for (resource, required) in &unit.stock_cost {
        let available = available_stock.get(resource).copied().unwrap_or_default();
        if available < *required {
            return Err(RecruitmentError::InsufficientStock {
                resource: resource.clone(),
                required: *required,
                available,
            });
        }
    }
    Ok(())
}

/// Spend only the purchase stock and leave the caller's map unchanged on error.
pub fn spend_recruitment(
    available_stock: &ResourceStock,
    unit: &UnitRecruitment,
) -> Result<RecruitmentSpendResult, RecruitmentError> {
    validate_recruitment(available_stock, unit)?;
    let mut remaining_stock = available_stock.clone();
    for (resource, required) in &unit.stock_cost {
        let available = remaining_stock.get(resource).copied().unwrap_or_default();
        if *required > 0 {
            remaining_stock.insert(resource.clone(), available - required);
        }
    }
    Ok(RecruitmentSpendResult { remaining_stock })
}

/// Compatibility alias matching the game's player/AI affordability gate.
pub fn can_afford_unit_recruitment(
    available_stock: &ResourceStock,
    unit: &UnitRecruitment,
) -> bool {
    can_afford_recruitment(available_stock, unit)
}

/// Sum recurring resource upkeep by canonical unit identifier.
pub fn total_resource_upkeep(unit_ids: &[&str]) -> ResourceStock {
    let mut total = ResourceStock::new();
    for unit_id in unit_ids {
        let Some(unit) = recruitment_for(unit_id) else {
            continue;
        };
        for (resource, amount) in &unit.resource_upkeep {
            let entry = total.entry(resource.clone()).or_default();
            *entry = entry.saturating_add(*amount);
        }
    }
    total
}

/// Project recurring upkeep for one unit over future economy ticks.
pub fn unit_resource_upkeep_for_turns(unit: &UnitRecruitment, turns: u32) -> ResourceStock {
    unit.resource_upkeep_for_turns(turns)
}

/// Canonical recruitment rows: one per `gra/data/units.json` record (75).
///
/// Source of the values, by field:
/// - `gold_cost`, `gold_upkeep`, `unit_type`, `super_unit`: embedded `units.json`
///   (`Pieniądz (koszt)`, `Utrzymanie (Pieniądz/turę)`, `Typ`, `Super-jednostka`), unchanged.
/// - `stock_cost` and `resource_upkeep`: the EDITABLE value table
///   `rust-port/engine/data/derived/unit-stock-costs.json` (P3-19). Its numbers are the
///   bootstrap of the web rules (epoch factor, mount horse surcharge `kon`); the engine
///   applies no multiplier at runtime. The owner balances by editing those numbers.
///
/// Panics only if an embedded file is malformed or a unit has no derived row.
pub fn canonical_recruitment_costs() -> Vec<UnitRecruitment> {
    static CANONICAL: OnceLock<Vec<UnitRecruitment>> = OnceLock::new();
    CANONICAL
        .get_or_init(|| {
            let records = parse_units().expect("embedded units.json must parse");
            let derived = parse_unit_stock_costs().expect("embedded derived unit table must parse");
            let rows: BTreeMap<&str, &UnitStockRow> = derived
                .wiersze
                .iter()
                .map(|row| (row.jednostka.as_str(), row))
                .collect();
            records
                .iter()
                .map(|record| {
                    let row = rows
                        .get(record.jednostka.as_str())
                        .unwrap_or_else(|| panic!("derived unit table lacks {}", record.jednostka));
                    recruitment_from_unit_record(record, row)
                })
                .collect()
        })
        .clone()
}

fn recruitment_from_unit_record(record: &UnitRecord, row: &UnitStockRow) -> UnitRecruitment {
    let mut unit = UnitRecruitment::new(
        record.jednostka.as_str(),
        record.typ.as_str(),
        non_negative(record.pieniadz_koszt, "Pieniądz (koszt)"),
        non_negative(
            record.utrzymanie_pieniadz_ture,
            "Utrzymanie (Pieniądz/turę)",
        ),
    );
    for (resource, amount) in &row.surowiec {
        unit = unit.with_stock_cost(resource.as_str(), *amount);
    }
    for (resource, amount) in &row.utrzymanie_surowiec {
        unit = unit.with_resource_upkeep(resource.as_str(), *amount);
    }
    if record.super_jednostka == "TAK" {
        unit = unit.with_super_unit();
    }
    unit
}

fn non_negative(value: i64, field: &str) -> u32 {
    u32::try_from(value).unwrap_or_else(|_| panic!("units.json field {field} must be >= 0"))
}

/// Find a fresh canonical record by the exact `Jednostka` identifier.
pub fn recruitment_for(unit_id: &str) -> Option<UnitRecruitment> {
    canonical_recruitment_costs()
        .into_iter()
        .find(|unit| unit.unit_id == unit_id)
}

/// Compatibility alias for catalog callers.
pub fn unit_recruitment(unit_id: &str) -> Option<UnitRecruitment> {
    recruitment_for(unit_id)
}
