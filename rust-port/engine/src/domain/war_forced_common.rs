//! P6-FORCED-WAR-MODULES-Q1 (runda 1, partia G1): czyste helpery wojen wymuszonych z
//! `gra/src/game/forced-war-common.ts` (pin `origin/main`), 1:1:
//! - `pickForcedWarTargetId` (:40), `shouldEndForcedWarByCityCount` (:65),
//! - `countActiveWarsExcluding` (:84), `isRestingFromForcedWar` (:99),
//! - `countActiveForcedWarsForOwner` (:134), `isForcedEraPeaceLocked` (:176),
//! - `isForcedWarRelationBlocked` (:208) + `FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD` (:206).
//!
//! Wektory: `tests/p6_forced_war_g1_data/cases.json` (generator: Node 22 + `--experimental-strip-types`,
//! prawdziwe funkcje weba; jedyny patch to rozszerzenie `.ts` w imporcie).
//! Odleglosc heksowa: funkcja wstrzykiwana (jak w webie), w wektorach formula axialna.

use std::collections::HashSet;

/// Web `ForcedWarNeighborCandidate` (forced-war-common.ts:27).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedWarNeighborCandidate {
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
}

/// Web `pickForcedWarTargetId` (forced-war-common.ts:40): najblizszy kandydat do referencji
/// (remis: mniejszy ownerId); bez referencji -> najmniejszy ownerId. Zablokowani odpadaja.
/// `None` gdy brak uprawnionych kandydatow.
pub fn pick_forced_war_target_id(
    candidates: &[ForcedWarNeighborCandidate],
    reference_hex: Option<(i32, i32)>,
    hex_distance: impl Fn(i32, i32, i32, i32) -> i64,
    blocked_owner_ids: &HashSet<i64>,
) -> Option<i64> {
    let eligible: Vec<&ForcedWarNeighborCandidate> = candidates
        .iter()
        .filter(|c| !blocked_owner_ids.contains(&c.owner_id))
        .collect();
    if eligible.is_empty() {
        return None;
    }
    let Some((rq, rr)) = reference_hex else {
        return eligible.iter().map(|c| c.owner_id).min();
    };
    let mut best = eligible[0];
    let mut best_dist = hex_distance(best.q, best.r, rq, rr);
    for candidate in eligible.iter().skip(1) {
        let distance = hex_distance(candidate.q, candidate.r, rq, rr);
        if distance < best_dist || (distance == best_dist && candidate.owner_id < best.owner_id) {
            best = candidate;
            best_dist = distance;
        }
    }
    Some(best.owner_id)
}

/// Web `shouldEndForcedWarByCityCount` (forced-war-common.ts:65): prog miast (>=) po obu stronach.
pub fn should_end_forced_war_by_city_count(
    cities_captured_by_attacker: i64,
    cities_captured_by_defender: i64,
    threshold: i64,
) -> bool {
    cities_captured_by_attacker >= threshold || cities_captured_by_defender >= threshold
}

/// Web `countActiveWarsExcluding` (forced-war-common.ts:84): liczy wojny ownera z wykluczeniem
/// (np. barbarzyncow). Pomija samego ownera i wykluczonych.
pub fn count_active_wars_excluding(
    owner_id: i64,
    all_owner_ids: &[i64],
    is_at_war: impl Fn(i64, i64) -> bool,
    exclude_owner_id: impl Fn(i64) -> bool,
) -> i64 {
    let mut n = 0;
    for &oid in all_owner_ids {
        if oid == owner_id {
            continue;
        }
        if exclude_owner_id(oid) {
            continue;
        }
        if is_at_war(owner_id, oid) {
            n += 1;
        }
    }
    n
}

/// Web `isRestingFromForcedWar` (forced-war-common.ts:99): `restUntil != null && cur < restUntil`.
/// `None` = `undefined`/`null` w webie.
pub fn is_resting_from_forced_war(current_turn: f64, rest_until_turn: Option<f64>) -> bool {
    matches!(rest_until_turn, Some(rest) if current_turn < rest)
}

/// Web `countActiveForcedWarsForOwner` (forced-war-common.ts:134): liczy pary (atakujacy lub cel
/// = owner), BEZ filtra `targetId !== 0` (gracz liczy sie jako strona).
pub fn count_active_forced_wars_for_owner(
    owner_id: i64,
    all_active_forced_war_pairs: &[(i64, i64)],
) -> i64 {
    all_active_forced_war_pairs
        .iter()
        .filter(|(attacker, target)| *attacker == owner_id || *target == owner_id)
        .count() as i64
}

/// Web `isForcedEraPeaceLocked` (forced-war-common.ts:176): blokada pokoju trwa dopoki
/// `currentEra <= warEra`.
pub fn is_forced_era_peace_locked(current_era: i64, war_era: i64) -> bool {
    current_era <= war_era
}

/// Web `FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD` (forced-war-common.ts:206).
pub const FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD: f64 = 100.0;

/// Web `isForcedWarRelationBlocked` (forced-war-common.ts:208): relacja `>= 100` blokuje.
pub fn is_forced_war_relation_blocked(relation_score: f64) -> bool {
    relation_score >= FORCED_WAR_EPOCH_RELATION_BLOCK_THRESHOLD
}
