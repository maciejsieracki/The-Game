//! P6.8F - port czystych funkcji miejskich z `gra/src/game/economy.ts` (pin `91dc998a`),
//! ktorych nie bylo w silniku (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1, partia 8F-P1).
//!
//! web (`gra/src/game/economy.ts@91dc998a`, 1243 LOC; zakresy wg `^}` w pinie):
//! - `sumBuildingHappinessFromBuiltIds` (L546-558) -> [`sum_building_happiness_from_built_ids`]
//! - `sumBuildingHappiness` (L561-567) -> [`sum_building_happiness`]
//! - `cityBuildingEntriesFromBuiltIds` (L589-609) -> [`city_building_entries_from_built_ids`]
//! - `productionProgress` (L1151-1171) -> [`production_progress`]
//! - `corruptionRate` (L1190-1199) -> [`corruption_rate`]
//! - `corruptionBuildingReduction` (deklaracja L1223-1229; stale `CORRUPTION_*` L1202-1211) -> [`corruption_building_reduction`]
//!
//! Dowod rownowaznosci: wektory z pinu (`tests/economy_city_vectors.rs`, plik
//! `tests/fixtures/economy_city_vectors_91dc998a.json`), 2500 wektorow (asercja liczb per funkcja), bundle esbuild z pinu.
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - `buildingGivesHappiness` / `buildingHappinessAtLevel` sa juz portem w
//!   [`crate::domain::economy_yield::building_happiness_at_level`]; tu wywolywane bez duplikatu.
//! - `buildingLevelForEpoch` = [`crate::domain::production_units::building_level_for_epoch`].
//! - Web `{ record, level }` (CityBuildingEntry) -> wpis lokalny [`HappinessEntryInput`] (pola
//!   potrzebne do Szczescia) lub indeks katalogu + poziom ([`CityBuildingLevel`]).
//! - Web `Math.min` (NaN propaguje) -> prywatne `js_min` (Rust `f64::min` ignoruje NaN).
//! - Web `levelFor` / `unlockedTechs` -> argument closure / `Option<&HashSet<String>>`.

use std::collections::HashSet;

use super::economy_yield::building_happiness_at_level;
use super::production_units::building_level_for_epoch;

/// JS `Math.min(a, b)`: NaN propaguje, `-0` mniejsze od `+0`.
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// Pola katalogu budynku potrzebne do liczenia Szczescia (web `BuildingHappinessCatalogEntry`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HappinessCatalogEntry<'a> {
    /// Web `id`.
    pub id: &'a str,
    /// Web `dajeSzczescie === true`.
    pub daje_szczescie: bool,
    /// Web `baza.zadowolenie` gdy liczba; inaczej `None`.
    pub baza_zadowolenie: Option<f64>,
    /// Web `przyrost.zadowolenie` (`NaN` gdy brak).
    pub przyrost_zadowolenie: f64,
}

/// Wpis `{ record, level }` dla [`sum_building_happiness`] (web `CityBuildingEntry`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct HappinessEntryInput {
    /// Web `record.dajeSzczescie === true`.
    pub daje_szczescie: bool,
    /// Web `record.baza.zadowolenie` gdy liczba.
    pub baza_zadowolenie: Option<f64>,
    /// Web `record.przyrost.zadowolenie` (`NaN` gdy brak).
    pub przyrost_zadowolenie: f64,
    /// Web `level`.
    pub level: f64,
}

/// Suma Szczescia ze zbudowanych budynkow miasta (web `sumBuildingHappinessFromBuiltIds`).
///
/// Dla kazdego id z `built_ids` szukany jest PIERWSZY wpis katalogu o tym id; brak = pominiecie.
/// `level_for` jest wolane dokladnie raz dla kazdego znalezionego wpisu (jak `levelFor(bdef)` w webie).
pub fn sum_building_happiness_from_built_ids<F>(
    built_ids: &[&str],
    catalog: &[HappinessCatalogEntry<'_>],
    mut level_for: F,
) -> f64
where
    F: FnMut(&HappinessCatalogEntry<'_>) -> f64,
{
    let mut sum = 0.0;
    for bid in built_ids {
        let Some(bdef) = catalog.iter().find(|b| b.id == *bid) else {
            continue;
        };
        let level = level_for(bdef);
        sum += building_happiness_at_level(
            bdef.daje_szczescie,
            bdef.baza_zadowolenie,
            bdef.przyrost_zadowolenie,
            level,
        );
    }
    sum
}

/// Suma Szczescia z wpisow `{ record, level }` (web `sumBuildingHappiness`).
pub fn sum_building_happiness(entries: &[HappinessEntryInput]) -> f64 {
    let mut sum = 0.0;
    for e in entries {
        sum += building_happiness_at_level(
            e.daje_szczescie,
            e.baza_zadowolenie,
            e.przyrost_zadowolenie,
            e.level,
        );
    }
    sum
}

/// Pola katalogu potrzebne do poziomu budynku wg epoki (web `BuildingRecord` w
/// `cityBuildingEntriesFromBuiltIds`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BuildingLevelCatalogEntry<'a> {
    /// Web `id`.
    pub id: &'a str,
    /// Web `epokaWejscia`.
    pub epoka_wejscia: f64,
    /// Web `maksPoziom`.
    pub maks_poziom: f64,
    /// Web `poziomTechGate` (wpisy `{ "poziom": "Technologia" }` w kolejnosci JS), lub `None`.
    pub poziom_tech_gate: Option<&'a [(String, String)]>,
}

/// Wynik [`city_building_entries_from_built_ids`]: indeks w katalogu + poziom (web `{ record, level }`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CityBuildingLevel {
    /// Indeks PIERWSZEGO wpisu katalogu o danym id.
    pub catalog_index: usize,
    /// Web `level` z `buildingLevelForEpoch`.
    pub level: f64,
}

/// Zbuduj wpisy poziomow z listy zbudowanych id (web `cityBuildingEntriesFromBuiltIds`).
/// Nieznane id sa pomijane; kolejnosc jak w `built_ids`.
pub fn city_building_entries_from_built_ids(
    built_ids: &[&str],
    catalog: &[BuildingLevelCatalogEntry<'_>],
    city_epoch: f64,
    unlocked_techs: Option<&HashSet<String>>,
) -> Vec<CityBuildingLevel> {
    let mut entries = Vec::new();
    for bid in built_ids {
        let Some(idx) = catalog.iter().position(|b| b.id == *bid) else {
            continue;
        };
        let rec = &catalog[idx];
        let level = building_level_for_epoch(
            rec.epoka_wejscia,
            city_epoch,
            rec.maks_poziom,
            rec.poziom_tech_gate,
            unlocked_techs,
        );
        entries.push(CityBuildingLevel {
            catalog_index: idx,
            level,
        });
    }
    entries
}

/// Wynik [`production_progress`] (web `ProductionProgressResult`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProductionProgressResult {
    pub completed: bool,
    pub nowa_zebrana_praca: f64,
    pub remainder: f64,
}

/// Posuniecie kolejki produkcji o `praca_per_turn` (web `productionProgress`).
/// `Math.floor` na `praca_per_turn`; NaN porownuje sie jak w JS (`>=` = false).
pub fn production_progress(
    current_build_cost: f64,
    current_progress: f64,
    praca_per_turn: f64,
) -> ProductionProgressResult {
    let nowa = current_progress + praca_per_turn.floor();
    if nowa >= current_build_cost {
        ProductionProgressResult {
            completed: true,
            nowa_zebrana_praca: current_build_cost,
            remainder: nowa - current_build_cost,
        }
    } else {
        ProductionProgressResult {
            completed: false,
            nowa_zebrana_praca: nowa,
            remainder: 0.0,
        }
    }
}

/// Parametry korupcji (web pola `EconParams` czytane przez `corruptionRate`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CorruptionParams {
    /// Web `korupcjaWspolczynnikDystansu` (punkty procentowe / kafel).
    pub wspolczynnik_dystansu: f64,
    /// Web `korupcjaWspolczynnikMiast` (punkty procentowe / miasto).
    pub wspolczynnik_miast: f64,
    /// Web `korupcjaCap` (ulamek, np. 0.5 = 50%).
    pub cap: f64,
}

/// Ulamek korupcji miasta w [0, cap] (web `corruptionRate`).
/// `strata% = dystans * coeff_d + liczba_miast * coeff_m`; stolica ma `dystans = 0`.
pub fn corruption_rate(
    dystans_od_stolicy: f64,
    liczba_wszystkich_miast: f64,
    params: CorruptionParams,
) -> f64 {
    let strata_pct = dystans_od_stolicy * params.wspolczynnik_dystansu
        + liczba_wszystkich_miast * params.wspolczynnik_miast;
    let cap_pct = params.cap * 100.0;
    js_min(cap_pct, strata_pct) / 100.0
}

/// Budynki redukujace korupcje, w kolejnosci web (`KORUPCJA_REDUKCJA_BUDYNKI`).
const KORUPCJA_REDUKCJA_BUDYNKI: [&str; 3] = ["sad", "pretorium", "palac"];
/// Redukcja za jeden budynek (web `KORUPCJA_REDUKCJA_NA_BUDYNEK`).
const KORUPCJA_REDUKCJA_NA_BUDYNEK: f64 = 0.30;
/// Sufit sumy redukcji (web `KORUPCJA_REDUKCJA_SUFIT`).
const KORUPCJA_REDUKCJA_SUFIT: f64 = 0.60;

/// Ulamek redukcji korupcji z budynkow W TYM MIESCIE, w [0, 0.60]
/// (web `corruptionBuildingReduction`). Kazdy z trzech budynkow dodaje 0.30 raz (addytywnie).
pub fn corruption_building_reduction(built_ids: &[&str]) -> f64 {
    let mut suma = 0.0;
    for id in KORUPCJA_REDUKCJA_BUDYNKI {
        if built_ids.contains(&id) {
            suma += KORUPCJA_REDUKCJA_NA_BUDYNEK;
        }
    }
    js_min(KORUPCJA_REDUKCJA_SUFIT, suma)
}

/// Web `buildingGivesHappiness(b)` (`economy.ts@91dc998a` L514-516): `b.dajeSzczescie === true`.
/// `None` = pole nieobecne (`undefined`). Tylko dokladnie logiczne `true` daje `true`; `"true"`,
/// `1`, `"tak"`, `{}`, `[]`, `null`, `false` i brak daja `false`.
pub fn building_gives_happiness(daje_szczescie: Option<&serde_json::Value>) -> bool {
    matches!(daje_szczescie, Some(serde_json::Value::Bool(true)))
}

/// JS truthiness dla wartosci JSON (`!row` w web): `null`, `false`, `0`, `NaN`, `""` sa falsy.
fn js_truthy(v: &serde_json::Value) -> bool {
    use serde_json::Value;
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|x| x != 0.0 && !x.is_nan()),
        Value::String(s) => !s.is_empty(),
        Value::Array(_) | Value::Object(_) => true,
    }
}

/// Web `civBonusyForCivKey(civKey, civs)` (`economy.ts@91dc998a` L765-779): wiersz `civs.cywilizacje`,
/// ktorego `ikonaId` / `typCywilizacji` / `Cywilizacja` (niepuste stringi, porownanie bez wielkosci
/// liter) rowna sie kluczowi cywilizacji; zwraca jego `bonusy` (lub pusta liste). Pierwszy pasujacy wiersz wygrywa.
/// Dziedzina: `civs` = obiekt JSON lub `None`/`null`; `bonusy` = tablica lub `null`/brak (typ TS `CivEconomyBonus[] | undefined`).
pub fn civ_bonusy_for_civ_key(
    civ_key: Option<&str>,
    civs: Option<&serde_json::Value>,
) -> Vec<serde_json::Value> {
    let Some(key) = civ_key.filter(|k| !k.is_empty()) else {
        return Vec::new();
    };
    let key = key.to_lowercase();
    let Some(rows) = civs
        .and_then(|c| c.get("cywilizacje"))
        .and_then(|v| v.as_array())
    else {
        return Vec::new();
    };
    for row in rows {
        if !js_truthy(row) {
            continue;
        }
        let matches_key = ["ikonaId", "typCywilizacji", "Cywilizacja"]
            .iter()
            .filter_map(|f| row.get(*f).and_then(|v| v.as_str()))
            .filter(|s| !s.is_empty())
            .any(|s| s.to_lowercase() == key);
        if matches_key {
            return match row.get("bonusy") {
                Some(serde_json::Value::Array(items)) => items.clone(),
                _ => Vec::new(),
            };
        }
    }
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    const SZCZESCIE: HappinessCatalogEntry<'static> = HappinessCatalogEntry {
        id: "swiatynia",
        daje_szczescie: true,
        baza_zadowolenie: Some(2.0),
        przyrost_zadowolenie: 1.0,
    };
    const MURY: HappinessCatalogEntry<'static> = HappinessCatalogEntry {
        id: "mury",
        daje_szczescie: false,
        baza_zadowolenie: Some(4.0),
        przyrost_zadowolenie: 0.0,
    };

    #[test]
    fn happiness_from_built_ids_skips_unknown_and_uses_first_match() {
        let catalog = [SZCZESCIE, MURY];
        let mut calls = 0;
        let sum = sum_building_happiness_from_built_ids(
            &["swiatynia", "brak", "mury", "swiatynia"],
            &catalog,
            |_| {
                calls += 1;
                1.0
            },
        );
        // swiatynia poziom 1 -> 1 + 2 = 3 (x2), mury nie daja szczescia -> 0, "brak" pominiety.
        assert_eq!(sum, 6.0);
        assert_eq!(calls, 3, "levelFor tylko dla znalezionych wpisow");
    }

    #[test]
    fn happiness_from_built_ids_empty_is_zero() {
        assert_eq!(
            sum_building_happiness_from_built_ids(&[], &[SZCZESCIE], |_| 1.0),
            0.0
        );
    }

    #[test]
    fn happiness_entries_sum_and_nan_level_propagates() {
        let e = |daje, baza, lvl| HappinessEntryInput {
            daje_szczescie: daje,
            baza_zadowolenie: baza,
            przyrost_zadowolenie: 1.0,
            level: lvl,
        };
        assert_eq!(sum_building_happiness(&[]), 0.0);
        assert_eq!(sum_building_happiness(&[e(true, None, 1.0)]), 1.0);
        assert_eq!(sum_building_happiness(&[e(true, Some(0.0), 3.0)]), 1.0);
        assert_eq!(
            sum_building_happiness(&[e(true, Some(2.0), 2.0), e(false, Some(9.0), 1.0)]),
            4.0
        );
        let nan = HappinessEntryInput {
            daje_szczescie: true,
            baza_zadowolenie: Some(2.0),
            przyrost_zadowolenie: 1.0,
            level: f64::NAN,
        };
        assert!(sum_building_happiness(&[nan]).is_nan());
    }

    #[test]
    fn city_entries_skip_unknown_and_keep_order() {
        let catalog = [
            BuildingLevelCatalogEntry {
                id: "a",
                epoka_wejscia: 1.0,
                maks_poziom: 3.0,
                poziom_tech_gate: None,
            },
            BuildingLevelCatalogEntry {
                id: "b",
                epoka_wejscia: 2.0,
                maks_poziom: 1.0,
                poziom_tech_gate: None,
            },
        ];
        let out = city_building_entries_from_built_ids(&["b", "x", "a"], &catalog, 3.0, None);
        assert_eq!(
            out,
            vec![
                CityBuildingLevel {
                    catalog_index: 1,
                    level: 1.0
                },
                CityBuildingLevel {
                    catalog_index: 0,
                    level: 3.0
                },
            ]
        );
    }

    #[test]
    fn production_progress_branches() {
        let r = production_progress(10.0, 4.0, 3.9);
        assert_eq!(
            r,
            ProductionProgressResult {
                completed: false,
                nowa_zebrana_praca: 7.0,
                remainder: 0.0
            }
        );
        let r = production_progress(10.0, 8.0, 5.0);
        assert_eq!(
            r,
            ProductionProgressResult {
                completed: true,
                nowa_zebrana_praca: 10.0,
                remainder: 3.0
            }
        );
        // Dokladnie koszt = ukonczone, reszta 0 (granica >=).
        let r = production_progress(10.0, 5.0, 5.0);
        assert!(r.completed && r.remainder == 0.0);
        // NaN porownuje sie jak w JS: nie ukonczone, zebrana = NaN.
        let r = production_progress(10.0, 0.0, f64::NAN);
        assert!(!r.completed && r.nowa_zebrana_praca.is_nan() && r.remainder == 0.0);
    }

    #[test]
    fn corruption_rate_caps_and_scales() {
        let p = CorruptionParams {
            wspolczynnik_dystansu: 2.0,
            wspolczynnik_miast: 1.0,
            cap: 0.5,
        };
        assert_eq!(corruption_rate(0.0, 0.0, p), 0.0);
        assert!((corruption_rate(5.0, 2.0, p) - 0.12).abs() < 1e-12);
        // Strata przekracza cap (50%) -> ucięte do 0.5.
        assert_eq!(corruption_rate(100.0, 1.0, p), 0.5);
        assert!(corruption_rate(f64::NAN, 1.0, p).is_nan());
    }

    #[test]
    fn corruption_reduction_each_building_and_ceiling() {
        assert_eq!(corruption_building_reduction(&[]), 0.0);
        assert_eq!(corruption_building_reduction(&["sad"]), 0.30);
        assert_eq!(corruption_building_reduction(&["sad", "palac"]), 0.60);
        // Trzy budynki: suma 0.9 ucieta do sufitu 0.6.
        assert_eq!(
            corruption_building_reduction(&["sad", "pretorium", "palac"]),
            0.60
        );
        // Duplikat w built_ids nie zwieksza redukcji (liczy sie stala lista budynkow).
        assert_eq!(corruption_building_reduction(&["sad", "sad"]), 0.30);
        assert_eq!(corruption_building_reduction(&["mury"]), 0.0);
    }

    #[test]
    fn corruption_rate_nan_cap_propagates() {
        // Web Math.min(NaN, x) = NaN: NaN w korupcjaCap nie moze zniknac (zabija mutacje js_min bez galezi NaN).
        let p = CorruptionParams {
            wspolczynnik_dystansu: 2.0,
            wspolczynnik_miast: 1.0,
            cap: f64::NAN,
        };
        assert!(corruption_rate(5.0, 2.0, p).is_nan());
        assert!(corruption_rate(0.0, 0.0, p).is_nan());
    }

    #[test]
    fn happiness_from_built_ids_duplicate_catalog_ids_use_first_entry() {
        // Dwa wpisy o tym samym id: web `find` bierze PIERWSZY (zabija mutacje "ostatni wpis").
        const SWIATYNIA_DRUGA: HappinessCatalogEntry<'static> = HappinessCatalogEntry {
            id: "swiatynia",
            daje_szczescie: true,
            baza_zadowolenie: Some(7.0),
            przyrost_zadowolenie: 0.0,
        };
        let catalog = [SZCZESCIE, SWIATYNIA_DRUGA];
        let sum = sum_building_happiness_from_built_ids(&["swiatynia"], &catalog, |_| 1.0);
        // Pierwszy wpis: 1 + 2 = 3 (drugi dalby 1 + 7 = 8).
        assert_eq!(sum, 3.0);
    }

    #[test]
    fn city_entries_duplicate_catalog_ids_use_first_entry() {
        let catalog = [
            BuildingLevelCatalogEntry {
                id: "a",
                epoka_wejscia: 1.0,
                maks_poziom: 3.0,
                poziom_tech_gate: None,
            },
            BuildingLevelCatalogEntry {
                id: "a",
                epoka_wejscia: 2.0,
                maks_poziom: 1.0,
                poziom_tech_gate: None,
            },
        ];
        let out = city_building_entries_from_built_ids(&["a"], &catalog, 3.0, None);
        // Pierwszy wpis (indeks 0, poziom 3). Ostatni dalby indeks 1, poziom 1.
        assert_eq!(
            out,
            vec![CityBuildingLevel {
                catalog_index: 0,
                level: 3.0
            }]
        );
    }
}
