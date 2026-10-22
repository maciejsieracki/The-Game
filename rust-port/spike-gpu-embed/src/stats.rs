//! Latency statistics: min / p50 / p95 / max (nearest-rank percentiles).

use serde::{Deserialize, Serialize};

/// Summary of a latency sample set, in milliseconds.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct LatencyStats {
    /// Number of samples that entered the statistics (finite values only).
    pub count: usize,
    /// Number of input values rejected as non-finite (NaN / inf).
    pub rejected_non_finite: usize,
    pub min_ms: f64,
    pub p50_ms: f64,
    pub p95_ms: f64,
    pub max_ms: f64,
    pub mean_ms: f64,
}

/// Nearest-rank percentile on an ascending-sorted, non-empty slice.
///
/// `p` in `(0, 100]`; rank = ceil(p/100 * n), 1-based (no interpolation, so
/// every reported value is an actually observed sample).
pub fn percentile_nearest_rank(sorted: &[f64], p: f64) -> f64 {
    assert!(!sorted.is_empty(), "percentile of an empty set");
    assert!(p > 0.0 && p <= 100.0, "percentile out of range: {p}");
    let n = sorted.len();
    let rank = ((p / 100.0) * n as f64).ceil() as usize;
    sorted[rank.clamp(1, n) - 1]
}

/// Compute [`LatencyStats`]; `None` when there is no finite sample.
pub fn latency_stats(samples: &[f64]) -> Option<LatencyStats> {
    let mut v: Vec<f64> = samples.iter().copied().filter(|x| x.is_finite()).collect();
    let rejected = samples.len() - v.len();
    if v.is_empty() {
        return None;
    }
    v.sort_by(|a, b| a.partial_cmp(b).expect("finite values are comparable"));
    let sum: f64 = v.iter().sum();
    Some(LatencyStats {
        count: v.len(),
        rejected_non_finite: rejected,
        min_ms: v[0],
        p50_ms: percentile_nearest_rank(&v, 50.0),
        p95_ms: percentile_nearest_rank(&v, 95.0),
        max_ms: v[v.len() - 1],
        mean_ms: sum / v.len() as f64,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nearest_rank_on_1_to_100() {
        let v: Vec<f64> = (1..=100).map(f64::from).collect();
        assert_eq!(percentile_nearest_rank(&v, 50.0), 50.0);
        assert_eq!(percentile_nearest_rank(&v, 95.0), 95.0);
        assert_eq!(percentile_nearest_rank(&v, 100.0), 100.0);
        assert_eq!(percentile_nearest_rank(&v, 0.1), 1.0);
    }

    #[test]
    fn nearest_rank_small_sets() {
        assert_eq!(percentile_nearest_rank(&[7.0], 50.0), 7.0);
        assert_eq!(percentile_nearest_rank(&[7.0], 95.0), 7.0);
        // n = 4: p50 -> rank 2, p95 -> rank ceil(3.8) = 4
        let v = [1.0, 2.0, 3.0, 4.0];
        assert_eq!(percentile_nearest_rank(&v, 50.0), 2.0);
        assert_eq!(percentile_nearest_rank(&v, 95.0), 4.0);
    }

    #[test]
    fn stats_unsorted_input_and_mean() {
        let s = latency_stats(&[3.0, 1.0, 2.0, 10.0]).unwrap();
        assert_eq!(s.count, 4);
        assert_eq!(s.min_ms, 1.0);
        assert_eq!(s.max_ms, 10.0);
        assert_eq!(s.p50_ms, 2.0);
        assert_eq!(s.p95_ms, 10.0);
        assert_eq!(s.mean_ms, 4.0);
        assert_eq!(s.rejected_non_finite, 0);
    }

    #[test]
    fn stats_reject_non_finite_and_empty() {
        assert!(latency_stats(&[]).is_none());
        assert!(latency_stats(&[f64::NAN, f64::INFINITY]).is_none());
        let s = latency_stats(&[f64::NAN, 5.0]).unwrap();
        assert_eq!(s.count, 1);
        assert_eq!(s.rejected_non_finite, 1);
        assert_eq!(s.p95_ms, 5.0);
    }

    #[test]
    fn stats_1000_samples_like_the_spike() {
        // 1000 PointerMove events: values 0.001 .. 1.000 ms
        let v: Vec<f64> = (1..=1000).map(|i| i as f64 / 1000.0).collect();
        let s = latency_stats(&v).unwrap();
        assert_eq!(s.count, 1000);
        assert_eq!(s.p50_ms, 0.5);
        assert_eq!(s.p95_ms, 0.95);
        assert_eq!(s.max_ms, 1.0);
    }
}
