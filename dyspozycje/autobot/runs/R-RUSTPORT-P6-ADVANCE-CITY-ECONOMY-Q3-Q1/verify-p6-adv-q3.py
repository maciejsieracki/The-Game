"""Niezalezny weryfikator wektorow P6-ADVANCE-CITY-ECONOMY-Q3 (python3 -I; bez Rust, bez kodu generatora).

Przelicza od zera, wg TEKSTU weba (pin 4bbef081d: turn-economy.ts :356-519 i :917-945, terrain-improvements.ts :72-100
i :482, territory.ts, okolica.ts :46, economy-upkeep.ts :77-86 i :598-615, :118-130, population-growth-v85.ts :111-125,
society-breakdown.ts :312-330), oczekiwane wartosci z WEJSC wektorow i porownuje z polem `out` z URUCHOMIONEGO,
prawdziwego weba:
  * `pracaUpkeepByOwner` (wszystkie scenariusze tickowe + klasa `directPraca` z fortami/posterunkami i `order`):
    wlasciciel heksu (`territoryOwnerAt`), klucze ulepszen (aliasy, duplikaty, nieznane), zbior kluczy platnych
    (`RESOURCE_UPKEEP_IMPROVEMENT_KEYS` = wszystkie klucze JSON bez `_*` i bez typu `wycinka`), mnoznik epoki 1/2/4/8..,
    zaokraglenie JS `Math.round`, wiersz kosztu `ulepszenie_surowcowe_upkeep_praca` (nadpisania: liczba, napis, brak);
  * `zdrowie` per miasto w scenariuszach tickowych BEZ Spichlerza (`spichlerz`/`spichlerz_ii` w budynkach miasta):
    parametry z `society-params.json`, dostep do wody (`rzeka.obecna` na heksie, `riverPaths`, sasiedzi), las w okolicy
    (promien `cityRangeForPopulation`), bonus osiedla, zageszczenie, brak wody;
  * `hdirect` (900 wywolan `computeCityHealthBreakdown`/`cityHasWaterAccess`): rowniez z uszkodzonymi `societyRaw`,
    ulamkowymi/nieskonczonymi `q,r`, bez kontekstu mapy (skan `tiles[].maRzeke`);
  * `hparams` (128 wywolan `loadHealthParams`, w tym nieznana trudnosc) i `hfull` (700 wywolan `computeCityHealth` z
    bonusem Spichlerza i nadwyzka Garncarni, `hasWaterAccess` true/false/undefined);
  * `p5direct` (160 uszkodzonych econ-params): `loadUpkeepParams`, `loadStorageParams`, `buildRationParams`;
  * `unitDirect` (120 uszkodzonych wierszy units.json): `buildUnitUpkeepTable` razem ze skalowaniem `scaleCostByEpoch`
    (building-stock-cost.ts:27-67).
NIE liczone niezaleznie: zdrowie w scenariuszach ze Spichlerzem (bonus zalezy od drenazu), runtime-bramka budynkow (rownowazna dla budynkow zdrowotnych, patrz doc).
Uzycie: python3 -I verify-p6-adv-q3.py <q3.json> <terrain-improvements.json> <econ-params.json> <society-params.json> <miasto-params.json>
"""
import json
import math
import re
import sys
import unicodedata

INF = float('inf')
ALIASES = {'pastwisko': 'bydlo'}
NB = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]


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


def js_round(x):
    """JS Math.round: polowki w gore, wynik -0 dla x w [-0.5, 0)."""
    if not math.isfinite(x):
        return x
    r = math.floor(x + 0.5)
    if r == 0 and (x < 0 or (x == 0 and math.copysign(1, x) < 0)):
        return -0.0
    return float(r)


def epoch_cost_multiplier(epoch):
    """epochCostMultiplier (building-stock-cost.ts:27-57)."""
    if isinstance(epoch, (int, float)) and not isinstance(epoch, bool) and math.isfinite(epoch):
        o = math.floor(epoch)
        return 4 if o >= 3 else (2 if o >= 2 else 1)
    if not isinstance(epoch, str):
        return 1
    n = ''.join(ch for ch in unicodedata.normalize('NFD', epoch) if not ('\u0300' <= ch <= '\u036f')).strip().lower()
    if re.fullmatch(r'\d+(?:\.\d+)?', n):
        return epoch_cost_multiplier(float(n))
    if n in ('kamien', 'stone', '1'):
        return 1
    if n in ('braz', 'bronze', '2'):
        return 2
    if n in ('zelazo', 'zelazo+', 'iron', 'iron+', 'iron plus', 'steel', 'stal'):
        return 4
    return 1


def scale_cost_by_epoch(cost, epoch):
    """scaleCostByEpoch (building-stock-cost.ts:60-67)."""
    if not math.isfinite(cost) or cost < 0:
        return 0.0
    if cost == 0:
        return 0.0
    return max(1.0, js_round(cost * epoch_cost_multiplier(epoch)))


def hexdist(aq, ar, bq, br):
    return max(abs(aq - bq), abs(ar - br), abs((-aq - ar) - (-bq - br)))


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def same(a, b):
    return (math.isnan(a) and math.isnan(b)) or (a == b and math.copysign(1, a) == math.copysign(1, b))


class Ctx:
    def __init__(self, ti, econ, society, miasto):
        self.ti = ti
        self.econ = econ
        self.society = society
        self.rng_min = miasto['zasieg_okolicy_baza']['wartosc']
        self.rng_cap = miasto['zasieg_okolicy_max']['wartosc']
        self.fort_r = ti['fort']['zasieg_terytorium']
        self.outpost_r = ti['posterunek']['zasieg_terytorium']
        # RESOURCE_UPKEEP_IMPROVEMENT_KEYS: klucze JSON bez `_*` i bez typu `wycinka`
        self.upkeep_keys = {k for k, v in ti.items() if not k.startswith('_') and (not isinstance(v, dict) or v.get('typ') != 'wycinka')}

    def range_for_pop(self, pop):
        p = math.floor(pop) if math.isfinite(pop) else 0
        if p <= 0:
            return 0
        return min(max(self.rng_min, p), self.rng_cap)

    def norm(self, raw):
        if not raw or raw == 'brak':
            return None
        key = ALIASES.get(raw, raw)
        if key in self.ti and not key.startswith('_'):
            return key
        return raw if (raw in self.ti and not raw.startswith('_')) else None

    def keys_for_hex(self, row):
        _, _, _, _, _, ul, uls, _ = row
        if uls:
            out = []
            for k in uls:
                n = self.norm(k)
                if n is not None and n not in out:
                    out.append(n)
            return out
        n = self.norm(ul if ul is not None else 'brak')
        return [n] if n else []

    def era_of_key(self, key):
        e = self.ti[key].get('epoka') if key in self.ti else None
        return e if is_num(e) else 1

    @staticmethod
    def era_mult(era):
        n = math.floor(era) if is_num(era) else 1
        if n <= 1:
            return 1
        if n == 2:
            return 2
        if n == 3:
            return 4
        return 4 * 2 ** (n - 3)

    def node_radius(self, n):
        if n.get('fort'):
            return self.fort_r
        if n.get('outpost'):
            return self.outpost_r
        return self.range_for_pop(n['pop'])


def owner_at(cx, q, r, nodes):
    best_city = None
    best_city_d = INF
    best_fort = None
    best_fort_d = INF
    best_fort_o = None
    for n in nodes:
        rad = cx.node_radius(n)
        d = hexdist(q, r, n['q'], n['r'])
        if d > rad:
            continue
        if n.get('fort') or n.get('outpost'):
            o = n.get('order')
            if best_fort is not None and o and best_fort_o:
                better = o['turn'] < best_fort_o['turn'] if o['turn'] != best_fort_o['turn'] else o['seq'] < best_fort_o['seq']
            else:
                better = d < best_fort_d
            if better:
                best_fort_d = d
                best_fort = n['owner']
                best_fort_o = o
        elif d < best_city_d:
            best_city_d = d
            best_city = n['owner']
    return best_city if best_city is not None else best_fort


def praca_cost(cx, praca, difficulty):
    """loadThroughput(data.econParams ?? {}, 'ulepszenie_surowcowe_upkeep_praca', difficulty, 1) z nadpisaniem wiersza."""
    key = 'ulepszenie_surowcowe_upkeep_praca'
    bu = cx.econ.get('budynki')
    row = bu.get(key) if isinstance(bu, dict) else None
    if praca is None:
        pass
    elif praca == 'no-row':
        row = None
    elif praca == 'no-group':
        row = None
    elif praca == 'row-string':
        row = 'x'
    elif praca == 'row-array':
        row = [3, 4, 5]
    else:
        row = praca
    v = row.get(difficulty) if isinstance(row, dict) else None
    return float(v) if is_num(v) else 1.0


def praca_upkeep(cx, mp, nodes, difficulty, praca):
    cost = max(0.0, praca_cost(cx, praca, difficulty))
    out = {}
    for row in mp['hexes']:
        keys = cx.keys_for_hex(row)
        if not keys:
            continue
        owner = owner_at(cx, row[0], row[1], nodes)
        if owner is None:
            continue
        upkeep = 0.0
        for k in keys:
            if k not in cx.upkeep_keys:
                continue
            upkeep += max(0.0, js_round(cost * cx.era_mult(cx.era_of_key(k))))
        if upkeep > 0:
            out[str(owner)] = out.get(str(owner), 0) + upkeep
    return out


# ---- zdrowie ----------------------------------------------------------------------------------------------------------
class Health:
    def __init__(self, soc, difficulty):
        zd = soc.get('zdrowie') if isinstance(soc, dict) else None
        self.zd = zd if isinstance(zd, dict) else {}
        self.d = difficulty
        self.prog = self.rd('zdrowie_prog_zagęszczenia', 4)
        self.legacy = self.rd('zdrowie_male_miasto_bonus', 1)
        self.rzeka = self.rd('zdrowie_rzeka', 2)
        self.akwedukt = self.rd('zdrowie_akwedukt', 4)
        self.studnia = self.rd('zdrowie_studnia', 2)
        self.targowisko = self.rd('zdrowie_targowisko', 2)
        self.laznia = self.rd('zdrowie_laznia_publiczna', 5)
        self.kara_zag = self.rd('zdrowie_kara_zagęszczenie', -1)
        self.kara_bagno = self.rd('zdrowie_kara_bagno', -1)
        self.las = self.rd('zdrowie_bonus_las', 1)
        self.brak_wody = self.rd('zdrowie_kara_brak_wody', -2)

    def rd(self, key, fb):
        row = self.zd.get(key)
        if not isinstance(row, dict):
            return float(fb)
        v = row.get(self.d)
        return float(v) if is_num(v) else float(fb)

    def osiedle(self, pop):
        legacy = self.legacy if pop <= self.prog else 0.0
        p = math.floor(pop) if math.isfinite(pop) else pop
        if not math.isnan(p) and (p < 1 or p > 4):
            return 0.0
        if math.isnan(p) or math.isinf(p):
            return legacy
        idx = int(p) - 1
        row = self.zd.get('zdrowie_bonus_osiedle_pop')
        if isinstance(row, dict):
            arr = row.get(self.d)
            if isinstance(arr, list) and idx < len(arr) and is_num(arr[idx]):
                return float(arr[idx])
        return legacy


def water_access(mp, q, r):
    """cityHasWaterAccess: klucze `${q},${r}` -- tylko calkowite wspolrzedne moga trafic w mape / riverPaths."""
    if not (math.isfinite(q) and math.isfinite(r)) or q != math.floor(q) or r != math.floor(r):
        return False
    q, r = int(q), int(r)
    rivers = {(a, b) for path in mp['rivers'] for a, b in path}
    hexes = {(row[0], row[1]): row for row in mp['hexes']}
    h = hexes.get((q, r))
    if h is not None and h[4] == 1:
        return True
    if (q, r) in rivers:
        return True
    return any((q + dq, r + dr) in rivers for dq, dr in NB)


def has_las(cx, mp, q, r, pop):
    if not (math.isfinite(q) and math.isfinite(r)) or q != math.floor(q) or r != math.floor(r):
        return False
    q, r = int(q), int(r)
    rad = cx.range_for_pop(pop)
    rr = math.floor(rad) if math.isfinite(rad) and rad > 0 else 0
    hexes = {(row[0], row[1]): row for row in mp['hexes']}
    for dq in range(-rr, rr + 1):
        for dr in range(max(-rr, -dq - rr), min(rr, -dq + rr) + 1):
            h = hexes.get((q + dq, r + dr))
            if h is not None and h[3] == 'las':
                return True
    return False


def city_health(cx, hp, mp, ludnosc, built, water, las_flag, tiles=None, spich=0.0, garn=0.0):
    z = 0.0
    ma_rzeka = water if water is not None else any(tiles or [])
    if ma_rzeka:
        z += hp.rzeka
    if 'akwedukt' in built:
        z += hp.akwedukt
    if 'studnia' in built:
        z += hp.studnia
    if 'targowisko' in built:
        z += hp.targowisko
    if 'laznia_publiczna' in built:
        z += hp.laznia
    o = hp.osiedle(ludnosc)
    if o != 0 and not math.isnan(o):
        z += o
    if ludnosc > hp.prog:
        z += hp.kara_zag * (ludnosc - hp.prog)
    if not ma_rzeka and 'studnia' not in built and 'akwedukt' not in built:
        z += hp.brak_wody
    if las_flag:
        z += hp.las
    if spich != 0 and not math.isnan(spich):
        z += spich
    if garn != 0 and not math.isnan(garn):
        z += garn
    return js_round(z)


# ---- P5 ---------------------------------------------------------------------------------------------------------------
def read_num(group, key, d, fb):
    row = group.get(key) if isinstance(group, dict) else None
    v = row.get(d) if isinstance(row, dict) else None
    return float(v) if is_num(v) else float(fb)


def pick_ration(row, d, fb):
    if not row:
        return float(fb)
    v = row.get(d) if isinstance(row, dict) else None
    return float(v) if is_num(v) else float(fb)


def main():
    q3, ti, econ, soc, miasto = (json.load(open(p, encoding='utf-8')) for p in sys.argv[1:6])
    cx = Ctx(ti, econ, soc, miasto)
    d = json.load(open(sys.argv[1], encoding='utf-8')) if False else q3
    maps = d['maps']
    bad = []
    stats = {'praca': 0, 'praca_nonempty': 0, 'zdrowie': 0, 'zdrowie_skip_spichlerz': 0, 'directPraca': 0, 'directPraca_nonempty': 0,
             'hdirect': 0, 'hdirect_water': 0, 'hdirect_las': 0, 'p5': 0, 'unit': 0, 'unit_nonempty': 0}

    # ---- scenariusze tickowe: praca + zdrowie
    for s in d['scenarios']:
        mp = maps[s['mapIdx']]
        nodes = [{'q': c['q'], 'r': c['r'], 'pop': c['pop'], 'owner': c['owner']} for c in s['cities']]
        got = praca_upkeep(cx, mp, nodes, s['difficulty'], s['praca'])
        stats['praca'] += 1
        stats['praca_nonempty'] += bool(got)
        want = {k: dec(v) for k, v in s['out']['praca'].items()}
        if got.keys() != want.keys() or any(not same(float(got[k]), want[k]) for k in got):
            bad.append(('praca', s['name'], got, want))
        hp = Health(soc, s['difficulty'])
        for c, (cid, zw) in zip(s['cities'], s['out']['zdrowie']):
            if 'spichlerz' in c['built'] or 'spichlerz_ii' in c['built']:
                stats['zdrowie_skip_spichlerz'] += 1
                continue
            stats['zdrowie'] += 1
            water = water_access(mp, c['q'], c['r'])
            las = has_las(cx, mp, c['q'], c['r'], c['pop'])
            z = city_health(cx, hp, mp, float(c['pop']), c['built'], water, las)
            if not same(float(z), dec(zw)):
                bad.append(('zdrowie', s['name'], cid, z, dec(zw)))

    # ---- directPraca (fort / posterunek / order)
    for s in d['directPraca']:
        mp = maps[s['mapIdx']]
        nodes = []
        cn = [{'q': c['q'], 'r': c['r'], 'pop': c['pop'], 'owner': c['ownerId']} for c in s['cities']]
        fn = []
        for f in s['forts']:
            n = {'q': f['q'], 'r': f['r'], 'pop': 0, 'owner': f['owner'], 'fort' if f['kind'] == 'fort' else 'outpost': True}
            if 'order' in f:
                n['order'] = f['order']
            fn.append(n)
        nodes = fn + cn if s['fortsFirst'] else cn + fn
        got = praca_upkeep(cx, mp, nodes, s['difficulty'], s['praca'])
        stats['directPraca'] += 1
        stats['directPraca_nonempty'] += bool(got)
        want = {k: dec(v) for k, v in s['out'].items()}
        if got.keys() != want.keys() or any(not same(float(got[k]), want[k]) for k in got):
            bad.append(('directPraca', s['name'], got, want))

    # ---- hdirect
    for i, h in enumerate(d['hdirect']):
        mp = maps[h['mapIdx']]
        q, r = dec(h['q']), dec(h['r'])
        water = water_access(mp, q, r)
        stats['hdirect'] += 1
        stats['hdirect_water'] += water
        if water != h['water']:
            bad.append(('water', i, water, h['water']))
        if h['soc'] == 'real':
            sv = soc
        elif 'none' in (h['socValue'] or {}):
            sv = None
        else:
            sv = h['socValue']['v']
        hp = Health(sv, h['difficulty'])
        lud = dec(h['ludnosc'])
        if h['useCtx']:
            las = has_las(cx, mp, q, r, dec(h['ctxPop']))
            stats['hdirect_las'] += las
            z = city_health(cx, hp, mp, lud, h['built'], water, las)
        else:
            z = city_health(cx, hp, mp, lud, h['built'], None, False, tiles=h['tiles'])
        if not same(float(z), dec(h['total'])):
            bad.append(('hdirect', i, h['soc'], z, dec(h['total'])))

    # ---- hparams (loadHealthParams, pelny obiekt) i hfull (computeCityHealth ze Spichlerzem/Garncarnia)
    def soc_of(h):
        if h['soc'] == 'real':
            return soc
        if 'none' in (h['socValue'] or {}):
            return None
        return h['socValue']['v']

    for i, h in enumerate(d['hparams']):
        hp = Health(soc_of(h), h['difficulty'])
        exp = {'rzeka': hp.rzeka, 'akwedukt': hp.akwedukt, 'studnia': hp.studnia, 'targowisko': hp.targowisko, 'lazniaPubliczna': hp.laznia,
               'ceramika': hp.rd('zdrowie_ceramika', 1), 'karaZagoszczenie': hp.kara_zag, 'progZagoszczenia': hp.prog, 'karaBagno': hp.kara_bagno,
               'bonusLas': hp.las, 'karaDzungla': hp.rd('zdrowie_kara_dzungla', -1), 'karaBrakWody': hp.brak_wody}
        stats['hparams'] = stats.get('hparams', 0) + 1
        for k, v in exp.items():
            if not same(v, dec(h['out'][k])):
                bad.append(('hparams', i, k, v, dec(h['out'][k])))
        for p, v in h['out']['osiedle']:
            if not same(hp.osiedle(dec(p)), dec(v)):
                bad.append(('hparams-osiedle', i, p, hp.osiedle(dec(p)), dec(v)))
    for i, h in enumerate(d['hfull']):
        mp = maps[h['mapIdx']]
        hp = Health(soc_of(h), h['difficulty'])
        q, r = dec(h['q']), dec(h['r'])
        hw = h['hasWater']
        # mapCtx tylko dla las; woda z argumentu hasWaterAccess (true/false/undefined -> skan tiles)
        las = has_las(cx, mp, q, r, dec(h['ctxPop'])) if h['useCtx'] else False
        z = city_health(cx, hp, mp, dec(h['ludnosc']), h['built'], hw, las, tiles=h['tiles'], spich=dec(h['spich']), garn=dec(h['garn']))
        stats['hfull'] = stats.get('hfull', 0) + 1
        if not same(float(z), dec(h['out'])):
            bad.append(('hfull', i, z, dec(h['out'])))

    for i, h in enumerate(d['hriver']):
        stats['hriver'] = stats.get('hriver', 0) + 1
        if water_access(h['map'], float(h['q']), float(h['r'])) != h['water']:
            bad.append(('hriver', i))

    # ---- P5 params
    for i, s in enumerate(d['p5direct']):
        e = s['econ']
        dd = s['difficulty']
        em, bu, g = e.get('ekonomia_miasta'), e.get('budynki'), e.get('globalne')
        exp = {
            'upkeep': {
                'budynekUtrzymanieFlat': read_num(bu, 'utrzymanie_budynek', dd, 1),
                'jednostkaUtrzymanieStd': read_num(g, 'utrzymanie_jednostka_standard', dd, 1),
                'zywnoscJednostkaRuch': read_num(em, 'zywnosc_jednostka_ruch', dd, 1),
                'zywnoscJednostkaOboz': read_num(em, 'zywnosc_jednostka_oboz', dd, 0.5),
                'zywnoscMnoznikTerytorium': read_num(em, 'zywnosc_mnoznik_terytorium_wlasne', dd, 1),
                'zywnoscMnoznikPozaTerytorium': read_num(em, 'zywnosc_mnoznik_poza_terytorium', dd, 2),
            },
            'storage': {
                'bazaZywnosc': read_num(g, 'magazyn_baza_zywnosc', dd, 20),
                'bazaSurowce': read_num(g, 'magazyn_baza_surowce', dd, 10),
                'mnoznikMagazynu': read_num(g, 'magazyn_mnoznik_spichlerz', dd, 5),
            },
        }
        section = em if em is not None else e
        sec = section if isinstance(section, dict) else {}
        exp['ration'] = {
            'racjeZywnosc1': pick_ration(sec.get('racje_zywnosc_1'), dd, 2), 'racjeZywnosc2': pick_ration(sec.get('racje_zywnosc_2'), dd, 4),
            'racjeZywnosc3': pick_ration(sec.get('racje_zywnosc_3'), dd, 6), 'racjeWzrostProc1': pick_ration(sec.get('racje_wzrost_proc_1'), dd, 3),
            'racjeWzrostProc2': pick_ration(sec.get('racje_wzrost_proc_2'), dd, 5), 'racjeWzrostProc3': pick_ration(sec.get('racje_wzrost_proc_3'), dd, 7),
        }
        stats['p5'] += 1
        for grp, vals in exp.items():
            for k, v in vals.items():
                if not same(v, dec(s['out'][grp][k])):
                    bad.append(('p5', i, grp, k, v, dec(s['out'][grp][k])))

    # ---- buildUnitUpkeepTable (czesc niezalezna od skali epoki)
    for i, s in enumerate(d['unitDirect']):
        rows = json.loads(s['rowsJson'])
        got = {}
        for row in rows:
            name = row.get('Jednostka')
            if not isinstance(name, str) or len(name) == 0:
                continue
            up = None
            direct = row.get('Utrzymanie (Pieniadz/ture)')
            if is_num(direct):
                up = float(direct)
            else:
                for k in row:
                    if k.startswith('Utrzymanie'):
                        v = row[k]
                        if is_num(v):
                            up = float(v)
                            break
            ep = row.get('Epoka')
            if up is not None:
                got[name] = scale_cost_by_epoch(up, ep)
        stats['unit'] += 1
        stats['unit_nonempty'] += bool(got)
        want = {k: dec(v) for k, v in s['out'].items()}
        if got.keys() != want.keys() or any(not same(got[k], want[k]) for k in got):
            bad.append(('unit', i, got, want))

    for b in bad[:20]:
        print('ROZBIEZNOSC', b)
    print('rozbieznosci:', len(bad))
    print('statystyki:', json.dumps(stats, sort_keys=True))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
