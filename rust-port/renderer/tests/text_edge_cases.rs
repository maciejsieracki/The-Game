//! RR-T8b edge cases outside the pin data (R-RUSTPORT-P4-29-TEXT-FONTS-Q1,
//! obrona r3, zarzuty 1–4 Evaluatora r3).
//!
//! The pin `edb8fb56` texts contain no combining marks, no astral characters
//! (so no lone surrogate after `slice(0, -1)`), no `\n` / `\r` / `\f` and no
//! non-finite `fillText` positions, so `widths.tsv` / `truncate.tsv` /
//! `scenes.tsv` (Chromium 141) never reach these branches. The references
//! below were measured by
//! `dyspozycje/autobot/runs/R-RUSTPORT-P4-29-TEXT-FONTS-Q1/dowody/05-obrona-r3-chromium-probe.mjs`
//! (log `05-obrona-r3-chromium-probe.log` next to it) in **Chromium
//! 153.0.8010.12** — the only Chromium in the container of obrona r3;
//! Chromium 141 (the version of `tests/fixtures/text/`) is NIE_ZMIERZONO for
//! these rows. Same bundled font files, same `--font-render-hinting=none`.

use civ_renderer::raster::text::{parse_font, shape_text, truncate_hover_line, truncate_name};
use civ_renderer::raster::Canvas2dLite;

fn same_bits(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a == 0.0 && b == 0.0)
}

/// `(font as the web writes it, text, Chromium 153 measureText width)`.
/// In the Chromium text a lone surrogate (`'A\uD835'`, `'AB\uD83C…'`) is
/// written here as U+FFFD: a Rust `&str` cannot hold a lone surrogate, and
/// Chromium measures it exactly as U+FFFD (equal widths in the log, and
/// `fillText` pixels identical — log lines `P`).
const CHROMIUM_153_WIDTHS: &[(&str, &str, f64)] = &[
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "a b",
        28.7353515625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "a\u{9}b",
        28.7353515625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "a\u{a}b",
        28.7353515625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "a\u{c}b",
        28.7353515625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "a\u{d}b",
        28.7353515625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A V",
        37.275390625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{a}V",
        37.275390625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{d}V",
        37.275390625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{c}V",
        37.275390625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{9}V",
        37.275390625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AV",
        28.939453125,
    ),
    ("700 22px Georgia, \"Times New Roman\", serif", "\u{a}", 5.5),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "\u{d}\u{a}",
        11.0,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{fffd}",
        40.3798828125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{fffd}",
        40.3798828125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "A\u{fffd}",
        40.3798828125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "\u{fffd}",
        24.4921875,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "\u{fffd}",
        24.4921875,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{fffd}…",
        77.0537109375,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{fffd}…",
        77.0537109375,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB…",
        52.5615234375,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{1f031}",
        60.564453125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{1f031}…",
        82.564453125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{fffd}…",
        77.0537109375,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{1f031}\u{1f031}",
        90.5673828125,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "AB\u{1f031}\u{fffd}…",
        107.056640625,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "Jednostka · \u{1f031}\u{1f031}",
        173.701171875,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "Jednostka · \u{1f031}\u{fffd}…",
        190.1904296875,
    ),
    (
        "700 22px Georgia, \"Times New Roman\", serif",
        "Jednostka · \u{fffd}…",
        160.1875,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "a b",
        15.89306640625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "a\u{9}b",
        15.89306640625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "a\u{a}b",
        15.89306640625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "a\u{c}b",
        15.89306640625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "a\u{d}b",
        15.89306640625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A V",
        18.3369140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{a}V",
        18.3369140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{d}V",
        18.3369140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{c}V",
        18.3369140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{9}V",
        18.3369140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AV",
        14.46435546875,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "\u{a}",
        3.05615234375,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "\u{d}\u{a}",
        6.1123046875,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{fffd}",
        20.18994140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{fffd}",
        20.18994140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "A\u{fffd}",
        20.18994140625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "\u{fffd}",
        12.24609375,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "\u{fffd}",
        12.24609375,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{fffd}…",
        39.1337890625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{fffd}…",
        39.1337890625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB…",
        26.8876953125,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{1f031}",
        30.88916015625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{1f031}…",
        41.88916015625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{fffd}…",
        39.1337890625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{1f031}\u{1f031}",
        45.890625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "AB\u{1f031}\u{fffd}…",
        54.13525390625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "Jednostka · \u{1f031}\u{1f031}",
        94.1875,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "Jednostka · \u{1f031}\u{fffd}…",
        102.43212890625,
    ),
    (
        "600 11px Arial, Helvetica, sans-serif",
        "Jednostka · \u{fffd}…",
        87.4306640625,
    ),
    ("16px sans-serif", "a b", 22.2421875),
    ("16px sans-serif", "a\u{9}b", 22.2421875),
    ("16px sans-serif", "a\u{a}b", 22.2421875),
    ("16px sans-serif", "a\u{c}b", 22.2421875),
    ("16px sans-serif", "a\u{d}b", 22.2421875),
    ("16px sans-serif", "A V", 25.7890625),
    ("16px sans-serif", "A\u{a}V", 25.7890625),
    ("16px sans-serif", "A\u{d}V", 25.7890625),
    ("16px sans-serif", "A\u{c}V", 25.7890625),
    ("16px sans-serif", "A\u{9}V", 25.7890625),
    ("16px sans-serif", "AV", 20.15625),
    ("16px sans-serif", "\u{a}", 4.4453125),
    ("16px sans-serif", "\u{d}\u{a}", 8.890625),
    ("16px sans-serif", "A\u{fffd}", 27.078125),
    ("16px sans-serif", "A\u{fffd}", 27.078125),
    ("16px sans-serif", "A\u{fffd}", 27.078125),
    ("16px sans-serif", "\u{fffd}", 16.40625),
    ("16px sans-serif", "\u{fffd}", 16.40625),
    ("16px sans-serif", "AB\u{fffd}…", 53.75),
    ("16px sans-serif", "AB\u{fffd}…", 53.75),
    ("16px sans-serif", "AB…", 37.34375),
    ("16px sans-serif", "AB\u{1f031}", 43.1640625),
    ("16px sans-serif", "AB\u{1f031}…", 59.1640625),
    ("16px sans-serif", "AB\u{fffd}…", 53.75),
    ("16px sans-serif", "AB\u{1f031}\u{1f031}", 64.984375),
    ("16px sans-serif", "AB\u{1f031}\u{fffd}…", 75.5703125),
    (
        "16px sans-serif",
        "Jednostka · \u{1f031}\u{1f031}",
        130.796875,
    ),
    (
        "16px sans-serif",
        "Jednostka · \u{1f031}\u{fffd}…",
        141.3828125,
    ),
    ("16px sans-serif", "Jednostka · \u{fffd}…", 119.5625),
];

/// Zarzut 2 (E4) and zarzut 3 (E11, widths part): every row of the probe,
/// bit for bit — ASCII whitespace `\t \n \f \r` measured as U+0020 (also
/// `A\nV` = `A V`: no kerning across the replaced character) and a lone
/// surrogate measured as U+FFFD.
#[test]
fn whitespace_and_lone_surrogate_widths_match_chromium() {
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    let mut bad = Vec::new();
    for (font, text, want) in CHROMIUM_153_WIDTHS {
        assert!(c.set_font(font), "font {font}");
        let got = c.measure_text(text).width;
        if !same_bits(got, *want) {
            bad.push(format!("{font} | {text:?}: rust {got} chromium {want}"));
        }
    }
    assert_eq!(CHROMIUM_153_WIDTHS.len(), 87, "probe rows");
    assert!(
        bad.is_empty(),
        "{} of {} differ:\n{}",
        bad.len(),
        CHROMIUM_153_WIDTHS.len(),
        bad.join("\n")
    );
}

/// Zarzut 2 (E4): each of `\t \n \f \r` shapes to the same glyphs as a
/// space (between a kerning pair), and `\r\n` as two spaces.
#[test]
fn ascii_whitespace_shapes_as_space() {
    for font in [
        "700 22px Georgia, serif",
        "600 11px Arial, sans-serif",
        "16px 'DejaVu Sans'",
    ] {
        let spec = parse_font(font).expect("font");
        for ws in ['\t', '\n', '\u{0C}', '\r'] {
            let a = shape_text(&spec, &format!("A{ws}V"));
            let b = shape_text(&spec, "A V");
            assert_eq!(a, b, "{font}: {ws:?}");
        }
        assert_eq!(
            shape_text(&spec, "\r\n"),
            shape_text(&spec, "  "),
            "{font}: CRLF"
        );
    }
}

/// Zarzut 3 (E11): the web truncation loops on strings whose cut point falls
/// inside a surrogate pair (U+1F031, in DejaVu Sans, wider than both U+FFFD
/// and `…`); results from Chromium 153 (log lines `T`). JS keeps the lone
/// high surrogate in the result (`AB\uD83C…`); drawn or measured it is
/// U+FFFD (log lines `P`), which is what the Rust string holds.
#[test]
fn truncation_through_a_surrogate_pair_matches_chromium() {
    const NAME: &str = "700 22px Georgia, \"Times New Roman\", serif";
    const HOVER: &str = "600 11px Arial, Helvetica, sans-serif";
    let mut c = Canvas2dLite::new(1, 1).expect("canvas");
    // (input, maxW, Chromium result with the lone surrogate written as U+FFFD)
    let names: &[(&str, f64, &str)] = &[
        ("AB\u{1f031}", 58.0, "AB…"),
        ("AB\u{1f031}\u{1f031}", 80.0, "AB\u{fffd}…"),
        ("AB\u{1f031}\u{1f031}", 110.0, "AB\u{1f031}\u{1f031}"),
    ];
    for (input, max_w, want) in names {
        assert_eq!(
            truncate_name(&mut c, input, *max_w, NAME),
            *want,
            "name {input:?} {max_w}"
        );
    }
    assert!(c.set_font(HOVER));
    let hovers: &[(&str, f64, &str)] = &[
        ("Jednostka · \u{1f031}\u{1f031}", 70.0, "Jednostka …"),
        ("Jednostka · \u{1f031}\u{1f031}", 76.0, "Jednostka · …"),
        (
            "Jednostka · \u{1f031}\u{1f031}",
            88.0,
            "Jednostka · \u{fffd}…",
        ),
    ];
    for (input, max_w, want) in hovers {
        assert_eq!(
            truncate_hover_line(&c, input, *max_w),
            *want,
            "hover {input:?} {max_w}"
        );
    }
}

const BOX_W: usize = 160;
const BOX_H: usize = 200;

/// Inclusive pixel box `[x0, y0, x1, y1]`.
type InkBox = [i64; 4];

/// Inclusive pixel box of `alpha > 0` in the rows accepted by `row_ok`
/// (the probe's `box()`).
fn ink_box(c: &Canvas2dLite, row_ok: impl Fn(i64) -> bool) -> InkBox {
    let px = c.pixels_premultiplied();
    let mut b = [i64::MAX, i64::MAX, -1, -1];
    for y in 0..BOX_H {
        if !row_ok(y as i64) {
            continue;
        }
        for x in 0..BOX_W {
            if px[(y * BOX_W + x) * 4 + 3] > 0 {
                let (x, y) = (x as i64, y as i64);
                b = [b[0].min(x), b[1].min(y), b[2].max(x), b[3].max(y)];
            }
        }
    }
    b
}

fn draw(font: &str, text: &str) -> Canvas2dLite {
    let mut c = Canvas2dLite::new(BOX_W as u32, BOX_H as u32).expect("canvas");
    assert!(c.set_font(font));
    assert!(c.set_fill_style("#000"));
    c.fill_text(text, 20.0, 120.0);
    c
}

/// Zarzut 1 (E6, E9): GPOS mark attachment. `x` + U+0301 + U+0323 has no
/// precomposed glyph in Liberation Serif, so both marks are placed by GPOS
/// `x_offset` / `y_offset` (non-zero in both axes — asserted first). The ink
/// boxes of `x` and of the marks above / below it match Chromium 153 (log
/// lines `M`, the same box rule) within 1 px.
#[test]
fn combining_marks_follow_gpos_offsets_like_chromium() {
    // (font, Chromium base box, above-mark box, below-mark box)
    let refs: &[(&str, InkBox, InkBox, InkBox)] = &[
        (
            "100px serif",
            [20, 74, 68, 119],
            [44, 51, 64, 65],
            [38, 126, 48, 136],
        ),
        (
            "bold 100px serif",
            [20, 74, 69, 119],
            [44, 55, 66, 69],
            [37, 124, 52, 139],
        ),
    ];
    for (font, base_ref, above_ref, below_ref) in refs {
        let spec = parse_font(font).expect("font");
        let pen = shape_text(&spec, "x").width;
        let shaped = shape_text(&spec, "x\u{301}\u{323}");
        assert_eq!(shaped.glyphs.len(), 3, "{font}: base + 2 marks");
        for g in &shaped.glyphs[1..] {
            assert!(
                g.x != pen && g.y != 0.0,
                "{font}: mark not moved by GPOS: {g:?}"
            );
        }
        let base = ink_box(&draw(font, "x"), |_| true);
        let comb = draw(font, "x\u{301}\u{323}");
        let above = ink_box(&comb, |y| y < base[1]);
        let below = ink_box(&comb, |y| y > base[3]);
        println!("{font}: base {base:?} above {above:?} below {below:?}");
        for (what, got, want) in [
            ("base", base, base_ref),
            ("above", above, above_ref),
            ("below", below, below_ref),
        ] {
            for i in 0..4 {
                assert!(
                    (got[i] - want[i]).abs() <= 1,
                    "{font} {what}: rust {got:?} chromium {want:?}"
                );
            }
        }
    }
}

/// Zarzut 4 (E7): `fillText` / `strokeText` with a non-finite `x` or `y`
/// draw nothing (HTML Canvas: "If any of the arguments are infinite or NaN,
/// then return"), for outline and colour-glyph text alike, and do not panic.
#[test]
fn non_finite_position_draws_nothing() {
    for text in ["AV", "\u{1f600}", "A\u{1f600}V"] {
        for v in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            for (x, y) in [(v, 20.0), (20.0, v), (v, v)] {
                for stroke in [false, true] {
                    let mut c = Canvas2dLite::new(40, 40).expect("canvas");
                    assert!(c.set_font("bold 16px Arial"));
                    if stroke {
                        assert!(c.set_stroke_style("#000"));
                        c.stroke_text(text, x, y);
                    } else {
                        assert!(c.set_fill_style("#000"));
                        c.fill_text(text, x, y);
                    }
                    assert!(
                        c.pixels_premultiplied().iter().all(|&b| b == 0),
                        "{text:?} at ({x}, {y}) stroke={stroke} drew pixels"
                    );
                }
            }
        }
    }
}
