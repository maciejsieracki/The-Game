//! Throwaway spike (P4-25): CPU text + shape rasterisation to an RGBA buffer,
//! no GPU, `forbid(unsafe_code)`. Not part of the repo.
#![forbid(unsafe_code)]

use ab_glyph::{Font, FontRef, GlyphId, OutlineCurve};
use tiny_skia::{
    Color, FillRule, GradientStop, LinearGradient, Paint, PathBuilder, Pixmap, Point, Rect,
    SpreadMode, Stroke, Transform,
};

/// CSS `font-size` (em, px) -> ab_glyph PxScale (which is ascent-descent height).
fn css_scale(f: &FontRef, px: f32) -> f32 {
    px * f.height_unscaled() / f.units_per_em().unwrap()
}

/// Width of `text` like `measureText().width` (advances + kerning, no shaping).
fn measure(f: &FontRef, px: f32, text: &str, kern: bool) -> f32 {
    let s = px / f.units_per_em().unwrap();
    let mut w = 0.0;
    let mut prev: Option<GlyphId> = None;
    for ch in text.chars() {
        let g = f.glyph_id(ch);
        if kern {
            if let Some(p) = prev {
                w += f.kern_unscaled(p, g) * s;
            }
        }
        w += f.h_advance_unscaled(g) * s;
        prev = Some(g);
    }
    w
}

/// Append glyph outlines of `text` at baseline (x, y) to a path builder.
fn text_path(pb: &mut PathBuilder, f: &FontRef, px: f32, text: &str, mut x: f32, y: f32) -> usize {
    let s = px / f.units_per_em().unwrap();
    let mut missing = 0;
    let mut prev: Option<GlyphId> = None;
    for ch in text.chars() {
        let g = f.glyph_id(ch);
        if g.0 == 0 {
            missing += 1;
        }
        if let Some(p) = prev {
            x += f.kern_unscaled(p, g) * s;
        }
        if let Some(o) = f.outline(g) {
            let mut last: Option<(f32, f32)> = None;
            let tp = |p: ab_glyph::Point| (x + p.x * s, y - p.y * s);
            for c in &o.curves {
                let (a, rest): ((f32, f32), Vec<(f32, f32)>) = match c {
                    OutlineCurve::Line(a, b) => (tp(*a), vec![tp(*b)]),
                    OutlineCurve::Quad(a, b, c2) => (tp(*a), vec![tp(*b), tp(*c2)]),
                    OutlineCurve::Cubic(a, b, c2, d) => (tp(*a), vec![tp(*b), tp(*c2), tp(*d)]),
                };
                if last != Some(a) {
                    if last.is_some() {
                        pb.close();
                    }
                    pb.move_to(a.0, a.1);
                }
                match rest.len() {
                    1 => pb.line_to(rest[0].0, rest[0].1),
                    2 => pb.quad_to(rest[0].0, rest[0].1, rest[1].0, rest[1].1),
                    _ => pb.cubic_to(rest[0].0, rest[0].1, rest[1].0, rest[1].1, rest[2].0, rest[2].1),
                }
                last = Some(*rest.last().unwrap());
            }
            if last.is_some() {
                pb.close();
            }
        }
        x += f.h_advance_unscaled(g) * s;
        prev = Some(g);
    }
    missing
}

fn fnv(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in bytes {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

fn main() {
    let a: Vec<String> = std::env::args().collect();
    let sans_b = std::fs::read(&a[1]).unwrap(); // Liberation Sans Bold (Arial metrics)
    let serif_b = std::fs::read(&a[2]).unwrap(); // Liberation Serif Bold
    let emoji = std::fs::read(&a[3]).unwrap(); // Noto Color Emoji
    let dejavu_b = std::fs::read(&a[4]).unwrap(); // DejaVu Sans Bold
    let out = &a[5];
    let sans = FontRef::try_from_slice(&sans_b).unwrap();
    let serif = FontRef::try_from_slice(&serif_b).unwrap();
    let emo = FontRef::try_from_slice(&emoji).unwrap();
    let dv = FontRef::try_from_slice(&dejavu_b).unwrap();

    // --- metrics vs numbers measured in Chromium and quoted in the web source
    println!("css_scale(sans,13)={:.4}", css_scale(&sans, 13.0));
    for (t, k) in [("−99,9%", false), ("−99,9%", true)] {
        let w = measure(&sans, 13.0, t, k);
        println!("LiberationSans-Bold 13px '{t}' kern={k}: {w:.3} ceil={}", w.ceil());
    }
    for (t, k) in [("UMGUNGUNDLOVU", false), ("UMGUNGUNDLOVU", true), ("uMgungundlovu", true)] {
        let w = measure(&serif, 22.0, t, k);
        println!("LiberationSerif-Bold 22px '{t}' kern={k}: {w:.3}");
    }
    // glyph coverage of map strings
    for (name, f) in [("LiberationSans-Bold", &sans), ("DejaVuSans-Bold", &dv), ("NotoColorEmoji", &emo)] {
        let mut miss = Vec::new();
        for ch in "ĄĆĘŁŃÓŚŹŻąćęłńóśźż×…−—·%⚔☠◆👤🔥🍞🔨💰".chars() {
            if f.glyph_id(ch).0 == 0 {
                miss.push(ch);
            }
        }
        println!("{name}: missing {:?}", miss.iter().collect::<String>());
    }
    // colour emoji: outline vs raster image
    for ch in ['🔥', '👤', '⚔'] {
        let g = emo.glyph_id(ch);
        let ol = emo.outline(g).is_some();
        let img = emo.glyph_raster_image2(g, 128);
        println!(
            "NotoColorEmoji {ch}: id={} outline={ol} raster={:?}",
            g.0,
            img.map(|i| (i.width, i.height, i.pixels_per_em, format!("{:?}", i.format), i.data.len()))
        );
    }

    // --- render a city-badge-like pill: gradient rounded rect + stroke + PL text
    let (w, h) = (360u32, 48u32);
    let mut pm = Pixmap::new(w, h).unwrap();
    let rr = {
        let (x, y, ww, hh, r) = (2.0f32, 2.0f32, w as f32 - 4.0, h as f32 - 4.0, 20.0f32);
        let mut pb = PathBuilder::new();
        pb.move_to(x + r, y);
        pb.line_to(x + ww - r, y);
        pb.quad_to(x + ww, y, x + ww, y + r);
        pb.line_to(x + ww, y + hh - r);
        pb.quad_to(x + ww, y + hh, x + ww - r, y + hh);
        pb.line_to(x + r, y + hh);
        pb.quad_to(x, y + hh, x, y + hh - r);
        pb.line_to(x, y + r);
        pb.quad_to(x, y, x + r, y);
        pb.close();
        pb.finish().unwrap()
    };
    let mut paint = Paint::default();
    paint.anti_alias = true;
    paint.shader = LinearGradient::new(
        Point::from_xy(0.0, 0.0),
        Point::from_xy(0.0, h as f32),
        vec![
            GradientStop::new(0.0, Color::from_rgba8(16, 22, 34, 245)),
            GradientStop::new(1.0, Color::from_rgba8(8, 10, 16, 240)),
        ],
        SpreadMode::Pad,
        Transform::identity(),
    )
    .unwrap();
    pm.fill_path(&rr, &paint, FillRule::Winding, Transform::identity(), None);
    let mut sp = Paint::default();
    sp.anti_alias = true;
    sp.set_color_rgba8(232, 216, 138, 184);
    pm.stroke_path(&rr, &sp, &Stroke { width: 2.0, ..Stroke::default() }, Transform::identity(), None);

    let mut pb = PathBuilder::new();
    let miss = text_path(&mut pb, &serif, 22.0, "ZAŻÓŁĆ GĘŚLĄ JAŹŃ", 14.0, 32.0);
    let tp = pb.finish().unwrap();
    let mut tpaint = Paint::default();
    tpaint.anti_alias = true;
    tpaint.set_color_rgba8(244, 240, 232, 255);
    pm.fill_path(&tp, &tpaint, FillRule::Winding, Transform::identity(), None);
    // strokeText + fillText (power digit style)
    let mut pb2 = PathBuilder::new();
    text_path(&mut pb2, &sans, 30.0, "7", 300.0, 36.0);
    let dp = pb2.finish().unwrap();
    let mut st = Paint::default();
    st.anti_alias = true;
    st.set_color_rgba8(5, 7, 11, 255);
    let stroke = Stroke { width: 6.0, line_join: tiny_skia::LineJoin::Round, ..Stroke::default() };
    pm.stroke_path(&dp, &st, &stroke, Transform::identity(), None);
    pm.fill_path(&dp, &tpaint, FillRule::Winding, Transform::identity(), None);
    // colour emoji bitmap (CBDT PNG) scaled into place
    if let Some(img) = emo.glyph_raster_image2(emo.glyph_id('🔥'), 128) {
        if let Ok(e) = Pixmap::decode_png(img.data) {
            let sx = 24.0 / e.width() as f32;
            pm.draw_pixmap(0, 0, e.as_ref(), &tiny_skia::PixmapPaint::default(),
                Transform::from_scale(sx, sx).post_translate(266.0, 12.0), None);
            println!("emoji png decoded {}x{}", e.width(), e.height());
        }
    }
    let _ = Rect::from_xywh(0.0, 0.0, 1.0, 1.0);
    println!("missing glyphs in PL sample: {miss}");
    println!("rgba_fnv64={:016x} bytes={}", fnv(pm.data()), pm.data().len());
    pm.save_png(out).unwrap();
}
