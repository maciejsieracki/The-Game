//! CPU "fake GPU" backend (P4.3 §7.3 point 7: "without a GPU the renderer
//! runs on a dummy backend that counts allocations").
//!
//! [`FakeGpu::alloc`] returns a [`FakeResource`]; its `Drop` is the "free".
//! The counters here are kept **independently** of the registry's own
//! bookkeeping, so tests can cross-check that a release in the registry
//! really reached the resource's destructor. An optional event log records
//! the exact alloc/free order. Note: it cannot prove the registry's
//! "new before old" order of `replace`, because the new resource is
//! allocated by the caller before `replace` runs; that order is checked on
//! the registry side (`peak_live`, slot reuse).

use std::cell::{Cell, RefCell};
use std::fmt;
use std::rc::Rc;

use super::registry::ResourceKind;

/// One allocation event of the fake backend.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FakeEvent {
    /// A resource was allocated.
    Alloc {
        /// Allocation id (unique per backend).
        id: u64,
        /// Kind.
        kind: ResourceKind,
    },
    /// A resource was freed (its `Drop` ran).
    Free {
        /// Allocation id.
        id: u64,
        /// Kind.
        kind: ResourceKind,
    },
}

#[derive(Default)]
struct FakeState {
    next_id: Cell<u64>,
    live: [Cell<u64>; ResourceKind::COUNT],
    live_bytes: Cell<u64>,
    allocations: Cell<u64>,
    frees: Cell<u64>,
    log: RefCell<Option<Vec<FakeEvent>>>,
}

impl FakeState {
    fn record(&self, event: FakeEvent) {
        if let Ok(mut log) = self.log.try_borrow_mut() {
            if let Some(log) = log.as_mut() {
                log.push(event);
            }
        }
    }
}

/// Allocation-counting stand-in for a GPU device.
#[derive(Clone, Default)]
pub struct FakeGpu {
    state: Rc<FakeState>,
}

impl fmt::Debug for FakeGpu {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("FakeGpu")
            .field("live_total", &self.live_total())
            .field("live_bytes", &self.live_bytes())
            .field("allocations", &self.allocations())
            .field("frees", &self.frees())
            .finish()
    }
}

impl FakeGpu {
    /// New backend without an event log.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// New backend that records every alloc/free in order.
    #[must_use]
    pub fn with_event_log() -> Self {
        let gpu = Self::default();
        *gpu.state.log.borrow_mut() = Some(Vec::new());
        gpu
    }

    /// "Allocates" a resource of `kind` with a declared size.
    #[must_use]
    pub fn alloc(&self, kind: ResourceKind, bytes: u64) -> FakeResource {
        let s = &self.state;
        let id = s.next_id.get();
        s.next_id.set(id + 1);
        let live = &s.live[kind.index()];
        live.set(live.get() + 1);
        s.live_bytes.set(s.live_bytes.get() + bytes);
        s.allocations.set(s.allocations.get() + 1);
        s.record(FakeEvent::Alloc { id, kind });
        FakeResource {
            id,
            kind,
            bytes,
            state: Rc::clone(&self.state),
        }
    }

    /// Live allocations of one kind.
    #[must_use]
    pub fn live(&self, kind: ResourceKind) -> u64 {
        self.state.live[kind.index()].get()
    }

    /// Live allocations, all kinds.
    #[must_use]
    pub fn live_total(&self) -> u64 {
        self.state.live.iter().map(Cell::get).sum()
    }

    /// Live bytes, all kinds.
    #[must_use]
    pub fn live_bytes(&self) -> u64 {
        self.state.live_bytes.get()
    }

    /// Allocations ever made.
    #[must_use]
    pub fn allocations(&self) -> u64 {
        self.state.allocations.get()
    }

    /// Frees ever made.
    #[must_use]
    pub fn frees(&self) -> u64 {
        self.state.frees.get()
    }

    /// Takes the recorded events (empty if the log is disabled).
    #[must_use]
    pub fn take_events(&self) -> Vec<FakeEvent> {
        self.state
            .log
            .borrow_mut()
            .as_mut()
            .map(std::mem::take)
            .unwrap_or_default()
    }
}

/// A fake GPU resource; dropping it frees it in its [`FakeGpu`].
pub struct FakeResource {
    id: u64,
    kind: ResourceKind,
    bytes: u64,
    state: Rc<FakeState>,
}

impl FakeResource {
    /// Allocation id.
    #[must_use]
    pub const fn id(&self) -> u64 {
        self.id
    }
    /// Kind.
    #[must_use]
    pub const fn kind(&self) -> ResourceKind {
        self.kind
    }
    /// Declared size.
    #[must_use]
    pub const fn bytes(&self) -> u64 {
        self.bytes
    }
}

impl Drop for FakeResource {
    fn drop(&mut self) {
        let s = &self.state;
        let live = &s.live[self.kind.index()];
        live.set(live.get() - 1);
        s.live_bytes.set(s.live_bytes.get() - self.bytes);
        s.frees.set(s.frees.get() + 1);
        s.record(FakeEvent::Free {
            id: self.id,
            kind: self.kind,
        });
    }
}

impl fmt::Debug for FakeResource {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "FakeResource({} #{} {}B)",
            self.kind.name(),
            self.id,
            self.bytes
        )
    }
}
