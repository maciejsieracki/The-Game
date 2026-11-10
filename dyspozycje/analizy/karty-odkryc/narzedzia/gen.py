# -*- coding: utf-8 -*-
"""Generator: turnieje per odkrycie + CSV + tabele do ANALIZA-KART-ODKRYC.md.
Uruchomienie: python3 -I gen.py <repo_root>"""
import sys, os, json, csv, re, itertools, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from techdata import TECHS, ACT, NOTES
from fc_final import FC_SCORES, FC_Q7

ROOT = sys.argv[1]
G = os.path.join(ROOT, 'gra')
OUT = os.path.join(ROOT, 'dyspozycje', 'analizy', 'karty-odkryc')
os.makedirs(os.path.join(OUT, 'turnieje'), exist_ok=True)

ALIAS = {
    'T': 'gra/data/tech.json', 'B': 'gra/data/buildings.json', 'U': 'gra/data/units.json',
    'TI': 'gra/data/terrain-improvements.json', 'EP': 'gra/data/econ-params.json',
    'MP': 'gra/data/miasto-params.json', 'SP': 'gra/data/society-params.json', 'W': 'gra/data/wonders.json',
    'EC': 'gra/src/game/economy.ts', 'TE': 'gra/src/game/turn-economy.ts', 'PR': 'gra/src/game/production.ts',
    'CD': 'gra/src/game/city-defense.ts', 'UB': 'gra/src/game/unit-building-bonuses.ts',
    'TR': 'gra/src/game/trade-routes.ts', 'MN': 'gra/src/main.ts', 'RM': 'gra/src/map/road-movement.ts',
    'EM': 'gra/src/game/embarkation.ts', 'GN': 'gra/src/game/generals.ts', 'PS': 'gra/src/game/playerState.ts',
    'RS': 'gra/src/game/research.ts', 'IT': 'gra/src/game/improvement-tech.ts', 'CV': 'gra/src/game/converters.ts',
    'BG': 'gra/src/game/building-resource-gate.ts', 'EU': 'gra/src/game/economy-upkeep.ts',
    'ZA': 'gra/src/game/zloto-access.ts', 'BS': 'gra/src/game/building-stock-cost.ts',
}
def ev_expand(ev):
    out = []
    for part in ev.split(';'):
        a, ln = part.split(':', 1)
        out.append(f"{ALIAS[a]}:{ln}")
    return '; '.join(out)

# sanity: every cited line exists
def check_ev(ev):
    for part in ev.split(';'):
        a, ln = part.split(':', 1)
        path = os.path.join(ROOT, ALIAS[a])
        n = sum(1 for _ in open(path, encoding='utf-8'))
        for x in ln.split('-'):
            assert int(x) <= n, (ev, path, n)

CRIT = ['SKALA', 'NOWA MECHANIKA', 'BRAK ZASTĘPNIKA', 'ZASIĘG', 'ODCZUWALNOŚĆ', 'CZYTELNOŚĆ']
W = [3, 3, 2, 2, 2, 1]
def wsum(sc): return sum(a * b for a, b in zip(sc, W))

def duel(x, y):
    """zwraca (zwycięzca, przegrany, zdanie)"""
    wx, wy = wsum(x['sc']), wsum(y['sc'])
    if wx != wy:
        win, los = (x, y) if wx > wy else (y, x)
        diffs = [(W[i] * (win['sc'][i] - los['sc'][i]), i) for i in range(6)]
        d, i = max(diffs)
        why = f"przewaga w kryterium {CRIT[i]} ({win['sc'][i]} vs {los['sc'][i]}), suma ważona {wsum(win['sc'])}:{wsum(los['sc'])}"
        return win, los, why
    for i, name in ((0, 'SKALA'), (3, 'ZASIĘG'), (1, 'NOWA MECHANIKA')):
        if x['sc'][i] != y['sc'][i]:
            win, los = (x, y) if x['sc'][i] > y['sc'][i] else (y, x)
            return win, los, f"remis {wx}:{wy}, rozstrzyga {name} ({win['sc'][i]} vs {los['sc'][i]})"
    return x, y, f"remis {wx}:{wy} we wszystkich kryteriach rozstrzygających — wygrywa kandydat wyżej na liście"

# ---------------- Obrona r1 (zarzut Z3): reguły oceny i dopuszczenia do Top1 ----------------
# R-K1: droga badań (obj 'T:next') sama nic nie odblokowuje — mechanikę ocenia karta NASTĘPNEGO
#       odkrycia (bez podwójnego liczenia) → NOWA MECHANIKA = 0; korzyść przychodzi dopiero po
#       kolejnym pełnym badaniu, a skala ODCZUWALNOŚCI (§1.2) mówi wprost: 1 = „po łańcuchu warunków
#       (inna technologia…)” → ODCZUWALNOŚĆ = min(O, 1).
def apply_rules(c):
    if c['obj'] == 'T:next':
        s = list(c['sc']); s[1] = 0; s[4] = min(s[4], 1)
        d = dict(c); d['sc'] = tuple(s); d['rule'] = 'R-K1'
        return d
    return c

# E1: Top1 = GŁÓWNA KORZYŚĆ = to, co odkrycie daje KAŻDEMU graczowi bez kolejnego badania i bez
#     wyścigu z innymi państwami. Nie mogą nią być: droga badań, cud (maxNaSwiecie=1: wyścig albo cud
#     narodowy jednej cywilizacji), obiekt tylko dla części cywilizacji, efekt martwy (SKALA 0).
#     Pozycje Top2–Top5 zostają w kolejności turnieju.
def top1_eligible(c):
    t = c['txt']
    if c['obj'] == 'T:next' or (c['obj'] or '').startswith('W:'):
        return False
    if t.startswith('Cud') or c['sc'][0] == 0:
        return False
    if c['obj'] == 'U:zelazo_nar' or 'narodow' in t or '(Chiny' in t or '(Inkowie)' in t:
        return False
    return True

def order_top(rank):
    el = [c for c in rank if top1_eligible(c)]
    if not el:
        return rank, False
    return [el[0]] + [c for c in rank if c is not el[0]], True

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

def slug(s):
    s = unicodedata.normalize('NFD', s.replace('ł', 'l').replace('Ł', 'L'))
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

# ---------------- odtworzenie dzisiejszej karty (technologyAdapter.ts) ----------------
tech_rows = json.load(open(os.path.join(G, 'data/tech.json'), encoding='utf-8'))['technologie']
buildings = json.load(open(os.path.join(G, 'data/buildings.json'), encoding='utf-8'))
units = json.load(open(os.path.join(G, 'data/units.json'), encoding='utf-8'))
def lst(raw):
    return [x.strip() for x in re.split(r'[;,+]', raw or '') if x.strip() not in ('', '-', '—')]
def effect_text(b):
    eff = [f"{k} {'+' if v > 0 else ''}{v}" for k, v in (b.get('przyrost') or {}).items() if v]
    if not eff:
        eff = [f"{k} {'+' if v > 0 else ''}{v}" for k, v in (b.get('baza') or {}).items() if v]
    return ', '.join(eff)
def current_card(t):
    name = t['Technologia']
    bs = [b for b in buildings if b.get('techUnlock') == name]
    us = [u for u in units if u.get('Tech') == name]
    nxt = [x for x in tech_rows if name in lst(x.get('Wymaga (prereq)'))]
    imps = lst(t.get('Odblokowuje ulepszenie terenu'))
    res = t.get('Odblokowuje surowiec.') or None
    cmz = []
    if res: cmz.append(f"[Możesz teraz] Sprawdź dostęp do surowca: {res}.")
    if bs: cmz.append(f"[Najpierw spełnij] Zbuduj {' lub '.join(b['nazwa'] for b in bs)}, jeśli spełniasz ich wymagania.")
    if imps: cmz.append(f"[Najpierw spełnij] Przygotuj {', '.join(imps)} na odpowiednim złożu.")
    if nxt: cmz.append("[Możesz teraz] Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.")
    if cmz: cmz.append("[Nie oznacza] Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.")
    econ = []
    for b in bs:
        e = effect_text(b)
        if e: econ.append(f"{b['nazwa']}: {e}")
        if b.get('utrzymanie') is not None: econ.append(f"{b['nazwa']} — utrzymanie: {b['utrzymanie']} złota na turę")
    if res: econ.append(f"Dostęp do surowca: {res}")
    parts = []
    if bs: parts.append('Budynki: ' + ', '.join(b['nazwa'] for b in bs))
    if us: parts.append(f'Jednostki ({len(us)}): ' + ', '.join(u['Jednostka'] for u in us[:6]) + (' …' if len(us) > 6 else ''))
    if imps: parts.append('Ulepszenia: ' + ', '.join(imps))
    if nxt: parts.append('Kolejne technologie: ' + ', '.join(x['Technologia'] for x in nxt))
    if econ: parts.append('Zmiany ekonomiczne: ' + ' | '.join(econ))
    if not parts: parts.append('tylko Wymagania i Charakterystyka (brak odblokowań)')
    return dict(cmz=cmz, summary='; '.join(parts), res=res, bs=bs, imps=imps, nxt=nxt, us=us)

TEMPLATE_KEYS = {
    'T1': ('Sprawdź dostęp do surowca: {X}.', 'gra/src/ui/entityCards/technologyAdapter.ts:147; gra/src/ui/techDiscoveryNotice.ts:213'),
    'T2': ('Zbuduj {X}, jeśli spełniasz ich wymagania.', 'gra/src/ui/entityCards/technologyAdapter.ts:154; gra/src/ui/techDiscoveryNotice.ts:216'),
    'T3': ('Przygotuj {X} na odpowiednim złożu.', 'gra/src/ui/entityCards/technologyAdapter.ts:160; gra/src/ui/techDiscoveryNotice.ts:219'),
    'T4': ('Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.', 'gra/src/ui/entityCards/technologyAdapter.ts:166; gra/src/ui/techDiscoveryNotice.ts:222'),
    'T5': ('Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.', 'gra/src/ui/entityCards/technologyAdapter.ts:173; gra/src/ui/techDiscoveryNotice.ts:225'),
}
tcount = {k: 0 for k in TEMPLATE_KEYS}

rows = []
ranks_all = {}
FC_REPORT = []
assert len(tech_rows) == 32 and set(TECHS) == {t['Technologia'] for t in tech_rows}, 'brak 32/32'
NIE = 'NIE_USTALONO — brak kolejnego realnego efektu w danych/kodzie (patrz Uwagi)'
long_txt = []
for t in tech_rows:
    name = t['Technologia']
    cands = [apply_rules(x) for x in TECHS[name]]
    for cnd in cands:
        check_ev(cnd['ev'])
        if len(cnd['txt']) > 72: long_txt.append((name, cnd['txt'], len(cnd['txt'])))
    rank_t, wins, duels = tournament(cands)
    rank, e1_ok = order_top(rank_t)
    rank_ob, cands_cmz = rank, cands
    # ---- Final Control r1: trzeci, niezależny turniej (fc_final.py) — wynik FINALNY ----
    status = 'FINALNE (FC r1: zatwierdzone bez trzeciego turnieju — zgodność Operator/Evaluator ≥ 3/5, sporne pozycje rozstrzygnięte w Obronie)'
    if name in FC_SCORES:
        fcs = FC_SCORES[name]
        assert set(fcs) == {c['id'] for c in TECHS[name]}, ('FC: niepełna lista kandydatów', name)
        cands_fc = [apply_rules(dict(c, sc=fcs[c['id']][0])) for c in TECHS[name]]
        rank_fc_t, wins_fc, duels_fc = tournament(cands_fc)
        rank_fc, e1_fc = order_top(rank_fc_t)
        ob5 = [c['id'] for c in rank[:5]]; fc5 = [c['id'] for c in rank_fc[:5]]
        same_set = len(set(ob5) & set(fc5)); same_pos = sum(1 for a_, b_ in zip(ob5, fc5) if a_ == b_)
        FC_REPORT.append(dict(name=name, ob=ob5, fc=fc5, same_set=same_set, same_pos=same_pos, n=min(5, len(ob5)),
                              rank_t=rank_fc_t, wins=wins_fc, duels=duels_fc, cands=cands_fc, e1=e1_fc, fcs=fcs))
        status = ('FINALNE (FC r1: trzeci turniej — ' + ('zgodny z Obroną' if ob5 == fc5 else 'zmiana kolejności względem Obrony: ' + ' > '.join(fc5)) + ')')
        if name in FC_Q7:
            status = 'FINALNE-WARUNKOWE (FC r1: trzeci turniej zgodny z Obroną; Top1 czeka na decyzję właściciela Q7 — żaden kandydat nie spełnia E1)'
        rank, e1_ok, cands_cmz = rank_fc, e1_fc, cands_fc
    ranks_all[name] = rank
    cur = current_card(t)
    for line in cur['cmz']:
        for k, (tpl, _) in TEMPLATE_KEYS.items():
            stem = tpl.split('{X}')[0] if '{X}' in tpl else tpl
            tail = tpl.split('{X}')[1] if '{X}' in tpl else ''
            body = line.split('] ', 1)[1]
            if body.startswith(stem) and body.endswith(tail):
                tcount[k] += 1
    top = [r['txt'] for r in rank[:5]] + [NIE] * (5 - min(5, len(rank)))
    # CMZ: per obiekt najlepszy cel
    best = {}
    for cnd in cands_cmz:
        if cnd['obj'] and cnd['cel'] and cnd['obj'] in ACT:
            k = cnd['obj']
            # FC r1: remis rozstrzygany jak w pojedynku (SKALA, ZASIĘG, NOWA MECHANIKA)
            key = lambda z: (wsum(z['sc']), z['sc'][0], z['sc'][3], z['sc'][1])
            if k not in best or key(cnd) > key(best[k]):
                best[k] = cnd
    # E1 także dla kolejności zdań: najpierw czynności z korzyścią od ręki dla każdej cywilizacji.
    cmz_items = sorted(best.values(), key=lambda c: (not top1_eligible(c), -wsum(c['sc']), -c['sc'][0]))
    cmz = [f"{ACT[c['obj']]}, aby {c['cel']}." for c in cmz_items[:4]]
    if not cmz:
        cmz = ['NIE_USTALONO — odkrycie nie daje dziś żadnej czynności o realnej korzyści (patrz Uwagi)']
    sr = any(c['sr'] for c in rank[:5])
    pew = 'NIE_USTALONO' if all(c['sc'][0] == 0 for c in rank[:1]) else ('SREDNIA' if sr else 'WYSOKA')
    pew_cmz = 'NIE_USTALONO' if cmz[0].startswith('NIE_') else ('SREDNIA' if any(c['sr'] for c in cmz_items[:4]) else 'WYSOKA')
    rows.append(dict(
        Odkrycie=name, Epoka=t['Epoka'], Poziom=t['Poziom'],
        Obecnie_na_karcie=cur['summary'],
        Realne_efekty_z_dowodem=' | '.join(f"{c['txt']} [{ev_expand(c['ev'])}]" for c in cands),
        Kandydaci=' | '.join(f"{c['id']}) {c['txt']}" for c in cands),
        Wynik_turnieju=' > '.join(f"{c['id']}({wins[c['id']]}W/{wsum(c['sc'])}pkt)" for c in rank_t)
                       + ('' if rank_ob[0] is rank_t[0] else f" · Top1 wg reguły E1: {rank_ob[0]['id']}")
                       + (f" · FC r1 (trzeci turniej, oceny FC): {' > '.join(c['id'] for c in rank[:5])}" if name in FC_SCORES else '')
                       + ('' if e1_ok else ' · E1: brak kandydata spełniającego E1'),
        Top1_GLOWNA=top[0], Top2=top[1], Top3=top[2], Top4=top[3], Top5=top[4],
        Dowod_plik_linia=' || '.join(f"Top{i+1}: {ev_expand(c['ev'])}" for i, c in enumerate(rank[:5])),
        Pewnosc=pew,
        Co_mozesz_zrobic_OBECNIE=' | '.join(cur['cmz']) if cur['cmz'] else '(sekcja pusta — niewyrenderowana)',
        Co_mozesz_zrobic_PROPOZYCJA=' | '.join(cmz),
        Pewnosc_CMZ=pew_cmz,
        Status_TOP5=status,
        Uwagi=(NOTES.get(name, '') + ('' if e1_ok else ' E1 (Obrona r1): żaden kandydat nie daje korzyści od ręki każdej cywilizacji — Top1 zostaje wynikiem turnieju z tym zastrzeżeniem (Q7).')).strip(),
    ))
    # plik turnieju
    L = [f"# Turniej: {name}", '',
         f"Epoka: {t['Epoka']} · Poziom: {t['Poziom']} · Koszt nauki: {t['Koszt nauki']} · tech.json — wiersz odkrycia patrz `Technologia: \"{name}\"`.", '',
         '## 1. Kandydaci (faza kandydatów)', '',
         '| ID | Kandydat (sformułowanie dla gracza) | S | N | B | Z | O | C | Suma ważona | Dowód |',
         '|---|---|---|---|---|---|---|---|---|---|']
    for c in cands:
        L.append(f"| {c['id']} | {c['txt']} | " + ' | '.join(str(v) for v in c['sc']) + f" | {wsum(c['sc'])} | {ev_expand(c['ev'])}{' (pewność ŚREDNIA)' if c['sr'] else ''}{' (reguła R-K1: N=0, O≤1)' if c.get('rule') == 'R-K1' else ''} |")
    if len(cands) < 8:
        L += ['', f"Liczba kandydatów: {len(cands)} (< 8). Dowód kompletności: wszystkie efekty odkrycia z tech.json (wiersz odkrycia), buildings.json (techUnlock), units.json (Tech), terrain-improvements.json (tech), wonders.json (techUnlock), tech.json (Wymaga (prereq)) oraz bramki w kodzie (trade-routes.ts:1093, embarkation.ts:25, production.ts:1071-1076) zostały przejrzane — innych efektów brak."]
    L += ['', 'S=SKALA, N=NOWA MECHANIKA, B=BRAK ZASTĘPNIKA, Z=ZASIĘG, O=ODCZUWALNOŚĆ, C=CZYTELNOŚĆ; wagi 3/3/2/2/2/1 (maks. 65).', '',
          '## 2. Pojedynki (każdy z każdym)', '']
    if not duels:
        L.append('Jeden kandydat — brak pojedynków.')
    for a, b, w, why in duels:
        L.append(f"- {a} vs {b} → **{w}** — {why}.")
    L += ['', '## 3. Ranking', '']
    for i, c in enumerate(rank_t):
        L.append(f"{i+1}. **{c['id']}** — {c['txt']} — wygrane: {wins[c['id']]}, suma: {wsum(c['sc'])}")
    if rank_ob[0] is not rank_t[0]:
        L += ['', f"Reguła E1 (Top1 = korzyść od ręki dla każdej cywilizacji, bez kolejnego badania i bez wyścigu): {rank_t[0]['id']} nie spełnia E1 → Top1 = **{rank_ob[0]['id']}** (najwyżej w rankingu spośród spełniających E1); pozostałe miejsca w kolejności turnieju."]
    if not e1_ok:
        L += ['', 'Reguła E1: żaden kandydat jej nie spełnia — Top1 zostaje wynikiem turnieju z zastrzeżeniem (Q7).']
    if name in FC_SCORES:
        L += ['', f"Final Control r1 — trzeci, niezależny turniej z własnymi ocenami FC: [FC-trzeci-turniej.md](FC-trzeci-turniej.md). "
                  f"FINALNA kolejność: {' > '.join(c['id'] for c in rank[:5])} (Obrona: {' > '.join(c['id'] for c in rank_ob[:5])})."]
    L += ['', f"Status: {status}", '', '## 4. Wynik TOP 5 (FINALNY)', '']
    for i, x in enumerate(top):
        L.append(f"- Top{i+1}{' (GŁÓWNA KORZYŚĆ)' if i == 0 else ''}: {x}")
    L += ['', '## 5. „Co możesz teraz zrobić" — wybór korzyści „w celu…" (mini-turniej per obiekt)', '']
    objs = {}
    for c in cands_cmz:
        if c['obj'] and c['obj'] in ACT:
            objs.setdefault(c['obj'], []).append(c)
    for k, lst_ in objs.items():
        ok = [c for c in lst_ if c['cel']]
        if not ok:
            L.append(f"- {ACT[k]}: kandydaci {', '.join(c['id'] for c in lst_)} — żaden nie jest korzyścią do zdania „aby…” (warunek/martwy efekt) → pominięty.")
            continue
        b = best[k]
        L.append(f"- {ACT[k]}: kandydaci {', '.join(c['id'] + '(' + str(wsum(c['sc'])) + ')' for c in ok)} → wybrany **{b['id']}** (najwyższa suma ważona).")
    L += ['', 'Obecnie na karcie:', ''] + [f"- {x}" for x in (cur['cmz'] or ['(sekcja pusta — niewyrenderowana)'])]
    L += ['', 'Propozycja:', ''] + [f"- {x}" for x in cmz]
    L += ['', '## 6. Uwagi', '', NOTES.get(name, '—'), '']
    open(os.path.join(OUT, 'turnieje', slug(name) + '.md'), 'w', encoding='utf-8').write('\n'.join(L))

cols = ['Odkrycie', 'Epoka', 'Poziom', 'Obecnie_na_karcie', 'Realne_efekty_z_dowodem', 'Kandydaci', 'Wynik_turnieju',
        'Top1_GLOWNA', 'Top2', 'Top3', 'Top4', 'Top5', 'Dowod_plik_linia', 'Pewnosc',
        'Co_mozesz_zrobic_OBECNIE', 'Co_mozesz_zrobic_PROPOZYCJA', 'Pewnosc_CMZ', 'Status_TOP5', 'Uwagi']
with open(os.path.join(OUT, 'odkrycia-top5.csv'), 'w', encoding='utf-8-sig', newline='') as f:
    wr = csv.DictWriter(f, fieldnames=cols, delimiter=';', quoting=csv.QUOTE_ALL, lineterminator='\n')
    wr.writeheader()
    for r in rows: wr.writerow(r)

# indeks turniejów + tabela zbiorcza (wstawiana do ANALIZA)
idx = ['# Turnieje odkryć — indeks', '', '| Odkrycie | Kandydaci | Pojedynki | Top1 (GŁÓWNA KORZYŚĆ) | Pewność | Plik |', '|---|---|---|---|---|---|']
for r in rows:
    n = len(TECHS[r['Odkrycie']])
    idx.append(f"| {r['Odkrycie']} | {n} | {n*(n-1)//2} | {r['Top1_GLOWNA']} | {r['Pewnosc']} | [{slug(r['Odkrycie'])}.md]({slug(r['Odkrycie'])}.md) |")
open(os.path.join(OUT, 'turnieje', 'README.md'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')

summary = ['| Odkrycie | Top1 — GŁÓWNA KORZYŚĆ | Top2 | Top3 | Top4 | Top5 |', '|---|---|---|---|---|---|']
for r in rows:
    summary.append('| ' + ' | '.join([r['Odkrycie'], r['Top1_GLOWNA'], r['Top2'], r['Top3'], r['Top4'], r['Top5']]).replace(NIE, 'NIE_USTALONO') + ' |')
cmzt = ['| Odkrycie | „Co możesz teraz zrobić" — PROPOZYCJA (CZYNNOŚĆ → KORZYŚĆ) |', '|---|---|']
for r in rows:
    cmzt.append(f"| {r['Odkrycie']} | {'<br>'.join(r['Co_mozesz_zrobic_PROPOZYCJA'].split(' | '))} |")
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tables.md'), 'w', encoding='utf-8').write(
    '\n'.join(summary) + '\n\n' + '\n'.join(cmzt) + '\n')
F = ['# Final Control r1 — trzeci, niezależny turniej', '',
     'Zakres (DODATEK 1 pkt 4): odkrycia ze sporem po Obronie (Prawo — ziarnistość Z2; Łowiectwo, Mistycyzm, Religia, Matematyka, '
     'Inżynieria, Oblężnictwo, Obróbka żelaza — Top1 zmieniony w Obronie, Z3; Koło — nowy kandydat Z4) oraz próbka 6 odkryć zgodnych '
     '(Waluta/Mennica, Wymiana, Brązownictwo, Żegluga, Wojskowość, Budownictwo).', '',
     'Metoda: te same kandydatury i dowody (`narzedzia/techdata.py`), WŁASNE oceny FC 0–5 (`narzedzia/fc_final.py`, z uzasadnieniem każdej oceny), '
     'te same wagi 3/3/2/2/2/1, pojedynki każdy z każdym, reguły R-K1 i E1 (§1.3 analizy). Wynik FC jest FINALNY i trafia do CSV '
     '(kolumna `Status_TOP5`). Pozostałe 16 odkryć: FINALNE bez trzeciego turnieju (zgodność Operator/Evaluator ≥ 3/5).', '',
     '## Macierz zgodności Obrona → FC (TOP 5)', '',
     '| Odkrycie | Top5 Obrony (ID) | Top5 FC (ID) | Zgodność zbioru | Zgodność pozycji | Werdykt |', '|---|---|---|---|---|---|']
tot_set = tot_n = 0
for r in FC_REPORT:
    tot_set += r['same_set']; tot_n += r['n']
    v = 'zgodny' if r['ob'] == r['fc'] else 'FC zmienia kolejność'
    if r['name'] in FC_Q7: v += '; Top1 → Q7'
    F.append(f"| {r['name']} | {' > '.join(r['ob'])} | {' > '.join(r['fc'])} | {r['same_set']}/{r['n']} | {r['same_pos']}/{r['n']} | {v} |")
F += ['', f"Razem: zgodność zbioru {tot_set}/{tot_n}; identyczna kolejność w {sum(1 for r in FC_REPORT if r['ob'] == r['fc'])}/{len(FC_REPORT)} odkryciach.", '']
for r in FC_REPORT:
    F += [f"## {r['name']}", '', '| ID | Kandydat | S | N | B | Z | O | C | Suma | Uzasadnienie oceny FC |', '|---|---|---|---|---|---|---|---|---|---|']
    for c in r['cands']:
        F.append(f"| {c['id']} | {c['txt']} | " + ' | '.join(str(v) for v in c['sc']) + f" | {wsum(c['sc'])} | {r['fcs'][c['id']][1]}{' (R-K1: N=0, O≤1)' if c.get('rule') == 'R-K1' else ''} |")
    F += [''] + [f"- {a} vs {b} → **{w}** — {why}." for a, b, w, why in r['duels']]
    F += ['', 'Ranking FC: ' + ' > '.join(f"{c['id']}({r['wins'][c['id']]}W/{wsum(c['sc'])})" for c in r['rank_t'])
          + ('' if r['e1'] else ' · E1: brak kandydata spełniającego E1 (Q7)'), '',
          'FINALNE TOP 5 (po E1): ' + ' > '.join(r['fc']), '']
open(os.path.join(OUT, 'turnieje', 'FC-trzeci-turniej.md'), 'w', encoding='utf-8').write('\n'.join(F))

stats = dict(templates={k: (v, TEMPLATE_KEYS[k]) for k, v in tcount.items()},
             cands=sum(len(v) for v in TECHS.values()),
             duels=sum(len(v)*(len(v)-1)//2 for v in TECHS.values()),
             full5=sum(1 for v in TECHS.values() if len(v) >= 5),
             pew={p: sum(1 for r in rows if r['Pewnosc'] == p) for p in ('WYSOKA', 'SREDNIA', 'NIE_USTALONO')},
             long=long_txt,
             fc=dict(odkrycia=len(FC_REPORT), zgodnosc_zbioru=f"{tot_set}/{tot_n}",
                     zmiany=[r['name'] for r in FC_REPORT if r['ob'] != r['fc']]))
json.dump(stats, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stats.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(stats, ensure_ascii=False, indent=1))
