//! `render/bronzeCity.ts` (web `edb8fb56`, 464 LOC) — **types only**: the
//! city-style key `BronzeCiv`, `BRONZE_CIVS`, `ikonaIdToBronzeCiv` and the
//! deterministic `rnd`. The classic builder `buildBronzeCity` is reachable
//! only with a map style other than `roblox` (`settlementModel.ts:25-26`), so
//! it is out of scope (D-MOD-1, `P4-4-MODEL-CATALOG.md` §2.3).

use super::jsnum::js_to_uint32;

/// `BronzeCiv` (`bronzeCity.ts:19`), in `BRONZE_CIVS` order.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum BronzeCiv {
    /// `'grecja'` (also the fallback of [`ikona_id_to_bronze_civ`]).
    Grecja,
    /// `'rzym'`.
    Rzym,
    /// `'sumer'`.
    Sumer,
    /// `'egipt'`.
    Egipt,
    /// `'inka'`.
    Inka,
    /// `'aztek'` (no state maps to it, `P4-4` §2.3).
    Aztek,
    /// `'chiny'`.
    Chiny,
    /// `'zulu'`.
    Zulu,
    /// `'celtowie'`.
    Celtowie,
    /// `'germanie'`.
    Germanie,
    /// `'hetyci'`.
    Hetyci,
}

/// `BRONZE_CIVS` (`bronzeCity.ts:20`), 11 keys in the web order.
pub const BRONZE_CIVS: [BronzeCiv; 11] = [
    BronzeCiv::Grecja,
    BronzeCiv::Rzym,
    BronzeCiv::Sumer,
    BronzeCiv::Egipt,
    BronzeCiv::Inka,
    BronzeCiv::Aztek,
    BronzeCiv::Chiny,
    BronzeCiv::Zulu,
    BronzeCiv::Celtowie,
    BronzeCiv::Germanie,
    BronzeCiv::Hetyci,
];

impl BronzeCiv {
    /// Web string.
    #[must_use]
    pub fn web_id(self) -> &'static str {
        match self {
            Self::Grecja => "grecja",
            Self::Rzym => "rzym",
            Self::Sumer => "sumer",
            Self::Egipt => "egipt",
            Self::Inka => "inka",
            Self::Aztek => "aztek",
            Self::Chiny => "chiny",
            Self::Zulu => "zulu",
            Self::Celtowie => "celtowie",
            Self::Germanie => "germanie",
            Self::Hetyci => "hetyci",
        }
    }

    /// From the web string (exact match).
    #[must_use]
    pub fn from_web_id(s: &str) -> Option<Self> {
        BRONZE_CIVS.iter().copied().find(|c| c.web_id() == s)
    }
}

/// `ikonaIdToBronzeCiv(ikonaId)` (`bronzeCity.ts:23-40`): the
/// `IKONA_TO_BRONZE` table, `'grecja'` for an unknown id.
///
/// Conscious deviation (JS quirk, not ported): the web looks the id up in a
/// plain object, so the inherited names `toString`, `constructor`,
/// `__proto__`, `hasOwnProperty`, `valueOf`, … return an `Object.prototype`
/// member instead of a style. No `ikonaId` of `civs.json` is such a name;
/// here they give `Grecja` like any other unknown id.
#[must_use]
pub fn ikona_id_to_bronze_civ(ikona_id: &str) -> BronzeCiv {
    match ikona_id {
        "grecy" | "grecja" => BronzeCiv::Grecja,
        "rzymianie" | "rzym" => BronzeCiv::Rzym,
        "chinczycy" | "chiny" => BronzeCiv::Chiny,
        "inkowie" | "inka" => BronzeCiv::Inka,
        "zulusi" | "zulu" => BronzeCiv::Zulu,
        "egipt" => BronzeCiv::Egipt,
        "babilon" | "babilonia" | "sumerowie" | "sumer" | "harappa" | "asyria" => BronzeCiv::Sumer,
        "celtowie" => BronzeCiv::Celtowie,
        "germanie" | "slowianie" => BronzeCiv::Germanie,
        "hetyci" | "fenicjanie" => BronzeCiv::Hetyci,
        "aztek" => BronzeCiv::Aztek,
        _ => BronzeCiv::Grecja,
    }
}

/// `rnd(n, salt)` (`bronzeCity.ts:42-46`, private in the web): a hash in
/// `[0, 1)`. The first argument of `Math.imul` is a **double**
/// (`(n + 1) * 2654435761 + salt * 40503`, which exceeds 2⁵³ for large `n`)
/// and is reduced with `ToInt32`, so it is computed in `f64` with the same
/// operation order and reduced by [`js_to_uint32`]; the rest is `u32`
/// wrapping arithmetic (`>>> 0` / `^` / `Math.imul` have identical bits).
#[must_use]
pub fn rnd(n: f64, salt: f64) -> f64 {
    let a = js_to_uint32((n + 1.0) * 2_654_435_761.0 + salt * 40503.0);
    let mut x = a.wrapping_mul(0x27d4_eb2d);
    x ^= x >> 15;
    x = x.wrapping_mul(0x2c1b_3c6d);
    x ^= x >> 13;
    f64::from(x) / 4_294_967_296.0
}
