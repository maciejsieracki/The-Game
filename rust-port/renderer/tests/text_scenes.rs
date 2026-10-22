//! RR-T8b scene tests (R-RUSTPORT-P4-29-TEXT-FONTS-Q1).
//!
//! `tests/fixtures/text/scenes.tsv` holds the web text producers T5, T6, T9,
//! T15 (whole canvases: shapes + text), the text parts of T10, T13, T14 and
//! semantic scenes, transcribed from pin `edb8fb56` by `gen.mjs` (each scene
//! names its `file:line`). The same op list was replayed in a real Chromium
//! 141 Canvas 2D with the same bundled fonts (`ref/<scene>.rgba`).
//!
//! 1. `scenes_match_chromium` — per-scene SSIM / mean_abs / px>16 limits
//!    (ZAŁOŻENIE: the RR-T8a limits, D-TXT-4 = A; full table printed).
//! 2. `scenes_match_golden_hashes` — FNV-1a 64 of the premultiplied buffer
//!    equals `golden.tsv` (determinism across runs and toolchains). Re-bless
//!    with `TEXT_BLESS=1 cargo test --test text_scenes` only after a
//!    deliberate, reviewed change.
//! 3. `rendering_twice_is_identical`.
//! 4. `manifest_lists_every_fixture` — `MANIFEST.sha256` names every file.

use std::collections::HashMap;
use std::fmt::Write as _;

use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};
use civ_renderer::raster::{Canvas2dLite, CanvasGradient};

/// ZAŁOŻENIE (same as RR-T8a `tests/raster_scenes.rs`, D-TXT-4 = A).
const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/text/{rel}", env!("CARGO_MANIFEST_DIR"))
}

struct Scene {
    name: String,
    w: u32,
    h: u32,
    src: String,
    ops: Vec<Vec<String>>,
}

fn load_scenes() -> Vec<Scene> {
    let text = std::fs::read_to_string(fixture("scenes.tsv")).expect("scenes.tsv");
    let mut out = Vec::new();
    let mut cur: Option<Scene> = None;
    for line in text.lines() {
        if line.starts_with('#') || line.is_empty() {
            continue;
        }
        let f: Vec<String> = line.split('\t').map(str::to_owned).collect();
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

fn num(s: &str) -> f64 {
    s.parse().unwrap_or_else(|_| panic!("number: {s:?}"))
}

fn play(sc: &Scene) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(sc.w, sc.h).expect("size");
    let mut grads: HashMap<String, CanvasGradient> = HashMap::new();
    for op in &sc.ops {
        let a = &op[1..];
        let n = |i: usize| num(&a[i]);
        match op[0].as_str() {
            "fillStyle" => assert!(c.set_fill_style(&a[0]), "{}: fillStyle", sc.name),
            "strokeStyle" => assert!(c.set_stroke_style(&a[0]), "{}: strokeStyle", sc.name),
            "fillGrad" => c.set_fill_style_gradient(&grads[&a[0]]),
            "lineWidth" => c.set_line_width(n(0)),
            "lineJoin" => assert!(c.set_line_join(&a[0])),
            "shadowColor" => assert!(c.set_shadow_color(&a[0])),
            "shadowBlur" => c.set_shadow_blur(n(0)),
            "shadowOffsetY" => c.set_shadow_offset_y(n(0)),
            // `bogus` probes the "invalid value is ignored" rule.
            "font" => assert_eq!(
                c.set_font(&a[0]),
                a[0] != "bogus",
                "{}: font {:?}",
                sc.name,
                a[0]
            ),
            "textAlign" => assert_eq!(c.set_text_align(&a[0]), a[0] != "bogus"),
            "textBaseline" => assert!(c.set_text_baseline(&a[0])),
            "grad" => {
                let g = c.create_linear_gradient(n(1), n(2), n(3), n(4));
                grads.insert(a[0].clone(), g);
            }
            "stop" => grads
                .get_mut(&a[0])
                .expect("gradient id")
                .add_color_stop(n(1), &a[2])
                .expect("addColorStop"),
            "save" => c.save(),
            "restore" => c.restore(),
            "translate" => c.translate(n(0), n(1)),
            "rotate" => c.rotate(n(0)),
            "setTransform" => c.set_transform(n(0), n(1), n(2), n(3), n(4), n(5)),
            "beginPath" => c.begin_path(),
            "moveTo" => c.move_to(n(0), n(1)),
            "lineTo" => c.line_to(n(0), n(1)),
            "arc" => c
                .arc(n(0), n(1), n(2), n(3), n(4), a[5] == "true")
                .expect("arc"),
            "roundRect" => c
                .round_rect(n(0), n(1), n(2), n(3), n(4))
                .expect("roundRect"),
            "closePath" => c.close_path(),
            "fill" => c.fill(),
            "stroke" => c.stroke(),
            "fillRect" => c.fill_rect(n(0), n(1), n(2), n(3)),
            "strokeRect" => c.stroke_rect(n(0), n(1), n(2), n(3)),
            "clearRect" => c.clear_rect(n(0), n(1), n(2), n(3)),
            "fillText" => c.fill_text(&a[0], n(1), n(2)),
            "strokeText" => c.stroke_text(&a[0], n(1), n(2)),
            other => panic!("{}: unknown op {other}", sc.name),
        }
    }
    c
}

fn render_all() -> Vec<(Scene, Canvas2dLite)> {
    load_scenes()
        .into_iter()
        .map(|sc| {
            let c = play(&sc);
            (sc, c)
        })
        .collect()
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
    let all = render_all();
    for prefix in ["t5_", "t6_", "t9_", "t15_"] {
        assert!(
            all.iter().any(|(s, _)| s.name.starts_with(prefix)),
            "dispatch requires {prefix} scenes"
        );
    }
    let mut failures = Vec::new();
    println!("scene | size | max_abs | mean_abs | px>16 % | ssim | source");
    for (sc, c) in &all {
        if let Some(dir) = std::env::var_os("TEXT_DUMP") {
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
        if d.ssim < MIN_SSIM || d.mean_abs > MAX_MEAN_ABS || d.frac_px_over_16 > MAX_FRAC_PX_OVER_16
        {
            failures.push(sc.name.clone());
        }
    }
    assert!(failures.is_empty(), "scenes over threshold: {failures:?}");
}

#[test]
fn scenes_match_golden_hashes() {
    let all = render_all();
    let mut out = String::from(
        "# R-RUSTPORT-P4-29 golden FNV-1a 64 of the premultiplied RGBA8 buffer per scene\n",
    );
    for (sc, c) in &all {
        writeln!(out, "{}\t{:016x}", sc.name, c.rgba_hash()).expect("write");
    }
    print!("{out}");
    let path = fixture("golden.tsv");
    if std::env::var_os("TEXT_BLESS").is_some() {
        std::fs::write(&path, &out).expect("bless golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv");
    assert_eq!(
        out, want,
        "golden hashes changed (TEXT_BLESS=1 to re-bless)"
    );
}

#[test]
fn rendering_twice_is_identical() {
    let a = render_all();
    let b = render_all();
    for ((sa, ca), (_, cb)) in a.iter().zip(&b) {
        assert_eq!(
            ca.pixels_premultiplied(),
            cb.pixels_premultiplied(),
            "{}",
            sa.name
        );
    }
}

#[test]
fn manifest_lists_every_fixture() {
    let man = std::fs::read_to_string(fixture("MANIFEST.sha256")).expect("manifest");
    let listed: Vec<&str> = man
        .lines()
        .filter_map(|l| l.split_whitespace().nth(1))
        .collect();
    for sc in load_scenes() {
        let f = format!("ref/{}.rgba", sc.name);
        assert!(listed.contains(&f.as_str()), "{f} not in MANIFEST.sha256");
    }
    for f in [
        "gen.mjs",
        "scenes.tsv",
        "widths.tsv",
        "truncate.tsv",
        "baselines.tsv",
        "fontparse.tsv",
        "upper.tsv",
        "city_names.txt",
        "versions.txt",
    ] {
        assert!(listed.contains(&f), "{f} not in MANIFEST.sha256");
    }
}
