"""Pomiary pomocnicze: getGeo (definicje vs wywołania), struktura units.ts (opakowania vs geometria),
pokrycie cudów/ulepszeń/budynków, warianty tarasów, rAF w render/**.
Uruchom: python3 -I .../skrypty/extra.py
"""
import json
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import PIN, sh, show  # noqa: E402

U = show('gra/src/render/units.ts')
L = U.split('\n')

# --- getGeo ---------------------------------------------------------------
all_tok = len(re.findall(r'\bgetGeo\w+\(', U))
defs = len(re.findall(r'^function getGeo\w+\(', U, re.M))
print(f'GETGEO units.ts: tokeny {all_tok} = definicje {defs} + wywołania {all_tok - defs}')
K = show('gra/src/render/kon-nowy-model.ts')
kt = len(re.findall(r'\bgetGeo\w+\(', K))
kd = len(re.findall(r'^function getGeo\w+\(', K, re.M))
print(f'GETGEO kon-nowy-model.ts: tokeny {kt} = definicje {kd} + wywołania {kt - kd}')

# --- units.ts: opakowania vs geometria (ufn) ------------------------------
starts = [(i, re.search(r'function (\w+)', l).group(1)) for i, l in enumerate(L) if re.match(r'^(export )?function \w+', l)]
starts.append((len(L), 'END'))
wr, full = [], []
for (i, n), (j, _) in zip(starts, starts[1:]):
    if not n.startswith('build'):
        continue
    k = i
    while k < j and L[k] != '}':
        k += 1
    code = [b for b in L[i:k + 1] if b.strip() and not b.strip().startswith(('//', '*', '/*'))]
    (wr if len(code) <= 6 else full).append(f'{n}:{i + 1}')
print('UNITS_BUILD_FUNCS', len(wr) + len(full), 'WRAPPERS(<=6 linii kodu)', len(wr), 'FULL', len(full))
print('  FULL:', ', '.join(full))

# --- cuda / ulepszenia / budynki -----------------------------------------
w = json.loads(show('gra/data/wonders.json'))
ids = [c['id'] for c in w['cuda']]
wm = show('gra/src/render/wonderModels.ts')
cases = re.findall(r"case '([^']+)':", wm)
print('WONDERS cuda', len(ids), 'cases', len(cases), 'missing', [i for i in ids if i not in cases],
      'extra', [c for c in cases if c not in ids], 'parkowane', len(w.get('parkowane_epoka4plus') or []),
      'panstwa', len(w.get('panstwa') or []))
ti = json.loads(show('gra/data/terrain-improvements.json'))
keys = [k for k in ti if not k.startswith('_')]
rimp = show('gra/src/render/robloxImprovements.ts')
m = re.search(r'const BUILDERS[^{]*\{(.*?)\n\};', rimp, re.S)
bkeys = re.findall(r'^\s*(\w+)\s*:', m.group(1), re.M) if m else []
print('IMPROVEMENTS json', len(keys), 'BUILDERS', len(bkeys), 'json-bez-BUILDERS', [k for k in keys if k not in bkeys],
      'BUILDERS-bez-json', [k for k in bkeys if k not in keys])
imp = show('gra/src/render/improvements.ts')
print('IMPROVEMENTS improvements.ts case', len(re.findall(r"case '([^']+)':", imp)))
b = json.loads(show('gra/data/buildings.json'))
hits = {}
for bid in [x['id'] for x in b]:
    out = sh('git', 'grep', '-l', '-w', "'" + bid + "'", PIN, '--', 'gra/src/render').split()
    if out:
        hits[bid] = len(out)
print('BUILDINGS', len(b), 'ids cytowane w render/**', hits)

# --- tarasy ---------------------------------------------------------------
t = show('gra/src/render/tarasy-model.ts')
sig = re.search(r'export function tarasyWariantDlaHeksa\([^)]*\):\s*([^{]+)\{', t).group(1).strip()
print('TARASY tarasyWariantDlaHeksa ->', sig, '=> warianty', len(sig.split('|')))

# --- requestAnimationFrame w render/** ------------------------------------
print('RAF render/**:', sh('git', 'grep', '-n', 'requestAnimationFrame', PIN, '--', 'gra/src/render').strip())
