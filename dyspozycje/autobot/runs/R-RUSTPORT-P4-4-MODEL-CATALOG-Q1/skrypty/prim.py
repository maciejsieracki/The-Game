"""§1.2: sumy prymitywów Three.js przez `git grep -c -E` (linie i pliki) na pinie.
Uruchom: python3 -I .../skrypty/prim.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import PIN, sh  # noqa: E402

P = ['BoxGeometry', 'CylinderGeometry', 'ConeGeometry', 'SphereGeometry', 'TorusGeometry', 'PlaneGeometry',
     'CircleGeometry', 'RingGeometry', 'ExtrudeGeometry', 'LatheGeometry', 'ShapeGeometry', 'TubeGeometry',
     'OctahedronGeometry', 'DodecahedronGeometry', 'IcosahedronGeometry', 'BufferGeometry', 'InstancedMesh',
     'CanvasTexture', 'Sprite', 'SpriteMaterial', 'Line', 'LineSegments', 'MeshStandardMaterial',
     'MeshLambertMaterial', 'MeshBasicMaterial', 'ShaderMaterial', 'Mesh']
OUT = ['gra/src/battle', 'gra/src/input/picker.ts', 'gra/src/main.ts', 'gra/src/ui/perfTestPanel.ts',
       'gra/src/ui/unitMiniPreview.ts', 'gra/src/wonderpreview/main.ts']


def cnt(pat, paths):
    o = sh('git', 'grep', '-c', '-E', pat, PIN, '--', *paths).split()
    return sum(int(x.rsplit(':', 1)[1]) for x in o), len(o)


print('| Prymityw | wzorzec `-E` | `render/**` linie (pliki) | 8 plików poza `render/` linie (pliki) |')
for p in P:
    pat = r'new (THREE\.)?' + p + r'\('
    a, af = cnt(pat, ['gra/src/render'])
    b, bf = cnt(pat, OUT)
    print(f'| {p} | `{pat}` | {a} ({af}) | {b} ({bf}) |')
for name, pat in [('mergeGeometries', r'mergeGeometries\('), ('import three/examples', 'from .three/examples'),
                  ('requestAnimationFrame', 'requestAnimationFrame')]:
    a, af = cnt(pat, ['gra/src/render'])
    b, bf = cnt(pat, OUT)
    print(f'| {name} | `{pat}` | {a} ({af}) | {b} ({bf}) |')
