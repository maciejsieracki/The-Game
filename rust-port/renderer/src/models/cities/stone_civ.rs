//! `render/stoneCity.ts` (web `edb8fb56`, 387 LOC) — **types only**:
//! `StoneCiv`, `STONE_CIVS`, `STONE_CIV_LABELS` (`stoneCity.ts:13-20`). The
//! classic builder `buildStoneAgeCity` is reachable only with a map style
//! other than `roblox` (`settlementModel.ts:26`), so it is out of scope
//! (D-MOD-1, `P4-4-MODEL-CATALOG.md` §6).

use crate::core::bronze::{BronzeCiv, BRONZE_CIVS};

/// `StoneCiv = BronzeCiv` (`stoneCity.ts:13`).
pub type StoneCiv = BronzeCiv;

/// `STONE_CIVS = BRONZE_CIVS` (`stoneCity.ts:14`).
pub const STONE_CIVS: [StoneCiv; 11] = BRONZE_CIVS;

/// `STONE_CIV_LABELS[civ]` (`stoneCity.ts:16-20`).
#[must_use]
pub const fn stone_civ_label(civ: StoneCiv) -> &'static str {
    match civ {
        BronzeCiv::Grecja => "Grecy",
        BronzeCiv::Rzym => "Rzymianie",
        BronzeCiv::Sumer => "Sumerowie",
        BronzeCiv::Egipt => "Egipcjanie",
        BronzeCiv::Inka => "Inkowie",
        BronzeCiv::Aztek => "Aztekowie",
        BronzeCiv::Chiny => "Chińczycy",
        BronzeCiv::Zulu => "Zulusi",
        BronzeCiv::Celtowie => "Celtowie",
        BronzeCiv::Germanie => "Germanie",
        BronzeCiv::Hetyci => "Hetyci / Fenicjanie",
    }
}
