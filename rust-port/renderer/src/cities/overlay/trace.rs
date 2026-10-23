//! Draw trace of the MOD-10 paints (P4-33 round 2).
//!
//! The pixel comparison with Chromium has global limits (SSIM / mean_abs /
//! px>16) that a small, real defect can stay under (a glyph 13 → 16 px, the
//! shadow blur of two digits, a separator character). The trace records, in
//! call order, the Canvas 2D calls that carry those decisions — `clearRect`
//! (= start of a paint), the `fillStyle` / `shadowColor` / `shadowBlur` /
//! `shadowOffsetY` setters and every `fillText` with its text, its RAW font
//! string, `textAlign`, `textBaseline` and position — exactly as
//! `tests/fixtures/cityoverlay/gen.mjs` records them in Chromium by wrapping
//! the same `CanvasRenderingContext2D` members. The test compares the two
//! traces event by event (numbers by their bits).
//!
//! The overlay code routes those calls through the functions below; they
//! call [`Canvas2dLite`] and, only inside [`capture`], append the event to a
//! thread-local buffer. Outside [`capture`] the cost is one thread-local read.

use std::cell::RefCell;

use crate::raster::{Canvas2dLite, CanvasGradient};

/// One recorded call.
#[derive(Clone, Debug, PartialEq)]
pub enum DrawEvent {
    /// `ctx.clearRect(x, y, w, h)` — starts a new paint segment.
    ClearRect([f64; 4]),
    /// `ctx.fillStyle = css` (`"<gradient>"` for a `CanvasGradient`).
    FillStyle(String),
    /// `ctx.shadowColor = css`.
    ShadowColor(String),
    /// `ctx.shadowBlur = b`.
    ShadowBlur(f64),
    /// `ctx.shadowOffsetY = y`.
    ShadowOffsetY(f64),
    /// `ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline;
    /// ctx.fillText(text, x, y)`.
    FillText {
        /// The text.
        text: String,
        /// The raw web font string.
        font: String,
        /// `textAlign`.
        align: String,
        /// `textBaseline`.
        baseline: String,
        /// `x`.
        x: f64,
        /// `y`.
        y: f64,
    },
}

thread_local! {
    static LOG: RefCell<Option<Vec<Vec<DrawEvent>>>> = const { RefCell::new(None) };
}

/// Runs `f` and returns its result with the paints it drew: one segment per
/// `clearRect` (events before the first `clearRect` open a segment of their
/// own). Nested captures are not supported (the inner one takes the buffer).
pub fn capture<R>(f: impl FnOnce() -> R) -> (R, Vec<Vec<DrawEvent>>) {
    let prev = LOG.with(|l| l.borrow_mut().replace(Vec::new()));
    let r = f();
    let buf = LOG.with(|l| std::mem::replace(&mut *l.borrow_mut(), prev));
    (r, buf.unwrap_or_default())
}

fn record(e: DrawEvent) {
    LOG.with(|l| {
        if let Some(buf) = l.borrow_mut().as_mut() {
            match (&e, buf.last_mut()) {
                (DrawEvent::ClearRect(_), _) | (_, None) => buf.push(vec![e]),
                (_, Some(seg)) => seg.push(e),
            }
        }
    });
}

/// `ctx.clearRect(x, y, w, h)`.
pub fn clear_rect(ctx: &mut Canvas2dLite, x: f64, y: f64, w: f64, h: f64) {
    record(DrawEvent::ClearRect([x, y, w, h]));
    ctx.clear_rect(x, y, w, h);
}

/// `ctx.fillStyle = css` (the result of the setter is ignored, as in Canvas).
pub fn set_fill_style(ctx: &mut Canvas2dLite, css: &str) {
    record(DrawEvent::FillStyle(css.to_owned()));
    ctx.set_fill_style(css);
}

/// `ctx.fillStyle = gradient`.
pub fn set_fill_style_gradient(ctx: &mut Canvas2dLite, g: &CanvasGradient) {
    record(DrawEvent::FillStyle("<gradient>".to_owned()));
    ctx.set_fill_style_gradient(g);
}

/// `ctx.shadowColor = css`.
pub fn set_shadow_color(ctx: &mut Canvas2dLite, css: &str) {
    record(DrawEvent::ShadowColor(css.to_owned()));
    ctx.set_shadow_color(css);
}

/// `ctx.shadowBlur = b`.
pub fn set_shadow_blur(ctx: &mut Canvas2dLite, b: f64) {
    record(DrawEvent::ShadowBlur(b));
    ctx.set_shadow_blur(b);
}

/// `ctx.shadowOffsetY = y`.
pub fn set_shadow_offset_y(ctx: &mut Canvas2dLite, y: f64) {
    record(DrawEvent::ShadowOffsetY(y));
    ctx.set_shadow_offset_y(y);
}

/// Records the `fillText` the caller is about to draw.
pub(crate) fn fill_text_event(font: &str, align: &str, baseline: &str, text: &str, x: f64, y: f64) {
    record(DrawEvent::FillText {
        text: text.to_owned(),
        font: font.to_owned(),
        align: align.to_owned(),
        baseline: baseline.to_owned(),
        x,
        y,
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn segments_start_at_clear_rect_and_nothing_leaks_outside_capture() {
        let mut c = Canvas2dLite::new(4, 4).expect("canvas");
        set_shadow_blur(&mut c, 1.0); // outside: not recorded
        let ((), segs) = capture(|| {
            set_fill_style(&mut c, "#fff");
            clear_rect(&mut c, 0.0, 0.0, 4.0, 4.0);
            set_shadow_blur(&mut c, 2.0);
            clear_rect(&mut c, 0.0, 0.0, 4.0, 4.0);
            fill_text_event("10px a", "left", "top", "x", 1.0, 2.0);
        });
        assert_eq!(segs.len(), 3);
        assert_eq!(segs[0], vec![DrawEvent::FillStyle("#fff".into())]);
        assert_eq!(segs[1][1], DrawEvent::ShadowBlur(2.0));
        assert_eq!(segs[2].len(), 2);
        let ((), empty) = capture(|| {});
        assert!(empty.is_empty());
    }
}
