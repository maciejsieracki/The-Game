import json, itertools, sys
W = ['Wojownik', 'miecznik']; L = ['Łucznik', 'lucznik']; K = ['Konnica', 'konnica']
HA = ['Konnica łucznicza asyryjska', 'konnica']; RE = ['Rydwan egipski', 'konnica']; JO = ['Jeździec z oszczepami', 'konnica']
worlds = {'las': {'baza': 'Las', 'las': True, 'rzeka': False}, 'wzg': {'baza': 'Wzgórza', 'las': False, 'rzeka': False},
          'gory': {'baza': 'Góry', 'las': True, 'rzeka': False}, 'rown': {'baza': 'Równina', 'las': True, 'rzeka': True}}
atks = {
    'wk': [W, W, W, K, K, L],
    'kl': [K, K, K, W, L, L, L],
}
defs = {'ha2': [W, L, HA, HA], 'ha3re': [W, L, L, HA, HA, RE], 'jo3': [W, L, JO, JO, HA]}
out = []
seed = int(sys.argv[2])
for (wn, w), (an, a), (dn, d), built in itertools.product(worlds.items(), atks.items(), defs.items(), [['mury'], ['palisada']]):
    for k in range(2):
        seed += 1
        teren = {'las': 'Las', 'wzg': 'Wzgórza', 'gory': 'Góry', 'rown': 'Równina'}[wn]
        out.append({'name': f'h_{wn}_{an}_{dn}_{built[0]}_{seed}', 'mode': 'skip', 'seed': seed, 'teren': teren, 'built': built,
                    'world': w, 'atk': a, 'def': d})
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out))
