import json, math, sys
V = json.load(open(sys.argv[1]))
C = V['cases']
EPS = 1e-9
BORDER_B = 2      # twardy_ocean_hex.wartosc (is_in_map_border: dist < B)
MARGIN = 10       # strefa_stopniowanego_ladu_hex (interior: dist > 10)
TOL_SC = 0.04
TOL_CE = 0.015
MIN_T, MAX_T = 0.15, 0.85

def hb(q, r, w, h):
    return min(q, r, w - 1 - q, h - 1 - r)

def cd(q, r, w, h):
    cx = (w - 1) / 2; cy = (h - 1) / 2
    dx = (q - cx) / (cx + 0.5); dy = (r - cy) / (cy + 0.5)
    return math.sqrt(dx * dx + dy * dy)

def qr(k):
    a, b = k.split(',')
    return int(a), int(b)

out = {}
# --- apply: clamp, rounding, score ties, mask min, interior/border distance
hits = dict(clamp_at_min=0, clamp_at_max=0, clamp_inside_eps=0,
            round_half=0, score_eq_tol04=0, mask_score_eq_min=0,
            mask_score_eq_min_pm=0, border_dist_9_10_11=[0, 0, 0],
            border_is_in_B=[0, 0, 0], apply_cases_dims_ok=0)
for c in C['apply']:
    t = c['target']
    cl = min(max(t, MIN_T), MAX_T)
    if abs(t - MIN_T) < EPS: hits['clamp_at_min'] += 1
    if abs(t - MAX_T) < EPS: hits['clamp_at_max'] += 1
    if abs(t - MIN_T) < 1e-3 or abs(t - MAX_T) < 1e-3: hits['clamp_inside_eps'] += 1
    x = c['total'] * cl
    if abs((x - math.floor(x)) - 0.5) < EPS: hits['round_half'] += 1
    sc = [s for _, s in c['scores']]
    for i in range(len(sc)):
        for j in range(len(sc)):
            if i != j and abs(abs(sc[i] - sc[j]) - TOL_SC) < EPS:
                hits['score_eq_tol04'] += 1
                break
    if c['fill'] == 'mask':
        m = c['min']
        for s in sc:
            if abs(s - m) < EPS: hits['mask_score_eq_min'] += 1
            if abs(abs(s - m) - 0.01) < EPS: hits['mask_score_eq_min_pm'] += 1
    d = c['dims']
    if d and d[0] > 0 and d[1] > 0:
        hits['apply_cases_dims_ok'] += 1
        for k, _ in c['map']:
            q, r = qr(k)
            dist = hb(q, r, d[0], d[1])
            for idx, v in enumerate((BORDER_B - 1, BORDER_B, BORDER_B + 1)):
                pass
            if dist in (9, 10, 11):
                hits['border_dist_9_10_11'] = hits.get('border_dist_9_10_11', [0, 0, 0])
                hits['border_dist_9_10_11'][dist - 9] += 1
            if dist in (1, 2, 3):
                hits['border_is_in_B'][dist - 1] += 1
out['apply'] = hits

# --- sort: center-distance tolerance 0.015 hits
sh = dict(ce_eq_tol015=0, cases=0)
for c in C['sort']:
    sh['cases'] += 1
    d = c['dims']
    w, h = (d[0], d[1]) if d else (1, 1)
    pts = [qr(k) for k, _ in c['map']]
    for i in range(len(pts)):
        for j in range(len(pts)):
            if i == j: continue
            a = cd(*pts[i], w, h); b = cd(*pts[j], w, h)
            if abs(abs(a - b) - TOL_CE) < EPS:
                sh['ce_eq_tol015'] += 1
                break
out['sort'] = sh

# --- rebalance: clamp and rounding boundary
rh = dict(cases=0, clamp_at_min=0, clamp_at_max=0, round_half=0)
for c in C['rebalance']:
    rh['cases'] += 1
    t = c['target']
    if abs(t - MIN_T) < EPS: rh['clamp_at_min'] += 1
    if abs(t - MAX_T) < EPS: rh['clamp_at_max'] += 1
    cl = min(max(t, MIN_T), MAX_T)
    x = len(c['map']) * cl
    if abs((x - math.floor(x)) - 0.5) < EPS: rh['round_half'] += 1
out['rebalance'] = rh
print(json.dumps(out, indent=1))
