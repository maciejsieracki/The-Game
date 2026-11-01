"""Niezalezny weryfikator REPIN-EKONOMIA-E (Python, uruchamiac: python3 -I verify-e.py <REPO_ROOT>).

NIE korzysta z Rust ani z kodu weba: reimplementuje z opisu (citizen-resource-upkeep.ts @ 4bbef081d L166-198, 231-268,
303-345, 400-415; building-resource-gate.ts L350-373, 411-450; building-stock-cost.ts L217-228, 254-281) i porownuje
z wektorami `tests/p6_repin_ekonomia_e_vectors/*.json` (wygenerowanymi z URUCHOMIONEGO weba) oraz sprawdza pliki danych
wzgledem pinu (`git show 4bbef081d:gra/data/...`). Exit 0 = zgodnosc, inaczej 1 z lista rozbieznosci.
"""
import json
import math
import subprocess
import sys

ROOT = sys.argv[1]
VEC = ROOT + '/rust-port/engine/tests/p6_repin_ekonomia_e_vectors'
DATA = ROOT + '/rust-port/engine/data'
errors = []


def err(msg):
    if len(errors) < 40:
        errors.append(msg)


def num(v):
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return float(v)
    if v == 'NaN':
        return math.nan
    if v == 'Infinity':
        return math.inf
    if v == '-Infinity':
        return -math.inf
    if v == '-0':
        return -0.0
    if isinstance(v, str) and v.startswith('~'):
        return float(v[1:])
    raise ValueError(v)


def same(a, b):
    if math.isnan(a) and math.isnan(b):
        return True
    return a == b  # zero: znak pomijany (jak w testach: -0 == 0)


def finite(x):
    return not (math.isnan(x) or math.isinf(x))


def jfloor(x):
    # Math.floor: NaN/+-Infinity przechodza bez zmian
    return float(math.floor(x)) if finite(x) else x


# ------------------------------------------------------------------ citizen
cit = json.load(open(VEC + '/citizen.json'))
FALLBACK = 1.0
KARA = {'avail': 2, 'miss': -2, 'growth': -1}  # citizen-resource-upkeep.json _kara @ pin


def rows_of(variant):
    if variant['rows'] is None:
        real = json.loads(subprocess.check_output(['git', '-C', ROOT, 'show', '4bbef081d:gra/data/citizen-resource-upkeep.json']))
        return [{'epoka': r['epoka'], 'rate': ('n', float(r['stawkaNaObywatela'])), 'surowce': r['surowce']} for r in real['epoki']]
    out = []
    for r in variant['rows']:
        rate = ('n', num(r['rate']['v'])) if r['rate']['t'] == 'n' else ('x', None)
        out.append({'epoka': r['epoka'], 'rate': rate, 'surowce': r['surowce']})
    return out


def pick_row(rows, era):
    if not rows:
        return None
    wanted = 1 if not finite(era) else max(1, math.floor(era))
    for r in rows:
        if r['epoka'] == wanted:
            return r
    below = [r for r in rows if r['epoka'] <= wanted]
    if below:
        best = below[0]
        for r in below[1:]:
            if r['epoka'] > best['epoka']:
                best = r
        return best
    return rows[0]


def rate_of(rows, era):
    r = pick_row(rows, era)
    if r is None or r['rate'][0] != 'n':
        return FALLBACK
    v = r['rate'][1]
    return v if finite(v) and v >= 0 else FALLBACK


def stock_get(stock, key):
    if stock is None or key not in stock:
        return 0.0
    v = num(stock[key])
    return v if finite(v) and v > 0 else 0.0


def pop_floor(p):
    return float(math.floor(p)) if (p is not None and finite(p) and p > 0) else 0.0


def deltas(na, nm):
    return na * KARA['avail'] + nm * KARA['miss'], nm * KARA['growth']


def coverage(rows, era, stock, pop):
    req = pick_row(rows, era)['surowce'] if pick_row(rows, era) else []
    rate = rate_of(rows, era)
    has_pop = pop is not None and finite(pop)
    need = jfloor(pop_floor(pop) * rate) if has_pop else 0
    av, mi = [], []
    for k in req:
        have = stock_get(stock, k)
        ok = (have >= need) if has_pop else (have > 0)
        (av if ok else mi).append(k)
    h, g = deltas(len(av), len(mi))
    return {'required': list(req), 'rate': rate, 'available': av, 'missing': mi, 'happ': h, 'growth': g}


def drain(rows, era, pop, stock):
    req = pick_row(rows, era)['surowce'] if pick_row(rows, era) else []
    rate = rate_of(rows, era)
    need = jfloor(pop_floor(pop) * rate)
    av, mi, ded = [], [], {}
    for k in req:
        have = stock_get(stock, k)
        d = min(need, have)
        if d > 0:
            ded[k] = d
        (av if d >= need else mi).append(k)
    h, g = deltas(len(av), len(mi))
    return {'required': list(req), 'rate': rate, 'available': av, 'missing': mi, 'happ': h, 'growth': g, 'ded': ded}


def lines(cov_av, cov_mi, rate, city_pop):
    r = FALLBACK if rate is None else rate
    qty = jfloor(pop_floor(city_pop) * r)
    return [(k, qty, True) for k in cov_av] + [(k, -qty, False) for k in cov_mi]


def cmp_cov(label, got, want):
    if got['required'] != want['required']:
        err(label + ' required')
    if got['available'] != want['available']:
        err(label + ' available')
    if got['missing'] != want['missing']:
        err(label + ' missing')
    if got['happ'] != num(want['happ']) or got['growth'] != num(want['growth']):
        err(label + ' deltas')
    if want['rate'] is None or not same(got['rate'], num(want['rate'])):
        err(label + ' rate')


variants = [rows_of(v) for v in cit['variants']]
for i, c in enumerate(cit['cases']):
    rows = variants[c['v']]
    era = num(c['era'])
    pop = None if c['pop'] is None else num(c['pop'])
    stock = c['stock']
    lab = 'citizen#%d' % i
    if not same(rate_of(rows, era), num(c['rate'])):
        err(lab + ' rate')
    cmp_cov(lab + ' legacy', coverage(rows, era, stock, None), c['covLegacy'])
    cmp_cov(lab + ' covPop', coverage(rows, era, stock, pop), c['covPop'])
    d = drain(rows, era, 0.0 if pop is None else pop, stock)
    cmp_cov(lab + ' drain', d, c['drain'])
    want_ded = {k: num(x) for k, x in c['drain']['ded'].items()}
    if set(d['ded']) != set(want_ded) or any(not same(d['ded'][k], want_ded[k]) for k in want_ded):
        err(lab + ' ded')
    ls = lines(d['available'], d['missing'], d['rate'], 7.0 if pop is None else pop)
    wl = [(x['key'], num(x['value']), x['available']) for x in c['lines']]
    if len(ls) != len(wl) or any(a[0] != b[0] or not same(a[1], b[1]) or a[2] != b[2] for a, b in zip(ls, wl)):
        err(lab + ' lines')
for i, c in enumerate(cit['display']):
    rate = None if c['rate'] is None else num(c['rate'])
    ls = lines(c['available'], c['missing'], rate, num(c['cityPop']))
    wl = [(x['key'], num(x['value']), x['available']) for x in c['lines']]
    if len(ls) != len(wl) or any(a[0] != b[0] or not same(a[1], b[1]) or a[2] != b[2] for a, b in zip(ls, wl)):
        err('display#%d' % i)
for i, c in enumerate(cit['rateGrid']):
    rows = variants[c['v']]
    era = num(c['era'])
    if not same(rate_of(rows, era), num(c['rate'])):
        err('rateGrid#%d rate' % i)
    r = pick_row(rows, era)
    if (r['surowce'] if r else []) != c['required']:
        err('rateGrid#%d required' % i)

# ------------------------------------------------------------------ spichlerz
sp = json.load(open(VEC + '/spichlerz.json'))
FB = 25.0
K = sp['keys']


def is_obj(x):
    return isinstance(x, dict)


def throughput(raw, key, diff, fb):
    g = raw.get('budynki') if is_obj(raw) else None
    row = g.get(key) if is_obj(g) else None
    v = row.get(diff) if is_obj(row) else None
    if isinstance(v, (int, float)) and not isinstance(v, bool) and finite(float(v)):
        return float(v)
    return fb


def params_of_raw(raw, diff):
    def read(key):
        if raw is None:
            return FB
        v = throughput(raw, key, diff, FB)
        return v if v >= 0 else FB
    return {'ceramikaI': read(K['ceramikaI']), 'ceramikaII': read(K['ceramikaII']), 'solII': read(K['solII'])}


for i, c in enumerate(sp['params']):
    raw = None if c['raw'].get('undef') else json.loads(c['raw']['json'])
    got = params_of_raw(raw, c['difficulty'])
    for k in ('ceramikaI', 'ceramikaII', 'solII'):
        if not same(got[k], num(c['out'][k])):
            err('params#%d %s %s' % (i, c['name'], k))
for i, c in enumerate(sp['throughput']):
    if not same(throughput(json.loads(c['raw']), 'k', c['difficulty'], num(c['fallback'])), num(c['out'])):
        err('throughput#%d' % i)


def amount(built, p):
    return num(p['ceramikaII']) if 'spichlerz_ii' in built else num(p['ceramikaI'])


for i, c in enumerate(sp['amount']):
    if not same(amount(c['built'], c['params']), num(c['out'])):
        err('amount#%d' % i)


def owner_stock(cities, owner, key):
    t = 0.0
    for c in cities:
        if c['ownerId'] != owner:
            continue
        t += num((c.get('surowce') or {}).get(key, 0))
    return t


def deduct(cities, owner, key, need):
    if not need > 0:
        return
    own = [c for c in cities if c['ownerId'] == owner]
    holders = [c for c in own if num((c.get('surowce') or {}).get(key, 0)) > 0]
    holders.sort(key=lambda c: (-num(c['surowce'][key]), c['id']))
    for c in holders:
        if need <= 0:
            break
        have = num(c['surowce'][key])
        take = min(have, need)
        c['surowce'][key] = have - take
        need -= take


def pay(cities, owner, built, dry, p):
    has_i, has_ii = 'spichlerz' in built, 'spichlerz_ii' in built
    if not has_i and not has_ii:
        return False, False
    cer_amt = amount(built, p)
    cp = sp_ = False
    if owner_stock(cities, owner, 'ceramika') >= cer_amt:
        if not dry:
            deduct(cities, owner, 'ceramika', cer_amt)
        cp = True
    if has_ii and owner_stock(cities, owner, 'sol') >= num(p['solII']):
        if not dry:
            deduct(cities, owner, 'sol', num(p['solII']))
        sp_ = True
    return cp, sp_


def view_eq(cities, want):
    if len(cities) != len(want):
        return False
    for a, b in zip(cities, want):
        if a['id'] != b['id'] or a['ownerId'] != b['ownerId']:
            return False
        sa, sb = a.get('surowce'), b.get('surowce')
        if (sa is None) != (sb is None):
            return False
        if sa is not None:
            if set(sa) != set(sb) or any(not same(num(sa[k]), num(sb[k])) for k in sa):
                return False
    return True


for i, c in enumerate(sp['pay']):
    p = c['params']
    for pc in c['pay']:
        cities = json.loads(json.dumps(c['cities']))
        cp, so = pay(cities, c['owner'], c['built'], pc['dry'], p)
        if (cp, so) != (pc['out']['ceramikaPaid'], pc['out']['solPaid']):
            err('pay#%d dry=%s out' % (i, pc['dry']))
        if not view_eq(cities, pc['after']):
            err('pay#%d dry=%s after' % (i, pc['dry']))
    for bid in ('spichlerz', 'spichlerz_ii'):
        want = c['inactive'][bid]
        cities = json.loads(json.dumps(c['cities']))
        if bid not in c['built']:
            miss = []
        else:
            cp, so = pay(cities, c['owner'], c['built'], True, p)
            miss = ([] if cp else ['Ceramika']) if bid == 'spichlerz' else (([] if cp else ['Ceramika']) + ([] if so else ['Sól']))
        if (len(miss) > 0) != want['inactive'] or miss != want['missingLabels']:
            err('inactive#%d %s' % (i, bid))

# ------------------------------------------------------------------ pliki danych vs pin
def pin(path):
    return subprocess.check_output(['git', '-C', ROOT, 'show', '4bbef081d:gra/data/' + path])


for f in ('econ-params.json', 'citizen-resource-upkeep.json', 'ai-params.json'):
    if open(DATA + '/' + f, 'rb').read() != pin(f):
        err('data %s != pin 4bbef081d' % f)
# terrain-improvements.json (obrona r1, zarzut 1): przepiete WYLACZNIE `surowiec_ilosc_tura` (ekonomia, tartak/kamieniolom 200->50);
# zasiegi fortu/posterunku, opisy i warunki (forty/terytorium/8I) zostaja == dc8a3adc.
_dc = json.loads(subprocess.check_output(['git', '-C', ROOT, 'show', 'dc8a3adc:gra/data/terrain-improvements.json']))
_pin = json.loads(pin('terrain-improvements.json'))
_rs = json.load(open(DATA + '/terrain-improvements.json', encoding='utf-8'))
for _k in _pin:
    if _k == '_meta':
        if _rs[_k] != _dc[_k]:
            err('terrain _meta zmieniony wbrew zakresowi')
        continue
    if _rs[_k].get('surowiec_ilosc_tura') != _pin[_k].get('surowiec_ilosc_tura'):
        err('terrain %s.surowiec_ilosc_tura != pin' % _k)
    _a = {f: v for f, v in _rs[_k].items() if f != 'surowiec_ilosc_tura'}
    _b = {f: v for f, v in _dc[_k].items() if f != 'surowiec_ilosc_tura'}
    if _a != _b:
        err('terrain %s zmieniony poza surowiec_ilosc_tura' % _k)

print(json.dumps({'citizenCases': len(cit['cases']), 'display': len(cit['display']), 'rateGrid': len(cit['rateGrid']), 'params': len(sp['params']), 'throughput': len(sp['throughput']), 'amount': len(sp['amount']), 'pay': len(sp['pay']), 'errors': errors}))
sys.exit(1 if errors else 0)
