"""Niezalezny weryfikator wektorow P6-ADVANCE-CITY-ECONOMY (python3 -I; bez Rust, bez kodu generatora).

Przelicza od zera, wg tekstu `turn-economy.ts` (pin 4bbef081d), oczekiwane wartosci z WEJSC wektorow i
porownuje z polem `out` z URUCHOMIONEGO, prawdziwego `advanceCityEconomy`:
  * wszystkie scenariusze: liczba Magazynow per owner (surowe builtIds), zbior Mennic, cap panstwa
    (`ownerResourceCapFor`), bonusy Stolarni/Kamieniarni, przepustowosci konwerterow per owner;
  * scenariusze bez resolvera etykiet: liczniki Stolarni/Kamieniarni (wszystkie budynki aktywne);
  * klasa `plain` (bez konwerterow/Spichlerza/Stolarni/wejsc terenowych): SUMY per owner per surowiec po calym ticku
    (drenaz Mennicy -> reconcile capow) - niezalezne od rozdzialu puli po miastach;
  * wszystkie scenariusze: niezmienniki (suma <= cap dla kluczy objetych capem, brak wartosci ujemnych);
  * `thrCases` i `happyCases`.
NIE liczone niezaleznie (web<->Rust wylacznie w tescie Rust): rozdzial puli po miastach, konwertery/Spichlerz w klasie
`full`, liczniki z resolverem etykiet (tabele bramki runtime).
Uzycie: python3 -I verify-p6-adv-city-econ.py <advance.json>
"""
import json
import math
import sys

INF = float('inf')
CAPPED = {'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'ceramika', 'braz', 'zelazo', 'stal', 'sol', 'zloto', 'kon'}
RECIPES = [  # (id, klucz przepustowosci, fallback) - converters.ts:81-101
    ('cegielnia', 'budynek_cegielnia_przepustowosc', 50.0),
    ('garncarnia', 'budynek_garncarnia_przepustowosc', 50.0),
    ('huta', 'budynek_huta_przepustowosc', 25.0),
    ('odlewnia_brazu', 'budynek_huta_przepustowosc', 25.0),
    ('odlewnia_zelaza__braz', 'budynek_huta_przepustowosc', 25.0),
    ('odlewnia_zelaza__zelazo', 'budynek_odlewnia_zelaza_przepustowosc', 25.0),
    ('wielka_odlewnia__braz', 'budynek_huta_przepustowosc', 25.0),
    ('wielka_odlewnia__zelazo', 'budynek_odlewnia_zelaza_przepustowosc', 25.0),
    ('wielka_odlewnia__stal', 'budynek_wielka_odlewnia_przepustowosc', 25.0),
]


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


def isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def econ_val(econ, grp, key, diff, fallback):
    row = (econ.get(grp) or {}).get(key)
    v = row.get(diff) if isinstance(row, dict) else None
    return float(v) if isnum(v) else fallback


def era_of(s, o):
    if s['eraByOwner'] is not None:
        return s['eraByOwner'][str(o)]
    return s['playerEra'] if o == 0 else 1


def era_scale(rid, base, era):
    if rid not in ('cegielnia', 'garncarnia'):
        return base
    e = era if (math.isfinite(era) and era > 1) else 1
    return base * (1 + 0.10 * (e - 1))


def cap_of(s, o, mag):
    base = econ_val(s['econ'], 'globalne', 'magazyn_baza_surowce', s['difficulty'], 50000.0)
    bonus = econ_val(s['econ'], 'globalne', 'magazyn_bonus_surowce_na_budynek', s['difficulty'], 500.0)
    era = era_of(s, o)
    e = era if (math.isfinite(era) and era > 1) else 1
    return (base + bonus * mag.get(o, 0)) * (2.0 ** (e - 1))


def close(a, b):
    return a == b or abs(a - b) <= 1e-9 * max(1.0, abs(a), abs(b))


def main(path):
    d = json.load(open(path))
    bad = []
    n = {'cap': 0, 'mag': 0, 'mennica': 0, 'bonus': 0, 'thr': 0, 'stolkam': 0, 'plain_totals': 0, 'invariant': 0, 'thrCases': 0, 'happy': 0, 'drain_seen': 0, 'clamp_seen': 0}
    skipped_labels = 0
    for s in d['scenarios']:
        name = s['name']
        out = s['out']
        diff = s['difficulty']
        owners = sorted({c['owner'] for c in s['cities']})
        mag = {}
        stol = {}
        kam = {}
        mennica = set()
        for c in s['cities']:
            b = s['built'].get(c['id'], [])
            if 'magazyn' in b:
                mag[c['owner']] = mag.get(c['owner'], 0) + 1
            if 'mennica' in b:
                mennica.add(c['owner'])
            if s['labelsByOwner'] is None:
                if 'stolarnia' in b:
                    stol[c['owner']] = stol.get(c['owner'], 0) + 1
                if 'kamieniarski' in b:
                    kam[c['owner']] = kam.get(c['owner'], 0) + 1
        # magazyn, mennica
        if {int(k): dec(v) for k, v in out['mag'].items()} != {k: float(v) for k, v in mag.items()}:
            bad.append((name, 'mag'))
        n['mag'] += 1
        if sorted(out['mennica']) != sorted(str(o) for o in mennica):
            bad.append((name, 'mennica'))
        n['mennica'] += 1
        # cap
        for o in owners:
            got = dec(out['cap'][str(o)])
            if not close(got, cap_of(s, o, mag)):
                bad.append((name, 'cap', o, got, cap_of(s, o, mag)))
            n['cap'] += 1
        # bonusy
        sb = econ_val(s['econ'], 'budynki', 'budynek_stolarnia_bonus_drewna_civ', diff, 0.10)
        kb = econ_val(s['econ'], 'budynki', 'budynek_kamieniarski_bonus_kamienia_civ', diff, 0.10)
        if dec(out['stolBonus']) != sb or dec(out['kamBonus']) != kb:
            bad.append((name, 'bonus'))
        n['bonus'] += 1
        # przepustowosci per owner
        for o in owners:
            for rid, key, fb in RECIPES:
                base = econ_val(s['econ'], 'budynki', key, diff, fb)
                want = era_scale(rid, base, era_of(s, o))
                got = dec(out['thr'][str(o)][rid])
                if not close(got, want):
                    bad.append((name, 'thr', o, rid, got, want))
                n['thr'] += 1
        # liczniki Stolarni/Kamieniarni (bez resolvera etykiet)
        if s['labelsByOwner'] is None:
            if {int(k): dec(v) for k, v in out['stol'].items()} != {k: float(v) for k, v in stol.items()}:
                bad.append((name, 'stol'))
            if {int(k): dec(v) for k, v in out['kam'].items()} != {k: float(v) for k, v in kam.items()}:
                bad.append((name, 'kam'))
            n['stolkam'] += 1
        else:
            skipped_labels += 1
        # sumy po wyjsciu weba (do niezmiennikow i klasy plain)
        web_tot = {}
        for c in out['cities']:
            owner = next(x['owner'] for x in s['cities'] if x['id'] == c['id'])
            if c['surowce'] is None:
                continue
            for k, v in c['surowce'].items():
                web_tot.setdefault(owner, {})
                web_tot[owner][k] = web_tot[owner].get(k, 0.0) + dec(v)
        for o, t in web_tot.items():
            cap = dec(out['cap'][str(o)])
            for k, v in t.items():
                if v < 0 or (k in CAPPED and v > cap and not close(v, cap)):
                    bad.append((name, 'invariant', o, k, v, cap))
                n['invariant'] += 1
        # klasa plain: niezalezny model sum
        if s['cls'] == 'plain':
            for o in owners:
                pool = {}
                for c in s['cities']:
                    if c['owner'] == o and c['surowce'] is not None:
                        for k, v in c['surowce'].items():
                            pool[k] = pool.get(k, 0.0) + dec(v)
                pool = {k: v for k, v in pool.items() if v > 0}  # assignOwnerResourceStockFromPool (faza 2)
                tech = set(s['techByOwner'][str(o)]) if s['techByOwner'] is not None else set(s['playerZbadane'])
                zl = s['zlotoByOwner'][str(o)] if s['zlotoByOwner'] is not None else True
                if o in mennica and ('Waluta' in tech or 'waluta' in tech) and zl and pool.get('zloto', 0.0) >= 1.0:
                    pool['zloto'] -= 1.0
                    n['drain_seen'] += 1
                    pool = {k: v for k, v in pool.items() if v > 0}
                cap = cap_of(s, o, mag)
                for k in list(pool):
                    if k in CAPPED and pool[k] > cap:
                        pool[k] = cap
                        n['clamp_seen'] += 1
                got = {k: v for k, v in web_tot.get(o, {}).items() if v > 0}
                if set(got) != set(pool) or any(not close(got[k], pool[k]) for k in pool):
                    bad.append((name, 'plain_totals', o, got, pool))
                n['plain_totals'] += 1
    # thrCases
    for i, c in enumerate(d['thrCases']):
        era = dec(c['era'])
        for rid, key, fb in RECIPES:
            base = econ_val(c['econ'], 'budynki', key, c['difficulty'], fb)
            want = era_scale(rid, base, era)
            got = dec(c['out'][rid])
            if not (close(got, want)):
                bad.append(('thrCase', i, rid, got, want))
        n['thrCases'] += 1
    # happyCases: maGarncarnie && isFinite(v) && v > 0 ? 1 : 0
    for i, c in enumerate(d['happyCases']):
        v = dec(c['v'])
        want = 1.0 if (c['g'] and math.isfinite(v) and v > 0) else 0.0
        if dec(c['out']) != want:
            bad.append(('happy', i))
        n['happy'] += 1
    print('checked', n, 'skipped_labels_counts', skipped_labels)
    print('mismatches', len(bad))
    for b in bad[:20]:
        print('MISMATCH', b)
    if bad:
        print('VERIFY FAIL')
        sys.exit(1)
    print('VERIFY OK')


if __name__ == '__main__':
    main(sys.argv[1])
