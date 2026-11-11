//! R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1: budowa machin oblezniczych (czysty modul, bez wiazania z tura).
//!
//! Port `gra/src/game/siege-engine-build.ts` (web `origin/main` 6218f2ab1, SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE):
//! * [`SIEGE_ENGINE_UNITS_PER_MACHINE`] = `unitsPerSiegeEngine` z `siege-engine-params.json` (= 10).
//! * [`is_siege_engine_def`] = `isSiegeEngineDef` (`Typ` po trim == `Siege`).
//! * [`qualifying_siege_army_count`] = `qualifyingSiegeArmyCount` (jednostki kategorii innej niz `obleznicza`).
//! * [`siege_engine_quota`] = `siegeEngineQuota` (`floor(count / 10)`).
//! * [`siege_engine_build_option`] = `siegeEngineBuildOption`: kolejnosc bramek jak w web (pierwsza blokada wygrywa).
//!   Uwaga zachowania web: niebedaca machina zwraca powod `technology_locked` (nie `not_siege`) - przeniesione 1:1.
//!
//! ZALOZENIA (brak w dispatchu lub w kodzie Rust):
//! * Z-SEM-1 Wejscie armii: [`ArmyUnit`] niesie tylko `owner_id` i flage `obleznicza` (web `category === 'obleznicza'`).
//!   Pelny `RuntimeUnit` nie jest potrzebny do tych regul.
//! * Z-SEM-2 Koszt pieniezny ([`SiegeEngineBuildContext`] nie liczy go) przekazuje wolajacy, jak w web (`costMoney`).
//!   Koszt zasobowy liczy istniejace [`unit_stock_cost`] (`building_costs::p6_7b`) z [`UnitStockCostSource`].
//! * Z-SEM-3 Powod `not_besieger` istnieje w typie web, ale web nigdy go nie zwraca - tu tez nie jest zwracany.
//! * Z-SEM-4 Stan tury (`turnState`) przenoszony jako [`TurnState`]; `count` jest `f64` (web `Math.floor` na liczbie).
//! * Z-SEM-5 Parametr `unitsPerSiegeEngine` nie trafia do `rust-port/engine/data/` (sprzecznie z inwariantem 1:1
//!   z `gra/data`, pinowanym w `tests/data_loader.rs` i `tests/data_compliance.rs` poza allowlista). Wartosc jest stala
//!   Rust, a `tests/p6_repin_oblezenie_maszyny_web_parity.rs` pilnuje jej zgodnosci z wektorami z weba.
//!
//! Kolejka machin (`siegeMachines.ts`: queue/ensure/cancel) NIE jest portowana w tej rundzie (poza zakresem dispatchu
//! "czyste funkcje"; NIE_ZMIERZONO wplywu na ture).

use std::collections::BTreeSet;

use crate::domain::building_costs::p6_7b::{unit_stock_cost, StockRecord, UnitStockCostSource};

/// Web `SIEGE_ENGINE_UNITS_PER_MACHINE` = `params.unitsPerSiegeEngine` (`siege-engine-params.json`).
pub const SIEGE_ENGINE_UNITS_PER_MACHINE: u64 = 10;

/// Powod blokady budowy (web `SiegeEngineBuildBlock`). Klucze tekstowe: [`SiegeEngineBuildBlock::web_key`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SiegeEngineBuildBlock {
    NotSiege,
    NotAtWar,
    /// Istnieje w typie web, nigdy nie zwracany (Z-SEM-3).
    NotBesieger,
    NoQualifyingArmy,
    TooFewUnits,
    TurnLimitReached,
    TechnologyLocked,
    InsufficientMoney,
    InsufficientResources,
}

impl SiegeEngineBuildBlock {
    /// Klucz powodu zgodny z web (`'not_siege'`, `'turn_limit_reached'`, ...).
    pub fn web_key(self) -> &'static str {
        match self {
            Self::NotSiege => "not_siege",
            Self::NotAtWar => "not_at_war",
            Self::NotBesieger => "not_besieger",
            Self::NoQualifyingArmy => "no_qualifying_army",
            Self::TooFewUnits => "too_few_units",
            Self::TurnLimitReached => "turn_limit_reached",
            Self::TechnologyLocked => "technology_locked",
            Self::InsufficientMoney => "insufficient_money",
            Self::InsufficientResources => "insufficient_resources",
        }
    }
}

/// Jednostka armii w zakresie potrzebnym do regul machin (Z-SEM-1).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ArmyUnit {
    pub owner_id: i64,
    /// Web `category === 'obleznicza'` (sama machina / jednostka oblezniczna nie liczy sie do kwoty).
    pub obleznicza: bool,
}

/// Web `SiegeEngineTurnState`: ile machin wybudowano w danej turze.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TurnState {
    pub turn: i64,
    pub count: f64,
}

/// Definicja jednostki potrzebna do budowy (web `UnitDef`, tylko pola uzywane przez modul).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeEngineUnitDef {
    /// Web `Typ` (moze brakowac).
    pub typ: Option<String>,
    /// Web `Tech` (moze brakowac; `-` i `—` oznaczaja brak wymogu).
    pub tech: Option<String>,
    /// Wejscie kosztu surowcowego (web `unitStockCost(unit)`).
    pub stock_source: UnitStockCostSource,
}

/// Web `SiegeEngineBuildContext` (bez kosztu pienieznego, ktory podaje wolajacy: Z-SEM-2).
#[derive(Debug, Clone, Copy)]
pub struct SiegeEngineBuildContext<'a> {
    pub active_siege: bool,
    pub at_war: bool,
    pub owner_id: i64,
    pub turn: i64,
    pub army: &'a [ArmyUnit],
    pub turn_state: Option<TurnState>,
    pub unlocked_techs: &'a BTreeSet<String>,
    pub treasury: f64,
    pub stock: &'a StockRecord,
}

/// Web `SiegeEngineBuildOption`.
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeEngineBuildOption {
    pub cost_money: f64,
    pub cost_stock: StockRecord,
    pub allowed: bool,
    pub reason: Option<SiegeEngineBuildBlock>,
    pub quota: u64,
    pub built_this_turn: f64,
    pub qualifying_army_count: u64,
}

/// Web `isSiegeEngineDef`: `unit?.Typ?.trim() === 'Siege'`.
pub fn is_siege_engine_def(typ: Option<&str>) -> bool {
    typ.map(str::trim) == Some("Siege")
}

/// Web `qualifyingSiegeArmyCount`: jednostki, ktore nie sa `obleznicza`.
pub fn qualifying_siege_army_count(army: &[ArmyUnit]) -> u64 {
    army.iter().filter(|u| !u.obleznicza).count() as u64
}

/// Web `siegeEngineQuota`: `floor(count / 10)`.
pub fn siege_engine_quota(army: &[ArmyUnit]) -> u64 {
    qualifying_siege_army_count(army) / SIEGE_ENGINE_UNITS_PER_MACHINE
}

/// Web `siegeEngineBuildOption`. Kolejnosc bramek identyczna z web; pierwsza zgodna blokada wygrywa.
pub fn siege_engine_build_option(
    unit: &SiegeEngineUnitDef,
    ctx: &SiegeEngineBuildContext<'_>,
    cost_money: f64,
) -> SiegeEngineBuildOption {
    let count = qualifying_siege_army_count(ctx.army);
    let quota = count / SIEGE_ENGINE_UNITS_PER_MACHINE;
    let built_this_turn = match ctx.turn_state {
        Some(ts) if ts.turn == ctx.turn => ts.count.floor().max(0.0),
        _ => 0.0,
    };
    let cost_stock = unit_stock_cost(Some(&unit.stock_source));
    let tech_required = unit
        .tech
        .as_deref()
        .map(str::trim)
        .filter(|t| !t.is_empty() && *t != "-" && *t != "—");

    let reason = if !is_siege_engine_def(unit.typ.as_deref()) {
        Some(SiegeEngineBuildBlock::TechnologyLocked)
    } else if !ctx.active_siege {
        Some(SiegeEngineBuildBlock::NotSiege)
    } else if !ctx.at_war {
        Some(SiegeEngineBuildBlock::NotAtWar)
    } else if count == 0 || !ctx.army.iter().any(|u| u.owner_id == ctx.owner_id) {
        Some(SiegeEngineBuildBlock::NoQualifyingArmy)
    } else if count < SIEGE_ENGINE_UNITS_PER_MACHINE {
        Some(SiegeEngineBuildBlock::TooFewUnits)
    } else if built_this_turn >= quota as f64 {
        Some(SiegeEngineBuildBlock::TurnLimitReached)
    } else if tech_required.is_some_and(|t| !ctx.unlocked_techs.contains(t)) {
        Some(SiegeEngineBuildBlock::TechnologyLocked)
    } else if ctx.treasury < cost_money {
        Some(SiegeEngineBuildBlock::InsufficientMoney)
    } else if cost_stock
        .iter()
        .any(|(key, amount)| ctx.stock.get(key).copied().unwrap_or(0.0) < *amount)
    {
        Some(SiegeEngineBuildBlock::InsufficientResources)
    } else {
        None
    };

    SiegeEngineBuildOption {
        cost_money,
        cost_stock,
        allowed: reason.is_none(),
        reason,
        quota,
        built_this_turn,
        qualifying_army_count: count,
    }
}
