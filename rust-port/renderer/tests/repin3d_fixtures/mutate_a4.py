#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-A4-Q1, batch A4 (constructor with
`fortKind`, Militia and siege towers as spawn DTOs, part-3 vectors regenerated
on `origin/main`).

Applies each mutant below (one at a time; a mutant may edit several spots),
runs `cargo test --locked --test battle3d_units` and expects a FAIL (mutant
killed). Mutants 0-9 cover every control branch of the A4 code path
(`build_battle_scene_with_units` → `build_battle_scene_with_units_fort` →
`place_siege_wall_fort` → `place_siege_towers`); mutants 10-14 are EVIDENCE
mutants in `src/models/unit_core/routing.rs` (outside the A4 allowlist, edited
only transiently and restored): they prove the A4 vectors pin the model routing
of the siege-tower unit and of the Militia unit types. Sources are restored
after every mutant (also on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_a4.py

`ONLY=<substring>` limits the run to mutants whose name contains it;
`RANGE=a:b` to mutants with index a..b-1 (the run is split into shell calls of
< 10 min). Prints one line per mutant and `KILLED k/n`; exit code 1 if any
survived, 2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

U = 'src/battle/units.rs'
T = 'src/battle/siege_towers.rs'
R = 'src/models/unit_core/routing.rs'

CTOR_FORT = '        wall = place_siege_wall_fort(&mut bf.field.scene, &opts.siege_civ, s, fort);'

MUTANTS = [
    # --- build_battle_scene_with_units_fort (`new BattleScene` with fortKind)
    ('ctor ignores fort', [(U, CTOR_FORT, '        wall = place_siege_wall(&mut bf.field.scene, &opts.siege_civ, s);')]),
    ('ctor fort kind only', [(U, CTOR_FORT, '        wall = place_siege_wall_fort(&mut bf.field.scene, &opts.siege_civ, s, &FortDto { kind: fort.kind, tower_material: None, tower_rows: Vec::new() });')]),
    ('ctor towers without kind', [(U, CTOR_FORT, '        wall = place_siege_wall_fort(&mut bf.field.scene, &opts.siege_civ, s, &FortDto { kind: FortKind::None, ..fort.clone() });')]),
    ('plain ctor builds a fort', [(U, '    build_battle_scene_with_units_fort(opts, &FortDto::none())', '    build_battle_scene_with_units_fort(opts, &FortDto { kind: FortKind::Mur, tower_material: Some(TowerMaterial::Kamien), tower_rows: vec![2] })')]),
    ('plain ctor palisade', [(U, '    build_battle_scene_with_units_fort(opts, &FortDto::none())', '    build_battle_scene_with_units_fort(opts, &FortDto { kind: FortKind::Palisada, ..FortDto::none() })')]),
    # --- place_siege_wall_fort (`_placeSiegeWall` kind + `_placeSiegeTowers` after the wall)
    ('wall kind ignored', [(U, '.with_kind(Some(fort.kind.wall_kind())),', '.with_kind(None),')]),
    ('wall_kind mur -> palisada', [(U, '            Self::Palisada => WallKind::Palisada,\n            Self::None | Self::Mur => WallKind::Mur,', '            Self::Palisada | Self::Mur => WallKind::Palisada,\n            Self::None => WallKind::Mur,')]),
    ('towers not placed', [(U, '    let towers = place_siege_towers(scene, wall_col, fort.tower_material, &fort.tower_rows);', '    let towers: Vec<SiegeTower> = Vec::new();')]),
    ('towers material swapped', [(U, '    let towers = place_siege_towers(scene, wall_col, fort.tower_material, &fort.tower_rows);', '    let towers = place_siege_towers(scene, wall_col, fort.tower_material.map(|m| if m == TowerMaterial::Kamien { TowerMaterial::Drewno } else { TowerMaterial::Kamien }), &fort.tower_rows);')]),
    ('towers before the wall', [(U, '    let group = scene.graft(ROOT, wall.scene);\n    scene.nodes[group].rot_y(PI / 2.0);\n    scene.nodes[group].set_pos(wall_x, 0.0, wall_z);\n    let towers = place_siege_towers(scene, wall_col, fort.tower_material, &fort.tower_rows);', '    let towers = place_siege_towers(scene, wall_col, fort.tower_material, &fort.tower_rows);\n    let group = scene.graft(ROOT, wall.scene);\n    scene.nodes[group].rot_y(PI / 2.0);\n    scene.nodes[group].set_pos(wall_x, 0.0, wall_z);')]),
    # --- EVIDENCE: model routing the A4 spawn DTOs depend on (src/models, restored)
    ('route: siege tower rule off', [(R, '    if (has("wieza") && has("oblezn")) || has("siege tower") {\n        return Some(B::SiegeTower);', '    if has("siege tower") {\n        return Some(B::SiegeTower);')]),
    ('route: militia wojownik', [(R, '    if is("wojownik") || is("warrior") {', '    if is("warrior") {')]),
    ('route: militia wlocznik', [(R, '    if is("wlocznik") || is("spearman") {', '    if is("spearman") {')]),
    ('route: militia miecz', [(R, '    if is("wojownik z mieczem i tarcza") || is("swordsman") {', '    if is("swordsman") {')]),
    ('route: militia procarz', [(R, '    if is("procarz") || is("slinger") {', '    if is("slinger") {')]),
]


def run(args: list) -> subprocess.CompletedProcess:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> int:
    only = os.environ.get('ONLY')
    rng = os.environ.get('RANGE')
    lo, hi = (int(x) for x in rng.split(':')) if rng else (0, len(MUTANTS))
    orig = {p: open(p, encoding='utf-8').read() for p in (U, T, R)}
    killed, survived = 0, []
    try:
        for i, (name, edits) in enumerate(MUTANTS):
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
            r = run(['cargo', 'test', '--locked', '--test', 'battle3d_units'])
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
