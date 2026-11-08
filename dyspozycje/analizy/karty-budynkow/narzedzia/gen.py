# -*- coding: utf-8 -*-
"""Generator: turnieje per budynek + CSV + tabele do ANALIZA-KART-BUDYNKOW.md
(R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1, metoda z etapu 1: dyspozycje/analizy/karty-odkryc/).
Uruchomienie: python3 -I gen.py <repo_root>"""
import sys, os, json, csv, re, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bldata import B, DEAD, NOTES, ACT, COST_EXTRA

ROOT = sys.argv[1]
G = os.path.join(ROOT, 'gra')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'dyspozycje', 'analizy', 'karty-budynkow')
os.makedirs(os.path.join(OUT, 'turnieje'), exist_ok=True)

ALIAS = {
    'T': 'gra/data/tech.json', 'B': 'gra/data/buildings.json', 'U': 'gra/data/units.json',
    'EP': 'gra/data/econ-params.json', 'MP': 'gra/data/miasto-params.json', 'SP': 'gra/data/society-params.json',
    'CP': 'gra/data/combat-params.json',
    'EC': 'gra/src/game/economy.ts', 'TE': 'gra/src/game/turn-economy.ts', 'PR': 'gra/src/game/production.ts',
    'CD': 'gra/src/game/city-defense.ts', 'UB': 'gra/src/game/unit-building-bonuses.ts',
    'TR': 'gra/src/game/trade-routes.ts', 'MN': 'gra/src/main.ts', 'RS': 'gra/src/game/research.ts',
    'CV': 'gra/src/game/converters.ts', 'BG': 'gra/src/game/building-resource-gate.ts',
    'EU': 'gra/src/game/economy-upkeep.ts', 'ZA': 'gra/src/game/zloto-access.ts',
    'CR': 'gra/src/game/culture-religion.ts', 'CS': 'gra/src/game/conquest-stability.ts',
    'SB': 'gra/src/game/society-breakdown.ts', 'EF': 'gra/src/game/empire-food.ts',
    'WT': 'gra/src/game/work-tax.ts', 'SD': 'gra/src/game/siegeDefenders.ts', 'SG': 'gra/src/game/siege.ts',
    'MS': 'gra/src/game/mapSiegeDetect.ts', 'CH': 'gra/src/game/city-hex-movement.ts', 'CT': 'gra/src/game/cities.ts',
    'PG': 'gra/src/game/population-growth-v85.ts',
}
_lines = {}
def nlines(path):
    if path not in _lines:
        _lines[path] = sum(1 for _ in open(path, encoding='utf-8'))
    return _lines[path]
def ev_expand(ev):
    return '; '.join(f"{ALIAS[p.split(':', 1)[0]]}:{p.split(':', 1)[1]}" for p in ev.split(';'))
def check_ev(ev):
    for part in ev.split(';'):
        a, ln = part.split(':', 1)
        n = nlines(os.path.join(ROOT, ALIAS[a]))
        for x in ln.split('-'):
            assert 1 <= int(x) <= n, (ev, ALIAS[a], n)

CRIT = ['SKALA', 'NOWA MECHANIKA', 'BRAK ZASTĘPNIKA', 'ZASIĘG', 'ODCZUWALNOŚĆ', 'CZYTELNOŚĆ']
W = [3, 3, 2, 2, 2, 1]
def wsum(sc): return sum(a * b for a, b in zip(sc, W))

def duel(x, y):
    wx, wy = wsum(x['sc']), wsum(y['sc'])
    if wx != wy:
        win, los = (x, y) if wx > wy else (y, x)
        d_, i = max((W[i] * (win['sc'][i] - los['sc'][i]), i) for i in range(6))
        return win, los, f"przewaga w kryterium {CRIT[i]} ({win['sc'][i]} vs {los['sc'][i]}), suma ważona {wsum(win['sc'])}:{wsum(los['sc'])}"
    for i, name in ((0, 'SKALA'), (3, 'ZASIĘG'), (1, 'NOWA MECHANIKA')):
        if x['sc'][i] != y['sc'][i]:
            win, los = (x, y) if x['sc'][i] > y['sc'][i] else (y, x)
            return win, los, f"remis {wx}:{wy}, rozstrzyga {name} ({win['sc'][i]} vs {los['sc'][i]})"
    return x, y, f"remis {wx}:{wy} we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście"

# R-B1 (odpowiednik R-K1 z etapu 1): kandydat „next” (warunek innego budynku/badania, rozbudowa) sam nic
# nie daje — korzyść ocenia karta obiektu docelowego → NOWA MECHANIKA = 0, ODCZUWALNOŚĆ ≤ 1.
def apply_rules(c):
    if c['kind'] == 'next':
        s = list(c['sc']); s[1] = 0; s[4] = min(s[4], 1)
        d = dict(c); d['sc'] = tuple(s); d['rule'] = 'R-B1'
        return d
    return c

# E1-B (odpowiednik E1, decyzja właściciela pkt 4): Top1 = realna korzyść od ręki = efekt własny budynku
# (kind 'own'), działający od ukończenia budowy, SKALA > 0. Nie: warunek/rozbudowa, efekt martwy.
# E1-B2 (Obrona r1, zarzut Evaluatora 3): efekt „war” (wartość 0 bez stanu gry, którego budynek sam nie
# zapewnia, np. aktywnej trasy albo nadwyżki Pracy) nie jest korzyścią „od ręki” — Top1 tylko, gdy budynek nie ma innego efektu własnego.
def top1_eligible(c, allow_war=False):
    return c['kind'] == 'own' and c['sc'][0] > 0 and (allow_war or not c.get('war'))

def tournament(cands):
    wins = {c['id']: 0 for c in cands}
    duels = []
    for x, y in itertools.combinations(cands, 2):
        win, los, why = duel(x, y)
        wins[win['id']] += 1
        duels.append((x['id'], y['id'], win['id'], why))
    order = {c['id']: i for i, c in enumerate(cands)}
    rank = sorted(cands, key=lambda c: (-wins[c['id']], -wsum(c['sc']), -c['sc'][0], -c['sc'][3], order[c['id']]))
    return rank, wins, duels

def order_top(rank):
    el = [c for c in rank if top1_eligible(c)] or [c for c in rank if top1_eligible(c, allow_war=True)]
    if not el:
        return rank, False
    return [el[0]] + [c for c in rank if c is not el[0]], True

# ---------------------------------------------------------------- dane gry
BRAW = open(os.path.join(G, 'data/buildings.json'), encoding='utf-8').read().split('\n')
buildings = json.load(open(os.path.join(G, 'data/buildings.json'), encoding='utf-8'))
starts = [i + 1 for i, l in enumerate(BRAW) if re.match(r'\s+"id":', l)]
LINE = {b['id']: s for b, s in zip(buildings, starts)}
assert len(buildings) == 43 and set(B) == {b['id'] for b in buildings}, 'brak 43/43'
EPOKA = {1: 'Kamień', 2: 'Brąz', 3: 'Żelazo', 4: 'epoka 4 (niedostępna)'}

# Pomiar dzisiejszego top3: regex z etapu 1 (ANALIZA-KART-ODKRYC.md §2.4) + klasyfikacja Operatora (pole old)
STAGE1_RE = re.compile(r'^(Otwiera|Wymaga|Brama|Krok|Rozbudowa|Pierwszy|Niski koszt|Dostępn|Powstaje|Upgrade)')

def fmt_top(c):
    return f"{c['tytul']} — {c['tekst']}"

def upkeep_text(b):
    parts = [f"budowa {b['kosztBudowy']} Pracy"]
    if b.get('koszt_surowce'):
        parts.append(' + '.join(f"{v} {k}" for k, v in b['koszt_surowce'].items()))
    parts.append(f"utrzymanie {b['utrzymanie']} złota/turę")
    if b['id'] in COST_EXTRA:
        parts.append(COST_EXTRA[b['id']])
    return ', '.join(parts)

rows, stats_old, cmp_rows = [], dict(total=0, stage1_masło=0, kept=0, dead=0, cond=0), []
NIE = 'NIE_USTALONO'
for b in buildings:
    bid = b['id']
    cands = [apply_rules(x) for x in B[bid]]
    for x in cands:
        check_ev(x['ev'])
    for x in DEAD.get(bid, []):
        check_ev(x['ev'])
    old = b.get('top3') or []
    t3line = next(i + 1 for i in range(LINE[bid], len(BRAW)) if '"top3"' in BRAW[i])
    if cands:
        rank_t, wins, duels = tournament(cands)
        rank, e1 = order_top(rank_t)
    else:
        rank_t, wins, duels, rank, e1 = [], {}, [], [], False
    top = rank[:5]
    # porównanie ze starym top3
    in_top_old = {o for c in top for o in c['old']}
    any_old = {o for c in cands for o in c['old']}
    dead_old = {o for x in DEAD.get(bid, []) for o in x['old']}
    cmp = []
    for i, o in enumerate(old, 1):
        stats_old['total'] += 1
        if STAGE1_RE.match(o['tytul']):
            stats_old['stage1_masło'] += 1
        if i in in_top_old:
            k = 'ZACHOWANE (w nowym TOP 5)'; stats_old['kept'] += 1
        elif i in dead_old:
            k = 'USUNIĘTE — efekt martwy/nieprawdziwy'; stats_old['dead'] += 1
        elif i in any_old:
            k = 'SPADA poza TOP 5'
        else:
            k = 'USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)'; stats_old['cond'] += 1
        cmp.append((i, o['tytul'], k))
    added = [c for c in top if not c['old']]
    cmp_rows.append((b['nazwa'], cmp, added))
    # CMZ: CZYNNOŚĆ → KORZYŚĆ
    cmz = []
    if top and ACT.get(bid):
        own = [c for c in rank if c['kind'] == 'own' and c['cel']]
        if own:
            cmz.append(f"{ACT[bid]}, aby {own[0]['cel']}.")
        for c in rank:
            if c['kind'] == 'next' and c.get('akcja') and c['cel'] and len(cmz) < 3:
                cmz.append(f"{c['akcja']}, aby {c['cel']}.")
    if not cmz:
        cmz = [f"{NIE} — budynek dziś niedostępny; sekcji nie pokazywać (karta do ukrycia)."]
    sr = any(c['sr'] for c in top)
    pew = NIE if not top else ('SREDNIA' if sr else 'WYSOKA')
    status = 'FINALNE (Final Control r1, baza d36f8b3b0)' if top else 'NIE_USTALONO — budynek niedostępny w grze (ukryć kartę)'
    dead_txt = ' | '.join(f"UKRYĆ: {x['tytul']} — {x['powod']} [{ev_expand(x['ev'])}]" for x in DEAD.get(bid, []))
    uw = ' '.join(filter(None, [NOTES.get(bid, ''), ('Martwe: ' + dead_txt) if dead_txt else '',
                                f"Cena korzyści: {upkeep_text(b)}.", '' if e1 or not top else 'E1-B: brak efektu własnego.']))
    topcells = [fmt_top(c) for c in top] + [''] * (5 - len(top))
    if not top:
        topcells[0] = f"{NIE} — budynek niedostępny (patrz Uwagi)"
    rows.append({
        'Budynek': b['nazwa'], 'Kategoria': b['kategoria'], 'Epoka': EPOKA.get(b['epokaWejscia'], b['epokaWejscia']),
        'Obecnie_top3': ' | '.join(f"{i}. {o['tytul']} — {o['tekst']}" for i, o in enumerate(old, 1)) + f" [gra/data/buildings.json:{t3line}]",
        'Realne_efekty_z_dowodem': ' | '.join(f"{c['tytul']} [{ev_expand(c['ev'])}]" for c in cands) or NIE,
        'Top1_GLOWNA': topcells[0], 'Top2': topcells[1], 'Top3': topcells[2], 'Top4': topcells[3], 'Top5': topcells[4],
        'Co_mozesz_zrobic_OBECNIE': '(brak sekcji na karcie budynku — gra/src/ui/entityCards/buildingAdapter.ts:232-314 nie tworzy jej)',
        'Co_mozesz_zrobic_PROPOZYCJA': ' | '.join(cmz),
        'Dowod_plik_linia': ' || '.join(f"Top{i+1}: {ev_expand(c['ev'])}" for i, c in enumerate(top)) or ev_expand(DEAD[bid][0]['ev']),
        'Pewnosc': pew, 'Status_TOP5': status, 'Uwagi': uw,
        '_id': bid, '_n': len(cands), '_top': top, '_rank_t': rank_t, '_wins': wins, '_cmz': cmz,
    })
    # plik turnieju
    L = [f"# Turniej: {b['nazwa']} (`{bid}`)", '',
         f"Kategoria: {b['kategoria']} · Epoka wejścia: {EPOKA.get(b['epokaWejscia'])} · maksPoziom: {b['maksPoziom']} · technologia: {b['techUnlock']} · "
         f"definicja: `gra/data/buildings.json:{LINE[bid]}` · dzisiejszy top3: `:{t3line}`", '',
         f"Cena korzyści (nie jest kandydatem): {upkeep_text(b)}.", '',
         '## 1. Kandydaci (realne efekty z dowodem)', '',
         '| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |',
         '|---|---|---|---|---|---|---|---|---|---|---|---|']
    for c in cands:
        L.append(f"| {c['id']} | {c['kind']}{' (R-B1)' if c.get('rule') else ''} | {c['tytul']} | {c['tekst']} | "
                 + ' | '.join(str(v) for v in c['sc']) + f" | {wsum(c['sc'])} | {ev_expand(c['ev'])}{' (pewność ŚREDNIA)' if c['sr'] else ''}{' (E1-B2: efekt warunkowy)' if c.get('war') else ''} |")
    if not cands:
        L.append('| — | — | brak realnych efektów — budynek niedostępny | — | | | | | | | | |')
    L += ['', 'S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. '
          'R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.', '']
    if len(cands) < 5:
        L += [f"Liczba realnych efektów: {len(cands)} (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. "
              f"Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), "
              f"bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).", '']
    L += ['## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)', '']
    L += [f"- {x['tytul']} — {x['powod']} [{ev_expand(x['ev'])}]" for x in DEAD.get(bid, [])] or ['- brak']
    L += ['', '## 3. Pojedynki (każdy z każdym)', '']
    L += [f"- {a} vs {b_} → **{w}** — {why}." for a, b_, w, why in duels] or ['- brak (≤ 1 kandydat)']
    L += ['', '## 4. Ranking', '']
    L += [f"{i+1}. **{c['id']}** — {c['tytul']} — wygrane: {wins[c['id']]}, suma: {wsum(c['sc'])}" for i, c in enumerate(rank_t)] or ['—']
    if rank and rank_t and rank[0] is not rank_t[0]:
        why = 'efekt warunkowy — 0 bez stanu gry, którego budynek nie zapewnia (E1-B2)' if rank_t[0].get('war') else 'warunek/rozbudowa'
        L += ['', f"Reguła E1-B: {rank_t[0]['id']} to {why} → Top1 = **{rank[0]['id']}** (najwyżej w rankingu efekt własny bez warunku)."]
    L += ['', '## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)', '']
    L += [f"- Top{i+1}{' (GŁÓWNA KORZYŚĆ)' if i == 0 else ''}: **{c['tytul']}** — {c['tekst']}" for i, c in enumerate(top)] or [f"- {NIE} — budynek niedostępny"]
    L += ['', '## 6. Porównanie z dzisiejszym top3', '']
    L += [f"- {i}. „{t}” → {k}" for i, t, k in cmp]
    L += [f"- DODANE: {c['tytul']}" for c in added]
    L += ['', '## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)', '',
          'Dziś: sekcji brak na karcie budynku. Propozycja:', ''] + [f"- {x}" for x in cmz]
    L += ['', '## 8. Uwagi', '', NOTES.get(bid, '—'), '']
    open(os.path.join(OUT, 'turnieje', bid + '.md'), 'w', encoding='utf-8').write('\n'.join(L))

cols = ['Budynek', 'Kategoria', 'Epoka', 'Obecnie_top3', 'Realne_efekty_z_dowodem', 'Top1_GLOWNA', 'Top2', 'Top3', 'Top4', 'Top5',
        'Co_mozesz_zrobic_OBECNIE', 'Co_mozesz_zrobic_PROPOZYCJA', 'Dowod_plik_linia', 'Pewnosc', 'Status_TOP5', 'Uwagi']
with open(os.path.join(OUT, 'budynki-top5.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    wr = csv.DictWriter(f, fieldnames=cols, delimiter=';', quoting=csv.QUOTE_ALL, lineterminator='\n', extrasaction='ignore')
    wr.writeheader()
    for r in rows:
        wr.writerow(r)

idx = ['# Turnieje budynków — indeks', '', '| Budynek | Kandydaci | Pojedynki | Top1 (GŁÓWNA KORZYŚĆ) | Pewność | Plik |', '|---|---|---|---|---|---|']
for r in rows:
    n = r['_n']
    t1 = r['_top'][0]['tytul'] if r['_top'] else NIE
    idx.append(f"| {r['Budynek']} | {n} | {n*(n-1)//2} | {t1} | {r['Pewnosc']} | [{r['_id']}.md]({r['_id']}.md) |")
open(os.path.join(OUT, 'turnieje', 'README.md'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')

T = ['| Budynek | Top1 — GŁÓWNA KORZYŚĆ | Top2 | Top3 | Top4 | Top5 |', '|---|---|---|---|---|---|']
for r in rows:
    cells = [c['tytul'] for c in r['_top']] + ['—'] * (5 - len(r['_top']))
    if not r['_top']:
        cells[0] = 'NIE_USTALONO — niedostępny'
    T.append('| ' + ' | '.join([r['Budynek']] + cells) + ' |')
C = ['| Budynek | „Co możesz teraz zrobić” — PROPOZYCJA |', '|---|---|']
for r in rows:
    C.append(f"| {r['Budynek']} | {'<br>'.join(r['_cmz'])} |")
P = ['| Budynek | Dzisiejszy top3 → los pozycji | Dodane do TOP 5 |', '|---|---|---|']
for name, cmp, added in cmp_rows:
    P.append(f"| {name} | " + '<br>'.join(f"{i}. {t} → {k}" for i, t, k in cmp) + ' | ' + ('<br>'.join(c['tytul'] for c in added) or '—') + ' |')
D = ['| Budynek | Efekt do ukrycia | Powód | Dowód |', '|---|---|---|---|']
for b in buildings:
    for x in DEAD.get(b['id'], []):
        D.append(f"| {b['nazwa']} | {x['tytul']} | {x['powod']} | {ev_expand(x['ev'])} |")
open(os.path.join(HERE, 'tables.md'), 'w', encoding='utf-8').write(
    '## TOP\n\n' + '\n'.join(T) + '\n\n## CMZ\n\n' + '\n'.join(C) + '\n\n## PORÓWNANIE\n\n' + '\n'.join(P) + '\n\n## MARTWE\n\n' + '\n'.join(D) + '\n')

stats = dict(budynki=len(rows), z_top=sum(1 for r in rows if r['_top']), kandydaci=sum(r['_n'] for r in rows),
             pojedynki=sum(r['_n'] * (r['_n'] - 1) // 2 for r in rows),
             pozycji_top=sum(len(r['_top']) for r in rows), pelne5=sum(1 for r in rows if len(r['_top']) >= 5),
             martwe=sum(len(v) for v in DEAD.values()), stary_top3=stats_old,
             pewnosc={p: sum(1 for r in rows if r['Pewnosc'] == p) for p in ('WYSOKA', 'SREDNIA', NIE)},
             top1_zmieniony_vs_stary_pierwszy=sum(1 for r in rows if r['_top'] and 1 not in r['_top'][0]['old']))
json.dump(stats, open(os.path.join(HERE, 'stats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))

# Wstawienie tabel do ANALIZA-KART-BUDYNKOW.md (między znacznikami, idempotentnie)
DOC = os.path.join(OUT, 'ANALIZA-KART-BUDYNKOW.md')
if os.path.exists(DOC):
    s = open(DOC, encoding='utf-8').read()
    for key, tab in (('TOP', T), ('CMZ', C), ('POROWNANIE', P), ('MARTWE', D)):
        s = re.sub(rf'<!-- TABELA_{key} -->.*?<!-- /TABELA_{key} -->',
                   lambda m, tab=tab, key=key: f'<!-- TABELA_{key} -->\n\n' + '\n'.join(tab) + f'\n\n<!-- /TABELA_{key} -->',
                   s, flags=re.S)
    open(DOC, 'w', encoding='utf-8').write(s)
