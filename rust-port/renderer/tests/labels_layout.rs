//! RR-T8e layout tests (R-RUSTPORT-P4-34-ANCHORS-DOM-Q1).
//!
//! `tests/fixtures/labels/layout.tsv` holds what Chromium 141 laid out for
//! the web's real DOM/CSS of every label scene (`gen.mjs`): the border box
//! (`getBoundingClientRect`) and every text fragment (`Range.getClientRects`).
//! The Rust layout must give the same numbers **bit for bit** (all values
//! are `LayoutUnit` multiples of 1/64, exact in `f64`).

use civ_renderer::labels::layout::{
    computed_line_height, lu_px, primary_metrics, smaller_font_size, wrap_words, LineHeight,
};
use civ_renderer::labels::style::{r4_icon_for, R4_ICON_FALLBACK, R4_IMPROVEMENT_CHIP};
use civ_renderer::labels::Label;
use civ_renderer::raster::text::parse_font;

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/labels/{rel}", env!("CARGO_MANIFEST_DIR"))
}

/// `(name, label, dsf, opacity)` from `scenes.tsv`.
pub fn scenes() -> Vec<(String, Label, f64, String, u32, u32, u32)> {
    let text = std::fs::read_to_string(fixture("scenes.tsv")).expect("scenes.tsv");
    let mut out = Vec::new();
    for line in text
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
    {
        let f: Vec<&str> = line.split('\t').collect();
        assert_eq!(f[0], "scene");
        let label = match f[2] {
            "R4" => Label::BuildChip {
                icon: f[8].to_owned(),
                valid: f[9] == "true",
                // `-` = empty cell (gen.mjs `cell`).
                reason: f
                    .get(10)
                    .copied()
                    .filter(|r| *r != "-")
                    .unwrap_or("")
                    .to_owned(),
            },
            "R5" => Label::Siege {
                city: f[8].to_owned(),
            },
            "R15a" => Label::Damage {
                dmg: f[8].parse().unwrap(),
            },
            "R15b" => Label::Wall {
                text: f[8].to_owned(),
                color: f[9].to_owned(),
            },
            g => panic!("group {g}"),
        };
        out.push((
            f[1].to_owned(),
            label,
            f[6].parse().unwrap(),
            f[7].to_owned(),
            f[3].parse().unwrap(),
            f[4].parse().unwrap(),
            f[5].parse().unwrap(),
        ));
    }
    out
}

fn num(s: &str) -> f64 {
    s.parse().unwrap()
}

#[test]
fn layout_matches_chromium_bit_for_bit() {
    let text = std::fs::read_to_string(fixture("layout.tsv")).expect("layout.tsv");
    let mut rows: std::collections::BTreeMap<String, Vec<Vec<String>>> = Default::default();
    for line in text
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
    {
        let f: Vec<String> = line.split('\t').map(str::to_owned).collect();
        rows.entry(f[1].clone()).or_default().push(f);
    }
    let mut checked = 0usize;
    let mut bad = Vec::new();
    for (name, label, ..) in scenes() {
        let l = label.layout();
        let r = &rows[&name];
        assert_eq!(r[0][0], "box");
        let got_box = [0.0, 0.0, lu_px(l.width), lu_px(l.height)];
        let want_box = [num(&r[0][2]), num(&r[0][3]), num(&r[0][4]), num(&r[0][5])];
        if got_box.map(f64::to_bits) != want_box.map(f64::to_bits) {
            bad.push(format!("{name}: box {got_box:?} vs chromium {want_box:?}"));
        }
        let texts = &r[1..];
        if texts.len() != l.fragments.len() {
            bad.push(format!(
                "{name}: {} fragments vs chromium {}",
                l.fragments.len(),
                texts.len()
            ));
            continue;
        }
        for (fr, t) in l.fragments.iter().zip(texts) {
            // The DOM text node may span several fragments (wrapped reason).
            assert!(
                t[2].contains(fr.text.trim()),
                "{name}: {:?} ⊄ {:?}",
                fr.text,
                t[2]
            );
            let got = [lu_px(fr.x), lu_px(fr.y), lu_px(fr.w), lu_px(fr.h)];
            let want = [num(&t[3]), num(&t[4]), num(&t[5]), num(&t[6])];
            if got.map(f64::to_bits) != want.map(f64::to_bits) {
                bad.push(format!(
                    "{name} {:?}: {got:?} vs chromium {want:?}",
                    fr.text
                ));
            }
            checked += 1;
        }
    }
    println!("text fragments checked: {checked}");
    assert!(bad.is_empty(), "layout differences:\n{}", bad.join("\n"));
    assert!(checked >= 80, "too few fragments: {checked}");
}

/// Layout-only sweep: every pool city name in R5 (the fractional `<small>`
/// size), R15a damage 0–300, R15b 0–120, every R4 icon × validity.
#[test]
fn layout_sweep_matches_chromium_bit_for_bit() {
    let text = std::fs::read_to_string(fixture("sweep.tsv")).expect("sweep.tsv");
    let mut bad = Vec::new();
    let mut labels = 0usize;
    let mut frags = 0usize;
    for line in text
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
    {
        let f: Vec<&str> = line.split('\t').collect();
        let p: Vec<&str> = f[1].split('|').collect();
        let label = match f[0] {
            "R4" => Label::BuildChip {
                icon: p[0].to_owned(),
                valid: p[1] == "true",
                reason: p[2].to_owned(),
            },
            "R5" => Label::Siege {
                city: p[0].to_owned(),
            },
            "R15a" => Label::Damage {
                dmg: p[0].parse().unwrap(),
            },
            "R15b" => Label::Wall {
                text: p[0].to_owned(),
                color: p[1].to_owned(),
            },
            g => panic!("group {g}"),
        };
        let l = label.layout();
        labels += 1;
        let mut got = vec![lu_px(l.width), lu_px(l.height)];
        for fr in &l.fragments {
            got.extend([lu_px(fr.x), lu_px(fr.y), lu_px(fr.w), lu_px(fr.h)]);
        }
        let mut want = vec![num(f[2]), num(f[3])];
        for q in f[4].split(';').filter(|s| !s.is_empty()) {
            want.extend(q.split(',').map(num));
            frags += 1;
        }
        let gb: Vec<u64> = got.iter().map(|v| v.to_bits()).collect();
        let wb: Vec<u64> = want.iter().map(|v| v.to_bits()).collect();
        if gb != wb {
            bad.push(format!("{} {}: {got:?} vs chromium {want:?}", f[0], f[1]));
        }
    }
    println!(
        "sweep: {labels} labels, {frags} fragments, {} differ",
        bad.len()
    );
    assert!(labels > 1900, "{labels}");
    assert!(
        bad.is_empty(),
        "sweep differences ({}):\n{}",
        bad.len(),
        bad.iter().take(20).cloned().collect::<Vec<_>>().join("\n")
    );
}

#[test]
fn texture_sizes_match_the_generator() {
    for (name, label, dsf, _, w, h, m) in scenes() {
        let (cw, ch, cm) = civ_renderer::labels::paint::texture_css_size(&label.layout());
        assert_eq!((cw, ch, cm), (w, h, m), "{name}");
        let t = label.render(dsf, 1.0);
        // Exact for the integer scales used.
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let dev = ((f64::from(w) * dsf) as u32, (f64::from(h) * dsf) as u32);
        assert_eq!((t.width, t.height), dev, "{name}");
    }
}

#[test]
fn line_height_rules() {
    // Measured in Chromium 141 (gen probe, P4-34 §3.2): LayoutUnit(round64(fs) · k) in f32.
    let lh = |font: &str, k: f32| {
        computed_line_height(&parse_font(font).unwrap(), LineHeight::Number(k))
    };
    assert_eq!(lh("bold 18px Arial", 1.3), 1497); // 23.4 → 23.390625 (truncated)
    assert_eq!(lh("bold 11px Arial", 1.3), 915);
    assert_eq!(lh("12px Arial", 1.2), 921);
    let small = format!("bold {}px Arial", smaller_font_size(11.0));
    assert_eq!(lh(&small, 1.3), 763); // 9.16667 → round64 9.171875 → 11.921875
    assert_eq!(lh("25px Arial", 1.15), 1840); // f32 product 28.75
    let normal = |font: &str| computed_line_height(&parse_font(font).unwrap(), LineHeight::Normal);
    assert_eq!(normal("bold 15px sans-serif"), 17 * 64);
    assert_eq!(normal("bold 13px sans-serif"), 15 * 64);
    let m = primary_metrics(&parse_font("16px Arial").unwrap());
    assert_eq!((m.ascent, m.descent, m.line_gap), (14, 3, 1)); // gap 67/2048·16 = 0.52
}

#[test]
fn small_is_parent_over_1_2_in_f32() {
    assert_eq!(smaller_font_size(11.0), f64::from(11.0f32 / 1.2f32));
}

#[test]
fn reason_wraps_like_chromium() {
    // Chromium: two fragments of the reason at max-width 220 (layout.tsv).
    let lines = wrap_words(
        "11px Arial,sans-serif",
        civ_renderer::labels::style::R4_REASON_DROGA,
        220 * 64,
    );
    assert_eq!(lines.len(), 2, "{lines:?}");
    assert!(lines[0].ends_with("już"), "{lines:?}");
}

#[test]
fn r4_icons_table() {
    assert_eq!(R4_IMPROVEMENT_CHIP.len(), 16);
    assert_eq!(r4_icon_for("farma"), "🌾");
    assert_eq!(r4_icon_for("fort"), "🛡");
    assert_eq!(r4_icon_for("nieznane"), R4_ICON_FALLBACK);
    for (_, ic) in R4_IMPROVEMENT_CHIP {
        assert!(
            civ_renderer::labels::layout::all_glyphs_available("16px Arial,sans-serif", ic),
            "{ic}"
        );
    }
}
