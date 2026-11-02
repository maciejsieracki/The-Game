"""Niezalezny weryfikator -Q4b (python3 -I): przelicza `simulateResourcePipelineForPreview` BEZ kodu Rust, z samych wejsc scenariusza
i `data/econ-params.json`, dla klas scenariuszy, w ktorych wejscia terenowe da sie wyznaczyc niezaleznie:
  * prevsol   - mapa 'gory' bez ulepszen (zero wplywu drewna/gliny/soli), Sol i Ceramika wylacznie z `surowce`,
  * prevempty - jw., Garncarnia/Cegielnia konwertuja pule poczatkowa ponad cap,
  * prevmag   - bogata mapa: ZALOZENIE (nie liczone niezaleznie): wplyw drewna i gliny >= cap, wiec pule drewno/glina = cap.
Wzory: converters.ts (receptury, przepustowosc +10% bazy/epoke dla cegielni i garncarni), economy-upkeep.ts (cap = (baza + bonus*n_magazynow)
* 2^(epoka-1)), building-resource-gate.ts (drain Spichlerza). Uzycie: python3 -I verify-p6-adv-q4b-preview.py <q4b.json> <econ-params.json>
Wypisuje liczbe sprawdzen i rozbieznosci; kod wyjscia 1 przy jakiejkolwiek rozbieznosci.
"""
import json
import math
import sys

q4b = json.load(open(sys.argv[1]))
ECON = json.load(open(sys.argv[2]))


def num(x):
    if isinstance(x, str):
        return float(x[1:]) if x.startswith('~') else float(x)
    return float(x)


def econ_for(s):
    e = json.loads(json.dumps(ECON))
    if s.get('capOverride') is not None:
        for d in ('easy', 'normal', 'hard'):
            e['globalne']['magazyn_baza_surowce'][d] = s['capOverride']
            e['globalne']['magazyn_bonus_surowce_na_budynek'][d] = 1
    for g, k, v in (s.get('econPatch') or []):
        for i, d in enumerate(('easy', 'normal', 'hard')):
            e[g][k][d] = v[i]
    return e


def converters(tput_cegielnia, tput_garncarnia, era):
    sc = 1 + 0.10 * ((era if era > 1 else 1) - 1)
    return [
        ('cegielnia', [('glina', 2), ('drewno', 1)], 'cegla', tput_cegielnia * sc),
        ('garncarnia', [('glina', 1), ('drewno', 1)], 'ceramika', tput_garncarnia * sc),
    ]


def expected(s, assume_inflow_to_cap):
    e = econ_for(s)
    d = s['difficulty']
    era = num(s['playerEra'])
    mult = 2 ** ((era if era > 1 else 1) - 1)
    cities = s['cities']
    n_mag = sum(1 for c in cities for b in c['built'] if b == 'magazyn')
    cap = (e['globalne']['magazyn_baza_surowce'][d] + e['globalne']['magazyn_bonus_surowce_na_budynek'][d] * n_mag) * mult
    pool = {}
    for c in cities:
        for k, v in (c['surowce'] or {}).items():
            pool[k] = pool.get(k, 0) + num(v)
    if assume_inflow_to_cap:
        pool['glina'] = cap
        pool['drewno'] = cap
    b = e['budynki']
    recipes = converters(b['budynek_cegielnia_przepustowosc'][d], b['budynek_garncarnia_przepustowosc'][d], era)
    for c in cities:
        for rid, ins, out, tput in recipes:
            if rid not in c['built']:
                continue
            t = math.floor(tput) if tput > 0 else 0
            lim = min(math.floor(pool.get(k, 0) / n) for k, n in ins)
            room = max(0, cap - pool.get(out, 0))
            cyc = max(0, min(t, lim, math.floor(room)))
            if cyc > 0:
                for k, n in ins:
                    pool[k] = pool.get(k, 0) - n * cyc
                pool[out] = pool.get(out, 0) + cyc
    a1 = b['budynek_spichlerz_zuzywa_ceramika'][d]
    a2 = b['budynek_spichlerz_ii_zuzywa_ceramika'][d]
    so = b['budynek_spichlerz_ii_zuzywa_sol'][d]
    sp = {}
    for c in cities:
        has1 = 'spichlerz' in c['built']
        has2 = 'spichlerz_ii' in c['built']
        if not has1 and not has2:
            sp[c['id']] = [False, False, False, False]
            continue
        amount = a2 if has2 else a1
        cer = pool.get('ceramika', 0) >= amount
        sol = has2 and pool.get('sol', 0) >= so
        if cer:
            pool['ceramika'] = pool.get('ceramika', 0) - amount
        if sol:
            pool['sol'] = pool.get('sol', 0) - so
        m2 = has2 and cer and sol
        m1 = cer and not m2
        sp[c['id']] = [cer, has2 and sol, m1, m2]
    return sp, pool.get('ceramika', 0)


checked = bad = 0
by_cls = {}
for s in q4b['extra']:
    if s['cls'] not in ('prevsol', 'prevempty', 'prevmag'):
        continue
    sp, cer = expected(s, s['cls'] == 'prevmag')
    w = s['prev']
    by_cls[s['cls']] = by_cls.get(s['cls'], 0) + 1
    for cid, st in sp.items():
        checked += 1
        if list(w['sp'][cid]) != st:
            bad += 1
            print('ROZBIEZNOSC sp', s['name'], cid, 'python', st, 'web', w['sp'][cid])
    checked += 1
    if num(w['cer']['0']) != cer:
        bad += 1
        print('ROZBIEZNOSC ceramika', s['name'], 'python', cer, 'web', w['cer']['0'])
print('scenariusze', by_cls, 'sprawdzen', checked, 'rozbieznosci', bad)
sys.exit(1 if bad else 0)
