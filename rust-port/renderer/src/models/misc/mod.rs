//! `models::misc` — MOD-13 "misc" of the P4.4 model catalogue
//! (`dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` §5, topic
//! R-RUSTPORT-P4-22-MOD13-MISC-Q1). CPU port, 1:1 with the web at pin
//! `edb8fb56`:
//!
//! | web file | module | output |
//! |---|---|---|
//! | `render/wioska-oboz.ts` | [`wioska`] | village + barbarian camp models |
//! | `render/siegeCampModels.ts` | [`siege`] | soldiers, ram, tower, camp group |
//! | `render/siegeMarker.ts` | [`siege`] | [`siege::SiegeMarkerRenderer`] (disc, ring, sprite, camps) |
//! | `render/siegeCampSync.ts` | [`siege`] | machine / owner maps per camp hex |
//! | `render/robloxCity.ts` (`addRobloxSkyDecor` only, D-MOD-2) | [`sky`] | cloud groups |
//! | `render/rangeOverlay.ts` | [`range`] | range / territory overlays as CPU buffers |
//! | `map/territory-border.ts` | [`territory`] | boundary loops (input of the territory band) |
//! | `render/tradeRoutesOverlay.ts` | [`trade`] | trade-route arcs as CPU line buffers |
//!
//! Models are the renderer's one scene-tree type ([`crate::scene::Scene`],
//! P4.27; [`model::MiscModel`] is an alias): Lambert / Basic / Sprite
//! materials, circle / ring geometry, sprites, shadow flags and
//! `renderOrder` are all carried by the scene. Overlays are [`overlay::OverlayGroup`]s: geometry,
//! instance matrices and material parameters as data. Nothing here needs a
//! GPU; `Math.*` goes through [`crate::jsmath`].
//!
//! Verified against vectors produced by running the web code
//! (`tests/misc_web_parity.rs`, `tests/fixtures/misc/`).

pub mod model;
pub mod overlay;
pub mod range;
pub mod siege;
pub mod sky;
pub mod territory;
pub mod trade;
pub mod wioska;

pub use model::{MatKind, MiscGeo, MiscMaterial, MiscModel, MiscSignature, NodeKind, Side};
pub use overlay::{HexKey, HexKeySet, OverlayGroup, OverlayKind, OverlayMap, OverlayObject};
pub use range::{
    build_range_overlay_group, build_range_overlay_group_game, build_territory_border_group,
    FlatRelief, GameRelief, RangeOverlayStyle, ReliefSource, TerritoryBorderParams,
};
pub use siege::{
    build_siege_camp_group, SiegeCampBuildOpts, SiegeMachineKind, SiegeMarkerRenderer,
};
pub use sky::add_roblox_sky_decor;
pub use trade::{build_trade_routes_overlay_group, TradeMedium, TradeRouteOverlayInput};
pub use wioska::{build_oboz_barbarzyncow, build_wioska, BARB_FACTION_COLOR};
