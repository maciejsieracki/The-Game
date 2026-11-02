"""Niezalezny weryfikator R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1 (petla miast ticku ekonomii).

Uruchomienie: python3 -I verify-p6-adv-q4.py <q4.json> <DATA_DIR_PINU> (DATA_DIR = gra/data z `git archive 4bbef081d`).
BEZ Rust i BEZ kodu generatora: wejscia scenariusza i wyniki weba (ticki, wartosci posrednie `lc`) czytane z
wektora; liczone od nowa wg KODU WEBA (turn-economy.ts, wealth.ts, production.ts, manpower.ts,
population-growth-v85.ts, civ-matrix.ts), nie wg Rust.

LICZONE NIEZALEZNIE: P12 (stolica, liczba miast, dystans), korupcja (rate/cap/redukcja budynkow), mnozniki Porzadku
i cudy na plonach (od `y0` weba), praca-integer, Wealth (advanceWealth + modyfikatory macierzy), splitPraca +
rozwiazanie podzialu Pracy, pieniadz po Wealth + dochod z tras (routeCash), galaz oblezenia, bilans zywnosci
(tozsamosc brutto-koszt), poziom racji, procent rozwoju, manpower (max/regen/cur), sumy ticku, dochod per owner.
NIE LICZONE NIEZALEZNIE (web<->Rust tylko w tescie Rust): `y0` (teren, budynki, Mennica, kolejnosc handel->nauka),
zdrowie, stan Spichlerza/Garncarni, kosztRacji (tabela racji), wzrostProcent, normalizePodzialHandlu, wybor pol
roboczych (`nWorked`).
"""
import json
import math
import sys

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


def isnum(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) or (isinstance(x, str) and (x in ('NaN', 'Infinity', '-Infinity', '-0') or x.startswith('~')))


def jfloor(x):
    return x if (math.isnan(x) or math.isinf(x)) else float(math.floor(x))


def jround(x):
    if math.isnan(x) or math.isinf(x):
        return x
    return float(math.floor(x + 0.5))


def jmax(a, b):
    return NAN if (math.isnan(a) or math.isnan(b)) else (a if a > b else b if b > a else (b if (a == 0 and math.copysign(1, a) < 0) else a))


def jmin(a, b):
    return NAN if (math.isnan(a) or math.isnan(b)) else (a if a < b else b if b < a else (a if (a == 0 and math.copysign(1, a) < 0) else b))


def same(a, b):
    if a is None or b is None:
        return a is b
    if isinstance(a, bool) or isinstance(b, bool):
        return a == b
    if math.isnan(a) and math.isnan(b):
        return True
    return a == b and math.copysign(1, a) == math.copysign(1, b)


def main():
    vec = json.load(open(sys.argv[1]))
    ddir = sys.argv[2]
    econ_base = json.load(open(ddir + '/econ-params.json'))
    matrix = json.load(open(ddir + '/civ-matrix.json'))
    for row in matrix['cywilizacje']:
        if row['ikonaId'] in vec['matrixPatch']:
            row['params'].update(vec['matrixPatch'][row['ikonaId']])
    mp_data = json.load(open(ddir + '/epoka-ludnosc-manpower.json'))
    miasto = json.load(open(ddir + '/miasto-params.json'))

    def civ_param(key, pid):
        k = key.lower()
        row = None
        for c in matrix['cywilizacje']:
            if c['ikonaId'].lower() == k or c['typCywilizacji'].lower() == k or c['Cywilizacja'].lower() == k:
                row = c
                break
        dflt = matrix['defaults'].get(pid, 0)
        if row is None:
            return float(dflt)
        return float(row['params'].get(pid, dflt))

    def apply_civ(base, key, pid):
        val = civ_param(key, pid)
        formula = matrix['paramDefs'].get(pid, {}).get('formula', 'mul_proc')
        if formula == 'mul_abs':
            return base * val
        if formula == 'add':
            return base + val
        if formula in ('flag', 'skala', 'stat_abs'):
            return val
        return base * (1 + val)

    checks = {'p12': 0, 'corr': 0, 'yield': 0, 'wealth': 0, 'split': 0, 'cash': 0, 'siege': 0, 'food': 0, 'mp': 0, 'sums': 0, 'income': 0, 'pracapodz': 0}
    errors = []

    def err(msg):
        if len(errors) < 40:
            errors.append(msg)

    def eq(label, a, b, kind):
        checks[kind] += 1
        if not same(a, b):
            err('%s: niezalezne=%r web=%r' % (label, a, b))

    for s in vec['scenarios']:
        name = s['name']
        diff = s['difficulty']
        econ = s['econ'] if s['econ'] is not None else econ_base

        def rd(group, key, fallback):
            g = econ.get(group)
            if not isinstance(g, dict):
                return fallback
            row = g.get(key)
            if not isinstance(row, dict):
                return fallback
            v = row.get(diff)
            if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v):
                return float(v)
            return fallback

        cities = s['cities']
        om = s['om']
        w = s['out']
        first_of = {}
        count_of = {}
        for c in cities:
            first_of.setdefault(c['owner'], c)
            count_of[c['owner']] = count_of.get(c['owner'], 0) + 1

        def era_of(owner):
            if om['era'] is not None:
                return dec(om['era'].get(str(owner)))
            return float(s['playerEra']) if owner == 0 else 1.0

        def civ_of(owner):
            return om['civ'].get(str(owner))

        # parametry
        cd = rd('ekonomia_miasta', 'korupcja_wspolczynnik_dystansu', 2.0)
        cm = rd('ekonomia_miasta', 'korupcja_wspolczynnik_miast', 1.0)
        cap = rd('ekonomia_miasta', 'korupcja_cap', 50.0) / 100
        praca_fb = rd('ekonomia_miasta', 'suwak_praca_budynki_domyslnie', 70.0)
        wl = lambda k, f: rd('wealth', k, f)
        wp = {
            'cap': wl('wealth_cap_na_epoke', 10.0), 'prog': wl('wealth_prog_na_poziom', 4.5), 'mn': wl('wealth_mnoznik_na_poziom', 0.15),
            'ub': wl('wealth_utrzymanie_baza', 0.20), 'uc': wl('wealth_utrzymanie_przy_cap', 0.40), 'zpa': wl('wealth_zachowanie_po_awansie', 0.5),
            'zmax': wl('wealth_zadowolenie_max', 10.0), 'kz': wl('wealth_kara_zero', 0.0),
        }
        # econ: wiersz nie-obiekt w `wealth` -> brak wartosci (jak w webie: row[difficulty] dla 'x' / tablicy = undefined)

        by_id = {c['id']: c for c in cities}
        ticks = w['perCity']
        income = {}
        tot = dict(cities=0.0, praca=0.0, pieniadz=0.0, nauka=0.0, luksus=0.0, kultura=0.0, zywnosc=0.0, pracaPula=0.0)
        capital_seen = set()
        for t in ticks:
            cid = t['cityId']
            c = by_id[cid]
            lbl = name + ' ' + cid
            owner = c['owner']
            lc = w['lc'][cid]
            civ = civ_of(owner)
            era = era_of(owner)
            pop = dec(c['pop'])
            # P12
            first = first_of[owner]
            is_cap = owner not in capital_seen
            capital_seen.add(owner)
            eq(lbl + ' isCapital', is_cap, lc['isCapital'], 'p12')
            if is_cap:
                dist = 0.0
            else:
                aq, ar, bq, br = float(c['q']), float(c['r']), float(first['q']), float(first['r'])
                dist = max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))
            eq(lbl + ' dystans', dist, dec(lc['dystans']), 'p12')
            eq(lbl + ' liczbaMiast', float(count_of[owner]), dec(lc['liczbaMiast']), 'p12')
            # korupcja
            raw = dist * cd + float(count_of[owner]) * cm
            base_rate = jmin(cap * 100, raw) / 100
            red_sum = 0.0
            for b_id in ('sad', 'pretorium', 'palac'):
                if b_id in c['built']:
                    red_sum += 0.30
            red = jmin(0.60, red_sum)
            eq(lbl + ' strataBazowa', base_rate, dec(lc['strataBazowa']), 'corr')
            eq(lbl + ' redukcja', red, dec(lc['redukcja']), 'corr')
            eq(lbl + ' strataFraction', base_rate * (1 - red), dec(lc['strataFraction']), 'corr')
            # era
            eq(lbl + ' ownerEra', era, dec(t['ownerEra']), 'p12')

            # plony: y0 -> mnozniki Porzadku -> cityPracaInteger -> cuda
            y0, y1 = lc['y0'], lc['y1']
            om_c = s['order'].get(cid)
            praca = dec(y0['praca'])
            pien = dec(y0['pieniadz'])
            nauka = dec(y0['nauka'])
            kult = dec(y0['kultura'])
            luks = dec(y0['luksus'])
            if om_c:
                if dec(om_c['prod']) != 1:
                    praca *= dec(om_c['prod'])
                if dec(om_c['pien']) != 1:
                    pien *= dec(om_c['pien'])
                if dec(om_c['nauka']) != 1:
                    nauka *= dec(om_c['nauka'])
                if dec(om_c['kult']) != 1:
                    kult *= dec(om_c['kult'])
            praca = jround(praca) if (math.isfinite(praca) and praca > 0) else 0.0
            wd = {k: dec(v) for k, v in om['wonder'].get(str(owner), {}).items()}

            def truthy(x):
                return x is not None and x != 0 and not math.isnan(x)
            if truthy(wd.get('pieniadz')):
                pien += wd['pieniadz']
            if truthy(wd.get('nauka')):
                nauka += wd['nauka']
            if truthy(wd.get('kultura')):
                kult += wd['kultura']
            if truthy(wd.get('praca')):
                praca += wd['praca']
            eq(lbl + ' y1.praca', praca, dec(y1['praca']), 'yield')
            eq(lbl + ' y1.pieniadz', pien, dec(y1['pieniadz']), 'yield')
            eq(lbl + ' y1.nauka', nauka, dec(y1['nauka']), 'yield')
            eq(lbl + ' y1.kultura', kult, dec(y1['kultura']), 'yield')
            eq(lbl + ' y1.luksus', luks, dec(y1['luksus']), 'yield')
            eq(lbl + ' tick.praca', praca, dec(t['praca']), 'yield')
            eq(lbl + ' tick.pieniadzBrutto', pien, dec(t['pieniadzBrutto']), 'yield')
            eq(lbl + ' tick.nauka', nauka, dec(t['nauka']), 'yield')
            eq(lbl + ' tick.kultura', kult, dec(t['kultura']), 'yield')
            eq(lbl + ' tick.luksus', luks, dec(t['luksus']), 'yield')

            # Wealth
            cap_mod = civ_param(civ, 'wealth_cap_proc') if civ else None
            mn_mod = civ_param(civ, 'wealth_mnoznik_proc') if civ else None
            capk = wp['cap']
            mnk = wp['mn']
            if civ:
                f = jmax(0.0, 1 + cap_mod) if math.isfinite(cap_mod) else 1.0
                if f != 1:
                    capk = capk * f
                f2 = (1 + mn_mod) if math.isfinite(mn_mod) else 1.0
                if f2 != 1:
                    mnk = mnk * f2
            ws = c['wealth']
            st_poz, st_pula = (dec(ws['poziom']), dec(ws['pula'])) if ws else (1.0, 0.0)
            immun = dec(c['immun']) if c['immun'] is not None else 0.0
            immun_on = immun > 0
            ecap = jmax(0.0, jfloor(era)) * capk
            poziom = jmin(ecap, jmax(0.0, jfloor(st_poz)))
            pula = jmax(0.0, st_pula if math.isfinite(st_pula) else 0.0)
            minp = jmax(0.0, jfloor(1.0 if immun_on else 0.0))
            spol = jmax(0.0, luks) if math.isfinite(luks) else 0.0
            M = jmax(0.0, pien) if math.isfinite(pien) else 0.0

            def rown(poz):
                if ecap <= 0:
                    return wp['uc']
                frac = jmin(1.0, jmax(0.0, poz / ecap))
                return wp['ub'] + frac * (wp['uc'] - wp['ub'])
            pula += spol - rown(poziom) * M
            if pula < 0:
                pula = 0.0
                if poziom > minp:
                    poziom -= 1
            while poziom < ecap:
                prog = wp['prog'] * (poziom + 1) * jmax(1.0, jfloor(era))
                if pula >= prog:
                    pula -= prog
                    poziom += 1
                    pula = jfloor(pula * wp['zpa'])
                else:
                    break
            mnoz = jmax(1.0, 1 + (poziom - 1) * mnk)
            if poziom <= 0:
                zad = wp['kz']
            elif not math.isfinite(ecap) or ecap <= 0:
                zad = 0.0
            else:
                zad = jfloor(jmin(poziom, ecap) * wp['zmax'] / ecap)
            eq(lbl + ' wealthMnoznik', mnoz, dec(t['wealthMnoznik']), 'wealth')
            eq(lbl + ' wealthZadowolenie', zad, dec(t['wealthZadowolenie']), 'wealth')
            after = next(a for a in w['after'] if a['id'] == cid)
            eq(lbl + ' wealth.poziom', poziom, dec(after['wealthState']['poziom']), 'wealth')
            eq(lbl + ' wealth.pula', pula, dec(after['wealthState']['pula']), 'wealth')
            if c['immun'] is not None:
                want_im = jmax(0.0, immun - 1) if immun_on else immun
                eq(lbl + ' immunitet', want_im, dec(after['immun']), 'wealth')

            # splitPraca + podzial Pracy
            def clamp_pp(n):
                if n is not None and math.isfinite(n):
                    return jmax(50.0, jmin(100.0, jround(n)))
                return 70.0
            if c['pp'] and c['pp']['over']:
                pb = clamp_pp(dec(c['pp']['b']))
            elif str(owner) in om['defP']:
                pb = clamp_pp(dec(om['defP'][str(owner)]))
            elif c['pp']:
                pb = clamp_pp(dec(c['pp']['b']))
            else:
                pb = clamp_pp(praca_fb)
            eq(lbl + ' podzialPracy', pb, dec(lc['podzialPracy']['procentBudynki']), 'pracapodz')
            u = pb / 100
            total = praca if (math.isfinite(praca) and praca > 0) else 0.0
            total = jround(total) if total else 0.0
            uu = jmin(1.0, jmax(0.0, u if math.isfinite(u) else 1.0))
            dob = jround(total * uu)
            eq(lbl + ' doBudynkow', dob, dec(t['doBudynkow']), 'split')
            eq(lbl + ' doPuli', total - dob, dec(t['doPuli']), 'split')

            # pieniadz po Wealth + dochod z tras
            po_wealth = jfloor(pien * mnoz)
            tot_in = dec(s['tinc'].get(cid, 0))
            mar = dec(s['marit'].get(cid, 0))
            sea = jmin(tot_in, jmax(0.0, mar))
            cash = (tot_in - sea) + (apply_civ(sea, civ, 'eko_pieniadz_port_proc') if civ else sea)
            eq(lbl + ' pieniadzZTras', cash, dec(t['pieniadzZTras']), 'cash')
            eq(lbl + ' pieniadz', po_wealth + cash, dec(t['pieniadz']), 'cash')

            pr = dec(c['racja']) if c['racja'] is not None else None

            def clamp_r(n):
                cl = jmin(6.0, jmax(0.0, n))
                return jround(cl / 0.5) * 0.5
            if pr is not None:
                lvl = clamp_r(pr)
            elif c['proc'] is not None:
                lvl = clamp_r((dec(c['proc']) / 100) * 6)
            else:
                lvl = 4.0
            eq(lbl + ' poziomRacji', lvl, dec(t['poziomRacji']), 'food')
            eq(lbl + ' procentRozwoj', jround((lvl / 6) * 100), dec(t['procentRozwoj']), 'food')

            if c['obl']:
                g = dec(c['garn']) if c['garn'] is not None else 0.0
                garn = g if (g is not None and g > 0) else 0.0
                fd = c['food']
                if 'num' in fd:
                    v = dec(fd['num'])
                    cur = jmax(0.0, v) if math.isfinite(v) else 0.0
                elif 'obj' in fd and isinstance(fd['obj'].get('aktualny'), (int, float, str)) and not isinstance(fd['obj'].get('aktualny'), bool) and isnum(fd['obj'].get('aktualny')):
                    v = dec(fd['obj']['aktualny'])
                    cur = jmax(0.0, v) if math.isfinite(v) else 0.0
                else:
                    cur = 0.0
                po = jmax(0.0, cur - (pop + garn))
                eq(lbl + ' magazynPoTurze', po, dec(t['magazynPoTurze']), 'siege')
                eq(lbl + ' obleganyGlod', po <= 0, t['obleganyGlod'], 'siege')
                eq(lbl + ' oblegany', True, t['oblegany'], 'siege')
                eq(lbl + ' zywnoscNetto', 0.0, dec(t['zywnoscNetto']), 'siege')
                eq(lbl + ' zywnoscBrutto', 0.0, dec(t['zywnoscBrutto']), 'siege')
                eq(lbl + ' kosztRacji', 0.0, dec(t['kosztRacji']), 'siege')
                eq(lbl + ' bilansLokalny', 0.0, dec(t['bilansLokalny']), 'siege')
                eq(lbl + ' ludnoscPo', pop, dec(t['ludnoscPo']), 'siege')
                eq(lbl + ' food po', po, dec(after['food']), 'siege')
                eq(lbl + ' wzrostProcent brak', 'wzrostProcent' in t, False, 'siege')
                income[owner] = income.get(owner, 0.0) + dec(t['pieniadz'])
                tot['zywnosc'] += 0.0
            else:
                brutto = dec(t['zywnoscBrutto'])
                koszt = dec(t['kosztRacji'])
                eq(lbl + ' bilans', brutto - koszt, dec(t['bilansLokalny']), 'food')
                eq(lbl + ' zywnoscNetto', brutto - koszt, dec(t['zywnoscNetto']), 'food')
                wz = dec(c['frac']) if c['frac'] is not None else 0.0
                eq(lbl + ' magazynPoTurze', wz, dec(t['magazynPoTurze']), 'food')
                eq(lbl + ' wzrostUlamkowyPo', wz, dec(t['wzrostUlamkowyPo']), 'food')
                eq(lbl + ' oblegany', False, t['oblegany'], 'food')
                eq(lbl + ' ludnoscPo', pop, dec(t['ludnoscPo']), 'food')
                eq(lbl + ' y1.zywnosc', (brutto - koszt) + (wd['zywnosc'] if truthy(wd.get('zywnosc')) else 0.0), dec(y1['zywnosc']), 'yield')
                # kosztRacji >= 0 i brutto zgodne z y0
                eq(lbl + ' zywnoscBrutto=y0', dec(y0['zywnoscBrutto']), brutto, 'food')
                prev = income.get(owner, 0.0)
                income[owner] = (prev + po_wealth) + cash
                tot['zywnosc'] += brutto - koszt
                # manpower
                mp_in = dec(c['mp']) if c['mp'] is not None else None
                fe = jfloor(era)
                fe = 1.0 if (math.isnan(fe) or fe == 0) else fe
                row_i = int(max(1.0, min(10.0, fe))) if math.isfinite(fe) else 10
                row = next(r for r in mp_data['epoki'] if r['epoka'] == row_i)

                def mmult(pid):
                    if not civ:
                        return 1.0
                    v = civ_param(civ, pid)
                    return jmax(0.0, 1 + v) if math.isfinite(v) else 1.0
                maxm, regm = mmult('mp_max_proc'), mmult('mp_regen_proc')
                lf = jfloor(pop)
                lf = 1.0 if (math.isnan(lf) or lf == 0) else lf
                ludki = max(1.0, lf)
                mx = jfloor(ludki * row['manpowerNaLudka'] * jmax(0.0, maxm if math.isfinite(maxm) else 1.0))
                if mp_in is not None and math.isfinite(mp_in):
                    cur = jmax(0.0, jmin(mx, jfloor(mp_in)))
                else:
                    cur = mx
                reg_pct = float(miasto['manpower_regen_proc_max_tura']['wartosc'])
                if cur >= mx:
                    new = mx
                else:
                    gain = 0.0 if (mx <= 0 or reg_pct <= 0) else jfloor(mx * (min(100.0, reg_pct) / 100) * jmax(0.0, regm))
                    new = cur if gain <= 0 else jmin(mx, cur + gain)
                eq(lbl + ' manpower', new, dec(after['manpower']), 'mp')

            # sumy
            tot['cities'] += 1
            tot['praca'] += praca
            tot['pieniadz'] += dec(t['pieniadz'])
            tot['nauka'] += nauka
            tot['luksus'] += luks
            tot['kultura'] += kult
            tot['pracaPula'] += total - dob
        for k, v in tot.items():
            eq('%s totals.%s' % (name, k), v, dec(w['totals'][k]), 'sums')
        for o, v in income.items():
            eq('%s income %s' % (name, o), v, dec(w['income'][str(o)]), 'income')

    print('scenariusze:', len(vec['scenarios']))
    print('sprawdzenia niezalezne:', json.dumps(checks, sort_keys=True), 'razem', sum(checks.values()))
    if errors:
        print('ROZBIEZNOSCI (%d pokazanych):' % len(errors))
        for e in errors:
            print('  ', e)
        sys.exit(1)
    print('OK: zero rozbieznosci')


if __name__ == '__main__':
    main()
