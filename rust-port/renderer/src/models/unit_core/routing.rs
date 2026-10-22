//! Unit → model routing.
//!
//! Two layers:
//! 1. **Legacy (web) routing, ported 1:1** — `normName`, `cultureFromName`,
//!    `SUPER_Z_MODELEM_NAZWANYM`, `buildNamedUnit` (85 name rules),
//!    `buildSuperUnit` and `buildUnitModel` (`render/units.ts:994-1126,
//!    1492-1764, 4807-4825`) as [`legacy_route`]. It is a pure function of
//!    (category label, display name) → [`ModelId`], kept for parity checks
//!    and as the generator of the rule table.
//! 2. **D-MOD-9 = A rule "one unit = one model"** (`P4-7-NEW-MODELS-SPEC.md`
//!    §4.2): the model key is the unit TYPE id (`units.json` `Jednostka`,
//!    plus the civilians `Osadnik`, `Robotnik`), looked up in the static
//!    table [`UNIT_MODEL_TABLE`] (77 rows, generated once from today's PL
//!    path). Display names (PL/EN) never take part. [`model_for`] is the
//!    only entry point for every consumer (map, battle, mini-preview).
//!    This removes the 3 PL/EN divergences of the web battle fallback
//!    (`stats['Jednostka'] ?? bu.nazwa`).

use super::category::{apply_culture_overrides, UnitCategory};
use super::consts::*;
use super::model::UnitModel;
use super::registry::{build_base, Base, NotYetPorted};

/// `Culture` of `units.ts:994-995`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
#[allow(missing_docs)]
pub enum Culture {
    Rzym,
    Grecja,
    Chiny,
    Zulu,
    Inka,
    Egipt,
    Sumer,
    Germanie,
    Neutral,
}

impl Culture {
    /// Every value.
    pub const ALL: [Self; 9] = [
        Self::Rzym,
        Self::Grecja,
        Self::Chiny,
        Self::Zulu,
        Self::Inka,
        Self::Egipt,
        Self::Sumer,
        Self::Germanie,
        Self::Neutral,
    ];

    /// The web string (`'rzym'`, ...).
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Rzym => "rzym",
            Self::Grecja => "grecja",
            Self::Chiny => "chiny",
            Self::Zulu => "zulu",
            Self::Inka => "inka",
            Self::Egipt => "egipt",
            Self::Sumer => "sumer",
            Self::Germanie => "germanie",
            Self::Neutral => "neutral",
        }
    }

    /// `cultureHouseColor(c)` (`units.ts:1034-1045`); `0` = no override.
    #[must_use]
    pub const fn house_color(self) -> u32 {
        match self {
            Self::Rzym => COLOR_RED_VIV,
            Self::Grecja => COLOR_WOAD,
            Self::Chiny => COLOR_LACQUER,
            Self::Zulu => COLOR_HIDE_RED,
            Self::Inka => COLOR_OCHRE,
            Self::Egipt => COLOR_LINEN,
            Self::Sumer => COLOR_TEAL,
            Self::Germanie | Self::Neutral => 0x00_0000,
        }
    }

    /// `applyCultureOverrides` adds nothing for this culture (neutral returns
    /// early; `germanie` has no house colour and no `switch` branch).
    #[must_use]
    pub const fn is_noop_overlay(self) -> bool {
        matches!(self, Self::Neutral | Self::Germanie)
    }
}

/// Characters of U+00C0–U+024F and U+1E00–U+1EFF whose NFD decomposition,
/// after dropping U+0300–U+036F, is a different single character (generated
/// with Python `unicodedata` 14.0: `NFD(c)` minus combining marks).
#[rustfmt::skip]
const NFD_FOLD: &[(char, char)] = &[
    ('\u{c0}', 'A'), ('\u{c1}', 'A'), ('\u{c2}', 'A'), ('\u{c3}', 'A'), ('\u{c4}', 'A'),
    ('\u{c5}', 'A'), ('\u{c7}', 'C'), ('\u{c8}', 'E'), ('\u{c9}', 'E'), ('\u{ca}', 'E'),
    ('\u{cb}', 'E'), ('\u{cc}', 'I'), ('\u{cd}', 'I'), ('\u{ce}', 'I'), ('\u{cf}', 'I'),
    ('\u{d1}', 'N'), ('\u{d2}', 'O'), ('\u{d3}', 'O'), ('\u{d4}', 'O'), ('\u{d5}', 'O'),
    ('\u{d6}', 'O'), ('\u{d9}', 'U'), ('\u{da}', 'U'), ('\u{db}', 'U'), ('\u{dc}', 'U'),
    ('\u{dd}', 'Y'), ('\u{e0}', 'a'), ('\u{e1}', 'a'), ('\u{e2}', 'a'), ('\u{e3}', 'a'),
    ('\u{e4}', 'a'), ('\u{e5}', 'a'), ('\u{e7}', 'c'), ('\u{e8}', 'e'), ('\u{e9}', 'e'),
    ('\u{ea}', 'e'), ('\u{eb}', 'e'), ('\u{ec}', 'i'), ('\u{ed}', 'i'), ('\u{ee}', 'i'),
    ('\u{ef}', 'i'), ('\u{f1}', 'n'), ('\u{f2}', 'o'), ('\u{f3}', 'o'), ('\u{f4}', 'o'),
    ('\u{f5}', 'o'), ('\u{f6}', 'o'), ('\u{f9}', 'u'), ('\u{fa}', 'u'), ('\u{fb}', 'u'),
    ('\u{fc}', 'u'), ('\u{fd}', 'y'), ('\u{ff}', 'y'), ('\u{100}', 'A'), ('\u{101}', 'a'),
    ('\u{102}', 'A'), ('\u{103}', 'a'), ('\u{104}', 'A'), ('\u{105}', 'a'), ('\u{106}', 'C'),
    ('\u{107}', 'c'), ('\u{108}', 'C'), ('\u{109}', 'c'), ('\u{10a}', 'C'), ('\u{10b}', 'c'),
    ('\u{10c}', 'C'), ('\u{10d}', 'c'), ('\u{10e}', 'D'), ('\u{10f}', 'd'), ('\u{112}', 'E'),
    ('\u{113}', 'e'), ('\u{114}', 'E'), ('\u{115}', 'e'), ('\u{116}', 'E'), ('\u{117}', 'e'),
    ('\u{118}', 'E'), ('\u{119}', 'e'), ('\u{11a}', 'E'), ('\u{11b}', 'e'), ('\u{11c}', 'G'),
    ('\u{11d}', 'g'), ('\u{11e}', 'G'), ('\u{11f}', 'g'), ('\u{120}', 'G'), ('\u{121}', 'g'),
    ('\u{122}', 'G'), ('\u{123}', 'g'), ('\u{124}', 'H'), ('\u{125}', 'h'), ('\u{128}', 'I'),
    ('\u{129}', 'i'), ('\u{12a}', 'I'), ('\u{12b}', 'i'), ('\u{12c}', 'I'), ('\u{12d}', 'i'),
    ('\u{12e}', 'I'), ('\u{12f}', 'i'), ('\u{130}', 'I'), ('\u{134}', 'J'), ('\u{135}', 'j'),
    ('\u{136}', 'K'), ('\u{137}', 'k'), ('\u{139}', 'L'), ('\u{13a}', 'l'), ('\u{13b}', 'L'),
    ('\u{13c}', 'l'), ('\u{13d}', 'L'), ('\u{13e}', 'l'), ('\u{143}', 'N'), ('\u{144}', 'n'),
    ('\u{145}', 'N'), ('\u{146}', 'n'), ('\u{147}', 'N'), ('\u{148}', 'n'), ('\u{14c}', 'O'),
    ('\u{14d}', 'o'), ('\u{14e}', 'O'), ('\u{14f}', 'o'), ('\u{150}', 'O'), ('\u{151}', 'o'),
    ('\u{154}', 'R'), ('\u{155}', 'r'), ('\u{156}', 'R'), ('\u{157}', 'r'), ('\u{158}', 'R'),
    ('\u{159}', 'r'), ('\u{15a}', 'S'), ('\u{15b}', 's'), ('\u{15c}', 'S'), ('\u{15d}', 's'),
    ('\u{15e}', 'S'), ('\u{15f}', 's'), ('\u{160}', 'S'), ('\u{161}', 's'), ('\u{162}', 'T'),
    ('\u{163}', 't'), ('\u{164}', 'T'), ('\u{165}', 't'), ('\u{168}', 'U'), ('\u{169}', 'u'),
    ('\u{16a}', 'U'), ('\u{16b}', 'u'), ('\u{16c}', 'U'), ('\u{16d}', 'u'), ('\u{16e}', 'U'),
    ('\u{16f}', 'u'), ('\u{170}', 'U'), ('\u{171}', 'u'), ('\u{172}', 'U'), ('\u{173}', 'u'),
    ('\u{174}', 'W'), ('\u{175}', 'w'), ('\u{176}', 'Y'), ('\u{177}', 'y'), ('\u{178}', 'Y'),
    ('\u{179}', 'Z'), ('\u{17a}', 'z'), ('\u{17b}', 'Z'), ('\u{17c}', 'z'), ('\u{17d}', 'Z'),
    ('\u{17e}', 'z'), ('\u{1a0}', 'O'), ('\u{1a1}', 'o'), ('\u{1af}', 'U'), ('\u{1b0}', 'u'),
    ('\u{1cd}', 'A'), ('\u{1ce}', 'a'), ('\u{1cf}', 'I'), ('\u{1d0}', 'i'), ('\u{1d1}', 'O'),
    ('\u{1d2}', 'o'), ('\u{1d3}', 'U'), ('\u{1d4}', 'u'), ('\u{1d5}', 'U'), ('\u{1d6}', 'u'),
    ('\u{1d7}', 'U'), ('\u{1d8}', 'u'), ('\u{1d9}', 'U'), ('\u{1da}', 'u'), ('\u{1db}', 'U'),
    ('\u{1dc}', 'u'), ('\u{1de}', 'A'), ('\u{1df}', 'a'), ('\u{1e0}', 'A'), ('\u{1e1}', 'a'),
    ('\u{1e2}', '\u{c6}'), ('\u{1e3}', '\u{e6}'), ('\u{1e6}', 'G'), ('\u{1e7}', 'g'), ('\u{1e8}', 'K'),
    ('\u{1e9}', 'k'), ('\u{1ea}', 'O'), ('\u{1eb}', 'o'), ('\u{1ec}', 'O'), ('\u{1ed}', 'o'),
    ('\u{1ee}', '\u{1b7}'), ('\u{1ef}', '\u{292}'), ('\u{1f0}', 'j'), ('\u{1f4}', 'G'), ('\u{1f5}', 'g'),
    ('\u{1f8}', 'N'), ('\u{1f9}', 'n'), ('\u{1fa}', 'A'), ('\u{1fb}', 'a'), ('\u{1fc}', '\u{c6}'),
    ('\u{1fd}', '\u{e6}'), ('\u{1fe}', '\u{d8}'), ('\u{1ff}', '\u{f8}'), ('\u{200}', 'A'), ('\u{201}', 'a'),
    ('\u{202}', 'A'), ('\u{203}', 'a'), ('\u{204}', 'E'), ('\u{205}', 'e'), ('\u{206}', 'E'),
    ('\u{207}', 'e'), ('\u{208}', 'I'), ('\u{209}', 'i'), ('\u{20a}', 'I'), ('\u{20b}', 'i'),
    ('\u{20c}', 'O'), ('\u{20d}', 'o'), ('\u{20e}', 'O'), ('\u{20f}', 'o'), ('\u{210}', 'R'),
    ('\u{211}', 'r'), ('\u{212}', 'R'), ('\u{213}', 'r'), ('\u{214}', 'U'), ('\u{215}', 'u'),
    ('\u{216}', 'U'), ('\u{217}', 'u'), ('\u{218}', 'S'), ('\u{219}', 's'), ('\u{21a}', 'T'),
    ('\u{21b}', 't'), ('\u{21e}', 'H'), ('\u{21f}', 'h'), ('\u{226}', 'A'), ('\u{227}', 'a'),
    ('\u{228}', 'E'), ('\u{229}', 'e'), ('\u{22a}', 'O'), ('\u{22b}', 'o'), ('\u{22c}', 'O'),
    ('\u{22d}', 'o'), ('\u{22e}', 'O'), ('\u{22f}', 'o'), ('\u{230}', 'O'), ('\u{231}', 'o'),
    ('\u{232}', 'Y'), ('\u{233}', 'y'), ('\u{1e00}', 'A'), ('\u{1e01}', 'a'), ('\u{1e02}', 'B'),
    ('\u{1e03}', 'b'), ('\u{1e04}', 'B'), ('\u{1e05}', 'b'), ('\u{1e06}', 'B'), ('\u{1e07}', 'b'),
    ('\u{1e08}', 'C'), ('\u{1e09}', 'c'), ('\u{1e0a}', 'D'), ('\u{1e0b}', 'd'), ('\u{1e0c}', 'D'),
    ('\u{1e0d}', 'd'), ('\u{1e0e}', 'D'), ('\u{1e0f}', 'd'), ('\u{1e10}', 'D'), ('\u{1e11}', 'd'),
    ('\u{1e12}', 'D'), ('\u{1e13}', 'd'), ('\u{1e14}', 'E'), ('\u{1e15}', 'e'), ('\u{1e16}', 'E'),
    ('\u{1e17}', 'e'), ('\u{1e18}', 'E'), ('\u{1e19}', 'e'), ('\u{1e1a}', 'E'), ('\u{1e1b}', 'e'),
    ('\u{1e1c}', 'E'), ('\u{1e1d}', 'e'), ('\u{1e1e}', 'F'), ('\u{1e1f}', 'f'), ('\u{1e20}', 'G'),
    ('\u{1e21}', 'g'), ('\u{1e22}', 'H'), ('\u{1e23}', 'h'), ('\u{1e24}', 'H'), ('\u{1e25}', 'h'),
    ('\u{1e26}', 'H'), ('\u{1e27}', 'h'), ('\u{1e28}', 'H'), ('\u{1e29}', 'h'), ('\u{1e2a}', 'H'),
    ('\u{1e2b}', 'h'), ('\u{1e2c}', 'I'), ('\u{1e2d}', 'i'), ('\u{1e2e}', 'I'), ('\u{1e2f}', 'i'),
    ('\u{1e30}', 'K'), ('\u{1e31}', 'k'), ('\u{1e32}', 'K'), ('\u{1e33}', 'k'), ('\u{1e34}', 'K'),
    ('\u{1e35}', 'k'), ('\u{1e36}', 'L'), ('\u{1e37}', 'l'), ('\u{1e38}', 'L'), ('\u{1e39}', 'l'),
    ('\u{1e3a}', 'L'), ('\u{1e3b}', 'l'), ('\u{1e3c}', 'L'), ('\u{1e3d}', 'l'), ('\u{1e3e}', 'M'),
    ('\u{1e3f}', 'm'), ('\u{1e40}', 'M'), ('\u{1e41}', 'm'), ('\u{1e42}', 'M'), ('\u{1e43}', 'm'),
    ('\u{1e44}', 'N'), ('\u{1e45}', 'n'), ('\u{1e46}', 'N'), ('\u{1e47}', 'n'), ('\u{1e48}', 'N'),
    ('\u{1e49}', 'n'), ('\u{1e4a}', 'N'), ('\u{1e4b}', 'n'), ('\u{1e4c}', 'O'), ('\u{1e4d}', 'o'),
    ('\u{1e4e}', 'O'), ('\u{1e4f}', 'o'), ('\u{1e50}', 'O'), ('\u{1e51}', 'o'), ('\u{1e52}', 'O'),
    ('\u{1e53}', 'o'), ('\u{1e54}', 'P'), ('\u{1e55}', 'p'), ('\u{1e56}', 'P'), ('\u{1e57}', 'p'),
    ('\u{1e58}', 'R'), ('\u{1e59}', 'r'), ('\u{1e5a}', 'R'), ('\u{1e5b}', 'r'), ('\u{1e5c}', 'R'),
    ('\u{1e5d}', 'r'), ('\u{1e5e}', 'R'), ('\u{1e5f}', 'r'), ('\u{1e60}', 'S'), ('\u{1e61}', 's'),
    ('\u{1e62}', 'S'), ('\u{1e63}', 's'), ('\u{1e64}', 'S'), ('\u{1e65}', 's'), ('\u{1e66}', 'S'),
    ('\u{1e67}', 's'), ('\u{1e68}', 'S'), ('\u{1e69}', 's'), ('\u{1e6a}', 'T'), ('\u{1e6b}', 't'),
    ('\u{1e6c}', 'T'), ('\u{1e6d}', 't'), ('\u{1e6e}', 'T'), ('\u{1e6f}', 't'), ('\u{1e70}', 'T'),
    ('\u{1e71}', 't'), ('\u{1e72}', 'U'), ('\u{1e73}', 'u'), ('\u{1e74}', 'U'), ('\u{1e75}', 'u'),
    ('\u{1e76}', 'U'), ('\u{1e77}', 'u'), ('\u{1e78}', 'U'), ('\u{1e79}', 'u'), ('\u{1e7a}', 'U'),
    ('\u{1e7b}', 'u'), ('\u{1e7c}', 'V'), ('\u{1e7d}', 'v'), ('\u{1e7e}', 'V'), ('\u{1e7f}', 'v'),
    ('\u{1e80}', 'W'), ('\u{1e81}', 'w'), ('\u{1e82}', 'W'), ('\u{1e83}', 'w'), ('\u{1e84}', 'W'),
    ('\u{1e85}', 'w'), ('\u{1e86}', 'W'), ('\u{1e87}', 'w'), ('\u{1e88}', 'W'), ('\u{1e89}', 'w'),
    ('\u{1e8a}', 'X'), ('\u{1e8b}', 'x'), ('\u{1e8c}', 'X'), ('\u{1e8d}', 'x'), ('\u{1e8e}', 'Y'),
    ('\u{1e8f}', 'y'), ('\u{1e90}', 'Z'), ('\u{1e91}', 'z'), ('\u{1e92}', 'Z'), ('\u{1e93}', 'z'),
    ('\u{1e94}', 'Z'), ('\u{1e95}', 'z'), ('\u{1e96}', 'h'), ('\u{1e97}', 't'), ('\u{1e98}', 'w'),
    ('\u{1e99}', 'y'), ('\u{1e9b}', '\u{17f}'), ('\u{1ea0}', 'A'), ('\u{1ea1}', 'a'), ('\u{1ea2}', 'A'),
    ('\u{1ea3}', 'a'), ('\u{1ea4}', 'A'), ('\u{1ea5}', 'a'), ('\u{1ea6}', 'A'), ('\u{1ea7}', 'a'),
    ('\u{1ea8}', 'A'), ('\u{1ea9}', 'a'), ('\u{1eaa}', 'A'), ('\u{1eab}', 'a'), ('\u{1eac}', 'A'),
    ('\u{1ead}', 'a'), ('\u{1eae}', 'A'), ('\u{1eaf}', 'a'), ('\u{1eb0}', 'A'), ('\u{1eb1}', 'a'),
    ('\u{1eb2}', 'A'), ('\u{1eb3}', 'a'), ('\u{1eb4}', 'A'), ('\u{1eb5}', 'a'), ('\u{1eb6}', 'A'),
    ('\u{1eb7}', 'a'), ('\u{1eb8}', 'E'), ('\u{1eb9}', 'e'), ('\u{1eba}', 'E'), ('\u{1ebb}', 'e'),
    ('\u{1ebc}', 'E'), ('\u{1ebd}', 'e'), ('\u{1ebe}', 'E'), ('\u{1ebf}', 'e'), ('\u{1ec0}', 'E'),
    ('\u{1ec1}', 'e'), ('\u{1ec2}', 'E'), ('\u{1ec3}', 'e'), ('\u{1ec4}', 'E'), ('\u{1ec5}', 'e'),
    ('\u{1ec6}', 'E'), ('\u{1ec7}', 'e'), ('\u{1ec8}', 'I'), ('\u{1ec9}', 'i'), ('\u{1eca}', 'I'),
    ('\u{1ecb}', 'i'), ('\u{1ecc}', 'O'), ('\u{1ecd}', 'o'), ('\u{1ece}', 'O'), ('\u{1ecf}', 'o'),
    ('\u{1ed0}', 'O'), ('\u{1ed1}', 'o'), ('\u{1ed2}', 'O'), ('\u{1ed3}', 'o'), ('\u{1ed4}', 'O'),
    ('\u{1ed5}', 'o'), ('\u{1ed6}', 'O'), ('\u{1ed7}', 'o'), ('\u{1ed8}', 'O'), ('\u{1ed9}', 'o'),
    ('\u{1eda}', 'O'), ('\u{1edb}', 'o'), ('\u{1edc}', 'O'), ('\u{1edd}', 'o'), ('\u{1ede}', 'O'),
    ('\u{1edf}', 'o'), ('\u{1ee0}', 'O'), ('\u{1ee1}', 'o'), ('\u{1ee2}', 'O'), ('\u{1ee3}', 'o'),
    ('\u{1ee4}', 'U'), ('\u{1ee5}', 'u'), ('\u{1ee6}', 'U'), ('\u{1ee7}', 'u'), ('\u{1ee8}', 'U'),
    ('\u{1ee9}', 'u'), ('\u{1eea}', 'U'), ('\u{1eeb}', 'u'), ('\u{1eec}', 'U'), ('\u{1eed}', 'u'),
    ('\u{1eee}', 'U'), ('\u{1eef}', 'u'), ('\u{1ef0}', 'U'), ('\u{1ef1}', 'u'), ('\u{1ef2}', 'Y'),
    ('\u{1ef3}', 'y'), ('\u{1ef4}', 'Y'), ('\u{1ef5}', 'y'), ('\u{1ef6}', 'Y'), ('\u{1ef7}', 'y'),
    ('\u{1ef8}', 'Y'), ('\u{1ef9}', 'y'),
];

fn nfd_fold(c: char) -> Option<char> {
    NFD_FOLD
        .binary_search_by(|&(k, _)| k.cmp(&c))
        .ok()
        .map(|i| NFD_FOLD[i].1)
}

/// `normName(s)` (`units.ts:998-1001`): NFD, drop U+0300–U+036F, `Ł/ł → l`,
/// `toLowerCase()`.
///
/// NFD is implemented for Latin-1 Supplement, Latin Extended-A/B and Latin
/// Extended Additional (every character of `units.json` names is inside
/// these blocks); other characters pass through unchanged.
#[must_use]
pub fn norm_name(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if ('\u{300}'..='\u{36f}').contains(&c) {
            continue;
        }
        let c = nfd_fold(c).unwrap_or(c);
        let c = if c == '\u{141}' || c == '\u{142}' {
            'l'
        } else {
            c
        };
        out.push(c);
    }
    out.to_lowercase()
}

/// `cultureFromName(name)` (`units.ts:1008-1027`).
#[must_use]
pub fn culture_from_name(name: Option<&str>) -> Culture {
    let Some(name) = name.filter(|s| !s.is_empty()) else {
        return Culture::Neutral;
    };
    let n = norm_name(name);
    let has = |k: &str| n.contains(k);
    if has("evocati") || has("triarii") || has("triari") || has("legionist") || has("hastati") {
        return Culture::Rzym;
    }
    if has("hieros") || has("zastep") || has("falanga") || has("hoplit") {
        return Culture::Grecja;
    }
    if has("hu ben") || has("tygrys") || has("chins") || has("kusznik") {
        return Culture::Chiny;
    }
    if has("thulwana") || has("biale tarcz") || has("impi") || has("izijula") || has("zulu") {
        return Culture::Zulu;
    }
    if has("krolewska gwardia")
        || has("chaska")
        || has("huaracoc")
        || has("estolic")
        || has("inka")
        || has("ink")
    {
        return Culture::Inka;
    }
    if has("medzaj") || has("faraon") || has("khopesh") || has("egip") {
        return Culture::Egipt;
    }
    if has("sumeru") || has("sumer") || has("qurub") {
        return Culture::Sumer;
    }
    if has("germansk") || has("germanic") || has("germanie") {
        return Culture::Germanie;
    }
    Culture::Neutral
}

/// `SUPER_Z_MODELEM_NAZWANYM.test(n)` (`units.ts:1068-1069`): an unanchored
/// alternation of literals = "contains any".
#[must_use]
pub fn super_has_named_model(n: &str) -> bool {
    const ALTS: [&str; 13] = [
        "hu ben wei",
        "tiger guard",
        "gwardia tygrysa",
        "uthulwana",
        "white shields",
        "biale tarcze",
        "krolewska gwardia",
        "royal guard",
        "medzaj",
        "medjay",
        "gwardia faraona",
        "gwardia krolewska sumeru",
        "qurubuti",
    ];
    ALTS.iter().any(|a| n.contains(a))
}

/// `buildNamedUnit(n, owner)` dispatch (`units.ts:1492-1764`) on an already
/// normalised name: the builder of the first matching rule, `None` when no
/// rule matches (or the explicit `legion` fall-through, `:1681`).
#[must_use]
#[allow(clippy::too_many_lines, clippy::cognitive_complexity)]
pub fn named_rule(n: &str) -> Option<Base> {
    use Base as B;
    let has = |k: &str| n.contains(k);
    let is = |k: &str| n == k;
    // CELTS
    if has("soldurii") || has("soldur") {
        return Some(B::Soldurii);
    }
    if has("gaesatae") {
        return Some(B::Gaesatae);
    }
    if has("wojownik celtycki") || (has("celtyck") && has("wojownik")) {
        return Some(B::CeltWarrior);
    }
    if has("rydwan celtycki") || (has("rydwan") && has("celtyck")) {
        return Some(B::ChariotCeltic);
    }
    // GERMANS
    if has("berserker germansk") || has("berserk") {
        return Some(B::BerserkerZ3);
    }
    if has("wojownik germansk") || (has("germansk") && has("wojownik")) {
        return Some(B::GermanWarrior);
    }
    // GRECJA
    if has("falanga") || has("hoplit") || has("phalanx") {
        return Some(B::Falangita);
    }
    // BRONZE SPECIALS
    if has("wojownik mykensk") || (has("mykensk") && has("wojownik")) {
        return Some(B::MycenaeanWarrior);
    }
    if has("rydwan mykensk") || (has("rydwan") && has("mykensk")) {
        return Some(B::ChariotMycenaean);
    }
    if has("kapadok") || has("cappadoc") {
        return Some(B::RydwanKapadokijskiOpus5);
    }
    if has("sherden") {
        return Some(B::Sherden);
    }
    if has("halabardnik shang") || (has("shang") && has("halabard")) {
        return Some(B::ShangHalberdier);
    }
    if has("rydwan shang") || (has("rydwan") && has("shang")) {
        return Some(B::ChariotShang);
    }
    if has("lucznik akadyjski") || has("akadyjsk") || has("akkad") {
        return Some(B::AkkadianArcher);
    }
    // ENGLISH aliases
    if has("celtic warrior") {
        return Some(B::CeltWarrior);
    }
    if has("celtic chariot") {
        return Some(B::ChariotCeltic);
    }
    if has("germanic berserker") {
        return Some(B::BerserkerZ3);
    }
    if has("germanic warrior") {
        return Some(B::GermanWarrior);
    }
    if has("mycenaean warrior") {
        return Some(B::MycenaeanWarrior);
    }
    if has("mycenaean chariot") {
        return Some(B::ChariotMycenaean);
    }
    if has("sherden warrior") {
        return Some(B::Sherden);
    }
    if has("shang halberdier") {
        return Some(B::ShangHalberdier);
    }
    if has("shang chariot") {
        return Some(B::ChariotShang);
    }
    if has("akkadian archer") {
        return Some(B::AkkadianArcher);
    }
    // ZULU
    if has("impi") {
        return Some(B::Impi);
    }
    if has("oszczepnik zulu") || has("izijula") || has("zulu javelineer") || has("isijula") {
        return Some(B::ZuluJavelineer);
    }
    // SUMER
    if has("wlocznik sumeryjski") || has("sumerian spearman") {
        return Some(B::SumerianSpearman);
    }
    if has("lucznik sumeryjski") || has("sumerian archer") {
        return Some(B::SumerianArcher);
    }
    if has("rydwan sumeryjski") || has("sumerian chariot") {
        return Some(B::SumerianChariot);
    }
    // EGIPT
    if has("lucznik egipski") || has("egyptian archer") {
        return Some(B::EgyptianArcher);
    }
    if has("lucznik nubijski") || has("nubian archer") {
        return Some(B::NubianArcherOpus5);
    }
    if has("wojownik z khopesh") || has("khopesh warrior") {
        return Some(B::KhopeshWarrior);
    }
    if has("rydwan egipski") || has("egyptian chariot") {
        return Some(B::EgyptianChariot);
    }
    // INKA
    if has("oszczepnik") && has("estolic") {
        return Some(B::InkaJavelineer);
    }
    if has("javelineer") && has("estolica") {
        return Some(B::InkaJavelineer);
    }
    if has("procarz") && has("huarac") {
        return Some(B::InkaSlinger);
    }
    if has("slinger") && has("huara") {
        return Some(B::InkaSlinger);
    }
    // CHINY
    if has("jezdziec chinski") || has("chinese cavalry") {
        return Some(B::ChineseCavalry);
    }
    if has("kusznik") || has("crossbowman") {
        return Some(B::Crossbowman);
    }
    // KAMIEN / BRAZ base units (exact names)
    if is("wojownik") || is("warrior") {
        return Some(B::WojownikOpus5);
    }
    if is("wlocznik") || is("spearman") {
        return Some(B::WlocznikBrazOpus5);
    }
    if is("wojownik z mieczem i tarcza") || is("swordsman") {
        return Some(B::MiecznikBrazOpus5);
    }
    if is("procarz") || is("slinger") {
        return Some(B::ProcarzBrazOpus5);
    }
    if is("rydwan (woly)") || is("rydwan woly") || is("ox chariot") {
        return Some(B::RydwanWolyBrazOpus5);
    }
    // ASYRIA / SLOWIANIE / KONNICA
    if has("konnica lancowa asyryjsk") || has("assyrian lancer") {
        return Some(B::ZelazoKonnicaLancowaAsyryjska);
    }
    if has("konnica lucznicza asyryjsk") || has("assyrian horse archer") {
        return Some(B::ZelazoKonnicaLuczniczaAsyryjska);
    }
    if has("jezdziec z oszczepami") || has("slavic javelin cavalry") {
        return Some(B::ZelazoJezdziecOszczepami);
    }
    if is("konnica") || is("horseman") {
        return Some(B::KonnicaBrazOpus5);
    }
    if is("rydwan konny") || is("war chariot") {
        return Some(B::RydwanKonnyBrazOpus5);
    }
    // MACHINY
    if has("taran okuty") || has("bronze-shod ram") || has("bronze shod ram") {
        return Some(B::TaranOkutyOpus5);
    }
    if has("taran") || has("battering ram") {
        return Some(B::BatteringRam);
    }
    if has("katapulta") || has("catapult") {
        return Some(B::Catapult);
    }
    if (has("wieza") && has("oblezn")) || has("siege tower") {
        return Some(B::SiegeTower);
    }
    // RZYM / LUDY MORZA
    if has("wojownik tyrrenski")
        || has("tyrrenski")
        || has("tyrrhenian warrior")
        || has("tyrrhenian")
    {
        return Some(B::Tyrrhenian);
    }
    if has("wojownik szekelesz") || has("szekelesz") || has("shekelesh warrior") || has("shekelesh")
    {
        return Some(B::Shekelesh);
    }
    if has("hastati") {
        return Some(B::HastatiOpus5);
    }
    if has("lucznik asyryjski") || has("assyrian archer") {
        return Some(B::AssyrianArcher);
    }
    if has("piechota hetycka") || has("hittite infantry") {
        return Some(B::PiechotaHetycka);
    }
    if has("gwardia ishtar") || has("ishtar guard") {
        return Some(B::GwardiaIshtar);
    }
    if has("wojownik babilonski") || has("babylonian warrior") {
        return Some(B::WojownikBabilonski);
    }
    if has("wojownik fenicki") || has("phoenician warrior") {
        return Some(B::WojownikFenicki);
    }
    if has("straznik bram") || has("gatekeeper") || (has("harap") && has("straznik")) {
        return Some(B::StraznikHarappy);
    }
    if has("piechota induska") || has("indus infantry") || has("indusk") {
        return Some(B::PiechotaInduska);
    }
    if has("legion rzymski") || has("roman legion") {
        return Some(B::LegionRzymski);
    }
    if has("gwardzista z champi") || has("champi guard") || (has("champi") && has("gwardz")) {
        return Some(B::GwardzistaChampi);
    }
    if has("legion") && !has("hastati") {
        return None; // explicit fall-through to the 'legionista' category
    }
    // INKA bespoke
    if has("wojownik z maczuga") || has("chaska") || has("mace warrior") {
        return Some(B::MaceWarrior);
    }
    if has("wojownik z toporem")
        && !has("szekelesz")
        && !has("mykensk")
        && !has("germansk")
        && !has("celtyck")
    {
        return Some(B::AxeWarriorInka);
    }
    if has("hieros") || has("swiety zastep") || has("sacred band") {
        return Some(B::HierosLochos);
    }
    if has("medzaj") || has("medjay") || has("gwardia faraona") {
        return Some(B::Medjay);
    }
    if has("gwardia krolewska sumeru") || has("sumerian royal guard") || has("qurubuti") {
        return Some(B::SumerianRoyalGuard);
    }
    if has("hu ben wei") || has("tiger guard") || has("gwardia tygrysa") {
        return Some(B::HuBenWei);
    }
    if has("uthulwana") || has("white shields") || has("biale tarcze") {
        return Some(B::UThulwana);
    }
    if (has("krolewska gwardia") || has("royal guard")) && !has("sumer") {
        return Some(B::InkaRoyalGuard);
    }
    // ZELAZO
    if has("gwardia hetycka") || has("hittite guard") {
        return Some(B::GwardiaHetycka);
    }
    if has("piechota neobabilonska") || has("neo-babylonian infantry") {
        return Some(B::PiechotaNeobabilonska);
    }
    if has("mur tarcz") || has("shield wall") {
        return Some(B::MurTarcz);
    }
    if has("garnizon harappy") || has("harappan garrison") {
        return Some(B::GarnizonHarappy);
    }
    if has("tyrski miecznik") || has("tyrian swordsman") {
        return Some(B::TyrskiMiecznik);
    }
    if has("gwardia tyrensk") || has("tyre guard") {
        return Some(B::GwardiaTyrenska);
    }
    if has("zelaznym khopesh") || has("iron khopesh") {
        return Some(B::ZelaznyKhopesh);
    }
    if has("thorakites") {
        return Some(B::Thorakites);
    }
    if has("druzynnik") || has("druzhinnik") {
        return Some(B::Druzynnik);
    }
    if has("ibutho") || has("butho") {
        return Some(B::IButho);
    }
    if has("miecznik galijski") || has("gallic swordsman") {
        return Some(B::MiecznikGalijski);
    }
    None
}

/// What a unit renders as: a builder plus the culture overlay of
/// `applyCultureOverrides` (always [`Culture::Neutral`] when the overlay is a
/// no-op, so equal geometry ⇔ equal id).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ModelId {
    /// Builder.
    pub base: Base,
    /// Additive culture overlay ([`Culture::Neutral`] = none).
    pub culture: Culture,
}

impl ModelId {
    /// A plain builder, no overlay.
    #[must_use]
    pub const fn of(base: Base) -> Self {
        Self {
            base,
            culture: Culture::Neutral,
        }
    }
}

/// `buildSuperUnit(culture, owner, name)` (`units.ts:4807-4825`).
#[must_use]
pub fn super_unit(culture: Culture, name: &str) -> ModelId {
    ModelId::of(match culture {
        Culture::Rzym => {
            if norm_name(name).contains("triari") {
                Base::Triari
            } else {
                Base::SuperRome
            }
        }
        Culture::Grecja => Base::SuperGreece,
        Culture::Germanie => Base::GermanSuper,
        _ => Base::CatSuper,
    })
}

/// `buildCategoryModel(category)` + `applyCultureOverrides(…, cultureFromName)`
/// as a [`ModelId`] (canonical: no-op overlays become neutral).
#[must_use]
pub fn category_route(category: &str, culture: Culture) -> ModelId {
    let cat = UnitCategory::from_label(category);
    let culture = if cat.skips_culture_overrides() || culture.is_noop_overlay() {
        Culture::Neutral
    } else {
        culture
    };
    ModelId {
        base: cat.base(),
        culture,
    }
}

/// The web `buildUnitModel(category, owner, unitName?)` routing
/// (`units.ts:1086-1126`), ported 1:1 **including** its name dependence
/// (D-MOD-9 legacy). Use [`model_for`] in the game.
#[must_use]
pub fn legacy_route(category: &str, unit_name: Option<&str>) -> ModelId {
    let name = unit_name.filter(|s| !s.is_empty());
    if category == "super" {
        if let Some(nm) = name {
            let n = norm_name(nm);
            if super_has_named_model(&n) {
                if let Some(b) = named_rule(&n) {
                    return ModelId::of(b);
                }
            }
            return super_unit(culture_from_name(Some(nm)), nm);
        }
    }
    if let Some(nm) = name {
        if let Some(b) = named_rule(&norm_name(nm)) {
            return ModelId::of(b);
        }
    }
    let culture = name.map_or(Culture::Neutral, |nm| culture_from_name(Some(nm)));
    category_route(category, culture)
}

/// Builds a [`ModelId`].
///
/// # Errors
/// [`NotYetPorted`] when the builder belongs to a package not ported yet.
pub fn build_model(id: ModelId, owner: u32) -> Result<UnitModel, NotYetPorted> {
    let mut m = build_base(id.base, owner)?;
    if id.culture != Culture::Neutral {
        // The id is canonical, so the overlay applies: use a foot category
        // that does not skip (the overlay itself ignores the category).
        apply_culture_overrides(&mut m, UnitCategory::Topor, id.culture);
    }
    Ok(m)
}

// ------------------------------------------------------------ D-MOD-9 = A

/// Unit type id: the `Jednostka` value of `units.json` (or a civilian id).
/// Deliberately not a display name; there is no EN → type map.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UnitTypeId(String);

impl UnitTypeId {
    /// Wraps a type id.
    #[must_use]
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    /// The id.
    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// `UnitTypeId → ModelId`, 77 rows: the 75 `units.json` records (PL
/// `Jednostka`) + `Osadnik`, `Robotnik`. Generated once from the web PL
/// path (`P4-4-MODEL-CATALOG.md` §2.1b); `tests/unit_core_model_rule.rs`
/// checks every row against [`legacy_route`] on the web category and PL name,
/// and against the web model signatures.
pub const UNIT_MODEL_TABLE: [(&str, Base); 77] = [
    ("Wojownik", Base::WojownikOpus5),
    ("Procarz", Base::ProcarzBrazOpus5),
    ("Oszczepnik", Base::OszczepnikOpus5),
    ("\u{141}ucznik", Base::LucznikOpus5),
    ("Zwiadowca", Base::ZwiadowcaOpus5),
    ("W\u{142}\u{f3}cznik", Base::WlocznikBrazOpus5),
    ("Wojownik z mieczem i tarcz\u{105}", Base::MiecznikBrazOpus5),
    ("Rydwan (wo\u{142}y)", Base::RydwanWolyBrazOpus5),
    ("Konnica", Base::KonnicaBrazOpus5),
    ("Galera", Base::Galera),
    ("Falanga", Base::Falangita),
    (
        "Hieros Lochos (\u{15a}wi\u{119}ty Zast\u{119}p)",
        Base::SuperGreece,
    ),
    ("Hastati", Base::HastatiOpus5),
    ("Triari", Base::Triari),
    ("Je\u{17a}dziec chi\u{144}ski", Base::ChineseCavalry),
    ("Hu Ben Wei (Gwardia Tygrysa)", Base::HuBenWei),
    ("Impi", Base::Impi),
    ("Oszczepnik Zulu (Izijula)", Base::ZuluJavelineer),
    ("uThulwana (Bia\u{142}e Tarcze)", Base::UThulwana),
    ("Wojownik z maczug\u{105} (Chaska)", Base::MaceWarrior),
    ("Wojownik z toporem", Base::AxeWarriorInka),
    ("Procarz (Huaracoc)", Base::InkaSlinger),
    ("Oszczepnik (Est\u{f3}lica)", Base::InkaJavelineer),
    ("Kr\u{f3}lewska Gwardia", Base::InkaRoyalGuard),
    ("Rydwan konny", Base::RydwanKonnyBrazOpus5),
    ("\u{141}ucznik egipski", Base::EgyptianArcher),
    ("Rydwan egipski", Base::EgyptianChariot),
    ("Wojownik z khopesh", Base::KhopeshWarrior),
    ("Med\u{17c}aj (Gwardia Faraona)", Base::Medjay),
    ("\u{141}ucznik nubijski", Base::NubianArcherOpus5),
    ("\u{141}ucznik sumeryjski", Base::SumerianArcher),
    ("Rydwan sumeryjski", Base::SumerianChariot),
    ("W\u{142}\u{f3}cznik sumeryjski", Base::SumerianSpearman),
    ("Gwardia Kr\u{f3}lewska Sumeru", Base::SumerianRoyalGuard),
    ("Wojownik myke\u{144}ski", Base::MycenaeanWarrior),
    ("Rydwan myke\u{144}ski", Base::ChariotMycenaean),
    ("Wojownik Sherden", Base::Sherden),
    ("Halabardnik Shang", Base::ShangHalberdier),
    ("Rydwan Shang", Base::ChariotShang),
    ("\u{141}ucznik akadyjski", Base::AkkadianArcher),
    ("Gaesatae", Base::Gaesatae),
    ("Soldurii", Base::Soldurii),
    ("Rydwan celtycki", Base::ChariotCeltic),
    ("Wojownik germa\u{144}ski", Base::GermanSuper),
    ("Berserker germa\u{144}ski", Base::BerserkerZ3),
    ("Taran", Base::BatteringRam),
    ("Taran okuty", Base::TaranOkutyOpus5),
    ("Katapulta", Base::Catapult),
    ("Wie\u{17c}a obl\u{119}\u{17c}nicza", Base::SiegeTower),
    ("Wojownik tyrre\u{144}ski", Base::Tyrrhenian),
    ("Wojownik szekelesz", Base::Shekelesh),
    (
        "Konnica lancowa asyryjska",
        Base::ZelazoKonnicaLancowaAsyryjska,
    ),
    (
        "Konnica \u{142}ucznicza asyryjska",
        Base::ZelazoKonnicaLuczniczaAsyryjska,
    ),
    ("\u{141}ucznik asyryjski", Base::AssyrianArcher),
    ("Dru\u{17c}ynnik", Base::Druzynnik),
    (
        "Je\u{17a}dziec z oszczepami",
        Base::ZelazoJezdziecOszczepami,
    ),
    ("Stra\u{17c}nik bram Harappy", Base::StraznikHarappy),
    ("Piechota induska", Base::PiechotaInduska),
    ("Garnizon Harappy", Base::GarnizonHarappy),
    ("Rydwan Kapadokijski", Base::RydwanKapadokijskiOpus5),
    ("Piechota hetycka", Base::PiechotaHetycka),
    ("Gwardia hetycka", Base::GwardiaHetycka),
    ("Gwardia Ishtar", Base::GwardiaIshtar),
    ("Wojownik babilo\u{144}ski", Base::WojownikBabilonski),
    ("Piechota neobabilo\u{144}ska", Base::PiechotaNeobabilonska),
    ("Tyrski miecznik", Base::TyrskiMiecznik),
    ("Wojownik fenicki", Base::WojownikFenicki),
    ("Gwardia Tyre\u{144}ska", Base::GwardiaTyrenska),
    ("Thorakites", Base::Thorakites),
    ("Evocati", Base::SuperRome),
    ("iButho z iklwa", Base::IButho),
    ("Gwardzista z champi", Base::GwardzistaChampi),
    ("Wojownik z \u{17c}elaznym khopesh", Base::ZelaznyKhopesh),
    ("Mur tarcz (Sargonid)", Base::MurTarcz),
    ("Miecznik galijski", Base::MiecznikGalijski),
    ("Osadnik", Base::CatOsadnik),
    ("Robotnik", Base::CatRobotnik),
];

/// D-MOD-9 = A: the model of a unit type. `None` for a type outside the
/// table (a data/test error; see [`model_for_or_category`] for runtime).
#[must_use]
pub fn model_for(unit_type: &UnitTypeId) -> Option<ModelId> {
    UNIT_MODEL_TABLE
        .iter()
        .find(|(id, _)| *id == unit_type.as_str())
        .map(|&(_, b)| ModelId::of(b))
}

/// Warning returned when a unit type is missing from [`UNIT_MODEL_TABLE`]
/// (the caller logs it; `D-NM-14`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnknownUnitType {
    /// The unknown id.
    pub unit_type: UnitTypeId,
    /// Category used for the fallback.
    pub category: String,
}

/// Runtime variant of [`model_for`]: unknown types fall back to the generic
/// category model (no culture overlay) and return a warning — never a
/// silent name-based guess.
#[must_use]
pub fn model_for_or_category(
    unit_type: &UnitTypeId,
    category: &str,
) -> (ModelId, Option<UnknownUnitType>) {
    model_for(unit_type).map_or_else(
        || {
            (
                category_route(category, Culture::Neutral),
                Some(UnknownUnitType {
                    unit_type: unit_type.clone(),
                    category: category.to_owned(),
                }),
            )
        },
        |id| (id, None),
    )
}
