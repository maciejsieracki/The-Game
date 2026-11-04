//! REPIN-3D batch B1 (R-RUSTPORT-REPIN-3D-B-Q1, document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §9): map-render constants of the
//! CURRENT web (`origin/main`) — `render/buildHighlight.ts` (new: constants +
//! `filterBuildHighlightHexes`), `rangeOverlay.ts` `MINE_ELIGIBLE_TINT_OPACITY`
//! 0,30 → 0,36, `resources.ts` `RESOURCE_MODEL_SCALE` through
//! `userData.depositDisplayScale`, `improvements.ts` `FORT_OUTPOST_MODEL_SCALE`
//! — against vectors produced by RUNNING the web (`tests/repin3d_fixtures/gen_b1.ts`).
//! Full model graphs of the fort sectors and the deposit overlays are covered by
//! the regenerated `tests/fixtures/improvements/` (`improvements_web_parity`).

#![allow(clippy::float_cmp)]

mod repin3d_common;

use std::collections::HashSet;

use civ_renderer::models::improvements::registry::{
    FORT_OUTPOST_BASE_SCALE, FORT_OUTPOST_MODEL_SCALE,
};
use civ_renderer::models::improvements::{
    build_styled_resource_overlay, Nakladka, RESOURCE_MODEL_SCALE, SECTOR_R_ELEVATED,
};
use civ_renderer::models::misc::build_highlight::{
    filter_build_highlight_hexes, js_num, BuildHighlightHex,
    IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
    MAP_HEX_HIGHLIGHT_BASE_OPACITY, MINE_BUILD_HIGHLIGHT_OPACITY, MINE_ELIGIBLE_BASE_OPACITY,
};
use civ_renderer::models::misc::range::{MINE_ELIGIBLE_STYLE, MINE_ELIGIBLE_TINT_OPACITY};
use civ_renderer::scene::{UserValue, ROOT};
use repin3d_common::{hx, load, Cmp};

fn h1(j: &repin3d_common::Json) -> f64 {
    hx(j.str())[0]
}

#[test]
fn constants_match_the_web_bit_for_bit() {
    let v = load("b1.json");
    let c = v.get("constants");
    let mut cmp = Cmp::default();
    for (name, rust) in [
        (
            "MAP_HEX_HIGHLIGHT_BASE_OPACITY",
            MAP_HEX_HIGHLIGHT_BASE_OPACITY,
        ),
        ("MINE_ELIGIBLE_BASE_OPACITY", MINE_ELIGIBLE_BASE_OPACITY),
        (
            "IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS",
            IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS,
        ),
        (
            "IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY",
            IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
        ),
        ("MINE_BUILD_HIGHLIGHT_OPACITY", MINE_BUILD_HIGHLIGHT_OPACITY),
        ("MINE_ELIGIBLE_TINT_OPACITY", MINE_ELIGIBLE_TINT_OPACITY),
        (
            "MINE_ELIGIBLE_STYLE_tintOpacity",
            MINE_ELIGIBLE_STYLE.tint_opacity,
        ),
        ("RESOURCE_MODEL_SCALE", RESOURCE_MODEL_SCALE),
        ("FORT_OUTPOST_MODEL_SCALE", FORT_OUTPOST_MODEL_SCALE),
        ("SECTOR_R_ELEVATED", SECTOR_R_ELEVATED),
    ] {
        cmp.f(name, rust, h1(c.get(name)));
    }
    assert_eq!(c.obj().len(), 10, "constant count");
    // the pin factor of the fort sector (0,5) times the new ×2 = 1 (web `:507`)
    cmp.f(
        "fort factor",
        FORT_OUTPOST_BASE_SCALE * FORT_OUTPOST_MODEL_SCALE,
        1.0,
    );
    cmp.finish("b1 constants");
    eprintln!("b1 constants: scalars {}", cmp.scalars);
}

#[test]
fn filter_build_highlight_hexes_matches_the_web() {
    let v = load("b1.json");
    let mut cmp = Cmp::default();
    let cases = v.get("filter").arr();
    assert_eq!(cases.len(), 14, "filter cases");
    for case in cases {
        let name = case.get("name").str();
        let key = case.get("key").str();
        let hexes: Vec<BuildHighlightHex> = case
            .get("hexes")
            .arr()
            .iter()
            .map(|p| BuildHighlightHex {
                q: h1(&p.arr()[0]),
                r: h1(&p.arr()[1]),
            })
            .collect();
        // the template-literal key of every hex (`${q},${r}:${key}`)
        for (i, (h, wk)) in hexes.iter().zip(case.get("keys").arr()).enumerate() {
            cmp.eq(
                &format!("{name} key[{i}]"),
                format!("{},{}:{key}", js_num(h.q), js_num(h.r)),
                wk.str().to_owned(),
            );
        }
        let pending: HashSet<String> = case
            .get("pending")
            .arr()
            .iter()
            .map(|s| s.str().to_owned())
            .collect();
        let kept = filter_build_highlight_hexes(key, &hexes, &pending);
        let web_kept = case.get("keptBits").arr();
        cmp.eq(&format!("{name} kept len"), kept.len(), web_kept.len());
        for (i, (k, w)) in kept.iter().zip(web_kept).enumerate() {
            cmp.f(&format!("{name} kept[{i}].q"), k.q, h1(&w.arr()[0]));
            cmp.f(&format!("{name} kept[{i}].r"), k.r, h1(&w.arr()[1]));
        }
    }
    cmp.finish("b1 filter");
    eprintln!("b1 filter: checks {} scalars {}", cmp.checks, cmp.scalars);
}

fn nakladka_of(s: &str) -> Nakladka {
    *Nakladka::ALL
        .iter()
        .find(|n| n.as_str() == s)
        .unwrap_or_else(|| panic!("nakladka {s}"))
}

#[test]
fn deposit_display_scale_matches_the_web() {
    let v = load("b1.json");
    let mut cmp = Cmp::default();
    let cases = v.get("deposit").arr();
    assert_eq!(cases.len(), 8 * 13, "deposit cases");
    for case in cases {
        let n = nakladka_of(case.get("nakladka").str());
        let z = case.get("zloze");
        let z = if z.is_null() { None } else { Some(z.str()) };
        let ctx = format!("{}:{z:?}", n.as_str());
        let m = build_styled_resource_overlay(n, z);
        cmp.eq(
            &format!("{ctx} null"),
            m.is_none(),
            case.get("isNull").bool(),
        );
        let Some(m) = m else { continue };
        let ud = &m.nodes[ROOT].user_data;
        let keys: Vec<&str> = ud.iter().map(|(k, _)| k).collect();
        let web_keys: Vec<&str> = case.get("keys").arr().iter().map(|k| k.str()).collect();
        cmp.eq(&format!("{ctx} keys"), keys, web_keys);
        match ud.get("depositDisplayScale") {
            Some(UserValue::Num(x)) => cmp.f(&format!("{ctx} dds"), *x, h1(case.get("dds"))),
            other => cmp.err(format!("{ctx} dds: rust {other:?}")),
        }
    }
    cmp.finish("b1 deposit");
    eprintln!("b1 deposit: checks {} scalars {}", cmp.checks, cmp.scalars);
}

#[test]
fn js_num_matches_the_web_template_literal() {
    let v = load("b1.json");
    let cases = v.get("jsnum").arr();
    assert_eq!(cases.len(), 18, "jsnum cases");
    let mut cmp = Cmp::default();
    for c in cases {
        let x = h1(&c.arr()[0]);
        cmp.eq(&format!("{x:e}"), js_num(x), c.arr()[1].str().to_owned());
    }
    cmp.finish("b1 jsnum");
}
