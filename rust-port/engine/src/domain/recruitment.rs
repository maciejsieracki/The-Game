use std::{collections::BTreeMap, error::Error, fmt};

use serde::{Deserialize, Serialize};

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

/// Canonical recruitment rows mirrored from `gra/data/units.json`.
pub fn canonical_recruitment_costs() -> Vec<UnitRecruitment> {
    fn record(
        unit_id: &str,
        unit_type: &str,
        gold_cost: u32,
        gold_upkeep: u32,
        stock: &[(&str, u32)],
        upkeep: &[(&str, u32)],
        super_unit: bool,
    ) -> UnitRecruitment {
        let unit = stock.iter().fold(
            UnitRecruitment::new(unit_id, unit_type, gold_cost, gold_upkeep),
            |unit, (resource, amount)| unit.with_stock_cost(*resource, *amount),
        );
        let unit = upkeep.iter().fold(unit, |unit, (resource, amount)| {
            unit.with_resource_upkeep(*resource, *amount)
        });
        if super_unit {
            unit.with_super_unit()
        } else {
            unit
        }
    }

    [
        record(
            "Wojownik",
            "Swordsman",
            10,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Procarz",
            "Slinger",
            8,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Oszczepnik",
            "Distance",
            6,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Łucznik",
            "Distance",
            6,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record("Zwiadowca", "Civilian", 8, 0, &[], &[], false),
        record(
            "Włócznik",
            "Spearman",
            16,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik z mieczem i tarczą",
            "Swordsman",
            16,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Rydwan (woły)",
            "Mount",
            30,
            3,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Konnica",
            "Mount",
            22,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Galera",
            "Naval",
            18,
            3,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Falanga",
            "Falangite",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Hieros Lochos (Święty Zastęp)",
            "Swordsman",
            0,
            0,
            &[("zelazo", 75)],
            &[("zelazo", 15)],
            true,
        ),
        record(
            "Hastati",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Triari",
            "Spearman",
            0,
            0,
            &[("zelazo", 75)],
            &[("zelazo", 15)],
            true,
        ),
        record(
            "Jeździec chiński",
            "Mount",
            28,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Hu Ben Wei (Gwardia Tygrysa)",
            "Swordsman",
            0,
            0,
            &[("braz", 75)],
            &[("braz", 15)],
            true,
        ),
        record(
            "Impi",
            "Spearman",
            16,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Oszczepnik Zulu (Izijula)",
            "Distance",
            20,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "uThulwana (Białe Tarcze)",
            "Swordsman",
            0,
            0,
            &[("braz", 75)],
            &[("braz", 15)],
            true,
        ),
        record(
            "Wojownik z maczugą (Chaska)",
            "Offensive",
            26,
            2,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Wojownik z toporem",
            "Offensive",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Procarz (Huaracoc)",
            "Slinger",
            8,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Oszczepnik (Estólica)",
            "Distance",
            9,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Królewska Gwardia",
            "Swordsman",
            0,
            0,
            &[("braz", 75)],
            &[("braz", 15)],
            true,
        ),
        record(
            "Rydwan konny",
            "Mount",
            28,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Łucznik egipski",
            "Distance",
            14,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Rydwan egipski",
            "Mount",
            32,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik z khopesh",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Medżaj (Gwardia Faraona)",
            "Swordsman",
            0,
            0,
            &[("braz", 75)],
            &[("braz", 15)],
            true,
        ),
        record(
            "Łucznik nubijski",
            "Distance",
            20,
            2,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Łucznik sumeryjski",
            "Distance",
            9,
            1,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Rydwan sumeryjski",
            "Mount",
            38,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Włócznik sumeryjski",
            "Spearman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Gwardia Królewska Sumeru",
            "Swordsman",
            0,
            0,
            &[("braz", 75)],
            &[("braz", 15)],
            true,
        ),
        record(
            "Wojownik mykeński",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Rydwan mykeński",
            "Mount",
            30,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik Sherden",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Halabardnik Shang",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Rydwan Shang",
            "Mount",
            32,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Łucznik akadyjski",
            "Distance",
            16,
            2,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Gaesatae",
            "Swordsman",
            14,
            1,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Soldurii",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Rydwan celtycki",
            "Mount",
            28,
            3,
            &[("zelazo", 50), ("kon", 25)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Wojownik germański",
            "Swordsman",
            0,
            2,
            &[("zelazo", 75)],
            &[("zelazo", 15)],
            true,
        ),
        record(
            "Berserker germański",
            "Swordsman",
            16,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Taran",
            "Siege",
            14,
            1,
            &[("drewno", 75)],
            &[("drewno", 15)],
            false,
        ),
        record(
            "Taran okuty",
            "Siege",
            18,
            2,
            &[("braz", 75)],
            &[("braz", 15)],
            false,
        ),
        record(
            "Katapulta",
            "Siege",
            18,
            2,
            &[("zelazo", 75)],
            &[("zelazo", 15)],
            false,
        ),
        record(
            "Wieża oblężnicza",
            "Siege",
            20,
            2,
            &[("braz", 75)],
            &[("braz", 15)],
            false,
        ),
        record(
            "Wojownik tyrreński",
            "Offensive",
            15,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik szekelesz",
            "Spearman",
            14,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Konnica lancowa asyryjska",
            "Mount",
            32,
            3,
            &[("zelazo", 50), ("kon", 25)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Konnica łucznicza asyryjska",
            "Mount",
            30,
            3,
            &[("zelazo", 50), ("kon", 25)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Łucznik asyryjski",
            "Distance",
            14,
            2,
            &[("drewno", 50)],
            &[("drewno", 10)],
            false,
        ),
        record(
            "Drużynnik",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Jeździec z oszczepami",
            "Mount",
            26,
            3,
            &[("zelazo", 50), ("kon", 25)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Strażnik bram Harappy",
            "Spearman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Piechota induska",
            "Spearman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Garnizon Harappy",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Rydwan Kapadokijski",
            "Mount",
            34,
            3,
            &[("braz", 50), ("kon", 25)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Piechota hetycka",
            "Spearman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Gwardia hetycka",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Gwardia Ishtar",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik babiloński",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Piechota neobabilońska",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Tyrski miecznik",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Wojownik fenicki",
            "Swordsman",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Gwardia Tyreńska",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Thorakites",
            "Spearman",
            16,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Evocati",
            "Swordsman",
            0,
            0,
            &[("zelazo", 75)],
            &[("zelazo", 15)],
            true,
        ),
        record(
            "iButho z iklwa",
            "Spearman",
            16,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Gwardzista z champi",
            "Offensive",
            18,
            2,
            &[("braz", 50)],
            &[("braz", 10)],
            false,
        ),
        record(
            "Wojownik z żelaznym khopesh",
            "Swordsman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Mur tarcz (Sargonid)",
            "Spearman",
            18,
            2,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
        record(
            "Miecznik galijski",
            "Swordsman",
            14,
            1,
            &[("zelazo", 50)],
            &[("zelazo", 10)],
            false,
        ),
    ]
    .into_iter()
    .collect()
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
