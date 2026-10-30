//! REPIN-WOJNA-2 (U3): port `gra/src/game/generals.ts` (pin `dc8a3adc`, plik nowy wzgledem `edb8fb56`).
//!
//! web: gra/src/game/generals.ts:1-4 (`generalLimitForEra`), :6-18 (`GeneralRosterCount`,
//! `generalSlotsUsed`, `canRecruitGeneral`), :20-23 (`stoneGeneralUnitId`), :25-43
//! (`attemptGeneralPurchase`), :45-53 (`generalFollowDestination`), :55-83 (`nearestLivingGeneral`,
//! `GeneralFollowCandidate`), :85-89 (`hexDistance`, prywatne), :91-103 (`planDeferredGeneralMarchBatch`).
//! Wektory: `tests/p6_repin_wojna_2_vectors/generals.json` (generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-generals-vectors.mjs`).
//!
//! ZALOZENIA (ZALOZENIE):
//! - Liczby webowe (`number`) sa `f64`, a `Math.max/min/floor` s semantyka JS (`recruitment::army_merge`).
//! - `undefined` i `false` dla pol `isGeneral`/`dead`/... sa rownowazne (web sprawdza `=== true`).
//! - `oblegaCityId` jest prawdziwe, gdy jest niepustym napisem (`Some("")` = falsy).
//! - `nearest_living_general` przy NaN we wspolrzednych KANDYDATA (>=2 kandydatow) daje wynik
//!   zalezny od algorytmu sortowania JS (komparator niespojny); NIE_ZMIERZONO - wektory tego nie pokrywaja.
//! - (e) `recruitment::manpower::locale_compare` (uzyty w komparatorze `compare_nearest`, web `localeCompare`)
//!   implementuje kolacje tylko dla ASCII 0x20-0x7E; dla innych napisow porownuje kolejnoscia UTF-16.
//!   ZMIERZONE (R-RUSTPORT-REPIN-WOJNA-2-Q1, obrona R2): web `"ą".localeCompare("b")` = -1, Rust = +1;
//!   `"é"` vs `"f"`, `"ł"` vs `"m"` - ta sama rozbieznosc (log `obrona-locale-probe-rust.log`, sonda Node
//!   `obrona-locale-probe.mjs`). Remis odleglosci przy identyfikatorach spoza ASCII NIE jest pokryty wektorami.
//!   Poza domena: identyfikatory produkcyjne sa ASCII (`prod_<turn>_<cityId>_<base36>`, `main.ts:4043`;
//!   `diffbonus_...`, `main.ts:9897`; brak identyfikatorow z non-ASCII w `gra/data` @ dc8a3adc).

use crate::domain::recruitment::army_merge::js_max;
use crate::domain::recruitment::manpower::locale_compare;
use std::cmp::Ordering;

/// Jednostka / generał w rosterze (pola z `GeneralFollowCandidate` i `GeneralQuickFollowUnit`).
/// Pola `Option` odpowiadaja polom opcjonalnym TS; `None` = `undefined`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct GeneralUnit {
    pub id: String,
    pub owner_id: f64,
    pub q: f64,
    pub r: f64,
    pub is_general: bool,
    pub hp: Option<f64>,
    pub dead: bool,
    pub removed: bool,
    pub routed: bool,
    pub in_garnizon: bool,
    pub oblega_city_id: Option<String>,
    pub follow_general: bool,
}

/// Web `generalLimitForEra` (`generals.ts:2-4`): `max(1, floor(era))`, dla nieskonczonego/NaN - 1.
pub fn general_limit_for_era(era: f64) -> f64 {
    if era.is_finite() {
        js_max(1.0, era.floor())
    } else {
        1.0
    }
}

/// Web `GeneralRosterCount` (`generals.ts:6-9`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GeneralRosterCount {
    pub alive: f64,
    pub queued: f64,
}

/// Web `generalSlotsUsed` (`generals.ts:12-14`).
pub fn general_slots_used(count: GeneralRosterCount) -> f64 {
    js_max(0.0, count.alive.floor()) + js_max(0.0, count.queued.floor())
}

/// Web `canRecruitGeneral` (`generals.ts:16-18`).
pub fn can_recruit_general(era: f64, count: GeneralRosterCount) -> bool {
    general_slots_used(count) < general_limit_for_era(era)
}

/// Web `stoneGeneralUnitId` (`generals.ts:21-23`).
pub fn stone_general_unit_id(has_wheel: bool) -> &'static str {
    if has_wheel {
        "Rydwan (woły)"
    } else {
        "Wojownik"
    }
}

/// Web `GeneralPurchaseRequest` (`generals.ts:25-34`). `offered_item_id`/`offered_cost` = `null` gdy `None`.
#[derive(Debug, Clone, PartialEq)]
pub struct GeneralPurchaseRequest {
    pub city_id: String,
    pub capital_city_id: String,
    pub era: f64,
    pub requested_quantity: f64,
    pub requested_item_id: String,
    pub requested_cost: f64,
    pub offered_item_id: Option<String>,
    pub offered_cost: Option<f64>,
    pub roster: GeneralRosterCount,
}

/// Web `attemptGeneralPurchase` (`generals.ts:37-43`): kontynuacja `purchase` tylko dla poprawnej oferty.
pub fn attempt_general_purchase(
    request: &GeneralPurchaseRequest,
    purchase: impl FnOnce() -> bool,
) -> bool {
    if request.requested_quantity != 1.0 || request.city_id != request.capital_city_id {
        return false;
    }
    match &request.offered_item_id {
        Some(offered) if !offered.is_empty() && *offered == request.requested_item_id => {}
        _ => return false,
    }
    match request.offered_cost {
        Some(cost) if cost == request.requested_cost => {}
        _ => return false,
    }
    if !can_recruit_general(request.era, request.roster) {
        return false;
    }
    purchase()
}

/// Cel podazania: punkt zywego generała i jego id (web `{ point, generalTargetId }`).
#[derive(Debug, Clone, PartialEq)]
pub struct FollowTarget {
    pub q: f64,
    pub r: f64,
    pub general_target_id: String,
}

/// Web `hexDistance` (`generals.ts:85-89`, prywatna; uzyta tez w `generalQuickFollow.ts:130-134`).
pub fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = aq - bq;
    let dr = ar - br;
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2.0
}

/// Web `unit.oblegaCityId` w kontekscie `if (... || unit.oblegaCityId)`: prawdziwe = niepusty napis.
pub fn oblega_truthy(oblega: &Option<String>) -> bool {
    oblega.as_deref().is_some_and(|s| !s.is_empty())
}

/// Web `generalFollowDestination` (`generals.ts:46-53`).
pub fn general_follow_destination(
    unit: &GeneralUnit,
    general: Option<&GeneralUnit>,
) -> Option<FollowTarget> {
    let general = general?;
    if !general.is_general
        || general.owner_id != unit.owner_id
        || unit.in_garnizon
        || oblega_truthy(&unit.oblega_city_id)
    {
        return None;
    }
    Some(FollowTarget {
        q: general.q,
        r: general.r,
        general_target_id: general.id.clone(),
    })
}

/// Web `nearestLivingGeneral` (`generals.ts:68-83`): najblizszy zywy generał wlasciciela (bez `unit`).
/// Sortowanie JS: po odleglosci, przy zerowej/NaN roznicy - `localeCompare` po id.
/// Wynik = `sort(cmp)[0]` po filtrze; sortowanie odtwarza V8 TimSort dla n < 64
/// (`v8_sort_small`), wiec daje ten sam wynik takze dla niespojnego komparatora (NaN wspolrzednej).
pub fn nearest_living_general<'a>(
    unit: &GeneralUnit,
    roster: &'a [GeneralUnit],
) -> Option<&'a GeneralUnit> {
    if unit.is_general || unit.dead || unit.removed || unit.routed {
        return None;
    }
    let mut eligible: Vec<&'a GeneralUnit> = roster
        .iter()
        .filter(|candidate| {
            candidate.id != unit.id
                && candidate.owner_id == unit.owner_id
                && candidate.is_general
                && !candidate.dead
                && !candidate.removed
                && !candidate.routed
                && candidate.hp.is_none_or(|hp| hp > 0.0)
        })
        .collect();
    v8_sort_small(&mut eligible, |a, b| compare_nearest(unit, a, b));
    eligible.first().copied()
}

/// Sortowanie jak V8 `Array.prototype.sort` (TimSort) dla n < 64: jeden przebieg
/// `CountAndMakeRun` (z ewentualnym odwroceniem) + `BinaryInsertionSort` (bez scalania,
/// bo dla n < 64 `minrun = n`). Porzadek kolejnosci wywolan komparatora zgodny z V8.
/// Dla n >= 64 wymagane byloby scalanie (ZALOZENIE: rostery generalow < 64).
fn v8_sort_small<T: Copy>(items: &mut [T], cmp: impl Fn(T, T) -> Ordering) {
    let n = items.len();
    if n < 2 {
        return;
    }
    // CountAndMakeRun(0, n)
    let descending = cmp(items[1], items[0]) == Ordering::Less;
    let mut run = 2;
    let mut previous = items[1];
    for &current in &items[2..] {
        let order = cmp(current, previous);
        let breaks = if descending {
            order != Ordering::Less
        } else {
            order == Ordering::Less
        };
        if breaks {
            break;
        }
        previous = current;
        run += 1;
    }
    if descending {
        items[..run].reverse();
    }
    // BinaryInsertionSort(0, run, n)
    for start in run..n {
        let pivot = items[start];
        let (mut left, mut right) = (0, start);
        while left < right {
            let mid = left + ((right - left) >> 1);
            if cmp(pivot, items[mid]) == Ordering::Less {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        items.copy_within(left..start, left + 1);
        items[left] = pivot;
    }
}

/// Komparator z `generals.ts:81-82`: `d || a.id.localeCompare(b.id)` (NaN i 0 sa falsy w JS).
fn compare_nearest(unit: &GeneralUnit, a: &GeneralUnit, b: &GeneralUnit) -> Ordering {
    let diff = hex_distance(unit.q, unit.r, a.q, a.r) - hex_distance(unit.q, unit.r, b.q, b.r);
    if diff > 0.0 {
        Ordering::Greater
    } else if diff < 0.0 {
        Ordering::Less
    } else {
        locale_compare(&a.id, &b.id).cmp(&0)
    }
}

/// Web `planDeferredGeneralMarchBatch` (`generals.ts:92-103`): planuje kolejno, `enqueue` tylko gdy cos zaplanowano.
pub fn plan_deferred_general_march_batch(
    unit_ids: &[String],
    mut plan_unit: impl FnMut(&str) -> bool,
    mut enqueue: impl FnMut(&[String]),
) -> Vec<String> {
    let mut marching = Vec::new();
    for unit_id in unit_ids {
        if plan_unit(unit_id) {
            marching.push(unit_id.clone());
        }
    }
    if !marching.is_empty() {
        enqueue(&marching);
    }
    marching
}
