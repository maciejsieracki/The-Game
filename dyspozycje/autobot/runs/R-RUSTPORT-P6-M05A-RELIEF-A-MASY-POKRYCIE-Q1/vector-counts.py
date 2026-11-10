import json
import sys

d = json.load(open(sys.argv[1]))
c = d['cases']
tot = 0
for k, v in c.items():
    n = len(v) if isinstance(v, list) else 1
    if k == 'consts':
        n = 1
    if k == 'overflowVariants':
        n = sum(len(x['rows']) for x in v)
    print(k, n)
    tot += n
print('RAZEM', tot, 'map', len(d['maps']))
print(json.dumps(d['stats'], sort_keys=True))
extra = {
    'center_dist_points': sum(len(sq['dist'] or []) for x in c['center'] for sq in x['squares']),
    'ratios_values': sum(len(x['iron']) + len(x['copper']) + len(x['relief']) + 1 for x in c['ratios']),
    'caps_values': 4 * len(c['caps']),
    'hexes_total_pool': sum(len(m['q']) for m in d['maps']),
}
print(extra)
