# Niezależne wyliczenie (runda 3) tabel Pracy budynków i złota jednostek BEZ kodu weba.
# Reguły wg P3-19 §2/§3 (wiersze 8, 10, 11, 25 inwentarza) i jednostkowe mnożniki z opisu:
#  - epoka: Kamień x1, Brąz x2, Żelazo x4 (pole Epoka jednostki / epokaWejscia budynku)
#  - Praca budynku, poziom n: m x (kosztBudowy + przyrostKosztu x (n-1)); m = 1/2/4 dla epokaWejscia 1/2/>=3
#  - Złoto jednostki: raw>0 -> max(1, round(raw x m)); raw=0 i Super-jednostka=TAK -> 0; inaczej rola/domyślne
#  - Utrzymanie złota: raw>0 -> base=max(1, round(raw x m)) x 4; raw=0 -> 0
# Argumenty (bezwzględne): units.json buildings.json miasto-params.json (wejście) oraz tabele wyjściowe
# building-work-costs.json unit-gold-costs.json. Uruchom: python3 -I verify-work-gold.py <...>
import json
import sys

units_path, buildings_path, miasto_path, work_path, gold_path = sys.argv[1:6]
units = json.load(open(units_path, encoding='utf8'))
buildings = json.load(open(buildings_path, encoding='utf8'))
miasto = json.load(open(miasto_path, encoding='utf8'))
work = json.load(open(work_path, encoding='utf8'))['wiersze']
gold = json.load(open(gold_path, encoding='utf8'))['wiersze']

MULT = {'Kamień': 1, 'Brąz': 2, 'Żelazo': 4}


def round_half_up(x):
    # Math.round w JS: połowy w górę (dla dodatnich wartości)
    return int(float(x) + 0.5)


def era_m(era):
    return 4 if era >= 3 else (2 if era >= 2 else 1)


errors = 0
checked = 0
bmap = {b['id']: b for b in buildings}
wmap = {r['budynek']: r for r in work}
if len(wmap) != len(buildings) or set(wmap) != set(bmap):
    print('BLAD: zbior budynkow tabeli Pracy != buildings.json')
    errors += 1
for bid, b in bmap.items():
    m = era_m(b['epokaWejscia'])
    r = wmap[bid]
    for n in range(1, 201):
        expected = m * (b['kosztBudowy'] + b['przyrostKosztu'] * (n - 1))
        got = r['praca_bazowa'] + r['praca_przyrost'] * (n - 1)
        checked += 1
        if expected != got:
            errors += 1
            print('ROZBIEZNOSC praca', bid, n, expected, got)

role_default = {
    'Wsparcie': miasto['jednostka_koszt_rola_wsparcie']['wartosc'],
    'Dystans': miasto['jednostka_koszt_rola_dystans']['wartosc'],
    'Wręcz': miasto['jednostka_koszt_rola_wrecz']['wartosc'],
    'Konnica': miasto['jednostka_koszt_rola_konnica']['wartosc'],
}
default_cost = miasto['jednostka_koszt_domyslny']['wartosc']
gmap = {r['jednostka']: r for r in gold}
for u in units:
    name = u['Jednostka']
    g = gmap.get(name)
    if g is None:
        errors += 1
        print('BRAK wiersza zlota', name)
        continue
    m = MULT[u['Epoka']]
    raw = u['Pieniądz (koszt)']
    if raw > 0:
        cost = max(1, round_half_up(raw * m))
    elif u.get('Super-jednostka') == 'TAK':
        cost = 0
    else:
        cost = max(1, round_half_up(role_default.get(u.get('Rola (linia)'), default_cost) * m))
    up = u['Utrzymanie (Pieniądz/turę)']
    # Runda 4: reguła kategorii (super / zwiadowca -> 0), zgodnie z economy-upkeep.ts:967-968
    # i kategoryzacją units/setup.ts:239-250 (super = Super-jednostka TAK; zwiadowca = nazwa/rola zwiad).
    low = name.lower()
    is_zero_cat = u.get('Super-jednostka') == 'TAK' or 'zwiad' in low
    if is_zero_cat:
        upkeep = 0
    elif up > 0:
        upkeep = max(1, round_half_up(up * m)) * 4
    else:
        upkeep = 0
    checked += 2
    if cost != g['pieniadz_koszt']:
        errors += 1
        print('ROZBIEZNOSC koszt', name, cost, g['pieniadz_koszt'])
    if upkeep != g['utrzymanie_pieniadz_ture']:
        errors += 1
        print('ROZBIEZNOSC utrzymanie', name, upkeep, g['utrzymanie_pieniadz_ture'])

print(f'porownan={checked} rozbieznosci={errors}')
