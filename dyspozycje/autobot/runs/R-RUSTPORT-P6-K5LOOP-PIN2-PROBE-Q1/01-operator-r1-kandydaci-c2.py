import json, itertools, sys
W = ['Wojownik', 'miecznik']; L = ['Łucznik', 'lucznik']; S = ['Włócznik', 'wlocznik']; K = ['Konnica', 'konnica']
worlds = {'las': {'baza': 'Las', 'las': True, 'rzeka': False}, 'wzg': {'baza': 'Wzgórza', 'las': False, 'rzeka': False},
          'gory': {'baza': 'Góry', 'las': True, 'rzeka': False}, 'rown': {'baza': 'Równina', 'las': True, 'rzeka': True}}
atks = {
    'lk': [L, L, L, L, L, W, K, K],
    'lw': [L, L, L, L, L, L, W, W, W],
    'kk': [K, K, K, L, L, L, L],
}
defs = {'d9l': [W, L, L, L, L, L, L, L, L, L], 'd7l': [S, W, L, L, L, L, L, L, L], 'd12l': [W, W] + [L] * 10}
out = []
seed = int(sys.argv[2])
for (wn, w), (an, a), (dn, d), built in itertools.product(worlds.items(), atks.items(), defs.items(), [['mury'], ['palisada']]):
    seed += 1
    teren = {'las': 'Las', 'wzg': 'Wzgórza', 'gory': 'Góry', 'rown': 'Równina'}[wn]
    out.append({'name': f'm_{wn}_{an}_{dn}_{built[0]}_{seed}', 'mode': 'skip', 'seed': seed, 'teren': teren, 'built': built,
                'world': w, 'atk': a, 'def': d})
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out))
