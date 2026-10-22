//! Compatibility path of P4.14: `Math.sin` / `Math.cos` of V8 (fdlibm) now
//! live in the shared [`crate::jsmath`] module (P4.16), which also ports the
//! large-argument reduction (`__kernel_rem_pio2`), so there is no platform
//! fallback any more. This re-export keeps `wonders::{js_sin, js_cos}`
//! working.

pub use crate::jsmath::{js_cos, js_sin};
