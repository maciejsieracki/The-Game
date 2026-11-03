#!/usr/bin/env python3
"""Mutation run for R-RUSTPORT-REPIN-3D-A-Q1, batch A1 (order queue, attack-move,
immediate removal of killed units).

Applies each mutant below (one at a time; a mutant may edit several spots) to
`src/battle/orders.rs` / `src/battle/units.rs`, runs `cargo test --locked --lib
battle::orders`, then `cargo test --locked --test repin3d_a1`, and expects a FAIL
(mutant killed). Every control branch of the A1 code has a mutant. Sources are
restored after every mutant (also on error). Run from `rust-port/renderer`:

    CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 \
        python3 tests/repin3d_fixtures/mutate_a1.py

`ONLY=<substring>` limits the run to mutants whose name contains it.
Prints one line per mutant and `KILLED k/n`; exit code 1 if any survived,
2 if a pattern is not found exactly once.
"""
import os
import subprocess
import sys

O = 'src/battle/orders.rs'
U = 'src/battle/units.rs'

MUTANTS = [
    # QueuedOrders (JS Set)
    ('set add dedup', [(O, '        if !self.has(id) {\n            self.ids.push', '        if true {\n            self.ids.push')]),
    ('set delete result', [(O, '                self.ids.remove(i);\n                true', '                self.ids.remove(i);\n                false')]),
    # TurnCandidate::can_act
    ('can_act dead', [(O, '!self.dead && !self.fading_out', 'true && !self.fading_out')]),
    ('can_act fadingOut', [(O, '!self.dead && !self.fading_out', '!self.dead && true')]),
    ('can_act removed', [(O, '&& !self.removed &&', '&& true &&')]),
    ('can_act acted', [(O, '&& !self.acted', '&& true')]),
    # next_activation / consume_on_activation
    ('scan ignores manual', [(O, '        if manual && queued.delete(&cand.id) {', '        if queued.delete(&cand.id) {')]),
    ('scan no refresh flag', [(O, '            refresh = true;\n        }\n    }', '            refresh = false;\n        }\n    }')]),
    ('scan no clear', [(O, '        if manual && queued.delete(&cand.id) {', '        if manual && queued.has(&cand.id) {')]),
    ('scan index step', [(O, '        *turn_idx += 1;\n        let cand', '        *turn_idx += 2;\n        let cand')]),
    ('scan stops at index', [(O, '                unit: Some(i),', '                unit: Some(i + 1),')]),
    ('consume ignores manual', [(O, '    manual && queued.delete(id)\n', '    queued.delete(id)\n')]),
    ('consume no delete', [(O, '    manual && queued.delete(id)\n', '    manual && queued.has(id)\n')]),
    # issue_attack_move
    ('issue empty selection', [(O, '    if ids.is_empty() {\n        return None;\n    }\n', '')]),
    ('issue converts dead', [(O, '        if u.dead || u.removed || u.routed {', '        if u.removed || u.routed {')]),
    ('issue converts removed', [(O, '        if u.dead || u.removed || u.routed {', '        if u.dead || u.routed {')]),
    ('issue converts routed', [(O, '        if u.dead || u.removed || u.routed {', '        if u.dead || u.removed {')]),
    ('issue waypoint ignores move', [(O, '            PlayerOrder::Move { col: c, row: r } => (c, r),', '            PlayerOrder::Move { .. } => (col, row),')]),
    ('issue waypoint from attack', [(O, '            _ => (col, row),\n        };', '            _ => (u.col, u.row),\n        };')]),
    ('issue queue-only not queued', [(O, '        if queue_only {\n            queued.add(id);', '        if queue_only {\n            queued.delete(id);')]),
    ('issue immediate keeps queue', [(O, '        } else {\n            queued.delete(id);\n        }', '        } else {\n        }')]),
    ('issue feedback swap', [(O, '            "Dyspozycja ATAKUJ-MARSZEM"\n        } else {\n            "ATAKUJ-MARSZEM"', '            "ATAKUJ-MARSZEM"\n        } else {\n            "Dyspozycja ATAKUJ-MARSZEM"')]),
    ('issue execute flag', [(O, '        execute_now: !queue_only,', '        execute_now: queue_only,')]),
    ('find by id', [(O, 'roster.iter_mut().find(|u| u.id == id)', 'roster.iter_mut().find(|u| u.id != id)')]),
    # cancel_attack_move_selected
    ('cancel any order', [(O, '        if !matches!(u.order, PlayerOrder::AttackMove { .. }) {', '        if false {')]),
    ('cancel keeps queue', [(O, '        u.order = PlayerOrder::None;\n        queued.delete(id);', '        u.order = PlayerOrder::None;')]),
    ('cancel keeps order', [(O, '        u.order = PlayerOrder::None;\n        queued.delete(id);', '        queued.delete(id);')]),
    # refresh_queued_order_visuals (units.rs)
    ('attackMove arrow colour', [(U, 'let is_attack = matches!(ru.order, PlayerOrder::AttackMove { .. });', 'let is_attack = false;')]),
    ('attackMove no arrow', [
        (U, 'PlayerOrder::Move { col, row } | PlayerOrder::AttackMove { col, row } => {', 'PlayerOrder::Move { col, row } => {'),
        (U, '            PlayerOrder::None => {}', '            PlayerOrder::None | PlayerOrder::AttackMove { .. } => {}'),
    ]),
    ('attackMove arrow not queued', [(U, 'let a = make_order_arrow(scene, unit_world_pos(grid, ru), to, is_attack, is_queued);', 'let a = make_order_arrow(scene, unit_world_pos(grid, ru), to, is_attack, false);')]),
    # kill_unit (units.rs)
    ('kill ignores fadingOut', [(U, '    if fading_out || dead || u.removed {', '    if dead || u.removed {')]),
    ('kill ignores dead', [(U, '    if fading_out || dead || u.removed {', '    if fading_out || u.removed {')]),
    ('kill ignores removed', [(U, '    if fading_out || dead || u.removed {', '    if fading_out || dead {')]),
    ('kill keeps model', [(U, '    remove_unit_from_scene(scene, u);\n    true\n}', '    true\n}')]),
    ('kill result', [(U, '    remove_unit_from_scene(scene, u);\n    true\n}', '    remove_unit_from_scene(scene, u);\n    false\n}')]),
]


def run(args: list) -> subprocess.CompletedProcess:
    return subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def main() -> int:
    only = os.environ.get('ONLY')
    orig = {p: open(p, encoding='utf-8').read() for p in (O, U)}
    killed, survived = 0, []
    try:
        for name, edits in MUTANTS:
            if only and only not in name:
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
            r = run(['cargo', 'test', '--locked', '--lib', 'battle::orders'])
            if r.returncode == 0:
                r = run(['cargo', 'test', '--locked', '--test', 'repin3d_a1'])
            if r.returncode != 0:
                killed += 1
                why = 'compile error' if 'error[' in r.stdout else 'test failed'
                print(f'KILLED   {name} ({why})', flush=True)
            else:
                survived.append(name)
                print(f'SURVIVED {name}', flush=True)
            for p, t in orig.items():
                open(p, 'w', encoding='utf-8').write(t)
    finally:
        for p, t in orig.items():
            open(p, 'w', encoding='utf-8').write(t)
    print(f'KILLED {killed}/{killed + len(survived)}')
    return 0 if not survived else 1


if __name__ == '__main__':
    sys.exit(main())
