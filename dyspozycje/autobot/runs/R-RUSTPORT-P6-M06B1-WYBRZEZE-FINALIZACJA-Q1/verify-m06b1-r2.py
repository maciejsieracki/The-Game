#!/usr/bin/env python3
"""Niezalezny weryfikator P6.M06B1 (runda 2, NAPRAW 2).

Zrodlo prawdy: TS weba, pin edb8fb56, gra/src/map/gen-helpers.ts (linie w komentarzach).
Implementacja napisana OD ZERA w Pythonie na podstawie tekstu TS (NIE na podstawie kodu Rust).
Sprawdza 6 symboli M06B1 + helpery, na wektorach zapisanych przez prawdziwy web:
  - web-vectors.json  (ocean, purge, trim, finalize, thicken, flatten)
  - web-boundary.json (thicken, finalize - granice)
  - web-cap.json      (thicken - limit przebiegow czesci (a), cap 11/12/13)
Dla web-cap.json dodatkowo odtwarza flagi `ref_cap11` / `ref_cap13` (sha256 stanu) z uruchomionego weba.

Uzycie: python3 -I verify-m06b1-r2.py <TESTS_VECTORS_DIR> <WYJSCIE_RAPORT.txt>
Kod wyjscia: 0 = 0 rozbieznosci, 1 = sa rozbieznosci, 2 = blad uzycia.
"""
import hashlib
import json
import os
import sys

# ---- stale z TS (gen-helpers.ts:1177 MAP_BORDER_OCEAN_HEXES = 2; hex.ts TerenBazowy / Nakladka) ----
MAP_BORDER_OCEAN_HEXES = 2
LAKA, ROWNINA, WZGORZA, GORY = 'laka', 'rownina', 'wzgorza', 'gory'
PLYTKIE, MORZE, PUSTYNIA, POLARNY = 'plytkie_morze', 'morze', 'pustynia', 'polarny'
BRAK = 'brak'
# gen-helpers.ts:125 HEX_DIRECTIONS (kolejnosc ma znaczenie tylko dla dowodu; wynik nie zalezy od niej)
HEX_DIRECTIONS = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
COAP_DEFAULT = 2  # thickenCoastAndSmoothInlets(hexes,w,h,coastWidth = 2), :4840
THICK_PASSES_CAP = 12  # gen-helpers.ts:4852 `pass < 12`


class Hex:
    __slots__ = ('terr', 'nak', 'zloze', 'river', 'edges')

    def __init__(self, terr, nak, zloze, river, edges):
        self.terr = terr
        self.nak = nak
        self.zloze = zloze
        self.river = river
        self.edges = edges


def is_water(t):  # gen-helpers.ts:152 isWaterTerrainLocal
    return t == MORZE or t == PLYTKIE


def is_dry(t):  # gen-helpers.ts:3882 isDryLandTerrain
    return not is_water(t)


def key(q, r):  # gen-helpers.ts:157 hexKey
    return f'{q},{r}'


def parse_key(k):  # gen-helpers.ts:3202 parseHexKey
    a, b = k.split(',')
    return int(a), int(b)


def map_border_width(_w, _h):  # gen-helpers.ts:1183
    return MAP_BORDER_OCEAN_HEXES


def hex_border_distance(q, r, w, h):  # gen-helpers.ts:1334
    return min(q, r, w - 1 - q, h - 1 - r)


def is_in_map_border(q, r, w, h, buffer=None):  # gen-helpers.ts:1338
    b = map_border_width(w, h) if buffer is None else buffer
    return hex_border_distance(q, r, w, h) < b


def max_ocean_bay_depth(w, h):  # gen-helpers.ts:4649
    border = map_border_width(w, h)
    scaled = min(w, h) // 6  # Math.floor dla dodatnich
    return max(border + 2, min(border + 14, scaled))


def neighbours(H, q, r):
    for dq, dr in HEX_DIRECTIONS:
        yield H.get(key(q + dq, r + dr))


def count_land_neighbours(H, q, r):  # gen-helpers.ts:3304 countLandNeighbors
    return sum(1 for nh in neighbours(H, q, r) if nh is not None and not is_water(nh.terr))


def set_to_morze(h):  # gen-helpers.ts:3325 setHexToMorze
    h.terr = MORZE
    h.nak = BRAK
    h.river = False
    h.edges = []
    h.zloze = False


def set_to_laka(h):  # gen-helpers.ts:3332 setHexToLaka (rzeka NIE resetowana)
    h.terr = LAKA
    h.nak = BRAK
    h.zloze = False


def reset_to_laka_full(h):  # wzorzec: trimDeepOceanBays :4761, purgeReliefValleyWater :4724
    set_to_laka(h)
    h.river = False
    h.edges = []


def ocean_connected_water(H, w, h):  # gen-helpers.ts:4026 oceanConnectedWaterKeys
    connected = set()
    queue = []
    for r in range(h):
        for q in range(w):
            if q != 0 and r != 0 and q != w - 1 and r != h - 1:
                continue
            k = key(q, r)
            hx = H.get(k)
            if hx is None or not is_water(hx.terr):
                continue
            connected.add(k)
            queue.append(k)
    while queue:
        k = queue.pop()
        q, r = parse_key(k)
        for dq, dr in HEX_DIRECTIONS:
            nk = key(q + dq, r + dr)
            nh = H.get(nk)
            if nh is None or not is_water(nh.terr) or nk in connected:
                continue
            connected.add(nk)
            queue.append(nk)
    return connected


def find_inland_water(H, w, h):  # gen-helpers.ts:4109 findInlandWaterHexes
    ocean = ocean_connected_water(H, w, h)
    return [k for k, hx in H.items() if is_water(hx.terr) and k not in ocean]


def morse_depth_from_border(H, w, h):  # gen-helpers.ts:4659 morseDepthFromMapBorder (BFS po Morze)
    dist = {}
    queue = []
    for r in range(h):
        for q in range(w):
            if not (q == 0 or r == 0 or q == w - 1 or r == h - 1):
                continue
            k = key(q, r)
            hx = H.get(k)
            if hx is None or hx.terr != MORZE:
                continue
            dist[k] = 0
            queue.append(k)
    head = 0
    while head < len(queue):
        k = queue[head]
        head += 1
        d = dist[k]
        q, r = parse_key(k)
        for dq, dr in HEX_DIRECTIONS:
            nk = key(q + dq, r + dr)
            if nk in dist:
                continue
            nh = H.get(nk)
            if nh is None or nh.terr != MORZE:
                continue
            dist[nk] = d + 1
            queue.append(nk)
    return dist


def remove_inland_water_pools(H, w, h):  # gen-helpers.ts:4137 (rzeka NIE resetowana)
    inland = find_inland_water(H, w, h)
    for k in inland:
        hx = H[k]
        hx.terr = LAKA
        hx.nak = BRAK
        hx.zloze = False
    return len(inland)


def remove_small_inland_water_pools(H, w, h, max_size):  # gen-helpers.ts:4276
    inland = set(find_inland_water(H, w, h))
    visited = set()
    converted = 0
    for start in inland:
        if start in visited:
            continue
        comp = []
        stack = [start]
        visited.add(start)
        while stack:
            k = stack.pop()
            comp.append(k)
            q, r = parse_key(k)
            for dq, dr in HEX_DIRECTIONS:
                nk = key(q + dq, r + dr)
                if nk not in inland or nk in visited:
                    continue
                visited.add(nk)
                stack.append(nk)
        if len(comp) > max_size:
            continue
        for k in comp:
            hx = H[k]
            hx.terr = LAKA
            hx.nak = BRAK
            hx.zloze = False
            converted += 1
    return converted


def apply_coast_ring(H):  # gen-helpers.ts:3894 applyCoastRing
    to = []
    for k, hx in H.items():
        if hx.terr != MORZE:
            continue
        q, r = parse_key(k)
        if any(nb is not None and is_dry(nb.terr) for nb in neighbours(H, q, r)):
            to.append(k)
    for k in to:
        hx = H[k]
        hx.terr = PLYTKIE
        hx.nak = BRAK
        hx.zloze = False
    return len(to)


def apply_double_coast_ring(H):  # gen-helpers.ts:3923
    n = apply_coast_ring(H)
    to = []
    for k, hx in H.items():
        if hx.terr != MORZE:
            continue
        q, r = parse_key(k)
        if any(nb is not None and nb.terr == PLYTKIE for nb in neighbours(H, q, r)):
            to.append(k)
    for k in to:
        hx = H[k]
        hx.terr = PLYTKIE
        hx.nak = BRAK
        hx.zloze = False
    return n + len(to)


def find_dry_land_touching_sea(H):  # gen-helpers.ts:3949
    bad = []
    for k, hx in H.items():
        if not is_dry(hx.terr):
            continue
        q, r = parse_key(k)
        if any(nb is not None and nb.terr == MORZE for nb in neighbours(H, q, r)):
            bad.append(k)
    return bad


def sanitize_coast_hexes(H):  # gen-helpers.ts:3975
    valid = set()
    queue = []
    for k, hx in H.items():
        if hx.terr != PLYTKIE:
            continue
        q, r = parse_key(k)
        if any(nb is not None and is_dry(nb.terr) for nb in neighbours(H, q, r)):
            valid.add(k)
            queue.append(k)
    while queue:
        k = queue.pop()
        q, r = parse_key(k)
        for dq, dr in HEX_DIRECTIONS:
            nk = key(q + dq, r + dr)
            if nk in valid:
                continue
            nh = H.get(nk)
            if nh is not None and nh.terr == PLYTKIE:
                valid.add(nk)
                queue.append(nk)
    fixed = 0
    for k, hx in H.items():
        if hx.terr != PLYTKIE:
            continue
        if k in valid:
            continue
        set_to_morze(hx)
        fixed += 1
    return fixed


def purge_relief_valley_water(H, w, h):  # gen-helpers.ts:4724
    depth = morse_depth_from_border(H, w, h)
    converted = 0
    for k, hx in H.items():  # kolejnosc wstawiania = kolejnosc TS Object.values; zmiany widoczne od razu
        if not is_water(hx.terr):
            continue
        if k in depth:
            continue
        q, r = parse_key(k)
        relief = 0
        dry = 0
        for nh in neighbours(H, q, r):
            if nh is None or is_water(nh.terr):
                continue
            dry += 1
            if nh.terr in (GORY, WZGORZA):
                relief += 1
        if relief >= 2 and dry >= 3:
            reset_to_laka_full(hx)
            converted += 1
    return converted


def trim_deep_ocean_bays(H, w, h, _max_depth=None):  # gen-helpers.ts:4761 (parametr _maxDepth nieuzywany)
    depth = morse_depth_from_border(H, w, h)
    converted = 0
    for k, hx in H.items():
        if hx.terr != MORZE:
            continue
        if k in depth:
            continue
        reset_to_laka_full(hx)
        converted += 1
    return converted


def finalize_coast_and_inland_water(H, w, h, max_passes=3, pool=None):  # gen-helpers.ts:4787
    def remove(hh=H):
        if pool is not None:
            return remove_small_inland_water_pools(H, w, h, pool)
        return remove_inland_water_pools(H, w, h)

    for _ in range(max_passes):
        changed = 0
        changed += remove()
        changed += apply_double_coast_ring(H)
        changed += sanitize_coast_hexes(H)
        changed += remove()
        if not find_inland_water(H, w, h) and not find_dry_land_touching_sea(H):
            break
        if changed == 0:
            break
    return None


def thicken_coast_and_smooth_inlets(H, w, h, coast_width=COAP_DEFAULT, cap=THICK_PASSES_CAP):  # :4840
    changed = 0
    # (a) wygladzenie wciec
    for _ in range(cap):
        to_fill = []
        for k, hx in H.items():
            if hx.terr != MORZE:
                continue
            q, r = parse_key(k)
            if is_in_map_border(q, r, w, h):
                continue
            if count_land_neighbours(H, q, r) >= 4:
                to_fill.append(k)
        if not to_fill:
            break
        for k in to_fill:
            set_to_laka(H[k])
            changed += 1
    changed += remove_inland_water_pools(H, w, h)
    # (b) reset Wybrzeza -> Morze, potem coast_width pierscieni
    for hx in H.values():
        if hx.terr == PLYTKIE:
            set_to_morze(hx)
            changed += 1
    for _ in range(coast_width):
        to_coast = []
        for k, hx in H.items():
            if hx.terr != MORZE:
                continue
            q, r = parse_key(k)
            for nb in neighbours(H, q, r):
                if nb is not None and (is_dry(nb.terr) or nb.terr == PLYTKIE):
                    to_coast.append(k)
                    break
        if not to_coast:
            break
        for k in to_coast:
            hx = H[k]
            hx.terr = PLYTKIE
            hx.nak = BRAK
            hx.zloze = False
            changed += 1
    return changed


def flatten_false_coastal_river_notches(H, w, h):  # gen-helpers.ts:4915
    to = []
    for k, hx in H.items():
        if hx.terr != PLYTKIE:
            continue
        if hx.river:
            continue
        q, r = parse_key(k)
        if is_in_map_border(q, r, w, h):
            continue
        morze = sum(1 for nb in neighbours(H, q, r) if nb is not None and nb.terr == MORZE)
        if morze >= 5:
            to.append(k)
    for k in to:
        reset_to_laka_full(H[k])
        H[k].terr = MORZE
    return len(to)


# ---- konwersja wektorow <-> stan ----
def build(rows):
    H = {}
    for k, terr, nak, z, ro, ed in rows:
        H[k] = Hex(terr, nak, z == 1, ro == 1, list(ed))
    return H


def dump(H):
    return [[k, hx.terr, hx.nak, 1 if hx.zloze else 0, 1 if hx.river else 0, list(hx.edges)] for k, hx in H.items()]


def sha_state(state):  # JSON.stringify-zgodny (bez spacji)
    return hashlib.sha256(json.dumps(state, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()


def main():
    if len(sys.argv) != 3:
        print('uzycie: verify-m06b1-r2.py <TESTS_VECTORS_DIR> <WYJSCIE_RAPORT.txt>', file=sys.stderr)
        return 2
    vdir, out_path = sys.argv[1], sys.argv[2]
    lines = []

    def log(s):
        lines.append(s)
        print(s)

    stats = {}  # kind -> [checked, mismatches, nontrivial]
    mism = []

    def tally(kind, ok, nontrivial, cid, detail=''):
        s = stats.setdefault(kind, [0, 0, 0])
        s[0] += 1
        s[2] += 1 if nontrivial else 0
        if not ok:
            s[1] += 1
            mism.append(f'{kind}:{cid}:{detail}')

    # ---- web-vectors.json ----
    wv = json.load(open(os.path.join(vdir, 'web-vectors.json'), encoding='utf-8'))
    maps = wv['maps']
    for c in wv['cases']['ocean']:
        got = str(max_ocean_bay_depth(c['w'], c['h']))
        tally('ocean', got == c['out'], True, c['id'], f'{got}!={c["out"]}')
    for kind in ('purge', 'trim', 'flatten', 'thicken'):
        for c in wv['cases'].get(kind, []):
            H = build(maps[c['mi']])
            before = dump(H)
            w, h = c['W'], c['H']
            if kind == 'purge':
                ret = purge_relief_valley_water(H, w, h)
            elif kind == 'trim':
                ret = trim_deep_ocean_bays(H, w, h, c.get('maxDepth'))
            elif kind == 'flatten':
                ret = flatten_false_coastal_river_notches(H, w, h)
            else:
                cw = COAP_DEFAULT if c.get('coastWidth', 'default') == 'default' else c['coastWidth']
                ret = thicken_coast_and_smooth_inlets(H, w, h, cw)
            st = dump(H)
            ok = str(ret) == c['output']['ret'] and st == c['output']['state']
            tally(kind, ok, st != before, c['id'], f'ret {ret} vs {c["output"]["ret"]}')
    for c in wv['cases']['finalize']:
        H = build(maps[c['mi']])
        before = dump(H)
        finalize_coast_and_inland_water(H, c['W'], c['H'], c['maxPasses'], c.get('pool'))
        st = dump(H)
        tally('finalize', st == c['output']['state'], st != before, c['id'])

    # ---- web-boundary.json ----
    wb = json.load(open(os.path.join(vdir, 'web-boundary.json'), encoding='utf-8'))
    bmaps = wb['maps']
    for c in wb['cases']['thicken']:
        H = build(bmaps[c['mi']])
        before = dump(H)
        ret = thicken_coast_and_smooth_inlets(H, c['W'], c['H'], COAP_DEFAULT)
        st = dump(H)
        tally('boundary-thicken', str(ret) == c['output']['ret'] and st == c['output']['state'], st != before, c['id'])
    for c in wb['cases']['finalize']:
        H = build(bmaps[c['mi']])
        before = dump(H)
        finalize_coast_and_inland_water(H, c['W'], c['H'], c['maxPasses'], c.get('pool'))
        st = dump(H)
        tally('boundary-finalize', st == c['output']['state'], st != before, c['id'])

    # ---- web-cap.json (cap 11/12/13) ----
    wc = json.load(open(os.path.join(vdir, 'web-cap.json'), encoding='utf-8'))
    cmaps = wc['maps']
    cap_obs = []
    for c in wc['cases']['thicken']:
        base = dump(build(cmaps[c['mi']]))
        res = {}
        for cap in (11, 12, 13):
            H = build(cmaps[c['mi']])
            ret = thicken_coast_and_smooth_inlets(H, c['W'], c['H'], COAP_DEFAULT, cap=cap)
            res[cap] = (ret, dump(H))
        ret12, st12 = res[12]
        tally('cap-thicken-cap12', str(ret12) == c['output']['ret'] and st12 == c['output']['state'], st12 != base, c['id'])
        # flagi obserwowalnosci z weba (ref_cap11 / ref_cap13) odtworzone w Pythonie
        for cap, ref in ((11, c['ref_cap11']), (13, c['ref_cap13'])):
            ret, st = res[cap]
            differs = (ret != ret12) or (st != st12)
            ok_flag = differs == ref['differs_from_cap12'] and str(ret) == ref['ret'] and sha_state(st) == ref['state_sha256']
            tally(f'cap-ref-cap{cap}', ok_flag, differs, c['id'], f'python differs={differs} web={ref["differs_from_cap12"]}')
            cap_obs.append((c['id'], cap, differs))
        if c['state_sha256_cap12'] != sha_state(st12):
            tally('cap-sha-cap12', False, True, c['id'], 'sha12')
        else:
            tally('cap-sha-cap12', True, True, c['id'])

    total = sum(v[0] for v in stats.values())
    total_mism = sum(v[1] for v in stats.values())
    log('WERYFIKATOR PYTHON P6.M06B1 (runda 2) - niezalezna implementacja z TS pin edb8fb56')
    log(f'kategoria | sprawdzone | rozbieznosci | nietrywialne (stan zmieniony)')
    for k in sorted(stats):
        n, m, nt = stats[k]
        log(f'{k} | {n} | {m} | {nt}')
    log(f'RAZEM sprawdzone={total} rozbieznosci={total_mism}')
    for cid, cap, d in cap_obs:
        log(f'obserwowalnosc capu: {cid} cap{cap} != cap12 = {d}')
    if mism:
        log('ROZBIEZNOSCI:')
        for m in mism[:50]:
            log('  ' + m)
    log(f'WYNIK: {"0 ROZBIEZNOSCI" if total_mism == 0 else "ROZBIEZNOSCI " + str(total_mism)}')
    with open(out_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    return 0 if total_mism == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
