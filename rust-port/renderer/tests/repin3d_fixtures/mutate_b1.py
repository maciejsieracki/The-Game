#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-B-Q1, batch B1 (build-highlight constants
and filter, mine tint opacity, deposit display scale, fort/outpost sector scale).

Applies each mutant below (one at a time) to the B1 sources, runs
`cargo test --locked --test repin3d_b1 --test improvements_web_parity --test misc_web_parity`
and expects a FAIL (mutant killed). Sources are restored after every mutant (also
on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_b1.py

`RANGE=a:b` limits the run to mutants a..b-1. Prints one line per mutant and
`KILLED k/n`; exit 1 if any survived, 2 if a pattern is not found exactly once.

Equivalent (not listed, proof in P4-REPIN-3D.md §9.3): dropping the `|| 1`
guard `.filter(|v| *v != 0.0 && !v.is_nan())` — the base builder writes
`depositDisplayScale` only as `Some(2.0)` (`depo2`) or not at all; dropping any
one axis of the fort factor (`n.scale.y *= f`, r1 survivor 'fort factor y only')
— `f = 0.5 * 2 = 1` exactly, and `x * 1.0 == x` bit for bit in IEEE-754.
"""
import os
import subprocess
import sys

H = 'src/models/misc/build_highlight.rs'
R = 'src/models/misc/range.rs'
Z = 'src/models/improvements/zasoby.rs'
G = 'src/models/improvements/registry.rs'

MUTANTS = [
    ('mine tint back to pin 0.30', [(R, 'pub const MINE_ELIGIBLE_TINT_OPACITY: f64 = super::build_highlight::MINE_BUILD_HIGHLIGHT_OPACITY;', 'pub const MINE_ELIGIBLE_TINT_OPACITY: f64 = 0.30;')]),
    ('mine opacity from map base', [(H, '    MINE_ELIGIBLE_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;', '    MAP_HEX_HIGHLIGHT_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;')]),
    ('improvement opacity no brightness', [(H, 'pub const IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY: f64 =\n    MAP_HEX_HIGHLIGHT_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;', 'pub const IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY: f64 =\n    MAP_HEX_HIGHLIGHT_BASE_OPACITY;')]),
    ('brightness 1.25', [(H, 'pub const IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS: f64 = 1.2;', 'pub const IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS: f64 = 1.25;')]),
    ('map base 0.3', [(H, 'pub const MAP_HEX_HIGHLIGHT_BASE_OPACITY: f64 = 0.35;', 'pub const MAP_HEX_HIGHLIGHT_BASE_OPACITY: f64 = 0.3;')]),
    ('filter inverted', [(H, '            !pending_undo_keys.contains(&k)', '            pending_undo_keys.contains(&k)')]),
    ('filter keeps all', [(H, '            !pending_undo_keys.contains(&k)', '            !pending_undo_keys.contains(&k) || k.is_empty() || true')]),
    ('filter key without improvement', [(H, '            let k = format!("{},{}:{improvement_key}", js_num(h.q), js_num(h.r));', '            let k = format!("{},{}:", js_num(h.q), js_num(h.r));')]),
    ('filter key q/r swapped', [(H, '            let k = format!("{},{}:{improvement_key}", js_num(h.q), js_num(h.r));', '            let k = format!("{},{}:{improvement_key}", js_num(h.r), js_num(h.q));')]),
    ('js_num NaN text', [(H, '        return "NaN".into();', '        return "nan".into();')]),
    ('js_num inf text', [(H, '        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();', '        return if n > 0.0 { "inf" } else { "-inf" }.into();')]),
    ('js_num -0 branch removed', [(H, '    if n == 0.0 {\n        return "0".into();\n    }\n', '')]),
    ('js_num lower bound 1e-7', [(H, '    if (1e-6..1e21).contains(&a) {', '    if (1e-7..1e21).contains(&a) {')]),
    ('js_num upper bound 1e22', [(H, '    if (1e-6..1e21).contains(&a) {', '    if (1e-6..1e22).contains(&a) {')]),
    ('js_num no e+ sign', [(H, '        Some((m, e)) if !e.starts_with(\'-\') => format!("{m}e+{e}"),', '        Some((m, e)) if !e.starts_with(\'-\') => format!("{m}e{e}"),')]),
    ('deposit wrapper skipped', [(Z, '    let mut m = build_styled_resource_overlay_base(nakladka, zloze)?;\n    let ud = &mut m.nodes[ROOT].user_data;', '    let mut m = build_styled_resource_overlay_base(nakladka, zloze)?;\n    return Some(m);\n    #[allow(unreachable_code)]\n    let ud = &mut m.nodes[ROOT].user_data;')]),
    ('deposit previous ignored', [(Z, '        .unwrap_or(1.0);\n    ud.set(', '        .map(|_| 1.0)\n        .unwrap_or(1.0);\n    ud.set(')]),
    ('deposit scale 1', [(Z, 'pub const RESOURCE_MODEL_SCALE: f64 = 2.0;', 'pub const RESOURCE_MODEL_SCALE: f64 = 1.0;')]),
    ('fort factor pin 0.5', [(G, '                let f = FORT_OUTPOST_BASE_SCALE * FORT_OUTPOST_MODEL_SCALE;', '                let f = FORT_OUTPOST_BASE_SCALE;')]),
    ('fort model scale 1', [(G, 'pub const FORT_OUTPOST_MODEL_SCALE: f64 = 2.0;', 'pub const FORT_OUTPOST_MODEL_SCALE: f64 = 1.0;')]),
]

TESTS = ['cargo', 'test', '--locked', '--test', 'repin3d_b1', '--test', 'improvements_web_parity',
         '--test', 'misc_web_parity']


def main() -> int:
    lo, hi = 0, len(MUTANTS)
    if os.environ.get('RANGE'):
        a, b = os.environ['RANGE'].split(':')
        lo, hi = int(a), min(int(b), len(MUTANTS))
    killed = 0
    total = 0
    survived = []
    for idx in range(lo, hi):
        name, edits = MUTANTS[idx]
        orig = {}
        try:
            for path, old, new in edits:
                if path not in orig:
                    with open(path, encoding='utf-8') as f:
                        orig[path] = f.read()
            cur = dict(orig)
            for path, old, new in edits:
                n = cur[path].count(old)
                if n != 1:
                    print(f'[{idx}] PATTERN x{n}: {name}')
                    return 2
                cur[path] = cur[path].replace(old, new, 1)
            for path, text in cur.items():
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
            r = subprocess.run(TESTS, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            total += 1
            if r.returncode != 0:
                killed += 1
                print(f'[{idx}] KILLED   {name}', flush=True)
            else:
                survived.append(name)
                print(f'[{idx}] SURVIVED {name}', flush=True)
        finally:
            for path, text in orig.items():
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(text)
    print(f'KILLED {killed}/{total}')
    if survived:
        print('SURVIVED:', survived)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
