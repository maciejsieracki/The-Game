//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1: skutki przejecia miasta z galezi Transfer `resolveSiegeSurrender`,
//! ktorych brakowalo w [`crate::domain::siege_transfer::apply_transfer`].
//!
//! Pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75:
//! * `gra/src/game/cities.ts:1177-1182` (`stampCityFounderOnCapture`) i `:1235-1251` (`applyCapturePopulationLoss`),
//! * `gra/src/main.ts:17700` (wywolanie) oraz `:5123-5140` (`sanitizeProductionQueue(ownerId, prod)`).
//!
//! Zakres: utrata obywatela przy zdobyciu (`applyCapturePopulationLoss`) i sanityzacja kolejki produkcji
//! zdobywcy (`sanitizeProductionQueue(newOwner, ...)`). Obie funkcje sa czyste: zwracaja nowe wartosci,
//! a wolajacy (`apply_transfer_with_effects`) zapisuje je w miescie i dodaje kwoty Pracy do puli.
//!
//! NIE_ZMIERZONO: `wonderGateOk(ownerId, wid)` i `parseWonderProdId` leza po stronie wolajacego
//! (predykat `wonder_gate_ok`): w `rust-port/engine/src` nie ma odpowiednika (osobny temat).

use crate::domain::production_queue::{filter_queue, sanitize_build_queue};
use crate::domain::production_units::{CityProduction, ProductionItem};

/// Web `CAPTURE_POP_LOSS` = `miasto-params.json` `capture_pop_loss.wartosc` (= 1 w pinie).
pub const CAPTURE_POP_LOSS_PIN: u32 = 1;

/// Wejscie dla `applyCapturePopulationLoss(city, newOwner, prevOwner, rebelPrevOwnerSnapshot)` + pola
/// `stampCityFounderOnCapture`.
#[derive(Debug, Clone, PartialEq)]
pub struct CapturePopLossInput {
    /// Web `prevOwner` = `oldOwner` (wlasciciel przed przejeciem).
    pub prev_owner: i64,
    /// Web `newOwner` (zdobywca).
    pub new_owner: i64,
    /// Web `rebelPrevOwnerSnapshot` (`city.rebelPreviousOwnerId` odczytany PRZED kasowaniem buntu).
    pub rebel_prev_owner_snapshot: Option<i64>,
    /// Web `city.capturedFromOwnerId` (przed przejeciem).
    pub captured_from_owner_id: Option<i64>,
    /// Web `city.foundedBy` (`None` = pole nieobecne).
    pub founded_by: Option<i64>,
    /// Web `city.foundedByOwner` (`None` = pole nieobecne; `Some(false)` blokuje stemplowanie zalozyciela).
    pub found_by_owner: Option<bool>,
    /// Web `CAPTURE_POP_LOSS` (zwykle [`CAPTURE_POP_LOSS_PIN`]).
    pub capture_pop_loss: u32,
}

/// Wynik `applyCapturePopulationLoss`.
#[derive(Debug, Clone, PartialEq)]
pub struct CapturePopLossOutcome {
    /// Nowa populacja miasta (web `city.population` po wywolaniu).
    pub population: f64,
    /// Utracona liczba obywateli (web zwracana wartosc; `0` gdy odzyskanie lub brak straty).
    pub loss: f64,
    /// Web `city.capturedFromOwnerId = prevOwner` (zawsze zapisywane).
    pub captured_from_owner_id: i64,
    /// Web `city.foundedBy` po `stampCityFounderOnCapture`.
    pub founded_by: Option<i64>,
    /// Czy zdobycie jest odzyskaniem (zdobywca = poprzedni wlasciciel / wlasciciel sprzed buntu) -> 0 straty.
    pub reclaim: bool,
}

/// Web `applyCapturePopulationLoss(city, newOwner, prevOwner, rebelPrevOwnerSnapshot)` (cities.ts:1235).
///
/// Kolejnosc jak w web: `stampCityFounderOnCapture` -> decyzja o odzyskaniu -> `capturedFromOwnerId = prevOwner`
/// -> (0 gdy odzyskanie / param <= 0 / ludnosc <= 1) -> `max(1, before - param)`.
/// Ludnosc nieskonczona traktowana jak `0` (web `Number.isFinite(city.population) ? ... : 0`); `before <= 1` = 0 straty.
pub fn apply_capture_population_loss(
    population: f64,
    input: &CapturePopLossInput,
) -> CapturePopLossOutcome {
    // stampCityFounderOnCapture(city, prevOwner): if (foundedBy === undefined && foundedByOwner !== false) foundedBy = prevOwner.
    let founded_by = if input.founded_by.is_none() && input.found_by_owner != Some(false) {
        Some(input.prev_owner)
    } else {
        input.founded_by
    };
    let reclaim = input.new_owner == input.prev_owner
        || input.captured_from_owner_id == Some(input.new_owner)
        || input.rebel_prev_owner_snapshot == Some(input.new_owner);
    let captured_from_owner_id = input.prev_owner;
    if reclaim || input.capture_pop_loss == 0 {
        return CapturePopLossOutcome {
            population,
            loss: 0.0,
            captured_from_owner_id,
            founded_by,
            reclaim,
        };
    }
    let before = if population.is_finite() {
        population
    } else {
        0.0
    };
    if before <= 1.0 {
        return CapturePopLossOutcome {
            population,
            loss: 0.0,
            captured_from_owner_id,
            founded_by,
            reclaim,
        };
    }
    let after = (before - f64::from(input.capture_pop_loss)).max(1.0);
    CapturePopLossOutcome {
        population: after,
        loss: before - after,
        captured_from_owner_id,
        founded_by,
        reclaim,
    }
}

/// Wynik `sanitizeProductionQueue(ownerId, prod)` (main.ts:5123) w formie zwracanych kwot (Z-TR-3:
/// wolajacy dodaje je do puli Pracy, zamiast `setOwnerPracaPool` wewnatrz funkcji).
#[derive(Debug, Clone, PartialEq)]
pub struct OwnerQueueSanitize {
    /// Kolejka po `sanitizeBuildQueue` + `filterQueue(wonderGateOk)` (web `sanitized`).
    pub prod: CityProduction,
    /// Praca odzyskana z legacy jednostek (web `migrated.refundedPraca`, suma obu przebiegow).
    pub refunded_praca: f64,
    /// Zbankowany postep frontu odrzuconego przez bramke cudow (web `forfeitedPostep`).
    pub forfeited_postep: f64,
}

/// Web `sanitizeProductionQueue(ownerId, prod)`: `sanitizeBuildQueue` -> `filterQueue(keep = wonderGateOk)`.
///
/// `wonder_gate_ok(item)` = web `wonderGateOk(ownerId, wid)` dla pozycji cudu (`parseWonderProdId` != null);
/// dla pozycji niebedacych cudem wolajacy zwraca `true`. Druga `sanitizeBuildQueue` w web (na `migrated.prod`)
/// jest tu powtorzona 1:1 (jak w web, ktore wola ja dwa razy: wolajacy `sanitizeBuildQueue` oraz wewnatrz
/// `sanitizeProductionQueue`). Druga sanityzacja zwraca `refunded_praca = 0` i nie zmienia kolejki - to
/// zalozenie sprawdza test wektorowy `effects_queue_vectors_match_pin` (idempotencja na wektorach pinu).
pub fn sanitize_production_queue_for_owner(
    prod: &CityProduction,
    wonder_gate_ok: impl Fn(&ProductionItem) -> bool,
) -> OwnerQueueSanitize {
    let first = sanitize_build_queue(prod);
    let second = sanitize_build_queue(&first.prod);
    let filtered = filter_queue(&second.prod, |item| wonder_gate_ok(item));
    OwnerQueueSanitize {
        prod: filtered.prod,
        refunded_praca: first.refunded_praca + second.refunded_praca,
        forfeited_postep: filtered.forfeited_postep,
    }
}
