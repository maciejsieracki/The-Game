use std::{collections::BTreeMap, error::Error, fmt, sync::OnceLock};

use serde::{Deserialize, Serialize};

use crate::data::derived::{
    parse_unit_gold_costs, parse_unit_stock_costs, UnitGoldRow, UnitStockRow,
};
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
/// - `gold_cost`, `gold_upkeep`: the EDITABLE value table
///   `rust-port/engine/data/derived/unit-gold-costs.json` (P3-19 runda 3). Its numbers are the
///   bootstrap of the web rules: `scaleCostByEpoch(Pieniądz (koszt), Epoka)` and the gold upkeep
///   `scaleCostByEpoch(Utrzymanie, Epoka) x4` (FALA1 x FALA2); no multiplier at runtime.
/// - `unit_type`, `super_unit`: embedded `units.json` (`Typ`, `Super-jednostka`), unchanged.
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
            let gold = parse_unit_gold_costs().expect("embedded derived gold table must parse");
            let rows: BTreeMap<&str, &UnitStockRow> = derived
                .wiersze
                .iter()
                .map(|row| (row.jednostka.as_str(), row))
                .collect();
            let gold_rows: BTreeMap<&str, &UnitGoldRow> = gold
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
                    let gold_row = gold_rows
                        .get(record.jednostka.as_str())
                        .unwrap_or_else(|| panic!("derived gold table lacks {}", record.jednostka));
                    recruitment_from_unit_record(record, row, gold_row)
                })
                .collect()
        })
        .clone()
}

fn recruitment_from_unit_record(
    record: &UnitRecord,
    row: &UnitStockRow,
    gold: &UnitGoldRow,
) -> UnitRecruitment {
    let mut unit = UnitRecruitment::new(
        record.jednostka.as_str(),
        record.typ.as_str(),
        gold.pieniadz_koszt,
        gold.utrzymanie_pieniadz_ture,
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

// ---------------------------------------------------------------------------
// P6.5A (R-RUSTPORT-P6-5A-JEDNOSTKI-ZYCIE-A-Q1) - port 1:1 z weba (pin `edb8fb56`):
//   gra/src/game/armyMerge.ts (stosy armii: widocznosc, merge, split, pule ruchu / HP / mocy),
//   gra/src/game/unit-cost-tempo.ts (`applyUnitCostPace`),
//   gra/src/game/unit-replace-context.ts (`buildReplaceAvailabilityCtx`).
// Kolejnosc sasiadow, separator i przyrostek klucza stosu: `data/derived/ruch-jednostek-params.json`
// (P6.4); pozostale stale i teksty: `data/derived/army-merge-params.json`, tempo kosztu:
// `data/derived/unit-cost-tempo.json`. Kod nie zawiera tych wartosci. Liczby sa `f64` (semantyka JS:
// `NaN`, `-0`, `Math.min/max/round`), kolejnosc wstawiania `Set`/`Map` weba zachowana (wektory).
// Zaleznosci spoza zakresu tego tematu (`sumRosterFieldM`, odznaki sciezek, poziomy weterana) sa
// WSTRZYKIWANE jako domkniecia (`StackVitalsDeps`), tak jak web wstrzykuje `maxHpOf` i `defOf`.
// ---------------------------------------------------------------------------

pub mod army_merge {
    use std::borrow::Borrow;
    use std::collections::{HashMap, HashSet};

    use crate::data::derived::{army_merge_params, ruch_jednostek_params, unit_cost_tempo};

    /// Klucz heksa `(q, r)`; web: napis `"q,r"` (`keyOf`, `setup.ts:346`).
    pub type Klucz = (i32, i32);

    /// Predykat przejezdnosci heksu (web `isPassable: (q, r) => boolean`).
    pub type PassableFn<'a> = &'a dyn Fn(i32, i32) -> bool;

    // -----------------------------------------------------------------------
    // Semantyka JS (Math.min / Math.max / Math.round / porownanie napisow)
    // -----------------------------------------------------------------------

    /// Web `Math.min(a, b)`: `NaN`, gdy ktorykolwiek argument to `NaN`; `Math.min(0, -0)` to `-0`.
    pub fn js_min(a: f64, b: f64) -> f64 {
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

    /// Web `Math.max(a, b)`: `NaN`, gdy ktorykolwiek argument to `NaN`; `Math.max(-0, 0)` to `0`.
    pub fn js_max(a: f64, b: f64) -> f64 {
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

    /// Web `Math.round(x)`: polowki w strone `+Infinity`, `-0` dla malych ujemnych, `NaN`/`Infinity` bez zmian.
    pub fn js_round(x: f64) -> f64 {
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

    /// Web `a < b` dla napisow (porownanie jednostek UTF-16, nie bajtow UTF-8).
    fn js_str_lt(a: &str, b: &str) -> bool {
        a.encode_utf16().lt(b.encode_utf16())
    }

    /// Web `n.toString(radix)` dla calkowitych nieujemnych.
    fn to_radix(mut n: u64, radix: u32) -> String {
        if n == 0 {
            return char::from_digit(0, radix).unwrap_or('0').to_string();
        }
        let mut digits = Vec::new();
        while n > 0 {
            let digit = u32::try_from(n % u64::from(radix)).unwrap_or(0);
            digits.push(char::from_digit(digit, radix).unwrap_or('0'));
            n /= u64::from(radix);
        }
        digits.iter().rev().collect()
    }

    fn is_true(flag: Option<bool>) -> bool {
        flag == Some(true)
    }

    /// Web `keyOf` (`setup.ts:346`) / `stackKey` (`armyMerge.ts:593`).
    pub fn stack_key(q: i32, r: i32) -> String {
        format!("{q},{r}")
    }

    /// Web `NEIGH` (`armyMerge.ts:16`): kolejnosc z `ruch-jednostek-params.json` (ta sama co `HEX_NEIGHBORS`).
    fn neigh() -> impl Iterator<Item = (i32, i32)> {
        ruch_jednostek_params()
            .teren
            .sasiedzi
            .iter()
            .map(|offset| (offset[0], offset[1]))
    }

    /// Wpis mapy z zachowaniem kolejnosci wstawiania (web `Map.set`: ponowne ustawienie klucza
    /// nadpisuje wartosc, ale nie zmienia pozycji).
    fn ordered_set<V>(map: &mut Vec<(String, V)>, key: String, value: V) {
        if let Some(entry) = map.iter_mut().find(|(k, _)| *k == key) {
            entry.1 = value;
        } else {
            map.push((key, value));
        }
    }

    // -----------------------------------------------------------------------
    // Model danych: podzbior web `RuntimeUnit` (`units/setup.ts:40`) czytany przez `armyMerge.ts`
    // -----------------------------------------------------------------------

    /// Podzbior web `RuntimeUnit`. Pola `Option` odpowiadaja polom opcjonalnym weba (`None` = brak).
    #[derive(Debug, Clone, PartialEq)]
    pub struct StosJednostka {
        pub id: String,
        pub owner_id: i64,
        pub type_id: String,
        pub q: i32,
        pub r: i32,
        pub ruch: f64,
        pub ruch_left: f64,
        pub in_garnizon: Option<bool>,
        pub fortify_ruch_snapshot: Option<f64>,
        /// `hp` po walce (`None` = pelne z definicji jednostki).
        pub hp: Option<f64>,
        /// Web `oblegaCityId?: string` (pusty napis = falsy).
        pub oblega_city_id: Option<String>,
        pub sentry: Option<bool>,
        pub auto_explore: Option<bool>,
        pub ufortyfikowany_w_polu: Option<bool>,
        /// Web `stackGroupId?: string` (pusty napis = falsy).
        pub stack_group_id: Option<String>,
    }

    impl StosJednostka {
        pub fn new(id: &str, owner_id: i64, type_id: &str, q: i32, r: i32) -> Self {
            Self {
                id: id.to_owned(),
                owner_id,
                type_id: type_id.to_owned(),
                q,
                r,
                ruch: 0.0,
                ruch_left: 0.0,
                in_garnizon: None,
                fortify_ruch_snapshot: None,
                hp: None,
                oblega_city_id: None,
                sentry: None,
                auto_explore: None,
                ufortyfikowany_w_polu: None,
                stack_group_id: None,
            }
        }

        fn in_garnizon(&self) -> bool {
            is_true(self.in_garnizon)
        }

        fn oblega(&self) -> bool {
            self.oblega_city_id
                .as_ref()
                .is_some_and(|id| !id.is_empty())
        }
    }

    // -----------------------------------------------------------------------
    // Tozsamosc stosu
    // -----------------------------------------------------------------------

    /// Web `stackGroupIdOf` (`armyMerge.ts:56`).
    pub fn stack_group_id_of(u: &StosJednostka) -> String {
        if let Some(id) = u.stack_group_id.as_ref().filter(|id| !id.is_empty()) {
            return id.clone();
        }
        let stos = &ruch_jednostek_params().stos;
        let base = format!("{}{}{},{}", u.owner_id, stos.separator, u.q, u.r);
        if u.in_garnizon() {
            format!("{base}{}", stos.przyrostek_garnizon)
        } else {
            base
        }
    }

    /// Web `sameStackGroup` (`armyMerge.ts:64`).
    pub fn same_stack_group(a: &StosJednostka, b: &StosJednostka) -> bool {
        stack_group_id_of(a) == stack_group_id_of(b)
    }

    /// Web `stackGroupSeq` (`armyMerge.ts:68`): licznik modulu. Zegar (`Date.now()`) jest wejsciem.
    #[derive(Debug, Clone, Default, PartialEq, Eq)]
    pub struct StackGroupSeq {
        seq: u64,
    }

    impl StackGroupSeq {
        pub fn new() -> Self {
            Self::default()
        }

        /// Web `freshStackGroupId` (`armyMerge.ts:71`); `now_ms` = `Date.now()`.
        pub fn fresh_stack_group_id(&mut self, owner_id: i64, now_ms: u64) -> String {
            self.seq += 1;
            let params = &army_merge_params().id_stosu;
            format!(
                "{}{}{}{}{}{}",
                params.prefiks,
                owner_id,
                params.separator,
                to_radix(now_ms, params.podstawa),
                params.separator,
                to_radix(self.seq, params.podstawa),
            )
        }

        /// Web `assignSharedStackGroupId` (`armyMerge.ts:82`): no-op na pustej liscie.
        pub fn assign_shared_stack_group_id(
            &mut self,
            units_to_merge: &mut [&mut StosJednostka],
            now_ms: u64,
        ) {
            let Some(first) = units_to_merge.first() else {
                return;
            };
            let id = self.fresh_stack_group_id(first.owner_id, now_ms);
            for u in units_to_merge.iter_mut() {
                u.stack_group_id = Some(id.clone());
            }
        }
    }

    // -----------------------------------------------------------------------
    // Widocznosc i wybor stosu na heksie
    // -----------------------------------------------------------------------

    /// Web `visibleStackOnHex` (`armyMerge.ts:88`).
    pub fn visible_stack_on_hex<'a>(
        units: &'a [StosJednostka],
        q: i32,
        r: i32,
        owner_id: i64,
        group_id: Option<&str>,
    ) -> Vec<&'a StosJednostka> {
        units
            .iter()
            .filter(|u| {
                u.owner_id == owner_id
                    && u.q == q
                    && u.r == r
                    && !u.in_garnizon()
                    && group_id.is_none_or(|g| stack_group_id_of(u) == g)
            })
            .collect()
    }

    /// Web `coLocatedForMergePrompt` (`armyMerge.ts:110`).
    pub fn co_located_for_merge_prompt<'a>(
        units: &'a [StosJednostka],
        q: i32,
        r: i32,
        owner_id: i64,
        group_id: Option<&str>,
    ) -> Vec<&'a StosJednostka> {
        units
            .iter()
            .filter(|u| {
                u.owner_id == owner_id
                    && u.q == q
                    && u.r == r
                    && !u.oblega()
                    && group_id.is_none_or(|g| stack_group_id_of(u) == g)
            })
            .collect()
    }

    /// Wynik `adjacentVisibleArmyHexes`: heks z widocznym stosem.
    #[derive(Debug, Clone, PartialEq)]
    pub struct AdjacentArmyHex<'a> {
        pub q: i32,
        pub r: i32,
        pub stack: Vec<&'a StosJednostka>,
    }

    /// Web `adjacentVisibleArmyHexes` (`armyMerge.ts:128`).
    pub fn adjacent_visible_army_hexes(
        units: &[StosJednostka],
        q: i32,
        r: i32,
        owner_id: i64,
    ) -> Vec<AdjacentArmyHex<'_>> {
        let mut out = Vec::new();
        for (dq, dr) in neigh() {
            let (nq, nr) = (q + dq, r + dr);
            let stack = visible_stack_on_hex(units, nq, nr, owner_id, None);
            if !stack.is_empty() {
                out.push(AdjacentArmyHex {
                    q: nq,
                    r: nr,
                    stack,
                });
            }
        }
        out
    }

    /// Web `garrisonUnitsOnHex` (`armyMerge.ts:337`).
    pub fn garrison_units_on_hex<'a>(
        units: &'a [StosJednostka],
        q: i32,
        r: i32,
        owner_id: i64,
        group_id: Option<&str>,
    ) -> Vec<&'a StosJednostka> {
        units
            .iter()
            .filter(|u| {
                u.owner_id == owner_id
                    && u.q == q
                    && u.r == r
                    && u.in_garnizon()
                    && group_id.is_none_or(|g| stack_group_id_of(u) == g)
            })
            .collect()
    }

    /// Web `activeUnitStack` (`armyMerge.ts:161`).
    pub fn active_unit_stack<'a>(
        units: &'a [StosJednostka],
        active: &StosJednostka,
    ) -> Vec<&'a StosJednostka> {
        let group_id = stack_group_id_of(active);
        if active.in_garnizon() {
            garrison_units_on_hex(units, active.q, active.r, active.owner_id, Some(&group_id))
        } else {
            visible_stack_on_hex(units, active.q, active.r, active.owner_id, Some(&group_id))
        }
    }

    // -----------------------------------------------------------------------
    // Garnizon i fortyfikacja
    // -----------------------------------------------------------------------

    /// Web `enterGarnizon` (`armyMerge.ts:176`).
    pub fn enter_garnizon(u: &mut StosJednostka) {
        if u.in_garnizon() {
            return;
        }
        u.fortify_ruch_snapshot = Some(u.ruch_left);
        u.in_garnizon = Some(true);
        u.ruch_left = 0.0;
    }

    /// Web `exitGarnizon` (`armyMerge.ts:193`): `true`, gdy cos sie zmienilo.
    pub fn exit_garnizon(u: &mut StosJednostka) -> bool {
        if !u.in_garnizon() {
            return false;
        }
        u.in_garnizon = Some(false);
        u.sentry = Some(false);
        if let Some(snapshot) = u.fortify_ruch_snapshot.take() {
            u.ruch_left = snapshot;
        }
        true
    }

    /// Web `enterFieldFortify` (`armyMerge.ts:219`).
    pub fn enter_field_fortify(u: &mut StosJednostka) {
        u.fortify_ruch_snapshot = Some(u.ruch_left);
        u.ufortyfikowany_w_polu = Some(true);
        u.auto_explore = Some(false);
        u.ruch_left = 0.0;
    }

    /// Web `exitFieldFortify` (`armyMerge.ts:238`): `true`, gdy cos sie zmienilo.
    pub fn exit_field_fortify(u: &mut StosJednostka) -> bool {
        if !is_true(u.ufortyfikowany_w_polu) {
            return false;
        }
        u.ufortyfikowany_w_polu = Some(false);
        if let Some(snapshot) = u.fortify_ruch_snapshot.take() {
            u.ruch_left = snapshot;
        }
        true
    }

    /// Web `allDefendersFortifiedInGarnizon` (`armyMerge.ts:317`).
    pub fn all_defenders_fortified_in_garnizon<U: Borrow<StosJednostka>>(defenders: &[U]) -> bool {
        !defenders.is_empty() && defenders.iter().all(|u| u.borrow().in_garnizon())
    }

    /// Web `wakeStackForMoveOrder` (`armyMerge.ts:735`): `true`, gdy ktorykolwiek opuscil garnizon.
    pub fn wake_stack_for_move_order(stack: &mut [&mut StosJednostka]) -> bool {
        let mut left_garnizon = false;
        for su in stack.iter_mut() {
            if exit_garnizon(su) {
                left_garnizon = true;
            }
            exit_field_fortify(su);
            if is_true(su.sentry) {
                su.sentry = Some(false);
            }
        }
        left_garnizon
    }

    // -----------------------------------------------------------------------
    // Reprezentant stosu i wyswietlanie
    // -----------------------------------------------------------------------

    /// Web `pickStackRepresentative` (`armyMerge.ts:324`). Web na pustym stosie rzuca
    /// (`reduce` bez wartosci poczatkowej); tu: `None`.
    pub fn pick_stack_representative<'a, U: Borrow<StosJednostka>>(
        stack: &'a [U],
        attack_of: &dyn Fn(&StosJednostka) -> f64,
    ) -> Option<&'a StosJednostka> {
        let mut items = stack.iter().map(Borrow::borrow);
        let mut best: &StosJednostka = items.next()?;
        for u in items {
            let a = attack_of(u);
            let b = attack_of(best);
            best = if a != b {
                if a > b {
                    u
                } else {
                    best
                }
            } else if js_str_lt(&u.id, &best.id) {
                u
            } else {
                best
            };
        }
        Some(best)
    }

    /// Web `stackRenderKey` (`armyMerge.ts:378`).
    pub fn stack_render_key(u: &StosJednostka) -> String {
        let stos = &ruch_jednostek_params().stos;
        let mut key = format!("{}{}{},{}", stack_group_id_of(u), stos.separator, u.q, u.r);
        if u.in_garnizon() {
            key.push_str(&stos.przyrostek_garnizon);
        }
        key
    }

    /// Web `StackVitals` (`armyMerge.ts:902`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct StackVitals {
        pub ruch_left: f64,
        pub ruch_max: f64,
        pub hp: f64,
        pub hp_max: f64,
        pub field_power_m: f64,
        pub count: usize,
        pub armor_badge_level: u8,
        pub soft_badge_level: u8,
        pub veteran_level: u8,
        pub veteran_stars: u32,
    }

    /// Pozycja rosteru dla `sumRosterFieldM` (web: `{ typeId, def }`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct RosterEntry<D> {
        pub type_id: String,
        pub def: D,
    }

    /// Web `StackVitalsDeps` (`armyMerge.ts:926`) wraz z zaleznosciami, ktore web importuje z innych
    /// plikow, a ktore nie naleza do tego tematu (`sumRosterFieldM` z `auto-battle-power.ts`,
    /// `armorPathBadgeLevel` / `softPathBadgeLevel` z `unit-building-bonuses.ts`, `veteranLevel` /
    /// `veteranStarCount` z `veteran.ts`) - tu wstrzykiwane domknieciami.
    pub struct StackVitalsDeps<'a, D> {
        pub max_hp_of: &'a dyn Fn(&StosJednostka) -> f64,
        pub def_of: &'a dyn Fn(&StosJednostka) -> D,
        pub sum_roster_field_m: &'a dyn Fn(&[RosterEntry<D>]) -> f64,
        pub armor_badge_level: &'a dyn Fn(&StosJednostka) -> u8,
        pub soft_badge_level: &'a dyn Fn(&StosJednostka) -> u8,
        pub veteran_level: &'a dyn Fn(&StosJednostka) -> u8,
        pub veteran_star_count: &'a dyn Fn(&StosJednostka) -> u32,
    }

    /// Web `StackDisplayInfo` (`armyMerge.ts:20`); kolejnosc `Set`/`Map` zachowana.
    #[derive(Debug, Clone, PartialEq)]
    pub struct StackDisplayInfo {
        pub visible_ids: Vec<String>,
        pub badge_by_rep_id: Vec<(String, usize)>,
        /// Ustawiane przez wolajacego (main.ts); `compute_stack_display` zostawia `None`.
        pub starving_rep_ids: Option<Vec<String>>,
        /// Ustawiane przez wolajacego (main.ts); `compute_stack_display` zostawia `None`.
        pub gold_deficit_rep_ids: Option<Vec<String>>,
        pub vitals_by_rep_id: Option<Vec<(String, StackVitals)>>,
    }

    /// Web `computeStackDisplay` (`armyMerge.ts:383`).
    pub fn compute_stack_display<D>(
        units: &[StosJednostka],
        attack_of: &dyn Fn(&StosJednostka) -> f64,
        vitals_deps: Option<&StackVitalsDeps<'_, D>>,
    ) -> StackDisplayInfo {
        let mut index: HashMap<String, usize> = HashMap::new();
        let mut by_stack: Vec<Vec<&StosJednostka>> = Vec::new();
        for u in units {
            let key = stack_render_key(u);
            match index.get(&key) {
                Some(&at) => by_stack[at].push(u),
                None => {
                    index.insert(key, by_stack.len());
                    by_stack.push(vec![u]);
                }
            }
        }

        let mut visible_ids: Vec<String> = Vec::new();
        let mut badge_by_rep_id: Vec<(String, usize)> = Vec::new();
        let mut vitals_by_rep_id = vitals_deps.map(|_| Vec::<(String, StackVitals)>::new());

        for stack in &by_stack {
            let Some(rep) = pick_stack_representative(stack, attack_of) else {
                continue;
            };
            if !visible_ids.contains(&rep.id) {
                visible_ids.push(rep.id.clone());
            }
            if stack.len() > 1 {
                ordered_set(&mut badge_by_rep_id, rep.id.clone(), stack.len());
            }
            if let (Some(vitals), Some(deps)) = (vitals_by_rep_id.as_mut(), vitals_deps) {
                ordered_set(vitals, rep.id.clone(), stack_vitals(stack, deps));
            }
        }

        StackDisplayInfo {
            visible_ids,
            badge_by_rep_id,
            starving_rep_ids: None,
            gold_deficit_rep_ids: None,
            vitals_by_rep_id,
        }
    }

    /// Web `unitAtRepresentative` (`armyMerge.ts:448`).
    pub fn unit_at_representative<'a>(
        q: i32,
        r: i32,
        units: &'a [StosJednostka],
        attack_of: &dyn Fn(&StosJednostka) -> f64,
    ) -> Option<&'a StosJednostka> {
        let stack: Vec<&StosJednostka> = units
            .iter()
            .filter(|u| u.q == q && u.r == r && !u.in_garnizon())
            .collect();
        match stack.len() {
            0 => None,
            1 => Some(stack[0]),
            _ => {
                let rep = pick_stack_representative(&stack, attack_of)?;
                stack.iter().copied().find(|u| std::ptr::eq(*u, rep))
            }
        }
    }

    // -----------------------------------------------------------------------
    // Split, bounce i zwrot ruchu
    // -----------------------------------------------------------------------

    /// Web `findAdjacentEmptyHexes` (`armyMerge.ts:463`).
    pub fn find_adjacent_empty_hexes(
        units: &[StosJednostka],
        q: i32,
        r: i32,
        is_passable: PassableFn<'_>,
    ) -> Vec<Klucz> {
        let mut out = Vec::new();
        for (dq, dr) in neigh() {
            let (nq, nr) = (q + dq, r + dr);
            if !is_passable(nq, nr) {
                continue;
            }
            let occupied = units
                .iter()
                .any(|u| u.q == nq && u.r == nr && !u.in_garnizon());
            if !occupied {
                out.push((nq, nr));
            }
        }
        out
    }

    /// Web `SplitDestHex` (`armyMerge.ts:483`).
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct SplitDestHex {
        pub q: i32,
        pub r: i32,
        pub label: Option<String>,
    }

    /// Web `findSplitDestHexes` (`armyMerge.ts:494`).
    pub fn find_split_dest_hexes(
        units: &[StosJednostka],
        q: i32,
        r: i32,
        is_passable: PassableFn<'_>,
        allow_same_hex: bool,
    ) -> Vec<SplitDestHex> {
        let mut out = Vec::new();
        if allow_same_hex {
            out.push(SplitDestHex {
                q,
                r,
                label: Some(army_merge_params().podzial.etykieta_ten_heks.clone()),
            });
        }
        for (dq, dr) in find_adjacent_empty_hexes(units, q, r, is_passable) {
            out.push(SplitDestHex {
                q: dq,
                r: dr,
                label: None,
            });
        }
        out
    }

    /// Web `assignBounceHexesForUnits` (`armyMerge.ts:512`): mapa `id -> heks` w kolejnosci wstawiania.
    pub fn assign_bounce_hexes_for_units(
        units: &[StosJednostka],
        prefer_q: i32,
        prefer_r: i32,
        unit_ids: &[&str],
        is_passable: Option<PassableFn<'_>>,
    ) -> Vec<(String, Klucz)> {
        let passable = |q: i32, r: i32| is_passable.is_none_or(|f| f(q, r));
        let mut out: Vec<(String, Klucz)> = Vec::new();
        let mut virtual_occ: HashSet<Klucz> = HashSet::new();

        let is_occupied = |q: i32, r: i32, except_id: &str, virtual_occ: &HashSet<Klucz>| {
            if virtual_occ.contains(&(q, r)) {
                return true;
            }
            units.iter().any(|u| {
                u.id != except_id
                    && !unit_ids.contains(&u.id.as_str())
                    && u.q == q
                    && u.r == r
                    && !u.in_garnizon()
            })
        };

        let try_spot = |except_id: &str, virtual_occ: &HashSet<Klucz>| -> Option<Klucz> {
            if !is_occupied(prefer_q, prefer_r, except_id, virtual_occ)
                && passable(prefer_q, prefer_r)
            {
                return Some((prefer_q, prefer_r));
            }
            for (dq, dr) in neigh() {
                let (q, r) = (prefer_q + dq, prefer_r + dr);
                if !passable(q, r) {
                    continue;
                }
                if !is_occupied(q, r, except_id, virtual_occ) {
                    return Some((q, r));
                }
            }
            None
        };

        for uid in unit_ids {
            let Some(spot) = try_spot(uid, &virtual_occ) else {
                continue;
            };
            ordered_set(&mut out, (*uid).to_owned(), spot);
            virtual_occ.insert(spot);
        }
        out
    }

    /// Web `findRejectHex` (`armyMerge.ts:569`, prywatna).
    fn find_reject_hex(
        units: &[StosJednostka],
        from_q: i32,
        from_r: i32,
        except_unit_id: &str,
        is_passable: Option<PassableFn<'_>>,
    ) -> Option<Klucz> {
        let passable = |q: i32, r: i32| is_passable.is_none_or(|f| f(q, r));
        let occupied = |q: i32, r: i32| {
            units
                .iter()
                .any(|u| u.id != except_unit_id && u.q == q && u.r == r && !u.in_garnizon())
        };
        if !occupied(from_q, from_r) && passable(from_q, from_r) {
            return Some((from_q, from_r));
        }
        for (dq, dr) in neigh() {
            let (q, r) = (from_q + dq, from_r + dr);
            if !passable(q, r) {
                continue;
            }
            if !occupied(q, r) {
                return Some((q, r));
            }
        }
        None
    }

    /// Web `findBounceHexFromOrigin` (`armyMerge.ts:559`).
    pub fn find_bounce_hex_from_origin(
        units: &[StosJednostka],
        from_q: i32,
        from_r: i32,
        except_unit_id: &str,
        is_passable: Option<PassableFn<'_>>,
    ) -> Option<Klucz> {
        find_reject_hex(units, from_q, from_r, except_unit_id, is_passable)
    }

    /// Web `computeSeparateReturn` (`armyMerge.ts:621`): mapa `id -> ruch` w kolejnosci wstawiania.
    pub fn compute_separate_return<U: Borrow<StosJednostka>>(
        moved_units: &[U],
        deducted_ruch: f64,
    ) -> Vec<(String, f64)> {
        let safe_deducted = js_max(0.0, deducted_ruch);
        let mut out: Vec<(String, f64)> = Vec::new();
        for u in moved_units {
            let u = u.borrow();
            ordered_set(
                &mut out,
                u.id.clone(),
                js_min(u.ruch, u.ruch_left + safe_deducted),
            );
        }
        out
    }

    /// Web `resolveSeparateReturnHex` (`armyMerge.ts:667`).
    pub fn resolve_separate_return_hex(
        units: &[StosJednostka],
        from_q: i32,
        from_r: i32,
        owner_id: i64,
        is_passable: Option<PassableFn<'_>>,
    ) -> Option<Klucz> {
        if let Some(passable) = is_passable {
            if !passable(from_q, from_r) {
                return None;
            }
        }
        let blocked_by_enemy = units
            .iter()
            .any(|u| u.q == from_q && u.r == from_r && u.owner_id != owner_id && !u.in_garnizon());
        if blocked_by_enemy {
            None
        } else {
            Some((from_q, from_r))
        }
    }

    /// Akcja paska stosu (web `{ id: 'split' | 'merge'; label; disabled }`).
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct StackHudAction {
        pub id: String,
        pub label: String,
        pub disabled: bool,
    }

    /// Web `stackHudMergeSplitActions` (`armyMerge.ts:683`).
    pub fn stack_hud_merge_split_actions(
        stack_length: usize,
        can_merge: bool,
        split_destination_count: usize,
    ) -> Vec<StackHudAction> {
        let params = &army_merge_params().podzial;
        let split = StackHudAction {
            id: params.akcja_rozdziel.id.clone(),
            label: params.akcja_rozdziel.etykieta.clone(),
            disabled: split_destination_count == 0,
        };
        let merge = |disabled: bool| StackHudAction {
            id: params.akcja_polacz.id.clone(),
            label: params.akcja_polacz.etykieta.clone(),
            disabled,
        };
        let mut actions = Vec::new();
        if stack_length >= params.min_stos_rozdzielenia {
            actions.push(split);
            actions.push(merge(!can_merge));
        } else if can_merge {
            actions.push(merge(false));
        }
        actions
    }

    // -----------------------------------------------------------------------
    // Pule stosu: ruch, HP, moc pola, odznaki
    // -----------------------------------------------------------------------

    fn min_by<U: Borrow<StosJednostka>>(stack: &[U], pick: impl Fn(&StosJednostka) -> f64) -> f64 {
        let mut items = stack.iter().map(|u| pick(u.borrow()));
        let Some(first) = items.next() else {
            return f64::INFINITY;
        };
        items.fold(first, js_min)
    }

    /// Web `stackRuchLeft` (`armyMerge.ts:707`).
    pub fn stack_ruch_left<U: Borrow<StosJednostka>>(stack: &[U]) -> f64 {
        if stack.is_empty() {
            return 0.0;
        }
        min_by(stack, |u| u.ruch_left)
    }

    /// Web `planningUnitRuchLeft` (`armyMerge.ts:722`).
    pub fn planning_unit_ruch_left(u: &StosJednostka) -> f64 {
        match u.fortify_ruch_snapshot {
            Some(snapshot) if u.in_garnizon() || is_true(u.ufortyfikowany_w_polu) => snapshot,
            _ => u.ruch_left,
        }
    }

    /// Web `planningStackRuchLeft` (`armyMerge.ts:717`).
    pub fn planning_stack_ruch_left<U: Borrow<StosJednostka>>(stack: &[U]) -> f64 {
        if stack.is_empty() {
            return 0.0;
        }
        min_by(stack, planning_unit_ruch_left)
    }

    /// Web `stackRuchMax` (`armyMerge.ts:754`).
    pub fn stack_ruch_max<U: Borrow<StosJednostka>>(stack: &[U]) -> f64 {
        if stack.is_empty() {
            return 0.0;
        }
        min_by(stack, |u| u.ruch)
    }

    /// Web `stackHpPool` (`armyMerge.ts:775`): `(hp, hpMax)`.
    pub fn stack_hp_pool<U: Borrow<StosJednostka>>(
        stack: &[U],
        max_hp_of: &dyn Fn(&StosJednostka) -> f64,
    ) -> (f64, f64) {
        let mut hp = 0.0;
        let mut hp_max = 0.0;
        for u in stack {
            let u = u.borrow();
            let m = max_hp_of(u);
            if !m.is_finite() || m <= 0.0 {
                continue;
            }
            hp_max += m;
            let cur = match u.hp {
                Some(current) if current.is_finite() => js_max(0.0, js_min(m, current)),
                _ => m,
            };
            hp += cur;
        }
        (hp, hp_max)
    }

    /// Web `stackFieldPowerM` (`armyMerge.ts:833`).
    pub fn stack_field_power_m<U: Borrow<StosJednostka>, D>(
        stack: &[U],
        def_of: &dyn Fn(&StosJednostka) -> D,
        sum_roster_field_m: &dyn Fn(&[RosterEntry<D>]) -> f64,
    ) -> f64 {
        if stack.is_empty() {
            return 0.0;
        }
        let roster: Vec<RosterEntry<D>> = stack
            .iter()
            .map(|u| {
                let u = u.borrow();
                RosterEntry {
                    type_id: u.type_id.clone(),
                    def: def_of(u),
                }
            })
            .collect();
        sum_roster_field_m(&roster)
    }

    /// Web `stackArmorBadgeLevel` / `stackSoftBadgeLevel` (`armyMerge.ts:854`, `:864`): maksimum
    /// poziomu odznaki (`level_of` = `armorPathBadgeLevel` / `softPathBadgeLevel`).
    pub fn stack_badge_level<U: Borrow<StosJednostka>>(
        stack: &[U],
        level_of: &dyn Fn(&StosJednostka) -> u8,
    ) -> u8 {
        let mut best = army_merge_params().stan_stosu.poziom_odznaki_poczatkowy;
        for u in stack {
            let level = level_of(u.borrow());
            if level > best {
                best = level;
            }
        }
        best
    }

    /// Web `stackArmorBadgeLevel` (`armyMerge.ts:854`).
    pub fn stack_armor_badge_level<U: Borrow<StosJednostka>>(
        stack: &[U],
        armor_path_badge_level: &dyn Fn(&StosJednostka) -> u8,
    ) -> u8 {
        stack_badge_level(stack, armor_path_badge_level)
    }

    /// Web `stackSoftBadgeLevel` (`armyMerge.ts:864`).
    pub fn stack_soft_badge_level<U: Borrow<StosJednostka>>(
        stack: &[U],
        soft_path_badge_level: &dyn Fn(&StosJednostka) -> u8,
    ) -> u8 {
        stack_badge_level(stack, soft_path_badge_level)
    }

    /// Web `stackVeteranLevel` (`armyMerge.ts:874`).
    pub fn stack_veteran_level<U: Borrow<StosJednostka>>(
        stack: &[U],
        veteran_level: &dyn Fn(&StosJednostka) -> u8,
    ) -> u8 {
        let mut best = army_merge_params().stan_stosu.poziom_weterana_poczatkowy;
        for u in stack {
            let level = veteran_level(u.borrow());
            if level > best {
                best = level;
            }
        }
        best
    }

    /// Web `stackVeteranStarCount` (`armyMerge.ts:892`).
    pub fn stack_veteran_star_count<U: Borrow<StosJednostka>>(
        stack: &[U],
        veteran_star_count: &dyn Fn(&StosJednostka) -> u32,
    ) -> u32 {
        let mut best = army_merge_params().stan_stosu.gwiazdki_poczatkowe;
        for u in stack {
            let n = veteran_star_count(u.borrow());
            if n > best {
                best = n;
            }
        }
        best
    }

    /// Web `stackVitals` (`armyMerge.ts:934`).
    pub fn stack_vitals<U: Borrow<StosJednostka>, D>(
        stack: &[U],
        deps: &StackVitalsDeps<'_, D>,
    ) -> StackVitals {
        let (hp, hp_max) = stack_hp_pool(stack, deps.max_hp_of);
        StackVitals {
            ruch_left: stack_ruch_left(stack),
            ruch_max: stack_ruch_max(stack),
            hp,
            hp_max,
            field_power_m: stack_field_power_m(stack, deps.def_of, deps.sum_roster_field_m),
            count: stack.len(),
            armor_badge_level: stack_armor_badge_level(stack, deps.armor_badge_level),
            soft_badge_level: stack_soft_badge_level(stack, deps.soft_badge_level),
            veteran_level: stack_veteran_level(stack, deps.veteran_level),
            veteran_stars: stack_veteran_star_count(stack, deps.veteran_star_count),
        }
    }

    /// Web `syncStackRuchLeft` (`armyMerge.ts:954`); `ruch_left = None` = minimum obecnych.
    pub fn sync_stack_ruch_left(stack: &mut [&mut StosJednostka], ruch_left: Option<f64>) {
        if stack.is_empty() {
            return;
        }
        let v = ruch_left.unwrap_or_else(|| min_by(stack, |u| u.ruch_left));
        for u in stack.iter_mut() {
            u.ruch_left = v;
        }
    }

    /// Web `deductStackRuchLeft` (`armyMerge.ts:961`).
    pub fn deduct_stack_ruch_left(stack: &mut [&mut StosJednostka], cost: f64) {
        let pooled = if stack.is_empty() {
            0.0
        } else {
            min_by(stack, |u| u.ruch_left)
        };
        sync_stack_ruch_left(stack, Some(js_max(0.0, pooled - cost)));
    }

    /// Web `unitWithStackRuch` (`armyMerge.ts:966`); web zwraca ten sam obiekt, gdy nic sie nie zmienia
    /// (Rust: kopia o tej samej wartosci).
    pub fn unit_with_stack_ruch<U: Borrow<StosJednostka>>(
        unit: &StosJednostka,
        stack: &[U],
    ) -> StosJednostka {
        if stack.len() <= 1 {
            return unit.clone();
        }
        let pooled = stack_ruch_left(stack);
        let mut out = unit.clone();
        if pooled != unit.ruch_left {
            out.ruch_left = pooled;
        }
        out
    }

    /// Web `unitWithPlanningStackRuch` (`armyMerge.ts:976`).
    pub fn unit_with_planning_stack_ruch<U: Borrow<StosJednostka>>(
        unit: &StosJednostka,
        stack: &[U],
    ) -> StosJednostka {
        let pooled = planning_stack_ruch_left(stack);
        let mut out = unit.clone();
        if pooled != unit.ruch_left {
            out.ruch_left = pooled;
        }
        out
    }

    /// Web `countLawGarrisonOnCityHex` (`armyMerge.ts:988`).
    pub fn count_law_garrison_on_city_hex(
        units: &[StosJednostka],
        city_q: i32,
        city_r: i32,
        owner_id: i64,
    ) -> usize {
        units_on_city_hex_for_law(units, city_q, city_r, owner_id).len()
    }

    /// Web `unitsOnCityHexForLaw` (`armyMerge.ts:1003`).
    pub fn units_on_city_hex_for_law(
        units: &[StosJednostka],
        city_q: i32,
        city_r: i32,
        owner_id: i64,
    ) -> Vec<&StosJednostka> {
        units
            .iter()
            .filter(|u| u.owner_id == owner_id && u.q == city_q && u.r == city_r && !u.oblega())
            .collect()
    }

    // -----------------------------------------------------------------------
    // unit-cost-tempo.ts
    // -----------------------------------------------------------------------

    /// Web `KosztJednostekPace | number` (`unit-cost-tempo.ts:30`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub enum UnitCostPace<'a> {
        /// Klucz tempa z `unit-cost-tempo.json` (`niski` / `normalny` / `wysoki`).
        Key(&'a str),
        /// Mnoznik liczbowy.
        Multiplier(f64),
    }

    /// Web `applyUnitCostPace` (`unit-cost-tempo.ts:31`). Nieznany klucz daje `NaN` (web: `undefined`
    /// w mnozeniu).
    pub fn apply_unit_cost_pace(bazowy_koszt: f64, pace: UnitCostPace<'_>) -> f64 {
        let table = unit_cost_tempo();
        let mnoznik = match pace {
            UnitCostPace::Multiplier(m) => m,
            UnitCostPace::Key(key) => table.mnoznik(key).unwrap_or(f64::NAN),
        };
        js_max(table.min_koszt, js_round(bazowy_koszt * mnoznik))
    }

    /// Klucze web `KOSZT_JEDNOSTEK_PACE` w kolejnosci tabeli.
    pub fn koszt_jednostek_pace_keys() -> Vec<&'static str> {
        unit_cost_tempo()
            .tempa
            .iter()
            .map(|row| row.klucz.as_str())
            .collect()
    }

    // -----------------------------------------------------------------------
    // unit-replace-context.ts
    // -----------------------------------------------------------------------

    /// Web `ReplaceAvailabilityCtxParams` (`unit-replace-context.ts:50`): reszta pol
    /// `AvailabilityContext` (`production.ts:417`, poza zakresem) + OBOWIAZKOWY `empireResourceStock`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct ReplaceAvailabilityCtxParams<R> {
        pub reszta: R,
        pub empire_resource_stock: super::ResourceStock,
    }

    /// Web `AvailabilityContext` (`production.ts:417`): `empireResourceStock` opcjonalny.
    #[derive(Debug, Clone, PartialEq)]
    pub struct AvailabilityContext<R> {
        pub reszta: R,
        pub empire_resource_stock: Option<super::ResourceStock>,
    }

    /// Web `buildReplaceAvailabilityCtx` (`unit-replace-context.ts:57`): `{ ...params }`.
    pub fn build_replace_availability_ctx<R: Clone>(
        params: &ReplaceAvailabilityCtxParams<R>,
    ) -> AvailabilityContext<R> {
        AvailabilityContext {
            reszta: params.reszta.clone(),
            empire_resource_stock: Some(params.empire_resource_stock.clone()),
        }
    }
}

// ---------------------------------------------------------------------------
// P6.5B (R-RUSTPORT-P6-5B-JEDNOSTKI-ZYCIE-B-Q1): port `gra/src/game/manpower.ts` (pin edb8fb56).
//
// Ludnosc absolutna i pula Manpower per miasto, odnowa, rekrutacja z puli imperium oraz leczenie
// jednostek z puli. Stale i teksty: `data/derived/manpower-params.json`; tabela epok i parametry
// miasta: `data/epoka-ludnosc-manpower.json`, `data/miasto-params.json` (DANE-JUZ-W-RUST,
// `data/economy_society.rs`). Liczby sa `f64` (semantyka JS: `NaN`, `-0`, `Math.min/max/round`).
//
// Zaleznosci spoza tego pliku weba:
// - `isCivilianUnit` (`units/setup.ts:196`): portowana lokalnie (`is_civilian_unit`), zbior w JSON;
// - `localeCompare` (ICU): `locale_compare` (ASCII 0x20-0x7E zmierzone, reszta NIE_ZMIERZONO);
// - `Number#toString`: `js_number_to_string` (algorytm ECMAScript Number::toString).
// Domkniecia wstrzykiwane przez weba (`resolveOwnerEra`, `resolveOwnerBonusy`, `getMaxHp`,
// `onUnitHpChanged`) pozostaja domknieciami.
// ---------------------------------------------------------------------------

pub mod manpower {
    use std::sync::OnceLock;

    use super::army_merge::{js_max, js_min, js_round};
    use crate::data::derived::{locale_compare_ascii, manpower_params};
    use crate::data::economy_society::{
        parse_epoka_ludnosc_manpower, parse_miasto_params, MiastoParams,
    };

    // -----------------------------------------------------------------------
    // Semantyka JS: Number#toString, localeCompare, stabilne sortowanie
    // -----------------------------------------------------------------------

    /// Web `String(x)` / `${x}` dla liczby (ECMAScript Number::toString, radix 10).
    pub fn js_number_to_string(x: f64) -> String {
        if x.is_nan() {
            return "NaN".to_owned();
        }
        if x == 0.0 {
            return "0".to_owned();
        }
        if x.is_infinite() {
            return if x > 0.0 { "Infinity" } else { "-Infinity" }.to_owned();
        }
        let sign = if x < 0.0 { "-" } else { "" };
        let (digits, n) = shortest_digits(x.abs());
        let k = i32::try_from(digits.len()).expect("liczba cyfr");
        let body = if k <= n && n <= 21 {
            format!(
                "{digits}{}",
                "0".repeat(usize::try_from(n - k).expect("n >= k"))
            )
        } else if 0 < n && n <= 21 {
            let split = usize::try_from(n).expect("n > 0");
            format!("{}.{}", &digits[..split], &digits[split..])
        } else if -6 < n && n <= 0 {
            format!(
                "0.{}{digits}",
                "0".repeat(usize::try_from(-n).expect("n <= 0"))
            )
        } else {
            let e = n - 1;
            let e_sign = if e < 0 { "-" } else { "+" };
            if k == 1 {
                format!("{digits}e{e_sign}{}", e.abs())
            } else {
                format!("{}.{}e{e_sign}{}", &digits[..1], &digits[1..], e.abs())
            }
        };
        format!("{sign}{body}")
    }

    /// Najkrotsze cyfry `digits` i wykladnik `n` (wartosc = 0.digits * 10^n) dla dodatniej, skonczonej
    /// liczby. Przy DOKLADNYM remisie dwoch najkrotszych kandydatow ECMAScript wybiera parzysta
    /// ostatnia cyfre (Rust wybiera wieksza), np. `-2199212936684489.25` -> `...489.2`.
    fn shortest_digits(abs: f64) -> (String, i32) {
        let scientific = format!("{abs:e}");
        let (mantissa, exponent) = scientific
            .split_once('e')
            .expect("format {:e} ma wykladnik");
        let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
        let exp10 = exponent.parse::<i32>().expect("wykladnik");
        let n = exp10 + 1;
        let k = digits.len();
        if k >= 18 {
            return (digits, n);
        }
        // k + 1 cyfr znaczacych: remis tylko gdy ostatnia cyfra to 5 i rozwiniecie sie na niej konczy
        let longer = format!("{abs:.k$e}");
        let longer_digits: String = longer
            .split_once('e')
            .expect("wykladnik")
            .0
            .chars()
            .filter(|c| *c != '.')
            .collect();
        if !longer_digits.ends_with('5') {
            return (digits, n);
        }
        let exact = format!("{abs:.800e}");
        let tail: String = exact
            .split_once('e')
            .expect("wykladnik")
            .0
            .chars()
            .filter(|c| *c != '.')
            .skip(k + 1)
            .collect();
        let exp_longer = longer
            .split_once('e')
            .expect("wykladnik")
            .1
            .parse::<i32>()
            .expect("wykladnik");
        if tail.chars().any(|c| c != '0') {
            return (digits, n);
        }
        let Ok(lower) = longer_digits[..k].parse::<u64>() else {
            return (digits, n);
        };
        let scale = exp_longer - (i32::try_from(k).expect("k") - 1);
        let candidates = [lower, lower + 1];
        let chosen = candidates
            .iter()
            .copied()
            .filter(|c| c % 2 == 0)
            .find(|c| format!("{c}e{scale}").parse::<f64>().ok() == Some(abs));
        match chosen {
            Some(cand) if cand > 0 => {
                let text = cand.to_string();
                let nn = i32::try_from(text.len()).expect("len") + scale;
                (text.trim_end_matches('0').to_owned(), nn)
            }
            _ => (digits, n),
        }
    }

    fn ascii_printable(text: &str) -> bool {
        text.chars().all(|c| (' '..='~').contains(&c))
    }

    /// Web `a.localeCompare(b)` (ICU, locale en-US) dla napisow z ASCII 0x20-0x7E: poziom 1 wg
    /// `locale-compare-ascii.json` (wielkosc liter ignorowana), poziom 3: male przed wielkimi.
    /// Napisy spoza tego zakresu: NIE_ZMIERZONO - porownanie jednostek UTF-16.
    pub fn locale_compare(a: &str, b: &str) -> i32 {
        let ordering = if ascii_printable(a) && ascii_printable(b) {
            let table = locale_compare_ascii();
            let weight = |c: char| {
                let lower = c.to_ascii_lowercase();
                table
                    .kolejnosc_podstawowa
                    .chars()
                    .position(|candidate| candidate == lower)
            };
            let primary_a: Vec<Option<usize>> = a.chars().map(weight).collect();
            let primary_b: Vec<Option<usize>> = b.chars().map(weight).collect();
            primary_a.cmp(&primary_b).then_with(|| {
                for (ca, cb) in a.chars().zip(b.chars()) {
                    if ca != cb {
                        let a_lower = ca.is_ascii_lowercase();
                        return if a_lower == table.male_przed_wielkimi {
                            std::cmp::Ordering::Less
                        } else {
                            std::cmp::Ordering::Greater
                        };
                    }
                }
                std::cmp::Ordering::Equal
            })
        } else {
            a.encode_utf16().cmp(b.encode_utf16())
        };
        match ordering {
            std::cmp::Ordering::Less => -1,
            std::cmp::Ordering::Equal => 0,
            std::cmp::Ordering::Greater => 1,
        }
    }

    /// Web `Array#sort(cmp)` (stabilny): komparator zwraca liczbe (`NaN` = rowne, jak w V8);
    /// wstawianie bez paniki dla niespojnych komparatorow.
    fn stable_sort_by<T>(items: &mut [T], cmp: &dyn Fn(&T, &T) -> f64) {
        for i in 1..items.len() {
            let mut j = i;
            while j > 0 && cmp(&items[j - 1], &items[j]) > 0.0 {
                items.swap(j - 1, j);
                j -= 1;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Tabela epok i parametry miasta (dane juz w Rust)
    // -----------------------------------------------------------------------

    /// Web `EpokaManpowerRow` (`manpower.ts:30`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct EpokaManpowerRow {
        pub epoka: f64,
        pub ludek_na_ludka: f64,
        pub manpower_na_ludka: f64,
        pub manpower_na_jednostke: f64,
    }

    fn to_f64(value: i64) -> f64 {
        f64::from(i32::try_from(value).expect("wartosc tabeli epok miesci sie w i32"))
    }

    /// Web `ROWS` / `allEpokaManpowerRows` (`manpower.ts:50`, `:875`).
    pub fn all_epoka_manpower_rows() -> &'static [EpokaManpowerRow] {
        static ROWS: OnceLock<Vec<EpokaManpowerRow>> = OnceLock::new();
        ROWS.get_or_init(|| {
            parse_epoka_ludnosc_manpower()
                .expect("epoka-ludnosc-manpower.json must parse")
                .epoki
                .iter()
                .map(|row| EpokaManpowerRow {
                    epoka: to_f64(row.epoka),
                    ludek_na_ludka: to_f64(row.ludek_na_ludka),
                    manpower_na_ludka: to_f64(row.manpower_na_ludka),
                    manpower_na_jednostke: to_f64(row.manpower_na_jednostke),
                })
                .collect()
        })
    }

    /// Surowe wartosci `miasto-params.json` czytane przez `manpower.ts`. `None` = brak klucza albo
    /// wartosc nie-liczbowa (web: `typeof !== 'number'`).
    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct ReplenishRaw {
        pub easy: Option<f64>,
        pub normal: Option<f64>,
        pub hard: Option<f64>,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct MiastoManpowerRaw {
        /// `manpower_uzupelnienie_hp_proc_max_tura` (`None` = brak wiersza).
        pub replenish: Option<ReplenishRaw>,
        /// `manpower_regen_proc_max_tura.wartosc`.
        pub regen_pct: Option<f64>,
        /// `manpower_regen_blok_oblezenie.wartosc`.
        pub regen_block: Option<f64>,
    }

    impl MiastoManpowerRaw {
        /// Web domyslny argument `raw = miastoParams` (prawdziwy plik gry).
        pub fn from_miasto_params(params: &MiastoParams) -> Self {
            let row = &params.manpower_uzupelnienie_hp_proc_max_tura;
            Self {
                replenish: Some(ReplenishRaw {
                    easy: Some(to_f64(row.easy)),
                    normal: Some(to_f64(row.normal)),
                    hard: Some(to_f64(row.hard)),
                }),
                regen_pct: Some(to_f64(params.manpower_regen_proc_max_tura.wartosc)),
                regen_block: Some(to_f64(params.manpower_regen_blok_oblezenie.wartosc)),
            }
        }

        /// Prawdziwy `miasto-params.json` (jednorazowy odczyt).
        pub fn game() -> &'static Self {
            static RAW: OnceLock<MiastoManpowerRaw> = OnceLock::new();
            RAW.get_or_init(|| {
                Self::from_miasto_params(&parse_miasto_params().expect("miasto-params.json"))
            })
        }
    }

    // -----------------------------------------------------------------------
    // Parametry odnowy i leczenia
    // -----------------------------------------------------------------------

    /// Web `ManpowerRegenParams` (`manpower.ts:56`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct ManpowerRegenParams {
        pub regen_proc_max_per_turn: f64,
        pub block_when_besieged: bool,
    }

    impl ManpowerRegenParams {
        /// Web `DEFAULT_REGEN` (`manpower.ts:63`).
        pub fn default_params() -> Self {
            let defaults = &manpower_params().domyslne_regen;
            Self {
                regen_proc_max_per_turn: defaults.proc_max_na_ture,
                block_when_besieged: defaults.blokada_przy_oblezeniu,
            }
        }
    }

    /// Web `ManpowerDifficulty` (`manpower.ts:68`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum ManpowerDifficulty {
        Easy,
        Normal,
        Hard,
    }

    /// Web `ManpowerReplenishParams` (`manpower.ts:70`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct ManpowerReplenishParams {
        pub heal_pct_max_per_turn: f64,
    }

    fn valid_percent(value: Option<f64>) -> Option<f64> {
        value.filter(|v| v.is_finite() && *v >= 0.0)
    }

    /// Web `loadManpowerReplenishParams` (`manpower.ts:82`). `raw = None` to domyslny argument weba
    /// (prawdziwy `miasto-params.json`).
    pub fn load_manpower_replenish_params(
        difficulty: ManpowerDifficulty,
        raw: Option<&MiastoManpowerRaw>,
    ) -> ManpowerReplenishParams {
        let raw = match raw {
            Some(raw) => raw,
            None => MiastoManpowerRaw::game(),
        };
        let row = raw.replenish.unwrap_or_default();
        let defaults = &manpower_params().domyslne_uzupelnienie_hp_proc;
        let (value, default) = match difficulty {
            ManpowerDifficulty::Easy => (row.easy, defaults.easy),
            ManpowerDifficulty::Normal => (row.normal, defaults.normal),
            ManpowerDifficulty::Hard => (row.hard, defaults.hard),
        };
        let picked = valid_percent(value)
            .or_else(|| valid_percent(row.normal))
            .unwrap_or(default);
        ManpowerReplenishParams {
            heal_pct_max_per_turn: js_min(manpower_params().maks_proc, picked),
        }
    }

    /// Web `loadManpowerRegenParams` (`manpower.ts:373`).
    pub fn load_manpower_regen_params(raw: Option<&MiastoManpowerRaw>) -> ManpowerRegenParams {
        let raw = match raw {
            Some(raw) => raw,
            None => MiastoManpowerRaw::game(),
        };
        let defaults = ManpowerRegenParams::default_params();
        ManpowerRegenParams {
            regen_proc_max_per_turn: match raw.regen_pct {
                Some(pct) if pct >= 0.0 => pct,
                _ => defaults.regen_proc_max_per_turn,
            },
            block_when_besieged: match raw.regen_block {
                None => true,
                Some(block) => block != 0.0,
            },
        }
    }

    // -----------------------------------------------------------------------
    // Bonusy cywilizacji
    // -----------------------------------------------------------------------

    /// Web `CivBonusPoborLite` (`manpower.ts:385`). `wartosc`: tylko liczby sa czytane (`typeof`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct CivBonusPoborLite {
        pub typ: Option<String>,
        pub wartosc: Option<f64>,
    }

    fn bonus_is(bonus: &CivBonusPoborLite, typ: &str) -> Option<f64> {
        match (&bonus.typ, bonus.wartosc) {
            (Some(t), Some(w)) if t == typ => Some(w),
            _ => None,
        }
    }

    /// Web `civManpowerRegenMult` (`manpower.ts:396`).
    pub fn civ_manpower_regen_mult(bonusy: Option<&[CivBonusPoborLite]>) -> f64 {
        let table = &manpower_params().mnozniki_cywilizacji;
        let mut mult = 1.0;
        let Some(list) = bonusy.filter(|list| !list.is_empty()) else {
            return mult;
        };
        for bonus in list {
            if let Some(w) = bonus_is(bonus, &table.typ_regen_bonus) {
                mult *= 1.0 + w;
            } else if let Some(w) = bonus_is(bonus, &table.typ_regen_mnoznik) {
                mult *= w;
            }
        }
        js_max(table.regen_min, mult)
    }

    /// Web `civManpowerMaxMult` (`manpower.ts:415`).
    pub fn civ_manpower_max_mult(bonusy: Option<&[CivBonusPoborLite]>) -> f64 {
        let table = &manpower_params().mnozniki_cywilizacji;
        let mut mult = 1.0;
        let Some(list) = bonusy.filter(|list| !list.is_empty()) else {
            return mult;
        };
        for bonus in list {
            if let Some(w) = bonus_is(bonus, &table.typ_pula_bonus) {
                mult *= 1.0 + w;
            } else if let Some(w) = bonus_is(bonus, &table.typ_pula_mnoznik) {
                mult *= w;
            }
        }
        js_max(table.max_min, mult)
    }

    /// Web `civManpowerMults` (`manpower.ts:431`).
    pub fn civ_manpower_mults(bonusy: Option<&[CivBonusPoborLite]>) -> (f64, f64) {
        (
            civ_manpower_regen_mult(bonusy),
            civ_manpower_max_mult(bonusy),
        )
    }

    // -----------------------------------------------------------------------
    // Miasto, jednostka
    // -----------------------------------------------------------------------

    /// Podzbior web `City` (`cities.ts`) czytany/pisany przez `manpower.ts`.
    #[derive(Debug, Clone, PartialEq)]
    pub struct ManpowerCity {
        pub id: String,
        pub owner_id: i64,
        pub population: f64,
        /// `None` = pole nieustawione (web `undefined`).
        pub manpower: Option<f64>,
        pub q: i32,
        pub r: i32,
        pub oblegane: Option<bool>,
    }

    impl ManpowerCity {
        pub fn new(id: impl Into<String>, owner_id: i64, population: f64) -> Self {
            Self {
                id: id.into(),
                owner_id,
                population,
                manpower: None,
                q: 0,
                r: 0,
                oblegane: None,
            }
        }
    }

    /// Web `ManpowerHealUnit` (`manpower.ts:99`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct ManpowerHealUnit {
        pub id: String,
        pub owner_id: i64,
        pub type_id: String,
        pub category: String,
        pub hp: Option<f64>,
        pub hp_max: Option<f64>,
        pub parametry_bonus_proc: Option<f64>,
        pub battles_survived: Option<f64>,
        pub q: Option<i32>,
        pub r: Option<i32>,
        pub in_garnizon: Option<bool>,
    }

    /// Web `isCivilianUnit` (`units/setup.ts:196`): zaleznosc `manpower.ts` spoza zakresu, portowana
    /// lokalnie ze zbiorami z `manpower-params.json` (`cywilne`).
    pub fn is_civilian_unit(category: &str, type_id: &str) -> bool {
        let table = &manpower_params().cywilne;
        table.kategorie.iter().any(|c| c == category) || table.typy.iter().any(|t| t == type_id)
    }

    /// Web `syncLiveUnitHp` (`manpower.ts:117`): pierwsza jednostka o danym id.
    pub fn sync_live_unit_hp(units: &mut [ManpowerHealUnit], unit_id: &str, hp: f64, hp_max: f64) {
        if let Some(live) = units.iter_mut().find(|unit| unit.id == unit_id) {
            live.hp = Some(hp);
            live.hp_max = Some(hp_max);
        }
    }

    /// Web `isUnitInBesiegedLocation` (`manpower.ts:132`).
    pub fn is_unit_in_besieged_location(
        owner_id: i64,
        q: Option<i32>,
        r: Option<i32>,
        cities: &[ManpowerCity],
    ) -> bool {
        let (Some(q), Some(r)) = (q, r) else {
            return false;
        };
        let Some(city) = cities.iter().find(|c| c.q == q && c.r == r) else {
            return false;
        };
        city.owner_id == owner_id && city.oblegane == Some(true)
    }

    /// Web `replenishmentUnitSortKey` (`manpower.ts:143`).
    pub fn replenishment_unit_sort_key(unit: &ManpowerHealUnit, cities: &[ManpowerCity]) -> u8 {
        let keys = &manpower_params().klucz_sortowania_leczenia;
        if is_unit_in_besieged_location(unit.owner_id, unit.q, unit.r, cities) {
            return keys.oblezone;
        }
        if unit.in_garnizon == Some(true) {
            return keys.garnizon;
        }
        keys.pole
    }

    /// Web `ManpowerReplenishResult` (`manpower.ts:152`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct ManpowerReplenishResult {
        pub healed_count: usize,
        pub total_mp_spent: f64,
    }

    // -----------------------------------------------------------------------
    // Leczenie: koszt, limit, przydzial
    // -----------------------------------------------------------------------

    /// Web `manpowerHealCapForTurn` (`manpower.ts:158`).
    pub fn manpower_heal_cap_for_turn(
        max_hp: f64,
        cur_hp: f64,
        params: &ManpowerReplenishParams,
    ) -> f64 {
        if max_hp <= 0.0 || cur_hp <= 0.0 || cur_hp >= max_hp {
            return 0.0;
        }
        let cap = (max_hp * params.heal_pct_max_per_turn / manpower_params().maks_proc).floor();
        js_max(0.0, js_min(cap, max_hp - cur_hp))
    }

    /// Web `manpowerCostForHeal` (`manpower.ts:169`).
    pub fn manpower_cost_for_heal(heal_hp: f64, max_hp: f64, unit_cost: f64) -> f64 {
        if heal_hp <= 0.0 || max_hp <= 0.0 || unit_cost <= 0.0 {
            return 0.0;
        }
        js_min(unit_cost, ((heal_hp / max_hp) * unit_cost).ceil())
    }

    /// Web `maxAffordableManpowerHeal` (`manpower.ts:179`).
    pub fn max_affordable_manpower_heal(
        desired_heal: f64,
        max_hp: f64,
        unit_cost: f64,
        available_mp: f64,
    ) -> f64 {
        if desired_heal <= 0.0 || max_hp <= 0.0 || unit_cost <= 0.0 || available_mp <= 0.0 {
            return 0.0;
        }
        js_min(desired_heal, (available_mp * max_hp / unit_cost).floor())
    }

    /// Web `ReplenishmentCandidate` (`manpower.ts:189`); `unit` = indeks w liscie jednostek.
    #[derive(Debug, Clone, PartialEq)]
    pub struct ReplenishmentCandidate {
        pub unit: usize,
        pub unit_id: String,
        pub max_hp: f64,
        pub cur_hp: f64,
        pub unit_cost: f64,
        pub desired_heal: f64,
        pub desired_mp: f64,
        pub allocated_mp: f64,
        pub heal_hp: f64,
    }

    /// Web `allocateProportionalReplenishment` (`manpower.ts:206`). Martwe zapisy `usedMp` po
    /// inicjalizacji `remainingMp` (nigdy nieczytane) pominiete.
    pub fn allocate_proportional_replenishment(
        candidates: &mut [ReplenishmentCandidate],
        available_mp: f64,
    ) {
        let total_desired_mp = candidates.iter().fold(0.0, |sum, c| sum + c.desired_mp);
        if total_desired_mp <= 0.0 || available_mp <= 0.0 {
            return;
        }

        if total_desired_mp <= available_mp {
            for candidate in candidates.iter_mut() {
                candidate.allocated_mp = candidate.desired_mp;
                candidate.heal_hp = candidate.desired_heal;
            }
            return;
        }

        for candidate in candidates.iter_mut() {
            candidate.allocated_mp =
                (available_mp * candidate.desired_mp / total_desired_mp).floor();
            candidate.heal_hp = max_affordable_manpower_heal(
                candidate.desired_heal,
                candidate.max_hp,
                candidate.unit_cost,
                candidate.allocated_mp,
            );
            candidate.allocated_mp =
                manpower_cost_for_heal(candidate.heal_hp, candidate.max_hp, candidate.unit_cost);
        }

        let used_mp = candidates.iter().fold(0.0, |sum, c| {
            sum + manpower_cost_for_heal(c.heal_hp, c.max_hp, c.unit_cost)
        });
        let mut remaining_mp = js_max(0.0, available_mp - used_mp);
        let ideal_mp = |c: &ReplenishmentCandidate| available_mp * c.desired_mp / total_desired_mp;

        while remaining_mp > 0.0 {
            let mut eligible: Vec<usize> = (0..candidates.len())
                .filter(|&i| candidates[i].heal_hp < candidates[i].desired_heal)
                .collect();
            stable_sort_by(&mut eligible, &|&a, &b| {
                let (ca, cb) = (&candidates[a], &candidates[b]);
                let gap_diff = (ideal_mp(cb) - cb.allocated_mp) - (ideal_mp(ca) - ca.allocated_mp);
                if gap_diff != 0.0 {
                    gap_diff
                } else {
                    f64::from(locale_compare(&ca.unit_id, &cb.unit_id))
                }
            });
            let mut advanced = false;
            for index in eligible {
                let candidate = &mut candidates[index];
                let next_cost = manpower_cost_for_heal(
                    candidate.heal_hp + 1.0,
                    candidate.max_hp,
                    candidate.unit_cost,
                );
                let incremental_cost = next_cost - candidate.allocated_mp;
                if incremental_cost <= remaining_mp {
                    candidate.heal_hp += 1.0;
                    candidate.allocated_mp = next_cost;
                    remaining_mp -= incremental_cost;
                    advanced = true;
                    break;
                }
            }
            if !advanced {
                break;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Tabela epok: ludnosc, pula, koszt
    // -----------------------------------------------------------------------

    /// Web `epokaManpowerRow` (`manpower.ts:479`): epoka obcieta do 1..10.
    pub fn epoka_manpower_row(epoka: f64) -> EpokaManpowerRow {
        let bounds = &manpower_params().epoka;
        let floored = epoka.floor();
        let base = if floored == 0.0 || floored.is_nan() {
            f64::from(bounds.min)
        } else {
            floored
        };
        let e = js_max(f64::from(bounds.min), js_min(f64::from(bounds.max), base));
        let rows = all_epoka_manpower_rows();
        rows.iter()
            .find(|row| row.epoka == e)
            .copied()
            .unwrap_or(rows[0])
    }

    /// Web `clampLudki` (`manpower.ts:484`).
    pub fn clamp_ludki(population: f64) -> f64 {
        let min = manpower_params().min_ludkow;
        let floored = population.floor();
        js_max(
            min,
            if floored == 0.0 || floored.is_nan() {
                min
            } else {
                floored
            },
        )
    }

    /// Web `cityLudnoscAbsolutna` (`manpower.ts:489`).
    pub fn city_ludnosc_absolutna(ludki: f64, epoka: f64) -> f64 {
        clamp_ludki(ludki) * epoka_manpower_row(epoka).ludek_na_ludka
    }

    /// Web `formatObywateleLabel` (`manpower.ts:495`).
    pub fn format_obywatele_label(count: f64) -> String {
        let format = &manpower_params().formatowanie;
        let n = js_max(0.0, count.floor());
        let word = if n == 1.0 {
            &format.obywatel_jeden
        } else {
            &format.obywatel_wiele
        };
        format!("{} {word}", js_number_to_string(n))
    }

    /// Web `scaledManpower` (`manpower.ts:440`).
    fn scaled_manpower(base: f64, max_mult: f64) -> f64 {
        (base
            * js_max(
                manpower_params().mnozniki_cywilizacji.skalowanie_min,
                max_mult,
            ))
        .floor()
    }

    /// Web `cityManpowerMax` (`manpower.ts:502`).
    pub fn city_manpower_max(ludki: f64, epoka: f64, max_mult: f64) -> f64 {
        let row = epoka_manpower_row(epoka);
        scaled_manpower(clamp_ludki(ludki) * row.manpower_na_ludka, max_mult)
    }

    /// Web `isScoutTypeId` (`manpower.ts:510`).
    pub fn is_scout_type_id(type_id: Option<&str>) -> bool {
        type_id == Some(manpower_params().scout_type_id.as_str())
    }

    /// Web `unitManpowerCost` (`manpower.ts:515`).
    pub fn unit_manpower_cost(epoka: f64, max_mult: f64) -> f64 {
        scaled_manpower(epoka_manpower_row(epoka).manpower_na_jednostke, max_mult)
    }

    /// Web `unitManpowerCostForType` (`manpower.ts:520`).
    pub fn unit_manpower_cost_for_type(type_id: Option<&str>, epoka: f64, max_mult: f64) -> f64 {
        if is_scout_type_id(type_id) {
            return 0.0;
        }
        unit_manpower_cost(epoka, max_mult)
    }

    /// Web `cityManpowerCurrent` (`manpower.ts:530`).
    pub fn city_manpower_current(city: &ManpowerCity, epoka: f64, max_mult: f64) -> f64 {
        let max = city_manpower_max(city.population, epoka, max_mult);
        match city.manpower {
            Some(manpower) if manpower.is_finite() => js_max(0.0, js_min(max, manpower.floor())),
            _ => max,
        }
    }

    // -----------------------------------------------------------------------
    // Pobor imperium
    // -----------------------------------------------------------------------

    /// Web `EmpirePoborTotals` (`manpower.ts:541`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct EmpirePoborTotals {
        pub suma_ludkow: f64,
        pub ludnosc_absolutna: f64,
        pub rekruci: f64,
        pub pobor_raw: f64,
    }

    /// Web `empireSumaLudkow` (`manpower.ts:548`).
    pub fn empire_suma_ludkow(cities: &[ManpowerCity], owner_id: i64) -> f64 {
        let mut suma = 0.0;
        for c in cities {
            if c.owner_id != owner_id {
                continue;
            }
            suma += clamp_ludki(c.population);
        }
        suma
    }

    /// Web `rekrutUnitEquivalents` (`manpower.ts:561`).
    pub fn rekrut_unit_equivalents(rekruci: f64, epoka: f64, max_mult: f64) -> f64 {
        let cost = unit_manpower_cost(epoka, max_mult);
        if cost <= 0.0 {
            return 0.0;
        }
        (js_max(0.0, rekruci) / cost).floor()
    }

    /// Web `empirePoborTotals` (`manpower.ts:567`).
    pub fn empire_pobor_totals(
        cities: &[ManpowerCity],
        owner_id: i64,
        epoka: f64,
        max_mult: f64,
    ) -> EmpirePoborTotals {
        let mut suma_ludkow = 0.0;
        let mut ludnosc_absolutna = 0.0;
        let mut rekruci = 0.0;
        for c in cities {
            if c.owner_id != owner_id {
                continue;
            }
            suma_ludkow += clamp_ludki(c.population);
            ludnosc_absolutna += city_ludnosc_absolutna(c.population, epoka);
            rekruci += city_manpower_current(c, epoka, max_mult);
        }
        EmpirePoborTotals {
            suma_ludkow,
            ludnosc_absolutna,
            rekruci,
            pobor_raw: ludnosc_absolutna + rekruci,
        }
    }

    /// Web `CityManpowerSnapshot` (`manpower.ts:37`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct CityManpowerSnapshot {
        pub epoka: f64,
        pub ludki: f64,
        pub ludnosc_absolutna: f64,
        pub manpower_max: f64,
        pub manpower_biezacy: f64,
        pub koszt_jednostki: f64,
        pub regen_per_turn: f64,
        pub werb_max_przy_pelnej_puli: f64,
    }

    /// Web `cityManpowerSnapshot` (`manpower.ts:585`).
    pub fn city_manpower_snapshot(
        city: &ManpowerCity,
        epoka: f64,
        regen_mult: f64,
        max_mult: f64,
    ) -> CityManpowerSnapshot {
        let ludki = clamp_ludki(city.population);
        let row = epoka_manpower_row(epoka);
        let ludnosc_absolutna = ludki * row.ludek_na_ludka;
        let manpower_max = scaled_manpower(ludki * row.manpower_na_ludka, max_mult);
        let koszt_jednostki = scaled_manpower(row.manpower_na_jednostke, max_mult);
        let manpower_biezacy = city_manpower_current(city, epoka, max_mult);
        let regen_params = load_manpower_regen_params(None);
        CityManpowerSnapshot {
            epoka: row.epoka,
            ludki,
            ludnosc_absolutna,
            manpower_max,
            manpower_biezacy,
            koszt_jednostki,
            regen_per_turn: manpower_regen_gain(ludki, epoka, &regen_params, regen_mult, max_mult),
            werb_max_przy_pelnej_puli: if koszt_jednostki > 0.0 {
                (manpower_biezacy / koszt_jednostki).floor()
            } else {
                0.0
            },
        }
    }

    /// Web `manpowerRegenGain` (`manpower.ts:445`).
    pub fn manpower_regen_gain(
        ludki: f64,
        epoka: f64,
        params: &ManpowerRegenParams,
        regen_mult: f64,
        max_mult: f64,
    ) -> f64 {
        let max = city_manpower_max(ludki, epoka, max_mult);
        if max <= 0.0 || params.regen_proc_max_per_turn <= 0.0 {
            return 0.0;
        }
        let cap = manpower_params().maks_proc;
        let pct = js_min(cap, params.regen_proc_max_per_turn) / cap;
        (max * pct * js_max(0.0, regen_mult)).floor()
    }

    /// Web `tickManpowerRegen` (`manpower.ts:462`): nowa wartosc puli miasta.
    pub fn tick_manpower_regen(
        city: &ManpowerCity,
        epoka: f64,
        params: &ManpowerRegenParams,
        regen_mult: f64,
        max_mult: f64,
    ) -> f64 {
        let max = city_manpower_max(city.population, epoka, max_mult);
        let cur = city_manpower_current(city, epoka, max_mult);
        if cur >= max {
            return max;
        }
        if params.block_when_besieged && city.oblegane == Some(true) {
            return cur;
        }
        let gain = manpower_regen_gain(city.population, epoka, params, regen_mult, max_mult);
        if gain <= 0.0 {
            return cur;
        }
        js_min(max, cur + gain)
    }

    /// Web `canAffordUnitManpower` (`manpower.ts:612`).
    pub fn can_afford_unit_manpower(
        city: &ManpowerCity,
        epoka: f64,
        max_mult: f64,
        type_id: Option<&str>,
    ) -> bool {
        let cost = unit_manpower_cost_for_type(type_id, epoka, max_mult);
        if cost <= 0.0 {
            return true;
        }
        city_manpower_current(city, epoka, max_mult) >= cost
    }

    /// Web `empireManpowerCurrent` (`manpower.ts:624`).
    pub fn empire_manpower_current(
        cities: &[ManpowerCity],
        owner_id: i64,
        epoka: f64,
        max_mult: f64,
    ) -> f64 {
        empire_pobor_totals(cities, owner_id, epoka, max_mult).rekruci
    }

    // -----------------------------------------------------------------------
    // Rekrutacja: odjecie i zwrot z puli imperium
    // -----------------------------------------------------------------------

    /// Indeksy miast wlasciciela posortowane komparatorem (web: `[...ownerCities].sort(...)`).
    fn sorted_owner_cities(
        cities: &[ManpowerCity],
        owner_id: i64,
        cmp: &dyn Fn(&ManpowerCity, &ManpowerCity) -> f64,
    ) -> Vec<usize> {
        let mut owned: Vec<usize> = (0..cities.len())
            .filter(|&i| cities[i].owner_id == owner_id)
            .collect();
        stable_sort_by(&mut owned, &|&a, &b| cmp(&cities[a], &cities[b]));
        owned
    }

    /// Web `deductManpowerFromEmpire` (`manpower.ts:636`). Mutuje `cities`.
    pub fn deduct_manpower_from_empire(
        cities: &mut [ManpowerCity],
        owner_id: i64,
        epoka: f64,
        amount: f64,
        max_mult: f64,
    ) -> bool {
        if amount <= 0.0 {
            return true;
        }
        if empire_manpower_current(cities, owner_id, epoka, max_mult) < amount {
            return false;
        }
        let mut remaining = amount;
        let order = sorted_owner_cities(cities, owner_id, &|a, b| {
            let cur_diff = city_manpower_current(b, epoka, max_mult)
                - city_manpower_current(a, epoka, max_mult);
            if cur_diff != 0.0 {
                cur_diff
            } else {
                f64::from(locale_compare(&a.id, &b.id))
            }
        });
        for index in order {
            if remaining <= 0.0 {
                break;
            }
            let cur = city_manpower_current(&cities[index], epoka, max_mult);
            let take = js_min(cur, remaining);
            if take > 0.0 {
                cities[index].manpower = Some(cur - take);
                remaining -= take;
            }
        }
        remaining <= 0.0
    }

    /// Web `refundManpowerToEmpire` (`manpower.ts:664`). Mutuje `cities`.
    pub fn refund_manpower_to_empire(
        cities: &mut [ManpowerCity],
        owner_id: i64,
        epoka: f64,
        amount: f64,
        max_mult: f64,
    ) {
        if amount <= 0.0 {
            return;
        }
        let mut remaining = amount;
        let room_of = |c: &ManpowerCity| {
            city_manpower_max(c.population, epoka, max_mult)
                - city_manpower_current(c, epoka, max_mult)
        };
        let order = sorted_owner_cities(cities, owner_id, &|a, b| {
            let room_diff = room_of(b) - room_of(a);
            if room_diff != 0.0 {
                room_diff
            } else {
                f64::from(locale_compare(&a.id, &b.id))
            }
        });
        for index in order {
            if remaining <= 0.0 {
                break;
            }
            let max = city_manpower_max(cities[index].population, epoka, max_mult);
            let cur = city_manpower_current(&cities[index], epoka, max_mult);
            let room = max - cur;
            if room <= 0.0 {
                continue;
            }
            let add = js_min(room, remaining);
            cities[index].manpower = Some(cur + add);
            remaining -= add;
        }
    }

    /// Web `canAffordUnitManpowerEmpire` (`manpower.ts:698`); `_recruiting_city`, `_pop_cost` jak w
    /// webie nieuzywane.
    pub fn can_afford_unit_manpower_empire(
        cities: &[ManpowerCity],
        owner_id: i64,
        _recruiting_city: &ManpowerCity,
        epoka: f64,
        _pop_cost: f64,
        max_mult: f64,
        type_id: Option<&str>,
    ) -> bool {
        let koszt_manpower = unit_manpower_cost_for_type(type_id, epoka, max_mult);
        if koszt_manpower <= 0.0 {
            return true;
        }
        empire_manpower_current(cities, owner_id, epoka, max_mult) >= koszt_manpower
    }

    /// Web `UnitSpawnBlockReason` (`manpower.ts:755`); napisy z `manpower-params.json`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum UnitSpawnBlockReason {
        BrakManpower,
        BrakLudnosci,
    }

    impl UnitSpawnBlockReason {
        pub fn as_str(self) -> &'static str {
            let reasons = &manpower_params().powody_blokady;
            match self {
                Self::BrakManpower => reasons.brak_manpower.as_str(),
                Self::BrakLudnosci => reasons.brak_ludnosci.as_str(),
            }
        }
    }

    /// Web `UnitSpawnDeduction` (`manpower.ts:757`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct UnitSpawnDeduction {
        pub ok: bool,
        pub population: f64,
        pub manpower: f64,
        pub koszt_manpower: f64,
        pub reason: Option<UnitSpawnBlockReason>,
    }

    /// Web `tryDeductUnitSpawnCostsEmpire` (`manpower.ts:713`). Mutuje `cities`.
    pub fn try_deduct_unit_spawn_costs_empire(
        cities: &mut [ManpowerCity],
        recruiting_city_id: &str,
        owner_id: i64,
        epoka: f64,
        _pop_cost: f64,
        max_mult: f64,
        type_id: Option<&str>,
    ) -> UnitSpawnDeduction {
        let recruiting = cities
            .iter()
            .position(|c| c.id == recruiting_city_id && c.owner_id == owner_id);
        let koszt_manpower = unit_manpower_cost_for_type(type_id, epoka, max_mult);
        let recruiting_mp = recruiting
            .map(|i| city_manpower_current(&cities[i], epoka, max_mult))
            .unwrap_or(0.0);
        let recruiting_pop = recruiting.map(|i| cities[i].population).unwrap_or(0.0);
        let Some(index) = recruiting else {
            return UnitSpawnDeduction {
                ok: false,
                population: 0.0,
                manpower: 0.0,
                koszt_manpower,
                reason: Some(UnitSpawnBlockReason::BrakManpower),
            };
        };
        if koszt_manpower > 0.0
            && !deduct_manpower_from_empire(cities, owner_id, epoka, koszt_manpower, max_mult)
        {
            return UnitSpawnDeduction {
                ok: false,
                population: recruiting_pop,
                manpower: recruiting_mp,
                koszt_manpower,
                reason: Some(UnitSpawnBlockReason::BrakManpower),
            };
        }

        UnitSpawnDeduction {
            ok: true,
            population: recruiting_pop,
            manpower: city_manpower_current(&cities[index], epoka, max_mult),
            koszt_manpower,
            reason: None,
        }
    }

    /// Web `tryDeductUnitSpawnCosts` (`manpower.ts:769`).
    pub fn try_deduct_unit_spawn_costs(
        city: &ManpowerCity,
        epoka: f64,
        pop_cost: f64,
        max_mult: f64,
        type_id: Option<&str>,
    ) -> UnitSpawnDeduction {
        let koszt_manpower = unit_manpower_cost_for_type(type_id, epoka, max_mult);
        let cur = city_manpower_current(city, epoka, max_mult);
        if cur < koszt_manpower {
            return UnitSpawnDeduction {
                ok: false,
                population: city.population,
                manpower: cur,
                koszt_manpower,
                reason: Some(UnitSpawnBlockReason::BrakManpower),
            };
        }
        if pop_cost > 0.0 && city.population <= pop_cost {
            return UnitSpawnDeduction {
                ok: false,
                population: city.population,
                manpower: cur,
                koszt_manpower,
                reason: Some(UnitSpawnBlockReason::BrakLudnosci),
            };
        }
        UnitSpawnDeduction {
            ok: true,
            population: city.population - pop_cost,
            manpower: cur - koszt_manpower,
            koszt_manpower,
            reason: None,
        }
    }

    /// Domyslny `popCost` weba w `refundUnitSpawnToCity` (`popCost = 1`, `manpower.ts:811`).
    pub fn default_refund_pop_cost() -> f64 {
        manpower_params().domyslny_zwrot_koszt_ludnosci
    }

    /// Web `refundUnitSpawnToCity` (`manpower.ts:808`): `(population, manpower)`.
    pub fn refund_unit_spawn_to_city(
        city: &ManpowerCity,
        epoka: f64,
        pop_cost: f64,
        pop_cap: Option<f64>,
        max_mult: f64,
        type_id: Option<&str>,
    ) -> (f64, f64) {
        let mp_refund = unit_manpower_cost_for_type(type_id, epoka, max_mult);
        let raw_pop = city.population + pop_cost;
        let population = match pop_cap {
            Some(cap) => js_min(cap, raw_pop),
            None => raw_pop,
        };
        let max = city_manpower_max(population, epoka, max_mult);
        let manpower = js_min(
            max,
            city_manpower_current(city, epoka, max_mult) + mp_refund,
        );
        (population, manpower)
    }

    /// Web `refreshManpowerAfterPopChange` (`manpower.ts:827`).
    pub fn refresh_manpower_after_pop_change(
        city: &ManpowerCity,
        epoka: f64,
        previous_pop: Option<f64>,
        max_mult: f64,
    ) -> f64 {
        let max = city_manpower_max(city.population, epoka, max_mult);
        let cur = city_manpower_current(city, epoka, max_mult);
        if let Some(previous) = previous_pop {
            if previous != city.population {
                let old_max = city_manpower_max(previous, epoka, max_mult);
                if city.population > previous {
                    return js_min(max, cur + (max - old_max));
                }
                return js_min(cur, max);
            }
        }
        max
    }

    /// Web `spendManpower` (`manpower.ts:846`): nowa wartosc puli (nie mutuje miasta).
    pub fn spend_manpower(
        city: &ManpowerCity,
        epoka: f64,
        amount: Option<f64>,
        max_mult: f64,
    ) -> f64 {
        let cost = amount.unwrap_or_else(|| unit_manpower_cost(epoka, max_mult));
        let cur = city_manpower_current(city, epoka, max_mult);
        js_max(0.0, cur - cost)
    }

    // -----------------------------------------------------------------------
    // Leczenie jednostek z puli imperium
    // -----------------------------------------------------------------------

    /// Web `onUnitHpChanged(unitId, hp, hpMax)` (`manpower.ts:287`).
    pub type HpChangedFn<'a> = dyn FnMut(&str, f64, f64) + 'a;

    /// Web `tickManpowerUnitReplenishment` (`manpower.ts:274`). Mutuje `cities` (pule) i `units`
    /// (`hp`, `hpMax`). Domkniecia jak w webie: `getMaxHp(typeId, unit)` (unit zawsze podany),
    /// `onUnitHpChanged(id, hp, hpMax)`.
    #[allow(clippy::too_many_arguments)]
    pub fn tick_manpower_unit_replenishment(
        cities: &mut [ManpowerCity],
        units: &mut [ManpowerHealUnit],
        difficulty: ManpowerDifficulty,
        resolve_owner_era: &dyn Fn(i64) -> f64,
        resolve_owner_bonusy: &dyn Fn(i64) -> Option<Vec<CivBonusPoborLite>>,
        get_max_hp: &dyn Fn(&str, &ManpowerHealUnit) -> f64,
        raw_miasto_params: Option<&MiastoManpowerRaw>,
        mut on_unit_hp_changed: Option<&mut HpChangedFn<'_>>,
    ) -> ManpowerReplenishResult {
        let params = load_manpower_replenish_params(difficulty, raw_miasto_params);
        if params.heal_pct_max_per_turn <= 0.0 || units.is_empty() {
            return ManpowerReplenishResult {
                healed_count: 0,
                total_mp_spent: 0.0,
            };
        }

        // Web `Map<number, ManpowerHealUnit[]>`: kolejnosc pierwszego wystapienia wlasciciela.
        let mut by_owner: Vec<(i64, Vec<usize>)> = Vec::new();
        for (index, u) in units.iter().enumerate() {
            if is_civilian_unit(&u.category, &u.type_id) {
                continue;
            }
            match by_owner.iter_mut().find(|(owner, _)| *owner == u.owner_id) {
                Some((_, list)) => list.push(index),
                None => by_owner.push((u.owner_id, vec![index])),
            }
        }

        let mut healed_count = 0;
        let mut total_mp_spent = 0.0;

        for (owner_id, owner_units) in by_owner {
            let epoka = resolve_owner_era(owner_id);
            let bonusy = resolve_owner_bonusy(owner_id);
            let max_mult = civ_manpower_max_mult(bonusy.as_deref());
            let mut empire_mp = empire_manpower_current(cities, owner_id, epoka, max_mult);
            if empire_mp <= 0.0 {
                continue;
            }

            let mut candidates: Vec<ReplenishmentCandidate> = Vec::new();
            for &index in &owner_units {
                if is_unit_in_besieged_location(
                    units[index].owner_id,
                    units[index].q,
                    units[index].r,
                    cities,
                ) {
                    continue;
                }

                let resolved_max_hp = get_max_hp(&units[index].type_id, &units[index]);
                let max_hp = if resolved_max_hp.is_finite() && resolved_max_hp > 0.0 {
                    resolved_max_hp
                } else {
                    match units[index].hp_max {
                        Some(hp_max) if hp_max.is_finite() => hp_max,
                        _ => 0.0,
                    }
                };
                if max_hp <= 0.0 {
                    continue;
                }
                units[index].hp_max = Some(max_hp);
                let cur_hp = match units[index].hp {
                    None => max_hp,
                    Some(hp) if hp.is_finite() => js_max(0.0, js_min(max_hp, hp)),
                    Some(_) => max_hp,
                };
                units[index].hp = Some(cur_hp);
                if cur_hp <= 0.0 || cur_hp >= max_hp {
                    continue;
                }

                let unit_cost = unit_manpower_cost_for_type(
                    Some(units[index].type_id.as_str()),
                    epoka,
                    max_mult,
                );
                if unit_cost <= 0.0 || is_scout_type_id(Some(units[index].type_id.as_str())) {
                    continue;
                }

                let desired_heal = manpower_heal_cap_for_turn(max_hp, cur_hp, &params);
                if desired_heal <= 0.0 {
                    continue;
                }

                let desired_mp = manpower_cost_for_heal(desired_heal, max_hp, unit_cost);
                if desired_mp <= 0.0 {
                    continue;
                }
                candidates.push(ReplenishmentCandidate {
                    unit: index,
                    unit_id: units[index].id.clone(),
                    max_hp,
                    cur_hp,
                    unit_cost,
                    desired_heal,
                    desired_mp,
                    allocated_mp: 0.0,
                    heal_hp: 0.0,
                });
            }

            allocate_proportional_replenishment(&mut candidates, empire_mp);
            for candidate in &candidates {
                let ReplenishmentCandidate {
                    unit,
                    max_hp,
                    cur_hp,
                    unit_cost,
                    heal_hp,
                    ..
                } = *candidate;
                if heal_hp <= 0.0 {
                    continue;
                }
                let mp_cost = manpower_cost_for_heal(heal_hp, max_hp, unit_cost);
                if mp_cost <= 0.0 {
                    continue;
                }
                if !deduct_manpower_from_empire(cities, owner_id, epoka, mp_cost, max_mult) {
                    continue;
                }

                empire_mp -= mp_cost;
                total_mp_spent += mp_cost;
                let new_hp = js_min(max_hp, cur_hp + heal_hp);
                units[unit].hp = Some(new_hp);
                if let Some(callback) = on_unit_hp_changed.as_mut() {
                    callback(&units[unit].id, new_hp, max_hp);
                }
                healed_count += 1;
            }
        }

        ManpowerReplenishResult {
            healed_count,
            total_mp_spent,
        }
    }

    // -----------------------------------------------------------------------
    // Formaty UI
    // -----------------------------------------------------------------------

    /// Web `formatPopulationAbs` (`manpower.ts:858`).
    pub fn format_population_abs(n: f64) -> String {
        let format = &manpower_params().formatowanie;
        if n >= format.prog_mln {
            let m = n / format.prog_mln;
            let shown = if m >= format.prog_calkowite_mln {
                js_round(m)
            } else {
                js_round(m * format.krok_dziesiatych) / format.krok_dziesiatych
            };
            return format!("{}{}", js_number_to_string(shown), format.sufiks_mln);
        }
        if n >= format.prog_tys {
            let t = n / format.prog_tys;
            let shown = if t >= format.prog_calkowite_tys {
                js_round(t)
            } else {
                js_round(t * format.krok_dziesiatych) / format.krok_dziesiatych
            };
            return format!("{}{}", js_number_to_string(shown), format.sufiks_tys);
        }
        js_number_to_string(n)
    }

    /// Web `formatManpower` (`manpower.ts:870`).
    pub fn format_manpower(n: f64) -> String {
        format_population_abs(n)
    }
}
