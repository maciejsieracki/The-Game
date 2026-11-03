#!/usr/bin/env python3
"""NIEZALEZNY weryfikator wektorow REPIN-DELTA-4 (pin 23dd158e9). Uzycie: python3 -I verify_repin4.py <katalog p6_repin4_vectors> <map-gen-params.json>

Reimplementacja w Pythonie WPROST ze zrodel weba (freshwater.ts:54-167, clusters.ts:1533-1582, fort-territory.ts:359,
visibility.ts:268-310, gen-helpers.ts topUp: tylko niezmienniki), BEZ uzycia generatora JS i BEZ kodu Rust.
Weryfikuje, ze wektory (a wiec i testy Rust) sa zgodne z druga, niezalezna implementacja."""
import json, math, sys, os

D = sys.argv[1]
PARAMS = json.load(open(sys.argv[2]))
COEF = PARAMS['generator']['capital_sep_short_side_coef']['wartosc']
NB = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]
TABLE = {'mala': 12, 'srednia': 12, 'duza': 15, 'ogromna': 16, 'super': 19}


def load(n):
    d = json.load(open(os.path.join(D, n)))
    assert d['pin'] == '23dd158e9', n
    return d


def js_round(x):
    return math.floor(x + 0.5)


# ---------------------------------------------------------------- freshwater
def lakes_of(hexes):
    water_order = [(q, r) for q, r, t, _ in hexes if t in ('morze', 'plytkie_morze')]
    water = set(water_order)
    present = {(q, r) for q, r, _, _ in hexes}
    ocean = set()
    stack = []
    for k in water:
        if any((k[0] + dq, k[1] + dr) not in present for dq, dr in NB):
            ocean.add(k)
            stack.append(k)
    while stack:
        q, r = stack.pop()
        for dq, dr in NB:
            nk = (q + dq, r + dr)
            if nk in water and nk not in ocean:
                ocean.add(nk)
                stack.append(nk)
    if not ocean and water:
        seen, largest = set(), []
        for s in water_order:  # kolejnosc wstawiania Set w webie (remis skladowych -> pierwsza)
            if s in seen:
                continue
            comp = [s]
            seen.add(s)
            i = 0
            while i < len(comp):
                q, r = comp[i]
                i += 1
                for dq, dr in NB:
                    nk = (q + dq, r + dr)
                    if nk in water and nk not in seen:
                        seen.add(nk)
                        comp.append(nk)
            if len(comp) > len(largest):
                largest = comp
        ocean = set(largest)
    return water - ocean


def check_freshwater():
    n = 0
    for c in load('freshwater.json')['cases']:
        hexes = c['hexes']
        lake = lakes_of(hexes)
        assert sorted(f'{q},{r}' for q, r in lake) == sorted(c['lakes']), ('lakes', c['kind'])
        obecna = {(q, r) for q, r, _, o in hexes if o}
        river = {(p[0], p[1]) for path in c['riverPaths'] for p in path}
        for q, r, fw, res, is_lake, lake_adj, river_w in c['queries']:
            adj = lambda s: (q, r) in s or any((q + dq, r + dr) in s for dq, dr in NB)
            e_lake_adj = bool(lake) and adj(lake)
            e_river = ((q, r) in obecna) or (bool(river) and adj(river))
            e_fw = e_river or e_lake_adj
            e_res = e_fw or any((q + dq, r + dr) in obecna for dq, dr in NB)
            assert (is_lake, lake_adj, river_w, fw, res) == tuple(int(x) for x in (
                (q, r) in lake, e_lake_adj, e_river, e_fw, e_res)), (c['kind'], q, r)
            n += 1
    return n


# ---------------------------------------------------------------- capital separation
def cap_prop(roz, w, h):
    return max(TABLE[roz], js_round(COEF * min(w, h)))


def cap_for_map(roz, w, h, civ, land):
    short = min(w, h)
    table = TABLE[roz]
    prop = cap_prop(roz, w, h)

    def cap():
        nn = max(1, civ)
        f = 0.25 if short < 80 else 0.8
        area = land if land and land > 0 else w * h
        return math.floor(math.sqrt((area * f) / nn))
    if short < 80:
        if not civ or civ < 2:
            return 0
        v = min(prop, cap())
        return v if v >= 4 else 0
    if not civ or civ < 2:
        return prop
    return max(table, min(prop, cap()))


def check_capsep():
    n = 0
    for c in load('capsep.json')['cases']:
        if c['kind'] == 'prop':
            e = cap_prop(c['rozmiar'], c['w'], c['h'])
        else:
            e = cap_for_map(c['rozmiar'], c['w'], c['h'], c['civ'], c['land'])
        assert e == c['expected'], c
        n += 1
    return n


# ---------------------------------------------------------------- fortSightSources
def check_sight():
    n = 0
    for c in load('sight.json')['cases']:
        exp = [[f['q'], f['r'], 5 if f['type'] == 'fort' else 3] for f in c['forts']
               if f['ownerId'] == c['ownerId'] and f.get('contestedUseless') is not True]
        assert exp == c['expected'], c
        n += 1
    return n


# ---------------------------------------------------------------- visibility z extraSightSources
def dist(a, b):
    dq, dr = a[0] - b[0], a[1] - b[1]
    return (abs(dq) + abs(dr) + abs(dq + dr)) // 2


def disc(c, sight, keys):
    out = set()
    if sight != int(sight):
        # kwirk weba: petla `for (dq = -sight; dq <= sight; dq++)` przy ulamkowym promieniu daje ulamkowe klucze
        # `q+dq`, ktorych nie ma w `map.hexes` => zbior pusty (Rust odtwarza to samo).
        return out
    s = int(sight)
    for dq in range(-s, s + 1):
        for dr in range(-s, s + 1):
            p = (c[0] + dq, c[1] + dr)
            if dist(c, p) <= sight and p in keys:
                out.add(p)
    return out


def check_visibility():
    d = load('visibility.json')
    n = exact = 0
    for c in d['cases']:
        keys = {tuple(map(int, k.split(','))) for k in c['keys']}
        units = set()
        for u in c['units']:
            units |= disc((u['q'], u['r']), u['sight'], keys)
        extra = set()
        for s in c['extra']:
            if s['radius'] > 0:
                extra |= disc((s['q'], s['r']), s['radius'], keys)
        w_ex = {tuple(map(int, k.split(','))) for k in c['withExtra']}
        wo_ex = {tuple(map(int, k.split(','))) for k in c['withoutExtra']}
        assert c['withExtra'] == sorted(c['withExtra'], key=lambda k: tuple(map(int, k.split(',')))), 'kolejnosc'
        if not c['cities']:
            # bez miast: pelna reimplementacja (krag startu = promien 5, visibility-params start_reveal_radius)
            def total(ex):
                v = units | ex
                if v:
                    return v
                if c['startHex'] is not None:
                    return disc((c['startHex']['q'], c['startHex']['r']), 5, keys)
                return set()
            assert w_ex == total(extra), ('z extra', n)
            assert wo_ex == total(set()), ('bez extra', n)
            exact += 1
        else:
            # z miastami (promien z danych gry - nie reimplementowany): zbiory musza zawierac wklad jednostek i extra
            assert units | extra <= w_ex, ('superset', n)
            assert wo_ex <= w_ex or not wo_ex or c['startHex'] is not None, ('monotonia', n)
        n += 1
    assert exact >= 50, exact
    return n


# ---------------------------------------------------------------- topUpPangeaLandFraction (gen-helpers.ts:3705-3837)
from functools import cmp_to_key

HEXDIR = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]  # zbior sasiadow; kolejnosc nie wplywa na licznik
DEFICIT_FRAC, MAX_R2, MARGIN_MIN_D, RING_CEIL, MARGIN_ZONE, BORDER = 0.015, 200, 4, 0.6, 10, 2


def top_up(t, n, z, scores, W, H, target, min_nb, max_rounds):
    """t: dict klucz->kod terenu, n: nakladka, z: zloze; mutuje; zwraca added."""
    keys = [f'{q},{r}' for r in range(H) for q in range(W)]  # kolejnosc wstawiania = Object.keys

    def water(k):
        return t[k] in 'Ms'

    def pq(k):
        a, b = k.split(',')
        return int(a), int(b)

    def land_nb(q, r):
        return sum(1 for dq, dr in HEXDIR if f'{q+dq},{r+dr}' in t and not water(f'{q+dq},{r+dr}'))

    def bdist(q, r):
        return min(q, r, W - 1 - q, H - 1 - r)

    def cdist(q, r):
        cx, cy = (W - 1) / 2, (H - 1) / 2
        dx, dy = (q - cx) / (cx + 0.5), (r - cy) / (cy + 0.5)
        return math.sqrt(dx * dx + dy * dy)

    def setl(k):
        t[k], n[k], z[k] = 'L', '0', '0'

    def cmp_str(a, b):
        return -1 if a < b else (1 if a > b else 0)

    clamped = max(0.15, min(0.85, target))
    target_land = js_round(len(keys) * clamped)
    land = sum(1 for k in keys if not water(k))
    if land >= target_land:
        return 0
    buf = max(2, js_round(H * 0.05))
    added = 0
    sc = lambda k: scores.get(k, 0)

    def base_ok(k):
        q, r = pq(k)
        if not water(k):
            return False
        if bdist(q, r) < BORDER:
            return False
        if bdist(q, r) <= MARGIN_ZONE:
            return False
        if r < buf or r >= H - buf:
            return False
        return True

    rnd = 0
    while rnd < max_rounds and land < target_land:
        cands = [k for k in keys if base_ok(k) and land_nb(*pq(k)) >= min_nb]
        if not cands:
            break
        def c1(a, b):
            d = sc(b) - sc(a)
            return (1 if d > 0 else -1) if abs(d) > 1e-9 else cmp_str(a, b)
        cands.sort(key=cmp_to_key(c1))
        for k in cands:
            if land >= target_land:
                break
            setl(k); land += 1; added += 1
        rnd += 1
    deficit_threshold = js_round(len(keys) * DEFICIT_FRAC)
    if target_land - land > deficit_threshold:
        rnd = 0
        while rnd < MAX_R2 and land < target_land:
            cands = []
            for mn in (2, 1):
                cands = [k for k in keys if base_ok(k) and land_nb(*pq(k)) >= mn]
                if cands:
                    break
            if not cands:
                break
            cd = {k: cdist(*pq(k)) for k in cands}
            def c2(a, b):
                d = sc(b) - sc(a)
                if abs(d) > 1e-9:
                    return 1 if d > 0 else -1
                dc = cd[a] - cd[b]
                return (1 if dc > 0 else -1) if abs(dc) > 1e-9 else cmp_str(a, b)
            cands.sort(key=cmp_to_key(c2))
            for k in cands:
                if land >= target_land:
                    break
                setl(k); land += 1; added += 1
            rnd += 1
        if land < target_land:
            ring_t, ring_l = {}, {}
            for k in keys:
                d = bdist(*pq(k))
                ring_t[d] = ring_t.get(d, 0) + 1
                if not water(k):
                    ring_l[d] = ring_l.get(d, 0) + 1
            rnd = 0
            while rnd < MAX_R2 and land < target_land:
                cands, cd, dof = [], {}, {}
                for k in keys:
                    if not water(k):
                        continue
                    q, r = pq(k)
                    d = bdist(q, r)
                    if d < MARGIN_MIN_D or d > MARGIN_ZONE:
                        continue
                    if r < buf or r >= H - buf:
                        continue
                    if ring_l.get(d, 0) >= ring_t.get(d, 0) * RING_CEIL:
                        continue
                    if land_nb(q, r) < 2:
                        continue
                    cands.append(k); cd[k] = cdist(q, r); dof[k] = d
                if not cands:
                    break
                def c3(a, b):
                    dc = cd[a] - cd[b]
                    return (1 if dc > 0 else -1) if abs(dc) > 1e-9 else cmp_str(a, b)
                cands.sort(key=cmp_to_key(c3))
                for k in cands:
                    if land >= target_land:
                        break
                    d = dof[k]
                    if ring_l.get(d, 0) >= ring_t.get(d, 0) * RING_CEIL:
                        continue
                    setl(k)
                    ring_l[d] = ring_l.get(d, 0) + 1
                    land += 1; added += 1
                rnd += 1
    return added


def check_topup():
    n = 0
    total_added = 0
    for fn in ('topup.json', 'topup_bound.json'):
        for c in load(fn)['cases']:
            W, H = c['W'], c['H']
            keys = [f'{q},{r}' for r in range(H) for q in range(W)]
            t = dict(zip(keys, c['inT']))
            nn = dict(zip(keys, c['inN']))
            zz = {k: '1' for k in keys}
            scores = {k: s for k, s in zip(keys, c['scores']) if s is not None}
            added = top_up(t, nn, zz, scores, W, H, c['target'], c['minNb'], c['maxRounds'])
            assert added == c['added'], (fn, c.get('tag'), added, c['added'])
            assert ''.join(t[k] for k in keys) == c['outT'], (fn, c.get('tag'), 'outT')
            assert ''.join(nn[k] for k in keys) == c['outN'], (fn, c.get('tag'), 'outN')
            assert ''.join(zz[k] for k in keys) == c['outZ'], (fn, c.get('tag'), 'outZ')
            total_added += added
            n += 1
    assert total_added > 5000
    return n


for name, fn in (('freshwater', check_freshwater), ('capsep', check_capsep), ('sight', check_sight),
                 ('visibility', check_visibility), ('topUpPangeaLandFraction', check_topup)):
    print(f'{name}: OK ({fn()} przypadkow)')
print('VERIFY_OK')
