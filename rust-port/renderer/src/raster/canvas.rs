//! [`Canvas2dLite`]: the shape subset of `CanvasRenderingContext2D` used by
//! the web map code (RR-T8a). Method names are the Canvas member names in
//! snake case; setters of Canvas attributes are `set_<attribute>`.
//!
//! Every `pub fn` of `impl Canvas2dLite` is listed (with the Canvas member it
//! mirrors and a web call site) in `tests/raster_api_closed.rs`; adding a
//! method without updating that list fails the test.

use tiny_skia::{
    BlendMode, FillRule, FilterQuality, GradientStop, IntSize, LinearGradient, Mask, Paint,
    Pattern, Pixmap, PixmapPaint, Point, Rect, Shader, SpreadMode, Stroke, Transform,
};

use super::color::{parse_css_color, CssColor};
use super::path::{segs_to_skia, CanvasPath, Pt, Seg};
use super::shadow::shadow_from_layer;
use super::text::TextState;
use super::Affine;
use crate::jsmath::{js_cos, js_sin};

/// Errors that Canvas 2D reports as DOM exceptions.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RasterError {
    /// `IndexSizeError` / `RangeError`: negative radius, colour-stop offset
    /// outside `0..=1`.
    IndexSize,
    /// `SyntaxError`: colour string that does not parse.
    Syntax,
    /// A canvas or image of zero (or absurd) size.
    InvalidSize,
}

/// `ctx.lineJoin` values.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub enum LineJoin {
    /// `"miter"` (Canvas default; miter limit 10).
    #[default]
    Miter,
    /// `"round"`.
    Round,
    /// `"bevel"`.
    Bevel,
}

/// A `CanvasGradient` created by [`Canvas2dLite::create_linear_gradient`].
#[derive(Clone, Debug, PartialEq)]
pub struct CanvasGradient {
    x0: f64,
    y0: f64,
    x1: f64,
    y1: f64,
    stops: Vec<(f64, CssColor)>,
}

impl CanvasGradient {
    /// `gradient.addColorStop(offset, color)`.
    ///
    /// # Errors
    /// [`RasterError::IndexSize`] for an offset outside `0..=1` (or NaN),
    /// [`RasterError::Syntax`] for a colour that does not parse.
    pub fn add_color_stop(&mut self, offset: f64, color: &str) -> Result<(), RasterError> {
        if !(0.0..=1.0).contains(&offset) {
            return Err(RasterError::IndexSize);
        }
        let c = parse_css_color(color).ok_or(RasterError::Syntax)?;
        // Stops stay sorted; equal offsets keep insertion order.
        let at = self.stops.partition_point(|(o, _)| *o <= offset);
        self.stops.insert(at, (offset, c));
        Ok(())
    }

    /// Shader in the space given by `ts`; `None` = the gradient paints
    /// nothing (no stops, or start point == end point, per the spec).
    fn shader(&self, ts: Transform) -> Option<Shader<'static>> {
        if self.stops.is_empty() || (self.x0 == self.x1 && self.y0 == self.y1) {
            return None;
        }
        let stops = self
            .stops
            .iter()
            .map(|(o, c)| GradientStop::new(*o as f32, c.to_skia()))
            .collect();
        LinearGradient::new(
            Point::from_xy(self.x0 as f32, self.y0 as f32),
            Point::from_xy(self.x1 as f32, self.y1 as f32),
            stops,
            SpreadMode::Pad,
            ts,
        )
    }
}

/// An already decoded image for [`Canvas2dLite::draw_image`] (decoders are
/// RR-T8c). Stored premultiplied.
#[derive(Clone, Debug)]
pub struct RasterImage {
    pixmap: Pixmap,
}

impl RasterImage {
    /// From straight (non-premultiplied) RGBA8 rows.
    ///
    /// # Errors
    /// [`RasterError::InvalidSize`] when `width × height × 4 != data.len()`
    /// or a side is zero.
    pub fn from_straight_rgba8(width: u32, height: u32, data: &[u8]) -> Result<Self, RasterError> {
        let size = IntSize::from_wh(width, height).ok_or(RasterError::InvalidSize)?;
        if data.len() as u64 != u64::from(width) * u64::from(height) * 4 {
            return Err(RasterError::InvalidSize);
        }
        let mut premul = Vec::with_capacity(data.len());
        for p in data.chunks_exact(4) {
            let c = tiny_skia::ColorU8::from_rgba(p[0], p[1], p[2], p[3]).premultiply();
            premul.extend_from_slice(&[c.red(), c.green(), c.blue(), c.alpha()]);
        }
        let pixmap = Pixmap::from_vec(premul, size).ok_or(RasterError::InvalidSize)?;
        Ok(RasterImage { pixmap })
    }

    /// A snapshot of a canvas (`ctx.drawImage(otherCanvas, …)`).
    #[must_use]
    pub fn from_canvas(canvas: &Canvas2dLite) -> Self {
        RasterImage {
            pixmap: canvas.pixmap.clone(),
        }
    }

    /// Width in pixels.
    #[must_use]
    pub fn width(&self) -> u32 {
        self.pixmap.width()
    }

    /// Height in pixels.
    #[must_use]
    pub fn height(&self) -> u32 {
        self.pixmap.height()
    }

    // ----- hooks for `raster::image` (RR-T8c) -----------------------------
    // Crate-private: the decoders of `raster/image` (SVG via resvg, emoji
    // bitmaps) produce premultiplied tiny-skia pixmaps; wrapping them directly
    // avoids a lossy premultiplied → straight → premultiplied round trip. The
    // public surface stays the RR-T8a list (`tests/raster_api_closed.rs`).

    /// Wraps an already premultiplied pixmap.
    pub(crate) fn from_pixmap(pixmap: Pixmap) -> Self {
        RasterImage { pixmap }
    }

    /// The premultiplied pixels (mip chain of `raster::image::mip`).
    pub(crate) fn pixmap(&self) -> &Pixmap {
        &self.pixmap
    }
}

#[derive(Clone, Debug)]
enum Style {
    Color(CssColor),
    Gradient(CanvasGradient),
}

#[derive(Clone, Debug)]
struct State {
    ctm: Affine,
    fill: Style,
    stroke: Style,
    line_width: f64,
    line_join: LineJoin,
    shadow_color: CssColor,
    shadow_blur: f64,
    shadow_offset_y: f64,
    clip: Option<Mask>,
    /// `font`, `textAlign`, `textBaseline` (RR-T8b, `raster::text`); saved
    /// and restored with the rest of the state, as in Canvas 2D.
    text: TextState,
}

impl Default for State {
    fn default() -> Self {
        State {
            ctm: Affine::IDENTITY,
            fill: Style::Color(CssColor::BLACK),
            stroke: Style::Color(CssColor::BLACK),
            line_width: 1.0,
            line_join: LineJoin::Miter,
            shadow_color: CssColor::TRANSPARENT,
            shadow_blur: 0.0,
            shadow_offset_y: 0.0,
            clip: None,
            text: TextState::default(),
        }
    }
}

/// Canvas 2D miter limit default (`ctx.miterLimit`, never changed by the web).
const MITER_LIMIT: f32 = 10.0;

/// A CPU drawing context over a premultiplied RGBA8 buffer; see the module
/// docs of [`crate::raster`] for scope.
#[derive(Clone, Debug)]
pub struct Canvas2dLite {
    pixmap: Pixmap,
    state: State,
    stack: Vec<State>,
    path: CanvasPath,
}

/// A paint and the device-space draw it should perform; shared by the shadow
/// pass and the main pass.
enum Op<'a> {
    Fill(tiny_skia::Path, Paint<'a>),
    FillRect(Rect, Paint<'a>),
    Stroke(tiny_skia::Path, Paint<'a>, Stroke, Transform),
}

impl Canvas2dLite {
    /// A transparent-black canvas (`canvas.width = w; canvas.height = h`).
    ///
    /// # Errors
    /// [`RasterError::InvalidSize`] for a zero side.
    pub fn new(width: u32, height: u32) -> Result<Self, RasterError> {
        let pixmap = Pixmap::new(width, height).ok_or(RasterError::InvalidSize)?;
        Ok(Canvas2dLite {
            pixmap,
            state: State::default(),
            stack: Vec::new(),
            path: CanvasPath::default(),
        })
    }

    /// Canvas width in pixels.
    #[must_use]
    pub fn width(&self) -> u32 {
        self.pixmap.width()
    }

    /// Canvas height in pixels.
    #[must_use]
    pub fn height(&self) -> u32 {
        self.pixmap.height()
    }

    // ----- state ---------------------------------------------------------

    /// `ctx.save()`.
    pub fn save(&mut self) {
        self.stack.push(self.state.clone());
    }

    /// `ctx.restore()`; no-op on an empty stack.
    pub fn restore(&mut self) {
        if let Some(s) = self.stack.pop() {
            self.state = s;
        }
    }

    /// `ctx.translate(x, y)`.
    pub fn translate(&mut self, x: f64, y: f64) {
        if !(x.is_finite() && y.is_finite()) {
            return;
        }
        let t = Affine {
            e: x,
            f: y,
            ..Affine::IDENTITY
        };
        self.state.ctm = self.state.ctm.then_local(&t);
    }

    /// `ctx.rotate(angle)` (radians, clockwise in y-down space).
    pub fn rotate(&mut self, angle: f64) {
        if !angle.is_finite() {
            return;
        }
        // jsmath (V8-parity, platform-independent) instead of libm: crate
        // rule enforced by tests/jsmath_wiring.rs.
        let (s, c) = (js_sin(angle), js_cos(angle));
        let r = Affine {
            a: c,
            b: s,
            c: -s,
            d: c,
            e: 0.0,
            f: 0.0,
        };
        self.state.ctm = self.state.ctm.then_local(&r);
    }

    /// `ctx.setTransform(a, b, c, d, e, f)`.
    #[allow(clippy::many_single_char_names)]
    pub fn set_transform(&mut self, a: f64, b: f64, c: f64, d: f64, e: f64, f: f64) {
        if ![a, b, c, d, e, f].iter().all(|v| v.is_finite()) {
            return;
        }
        self.state.ctm = Affine { a, b, c, d, e, f };
    }

    /// `ctx.fillStyle = css`; returns `false` (and keeps the old value) when
    /// the string does not parse, like Canvas.
    pub fn set_fill_style(&mut self, css: &str) -> bool {
        parse_css_color(css)
            .map(|c| self.state.fill = Style::Color(c))
            .is_some()
    }

    /// `ctx.fillStyle = gradient`.
    pub fn set_fill_style_gradient(&mut self, g: &CanvasGradient) {
        self.state.fill = Style::Gradient(g.clone());
    }

    /// `ctx.strokeStyle = css`; see [`Self::set_fill_style`].
    pub fn set_stroke_style(&mut self, css: &str) -> bool {
        parse_css_color(css)
            .map(|c| self.state.stroke = Style::Color(c))
            .is_some()
    }

    /// `ctx.lineWidth = w`; ignored unless finite and `> 0`.
    pub fn set_line_width(&mut self, w: f64) {
        if w.is_finite() && w > 0.0 {
            self.state.line_width = w;
        }
    }

    /// `ctx.lineJoin = "miter" | "round" | "bevel"`; other strings ignored.
    pub fn set_line_join(&mut self, join: &str) -> bool {
        let j = match join {
            "miter" => LineJoin::Miter,
            "round" => LineJoin::Round,
            "bevel" => LineJoin::Bevel,
            _ => return false,
        };
        self.state.line_join = j;
        true
    }

    /// `ctx.shadowColor = css`.
    pub fn set_shadow_color(&mut self, css: &str) -> bool {
        parse_css_color(css)
            .map(|c| self.state.shadow_color = c)
            .is_some()
    }

    /// `ctx.shadowBlur = b`; ignored unless finite and `>= 0`.
    pub fn set_shadow_blur(&mut self, b: f64) {
        if b.is_finite() && b >= 0.0 {
            self.state.shadow_blur = b;
        }
    }

    /// `ctx.shadowOffsetY = y`; ignored unless finite.
    pub fn set_shadow_offset_y(&mut self, y: f64) {
        if y.is_finite() {
            self.state.shadow_offset_y = y;
        }
    }

    /// `ctx.createLinearGradient(x0, y0, x1, y1)` (user space at paint time).
    #[must_use]
    pub fn create_linear_gradient(&self, x0: f64, y0: f64, x1: f64, y1: f64) -> CanvasGradient {
        CanvasGradient {
            x0,
            y0,
            x1,
            y1,
            stops: Vec::new(),
        }
    }

    // ----- path ----------------------------------------------------------

    /// `ctx.beginPath()`.
    pub fn begin_path(&mut self) {
        self.path.clear();
    }

    /// `ctx.moveTo(x, y)`.
    pub fn move_to(&mut self, x: f64, y: f64) {
        self.path.move_to(&self.state.ctm, x, y);
    }

    /// `ctx.lineTo(x, y)`.
    pub fn line_to(&mut self, x: f64, y: f64) {
        self.path.line_to(&self.state.ctm, x, y);
    }

    /// `ctx.quadraticCurveTo(cpx, cpy, x, y)`.
    pub fn quadratic_curve_to(&mut self, cpx: f64, cpy: f64, x: f64, y: f64) {
        self.path
            .quadratic_curve_to(&self.state.ctm, cpx, cpy, x, y);
    }

    /// `ctx.arc(x, y, r, start, end, anticlockwise)`.
    ///
    /// # Errors
    /// [`RasterError::IndexSize`] for a negative radius.
    pub fn arc(
        &mut self,
        x: f64,
        y: f64,
        radius: f64,
        start_angle: f64,
        end_angle: f64,
        anticlockwise: bool,
    ) -> Result<(), RasterError> {
        if self.path.arc(
            &self.state.ctm,
            x,
            y,
            radius,
            start_angle,
            end_angle,
            anticlockwise,
        ) {
            Ok(())
        } else {
            Err(RasterError::IndexSize)
        }
    }

    /// `ctx.arcTo(x1, y1, x2, y2, r)`.
    ///
    /// # Errors
    /// [`RasterError::IndexSize`] for a negative radius.
    pub fn arc_to(
        &mut self,
        x1: f64,
        y1: f64,
        x2: f64,
        y2: f64,
        radius: f64,
    ) -> Result<(), RasterError> {
        if self.path.arc_to(&self.state.ctm, x1, y1, x2, y2, radius) {
            Ok(())
        } else {
            Err(RasterError::IndexSize)
        }
    }

    /// `ctx.roundRect(x, y, w, h, r)` with a single radius.
    ///
    /// # Errors
    /// [`RasterError::IndexSize`] for a negative radius (Canvas `RangeError`).
    pub fn round_rect(
        &mut self,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        radius: f64,
    ) -> Result<(), RasterError> {
        if self.path.round_rect(&self.state.ctm, x, y, w, h, radius) {
            Ok(())
        } else {
            Err(RasterError::IndexSize)
        }
    }

    /// `ctx.closePath()`.
    pub fn close_path(&mut self) {
        self.path.close_path();
    }

    // ----- drawing -------------------------------------------------------

    /// `ctx.fill()` (non-zero winding).
    pub fn fill(&mut self) {
        let Some(path) = self.path.to_skia() else {
            return;
        };
        let Some(paint) = self.paint(true, self.state.ctm.to_skia()) else {
            return;
        };
        self.run(&Op::Fill(path, paint));
    }

    /// `ctx.stroke()` with `lineWidth`, `lineJoin`, butt caps, miter limit 10.
    pub fn stroke(&mut self) {
        let segs = self.path.segs().to_vec();
        self.stroke_segs(&segs);
    }

    /// `ctx.clip()` (non-zero winding, anti-aliased), intersected with the
    /// current clip; restored by [`Self::restore`].
    pub fn clip(&mut self) {
        let (w, h) = (self.pixmap.width(), self.pixmap.height());
        let path = self.path.to_skia();
        let mask = match (self.state.clip.take(), path) {
            (Some(mut m), Some(p)) => {
                m.intersect_path(&p, FillRule::Winding, true, Transform::identity());
                m
            }
            (None, Some(p)) => {
                let mut m = Mask::new(w, h).expect("canvas size is valid");
                m.fill_path(&p, FillRule::Winding, true, Transform::identity());
                m
            }
            // An empty path clips everything away.
            (_, None) => Mask::new(w, h).expect("canvas size is valid"),
        };
        self.state.clip = Some(mask);
    }

    /// `ctx.fillRect(x, y, w, h)`; does not touch the current path.
    pub fn fill_rect(&mut self, x: f64, y: f64, w: f64, h: f64) {
        if ![x, y, w, h].iter().all(|v| v.is_finite()) || w == 0.0 || h == 0.0 {
            return;
        }
        let Some(paint) = self.paint(true, self.state.ctm.to_skia()) else {
            return;
        };
        let op = match self.device_rect(x, y, w, h) {
            Some(r) => Op::FillRect(r, paint),
            None => match self.rect_path(x, y, w, h) {
                Some(p) => Op::Fill(p, paint),
                None => return,
            },
        };
        self.run(&op);
    }

    /// `ctx.strokeRect(x, y, w, h)`; does not touch the current path.
    pub fn stroke_rect(&mut self, x: f64, y: f64, w: f64, h: f64) {
        if ![x, y, w, h].iter().all(|v| v.is_finite()) || (w == 0.0 && h == 0.0) {
            return;
        }
        let ctm = self.state.ctm;
        let mut p = CanvasPath::default();
        if w == 0.0 || h == 0.0 {
            // Spec: a single line from (x, y) to (x + w, y + h).
            p.move_to(&ctm, x, y);
            p.line_to(&ctm, x + w, y + h);
        } else {
            p.move_to(&ctm, x, y);
            p.line_to(&ctm, x + w, y);
            p.line_to(&ctm, x + w, y + h);
            p.line_to(&ctm, x, y + h);
            p.close_path();
        }
        let segs = p.segs().to_vec();
        self.stroke_segs(&segs);
    }

    /// `ctx.clearRect(x, y, w, h)`: transparent black inside the rectangle
    /// and the clip; no shadow.
    pub fn clear_rect(&mut self, x: f64, y: f64, w: f64, h: f64) {
        if ![x, y, w, h].iter().all(|v| v.is_finite()) || w == 0.0 || h == 0.0 {
            return;
        }
        // Measured: Chromium clears whole pixels (pixel-centre rule, no
        // anti-aliasing) — scene `x_clear_rotated`, P4-28 §5.2.
        // `DestinationOut` with an opaque source = `dst · (1 − clip)`. Not
        // `BlendMode::Clear`: tiny-skia applies the clip mask to the source
        // colour, which `Clear` ignores (the clip would have no effect).
        let paint = Paint {
            blend_mode: BlendMode::DestinationOut,
            anti_alias: false,
            ..Paint::default()
        };
        let clip = self.state.clip.as_ref();
        match self.device_rect(x, y, w, h) {
            Some(r) => self
                .pixmap
                .fill_rect(r, &paint, Transform::identity(), clip),
            None => {
                if let Some(p) = self.rect_path(x, y, w, h) {
                    self.pixmap.fill_path(
                        &p,
                        &paint,
                        FillRule::Winding,
                        Transform::identity(),
                        clip,
                    );
                }
            }
        }
    }

    /// `ctx.drawImage(image, dx, dy, dw, dh)` with bilinear sampling (image
    /// smoothing on, quality "low") and NON-anti-aliased destination edges
    /// (pixel-centre coverage, as measured in Chromium; see below).
    pub fn draw_image(&mut self, image: &RasterImage, dx: f64, dy: f64, dw: f64, dh: f64) {
        if ![dx, dy, dw, dh].iter().all(|v| v.is_finite()) || dw == 0.0 || dh == 0.0 {
            return;
        }
        // Spec: normalise a negative destination size (no flipping).
        let (dx, dw) = if dw < 0.0 { (dx + dw, -dw) } else { (dx, dw) };
        let (dy, dh) = if dh < 0.0 { (dy + dh, -dh) } else { (dy, dh) };
        let (iw, ih) = (f64::from(image.width()), f64::from(image.height()));
        let local = Affine {
            a: dw / iw,
            b: 0.0,
            c: 0.0,
            d: dh / ih,
            e: dx,
            f: dy,
        };
        let img_to_device = self.state.ctm.then_local(&local);
        let shader = Pattern::new(
            image.pixmap.as_ref(),
            SpreadMode::Pad,
            FilterQuality::Bilinear,
            1.0,
            img_to_device.to_skia(),
        );
        // Measured: Chromium does not anti-alias the destination edges of
        // drawImage (pixel-centre rule) — scene `x_image_downscale`, P4-28 §5.2.
        let paint = Paint {
            shader,
            anti_alias: false,
            ..Paint::default()
        };
        let Some(path) = self.rect_path(dx, dy, dw, dh) else {
            return;
        };
        // The pattern borrows `image`, so run the op here instead of `run`.
        let op = Op::Fill(path, paint);
        Self::run_on(&mut self.pixmap, &self.state, &op);
    }

    // ----- output --------------------------------------------------------

    /// Premultiplied RGBA8, row-major, `width × height × 4` bytes (the
    /// in-memory format of a Chromium 2D canvas and of tiny-skia).
    #[must_use]
    pub fn pixels_premultiplied(&self) -> &[u8] {
        self.pixmap.data()
    }

    /// Straight (non-premultiplied) RGBA8, like `getImageData().data`.
    #[must_use]
    pub fn to_rgba8_straight(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(self.pixmap.data().len());
        for p in self.pixmap.pixels() {
            let c = p.demultiply();
            out.extend_from_slice(&[c.red(), c.green(), c.blue(), c.alpha()]);
        }
        out
    }

    /// FNV-1a 64 of [`Self::pixels_premultiplied`] (golden-hash tests).
    #[must_use]
    pub fn rgba_hash(&self) -> u64 {
        super::fnv1a64(self.pixmap.data())
    }

    // ----- internals -----------------------------------------------------

    /// The paint for the fill (`true`) or stroke style. `shader_ts` places a
    /// gradient: the CTM for device-space fills, identity for strokes (the
    /// stroke transform carries the CTM). `None` = paints nothing.
    fn paint(&self, fill: bool, shader_ts: Transform) -> Option<Paint<'static>> {
        let style = if fill {
            &self.state.fill
        } else {
            &self.state.stroke
        };
        let shader = match style {
            Style::Color(c) => Shader::SolidColor(c.to_skia()),
            Style::Gradient(g) => g.shader(shader_ts)?,
        };
        Some(Paint {
            shader,
            anti_alias: true,
            ..Paint::default()
        })
    }

    fn stroke_segs(&mut self, segs: &[Seg]) {
        let Some(device) = segs_to_skia(segs) else {
            return;
        };
        self.stroke_device_path(device);
    }

    // ----- hooks for `raster::text` (RR-T8b) -----------------------------
    // Crate-private on purpose: the public Canvas surface of this file stays
    // the closed RR-T8a list (`tests/raster_api_closed.rs`); the text members
    // live in `raster/text` and are guarded by `tests/text_api_closed.rs`.

    /// The current transformation matrix.
    pub(crate) fn ctm(&self) -> Affine {
        self.state.ctm
    }

    /// Alpha (0..=1) of the fill style when it is a colour, `None` for a
    /// gradient. Used by `raster::image::emoji` (RR-T8c): Chromium draws a
    /// colour (bitmap) glyph with its own RGB and the fill style's alpha.
    pub(crate) fn fill_color_alpha(&self) -> Option<f32> {
        match &self.state.fill {
            Style::Color(c) => Some(c.a),
            Style::Gradient(_) => None,
        }
    }

    /// Alpha (0..=1) of the stroke style when it is a colour, `None` for a
    /// gradient. Used by `raster::image::emoji` (RR-T8f): Chromium's
    /// `strokeText` draws a colour glyph filled, with the stroke style's
    /// alpha (measured, `P4-35-TEXT-EMOJI-UNIFY.md` §3.2).
    pub(crate) fn stroke_color_alpha(&self) -> Option<f32> {
        match &self.state.stroke {
            Style::Color(c) => Some(c.a),
            Style::Gradient(_) => None,
        }
    }

    /// Text attributes of the current state.
    pub(crate) fn text_state(&self) -> &TextState {
        &self.state.text
    }

    /// Mutable text attributes of the current state.
    pub(crate) fn text_state_mut(&mut self) -> &mut TextState {
        &mut self.state.text
    }

    /// Fills a device-space path with the fill style, shadow and clip, like
    /// [`Self::fill`], without touching the current path (`fillText`).
    pub(crate) fn fill_device_path(&mut self, path: tiny_skia::Path) {
        let Some(paint) = self.paint(true, self.state.ctm.to_skia()) else {
            return;
        };
        self.run(&Op::Fill(path, paint));
    }

    /// Strokes a device-space path with the stroke style and line state,
    /// like [`Self::stroke`], without touching the current path
    /// (`strokeText`).
    pub(crate) fn stroke_device_path(&mut self, device: tiny_skia::Path) {
        let ctm = self.state.ctm;
        let Some(inv) = ctm.invert() else {
            return;
        };
        let user = if ctm == Affine::IDENTITY {
            device
        } else {
            match device.transform(inv.to_skia()) {
                Some(p) => p,
                None => return,
            }
        };
        let Some(paint) = self.paint(false, Transform::identity()) else {
            return;
        };
        let stroke = Stroke {
            width: self.state.line_width as f32,
            miter_limit: MITER_LIMIT,
            line_cap: tiny_skia::LineCap::Butt,
            line_join: match self.state.line_join {
                LineJoin::Miter => tiny_skia::LineJoin::Miter,
                LineJoin::Round => tiny_skia::LineJoin::Round,
                LineJoin::Bevel => tiny_skia::LineJoin::Bevel,
            },
            dash: None,
        };
        self.run(&Op::Stroke(user, paint, stroke, ctm.to_skia()));
    }

    /// Device-space rectangle when the CTM keeps rectangles axis-aligned.
    fn device_rect(&self, x: f64, y: f64, w: f64, h: f64) -> Option<Rect> {
        let ctm = self.state.ctm;
        if !ctm.is_axis_aligned() {
            return None;
        }
        let p0 = ctm.map(x, y);
        let p1 = ctm.map(x + w, y + h);
        Rect::from_ltrb(
            p0.x.min(p1.x),
            p0.y.min(p1.y),
            p0.x.max(p1.x),
            p0.y.max(p1.y),
        )
    }

    fn rect_path(&self, x: f64, y: f64, w: f64, h: f64) -> Option<tiny_skia::Path> {
        let ctm = self.state.ctm;
        let corners: [Pt; 4] = [
            ctm.map(x, y),
            ctm.map(x + w, y),
            ctm.map(x + w, y + h),
            ctm.map(x, y + h),
        ];
        segs_to_skia(&[
            Seg::Move(corners[0]),
            Seg::Line(corners[1]),
            Seg::Line(corners[2]),
            Seg::Line(corners[3]),
            Seg::Close,
        ])
    }

    fn run(&mut self, op: &Op<'_>) {
        Self::run_on(&mut self.pixmap, &self.state, op);
    }

    /// Shadow pass (when active) then the main pass, both inside the clip.
    fn run_on(pixmap: &mut Pixmap, state: &State, op: &Op<'_>) {
        let clip = state.clip.as_ref();
        let shadow_on =
            state.shadow_color.a > 0.0 && (state.shadow_blur > 0.0 || state.shadow_offset_y != 0.0);
        if shadow_on {
            let (w, h) = (pixmap.width(), pixmap.height());
            let mut layer = Pixmap::new(w, h).expect("canvas size is valid");
            let offset = Transform::from_translate(0.0, state.shadow_offset_y as f32);
            Self::draw_op(&mut layer, op, None, offset);
            let shadow = shadow_from_layer(
                layer.data(),
                w as usize,
                h as usize,
                state.shadow_color,
                state.shadow_blur,
            );
            let size = IntSize::from_wh(w, h).expect("canvas size is valid");
            if let Some(sp) = Pixmap::from_vec(shadow, size) {
                pixmap.draw_pixmap(
                    0,
                    0,
                    sp.as_ref(),
                    &PixmapPaint::default(),
                    Transform::identity(),
                    clip,
                );
            }
        }
        Self::draw_op(pixmap, op, clip, Transform::identity());
    }

    /// `post` is a device-space transform applied after everything else
    /// (identity for the main pass, the shadow offset for the shadow pass).
    fn draw_op(pixmap: &mut Pixmap, op: &Op<'_>, clip: Option<&Mask>, post: Transform) {
        match op {
            Op::Fill(path, paint) => pixmap.fill_path(path, paint, FillRule::Winding, post, clip),
            Op::FillRect(rect, paint) => pixmap.fill_rect(*rect, paint, post, clip),
            Op::Stroke(path, paint, stroke, ctm) => {
                pixmap.stroke_path(path, paint, stroke, ctm.post_concat(post), clip);
            }
        }
    }
}
