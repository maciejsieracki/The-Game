//! `render/unitOwnerEmblem.ts` (pin `edb8fb56`, 516 LOC): the owner
//! medallion — portrait of the leader (full civilisation), culture sigil
//! (city-state) or skull (barbarians) on a dark disc with a ring whose
//! colour carries the variant.
//!
//! Decision order 1:1 with the web (`:339-344`, = `ui/preBattle.ts`):
//! barbarians first, then city-state, then the portrait; no portrait → civ
//! sigil; no sigil → the fallback glyph stays.

use super::{canvas, Anchor, MaterialKind, NodeKind, OverlayMaterial, OverlayNode, OverlayTexture};
use super::{js_number_string, js_trim, OverlayTree, Side, TextureFilter, TextureRef};
use crate::core::hexutil::HEX_R;
use crate::pick::hex::js_round;
use crate::raster::image::emoji::{self, TextStyle};
use crate::raster::image::jpeg::decode_jpeg;
use crate::raster::image::mip::{draw_bitmap, MippedImage};
use crate::raster::image::svg::{draw_svg, prepare_svg_for_canvas, SvgImage};
use crate::raster::{Canvas2dLite, RasterError, RasterImage};
use crate::terrain::color::Color;

/// `UnitOwnerEmblemContext` (`:91-100`).
#[derive(Clone, Debug, PartialEq)]
pub struct OwnerEmblemContext {
    /// `civId` — `ikonaId` of the civilisation, `None` = unknown.
    pub civ_id: Option<String>,
    /// `era` — 1 stone, 2 bronze, 3 iron (any JS number).
    pub era: f64,
    /// `isCityState`.
    pub is_city_state: bool,
    /// `isBarbarian` (checked before `is_city_state`).
    pub is_barbarian: bool,
}

/// `UnitOwnerEmblemAssets` (`:121-128`), injected by the composer like
/// `main.ts:8526-8530` does.
pub trait OwnerEmblemAssets {
    /// `leaderPortraitUrl(civId, era)`: the JPEG bytes of the portrait (the
    /// web gets a `data:` URI of the same bytes), `None` = no portrait.
    fn leader_portrait_jpeg(&self, civ_id: &str, era: f64) -> Option<Vec<u8>>;
    /// `civSigilSvg(civId)` — `civIconSvg(civId, 40)`; may be empty.
    fn civ_sigil_svg(&self, civ_id: &str) -> String;
    /// `barbarianSigilSvg()` — `brandIconSvg('chip-death', 40)`.
    fn barbarian_sigil_svg(&self) -> String;
}

/// `EMBLEM_SPRITE_SIZE` (`:159`), legacy sprite side.
pub const EMBLEM_SPRITE_SIZE: f64 = 0.36 * HEX_R;
/// `EMBLEM_X` (`:161`).
pub const EMBLEM_X: f64 = -0.50 * HEX_R;
/// `EMBLEM_Y` (`:163`).
pub const EMBLEM_Y: f64 = 0.42 * HEX_R;
/// `EMBLEM_Z` (`:165`).
pub const EMBLEM_Z: f64 = 0.20 * HEX_R;
/// `EMBLEM_RENDER_ORDER` (`:170`).
pub const EMBLEM_RENDER_ORDER: i32 = 14;
/// `CANVAS_PX` (`:173`).
pub const CANVAS_PX: u32 = 128;
/// `DISC_FILL` (`:186`).
pub const DISC_FILL: &str = "rgba(12,17,26,0.92)";
/// `DISC_R` (`:189`).
pub const DISC_R: f64 = 54.0;
/// `DISC_RING_W` (`:201`).
pub const DISC_RING_W: f64 = 14.0;
/// `DISC_PORTRAIT_R` (`:203`).
pub const DISC_PORTRAIT_R: f64 = 48.0;
/// `DISC_SIGIL_SIDE` (`:205`).
pub const DISC_SIGIL_SIDE: f64 = 76.0;
/// Default `strokeBoost` of `prepareSvgForCanvas` (`:224`).
pub const SVG_STROKE_BOOST: f64 = 1.6;
/// Font of the fallback glyph (`:260`).
pub const FALLBACK_FONT: &str = "bold 58px \"Segoe UI Symbol\", \"Segoe UI\", Arial, sans-serif";

/// `EmblemVariant` (`:239`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EmblemVariant {
    /// `'civ'` — full civilisation.
    Civ,
    /// `'cityState'`.
    CityState,
    /// `'barbarian'`.
    Barbarian,
}

impl EmblemVariant {
    /// The variant of a context (`:340-344`): barbarians before city-states.
    #[must_use]
    pub fn of(octx: &OwnerEmblemContext) -> Self {
        if octx.is_barbarian {
            EmblemVariant::Barbarian
        } else if octx.is_city_state {
            EmblemVariant::CityState
        } else {
            EmblemVariant::Civ
        }
    }

    /// `RING_COLOR[variant]` (`:176-183`).
    #[must_use]
    pub const fn ring_color(self) -> &'static str {
        match self {
            EmblemVariant::Civ => "#e8d88a",
            EmblemVariant::CityState => "#b9c8d8",
            EmblemVariant::Barbarian => "#c84040",
        }
    }

    /// The fallback glyph (`:263`).
    #[must_use]
    pub const fn fallback_glyph(self) -> &'static str {
        match self {
            EmblemVariant::Barbarian => "\u{2620}",
            _ => "\u{25c6}",
        }
    }
}

/// `emblemKey(ctx)` / `ownerEmblemKey(ctx)` (`:306-312`, `:426-428`).
#[must_use]
pub fn owner_emblem_key(octx: &OwnerEmblemContext) -> String {
    if octx.is_barbarian {
        return "barb".into();
    }
    let trimmed = js_trim(octx.civ_id.as_deref().unwrap_or("")).to_lowercase();
    let civ = if trimmed.is_empty() {
        "unknown".to_owned()
    } else {
        trimmed
    };
    if octx.is_city_state {
        return format!("cs:{civ}");
    }
    // Math.max(1, Math.round(era) || 1): NaN and ±0 are falsy.
    let r = js_round(octx.era);
    let r = if r.is_nan() || r == 0.0 { 1.0 } else { r };
    let era = if r.is_nan() || r < 1.0 { 1.0 } else { r };
    format!("civ:{civ}:{}", js_number_string(era))
}

fn arc_full(ctx: &mut Canvas2dLite, c: f64, r: f64) -> Result<(), RasterError> {
    ctx.begin_path();
    ctx.arc(c, c, r, 0.0, std::f64::consts::PI * 2.0, false)
}

/// `drawDisc(ctx, variant)` (`:242-254`): dark disc + variant ring.
///
/// # Errors
/// Only for a negative radius (never with these constants).
pub fn draw_disc(ctx: &mut Canvas2dLite, variant: EmblemVariant) -> Result<(), RasterError> {
    let c = f64::from(CANVAS_PX) / 2.0;
    ctx.clear_rect(0.0, 0.0, f64::from(CANVAS_PX), f64::from(CANVAS_PX));
    ctx.set_fill_style(DISC_FILL);
    arc_full(ctx, c, DISC_R)?;
    ctx.fill();
    ctx.set_stroke_style(variant.ring_color());
    ctx.set_line_width(DISC_RING_W);
    arc_full(ctx, c, DISC_R)?;
    ctx.stroke();
    Ok(())
}

/// `drawFallbackGlyph(ctx, variant)` (`:257-264`). The glyph (◆ / ☠) is drawn
/// through the emoji-aware text path of RR-T8c (DejaVu mono glyph in the
/// `fillStyle` colour, P4-30 Z-30-3).
pub fn draw_fallback_glyph(ctx: &mut Canvas2dLite, variant: EmblemVariant) {
    let c = f64::from(CANVAS_PX) / 2.0;
    ctx.set_fill_style(variant.ring_color());
    ctx.set_font(FALLBACK_FONT);
    ctx.set_text_align("center");
    ctx.set_text_baseline("middle");
    if let Some(style) = TextStyle::new(FALLBACK_FONT, "center", "middle") {
        emoji::fill_text(ctx, &style, variant.fallback_glyph(), c, c + 3.0);
    }
}

/// `drawPortrait(ctx, img)` (`:267-281`): cover-fit, clipped to a circle,
/// anchored at the top of the frame.
///
/// # Errors
/// Only for a negative radius (never with these constants).
pub fn draw_portrait(ctx: &mut Canvas2dLite, img: &MippedImage) -> Result<(), RasterError> {
    let c = f64::from(CANVAS_PX) / 2.0;
    let r = DISC_PORTRAIT_R;
    ctx.save();
    arc_full(ctx, c, r)?;
    ctx.clip();
    let side = r * 2.0;
    let (iw, ih) = (f64::from(img.width()), f64::from(img.height()));
    let scale = (side / iw).max(side / ih);
    let w = iw * scale;
    let h = ih * scale;
    draw_bitmap(ctx, img, c - w / 2.0, c - r, w, h);
    ctx.restore();
    Ok(())
}

/// `drawSigil(ctx, img)` (`:284-288`).
pub fn draw_sigil(ctx: &mut Canvas2dLite, img: &SvgImage) {
    let c = f64::from(CANVAS_PX) / 2.0;
    let side = DISC_SIGIL_SIDE;
    draw_svg(ctx, img, c - side / 2.0, c - side / 2.0, side, side);
}

/// The ring stroked again over the portrait (`:391-397`).
fn ring_on_top(ctx: &mut Canvas2dLite) -> Result<(), RasterError> {
    let c = f64::from(CANVAS_PX) / 2.0;
    ctx.set_stroke_style(EmblemVariant::Civ.ring_color());
    ctx.set_line_width(DISC_RING_W);
    arc_full(ctx, c, DISC_R)?;
    ctx.stroke();
    Ok(())
}

/// The owner medallion texture of one variant key.
#[derive(Clone, Debug, PartialEq)]
pub struct OwnerEmblemTexture {
    /// `ownerEmblemKey(ctx)`.
    pub key: String,
    /// Variant.
    pub variant: EmblemVariant,
    /// The synchronous first state: disc + fallback glyph (`:346-347`).
    pub initial: OverlayTexture,
    /// The state after the image has loaded (= `initial` when nothing loads).
    pub texture: OverlayTexture,
}

/// What the asynchronous phase would draw (`:363-413`).
enum Content {
    None,
    Sigil(Box<SvgImage>),
    Portrait(MippedImage),
}

fn sigil(raw: &str, ring: &str) -> Content {
    let svg = prepare_svg_for_canvas(raw, ring, SVG_STROKE_BOOST);
    // An empty or unparsable document never fires `onload` (the web
    // `onerror` path): the disc with the fallback glyph stays.
    SvgImage::parse(&svg).map_or(Content::None, |i| Content::Sigil(Box::new(i)))
}

fn resolve(octx: &OwnerEmblemContext, assets: Option<&dyn OwnerEmblemAssets>) -> Content {
    let Some(assets) = assets else {
        return Content::None;
    };
    let civ = js_trim(octx.civ_id.as_deref().unwrap_or(""));
    match EmblemVariant::of(octx) {
        EmblemVariant::Barbarian => sigil(
            &assets.barbarian_sigil_svg(),
            EmblemVariant::Barbarian.ring_color(),
        ),
        EmblemVariant::CityState => sigil(
            &assets.civ_sigil_svg(civ),
            EmblemVariant::CityState.ring_color(),
        ),
        EmblemVariant::Civ => {
            if let Some(jpg) = assets.leader_portrait_jpeg(civ, octx.era) {
                // A portrait that fails to decode = `onerror`: no sigil
                // fallback (the web only falls back when there is no URL).
                return decode_jpeg(&jpg).map_or(Content::None, |img: RasterImage| {
                    Content::Portrait(MippedImage::new(img))
                });
            }
            let svg = prepare_svg_for_canvas(
                &assets.civ_sigil_svg(civ),
                EmblemVariant::Civ.ring_color(),
                SVG_STROKE_BOOST,
            );
            if svg.is_empty() {
                return Content::None;
            }
            SvgImage::parse(&svg).map_or(Content::None, |i| Content::Sigil(Box::new(i)))
        }
    }
}

fn emblem_texture(c: &Canvas2dLite) -> OverlayTexture {
    let s = super::stat_plate::PLATE_OWNER_ICON_SIZE;
    OverlayTexture::from_canvas(c, TextureFilter::Linear, Anchor::Center, [s, s])
}

/// `getEmblemAsset(octx)` (`:328-414`) without the cache: the medallion
/// texture of `octx`, both phases.
///
/// The web caches one texture per [`owner_emblem_key`] — the FIRST context
/// of a key wins (e.g. `era` 2.4 and 2 share `civ:…:2`, the portrait is
/// looked up with the raw `era` of the first one). A caller that caches by
/// key reproduces that.
///
/// # Errors
/// [`RasterError`] from the canvas (never for these constant sizes).
pub fn render_owner_emblem(
    octx: &OwnerEmblemContext,
    assets: Option<&dyn OwnerEmblemAssets>,
) -> Result<OwnerEmblemTexture, RasterError> {
    let variant = EmblemVariant::of(octx);
    let mut ctx = canvas(CANVAS_PX, CANVAS_PX)?;
    draw_disc(&mut ctx, variant)?;
    draw_fallback_glyph(&mut ctx, variant);
    let initial = emblem_texture(&ctx);
    let texture = match resolve(octx, assets) {
        Content::None => initial.clone(),
        Content::Sigil(img) => {
            draw_disc(&mut ctx, variant)?;
            draw_sigil(&mut ctx, &img);
            OverlayTexture {
                redrawn_after_load: true,
                ..emblem_texture(&ctx)
            }
        }
        Content::Portrait(img) => {
            draw_disc(&mut ctx, variant)?;
            draw_portrait(&mut ctx, &img)?;
            ring_on_top(&mut ctx)?;
            OverlayTexture {
                redrawn_after_load: true,
                ..emblem_texture(&ctx)
            }
        }
    };
    Ok(OwnerEmblemTexture {
        key: owner_emblem_key(octx),
        variant,
        initial,
        texture,
    })
}

/// `SpriteMaterial` of the medallion (`:352-358`).
#[must_use]
pub fn owner_emblem_sprite_material(key: &str) -> OverlayMaterial {
    let white = Color::from_hex(0x00ff_ffff);
    OverlayMaterial {
        kind: MaterialKind::Sprite,
        color: [white.r, white.g, white.b],
        emissive: None,
        map: Some(TextureRef::OwnerEmblem(key.to_owned())),
        emissive_map: None,
        transparent: true,
        depth_test: false,
        depth_write: false,
        tone_mapped: false,
        side: Side::Front,
        opacity: 1.0,
        roughness: None,
        metalness: None,
    }
}

/// LEGACY `applyUnitOwnerEmblem(group, octx)` (`:480-503`): the large
/// stand-alone medallion sprite at the left edge of the hex. The game no
/// longer calls it (only `tools/.zeton-max` previews); `None` = no sprite.
#[must_use]
pub fn legacy_owner_emblem_sprite(octx: Option<&OwnerEmblemContext>) -> Option<OverlayTree> {
    let octx = octx?;
    let key = owner_emblem_key(octx);
    let mut t = OverlayTree::default();
    t.push(OverlayNode {
        name: "",
        parent: None,
        position: [EMBLEM_X, EMBLEM_Y, EMBLEM_Z],
        rotation: [0.0; 3],
        scale: [EMBLEM_SPRITE_SIZE, EMBLEM_SPRITE_SIZE, 1.0],
        render_order: EMBLEM_RENDER_ORDER,
        visible: true,
        veteran_badge_hit: false,
        kind: NodeKind::Sprite {
            center: [0.5, 0.5],
            material: owner_emblem_sprite_material(&key),
        },
    });
    Some(t)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx(civ: Option<&str>, era: f64, cs: bool, barb: bool) -> OwnerEmblemContext {
        OwnerEmblemContext {
            civ_id: civ.map(str::to_owned),
            era,
            is_city_state: cs,
            is_barbarian: barb,
        }
    }

    /// `drawPortrait` anchors the cover-fit image at the TOP of the circle
    /// (`unitOwnerEmblem.ts:278-279`: `drawImage(img, c - w/2, c - r, w, h)`).
    /// Every portrait of the pin is 256×256 (45 files), where top and centre
    /// anchoring coincide, so the web fixtures cannot see it; a 1×2 image
    /// (red over blue) does: scale = max(96/1, 96/2) = 96 → the image spans
    /// y 16…208, the texel centres are at y 64 (red) and 160 (blue), so with
    /// bilinear filtering y = 60 is pure red and y = 100 still mostly red
    /// (centred: texel centres at 16 and 112 → both rows mostly blue).
    #[test]
    fn portrait_is_anchored_at_the_top() {
        let img =
            RasterImage::from_straight_rgba8(1, 2, &[255, 0, 0, 255, 0, 0, 255, 255]).expect("1x2");
        let mut c = Canvas2dLite::new(CANVAS_PX, CANVAS_PX).expect("canvas");
        draw_portrait(&mut c, &MippedImage::new(img)).expect("portrait");
        let px = c.to_rgba8_straight();
        let at = |x: usize, y: usize| px[(y * 128 + x) * 4..(y * 128 + x) * 4 + 4].to_vec();
        assert_eq!(at(64, 60), vec![255, 0, 0, 255]);
        let mid = at(64, 100);
        assert!(mid[0] > mid[2], "y=100 mostly red: {mid:?}");
    }

    #[test]
    fn keys_follow_the_web_rules() {
        assert_eq!(
            owner_emblem_key(&ctx(Some("grecy"), 2.0, true, true)),
            "barb"
        );
        assert_eq!(
            owner_emblem_key(&ctx(Some(" Grecy "), 2.0, true, false)),
            "cs:grecy"
        );
        assert_eq!(
            owner_emblem_key(&ctx(None, 2.5, false, false)),
            "civ:unknown:3"
        );
        assert_eq!(
            owner_emblem_key(&ctx(Some("x"), f64::NAN, false, false)),
            "civ:x:1"
        );
        assert_eq!(
            owner_emblem_key(&ctx(Some("x"), -0.5, false, false)),
            "civ:x:1"
        );
        assert_eq!(
            owner_emblem_key(&ctx(Some("x"), f64::INFINITY, false, false)),
            "civ:x:Infinity"
        );
    }
}
