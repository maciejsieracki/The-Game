#!/usr/bin/env python3
"""R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5 r1: web drift after the pin for the part-5 symbols.

Usage: python3 -I drift-q5.py <battleScene.ts @ edb8fb56> <battleScene.ts @ origin/main>

For every symbol of part 5 (methods / arrow fields of `BattleScene`, module functions) the body
is cut by brace matching from its declaration line and compared between the two versions;
prints `SAME` / `CHANGED` (+ a unified diff of the body) / `MISSING`.
"""
import difflib
import re
import sys

SYMBOLS = [
    'clampBattleTile', 'battlePickMeshUpNormal', 'pickBattleGroundTilePlane', 'pickBattleGroundTileFromMeshes',
    'worldToScreen', 'isEditableTarget',
    '_syncRendererSize', '_canvasNdc', '_raycastFromCanvas', '_applyCamera', '_setZoomTarget', '_tickZoom',
    '_onWheel', '_onKeyZoom', '_setPanKey', '_onKeyPanDown', '_onKeyPanUp', '_clampCamTarget',
    '_tickCameraPanKeys', '_pickGroundTile', '_computeMinimapViewport', '_pickUnitAtScreen', '_onPanDown',
    '_onPanMove', '_onPanUp', '_handleDeployUnitPick', '_onDeployClick', '_doBoxSelect', '_onBattleClick',
    '_startLoop', '_refreshDeploySelectionVisuals', '_primarySelectedUnit', '_getDeploySelectedUnits',
    '_isPlayerSide', '_playerRoster', '_findUnitById', '_findPlayerUnit', 'dispose',
]


def body(src: str, name: str):
    pat = re.compile(r'^(?:  (?:private |public |protected )?(?:readonly )?|function |export function )'
                     + re.escape(name) + r'\b', re.M)
    m = pat.search(src)
    if not m:
        return None, None
    i = src.index('{', m.end())
    depth = 0
    j = i
    while True:
        c = src[j]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                break
        j += 1
    line = src.count('\n', 0, m.start()) + 1
    return src[m.start():j + 1], line


a = open(sys.argv[1], encoding='utf-8').read()
b = open(sys.argv[2], encoding='utf-8').read()
changed = 0
for s in SYMBOLS:
    ba, la = body(a, s)
    bb, lb = body(b, s)
    if ba is None or bb is None:
        print(f'MISSING  {s} (pin {la}, main {lb})')
        changed += 1
        continue
    if ba == bb:
        print(f'SAME     {s} (pin :{la}, main :{lb})')
    else:
        changed += 1
        print(f'CHANGED  {s} (pin :{la}, main :{lb})')
        for d in difflib.unified_diff(ba.split('\n'), bb.split('\n'), 'pin', 'main', lineterm='', n=1):
            print('    ' + d)
print(f'symbols={len(SYMBOLS)} changed_or_missing={changed}')
