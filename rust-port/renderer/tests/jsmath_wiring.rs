//! `geom`, `terrain` and `models/wonders` use the ONE `jsmath`
//! implementation instead of the platform `libm`
//! (R-RUSTPORT-P4-16-JSMATH-Q1, binary criterion "brak funkcji systemowych").
//!
//! 1. Source scan: no `f64` method call of a platform transcendental
//!    function (`.sin()`, `.cos()`, `.tan()`, `.atan2(`, `.acos()`, `.powf(`,
//!    `.hypot(`, `.exp()`, `.ln()`, …) in those modules (comments ignored).
//!    `.sqrt()` is allowed: IEEE 754 square root is correctly rounded, so it
//!    is the same in V8 and in every `libm`.
//! 2. Numeric guard: on angles where glibc `sin`/`cos` differ from V8 (taken
//!    from the V8 vectors), `Mat4::rotation_z` and `Quat::from_euler` give the
//!    V8 bits.

use civ_renderer::geom::{Euler, Mat4, Quat};

const MODULE_DIRS: [&str; 4] = [
    "src/geom",
    "src/terrain",
    "src/models/wonders",
    "src/jsmath",
];
const FORBIDDEN: [&str; 22] = [
    ".sin()",
    ".cos()",
    ".tan()",
    ".sin_cos()",
    ".asin()",
    ".acos()",
    ".atan()",
    ".atan2(",
    ".sinh()",
    ".cosh()",
    ".tanh()",
    ".asinh()",
    ".acosh()",
    ".atanh()",
    ".exp()",
    ".exp2()",
    ".exp_m1()",
    ".ln()",
    ".log10()",
    ".log2()",
    ".powf(",
    ".hypot(",
];

#[test]
fn no_platform_transcendentals_in_js_mirroring_modules() {
    let root = env!("CARGO_MANIFEST_DIR");
    let mut scanned = 0;
    let mut hits = Vec::new();
    for dir in MODULE_DIRS {
        let path = format!("{root}/{dir}");
        let mut files: Vec<_> = std::fs::read_dir(&path)
            .unwrap_or_else(|e| panic!("{path}: {e}"))
            .map(|e| e.expect("dir entry").path())
            .filter(|p| p.extension().is_some_and(|x| x == "rs"))
            .collect();
        files.sort();
        for f in files {
            let text = std::fs::read_to_string(&f).expect("source file");
            scanned += 1;
            for (n, line) in text.lines().enumerate() {
                let code = line.split("//").next().unwrap_or("");
                for pat in FORBIDDEN {
                    if code.contains(pat) {
                        hits.push(format!("{}:{}: {pat}: {}", f.display(), n + 1, line.trim()));
                    }
                }
            }
        }
    }
    assert!(scanned >= 20, "only {scanned} files scanned");
    assert!(
        hits.is_empty(),
        "platform libm calls where the web uses Math.*:\n{}",
        hits.join("\n")
    );
}

/// `(x, V8 sin(x), V8 cos(x))` for vector angles with `|x| < 1e6` where the
/// platform `sin` or `cos` differs from V8.
fn libm_disagreements() -> Vec<(f64, f64, f64)> {
    let read = |name: &str| -> Vec<(f64, f64)> {
        let path = format!(
            "{}/tests/fixtures/jsmath/{name}.bin",
            env!("CARGO_MANIFEST_DIR")
        );
        std::fs::read(&path)
            .unwrap_or_else(|e| panic!("{path}: {e}"))
            .chunks_exact(16)
            .map(|r| {
                (
                    f64::from_le_bytes(r[..8].try_into().expect("8 bytes")),
                    f64::from_le_bytes(r[8..].try_into().expect("8 bytes")),
                )
            })
            .collect()
    };
    let sin = read("sin");
    let cos = read("cos");
    assert_eq!(sin.len(), cos.len());
    sin.iter()
        .zip(&cos)
        .filter(|((x, s), (x2, c))| {
            x.to_bits() == x2.to_bits()
                && x.abs() < 1.0e6
                && (x.sin().to_bits() != s.to_bits() || x.cos().to_bits() != c.to_bits())
        })
        .map(|((x, s), (_, c))| (*x, *s, *c))
        .collect()
}

#[test]
fn geom_rotation_and_euler_use_v8_trig() {
    let cases = libm_disagreements();
    assert!(
        cases.len() >= 10,
        "only {} disagreeing angles in the vectors",
        cases.len()
    );
    for (x, s, c) in cases {
        let m = Mat4::rotation_z(x);
        // column-major: e[0] = cos, e[1] = sin
        assert_eq!(m.e[0].to_bits(), c.to_bits(), "rotation_z({x:e}) cos");
        assert_eq!(m.e[1].to_bits(), s.to_bits(), "rotation_z({x:e}) sin");
        // XYZ with y = z = 0: q.x = s1·1·1 + c1·0·0 = sin(x) exactly.
        let q = Quat::from_euler(Euler::xyz(2.0 * x, 0.0, 0.0));
        assert_eq!(q.x.to_bits(), s.to_bits(), "from_euler({x:e}) x");
        assert_eq!(q.w.to_bits(), c.to_bits(), "from_euler({x:e}) w");
    }
}
