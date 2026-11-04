#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-A5-Q1, batch A5 (parts 4-5 re-pinned on
`origin/main`; `_startFade` -> `_removeUnitFromScene`; picking against the
palisade / wall towers / `fortKind`).

A5 changes no behaviour in `src/` (doc comments only); the code it re-pins is
the code the REGENERATED vectors now exercise differently:
  - `units::kill_unit` / `remove_unit_from_scene` — reached by the `fade` event
    and by the defender catapults of the `breachWall` event (part 4,
    `tests/battle3d_dynamics.rs`): mutants 0-4;
  - the pickers (`pick_unit_at_screen`, `pick_ground_tile`, `intersect_objects`,
    `client_rect_to_ndc`) on the fort scenes of `a5.json`
    (`tests/repin3d_a5.rs`): mutants 5-12. Mutants 11-12 edit
    `src/pick/hex.rs` (outside the A5 allowlist) TRANSIENTLY as evidence that
    the edge / NaN rays pin `clientRectToNdc`; restored after every mutant.
Each mutant runs ONLY the test binary named with it, so a kill proves that the
A5 vectors (not some older suite) pin that branch. Sources are restored after
every mutant (also on error). Run from `rust-port/renderer`:
    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_a5.py
`ONLY=<substring>` / `RANGE=a:b` limit the run. Prints one line per mutant and
`KILLED k/n`; exit code 1 if any survived, 2 if a pattern is not found exactly
once.
"""

import os
import subprocess
import sys

U = 'src/battle/units.rs'
P = 'src/battle/picking.rs'
H = 'src/pick/hex.rs'
DYN = 'battle3d_dynamics'
A5 = 'repin3d_a5'

MUTANTS = [
    # --- kill_unit / remove_unit_from_scene (part 4: fade + breach catapults)
    ('kill_unit no-op', DYN, [(U, '    remove_unit_from_scene(scene, u);\n    true\n}', '    let _ = (scene, u);\n    true\n}')]),
    ('remove keeps group attached', DYN, [(U, '    detach(scene, ROOT, u.group);\n    detach(scene, ROOT, u.bars.group);\n    scene.nodes[u.group].visible = false;', '    detach(scene, ROOT, u.bars.group);\n    scene.nodes[u.group].visible = false;')]),
    ('remove keeps bars attached', DYN, [(U, '    detach(scene, ROOT, u.group);\n    detach(scene, ROOT, u.bars.group);\n    scene.nodes[u.group].visible = false;', '    detach(scene, ROOT, u.group);\n    scene.nodes[u.group].visible = false;')]),
    ('remove keeps model visible', DYN, [(U, '    scene.nodes[u.group].visible = false;\n    scene.nodes[u.bars.group].visible = false;\n}', '    scene.nodes[u.bars.group].visible = false;\n}')]),
    ('remove keeps bars visible', DYN, [(U, '    scene.nodes[u.group].visible = false;\n    scene.nodes[u.bars.group].visible = false;\n}', '    scene.nodes[u.group].visible = false;\n}')]),
    # --- pickers on the fort scenes (a5.json)
    ('pick unit: no occupancy branch', A5, [(P, '        if let Some(&i) = occ.get(&t) {\n            if units[i].live() {', '        if let Some(&i) = occ.get(&(i32::MIN, t.1)) {\n            if units[i].live() {')]),
    ('pick unit: K2 rule off', A5, [(P, '                Some(_) => None,', '                Some(_) => Some(i),')]),
    ('pick ground: tie -> plane', A5, [(P, '            } else if plane_y > mesh_y {\n                Some(p)\n            } else {\n                Some(m)\n            }', '            } else if plane_y > mesh_y {\n                Some(p)\n            } else {\n                Some(p)\n            }')]),
    ('pick ground: lower wins', A5, [(P, '            if mesh_y > plane_y {', '            if mesh_y < plane_y {')]),
    ('intersect: never recursive', A5, [(P, '    for &o in objects {\n        if recursive {', '    for &o in objects {\n        if recursive && false {')]),
    ('intersect: unsorted', A5, [(P, '    out.sort_by(|a, b| {\n        a.distance', '    out.sort_by(|b, a| {\n        a.distance')]),
    ('ndc: non-finite -> no ray (evidence)', A5, [(H, '    if rect.width <= 0.0 || rect.height <= 0.0 {\n        return None;\n    }\n    Some((\n        ((client_x - rect.left)', '    if rect.width <= 0.0 || rect.height <= 0.0 || !client_x.is_finite() || !client_y.is_finite() {\n        return None;\n    }\n    Some((\n        ((client_x - rect.left)')]),
    ('ndc: x off by one pixel (evidence)', A5, [(H, '        ((client_x - rect.left) / rect.width) * 2.0 - 1.0,', '        ((client_x - rect.left - 1.0) / rect.width) * 2.0 - 1.0,')]),
]


def run(args: list) -> subprocess.CompletedProcess:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> int:
    only = os.environ.get('ONLY')
    rng = os.environ.get('RANGE')
    lo, hi = (int(x) for x in rng.split(':')) if rng else (0, len(MUTANTS))
    orig = {p: open(p, encoding='utf-8').read() for p in (U, P, H)}
    killed, survived = 0, []
    try:
        for i, (name, test, edits) in enumerate(MUTANTS):
            if not lo <= i < hi or (only and only not in name):
                continue
            text = dict(orig)
            for path, old, new in edits:
                n = text[path].count(old)
                if n != 1:
                    print(f'BAD MUTANT {name}: pattern found {n}x in {path}')
                    return 2
                text[path] = text[path].replace(old, new)
            for p, t in text.items():
                open(p, 'w', encoding='utf-8').write(t)
            r = run(['cargo', 'test', '--locked', '--test', test])
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   [{i}] {name} --test {test} ({why})', flush=True)
            else:
                survived.append(name)
                print(f'SURVIVED [{i}] {name} --test {test}', flush=True)
            for p, t in orig.items():
                open(p, 'w', encoding='utf-8').write(t)
    finally:
        for p, t in orig.items():
            open(p, 'w', encoding='utf-8').write(t)
    print(f'KILLED {killed}/{killed + len(survived)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
