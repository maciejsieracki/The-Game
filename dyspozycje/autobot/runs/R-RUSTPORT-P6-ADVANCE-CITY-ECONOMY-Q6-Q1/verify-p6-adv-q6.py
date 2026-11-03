"""Niezalezny weryfikator wektorow Q6 (python3 -I verify-p6-adv-q6.py <q6.json> <wonders.json> <econ-params.json> [--neg]).

NIE uzywa Rust ani kodu weba. Przelicza z surowych wejsc scenariusza (q6in) wartosci wyjsciowe weba (out.q6) wlasnymi
wzorami: dochod z tras (krzywe, x2 miedzy ownerami, ceil/2, cuda floor, Targowisko floor), mapy morskie, premia budynkowa
5%, bonus Portu, trade bonus cudow, mapa plonow cudow, reczny podatek + stolica (cityFoundOrder), bankowanie (skarbiec,
nauka, kolejnosc fotele->AI, filtry), sumy per owner z perCity. NIE liczone niezaleznie: tick petli miast, lask Mennicy
po finalize (zalezy od stanu po ticku), zapasy po odjeciu utrzymania.
"""
import json
import math
import re
import sys

NEG = '--neg' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
d = json.load(open(args[0]))
wonders = {w['id']: w for w in json.load(open(args[1]))['cuda']}
econ_all = json.load(open(args[2]))


def num(x):
    if isinstance(x, str):
        if x == 'NaN':
            return math.nan
        if x == 'Infinity':
            return math.inf
        if x == '-Infinity':
            return -math.inf
        if x == '-0':
            return -0.0
        if x.startswith('~'):
            return float(x[1:])
        raise ValueError(x)
    return float(x)


def same(a, b):
    if isinstance(a, float) and math.isnan(a):
        return isinstance(b, float) and math.isnan(b)
    return a == b and math.copysign(1, a) == math.copysign(1, b) if a == 0 else a == b


DEF_LAD = [1, 1, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7, 8]
DEF_MOR = [2, 2, 3, 4, 5, 5, 6, 7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 14, 15, 16]


def curve(econ, diff, key, fb):
    g = econ.get('handel_szlaki') or {}
    row = g.get(key)
    v = row.get(diff) if isinstance(row, dict) else None
    if isinstance(v, list) and v and all(isinstance(x, (int, float)) and not isinstance(x, bool) for x in v):
        return [float(x) for x in v]
    return [float(x) for x in fb]


def cfo(i):
    m = re.fullmatch(r'city([0-9]+)', i)
    return float(m.group(1)) if m else math.inf


checks = 0
bad = []


def eq(label, got, want):
    global checks
    checks += 1
    if not same(got, want):
        bad.append(f'{label}: indep={got!r} web={want!r}')


def wonder_active(w, era):
    return era <= w['absolut']


for s in d['scenarios']:
    name = s['name']
    q = s['q6in']
    w = s['out']['q6']
    diff = s['difficulty']
    econ = s['econ'] if s['econ'] is not None else econ_all
    cities = s['cities']
    era = {int(k): num(v) for k, v in q['era'].items()}
    era_f = lambda o: era.get(o, 1.0)
    placed = q['placed']
    ids_of = lambda o: [p['id'] for p in placed if p['owner'] == o]
    lad = curve(econ, diff, 'dochody_ladowe', DEF_LAD)
    mor = curve(econ, diff, 'dochody_morskie', DEF_MOR)
    eq(f'{name} krzywa lad len', float(len(lad)), float(len(w['inputs']['incomeParams']['lad'])))
    eq(f'{name} krzywa mor len', float(len(mor)), float(len(w['inputs']['incomeParams']['morze'])))

    def wtrade(o, medium):
        t = 0.0
        for i in ids_of(o):
            wd = wonders.get(i)
            if not wd or not wonder_active(wd, era_f(o)):
                continue
            for sp in wd['bonusy'].get('specjalne', []):
                if sp['typ'] != 'handel_procent':
                    continue
                if sp.get('cel') == 'handel_morski' and medium != 'morze':
                    continue
                t += sp['wartosc']
        return t

    for o, v in w['inputs']['wonderTrade'].items():
        o = int(o)
        eq(f'{name} wonderTrade[{o}].lad', wtrade(o, 'lad'), num(v['lad']))
        eq(f'{name} wonderTrade[{o}].morze', wtrade(o, 'morze'), num(v['morze']))

    # mapa plonow cudow
    owners_seen = []
    for c in cities:
        if c['owner'] not in owners_seen:
            owners_seen.append(c['owner'])
    want_wm = {int(k): v for k, v in w['inputs']['wonderMap'].items()}
    got_wm = {}
    for o in owners_seen:
        tot = dict(pieniadz=0, zywnosc=0, nauka=0, kultura=0, zadowolenie=0, praca=0, obrona=0)
        for i in ids_of(o):
            wd = wonders.get(i)
            if not wd or not wd['bonusy'].get('miasto'):
                continue
            if not wonder_active(wd, era_f(o)):
                continue
            for k in tot:
                tot[k] += wd['bonusy']['miasto'].get(k, 0)
        if any(v != 0 for v in tot.values()):
            got_wm[o] = tot
    eq(f'{name} wonderMap owners', float(len(got_wm)), float(len(want_wm)))
    for o, tot in got_wm.items():
        for k, v in tot.items():
            eq(f'{name} wonderMap[{o}].{k}', float(v), num(want_wm[o][k]))

    # trasy
    built = {c['id']: c['built'] for c in cities}
    targ = econ['budynki']['budynek_targowisko_bonus_handlu'][diff] if isinstance(econ.get('budynki'), dict) and isinstance(econ['budynki'].get('budynek_targowisko_bonus_handlu'), dict) and isinstance(econ['budynki']['budynek_targowisko_bonus_handlu'].get(diff), (int, float)) else 0.5
    total, mar, bonus, seac = {}, {}, {}, {}
    for r in q['routes']:
        if r['status'] != 'polaczony':
            continue
        cv = lad if r['medium'] == 'lad' else mor
        idx = max(0, min(len(cv) - 1, math.floor(r['dystans'])))
        base = cv[idx]
        before_half = base if r['ownerId'] == r['toOwnerId'] else base * 2
        inc = float(math.ceil(before_half / 2))
        fw, tw = wtrade(r['ownerId'], r['medium']), wtrade(r['toOwnerId'], r['medium'])
        fa = inc if fw == 0 else float(math.floor(inc * (1 + fw)))
        ta = inc if tw == 0 else float(math.floor(inc * (1 + tw)))
        ft = targ if 'targowisko' in built.get(r['fromCityId'], []) else 0
        tt = targ if 'targowisko' in built.get(r['toCityId'], []) else 0
        fi = fa if ft == 0 else float(math.floor(fa * (1 + ft)))
        ti = ta if tt == 0 else float(math.floor(ta * (1 + tt)))
        total[r['fromCityId']] = total.get(r['fromCityId'], 0.0) + fi
        total[r['toCityId']] = total.get(r['toCityId'], 0.0) + ti
        if r['medium'] == 'morze':
            mar[r['fromCityId']] = mar.get(r['fromCityId'], 0.0) + fi
            mar[r['toCityId']] = mar.get(r['toCityId'], 0.0) + ti
            seac[r['fromCityId']] = seac.get(r['fromCityId'], 0) + 1
            seac[r['toCityId']] = seac.get(r['toCityId'], 0) + 1
        if r['budynekOdblokowany']:
            # premia budynkowa liczona z DOMYSLNYCH krzywych (main.ts:16711 nie podaje params)
            cvd = DEF_LAD if r['medium'] == 'lad' else DEF_MOR
            bi = cvd[max(0, min(len(cvd) - 1, math.floor(r['dystans'])))]
            bh = bi if r['ownerId'] == r['toOwnerId'] else bi * 2
            b = 0.05 * float(math.ceil(bh / 2))
            bonus[r['fromCityId']] = bonus.get(r['fromCityId'], 0.0) + b
            bonus[r['toCityId']] = bonus.get(r['toCityId'], 0.0) + b
    for cid, n in seac.items():
        if n - 1 > 0:
            total[cid] = total.get(cid, 0.0) + (n - 1)
            mar[cid] = mar.get(cid, 0.0) + (n - 1)
    for label, got, want in (('tradeIncome', total, w['inputs']['tradeIncome']), ('maritime', mar, w['inputs']['maritime']), ('bonus', bonus, w['inputs']['bonus'])):
        eq(f'{name} {label} klucze', float(len(got)), float(len(want)))
        for k, v in got.items():
            eq(f'{name} {label}[{k}]', v, num(want[k]))

    # reczny podatek + stolica
    cap_ex = {int(k): v for k, v in q['capital'].items()}

    def capital(o):
        ex = cap_ex.get(o)
        if ex and any(c['id'] == ex and c['owner'] == o for c in cities):
            return ex
        best, bo = None, math.inf
        for c in cities:
            if c['owner'] != o:
                continue
            od = cfo(c['id'])
            if od < bo:
                best, bo = c['id'], od
        return best

    for o, v in w['inputs']['capital'].items():
        eq(f'{name} stolica[{o}]', float(capital(int(o)) is None), float(v is None))
        if v is not None:
            checks += 1
            if capital(int(o)) != v:
                bad.append(f'{name} stolica[{o}] id')
    mt = {}
    for o, t in ((int(k), num(v)) for k, v in q['tax'].items()):
        oc = [c for c in cities if c['owner'] == o]
        if not oc or t <= 0:
            continue
        cid = capital(o)
        tgt = next((c for c in oc if c['id'] == cid), oc[0])
        mt[tgt['id']] = mt.get(tgt['id'], 0.0) + t
    eq(f'{name} manualTax klucze', float(len(mt)), float(len(w['inputs']['manualTax'])))
    for k, v in mt.items():
        eq(f'{name} manualTax[{k}]', v, num(w['inputs']['manualTax'][k]))

    # bankowanie: zbior i kolejnosc, sumy z perCity, skarbiec/nauka
    humans = q['humans']
    ai = []
    for c in cities:
        if c['owner'] not in humans and c['owner'] not in (-1, -99) and c['owner'] not in ai:
            ai.append(c['owner'])
    order = [(h, True) for h in humans] + [(o, False) for o in ai]
    eq(f'{name} liczba bankow', float(len(order)), float(len(w['banks'])))
    pc = s['out']['perCity']
    ids_by_owner = {}
    for c in cities:
        ids_by_owner.setdefault(c['owner'], set()).add(c['id'])
    for (o, hum), b in zip(order, w['banks']):
        eq(f'{name} bank owner', float(o), float(b['owner']))
        eq(f'{name} bank human', float(hum), float(b['human']))
        acc = dict(pieniadz=0.0, nauka=0.0, doPuli=0.0, praca=0.0, kultura=0.0, pieniadzZTras=0.0)
        for t in pc:
            ok = (t['cityId'] in ids_by_owner.get(o, set())) if hum else (t['ownerId'] == o)
            if not ok:
                continue
            for k, tk in (('pieniadz', 'pieniadz'), ('nauka', 'nauka'), ('doPuli', 'doPuli'), ('praca', 'praca'), ('kultura', 'kultura'), ('pieniadzZTras', 'pieniadzZTras')):
                acc[k] += num(t[tk])
        for k, v in acc.items():
            eq(f'{name} bank[{o}].{k}', v, num(b['sum'][k]))
        up = s['out']['upkeep'].get(str(o))
        applied = num(up['r']) if up and num(up['r']) > 0 else 0.0
        eq(f'{name} bank[{o}] utrzymanie', applied, num(b['upkeepApplied']))
        bf = q['before'].get(str(o), {'sk': 0, 'na': 0})
        sk = num(bf['sk']) + acc['pieniadz']
        if applied > 0:
            sk -= applied
        eq(f'{name} bank[{o}] skarbiec', sk, num(b['skarbPo']))
        na = num(bf['na']) + acc['nauka'] + (0.0 if hum else num(q['aiBonus'].get(str(o), 0)))
        eq(f'{name} bank[{o}] nauka', na, num(b['naukaPo']))
        ru = s['out']['resUp'].get(str(o)) or {}
        want_ded = b['resDeducted']
        eq(f'{name} bank[{o}] ded klucze', float(len(ru) if ru else 0), float(len(want_ded)))

if NEG:
    # kontrola negatywna: uszkodzenie jednej wartosci wejsciowej musi byc wykryte
    s0 = next(x for x in d['scenarios'] if x['q6in']['routes'] and any(r['status'] == 'polaczony' for r in x['q6in']['routes']))
    print('NEG: scenariusz', s0['name'], 'trasy', len(s0['q6in']['routes']))

print(f'sprawdzen {checks}, rozbieznosci {len(bad)}')
for b in bad[:20]:
    print('  ', b)
sys.exit(1 if bad else 0)
