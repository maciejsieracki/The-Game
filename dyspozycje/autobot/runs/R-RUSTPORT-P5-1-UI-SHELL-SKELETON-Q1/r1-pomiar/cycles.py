import json, sys
c = json.load(open(sys.argv[1]))
taint = set(c['direct']) | set(c['trans'])
dep = {k: [d for d in c['uideps'][k] if d in taint] for k in taint}
# Tarjan SCC
idx = {}; low = {}; st = []; on = set(); res = []; n = [0]
sys.setrecursionlimit(10000)
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
            if w == v: break
        if len(comp) > 1: res.append(sorted(comp))
for v in sorted(taint):
    if v not in idx: sc(v)
print(json.dumps(res, indent=1))
# also cycles among clean
clean = set(c['clean'])
print('clean deps on clean only:', all(all(d in clean for d in c['uideps'][k]) for k in clean))
