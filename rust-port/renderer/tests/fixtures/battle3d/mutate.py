#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1 (round 1, siegeWall).

Applies each mutation below to `src/battle/siege_wall.rs` (one at a time),
runs `cargo test --locked --test battle3d_siege_wall` and expects a FAIL
(mutant killed). The source file is restored after every mutant (also on
error). Run from `rust-port/renderer` with CARGO_TARGET_DIR set:

    CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=<scratch> python3 tests/fixtures/battle3d/mutate.py

Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived.
"""
import subprocess
import sys

SRC = 'src/battle/siege_wall.rs'

MUTANTS = [
    ('roughness', 'pub const WALL_ROUGHNESS: f64 = 0.92;', 'pub const WALL_ROUGHNESS: f64 = 0.9;'),
    ('hash01 constant', 'js_sin(n * 12.9898 + 78.233)', 'js_sin(n * 12.9899 + 78.233)'),
    ('shadeColor lighten', 'c + (255.0 - c) * amt', 'c + (254.0 - c) * amt'),
    ('Math.round tie', 'let r = if x - f >= 0.5 { f + 1.0 } else { f };', 'let r = if x - f > 0.5 { f + 1.0 } else { f };'),
    ('segment buckets', 'const BUCKETS: f64 = 5.0;', 'const BUCKETS: f64 = 4.0;'),
    ('merlon spacing', 'let bx = start_x + (fi + 0.5) * (span_w / count);', 'let bx = start_x + (fi + 0.25) * (span_w / count);'),
    ('merlon shade parity', 'let mat = if i.is_multiple_of(2) {', 'let mat = if !i.is_multiple_of(2) {'),
    ('stair step height', 'let step_h = 0.22;', 'let step_h = 0.2;'),
    ('stair direction', 'let z = wall_inner_z + (n_steps - fi - 0.5) * step_d;', 'let z = wall_inner_z + (n_steps - fi + 0.5) * step_d;'),
    ('stair receiveShadow', 'self.m.shadows(s, true, true);', 'self.m.shadows(s, true, false);'),
    ('portcullis crossbar y', 'let y = gate_h * (0.18 + f64::from(i) * 0.32);', 'let y = gate_h * (0.18 + f64::from(i) * 0.3);'),
    ('portcullis bar count', 'js_round(gate_w / (gate_w * 0.18))', 'js_round(gate_w / (gate_w * 0.2))'),
    ('wooden gate diagonal sign', 'if side == -1.0 { 1.0 } else { -1.0 }', 'if side == -1.0 { -1.0 } else { 1.0 }'),
    ('wooden gate atan2 args', 'js_atan2(gate_h * 0.7, wing_w)', 'js_atan2(wing_w, gate_h * 0.7)'),
    ('sumer arch theta', 'geom::cylinder_geometry(self.r, self.r, self.h, self.radial, 1, true, 0.0, PI)', 'geom::cylinder_geometry(self.r, self.r, self.h, self.radial, 1, true, 0.0, PI * 2.0)'),
    ('chiny roof scale', '.set_scale(1.0, 1.0, tower_d / tower_w);', '.set_scale(1.0, 1.0, tower_w / tower_d);'),
    ('egipt cap rotation', 'w.m.node(cap).rot_y(PI / 4.0);', 'w.m.node(cap).rot_y(0.0);'),
    ('zulu pole alternation', 'let ph = pole_h * if i.is_multiple_of(2) { 1.0 } else { 0.88 };', 'let ph = pole_h * if i.is_multiple_of(2) { 1.0 } else { 0.9 };'),
    ('zulu pole count', '            let ph = pole_h', '            if f64::from(i) == cnt { break; }\n            let ph = pole_h'),
    ('crown pole count', '            w.cast(ROOT, pole, mat, px, h + pole_h / 2.0, ext_z);', '            if f64::from(i) == cnt { break; }\n            w.cast(ROOT, pole, mat, px, h + pole_h / 2.0, ext_z);'),
    ('unknown key fallback', 'BronzeCiv::from_web_id(s).map_or(Self::Grecja, Self::for_civ)', 'BronzeCiv::from_web_id(s).map_or(Self::Rzym, Self::for_civ)'),
    ('breach gate rows', 'if !(r >= gate_row_lo && r <= gate_row_hi) {', 'if !(r >= gate_row_lo && r < gate_row_hi) {'),
    ('breach panels map', 'wall.user_data.row_breach_panels = Some(Vec::new());', 'wall.user_data.row_breach_panels = None;'),
    ('gate skip width', 'if cx.abs() < gate_half_w + t * 0.01 {', 'if cx.abs() < gate_half_w + t * 0.6 {'),
    ('segment receiveShadow', 'self.m.shadows(seg, true, true);', 'self.m.shadows(seg, true, false);'),
    ('default height', 'pub const DEFAULT_HEIGHT: f64 = 3.0;', 'pub const DEFAULT_HEIGHT: f64 = 2.5;'),
    ('rzym bridge castShadow', '    w.mesh(\n        ROOT,\n        Prim::bx(gate_w + t * 0.1, h * 0.07, wall_d),', '    w.cast(\n        ROOT,\n        Prim::bx(gate_w + t * 0.1, h * 0.07, wall_d),'),
    ('wood turret cap segments', 'Prim::cone(turret_r * 1.05, turret_h * 0.22, 6),', 'Prim::cone(turret_r * 1.05, turret_h * 0.22, 8),'),
    ('segment material cache', 'let mat = if let Some(&m) = map_get(&shade_cache, bucket) {', 'let mat = if let Some(&m) = None::<&MatId> {'),
    ('gateOpen', '                gate_open: false,', '                gate_open: true,'),
    ('inka portcullis height', 'let gate = w.portcullis(gate_w, h * 0.88, wall_d, 0.0);', 'let gate = w.portcullis(gate_w, h * 0.9, wall_d, 0.0);'),
    ('segment key Map.set', '            map_set(&mut segs, key, seg);', '            segs.insert(0, (key, seg));'),
]


def main() -> int:
    orig = open(SRC, encoding='utf-8').read()
    killed = 0
    survived = []
    try:
        for name, old, new in MUTANTS:
            n = orig.count(old)
            if n != 1:
                print(f'BAD MUTANT {name}: pattern found {n}x')
                return 2
            open(SRC, 'w', encoding='utf-8').write(orig.replace(old, new))
            r = subprocess.run(
                ['cargo', 'test', '--locked', '--test', 'battle3d_siege_wall'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            )
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   {name} ({why})')
            else:
                survived.append(name)
                print(f'SURVIVED {name}')
    finally:
        open(SRC, 'w', encoding='utf-8').write(orig)
    print(f'KILLED {killed}/{len(MUTANTS)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
