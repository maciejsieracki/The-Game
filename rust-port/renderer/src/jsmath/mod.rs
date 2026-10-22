//! `jsmath` — the JavaScript `Math.*` functions exactly as V8 12.4
//! (node v22.22.0, the engine of the web build) computes them, bit for bit,
//! in safe portable Rust (topic P4.16, `R-RUSTPORT-P4-16-JSMATH-Q1`).
//!
//! Why: the platform `libm` (glibc on Linux, UCRT on Windows, libSystem on
//! macOS) rounds differently from V8 in the last bit for some inputs. Every
//! renderer module that mirrors a web `Math.sin/cos/tan/atan/atan2/acos/
//! asin/exp/log/pow/hypot` call ([`crate::geom`], [`crate::terrain`],
//! [`crate::models::wonders`]) calls this module instead of `f64::sin` & co.,
//! so there is ONE implementation and the results do not depend on the
//! platform.
//!
//! Sources (V8 tag `12.4.254.21`, `node -p process.versions.v8` →
//! `12.4.254.21-node.33`):
//! - `src/base/ieee754.cc` (SHA-256 `da01a549…433a67fc`): fdlibm 5.3 ports
//!   `sin`, `cos`, `tan` (with `__ieee754_rem_pio2`, `__kernel_rem_pio2`),
//!   `atan`, `atan2`, `acos`, `asin` (moved here from `units_kamien::kit` by
//!   `R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1`), `exp`, `log`, `pow`;
//! - `src/builtins/math.tq` (SHA-256 `569ff61e…4fbf18ff`): `Math.hypot`
//!   (Torque builtin, not fdlibm).
//!
//! node v22.22.0 is built without `V8_USE_LIBM_TRIG_FUNCTIONS`
//! (`node --v8-options` has no `use-libm-trig-functions` flag), so `Math.sin`
//! / `Math.cos` are fdlibm too.
//!
//! # Argument range
//!
//! Every function covers the WHOLE `f64` domain (finite, subnormal, `±0`,
//! `±∞`, NaN): the large-argument reduction `__kernel_rem_pio2` is ported, so
//! nothing falls back to the platform `libm` ([`PLATFORM_FALLBACK`] is
//! `false`). NaN results are compared as "is NaN": JavaScript cannot observe
//! a NaN payload through a `Number`, so only the class is specified.
//!
//! Verification: `tests/jsmath_v8_parity.rs` compares every function with
//! vectors produced by RUNNING node v22.22.0 (`tests/fixtures/jsmath/`),
//! bit for bit (`to_bits`).

mod exp_log;
mod hypot;
mod inverse;
mod pow;
mod trig;
mod words;

pub use exp_log::{js_exp, js_log};
pub use hypot::{js_hypot, js_hypot_n};
pub use inverse::{js_acos, js_asin, js_atan, js_atan2};
pub use pow::js_pow;
pub use trig::{js_cos, js_sin, js_tan};

/// `true` if some argument range of this module would fall back to the
/// platform `libm`. It is `false`: every function is a complete port (see
/// the module documentation, "Argument range").
pub const PLATFORM_FALLBACK: bool = false;
