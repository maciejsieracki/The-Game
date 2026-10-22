//! `models::units_braz` — MOD-06 "Bronze" package of the P4.4 model
//! catalogue (`R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1`): the Bronze-age unit
//! models of `edb8fb56`, built as the unit-core object tree ([`UnitModel`]) —
//! no new tree type, no GPU work.
//!
//! - the nine `braz-*-opus5.ts` files: [`taran`], [`procarz`], [`wlocznik`],
//!   [`miecznik`], [`lucznik_nubijski`], [`rydwan_woly`], [`konnica`],
//!   [`rydwan_konny`], [`rydwan_kapadokijski`];
//! - the six `jednostki-p*` files: [`p2_inka`], [`p3_dystans`], [`p4_melee`],
//!   [`p57`], [`p8a`], [`p8b`] (only the exports reachable from `units.ts`);
//! - [`units_ts`] — the eight MOD-06 builders of `units.ts`;
//! - [`geo`] — `OctahedronGeometry` and the hand-built `BufferGeometry`
//!   bodies ([`geo::BrazGeo`], hooked into the unit-core `Prim::Braz`);
//! - [`kit`] — geometry constructors and Three.js helpers shared by the files.
//!
//! The unit-core registry ([`crate::models::unit_core::registry::build_base`])
//! delegates here through [`build`].

pub mod geo;
pub mod kit;
pub mod konnica;
pub mod lucznik_nubijski;
pub mod miecznik;
pub mod p2_inka;
pub mod p3_dystans;
pub mod p4_melee;
pub mod p57;
pub mod p8a;
pub mod p8b;
pub mod procarz;
pub mod rydwan_kapadokijski;
pub mod rydwan_konny;
pub mod rydwan_woly;
pub mod taran;
pub mod units_ts;
pub mod wlocznik;

use crate::models::unit_core::model::UnitModel;
use crate::models::unit_core::registry::{Base, Package};

/// Builds a MOD-06 builder for `owner`; `None` for a [`Base`] of another
/// package.
#[must_use]
pub fn build(base: Base, owner: u32) -> Option<UnitModel> {
    let m = match base {
        Base::TaranOkutyOpus5 => taran::build_taran_okuty_opus5(owner),
        Base::ProcarzBrazOpus5 => procarz::build_procarz_braz_opus5(owner),
        Base::WlocznikBrazOpus5 => wlocznik::build_wlocznik_braz_opus5(owner),
        Base::MiecznikBrazOpus5 => miecznik::build_miecznik_braz_opus5(owner),
        Base::RydwanWolyBrazOpus5 => rydwan_woly::build_rydwan_woly_braz_opus5(owner),
        Base::KonnicaBrazOpus5 => konnica::build_konnica_braz_opus5(owner),
        Base::RydwanKonnyBrazOpus5 => rydwan_konny::build_rydwan_konny_braz_opus5(owner),
        Base::RydwanKapadokijskiOpus5 => {
            rydwan_kapadokijski::build_rydwan_kapadokijski_opus5(owner)
        }
        Base::AxeWarriorInka => p2_inka::build_axe_warrior_inka(owner),
        Base::InkaSlinger => p2_inka::build_inka_slinger(owner),
        Base::AkkadianArcher => p3_dystans::build_akkadian_archer(owner),
        Base::AssyrianArcher => p3_dystans::build_assyrian_archer(owner),
        Base::Sherden => p4_melee::build_sherden(owner),
        Base::Tyrrhenian => p4_melee::build_tyrrhenian(owner),
        Base::Shekelesh => p4_melee::build_shekelesh(owner),
        Base::MycenaeanWarrior => p4_melee::build_mycenaean_warrior(owner),
        Base::ShangHalberdier => p4_melee::build_shang_halberdier(owner),
        Base::KhopeshWarrior => p4_melee::build_khopesh_warrior(owner),
        Base::Impi => p57::build_impi(owner),
        Base::SumerianSpearman => p57::build_sumerian_spearman(owner),
        Base::SiegeTower => p57::build_siege_tower(owner),
        Base::PiechotaHetycka => p8a::build_piechota_hetycka(owner),
        Base::GwardiaIshtar => p8a::build_gwardia_ishtar(owner),
        Base::WojownikBabilonski => p8a::build_wojownik_babilonski(owner),
        Base::WojownikFenicki => p8a::build_wojownik_fenicki(owner),
        Base::StraznikHarappy => p8b::build_straznik_harappy(owner),
        Base::PiechotaInduska => p8b::build_piechota_induska(owner),
        Base::LegionRzymski => p8b::build_legion_rzymski(owner),
        Base::GwardzistaChampi => p8b::build_gwardzista_champi(owner),
        Base::Medjay => units_ts::build_medjay(owner),
        Base::SumerianChariot => units_ts::build_sumerian_chariot(owner),
        Base::EgyptianChariot => units_ts::build_egyptian_chariot(owner),
        Base::ChineseCavalry => units_ts::build_chinese_cavalry(owner),
        Base::SumerianRoyalGuard => units_ts::build_sumerian_royal_guard(owner),
        Base::HuBenWei => units_ts::build_hu_ben_wei(owner),
        Base::UThulwana => units_ts::build_u_thulwana(owner),
        Base::InkaRoyalGuard => units_ts::build_inka_royal_guard(owner),
        Base::NubianArcherOpus5 => lucznik_nubijski::build_nubian_archer_opus5(owner),
        _ => {
            debug_assert_ne!(base.package(), Package::Mod06Bronze, "{base:?}");
            return None;
        }
    };
    Some(m)
}
