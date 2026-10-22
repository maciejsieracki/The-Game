//! P6.M10 - masy ladu, bramki startu i rozmieszczenie srodkow klastrow. Temat wlasciciel: R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1.
//! Zakres web (P6-25 §6): clusters.ts:59-126, 145-167, 176-1345, startScoring.ts:1-142.
//!
//! Port 1:1 (pin web `edb8fb56`) deklaracji `gra/src/map/clusters.ts` (masy ladu, bramki lokalnego
//! ladu i masy gracza, przydzial typow do mas, wybor srodkow klastrow, wyrownanie rozkladu) oraz
//! `gra/src/map/startScoring.ts` (punktacja i wybor hexu startu gracza).
//!
//! Zaleznosci spoza zakresu (WSTRZYKNIETE przez [`ClusterLayoutHooks`], bo naleza do M11,
//! `clusters.ts:1351-1769`): `seaDistAt`, `passesMinSeaDistGate`, `capitalSeaBandPenalty`,
//! `landQuadrantIndex`, `countCentersPerQuadrant`, `preferredQuadrantsForSpread`,
//! `minimumSpreadQuartersRequired`, `clusterCenterQuadrantSpread`, `minCapitalSeparationDistance`.
//! Po porcie M11 wystarczy zaimplementowac cecha na jego funkcjach (bez zmiany tego pliku).
//!
//! Sortowania: web `Array.prototype.sort` w V8 jest TimSortem (stabilnym), a w
//! `pickCenterInMassSpread` komparator WOŁA `rand()`; liczba i kolejnosc wywolan komparatora
//! zalezy wiec od algorytmu. [`js_array_sort_by`] odtwarza TimSort V8
//! (`third_party/v8/builtins/array-sort.tq`: scalanie z galopowaniem, `minGallop = 7`).
//!
//! Stale balansowe: `data/derived/mapgen-cluster-mass.json` i `data/derived/start-scoring.json`
//! (edytowalne). Brak literalow danych w kodzie; strukturalne `0`, `1`, `2` (indeksy, kroki,
//! polowa) zostaja w kodzie.

use std::borrow::Cow;
use std::collections::{HashMap, HashSet};

use crate::data::derived::{mapgen_cluster_mass, start_scoring};
use crate::domain::hex::HexCoord;
use crate::domain::map_generator::{GeneratedMap, HexTile, Terrain};
use crate::domain::mapgen::cluster_rivals::PointF64;
use crate::domain::mapgen::params::MapSizeLabel;
use crate::domain::unit_epoch::{civ_ids_available_at_game_epoch, CivEntryRow};

/// Zrodlo liczb losowych web `rand: () => number`.
pub type RandRef<'a> = &'a mut dyn FnMut() -> f64;

/// Web `seaDist: Map<string, number>` (klucz `"q,r"` -> odleglosc od morza).
pub type SeaDist = HashMap<(i32, i32), f64>;

// ---------------------------------------------------------------------------------------------
// Narzedzia: JS `||`, odleglosc, TimSort V8
// ---------------------------------------------------------------------------------------------

/// JS `a || b` dla liczb: `b`, gdy `a` jest falszywe (`0`, `-0`, `NaN`).
fn or0(a: f64, b: f64) -> f64 {
    if a == 0.0 || a.is_nan() {
        b
    } else {
        a
    }
}

/// Web `hexDistanceAxial` na liczbach rzeczywistych (kolejnosc dzialan jak w `gen-helpers.ts:135`).
fn dist_f(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

fn dist_hh(a: HexCoord, b: HexCoord) -> f64 {
    dist_f(
        f64::from(a.q),
        f64::from(a.r),
        f64::from(b.q),
        f64::from(b.r),
    )
}

fn dist_hp(a: HexCoord, p: PointF64) -> f64 {
    dist_f(f64::from(a.q), f64::from(a.r), p.q, p.r)
}

fn key_of(h: HexCoord) -> (i32, i32) {
    (h.q, h.r)
}

/// Sortowanie jak V8 `Array.prototype.sort(cmp)` (TimSort). `cmp` zwraca liczbe jak komparator
/// JS (`< 0`: pierwszy przed drugim); `NaN` liczy sie jako `0`. Kolejnosc argumentow i liczba
/// wywolan komparatora odpowiadaja V8 (istotne, gdy komparator losuje).
pub fn js_array_sort_by<T>(items: &mut Vec<T>, mut cmp: impl FnMut(&T, &T) -> f64) {
    let n = items.len();
    if n < 2 {
        return;
    }
    let order = {
        let mut compare = |x: usize, y: usize| -> f64 {
            let v = cmp(&items[x], &items[y]);
            if v.is_nan() {
                0.0
            } else {
                v
            }
        };
        let mut sorter = TimSort::new(n);
        sorter.sort(&mut compare);
        sorter.work
    };
    let mut taken: Vec<Option<T>> = std::mem::take(items).into_iter().map(Some).collect();
    for idx in order {
        items.push(taken[idx].take().expect("kazdy indeks wystepuje raz"));
    }
}

/// Algorytmiczna stala V8 (`kMinGallopWins`), nie balans.
const MIN_GALLOP_WINS: isize = 7;
/// Algorytmiczna stala V8 (`ComputeMinRunLength`: prog 64).
const MIN_RUN_THRESHOLD: usize = 64;

struct TimSort {
    work: Vec<usize>,
    runs: Vec<(usize, usize)>,
    min_gallop: isize,
}

type Cmp<'a> = &'a mut dyn FnMut(usize, usize) -> f64;

impl TimSort {
    fn new(n: usize) -> Self {
        Self {
            work: (0..n).collect(),
            runs: Vec::new(),
            min_gallop: MIN_GALLOP_WINS,
        }
    }

    fn min_run_length(mut n: usize) -> usize {
        let mut r = 0;
        while n >= MIN_RUN_THRESHOLD {
            r |= n & 1;
            n >>= 1;
        }
        n + r
    }

    fn sort(&mut self, cmp: Cmp) {
        let length = self.work.len();
        let mut low = 0usize;
        let mut remaining = length;
        let min_run = Self::min_run_length(remaining);
        while remaining != 0 {
            let mut current = self.count_and_make_run(low, low + remaining, cmp);
            if current < min_run {
                let forced = min_run.min(remaining);
                self.binary_insertion_sort(low, low + current, low + forced, cmp);
                current = forced;
            }
            self.runs.push((low, current));
            self.merge_collapse(cmp);
            low += current;
            remaining -= current;
        }
        self.merge_force_collapse(cmp);
    }

    fn count_and_make_run(&mut self, low_arg: usize, high: usize, cmp: Cmp) -> usize {
        let low = low_arg + 1;
        if low == high {
            return 1;
        }
        let mut run_length = 2usize;
        let element_low = self.work[low];
        let element_high = self.work[low - 1];
        let order = cmp(element_low, element_high);
        let is_descending = order < 0.0;
        let mut previous = element_low;
        let mut idx = low + 1;
        while idx < high {
            let current = self.work[idx];
            let order = cmp(current, previous);
            if is_descending {
                if order >= 0.0 {
                    break;
                }
            } else if order < 0.0 {
                break;
            }
            previous = current;
            run_length += 1;
            idx += 1;
        }
        if is_descending {
            self.work[low_arg..low_arg + run_length].reverse();
        }
        run_length
    }

    fn binary_insertion_sort(&mut self, low: usize, start_arg: usize, high: usize, cmp: Cmp) {
        let mut start = if low == start_arg {
            start_arg + 1
        } else {
            start_arg
        };
        while start < high {
            let mut left = low;
            let mut right = start;
            let pivot = self.work[right];
            while left < right {
                let mid = left + ((right - left) >> 1);
                let order = cmp(pivot, self.work[mid]);
                if order < 0.0 {
                    right = mid;
                } else {
                    left = mid + 1;
                }
            }
            let mut p = start;
            while p > left {
                self.work[p] = self.work[p - 1];
                p -= 1;
            }
            self.work[left] = pivot;
            start += 1;
        }
    }

    fn run_invariant_established(&self, n: isize) -> bool {
        if n < 2 {
            return true;
        }
        let n = n as usize;
        self.runs[n - 2].1 > self.runs[n - 1].1 + self.runs[n].1
    }

    fn merge_collapse(&mut self, cmp: Cmp) {
        while self.runs.len() > 1 {
            let mut n = self.runs.len() as isize - 2;
            if !self.run_invariant_established(n + 1) || !self.run_invariant_established(n) {
                if self.runs[(n - 1) as usize].1 < self.runs[(n + 1) as usize].1 {
                    n -= 1;
                }
                self.merge_at(n as usize, cmp);
            } else if self.runs[n as usize].1 <= self.runs[(n + 1) as usize].1 {
                self.merge_at(n as usize, cmp);
            } else {
                break;
            }
        }
    }

    fn merge_force_collapse(&mut self, cmp: Cmp) {
        while self.runs.len() > 1 {
            let mut n = self.runs.len() - 2;
            if n > 0 && self.runs[n - 1].1 < self.runs[n + 1].1 {
                n -= 1;
            }
            self.merge_at(n, cmp);
        }
    }

    fn merge_at(&mut self, i: usize, cmp: Cmp) {
        let (mut base_a, mut length_a) = self.runs[i];
        let (base_b, mut length_b) = self.runs[i + 1];
        self.runs[i].1 = length_a + length_b;
        if i + 3 == self.runs.len() {
            self.runs[i + 1] = self.runs[i + 2];
        }
        self.runs.pop();

        let key_right = self.work[base_b];
        let k = gallop_right(&self.work, key_right, base_a, length_a, 0, cmp);
        base_a += k;
        length_a -= k;
        if length_a == 0 {
            return;
        }
        let key_left = self.work[base_a + length_a - 1];
        length_b = gallop_left(&self.work, key_left, base_b, length_b, length_b - 1, cmp);
        if length_b == 0 {
            return;
        }
        if length_a <= length_b {
            self.merge_low(base_a, length_a, base_b, length_b, cmp);
        } else {
            self.merge_high(base_a, length_a, base_b, length_b, cmp);
        }
    }

    fn merge_low(
        &mut self,
        base_a: usize,
        mut length_a: usize,
        base_b: usize,
        mut length_b: usize,
        cmp: Cmp,
    ) {
        let temp: Vec<usize> = self.work[base_a..base_a + length_a].to_vec();
        let mut dest = base_a;
        let mut cursor_temp = 0usize;
        let mut cursor_b = base_b;

        self.work[dest] = self.work[cursor_b];
        dest += 1;
        cursor_b += 1;

        enum Exit {
            Succeed,
            CopyB,
        }
        let exit = 'outer: {
            length_b -= 1;
            if length_b == 0 {
                break 'outer Exit::Succeed;
            }
            if length_a == 1 {
                break 'outer Exit::CopyB;
            }
            let mut min_gallop = self.min_gallop;
            loop {
                let mut wins_a: isize = 0;
                let mut wins_b: isize = 0;
                loop {
                    let order = cmp(self.work[cursor_b], temp[cursor_temp]);
                    if order < 0.0 {
                        self.work[dest] = self.work[cursor_b];
                        dest += 1;
                        cursor_b += 1;
                        wins_b += 1;
                        length_b -= 1;
                        wins_a = 0;
                        if length_b == 0 {
                            break 'outer Exit::Succeed;
                        }
                        if wins_b >= min_gallop {
                            break;
                        }
                    } else {
                        self.work[dest] = temp[cursor_temp];
                        dest += 1;
                        cursor_temp += 1;
                        wins_a += 1;
                        length_a -= 1;
                        wins_b = 0;
                        if length_a == 1 {
                            break 'outer Exit::CopyB;
                        }
                        if wins_a >= min_gallop {
                            break;
                        }
                    }
                }
                min_gallop += 1;
                let mut first = true;
                while wins_a >= MIN_GALLOP_WINS || wins_b >= MIN_GALLOP_WINS || first {
                    first = false;
                    min_gallop = (min_gallop - 1).max(1);
                    self.min_gallop = min_gallop;
                    wins_a = gallop_right(&temp, self.work[cursor_b], cursor_temp, length_a, 0, cmp)
                        as isize;
                    if wins_a > 0 {
                        let w = wins_a as usize;
                        self.work[dest..dest + w]
                            .copy_from_slice(&temp[cursor_temp..cursor_temp + w]);
                        dest += w;
                        cursor_temp += w;
                        length_a -= w;
                        if length_a == 1 {
                            break 'outer Exit::CopyB;
                        }
                        if length_a == 0 {
                            break 'outer Exit::Succeed;
                        }
                    }
                    self.work[dest] = self.work[cursor_b];
                    dest += 1;
                    cursor_b += 1;
                    length_b -= 1;
                    if length_b == 0 {
                        break 'outer Exit::Succeed;
                    }
                    wins_b = gallop_left(&self.work, temp[cursor_temp], cursor_b, length_b, 0, cmp)
                        as isize;
                    if wins_b > 0 {
                        let w = wins_b as usize;
                        self.work.copy_within(cursor_b..cursor_b + w, dest);
                        dest += w;
                        cursor_b += w;
                        length_b -= w;
                        if length_b == 0 {
                            break 'outer Exit::Succeed;
                        }
                    }
                    self.work[dest] = temp[cursor_temp];
                    dest += 1;
                    cursor_temp += 1;
                    length_a -= 1;
                    if length_a == 1 {
                        break 'outer Exit::CopyB;
                    }
                }
                min_gallop += 1;
                self.min_gallop = min_gallop;
            }
        };
        match exit {
            Exit::Succeed => {
                if length_a > 0 {
                    self.work[dest..dest + length_a]
                        .copy_from_slice(&temp[cursor_temp..cursor_temp + length_a]);
                }
            }
            Exit::CopyB => {
                self.work.copy_within(cursor_b..cursor_b + length_b, dest);
                self.work[dest + length_b] = temp[cursor_temp];
            }
        }
    }

    fn merge_high(
        &mut self,
        base_a: usize,
        mut length_a: usize,
        base_b: usize,
        mut length_b: usize,
        cmp: Cmp,
    ) {
        let temp: Vec<usize> = self.work[base_b..base_b + length_b].to_vec();
        // Indeksy jako isize: `dest` i kursory schodza ponizej zera tylko tuz przed wyjsciem.
        let mut dest = (base_b + length_b) as isize - 1;
        let mut cursor_temp = length_b as isize - 1;
        let mut cursor_a = (base_a + length_a) as isize - 1;

        self.work[dest as usize] = self.work[cursor_a as usize];
        dest -= 1;
        cursor_a -= 1;

        enum Exit {
            Succeed,
            CopyA,
        }
        let exit = 'outer: {
            length_a -= 1;
            if length_a == 0 {
                break 'outer Exit::Succeed;
            }
            if length_b == 1 {
                break 'outer Exit::CopyA;
            }
            let mut min_gallop = self.min_gallop;
            loop {
                let mut wins_a: isize = 0;
                let mut wins_b: isize = 0;
                loop {
                    let order = cmp(temp[cursor_temp as usize], self.work[cursor_a as usize]);
                    if order < 0.0 {
                        self.work[dest as usize] = self.work[cursor_a as usize];
                        dest -= 1;
                        cursor_a -= 1;
                        wins_a += 1;
                        length_a -= 1;
                        wins_b = 0;
                        if length_a == 0 {
                            break 'outer Exit::Succeed;
                        }
                        if wins_a >= min_gallop {
                            break;
                        }
                    } else {
                        self.work[dest as usize] = temp[cursor_temp as usize];
                        dest -= 1;
                        cursor_temp -= 1;
                        wins_b += 1;
                        length_b -= 1;
                        wins_a = 0;
                        if length_b == 1 {
                            break 'outer Exit::CopyA;
                        }
                        if wins_b >= min_gallop {
                            break;
                        }
                    }
                }
                min_gallop += 1;
                let mut first = true;
                while wins_a >= MIN_GALLOP_WINS || wins_b >= MIN_GALLOP_WINS || first {
                    first = false;
                    min_gallop = (min_gallop - 1).max(1);
                    self.min_gallop = min_gallop;
                    let k = gallop_right(
                        &self.work,
                        temp[cursor_temp as usize],
                        base_a,
                        length_a,
                        length_a - 1,
                        cmp,
                    );
                    wins_a = (length_a - k) as isize;
                    if wins_a > 0 {
                        dest -= wins_a;
                        cursor_a -= wins_a;
                        let w = wins_a as usize;
                        self.work.copy_within(
                            (cursor_a + 1) as usize..(cursor_a + 1) as usize + w,
                            (dest + 1) as usize,
                        );
                        length_a -= w;
                        if length_a == 0 {
                            break 'outer Exit::Succeed;
                        }
                    }
                    self.work[dest as usize] = temp[cursor_temp as usize];
                    dest -= 1;
                    cursor_temp -= 1;
                    length_b -= 1;
                    if length_b == 1 {
                        break 'outer Exit::CopyA;
                    }
                    let k = gallop_left(
                        &temp,
                        self.work[cursor_a as usize],
                        0,
                        length_b,
                        length_b - 1,
                        cmp,
                    );
                    wins_b = (length_b - k) as isize;
                    if wins_b > 0 {
                        dest -= wins_b;
                        cursor_temp -= wins_b;
                        let w = wins_b as usize;
                        self.work[(dest + 1) as usize..(dest + 1) as usize + w].copy_from_slice(
                            &temp[(cursor_temp + 1) as usize..(cursor_temp + 1) as usize + w],
                        );
                        length_b -= w;
                        if length_b == 1 {
                            break 'outer Exit::CopyA;
                        }
                        if length_b == 0 {
                            break 'outer Exit::Succeed;
                        }
                    }
                    self.work[dest as usize] = self.work[cursor_a as usize];
                    dest -= 1;
                    cursor_a -= 1;
                    length_a -= 1;
                    if length_a == 0 {
                        break 'outer Exit::Succeed;
                    }
                }
                min_gallop += 1;
                self.min_gallop = min_gallop;
            }
        };
        match exit {
            Exit::Succeed => {
                if length_b > 0 {
                    let start = (dest - (length_b as isize - 1)) as usize;
                    self.work[start..start + length_b].copy_from_slice(&temp[0..length_b]);
                }
            }
            Exit::CopyA => {
                dest -= length_a as isize;
                cursor_a -= length_a as isize;
                self.work.copy_within(
                    (cursor_a + 1) as usize..(cursor_a + 1) as usize + length_a,
                    (dest + 1) as usize,
                );
                self.work[dest as usize] = temp[cursor_temp as usize];
            }
        }
    }
}

/// V8 `GallopLeft`: pozycja wstawienia `key` przed rownymi w `array[base..base+length]`.
fn gallop_left(
    array: &[usize],
    key: usize,
    base: usize,
    length: usize,
    hint: usize,
    cmp: Cmp,
) -> usize {
    let length = length as isize;
    let hint = hint as isize;
    let base = base as isize;
    let mut last_ofs: isize = 0;
    let mut offset: isize = 1;
    let order = cmp(array[(base + hint) as usize], key);
    if order < 0.0 {
        let max_ofs = length - hint;
        while offset < max_ofs {
            let order = cmp(array[(base + hint + offset) as usize], key);
            if order >= 0.0 {
                break;
            }
            last_ofs = offset;
            offset = (offset << 1) + 1;
        }
        if offset > max_ofs {
            offset = max_ofs;
        }
        last_ofs += hint;
        offset += hint;
    } else {
        let max_ofs = hint + 1;
        while offset < max_ofs {
            let order = cmp(array[(base + hint - offset) as usize], key);
            if order < 0.0 {
                break;
            }
            last_ofs = offset;
            offset = (offset << 1) + 1;
        }
        if offset > max_ofs {
            offset = max_ofs;
        }
        let tmp = last_ofs;
        last_ofs = hint - offset;
        offset = hint - tmp;
    }
    last_ofs += 1;
    while last_ofs < offset {
        let m = last_ofs + ((offset - last_ofs) >> 1);
        let order = cmp(array[(base + m) as usize], key);
        if order < 0.0 {
            last_ofs = m + 1;
        } else {
            offset = m;
        }
    }
    offset as usize
}

/// V8 `GallopRight`: pozycja wstawienia `key` za rownymi w `array[base..base+length]`.
fn gallop_right(
    array: &[usize],
    key: usize,
    base: usize,
    length: usize,
    hint: usize,
    cmp: Cmp,
) -> usize {
    let length = length as isize;
    let hint = hint as isize;
    let base = base as isize;
    let mut last_ofs: isize = 0;
    let mut offset: isize = 1;
    let order = cmp(key, array[(base + hint) as usize]);
    if order < 0.0 {
        let max_ofs = hint + 1;
        while offset < max_ofs {
            let order = cmp(key, array[(base + hint - offset) as usize]);
            if order >= 0.0 {
                break;
            }
            last_ofs = offset;
            offset = (offset << 1) + 1;
        }
        if offset > max_ofs {
            offset = max_ofs;
        }
        let tmp = last_ofs;
        last_ofs = hint - offset;
        offset = hint - tmp;
    } else {
        let max_ofs = length - hint;
        while offset < max_ofs {
            let order = cmp(key, array[(base + hint + offset) as usize]);
            if order < 0.0 {
                break;
            }
            last_ofs = offset;
            offset = (offset << 1) + 1;
        }
        if offset > max_ofs {
            offset = max_ofs;
        }
        last_ofs += hint;
        offset += hint;
    }
    last_ofs += 1;
    while last_ofs < offset {
        let m = last_ofs + ((offset - last_ofs) >> 1);
        let order = cmp(key, array[(base + m) as usize]);
        if order < 0.0 {
            offset = m;
        } else {
            last_ofs = m + 1;
        }
    }
    offset as usize
}

// ---------------------------------------------------------------------------------------------
// Typy (clusters.ts:101-125)
// ---------------------------------------------------------------------------------------------

/// Web `ClusterCity` (`clusters.ts:102`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ClusterCity {
    pub q: i32,
    pub r: i32,
    pub is_capital: bool,
}

/// Web `TypeCluster` (`clusters.ts:109`). `growth_slot`: `None` = klucz nieobecny,
/// `Some(None)` = `null`, `Some(Some(h))` = hex.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeCluster {
    pub typ_index: usize,
    pub typ: String,
    pub centrum: HexCoord,
    pub miasta: Vec<ClusterCity>,
    pub pending_state_slots: Option<Vec<HexCoord>>,
    pub growth_slot: Option<Option<HexCoord>>,
}

/// Web `ClusterSpawnCache` (`clusters.ts:121`).
#[derive(Debug, Clone, PartialEq)]
pub struct ClusterSpawnCache {
    pub sea_dist: SeaDist,
    pub land_cache: MassLandCache,
    pub ladowe: Vec<HexCoord>,
}

// ---------------------------------------------------------------------------------------------
// Zaleznosci wstrzykiwane (M11)
// ---------------------------------------------------------------------------------------------

/// Web `{ minQ, maxQ, minR, maxR }` (bbox ladu); pola `f64`, bo `Math.min()` pustej listy to
/// `Infinity`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LandBBox {
    pub min_q: f64,
    pub max_q: f64,
    pub min_r: f64,
    pub max_r: f64,
}

impl LandBBox {
    /// `Math.min/max(...ladowe.map(h => h.q/h.r))` (clusters.ts:1160-1165).
    pub fn from_hexes(ladowe: &[HexCoord]) -> Self {
        let mut b = Self {
            min_q: f64::INFINITY,
            max_q: f64::NEG_INFINITY,
            min_r: f64::INFINITY,
            max_r: f64::NEG_INFINITY,
        };
        for h in ladowe {
            b.min_q = b.min_q.min(f64::from(h.q));
            b.max_q = b.max_q.max(f64::from(h.q));
            b.min_r = b.min_r.min(f64::from(h.r));
            b.max_r = b.max_r.max(f64::from(h.r));
        }
        b
    }

    fn mid_q(&self) -> f64 {
        (self.min_q + self.max_q) / 2.0
    }

    fn mid_r(&self) -> f64 {
        (self.min_r + self.max_r) / 2.0
    }
}

/// Web `ClusterSpreadOpts` (`clusters.ts:1586`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ClusterSpreadOpts {
    pub n_needed: i64,
}

/// Wynik web `clusterCenterQuadrantSpread` (`clusters.ts:1603`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct QuadrantSpread {
    pub occupied_quadrants: usize,
    pub q_span: f64,
    pub r_span: f64,
}

/// Funkcje `clusters.ts:1351-1769` (M11) uzywane przez kod M10. Implementacja dostarcza je z
/// portu M11; M10 nie dubluje ich logiki.
pub trait ClusterLayoutHooks {
    /// `seaDistAt` (`clusters.ts:1420`): `seaDist.get(key) ?? 0`.
    fn sea_dist_at(&self, sea_dist: &SeaDist, q: i32, r: i32) -> f64;
    /// `passesMinSeaDistGate` (`clusters.ts:1428`).
    fn passes_min_sea_dist_gate(&self, sea_dist: &SeaDist, q: i32, r: i32, min_dist: f64) -> bool;
    /// `capitalSeaBandPenalty` (`clusters.ts:1452`).
    fn capital_sea_band_penalty(&self, sea: f64, min_dist: f64, max_dist: f64) -> f64;
    /// `landQuadrantIndex` (`clusters.ts:1555`).
    fn land_quadrant_index(&self, q: i32, r: i32, mid_q: f64, mid_r: f64) -> usize;
    /// `countCentersPerQuadrant` (`clusters.ts:1566`).
    fn count_centers_per_quadrant(
        &self,
        centers: &[HexCoord],
        mid_q: f64,
        mid_r: f64,
    ) -> [usize; 4];
    /// `preferredQuadrantsForSpread` (`clusters.ts:1589`): `None` = `null`.
    fn preferred_quadrants_for_spread(
        &self,
        quad_counts: &[usize; 4],
        n_needed: i64,
    ) -> Option<Vec<usize>>;
    /// `minimumSpreadQuartersRequired` (`clusters.ts:1579`).
    fn minimum_spread_quarters_required(&self, n_needed: i64) -> usize;
    /// `clusterCenterQuadrantSpread` (`clusters.ts:1603`).
    fn cluster_center_quadrant_spread(
        &self,
        centers: &[HexCoord],
        land_bbox: &LandBBox,
    ) -> QuadrantSpread;
    /// `minCapitalSeparationDistance` (`clusters.ts:1643`): `None` = `null`.
    fn min_capital_separation_distance(&self, c: HexCoord, others: &[HexCoord]) -> Option<f64>;
}

// ---------------------------------------------------------------------------------------------
// Roster (clusters.ts:69-95, 192-209)
// ---------------------------------------------------------------------------------------------

/// Web `ROSTER_KLUCZE` (`clusters.ts:69`) - dane w `mapgen-cluster-mass.json`.
pub fn roster_klucze() -> Vec<String> {
    mapgen_cluster_mass().roster_klucze.wartosc.clone()
}

/// Web `rosterKluczeForStartEpoch` (`clusters.ts:88`). Brak rosteru lub pusty/brak epoki:
/// caly roster.
pub fn roster_klucze_for_start_epoch(
    civ_roster: Option<&[CivEntryRow<'_>]>,
    start_epoch_id: Option<&str>,
) -> Vec<String> {
    let epoch = start_epoch_id.filter(|e| !e.is_empty());
    let (Some(rows), Some(epoch)) = (civ_roster, epoch) else {
        return roster_klucze();
    };
    let available: HashSet<&str> = civ_ids_available_at_game_epoch(rows, epoch)
        .into_iter()
        .collect();
    roster_klucze()
        .into_iter()
        .filter(|k| available.contains(k.as_str()))
        .collect()
}

/// Web `reorderRosterByPreference` (`clusters.ts:192`).
pub fn reorder_roster_by_preference(
    roster: &[String],
    preferred: Option<&[String]>,
) -> Vec<String> {
    let Some(preferred) = preferred.filter(|p| !p.is_empty()) else {
        return roster.to_vec();
    };
    let roster_set: HashSet<&str> = roster.iter().map(String::as_str).collect();
    let mut front: Vec<String> = Vec::new();
    let mut seen: HashSet<&str> = HashSet::new();
    for id in preferred {
        if !id.is_empty() && roster_set.contains(id.as_str()) && !seen.contains(id.as_str()) {
            front.push(id.clone());
            seen.insert(id.as_str());
        }
    }
    if front.is_empty() {
        return roster.to_vec();
    }
    let rest = roster
        .iter()
        .filter(|id| !seen.contains(id.as_str()))
        .cloned();
    front.into_iter().chain(rest).collect()
}

// ---------------------------------------------------------------------------------------------
// Rozmiar mapy (clusters.ts:145-166)
// ---------------------------------------------------------------------------------------------

/// Web `mapSizeLabel` (`clusters.ts:152`): progi pola z `mapgen-cluster-mass.json`
/// (te same liczby co `params::map_size_label_from_dims`, dowod w tescie).
pub fn map_size_label(w: i64, h: i64) -> MapSizeLabel {
    let area = (w * h) as f64;
    let t = &mapgen_cluster_mass().rozmiar_mapy;
    let key = t
        .progi_pola
        .iter()
        .find(|s| area < s.ponizej)
        .map_or(t.w_przeciwnym_razie.etykieta.as_str(), |s| {
            s.etykieta.as_str()
        });
    MapSizeLabel::from_key(key)
        .unwrap_or_else(|| panic!("mapgen-cluster-mass.json: nieznana etykieta rozmiaru {key}"))
}

/// Web `aktywneTypyFromSize` (`clusters.ts:161`).
pub fn aktywne_typy_from_size(label: MapSizeLabel) -> i64 {
    let a = &mapgen_cluster_mass().rozmiar_mapy.aktywne_typy;
    match label {
        MapSizeLabel::Mala => a.mala.wartosc,
        MapSizeLabel::Srednia => a.srednia.wartosc,
        MapSizeLabel::Duza => a.duza.wartosc,
        MapSizeLabel::Ogromna => a.ogromna.wartosc,
        MapSizeLabel::Super => a.super_.wartosc,
    }
}

// ---------------------------------------------------------------------------------------------
// Stale (clusters.ts:211-248) - wartosci z tabeli
// ---------------------------------------------------------------------------------------------

/// `MIN_MASS_HEXES_FOR_CENTER` (`clusters.ts:212`, prywatna).
pub fn min_mass_hexes_for_center() -> i64 {
    mapgen_cluster_mass().masy.min_masa_srodka_hex.wartosc
}

/// `MIN_MASS_HEXES_FOR_SPAWN` (`clusters.ts:217`).
pub fn min_mass_hexes_for_spawn() -> i64 {
    mapgen_cluster_mass().masy.min_masa_spawn_hex.wartosc
}

/// `MIN_DEVELOPMENT_HEX_PER_CIV` (`clusters.ts:222`).
pub fn min_development_hex_per_civ() -> i64 {
    mapgen_cluster_mass()
        .masy
        .min_przestrzen_rozwoju_na_cywilizacje
        .wartosc
}

/// `SMALL_MASS_CAP_THRESHOLD` (`clusters.ts:224`) = mnoznik * `MIN_DEVELOPMENT_HEX_PER_CIV`.
pub fn small_mass_cap_threshold() -> i64 {
    mapgen_cluster_mass().masy.prog_malej_masy_mnoznik.wartosc * min_development_hex_per_civ()
}

/// `DEVELOPMENT_SPACE_RADIUS` (`clusters.ts:226`).
pub fn development_space_radius() -> i64 {
    mapgen_cluster_mass()
        .masy
        .promien_przestrzeni_rozwoju
        .wartosc
}

/// `ISLAND_FALLBACK_MASS_FRAC` (`clusters.ts:228`).
pub fn island_fallback_mass_frac() -> f64 {
    mapgen_cluster_mass()
        .masy
        .frakcja_wyspy_najwiekszej_masy
        .wartosc
}

/// `FOREIGN_MASS_MIN_ABSOLUTE` (`clusters.ts:233`).
pub fn foreign_mass_min_absolute() -> i64 {
    mapgen_cluster_mass().masy.obca_masa_min_bezwzgledny.wartosc
}

/// `FOREIGN_MASS_FRAC_OF_LARGEST` (`clusters.ts:235`).
pub fn foreign_mass_frac_of_largest() -> f64 {
    mapgen_cluster_mass()
        .masy
        .obca_masa_frakcja_najwiekszej
        .wartosc
}

/// `LOCAL_LAND_DOMINANCE_FRAC` (`clusters.ts:240`).
pub fn local_land_dominance_frac() -> f64 {
    mapgen_cluster_mass()
        .start_gracza
        .lokalny_lad_frakcja
        .wartosc
}

/// `REGION_MASS_DOMINANCE_FRAC` (`clusters.ts:242`) - alias `LOCAL_LAND_DOMINANCE_FRAC`.
pub fn region_mass_dominance_frac() -> f64 {
    local_land_dominance_frac()
}

/// `LOCAL_LAND_DOMINANCE_RADIUS` (`clusters.ts:244`).
pub fn local_land_dominance_radius() -> i64 {
    mapgen_cluster_mass()
        .start_gracza
        .lokalny_lad_promien
        .wartosc
}

/// `PLAYER_START_MIN_MASS_HEXES` (`clusters.ts:246`).
pub fn player_start_min_mass_hexes() -> i64 {
    mapgen_cluster_mass().start_gracza.min_masa_hex.wartosc
}

/// `PLAYER_START_MASS_MIN_ABSOLUTE` (`clusters.ts:248`).
pub fn player_start_mass_min_absolute() -> i64 {
    mapgen_cluster_mass()
        .start_gracza
        .min_masa_bezwzgledna_hex
        .wartosc
}

// ---------------------------------------------------------------------------------------------
// Progi mas (clusters.ts:250-273)
// ---------------------------------------------------------------------------------------------

/// Web `qualifyingMassThreshold` (`clusters.ts:250`, prywatna).
pub fn qualifying_mass_threshold(largest_mass_size: i64) -> i64 {
    min_mass_hexes_for_center()
        .max((largest_mass_size as f64 * island_fallback_mass_frac()).floor() as i64)
}

/// Web `foreignSpawnMassThreshold` (`clusters.ts:258`).
pub fn foreign_spawn_mass_threshold(largest_mass_size: i64) -> i64 {
    foreign_mass_min_absolute()
        .max((largest_mass_size as f64 * foreign_mass_frac_of_largest()).floor() as i64)
}

/// Web `massQualifiesForForeignSpawn` (`clusters.ts:266`): Pangea (1 masa) zawsze.
pub fn mass_qualifies_for_foreign_spawn(mass_size: i64, masses: &[Vec<HexCoord>]) -> bool {
    if masses.len() == 1 {
        return true;
    }
    let largest = masses.first().map_or(0, |m| m.len() as i64);
    mass_size >= foreign_spawn_mass_threshold(largest)
}

// ---------------------------------------------------------------------------------------------
// Cache mas (clusters.ts:275-331)
// ---------------------------------------------------------------------------------------------

/// Web `buildMassHexIndex` (`clusters.ts:276`): hex -> indeks masy.
fn build_mass_hex_index(masses: &[Vec<HexCoord>]) -> HashMap<(i32, i32), usize> {
    let mut idx = HashMap::new();
    for (mi, mass) in masses.iter().enumerate() {
        for h in mass {
            idx.insert(key_of(*h), mi);
        }
    }
    idx
}

/// Web `MassLandCache` (`clusters.ts:293`).
#[derive(Debug, Clone, PartialEq)]
pub struct MassLandCache {
    pub masses: Vec<Vec<HexCoord>>,
    pub hex_index: HashMap<(i32, i32), usize>,
    pub mass_sets: Vec<HashSet<(i32, i32)>>,
}

/// Web `createMassLandCache` (`clusters.ts:299`).
pub fn create_mass_land_cache(ladowe: &[HexCoord]) -> MassLandCache {
    mass_land_cache_from_masses(group_habitable_masses(ladowe))
}

/// Web `massLandCacheFromMasses` (`clusters.ts:306`).
pub fn mass_land_cache_from_masses(masses: Vec<Vec<HexCoord>>) -> MassLandCache {
    MassLandCache {
        hex_index: build_mass_hex_index(&masses),
        mass_sets: masses
            .iter()
            .map(|m| m.iter().map(|h| key_of(*h)).collect())
            .collect(),
        masses,
    }
}

/// Web `MassesOrCache` (`clusters.ts:316`).
#[derive(Debug, Clone, Copy)]
pub enum MassesOrCache<'a> {
    Masses(&'a [Vec<HexCoord>]),
    Cache(&'a MassLandCache),
}

/// Web `resolveMassLandCache` (`clusters.ts:318`).
fn resolve_mass_land_cache<'a>(m: MassesOrCache<'a>) -> Cow<'a, MassLandCache> {
    match m {
        MassesOrCache::Masses(masses) => Cow::Owned(mass_land_cache_from_masses(masses.to_vec())),
        MassesOrCache::Cache(c) => Cow::Borrowed(c),
    }
}

/// Web `massContainingHex` (`clusters.ts:324`).
fn mass_containing_hex(hex_index: &HashMap<(i32, i32), usize>, q: i32, r: i32) -> Option<usize> {
    hex_index.get(&(q, r)).copied()
}

/// Wynik web `regionMassDominance` (`dominantMassIndex = -1`, gdy brak mas w regionie).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RegionMassDominance {
    pub ratio: f64,
    pub center_mass_index: Option<usize>,
    pub dominant_mass_index: i64,
}

/// Web `regionMassDominance` (`clusters.ts:337`). `perMass` (Map) iteruje w kolejnosci
/// wstawienia - pierwszy maksymalny wygrywa (`>` scisle).
pub fn region_mass_dominance(
    region: &[HexCoord],
    center: HexCoord,
    masses: &[Vec<HexCoord>],
) -> RegionMassDominance {
    let hex_index = build_mass_hex_index(masses);
    let center_mass_index = mass_containing_hex(&hex_index, center.q, center.r);
    let mut per_mass: Vec<(usize, i64)> = Vec::new();
    for h in region {
        let Some(mi) = hex_index.get(&key_of(*h)).copied() else {
            continue;
        };
        match per_mass.iter_mut().find(|(m, _)| *m == mi) {
            Some(entry) => entry.1 += 1,
            None => per_mass.push((mi, 1)),
        }
    }
    let mut dominant_mass_index: i64 = -1;
    let mut dominant_count: i64 = 0;
    for (mi, count) in &per_mass {
        if *count > dominant_count {
            dominant_count = *count;
            dominant_mass_index = *mi as i64;
        }
    }
    let center_count = center_mass_index.map_or(0, |ci| {
        per_mass
            .iter()
            .find(|(m, _)| *m == ci)
            .map_or(0, |(_, c)| *c)
    });
    let ratio = if region.is_empty() {
        0.0
    } else {
        center_count as f64 / region.len() as f64
    };
    RegionMassDominance {
        ratio,
        center_mass_index,
        dominant_mass_index,
    }
}

// ---------------------------------------------------------------------------------------------
// Teren i lokalny lad (clusters.ts:363-433)
// ---------------------------------------------------------------------------------------------

fn hex_tile(map: &GeneratedMap, q: i32, r: i32) -> Option<&HexTile> {
    if q < 0 || r < 0 {
        return None;
    }
    map.tile(q as u32, r as u32)
}

/// Web `isSpawnHabitableTerrain` (`clusters.ts:363`): nie morze, nie gory, nie plytkie morze.
pub fn is_spawn_habitable_terrain(t: Terrain) -> bool {
    !matches!(t, Terrain::Sea | Terrain::Mountains | Terrain::ShallowSea)
}

/// Wynik web `localLandFraction`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LocalLandFraction {
    pub ratio: f64,
    pub land_count: i64,
    pub total_count: i64,
}

/// Web `localLandFraction` (`clusters.ts:373`); `radius = None` -> `LOCAL_LAND_DOMINANCE_RADIUS`.
pub fn local_land_fraction(
    map: &GeneratedMap,
    q: i32,
    r: i32,
    radius: Option<i64>,
) -> LocalLandFraction {
    let radius = radius.unwrap_or_else(local_land_dominance_radius);
    let mut land_count = 0i64;
    let mut total_count = 0i64;
    for dq in -radius..=radius {
        let r1 = (-radius).max(-dq - radius);
        let r2 = radius.min(-dq + radius);
        for dr in r1..=r2 {
            let Some(h) = hex_tile(map, q + dq as i32, r + dr as i32) else {
                continue;
            };
            total_count += 1;
            if is_spawn_habitable_terrain(h.terrain) {
                land_count += 1;
            }
        }
    }
    let ratio = if total_count > 0 {
        land_count as f64 / total_count as f64
    } else {
        0.0
    };
    LocalLandFraction {
        ratio,
        land_count,
        total_count,
    }
}

/// Web `passesLocalLandGate` (`clusters.ts:395`); `None` -> wartosci domyslne.
pub fn passes_local_land_gate(
    map: &GeneratedMap,
    q: i32,
    r: i32,
    min_frac: Option<f64>,
    radius: Option<i64>,
) -> bool {
    let min_frac = min_frac.unwrap_or_else(local_land_dominance_frac);
    local_land_fraction(map, q, r, radius).ratio >= min_frac
}

/// Web `developmentSpaceScore` (`clusters.ts:409`); `radius = None` -> `DEVELOPMENT_SPACE_RADIUS`.
pub fn development_space_score(
    map: &GeneratedMap,
    q: i32,
    r: i32,
    masses_or_cache: MassesOrCache<'_>,
    radius: Option<i64>,
) -> i64 {
    let radius = radius.unwrap_or_else(development_space_radius);
    let cache = resolve_mass_land_cache(masses_or_cache);
    let Some(mi) = mass_containing_hex(&cache.hex_index, q, r) else {
        return 0;
    };
    let mass_set = &cache.mass_sets[mi];
    let mut count = 0i64;
    for dq in -radius..=radius {
        let r1 = (-radius).max(-dq - radius);
        let r2 = radius.min(-dq + radius);
        for dr in r1..=r2 {
            let nq = q + dq as i32;
            let nr = r + dr as i32;
            if !mass_set.contains(&(nq, nr)) {
                continue;
            }
            if let Some(h) = hex_tile(map, nq, nr) {
                if is_spawn_habitable_terrain(h.terrain) {
                    count += 1;
                }
            }
        }
    }
    count
}

// ---------------------------------------------------------------------------------------------
// Przydzial typow do mas (clusters.ts:435-560)
// ---------------------------------------------------------------------------------------------

/// Web `massTypeCap` (`clusters.ts:436`).
pub fn mass_type_cap(mass_size: i64) -> i64 {
    if mass_size < small_mass_cap_threshold() {
        return 1;
    }
    1.max(mass_size / min_development_hex_per_civ())
}

struct RemainderEntry {
    mass_idx: usize,
    remainder: f64,
    exact: f64,
    mass_size: i64,
}

/// Web `allocateTypyToMasses` (`clusters.ts:448`): largest remainder (Hamilton). Ostrzezenie
/// `console.warn` z weba nie ma odpowiednika (brak efektu na wynik).
pub fn allocate_typy_to_masses(n_foreign_typy: i64, masses: &[Vec<HexCoord>]) -> Vec<i64> {
    let mut slots: Vec<i64> = vec![0; masses.len()];
    if n_foreign_typy <= 0 || masses.is_empty() {
        return slots;
    }
    if masses.len() == 1 {
        slots[0] = n_foreign_typy;
        return slots;
    }

    let caps: Vec<i64> = masses
        .iter()
        .map(|m| mass_type_cap(m.len() as i64))
        .collect();
    let mut qualifying_indices: Vec<usize> = Vec::new();
    for (i, m) in masses.iter().enumerate() {
        if mass_qualifies_for_foreign_spawn(m.len() as i64, masses) {
            qualifying_indices.push(i);
        }
    }
    if qualifying_indices.is_empty() {
        slots[0] = n_foreign_typy;
        return slots;
    }

    let total_qualifying: i64 = qualifying_indices
        .iter()
        .map(|i| masses[*i].len() as i64)
        .sum();

    let mut sorted_qualifying = qualifying_indices.clone();
    js_array_sort_by(&mut sorted_qualifying, |a, b| {
        masses[*b].len() as f64 - masses[*a].len() as f64
    });
    let mut n_remaining = n_foreign_typy;
    for mi in &sorted_qualifying {
        if n_remaining <= 0 {
            break;
        }
        if slots[*mi] < caps[*mi] {
            slots[*mi] += 1;
            n_remaining -= 1;
        }
    }

    let mut remainders: Vec<RemainderEntry> = Vec::new();
    let mut assigned = 0i64;
    for mi in &qualifying_indices {
        let mass_size = masses[*mi].len() as i64;
        let exact = n_remaining as f64 * mass_size as f64 / total_qualifying as f64;
        let floor = exact.floor();
        let room = caps[*mi] - slots[*mi];
        let add = (floor as i64).min(room);
        slots[*mi] += add;
        assigned += add;
        remainders.push(RemainderEntry {
            mass_idx: *mi,
            remainder: exact - floor,
            exact,
            mass_size,
        });
    }

    let mut leftover = n_remaining - assigned;
    js_array_sort_by(&mut remainders, |a, b| {
        or0(
            or0(
                or0(
                    b.remainder - a.remainder,
                    (b.mass_size - a.mass_size) as f64,
                ),
                b.exact - a.exact,
            ),
            a.mass_idx as f64 - b.mass_idx as f64,
        )
    });
    for entry in &remainders {
        if leftover <= 0 {
            break;
        }
        if slots[entry.mass_idx] < caps[entry.mass_idx] {
            slots[entry.mass_idx] += 1;
            leftover -= 1;
        }
    }

    if leftover > 0 {
        let mut sorted = qualifying_indices.clone();
        js_array_sort_by(&mut sorted, |a, b| {
            masses[*b].len() as f64 - masses[*a].len() as f64
        });
        for mi in &sorted {
            while leftover > 0 && slots[*mi] < caps[*mi] {
                slots[*mi] += 1;
                leftover -= 1;
            }
        }
    }

    slots
}

/// Web `qualifyingMassIndicesForSpawn` (`clusters.ts:540`).
pub fn qualifying_mass_indices_for_spawn(masses: &[Vec<HexCoord>]) -> Vec<usize> {
    if masses.len() == 1 {
        return vec![0];
    }
    (0..masses.len())
        .filter(|i| mass_qualifies_for_foreign_spawn(masses[*i].len() as i64, masses))
        .collect()
}

/// Web `massSizeAtHex` (`clusters.ts:552`).
pub fn mass_size_at_hex(q: i32, r: i32, masses_or_cache: MassesOrCache<'_>) -> i64 {
    let cache = resolve_mass_land_cache(masses_or_cache);
    mass_containing_hex(&cache.hex_index, q, r).map_or(0, |mi| cache.masses[mi].len() as i64)
}

/// Web `passesPlayerStartMassGate` (`clusters.ts:566`).
pub fn passes_player_start_mass_gate(
    map: &GeneratedMap,
    q: i32,
    r: i32,
    masses_or_cache: MassesOrCache<'_>,
) -> bool {
    if !passes_local_land_gate(map, q, r, None, None) {
        return false;
    }
    let cache = resolve_mass_land_cache(masses_or_cache);
    let mass_size = mass_size_at_hex(q, r, MassesOrCache::Cache(&cache));
    let largest = cache.masses.first().map_or(0, |m| m.len() as i64);
    let scaled_min = player_start_mass_min_absolute().max(
        (largest as f64
            * mapgen_cluster_mass()
                .start_gracza
                .min_masa_frakcja_najwiekszej
                .wartosc)
            .floor() as i64,
    );
    if mass_size >= scaled_min {
        return true;
    }
    mass_size >= player_start_min_mass_hexes()
}

// ---------------------------------------------------------------------------------------------
// Kandydaci spawnu (clusters.ts:584-785)
// ---------------------------------------------------------------------------------------------

/// Web `SpawnLandCandidate` (`clusters.ts:584`); `dev` to liczba (calkowita).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SpawnLandCandidate {
    pub h: HexCoord,
    pub land: LocalLandFraction,
    pub dev: f64,
    pub sea: f64,
}

fn sea_at(
    hooks: &dyn ClusterLayoutHooks,
    sea_dist: Option<&SeaDist>,
    q: i32,
    r: i32,
    fallback: f64,
) -> f64 {
    sea_dist.map_or(fallback, |s| hooks.sea_dist_at(s, q, r))
}

fn passes_sea_gate(
    hooks: &dyn ClusterLayoutHooks,
    sea_dist: Option<&SeaDist>,
    q: i32,
    r: i32,
    min_sea_dist: f64,
) -> bool {
    sea_dist.is_none_or(|s| hooks.passes_min_sea_dist_gate(s, q, r, min_sea_dist))
}

/// Web `sortSpawnLandCandidates` (`clusters.ts:591`).
pub fn sort_spawn_land_candidates(
    candidates: &mut Vec<SpawnLandCandidate>,
    map_center: PointF64,
    sea_first: bool,
    min_sea_dist: f64,
    max_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) {
    js_array_sort_by(candidates, |a, b| {
        let da = dist_hp(a.h, map_center);
        let db = dist_hp(b.h, map_center);
        if sea_first && b.sea != a.sea {
            return b.sea - a.sea;
        }
        if !sea_first && (min_sea_dist > 0.0 || max_sea_dist > 0.0) {
            let pa = hooks.capital_sea_band_penalty(a.sea, min_sea_dist, max_sea_dist);
            let pb = hooks.capital_sea_band_penalty(b.sea, min_sea_dist, max_sea_dist);
            if pa != pb {
                return pa - pb;
            }
        }
        let core = or0(b.dev - a.dev, b.land.ratio - a.land.ratio);
        if core != 0.0 {
            return core;
        }
        or0(
            or0(db - da, f64::from(a.h.q - b.h.q)),
            f64::from(a.h.r - b.h.r),
        )
    });
}

#[derive(Clone, Copy)]
struct SpreadEnriched {
    c: SpawnLandCandidate,
    quad: usize,
    min_exist: f64,
}

/// Web `sortSpawnCandidatesWithSpreadBias` (`clusters.ts:616`).
#[allow(clippy::too_many_arguments)]
pub fn sort_spawn_candidates_with_spread_bias(
    candidates: &mut Vec<SpawnLandCandidate>,
    map_center: PointF64,
    prior_capitals: &[HexCoord],
    land_bbox: &LandBBox,
    spread_n: i64,
    sea_first: bool,
    min_sea_dist: f64,
    max_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) {
    let sentinel = mapgen_cluster_mass()
        .wybor_hexu
        .sentinel_brak_srodkow
        .wartosc;
    let mid_q = land_bbox.mid_q();
    let mid_r = land_bbox.mid_r();
    let quad_counts = hooks.count_centers_per_quadrant(prior_capitals, mid_q, mid_r);
    let preferred = hooks.preferred_quadrants_for_spread(&quad_counts, spread_n);

    let enriched: Vec<SpreadEnriched> = candidates
        .iter()
        .map(|c| SpreadEnriched {
            c: *c,
            quad: hooks.land_quadrant_index(c.h.q, c.h.r, mid_q, mid_r),
            min_exist: if prior_capitals.is_empty() {
                sentinel
            } else {
                prior_capitals
                    .iter()
                    .map(|p| dist_hh(c.h, *p))
                    .fold(f64::INFINITY, f64::min)
            },
        })
        .collect();

    let mut pool = enriched.clone();
    if let Some(pref) = preferred.as_ref().filter(|p| !p.is_empty()) {
        let quad_filtered: Vec<SpreadEnriched> = enriched
            .iter()
            .filter(|c| pref.contains(&c.quad))
            .copied()
            .collect();
        if !quad_filtered.is_empty() {
            pool = quad_filtered;
        }
    }

    js_array_sort_by(&mut pool, |a, b| {
        if b.min_exist != a.min_exist {
            return b.min_exist - a.min_exist;
        }
        let qa = quad_counts[a.quad] as f64;
        let qb = quad_counts[b.quad] as f64;
        if qa != qb {
            return qa - qb;
        }
        let da = dist_hp(a.c.h, map_center);
        let db = dist_hp(b.c.h, map_center);
        if sea_first && b.c.sea != a.c.sea {
            return b.c.sea - a.c.sea;
        }
        if !sea_first && (min_sea_dist > 0.0 || max_sea_dist > 0.0) {
            let pa = hooks.capital_sea_band_penalty(a.c.sea, min_sea_dist, max_sea_dist);
            let pb = hooks.capital_sea_band_penalty(b.c.sea, min_sea_dist, max_sea_dist);
            if pa != pb {
                return pa - pb;
            }
        }
        let core = or0(b.c.dev - a.c.dev, b.c.land.ratio - a.c.land.ratio);
        if core != 0.0 {
            return core;
        }
        or0(
            or0(db - da, f64::from(a.c.h.q - b.c.h.q)),
            f64::from(a.c.h.r - b.c.h.r),
        )
    });

    candidates.clear();
    candidates.extend(pool.iter().map(|e| e.c));
}

/// Web `pickTiedSpawnLandCandidate` (`clusters.ts:670`).
pub fn pick_tied_spawn_land_candidate(
    candidates: &[SpawnLandCandidate],
    rand: RandRef<'_>,
) -> Option<HexCoord> {
    let top = candidates.first()?;
    if candidates.len() == 1 {
        return Some(top.h);
    }
    let p = &mapgen_cluster_mass().wybor_hexu;
    let tie: Vec<&SpawnLandCandidate> = candidates
        .iter()
        .filter(|x| {
            x.dev >= top.dev - p.tolerancja_przestrzeni_rozwoju.wartosc
                && x.land.ratio >= top.land.ratio - p.tolerancja_udzialu_lasu.wartosc
                && x.sea <= top.sea + p.tolerancja_odleglosci_od_morza.wartosc
        })
        .collect();
    let idx = (rand() * tie.len() as f64).floor() as usize;
    Some(tie[idx].h)
}

/// Web `playerStartCandidatesOnMasses` (`clusters.ts:685`).
pub fn player_start_candidates_on_masses(
    map: &GeneratedMap,
    land_cache: &MassLandCache,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    require_sea_gate: bool,
    hooks: &dyn ClusterLayoutHooks,
) -> Vec<SpawnLandCandidate> {
    let mut out = Vec::new();
    for mass in &land_cache.masses {
        for h in mass {
            if !passes_player_start_mass_gate(map, h.q, h.r, MassesOrCache::Cache(land_cache)) {
                continue;
            }
            let sea = sea_at(hooks, sea_dist, h.q, h.r, min_sea_dist);
            if require_sea_gate
                && sea_dist.is_some()
                && !passes_sea_gate(hooks, sea_dist, h.q, h.r, min_sea_dist)
            {
                continue;
            }
            out.push(SpawnLandCandidate {
                h: *h,
                land: local_land_fraction(map, h.q, h.r, None),
                dev: development_space_score(map, h.q, h.r, MassesOrCache::Cache(land_cache), None)
                    as f64,
                sea,
            });
        }
    }
    out
}

/// Web `pickPlayerClusterCenter` (`clusters.ts:717`).
#[allow(clippy::too_many_arguments)]
pub fn pick_player_cluster_center(
    map: &GeneratedMap,
    land_cache_or_masses: MassesOrCache<'_>,
    ladowe: &[HexCoord],
    map_center: PointF64,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) -> Option<HexCoord> {
    let land_cache = resolve_mass_land_cache(land_cache_or_masses);
    let mut strict =
        player_start_candidates_on_masses(map, &land_cache, sea_dist, min_sea_dist, true, hooks);
    if !strict.is_empty() {
        sort_spawn_land_candidates(&mut strict, map_center, false, 0.0, 0.0, hooks);
        if let Some(picked) = pick_tied_spawn_land_candidate(&strict, rand) {
            return Some(picked);
        }
    }

    let mut fallback: Vec<SpawnLandCandidate> = ladowe
        .iter()
        .map(|h| SpawnLandCandidate {
            h: *h,
            land: local_land_fraction(map, h.q, h.r, None),
            dev: development_space_score(map, h.q, h.r, MassesOrCache::Cache(&land_cache), None)
                as f64,
            sea: sea_at(hooks, sea_dist, h.q, h.r, min_sea_dist),
        })
        .filter(|x| {
            passes_player_start_mass_gate(map, x.h.q, x.h.r, MassesOrCache::Cache(&land_cache))
        })
        .filter(|x| passes_sea_gate(hooks, sea_dist, x.h.q, x.h.r, min_sea_dist))
        .collect();
    sort_spawn_land_candidates(&mut fallback, map_center, false, 0.0, 0.0, hooks);
    fallback.first().map(|c| c.h)
}

/// Pasmo remisu (wspolne dla trzech wyborow losowych).
fn tie_dev(top: &SpawnLandCandidate, x: &SpawnLandCandidate) -> bool {
    let p = &mapgen_cluster_mass().wybor_hexu;
    x.dev >= top.dev - p.tolerancja_przestrzeni_rozwoju.wartosc
        && x.land.ratio >= top.land.ratio - p.tolerancja_udzialu_lasu.wartosc
}

/// Web `pickBestLocalLandSpawn` (`clusters.ts:748`).
#[allow(clippy::too_many_arguments)]
pub fn pick_best_local_land_spawn(
    map: &GeneratedMap,
    pool: &[HexCoord],
    existing: &[HexCoord],
    min_dist: f64,
    land_cache: &MassLandCache,
    rand: Option<RandRef<'_>>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) -> Option<HexCoord> {
    let frac = local_land_dominance_frac();
    let base: Vec<SpawnLandCandidate> = pool
        .iter()
        .filter(|h| existing.iter().all(|p| dist_hh(**h, *p) >= min_dist))
        .map(|h| SpawnLandCandidate {
            h: *h,
            land: local_land_fraction(map, h.q, h.r, None),
            dev: development_space_score(map, h.q, h.r, MassesOrCache::Cache(land_cache), None)
                as f64,
            sea: sea_at(hooks, sea_dist, h.q, h.r, min_sea_dist),
        })
        .filter(|x| x.land.ratio >= frac)
        .collect();
    let mut candidates: Vec<SpawnLandCandidate> = base
        .iter()
        .filter(|x| passes_sea_gate(hooks, sea_dist, x.h.q, x.h.r, min_sea_dist))
        .copied()
        .collect();
    let sea_first = candidates.is_empty() && sea_dist.is_some() && min_sea_dist > 0.0;
    if sea_first {
        candidates = base.clone();
    }
    js_array_sort_by(&mut candidates, |a, b| {
        if sea_first && b.sea != a.sea {
            return b.sea - a.sea;
        }
        let core = or0(b.dev - a.dev, b.land.ratio - a.land.ratio);
        if core != 0.0 {
            return core;
        }
        or0(
            or0(a.sea - b.sea, f64::from(a.h.q - b.h.q)),
            f64::from(a.h.r - b.h.r),
        )
    });
    let top = *candidates.first()?;
    if candidates.len() > 1 {
        if let Some(rand) = rand {
            let tol_sea = mapgen_cluster_mass()
                .wybor_hexu
                .tolerancja_odleglosci_od_morza
                .wartosc;
            let tie_band: Vec<&SpawnLandCandidate> = candidates
                .iter()
                .filter(|x| tie_dev(&top, x) && x.sea <= top.sea + tol_sea)
                .collect();
            return Some(tie_band[(rand() * tie_band.len() as f64).floor() as usize].h);
        }
    }
    Some(top.h)
}

// ---------------------------------------------------------------------------------------------
// Regiony i masy (clusters.ts:787-867)
// ---------------------------------------------------------------------------------------------

/// Web `assignVoronoiRegions` (`clusters.ts:787`). `None` = web rzuca `TypeError` (brak
/// srodkow przy niepustej liscie ladu).
pub fn assign_voronoi_regions(
    ladowe: &[HexCoord],
    centrumy: &[HexCoord],
) -> Option<Vec<Vec<HexCoord>>> {
    let mut regiony: Vec<Vec<HexCoord>> = vec![Vec::new(); centrumy.len()];
    for h in ladowe {
        let mut best_idx = 0usize;
        let mut best_dist = f64::INFINITY;
        for (ci, c) in centrumy.iter().enumerate() {
            let d = dist_hh(*h, *c);
            if d < best_dist {
                best_dist = d;
                best_idx = ci;
            }
        }
        regiony.get_mut(best_idx)?.push(*h);
    }
    Some(regiony)
}

/// Web `groupHabitableMasses` (`clusters.ts:811`): flood-fill (stos), masy >= minimum, od
/// najwiekszej (sortowanie stabilne).
pub fn group_habitable_masses(ladowe: &[HexCoord]) -> Vec<Vec<HexCoord>> {
    let key_set: HashSet<(i32, i32)> = ladowe.iter().map(|h| key_of(*h)).collect();
    let mut visited: HashSet<(i32, i32)> = HashSet::new();
    let mut masses: Vec<Vec<HexCoord>> = Vec::new();
    let min_mass = min_mass_hexes_for_center();
    for h in ladowe {
        let start_key = key_of(*h);
        if visited.contains(&start_key) {
            continue;
        }
        let mut mass: Vec<HexCoord> = Vec::new();
        let mut stack = vec![*h];
        visited.insert(start_key);
        while let Some(cur) = stack.pop() {
            mass.push(cur);
            for n in cur.neighbors() {
                let nk = key_of(n);
                if !key_set.contains(&nk) || visited.contains(&nk) {
                    continue;
                }
                visited.insert(nk);
                stack.push(HexCoord::new(n.q, n.r));
            }
        }
        if mass.len() as i64 >= min_mass {
            masses.push(mass);
        }
    }
    js_array_sort_by(&mut masses, |a, b| b.len() as f64 - a.len() as f64);
    masses
}

/// Web `massCentroid` (`clusters.ts:841`).
pub fn mass_centroid(mass: &[HexCoord]) -> PointF64 {
    let mut sq = 0.0f64;
    let mut sr = 0.0f64;
    for h in mass {
        sq += f64::from(h.q);
        sr += f64::from(h.r);
    }
    PointF64 {
        q: sq / mass.len() as f64,
        r: sr / mass.len() as f64,
    }
}

/// Web `pickCenterInMass` (`clusters.ts:849`).
pub fn pick_center_in_mass(
    mass: &[HexCoord],
    existing: &[HexCoord],
    min_dist: f64,
    prefer_near: Option<HexCoord>,
    mut rand: Option<RandRef<'_>>,
) -> Option<HexCoord> {
    let p = &mapgen_cluster_mass().wybor_hexu;
    let centroid = mass_centroid(mass);
    let mut candidates: Vec<(HexCoord, f64)> = Vec::new();
    for h in mass {
        if !existing.iter().all(|e| dist_hh(*h, *e) >= min_dist) {
            continue;
        }
        let score = dist_hp(*h, centroid)
            + prefer_near.map_or(0.0, |pn| {
                dist_hh(*h, pn) * p.waga_bliskosci_preferowanego.wartosc
            })
            + rand
                .as_mut()
                .map_or(0.0, |r| r() * p.waga_losowego_rozstrzygniecia.wartosc);
        candidates.push((*h, score));
    }
    js_array_sort_by(&mut candidates, |a, b| a.1 - b.1);
    candidates.first().map(|c| c.0)
}

struct LandGateCandidate {
    h: HexCoord,
    land: LocalLandFraction,
    dev: f64,
    sea: f64,
    score: f64,
}

/// Web `pickCenterInMassWithLandGate` (`clusters.ts:869`).
#[allow(clippy::too_many_arguments)]
pub fn pick_center_in_mass_with_land_gate(
    map: &GeneratedMap,
    mass: &[HexCoord],
    existing: &[HexCoord],
    min_dist: f64,
    land_cache: &MassLandCache,
    prefer_near: Option<HexCoord>,
    rand: Option<RandRef<'_>>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) -> Option<HexCoord> {
    let p = &mapgen_cluster_mass().wybor_hexu;
    let frac = local_land_dominance_frac();
    let centroid = mass_centroid(mass);
    let base: Vec<LandGateCandidate> = mass
        .iter()
        .filter(|h| existing.iter().all(|e| dist_hh(**h, *e) >= min_dist))
        .map(|h| LandGateCandidate {
            h: *h,
            land: local_land_fraction(map, h.q, h.r, None),
            dev: development_space_score(map, h.q, h.r, MassesOrCache::Cache(land_cache), None)
                as f64,
            sea: sea_at(hooks, sea_dist, h.q, h.r, min_sea_dist),
            score: dist_hp(*h, centroid)
                + prefer_near.map_or(0.0, |pn| {
                    dist_hh(*h, pn) * p.waga_bliskosci_preferowanego.wartosc
                }),
        })
        .filter(|x| x.land.ratio >= frac)
        .collect();
    let mut idx: Vec<usize> = (0..base.len())
        .filter(|i| passes_sea_gate(hooks, sea_dist, base[*i].h.q, base[*i].h.r, min_sea_dist))
        .collect();
    let sea_first = idx.is_empty() && sea_dist.is_some() && min_sea_dist > 0.0;
    if sea_first {
        idx = (0..base.len()).collect();
    }
    js_array_sort_by(&mut idx, |ia, ib| {
        let (a, b) = (&base[*ia], &base[*ib]);
        if sea_first && b.sea != a.sea {
            return b.sea - a.sea;
        }
        let core = or0(b.dev - a.dev, b.land.ratio - a.land.ratio);
        if core != 0.0 {
            return core;
        }
        or0(b.sea - a.sea, a.score - b.score)
    });
    let top = &base[*idx.first()?];
    if let Some(rand) = rand {
        if idx.len() > 1 {
            let tie_band: Vec<&LandGateCandidate> = idx
                .iter()
                .map(|i| &base[*i])
                .filter(|x| {
                    x.dev >= top.dev - p.tolerancja_przestrzeni_rozwoju.wartosc
                        && x.land.ratio >= top.land.ratio - p.tolerancja_udzialu_lasu.wartosc
                })
                .collect();
            return Some(tie_band[(rand() * tie_band.len() as f64).floor() as usize].h);
        }
    }
    Some(top.h)
}

struct SpreadCandidate {
    h: HexCoord,
    land: LocalLandFraction,
    sea: f64,
    min_exist: f64,
    quad: usize,
}

/// Losowanie z opcjonalnego zrodla (`rand ? rand() : ...`).
fn draw(rand: &mut Option<RandRef<'_>>) -> Option<f64> {
    rand.as_mut().map(|r| r())
}

/// Web `pickCenterInMassSpread` (`clusters.ts:916`): farthest-point na masie + bias cwiartek.
/// Komparator sortowania LOSUJE (`rand() * 2 - 1`), wiec uzywa TimSortu V8.
#[allow(clippy::too_many_arguments)]
pub fn pick_center_in_mass_spread(
    map: &GeneratedMap,
    mass: &[HexCoord],
    existing: &[HexCoord],
    min_dist: f64,
    _land_cache: &MassLandCache, // web przyjmuje `landCache`, ale go nie czyta (clusters.ts:921)
    mut rand: Option<RandRef<'_>>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    land_bbox: Option<&LandBBox>,
    spread_opts: Option<ClusterSpreadOpts>,
    hooks: &dyn ClusterLayoutHooks,
) -> Option<HexCoord> {
    let p = &mapgen_cluster_mass().wybor_hexu;
    let frac = local_land_dominance_frac();
    let (mid_q, mid_r) = land_bbox.map_or((0.0, 0.0), |b| (b.mid_q(), b.mid_r()));
    let quad_counts: Option<[usize; 4]> =
        land_bbox.map(|_| hooks.count_centers_per_quadrant(existing, mid_q, mid_r));

    let base: Vec<SpreadCandidate> = mass
        .iter()
        .filter(|h| existing.iter().all(|e| dist_hh(**h, *e) >= min_dist))
        .map(|h| SpreadCandidate {
            h: *h,
            land: local_land_fraction(map, h.q, h.r, None),
            sea: sea_at(hooks, sea_dist, h.q, h.r, min_sea_dist),
            min_exist: if existing.is_empty() {
                p.sentinel_brak_srodkow.wartosc
            } else {
                existing
                    .iter()
                    .map(|e| dist_hh(*h, *e))
                    .fold(f64::INFINITY, f64::min)
            },
            quad: if land_bbox.is_some() {
                hooks.land_quadrant_index(h.q, h.r, mid_q, mid_r)
            } else {
                0
            },
        })
        .filter(|x| x.land.ratio >= frac)
        .collect();
    let mut candidates: Vec<usize> = (0..base.len())
        .filter(|i| passes_sea_gate(hooks, sea_dist, base[*i].h.q, base[*i].h.r, min_sea_dist))
        .collect();
    if candidates.is_empty() && sea_dist.is_some() && min_sea_dist > 0.0 {
        candidates = (0..base.len()).collect();
    }
    if candidates.is_empty() {
        return None;
    }

    if let (Some(_), Some(qc), Some(so)) = (land_bbox, quad_counts.as_ref(), spread_opts) {
        if so.n_needed >= p.min_liczba_typow_filtra_cwiartek.wartosc {
            if let Some(pref) = hooks
                .preferred_quadrants_for_spread(qc, so.n_needed)
                .filter(|s| !s.is_empty())
            {
                let quad_filtered: Vec<usize> = candidates
                    .iter()
                    .copied()
                    .filter(|i| pref.contains(&base[*i].quad))
                    .collect();
                if !quad_filtered.is_empty() {
                    candidates = quad_filtered;
                }
            }
        }
    }

    js_array_sort_by(&mut candidates, |ia, ib| {
        let (a, b) = (&base[*ia], &base[*ib]);
        if b.min_exist != a.min_exist {
            return b.min_exist - a.min_exist;
        }
        if let Some(qc) = quad_counts.as_ref() {
            let qa = qc[a.quad] as f64;
            let qb = qc[b.quad] as f64;
            if qa != qb {
                return qa - qb;
            }
        }
        let cap = min_sea_dist + p.limit_morza_w_wyniku_powyzej_min.wartosc;
        let a_sea_score = a.sea.min(cap);
        let b_sea_score = b.sea.min(cap);
        if b_sea_score != a_sea_score {
            return b_sea_score - a_sea_score;
        }
        or0(
            draw(&mut rand).map_or(0.0, |v| v * 2.0 - 1.0),
            f64::from(a.h.q - b.h.q),
        )
    });
    let top = &base[candidates[0]];
    if candidates.len() > 1 {
        if let Some(r) = rand.as_mut() {
            let band: Vec<&SpreadCandidate> = candidates
                .iter()
                .map(|i| &base[*i])
                .filter(|x| {
                    if x.min_exist < top.min_exist - p.tolerancja_min_exist_pasma.wartosc {
                        return false;
                    }
                    if let Some(qc) = quad_counts.as_ref() {
                        let tq = qc[top.quad] as i64;
                        return (qc[x.quad] as i64)
                            <= tq + p.tolerancja_obciazenia_cwiartki_pasma.wartosc;
                    }
                    true
                })
                .collect();
            return Some(band[(r() * band.len() as f64).floor() as usize].h);
        }
    }
    Some(top.h)
}

/// Web `pickCenterOnLandPoolSpread` (`clusters.ts:989`).
#[allow(clippy::too_many_arguments)]
pub fn pick_center_on_land_pool_spread(
    map: &GeneratedMap,
    pool: &[HexCoord],
    existing: &[HexCoord],
    min_dist: f64,
    land_cache: &MassLandCache,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    land_bbox: Option<&LandBBox>,
    spread_opts: Option<ClusterSpreadOpts>,
    hooks: &dyn ClusterLayoutHooks,
) -> Option<HexCoord> {
    pick_center_in_mass_spread(
        map,
        pool,
        existing,
        min_dist,
        land_cache,
        Some(rand),
        sea_dist,
        min_sea_dist,
        land_bbox,
        spread_opts,
        hooks,
    )
}

// ---------------------------------------------------------------------------------------------
// Wyrownanie rozkladu (clusters.ts:1006-1139)
// ---------------------------------------------------------------------------------------------

/// Web `balanceClusterSpread` (`clusters.ts:1009`); `max_iterations = None` -> domyslne 2.
#[allow(clippy::too_many_arguments)]
pub fn balance_cluster_spread(
    map: &GeneratedMap,
    centers: &[HexCoord],
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    min_dist: f64,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    land_bbox: &LandBBox,
    max_iterations: Option<i64>,
    spread_opts: Option<ClusterSpreadOpts>,
    hooks: &dyn ClusterLayoutHooks,
) -> Vec<HexCoord> {
    let pl = &mapgen_cluster_mass().rozmieszczenie;
    let max_iterations = max_iterations.unwrap_or(pl.wyrownanie_min_iteracji.wartosc);
    if (centers.len() as i64) < pl.min_centrow_wyrownania.wartosc || max_iterations <= 0 {
        return centers.to_vec();
    }
    let mut out: Vec<HexCoord> = centers.to_vec();

    for _iter in 0..max_iterations {
        let mut farthest_hole: Option<(HexCoord, f64)> = None;
        for h in ladowe {
            if !passes_local_land_gate(map, h.q, h.r, None, None) {
                continue;
            }
            if sea_dist.is_some()
                && min_sea_dist > 0.0
                && !passes_sea_gate(hooks, sea_dist, h.q, h.r, min_sea_dist)
            {
                continue;
            }
            let min_center_dist = out
                .iter()
                .map(|c| dist_hh(*h, *c))
                .fold(f64::INFINITY, f64::min);
            if farthest_hole.is_none_or(|(_, d)| min_center_dist > d) {
                farthest_hole = Some((*h, min_center_dist));
            }
        }
        let Some((hole, hole_dist)) = farthest_hole else {
            break;
        };
        if hole_dist < min_dist * pl.balans_prog_dziury_mnoznik.wartosc {
            break;
        }

        let mut tightest_idx = 0usize;
        let mut tightest_sep = f64::INFINITY;
        for i in 0..out.len() {
            let others: Vec<HexCoord> = out
                .iter()
                .enumerate()
                .filter(|(j, _)| *j != i)
                .map(|(_, c)| *c)
                .collect();
            let sep = hooks
                .min_capital_separation_distance(out[i], &others)
                .unwrap_or(f64::INFINITY);
            if sep < tightest_sep {
                tightest_sep = sep;
                tightest_idx = i;
            }
        }

        let others: Vec<HexCoord> = out
            .iter()
            .enumerate()
            .filter(|(j, _)| *j != tightest_idx)
            .map(|(_, c)| *c)
            .collect();
        let relocated = pick_center_on_land_pool_spread(
            map,
            ladowe,
            &others,
            min_dist,
            land_cache,
            &mut *rand,
            sea_dist,
            min_sea_dist,
            Some(land_bbox),
            spread_opts,
            hooks,
        );
        let Some(relocated) = relocated else {
            break;
        };

        let toward_hole = dist_hh(relocated, hole);
        let current_toward = dist_hh(out[tightest_idx], hole);
        let spread_before = hooks
            .cluster_center_quadrant_spread(&out, land_bbox)
            .occupied_quadrants;
        let mut after = others.clone();
        after.push(relocated);
        let spread_after = hooks
            .cluster_center_quadrant_spread(&after, land_bbox)
            .occupied_quadrants;
        if toward_hole < current_toward - pl.balans_zblizenie_do_dziury.wartosc
            || hole_dist > min_dist * pl.balans_duza_dziura_mnoznik.wartosc
            || spread_after > spread_before
        {
            out[tightest_idx] = relocated;
        } else {
            break;
        }
    }

    out
}

/// Web `enforceQuarterSpreadOnCenters` (`clusters.ts:1087`).
#[allow(clippy::too_many_arguments)]
pub fn enforce_quarter_spread_on_centers(
    map: &GeneratedMap,
    centers: &[HexCoord],
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    min_dist: f64,
    rand: RandRef<'_>,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    land_bbox: &LandBBox,
    n_needed: i64,
    hooks: &dyn ClusterLayoutHooks,
) -> Vec<HexCoord> {
    let pl = &mapgen_cluster_mass().rozmieszczenie;
    let pk = &mapgen_cluster_mass().wybor_hexu;
    if n_needed < pk.min_liczba_typow_filtra_cwiartek.wartosc
        || (centers.len() as i64) < pl.wymus_cwiartki_min_centrow.wartosc
    {
        return centers.to_vec();
    }
    let required = hooks.minimum_spread_quarters_required(n_needed);
    let mut out: Vec<HexCoord> = centers.to_vec();
    let mid_q = land_bbox.mid_q();
    let mid_r = land_bbox.mid_r();
    let spread_opts = ClusterSpreadOpts { n_needed };

    for _iter in 0..pl.wymus_cwiartki_max_iteracji.wartosc {
        let spread = hooks.cluster_center_quadrant_spread(&out, land_bbox);
        if spread.occupied_quadrants >= required {
            break;
        }

        let counts = hooks.count_centers_per_quadrant(&out, mid_q, mid_r);
        let mut relocate_idx: i64 = -1;
        let mut max_quad_load: i64 = -1;
        for (i, c) in out.iter().enumerate() {
            let q = hooks.land_quadrant_index(c.q, c.r, mid_q, mid_r);
            if counts[q] as i64 > max_quad_load {
                max_quad_load = counts[q] as i64;
                relocate_idx = i as i64;
            }
        }
        if relocate_idx < 0 || max_quad_load <= pl.wymus_cwiartki_min_obciazenie.wartosc {
            break;
        }
        let relocate_idx = relocate_idx as usize;

        let others: Vec<HexCoord> = out
            .iter()
            .enumerate()
            .filter(|(j, _)| *j != relocate_idx)
            .map(|(_, c)| *c)
            .collect();
        let relocated = pick_center_on_land_pool_spread(
            map,
            ladowe,
            &others,
            min_dist,
            land_cache,
            &mut *rand,
            sea_dist,
            min_sea_dist,
            Some(land_bbox),
            Some(spread_opts),
            hooks,
        );
        let Some(relocated) = relocated else {
            break;
        };

        let mut after = others.clone();
        after.push(relocated);
        let new_spread = hooks.cluster_center_quadrant_spread(&after, land_bbox);
        let new_quad = hooks.land_quadrant_index(relocated.q, relocated.r, mid_q, mid_r);
        let moving_to_empty = counts[new_quad] == 0;
        if new_spread.occupied_quadrants > spread.occupied_quadrants || moving_to_empty {
            out[relocate_idx] = relocated;
        } else {
            break;
        }
    }

    out
}

// ---------------------------------------------------------------------------------------------
// Rozmieszczenie srodkow na masach (clusters.ts:1141-1344)
// ---------------------------------------------------------------------------------------------

/// Web `bounds` (`{ minQ, maxQ, minR, maxR }`) mapy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MapBounds {
    pub min_q: i32,
    pub max_q: i32,
    pub min_r: i32,
    pub max_r: i32,
}

struct PlaceCtx<'a> {
    map: &'a GeneratedMap,
    land_cache: &'a MassLandCache,
    bounds: MapBounds,
    margin_brzeg: f64,
}

impl PlaceCtx<'_> {
    fn ok_margins(&self, q: i32, r: i32, relax: bool) -> bool {
        if relax {
            return true;
        }
        let b = &self.bounds;
        f64::from(q - b.min_q) >= self.margin_brzeg
            && f64::from(b.max_q - q) >= self.margin_brzeg
            && f64::from(r - b.min_r) >= self.margin_brzeg
            && f64::from(b.max_r - r) >= self.margin_brzeg
    }

    /// Web `tryPlace` (`clusters.ts:1187`).
    fn try_place(
        &self,
        centers: &mut Vec<HexCoord>,
        c: Option<HexCoord>,
        min_dist: f64,
        relax_margin: bool,
        for_player: bool,
        soft_local_land: bool,
    ) -> bool {
        let Some(c) = c else {
            return false;
        };
        if centers.iter().any(|p| p.q == c.q && p.r == c.r) {
            return false;
        }
        if !self.ok_margins(c.q, c.r, relax_margin) {
            return false;
        }
        if centers.iter().any(|p| dist_hh(c, *p) < min_dist) {
            return false;
        }
        if for_player {
            if !passes_player_start_mass_gate(
                self.map,
                c.q,
                c.r,
                MassesOrCache::Cache(self.land_cache),
            ) {
                return false;
            }
        } else if !soft_local_land && !passes_local_land_gate(self.map, c.q, c.r, None, None) {
            return false;
        }
        centers.push(c);
        true
    }
}

/// Web `placeClusterCentersAcrossLandmasses` (`clusters.ts:1146`): fazy 0-5b. `min_sea_dist`
/// domyslnie `0` w webie. Ostrzezenie `console.warn` nie ma efektu na wynik.
#[allow(clippy::too_many_arguments)]
pub fn place_cluster_centers_across_landmasses(
    map: &GeneratedMap,
    ladowe: &[HexCoord],
    land_cache: &MassLandCache,
    n_needed: i64,
    min_dist_base: f64,
    map_center: PointF64,
    rand: RandRef<'_>,
    margin_brzeg: f64,
    bounds: MapBounds,
    sea_dist: Option<&SeaDist>,
    min_sea_dist: f64,
    hooks: &dyn ClusterLayoutHooks,
) -> Vec<HexCoord> {
    let pl = &mapgen_cluster_mass().rozmieszczenie;
    let sentinel = mapgen_cluster_mass()
        .wybor_hexu
        .sentinel_brak_srodkow
        .wartosc;
    let land_bbox = LandBBox::from_hexes(ladowe);
    let masses = &land_cache.masses;
    let hex_index = &land_cache.hex_index;
    let mut centers: Vec<HexCoord> = Vec::new();
    let hard_min = pl.min_twardy_dystans.wartosc.max(min_dist_base);
    let ctx = PlaceCtx {
        map,
        land_cache,
        bounds,
        margin_brzeg,
    };

    let count_centers_on_mass = |centers: &[HexCoord], mass_idx: usize| -> i64 {
        centers
            .iter()
            .filter(|c| mass_containing_hex(hex_index, c.q, c.r) == Some(mass_idx))
            .count() as i64
    };

    let mut qualifying_indices = qualifying_mass_indices_for_spawn(masses);
    let mut full_land_pool: Vec<HexCoord> = Vec::new();
    for mi in &qualifying_indices {
        full_land_pool.extend(masses[*mi].iter().copied());
    }
    let placement_pool: Vec<HexCoord> = if full_land_pool.is_empty() {
        ladowe.to_vec()
    } else {
        full_land_pool
    };
    let spread_opts = ClusterSpreadOpts { n_needed };

    // Faza 0: gracz zawsze na najwiekszej masie spelniajacej bramki.
    let player_center = pick_player_cluster_center(
        map,
        MassesOrCache::Cache(land_cache),
        ladowe,
        map_center,
        &mut *rand,
        sea_dist,
        min_sea_dist,
        hooks,
    );
    if let Some(pc) = player_center {
        centers.push(pc);
    }

    let n_foreign = n_needed - centers.len() as i64;
    let foreign_allocation = allocate_typy_to_masses(n_foreign, masses);
    let player_on_mass0 =
        player_center.is_some_and(|pc| mass_containing_hex(hex_index, pc.q, pc.r) == Some(0));

    js_array_sort_by(&mut qualifying_indices, |a, b| {
        masses[*b].len() as f64 - masses[*a].len() as f64
    });
    let qualifying_order = qualifying_indices;

    // Faza 1: quota - farthest-point na masie + bias cwiartek.
    for mi in &qualifying_order {
        if centers.len() as i64 >= n_needed {
            break;
        }
        let target_foreign = foreign_allocation.get(*mi).copied().unwrap_or(0);
        let player_on_mass = *mi == 0 && player_on_mass0;

        while (centers.len() as i64) < n_needed {
            let current_foreign = count_centers_on_mass(&centers, *mi) - i64::from(player_on_mass);
            if current_foreign >= target_foreign {
                break;
            }
            let before = centers.len();
            let candidate = if masses.len() == 1 {
                pick_center_on_land_pool_spread(
                    map,
                    &placement_pool,
                    &centers,
                    hard_min,
                    land_cache,
                    &mut *rand,
                    sea_dist,
                    min_sea_dist,
                    Some(&land_bbox),
                    Some(spread_opts),
                    hooks,
                )
            } else {
                pick_center_in_mass_spread(
                    map,
                    &masses[*mi],
                    &centers,
                    hard_min,
                    land_cache,
                    Some(&mut *rand),
                    sea_dist,
                    min_sea_dist,
                    Some(&land_bbox),
                    Some(spread_opts),
                    hooks,
                )
            };
            ctx.try_place(&mut centers, candidate, hard_min, false, false, false);
            if centers.len() == before {
                break;
            }
        }
    }

    // Faza 2: dopelnij brakujace typy.
    if (centers.len() as i64) < n_needed && !qualifying_order.is_empty() {
        let mut guard = 0i64;
        let limit = n_needed * pl.straznik_faza2_mnoznik.wartosc;
        while (centers.len() as i64) < n_needed && {
            let g = guard;
            guard += 1;
            g < limit
        } {
            let mut placed_any = false;
            let candidate = if masses.len() == 1 {
                pick_center_on_land_pool_spread(
                    map,
                    &placement_pool,
                    &centers,
                    hard_min,
                    land_cache,
                    &mut *rand,
                    sea_dist,
                    min_sea_dist,
                    Some(&land_bbox),
                    Some(spread_opts),
                    hooks,
                )
            } else {
                None
            };
            if candidate.is_some()
                && ctx.try_place(&mut centers, candidate, hard_min, true, false, false)
            {
                placed_any = true;
            }
            if !placed_any {
                for mi in &qualifying_order {
                    if centers.len() as i64 >= n_needed {
                        break;
                    }
                    let before = centers.len();
                    let picked = pick_center_in_mass_spread(
                        map,
                        &masses[*mi],
                        &centers,
                        hard_min,
                        land_cache,
                        Some(&mut *rand),
                        sea_dist,
                        min_sea_dist,
                        Some(&land_bbox),
                        Some(spread_opts),
                        hooks,
                    );
                    ctx.try_place(&mut centers, picked, hard_min, true, false, false);
                    if centers.len() > before {
                        placed_any = true;
                        break;
                    }
                }
            }
            if !placed_any {
                break;
            }
        }
    }

    // Faza 3: wyrownanie spreadu.
    if centers.len() as i64 >= pl.min_centrow_wyrownania.wartosc {
        let balance_iters =
            pl.wyrownanie_min_iteracji
                .wartosc
                .max(pl.wyrownanie_max_iteracji.wartosc.min(
                    (n_needed as f64 / pl.wyrownanie_dzielnik_typow.wartosc as f64).ceil() as i64,
                ));
        let balanced = balance_cluster_spread(
            map,
            &centers,
            &placement_pool,
            land_cache,
            hard_min,
            &mut *rand,
            sea_dist,
            min_sea_dist,
            &land_bbox,
            Some(balance_iters),
            Some(spread_opts),
            hooks,
        );
        centers = balanced;
    }

    // Faza 4: twardy coverage cwiartek.
    let pk = &mapgen_cluster_mass().wybor_hexu;
    if centers.len() as i64 >= pl.wymus_cwiartki_min_centrow.wartosc
        && n_needed >= pk.min_liczba_typow_filtra_cwiartek.wartosc
    {
        let fixed = enforce_quarter_spread_on_centers(
            map,
            &centers,
            &placement_pool,
            land_cache,
            hard_min,
            &mut *rand,
            sea_dist,
            min_sea_dist,
            &land_bbox,
            n_needed,
            hooks,
        );
        centers = fixed;
    }

    // Faza 5: dopelnij brakujace srodki.
    if (centers.len() as i64) < n_needed {
        let mut guard = 0i64;
        let limit = n_needed * pl.straznik_faza5_mnoznik.wartosc;
        while (centers.len() as i64) < n_needed && {
            let g = guard;
            guard += 1;
            g < limit
        } {
            let before = centers.len();
            let picked = pick_center_on_land_pool_spread(
                map,
                &placement_pool,
                &centers,
                hard_min,
                land_cache,
                &mut *rand,
                sea_dist,
                min_sea_dist,
                Some(&land_bbox),
                Some(spread_opts),
                hooks,
            );
            ctx.try_place(&mut centers, picked, hard_min, true, false, false);
            if centers.len() == before {
                break;
            }
        }
    }

    // Faza 5b: soft local-land.
    if (centers.len() as i64) < n_needed {
        let mut guard = 0i64;
        let limit = n_needed * pl.straznik_faza5b_mnoznik.wartosc;
        while (centers.len() as i64) < n_needed && {
            let g = guard;
            guard += 1;
            g < limit
        } {
            let before = centers.len();
            let mut cands: Vec<(HexCoord, f64, f64)> = placement_pool
                .iter()
                .filter(|h| centers.iter().all(|p| dist_hh(**h, *p) >= hard_min))
                .map(|h| {
                    (
                        *h,
                        if centers.is_empty() {
                            sentinel
                        } else {
                            centers
                                .iter()
                                .map(|p| dist_hh(*h, *p))
                                .fold(f64::INFINITY, f64::min)
                        },
                        sea_dist.map_or(0.0, |s| hooks.sea_dist_at(s, h.q, h.r)),
                    )
                })
                .collect();
            js_array_sort_by(&mut cands, |a, b| or0(b.1 - a.1, b.2 - a.2));
            let candidate = cands.first().map(|c| c.0);
            ctx.try_place(&mut centers, candidate, hard_min, true, false, true);
            if centers.len() == before {
                break;
            }
        }
    }

    // `centers.slice(0, nNeeded)`: ujemne `nNeeded` odcina elementy od konca.
    let len = centers.len() as i64;
    let end = if n_needed < 0 {
        (len + n_needed).max(0)
    } else {
        n_needed.min(len)
    };
    centers.truncate(end as usize);
    centers
}

// ---------------------------------------------------------------------------------------------
// startScoring.ts
// ---------------------------------------------------------------------------------------------

/// Trudnosc gry (web `'easy' | 'normal' | 'hard'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartDifficulty {
    Easy,
    Normal,
    Hard,
}

/// Web `START_REVEAL_RADIUS` (`startScoring.ts:14`).
pub fn start_reveal_radius() -> i64 {
    start_scoring().promien_oswietlenia.domyslny_legacy.wartosc
}

/// Web `startRevealRadiusForDifficulty` (`startScoring.ts:17`).
pub fn start_reveal_radius_for_difficulty(diff: StartDifficulty) -> i64 {
    let r = &start_scoring().promien_oswietlenia;
    match diff {
        StartDifficulty::Easy => r.easy.wartosc,
        StartDifficulty::Hard => r.hard.wartosc,
        StartDifficulty::Normal => r.normal.wartosc,
    }
}

fn has_river(map: &GeneratedMap, q: i32, r: i32) -> bool {
    hex_tile(map, q, r).is_some_and(|h| h.river)
}

fn is_arable(t: Terrain) -> bool {
    matches!(t, Terrain::Grassland | Terrain::Plains)
}

fn can_found_on_terrain(t: Terrain) -> bool {
    !t.is_water() && t != Terrain::Mountains && t != Terrain::Polar
}

/// Web `scoreCityStartHex` (`startScoring.ts:51`): `-Infinity`, gdy hex nie istnieje lub nie
/// da sie zalozyc miasta.
pub fn score_city_start_hex(map: &GeneratedMap, q: i32, r: i32) -> f64 {
    let sp = &start_scoring().punktacja;
    let Some(hex) = hex_tile(map, q, r) else {
        return f64::NEG_INFINITY;
    };
    if !can_found_on_terrain(hex.terrain) {
        return f64::NEG_INFINITY;
    }
    let mut score = 0.0f64;
    match hex.terrain {
        Terrain::Grassland | Terrain::Plains => score += sp.laka_rownina.wartosc,
        Terrain::Hills => score += sp.wzgorza.wartosc,
        Terrain::Desert => score += sp.pustynia.wartosc,
        _ => score += sp.inny_teren.wartosc,
    }
    if has_river(map, q, r) {
        score += sp.rzeka_na_hexie.wartosc;
    }
    let mut adj_river = false;
    for n in HexCoord::new(q, r).neighbors() {
        if has_river(map, n.q, n.r) {
            adj_river = true;
        }
    }
    if adj_river {
        score += sp.rzeka_u_sasiada.wartosc;
    }
    let radius = sp.promien_okolicy.wartosc;
    for dq in -radius..=radius {
        for dr in -radius..=radius {
            let dist = dist_hh(
                HexCoord::new(q, r),
                HexCoord::new(q + dq as i32, r + dr as i32),
            ) as i64;
            if dist == 0 || dist > radius {
                continue;
            }
            let Some(nb) = hex_tile(map, q + dq as i32, r + dr as i32) else {
                continue;
            };
            if is_arable(nb.terrain) {
                score += if dist <= sp.promien_pol_blisko.wartosc {
                    sp.pola_uprawne_blisko.wartosc
                } else {
                    sp.pola_uprawne_dalej.wartosc
                };
            }
            if dist >= sp.min_dystans_wzniesien.wartosc && dist <= radius {
                if nb.terrain == Terrain::Mountains {
                    score += sp.gory_w_okolicy.wartosc;
                } else if nb.terrain == Terrain::Hills {
                    score += sp.wzgorza_w_okolicy.wartosc;
                }
            }
        }
    }
    score
}

/// Web `findBestPlayerStartHex` (`startScoring.ts:102`).
pub fn find_best_player_start_hex(map: &GeneratedMap) -> Option<HexCoord> {
    let sp = &start_scoring().punktacja;
    // `Math.round(x)` dla x >= 0: floor(x + 0.5).
    let cq = ((f64::from(map.width) - 1.0) / 2.0 + 0.5).floor() as i32;
    let cr = ((f64::from(map.height) - 1.0) / 2.0 + 0.5).floor() as i32;

    let ladowe: Vec<HexCoord> = map
        .tiles
        .iter()
        .filter(|t| can_found_on_terrain(t.terrain))
        .map(|t| HexCoord::new(t.coord.q, t.coord.r))
        .collect();
    let masses = group_habitable_masses(&ladowe);
    let cache = mass_land_cache_from_masses(masses);

    let mut ordered: Vec<&HexTile> = map.tiles.iter().collect();
    js_array_sort_by(&mut ordered, |a, b| {
        let on_largest = |h: &HexTile| -> f64 {
            if cache.masses.is_empty() {
                return 1.0;
            }
            if cache.mass_sets[0].contains(&(h.coord.q, h.coord.r)) {
                0.0
            } else {
                1.0
            }
        };
        on_largest(a) - on_largest(b)
    });

    let mut best: Option<HexCoord> = None;
    let mut best_score = f64::NEG_INFINITY;
    let mut best_center_dist = f64::INFINITY;
    for hex in ordered {
        let (q, r) = (hex.coord.q, hex.coord.r);
        if !passes_player_start_mass_gate(map, q, r, MassesOrCache::Cache(&cache)) {
            continue;
        }
        let s = score_city_start_hex(map, q, r);
        if s == f64::NEG_INFINITY {
            continue;
        }
        let dev_bonus = development_space_score(map, q, r, MassesOrCache::Cache(&cache), None)
            as f64
            * sp.waga_przestrzeni_rozwoju.wartosc;
        let combined = s + dev_bonus;
        let cd = dist_hh(HexCoord::new(q, r), HexCoord::new(cq, cr));
        if combined > best_score || (combined == best_score && cd < best_center_dist) {
            best_score = combined;
            best_center_dist = cd;
            best = Some(HexCoord::new(q, r));
        }
    }
    best
}
