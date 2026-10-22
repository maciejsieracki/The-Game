//! RR-T8a scene tests (R-RUSTPORT-P4-28-RASTER-SHAPES-Q1).
//!
//! `tests/fixtures/raster/scenes.tsv` holds the shape part of the web Canvas
//! producers T1–T15 (+ H1) and semantic edge scenes, transcribed from pin
//! `edb8fb56` by `gen.mjs` (each scene names its `file:line`). The same op
//! list was replayed on a real Chromium `CanvasRenderingContext2D`
//! (`ref/<scene>.rgba`, straight RGBA8 from `getImageData`).
//!
//! Three checks:
//! 1. **Agreement with Chromium** (`scenes_match_chromium`): bit-exact is
//!    impossible (different AA scan converters), so every scene must stay
//!    within the thresholds below (ZAŁOŻENIE for the owner decision D-TXT-4,
//!    `P4-28-RASTER-SHAPES.md` §5). The full table is printed.
//! 2. **Determinism** (`scenes_match_golden_hashes`): FNV-1a 64 of the
//!    premultiplied buffer equals `golden.tsv` bit for bit (same on rustc
//!    1.87.0 and the newest toolchain — logged in the topic document). Re-bless
//!    with `RASTER_BLESS=1 cargo test --test raster_scenes` only after a
//!    deliberate, reviewed change.
//! 3. **Repeatability** (`rendering_twice_is_identical`).

use std::collections::HashMap;

use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};
use civ_renderer::raster::{Canvas2dLite, CanvasGradient, RasterImage};

/// ZAŁOŻENIE (D-TXT-4, to be revised by the owner): per-scene limits.
const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;
/// Minimum number of scenes required by the dispatch (≥ 30 T1–T15 uses).
const MIN_SCENES: usize = 30;

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/raster/{rel}", env!("CARGO_MANIFEST_DIR"))
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

/// Executes one scene on `Canvas2dLite`; `done` holds earlier scenes
/// (sources for `drawImage`).
fn play(sc: &Scene, done: &HashMap<String, Canvas2dLite>) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(sc.w, sc.h).expect("size");
    let mut grads: HashMap<String, CanvasGradient> = HashMap::new();
    for op in &sc.ops {
        let a = &op[1..];
        let n = |i: usize| num(&a[i]);
        match op[0].as_str() {
            "fillStyle" => assert!(c.set_fill_style(&a[0]), "{}: fillStyle {:?}", sc.name, a[0]),
            "strokeStyle" => assert!(c.set_stroke_style(&a[0]), "{}: strokeStyle", sc.name),
            "fillGrad" => c.set_fill_style_gradient(&grads[&a[0]]),
            "lineWidth" => c.set_line_width(n(0)),
            "lineJoin" => assert!(c.set_line_join(&a[0])),
            "shadowColor" => assert!(c.set_shadow_color(&a[0])),
            "shadowBlur" => c.set_shadow_blur(n(0)),
            "shadowOffsetY" => c.set_shadow_offset_y(n(0)),
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
            "quadraticCurveTo" => c.quadratic_curve_to(n(0), n(1), n(2), n(3)),
            "arc" => c
                .arc(n(0), n(1), n(2), n(3), n(4), a[5] == "true")
                .expect("arc"),
            "arcTo" => c.arc_to(n(0), n(1), n(2), n(3), n(4)).expect("arcTo"),
            "roundRect" => c
                .round_rect(n(0), n(1), n(2), n(3), n(4))
                .expect("roundRect"),
            "closePath" => c.close_path(),
            "fill" => c.fill(),
            "stroke" => c.stroke(),
            "clip" => c.clip(),
            "fillRect" => c.fill_rect(n(0), n(1), n(2), n(3)),
            "strokeRect" => c.stroke_rect(n(0), n(1), n(2), n(3)),
            "clearRect" => c.clear_rect(n(0), n(1), n(2), n(3)),
            "drawImage" => {
                let src = done.get(&a[0]).expect("drawImage source scene");
                assert_eq!(src.width(), num(&a[1]) as u32);
                assert_eq!(src.height(), num(&a[2]) as u32);
                let img = RasterImage::from_canvas(src);
                c.draw_image(&img, n(3), n(4), n(5), n(6));
            }
            other => panic!("{}: unknown op {other}", sc.name),
        }
    }
    c
}

fn render_all() -> Vec<(Scene, Canvas2dLite)> {
    let mut done: HashMap<String, Canvas2dLite> = HashMap::new();
    let mut out = Vec::new();
    for sc in load_scenes() {
        let c = play(&sc, &done);
        done.insert(sc.name.clone(), c.clone());
        out.push((sc, c));
    }
    out
}

fn chromium_premul(sc: &Scene) -> Vec<u8> {
    let path = fixture(&format!("ref/{}.rgba", sc.name));
    let straight = std::fs::read(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
    assert_eq!(straight.len(), (sc.w * sc.h * 4) as usize, "{path}: size");
    premultiply_straight(&straight)
}

fn diff_vs_chromium(sc: &Scene, c: &Canvas2dLite) -> ImageDiff {
    compare_premultiplied(
        c.pixels_premultiplied(),
        &chromium_premul(sc),
        sc.w as usize,
        sc.h as usize,
    )
}

#[test]
fn scenes_match_chromium() {
    let all = render_all();
    assert!(all.len() >= MIN_SCENES, "only {} scenes", all.len());
    let producers = all
        .iter()
        .filter(|(s, _)| s.name.starts_with('t') || s.name.starts_with('h'))
        .count();
    let mut failures = Vec::new();
    println!("scene | size | max_abs | mean_abs | px>16 % | ssim | source");
    for (sc, c) in &all {
        if let Some(dir) = std::env::var_os("RASTER_DUMP") {
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
    assert!(producers >= MIN_SCENES, "only {producers} T1–T15/H1 scenes");
}

fn golden() -> HashMap<String, u64> {
    let text = std::fs::read_to_string(fixture("golden.tsv")).expect("golden.tsv");
    text.lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| {
            let (n, h) = l.split_once('\t').expect("name\\thash");
            (n.to_owned(), u64::from_str_radix(h, 16).expect("hex hash"))
        })
        .collect()
}

#[test]
fn scenes_match_golden_hashes() {
    let all = render_all();
    if std::env::var_os("RASTER_BLESS").is_some() {
        let mut s = String::from(
            "# FNV-1a 64 of Canvas2dLite premultiplied RGBA8 per scene (tests/raster_scenes.rs)\n",
        );
        for (sc, c) in &all {
            s.push_str(&format!("{}\t{:016x}\n", sc.name, c.rgba_hash()));
        }
        std::fs::write(fixture("golden.tsv"), s).expect("write golden.tsv");
        return;
    }
    let g = golden();
    assert_eq!(g.len(), all.len(), "golden.tsv scene count");
    let mut bad = Vec::new();
    for (sc, c) in &all {
        let want = g.get(&sc.name).copied();
        let got = c.rgba_hash();
        println!("{}\t{got:016x}", sc.name);
        if want != Some(got) {
            bad.push(format!("{}: got {got:016x}, want {want:016x?}", sc.name));
        }
    }
    assert!(bad.is_empty(), "golden mismatch: {bad:#?}");
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
fn manifest_hashes_are_listed_for_every_reference() {
    // The manifest (sha256, written by gen.mjs) must list every ref file and
    // the scene list; content hashing itself is verified by `sha256sum -c`
    // in the topic document (no sha256 implementation in this crate).
    let man = std::fs::read_to_string(fixture("MANIFEST.sha256")).expect("MANIFEST");
    for sc in load_scenes() {
        let entry = format!("  ref/{}.rgba", sc.name);
        assert!(man.contains(&entry), "manifest misses {entry}");
    }
    for f in ["gen.mjs", "scenes.tsv", "colors.tsv", "versions.txt"] {
        assert!(man.contains(&format!("  {f}\n")), "manifest misses {f}");
    }
}
