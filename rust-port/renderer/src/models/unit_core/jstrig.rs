//! `Math.sin` / `Math.cos` as V8 computes them — compatibility path.
//!
//! P4.13 shipped a private fdlibm copy here; since P4.16 the ONE
//! implementation is [`crate::jsmath`] (whole `f64` domain, no platform
//! `libm` fallback), so this module only re-exports it
//! (R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1). The public paths
//! `models::unit_core::jstrig::{js_sin, js_cos, JsTrig}` are unchanged.

pub use crate::jsmath::{js_cos, js_sin};

/// Method syntax for [`js_sin`] / [`js_cos`] (`x.js_sin()`), so ported
/// expressions keep the shape of the JavaScript source.
pub trait JsTrig {
    /// `Math.sin(self)`.
    fn js_sin(self) -> f64;
    /// `Math.cos(self)`.
    fn js_cos(self) -> f64;
}

impl JsTrig for f64 {
    fn js_sin(self) -> f64 {
        js_sin(self)
    }
    fn js_cos(self) -> f64 {
        js_cos(self)
    }
}
