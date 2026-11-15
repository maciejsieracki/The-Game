"""Porownanie czasu tury ON vs OFF z dwoch plikow jsonl (zdarzenia ev='turn', pole ms).

Uzycie (bez zewnetrznych sciezek; pliki podawane jawnie):
  python3 -I cmp.py <plik-ON.jsonl> <plik-OFF.jsonl>
Przyklad (para rownolegla 100 tur z r3, katalog evidence/endturn-gate-diag):
  python3 -I cmp.py ../endturn-gate-diag/fix-on-seed4242.jsonl ../endturn-gate-diag/fix-off-seed4242.jsonl
"""
import json
import statistics as st
import sys

if len(sys.argv) != 3:
    sys.exit('usage: cmp.py <on.jsonl> <off.jsonl>')


def turns(path):
    with open(path, encoding='utf-8') as fh:
        return {e['turn']: e['ms'] for e in map(json.loads, fh) if e.get('ev') == 'turn'}


on = turns(sys.argv[1])
off = turns(sys.argv[2])
common = sorted(set(on) & set(off))
a = [on[t] for t in common]
b = [off[t] for t in common]
print(len(common), 'mean on', round(st.mean(a)), 'off', round(st.mean(b)), 'median on', st.median(a), 'off', st.median(b),
      'pct mean', round((st.mean(a) - st.mean(b)) / st.mean(b) * 100, 2),
      'pct median', round((st.median(a) - st.median(b)) / st.median(b) * 100, 2))
print('sum s on', sum(a) / 1000, 'off', sum(b) / 1000)
for t in (54, 55, 56, 57, 58, 59, 60):
    print(t, on.get(t), off.get(t))
print('max on', max(a), 'off', max(b))
