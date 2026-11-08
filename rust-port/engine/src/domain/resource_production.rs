//! Reguly zuzycia surowcow przez obywateli (P6.8D / REPIN-EKONOMIA-E/F). Stara migawka produkcji ulepszen
//! (typy u32/u8, stare stale 200/50/20, skalowanie tylko tartak+kamieniolom) USUNIETA w R-RUSTPORT-REPIN-RESPROD-DUPLIKAT-Q1
//! (dlug D-R5-1): jedyna wersja regul produkcji terytorium to `improvements::territory_resource_yield_for_improvement`
//! i `improvements::resource_production_amount_for_era` (web `terrain-improvements.ts`, origin/main 247f1ef2a).

use std::collections::BTreeMap;

use crate::data::economy_society::{CitizenResourceUpkeep, CitizenResourceUpkeepEpoki};

// ---------------------------------------------------------------------------
// P6.8D-P1: utrzymanie obywateli surowcami (`citizen-resource-upkeep.ts`, web 91dc998a).
//
// Dwa rozdzielne kontrakty, jak w webie:
// - `resolve_citizen_resource_coverage` - czysty podglad, bramka binarna „magazyn > 0";
// - `compute_citizen_resource_drain` - realny drenaz: `required = floor(pop * stawka_epoki)`,
//   `drained = min(required, stock)`, kara binarna per surowiec.
// REPIN-EKONOMIA-E (pin weba 4bbef081d, R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1): stawka zalezy od epoki
// (`citizen_upkeep_rate_for_era`: stawka = 1,0 x m(e), m(e) = 1 + 0,5(e-1) jak web
// `citizen-consumption-era.ts`, REPIN-EKONOMIA-F; pole `stawkaNaObywatela` wiersza epoki jest
// ignorowane; brak / NaN / niefinitowa / ujemna era -> m(1) = 1,0).
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

/// Stawka zuzycia epoki (web `citizenUpkeepRateForEra`, `citizen-resource-upkeep.ts`, origin/main
/// `16c0509f6`, R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1): sztuk KAZDEGO wymaganego surowca /
/// obywatela / ture = `CITIZEN_UPKEEP_RATE_PER_CITIZEN` (1,0) x `citizen_consumption_era_multiplier(era)`
/// (m(e) = 1 + 0,5 x (floor(e) - 1): 1 / 1,5 / 2 / ...). Zastepuje stawki 1/2/3 z pola
/// `stawkaNaObywatela` (usuniete z weba; tabela nie wplywa juz na stawke - parametr `_table`
/// zachowany dla zgodnosci sygnatury wolajacych). Era < 1 / NaN / +-Inf -> x1.
pub fn citizen_upkeep_rate_for_era(_table: &CitizenResourceUpkeep, era: f64) -> f64 {
    CITIZEN_UPKEEP_RATE_PER_CITIZEN * citizen_consumption_era_multiplier(era)
}

/// Przyrost mnoznika zuzycia obywateli na epoke (web `CITIZEN_CONSUMPTION_ERA_STEP`, 50% bazy).
pub const CITIZEN_CONSUMPTION_ERA_STEP: f64 = 0.5;

/// Jedno zrodlo prawdy mnoznika zuzycia obywateli (web `citizenConsumptionEraMultiplier`,
/// `gra/src/game/citizen-consumption-era.ts`, R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1):
/// m(e) = 1 + 0,5 x (floor(e) - 1). NaN / +-Inf / e < 1 -> 1. Epoki ulamkowe w dol.
/// Runda 3 REPIN-EKONOMIA-F: wpiety w `ration_era_food_cost_multiplier` (`city_growth.rs`) i
/// `citizen_upkeep_rate_for_era` (jedna funkcja dla gracza i AI, jak w webie).
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
