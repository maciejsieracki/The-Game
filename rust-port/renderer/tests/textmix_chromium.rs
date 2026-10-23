//! RR-T8f — one text path for outline text and colour emoji, vs Chromium 141
//! (R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1, `P4-35-TEXT-EMOJI-UNIFY.md`).
//!
//! `tests/fixtures/textmix/` is written by `gen.mjs` (real Chromium 141
//! Canvas 2D, the same bundled fonts). Every scene is replayed here through
//! the **public `Canvas2dLite` text API only** (`set_font`,
//! `set_text_align`, `set_text_baseline`, `fill_text`, `stroke_text`) — no
//! `raster::image::emoji` call — so the unified path is what is measured.
//!
//! 1. `textmix_scenes_match_chromium` — SSIM / mean_abs / px>16 limits of
//!    RR-T8a/b/c (ZAŁOŻENIE D-TXT-4 = A).
//! 2. `textmix_widths_match_chromium_bit_for_bit` — `measure_text` of mixed
//!    strings, `to_bits`.
//! 3. `textmix_baselines_match_chromium` — the primary face's baseline also
//!    for strings without emoji.
//! 4. `textmix_stroke_probe_matches_chromium` — `strokeText` draws a colour
//!    glyph filled with the stroke alpha (probe sums).
//! 5. `textmix_golden_hashes` — FNV-1a 64 of every scene (determinism across
//!    runs and toolchains). Re-bless: `TEXTMIX_BLESS=1 cargo test --test
//!    textmix_chromium` only after a deliberate, reviewed change.

use std::fmt::Write as _;

use civ_renderer::raster::image::emoji::emoji_aware_baseline_shift;
use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};
use civ_renderer::raster::text::{parse_font, TextBaseline};
use civ_renderer::raster::Canvas2dLite;

/// ZAŁOŻENIE: the RR-T8a/b/c limits (D-TXT-4 = A).
const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

/// Scenes over the limits **because of the RR-T8b outline AA, not RR-T8f**
/// (`P4-35-TEXT-EMOJI-UNIFY.md` §5.2), with bounds = measured values rounded
/// outward (a regression still fails): `(scene, min SSIM, max mean_abs,
/// max px>16)`. Small light (`#f0e6c8`) bold 13 px Liberation text on a
/// transparent canvas: Chromium/Skia renders outline glyph coverage
/// differently (P4-29 §5.3 — not reproduced, D-TXT-6); the control scene
/// `m15_text_only_regression` has **no colour glyph** (drawn by the
/// unchanged RR-T8b branch) and misses by the same amount, while every
/// scene where colour glyphs dominate is well inside the limits.
const EXCEPTIONS: &[(&str, f64, f64, f64)] = &[
    ("m01_stat_line_left_middle", 0.983, 2.0, 0.050),
    ("m15_text_only_regression", 0.984, 2.01, 0.053),
];

fn fixture(rel: &str) -> String {
    format!(
        "{}/tests/fixtures/textmix/{rel}",
        env!("CARGO_MANIFEST_DIR")
    )
}

fn read(rel: &str) -> String {
    let p = fixture(rel);
    std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{p}: {e}"))
}

fn rows(rel: &str) -> Vec<Vec<String>> {
    read(rel)
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| l.split('\t').map(str::to_owned).collect())
        .collect()
}

fn same_bits(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

fn num(s: &str) -> f64 {
    s.parse().unwrap_or_else(|_| panic!("number: {s:?}"))
}

pub struct Scene {
    pub name: String,
    pub w: u32,
    pub h: u32,
    pub src: String,
    pub ops: Vec<Vec<String>>,
}

fn load() -> Vec<Scene> {
    let mut out = Vec::new();
    let mut cur: Option<Scene> = None;
    for f in rows("scenes.tsv") {
        match f[0].as_str() {
            "scene" => {
                assert!(cur.is_none(), "nested scene");
                cur = Some(Scene {
                    name: f[1].clone(),
                    w: f[2].parse().expect("w"),
                    h: f[3].parse().expect("h"),
                    src: f[4].clone(),
                    ops: Vec::new(),
                });
            }
            "end" => out.push(cur.take().expect("end without scene")),
            _ => cur.as_mut().expect("op outside scene").ops.push(f),
        }
    }
    assert!(cur.is_none(), "unterminated scene");
    out
}

fn play(sc: &Scene) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(sc.w, sc.h).expect("size");
    for op in &sc.ops {
        let a = &op[1..];
        let n = |i: usize| num(&a[i]);
        match op[0].as_str() {
            "font" => assert!(c.set_font(&a[0]), "{}: font {:?}", sc.name, a[0]),
            "textAlign" => assert!(c.set_text_align(&a[0])),
            "textBaseline" => assert!(c.set_text_baseline(&a[0])),
            "fillStyle" => assert!(c.set_fill_style(&a[0])),
            "strokeStyle" => assert!(c.set_stroke_style(&a[0])),
            "lineWidth" => c.set_line_width(n(0)),
            "lineJoin" => assert!(c.set_line_join(&a[0])),
            "shadowColor" => assert!(c.set_shadow_color(&a[0])),
            "shadowBlur" => c.set_shadow_blur(n(0)),
            "shadowOffsetY" => c.set_shadow_offset_y(n(0)),
            "setTransform" => c.set_transform(n(0), n(1), n(2), n(3), n(4), n(5)),
            "fillText" => c.fill_text(&a[0], n(1), n(2)),
            "strokeText" => c.stroke_text(&a[0], n(1), n(2)),
            other => panic!("{}: unknown op {other}", sc.name),
        }
    }
    c
}

fn diff_vs_chromium(sc: &Scene, c: &Canvas2dLite) -> ImageDiff {
    let path = fixture(&format!("ref/{}.rgba", sc.name));
    let straight = std::fs::read(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
    assert_eq!(straight.len(), (sc.w * sc.h * 4) as usize, "{path}: size");
    compare_premultiplied(
        c.pixels_premultiplied(),
        &premultiply_straight(&straight),
        sc.w as usize,
        sc.h as usize,
    )
}

#[test]
fn textmix_scenes_match_chromium() {
    let scenes = load();
    assert_eq!(scenes.len(), 18, "scene count of gen.mjs");
    let mut failures = Vec::new();
    println!("scene | size | max_abs | mean_abs | px>16 % | ssim | source");
    for sc in &scenes {
        let c = play(sc);
        if let Some(dir) = std::env::var_os("TEXTMIX_DUMP") {
            let p = std::path::Path::new(&dir).join(format!("{}.rgba", sc.name));
            std::fs::write(p, c.pixels_premultiplied()).expect("dump");
        }
        let d = diff_vs_chromium(sc, &c);
        println!(
            "{} | {}x{} | {} | {:.4} | {:.3} | {:.5} | {}",
            sc.name,
            sc.w,
            sc.h,
            d.max_abs,
            d.mean_abs,
            d.frac_px_over_16 * 100.0,
            d.ssim,
            sc.src
        );
        let (min_ssim, max_mean, max_px) = EXCEPTIONS
            .iter()
            .find(|(n, ..)| *n == sc.name)
            .map_or((MIN_SSIM, MAX_MEAN_ABS, MAX_FRAC_PX_OVER_16), |e| {
                (e.1, e.2, e.3)
            });
        if d.ssim < min_ssim || d.mean_abs > max_mean || d.frac_px_over_16 > max_px {
            failures.push(sc.name.clone());
        }
    }
    assert!(failures.is_empty(), "scenes over threshold: {failures:?}");
}

#[test]
fn textmix_widths_match_chromium_bit_for_bit() {
    let rows = rows("widths.tsv");
    assert_eq!(rows.len(), 14 * 22, "widths.tsv rows");
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    let mut bad = Vec::new();
    for r in &rows {
        assert!(c.set_font(&r[0]), "font {:?}", r[0]);
        let text = r[1].replace("\\t", "\t");
        let got = c.measure_text(&text).width;
        let want = num(&r[2]);
        if !same_bits(got, want) {
            bad.push(format!("{} | {:?}: rust {got} chromium {want}", r[0], text));
        }
    }
    println!(
        "widths: {}/{} bit for bit",
        rows.len() - bad.len(),
        rows.len()
    );
    assert!(bad.is_empty(), "{:#?}", bad);
}

#[test]
fn textmix_baselines_match_chromium() {
    let rows = rows("baselines.tsv");
    assert_eq!(rows.len(), 6 * 4 * 6);
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
        // Chromium reports the baseline position relative to `y`; ours is the
        // downward shift from `y` to the alphabetic baseline.
        let want = -num(&r[3]);
        let got = emoji_aware_baseline_shift(&spec, b);
        if !same_bits(got, want) {
            bad.push(format!(
                "{} {} {:?}: rust {got} chromium {want}",
                r[0], r[1], r[2]
            ));
        }
    }
    assert!(bad.is_empty(), "{:#?}", bad);
}

/// Sums of straight RGBA over the probe canvas (as `gen.mjs`).
fn probe_sums(c: &Canvas2dLite) -> [u64; 4] {
    let mut s = [0u64; 4];
    for px in c.to_rgba8_straight().chunks_exact(4) {
        for k in 0..4 {
            s[k] += u64::from(px[k]);
        }
    }
    s
}

#[test]
fn textmix_stroke_probe_matches_chromium() {
    let want: Vec<(String, [u64; 4])> = rows("probes.tsv")
        .iter()
        .map(|r| {
            let v = |i: usize| r[i].parse::<u64>().expect("sum");
            (r[0].clone(), [v(1), v(2), v(3), v(4)])
        })
        .collect();
    assert_eq!(want.len(), 5);
    let run = |name: &str| -> [u64; 4] {
        let mut c = Canvas2dLite::new(80, 60).expect("canvas");
        assert!(c.set_font("40px Arial"));
        assert!(c.set_text_baseline("middle"));
        match name {
            "fill_opaque" => {
                c.set_fill_style("#0000ff");
                c.fill_text("🔥", 10.0, 30.0);
            }
            "stroke_opaque_lw3" => {
                c.set_stroke_style("#ff0000");
                c.set_line_width(3.0);
                c.stroke_text("🔥", 10.0, 30.0);
            }
            "stroke_opaque_lw12" => {
                c.set_stroke_style("#00ff00");
                c.set_line_width(12.0);
                c.stroke_text("🔥", 10.0, 30.0);
            }
            "stroke_alpha_0.5" => {
                c.set_stroke_style("rgba(255,0,0,0.5)");
                c.set_line_width(3.0);
                c.stroke_text("🔥", 10.0, 30.0);
            }
            "stroke_fill_alpha_0.5" => {
                c.set_fill_style("rgba(0,0,255,0.5)");
                c.set_stroke_style("#ff0000");
                c.set_line_width(3.0);
                c.stroke_text("🔥", 10.0, 30.0);
            }
            x => panic!("probe {x}"),
        }
        probe_sums(&c)
    };
    // Chromium facts (exact): stroke == fill whatever lineWidth / fill alpha.
    let w: std::collections::HashMap<_, _> = want.iter().cloned().collect();
    assert_eq!(w["fill_opaque"], w["stroke_opaque_lw3"]);
    assert_eq!(w["fill_opaque"], w["stroke_opaque_lw12"]);
    assert_eq!(w["fill_opaque"], w["stroke_fill_alpha_0.5"]);
    let fill = run("fill_opaque");
    let cf = w["fill_opaque"];
    for (name, chromium) in &want {
        let got = run(name);
        println!("probe {name}: rust {got:?} chromium {chromium:?}");
        // Our resampling differs from Skia's in the last bits (scene limits
        // above; here ≤ 3 % per channel sum). The rule itself is checked
        // exactly on our side and as a ratio against Chromium: an opaque
        // stroke gives the fill image, a stroke alpha scales the alpha mass.
        for k in 0..4 {
            let (g, c) = (got[k] as f64, chromium[k] as f64);
            assert!(
                (g - c).abs() <= 0.03 * c.max(1.0),
                "{name} channel {k}: rust {g} chromium {c}"
            );
        }
        let ratio_rust = got[3] as f64 / fill[3] as f64;
        let ratio_chromium = chromium[3] as f64 / cf[3] as f64;
        assert!(
            (ratio_rust - ratio_chromium).abs() <= 0.002,
            "{name}: alpha mass ratio rust {ratio_rust} chromium {ratio_chromium}"
        );
        if name != "stroke_alpha_0.5" {
            assert_eq!(got, fill, "{name}: a colour glyph is drawn as filled");
        }
    }
}

#[test]
fn textmix_golden_hashes() {
    let scenes = load();
    let mut out = String::from(
        "# R-RUSTPORT-P4-35 golden FNV-1a 64 of the premultiplied RGBA8 buffer per scene\n",
    );
    for sc in &scenes {
        let a = play(sc);
        let b = play(sc);
        assert_eq!(a.rgba_hash(), b.rgba_hash(), "{}: rendering twice", sc.name);
        writeln!(out, "{}\t{:016x}", sc.name, a.rgba_hash()).expect("write");
    }
    print!("{out}");
    let path = fixture("golden.tsv");
    if std::env::var_os("TEXTMIX_BLESS").is_some() {
        std::fs::write(&path, &out).expect("bless golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv");
    assert_eq!(
        out, want,
        "golden hashes changed (TEXTMIX_BLESS=1 to re-bless)"
    );
}
