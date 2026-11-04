#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-A2-Q1, batch A2 (palisade as a wall form,
wall towers).

Applies each mutant below (one at a time; a mutant may edit several spots) to
`src/battle/siege_wall.rs` / `src/battle/siege_towers.rs` / `src/battle/units.rs`,
runs `cargo test --locked --test repin3d_a2` and, for the mutants marked `lib`,
also `cargo test --locked --lib battle::siege_towers`; expects a FAIL (mutant
killed). Every control branch of the A2 code has a mutant. Sources are restored
after every mutant (also on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_a2.py

`ONLY=<substring>` limits the run to mutants whose name contains it;
`RANGE=a:b` to mutants with index a..b-1 (the run is split into shell calls of
< 10 min). Prints one line per mutant and `KILLED k/n`; exit code 1 if any
survived, 2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

S = 'src/battle/siege_wall.rs'
T = 'src/battle/siege_towers.rs'
U = 'src/battle/units.rs'

MUTANTS = [
    # --- siege_wall.rs: kind dispatch (`:1199`, before the switch)
    ('kind dispatch removed', [(S, '    if opts.kind == Some(WallKind::Palisada) {\n        return palisade(o);\n    }\n', '')], False),
    ('kind mur as palisade', [(S, '    if opts.kind == Some(WallKind::Palisada) {\n        return palisade(o);', '    if opts.kind.is_some() {\n        return palisade(o);')], False),
    ('palisade style arm', [(S, '        WallStyle::Palisada => palisade(o),', '        WallStyle::Palisada => build_grecja(o),')], False),
    ('web_id palisada', [(S, '            Self::Palisada => "palisada",', '            Self::Palisada => "palisade",')], False),
    ('fortKind key absent', [(S, '        if self.fort_kind.is_some() {\n            k.push("fortKind");\n        }\n', '')], False),
    ('fortKind not set', [(S, '    out.user_data.fort_kind = Some(WallKind::Palisada);\n', '')], False),
    # --- buildPalisade body
    ('segment loop bound', [(S, '    while sx < l / 2.0 - t * 0.01 {\n        let cx = sx + t / 2.0;\n        if cx.abs() < gate_half_w + t * 0.01 {\n            sx += t;\n            continue;\n        }\n        let key = js_round(cx / t);\n        // `new', '    while sx < l / 2.0 {\n        let cx = sx + t / 2.0;\n        if cx.abs() < gate_half_w + t * 0.01 {\n            sx += t;\n            continue;\n        }\n        let key = js_round(cx / t);\n        // `new')], False),
    ('gate gap not skipped', [(S, '        if cx.abs() < gate_half_w + t * 0.01 {\n            sx += t;\n            continue;\n        }\n        let key = js_round(cx / t);\n        // `new', '        let key = js_round(cx / t);\n        // `new')], False),
    ('segment key floor', [(S, '        let key = js_round(cx / t);\n        // `new', '        let key = (cx / t).floor();\n        // `new')], False),
    ('segment group position', [(S, '        w.m.node(seg).set_pos(cx, 0.0, 0.0);', '        w.m.node(seg).set_pos(0.0, 0.0, 0.0);')], False),
    ('bank no receiveShadow', [(S, '        w.m.receive_shadow(bank);\n', '')], False),
    ('outer poles 3', [(S, '        for i in 0..4u32 {\n            let fi = f64::from(i);\n            let hv = h * (0.93', '        for i in 0..3u32 {\n            let fi = f64::from(i);\n            let hv = h * (0.93')], False),
    ('outer hash seed', [(S, 'hash01(key * 9.1 + fi * 3.7)', 'hash01(key * 9.1 + fi * 3.8)')], False),
    ('inner hash +1', [(S, 'hash01(key * 5.3 + fi * 2.9 + 1.0)', 'hash01(key * 5.3 + fi * 2.9)')], False),
    ('wood index no abs', [(S, 'wood_mats[wood_index(fi + key.abs())]', 'wood_mats[wood_index(fi + key)]')], False),
    ('wood index branch 2', [(S, '    if r >= 2.0 {\n        2\n', '    if r >= 2.0 {\n        1\n')], False),
    ('wood index branch 1', [(S, '    } else if r >= 1.0 {\n        1\n', '    } else if r >= 1.0 {\n        0\n')], False),
    ('geo cache disabled', [(S, '        if let Some((_, g)) = geo_cache.iter().find(|(k, _)| *k == key) {\n            return *g;\n        }\n', '')], False),
    ('geo cache key 4 digits', [(S, '        let key = js_to_fixed(hv, 3);', '        let key = js_to_fixed(hv, 4);')], False),
    ('plank not cast', [(S, '        w.cast(seg, plank_geo, wood_dk, 0.0, h * 0.97, 0.0);', '        w.mesh(seg, plank_geo, wood_dk, 0.0, h * 0.97, 0.0);')], False),
    ('segment not in map', [(S, '        map_set(&mut segs, key, seg);\n        sx += t;\n    }\n    w.segs = segs;', '        sx += t;\n    }\n    w.segs = segs;')], False),
    ('crossbar not rotated', [(S, '    w.m.node(crossbar).rot_z(PI / 2.0);\n\n    w.stairs(', '\n    w.stairs(')], False),
    ('palisade gate colour', [(S, '0x6b_4a2a, 0x3d_2510', '0x5c_3d1e, 0x3d_2510')], False),
    ('gate post height', [(S, 'Prim::cyl(t * 0.12, t * 0.16, h * 1.25, 8)', 'Prim::cyl(t * 0.12, t * 0.16, h * 1.15, 8)')], False),
    # --- units.rs: fortKind -> kind, towers after the wall, userData shift
    ('wall_kind palisada', [(U, '            Self::Palisada => WallKind::Palisada,', '            Self::Palisada => WallKind::Mur,')], False),
    ('wall_kind none', [(U, '            Self::None | Self::Mur => WallKind::Mur,', '            Self::None => WallKind::Palisada,\n            Self::Mur => WallKind::Mur,')], False),
    ('kind not passed', [(U, '.with_kind(Some(fort.kind.wall_kind()))', '.with_kind(None)')], False),
    ('towers not placed', [(U, '    let towers = place_siege_towers(scene, wall_col, fort.tower_material, &fort.tower_rows);', '    let towers = Vec::new();')], False),
    ('shift fortKind', [(U, '        fort_kind: ud.fort_kind,', '        fort_kind: None,')], False),
    # --- siege_towers.rs: buildWallTower
    ('material branch swap', [(T, '        TowerMaterial::Kamien => {\n            let stone', '        TowerMaterial::Drewno => {\n            let stone'), (T, '        TowerMaterial::Drewno => {\n            let wood', '        TowerMaterial::Kamien => {\n            let wood')], False),
    ('tower H factor', [(T, '    let h = wall_height * 1.75;', '    let h = wall_height * 1.7;')], False),
    ('tower w factor', [(T, '    let w = t * 0.55;', '    let w = t * 0.5;')], False),
    ('body receiveShadow', [(T, '            g.m.shadows(body, true, true);', '            g.m.cast_shadow(body);')], False),
    ('merlons = corners', [(T, '            for (cx, cz) in MERLONS {', '            for (cx, cz) in CORNERS {')], False),
    ('one slit side', [(T, '            for sz in [-1.0, 1.0] {\n                g.mesh(\n                    Prim::bx(w * 0.12', '            for sz in [-1.0] {\n                g.mesh(\n                    Prim::bx(w * 0.12')], False),
    ('braces one level', [(T, '            for y in [h * 0.35, h * 0.65] {', '            for y in [h * 0.35] {')], False),
    ('rail count', [(T, '            for i in 0..12u32 {', '            for i in 0..11u32 {')], False),
    ('rail cos/sin', [(T, '                    js_cos(a) * w * 0.6,', '                    js_sin(a) * w * 0.6,')], False),
    ('roof y', [(T, '                h + h * 0.03 + h * 0.5,', '                h + h * 0.5,')], False),
    ('towerTopY', [(T, '    let top = h + h * 0.1;', '    let top = h + h * 0.2;')], False),
    ('node userData', [(T, '    ud.set("towerHeight", UserValue::Num(h));\n', '')], False),
    # --- siege_towers.rs: _placeSiegeTowers / clone
    ('null material places', [(T, '    let Some(material) = material else {\n        return Vec::new();\n    };', '    let material = material.unwrap_or(TowerMaterial::Kamien);')], True),
    ('tower offset sign', [(T, '        scene.nodes[mesh].set_pos(x - TILE_S * 0.5, 0.0, z);', '        scene.nodes[mesh].set_pos(x + TILE_S * 0.5, 0.0, z);')], False),
    ('tower col/row swap', [(T, '        let (x, z) = cell_to_world(f64::from(wall_col), f64::from(row));', '        let (x, z) = cell_to_world(f64::from(row), f64::from(wall_col));')], False),
    ('tower wall height', [(T, 'pub const TOWER_WALL_HEIGHT: f64 = 2.5;', 'pub const TOWER_WALL_HEIGHT: f64 = 3.0;')], False),
    ('tower row stored', [(T, '            row,\n            mesh: Some(mesh),', '            row: row + 1,\n            mesh: Some(mesh),')], False),
    ('tower destroyed flag', [(T, '            mesh: Some(mesh),\n            destroyed: false,', '            mesh: Some(mesh),\n            destroyed: true,')], False),
    ('clone materials not shared', [(T, '        None => *shared = Some(before),', '        None => {}')], True),
    ('clone keeps source Euler', [(T, '    for n in &mut scene.nodes[root..] {\n        n.rotation = euler_from_quat(n.quaternion);\n    }\n', '')], False),
]


def run(args: list) -> subprocess.CompletedProcess:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> int:
    only = os.environ.get('ONLY')
    rng = os.environ.get('RANGE')
    lo, hi = (int(x) for x in rng.split(':')) if rng else (0, len(MUTANTS))
    orig = {p: open(p, encoding='utf-8').read() for p in (S, T, U)}
    killed, survived = 0, []
    try:
        for i, (name, edits, lib) in enumerate(MUTANTS):
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
            r = run(['cargo', 'test', '--locked', '--test', 'repin3d_a2'])
            if r.returncode == 0 and lib:
                r = run(['cargo', 'test', '--locked', '--lib', 'battle::siege_towers'])
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   [{i}] {name} ({why})', flush=True)
            else:
                survived.append(name)
                print(f'SURVIVED [{i}] {name}', flush=True)
            for p, t in orig.items():
                open(p, 'w', encoding='utf-8').write(t)
    finally:
        for p, t in orig.items():
            open(p, 'w', encoding='utf-8').write(t)
    print(f'KILLED {killed}/{killed + len(survived)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
