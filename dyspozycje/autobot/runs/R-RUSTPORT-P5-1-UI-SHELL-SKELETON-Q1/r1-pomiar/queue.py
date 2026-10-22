"""Generate PORTING-QUEUE.md body (tables) from graph.json + closure.json + P5-0 catalog.

Usage: python3 -I queue.py <graph.json> <closure.json> <P5-0.md> <pin/gra> <out.md>
"""
import json, re, sys, os
from collections import Counter

g = json.load(open(sys.argv[1]))
c = json.load(open(sys.argv[2]))
cat = open(sys.argv[3], encoding='utf-8').read().splitlines()
root = sys.argv[4]
out = sys.argv[5]

LOGIC = re.compile(r'^(src/(game|map|units|battle|render|data|types|audio|perf)/|data/|src/buildInfo)')
direct = set(c['direct'])
trans = set(c['trans'])
taint = direct | trans
uideps = c['uideps']

# P5-0 §3 rows: | `file.ts` | LOC | lines | classes | ... | DTO |
p50 = {}
for ln in cat:
    m = re.match(r'^\| `([\w/.-]+\.ts)` \|', ln)
    if m:
        cols = [x.strip() for x in ln.strip().strip('|').split('|')]
        p50[m.group(1)] = cols
def short(k):
    return k.replace('src/ui/', '')

# SCC (Tarjan) -> condensation levels; cycle groups ported together
dep = {k: [d for d in uideps[k] if d in taint] for k in taint}
sys.setrecursionlimit(10000)
idx, low, st, on, comps, n = {}, {}, [], set(), [], [0]
def sc(v):
    idx[v] = low[v] = n[0]; n[0] += 1; st.append(v); on.add(v)
    for w in dep[v]:
        if w not in idx:
            sc(w); low[v] = min(low[v], low[w])
        elif w in on:
            low[v] = min(low[v], idx[w])
    if low[v] == idx[v]:
        comp = []
        while True:
            w = st.pop(); on.discard(w); comp.append(w)
            if w == v:
                break
        comps.append(sorted(comp))
for v in sorted(taint):
    if v not in idx:
        sc(v)
comp_of = {}
for i, comp in enumerate(comps):
    for v in comp:
        comp_of[v] = i
group_name = {}
gi = 0
for comp in sorted((c_ for c_ in comps if len(c_) > 1), key=lambda c_: c_[0]):
    gi += 1
    for v in comp:
        group_name[v] = f'C{gi}'
clevel = {}
def cl(i):
    if i in clevel:
        return clevel[i]
    ds = {comp_of[d] for v in comps[i] for d in dep[v]} - {i}
    clevel[i] = 0 if not ds else 1 + max(cl(j) for j in ds)
    return clevel[i]
level = {k: cl(comp_of[k]) for k in taint}
cycle_groups = sorted((c_ for c_ in comps if len(c_) > 1), key=lambda c_: c_[0])

def logic_summary(k):
    cnt = Counter()
    for s, kind, v, line in g[k]:
        if kind == 'pkg' and v == 'three':
            cnt['three'] += 1
        elif kind != 'pkg' and LOGIC.match(v):
            seg = 'gra/data' if v.startswith('data/') else v.split('/')[1].replace('.ts', '')
            cnt[seg] += 1
    return ', '.join(f'{a} {b}' for a, b in sorted(cnt.items()))

def loc(k):
    return sum(1 for _ in open(os.path.join(root, k), encoding='utf-8'))

def classes(k):
    row = p50.get(short(k))
    if not row:
        return '—'
    # §3.1 row: plik, LOC, linie, klasy, co, DTO ; §3.2 row: plik, LOC, linie, klasy, co bierze, DTO
    return row[3]

def dto(k):
    row = p50.get(short(k))
    return row[-1] if row else '—'

def unlocks(k):
    return sorted(short(x) for x in taint if k in uideps[x])

rows = []
for k in sorted(taint, key=lambda k: (level[k], 0 if k in direct else 1, -len(unlocks(k)), short(k))):
    blocking = [short(d) for d in uideps[k] if d in taint]
    clean_deps = [short(d) for d in uideps[k] if d not in taint]
    rows.append((k, blocking, clean_deps))

lines = []
lines.append('| # | Moduł (`src/ui/…`) | Typ | Poziom | Cykl | LOC | Importy logiki (cel × linie) | Klasy P5-0 §3 | Blokujące zależności UI (z kolejki) | Bezpośrednich dependentów w kolejce | DTO / komenda (P5-0) |')
lines.append('|---:|---|---|---:|---|---:|---|---|---|---|---|')
for i, (k, blocking, clean_deps) in enumerate(rows, 1):
    typ = 'BEZPOŚREDNI' if k in direct else 'PRZECHODNI'
    lg = logic_summary(k) if k in direct else '— (0 bezpośrednich)'
    ul = unlocks(k)
    ul_s = f'{len(ul)}' + (f' ({", ".join(ul[:4])}{", …" if len(ul) > 4 else ""})' if ul else '')
    lines.append(f'| {i} | `{short(k)}` | {typ} | {level[k]} | {group_name.get(k, "—")} | {loc(k)} | {lg} | {classes(k)} | {", ".join(f"`{b}`" for b in blocking) or "—"} | {ul_s} | {dto(k) if k in direct else "przez zależności (kolumna 9)"} |')
lines.append('')
lines.append('Grupy cykliczne (port razem, jedna paczka):')
lines.append('')
for gi_, comp in enumerate(cycle_groups, 1):
    lines.append(f'- **C{gi_}** ({len(comp)}): ' + ', '.join(f'`{short(v)}`' for v in comp))

missing_p50 = sorted(short(k) for k in direct if short(k) not in p50)
open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
print('rows', len(rows), 'direct', len(direct), 'trans', len(trans), 'max level', max(level.values()), 'direct not in P5-0 table', missing_p50)
print('p50 rows', len(p50), 'p50 not direct', sorted(set(p50) - {short(k) for k in direct}))
