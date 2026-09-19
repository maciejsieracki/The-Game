//! Deterministic turn phases and event queue primitives.
//!
//! The queue is intentionally independent from the rest of the game state.  A
//! caller can attach an economy, AI, or barbarian command/result as the event
//! payload without making this module depend on any of those systems.  Events
//! are ordered by `(turn, phase, insertion sequence)`, so inserting a later
//! phase before an earlier one cannot change the turn pipeline.

use std::{
    collections::{BTreeSet, VecDeque},
    error::Error,
    fmt,
};

use serde::{de, Deserialize, Deserializer, Serialize};

/// Number of phases in one canonical turn pipeline.
pub const PHASE_COUNT: usize = 9;

/// The canonical phase order used by the turn pipeline.
///
/// The order is data, rather than an incidental consequence of call-site
/// order.  In particular, economy is resolved before AI, AI before
/// barbarians, and victory is checked after both have finished.
pub const CANONICAL_PHASE_ORDER: [TurnPhase; PHASE_COUNT] = [
    TurnPhase::StartTurn,
    TurnPhase::PlayerActions,
    TurnPhase::Diplomacy,
    TurnPhase::Economy,
    TurnPhase::Production,
    TurnPhase::Ai,
    TurnPhase::Barbarians,
    TurnPhase::Victory,
    TurnPhase::EndTurn,
];

/// Backwards-friendly name for consumers that refer to the schedule as a
/// turn-phase order.
pub const TURN_PHASE_ORDER: [TurnPhase; PHASE_COUNT] = CANONICAL_PHASE_ORDER;

/// A stage of the deterministic turn pipeline.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
#[repr(u8)]
pub enum TurnPhase {
    /// Increment/reset turn-scoped state and prepare the new turn.
    StartTurn = 0,
    /// Human-player actions are collected before world resolution.
    PlayerActions = 1,
    /// Resolve player/AI diplomatic state changes.
    Diplomacy = 2,
    /// Resolve income, upkeep, growth, and other economy effects.
    Economy = 3,
    /// Advance city production after economy has supplied its work budget.
    Production = 4,
    /// Resolve deterministic AI plans and execute their commands.
    Ai = 5,
    /// Spawn and move barbarian camps/units after AI actions.
    Barbarians = 6,
    /// Evaluate victory or defeat against the fully resolved world state.
    Victory = 7,
    /// Publish the resolved state and close the turn transition.
    EndTurn = 8,
}

impl TurnPhase {
    /// Return the stable rank used by queue ordering.
    pub const fn order_index(self) -> u8 {
        match self {
            Self::StartTurn => 0,
            Self::PlayerActions => 1,
            Self::Diplomacy => 2,
            Self::Economy => 3,
            Self::Production => 4,
            Self::Ai => 5,
            Self::Barbarians => 6,
            Self::Victory => 7,
            Self::EndTurn => 8,
        }
    }

    /// Return the next phase in the canonical pipeline.
    pub const fn next(self) -> Option<Self> {
        match self {
            Self::StartTurn => Some(Self::PlayerActions),
            Self::PlayerActions => Some(Self::Diplomacy),
            Self::Diplomacy => Some(Self::Economy),
            Self::Economy => Some(Self::Production),
            Self::Production => Some(Self::Ai),
            Self::Ai => Some(Self::Barbarians),
            Self::Barbarians => Some(Self::Victory),
            Self::Victory => Some(Self::EndTurn),
            Self::EndTurn => None,
        }
    }

    /// Whether this phase precedes `other` in the canonical pipeline.
    pub const fn is_before(self, other: Self) -> bool {
        self.order_index() < other.order_index()
    }

    /// The complete canonical schedule.
    pub const fn all() -> &'static [Self; PHASE_COUNT] {
        &CANONICAL_PHASE_ORDER
    }

    /// A semantic alias for [`TurnPhase::order_index`].
    pub const fn rank(self) -> u8 {
        self.order_index()
    }

    /// Uppercase aliases keep the common AI/barbarian spellings available to
    /// integrations without adding duplicate enum variants to the schedule.
    pub const AI: Self = Self::Ai;
    pub const BARBARIAN: Self = Self::Barbarians;
    pub const HUMAN: Self = Self::PlayerActions;
}

/// Return the canonical turn schedule.
pub const fn canonical_phase_order() -> &'static [TurnPhase; PHASE_COUNT] {
    &CANONICAL_PHASE_ORDER
}

/// Alias used by callers that describe the schedule as a phase order.
pub const fn phase_order() -> &'static [TurnPhase; PHASE_COUNT] {
    &CANONICAL_PHASE_ORDER
}

/// Identifier assigned to an event when it enters a queue.
pub type EventId = u64;

/// A small built-in event vocabulary for the standard turn pipeline.
///
/// [`EventQueue`] is generic, so applications with richer command payloads do
/// not need to use this enum.  It is nevertheless useful for adapters and for
/// serializable smoke tests of the economy/AI/barbarian phase boundaries.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TurnEvent {
    TurnStarted(u32),
    PlayerTurnEnded(u32),
    DiplomacyTick,
    EconomyTick,
    ProductionTick,
    AiTurn(u32),
    BarbariansTick,
    VictoryCheck,
    TurnEnded(u32),
    Custom(String),
}

/// Generic names used by older adapters for the built-in event vocabulary.
pub type GameEvent = TurnEvent;
pub type EventKind = TurnEvent;
pub type Event = TurnEvent;

impl TurnEvent {
    /// Map a built-in event to the phase responsible for it.
    pub const fn default_phase(&self) -> TurnPhase {
        match self {
            Self::TurnStarted(_) => TurnPhase::StartTurn,
            Self::PlayerTurnEnded(_) => TurnPhase::PlayerActions,
            Self::DiplomacyTick => TurnPhase::Diplomacy,
            Self::EconomyTick => TurnPhase::Economy,
            Self::ProductionTick => TurnPhase::Production,
            Self::AiTurn(_) => TurnPhase::Ai,
            Self::BarbariansTick => TurnPhase::Barbarians,
            Self::VictoryCheck => TurnPhase::Victory,
            Self::TurnEnded(_) | Self::Custom(_) => TurnPhase::EndTurn,
        }
    }

    /// Stable human/machine-readable event category.
    pub const fn kind_name(&self) -> &'static str {
        match self {
            Self::TurnStarted(_) => "turn_started",
            Self::PlayerTurnEnded(_) => "player_turn_ended",
            Self::DiplomacyTick => "diplomacy_tick",
            Self::EconomyTick => "economy_tick",
            Self::ProductionTick => "production_tick",
            Self::AiTurn(_) => "ai_turn",
            Self::BarbariansTick => "barbarians_tick",
            Self::VictoryCheck => "victory_check",
            Self::TurnEnded(_) => "turn_ended",
            Self::Custom(_) => "custom",
        }
    }

    /// Construct a custom event without exposing the enum representation to
    /// callers that only need a label.
    pub fn custom(label: impl Into<String>) -> Self {
        Self::Custom(label.into())
    }
}

/// One event together with the ordering metadata assigned by its queue.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct QueuedEvent<T = TurnEvent> {
    /// Monotonically increasing insertion sequence, also usable as an ID.
    pub sequence: EventId,
    /// Turn to which the event belongs.
    pub turn: u32,
    /// Pipeline phase in which the event is resolved.
    pub phase: TurnPhase,
    /// Domain-specific payload.
    pub event: T,
}

impl<T> QueuedEvent<T> {
    /// Build an event entry before it is assigned a queue sequence.
    ///
    /// Most callers should use [`EventQueue::enqueue`], which assigns a unique
    /// sequence.  This constructor is useful for deserialization adapters.
    pub const fn new(turn: u32, phase: TurnPhase, event: T) -> Self {
        Self {
            sequence: 0,
            turn,
            phase,
            event,
        }
    }

    /// Build an entry with an explicit sequence, for state restore/import.
    pub const fn with_sequence(sequence: EventId, turn: u32, phase: TurnPhase, event: T) -> Self {
        Self {
            sequence,
            turn,
            phase,
            event,
        }
    }

    pub const fn id(&self) -> EventId {
        self.sequence
    }

    pub const fn sequence(&self) -> EventId {
        self.sequence
    }

    pub const fn turn(&self) -> u32 {
        self.turn
    }

    pub const fn phase(&self) -> TurnPhase {
        self.phase
    }

    pub fn event(&self) -> &T {
        &self.event
    }

    pub fn event_mut(&mut self) -> &mut T {
        &mut self.event
    }

    pub fn into_event(self) -> T {
        self.event
    }

    fn order_key(&self) -> (u32, u8, EventId) {
        (self.turn, self.phase.order_index(), self.sequence)
    }
}

/// Errors raised while assigning queue metadata.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventQueueError {
    /// No unused event sequence remains.
    SequenceExhausted,
    /// A restored/imported queue contains the same sequence more than once.
    DuplicateSequence(EventId),
}

impl fmt::Display for EventQueueError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::SequenceExhausted => formatter.write_str("event sequence is exhausted"),
            Self::DuplicateSequence(sequence) => {
                write!(formatter, "duplicate event sequence {sequence}")
            }
        }
    }
}

impl Error for EventQueueError {}

/// Alias used by integrations that call the structure a queue rather than an
/// event queue.
pub type QueueError = EventQueueError;

/// A stable priority queue for turn events.
///
/// Entries are kept ordered at insertion time.  `VecDeque` gives ordinary
/// queue semantics for `pop_next`, while the insertion point makes phase and
/// turn order explicit even when producers enqueue out of order.  Events from
/// the same turn and phase retain FIFO order through their unique sequence.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct EventQueue<T = TurnEvent> {
    events: VecDeque<QueuedEvent<T>>,
    next_sequence: EventId,
}

#[derive(Debug, Deserialize)]
struct EventQueueWire<T> {
    events: VecDeque<QueuedEvent<T>>,
    #[serde(default)]
    next_sequence: EventId,
}

impl<'de, T> Deserialize<'de> for EventQueue<T>
where
    T: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let wire = EventQueueWire::<T>::deserialize(deserializer)?;
        let mut queue = Self {
            events: wire.events,
            next_sequence: wire.next_sequence,
        };
        queue
            .normalize()
            .map_err(|error| de::Error::custom(error.to_string()))?;
        Ok(queue)
    }
}

impl<T> Default for EventQueue<T> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T> EventQueue<T> {
    /// Create an empty queue whose first event receives sequence zero.
    pub const fn new() -> Self {
        Self {
            events: VecDeque::new(),
            next_sequence: 0,
        }
    }

    /// Create an empty queue with storage reserved for `capacity` entries.
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            events: VecDeque::with_capacity(capacity),
            next_sequence: 0,
        }
    }

    /// Create a queue from `(turn, phase, event)` tuples.
    pub fn from_events<I>(events: I) -> Self
    where
        I: IntoIterator<Item = (u32, TurnPhase, T)>,
    {
        let mut queue = Self::new();
        for (turn, phase, event) in events {
            queue.enqueue(turn, phase, event);
        }
        queue
    }

    pub fn len(&self) -> usize {
        self.events.len()
    }

    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }

    /// Sequence that will be assigned to the next successfully enqueued event.
    pub const fn next_sequence(&self) -> EventId {
        self.next_sequence
    }

    /// Add an event and return its unique queue ID.
    ///
    /// Use [`EventQueue::try_enqueue`] when exhaustion must be handled without
    /// panicking.  Exhaustion is unreachable during a normal game, but the
    /// checked variant keeps import/fuzz boundaries explicit.
    pub fn enqueue(&mut self, turn: u32, phase: TurnPhase, event: T) -> EventId {
        self.try_enqueue(turn, phase, event)
            .expect("event queue sequence exhausted")
    }

    /// Checked form of [`EventQueue::enqueue`].
    pub fn try_enqueue(
        &mut self,
        turn: u32,
        phase: TurnPhase,
        event: T,
    ) -> Result<EventId, EventQueueError> {
        let sequence = self.next_sequence;
        self.next_sequence = sequence
            .checked_add(1)
            .ok_or(EventQueueError::SequenceExhausted)?;
        self.insert_ordered(QueuedEvent::with_sequence(sequence, turn, phase, event));
        Ok(sequence)
    }

    /// Conventional queue spelling for [`EventQueue::enqueue`].
    pub fn push(&mut self, turn: u32, phase: TurnPhase, event: T) -> EventId {
        self.enqueue(turn, phase, event)
    }

    /// Scheduling spelling for [`EventQueue::enqueue`].
    pub fn schedule(&mut self, turn: u32, phase: TurnPhase, event: T) -> EventId {
        self.enqueue(turn, phase, event)
    }

    /// Add a previously materialized entry, preserving its sequence.
    ///
    /// This is primarily for replay/save adapters.  New game code should use
    /// [`EventQueue::enqueue`] so sequence assignment stays centralized.
    pub fn push_entry(&mut self, entry: QueuedEvent<T>) -> Result<EventId, EventQueueError> {
        if self
            .events
            .iter()
            .any(|existing| existing.sequence == entry.sequence)
        {
            return Err(EventQueueError::DuplicateSequence(entry.sequence));
        }

        let next = entry.sequence.checked_add(1).unwrap_or(EventId::MAX);
        self.next_sequence = self.next_sequence.max(next);
        let sequence = entry.sequence;
        self.insert_ordered(entry);
        Ok(sequence)
    }

    pub fn peek_next(&self) -> Option<&QueuedEvent<T>> {
        self.events.front()
    }

    pub fn pop_next(&mut self) -> Option<QueuedEvent<T>> {
        self.events.pop_front()
    }

    /// Iterate in exactly the same order used by [`EventQueue::pop_next`].
    pub fn iter(&self) -> std::collections::vec_deque::Iter<'_, QueuedEvent<T>> {
        self.events.iter()
    }

    /// Remove and return every queued event, already in deterministic order.
    pub fn drain(&mut self) -> Vec<QueuedEvent<T>> {
        self.events.drain(..).collect()
    }

    /// Remove only events belonging to `turn`.
    pub fn drain_turn(&mut self, turn: u32) -> Vec<QueuedEvent<T>> {
        self.drain_matching(|entry| entry.turn == turn)
    }

    /// Remove only events belonging to one `(turn, phase)` bucket.
    pub fn drain_phase(&mut self, turn: u32, phase: TurnPhase) -> Vec<QueuedEvent<T>> {
        self.drain_matching(|entry| entry.turn == turn && entry.phase == phase)
    }

    /// Remove an event by its queue ID.
    pub fn remove(&mut self, id: EventId) -> Option<QueuedEvent<T>> {
        let index = self.events.iter().position(|entry| entry.sequence == id)?;
        self.events.remove(index)
    }

    pub fn contains(&self, id: EventId) -> bool {
        self.events.iter().any(|entry| entry.sequence == id)
    }

    pub fn clear(&mut self) {
        self.events.clear();
    }

    /// Check the ordering invariant without consuming the queue.
    pub fn is_ordered(&self) -> bool {
        self.events
            .iter()
            .zip(self.events.iter().skip(1))
            .all(|(left, right)| left.order_key() < right.order_key())
    }

    fn insert_ordered(&mut self, entry: QueuedEvent<T>) {
        let position = self
            .events
            .iter()
            .position(|existing| existing.order_key() > entry.order_key())
            .unwrap_or(self.events.len());
        self.events.insert(position, entry);
    }

    fn drain_matching<F>(&mut self, mut matches: F) -> Vec<QueuedEvent<T>>
    where
        F: FnMut(&QueuedEvent<T>) -> bool,
    {
        let mut kept = VecDeque::with_capacity(self.events.len());
        let mut selected = Vec::new();
        while let Some(entry) = self.events.pop_front() {
            if matches(&entry) {
                selected.push(entry);
            } else {
                kept.push_back(entry);
            }
        }
        self.events = kept;
        selected
    }

    fn normalize(&mut self) -> Result<(), EventQueueError> {
        self.events
            .make_contiguous()
            .sort_by_key(|entry| entry.order_key());

        let mut seen = BTreeSet::new();
        let mut maximum = None;
        for entry in &self.events {
            if !seen.insert(entry.sequence) {
                return Err(EventQueueError::DuplicateSequence(entry.sequence));
            }
            maximum = Some(maximum.map_or(entry.sequence, |current: EventId| {
                current.max(entry.sequence)
            }));
        }

        if let Some(maximum) = maximum {
            let required_next = maximum.checked_add(1).unwrap_or(EventId::MAX);
            self.next_sequence = self.next_sequence.max(required_next);
        }
        Ok(())
    }
}
