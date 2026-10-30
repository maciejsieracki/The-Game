//! REPIN-WOJNA-NOWE-D (partia 1): port `gra/src/game/warAllInCapital.ts` (pin `dc8a3adc`,
//! 859 linii). Zasada: w wojnie KAZDA sterowana automatycznie cywilizacja (AI, barbarzyncy)
//! wysyla wszystkie jednostki bojowe na AKTUALNA stolice wroga; laczenie w grupy po drodze.
//!
//! web (pin `dc8a3adc`): :37 (`WAR_ALLIN_CAPITAL_ENABLED`), :42 (`setWarAllInCapitalOverride`),
//! :46 (`isWarAllInCapitalEnabled`), :51 (`WarCapitalTarget`), :74 (`WarTargetRouteAvailability`),
//! :79 (`RoutedWarTargetCandidate`), :85 (`preferSeaReachableWarTargets`), :98
//! (`classifyWarTargetRoutes`), :306 (`WarAllInUnit`), :317 (`WarAllInOrder`), :345
//! (`WarAllInPlan`), :361-369 (parametry z JSON), :393 (`cmpTarget`), :397 (`nearestTarget`),
//! :593 (`planWarAllInCapital`).
//!
//! ZALOZENIA (zakres partii 1, NASTEPNA-PARTIA = reszta):
//! - W1/W2 (`enemyArmies`, `engageRadius`, `enemyStrength`; `war-rules-multiwar.ts`
//!   `pickEngagementArmy` / `allocateGroupsToEnemies`) NIE sa portowane w tej partii: modul
//!   `war-rules-multiwar` nie ma jeszcze portu w `rust-port/engine`. Tryb `engage` i etap 2a/2b
//!   sa zatem pominiete; wejscie to wylacznie flaga 'capital' + 'rendezvous' (= galaz W1/W2 OFF).
//! - `GameMap` = `RuchMapa`; klucz heksu = `Klucz` `(q, r)` zamiast napisu `"q,r"`.
//! - `WarAllInContext` (`ai.ts`/`barbarians.ts`/`main.ts`) poza zakresem: wolajacy podaje
//!   `targets` i `allow_sea` wprost.
//! - parametry balansowe: `src/domain/war_all_in_capital_params.json` (kopia 1:1
//!   `gra/data/war-allin-params.json` z pinu), ladowane przez `include_str!`. Odstepstwo od
//!   dispatchu (`rust-port/engine/data/`): ten katalog jest objety niezmiennikami
//!   `tests/data_loader.rs` (lista DATA_FILES) i `tests/data_compliance.rs` (12 probe, pin
//!   edb8fb56), a te pliki sa poza allowlista. Przeniesienie do `data/` + rejestracja loadera =
//!   osobna partia z rozszerzeniem allowlisty.
//! - sortowanie id: `Ord` na `String` (ASCII; web `<` na UTF-16 -- identyczne dla ASCII).

use std::cmp::Ordering;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::atomic::{AtomicI8, Ordering as AtomicOrdering};
use std::sync::OnceLock;

use crate::domain::pathfinding::ruch_jednostek::{
    embark_move_cost, hex_distance, is_water_terrain, terrain_move_cost, Klucz, RuchMapa,
};

use super::war_all_in_capital_nav::{hex_neighbour_keys, planner_route_uses_sea, JsHeap};

/// GLOWNA FLAGA (web `WAR_ALLIN_CAPITAL_ENABLED`, `warAllInCapital.ts:37`).
pub const WAR_ALLIN_CAPITAL_ENABLED: bool = true;

/// Web `overrideValue` (`null` = brak nadpisania). Kodowanie: -1 = null, 0 = false, 1 = true.
static OVERRIDE: AtomicI8 = AtomicI8::new(-1);

/// Web `setWarAllInCapitalOverride` (`warAllInCapital.ts:42`): tylko testy/diagnostyka.
pub fn set_war_all_in_capital_override(value: Option<bool>) {
    let encoded = match value {
        None => -1,
        Some(false) => 0,
        Some(true) => 1,
    };
    OVERRIDE.store(encoded, AtomicOrdering::Relaxed);
}

/// Web `isWarAllInCapitalEnabled` (`warAllInCapital.ts:46`).
pub fn is_war_all_in_capital_enabled() -> bool {
    match OVERRIDE.load(AtomicOrdering::Relaxed) {
        -1 => WAR_ALLIN_CAPITAL_ENABLED,
        v => v == 1,
    }
}

/// Web `WarCapitalTarget` (`warAllInCapital.ts:51`): cel = AKTUALNA stolica cywilizacji w wojnie.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WarCapitalTarget {
    pub owner_id: i64,
    pub city_id: String,
    pub q: i32,
    pub r: i32,
}

/// Web `WarTargetRouteAvailability` (`warAllInCapital.ts:74`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WarTargetRouteAvailability {
    pub land: bool,
    pub sea: bool,
}

/// Web `RoutedWarTargetCandidate` (`warAllInCapital.ts:79`).
pub trait RoutedWarTargetCandidate {
    fn land_reachable(&self) -> bool;
    fn sea_reachable(&self) -> bool;
}

/// Web `preferSeaReachableWarTargets` (`warAllInCapital.ts:85`): cele z trasa morska; inaczej
/// cele osiagalne ladem.
pub fn prefer_sea_reachable_war_targets<T: RoutedWarTargetCandidate + Clone>(
    candidates: &[T],
) -> Vec<T> {
    let sea: Vec<T> = candidates
        .iter()
        .filter(|c| c.sea_reachable())
        .cloned()
        .collect();
    if !sea.is_empty() {
        return sea;
    }
    candidates
        .iter()
        .filter(|c| c.land_reachable())
        .cloned()
        .collect()
}

/// Web `WarAllInUnit` (`warAllInCapital.ts:306`). `ruch_left` = web `ruchLeft` (`None` = 1 heks).
#[derive(Debug, Clone, PartialEq)]
pub struct WarAllInUnit {
    pub id: String,
    pub q: i32,
    pub r: i32,
    pub ruch_left: Option<f64>,
}

/// Web `mode` rozkazu (`warAllInCapital.ts:327`). 'engage' poza zakresem partii 1 (patrz ZALOZENIA).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WarAllInMode {
    Capital,
    Rendezvous,
}

/// Web `WarAllInOrder` (`warAllInCapital.ts:317`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WarAllInOrder {
    pub unit_id: String,
    /// Web `step`: ostatni heks trasy (rozkaz).
    pub step: Klucz,
    pub target_city_id: String,
    pub target_owner_id: i64,
    pub mode: WarAllInMode,
}

/// Web `WarAllInPlanOpts` (`warAllInCapital.ts:334`) -- bez pol W1/W2 (patrz ZALOZENIA).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct WarAllInPlanOpts {
    /// Web `marchMainGroupWhileRendezvous` (kampania wodza).
    pub march_main_group_while_rendezvous: bool,
}

/// Web `WarAllInPlan` (`warAllInCapital.ts:345`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct WarAllInPlan {
    /// Rozkazy W KOLEJNOSCI WYKONANIA (przod kolumny pierwszy).
    pub orders: Vec<WarAllInOrder>,
    /// Jednostki bez sciezki do zadnej stolicy (morze).
    pub no_path: Vec<String>,
    /// Jednostki swiadomie stojace w tej turze.
    pub held: Vec<String>,
    /// Diagnostyka: rozmiary grup per cel (cityId -> rozmiary).
    pub groups_by_target: BTreeMap<String, Vec<usize>>,
}

/// Parametry balansowe (web `warAllInParamsRaw`, `warAllInCapital.ts:27`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WarAllInParams {
    pub link_radius: i64,
    pub merge_radius: i64,
    pub no_merge_near_capital: i64,
}

fn load_params() -> WarAllInParams {
    const RAW: &str = include_str!("war_all_in_capital_params.json");
    let value: serde_json::Value =
        serde_json::from_str(RAW).expect("war-allin-params.json must parse");
    let read = |key: &str| -> i64 {
        value[key]["wartosc"]
            .as_i64()
            .unwrap_or_else(|| panic!("war-allin-params.json: brak wartosc dla {key}"))
    };
    WarAllInParams {
        link_radius: read("link_radius"),
        merge_radius: read("merge_radius"),
        no_merge_near_capital: read("no_merge_near_capital"),
    }
}

/// Web `WAR_ALLIN_LINK_RADIUS` / `WAR_ALLIN_MERGE_RADIUS` / `WAR_ALLIN_NO_MERGE_NEAR_CAPITAL`.
pub fn war_allin_params() -> &'static WarAllInParams {
    static PARAMS: OnceLock<WarAllInParams> = OnceLock::new();
    PARAMS.get_or_init(load_params)
}

/// Web `cmpTarget` (`warAllInCapital.ts:393`).
pub fn cmp_target(a: &WarCapitalTarget, b: &WarCapitalTarget) -> Ordering {
    a.q.cmp(&b.q)
        .then(a.r.cmp(&b.r))
        .then(a.city_id.cmp(&b.city_id))
}

/// Web `nearestTarget` (`warAllInCapital.ts:397`): najblizsza stolica od (q, r); remis = `cmpTarget`.
pub fn nearest_target(q: i32, r: i32, targets: &[WarCapitalTarget]) -> Option<&WarCapitalTarget> {
    let mut best: Option<&WarCapitalTarget> = None;
    let mut best_d = i64::MAX;
    for t in targets {
        let d = hex_distance(q, r, t.q, t.r);
        let replace = match best {
            None => true,
            Some(b) => d < best_d || (d == best_d && cmp_target(t, b) == Ordering::Less),
        };
        if replace {
            best = Some(t);
            best_d = d;
        }
    }
    best
}

/// Wynik sprawdzenia trasy: lista celow z osiagalnoscia (port `classifyWarTargetRoutes`).
/// Web `classifyWarTargetRoutes` (`warAllInCapital.ts:98`): trasa z punktu startowego do kazdej
/// stolicy. `land` = dowolna trasa ladowa; `sea` = dokladna trasa planera zawierajaca wode.
pub fn classify_war_target_routes(
    map: &RuchMapa,
    start: Klucz,
    targets: &[WarCapitalTarget],
    blocked: &HashSet<Klucz>,
    allow_sea: bool,
) -> HashMap<String, WarTargetRouteAvailability> {
    let mut result: HashMap<String, WarTargetRouteAvailability> = HashMap::new();
    if targets.is_empty() || !map.contains(start) {
        return result;
    }
    let mut target_by_hex: HashMap<Klucz, Vec<&WarCapitalTarget>> = HashMap::new();
    for target in targets {
        let key = (target.q, target.r);
        target_by_hex.entry(key).or_default().push(target);
        result.insert(
            target.city_id.clone(),
            WarTargetRouteAvailability {
                land: false,
                sea: false,
            },
        );
    }
    // (dystans, q, r, czy_uzyto_morza)
    type RouteEntry = (f64, i32, i32, bool);
    let mut heap = JsHeap::new(|e: &RouteEntry| e.0, (0.0, start.0, start.1, false));
    // Web: stan = `${keyOf}|${usedSea}`; tu klucz krotkowy (q, r, usedSea).
    let mut distance_by_state: HashMap<(i32, i32, bool), f64> = HashMap::new();
    distance_by_state.insert((start.0, start.1, false), 0.0);
    // Web `routeSteps`: cityId -> (land, sea) minimalne koszty.
    let mut route_steps: HashMap<String, (f64, f64)> = HashMap::new();
    for target in targets {
        let land = if start == (target.q, target.r) {
            0.0
        } else {
            f64::INFINITY
        };
        route_steps.insert(target.city_id.clone(), (land, f64::INFINITY));
    }
    while let Some((current_distance, q, r, used_sea)) = heap.pop() {
        if Some(&current_distance) != distance_by_state.get(&(q, r, used_sea)) {
            continue;
        }
        for next in hex_neighbour_keys(q, r) {
            let Some(hex) = map.get(next) else {
                continue;
            };
            let is_water = is_water_terrain(hex.teren);
            if is_water && !allow_sea {
                continue;
            }
            let enter_cost = if is_water {
                embark_move_cost(hex)
            } else {
                terrain_move_cost(hex)
            };
            if enter_cost == f64::INFINITY {
                continue;
            }
            let next_used_sea = used_sea || is_water;
            if let Some(goals) = target_by_hex.get(&next) {
                for goal in goals {
                    // Cel ma w `distanceField` koszt zero: wlasny koszt wejscia pomijany.
                    let cost = current_distance;
                    let entry = route_steps
                        .get_mut(&goal.city_id)
                        .expect("routeSteps zawiera kazdy cel");
                    if next_used_sea {
                        entry.1 = entry.1.min(cost);
                    } else {
                        entry.0 = entry.0.min(cost);
                    }
                }
                continue;
            }
            if blocked.contains(&next) {
                continue;
            }
            let next_state = (next.0, next.1, next_used_sea);
            let next_distance = current_distance + enter_cost;
            if next_distance
                >= distance_by_state
                    .get(&next_state)
                    .copied()
                    .unwrap_or(f64::INFINITY)
            {
                continue;
            }
            distance_by_state.insert(next_state, next_distance);
            heap.push((next_distance, next.0, next.1, next_used_sea));
        }
    }
    for target in targets {
        let (land, sea) = route_steps[&target.city_id];
        result.insert(
            target.city_id.clone(),
            WarTargetRouteAvailability {
                land: land.is_finite(),
                sea: sea.is_finite()
                    && planner_route_uses_sea(map, start, target, blocked, allow_sea),
            },
        );
    }
    result
}

pub use super::war_all_in_capital_plan::plan_war_all_in_capital;
