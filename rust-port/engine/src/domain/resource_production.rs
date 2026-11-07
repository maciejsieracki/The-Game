use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::data::economy_society::{CitizenResourceUpkeep, CitizenResourceUpkeepEpoki};

/// A resource produced by a terrain improvement.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum ResourceKey {
    #[serde(rename = "drewno")]
    Wood,
    #[serde(rename = "kamien")]
    Stone,
    #[serde(rename = "glina")]
    Clay,
    #[serde(rename = "ruda")]
    CopperOre,
    #[serde(rename = "ruda_zelaza")]
    IronOre,
    #[serde(rename = "ruda_cyny")]
    TinOre,
    #[serde(rename = "sol")]
    Salt,
    #[serde(rename = "zloto")]
    Gold,
    #[serde(rename = "kon")]
    Horse,
}

impl ResourceKey {
    /// The canonical data key used by the game data and save format.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Wood => "drewno",
            Self::Stone => "kamien",
            Self::Clay => "glina",
            Self::CopperOre => "ruda",
            Self::IronOre => "ruda_zelaza",
            Self::TinOre => "ruda_cyny",
            Self::Salt => "sol",
            Self::Gold => "zloto",
            Self::Horse => "kon",
        }
    }
}

/// One resolved territorial-resource yield.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ResourceYield {
    pub resource: ResourceKey,
    pub amount: u32,
}

/// Additive resource pool produced by all improvements in a scope.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ResourceProductionTotals {
    pub resources: BTreeMap<ResourceKey, u32>,
}

impl ResourceProductionTotals {
    pub fn amount_for(&self, resource: ResourceKey) -> u32 {
        self.resources.get(&resource).copied().unwrap_or(0)
    }

    pub fn get(&self, resource: ResourceKey) -> Option<u32> {
        self.resources.get(&resource).copied()
    }

    fn add(&mut self, yield_row: ResourceYield) {
        *self.resources.entry(yield_row.resource).or_default() += yield_row.amount;
    }
}

/// Normalize an improvement identifier at the domain boundary.
///
/// The aliases cover the canonical Polish data keys and the English names
/// used by older Rust callers. Unknown keys are deliberately rejected rather
/// than assigned a guessed resource.
pub fn normalize_improvement_key(raw: &str) -> Option<&'static str> {
    let key = raw.trim().to_lowercase();
    match key.as_str() {
        "tartak" | "lumber_mill" => Some("tartak"),
        "kamieniolom" | "kamieniołom" | "quarry" => Some("kamieniolom"),
        "glinianka" | "clay_pit" => Some("glinianka"),
        "kopalnia_miedzi" | "copper_mine" => Some("kopalnia_miedzi"),
        "kopalnia_zelaza" | "iron_mine" => Some("kopalnia_zelaza"),
        "kopalnia_cyny" | "tin_mine" => Some("kopalnia_cyny"),
        "warzelnia_soli" | "salt_works" => Some("warzelnia_soli"),
        "stadnina" | "horse_ranch" => Some("stadnina"),
        "kopalnia_zlota" | "gold_mine" => Some("kopalnia_zlota"),
        _ => None,
    }
}

/// Resolve the per-turn amount for an improvement in an owner's era.
///
/// Tartak and Kamieniołom scale by +50% for each later era, producing the
/// canonical 200/300/450 vector. Era zero and future/invalid values safely
/// use era one. All other resource improvements retain their flat rates.
pub fn resource_production_amount_for_era(key: &str, base_amount: u32, era: u8) -> u32 {
    let normalized = normalize_improvement_key(key);
    if !matches!(normalized, Some("tartak" | "kamieniolom")) {
        return base_amount;
    }

    match era {
        2 => rounded_ratio(base_amount, 3, 2),
        3 => rounded_ratio(base_amount, 9, 4),
        _ => base_amount,
    }
}

fn rounded_ratio(value: u32, numerator: u64, denominator: u64) -> u32 {
    let scaled = u64::from(value).saturating_mul(numerator);
    let rounded = scaled.saturating_add(denominator / 2) / denominator;
    rounded.min(u64::from(u32::MAX)) as u32
}

/// Resolve one territorial producer, independent of worker assignment.
pub fn resolve_resource_production(key: &str, era: u8) -> Option<ResourceYield> {
    let normalized = normalize_improvement_key(key)?;
    let (resource, base_amount) = match normalized {
        "tartak" => (ResourceKey::Wood, 200),
        "kamieniolom" => (ResourceKey::Stone, 200),
        "glinianka" => (ResourceKey::Clay, 50),
        "kopalnia_miedzi" => (ResourceKey::CopperOre, 20),
        "kopalnia_zelaza" => (ResourceKey::IronOre, 20),
        "kopalnia_cyny" => (ResourceKey::TinOre, 20),
        "warzelnia_soli" => (ResourceKey::Salt, 50),
        "stadnina" => (ResourceKey::Horse, 25),
        "kopalnia_zlota" => (ResourceKey::Gold, 1),
        _ => return None,
    };

    Some(ResourceYield {
        resource,
        amount: resource_production_amount_for_era(normalized, base_amount, era),
    })
}

/// Compatibility name matching the terrain-improvement resolver in TypeScript.
pub fn resource_yield_for_improvement(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Compatibility name matching the territorial resolver's domain concept.
pub fn territory_resource_yield_for_improvement(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Short compatibility name for callers that treat the resolver as a lookup.
pub fn resource_production_for(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Sum every resolved improvement additively, including duplicate layers.
/// Unknown/non-producing improvements contribute nothing.
pub fn stack_resource_production<'a, I, K>(keys: I, era: u8) -> ResourceProductionTotals
where
    I: IntoIterator<Item = K>,
    K: AsRef<str> + 'a,
{
    let mut totals = ResourceProductionTotals::default();
    for key in keys {
        if let Some(yield_row) = resolve_resource_production(key.as_ref(), era) {
            totals.add(yield_row);
        }
    }
    totals
}

// ---------------------------------------------------------------------------
// P6.8D-P1: utrzymanie obywateli surowcami (`citizen-resource-upkeep.ts`, web 91dc998a).
//
// Dwa rozdzielne kontrakty, jak w webie:
// - `resolve_citizen_resource_coverage` - czysty podglad, bramka binarna „magazyn > 0";
// - `compute_citizen_resource_drain` - realny drenaz: `required = floor(pop * stawka_epoki)`,
//   `drained = min(required, stock)`, kara binarna per surowiec.
// REPIN-EKONOMIA-E (pin weba 4bbef081d, R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1): stawka zalezy od epoki
// (`citizen_upkeep_rate_for_era`: Kamien 1,0 / Braz 2,0 / Zelazo 3,0; pole `stawkaNaObywatela`
// wiersza epoki; brak / NaN / niefinitowa / ujemna -> `CITIZEN_UPKEEP_RATE_PER_CITIZEN`).
// Wolajacy MUSI zsumowac populacje wszystkich miast ownera i wywolac raz per owner per tura.
// Liczby (populacja, magazyn) sa f64 jak w JS; wartosci niefinite/niedodatnie traktowane
// tak samo jak w webie (`Number.isFinite` / `> 0`).
// ---------------------------------------------------------------------------

/// FALLBACK stawki (web `CITIZEN_UPKEEP_RATE_PER_CITIZEN`, `citizen-resource-upkeep.ts:155`): uzywany, gdy
/// wiersz epoki nie niesie poprawnej `stawkaNaObywatela`. Realna stawka: `citizen_upkeep_rate_for_era`.
pub const CITIZEN_UPKEEP_RATE_PER_CITIZEN: f64 = 1.0;

/// Wynik pokrycia (web `CitizenUpkeepCoverage`).
#[derive(Debug, Clone, PartialEq)]
pub struct CitizenUpkeepCoverage {
    /// Surowce wymagane w tej epoce (z tabeli, kumulatywne).
    pub required: Vec<String>,
    /// Stawka epoki uzyta do wyliczenia tego obiektu (web `ratePerCitizen?`, brak -> 1,0 w
    /// `citizen_upkeep_display_lines`). Oba konstruktory (`resolve_*`, `compute_*`) zawsze ustawiaja `Some`.
    pub rate_per_citizen: Option<f64>,
    /// Surowce z `required`, ktorych magazyn ma wartosc > 0 (podglad) / pokryte w pelni (drenaz).
    pub available: Vec<String>,
    /// Pozostale surowce z `required`.
    pub missing: Vec<String>,
    /// Suma modyfikatora Szczescia (data-driven, `_kara`).
    pub happiness_delta: i64,
    /// Suma modyfikatora Rozwoju w punktach % (data-driven, `_kara`).
    pub growth_pct_delta: i64,
}

/// Wynik realnego drenazu (web `CitizenResourceDrainResult`).
#[derive(Debug, Clone, PartialEq)]
pub struct CitizenResourceDrainResult {
    pub coverage: CitizenUpkeepCoverage,
    /// Ile realnie odjac z magazynu, per surowiec (tylko wpisy > 0).
    pub deductions: BTreeMap<String, f64>,
}

/// Jeden wiersz panelu miasta (web `CitizenUpkeepDisplayLine`).
#[derive(Debug, Clone, PartialEq)]
pub struct CitizenUpkeepDisplayLine {
    pub key: String,
    /// Dodatni = pokryty, ujemny = niedobor; wartosc bezwzgledna = zapotrzebowanie miasta.
    pub value: f64,
    pub available: bool,
}

/// Wiersz tabeli dla epoki (web `citizenUpkeepRowForEra`, `citizen-resource-upkeep.ts:166-174`):
/// `era` niefinite -> 1; `era` < 1 -> 1; dokladny wpis (pierwszy o tym `epoka`); inaczej wiersz o
/// najwyzszej `epoka` <= `era`; gdy brak takiego - pierwszy wiersz tabeli; pusta tabela -> `None`.
/// Jedno zrodlo prawdy dla listy surowcow i stawki (jak w webie).
fn citizen_upkeep_row_for_era(
    table: &CitizenResourceUpkeep,
    era: f64,
) -> Option<&CitizenResourceUpkeepEpoki> {
    let rows = &table.epoki;
    let first = rows.first()?;
    let wanted: i64 = if era.is_finite() {
        era.floor().max(1.0) as i64
    } else {
        1
    };
    if let Some(exact) = rows.iter().find(|row| row.epoka == wanted) {
        return Some(exact);
    }
    // Web: `[...ROWS].filter(epoka <= e).sort((a, b) => b.epoka - a.epoka)[0]` - sort stabilny, wiec przy
    // remisie (duplikat `epoka`) wygrywa PIERWSZY wiersz; `Iterator::max_by_key` zwraca OSTATNI.
    let mut best: Option<&CitizenResourceUpkeepEpoki> = None;
    for row in rows.iter().filter(|row| row.epoka <= wanted) {
        best = match best {
            Some(current) if row.epoka <= current.epoka => Some(current),
            _ => Some(row),
        };
    }
    Some(best.unwrap_or(first))
}

/// Lista surowcow wymaganych w epoce (web `citizenRequiredResourcesForEra`).
/// `era` niefinite -> 1; `era` < 1 -> 1; brak dokladnego wpisu -> najblizsza epoka <= `era`,
/// a gdy brak takiej - pierwsza epoka z tabeli.
pub fn citizen_required_resources_for_era(table: &CitizenResourceUpkeep, era: f64) -> &[String] {
    citizen_upkeep_row_for_era(table, era)
        .map(|row| row.surowce.as_slice())
        .unwrap_or(&[])
}

/// Stawka zuzycia epoki (web `citizenUpkeepRateForEra`, `citizen-resource-upkeep.ts:194-197`):
/// sztuk KAZDEGO wymaganego surowca / obywatela / ture. Wiersz wybierany jak w
/// `citizen_required_resources_for_era`. Brak pola / NaN / +-Inf / wartosc ujemna (oraz pusta
/// tabela) -> `CITIZEN_UPKEEP_RATE_PER_CITIZEN`. Zero jest poprawne (`v >= 0`).
pub fn citizen_upkeep_rate_for_era(table: &CitizenResourceUpkeep, era: f64) -> f64 {
    match citizen_upkeep_row_for_era(table, era).and_then(|row| row.stawka_na_obywatela) {
        Some(v) if v.is_finite() && v >= 0.0 => v,
        _ => CITIZEN_UPKEEP_RATE_PER_CITIZEN,
    }
}

/// Przyrost mnoznika zuzycia obywateli na epoke (web `CITIZEN_CONSUMPTION_ERA_STEP`, 50% bazy).
pub const CITIZEN_CONSUMPTION_ERA_STEP: f64 = 0.5;

/// Jedno zrodlo prawdy mnoznika zuzycia obywateli (web `citizenConsumptionEraMultiplier`,
/// `gra/src/game/citizen-consumption-era.ts`, R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1):
/// m(e) = 1 + 0,5 x (floor(e) - 1). NaN / +-Inf / e < 1 -> 1. Epoki ulamkowe w dol.
/// Partia 1 REPIN-EKONOMIA-F: symbol dodany addytywnie; wolajacy (`ration_era_food_cost_multiplier`,
/// `citizen_upkeep_rate_for_era`) NIE sa przepiete tu, bo stare testy pinu poza allowlista
/// pinuja poprzednie wartosci (patrz P6-REPIN-EKONOMIA-F.md §5).
pub fn citizen_consumption_era_multiplier(era: f64) -> f64 {
    if !era.is_finite() || era < 1.0 {
        return 1.0;
    }
    1.0 + CITIZEN_CONSUMPTION_ERA_STEP * (era.floor() - 1.0)
}

/// Dodatni, skonczony stan magazynu; wszystko inne (brak, NaN, <= 0) to 0.
fn positive_stock(stock: Option<&BTreeMap<String, f64>>, key: &str) -> f64 {
    match stock.and_then(|m| m.get(key)) {
        Some(&value) if value.is_finite() && value > 0.0 => value,
        _ => 0.0,
    }
}

/// Modyfikatory kary: szczescieZaDostepny / szczescieZaBrakujacy / rozwojPctZaBrakujacy.
fn penalty_deltas(table: &CitizenResourceUpkeep, available: usize, missing: usize) -> (i64, i64) {
    let kara = &table.kara;
    let happiness = available as i64 * kara.szczescie_za_dostepny
        + missing as i64 * kara.szczescie_za_brakujacy;
    let growth = missing as i64 * kara.rozwoj_pct_za_brakujacy;
    (happiness, growth)
}

/// Czysty podglad pokrycia (web `resolveCitizenResourceCoverage`, 3. argument `population?` od
/// 4bbef081d). Bez populacji (`None`) - dotychczasowa bramka „magazyn > 0". Z populacja
/// (`Some(x)`, `x` skonczone) bramka jest TA SAMA co w `compute_citizen_resource_drain`:
/// magazyn >= `floor(floor(pop) * stawka_epoki)` (pop <= 0 -> 0). `Some(NaN/Inf)` = brak populacji
/// (web `hasPop = typeof === 'number' && Number.isFinite`). Nie odejmuje niczego.
pub fn resolve_citizen_resource_coverage(
    table: &CitizenResourceUpkeep,
    era: f64,
    empire_stock: Option<&BTreeMap<String, f64>>,
    population: Option<f64>,
) -> CitizenUpkeepCoverage {
    let required = citizen_required_resources_for_era(table, era);
    let rate = citizen_upkeep_rate_for_era(table, era);
    let has_pop = population.is_some_and(f64::is_finite);
    let pop = match population {
        Some(p) if has_pop && p > 0.0 => p.floor(),
        _ => 0.0,
    };
    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    for key in required {
        let have = positive_stock(empire_stock, key);
        let covered = if has_pop { have >= need } else { have > 0.0 };
        if covered {
            available.push(key.clone());
        } else {
            missing.push(key.clone());
        }
    }
    let (happiness_delta, growth_pct_delta) = penalty_deltas(table, available.len(), missing.len());
    CitizenUpkeepCoverage {
        required: required.to_vec(),
        rate_per_citizen: Some(rate),
        available,
        missing,
        happiness_delta,
        growth_pct_delta,
    }
}

/// Realny drenaz magazynu centralnego przez obywateli (web `computeCitizenResourceDrain`).
/// `population` = suma populacji WSZYSTKICH miast ownera. `required = floor(pop * stawka_epoki)`
/// (`citizen_upkeep_rate_for_era`; stawka niesiona w wyniku jako `rate_per_citizen`),
/// `drained = min(required, stock)`; kara binarna: „dostepny" wtedy i tylko wtedy, gdy
/// `drained >= required`. Funkcja nie mutuje magazynu.
pub fn compute_citizen_resource_drain(
    table: &CitizenResourceUpkeep,
    era: f64,
    population: f64,
    empire_stock: Option<&BTreeMap<String, f64>>,
) -> CitizenResourceDrainResult {
    let required = citizen_required_resources_for_era(table, era);
    let pop = if population.is_finite() && population > 0.0 {
        population.floor()
    } else {
        0.0
    };
    let rate = citizen_upkeep_rate_for_era(table, era);
    let need = (pop * rate).floor();
    let mut available = Vec::new();
    let mut missing = Vec::new();
    let mut deductions = BTreeMap::new();
    for key in required {
        let have = positive_stock(empire_stock, key);
        let drained = need.min(have);
        if drained > 0.0 {
            deductions.insert(key.clone(), drained);
        }
        if drained >= need {
            available.push(key.clone());
        } else {
            missing.push(key.clone());
        }
    }
    let (happiness_delta, growth_pct_delta) = penalty_deltas(table, available.len(), missing.len());
    CitizenResourceDrainResult {
        coverage: CitizenUpkeepCoverage {
            required: required.to_vec(),
            rate_per_citizen: Some(rate),
            available,
            missing,
            happiness_delta,
            growth_pct_delta,
        },
        deductions,
    }
}

/// Wiersze panelu „Zaopatrzenie obywateli" (web `citizenUpkeepDisplayLines`): dostepne
/// najpierw, potem brakujace. Wartosc = `floor(floor(pop) * stawka)` dla danego miasta, stawka =
/// `coverage.rate_per_citizen` (stawka epoki z werdyktu silnika), brak (`None`) -> 1,0;
/// brakujace maja wartosc ujemna (`-qty`, takze `-0` gdy qty = 0 - zgodnie z webem).
/// Znany rozjazd panel-vs-silnik (web) zachowany swiadomie.
pub fn citizen_upkeep_display_lines(
    coverage: &CitizenUpkeepCoverage,
    city_population: f64,
) -> Vec<CitizenUpkeepDisplayLine> {
    let pop = if city_population.is_finite() && city_population > 0.0 {
        city_population.floor()
    } else {
        0.0
    };
    let rate = coverage
        .rate_per_citizen
        .unwrap_or(CITIZEN_UPKEEP_RATE_PER_CITIZEN);
    let qty = (pop * rate).floor();
    let mut lines = Vec::with_capacity(coverage.available.len() + coverage.missing.len());
    lines.extend(
        coverage
            .available
            .iter()
            .map(|key| CitizenUpkeepDisplayLine {
                key: key.clone(),
                value: qty,
                available: true,
            }),
    );
    lines.extend(coverage.missing.iter().map(|key| CitizenUpkeepDisplayLine {
        key: key.clone(),
        value: -qty,
        available: false,
    }));
    lines
}
