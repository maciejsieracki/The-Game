//! P6.M07B-Q3 partia 3b: A* do morza z kopcem `RiverAStarOpenHeap`.
//! Web (pin `4bbef081d`, gen-helpers.ts): `RiverAStarOpenHeap` (:6342), `aStarRiverToSea` (:6388).
//! Kopiec jest wlasnoscia kodu gry (nie V8): kolejnosc remisow `(f, seq)` wynika wylacznie z
//! algorytmu sift-up/sift-down portowanego 1:1. Wektory: `tests/p6_m07b3_vectors/web-rivers-b-q3.json`.
//! Profiler `CIV_RIVER_PROFILE` (`aStarCalls`/`aStarMs`) NIE jest portowany (nie wplywa na wynik).
//! Mapa `stepDir` z weba jest tylko zapisywana, nigdy czytana - pominieta.

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::landsea::key_qr;
use crate::domain::mapgen::prims::{hex_key, HEX_DIRECTIONS};
use crate::domain::mapgen::rivers_a::walk::{
    can_river_drain_step, is_river_drainage_goal, reconstruct_river_path, river_step_dir,
    same_river_dir,
};
use crate::domain::mapgen::rivers_a::{can_river_flow_through, RiverCoord};
use crate::domain::mapgen::terrain_class::HexRecord;

/// Wpis kopca: `[fScore, seq, key]`.
pub type HeapEntry = (f64, u64, String);

/// Web `RiverAStarOpenHeap` (:6342): min-kopiec po `(f, seq)`.
#[derive(Debug, Default, Clone)]
pub struct RiverAStarOpenHeap {
    data: Vec<HeapEntry>,
}

fn less(a: &HeapEntry, b: &HeapEntry) -> bool {
    a.0 < b.0 || (a.0 == b.0 && a.1 < b.1)
}

impl RiverAStarOpenHeap {
    pub fn new() -> Self {
        Self::default()
    }

    /// Web `push(f, seq, key)` (:6345): dopisz na koniec i sift-up (`less(d[i], d[p])` -> swap).
    pub fn push(&mut self, f: f64, seq: u64, key: String) {
        let d = &mut self.data;
        d.push((f, seq, key));
        let mut i = d.len() - 1;
        while i > 0 {
            let p = (i - 1) >> 1;
            if less(&d[i], &d[p]) {
                d.swap(i, p);
                i = p;
            } else {
                break;
            }
        }
    }

    /// Web `pop()` (:6358): zdejmij korzen, ostatni na korzen, sift-down (lewy przed prawym).
    pub fn pop(&mut self) -> Option<HeapEntry> {
        let d = &mut self.data;
        if d.is_empty() {
            return None;
        }
        let last = d.pop().expect("niepusty");
        if d.is_empty() {
            return Some(last);
        }
        let top = std::mem::replace(&mut d[0], last);
        let mut i = 0usize;
        loop {
            let mut best = i;
            let l = 2 * i + 1;
            let r = l + 1;
            if l < d.len() && less(&d[l], &d[best]) {
                best = l;
            }
            if r < d.len() && less(&d[r], &d[best]) {
                best = r;
            }
            if best == i {
                break;
            }
            d.swap(i, best);
            i = best;
        }
        Some(top)
    }

    /// Web `get size()` (:6379).
    pub fn len(&self) -> usize {
        self.data.len()
    }

    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    /// Podglad tablicy kopca (do porownania ukladu z webem).
    pub fn as_slice(&self) -> &[HeapEntry] {
        &self.data
    }
}

/// Web `aStarRiverToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen, rand,
/// allowReliefTraversal)` (:6387). `max_len` = limit kosztu `g` (`curG >= maxLen` -> bez ekspansji,
/// `tg > maxLen + 2` -> odrzucony sasiad). Brak trasy -> `[start]`. `rand()` wolane tylko przy
/// kroku prostym (jak web: `inDir && sameRiverDir`).
#[allow(clippy::too_many_arguments)]
pub fn a_star_river_to_sea(
    hexes: &HexRecord,
    sq: i64,
    sr: i64,
    sea_dist: &HashMap<String, i64>,
    open_ocean_dist: &HashMap<String, i64>,
    ocean_connected: &HashSet<String>,
    max_len: usize,
    rand: &mut dyn FnMut() -> f64,
    allow_relief_traversal: bool,
) -> Vec<RiverCoord> {
    let start_k = hex_key(sq, sr);
    let Some(h0) = open_ocean_dist
        .get(&start_k)
        .or_else(|| sea_dist.get(&start_k))
        .map(|&v| v as f64)
    else {
        return Vec::new();
    };
    if ocean_connected.contains(&start_k) {
        return vec![RiverCoord::new(sq, sr)];
    }
    let max_len_f = max_len as f64;

    let mut g_score: HashMap<String, f64> = HashMap::new();
    g_score.insert(start_k.clone(), 0.0);
    let mut came_from: HashMap<String, String> = HashMap::new();
    let mut open: HashSet<String> = HashSet::new();
    open.insert(start_k.clone());
    let mut f_score: HashMap<String, f64> = HashMap::new();
    f_score.insert(start_k.clone(), h0);
    let mut heap = RiverAStarOpenHeap::new();
    let mut heap_seq: u64 = 0;
    heap.push(h0, heap_seq, start_k.clone());
    heap_seq += 1;

    let mut best_k = start_k.clone();
    let mut best_h = h0;

    while !open.is_empty() {
        let mut current: Option<String> = None;
        while !heap.is_empty() {
            let entry = heap.pop().expect("niepusty");
            let k = entry.2;
            if !open.contains(&k) {
                continue;
            }
            let f = f_score.get(&k).copied().unwrap_or(f64::INFINITY);
            if f != entry.0 {
                continue;
            }
            current = Some(k);
            break;
        }
        let Some(current) = current else {
            break;
        };

        let cur_g = g_score[&current];
        let cur_h = open_ocean_dist
            .get(&current)
            .map_or(f64::INFINITY, |&v| v as f64);
        let (q, r) = key_qr(&current).expect("klucz heksa");
        if cur_h < best_h {
            best_h = cur_h;
            best_k = current.clone();
        }
        if is_river_drainage_goal(q, r, hexes, &start_k, ocean_connected) {
            return reconstruct_river_path(&came_from, &current);
        }

        open.remove(&current);
        if cur_g >= max_len_f {
            continue;
        }

        let in_dir: Option<(i64, i64)> = came_from.get(&current).map(|prev| {
            let (pq, pr) = key_qr(prev).expect("klucz heksa");
            river_step_dir(RiverCoord::new(pq, pr), RiverCoord::new(q, r))
        });

        for (dq, dr) in HEX_DIRECTIONS {
            let (dq, dr) = (i64::from(dq), i64::from(dr));
            let nk = hex_key(q + dq, r + dr);
            if !can_river_flow_through(
                hexes.get(&nk),
                &nk,
                &start_k,
                true,
                None,
                allow_relief_traversal,
            ) {
                continue;
            }
            let nd = sea_dist.get(&nk).copied().unwrap_or(i64::MAX);
            if !can_river_drain_step(&nk, nd, open_ocean_dist, ocean_connected, true) {
                continue;
            }
            let mut step_cost = 1.0_f64;
            if let Some(d) = in_dir {
                if same_river_dir(d, (dq, dr)) {
                    step_cost += 0.18 + rand() * 0.12;
                }
            }
            let tg = cur_g + step_cost;
            if tg > max_len_f + 2.0 {
                continue;
            }
            if tg >= g_score.get(&nk).copied().unwrap_or(f64::INFINITY) {
                continue;
            }
            came_from.insert(nk.clone(), current.clone());
            g_score.insert(nk.clone(), tg);
            let nf = tg
                + open_ocean_dist
                    .get(&nk)
                    .map_or(f64::INFINITY, |&v| v as f64);
            f_score.insert(nk.clone(), nf);
            open.insert(nk.clone());
            heap.push(nf, heap_seq, nk);
            heap_seq += 1;
        }
    }

    if best_k != start_k {
        let (q, r) = key_qr(&best_k).expect("klucz heksa");
        if is_river_drainage_goal(q, r, hexes, &start_k, ocean_connected) {
            return reconstruct_river_path(&came_from, &best_k);
        }
    }
    vec![RiverCoord::new(sq, sr)]
}
