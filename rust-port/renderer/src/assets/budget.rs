//! Budget and report for the "N turns does not grow resources" regression
//! test (P4.3 §7.3 points 6–8).
//!
//! The thresholds are **parameters**: owner decision `D-RR-7` is still open.
//! The default ([`Budget::default`] = [`Budget::no_growth`]) is the dispatch
//! default: live resources (count per kind, bytes, active subscriptions)
//! after N turns must be **≤** the values after the baseline turn
//! ([`DEFAULT_BASELINE_TURN`] = 10), i.e. no growth at all.

use std::fmt;

use super::registry::{RegistryStats, ResourceKind};

/// Default baseline turn of the N-turn test.
pub const DEFAULT_BASELINE_TURN: u32 = 10;
/// Default checkpoints compared against the baseline.
pub const DEFAULT_CHECK_TURNS: [u32; 2] = [50, 200];

/// State of the asset layer at one point of a game (for before/after
/// comparisons).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Snapshot {
    /// Turn number the snapshot was taken after.
    pub turn: u32,
    /// Registry counters.
    pub resources: RegistryStats,
    /// Active listener subscriptions (sum over the tracked lists).
    pub subscriptions: u64,
}

impl Snapshot {
    /// Builds a snapshot.
    #[must_use]
    pub const fn new(turn: u32, resources: RegistryStats, subscriptions: u64) -> Self {
        Self {
            turn,
            resources,
            subscriptions,
        }
    }

    /// Live count of one kind.
    #[must_use]
    pub const fn live(&self, kind: ResourceKind) -> u64 {
        self.resources.kind(kind).live
    }
}

impl fmt::Display for Snapshot {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "turn={:>3}", self.turn)?;
        for kind in ResourceKind::ALL {
            write!(f, " {}={}", kind.name(), self.live(kind))?;
        }
        write!(
            f,
            " live_bytes={} subscriptions={} created={} destroyed={}",
            self.resources.total_live_bytes(),
            self.subscriptions,
            self.resources.total_created(),
            self.resources.total_destroyed()
        )
    }
}

/// Allowed growth of one metric over its baseline value:
/// `allowed = baseline + absolute + baseline * percent / 100`.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Growth {
    /// Absolute slack.
    pub absolute: u64,
    /// Relative slack in percent of the baseline.
    pub percent: u32,
}

impl Growth {
    /// No growth allowed.
    pub const NONE: Self = Self {
        absolute: 0,
        percent: 0,
    };

    /// Upper bound for a metric with the given baseline value.
    #[must_use]
    pub const fn allowed(self, baseline: u64) -> u64 {
        baseline
            .saturating_add(self.absolute)
            .saturating_add(baseline.saturating_mul(self.percent as u64) / 100)
    }
}

/// Which metric broke the budget.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Metric {
    /// Live count of one resource kind grew too much.
    LiveCount(ResourceKind),
    /// Live bytes (all kinds) grew too much.
    LiveBytes,
    /// Active subscriptions grew too much.
    Subscriptions,
    /// Live count of one kind exceeds its hard cap.
    HardCap(ResourceKind),
}

/// One broken threshold.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Violation {
    /// The metric.
    pub metric: Metric,
    /// Baseline value (0 for hard caps).
    pub baseline: u64,
    /// Current value.
    pub current: u64,
    /// Highest allowed value.
    pub allowed: u64,
}

impl fmt::Display for Violation {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let name = match self.metric {
            Metric::LiveCount(k) => format!("live {}", k.name()),
            Metric::LiveBytes => "live bytes".to_owned(),
            Metric::Subscriptions => "subscriptions".to_owned(),
            Metric::HardCap(k) => format!("hard cap {}", k.name()),
        };
        write!(
            f,
            "{name}: baseline={} current={} allowed={}",
            self.baseline, self.current, self.allowed
        )
    }
}

/// Configurable thresholds (`D-RR-7` open → parameters).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Budget {
    /// Allowed growth of live count, per kind (index = [`ResourceKind::index`]).
    pub live_count: [Growth; ResourceKind::COUNT],
    /// Allowed growth of live bytes (all kinds).
    pub live_bytes: Growth,
    /// Allowed growth of active subscriptions.
    pub subscriptions: Growth,
    /// Optional absolute cap of live count per kind (P4.3 §7.3 point 6).
    pub hard_cap_live: [Option<u64>; ResourceKind::COUNT],
}

impl Default for Budget {
    fn default() -> Self {
        Self::no_growth()
    }
}

impl Budget {
    /// Dispatch default: nothing may grow over the baseline.
    #[must_use]
    pub const fn no_growth() -> Self {
        Self {
            live_count: [Growth::NONE; ResourceKind::COUNT],
            live_bytes: Growth::NONE,
            subscriptions: Growth::NONE,
            hard_cap_live: [None; ResourceKind::COUNT],
        }
    }

    /// Compares `current` with `baseline`.
    ///
    /// # Errors
    /// Every broken threshold, in a fixed order (per-kind counts, bytes,
    /// subscriptions, hard caps).
    pub fn check(&self, baseline: &Snapshot, current: &Snapshot) -> Result<(), Vec<Violation>> {
        let mut violations = Vec::new();
        let mut cmp = |metric, base: u64, cur: u64, growth: Growth| {
            let allowed = growth.allowed(base);
            if cur > allowed {
                violations.push(Violation {
                    metric,
                    baseline: base,
                    current: cur,
                    allowed,
                });
            }
        };
        for kind in ResourceKind::ALL {
            cmp(
                Metric::LiveCount(kind),
                baseline.live(kind),
                current.live(kind),
                self.live_count[kind.index()],
            );
        }
        cmp(
            Metric::LiveBytes,
            baseline.resources.total_live_bytes(),
            current.resources.total_live_bytes(),
            self.live_bytes,
        );
        cmp(
            Metric::Subscriptions,
            baseline.subscriptions,
            current.subscriptions,
            self.subscriptions,
        );
        for kind in ResourceKind::ALL {
            if let Some(cap) = self.hard_cap_live[kind.index()] {
                let cur = current.live(kind);
                if cur > cap {
                    violations.push(Violation {
                        metric: Metric::HardCap(kind),
                        baseline: 0,
                        current: cur,
                        allowed: cap,
                    });
                }
            }
        }
        if violations.is_empty() {
            Ok(())
        } else {
            Err(violations)
        }
    }
}
