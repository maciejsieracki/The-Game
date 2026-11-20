#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 - obrona r1: mutanty Evaluatora E2, E5-E8 i Operatora Q19, Q20, Q22
na nowych testach jednostkowych (pin3_timeline_tests, tower_target_tests). Uruchamiane z katalogu rust-port/engine;
plik źródłowy przywracany po każdym mutancie. Wynik: ZABITY gdy `cargo test --lib -- siege_tactics_loop::` != 0.
Użycie: CARGO_TARGET_DIR=... python3 02a-obrona-mutanty.py [ID...]"""
import os
import subprocess
import sys

F = 'src/domain/siege_tactics_loop.rs'
DRAIN = """        let fired = clock.drain_timers(|c, t| {
            if !self.defer_to_raf(t) {
                self.fire(c, t);
            }
        });
        // PIN3-DIVERGENCE-Q1 (D-PIN3-3): faza kroków animacji klatki (`requestAnimationFrame`) po `_drainTimers`.
        while !self.raf_pending.is_empty() {
            let u = self.raf_pending.remove(0);
            self.fire(clock, LoopTimer::BodyDone(u));
        }
"""
DRAIN_SWAP = """        while !self.raf_pending.is_empty() {
            let u = self.raf_pending.remove(0);
            self.fire(clock, LoopTimer::BodyDone(u));
        }
        let fired = clock.drain_timers(|c, t| {
            if !self.defer_to_raf(t) {
                self.fire(c, t);
            }
        });
"""
MUTANTS = [
    ('E2', DRAIN, DRAIN_SWAP, 'step_realtime: faza _raf PRZED drain_timers (prawdziwa zamiana faz w czasie rzeczywistym)'),
    ('E5', '        if self.moves > 0 {\n            let _ = self\n',
     '        if false && self.moves > 0 {\n            let _ = self\n',
     'ProdSiegeWalk::do_move: krok po przerwie bez gap_after (bez nominalnego due)'),
    ('E6', '        let reader = self.reader_due;\n', '        let reader = f64::MIN;\n',
     'has_future_steps: czytający zawsze f64::MIN'),
    ('E7', '        (cell, self.facing_at(tref, self.now, self.reader_due))',
     '        (cell, self.facing_at(tref, self.now, f64::MIN))',
     'trafienie wieży: zwrot celu z f64::MIN zamiast reader_due'),
    ('E8', '        self.reader_due = f64::MIN;\n        self.gap_due = None;\n',
     '        self.reader_due = f64::MIN;\n',
     'set_now nie zeruje gap_due'),
    ('Q19', '        self.env.body.set_reader_due(due);\n        let picked',
     '        self.env.body.set_reader_due(f64::MIN);\n        let picked',
     'wystrzał wieży czyta oś jak ciało'),
    ('Q20', '        self.env.body.set_reader_due(due);\n        if let Some(row) = row {',
     '        self.env.body.set_reader_due(f64::MIN);\n        if let Some(row) = row {',
     'trafienie wieży czyta oś jak ciało'),
    ('Q22', '            .push((target, row, clock.v_now + TOWER_FLY_MS));',
     '            .push((target, row, clock.v_now));',
     'due trafienia wieży = chwila wystrzału'),
]


def main():
    want = set(sys.argv[1:])
    src = open(F, encoding='utf-8').read()
    env = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
    try:
        for mid, old, new, desc in MUTANTS:
            if want and mid not in want:
                continue
            assert src.count(old) == 1, (mid, src.count(old))
            open(F, 'w', encoding='utf-8').write(src.replace(old, new))
            r = subprocess.run(['cargo', 'test', '--lib', '--', 'siege_tactics_loop::'], env=env,
                               capture_output=True, text=True)
            out = r.stdout + r.stderr
            fails = [ln for ln in out.splitlines() if ln.startswith('test ') and ln.endswith('FAILED')]
            verdict = 'ZABITY' if r.returncode != 0 else 'PRZEZYL'
            note = '; '.join(fails) if fails else ('blad kompilacji' if 'error[' in out else '-')
            print(f'{mid}\t{verdict}\t{desc}\t{note}', flush=True)
    finally:
        open(F, 'w', encoding='utf-8').write(src)


if __name__ == '__main__':
    main()
