//! `models::unit_core` — MOD-04 "unit core" of the P4.4 model catalogue
//! (`R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1`): the CPU object trees of the web
//! unit models of `render/units.ts`, `render/kon-nowy-model.ts`,
//! `render/galera-model.ts` and `render/jednostki-p1-rdzen.ts` (`edb8fb56`).
//!
//! - [`model`] — object tree (`THREE.Group` equivalent), materials as data,
//!   world matrices, geometry hash and model signature;
//! - [`parts`] — the 88 `getGeo*` and 20 `getGeoNH*` shared parts;
//! - [`avatar`] — `buildBaseAvatar` and the gear helpers;
//! - [`category`] — `buildCategoryModel` (20 `case`), `decorateChariot`,
//!   `applyCultureOverrides`, `attachEmbarkBoat`;
//! - [`horse`], [`galera`], [`p1`] — the three delegated files of MOD-04;
//! - [`routing`] — the legacy web routing (`buildUnitModel`,
//!   `buildNamedUnit`, `buildSuperUnit`, `cultureFromName`, `normName`) and
//!   the D-MOD-9 = A rule table `UnitTypeId → ModelId` ([`routing::model_for`]);
//! - [`registry`] — every builder ([`registry::Base`]) with its owning
//!   package; packages 5–7 are `NotYetPorted` stubs.
//!
//! No GPU work here: a model is geometry descriptions + material parameters
//! + transforms. Uploading / shading is RR-T5.

pub mod avatar;
pub mod category;
pub mod consts;
pub mod galera;
pub mod horse;
pub mod jstrig;
pub mod model;
pub mod named_unused;
pub mod p1;
pub mod parts;
pub mod registry;
pub mod routing;

pub use category::{build_category_model, UnitCategory};
pub use model::{Material, Signature, UnitModel};
pub use registry::{build_base, Base, NotYetPorted, Package};
pub use routing::{build_model, legacy_route, model_for, Culture, ModelId, UnitTypeId};
