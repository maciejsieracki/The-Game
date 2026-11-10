"""Uruchamia wszystkie pomiary i zapisuje wyniki do ../wyniki/<skrypt>.txt.
Uruchom z katalogu repo: python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-4-MODEL-CATALOG-Q1/skrypty/run_all.py
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'wyniki')
os.makedirs(OUT, exist_ok=True)
for s in ['inv', 'prim', 'graph', 'route', 'unitfiles', 'pkg', 'extra', 'uses']:
    r = subprocess.run([sys.executable, '-I', '-B', os.path.join(HERE, s + '.py')], capture_output=True, text=True)
    with open(os.path.join(OUT, s + '.txt'), 'w') as fh:
        fh.write(''.join(l.rstrip() + '\n' for l in r.stdout.splitlines()))  # bez końcowych spacji (git diff --check)
    print(s, 'rc', r.returncode, 'linii', r.stdout.count('\n'), r.stderr[-300:])
