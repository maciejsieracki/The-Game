#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 (Operator r1): mutanty poprawek D-PIN3-1..5.

Uzycie (z katalogu rust-port/engine, CARGO_TARGET_DIR ustawiony):
    python3 <ten plik> <katalog_wynikow> [pliki kandydatow...]
Dla kazdego mutanta: podmiana tekstu w zrodle -> `cargo test --release --test p6_k5loop_wiring_a_pin` (wektory)
+ `cargo test --release --lib pin3_timeline_tests` (testy osi czasu ciala)
-> opcjonalnie `kandydaci_z_pliku_na_zadanie` na podanych plikach (zgodnych kandydatow) -> przywrocenie zrodla.
Zrodla sa przywracane zawsze (try/finally); po przebiegu `git status` ma byc czysty.
"""
import os
import subprocess
import sys

LOOP = 'src/domain/siege_tactics_loop.rs'
SESSION = 'src/domain/siege_battle_session.rs'

MUTANTS = [
    ('M1 wieza: pole celu po marszu (bez osi krokow)', LOOP,
     'let (dq, dr) = self.unit_cell_at(tref, self.now).unwrap_or((',
     'let (dq, dr) = Some(self.unit_cell(tref).unwrap()).unwrap_or(('),
    ('M2 wieza: zwrot celu po marszu (bez osi zwrotow)', LOOP,
     'let target_facing = self.facing_at(tref, self.now);',
     'let target_facing = self.facing[tix][tref.idx];'),
    ('M3 krok z t0 == vNow zawsze wykonany (zegar po _raf)', LOOP,
     '    t0 < v_now || (t0 == v_now && synchr)\n}',
     '    t0 < v_now || (t0 == v_now && (synchr || true))\n}'),
    ('M4 krok z t0 == vNow nigdy wykonany (ignoruje synchr)', LOOP,
     '    t0 < v_now || (t0 == v_now && synchr)\n}',
     '    t0 < v_now || (t0 == v_now && (synchr && false))\n}'),
    ('M5 skutek ciala jako zwykly zegar (bez fazy _raf)', SESSION,
     'lp.body_done_raf = true;',
     'lp.body_done_raf = false;'),
    ('M6 rozbicie w marszu zwalnia pole koncowe', LOOP,
     'if !(self.pin_blow_timing && self.has_future_steps(unit)) {',
     'if !(self.pin_blow_timing && self.has_future_steps(unit) && false) {'),
    ('M7 zwrot z wczesniejszej chwili nadpisuje biezacy', LOOP,
     '            if later {',
     '            if later && false {'),
    ('M8 remis chwili: faza zegara i _raf bez rozroznienia', LOOP,
     '    (t0, u8::from(!synchr))\n}',
     '    (t0, u8::from(!synchr) * 0)\n}'),
]


def run(cmd, env=None):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, env=env)


def main():
    out_dir = sys.argv[1]
    cand = sys.argv[2:]
    os.makedirs(out_dir, exist_ok=True)
    for name, path, old, new in MUTANTS:
        src = open(path).read()
        assert src.count(old) == 1, (name, src.count(old))
        tag = name.split()[0]
        try:
            open(path, 'w').write(src.replace(old, new))
            r = run('cargo test --release --test p6_k5loop_wiring_a_pin 2>&1')
            log = r.stdout + r.stderr
            open(f'{out_dir}/{tag}.log', 'w').write(log)
            killed_vec = 'test result: FAILED' in log or r.returncode != 0
            r2 = run('cargo test --release --lib pin3_timeline_tests 2>&1')
            open(f'{out_dir}/{tag}-lib.log', 'w').write(r2.stdout + r2.stderr)
            killed_lib = r2.returncode != 0
            extra = []
            exe = None
            for line in log.splitlines():
                if 'Running tests/p6_k5loop_wiring_a_pin.rs' in line:
                    exe = line.split('(')[1].rstrip(')')
            for f in cand:
                step = '1' if '_1_' in os.path.basename(f) else '16'
                env = dict(os.environ, WIRING_A_VECTORS_FILE=f, WIRING_A_RUST_FF_STEP=step)
                rr = run(f'{exe} kandydaci_z_pliku --nocapture 2>&1', env)
                bad = [l.split(':')[0][9:] for l in rr.stdout.splitlines()
                       if l.startswith('KANDYDAT') and 'ZGODNY' not in l]
                extra.append((os.path.basename(f), bad))
            print(f'{name}: wektory {"ZABITY" if killed_vec else "przezyl"}; '
                  f'testy osi {"ZABITY" if killed_lib else "przezyl"}; '
                  + '; '.join(f'{f}: {len(b)} rozb. {b[:6]}' for f, b in extra), flush=True)
        finally:
            open(path, 'w').write(src)


if __name__ == '__main__':
    main()
