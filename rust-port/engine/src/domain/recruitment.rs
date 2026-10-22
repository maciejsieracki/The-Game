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
