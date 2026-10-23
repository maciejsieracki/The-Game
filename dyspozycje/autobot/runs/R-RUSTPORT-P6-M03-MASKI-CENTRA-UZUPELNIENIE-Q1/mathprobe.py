import json, math, sys
d = json.load(open(sys.argv[1]))
for name, fn in [('pow', lambda r: math.pow(r[1], r[0])), ('atan2', lambda r: math.atan2(r[0], r[1])),
                 ('sin', lambda r: math.sin(r[0])), ('hypot', lambda r: math.hypot(r[0], r[1]))]:
    rows = d[name]
    bad = sum(1 for r in rows if fn(r) != r[-1])
    print(name, bad, '/', len(rows))
