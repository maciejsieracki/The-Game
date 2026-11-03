"""Niezalezny weryfikator wektorow HEAL-MAXHP (python3 -I verify-p6-heal-maxhp.py <maxhp.json> <units.json> [--neg]).

NIE uzywa Rust ani kodu weba. Przelicza z surowych wejsc wektora wlasnymi wzorami: normFieldVal (parseFloat regexem),
unitHealth (klucz `health` ?? `Health`), effectiveMaxHp (round(x*10)/10 + snap < 1e-6), tabela weterana 0/.10/.15/.20,
parametry/100 (tylko liczba skonczona > 0), closure getMaxHp na wierszach units.json (pierwszy wiersz o nazwie, brak = {}),
oraz w scenariuszach e2e: kazda wartosc zwrocona przez getMaxHp (`asked`) i inwarianty HP po leczeniu
(hp <= hpMax = wartosc getMaxHp dla jednostek, ktorych getMaxHp zwrocil liczbe skonczona > 0).
--neg: kontrola negatywna - zepsuta tabela weterana MUSI dac rozbieznosci.
"""
import json
import math
import re
import sys

NEG = '--neg' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
d = json.load(open(args[0]))
UNITS = json.load(open(args[1]))
VET = [0, 0.10, 0.15, 0.25 if NEG else 0.20]
SPECIAL = {'NaN': math.nan, 'Infinity': math.inf, '-Infinity': -math.inf, '-0': -0.0}


def num(x):
    if isinstance(x, str):
        return SPECIAL[x] if x in SPECIAL else float(x[1:])
    return float(x)


def same(a, b):
    if isinstance(a, float) and math.isnan(a):
        return isinstance(b, float) and math.isnan(b)
    if a == 0 and b == 0:
        return math.copysign(1, a) == math.copysign(1, b)
    return a == b


WS = ' \t\n\r\v\f ﻿                　'
PF = re.compile(r'^[+-]?(?:Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)')


def parse_float(s):
    m = PF.match(s.lstrip(WS))
    if not m:
        return math.nan
    t = m.group(0)
    if t.endswith('Infinity'):
        return -math.inf if t[0] == '-' else math.inf
    return float(t)


def norm(v, fb):
    if v is None or v in ('---', '—', ''):
        return fb
    if isinstance(v, bool):
        return float(v)
    n = parse_float(v) if isinstance(v, str) else float(v)
    return fb if math.isnan(n) else n


def health(row):
    # `row` = dict albo None ({}); `??` - tylko None/brak klucza przechodzi do Health
    if row is None:
        return 30.0
    lo = row.get('health')
    return norm(lo if lo is not None else row.get('Health'), 30.0)


def jsround(x):
    if not math.isfinite(x) or x == 0:
        return x  # NaN/Inf/+-0 bez zmian (floor() zgubilby znak zera)
    f = math.floor(x)
    r = f + 1 if x - f >= 0.5 else f
    return -0.0 if r == 0 and x < 0 else float(r)


def card(n):
    if not math.isfinite(n):
        return 0.0
    r = jsround(n * 10) / 10
    return jsround(r) if abs(r - jsround(r)) < 1e-6 else r


def emh(b, p, v):
    return card(b * (1 + (p + v)))


def won(b):
    if isinstance(b, (int, float)) and not isinstance(b, bool) and math.isfinite(b) and b > 0:
        return float(math.floor(b))
    return 0.0


def vfrac(b):
    return VET[int(min(3.0, won(b)))]


def pfrac(p):
    ok = isinstance(p, (int, float)) and not isinstance(p, bool) and math.isfinite(p) and p > 0
    return (p / 100) if ok else 0.0


def raw_num(x):
    """Wartosc z wektora jak w web: liczba / napis specjalny; inny napis = nie-liczba (None)."""
    if x is None:
        return None
    if isinstance(x, str):
        return num(x) if (x in SPECIAL or x.startswith('~')) else None
    return float(x)


def get_max_hp(t, live):
    row = next((u for u in UNITS if u['Jednostka'] == t), None)
    pp = bs = None
    if live:
        pp, bs = live.get('pp'), live.get('bs')
    return emh(health(row), pfrac(pp), vfrac(bs))


bad = []
cnt = 0


def chk(label, got, want):
    global cnt
    cnt += 1
    if not same(got, want):
        bad.append(f'{label}: got={got!r} want={want!r}')


for c in d['norm']:
    chk(f"norm {c}", norm(c.get('v'), float(c['fb'])), num(c['out']))
for c in d['defs']:
    chk(f"defs {c['def']}", health(c['def']), num(c['out']))
for c in d['emh']:
    chk(f"emh {c}", emh(num(c['b']), num(c['p']), num(c['v'])), num(c['out']))
for c in d['vet']:
    b = None if ('absent' in c or 'str' in c) else raw_num(c.get('bs'))
    chk(f"won {c}", won(b), num(c['out']['won']))
    chk(f"stars {c}", min(3.0, won(b)), num(c['out']['stars']))
    chk(f"frac {c}", vfrac(b), num(c['out']['frac']))
for c in d['wins']:
    w = max(0, min(3, math.floor(c['w'])))
    chk(f"wins {c}", VET[w], num(c['out']))
for c in d['par']:
    p = None if ('absent' in c or 'str' in c) else raw_num(c.get('p'))
    chk(f"par {c}", pfrac(p), num(c['out']))
for c in d['closure']:
    live = {'pp': raw_num(c.get('pp')), 'bs': raw_num(c.get('bs'))} if c['live'] else None
    chk(f"closure {c['type']}", get_max_hp(c['type'], live), num(c['out']))

# e2e
asked_n = callbacks = 0
for s in d['scenarios']:
    units = {u['id']: u for u in s['units']}
    out = s['out']
    after = {u['id']: u for u in out['units']}
    for uid, val in out['asked']:
        u = units[uid]
        live = {'pp': raw_num(u.get('parametryBonusProc')), 'bs': raw_num(u.get('battlesSurvived'))}
        want = get_max_hp(u['typeId'], live)
        chk(f"{s['name']} asked {uid}", want, num(val))
        asked_n += 1
        if math.isfinite(want) and want > 0:
            a = after[uid]
            hm = raw_num(a['hpMax'])
            hp = raw_num(a['hp'])
            chk(f"{s['name']} hpMax {uid}", hm, want)
            if hp is None or not (hp <= want):
                bad.append(f"{s['name']} hp>{want} {uid}: {hp}")
    for uid, hp, hm in out['calls']:
        ask = [v for (i, v) in out['asked'] if i == uid]
        chk(f"{s['name']} callback hpMax {uid}", num(hm), num(ask[0]))
        callbacks += 1

print(f'sprawdzen: {cnt}, e2e getMaxHp: {asked_n}, callbacki: {callbacks}, rozbieznosci: {len(bad)}')
for b in bad[:15]:
    print('  ', b)
if NEG:
    sys.exit(0 if bad else 1)
sys.exit(1 if bad else 0)
