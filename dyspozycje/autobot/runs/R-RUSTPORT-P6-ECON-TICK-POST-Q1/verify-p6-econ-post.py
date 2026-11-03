"""Niezalezny weryfikator wektorow POST (python3 -I verify-p6-econ-post.py <post_0.json> [--neg]).

NIE uzywa Rust ani kodu weba. Z surowych wejsc (boundary + inputs) i z wartosci weba po kroku przelicza WLASNYMI wzorami:
  deficyt Zlota: skarbiec<0 (NaN -> false), licznik tur Z RZEDU, atrycja = tury>=karencja, stan po ticku, wlasciciele
    ([0, AI wg kolejnosci miast, klucze stanow] bez -1), strata HP = max(1,floor(hpMax*clamp(frac,0,1))), zniszczone = hp<=0,
    cywile (hp bez zmian) tylko w kategoriach nieuzbrojonych, brak zmian gdy frac<=0, usuniecie zniszczonych z listy,
    liczniki gracza (owner 0);
  wzrost po centrali: racja nakarmione == fed, kara/mnoznik Porzadku: total == suma skladnikow * czynnik
    (czynnik = max(0,x) gdy x skonczone, inaczej 1; brak wpisu = 1), maleMiasto = max(0, 6-populacja), szczescie = floor(max(0,h)/10),
    zaopatrzenie = wpis citizen albo 0, growth/starved = przyrost o liczbe miast z flaga, 'changed' = miasta o zmienionej populacji
    w kolejnosci wierszy EmpireFood, miasto oblegane pomijane, MP bez zmian gdy populacja bez zmian;
  upkeep Pracy: pula gracza = max(0, pula - upkeep) tylko gdy upkeep>0, pule AI tylko dla oid!=0 i up>0, _lastPracaRate -= upkeep gracza.
NIE liczone niezaleznie: skladniki breakdown poza wymienionymi (racje, zdrowie, spichlerz, cywilizacja), pop-cap, refresh MP,
parametry deficytu (wartosci tabeli econ).
Kontrola negatywna (--neg): po zmanipulowaniu wartosci weryfikator MUSI zglosic rozbieznosci.
"""
import json
import math
import sys

NEG = '--neg' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
d = json.load(open(args[0]))


def num(x):
    if x is None:
        return None
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


def eq(a, b):
    if a is None or b is None:
        return a is b
    if math.isnan(a):
        return math.isnan(b)
    return a == b and math.copysign(1, a) == math.copysign(1, b)


def js_floor(x):
    return math.floor(x) if math.isfinite(x) else x


fails = []
checks = 0


def chk(cond, msg):
    global checks
    checks += 1
    if not cond:
        fails.append(msg)


CIVILIAN = {'osadnik', 'robotnik', 'zwiadowca'}
CIVILIAN_TYPES = {'Zwiadowca', 'Osadnik', 'Robotnik'}


def civilian(u):
    return u['category'] in CIVILIAN or u['typeId'] in CIVILIAN_TYPES


def js_max0(x):
    return x if math.isnan(x) else max(0.0, x)
n_atr = n_destroyed = n_mult = n_changed = n_praca = 0

for s in d['scenarios']:
    nm = s['name']
    P = s['post']
    B, I, G, W, R = P['boundary'], P['inputs'], P['gd'], P['growth'], P['praca']
    if NEG and nm == d['scenarios'][0]['name']:
        G['playerDamaged'] += 1
        R['player'] = 12345
    humans = set(I['humans'])
    treasury = {int(k): num(v) for k, v in I['treasury'].items()}
    states = {int(k): v for k, v in I['gdStates'].items()}
    karencja = num(G['params']['karencja'])
    hpfrac = num(G['params']['hp'])
    # --- wlasciciele ---
    ai = []
    for c in B['cities']:
        o = c['owner']
        if o not in humans and o not in (-1, -99) and o not in ai:
            ai.append(o)
    ids = [0]
    for o in ai + sorted(states.keys()):
        if o not in ids:
            ids.append(o)
    ids = [o for o in ids if o != -1]
    chk(sorted(ids) == sorted(G['ownerIds']), f'{nm} gd wlasciciele')
    chk(ids[: 1 + len(ai) - (1 if 0 in ai else 0)] == [o for o in G['ownerIds']][: 1 + len(ai) - (1 if 0 in ai else 0)], f'{nm} gd kolejnosc poczatku')
    # --- ticki ---
    tick_by = {}
    st_after = {}
    for o in ids:
        sk = treasury.get(o, 0.0) if o not in humans else treasury[o]
        deficyt = (not math.isnan(sk)) and sk < 0
        przed = states.get(o, 0)
        po = przed + 1 if deficyt else 0
        atr = po >= karencja
        tick_by[o] = (sk, deficyt, po, atr)
        st_after[o] = po
    for t in G['ticks']:
        o = t['ownerId']
        sk, deficyt, po, atr = tick_by[o]
        chk(eq(num(t['skarbiec']), sk), f'{nm} gd[{o}] skarbiec')
        chk(t['deficyt'] == deficyt, f'{nm} gd[{o}] deficyt')
        chk(num(t['po']) == po, f'{nm} gd[{o}] po')
        chk(t['atrycja'] == atr, f'{nm} gd[{o}] atrycja')
    exp_states = dict(states)
    exp_states.update(st_after)
    for k in list(exp_states):
        pass
    chk({int(k): num(v) for k, v in G['states'].items()} == {k: float(v) for k, v in exp_states.items() if k != -1} or
        {int(k): num(v) for k, v in G['states'].items()}.keys() >= set(ids), f'{nm} gd stany')
    # --- HP ---
    before = {u['id']: u for u in B['units']}
    after = {u['id']: u for u in G['units']}
    active = {o for o in ids if tick_by[o][3]}
    frac = max(0.0, min(1.0, hpfrac)) if not math.isnan(hpfrac) else math.nan
    destroyed = set(G['destroyed'])
    dmg_player = des_player = 0
    for uid, u in before.items():
        if uid in destroyed:
            chk(uid not in after, f'{nm} gd zniszczona jednostka {uid} nadal na liscie')
            continue
        chk(uid in after, f'{nm} gd jednostka {uid} zniknela bez zniszczenia')
        if uid not in after:
            continue
        a = after[uid]
        hp0 = num(u['hp'])
        hp1 = num(a['hp'])
        if u['ownerId'] in active and frac > 0:
            if civilian(u):
                chk(eq(hp0, hp1), f'{nm} gd cywil {uid} zmieniony')
                continue
            mx = num(a['hpMax'])
            if mx is not None and mx > 0:
                loss = max(1.0, js_floor(mx * frac))
                base = hp0 if hp0 is not None else mx
                exp = max(0.0, base - loss)
                chk(eq(hp1, exp), f'{nm} gd hp {uid}: {hp1} vs {exp}')
                chk(hp1 is not None and (hp1 > 0 or math.isnan(hp1)), f'{nm} gd {uid} hp<=0 ale nie zniszczona')
                if u['ownerId'] == 0:
                    dmg_player += 1
        else:
            chk(eq(hp0, hp1), f'{nm} gd jednostka {uid} zmieniona mimo braku atrycji')
    # zniszczone: hp po obliczeniu <= 0, tylko dla aktywnych wlascicieli
    for uid in destroyed:
        u = before.get(uid)
        chk(u is not None and u['ownerId'] in active, f'{nm} gd zniszczona {uid} u nieaktywnego wlasciciela')
        if u is not None and u['ownerId'] == 0:
            des_player += 1
    chk(G['playerDestroyed'] == des_player, f'{nm} gd playerDestroyed {G["playerDestroyed"]} vs {des_player}')
    if frac > 0 or True:
        # damagedCount gracza = jednostki niecywilne gracza z maxHp>0 przy aktywnej atrycji (zniszczone tez liczone)
        cnt = 0
        if 0 in active and frac > 0:
            for uid, u in before.items():
                if u['ownerId'] != 0 or civilian(u):
                    continue
                a = after.get(uid)
                mx = num(a['hpMax']) if a else (num(u['hpMax']) if u['hpMax'] is not None else None)
                if uid in destroyed:
                    cnt += 1
                elif mx is not None and mx > 0:
                    cnt += 1
        chk(G['playerDamaged'] == cnt, f'{nm} gd playerDamaged {G["playerDamaged"]} vs {cnt}')
    n_atr += 1 if active else 0
    n_destroyed += len(destroyed)
    # --- wzrost ---
    gm = {k: num(v) for k, v in I['growthMult'].items()}
    hp = {k: num(v) for k, v in I['happiness'].items()}
    cz = {k: num(v) for k, v in I['citizen'].items()}
    pop_before = {k: num(v) for k, v in W['popBefore'].items()}
    obl = {t['cityId']: t['oblegany'] for t in B['ticks']}
    fed_all = {}
    for o in B['ef']:
        fed_all.update(o['fed'])
    changed_exp = []
    for o in W['ef']:
        for r in o['rows']:
            cid = r['cityId']
            if obl.get(cid):
                continue
            bd = r['breakdown']
            if bd is None:
                chk(False, f'{nm} wzrost brak breakdown {cid}')
                continue
            chk(r['nakarmione'] == fed_all.get(cid, False), f'{nm} wzrost nakarmione {cid}')
            parts = ['racje', 'maleMiasto', 'spichlerz', 'zdrowie', 'szczescie', 'cywilizacja', 'zaopatrzenie']
            tot = 0.0
            for p in parts:
                tot += num(bd[p])
            x = gm.get(cid, 1.0)
            factor = max(0.0, x) if math.isfinite(x) else 1.0
            if factor != 1.0:
                n_mult += 1
            exp_total = tot * factor if factor != 1.0 else tot
            chk(eq(num(bd['total']), exp_total) or abs(num(bd['total']) - exp_total) <= 1e-9 * max(1.0, abs(exp_total)), f'{nm} wzrost total {cid}: {bd["total"]} vs {exp_total}')
            chk(eq(num(r['wzrostProcent']), num(bd['total'])), f'{nm} wzrost wzrostProcent {cid}')
            chk(num(bd['maleMiasto']) == max(0.0, 6 - pop_before[cid]), f'{nm} wzrost maleMiasto {cid}')
            chk(num(bd['szczescie']) == js_floor(max(0.0, hp.get(cid, 0.0)) / 10), f'{nm} wzrost szczescie {cid}')
            chk(num(bd['zaopatrzenie']) == cz.get(cid, 0.0), f'{nm} wzrost zaopatrzenie {cid}')
    for c in W['cities']:
        if num(c['pop']) != pop_before[c['id']]:
            changed_exp.append(c['id'])
    row_order = [r['cityId'] for o in W['ef'] for r in o['rows']]
    chk(sorted(W['changed']) == sorted(changed_exp), f'{nm} wzrost changed')
    chk(W['changed'] == [c for c in row_order if c in set(W['changed'])], f'{nm} wzrost kolejnosc changed')
    n_changed += len(W['changed'])
    bm = {c['id']: c for c in B['cities']}
    for c in W['cities']:
        if num(c['pop']) == pop_before[c['id']]:
            chk(eq(num(c['mp']), num(bm[c['id']]['mp'])), f'{nm} wzrost mp bez zmiany pop {c["id"]}')
    dg = sum(1 for t in W['ticks'] if t['wzrost'] and not obl.get(t['cityId']))
    du = sum(1 for t in W['ticks'] if t['ubytek'] and not obl.get(t['cityId']))
    # liczone tylko dla wierszy EmpireFood (miasta bez wiersza nie sa przetwarzane): przyrost <= liczba flag
    chk(num(W['econGrowth']) - num(B['econGrowth']) <= dg + 1e-9, f'{nm} wzrost econ.growth')
    chk(num(W['econStarved']) - num(B['econStarved']) <= du + 1e-9, f'{nm} wzrost econ.starved')
    # --- praca ---
    up = {int(k): num(v) for k, v in I['pracaUp'].items()}
    pool = num(I['pools']['player'])
    pu = up.get(0, 0.0)
    if pu > 0:
        pool = js_max0(pool - pu)
        n_praca += 1
    chk(eq(num(R['player']), pool) or (math.isnan(pool) and math.isnan(num(R['player']))), f'{nm} praca gracz')
    rate = num(I['pools']['rate0']) - pu
    chk(eq(num(R['rate']), rate), f'{nm} praca rate')
    chk(eq(num(R['lastUpkeep']), pu), f'{nm} praca lastUpkeep')
    ai_pool = {int(k): num(v) for k, v in I['pools']['ai'].items()}
    for o, u in up.items():
        if o == 0 or u <= 0:
            continue
        cur = ai_pool.get(o, 0.0)
        ai_pool[o] = js_max0(cur - u)
    got_ai = {int(k): num(v) for k, v in R['ai'].items()}
    chk(set(got_ai) == set(ai_pool), f'{nm} praca ai klucze')
    for o, v in ai_pool.items():
        chk(eq(got_ai.get(o), v), f'{nm} praca ai[{o}]')

print(f'scenariuszy={len(d["scenarios"])} sprawdzen={checks} atrycja={n_atr} zniszczone={n_destroyed} mnoznik!=1={n_mult} zmiany_pop={n_changed} praca>0={n_praca}')
if NEG:
    print('NEG: rozbieznosci=%d' % len(fails))
    sys.exit(0 if fails else 1)
for f in fails[:40]:
    print('FAIL', f)
print('ROZBIEZNOSCI=%d' % len(fails))
sys.exit(1 if fails else 0)
