//! Builder registry: one [`Base`] per distinct web builder that a unit can
//! end up in, with its web origin and the P4.4 package that owns its
//! geometry. Builders of packages 5–7 are explicit stubs returning
//! [`NotYetPorted`]; [`pending`] lists them.

use super::category::{build_category_model, build_decorated_chariot, ChariotDecor, UnitCategory};
use super::model::UnitModel;
use super::named_unused;
use super::p1;
use std::fmt;

/// P4.4 model package owning a builder's geometry (`P4-4-MODEL-CATALOG.md`
/// §4.2).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Package {
    /// MOD-04 unit core (this module), including the `units.ts` named
    /// models without a `units.json` record (P4-7 §4.1 #1–4, #7).
    Mod04Core,
    /// MOD-05 Stone (`kamien-*-opus5.ts`).
    Mod05Stone,
    /// MOD-06 Bronze (`braz-*`, `jednostki-p2/p3/p4/p57/p8a/p8b`, 8 `units.ts` models).
    Mod06Bronze,
    /// MOD-07 Iron (`hastati-*`, `jednostki-p6/z1/z2/z3`, `zelazo-*`, 3 `units.ts` models).
    Mod07Iron,
}

macro_rules! bases {
    ($($v:ident => ($web:literal, $file:literal, $pkg:ident),)*) => {
        /// Distinct builder a unit model resolves to.
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        #[allow(missing_docs)]
        pub enum Base { $($v,)* }

        impl Base {
            /// Every builder.
            pub const ALL: &'static [Self] = &[$(Self::$v,)*];

            /// Web function the builder corresponds to (the name used in the
            /// `buildNamedUnit` / `buildCategoryModel` dispatch).
            #[must_use]
            pub const fn web_fn(self) -> &'static str {
                match self { $(Self::$v => $web,)* }
            }

            /// Web file holding the geometry (`gra/src/render/…`).
            #[must_use]
            pub const fn web_file(self) -> &'static str {
                match self { $(Self::$v => $file,)* }
            }

            /// Owning package.
            #[must_use]
            pub const fn package(self) -> Package {
                match self { $(Self::$v => Package::$pkg,)* }
            }
        }
    };
}

bases! {
    // ---- MOD-04 core: buildCategoryModel bodies and delegations inside MOD-04
    CatLegionista => ("buildCategoryModel('legionista')", "units.ts", Mod04Core),
    CatOsadnik => ("buildCategoryModel('osadnik')", "units.ts", Mod04Core),
    CatMaczuga => ("buildCategoryModel('maczuga')", "units.ts", Mod04Core),
    CatTopor => ("buildCategoryModel('topor')", "units.ts", Mod04Core),
    CatKonnica => ("buildCategoryModel('konnica')", "units.ts", Mod04Core),
    CatRydwan => ("buildCategoryModel('rydwan')", "units.ts", Mod04Core),
    CatSuper => ("buildCategoryModel('super')", "units.ts", Mod04Core),
    CatRobotnik => ("buildCategoryModel('robotnik')", "units.ts", Mod04Core),
    Galera => ("buildGalera", "galera-model.ts", Mod04Core),
    ChariotMycenaean => ("decorateChariot(rydwan, BRONZE, WOAD)", "units.ts", Mod04Core),
    ChariotShang => ("decorateChariot(rydwan, LACQUER, LACQUER)", "units.ts", Mod04Core),
    ChariotCeltic => ("decorateChariot(rydwan, GOLD_BR, FOREST, celtic)", "units.ts", Mod04Core),
    P1Miecznik => ("buildMiecznik", "jednostki-p1-rdzen.ts", Mod04Core),
    P1Wlocznik => ("buildWlocznik", "jednostki-p1-rdzen.ts", Mod04Core),
    P1Procarz => ("buildProcarz", "jednostki-p1-rdzen.ts", Mod04Core),
    P1WojownikKamien => ("buildWojownikKamien", "jednostki-p1-rdzen.ts", Mod04Core),
    P1Oszczepnik => ("buildOszczepnik", "jednostki-p1-rdzen.ts", Mod04Core),
    P1Lucznik => ("buildLucznik", "jednostki-p1-rdzen.ts", Mod04Core),
    P1Zwiadowca => ("buildZwiadowca", "jednostki-p1-rdzen.ts", Mod04Core),
    // ---- MOD-04, named models of units.ts without a units.json record (gallery only)
    CeltWarrior => ("buildCeltWarrior", "units.ts", Mod04Core),
    Crossbowman => ("buildCrossbowman", "units.ts", Mod04Core),
    GermanWarrior => ("buildGermanWarrior", "units.ts", Mod04Core),
    HierosLochos => ("buildHierosLochos", "units.ts", Mod04Core),
    BerserkerOld => ("buildBerserker", "units.ts", Mod04Core),
    // ---- MOD-05 Stone
    WojownikOpus5 => ("buildWojownikOpus5", "kamien-bazowe-opus5.ts", Mod05Stone),
    OszczepnikOpus5 => ("buildOszczepnikOpus5", "kamien-bazowe-opus5.ts", Mod05Stone),
    LucznikOpus5 => ("buildLucznikOpus5", "kamien-bazowe-opus5.ts", Mod05Stone),
    ZwiadowcaOpus5 => ("buildZwiadowcaOpus5", "kamien-bazowe-opus5.ts", Mod05Stone),
    MaceWarrior => ("buildMaceWarrior", "kamien-inka-opus5.ts", Mod05Stone),
    InkaJavelineer => ("buildInkaJavelineer", "kamien-inka-opus5.ts", Mod05Stone),
    ZuluJavelineer => ("buildZuluJavelineer", "kamien-zulu-taran-opus5.ts", Mod05Stone),
    BatteringRam => ("buildBatteringRam", "kamien-zulu-taran-opus5.ts", Mod05Stone),
    EgyptianArcher => ("buildEgyptianArcher", "kamien-lucznicy-opus5.ts", Mod05Stone),
    SumerianArcher => ("buildSumerianArcher", "kamien-lucznicy-opus5.ts", Mod05Stone),
    // ---- MOD-06 Bronze
    ProcarzBrazOpus5 => ("buildProcarzBrazOpus5", "braz-procarz-opus5.ts", Mod06Bronze),
    WlocznikBrazOpus5 => ("buildWlocznikBrazOpus5", "braz-wlocznik-opus5.ts", Mod06Bronze),
    MiecznikBrazOpus5 => ("buildMiecznikBrazOpus5", "braz-miecznik-opus5.ts", Mod06Bronze),
    RydwanWolyBrazOpus5 => ("buildRydwanWolyBrazOpus5", "braz-rydwan-woly-opus5.ts", Mod06Bronze),
    KonnicaBrazOpus5 => ("buildKonnicaBrazOpus5", "braz-konnica-opus5.ts", Mod06Bronze),
    RydwanKonnyBrazOpus5 => ("buildRydwanKonnyBrazOpus5", "braz-rydwan-konny-opus5.ts", Mod06Bronze),
    RydwanKapadokijskiOpus5 => ("buildRydwanKapadokijskiOpus5", "braz-rydwan-kapadokijski-opus5.ts", Mod06Bronze),
    NubianArcherOpus5 => ("buildNubianArcherOpus5", "braz-lucznik-nubijski-opus5.ts", Mod06Bronze),
    TaranOkutyOpus5 => ("buildTaranOkutyOpus5", "braz-taran-opus5.ts", Mod06Bronze),
    AxeWarriorInka => ("buildAxeWarriorInka", "jednostki-p2-inka.ts", Mod06Bronze),
    InkaSlinger => ("buildInkaSlinger", "jednostki-p2-inka.ts", Mod06Bronze),
    AkkadianArcher => ("buildAkkadianArcher", "jednostki-p3-dystans.ts", Mod06Bronze),
    AssyrianArcher => ("buildAssyrianArcher", "jednostki-p3-dystans.ts", Mod06Bronze),
    Sherden => ("buildSherden", "jednostki-p4-melee.ts", Mod06Bronze),
    Tyrrhenian => ("buildTyrrhenian", "jednostki-p4-melee.ts", Mod06Bronze),
    Shekelesh => ("buildShekelesh", "jednostki-p4-melee.ts", Mod06Bronze),
    MycenaeanWarrior => ("buildMycenaeanWarrior", "jednostki-p4-melee.ts", Mod06Bronze),
    ShangHalberdier => ("buildShangHalberdier", "jednostki-p4-melee.ts", Mod06Bronze),
    KhopeshWarrior => ("buildKhopeshWarrior", "jednostki-p4-melee.ts", Mod06Bronze),
    Impi => ("buildImpi", "jednostki-p57-wlocznie-machiny.ts", Mod06Bronze),
    SumerianSpearman => ("buildSumerianSpearman", "jednostki-p57-wlocznie-machiny.ts", Mod06Bronze),
    SiegeTower => ("buildSiegeTower", "jednostki-p57-wlocznie-machiny.ts", Mod06Bronze),
    PiechotaHetycka => ("buildPiechotaHetycka", "jednostki-p8a-bliskiwschod.ts", Mod06Bronze),
    GwardiaIshtar => ("buildGwardiaIshtar", "jednostki-p8a-bliskiwschod.ts", Mod06Bronze),
    WojownikBabilonski => ("buildWojownikBabilonski", "jednostki-p8a-bliskiwschod.ts", Mod06Bronze),
    WojownikFenicki => ("buildWojownikFenicki", "jednostki-p8a-bliskiwschod.ts", Mod06Bronze),
    StraznikHarappy => ("buildStraznikHarappy", "jednostki-p8b-rozni.ts", Mod06Bronze),
    PiechotaInduska => ("buildPiechotaInduska", "jednostki-p8b-rozni.ts", Mod06Bronze),
    LegionRzymski => ("buildLegionRzymski", "jednostki-p8b-rozni.ts", Mod06Bronze),
    GwardzistaChampi => ("buildGwardzistaChampi", "jednostki-p8b-rozni.ts", Mod06Bronze),
    ChineseCavalry => ("buildChineseCavalry", "units.ts", Mod06Bronze),
    HuBenWei => ("buildHuBenWei", "units.ts", Mod06Bronze),
    UThulwana => ("buildUThulwana", "units.ts", Mod06Bronze),
    InkaRoyalGuard => ("buildInkaRoyalGuard", "units.ts", Mod06Bronze),
    EgyptianChariot => ("buildEgyptianChariot", "units.ts", Mod06Bronze),
    Medjay => ("buildMedjay", "units.ts", Mod06Bronze),
    SumerianChariot => ("buildSumerianChariot", "units.ts", Mod06Bronze),
    SumerianRoyalGuard => ("buildSumerianRoyalGuard", "units.ts", Mod06Bronze),
    // ---- MOD-07 Iron
    Falangita => ("buildFalangita", "hastati-falangita.ts", Mod07Iron),
    HastatiOld => ("buildHastati", "hastati-falangita.ts", Mod07Iron),
    HastatiOpus5 => ("buildHastatiOpus5", "hastati-opus5.ts", Mod07Iron),
    SuperGreece => ("buildSuperGreece", "jednostki-p6-super.ts", Mod07Iron),
    SuperRome => ("buildSuperRome", "jednostki-p6-super.ts", Mod07Iron),
    GwardiaHetycka => ("buildGwardiaHetycka", "jednostki-z1-mezopotamia.ts", Mod07Iron),
    PiechotaNeobabilonska => ("buildPiechotaNeobabilonska", "jednostki-z1-mezopotamia.ts", Mod07Iron),
    MurTarcz => ("buildMurTarcz", "jednostki-z1-mezopotamia.ts", Mod07Iron),
    GarnizonHarappy => ("buildGarnizonHarappy", "jednostki-z1-mezopotamia.ts", Mod07Iron),
    TyrskiMiecznik => ("buildTyrskiMiecznik", "jednostki-z2-srodziemne.ts", Mod07Iron),
    GwardiaTyrenska => ("buildGwardiaTyrenska", "jednostki-z2-srodziemne.ts", Mod07Iron),
    ZelaznyKhopesh => ("buildZelaznyKhopesh", "jednostki-z2-srodziemne.ts", Mod07Iron),
    Thorakites => ("buildThorakites", "jednostki-z2-srodziemne.ts", Mod07Iron),
    Triari => ("buildTriari", "jednostki-z2-srodziemne.ts", Mod07Iron),
    Druzynnik => ("buildDruzynnik", "jednostki-z3-plemiona.ts", Mod07Iron),
    IButho => ("buildIButho", "jednostki-z3-plemiona.ts", Mod07Iron),
    GermanSuper => ("buildGermanSuper", "jednostki-z3-plemiona.ts", Mod07Iron),
    MiecznikGalijski => ("buildMiecznikGalijski", "jednostki-z3-plemiona.ts", Mod07Iron),
    BerserkerZ3 => ("buildBerserker (Z3)", "jednostki-z3-plemiona.ts", Mod07Iron),
    ZelazoKonnicaLancowaAsyryjska => ("buildZelazoKonnicaLancowaAsyryjska", "zelazo-konnica-asyryjska-opus5.ts", Mod07Iron),
    ZelazoKonnicaLuczniczaAsyryjska => ("buildZelazoKonnicaLuczniczaAsyryjska", "zelazo-konnica-asyryjska-opus5.ts", Mod07Iron),
    ZelazoJezdziecOszczepami => ("buildZelazoJezdziecOszczepami", "zelazo-jezdziec-oszczepami-opus5.ts", Mod07Iron),
    Gaesatae => ("buildGaesatae", "units.ts", Mod07Iron),
    Soldurii => ("buildSoldurii", "units.ts", Mod07Iron),
    Catapult => ("buildCatapult", "units.ts", Mod07Iron),
}

/// A builder whose geometry has not been ported yet (packages 5–7, or the
/// unused `units.ts` models of MOD-04 not in this round's GOAL).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NotYetPorted {
    /// The missing builder.
    pub base: Base,
}

impl NotYetPorted {
    /// The stub error for `base`.
    #[must_use]
    pub const fn of(base: Base) -> Self {
        Self { base }
    }
}

impl fmt::Display for NotYetPorted {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "model {:?} ({} in gra/src/render/{}) not yet ported (package {:?})",
            self.base,
            self.base.web_fn(),
            self.base.web_file(),
            self.base.package()
        )
    }
}

impl std::error::Error for NotYetPorted {}

/// `true` for the packages whose builders are ported: MOD-04 (this module)
/// and MOD-05 Stone ([`crate::models::units_kamien`],
/// `R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1`). Private: no new public API.
const fn is_ported(pkg: Package) -> bool {
    matches!(pkg, Package::Mod04Core | Package::Mod05Stone)
}

/// Builders still waiting for their package (packages 6–7).
#[must_use]
pub fn pending() -> Vec<Base> {
    Base::ALL
        .iter()
        .copied()
        .filter(|b| !is_ported(b.package()))
        .collect()
}

/// Builds `base` for `owner`.
///
/// # Errors
/// [`NotYetPorted`] for every builder of a package not ported yet
/// (MOD-06, MOD-07).
pub fn build_base(base: Base, owner: u32) -> Result<UnitModel, NotYetPorted> {
    if base.package() == Package::Mod05Stone {
        return crate::models::units_kamien::build(base, owner).ok_or(NotYetPorted::of(base));
    }
    match base {
        Base::CatLegionista => build_category_model(UnitCategory::Legionista, owner),
        Base::CatOsadnik => build_category_model(UnitCategory::Osadnik, owner),
        Base::CatMaczuga => build_category_model(UnitCategory::Maczuga, owner),
        Base::CatTopor => build_category_model(UnitCategory::Topor, owner),
        Base::CatKonnica => build_category_model(UnitCategory::Konnica, owner),
        Base::CatRydwan => build_category_model(UnitCategory::Rydwan, owner),
        Base::CatSuper => build_category_model(UnitCategory::Super, owner),
        Base::CatRobotnik => build_category_model(UnitCategory::Robotnik, owner),
        Base::Galera => build_category_model(UnitCategory::Galera, owner),
        Base::ChariotMycenaean => Ok(build_decorated_chariot(owner, ChariotDecor::Mycenaean)),
        Base::ChariotShang => Ok(build_decorated_chariot(owner, ChariotDecor::Shang)),
        Base::ChariotCeltic => Ok(build_decorated_chariot(owner, ChariotDecor::Celtic)),
        Base::P1Miecznik => Ok(p1::build_miecznik(owner)),
        Base::P1Wlocznik => Ok(p1::build_wlocznik(owner)),
        Base::P1Procarz => Ok(p1::build_procarz(owner)),
        Base::P1WojownikKamien => Ok(p1::build_wojownik_kamien(owner)),
        Base::P1Oszczepnik => Ok(p1::build_oszczepnik(owner)),
        Base::P1Lucznik => Ok(p1::build_lucznik(owner)),
        Base::P1Zwiadowca => Ok(p1::build_zwiadowca(owner)),
        Base::HierosLochos => Ok(named_unused::build_hieros_lochos(owner)),
        Base::Crossbowman => Ok(named_unused::build_crossbowman(owner)),
        Base::CeltWarrior => Ok(named_unused::build_celt_warrior(owner)),
        Base::GermanWarrior => Ok(named_unused::build_german_warrior(owner)),
        Base::BerserkerOld => Ok(named_unused::build_berserker_old(owner)),
        other => Err(NotYetPorted::of(other)),
    }
}
