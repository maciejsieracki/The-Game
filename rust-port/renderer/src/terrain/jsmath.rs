//! Compatibility path of P4.11: `Math.pow` of V8 now lives in the shared
//! [`crate::jsmath`] module (P4.16); this re-export keeps
//! `civ_renderer::terrain::jsmath::js_pow` working.

pub use crate::jsmath::js_pow;
