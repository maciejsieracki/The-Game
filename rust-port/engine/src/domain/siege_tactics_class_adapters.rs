//! P6 SIEGE-TAKTYKA KLASY-WIRE (R-RUSTPORT-P6-SIEGE-TAKTYKA-KLASYWIRE-Q1, runda 1 Operatora): adaptery flag klas.
//!
//! Lacza klasyfikatory z [`siege_tactics_classify`] (`isSiegeUnit`, `isSiegeTower`, `_isRam`, `canShoot`) z
//! jawnymi strukturami wejsciowymi modulow decyzyjnych:
//! * K1 [`siege_tactics_approach::ApproachUnit`] (`can_shoot`, `is_siege_unit`),
//! * K3 [`siege_tactics_tower::TowerUnit`] (`can_shoot`, `is_siege_unit`, `is_ram`, `is_siege_tower`),
//! * K5H [`siege_tactics_activate::ActivateUnit`] (`can_shoot`, `is_siege_unit`, `is_siege_tower`, `is_ram`, `is_catapult`).
//!
//! Sam modul NIE zmienia istniejacych modulow ani ich testow: to nowa warstwa skladania.
//!
//! KONTRAKT ZAKRESU (zob. dispatch, uwaga o kolejnosci):
//! * `canShoot(ru)` (pin `battleScene.ts:1457`) czyta WYLACZNIE `ru.rangedBase` i `ru.ammoLeft` ([`ShootUnit`]).
//!   NIE czyta `ru.range`, wiec NIE zalezy od `_applyTerrainRange`. Predykat K5H (`activate.rs`, pole `can_shoot`)
//!   deklaruje to samo. Adapter nie przyjmuje wiec zasiegu; `range` przekazuje wolajacy w [`ActivateUnit`] bez zmian.
//! * `is_catapult` (`_isCatapult`) NIE ma klasyfikatora w wektorach KLASY (`siege_tactics_classify` go nie portuje).
//!   Adapter K5H przyjmuje go jako jawne wejscie wolajacego (NIE_ZMIERZONO w tym temacie).
//! * Pola wspolne (`side_atk`, `routed`, `on_wall_walkway`, `mounted`, `primary_ranged`, `shooting_disabled`) i
//!   stan ruchu/zasiegu sa wejsciami wolajacego; adapter ich nie wylicza.

use super::siege_tactics_activate::ActivateUnit;
use super::siege_tactics_approach::ApproachUnit;
use super::siege_tactics_classify::{
    can_shoot, is_ram, is_siege_tower, is_siege_unit, ClassifyUnit, ShootUnit,
};
use super::siege_tactics_tower::TowerUnit;
use super::siege_tactics_walk::WalkUnit;

/// Cztery flagi wyliczone z klasyfikatorow pinu (wynik adaptera).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ClassFlags {
    /// `isSiegeUnit(ru.bu)`.
    pub is_siege_unit: bool,
    /// `isSiegeTower(ru.bu)`.
    pub is_siege_tower: bool,
    /// `_isRam(ru.bu)`.
    pub is_ram: bool,
    /// `canShoot(ru)`.
    pub can_shoot: bool,
}

/// Wspolne pola `ru` czytane przez K1, K3 i K5H (bez flag klas i bez `range`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CommonFields {
    pub side_atk: bool,
    pub routed: bool,
    pub on_wall_walkway: bool,
    pub mounted: bool,
    pub primary_ranged: bool,
    /// Web `ru.shootingEnabled === false`.
    pub shooting_disabled: bool,
}

/// Wylicza flagi klas z [`ClassifyUnit`] (`bu`) i [`ShootUnit`] (`ru.rangedBase`, `ru.ammoLeft`).
pub fn class_flags(bu: &ClassifyUnit, shoot: &ShootUnit) -> ClassFlags {
    ClassFlags {
        is_siege_unit: is_siege_unit(bu),
        is_siege_tower: is_siege_tower(bu),
        is_ram: is_ram(bu),
        can_shoot: can_shoot(shoot),
    }
}

/// Buduje wejscie K1 (`_siegeApproachRestricted`) z pol wspolnych i flag klas.
pub fn approach_unit(common: &CommonFields, flags: &ClassFlags) -> ApproachUnit {
    ApproachUnit {
        side_atk: common.side_atk,
        routed: common.routed,
        on_wall_walkway: common.on_wall_walkway,
        is_siege_unit: flags.is_siege_unit,
        primary_ranged: common.primary_ranged,
        can_shoot: flags.can_shoot,
        shooting_disabled: common.shooting_disabled,
        mounted: common.mounted,
    }
}

/// Buduje wejscie K3 (wieze) z ruchu, pol wspolnych i flag klas.
pub fn tower_unit(walk: WalkUnit, common: &CommonFields, flags: &ClassFlags) -> TowerUnit {
    TowerUnit {
        walk,
        side_atk: common.side_atk,
        routed: common.routed,
        on_wall_walkway: common.on_wall_walkway,
        mounted: common.mounted,
        primary_ranged: common.primary_ranged,
        can_shoot: flags.can_shoot,
        shooting_disabled: common.shooting_disabled,
        is_siege_unit: flags.is_siege_unit,
        is_ram: flags.is_ram,
        is_siege_tower: flags.is_siege_tower,
    }
}

/// Nadpisuje w `base` (K5H) flagi klas wyliczone z klasyfikatorow oraz jawny `is_catapult`.
/// Pozostale pola `base` (w tym `range`, liczone po stronie wolajacego) pozostaja bez zmian.
pub fn activate_unit(
    mut base: ActivateUnit,
    flags: &ClassFlags,
    is_catapult: bool,
) -> ActivateUnit {
    base.can_shoot = flags.can_shoot;
    base.is_siege_unit = flags.is_siege_unit;
    base.is_siege_tower = flags.is_siege_tower;
    base.is_ram = flags.is_ram;
    base.is_catapult = is_catapult;
    base
}
