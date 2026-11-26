#!/usr/bin/env python3
"""R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1 (Operator r1): mutanty kolejnosci trafienia wiezy.

Kazdy mutant = jedna podmiana tekstu w kodzie produkcyjnym silnika (musi wystapic dokladnie raz), potem DWA niezalezne
pomiary: (LIB) testy jednostkowe wiezy w `siege_tactics_loop.rs` (`cargo test --lib wieza_`) i (WEKTOR) test wektorow
pinu `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt` (liczba rozbieznych wektorow z komunikatu testu),
na koniec przywrocenie pliku (`git status` czysty po przebiegu). Mutant ZABITY = co najmniej jeden pomiar z EXIT != 0.

Uzycie (z korzenia repo, CARGO_TARGET_DIR poza repo):
  CARGO_TARGET_DIR=... python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1/01-operator-r1-mutanty.py [ID...]
"""
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
ENGINE = os.path.join(ROOT, 'rust-port', 'engine')
LOOP = 'rust-port/engine/src/domain/siege_tactics_loop.rs'
CLOCK = 'rust-port/engine/src/domain/siege_tactics_clock.rs'

IN_FLIGHT = '            .push((target, row, clock.v_now + TOWER_FLY_MS));'
HIT_SCHED = 'match clock.schedule(TOWER_FLY_MS, LoopTimer::TowerHit(target), planning) {'
DRAIN_TIE = 't.due < bt.due || (t.due == bt.due && t.id < bt.id)'
CLOCK_DUE = 'let due = self.v_now + js_max(0.0, ms);'
HIT_READER = ('        // FRAME-QUANT-Q1 (D-FQ-2): `_singleBlow` wieży czyta pole i zwrot celu w kolejności `due` zegarów klatki.\n'
              '        self.env.body.set_reader_due(due);')
GRID_DUE = ('let due = { let fr = self.scaled_wall_delta(16.0); let m = js_max(0.0, ms); '
            'if fr > 0.0 && m > 0.0 { self.v_now + (m / fr).ceil() * fr } else { self.v_now + m } };')

MUTANTS = {
    # E-2 Evaluatora #400: wpis `tower_in_flight` z `due` z siatki klatki (= `land_at`) zamiast nominalu.
    'EV6': (LOOP, IN_FLIGHT, '            .push((target, row, land_at));', 'tower_in_flight: due z siatki (land_at)'),
    'Q1': (LOOP, IN_FLIGHT, '            .push((target, row, clock.v_now + TOWER_FLY_MS + ff_step_ms(clock)));',
           'tower_in_flight: due o klatke pozniej'),
    'Q2': (LOOP, HIT_SCHED,
           'match clock.schedule(frame_sched(ff_step_ms(clock), TOWER_FLY_MS), LoopTimer::TowerHit(target), planning) {',
           'zegar trafienia wiezy z due z siatki (remis z innymi zegarami klatki po id)'),
    'Q3': (CLOCK, DRAIN_TIE, 't.due < bt.due || (t.due == bt.due && t.id > bt.id)',
           '_drainTimers: remis due odwrocony (pozniej zaplanowany pierwszy)'),
    'Q4': (CLOCK, DRAIN_TIE, 't.id < bt.id', '_drainTimers: kolejnosc zaplanowania zamiast due (FIFO w klatce)'),
    'Q5': (CLOCK, CLOCK_DUE, GRID_DUE, 'due WSZYSTKICH zegarow z siatki klatki (ceil do kroku)'),
    'Q6': (CLOCK, DRAIN_TIE, 't.due > bt.due || (t.due == bt.due && t.id < bt.id)',
           '_drainTimers: malejaco po due (inny zegar klatki przed trafieniem wiezy)'),
    'Q7': (LOOP, HIT_READER,
           HIT_READER.replace('set_reader_due(due)', 'set_reader_due(f64::MIN)'),
           'trafienie wiezy czyta os ciala bez due (wszystkie wpisy tej klatki niewykonane)'),
    'Q8': (LOOP, HIT_READER,
           HIT_READER.replace('set_reader_due(due)', 'set_reader_due(f64::MAX)'),
           'trafienie wiezy czyta os ciala z due = +inf (wszystkie wpisy tej klatki wykonane)'),
}

ENV = dict(os.environ, CARGO_INCREMENTAL='0', CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')


def run(args):
    p = subprocess.run(['cargo', 'test', *args], cwd=ENGINE, env=ENV, capture_output=True, text=True, timeout=1800)
    return p.returncode, p.stdout + p.stderr


def main():
    ids = sys.argv[1:] or list(MUTANTS)
    print('ID | mutant | LIB (EXIT) | WEKTOR (EXIT, rozbiezne wektory) | wynik')
    for mid in ids:
        path, old, new, desc = MUTANTS[mid]
        full = os.path.join(ROOT, path)
        src = open(full, encoding='utf-8').read()
        n = src.count(old)
        if n != 1:
            print(f'{mid} | {desc} | BLAD: tekst wystepuje {n} razy')
            continue
        try:
            open(full, 'w', encoding='utf-8').write(src.replace(old, new))
            lib, _ = run(['--lib', 'wieza_'])
            vec, out = run(['--test', 'p6_k5loop_wiring_a_pin', 'kolejnosc_trafienia'])
            nvec = len(re.findall(r'^\s+"to_', out, re.M))
            build_err = 'error[' in out and 'could not compile' in out
            verdict = 'ZABITY' if (lib != 0 or vec != 0) else 'PRZEZYL'
            if build_err:
                verdict = 'BLAD KOMPILACJI'
            extra = ''
            # `MUT_FULL=1`: dla mutanta, ktory przezyl, dodatkowo CALE testy lib i CALY plik testow wektorow pinu
            # K5LOOP-WIRING-A (wszystkie wektory: pelna bitwa, predkosc, zmiana predkosci, kolejnosc wiezy).
            if os.environ.get('MUT_FULL') and verdict == 'PRZEZYL':
                full_lib, _ = run(['--lib'])
                full_pin, _ = run(['--test', 'p6_k5loop_wiring_a_pin'])
                extra = f' | pelne: lib {full_lib}, p6_k5loop_wiring_a_pin {full_pin}'
                if full_lib != 0 or full_pin != 0:
                    verdict = 'ZABITY (pelne testy)'
            print(f'{mid} | {desc} | {lib} | {vec}, {nvec} | {verdict}{extra}', flush=True)
        finally:
            open(full, 'w', encoding='utf-8').write(src)
    st = subprocess.run(['git', 'status', '--porcelain', '--', LOOP, CLOCK], cwd=ROOT, capture_output=True, text=True)
    print('git status po przebiegu (pliki mutowane):', repr(st.stdout))


if __name__ == '__main__':
    main()
