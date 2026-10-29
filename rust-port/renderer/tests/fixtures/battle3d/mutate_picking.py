#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5 (part 5, picking and camera).

Applies each mutation below to `src/battle/view.rs` or `src/battle/picking.rs`
(one at a time), runs `cargo test --locked --lib battle::`, then `cargo test
--locked --test battle3d_picking`, and expects a FAIL (mutant killed). The
source file is restored after every mutant (also on error). Run from
`rust-port/renderer` with CARGO_TARGET_DIR set:

    CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=<scratch> python3 tests/fixtures/battle3d/mutate_picking.py

`ONLY=<substring>` limits the run to mutants whose name contains it;
`RANGE=a:b` runs `MUTANTS[a:b]` (batches for the foreground time limit).
Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived,
2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

VIEW = 'src/battle/view.rs'
PICK = 'src/battle/picking.rs'

MUTANTS = [
    # ---- camera control (view.rs)
    (VIEW, 'wheel rate', 'pub const WHEEL_ZOOM_RATE: f64 = 0.0012;', 'pub const WHEEL_ZOOM_RATE: f64 = 0.0011;'),
    (VIEW, 'key zoom in direction', 'self.set_zoom_target(self.camera.dist_target * KEY_ZOOM_STEP);', 'self.set_zoom_target(self.camera.dist_target / KEY_ZOOM_STEP);'),
    (VIEW, 'key Add ignored', '"+" | "=" | "Add" =>', '"+" | "=" =>'),
    (VIEW, 'zoom ease', 'pub const ZOOM_EASE: f64 = 0.18;', 'pub const ZOOM_EASE: f64 = 0.2;'),
    (VIEW, 'zoom snap', 'pub const ZOOM_SNAP: f64 = 0.01;', 'pub const ZOOM_SNAP: f64 = 0.02;'),
    (VIEW, 'snap without apply', '                self.camera.dist = self.camera.dist_target;\n                self.apply_camera();', '                self.camera.dist = self.camera.dist_target;'),
    (VIEW, 'zoom target unclamped', 'c.dist_target = js_max(c.dist_min, js_min(c.dist_max, dist));', 'c.dist_target = js_max(c.dist_min, dist);'),
    (VIEW, 'lookAt not stale', 'Mat4::compose(self.camera.position, previous, Vec3::new(1.0, 1.0, 1.0));', 'Mat4::compose(self.camera.position, self.camera.quaternion, Vec3::new(1.0, 1.0, 1.0));'),
    (VIEW, 'sync height ignored', 'if js_round(sx) != w || js_round(sy) != h {', 'if js_round(sx) != w {'),
    (VIEW, 'sync keeps renderer size', '            self.renderer_size = (w, h);\n', ''),
    (VIEW, 'clamp margin k', 'pub const CLAMP_MARGIN_K: f64 = 0.28;', 'pub const CLAMP_MARGIN_K: f64 = 0.25;'),
    (VIEW, 'clamp margin floor', 'pub const CLAMP_MARGIN_MIN: f64 = 2.0;', 'pub const CLAMP_MARGIN_MIN: f64 = 1.5;'),
    (VIEW, 'clamp rows', 'let max_z = f64::from(BF_ROWS - 1) * TILE_S - margin;', 'let max_z = f64::from(BF_COLS - 1) * TILE_S - margin;'),
    (VIEW, 'pan key z sign', 'self.camera.target.z += dy * world_per_px * PAN_KEY_STEP_PX;', 'self.camera.target.z -= dy * world_per_px * PAN_KEY_STEP_PX;'),
    (VIEW, 'pan key W is down', '"ArrowUp" | "KeyW" => k.up = down,\n            "ArrowDown" | "KeyS" => k.down = down,', '"ArrowUp" => k.up = down,\n            "ArrowDown" | "KeyS" | "KeyW" => k.down = down,'),
    (VIEW, 'pan key editable ignored', '        if editable {\n            return false;\n        }\n        let k = &mut self.pan_keys;', '        let k = &mut self.pan_keys;'),
    (VIEW, 'pan key step', 'pub const PAN_KEY_STEP_PX: f64 = 14.0;', 'pub const PAN_KEY_STEP_PX: f64 = 12.0;'),
    (VIEW, 'drag pan z sign', 'self.camera.target.z -= dy * world_per_px;', 'self.camera.target.z += dy * world_per_px;'),
    (VIEW, 'drag pan unclamped', '        self.camera.target.z -= dy * world_per_px;\n        self.clamp_cam_target();', '        self.camera.target.z -= dy * world_per_px;'),
    (VIEW, 'minimap floor', 'col_min: js_max(0.0, (col_center - col_half).floor()),', 'col_min: js_max(0.0, (col_center - col_half).ceil()),'),
    (VIEW, 'minimap height floor', 'let h = js_max(1.0, canvas.client_height);\n        let w = js_max(1.0, canvas.client_width);', 'let h = js_max(0.5, canvas.client_height);\n        let w = js_max(1.0, canvas.client_width);'),
    (VIEW, 'ray stale camera', '        let (nx, ny) = client_rect_to_ndc(client_x, client_y, &canvas.rect)?;\n        self.update_matrix_world();', '        let (nx, ny) = client_rect_to_ndc(client_x, client_y, &canvas.rect)?;'),
    (VIEW, 'ray unproject depth', 'let direction = Vec3::new(nx, ny, 0.5)', 'let direction = Vec3::new(nx, ny, 0.25)'),
    (VIEW, 'screen y flip', 'Some((((v.x + 1.0) / 2.0) * w, ((-v.y + 1.0) / 2.0) * h))', 'Some((((v.x + 1.0) / 2.0) * w, ((v.y + 1.0) / 2.0) * h))'),
    (VIEW, 'client px left', 'r.left + (v.x * 0.5 + 0.5) * r.width,', '(v.x * 0.5 + 0.5) * r.width,'),
    (VIEW, 'pan left button in deploy', '        if button == 0 && deploy_phase {\n            return false;\n        }\n', ''),
    # ---- raycasting (picking.rs)
    (PICK, 'line threshold', 'pub const LINE_THRESHOLD: f64 = 1.0;', 'pub const LINE_THRESHOLD: f64 = 0.5;'),
    (PICK, 'line sphere not grown', '    sphere.radius += LINE_THRESHOLD;\n', ''),
    (PICK, 'segment extent', 'let seg_extent = v0.distance_to(v1) * 0.5;', 'let seg_extent = v0.distance_to(v1) * 0.6;'),
    (PICK, 'line hit point on ray', '            point: on_seg.apply_matrix4(world),', '            point: on_ray_world,'),
    (PICK, 'sprite second triangle', '    let hit = ray.intersect_triangle(va, vb, vc, false).or_else(|| {\n        let vb2 = vertex(-0.5, 0.5);\n        ray.intersect_triangle(va, vc, vb2, false)\n    });', '    let hit = ray.intersect_triangle(va, vb, vc, false);'),
    (PICK, 'sprite unscaled', 'let ax = (x - 0.5 + 0.5) * scale.x;', 'let ax = x - 0.5 + 0.5;'),
    (PICK, 'front faces double', 'Side::Front => local.intersect_triangle(va, vb, vc, true),', 'Side::Front => local.intersect_triangle(va, vb, vc, false),'),
    (PICK, 'back side winding', 'Side::Back => local.intersect_triangle(vc, vb, va, true),', 'Side::Back => local.intersect_triangle(va, vb, vc, true),'),
    (PICK, 'groups ignored', '    if material_array {\n        for g in &p.groups {', '    if false {\n        for g in &p.groups {'),
    (PICK, 'sort descending', '        a.distance\n            .partial_cmp(&b.distance)', '        b.distance\n            .partial_cmp(&a.distance)'),
    (PICK, 'not recursive', '            for n in ps.fs.scene.traverse_from(o) {', '            for n in [o] {'),
    (PICK, 'instanced last instance skipped', '        for i in 0..m.count {\n            let mut a = [0.0f32; 16];\n            a.copy_from_slice(&m.matrices[i * 16..i * 16 + 16]);\n            let iw', '        for i in 0..m.count.saturating_sub(1) {\n            let mut a = [0.0f32; 16];\n            a.copy_from_slice(&m.matrices[i * 16..i * 16 + 16]);\n            let iw'),
    # ---- ground
    (PICK, 'ground min up', 'pub const GROUND_MIN_UP: f64 = 0.3;', 'pub const GROUND_MIN_UP: f64 = 0.5;'),
    (PICK, 'ground height weight', 'pub const GROUND_HEIGHT_WEIGHT: f64 = 10.0;', 'pub const GROUND_HEIGHT_WEIGHT: f64 = 5.0;'),
    (PICK, 'ground first max', '        if score > best_score {', '        if score >= best_score {'),
    (PICK, 'plane iterations', 'pub const PLANE_ITERATIONS: usize = 4;', 'pub const PLANE_ITERATIONS: usize = 1;'),
    (PICK, 'tile floor', '    let col = super::siege_wall::js_round(x / TILE_S);', '    let col = (x / TILE_S).floor();'),
    (PICK, 'combine higher wins', '            if mesh_y > plane_y {\n                Some(m)', '            if mesh_y < plane_y {\n                Some(m)'),
    (PICK, 'combine tie to plane', '            } else {\n                Some(m)\n            }\n        }\n        (m, p) => m.or(p),', '            } else {\n                Some(p)\n            }\n        }\n        (m, p) => m.or(p),'),
    (PICK, 'clamp rows', 'col >= f64::from(BF_COLS) || row < 0.0 || row >= f64::from(BF_ROWS)', 'col >= f64::from(BF_COLS) || row < 0.0 || row >= f64::from(BF_COLS)'),
    # ---- units and clicks
    (PICK, 'unit K2 check', '                Some(_) => None,\n            };', '                Some(_) => Some(i),\n            };'),
    (PICK, 'unit occupancy liveness', '            if units[i].live() {\n                return Some(i);', '            if true {\n                return Some(i);'),
    (PICK, 'battle click filters removed', '    let alive = |u: &PickUnit<\'_>| !u.dead && !u.fading_out;', '    let alive = |u: &PickUnit<\'_>| !u.dead && !u.fading_out && !u.removed;'),
    (PICK, 'battle enemy attack', '        if selected_count > 0 {\n            return BattleClick::Attack(i);\n        }\n    }\n    let Some', '    }\n    let Some'),
    (PICK, 'deploy occupancy side', '            if ctx.units[i].unit.spawn.side == ctx.player {\n                return DeployClick::Pick(i);', '            if ctx.units[i].unit.spawn.side == ctx.player || true {\n                return DeployClick::Pick(i);'),
    (PICK, 'deploy feedback order', '        let feedback = if !in_zone {\n            Some(FEEDBACK_OUT_OF_ZONE)\n        } else if !passable {', '        let feedback = if !passable {\n            Some(FEEDBACK_OUT_OF_ZONE)\n        } else if !in_zone {'),
    (PICK, 'deploy K2 check', '                    if tile.is_some_and(|(c, r)| u.col == c && u.row == r) {\n                        return DeployClick::Pick(i);', '                    if tile.is_some() || u.col >= 0 {\n                        return DeployClick::Pick(i);'),
    (PICK, 'pick early return', '        if sel.selected.len() == 1 && sel.has(&id) {\n            return false;', '        if sel.selected.len() == 9 && sel.has(&id) {\n            return false;'),
    (PICK, 'pick additive keeps deploySelected', '            if sel.deploy_selected.as_deref() == Some(id.as_str()) {\n                sel.deploy_selected = None;\n            }', ''),
    (PICK, 'pick group ring color', '            refresh_unit_ring_color(&mut fs.scene, rings, &id, ru.in_group());', '            refresh_unit_ring_color(&mut fs.scene, rings, &id, false);'),
    (PICK, 'primary = last', '        .selected\n        .iter()\n        .find(|id| {', '        .selected\n        .iter()\n        .rev()\n        .find(|id| {'),
    (PICK, 'box keeps routed', '        if u.dead || u.fading_out || u.removed || u.routed {', '        if u.dead || u.fading_out || u.removed {'),
    (PICK, 'box stale camera', '    view.update_matrix_world();\n    let mut found = Vec::new();', '    let mut found = Vec::new();'),
    (PICK, 'bars skip dead', '        if !skip {\n            scene.nodes[group].visible = *bars_visible;', '        if true {\n            scene.nodes[group].visible = *bars_visible;'),
    (PICK, 'bars ignore modifier', '    if editable || modifier {\n        return false;\n    }\n    *bars_visible', '    if editable {\n        return false;\n    }\n    *bars_visible'),
    (PICK, 'queue only round', 'ctrl || shift || (awaiting_orders && round_no < 1.0)', 'ctrl || shift || (awaiting_orders && round_no < 2.0)'),
]


def main() -> int:
    only = os.environ.get('ONLY')
    rng = os.environ.get('RANGE')
    sel = MUTANTS
    if rng:
        a, b = rng.split(':')
        sel = MUTANTS[int(a or 0):int(b) if b else None]
    origs = {f: open(f, encoding='utf-8').read() for f in (VIEW, PICK)}
    killed, survived = 0, []
    try:
        for path, name, old, new in sel:
            if only and only not in name:
                continue
            orig = origs[path]
            n = orig.count(old)
            if n != 1:
                print(f'BAD MUTANT {name}: pattern found {n}x')
                return 2
            open(path, 'w', encoding='utf-8').write(orig.replace(old, new))
            r = subprocess.run(
                ['cargo', 'test', '--locked', '--lib', 'battle::'],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            )
            if r.returncode == 0:
                r = subprocess.run(
                    ['cargo', 'test', '--locked', '--test', 'battle3d_picking'],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                )
            open(path, 'w', encoding='utf-8').write(orig)
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   {name} ({why})', flush=True)
            else:
                survived.append(name)
                print(f'SURVIVED {name}', flush=True)
    finally:
        for f, s in origs.items():
            open(f, 'w', encoding='utf-8').write(s)
    print(f'KILLED {killed}/{killed + len(survived)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
