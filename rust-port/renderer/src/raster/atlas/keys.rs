//! Content keys of the cached canvas textures — ports of the web key
//! functions (pin `edb8fb56`; `plik:linia` = `gra/src/render/…`).
//!
//! A key changes exactly when the painted pixels change, so a cache lookup
//! by key never returns a stale texture (the web's invariant, spelled out at
//! `cityMapStatChip.ts:974-997`). Every string operation reproduces the JS
//! semantics bit for bit — `String.prototype.trim`, `toLowerCase`,
//! `Math.floor/round/max`, `Number#toString`, `toFixed` — verified against
//! vectors produced by running the web functions
//! (`tests/fixtures/atlas/atlas_keys.json`, `tests/atlas_keys.rs`).

use crate::core::jsnum::js_to_fixed;
use crate::models::cities::model::js_number_to_string;
use crate::pick::hex::js_round;

/// `String.prototype.trim` (ECMA-262 `TrimString`): strips `WhiteSpace`
/// (TAB, VT, FF, SP, NBSP, ZWNBSP U+FEFF and every `Zs` code point) and
/// `LineTerminator` (LF, CR, U+2028, U+2029) from both ends.
///
/// Differs from [`str::trim`] (Unicode `White_Space`): JS strips U+FEFF and
/// keeps U+0085 (NEL); Rust does the opposite.
#[must_use]
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(is_js_whitespace)
}

/// `true` for the code points `String.prototype.trim` removes.
#[must_use]
pub const fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'
            | '\u{000B}'
            | '\u{000C}'
            | '\u{0020}'
            | '\u{00A0}'
            | '\u{FEFF}'
            | '\u{000A}'
            | '\u{000D}'
            | '\u{2028}'
            | '\u{2029}'
            // Zs (Unicode 15/16): SPACE and NBSP above, plus:
            | '\u{1680}'
            | '\u{2000}'..='\u{200A}' | '\u{202F}' | '\u{205F}' | '\u{3000}'
    )
}

/// `String.prototype.toLowerCase` — the full Unicode lowercase mapping
/// (`SpecialCasing` included, final sigma by context). Rust's
/// [`str::to_lowercase`] implements the same algorithm; equality with V8 is
/// checked on the vector set (Greek final sigma, `İ`, `Ǆ`, `ẞ`, `ﬀ`, `K`).
/// Unicode versions of V8 and of `core` may differ for code points assigned
/// later; the game's identifiers (`civs.json`) are ASCII/Polish.
#[must_use]
pub fn js_to_lower_case(s: &str) -> String {
    s.to_lowercase()
}

/// `(x || '')` for an optional string: `None` and `""` both give `""`.
fn or_empty(x: Option<&str>) -> &str {
    x.unwrap_or("")
}

/// `Math.max(1, Math.floor(x) || 1)` — the population / count normalisation
/// (`cityMapStatChip.ts:967`, `:970`, `:788`). `NaN`, `±0` → 1; negatives →
/// 1; `+∞` stays `+∞`.
#[must_use]
pub fn js_floor_at_least_one(x: f64) -> f64 {
    let f = x.floor();
    let f = if f.is_nan() || f == 0.0 { 1.0 } else { f };
    f.max(1.0)
}

/// `Math.max(1, Math.round(x) || 1)` — the era normalisation
/// (`cityMapStatChip.ts:608`, `:987`; `unitOwnerEmblem.ts:310`).
#[must_use]
pub fn js_round_at_least_one(x: f64) -> f64 {
    let r = js_round(x);
    let r = if r.is_nan() || r == 0.0 { 1.0 } else { r };
    r.max(1.0)
}

/// `formatCityGrowthPercentLabel(pct, starving)` (`cityMapStatChip.ts:744-750`):
/// `—` when starving; otherwise `pct` rounded to 0.1 (`Math.round(x·10)/10`,
/// non-finite → 0), integer values without decimals, others with one decimal
/// and a decimal comma, a leading U+2212 for negatives, then `%`.
#[must_use]
pub fn format_city_growth_percent_label(pct: f64, starving: bool) -> String {
    if starving {
        return "\u{2014}".to_owned();
    }
    let x = if pct.is_finite() { pct } else { 0.0 };
    let rounded = js_round(x * 10.0) / 10.0;
    let abs = rounded.abs();
    let digits = if abs.is_finite() && abs.fract() == 0.0 {
        js_number_to_string(abs)
    } else {
        js_to_fixed(abs, 1).replacen('.', ",", 1)
    };
    let sign = if rounded < 0.0 { "\u{2212}" } else { "" };
    format!("{sign}{digits}%")
}

/// `cityBadgeLodSegment(lodLevel)` (`cityMapStatChip.ts:1015-1017`): exactly
/// `1` or `2` stays, anything else (missing, `NaN`, `1.5`, `3`) is `0`.
#[must_use]
#[allow(clippy::float_cmp)] // `lodLevel === 1 || lodLevel === 2`
pub fn city_badge_lod_segment(lod_level: Option<f64>) -> u8 {
    let l = lod_level.unwrap_or(0.0);
    if l == 1.0 {
        1
    } else if l == 2.0 {
        2
    } else {
        0
    }
}

/// The LOD suffix of a badge key, `|l<segment>` — what
/// `disposeCityMapBadgeTexturesForOtherLod` keeps (`cityMapStatChip.ts:1038`).
#[must_use]
pub fn city_badge_lod_suffix(lod_level: Option<f64>) -> String {
    format!("|l{}", city_badge_lod_segment(lod_level))
}

/// The key-relevant part of `CityMapBadgeInput` (`cityMapStatChip.ts:17-78`).
///
/// Optional JS fields are `Option`s: `undefined` and `null` behave the same
/// in every use (`!= null`, `??`, `||`, `=== 1`). Booleans are the JS
/// truthiness the key reads (`a.prodActive ? …`, `=== true`).
#[derive(Clone, Debug, Default, PartialEq)]
pub struct CityMapBadgeInput {
    /// `cityName`.
    pub city_name: String,
    /// `population` (a JS number).
    pub population: f64,
    /// `defenseTier` (0 | 1 | 2).
    pub defense_tier: u8,
    /// `civIconId`.
    pub civ_icon_id: String,
    /// `ownerColor` — painted, NOT part of the key (web behaviour).
    pub owner_color: Option<u32>,
    /// `prodActive`.
    pub prod_active: bool,
    /// `prodKind` (`'budynek' | 'jednostka'`; `None` → `'b'` in the key).
    pub prod_kind: Option<String>,
    /// `prodId`.
    pub prod_id: Option<String>,
    /// `growthPercent`.
    pub growth_percent: Option<f64>,
    /// `growthStarving === true`.
    pub growth_starving: bool,
    /// `resourceWarning`.
    pub resource_warning: bool,
    /// `hoverExpanded`.
    pub hover_expanded: bool,
    /// `prodCategoryLabel` — painted, NOT part of the key (web behaviour).
    pub prod_category_label: Option<String>,
    /// `prodItemName` — painted, NOT part of the key (web behaviour).
    pub prod_item_name: Option<String>,
    /// `prodPaused` — painted, NOT part of the key (web behaviour).
    pub prod_paused: bool,
    /// `isCityState`.
    pub is_city_state: bool,
    /// `era`.
    pub era: Option<f64>,
    /// `isCapital`.
    pub is_capital: bool,
    /// `lodLevel`.
    pub lod_level: Option<f64>,
}

/// `cityMapBadgeKey(input)` (`cityMapStatChip.ts:962-1012`, object overload):
/// `name|pop|d…|c…|p…|g…|w…|h…|cs…|e…|k…|l…`. The `l…` segment is last
/// (the LOD purge matches it as a suffix).
///
/// Like the web, the key ignores `ownerColor`, `prodCategoryLabel`,
/// `prodItemName` and `prodPaused` even though they are painted (hover row,
/// medallion colour) — a known web property, kept for parity (P4-31 §3).
#[must_use]
pub fn city_map_badge_key(a: &CityMapBadgeInput) -> String {
    let pop = js_floor_at_least_one(a.population);
    let prod = if a.prod_active {
        format!(
            "{}:{}",
            a.prod_kind.as_deref().unwrap_or("b"),
            js_trim(or_empty(a.prod_id.as_deref()))
        )
    } else {
        "-".to_owned()
    };
    let growth = match a.growth_percent {
        Some(g) => format!(
            "g{}",
            format_city_growth_percent_label(g, a.growth_starving)
        ),
        None => "g-".to_owned(),
    };
    let cs = if a.is_city_state { "cs1" } else { "cs0" };
    let cap = if a.is_capital { "k1" } else { "k0" };
    let era = match a.era {
        Some(e) => format!("e{}", js_number_to_string(js_round_at_least_one(e))),
        None => "e-".to_owned(),
    };
    let lod = format!("l{}", city_badge_lod_segment(a.lod_level));
    [
        js_trim(&a.city_name).to_owned(),
        js_number_to_string(pop),
        format!("d{}", a.defense_tier),
        format!("c{}", js_to_lower_case(js_trim(&a.civ_icon_id))),
        format!("p{prod}"),
        growth,
        format!("w{}", u8::from(a.resource_warning)),
        format!("h{}", u8::from(a.hover_expanded)),
        cs.to_owned(),
        era,
        cap.to_owned(),
        lod,
    ]
    .join("|")
}

/// `cityMapBadgeKey(cityName, population)` (legacy overload,
/// `cityMapStatChip.ts:966-969`): `name|pop`, `population ?? 1`.
#[must_use]
pub fn city_map_badge_key_legacy(city_name: &str, population: Option<f64>) -> String {
    let pop = js_floor_at_least_one(population.unwrap_or(1.0));
    format!("{}|{}", js_trim(city_name), js_number_to_string(pop))
}

/// `civSigilCacheKey(civIconId)` (`cityMapStatChip.ts:583-585`): trimmed,
/// lower-cased, `unknown` when empty.
#[must_use]
pub fn civ_sigil_cache_key(civ_icon_id: &str) -> String {
    let k = js_to_lower_case(js_trim(civ_icon_id));
    if k.is_empty() {
        "unknown".to_owned()
    } else {
        k
    }
}

/// `leaderPortraitCacheKey(civIconId, era)` (`cityMapStatChip.ts:607-610`):
/// `<sigil key>:<max(1, round(era) || 1)>`.
#[must_use]
pub fn leader_portrait_cache_key(civ_icon_id: &str, era: f64) -> String {
    format!(
        "{}:{}",
        civ_sigil_cache_key(civ_icon_id),
        js_number_to_string(js_round_at_least_one(era))
    )
}

/// `prodIconCacheKey(kind, id)` (`cityMapStatChip.ts:631-633`): `kind:id`
/// with `id` trimmed (`None` → empty).
#[must_use]
pub fn prod_icon_cache_key(kind: &str, id: Option<&str>) -> String {
    format!("{kind}:{}", js_trim(or_empty(id)))
}

/// `UnitOwnerEmblemContext` (`unitOwnerEmblem.ts:90-99`).
#[derive(Clone, Debug, Default, PartialEq)]
pub struct OwnerEmblemContext {
    /// `civId` (`null` = unknown).
    pub civ_id: Option<String>,
    /// `era` (a JS number).
    pub era: f64,
    /// `isCityState`.
    pub is_city_state: bool,
    /// `isBarbarian` (checked before `isCityState`).
    pub is_barbarian: bool,
}

/// `emblemKey(ctx)` / exported `ownerEmblemKey` (`unitOwnerEmblem.ts:306-312`,
/// `:426-428`): `barb`, `cs:<civ>` or `civ:<civ>:<era>` — one texture per
/// T10 variant.
#[must_use]
pub fn owner_emblem_key(ctx: &OwnerEmblemContext) -> String {
    if ctx.is_barbarian {
        return "barb".to_owned();
    }
    let civ = js_to_lower_case(js_trim(or_empty(ctx.civ_id.as_deref())));
    let civ = if civ.is_empty() {
        "unknown".to_owned()
    } else {
        civ
    };
    if ctx.is_city_state {
        return format!("cs:{civ}");
    }
    format!(
        "civ:{civ}:{}",
        js_number_to_string(js_round_at_least_one(ctx.era))
    )
}

/// `workerSpriteCacheKey(ownerId, playerOwnerId)` (`workerFieldOverlay.ts:58-60`):
/// `<owner>|ring:<owner === player ? 1 : 0>` (T12).
#[must_use]
#[allow(clippy::float_cmp)] // `ownerId === playerOwnerId`
pub fn worker_sprite_cache_key(owner_id: f64, player_owner_id: f64) -> String {
    format!(
        "{}|ring:{}",
        js_number_to_string(owner_id),
        u8::from(owner_id == player_owner_id)
    )
}

/// Upgrade-badge path of T11 (`unitUpgradeBadges.ts:240`, `BadgePath`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum BadgePath {
    /// `'armor'`.
    Armor,
    /// `'soft'`.
    Soft,
}

impl BadgePath {
    /// The web string.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Armor => "armor",
            Self::Soft => "soft",
        }
    }
}

/// T11 key `${path}:${level}` (`unitUpgradeBadges.ts:312`), level 1–3.
#[must_use]
pub fn upgrade_badge_key(path: BadgePath, level: u8) -> String {
    format!("{}:{level}", path.as_str())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn trim_differs_from_rust_on_feff_and_nel() {
        assert_eq!(js_trim("\u{FEFF}a\u{FEFF}"), "a");
        assert_eq!(js_trim("\u{0085}a\u{0085}"), "\u{0085}a\u{0085}");
        assert_eq!(js_trim("\u{200B}a"), "\u{200B}a"); // ZWSP is not Zs
        assert_eq!(js_trim("\u{3000}\t a \n\u{2028}"), "a");
    }

    #[test]
    fn growth_label_basics() {
        assert_eq!(
            format_city_growth_percent_label(-10.55, false),
            "\u{2212}10,5%"
        );
        assert_eq!(format_city_growth_percent_label(-0.04, false), "0%");
        assert_eq!(format_city_growth_percent_label(3.0, false), "3%");
        assert_eq!(format_city_growth_percent_label(1e21, false), "1e+21%");
        assert_eq!(format_city_growth_percent_label(f64::NAN, false), "0%");
        assert_eq!(format_city_growth_percent_label(5.0, true), "\u{2014}");
    }

    #[test]
    fn badge_key_default_shape() {
        let a = CityMapBadgeInput {
            city_name: "Ateny".into(),
            population: 3.0,
            civ_icon_id: "grecy".into(),
            ..CityMapBadgeInput::default()
        };
        assert_eq!(
            city_map_badge_key(&a),
            "Ateny|3|d0|cgrecy|p-|g-|w0|h0|cs0|e-|k0|l0"
        );
    }
}
