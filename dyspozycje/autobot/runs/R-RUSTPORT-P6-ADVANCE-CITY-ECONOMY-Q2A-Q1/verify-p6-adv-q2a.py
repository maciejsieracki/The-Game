"""Niezalezny weryfikator wektorow P6-ADVANCE-CITY-ECONOMY-Q2A (python3 -I; bez Rust, bez kodu generatora).

Przelicza od zera, wg TEKSTU weba (pin 4bbef081d: turn-economy.ts, okolica.ts, territory.ts, territory-work.ts,
terrain-improvements.ts, building-stock-cost.ts, economy-upkeep.ts), oczekiwane wartosci z WEJSC wektorow i porownuje z
polem `out` z URUCHOMIONEGO, prawdziwego `advanceCityEconomy`:
  * `territoryResourceByCity` (wszystkie scenariusze + klasa `direct` z fortami/posterunkami i `order`):
    przypisanie heksu -> wlasciciel terytorium -> najblizsze miasto wlasciciela, stawki z terrain-improvements.json,
    skalowanie epoka (tartak/kamieniolom), klucze ulepszen (aliasy, duplikaty, nieznane);
  * `lostToSiblingByCity` (spor sasiadow, remis -> wczesniejszy indeks);
  * `okolicaReczne` po `reconcileAllWorkedTiles` (centrum / poza terytorium / przegrane w sporze / klucz niesparsowalny);
  * `workedMagazynByCity`: wybor pol (auto: wagi per focus + potencjal zywnosci, sort z localeCompare; reczny: kolejnosc
    wpisow) liczony niezaleznie; plony pol (tileYield) i potencjal zywnosci biora sie z DUMPU weba (`tileYields`) -
    ich zgodnosc Rust<->web sprawdza test Rust, nie ten skrypt;
  * ROZDZIAL PULI (luka z -Q1): dla scenariuszy bez konwerterow/Spichlerza/Mennicy (budynki podzbiorem
    magazyn/farma/akwedukt/stolarnia/kamieniarski) przelicza caly tor: kredyt Fazy 1 (cap, mnoznik Stolarni/Kamieniarni,
    wybor miasta o najmniejszym zapasie), przepisanie puli (Faza 2), reconcile capow -> `City.surowce` per miasto.
NIE liczone niezaleznie: plony pola (tileYield), potencjal zywnosci, scenariusze z konwerterami/Spichlerzem/Mennica.
Uzycie: python3 -I verify-p6-adv-q2a.py <q2a.json> <terrain-improvements.json> <econ-params.json> <miasto-params.json>
"""
import json
import math
import re
import sys

INF = float('inf')
CAPPED = {'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'ceramika', 'braz', 'zelazo', 'stal', 'sol', 'zloto', 'kon'}
SUBSET_BUILT = {'magazyn', 'farma', 'akwedukt', 'stolarnia', 'kamieniarski'}
RES_OF = {'tartak': 'drewno', 'kamieniolom': 'kamien', 'glinianka': 'glina', 'kopalnia_miedzi': 'ruda', 'kopalnia_zelaza': 'ruda_zelaza',
          'kopalnia_cyny': 'ruda_cyny', 'warzelnia_soli': 'sol', 'stadnina': 'kon', 'kopalnia_zlota': 'zloto'}
ERA_SCALED = {'tartak', 'kamieniolom'}
ALIASES = {'pastwisko': 'bydlo'}
DEC_RE = re.compile(r'^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$')


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


def js_number(s):
    """JS Number(string) w zakresie uzywanym przez klucze `q,r`: trim, pusty -> 0, dziesietne, inaczej NaN."""
    if s is None:
        return float('nan')  # Number(undefined)
    t = s.strip(' \t\n\r\x0b\x0c ﻿')
    if t == '':
        return 0.0
    if DEC_RE.match(t):
        return float(t)
    return float('nan')


def js_round(x):
    return math.floor(x + 0.5)


def hexdist(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


def close(a, b):
    return a == b or abs(a - b) <= 1e-9 * max(1.0, abs(a), abs(b))


class Ctx:
    def __init__(self, ti, econ, miasto):
        self.ti = ti
        self.econ = econ
        self.rng_min = miasto['zasieg_okolicy_baza']['wartosc']
        self.rng_cap = miasto['zasieg_okolicy_max']['wartosc']
        self.fort_r = ti['fort']['zasieg_terytorium']
        self.outpost_r = ti['posterunek']['zasieg_terytorium']

    def range_for_pop(self, pop):
        p = math.floor(pop) if math.isfinite(pop) else 0
        if p <= 0:
            return 0
        return min(max(self.rng_min, p), self.rng_cap)

    def norm(self, raw):
        if not raw or raw == 'brak':
            return None
        key = ALIASES.get(raw, raw)
        if key in self.ti:
            return key
        return raw if raw in self.ti else None

    def keys_for_hex(self, row):
        _, _, _, _, _, ul, uls, _ = row
        if uls:
            out = []
            for k in uls:
                n = self.norm(k)
                if n is not None and n not in out:
                    out.append(n)
            return out
        n = self.norm(ul if ul is not None else 'brak')
        return [n] if n else []

    def amount(self, key, era):
        v = self.ti[key].get('surowiec_ilosc_tura')
        base = float(v) if isinstance(v, (int, float)) and math.isfinite(v) and v > 0 else 10.0
        if key in ERA_SCALED:
            e = era if era in (2, 3) else 1
            return js_round(base * math.pow(1.5, e - 1))
        return base

    def node_radius(self, n):
        if n.get('fort'):
            return self.fort_r
        if n.get('outpost'):
            return self.outpost_r
        return self.range_for_pop(n['pop'])


def owner_at(cx, q, r, nodes):
    best_city = None
    best_city_d = INF
    best_fort = None
    best_fort_d = INF
    best_fort_o = None
    for n in nodes:
        rad = cx.node_radius(n)
        d = hexdist(q, r, n['q'], n['r'])
        if d > rad:
            continue
        if n.get('fort') or n.get('outpost'):
            o = n.get('order')
            if best_fort is not None and o and best_fort_o:
                better = o['turn'] < best_fort_o['turn'] if o['turn'] != best_fort_o['turn'] else o['seq'] < best_fort_o['seq']
            else:
                better = d < best_fort_d
            if better:
                best_fort_d = d
                best_fort = n['owner']
                best_fort_o = o
        elif d < best_city_d:
            best_city_d = d
            best_city = n['owner']
    return best_city if best_city is not None else best_fort


def city_nodes(cities):
    return [{'q': c['q'], 'r': c['r'], 'pop': c['pop'], 'owner': c['owner']} for c in cities]


def territory_yield(cx, cities, mp, nodes, era_of):
    out = {}
    if not cities:
        return out
    for row in mp['hexes']:
        keys = cx.keys_for_hex(row)
        if not keys:
            continue
        q, r = row[0], row[1]
        owner = owner_at(cx, q, r, nodes)
        if owner is None:
            continue
        best = None
        bd = INF
        for c in cities:
            if c['owner'] != owner:
                continue
            d = hexdist(q, r, c['q'], c['r'])
            if d < bd:
                bd = d
                best = c['id']
        if best is None:
            continue
        for k in keys:
            if k not in RES_OF:
                continue
            rec = out.setdefault(best, {})
            res = RES_OF[k]
            rec[res] = rec.get(res, 0) + cx.amount(k, era_of(owner))
    return out


def lost_to_sibling(cx, cities, mp):
    hexes = {f'{r[0]},{r[1]}': r for r in mp['hexes']}
    index = {}
    for i, c in enumerate(cities):
        index[c['id']] = i
    by_owner = {}
    for c in cities:
        rad = cx.range_for_pop(max(0, math.floor(c['pop'])))
        if rad <= 0:
            continue
        by_owner.setdefault(c['owner'], []).append({'id': c['id'], 'q': c['q'], 'r': c['r'], 'radius': rad})
    out = {}
    for lst in by_owner.values():
        if len(lst) < 2:
            continue
        for a in lst:
            near = [o for o in lst if o['id'] != a['id'] and hexdist(a['q'], a['r'], o['q'], o['r']) <= a['radius'] + o['radius']]
            if not near:
                continue
            lost = set()
            for t in tiles_within(a['q'], a['r'], a['radius'], hexes):
                w_id = a['id']
                w_d = t['dist']
                w_i = index.get(a['id'], INF)
                for s in near:
                    d = hexdist(t['q'], t['r'], s['q'], s['r'])
                    if d > s['radius']:
                        continue
                    si = index.get(s['id'], INF)
                    if d < w_d or (d == w_d and si < w_i):
                        w_d = d
                        w_id = s['id']
                        w_i = si
                if w_id != a['id']:
                    lost.add(t['key'])
            if lost:
                out[a['id']] = lost
    return out


def tiles_within(cq, cr, radius, hexes):
    rad = math.floor(radius) if (math.isfinite(radius) and radius > 0) else 1
    out = []
    for dq in range(-rad, rad + 1):
        lo = max(-rad, -dq - rad)
        hi = min(rad, -dq + rad)
        for dr in range(lo, hi + 1):
            key = f'{cq + dq},{cr + dr}'
            if key not in hexes:
                continue
            q, r = cq + dq, cr + dr
            if q == cq and r == cr:
                continue
            d = hexdist(cq, cr, q, r)
            if d > rad:
                continue
            out.append({'q': q, 'r': r, 'key': key, 'dist': d})
    return out


def reconcile(cities, nodes, lost, cx):
    centers = {f"{c['q']},{c['r']}" for c in cities}
    res = {}
    for c in cities:
        if c['reczne'] is None:
            res[c['id']] = None
            continue
        entries = [[k, v] for k, v in c['reczne']]
        keep = []
        for k, v in entries:
            parts = k.split(',')
            q = js_number(parts[0])
            r = js_number(parts[1] if len(parts) > 1 else None)
            if not (math.isfinite(q) and math.isfinite(r)):
                keep.append([k, v])
                continue
            if k in centers:
                continue
            if not nodes or owner_at(cx, q, r, nodes) != c['owner']:
                continue
            if k in lost.get(c['id'], set()):
                continue
            keep.append([k, v])
        res[c['id']] = keep
    return res


def locale_key(s):
    # ICU/CLDR: interpunkcja '-' < ',' < cyfry; przy kluczach `q,r` o nieujemnych/ujemnych calkowitych wystarcza.
    order = {'-': 0, ',': 1}
    return [(order[ch], 0) if ch in order else (2, ord(ch)) for ch in s]


def worked_yields(cx, cities, mp, tyields, nodes, lost):
    hexes = {f'{r[0]},{r[1]}': r for r in mp['hexes']}
    centers = {f"{c['q']},{c['r']}" for c in cities if True}
    out = {}

    def y_of(key):
        v = tyields.get(key)
        if v is None:
            return None
        return [dec(x) for x in v]

    def workable(q, r, owner, excl):
        key = f'{q},{r}'
        h = hexes.get(key)
        if h is None or h[2] in ('morze', 'gory'):
            return False
        if not nodes:
            return False
        if owner_at(cx, q, r, nodes) != owner:
            return False
        if key in centers or key in excl:
            return False
        return True

    for c in cities:
        tiles_keys = []
        ck = f"{c['q']},{c['r']}"
        if ck in hexes:
            tiles_keys.append(ck)
        pop = max(0, math.floor(c['pop']))
        if pop > 0:
            radius = cx.range_for_pop(pop)
            excl = lost.get(c['id'], set())
            cand = [t for t in tiles_within(c['q'], c['r'], radius, hexes) if workable(t['q'], t['r'], c['owner'], excl)]
            tryb = c['tryb'] or 'auto'
            focus = c['focus'] or 'zywnosc'
            if tryb == 'reczny':
                tmap = {t['key']: t for t in cand}
                chosen = []
                for k, v in (c['reczne'] or []):
                    if not v or v <= 0:
                        continue
                    if k in tmap:
                        chosen.append(tmap[k]['key'])
                if len(chosen) > pop:
                    chosen = chosen[:pop]
            else:
                wagi = {'zywnosc': (10, 0, 0), 'produkcja': (0.5, 3, 0.5), 'podatki': (0.5, 0.5, 3)}.get(focus, (1, 1, 1))
                scored = []
                for t in cand:
                    y = y_of(t['key'])
                    z, p, h = (y[0], y[1], y[2]) if y else (0, 0, 0)
                    pot = y[6] if (y and focus == 'zywnosc') else 0
                    s = z * wagi[0] + p * wagi[1] + h * wagi[2] + pot
                    scored.append({'t': t, 's': s, 'z': z, 'pot': pot})

                def cmp(a, b):
                    if b['s'] != a['s']:
                        return -1 if b['s'] - a['s'] < 0 else 1
                    if focus == 'zywnosc':
                        if b['z'] != a['z']:
                            return -1 if b['z'] - a['z'] < 0 else 1
                        if b['pot'] != a['pot']:
                            return -1 if b['pot'] - a['pot'] < 0 else 1
                    if a['t']['dist'] != b['t']['dist']:
                        return -1 if a['t']['dist'] - b['t']['dist'] < 0 else 1
                    ka, kb = locale_key(a['t']['key']), locale_key(b['t']['key'])
                    return -1 if ka < kb else (1 if ka > kb else 0)

                import functools
                scored.sort(key=functools.cmp_to_key(cmp))
                n = max(0, min(math.floor(c['pop']), len(scored)))
                chosen = [x['t']['key'] for x in scored[:n]]
            tiles_keys.extend(chosen)
        drewno = kamien = glina = 0.0
        for k in tiles_keys:
            y = y_of(k)
            if y is None:
                continue
            drewno += y[3]
            kamien += y[4]
            glina += y[5]
        if drewno > 0 or kamien > 0 or glina > 0:
            out[c['id']] = {'drewno': drewno, 'kamien': kamien, 'glina': glina}
    return out


def econ_val(econ, grp, key, diff, fallback):
    row = (econ.get(grp) or {}).get(key)
    v = row.get(diff) if isinstance(row, dict) else None
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else fallback


def era_of(s, o):
    if s['eraByOwner'] is not None:
        return s['eraByOwner'][str(o)]
    return s['playerEra'] if o == 0 else 1


def cap_of(cx, s, o, mag):
    base = econ_val(cx.econ, 'globalne', 'magazyn_baza_surowce', s['difficulty'], 50000.0)
    bonus = econ_val(cx.econ, 'globalne', 'magazyn_bonus_surowce_na_budynek', s['difficulty'], 500.0)
    era = era_of(s, o)
    e = era if (math.isfinite(era) and era > 1) else 1
    return (base + bonus * mag.get(o, 0)) * (2.0 ** (e - 1))


def credit(cities, st, owner, key, amount, cap=None):
    if not math.isfinite(amount) or amount <= 0:
        return
    oc = [c for c in cities if c['owner'] == owner]
    if not oc:
        return
    to_add = amount
    if cap is not None and math.isfinite(cap):
        cur = sum((st[c['id']] or {}).get(key, 0) for c in oc)
        to_add = max(0, min(to_add, cap - cur))
    if to_add <= 0:
        return
    tgt = sorted(oc, key=lambda c: ((st[c['id']] or {}).get(key, 0), c['id']))[0]
    if st[tgt['id']] is None:
        st[tgt['id']] = {}
    st[tgt['id']][key] = st[tgt['id']].get(key, 0) + to_add


def simulate_pool(cx, s, terr, worked):
    cities = s['cities']
    st = {c['id']: (None if c['surowce'] is None else {k: dec(v) for k, v in c['surowce'].items()}) for c in cities}
    mag, stol, kam = {}, {}, {}
    for c in cities:
        if 'magazyn' in c['built']:
            mag[c['owner']] = mag.get(c['owner'], 0) + 1
        if 'stolarnia' in c['built']:
            stol[c['owner']] = stol.get(c['owner'], 0) + 1
        if 'kamieniarski' in c['built']:
            kam[c['owner']] = kam.get(c['owner'], 0) + 1
    sb = econ_val(cx.econ, 'budynki', 'budynek_stolarnia_bonus_drewna_civ', s['difficulty'], 0.10)
    kb = econ_val(cx.econ, 'budynki', 'budynek_kamieniarski_bonus_kamienia_civ', s['difficulty'], 0.10)
    for c in cities:  # Faza 1
        t = terr.get(c['id'])
        w = worked.get(c['id'], {'drewno': 0, 'kamien': 0, 'glina': 0})
        o = c['owner']
        cap = cap_of(cx, s, o, mag)
        n = max(0, math.floor(stol.get(o, 0)))
        kmult = 1 + kb * kam.get(o, 0)

        def terr_credit(key, raw, mult=1):
            if raw is None or not (raw > 0):
                return
            credit(cities, st, o, key, math.floor(raw * mult), cap)

        base = ((t or {}).get('drewno', 0)) + w['drewno']
        dc = 0 if (not math.isfinite(base) or base <= 0) else math.floor(base * (1 + sb * n))
        if dc > 0:
            credit(cities, st, o, 'drewno', dc, cap)
        terr_credit('kamien', ((t or {}).get('kamien', 0)) + w['kamien'], kmult)
        terr_credit('glina', ((t or {}).get('glina', 0)) + w['glina'])
        if not t:
            continue
        for k in ('ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon'):
            terr_credit(k, t.get(k))
    owners = []
    for c in cities:
        if c['owner'] not in owners:
            owners.append(c['owner'])
    for o in owners:  # Faza 2: przepisanie puli (konwerterow brak)
        pool = {}
        for c in cities:
            if c['owner'] == o and st[c['id']]:
                for k, v in st[c['id']].items():
                    if math.isfinite(v):
                        pool[k] = pool.get(k, 0) + v
        for c in cities:
            if c['owner'] == o and st[c['id']] is not None:
                st[c['id']] = {}
        for k, v in pool.items():
            if math.isfinite(v) and v > 0:
                credit(cities, st, o, k, v)
    by_owner = {}
    for c in cities:  # reconcile capow
        if st[c['id']] is None:
            continue
        by_owner.setdefault(c['owner'], []).append(c)
    for o, oc in by_owner.items():
        cap = cap_of(cx, s, o, mag)
        if not math.isfinite(cap) or cap < 0:
            continue
        keys = {k for c in oc for k in st[c['id']] if k in CAPPED}
        for k in keys:
            total = sum(st[c['id']].get(k, 0) for c in oc)
            excess = total - cap
            if excess <= 0:
                continue
            holders = sorted([c for c in oc if st[c['id']].get(k, 0) > 0], key=lambda c: (-st[c['id']].get(k, 0), c['id']))
            for c in holders:
                if excess <= 0:
                    break
                have = st[c['id']].get(k, 0)
                take = min(have, excess)
                st[c['id']][k] = have - take
                excess -= take
    return st


def cmp_rec(got, want):
    """got/want: {id: {key: float}}; porownanie z tolerancja 1e-9 wzgl. i identycznym zbiorem kluczy."""
    if set(got) != set(want):
        return False
    for i in got:
        if set(got[i]) != set(want[i]):
            return False
        if any(not close(got[i][k], want[i][k]) for k in got[i]):
            return False
    return True


def main(path, ti_path, econ_path, miasto_path):
    d = json.load(open(path))
    cx = Ctx(json.load(open(ti_path)), json.load(open(econ_path)), json.load(open(miasto_path)))
    bad = []
    n = {'terr': 0, 'terr_nonempty': 0, 'lost': 0, 'lost_nonempty': 0, 'reczne': 0, 'reczne_cut': 0, 'worked': 0, 'worked_nonempty': 0,
         'pool': 0, 'pool_nonempty_stock': 0, 'direct': 0, 'direct_fort_order': 0}
    for s in d['scenarios']:
        name = s['name']
        mp = d['maps'][s['mapIdx']]
        ty = d['tileYields'][s['mapIdx']]
        cities = s['cities']
        nodes = city_nodes(cities)
        out = s['out']

        def era_fn(o, s=s):
            return era_of(s, o)

        terr = territory_yield(cx, cities, mp, nodes, era_fn)
        want_t = {k: {kk: dec(vv) for kk, vv in v.items()} for k, v in out['terr'].items()}
        if not cmp_rec(terr, want_t):
            bad.append((name, 'terr', terr, want_t))
        n['terr'] += 1
        n['terr_nonempty'] += bool(terr)
        lost = lost_to_sibling(cx, cities, mp)
        want_l = {k: set(v) for k, v in out['lost'].items()}
        if lost != want_l:
            bad.append((name, 'lost'))
        n['lost'] += 1
        n['lost_nonempty'] += bool(lost)
        rec = reconcile(cities, nodes, lost, cx)
        for i, c in enumerate(cities):
            want = out['reczne'][i]
            got = rec[c['id']]
            wantn = None if want is None else [[k, dec(v)] for k, v in want]
            gotn = None if got is None else [[k, dec(v) if isinstance(v, str) else float(v)] for k, v in got]
            if gotn != wantn:
                bad.append((name, 'reczne', c['id'], gotn, wantn))
            n['reczne'] += 1
            if c['reczne'] is not None and got is not None and len(got) != len(c['reczne']):
                n['reczne_cut'] += 1
        # worked liczone na cities PO reconcile (tryb reczny czyta okolicaReczne po reconcile)
        cities_rc = []
        for c in cities:
            c2 = dict(c)
            r = rec[c['id']]
            c2['reczne'] = None if r is None else [[k, dec(v) if isinstance(v, str) else float(v)] for k, v in r]
            cities_rc.append(c2)
        worked = worked_yields(cx, cities_rc, mp, ty, nodes, lost)
        want_w = {k: {kk: dec(vv) for kk, vv in v.items()} for k, v in out['worked'].items()}
        if not cmp_rec(worked, want_w):
            bad.append((name, 'worked', worked, want_w))
        n['worked'] += 1
        n['worked_nonempty'] += bool(worked)
        if all(set(c['built']) <= SUBSET_BUILT for c in cities):
            st = simulate_pool(cx, s, terr, worked)
            for c, oc in zip(cities, out['cities']):
                got = st[c['id']]
                want = None if oc['surowce'] is None else {k: dec(v) for k, v in oc['surowce'].items()}
                ok = (got is None and want is None) or (got is not None and want is not None and set(got) == set(want) and all(close(got[k], want[k]) for k in got))
                if not ok:
                    bad.append((name, 'pool', c['id'], got, want))
                n['pool'] += 1
                n['pool_nonempty_stock'] += bool(want)
    for s in d['direct']:
        name = s['name']
        mp = d['maps'][s['mapIdx']]
        ty = d['tileYields'][s['mapIdx']]
        cities = [{'id': c['id'], 'owner': c['owner'], 'q': c['q'], 'r': c['r'], 'pop': c['pop'], 'tryb': c['tryb'], 'focus': c['focus'], 'reczne': c['reczne']} for c in s['cities']]
        cn = city_nodes(cities)
        fn = []
        for f in s['forts']:
            node = {'q': f['q'], 'r': f['r'], 'pop': 0, 'owner': f['owner'], 'fort': f['kind'] == 'fort', 'outpost': f['kind'] != 'fort'}
            if 'order' in f:
                node['order'] = f['order']
                n['direct_fort_order'] += 1
            fn.append(node)
        nodes = fn + cn if s['fortsFirst'] else cn + fn
        era_tbl = {int(k): v for k, v in s['eraTbl'].items()}
        terr = territory_yield(cx, cities, mp, nodes, lambda o: era_tbl[o])
        want_t = {k: {kk: dec(vv) for kk, vv in v.items()} for k, v in s['out']['terr'].items()}
        if not cmp_rec(terr, want_t):
            bad.append((name, 'direct-terr', terr, want_t))
        lost = lost_to_sibling(cx, cities, mp)
        if lost != {k: set(v) for k, v in s['out']['lost'].items()}:
            bad.append((name, 'direct-lost'))
        worked = worked_yields(cx, cities, mp, ty, nodes, lost)
        want_w = {k: {kk: dec(vv) for kk, vv in v.items()} for k, v in s['out']['worked'].items()}
        if not cmp_rec(worked, want_w):
            bad.append((name, 'direct-worked', worked, want_w))
        n['direct'] += 1
    print('checked', n)
    print('mismatches', len(bad))
    for b in bad[:15]:
        print('MISMATCH', b)
    if bad:
        print('VERIFY FAIL')
        sys.exit(1)
    print('VERIFY OK')


if __name__ == '__main__':
    main(*sys.argv[1:5])
