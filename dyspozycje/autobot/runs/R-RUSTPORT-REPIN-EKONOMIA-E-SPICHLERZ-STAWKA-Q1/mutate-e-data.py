"""Mutanty danych REPIN-EKONOMIA-E: python3 -I mutate-e-data.py <REPO_ROOT>.
Zmienia wartosc w pliku danych, uruchamia nowe testy, przywraca plik."""
import os
import re
import subprocess
import sys

ROOT = sys.argv[1]
ENG = ROOT + '/rust-port/engine'
RUN = ROOT + '/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-E-SPICHLERZ-STAWKA-Q1'
M = [
    ('E-D1-braz-rate-1', 'data/citizen-resource-upkeep.json', '"nazwa": "Brąz", "stawkaNaObywatela": 2,', '"nazwa": "Brąz", "stawkaNaObywatela": 1,'),
    ('E-D2-zelazo-rate-removed', 'data/citizen-resource-upkeep.json', '"nazwa": "Żelazo", "stawkaNaObywatela": 3,', '"nazwa": "Żelazo",'),
    ('E-D3-spichlerz-sol-26', 'data/econ-params.json', '    "budynek_spichlerz_ii_zuzywa_sol": {\n      "easy": 25,', '    "budynek_spichlerz_ii_zuzywa_sol": {\n      "easy": 26,'),
    ('E-D4-spichlerz-ceramika-ii-key-renamed', 'data/econ-params.json', '"budynek_spichlerz_ii_zuzywa_ceramika": {', '"budynek_spichlerz_ii_zuzywa_ceramika_X": {'),
]
env = dict(os.environ, CARGO_TARGET_DIR='/dev/shm/e-spich-target', CARGO_INCREMENTAL='0',
           CARGO_PROFILE_DEV_DEBUG='0', CARGO_PROFILE_TEST_DEBUG='0')
for mid, f, old, new in M:
    path = ENG + '/' + f
    orig = open(path, encoding='utf-8').read()
    if orig.count(old) != 1:
        print(mid, 'SKIP-NOMATCH', orig.count(old))
        continue
    open(path, 'w', encoding='utf-8').write(orig.replace(old, new))
    try:
        r = subprocess.run(['cargo', 'test', '-j', '2', '--test', 'p6_repin_ekonomia_e_citizen',
                            '--test', 'p6_repin_ekonomia_e_spichlerz'],
                           cwd=ENG, env=env, capture_output=True, text=True, timeout=500)
        out = r.stdout + r.stderr
        code = r.returncode
    finally:
        open(path, 'w', encoding='utf-8').write(orig)
    failed = [l for l in out.splitlines() if re.match(r'test .* FAILED', l)]
    verdict = 'KILLED' if code != 0 else 'SURVIVED'
    with open(RUN + '/mut-' + mid + '.log', 'w') as fh:
        fh.write('MUTANT %s file=%s\nOLD:\n%s\nNEW:\n%s\n\nFAILED TESTS:\n%s\nVERDICT=%s\nEXIT=%s\n' % (mid, f, old, new, '\n'.join(failed), verdict, code))
    print(mid, verdict, len(failed), flush=True)
