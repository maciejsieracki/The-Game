//! Every renderer module uses the ONE `jsmath` implementation instead of the
//! platform `libm` (R-RUSTPORT-P4-16-JSMATH-Q1, binary criterion "brak
//! funkcji systemowych"; extended to the whole `src` tree by
//! R-RUSTPORT-P4-18-JSMATH-CONSOLIDATE-Q1).
//!
//! 1. Source scan over EVERY `.rs` file under `src/` (recursive, so a new
//!    top-level module is scanned without editing this list). The files are
//!    lexed (comments, strings, raw strings and char literals removed, `r#`
//!    raw identifiers unwrapped), so whitespace, line breaks and
//!    `#[rustfmt::skip]` layouts do not hide a call. On the token stream the
//!    scan rejects, for every platform transcendental name (`sin`, `cos`,
//!    `tan`, `atan2`, `powf`, `exp`, `ln`, `hypot`, `mul_add`, …):
//!    - a method call `. name (` / `. name ::<`;
//!    - any path use `… :: name` that is not itself a module prefix
//!      (`f64::sin`, `<f64>::cos`, `<f64 as Float>::sin`, a type alias
//!      `R::cos`, a generic `T::sin`, `map(f64::cos)`);
//!    - the name as a bare token inside a macro invocation or a
//!      `macro_rules!` body (`probe!(x, tan)`), and any `. $f (` / `:: $f (`
//!      metavariable call inside a macro (`$v.$f()`);
//!    - `libm`, `intrinsics`, `extern` (FFI), `include!`, `#[path]`,
//!      `concat_idents!`, `paste!`.
//!
//!    `.sqrt()` is allowed: IEEE 754 square root is correctly rounded, so it
//!    is the same in V8 and in every `libm`.
//! 2. Numeric guards against the V8 vectors (`tests/fixtures/jsmath`) and
//!    against V8 constants recorded with node (below): `Mat4::rotation_z`,
//!    `Quat::from_euler`, `terrain::quat_from_euler_xyz`,
//!    `terrain::instance_matrix`, `pick::three::Quat::from_euler_xyz` and
//!    `pick::terrain::hex_prism_no_bottom` give the V8 bits on angles where
//!    glibc differs from V8.

use civ_renderer::geom::{Euler, Mat4, Quat};
use civ_renderer::pick::terrain::hex_prism_no_bottom;
use civ_renderer::pick::three::{Mat4 as PickMat4, Quat as PickQuat, Vec3 as PickVec3};
use civ_renderer::terrain::{instance_matrix, quat_from_euler_xyz};

/// Function names that must never be reached through a platform path.
const FN_NAMES: [&str; 27] = [
    "sin", "cos", "tan", "sin_cos", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh",
    "asinh", "acosh", "atanh", "exp", "exp2", "exp_m1", "ln", "ln_1p", "log", "log10", "log2",
    "powf", "powi", "hypot", "cbrt", "mul_add",
];
/// Identifiers that are rejected wherever they appear in code.
const BANNED_IDENTS: [&str; 5] = ["libm", "intrinsics", "extern", "concat_idents", "paste"];

/// Keywords that can precede a unary `!`.
const KEYWORDS: [&str; 12] = [
    "if", "while", "match", "return", "in", "else", "let", "mut", "break", "move", "as", "yield",
];

#[derive(Debug, Clone, PartialEq, Eq)]
struct Tok {
    text: String,
    line: usize,
}

fn is_ident_start(c: char) -> bool {
    c.is_alphabetic() || c == '_'
}

fn is_ident_char(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

/// Minimal Rust lexer: identifiers, numbers, `::` and single-char punctuation.
/// Comments are dropped, every string / char literal becomes one `""` token.
#[allow(clippy::too_many_lines)]
fn lex(src: &str) -> Vec<Tok> {
    let b: Vec<char> = src.chars().collect();
    let at = |k: usize| b.get(k).copied();
    let mut out = Vec::new();
    let mut line = 1usize;
    let mut i = 0usize;
    while i < b.len() {
        let c = b[i];
        if c == '\n' {
            line += 1;
            i += 1;
            continue;
        }
        if c.is_whitespace() {
            i += 1;
            continue;
        }
        if c == '/' && at(i + 1) == Some('/') {
            while i < b.len() && b[i] != '\n' {
                i += 1;
            }
            continue;
        }
        if c == '/' && at(i + 1) == Some('*') {
            let mut depth = 0usize;
            while i < b.len() {
                if b[i] == '/' && at(i + 1) == Some('*') {
                    depth += 1;
                    i += 2;
                } else if b[i] == '*' && at(i + 1) == Some('/') {
                    depth -= 1;
                    i += 2;
                    if depth == 0 {
                        break;
                    }
                } else {
                    if b[i] == '\n' {
                        line += 1;
                    }
                    i += 1;
                }
            }
            continue;
        }
        // Raw strings `r"…"`, `r#"…"#`, `br#"…"#` and raw identifiers `r#name`.
        let raw_from = match (c, at(i + 1)) {
            ('r', Some('"' | '#')) => Some(i + 1),
            ('b', Some('r')) if matches!(at(i + 2), Some('"' | '#')) => Some(i + 2),
            _ => None,
        };
        if let Some(mut j) = raw_from {
            let mut hashes = 0usize;
            while at(j) == Some('#') {
                hashes += 1;
                j += 1;
            }
            if at(j) == Some('"') {
                let start_line = line;
                j += 1;
                while j < b.len() {
                    if b[j] == '"' && (0..hashes).all(|k| at(j + 1 + k) == Some('#')) {
                        j += 1 + hashes;
                        break;
                    }
                    if b[j] == '\n' {
                        line += 1;
                    }
                    j += 1;
                }
                out.push(Tok {
                    text: "\"\"".into(),
                    line: start_line,
                });
                i = j;
                continue;
            }
            if c == 'r' && hashes == 1 && at(j).is_some_and(is_ident_start) {
                i = j; // `r#name` lexes as `name`
                let s = i;
                while i < b.len() && is_ident_char(b[i]) {
                    i += 1;
                }
                out.push(Tok {
                    text: b[s..i].iter().collect(),
                    line,
                });
                continue;
            }
        }
        // Strings `"…"` / `b"…"`.
        if c == '"' || (c == 'b' && at(i + 1) == Some('"')) {
            let start_line = line;
            i += if c == 'b' { 2 } else { 1 };
            while i < b.len() && b[i] != '"' {
                if b[i] == '\\' {
                    i += 1;
                }
                if at(i) == Some('\n') {
                    line += 1;
                }
                i += 1;
            }
            i += 1;
            out.push(Tok {
                text: "\"\"".into(),
                line: start_line,
            });
            continue;
        }
        // Char literals `'x'`, `'\n'`, `b'x'`; otherwise a lifetime tick.
        if c == '\'' || (c == 'b' && at(i + 1) == Some('\'')) {
            let q = if c == 'b' { i + 1 } else { i };
            if at(q + 1) == Some('\\') {
                let mut j = q + 2;
                while j < b.len() && b[j] != '\'' {
                    j += 1;
                }
                out.push(Tok {
                    text: "\"\"".into(),
                    line,
                });
                i = j + 1;
                continue;
            }
            if at(q + 2) == Some('\'') {
                out.push(Tok {
                    text: "\"\"".into(),
                    line,
                });
                i = q + 3;
                continue;
            }
            i += 1; // lifetime: the name lexes as an identifier
            continue;
        }
        if is_ident_start(c) {
            let s = i;
            while i < b.len() && is_ident_char(b[i]) {
                i += 1;
            }
            out.push(Tok {
                text: b[s..i].iter().collect(),
                line,
            });
            continue;
        }
        if c.is_ascii_digit() {
            let s = i;
            while i < b.len()
                && (is_ident_char(b[i])
                    || (b[i] == '.' && at(i + 1).is_some_and(|d| d.is_ascii_digit())))
            {
                i += 1;
            }
            out.push(Tok {
                text: b[s..i].iter().collect(),
                line,
            });
            continue;
        }
        if c == ':' && at(i + 1) == Some(':') {
            out.push(Tok {
                text: "::".into(),
                line,
            });
            i += 2;
            continue;
        }
        out.push(Tok {
            text: c.to_string(),
            line,
        });
        i += 1;
    }
    out
}

/// `(line, reason)` for every forbidden construct of one source file.
#[allow(clippy::too_many_lines)]
fn forbidden_hits(src: &str) -> Vec<(usize, String)> {
    let t = lex(src);
    let txt = |k: usize| t.get(k).map_or("", |x| x.text.as_str());
    let is_fn = |s: &str| FN_NAMES.contains(&s);
    // Token ranges inside macro invocations (`name! ( … )`) and
    // `macro_rules!` bodies.
    let mut in_macro = vec![false; t.len()];
    for k in 0..t.len() {
        if txt(k + 1) != "!" {
            continue;
        }
        let name = txt(k);
        // `if !(…)`, `return !x`, … are negations, not macro calls.
        if !name.chars().next().is_some_and(is_ident_start) || KEYWORDS.contains(&name) {
            continue;
        }
        // `macro_rules! name { … }` has the name before the group.
        let open = if name == "macro_rules" { k + 3 } else { k + 2 };
        let close = match txt(open) {
            "(" => ")",
            "[" => "]",
            "{" => "}",
            _ => continue,
        };
        let opener = txt(open).to_string();
        let mut depth = 0usize;
        for (j, slot) in in_macro.iter_mut().enumerate().skip(open) {
            let s = txt(j);
            if s == opener {
                depth += 1;
            } else if s == close {
                depth -= 1;
                if depth == 0 {
                    break;
                }
            }
            *slot = true;
        }
    }
    let mut hits = Vec::new();
    for (k, tok) in t.iter().enumerate() {
        let s = tok.text.as_str();
        let prev = if k > 0 { txt(k - 1) } else { "" };
        let next = txt(k + 1);
        let mut why = None;
        if is_fn(s) {
            if prev == "." && (next == "(" || next == "::") {
                why = Some(format!("method .{s}("));
            } else if prev == "::" && next != "::" {
                why = Some(format!("path ::{s}"));
            } else if in_macro[k] && !(prev == "." && next != "(") {
                why = Some(format!("bare `{s}` in a macro"));
            }
        }
        // `$v.$f(…)` / `T::$f(…)`: a call whose name comes from the caller
        // (`Self::$variant` without a call is an enum path and is allowed;
        // the caller's bare name is caught by the macro-argument rule).
        if s == "$" && (prev == "." || prev == "::") && in_macro[k] && txt(k + 2) == "(" {
            why = Some(format!("metavariable call {prev}${next}("));
        }
        if BANNED_IDENTS.contains(&s) {
            why = Some(format!("`{s}`"));
        }
        if s == "include" && next == "!" {
            why = Some("include!".into());
        }
        if s == "path" && prev == "[" && k >= 2 && txt(k - 2) == "#" {
            why = Some("#[path]".into());
        }
        if let Some(w) = why {
            hits.push((tok.line, w));
        }
    }
    hits
}

#[test]
fn scanner_catches_known_bypass_forms() {
    for bad in [
        "let s = x.sin();",
        "let s = x.sin ();",
        "let s = x . cos();",
        "let s = x.atan2 (y);",
        "let s = x.powf (2.0);",
        "let s = x.exp ();",
        "let s = x.sin_cos ();",
        "let s = x\n    .sin()\n;",
        "#[rustfmt::skip]\nlet s = x.sin ();",
        "let s = x.r#sin();",
        "let s = x.powf::<>(2.0);",
        "let s = f64::sin(x);",
        "let p = f64::powf(a, b);",
        "let a = f32::atan2(y, x);",
        "let c = <f64>::cos(x);",
        "let c = <f64 as Float>::sin(x);",
        "let c = f64 :: tan (x);",
        "type R = f64; let c = R::cos(x);",
        "fn g<T: Trig>(x: T) -> T { T::sin(x) }",
        "let v: Vec<f64> = xs.iter().copied().map(f64::cos).collect();",
        "macro_rules! probe_call { ($v:expr, $f:ident) => { $v.$f() }; }",
        "let t = probe_call!(x, tan);",
        "macro_rules! m { ($f:ident) => { f64::$f(1.0) }; }",
        "let t = my_macro![x, hypot];",
        "let e = x.mul_add(a, b);",
        "let e = libm::exp(x);",
        "use libm;",
        "let e = x.ln_1p();",
        "let l = x.log(10.0);",
        "let p = x.powi(3);",
        "let f = paste! { [<co s>](x) };",
        "let f = concat_idents!(co, s)(x);",
        "let s = unsafe { std::intrinsics::sinf64(x) };",
        "extern \"C\" { fn sin(x: f64) -> f64; }",
        "include!(\"hidden.txt\");",
        "#[path = \"../../elsewhere.rs\"] mod m;",
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
        "let k = std::f64::consts::LN_2;",
        "let m = f64::max(a, b);",
        "let s = x.signum();",
        "let s = x.js_sin();",
        "let sin = js_sin(v); let cos = -js_cos(v); let y = cos * n.x + sin * b.x;",
        "let tan = (hy - py).abs() / (hx - px); tan_min = tan;",
        "if let Ok(mut log) = self.log.try_borrow_mut() { log.push(e); }",
        "mod hypot; pub use hypot::{js_hypot, js_hypot_n};",
        "let s = \"x.sin() f64::cos libm\";",
        "let s = r#\"x.sin() \"quoted\" libm::exp\"#;",
        "/* x.sin() /* nested */ f64::cos(x) */ let a = 1;",
        "// x.sin()\nlet a = 1;",
        "fn f<'a>(s: &'a str) -> char { '\\'' }",
        "let c = 'x'; let d = b'\"'; let v = 2.0_f64.max(1.5);",
        "assert_eq!(v.x, 1.0, \"x.cos()\");",
        "let t = vec![a.log, b.ln];",
        "macro_rules! m { ($($v:ident),*) => { match s { $(Self::$v => 1,)* } }; }",
        "if !(sin > 0.0) { return !cos; }",
    ] {
        let hits = forbidden_hits(ok);
        assert!(hits.is_empty(), "false positive: {ok}: {hits:?}");
    }
}

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

#[test]
fn no_platform_transcendentals_anywhere_in_src() {
    let root = env!("CARGO_MANIFEST_DIR");
    let src = std::path::Path::new(root).join("src");
    let mut files = Vec::new();
    rs_files_recursive(&src, &mut files);
    files.sort();
    let rel: Vec<String> = files
        .iter()
        .map(|f| {
            f.strip_prefix(&src)
                .expect("under src")
                .to_string_lossy()
                .replace('\\', "/")
        })
        .collect();
    // The scan must reach every family named by P4.16/P4.18 and the
    // top-level modules the Evaluator listed (view, overlays, text, …).
    for must in [
        "lib.rs",
        "camera.rs",
        "models.rs",
        "view.rs",
        "overlays.rs",
        "text.rs",
        "material.rs",
        "gpu.rs",
        "pick/three.rs",
        "pick/terrain.rs",
        "pick/camera.rs",
        "core/hex_shape.rs",
        "models/unit_core/jstrig.rs",
        "geom/math.rs",
        "terrain/mod.rs",
        "jsmath/trig.rs",
    ] {
        assert!(rel.iter().any(|r| r == must), "not scanned: src/{must}");
    }
    assert!(files.len() >= 60, "only {} files scanned", files.len());
    let mut hits = Vec::new();
    for (f, r) in files.iter().zip(&rel) {
        let text = std::fs::read_to_string(f).expect("source file");
        for (line, why) in forbidden_hits(&text) {
            let src_line = text.lines().nth(line - 1).unwrap_or("").trim();
            hits.push(format!("src/{r}:{line}: {why}: {src_line}"));
        }
    }
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
    // setFromEuler XYZ with x = z = 0 and the half-angle (sin, cos) pair:
    // the same expression tree as three r169 `Quaternion.js:209-232`, so the
    // ±0 signs match the web.
    let yaw_quat = |s: f64, c: f64| {
        let (c1, s1, c3, s3) = (1.0_f64, 0.0_f64, 1.0_f64, 0.0_f64);
        PickQuat {
            x: s1 * c * c3 + c1 * s * s3,
            y: c1 * s * c3 - s1 * c * s3,
            z: c1 * c * s3 + s1 * s * c3,
            w: c1 * c * c3 - s1 * s * s3,
        }
    };
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
        let want = PickMat4::compose(origin, yaw_quat(s, c), one).to_f32();
        let got = instance_matrix(origin, 2.0 * x);
        assert_eq!(
            got.map(f32::to_bits),
            want.map(f32::to_bits),
            "instance_matrix(yaw={x:e})"
        );
        // ... informational: how often the PLATFORM libm quaternion (built
        // here explicitly from `f64::sin/cos`; since P4.18
        // `PickQuat::from_euler_xyz` is jsmath-based and is no longer a libm
        // reference) would still differ after f32 storage.
        let platform = PickMat4::compose(origin, yaw_quat(x.sin(), x.cos()), one).to_f32();
        if platform.map(f32::to_bits) != want.map(f32::to_bits) {
            f32_visible += 1;
        }
    }
    eprintln!(
        "instance_matrix: {f32_visible} angles where platform libm and V8 differ after f32 storage"
    );
}

/// `pick::three::Quat::from_euler_xyz` (three r169 `Quaternion.js:209-210`,
/// `setFromEuler` with `Math.cos/sin(x / 2)`) gives the V8 bits in `f64`, on
/// every vector angle where glibc differs from V8.
#[test]
fn pick_quat_from_euler_xyz_uses_v8_trig() {
    let cases = libm_disagreements();
    assert!(cases.len() >= 10);
    for (x, s, c) in cases {
        // 2x / 2 == x exactly (|x| < 1e6), so each axis exposes (sin x, cos x).
        let qx = PickQuat::from_euler_xyz(2.0 * x, 0.0, 0.0);
        assert_eq!(
            qx.x.to_bits(),
            s.to_bits(),
            "pick from_euler_xyz({x:e},0,0) x"
        );
        assert_eq!(
            qx.w.to_bits(),
            c.to_bits(),
            "pick from_euler_xyz({x:e},0,0) w"
        );
        let qy = PickQuat::from_euler_xyz(0.0, 2.0 * x, 0.0);
        assert_eq!(
            qy.y.to_bits(),
            s.to_bits(),
            "pick from_euler_xyz(0,{x:e},0) y"
        );
        assert_eq!(
            qy.w.to_bits(),
            c.to_bits(),
            "pick from_euler_xyz(0,{x:e},0) w"
        );
        let qz = PickQuat::from_euler_xyz(0.0, 0.0, 2.0 * x);
        assert_eq!(
            qz.z.to_bits(),
            s.to_bits(),
            "pick from_euler_xyz(0,0,{x:e}) z"
        );
        assert_eq!(
            qz.w.to_bits(),
            c.to_bits(),
            "pick from_euler_xyz(0,0,{x:e}) w"
        );
    }
}

/// `Math.sin` / `Math.cos` of `theta = (k / 6) * (Math.PI * 2) + 0` (three
/// r169 `CylinderGeometry.js:90-91,211-212`, radialSegments = 6), recorded
/// with node v22.22.0 (V8):
/// `node -e 'const b=x=>{const a=new Float64Array([x]);return new BigUint64Array(a.buffer)[0].toString(16)};for(let k=0;k<=6;k++){const t=(k/6)*(Math.PI*2)+0;console.log(k,b(Math.sin(t)),b(Math.cos(t)))}'`
const V8_PRISM_SIN: [u64; 7] = [
    0x0000_0000_0000_0000,
    0x3feb_b67a_e858_4caa,
    0x3feb_b67a_e858_4cab,
    0x3ca1_a626_3314_5c07,
    0xbfeb_b67a_e858_4ca9,
    0xbfeb_b67a_e858_4caa,
    0xbcb1_a626_3314_5c07,
];
const V8_PRISM_COS: [u64; 7] = [
    0x3ff0_0000_0000_0000,
    0x3fe0_0000_0000_0001,
    0xbfdf_ffff_ffff_fffc,
    0xbff0_0000_0000_0000,
    0xbfe0_0000_0000_0004,
    0x3fe0_0000_0000_0001,
    0x3ff0_0000_0000_0000,
];
/// glibc `sin(theta_4)` (`python3 -c 'import math;print(math.sin((4/6)*(math.pi*2)).hex())'`
/// = `-0x1.bb67ae8584ca8p-1`), one ulp from V8's `...ca9`.
const GLIBC_PRISM_SIN_4: u64 = 0xbfeb_b67a_e858_4ca8;
/// A radius whose products with the two `sin(theta_4)` values straddle an
/// `f32` rounding boundary, so the f32 position buffer shows the f64 ulp.
const DISCRIMINATING_RADIUS: f64 = f64::from_bits(0x3ff0_0000_046b_6f03);

/// `hex_prism_no_bottom` (CylinderGeometry torso + caps) puts every ring
/// vertex at `(r·sin θ, y, r·cos θ)` with the V8 `sin/cos`. Positions are an
/// `f32` buffer (`Float32BufferAttribute`), so the check is on the stored
/// f32 bits; at `DISCRIMINATING_RADIUS` the θ = 4π/3 vertex differs between
/// V8 and glibc in those bits, so a revert to the platform `libm` fails here.
#[test]
#[allow(clippy::cast_possible_truncation)]
fn pick_hex_prism_vertices_use_v8_trig() {
    let v8_4 = DISCRIMINATING_RADIUS * f64::from_bits(V8_PRISM_SIN[4]);
    let glibc_4 = DISCRIMINATING_RADIUS * f64::from_bits(GLIBC_PRISM_SIN_4);
    assert_ne!(
        (v8_4 as f32).to_bits(),
        (glibc_4 as f32).to_bits(),
        "the radius must expose the 4π/3 ulp in f32"
    );
    for radius in [1.0_f64, 0.75, DISCRIMINATING_RADIUS] {
        let height = 0.25_f64;
        let g = hex_prism_no_bottom(radius, height);
        let p = &g.positions;
        // Torso rows 0..=1 (7 vertices each), then per cap 6 centres + 7 ring.
        let rings = [0usize, 7, 20, 33];
        assert_eq!(p.len(), 40 * 3);
        for start in rings {
            for k in 0..7 {
                let v = start + k;
                let want_x = (radius * f64::from_bits(V8_PRISM_SIN[k])) as f32;
                let want_z = (radius * f64::from_bits(V8_PRISM_COS[k])) as f32;
                assert_eq!(
                    p[3 * v].to_bits(),
                    want_x.to_bits(),
                    "r={radius} vertex {v} (k={k}) x"
                );
                assert_eq!(
                    p[3 * v + 2].to_bits(),
                    want_z.to_bits(),
                    "r={radius} vertex {v} (k={k}) z"
                );
            }
        }
    }
}
