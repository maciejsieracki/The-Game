use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

const LCG_MULTIPLIER: u32 = 1_664_525;
const LCG_INCREMENT: u32 = 1_013_904_223;
const UNIT_SCALE: f64 = 4_294_967_296.0;

/// Errors returned by bounded RNG operations.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RngError {
    /// The half-open interval was empty or reversed.
    InvalidRange { start: u32, end: u32 },
}

impl fmt::Display for RngError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidRange { start, end } => write!(
                formatter,
                "RNG range must satisfy start < end, got {start}..{end}"
            ),
        }
    }
}

impl Error for RngError {}

/// Seeded 32-bit LCG compatible with the TypeScript `lcgNext` contract.
///
/// The state is explicit and serializable. There is no global mutable state;
/// callers own each stream and may checkpoint it with [`Rng::state`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Rng {
    state: u32,
}

impl Rng {
    /// Creates a stream whose first step uses `seed` as its initial state.
    pub const fn new(seed: u32) -> Self {
        Self { state: seed }
    }

    /// Alias that makes the seed-based construction explicit at call sites.
    pub const fn from_seed(seed: u32) -> Self {
        Self::new(seed)
    }

    /// Restores a stream from a previously observed state.
    pub const fn from_state(state: u32) -> Self {
        Self { state }
    }

    /// Returns the exact state used by the next step.
    pub const fn state(&self) -> u32 {
        self.state
    }

    /// Advances the Numerical Recipes 32-bit LCG and returns its new state.
    pub fn next_u32(&mut self) -> u32 {
        self.state = self
            .state
            .wrapping_mul(LCG_MULTIPLIER)
            .wrapping_add(LCG_INCREMENT);
        self.state
    }

    /// Advances the stream and returns a value in `[0, 1)`.
    pub fn next_f64(&mut self) -> f64 {
        f64::from(self.next_u32()) / UNIT_SCALE
    }

    /// Returns a uniformly sampled value from the half-open interval `[start, end)`.
    ///
    /// Rejection sampling avoids modulo bias while keeping the same underlying
    /// LCG stream and makes invalid bounds explicit instead of silently fixing them.
    pub fn gen_range(&mut self, start: u32, end: u32) -> Result<u32, RngError> {
        if start >= end {
            return Err(RngError::InvalidRange { start, end });
        }

        let width = end - start;
        let limit = u32::MAX - (u32::MAX % width);
        loop {
            let sample = self.next_u32();
            if sample < limit {
                return Ok(start + (sample % width));
            }
        }
    }

    /// Creates a deterministic child stream without consuming this stream.
    ///
    /// Different branch identifiers produce different initial states for the
    /// same parent state, while repeating the same `(state, branch)` pair is
    /// fully reproducible.
    pub const fn fork(&self, branch: u32) -> Self {
        let input = self
            .state
            .wrapping_add(branch.wrapping_mul(0x9e37_79b9))
            .wrapping_add(0x6d2b_79f5);
        Self::from_state(mix32(input))
    }
}

const fn mix32(mut value: u32) -> u32 {
    value ^= value >> 16;
    value = value.wrapping_mul(0x85eb_ca6b);
    value ^= value >> 13;
    value = value.wrapping_mul(0xc2b2_ae35);
    value ^ (value >> 16)
}
