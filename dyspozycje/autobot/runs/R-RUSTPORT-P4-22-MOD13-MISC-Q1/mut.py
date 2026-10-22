# Mutation check of R-RUSTPORT-P4-22-MOD13-MISC-Q1 (Operator r1). Replace <scratch> by a
# CARGO_TARGET_DIR outside the repo and ROOT by the checkout; restores every file.
import subprocess, os, sys
ROOT = '/home/user/The-Game/.claude/worktrees/wf_63260a26-711-1/rust-port/renderer'
ENV = dict(os.environ, CARGO_TARGET_DIR='<scratch>/target')
MUTS = [
    ('src/models/misc/range.rs', 'pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.012;', 'pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.0121;'),
    ('src/models/misc/range.rs', '        if let Some(&h) = self.cache.get(&key) {\n            return h;\n        }', '        if let Some(&_h) = self.cache.get(&key) {\n        }'),
    ('src/models/misc/territory.rs', '(best.is_none() || cross < best_cross || best_cross <= 1e-8)', '(best.is_none() || cross > best_cross || best_cross <= 1e-8)'),
    ('src/models/misc/territory.rs', 'if s == "-0.00000" {', 'if s == "-0.00001" {'),
    ('src/models/misc/siege.rs', '(opts.attacker_color & 0x00fe_fefe) >> 1', '(opts.attacker_color & 0x00fe_fefe) >> 2'),
    ('src/models/misc/siege.rs', 'let y = top_y(cq, cr) + MARKER_LIFT * 0.5;', 'let y = top_y(cq, cr) + MARKER_LIFT * 0.4;'),
    ('src/models/misc/siege.rs', 'let opacity = 0.82 + 0.18 * js_sin(time_sec * 2.4);', 'let opacity = 0.82 + 0.18 * js_sin(time_sec * 2.5);'),
    ('src/models/misc/sky.rs', 'let scale = 1.4 + rnd(n, 33.0) * 2.8;', 'let scale = 1.4 + rnd(n, 34.0) * 2.8;'),
    ('src/models/misc/wioska.rs', 'radius: 0.165,', 'radius: 0.166,'),
    ('src/models/misc/wioska.rs', 'let h = 0.34 + 0.06 * f64::from((i * 37) % 3) / 2.0;', 'let h = 0.34 + 0.06 * (f64::from((i * 37) % 3) / 2.0);'),
    ('src/models/misc/trade.rs', 'k * k * p0 + 2.0 * (1.0 - t) * t * p1 + t * t * p2', 't * t * p2 + k * k * p0 + 2.0 * (1.0 - t) * t * p1'),
    ('src/models/misc/range.rs', 'let denom = js_max(1.0 + (a.0 * b.0 + a.1 * b.1), 0.5);', 'let denom = js_max(1.0 + (a.0 * b.0 + a.1 * b.1), 0.6);'),
    ('src/models/misc/range.rs', '                for _ in 0..12 {', '                for _ in 0..11 {'),
    ('src/models/misc/range.rs', 'let y = hex_y + 0.004;', 'let y = hex_y + 0.005;'),
    ('src/models/misc/overlay.rs', 'let body = if scaled.fract() == 0.0 && scaled % 2.0 == 1.0 && a < 1e15 {', 'let body = if false {'),
    ('src/models/misc/siege.rs', "        Some(b'+') => (false, &t[1..]),\n", ''),
]
res = []
for f, old, new in MUTS:
    p = os.path.join(ROOT, f)
    src = open(p).read()
    assert src.count(old) == 1, (f, old)
    open(p, 'w').write(src.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '--locked', '--offline', '--test', 'misc_web_parity', '--lib'], cwd=ROOT, env=ENV, capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith('test ') and 'FAILED' in l]
        status = 'DETECTED' if r.returncode != 0 else 'SURVIVED'
        res.append((status, f, old[:60].replace('\n', ' '), [l.split()[1] for l in failed]))
    finally:
        open(p, 'w').write(src)
for x in res:
    print(x)
