"""Niezalezny weryfikator wektorow EmpireFood (python3 -I verify-p6-empirefood.py <empirefood.json> <econ-params.json> <wzrost-ludnosci-params.json> [--neg]).

NIE uzywa Rust ani kodu weba. Z surowych wejsc scenariusza (ef, cities, q6in) i z wartosci posrednich weba (perCity PO
auto-racjach, koszt armii) przelicza WLASNYMI wzorami: pule centralna (nadwyzki -> deficyty -> wojsko -> cap -> zero),
flage glodu, licznik tur ujemnych i flage atrycji (karencja), cap magazynu (baza + Magazyny + Spichlerze x 2^(era-1)),
przyrost zapasow, sumy tickow, totalZywnosc, zachowanie bilansu miasta (brutto - koszt), granice poziomu racji,
atrycje HP (strata = max(1, floor(hpMax*frac)), cywile pomijani, zniszczone = hp<=0), sprzatanie oblezen
(zniszczone znaczniki -> oblezenie konczy sie gdy brak oznaczonych i brak wojsk oblegajacego w odleglosci 1) i garnizonow.
NIE liczone niezaleznie: koszt armii z tabeli jednostek (przyjmowany z weba), poziomy racji wybrane przez auto-korekte
(tu: tylko niezmienniki), tick petli miast.
Kontrola negatywna (--neg): po zmanipulowaniu wartosci weryfikator MUSI zglosic rozbieznosci.
"""
import json
import math
import sys

NEG = '--neg' in sys.argv or '--neg2' in sys.argv
NEG2 = '--neg2' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
d = json.load(open(args[0]))
econ_all = json.load(open(args[1]))
wp = json.load(open(args[2]))


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
    return a == b


fails = []
checks = 0


def chk(cond, msg):
    global checks
    checks += 1
    if not cond:
        fails.append(msg)


def pick(row, diff, fb):
    v = row.get(diff) if isinstance(row, dict) else None
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else fb


CAP_I = wp['spichlerz']['cap_imperium_tier_i']
CAP_II = wp['spichlerz']['cap_imperium_tier_ii']
ERA_BASE = wp['magazyn_era']['podstawa']
ERA_MIN = wp['magazyn_era']['epoka_min']
CIVIL_CAT = {'osadnik', 'robotnik', 'zwiadowca'}
CIVIL_TYPE = {'Zwiadowca', 'Osadnik', 'Robotnik'}
LEVEL_MIN, LEVEL_MAX, STEP = 0.0, 6.0, 0.5


def hexd(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


def main():
    sc_list = d['scenarios']
    if NEG:
        # manipulacja: zapasy po +1 w pierwszym ticku panstwa oraz hp pierwszego zywego -1
        for s in sc_list:
            f = s['out']['food']
            if NEG2:
                # manipulacja 2: hp przezywajacej jednostki +1 i dopisanie fikcyjnie zakonczonego oblezenia
                if f['units'] and f['units'][0]['hp'] is not None:
                    f['units'][0]['hp'] = num(f['units'][0]['hp']) + 1
                if f['ended']:
                    f['ended'] = f['ended'][:-1]
                if f['n3']:
                    f['n3'][0]['before'] = f['n3'][0]['before'] + 1
            elif f['efTicks']:
                f['efTicks'][0]['zapasyPo'] = num(f['efTicks'][0]['zapasyPo']) + 1
    for s in sc_list:
        name = s['name']
        diff = s['difficulty']
        econ = s['econ'] if s['econ'] else econ_all
        em = econ['ekonomia_miasta']
        gl = econ.get('globalne') or {}
        karencja = pick(em.get('glod_wojska_karencja_tur'), diff, 3.0)
        hp_frac = pick(em.get('glod_wojska_hp_frac'), diff, 0.08)
        baza = pick(gl.get('magazyn_centralny_baza_zywnosc') or em.get('magazyn_centralny_baza_zywnosc'), diff, 1000.0)
        bonus = pick(gl.get('magazyn_centralny_bonus_zywnosc_na_budynek') or em.get('magazyn_centralny_bonus_zywnosc_na_budynek'), diff, 100.0)
        out = s['out']
        f = out['food']
        ticks = out['perCity']
        built = {c['id']: c['built'] for c in s['cities']}
        era = s['q6in']['era']
        states_in = s['ef']['states']

        # --- niezmienniki per miasto po bloku ---
        for t in ticks:
            br = num(t['zywnoscBrutto'])
            kr = num(t['kosztRacji'])
            bl = num(t['bilansLokalny'])
            chk(eq(br - kr, bl) or (math.isnan(br - kr) and math.isnan(bl)), f'{name} {t["cityId"]} bilans != brutto-koszt')
        owner_of = {c['id']: c['owner'] for c in s['cities']}
        for a in out['after']:
            if owner_of[a['id']] < 0:
                continue  # miasta barbarzyncow/rebeliantow: blok ich nie dotyka (surowe wartosci wejscia)
            r = num(a['racja'])
            chk(r is not None and LEVEL_MIN <= r <= LEVEL_MAX and abs(r / STEP - round(r / STEP)) < 1e-9, f'{name} {a["id"]} poziom racji {r}')
        # totalZywnosc == suma bilansow tylko gdy po ostatnim odswiezeniu nic nie zmienilo tickow; clamp foteli czlowieka
        # (maxSafePoziomRacjiForCity -> ensureCityRationDefaults + recompute) moze zmienic tiki bez odswiezenia sum (zachowanie weba),
        # wiec niezmiennik sprawdzamy tylko dla scenariuszy bez foteli czlowieka
        if (f['anyAdjusted'] or f['clampedAny']) and not s['q6in']['humans']:
            tot = 0.0
            for t in ticks:
                tot += num(t['bilansLokalny'])
            chk(eq(tot, num(out['totals']['zywnosc'])) , f'{name} totalZywnosc {tot} vs {out["totals"]["zywnosc"]}')

        # --- pula centralna per owner ---
        owners_seen = []
        for tk in f['efTicks']:
            o = tk['ownerId']
            owners_seen.append(o)
            chk(o != -1, f'{name} barbarzynca w efTicks')
            rows = [t for t in ticks if t['ownerId'] == o and not t['oblegany']]
            central = num(tk['zapasyPrzed'])
            st = states_in.get(str(o))
            chk(eq(central, num(st['z']) if st else 0.0), f'{name} ef[{o}] zapasyPrzed')
            deficits = []
            uprawa = 0.0
            koszt_rac = 0.0
            for t in rows:
                p = num(t['zywnoscBrutto'])
                k = num(t['kosztRacji'])
                b = num(t['bilansLokalny'])
                uprawa += p
                koszt_rac += k
                if b >= 0:
                    central += b
                else:
                    deficits.append(-b)
            pomoc = 0.0
            for need in deficits:
                cov = min(need, max(0.0, central))
                central -= cov
                pomoc += cov
            chk(eq(pomoc, num(tk['pomocMiastom'])), f'{name} ef[{o}] pomoc {pomoc} vs {tk["pomocMiastom"]}')
            chk(eq(central, num(tk['spichlerzStolicy'])), f'{name} ef[{o}] spichlerzStolicy')
            chk(eq(uprawa, num(tk['uprawaHodowla'])), f'{name} ef[{o}] uprawa')
            chk(eq(uprawa - koszt_rac, num(tk['nadwyzka'])), f'{name} ef[{o}] nadwyzka')
            koszt_a = num(tk['kosztArmii'])
            chk(eq(koszt_a, num(f['kosztArmiiOwners'].get(str(o), 0))), f'{name} ef[{o}] kosztArmii vs kosztArmiiOwners')
            central -= koszt_a
            # cap
            mag = len({t['cityId'] for t in ticks if t['ownerId'] == o and 'magazyn' in built.get(t['cityId'], [])})
            e = num(era.get(str(o), 1)) if era.get(str(o)) is not None else 1.0
            ev = e if (math.isfinite(e) and e > ERA_MIN) else ERA_MIN
            mult = ERA_BASE ** (ev - ERA_MIN)
            scap = 0.0
            for t in rows:
                if t['maSpichlerzII']:
                    scap += CAP_II * mult
                elif t['maSpichlerz']:
                    scap += CAP_I * mult
            # era w web = resolveOwnerEra -> eraOf (q6in.era), domyslnie 1
            maxcap = baza + bonus * mag + scap
            chk(eq(maxcap, num(tk['maxCap'])), f'{name} ef[{o}] maxCap {maxcap} vs {tk["maxCap"]}')
            if central > maxcap:
                central = maxcap
            glod = central < 0
            central = max(0.0, central)
            chk(eq(central, num(tk['zapasyPo'])), f'{name} ef[{o}] zapasyPo {central} vs {tk["zapasyPo"]}')
            chk(bool(glod) == bool(tk['glodWojska']), f'{name} ef[{o}] glod')
            przyrost = central - num(tk['zapasyPrzed'])
            chk(eq(przyrost, num(tk['przyrostZapasow'])), f'{name} ef[{o}] przyrost')
            t_prev = num(st['t']) if st and st['t'] is not None else 0.0
            t_po = t_prev + 1 if glod else 0.0
            chk(eq(t_po, num(tk['turyUjemnychZapasowPo'])), f'{name} ef[{o}] tury')
            chk((t_po >= karencja) == bool(tk['atrycja']), f'{name} ef[{o}] atrycja flaga')
        # kolejnosc i zbior wlascicieli: miasta -> stany -> jednostki (Set), bez -1
        order = []
        seq = [t['ownerId'] for t in ticks] + [int(k) for k in states_in.keys()] + [u['ownerId'] for u in s['ef']['live']]
        for o in seq:
            if o not in order:
                order.append(o)
        chk(owners_seen == [o for o in order if o != -1], f'{name} kolejnosc wlascicieli {owners_seen} vs {[o for o in order if o != -1]}')

        # --- atrycja HP (glod panstwa) + N3 (atrycja garnizonu miast oblezonych) ---
        frac = max(0.0, min(1.0, hp_frac))
        live_in = {u['id']: u for u in s['ef']['live']}
        out_units = {u['id']: u for u in f['units']}
        atr_owners = [tk['ownerId'] for tk in f['efTicks'] if tk['atrycja']]
        destroyed_set = set(f['destroyed'])
        cities_by_id = {c['id']: c for c in s['cities']}
        besieged = [t['cityId'] for t in ticks if t['oblegany']]

        def is_civil(u):
            return u['category'] in CIVIL_CAT or u['typeId'] in CIVIL_TYPE

        def n3_city_of(u):
            # miasto oblezone, ktorego garnizon (ownerId, q, r, inGarnizon) obejmuje jednostke
            if not u['inGarnizon']:
                return None
            for cid in besieged:
                c = cities_by_id.get(cid)
                if c and c['owner'] == u['ownerId'] and c['q'] == u['q'] and c['r'] == u['r']:
                    return cid
            return None

        absent_n3 = []  # zniszczone dopiero w N3 (poza lista destroyed glodu panstwa)
        for uid, u in live_in.items():
            if uid in out_units:
                ou = out_units[uid]
                hm = num(ou['hpMax'])
                hp = num(u['hp'])
                if hp is not None:
                    hp = max(0.0, min(hm, hp)) if math.isfinite(hp) else hm  # sync
                if (u['ownerId'] in atr_owners and frac > 0 and not is_civil(u) and hm > 0):
                    if hp is None:
                        hp = hm
                    hp = max(0.0, hp - max(1.0, math.floor(hm * frac)))
                    chk(hp > 0, f'{name} unit {uid} powinien byc zniszczony (glod panstwa)')
                if n3_city_of(u) is not None and frac > 0 and not is_civil(u) and hm > 0:
                    if hp is None:
                        hp = hm
                    hp = max(0.0, hp - max(1.0, math.floor(hm * frac)))
                    chk(hp > 0, f'{name} unit {uid} powinien byc zniszczony (N3)')
                chk(eq(hp, num(ou['hp'])), f'{name} unit {uid} hp {hp} vs {ou["hp"]}')
            elif uid in destroyed_set:
                chk(u['ownerId'] in atr_owners and not is_civil(u), f'{name} {uid} zniszczona poza atrycja')
            else:
                absent_n3.append(uid)
                chk(n3_city_of(u) is not None and not is_civil(u), f'{name} unit {uid} zniknal bez powodu')
        for uid in destroyed_set:
            chk(uid not in out_units, f'{name} zniszczona jednostka {uid} nadal zyje')
        # log N3: kandydaci = jednostki zywe po glodzie panstwa (przed N3) w garnizonie miasta oblezonego
        exp_n3 = []
        for cid in besieged:
            c = cities_by_id.get(cid)
            if not c:
                continue
            cands = [u for u in live_in.values() if u['id'] not in destroyed_set and u['ownerId'] == c['owner'] and u['q'] == c['q'] and u['r'] == c['r'] and u['inGarnizon']]
            if not cands:
                continue
            gone = sum(1 for u in cands if u['id'] in absent_n3)
            exp_n3.append((cid, len(cands), float(len(cands) - gone)))
        got_n3 = [(x['city'], x['before'], num(x['after'])) for x in f['n3']]
        chk(exp_n3 == got_n3, f'{name} n3 {exp_n3} vs {got_n3}')

        # --- oblezenia: ktore powinny sie zakonczyc ---
        cities = {c['id']: c for c in s['cities']}
        siege_ids = []
        # kolejnosc Set weba = kolejnosc tablicy `units` (nie kolejnosc zniszczenia)
        for u0 in s['ef']['live']:
            if u0['id'] not in destroyed_set:
                continue
            cid = u0['oblega']
            if cid and cid not in siege_ids:
                siege_ids.append(cid)
        alive = [live_in[u] for u in live_in if u in out_units]
        exp_ended = []
        for cid in siege_ids:
            if any(a['oblega'] == cid for a in alive):
                continue
            c = cities.get(cid)
            if not c or not c['obl']:
                continue
            b = c['sOwner'] if (c['obl'] and c['sOwner'] is not None) else s['ef']['bySieger'].get(cid)
            adj = b is not None and any(a['ownerId'] == int(b) and hexd(a['q'], a['r'], c['q'], c['r']) == 1 for a in alive)
            if not adj:
                exp_ended.append(cid)
        chk(exp_ended == f['ended'], f'{name} zakonczone oblezenia {exp_ended} vs {f["ended"]}')
        for sg in f['siege']:
            if sg['id'] in exp_ended:
                chk(not sg['oblegane'] and sg['owner'] is None and not sg['cap'] and not sg['mach'], f'{name} {sg["id"]} stan po zakonczeniu')
        # garnizony
        garn_exp = []
        for u in s['ef']['live']:
            if u['id'] not in destroyed_set:
                continue
            if u['inGarnizon']:
                c = next((c for c in s['cities'] if c['owner'] == u['ownerId'] and c['q'] == u['q'] and c['r'] == u['r']), None)
                if c and c['id'] not in garn_exp:
                    garn_exp.append(c['id'])
        chk(garn_exp == f['garnSynced'], f'{name} garnizony {garn_exp} vs {f["garnSynced"]}')
        for cid in garn_exp:
            c = cities[cid]
            n = sum(1 for a in alive if a['ownerId'] == c['owner'] and a['q'] == c['q'] and a['r'] == c['r'] and a['inGarnizon'])
            sg = next(x for x in f['siege'] if x['id'] == cid)
            chk(eq(float(n), num(sg['garn'])), f'{name} garnizon {cid} {n} vs {sg["garn"]}')


main()
print(f'sprawdzen: {checks}, rozbieznosci: {len(fails)}')
for m in fails[:15]:
    print('  ', m)
if NEG:
    sys.exit(0 if fails else 1)
sys.exit(1 if fails else 0)
