#!/usr/bin/env python3
"""Porownanie wektorow PRZED i PO dodaniu map brzegowych (osobny strumien losowy `rng2`).
Wymog: kazda kategoria `cases` z wersji starej jest PREFIKSEM kategorii z wersji nowej (nowe przypadki
tylko dopisane), pula map starej jest prefiksem nowej, stats starej sa <= nowych, a `meta`/`enums` rowne.
Uzycie: cmp-vectors-r1-r2.py <STARE.json> <NOWE.json>
"""
import json
import sys

old = json.load(open(sys.argv[1], encoding='utf-8'))
new = json.load(open(sys.argv[2], encoding='utf-8'))
bad = 0
same = 0
for k, v in old['cases'].items():
    nv = new['cases'][k]
    if isinstance(v, list):
        if nv[:len(v)] == v:
            same += 1
            print(f'PREFIKS-OK {k}: stare {len(v)} -> nowe {len(nv)} (+{len(nv) - len(v)})')
        else:
            bad += 1
            print(f'ROZNE {k}')
    else:
        if nv == v:
            same += 1
            print(f'ROWNE {k}')
        else:
            bad += 1
            print(f'ROZNE {k}')
for k in new['cases']:
    if k not in old['cases']:
        print(f'NOWA-KATEGORIA {k}: {len(new["cases"][k])}')
if new['maps'][:len(old['maps'])] != old['maps']:
    bad += 1
    print('ROZNE pula map (prefiks)')
else:
    print(f'PREFIKS-OK pula map: {len(old["maps"])} -> {len(new["maps"])}')
for k in ('meta', 'enums'):
    if old[k] != new[k]:
        bad += 1
        print('ROZNE', k)
for k, v in old['stats'].items():
    if new['stats'].get(k, 0) < v:
        bad += 1
        print('STATS MALEJE', k)
print(f'kategorie zgodne: {same}, roznice: {bad}')
sys.exit(1 if bad else 0)
