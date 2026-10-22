#!/usr/bin/env python3
"""Uzycie symboli gra/src/map/* w reszcie gra/src (pin edb8fb56, wypakowany poza repo).
Uzycie: usage_map.py <WEB_ROOT> <web-exports.tsv> > usage.tsv
Dla kazdego symbolu: liczba plikow (poza map/) zawierajacych symbol jako slowo, w podziale na katalogi top-level.
Liczone tekstowo (word-boundary) - to NADMIAR (komentarze, zbieznosci nazw), nie dowod semantyczny."""
import os, re, sys
from collections import defaultdict

root = sys.argv[1]
src = os.path.join(root, 'gra', 'src')
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[2], encoding='utf-8')][1:]

texts = defaultdict(list)  # katalog -> [(plik, tekst)]
for dp, _, fns in os.walk(src):
    for fn in fns:
        if not fn.endswith('.ts'):
            continue
        p = os.path.join(dp, fn)
        rel = os.path.relpath(p, src)
        top = rel.split(os.sep)[0] if os.sep in rel else '(root)'
        if top == 'map':
            continue
        texts[top].append((rel, open(p, encoding='utf-8', errors='replace').read()))

tops = sorted(texts)
print('plik\tlinia\tsymbol\t' + '\t'.join(tops))
for r in rows:
    sym = r[5]
    if sym in ('*', '(brak eksportow)'):
        print(f'{r[0]}\t{r[3]}\t{sym}\t' + '\t'.join('0' for _ in tops))
        continue
    rx = re.compile(r'(?<![\w$])' + re.escape(sym) + r'(?![\w$])')
    cnt = []
    for t in tops:
        cnt.append(str(sum(1 for _, tx in texts[t] if rx.search(tx))))
    print(f'{r[0]}\t{r[3]}\t{sym}\t' + '\t'.join(cnt))
