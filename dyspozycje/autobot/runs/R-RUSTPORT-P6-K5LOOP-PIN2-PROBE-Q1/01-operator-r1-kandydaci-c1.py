import json, itertools, sys
W = ['Wojownik', 'miecznik']; L = ['Łucznik', 'lucznik']; S = ['Włócznik', 'wlocznik']; K = ['Konnica', 'konnica']
T = ['Taran', 'obleznicza']; C = ['Katapulta', 'obleznicza']; F = ['Falanga', 'falanga']
worlds = {'las': {'baza': 'Las', 'las': True, 'rzeka': False}, 'wzg': {'baza': 'Wzgórza', 'las': False, 'rzeka': False},
          'gory': {'baza': 'Góry', 'las': False, 'rzeka': False}, 'rown': {'baza': 'Równina', 'las': True, 'rzeka': False}}
atks = {
    'lucz': [W, W, L, L, L, C],
    'jazda': [K, K, W, L, L, C, T],
    'mix': [W, W, W, K, L, L, T],
    'lucz2': [L, L, L, L, W, W, T],
}
defs = {'d3l': [W, L, L, L], 'd6l': [W, S, L, L, L, L, L, L], 'd8l': [W, W, L, L, L, L, L, L, L, L], 'd5': [S, W, L, L, L]}
out = []
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 100
for (wn, w), (an, a), (dn, d), built in itertools.product(worlds.items(), atks.items(), defs.items(), [['mury', 'baszta'], ['palisada']]):
    seed += 1
    teren = {'las': 'Las', 'wzg': 'Wzgórza', 'gory': 'Góry', 'rown': 'Równina'}[wn]
    out.append({'name': f'k_{wn}_{an}_{dn}_{built[0]}_{seed}', 'mode': 'skip', 'seed': seed, 'teren': teren, 'built': built,
                'world': w, 'atk': a, 'def': d})
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out))
