//! RR-T8c scene tests (R-RUSTPORT-P4-30-IMAGES-Q1).
//!
//! `tests/fixtures/image/scenes.tsv` holds the web image/emoji producers
//! T10 (owner emblem: portrait JPG, sigil SVG, fallback glyph), T11 (upgrade
//! badges: SVG icon), the T14 medallion (portrait / sigil under
//! `setTransform` ×1–×4) and production icon, T1 🔥, T2 ⚔, T3 ☠, T12 👤,
//! T13 🍞🔨💰 + digits, and semantic scenes — transcribed from pin
//! `edb8fb56` by `gen.mjs` (each scene names its `file:line`). The same op
//! list was replayed in a real Chromium 141 Canvas 2D with the same fonts and
//! image bytes (`ref/<scene>.rgba`).
//!
//! 1. `scenes_match_chromium` — per-scene SSIM / mean_abs / px>16 limits
//!    (ZAŁOŻENIE: the RR-T8a/b limits, D-TXT-4 = A; full table printed).
//! 2. `scenes_match_golden_hashes` — FNV-1a 64 of the premultiplied buffer
//!    equals `golden.tsv` (determinism across runs and toolchains). Re-bless
//!    with `IMAGE_BLESS=1 cargo test --test image_scenes` only after a
//!    deliberate, reviewed change.
//! 3. `rendering_twice_is_identical`.

use std::collections::HashMap;
use std::fmt::Write as _;

use civ_renderer::raster::image::emoji::{self, TextStyle};
use civ_renderer::raster::image::jpeg::decode_jpeg;
use civ_renderer::raster::image::mip::{draw_bitmap, MippedImage};
use civ_renderer::raster::image::svg::{draw_svg, prepare_svg_for_canvas, SvgImage};
use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};
use civ_renderer::raster::Canvas2dLite;

/// ZAŁOŻENIE (same as RR-T8a `tests/raster_scenes.rs` and RR-T8b
/// `tests/text_scenes.rs`, D-TXT-4 = A).
const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

/// Scenes allowed a larger `mean_abs` (SSIM and px>16 stay strict), each
/// with its documented reason (`P4-30-IMAGES.md` §5.3). The bound is the
/// measured value rounded up, so a regression still fails.
/// - `t14_prod_icon_x1`: a 16 px icon of 1.2 px round-capped strokes filling
///   a 24×24 canvas — every pixel is an anti-aliased edge, and tiny-skia's
///   (resvg's) 1/4-coverage AA differs from Chromium's Skia there; measured
///   1.576 (×2: 0.95, ×3: 0.49 — in limits). Supersampling ×2/×4, a
///   ±0.05 px offset and bitmap-scaled rasterisation were tried and are
///   worse (§5.3).
const MEAN_ABS_EXCEPTIONS: &[(&str, f64)] = &[("t14_prod_icon_x1", 1.6)];

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/image/{rel}", env!("CARGO_MANIFEST_DIR"))
}

enum Img {
    Bitmap(MippedImage),
    Svg(Box<SvgImage>),
}

struct Scene {
    name: String,
    w: u32,
    h: u32,
    src: String,
    ops: Vec<Vec<String>>,
}

struct Fixture {
    images: HashMap<String, Img>,
    scenes: Vec<Scene>,
}

fn load() -> Fixture {
    let text = std::fs::read_to_string(fixture("scenes.tsv")).expect("scenes.tsv");
    let mut images = HashMap::new();
    let mut scenes = Vec::new();
    let mut cur: Option<Scene> = None;
    for line in text.lines() {
        if line.starts_with('#') || line.is_empty() {
            continue;
        }
        let f: Vec<String> = line.split('\t').map(str::to_owned).collect();
        match f[0].as_str() {
            "image" => {
                let bytes = std::fs::read(fixture(&f[3])).expect("image input");
                let img = match f[2].as_str() {
                    "jpg" => {
                        Img::Bitmap(MippedImage::new(decode_jpeg(&bytes).expect("jpeg decodes")))
                    }
                    "svg" => {
                        let raw = String::from_utf8(bytes).expect("utf-8 svg");
                        let boost: f64 = f[5].parse().expect("boost");
                        let prepared = prepare_svg_for_canvas(&raw, &f[4], boost);
                        Img::Svg(Box::new(SvgImage::parse(&prepared).expect("svg parses")))
                    }
                    k => panic!("image kind {k}"),
                };
                images.insert(f[1].clone(), img);
            }
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
            "end" => scenes.push(cur.take().expect("end without scene")),
            _ => cur.as_mut().expect("op outside scene").ops.push(f),
        }
    }
    assert!(cur.is_none(), "unterminated scene");
    Fixture { images, scenes }
}

fn num(s: &str) -> f64 {
    s.parse().unwrap_or_else(|_| panic!("number: {s:?}"))
}

/// JS `Math.round` (half towards +∞).
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Port of `drawYieldLine` (`render/cityOkolicaOverlay.ts:145-179`).
fn yield_line(
    c: &mut Canvas2dLite,
    cx: f64,
    y: f64,
    emoji_s: &str,
    value: &str,
    font_px: f64,
    worked: bool,
) {
    let emoji_px = if worked {
        js_round(font_px * 1.1)
    } else {
        font_px
    };
    let digit_px = if worked {
        js_round(font_px * 1.28)
    } else {
        font_px
    };
    let ef = format!(
        "{emoji_px}px \"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif"
    );
    let df = format!("bold {digit_px}px Arial, Helvetica, sans-serif");
    c.set_text_align("left");
    c.set_text_baseline("top");
    c.set_shadow_color("transparent");
    c.set_shadow_blur(0.0);
    let emoji_w = emoji::measure_text(&ef, emoji_s).expect("font");
    let num_w = emoji::measure_text(&df, value).expect("font");
    let mut x = cx - (emoji_w + num_w) / 2.0;
    c.set_fill_style("rgba(255,255,255,0.95)");
    let es = TextStyle::new(&ef, "left", "top").expect("style");
    emoji::fill_text(c, &es, emoji_s, x, y);
    x += emoji_w;
    c.set_fill_style(if worked { "#e0b24a" } else { "#fffef8" });
    c.set_shadow_color(if worked {
        "rgba(0,0,0,0.75)"
    } else {
        "rgba(0,0,0,0.45)"
    });
    c.set_shadow_blur(if worked { 3.0 } else { 2.0 });
    c.set_shadow_offset_y(1.0);
    let ds = TextStyle::new(&df, "left", "top").expect("style");
    emoji::fill_text(c, &ds, value, x, y - if worked { 2.0 } else { 0.0 });
    c.set_shadow_color("transparent");
    c.set_shadow_blur(0.0);
}

fn play(fx: &Fixture, sc: &Scene) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(sc.w, sc.h).expect("size");
    // Canvas defaults, tracked for the emoji-aware fillText.
    let mut font = String::from("10px sans-serif");
    let mut align = String::from("start");
    let mut baseline = String::from("alphabetic");
    for op in &sc.ops {
        let a = &op[1..];
        let n = |i: usize| num(&a[i]);
        match op[0].as_str() {
            "fillStyle" => assert!(c.set_fill_style(&a[0]), "{}: fillStyle", sc.name),
            "strokeStyle" => assert!(c.set_stroke_style(&a[0]), "{}: strokeStyle", sc.name),
            "lineWidth" => c.set_line_width(n(0)),
            "shadowColor" => assert!(c.set_shadow_color(&a[0])),
            "shadowBlur" => c.set_shadow_blur(n(0)),
            "shadowOffsetY" => c.set_shadow_offset_y(n(0)),
            "font" => {
                assert!(c.set_font(&a[0]), "{}: font {:?}", sc.name, a[0]);
                font.clone_from(&a[0]);
            }
            "textAlign" => {
                assert!(c.set_text_align(&a[0]));
                align.clone_from(&a[0]);
            }
            "textBaseline" => {
                assert!(c.set_text_baseline(&a[0]));
                baseline.clone_from(&a[0]);
            }
            "save" => c.save(),
            "restore" => c.restore(),
            "translate" => c.translate(n(0), n(1)),
            "rotate" => c.rotate(n(0)),
            "setTransform" => c.set_transform(n(0), n(1), n(2), n(3), n(4), n(5)),
            "beginPath" => c.begin_path(),
            "moveTo" => c.move_to(n(0), n(1)),
            "arcTo" => c.arc_to(n(0), n(1), n(2), n(3), n(4)).expect("arcTo"),
            "arc" => c
                .arc(n(0), n(1), n(2), n(3), n(4), a[5] == "true")
                .expect("arc"),
            "closePath" => c.close_path(),
            "fill" => c.fill(),
            "stroke" => c.stroke(),
            "clip" => c.clip(),
            "clearRect" => c.clear_rect(n(0), n(1), n(2), n(3)),
            "drawImage" => match &fx.images[&a[0]] {
                Img::Bitmap(b) => draw_bitmap(&mut c, b, n(1), n(2), n(3), n(4)),
                Img::Svg(s) => draw_svg(&mut c, s, n(1), n(2), n(3), n(4)),
            },
            "fillText" => {
                let st = TextStyle::new(&font, &align, &baseline).expect("style");
                emoji::fill_text(&mut c, &st, &a[0], n(1), n(2));
            }
            "yieldLine" => {
                yield_line(&mut c, n(0), n(1), &a[2], &a[3], n(4), a[5] == "true");
                // drawYieldLine leaves these values in the context.
                font = format!("bold {}px Arial, Helvetica, sans-serif", {
                    let fp = n(4);
                    if a[5] == "true" {
                        js_round(fp * 1.28)
                    } else {
                        fp
                    }
                });
                align = "left".into();
                baseline = "top".into();
            }
            other => panic!("{}: unknown op {other}", sc.name),
        }
    }
    c
}

fn render_all(fx: &Fixture) -> Vec<(&Scene, Canvas2dLite)> {
    fx.scenes.iter().map(|sc| (sc, play(fx, sc))).collect()
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
fn scenes_match_chromium() {
    let fx = load();
    let all = render_all(&fx);
    for prefix in [
        "t1_",
        "t2_",
        "t3_",
        "t10_",
        "t11_",
        "t12_",
        "t13_",
        "t14_medallion",
    ] {
        assert!(
            all.iter().any(|(s, _)| s.name.starts_with(prefix)),
            "dispatch requires {prefix} scenes"
        );
    }
    let mut failures = Vec::new();
    println!("scene | size | max_abs | mean_abs | px>16 % | ssim | source");
    for (sc, c) in &all {
        if let Some(dir) = std::env::var_os("IMAGE_DUMP") {
            let p = std::path::Path::new(&dir).join(format!("{}.rgba", sc.name));
            std::fs::write(p, c.pixels_premultiplied()).expect("dump");
        }
        let d = diff_vs_chromium(sc, c);
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
        let max_mean = MEAN_ABS_EXCEPTIONS
            .iter()
            .find(|(n, _)| *n == sc.name)
            .map_or(MAX_MEAN_ABS, |(_, m)| *m);
        if d.ssim < MIN_SSIM || d.mean_abs > max_mean || d.frac_px_over_16 > MAX_FRAC_PX_OVER_16 {
            failures.push(sc.name.clone());
        }
    }
    assert!(failures.is_empty(), "scenes over threshold: {failures:?}");
}

#[test]
fn scenes_match_golden_hashes() {
    let fx = load();
    let all = render_all(&fx);
    let mut out = String::from(
        "# R-RUSTPORT-P4-30 golden FNV-1a 64 of the premultiplied RGBA8 buffer per scene\n",
    );
    for (sc, c) in &all {
        writeln!(out, "{}\t{:016x}", sc.name, c.rgba_hash()).expect("write");
    }
    print!("{out}");
    let path = fixture("golden.tsv");
    if std::env::var_os("IMAGE_BLESS").is_some() {
        std::fs::write(&path, &out).expect("bless golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv");
    assert_eq!(
        out, want,
        "golden hashes changed (IMAGE_BLESS=1 to re-bless)"
    );
}

#[test]
fn rendering_twice_is_identical() {
    let fx = load();
    let a = render_all(&fx);
    let b = render_all(&fx);
    for ((sa, ca), (_, cb)) in a.iter().zip(&b) {
        assert_eq!(
            ca.pixels_premultiplied(),
            cb.pixels_premultiplied(),
            "{}",
            sa.name
        );
    }
}
