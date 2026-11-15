//! REPIN-ARMIA-FOLLOW-AUTOMERGE (FALA 569, R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1):
//! port `gra/src/game/army-follow-auto-merge.ts` (`followLeaderAutoMergeDecision`) wraz z
//! helperami `gra/src/game/army-stack-limit.ts` potrzebnymi do jego decyzji (`ownUnitCountAt`,
//! `canJoinStackAt`). Baza: `origin/main` (web) i `rust-port/parity-v2` 3b15849b5 (Rust).
//!
//! web: army-follow-auto-merge.ts:17-22 (typ jednostki), :24-26 (`FollowAutoMergeDecision`),
//! :28-41 (`followLeaderAutoMergeDecision`); army-stack-limit.ts:24-38 (`ownUnitCountAt`),
//! :56-66 (`canJoinStackAt`); R-RUSTPORT-P4-1H-RJ-REPIN-Q3: :86-98 (`trimPathToStackRoom`, pin 07d2fbd72).
//!
//! ZALOZENIA (ZALOZENIE):
//! - Web `undefined` dla `followGeneral` / `isGeneral` jest tu `false`: warunki webowe
//!   `=== true` i `!== true` daja dla `undefined` ten sam wynik co dla `false`, wiec
//!   przeniesienie na `bool` nie zmienia decyzji (potwierdzone wektorami z weba, w tym `null`).
//! - `limit` to `i64` (web: `number`); wartosci calkowite, bez NaN/Infinity (limit armii
//!   pochodzi z jednego zrodla i jest zawsze dodatnia liczba calkowita).
//! - Web `canJoinStackAt` bierze wlasciciela z `moving[0]`; port robi to samo.
//! - Brak miejsca wywolania (`promptMergeIfCoLocated` w webowym main.ts) w Rust: tu jest tylko
//!   czysta decyzja. Podpiecie do ruchu / komend = dlug do serii W (NIE blokuje tematu).

use std::collections::HashSet;

/// Web `FollowAutoMergeUnit` (`followGeneral?`, `isGeneral?` -> `bool`, patrz zalozenia).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FollowAutoMergeUnit {
    pub id: String,
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    pub follow_general: bool,
    pub is_general: bool,
}

/// Web `FollowAutoMergeDecision` (`army-follow-auto-merge.ts:24`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FollowAutoMergeDecision {
    /// Web `'none'`: brak automatu, dotychczasowy monit.
    None,
    /// Web `'merge'`: scalenie bez monitu.
    Merge,
    /// Web `'limit-blocked'`: scalenie przekroczylby limit stosu, hint bez scalania.
    LimitBlocked,
}

/// Web `ownUnitCountAt` (`army-stack-limit.ts:24-38`): liczba WLASNYCH jednostek wlasciciela
/// na heksie (q,r), z pominieciem `except_ids`.
pub fn own_unit_count_at(
    units: &[FollowAutoMergeUnit],
    owner_id: i64,
    q: i64,
    r: i64,
    except_ids: &HashSet<&str>,
) -> i64 {
    units
        .iter()
        .filter(|u| u.owner_id == owner_id && u.q == q && u.r == r)
        .filter(|u| !except_ids.contains(u.id.as_str()))
        .count() as i64
}

/// Web `canJoinStackAt` (`army-stack-limit.ts:56-66`): czy `moving` moze sie scalic na (q,r)
/// bez przekroczenia `limit`. Jednostki z `moving`, ktore juz stoja na heksie, nie sa liczone
/// podwojnie. Pusty `moving` -> `true`.
pub fn can_join_stack_at(
    units: &[FollowAutoMergeUnit],
    moving: &[FollowAutoMergeUnit],
    q: i64,
    r: i64,
    limit: i64,
) -> bool {
    let Some(first) = moving.first() else {
        return true;
    };
    let moving_ids: HashSet<&str> = moving.iter().map(|u| u.id.as_str()).collect();
    let there = own_unit_count_at(units, first.owner_id, q, r, &moving_ids);
    there + moving.len() as i64 <= limit
}

/// Web `trimPathToStackRoom` (`army-stack-limit.ts:86-98`, pin `07d2fbd72`): przycina sciezke
/// ruchu od konca, az OSTATNI heks ma miejsce na caly ruszajacy sie stos (`can_join_stack_at`).
/// Wynik moze byc pusty (= nie ma gdzie stanac). `coords` wyciaga `(q, r)` z elementu sciezki
/// (web: generyczne `T extends {q, r}`). `limit` jest parametrem jak w webie (`armyStackLimit()` =
/// 500, `main.ts:4358-4360`).
pub fn trim_path_to_stack_room<T: Clone>(
    units: &[FollowAutoMergeUnit],
    moving: &[FollowAutoMergeUnit],
    path: &[T],
    coords: impl Fn(&T) -> (i64, i64),
    limit: i64,
) -> Vec<T> {
    let mut out = path.to_vec();
    while let Some(last) = out.last() {
        let (q, r) = coords(last);
        if can_join_stack_at(units, moving, q, r, limit) {
            break;
        }
        out.pop();
    }
    out
}

/// Web `followLeaderAutoMergeDecision` (`army-follow-auto-merge.ts:28-41`).
///
/// `arriving` = wchodzace jednostki; `existing` = wlasne jednostki juz stojace na (q,r);
/// `units` = pelna lista jednostek (do liczenia limitu stosu na heksie).
pub fn follow_leader_auto_merge_decision(
    units: &[FollowAutoMergeUnit],
    arriving: &[FollowAutoMergeUnit],
    existing: &[FollowAutoMergeUnit],
    q: i64,
    r: i64,
    limit: i64,
) -> FollowAutoMergeDecision {
    if arriving.is_empty() || existing.is_empty() {
        return FollowAutoMergeDecision::None;
    }
    if !arriving.iter().all(|u| u.follow_general && !u.is_general) {
        return FollowAutoMergeDecision::None;
    }
    if !existing.iter().any(|u| u.is_general) {
        return FollowAutoMergeDecision::None;
    }
    if !can_join_stack_at(units, arriving, q, r, limit) {
        return FollowAutoMergeDecision::LimitBlocked;
    }
    FollowAutoMergeDecision::Merge
}
