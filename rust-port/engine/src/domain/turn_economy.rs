//! Deterministic settlement of one game's economy turn.
//!
//! The turn contract is deliberately explicit:
//!
//! 1. credit all income;
//! 2. pay all expenses from the credited balances (without allowing a balance
//!    to become negative);
//! 3. reset the turn-scoped Work pool;
//! 4. advance the one-based turn counter.
//!
//! Treasury, Science, Culture, Food, and material stocks are persistent
//! balances. Work is a per-turn budget: it can be produced and spent during a
//! settlement, but unused Work is discarded at the reset step. This keeps the
//! ordering testable without coupling the domain module to map or UI types.

use std::{collections::BTreeMap, error::Error, fmt};

use serde::{de, Deserialize, Deserializer, Serialize};

/// A non-negative stock indexed by the canonical resource key.
pub type ResourceStock = BTreeMap<String, u64>;

/// Additive income or expenditure for one economy settlement.
///
/// All values are unsigned because the direction is represented by the
/// operation (`credit` or `spend`). Material resources remain string-keyed so
/// new resources do not require a Rust enum change.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct EconomyFlow {
    pub treasury: u64,
    pub science: u64,
    pub culture: u64,
    pub food: u64,
    pub work: u64,
    #[serde(default)]
    pub resources: ResourceStock,
}

impl EconomyFlow {
    pub const fn zero() -> Self {
        Self {
            treasury: 0,
            science: 0,
            culture: 0,
            food: 0,
            work: 0,
            resources: BTreeMap::new(),
        }
    }

    pub fn with_resource(mut self, resource: impl Into<String>, amount: u64) -> Self {
        self.add_resource(resource, amount);
        self
    }

    pub fn add_resource(&mut self, resource: impl Into<String>, amount: u64) {
        let key = resource.into();
        let entry = self.resources.entry(key).or_default();
        *entry = entry.saturating_add(amount);
    }

    pub fn resource(&self, resource: &str) -> u64 {
        self.resources.get(resource).copied().unwrap_or_default()
    }

    pub fn is_zero(&self) -> bool {
        self.treasury == 0
            && self.science == 0
            && self.culture == 0
            && self.food == 0
            && self.work == 0
            && self.resources.values().all(|amount| *amount == 0)
    }
}

/// Persistent balances at a turn boundary.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct EconomyBalances {
    pub treasury: u64,
    pub science: u64,
    pub culture: u64,
    pub food: u64,
    /// Turn-scoped production budget. It is reset after expenses are paid.
    pub work: u64,
    #[serde(default)]
    pub resources: ResourceStock,
}

impl EconomyBalances {
    pub const fn zero() -> Self {
        Self {
            treasury: 0,
            science: 0,
            culture: 0,
            food: 0,
            work: 0,
            resources: BTreeMap::new(),
        }
    }

    pub fn resource(&self, resource: &str) -> u64 {
        self.resources.get(resource).copied().unwrap_or_default()
    }

    fn credit(&mut self, income: &EconomyFlow) {
        self.treasury = self.treasury.saturating_add(income.treasury);
        self.science = self.science.saturating_add(income.science);
        self.culture = self.culture.saturating_add(income.culture);
        self.food = self.food.saturating_add(income.food);
        self.work = self.work.saturating_add(income.work);
        for (resource, amount) in &income.resources {
            let entry = self.resources.entry(resource.clone()).or_default();
            *entry = entry.saturating_add(*amount);
        }
    }

    fn reset_turn_pools(&mut self) {
        self.work = 0;
    }
}

/// Amounts actually paid during a settlement.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct PaidFlow {
    pub treasury: u64,
    pub science: u64,
    pub culture: u64,
    pub food: u64,
    pub work: u64,
    #[serde(default)]
    pub resources: ResourceStock,
}

/// Amounts that could not be paid because the corresponding balance was too
/// small. A deficit is reported, not carried into the next turn.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct UnpaidFlow {
    pub treasury: u64,
    pub science: u64,
    pub culture: u64,
    pub food: u64,
    pub work: u64,
    #[serde(default)]
    pub resources: ResourceStock,
}

impl UnpaidFlow {
    pub fn has_deficit(&self) -> bool {
        !self.is_zero()
    }

    pub fn is_zero(&self) -> bool {
        self.treasury == 0
            && self.science == 0
            && self.culture == 0
            && self.food == 0
            && self.work == 0
            && self.resources.values().all(|amount| *amount == 0)
    }
}

/// Audit record for a completed settlement.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TurnSettlement {
    /// The one-based turn whose economy was processed.
    pub turn: u32,
    /// The turn number available after reset and advancement.
    pub next_turn: u32,
    pub before: EconomyBalances,
    pub income: EconomyFlow,
    pub paid: PaidFlow,
    pub unpaid: UnpaidFlow,
    pub after: EconomyBalances,
    /// Work remaining immediately before the required reset. This is useful
    /// for an audit because `after.work` is always zero.
    pub work_reset: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TurnEconomyError {
    InvalidTurn(u32),
    TurnOverflow,
}

impl fmt::Display for TurnEconomyError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidTurn(turn) => {
                write!(formatter, "turn number must be at least 1, got {turn}")
            }
            Self::TurnOverflow => formatter.write_str("turn number overflowed"),
        }
    }
}

impl Error for TurnEconomyError {}

/// Mutable economy ledger. A new game starts on turn one with empty balances.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TurnEconomy {
    #[serde(deserialize_with = "deserialize_turn")]
    turn: u32,
    balances: EconomyBalances,
}

fn deserialize_turn<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    let turn = u32::deserialize(deserializer)?;
    if turn == 0 {
        return Err(de::Error::custom(TurnEconomyError::InvalidTurn(turn)));
    }
    Ok(turn)
}

impl TurnEconomy {
    pub fn new() -> Self {
        Self {
            turn: 1,
            balances: EconomyBalances::zero(),
        }
    }

    pub fn from_parts(turn: u32, balances: EconomyBalances) -> Result<Self, TurnEconomyError> {
        if turn == 0 {
            return Err(TurnEconomyError::InvalidTurn(turn));
        }
        Ok(Self { turn, balances })
    }

    pub const fn turn(&self) -> u32 {
        self.turn
    }

    pub const fn balances(&self) -> &EconomyBalances {
        &self.balances
    }

    pub fn balances_mut(&mut self) -> &mut EconomyBalances {
        &mut self.balances
    }

    /// Resolve one turn in the canonical income -> spending -> reset order.
    ///
    /// Income is credited before any expense is checked, so production from
    /// this turn can pay this turn's costs. Every channel is settled
    /// independently; a shortfall is clamped to zero and recorded in
    /// `unpaid`, while unrelated channels still settle normally.
    pub fn settle_turn(
        &mut self,
        income: EconomyFlow,
        expenses: &EconomyFlow,
    ) -> Result<TurnSettlement, TurnEconomyError> {
        // Validate the boundary before mutating any balance. A failed final
        // turn must be a no-op, just like a failed spend transaction.
        if self.turn == u32::MAX {
            return Err(TurnEconomyError::TurnOverflow);
        }
        let before = self.balances.clone();
        self.balances.credit(&income);
        let (paid, unpaid) = spend_flow(&mut self.balances, expenses);

        let work_reset = self.balances.work;
        self.balances.reset_turn_pools();

        let turn = self.turn;
        self.turn += 1;

        Ok(TurnSettlement {
            turn,
            next_turn: self.turn,
            before,
            income,
            paid,
            unpaid,
            after: self.balances.clone(),
            work_reset,
        })
    }

    /// Reset only the per-turn Work pool without advancing the turn.
    ///
    /// This is intentionally separate from `settle_turn` for callers that
    /// abort a turn before its economy has been resolved.
    pub fn reset_turn_pools(&mut self) {
        self.balances.reset_turn_pools();
    }
}

impl Default for TurnEconomy {
    fn default() -> Self {
        Self::new()
    }
}

/// Pure counterpart of [`TurnEconomy::settle_turn`]. It is useful for previews
/// and deterministic tests; the supplied balances are not mutated.
pub fn resolve_turn(
    turn: u32,
    balances: &EconomyBalances,
    income: EconomyFlow,
    expenses: &EconomyFlow,
) -> Result<TurnSettlement, TurnEconomyError> {
    let mut ledger = TurnEconomy::from_parts(turn, balances.clone())?;
    ledger.settle_turn(income, expenses)
}

/// Compatibility name for callers that describe settlement as an economy tick.
pub fn settle_turn(
    turn: u32,
    balances: &EconomyBalances,
    income: EconomyFlow,
    expenses: &EconomyFlow,
) -> Result<TurnSettlement, TurnEconomyError> {
    resolve_turn(turn, balances, income, expenses)
}

fn spend_flow(balances: &mut EconomyBalances, expenses: &EconomyFlow) -> (PaidFlow, UnpaidFlow) {
    let mut paid = PaidFlow::default();
    let mut unpaid = UnpaidFlow::default();

    debit(
        balances.treasury,
        expenses.treasury,
        &mut paid.treasury,
        &mut unpaid.treasury,
    );
    balances.treasury -= paid.treasury;
    debit(
        balances.science,
        expenses.science,
        &mut paid.science,
        &mut unpaid.science,
    );
    balances.science -= paid.science;
    debit(
        balances.culture,
        expenses.culture,
        &mut paid.culture,
        &mut unpaid.culture,
    );
    balances.culture -= paid.culture;
    debit(
        balances.food,
        expenses.food,
        &mut paid.food,
        &mut unpaid.food,
    );
    balances.food -= paid.food;
    debit(
        balances.work,
        expenses.work,
        &mut paid.work,
        &mut unpaid.work,
    );
    balances.work -= paid.work;

    let keys = expenses.resources.keys();
    for resource in keys {
        let available = balances.resource(resource);
        let required = expenses.resource(resource);
        let paid_amount = available.min(required);
        let unpaid_amount = required - paid_amount;
        if paid_amount > 0 {
            balances
                .resources
                .insert(resource.clone(), available - paid_amount);
            paid.resources.insert(resource.clone(), paid_amount);
        }
        if unpaid_amount > 0 {
            unpaid.resources.insert(resource.clone(), unpaid_amount);
        }
    }

    (paid, unpaid)
}

fn debit(available: u64, required: u64, paid: &mut u64, unpaid: &mut u64) {
    *paid = available.min(required);
    *unpaid = required - *paid;
}
