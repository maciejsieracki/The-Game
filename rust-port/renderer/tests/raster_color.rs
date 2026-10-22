//! CSS colour parsing of `raster::parse_css_color` vs Chromium
//! (R-RUSTPORT-P4-28-RASTER-SHAPES-Q1).
//!
//! `tests/fixtures/raster/colors.tsv` was produced by `gen.mjs` in Chromium
//! 141: for each input, whether `ctx.fillStyle = input` is accepted, and the
//! `getImageData` pixel of a 1×1 `fillRect` with it. Inputs = every colour
//! string of the scenes (all colours the web map canvases assign) plus edge
//! cases.

use civ_renderer::raster::metric::premultiply_straight;
use civ_renderer::raster::{parse_css_color, Canvas2dLite};

/// Inputs Chromium accepts and this parser deliberately rejects (out of the
/// web's scope, module docs of `raster::color`).
const KNOWN_REJECTED_BY_RUST: [&str; 3] = [
    // full CSS named-colour table not implemented (web uses only 'transparent')
    "orange",
    "rebeccapurple",
    // Chromium 141 accepts a mixed space/comma separator; CSS Color 4 does not
    "rgb(1 2,3)",
];

struct Row {
    input: String,
    accepted: bool,
    rgba: [u8; 4],
}

fn rows() -> Vec<Row> {
    let path = format!(
        "{}/tests/fixtures/raster/colors.tsv",
        env!("CARGO_MANIFEST_DIR")
    );
    let text = std::fs::read_to_string(&path).expect("colors.tsv");
    // Line 1 is the header; colour rows may themselves start with '#'.
    text.lines()
        .skip(1)
        .map(|l| {
            let f: Vec<&str> = l.split('\t').collect();
            assert_eq!(f.len(), 4, "{l:?}");
            let px: Vec<u8> = f[3].split(',').map(|v| v.parse().expect("u8")).collect();
            Row {
                input: f[0].to_owned(),
                accepted: f[1] == "1",
                rgba: [px[0], px[1], px[2], px[3]],
            }
        })
        .collect()
}

#[test]
fn acceptance_matches_chromium_except_documented_scope() {
    let rows = rows();
    assert!(rows.len() >= 100, "{} probes", rows.len());
    let mut mismatches: Vec<String> = rows
        .iter()
        .filter(|r| parse_css_color(&r.input).is_some() != r.accepted)
        .map(|r| r.input.clone())
        .collect();
    mismatches.sort();
    let mut want: Vec<String> = KNOWN_REJECTED_BY_RUST
        .iter()
        .map(|s| (*s).to_owned())
        .collect();
    want.sort();
    assert_eq!(mismatches, want);
}

#[test]
fn every_web_colour_is_accepted() {
    // Rows before the first edge-case probe are the scene colours.
    for r in rows().iter().take_while(|r| r.input != "#ABC") {
        assert!(r.accepted, "chromium rejected scene colour {:?}", r.input);
        assert!(
            parse_css_color(&r.input).is_some(),
            "rust rejects {:?}",
            r.input
        );
    }
}

#[test]
fn filled_pixel_matches_chromium_within_one_step() {
    let mut exact = 0;
    let mut total = 0;
    for r in rows().iter().filter(|r| r.accepted) {
        if parse_css_color(&r.input).is_none() {
            continue; // KNOWN_REJECTED_BY_RUST, checked above
        }
        let mut c = Canvas2dLite::new(1, 1).expect("1x1");
        assert!(c.set_fill_style(&r.input));
        c.fill_rect(0.0, 0.0, 1.0, 1.0);
        let ours = c.pixels_premultiplied();
        let chrome = premultiply_straight(&r.rgba);
        let d = (0..4)
            .map(|i| ours[i].abs_diff(chrome[i]))
            .max()
            .unwrap_or(0);
        assert!(
            d <= 1,
            "{:?}: ours {:?} chromium {:?} (premultiplied)",
            r.input,
            ours,
            chrome
        );
        assert_eq!(ours[3], chrome[3], "{:?}: alpha must be exact", r.input);
        total += 1;
        if d == 0 {
            exact += 1;
        }
    }
    println!("colour pixels: {exact}/{total} exact, rest within ±1 (premultiplied)");
}

#[test]
fn invalid_assignment_keeps_previous_value() {
    let mut c = Canvas2dLite::new(1, 1).expect("1x1");
    assert!(c.set_fill_style("#ff0000"));
    assert!(!c.set_fill_style("not-a-colour"));
    c.fill_rect(0.0, 0.0, 1.0, 1.0);
    assert_eq!(c.pixels_premultiplied(), &[255, 0, 0, 255]);
}

#[test]
fn opaque_colours_are_bit_exact() {
    // Opaque pixels are not affected by (un)premultiplication rounding, so
    // they must match Chromium exactly (covers rounding of fractional rgb()).
    let mut n = 0;
    for r in rows().iter().filter(|r| r.accepted && r.rgba[3] == 255) {
        let Some(c) = parse_css_color(&r.input) else {
            continue; // KNOWN_REJECTED_BY_RUST
        };
        let q = |v: f32| (v * 255.0).round() as u8;
        assert_eq!(
            [q(c.r), q(c.g), q(c.b)],
            [r.rgba[0], r.rgba[1], r.rgba[2]],
            "{:?}",
            r.input
        );
        n += 1;
    }
    assert!(n >= 50, "{n} opaque probes");
}
