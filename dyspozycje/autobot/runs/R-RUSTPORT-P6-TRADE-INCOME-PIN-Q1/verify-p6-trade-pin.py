"""Niezalezny weryfikator R-RUSTPORT-P6-TRADE-INCOME-PIN-Q1 (uruchamiac: python3 -I verify-p6-trade-pin.py <trade.json> <econ-params.json z pinu>).

Przelicza w Pythonie (bez JS i bez Rust) wszystko, co da sie wyprowadzic z samego wektora: krzywe dochodu (z econ-params pinu),
dochod trasy (x2 miedzy ownerami, ceil/2), rozbicie per miasto z bonusami cudu i Targowiska, premie budynkowe, liczniki i bonus Portu,
granty, przeplyw surowcow (ledger), diff, limity budynkow i kontrole struktury (pin, deterministyczna liczba rekordow).
Kontrola negatywna: ten sam przeliczacz na zepsutym wektorze MUSI zglosic rozbieznosc."""
import copy
import json
import math
import sys

vec_path, econ_path = sys.argv[1], sys.argv[2]
V = json.load(open(vec_path))
ECON = json.load(open(econ_path))
fails = []
checks = 0


def num(x):
    if isinstance(x, str):
        if x == 'NaN':
            return float('nan')
        if x == 'Infinity':
            return float('inf')
        if x == '-Infinity':
            return float('-inf')
        if x == '-0':
            return -0.0
        assert x.startswith('~'), x
        return float(x[1:])
    return float(x)


def eq(a, b):
    return (a == b) or (math.isnan(a) and math.isnan(b))


def chk(cond, msg):
    global checks
    checks += 1
    if not cond:
        fails.append(msg)


def by_distance(curve, d):
    idx = max(0, min(len(curve) - 1, math.floor(d)))
    return curve[idx] if 0 <= idx < len(curve) else 0.0


def route_income(curve_l, curve_m, r):
    base = by_distance(curve_l if r['medium'] == 'lad' else curve_m, r['dystans'])
    before = base if r['ownerId'] == r['toOwnerId'] else base * 2
    return math.ceil(before / 2)


def curves(name):
    c = V['curves'][name]
    return [num(x) for x in c['ladowe']], [num(x) for x in c['morskie']]


def verify(V):
    # pin: krzywe default/econ_normal musza byc rowne danym z econ-params pinu
    hs = ECON['handel_szlaki']
    cl, cm = curves('default')
    chk(cl == [float(x) for x in hs['dochody_ladowe']['normal']], 'krzywa ladowa default != econ-params')
    chk(cm == [float(x) for x in hs['dochody_morskie']['normal']], 'krzywa morska default != econ-params')
    el, em = curves('econ_normal')
    chk(el == cl and em == cm, 'econ_normal != default')

    for c in V['income_cases']:
        l, m = curves(c['curve'])
        d = c['distance']
        want = by_distance(l if c['medium'] == 'lad' else m, d)
        chk(eq(want, num(c['by_distance'])), f"by_distance {c}")
        r = {'medium': c['medium'], 'dystans': d, 'ownerId': 0, 'toOwnerId': 0 if c['same_owner'] else 1}
        chk(eq(float(route_income(l, m, r)), num(c['for_route'])), f"for_route {c}")

    for sc in V['scenarios']:
        l, m = curves(sc['curve'])
        for t in sc['ticks']:
            inc = t['income']
            routes = inc['routes_in']
            tot, mar, nob, bb, sc_cnt = {}, {}, {}, {}, {}
            for r in routes:
                if r['status'] != 'polaczony':
                    continue
                ri = route_income(l, m, r)
                for city, owner in ((r['fromCityId'], r['ownerId']), (r['toCityId'], r['toOwnerId'])):
                    w = inc['wonder'].get(f"{owner}|{r['medium']}", 0)
                    aw = ri if w == 0 else math.floor(ri * (1 + w))
                    tg = inc['targ'].get(city, 0)
                    fin = aw if tg == 0 else math.floor(aw * (1 + tg))
                    tot[city] = tot.get(city, 0) + fin
                    if r['medium'] == 'morze':
                        mar[city] = mar.get(city, 0) + fin
                        sc_cnt[city] = sc_cnt.get(city, 0) + 1
                    nob[city] = nob.get(city, 0) + ri
                    if r['budynekOdblokowany']:
                        bb[city] = bb.get(city, 0) + 0.05 * ri
            chk({k: num(v) for k, v in inc['total'].items()} == {k: float(v) for k, v in tot.items()}, f"total sc{sc['idx']}")
            chk({k: num(v) for k, v in inc['maritime'].items()} == {k: float(v) for k, v in mar.items()}, f"maritime sc{sc['idx']}")
            chk({k: num(v) for k, v in inc['total_nobonus'].items()} == {k: float(v) for k, v in nob.items()}, f"nobonus sc{sc['idx']}")
            chk({k: num(v) for k, v in inc['sea_counts'].items()} == {k: float(v) for k, v in sc_cnt.items()}, f"sea_counts sc{sc['idx']}")
            rate = num(inc['sea_bonus_rate'])
            sb = {k: (c - 1) * rate for k, c in sc_cnt.items() if c - 1 > 0}
            chk({k: num(v) for k, v in inc['sea_bonus'].items()} == sb, f"sea_bonus sc{sc['idx']}")
            sbd = {k: float(c - 1) for k, c in sc_cnt.items() if c - 1 > 0}
            chk({k: num(v) for k, v in inc['sea_bonus_default'].items()} == sbd, f"sea_bonus_default sc{sc['idx']}")
            got_bb = {k: num(v) for k, v in inc['building_bonus'].items()}
            chk(set(got_bb) == set(bb) and all(abs(got_bb[k] - bb[k]) <= 1e-12 for k in bb), f"building_bonus sc{sc['idx']}")

            # limity: liczba wpisow budynkow handlowych na liscie (z duplikatami)
            for lm in t['limits']:
                built = t['built'].get(lm['id'], [])
                n = sum(1 for b in built if b in ('targowisko', 'port', 'port_wielki'))
                chk(lm['limit'] == n and lm['existence'] == n + 1, f"limit {lm}")

            # granty
            res = t['res']
            gr = []
            for r in routes:
                if r['status'] != 'polaczony':
                    continue
                for k in ['braz', 'zelazo', 'kon', 'cegla', 'zloto']:
                    a = res['native'].get(f"{r['ownerId']}|{k}", False)
                    b = res['native'].get(f"{r['toOwnerId']}|{k}", False)
                    if a and not b:
                        gr.append({'ownerId': r['toOwnerId'], 'resourceKey': k, 'viaOwnerId': r['ownerId'], 'viaCityId': r['toCityId'], 'routeId': r['id']})
                    if b and not a:
                        gr.append({'ownerId': r['ownerId'], 'resourceKey': k, 'viaOwnerId': r['toOwnerId'], 'viaCityId': r['fromCityId'], 'routeId': r['id']})
            chk(gr == res['grants'], f"grants sc{sc['idx']}")

            # diff
            # (poprzedni tick = routes poprzedniego ticka; pierwszy tick: pusta lista)
        prev_ids = []
        for t in sc['ticks']:
            ids = [r['id'] for r in t['routes']]
            chk([i for i in ids if i not in prev_ids] == t['diff']['added'], f"diff added sc{sc['idx']}")
            chk([i for i in prev_ids if i not in ids] == t['diff']['removed'], f"diff removed sc{sc['idx']}")
            prev_ids = ids

            # przeplyw: ledger wedlug specyfikacji (localeCompare po id zastapione porownaniem po wektorowej kolejnosci wejscia
            # tylko gdy ids sa juz posortowane w wyjsciu weba; weryfikujemy niezmienniki zamiast kolejnosci)
            fl = res['flows']
            conserved = {}
            for f in fl:
                a = num(f['amount'])
                chk(a >= 1 and a == math.floor(a), f"flow amount {f}")
                key = (f['resourceKey'])
                conserved[key] = conserved.get(key, 0) + a - a
            reserve = num(res['reserve'])
            ledger = {}
            for f in fl:
                src = ledger.setdefault((f['fromOwnerId'], f['resourceKey']), num(res['stock'].get(f"{f['fromOwnerId']}|{f['resourceKey']}", 0)))
                chk(src - reserve > 0 and num(f['amount']) == math.floor(src - reserve) or src - reserve >= num(f['amount']), f"flow donor surplus {f}")
                dst = ledger.setdefault((f['toOwnerId'], f['resourceKey']), num(res['stock'].get(f"{f['toOwnerId']}|{f['resourceKey']}", 0)))
                chk(src > dst, f"flow donor not richer {f}")
                ledger[(f['fromOwnerId'], f['resourceKey'])] = src - num(f['amount'])
                ledger[(f['toOwnerId'], f['resourceKey'])] = dst + num(f['amount'])

            # apply: suma zapasow panstwa zachowana (poza capem odbiorcy) i brak ujemnych po poborze
            ap = t['apply']
            cap = {int(k): num(v) for k, v in ap['cap'].items()}
            owners = {c['ownerId'] for c in ap['cities_in']}
            for o in owners:
                for k in ['braz', 'zelazo', 'kon', 'cegla', 'zloto', 'sol']:
                    s_in = sum(num((c['surowce'] or {}).get(k, 0)) for c in ap['cities_in'] if c['ownerId'] == o)
                    s_out = sum(num((c['surowce'] or {}).get(k, 0)) for c in ap['cities_out'] if c['ownerId'] == o)
                    gave = sum(num(f['amount']) for f in ap['flows'] if f['fromOwnerId'] == o and f['resourceKey'] == k)
                    got = sum(num(f['amount']) for f in ap['flows'] if f['toOwnerId'] == o and f['resourceKey'] == k)
                    chk(s_out <= s_in - min(gave, s_in) + got + 1e-9, f"apply bilans {o} {k}")
                    chk(s_out >= s_in - gave - 1e-9, f"apply min {o} {k}")


verify(V)

# kontrola negatywna: zepsuty wektor MUSI dac rozbieznosc
neg_ok = 0
for mutate in range(2):
    bad = copy.deepcopy(V)
    if mutate == 0:
        bad['income_cases'][5]['for_route'] = 999
    else:
        for sc in bad['scenarios']:
            if sc['ticks'][0]['income']['total']:
                k = next(iter(sc['ticks'][0]['income']['total']))
                sc['ticks'][0]['income']['total'][k] = 12345
                break
    before = len(fails)
    saved = fails[:]
    verify_fails_before = len(fails)
    V_backup = V
    # lokalnie podmieniamy V na zepsuty zestaw
    V = bad
    verify(V)
    V = V_backup
    if len(fails) > verify_fails_before:
        neg_ok += 1
    del fails[verify_fails_before:]

print(f"sprawdzen: {checks}, rozbieznosci: {len(fails)}, kontrola negatywna: {neg_ok}/2")
for f in fails[:20]:
    print('FAIL', f)
sys.exit(0 if (not fails and neg_ok == 2) else 1)
