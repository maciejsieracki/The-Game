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

/// P6.7B (R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1): port 1:1 `building-cost-tempo.ts`,
/// `building-stock-cost.ts` i `building-resource-gate.ts` (web, pin `edb8fb56`).
///
/// Liczby w tym module sa f64 jak w JS (`number`), a nie `u32` jak w typach powyzej: webowe
/// funkcje przyjmuja dowolne liczby (`NaN`, `Infinity`, ulamki), a wektory z uruchomionego weba
/// porownuje sie BITOWO. Wszystkie mnozniki, progi, etykiety i identyfikatory budynkow leza w
/// `data/derived/building-cost-params.json` (parser w `data/derived.rs`), nie w kodzie.
///
/// Zalozenia modelowe (opisane w `P6-7B-MIASTA-WZROST-B.md` §4):
/// * rekordy `Record<string, number>` to `BTreeMap<String, f64>` - kolejnosc kluczy nie jest
///   modelowana (kazdy klucz jest liczony niezaleznie, wynik porownuje sie jako mape);
/// * odpowiednik `StockCitySource` to cecha `StockCitySource` (implementowana dla `City` z P6.6B);
/// * wyszukiwania w obiektach JS po kluczu z lancucha prototypow (`constructor`, `__proto__`...)
///   nie sa odtwarzane (klucz spoza tabeli = brak wpisu).
pub mod p6_7b {
    use std::cmp::Ordering;
    use std::collections::BTreeMap;

    use crate::data::derived::{building_cost_params, nfd_strip_lookup, BuildingGatePrereqValue};
    use crate::domain::civ_matrix::js_compat::{js_math_round, js_max, js_min, js_trim};
    use crate::domain::terrain::city_founding::p6_6b::cities::City;

    /// Web `Record<string, number>` (koszty, zapasy, pule surowcow).
    pub type StockRecord = BTreeMap<String, f64>;

    // ---------------------------------------------------------------------------------------
    // Pomocniki semantyki JS
    // ---------------------------------------------------------------------------------------

    /// Porownanie napisow jak JS `<`/`>` (jednostki UTF-16, nie bajty UTF-8).
    fn js_str_cmp(a: &str, b: &str) -> Ordering {
        a.encode_utf16().cmp(b.encode_utf16())
    }

    /// Stabilne sortowanie jak `Array.prototype.sort` (ES2019+). Wstawianie zamiast `sort_by`
    /// z biblioteki: komparatory JS z `NaN` nie sa porzadkiem calkowitym, a `sort_by` moze na nich
    /// spanikowac; tutaj wynik zawsze istnieje, a dla spojnych komparatorow jest identyczny.
    fn js_stable_sort_by<T>(items: &mut [T], mut cmp: impl FnMut(&T, &T) -> Ordering) {
        for i in 1..items.len() {
            let mut j = i;
            while j > 0 && cmp(&items[j - 1], &items[j]) == Ordering::Greater {
                items.swap(j - 1, j);
                j -= 1;
            }
        }
    }

    /// Wynik komparatora JS `diff` (`NaN` oznacza remis; `0` zwraca `None` = rozstrzyga `id`).
    fn diff_ordering(diff: f64) -> Option<Ordering> {
        if diff.is_nan() {
            Some(Ordering::Equal)
        } else if diff < 0.0 {
            Some(Ordering::Less)
        } else if diff > 0.0 {
            Some(Ordering::Greater)
        } else {
            None
        }
    }

    /// `typeof v === 'number' && Number.isFinite(v) && v > 0`.
    fn is_positive_finite(v: f64) -> bool {
        v.is_finite() && v > 0.0
    }

    /// `String.prototype.normalize('NFD')` z wycieciem znakow laczacych: rozklad kanoniczny z tabeli
    /// `nfd-strip-table.json` (dane Unicode), algorytm Hangul i kanoniczne uporzadkowanie znakow
    /// laczacych (rangi z tej samej tabeli). Wersja Unicode tabeli = wersja Node z wektora (patrz dokument §4).
    fn nfd_strip(s: &str) -> String {
        let lookup = nfd_strip_lookup();
        let range = lookup.file.wycinany_zakres;
        let hangul = lookup.file.hangul;
        let syllable_count = hangul.l_count * hangul.v_count * hangul.t_count;
        let mut out = String::with_capacity(s.len());
        for c in s.chars() {
            let cp = u32::from(c);
            if (range.od..=range.do_).contains(&cp) {
                continue;
            }
            if (hangul.s_base..hangul.s_base + syllable_count).contains(&cp) {
                let index = cp - hangul.s_base;
                let t_index = index % hangul.t_count;
                let lead = hangul.l_base + index / (hangul.v_count * hangul.t_count);
                let vowel =
                    hangul.v_base + (index % (hangul.v_count * hangul.t_count)) / hangul.t_count;
                out.extend(char::from_u32(lead));
                out.extend(char::from_u32(vowel));
                if t_index != 0 {
                    out.extend(char::from_u32(hangul.t_base + t_index));
                }
                continue;
            }
            match lookup.by_code_point.get(&cp) {
                Some(replacement) => out.push_str(replacement),
                None => out.push(c),
            }
        }
        canonical_order(&out, &lookup.combining_rank)
    }

    /// Kanoniczne uporzadkowanie: w kazdym ciagu znakow laczacych (ccc != 0) stabilne sortowanie po randze.
    fn canonical_order(s: &str, rank: &std::collections::HashMap<u32, u32>) -> String {
        let chars: Vec<char> = s.chars().collect();
        let mut out = String::with_capacity(s.len());
        let mut i = 0;
        while i < chars.len() {
            if !rank.contains_key(&u32::from(chars[i])) {
                out.push(chars[i]);
                i += 1;
                continue;
            }
            let start = i;
            while i < chars.len() && rank.contains_key(&u32::from(chars[i])) {
                i += 1;
            }
            let mut run: Vec<char> = chars[start..i].to_vec();
            run.sort_by_key(|c| rank[&u32::from(*c)]);
            out.extend(run);
        }
        out
    }

    /// Web `stripDiacriticsLower`: NFD, usuniecie U+0300-U+036F, trim, male litery.
    fn strip_diacritics_lower(s: &str) -> String {
        js_trim(&nfd_strip(s)).to_lowercase()
    }

    // ---------------------------------------------------------------------------------------
    // building-cost-tempo.ts
    // ---------------------------------------------------------------------------------------

    /// Web `BuildingCostPace | number`: klucz tempa albo mnoznik liczbowy.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub enum PaceInput<'a> {
        Key(&'a str),
        Multiplier(f64),
    }

    /// Web `KOSZT_BUDYNKOW_PACE[pace]`; nieznany klucz daje `NaN` (`undefined` w mnozeniu).
    pub fn building_cost_pace_multiplier(pace: PaceInput<'_>) -> f64 {
        match pace {
            PaceInput::Multiplier(m) => m,
            PaceInput::Key(key) => building_cost_params()
                .tempo_kosztow_budynkow
                .iter()
                .find(|entry| entry.klucz == key)
                .map_or(f64::NAN, |entry| entry.mnoznik),
        }
    }

    /// Web `applyBuildingCostPace`: `Math.max(1, Math.round(bazowyKoszt * mnoznik))`.
    pub fn apply_building_cost_pace(base_cost: f64, pace: PaceInput<'_>) -> f64 {
        js_max(
            1.0,
            js_math_round(base_cost * building_cost_pace_multiplier(pace)),
        )
    }

    // ---------------------------------------------------------------------------------------
    // building-stock-cost.ts: mnozniki epok i koszty
    // ---------------------------------------------------------------------------------------

    /// Web `number | string | null | undefined` epoki: liczba, napis albo inna wartosc.
    #[derive(Debug, Clone, PartialEq)]
    pub enum EpochInput {
        Number(f64),
        Text(String),
        Other,
    }

    fn multiplier_for_ordinal(ordinal: f64) -> f64 {
        let eras = &building_cost_params().epoki;
        eras.progi
            .iter()
            .find(|threshold| ordinal >= threshold.min_epoka)
            .map_or(eras.domyslny_mnoznik, |threshold| threshold.mnoznik)
    }

    /// Regex `^\d+(?:\.\d+)?$` (cyfry ASCII).
    fn is_decimal_literal(text: &str) -> bool {
        let all_digits = |part: &str| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit());
        match text.split_once('.') {
            Some((int_part, frac_part)) => all_digits(int_part) && all_digits(frac_part),
            None => all_digits(text),
        }
    }

    /// Web `epochCostMultiplier`.
    pub fn epoch_cost_multiplier(epoch: &EpochInput) -> f64 {
        let eras = &building_cost_params().epoki;
        match epoch {
            EpochInput::Number(n) if n.is_finite() => multiplier_for_ordinal(n.floor()),
            EpochInput::Number(_) | EpochInput::Other => eras.domyslny_mnoznik,
            EpochInput::Text(text) => {
                let normalized = strip_diacritics_lower(text);
                if is_decimal_literal(&normalized) {
                    let value = normalized.parse::<f64>().unwrap_or(f64::NAN);
                    return epoch_cost_multiplier(&EpochInput::Number(value));
                }
                eras.slowa
                    .iter()
                    .find(|group| group.slowa.contains(&normalized))
                    .map_or(eras.domyslny_mnoznik, |group| group.mnoznik)
            }
        }
    }

    /// Web `scaleCostByEpoch`: zachowuje zero i zle wejscia (zwraca 0).
    pub fn scale_cost_by_epoch(cost: f64, epoch: &EpochInput) -> f64 {
        if !cost.is_finite() || cost < 0.0 {
            return 0.0;
        }
        if cost == 0.0 {
            return 0.0;
        }
        js_max(1.0, js_math_round(cost * epoch_cost_multiplier(epoch)))
    }

    /// Web `buildingEraCostMultiplier(epokaWejscia?)`.
    pub fn building_era_cost_multiplier(epoka_wejscia: Option<f64>) -> f64 {
        let era = match epoka_wejscia {
            Some(n) if n.is_finite() => n.floor(),
            _ => building_cost_params().epoki.domyslna_epoka_wejscia_budynku,
        };
        multiplier_for_ordinal(era)
    }

    /// Wejscie z `r-stawki-strojenie.ts` `scaleStockCostRecord` (FALA2): wartosci spoza
    /// `typeof number && isFinite && > 0` sa pomijane (`None` = nie-liczba).
    pub fn scale_stock_cost_record(raw: Option<&BTreeMap<String, Option<f64>>>) -> StockRecord {
        let fala2 = building_cost_params()
            .wejscia_z_innych_modulow_weba
            .r_stawki_fala2_mnoznik;
        let mut out = StockRecord::new();
        if let Some(raw) = raw {
            for (key, value) in raw {
                if let Some(v) = value.filter(|v| is_positive_finite(*v)) {
                    out.insert(key.clone(), js_max(1.0, js_math_round(v * fala2)));
                }
            }
        }
        out
    }

    /// Web `{ epokaWejscia?, koszt_surowce? }` budynku dla `buildingStockCost`.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct BuildingStockSource {
        pub epoka_wejscia: Option<f64>,
        pub koszt_surowce: Option<BTreeMap<String, Option<f64>>>,
    }

    /// Web `buildingStockCost`: FALA2, potem dokladnie jeden mnoznik ery.
    pub fn building_stock_cost(building: Option<&BuildingStockSource>) -> StockRecord {
        let fala2_cost = scale_stock_cost_record(building.and_then(|b| b.koszt_surowce.as_ref()));
        let era_multiplier = building_era_cost_multiplier(building.and_then(|b| b.epoka_wejscia));
        if era_multiplier == 1.0 {
            return fala2_cost;
        }
        fala2_cost
            .into_iter()
            .map(|(key, amount)| (key, js_max(1.0, js_math_round(amount * era_multiplier))))
            .collect()
    }

    /// Web `missingStockFor`: ile brakuje w puli dla kazdego surowca kosztu.
    pub fn missing_stock_for(
        city_surowce: Option<&StockRecord>,
        cost: &StockRecord,
    ) -> StockRecord {
        let mut missing = StockRecord::new();
        for (key, need) in cost {
            let have = city_surowce
                .and_then(|m| m.get(key))
                .copied()
                .unwrap_or(0.0);
            let brak = need - have;
            if brak > 0.0 {
                missing.insert(key.clone(), brak);
            }
        }
        missing
    }

    /// Web `canAffordBuildingStock`.
    pub fn can_afford_building_stock(
        city_surowce: Option<&StockRecord>,
        cost: &StockRecord,
    ) -> bool {
        for (key, need) in cost {
            let have = city_surowce
                .and_then(|m| m.get(key))
                .copied()
                .unwrap_or(0.0);
            if have < *need {
                return false;
            }
        }
        true
    }

    /// Web `deductBuildingStockCost`: nowy rekord, zapas nie spada ponizej 0.
    pub fn deduct_building_stock_cost(
        city_surowce: Option<&StockRecord>,
        cost: &StockRecord,
    ) -> StockRecord {
        let mut next = city_surowce.cloned().unwrap_or_default();
        for (key, need) in cost {
            let have = next.get(key).copied().unwrap_or(0.0);
            next.insert(key.clone(), js_max(0.0, have - need));
        }
        next
    }

    // ---------------------------------------------------------------------------------------
    // building-stock-cost.ts: etykiety
    // ---------------------------------------------------------------------------------------

    /// Web `STOCK_RESOURCE_LABEL` jako pary (klucz, etykieta) w kolejnosci pliku.
    pub fn stock_resource_labels() -> Vec<(&'static str, &'static str)> {
        building_cost_params()
            .magazyn
            .etykiety
            .iter()
            .map(|e| (e.klucz.as_str(), e.etykieta.as_str()))
            .collect()
    }

    /// Web `EMPIRE_STOCK_RESOURCE_KEYS`.
    pub fn empire_stock_resource_keys() -> &'static [String] {
        &building_cost_params().magazyn.klucze_magazynu_panstwa
    }

    /// Web `stockResourceLabel(key)`: etykieta PL albo sam klucz.
    pub fn stock_resource_label(key: &str) -> String {
        building_cost_params()
            .magazyn
            .etykiety
            .iter()
            .find(|e| e.klucz == key)
            .map_or_else(|| key.to_owned(), |e| e.etykieta.clone())
    }

    // ---------------------------------------------------------------------------------------
    // building-stock-cost.ts: pula panstwa (miasta wlasciciela)
    // ---------------------------------------------------------------------------------------

    /// Web `StockCitySource`: minimalny ksztalt miasta potrzebny do puli wlasciciela.
    pub trait StockCitySource {
        fn id(&self) -> &str;
        fn owner_id(&self) -> i64;
        fn surowce(&self) -> Option<&StockRecord>;
        fn surowce_mut(&mut self) -> &mut Option<StockRecord>;
    }

    impl StockCitySource for City {
        fn id(&self) -> &str {
            &self.id
        }
        fn owner_id(&self) -> i64 {
            self.owner_id
        }
        fn surowce(&self) -> Option<&StockRecord> {
            self.surowce.as_ref()
        }
        fn surowce_mut(&mut self) -> &mut Option<StockRecord> {
            &mut self.surowce
        }
    }

    /// Najprostsza realizacja `StockCitySource` (web `{ id, ownerId, surowce? }`).
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct StockCity {
        pub id: String,
        pub owner_id: i64,
        pub surowce: Option<StockRecord>,
    }

    impl StockCitySource for StockCity {
        fn id(&self) -> &str {
            &self.id
        }
        fn owner_id(&self) -> i64 {
            self.owner_id
        }
        fn surowce(&self) -> Option<&StockRecord> {
            self.surowce.as_ref()
        }
        fn surowce_mut(&mut self) -> &mut Option<StockRecord> {
            &mut self.surowce
        }
    }

    fn city_stock<T: StockCitySource>(city: &T, key: &str) -> f64 {
        city.surowce()
            .and_then(|m| m.get(key))
            .copied()
            .unwrap_or(0.0)
    }

    /// Web `ownerResourceStockAll`: suma `City.surowce` po miastach wlasciciela.
    pub fn owner_resource_stock_all<T: StockCitySource>(
        cities: &[T],
        owner_id: i64,
    ) -> StockRecord {
        let mut pool = StockRecord::new();
        for city in cities {
            if city.owner_id() != owner_id {
                continue;
            }
            let Some(surowce) = city.surowce() else {
                continue;
            };
            for (key, value) in surowce {
                if value.is_finite() {
                    let current = pool.get(key).copied().unwrap_or(0.0);
                    pool.insert(key.clone(), current + value);
                }
            }
        }
        pool
    }

    /// Web `ownerResourceStock`: zapas wlasciciela dla jednego typu surowca.
    pub fn owner_resource_stock<T: StockCitySource>(cities: &[T], owner_id: i64, key: &str) -> f64 {
        let mut total = 0.0;
        for city in cities {
            if city.owner_id() != owner_id {
                continue;
            }
            total += city_stock(city, key);
        }
        total
    }

    /// Web `refundBuildingStockCostAcrossCities`: zwrot kosztu do puli (bez capu).
    pub fn refund_building_stock_cost_across_cities<T: StockCitySource>(
        cities: &mut [T],
        owner_id: i64,
        cost: &StockRecord,
    ) {
        for (key, amount) in cost {
            if is_positive_finite(*amount) {
                credit_owner_resource_stock(cities, owner_id, key, *amount, None);
            }
        }
    }

    /// Web `deductBuildingStockCostAcrossCities`: pobor najpierw z miast o najwiekszym zapasie
    /// (stabilnie malejaco, remis rozstrzyga `id` rosnaco).
    pub fn deduct_building_stock_cost_across_cities<T: StockCitySource>(
        cities: &mut [T],
        owner_id: i64,
        cost: &StockRecord,
    ) {
        for (key, need_raw) in cost {
            let mut need = *need_raw;
            if need.is_nan() || need <= 0.0 {
                continue;
            }
            let mut holders: Vec<usize> = (0..cities.len())
                .filter(|&i| cities[i].owner_id() == owner_id && city_stock(&cities[i], key) > 0.0)
                .collect();
            js_stable_sort_by(&mut holders, |&a, &b| {
                let diff = city_stock(&cities[b], key) - city_stock(&cities[a], key);
                diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[a].id(), cities[b].id()))
            });
            for index in holders {
                if need <= 0.0 {
                    break;
                }
                let have = city_stock(&cities[index], key);
                let take = have.min(need);
                cities[index]
                    .surowce_mut()
                    .get_or_insert_with(StockRecord::new)
                    .insert(key.clone(), have - take);
                need -= take;
            }
        }
    }

    /// Web `creditOwnerResourceStock`: dodatek trafia do miasta o najmniejszym zapasie tego
    /// typu (stabilnie rosnaco, remis po `id`); opcjonalny cap sumy wlasciciela.
    pub fn credit_owner_resource_stock<T: StockCitySource>(
        cities: &mut [T],
        owner_id: i64,
        key: &str,
        amount: f64,
        cap_per_type: Option<f64>,
    ) -> f64 {
        if !amount.is_finite() || amount <= 0.0 {
            return 0.0;
        }
        let mut owner_cities: Vec<usize> = (0..cities.len())
            .filter(|&i| cities[i].owner_id() == owner_id)
            .collect();
        if owner_cities.is_empty() {
            return 0.0;
        }

        let mut to_add = amount;
        if let Some(cap) = cap_per_type.filter(|cap| cap.is_finite()) {
            let current = owner_resource_stock(cities, owner_id, key);
            to_add = js_max(0.0, js_min(to_add, cap - current));
        }
        if to_add <= 0.0 {
            return 0.0;
        }

        js_stable_sort_by(&mut owner_cities, |&a, &b| {
            let diff = city_stock(&cities[a], key) - city_stock(&cities[b], key);
            diff_ordering(diff).unwrap_or_else(|| js_str_cmp(cities[a].id(), cities[b].id()))
        });
        let target = owner_cities[0];
        let surowce = cities[target]
            .surowce_mut()
            .get_or_insert_with(StockRecord::new);
        let current = surowce.get(key).copied().unwrap_or(0.0);
        surowce.insert(key.to_owned(), current + to_add);
        to_add
    }

    /// Web `assignOwnerResourceStockFromPool`: zeruje zapasy wlasciciela i rozdziela pule.
    pub fn assign_owner_resource_stock_from_pool<T: StockCitySource>(
        cities: &mut [T],
        owner_id: i64,
        pool: &StockRecord,
    ) {
        for city in cities.iter_mut() {
            if city.owner_id() != owner_id {
                continue;
            }
            if let Some(surowce) = city.surowce_mut() {
                surowce.clear();
            }
        }
        for (key, amount) in pool {
            if is_positive_finite(*amount) {
                credit_owner_resource_stock(cities, owner_id, key, *amount, None);
            }
        }
    }

    // ---------------------------------------------------------------------------------------
    // building-stock-cost.ts: koszt surowcowy jednostek
    // ---------------------------------------------------------------------------------------

    /// Web `MOUNT_UNIT_HORSE_STOCK_COST`.
    pub fn mount_unit_horse_stock_cost() -> f64 {
        f64::from(building_cost_params().jednostki.kon_koszt_bazowy)
    }

    /// Web `MOUNT_UNIT_HORSE_STOCK_KEY`.
    pub fn mount_unit_horse_stock_key() -> &'static str {
        &building_cost_params().jednostki.kon_klucz
    }

    /// Web `MOUNT_HORSE_EXEMPT_UNIT`.
    pub fn mount_horse_exempt_unit() -> &'static str {
        &building_cost_params().jednostki.wyjatek_kon_jednostka
    }

    /// Web `UnitStockCostSource` (units.json: `Jednostka`, `Typ`, `Epoka`, `Surowiec`,
    /// `Surowiec (ilość)`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct UnitStockCostSource {
        pub jednostka: Option<String>,
        pub typ: Option<String>,
        pub epoka: EpochInput,
        pub surowiec: Option<String>,
        pub surowiec_ilosc: Option<f64>,
    }

    /// Web `unitRequiresMountHorseStock`: `Typ == Mount`, z wyjatkiem rydwanu na wolach.
    pub fn unit_requires_mount_horse_stock(unit: Option<&UnitStockCostSource>) -> bool {
        let Some(unit) = unit else {
            return false;
        };
        let params = &building_cost_params().jednostki;
        if js_trim(unit.typ.as_deref().unwrap_or("")) != params.typ_jezdny {
            return false;
        }
        js_trim(unit.jednostka.as_deref().unwrap_or("")) != params.wyjatek_kon_jednostka
    }

    /// Web `unitStockCost`: koszt surowcowy jednostki (klucz ASCII) plus kon dla jezdnych.
    pub fn unit_stock_cost(unit: Option<&UnitStockCostSource>) -> StockRecord {
        let mut out = StockRecord::new();
        let Some(unit) = unit else {
            return out;
        };
        let params = &building_cost_params().jednostki;
        let raw_name = js_trim(unit.surowiec.as_deref().unwrap_or(""));
        if !raw_name.is_empty() && raw_name != params.znacznik_braku_surowca {
            if let Some(ilosc) = unit.surowiec_ilosc.filter(|v| is_positive_finite(*v)) {
                let key = strip_diacritics_lower(raw_name);
                if !key.is_empty() {
                    out.insert(key, scale_cost_by_epoch(ilosc, &unit.epoka));
                }
            }
        }
        if unit_requires_mount_horse_stock(Some(unit)) {
            let current = out.get(&params.kon_klucz).copied().unwrap_or(0.0);
            out.insert(
                params.kon_klucz.clone(),
                current + scale_cost_by_epoch(mount_unit_horse_stock_cost(), &unit.epoka),
            );
        }
        out
    }

    // ---------------------------------------------------------------------------------------
    // building-resource-gate.ts: wejscia z zloto-access.ts (poza zakresem; stale z tabeli)
    // ---------------------------------------------------------------------------------------

    /// Web `zloto-access.ts` `empireZlotoStock`: zapas Zlota w puli (nie-skonczony lub <= 0 => 0).
    fn empire_zloto_stock(empire_stock: Option<&StockRecord>) -> f64 {
        let key = &building_cost_params()
            .wejscia_z_innych_modulow_weba
            .zloto_stock_klucz;
        empire_stock
            .and_then(|m| m.get(key))
            .copied()
            .filter(|v| is_positive_finite(*v))
            .unwrap_or(0.0)
    }

    /// Web `zloto-access.ts` `ownerCanFeedMennica(empireStock, graceActive)`.
    pub fn owner_can_feed_mennica(empire_stock: Option<&StockRecord>, grace_active: bool) -> bool {
        if grace_active {
            return true;
        }
        empire_zloto_stock(empire_stock)
            >= building_cost_params()
                .wejscia_z_innych_modulow_weba
                .mennica_zloto_drain_na_ture
    }

    /// Web `MENNICA_ZLOTO_DRAIN_PER_TURN` (re-eksport w `building-resource-gate.ts`).
    pub fn mennica_zloto_drain_per_turn() -> f64 {
        building_cost_params()
            .wejscia_z_innych_modulow_weba
            .mennica_zloto_drain_na_ture
    }

    // ---------------------------------------------------------------------------------------
    // building-resource-gate.ts: etykiety, zloza, prerekwizyty
    // ---------------------------------------------------------------------------------------

    /// Web `LABEL_BY_ASCII[key]` (klucz ASCII -> etykieta PL).
    fn label_by_ascii(key: &str) -> Option<&'static str> {
        building_cost_params()
            .bramka
            .etykiety_ascii
            .iter()
            .find(|e| e.klucz == key)
            .map(|e| e.etykieta.as_str())
    }

    /// Web `ASCII_BY_LABEL[label]` (`Object.fromEntries`: przy powtorzonej etykiecie wygrywa ostatni).
    fn ascii_by_label(label: &str) -> Option<&'static str> {
        building_cost_params()
            .bramka
            .etykiety_ascii
            .iter()
            .rev()
            .find(|e| e.etykieta == label)
            .map(|e| e.klucz.as_str())
    }

    /// Web `CITY_BUILDING_PREREQ[id]`.
    pub fn city_building_prereq(building_id: &str) -> Option<&'static BuildingGatePrereqValue> {
        building_cost_params()
            .bramka
            .prerekwizyty_miasta
            .iter()
            .find(|e| e.budynek == building_id)
            .map(|e| &e.wymaga)
    }

    /// Web `WATER_ACCESS_BUILDING_IDS.has(id)`.
    pub fn is_water_access_building(building_id: &str) -> bool {
        building_cost_params()
            .bramka
            .dostep_wodny
            .iter()
            .any(|id| id == building_id)
    }

    /// Minimalny ksztalt budynku w `cityBuildingPrereqMet` (`{ id, upgradeFrom? }`).
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct PrereqBuilding {
        pub id: String,
        pub upgrade_from: Option<String>,
    }

    /// Wstrzykniete domkniecie `isBuildingSupersededByUpgrade` (production.ts, poza zakresem).
    pub type SupersededFn<'a> = dyn Fn(&str, &[String], &[PrereqBuilding]) -> bool + 'a;

    /// Web `cityBuildingPrereqMet`: dowolny z id prerekwizytu wystarcza (OR); brak/pusty napis = spelnione.
    pub fn city_building_prereq_met(
        prereq: Option<&BuildingGatePrereqValue>,
        built_list: &[String],
        buildings: &[PrereqBuilding],
        is_superseded: &SupersededFn<'_>,
    ) -> bool {
        let ids: Vec<&String> = match prereq {
            None => return true,
            Some(BuildingGatePrereqValue::One(id)) if id.is_empty() => return true,
            Some(BuildingGatePrereqValue::One(id)) => vec![id],
            Some(BuildingGatePrereqValue::Many(ids)) => ids.iter().collect(),
        };
        ids.into_iter()
            .any(|id| built_list.contains(id) || is_superseded(id, built_list, buildings))
    }

    /// Ksztalt budynku dla bramek: `Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec? }`.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct GateBuilding {
        pub id: String,
        pub epoka_wejscia: Option<f64>,
        pub wymagany_surowiec: Option<String>,
    }

    /// Web `ACCESS_ONLY_RESOURCE_LABELS` (deprecated, pusty zbior).
    pub fn access_only_resource_labels() -> Vec<String> {
        Vec::new()
    }

    /// Web `isAccessOnlyResourceLabel` (deprecated, zawsze `false`).
    pub fn is_access_only_resource_label(_label: &str) -> bool {
        false
    }

    /// Web `empireLabelSatisfied` / `empireLabelSatisfiedAtRuntime` (dwie kopie w webie, ta sama tresc).
    fn label_satisfied(
        label: &str,
        built_ids: Option<&[String]>,
        empire_stock: Option<&StockRecord>,
    ) -> bool {
        let params = &building_cost_params().bramka;
        for converter in &params.konwertery {
            if label == converter.etykieta
                && built_ids.is_some_and(|ids| ids.contains(&converter.budynek))
            {
                return true;
            }
        }
        if let Some(ascii_key) = ascii_by_label(label).filter(|key| !key.is_empty()) {
            if let Some(stock) = empire_stock {
                if stock.get(ascii_key).copied().unwrap_or(0.0) > 0.0 {
                    return true;
                }
            }
        }
        false
    }

    /// Web `empireResourceLabelSatisfied` (argumenty `_activeLabels` i `_buildingId` nieuzywane).
    pub fn empire_resource_label_satisfied(
        label: &str,
        _active_labels: Option<&[String]>,
        empire_built_ids: Option<&[String]>,
        empire_stock: Option<&StockRecord>,
        _building_id: Option<&str>,
    ) -> bool {
        label_satisfied(label, empire_built_ids, empire_stock)
    }

    /// Web `buildingRequiredActiveLabels`: etykiety twarde budynku + `wymaganySurowiec` (bez duplikatow).
    pub fn building_required_active_labels(building: &GateBuilding) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        let mut add = |label: &str| {
            if !out.iter().any(|l| l == label) {
                out.push(label.to_owned());
            }
        };
        if let Some(hard) = building_cost_params()
            .bramka
            .zloza_budynkow
            .iter()
            .find(|d| d.budynek == building.id)
        {
            hard.etykiety.iter().for_each(|l| add(l));
        }
        let key = js_trim(building.wymagany_surowiec.as_deref().unwrap_or("")).to_lowercase();
        if !key.is_empty() {
            if let Some(label) = label_by_ascii(&key) {
                add(label);
            }
        }
        out
    }

    /// Web `buildingResourceGateMet`: bramka zapasu przy budowie (magazyn panstwa / konwerter).
    pub fn building_resource_gate_met(
        building: &GateBuilding,
        _active_labels: Option<&[String]>,
        empire_built_ids: Option<&[String]>,
        empire_stock: Option<&StockRecord>,
    ) -> bool {
        building_required_active_labels(building)
            .iter()
            .all(|label| label_satisfied(label, empire_built_ids, empire_stock))
    }

    /// Web `DEPOSIT_RUNTIME_GATED_BUILDING_IDS`.
    pub fn deposit_runtime_gated_building_ids() -> Vec<&'static str> {
        building_cost_params()
            .bramka
            .zloza_budynkow
            .iter()
            .map(|d| d.budynek.as_str())
            .collect()
    }

    /// Web `hasDepositRuntimeGate`: Spichlerz I/II wylaczone (bonusy z drain).
    pub fn has_deposit_runtime_gate(building_id: &str) -> bool {
        let params = building_cost_params();
        if params
            .spichlerz
            .wykluczone_z_bramki_runtime
            .iter()
            .any(|id| id == building_id)
        {
            return false;
        }
        params
            .bramka
            .zloza_budynkow
            .iter()
            .any(|d| d.budynek == building_id)
    }

    /// Web `BuildingRuntimeGateOptions`.
    #[derive(Clone, Copy, Default)]
    pub struct BuildingRuntimeGateOptions<'a> {
        pub owner_id: Option<i64>,
        pub resolve_owner_zloto_access: Option<&'a dyn Fn(i64) -> bool>,
    }

    /// Web `mennicaRuntimeGateMet`.
    fn mennica_runtime_gate_met(
        empire_stock: Option<&StockRecord>,
        options: Option<&BuildingRuntimeGateOptions<'_>>,
    ) -> bool {
        if let Some(options) = options {
            if let (Some(resolve), Some(owner_id)) =
                (options.resolve_owner_zloto_access, options.owner_id)
            {
                return resolve(owner_id);
            }
        }
        owner_can_feed_mennica(empire_stock, false)
    }

    fn is_mennica(building_id: &str) -> bool {
        building_id == building_cost_params().bramka.mennica_budynek
    }

    /// Web `buildingRuntimeGateMet`: bramka co ture (magazyn panstwa / konwerter / Mennica).
    pub fn building_runtime_gate_met(
        building: &GateBuilding,
        _active_labels: Option<&[String]>,
        runtime_active_built_ids: &[String],
        empire_stock: Option<&StockRecord>,
        options: Option<&BuildingRuntimeGateOptions<'_>>,
    ) -> bool {
        if is_mennica(&building.id) {
            return mennica_runtime_gate_met(empire_stock, options);
        }
        building_required_active_labels(building)
            .iter()
            .all(|label| label_satisfied(label, Some(runtime_active_built_ids), empire_stock))
    }

    /// Web `filterRuntimeActiveBuiltIds`: punkt staly (Ceramika/Cegla zaleza od aktywnej Garncarni/Cegielni).
    pub fn filter_runtime_active_built_ids(
        built_ids: &[String],
        active_labels: &[String],
        empire_stock: Option<&StockRecord>,
        options: Option<&BuildingRuntimeGateOptions<'_>>,
    ) -> Vec<String> {
        let mut active: Vec<String> = Vec::new();
        let mut changed = true;
        while changed {
            changed = false;
            for id in built_ids {
                if active.contains(id) {
                    continue;
                }
                if !has_deposit_runtime_gate(id) {
                    active.push(id.clone());
                    changed = true;
                    continue;
                }
                let building = GateBuilding {
                    id: id.clone(),
                    epoka_wejscia: Some(1.0),
                    wymagany_surowiec: None,
                };
                if building_runtime_gate_met(
                    &building,
                    Some(active_labels),
                    &active,
                    empire_stock,
                    options,
                ) {
                    active.push(id.clone());
                    changed = true;
                }
            }
        }
        active
    }

    // ---------------------------------------------------------------------------------------
    // building-resource-gate.ts: Spichlerz
    // ---------------------------------------------------------------------------------------

    /// Web `SpichlerzDrainPayResult`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct SpichlerzDrainPayResult {
        pub ceramika_paid: bool,
        pub sol_paid: bool,
    }

    /// Web `SpichlerzCityBonusState`.
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct SpichlerzCityBonusState {
        pub ceramika_active: bool,
        pub sol_active: bool,
        pub ma_spichlerz_pop: bool,
        pub ma_spichlerz_ii_pop: bool,
    }

    /// Web `SPICHLERZ_DRAIN_CERAMIKA_PER_TURN`.
    pub fn spichlerz_drain_ceramika_per_turn() -> f64 {
        building_cost_params().spichlerz.drain_ceramika_na_ture
    }

    /// Web `SPICHLERZ_DRAIN_SOL_PER_TURN`.
    pub fn spichlerz_drain_sol_per_turn() -> f64 {
        building_cost_params().spichlerz.drain_sol_na_ture
    }

    /// Web `SPICHLERZ_EMPIRE_CAP_I`.
    pub fn spichlerz_empire_cap_i() -> f64 {
        building_cost_params().spichlerz.cap_imperium_i
    }

    /// Web `SPICHLERZ_EMPIRE_CAP_II_FULL`.
    pub fn spichlerz_empire_cap_ii_full() -> f64 {
        building_cost_params().spichlerz.cap_imperium_ii_pelny
    }

    /// Web `cityHasSpichlerzBuilding`: Spichlerz I lub II (sam fakt posiadania).
    pub fn city_has_spichlerz_building(built_ids: &[String]) -> bool {
        let params = &building_cost_params().spichlerz;
        built_ids
            .iter()
            .any(|id| *id == params.budynek_i || *id == params.budynek_ii)
    }

    /// Web `paySpichlerzDrainForCity`: drain Ceramiki (I i II) i Soli (tylko II) z puli wlasciciela.
    /// `dry_run = true` tylko sprawdza zapas, bez mutacji miast.
    pub fn pay_spichlerz_drain_for_city<T: StockCitySource>(
        cities: &mut [T],
        owner_id: i64,
        built_ids: &[String],
        dry_run: bool,
    ) -> SpichlerzDrainPayResult {
        let params = &building_cost_params().spichlerz;
        let has_i = built_ids.contains(&params.budynek_i);
        let has_ii = built_ids.contains(&params.budynek_ii);
        if !has_i && !has_ii {
            return SpichlerzDrainPayResult {
                ceramika_paid: false,
                sol_paid: false,
            };
        }

        let mut ceramika_paid = false;
        let mut sol_paid = false;

        if owner_resource_stock(cities, owner_id, &params.klucz_ceramika)
            >= params.drain_ceramika_na_ture
        {
            if !dry_run {
                let cost = StockRecord::from([(
                    params.klucz_ceramika.clone(),
                    params.drain_ceramika_na_ture,
                )]);
                deduct_building_stock_cost_across_cities(cities, owner_id, &cost);
            }
            ceramika_paid = true;
        }

        if has_ii
            && owner_resource_stock(cities, owner_id, &params.klucz_sol) >= params.drain_sol_na_ture
        {
            if !dry_run {
                let cost =
                    StockRecord::from([(params.klucz_sol.clone(), params.drain_sol_na_ture)]);
                deduct_building_stock_cost_across_cities(cities, owner_id, &cost);
            }
            sol_paid = true;
        }

        SpichlerzDrainPayResult {
            ceramika_paid,
            sol_paid,
        }
    }

    /// Wersja `paySpichlerzDrainForCity(..., dryRun = true)` dla miast tylko do odczytu
    /// (`readonly StockCitySource[]` w `resolveOwnedBuildingInactiveStatus`).
    pub fn spichlerz_drain_dry_run<T: StockCitySource>(
        cities: &[T],
        owner_id: i64,
        built_ids: &[String],
    ) -> SpichlerzDrainPayResult {
        let params = &building_cost_params().spichlerz;
        let has_i = built_ids.contains(&params.budynek_i);
        let has_ii = built_ids.contains(&params.budynek_ii);
        if !has_i && !has_ii {
            return SpichlerzDrainPayResult {
                ceramika_paid: false,
                sol_paid: false,
            };
        }
        SpichlerzDrainPayResult {
            ceramika_paid: owner_resource_stock(cities, owner_id, &params.klucz_ceramika)
                >= params.drain_ceramika_na_ture,
            sol_paid: has_ii
                && owner_resource_stock(cities, owner_id, &params.klucz_sol)
                    >= params.drain_sol_na_ture,
        }
    }

    /// Web `resolveSpichlerzCityBonusState`: flagi bonusow z wyniku drain.
    pub fn resolve_spichlerz_city_bonus_state(
        built_ids: &[String],
        drain: SpichlerzDrainPayResult,
    ) -> SpichlerzCityBonusState {
        let params = &building_cost_params().spichlerz;
        let has_ii = built_ids.contains(&params.budynek_ii);
        let has_i = built_ids.contains(&params.budynek_i);
        if !has_i && !has_ii {
            return SpichlerzCityBonusState {
                ceramika_active: false,
                sol_active: false,
                ma_spichlerz_pop: false,
                ma_spichlerz_ii_pop: false,
            };
        }
        let ceramika_active = drain.ceramika_paid;
        let sol_active = has_ii && drain.sol_paid;
        let ma_spichlerz_ii_pop = has_ii && ceramika_active && sol_active;
        let ma_spichlerz_pop = ceramika_active && !ma_spichlerz_ii_pop;
        SpichlerzCityBonusState {
            ceramika_active,
            sol_active,
            ma_spichlerz_pop,
            ma_spichlerz_ii_pop,
        }
    }

    /// Web `spichlerzHealthBonus`.
    pub fn spichlerz_health_bonus(state: &SpichlerzCityBonusState) -> f64 {
        let params = &building_cost_params().spichlerz;
        if state.ma_spichlerz_ii_pop {
            return params.zdrowie_ii;
        }
        if state.ma_spichlerz_pop {
            return params.zdrowie_i;
        }
        0.0
    }

    /// Web `spichlerzGrowthBonusPercent`.
    pub fn spichlerz_growth_bonus_percent(state: &SpichlerzCityBonusState) -> f64 {
        let params = &building_cost_params().spichlerz;
        if state.ma_spichlerz_ii_pop {
            return params.wzrost_procent_ii;
        }
        if state.ma_spichlerz_pop {
            return params.wzrost_procent_i;
        }
        0.0
    }

    /// Web `spichlerzRationFoodCostMultiplier`.
    pub fn spichlerz_ration_food_cost_multiplier(state: &SpichlerzCityBonusState) -> f64 {
        let params = &building_cost_params().spichlerz;
        if state.ma_spichlerz_ii_pop {
            return params.racja_mnoznik_ii;
        }
        if state.ma_spichlerz_pop {
            return params.racja_mnoznik_i;
        }
        1.0
    }

    /// Web `spichlerzHappinessBonusFromJson(state, jsonBonus = 2)`.
    pub fn spichlerz_happiness_bonus_from_json(
        state: &SpichlerzCityBonusState,
        json_bonus: Option<f64>,
    ) -> f64 {
        let bonus =
            json_bonus.unwrap_or(building_cost_params().spichlerz.zadowolenie_json_domyslne);
        if state.ma_spichlerz_ii_pop {
            bonus
        } else {
            0.0
        }
    }

    /// Web `builtIdsForSpichlerzYields`: Spichlerz I/II w `builtIds` -> jeden efektywny id do yieldow.
    pub fn built_ids_for_spichlerz_yields(
        built_ids: &[String],
        state: &SpichlerzCityBonusState,
    ) -> Vec<String> {
        let params = &building_cost_params().spichlerz;
        let effective = if state.ma_spichlerz_ii_pop {
            Some(&params.budynek_ii)
        } else if state.ma_spichlerz_pop {
            Some(&params.budynek_i)
        } else {
            None
        };
        let mut out: Vec<String> = Vec::new();
        let mut spichlerz_mapped = false;
        for id in built_ids {
            if *id == params.budynek_i || *id == params.budynek_ii {
                if let (false, Some(effective)) = (spichlerz_mapped, effective) {
                    out.push(effective.clone());
                    spichlerz_mapped = true;
                }
                continue;
            }
            out.push(id.clone());
        }
        out
    }

    /// Web `spichlerzArmyFoodCostMultiplier`: mnoznik kosztu zywnosci jednostki.
    pub fn spichlerz_army_food_cost_multiplier(
        sol_army_bonus_active: bool,
        on_own_territory: bool,
        is_garrison_in_sol_city: bool,
    ) -> f64 {
        let params = &building_cost_params().spichlerz;
        let mut m = 1.0;
        if !on_own_territory && sol_army_bonus_active {
            m *= params.armia_mnoznik_poza_terytorium;
        }
        if is_garrison_in_sol_city {
            m *= params.garnizon_mnoznik_sol;
        }
        m
    }

    // ---------------------------------------------------------------------------------------
    // building-resource-gate.ts: status nieaktywnego budynku (UI)
    // ---------------------------------------------------------------------------------------

    /// Web `OwnedBuildingInactiveStatus`.
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct OwnedBuildingInactiveStatus {
        pub inactive: bool,
        pub missing_labels: Vec<String>,
        pub tooltip: String,
    }

    /// Web `formatInactiveTooltip`: `'Brak: ' + join(', ')` albo pusty napis.
    fn format_inactive_tooltip(missing_labels: &[String]) -> String {
        if missing_labels.is_empty() {
            return String::new();
        }
        let messages = &building_cost_params().bramka.komunikaty;
        format!(
            "{}{}",
            messages.brak_prefiks,
            missing_labels.join(&messages.separator)
        )
    }

    /// Web `missingRuntimeResourceLabels`: brakujace etykiety surowca dla bramki runtime.
    pub fn missing_runtime_resource_labels(
        building: &GateBuilding,
        runtime_active_built_ids: &[String],
        empire_stock: Option<&StockRecord>,
        options: Option<&BuildingRuntimeGateOptions<'_>>,
    ) -> Vec<String> {
        if is_mennica(&building.id) {
            if mennica_runtime_gate_met(empire_stock, options) {
                return Vec::new();
            }
            return vec![building_cost_params()
                .wejscia_z_innych_modulow_weba
                .zloto_label
                .clone()];
        }
        building_required_active_labels(building)
            .into_iter()
            .filter(|label| !label_satisfied(label, Some(runtime_active_built_ids), empire_stock))
            .collect()
    }

    /// Opcje `resolveOwnedBuildingInactiveStatus` (`opts`).
    pub struct InactiveStatusOptions<'a, T> {
        pub built_ids: &'a [String],
        pub all_cities: &'a [T],
        pub owner_id: i64,
        pub runtime_active_built_ids: &'a [String],
        pub empire_stock: Option<&'a StockRecord>,
        pub building: Option<&'a GateBuilding>,
        pub resolve_owner_zloto_access: Option<&'a dyn Fn(i64) -> bool>,
    }

    /// Web `resolveOwnedBuildingInactiveStatus`.
    pub fn resolve_owned_building_inactive_status<T: StockCitySource>(
        building_id: &str,
        opts: &InactiveStatusOptions<'_, T>,
    ) -> OwnedBuildingInactiveStatus {
        let empty = OwnedBuildingInactiveStatus {
            inactive: false,
            missing_labels: Vec::new(),
            tooltip: String::new(),
        };
        let params = &building_cost_params().spichlerz;

        if building_id == params.budynek_i || building_id == params.budynek_ii {
            if !opts.built_ids.iter().any(|id| id == building_id) {
                return empty;
            }
            let drain = spichlerz_drain_dry_run(opts.all_cities, opts.owner_id, opts.built_ids);
            let mut missing: Vec<String> = Vec::new();
            if !drain.ceramika_paid {
                missing.push(params.etykieta_ceramika.clone());
            }
            if building_id == params.budynek_ii && !drain.sol_paid {
                missing.push(params.etykieta_sol.clone());
            }
            return OwnedBuildingInactiveStatus {
                inactive: !missing.is_empty(),
                tooltip: format_inactive_tooltip(&missing),
                missing_labels: missing,
            };
        }

        if !has_deposit_runtime_gate(building_id) {
            return empty;
        }

        let fallback = GateBuilding {
            id: building_id.to_owned(),
            epoka_wejscia: Some(1.0),
            wymagany_surowiec: None,
        };
        let building = opts.building.unwrap_or(&fallback);
        let gate_options = BuildingRuntimeGateOptions {
            owner_id: Some(opts.owner_id),
            resolve_owner_zloto_access: opts.resolve_owner_zloto_access,
        };
        let missing_labels = missing_runtime_resource_labels(
            building,
            opts.runtime_active_built_ids,
            opts.empire_stock,
            Some(&gate_options),
        );
        OwnedBuildingInactiveStatus {
            inactive: !missing_labels.is_empty(),
            tooltip: format_inactive_tooltip(&missing_labels),
            missing_labels,
        }
    }
}
