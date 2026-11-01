"""Niezalezny weryfikator REPIN-WOJNA-3 (python3 -I): reimplementacja LANCUCHA z TS pinu 4bbef081d
(generals.ts:54-103 nearest/follow-destination, generalQuickFollow.ts:19-35/65-128, planned-march.ts:425-490,
main.ts:28237-28250 + kolejka) od zera, BEZ kodu Rust i BEZ generatora; porownanie z hook.json.
Uzycie: python3 -I verify-w3-hook.py <hook.json>"""
import json
import sys

root = json.load(open(sys.argv[1]))
fails = 0


def hexd(aq, ar, bq, br):
    dq, dr = aq - bq, ar - br
    return (abs(dq) + abs(dr) + abs(dq + dr)) / 2


def pu(u):  # liczby wektora jako tekst
    o = dict(u)
    for k in ('ownerId', 'q', 'r', 'hp'):
        if k in o:
            f = float(o[k])
            o[k] = int(f) if f == int(f) else f
    return o


def nearest(unit, roster):
    if unit.get('isGeneral') is True or unit.get('dead') is True or unit.get('removed') is True or unit.get('routed') is True:
        return None
    c = [x for x in roster if x['id'] != unit['id'] and x['ownerId'] == unit['ownerId'] and x.get('isGeneral') is True
         and x.get('dead') is not True and x.get('removed') is not True and x.get('routed') is not True
         and (x.get('hp') is None or x['hp'] > 0)]
    # ids ASCII: localeCompare == porownanie napisow dla g0/g1; sort stabilny po (odleglosc, id)
    c.sort(key=lambda x: (hexd(unit['q'], unit['r'], x['q'], x['r']), x['id']))
    return c[0] if c else None


def follow_dest(unit, g):
    if g is None or g.get('isGeneral') is not True or g['ownerId'] != unit['ownerId'] or unit.get('inGarnizon') is True or unit.get('oblegaCityId'):
        return None
    return (g['q'], g['r']), g['id']


def sync(units, marches, cleared):
    by = {u['id']: u for u in units}
    for uid, dest in list(marches.items()):
        if not dest.get('generalTargetId'):
            continue
        f, c = by.get(uid), by.get(dest['generalTargetId'])
        if (f is None or c is None or c.get('isGeneral') is not True or c.get('dead') is True or c.get('removed') is True
                or c.get('routed') is True or (c.get('hp') is not None and c['hp'] <= 0) or f['ownerId'] != c['ownerId']):
            del marches[uid]
            cleared.append(uid)
            continue
        if f['q'] == c['q'] and f['r'] == c['r']:
            del marches[uid]
            continue
        if dest['destQ'] != c['q'] or dest['destR'] != c['r']:
            marches[uid] = dict(dest, destQ=c['q'], destR=c['r'])


def key_order(keys):
    def idx(k):
        if k == '0' or (k and k[0] != '0'):
            if k.isdigit() and int(k) < 2**32 - 1:
                return int(k)
        return None
    ints = sorted((k for k in keys if idx(k) is not None), key=int)
    return ints + [k for k in keys if idx(k) is None]


for n, c in enumerate(root['cases']):
    units = [pu(u) for u in c['units']]
    marches = {k: dict(v) for k, v in c['initial']}
    cleared, log = [], []
    sync(units, marches, cleared)
    blocked = set(c['blocked'])
    newly = []
    for u in units:
        if u.get('followGeneral') is not True or u['id'] in marches or u.get('isGeneral') is True or u.get('inGarnizon') is True or u.get('oblegaCityId'):
            continue
        cm = nearest(u, units)
        fd = follow_dest(u, cm) if cm else None
        if not fd or hexd(u['q'], u['r'], fd[0][0], fd[0][1]) == 0:
            continue
        # planTrackedGeneralFollowMarch (markAsPlayerIssued=false)
        if u['ownerId'] != 0 or u.get('inGarnizon') is True or u.get('oblegaCityId'):
            continue
        if u['id'] in blocked:
            continue
        if not c['reachable']:
            continue
        log += [['clear', u['id']]]
        marches[u['id']] = {'destQ': fd[0][0], 'destR': fd[0][1], **({'generalTargetId': fd[1]} if fd[1] else {})}
        log += [['sync', u['id']]]
        newly.append(u['id'])
    queue = list(c['execQueueBefore'])
    for uid in newly:
        u = next((x for x in units if x['id'] == uid), None)
        if u and (int(u['q'] + u['r']) % 2 == 0) and uid not in queue:
            queue.append(uid)
    after = [[k, v] for k, v in marches.items()]
    chk = [
        ('cleared', cleared == c['cleared']),
        ('newly', newly == c['newly']),
        ('queue', queue == c['execQueue']),
        ('log', log == c['log']),
        ('afterPlan', json.dumps(after, sort_keys=True) == json.dumps(c['afterPlan'], sort_keys=True)),
        ('followOff', [[k, bool(marches.get(k, {}).get('generalTargetId'))] for k, _ in c['followOff']] == c['followOff']),
        ('preplanned', [[k, marches.get(k, {}).get('generalTargetId') is not None] for k, _ in c['preplanned']] == c['preplanned']),
    ]
    # toSave / JSON / fromSave
    if marches:
        planned = {}
        first = None
        for uid, d in marches.items():
            planned[uid] = {'destQ': d['destQ'], 'destR': d['destR'],
                            **({'attackUnitId': d['attackUnitId']} if d.get('attackUnitId') else {}),
                            **({'generalTargetId': d['generalTargetId']} if d.get('generalTargetId') else {})}
            if first is None:
                first = {'leaderId': uid, 'destQ': d['destQ'], 'destR': d['destR']}
        save = {'autoMarch': first, 'plannedMarches': planned}
    else:
        save = {}
    chk.append(('saveJson', json.dumps(save, separators=(',', ':')) == c['saveJson']))
    parsed = json.loads(c['saveJson'])
    out = {}
    pm = parsed.get('plannedMarches')
    if isinstance(pm, dict):
        for uid in key_order(list(pm.keys())):
            d = pm[uid]
            if not d or not isinstance(d.get('destQ'), (int, float)) or not isinstance(d.get('destR'), (int, float)):
                continue
            u = next((x for x in units if x['id'] == uid), None)
            if not u or u['ownerId'] != 0:
                continue
            if u['q'] == d['destQ'] and u['r'] == d['destR'] and not (isinstance(d.get('generalTargetId'), str) and d['generalTargetId']):
                continue
            e = {'destQ': d['destQ'], 'destR': d['destR']}
            if isinstance(d.get('attackUnitId'), str) and d['attackUnitId']:
                e['attackUnitId'] = d['attackUnitId']
            if isinstance(d.get('generalTargetId'), str) and d['generalTargetId']:
                e['generalTargetId'] = d['generalTargetId']
            out[uid] = e
    sv = parsed.get('autoMarch')
    if isinstance(sv, dict) and isinstance(sv.get('leaderId'), str):
        u = next((x for x in units if x['id'] == sv['leaderId']), None)
        if u and u['ownerId'] == 0 and not (u['q'] == sv.get('destQ') and u['r'] == sv.get('destR')):
            if isinstance(sv.get('destQ'), (int, float)) and isinstance(sv.get('destR'), (int, float)) and sv['leaderId'] not in out:
                out[sv['leaderId']] = {'destQ': sv['destQ'], 'destR': sv['destR']}
    chk.append(('loaded', json.dumps([[k, v] for k, v in out.items()], sort_keys=True) == json.dumps(c['loaded'], sort_keys=True)
                and [k for k in out] == [k for k, _ in c['loaded']]))
    for name, ok in chk:
        if not ok:
            fails += 1
            print('MISMATCH case', n, name)

print('verify-w3-hook: cases=%d fails=%d' % (len(root['cases']), fails))
sys.exit(1 if fails else 0)
