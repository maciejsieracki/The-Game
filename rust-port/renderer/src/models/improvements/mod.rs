//! `models::improvements` — MOD-11 of the P4.4 model catalogue
//! (`R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1`): terrain improvements and map
//! resources, rebuilt 1:1 from the web builders at `edb8fb56`, roblox map
//! style only (D-RR-8 = A):
//!
//! - [`registry`] — `render/improvements.ts` (`ImprovementKey`,
//!   `IMPROVEMENTS`, `buildImprovement`, `buildImprovementSectored`,
//!   `buildImprovementStack`);
//! - [`roblox`] — `render/robloxImprovements.ts` (24 `BUILDERS`,
//!   `buildRobloxFoodStack`) and `buildStyleTarasyTerrace('roblox')` of
//!   `render/mapRenderStyle.ts`;
//! - [`roblox_legacy`] — the 15 uncalled `rbx*` builders and `addCyl` of
//!   `render/robloxImprovements.ts` (D-MOD-3 = B: port every existing model,
//!   also unused ones);
//! - [`p2`], [`p3a`], [`p3b`] — `render/ulepszenia-modele-p2/p3a/p3b.ts`;
//! - [`kopalnie`] — `render/kopalnia-cyny-opus5.ts`,
//!   `render/kopalnia-zlota-opus5.ts`;
//! - [`droga`] — `render/droga-6-ramion.ts` + `map/road-network.ts`;
//! - [`zwierzeta`] — `render/pastwisko-modele.ts`, `render/swinia-trzoda.ts`;
//! - [`zasoby`] — `render/styleResources.ts` (`buildStyledResourceOverlay`,
//!   livestock figures);
//! - [`model`] — the object tree ([`crate::models::unit_core::model::UnitModel`])
//!   plus the side tables the improvement builders need (shadows,
//!   `userData`, Lambert/Standard material data, two extra geometries).
//!
//! The horse of the stud farm and of the horse deposit is the MOD-04 horse
//! (`unit_core::horse`). No GPU work here: shading/upload is RR-T5.

pub mod droga;
pub mod kit;
pub mod kopalnie;
pub mod model;
pub mod p2;
pub mod p3a;
pub mod p3b;
pub mod registry;
pub mod roblox;
pub mod roblox_legacy;
pub mod zasoby;
pub mod zwierzeta;

pub use model::{Box3, ExtraGeo, ImprovementModel, MatExt, MatKind, NodeExt, UserData};
pub use registry::{
    build_improvement, build_improvement_sectored, build_improvement_sectored_default,
    build_improvement_stack, ImprovementInfo, ImprovementKey, SectorRelief, DEFAULT_OWNER_COL,
    IMPROVEMENTS, SECTOR_R_ELEVATED,
};
pub use roblox::build_roblox_food_stack;
pub use zasoby::{build_styled_resource_overlay, Nakladka};
