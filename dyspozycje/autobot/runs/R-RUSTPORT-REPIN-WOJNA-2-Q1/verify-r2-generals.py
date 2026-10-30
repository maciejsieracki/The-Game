#!/usr/bin/env python3
"""Niezalezny weryfikator (R-RUSTPORT-REPIN-WOJNA-2-Q1, runda 2): ponowna implementacja od zera
z kodu TS na pinie dc8a3adc (gra/src/game/generals.ts, gra/src/game/generalQuickFollow.ts),
porownanie z wektorami generals.json i general-quick-follow.json (wygenerowanymi z URUCHOMIONEGO weba).

Uruchomienie: python3 -I verify-r2-generals.py <DIR_Z_WEKTORAMI>
"""
import json
import math
import sys
from functools import cmp_to_key

VEC_DIR = sys.argv[1]


def num(s):
    return float(s)  # '-0', 'NaN', 'Infinity', '1e+300' sa poprawnymi tekstami Pythona


def isnan(x):
    return x != x


def js_max(a, b):  # Math.max z NaN
    if isnan(a) or isnan(b):
        return float('nan')
    return a if a >= b else b


def js_floor(x):  # Math.floor dla skonczonych; NaN/inf bez zmian
    if isnan(x) or math.isinf(x):
        return x
    return float(math.floor(x))


def limit_for_era(era):
    return max(1.0, js_floor(era)) if math.isfinite(era) else 1.0


def slots_used(alive, queued):
    return js_max(0.0, js_floor(alive)) + js_max(0.0, js_floor(queued))


def can_recruit(era, alive, queued):
    return slots_used(alive, queued) < limit_for_era(era)


def hex_distance(aq, ar, bq, br):
    dq = aq - bq
    dr = ar - br
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def truthy_str(s):
    return s is not None and s != ''


def follow_destination(unit, general):
    if general is None or not general['isGeneral'] or general['ownerId'] != unit['ownerId'] \
            or unit['inGarnizon'] or truthy_str(unit['oblegaCityId']):
        return None
    return {'q': general['q'], 'r': general['r'], 'id': general['id']}


def js_locale_key(s):
    # Tylko do porownan w tym weryfikatorze: ASCII, male/wielkie wg ICU poziom 1 potem poziom 3
    return (s.lower(), s.swapcase())


def locale_cmp(a, b):
    ka, kb = js_locale_key(a), js_locale_key(b)
    return (ka > kb) - (ka < kb)


def nearest(unit, roster):
    if unit['isGeneral'] or unit['dead'] or unit['removed'] or unit['routed']:
        return None
    cands = [c for c in roster if c['id'] != unit['id'] and c['ownerId'] == unit['ownerId']
             and c['isGeneral'] and not c['dead'] and not c['removed'] and not c['routed']
             and (c['hp'] is None or c['hp'] > 0)]

    def cmp(a, b):
        d = hex_distance(unit['q'], unit['r'], a['q'], a['r']) - hex_distance(unit['q'], unit['r'], b['q'], b['r'])
        if d and not isnan(d):
            return -1 if d < 0 else 1
        return locale_cmp(a['id'], b['id'])

    if not cands:
        return None
    return sorted(cands, key=cmp_to_key(cmp))[0]


def unit_from(j):
    return {
        'id': j['id'], 'ownerId': num(j['ownerId']), 'q': num(j['q']), 'r': num(j['r']),
        'isGeneral': bool(j.get('isGeneral', False)), 'hp': num(j['hp']) if 'hp' in j else None,
        'dead': bool(j.get('dead', False)), 'removed': bool(j.get('removed', False)),
        'routed': bool(j.get('routed', False)), 'inGarnizon': bool(j.get('inGarnizon', False)),
        'oblegaCityId': j.get('oblegaCityId'), 'followGeneral': bool(j.get('followGeneral', False)),
    }


def same(a, b):
    return (isnan(a) and isnan(b)) or a == b


def check(cond, msg, fails):
    if not cond:
        fails.append(msg)


def main():
    fails = []
    counts = {}
    g = json.load(open(VEC_DIR + '/generals.json', encoding='utf-8'))
    for i, c in enumerate(g['limit']):
        check(same(limit_for_era(num(c['era'])), num(c['out'])), f'limit {i}', fails)
    counts['limit'] = len(g['limit'])
    for i, c in enumerate(g['slots']):
        check(same(slots_used(num(c['alive']), num(c['queued'])), num(c['out'])), f'slots {i}', fails)
    counts['slots'] = len(g['slots'])
    for i, c in enumerate(g['canRecruit']):
        check(can_recruit(num(c['era']), num(c['alive']), num(c['queued'])) == c['out'], f'canRecruit {i}', fails)
    counts['canRecruit'] = len(g['canRecruit'])
    for c in g['stone']:
        check(('Rydwan (woły)' if c['hasWheel'] else 'Wojownik') == c['out'], 'stone', fails)

    called_n = 0
    for i, c in enumerate(g['purchase']):
        r = c['request']
        era = num(r['era'])
        qty = num(r['requestedQuantity'])
        cost = num(r['requestedCost'])
        off_item = r['offeredItemId']
        off_cost = None if r['offeredCost'] is None else num(r['offeredCost'])
        alive, queued = num(r['alive']), num(r['queued'])
        called = False
        out = False
        ok = True
        if not (qty == 1.0 and r['cityId'] == r['capitalCityId']):
            ok = False
        if ok and not (off_item is not None and off_item != '' and off_item == r['requestedItemId']):
            ok = False
        if ok and not (off_cost is not None and off_cost == cost):
            ok = False
        if ok and not can_recruit(era, alive, queued):
            ok = False
        if ok:
            called = True
            out = c['purchaseReturns']
        check(out == c['out'] and called == c['called'], f'purchase {i}', fails)
        called_n += called
    counts['purchase'] = len(g['purchase'])
    counts['purchaseCalled'] = called_n

    for i, c in enumerate(g['nearest']):
        got = nearest(unit_from(c['unit']), [unit_from(x) for x in c['roster']])
        check((got['id'] if got else None) == c['out'], f'nearest {i}', fails)
    counts['nearest'] = len(g['nearest'])

    for i, c in enumerate(g['followDest']):
        unit = unit_from(c['unit'])
        gen = unit_from(c['general']) if c['general'] is not None else None
        d = follow_destination(unit, gen)
        if c['out'] is None:
            check(d is None, f'followDest {i} none', fails)
        else:
            check(d is not None and same(d['q'], num(c['out']['q'])) and same(d['r'], num(c['out']['r']))
                  and d['id'] == c['out']['generalTargetId'], f'followDest {i}', fails)
    counts['followDest'] = len(g['followDest'])

    for i, c in enumerate(g['batch']):
        marching = [u for u in c['unitIds'] if c['planResult'][u]]
        enq = [marching] if marching else []
        check(marching == c['marching'] and enq == c['enqueued'], f'batch {i}', fails)
    counts['batch'] = len(g['batch'])

    q = json.load(open(VEC_DIR + '/general-quick-follow.json', encoding='utf-8'))
    for c in q['labels']:
        gen = 'wodza' if c['title'] == 'Wódz' else 'generała'
        lab = f'Marsz do {gen}' if c.get('active') else f'Idź do najbliższego {gen}'
        check(gen == c['genitive'] and lab == c['label'], f'label {c}', fails)
    counts['labels'] = len(q['labels'])

    for i, c in enumerate(q['planEnabled']):
        roster = [unit_from(x) for x in c['roster']]
        has = set(c['hasMarch'])
        planned, calls = [], []
        for unit in roster:
            if not unit['followGeneral'] or unit['id'] in has or unit['isGeneral'] or unit['inGarnizon'] \
                    or truthy_str(unit['oblegaCityId']):
                continue
            cmd = nearest(unit, roster)
            fol = follow_destination(unit, cmd) if cmd else None
            if fol is None or hex_distance(unit['q'], unit['r'], fol['q'], fol['r']) == 0:
                continue
            calls.append([unit['id'], fol['q'], fol['r'], fol['id']])
            if c['planResult'][unit['id']]:
                planned.append(unit['id'])
        check(planned == c['planned'], f'planEnabled {i} planned', fails)
        check(len(calls) == len(c['calls']) and all(
            a[0] == b[0] and same(num(b[1]), a[1]) and same(num(b[2]), a[2]) and a[3] == b[3]
            for a, b in zip(calls, c['calls'])), f'planEnabled {i} calls', fails)
    counts['planEnabled'] = len(q['planEnabled'])

    for i, c in enumerate(q['issue']):
        unit = unit_from(c['unit'])
        roster = [unit_from(x) for x in c['roster']]
        title_gen = 'wodza' if c['title'] == 'Wódz' else 'generała'
        notes, refresh, enq, calls = [], 0, [], []
        mleft = num(c['movementLeft'])
        if unit['isGeneral'] or unit['inGarnizon'] or truthy_str(unit['oblegaCityId']):
            res = 'ineligible'
        else:
            cmd = nearest(unit, roster)
            fol = follow_destination(unit, cmd) if cmd else None
            if fol is None or hex_distance(unit['q'], unit['r'], fol['q'], fol['r']) == 0:
                notes.append([f'Brak dostępnego {title_gen} do dołączenia.', 2800.0])
                refresh += 1
                res = 'unavailable'
            else:
                calls.append([unit['id'], fol['q'], fol['r'], fol['id']])
                if not c['planResult']:
                    notes.append([f'Nie można wyznaczyć trasy do {title_gen}.', 3200.0])
                    refresh += 1
                    res = 'unreachable'
                else:
                    notes.append([f'Rozkaz marszu do najbliższego {title_gen} wydany — cel będzie śledził jego pozycję.', 3200.0])
                    refresh += 1
                    if mleft > 0:
                        enq.append([unit['id']])
                    res = 'issued'
        ok = res == c['out'] and refresh == c['refreshes'] and enq == c['enqueued'] \
            and len(notes) == len(c['notes']) and all(a[0] == b[0] and same(a[1], num(b[1])) for a, b in zip(notes, c['notes'])) \
            and len(calls) == len(c['calls'])
        check(ok, f'issue {i}', fails)
    counts['issue'] = len(q['issue'])

    for i, c in enumerate(q['tracked']):
        unit = unit_from(c['unit'])
        occupied = set(c['occupied'])
        marches = {}
        order = []
        for uid, d in c['initial']:
            if uid not in marches:
                order.append(uid)
            marches[uid] = d
        log = []
        res = True
        if unit['ownerId'] != 0.0 or unit['inGarnizon'] or truthy_str(unit['oblegaCityId']):
            res = False
        elif not c['canOccupy']:
            res = False
        else:
            tgt = c['generalTargetId'] if truthy_str(c['generalTargetId']) else None
            dest = {'destQ': c['point']['q'], 'destR': c['point']['r']}
            dest = {k: num(v) for k, v in dest.items()}
            if tgt is not None:
                dest['generalTargetId'] = tgt
            if not c['reachable'] or c['fullPathLen'] == 0:
                res = False
            else:
                log.append(['clear', unit['id']])
                if c['markAsPlayerIssued']:
                    log.append(['mark', unit['id']])
                if unit['id'] not in marches:
                    order.append(unit['id'])
                marches[unit['id']] = dest
                log.append(['sync', unit['id'], dest['destQ'], dest['destR'], dest.get('generalTargetId')])
        ok = res == c['out'] and len(log) == len(c['log'])
        if ok:
            for a, b in zip(log, c['log']):
                if a[0] != b[0] or a[1] != b[1]:
                    ok = False
                    break
                if a[0] == 'sync' and not (same(a[2], num(b[2])) and same(a[3], num(b[3])) and a[4] == b[4]):
                    ok = False
                    break
        check(ok, f'tracked {i}', fails)
        got_order = [uid for uid in order if uid in marches]
        check([uid for uid, _ in c['marches']] == got_order, f'tracked {i} order', fails)
    counts['tracked'] = len(q['tracked'])

    for i, c in enumerate(q['sync']):
        units = [unit_from(x) for x in c['units']]
        by_id = {}
        for u in units:
            by_id[u['id']] = u
        marches = {}
        for uid, d in c['initial']:
            marches[uid] = d
        cleared = []
        for uid, d in list(marches.items()):
            tgt = d.get('generalTargetId') if truthy_str(d.get('generalTargetId')) else None
            if tgt is None:
                continue
            fol = by_id.get(uid)
            com = by_id.get(tgt)
            if fol is None or com is None or not com['isGeneral'] or com['dead'] or com['removed'] \
                    or com['routed'] or (com['hp'] is not None and com['hp'] <= 0) or fol['ownerId'] != com['ownerId']:
                del marches[uid]
                cleared.append(uid)
                continue
            if fol['q'] == com['q'] and fol['r'] == com['r']:
                del marches[uid]
                continue
            if d['destQ'] != com['q'] or d['destR'] != com['r']:
                nd = dict(d)
                nd['destQ'] = com['q']
                nd['destR'] = com['r']
                marches[uid] = nd
        check(cleared == c['cleared'], f'sync {i} cleared', fails)
        check(list(marches.keys()) == [uid for uid, _ in c['marches']], f'sync {i} order', fails)
    counts['sync'] = len(q['sync'])

    print(json.dumps({'counts': counts, 'failures': len(fails), 'first': fails[:5]}))
    return 0 if not fails else 1


if __name__ == '__main__':
    sys.exit(main())
