use std::{collections::BTreeMap, error::Error, fmt};

use serde::{Deserialize, Serialize};

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

/// Canonical building-cost records currently present in `gra/data/buildings.json`.
///
/// The Rust port keeps this table explicit until the data-loader boundary is
/// introduced. Returning fresh values prevents callers from mutating a shared
/// global catalog and makes the function safe to use in tests and simulations.
pub fn canonical_building_costs() -> Vec<BuildingCost> {
    fn record(
        building_id: &str,
        base_work: u32,
        work_increment: u32,
        resources: &[(&str, u32)],
    ) -> BuildingCost {
        resources.iter().fold(
            BuildingCost::new(building_id, base_work, work_increment),
            |cost, (resource, amount)| cost.with_resource_cost(*resource, *amount),
        )
    }

    [
        record("stolarnia", 20, 10, &[("drewno", 25)]),
        record("kamieniarski", 20, 10, &[("drewno", 30)]),
        record("kuznia", 30, 10, &[("drewno", 30), ("kamien", 30)]),
        record("odlewnia_brazu", 28, 10, &[("drewno", 30), ("kamien", 40)]),
        record("odlewnia_zelaza", 35, 12, &[("drewno", 40), ("cegla", 50)]),
        record("wielka_odlewnia", 80, 15, &[("drewno", 60), ("cegla", 70)]),
        record("targowisko", 25, 10, &[("drewno", 30)]),
        record("port", 30, 10, &[("drewno", 60), ("kamien", 30)]),
        record("port_wielki", 55, 12, &[("drewno", 60), ("kamien", 50)]),
        record("spichlerz", 20, 8, &[("drewno", 40)]),
        record("spichlerz_ii", 35, 12, &[("drewno", 40), ("kamien", 50)]),
        record("garncarnia", 18, 8, &[("drewno", 30)]),
        record("cegielnia", 22, 9, &[("drewno", 30), ("kamien", 30)]),
        record("kamienne_kregi", 18, 8, &[("kamien", 40)]),
        record("swiatynia", 25, 10, &[("drewno", 30), ("kamien", 40)]),
        record("biblioteka", 25, 10, &[("drewno", 30), ("kamien", 30)]),
        record("studnia", 15, 5, &[("drewno", 25)]),
        record("akwedukt", 30, 12, &[("drewno", 30), ("kamien", 60)]),
        record("mennica", 28, 10, &[("drewno", 30), ("kamien", 40)]),
        record("palisada", 22, 8, &[("drewno", 60)]),
        record("mury", 35, 12, &[("drewno", 40), ("kamien", 80)]),
        record("koszary", 25, 10, &[("drewno", 40), ("kamien", 40)]),
        record("magazyn", 20, 8, &[("drewno", 50), ("kamien", 30)]),
        record("stela", 15, 5, &[("kamien", 30)]),
        record("palac", 40, 12, &[]),
        record("palac_ii", 60, 18, &[("drewno", 50), ("kamien", 50)]),
        record("palac_iii", 90, 27, &[("drewno", 50), ("cegla", 70)]),
        record("kuznia_zelaza", 60, 15, &[("drewno", 40), ("cegla", 50)]),
        record("wielka_kuznia", 90, 18, &[("drewno", 60), ("cegla", 80)]),
        record("fort", 70, 15, &[("drewno", 50), ("kamien", 100)]),
        record("baszta", 70, 15, &[("drewno", 50), ("kamien", 100)]),
        record(
            "warsztat_oblezniczy",
            65,
            15,
            &[("drewno", 50), ("kamien", 50)],
        ),
        record("akademia", 70, 15, &[("drewno", 40), ("cegla", 70)]),
        record("teatr", 55, 12, &[("drewno", 40), ("cegla", 50)]),
        record("sad", 55, 12, &[("drewno", 30), ("cegla", 50)]),
        record("dom_starszyzny", 25, 5, &[("drewno", 30)]),
        record("dwor_zarzadcy", 45, 9, &[("drewno", 30), ("kamien", 30)]),
        record("pretorium", 75, 15, &[("drewno", 40), ("cegla", 50)]),
        record("trybunal", 30, 10, &[("drewno", 30), ("kamien", 40)]),
        record("garnizon", 30, 6, &[("drewno", 30)]),
        record("laznia_publiczna", 50, 12, &[("drewno", 40), ("cegla", 60)]),
        record(
            "akademia_wojskowa",
            80,
            18,
            &[("drewno", 50), ("cegla", 70)],
        ),
    ]
    .into_iter()
    .collect()
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

/// Apply the global 50% Work reduction with the same integer rounding as the
/// game's `Math.round`: half units round upward, and zero remains zero.
pub fn effective_work_cost(raw_work: u32) -> u32 {
    raw_work / 2 + raw_work % 2
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
