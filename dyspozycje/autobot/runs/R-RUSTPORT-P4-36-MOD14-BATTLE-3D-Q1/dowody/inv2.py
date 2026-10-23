"""Inventory of battle/battleScene.ts @ edb8fb56 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1).

Usage: python3 inv2.py <battleScene.ts> <out.md> <summary.txt>
Heuristic classification per symbol (top-level declaration or class member):
  three = count of `THREE.` ; obj = count of Object3D/scene-graph access ;
  dom = count of DOM/CSS access.
"""
import re
import sys
from collections import Counter, defaultdict

src = open(sys.argv[1], encoding='utf-8').read().split('\n')
top = re.compile(r'^(export\s+)?(default\s+)?(declare\s+)?(async\s+)?(function\*?|const|let|class|type|interface|enum|abstract class)\s+([A-Za-z_$][\w$]*)')
mem = re.compile(r'^  (?:(?:private|public|protected|static|readonly|async|override|get|set)\s+)*([A-Za-z_$#][\w$]*)\s*(?:<[^>]*>)?\s*\(')
RE_THREE = re.compile(r'THREE\.')
RE_OBJ = re.compile(r'\.position\.|\.rotation\.|\.scale\.|\.quaternion|\.add\(|\.remove\(|\.visible\b|\.material\b|\.geometry\b|matrixWorld|\.traverse\(|scene\b|camera\b|Mesh\b|buildUnitModel|buildSiegeWall|attachRowBreachPanels|renderer\.')
RE_DOM = re.compile(r'document\.|createElement|\.style\b|innerHTML|textContent|addEventListener|removeEventListener|classList|appendChild|HTMLElement|HTMLDivElement|HTMLCanvasElement|getContext\(|\.overlay\b|mountSiegeHud|CURSOR_')

syms = []
incls = None
first_decl = None
for i, l in enumerate(src):
    m = top.match(l)
    if m:
        if first_decl is None:
            first_decl = i + 1
        syms.append([i + 1, m.group(6), m.group(5)])
        incls = m.group(6) if 'class' in m.group(5) else None
        continue
    if incls:
        mm = mem.match(l)
        if mm and mm.group(1) not in ('if', 'for', 'while', 'switch', 'return', 'catch'):
            syms.append([i + 1, incls + '.' + mm.group(1), 'method'])

R2 = re.compile(r'battlefield|terrain|tile|ground|light|fog|sky|camera|cam\b|Cam[A-Z]|wall|siege|building|river|tree|forest|scenery|grid|deco|water|bridge|road|zoom|pan|orbit|resize', re.I)
R3 = re.compile(r'unit|place|model|hp|bar|ring|marker|select|order|highlight|banner|formation|rank|figure|avatar|label|badge|plate|emblem|vital|flag|token|ghost|preview', re.I)
R4 = re.compile(r'anim|projectile|arrow|effect|flash|blood|dust|particle|tween|shake|death|hit|blow|fx|missile|stone|spark|smoke|fire|tick|frame|update|step|move|lerp|charge|gate|breach|fly|trail|floater|float|damageNum|pop', re.I)
R5 = re.compile(r'pick|raycast|mouse|hover|pointer|cursor|click|drag|screen|world|project', re.I)


def classify(three, obj, dom):
    is3d = three > 0 or obj >= 3
    if is3d and dom == 0:
        return '3D'
    if is3d and dom > 0:
        return 'MIX'
    if dom > 0:
        return 'UI'
    return 'LOG'


def round_of(name):
    for r, rx in (('R5', R5), ('R4', R4), ('R3', R3), ('R2', R2)):
        if rx.search(name):
            return r
    return 'R2'


rows = []
for k, (ln, name, kind) in enumerate(syms):
    end = (syms[k + 1][0] - 1) if k + 1 < len(syms) else len(src)
    body = '\n'.join(src[ln - 1:end])
    three = len(RE_THREE.findall(body))
    obj = len(RE_OBJ.findall(body))
    dom = len(RE_DOM.findall(body))
    cat = classify(three, obj, dom)
    if kind in ('type', 'interface'):
        cat = 'TYPE'
    if cat in ('3D', 'MIX'):
        r = round_of(name.split('.')[-1])
        status = f'RUNDA-{r[1]}' + (' (tylko część 3D)' if cat == 'MIX' else '')
    elif cat == 'UI':
        status = 'NIE-DOTYCZY → P5 (UI DOM)'
    elif cat == 'TYPE':
        status = 'NIE-DOTYCZY (typ TS; DTO wg potrzeb rund 2–5)'
    else:
        status = 'NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika) — heurystyka, weryfikacja w rundzie 2'
    rows.append(dict(line=ln, end=end, loc=end - ln + 1, name=name, kind=kind,
                     three=three, obj=obj, dom=dom, cat=cat, status=status))

pre = first_decl - 1
tot = Counter()
cnt = Counter()
for r in rows:
    tot[r['cat']] += r['loc']
    cnt[r['cat']] += 1
by_round = defaultdict(int)
for r in rows:
    if r['cat'] in ('3D', 'MIX'):
        by_round[r['status'].split(' ')[0]] += r['loc']

with open(sys.argv[2], 'w', encoding='utf-8') as f:
    f.write('# Inwentarz `gra/src/battle/battleScene.ts` @ `edb8fb56` (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1)\n\n')
    f.write('Wygenerowane skryptem `inv2.py` (treść skryptu: dokument P4-36 §3.1). Klasyfikacja HEURYSTYCZNA (liczniki wzorców w ciele symbolu):\n')
    f.write('`three` = wystąpienia `THREE.`, `obj` = dostęp do grafu sceny (`.position.`, `.add(`, `scene`, `camera`, `Mesh`, `buildUnitModel`, …), `dom` = DOM/CSS (`document.`, `.style`, `createElement`, `addEventListener`, …).\n')
    f.write('Kategorie: **3D** (three>0 lub obj≥3, dom=0), **MIX** (3D i DOM), **UI** (tylko DOM), **LOG** (brak obu), **TYPE** (typ/interfejs).\n')
    f.write('Status: `PORTOWANY (3D)` / `NIE-DOTYCZY` (dokąd należy) / `RUNDA-n` (planowana runda tego tematu). Przypisanie rundy wg słów kluczowych nazwy — do korekty przez rundę, która symbol przejmuje.\n\n')
    f.write(f'Linie 1–{pre}: importy i stałe modułu przed pierwszą deklaracją objętą tabelą — NIE_ZMIERZONO per symbol (stałe są przenoszone razem z symbolem, który ich używa).\n\n')
    f.write('| # | linie | LOC | symbol | rodzaj | three | obj | dom | kat. | status |\n|---|---|---|---|---|---|---|---|---|---|\n')
    for i, r in enumerate(rows, 1):
        f.write(f"| {i} | {r['line']}–{r['end']} | {r['loc']} | `{r['name']}` | {r['kind']} | {r['three']} | {r['obj']} | {r['dom']} | {r['cat']} | {r['status']} |\n")

with open(sys.argv[3], 'w', encoding='utf-8') as f:
    f.write(f'file_lines {len(src)} pre_first_decl {pre} symbols {len(rows)}\n')
    for c in ('3D', 'MIX', 'UI', 'LOG', 'TYPE'):
        f.write(f'{c} symbols {cnt[c]} loc {tot[c]}\n')
    for r in sorted(by_round):
        f.write(f'{r} loc {by_round[r]}\n')
print(open(sys.argv[3]).read())
