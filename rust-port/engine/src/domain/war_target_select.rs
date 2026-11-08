//! P6-REPIN-AI-PRIORYTETY-CEL-Q1 (FALA 553, NEARCITY): wybor celu marszu AI w wojnie.
//!
//! Port 1:1 z `gra/src/game/ai-war-target-select.ts` (pin `origin/main` 14f2af1b0):
//! - `isNearestCityWarPair` (:39) -- para AI -> (AI lub gracz) objeta zasada "najblizsze miasto",
//! - `buildWarCityTargets` (:49) -- lista celow dla planera (AI -> wszystkie miasta wroga, inaczej stolica),
//! - remis odleglosci (`tieBeforeTarget` z `warAllInCapital.ts`, funkcja nieeksportowana w webie):
//!   gdy oba cele maja `defenders` -- slabiej broniony, potem nizsze id miasta; inaczej `cmpTarget`.
//!
//! Odstepstwo (ZALOZENIE, do akceptacji): `WarCapitalTarget` w Rust nie ma pola `defenders` (dodanie
//! dotknie testow poza allowlista). Liczba obroncow jest tu w osobnym typie `WarCityTarget`; do planera
//! trafia przez `split_city_targets` -> `plan_war_all_in_capital_with_defenders` (tie-break `defenders`
//! przy remisie odleglosci, `war_all_in_capital_plan.rs`). Wektory: `tests/p6_repin_ai_war_vectors.json`.

use std::collections::HashMap;

use crate::domain::pathfinding::ruch_jednostek::hex_distance;
use crate::domain::war_all_in_capital::WarCapitalTarget;

/// Web `WarTargetCity` (ai-war-target-select.ts:12).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WarTargetCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
}

/// Web `WarTargetUnit` (ai-war-target-select.ts:19): jednostka bojowa (bez cywilow i zwiadowcow).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WarTargetUnit {
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
}

/// Cel z liczba obroncow (web `WarCapitalTarget.defenders`); `defenders: None` = stolica (brak pola).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WarCityTarget {
    pub target: WarCapitalTarget,
    pub defenders: Option<i64>,
}

/// Web `isNearestCityWarPair` (ai-war-target-select.ts:39). Barbarzynca jako atakujacy lub cel -- poza zasada.
pub fn is_nearest_city_war_pair(
    self_owner_id: i64,
    target_owner_id: i64,
    is_human: impl Fn(i64) -> bool,
    is_barbarian: impl Fn(i64) -> bool,
) -> bool {
    !is_human(self_owner_id) && !is_barbarian(self_owner_id) && !is_barbarian(target_owner_id)
}

/// Wejscie `buildWarCityTargets` (web `BuildWarTargetsInput`).
pub struct BuildWarTargetsInput<'a> {
    pub self_owner_id: i64,
    /// Wlasciciele kandydujacy na wrogow (bez `self`, barbarzyncow, wyeliminowanych), posortowani.
    pub enemy_owner_ids: &'a [i64],
    pub engage: &'a dyn Fn(i64) -> bool,
    pub cities: &'a [WarTargetCity],
    /// Jednostki bojowe -- liczone jako obroncy miasta stojacy na jego heksie.
    pub combat_units: &'a [WarTargetUnit],
    pub is_human: &'a dyn Fn(i64) -> bool,
    pub is_barbarian: &'a dyn Fn(i64) -> bool,
    pub capital_city_id_for_owner: &'a dyn Fn(i64) -> Option<String>,
}

/// Web `buildWarCityTargets` (ai-war-target-select.ts:49).
pub fn build_war_city_targets(inp: &BuildWarTargetsInput<'_>) -> Vec<WarCityTarget> {
    let mut targets = Vec::new();
    for &o in inp.enemy_owner_ids {
        if !(inp.engage)(o) {
            continue;
        }
        if is_nearest_city_war_pair(inp.self_owner_id, o, inp.is_human, inp.is_barbarian) {
            for c in inp.cities.iter().filter(|c| c.owner_id == o) {
                let defenders = inp
                    .combat_units
                    .iter()
                    .filter(|u| u.owner_id == o && u.q == c.q && u.r == c.r)
                    .count() as i64;
                targets.push(WarCityTarget {
                    target: WarCapitalTarget {
                        owner_id: o,
                        city_id: c.id.clone(),
                        q: c.q,
                        r: c.r,
                    },
                    defenders: Some(defenders),
                });
            }
            continue;
        }
        let cap = (inp.capital_city_id_for_owner)(o)
            .and_then(|id| inp.cities.iter().find(|c| c.id == id && c.owner_id == o));
        if let Some(c) = cap {
            targets.push(WarCityTarget {
                target: WarCapitalTarget {
                    owner_id: o,
                    city_id: c.id.clone(),
                    q: c.q,
                    r: c.r,
                },
                defenders: None,
            });
        }
    }
    targets
}

/// Web `cmpTarget` (warAllInCapital.ts:405): q, potem r, potem id miasta.
fn cmp_target(a: &WarCapitalTarget, b: &WarCapitalTarget) -> std::cmp::Ordering {
    a.q.cmp(&b.q)
        .then(a.r.cmp(&b.r))
        .then(a.city_id.cmp(&b.city_id))
}

/// Web `tieBeforeTarget` (warAllInCapital.ts:413): czy `a` wyprzedza `b` przy remisie odleglosci.
fn tie_before_target(a: &WarCityTarget, b: &WarCityTarget) -> bool {
    match (a.defenders, b.defenders) {
        (Some(da), Some(db)) => {
            if da != db {
                da < db
            } else {
                a.target.city_id < b.target.city_id
            }
        }
        _ => cmp_target(&a.target, &b.target) == std::cmp::Ordering::Less,
    }
}

/// Rozbija cele na liste dla planera i mape `city_id -> defenders` (tylko cele miast; stolice bez wpisu).
pub fn split_city_targets(
    targets: &[WarCityTarget],
) -> (Vec<WarCapitalTarget>, HashMap<String, i64>) {
    let mut plain = Vec::with_capacity(targets.len());
    let mut defenders = HashMap::new();
    for t in targets {
        if let Some(d) = t.defenders {
            defenders.insert(t.target.city_id.clone(), d);
        }
        plain.push(t.target.clone());
    }
    (plain, defenders)
}

/// Web `nearestTarget` (warAllInCapital.ts, nieeksportowana) z tie-breakiem `tieBeforeTarget`.
pub fn nearest_war_city_target(
    q: i32,
    r: i32,
    targets: &[WarCityTarget],
) -> Option<&WarCityTarget> {
    let mut best: Option<&WarCityTarget> = None;
    let mut best_d = i64::MAX;
    for t in targets {
        let d = hex_distance(q, r, t.target.q, t.target.r);
        let replace = match best {
            None => true,
            Some(b) => d < best_d || (d == best_d && tie_before_target(t, b)),
        };
        if replace {
            best = Some(t);
            best_d = d;
        }
    }
    best
}
