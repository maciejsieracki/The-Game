#!/usr/bin/env python3
"""Pokrycie wektorow P6.7A: czy scenariusze NIE sa trywialne (dowod braku pustych testow)."""
import json
import sys

VEC = sys.argv[1]


def N(x):
    if isinstance(x, str):
        return float(x[1:]) if x.startswith('~') else float(x)
    return float(x)


def L(n):
    return json.load(open(f'{VEC}/{n}', encoding='utf-8'))


pc = L('post_central.json')['scenarios']
n = len(pc)
changed = sum(1 for s in pc if s['out']['calls'])
calls = sum(len(s['out']['calls']) for s in pc)
grew = sum(1 for s in pc if s['out']['econ']['growth'] not in (0, '0'))
starved = sum(1 for s in pc if s['out']['econ']['starved'] not in (0, '0'))
excl = sum(1 for s in pc if s['exclude'])
mp = sum(1 for s in pc if any(c.get('manpower') is not None for c in s['out']['cities']))
vias = {}
for s in pc:
    vias[s['via']] = vias.get(s['via'], 0) + 1
print('post_central: scenariuszy', n, 'ze zmiana populacji', changed, 'wywolan hookow', calls, 'z wzrostem', grew, 'z glodem', starved,
      'z exclude', excl, 'z manpower', mp, 'via', vias)

e = L('empire.json')
adv = e['advance']
print('advance:', len(adv), 'glodWojska', sum(1 for a in adv for t in a['out']['perOwner'] if t['glodWojska'] is True),
      'atrycja', sum(1 for a in adv for t in a['out']['perOwner'] if t['glodWojskaAtrycjaAktywna'] is True),
      'pomocMiastom>0', sum(1 for a in adv for t in a['out']['perOwner'] if t['pomocMiastom'] not in (0, '0')),
      'ucieto cap', sum(1 for a in adv for t in a['out']['perOwner'] if t['zapasyPo'] == t['maxCap']),
      'wlasciciel -1 pominiety', sum(1 for a in adv if any(u == -1 for u in a['unitOwners'])))
for key in ('plan', 'balance', 'raise', 'maxSafe'):
    sc = e[key]
    if key == 'plan':
        nz = sum(1 for c in sc if c['out']['plan']['atPopCapCityIds'])
        allfed = sum(1 for c in sc if c['out']['plan']['allFed'] is True)
        notfed = sum(1 for c in sc if c['out']['plan']['allFed'] is False)
        print('plan:', len(sc), 'z miastami na limicie', nz, 'allFed', allfed, 'nie allFed', notfed)
    elif key in ('balance', 'raise'):
        adj = sum(1 for c in sc if c['out']['result']['adjusted'] is True)
        print(key + ':', len(sc), 'adjusted', adj, 'zmian poziomow', sum(len(c['out']['result']['changes']) for c in sc))
    else:
        lv = {}
        for c in sc:
            k = str(c['out']['level'])
            lv[k] = lv.get(k, 0) + 1
        print('maxSafe:', len(sc), 'rozklad poziomow', dict(sorted(lv.items())))
g = L('growth.json')
pct = g['percent']
print('percent:', len(pct), 'z macierza cywilizacji niezerowa', sum(1 for c in pct if c['out']['cywilizacja'] not in (0, '0', '-0')),
      'z zaopatrzeniem != 0', sum(1 for c in pct if c['out']['zaopatrzenie'] not in (0, '0', '-0')))
fr = g['fractional']
print('fractional: wzrost', sum(1 for c in fr if c['out']['wzrost'] is True), 'ubytek', sum(1 for c in fr if c['out']['ubytek'] is True), 'co najmniej +2 obywateli w turze', sum(1 for c in fr if c['out']['wzrost'] is True and N(c['out']['nowaLudnosc']) - N(c['city']['population']) >= 2))
hg = g['hunger']
print('hunger: ubytek', sum(1 for c in hg if c['out']['ubytek'] is True), 'bez ubytku (dlug)', sum(1 for c in hg if c['out']['ubytek'] is False and c['fed'] is False))
t = L('tempo_stawki.json')
print('era:', len(t['era']), 'rozne wyniki', len({c['norm'] for c in t['era']}), 'fala2 true', sum(1 for c in t['era'] if c['fala2'] is True))

edge = L('edge.json')
print('edge: advance', len(edge['advance']), 'z odliczaniem glodu (nie null)',
      sum(1 for a in edge['advance'] for x in a['out']['accessors'] if not (isinstance(x['countdown'], dict) and x['countdown'].get('isNull'))),
      '| simulate (ujemne zapasy)', len(edge['simulate']), '| postCentral (brak wpisow fed)', len(edge['postCentral']),
      'ze zmiana populacji', sum(1 for s in edge['postCentral'] if s['out']['calls']))
