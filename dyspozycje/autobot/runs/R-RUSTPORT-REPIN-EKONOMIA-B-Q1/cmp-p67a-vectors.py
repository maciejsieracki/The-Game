import json, sys, collections
A = sys.argv[1]; B = sys.argv[2]
a = json.load(open(A)); b = json.load(open(B))
paths = collections.Counter()
def walk(x, y, p):
    if type(x) != type(y):
        paths[p + ' (type)'] += 1; return
    if isinstance(x, dict):
        for k in set(x) | set(y):
            if k not in x or k not in y:
                paths[p + '.' + k + ' (missing)'] += 1
            else:
                walk(x[k], y[k], p + '.' + k)
    elif isinstance(x, list):
        if len(x) != len(y):
            paths[p + ' (len)'] += 1
        for u, v in zip(x, y):
            walk(u, v, p + '[]')
    else:
        if x != y:
            paths[p] += 1
walk(a, b, '')
for k, v in sorted(paths.items())[:30]:
    print(v, k)
print('TOTAL differing paths:', sum(paths.values()))
