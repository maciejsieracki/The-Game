//! Parser of the CSS `font` shorthand as accepted by `ctx.font = …`
//! (CSS Fonts 4 §3.7 grammar, the subset a 2D canvas understands).
//!
//! ```text
//! [ <font-style> || <font-variant-css2> || <font-weight> || <font-stretch-css3> ]?
//!   <font-size> [ / <line-height> ]? <font-family>#
//! ```
//!
//! Web uses (pin `edb8fb56`, `P4-25-TEXT-RASTER-AUDIT.md` §3.2): weight
//! keywords/numbers (`bold`, `600`, `700`, `900`), sizes in `px`, family lists
//! with quoted and unquoted names and the generics `serif` / `sans-serif`.
//! Style, variant and stretch are parsed (so a valid string is never
//! rejected) but have no bundled faces: see [`FontSpec::style`].

/// One entry of the family list.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum FamilyName {
    /// A named family (quoted string or space-joined identifiers), compared
    /// case-insensitively (ASCII) like CSS family names.
    Named(String),
    /// `serif`.
    Serif,
    /// `sans-serif`.
    SansSerif,
    /// `monospace`, `cursive`, `fantasy`, `system-ui` and the other generic
    /// keywords: no bundled face, skipped during font selection.
    OtherGeneric(String),
}

/// `font-style`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FontStyle {
    /// `normal`.
    Normal,
    /// `italic`.
    Italic,
    /// `oblique`.
    Oblique,
}

/// A parsed `font` value.
#[derive(Clone, Debug, PartialEq)]
pub struct FontSpec {
    /// `font-style`. NOTE: no italic faces are bundled and the web never asks
    /// for one, so italic/oblique text is drawn upright (documented gap,
    /// `P4-29-TEXT-FONTS.md` §3).
    pub style: FontStyle,
    /// `small-caps` was given (parsed, not rendered — unused by the web).
    pub small_caps: bool,
    /// Numeric weight 1–1000 (`normal` = 400, `bold` = 700; `bolder` /
    /// `lighter` are relative to the canvas default 400 → 700 / 100).
    pub weight: u16,
    /// Computed size in CSS px.
    pub size_px: f64,
    /// Family list in order.
    pub families: Vec<FamilyName>,
}

impl Default for FontSpec {
    /// The Canvas default `10px sans-serif`.
    fn default() -> Self {
        FontSpec {
            style: FontStyle::Normal,
            small_caps: false,
            weight: 400,
            size_px: 10.0,
            families: vec![FamilyName::SansSerif],
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
enum Tok {
    Ident(String),
    Str(String),
    Num(String),
    Comma,
    Slash,
}

fn tokenize(s: &str) -> Option<Vec<Tok>> {
    let mut out = Vec::new();
    let cs: Vec<char> = s.chars().collect();
    let mut i = 0;
    while i < cs.len() {
        let c = cs[i];
        if c.is_ascii_whitespace() {
            i += 1;
        } else if c == ',' {
            out.push(Tok::Comma);
            i += 1;
        } else if c == '/' {
            out.push(Tok::Slash);
            i += 1;
        } else if c == '"' || c == '\'' {
            let q = c;
            i += 1;
            let mut v = String::new();
            // CSS: end of input closes an unterminated string (Chromium
            // accepts `12px 'abc`, measured in fontparse.tsv).
            while let Some(&ch) = cs.get(i) {
                i += 1;
                if ch == q {
                    break;
                }
                if ch == '\\' {
                    if let Some(&e) = cs.get(i) {
                        v.push(e);
                        i += 1;
                    }
                } else {
                    v.push(ch);
                }
            }
            out.push(Tok::Str(v));
        } else if c.is_ascii_digit() || c == '.' || c == '+' {
            let st = i;
            while i < cs.len()
                && (cs[i].is_ascii_alphanumeric() || cs[i] == '.' || cs[i] == '%' || cs[i] == '+')
            {
                i += 1;
            }
            out.push(Tok::Num(cs[st..i].iter().collect()));
        } else if c.is_alphabetic() || c == '-' || c == '_' {
            let st = i;
            while i < cs.len() && (cs[i].is_alphanumeric() || cs[i] == '-' || cs[i] == '_') {
                i += 1;
            }
            out.push(Tok::Ident(cs[st..i].iter().collect()));
        } else {
            return None;
        }
    }
    Some(out)
}

/// `<number><unit>` → CSS px: absolute units (`px`, `pt`, `pc`, `in`, `cm`,
/// `mm`, `q`) and the units relative to the parent font, which for a canvas
/// not in a document is the default 10px (`em`, `%`; measured: `12em` →
/// 120px, `12%` → 1.2px in `fontparse.tsv`). Other relative units (`rem`,
/// `ex`, `ch`, viewport units) and size keywords (`medium`, …) are not
/// supported (unused by the web; ZAŁOŻENIE Z-29-5) and make the value
/// invalid.
fn length_px(t: &str) -> Option<f64> {
    let lower = t.to_ascii_lowercase();
    let split = lower
        .find(|c: char| c.is_ascii_alphabetic() || c == '%')
        .unwrap_or(lower.len());
    let (n, unit) = lower.split_at(split);
    let v: f64 = n.parse().ok()?;
    if !v.is_finite() || v < 0.0 {
        return None;
    }
    let k = match unit {
        "px" => 1.0,
        "pt" => 4.0 / 3.0,
        "pc" => 16.0,
        "in" => 96.0,
        "cm" => 96.0 / 2.54,
        "mm" => 96.0 / 25.4,
        "q" => 96.0 / 101.6,
        "em" => 10.0,
        "%" => 0.1,
        // A unitless 0 is a valid length.
        "" if v == 0.0 => 0.0,
        _ => return None,
    };
    Some(v * k)
}

fn is_stretch(s: &str) -> bool {
    matches!(
        s,
        "ultra-condensed"
            | "extra-condensed"
            | "condensed"
            | "semi-condensed"
            | "semi-expanded"
            | "expanded"
            | "extra-expanded"
            | "ultra-expanded"
    )
}

/// Parses a `font` shorthand; `None` = invalid (Canvas then keeps the
/// previous value).
#[must_use]
pub fn parse_font(s: &str) -> Option<FontSpec> {
    let toks = tokenize(s)?;
    let mut spec = FontSpec {
        families: Vec::new(),
        ..FontSpec::default()
    };
    let (mut seen_style, mut seen_variant, mut seen_weight, mut seen_stretch) =
        (false, false, false, false);
    let mut i = 0;
    // Prefix keywords (any order, each at most once; `normal` fills any slot).
    let size = loop {
        let t = toks.get(i)?;
        match t {
            Tok::Num(n) => {
                // A plain number 1..1000 is a weight; a number with a unit is
                // the size.
                if n.chars().all(|c| c.is_ascii_digit() || c == '.') {
                    let v: f64 = n.parse().ok()?;
                    if seen_weight || !(1.0..=1000.0).contains(&v) {
                        return None;
                    }
                    spec.weight = v.round() as u16;
                    seen_weight = true;
                    i += 1;
                } else {
                    i += 1;
                    break length_px(n)?;
                }
            }
            Tok::Ident(id) => {
                let l = id.to_ascii_lowercase();
                i += 1;
                match l.as_str() {
                    "normal" => {
                        // Fills the first unset slot; harmless either way.
                        if !seen_style {
                            seen_style = true;
                        } else if !seen_variant {
                            seen_variant = true;
                        } else if !seen_weight {
                            seen_weight = true;
                        } else if !seen_stretch {
                            seen_stretch = true;
                        } else {
                            return None;
                        }
                    }
                    "italic" | "oblique" if !seen_style => {
                        spec.style = if l == "italic" {
                            FontStyle::Italic
                        } else {
                            FontStyle::Oblique
                        };
                        seen_style = true;
                    }
                    "small-caps" if !seen_variant => {
                        spec.small_caps = true;
                        seen_variant = true;
                    }
                    "bold" | "bolder" | "lighter" if !seen_weight => {
                        spec.weight = match l.as_str() {
                            "bold" | "bolder" => 700,
                            _ => 100,
                        };
                        seen_weight = true;
                    }
                    s if is_stretch(s) && !seen_stretch => seen_stretch = true,
                    _ => return None,
                }
            }
            _ => return None,
        }
    };
    spec.size_px = size;
    // Optional `/ line-height` (ignored by Canvas).
    if toks.get(i) == Some(&Tok::Slash) {
        match toks.get(i + 1)? {
            Tok::Num(_) => {}
            Tok::Ident(l) if l.eq_ignore_ascii_case("normal") => {}
            _ => return None,
        }
        i += 2;
    }
    // Family list.
    loop {
        match toks.get(i)? {
            Tok::Str(v) => {
                spec.families.push(FamilyName::Named(v.clone()));
                i += 1;
            }
            Tok::Ident(_) => {
                let mut words = Vec::new();
                while let Some(Tok::Ident(w)) = toks.get(i) {
                    words.push(w.clone());
                    i += 1;
                }
                if words.len() == 1 {
                    let l = words[0].to_ascii_lowercase();
                    let fam = match l.as_str() {
                        "serif" => FamilyName::Serif,
                        "sans-serif" => FamilyName::SansSerif,
                        "monospace" | "cursive" | "fantasy" | "system-ui" | "math" | "emoji"
                        | "fangsong" | "ui-serif" | "ui-sans-serif" | "ui-monospace"
                        | "ui-rounded" => FamilyName::OtherGeneric(l),
                        "inherit" | "initial" | "unset" | "default" | "revert" => return None,
                        _ => FamilyName::Named(words[0].clone()),
                    };
                    spec.families.push(fam);
                } else {
                    spec.families.push(FamilyName::Named(words.join(" ")));
                }
            }
            _ => return None,
        }
        match toks.get(i) {
            None => break,
            Some(Tok::Comma) => i += 1,
            Some(_) => return None,
        }
    }
    Some(spec)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn named(s: &str) -> FamilyName {
        FamilyName::Named(s.to_owned())
    }

    #[test]
    fn web_font_strings_parse() {
        let f = parse_font(
            "bold 104px \"Segoe UI Symbol\", \"Segoe UI Emoji\", \"Segoe UI\", Arial, sans-serif",
        )
        .unwrap();
        assert_eq!(f.weight, 700);
        assert_eq!(f.size_px, 104.0);
        assert_eq!(
            f.families,
            vec![
                named("Segoe UI Symbol"),
                named("Segoe UI Emoji"),
                named("Segoe UI"),
                named("Arial"),
                FamilyName::SansSerif
            ]
        );
        let f = parse_font("bold 26px Segoe UI, Arial, sans-serif").unwrap();
        assert_eq!(f.families[0], named("Segoe UI"));
        let f = parse_font("900 118px \"Segoe UI\", Arial, sans-serif").unwrap();
        assert_eq!((f.weight, f.size_px), (900, 118.0));
        let f = parse_font("700 22px Georgia, \"Times New Roman\", serif").unwrap();
        assert_eq!(
            f.families,
            vec![
                named("Georgia"),
                named("Times New Roman"),
                FamilyName::Serif
            ]
        );
        let f = parse_font("600 11px Arial, Helvetica, sans-serif").unwrap();
        assert_eq!(f.weight, 600);
        let f = parse_font("48px serif").unwrap();
        assert_eq!(
            (f.weight, f.families.clone()),
            (400, vec![FamilyName::Serif])
        );
    }

    #[test]
    fn prefix_keywords_and_line_height() {
        let f = parse_font("italic small-caps bold condensed 12px/1.2 Arial").unwrap();
        assert_eq!(f.style, FontStyle::Italic);
        assert!(f.small_caps);
        assert_eq!(f.weight, 700);
        assert_eq!(f.size_px, 12.0);
        let f = parse_font("normal normal 12pt 'A B'").unwrap();
        assert_eq!(f.size_px, 16.0);
        assert_eq!(f.families, vec![named("A B")]);
        assert_eq!(parse_font("lighter 10px x").unwrap().weight, 100);
        assert_eq!(parse_font("12px/normal x").unwrap().size_px, 12.0);
        assert_eq!(parse_font("12em x").unwrap().size_px, 120.0);
        assert!((parse_font("12% x").unwrap().size_px - 1.2).abs() < 1e-12);
        assert_eq!(
            parse_font("12px 'unterminated").unwrap().families,
            vec![named("unterminated")]
        );
    }

    #[test]
    fn invalid_values_are_rejected() {
        for s in [
            "",
            "bold",
            "12px",
            "Arial 12px",
            "bold bold 12px x",
            "-1px x",
            "0 12px x",
            "1001 12px x",
            "12px x,",
            "12px inherit",
            "12px x y, , z",
            "12px x; y",
        ] {
            assert!(parse_font(s).is_none(), "{s:?} should be invalid");
        }
    }

    #[test]
    fn quoted_generic_is_a_family_name() {
        let f = parse_font("10px \"sans-serif\", serif").unwrap();
        assert_eq!(f.families, vec![named("sans-serif"), FamilyName::Serif]);
    }
}
