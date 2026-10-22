//! Texture cache policy (P4-3 §7.3 point 4, class M2) on top of the RR-T6
//! registry ([`crate::assets`] — reused, not duplicated).
//!
//! Web reference:
//! - pin `edb8fb56`: `CityRenderer.statTexCache` (`cities.ts:415`) only
//!   grows; textures leave it only on a LOD change
//!   (`disposeCityMapBadgeTexturesForOtherLod`, `cityMapStatChip.ts:1034-1047`,
//!   called from `syncStatChips`, `cities.ts:573-576`) or at `dispose()`
//!   (`cities.ts:697`) — finding M2 (P4-3 §7.1);
//! - the later web fix `5d9534e0` (`R-WEB-MEMORY-LEAKS-RELEASE-ROBOCZA-Q1`,
//!   `cities.ts:593`, `:608-619`): `pruneUnusedStatChipTextures()` after
//!   every `syncCities` frees every cached texture whose key is not the key
//!   of a live sprite (`statSpriteKeys`).
//!
//! Rust mechanism ([`TextureCache`]): content key → [`Owned`] texture in an
//! [`assets::Cache`](crate::assets::Cache). Three independent bounds:
//! 1. **reference counting**: a scene object holds an [`Owned`] clone; the
//!    GPU resource is dropped when the last holder lets go (also after an
//!    eviction from the cache);
//! 2. **[`TextureCache::prune_unused`]** — the port of
//!    `pruneUnusedStatChipTextures` (keys not live → out), plus
//!    **[`TextureCache::purge_other_lod`]** — the port of
//!    `disposeCityMapBadgeTexturesForOtherLod`, and
//!    **[`TextureCache::end_of_turn`]** (RR-T6: entries referenced only by
//!    the cache → out, "at the end of the turn at the latest");
//! 3. **LRU size policy** ([`CachePolicy`]: entry count and/or bytes).
//!
//! [`BadgeTextures`] mirrors the per-city sprite bookkeeping of
//! `CityRenderer._syncStatChip` (`cities.ts:850-878`: same key → reuse,
//! other key → replace) with the prune at the end of a sync pass.

use std::collections::{BTreeMap, BTreeSet};

use crate::assets::{kinds, AssetError, Assets, Cache, CachePolicy, CacheStats, Owned};

use super::keys::city_badge_lod_suffix;

/// An owning reference to a cached texture of payload `R`.
pub type TextureRef<R> = Owned<kinds::Texture, R>;

/// Counters of the policies on top of [`CacheStats`].
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct TextureCacheStats {
    /// Entries removed by [`TextureCache::prune_unused`].
    pub pruned_unused: u64,
    /// Entries removed by [`TextureCache::purge_other_lod`].
    pub purged_other_lod: u64,
}

/// Content-keyed texture cache (keys are the web key strings of
/// [`super::keys`]).
pub struct TextureCache<R> {
    inner: Cache<String, kinds::Texture, R>,
    keys: BTreeSet<String>,
    seen_evictions: u64,
    stats: TextureCacheStats,
}

impl<R> std::fmt::Debug for TextureCache<R> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TextureCache")
            .field("inner", &self.inner)
            .field("stats", &self.stats)
            .finish_non_exhaustive()
    }
}

impl<R> TextureCache<R> {
    /// Empty cache over `assets` with a size `policy`.
    #[must_use]
    pub fn new(assets: &Assets<R>, policy: CachePolicy) -> Self {
        Self {
            inner: Cache::new(assets, policy),
            keys: BTreeSet::new(),
            seen_evictions: 0,
            stats: TextureCacheStats::default(),
        }
    }

    /// Re-syncs the key index after LRU evictions inside the inner cache.
    fn sync_keys(&mut self) {
        let evicted = self.inner.stats().evicted_lru;
        if evicted != self.seen_evictions {
            self.seen_evictions = evicted;
            let inner = &self.inner;
            self.keys.retain(|k| inner.contains_key(k));
        }
    }

    /// The texture for `key`, created with `make` (`(label, bytes,
    /// resource)`) on a miss. The caller keeps the returned reference for
    /// as long as a scene object shows the texture.
    ///
    /// # Errors
    /// [`AssetError::Busy`] (registry borrowed re-entrantly).
    pub fn acquire<F>(&mut self, key: &str, make: F) -> Result<TextureRef<R>, AssetError>
    where
        F: FnOnce() -> (String, u64, R),
    {
        let owned = self.inner.get_or_insert_with(key.to_owned(), make)?;
        self.keys.insert(key.to_owned());
        self.sync_keys();
        Ok(owned)
    }

    /// Port of `pruneUnusedStatChipTextures()` (`5d9534e0` `cities.ts:608-619`):
    /// removes every entry whose key is not in `live`. Returns the number
    /// removed (the web's `freed`). Holders of an [`Owned`] keep their
    /// texture alive until they drop it.
    pub fn prune_unused<'a, I>(&mut self, live: I) -> usize
    where
        I: IntoIterator<Item = &'a str>,
    {
        self.sync_keys();
        let live: BTreeSet<&str> = live.into_iter().collect();
        let dead: Vec<String> = self
            .keys
            .iter()
            .filter(|k| !live.contains(k.as_str()))
            .cloned()
            .collect();
        let mut freed = 0;
        for k in &dead {
            if self.inner.remove(k) {
                freed += 1;
            }
            self.keys.remove(k);
        }
        self.stats.pruned_unused += freed as u64;
        freed
    }

    /// Port of `disposeCityMapBadgeTexturesForOtherLod(cache, lodLevel)`
    /// (`cityMapStatChip.ts:1034-1047`): removes every entry whose key does
    /// not END with `|l<segment(lodLevel)>`. Returns the number removed.
    pub fn purge_other_lod(&mut self, lod_level: Option<f64>) -> usize {
        self.sync_keys();
        let keep = city_badge_lod_suffix(lod_level);
        let dead: Vec<String> = self
            .keys
            .iter()
            .filter(|k| !k.ends_with(&keep))
            .cloned()
            .collect();
        let mut freed = 0;
        for k in &dead {
            if self.inner.remove(k) {
                freed += 1;
            }
            self.keys.remove(k);
        }
        self.stats.purged_other_lod += freed as u64;
        freed
    }

    /// End-of-turn trim (RR-T6 [`Cache::end_of_turn`]): drops every entry
    /// nobody but the cache references.
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn end_of_turn(&mut self) -> Result<usize, AssetError> {
        let n = self.inner.end_of_turn()?;
        let inner = &self.inner;
        self.keys.retain(|k| inner.contains_key(k));
        Ok(n)
    }

    /// Removes everything ("new game"; `disposeCityStatChipTextures`,
    /// `cityMapStatChip.ts:1130-1133`).
    pub fn clear(&mut self) {
        self.inner.clear();
        self.keys.clear();
    }

    /// `true` if `key` is cached.
    #[must_use]
    pub fn contains_key(&self, key: &str) -> bool {
        self.inner.contains_key(&key.to_owned())
    }

    /// Number of cached entries.
    #[must_use]
    pub fn len(&self) -> usize {
        self.inner.len()
    }

    /// `true` if empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }

    /// Sum of the declared bytes of cached entries.
    #[must_use]
    pub fn bytes(&self) -> u64 {
        self.inner.bytes()
    }

    /// Cached keys in sorted order.
    pub fn keys(&self) -> impl Iterator<Item = &str> + '_ {
        let inner = &self.inner;
        self.keys
            .iter()
            .filter(move |k| inner.contains_key(*k))
            .map(String::as_str)
    }

    /// Counters of the inner cache (hits, misses, LRU, end-of-turn, removed).
    #[must_use]
    pub fn cache_stats(&self) -> CacheStats {
        self.inner.stats()
    }

    /// Counters of the prune / LOD-purge policies.
    #[must_use]
    pub const fn stats(&self) -> TextureCacheStats {
        self.stats
    }
}

/// One live badge: the key it was painted for and the texture it shows.
struct Slot<R> {
    key: String,
    texture: TextureRef<R>,
}

/// Per-object texture slots over a [`TextureCache`] — the bookkeeping of
/// `CityRenderer` (`statSprites` / `statSpriteKeys`, `cities.ts:850-878`)
/// with the M2 fix built in:
/// - [`BadgeTextures::sync`]: same key as before → the same texture (no
///   repaint, `cities.ts:865-869`); other key → the new texture (cached or
///   painted) replaces the old reference;
/// - [`BadgeTextures::remove`]: the object is gone or hidden
///   (`_removeStatChip`, `cities.ts:752-763`);
/// - [`BadgeTextures::finish_sync`]: after a full pass — LOD purge when the
///   level changed (`cities.ts:573-576`) and the prune of keys without a
///   live slot (`5d9534e0` `cities.ts:593`).
pub struct BadgeTextures<R> {
    cache: TextureCache<R>,
    slots: BTreeMap<String, Slot<R>>,
    lod_level: Option<f64>,
    lod_purge_pending: bool,
}

impl<R> std::fmt::Debug for BadgeTextures<R> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("BadgeTextures")
            .field("cache", &self.cache)
            .field("slots", &self.slots.len())
            .field("lod_level", &self.lod_level)
            .finish()
    }
}

impl<R> BadgeTextures<R> {
    /// Empty set of slots over a new cache.
    #[must_use]
    pub fn new(assets: &Assets<R>, policy: CachePolicy) -> Self {
        Self {
            cache: TextureCache::new(assets, policy),
            slots: BTreeMap::new(),
            lod_level: None,
            lod_purge_pending: false,
        }
    }

    /// `setBadgeZoomLod` (`cities.ts:582-588`): records the level; returns
    /// `true` when it changed (the caller then re-syncs every badge with the
    /// new `lodLevel` in its key).
    #[allow(clippy::float_cmp)] // level identity, like `level === this.badgeLodLevel`
    pub fn set_lod_level(&mut self, lod_level: Option<f64>) -> bool {
        let same = match (self.lod_level, lod_level) {
            (None, None) => true,
            (Some(a), Some(b)) => a == b,
            _ => false,
        };
        if same {
            return false;
        }
        self.lod_level = lod_level;
        self.lod_purge_pending = true;
        true
    }

    /// Shows the texture for `key` on object `id`; `make` paints it on a
    /// cache miss. Returns `true` when the slot changed (new key).
    ///
    /// # Errors
    /// [`AssetError::Busy`].
    pub fn sync<F>(&mut self, id: &str, key: &str, make: F) -> Result<bool, AssetError>
    where
        F: FnOnce() -> (String, u64, R),
    {
        if self.slots.get(id).is_some_and(|s| s.key == key) {
            return Ok(false);
        }
        let texture = self.cache.acquire(key, make)?;
        self.slots.insert(
            id.to_owned(),
            Slot {
                key: key.to_owned(),
                texture,
            },
        );
        Ok(true)
    }

    /// Drops the slot of `id` (its texture reference). Returns `true` if
    /// there was one.
    pub fn remove(&mut self, id: &str) -> bool {
        self.slots.remove(id).is_some()
    }

    /// The texture currently shown on `id`.
    #[must_use]
    pub fn texture(&self, id: &str) -> Option<&TextureRef<R>> {
        self.slots.get(id).map(|s| &s.texture)
    }

    /// The key currently shown on `id`.
    #[must_use]
    pub fn key(&self, id: &str) -> Option<&str> {
        self.slots.get(id).map(|s| s.key.as_str())
    }

    /// End of a sync pass: LOD purge (only after a level change) and prune
    /// of every cached key without a live slot. Returns `(purged, pruned)`.
    pub fn finish_sync(&mut self) -> (usize, usize) {
        let purged = if self.lod_purge_pending {
            self.lod_purge_pending = false;
            self.cache.purge_other_lod(self.lod_level)
        } else {
            0
        };
        let live: Vec<&str> = self.slots.values().map(|s| s.key.as_str()).collect();
        let pruned = self.cache.prune_unused(live);
        (purged, pruned)
    }

    /// Number of live slots.
    #[must_use]
    pub fn slot_count(&self) -> usize {
        self.slots.len()
    }

    /// Number of distinct keys shown by the live slots.
    #[must_use]
    pub fn live_key_count(&self) -> usize {
        self.slots
            .values()
            .map(|s| s.key.as_str())
            .collect::<BTreeSet<_>>()
            .len()
    }

    /// The underlying cache.
    #[must_use]
    pub const fn cache(&self) -> &TextureCache<R> {
        &self.cache
    }

    /// The underlying cache (mutable: `end_of_turn`, `clear`).
    pub fn cache_mut(&mut self) -> &mut TextureCache<R> {
        &mut self.cache
    }

    /// Drops every slot and every cached texture ("new game").
    pub fn clear(&mut self) {
        self.slots.clear();
        self.cache.clear();
    }
}
