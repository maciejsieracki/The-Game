//! Deterministic input and checkpoint recording for engine comparisons.
//!
//! A replay is an ordered, versioned value rather than a process-wide recorder.
//! It keeps the initial RNG seed, every input in insertion order, the exact RNG
//! state observed for that input, and an optional validated save snapshot.  The
//! value can therefore be serialized at the Rust/TS boundary and replayed
//! without depending on clocks, global state, or map iteration order.

use std::{error::Error, fmt};

use serde::{de, Deserialize, Deserializer, Serialize};

#[cfg(not(test))]
pub use super::save_load::SaveSnapshot;
#[cfg(test)]
pub use super::save_load::SaveSnapshot;

#[cfg(not(test))]
use super::Rng;
#[cfg(test)]
use civ_engine::Rng;

/// The current wire format for a replay log.
pub const CURRENT_REPLAY_VERSION: u16 = 1;

/// Stable sequence number assigned to a recorded input.
pub type ReplaySequence = u64;

/// One input together with the deterministic state at which it was observed.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ReplayStep<I> {
    sequence: ReplaySequence,
    turn: u32,
    input: I,
    rng_state: u32,
    snapshot: Option<SaveSnapshot>,
}

/// Semantic alias for consumers that call a replay item a frame.
pub type ReplayFrame<I> = ReplayStep<I>;

impl<I> ReplayStep<I> {
    /// Creates a materialized step, primarily for import/adapters.
    pub fn new(
        sequence: ReplaySequence,
        turn: u32,
        input: I,
        rng_state: u32,
        snapshot: Option<SaveSnapshot>,
    ) -> Self {
        Self {
            sequence,
            turn,
            input,
            rng_state,
            snapshot,
        }
    }

    pub const fn sequence(&self) -> ReplaySequence {
        self.sequence
    }

    pub const fn id(&self) -> ReplaySequence {
        self.sequence
    }

    pub const fn turn(&self) -> u32 {
        self.turn
    }

    pub fn input(&self) -> &I {
        &self.input
    }

    pub const fn rng_state(&self) -> u32 {
        self.rng_state
    }

    /// Returns the checkpoint captured alongside this input, if present.
    pub fn snapshot(&self) -> Option<&SaveSnapshot> {
        self.snapshot.as_ref()
    }

    pub fn into_parts(self) -> (ReplaySequence, u32, I, u32, Option<SaveSnapshot>) {
        (
            self.sequence,
            self.turn,
            self.input,
            self.rng_state,
            self.snapshot,
        )
    }
}

/// Errors raised when a replay cannot be recorded or restored safely.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReplayError {
    /// The version field was omitted from the wire payload.
    MissingVersion,
    /// The wire payload is outside the supported format boundary.
    UnsupportedVersion { found: u16, current: u16 },
    /// A step sequence would exceed the representable ID range.
    SequenceExhausted,
    /// Imported steps must be zero-based and contiguous.
    NonContiguousSequence {
        expected: ReplaySequence,
        found: ReplaySequence,
    },
    /// A checkpoint did not satisfy the save/load snapshot contract.
    InvalidSnapshot(String),
}

impl fmt::Display for ReplayError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingVersion => formatter.write_str("replay version is missing"),
            Self::UnsupportedVersion { found, current } => write!(
                formatter,
                "unsupported replay version {found}; current version is {current}"
            ),
            Self::SequenceExhausted => formatter.write_str("replay sequence is exhausted"),
            Self::NonContiguousSequence { expected, found } => write!(
                formatter,
                "expected replay sequence {expected}, found {found}"
            ),
            Self::InvalidSnapshot(error) => {
                write!(formatter, "replay snapshot is invalid: {error}")
            }
        }
    }
}

impl Error for ReplayError {}

/// A serializable, deterministic input log.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ReplayLog<I> {
    version: u16,
    seed: u32,
    steps: Vec<ReplayStep<I>>,
}

#[derive(Debug, Deserialize)]
struct ReplayWire<I> {
    #[serde(default)]
    version: Option<u16>,
    seed: u32,
    steps: Vec<ReplayStep<I>>,
}

impl<'de, I> Deserialize<'de> for ReplayLog<I>
where
    I: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let wire = ReplayWire::<I>::deserialize(deserializer)?;
        let version = wire
            .version
            .ok_or_else(|| de::Error::custom(ReplayError::MissingVersion))?;
        let replay = Self {
            version,
            seed: wire.seed,
            steps: wire.steps,
        };
        replay.validate().map_err(de::Error::custom)?;
        Ok(replay)
    }
}

impl<I> ReplayLog<I> {
    /// Creates an empty current-format log with a deterministic initial seed.
    pub fn new(seed: u32) -> Self {
        Self {
            version: CURRENT_REPLAY_VERSION,
            seed,
            steps: Vec::new(),
        }
    }

    /// Creates an empty current-format log with reserved step storage.
    pub fn with_capacity(seed: u32, capacity: usize) -> Self {
        Self {
            version: CURRENT_REPLAY_VERSION,
            seed,
            steps: Vec::with_capacity(capacity),
        }
    }

    /// Imports already materialized steps after checking their invariants.
    pub fn from_steps(seed: u32, steps: Vec<ReplayStep<I>>) -> Result<Self, ReplayError> {
        let replay = Self {
            version: CURRENT_REPLAY_VERSION,
            seed,
            steps,
        };
        replay.validate()?;
        Ok(replay)
    }

    pub const fn version(&self) -> u16 {
        self.version
    }

    pub const fn seed(&self) -> u32 {
        self.seed
    }

    pub fn len(&self) -> usize {
        self.steps.len()
    }

    pub fn is_empty(&self) -> bool {
        self.steps.is_empty()
    }

    pub fn steps(&self) -> &[ReplayStep<I>] {
        &self.steps
    }

    pub fn iter(&self) -> std::slice::Iter<'_, ReplayStep<I>> {
        self.steps.iter()
    }

    pub fn step(&self, index: usize) -> Option<&ReplayStep<I>> {
        self.steps.get(index)
    }

    /// Appends an input using an explicitly supplied RNG checkpoint.
    pub fn record(
        &mut self,
        turn: u32,
        input: I,
        rng_state: u32,
        snapshot: Option<SaveSnapshot>,
    ) -> Result<ReplaySequence, ReplayError> {
        let sequence = self.next_sequence()?;
        validate_snapshot(snapshot.as_ref())?;
        self.steps
            .push(ReplayStep::new(sequence, turn, input, rng_state, snapshot));
        Ok(sequence)
    }

    /// Check the format, sequence, and every optional snapshot invariant.
    pub fn validate(&self) -> Result<(), ReplayError> {
        if self.version != CURRENT_REPLAY_VERSION {
            return Err(ReplayError::UnsupportedVersion {
                found: self.version,
                current: CURRENT_REPLAY_VERSION,
            });
        }

        for (index, step) in self.steps.iter().enumerate() {
            let expected = index as ReplaySequence;
            if step.sequence != expected {
                return Err(ReplayError::NonContiguousSequence {
                    expected,
                    found: step.sequence,
                });
            }
            validate_snapshot(step.snapshot())?;
        }
        Ok(())
    }

    /// Starts deterministic playback from the log's initial seed.
    pub fn replay(&self) -> Result<ReplayPlayback<'_, I>, ReplayError> {
        self.validate()?;
        Ok(ReplayPlayback {
            replay: self,
            position: 0,
            rng: Rng::new(self.seed),
        })
    }

    /// Semantic alias for [`ReplayLog::replay`].
    pub fn playback(&self) -> Result<ReplayPlayback<'_, I>, ReplayError> {
        self.replay()
    }

    fn next_sequence(&self) -> Result<ReplaySequence, ReplayError> {
        self.steps
            .len()
            .try_into()
            .map_err(|_| ReplayError::SequenceExhausted)
    }
}

impl<I> IntoIterator for ReplayLog<I> {
    type Item = ReplayStep<I>;
    type IntoIter = std::vec::IntoIter<ReplayStep<I>>;

    fn into_iter(self) -> Self::IntoIter {
        self.steps.into_iter()
    }
}

/// Owns the RNG stream while inputs are recorded.
///
/// Callers advance [`ReplayRecorder::rng_mut`] (or use [`ReplayRecorder::next_u32`])
/// at the same points as the engine.  Each call to [`ReplayRecorder::record`]
/// captures the exact state that precedes the input, so the log does not hide
/// random consumption behind an implicit draw.
pub struct ReplayRecorder<I> {
    replay: ReplayLog<I>,
    rng: Rng,
}

impl<I> ReplayRecorder<I> {
    pub fn new(seed: u32) -> Self {
        Self {
            replay: ReplayLog::new(seed),
            rng: Rng::new(seed),
        }
    }

    pub fn with_capacity(seed: u32, capacity: usize) -> Self {
        Self {
            replay: ReplayLog::with_capacity(seed, capacity),
            rng: Rng::new(seed),
        }
    }

    pub const fn seed(&self) -> u32 {
        self.replay.seed()
    }

    pub fn rng(&self) -> &Rng {
        &self.rng
    }

    pub fn rng_mut(&mut self) -> &mut Rng {
        &mut self.rng
    }

    pub fn next_u32(&mut self) -> u32 {
        self.rng.next_u32()
    }

    pub fn record(
        &mut self,
        turn: u32,
        input: I,
        snapshot: Option<SaveSnapshot>,
    ) -> Result<ReplaySequence, ReplayError> {
        self.replay.record(turn, input, self.rng.state(), snapshot)
    }

    pub fn record_input(&mut self, turn: u32, input: I) -> Result<ReplaySequence, ReplayError> {
        self.record(turn, input, None)
    }

    pub fn record_input_with_snapshot(
        &mut self,
        turn: u32,
        input: I,
        snapshot: SaveSnapshot,
    ) -> Result<ReplaySequence, ReplayError> {
        self.record(turn, input, Some(snapshot))
    }

    pub fn log(&self) -> &ReplayLog<I> {
        &self.replay
    }

    pub fn len(&self) -> usize {
        self.replay.len()
    }

    pub fn is_empty(&self) -> bool {
        self.replay.is_empty()
    }

    pub fn finish(self) -> ReplayLog<I> {
        self.replay
    }

    /// Semantic alias for [`ReplayRecorder::finish`].
    pub fn into_log(self) -> ReplayLog<I> {
        self.finish()
    }
}

/// A deterministic cursor over a validated replay log.
pub struct ReplayPlayback<'a, I> {
    replay: &'a ReplayLog<I>,
    position: usize,
    rng: Rng,
}

/// Semantic alias for consumers that call playback a player.
pub type ReplayPlayer<'a, I> = ReplayPlayback<'a, I>;

impl<'a, I> ReplayPlayback<'a, I> {
    pub const fn seed(&self) -> u32 {
        self.replay.seed()
    }

    pub fn replay(&self) -> &'a ReplayLog<I> {
        self.replay
    }

    pub const fn position(&self) -> usize {
        self.position
    }

    pub fn remaining(&self) -> usize {
        self.replay.len().saturating_sub(self.position)
    }

    pub fn is_finished(&self) -> bool {
        self.position >= self.replay.len()
    }

    pub fn peek(&self) -> Option<&'a ReplayStep<I>> {
        self.replay.step(self.position)
    }

    /// Returns the next input and restores the exact RNG checkpoint recorded
    /// for it before advancing the cursor.
    pub fn next(&mut self) -> Option<&'a ReplayStep<I>> {
        let step = self.replay.step(self.position)?;
        self.rng = Rng::from_state(step.rng_state());
        self.position += 1;
        Some(step)
    }

    pub fn next_input(&mut self) -> Option<&'a I> {
        self.next().map(ReplayStep::input)
    }

    pub fn rng(&self) -> &Rng {
        &self.rng
    }

    pub fn rng_mut(&mut self) -> &mut Rng {
        &mut self.rng
    }

    pub fn reset(&mut self) {
        self.position = 0;
        self.rng = Rng::new(self.seed());
    }
}

fn validate_snapshot(snapshot: Option<&SaveSnapshot>) -> Result<(), ReplayError> {
    if let Some(snapshot) = snapshot {
        snapshot
            .validate()
            .map_err(|error| ReplayError::InvalidSnapshot(error.to_string()))?;
    }
    Ok(())
}
