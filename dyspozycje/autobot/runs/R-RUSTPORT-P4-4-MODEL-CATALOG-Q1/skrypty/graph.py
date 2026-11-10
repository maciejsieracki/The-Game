"""Graf importów (§1.1 kolumna importerów, §3.1, §3.2 i załącznik A).

Wyjście: dla każdego z 96 plików inwentarza: IN (importerzy w gra/src) i OUT (importowane pliki gra/src),
osobno importerzy spoza gra/src (gra/tools, gra/podglad-*), oraz cykle 2-elementowe w render/**.
Uruchom: python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-4-MODEL-CATALOG-Q1/skrypty/graph.py
"""
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import PIN, sh, inventory_files, import_graph  # noqa: E402

g = import_graph()
inv = inventory_files()
short = lambda f: f.replace('gra/src/', '')  # noqa: E731

# importerzy spoza gra/src (narzędzia): po nazwie pliku bez rozszerzenia w ścieżce importu
def tools_importers(f):
    stem = f.rsplit('/', 1)[1][:-3]
    out = sh('git', 'grep', '-l', '-E', r"(from|import)\s*\(?\s*['\"][^'\"]*/" + re.escape(stem) + r"(\.ts|\.js)?['\"]",
             PIN, '--', 'gra', ':!gra/src').split()
    return sorted(o.split(':', 1)[1] for o in out)

print('# plik | IN (gra/src) | IN spoza gra/src | OUT (gra/src)')
for f in inv:
    by = sorted(short(x) for x in g if f in g[x])
    dep = sorted(short(d) for d in g.get(f, ()) if d in g)
    tl = tools_importers(f)
    print(f"{short(f)} | IN {len(by)}: {','.join(by)} | TOOLS {len(tl)}: {','.join(tl[:4])}{'…' if len(tl) > 4 else ''} | OUT {len(dep)}: {','.join(dep)}")

print('\n# cykle 2-elementowe (A importuje B i B importuje A), pliki inwentarza')
seen = set()
for a in inv:
    for b in g.get(a, ()):
        if b in inv and a in g.get(b, ()) and frozenset((a, b)) not in seen:
            seen.add(frozenset((a, b)))
            print('CYCLE', short(a), '<->', short(b))

print('\n# krawędzie render/** + 8 spoza (A -> B), tylko między plikami inwentarza')
n = 0
for a in inv:
    for b in sorted(g.get(a, ())):
        if b in inv:
            print('EDGE', short(a), '->', short(b))
            n += 1
print('EDGES_TOTAL', n)
