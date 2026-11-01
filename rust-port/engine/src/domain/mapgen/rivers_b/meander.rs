//! P6.M07B-Q2 partia 2: krok meandru rzeki (wariant ku celowi, `findRiverMeanderStep`).
//! Web (pin `edb8fb56`, gen-helpers.ts:6485-6519).
//! Wektory: `tests/p6_m07b2_vectors/web-rivers-b-coast-grow.json` (`fn = meander`).

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::walk::{river_step_dir, same_river_dir};
use crate::domain::mapgen::rivers_a::{
    can_river_flow_through, RiverCoord, RIVER_MIN_INLAND_FROM_SEA,
};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `findRiverMeanderStep(hexes, cur, target, seaDist, used, rand)` (:6485). Kandydaci: sasiedzi
/// `cur` poza celem, nieuzyci, nie w kierunku celu, przechodni (blockExisting), nie blizej morza
/// (`nd <= curD`, `nd >= RIVER_MIN_INLAND_FROM_SEA`), dotykajacy celu. `rand()` tylko gdy sa
/// kandydaci. Brak sea_dist dla `cur` -> 999 (web `?? 999`).
pub fn find_river_meander_step(
    hexes: &HexRecord,
    cur: RiverCoord,
    target: RiverCoord,
    sea_dist: &HashMap<String, i64>,
    used: &HashSet<String>,
    rand: &mut dyn FnMut() -> f64,
) -> Option<RiverCoord> {
    let cur_k = hex_key(cur.q, cur.r);
    let cur_d = sea_dist.get(&cur_k).copied().unwrap_or(999);
    let tgt_k = hex_key(target.q, target.r);
    let to_target = river_step_dir(cur, target);
    let mut opts: Vec<RiverCoord> = Vec::new();

    for (dq, dr) in HEX_DIRECTIONS {
        let (dq, dr) = (i64::from(dq), i64::from(dr));
        let nq = cur.q + dq;
        let nr = cur.r + dr;
        let nk = hex_key(nq, nr);
        if nk == tgt_k || used.contains(&nk) {
            continue;
        }
        if same_river_dir((dq, dr), to_target) {
            continue;
        }
        // blockExisting: meander nie ma wpadac na heks innej, juz ulozonej rzeki (web :6496).
        if !can_river_flow_through(hexes.get(&nk), &nk, "", true, None, false) {
            continue;
        }
        let Some(&nd) = sea_dist.get(&nk) else {
            continue;
        };
        if nd > cur_d {
            continue;
        }
        if nd < RIVER_MIN_INLAND_FROM_SEA {
            continue;
        }
        let touches_target = HEX_DIRECTIONS
            .iter()
            .any(|&(eq, er)| nq + i64::from(eq) == target.q && nr + i64::from(er) == target.r);
        if !touches_target {
            continue;
        }
        opts.push(RiverCoord::new(nq, nr));
    }

    if opts.is_empty() {
        return None;
    }
    let idx = ((rand() * opts.len() as f64).floor() as usize).min(opts.len() - 1);
    Some(opts[idx])
}
