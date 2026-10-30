//! REPIN-WOJNA-NOWE-D (partia 1): nawigacja `warAllInCapital.ts` -- pole odleglosci, krok,
//! marsz wielokrokowy i wykrywanie trasy morskiej.
//!
//! web (pin `dc8a3adc`, `gra/src/game/warAllInCapital.ts`): :208 (`WarAllInNav`), :223
//! (`navMoveCost`), :228 (`distanceField`), :384 (`Goal`), :414 (`StepResult`), :419
//! (`StepState`), :430 (`isFreeFor`), :446 (`extendWalk`), :487 (`chooseStep`), :541
//! (`plannerRouteUsesSea`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - heks = `Klucz` `(q, r)` (web: napis `"q,r"` z `keyOf`); mapa = `RuchMapa` (web `GameMap.hexes`).
//! - `terrainMoveCost` / `embarkMoveCost` / `hexDistance` / `isWaterTerrain` z
//!   `domain::pathfinding::ruch_jednostek` (1:1 z `gra/src/units/setup.ts`).
//! - sasiedztwo = `teren.sasiedzi` z `ruch-jednostek-params.json` (kolejnosc = `HEX_NEIGHBORS`).
//! - `Goal.field` = `Rc<Field>` (web: wspolne pole per cel, memoizowane w planerze).
//! - kolejnosc kopca 1:1 z `distanceField` (remisy zalezne od sekwencji zamian).

use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use crate::data::derived::ruch_jednostek_params;
use crate::domain::pathfinding::ruch_jednostek::{
    embark_move_cost, hex_distance, is_water_terrain, terrain_move_cost, Klucz, RuchHex, RuchMapa,
};

use super::war_all_in_capital::{WarAllInMode, WarCapitalTarget};

/// Pole odleglosci: koszt dojscia z heksu do celu (tylko ustalone wartosci).
pub type Field = HashMap<Klucz, f64>;

/// Web `WarAllInNav` (`warAllInCapital.ts:208`).
#[derive(Debug, Clone, Copy)]
pub struct WarAllInNav<'a> {
    pub map: &'a RuchMapa,
    /// Web `allowSea?: boolean` (brak = false; czytane jako `=== true`).
    pub allow_sea: bool,
    /// Heksy statycznie nietranzytowe (obce miasta).
    pub blocked: &'a HashSet<Klucz>,
    /// Web `occupied?` (brak = pusty zbior).
    pub occupied: Option<&'a HashSet<Klucz>>,
}

/// Web `Goal` (`warAllInCapital.ts:384`).
#[derive(Debug, Clone)]
pub struct Goal {
    pub field: Rc<Field>,
    pub dest: Klucz,
    pub mode: WarAllInMode,
    pub target: WarCapitalTarget,
}

/// Web `StepState` (`warAllInCapital.ts:419`).
#[derive(Debug, Clone, Default)]
pub struct StepState {
    pub occupied: HashSet<Klucz>,
    pub claimed: HashSet<Klucz>,
    pub vacated: HashSet<Klucz>,
}

/// Web `StepResult` (`warAllInCapital.ts:414`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StepResult {
    Step(Klucz),
    Hold,
    NoPath,
}

/// Minimalny kopiec binarny 1:1 z `distanceField` (`warAllInCapital.ts:242-270`):
/// porownanie wylacznie po kluczu `key` (ostra mniejszosc `<`), te same zamiany przy push/pop.
#[derive(Debug, Clone)]
pub struct JsHeap<T> {
    items: Vec<T>,
    key: fn(&T) -> f64,
}

impl<T> JsHeap<T> {
    pub fn new(key: fn(&T) -> f64, first: T) -> Self {
        Self {
            items: vec![first],
            key,
        }
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    pub fn push(&mut self, entry: T) {
        self.items.push(entry);
        let mut i = self.items.len() - 1;
        while i > 0 {
            let parent = (i - 1) >> 1;
            if (self.key)(&self.items[parent]) <= (self.key)(&self.items[i]) {
                break;
            }
            self.items.swap(parent, i);
            i = parent;
        }
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.items.is_empty() {
            return None;
        }
        // `swap_remove(0)` zwraca szczyt i przenosi ostatni element na pozycje 0
        // (odpowiada `heap.pop()` + `heap[0] = last` z JS).
        let top = self.items.swap_remove(0);
        let len = self.items.len();
        let mut i = 0;
        loop {
            let l = 2 * i + 1;
            let r = 2 * i + 2;
            let mut sm = i;
            if l < len && (self.key)(&self.items[l]) < (self.key)(&self.items[sm]) {
                sm = l;
            }
            if r < len && (self.key)(&self.items[r]) < (self.key)(&self.items[sm]) {
                sm = r;
            }
            if sm == i {
                break;
            }
            self.items.swap(i, sm);
            i = sm;
        }
        Some(top)
    }
}

/// Web `hexNeighborCoords` (`setup.ts:623`): sasiedzi w kolejnosci `HEX_NEIGHBORS`.
pub fn hex_neighbour_keys(q: i32, r: i32) -> impl Iterator<Item = Klucz> {
    ruch_jednostek_params()
        .teren
        .sasiedzi
        .iter()
        .map(move |offset| (q + offset[0], r + offset[1]))
}

/// Web `navMoveCost` (`warAllInCapital.ts:223`).
pub fn nav_move_cost(nav: &WarAllInNav<'_>, hex: &RuchHex) -> f64 {
    let land = terrain_move_cost(hex);
    if land != f64::INFINITY {
        land
    } else if nav.allow_sea {
        embark_move_cost(hex)
    } else {
        f64::INFINITY
    }
}

/// Web `distanceField` (`warAllInCapital.ts:228`): Dijkstra wstecz od celu, zatrzymanie gdy
/// wszystkie heksy startowe ustalone; zwraca tylko ustalone wartosci.
pub fn distance_field(nav: &WarAllInNav<'_>, dest: Klucz, start_keys: &HashSet<Klucz>) -> Field {
    let mut dist: Field = HashMap::new();
    if !nav.map.contains(dest) {
        return dist;
    }
    let mut heap = JsHeap::new(|e: &(f64, i32, i32)| e.0, (0.0, dest.0, dest.1));
    dist.insert(dest, 0.0);
    let mut settled: HashSet<Klucz> = HashSet::new();
    let mut remaining = start_keys.len() as i64;
    while let Some((cost, cq, cr)) = heap.pop() {
        let ck = (cq, cr);
        if settled.contains(&ck) {
            continue;
        }
        if cost > dist.get(&ck).copied().unwrap_or(f64::INFINITY) {
            continue;
        }
        settled.insert(ck);
        if start_keys.contains(&ck) {
            remaining -= 1;
            if remaining <= 0 {
                break;
            }
        }
        let Some(hex) = nav.map.get(ck) else {
            continue;
        };
        if ck != dest {
            if nav_move_cost(nav, hex) == f64::INFINITY {
                continue;
            }
            if nav.blocked.contains(&ck) {
                continue;
            }
        }
        let raw = nav_move_cost(nav, hex);
        let enter = if ck == dest {
            if raw == f64::INFINITY {
                1.0
            } else {
                raw
            }
        } else {
            raw
        };
        for nk in hex_neighbour_keys(cq, cr) {
            if !nav.map.contains(nk) || settled.contains(&nk) {
                continue;
            }
            let nd = cost + enter;
            if nd < dist.get(&nk).copied().unwrap_or(f64::INFINITY) {
                dist.insert(nk, nd);
                heap.push((nd, nk.0, nk.1));
            }
        }
    }
    settled.into_iter().map(|k| (k, dist[&k])).collect()
}

/// Web `isFreeFor` (`warAllInCapital.ts:430`).
pub fn is_free_for(nav: &WarAllInNav<'_>, g: &Goal, st: &StepState, nk: Klucz) -> bool {
    if st.claimed.contains(&nk) {
        return false;
    }
    if nk != g.dest && nav.blocked.contains(&nk) {
        return false;
    }
    if st.occupied.contains(&nk) && !st.vacated.contains(&nk) {
        return false;
    }
    true
}

/// Web `extendWalk` (`warAllInCapital.ts:446`): marsz wielokrokowy w budzecie `budget`.
/// Zwraca pelna liste heksow trasy (pierwszy = `first`, ostatni = rozkaz `step`).
pub fn extend_walk(
    nav: &WarAllInNav<'_>,
    g: &Goal,
    st: &StepState,
    first: Klucz,
    budget: f64,
) -> Vec<Klucz> {
    let mut walk = vec![first];
    let Some(first_hex) = nav.map.get(first) else {
        return walk;
    };
    let mut spent = nav_move_cost(nav, first_hex);
    let Some(mut cur_dist) = g.field.get(&first).copied() else {
        return walk;
    };
    // Web `!(budget > 1)`: rowniez NaN konczy marsz wielokrokowy.
    if budget.is_nan() || budget <= 1.0 || first == g.dest || spent == f64::INFINITY {
        return walk;
    }
    let mut cur = first;
    loop {
        // best = (klucz, dn, enter)
        let mut best: Option<(Klucz, f64, f64)> = None;
        for nk in hex_neighbour_keys(cur.0, cur.1) {
            if nk == g.dest && nav.blocked.contains(&nk) {
                continue;
            }
            let Some(dn) = g.field.get(&nk).copied() else {
                continue;
            };
            if dn >= cur_dist {
                continue;
            }
            let Some(hex) = nav.map.get(nk) else {
                continue;
            };
            let enter = nav_move_cost(nav, hex);
            if enter == f64::INFINITY || spent + enter > budget {
                continue;
            }
            if !is_free_for(nav, g, st, nk) {
                continue;
            }
            let better = match best {
                None => true,
                Some((bk, bdn, _)) => {
                    dn < bdn || (dn == bdn && (nk.0 < bk.0 || (nk.0 == bk.0 && nk.1 < bk.1)))
                }
            };
            if better {
                best = Some((nk, dn, enter));
            }
        }
        let Some((bk, bdn, benter)) = best else {
            break;
        };
        walk.push(bk);
        spent += benter;
        cur_dist = bdn;
        cur = bk;
    }
    walk
}

/// Web `chooseStep` (`warAllInCapital.ts:487`): pierwszy krok wg pola; nigdy nie cofa.
pub fn choose_step(nav: &WarAllInNav<'_>, g: &Goal, u: Klucz, st: &StepState) -> StepResult {
    if u == g.dest {
        return StepResult::Hold;
    }
    let Some(du) = g.field.get(&u).copied() else {
        return StepResult::NoPath;
    };
    let u_dist = hex_distance(u.0, u.1, g.dest.0, g.dest.1);
    let mut prog: Option<Klucz> = None;
    let mut prog_cost = f64::INFINITY;
    let mut side: Option<Klucz> = None;
    let mut side_dist = i64::MAX;
    for nk in hex_neighbour_keys(u.0, u.1) {
        let Some(dn) = g.field.get(&nk).copied() else {
            continue;
        };
        let Some(hex) = nav.map.get(nk) else {
            continue;
        };
        let raw = nav_move_cost(nav, hex);
        let enter = if nk == g.dest {
            if raw == f64::INFINITY {
                1.0
            } else {
                raw
            }
        } else {
            if raw == f64::INFINITY {
                continue;
            }
            raw
        };
        if !is_free_for(nav, g, st, nk) {
            continue;
        }
        if dn < du {
            let total = enter + dn;
            let better = total < prog_cost
                || (total == prog_cost
                    && prog.is_some_and(|pk| nk.0 < pk.0 || (nk.0 == pk.0 && nk.1 < pk.1)));
            if better {
                prog_cost = total;
                prog = Some(nk);
            }
        } else if dn == du {
            let hd = hex_distance(nk.0, nk.1, g.dest.0, g.dest.1);
            if hd <= u_dist
                && (hd < side_dist
                    || (hd == side_dist
                        && side.is_some_and(|s| nk.0 < s.0 || (nk.0 == s.0 && nk.1 < s.1))))
            {
                side_dist = hd;
                side = Some(nk);
            }
        }
    }
    match prog.or(side) {
        Some(k) => StepResult::Step(k),
        None => StepResult::Hold,
    }
}

/// Web `plannerRouteUsesSea` (`warAllInCapital.ts:541`): odtwarza wybor kroku planera az do
/// celu i sprawdza, czy wybrana trasa wchodzi na wode.
pub fn planner_route_uses_sea(
    map: &RuchMapa,
    start: Klucz,
    target: &WarCapitalTarget,
    blocked: &HashSet<Klucz>,
    allow_sea: bool,
) -> bool {
    let dest = (target.q, target.r);
    let mut current = start;
    if current == dest {
        return false;
    }
    let nav = WarAllInNav {
        map,
        allow_sea,
        blocked,
        occupied: None,
    };
    let mut start_set = HashSet::new();
    start_set.insert(start);
    let field = distance_field(&nav, dest, &start_set);
    let mut used_sea = false;
    let max_steps = map.hexes.len();
    for _ in 0..max_steps {
        let Some(current_distance) = field.get(&current).copied() else {
            return false;
        };
        let mut best: Option<(Klucz, f64)> = None;
        for next in hex_neighbour_keys(current.0, current.1) {
            let Some(next_distance) = field.get(&next).copied() else {
                continue;
            };
            let Some(hex) = map.get(next) else {
                continue;
            };
            let mut enter = nav_move_cost(&nav, hex);
            if next == dest {
                if enter == f64::INFINITY {
                    enter = 1.0;
                }
            } else if enter == f64::INFINITY || blocked.contains(&next) {
                continue;
            }
            if next_distance >= current_distance {
                continue;
            }
            let total = enter + next_distance;
            let better = match best {
                None => true,
                Some((bk, bc)) => {
                    total < bc
                        || (total == bc && (next.0 < bk.0 || (next.0 == bk.0 && next.1 < bk.1)))
                }
            };
            if better {
                best = Some((next, total));
            }
        }
        let Some((next_key, _)) = best else {
            return false;
        };
        if next_key == dest {
            return used_sea;
        }
        used_sea = used_sea || map.get(next_key).is_some_and(|h| is_water_terrain(h.teren));
        current = next_key;
    }
    false
}
