# Deterministyczny pomiar podziału cityPanel.ts (R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1, r2).
# Użycie (z korzenia repo):  python3 <ten plik> <pin-sha> <konfig.json>
# Czyta plik przez `git show <pin>:gra/src/ui/cityPanel.ts` (bez /tmp, bez zewnętrznych skryptów).
#
# Model:
#  - jednostka = deklaracja najwyższego poziomu (kolumna 0) + jej linie do następnej deklaracji;
#    każda linia pliku należy dokładnie do jednej jednostki (assert);
#  - krawędź = wystąpienie identyfikatora w ciele jednostki (regex, NIE AST; nadmiar krawędzi jest
#    bezpieczny kierunkowo: tylko dokłada cięcia). Dla typów (interface/type) pomijane są klucze
#    właściwości i nazwy parametrów (`nazwa:` / `nazwa?:` / `nazwa(`), bo nie są zależnościami;
#  - cięcia (cut) = wywołania zwrotne do orkiestracji, usuwane z grafu (w porcie: ctx.*);
#  - SCC (Tarjan, iteracje posortowane) są ZWIJANE do jednego węzła: cykl wewnątrz kawałka jest
#    dopuszczalny (jeden moduł), zabroniony jest cykl MIĘDZY kawałkami;
#  - kawałki = ciągłe bloki porządku topologicznego (Kahn, priorytet = najniższa linia), każdy
#    ≤ max_loc LOC; z konstrukcji graf kawałków jest acykliczny, co pomiar i tak sprawdza.
import re, sys, json, subprocess, heapq, collections

PIN, CFG_JSON = sys.argv[1], sys.argv[2]
cfg = json.load(open(CFG_JSON, encoding='utf-8'))
raw = subprocess.run(['git', 'show', f'{PIN}:gra/src/ui/cityPanel.ts'], capture_output=True, check=True).stdout
lines = raw.decode('utf-8').split('\n')
if lines and lines[-1] == '':
    lines.pop()
N = len(lines)
print('PIN', PIN, 'LINES', N, 'BYTES', len(raw))

# Sekcje (inwentarz r1 poprawiony: 32 sekcje A1..AE, każda linia w dokładnie jednej)
SECTIONS = [
("A1",1,284),("A2",285,608),("B",609,859),("C",860,1038),("D",1039,1347),("E",1348,1636),
("F",1637,1754),("G",1755,1947),("H",1948,3014),("I",3015,3550),("J",3551,3835),("K",3836,4221),
("L",4222,4637),("M",4638,5193),("N",5194,5473),("O",5474,6092),("P",6093,6477),("Q",6478,7135),
("R",7136,7464),("S",7465,8049),("T",8050,8428),("U",8429,9256),("V",9257,9494),("W",9495,10157),
("X",10158,10383),("Y",10384,10693),("Z",10694,10844),("AA",10845,11055),("AB",11056,11474),
("AC",11475,11539),("AD",11540,11947),("AE",11948,11986),
]
sec_of = {}
for sid, a, b in SECTIONS:
    for i in range(a, b + 1):
        assert i not in sec_of, ('overlap', i)
        sec_of[i] = sid
assert len(sec_of) == N, ('coverage', len(sec_of), N)
print('SECTIONS', len(SECTIONS), 'coverage OK')

# Jednostki
decl_re = re.compile(r'^(?:export\s+)?(?:async\s+)?(?:function|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)')
kind_re = re.compile(r'(function|const|let|class|interface|type)\s+[A-Za-z_$]')
starts = []
for i, l in enumerate(lines, 1):
    if l and not l[0].isspace() and l[0] not in '})];/*' and not l.startswith('//'):
        m = decl_re.match(l)
        if m:
            starts.append((i, m.group(1), kind_re.search(l).group(1)))
units = []
if starts[0][0] > 1:
    units.append(('<HEADER>', 1, starts[0][0] - 1, 'header'))
for k, (ln, name, kind) in enumerate(starts):
    end = starts[k + 1][0] - 1 if k + 1 < len(starts) else N
    units.append((name, ln, end, kind))
names = [u[0] for u in units]
assert len(set(names)) == len(names), ('duplicate unit names', sorted({n for n in names if names.count(n) > 1}))
assert sum(b - a + 1 for _, a, b, _ in units) == N, 'unit coverage'
unit = {n: (a, b, k) for n, a, b, k in units}
unit_sec = {n: sec_of[a] for n, a, b, k in units}
unit_loc = {n: b - a + 1 for n, a, b, k in units}
print('UNITS', len(units), 'coverage OK (each line in exactly one unit)')

# Graf
ident_re = re.compile(r'(?<![\w$.])([A-Za-z_$][\w$]*)')
key_re = re.compile(r'(?<![\w$.])[A-Za-z_$][\w$]*\s*\??\s*(?=[:(])')
nodes = {n for n, a, b, k in units if n != '<HEADER>'}
graph = {}
for n, a, b, k in units:
    if n == '<HEADER>':
        continue
    body = '\n'.join(lines[a - 1:b])
    if cfg.get('strip_comments'):  # domyślnie WYŁĄCZONE: pomiar konserwatywny (komentarze liczone jako krawędzie)
        body = re.sub(r'/\*.*?\*/', ' ', body, flags=re.S)
        body = re.sub(r'(?<![:\w])//.*$', ' ', body, flags=re.M)
    if k in ('interface', 'type'):
        body = key_re.sub(' ', body)
    graph[n] = sorted(idn for idn in set(ident_re.findall(body)) if idn in nodes and idn != n)

CUT = set(cfg['cut'])
for c in CUT:
    assert c in nodes, ('cut not a unit', c)
gu = {v: [w for w in graph[v] if w not in CUT] for v in graph if v not in CUT}

sys.setrecursionlimit(20000)
def keyf(x):
    return (0, unit[x][0]) if isinstance(x, str) else (1, x)
def tarjan(g):
    idx, low, st, on, out, c = {}, {}, [], set(), [], [0]
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
            out.append(sorted(comp, key=keyf))
    for v in sorted(g, key=keyf):
        if v not in idx: strong(v)
    return out

# Pomiar 1: SCC jednostek po cięciach
sccs = tarjan(gu)
nontriv = [c for c in sccs if len(c) > 1]
print('CUT', sorted(CUT))
print('UNIT-LEVEL nontrivial SCC after cuts:', len(nontriv))
for c in nontriv:
    print('  SCC', len(c), 'LOC', sum(unit_loc[x] for x in c), 'sections', sorted({unit_sec[x] for x in c}), 'members', c)

if cfg.get('debug_scc'):
    for c in nontriv:
        cs=set(c)
        for v in c:
            print('    EDGE', v, '->', [w for w in gu[v] if w in cs])
# Zwijanie SCC -> węzły; przypisanie kawałków
node_of = {}
for i, c in enumerate(sccs):
    for x in c:
        node_of[x] = i
cond = {i: set() for i in range(len(sccs))}
for v in gu:
    for w in gu[v]:
        if node_of[v] != node_of[w]:
            cond[node_of[v]].add(node_of[w])
prio = {i: min(unit[x][0] for x in sccs[i]) for i in range(len(sccs))}
# Kahn: najpierw zależności (węzły bez niezależnych zależności), priorytet = najniższa linia
outdeg = {i: len(cond[i]) for i in cond}
rev = collections.defaultdict(list)
for i in cond:
    for j in cond[i]:
        rev[j].append(i)
heap = [(prio[i], i) for i in cond if outdeg[i] == 0]
heapq.heapify(heap)
topo = []
while heap:
    _, j = heapq.heappop(heap)
    topo.append(j)
    for i in sorted(rev[j]):
        outdeg[i] -= 1
        if outdeg[i] == 0:
            heapq.heappush(heap, (prio[i], i))
assert len(topo) == len(sccs), 'condensation not a DAG (bug)'
max_loc = cfg['max_loc']
blocks, cur, cur_loc = [], [], 0
for j in topo:
    s_loc = sum(unit_loc[x] for x in sccs[j])
    assert s_loc <= max_loc, ('node larger than block limit', sccs[j][:5], s_loc)
    if cur and cur_loc + s_loc > max_loc:
        blocks.append(cur); cur, cur_loc = [], 0
    cur.append(j); cur_loc += s_loc
if cur:
    blocks.append(cur)
unit_block = {}
block_names = {}
for bi, blk in enumerate(blocks, 1):
    for j in blk:
        for x in sccs[j]:
            unit_block[x] = bi
if '<HEADER>' in unit:
    unit_block['<HEADER>'] = 0
# Jednostki orkiestracji (cięte) -> OSOBNY ostatni kawałek (K09): zależą tylko od niższych kawałków;
# wywołania do nich zastępuje ctx (callback), więc żadna krawędź nie idzie do K09.
blocks.append([])
for c in sorted(CUT, key=lambda x: unit[x][0]):
    unit_block[c] = len(blocks)


# Pomiar 2: graf kawałków
cg = {bi: set() for bi in range(1, len(blocks) + 1)}
witness = {}
# krawędzie kawałków: z wyłączeniem wywołań do jednostek ciętych (zastąpionych ctx), ale z krawędziami ZE jednostek ciętych
for v in graph:
    bv = unit_block[v]
    for w in graph[v]:
        if w in CUT and v not in CUT:
            continue
        bw = unit_block[w]
        if bw != bv:
            cg[bv].add(bw)
            witness.setdefault((bv, bw), (v, w))
ch_sccs = [c for c in tarjan({k: sorted(v) for k, v in cg.items()}) if len(c) > 1]
print('BLOCKS', len(blocks), 'max_loc', max_loc)
blk_info = {}
for bi, blk in enumerate(blocks, 1):
    members = sorted([x for x in unit_block if unit_block[x] == bi], key=lambda x: unit[x][0])
    loc = sum(unit_loc[x] for x in members)
    secs = collections.Counter(unit_sec[x] for x in members)
    top = sorted(members, key=lambda x: -unit_loc[x])[:6]
    blk_info[bi] = {'loc': loc, 'units': len(members), 'sections': dict(sorted(secs.items(), key=lambda kv: (-kv[1], kv[0]))),
                    'first_line': min(unit[x][0] for x in members), 'last_line': max(unit[x][1] for x in members),
                    'top_units': top}
    print(f"  K{bi:02d} LOC={loc:5d} units={len(members):3d} lines {min(unit[x][0] for x in members)}-{max(unit[x][1] for x in members)} "
          f"sections={dict(sorted(secs.items(), key=lambda kv: (-kv[1], kv[0])))} top={top}")
print('CHUNK-LEVEL nontrivial SCC:', len(ch_sccs), ch_sccs)
print('ACYCLIC:', 'YES' if not ch_sccs else 'NO')
print('CHUNK EDGES (blok -> zależy od blok):')
for bi in sorted(cg):
    for bj in sorted(cg[bi]):
        v, w = witness[(bi, bj)]
        print(f'  K{bi:02d} -> K{bj:02d}  e.g. {v} -> {w}')

# Raport DTO / 3D per kawałek (nazwy z konfiguracji; przypisanie mierzone, nie deklarowane)
RULE = set(cfg.get('rule_units', []))
DEFER = set(cfg.get('deferred_units', []))
ENTRY = re.compile(r'^(render|append|build|wire|bind|show|hide|open|close|paint|mount|refresh|switch|navigate|cancel|add|recruit|enqueue|set|get)')
print('PER-BLOK: R = jednostki-reguł (do DTO/silnika); ODLOZONE = 3D/MAPA; WEJSCIA = funkcje UI wg prefiksu nazwy (heurystyka)')
for bi, blk in enumerate(blocks, 1):
    members = sorted([x for j in blk for x in sccs[j]], key=lambda x: unit[x][0])
    r_in = [x for x in members if x in RULE]
    d_in = [x for x in members if x in DEFER]
    e_in = [x for x in members if ENTRY.match(x) and x not in RULE and x not in DEFER][:12]
    print(f"  K{bi:02d} R={r_in}")
    print(f"  K{bi:02d} ODLOZONE={d_in}")
    print(f"  K{bi:02d} WEJSCIA={e_in}")
missing = sorted((RULE | DEFER) - nodes)
if missing:
    print('NIEZNANE NAZWY W KONFIGURACJI (brak deklaracji w pinie):', missing)
tot = sum(unit_loc[n] for n in unit_block)
print('LOC SUM', tot, 'PIN LINES', N, 'EQUAL' if tot == N else 'MISMATCH')

# Eksporty / importy między kawałkami (jednostka z K_j używana w K_i, i != j)
exports = collections.defaultdict(lambda: collections.defaultdict(set))  # block -> unit -> consumer blocks
imports = collections.defaultdict(set)  # block -> set of (unit, from_block)
for v in gu:
    for w in gu[v]:
        if unit_block[w] != unit_block[v]:
            exports[unit_block[w]][w].add(unit_block[v])
            imports[unit_block[v]].add((w, unit_block[w]))
print('EXPORTS (jednostka -> kawałki-konsumenci), liczba per kawałek:')
for bi in sorted(exports):
    print(f'  K{bi:02d} eksportuje {len(exports[bi])} jednostek')
print('IMPORTS, liczba per kawałek:')
for bi in sorted(imports):
    print(f'  K{bi:02d} importuje {len(imports[bi])} jednostek z innych kawałków')

for bi in sorted(cg):
    ex = sorted(exports.get(bi, {}).items(), key=lambda kv: (-len(kv[1]), kv[0]))[:8]
    print(f"  K{bi:02d} najczesciej eksportowane: " + ', '.join(f"{u}->{','.join('K%02d' % c for c in sorted(cs))}" for u, cs in ex))
out = {'pin': PIN, 'lines': N, 'units': len(units), 'cut': sorted(CUT),
       'scc_after_cut': [c for c in nontriv], 'blocks': {str(bi): sorted(x for j in blk for x in sccs[j]) for bi, blk in enumerate(blocks, 1)},
       'block_info': {str(k): v for k, v in blk_info.items()},
       'chunk_edges': {str(bi): {str(bj): witness[(bi, bj)] for bj in sorted(cg[bi])} for bi in sorted(cg)},
       'exports': {str(bi): {u: sorted(c) for u, c in exports[bi].items()} for bi in sorted(exports)},
       'imports': {str(bi): sorted([list(x) for x in imports[bi]]) for bi in sorted(imports)},
       'unit_block': {n: unit_block[n] for n in unit_block}, 'unit_loc': unit_loc, 'unit_sec': unit_sec}
if cfg.get('out_json'):
    json.dump(out, open(cfg['out_json'], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('WROTE', cfg['out_json'])
