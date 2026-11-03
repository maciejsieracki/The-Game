#!/usr/bin/env python3
"""Mutanty WEBOWE topUpPangeaLandFraction (runda 2): czy wektory graniczne `topup_bound.json` rozrozniaja
T07/T09/T16 w samym webie (dowod, ze scenariusze sa dyskryminujace). Uzycie: webmut2.py <SP> <TOOLS> <WEB_ROOT>
(WEB_ROOT = rozpakowany `git archive 23dd158e9 gra/src gra/data`; <SP>/r2out = wynik generatora na czystym webie)."""
import json, shutil, subprocess, sys
SP, TOOLS, WEB = sys.argv[1], sys.argv[2], sys.argv[3]
G = 'gra/src/map/gen-helpers.ts'
MUT = {
    'T07': ("if (targetLand - land > deficitThreshold) {", "if (targetLand - land >= deficitThreshold) {"),
    'T09': ("for (const minNb of [2, 1]) {", "for (const minNb of [2]) {"),
    'T16': ("      if (r < buf || r >= height - buf) continue;\n      if (countLandNeighbors(hexes, q, r) < minLandNeighbors) continue;",
            "      if (r < buf) continue;\n      if (countLandNeighbors(hexes, q, r) < minLandNeighbors) continue;"),
    'T16b': ("          if (r < buf || r >= height - buf) continue;\n          if (countLandNeighbors(hexes, q, r) < minNb) continue;",
             "          if (r < buf) continue;\n          if (countLandNeighbors(hexes, q, r) < minNb) continue;"),
    'T16c': ("          if (r < buf || r >= height - buf) continue;\n          if ((ringLand.get(d)",
             "          if (r < buf) continue;\n          if ((ringLand.get(d)"),
}
sel = sys.argv[4].split(',') if len(sys.argv) > 4 else list(MUT)
base = json.load(open(f'{SP}/r2out/topup_bound.json'))['cases']
b0 = json.load(open(f'{SP}/r2out/topup.json'))['cases']
for m in sel:
    a, b = MUT[m]
    d = f'{SP}/r2web_{m}'
    shutil.rmtree(d, ignore_errors=True)
    shutil.copytree(WEB, d)
    f = f'{d}/{G}'
    s = open(f).read()
    assert s.count(a) == 1, (m, s.count(a))
    open(f, 'w').write(s.replace(a, b))
    subprocess.run(['node', '--experimental-transform-types', '--no-warnings', '--import', './repin-b-loader-register.mjs',
                    './gen-repin4-vectors.mjs', d, f'{SP}/r2out_{m}'], cwd=TOOLS, capture_output=True, text=True)
    mut = json.load(open(f'{SP}/r2out_{m}/topup_bound.json'))['cases']
    diff = [x['tag'] for x, y in zip(base, mut) if (x['outT'], x['added']) != (y['outT'], y['added'])]
    m0 = json.load(open(f'{SP}/r2out_{m}/topup.json'))['cases']
    d0 = sum(1 for x, y in zip(b0, m0) if (x['outT'], x['added']) != (y['outT'], y['added']))
    print(m, 'bound roznic', len(diff), '/', len(base), diff[:4], '| glowny zestaw roznic', d0, flush=True)
