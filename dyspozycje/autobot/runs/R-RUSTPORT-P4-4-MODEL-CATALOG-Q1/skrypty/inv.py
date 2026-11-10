"""Inwentarz 96 plików (§0.1, §1.1). Reguły R1/R2/R3 — §0.2 dokumentu P4-4.

Kolumny: plik | LOC | three | R1 | new Mesh | R2 wywołania | R2 definicje | R3 | importerzy gra/src | importerzy spoza gra/src
Uruchom: python3 -I .../skrypty/inv.py            (tabela markdown + sumy)
"""
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import show, render_files, outside_three, import_graph, sh, PIN  # noqa: E402

PRIMS = ['BoxGeometry', 'CylinderGeometry', 'ConeGeometry', 'SphereGeometry', 'TorusGeometry', 'PlaneGeometry',
         'CircleGeometry', 'RingGeometry', 'ExtrudeGeometry', 'LatheGeometry', 'ShapeGeometry', 'TubeGeometry',
         'OctahedronGeometry', 'DodecahedronGeometry', 'IcosahedronGeometry', 'BufferGeometry', 'InstancedMesh',
         'CanvasTexture', 'Sprite', 'Line', 'LineSegments', 'MeshStandardMaterial', 'MeshLambertMaterial',
         'MeshBasicMaterial', 'SpriteMaterial']
AB = {'BoxGeometry': 'Box', 'CylinderGeometry': 'Cyl', 'ConeGeometry': 'Cone', 'SphereGeometry': 'Sph',
      'TorusGeometry': 'Tor', 'PlaneGeometry': 'Pln', 'CircleGeometry': 'Circ', 'RingGeometry': 'Ring',
      'ExtrudeGeometry': 'Extr', 'LatheGeometry': 'Lathe', 'ShapeGeometry': 'Shape', 'TubeGeometry': 'Tube',
      'OctahedronGeometry': 'Oct', 'DodecahedronGeometry': 'Dod', 'IcosahedronGeometry': 'Ico',
      'BufferGeometry': 'BufG', 'InstancedMesh': 'Inst', 'CanvasTexture': 'CTex', 'Sprite': 'Spr', 'Line': 'Line',
      'LineSegments': 'LSeg', 'MeshStandardMaterial': 'MStd', 'MeshLambertMaterial': 'MLam',
      'MeshBasicMaterial': 'MBas', 'SpriteMaterial': 'SprM', 'mergeGeometries': 'merge'}
# R1 — deklaracje funkcji budujących
R1 = re.compile(r'^\s*(?:export\s+)?(?:async\s+)?function\s+(?:build|make|create)[A-Z0-9_]\w*'
                r'|^\s*(?:export\s+)?const\s+(?:build|make|create)[A-Z0-9_]\w*\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*(?::[^=]*)?=>',
                re.M)
# R2 — lokalne helpery prymitywów: (add)?(box|cyl|cone|sph|torus|lathe|prism|part)\w{0,8}( z argumentem
R2 = re.compile(r'(function\s+)?(?<![\w.])((?:add)?(?:[Bb]ox|[Cc]yl|[Cc]one|[Ss]ph|[Tt]orus|[Ll]athe|[Pp]rism|[Pp]art)\w{0,8})\((?!\s*\))')

g = import_graph()


def tools_importers(f):
    stem = f.rsplit('/', 1)[1][:-3]
    out = sh('git', 'grep', '-l', '-E', r"(from|import)\s*\(?\s*['\"][^'\"]*/" + re.escape(stem) + r"(\.ts|\.js)?['\"]",
             PIN, '--', 'gra', ':!gra/src').split()
    return len(out)


def row(f):
    s = show(f)
    loc = s.count('\n') + (0 if s.endswith('\n') or not s else 1)
    three = bool(re.search(r"from ['\"]three", s))
    r1 = len(R1.findall(s))
    mesh = len(re.findall(r'new (?:THREE\.)?Mesh\(', s))
    calls = defs = 0
    for fn, name in R2.findall(s):
        if 'Geometry' in name:
            continue
        if fn:
            defs += 1
        else:
            calls += 1
    pc = {p: len(re.findall(r'\bnew\s+(?:THREE\.)?' + p + r'\b(?!\w)', s)) for p in PRIMS}
    pc['mergeGeometries'] = len(re.findall(r'\bmergeGeometries\(', s))
    r3 = ' '.join(f'{AB[k]}{v}' for k, v in pc.items() if v) or '—'
    imp = sum(1 for x in g if f in g[x])
    return dict(f=f, loc=loc, three=three, r1=r1, mesh=mesh, r2c=calls, r2d=defs, r3=r3, imp=imp,
                tools=tools_importers(f))


if __name__ == '__main__':
    files = render_files()
    out = outside_three()
    print(f'RENDER_FILES {len(files)} OUTSIDE_THREE {len(out)}')
    rows = [row(f) for f in files + out]
    for i, r in enumerate(rows, 1):
        print(f"| {i} | `{r['f'].replace('gra/src/', '')}` | {r['loc']} | {'T' if r['three'] else '–'} | {r['r1']} | {r['mesh']} | "
              f"{r['r2c']} | {r['r2d']} | {r['r3']} | {r['imp']} | {r['tools']} |")
    print('LOC_RENDER', sum(r['loc'] for r in rows if '/render/' in r['f']),
          'LOC_OUTSIDE', sum(r['loc'] for r in rows if '/render/' not in r['f']))
    print('R2_CALLS_TOTAL', sum(r['r2c'] for r in rows), 'R2_DEFS_TOTAL', sum(r['r2d'] for r in rows))
