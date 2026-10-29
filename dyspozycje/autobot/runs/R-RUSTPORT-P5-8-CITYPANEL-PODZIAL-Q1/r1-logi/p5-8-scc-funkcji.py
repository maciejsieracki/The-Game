import re, sys, json
sys.argv = ['inv.py', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/cityPanel-pin.ts', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/inv.json']
src = open('/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tools/inv.py', encoding='utf-8').read()
ns = {}
exec(compile(src.split('# SCC (Tarjan)')[0].replace('print(', '(lambda *a, **k: None)('), 'inv', 'exec'), ns)
lines = ns['lines']; N = ns['N']; sec_of = ns['sec_of']
kind_re = re.compile(r'^(?:export\s+)?(interface|type)\s+([A-Za-z_$][\w$]*)')
decl_re = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)')
# function-level ranges: each value decl runs until next top-level decl (any kind) line
starts = []
for i, l in enumerate(lines, 1):
    if l and not l[0].isspace() and l[0] not in '})];/*/' and not l.startswith('//'):
        m = decl_re.match(l) or kind_re.match(l)
        if m:
            starts.append((i, m.group(m.lastindex), bool(kind_re.match(l))))
owner = {}
bounds = []
for k, (ln, name, is_type) in enumerate(starts):
    end = starts[k + 1][0] - 1 if k + 1 < len(starts) else N
    bounds.append((name, ln, end, is_type))
vals = {n for (n, a, b, t) in bounds if not t}
fn_of_line = {}
for n, a, b, t in bounds:
    for i in range(a, b + 1):
        fn_of_line.setdefault(i, n)
ident_re = re.compile(r'(?<![\w$.])([A-Za-z_$][\w$]*)')
g = {n: set() for n in vals}
for n, a, b, t in bounds:
    if t:
        continue
    body = '\n'.join(lines[a - 1:b])
    for idn in set(ident_re.findall(body)):
        if idn in vals and idn != n:
            g[n].add(idn)
# Tarjan on function graph
sys.setrecursionlimit(20000)
idx = {}; low = {}; st = []; on = set(); sccs = []; c = [0]
def strong(v):
    idx[v] = low[v] = c[0]; c[0] += 1; st.append(v); on.add(v)
    for w in g[v]:
        if w not in idx:
            strong(w); low[v] = min(low[v], low[w])
        elif w in on:
            low[v] = min(low[v], idx[w])
    if low[v] == idx[v]:
        comp = []
        while True:
            w = st.pop(); on.discard(w); comp.append(w)
            if w == v: break
        sccs.append(sorted(comp))
for v in g:
    if v not in idx: strong(v)
CUT = set(sys.argv_cut) if hasattr(sys, 'argv_cut') else set(['rerender', 'switchCity', 'renderCityIconRightRail'])
g2 = {v: {w for w in g[v] if w not in CUT} for v in g if v not in CUT}
g = g2
idx = {}; low = {}; st = []; on = set(); sccs = []; c = [0]
for v in g:
    if v not in idx: strong(v)
big = [x for x in sccs if len(x) > 1]
print('AFTER CUT', sorted(CUT))
print('value fns', len(vals), 'nontrivial SCC count', len(big))
for x in big:
    secs = sorted({sec_of[next(a for (n, a, b, t) in bounds if n == f)] for f in x})
    print(len(x), 'sections', secs, 'members', x[:40])
out = {'fn_count': len(vals), 'big_scc': big, 'bounds': [(n, a, b) for (n, a, b, t) in bounds if not t]}
json.dump(out, open('/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fn_scc.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
