//! RAII layer over [`Registry`]: a shared registry ([`Assets`]), an owning
//! reference-counted guard ([`Owned`]) and a scope that frees everything it
//! created when dropped ([`Scope`]).
//!
//! Release can never be "forgotten" on a code path: it happens in `Drop`.
//! The only ways to keep a resource alive are to keep a guard alive or to
//! deliberately leak the guard (`std::mem::forget`) — which the N-turn test
//! detects as growth.
//!
//! Re-entrancy: dropping or cloning an [`Owned`] while the registry is
//! borrowed (inside [`Assets::with`]) does not panic. The operation is queued
//! and applied, in order, at the next registry access.

use std::cell::RefCell;
use std::fmt;
use std::rc::Rc;

use super::registry::{AssetError, Handle, Kind, RawHandle, Registry, RegistryStats};

enum Deferred {
    Retain(RawHandle),
    Release(RawHandle),
}

struct Shared<R> {
    registry: RefCell<Registry<R>>,
    deferred: RefCell<Vec<Deferred>>,
}

/// Cheaply clonable shared handle to one [`Registry`] (single-threaded:
/// the render thread owns it).
pub struct Assets<R> {
    shared: Rc<Shared<R>>,
}

impl<R> Clone for Assets<R> {
    fn clone(&self) -> Self {
        Self {
            shared: Rc::clone(&self.shared),
        }
    }
}

impl<R> Default for Assets<R> {
    fn default() -> Self {
        Self::new()
    }
}

impl<R> fmt::Debug for Assets<R> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.shared.registry.try_borrow() {
            Ok(reg) => f.debug_tuple("Assets").field(&*reg).finish(),
            Err(_) => f.write_str("Assets(<busy>)"),
        }
    }
}

impl<R> Assets<R> {
    /// New, empty shared registry.
    #[must_use]
    pub fn new() -> Self {
        Self {
            shared: Rc::new(Shared {
                registry: RefCell::new(Registry::new()),
                deferred: RefCell::new(Vec::new()),
            }),
        }
    }

    /// `true` if both values share the same registry.
    #[must_use]
    pub fn ptr_eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.shared, &other.shared)
    }

    /// Runs `f` with exclusive access to the registry. Queued (deferred)
    /// retains/releases are applied before and after `f`.
    ///
    /// # Errors
    /// [`AssetError::Busy`] if called re-entrantly from inside another
    /// `with` (the closure is then not run).
    pub fn with<T>(&self, f: impl FnOnce(&mut Registry<R>) -> T) -> Result<T, AssetError> {
        let mut reg = self
            .shared
            .registry
            .try_borrow_mut()
            .map_err(|_| AssetError::Busy)?;
        self.apply_deferred(&mut reg);
        let out = f(&mut reg);
        self.apply_deferred(&mut reg);
        Ok(out)
    }

    fn apply_deferred(&self, reg: &mut Registry<R>) {
        loop {
            let ops = std::mem::take(&mut *self.shared.deferred.borrow_mut());
            if ops.is_empty() {
                return;
            }
            for op in ops {
                // Deferred ops come from live guards, so they are valid; an
                // error here would be an internal bookkeeping bug.
                let res = match op {
                    Deferred::Retain(raw) => reg.retain_raw(raw),
                    Deferred::Release(raw) => reg.release_raw(raw).map(|_| ()),
                };
                debug_assert!(res.is_ok(), "deferred asset op failed: {res:?}");
            }
        }
    }

    /// Inserts a resource and returns its owning guard.
    ///
    /// # Errors
    /// [`AssetError::Busy`] (the resource is then dropped).
    pub fn insert<K: Kind>(
        &self,
        label: impl Into<String>,
        bytes: u64,
        resource: R,
    ) -> Result<Owned<K, R>, AssetError> {
        let label = label.into();
        let handle = self.with(|reg| reg.insert::<K>(label, bytes, resource))?;
        Ok(Owned {
            assets: self.clone(),
            handle,
            armed: true,
        })
    }

    /// Counters of the registry (after applying deferred operations).
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn stats(&self) -> Result<RegistryStats, AssetError> {
        self.with(|reg| reg.stats())
    }

    /// Applies queued deferred operations now.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn flush(&self) -> Result<(), AssetError> {
        self.with(|_| ())
    }

    fn retain_raw(&self, raw: RawHandle) {
        if let Ok(mut reg) = self.shared.registry.try_borrow_mut() {
            self.apply_deferred(&mut reg);
            reg.retain_raw(raw)
                .expect("Owned guard keeps its handle alive; only u32 refcount overflow can fail");
        } else {
            self.shared
                .deferred
                .borrow_mut()
                .push(Deferred::Retain(raw));
        }
    }

    fn release_raw(&self, raw: RawHandle) {
        if let Ok(mut reg) = self.shared.registry.try_borrow_mut() {
            self.apply_deferred(&mut reg);
            let res = reg.release_raw(raw);
            debug_assert!(res.is_ok(), "guard release failed: {res:?}");
            self.apply_deferred(&mut reg);
        } else {
            self.shared
                .deferred
                .borrow_mut()
                .push(Deferred::Release(raw));
        }
    }
}

/// Owning, reference-counted guard of one resource. `Clone` = one more
/// reference; `Drop` = release one reference (the resource is freed with the
/// last one).
///
/// # Panics
/// `clone` panics only if the reference count would exceed `u32::MAX`
/// (same policy as `Rc`).
pub struct Owned<K: Kind, R> {
    assets: Assets<R>,
    handle: Handle<K>,
    armed: bool,
}

impl<K: Kind, R> Owned<K, R> {
    /// Non-owning copy of the handle (valid while any owner lives).
    #[must_use]
    pub const fn handle(&self) -> Handle<K> {
        self.handle
    }

    /// The registry this guard belongs to.
    #[must_use]
    pub const fn assets(&self) -> &Assets<R> {
        &self.assets
    }

    /// Current reference count of the resource.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn ref_count(&self) -> Result<u32, AssetError> {
        self.assets
            .with(|reg| reg.ref_count(self.handle))
            .and_then(|r| r)
    }

    /// Runs `f` on the resource.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn with_resource<T>(&self, f: impl FnOnce(&R) -> T) -> Result<T, AssetError> {
        self.assets
            .with(|reg| reg.get(self.handle).map(f))
            .and_then(|r| r)
    }

    /// "Swap model" (fix of M1): inserts the **new** resource first, then
    /// releases this guard's reference to the **old** one, and points the
    /// guard at the new resource.
    ///
    /// # Errors
    /// [`AssetError::Busy`] (nothing changes; `resource` is dropped).
    pub fn replace(
        &mut self,
        label: impl Into<String>,
        bytes: u64,
        resource: R,
    ) -> Result<(), AssetError> {
        let new = self.assets.insert::<K>(label, bytes, resource)?;
        let old = std::mem::replace(self, new);
        drop(old);
        Ok(())
    }

    /// Gives up the guard **without** releasing: the reference is moved to
    /// the caller (used by [`Scope::adopt`]).
    pub(crate) fn into_raw(mut self) -> RawHandle {
        self.armed = false;
        self.handle.raw()
    }
}

impl<K: Kind, R> Clone for Owned<K, R> {
    fn clone(&self) -> Self {
        self.assets.retain_raw(self.handle.raw());
        Self {
            assets: self.assets.clone(),
            handle: self.handle,
            armed: true,
        }
    }
}

impl<K: Kind, R> Drop for Owned<K, R> {
    fn drop(&mut self) {
        if self.armed {
            self.assets.release_raw(self.handle.raw());
        }
    }
}

impl<K: Kind, R> fmt::Debug for Owned<K, R> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_tuple("Owned").field(&self.handle).finish()
    }
}

/// RAII scope (e.g. a battle scene, a city model, a whole game session):
/// holds one reference to every resource created or adopted through it and
/// releases all of them, newest first, when dropped.
pub struct Scope<R> {
    assets: Assets<R>,
    label: String,
    held: Vec<RawHandle>,
}

impl<R> Scope<R> {
    /// New empty scope over `assets`.
    #[must_use]
    pub fn new(assets: &Assets<R>, label: impl Into<String>) -> Self {
        Self {
            assets: assets.clone(),
            label: label.into(),
            held: Vec::new(),
        }
    }

    /// Creates a resource owned by this scope.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn insert<K: Kind>(
        &mut self,
        label: impl Into<String>,
        bytes: u64,
        resource: R,
    ) -> Result<Handle<K>, AssetError> {
        let owned = self.assets.insert::<K>(label, bytes, resource)?;
        self.adopt(owned)
    }

    /// Moves an owning guard into the scope (the scope now holds that
    /// reference).
    ///
    /// # Errors
    /// [`AssetError::ForeignRegistry`] if the guard belongs to another
    /// registry (the guard is then dropped normally).
    pub fn adopt<K: Kind>(&mut self, owned: Owned<K, R>) -> Result<Handle<K>, AssetError> {
        if !owned.assets.ptr_eq(&self.assets) {
            let handle = owned.handle.raw();
            let registry = self.assets.with(|reg| reg.id()).unwrap_or(0);
            return Err(AssetError::ForeignRegistry { handle, registry });
        }
        let handle = owned.handle;
        self.held.push(owned.into_raw());
        Ok(handle)
    }

    /// Takes one more reference to a shared resource (e.g. cached geometry)
    /// for the lifetime of the scope.
    ///
    /// # Errors
    /// [`AssetError::ForeignRegistry`].
    pub fn share<K: Kind>(&mut self, owned: &Owned<K, R>) -> Result<Handle<K>, AssetError> {
        self.adopt(owned.clone())
    }

    /// Number of references held.
    #[must_use]
    pub fn len(&self) -> usize {
        self.held.len()
    }

    /// `true` if the scope holds nothing.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.held.is_empty()
    }

    /// Label of the scope.
    #[must_use]
    pub fn label(&self) -> &str {
        &self.label
    }
}

impl<R> Drop for Scope<R> {
    fn drop(&mut self) {
        while let Some(raw) = self.held.pop() {
            self.assets.release_raw(raw);
        }
    }
}

impl<R> fmt::Debug for Scope<R> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Scope")
            .field("label", &self.label)
            .field("held", &self.held.len())
            .finish()
    }
}
