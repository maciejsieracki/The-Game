#!/usr/bin/env python3
"""Importy plikow gra/src/map/* (pin edb8fb56). Uzycie: imports_map.py <katalog_map> > imports.tsv
Kolumny: plik, import_wewn (inne pliki map/), import_zewn (sciezki poza map/)"""
import os, re, sys
d = sys.argv[1]
rx = re.compile(r"""(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]""", re.S)
print('plik\timport_wewn\timport_zewn')
for fn in sorted(os.listdir(d)):
    if not fn.endswith('.ts'):
        continue
    txt = open(os.path.join(d, fn), encoding='utf-8').read()
    inner, outer = set(), set()
    for m in rx.finditer(txt):
        sp = m.group(1)
        if not sp.startswith('.'):
            outer.add(sp)
            continue
        base = os.path.normpath(os.path.join('map', sp))
        if base.startswith('map' + os.sep) and os.sep not in base[4:]:
            inner.add(os.path.basename(base))
        else:
            outer.add(base)
    print(f"{fn}\t{','.join(sorted(inner)) or '-'}\t{','.join(sorted(outer)) or '-'}")
