//! `models::units_kamien` — MOD-05 "Stone" package of the P4.4 model catalogue
//! (`R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1`): the ten Stone-age unit models
//! of `render/kamien-bazowe-opus5.ts`, `render/kamien-inka-opus5.ts`,
//! `render/kamien-lucznicy-opus5.ts` and `render/kamien-zulu-taran-opus5.ts`
//! (`edb8fb56`), built as the unit-core object tree
//! ([`UnitModel`]) — no new tree type, no GPU work.
//!
//! - [`bazowe`] — Wojownik, Oszczepnik, Łucznik, Zwiadowca;
//! - [`inka`] — Wojownik z maczugą (Chaska), Oszczepnik (Estólica);
//! - [`lucznicy`] — Łucznik egipski, Łucznik sumeryjski;
//! - [`zulu_taran`] — Oszczepnik Zulu (Izijula), Taran;
//! - [`geo`] — the hand-built `BufferGeometry` bodies and `CircleGeometry`
//!   ([`geo::KamienGeo`], hooked into the unit-core `Prim::Kamien`);
//! - [`kit`] — shared chain kinematics / IK and the Three.js operations the
//!   unit-core tree lacks (`rotateOnAxis`, `Euler.setFromQuaternion`,
//!   V8 `Math.asin`).
//!
//! The unit-core registry ([`crate::models::unit_core::registry::build_base`])
//! and `buildCategoryModel` dispatch delegate here through [`build`].

pub mod bazowe;
pub mod geo;
pub mod inka;
pub mod kit;
pub mod lucznicy;
pub mod zulu_taran;

use crate::models::unit_core::model::UnitModel;
use crate::models::unit_core::registry::{Base, Package};

/// Builds a MOD-05 builder for `owner`; `None` for a [`Base`] of another
/// package.
#[must_use]
pub fn build(base: Base, owner: u32) -> Option<UnitModel> {
    let m = match base {
        Base::WojownikOpus5 => bazowe::build_wojownik_opus5(owner),
        Base::OszczepnikOpus5 => bazowe::build_oszczepnik_opus5(owner),
        Base::LucznikOpus5 => bazowe::build_lucznik_opus5(owner),
        Base::ZwiadowcaOpus5 => bazowe::build_zwiadowca_opus5(owner),
        Base::MaceWarrior => inka::build_mace_warrior_opus5(owner),
        Base::InkaJavelineer => inka::build_inka_javelineer_opus5(owner),
        Base::ZuluJavelineer => zulu_taran::build_zulu_javelineer_opus5(owner),
        Base::BatteringRam => zulu_taran::build_battering_ram_opus5(owner),
        Base::EgyptianArcher => lucznicy::build_egyptian_archer_opus5(owner),
        Base::SumerianArcher => lucznicy::build_sumerian_archer_opus5(owner),
        _ => {
            debug_assert_ne!(base.package(), Package::Mod05Stone);
            return None;
        }
    };
    Some(m)
}
