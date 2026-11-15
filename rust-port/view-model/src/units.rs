//! Units and stacks (contract §3.5).
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::{HexCoord, OwnerRef, UnitId};
use serde::{Deserialize, Serialize};

/// One unit (contract §3.5 `UnitViewDto`). Order of `units[]`: the engine
/// `units` array (= `sync` order, `render/units.ts:6095-6098`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UnitViewDto {
    /// `RuntimeUnit.id` (`units/setup.ts:42`).
    pub id: UnitId,
    /// `RuntimeUnit.ownerId` (`:43`).
    pub owner_id: OwnerRef,
    /// `RuntimeUnit.typeId` (`:44`), `units.json` key.
    pub type_id: String,
    /// `RuntimeUnit.category` (`:48`), engine `category_of`.
    pub category: String,
    /// `RuntimeUnit.q/r` (`:49-50`).
    pub hex: HexCoord,
    /// `RuntimeUnit.ruch` (`:51`).
    pub ruch_max: f64,
    /// `RuntimeUnit.ruchLeft` (`:52`).
    pub ruch_left: f64,
    /// `RuntimeUnit.hp` (`:61`).
    pub hp: f64,
    /// `RuntimeUnit.hpMax` (`:63`).
    pub hp_max: Option<f64>,
    /// `RuntimeUnit.embarked` (`:74`).
    pub embarked: bool,
    /// `RuntimeUnit.inGarnizon` (`:54`).
    pub in_garnizon: bool,
    /// `RuntimeUnit.isGeneral` (`:46`).
    pub is_general: bool,
    /// Veteran stars `0..=3` (`veteranStarCount`).
    pub veteran_stars: u8,
    /// Armour path badge level `0..=3` (`UnitPathBadgeLevel`,
    /// `game/unit-building-bonuses.ts:292`).
    pub armor_badge_level: u8,
    /// Soft path badge level `0..=3`.
    pub soft_badge_level: u8,
    /// Deferred reveal (`dimmedUnitIds`).
    pub dimmed: bool,
}

/// Stack vitals (contract §3.5 `StackVitalsDto`): web `StackVitals`
/// (`game/armyMerge.ts:1103-1126`), same 11 keys.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StackVitalsDto {
    /// Shared movement left (minimum of members).
    pub ruch_left: f64,
    /// Shared movement max (minimum of members).
    pub ruch_max: f64,
    /// Sum of current HP.
    pub hp: f64,
    /// Sum of max HP.
    pub hp_max: f64,
    /// Field power M of the stack.
    pub field_power_m: f64,
    /// Units in the stack.
    pub count: u32,
    /// Highest armour path level `0..=3`.
    pub armor_badge_level: u8,
    /// Highest soft path level `0..=3`.
    pub soft_badge_level: u8,
    /// Highest veteran level `1..=3` (`VeteranLevel`, `game/veteran.ts:59`).
    pub veteran_level: u8,
    /// Highest star count `0..=3`.
    pub veteran_stars: u8,
    /// The stack holds a general (`stack.some(u => u.isGeneral === true)`).
    pub has_commander: bool,
}

/// Stack display (contract §3.5 `StackViewDto`): web `StackDisplayInfo`
/// (`game/armyMerge.ts:21-43`). `Set`/`Map` become arrays in insertion order;
/// `Map` entries are `[key, value]` pairs (`Array.from(map)` shape).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct StackViewDto {
    /// One representative per stack.
    pub visible_ids: Vec<UnitId>,
    /// Representative → unit count on the hex (when `> 1`).
    pub badge_by_rep_id: Vec<(UnitId, u32)>,
    /// Representatives with the army hunger icon.
    pub starving_rep_ids: Vec<UnitId>,
    /// Representatives with the gold deficit icon.
    pub gold_deficit_rep_ids: Vec<UnitId>,
    /// Representative → whole-stack vitals.
    pub vitals_by_rep_id: Vec<(UnitId, StackVitalsDto)>,
}
