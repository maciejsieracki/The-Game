#!/usr/bin/env python3
"""R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 (Operator r1): mutanty B03/B06/B07 (długi FC WIRING-A r2 §4) i D-PIN2-1
(poprawka `complete`: morale), sprawdzane testem wektorów pinu `cargo test --release --test p6_k5loop_wiring_a_pin`.
ZABITY = test FAIL (albo błąd kompilacji); plik przywracany po każdym mutancie.

Tryby (z rust-port/engine, CARGO_TARGET_DIR ustawione):
  python3 <ten plik>                 -- każdy mutant: test wektorów pinu (werdykt ZABITY / PRZEŻYŁ)
  BIN_DIR=<katalog> python3 <plik>   -- zamiast testu: binarka testu każdego mutanta (i bazy) do <katalog>/<ID>
                                        (szukanie kandydatów: `WIRING_A_VECTORS_FILE=... <binarka> kandydaci`)
  ONLY=B03,B06 ...                   -- tylko wybrane mutanty
"""
import json
import os
import shutil
import subprocess
import sys

L = 'src/domain/siege_tactics_loop.rs'
ONLY = os.environ.get('ONLY')
BIN_DIR = os.environ.get('BIN_DIR')
MUTANTS = [
    (L, 'B03 trafienie strzału na końcu (FLY+GAP)', 'dur = at + RANGED_FLY_MS;', 'dur = at + RANGED_FLY_MS + RANGED_GAP_MS;'),
    (L, 'B06 zagrożenia strzelców bez _applyTerrainRange',
     '                self.refresh_terrain_range(opposite(unit.side), i);\n', ''),
    (L, 'B07 zejście z korony bez _applyTerrainRange',
     '            self.refresh_terrain_range(BattleSide::Defender, idx);\n', ''),
    (L, 'P01 complete: morale bezwarunkowo z start (stan sprzed D-PIN2-1)',
     '            if activation_changed && !clock_changed {\n                c.morale = pend.morale;\n            }',
     '            let _ = clock_changed;\n            c.morale = pend.morale;'),
    (L, 'P02 complete: morale nigdy z aktywacji (okrążenie gubione)',
     '            if activation_changed && !clock_changed {\n                c.morale = pend.morale;\n            }',
     '            let _ = (activation_changed, clock_changed);'),
]
CMD = ['cargo', 'test', '--release', '--test', 'p6_k5loop_wiring_a_pin']


def build_bin(tag):
    out = subprocess.run(CMD + ['--no-run', '--message-format=json'], capture_output=True, text=True)
    if out.returncode != 0:
        return None
    exe = None
    for line in out.stdout.splitlines():
        try:
            m = json.loads(line)
        except json.JSONDecodeError:
            continue
        if m.get('reason') == 'compiler-artifact' and m.get('executable') and m['target']['name'] == 'p6_k5loop_wiring_a_pin':
            exe = m['executable']
    if exe is None:
        return None
    os.makedirs(BIN_DIR, exist_ok=True)
    dst = os.path.join(BIN_DIR, tag)
    shutil.copy2(exe, dst)
    return dst


def main():
    srcs = {f: open(f, encoding='utf8').read() for f in {m[0] for m in MUTANTS}}
    results = []
    if BIN_DIR:
        print('BAZA', build_bin('BAZA'), flush=True)
    else:
        base = subprocess.run(CMD, capture_output=True, text=True)
        print('BAZA EXIT', base.returncode, flush=True)
        if base.returncode != 0:
            print(base.stdout[-3000:], base.stderr[-3000:])
            sys.exit(2)
    try:
        for f, name, old, new in MUTANTS:
            if ONLY and not any(name.startswith(o) for o in ONLY.split(',')):
                continue
            src = srcs[f]
            if src.count(old) != 1:
                results.append((name, f'BRAK WZORCA ({src.count(old)})'))
                print(name, results[-1][1], flush=True)
                continue
            open(f, 'w', encoding='utf8').write(src.replace(old, new))
            try:
                if BIN_DIR:
                    verdict = f'BINARKA {build_bin(name.split()[0])}'
                else:
                    r = subprocess.run(CMD, capture_output=True, text=True)
                    if r.returncode == 0:
                        verdict = 'PRZEŻYŁ'
                    elif 'error[E' in r.stderr or 'could not compile' in r.stderr:
                        verdict = 'ZABITY (kompilacja)'
                    else:
                        verdict = 'ZABITY'
            finally:
                open(f, 'w', encoding='utf8').write(src)
            results.append((name, verdict))
            print(name, verdict, flush=True)
    finally:
        for f, src in srcs.items():
            open(f, 'w', encoding='utf8').write(src)
    print('\n'.join(f'{n}: {v}' for n, v in results))


if __name__ == '__main__':
    main()
