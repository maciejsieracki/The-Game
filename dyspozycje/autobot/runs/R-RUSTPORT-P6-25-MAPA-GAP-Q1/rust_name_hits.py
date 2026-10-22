#!/usr/bin/env python3
"""Dla kazdego symbolu web (web-exports.tsv) szuka w rust-port/engine/{src,tests} wystapien nazwy:
camelCase (dosl.), snake_case i UPPER_SNAKE (slowo). Wyjscie: rust-name-hits.tsv (symbol, wariant, plik:linia...).
Uzycie: rust_name_hits.py <rust-port/engine> <web-exports.tsv>"""
import os, re, sys

eng = sys.argv[1]
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[2], encoding='utf-8')][1:]


def snake(n):
    s = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', n)
    s = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', s)
    return s.lower()


files = []
for sub in ('src', 'tests'):
    for dp, _, fns in os.walk(os.path.join(eng, sub)):
        for fn in fns:
            if fn.endswith('.rs'):
                files.append(os.path.join(dp, fn))
texts = {}
for f in files:
    texts[f] = open(f, encoding='utf-8', errors='replace').read().split('\n')

print('plik_web\tsymbol\twariant\ttrafienia(max5)')
for r in rows:
    sym = r[5]
    if sym in ('*', '(brak eksportow)'):
        continue
    variants = {sym, snake(sym), snake(sym).upper()}
    for v in sorted(variants):
        if len(v) < 5:
            continue
        rx = re.compile(r'(?<![\w])' + re.escape(v) + r'(?![\w])')
        hits = []
        for f, lines in texts.items():
            for i, l in enumerate(lines):
                if rx.search(l):
                    hits.append(f'{os.path.relpath(f, eng)}:{i + 1}')
                    if len(hits) >= 5:
                        break
            if len(hits) >= 5:
                break
        if hits:
            print(f'{r[0]}:{r[3]}\t{sym}\t{v}\t' + ' '.join(hits))
