import json, statistics as st, sys
S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad'
def turns(f):
    return {e['turn']: e['ms'] for e in map(json.loads, open(f)) if e.get('ev') == 'turn'}
on = turns(S + '/out/fix-on/seed4242.jsonl'); off = turns(S + '/out/fix-off/seed4242.jsonl')
common = sorted(set(on) & set(off))
a = [on[t] for t in common]; b = [off[t] for t in common]
print(len(common), 'mean on', round(st.mean(a)), 'off', round(st.mean(b)), 'median on', st.median(a), 'off', st.median(b),
      'pct mean', round((st.mean(a) - st.mean(b)) / st.mean(b) * 100, 2), 'pct median', round((st.median(a) - st.median(b)) / st.median(b) * 100, 2))
print('sum s on', sum(a) / 1000, 'off', sum(b) / 1000)
for t in (54, 55, 56, 57, 58, 59, 60):
    print(t, on.get(t), off.get(t))
print('max on', max(a), 'off', max(b))
