//! `models::wonders` — world-wonder models on a map hex (MOD-12 of the P4.4
//! model catalogue, topic R-RUSTPORT-P4-14-MOD12-WONDERS-Q1).
//!
//! CPU port, 1:1 with the web at pin `edb8fb56`:
//! - [`build_wonder_model`] = `buildWonderModel` (`gra/src/render/wonderModels.ts:427-486`):
//!   19 wonder silhouettes selected by id + the `default` fallback
//!   (cylinder + cone), the `ruin` colour variant (`grey`, `:17-26`) and the
//!   owner banner (`ownerBanner`, `:420-424`);
//! - [`WonderRenderer`] = `WonderRenderer` (`gra/src/render/wonderRenderer.ts`):
//!   model choice per placed wonder, placement on the hex (terrain top +
//!   `WONDER_LIFT`), uniform scale `WONDER_SCALE`, model reuse keyed by
//!   `visualKey`, fog visibility.
//!
//! A model is a [`crate::scene::Scene`] (the renderer's one scene-tree type
//! since P4.27; [`WonderModel`] is an alias): groups and meshes whose meshes
//! carry a [`Primitive`] (= [`crate::scene::Prim`], CPU geometry from
//! [`crate::geom`]) and a slot into the model's materials (material
//! parameters as data, no GPU upload). Nothing here needs a GPU.
//!
//! Registry ([`WonderShape`]): adding a wonder means one enum variant, one
//! arm in [`WonderShape::from_id`] and one builder arm. The 5 "parked" wonders
//! of epoch 4+ (`wonders.json` → `parkowane_epoka4plus`) have no model in the
//! web and resolve to [`WonderShape::Default`], exactly like the web `switch`
//! (D-MOD-5; new models are topic P4.7/NM, not this one).

mod builders;
mod js_trig;
mod model;
mod renderer;

pub use builders::{build_wonder_model, WonderModelOptions, WonderShape, WONDER_MODEL_IDS};
pub use js_trig::{js_cos, js_sin};
pub use model::{
    banner_material, user_data_material_count, LambertMaterial, MaterialSlot, Node, NodeKind,
    Primitive, WonderModel, WorldMesh, WONDER_MATERIAL_COLORS,
};
pub use renderer::{
    default_owner_color, PlacedWonder, RenderedWonder, WonderRenderOptions, WonderRenderer,
    OWNER_COLORS, WONDER_LIFT, WONDER_SCALE,
};
