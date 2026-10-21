//! Listener lists with guaranteed unregistration (fix of M3).
//!
//! In the web build `BattleScene` registers `document`/`window` listeners
//! whose closures capture the scene and never removes them (P4.3 §7.1 M3).
//! Here [`Listeners::subscribe`] returns a [`Subscription`] token; dropping
//! the token removes the callback (and drops the closure with everything it
//! captured). A scene that owns its tokens therefore cannot outlive itself
//! through a listener.
//!
//! Dropping a token from inside a callback (during [`Listeners::emit`]) is
//! allowed: the removal is queued and applied right after the emit.

use std::cell::{Cell, RefCell};
use std::fmt;
use std::rc::{Rc, Weak};

use super::registry::AssetError;

type Callback<E> = Box<dyn FnMut(&E)>;

struct ListenerSlot<E> {
    generation: u32,
    callback: Option<Callback<E>>,
}

struct Table<E> {
    slots: Vec<ListenerSlot<E>>,
    free: Vec<u32>,
}

struct Inner<E> {
    table: RefCell<Table<E>>,
    pending_remove: RefCell<Vec<(u32, u32)>>,
    subscribed: Cell<u64>,
    unsubscribed: Cell<u64>,
}

trait Unsubscribe {
    fn unsubscribe(&self, index: u32, generation: u32);
    fn is_active(&self, index: u32, generation: u32) -> bool;
}

impl<E> Inner<E> {
    fn remove_now(&self, table: &mut Table<E>, index: u32, generation: u32) -> Option<Callback<E>> {
        let slot = table.slots.get_mut(index as usize)?;
        if slot.generation != generation {
            return None;
        }
        let callback = slot.callback.take()?;
        slot.generation = slot.generation.wrapping_add(1);
        if slot.generation != u32::MAX {
            table.free.push(index);
        }
        self.unsubscribed.set(self.unsubscribed.get() + 1);
        Some(callback)
    }

    fn apply_pending(&self) {
        loop {
            let pending = std::mem::take(&mut *self.pending_remove.borrow_mut());
            if pending.is_empty() {
                return;
            }
            let mut dropped = Vec::new();
            if let Ok(mut table) = self.table.try_borrow_mut() {
                for (index, generation) in pending {
                    dropped.extend(self.remove_now(&mut table, index, generation));
                }
            } else {
                self.pending_remove.borrow_mut().extend(pending);
                return;
            }
            // Closures are dropped outside the borrow: they may own other
            // tokens whose drop re-enters this list.
            drop(dropped);
        }
    }
}

impl<E> Unsubscribe for Inner<E> {
    fn unsubscribe(&self, index: u32, generation: u32) {
        let removed = match self.table.try_borrow_mut() {
            Ok(mut table) => self.remove_now(&mut table, index, generation),
            Err(_) => {
                self.pending_remove.borrow_mut().push((index, generation));
                None
            }
        };
        drop(removed);
        self.apply_pending();
    }

    fn is_active(&self, index: u32, generation: u32) -> bool {
        if self.pending_remove.borrow().contains(&(index, generation)) {
            return false;
        }
        self.table.try_borrow().map_or(true, |t| {
            t.slots
                .get(index as usize)
                .is_some_and(|s| s.generation == generation && s.callback.is_some())
        })
    }
}

/// Counters of a [`Listeners`] list.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct ListenerStats {
    /// Subscriptions ever made.
    pub subscribed: u64,
    /// Subscriptions removed.
    pub unsubscribed: u64,
    /// Active now (`subscribed - unsubscribed`).
    pub active: u64,
}

/// A list of callbacks for events of type `E` (one per event source, e.g.
/// "document click", "window resize"). Cloning shares the list.
pub struct Listeners<E: 'static> {
    inner: Rc<Inner<E>>,
}

impl<E: 'static> Clone for Listeners<E> {
    fn clone(&self) -> Self {
        Self {
            inner: Rc::clone(&self.inner),
        }
    }
}

impl<E: 'static> Default for Listeners<E> {
    fn default() -> Self {
        Self::new()
    }
}

impl<E: 'static> fmt::Debug for Listeners<E> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Listeners")
            .field("stats", &self.stats())
            .finish()
    }
}

impl<E: 'static> Listeners<E> {
    /// Empty list.
    #[must_use]
    pub fn new() -> Self {
        Self {
            inner: Rc::new(Inner {
                table: RefCell::new(Table {
                    slots: Vec::new(),
                    free: Vec::new(),
                }),
                pending_remove: RefCell::new(Vec::new()),
                subscribed: Cell::new(0),
                unsubscribed: Cell::new(0),
            }),
        }
    }

    /// Registers `callback`; it stays registered exactly as long as the
    /// returned token lives.
    ///
    /// # Errors
    /// [`AssetError::Busy`] if called from inside [`Listeners::emit`] of
    /// the same list (the callback is then dropped).
    ///
    /// # Panics
    /// Only if more than `u32::MAX` slots would be needed.
    pub fn subscribe(
        &self,
        callback: impl FnMut(&E) + 'static,
    ) -> Result<Subscription, AssetError> {
        let mut table = self
            .inner
            .table
            .try_borrow_mut()
            .map_err(|_| AssetError::Busy)?;
        let callback: Callback<E> = Box::new(callback);
        let index = if let Some(index) = table.free.pop() {
            table.slots[index as usize].callback = Some(callback);
            index
        } else {
            let index = u32::try_from(table.slots.len()).expect("listener slot space exhausted");
            table.slots.push(ListenerSlot {
                generation: 0,
                callback: Some(callback),
            });
            index
        };
        let generation = table.slots[index as usize].generation;
        drop(table);
        self.inner.subscribed.set(self.inner.subscribed.get() + 1);
        let weak: Weak<Inner<E>> = Rc::downgrade(&self.inner);
        let remover: Weak<dyn Unsubscribe> = weak;
        Ok(Subscription {
            remover,
            index,
            generation,
        })
    }

    /// Calls every active callback with `event`. Returns how many were
    /// called.
    ///
    /// # Errors
    /// [`AssetError::Busy`] on a recursive emit of the same list.
    pub fn emit(&self, event: &E) -> Result<usize, AssetError> {
        let mut table = self
            .inner
            .table
            .try_borrow_mut()
            .map_err(|_| AssetError::Busy)?;
        let mut called = 0;
        for slot in &mut table.slots {
            if let Some(callback) = slot.callback.as_mut() {
                callback(event);
                called += 1;
            }
        }
        drop(table);
        self.inner.apply_pending();
        Ok(called)
    }

    /// Counters.
    #[must_use]
    pub fn stats(&self) -> ListenerStats {
        let subscribed = self.inner.subscribed.get();
        let unsubscribed = self.inner.unsubscribed.get();
        ListenerStats {
            subscribed,
            unsubscribed,
            active: subscribed - unsubscribed,
        }
    }

    /// Number of active subscriptions.
    #[must_use]
    pub fn active(&self) -> u64 {
        self.stats().active
    }
}

/// Token of one registered callback. Dropping it unregisters the callback.
/// There is intentionally no `detach`: keeping a listener forever requires
/// keeping (or deliberately leaking) the token.
#[must_use = "dropping the token unregisters the callback immediately"]
pub struct Subscription {
    remover: Weak<dyn Unsubscribe>,
    index: u32,
    generation: u32,
}

impl Subscription {
    /// `true` while the callback is registered (and the list exists).
    #[must_use]
    pub fn is_active(&self) -> bool {
        self.remover
            .upgrade()
            .is_some_and(|inner| inner.is_active(self.index, self.generation))
    }
}

impl Drop for Subscription {
    fn drop(&mut self) {
        if let Some(inner) = self.remover.upgrade() {
            inner.unsubscribe(self.index, self.generation);
        }
    }
}

impl fmt::Debug for Subscription {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Subscription(#{}@g{})", self.index, self.generation)
    }
}
