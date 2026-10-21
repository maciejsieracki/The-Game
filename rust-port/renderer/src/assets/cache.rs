//! Content-keyed cache with an eviction policy (fix of M1 and M2).
//!
//! - **M1** (geometry rebuilt per city on every population change): builders
//!   ask the cache for `(primitive, parameters) → mesh`; equal parameters
//!   share one resource instead of allocating a fresh buffer per rebuild.
//! - **M2** (badge-texture cache that only grows): the cache has a size
//!   policy (LRU by entry count and/or bytes) and [`Cache::end_of_turn`]
//!   drops every entry that nobody but the cache references — "an entry
//!   without a live reference is freed at the end of the turn at the latest"
//!   (P4.3 §7.3 point 4).
//!
//! Eviction only drops the **cache's** reference. A resource still held by a
//! scene stays alive (reference counting) and is freed when the scene lets
//! it go; it is just no longer findable by key.

use std::collections::{BTreeMap, HashMap};
use std::fmt;
use std::hash::Hash;

use super::registry::{AssetError, Kind};
use super::shared::{Assets, Owned};

/// Size limits of a [`Cache`]. `None` = unlimited on that axis.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CachePolicy {
    /// Maximum number of entries (LRU eviction above it). Values below 1
    /// are treated as 1 (the entry just inserted is never evicted).
    pub max_entries: Option<usize>,
    /// Maximum sum of declared bytes (LRU eviction above it).
    pub max_bytes: Option<u64>,
}

impl CachePolicy {
    /// No size limit (rely on [`Cache::end_of_turn`] / explicit removal).
    pub const UNBOUNDED: Self = Self {
        max_entries: None,
        max_bytes: None,
    };

    /// LRU limited by entry count.
    #[must_use]
    pub const fn max_entries(n: usize) -> Self {
        Self {
            max_entries: Some(n),
            max_bytes: None,
        }
    }
}

/// Cache counters.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CacheStats {
    /// Lookups that found an entry.
    pub hits: u64,
    /// Lookups that created an entry.
    pub misses: u64,
    /// Entries evicted by the LRU size policy.
    pub evicted_lru: u64,
    /// Entries dropped by [`Cache::end_of_turn`] (no external reference).
    pub trimmed_unreferenced: u64,
    /// Entries removed explicitly ([`Cache::remove`] / [`Cache::clear`]).
    pub removed: u64,
}

struct CacheEntry<K: Kind, R> {
    owned: Owned<K, R>,
    bytes: u64,
    last_used: u64,
}

/// Content-keyed cache of shared resources of kind `K`.
pub struct Cache<Q, K: Kind, R> {
    assets: Assets<R>,
    policy: CachePolicy,
    entries: HashMap<Q, CacheEntry<K, R>>,
    order: BTreeMap<u64, Q>,
    tick: u64,
    bytes: u64,
    stats: CacheStats,
}

impl<Q, K: Kind, R> fmt::Debug for Cache<Q, K, R> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Cache")
            .field("kind", &K::KIND)
            .field("policy", &self.policy)
            .field("len", &self.entries.len())
            .field("bytes", &self.bytes)
            .field("stats", &self.stats)
            .finish()
    }
}

impl<Q: Eq + Hash + Clone, K: Kind, R> Cache<Q, K, R> {
    /// Empty cache over `assets`.
    #[must_use]
    pub fn new(assets: &Assets<R>, policy: CachePolicy) -> Self {
        Self {
            assets: assets.clone(),
            policy,
            entries: HashMap::new(),
            order: BTreeMap::new(),
            tick: 0,
            bytes: 0,
            stats: CacheStats::default(),
        }
    }

    fn touch(&mut self, key: &Q) {
        if let Some(entry) = self.entries.get_mut(key) {
            self.order.remove(&entry.last_used);
            self.tick += 1;
            entry.last_used = self.tick;
            self.order.insert(self.tick, key.clone());
        }
    }

    /// Looks a key up; on hit returns a new owning reference and marks the
    /// entry as most recently used.
    pub fn get(&mut self, key: &Q) -> Option<Owned<K, R>> {
        if !self.entries.contains_key(key) {
            return None;
        }
        self.touch(key);
        self.stats.hits += 1;
        self.entries.get(key).map(|e| e.owned.clone())
    }

    /// Returns the cached resource for `key`, creating it with `make`
    /// (`(label, bytes, resource)`) on a miss, then applies the size policy.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn get_or_insert_with<F>(&mut self, key: Q, make: F) -> Result<Owned<K, R>, AssetError>
    where
        F: FnOnce() -> (String, u64, R),
    {
        if let Some(found) = self.get(&key) {
            return Ok(found);
        }
        let (label, bytes, resource) = make();
        let owned = self.assets.insert::<K>(label, bytes, resource)?;
        self.stats.misses += 1;
        self.tick += 1;
        let result = owned.clone();
        self.order.insert(self.tick, key.clone());
        self.entries.insert(
            key,
            CacheEntry {
                owned,
                bytes,
                last_used: self.tick,
            },
        );
        self.bytes += bytes;
        self.enforce_limits();
        Ok(result)
    }

    fn over_limits(&self) -> bool {
        let max_entries = self.policy.max_entries.map(|n| n.max(1));
        max_entries.is_some_and(|n| self.entries.len() > n)
            || self.policy.max_bytes.is_some_and(|b| self.bytes > b)
    }

    fn enforce_limits(&mut self) {
        while self.entries.len() > 1 && self.over_limits() {
            let Some((_, key)) = self.order.pop_first() else {
                return;
            };
            if let Some(entry) = self.entries.remove(&key) {
                self.bytes -= entry.bytes;
                self.stats.evicted_lru += 1;
            }
        }
    }

    fn remove_entry(&mut self, key: &Q) -> bool {
        match self.entries.remove(key) {
            Some(entry) => {
                self.order.remove(&entry.last_used);
                self.bytes -= entry.bytes;
                true
            }
            None => false,
        }
    }

    /// End-of-turn trim: drops every entry whose only reference is the
    /// cache itself. Returns how many entries were dropped.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn end_of_turn(&mut self) -> Result<usize, AssetError> {
        let entries = &self.entries;
        let unreferenced: Vec<Q> = self.assets.with(|reg| {
            entries
                .iter()
                .filter(|(_, e)| reg.ref_count(e.owned.handle()) == Ok(1))
                .map(|(k, _)| k.clone())
                .collect()
        })?;
        for key in &unreferenced {
            if self.remove_entry(key) {
                self.stats.trimmed_unreferenced += 1;
            }
        }
        Ok(unreferenced.len())
    }

    /// Removes one entry (drops the cache's reference).
    pub fn remove(&mut self, key: &Q) -> bool {
        let removed = self.remove_entry(key);
        if removed {
            self.stats.removed += 1;
        }
        removed
    }

    /// Removes all entries (e.g. "new game" — fix of M6).
    pub fn clear(&mut self) {
        self.stats.removed += self.entries.len() as u64;
        self.entries.clear();
        self.order.clear();
        self.bytes = 0;
    }

    /// `true` if `key` is cached.
    #[must_use]
    pub fn contains_key(&self, key: &Q) -> bool {
        self.entries.contains_key(key)
    }

    /// Number of entries.
    #[must_use]
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// `true` if empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Sum of declared bytes of cached entries.
    #[must_use]
    pub const fn bytes(&self) -> u64 {
        self.bytes
    }

    /// Counters.
    #[must_use]
    pub const fn stats(&self) -> CacheStats {
        self.stats
    }

    /// Active policy.
    #[must_use]
    pub const fn policy(&self) -> CachePolicy {
        self.policy
    }
}
