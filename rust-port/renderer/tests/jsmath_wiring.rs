//! Every JS-mirroring renderer module uses the ONE `jsmath`
//! implementation instead of the platform `libm`
//! (R-RUSTPORT-P4-16-JSMATH-Q1, binary criterion "brak funkcji systemowych";
//! extended to `pick`, `core`, all of `models` and `camera.rs` by
//! R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1).
//!
//! 1. Source scan: no `f64` method call of a platform transcendental
//!    function (`.sin()`, `.cos()`, `.tan()`, `.atan2(`, `.acos()`, `.powf(`,
//!    `.hypot(`, `.exp()`, `.ln()`, …) in those modules (comments ignored).
//!    `.sqrt()` is allowed: IEEE 754 square root is correctly rounded, so it
//!    is the same in V8 and in every `libm`.
//!    The scan walks the directories recursively and also rejects the
//!    path-call forms (`f64::sin(x)`, `f32::cos(x)`, `<f64>::cos(x)`,
//!    `<f32 as Float>::sin(x)`, `f64::sin` passed as a function value), any
//!    reference to a `libm` crate, and macros that hide a call
//!    (`concat_idents!`/`paste!` building a forbidden name).
//!    Since P4.18 `pick::three::Quat::from_euler_xyz` and
//!    `pick::terrain::hex_prism_no_bottom` are themselves `jsmath`-based and
//!    the `pick` tree is scanned directly, so they are no longer listed as
//!    indirect helpers.
//! 2. Numeric guard: on angles where glibc `sin`/`cos` differ from V8 (taken
//!    from the V8 vectors), `Mat4::rotation_z`, `Quat::from_euler`,
//!    `terrain::quat_from_euler_xyz` and `terrain::instance_matrix` give the
//!    V8 bits.

use civ_renderer::geom::{Euler, Mat4, Quat};
use civ_renderer::pick::three::{Mat4 as PickMat4, Quat as PickQuat, Vec3 as PickVec3};
use civ_renderer::terrain::{instance_matrix, quat_from_euler_xyz};

/// Scanned recursively (`src/models` covers `unit_core`, `wonders` and every
/// later model family).
const MODULE_DIRS: [&str; 6] = [
    "src/geom",
    "src/terrain",
    "src/models",
    "src/jsmath",
    "src/pick",
    "src/core",
];
/// Single files outside those directories.
const MODULE_FILES: [&str; 2] = ["src/camera.rs", "src/models.rs"];
/// Function names that must never be reached through a platform path.
const FN_NAMES: [&str; 25] = [
    "sin", "cos", "tan", "sin_cos", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh",
    "asinh", "acosh", "atanh", "exp", "exp2", "exp_m1", "ln", "ln_1p", "log", "log10", "log2",
    "powf", "hypot", "cbrt",
];
const FORBIDDEN: [&str; 26] = [
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
    ".ln_1p()",
    ".cbrt()",
    ".log(",
    ".powi(",
];

fn rs_files_recursive(dir: &std::path::Path, out: &mut Vec<std::path::PathBuf>) {
    for e in std::fs::read_dir(dir).unwrap_or_else(|e| panic!("{}: {e}", dir.display())) {
        let p = e.expect("dir entry").path();
        if p.is_dir() {
            rs_files_recursive(&p, out);
        } else if p.extension().is_some_and(|x| x == "rs") {
            out.push(p);
        }
    }
}

/// Every forbidden fragment of one code line (comments stripped).
fn forbidden_hits(code: &str) -> Vec<String> {
    let mut found = Vec::new();
    for pat in FORBIDDEN {
        if code.contains(pat) {
            found.push(pat.to_string());
        }
    }
    // Path forms: `f64::sin`, `<f64>::sin`, `<f64 as Float>::sin`,
    // `f64 :: sin` — whitespace is removed first, then every `<ty>::name`
    // or `<ty ...>::name` followed by a non-identifier character.
    let squashed: String = code.chars().filter(|c| !c.is_whitespace()).collect();
    for name in FN_NAMES {
        for (i, _) in squashed.match_indices(&format!("::{name}")) {
            let after = squashed[i + 2 + name.len()..].chars().next();
            if after.is_some_and(|c| c.is_alphanumeric() || c == '_') {
                continue;
            }
            let before = &squashed[..i];
            let typed = before.ends_with("f64")
                || before.ends_with("f32")
                || (before.ends_with('>')
                    && before.rfind('<').is_some_and(|k| {
                        before[k + 1..].starts_with("f64") || before[k + 1..].starts_with("f32")
                    }));
            if typed {
                found.push(format!("path ::{name}"));
            }
        }
    }
    // A `libm` crate (or `std::intrinsics`) reaches the platform functions.
    if squashed.contains("libm::") || squashed.contains("externcrate libm") {
        found.push("libm".to_string());
    }
    if squashed.contains("intrinsics::") {
        found.push("intrinsics".to_string());
    }
    // Macros that assemble an identifier can build a forbidden call.
    for mac in ["concat_idents!", "paste!", "paste::paste!"] {
        if squashed.contains(mac) {
            found.push(mac.to_string());
        }
    }
    found
}

#[test]
fn scanner_catches_known_bypass_forms() {
    for bad in [
        "let s = x.sin();",
        "let s = f64::sin(x);",
        "let p = f64::powf(a, b);",
        "let a = f32::atan2(y, x);",
        "let c = <f64>::cos(x);",
        "let c = <f64 as Float>::sin(x);",
        "let c = f64 :: tan (x);",
        "let v: Vec<f64> = xs.iter().copied().map(f64::cos).collect();",
        "let e = libm::exp(x);",
        "let e = x.ln_1p();",
        "let l = x.log(10.0);",
        "let p = x.powi(3);",
        "let f = paste! { [<co s>](x) };",
        "let s = unsafe { std::intrinsics::sinf64(x) };",
    ] {
        assert!(!forbidden_hits(bad).is_empty(), "scanner misses: {bad}");
    }
    for ok in [
        "let q = quat_from_euler_xyz(0.0, yaw, 0.0);",
        "let s = js_sin(x);",
        "let r = x.sqrt();",
        "let q = Quat::from_euler_xyz(0.0, yaw, 0.0);",
        "let c = js_cos(x);",
        "let k = f64::consts::PI;",
        "let m = f64::max(a, b);",
        "let s = x.signum();",
    ] {
        assert!(forbidden_hits(ok).is_empty(), "false positive: {ok}");
    }
}

#[test]
fn no_platform_transcendentals_in_js_mirroring_modules() {
    let root = env!("CARGO_MANIFEST_DIR");
    let mut scanned = 0;
    let mut hits = Vec::new();
    let mut files = Vec::new();
    for dir in MODULE_DIRS {
        rs_files_recursive(std::path::Path::new(&format!("{root}/{dir}")), &mut files);
    }
    for f in MODULE_FILES {
        files.push(std::path::PathBuf::from(format!("{root}/{f}")));
    }
    files.sort();
    {
        for f in files {
            let text = std::fs::read_to_string(&f).expect("source file");
            scanned += 1;
            for (n, line) in text.lines().enumerate() {
                let code = line.split("//").next().unwrap_or("");
                for pat in forbidden_hits(code) {
                    hits.push(format!("{}:{}: {pat}: {}", f.display(), n + 1, line.trim()));
                }
            }
        }
    }
    assert!(scanned >= 50, "only {scanned} files scanned");
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

#[test]
fn terrain_rotation_uses_v8_trig() {
    let cases = libm_disagreements();
    assert!(cases.len() >= 10);
    let origin = PickVec3::new(0.0, 0.0, 0.0);
    let one = PickVec3::new(1.0, 1.0, 1.0);
    let mut f32_visible = 0usize;
    for (x, s, c) in cases {
        // Euler (0, 2x, 0): q.y = c1·s2·c3 - s1·c2·s3 = sin(x), q.w = cos(x).
        let q = quat_from_euler_xyz(0.0, 2.0 * x, 0.0);
        assert_eq!(
            q.y.to_bits(),
            s.to_bits(),
            "quat_from_euler_xyz(0,{x:e},0) y"
        );
        assert_eq!(
            q.w.to_bits(),
            c.to_bits(),
            "quat_from_euler_xyz(0,{x:e},0) w"
        );
        let qx = quat_from_euler_xyz(2.0 * x, 0.0, 0.0);
        assert_eq!(
            qx.x.to_bits(),
            s.to_bits(),
            "quat_from_euler_xyz({x:e},0,0) x"
        );
        // instance_matrix must be the compose of the V8 quaternion ...
        // setFromEuler XYZ with c1 = c3 = 1, s1 = s3 = 0 and the V8 (s2, c2)
        // (same expression tree, so the ±0 signs match the web).
        let (c1, s1, c3, s3) = (1.0_f64, 0.0_f64, 1.0_f64, 0.0_f64);
        let v8 = PickQuat {
            x: s1 * c * c3 + c1 * s * s3,
            y: c1 * s * c3 - s1 * c * s3,
            z: c1 * c * s3 + s1 * s * c3,
            w: c1 * c * c3 - s1 * s * s3,
        };
        let want = PickMat4::compose(origin, v8, one).to_f32();
        let got = instance_matrix(origin, 2.0 * x);
        assert_eq!(
            got.map(f32::to_bits),
            want.map(f32::to_bits),
            "instance_matrix(yaw={x:e})"
        );
        // ... and, where f32 storage still shows it, differ from the libm one.
        let libm =
            PickMat4::compose(origin, PickQuat::from_euler_xyz(0.0, 2.0 * x, 0.0), one).to_f32();
        if libm.map(f32::to_bits) != want.map(f32::to_bits) {
            f32_visible += 1;
        }
    }
    eprintln!("instance_matrix: {f32_visible} angles where libm and V8 differ after f32 storage");
}
