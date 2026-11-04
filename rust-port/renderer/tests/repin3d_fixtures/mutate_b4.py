#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-B4-Q1 (batch B4: `registerOwnedMeshResources`
of `cities.ts`, applied by `buildSettlementModelForStyle`).

Applies each mutant below (one at a time) to `src/models/cities/renderer.rs`, runs
`cargo test --locked --test repin3d_b4 --test cities_web_parity` and expects a FAIL
(mutant killed). Sources are restored after every mutant (also on error). Run from
`rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_b4.py

`RANGE=a:b` limits the run to mutants a..b-1. Prints one line per mutant and
`KILLED k/n`; exit 1 if any survived, 2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

R = 'src/models/cities/renderer.rs'

CALL = '    register_owned_mesh_resources(&mut model);\n    model\n}'
LOOP = '''        if let NodeKind::Mesh(m) = &model.nodes[id].kind {
            geos += 1;'''
DEDUP = '''                if !mats.contains(&mi) {
                    mats.push(mi);
                }'''
SET_M = '    ud.set("mats", UserValue::Mats(mats));\n'
SET_G = '    ud.set("perCityGeos", UserValue::Len(geos));\n'

MUTANTS = [
    ('registry not applied (pin)', [(R, CALL, '    model\n}')]),
    ('mats key missing', [(R, SET_M, '')]),
    ('perCityGeos key missing', [(R, SET_G, '')]),
    ('keys swapped order', [(R, SET_M + SET_G, SET_G + SET_M)]),
    ('mats key renamed', [(R, 'ud.set("mats", UserValue::Mats(mats));', 'ud.set("materials", UserValue::Mats(mats));')]),
    ('perCityGeos as Mats', [(R, 'UserValue::Len(geos)', 'UserValue::Mats(vec![0; geos])')]),
    ('no dedup of materials', [(R, DEDUP, '                mats.push(mi);')]),
    ('materials in reverse first-use order', [(R, SET_M, '    mats.reverse();\n' + SET_M)]),
    ('materials sorted by creation id', [(R, SET_M, '    mats.sort_unstable();\n' + SET_M)]),
    ('only first material slot', [(R, '            for &mi in &m.materials {', '            for &mi in m.materials.iter().take(1) {')]),
    ('geometry count +1', [(R, 'UserValue::Len(geos)', 'UserValue::Len(geos + 1)')]),
    ('geometry count = unique materials', [(R, 'UserValue::Len(geos)', 'UserValue::Len(mats_len)'),
                                           (R, SET_M, '    let mats_len = mats.len();\n' + SET_M)]),
    ('line loops counted as meshes', [(R, LOOP, '''        if let NodeKind::Mesh(m) | NodeKind::LineLoop(m) = &model.nodes[id].kind {
            geos += 1;''')]),
    ('only the root children', [(R, '    for id in model.traverse() {\n        if let NodeKind::Mesh(m)', '    for id in model.nodes[ROOT].children.clone() {\n        if let NodeKind::Mesh(m)')]),
    ('registry only for bronze', [(R, '''    let mut model = if era >= 2.0 {
        build_miasto_braz(''', '''    let mut model = if era >= 2.0 {
        let mut b = build_miasto_braz('''),
                                  (R, '''                color: owner_col,
            },
        )
    } else {''', '''                color: owner_col,
            },
        );
        register_owned_mesh_resources(&mut b);
        return b;
    } else {'''),
                                  (R, CALL, '    model\n}')]),
]

TESTS = ['cargo', 'test', '--locked', '--test', 'repin3d_b4', '--test', 'cities_web_parity']


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
