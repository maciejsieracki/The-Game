//! CSS colour strings accepted by `fillStyle` / `strokeStyle` / `shadowColor`
//! and `CanvasGradient.addColorStop` (RR-T8a, P4-25 §4.1 "Kolor").
//!
//! Scope = what the web map code actually assigns (pin `edb8fb56`, measured in
//! `dyspozycje/rust-port/p4/P4-28-RASTER-SHAPES.md` §2): `#rgb`, `#rrggbb`,
//! `rgb()`, `rgba()` (legacy comma syntax, with or without spaces) and the
//! keyword `transparent`. Cheap neighbours of the same grammar are accepted as
//! well because the dispatch names them (`hsl()`/`hsla()`), and because they
//! cost nothing: `#rgba`, `#rrggbbaa`, the CSS Color 4 space syntax
//! `rgb(r g b / a)`, percentages, and the 16 basic HTML colour keywords.
//!
//! Anything else returns `None`. Like Canvas 2D, the caller then keeps the
//! previous value (an invalid assignment to `ctx.fillStyle` is ignored).
//! The full CSS named-colour table (148 keywords) is deliberately NOT included:
//! the web never uses it on a map canvas (only `'transparent'`,
//! `cityOkolicaOverlay.ts:159`, `:179`).
//!
//! Accept/reject decisions and the resulting 8-bit pixels are compared with
//! Chromium in `tests/raster_color.rs` (fixture `tests/fixtures/raster/colors.tsv`).

/// A parsed CSS colour: straight (non-premultiplied) sRGB channels in `0..=1`.
///
/// `rgb()` channels are rounded to whole 8-bit steps (legacy CSS colours are
/// 8-bit); the alpha keeps its exact value (e.g. `0.92`) and is quantised only
/// when painted, as in Skia.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CssColor {
    /// Red, `0..=1`.
    pub r: f32,
    /// Green, `0..=1`.
    pub g: f32,
    /// Blue, `0..=1`.
    pub b: f32,
    /// Alpha, `0..=1`.
    pub a: f32,
}

impl CssColor {
    /// Opaque black — the Canvas 2D default for `fillStyle`/`strokeStyle`.
    pub const BLACK: CssColor = CssColor {
        r: 0.0,
        g: 0.0,
        b: 0.0,
        a: 1.0,
    };
    /// Transparent black — the Canvas 2D default for `shadowColor`.
    pub const TRANSPARENT: CssColor = CssColor {
        r: 0.0,
        g: 0.0,
        b: 0.0,
        a: 0.0,
    };

    fn from_u8(r: u8, g: u8, b: u8, a: f32) -> CssColor {
        CssColor {
            r: f32::from(r) / 255.0,
            g: f32::from(g) / 255.0,
            b: f32::from(b) / 255.0,
            a,
        }
    }

    pub(crate) fn to_skia(self) -> tiny_skia::Color {
        // All channels are already clamped to 0..=1 by the parser.
        tiny_skia::Color::from_rgba(self.r, self.g, self.b, self.a)
            .unwrap_or(tiny_skia::Color::TRANSPARENT)
    }
}

/// Parses a CSS colour string the way Canvas 2D does for the forms listed in
/// the module docs. ASCII case-insensitive, surrounding whitespace ignored.
#[must_use]
pub fn parse_css_color(input: &str) -> Option<CssColor> {
    let s = input.trim().to_ascii_lowercase();
    if let Some(hex) = s.strip_prefix('#') {
        return parse_hex(hex);
    }
    if let Some(open) = s.find('(') {
        let name = s[..open].trim_end();
        let body = s[open + 1..].strip_suffix(')')?;
        return match name {
            "rgb" | "rgba" => parse_rgb_args(body),
            "hsl" | "hsla" => parse_hsl_args(body),
            _ => None,
        };
    }
    named(&s)
}

fn named(s: &str) -> Option<CssColor> {
    if s == "transparent" {
        return Some(CssColor::TRANSPARENT);
    }
    // HTML 4 / CSS 1 basic keywords (CSS Color 4 §6.1). The full 148-name
    // table is out of scope (module docs).
    let rgb: u32 = match s {
        "black" => 0x000000,
        "silver" => 0xc0c0c0,
        "gray" | "grey" => 0x808080,
        "white" => 0xffffff,
        "maroon" => 0x800000,
        "red" => 0xff0000,
        "purple" => 0x800080,
        "fuchsia" => 0xff00ff,
        "green" => 0x008000,
        "lime" => 0x00ff00,
        "olive" => 0x808000,
        "yellow" => 0xffff00,
        "navy" => 0x000080,
        "blue" => 0x0000ff,
        "teal" => 0x008080,
        "aqua" => 0x00ffff,
        _ => return None,
    };
    let [_, r, g, b] = rgb.to_be_bytes();
    Some(CssColor::from_u8(r, g, b, 1.0))
}

fn hex_digit(c: u8) -> Option<u8> {
    match c {
        b'0'..=b'9' => Some(c - b'0'),
        b'a'..=b'f' => Some(c - b'a' + 10),
        _ => None,
    }
}

fn parse_hex(hex: &str) -> Option<CssColor> {
    let d: Vec<u8> = hex.bytes().map(hex_digit).collect::<Option<_>>()?;
    let short = |i: usize| d[i] * 17;
    let long = |i: usize| d[i] * 16 + d[i + 1];
    let (r, g, b, a) = match d.len() {
        3 => (short(0), short(1), short(2), 255),
        4 => (short(0), short(1), short(2), short(3)),
        6 => (long(0), long(2), long(4), 255),
        8 => (long(0), long(2), long(4), long(6)),
        _ => return None,
    };
    Some(CssColor::from_u8(r, g, b, f32::from(a) / 255.0))
}

/// One numeric token: plain number or percentage.
#[derive(Clone, Copy)]
enum Tok {
    Num(f64),
    Pct(f64),
}

fn parse_number(t: &str) -> Option<f64> {
    // CSS <number>: optional sign, digits, optional fraction, optional exponent.
    // Rust's f64 parser additionally accepts "inf"/"nan" — rejected here.
    if t.is_empty()
        || !t
            .bytes()
            .all(|c| c.is_ascii_digit() || matches!(c, b'.' | b'+' | b'-' | b'e'))
    {
        return None;
    }
    let v: f64 = t.parse().ok()?;
    v.is_finite().then_some(v)
}

fn parse_tok(t: &str) -> Option<Tok> {
    if let Some(p) = t.strip_suffix('%') {
        Some(Tok::Pct(parse_number(p)?))
    } else {
        Some(Tok::Num(parse_number(t)?))
    }
}

/// Splits the inside of `rgb(...)`/`hsl(...)` into channel tokens and an
/// optional alpha token. Accepts the legacy comma syntax (3 or 4 items) and
/// the CSS Color 4 space syntax (`a b c` or `a b c / alpha`); the two cannot
/// be mixed.
fn split_args(body: &str) -> Option<(Vec<&str>, Option<&str>)> {
    if body.contains(',') {
        if body.contains('/') {
            return None;
        }
        let parts: Vec<&str> = body.split(',').map(str::trim).collect();
        return match parts.len() {
            3 => Some((parts, None)),
            4 => Some((parts[..3].to_vec(), Some(parts[3]))),
            _ => None,
        };
    }
    let (chan, alpha) = match body.split_once('/') {
        Some((c, a)) => (c, Some(a.trim())),
        None => (body, None),
    };
    let parts: Vec<&str> = chan.split_whitespace().collect();
    (parts.len() == 3).then_some((parts, alpha))
}

fn parse_alpha(t: Option<&str>) -> Option<f32> {
    let Some(t) = t else { return Some(1.0) };
    let a = match parse_tok(t)? {
        Tok::Num(v) => v,
        Tok::Pct(p) => p / 100.0,
    };
    Some(a.clamp(0.0, 1.0) as f32)
}

fn parse_rgb_args(body: &str) -> Option<CssColor> {
    let (parts, alpha) = split_args(body)?;
    let toks: Vec<Tok> = parts.iter().map(|t| parse_tok(t)).collect::<Option<_>>()?;
    // Legacy syntax: all three channels must be the same kind.
    let all_num = toks.iter().all(|t| matches!(t, Tok::Num(_)));
    let all_pct = toks.iter().all(|t| matches!(t, Tok::Pct(_)));
    if !(all_num || all_pct) {
        return None;
    }
    let chan = |t: Tok| -> u8 {
        let v = match t {
            Tok::Num(v) => v,
            Tok::Pct(p) => p * 255.0 / 100.0,
        };
        // Round half away from zero after clamping (8-bit legacy colour).
        v.clamp(0.0, 255.0).round() as u8
    };
    let a = parse_alpha(alpha)?;
    Some(CssColor::from_u8(
        chan(toks[0]),
        chan(toks[1]),
        chan(toks[2]),
        a,
    ))
}

fn parse_hue(t: &str) -> Option<f64> {
    let (num, scale) = if let Some(v) = t.strip_suffix("deg") {
        (v, 1.0)
    } else if let Some(v) = t.strip_suffix("grad") {
        (v, 360.0 / 400.0)
    } else if let Some(v) = t.strip_suffix("rad") {
        (v, 180.0 / std::f64::consts::PI)
    } else if let Some(v) = t.strip_suffix("turn") {
        (v, 360.0)
    } else {
        (t, 1.0)
    };
    Some(parse_number(num)? * scale)
}

fn parse_hsl_args(body: &str) -> Option<CssColor> {
    let (parts, alpha) = split_args(body)?;
    let h = parse_hue(parts[0])?;
    let pct = |t: &str| -> Option<f64> {
        match parse_tok(t)? {
            Tok::Pct(p) => Some((p / 100.0).clamp(0.0, 1.0)),
            Tok::Num(_) => None,
        }
    };
    let s = pct(parts[1])?;
    let l = pct(parts[2])?;
    let a = parse_alpha(alpha)?;
    // CSS Color 4 §7.1 "hsl to rgb" sample algorithm.
    let h = h.rem_euclid(360.0);
    let f = |n: f64| {
        let k = (n + h / 30.0) % 12.0;
        let amp = s * l.min(1.0 - l);
        l - amp * (k - 3.0).min(9.0 - k).clamp(-1.0, 1.0)
    };
    // hsl() is a legacy sRGB colour: quantise to 8 bits like rgb().
    let q = |v: f64| (v.clamp(0.0, 1.0) * 255.0).round() as u8;
    Some(CssColor::from_u8(q(f(0.0)), q(f(8.0)), q(f(4.0)), a))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn u8s(c: CssColor) -> [u8; 3] {
        [
            (c.r * 255.0).round() as u8,
            (c.g * 255.0).round() as u8,
            (c.b * 255.0).round() as u8,
        ]
    }

    #[test]
    fn forms_used_by_the_web() {
        let c = parse_css_color("rgba(12,18,32,0.92)").unwrap();
        assert_eq!(u8s(c), [12, 18, 32]);
        assert!((c.a - 0.92).abs() < 1e-7);
        let c = parse_css_color("rgba(232, 216, 138, 0.72)").unwrap();
        assert_eq!(u8s(c), [232, 216, 138]);
        assert_eq!(u8s(parse_css_color("#e8d88a").unwrap()), [232, 216, 138]);
        assert_eq!(u8s(parse_css_color("#fff").unwrap()), [255, 255, 255]);
        assert_eq!(
            u8s(parse_css_color("rgb(140, 50, 3)").unwrap()),
            [140, 50, 3]
        );
        assert_eq!(parse_css_color("transparent").unwrap().a, 0.0);
    }

    #[test]
    fn rejects_garbage() {
        for s in [
            "",
            "#12",
            "#12345",
            "#ggg",
            "rgb(1,2)",
            "rgb(1,2,3,4,5)",
            "rgb(1 2,3)",
            "rgb(1,2%,3)",
            "hsl(1,2,3)",
            "nope",
            "rgb(nan,0,0)",
            "rgb(inf,0,0)",
        ] {
            assert!(parse_css_color(s).is_none(), "{s:?} must be rejected");
        }
    }
}
