//! P6.M07B-Q4 partia 4c: limit kwot rzek (`capRiverQuotas`).
//! Web (pin `4bbef081d`, gen-helpers.ts): `capRiverQuotas` (:6943).
//! Wektory: `tests/p6_m07b4_vectors/web-rivers-b-q4.json` (`gen_q4_vectors.mjs`).

/// Web `capRiverQuotas(quotas, maxTotal)` (:6943). Ujemne kwoty -> 0; gdy suma > `max_total`,
/// zmniejsza o 1 kwote NAJWIEKSZA (pierwsza z lewej przy remisie, `>` scisle) az do sumy
/// `max_total`; przerywa, gdy najwieksza kwota <= 1 (kwoty 0/1 nigdy nie schodza nizej).
/// Pusta lista przy `max_total < 0`: web czyta `q[0] ?? 0` = 0 -> `break` (wynik pusty).
pub fn cap_river_quotas(quotas: &[i64], max_total: i64) -> Vec<i64> {
    let mut q: Vec<i64> = quotas.iter().map(|&n| n.max(0)).collect();
    let mut sum: i64 = q.iter().sum();
    if sum <= max_total {
        return q;
    }
    while sum > max_total {
        let mut idx = 0usize;
        for i in 1..q.len() {
            if q[i] > q[idx] {
                idx = i;
            }
        }
        if q.get(idx).copied().unwrap_or(0) <= 1 {
            break;
        }
        q[idx] -= 1;
        sum -= 1;
    }
    q
}
