//! REPIN-WOJNA-NOWE-D (runda 3): minimalny port funkcji wyboru celu zaangazowania z
//! `gra/src/game/war-rules-multiwar.ts` (pin `dc8a3adc`), potrzebnych przez planer
//! `warAllInCapital` w galeziach W1/W2:
//! - `pickEngagementArmy` (web :~105, W1: najblizsza wroga armia w promieniu),
//! - `allocateGroupsToEnemies` (web :~150, W2: podzial CALYCH grup wg sily wrogow).
//!
//! Pozostale czesci `war-rules-multiwar.ts` (bramki R1/R2/R3, flagi, `WAR_RULES_PARAMS` z
//! `war-rules-params.json`) NIE sa portowane w tej partii. Planer dostaje promien jawnie
//! (web zawsze podaje `opts.engageRadius ?? 0`), wiec domyslna `engageRadiusHexes` nie jest
//! potrzebna.
//!
//! Zasada: `Ord` na `String` (ASCII) = porzadek web `<`; sortowania JS `Array.sort` z
//! komparatorem sa stabilne -- Rust `sort_by` jest stabilny (ten sam wynik).

use std::collections::{BTreeMap, HashMap};

/// Web `EngageArmyHex` (`war-rules-multiwar.ts`): wroga armia na heksie.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EngageArmyHex {
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
}

/// Web `ArmyGroupRef`: grupa armii (id + liczba jednostek).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ArmyGroupRef {
    pub id: String,
    pub size: i64,
}

/// Web `EnemyStrengthRef`: sila przeciwnika (`ownerId`, `strength`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EnemyStrengthRef {
    pub owner_id: i64,
    pub strength: i64,
}

/// Web `pickEngagementArmy` (`war-rules-multiwar.ts`, W1): najblizsza wroga armia w promieniu
/// `radius` od kotwicy. Remis dystansu: mniejsze q, potem r, potem mniejszy ownerId.
/// `None` gdy brak armii w promieniu (grupa maszeruje na stolice).
pub fn pick_engagement_army(
    anchor: (i32, i32),
    enemy_armies: &[EngageArmyHex],
    hex_distance: impl Fn(i32, i32, i32, i32) -> i64,
    radius: i64,
) -> Option<EngageArmyHex> {
    let mut best: Option<EngageArmyHex> = None;
    let mut best_d = i64::MAX;
    for e in enemy_armies {
        let d = hex_distance(anchor.0, anchor.1, e.q, e.r);
        if d > radius {
            continue;
        }
        let replace = match best {
            None => d < best_d,
            Some(b) => {
                d < best_d
                    || (d == best_d
                        && (e.q < b.q
                            || (e.q == b.q
                                && (e.r < b.r || (e.r == b.r && e.owner_id < b.owner_id)))))
            }
        };
        if replace {
            best = Some(*e);
            best_d = d;
        }
    }
    best
}

/// Web `allocateGroupsToEnemies` (`war-rules-multiwar.ts`, W2): przydzial CALYCH grup do
/// wrogow proporcjonalnie do sily. Najpierw (gdy grup wystarcza) kazdy wrog dostaje >= 1 grupe
/// (najsilniejszy -> najwieksza grupa), potem kazda reszta grup idzie do wroga z najwiekszym
/// deficytem (idealny udzial - przydzielone). Remis: mniejszy ownerId. Zwraca groupId -> ownerId.
pub fn allocate_groups_to_enemies(
    groups: &[ArmyGroupRef],
    enemies: &[EnemyStrengthRef],
) -> BTreeMap<String, i64> {
    let mut out: BTreeMap<String, i64> = BTreeMap::new();
    if groups.is_empty() || enemies.is_empty() {
        return out;
    }
    let mut enemies_sorted: Vec<EnemyStrengthRef> = enemies.to_vec();
    enemies_sorted.sort_by_key(|a| a.owner_id);
    let total_strength: f64 = enemies_sorted
        .iter()
        .map(|e| e.strength.max(0) as f64)
        .sum();
    let total_size: f64 = groups.iter().map(|g| g.size as f64).sum();
    let mut ideal: HashMap<i64, f64> = HashMap::new();
    for e in &enemies_sorted {
        let share = if total_strength > 0.0 {
            e.strength.max(0) as f64 / total_strength
        } else {
            1.0 / enemies_sorted.len() as f64
        };
        ideal.insert(e.owner_id, share * total_size);
    }
    let mut assigned: HashMap<i64, f64> =
        enemies_sorted.iter().map(|e| (e.owner_id, 0.0)).collect();

    // Porzadek grup: rozmiar malejaco, potem id rosnaco (JS: b.size - a.size || id).
    let mut order: Vec<&ArmyGroupRef> = groups.iter().collect();
    order.sort_by(|a, b| b.size.cmp(&a.size).then_with(|| a.id.cmp(&b.id)));

    let mut gi = 0usize;
    if order.len() >= enemies_sorted.len() {
        let mut by_strength = enemies_sorted.clone();
        by_strength.sort_by(|a, b| {
            b.strength
                .cmp(&a.strength)
                .then(a.owner_id.cmp(&b.owner_id))
        });
        for e in &by_strength {
            let g = order[gi];
            gi += 1;
            out.insert(g.id.clone(), e.owner_id);
            *assigned.entry(e.owner_id).or_insert(0.0) += g.size as f64;
        }
    }
    while gi < order.len() {
        let g = order[gi];
        gi += 1;
        let mut best_owner = enemies_sorted[0].owner_id;
        let mut best_deficit = f64::NEG_INFINITY;
        for e in &enemies_sorted {
            let deficit = ideal.get(&e.owner_id).copied().unwrap_or(0.0)
                - assigned.get(&e.owner_id).copied().unwrap_or(0.0);
            if deficit > best_deficit {
                best_deficit = deficit;
                best_owner = e.owner_id;
            }
        }
        out.insert(g.id.clone(), best_owner);
        *assigned.entry(best_owner).or_insert(0.0) += g.size as f64;
    }
    out
}
