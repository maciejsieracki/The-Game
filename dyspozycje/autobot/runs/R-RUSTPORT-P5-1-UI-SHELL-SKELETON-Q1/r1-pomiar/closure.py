import json, sys, re
g = json.load(open(sys.argv[1]))
LOGIC = re.compile(r'^(src/(game|map|units|battle|render|data)/|data/)')
ui = sorted(k for k in g if k.startswith('src/ui/'))
direct = {}
for k in ui:
    hits = []
    for s, kind, v, line in g[k]:
        if kind == 'pkg' and v == 'three':
            hits.append((line, s))
        elif kind != 'pkg' and LOGIC.match(v):
            hits.append((line, s))
        elif kind != 'pkg' and not v.startswith('src/ui/'):
            hits.append((line, s))  # any non-ui source outside ui (types/audio/perf/buildInfo) -> treat as logic-side dep
    direct[k] = hits
D = {k for k in ui if direct[k]}
print('direct', len(D))
uideps = {k: sorted({v for s, kind, v, line in g[k] if kind == 'file' and v.startswith('src/ui/') and v.endswith('.ts')}) for k in ui}
assets = {k: sorted({v for s, kind, v, line in g[k] if kind != 'pkg' and v.startswith('src/ui/') and not v.endswith('.ts')}) for k in ui}
# transitive taint
taint = set(D)
changed = True
while changed:
    changed = False
    for k in ui:
        if k not in taint and any(d in taint for d in uideps[k]):
            taint.add(k); changed = True
clean = [k for k in ui if k not in taint]
trans = sorted(taint - D)
print('transitive-only', len(trans))
print('clean', len(clean))
pk = {k: sorted({v for s, kind, v, line in g[k] if kind == 'pkg'}) for k in ui}
miss = {k: [x for x in g[k] if 'missing' in x[1]] for k in ui}
json.dump({'direct': {k: direct[k] for k in sorted(D)}, 'trans': {k: [d for d in uideps[k] if d in taint] for k in trans},
           'clean': clean, 'uideps': uideps, 'assets': assets, 'pkgs': {k: v for k, v in pk.items() if v},
           'missing': {k: v for k, v in miss.items() if v}}, open(sys.argv[2], 'w'), indent=1)
