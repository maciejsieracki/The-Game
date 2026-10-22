//! RR-T8d CPU mipmaps and alpha conversion against WebGL2 in Chromium 141
//! (ANGLE → Vulkan → SwiftShader; `tests/fixtures/atlas/atlas_gl.json`,
//! generator `gen_gl.mjs`). The GL of the owner's machine is NOT measured.
//!
//! Each mip level is recomputed from the GL's own previous level (isolates
//! the filter) and, separately, the whole Rust chain from level 0 is
//! compared (accumulated error). Thresholds = the measured agreement
//! (P4-31 §4.2), so a regression of the model fails the test.

mod atlas_json;

use atlas_json::{base64, load, Json};
use civ_renderer::raster::atlas::mip::{downsample, mip_level_count, MipChain, MipSpace};
use civ_renderer::raster::atlas::upload::unpremultiply;

/// Measured on the T7 case (P4-31 §4.2), set just below the measured value.
const T7_STEP_MIN: f64 = 0.984; // measured 28200/28647 = 0.9844
const T7_CHAIN_MIN: f64 = 0.979; // measured 28048/28647 = 0.9791

#[derive(Default, Debug, Clone, Copy)]
struct Tally {
    texels: u64,
    exact: u64,
    max_abs: u8,
}

impl Tally {
    fn add(&mut self, got: &[u8], exp: &[u8]) {
        assert_eq!(got.len(), exp.len());
        for (g, e) in got.chunks_exact(4).zip(exp.chunks_exact(4)) {
            self.texels += 1;
            let d = g
                .iter()
                .zip(e)
                .map(|(a, b)| a.abs_diff(*b))
                .max()
                .unwrap_or(0);
            if d == 0 {
                self.exact += 1;
            }
            self.max_abs = self.max_abs.max(d);
        }
    }
    fn ratio(&self) -> f64 {
        self.exact as f64 / self.texels as f64
    }
}

fn gl() -> Json {
    let j = load("atlas_gl.json");
    assert!(
        j.get("renderer").str().contains("SwiftShader"),
        "reference GL"
    );
    assert_eq!(j.get("browser").str(), "141.0.7390.37");
    j
}

/// `[raw even, raw odd, srgb even, srgb odd]` tallies, per-step and chain.
fn tallies() -> ([Tally; 4], [Tally; 4]) {
    let j = gl();
    let mut step = [Tally::default(); 4];
    let mut chain_t = [Tally::default(); 4];
    for c in j.get("cases").arr() {
        if c.get("kind").str() == "t7" {
            continue; // measured on its own: `t7_size_chain_matches_webgl`
        }
        let srgb = c.get("srgb").bool();
        let space = if srgb {
            MipSpace::Srgb
        } else {
            MipSpace::Linear
        };
        let (w, h) = (c.get("w").u32(), c.get("h").u32());
        let levels: Vec<(u32, u32, Vec<u8>)> = c
            .get("levels")
            .arr()
            .iter()
            .map(|l| {
                (
                    l.get("w").u32(),
                    l.get("h").u32(),
                    base64(l.get("rgba").str()),
                )
            })
            .collect();
        assert_eq!(
            levels.len() as u32,
            mip_level_count(w, h),
            "level count {w}x{h}"
        );
        let chain = MipChain::generate(levels[0].2.clone(), w, h, space);
        for i in 1..levels.len() {
            let (pw, ph, ref prev) = levels[i - 1];
            let (lw, lh, ref exp) = levels[i];
            let odd = pw % 2 == 1 || ph % 2 == 1;
            let idx = usize::from(srgb) * 2 + usize::from(odd);
            step[idx].add(&downsample(prev, pw, ph, lw, lh, space), exp);
            chain_t[idx].add(&chain.levels[i], exp);
        }
    }
    (step, chain_t)
}

#[test]
fn mip_filter_matches_webgl_generate_mipmap() {
    let (step, chain) = tallies();
    let names = ["RGBA8 even", "RGBA8 odd", "sRGB even", "sRGB odd"];
    for i in 0..4 {
        eprintln!(
            "{:10} step: {}/{} exact ({:.4}), max|d| {} | chain from level 0: {}/{} ({:.4}), max|d| {}",
            names[i],
            step[i].exact,
            step[i].texels,
            step[i].ratio(),
            step[i].max_abs,
            chain[i].exact,
            chain[i].texels,
            chain[i].ratio(),
            chain[i].max_abs
        );
    }
    // RGBA8, even sizes: bit-exact (2x2 average, round half to even).
    assert_eq!(
        step[0].exact, step[0].texels,
        "RGBA8 even must be bit-exact"
    );
    // From level 0 the chain inherits the ≤ 1 LSB of earlier odd levels.
    assert!(
        chain[0].ratio() >= 0.999,
        "RGBA8 even chain {:.4}",
        chain[0].ratio()
    );
    // Odd sizes and sRGB: at most 1 LSB, agreement not below the measured level.
    for t in &step[1..] {
        assert!(t.max_abs <= 1, "max |d| {}", t.max_abs);
    }
    assert!(step[1].ratio() >= 0.996, "RGBA8 odd {:.4}", step[1].ratio());
    assert!(step[2].ratio() >= 0.989, "sRGB even {:.4}", step[2].ratio());
    assert!(step[3].ratio() >= 0.998, "sRGB odd {:.4}", step[3].ratio());
    for t in &chain {
        assert!(t.max_abs <= 1, "chain max |d| {}", t.max_abs);
        assert!(t.ratio() >= 0.987, "chain {:.4}", t.ratio());
    }
}

/// T7 (stat-plate background, 512×168, `SRGB8_ALPHA8`): one random case in
/// the fixture (`gen_gl.mjs` §3). Level chain 512×168 → … → 1×1 crosses odd
/// sizes from level 3 (64×21) on. Thresholds = the measured agreement
/// (P4-31 §4.2).
#[test]
fn t7_size_chain_matches_webgl() {
    let j = gl();
    let cases: Vec<&Json> = j
        .get("cases")
        .arr()
        .iter()
        .filter(|c| c.get("kind").str() == "t7")
        .collect();
    assert_eq!(cases.len(), 1, "one T7 case in atlas_gl.json");
    let c = cases[0];
    assert!(c.get("srgb").bool(), "T7 is an sRGB texture");
    let (w, h) = (c.get("w").u32(), c.get("h").u32());
    assert_eq!((w, h), (512, 168));
    let levels: Vec<(u32, u32, Vec<u8>)> = c
        .get("levels")
        .arr()
        .iter()
        .map(|l| {
            (
                l.get("w").u32(),
                l.get("h").u32(),
                base64(l.get("rgba").str()),
            )
        })
        .collect();
    assert_eq!(levels.len() as u32, mip_level_count(w, h));
    assert_eq!(levels.len(), 10);
    let chain = MipChain::generate(levels[0].2.clone(), w, h, MipSpace::Srgb);
    let (mut step, mut whole) = (Tally::default(), Tally::default());
    for i in 1..levels.len() {
        let (pw, ph, ref prev) = levels[i - 1];
        let (lw, lh, ref exp) = levels[i];
        step.add(&downsample(prev, pw, ph, lw, lh, MipSpace::Srgb), exp);
        whole.add(&chain.levels[i], exp);
    }
    eprintln!(
        "T7 512x168 sRGB step: {}/{} exact ({:.4}), max|d| {} | chain: {}/{} ({:.4}), max|d| {}",
        step.exact,
        step.texels,
        step.ratio(),
        step.max_abs,
        whole.exact,
        whole.texels,
        whole.ratio(),
        whole.max_abs
    );
    assert!(step.max_abs <= 1, "T7 step max |d| {}", step.max_abs);
    assert!(whole.max_abs <= 1, "T7 chain max |d| {}", whole.max_abs);
    assert!(step.ratio() >= T7_STEP_MIN, "T7 step {:.4}", step.ratio());
    assert!(
        whole.ratio() >= T7_CHAIN_MIN,
        "T7 chain {:.4}",
        whole.ratio()
    );
}

#[test]
fn naive_box_filter_is_rejected_on_odd_sizes() {
    // Guard of the model choice: a 2x2 box that drops the odd row/column
    // (what `raster::image::mip::half` does for canvas drawImage) is far
    // from the GL result on odd sizes, so the bilinear resample is needed.
    let j = gl();
    let mut worst = 0u8;
    for c in j.get("cases").arr() {
        if c.get("srgb").bool() || c.get("kind").str() != "random" {
            continue;
        }
        let levels = c.get("levels").arr();
        for i in 1..levels.len() {
            let (pw, ph) = (levels[i - 1].get("w").u32(), levels[i - 1].get("h").u32());
            if pw % 2 == 0 && ph % 2 == 0 {
                continue;
            }
            let prev = base64(levels[i - 1].get("rgba").str());
            let exp = base64(levels[i].get("rgba").str());
            let (lw, lh) = (levels[i].get("w").u32(), levels[i].get("h").u32());
            for y in 0..lh as usize {
                for x in 0..lw as usize {
                    for ch in 0..4 {
                        let p = |xx: usize, yy: usize| {
                            let (xx, yy) = (xx.min(pw as usize - 1), yy.min(ph as usize - 1));
                            u32::from(prev[(yy * pw as usize + xx) * 4 + ch])
                        };
                        let b = (p(2 * x, 2 * y)
                            + p(2 * x + 1, 2 * y)
                            + p(2 * x, 2 * y + 1)
                            + p(2 * x + 1, 2 * y + 1)
                            + 2)
                            / 4;
                        let e = u32::from(exp[(y * lw as usize + x) * 4 + ch]);
                        worst = worst.max(u8::try_from(b.abs_diff(e)).unwrap_or(u8::MAX));
                    }
                }
            }
        }
    }
    assert!(worst > 16, "box-drop unexpectedly close: {worst}");
}

#[test]
fn unpremultiply_matches_chromium_upload() {
    let j = gl();
    let up = j.get("up");
    let premul = base64(up.get("premul").str());
    let straight = base64(up.get("straight").str());
    let gid = base64(up.get("getImageData").str());
    let got = unpremultiply(&premul);
    let (mut exact, mut total, mut max_d) = (0u64, 0u64, 0u8);
    let (mut exact_g, mut alpha_ok) = (0u64, true);
    for ((g, s), d) in got
        .chunks_exact(4)
        .zip(straight.chunks_exact(4))
        .zip(gid.chunks_exact(4))
    {
        alpha_ok &= g[3] == s[3];
        if s[3] == 0 {
            continue;
        }
        for c in 0..3 {
            total += 1;
            let diff = g[c].abs_diff(s[c]);
            max_d = max_d.max(diff);
            exact += u64::from(diff == 0);
            exact_g += u64::from(g[c] == d[c]);
        }
    }
    let ratio = exact as f64 / total as f64;
    eprintln!(
        "unpremultiply vs texImage2D(premultiply=false): {exact}/{total} ({ratio:.4}) max|d| {max_d}; vs getImageData {exact_g}/{total}"
    );
    assert!(alpha_ok, "alpha unchanged");
    assert!(max_d <= 1);
    assert!(ratio >= 0.993, "{ratio}");
}
