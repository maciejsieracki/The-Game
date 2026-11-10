import re, sys, json
sys.argv = ['inv.py', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/cityPanel-pin.ts', '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/inv.json']
src = open('/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tools/inv.py', encoding='utf-8').read()
ns = {}
exec(compile(src.split('# SCC (Tarjan)')[0].replace('print(', '(lambda *a, **k: None)('), 'inv', 'exec'), ns)
lines = ns['lines']; N = ns['N']; SECTIONS = ns['SECTIONS']
sec_of = ns['sec_of']
kind_re = re.compile(r'^(?:export\s+)?(interface|type)\s+([A-Za-z_$][\w$]*)')
decl_re = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)')
starts = []
for i, l in enumerate(lines, 1):
    if l and not l[0].isspace() and l[0] not in '})];/*' and not l.startswith('//'):
        m = decl_re.match(l) or kind_re.match(l)
        if m:
            starts.append((i, m.group(m.lastindex), bool(kind_re.match(l))))
bounds = []
for k, (ln, name, is_type) in enumerate(starts):
    end = starts[k + 1][0] - 1 if k + 1 < len(starts) else N
    bounds.append((name, ln, end, is_type))
vals = {n for (n, a, b, t) in bounds if not t}
ident_re = re.compile(r'(?<![\w$.])([A-Za-z_$][\w$]*)')
g = {}
for n, a, b, t in bounds:
    if t: continue
    body = '\n'.join(lines[a - 1:b])
    g[n] = {idn for idn in set(ident_re.findall(body)) if idn in vals and idn != n}
CUT = {'rerender', 'switchCity', 'renderCityIconRightRail'}
import os
STATE = set(re.findall(r'^let\s+([A-Za-z_$][\w$]*)', '\n'.join(lines), re.M))
print('STATE vars:', sorted(STATE))
LEAF_CUT = set(os.environ.get('LEAF_CUT', '').split(',')) - {''}
if os.environ.get('STATE_CUT') == '1':
    CUT = CUT | STATE
CUT = CUT | LEAF_CUT
g = {v: {w for w in g[v] if w not in CUT} for v in g if v not in CUT}
# function -> section (by line)
fn_sec = {}
for n, a, b, t in bounds:
    if not t:
        fn_sec[n] = sec_of[a]
# CHUNKS: name -> list of sections
CHUNKS = [
 ('K0-CSS', ['H']),
 ('K1-Fundament', ['A2', 'B', 'C', 'G', 'R']),
 ('K2-Model-DTO-adapter', ['D', 'E', 'F', 'I']),
 ('K3-Zdrowie-kultura-wspolne', ['J', 'K', 'L', 'N']),
 ('K4-Ekonomia-topbar', ['M', 'O']),
 ('K5-Budynki-karty', ['Q', 'S']),
 ('K6-Kolejki-rekrutacja', ['P', 'T']),
 ('K7-Lista-produkcji', ['U', 'V', 'AB']),
 ('K8-Okolica', ['W']),
 ('K9-Pasek-W3-handel', ['Y', 'Z', 'AA', 'AC']),
 ('K10-Stan-nawigacja-API', ['X', 'AD', 'AE']),
 ('K-NIE-PORTOWANE-importy', ['A1']),
]
sec2chunk = {}
for name, secs in CHUNKS:
    for s in secs: sec2chunk[s] = name
assert set(sec2chunk) == {s[0] for s in SECTIONS}, set(s[0] for s in SECTIONS) ^ set(sec2chunk)
size = {}
for sid, title, a, b in SECTIONS:
    size[sec2chunk[sid]] = size.get(sec2chunk[sid], 0) + (b - a + 1)
for name, _ in CHUNKS:
    print(f"{name:28} LOC={size.get(name,0)}")
print('total', sum(size.values()))
# chunk graph
cg = {name: set() for name, _ in CHUNKS}
witness = {}
for f, deps in g.items():
    cf = sec2chunk[fn_sec[f]]
    for d in deps:
        cd = sec2chunk[fn_sec[d]]
        if cf != cd:
            cg[cf].add(cd)
            witness.setdefault((cf, cd), (f, d))
# cycle detect via DFS
state = {}
cycles = []
def dfs(v, stack):
    state[v] = 1; stack.append(v)
    for w in cg[v]:
        if state.get(w) == 1:
            cycles.append(stack[stack.index(w):] + [w])
        elif state.get(w) is None:
            dfs(w, stack)
    stack.pop(); state[v] = 2
for v in cg:
    if state.get(v) is None: dfs(v, [])
print('chunk cycles:', cycles[:5])
print('chunk edges:')
for a_ in cg:
    for b_ in sorted(cg[a_]):
        print(' ', a_, '->', b_, 'e.g.', witness[(a_, b_)])
