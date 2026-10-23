#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2 (part 2, static battlefield).

Applies each mutation below to `src/battle/field.rs` (one at a time), runs
`cargo test --locked --lib battle::field`, then `cargo test --locked --test
battle3d_field`, and expects a
FAIL (mutant killed). The source file is restored after every mutant (also
on error). Run from `rust-port/renderer` with CARGO_TARGET_DIR set:

    CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=<scratch> python3 tests/fixtures/battle3d/mutate_field.py

Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived.
"""
import os
import subprocess
import sys

SRC = 'src/battle/field.rs'

MUTANTS = [
    # tile floor
    ('tile roughness', 'Material::standard(key, 0.0, 0.95)', 'Material::standard(key, 0.0, 0.9)'),
    ('tile checker', 'let checker = if (col + row) % 2 == 0 { 0.0 } else { 0.022 };', 'let checker = if (col + row) % 2 == 0 { 0.0 } else { 0.02 };'),
    ('tile variance step', 'let variance = variance_step * 0.0225;', 'let variance = variance_step * 0.022;'),
    # (`variance >= 0` -> `> 0` is EQUIVALENT: at 0, blend(c, 0, -0) == lighten(c, 0); replaced by the darkening target.)
    ('tile darkening target', '                    blend(c, 0, -variance)', '                    blend(c, 0x0001_0101, -variance)'),
    ('attacker side tint', '                    c = lighten(c, 0.05);', '                    c = lighten(c, 0.06);'),
    ('defender side tint colour', 'c = blend(c, 0x0090_90a0, 0.07);', 'c = blend(c, 0x0090_90a1, 0.07);'),
    ('tile slab y', 'self.scene.set_pos(id, x, y_top - TILE_H * 0.5, z);', 'self.scene.set_pos(id, x, y_top - TILE_H * 0.4, z);'),
    ('tile receiveShadow', '                self.scene.receive_shadow(id);\n                self.ground_pick.push(id);', '                self.ground_pick.push(id);'),
    ('tile material cache', 'let mat = if let Some(&(_, m)) = mat_cache.iter().find(|(k, _)| *k == key) {', 'let mat = if let Some(&(_, m)) = None::<&(u32, MatId)> {'),
    # decoration
    ('forest crown height', 'dummy.pos(x + jx, (TILE_S * 0.22 + TILE_S * 0.31) * sc, z + jz);', 'dummy.pos(x + jx, (TILE_S * 0.22 + TILE_S * 0.30) * sc, z + jz);'),
    ('forest crown shade salt', 'let c = if tile_jitter(col, row, t + 50) < 0.5 {', 'let c = if tile_jitter(col, row, t + 51) < 0.5 {'),
    ('hill bump y scale', 'dummy.scale(1.0, HILL_SUMMIT_Y / HILL_BUMP_RADIUS, 1.0);', 'dummy.scale(1.0, 1.0, 1.0);'),
    ('hill shrub lift', 'dummy.pos(x + jx, HILL_LIFT + 0.10, z + jz);', 'dummy.pos(x + jx, HILL_LIFT + 0.12, z + jz);'),
    ('ford water height', '                        -RIVER_DROP * 0.4\n', '                        -RIVER_DROP * 0.5\n'),
    ('water emissive', 'wm.emissive = Color::from_hex(0x000a_2a44);', 'wm.emissive = Color::from_hex(0x000a_2a45);'),
    ('rock count', 'let n = 1 + i32::from(tile_jitter(col, row, 5) > 0.5);', 'let n = 1 + i32::from(tile_jitter(col, row, 5) > 0.6);'),
    ('grass cap', 'const GRASS_CAP: usize = 8000;', 'const GRASS_CAP: usize = 7999;'),
    ('grass blade tilt', '(tile_jitter(col, row, salt + 3) - 0.5) * 0.5,', '(tile_jitter(col, row, salt + 3) - 0.5) * 0.4,'),
    ('pebble chance', 'const PEBBLE_CHANCE: f64 = 0.10;', 'const PEBBLE_CHANCE: f64 = 0.11;'),
    ('bush lift', 'dy: TILE_S * 0.08,', 'dy: TILE_S * 0.09,'),
    ('instance colour fill', 'vec![1.0; cap * 3]', 'vec![0.0; cap * 3]'),
    # ground, margins, frame, pick bounds
    ('ground y', 'self.scene.set_pos(ground, mx, -0.16, mz);', 'self.scene.set_pos(ground, mx, -0.15, mz);'),
    ('margin overlap', 'let inner = ts * 0.15;', 'let inner = ts * 0.1;'),
    ('frame renderOrder', 'self.scene.render_order(frame, 6);', 'self.scene.render_order(frame, 5);'),
    ('frame DoubleSide', '        fm.side = Side::Double;\n', ''),
    ('sphere union step', 'let delta = (len - s.radius) * 0.5;', 'let delta = (len - s.radius) * 0.6;'),
    # siege
    ('wall gate rows', 'let (gate_lo, gate_hi) = (mid_row - 1, mid_row);', 'let (gate_lo, gate_hi) = (mid_row, mid_row + 1);'),
    ('wall tile hp', 'pub const WALL_TILE_HP: f64 = 640.0;', 'pub const WALL_TILE_HP: f64 = 600.0;'),
    ('interior street', 'const STREET_HALF: i32 = 3;', 'const STREET_HALF: i32 = 2;'),
    ('interior cap', 'const BUILDING_CAP: usize = 38;', 'const BUILDING_CAP: usize = 37;'),
    ('interior plot order', 'plots.sort_by_key(|p| p.2);', 'plots.sort_by_key(|p| -p.2);'),
    ('gable ridge', 'let r0 = [-0.5, 1.0, 0.0];', 'let r0 = [-0.5, 0.9, 0.0];'),
    # r2 (Ev-1): siege state handed to part 3 must be compared, not skipped
    ('ctor drops siege', '        grid,\n        siege,\n    }', '        grid,\n        siege: None,\n    }'),
    ('siege gate open', '        gate_open: false,\n        wall_tile_hp,', '        gate_open: true,\n        wall_tile_hp,'),
    ('siege gate col', '        gate_col: wall_col,', '        gate_col: wall_col + 1,'),
    ('siege gate row', '        gate_row: mid_row,', '        gate_row: mid_row - 1,'),
    ('siege gate hp', '        gate_hp: GATE_MAX_HP,', '        gate_hp: GATE_MAX_HP + 1.0,'),
    ('siege row hi', '        row_hi: r_hi,', '        row_hi: r_hi - 1,'),
    ('siege tile hp skip gate', '        if r >= gate_lo && r <= gate_hi {\n            continue;\n        }\n        wall_tile_hp.push', '        if r == gate_lo {\n            continue;\n        }\n        wall_tile_hp.push'),
    ('flat roof lift', 'dummy.pos(px, body_h + roof_h * 0.4, pz);', 'dummy.pos(px, body_h + roof_h * 0.5, pz);'),
    # deploy
    ('deploy tile opacity', 'basic_transparent(0x0044_bbff, 0.28, false)', 'basic_transparent(0x0044_bbff, 0.3, false)'),
    ('deploy edge offset', '(0x0030_60c0, if atk { -0.12 } else { 0.12 }),', '(0x0030_60c0, if atk { -0.13 } else { 0.12 }),'),
    ('ghost renderOrder', 'self.scene.render_order(g, 500);', 'self.scene.render_order(g, 0);'),
    ('outline lift', 'let y_lift = 0.08;', 'let y_lift = 0.09;'),
    ('line distances cumulative', 'd[i] = d[i - 1] + a.distance_to(b);', 'd[i] = a.distance_to(b);'),
    ('passable gate', 't != RIVER && t != WALL && t != GATE', 't != RIVER && t != WALL'),
    # helpers
    ('tileJitter constant', 'col.wrapping_add(1).wrapping_mul(374_761_393)', 'col.wrapping_add(1).wrapping_mul(374_761_394)'),
    ('lighten', 'let rr = int32(js_round(r + (255.0 - r) * amount));', 'let rr = int32(js_round(r + (254.0 - r) * amount));'),
    ('tileTopY hills', '        HILLS => HILL_SUMMIT_Y,', '        HILLS => HILL_LIFT,'),
    # constructor: camera, lights, fog
    ('camera default dist', 'camera.dist = play_span * 0.92;', 'camera.dist = play_span * 0.9;'),
    ('camera clamp', 'let d = js_max(self.dist_min, js_min(self.dist_max, self.dist));', 'let d = self.dist;'),
    ('sun shadow top', 'top: field_world_h * 0.7,', 'top: field_world_h * 0.6,'),
    ('hemisphere DEFAULT_UP', '    f.scene.set_pos(hemi, 0.0, 1.0, 0.0); // Object3D.DEFAULT_UP\n', ''),
    ('fog density', 'fog_density: 0.005,', 'fog_density: 0.012,'),
    ('euler from quaternion', 'Vec3::new(js_atan2(-m23, m33), y, js_atan2(-m12, m11))', 'Vec3::new(js_atan2(m23, m33), y, js_atan2(-m12, m11))'),
]


def main() -> int:
    orig = open(SRC, encoding='utf-8').read()
    killed = 0
    survived = []
    try:
        only = os.environ.get('ONLY')  # optional: run the mutants whose name contains this text
        for name, old, new in MUTANTS:
            if only and only not in name:
                continue
            n = orig.count(old)
            if n != 1:
                print(f'BAD MUTANT {name}: pattern found {n}x')
                return 2
            open(SRC, 'w', encoding='utf-8').write(orig.replace(old, new))
            r = subprocess.run(
                ['cargo', 'test', '--locked', '--lib', 'battle::field'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            )
            if r.returncode == 0:
                r = subprocess.run(
                    ['cargo', 'test', '--locked', '--test', 'battle3d_field'],
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
