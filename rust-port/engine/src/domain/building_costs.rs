use std::{collections::BTreeMap, error::Error, fmt};

use serde::{Deserialize, Serialize};

use std::sync::OnceLock;

use crate::data::derived::{parse_building_stock_costs, parse_building_work_costs, StockMap};

/// Resource quantities charged once when a building is queued.
///
/// The keys intentionally remain strings because they are the canonical keys
/// from `buildings.json` (for example `drewno` and `kamien`) and the catalog can
/// gain new processed resources without changing this domain type.
pub type ResourceStock = BTreeMap<String, u32>;

/// The two independent parts of a building's construction cost.
///
/// `base_work` and `work_increment` mirror `kosztBudowy` and
/// `przyrostKosztu`. `resource_cost` mirrors `koszt_surowce` and is never
/// affected by the 50% Work rule.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BuildingCost {
    pub building_id: String,
    pub base_work: u32,
    pub work_increment: u32,
    #[serde(default)]
    pub resource_cost: ResourceStock,
}

impl BuildingCost {
    pub fn new(building_id: impl Into<String>, base_work: u32, work_increment: u32) -> Self {
        Self {
            building_id: building_id.into(),
            base_work,
            work_increment,
            resource_cost: ResourceStock::new(),
        }
    }

    pub fn with_resource_cost(mut self, resource: impl Into<String>, amount: u32) -> Self {
        self.resource_cost.insert(resource.into(), amount);
        self
    }

    /// Raw Work cost for a 1-based building level.
    ///
    /// Level zero and negative levels do not exist in the game; accepting zero
    /// as level one keeps this boundary defensive and matches the TypeScript
    /// `Math.max(1, level)` behavior. Saturating arithmetic prevents malformed
    /// imported data from wrapping into a cheap construction.
    pub fn work_cost(&self, level: u32) -> u32 {
        let level_after_first = level.saturating_sub(1);
        self.base_work
            .saturating_add(self.work_increment.saturating_mul(level_after_first))
    }

    /// Effective Work cost after the global 50% reduction.
    pub fn effective_work_cost(&self, level: u32) -> u32 {
        effective_work_cost(self.work_cost(level))
    }

    /// Returns the raw stock quantity for one resource, if it is listed.
    pub fn resource_cost(&self, resource: &str) -> Option<u32> {
        self.resource_cost.get(resource).copied()
    }

    /// Alias for callers that use the UI's “stock cost” terminology.
    pub fn stock_cost(&self, resource: &str) -> Option<u32> {
        self.resource_cost(resource)
    }

    pub fn resource_costs(&self) -> &ResourceStock {
        &self.resource_cost
    }

    pub fn validate_expenditure(
        &self,
        available_work: u32,
        available_resources: &ResourceStock,
        level: u32,
    ) -> Result<(), BuildingSpendError> {
        validate_building_expenditure(available_work, available_resources, self, level)
    }

    /// Validate first, then mutate both balances. A failed validation leaves
    /// either input untouched, so a caller cannot lose only part of a cost.
    pub fn try_spend(
        &self,
        available_work: &mut u32,
        available_resources: &mut ResourceStock,
        level: u32,
    ) -> Result<(), BuildingSpendError> {
        validate_building_expenditure(*available_work, available_resources, self, level)?;

        *available_work -= self.effective_work_cost(level);
        for (resource, required) in &self.resource_cost {
            let available = available_resources
                .get(resource)
                .copied()
                .unwrap_or_default();
            available_resources.insert(resource.clone(), available - required);
        }
        Ok(())
    }
}

/// Canonical building-cost records: the 42 buildings of `gra/data/buildings.json`.
///
/// Returning fresh values prevents callers from mutating a shared global catalog
/// and makes the function safe to use in tests and simulations.
pub fn canonical_building_costs() -> Vec<BuildingCost> {
    // P3-19 runda 3 (Q1=A): Praca i koszt surowcowy są CAŁKOWICIE z tabel wartości
    // `data/derived/building-work-costs.json` i `building-stock-costs.json`. Liczby już
    // zawierają mnożnik ery (web `buildingEraCostMultiplier`) i FALA2 (dla surowców);
    // silnik nie mnoży niczego w czasie gry.
    static CANONICAL: OnceLock<Vec<BuildingCost>> = OnceLock::new();
    CANONICAL
        .get_or_init(|| {
            let work_file =
                parse_building_work_costs().expect("embedded derived work table must parse");
            let stock_file =
                parse_building_stock_costs().expect("embedded derived building table must parse");
            let stock: BTreeMap<&str, &StockMap> = stock_file
                .wiersze
                .iter()
                .map(|row| (row.budynek.as_str(), &row.koszt_surowce))
                .collect();

            work_file
                .wiersze
                .iter()
                .map(|work| {
                    let building_id = work.budynek.as_str();
                    let resources = stock
                        .get(building_id)
                        .unwrap_or_else(|| panic!("derived building table lacks {building_id}"));
                    resources.iter().fold(
                        BuildingCost::new(building_id, work.praca_bazowa, work.praca_przyrost),
                        |cost, (resource, amount)| {
                            cost.with_resource_cost(resource.as_str(), *amount)
                        },
                    )
                })
                .collect()
        })
        .clone()
}

/// Find one canonical building record by its data-file identifier.
pub fn building_cost_for(id: &str) -> Option<BuildingCost> {
    canonical_building_costs()
        .into_iter()
        .find(|cost| cost.building_id == id)
}

/// Compatibility name for callers treating the catalog as a lookup table.
pub fn building_cost(id: &str) -> Option<BuildingCost> {
    building_cost_for(id)
}

/// The remaining balances after an immutable, transactional spend operation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingSpendResult {
    pub remaining_work: u32,
    pub remaining_resources: ResourceStock,
}

/// Why a construction spend was rejected.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BuildingSpendError {
    InsufficientWork {
        required: u32,
        available: u32,
    },
    InsufficientResource {
        resource: String,
        required: u32,
        available: u32,
    },
}

impl fmt::Display for BuildingSpendError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InsufficientWork {
                required,
                available,
            } => write!(
                formatter,
                "insufficient Work: need {required}, available {available}"
            ),
            Self::InsufficientResource {
                resource,
                required,
                available,
            } => write!(
                formatter,
                "insufficient resource {resource}: need {required}, available {available}"
            ),
        }
    }
}

impl Error for BuildingSpendError {}

/// Effective Work cost of a building at a given raw level cost.
///
/// P3-19 runda 3 (Q1=A, web 1:1): the former global 50% reduction (`raw / 2`, rounded up)
/// was a Rust-only divergence from the web (`buildingWorkCost`, `production.ts:514-529`,
/// stacking 0.25 x 2 x 2 = 1.0). The value is now the raw table value; the multiplier of
/// the building's entry era is already inside the derived table.
pub fn effective_work_cost(raw_work: u32) -> u32 {
    raw_work
}

/// Resolve the raw linear cost from its JSON-equivalent fields.
pub fn work_cost_for_level(base_work: u32, work_increment: u32, level: u32) -> u32 {
    BuildingCost::new("", base_work, work_increment).work_cost(level)
}

/// Resolve a building's effective Work cost at the requested level.
pub fn building_work_cost(cost: &BuildingCost, level: u32) -> u32 {
    cost.effective_work_cost(level)
}

/// Check the complete transaction without mutating the caller's balances.
/// Work is checked before resources, matching the single-front production gate.
pub fn validate_building_expenditure(
    available_work: u32,
    available_resources: &ResourceStock,
    cost: &BuildingCost,
    level: u32,
) -> Result<(), BuildingSpendError> {
    let required_work = cost.effective_work_cost(level);
    if available_work < required_work {
        return Err(BuildingSpendError::InsufficientWork {
            required: required_work,
            available: available_work,
        });
    }

    for (resource, required) in &cost.resource_cost {
        let available = available_resources
            .get(resource)
            .copied()
            .unwrap_or_default();
        if available < *required {
            return Err(BuildingSpendError::InsufficientResource {
                resource: resource.clone(),
                required: *required,
                available,
            });
        }
    }
    Ok(())
}

/// Spend a building cost transactionally, returning fresh remaining balances.
pub fn spend_building_cost(
    available_work: u32,
    available_resources: &ResourceStock,
    cost: &BuildingCost,
    level: u32,
) -> Result<BuildingSpendResult, BuildingSpendError> {
    validate_building_expenditure(available_work, available_resources, cost, level)?;

    let mut remaining_resources = available_resources.clone();
    let required_work = cost.effective_work_cost(level);
    for (resource, required) in &cost.resource_cost {
        let available = remaining_resources
            .get(resource)
            .copied()
            .unwrap_or_default();
        remaining_resources.insert(resource.clone(), available - required);
    }

    Ok(BuildingSpendResult {
        remaining_work: available_work - required_work,
        remaining_resources,
    })
}

/// Mutable equivalent of [`spend_building_cost`] for engine state holders.
pub fn try_spend_building_cost(
    available_work: &mut u32,
    available_resources: &mut ResourceStock,
    cost: &BuildingCost,
    level: u32,
) -> Result<(), BuildingSpendError> {
    cost.try_spend(available_work, available_resources, level)
}
