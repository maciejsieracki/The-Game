//! R5 of `P4-1G-ADAPTER-ROZPOZNANIE.md` §4 (topic
//! `R-RUSTPORT-P4-1-R5-CITY-CHIPS`): the integrators that keep per-city
//! renderer state in step with the city list, the part of the web
//! `CityRenderer` (`gra/src/render/cities.ts` @ `07d2fbd72`) that the model
//! builders of [`crate::models::cities`] and the badge painter of
//! [`crate::cities::overlay::stat_chip`] do not cover.
//!
//! - [`stat_chips`]: the city badges ("stat chips") on the world map —
//!   `CityRenderer.syncStatChips` (`cities.ts:644-660`), the badge part of
//!   `CityRenderer.sync` (`:542-547`, `:552`, `:587-592`, `:600`, `:610`),
//!   `setBadgeZoomLod` (`:676-682`), `pruneUnusedStatChipTextures`
//!   (`:625-636`) and `dispose` (`:778-780`).
//!
//! Decision D-DTO-1 = A: the badge content (`cities[].badge`, all 17 fields
//! of `_buildBadgeInput`) is computed by the producer in the engine; the
//! integrator only reads it, adds the two renderer/UI fields
//! (`hoverExpanded`, `lodLevel`) through [`crate::view::city_badge_input`]
//! and builds keys and sprites. No game rule here.

pub mod stat_chips;

pub use stat_chips::{
    stat_chip_city_visible, BadgeTextureEntry, CityStatChips, StatChip, StatChipSyncError,
    StatChipUiState,
};
