#!/usr/bin/env python3
"""Niezalezny weryfikator wektorow strait.json (P6.M03 r2, zarzut 3): czysty Python, bez Rust/Node.
Sprawdza KONSTRUKCJE przypadkow (nie wynik maski): heks w jednym wierszu z centrami, odleglosci =
|roznica nq| (hypot(x,0) dokladnie), roznica odleglosci == prog / prog -+ 1 ulp co do bitu, prog
z tabeli == 0.018 (literal TS gen-helpers.ts:480).
Uzycie: python3 -I verify-m03-strait.py <strait.json> <mapgen-masks.json>"""
import json
import math
import struct
import sys

strait = json.load(open(sys.argv[1], encoding='utf8'))
table = json.load(open(sys.argv[2], encoding='utf8'))
thr = float(strait['threshold'])
assert thr == 0.018 == table['kontynenty']['ciesnina'], 'prog'


def bump(x, n):
    (u,) = struct.unpack('<Q', struct.pack('<d', x))
    return struct.unpack('<d', struct.pack('<Q', u + n))[0]


targets = {'rowne': thr, 'ulp_mniej': bump(thr, -1), 'ulp_wiecej': bump(thr, 1)}
checked = 0
kinds = {k: 0 for k in targets}
for c in strait['cases']:
    w, h, q, r = c['w'], c['h'], c['q'], c['r']
    nq, nr = q / (w - 1), r / (h - 1)
    (c1, c2) = [[float(v) for v in row] for row in c['centers']]
    assert c1[1] == nr and c2[1] == nr, 'centra nie w wierszu heksa'
    d1 = math.hypot(nq - c1[0], nr - c1[1])
    d2 = math.hypot(nq - c2[0], nr - c2[1])
    assert d1 == abs(nq - c1[0]) and d2 == abs(nq - c2[0]), 'hypot(x,0) != |x|'
    assert d1 < d2, 'c1 ma byc najblizsze'
    assert d2 - d1 == targets[c['kind']], (c['kind'], d2 - d1)
    assert float(c['diff']) == d2 - d1
    assert q >= 30 and q < w - 30 and 20 <= r < h - 20, 'heks w strefie brzegu'
    kinds[c['kind']] += 1
    checked += 1
print('SPRAWDZEN', checked, 'ROZBIEZNOSCI 0', kinds)
