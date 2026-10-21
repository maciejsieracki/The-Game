//! Low-level resource registry: the single owner of every GPU resource.
//!
//! Scene objects never own a resource directly. They hold a [`Handle`]: an
//! index into the registry plus a *generation*. When the last reference is
//! released the slot's generation is bumped, so every old copy of the handle
//! becomes **stale** and any later use returns [`AssetError::Stale`] instead
//! of touching a recycled slot (no use-after-free, no panic).
//!
//! The registry is generic over the resource payload `R`. The GPU layer
//! will instantiate it with its `wgpu` resource enum (dropping a `wgpu`
//! object frees it); CPU tests use [`super::fake::FakeResource`], which counts
//! allocations independently of the registry's own bookkeeping.

use std::error::Error;
use std::fmt;
use std::hash::{Hash, Hasher};
use std::marker::PhantomData;
use std::sync::atomic::{AtomicU32, Ordering};

/// Category of a GPU resource tracked by the registry.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum ResourceKind {
    /// Vertex / index / instance / uniform buffer.
    Buffer,
    /// Texture (atlas, badge, shadow map, ...).
    Texture,
    /// Render or compute pipeline.
    Pipeline,
    /// Bind group (material / per-object bindings).
    BindGroup,
}

impl ResourceKind {
    /// Number of resource kinds.
    pub const COUNT: usize = 4;
    /// All kinds, in index order.
    pub const ALL: [Self; Self::COUNT] =
        [Self::Buffer, Self::Texture, Self::Pipeline, Self::BindGroup];

    /// Dense index of this kind (`0..COUNT`), used for per-kind arrays.
    #[must_use]
    pub const fn index(self) -> usize {
        self as usize
    }

    /// Short, stable name used in reports.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
            Self::Buffer => "buffer",
            Self::Texture => "texture",
            Self::Pipeline => "pipeline",
            Self::BindGroup => "bind_group",
        }
    }
}

mod sealed {
    pub trait Sealed {}
}

/// Compile-time resource kind of a typed [`Handle`]. Sealed: implemented
/// only by the marker types in [`kinds`].
pub trait Kind: sealed::Sealed + 'static {
    /// The runtime kind this marker stands for.
    const KIND: ResourceKind;
}

/// Zero-sized marker types for typed handles (`Handle<kinds::Buffer>`, ...).
/// A handle of one kind cannot be passed where another kind is expected.
pub mod kinds {
    use super::{sealed, Kind, ResourceKind};

    /// Marker: buffer.
    #[derive(Debug)]
    pub enum Buffer {}
    /// Marker: texture.
    #[derive(Debug)]
    pub enum Texture {}
    /// Marker: pipeline.
    #[derive(Debug)]
    pub enum Pipeline {}
    /// Marker: bind group.
    #[derive(Debug)]
    pub enum BindGroup {}

    impl sealed::Sealed for Buffer {}
    impl sealed::Sealed for Texture {}
    impl sealed::Sealed for Pipeline {}
    impl sealed::Sealed for BindGroup {}

    impl Kind for Buffer {
        const KIND: ResourceKind = ResourceKind::Buffer;
    }
    impl Kind for Texture {
        const KIND: ResourceKind = ResourceKind::Texture;
    }
    impl Kind for Pipeline {
        const KIND: ResourceKind = ResourceKind::Pipeline;
    }
    impl Kind for BindGroup {
        const KIND: ResourceKind = ResourceKind::BindGroup;
    }
}

/// Untyped handle (kind checked at runtime). Only the registry mints these.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct RawHandle {
    registry: u32,
    kind: ResourceKind,
    index: u32,
    generation: u32,
}

impl RawHandle {
    /// Kind of the referenced resource.
    #[must_use]
    pub const fn kind(self) -> ResourceKind {
        self.kind
    }
    /// Slot index inside the registry.
    #[must_use]
    pub const fn index(self) -> u32 {
        self.index
    }
    /// Generation of the slot when this handle was minted.
    #[must_use]
    pub const fn generation(self) -> u32 {
        self.generation
    }
    /// Id of the registry that minted this handle.
    #[must_use]
    pub const fn registry(self) -> u32 {
        self.registry
    }
}

/// Typed, generational, non-owning handle. `Copy`; holding one does **not**
/// keep the resource alive (ownership is the reference count in the
/// registry, or an [`super::Owned`] guard / [`super::Scope`]).
pub struct Handle<K: Kind> {
    raw: RawHandle,
    _kind: PhantomData<fn() -> K>,
}

impl<K: Kind> Handle<K> {
    pub(crate) const fn from_raw(raw: RawHandle) -> Self {
        Self {
            raw,
            _kind: PhantomData,
        }
    }
    /// Untyped view of this handle.
    #[must_use]
    pub const fn raw(self) -> RawHandle {
        self.raw
    }
}

impl<K: Kind> Clone for Handle<K> {
    fn clone(&self) -> Self {
        *self
    }
}
impl<K: Kind> Copy for Handle<K> {}
impl<K: Kind> PartialEq for Handle<K> {
    fn eq(&self, other: &Self) -> bool {
        self.raw == other.raw
    }
}
impl<K: Kind> Eq for Handle<K> {}
impl<K: Kind> Hash for Handle<K> {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.raw.hash(state);
    }
}
impl<K: Kind> fmt::Debug for Handle<K> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Handle<{}>(#{}@g{} r{})",
            K::KIND.name(),
            self.raw.index,
            self.raw.generation,
            self.raw.registry
        )
    }
}

/// Errors of the asset layer. None of the registry operations panic on a
/// bad handle; they return one of these.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AssetError {
    /// The handle refers to a resource that was already released
    /// (use after free) or to a slot that never existed.
    Stale {
        /// The offending handle.
        handle: RawHandle,
    },
    /// The handle was minted by a different registry.
    ForeignRegistry {
        /// The offending handle.
        handle: RawHandle,
        /// Id of the registry that received it.
        registry: u32,
    },
    /// A shared registry / listener list is already borrowed (re-entrant
    /// call from inside [`super::Assets::with`] or a listener callback).
    Busy,
    /// Reference count would exceed `u32::MAX`.
    RefCountOverflow {
        /// The offending handle.
        handle: RawHandle,
    },
}

impl fmt::Display for AssetError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Stale { handle } => write!(
                f,
                "stale {} handle #{}@g{} (released or never existed)",
                handle.kind.name(),
                handle.index,
                handle.generation
            ),
            Self::ForeignRegistry { handle, registry } => write!(
                f,
                "{} handle from registry {} used with registry {}",
                handle.kind.name(),
                handle.registry,
                registry
            ),
            Self::Busy => f.write_str("asset registry or listener list is busy (re-entrant call)"),
            Self::RefCountOverflow { handle } => write!(
                f,
                "reference count overflow on {} #{}",
                handle.kind.name(),
                handle.index
            ),
        }
    }
}

impl Error for AssetError {}

/// Lifetime counters of one resource kind.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct KindStats {
    /// Resources ever inserted.
    pub created: u64,
    /// Resources freed (reference count reached 0).
    pub destroyed: u64,
    /// Resources alive now (`created - destroyed`).
    pub live: u64,
    /// Sum of declared byte sizes of live resources.
    pub live_bytes: u64,
    /// Highest `live` value ever observed.
    pub peak_live: u64,
}

/// Per-kind counters of a registry.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct RegistryStats {
    /// Counters indexed by [`ResourceKind::index`].
    pub per_kind: [KindStats; ResourceKind::COUNT],
}

impl RegistryStats {
    /// Counters of one kind.
    #[must_use]
    pub const fn kind(&self, kind: ResourceKind) -> KindStats {
        self.per_kind[kind.index()]
    }
    /// Live resources of all kinds.
    #[must_use]
    pub fn total_live(&self) -> u64 {
        self.per_kind.iter().map(|k| k.live).sum()
    }
    /// Live bytes of all kinds.
    #[must_use]
    pub fn total_live_bytes(&self) -> u64 {
        self.per_kind.iter().map(|k| k.live_bytes).sum()
    }
    /// Resources ever created, all kinds.
    #[must_use]
    pub fn total_created(&self) -> u64 {
        self.per_kind.iter().map(|k| k.created).sum()
    }
    /// Resources ever destroyed, all kinds.
    #[must_use]
    pub fn total_destroyed(&self) -> u64 {
        self.per_kind.iter().map(|k| k.destroyed).sum()
    }

    fn on_create(&mut self, kind: ResourceKind, bytes: u64) {
        let k = &mut self.per_kind[kind.index()];
        k.created += 1;
        k.live += 1;
        k.live_bytes += bytes;
        k.peak_live = k.peak_live.max(k.live);
    }

    fn on_destroy(&mut self, kind: ResourceKind, bytes: u64) {
        let k = &mut self.per_kind[kind.index()];
        k.destroyed += 1;
        k.live -= 1;
        k.live_bytes -= bytes;
    }
}

/// Outcome of [`Registry::release`].
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Release {
    /// Other references remain; the resource stays alive.
    StillReferenced {
        /// Remaining reference count.
        refs: u32,
    },
    /// Last reference released; the resource was dropped (freed).
    Freed {
        /// Declared size of the freed resource.
        bytes: u64,
    },
}

/// Read-only view of one live entry (for leak reports).
#[derive(Clone, Copy, Debug)]
pub struct LiveEntry<'a> {
    /// Handle of the entry.
    pub handle: RawHandle,
    /// Label given at insertion.
    pub label: &'a str,
    /// Declared size in bytes.
    pub bytes: u64,
    /// Current reference count.
    pub refs: u32,
}

struct Entry<R> {
    kind: ResourceKind,
    label: String,
    bytes: u64,
    refs: u32,
    resource: R,
}

struct Slot<R> {
    generation: u32,
    entry: Option<Entry<R>>,
}

static NEXT_REGISTRY_ID: AtomicU32 = AtomicU32::new(1);

/// Single owner of all resources of one renderer instance.
///
/// Every resource enters with reference count 1 ([`Registry::insert`]);
/// [`Registry::retain`] adds a reference, [`Registry::release`] removes one,
/// and the resource is dropped exactly when the count reaches 0.
pub struct Registry<R> {
    id: u32,
    slots: Vec<Slot<R>>,
    free: Vec<u32>,
    stats: RegistryStats,
}

impl<R> Default for Registry<R> {
    fn default() -> Self {
        Self::new()
    }
}

impl<R> fmt::Debug for Registry<R> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Registry")
            .field("id", &self.id)
            .field("slots", &self.slots.len())
            .field("free", &self.free.len())
            .field("stats", &self.stats)
            .finish()
    }
}

impl<R> Registry<R> {
    /// Empty registry with a process-unique id.
    #[must_use]
    pub fn new() -> Self {
        Self {
            id: NEXT_REGISTRY_ID.fetch_add(1, Ordering::Relaxed),
            slots: Vec::new(),
            free: Vec::new(),
            stats: RegistryStats::default(),
        }
    }

    /// Process-unique id of this registry (embedded in its handles).
    #[must_use]
    pub const fn id(&self) -> u32 {
        self.id
    }

    /// Takes ownership of `resource` with reference count 1.
    ///
    /// # Panics
    /// Only if more than `u32::MAX` slots would be needed.
    pub fn insert<K: Kind>(
        &mut self,
        label: impl Into<String>,
        bytes: u64,
        resource: R,
    ) -> Handle<K> {
        Handle::from_raw(self.insert_raw(K::KIND, label.into(), bytes, resource))
    }

    fn insert_raw(
        &mut self,
        kind: ResourceKind,
        label: String,
        bytes: u64,
        resource: R,
    ) -> RawHandle {
        let entry = Entry {
            kind,
            label,
            bytes,
            refs: 1,
            resource,
        };
        let index = if let Some(index) = self.free.pop() {
            self.slots[index as usize].entry = Some(entry);
            index
        } else {
            let index = u32::try_from(self.slots.len()).expect("registry slot space exhausted");
            self.slots.push(Slot {
                generation: 0,
                entry: Some(entry),
            });
            index
        };
        self.stats.on_create(kind, bytes);
        RawHandle {
            registry: self.id,
            kind,
            index,
            generation: self.slots[index as usize].generation,
        }
    }

    fn check(&self, raw: RawHandle) -> Result<(), AssetError> {
        if raw.registry != self.id {
            return Err(AssetError::ForeignRegistry {
                handle: raw,
                registry: self.id,
            });
        }
        match self.slots.get(raw.index as usize) {
            Some(slot)
                if slot.generation == raw.generation
                    && slot.entry.as_ref().is_some_and(|e| e.kind == raw.kind) =>
            {
                Ok(())
            }
            _ => Err(AssetError::Stale { handle: raw }),
        }
    }

    fn entry(&self, raw: RawHandle) -> Result<&Entry<R>, AssetError> {
        self.check(raw)?;
        Ok(self.slots[raw.index as usize]
            .entry
            .as_ref()
            .expect("checked above"))
    }

    fn entry_mut(&mut self, raw: RawHandle) -> Result<&mut Entry<R>, AssetError> {
        self.check(raw)?;
        Ok(self.slots[raw.index as usize]
            .entry
            .as_mut()
            .expect("checked above"))
    }

    /// `true` if the handle refers to a live resource of this registry.
    #[must_use]
    pub fn contains<K: Kind>(&self, handle: Handle<K>) -> bool {
        self.check(handle.raw).is_ok()
    }

    /// Shared access to the resource.
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`].
    pub fn get<K: Kind>(&self, handle: Handle<K>) -> Result<&R, AssetError> {
        self.entry(handle.raw).map(|e| &e.resource)
    }

    /// Mutable access to the resource (e.g. to write instance data).
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`].
    pub fn get_mut<K: Kind>(&mut self, handle: Handle<K>) -> Result<&mut R, AssetError> {
        self.entry_mut(handle.raw).map(|e| &mut e.resource)
    }

    /// Current reference count.
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`].
    pub fn ref_count<K: Kind>(&self, handle: Handle<K>) -> Result<u32, AssetError> {
        self.entry(handle.raw).map(|e| e.refs)
    }

    /// Label given at insertion.
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`].
    pub fn label<K: Kind>(&self, handle: Handle<K>) -> Result<&str, AssetError> {
        self.entry(handle.raw).map(|e| e.label.as_str())
    }

    /// Adds one reference (shared ownership). Returns the same handle.
    ///
    /// # Errors
    /// [`AssetError::Stale`], [`AssetError::ForeignRegistry`],
    /// [`AssetError::RefCountOverflow`].
    pub fn retain<K: Kind>(&mut self, handle: Handle<K>) -> Result<Handle<K>, AssetError> {
        self.retain_raw(handle.raw).map(|()| handle)
    }

    pub(crate) fn retain_raw(&mut self, raw: RawHandle) -> Result<(), AssetError> {
        let entry = self.entry_mut(raw)?;
        entry.refs = entry
            .refs
            .checked_add(1)
            .ok_or(AssetError::RefCountOverflow { handle: raw })?;
        Ok(())
    }

    /// Removes one reference; frees (drops) the resource when it was the
    /// last one. Releasing an already freed handle is an error, not a panic
    /// and not a double free.
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`].
    pub fn release<K: Kind>(&mut self, handle: Handle<K>) -> Result<Release, AssetError> {
        self.release_raw(handle.raw)
    }

    pub(crate) fn release_raw(&mut self, raw: RawHandle) -> Result<Release, AssetError> {
        let entry = self.entry_mut(raw)?;
        entry.refs -= 1;
        if entry.refs > 0 {
            return Ok(Release::StillReferenced { refs: entry.refs });
        }
        let slot = &mut self.slots[raw.index as usize];
        let entry = slot.entry.take().expect("checked above");
        slot.generation = slot.generation.wrapping_add(1);
        // A slot whose generation would wrap is retired forever, so an old
        // handle can never alias a new resource.
        if slot.generation != u32::MAX {
            self.free.push(raw.index);
        }
        self.stats.on_destroy(entry.kind, entry.bytes);
        let bytes = entry.bytes;
        drop(entry); // frees the resource (wgpu objects free on Drop)
        Ok(Release::Freed { bytes })
    }

    /// "Swap model" in the M1-safe order: the **new** resource is inserted
    /// first, then **one** reference of `old` is released. Returns the new
    /// handle. If `old` is invalid nothing is inserted and `resource` is
    /// dropped.
    ///
    /// # Errors
    /// [`AssetError::Stale`] / [`AssetError::ForeignRegistry`] for `old`.
    pub fn replace<K: Kind>(
        &mut self,
        old: Handle<K>,
        label: impl Into<String>,
        bytes: u64,
        resource: R,
    ) -> Result<Handle<K>, AssetError> {
        self.check(old.raw)?;
        let new = self.insert::<K>(label, bytes, resource);
        self.release(old)?;
        Ok(new)
    }

    /// Snapshot of the per-kind counters.
    #[must_use]
    pub const fn stats(&self) -> RegistryStats {
        self.stats
    }

    /// Iterates over live entries (leak report).
    pub fn live(&self) -> impl Iterator<Item = LiveEntry<'_>> + '_ {
        self.slots
            .iter()
            .enumerate()
            .filter_map(move |(index, slot)| {
                slot.entry.as_ref().map(|e| LiveEntry {
                    handle: RawHandle {
                        registry: self.id,
                        kind: e.kind,
                        index: index as u32,
                        generation: slot.generation,
                    },
                    label: e.label.as_str(),
                    bytes: e.bytes,
                    refs: e.refs,
                })
            })
    }

    /// Number of slots ever allocated (live + free + retired).
    #[must_use]
    pub fn slot_capacity(&self) -> usize {
        self.slots.len()
    }
}
