//! UI rectangles (CSS px from `getBoundingClientRect`) -> physical-pixel
//! rectangles for the platform input region (M1: webview input region = UI
//! rects; M2: native child window region = window minus UI rects).
//!
//! Conversion follows P4-5B §3.1: CSS px * `scale_factor` = physical px.
//! Rounding is OUTWARD (floor of left/top, ceil of right/bottom), so a UI
//! element is never left partly outside its own input region; the result is
//! clipped to the window's physical size and empty rectangles are dropped.

use serde::{Deserialize, Serialize};

/// Rectangle in CSS pixels of the window (as `getBoundingClientRect()`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct CssRect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl CssRect {
    /// Half-open containment `[x, x+w) x [y, y+h)`.
    pub fn contains(&self, px: f64, py: f64) -> bool {
        px >= self.x && px < self.x + self.w && py >= self.y && py < self.y + self.h
    }
}

/// Rectangle in physical pixels of the window client area.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct PhysRect {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

impl PhysRect {
    pub fn contains(&self, px: i32, py: i32) -> bool {
        px >= self.x && px < self.x + self.w && py >= self.y && py < self.y + self.h
    }
}

/// Convert UI rects to physical, clipped to `[0, win_w) x [0, win_h)`.
/// Non-finite or non-positive scale -> empty result (caller logs it).
pub fn css_to_physical(rects: &[CssRect], scale: f64, win_w: u32, win_h: u32) -> Vec<PhysRect> {
    if !(scale.is_finite() && scale > 0.0) {
        return Vec::new();
    }
    let (ww, wh) = (win_w as f64, win_h as f64);
    rects
        .iter()
        .filter(|r| r.x.is_finite() && r.y.is_finite() && r.w.is_finite() && r.h.is_finite())
        .filter_map(|r| {
            let l = (r.x * scale).floor().max(0.0);
            let t = (r.y * scale).floor().max(0.0);
            let rr = ((r.x + r.w) * scale).ceil().min(ww);
            let b = ((r.y + r.h) * scale).ceil().min(wh);
            if rr <= l || b <= t {
                return None;
            }
            Some(PhysRect {
                x: l as i32,
                y: t as i32,
                w: (rr - l) as i32,
                h: (b - t) as i32,
            })
        })
        .collect()
}

/// `true` when the CSS point is inside any UI rect ("over_ui" for the spike,
/// P4-5B §4.2 without `full_block` / `pass_through`).
pub fn over_ui(rects: &[CssRect], x: f64, y: f64) -> bool {
    rects.iter().any(|r| r.contains(x, y))
}

/// Physical point -> CSS point (P4-5B §3.1 normalisation).
pub fn physical_to_css(px: f64, py: f64, scale: f64) -> (f64, f64) {
    (px / scale, py / scale)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn r(x: f64, y: f64, w: f64, h: f64) -> CssRect {
        CssRect { x, y, w, h }
    }

    #[test]
    fn scale_1_is_identity_for_integers() {
        let p = css_to_physical(&[r(10.0, 20.0, 100.0, 50.0)], 1.0, 1280, 800);
        assert_eq!(
            p,
            vec![PhysRect {
                x: 10,
                y: 20,
                w: 100,
                h: 50
            }]
        );
    }

    #[test]
    fn fractional_scale_rounds_outward() {
        // 1.25: x 10.5*1.25=13.125 -> 13; right (10.5+100.2)*1.25=138.375 -> 139
        let p = css_to_physical(&[r(10.5, 0.0, 100.2, 10.0)], 1.25, 4000, 4000);
        assert_eq!(p[0].x, 13);
        assert_eq!(p[0].x + p[0].w, 139);
        assert_eq!(p[0].y, 0);
        assert_eq!(p[0].h, 13); // 12.5 -> 13
    }

    #[test]
    fn clipped_to_window_and_empty_dropped() {
        let p = css_to_physical(
            &[
                r(-5.0, -5.0, 20.0, 20.0),
                r(2000.0, 0.0, 10.0, 10.0),
                r(0.0, 0.0, 0.0, 10.0),
            ],
            2.0,
            1000,
            1000,
        );
        assert_eq!(
            p,
            vec![PhysRect {
                x: 0,
                y: 0,
                w: 30,
                h: 30
            }]
        );
    }

    #[test]
    fn bad_scale_or_nan_rects() {
        assert!(css_to_physical(&[r(0.0, 0.0, 1.0, 1.0)], 0.0, 10, 10).is_empty());
        assert!(css_to_physical(&[r(0.0, 0.0, 1.0, 1.0)], f64::NAN, 10, 10).is_empty());
        assert!(css_to_physical(&[r(f64::NAN, 0.0, 1.0, 1.0)], 1.0, 10, 10).is_empty());
    }

    #[test]
    fn over_ui_half_open() {
        let rects = [r(100.0, 100.0, 50.0, 50.0)];
        assert!(over_ui(&rects, 100.0, 100.0));
        assert!(over_ui(&rects, 149.9, 149.9));
        assert!(!over_ui(&rects, 150.0, 120.0));
        assert!(!over_ui(&rects, 99.9, 120.0));
    }

    #[test]
    fn physical_point_normalisation() {
        assert_eq!(physical_to_css(300.0, 150.0, 1.5), (200.0, 100.0));
        let pr = PhysRect {
            x: 0,
            y: 0,
            w: 10,
            h: 10,
        };
        assert!(pr.contains(9, 9));
        assert!(!pr.contains(10, 0));
    }
}
