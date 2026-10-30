//! REPIN-EKONOMIA-D (krok 4b, partia D1): port `gra/src/game/work-tax.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/work-tax.ts:1-77 (caly plik): `WorkTaxConversion` (:2),
//! `taxForWorkAmount` (:8), `ownerCanConvertWorkToTax` (:14), `serializePendingWorkTax` (:26),
//! `restorePendingWorkTax` (:30), `convertWorkPoolToTax` (:43), `executeManualWorkTaxConversion` (:60).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Liczby JS (`number`) = `f64`; `Number.isFinite` = `f64::is_finite`. `Math.floor` = `f64::floor`,
//!   `Math.max(0, x)` = `x.max(0.0)` dla skonczonego `x` (wywolania sa za bramka `is_finite`).
//! - Identyfikator wlasciciela (`ownerId`) = `f64`, zeby zachowac semantyke `Number.isFinite`
//!   (NaN / Infinity odrzucane) bez zakladania typu identyfikatora w silniku.
//! - `restorePendingWorkTax` przyjmuje `serde_json::Value` (web: `unknown`). Liczba = `Value::Number`;
//!   string, null, bool, obiekt = nie-liczba (JS `Number.isFinite` zwraca false dla nie-`number`).
//! - JS `Map<number, number>` = `Vec<(f64, f64)>` w kolejnosci wstawiania. `set` na istniejacym
//!   kluczu zachowuje pozycje i nadpisuje wartosc (jak `Map.prototype.set`).
//! - `builtByCity` (web: `ReadonlyMap<string, readonly string[]>`) = `HashMap<String, Vec<String>>`;
//!   brak wpisu = pusta lista (web: `?? []`).
//! - `deps` (web: obiekt z trzema callbackami) = trait `WorkTaxDeps` (lustro kontraktu zywej gry).

use std::collections::HashMap;

use serde_json::Value;

/// Nazwa budynku dajacego prawo do zamiany Pracy na Podatek (web: `includes('targowisko')`).
const TARGOWISKO: &str = "targowisko";

/// Wynik jednorazowej konwersji (web: `WorkTaxConversion`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WorkTaxConversion {
    pub work_remaining: f64,
    pub work_spent: f64,
    pub tax_gained: f64,
}

/// Miasto z wlascicielem (web: `{ id: string; ownerId: number }`).
#[derive(Debug, Clone, PartialEq)]
pub struct CityOwner {
    pub id: String,
    pub owner_id: f64,
}

/// Zaleznosci zamiany (web: `deps` w `executeManualWorkTaxConversion`).
pub trait WorkTaxDeps {
    /// web: `getWorkPool(ownerId)`.
    fn get_work_pool(&self, owner_id: f64) -> f64;
    /// web: `setWorkPool(ownerId, value)`.
    fn set_work_pool(&mut self, owner_id: f64, value: f64);
    /// web: `queueTax(ownerId, tax)`.
    fn queue_tax(&mut self, owner_id: f64, tax: f64);
}

/// Podatek za ilosc pracy po kursie (web: `taxForWorkAmount`, work-tax.ts:8-12).
///
/// Nieskończona/NaN ilosc -> 0; nieskończony/NaN kurs -> 1; ujemne -> 0; wynik `floor`.
pub fn tax_for_work_amount(work: f64, rate: f64) -> f64 {
    let safe_work = if work.is_finite() {
        work.floor().max(0.0)
    } else {
        0.0
    };
    let safe_rate = if rate.is_finite() { rate.max(0.0) } else { 1.0 };
    (safe_work * safe_rate).floor()
}

/// Czy wlasciciel moze zamienic Prace na Podatek (web: `ownerCanConvertWorkToTax`, :14-24).
///
/// Warunek: wlasciciel jest czlowiekiem i ma miasto z `targowisko` w budynkach.
pub fn owner_can_convert_work_to_tax(
    owner_id: f64,
    is_human_owner: bool,
    cities: &[CityOwner],
    built_by_city: &HashMap<String, Vec<String>>,
) -> bool {
    is_human_owner
        && cities.iter().any(|city| {
            city.owner_id == owner_id
                && built_by_city
                    .get(&city.id)
                    .is_some_and(|built| built.iter().any(|b| b == TARGOWISKO))
        })
}

/// Serializacja oczekujacego podatku z pracy (web: `serializePendingWorkTax`, :26-29).
///
/// Zostawia wpisy o skonczonym kluczu, skonczonej kwocie i kwocie `> 0`, w kolejnosci mapy.
pub fn serialize_pending_work_tax(pending: &[(f64, f64)]) -> Vec<(f64, f64)> {
    pending
        .iter()
        .copied()
        .filter(|&(owner_id, amount)| owner_id.is_finite() && amount.is_finite() && amount > 0.0)
        .collect()
}

/// Odczyt oczekujacego podatku z zapisu (web: `restorePendingWorkTax`, :30-41).
///
/// Odrzuca wszystko, co nie jest tablica, oraz wiersze inne niz dwuelementowa tablica
/// z liczbami skonczonymi i kwota `> 0`. Duplikat klucza nadpisuje wartosc na istniejacej pozycji.
pub fn restore_pending_work_tax(saved: &Value) -> Vec<(f64, f64)> {
    let mut restored: Vec<(f64, f64)> = Vec::new();
    let Some(rows) = saved.as_array() else {
        return restored;
    };
    for row in rows {
        let Some(pair) = row.as_array() else {
            continue;
        };
        if pair.len() != 2 {
            continue;
        }
        let owner_id = json_finite(&pair[0]);
        let amount = json_finite(&pair[1]);
        if let (Some(owner_id), Some(amount)) = (owner_id, amount) {
            if amount > 0.0 {
                match restored.iter_mut().find(|(key, _)| *key == owner_id) {
                    Some(entry) => entry.1 = amount,
                    None => restored.push((owner_id, amount)),
                }
            }
        }
    }
    restored
}

/// Liczba JSON skonczona (web: `Number.isFinite` na wartosci `unknown`).
fn json_finite(value: &Value) -> Option<f64> {
    value.as_f64().filter(|x| x.is_finite())
}

/// Przelicza pule Pracy na Podatek bez skutkow ubocznych (web: `convertWorkPoolToTax`, :43-58).
///
/// Pula i zadanie: nieskończone/NaN -> 0, ulamki obcinane w dol, ujemne -> 0.
/// Praca jest zuzywana tylko gdy podatek > 0 (przy podatku 0 pula zostaje nietknieta).
pub fn convert_work_pool_to_tax(
    work_pool: f64,
    requested_work: f64,
    rate: f64,
    enabled: bool,
) -> WorkTaxConversion {
    let pool = if work_pool.is_finite() {
        work_pool.floor().max(0.0)
    } else {
        0.0
    };
    let request = if requested_work.is_finite() {
        requested_work.floor().max(0.0)
    } else {
        0.0
    };
    let candidate_work = if enabled { pool.min(request) } else { 0.0 };
    let candidate_tax = tax_for_work_amount(candidate_work, rate);
    let work_spent = if candidate_tax > 0.0 {
        candidate_work
    } else {
        0.0
    };
    WorkTaxConversion {
        work_remaining: pool - work_spent,
        work_spent,
        tax_gained: if candidate_tax > 0.0 {
            candidate_tax
        } else {
            0.0
        },
    }
}

/// Reczna konwersja z zapisem do zaleznosci (web: `executeManualWorkTaxConversion`, :60-77).
///
/// Zapis puli i kolejkowanie podatku tylko gdy `workSpent > 0`.
pub fn execute_manual_work_tax_conversion<D: WorkTaxDeps>(
    owner_id: f64,
    requested_work: f64,
    rate: f64,
    enabled: bool,
    deps: &mut D,
) -> WorkTaxConversion {
    let conversion =
        convert_work_pool_to_tax(deps.get_work_pool(owner_id), requested_work, rate, enabled);
    if conversion.work_spent > 0.0 {
        deps.set_work_pool(owner_id, conversion.work_remaining);
        deps.queue_tax(owner_id, conversion.tax_gained);
    }
    conversion
}
