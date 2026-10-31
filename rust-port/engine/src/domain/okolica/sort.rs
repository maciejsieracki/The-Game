//! P6.8G (runda 4, N2): sortowanie jak V8 `Array.prototype.sort` - TimSort z
//! `third_party/v8/builtins/array-sort.tq`: CountAndMakeRun, BinaryInsertionSort, MergeCollapse,
//! MergeForceCollapse, MergeAt, GallopLeft/GallopRight, MergeLow/MergeHigh (z galopem, `kMinGallopWins = 7`).
//! Komparator zwracajacy NaN daje remis (V8: `ToNumber` + `NumberIsNaN` -> 0), jak `js_cmp_diff`.
//! Sortowane sa INDEKSY elementow (permutacja), wiec `T` nie wymaga `Clone`.
//! Wynik zalezy od dokladnej sciezki porownan przy niespojnych komparatorach (NaN), stad pelny port.

use std::cmp::Ordering;

#[cfg(test)]
mod tests;

const MIN_GALLOP_WINS: usize = 7;

/// Sortowanie `items` komparatorem `cmp` jak V8 `Array.prototype.sort` (stabilne, TimSort).
pub(super) fn v8_sort_by<T>(items: Vec<T>, cmp: &impl Fn(&T, &T) -> Ordering) -> Vec<T> {
    let n = items.len();
    if n < 2 {
        return items;
    }
    let by_index = |x: usize, y: usize| cmp(&items[x], &items[y]);
    let order = timsort((0..n).collect(), &by_index);
    let mut slots: Vec<Option<T>> = items.into_iter().map(Some).collect();
    order
        .into_iter()
        .map(|i| slots[i].take().expect("permutacja indeksow"))
        .collect()
}

/// `ComputeMinRunLength`: n < 64 -> n (jeden run); inaczej n/2^k z ewentualnym +1.
fn min_run_length(mut n: usize) -> usize {
    let mut r = 0;
    while n >= 64 {
        r |= n & 1;
        n >>= 1;
    }
    n + r
}

fn timsort(a: Vec<usize>, cmp: &dyn Fn(usize, usize) -> Ordering) -> Vec<usize> {
    let n = a.len();
    let mut s = Sorter {
        a,
        cmp,
        runs: Vec::new(),
        min_gallop: MIN_GALLOP_WINS,
    };
    let min_run = min_run_length(n);
    let mut low = 0;
    let mut remaining = n;
    while remaining != 0 {
        let mut current = s.count_and_make_run(low, low + remaining);
        if current < min_run {
            let forced = min_run.min(remaining);
            s.binary_insertion_sort(low, low + current, low + forced);
            current = forced;
        }
        s.runs.push((low, current));
        s.merge_collapse();
        low += current;
        remaining -= current;
    }
    s.merge_force_collapse();
    s.a
}

struct Sorter<'c> {
    a: Vec<usize>,
    cmp: &'c dyn Fn(usize, usize) -> Ordering,
    /// Oczekujace runy: (baza, dlugosc).
    runs: Vec<(usize, usize)>,
    min_gallop: usize,
}

enum MergeEnd {
    Succeed,
    CopyB,
}

enum HighEnd {
    Succeed,
    CopyA,
}

impl Sorter<'_> {
    fn run_len(&self, i: usize) -> usize {
        self.runs[i].1
    }

    /// `RunInvariantEstablished`: `len[n-2] > len[n-1] + len[n]` (dla n >= 2).
    fn invariant_established(&self, n: usize) -> bool {
        if n < 2 {
            return true;
        }
        self.run_len(n - 2) > self.run_len(n - 1) + self.run_len(n)
    }

    fn merge_collapse(&mut self) {
        while self.runs.len() > 1 {
            let mut n = self.runs.len() - 2;
            if !self.invariant_established(n + 1) || !self.invariant_established(n) {
                if self.run_len(n - 1) < self.run_len(n + 1) {
                    n -= 1;
                }
                self.merge_at(n);
            } else if self.run_len(n) <= self.run_len(n + 1) {
                self.merge_at(n);
            } else {
                break;
            }
        }
    }

    fn merge_force_collapse(&mut self) {
        while self.runs.len() > 1 {
            let mut n = self.runs.len() - 2;
            if n > 0 && self.run_len(n - 1) < self.run_len(n + 1) {
                n -= 1;
            }
            self.merge_at(n);
        }
    }

    /// `CountAndMakeRun`: dlugosc poczatkowego runu; malejacy run jest odwracany.
    fn count_and_make_run(&mut self, low_arg: usize, high: usize) -> usize {
        let low = low_arg + 1;
        if low == high {
            return 1;
        }
        let mut run_length = 2;
        let element_low = self.a[low];
        let element_low_pre = self.a[low - 1];
        let is_descending = (self.cmp)(element_low, element_low_pre) == Ordering::Less;
        let mut previous = element_low;
        for idx in (low + 1)..high {
            let current = self.a[idx];
            let order = (self.cmp)(current, previous);
            let breaks = if is_descending {
                order != Ordering::Less
            } else {
                order == Ordering::Less
            };
            if breaks {
                break;
            }
            previous = current;
            run_length += 1;
        }
        if is_descending {
            self.a[low_arg..low_arg + run_length].reverse();
        }
        run_length
    }

    /// `BinaryInsertionSort(low, startArg, high)`.
    fn binary_insertion_sort(&mut self, low: usize, start_arg: usize, high: usize) {
        let mut start = if low == start_arg {
            start_arg + 1
        } else {
            start_arg
        };
        while start < high {
            let mut left = low;
            let mut right = start;
            let pivot = self.a[start];
            while left < right {
                let mid = left + ((right - left) >> 1);
                if (self.cmp)(pivot, self.a[mid]) == Ordering::Less {
                    right = mid;
                } else {
                    left = mid + 1;
                }
            }
            self.a[left..=start].rotate_right(1);
            start += 1;
        }
    }

    /// `MergeAt(i)`.
    fn merge_at(&mut self, i: usize) {
        let (base_a, mut len_a) = self.runs[i];
        let (base_b, mut len_b) = self.runs[i + 1];
        self.runs[i].1 = len_a + len_b;
        if i + 3 == self.runs.len() {
            self.runs[i + 1] = self.runs[i + 2];
        }
        self.runs.pop();

        let cmp = self.cmp;
        let key_right = self.a[base_b];
        let k = gallop_right(&self.a, key_right, base_a, len_a, 0, cmp);
        let base_a = base_a + k;
        len_a -= k;
        if len_a == 0 {
            return;
        }
        let key_left = self.a[base_a + len_a - 1];
        len_b = gallop_left(&self.a, key_left, base_b, len_b, len_b - 1, cmp);
        if len_b == 0 {
            return;
        }
        if len_a <= len_b {
            self.merge_low(base_a, len_a, base_b, len_b);
        } else {
            self.merge_high(base_a, len_a, base_b, len_b);
        }
    }

    /// `MergeLow`: run A (po kopii tymczasowej) scalany w przod.
    fn merge_low(&mut self, base_a: usize, len_a_in: usize, base_b: usize, len_b_in: usize) {
        let cmp = self.cmp;
        let mut len_a = len_a_in;
        let mut len_b = len_b_in;
        let temp: Vec<usize> = self.a[base_a..base_a + len_a].to_vec();
        let mut dest = base_a;
        let mut cursor_temp = 0usize;
        let mut cursor_b = base_b;
        self.a[dest] = self.a[cursor_b];
        dest += 1;
        cursor_b += 1;

        let end = 'merge: {
            len_b -= 1;
            if len_b == 0 {
                break 'merge MergeEnd::Succeed;
            }
            if len_a == 1 {
                break 'merge MergeEnd::CopyB;
            }
            let mut min_gallop = self.min_gallop;
            loop {
                let mut wins_a = 0usize;
                let mut wins_b = 0usize;
                loop {
                    let order = cmp(self.a[cursor_b], temp[cursor_temp]);
                    if order == Ordering::Less {
                        self.a[dest] = self.a[cursor_b];
                        dest += 1;
                        cursor_b += 1;
                        wins_b += 1;
                        len_b -= 1;
                        wins_a = 0;
                        if len_b == 0 {
                            break 'merge MergeEnd::Succeed;
                        }
                        if wins_b >= min_gallop {
                            break;
                        }
                    } else {
                        self.a[dest] = temp[cursor_temp];
                        dest += 1;
                        cursor_temp += 1;
                        wins_a += 1;
                        len_a -= 1;
                        wins_b = 0;
                        if len_a == 1 {
                            break 'merge MergeEnd::CopyB;
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
                    min_gallop = if min_gallop > 1 { min_gallop - 1 } else { 1 };
                    self.min_gallop = min_gallop;
                    wins_a = gallop_right(&temp, self.a[cursor_b], cursor_temp, len_a, 0, cmp);
                    if wins_a > 0 {
                        self.a[dest..dest + wins_a]
                            .copy_from_slice(&temp[cursor_temp..cursor_temp + wins_a]);
                        dest += wins_a;
                        cursor_temp += wins_a;
                        len_a -= wins_a;
                        if len_a == 1 {
                            break 'merge MergeEnd::CopyB;
                        }
                        if len_a == 0 {
                            break 'merge MergeEnd::Succeed;
                        }
                    }
                    self.a[dest] = self.a[cursor_b];
                    dest += 1;
                    cursor_b += 1;
                    len_b -= 1;
                    if len_b == 0 {
                        break 'merge MergeEnd::Succeed;
                    }
                    wins_b = gallop_left(&self.a, temp[cursor_temp], cursor_b, len_b, 0, cmp);
                    if wins_b > 0 {
                        self.a.copy_within(cursor_b..cursor_b + wins_b, dest);
                        dest += wins_b;
                        cursor_b += wins_b;
                        len_b -= wins_b;
                        if len_b == 0 {
                            break 'merge MergeEnd::Succeed;
                        }
                    }
                    self.a[dest] = temp[cursor_temp];
                    dest += 1;
                    cursor_temp += 1;
                    len_a -= 1;
                    if len_a == 1 {
                        break 'merge MergeEnd::CopyB;
                    }
                }
                min_gallop += 1;
                self.min_gallop = min_gallop;
            }
        };

        match end {
            MergeEnd::Succeed => {
                if len_a > 0 {
                    self.a[dest..dest + len_a]
                        .copy_from_slice(&temp[cursor_temp..cursor_temp + len_a]);
                }
            }
            MergeEnd::CopyB => {
                self.a.copy_within(cursor_b..cursor_b + len_b, dest);
                self.a[dest + len_b] = temp[cursor_temp];
            }
        }
    }

    /// `MergeHigh`: run B (po kopii tymczasowej) scalany wstecz. Indeksy `isize`, bo V8 przechodzi
    /// przez `-1` przy wyczerpaniu runu.
    fn merge_high(&mut self, base_a: usize, len_a_in: usize, base_b: usize, len_b_in: usize) {
        let cmp = self.cmp;
        let mut len_a = len_a_in;
        let mut len_b = len_b_in;
        let temp: Vec<usize> = self.a[base_b..base_b + len_b].to_vec();
        let mut dest = (base_b + len_b) as isize - 1;
        let mut cursor_temp = len_b as isize - 1;
        let mut cursor_a = (base_a + len_a) as isize - 1;
        self.a[dest as usize] = self.a[cursor_a as usize];
        dest -= 1;
        cursor_a -= 1;

        let end = 'merge: {
            len_a -= 1;
            if len_a == 0 {
                break 'merge HighEnd::Succeed;
            }
            if len_b == 1 {
                break 'merge HighEnd::CopyA;
            }
            let mut min_gallop = self.min_gallop;
            loop {
                let mut wins_a = 0usize;
                let mut wins_b = 0usize;
                loop {
                    let order = cmp(temp[cursor_temp as usize], self.a[cursor_a as usize]);
                    if order == Ordering::Less {
                        self.a[dest as usize] = self.a[cursor_a as usize];
                        dest -= 1;
                        cursor_a -= 1;
                        wins_a += 1;
                        len_a -= 1;
                        wins_b = 0;
                        if len_a == 0 {
                            break 'merge HighEnd::Succeed;
                        }
                        if wins_a >= min_gallop {
                            break;
                        }
                    } else {
                        self.a[dest as usize] = temp[cursor_temp as usize];
                        dest -= 1;
                        cursor_temp -= 1;
                        wins_b += 1;
                        len_b -= 1;
                        wins_a = 0;
                        if len_b == 1 {
                            break 'merge HighEnd::CopyA;
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
                    min_gallop = if min_gallop > 1 { min_gallop - 1 } else { 1 };
                    self.min_gallop = min_gallop;
                    let k = gallop_right(
                        &self.a,
                        temp[cursor_temp as usize],
                        base_a,
                        len_a,
                        len_a - 1,
                        cmp,
                    );
                    wins_a = len_a - k;
                    if wins_a > 0 {
                        dest -= wins_a as isize;
                        cursor_a -= wins_a as isize;
                        let src = (cursor_a + 1) as usize;
                        self.a.copy_within(src..src + wins_a, (dest + 1) as usize);
                        len_a -= wins_a;
                        if len_a == 0 {
                            break 'merge HighEnd::Succeed;
                        }
                    }
                    self.a[dest as usize] = temp[cursor_temp as usize];
                    dest -= 1;
                    cursor_temp -= 1;
                    len_b -= 1;
                    if len_b == 1 {
                        break 'merge HighEnd::CopyA;
                    }
                    let k = gallop_left(&temp, self.a[cursor_a as usize], 0, len_b, len_b - 1, cmp);
                    wins_b = len_b - k;
                    if wins_b > 0 {
                        dest -= wins_b as isize;
                        cursor_temp -= wins_b as isize;
                        let src = (cursor_temp + 1) as usize;
                        let dst = (dest + 1) as usize;
                        self.a[dst..dst + wins_b].copy_from_slice(&temp[src..src + wins_b]);
                        len_b -= wins_b;
                        if len_b == 1 {
                            break 'merge HighEnd::CopyA;
                        }
                        if len_b == 0 {
                            break 'merge HighEnd::Succeed;
                        }
                    }
                    self.a[dest as usize] = self.a[cursor_a as usize];
                    dest -= 1;
                    cursor_a -= 1;
                    len_a -= 1;
                    if len_a == 0 {
                        break 'merge HighEnd::Succeed;
                    }
                }
                min_gallop += 1;
                self.min_gallop = min_gallop;
            }
        };

        match end {
            HighEnd::Succeed => {
                if len_b > 0 {
                    let start = (dest - (len_b as isize - 1)) as usize;
                    self.a[start..start + len_b].copy_from_slice(&temp[..len_b]);
                }
            }
            HighEnd::CopyA => {
                dest -= len_a as isize;
                cursor_a -= len_a as isize;
                let src = (cursor_a + 1) as usize;
                self.a.copy_within(src..src + len_a, (dest + 1) as usize);
                self.a[dest as usize] = temp[cursor_temp as usize];
            }
        }
    }
}

/// `GallopLeft(array, key, base, length, hint)`: k taki, ze `a[base+k-1] < key <= a[base+k]`.
fn gallop_left(
    arr: &[usize],
    key: usize,
    base: usize,
    length: usize,
    hint: usize,
    cmp: &dyn Fn(usize, usize) -> Ordering,
) -> usize {
    let at = |i: isize| arr[i as usize];
    let base = base as isize;
    let length = length as isize;
    let hint = hint as isize;
    let mut last_ofs: isize = 0;
    let mut offset: isize = 1;
    if cmp(at(base + hint), key) == Ordering::Less {
        let max_ofs = length - hint;
        while offset < max_ofs {
            if cmp(at(base + hint + offset), key) != Ordering::Less {
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
            if cmp(at(base + hint - offset), key) == Ordering::Less {
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
        if cmp(at(base + m), key) == Ordering::Less {
            last_ofs = m + 1;
        } else {
            offset = m;
        }
    }
    offset as usize
}

/// `GallopRight(array, key, base, length, hint)`: k taki, ze `a[base+k-1] <= key < a[base+k]`.
fn gallop_right(
    arr: &[usize],
    key: usize,
    base: usize,
    length: usize,
    hint: usize,
    cmp: &dyn Fn(usize, usize) -> Ordering,
) -> usize {
    let at = |i: isize| arr[i as usize];
    let base = base as isize;
    let length = length as isize;
    let hint = hint as isize;
    let mut last_ofs: isize = 0;
    let mut offset: isize = 1;
    if cmp(key, at(base + hint)) == Ordering::Less {
        let max_ofs = hint + 1;
        while offset < max_ofs {
            if cmp(key, at(base + hint - offset)) != Ordering::Less {
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
            if cmp(key, at(base + hint + offset)) == Ordering::Less {
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
        if cmp(key, at(base + m)) == Ordering::Less {
            offset = m;
        } else {
            last_ofs = m + 1;
        }
    }
    offset as usize
}
