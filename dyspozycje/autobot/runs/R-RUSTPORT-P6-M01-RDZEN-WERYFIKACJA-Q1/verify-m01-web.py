#!/usr/bin/env python3
"""NIEZALEZNY weryfikator P6.M01 (bez kodu Rust, bez Node).

Odtwarza z TEKSTU zrodel weba (pin edb8fb56) funkcje rdzenia mapgen w czystym Pythonie i porownuje
KAZDY wektor z `tests/p6_m01_vectors/web-vectors.json` (wygenerowany z uruchomionego weba) oraz dane
Rusta (`data/derived/earth-land-mask.json`, `data/derived/mapgen-core-params.json`) ze STALYMI i maska
sparsowanymi wprost z plikow TS. Wynik: liczba rozbieznosci (oczekiwane 0), exit 1 przy > 0.

Uzycie: python3 -I verify-m01-web.py <KORZEN_WEBA> <wektory.json> <katalog_engine>
  KORZEN_WEBA = katalog z `gra/src` (wynik `git archive edb8fb56 gra/src gra/data`)
"""
import json
import math
import re
import struct
import sys

web_root, vec_path, engine = sys.argv[1], sys.argv[2], sys.argv[3]
V = json.load(open(vec_path, encoding='utf8'))
bad = []
checks = 0


def check(cond, what):
    global checks
    checks += 1
    if not cond:
        bad.append(what)


def same(a, b):
    return (a != a and b != b) or struct.pack('<d', a) == struct.pack('<d', b)


def num(s):
    return float({'NaN': 'nan', 'Infinity': 'inf', '-Infinity': '-inf'}.get(s, s))


# ----------------------------------------------------------------------------------------------
# Stale ze zrodel TS (regex po tekscie, nie z Rusta)
# ----------------------------------------------------------------------------------------------
gh = open(f'{web_root}/gra/src/map/gen-helpers.ts', encoding='utf8').read()
em = open(f'{web_root}/gra/src/map/earth-land-mask.ts', encoding='utf8').read()
eg = open(f'{web_root}/gra/src/map/earth-land-mask.generated.ts', encoding='utf8').read()


def ts_const(src, name):
    m = re.search(r'export const ' + name + r'\s*=\s*([0-9.]+);', src)
    assert m, name
    return float(m.group(1))


POLAR = ts_const(gh, 'CLIMATE_POLAR_FRAC')
DESERT_ROWS = ts_const(gh, 'CLIMATE_DESERT_HALF_ROWS')
PLAINS = ts_const(gh, 'CLIMATE_PLAINS_HALF_FRAC')
LATBUF = ts_const(gh, 'CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC')
REF_ROWS = int(ts_const(em, 'EARTH_POLAR_OCEAN_REF_ROWS'))
REF_INNER = int(ts_const(em, 'EARTH_POLAR_OCEAN_REF_INNER_H'))
BORDER = int(re.search(r'const EARTH_PLAYABLE_BORDER = (\d+);', em).group(1))
CAP_FRAC = float(re.search(r'Math\.round\(innerH \* ([0-9.]+)\)', em).group(1))
SAMPLE_TH = float(re.search(r'return v >= ([0-9.]+) \? 1 : 0;', em).group(1))
# Progi z `earthSubsampleGrid` / `earthLandFractionThreshold`
sub_src = re.search(r'function earthSubsampleGrid.*?\n}\n', em, re.S).group(0)
SUB = [(int(a), int(b)) for a, b in re.findall(r'inner >= (\d+)\) return (\d+);', sub_src)]
SUB_DEFAULT = int(re.search(r'return (\d+);\n}', sub_src).group(1))
thr_src = re.search(r'function earthLandFractionThreshold.*?\n}\n', em, re.S).group(0)
THR = [(int(a), float(b)) for a, b in re.findall(r'inner >= (\d+)\) return ([0-9.]+);', thr_src)]
THR_DEFAULT = float(re.search(r'return ([0-9.]+);\n}', thr_src).group(1))
FOREST_HOSTILE = float(re.search(r'return ([0-9.]+);\n  if \(band === .temperate_north', gh).group(1))
FOREST_DELTA = float(re.search(r'baseForTh - ([0-9.]+);', gh).group(1))
# maska
W = int(re.search(r'EARTH_MASK_W = (\d+);', eg).group(1))
H = int(re.search(r'EARTH_MASK_H = (\d+);', eg).group(1))
bb = re.search(r'minX: ([0-9.]+),\s*minY: ([0-9.]+),\s*maxX: ([0-9.]+),\s*maxY: ([0-9.]+)', eg)
BBOX = tuple(float(x) for x in bb.groups())
ROWS = re.findall(r"'([01]+)',", eg)
check(len(ROWS) == H and all(len(r) == W for r in ROWS), 'maska TS: wymiary')


# ----------------------------------------------------------------------------------------------
# fdlibm cos (V8 ieee754::cos) — niezalezna transkrypcja z DZIESIETNYMI stalymi fdlibm
# ----------------------------------------------------------------------------------------------
C1, C2, C3 = 4.16666666666666019037e-02, -1.38888888888741095749e-03, 2.48015872894767294178e-05
C4, C5, C6 = -2.75573143513906633035e-07, 2.08757232129817482790e-09, -1.13596475577881948265e-11
S1, S2, S3 = -1.66666666666666324348e-01, 8.33333333332248946124e-03, -1.98412698298579493134e-04
S4, S5, S6 = 2.75573137070700676789e-06, -2.50507602534068634195e-08, 1.58969099521155010221e-10
INVPIO2 = 6.36619772367581382433e-01
PIO2_1, PIO2_1T = 1.57079632673412561417e+00, 6.07710050650619224932e-11
PIO2_2, PIO2_2T = 6.07710050630396597660e-11, 2.02226624879595063154e-21
PIO2_3, PIO2_3T = 2.02226624871116645580e-21, 8.47842766036889956997e-32
NPIO2_HW = [0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C, 0x4025FDBB,
            0x402921FB, 0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C, 0x40346B9C, 0x4035FDBB,
            0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A, 0x403DD85A, 0x403F6A7A, 0x40407E4C,
            0x404147AC, 0x4042106C, 0x4042D97C, 0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB,
            0x4046C6CB, 0x40478FDB, 0x404858EB, 0x404921FB]


def hi(x):
    return struct.unpack('<Q', struct.pack('<d', x))[0] >> 32


def kcos(x, y):
    ix = hi(x) & 0x7FFFFFFF
    if ix < 0x3E400000 and int(x) == 0:
        return 1.0
    z = x * x
    r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))))
    if ix < 0x3FD33333:
        return 1.0 - (0.5 * z - (z * r - x * y))
    qx = 0.28125 if ix > 0x3FE90000 else struct.unpack('<d', struct.pack('<Q', (ix - 0x00200000) << 32))[0]
    iz = 0.5 * z - qx
    a = 1.0 - qx
    return a - (iz - (z * r - x * y))


def ksin(x, y):
    ix = hi(x) & 0x7FFFFFFF
    if ix < 0x3E400000 and int(x) == 0:
        return x
    z = x * x
    v = z * x
    r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))
    return x - ((z * (0.5 * y - v * r) - y) - v * S1)


def rem_pio2(x):
    hx = hi(x)
    ix = hx & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return 0, x, 0.0
    if ix < 0x4002D97C:
        if hx >> 31 == 0:
            z = x - PIO2_1
            if ix != 0x3FF921FB:
                y0 = z - PIO2_1T
                return 1, y0, (z - y0) - PIO2_1T
            z -= PIO2_2
            y0 = z - PIO2_2T
            return 1, y0, (z - y0) - PIO2_2T
        z = x + PIO2_1
        if ix != 0x3FF921FB:
            y0 = z + PIO2_1T
            return -1, y0, (z - y0) + PIO2_1T
        z += PIO2_2
        y0 = z + PIO2_2T
        return -1, y0, (z - y0) + PIO2_2T
    t = abs(x)
    n = int(t * INVPIO2 + 0.5)
    fn = float(n)
    r = t - fn * PIO2_1
    w = fn * PIO2_1T
    if n < 32 and ix != NPIO2_HW[n - 1]:
        y0 = r - w
    else:
        j = ix >> 20
        y0 = r - w
        i = j - ((hi(y0) >> 20) & 0x7FF)
        if i > 16:
            t2 = r
            w = fn * PIO2_2
            r = t2 - w
            w = fn * PIO2_2T - ((t2 - r) - w)
            y0 = r - w
            i = j - ((hi(y0) >> 20) & 0x7FF)
            if i > 49:
                t3 = r
                w = fn * PIO2_3
                r = t3 - w
                w = fn * PIO2_3T - ((t3 - r) - w)
                y0 = r - w
    y1 = (r - y0) - w
    if hx >> 31:
        return -n, -y0, -y1
    return n, y0, y1


def fcos(x):
    ix = hi(x) & 0x7FFFFFFF
    if ix <= 0x3FE921FB:
        return kcos(x, 0.0)
    if ix >= 0x7FF00000:
        return float('nan')
    if ix > 0x413921FB:
        return math.cos(x)  # poza zakresem sredniego (jak w Rust: fallback do libm)
    n, y0, y1 = rem_pio2(x)
    k = n & 3
    if k == 0:
        return kcos(y0, y1)
    if k == 1:
        return -ksin(y0, y1)
    if k == 2:
        return -kcos(y0, y1)
    return ksin(y0, y1)


# ----------------------------------------------------------------------------------------------
# funkcje rdzenia (z tekstu TS)
# ----------------------------------------------------------------------------------------------
M32 = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & M32


def mulberry(seed):
    s = seed & M32

    def nxt():
        nonlocal s
        s = (s + 0x6D2B79F5) & M32
        t = imul(s ^ (s >> 15), 1 | s)
        t = t ^ ((t + imul(t ^ (t >> 7), 61 | t)) & M32)
        return ((t ^ (t >> 14)) & M32) / 4294967296.0
    return nxt


def perm(rand):
    p = list(range(256))
    for i in range(255, 0, -1):
        j = math.floor(rand() * (i + 1))
        p[i], p[j] = p[j], p[i]
    return p


def cos_lerp(a, b, t):
    f = (1 - fcos(t * math.pi)) * 0.5
    return a * (1 - f) + b * f


def noise(p, x, y):
    fx, fy = math.floor(x), math.floor(y)
    xi, yi = fx & 255, fy & 255
    xf, yf = x - float(fx), y - float(fy)

    def h(ix, iy):
        return p[(p[ix & 255] + iy) & 255] / 255

    v00, v10, v01, v11 = h(xi, yi), h(xi + 1, yi), h(xi, yi + 1), h(xi + 1, yi + 1)
    top, bot = cos_lerp(v00, v10, xf), cos_lerp(v01, v11, xf)
    return cos_lerp(top, bot, yf)


def fbm(p, x, y, octaves=4):
    value, amp, freq, mx = 0.0, 0.5, 1.0, 0.0
    for _ in range(octaves):
        value += noise(p, x * freq, y * freq) * amp
        mx += amp
        amp *= 0.5
        freq *= 2.0
    return value / mx if mx != 0 else float('nan')


def jsround(x):
    return math.floor(x + 0.5)


def inner_h(h): return max(1, h - 1 - 2 * BORDER)
def inner_w(w): return max(1, w - 1 - 2 * BORDER)


def polar_rows(h):
    ih = inner_h(h)
    scaled = jsround(REF_ROWS * ih / REF_INNER)
    cap = max(REF_ROWS, jsround(ih * CAP_FRAC))
    return max(2, min(scaled, cap))


def land_rows(h):
    return max(1, inner_h(h) - polar_rows(h) * 2)


def lat_buf(h, earth):
    return polar_rows(h) if earth else max(2, jsround(h * LATBUF))


def band(r, h, earth):
    buf = lat_buf(h, earth)
    ih = max(1, h - 2 * buf)
    rel = (r - buf) / max(1, ih - 1)
    if rel < 0 or rel > 1:
        return 0 if r < h / 2 else 6
    dh = DESERT_ROWS / ih
    lo, hi_ = 0.5 - dh, 0.5 + dh
    pn, ps = lo - PLAINS, hi_ + PLAINS
    if rel < POLAR: return 0
    if rel < pn: return 1
    if rel < lo: return 2
    if rel < hi_: return 3
    if rel < ps: return 4
    if rel < 1 - POLAR: return 5
    return 6


def bit_at(x, y):
    xi, yi = min(W - 1, max(0, x)), min(H - 1, max(0, y))
    return 1 if ROWS[yi][xi] == '1' else 0


def sample(nq, nr):
    if nq < 0 or nq > 1 or nr < 0 or nr > 1:
        return 0
    fx, fy = nq * (W - 1), nr * (H - 1)
    x0, y0 = math.floor(fx), math.floor(fy)
    x1, y1 = min(W - 1, x0 + 1), min(H - 1, y0 + 1)
    tx, ty = fx - x0, fy - y0
    v = ((1 - tx) * (1 - ty) * bit_at(x0, y0) + tx * (1 - ty) * bit_at(x1, y0)
         + (1 - tx) * ty * bit_at(x0, y1) + tx * ty * bit_at(x1, y1))
    return 1 if v >= SAMPLE_TH else 0


def to_norm(q, r, w, h):
    if q < BORDER or r < BORDER or q >= w - BORDER or r >= h - BORDER:
        return None
    iw, ih = inner_w(w), inner_h(h)
    north = south = polar_rows(h)
    rel = r - BORDER
    if rel < north or rel >= ih - south:
        return None
    lr = land_rows(h)
    pr = (rel - north) / max(1, lr - 1)
    pq = (q - BORDER) / iw
    mnx, mny, mxx, mxy = BBOX
    return mnx + pq * (mxx - mnx), mny + pr * (mxy - mny)


def steps_for(w, h):
    inner = min(w, h) - 2 * BORDER
    for lim, v in SUB:
        if inner >= lim:
            return v
    return SUB_DEFAULT


def thr_for(w, h):
    inner = min(w, h) - 2 * BORDER
    for lim, v in THR:
        if inner >= lim:
            return v
    return THR_DEFAULT


def land_at(q, r, w, h):
    t = to_norm(q, r, w, h)
    if not t:
        return 0
    mnx, mny, mxx, mxy = BBOX
    cw = (mxx - mnx) / inner_w(w)
    ch = (mxy - mny) / max(1, land_rows(h))
    st = steps_for(w, h)
    if st <= 1:
        return sample(t[0], t[1])
    hits = 0
    for sy in range(st):
        for sx in range(st):
            nq = t[0] - cw * 0.5 + ((sx + 0.5) / st) * cw
            nr = t[1] - ch * 0.5 + ((sy + 0.5) / st) * ch
            if sample(nq, nr):
                hits += 1
    return 1 if hits / (st * st) >= thr_for(w, h) else 0


def forest(bandname, base):
    if bandname is None or bandname == 'desert' or bandname in ('polar_north', 'polar_south'):
        return FOREST_HOSTILE
    if bandname in ('temperate_north', 'temperate_south'):
        return base - FOREST_DELTA
    return base


# ----------------------------------------------------------------------------------------------
# porownania
# ----------------------------------------------------------------------------------------------
for row in V['mulberry']:
    f = mulberry(row['seed'])
    for i, s in enumerate(row['valuesText']):
        check(same(f(), num(s)), f"mulberry seed {row['seed']} #{i}")
for row in V['perm']:
    check(perm(mulberry(row['seed'])) == row['table'], f"perm {row['seed']}")
for a, b, t, res in V['cos_lerp']:
    check(same(cos_lerp(num(a), num(b), num(t)), num(res)), f'cos_lerp {a} {b} {t}')
for s in V['noise']:
    p = perm(mulberry(s['seed']))
    for x, y, res in s['pts']:
        check(same(noise(p, num(x), num(y)), num(res)), f"noise {s['seed']} {x} {y}")
for s in V['fbm']:
    p = perm(mulberry(s['seed']))
    for x, y, o, res in s['rows']:
        got = fbm(p, num(x), num(y)) if o is None else fbm(p, num(x), num(y), o)
        check(same(got, num(res)), f"fbm {s['seed']} {x} {y} {o}")
for x, res in V['math_cos']:
    check(same(fcos(num(x)), num(res)), f'math_cos {x}')
dirs = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
check([tuple(d) for d in V['hex_directions']] == dirs, 'HEX_DIRECTIONS')


def hexd(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


g = V['hex_distance_grid']
rng = range(g['min'], g['max'] + 1)
idx = 0
for aq in rng:
    for ar in rng:
        for bq in rng:
            for br in rng:
                check(hexd(aq, ar, bq, br) == g['values'][idx], f'hexd {aq} {ar} {bq} {br}')
                idx += 1
for a, b, c, d, res in V['hex_distance_extra']:
    check(hexd(a, b, c, d) == res, f'hexd extra {a} {b} {c} {d}')
for q, r, key in V['hex_key']:
    check(f'{q},{r}' == key, f'hexKey {q} {r}')

# maska: toggles + ones z TEKSTU TS
m = V['earth_mask']
check(m['w'] == W and m['h'] == H and m['ones'] == sum(r.count('1') for r in ROWS), 'maska: wymiary/ones')
for y, row in enumerate(ROWS):
    tg, cur = [], '0'
    for i, c in enumerate(row):
        if c != cur:
            tg.append(i)
            cur = c
    check(tg == m['toggles'][y], f'maska toggles y={y}')
check([num(x) for x in m['bbox']] == list(BBOX), 'bbox')
for x, y, v in V['bit_at']:
    check(bit_at(x, y) == v, f'bit_at {x} {y}')
for row in V['earth_rows']:
    h = row[0]
    exp = [polar_rows(h), polar_rows(h), polar_rows(h), inner_h(h), inner_w(h), land_rows(h),
           lat_buf(h, False), lat_buf(h, True)]
    check(row[1:] == exp, f'earth_rows h={h}')
for a, b, v in V['sample_land']:
    check(sample(num(a), num(b)) == v, f'sample {a} {b}')
for d in V['dims']:
    w, h = d['w'], d['h']
    check(d['subsample'] == steps_for(w, h) and num(d['threshold']) == thr_for(w, h), f'subsample/thr {w}x{h}')
    for ri, r in enumerate(d['rsN']):
        for qi, q in enumerate(d['qsN']):
            t = to_norm(q, r, w, h)
            cell = d['norm'][ri][qi]
            ok = (t is None and cell is None) or (t is not None and cell is not None
                                                  and same(t[0], num(cell[0])) and same(t[1], num(cell[1])))
            check(ok, f'to_norm {w}x{h} {q},{r}')
    for ri, r in enumerate(d['rsL']):
        for qi, q in enumerate(d['qsL']):
            check(land_at(q, r, w, h) == int(d['land'][ri][qi]), f'land_at {w}x{h} {q},{r}')
for w, h, q, r, norm, land in V['hex_to_norm_edges']:
    t = to_norm(q, r, w, h)
    ok = (t is None and norm is None) or (t is not None and norm is not None
                                          and same(t[0], num(norm[0])) and same(t[1], num(norm[1])))
    check(ok and land_at(q, r, w, h) == land, f'edges {w}x{h} {q},{r}')

names = V['climate_bands']
for sw in V['climate']:
    h, e = sw['h'], sw['isEarth']
    for off, ch in enumerate(sw['bands']):
        check(band(off - 3, h, e) == int(ch), f'climate h={h} r={off - 3} earth={e}')
for h, r, b in V['climate_default']:
    check(band(r, h, False) == b, 'climate default')
for b, base_t, res in V['forest_threshold']:
    check(same(forest(b, num(base_t)), num(res)), f'forest {b} {base_t}')
for b, ok in V['can_desert']:
    check((b is None or b == 'desert') == ok, f'can_desert {b}')
for b, ok in V['is_polar']:
    check((b in ('polar_north', 'polar_south')) == ok, f'is_polar {b}')
for name, val, water in V['is_water']:
    check((val in ('morze', 'plytkie_morze')) == water, f'is_water {name}')

# ----------------------------------------------------------------------------------------------
# dane Rusta vs zrodlo TS
# ----------------------------------------------------------------------------------------------
mask = json.load(open(f'{engine}/data/derived/earth-land-mask.json', encoding='utf8'))
bits = []
for run in mask['rle'].split(';'):
    bits.extend([run[0]] * int(run[1:]))
flat = ''.join(ROWS)
check(''.join(bits) == flat, 'Rust earth-land-mask.json == EARTH_MASK_ROWS (288000 bitow)')
check((mask['szerokosc'], mask['wysokosc']) == (W, H), 'Rust mask wymiary')
check((mask['bbox']['min_x'], mask['bbox']['min_y'], mask['bbox']['max_x'], mask['bbox']['max_y']) == BBOX, 'Rust bbox')
core = json.load(open(f'{engine}/data/derived/mapgen-core-params.json', encoding='utf8'))
e, c = core['earth'], core['klimat']
exp_pairs = [
    (e['granica_grywalna'], BORDER), (e['polarny_ocean_wiersze_ref'], REF_ROWS),
    (e['polarny_ocean_wysokosc_ref'], REF_INNER), (e['polarny_ocean_limit_proc'], CAP_FRAC),
    (e['prog_szablonu_ladu'], SAMPLE_TH), (e['podprobkowanie_domyslne'], SUB_DEFAULT),
    (e['prog_ulamka_ladu_domyslny'], THR_DEFAULT), (c['polarny_proc'], POLAR),
    (c['pustynia_pol_wiersze'], DESERT_ROWS), (c['rowniny_pol_proc'], PLAINS),
    (c['bufor_proceduralny_proc'], LATBUF), (c['las_prog_wrogi'], FOREST_HOSTILE),
    (c['las_umiarkowany_delta'], -FOREST_DELTA),
]
for i, (got, want) in enumerate(exp_pairs):
    check(got == want, f'Rust params para #{i}: {got} != {want}')
check([(t['min_wewn'], t['kroki']) for t in e['podprobkowanie_progi']] == SUB, 'Rust podprobkowanie_progi')
check([(t['min_wewn'], t['prog']) for t in e['prog_ulamka_ladu_progi']] == THR, 'Rust prog_ulamka_ladu_progi')
min_rows = re.search(r'Math\.max\((\d+), Math\.min\(scaled, cap\)\)', em)
check(e['polarny_ocean_min_wiersze'] == int(min_rows.group(1)), 'Rust polarny_ocean_min_wiersze')
buf_min = re.search(r'return Math\.max\((\d+), Math\.round\(height \* CLIMATE_PROCEDURAL', gh)
check(c['bufor_proceduralny_min_wiersze'] == int(buf_min.group(1)), 'Rust bufor_proceduralny_min_wiersze')

print(f'SPRAWDZEN: {checks}')
print(f'ROZBIEZNOSCI: {len(bad)}')
for b in bad[:20]:
    print('  -', b)
sys.exit(1 if bad else 0)
