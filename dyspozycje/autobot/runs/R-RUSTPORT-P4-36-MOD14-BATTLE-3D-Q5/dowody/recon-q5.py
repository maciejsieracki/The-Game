#!/usr/bin/env python3
"""R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5 r1: uzgodnienie zakresu części 5 z inwentarzem.

Użycie: python3 -I recon-q5.py <inwentarz-battleScene.md (Q1)> <battleScene.ts @ edb8fb56> \
            <rust-port/renderer/src/battle> <rust-port/renderer/tests> > recon-q5-table.md

Wiersze objęte (każdy MUSI dostać status, inaczej kod wyjścia 1):
  - każdy wiersz inwentarza Q1, którego status zawiera `RUNDA-5` (28),
  - wiersze odłożone do części 5 przez wcześniejsze części: #220 (`BattleScene`, pola klasy — Q2 §12a
    „reszta → cz. 3–5”), #324 (`_startLoop`: kamera → cz. 5, Q4 §32), #330 (`_tickFloatLabels`:
    `worldToScreen` → cz. 5), #354 (`_spawnDamageLabel`: rzut na ekran → cz. 5),
  - wiersze DOŁĄCZONE w tej rundzie z powodem (inwentarz przypisał je gdzie indziej, ale ich część
    sceny / pickingu jest w zakresie §4 „5 — picking i kamera”).
Status `ZPORTOWANY*` musi wskazywać identyfikatory obecne w `src/battle/*.rs` lub `tests/battle3d_*.rs`
(nazwy testów; inaczej kod 1).
Kolumna `ciało` = SHA-256 (12 znaków) ciała symbolu w `battleScene.ts` @ `edb8fb56` (linie z inwentarza).
"""
import glob
import hashlib
import re
import sys

inv, ts, rs_dir, tests_dir = sys.argv[1:5]
src = open(ts, encoding='utf-8').read().split('\n')
files = sorted(glob.glob(rs_dir + '/*.rs')) + sorted(glob.glob(tests_dir + '/battle3d_*.rs'))
rust = ''.join(open(f, encoding='utf-8').read() for f in files)

FROM_EARLIER = {
    220: 'Q2 §12a: pola kamery → `BattleCamera` (cz. 2), reszta → cz. 3–5',
    324: 'Q4 §32: kamera (`_tickZoom`, `_tickCameraPanKeys`) → cz. 5',
    330: 'Q4 §32: `worldToScreen` → cz. 5',
    354: 'Q4 §32: rzut na ekran → cz. 5',
}
ADDED = {
    439: 'inwentarz Q1: P5 (zakres linii obejmuje pola-strzałki `_onCanvasHoverMove`, `_onPanDown`, `_onPanMove`, `_onPanUp`, `_onResize` `:11236-11492`) — przeciąganie kamery (§4 „kamera: pan”)',
    407: 'inwentarz Q1: P6.13 — `_deploySelected` po `_refreshDeploySelectionVisuals` (wołane z `_handleDeployUnitPick`, RUNDA-5)',
    583: 'inwentarz Q1: PODZIAŁ — warunek przeniesienia w `_onDeployClick` (RUNDA-5)',
}

ZP = 'ZPORTOWANY (cz. 5)'
ZC = 'ZPORTOWANY częściowo (cz. 5: część sceny / pickingu)'
ZE = 'ZPORTOWANY wcześniej'
NP = 'NIE PORTOWANY'

S = {
    40: (ZE, '`ORDER_LINE_Y` (cz. 3, `units.rs`); równość z webem: test `helpers_and_constants_equal_web`'),
    196: (ZE, '`make_projectile_mesh` (cz. 4, `dynamics.rs`, test `projectiles_match_web`)'),
    200: (ZP, '`clamp_battle_tile`; testy `helpers_and_constants_equal_web`, `clamp_battle_tile_bounds`'),
    201: (ZP, '`battle_pick_mesh_up_normal` (normalna ściany × `matrixWorld` OBIEKTU, W-24); hash trafień w `*_picking_*`'),
    202: (ZP, '`pick_ground_tile_plane`; kolumna `fromPlane` każdego promienia'),
    203: (ZP, '`pick_ground_tile_from_meshes` (`intersect_objects` nierekurencyjnie); kolumna `fromMeshes`'),
    231: (NP, '`dispose()` = zwolnienie zasobów GPU i słuchaczy DOM: w Rust własność / `Drop` (Z-36-15), słuchacze → P5; dryf po pinie dotyczy tylko tego (`forceContextLoss`, słuchacze — `web-drift-q5.txt`)'),
    324: (ZC, '`BattleView::frame` + `BattleView::render` (kamera klatki) — reszta: cz. 4 (`billboard_all`, `deploy_phase_frame`), zegar / timery → P6.13, minimapa / morale / roster → P5'),
    325: (ZP, '`BattleView::sync_renderer_size` (`renderer_size`, `aspect`, rzut); ops `sync` / `frame` w `camera_control_matches_web`'),
    326: (ZP, '`BattleView::ray_from_canvas` (`client_rect_to_ndc` z `pick::hex`, prostokąt pusty → `None`)'),
    327: (ZP, '`BattleView::ray_from_canvas` (`updateMatrixWorld` + `setFromCamera`), `RayCamera`'),
    328: (ZE, '`tick_projectiles` (cz. 4, `dynamics.rs`)'),
    382: (ZP, '`BattleView::apply_camera` (cz. 2 `BattleCamera::apply` + nieaktualny `matrixWorld` po `lookAt`, W-23)'),
    383: (ZP, '`BattleView::set_zoom_target`'),
    384: (ZP, '`BattleView::tick_zoom`, `BattleView::on_wheel`, `BattleView::on_key_zoom` (pola `_onWheel`, `_onKeyZoom` w zakresie linii wiersza)'),
    385: (ZP, '`BattleView::set_pan_key`, `PanKeys` (pola `_onKeyPanDown` / `_onKeyPanUp` w zakresie linii); `isEditableTarget` = flaga wejścia (DOM → P5)'),
    386: (ZP, '`BattleView::clamp_cam_target`'),
    387: (ZP, '`BattleView::tick_camera_pan_keys`, `on_key_toggle_bars` (pole `_onKeyToggleBars` w zakresie linii; test `bars_toggle_matches_web`) — pola `_onKeySpeed`, `_onKeyBattleStats`, `_onKeyPause` z tego zakresu → P6.13 / P5'),
    409: (ZP, '`pick_ground_tile`, `pick_ground_tile_at`; kolumna `ground` każdego promienia'),
    410: (ZE, '`world_at_tile` (cz. 3, `units.rs`)'),
    411: (ZE, '`unit_world_pos` (cz. 3, `units.rs`)'),
    432: (ZP, '`BattleView::minimap_viewport`, `MinimapViewport` (rysowanie minimapy → P5)'),
    435: (ZP, '`pick_unit_at_screen` (`PickUnit`, `Occupancy`); kolumna `unit` każdego promienia'),
    548: (ZP, '`handle_deploy_unit_pick`, `DeploySelection`, `RosterPick` (pierścienie i `refresh_deploy_selection_visuals` z cz. 3); `deploy_picking_and_clicks_match_web`'),
    580: (ZC, '`deploy_click` → `DeployClick` (Pick / Place / Clear / Nothing) — `_applyDeployPlacement`, komunikaty, czyszczenie zaznaczenia → P6.13 / P5'),
    629: (ZC, '`box_select` (test trafienia `worldToClientPx`) — zaznaczenie, pierścienie (cz. 3), UI → P6.13 / P5'),
    674: (ZC, '`battle_click` → `BattleClick`, `battle_queue_only` — rozkazy (`_issueBattle*`), `_handleBattleUnitPick` → P6.13 / P5'),
    722: (ZP, '`BattleView::world_to_screen` (+ `BattleView::world_to_client_px` = `input/picker.ts:101`, `BattleView::project`) — styl / element DOM → P5'),
    220: (ZC, '`BattleView` (`renderer_size`, macierze kamery), `PanKeys` (`_camPanKeys`), `DragPan` (`panning`, `panLastX/Y`) — pozostałe pola: cz. 3–4 / P6.13 / P5'),
    330: (ZC, '`BattleView::world_to_screen` (rzut napisu) — cz. 4 `FloatLabel::sample`; element DOM → P5'),
    354: (ZC, '`BattleView::world_to_screen` (rzut napisu) — cz. 4 `FloatLabel::damage`; element DOM → P5'),
    439: (ZC, '`DragPan` (`pointer_down_pans`, `down`, `move_to`, `up`), `BattleView::drag_pan` — dymek, kursor, podgląd, routing LPM (zaznaczanie / przeciąganie formacji) → P5 / P6.13'),
    407: (ZC, '`handle_deploy_unit_pick` (prywatne `refresh_visuals`: pierwszy wybrany żywy, nie rozbity) — reszta → P6.13'),
    583: (ZC, '`deploy_click` (wybrane żywe, nieusunięte jednostki gracza) — reszta → P6.13'),
}


def js_name(ident):
    return ident.startswith('_') or (ident[0].islower() and '_' not in ident and ident != ident.lower())


rows = []
for line in open(inv, encoding='utf-8'):
    if not line.startswith('| '):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if c[0].isdigit():
        a, b = [int(x) for x in c[1].replace('–', '-').split('-')]
        rows.append((int(c[0]), a, b, c[3].strip('`'), c[10]))

bad = 0
counts = {}
out = ['| # | linie | symbol | źródło | ciało (sha256/12) | status cz. 5 | Rust / powód |', '|---|---|---|---|---|---|---|']
seen = set()
for n, a, b, sym, st in rows:
    if 'RUNDA-5' in st:
        tag = 'RUNDA-5'
    elif n in FROM_EARLIER:
        tag = 'odłożony → cz. 5'
    elif n in ADDED:
        tag = 'dołączony'
    else:
        continue
    seen.add(n)
    if n not in S:
        print(f'BRAK STATUSU #{n} {sym}', file=sys.stderr)
        bad += 1
        continue
    status, why = S[n]
    if status.startswith('ZPORTOWANY'):
        for ident in re.findall(r'`([A-Za-z_][A-Za-z0-9_:]*)`', why.split(' — ')[0]):
            leaf = ident.split('::')[-1]
            if js_name(leaf):
                continue
            if not re.search(r'\b' + re.escape(leaf) + r'\b', rust):
                print(f'BRAK W RUST #{n} {sym}: {ident}', file=sys.stderr)
                bad += 1
    extra = FROM_EARLIER.get(n) or ADDED.get(n)
    if extra:
        why = why + ' — ' + extra
    digest = hashlib.sha256('\n'.join(src[a - 1:b]).encode('utf-8')).hexdigest()[:12]
    key = status.split(' (')[0]
    counts[key] = counts.get(key, 0) + 1
    out.append(f'| {n} | {a}–{b} | `{sym}` | {tag} | `{digest}` | {status} | {why} |')
for n in sorted((set(FROM_EARLIER) | set(ADDED)) - seen):
    print(f'BRAK WIERSZA #{n} w inwentarzu', file=sys.stderr)
    bad += 1
for n in sorted(set(S) - seen):
    print(f'STATUS BEZ WIERSZA #{n}', file=sys.stderr)
    bad += 1
print('\n'.join(out))
total = sum(counts.values())
print(f'LICZNIK: wierszy = {total}; ' + '; '.join(f'{k} = {v}' for k, v in sorted(counts.items()))
      + f'; bez statusu / niezgodnych = {bad}', file=sys.stderr)
sys.exit(1 if bad else 0)
