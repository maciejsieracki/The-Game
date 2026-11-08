#!/usr/bin/env python3
"""Mianownik mutacji: liczy zdefiniowane mutanty (mutate-repin.py) i porownuje z logiem wynikow.
Uzycie: python3 mut-denominator.py <mutate-repin.py> <mut-result.txt>
"""
import re
import sys

src = open(sys.argv[1], encoding='utf-8').read()
ids = re.findall(r"^m\('(N\d+)_[^']*'", src, re.M)
print('zdefiniowane', len(ids), 'unikalne', len(set(ids)))
latest = {}
for line in open(sys.argv[2], encoding='utf-8').read().splitlines():
    if ':' not in line:
        continue
    k, v = line.split(':', 1)
    latest[k.strip().split('_')[0]] = (k.strip(), v.strip())
print('w logu (unikalne ID)', len(latest))
missing = [i for i in ids if i not in latest]
print('brak w logu', len(missing), missing)
stats = {}
for i in ids:
    if i in latest:
        v = latest[i][1].split('(')[0]
        stats[v] = stats.get(v, 0) + 1
print('ostatni wynik per ID', stats)
killed = sum(1 for i in ids if i in latest and latest[i][1] == 'KILLED')
print('KILLED na mianowniku zdefiniowanym', killed, '/', len(ids))
for i in ids:
    if i in latest and latest[i][1] != 'KILLED':
        print('  nie-KILLED', latest[i])
