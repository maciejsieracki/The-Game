//! `raster::atlas` — texture layer for the textures painted by
//! [`Canvas2dLite`](crate::raster::Canvas2dLite) (RR-T8d,
//! `R-RUSTPORT-P4-31-ATLAS-CACHE-Q1`; plan `P4-25-TEXT-RASTER-AUDIT.md` §6,
//! row RR-T8d; report `dyspozycje/rust-port/p4/P4-31-ATLAS-CACHE.md`).
//!
//! - [`keys`]: content keys — ports of `cityMapBadgeKey` and the related
//!   key functions of the web (T10, T11, T12, T14 and the image keys of the
//!   badge), bit-exact against vectors from the running web code;
//! - [`scale`]: DPI × LOD texture density with the 2048 px ceiling (T14);
//! - [`cache`]: [`TextureCache`] / [`BadgeTextures`] — content-keyed cache
//!   on the RR-T6 registry ([`crate::assets`]) with reference counting,
//!   the port of the web M2 fix (`pruneUnusedStatChipTextures`), the LOD
//!   purge, end-of-turn trim and LRU (P4-3 §7.3 point 4);
//! - [`mip`]: CPU mip chains matching the measured WebGL2
//!   `generateMipmap` (T7, T9, T11 and the default-filter producers);
//! - [`upload`]: straight/premultiplied alpha, per-producer texture
//!   settings of Three r169, blend factors;
//! - `gpu` (feature `gpu`): `wgpu` texture creation and level upload.
//!
//! No new dependency; `#![forbid(unsafe_code)]` of the crate applies.

pub mod cache;
pub mod keys;
pub mod mip;
pub mod scale;
pub mod upload;

#[cfg(feature = "gpu")]
pub mod gpu;

pub use cache::{BadgeTextures, TextureCache, TextureCacheStats, TextureRef};
pub use keys::{city_map_badge_key, CityMapBadgeInput, OwnerEmblemContext};
pub use mip::{MipChain, MipSpace};
pub use scale::{badge_canvas_px, CanvasPx, MAX_TEXTURE_SIZE};
pub use upload::{prepare, AlphaMode, MinFilter, Producer, TexFormat, TextureData, UploadOptions};
