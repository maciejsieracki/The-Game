//! Bundled fonts (owner decision D-TXT-1 = A) and the family → face mapping.
//!
//! The files live in `rust-port/renderer/assets/fonts/` (licences and
//! `MANIFEST.sha256` next to them) and are compiled into the binary with
//! `include_bytes!`, so text never depends on fonts installed on the player's
//! system (D-RR-4 = A).

use std::sync::OnceLock;

use ab_glyph::{Font as _, FontRef, GlyphId};

use super::font::{FamilyName, FontSpec};

/// A bundled font file.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum BundledFace {
    /// `LiberationSans-Regular.ttf` (metric-compatible with Arial).
    LiberationSansRegular,
    /// `LiberationSans-Bold.ttf`.
    LiberationSansBold,
    /// `LiberationSerif-Regular.ttf` (metric-compatible with Times New Roman).
    LiberationSerifRegular,
    /// `LiberationSerif-Bold.ttf`.
    LiberationSerifBold,
    /// `DejaVuSans.ttf` (symbols ⚔ ☠ ◆ …; last-resort fallback).
    DejaVuSans,
    /// `DejaVuSans-Bold.ttf`.
    DejaVuSansBold,
}

impl BundledFace {
    /// All bundled faces, in a fixed order.
    pub const ALL: [BundledFace; 6] = [
        BundledFace::LiberationSansRegular,
        BundledFace::LiberationSansBold,
        BundledFace::LiberationSerifRegular,
        BundledFace::LiberationSerifBold,
        BundledFace::DejaVuSans,
        BundledFace::DejaVuSansBold,
    ];

    /// File name inside `assets/fonts/`.
    #[must_use]
    pub const fn file_name(self) -> &'static str {
        match self {
            BundledFace::LiberationSansRegular => "LiberationSans-Regular.ttf",
            BundledFace::LiberationSansBold => "LiberationSans-Bold.ttf",
            BundledFace::LiberationSerifRegular => "LiberationSerif-Regular.ttf",
            BundledFace::LiberationSerifBold => "LiberationSerif-Bold.ttf",
            BundledFace::DejaVuSans => "DejaVuSans.ttf",
            BundledFace::DejaVuSansBold => "DejaVuSans-Bold.ttf",
        }
    }

    /// The font file bytes compiled into the crate.
    #[must_use]
    pub fn data(self) -> &'static [u8] {
        match self {
            BundledFace::LiberationSansRegular => {
                include_bytes!("../../../assets/fonts/LiberationSans-Regular.ttf")
            }
            BundledFace::LiberationSansBold => {
                include_bytes!("../../../assets/fonts/LiberationSans-Bold.ttf")
            }
            BundledFace::LiberationSerifRegular => {
                include_bytes!("../../../assets/fonts/LiberationSerif-Regular.ttf")
            }
            BundledFace::LiberationSerifBold => {
                include_bytes!("../../../assets/fonts/LiberationSerif-Bold.ttf")
            }
            BundledFace::DejaVuSans => include_bytes!("../../../assets/fonts/DejaVuSans.ttf"),
            BundledFace::DejaVuSansBold => {
                include_bytes!("../../../assets/fonts/DejaVuSans-Bold.ttf")
            }
        }
    }

    /// Nominal weight of the face (400 or 700).
    #[must_use]
    pub const fn weight(self) -> u16 {
        match self {
            BundledFace::LiberationSansBold
            | BundledFace::LiberationSerifBold
            | BundledFace::DejaVuSansBold => 700,
            _ => 400,
        }
    }

    fn index(self) -> usize {
        self as usize
    }
}

/// A bundled family (Regular + Bold).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BundledFamily {
    /// Liberation Sans.
    LiberationSans,
    /// Liberation Serif.
    LiberationSerif,
    /// DejaVu Sans.
    DejaVuSans,
}

impl BundledFamily {
    /// The face for a requested CSS weight. With only 400 and 700 available
    /// the CSS Fonts 4 §5.2 matching rule reduces to: weight > 500 → Bold,
    /// otherwise Regular (600 and 900 → 700; 500 → 400).
    #[must_use]
    pub const fn face(self, weight: u16) -> BundledFace {
        let bold = weight > 500;
        match (self, bold) {
            (BundledFamily::LiberationSans, false) => BundledFace::LiberationSansRegular,
            (BundledFamily::LiberationSans, true) => BundledFace::LiberationSansBold,
            (BundledFamily::LiberationSerif, false) => BundledFace::LiberationSerifRegular,
            (BundledFamily::LiberationSerif, true) => BundledFace::LiberationSerifBold,
            (BundledFamily::DejaVuSans, false) => BundledFace::DejaVuSans,
            (BundledFamily::DejaVuSans, true) => BundledFace::DejaVuSansBold,
        }
    }
}

/// The last-resort fallback family (stands in for the browser's system
/// fallback; ZAŁOŻENIE Z-29-2).
pub const FALLBACK_FAMILY: BundledFamily = BundledFamily::DejaVuSans;

/// Maps one family of a CSS stack to a bundled family (ZAŁOŻENIE Z-29-1,
/// D-TXT-1 = A). Names are ASCII case-insensitive. `None` = not available,
/// skipped like a family that is not installed.
///
/// | CSS family | bundled |
/// |---|---|
/// | `Arial`, `Helvetica`, `sans-serif`, `Liberation Sans`, `Arimo` | Liberation Sans |
/// | `Times New Roman`, `Times`, `serif`, `Liberation Serif`, `Tinos` | Liberation Serif |
/// | `DejaVu Sans` | DejaVu Sans |
/// | anything else (`Segoe UI`, `Segoe UI Symbol`, `Georgia`, `Tahoma`, …) | — |
#[must_use]
pub fn map_family(f: &FamilyName) -> Option<BundledFamily> {
    match f {
        FamilyName::SansSerif => Some(BundledFamily::LiberationSans),
        FamilyName::Serif => Some(BundledFamily::LiberationSerif),
        FamilyName::OtherGeneric(_) => None,
        FamilyName::Named(n) => {
            let l = n.to_ascii_lowercase();
            match l.as_str() {
                "arial" | "helvetica" | "liberation sans" | "arimo" => {
                    Some(BundledFamily::LiberationSans)
                }
                "times new roman" | "times" | "liberation serif" | "tinos" => {
                    Some(BundledFamily::LiberationSerif)
                }
                "dejavu sans" => Some(BundledFamily::DejaVuSans),
                _ => None,
            }
        }
    }
}

/// The ordered list of faces tried for each character of `spec`: the mapped
/// families of the stack (duplicates removed), then the fallback family.
#[must_use]
pub fn face_chain(spec: &FontSpec) -> Vec<BundledFace> {
    let mut out: Vec<BundledFace> = Vec::new();
    for fam in spec
        .families
        .iter()
        .filter_map(map_family)
        .chain(std::iter::once(FALLBACK_FAMILY))
    {
        let face = fam.face(spec.weight);
        if !out.contains(&face) {
            out.push(face);
        }
    }
    out
}

/// A parsed bundled face.
pub(crate) struct LoadedFace {
    pub(crate) ab: FontRef<'static>,
    pub(crate) hb: rustybuzz::Face<'static>,
    pub(crate) upem: f64,
    /// `hhea` ascender / descender (descender positive), font units.
    pub(crate) hhea_ascent: f64,
    pub(crate) hhea_descent: f64,
    /// OS/2 `sTypoAscender` / `sTypoDescender` (descender positive).
    pub(crate) typo: Option<(f64, f64)>,
}

impl LoadedFace {
    fn load(face: BundledFace) -> LoadedFace {
        let data = face.data();
        let ab = FontRef::try_from_slice(data).expect("bundled font parses (ab_glyph)");
        let hb = rustybuzz::Face::from_slice(data, 0).expect("bundled font parses (rustybuzz)");
        let upem = f64::from(hb.units_per_em());
        let hhea_ascent = f64::from(hb.ascender());
        let hhea_descent = -f64::from(hb.descender());
        let typo = hb.tables().os2.and_then(|os2| {
            let (a, d) = (
                f64::from(os2.typographic_ascender()),
                -f64::from(os2.typographic_descender()),
            );
            (a + d > 0.0).then_some((a, d))
        });
        LoadedFace {
            ab,
            hb,
            upem,
            hhea_ascent,
            hhea_descent,
            typo,
        }
    }

    /// Glyph id for `c`, `None` when the font has no glyph (cmap → 0).
    pub(crate) fn glyph(&self, c: char) -> Option<GlyphId> {
        let g = self.ab.glyph_id(c);
        (g.0 != 0).then_some(g)
    }
}

static FACES: OnceLock<Vec<LoadedFace>> = OnceLock::new();

/// The parsed face (parsed once per process).
pub(crate) fn loaded(face: BundledFace) -> &'static LoadedFace {
    let all = FACES.get_or_init(|| {
        BundledFace::ALL
            .iter()
            .map(|f| LoadedFace::load(*f))
            .collect()
    });
    &all[face.index()]
}

/// `true` when the bundled face has a (non-`.notdef`) glyph for `c`.
#[must_use]
pub fn face_has_glyph(face: BundledFace, c: char) -> bool {
    loaded(face).glyph(c).is_some()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::raster::text::font::parse_font;

    #[test]
    fn all_faces_parse_and_have_latin() {
        for f in BundledFace::ALL {
            let l = loaded(f);
            assert!(l.upem > 0.0, "{f:?}");
            assert!(l.glyph('A').is_some(), "{f:?}");
            assert!(l.glyph('\u{10FFFF}').is_none(), "{f:?}");
        }
    }

    #[test]
    fn web_stacks_map_like_a_browser_without_windows_fonts() {
        let chain = |s: &str| face_chain(&parse_font(s).unwrap());
        assert_eq!(
            chain("bold 26px Segoe UI, Arial, sans-serif"),
            vec![BundledFace::LiberationSansBold, BundledFace::DejaVuSansBold]
        );
        assert_eq!(
            chain("700 22px Georgia, \"Times New Roman\", serif"),
            vec![
                BundledFace::LiberationSerifBold,
                BundledFace::DejaVuSansBold
            ]
        );
        assert_eq!(
            chain("600 11px Arial, Helvetica, sans-serif"),
            vec![BundledFace::LiberationSansBold, BundledFace::DejaVuSansBold]
        );
        assert_eq!(
            chain("500 11px Arial"),
            vec![BundledFace::LiberationSansRegular, BundledFace::DejaVuSans]
        );
        assert_eq!(chain("12px Segoe UI Symbol"), vec![BundledFace::DejaVuSans]);
        assert_eq!(
            chain("12px monospace, serif"),
            vec![BundledFace::LiberationSerifRegular, BundledFace::DejaVuSans]
        );
    }
}
