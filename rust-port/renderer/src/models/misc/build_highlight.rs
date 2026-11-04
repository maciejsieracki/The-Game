//! `render/buildHighlight.ts` (web `origin/main`, new after pin `edb8fb56`;
//! REPIN-3D-B1, `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §9): shared visual
//! constants and the eligibility filter of the map improvement-build
//! highlights.

use std::collections::HashSet;

/// `MAP_HEX_HIGHLIGHT_BASE_OPACITY` (`:2`).
pub const MAP_HEX_HIGHLIGHT_BASE_OPACITY: f64 = 0.35;
/// `MINE_ELIGIBLE_BASE_OPACITY` (`:3`).
pub const MINE_ELIGIBLE_BASE_OPACITY: f64 = 0.3;
/// `IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS` (`:4`).
pub const IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS: f64 = 1.2;
/// `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY` (`:7-8`).
pub const IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY: f64 =
    MAP_HEX_HIGHLIGHT_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;
/// `MINE_BUILD_HIGHLIGHT_OPACITY` (`:9-10`).
pub const MINE_BUILD_HIGHLIGHT_OPACITY: f64 =
    MINE_ELIGIBLE_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;

/// `BuildHighlightHex` (`:12-15`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BuildHighlightHex {
    /// `q`.
    pub q: f64,
    /// `r`.
    pub r: f64,
}

/// JS template-literal `${n}` of a hex coordinate (`Number.prototype.toString`,
/// radix 10). Rust `{}` / `{:e}` of `f64` are shortest round-trip like V8;
/// they differ only in the notation choice, handled here: `-0` → `"0"`,
/// exponent form for `|n| < 1e-6` and `|n| >= 1e21` (`e+` sign as in JS).
#[must_use]
pub fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();
    }
    if n == 0.0 {
        return "0".into();
    }
    let a = n.abs();
    if (1e-6..1e21).contains(&a) {
        return format!("{n}");
    }
    let s = format!("{n:e}");
    match s.split_once('e') {
        Some((m, e)) if !e.starts_with('-') => format!("{m}e+{e}"),
        _ => s,
    }
}

/// `filterBuildHighlightHexes(improvementKey, hexes, pendingUndoKeys)`
/// (`:22-28`): drops every hex whose `"${q},${r}:${improvementKey}"` is in
/// `pending_undo_keys`; order of the rest is kept (`Array.prototype.filter`).
#[must_use]
pub fn filter_build_highlight_hexes(
    improvement_key: &str,
    hexes: &[BuildHighlightHex],
    pending_undo_keys: &HashSet<String>,
) -> Vec<BuildHighlightHex> {
    hexes
        .iter()
        .filter(|h| {
            let k = format!("{},{}:{improvement_key}", js_num(h.q), js_num(h.r));
            !pending_undo_keys.contains(&k)
        })
        .copied()
        .collect()
}
