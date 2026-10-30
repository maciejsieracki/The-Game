//! REPIN-WOJNA-NOWE-C: port `gra/src/game/ai-move-range.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/ai-move-range.ts:15 (`MoveCostFn`), :24 (`truncatePathWithinBudget`),
//! :61 (`farthestStepWithinBudget`), :83 (`buildHexOccupancy`), :101 (`claimHexForMove`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - heks = para `(q, r)` (web: klucz `"q,r"` z `keyOf`; wspolrzedne calkowite).
//! - `GameMap.hexes` + `costFn` zastapione mapa `hex_costs`: obecnosc klucza = `key in map.hexes`,
//!   wartosc = wynik `costFn(hex)` (`f64::INFINITY` = nieprzejezdny). Domyslny `terrainMoveCost`
//!   NIE jest tu portowany (wejscie wolajacego, jak `hex_costs` w czesci B).
//! - `blockedKeys` (web: `ReadonlySet<string>`) = `Option<&HashSet<(i64, i64)>>` (`None` = `undefined`).
//! - `buildHexOccupancy` / `claimHexForMove` sa generyczne po typie klucza `K` (web: `keyFn` zwraca
//!   string); licznik zajetosci = `u32` (liczba jednostek na heksie, >= 0).

use std::collections::{HashMap, HashSet};
use std::hash::Hash;

/// Heks: para `(q, r)`.
pub type Hex = (i64, i64);

/// Web: `truncatePathWithinBudget`. Najdluzszy prefiks `path` mieszczacy sie w `budget`
/// wg `hex_costs`. MIN-MOVE: przy `budget >= 1` pierwszy przejezdny heks zawsze wchodzi.
/// Pusta tablica, gdy `budget` nie jest > 0 (takze NaN) albo sciezka pusta.
pub fn truncate_path_within_budget(
    path: &[Hex],
    budget: f64,
    hex_costs: &HashMap<Hex, f64>,
) -> Vec<Hex> {
    if !(budget > 0.0) || path.is_empty() {
        return Vec::new();
    }
    let mut out: Vec<Hex> = Vec::new();
    let mut spent = 0.0_f64;
    for &h in path {
        // web: `if (hex === undefined) break;`
        let Some(&c) = hex_costs.get(&h) else {
            break;
        };
        // web: `if (c === Infinity) break;`
        if c == f64::INFINITY {
            break;
        }
        // web: `if (spent + c > budget) break;`
        if spent + c > budget {
            break;
        }
        spent += c;
        out.push(h);
    }
    if out.is_empty() {
        // web: MIN-MOVE -- `budget >= 1 && hex !== undefined && costFn(hex) !== Infinity`.
        let first = path[0];
        if let Some(&c) = hex_costs.get(&first) {
            if budget >= 1.0 && c != f64::INFINITY {
                out.push(first);
            }
        }
    }
    out
}

/// Web: `farthestStepWithinBudget`. Najdalszy heks trasy osiagalny w turze; cel (ostatni element)
/// jest krokiem tylko gdy nie jest zablokowany. `None` gdy budzet <= 0 (takze NaN) albo `path.len() < 2`
/// albo brak heksu wybieralnego (wolajacy wtedy uzywa `path[0]`).
pub fn farthest_step_within_budget(
    path: &[Hex],
    budget: f64,
    hex_costs: &HashMap<Hex, f64>,
    blocked: Option<&HashSet<Hex>>,
) -> Option<Hex> {
    if !(budget > 0.0) || path.len() < 2 {
        return None;
    }
    let cut = truncate_path_within_budget(path, budget, hex_costs);
    let mut end = cut.len();
    // web: `while (end > 0 && blockedKeys !== undefined && blockedKeys.has(key(cut[end-1]))) end--;`
    while end > 0 {
        match blocked {
            Some(set) if set.contains(&cut[end - 1]) => end -= 1,
            _ => break,
        }
    }
    if end > 0 {
        Some(cut[end - 1])
    } else {
        None
    }
}

/// Web: `buildHexOccupancy`. Licznik jednostek na kluczu `key_fn(q, r)`.
pub fn build_hex_occupancy<K: Eq + Hash>(
    units: &[Hex],
    key_fn: impl Fn(i64, i64) -> K,
) -> HashMap<K, u32> {
    let mut occ: HashMap<K, u32> = HashMap::new();
    for &(q, r) in units {
        let k = key_fn(q, r);
        *occ.entry(k).or_insert(0) += 1;
    }
    occ
}

/// Web: `claimHexForMove`. `false` (bez zmiany stanu), gdy heks docelowy jest zajety; przy sukcesie
/// przenosi licznik z heksu zrodlowego na docelowy (zrodlo bez licznika -> brak zmiany zrodla).
pub fn claim_hex_for_move<K: Eq + Hash + Clone>(
    occ: &mut HashMap<K, u32>,
    from: &K,
    to: &K,
) -> bool {
    if occ.get(to).copied().unwrap_or(0) > 0 {
        return false;
    }
    let n = occ.get(from).copied().unwrap_or(0);
    if n > 1 {
        occ.insert(from.clone(), n - 1);
    } else {
        occ.remove(from);
    }
    let t = occ.get(to).copied().unwrap_or(0);
    occ.insert(to.clone(), t + 1);
    true
}
