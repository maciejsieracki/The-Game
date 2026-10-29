#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4 (part 4, dynamics and effects).

Applies each mutation below to `src/battle/dynamics.rs` (one at a time), runs
`cargo test --locked --lib battle::dynamics`, then `cargo test --locked --test
battle3d_dynamics`, and expects a FAIL (mutant killed). The source file is
restored after every mutant (also on error). Run from `rust-port/renderer`
with CARGO_TARGET_DIR set:

    CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=<scratch> python3 tests/fixtures/battle3d/mutate_dynamics.py

`ONLY=<substring>` limits the run to mutants whose name contains it.
Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived,
2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

SRC = 'src/battle/dynamics.rs'

MUTANTS = [
    # constants
    ('MOVE_STEP_MS', 'pub const MOVE_STEP_MS: f64 = 240.0;', 'pub const MOVE_STEP_MS: f64 = 250.0;'),
    ('DEATH_FADE_MS', 'pub const DEATH_FADE_MS: f64 = 500.0;', 'pub const DEATH_FADE_MS: f64 = 400.0;'),
    ('BLOW_HIT_T', 'pub const BLOW_HIT_T: f64 = 150.0;', 'pub const BLOW_HIT_T: f64 = 140.0;'),
    ('MORALE_GATE_BREACH', 'pub const MORALE_GATE_BREACH: f64 = 5.0;', 'pub const MORALE_GATE_BREACH: f64 = 6.0;'),
    ('RAM_REACH', 'pub const RAM_REACH: f64 = 0.25;', 'pub const RAM_REACH: f64 = 0.3;'),
    ('BOULDER_ARC', 'pub const BOULDER_ARC: f64 = 3.5;', 'pub const BOULDER_ARC: f64 = 3.0;'),
    ('PROJECTILE_ARC', 'pub const PROJECTILE_ARC: f64 = 0.6;', 'pub const PROJECTILE_ARC: f64 = 0.5;'),
    ('MOVE_HOP', 'pub const MOVE_HOP: f64 = 0.12;', 'pub const MOVE_HOP: f64 = 0.1;'),
    # projectile kind / mesh
    ('kind legionist', 'if hay.contains("legionist") {', 'if hay.contains("legion ") {'),
    ('kind procarz', 'if cat == "procarz" || hay.contains("procar") || hay.contains("sling") {', 'if cat == "procarz" || hay.contains("sling") {'),
    ('arrow shaft radius', 'let shaft_r = TILE_S * 0.009;', 'let shaft_r = TILE_S * 0.01;'),
    ('javelin head radius', 'shaft_r * 2.0)', 'shaft_r * 2.1)'),
    ('head offset', 's.nodes[head].position.x = shaft_len * 0.5 + head_len * 0.5;', 's.nodes[head].position.x = shaft_len * 0.5 + head_len * 0.4;'),
    ('pilum head past shank', 'shaft_len * 0.5 + shank_len + head_len * 0.5;', 'shaft_len * 0.5 + head_len * 0.5;'),
    ('fletch flare', 's.nodes[fletch].rot_z(PI / 2.0);', 's.nodes[fletch].rot_z(-PI / 2.0);'),
    ('sling stone shadow', '        s.cast_shadow(id);\n', ''),
    # flight / walk / lunge
    ('shot lift', 'tile_top_y(grid, attacker.0, attacker.1) + 0.5, az),', 'tile_top_y(grid, attacker.0, attacker.1) + 0.4, az),'),
    ('aim threshold', 'if len_sq > 1e-6 {', 'if len_sq > 1e9 {'),
    ('projectile removal', '            detach(scene, ROOT, p.node);\n', ''),
    ('walk bar height', 'bars: Vec3::new(x, base_y + HPBAR_Y, z),', 'bars: Vec3::new(x, base_y + HPBAR_Y + 0.01, z),'),
    ('lunge depth', 'lunge: (ax + (mid_x - ax) * 0.6, az + (mid_z - az) * 0.6),', 'lunge: (ax + (mid_x - ax) * 0.5, az + (mid_z - az) * 0.6),'),
    ('lunge return easing', 'ax = lerp(self.lunge.0, self.home.x, ease_in(p));', 'ax = lerp(self.lunge.0, self.home.x, ease_out(p));'),
    ('lunge end', 'let finished = local_t >= BLOW_LUNGE_MS;', 'let finished = local_t > BLOW_LUNGE_MS;'),
    # fade / ram / boulder
    ('fade shrink', 'set_scale_scalar(1.0 - p * 0.6);', 'set_scale_scalar(1.0 - p * 0.5);'),
    ('fade opacity', 'scene.materials[m].opacity = 1.0 - p;', 'scene.materials[m].opacity = 1.0 - p * 0.9;'),
    ('fade hides bars', '            scene.nodes[u.bars.group].visible = false;\n            return true;', '            return true;'),
    ('ram triangle', 'let forward = if t < 0.5 { t * 2.0 } else { (1.0 - t) * 2.0 };', 'let forward = if t < 0.5 { t * 2.0 } else { 1.0 };'),
    ('boulder segments', 'sphere(0.32, 7, 7)', 'sphere(0.32, 8, 7)'),
    ('wall shot lift', '+ 0.8, az),', '+ 0.7, az),'),
    # breaches
    ('rubble salt', 'let s = 200 + i * 11;', 'let s = 200 + i * 13;'),
    ('rubble rock share', 'let is_rock = j(4) < 0.4;', 'let is_rock = j(4) < 0.5;'),
    ('rubble lift', 'let oy = (if is_rock { 0.06 } else { 0.10 }) * sc;', 'let oy = (if is_rock { 0.06 } else { 0.12 }) * sc;'),
    ('segments hidden', '            scene.nodes[m].visible = false;\n        }\n    }\n    let (rx, rz)', '        }\n    }\n    let (rx, rz)'),
    ('retreat bars', 'scene.nodes[u.bars.group].set_pos(x, top + HPBAR_Y, z);', 'scene.nodes[u.bars.group].set_pos(x, top, z);'),
    ('gate rows', 'for r in (gate_row - 1)..=gate_row {', 'for r in gate_row..=gate_row {'),
    ('gate hidden', '    scene.nodes[wall.user_data.gate].visible = false;\n', ''),
    ('gate band', 'if (lx - gate_cx).abs() < gate_half_w + TILE_S * 0.6 {', 'if (lx - gate_cx).abs() < gate_half_w + TILE_S * 0.5 {'),
    ('gate height rule', 'if ly >= wall_h * 0.9 ||', 'if ly >= wall_h ||'),
    # rout / markers / billboard / labels / deploy
    ('rout west', 'BattleSide::Atk => 3,', 'BattleSide::Atk => 1,'),
    # added by Operator "pomiary" r1 (P4-36 §38)
    ('rout east', 'BattleSide::Def => 1,', 'BattleSide::Def => 3,'),
    ('gate centre band', '< gate_half_w * 0.9', '< gate_half_w * 0.8'),
    ('marker half size', 'let hs = TILE_S * 0.44;', 'let hs = TILE_S * 0.45;'),
    ('marker opacity', 'lm.opacity = 0.92;', 'lm.opacity = 0.9;'),
    ('marker sprite offset', 'set_pos(-hs * 0.85, 0.55, -hs * 0.85);', 'set_pos(-hs * 0.85, 0.5, -hs * 0.85);'),
    ('marker positive only', '(n.is_finite() && n > 0.0).then_some(n)', '(n.is_finite() && n >= 0.0).then_some(n)'),
    ('marker dead guard', 'Some(g) if !g.is_empty() && !dead && !u.removed => g,', 'Some(g) if !g.is_empty() && !u.removed => g,'),
    ('billboard camera-style', '        PVec3::new(target.x, target.y, target.z),\n        pos,\n', '        pos,\n        PVec3::new(target.x, target.y, target.z),\n'),
    ('damage label lift', 'tile_top_y(grid, col, row) + HPBAR_Y + 0.20, z)', 'tile_top_y(grid, col, row) + HPBAR_Y + 0.25, z)'),
    ('label opacity', 'Some((w, 1.0 - p * p))', 'Some((w, 1.0 - p))'),
    ('end deploy shows lines', 'scene.nodes[b.orders.lines].visible = true;', 'scene.nodes[b.orders.lines].visible = false;'),
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
                ['cargo', 'test', '--locked', '--lib', 'battle::dynamics'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            )
            if r.returncode == 0:
                r = subprocess.run(
                    ['cargo', 'test', '--locked', '--test', 'battle3d_dynamics'],
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
