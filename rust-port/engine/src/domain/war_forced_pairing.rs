//! P6-FORCED-WAR-MODULES-Q1 (runda 2, partia G2a): parowanie wojen wymuszonych i stan zapisu z
//! `gra/src/game/forced-war-common.ts` (pin `origin/main`), 1:1:
//! - `assignForcedWarPairings` (:~330-537): krok 1-2 pula warless + gracz pierwszy, parowanie 1v1
//!   (dokladne dopasowanie maksymalne na bitmasce, n <= 24; galaz zachlanna dla wiekszych n),
//!   krok 4 dolaczanie leftover jako trzeciego do istniejacej pary,
//! - `restoreForcedWarState` / `serializeForcedWarState` (:~520-537; Set/Map jako wektory w kolejnosci
//!   wstawiania, zgodnie z `Array.from`), `ForcedWarPairState` (:~17-35).
//!
//! Wektory: `tests/p6_forced_war_g2_data/cases.json` (generator `gen_cases_g2.mjs`, Node 22, prawdziwy web).
//! Odleglosc heksowa, predykaty blokad i liczniki sa wstrzykiwane (jak w webie).

use std::collections::{HashMap, HashSet};

use crate::domain::war_forced_common::{
    is_forced_war_relation_blocked, pick_forced_war_target_id, ForcedWarNeighborCandidate,
};

/// Web `ForcedWarEraTag` (forced-war-common.ts): era WLASNEGO mechanizmu tego ownera.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForcedWarEraTag {
    Bronze,
    Stone,
    Iron,
}

/// Web `ForcedWarPairingSubject`. `era == None` = gracz (ownerId 0, brak wlasnego mechanizmu).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedWarPairingSubject {
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub era: Option<ForcedWarEraTag>,
}

/// Web `ForcedWarPairingExistingPair` (kandydat do kroku 4).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedWarPairingExistingPair {
    pub attacker_id: i64,
    pub target_id: i64,
    pub era: ForcedWarEraTag,
}

/// Web `ForcedWarPairingAssignment`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedWarPairingAssignment {
    pub owner_id: i64,
    pub era: ForcedWarEraTag,
    pub target_id: i64,
}

/// Web `ForcedWarPairingResult`. `player_first_partner_id` = `null` w webie -> `None`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForcedWarPairingResult {
    pub assignments: Vec<ForcedWarPairingAssignment>,
    pub unresolved_owner_ids: Vec<i64>,
    pub player_first_partner_id: Option<i64>,
}

/// Web `opts.playerFirst` (R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1). `candidates` = `undefined` -> `None` (pula warless).
pub struct PlayerFirstOpts<'a> {
    pub player_owner_id: i64,
    pub is_player_pair_gate_open: &'a dyn Fn(i64) -> bool,
    pub candidates: Option<&'a [ForcedWarPairingSubject]>,
}

/// Web `ForcedWarPairingOpts`. Predykaty opcjonalne jak w webie (`None` = pole nieobecne).
pub struct ForcedWarPairingOpts<'a> {
    pub pair_relation_score: Option<&'a dyn Fn(i64, i64) -> f64>,
    pub is_pair_blocked: &'a dyn Fn(i64, i64) -> bool,
    pub is_era_war_exhausted: Option<&'a dyn Fn(i64) -> bool>,
    pub hex_distance: &'a dyn Fn(i32, i32, i32, i32) -> i64,
    pub total_active_forced_wars_by_owner: &'a dyn Fn(i64) -> i64,
    pub player_first: Option<PlayerFirstOpts<'a>>,
}

/// Maksymalne n dla dokladnego dopasowania (web `MAX_EXACT_MATCHING_N`).
pub const MAX_EXACT_MATCHING_N: usize = 24;

fn add_assignment(
    assignments: &mut Vec<ForcedWarPairingAssignment>,
    by_id: &HashMap<i64, ForcedWarPairingSubject>,
    actor_id: i64,
    target_id: i64,
) {
    // Gracz (era None) nigdy nie jest stroną akcji.
    let Some(era) = by_id.get(&actor_id).and_then(|s| s.era) else {
        return;
    };
    assignments.push(ForcedWarPairingAssignment {
        owner_id: actor_id,
        era,
        target_id,
    });
}

/// Dokladne dopasowanie maksymalne (DP na bitmasce) — rekurencja pomocnicza.
fn dp_match(mask: u32, n: usize, blocked: &[Vec<bool>], memo: &mut HashMap<u32, i64>) -> i64 {
    if mask == 0 {
        return 0;
    }
    if let Some(&cached) = memo.get(&mask) {
        return cached;
    }
    let i = mask.trailing_zeros() as usize;
    let mut best = dp_match(mask & !(1 << i), n, blocked, memo);
    for j in 0..n {
        if j == i || (mask & (1 << j)) == 0 || blocked[i][j] {
            continue;
        }
        let val = 1 + dp_match(mask & !(1 << i) & !(1 << j), n, blocked, memo);
        if val > best {
            best = val;
        }
    }
    memo.insert(mask, best);
    best
}

/// Web `assignForcedWarPairings` (forced-war-common.ts). Wolana RAZ na ture przed ownerLoop.
pub fn assign_forced_war_pairings(
    triggered_subjects: &[ForcedWarPairingSubject],
    existing_active_pairs: &[ForcedWarPairingExistingPair],
    opts: &ForcedWarPairingOpts<'_>,
) -> ForcedWarPairingResult {
    let mut assignments: Vec<ForcedWarPairingAssignment> = Vec::new();
    let mut unresolved: Vec<i64> = Vec::new();
    let pair_blocked = |a: i64, b: i64| -> bool {
        (opts.is_pair_blocked)(a, b)
            || matches!(opts.pair_relation_score, Some(f) if is_forced_war_relation_blocked(f(a, b)))
    };
    let exhausted = |id: i64| -> bool { opts.is_era_war_exhausted.is_some_and(|f| f(id)) };

    // Krok 1-2: pula warless (zero aktywnych wojen wymuszonych, licznik nie zuzyty), po ownerId.
    let mut warless_all: Vec<ForcedWarPairingSubject> = triggered_subjects
        .iter()
        .copied()
        .filter(|s| {
            (opts.total_active_forced_wars_by_owner)(s.owner_id) == 0 && !exhausted(s.owner_id)
        })
        .collect();
    warless_all.sort_by_key(|s| s.owner_id);

    let mut player_first_partner_id: Option<i64> = None;
    if let Some(pf) = &opts.player_first {
        if let Some(player_subject) = warless_all
            .iter()
            .find(|s| s.owner_id == pf.player_owner_id)
            .copied()
        {
            let mut pool: Vec<ForcedWarPairingSubject> = match pf.candidates {
                Some(c) => c.to_vec(),
                None => warless_all.clone(),
            };
            pool.sort_by_key(|s| s.owner_id);
            let mut best_dist = i64::MAX;
            let mut best_partner: Option<ForcedWarPairingSubject> = None;
            for cand in pool {
                if cand.owner_id == pf.player_owner_id || cand.era.is_none() {
                    continue;
                }
                if (opts.total_active_forced_wars_by_owner)(cand.owner_id) != 0 {
                    continue;
                }
                if exhausted(cand.owner_id) {
                    continue;
                }
                if pair_blocked(pf.player_owner_id, cand.owner_id) {
                    continue;
                }
                if !(pf.is_player_pair_gate_open)(cand.owner_id) {
                    continue;
                }
                let dist = (opts.hex_distance)(player_subject.q, player_subject.r, cand.q, cand.r);
                if dist < best_dist {
                    best_dist = dist;
                    player_first_partner_id = Some(cand.owner_id);
                    best_partner = Some(cand);
                }
            }
            if let Some(partner) = best_partner {
                // Gracz jest stroną-celem; wypowiada AI (era partnera, takze spoza puli).
                assignments.push(ForcedWarPairingAssignment {
                    owner_id: partner.owner_id,
                    era: partner.era.expect("partner gracza ma era (filtr wyzej)"),
                    target_id: pf.player_owner_id,
                });
            }
        }
        warless_all.retain(|s| s.owner_id != pf.player_owner_id);
    }

    let warless = warless_all;
    let by_id: HashMap<i64, ForcedWarPairingSubject> =
        warless.iter().map(|s| (s.owner_id, *s)).collect();
    let mut remaining: Vec<i64> = warless
        .iter()
        .map(|s| s.owner_id)
        .filter(|id| Some(*id) != player_first_partner_id)
        .collect();
    let mut leftovers: Vec<i64> = Vec::new();

    // Krok 3: nowe pary 1v1 wsrod warless -- dopasowanie MAKSYMALNE (dokladne dla n <= 24).
    if remaining.len() <= MAX_EXACT_MATCHING_N {
        let ids = remaining.clone();
        let n = ids.len();
        let blocked_idx: Vec<Vec<bool>> = (0..n)
            .map(|a| {
                (0..n)
                    .map(|b| a != b && pair_blocked(ids[a], ids[b]))
                    .collect()
            })
            .collect();
        let mut memo: HashMap<u32, i64> = HashMap::new();
        let full: u32 = if n == 0 { 0 } else { (1u32 << n) - 1 };
        dp_match(full, n, &blocked_idx, &mut memo);
        let mut mask = full;
        while mask != 0 {
            let i = mask.trailing_zeros() as usize;
            let seeker_id = ids[i];
            let seeker = by_id[&seeker_id];
            let mask_without = mask & !(1 << i);
            let target_best = dp_match(mask, n, &blocked_idx, &mut memo);
            let mut cand_idxs: Vec<usize> = (0..n)
                .filter(|&j| j != i && (mask & (1 << j)) != 0 && !blocked_idx[i][j])
                .collect();
            cand_idxs.sort_by(|&a, &b| {
                let ca = by_id[&ids[a]];
                let cb = by_id[&ids[b]];
                let da = (opts.hex_distance)(seeker.q, seeker.r, ca.q, ca.r);
                let db = (opts.hex_distance)(seeker.q, seeker.r, cb.q, cb.r);
                da.cmp(&db).then(ids[a].cmp(&ids[b]))
            });
            let mut matched: Option<usize> = None;
            for &j in &cand_idxs {
                let val = 1 + dp_match(mask_without & !(1 << j), n, &blocked_idx, &mut memo);
                if val == target_best {
                    matched = Some(j);
                    break;
                }
            }
            match matched {
                None => {
                    leftovers.push(seeker_id);
                    mask = mask_without;
                }
                Some(j) => {
                    let partner_id = ids[j];
                    add_assignment(&mut assignments, &by_id, seeker_id, partner_id);
                    add_assignment(&mut assignments, &by_id, partner_id, seeker_id);
                    mask = mask_without & !(1 << j);
                }
            }
        }
        remaining.clear();
    } else {
        // Galaz zachlanna (web: fallback poza realistycznym zakresem; n > 24).
        while !remaining.is_empty() {
            let seeker_id = remaining.remove(0);
            if remaining.is_empty() {
                leftovers.push(seeker_id);
                break;
            }
            let seeker = by_id[&seeker_id];
            let candidates: Vec<ForcedWarNeighborCandidate> = remaining
                .iter()
                .map(|id| {
                    let s = by_id[id];
                    ForcedWarNeighborCandidate {
                        owner_id: s.owner_id,
                        q: s.q,
                        r: s.r,
                    }
                })
                .collect();
            let blocked: HashSet<i64> = remaining
                .iter()
                .copied()
                .filter(|id| pair_blocked(seeker_id, *id))
                .collect();
            let partner = pick_forced_war_target_id(
                &candidates,
                Some((seeker.q, seeker.r)),
                |aq, ar, bq, br| (opts.hex_distance)(aq, ar, bq, br),
                &blocked,
            );
            let Some(partner_id) = partner else {
                leftovers.push(seeker_id);
                continue;
            };
            add_assignment(&mut assignments, &by_id, seeker_id, partner_id);
            add_assignment(&mut assignments, &by_id, partner_id, seeker_id);
            if let Some(idx) = remaining.iter().position(|&x| x == partner_id) {
                remaining.remove(idx);
            }
        }
    }

    // Krok 4: leftover dolacza jako trzeci do istniejacej pary (dowolnej epoki), obie strony niezablokowane.
    let mut pairs_sorted: Vec<ForcedWarPairingExistingPair> = existing_active_pairs
        .iter()
        .copied()
        .filter(|p| p.attacker_id != p.target_id)
        .collect();
    pairs_sorted.sort_by(|a, b| {
        a.attacker_id
            .cmp(&b.attacker_id)
            .then(a.target_id.cmp(&b.target_id))
    });

    for &leftover_id in &leftovers {
        let mut joined = false;
        for pair in &pairs_sorted {
            if pair.attacker_id == leftover_id || pair.target_id == leftover_id {
                continue;
            }
            let attacker_blocked = pair_blocked(leftover_id, pair.attacker_id);
            let target_blocked = pair_blocked(leftover_id, pair.target_id);
            if attacker_blocked || target_blocked {
                continue;
            }
            if exhausted(pair.attacker_id) || exhausted(pair.target_id) {
                continue;
            }
            let chosen_side = pair.attacker_id.min(pair.target_id);
            if leftover_id == 0 {
                assignments.push(ForcedWarPairingAssignment {
                    owner_id: chosen_side,
                    era: pair.era,
                    target_id: 0,
                });
            } else {
                add_assignment(&mut assignments, &by_id, leftover_id, chosen_side);
            }
            joined = true;
            break;
        }
        if !joined {
            unresolved.push(leftover_id);
        }
    }

    ForcedWarPairingResult {
        assignments,
        unresolved_owner_ids: unresolved,
        player_first_partner_id,
    }
}

// ---------------------------------------------------------------------------
// Stan zapisu (web `restoreForcedWarState` / `serializeForcedWarState`).
// Set/Map w webie = wektory w kolejnosci wstawiania (JS `Array.from`); duplikaty w zapisie
// zachowuja semantyke JS: Set odrzuca powtorki (pierwsze wystapienie wygrywa), Map nadpisuje
// wartosc pod pierwszym wystapieniem klucza.
// ---------------------------------------------------------------------------

/// Web `ForcedWarPairState` (forced-war-common.ts:17). `start_turn` = opcjonalne (stare zapisy).
#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarPairState {
    pub attacker_id: i64,
    pub target_id: i64,
    pub captured_by_attacker: i64,
    pub captured_by_defender: i64,
    pub start_turn: Option<f64>,
}

/// Web `ForcedWarSaveState` (forced-war-common.ts:31) po zdeserializowaniu do wektorow.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ForcedWarSaveState {
    pub pending_owners: Vec<i64>,
    pub cycle_owners: Vec<i64>,
    pub rest_until_by_owner: Vec<(i64, f64)>,
    pub active_by_pair_key: Vec<(String, ForcedWarPairState)>,
}

/// Zapis czesciowy (web `Partial<ForcedWarSaveState>`): brak pola = `None`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ForcedWarSavePartial {
    pub pending_owners: Option<Vec<i64>>,
    pub cycle_owners: Option<Vec<i64>>,
    pub rest_until_by_owner: Option<Vec<(i64, f64)>>,
    pub active_by_pair_key: Option<Vec<(String, ForcedWarPairState)>>,
}

fn ordered_set_i64(v: Vec<i64>) -> Vec<i64> {
    let mut seen: HashSet<i64> = HashSet::new();
    v.into_iter().filter(|x| seen.insert(*x)).collect()
}

fn ordered_map<K: PartialEq + Clone, V>(entries: Vec<(K, V)>) -> Vec<(K, V)> {
    let mut out: Vec<(K, V)> = Vec::new();
    for (k, v) in entries {
        if let Some(slot) = out.iter_mut().find(|(ek, _)| *ek == k) {
            slot.1 = v;
        } else {
            out.push((k, v));
        }
    }
    out
}

/// Web `restoreForcedWarState` (forced-war-common.ts:~537): brak `saved` / pola -> pusty stan dla pola.
pub fn restore_forced_war_state(saved: Option<&ForcedWarSavePartial>) -> ForcedWarSaveState {
    let Some(s) = saved else {
        return ForcedWarSaveState::default();
    };
    ForcedWarSaveState {
        pending_owners: ordered_set_i64(s.pending_owners.clone().unwrap_or_default()),
        cycle_owners: ordered_set_i64(s.cycle_owners.clone().unwrap_or_default()),
        rest_until_by_owner: ordered_map(s.rest_until_by_owner.clone().unwrap_or_default()),
        active_by_pair_key: ordered_map(s.active_by_pair_key.clone().unwrap_or_default()),
    }
}

/// Web `serializeForcedWarState` (forced-war-common.ts:~115): `Array.from(...)` = ta sama kolejnosc.
pub fn serialize_forced_war_state(state: &ForcedWarSaveState) -> ForcedWarSaveState {
    state.clone()
}
