//! RR-T8e pixel tests (R-RUSTPORT-P4-34-ANCHORS-DOM-Q1).
//!
//! `tests/fixtures/labels/ref/<scene>.rgba` are page screenshots of the
//! web's real label DOM/CSS in Chromium 141 (`gen.mjs`; straight RGBA8, the
//! border box at `(margin, margin)`, `transform: none`). The Rust texture of
//! the same label must be within the RR-T8a–c limits (ZAŁOŻENIE: D-TXT-4 = A
//! limits, dispatch: SSIM ≥ 0.985, mean_abs ≤ 1.5, px>16 ≤ 5 %), with the
//! exceptions listed (and justified) below.
//!
//! 1. `scenes_match_chromium` — every scene, full table printed.
//! 2. `scenes_match_golden_hashes` — FNV-1a 64 of the premultiplied texture
//!    equals `golden.tsv` (determinism across runs and toolchains). Re-bless
//!    with `LABELS_BLESS=1 cargo test --test labels_scenes` only after a
//!    deliberate, reviewed change, then update the `golden.tsv` line of
//!    `MANIFEST.sha256` (`sha256sum golden.tsv`, or rerun `gen.mjs`):
//!    `fixtures_match_manifest_sha256` fails until both agree.
//! 3. `float_frames_fade_like_css` — the fade frames (p = 0, 0.25, 0.5) are
//!    the opaque texture × `1 − p²`, and match Chromium's `opacity`.

use std::fmt::Write as _;

use civ_renderer::labels::Label;
use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};

const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

/// `(scene, min SSIM, max mean_abs, max px>16)` overriding the limits; each
/// bound is the measured value rounded outwards (a regression still fails).
/// Reasons: `P4-34-ANCHORS-DOM.md` §5.2.
const EXCEPTIONS: &[(&str, f64, f64, f64)] = &[];

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/labels/{rel}", env!("CARGO_MANIFEST_DIR"))
}

struct Scene {
    name: String,
    label: Label,
    w: u32,
    h: u32,
    dsf: f64,
    opacity: f32,
}

fn scenes() -> Vec<Scene> {
    let text = std::fs::read_to_string(fixture("scenes.tsv")).expect("scenes.tsv");
    let mut out = Vec::new();
    for line in text
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
    {
        let f: Vec<&str> = line.split('\t').collect();
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
        out.push(Scene {
            name: f[1].to_owned(),
            label,
            w: f[3].parse().unwrap(),
            h: f[4].parse().unwrap(),
            dsf: f[6].parse().unwrap(),
            opacity: if f[7] == "-" {
                1.0
            } else {
                f[7].parse().unwrap()
            },
        });
    }
    out
}

fn diff(s: &Scene) -> (ImageDiff, usize, usize) {
    let t = s.label.render(s.dsf, s.opacity);
    // LABELS_DUMP=<dir>: write the Rust texture (straight RGBA8) for
    // side-by-side sheets (`P4-34-ANCHORS-DOM.md` §5).
    if let Some(dir) = std::env::var_os("LABELS_DUMP") {
        let p = std::path::Path::new(&dir).join(format!("{}.rgba", s.name));
        std::fs::write(p, t.to_straight()).expect("dump");
    }
    let reference = std::fs::read(fixture(&format!("ref/{}.rgba", s.name))).expect("ref");
    // The generator's texture size (CSS px) times the device scale.
    assert_eq!(
        (f64::from(t.width), f64::from(t.height)),
        (f64::from(s.w) * s.dsf, f64::from(s.h) * s.dsf),
        "{}: texture size",
        s.name
    );
    let (w, h) = (t.width as usize, t.height as usize);
    assert_eq!(reference.len(), w * h * 4, "{}: ref size", s.name);
    (
        compare_premultiplied(&t.rgba, &premultiply_straight(&reference), w, h),
        w,
        h,
    )
}

#[test]
fn scenes_match_chromium() {
    let mut table =
        String::from("scene                          size      max   mean   px>16%   SSIM\n");
    let mut bad = Vec::new();
    let all = scenes();
    for s in &all {
        let (d, w, h) = diff(s);
        let _ = writeln!(
            table,
            "{:<30} {:>4}x{:<4} {:>4} {:>6.3} {:>7.3} {:>7.4}",
            s.name,
            w,
            h,
            d.max_abs,
            d.mean_abs,
            d.frac_px_over_16 * 100.0,
            d.ssim
        );
        let (min_ssim, max_mean, max_frac) = EXCEPTIONS
            .iter()
            .find(|e| e.0 == s.name)
            .map_or((MIN_SSIM, MAX_MEAN_ABS, MAX_FRAC_PX_OVER_16), |e| {
                (e.1, e.2, e.3)
            });
        if d.ssim < min_ssim || d.mean_abs > max_mean || d.frac_px_over_16 > max_frac {
            bad.push(s.name.clone());
        }
    }
    println!("{table}");
    assert!(all.len() >= 40, "{}", all.len());
    assert!(
        bad.is_empty(),
        "scenes outside the limits: {bad:?}\n{table}"
    );
    for e in EXCEPTIONS {
        assert!(all.iter().any(|s| s.name == e.0), "stale exception {}", e.0);
    }
}

#[test]
fn scenes_match_golden_hashes() {
    let path = fixture("golden.tsv");
    let mut got = String::from(
        "# scene<TAB>FNV-1a 64 of the premultiplied texture (LABELS_BLESS=1 to rewrite)\n",
    );
    for s in scenes() {
        let t = s.label.render(s.dsf, s.opacity);
        let _ = writeln!(got, "{}\t{:016x}", s.name, t.hash());
    }
    print!("{got}");
    if std::env::var_os("LABELS_BLESS").is_some() {
        std::fs::write(&path, &got).expect("write golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv (bless with LABELS_BLESS=1)");
    assert_eq!(got, want, "golden hashes changed");
}

#[test]
fn rendering_twice_is_identical() {
    for s in scenes().iter().take(6) {
        assert_eq!(
            s.label.render(s.dsf, s.opacity).rgba,
            s.label.render(s.dsf, s.opacity).rgba,
            "{}",
            s.name
        );
    }
}

#[test]
fn float_frames_fade_like_css() {
    // gen.mjs: float_<label>_p<p> scenes carry opacity String(1 − p²).
    let all = scenes();
    let mut n = 0;
    for (p, tag) in [(0.0f64, "000"), (0.25, "025"), (0.5, "050")] {
        for lbl in ["r15a", "r15b"] {
            let s = all
                .iter()
                .find(|s| s.name == format!("float_{lbl}_p{tag}"))
                .expect("float scene");
            #[allow(clippy::cast_possible_truncation)]
            let o = (1.0 - p * p) as f32;
            assert_eq!(s.opacity, o, "{}", s.name);
            let opaque = s.label.render(1.0, 1.0);
            let faded = s.label.render(1.0, o);
            for (a, b) in opaque.rgba.iter().zip(&faded.rgba) {
                #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
                let want = (f32::from(*a) * o + 0.5) as u8;
                assert_eq!(*b, want);
            }
            n += 1;
        }
    }
    assert_eq!(n, 6);
}
