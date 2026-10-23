#!/usr/bin/env python3
"""NIEZALEZNY weryfikator wektorow P6.7A (Python 3, bez zaleznosci od Rust i bez uruchamiania weba).

Wektory `tests/p6_7a_vectors/*.json` pochodza z URUCHOMIONEGO weba (gen-p67a-vectors.mjs). Ten skrypt
reimplementuje logike population-growth-v85.ts / empire-food.ts / population-growth-tempo.ts /
r-stawki-strojenie.ts / growth-happiness.ts NA PODSTAWIE KODU TS (nie Rust) i porownuje wyniki z wektorami
BITOWO (struct.pack('<d')). Cel: 0 rozbieznosci. Uruchomienie:
    python3 -I verify-p67a-vectors.py <WEB_ROOT = katalog z gra/data> <KATALOG_WEKTOROW>
"""
import json
import math
import struct
import sys
import unicodedata

WEB = sys.argv[1]
VEC = sys.argv[2]

NAN = float('nan')
INF = float('inf')

# ---------------------------------------------------------------------------
# dekodowanie wektorow
# ---------------------------------------------------------------------------


def dec(x):
    if isinstance(x, str):
        if x == 'NaN':
            return NAN
        if x == 'Infinity':
            return INF
        if x == '-Infinity':
            return -INF
        if x == '-0':
            return -0.0
        if x.startswith('~'):
            return float(x[1:])
        return x
    if isinstance(x, bool) or x is None:
        return x
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, list):
        return [dec(i) for i in x]
    if isinstance(x, dict):
        return {k: dec(v) for k, v in x.items()}
    return x


def load(name):
    with open(f'{VEC}/{name}', encoding='utf-8') as f:
        return dec(json.load(f))


def bits(x):
    return struct.pack('<d', x)


def feq(a, b):
    if math.isnan(a) and math.isnan(b):
        return True
    return bits(a) == bits(b)


def canon(v):
    """Kanonizacja Map/Set (sortowanie po kluczu) - tak jak w tescie Rust."""
    if isinstance(v, list):
        return [canon(i) for i in v]
    if isinstance(v, dict):
        if '__map' in v:
            pairs = [canon(p) for p in v['__map']]
            pairs.sort(key=lambda p: json.dumps(p[0], default=str))
            return {'__map': pairs}
        if '__set' in v:
            items = [canon(i) for i in v['__set']]
            items.sort(key=lambda i: json.dumps(i, default=str))
            return {'__set': items}
        return {k: canon(x) for k, x in v.items()}
    return v


def deq(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if isinstance(a, float) and isinstance(b, float):
        return feq(a, b)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(deq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(deq(a[k], b[k]) for k in a)
    return a == b and type(a) == type(b)


FAILS = []
COUNT = {}


def check(section, label, got, want):
    COUNT[section] = COUNT.get(section, 0) + 1
    if not deq(canon(got), canon(want)):
        FAILS.append((section, label, got, want))


# ---------------------------------------------------------------------------
# semantyka JS
# ---------------------------------------------------------------------------


def jmax(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == b == 0:
        return a if math.copysign(1, a) > 0 else b
    return a if a > b else b


def jmin(a, b):
    if math.isnan(a) or math.isnan(b):
        return NAN
    if a == b == 0:
        return a if math.copysign(1, a) < 0 else b
    return a if a < b else b


def jfloor(x):
    if not math.isfinite(x) or x == 0:
        return x
    return float(math.floor(x))


def jceil(x):
    if not math.isfinite(x) or x == 0:
        return x
    r = float(math.ceil(x))
    if r == 0 and x < 0:
        return -0.0
    return r


def jround(x):
    if not math.isfinite(x) or x == 0:
        return x
    f = float(math.floor(x))
    r = f + 1 if x - f >= 0.5 else f
    if r == 0 and x < 0:
        return -0.0
    return r


def is_int(x):
    return math.isfinite(x) and float(math.trunc(x)) == x


def num_str(x):
    """String(x) dla liczb uzywanych w etykietach (calkowite)."""
    if math.isnan(x):
        return 'NaN'
    if x == INF:
        return 'Infinity'
    if x == -INF:
        return '-Infinity'
    if x == 0:
        return '0'
    if x == int(x) and abs(x) < 1e21:
        return str(int(x))
    return repr(x)


def to_fixed1(x):
    # x.toFixed(1) dla |x| < 1e21: dziesietne rozwiniecie dokladne, polowki w gore (co do modulu)
    from decimal import Decimal, ROUND_HALF_UP
    if not math.isfinite(x):
        return num_str(x)
    d = Decimal(x).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)
    s = format(d, 'f')
    if s.startswith('-') and float(d) == 0:
        # JS: (-0.04).toFixed(1) === '-0.0', ale (-0).toFixed(1) === '0.0'
        return s if x < 0 else s.lstrip('-')
    return s


# ---------------------------------------------------------------------------
# population-growth-v85.ts
# ---------------------------------------------------------------------------
MIN_R, MAX_R, STEP_R = 0.0, 6.0, 0.5
LEVELS = [MIN_R + i * STEP_R for i in range(int(jround((MAX_R - MIN_R) / STEP_R)) + 1)]
GROWTH_PCT = {0.0: -10.0, 0.5: -6.0, 1.0: -2.0, 1.5: 0.0, 2.0: 1.5, 2.5: 3.0, 3.0: 3.5, 3.5: 4.0, 4.0: 4.5,
              4.5: 5.0, 5.0: 5.5, 5.5: 6.0, 6.0: 7.0}
DEFAULT_RACJI = 4.0
R_KOSZT = 2.0
DIFF_MULT = {'easy': 0.5, 'normal': 1.0, 'hard': 1.5}

with open(f'{WEB}/civ-matrix.json', encoding='utf-8') as f:
    CIVM = json.load(f)


def resolve_row(key):
    k = key.lower()
    for c in CIVM['cywilizacje']:
        if c['ikonaId'].lower() == k or c['typCywilizacji'].lower() == k or c['Cywilizacja'].lower() == k:
            return c
    return None


def civ_param(key, pid):
    row = resolve_row(key)
    dflt = CIVM['defaults'].get(pid)
    if row is None:
        return float(dflt) if dflt is not None else 0.0
    v = row['params'].get(pid, dflt)
    return float(v) if v is not None else 0.0


def clamp_r(n):
    c = jmin(MAX_R, jmax(MIN_R, n))
    return jround(c / STEP_R) * STEP_R


def migrate_legacy(old):
    if old == 1:
        return 2.0
    if old == 2:
        return 4.0
    if old == 3:
        return 6.0
    return clamp_r(old)


def migrate_procent(p):
    if p is None:
        return DEFAULT_RACJI
    return clamp_r((p / 100) * MAX_R)


def city_level(c):
    if c.get('poziomRacji') is not None:
        return clamp_r(c['poziomRacji'])
    return migrate_procent(c.get('procentRozwoj'))


def food_per_pop(level):
    return clamp_r(level) * R_KOSZT


def growth_pct_of(level):
    k = clamp_r(level)
    if math.isnan(k):
        return 0.0
    return GROWTH_PCT.get(k, 0.0)


def label(level):
    v = clamp_r(level)
    if is_int(v):
        return num_str(v)
    return to_fixed1(v).replace('.', ',', 1)


def ration_cost(pop, level, st):
    base = jmax(0.0, pop) * food_per_pop(level)
    mult = 1.0
    if st is not None:
        mult = 0.5 if st['maSpichlerzIIPop'] else (0.75 if st['maSpichlerzPop'] else 1.0)
    return base * mult


def sp_growth(st):
    return 2.0 if st['maSpichlerzIIPop'] else (1.0 if st['maSpichlerzPop'] else 0.0)


def matrix_for(key):
    if not key:
        return {'hungerLossMultiplier': 1.0, 'healthGrowthMultiplier': 1.0, 'happinessBase': 0.0, 'populationCapDelta': 0.0}
    hp = civ_param(key, 'lud_spadek_proc')
    zp = civ_param(key, 'lud_zdrowie_proc')
    zd = civ_param(key, 'lud_zadowolenie_bazowe')
    return {
        'hungerLossMultiplier': jmax(0.0, 1 + (hp if math.isfinite(hp) else 0.0)),
        'healthGrowthMultiplier': jmax(0.0, 1 + (zp if math.isfinite(zp) else 0.0)),
        'happinessBase': zd if math.isfinite(zd) else 0.0,
        'populationCapDelta': cap_delta(key),
    }


def cap_delta(key):
    v = civ_param(key, 'lud_limit_populacji') if key else 0.0
    return v if v in (-1.0, 0.0, 1.0, 2.0) else 0.0


def pop_cap(ak, sp, params, delta):
    b = params['akweduktMaxLudnosci'] if ak else (params['spichlerzProgLudnosci'] if sp else params['akweduktProgLudnosci'])
    safe = delta if delta in (-1.0, 0.0, 1.0, 2.0) else 0.0
    return jmin(14.0, b + safe)


def percent(inp):
    racje = growth_pct_of(inp['poziomRacji'])
    male = jmax(0.0, 6 - inp['population'])
    sp = sp_growth(inp['spichlerzState'])
    pm = inp.get('populationMatrix') or matrix_for(inp.get('civKey'))
    zdr = jfloor(jmax(0.0, inp['zdrowie']) / 10) * pm['healthGrowthMultiplier']
    szcz = jfloor(jmax(0.0, inp['szczescieNetto']) / 10)
    civraw = civ_param(inp['civKey'], 'lud_wzrost_proc') if inp.get('civKey') else 0.0
    cm = DIFF_MULT[inp.get('difficulty') or 'normal']
    cyw = jround(civraw * cm * 100)
    zaop = inp.get('citizenResourceGrowthPct')
    zaop = 0.0 if zaop is None else zaop
    total = racje + male + sp + zdr + szcz + cyw + zaop
    return {'total': total, 'racje': racje, 'maleMiasto': male, 'spichlerz': sp, 'zdrowie': zdr, 'szczescie': szcz,
            'cywilizacja': cyw, 'zaopatrzenie': zaop}


def fractional(pop, frac, gpct, fed, ak, econ, sp, delta):
    frac = 0.0 if frac is None else frac
    wzrost = ubytek = False
    if fed and gpct != 0 and pop > 0:
        cap = pop_cap(ak, sp, econ, delta)
        if gpct > 0 and pop < cap:
            frac += pop * gpct / 100
            while frac >= 1 and pop < cap:
                pop += 1
                frac -= 1
                wzrost = True
        elif gpct < 0 and pop > 1:
            frac -= pop * (-gpct) / 100
            while frac >= 1 and pop > 1:
                pop -= 1
                frac -= 1
                ubytek = True
    return {'nowaLudnosc': pop, 'wzrostUlamkowy': frac, 'wzrost': wzrost, 'ubytek': ubytek}


def gain_slots(pop, gpct, fed, at_cap):
    if not fed or gpct == 0 or pop <= 0:
        return 0.0
    if gpct > 0 and at_cap:
        return 0.0
    return pop * gpct / 100


def turns_until(frac, gain):
    if gain <= 0:
        return None
    frac = 0.0 if frac is None else frac
    if frac >= 1:
        return 0.0
    return jceil((1 - frac) / gain)


def hunger(pop, fed, tury, mult, debt):
    if fed:
        return {'nowaLudnosc': pop, 'turyBezDoplaty': 0.0, 'ubytek': False, 'hungerLossUlamkowy': 0.0}
    nxt = (0.0 if tury is None or (isinstance(tury, float) and False) else tury) + 1
    d = jmax(0.0, debt) if math.isfinite(debt) else 0.0
    d += jmax(0.0, mult) if math.isfinite(mult) else 1.0
    ub = False
    while d >= 1 and pop > 1:
        pop -= 1
        d -= 1
        ub = True
    return {'nowaLudnosc': pop, 'turyBezDoplaty': 0.0 if ub else nxt, 'ubytek': ub, 'hungerLossUlamkowy': d}


def ensure(c):
    c = dict(c)
    if not c.get('rationMigratedV114'):
        pr = c.get('poziomRacji')
        if pr is not None and is_int(pr) and 1 <= pr <= 3:
            c['poziomRacji'] = migrate_legacy(pr)
        elif pr is None and c.get('procentRozwoj') is not None:
            c['poziomRacji'] = migrate_procent(c['procentRozwoj'])
        c['rationMigratedV114'] = True
    c['poziomRacji'] = DEFAULT_RACJI if c.get('poziomRacji') is None else clamp_r(c['poziomRacji'])
    if c.get('wzrostUlamkowy') is None:
        c['wzrostUlamkowy'] = 0.0
    if c.get('turyBezDoplaty') is None:
        c['turyBezDoplaty'] = 0.0
    if c.get('hungerLossUlamkowy') is None:
        c['hungerLossUlamkowy'] = 0.0
    return c


def pick(row, d, fallback):
    if not isinstance(row, dict):
        return fallback
    v = row.get(d)
    return v if isinstance(v, float) and math.isfinite(v) else fallback


def build_ration(raw, d):
    sec = raw.get('ekonomia_miasta')
    if sec is None:
        sec = raw
    g = (lambda k: sec.get(k) if isinstance(sec, dict) else None)
    return {
        'racjeZywnosc1': pick(g('racje_zywnosc_1'), d, 2.0), 'racjeZywnosc2': pick(g('racje_zywnosc_2'), d, 4.0),
        'racjeZywnosc3': pick(g('racje_zywnosc_3'), d, 6.0), 'racjeWzrostProc1': pick(g('racje_wzrost_proc_1'), d, 3.0),
        'racjeWzrostProc2': pick(g('racje_wzrost_proc_2'), d, 5.0), 'racjeWzrostProc3': pick(g('racje_wzrost_proc_3'), d, 7.0),
    }


def build_food(raw, d):
    em = raw.get('ekonomia_miasta')
    if em is None:
        em = raw
    gl = raw.get('globalne')
    if gl is None:
        gl = raw
    ge = (lambda o, k: o.get(k) if isinstance(o, dict) else None)

    def nn(a, b):
        return a if a is not None else b
    return {
        'centralCapBaza': pick(nn(ge(gl, 'magazyn_centralny_baza_zywnosc'), ge(em, 'magazyn_centralny_baza_zywnosc')), d, 1000.0),
        'centralCapBonusMagazyn': pick(nn(ge(gl, 'magazyn_centralny_bonus_zywnosc_na_budynek'), ge(em, 'magazyn_centralny_bonus_zywnosc_na_budynek')), d, 100.0),
        'glodWojskaHpFrac': pick(ge(em, 'glod_wojska_hp_frac'), d, 0.08),
        'glodWojskaKarencjaTur': pick(ge(em, 'glod_wojska_karencja_tur'), d, 3.0),
        'glodWojskaStatMult': pick(ge(em, 'glod_wojska_stat_mult'), d, 0.75),
        'rationParams': build_ration(raw, d),
    }


def verify_growth():
    p = load('params.json')
    g = load('growth.json')
    check('params', 'levels', LEVELS, p['WYZYWIENIE_LEVELS'])
    check('params', 'growthPct', [[k, v] for k, v in sorted(GROWTH_PCT.items())], sorted([list(x) for x in p['WYZYWIENIE_GROWTH_PCT']]))
    na_limicie = next((l for l in LEVELS if growth_pct_of(l) >= 0), MIN_R)
    check('params', 'naLimicie', na_limicie, p['WYZYWIENIE_POZIOM_NA_LIMICIE'])
    for i, c in enumerate(g['ration']):
        x = c['x']
        check('ration', f'clamp{i}', clamp_r(x), c['clamp'])
        check('ration', f'cost{i}', food_per_pop(x), c['cost'])
        check('ration', f'gp{i}', growth_pct_of(x), c['growthPct'])
        want_label = c['label']
        if isinstance(want_label, float):
            want_label = num_str(want_label)
        check('ration', f'label{i}', label(x), want_label)
        check('ration', f'legacy{i}', migrate_legacy(x), c['legacy'])
        check('ration', f'procent{i}', migrate_procent(x), c['procent'])
    check('ration', 'procentUndef', migrate_procent(None), g['procentUndefined'])
    for i, c in enumerate(g['cityLevel']):
        check('cityLevel', str(i), city_level(c['city']), c['out'])
    for i, c in enumerate(g['cost']):
        check('rationCost', str(i), ration_cost(c['pop'], c['level'], c.get('st')), c['out'])
    for i, c in enumerate(g['matrix']):
        key = c['civ'] if isinstance(c['civ'], str) else None
        check('matrix', str(i), matrix_for(key), c['out'])
        check('matrix', f'delta{i}', cap_delta(key), c['capDelta'])
    # runda 2: macierz SYNTETYCZNA (edge.json `matrixSynth`): ta sama funkcja `matrix_for`/`cap_delta` na
    # civ-matrix zmienionej w miejscu wedlug `patch` (po kazdym przypadku przywracana)
    edge_m = load('edge.json')
    orig_defaults = json.loads(json.dumps(CIVM['defaults']))
    orig_rows = json.loads(json.dumps(CIVM['cywilizacje']))
    clamp_branches = 0
    for i, case in enumerate(edge_m['matrixSynth']):
        for k, v in case['patch']['defaults'].items():
            CIVM['defaults'][k] = v
        for pr in case['patch']['rows']:
            row = next(c for c in CIVM['cywilizacje'] if c['ikonaId'] == pr['ikonaId'])
            row['params'].update(pr['params'])
        for j, c in enumerate(case['cases']):
            key = c['civ'] if isinstance(c['civ'], str) else None
            got = matrix_for(key)
            check('matrixSynth', f'{i}.{j}', got, c['out'])
            check('matrixSynth', f'delta{i}.{j}', cap_delta(key), c['capDelta'])
            if got['hungerLossMultiplier'] == 0.0 or got['healthGrowthMultiplier'] == 0.0:
                clamp_branches += 1
        CIVM['defaults'].clear()
        CIVM['defaults'].update(json.loads(json.dumps(orig_defaults)))
        CIVM['cywilizacje'][:] = json.loads(json.dumps(orig_rows))
    check('matrixSynth', 'galaz-klamry-osiagnieta', clamp_branches > 0, True)
    for i, c in enumerate(g['diffMult']):
        d = c['d'] if isinstance(c['d'], str) else 'normal'
        check('diffMult', str(i), DIFF_MULT[d], c['out'])
    for i, c in enumerate(g['popCap']):
        d = c['delta'] if not isinstance(c['delta'], dict) else 0.0
        check('popCap', str(i), pop_cap(c['ak'], c['sp'], p['popCapEcon'][c['d']], d), c['out'])
    for i, c in enumerate(g['popCapCustom']):
        d = c['delta'] if not isinstance(c['delta'], dict) else 0.0
        check('popCap', f'custom{i}', pop_cap(c['ak'], c['sp'], c['params'], d), c['out'])
    for i, c in enumerate(g['percent']):
        check('percent', str(i), percent(c['in']), c['out'])
    for i, c in enumerate(g['fractional']):
        d = c['delta'] if not isinstance(c['delta'], dict) else 0.0
        r = fractional(c['city']['population'], c['city'].get('wzrostUlamkowy'), c['growthPct'], c['fed'], c['ak'], c['econ'], c['sp'], d)
        check('fractional', str(i), r, c['out'])
    for i, c in enumerate(g['gain']):
        check('gain', str(i), gain_slots(c['pop'], c['pct'], c['fed'], c['cap']), c['out'])
    for i, c in enumerate(g['turns']):
        r = turns_until(c['frac'], c['gain'])
        want = c['out']
        if r is None:
            check('turns', str(i), {'isNull': True}, want)
        else:
            check('turns', str(i), r, want)
    for i, c in enumerate(g['hunger']):
        tury = None if isinstance(c['tury'], dict) else c['tury']
        mult = 1.0 if isinstance(c['mult'], dict) else c['mult']
        debt = 0.0 if isinstance(c['debt'], dict) else c['debt']
        check('hunger', str(i), hunger(c['pop'], c['fed'], tury, mult, debt), c['out'])
    for i, c in enumerate(g['ensure']):
        r = ensure(c['city'])
        want = {k: c['after'][k] for k in ('poziomRacji', 'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty', 'hungerLossUlamkowy')}
        got = {k: r[k] for k in want}
        check('ensure', str(i), got, want)
    econ = p['econParamsRawForBuild']
    for i, c in enumerate(g['build']):
        raw = econ if c['raw'] == 'econ' else c['raw']
        check('build', f'ration{i}', build_ration(raw, c['d']), c['ration'])
        check('build', f'food{i}', build_food(raw, c['d']), c['food'])
    check('build', 'default', build_ration({}, 'normal'), g['buildDefaultDifficulty']['ration'])
    check('build', 'defaultFood', build_food({}, 'normal'), g['buildDefaultDifficulty']['food'])


# ---------------------------------------------------------------------------
# tempo / happiness / r-stawki / era
# ---------------------------------------------------------------------------
PACE = {'wysoki': 1.0, 'normalny': 2.0, 'wolny': 4.0}
FALA2 = 2.0


def tempo(prog, mult):
    return jmax(1.0, jround(prog * mult))


def strip_lower(s):
    n = unicodedata.normalize('NFD', s)
    n = ''.join(ch for ch in n if not ('̀' <= ch <= 'ͯ'))
    # JS String.prototype.trim: biale znaki JS (w tym BOM U+FEFF, bez U+0085)
    ws = set('\t\n\x0b\x0c\r                  　﻿')
    a, b = 0, len(n)
    while a < b and n[a] in ws:
        a += 1
    while b > a and n[b - 1] in ws:
        b -= 1
    return n[a:b].lower()


def norm_era(e):
    if not e:
        return 'kamien'
    n = strip_lower(e)
    if n in ('braz', 'brąz'):
        return 'braz'
    if n in ('zelazo', 'żelazo'):
        return 'zelazo'
    if n in ('kamien', 'kamień'):
        return 'kamien'
    return n


def scaled(v):
    return jmax(1.0, jround(v * FALA2))


def verify_tempo():
    p = load('params.json')
    t = load('tempo_stawki.json')
    for i, c in enumerate(t['tempo']):
        m = PACE[c['pace']] if 'pace' in c else c['mult']
        check('tempo', str(i), tempo(c['prog'], m), c['out'])
    for k, v in p['WZROST_LUDNOSCI_PACE']:
        check('tempo', 'table' + k, PACE[k], v)
    for i, c in enumerate(t['happiness']):
        w = c['wealth']
        check('happiness', str(i), w if math.isfinite(w) else 0.0, c['out'])
    check('stawki', 'consts', [2.0, 2.0, 4.0], [p['R_STAWKI']['koszt'], p['R_STAWKI']['fala2'], p['R_STAWKI']['fala1fala2']])
    for i, c in enumerate(t['stawki']['scalar']):
        b = c['base']
        bad = (not math.isfinite(b)) or b <= 0
        check('stawki', f'impr{i}', 0.0 if bad else scaled(b), c['improvement'])
        check('stawki', f'wonder{i}', 0.0 if bad else scaled(b), c['wonderWork'])
        check('stawki', f'food{i}', 0.0 if bad else scaled(b), c['wonderFood'])
    for i, c in enumerate(t['stawki']['record']):
        out = []
        if c['raw'] is not None:
            for k, v in c['raw']:
                if isinstance(v, float) and math.isfinite(v) and v > 0:
                    out.append([k, scaled(v)])
        check('stawki', f'record{i}', out, c['out'])
    for i, c in enumerate(t['era']):
        raw = c['raw'] if isinstance(c['raw'], str) else None
        n = norm_era(raw)
        check('era', f'norm{i}', n, c['norm'])
        check('era', f'fala2{i}', n in ('braz', 'zelazo'), c['fala2'])
    for i, c in enumerate(t['spichlerz']):
        check('spichlerz', str(i), any(b in ('spichlerz', 'spichlerz_ii') for b in c['built']), c['has'])
    for i, c in enumerate(t['spichlerzStates']):
        st = c['state']
        check('spichlerz', f'g{i}', sp_growth(st), c['growth'])
        mult = 0.5 if st['maSpichlerzIIPop'] else (0.75 if st['maSpichlerzPop'] else 1.0)
        check('spichlerz', f'c{i}', mult, c['cost'])
    for i, c in enumerate(p['magazynEra']):
        e = c['era']
        ee = e if (math.isfinite(e) and e > 1) else 1.0
        check('magazynEra', str(i), 2.0 ** (ee - 1), c['out'])


# ---------------------------------------------------------------------------
# empire-food.ts
# ---------------------------------------------------------------------------
EPS = 1e-9


def has(d, k):
    return d.get(k) is not None


def spichlerz_of(tick, sp_map):
    if sp_map is not None and tick['cityId'] in sp_map:
        return sp_map[tick['cityId']]
    return {'ceramikaActive': tick.get('spichlerzCeramika') or False, 'solActive': tick.get('spichlerzSol') or False,
            'maSpichlerzPop': tick.get('maSpichlerz') or False, 'maSpichlerzIIPop': tick.get('maSpichlerzII') or False}


def by_id_last(cities):
    m = {}
    for c in cities:
        m[c['id']] = c
    return m


def recompute(per_city, cities, sp_map):
    cm = by_id_last(cities)
    for t in per_city:
        city = cm.get(t['cityId'])
        if city is None:
            continue
        sp = spichlerz_of(t, sp_map)
        prod = t['zywnoscBrutto'] if has(t, 'zywnoscBrutto') else jmax(0.0, (t.get('zywnoscNetto') if has(t, 'zywnoscNetto') else 0.0) + (t.get('kosztRacji') if has(t, 'kosztRacji') else 0.0))
        lvl = city_level(city)
        koszt = ration_cost(city['population'], lvl, sp)
        bil = prod - koszt
        t['kosztRacji'] = koszt
        t['bilansLokalny'] = bil
        t['zywnoscNetto'] = bil
        t['poziomRacji'] = lvl


def bilans_of(t):
    prod = t['zywnoscBrutto'] if has(t, 'zywnoscBrutto') else 0.0
    koszt = t['kosztRacji'] if has(t, 'kosztRacji') else 0.0
    return t['bilansLokalny'] if has(t, 'bilansLokalny') else prod - koszt


def nadwyzka(per_city, owner):
    up = ko = 0.0
    for t in per_city:
        if t['ownerId'] != owner or t.get('oblegany'):
            continue
        up += t['zywnoscBrutto'] if has(t, 'zywnoscBrutto') else 0.0
        ko += t['kosztRacji'] if has(t, 'kosztRacji') else 0.0
    return up - ko


def pool_sim(zap, per_city, owner):
    central = zap
    defs = []
    for t in per_city:
        if t['ownerId'] != owner or t.get('oblegany'):
            continue
        b = bilans_of(t)
        if b >= 0:
            central += b
        else:
            defs.append(-b)
    for need in defs:
        central -= jmin(need, jmax(0.0, central))
    return central


def all_fed(zap, per_city, owner):
    central = zap
    defs = []
    for t in per_city:
        if t['ownerId'] != owner or t.get('oblegany'):
            continue
        b = bilans_of(t)
        if b >= 0:
            central += b
        else:
            defs.append(-b)
    for need in defs:
        cov = jmin(need, jmax(0.0, central))
        central -= cov
        if cov < need - EPS:
            return False
    return True


def solvent(zap, per_city, owner, koszt=0.0):
    return nadwyzka(per_city, owner) + zap - koszt >= 0


def target_met(zap, per_city, owner, flow, koszt):
    if flow:
        return nadwyzka(per_city, owner) - koszt >= 0
    return solvent(zap, per_city, owner, koszt)


def era_mult(era):
    e = era if (math.isfinite(era) and era > 1) else 1.0
    return 2.0 ** (e - 1)


def central_cap(owner, per_city, mag_count, params, era):
    m = era_mult(era)
    sc = 0.0
    for t in per_city:
        if t['ownerId'] != owner or t.get('oblegany'):
            continue
        if t.get('maSpichlerzII'):
            sc += 1500.0 * m
        elif t.get('maSpichlerz'):
            sc += 1000.0 * m
    return params['centralCapBaza'] + params['centralCapBonusMagazyn'] * mag_count + sc


def advance(econ, unit_owners, states, params, built, era_by_owner, army):
    """states: lista [owner, state] w kolejnosci wstawiania."""
    mag = {}
    if built is not None:
        seen = set()
        for t in econ['perCity']:
            if t['cityId'] in seen:
                continue
            seen.add(t['cityId'])
            if 'magazyn' in dict(built).get(t['cityId'], []):
                mag[t['ownerId']] = mag.get(t['ownerId'], 0.0) + 1
    st = {k: v for k, v in states}
    order = [k for k, _ in states]
    owners = []
    for o in [t['ownerId'] for t in econ['perCity']] + order + list(unit_owners):
        if o not in owners:
            owners.append(o)
    per_owner = []
    for o in owners:
        if o == -1:
            continue
        if o not in st:
            st[o] = {'zapasyPanstwa': 0.0, 'turyUjemnychZapasow': 0.0}
            order.append(o)
        s = st[o]
        przed = s['zapasyPanstwa']
        central = przed
        up = wy = pomoc = 0.0
        defs = []
        rows = []
        fed = []
        for t in econ['perCity']:
            if t['ownerId'] != o or t.get('oblegany'):
                continue
            prod = t['zywnoscBrutto'] if has(t, 'zywnoscBrutto') else jmax(0.0, t['zywnoscNetto'] + (t['kosztRacji'] if has(t, 'kosztRacji') else 0.0))
            koszt = t['kosztRacji'] if has(t, 'kosztRacji') else 0.0
            bil = t['bilansLokalny'] if has(t, 'bilansLokalny') else prod - koszt
            up += prod
            wy += koszt
            rows.append({'cityId': t['cityId'], 'name': t['cityId'], 'produkcja': prod, 'kosztRacji': koszt, 'bilans': bil,
                         'wzrostProcent': t['wzrostProcent'] if has(t, 'wzrostProcent') else 0.0, 'nakarmione': False})
            if bil >= 0:
                central += bil
                fed = [f for f in fed if f[0] != t['cityId']] + [[t['cityId'], True]]
            else:
                defs.append((t['cityId'], -bil))
        for cid, need in defs:
            cov = jmin(need, jmax(0.0, central))
            central -= cov
            pomoc += cov
            ok = cov >= need
            fed = [f for f in fed if f[0] != cid] + [[cid, ok]]
            for r in rows:
                if r['cityId'] == cid:
                    r['nakarmione'] = ok
                    break
        nad = up - wy
        stol = central
        ka = army[o]
        central -= ka
        era = era_by_owner.get(o, 1.0) if era_by_owner is not None else 1.0
        mc = central_cap(o, econ['perCity'], mag.get(o, 0.0), params, era)
        if central > mc:
            central = mc
        glod = central < 0
        central = jmax(0.0, central)
        s['zapasyPanstwa'] = central
        tp = s.get('turyUjemnychZapasow')
        tp = 0.0 if tp is None else tp
        tpo = tp + 1 if glod else 0.0
        s['turyUjemnychZapasow'] = tpo
        per_owner.append({
            'ownerId': int(o), 'uprawaHodowla': up, 'wyzwienieLudnosci': wy, 'nadwyzka': nad, 'pomocMiastom': pomoc,
            'spichlerzStolicy': stol, 'wojsko': ka, 'przyrostZapasow': central - przed, 'zapasyPrzed': przed, 'zapasyPo': central,
            'maxCap': mc, 'kosztArmii': ka, 'glodWojska': glod, 'turyUjemnychZapasowPo': tpo,
            'glodWojskaAtrycjaAktywna': tpo >= params['glodWojskaKarencjaTur'], 'zywnoscBrutto': up, 'doRozwoju': 0.0, 'doPanstwa': nad,
            'perCityRows': rows, 'fedByCityId': {'__map': fed},
        })
    return per_owner, [[k, st[k]] for k in order]


def managed_idx(cities, owner, only_auto):
    out = []
    for i, c in enumerate(cities):
        if c['ownerId'] != owner:
            continue
        if only_auto:
            if not (c['ownerId'] not in [0] or c.get('autoWyzywienie') is True):
                continue
        out.append(i)
    return out


def plan(cities, econ, owner, zap, koszt, sp_map, only_auto, flow, popcap):
    managed = managed_idx(cities, owner, only_auto)
    orig = {}
    for i in managed:
        cities[i] = ensure(cities[i])
        orig[cities[i]['id']] = city_level(cities[i])
    atcap = []
    grow = []
    for i in managed:
        cap = popcap.get(cities[i]['id']) if popcap is not None else None
        if cap is not None and cities[i]['population'] >= cap:
            atcap.append(i)
        else:
            grow.append(i)
    nl = next((l for l in LEVELS if growth_pct_of(l) >= 0), MIN_R)

    def capped(l):
        return jmin(nl, l)

    def apply(level):
        for i in atcap:
            cities[i]['poziomRacji'] = capped(level)
        for i in grow:
            cities[i]['poziomRacji'] = level
        recompute(econ['perCity'], cities, sp_map)

    def feasible():
        return all_fed(zap, econ['perCity'], owner) and target_met(zap, econ['perCity'], owner, flow, koszt)
    uniform = MIN_R
    fed_all = False
    for lvl in reversed(LEVELS):
        apply(lvl)
        if feasible():
            uniform = lvl
            fed_all = True
            break
    if not fed_all:
        apply(MIN_R)
        fed_all = all_fed(zap, econ['perCity'], owner)
    by = []
    for i in atcap:
        by.append([cities[i]['id'], capped(uniform)])
    for i in grow:
        by.append([cities[i]['id'], uniform])
    for i in managed:
        cities[i]['poziomRacji'] = orig[cities[i]['id']]
    recompute(econ['perCity'], cities, sp_map)
    return {'uniformLevel': uniform, 'levelByCityId': {'__map': by}, 'atPopCapCityIds': [cities[i]['id'] for i in atcap], 'allFed': fed_all}


def apply_plan(pl, cities, owner, only_auto, econ, sp_map):
    lv = {k: v for k, v in pl['levelByCityId']['__map']}
    changes = []
    for i in managed_idx(cities, owner, only_auto):
        tgt = lv.get(cities[i]['id'])
        if tgt is None:
            continue
        old = city_level(cities[i])
        new = clamp_r(tgt)
        if abs(new - old) < EPS:
            continue
        cities[i]['poziomRacji'] = new
        changes.append({'cityId': cities[i]['id'], 'name': cities[i]['name'], 'oldLevel': old, 'newLevel': new})
    if changes:
        recompute(econ['perCity'], cities, sp_map)
    return changes


def levels_of(cities):
    out = []
    for c in cities:
        o = {'id': c['id']}
        for k in ('poziomRacji', 'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty', 'hungerLossUlamkowy'):
            if c.get(k) is not None:
                o[k] = c[k]
        out.append(o)
    return out


def clone(x):
    return json.loads(json.dumps(x, default=lambda o: o), parse_float=float) if False else deep(x)


def deep(x):
    if isinstance(x, dict):
        return {k: deep(v) for k, v in x.items()}
    if isinstance(x, list):
        return [deep(v) for v in x]
    return x


def sp_dict(v):
    return None if v is None else {k: s for k, s in v}


def pop_dict(v):
    return None if v is None else {k: s for k, s in v}


def verify_empire():
    e = load('empire.json')
    edge = load('edge.json')
    p = load('params.json')
    for i, c in enumerate(e['recompute']):
        pc = deep(c['ticks'])
        recompute(pc, deep(c['cities']), sp_dict(c['spichlerz']))
        check('recompute', str(i), pc, c['out'])
    for i, c in enumerate(e['simulate'] + edge['simulate']):
        t, o = c['ticks'], c['owner']
        check('simulate', f'n{i}', nadwyzka(t, o), c['nadwyzka'])
        check('simulate', f'p{i}', pool_sim(c['zap'], t, o), c['pool'])
        check('simulate', f'a{i}', all_fed(c['zap'], t, o), c['allFed'])
        check('simulate', f's{i}', solvent(c['zap'], t, o, c['koszt']), c['solvent'])
        check('simulate', f'd{i}', solvent(c['zap'], t, o), c['solventDefault'])
    for i, c in enumerate(e['advance'] + edge['advance']):
        econ = deep(c['econ'])
        states = [[k, deep(v)] for k, v in c['statesBefore']['__map']]
        era = None if c['eraByOwner'] is None else {int(k): v for k, v in c['eraByOwner'].items()}
        army = {int(k): v for k, v in c['armyCost'].items()}
        pc = c['params']
        po, st_after = advance(econ, [int(u) for u in c['unitOwners']], states, pc, c['built'], era, army)
        # w wektorze liczby calkowite (np. ownerId) sa float po dec() - ujednolicenie
        want = deep(c['out']['perOwner'])
        for w in want:
            w['ownerId'] = int(w['ownerId'])
        got = deep(po)
        check('advance', f'perOwner{i}', got, want)
        # statesAfter z kolejnoscia wstawiania
        want_states = c['out']['statesAfter']['__map']
        got_states = [[float(k), v] for k, v in st_after]
        want_states = [[float(k), v] for k, v in want_states]
        check('advance', f'states{i}', {'__map': got_states}, {'__map': want_states})
        # akcesory
        by_owner = {t['ownerId']: t for t in po}
        for a in c['out']['accessors']:
            o = int(a['o'])
            t = by_owner.get(o)
            reserve = dict((int(k), v) for k, v in st_after).get(o)
            check('advance', f'reserve{i}.{o}', reserve['zapasyPanstwa'] if reserve else 0.0, a['reserve'])
            check('advance', f'hungry{i}.{o}', bool(t and t['glodWojska']) and o != -1, a['hungry'])
            check('advance', f'starving{i}.{o}', bool(t and t['glodWojskaAtrycjaAktywna']) and o != -1, a['starving'])
            if t is None or not t['glodWojska'] or t['glodWojskaAtrycjaAktywna']:
                check('advance', f'countdown{i}.{o}', {'isNull': True}, a['countdown'])
            else:
                check('advance', f'countdown{i}.{o}', jmax(1.0, pc['glodWojskaKarencjaTur'] - t['turyUjemnychZapasowPo']), a['countdown'])
        # runda 2b: cykl zycia runtime (edge.json): po `clearLastEmpireFoodTicks` oraz po `_setLastEmpireFoodTicks`
        res_by = dict((int(k), v) for k, v in st_after)
        for a in c['out'].get('accessorsAfterClear', []):
            o = int(a['o'])
            r = res_by.get(o)
            check('runtimeClear', f'reserve{i}.{o}', r['zapasyPanstwa'] if r else 0.0, a['reserve'])
            check('runtimeClear', f'maxCap{i}.{o}', 0.0, a['maxCap'])
            check('runtimeClear', f'hungry{i}.{o}', False, a['hungry'])
            check('runtimeClear', f'starving{i}.{o}', False, a['starving'])
            check('runtimeClear', f'countdown{i}.{o}', {'isNull': True}, a['countdown'])
            check('runtimeClear', f'last{i}.{o}', None, a['last'])
        inj = c['out'].get('injected')
        if inj:
            ticks = {o: deep(t) for o, t in by_owner.items()}
            base = deep(by_owner[int(inj['baseOwner'])])
            base.update({'ownerId': -1, 'glodWojska': True, 'glodWojskaAtrycjaAktywna': True})
            ticks[-1] = base
            want_tick = deep(inj['tick'])
            want_tick['ownerId'] = int(want_tick['ownerId'])
            check('runtimeInject', f'tick{i}', base, want_tick)
            for a in inj['accessors']:
                o = int(a['o'])
                t = ticks.get(o)
                r = res_by.get(o)
                check('runtimeInject', f'reserve{i}.{o}', r['zapasyPanstwa'] if r else 0.0, a['reserve'])
                check('runtimeInject', f'maxCap{i}.{o}', 0.0, a['maxCap'])
                check('runtimeInject', f'hungry{i}.{o}', bool(t and t['glodWojska']) and o != -1, a['hungry'])
                check('runtimeInject', f'starving{i}.{o}', bool(t and t['glodWojskaAtrycjaAktywna']) and o != -1, a['starving'])
                if t is None or not t['glodWojska'] or t['glodWojskaAtrycjaAktywna']:
                    check('runtimeInject', f'countdown{i}.{o}', {'isNull': True}, a['countdown'])
                else:
                    check('runtimeInject', f'countdown{i}.{o}', jmax(1.0, pc['glodWojskaKarencjaTur'] - t['turyUjemnychZapasowPo']), a['countdown'])
                if t is None:
                    check('runtimeInject', f'last{i}.{o}', None, a['last'])
                else:
                    want_last = deep(a['last'])
                    want_last['ownerId'] = int(want_last['ownerId'])
                    check('runtimeInject', f'last{i}.{o}', t, want_last)
    empty_ok = all(a['reserve'] == 0 for a in e['afterClear'])
    check('advance', 'afterClear', empty_ok, True)

    def run_scn(kind, c):
        cities = deep(c['cities'])
        econ = deep(c['econ'])
        sp = sp_dict(c['spichlerz'])
        popcap = pop_dict(c['popCap'])
        owner, zap, koszt = c['ownerId'], c['zap'], c['kosztArmii']
        if kind == 'plan':
            pl = plan(cities, econ, owner, zap, koszt, sp, c['onlyAuto'], c['flow'], popcap)
            return {'plan': pl, 'citiesAfter': levels_of(cities), 'econAfter': econ}
        if kind == 'balance':
            managed = managed_idx(cities, owner, c['onlyAuto'])
            if not managed:
                return {'result': {'adjusted': False, 'changes': []}, 'citiesAfter': levels_of(cities), 'econAfter': econ}
            for i in managed:
                cities[i] = ensure(cities[i])
            if target_met(zap, econ['perCity'], owner, c['flow'], koszt) and all_fed(zap, econ['perCity'], owner):
                return {'result': {'adjusted': False, 'changes': []}, 'citiesAfter': levels_of(cities), 'econAfter': econ}
            pl = plan(cities, econ, owner, zap, koszt, sp, c['onlyAuto'], c['flow'], popcap)
            ch = apply_plan(pl, cities, owner, c['onlyAuto'], econ, sp)
            return {'result': {'adjusted': len(ch) > 0, 'changes': ch}, 'citiesAfter': levels_of(cities), 'econAfter': econ}
        if kind == 'raise':
            managed = managed_idx(cities, owner, c['onlyAuto'])
            res = {'adjusted': False, 'changes': []}
            if managed and solvent(zap, econ['perCity'], owner, koszt):
                nad = nadwyzka(econ['perCity'], owner)
                go = True
                if c['surplus']:
                    if nad <= 0:
                        go = False
                elif nad <= 0 and zap <= 0:
                    go = False
                if go:
                    for i in managed:
                        cities[i] = ensure(cities[i])
                    pl = plan(cities, econ, owner, zap, koszt, sp, c['onlyAuto'], c['surplus'], popcap)
                    ch = apply_plan(pl, cities, owner, c['onlyAuto'], econ, sp)
                    res = {'adjusted': len(ch) > 0, 'changes': ch}
            return {'result': res, 'citiesAfter': levels_of(cities), 'econAfter': econ}
        # maxSafe
        target = c['target']
        idx = next((i for i, x in enumerate(cities) if x['id'] == target), None)
        if idx is None or cities[idx]['ownerId'] != owner:
            return {'level': MIN_R, 'citiesAfter': levels_of(cities), 'econAfter': econ}
        cities[idx] = ensure(cities[idx])
        orig = city_level(cities[idx])
        others = [i for i, x in enumerate(cities) if x['ownerId'] == owner and x['id'] != target]
        oo = {}
        for i in others:
            cities[i] = ensure(cities[i])
            oo[cities[i]['id']] = city_level(cities[i])
        human = [0.0] if isinstance(c['human'], dict) else c['human']
        flow = float(owner) in [float(h) for h in human]
        best = MIN_R
        nl = next((l for l in LEVELS if growth_pct_of(l) >= 0), MIN_R)
        for lvl in LEVELS:
            cities[idx]['poziomRacji'] = lvl
            for i in others:
                cap = popcap.get(cities[i]['id']) if popcap is not None else None
                if cap is not None and cities[i]['population'] >= cap:
                    cities[i]['poziomRacji'] = jmin(nl, lvl)
                else:
                    cities[i]['poziomRacji'] = jmin(oo[cities[i]['id']], lvl)
            recompute(econ['perCity'], cities, sp)
            pool = pool_sim(zap, econ['perCity'], owner)
            fed = all_fed(zap, econ['perCity'], owner)
            tm = target_met(zap, econ['perCity'], owner, flow, koszt)
            if pool >= 0 and fed and tm:
                best = lvl
        cities[idx]['poziomRacji'] = orig
        for i in others:
            cities[i]['poziomRacji'] = oo[cities[i]['id']]
        recompute(econ['perCity'], cities, sp)
        return {'level': clamp_r(best), 'citiesAfter': levels_of(cities), 'econAfter': econ}

    # runda 2b: edge.json ma dodatkowe scenariusze kryterium FLOW (planFlow / balanceFlow / raiseFlow)
    extra = {'plan': edge.get('planFlow', []), 'balance': edge.get('balanceFlow', []), 'raise': edge.get('raiseFlow', []), 'maxSafe': []}
    for kind, key in (('plan', 'plan'), ('balance', 'balance'), ('raise', 'raise'), ('maxSafe', 'maxSafe')):
        for i, c in enumerate(e[key] + extra[key]):
            got = run_scn(kind, c)
            check(key, str(i), got, c['out'])


# ---------------------------------------------------------------------------
# applyPostCentralPopulationGrowth (+ refreshManpowerAfterPopChange)
# ---------------------------------------------------------------------------
with open(f'{WEB}/epoka-ludnosc-manpower.json', encoding='utf-8') as f:
    MPROWS = json.load(f)['epoki']


def mp_row(epoka):
    fl = jfloor(epoka)
    e = max(1, min(len(MPROWS), int(fl) if (math.isfinite(fl) and fl != 0) else 1))
    for r in MPROWS:
        if r['epoka'] == e:
            return r
    return MPROWS[0]


def mp_max(ludki, epoka, mult):
    row = mp_row(epoka)
    fl = jfloor(ludki)
    lud = max(1.0, fl if (math.isfinite(fl) and fl != 0) else 1.0)
    return jfloor(lud * row['manpowerNaLudka'] * jmax(0.1, mult))


def mp_cur(pop, mpv, epoka, mult):
    mx = mp_max(pop, epoka, mult)
    if mpv is None or not math.isfinite(mpv):
        return mx
    return jmax(0.0, jmin(mx, jfloor(mpv)))


def mp_refresh(pop, mpv, epoka, prev, mult):
    mx = mp_max(pop, epoka, mult)
    cur = mp_cur(pop, mpv, epoka, mult)
    if prev is not None and prev != pop:
        old = mp_max(prev, epoka, mult)
        if pop > prev:
            return jmin(mx, cur + (mx - old))
        return jmin(cur, mx)
    return mx


def mp_max_mult(bon):
    m = 1.0
    if not bon:
        return m
    for b in bon:
        w = b.get('wartosc')
        if b.get('typ') == 'bonus_pobor_pula' and isinstance(w, float):
            m *= 1 + w
        elif b.get('typ') == 'mnoznik_manpower_max' and isinstance(w, float):
            m *= w
    return jmax(0.1, m)


def verify_post_central():
    pc = load('post_central.json')
    edge = load('edge.json')
    for i, sc in enumerate(pc['scenarios'] + edge['postCentral'] + edge['postCentralSiege']):
        cities = deep(sc['cities'])
        econ = deep(sc['econ'])
        ef = deep(sc['ef'])
        owner_civ = {k: v for k, v in sc['ownerCiv']}
        happy = {k: v for k, v in sc['happiness']}
        era = {k: v for k, v in sc['eraByOwner']}
        mbo = {k: v for k, v in sc['matrixByOwner']}
        bon = {k: v for k, v in sc['civBonusy']}
        cit = {k: v for k, v in sc['citizenGrowth']}
        sp = sp_dict(sc['spichlerz'])
        built = dict(sc['built']) if sc['built'] is not None else None
        calls = []
        for ot in ef:
            for row in ot['perCityRows']:
                city = next((c for c in cities if c['id'] == row['cityId']), None)
                tick = next((t for t in econ['perCity'] if t['cityId'] == row['cityId']), None)
                if city is None or tick is None or tick.get('oblegany'):
                    continue
                row['name'] = city['name']
                fed = dict((k, v) for k, v in ot['fedByCityId']['__map']).get(row['cityId'], False)
                st = sp[row['cityId']] if (sp is not None and row['cityId'] in sp) else spichlerz_of(tick, None)
                bi = built.get(city['id'], []) if built is not None else []
                ak = 'akwedukt' in bi
                has_sp = 'spichlerz' in bi or 'spichlerz_ii' in bi
                happy_v = happy.get(row['cityId'], 0.0)
                cg = cit.get(row['cityId'], 0.0)
                ck = owner_civ.get(city['ownerId'])
                pm = mbo.get(city['ownerId']) or matrix_for(ck)
                inp = {'population': city['population'], 'poziomRacji': city_level(city), 'zdrowie': tick['zdrowie'],
                       'szczescieNetto': happy_v, 'spichlerzState': st, 'civKey': ck, 'difficulty': sc['d'],
                       'citizenResourceGrowthPct': cg, 'populationMatrix': pm}
                bd = percent(inp)
                row['wzrostProcent'] = bd['total']
                row['breakdown'] = bd
                row['nakarmione'] = fed
                before = city['population']
                hg = hunger(city['population'], fed, city.get('turyBezDoplaty'), pm['hungerLossMultiplier'], city.get('hungerLossUlamkowy') if city.get('hungerLossUlamkowy') is not None else 0.0)
                city['turyBezDoplaty'] = hg['turyBezDoplaty']
                city['hungerLossUlamkowy'] = hg['hungerLossUlamkowy']
                city['population'] = hg['nowaLudnosc']
                gr = fractional(city['population'], city.get('wzrostUlamkowy'), bd['total'] if fed else 0.0, fed, ak, sc['econParams'], has_sp, pm['populationCapDelta'])
                city['population'] = gr['nowaLudnosc']
                city['wzrostUlamkowy'] = gr['wzrostUlamkowy']
                tick['ludnoscPo'] = city['population']
                tick['wzrost'] = gr['wzrost']
                tick['ubytek'] = hg['ubytek'] or gr['ubytek']
                tick['wzrostProcent'] = bd['total']
                tick['wzrostUlamkowyPo'] = city['wzrostUlamkowy']
                tick['magazynPoTurze'] = city['wzrostUlamkowy']
                if city['population'] != before:
                    e = era.get(city['ownerId'], 1.0)
                    mult = mp_max_mult(bon.get(city['ownerId']))
                    city['manpower'] = mp_refresh(city['population'], city.get('manpower'), e, before, mult)
                    calls.append(city['id'])
                if gr['wzrost']:
                    econ['growth'] += 1
                if hg['ubytek'] or gr['ubytek']:
                    econ['starved'] += 1
        want = sc['out']
        got_cities = []
        for c in cities:
            o = {'id': c['id']}
            for k in ('poziomRacji', 'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty', 'hungerLossUlamkowy', 'population', 'manpower'):
                if c.get(k) is not None:
                    o[k] = c[k]
            got_cities.append(o)
        want_cities = []
        for c in want['cities']:
            o = {'id': c['id']}
            for k in ('poziomRacji', 'rationMigratedV114', 'wzrostUlamkowy', 'turyBezDoplaty', 'hungerLossUlamkowy', 'population', 'manpower'):
                if c.get(k) is not None:
                    o[k] = c[k]
            want_cities.append(o)
        check('postCentral', f'cities{i}', got_cities, want_cities)
        check('postCentral', f'econ{i}', econ, want['econ'])
        got_ef = deep(ef)
        want_ef = deep(want['efPerOwner'])
        for w in want_ef + got_ef:
            w['ownerId'] = int(w['ownerId'])
        check('postCentral', f'ef{i}', got_ef, want_ef)
        check('postCentral', f'calls{i}', calls, want['calls'])
    m = load('manpower.json')
    for i, c in enumerate(m):
        prev = None if isinstance(c['prev'], dict) else c['prev']
        check('manpower', str(i), mp_refresh(c['city']['population'], c['city'].get('manpower'), c['epoka'], prev, c['mult']), c['out'])


verify_growth()
verify_tempo()
verify_empire()
verify_post_central()

print('SEKCJE:', json.dumps(COUNT, sort_keys=True))
print('PORUWNAN:', sum(COUNT.values()))
print('ROZBIEZNOSCI:', len(FAILS))
for s, l, g, w in FAILS[:15]:
    print('FAIL', s, l)
    print('  python:', json.dumps(g, default=str)[:300])
    print('  web   :', json.dumps(w, default=str)[:300])
sys.exit(1 if FAILS else 0)
