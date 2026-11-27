# Weryfikacja pomiaru 1 (limit wojen) i pomiaru 2 (sojusze AI-AI) z surowego jsonl.
# Uruchomienie: python3 -I analiza-limitow.py seed4242-all1-lvl-trudna.jsonl
import json, sys, collections

rows = [json.loads(l) for l in open(sys.argv[1], encoding='utf-8')]
gracz = rows[0]['diplo']['gracz']
print('wiersze:', len(rows), 'tury:', rows[0]['turn'], '..', rows[-1]['turn'])
max_total = (0, None)   # wszystkie pary w wojnie naraz (cala gra)
max_civ = (0, None)     # maks. wojen jednej cywilizacji (definicja wojnyRownolegleMax)
max_sojusz = (0, None)
zgodnosc = True
max_gracz_typ = collections.Counter()
for r in rows:
    pary = r['diplo']['pairs']
    wojny = [p for p in pary if p.get('status') == 'wojna']
    if len(wojny) > max_total[0]:
        max_total = (len(wojny), r['turn'])
    per = collections.Counter()
    for p in wojny:
        per[p['a']] += 1
        per[p['b']] += 1
    civ_max = max(per.values()) if per else 0
    if civ_max > max_civ[0]:
        max_civ = (civ_max, r['turn'])
    if civ_max != r['liczniki']['wojnyRownolegleMax']:
        zgodnosc = False
    sojusze = [p for p in pary if p.get('status') == 'sojusz']
    if len(sojusze) > max_sojusz[0]:
        max_sojusz = (len(sojusze), r['turn'])
    c = collections.Counter(p.get('typWojny') for p in wojny if gracz in (p['a'], p['b']))
    for typ, n in c.items():
        max_gracz_typ[typ] = max(max_gracz_typ[typ], n)
print('maks. par w wojnie naraz (cala gra) [liczba, tura]:', max_total)
print('maks. wojen jednej cywilizacji wg wyliczenia [liczba, tura]:', max_civ)
print('licznik wojnyRownolegleMax zgodny z wyliczeniem w kazdym wierszu:', zgodnosc)
print('maks. par ze statusem sojusz [liczba, tura]:', max_sojusz)
print('sojuszeAiAi w wierszach (zbior wartosci):', sorted({r['liczniki']['sojuszeAiAi'] for r in rows}))
print('wojny gracza (id %s), maks. na typ wojny w jednej turze:' % gracz, dict(max_gracz_typ))
print('zerwaniaZeroZaufania: pierwszy wiersz', rows[0]['liczniki']['zerwaniaZeroZaufania'], 'ostatni', rows[-1]['liczniki']['zerwaniaZeroZaufania'])
