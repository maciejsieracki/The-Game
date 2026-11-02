"""Niezalezny weryfikator R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1 (plaster P23 utrzymanie per owner + koncowka ticku).

Uruchomienie: python3 -I verify-p6-adv-q5.py <q5.json> <DATA_DIR_PINU>   (DATA_DIR = gra/data z `git archive 4bbef081d`).
BEZ Rust i BEZ kodu generatora: wejscia scenariusza i wyniki weba czytane z wektora; liczone od nowa wg KODU WEBA
(turn-economy.ts:2834-2884, economy-upkeep.ts, production.ts:243, building-stock-cost.ts:28-81, r-stawki-strojenie.ts)
na PLIKACH DANYCH PINU (buildings.json, units.json, econ-params.json), nie na danych Rust.

LICZONE NIEZALEZNIE: poziom budynku (`buildingLevelForEpoch` z era/tech wlasciciela), utrzymanie zlota budynkow
(`buildingUpkeep`: FALA2 x2 i mnoznik ery wejscia), utrzymanie zlota jednostek (`unitUpkeep`: tabela z units.json
skalowana epoka, fallback `utrzymanie_jednostka_standard`, FALA1xFALA2 x4, Math.round), saldo i deficyt
(`upkeepBalance`), utrzymanie surowcowe budynkow (5 szt. na typ z `koszt_surowce`) i jednostek (`unitResourceUpkeep`),
scalenie `addResourceCosts`, zbior wlascicieli (miasta + jednostki), sumy ticku (cities, totalPieniadz, totalZywnosc,
totalPracaPula), growth = starved = 0, niezmienniki Z-Q4-3 (faza pierwszego wolania resolverow).
NIE LICZONE NIEZALEZNIE (web<->Rust tylko w tescie Rust): `pracaUpkeepByOwner` (wlasnosc terytorium), `incomeByOwner`
(wejscie z weba; liczone w petli, weryfikator Q4), petla miast, leczenie jednostek (P24), wartosci resolverow zywych
(wejscie z weba).
"""
import copy
import json
import math
import sys
import unicodedata

NAN = float('nan')
INF = float('inf')


def dec(x):
    if x is None:
        return None
    if isinstance(x, bool):
        return x
    if isinstance(x, (int, float)):
        return float(x)
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
    raise ValueError('nie liczba: %r' % (x,))


def jfloor(x):
    return x if (math.isnan(x) or math.isinf(x)) else float(math.floor(x))


def jround(x):
    if math.isnan(x) or math.isinf(x):
        return x
    return float(math.floor(x + 0.5))


def same(a, b):
    if isinstance(a, (list, bool)) or isinstance(b, (list, bool)):
        return a == b
    a, b = dec(a), dec(b)
    if isinstance(a, float) and isinstance(b, float):
        if math.isnan(a) and math.isnan(b):
            return True
        return a == b and math.copysign(1, a) == math.copysign(1, b)
    return a == b


def strip_lower(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').strip().lower()


def epoch_mult(epoch):
    if isinstance(epoch, (int, float)) and not isinstance(epoch, bool):
        o = math.floor(epoch)
        return 4 if o >= 3 else 2 if o >= 2 else 1
    if not isinstance(epoch, str):
        return 1
    n = strip_lower(epoch)
    if n.replace('.', '', 1).isdigit() and n.count('.') <= 1 and not n.startswith('.') and not n.endswith('.'):
        return epoch_mult(float(n))
    if n in ('kamien', 'stone', '1'):
        return 1
    if n in ('braz', 'bronze', '2'):
        return 2
    if n in ('zelazo', 'zelazo+', 'iron', 'iron+', 'iron plus', 'steel', 'stal'):
        return 4
    return 1  # building-stock-cost.ts:57


def scale_cost(cost, epoch):
    if not (isinstance(cost, (int, float)) and math.isfinite(cost)) or cost < 0:
        return 0.0
    if cost == 0:
        return 0.0
    return max(1.0, jround(cost * epoch_mult(epoch)))


def building_era_mult(e):
    era = math.floor(e) if isinstance(e, (int, float)) and math.isfinite(e) else 1
    return 4 if era >= 3 else 2 if era >= 2 else 1


def level_for_epoch(ep_wej, city_epoch, maks, gate, unlocked):
    lvl = math.floor(city_epoch) - math.floor(ep_wej) + 1
    cap = math.floor(maks) if (isinstance(maks, (int, float)) and math.isfinite(maks) and maks > 0) else 1
    level = max(1, min(cap, lvl))
    if gate:
        for key in sorted(gate, key=lambda k: int(k)):  # klucze calkowite rosnaco (kolejnosc Object.entries)
            g = float(key)
            if level >= g and gate[key] not in unlocked:
                level = min(level, g - 1)
    return level


def building_upkeep(b, level):
    lvl = level if level >= 1 else 1
    base, wz = b['utrzymanie'], b['przyrostUtrzymania']
    raw = math.floor(base + wz * (max(1, math.floor(lvl)) - 1))
    fala2 = math.floor(raw * 2)
    return float(math.floor(fala2 * building_era_mult(b['epokaWejscia'])))


def add_costs(acc, add):
    for k, v in add.items():
        if isinstance(v, (int, float)) and math.isfinite(v) and v > 0:
            acc[k] = acc.get(k, 0.0) + v


def verify(path, data_dir):
    import os
    d = json.load(open(path, encoding='utf8'))
    base_buildings = json.load(open(data_dir + '/buildings.json', encoding='utf8'))
    base_units = json.load(open(data_dir + '/units.json', encoding='utf8'))
    alt_units = [json.load(open(os.path.join(os.path.dirname(path), 'unit_table_%d.json' % i), encoding='utf8')) for i in range(d['unitTableCount'])]
    alt_buildings = d['buildingCatalogs']
    econ_base = json.load(open(data_dir + '/econ-params.json', encoding='utf8'))

    def index_buildings(buildings):
        out = {}
        for b in buildings:
            out.setdefault(b['id'], b)  # find() = pierwszy
        return out

    def index_units(units):
        by_name = {}
        for u in units:
            if isinstance(u.get('Jednostka'), str):
                by_name.setdefault(u['Jednostka'], u)
        # buildUnitUpkeepTable: pierwszy klucz `Utrzymanie*` z liczba skonczona; ostatni wiersz o tej nazwie wygrywa
        tbl = {}
        for u in units:
            name = u.get('Jednostka')
            if not isinstance(name, str) or len(name) == 0:
                continue
            v = None
            for k in u:
                if k.startswith('Utrzymanie') and isinstance(u[k], (int, float)) and not isinstance(u[k], bool):
                    v = u[k]
                    break
            if v is not None:
                tbl[name] = scale_cost(v, u.get('Epoka'))
        return by_name, tbl

    base_bld_idx = index_buildings(base_buildings)
    base_unit_idx = index_units(base_units)
    alt_bld_idx = [index_buildings(c) for c in alt_buildings]
    alt_unit_idx = [index_units(t) for t in alt_units]
    checks = 0
    bad = []

    def chk(label, got, want):
        nonlocal checks
        checks += 1
        if not same(got, want):
            bad.append('%s: weryfikator=%r web=%r' % (label, got, want))

    stats = dict(scen=0, owners=0, unit_scen=0, deficyt=0, levels_gate=0, res_units=0)
    for s in d['scenarios']:
        stats['scen'] += 1
        bld_by_id = alt_bld_idx[s['bldCat']] if s.get('bldCat') is not None else base_bld_idx
        unit_by_name, table = alt_unit_idx[s['unitTable']] if s.get('unitTable') is not None else base_unit_idx
        w = s['out']
        om = s['om']
        econ = s['econ'] if s['econ'] is not None else econ_base
        diff = s['difficulty']
        g = econ.get('globalne') if isinstance(econ.get('globalne'), dict) else None
        row = g.get('utrzymanie_jednostka_standard') if g else None
        v = row.get(diff) if isinstance(row, dict) else None
        standard = float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else 1.0
        zbadane = set(om['zbadane'])

        def era_of(o):
            if om['era'] is not None:
                return dec(om['era'][str(o)])
            return dec(s['playerEra']) if o == 0 else 1

        def tech_of(o):
            if om['tech'] is not None:
                return set(om['tech'].get(str(o), []))
            return zbadane

        city_owners = [c['owner'] for c in s['cities']]
        unit_owners = [u['owner'] for u in s['units']]
        owners = sorted(set(city_owners) | set(unit_owners))
        # buildingsByOwner
        bo = {}
        for c in s['cities']:
            if not c['built']:
                continue
            era = era_of(c['owner'])
            tech = tech_of(c['owner'])
            lst = bo.setdefault(c['owner'], [])
            for bid in c['built']:
                b = bld_by_id.get(bid)
                if b is None:
                    continue
                lv = level_for_epoch(b['epokaWejscia'], era, b['maksPoziom'], b.get('poziomTechGate'), tech)
                if b.get('poziomTechGate') and lv != level_for_epoch(b['epokaWejscia'], era, b['maksPoziom'], None, tech):
                    stats['levels_gate'] += 1
                lst.append((b, lv))
        chk(s['name'] + ' wlasciciele upkeep', sorted(int(k) for k in w['upkeep']), owners)
        if s['units']:
            stats['unit_scen'] += 1
        for o in owners:
            stats['owners'] += 1
            lst = bo.get(o, [])
            b_gold = 0.0
            for b, lv in lst:
                b_gold += building_upkeep(b, lv)
            ou = [u for u in s['units'] if u['owner'] == o]
            u_gold = 0.0
            for u in ou:
                base = table.get(u['typeId'])
                if base is None or not math.isfinite(base):
                    base = standard
                if base <= 0:
                    r = 0.0
                else:
                    r = jround(base * 4)
                u_gold += r
            inc = dec(w['income'].get(str(o), 0))
            inc = inc if math.isfinite(inc) else 0.0
            total = b_gold + u_gold
            saldo = inc - total
            x = w['upkeep'][str(o)]
            l = '%s upkeep[%d]' % (s['name'], o)
            chk(l + ' budynki', b_gold, x['b'])
            chk(l + ' jednostki', u_gold, x['j'])
            chk(l + ' razem', total, x['r'])
            chk(l + ' saldo', saldo, x['s'])
            chk(l + ' deficyt', saldo < 0, x['d'])
            stats['deficyt'] += int(saldo < 0)
            # utrzymanie surowcowe
            res_b = {}
            for b, _lv in lst:
                one = {}
                ks = b.get('koszt_surowce')
                if isinstance(ks, dict):
                    for k, val in ks.items():
                        if isinstance(val, (int, float)) and not isinstance(val, bool) and math.isfinite(val) and val > 0:
                            one[k] = 5.0
                add_costs(res_b, one)
            res_u = {}
            for u in ou:
                ud = unit_by_name.get(u['typeId'])
                one = {}
                if ud is not None:
                    raw = ud.get('Utrzymanie surowiec')
                    name = ('' if raw is None else str(raw)).strip()
                    if name and name != '-':
                        il = ud.get('Utrzymanie surowiec (ilość)')
                        if isinstance(il, (int, float)) and not isinstance(il, bool) and math.isfinite(il) and il > 0:
                            key = strip_lower(name)
                            if key:
                                one[key] = scale_cost(il, ud.get('Epoka'))
                add_costs(res_u, one)
            res = dict(res_b)
            add_costs(res, res_u)
            stats['res_units'] += int(bool(res_u))
            for nm, got, want in (('resUp', res, w['resUp'][str(o)]), ('resUpB', res_b, w['resUpB'][str(o)]), ('resUpU', res_u, w['resUpU'][str(o)])):
                chk('%s %s[%d] klucze' % (s['name'], nm, o), sorted(got), sorted(want))
                for k in got:
                    chk('%s %s[%d].%s' % (s['name'], nm, o, k), got[k], want.get(k))
        # sumy ticku (te, ktore da sie wyprowadzic z pol tickow)
        pc = w['perCity']
        tot = w['totals']
        chk(s['name'] + ' cities', float(len(pc)), tot['cities'])
        for nm, field in (('pieniadz', 'pieniadz'), ('zywnosc', 'bilansLokalny'), ('pracaPula', 'doPuli')):
            acc = 0.0
            for t in pc:
                acc += dec(t[field])
            chk('%s total %s' % (s['name'], nm), acc, tot[nm])
        chk(s['name'] + ' growth', 0.0, tot['growth'])
        chk(s['name'] + ' starved', 0.0, tot['starved'])
    # Z-Q4-3: faza pierwszego wolania resolverow (z pomiaru weba)
    ph = dict(live=0, first_calls=0, in_phase0_with_labels=0, after_drain=0, post_differs=0)
    for s in d['scenarios']:
        if not s['live']:
            continue
        ph['live'] += 1
        lv = s['out']['live']
        for kind in ('zloto', 'labels', 'stock'):
            for o, p in lv['first'][kind].items():
                ph['first_calls'] += 1
                checks += 1
                if p == 2:
                    ph['after_drain'] += 1
                    bad.append('%s %s[%s]: pierwsze wolanie PO drenazu' % (s['name'], kind, o))
                if s['live']['labelsDefined']:
                    checks += 1
                    if p != 0:
                        bad.append('%s %s[%s]: z etykietami pierwsze wolanie w fazie %s (oczekiwano 0)' % (s['name'], kind, o, p))
                    else:
                        ph['in_phase0_with_labels'] += 1
        for o, v in lv['post']['zloto'].items():
            if str(o) in lv['val']['zloto'] and lv['val']['zloto'][str(o)] != v:
                ph['post_differs'] += 1
                break
    return checks, bad, stats, ph


def main():
    path, data_dir = sys.argv[1], sys.argv[2]
    checks, bad, stats, ph = verify(path, data_dir)
    print('sprawdzen: %d, rozbieznosci: %d' % (checks, len(bad)))
    print('statystyki:', stats)
    print('Z-Q4-3:', ph)
    for b in bad[:20]:
        print('ROZBIEZNOSC', b)
    # kontrola negatywna: zepsucie dwoch wartosci w kopii wektora musi byc wykryte
    d = json.load(open(path, encoding='utf8'))
    neg = copy.deepcopy(d)
    hit = 0
    for s in neg['scenarios']:
        if hit == 0 and s['out']['upkeep']:
            o = sorted(s['out']['upkeep'])[0]
            s['out']['upkeep'][o]['r'] = dec(s['out']['upkeep'][o]['r']) + 1
            hit += 1
        elif hit == 1:
            for o, rec in s['out']['resUpU'].items():
                if rec:
                    k = sorted(rec)[0]
                    rec[k] = dec(rec[k]) + 5
                    hit += 1
                    break
        if hit == 2:
            break
    tmp = path + '.neg.tmp'
    json.dump(neg, open(tmp, 'w', encoding='utf8'))
    _c, nbad, _s, _p = verify(tmp, data_dir)
    import os
    os.remove(tmp)
    print('kontrola negatywna: zepsutych wartosci %d, wykrytych rozbieznosci %d' % (hit, len(nbad)))
    ok = not bad and hit == 2 and len(nbad) >= 2 and ph['after_drain'] == 0
    print('WYNIK:', 'OK' if ok else 'BLAD')
    sys.exit(0 if ok else 1)


main()
