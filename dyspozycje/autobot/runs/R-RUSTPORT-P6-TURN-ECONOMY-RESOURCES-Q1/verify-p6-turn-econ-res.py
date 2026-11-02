"""Niezalezny weryfikator wektorow P6-TURN-ECONOMY-RESOURCES (python3 -I; bez Rust, bez kodu generatora).

Przelicza od zera, wg tekstu `turn-economy.ts` / `converters.ts` / `building-stock-cost.ts` (pin 4bbef081d),
oczekiwane wyjscia z WEJSC wektorow i porownuje z polem `out` z URUCHOMIONEGO weba.
Zakres: runConverter (wszystkie przypadki), converterThroughputForEra, applyStolarniaDrewnoMapInflow oraz
caly pipeline dla scenariuszy BEZ resolvera etykiet (`labels == null` => wszystkie budynki aktywne).
Scenariusze z resolverem wymagaja tabel bramki runtime (data/derived) - NIE sa tu liczone niezaleznie
(raportowane osobno jako 'poza zakresem weryfikatora').
Uzycie: python3 -I verify-p6-turn-econ-res.py <pipeline.json>
"""
import functools
import json
import math
import sys

INF = float('inf')


def dec(x):
    if isinstance(x, str):
        if x == 'NaN':
            return float('nan')
        if x == 'Infinity':
            return INF
        if x == '-Infinity':
            return -INF
        if x == '-0':
            return -0.0
        if x.startswith('~'):
            return float(x[1:])
        raise ValueError(x)
    return float(x)


def enc(x):
    if math.isnan(x):
        return 'NaN'
    if x == INF:
        return 'Infinity'
    if x == -INF:
        return '-Infinity'
    if x == 0 and math.copysign(1, x) < 0:
        return '-0'
    if x == int(x) and abs(x) <= 2 ** 53 - 1:
        return int(x)
    return '~' + repr_js(x)


def repr_js(x):
    # round-trip najkrotszy zapis (jak String(x) dla zakresu uzywanego w wektorach)
    s = repr(x)
    if s.endswith('.0'):
        s = s[:-2]
    return s


def jmin(a, b):
    if math.isnan(a) or math.isnan(b):
        return float('nan')
    return min(a, b)


def jmax(a, b):
    if math.isnan(a) or math.isnan(b):
        return float('nan')
    return max(a, b)


def floor(x):
    return x if (math.isnan(x) or math.isinf(x)) else float(math.floor(x))


def have(st, k):
    v = st.get(k)
    return v if (v is not None and math.isfinite(v)) else 0.0


def run_converter(recipe, stores, tput_raw, out_cap):
    tput = floor(tput_raw) if (math.isfinite(tput_raw) and tput_raw > 0) else 0.0
    lim_in = INF
    for k, per in recipe['inputs']:
        if per <= 0:
            continue
        lim_in = jmin(lim_in, floor(have(stores, k) / per))
    if not math.isfinite(lim_in):
        lim_in = 0.0
    wolne = jmax(0.0, out_cap - have(stores, recipe['output']))
    lim_out = floor(wolne / recipe['outputAmount']) if recipe['outputAmount'] > 0 else 0.0
    cykle = jmax(0.0, jmin(jmin(tput, lim_in), lim_out))
    nowe = dict(stores)
    consumed = {}
    if cykle > 0:
        for k, per in recipe['inputs']:
            used = per * cykle
            nowe[k] = have(stores, k) - used
            consumed[k] = used
        nowe[recipe['output']] = have(stores, recipe['output']) + recipe['outputAmount'] * cykle
    if cykle == 0:
        if tput == 0:
            reason = 'zero-przepustowosci'
        elif lim_in == 0:
            reason = 'brak-wejscia'
        elif lim_out == 0:
            reason = 'pelny-magazyn'
        else:
            reason = 'brak-wejscia'
    else:
        reason = 'ok'
    return dict(produced=cykle * recipe['outputAmount'], cykle=cykle, consumed=consumed, stores=nowe, reason=reason)


def encrec(r):
    return {k: enc(r[k]) for k in sorted(r)}


def cmp_id(a, b):
    return -1 if a < b else (1 if a > b else 0)


def stock(c, k):
    s = c['sur']
    return (s or {}).get(k, 0.0)


def owner_stock(cities, o, k):
    t = 0.0
    for c in cities:
        if c['owner'] == o:
            t += stock(c, k)
    return t


def owner_all(cities, o):
    pool = {}
    for c in cities:
        if c['owner'] != o or c['sur'] is None:
            continue
        for k, v in c['sur'].items():
            if math.isfinite(v):
                pool[k] = pool.get(k, 0.0) + v
    return pool


def credit(cities, o, k, amount, cap):
    if not math.isfinite(amount) or amount <= 0:
        return
    oc = [c for c in cities if c['owner'] == o]
    if not oc:
        return
    add = amount
    if cap is not None and math.isfinite(cap):
        add = jmax(0.0, jmin(add, cap - owner_stock(cities, o, k)))
    if add <= 0:
        return

    def cmp(a, b):
        d = stock(a, k) - stock(b, k)
        if d != 0 and not math.isnan(d):
            return -1 if d < 0 else 1
        return cmp_id(a['id'], b['id'])
    oc.sort(key=functools.cmp_to_key(cmp))
    t = oc[0]
    if t['sur'] is None:
        t['sur'] = {}
    t['sur'][k] = t['sur'].get(k, 0.0) + add


def deduct(cities, o, k, need):
    if math.isnan(need) or need <= 0:
        return
    holders = [c for c in cities if c['owner'] == o and stock(c, k) > 0]

    def cmp(a, b):
        d = stock(b, k) - stock(a, k)
        if d != 0 and not math.isnan(d):
            return -1 if d < 0 else 1
        return cmp_id(a['id'], b['id'])
    holders.sort(key=functools.cmp_to_key(cmp))
    for c in holders:
        if need <= 0:
            break
        h = stock(c, k)
        take = min(h, need)
        c['sur'][k] = h - take
        need -= take


def assign(cities, o, pool):
    for c in cities:
        if c['owner'] == o and c['sur'] is not None:
            c['sur'].clear()
    for k, v in pool.items():
        if math.isfinite(v) and v > 0:
            credit(cities, o, k, v, None)


def throughput_era(rid, base, era):
    if rid not in ('cegielnia', 'garncarnia'):
        return base
    e = era if (math.isfinite(era) and era > 1) else 1.0
    return base * (1 + 0.10 * (e - 1))


def stol_inflow(base, n, bonus):
    if not math.isfinite(base) or base <= 0:
        return 0.0
    nn = jmax(0.0, floor(n))
    return floor(base * (1 + bonus * nn))


def pay_drain(cities, o, built, dry, dp):
    has_i = 'spichlerz' in built
    has_ii = 'spichlerz_ii' in built
    if not has_i and not has_ii:
        return False, False
    cer_amt = dp['ceramikaII'] if has_ii else dp['ceramikaI']
    cp = sp = False
    if owner_stock(cities, o, 'ceramika') >= cer_amt:
        if not dry:
            deduct(cities, o, 'ceramika', cer_amt)
        cp = True
    if has_ii and owner_stock(cities, o, 'sol') >= dp['solII']:
        if not dry:
            deduct(cities, o, 'sol', dp['solII'])
        sp = True
    return cp, sp


def bonus_state(built, cp, sp):
    has_i = 'spichlerz' in built
    has_ii = 'spichlerz_ii' in built
    if not has_i and not has_ii:
        return dict(ceramikaActive=False, solActive=False, maSpichlerzPop=False, maSpichlerzIIPop=False)
    sol = has_ii and sp
    pop_ii = has_ii and cp and sol
    return dict(ceramikaActive=cp, solActive=sol, maSpichlerzPop=cp and not pop_ii, maSpichlerzIIPop=pop_ii)


def garn(cities, built, drained, dp):
    out = {}
    for c in cities:
        o = c['owner']
        if o in out:
            continue
        ma = any(x['owner'] == o and 'garncarnia' in built.get(x['id'], []) for x in cities)
        if drained:
            cer = owner_stock(cities, o, 'ceramika')
        else:
            cer = owner_stock(cities, o, 'ceramika')
            for x in cities:
                if x['owner'] != o:
                    continue
                b = built.get(x['id'], [])
                has = 'spichlerz' in b or 'spichlerz_ii' in b
                amt = dp['ceramikaII'] if 'spichlerz_ii' in b else dp['ceramikaI']
                if has and cer >= amt:
                    cer -= amt
        nad = jmax(0.0, floor(cer)) if ma else 0.0
        out[o] = 1.0 if (nad > 0 and ma and math.isfinite(nad) and nad > 0) else 0.0
    return {str(k): enc(v) for k, v in out.items()}


def tick(s, recipes):
    cities = [dict(id=c['id'], owner=c['owner'], sur=None if c['surowce'] is None else {k: dec(v) for k, v in c['surowce'].items()}) for c in s['cities']]
    built = s['built']
    drain = {k: dec(v) for k, v in s['drain'].items()}
    cap = {int(k): dec(v) for k, v in s['cap'].items()}
    stol = {int(k): dec(v) for k, v in s['stol'].items()}
    kam = {int(k): dec(v) for k, v in s['kam'].items()}
    sb, kb = dec(s['stolBonus']), dec(s['kamBonus'])
    owners = []
    for c in cities:
        if c['owner'] not in owners:
            owners.append(c['owner'])
    garn_pre = garn(cities, built, False, drain)
    for c in cities:
        o = c['owner']
        t = {k: dec(v) for k, v in s['terr'].get(c['id'], {}).items()} if c['id'] in s['terr'] else None
        w = {k: dec(v) for k, v in s['worked'].get(c['id'], {}).items()} if c['id'] in s['worked'] else {}
        wd, wk, wg = w.get('drewno', 0.0), w.get('kamien', 0.0), w.get('glina', 0.0)
        cp_ = cap[o]
        km = 1 + kb * kam.get(o, 0.0)

        def ct(k, raw, mult=1.0):
            if raw is None or not (raw > 0):
                return
            credit(cities, o, k, floor(raw * mult), cp_)
        dc = stol_inflow((t.get('drewno', 0.0) if t else 0.0) + wd, stol.get(o, 0.0), sb)
        if dc > 0:
            credit(cities, o, 'drewno', dc, cp_)
        ct('kamien', (t.get('kamien', 0.0) if t else 0.0) + wk, km)
        ct('glina', (t.get('glina', 0.0) if t else 0.0) + wg)
        if t is None:
            continue
        for k in ('ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon'):
            ct(k, t.get(k))
    for o in owners:
        cp_ = cap[o]
        pool = owner_all(cities, o)
        thr = {k: dec(v) for k, v in s['throughputs'][str(o)].items()}
        for c in cities:
            if c['owner'] != o:
                continue
            b = built.get(c['id'], [])
            act = [r for r in recipes if (r['buildingId'] or r['id']) in b]
            if not act:
                continue
            for r in act:
                tp = thr[r['id']] if r['id'] in thr else r['fallback']
                pool = run_converter(r, pool, tp, cp_)['stores']
        assign(cities, o, pool)
    sp_out = {}
    for c in cities:
        b = built.get(c['id'], [])
        cp, sp = pay_drain(cities, c['owner'], b, False, drain)
        sp_out[c['id']] = bonus_state(b, cp, sp)
    return dict(
        cities=[dict(id=c['id'], surowce=None if c['sur'] is None else encrec(c['sur'])) for c in cities],
        spichlerz=sp_out, garnPre=garn_pre, garnTrue=garn(cities, built, True, drain),
        garnFalsePost=garn(cities, built, False, drain))


def norm(v):
    if isinstance(v, dict):
        return {k: norm(x) for k, x in v.items()}
    if isinstance(v, list):
        return [norm(x) for x in v]
    if isinstance(v, bool) or v is None or isinstance(v, str):
        return v
    return float(v)


def main(path):
    d = json.load(open(path))
    recipes = [dict(id=r['id'], buildingId=r['buildingId'], inputs=[(k, dec(v)) for k, v in r['inputs']], output=r['output'],
                    outputAmount=float(r['outputAmount']), fallback=float(r['fallback'])) for r in d['recipes']]
    byid = {r['id']: r for r in recipes}
    bad = 0
    for c in d['convCases']:
        r = run_converter(byid[c['recipe']], {k: dec(v) for k, v in c['stores'].items()}, dec(c['tput']), dec(c['outCap']))
        got = dict(produced=enc(r['produced']), cykle=enc(r['cykle']), consumed=encrec(r['consumed']), stores=encrec(r['stores']), reason=r['reason'])
        if norm(got) != norm(c['out']):
            bad += 1
            print('CONV MISMATCH', c['recipe'], c['stores'], c['tput'], c['outCap'], got, c['out'])
    for c in d['eraCases']:
        if norm(enc(throughput_era(c['id'], dec(c['base']), dec(c['era'])))) != norm(c['out']):
            bad += 1
            print('ERA MISMATCH', c)
    for c in d['inflowCases']:
        if norm(enc(stol_inflow(dec(c['base']), dec(c['n']), dec(c['bonus'])))) != norm(c['out']):
            bad += 1
            print('INFLOW MISMATCH', c)
    n_ok = n_skip = 0
    for s in d['scenarios']:
        if s['labels'] is not None:
            n_skip += 1
            continue
        got = tick(s, recipes)
        if norm(got) != norm(s['out']):
            bad += 1
            print('SCENARIO MISMATCH', s['name'])
            print(' py ', json.dumps(got)[:600])
            print(' web', json.dumps(s['out'])[:600])
        else:
            n_ok += 1
    print(f"conv={len(d['convCases'])} era={len(d['eraCases'])} inflow={len(d['inflowCases'])} scenarios_ok={n_ok} skipped_labels={n_skip} mismatches={bad}")
    print('VERIFY ' + ('OK' if bad == 0 else 'FAIL'))
    return 1 if bad else 0


sys.exit(main(sys.argv[1]))
