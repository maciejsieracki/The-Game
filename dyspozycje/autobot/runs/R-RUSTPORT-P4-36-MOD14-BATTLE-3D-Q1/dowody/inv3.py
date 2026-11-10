"""Inventory of battle/battleScene.ts @ edb8fb56, round 2 (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1).

Usage: python3 -I inv3.py <battleScene.ts> <out.md> <summary.txt>

Round 1 (`inv2.py`) classified a symbol only by patterns in its own body
(`THREE.`, scene-graph access, DOM access); every symbol with none of them fell
into "LOG -> P6.13 domain/combat.rs" (529 symbols, 8 479 LOC). Evaluator r1
(objection 3) showed that this put camera control (`_tickCameraPanKeys`),
battlefield terrain (`_carveBattleBox`), the order preview (`_updateOrderPreview`),
UI (`_unitTooltipHtml`, `HUD_*`) and the field geometry (`BF_ROWS`, `PLAY_*`)
into combat.rs. Round 2 adds three deterministic passes and a target for EVERY
symbol (status = where it goes):

  A. class-field typing: every `BattleScene` field declared at class level is
     tagged 3D (type/initialiser has `THREE.` or a THREE-carrying interface),
     DOM (`HTML*Element`, DOM events), AUDIO (WebAudio types / audio fields),
     CAM (camera state: `cam*`, `pan*`, `_camPanKeys`, `camera`); a method that
     reads/writes such a field through `this.<field>` is classified by it
     (direct dependency);
  B. call graph (`this.<method>(`), iterated to a fixpoint: a method that has
     no direct dependency but calls 3D / camera / UI methods is a SPLIT symbol
     (logic part -> P6.13, scene calls -> the round of its callees' part);
  C. module-level constants and helper functions are classified by their USERS
     (every symbol whose body references the identifier): used only by scene
     symbols -> that round; by scene AND logic -> SHARED (domain constant, the
     scene consumes it; the Rust scene keeps a copy checked for equality);
     only by UI -> P5; only by logic -> P6.13;
  D. explicit overrides (`OVERRIDES`) for symbols whose target is not derivable
     mechanically, each with a reason (incl. all symbols named by Evaluator r1).

Rounds (P4-36 doc, §4): R2 static field (terrain, ground, walls, light, fog,
scenery), R3 units + overlays (models, HP bars, rings, order/ghost preview),
R4 dynamics + effects (animation, projectiles, floaters, gate/breach), R5
picking + camera.
"""
import re
import sys
from collections import Counter, defaultdict

src = open(sys.argv[1], encoding='utf-8').read().split('\n')
top = re.compile(r'^(export\s+)?(default\s+)?(declare\s+)?(async\s+)?(function\*?|const|let|class|type|interface|enum|abstract class)\s+([A-Za-z_$][\w$]*)')
mem = re.compile(r'^  (?:(?:private|public|protected|static|readonly|async|override|get|set)\s+)*([A-Za-z_$#][\w$]*)\s*(?:<[^>]*>)?\s*\(')
fld = re.compile(r'^  (?:(?:private|public|protected|static|readonly|declare)\s+)*([A-Za-z_$#][\w$]*)[?!]?\s*(:|=)(.*)$')
RE_THREE = re.compile(r'THREE\.')
RE_OBJ = re.compile(r'\.position\.|\.rotation\.|\.scale\.|\.quaternion|\.add\(|\.remove\(|\.visible\b|\.material\b|\.geometry\b|matrixWorld|\.traverse\(|scene\b|camera\b|Mesh\b|buildUnitModel|buildSiegeWall|attachRowBreachPanels|renderer\.')
RE_DOM = re.compile(r'document\.|createElement|\.style\b|innerHTML|textContent|addEventListener|removeEventListener|classList|appendChild|HTMLElement|HTMLDivElement|HTMLCanvasElement|getContext\(|\.overlay\b|mountSiegeHud|CURSOR_')

# ------------------------------------------------------------ symbols (as inv2.py)
syms = []
incls = None
first_decl = None
class_fields = {}   # name -> (line, declaration text)
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
            continue
        mf = fld.match(l)
        if incls == 'BattleScene' and mf:
            class_fields[mf.group(1)] = (i + 1, l.strip())

R2 = re.compile(r'battlefield|terrain|tile|ground|light|fog|sky|wall|siege|building|river|tree|forest|scenery|grid|deco|water|bridge|road|carve|fence|floor|field', re.I)
R3 = re.compile(r'unit|place|model|hp|bar|ring|marker|select|order|highlight|banner|formation|rank|figure|avatar|label|badge|plate|emblem|vital|flag|token|ghost|preview|deploy', re.I)
R4 = re.compile(r'anim|projectile|arrow|effect|flash|blood|dust|particle|tween|shake|death|hit|blow|fx|missile|stone|spark|smoke|fire|tick|frame|update|step|move|lerp|charge|gate|breach|fly|trail|floater|float|damageNum|pop|fade|clash', re.I)
R5 = re.compile(r'pick|raycast|mouse|hover|pointer|cursor|click|drag|screen|world|project|cam|camera|zoom|pan\b|Pan[A-Z]|orbit|resize', re.I)


def round_of(name):
    for r, rx in (('R5', R5), ('R2', R2), ('R3', R3), ('R4', R4)):
        if rx.search(name):
            return r
    return 'R2'


def classify(three, obj, dom):
    is3d = three > 0 or obj >= 3
    if is3d and dom == 0:
        return '3D'
    if is3d and dom > 0:
        return 'MIX'
    if dom > 0:
        return 'UI'
    return 'LOG'


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
    rows.append(dict(line=ln, end=end, loc=end - ln + 1, name=name, kind=kind, body=body,
                     three=three, obj=obj, dom=dom, cat=cat))
byname = {r['name']: r for r in rows}

# ------------------------------------------------------------ A. field typing
# Only `FloatLabel` (DOM label + THREE world anchor) counts as a scene type: `RuntimeBattleUnit` also carries
# THREE references (its mesh) but is the battle STATE container (`atk`, `def`, `occByKey`, `turnOrder`);
# tagging those fields as 3D would drag every rules method into the scene (measured in round 2: pure logic
# fell to 1.3 k LOC). Mesh access through a unit (`u.mesh.position…`) is still caught by the r1 `obj` counter.
three_types = {'FloatLabel'}
RE_AUDIO_T = re.compile(r'AudioContext|GainNode|OscillatorNode|AudioBuffer|AudioNode|BiquadFilter')
RE_AUDIO_N = re.compile(r'^_(ac|acTried|masterGain|amb\w*|audio\w*|sfx\w*|music\w*|lastHitAt|lastShotAt)$')
RE_CAM_N = re.compile(r'^(camera|cam[A-Z]\w*|_cam[A-Z]\w*|camDist\w*|pan(ning|Last[XY])|_camPanKeys)$')
RE_DOM_T = re.compile(r'HTML\w*Element|MouseEvent|KeyboardEvent|PointerEvent|WheelEvent|document\.')
field_cat = {}
for fname, (fl, decl) in class_fields.items():
    rhs = decl.split(':', 1)[-1] if ':' in decl else decl
    if RE_AUDIO_T.search(decl) or RE_AUDIO_N.match(fname):
        field_cat[fname] = 'AUDIO'
    elif RE_CAM_N.match(fname):
        field_cat[fname] = 'CAM'
    elif RE_THREE.search(decl) or any(re.search(r'\b' + t + r'\b', decl) for t in three_types):
        field_cat[fname] = '3D'
    elif RE_DOM_T.search(decl):
        field_cat[fname] = 'DOM'
# Canvas: the WebGL surface; its size feeds camera / picking maths, not UI.
if 'canvas' in field_cat:
    field_cat['canvas'] = 'CAM'

RE_THIS = re.compile(r'this\.(#?[A-Za-z_$][\w$]*)(\s*\()?')
methods = {r['name'].split('.', 1)[1]: r for r in rows if r['kind'] == 'method'}
for r in rows:
    acc = Counter()
    calls = set()
    for m in RE_THIS.finditer(r['body']):
        n = m.group(1)
        if m.group(2) and n in methods:
            calls.add(n)
        elif n in field_cat:
            acc[field_cat[n]] += 1
    r['acc'] = acc
    r['calls'] = calls

# ------------------------------------------------------------ D. overrides (reason in the table)
OVERRIDES = {
    # Evaluator r1, objection 3 (each checked by reading the body @edb8fb56):
    'BattleScene._tickCameraPanKeys': ('R5', 'kamera: `camTarget`/`camDist` + `_applyCamera()` (`battleScene.ts:9953-9969`)'),
    'BattleScene._setPanKey': ('R5', 'kamera: stan klawiszy panoramy `_camPanKeys`'),
    'BattleScene._tickZoom': ('R5', 'kamera: interpolacja `camDist` → `camDistTarget`'),
    'BattleScene._carveBattleBox': ('SHARED-R2', 'generacja mapy terenu pola bitwy (`terrainMap.tiles`, `battleScene.ts:3740-3826`): dane terenu wspólne — przejezdność dla P6.13, wygląd pola dla RUNDY-2; port do generatora pola (P6.13) + scena konsumuje wynikową mapę jako DTO; jeśli P6.13 nie przejmie, port w RUNDZIE-2 (ZAŁOŻENIE Z-36-3)'),
    'BattleScene._fencePlayableZone': ('SHARED-R2', 'jak `_carveBattleBox`: kształtuje `terrainMap.tiles` (margines nieprzejezdny = pole widoczne poza strefą gry)'),
    'BattleScene._updateOrderPreview': ('R3', 'podgląd rozkazu (nakładka 3D: `_clearOrderPreview`, `_pickUnitAtScreen`, `_pickGroundTile`, duchy jednostek; `battleScene.ts:10683`)'),
    'BattleScene._updateDeployPlacementPreview': ('R3', 'podgląd rozstawienia (duchy jednostek, strefa)'),
    'BattleScene._refreshQueuedOrderVisuals': ('R3', 'nakładka rozkazów w kolejce'),
    'BattleScene._refreshDeploySelectionVisuals': ('R3', 'wizualizacja zaznaczenia w rozstawieniu'),
    'BattleScene._unitTooltipHtml': ('P5', 'UI: HTML dymka jednostki (łańcuch HTML, brak sceny)'),
    'BattleScene._buildGeneralPanelBodyHtml': ('P5', 'UI: HTML panelu generała'),
    'BattleScene._buildEndDetailsSide': ('P5', 'UI: ekran końca bitwy'),
    'BattleScene._buildBattleSummaryData': ('P5', 'UI: dane podsumowania dla ekranu końca (DTO z logiki, wyświetlanie w P5)'),
    'BattleScene._collectMinimapData': ('P5', 'UI: minimapa (canvas 2D w DOM, poza sceną 3D)'),
    'BattleScene._sideDisplayLabel': ('P5', 'UI: etykieta strony'),
    'BattleScene._teardownDeployUI': ('P5', 'UI: demontaż paneli rozstawienia'),
    'BattleScene._updateSiegeHud': ('P5', 'UI: HUD oblężenia'),
    'BattleScene._syncSiegeHudLayout': ('P5', 'UI: układ HUD oblężenia'),
    'BattleScene._syncDeployPanelLayout': ('P5', 'UI: układ paneli rozstawienia'),
    'BattleScene._syncDeployToolbarFromSelection': ('P5', 'UI: pasek narzędzi rozstawienia'),
}
RE_UI_NAME = re.compile(r'Html|Tooltip|Hud|HUD|Panel|Toolbar|Roster|Minimap|Summary|Banner|Dropdown|Popup|Chrome|EndScreen|Label$|Card|Badge|Settings|Stats', re.I)
RE_AUDIO_NAME = re.compile(r'^_?(sfx|Sfx)|Audio|Ambient|Music', re.I)

# ------------------------------------------------------------ classification
status = {}   # name -> (target, reason)


def tgt_round(r):
    return round_of(r['name'].split('.')[-1])


# pass 1: direct (body patterns as r1 + field access)
for r in rows:
    n = r['name']
    if n in OVERRIDES:
        status[n] = OVERRIDES[n]
        continue
    a = r['acc']
    short = n.split('.')[-1]
    if r['cat'] == 'TYPE':
        status[n] = ('TYPE', 'typ TS; DTO wg potrzeb rund 2–5' + (' (niesie obiekty THREE → scena)' if r['three'] else ''))
    elif r['kind'] == 'method' and (a['AUDIO'] or RE_AUDIO_NAME.search(short)):
        status[n] = ('P5-AUDIO', 'dźwięk WebAudio (pola audio)' if a['AUDIO'] else 'dźwięk (nazwa)')
    elif r['cat'] in ('3D', 'MIX'):
        rr = 'R5' if a['CAM'] and not R2.search(short) else tgt_round(r)
        status[n] = (rr + ('-MIX' if r['cat'] == 'MIX' else ''), 'wzorce 3D w ciele (r1)' + (' + DOM → część UI do P5' if r['cat'] == 'MIX' else ''))
    elif r['cat'] == 'UI':
        status[n] = ('P5', 'wzorce DOM w ciele (r1)')
    elif r['kind'] == 'method' and a['CAM'] and not a['DOM']:
        status[n] = ('R5', f"pola kamery ({a['CAM']}× `this.cam*`/`pan*`/`canvas`)")
    elif r['kind'] == 'method' and a['3D'] and a['DOM']:
        status[n] = (tgt_round(r) + '-MIX', f"pola 3D ({a['3D']}×) i DOM ({a['DOM']}×)")
    elif r['kind'] == 'method' and a['3D']:
        status[n] = (tgt_round(r), f"pola sceny 3D ({a['3D']}×, np. siatki jednostek/murów)")
    elif r['kind'] == 'method' and a['DOM']:
        status[n] = ('P5', f"pola DOM ({a['DOM']}×)")

SCENE = lambda t: re.search(r'R[2-5]', t) is not None
rnd = lambda t: re.search(r'R[2-5]', t).group()

# pass 2: call graph fixpoint for remaining methods
changed = True
while changed:
    changed = False
    for r in rows:
        n = r['name']
        if n in status or r['kind'] != 'method':
            continue
        callee = [status.get('BattleScene.' + c) for c in r['calls']]
        callee = [c for c in callee if c]
        sc = sorted({rnd(c[0]) for c in callee if SCENE(c[0])})
        ui = any(c[0] in ('P5', 'P5-AUDIO') for c in callee)
        short = n.split('.')[-1]
        if sc:
            names = sorted(c for c in r['calls'] if SCENE(status.get('BattleScene.' + c, ('',))[0]))[:3]
            status[n] = ('SPLIT-' + (sc[0] if len(sc) == 1 else tgt_round(r)),
                         'logika → P6.13; wywołania sceny (' + ', '.join(f'`{x}`' for x in names) + ') → zdarzenia/DTO dla rundy' + (' ; UI → P5' if ui else ''))
            changed = True
        elif ui and RE_UI_NAME.search(short):
            status[n] = ('P5', 'wywołuje tylko UI, nazwa UI')
            changed = True

# pass 3: names, then constants / helpers by users
for r in rows:
    n = r['name']
    if n in status:
        continue
    short = n.split('.')[-1]
    if r['kind'] == 'method':
        callee = [status.get('BattleScene.' + c) for c in r['calls']]
        if RE_UI_NAME.search(short):
            status[n] = ('P5', 'nazwa UI')
        elif any(c and c[0] in ('P5', 'P5-AUDIO') for c in callee):
            status[n] = ('SPLIT-P5', 'logika → P6.13; odświeżenie UI → P5')

for r in rows:
    if r['kind'] == 'method' and r['name'] not in status:
        status[r['name']] = ('LOG', 'brak zależności od sceny/DOM/audio (bezpośrednich i przez wywołania)')

users = defaultdict(list)
top_names = [r['name'] for r in rows if r['kind'] != 'method' and r['cat'] != 'TYPE']
for r in rows:
    for t in top_names:
        if t != r['name'] and re.search(r'(?<![\w$.])' + re.escape(t) + r'(?![\w$])', r['body']):
            users[t].append(r['name'])

changed = True
final = False
while changed or not final:
    if not changed:
        final = True   # last sweep: unresolved top-level users (cycles) count as logic
    changed = False
    for t in top_names:
        if t in status:
            continue
        us = [status.get(u) for u in users[t]]
        if any(u is None for u in us) and not final:
            continue   # wait for other top-level users
        sc = sorted({rnd(u[0]) for u in us if u and SCENE(u[0])})
        lg = any(u is None or u[0].startswith('SPLIT') or u[0] == 'LOG' for u in us)
        ui = any(u and u[0].startswith('P5') for u in us)
        if not users[t]:
            if src[byname[t]['line'] - 1].startswith('export'):
                status[t] = ('LOG', 'eksport bez użytkowników w pliku (odbiorca poza plikiem; logika)')
            else:
                status[t] = ('DEAD', 'nieużywany w pliku i nieeksportowany (martwy kod) — nie portować')
        elif sc and lg:
            if byname[t]['kind'].startswith('function'):
                status[t] = ('SHARED-' + sc[0], f'funkcja logiki domeny (P6.13) wywoływana też przez scenę ({len(users[t])} symboli): scena konsumuje wynik jako DTO')
            else:
                status[t] = ('SHARED-' + sc[0], f'stała używana przez scenę i logikę ({len(users[t])} symboli): stała domeny, scena ma kopię z testem równości')
        elif sc:
            status[t] = (sc[0], f'używana tylko przez scenę ({len(users[t])} symboli)')
        elif ui and not lg:
            status[t] = ('P5', f'używana tylko przez UI ({len(users[t])} symboli)')
        elif ui:
            status[t] = ('SHARED-P5', 'używana przez logikę i UI')
        else:
            continue
        changed = True

for r in rows:
    if r['name'] not in status:
        status[r['name']] = ('LOG', 'brak zależności od sceny/DOM/audio (bezpośrednich i przez wywołania)')

LABEL = {
    'R2': 'RUNDA-2 (pole statyczne)', 'R3': 'RUNDA-3 (jednostki/nakładki)', 'R4': 'RUNDA-4 (dynamika/efekty)', 'R5': 'RUNDA-5 (picking/kamera)',
}


def label(t):
    if t in LABEL:
        return LABEL[t]
    if t.endswith('-MIX'):
        return LABEL[rnd(t)] + ' — tylko część 3D; DOM → P5'
    if t.startswith('SPLIT-P5'):
        return 'PODZIAŁ: logika → P6.13 `domain/combat.rs`; UI → P5'
    if t.startswith('SPLIT-'):
        return f'PODZIAŁ: logika → P6.13 `domain/combat.rs`; część sceny → {LABEL[rnd(t)]}'
    if t == 'SHARED-P5':
        return 'WSPÓLNA: P6.13 (logika) + P5 (UI)'
    if t.startswith('SHARED-'):
        return f'WSPÓLNA: dane/stała domeny P6.13, konsumowana przez scenę → {LABEL[rnd(t)]}'
    if t == 'P5':
        return 'NIE-DOTYCZY → P5 (UI DOM)'
    if t == 'P5-AUDIO':
        return 'NIE-DOTYCZY → P5 (audio WebAudio, poza rendererem)'
    if t == 'DEAD':
        return 'NIE-DOTYCZY (martwy kod)'
    if t == 'TYPE':
        return 'NIE-DOTYCZY (typ TS)'
    return 'NIE-DOTYCZY → P6.13 `domain/combat.rs` (logika)'


# ------------------------------------------------------------ output
pre = first_decl - 1
tot = Counter()
cnt = Counter()
for r in rows:
    t = status[r['name']][0]
    grp = t.split('-')[0] if not t.startswith('P5') else t
    tot[grp] += r['loc']
    cnt[grp] += 1
by_round = defaultdict(lambda: [0, 0, 0])   # full, split/shared, mix
for r in rows:
    t = status[r['name']][0]
    for rr in ('R2', 'R3', 'R4', 'R5'):
        if t == rr:
            by_round[rr][0] += r['loc']
        elif t.endswith('-MIX') and t.startswith(rr):
            by_round[rr][2] += r['loc']
        elif (t.startswith('SPLIT-') or t.startswith('SHARED-')) and t.endswith(rr):
            by_round[rr][1] += r['loc']

with open(sys.argv[2], 'w', encoding='utf-8') as f:
    f.write('# Inwentarz `gra/src/battle/battleScene.ts` @ `edb8fb56` (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1, runda 2)\n\n')
    f.write('Wygenerowane: `python3 -I dowody/inv3.py <battleScene.ts z git archive edb8fb56> inwentarz-battleScene.md dowody/inv_summary.txt` '
            '(metoda: docstring `inv3.py`; runda 1 = `inv2.py`, wynik r1 w `dowody/inv_summary-r1.txt`).\n')
    f.write('Kolumny `three`/`obj`/`dom` jak w r1; `pola` = dostęp `this.<pole>` do pól klasy typowanych jako 3D/DOM/AUDIO/CAM (przebieg A); '
            '`status` = DOKĄD symbol należy, `uzasadnienie` = reguła, która go tam przypisała (A pola, B graf wywołań, C użytkownicy stałej/funkcji, D ręczne z powodem).\n\n')
    f.write('Statusy: `RUNDA-n` (port w tym temacie, część n), `… — tylko część 3D` (MIX), `PODZIAŁ` (logika → P6.13, wywołania sceny → zdarzenia/DTO dla rundy n), '
            '`WSPÓLNA` (stała/dane domeny używane też przez scenę — kopia w scenie z testem równości), `NIE-DOTYCZY → P5 (UI DOM | audio)`, `NIE-DOTYCZY → P6.13` (czysta logika), `NIE-DOTYCZY (typ TS)`.\n\n')
    f.write(f'Linie 1–{pre}: importy i stałe modułu przed pierwszą deklaracją objętą tabelą — NIE_ZMIERZONO per symbol (przechodzą z symbolem, który ich używa).\n\n')
    f.write('| # | linie | LOC | symbol | rodzaj | three | obj | dom | pola | kat. r1 | status | uzasadnienie |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n')
    for i, r in enumerate(rows, 1):
        t, why = status[r['name']]
        pola = ' '.join(f'{k}:{v}' for k, v in sorted(r['acc'].items())) or '—'
        f.write(f"| {i} | {r['line']}–{r['end']} | {r['loc']} | `{r['name']}` | {r['kind']} | {r['three']} | {r['obj']} | {r['dom']} | {pola} | {r['cat']} | {label(t)} | {why} |\n")

with open(sys.argv[3], 'w', encoding='utf-8') as f:
    f.write(f'file_lines {len(src)} pre_first_decl {pre} symbols {len(rows)} class_fields {len(class_fields)} typed_fields {len(field_cat)} ({dict(Counter(field_cat.values()))})\n')
    for c in sorted(tot):
        f.write(f'{c} symbols {cnt[c]} loc {tot[c]}\n')
    for r in sorted(by_round):
        full, split, mix = by_round[r]
        f.write(f'{r} loc full {full} split_or_shared {split} mix {mix}\n')
    for n in OVERRIDES:
        f.write(f'override {n} -> {OVERRIDES[n][0]}\n')
print(open(sys.argv[3]).read())
