#!/usr/bin/env python3
"""R-RUSTPORT-P4-1H-RJ-REPIN-Q3 r1: mutacje z dispatchu (kazda musi dac FAIL testu wektorowego).

Uzycie (z katalogu rust-port/engine, CARGO_TARGET_DIR poza repo):
  python3 <ten plik>
Kazda mutacja: podmiana dokladnie jednego fragmentu zrodla, `cargo test --test p4_1h_rj_repin`,
przywrocenie pliku (takze przy bledzie). Wynik: EXIT testu i liste FAILED na stdout.
"""
import os
import subprocess

ROOT = os.getcwd()
PF = os.path.join(ROOT, 'src/domain/pathfinding.rs')
AF = os.path.join(ROOT, 'src/domain/army_follow_auto_merge.rs')
MUTS = [
    ('M1-R1-brak-trimu-planPathTurns', PF,
     """        let segment_path = trim_end_off_pass_through(
            truncate_path_to_budget(&path, budget, map, cost_fn),
            path.len(),
            pass_through,
        );""",
     """        let _ = pass_through;
        let segment_path = truncate_path_to_budget(&path, budget, map, cost_fn);"""),
    ('M2-R2-brak-trimu-shouldStopAtObstacle', PF,
     """        let truncated = trim_end_off_pass_through(
            truncate_path_to_budget(&path, movement_budget, map, cost_fn),
            path.len(),
            pass_through,
        );""",
     """        let _ = pass_through;
        let truncated = truncate_path_to_budget(&path, movement_budget, map, cost_fn);"""),
    ('M3-R3-pusty-segment-bez-obstacle', PF,
     """            if only_own_in_reach {
                return march_failure(MarchStopReason::Obstacle, OWN_UNIT_IN_REACH_DETAIL);
            }""",
     """            let _ = only_own_in_reach;"""),
    ('M4-R4-brak-blokady-oblezenia-dla-celu', PF,
     """                if siege.is_some_and(|blocks| blocks(unit, nq, nr)) {
                    continue;
                }
                if n_key == dest {""",
     """                if n_key != dest && siege.is_some_and(|blocks| blocks(unit, nq, nr)) {
                    continue;
                }
                if n_key == dest {"""),
    ('M5-brak-trim_path_to_stack_room', AF,
     """    while let Some(last) = out.last() {
        let (q, r) = coords(last);""",
     """    #[allow(clippy::never_loop)]
    while let Some(last) = out.last() {
        break;
        let (q, r) = coords(last);"""),
]
env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
for name, path, old, new in MUTS:
    src = open(path, encoding='utf8').read()
    assert src.count(old) == 1, name
    open(path, 'w', encoding='utf8').write(src.replace(old, new))
    try:
        p = subprocess.run(['cargo', 'test', '--test', 'p4_1h_rj_repin'], cwd=ROOT, env=env,
                           capture_output=True, text=True)
        out = p.stdout + p.stderr
        failed = [l for l in out.splitlines() if l.startswith('test ') and l.endswith('FAILED')]
        summary = [l for l in out.splitlines() if l.startswith('test result')]
        verdict = 'FAIL(oczekiwany)' if p.returncode != 0 and failed else 'NIE-WYKRYTA'
        print(f'{name}: EXIT {p.returncode} {verdict} {summary} {failed}', flush=True)
    finally:
        open(path, 'w', encoding='utf8').write(src)
