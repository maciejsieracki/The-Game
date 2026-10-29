import json, sys
def leaves(o, p=()):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == 'meta' and not p: continue
            yield from leaves(v, p + (k,))
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from leaves(v, p + (i,))
    else:
        yield p, o
a_path, b_path = sys.argv[1], sys.argv[2]
a = json.load(open(a_path, encoding='utf-8')); b = json.load(open(b_path, encoding='utf-8'))
la = dict(leaves(a)); lb = dict(leaves(b))
d = sorted([k for k in set(la) | set(lb) if la.get(k, '<M>') != lb.get(k, '<M>')], key=str)
print("leaf_diffs=%d" % len(d))
for k in d[:2]: print("  e.g.", k, la.get(k,'<M>'), lb.get(k,'<M>'))
