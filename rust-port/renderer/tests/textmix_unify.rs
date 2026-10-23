//! RR-T8f — the RR-T8c emoji entry points and the unified `Canvas2dLite`
//! text API give the same result (R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1,
//! `P4-35-TEXT-EMOJI-UNIFY.md` §2, §6).
//!
//! 1. `image_text_scenes_through_canvas_fill_text_match_rr_t8c_golden` —
//!    every RR-T8c scene without `drawImage` (`tests/fixtures/image/
//!    scenes.tsv`: T1 🔥, T2 ⚔, T3 ☠, T10 fallback glyph, T12 👤, T13
//!    🍞🔨💰 + digits, the `x_emoji_*` scenes) replayed with
//!    `Canvas2dLite::fill_text` / `measure_text` only — no
//!    `raster::image::emoji` call — hashes **bit for bit** equal to the
//!    RR-T8c golden (`image/golden.tsv`, drawn there through
//!    `emoji::fill_text`).
//! 2. `emoji_measure_text_is_canvas_measure_text` — `emoji::measure_text`
//!    and `Canvas2dLite::measure_text` agree (`to_bits`) on every row of
//!    `image/widths.tsv` and `textmix/widths.tsv`.
//! 3. `fill_text_draws_colour_glyphs_not_notdef` — Z-30-4 closed: `👤` in a
//!    plain `bold 16px Arial` through `fill_text` is a colour bitmap, ⚔ ☠ ◆
//!    stay monochrome in the fill colour.
//! 4. `text_without_colour_glyphs_is_the_rr_t8b_pipeline` — strings with no
//!    colour glyph: width = `shape_text` (bit for bit). (Pixels: the RR-T8b
//!    goldens `text/golden.tsv` and the RR-T8a/MOD-08/MOD-10 goldens are
//!    unchanged — their own tests.)

use std::collections::HashMap;

use civ_renderer::raster::image::emoji;
use civ_renderer::raster::text::{parse_font, shape_text};
use civ_renderer::raster::Canvas2dLite;

fn fixture(rel: &str) -> String {
    let p = format!("{}/tests/fixtures/{rel}", env!("CARGO_MANIFEST_DIR"));
    std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{p}: {e}"))
}

fn rows(rel: &str) -> Vec<Vec<String>> {
    fixture(rel)
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| l.split('\t').map(str::to_owned).collect())
        .collect()
}

fn num(s: &str) -> f64 {
    s.parse().unwrap_or_else(|_| panic!("number: {s:?}"))
}

/// JS `Math.round` (half towards +∞).
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Port of `drawYieldLine` (`render/cityOkolicaOverlay.ts:145-179`) on the
/// unified API (`ctx.font = …; ctx.measureText(…)` / `ctx.fillText(…)`).
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
    assert!(c.set_font(&ef));
    let emoji_w = c.measure_text(emoji_s).width;
    assert!(c.set_font(&df));
    let num_w = c.measure_text(value).width;
    let mut x = cx - (emoji_w + num_w) / 2.0;
    assert!(c.set_font(&ef));
    c.set_fill_style("rgba(255,255,255,0.95)");
    c.fill_text(emoji_s, x, y);
    x += emoji_w;
    assert!(c.set_font(&df));
    c.set_fill_style(if worked { "#e0b24a" } else { "#fffef8" });
    c.set_shadow_color(if worked {
        "rgba(0,0,0,0.75)"
    } else {
        "rgba(0,0,0,0.45)"
    });
    c.set_shadow_blur(if worked { 3.0 } else { 2.0 });
    c.set_shadow_offset_y(1.0);
    c.fill_text(value, x, y - if worked { 2.0 } else { 0.0 });
    c.set_shadow_color("transparent");
    c.set_shadow_blur(0.0);
}

struct Scene {
    name: String,
    w: u32,
    h: u32,
    ops: Vec<Vec<String>>,
}

/// RR-T8c scenes without images.
fn image_text_scenes() -> Vec<Scene> {
    let mut out = Vec::new();
    let mut cur: Option<Scene> = None;
    for f in rows("image/scenes.tsv") {
        match f[0].as_str() {
            "image" => {}
            "scene" => {
                cur = Some(Scene {
                    name: f[1].clone(),
                    w: f[2].parse().expect("w"),
                    h: f[3].parse().expect("h"),
                    ops: Vec::new(),
                });
            }
            "end" => {
                let sc = cur.take().expect("end");
                if !sc.ops.iter().any(|o| o[0] == "drawImage") {
                    out.push(sc);
                }
            }
            _ => cur.as_mut().expect("op").ops.push(f),
        }
    }
    out
}

fn play(sc: &Scene) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(sc.w, sc.h).expect("size");
    for op in &sc.ops {
        let a = &op[1..];
        let n = |i: usize| num(&a[i]);
        match op[0].as_str() {
            "fillStyle" => assert!(c.set_fill_style(&a[0])),
            "strokeStyle" => assert!(c.set_stroke_style(&a[0])),
            "lineWidth" => c.set_line_width(n(0)),
            "shadowColor" => assert!(c.set_shadow_color(&a[0])),
            "shadowBlur" => c.set_shadow_blur(n(0)),
            "shadowOffsetY" => c.set_shadow_offset_y(n(0)),
            "font" => assert!(c.set_font(&a[0])),
            "textAlign" => assert!(c.set_text_align(&a[0])),
            "textBaseline" => assert!(c.set_text_baseline(&a[0])),
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
            "fillText" => c.fill_text(&a[0], n(1), n(2)),
            "yieldLine" => yield_line(&mut c, n(0), n(1), &a[2], &a[3], n(4), a[5] == "true"),
            other => panic!("{}: unknown op {other}", sc.name),
        }
    }
    c
}

#[test]
fn image_text_scenes_through_canvas_fill_text_match_rr_t8c_golden() {
    let golden: HashMap<String, String> = rows("image/golden.tsv")
        .into_iter()
        .map(|r| (r[0].clone(), r[1].clone()))
        .collect();
    let scenes = image_text_scenes();
    assert_eq!(scenes.len(), 18, "RR-T8c scenes without drawImage");
    let mut bad = Vec::new();
    for sc in &scenes {
        let got = format!("{:016x}", play(sc).rgba_hash());
        let want = &golden[&sc.name];
        println!("{}\t{got}\t{want}", sc.name);
        if &got != want {
            bad.push(sc.name.clone());
        }
    }
    assert!(bad.is_empty(), "differs from RR-T8c golden: {bad:?}");
}

#[test]
fn emoji_measure_text_is_canvas_measure_text() {
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    let mut n = 0;
    for file in ["image/widths.tsv", "textmix/widths.tsv"] {
        for r in rows(file) {
            let text = r[1].replace("\\t", "\t");
            assert!(c.set_font(&r[0]));
            let a = c.measure_text(&text).width;
            let b = emoji::measure_text(&r[0], &text).expect("font");
            assert_eq!(a.to_bits(), b.to_bits(), "{} {:?}", r[0], text);
            n += 1;
        }
    }
    assert_eq!(n, 255 + 308);
    assert_eq!(emoji::measure_text("not a font", "x"), None);
}

/// (R, G, B, A) of every pixel with alpha > 0 (straight).
fn painted(c: &Canvas2dLite) -> Vec<[u8; 4]> {
    c.to_rgba8_straight()
        .chunks_exact(4)
        .filter(|p| p[3] > 0)
        .map(|p| [p[0], p[1], p[2], p[3]])
        .collect()
}

#[test]
fn fill_text_draws_colour_glyphs_not_notdef() {
    // Z-30-4: before RR-T8f this drew the `.notdef` box of Liberation Sans
    // Bold in the fill colour (black).
    let mut c = Canvas2dLite::new(40, 30).expect("canvas");
    assert!(c.set_font("bold 16px Segoe UI, Arial"));
    c.set_text_baseline("middle");
    c.set_fill_style("#000000");
    c.fill_text("👤", 4.0, 15.0);
    let px = painted(&c);
    assert!(px.len() > 50, "the glyph is drawn");
    let coloured = px.iter().filter(|p| p[0].max(p[1]).max(p[2]) > 60).count();
    assert!(
        coloured > 20,
        "colour bitmap, not a black outline: {coloured}"
    );
    // Width: the bitmap advance (136 · 16 / 109, 16.16), not `.notdef`.
    let g = emoji::color_glyph('👤').expect("glyph");
    assert_eq!(
        c.measure_text("👤").width.to_bits(),
        emoji::color_advance(&g, 16.0).to_bits()
    );
    // ⚔ ☠ ◆ (text presentation): monochrome, in the fill colour only.
    for s in ["⚔", "☠", "◆"] {
        let mut m = Canvas2dLite::new(40, 30).expect("canvas");
        assert!(m.set_font("bold 16px Segoe UI, Arial"));
        m.set_text_baseline("middle");
        m.set_fill_style("#20a040");
        m.fill_text(s, 4.0, 15.0);
        let px = painted(&m);
        assert!(px.len() > 10, "{s} drawn");
        // Straight RGB of a partly covered pixel is rounded by the
        // un-premultiplication; opaque-enough pixels must be the fill colour.
        assert!(
            px.iter().filter(|p| p[3] >= 128).all(|p| {
                p[..3]
                    .iter()
                    .zip([0x20u8, 0xa0, 0x40])
                    .all(|(a, b)| a.abs_diff(b) <= 1)
            }),
            "{s}: monochrome in the fill colour"
        );
    }
}

#[test]
fn text_without_colour_glyphs_is_the_rr_t8b_pipeline() {
    let fonts = [
        "bold 13px Segoe UI, Arial",
        "700 22px Georgia, \"Times New Roman\", serif",
        "bold 104px \"Segoe UI Symbol\", \"Segoe UI Emoji\", \"Segoe UI\", Arial, sans-serif",
        "16px \"Segoe UI Emoji\", \"Apple Color Emoji\", \"Noto Color Emoji\", sans-serif",
        // Fractional size + > 256 px: an f32 width would differ from the
        // RR-T8b f64 one, so ⚔ ☠ (in the Noto subset, but drawn from DejaVu
        // in this stack) must not switch the string to the colour path.
        "bold 20.3px Arial, sans-serif",
    ];
    let texts = [
        "Zbrojmistrz 12",
        "⚔ OBLĘŻENIE",
        "⚔ OBLĘŻENIE ☠ GŁÓD ⚔ OBLĘŻENIE ☠ GŁÓD",
        "☠",
        "◆ 7 ◆",
        "a\tb",
        "",
        "KARTAGENA",
    ];
    for f in fonts {
        let spec = parse_font(f).expect("font");
        for t in texts {
            if f.contains("Noto") && (t.contains('⚔') || t.contains('☠')) {
                continue; // colour glyphs in that stack (emoji face first)
            }
            let mut c = Canvas2dLite::new(1, 1).expect("canvas");
            assert!(c.set_font(f));
            assert_eq!(
                c.measure_text(t).width.to_bits(),
                shape_text(&spec, t).width.to_bits(),
                "{f} {t:?}"
            );
        }
    }
}
