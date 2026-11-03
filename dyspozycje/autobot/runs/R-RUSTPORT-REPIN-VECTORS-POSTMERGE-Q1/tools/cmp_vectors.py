#!/usr/bin/env python3
"""Porownanie wektorow stary(4bbef081d) vs nowy(23dd158e9): czy wejscia IDENTYCZNE, ktore scenariusze/pola wyjscia sie zmienily.
Uzycie: cmp_vectors.py <old.json> <new.json>"""
import json, sys, collections

old = json.load(open(sys.argv[1]))
new = json.load(open(sys.argv[2]))


def diff(a, b, path, out, limit=6):
    if type(a) != type(b):
        out.append((path, a, b)); return
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                out.append((path + '/' + k, a.get(k, '<brak>'), b.get(k, '<brak>')))
            else:
                diff(a[k], b[k], path + '/' + k, out)
    elif isinstance(a, list):
        if len(a) != len(b):
            out.append((path + '#len', len(a), len(b))); return
        for i, (x, y) in enumerate(zip(a, b)):
            diff(x, y, f'{path}[{i}]', out)
    elif a != b:
        out.append((path, a, b))


top = []
for k in sorted(set(old) | set(new)):
    if k == 'pin':
        print('pin:', old.get(k), '->', new.get(k)); continue
    o, n = old.get(k), new.get(k)
    if k == 'scenarios' and isinstance(o, list) and isinstance(n, list):
        print('scenarios', len(o), len(n))
        in_diff = 0; out_diff = 0; keyc = collections.Counter(); ex = []
        for i, (a, b) in enumerate(zip(o, n)):
            keys = sorted(set(a) | set(b))
            d_in = []; d_out = []
            for kk in keys:
                dd = []
                diff(a.get(kk), b.get(kk), kk, dd)
                if dd:
                    (d_in if kk in ('in', 'input', 'inp', 'idx', 'dims', 'params', 'map_hexes', 'name') else d_out).extend(dd)
                    keyc[kk] += 1
            if d_in: in_diff += 1
            if d_out:
                out_diff += 1
                if len(ex) < 8: ex.append((i, d_out[:2]))
            if d_in and len(ex) < 8: ex.append((i, ['INPUT'] + d_in[:2]))
        print(f'  scen z roznica wejscia={in_diff}, wyjscia={out_diff}; pola:', dict(keyc))
        for i, d in ex:
            print('  ex', i, str(d)[:400])
    else:
        dd = []
        diff(o, n, k, dd)
        print(k, 'IDENTYCZNE' if not dd else f'ROZNE ({len(dd)}): ' + str(dd[:2])[:300])
