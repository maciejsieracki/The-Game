//! `models::cities` — city and settlement models on a map hex (MOD-09 of the
//! P4.4 model catalogue, topic R-RUSTPORT-P4-21-MOD09-CITIES-Q1).
//!
//! CPU port, 1:1 with the web at pin `edb8fb56`:
//! - [`kamien`] = `render/miasto-kamien.ts`: stone-age city of the live map
//!   path (era 1), 10 levels × Biskupin palisade;
//! - [`braz`] = `render/miasto-braz.ts`: bronze-age cities (era ≥ 2), Greece
//!   and Rome × 10 levels × {none, Cyclopean wall / agger, palisade}; every
//!   other civ gets the Greek set (D-MOD-4 = C: new sets are P4.7, not here);
//! - [`ghost_braz`] = `render/bronzeCityRoblox.ts` and [`ghost_kamien`] =
//!   `render/stoneCityRoblox.ts`: the per-civ block settlements used as the
//!   city-founding ghost (11 [`BronzeCiv`](crate::core::bronze::BronzeCiv)
//!   keys × 10 levels × walls);
//! - [`stone_civ`] = `render/stoneCity.ts`, types only (`StoneCiv`,
//!   `STONE_CIVS`, labels); the classic builder `buildStoneAgeCity` is out of
//!   scope (D-MOD-1, like `buildBronzeCity` in P4.12);
//! - [`settlement`] = `render/settlementModel.ts` (`roblox` branch);
//! - [`outline`] = `render/cityMapOutline.ts`;
//! - [`renderer`] = the CPU part of `render/cities.ts` (`CityRenderer`
//!   without the stat chip / revolt sprite, which are MOD-10 / overlays).
//!
//! A model is a [`CityModel`]: the shared unit-core object tree
//! ([`UnitModel`](crate::models::unit_core::UnitModel)) plus one
//! [`Drawable`] per mesh node (CPU geometry description [`CityGeo`] and a
//! material index; materials are data, [`CityMaterial`]). Nothing here needs
//! a GPU. All `Math.sin/cos/atan2/hypot/pow` go through [`crate::jsmath`].

pub mod braz;
pub mod ghost_braz;
pub mod ghost_kamien;
pub mod kamien;
mod kit;
pub mod model;
pub mod outline;
pub mod renderer;
pub mod settlement;
pub mod stone_civ;

pub use braz::{
    build_miasto_braz, build_miasto_braz_grecja, build_miasto_braz_rzym, CywBrazu, MiastoBrazOpts,
};
pub use ghost_braz::build_bronze_city_roblox;
pub use ghost_kamien::{build_stone_age_city_roblox, build_stone_age_city_roblox_universal};
pub use kamien::{
    build_miasto_kamien, build_palisada_wal, build_palisada_wal_model, rozmiar_dla_poziomu,
    MiastoKamienOpts, Poziom,
};
pub use model::{
    js_number_to_string, CityGeo, CityMatId, CityMaterial, CityModel, CityUserData, DrawKind,
    Drawable, Rozmiar,
};
pub use outline::{
    build_city_map_outline, place_city_map_outline, CityMapOutlineKind, OutlineData,
};
pub use renderer::{
    build_legacy_city_model, build_settlement_model_for_style, owner_color, City,
    CityRenderOptions, CityRenderer, CityWallKind, RenderedCity, RenderedOutline, SceneObject,
};
pub use settlement::build_settlement_model;
pub use stone_civ::{stone_civ_label, StoneCiv, STONE_CIVS};
