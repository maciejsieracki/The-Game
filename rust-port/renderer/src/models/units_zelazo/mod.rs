//! `models::units_zelazo` — MOD-07 "Iron" package of the P4.4 model
//! catalogue (`R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1`): the Iron-age unit
//! models of `edb8fb56`, built as the unit-core object tree ([`UnitModel`]) —
//! no new tree type, no GPU work.
//!
//! One sub-module per web source file:
//! - [`hastati_opus5`] — `hastati-opus5.ts`;
//! - [`hastati_falangita`] — `hastati-falangita.ts`;
//! - [`p6_super`] — `jednostki-p6-super.ts`;
//! - [`z1`], [`z2`], [`z3`] — `jednostki-z1-mezopotamia.ts`,
//!   `jednostki-z2-srodziemne.ts`, `jednostki-z3-plemiona.ts`;
//! - [`jezdziec`] — `zelazo-jezdziec-oszczepami-opus5.ts`;
//! - [`konnica_asyr`] — `zelazo-konnica-asyryjska-opus5.ts`;
//! - [`units_ts`] — the three MOD-07 builders of `units.ts`
//!   (`buildGaesatae`, `buildSoldurii`, `buildCatapult`);
//! - [`geo`] — `RingGeometry` and the hand-built `BufferGeometry` bodies not
//!   covered by `Prim` / `BrazGeo` ([`geo::ZelazoGeo`], a module body of the
//!   one scene type, P4.27);
//! - [`kit`] — geometry constructors and Three.js helpers shared by the files.
//!
//! The unit-core registry ([`crate::models::unit_core::registry::build_base`])
//! and the `case 'falanga'` of `build_category_model` delegate here through
//! [`build`].

pub mod geo;
pub mod hastati_falangita;
pub mod hastati_opus5;
pub mod jezdziec;
pub mod kit;
pub mod konnica_asyr;
pub mod p6_super;
pub mod units_ts;
pub mod z1;
pub mod z2;
pub mod z3;

use crate::models::unit_core::model::UnitModel;
use crate::models::unit_core::registry::{Base, Package};

/// Builds a MOD-07 builder for `owner`; `None` for a [`Base`] of another
/// package.
#[must_use]
pub fn build(base: Base, owner: u32) -> Option<UnitModel> {
    let m = match base {
        Base::Falangita => hastati_falangita::build_falangita(owner),
        Base::HastatiOld => hastati_falangita::build_hastati(owner),
        Base::HastatiOpus5 => hastati_opus5::build_hastati_opus5(owner),
        Base::SuperGreece => p6_super::build_super_greece(owner),
        Base::SuperRome => p6_super::build_super_rome(owner),
        Base::GwardiaHetycka => z1::build_gwardia_hetycka(owner),
        Base::PiechotaNeobabilonska => z1::build_piechota_neobabilonska(owner),
        Base::MurTarcz => z1::build_mur_tarcz(owner),
        Base::GarnizonHarappy => z1::build_garnizon_harappy(owner),
        Base::TyrskiMiecznik => z2::build_tyrski_miecznik(owner),
        Base::GwardiaTyrenska => z2::build_gwardia_tyrenska(owner),
        Base::ZelaznyKhopesh => z2::build_zelazny_khopesh(owner),
        Base::Thorakites => z2::build_thorakites(owner),
        Base::Triari => z2::build_triari(owner),
        Base::Druzynnik => z3::build_druzynnik(owner),
        Base::IButho => z3::build_ibutho(owner),
        Base::BerserkerZ3 => z3::build_berserker(owner),
        Base::GermanSuper => z3::build_german_super(owner),
        Base::MiecznikGalijski => z3::build_miecznik_galijski(owner),
        Base::ZelazoJezdziecOszczepami => jezdziec::build_zelazo_jezdziec_oszczepami(owner),
        Base::ZelazoKonnicaLancowaAsyryjska => {
            konnica_asyr::build_zelazo_konnica_lancowa_asyryjska(owner)
        }
        Base::ZelazoKonnicaLuczniczaAsyryjska => {
            konnica_asyr::build_zelazo_konnica_lucznicza_asyryjska(owner)
        }
        Base::Gaesatae => units_ts::build_gaesatae(owner),
        Base::Soldurii => units_ts::build_soldurii(owner),
        Base::Catapult => units_ts::build_catapult(owner),
        _ => {
            debug_assert_ne!(base.package(), Package::Mod07Iron, "{base:?}");
            return None;
        }
    };
    Some(m)
}
