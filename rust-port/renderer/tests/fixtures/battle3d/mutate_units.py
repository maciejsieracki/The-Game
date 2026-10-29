#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3 (part 3, units and overlays).

Applies each mutation below to `src/battle/units.rs` (one at a time), runs
`cargo test --locked --lib battle::units`, then `cargo test --locked --test
battle3d_units`, and expects a FAIL (mutant killed). The source file is
restored after every mutant (also on error). Run from `rust-port/renderer`
with CARGO_TARGET_DIR set:

    CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=<scratch> python3 tests/fixtures/battle3d/mutate_units.py

`ONLY=<substring>` limits the run to mutants whose name contains it.
Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived,
2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

SRC = 'src/battle/units.rs'

MUTANTS = [
    # constants
    ('HPBAR_W', 'pub const HPBAR_W: f64 = 0.32;', 'pub const HPBAR_W: f64 = 0.33;'),
    ('HPBAR_Y', 'pub const HPBAR_Y: f64 = 0.72;', 'pub const HPBAR_Y: f64 = 0.7;'),
    ('WALL_WALK_Y', 'pub const WALL_WALK_Y: f64 = 2.5;', 'pub const WALL_WALK_Y: f64 = 2.4;'),
    ('dirYaw fallback', '.unwrap_or(DIR_DELTA[1]);', '.unwrap_or(DIR_DELTA[3]);'),
    ('sideColor own', '        0x003a_6ad0\n', '        0x003a_6ad1\n'),
    # makeUnitBars
    ('frame width pad', 'let frame_w = HPBAR_W + BAR_OUTLINE_PAD * 2.0;', 'let frame_w = HPBAR_W + BAR_OUTLINE_PAD * 1.0;'),
    ('frame y', 'MORALEBAR_Y * 0.5, BAR_OUTLINE_Z);', 'MORALEBAR_Y * 0.6, BAR_OUTLINE_Z);'),
    ('fg z offset', 'scene.set_pos(fg, 0.0, y, 0.002);', 'scene.set_pos(fg, 0.0, y, 0.003);'),
    ('flag x', 'scene.set_pos(flag, flag_w * 0.5,', 'scene.set_pos(flag, flag_w * 0.4,'),
    # bar updates
    ('hp green threshold', 'let color = if ratio > 0.60 {', 'let color = if ratio >= 0.60 {'),
    ('hp yellow threshold', '} else if ratio > 0.30 {', '} else if ratio >= 0.30 {'),
    ('morale red channel', 'f64::from(0x30 - 0xd0)', 'f64::from(0x31 - 0xd0)'),
    ('ammo fg visibility', 'scene.nodes[fg].visible = frac > 0.0;', 'scene.nodes[fg].visible = frac >= 0.0;'),
    ('ammo shown rule', 'let ammo_shown = s.ammo_max.is_finite() && s.ammo_max > 0.0;', 'let ammo_shown = s.ammo_max > 0.0;'),
    ('js_max NaN', 'if a.is_nan() || b.is_nan() {\n        return f64::NAN;\n    }\n    if a == b {\n        return if a.is_sign_negative() { b } else { a };',
     'if a.is_nan() {\n        return b;\n    }\n    if a == b {\n        return if a.is_sign_negative() { b } else { a };'),
    ('js_min NaN', 'if a.is_nan() || b.is_nan() {\n        return f64::NAN;\n    }\n    if a == b {\n        return if a.is_sign_negative() { a } else { b };',
     'if b.is_nan() {\n        return a;\n    }\n    if a == b {\n        return if a.is_sign_negative() { a } else { b };'),
    # fallback avatar / spawn
    ('fallback head y', 's.nodes[head].position.y = 0.35;', 's.nodes[head].position.y = 0.36;'),
    ('bars height', 'scene.set_pos(bars.group, x, top_y + HPBAR_Y, z);', 'scene.set_pos(bars.group, x, top_y, z);'),
    ('deploy scale reset', '            bf.field.scene.set_scale_scalar(u.group, 1.0);\n', ''),
    # wall placement
    ('wall yaw', 'scene.nodes[group].rot_y(PI / 2.0);', 'scene.nodes[group].rot_y(-PI / 2.0);'),
    ('wall centre row', 'let wall_center_row = (f64::from(r_lo) + f64::from(r_hi)) / 2.0;', 'let wall_center_row = (f64::from(r_lo) + f64::from(r_hi)) / 2.0 + 0.5;'),
    # removal / moves / climb
    ('remove hides group', '    scene.nodes[u.group].visible = false;\n', ''),
    ('deploy move y', 'scene.set_pos(u.group, x, top_y, z);', 'scene.set_pos(u.group, x, top_y + 0.01, z);'),
    ('climb bars height', 'scene.set_pos(u.bars.group, x, WALL_WALK_Y + HPBAR_Y, z);', 'scene.set_pos(u.bars.group, x, WALL_WALK_Y, z);'),
    # rings
    ('ring outer radius', 'outer: 0.58,', 'outer: 0.6,'),
    ('ring y', 'scene.set_pos(ring, 0.0, 0.03, 0.0);\n    rings.rings.push', 'scene.set_pos(ring, 0.0, 0.04, 0.0);\n    rings.rings.push'),
    ('ring group colour', 'const RING_GROUP: u32 = 0x00ff_d700;', 'const RING_GROUP: u32 = 0x00ff_d701;'),
    ('visuals scale reset', '        fs.scene.set_scale_scalar(u.group, 1.0);\n', ''),
    ('visuals ring recentre', '                fs.scene.set_pos(ring, 0.0, 0.03, 0.0);', '                fs.scene.set_pos(ring, 0.0, 0.02, 0.0);'),
    # arrows / previews
    ('arrow min length', 'if len < 0.08 {', 'if len < 0.09 {'),
    ('arrow head length', 'let head_len = js_min(0.48, len * 0.24);', 'let head_len = js_min(0.48, len * 0.25);'),
    ('arrow shaft length', 'let shaft_len = js_max(0.06, len - head_len * 0.75);', 'let shaft_len = js_max(0.06, len - head_len * 0.7);'),
    ('cone opacity cap', 'js_min(0.55, opacity + 0.12)', 'js_min(0.5, opacity + 0.12)'),
    ('formation offset default', 'let (dc, dr) = u.formation_offset.unwrap_or((0, 0));', 'let (dc, dr) = u.formation_offset.unwrap_or((1, 0));'),
    ('manual input guard', 'if !st.manual_input_active || st.selected.is_empty() {', 'if st.selected.is_empty() {'),
    ('tile occupant side', 'if occ.side == enemy_side && !occ.dead {', 'if !occ.dead {'),
    ('group de-duplication', 'if issued_groups.iter().any(|g| g == gid) {', 'if false && issued_groups.iter().any(|g| g == gid) {'),
    # ghosts
    ('battle ghost colour', 'if ok { 0x0044_aaff }', 'if ok { 0x0044_aabb }'),
    ('ghost skips own occupant', '.is_none_or(|o| skip.iter().any(|s| s == &o.id));', '.is_none();'),
    ('drag disc opacity', 'if ok { 0.55 } else { 0.45 }', 'if ok { 0.5 } else { 0.45 }'),
    ('drag outline opacity', '0x00ff_d700, 0.75, false', '0x00ff_d700, 0.7, false'),
    ('anchor lift', 'P3::new(ax, ay + 0.09, az)', 'P3::new(ax, ay + 0.08, az)'),
    ('hover outline dashed', '0x0000_ffcc, 0.9, true', '0x0000_ffcc, 0.9, false'),
]


def main() -> int:
    only = os.environ.get('ONLY')
    orig = open(SRC, encoding='utf-8').read()
    killed, survived = 0, []
    try:
        for name, old, new in MUTANTS:
            if only and only not in name:
                continue
            n = orig.count(old)
            if n != 1:
                print(f'BAD MUTANT {name}: pattern found {n}x')
                return 2
            open(SRC, 'w', encoding='utf-8').write(orig.replace(old, new))
            r = subprocess.run(
                ['cargo', 'test', '--locked', '--lib', 'battle::units'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            )
            if r.returncode == 0:
                r = subprocess.run(
                    ['cargo', 'test', '--locked', '--test', 'battle3d_units'],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                )
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   {name} ({why})', flush=True)
            else:
                survived.append(name)
                print(f'SURVIVED {name}', flush=True)
    finally:
        open(SRC, 'w', encoding='utf-8').write(orig)
    print(f'KILLED {killed}/{killed + len(survived)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
