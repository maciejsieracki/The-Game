//! Clock alignment between the webview (`performance.now()`, ms) and Rust
//! (ms since the spike start, monotonic `Instant`).
//!
//! Method (NTP-like, minimum round trip): the webview takes `t0_js`, invokes a
//! Rust command that returns `t_rust`, then takes `t1_js`. Assuming the request
//! and the reply take equally long, `offset = t_rust - (t0_js + t1_js) / 2`, so
//! `rust_time ~= js_time + offset`. The sample with the smallest round trip is
//! used; its half round trip is the uncertainty bound of every one-way latency
//! computed with that offset (reported next to the statistics).

use serde::{Deserialize, Serialize};

/// One clock-sync round trip.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct SyncSample {
    pub t0_js: f64,
    pub t_rust: f64,
    pub t1_js: f64,
}

/// Result of the offset estimation.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ClockOffset {
    /// `rust_time = js_time + offset_ms`.
    pub offset_ms: f64,
    /// Half of the best round trip: bound of the one-way latency error.
    pub uncertainty_ms: f64,
    /// Best (smallest) round trip, ms.
    pub best_rtt_ms: f64,
    /// Samples used (valid: finite and `t1_js >= t0_js`).
    pub samples_used: usize,
}

/// Estimate the offset from the sample with the minimal round trip.
/// Returns `None` when no sample is valid.
pub fn estimate_offset(samples: &[SyncSample]) -> Option<ClockOffset> {
    let valid: Vec<&SyncSample> = samples
        .iter()
        .filter(|s| {
            s.t0_js.is_finite() && s.t1_js.is_finite() && s.t_rust.is_finite() && s.t1_js >= s.t0_js
        })
        .collect();
    let best = valid.iter().min_by(|a, b| {
        (a.t1_js - a.t0_js)
            .partial_cmp(&(b.t1_js - b.t0_js))
            .expect("finite")
    })?;
    let rtt = best.t1_js - best.t0_js;
    Some(ClockOffset {
        offset_ms: best.t_rust - (best.t0_js + best.t1_js) / 2.0,
        uncertainty_ms: rtt / 2.0,
        best_rtt_ms: rtt,
        samples_used: valid.len(),
    })
}

/// One-way latency webview -> Rust.
pub fn latency_webview_to_rust(t_js_send: f64, t_rust_recv: f64, offset_ms: f64) -> f64 {
    t_rust_recv - (t_js_send + offset_ms)
}

/// One-way latency Rust -> webview.
pub fn latency_rust_to_webview(t_rust_send: f64, t_js_recv: f64, offset_ms: f64) -> f64 {
    (t_js_recv + offset_ms) - t_rust_send
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_min_rtt_sample() {
        // true offset = 1000 (rust = js + 1000); symmetric delays
        let samples = [
            SyncSample {
                t0_js: 0.0,
                t_rust: 1005.0,
                t1_js: 10.0,
            }, // rtt 10
            SyncSample {
                t0_js: 20.0,
                t_rust: 1021.0,
                t1_js: 22.0,
            }, // rtt 2 -> offset 1000
            SyncSample {
                t0_js: 30.0,
                t_rust: 1040.0,
                t1_js: 50.0,
            }, // rtt 20
        ];
        let o = estimate_offset(&samples).unwrap();
        assert_eq!(o.offset_ms, 1000.0);
        assert_eq!(o.best_rtt_ms, 2.0);
        assert_eq!(o.uncertainty_ms, 1.0);
        assert_eq!(o.samples_used, 3);
    }

    #[test]
    fn rejects_invalid_samples() {
        assert!(estimate_offset(&[]).is_none());
        let bad = [
            SyncSample {
                t0_js: 5.0,
                t_rust: 1.0,
                t1_js: 4.0,
            }, // t1 < t0
            SyncSample {
                t0_js: f64::NAN,
                t_rust: 1.0,
                t1_js: 4.0,
            },
        ];
        assert!(estimate_offset(&bad).is_none());
    }

    #[test]
    fn negative_offset_is_fine() {
        let s = [SyncSample {
            t0_js: 5000.0,
            t_rust: 12.0,
            t1_js: 5004.0,
        }];
        let o = estimate_offset(&s).unwrap();
        assert_eq!(o.offset_ms, 12.0 - 5002.0);
    }

    #[test]
    fn one_way_latencies() {
        // rust = js + 1000; js sends at js=10, rust receives at rust=1013 -> 3 ms
        assert_eq!(latency_webview_to_rust(10.0, 1013.0, 1000.0), 3.0);
        // rust sends at rust=1020, js receives at js=24 -> (24+1000)-1020 = 4 ms
        assert_eq!(latency_rust_to_webview(1020.0, 24.0, 1000.0), 4.0);
    }
}
