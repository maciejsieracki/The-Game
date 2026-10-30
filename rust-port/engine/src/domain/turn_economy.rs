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

/// Web `Math.max(a, b)`: NaN propaguje; `Math.max(-0, 0)` = `0`.
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else if b > a {
        b
    } else if a.is_sign_positive() {
        a
    } else {
        b
    }
}

/// Web `Math.min(a, b)`: NaN propaguje; `Math.min(0, -0)` = `-0`.
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else if b < a {
        b
    } else if a.is_sign_negative() {
        a
    } else {
        b
    }
}

/// P6.8D-P1 - `gold-deficit.ts` (web pin 91dc998a): kara za deficyt Zlota.
///
/// Globalny `_lastTicks` z webu jest tu jawnym polem [`gold_deficit::GoldDeficitRuntime`]
/// (wlasciciel wola `advance`, akcesory czytaja ten sam stan). `isCivilianUnit` (web)
/// liczy wolajacy i przekazuje jako `civilian`.
pub mod gold_deficit {
    use std::collections::BTreeMap;

    use super::{js_max, js_min};

    /// Web `GoldDeficitState`: liczba kolejnych tur Z RZEDU ze Skarbcem < 0.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
    pub struct GoldDeficitState {
        pub tury_deficytu_zlota: u64,
    }

    /// Web `freshGoldDeficitState`.
    pub fn fresh_gold_deficit_state() -> GoldDeficitState {
        GoldDeficitState::default()
    }

    /// Web `GoldDeficitParams`.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct GoldDeficitParams {
        pub zloto_deficyt_stat_mult: f64,
        pub zloto_deficyt_karencja_tur: f64,
        pub zloto_deficyt_hp_frac: f64,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum Difficulty {
        Easy,
        Normal,
        Hard,
    }

    /// Wiersz parametru z econ-params.json; `None` = brak klucza lub wartosc nie-liczbowa
    /// (web: `Number.isFinite` false => fallback).
    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct RawParamRow {
        pub easy: Option<f64>,
        pub normal: Option<f64>,
        pub hard: Option<f64>,
    }

    /// Kontener parametrow deficytu (klucze `zloto_deficyt_*`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct RawGoldDeficitRows {
        pub zloto_deficyt_stat_mult: Option<RawParamRow>,
        pub zloto_deficyt_karencja_tur: Option<RawParamRow>,
        pub zloto_deficyt_hp_frac: Option<RawParamRow>,
    }

    /// Web `raw`: `raw.ekonomia_miasta ?? raw` - gdy `ekonomia_miasta` obecne, czytane z niego,
    /// inaczej z korzenia (`top`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct RawGoldDeficitInput {
        pub ekonomia_miasta: Option<RawGoldDeficitRows>,
        pub top: RawGoldDeficitRows,
    }

    fn pick(row: Option<&RawParamRow>, d: Difficulty, fallback: f64) -> f64 {
        let Some(row) = row else { return fallback };
        let v = match d {
            Difficulty::Easy => row.easy,
            Difficulty::Normal => row.normal,
            Difficulty::Hard => row.hard,
        };
        match v {
            Some(x) if x.is_finite() => x,
            _ => fallback,
        }
    }

    /// Web `buildGoldDeficitParams` (fallbacki 0.75 / 3 / 0.08).
    pub fn build_gold_deficit_params(
        raw: &RawGoldDeficitInput,
        difficulty: Difficulty,
    ) -> GoldDeficitParams {
        let em = raw.ekonomia_miasta.as_ref().unwrap_or(&raw.top);
        GoldDeficitParams {
            zloto_deficyt_stat_mult: pick(em.zloto_deficyt_stat_mult.as_ref(), difficulty, 0.75),
            zloto_deficyt_karencja_tur: pick(
                em.zloto_deficyt_karencja_tur.as_ref(),
                difficulty,
                3.0,
            ),
            zloto_deficyt_hp_frac: pick(em.zloto_deficyt_hp_frac.as_ref(), difficulty, 0.08),
        }
    }

    /// Web `GoldDeficitTick`.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct GoldDeficitTick {
        pub owner_id: i64,
        /// Skarbiec wlasciciela PO zbankowaniu (moze byc NaN / +-Infinity - jak w webie).
        pub skarbiec: f64,
        pub deficyt_zlota: bool,
        pub tury_deficytu_zlota_po: u64,
        pub zloto_deficyt_atrycja_aktywna: bool,
    }

    /// Web `GoldDeficitTickResult`: `per_owner` w kolejnosci wejscia (duplikaty zachowane),
    /// `by_owner` - ostatni wpis dla danego wlasciciela (jak `Map.set`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct GoldDeficitTickResult {
        pub per_owner: Vec<GoldDeficitTick>,
        pub by_owner: BTreeMap<i64, GoldDeficitTick>,
    }

    /// Jawny odpowiednik globalnego `_lastTicks` z webu.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct GoldDeficitRuntime {
        last: BTreeMap<i64, GoldDeficitTick>,
    }

    impl GoldDeficitRuntime {
        pub fn new() -> Self {
            Self::default()
        }

        /// Web `clearLastGoldDeficitTicks`.
        pub fn clear(&mut self) {
            self.last.clear();
        }

        /// Web `advanceGoldDeficit`: liczy ticki i ustawia `_lastTicks` (= `by_owner`).
        /// `get_owner_treasury` musi zwracac saldo PO zbankowaniu tury.
        pub fn advance<F: Fn(i64) -> f64>(
            &mut self,
            owner_ids: &[i64],
            states: &mut BTreeMap<i64, GoldDeficitState>,
            get_owner_treasury: F,
            params: &GoldDeficitParams,
        ) -> GoldDeficitTickResult {
            let mut result = GoldDeficitTickResult::default();
            for &owner_id in owner_ids {
                let st = states
                    .entry(owner_id)
                    .or_insert_with(fresh_gold_deficit_state);
                let skarbiec = get_owner_treasury(owner_id);
                // JS `skarbiec < 0`: NaN => false.
                let deficyt_zlota = skarbiec < 0.0;
                let tury_przed = st.tury_deficytu_zlota;
                let tury_po = if deficyt_zlota { tury_przed + 1 } else { 0 };
                st.tury_deficytu_zlota = tury_po;
                let tick = GoldDeficitTick {
                    owner_id,
                    skarbiec,
                    deficyt_zlota,
                    tury_deficytu_zlota_po: tury_po,
                    // JS `turyPo >= karencja`: NaN => false.
                    zloto_deficyt_atrycja_aktywna: (tury_po as f64)
                        >= params.zloto_deficyt_karencja_tur,
                };
                result.per_owner.push(tick);
                result.by_owner.insert(owner_id, tick);
            }
            self.last = result.by_owner.clone();
            result
        }

        /// Web `isGoldDeficit`.
        pub fn is_gold_deficit(&self, owner_id: i64) -> bool {
            self.last.get(&owner_id).is_some_and(|t| t.deficyt_zlota)
        }

        /// Web `isGoldDeficitStarving`.
        pub fn is_gold_deficit_starving(&self, owner_id: i64) -> bool {
            self.last
                .get(&owner_id)
                .is_some_and(|t| t.zloto_deficyt_atrycja_aktywna)
        }

        /// Web `getGoldDeficitCountdown`: `None` = JS `null`. `Math.max(1, karencja - po)` z NaN.
        pub fn gold_deficit_countdown(&self, owner_id: i64, karencja_tur: f64) -> Option<f64> {
            let t = self.last.get(&owner_id)?;
            if !t.deficyt_zlota || t.zloto_deficyt_atrycja_aktywna {
                return None;
            }
            Some(js_max(1.0, karencja_tur - t.tury_deficytu_zlota_po as f64))
        }

        /// Web `getLastGoldDeficitTick`.
        pub fn last_gold_deficit_tick(&self, owner_id: i64) -> Option<&GoldDeficitTick> {
            self.last.get(&owner_id)
        }
    }

    /// Web `Math.round` (polowki w strone +Infinity, `-0` dla malych ujemnych).
    fn js_round(x: f64) -> f64 {
        if !x.is_finite() || x.fract() == 0.0 {
            return x;
        }
        let floor = x.floor();
        let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };
        if rounded == 0.0 && x < 0.0 {
            -0.0
        } else {
            rounded
        }
    }

    /// Web `round4` = `Math.round(x * 10000) / 10000`.
    fn round4(x: f64) -> f64 {
        js_round(x * 10000.0) / 10000.0
    }

    /// Statystyki bojowe jednostki uzywane przez `applyGoldDeficitStatMultToCombatUnit`.
    /// `prog_dezercji`: `None` = web `null` lub `undefined` (oba zwracane bez zmian).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct GoldDeficitCombatStats {
        pub melee_attack: f64,
        pub melee_defence: f64,
        pub weapon_damage: f64,
        pub piercing: f64,
        pub charge_bonus: f64,
        pub health: f64,
        pub missile_attack: f64,
        pub prog_dezercji: Option<f64>,
    }

    /// Web `applyGoldDeficitStatMultToCombatUnit`: `mult` poza (0,1) => bez zmian.
    pub fn apply_gold_deficit_stat_mult_to_combat_unit(
        cu: &GoldDeficitCombatStats,
        mult: f64,
    ) -> GoldDeficitCombatStats {
        if mult >= 1.0 || mult <= 0.0 {
            return *cu;
        }
        GoldDeficitCombatStats {
            melee_attack: cu.melee_attack * mult,
            melee_defence: cu.melee_defence * mult,
            weapon_damage: cu.weapon_damage * mult,
            piercing: cu.piercing * mult,
            charge_bonus: cu.charge_bonus * mult,
            health: cu.health * mult,
            missile_attack: cu.missile_attack * mult,
            prog_dezercji: cu.prog_dezercji.map(|p| round4(p * (2.0 - mult))),
        }
    }

    /// Jednostka dla atrycji HP. `civilian` = web `isCivilianUnit(u)`. `hp`/`hp_max` = `None`
    /// dla web `null`/`undefined`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct GoldDeficitUnit {
        pub id: String,
        pub owner_id: i64,
        pub type_id: String,
        pub civilian: bool,
        pub hp: Option<f64>,
        pub hp_max: Option<f64>,
    }

    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct GoldDeficitStarvationResult {
        pub destroyed_ids: Vec<String>,
        pub damaged_count: usize,
    }

    /// Web `applyGoldDeficitHpLoss` (8D-P2): `loss = max(1, floor(maxHp * frac))`,
    /// `frac = clamp(hpFrac, 0, 1)`; `hp <= 0` => id na liscie zniszczonych.
    pub fn apply_gold_deficit_hp_loss<G: Fn(&str) -> f64>(
        units: &mut [GoldDeficitUnit],
        owner_id: i64,
        hp_frac: f64,
        get_max_hp: G,
    ) -> GoldDeficitStarvationResult {
        let frac = js_max(0.0, js_min(1.0, hp_frac));
        let mut result = GoldDeficitStarvationResult::default();
        if frac <= 0.0 {
            return result;
        }
        for u in units.iter_mut() {
            if u.owner_id != owner_id || u.civilian {
                continue;
            }
            let max_hp = u.hp_max.unwrap_or_else(|| get_max_hp(&u.type_id));
            if max_hp <= 0.0 {
                continue;
            }
            if u.hp_max.is_none() {
                u.hp_max = Some(max_hp);
            }
            if u.hp.is_none() {
                u.hp = Some(max_hp);
            }
            let loss = js_max(1.0, (max_hp * frac).floor());
            let new_hp = js_max(0.0, u.hp.unwrap_or(f64::NAN) - loss);
            u.hp = Some(new_hp);
            result.damaged_count += 1;
            if new_hp <= 0.0 {
                result.destroyed_ids.push(u.id.clone());
            }
        }
        result
    }
}

/// P6.8D-P2 - `wealth.ts` (web pin 91dc998a): poziom Wealth per miasto.
///
/// `wealthParamsWithCapModifier` / `wealthParamsWithMultiplierModifier` NIE sa tu powielone:
/// sa w `city_growth` (B3, `WealthModParams`, wektory `p6_repin_b3_wealth`).
pub mod wealth {
    use std::collections::BTreeMap;

    use super::gold_deficit::Difficulty;
    use super::{js_max, js_min};

    /// Web `WealthParams` (wszystkie 9 pol).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct WealthParams {
        pub cap_na_epoke: f64,
        pub prog_na_poziom: f64,
        pub mnoznik_na_poziom: f64,
        pub utrzymanie_baza: f64,
        pub utrzymanie_przy_cap: f64,
        pub zachowanie_po_awansie: f64,
        pub zadowolenie_max: f64,
        pub kara_zero: f64,
        pub immunitet_tur: f64,
    }

    /// Web `FALLBACK_WEALTH_PARAMS`.
    pub const FALLBACK_WEALTH_PARAMS: WealthParams = WealthParams {
        cap_na_epoke: 10.0,
        prog_na_poziom: 4.5,
        mnoznik_na_poziom: 0.15,
        utrzymanie_baza: 0.20,
        utrzymanie_przy_cap: 0.40,
        zachowanie_po_awansie: 0.5,
        zadowolenie_max: 10.0,
        kara_zero: 0.0,
        immunitet_tur: 5.0,
    };

    /// Wiersz `wealth` z econ-params.json; `None` = brak / wartosc nie-liczbowa.
    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct RawWealthRow {
        pub easy: Option<f64>,
        pub normal: Option<f64>,
        pub hard: Option<f64>,
    }

    /// Web `RawWealthParamsJson` (`wealth ?? {}`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct RawWealthParamsJson {
        pub wealth: BTreeMap<String, RawWealthRow>,
    }

    impl RawWealthRow {
        fn for_difficulty(&self, d: Difficulty) -> Option<f64> {
            match d {
                Difficulty::Easy => self.easy,
                Difficulty::Normal => self.normal,
                Difficulty::Hard => self.hard,
            }
        }
    }

    /// Web `loadWealthParams`: brak / niefinite => fallback z `FALLBACK_WEALTH_PARAMS`.
    pub fn load_wealth_params(raw: &RawWealthParamsJson, difficulty: Difficulty) -> WealthParams {
        let read = |key: &str, fallback: f64| -> f64 {
            raw.wealth
                .get(key)
                .and_then(|row| row.for_difficulty(difficulty))
                .filter(|v| v.is_finite())
                .unwrap_or(fallback)
        };
        let f = FALLBACK_WEALTH_PARAMS;
        WealthParams {
            cap_na_epoke: read("wealth_cap_na_epoke", f.cap_na_epoke),
            prog_na_poziom: read("wealth_prog_na_poziom", f.prog_na_poziom),
            mnoznik_na_poziom: read("wealth_mnoznik_na_poziom", f.mnoznik_na_poziom),
            utrzymanie_baza: read("wealth_utrzymanie_baza", f.utrzymanie_baza),
            utrzymanie_przy_cap: read("wealth_utrzymanie_przy_cap", f.utrzymanie_przy_cap),
            zachowanie_po_awansie: read("wealth_zachowanie_po_awansie", f.zachowanie_po_awansie),
            zadowolenie_max: read("wealth_zadowolenie_max", f.zadowolenie_max),
            kara_zero: read("wealth_kara_zero", f.kara_zero),
            immunitet_tur: read("wealth_immunitet_tur", f.immunitet_tur),
        }
    }

    /// Web `wealthCap`: `max(0, floor(epoka)) * capNaEpoke`.
    pub fn wealth_cap(epoka: f64, p: WealthParams) -> f64 {
        js_max(0.0, epoka.floor()) * p.cap_na_epoke
    }

    /// Web `wealthMnoznik`: `max(1, 1 + (W-1) * k)`.
    pub fn wealth_mnoznik(poziom: f64, p: WealthParams) -> f64 {
        js_max(1.0, 1.0 + (poziom - 1.0) * p.mnoznik_na_poziom)
    }

    /// Web `wealthZadowolenie` (G6): `floor(poziom * zadowolenieMax / cap)`, poziom przycinany do capu.
    pub fn wealth_zadowolenie(poziom: f64, p: WealthParams, epoka: f64) -> f64 {
        if poziom <= 0.0 {
            return p.kara_zero;
        }
        let cap = wealth_cap(epoka, p);
        if !cap.is_finite() || cap <= 0.0 {
            return 0.0;
        }
        let poz = js_min(poziom, cap);
        (poz * p.zadowolenie_max / cap).floor()
    }

    /// Web `wealthRownowaga`: `baza + frac * (przyCap - baza)`, `frac = clamp(W/cap, 0, 1)`.
    pub fn wealth_rownowaga(poziom: f64, epoka: f64, p: WealthParams) -> f64 {
        let cap = wealth_cap(epoka, p);
        if cap <= 0.0 {
            return p.utrzymanie_przy_cap;
        }
        let frac = js_min(1.0, js_max(0.0, poziom / cap));
        p.utrzymanie_baza + frac * (p.utrzymanie_przy_cap - p.utrzymanie_baza)
    }

    /// Web `wealthProg`: `progNaPoziom * (L+1) * max(1, floor(epoka))`.
    pub fn wealth_prog(poziom: f64, epoka: f64, p: WealthParams) -> f64 {
        p.prog_na_poziom * (poziom + 1.0) * js_max(1.0, epoka.floor())
    }

    /// Web `WealthState`.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct WealthState {
        pub poziom: f64,
        pub pula: f64,
    }

    /// Web `WealthTickResult`.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct WealthTickResult {
        pub poziom: f64,
        pub pula: f64,
        pub mnoznik: f64,
        pub zadowolenie: f64,
        pub awans: u64,
        pub spadek: u64,
    }

    /// Web `freshWealthState`: poziom 1 (mnoznik x1), pusta pula.
    pub fn fresh_wealth_state() -> WealthState {
        WealthState {
            poziom: 1.0,
            pula: 0.0,
        }
    }

    /// Web `advanceWealth`. `min_poziom` = `opts?.minPoziom` (`None` = undefined/null => 0).
    pub fn advance_wealth(
        state: WealthState,
        spol_money: f64,
        miasto_money: f64,
        epoka: f64,
        p: WealthParams,
        min_poziom: Option<f64>,
    ) -> WealthTickResult {
        let cap = wealth_cap(epoka, p);
        let mut poziom = js_min(cap, js_max(0.0, state.poziom.floor()));
        let mut pula = js_max(
            0.0,
            if state.pula.is_finite() {
                state.pula
            } else {
                0.0
            },
        );
        let min_poz = js_max(0.0, min_poziom.unwrap_or(0.0).floor());

        let spol = if spol_money.is_finite() {
            js_max(0.0, spol_money)
        } else {
            0.0
        };
        let miasto = if miasto_money.is_finite() {
            js_max(0.0, miasto_money)
        } else {
            0.0
        };

        // utrzymanie / decay
        let decay = wealth_rownowaga(poziom, epoka, p) * miasto;
        pula += spol - decay;

        let mut spadek = 0;
        if pula < 0.0 {
            pula = 0.0;
            if poziom > min_poz {
                poziom -= 1.0;
                spadek = 1;
            }
        }

        // awanse
        let mut awans = 0;
        while poziom < cap {
            let prog = wealth_prog(poziom, epoka, p);
            if pula >= prog {
                pula -= prog;
                poziom += 1.0;
                pula = (pula * p.zachowanie_po_awansie).floor();
                awans += 1;
            } else {
                break;
            }
        }

        WealthTickResult {
            poziom,
            pula,
            mnoznik: wealth_mnoznik(poziom, p),
            zadowolenie: wealth_zadowolenie(poziom, p, epoka),
            awans,
            spadek,
        }
    }
}

/// P6.8D-P2 - `mennica-zloto-grace.ts` (web pin 91dc998a): 1 tura laski Mennicy po utracie
/// dostepu do zlota. Mapy web (`Map`) => `BTreeMap` (kolejnosc wstawiania nie jest semantyczna).
pub mod mennica_zloto_grace {
    use std::collections::BTreeMap;

    /// Web `MENNICA_ZLOTO_GRACE_TURNS` (PYTANIE-77-DOP=B).
    pub const MENNICA_ZLOTO_GRACE_TURNS: u32 = 1;

    #[derive(Debug, Clone, PartialEq, Eq, Default)]
    pub struct MennicaZlotoGraceState {
        /// Pozostale tury laski per owner (0 = brak; klucz moze istniec z wartoscia 0).
        pub grace_turns_left: BTreeMap<i64, u32>,
        /// Migawka dostepu z konca poprzedniej tury.
        pub had_access_last_turn: BTreeMap<i64, bool>,
    }

    #[derive(Debug, Clone, PartialEq, Eq, Default)]
    pub struct MennicaZlotoGraceSave {
        pub grace_turns_left: Vec<(i64, u32)>,
        pub had_access_last_turn: Vec<(i64, bool)>,
    }

    impl MennicaZlotoGraceState {
        pub fn new() -> Self {
            Self::default()
        }

        /// Web `clearMennicaZlotoGraceState`.
        pub fn clear(&mut self) {
            self.grace_turns_left.clear();
            self.had_access_last_turn.clear();
        }

        /// Web `serializeMennicaZlotoGrace` (posortowane wg klucza).
        pub fn serialize(&self) -> MennicaZlotoGraceSave {
            MennicaZlotoGraceSave {
                grace_turns_left: self
                    .grace_turns_left
                    .iter()
                    .map(|(k, v)| (*k, *v))
                    .collect(),
                had_access_last_turn: self
                    .had_access_last_turn
                    .iter()
                    .map(|(k, v)| (*k, *v))
                    .collect(),
            }
        }

        /// Web `restoreMennicaZlotoGrace`: czysci, potem wczytuje (`None` = web `null`/`undefined`).
        pub fn restore(&mut self, saved: Option<&MennicaZlotoGraceSave>) {
            self.clear();
            let Some(saved) = saved else { return };
            for (oid, v) in &saved.grace_turns_left {
                self.grace_turns_left.insert(*oid, *v);
            }
            for (oid, v) in &saved.had_access_last_turn {
                self.had_access_last_turn.insert(*oid, *v);
            }
        }
    }

    /// Web `ownerZlotoAccessForMennica`: natywny dostep LUB pozostala laska.
    pub fn owner_zloto_access_for_mennica<F: Fn(i64) -> bool>(
        owner_id: i64,
        state: &MennicaZlotoGraceState,
        has_zloto_access_now: F,
    ) -> bool {
        if has_zloto_access_now(owner_id) {
            return true;
        }
        state.grace_turns_left.get(&owner_id).copied().unwrap_or(0) > 0
    }

    /// Web `prepareMennicaZlotoGraceForTick`. Web zwraca resolver; tu wolajacy uzywa
    /// [`owner_zloto_access_for_mennica`] z tym samym `state` i `has_zloto_access_now`.
    pub fn prepare_mennica_zloto_grace_for_tick<F: Fn(i64) -> bool>(
        state: &mut MennicaZlotoGraceState,
        owner_ids: &[i64],
        has_zloto_access_now: F,
    ) {
        for &owner_id in owner_ids {
            if has_zloto_access_now(owner_id) {
                state.grace_turns_left.insert(owner_id, 0);
            } else if state.had_access_last_turn.get(&owner_id) == Some(&true) {
                state
                    .grace_turns_left
                    .insert(owner_id, MENNICA_ZLOTO_GRACE_TURNS);
            }
        }
    }

    /// Web `finalizeMennicaZlotoGraceAfterTick`: migawka dostepu + dekrement laski.
    pub fn finalize_mennica_zloto_grace_after_tick<F: Fn(i64) -> bool>(
        state: &mut MennicaZlotoGraceState,
        owner_ids: &[i64],
        has_zloto_access_now: F,
    ) {
        for &owner_id in owner_ids {
            let now = has_zloto_access_now(owner_id);
            state.had_access_last_turn.insert(owner_id, now);
            if !now {
                let grace = state.grace_turns_left.get(&owner_id).copied().unwrap_or(0);
                if grace > 0 {
                    state.grace_turns_left.insert(owner_id, grace - 1);
                }
            }
        }
    }
}
