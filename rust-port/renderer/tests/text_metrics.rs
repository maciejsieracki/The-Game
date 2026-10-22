//! RR-T8b metrics vs Chromium 141 (R-RUSTPORT-P4-29-TEXT-FONTS-Q1).
//!
//! References in `tests/fixtures/text/` were measured by `gen.mjs` in a real
//! Chromium Canvas 2D with the same bundled font files (D-TXT-5 = A):
//! - `widths.tsv`: `measureText(text).width` for every web font value × the
//!   texts the web draws (all city names upper-cased, WZROST% labels,
//!   numbers, hover rows from `buildings.json` / `units.json`, the 22 + 25
//!   non-ASCII letters, punctuation, kerning pairs, symbol fallback);
//! - `truncate.tsv`: results of the web `truncateName` / hover-row loops;
//! - `baselines.tsv`: `TextMetrics.alphabeticBaseline` per `textBaseline`;
//! - `fontparse.tsv`: acceptance and size/weight of `ctx.font` values.

use civ_renderer::raster::text::{
    baseline_shift, parse_font, shape_text, truncate_hover_line, truncate_name, TextBaseline,
};
use civ_renderer::raster::Canvas2dLite;

/// Same bits, treating `+0.0` and `-0.0` as equal. Chromium's widths are
/// `float`s printed exactly by JS and parsed exactly by Rust, so the
/// comparison is bit-exact (obrona r1, zarzut 3: no tolerance).
fn same_bits(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

fn fixture(rel: &str) -> String {
    let p = format!("{}/tests/fixtures/text/{rel}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{p}: {e}"))
}

fn rows(rel: &str) -> Vec<Vec<String>> {
    fixture(rel)
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| l.split('\t').map(str::to_owned).collect())
        .collect()
}

#[test]
fn measure_text_widths_match_chromium() {
    let rows = rows("widths.tsv");
    assert!(rows.len() > 5000, "only {} rows", rows.len());
    let mut worst = (0.0_f64, String::new());
    let mut bad = Vec::new();
    for r in &rows {
        let spec = parse_font(&r[0]).unwrap_or_else(|| panic!("font {:?}", r[0]));
        let want: f64 = r[2].parse().expect("width");
        let got = shape_text(&spec, &r[1]).width;
        let d = (got - want).abs();
        if d > worst.0 {
            worst = (
                d,
                format!("{} | {:?} | rust {got} chromium {want}", r[0], r[1]),
            );
        }
        if !same_bits(got, want) {
            bad.push(format!(
                "{} | {:?} | rust {got} chromium {want}",
                r[0], r[1]
            ));
        }
    }
    println!(
        "widths: {} rows, max |Δ| = {} ({})",
        rows.len(),
        worst.0,
        worst.1
    );
    assert!(
        bad.is_empty(),
        "{} widths off (first 20): {:#?}",
        bad.len(),
        &bad[..bad.len().min(20)]
    );
}

#[test]
fn truncation_decisions_match_the_web() {
    let rows = rows("truncate.tsv");
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    let (mut n, mut cut) = (0, 0);
    let (mut exact_fit, mut short_hover, mut short_name) = (0, 0, 0);
    let mut bad = Vec::new();
    for r in &rows {
        let max_w: f64 = r[2].parse().expect("maxW");
        // Boundary coverage (obrona r1, zarzuty 1–2): maxW == measureText(input)
        // (cityMapStatChip.ts:773 `<=`, :711 `>`), and 1–2 UTF-16 unit
        // inputs (`length > 1` guards at :711 / :774).
        let units = r[3].encode_utf16().count();
        if r[3] == r[4]
            && same_bits(
                max_w,
                shape_text(&parse_font(&r[1]).expect("font"), &r[3]).width,
            )
        {
            exact_fit += 1;
        }
        if units <= 2 && r[0] == "hover" {
            short_hover += 1;
        }
        if units <= 2 && r[0] == "name" {
            short_name += 1;
        }
        let got = match r[0].as_str() {
            "name" => truncate_name(&mut c, &r[3], max_w, &r[1]),
            "hover" => {
                assert!(c.set_font(&r[1]));
                truncate_hover_line(&c, &r[3], max_w)
            }
            k => panic!("kind {k}"),
        };
        n += 1;
        if r[4].ends_with('…') {
            cut += 1;
        }
        if got != r[4] {
            bad.push(format!(
                "{:?} max {max_w}: rust {got:?} web {:?}",
                r[3], r[4]
            ));
        }
    }
    println!(
        "truncation: {n} cases, {cut} truncated by the web, {} differ",
        bad.len()
    );
    assert!(cut > 1000, "too few truncated cases: {cut}");
    assert!(bad.is_empty(), "{:#?}", &bad[..bad.len().min(20)]);
    println!(
        "boundary: exact fit {exact_fit}, hover ≤2 units {short_hover}, name ≤2 units {short_name}"
    );
    assert!(exact_fit >= 40, "too few maxW == width cases: {exact_fit}");
    assert!(
        short_hover >= 5,
        "too few 1–2 unit hover rows: {short_hover}"
    );
    assert!(short_name >= 3, "too few 1–2 unit names: {short_name}");
}

#[test]
fn baselines_match_chromium() {
    let rows = rows("baselines.tsv");
    assert_eq!(rows.len(), 3 * 2 * 12 * 6);
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
        // alphabeticBaseline = distance from the textBaseline line to the
        // alphabetic baseline, positive upwards → our shift is its negation.
        let want = -r[2].parse::<f64>().expect("value");
        let got = baseline_shift(&spec, b);
        // Chromium reports a float, printed by JS exactly; every value of
        // ours is an exact binary fraction too → bit-exact comparison.
        if !same_bits(got, want) {
            bad.push(format!("{} {}: rust {got} chromium {want}", r[0], r[1]));
        }
    }
    assert!(bad.is_empty(), "{:#?}", bad);
}

/// Parses `"[style] [weight] <size>px …"` from Chromium's serialisation.
fn serialised_size_weight(s: &str) -> (f64, u16) {
    let mut weight = 400;
    for tok in s.split_whitespace() {
        match tok {
            "bold" => weight = 700,
            t if t.ends_with("px") => {
                return (t.trim_end_matches("px").parse().expect("size"), weight);
            }
            t if t.chars().all(|c| c.is_ascii_digit()) => weight = t.parse().expect("weight"),
            _ => {}
        }
    }
    panic!("no size in {s:?}");
}

#[test]
fn font_shorthand_parsing_matches_chromium() {
    for r in rows("fontparse.tsv") {
        let input = r.first().cloned().unwrap_or_default();
        let accepted = r.get(1).map(String::as_str) == Some("1");
        let parsed = parse_font(&input);
        assert_eq!(parsed.is_some(), accepted, "{input:?}");
        if let Some(spec) = parsed {
            let (size, weight) = serialised_size_weight(&r[2]);
            assert!(
                (spec.size_px - size).abs() < 1e-9,
                "{input:?}: size {} vs {size}",
                spec.size_px
            );
            assert_eq!(spec.weight, weight, "{input:?}");
        }
    }
}

#[test]
fn invalid_font_keeps_previous_value() {
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    let default_w = c.measure_text("Hello").width;
    assert!(c.set_font("bold 20px Arial"));
    let w = c.measure_text("Hello").width;
    assert!(w > default_w);
    assert!(!c.set_font("bogus"));
    assert_eq!(c.measure_text("Hello").width, w);
    assert!(!c.set_text_align("middle"));
    assert!(!c.set_text_baseline("center"));
}

#[test]
fn default_font_is_10px_sans_serif() {
    let c = Canvas2dLite::new(1, 1).expect("canvas");
    let spec = parse_font("10px sans-serif").expect("font");
    assert_eq!(c.measure_text("Ab9").width, shape_text(&spec, "Ab9").width);
}
