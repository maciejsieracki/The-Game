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

use crate::domain::ids::LEGACY_BARBARIAN_OWNER_ID;
use crate::domain::order_effects_lane::{PostCaptureLawFields, REBEL_FACTION_OWNER_ID};
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

/// Web `POST_CAPTURE_FRESH_TURNS` (`post-capture-law.ts`, = 5): bonus Prawa po swiezym podboju.
pub const POST_CAPTURE_FRESH_TURNS_PIN: f64 = 5.0;
/// Web `POST_CAPTURE_REBELLION_RECONQUEST_TURNS` (`post-capture-law.ts`, = 10): odbicie po buncie.
pub const POST_CAPTURE_RECONQUEST_TURNS_PIN: f64 = 10.0;

/// Web `applyPostCaptureLawOnCapture(city, newOwner, prevOwner)` (`game/post-capture-law.ts:62`).
///
/// Zwraca `None` gdy `prevOwner === newOwner` (web: wczesny `return`, bez zmian pol), w przeciwnym razie
/// `Some(reconquest)` (web `city.wasRebellionReconquest`). Kasuje `rebelPreviousOwnerId` i
/// `rebelProtectionTurnsRemaining` bezwarunkowo (jak web). Pole web `revoltGraceRemaining = null` NIE nalezy do
/// [`PostCaptureLawFields`] (NIE_ZMIERZONO w tym klocku: wolajacy musi je wyzerowac w module buntu, jesli istnieje).
pub fn apply_post_capture_law_on_capture(
    f: &mut PostCaptureLawFields,
    new_owner: i64,
    prev_owner: i64,
) -> Option<bool> {
    if prev_owner == new_owner {
        return None;
    }
    // web isRebellionReconquest: prevOwner === REBEL_FACTION_OWNER_ID && city.rebelPreviousOwnerId === newOwner.
    let reconquest =
        prev_owner == REBEL_FACTION_OWNER_ID && f.rebel_previous_owner_id == Some(new_owner);
    f.post_capture_law_turns_remaining = Some(if reconquest {
        POST_CAPTURE_RECONQUEST_TURNS_PIN
    } else {
        POST_CAPTURE_FRESH_TURNS_PIN
    });
    f.was_rebellion_reconquest = reconquest;
    f.rebel_previous_owner_id = None;
    f.rebel_protection_turns_remaining = None;
    Some(reconquest)
}

/// Web `wasProtectedRebel` (`main.ts`, galaz `resolveSiegeSurrender`): `city.rebelState === true` &&
/// `typeof rebelProtectionTurnsRemaining === 'number'` && `> 0`. Odczyt PRZED [`apply_post_capture_law_on_capture`].
pub fn was_protected_rebel(rebel_state: Option<bool>, f: &PostCaptureLawFields) -> bool {
    rebel_state == Some(true) && f.rebel_protection_turns_remaining.is_some_and(|n| n > 0.0)
}

/// Zadanie wojny z `triggerRebelProtectionWarConsequence` (web: `ownerDeclareWarOn(newOwner, rebelPrev, true, 'wymuszona_inna')`).
/// Sama deklaracja wojny lezy po stronie wolajacego (CallerSide: brak tu modelu dyplomacji).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RebelWarRequest {
    /// Web `newOwner` (deklarujacy = zdobywca).
    pub declarer: i64,
    /// Web `rebelPrevOwnerId` (cel = bylty wlasciciel miasta w oknie ochrony).
    pub target: i64,
}

/// Web `triggerRebelProtectionWarConsequence(wasProtectedRebel, rebelPrevOwnerId, newOwner)` (main.ts:13253).
/// Zwraca `Some` dokladnie wtedy, gdy web wywolalby `ownerDeclareWarOn`. Wyjatki web: brak flagi ochrony,
/// brak `rebelPrevOwnerId`, zdobywca = bylty wlasciciel, zdobywca = barbarzynca (`isBarbarian`, id -1).
pub fn rebel_protection_war_request(
    was_protected: bool,
    rebel_prev_owner: Option<i64>,
    new_owner: i64,
) -> Option<RebelWarRequest> {
    if !was_protected {
        return None;
    }
    let target = rebel_prev_owner?;
    if new_owner == target || new_owner == LEGACY_BARBARIAN_OWNER_ID {
        return None;
    }
    Some(RebelWarRequest {
        declarer: new_owner,
        target,
    })
}
