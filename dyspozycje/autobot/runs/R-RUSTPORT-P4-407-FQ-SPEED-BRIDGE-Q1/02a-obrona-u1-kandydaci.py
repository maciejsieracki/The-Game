import json, sys
# U1 (obrona r1, R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1): kandydaci c1 w czasie rzeczywistym ze zmiana predkosci
# W TRAKCIE bitwy (`speedAt`), takze z predkosci startowej != 1 (`speedMul`) i w dol (64 -> 1).
c1 = json.load(open(sys.argv[1]))
pairs = [(None, 4), (None, 64), (64, 1), (4, 512), (None, 2), (8, 32)]
out = []
for i, sc in enumerate(c1[::4]):  # 32 scenariusze
    init, k = pairs[i % len(pairs)]
    rnd = 2 + (i * 3) % 12
    v = dict(sc, mode='realtime', name=sc['name'] + f'_sa{init or 1}to{k}_r{rnd}',
             speedAt={'round': rnd, 'speedMul': k})
    if init:
        v['speedMul'] = init
    out.append(v)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(out))
