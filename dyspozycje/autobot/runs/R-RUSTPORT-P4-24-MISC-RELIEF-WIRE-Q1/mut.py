# Mutation check of R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1 (Operator r1).
# Usage: python3 mut.py <renderer dir> <CARGO_TARGET_DIR outside the repo>
# Applies each mutation alone, runs the affected tests, restores every file.
import subprocess, os, sys
ROOT = sys.argv[1]
ENV = dict(os.environ, CARGO_TARGET_DIR=sys.argv[2])
J = 'src/core/jsnum.rs'
R = 'src/models/misc/range.rs'
MUTS = [
    # (1) relief wiring
    (R, 'let seed = i32::from_ne_bytes(js_to_uint32(seed).to_ne_bytes());',
        '#[allow(clippy::cast_possible_truncation)]\n        let seed = seed as i32;'),
    (R, '        let s = ReliefSampler::new(terrain, q, r, seed, radius)?;',
        '        let s = ReliefSampler::new(terrain, q, r, seed, 1.0)?;'),
    (R, '        let s = ReliefSampler::new(terrain, q, r, seed, radius)?;',
        '        let s = ReliefSampler::new(terrain, q, r.wrapping_add(1), seed, radius)?;'),
    (R, '        Some(Box::new(move |x, z| s.sample(x, z)))',
        '        Some(Box::new(move |x, z| s.sample(z, x)))'),
    (R, '    build_range_overlay_group(map, keys, style, &GameRelief)\n',
        '    build_range_overlay_group(map, keys, style, &FlatRelief)\n'),
    (R, 'pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.012;', 'pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.0121;'),
    # (2) toFixed
    (J, '    let body = if scaled.fract() == 0.0 && scaled % 2.0 == 1.0 {', '    let body = if false {'),
    (J, "            b'9' => b[i] = b'0',", "            b'9' => b[i] = b'1',"),
    (J, "            b.insert(0, b'1');", "            b.insert(0, b'0');"),
    (J, '    if !x.is_finite() || x.abs() >= 1e21 {', '    if !x.is_finite() || x.abs() > 1e21 {'),
    (J, "    format!(\"{x:e}\").replacen('e', \"e+\", 1)", "    format!(\"{x:e}\")"),
    (J, '        return "NaN".to_owned();', '        return "nan".to_owned();'),
    (J, '    let neg = x < 0.0;\n    let a = x.abs();\n    let d = digits as usize;', '    let neg = x <= 0.0;\n    let a = x.abs();\n    let d = digits as usize;'),
    (J, '(1023 + u64::from(digits) + 1) << 52', '(1023 + u64::from(digits) + 2) << 52'),
    (J, '        if d == 0 {\n            s.pop(); // the \'.\'\n        }\n', ''),
    (J, '        digits <= 100,', '        digits <= 101,'),
]
TESTS = ['--test', 'misc_web_parity', '--test', 'jsnum_to_fixed_v8', '--test', 'core_web_parity', '--lib']
res = []
for f, old, new in MUTS:
    p = os.path.join(ROOT, f)
    src = open(p).read()
    assert src.count(old) == 1, (f, old)
    open(p, 'w').write(src.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--offline'] + TESTS, cwd=ROOT, env=ENV,
                           capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = [l.split()[1] for l in out.splitlines() if l.startswith('test ') and 'FAILED' in l]
        compile_err = 'error[' in out or 'error: could not compile' in out
        status = 'DETECTED' if r.returncode != 0 else 'SURVIVED'
        res.append((status, f, new.strip()[:70].replace('\n', ' '), 'compile-error' if compile_err else failed))
    finally:
        open(p, 'w').write(src)
for x in res:
    print(x)
print('result:', sum(1 for x in res if x[0] == 'DETECTED'), '/', len(res), 'detected')
