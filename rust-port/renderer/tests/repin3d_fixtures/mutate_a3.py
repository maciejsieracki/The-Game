#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-A3-Q1, batch A3 (tower break, tower
volley / shot, wall and palisade breach with towers).

Applies each mutant below (one at a time; a mutant may edit several spots) to
`src/battle/siege_towers.rs` / `src/battle/dynamics.rs`, runs
`cargo test --locked --test repin3d_a3` and, for the mutants marked `lib`,
also `cargo test --locked --lib battle::siege_towers`; expects a FAIL (mutant
killed). Every control branch of the A3 code has a mutant. Sources are restored
after every mutant (also on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_a3.py

`ONLY=<substring>` limits the run to mutants whose name contains it;
`RANGE=a:b` to mutants with index a..b-1 (the run is split into shell calls of
< 10 min). Prints one line per mutant and `KILLED k/n`; exit code 1 if any
survived, 2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

T = 'src/battle/siege_towers.rs'
D = 'src/battle/dynamics.rs'

MUTANTS = [
    # --- _destroyTowerAtRow (:4089-4095)
    ('destroy ignores destroyed flag', [(T, '        .find(|x| x.row == wall_row && !x.destroyed)?;', '        .find(|x| x.row == wall_row)?;')], True),
    ('destroy any row', [(T, '        .find(|x| x.row == wall_row && !x.destroyed)?;', '        .find(|x| !x.destroyed)?;')], False),
    ('destroy flag not set', [(T, '    t.destroyed = true;\n    if let Some(m) = t.mesh {', '    if let Some(m) = t.mesh {')], False),
    ('destroy mesh stays visible', [(T, '        scene.nodes[m].visible = false;\n    }\n    Some(format!(', '    }\n    Some(format!(')], False),
    ('destroy log text', [(T, '"Wieza strzelnicza w wyłomie (rzad {wall_row}) zburzona."', '"Wieza strzelnicza w wylomie (rzad {wall_row}) zburzona."')], False),
    # --- _breachWallTile -> _destroyTowerAtRow (:7563)
    ('breach skips tower', [(D, '            let log = super::siege_towers::destroy_tower_at_row(scene, &mut w.towers, wall_row);', '            let log = None;')], False),
    ('breach tower row + 1', [(D, 'destroy_tower_at_row(scene, &mut w.towers, wall_row);', 'destroy_tower_at_row(scene, &mut w.towers, wall_row + 1);')], False),
    ('breach drops the wall', [(D, '            (Some(&*w), log)', '            (None, log)')], False),
    # --- _fireSiegeTowers (:4103-4116)
    ('volley ignores finished', [(T, '    if finished || towers.is_empty() || !has_shooter {', '    if towers.is_empty() || !has_shooter {')], False),
    ('volley ignores shooter', [(T, '    if finished || towers.is_empty() || !has_shooter {', '    if finished || towers.is_empty() {')], False),
    ('volley destroyed shoots', [(T, '        if towers[i].destroyed {\n            continue;\n        }\n', '')], False),
    ('volley tile check off', [(T, '        if !wall_tile_alive(row) {', '        if false && !wall_tile_alive(row) {')], False),
    ('volley lost tile still shoots', [(T, '                v.log.push(l);\n            }\n            continue;', '                v.log.push(l);\n            }')], False),
    ('volley lost tile not destroyed', [(T, '            if let Some(l) = destroy_tower_at_row(scene, towers, row) {\n                v.log.push(l);\n            }\n', '')], False),
    ('volley stagger', [(T, 'pub const TOWER_STAGGER_MS: f64 = 180.0;', 'pub const TOWER_STAGGER_MS: f64 = 200.0;')], False),
    ('volley stagger not advanced', [(T, '        stagger += TOWER_STAGGER_MS;\n', '')], False),
    ('volley stagger before push', [(T, '        v.shots.push(TowerShotPlan {\n            tower: i,\n            delay: stagger,\n        });\n        stagger += TOWER_STAGGER_MS;', '        stagger += TOWER_STAGGER_MS;\n        v.shots.push(TowerShotPlan {\n            tower: i,\n            delay: stagger,\n        });')], False),
    # --- the synthetic shooter -> projectileKind (:4133-4147)
    ('kind default category', [(T, '    let cat = typ.unwrap_or("Distance");', '    let cat = typ.unwrap_or("procarz");')], False),
    ('kind ignores Typ', [(T, '    let cat = typ.unwrap_or("Distance");', '    let cat = "Distance";')], False),
    ('kind nazwa fallback', [(T, 'jednostka.unwrap_or("Strzelec")', 'jednostka.unwrap_or("Procarz")')], False),
    # --- _fireOneTower (:4118-4162)
    ('shot ignores finished', [(T, '    if finished || tower.destroyed {\n        return None;\n    }\n    let target = target?;', '    if tower.destroyed {\n        return None;\n    }\n    let target = target?;')], False),
    ('shot ignores destroyed', [(T, '    if finished || tower.destroyed {\n        return None;\n    }\n    let target = target?;', '    if finished {\n        return None;\n    }\n    let target = target?;')], False),
    ('shot from y', [(T, 'pub const TOWER_SHOT_Y: f64 = 4.2;', 'pub const TOWER_SHOT_Y: f64 = 4.0;')], False),
    ('shot from x offset', [(T, '        Vec3::new(tx - TILE_S * 0.5, TOWER_SHOT_Y, tz),', '        Vec3::new(tx, TOWER_SHOT_Y, tz),')], False),
    ('shot to torso', [(T, '        Vec3::new(dx, tile_top_y(grid, target.0, target.1) + 0.5, dz),', '        Vec3::new(dx, 0.5, dz),')], False),
    ('shot target col/row', [(T, '    let (dx, dz) = cell_to_world(f64::from(target.0), f64::from(target.1));', '    let (dx, dz) = cell_to_world(f64::from(target.1), f64::from(target.0));')], False),
    ('shot log text', [(T, '"Wieza strzelnicza (rzad {}) strzela do {}."', '"Wieza strzelnicza (rzad {}) strzela w {}."')], False),
    ('shot blow delay', [(T, '        blow_delay: RANGED_FLY_MS,', '        blow_delay: 0.0,')], False),
    ('shot t0', [(T, '    let projectile = launch_projectile(scene, kind, from, to, t0);', '    let projectile = launch_projectile(scene, kind, from, to, 0.0);')], False),
    ('shot kind fixed', [(T, '    let projectile = launch_projectile(scene, kind, from, to, t0);', '    let projectile = launch_projectile(scene, ProjectileKind::Arrow, from, to, t0);')], False),
]


def run(args: list) -> subprocess.CompletedProcess:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> int:
    only = os.environ.get('ONLY')
    rng = os.environ.get('RANGE')
    lo, hi = (int(x) for x in rng.split(':')) if rng else (0, len(MUTANTS))
    orig = {p: open(p, encoding='utf-8').read() for p in (T, D)}
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
            r = run(['cargo', 'test', '--locked', '--test', 'repin3d_a3'])
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
