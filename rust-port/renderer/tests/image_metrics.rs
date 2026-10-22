//! RR-T8c metrics without pixels (R-RUSTPORT-P4-30-IMAGES-Q1): emoji
//! `measureText().width` and baselines vs Chromium 141 (bit for bit), and
//! the port of `prepareSvgForCanvas` vs the web function itself
//! (`tests/fixtures/image/{widths,baselines,prepare}.tsv`, written by
//! `gen.mjs`).

use civ_renderer::raster::image::emoji::{emoji_aware_baseline_shift, measure_text};
use civ_renderer::raster::image::svg::prepare_svg_for_canvas;
use civ_renderer::raster::text::{parse_font, TextBaseline};

fn same_bits(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

fn fixture(rel: &str) -> String {
    let p = format!("{}/tests/fixtures/image/{rel}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{p}: {e}"))
}

fn rows(file: &str) -> Vec<Vec<String>> {
    fixture(file)
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| l.split('\t').map(str::to_owned).collect())
        .collect()
}

const R4_ICONS: &str = "⛏🌾🎣🏔🏛🏰🏹🏺🐑💧🛡🛤🧂🪓🪚🪨";

/// Rows that are NOT bit-exact, with the largest accepted |Δ| (documented
/// in `P4-30-IMAGES.md` §4.1; anything else must match bit for bit, and these
/// must stay within their bound):
/// - a **fractional** font size (20.3 px): Chromium's strike scale for it is
///   not the f32 `size / ppem` of every other row (model not identified;
///   the web only uses integer emoji sizes — `Math.round` in
///   `cityOkolicaOverlay.ts:154-155`, literals elsewhere);
/// - the 16 R4 icons in one string at 48 / 96 px: the sum differs by one f32
///   ulp (accumulation order inside Blink not reproduced; the web draws these
///   icons one per chip at 16 px, `main.ts:12863-12867`, which is exact).
const KNOWN_WIDTH_DEVIATIONS: &[(&str, &str, f64)] = &[
    ("20.3px \"Noto Color Emoji\"", "🔥", 0.02),
    ("48px serif", R4_ICONS, 1.5e-4),
    ("bold 96px Arial", R4_ICONS, 2.5e-4),
];

#[test]
fn emoji_widths_match_chromium_bit_for_bit() {
    let rows = rows("widths.tsv");
    assert!(rows.len() >= 250, "{} rows", rows.len());
    let mut bad = Vec::new();
    let mut known = 0;
    for r in &rows {
        let want: f64 = r[2].parse().expect("width");
        let got = measure_text(&r[0], &r[1]).expect("font parses");
        if let Some((_, _, tol)) = KNOWN_WIDTH_DEVIATIONS
            .iter()
            .find(|(f, t, _)| *f == r[0] && *t == r[1])
        {
            known += 1;
            assert!(
                (got - want).abs() <= *tol,
                "{:?} {:?}: rust {got} chromium {want} beyond the documented bound",
                r[0],
                r[1]
            );
            println!(
                "known deviation {:?} {:?}: rust {got} chromium {want}",
                r[0], r[1]
            );
            continue;
        }
        if !same_bits(got, want) {
            bad.push(format!("{:?} {:?}: rust {got} chromium {want}", r[0], r[1]));
        }
    }
    assert_eq!(known, KNOWN_WIDTH_DEVIATIONS.len());
    println!(
        "{} widths: {} bit-exact, {known} known deviations",
        rows.len(),
        rows.len() - known - bad.len()
    );
    assert!(bad.is_empty(), "{:#?}", bad);
}

#[test]
fn emoji_baselines_match_chromium() {
    let rows = rows("baselines.tsv");
    assert_eq!(rows.len(), 6 * 2 * 6);
    let mut bad = Vec::new();
    for r in &rows {
        let spec = parse_font(&r[0]).expect("font");
        let b = match r[1].as_str() {
            "alphabetic" => TextBaseline::Alphabetic,
            "top" => TextBaseline::Top,
            "hanging" => TextBaseline::Hanging,
            "middle" => TextBaseline::Middle,
            "ideographic" => TextBaseline::Ideographic,
            "bottom" => TextBaseline::Bottom,
            x => panic!("{x}"),
        };
        // alphabeticBaseline is positive upwards; our shift is downwards.
        let want = -r[2].parse::<f64>().expect("value");
        let got = emoji_aware_baseline_shift(&spec, b);
        if !same_bits(got, want) {
            bad.push(format!("{} {}: rust {got} chromium {want}", r[0], r[1]));
        }
    }
    assert!(bad.is_empty(), "{:#?}", bad);
}

#[test]
fn prepare_svg_for_canvas_matches_the_web_function() {
    let edge: Vec<(String, String)> = fixture("edge-svgs.tsv")
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| {
            let (k, v) = l.split_once('\t').expect("edge row");
            (k.to_owned(), v.to_owned())
        })
        .collect();
    let rows = rows("prepare.tsv");
    assert!(rows.len() >= 200, "{} rows", rows.len());
    let mut changed_widths = 0;
    for r in &rows {
        let svg = match edge.iter().find(|(k, _)| *k == r[0]) {
            Some((_, v)) => v.clone(),
            None => fixture(&format!("input/{}.svg", r[0])),
        };
        // gen.mjs writes newlines of the documents as the two characters `\n`
        // (TSV); prepareSvgForCanvas never touches either form.
        let svg = svg.replace('\n', "\\n");
        let boost: f64 = r[2].parse().expect("boost");
        let got = prepare_svg_for_canvas(&svg, &r[1], boost);
        assert_eq!(got, r[3], "{} {} {}", r[0], r[1], r[2]);
        if got.contains("stroke-width=\"") {
            changed_widths += 1;
        }
    }
    assert!(changed_widths > 100);
}
