//! RR-T8e anchoring, animation, constants and fixture integrity
//! (R-RUSTPORT-P4-34-ANCHORS-DOM-Q1).
//!
//! - `anchors.tsv`: the web's `worldToClientPx` (`input/picker.ts`), the
//!   verbatim `updateSiegeHtmlLabels` (`main.ts`), the battle
//!   `worldToScreen` and the R4 placement, evaluated by `gen.mjs` with
//!   three@0.169.0 on two cameras — compared **bit for bit**; and
//!   Chromium's `getBoundingClientRect` of each label placed the web's way
//!   (CSS `left/top` + the label's `transform`).
//! - `float.tsv`: the verbatim `_tickFloatLabels` frame by frame (left, top,
//!   opacity, removal) — bit for bit.
//! - `consts.tsv`: every constant the web code holds, extracted from the pin;
//!   `labels::style` must hold the same values.
//! - `MANIFEST.sha256`: sha256 of every fixture (generator included).

use civ_renderer::labels::anchor::js_round;
use civ_renderer::labels::style::*;
use civ_renderer::labels::{
    anchored_rect, battle_world_to_screen, build_chip_left_top, r15a_anchor_world,
    r15b_anchor_world, r4_anchor_world, r5_anchor_world, siege_label_position, world_to_client_px,
    AnchorTransform, FloatLabel, Label, ProjectionCamera, ScreenRect,
};
use civ_renderer::pick::camera::PickCamera;
use civ_renderer::pick::three::{Mat4, Vec3};

fn fixture(rel: &str) -> String {
    format!("{}/tests/fixtures/labels/{rel}", env!("CARGO_MANIFEST_DIR"))
}

fn rows(file: &str) -> Vec<Vec<String>> {
    std::fs::read_to_string(fixture(file))
        .expect("fixture")
        .lines()
        .filter(|l| !l.starts_with('#') && !l.is_empty())
        .map(|l| l.split('\t').map(str::to_owned).collect())
        .collect()
}

fn num(s: &str) -> f64 {
    s.parse().unwrap_or_else(|_| panic!("number {s:?}"))
}

fn px(s: &str) -> f64 {
    num(s.strip_suffix("px").expect("px value"))
}

fn same(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits()
}

fn mat(s: &str) -> Mat4 {
    let v: Vec<f64> = s.split(',').map(num).collect();
    let mut e = [0.0; 16];
    e.copy_from_slice(&v);
    Mat4 { e }
}

struct Cam {
    cam: ProjectionCamera,
    w: f64,
    h: f64,
}

fn cams() -> std::collections::HashMap<String, Cam> {
    let mut m = std::collections::HashMap::new();
    for r in rows("anchors.tsv").into_iter().filter(|r| r[0] == "cam") {
        let cam = ProjectionCamera {
            world: mat(&r[4]),
            projection: mat(&r[5]),
        };
        let (w, h) = (num(&r[2]), num(&r[3]));
        if r[1] == "map" {
            // The map camera of gen.mjs is the web's _syncCamera: our
            // PickCamera must give the very same matrices.
            let p: Vec<f64> = r[6].split(',').map(num).collect();
            let pc = PickCamera {
                target_x: p[0],
                target_z: p[1],
                dist: p[2],
                far: p[3],
            };
            let mm = pc.matrices(w, h);
            assert_eq!(
                ProjectionCamera::from_matrices(&mm),
                cam,
                "PickCamera vs three"
            );
        }
        m.insert(r[1].clone(), Cam { cam, w, h });
    }
    assert_eq!(m.len(), 2);
    m
}

#[test]
fn projections_match_the_web_bit_for_bit() {
    let cams = cams();
    let (mut n_w2c, mut n_siege, mut n_w2s, mut n_place, mut n_null) = (0, 0, 0, 0, 0);
    let mut last_w2c: Option<(f64, f64)> = None;
    for r in rows("anchors.tsv") {
        match r[0].as_str() {
            "w2c" => {
                let c = &cams[&r[1]];
                let rc: Vec<f64> = r[5].split(',').map(num).collect();
                let got = world_to_client_px(
                    Vec3::new(num(&r[2]), num(&r[3]), num(&r[4])),
                    &c.cam,
                    &ScreenRect {
                        left: rc[0],
                        top: rc[1],
                        width: rc[2],
                        height: rc[3],
                    },
                );
                if r[6] == "null" {
                    assert_eq!(got, None, "{r:?}");
                    n_null += 1;
                    last_w2c = None;
                } else {
                    let g = got.expect("visible");
                    assert!(
                        same(g.0, num(&r[6])) && same(g.1, num(&r[7])),
                        "{r:?} vs {g:?}"
                    );
                    last_w2c = Some(g);
                }
                n_w2c += 1;
            }
            "r4place" => {
                let pos = (num(&r[1]), num(&r[2]));
                assert_eq!(Some(pos), last_w2c);
                let (l, t) = build_chip_left_top(pos);
                assert!(same(l, px(&r[3])) && same(t, px(&r[4])), "{r:?}");
                n_place += 1;
            }
            "siege" => {
                let c = &cams[&r[1]];
                let got = siege_label_position(
                    Vec3::new(num(&r[2]), num(&r[3]), num(&r[4])),
                    &c.cam,
                    c.w,
                    c.h,
                );
                match r[5].as_str() {
                    "none" => assert_eq!(got, None, "{r:?}"),
                    "block" => {
                        let g = got.expect("shown");
                        assert!(
                            same(g.0, px(&r[6])) && same(g.1, px(&r[7])),
                            "{r:?} vs {g:?}"
                        );
                    }
                    d => panic!("display {d}"),
                }
                n_siege += 1;
            }
            "w2s" => {
                let c = &cams[&r[1]];
                let g = battle_world_to_screen(
                    Vec3::new(num(&r[2]), num(&r[3]), num(&r[4])),
                    &c.cam,
                    c.w,
                    c.h,
                )
                .expect("sized canvas");
                assert!(
                    same(g.0, num(&r[5])) && same(g.1, num(&r[6])),
                    "{r:?} vs {g:?}"
                );
                n_w2s += 1;
            }
            _ => {}
        }
    }
    println!("w2c {n_w2c} (null {n_null}), r4place {n_place}, siege {n_siege}, w2s {n_w2s}");
    assert!(n_w2c >= 24 && n_null >= 1 && n_place >= 18 && n_siege >= 12 && n_w2s >= 12);
    // Edge cases of the code paths without a fixture row.
    let c = &cams["map"];
    let empty = ScreenRect {
        left: 0.0,
        top: 0.0,
        width: 0.0,
        height: 10.0,
    };
    assert_eq!(
        world_to_client_px(Vec3::new(0.0, 0.0, 0.0), &c.cam, &empty),
        None
    );
    assert_eq!(
        battle_world_to_screen(Vec3::new(0.0, 0.0, 0.0), &c.cam, 0.0, 10.0),
        None
    );
}

#[test]
fn js_round_is_math_round() {
    for (x, r) in [
        (0.5, 1.0),
        (-0.5, -0.0),
        (1.4999, 1.0),
        (-1.5, -1.0),
        (2.5, 3.0),
        (-2.6, -3.0),
    ] {
        assert_eq!(js_round(x), r, "{x}");
    }
}

#[test]
fn anchored_rects_match_chromium() {
    let mut n = 0;
    for r in rows("anchors.tsv").into_iter().filter(|r| r[0] == "rect") {
        let label = match r[1].as_str() {
            "R4" => Label::BuildChip {
                icon: r[2].clone(),
                valid: r[2] != r4_icon_for("droga"),
                reason: if r[2] == r4_icon_for("droga") {
                    R4_REASON_DROGA.to_owned()
                } else {
                    String::new()
                },
            },
            "R5" => Label::Siege { city: r[2].clone() },
            "R15a" => Label::Damage {
                dmg: r[2].parse().unwrap(),
            },
            "R15b" => Label::Wall {
                text: r[2].clone(),
                color: R15B_BREACH_COLOR.to_owned(),
            },
            g => panic!("{g}"),
        };
        let (lx, ty) = (num(&r[3]), num(&r[4]));
        // CSS left/top as the web writes them.
        let (left, top) = match label {
            Label::BuildChip { .. } => build_chip_left_top((lx, ty)),
            Label::Siege { .. } => (js_round(lx), js_round(ty)),
            _ => (lx, ty),
        };
        if matches!(label, Label::BuildChip { .. } | Label::Siege { .. }) {
            assert!(same(left, px(&r[5])) && same(top, px(&r[6])), "{r:?}");
        }
        let l = label.layout();
        let (x, y, w, h) = anchored_rect(label.transform(), left, top, l.width, l.height);
        let got = [f64::from(x), f64::from(y), f64::from(w), f64::from(h)];
        let want = [num(&r[7]), num(&r[8]), num(&r[9]), num(&r[10])];
        assert_eq!(
            got.map(f64::to_bits),
            want.map(f64::to_bits),
            "{r:?}: {got:?}"
        );
        n += 1;
    }
    assert_eq!(n, 21);
    assert_eq!(
        Label::Damage { dmg: 1 }.transform(),
        AnchorTransform::Center
    );
}

#[test]
fn float_label_frames_match_tick_float_labels() {
    let cams = cams();
    let mut n = 0;
    let mut removed = 0;
    for r in rows("float.tsv") {
        let c = &cams[&r[1]];
        let w: Vec<f64> = r[3].split(',').map(num).collect();
        let fl = FloatLabel {
            start_time: num(&r[4]),
            duration: num(&r[5]),
            world: Vec3::new(w[0], w[1], w[2]),
            rise_rate: num(&r[6]),
        };
        // The web's constants (also checked against consts.tsv).
        assert_eq!(
            (fl.duration, fl.rise_rate),
            (FLOAT_DURATION_MS, FLOAT_RISE_RATE)
        );
        assert_eq!(FloatLabel::spawn(fl.start_time, fl.world), fl);
        // The anchors are the web's composition (gen.mjs: R15a on tile top
        // 1.03, R15b at its fixed height).
        let anchor = if r[2] == "r15a" {
            r15a_anchor_world(w[0], 1.03, w[2])
        } else {
            r15b_anchor_world(w[0], w[2])
        };
        assert_eq!(anchor.y.to_bits(), w[1].to_bits(), "{r:?}: anchor y");
        let t = num(&r[7]);
        let got = fl.screen(t, &c.cam, c.w, c.h);
        if r[8] == "true" {
            assert_eq!(got, None, "{r:?}");
            assert_eq!(fl.frame(t), None);
            removed += 1;
        } else {
            let (x, y, o) = got.expect("alive").expect("sized canvas");
            assert!(same(x, px(&r[9])) && same(y, px(&r[10])), "{r:?}: {x} {y}");
            assert!(same(o, num(&r[11])), "{r:?}: opacity {o}");
            let f = fl.frame(t).unwrap();
            assert!(same(f.opacity, 1.0 - f.progress * f.progress));
        }
        n += 1;
    }
    println!("float frames {n}, removed {removed}");
    assert_eq!(n, 48);
    assert_eq!(removed, 8);
}

fn consts() -> Vec<(String, String)> {
    rows("consts.tsv")
        .into_iter()
        .map(|r| (r[0].clone(), r[1].clone()))
        .collect()
}

fn get(c: &[(String, String)], k: &str) -> String {
    c.iter()
        .find(|(a, _)| a == k)
        .unwrap_or_else(|| panic!("{k}"))
        .1
        .clone()
}

fn css_len(v: f64) -> String {
    if v == 0.0 {
        "0".to_owned()
    } else {
        format!("{v}px")
    }
}

/// Every group's world anchor height = the web's expression (extracted from
/// the pin and evaluated by `gen.mjs` on probe tile tops), bit for bit.
#[test]
fn anchor_heights_match_the_web() {
    let mut n = [0usize; 4];
    for (k, v) in consts() {
        if k != "anchor_y" {
            continue;
        }
        let f: Vec<&str> = v.split('|').collect();
        let (top, want) = (num(f[1]), num(f[2]));
        let (i, got) = match f[0] {
            "r4" => (0, r4_anchor_world(1.0, top, 2.0)),
            "r5" => (1, r5_anchor_world(1.0, top, 2.0)),
            "r15a" => (2, r15a_anchor_world(1.0, top, 2.0)),
            "r15b" => (3, r15b_anchor_world(1.0, 2.0)),
            g => panic!("group {g}"),
        };
        assert_eq!(got.y.to_bits(), want.to_bits(), "{v}: {}", got.y);
        assert_eq!((got.x, got.z), (1.0, 2.0));
        n[i] += 1;
    }
    assert_eq!(n, [5; 4]);
}

#[test]
fn constants_are_the_webs() {
    let c = consts();
    // Verbatim strings.
    assert_eq!(get(&c, "r4_css"), R4_CSS_WEB);
    assert_eq!(get(&c, "r5_css"), R5_CSS_WEB);
    assert_eq!(get(&c, "r15a_style"), R15A_STYLE_WEB);
    assert_eq!(get(&c, "r15b_style"), R15B_STYLE_WEB);
    let icons: Vec<(String, String)> = c
        .iter()
        .filter(|(k, _)| k == "r4_icon")
        .map(|(_, v)| {
            let (a, b) = v.split_once('=').unwrap();
            (a.to_owned(), b.to_owned())
        })
        .collect();
    let mine: Vec<(String, String)> = R4_IMPROVEMENT_CHIP
        .iter()
        .map(|(a, b)| ((*a).to_owned(), (*b).to_owned()))
        .collect();
    assert_eq!(icons, mine);
    assert_eq!(get(&c, "r4_icon_city"), R4_ICON_CITY);
    assert_eq!(get(&c, "r4_icon_fallback"), R4_ICON_FALLBACK);
    assert_eq!(get(&c, "r4_reason_droga"), R4_REASON_DROGA);
    assert_eq!(num(&get(&c, "r4_lift_y")), R4_LIFT_Y);
    assert_eq!(num(&get(&c, "r5_lift_y")), R5_LIFT_Y);
    assert_eq!(num(&get(&c, "r15a_duration")), FLOAT_DURATION_MS);
    assert_eq!(num(&get(&c, "r15b_duration")), FLOAT_DURATION_MS);
    assert_eq!(num(&get(&c, "r15a_rise_rate")), FLOAT_RISE_RATE);
    assert_eq!(num(&get(&c, "r15b_rise_rate")), FLOAT_RISE_RATE);
    assert_eq!(num(&get(&c, "r15b_world_y")), R15B_WORLD_Y);
    assert_eq!(num(&get(&c, "r15a_hpbar_y")), R15A_HPBAR_Y);
    assert_eq!(num(&get(&c, "r15a_lift")), R15A_LIFT);
    assert_eq!(get(&c, "r15b_dmg_color"), R15B_DMG_COLOR);
    assert_eq!(get(&c, "r15b_breach_text"), R15B_BREACH_TEXT);
    assert_eq!(get(&c, "r15b_breach_color"), R15B_BREACH_COLOR);
    assert!(get(&c, "index_style").contains("box-sizing: border-box"));

    // Typed values = what the verbatim CSS says.
    let has = |css: &str, decl: String| assert!(css.contains(&decl), "{decl:?} not in {css:?}");
    let b = R4_BOX;
    has(
        R4_CSS_WEB,
        format!("padding:{}px {}px", b.padding_v, b.padding_h),
    );
    has(R4_CSS_WEB, format!("border-radius:{}px", b.radius));
    has(R4_CSS_WEB, format!("gap:{R4_GAP}px"));
    has(
        R4_CSS_WEB,
        format!("font:{R4_FONT_SIZE}px/{R4_LINE_HEIGHT} Arial,sans-serif"),
    );
    assert_eq!(R4_FONT, format!("{R4_FONT_SIZE}px Arial,sans-serif"));
    has(R4_CSS_WEB, format!("color:{R4_COLOR}"));
    has(R4_CSS_WEB, format!("background:{}", b.background));
    has(
        R4_CSS_WEB,
        format!("border:{}px solid {R4_BORDER_VALID}", b.border_width),
    );
    let s = b.shadow;
    has(
        R4_CSS_WEB,
        format!(
            "box-shadow:{} {} {} {}",
            css_len(s.offset_x),
            css_len(s.offset_y),
            css_len(s.blur),
            s.color
        ),
    );
    let b = R5_BOX;
    has(
        R5_CSS_WEB,
        format!("padding:{}px {}px", b.padding_v, b.padding_h),
    );
    has(R5_CSS_WEB, format!("border-radius:{}px", b.radius));
    has(
        R5_CSS_WEB,
        format!("font:{R5_FONT_WEIGHT} {R5_FONT_SIZE}px/{R5_LINE_HEIGHT} {R5_FONT_FAMILY}"),
    );
    has(R5_CSS_WEB, format!("color:{R5_COLOR}"));
    has(R5_CSS_WEB, format!("background:{}", b.background));
    has(
        R5_CSS_WEB,
        format!("border:{}px solid {R5_BORDER}", b.border_width),
    );
    let s = b.shadow;
    has(
        R5_CSS_WEB,
        format!(
            "box-shadow:{} {} {} {}",
            css_len(s.offset_x),
            css_len(s.offset_y),
            css_len(s.blur),
            s.color
        ),
    );
    has(R5_CSS_WEB, "transform:translate(-50%,-100%)".to_owned());
    has(R5_CSS_WEB, "text-align:center".to_owned());
    for (web, font, color) in [
        (R15A_STYLE_WEB, R15A_FONT, R15A_COLOR),
        (R15B_STYLE_WEB, R15B_FONT, "COLOR"),
    ] {
        let size = font.split_whitespace().nth(1).unwrap();
        has(web, format!("\"fontSize\":\"{size}\""));
        has(web, "\"fontWeight\":\"bold\"".to_owned());
        has(web, "\"fontFamily\":\"sans-serif\"".to_owned());
        has(web, format!("\"color\":\"{color}\""));
        let sh: Vec<String> = R15_TEXT_SHADOWS
            .iter()
            .map(|s| {
                format!(
                    "{} {} {} {}",
                    css_len(s.offset_x),
                    css_len(s.offset_y),
                    css_len(s.blur),
                    s.color
                )
            })
            .collect();
        has(web, format!("\"textShadow\":\"{}\"", sh.join(", ")));
        has(web, "\"transform\":\"translate(-50%, -50%)\"".to_owned());
    }
}

/// SHA-256 (FIPS 180-4).
fn sha256(data: &[u8]) -> [u8; 32] {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    let mut msg = data.to_vec();
    let bit_len = (data.len() as u64).wrapping_mul(8);
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks(64) {
        let mut w = [0u32; 64];
        for (i, word) in chunk.chunks(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let mut v = h;
        for i in 0..64 {
            let s1 = v[4].rotate_right(6) ^ v[4].rotate_right(11) ^ v[4].rotate_right(25);
            let ch = (v[4] & v[5]) ^ (!v[4] & v[6]);
            let t1 = v[7]
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = v[0].rotate_right(2) ^ v[0].rotate_right(13) ^ v[0].rotate_right(22);
            let maj = (v[0] & v[1]) ^ (v[0] & v[2]) ^ (v[1] & v[2]);
            let t2 = s0.wrapping_add(maj);
            v = [
                t1.wrapping_add(t2),
                v[0],
                v[1],
                v[2],
                v[3].wrapping_add(t1),
                v[4],
                v[5],
                v[6],
            ];
        }
        for (a, b) in h.iter_mut().zip(v) {
            *a = a.wrapping_add(b);
        }
    }
    let mut out = [0u8; 32];
    for (i, x) in h.iter().enumerate() {
        out[i * 4..i * 4 + 4].copy_from_slice(&x.to_be_bytes());
    }
    out
}

fn hex(d: &[u8]) -> String {
    d.iter().map(|b| format!("{b:02x}")).collect()
}

#[test]
fn fixtures_match_manifest_sha256() {
    let dir = format!("{}/tests/fixtures/labels", env!("CARGO_MANIFEST_DIR"));
    let man = std::fs::read_to_string(format!("{dir}/MANIFEST.sha256")).expect("manifest");
    let mut listed = Vec::new();
    for line in man.lines() {
        let (h, f) = line.split_once("  ").expect("sha256sum line");
        let data = std::fs::read(format!("{dir}/{f}")).unwrap_or_else(|e| panic!("{f}: {e}"));
        assert_eq!(hex(&sha256(&data)), h, "{f}: sha256");
        listed.push(f.to_owned());
    }
    let mut checked = 0;
    for sub in ["", "ref/"] {
        for e in std::fs::read_dir(format!("{dir}/{sub}")).expect("dir") {
            let e = e.expect("entry");
            if e.file_type().expect("type").is_file() {
                let f = format!("{sub}{}", e.file_name().into_string().expect("utf-8"));
                // `golden.tsv` (written by `LABELS_BLESS=1`) is listed as
                // well: a re-bless must update its manifest line too.
                if f != "MANIFEST.sha256" {
                    assert!(listed.contains(&f), "{f} missing from MANIFEST.sha256");
                    checked += 1;
                }
            }
        }
    }
    assert!(checked >= 50, "only {checked} fixture files");
    assert!(listed.iter().any(|f| f == "gen.mjs"));
    assert_eq!(
        listed
            .iter()
            .filter(|f| f.starts_with("../../../assets/"))
            .count(),
        7
    );
}

#[test]
fn sha256_matches_standard_vectors() {
    assert_eq!(
        hex(&sha256(b"")),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    assert_eq!(
        hex(&sha256(b"abc")),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
}
