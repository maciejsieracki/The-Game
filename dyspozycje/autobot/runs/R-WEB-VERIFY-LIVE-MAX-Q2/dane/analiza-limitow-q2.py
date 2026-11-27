# R-WEB-VERIFY-LIVE-MAX-Q2: analiza limitu wojen i sojuszy AI<->AI z jsonl (tylko odczyt).
# Uzycie: python3 -I analiza-limitow-q2.py <plik.jsonl>
import json, sys, collections
path = sys.argv[1]
rows = [json.loads(l) for l in open(path, encoding='utf-8') if l.strip()]
turns = [r['turn'] for r in rows]
max_war_total = {}
max_war_type = collections.Counter()
player_viol = 0
max_ally_ai = 0
ally_series = []
max_wars_pairs = 0
player_war_turns = 0
for r in rows:
    d = r.get('diplo', {})
    pairs = d.get('pairs', [])
    gracz = d.get('gracz')
    per_civ_total = collections.Counter()
    per_civ_type = collections.defaultdict(collections.Counter)
    wars_now = 0
    for p in pairs:
        if p.get('status') == 'wojna':
            wars_now += 1
            for c in (p['a'], p['b']):
                per_civ_total[c] += 1
                per_civ_type[c][p.get('typWojny')] += 1
    max_wars_pairs = max(max_wars_pairs, wars_now)
    for c, n in per_civ_total.items():
        max_war_total[c] = max(max_war_total.get(c, 0), n)
    for c, cnt in per_civ_type.items():
        for t, n in cnt.items():
            key = (c == gracz, t)
            max_war_type[key] = max(max_war_type[key], n)
    if gracz is not None and per_civ_total.get(gracz, 0) > 0:
        player_war_turns += 1
        if any(n > 1 for n in per_civ_type[gracz].values()):
            player_viol += 1
    ally = sum(1 for p in pairs if p.get('aiAi') and (p.get('pokoj') == 'sojusz' or p.get('status') == 'sojusz'))
    ally_series.append((r['turn'], ally, (r.get('liczniki') or {}).get('sojuszeAiAi') or 0))
    max_ally_ai = max(max_ally_ai, ally)
print('wiersze', len(rows), 'tury', min(turns), '-', max(turns))
print('max par w wojnie naraz (cala gra)', max_wars_pairs)
print('max wojen jednej cywilizacji (wszystkie typy)', max(max_war_total.values()) if max_war_total else 0)
print('max wojen gracza wg typu', {t: max_war_type[(True, t)] for t in ('naturalna', 'epoki')})
print('max wojen AI wg typu', {t: max_war_type[(False, t)] for t in ('naturalna', 'epoki')})
print('tury z wojna gracza', player_war_turns, 'tury naruszenia (>1 tego samego typu)', player_viol)
print('max sojuszy AI<->AI naraz (z pairs)', max_ally_ai, '| licznik sojuszeAiAi max', max(x[2] for x in ally_series))
print('tury z sojuszem AI<->AI', sum(1 for x in ally_series if x[1] > 0), '| tury z >2 sojuszami', sum(1 for x in ally_series if x[1] > 2))
print('ostatni licznik zerwan', (rows[-1].get('liczniki') or {}).get('zerwaniaZeroZaufania'))
# Limit 2 dotyczy sojuszy NA CYWILIZACJE (nie globalnie): licznik per cywilizacja w kazdej turze.
max_ally_civ = 0
max_ally_civ_turn = None
viol_civ_turns = []
for r in rows:
    cnt = collections.Counter()
    for p in r.get('diplo', {}).get('pairs', []):
        if p.get('aiAi') and (p.get('pokoj') == 'sojusz' or p.get('status') == 'sojusz'):
            cnt[p['a']] += 1
            cnt[p['b']] += 1
    m = max(cnt.values()) if cnt else 0
    if m > max_ally_civ:
        max_ally_civ, max_ally_civ_turn = m, r['turn']
    if m > 2:
        viol_civ_turns.append(r['turn'])
print('max sojuszy AI na jedna cywilizacje', max_ally_civ, 'w turze', max_ally_civ_turn, '| tury z >2 na cywilizacje', len(viol_civ_turns))
