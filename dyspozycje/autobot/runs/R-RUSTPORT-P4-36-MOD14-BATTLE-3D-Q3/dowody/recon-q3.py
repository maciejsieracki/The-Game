#!/usr/bin/env python3
"""R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3 r1: uzgodnienie zakresu części 3 z inwentarzem.

Użycie: python3 -I recon-q3.py <inwentarz-battleScene.md (Q1)> <battleScene.ts @ edb8fb56> \
            <src/battle/units.rs> <src/battle/field.rs>

Wiersze objęte (każdy MUSI dostać status, inaczej kod wyjścia 1):
  - każdy wiersz inwentarza Q1, którego status zawiera `RUNDA-3` (60),
  - 24 wiersze, które uzgodnienie części 2 (P4-36 §12a, `recon-r2.py`) odłożyło do części 3
    (`PRZENIESIONY → cz. 3` 12, `WSPÓLNA … odłożona do cz. 3` 12),
  - wiersze dopisane w tej rundzie z powodem (`_moveDeployUnit`, inwentarz: P6.13 — ma część 3D).
Status `ZPORTOWANY*` musi wskazywać identyfikatory obecne w `units.rs` / `field.rs` (inaczej kod 1).
Kolumna `woła` = metody z listy PORTED_WEB (zportowane w cz. 2–3), które pada w ciele symbolu jako
`this.<nazwa>(` — dowód, jaką część sceny ma symbol PODZIAŁ (liczone z battleScene.ts, nie ręcznie).
"""
import re
import sys

inv, ts, units_rs, field_rs = sys.argv[1:5]
src = open(ts, encoding='utf-8').read().split('\n')
rust = open(units_rs, encoding='utf-8').read() + open(field_rs, encoding='utf-8').read()

FROM_Q2 = {3, 4, 115, 178, 179, 181, 182, 183, 186, 194, 199, 208,  # WSPÓLNA … odłożona do cz. 3
           120, 173, 180, 184, 185, 188, 190, 191, 192, 235, 238, 375}  # PRZENIESIONY → cz. 3
ADDED = {620: 'inwentarz Q1: P6.13 (reguła: brak pól 3D) — ale ciało ustawia `ru.group.position` i `ru.hpBarGroup.position` (`:16101-16102`)'}

# Metody weba zportowane (część 2 i 3) — do kolumny `woła`.
PORTED_WEB = ['_updateHpBar', '_updateMoraleBar', '_updateAmmoBar', '_removeUnitFromScene', '_addSelectionRing',
              '_removeSelectionRing', '_refreshUnitRingColor', '_refreshDeploySelectionVisuals', '_clearOrderPreview',
              '_disposeQueuedOrderArrows', '_disposeAllOrderLines', '_refreshQueuedOrderVisuals', '_addOrderPreviewArrow',
              '_updateOrderPreview', '_clearDeployGhosts', '_refreshDeployGhosts', '_refreshDeployGhostsAt',
              '_updateDeployPlacementPreview', '_refreshBattleMoveGhosts', '_moveDeployUnit', '_placeUnitsOneSide',
              '_placeSiegeDefenders', '_placeUnits', '_resetDeploySide', '_initDeployGhostLayer', '_appendDeployCellOutline']

ZP = 'ZPORTOWANY (cz. 3)'
ZC = 'ZPORTOWANY częściowo (cz. 3: część sceny)'
Z2 = 'ZPORTOWANY wcześniej (cz. 2)'
WD = 'WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-7)'
PD = 'PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`)'
M4 = 'PRZENIESIONY → cz. 4 (dynamika/efekty)'
ND = 'NIE PORTOWANY'

S = {}
for n in (41, 42, 43, 44):
    S[n] = (ZP, '`ORDER_COLOR_MOVE` … `ORDER_ATTACK_OPACITY` (`pub const` w `battle::units`); test `constants_equal_web`')
for n in (113, 114, 115, 116, 117, 118, 119, 121, 122):
    S[n] = (ZP, '`HPBAR_W`, `HPBAR_H`, `HPBAR_Y`, `BAR_GAP_Y`, `MORALEBAR_Y`, `AMMOBAR_Y`, `AMMOBAR_COLOR`, `BAR_OUTLINE_PAD`, `BAR_OUTLINE_Z`; test `constants_equal_web`')
S[3] = (ZP, '`DIR_DELTA` (`pub const`); test `constants_equal_web`; konsument sceny `dir_yaw`')
S[208] = (ZP, '`dir_yaw` (fallback `Dir.E` dla indeksu spoza tablicy); test `bars_and_fallback_match_web`')
S[120] = (ZP, '`side_color`; test `bars_and_fallback_match_web` + parytet pasków')
S[720] = (ZP, '`make_fallback_avatar`; test `bars_and_fallback_match_web`')
S[721] = (ZP, '`make_unit_bars` / `UnitBars`; test `bars_and_fallback_match_web` + każda jednostka konstruktora')
S[340] = (ZP, '`update_hp_bar`')
S[341] = (ZP, '`update_morale_bar` (`setRGB` = kolor liniowy wprost)')
S[342] = (ZP, '`update_ammo_bar`')
S[352] = (ZP, '`remove_unit_from_scene`; post `removeOne`')
S[375] = (ZP, '`BattleScene3::remove_all_units`; post `removeAll` (pola DOM/logiki → P5/P6.13)')
S[623] = (ZP, '`BattleScene3::reset_side` / `reset_deploy_side`; posty `resetAtk`/`resetDef`')
S[235] = (ZP, '`place_siege_wall` / `PlacedWall` (HUD oblężenia = DOM → P5); test `units_constructor_matches_web`')
S[413] = (ZP, '`make_order_arrow`; test `order_arrows_match_web`')
S[414] = (ZP, '`clear_order_preview`')
S[415] = (ZP, '`dispose_queued_order_arrows`')
S[416] = (ZP, '`dispose_all_order_lines`')
S[420] = (ZP, '`refresh_queued_order_visuals`; test `queued_order_visuals_match_web`')
S[421] = (ZP, '`add_order_preview_arrow`')
S[423] = (ZP, '`update_order_preview` (picking/zaznaczenie przez `BattleQueries`, `PreviewState`); test `order_preview_matches_web`')
S[578] = (ZP, '`refresh_deploy_selection_visuals` (panele DOM → P5)')
S[584] = (ZP, '`clear_deploy_ghosts`')
S[586] = (ZP, '`update_deploy_placement_preview`; test `ghosts_match_web`')
S[612] = (ZP, '`refresh_deploy_ghosts`; test `ghosts_match_web`')
S[613] = (ZP, '`refresh_deploy_ghosts_at`; test `ghosts_match_web`')
S[672] = (ZP, '`refresh_battle_move_ghosts`; test `ghosts_match_web`')
S[673] = (ZP, '`add_battle_ghost_disc` (prywatna)')
S[678] = (ZP, '`add_selection_ring`; test `selection_rings_match_web`')
S[679] = (ZP, '`remove_selection_ring`')
S[699] = (ZP, '`refresh_unit_ring_color`')
S[242] = (ZC, '`spawn_unit`, `build_battle_scene_with_units`; wybór pól (`place`, `tileScore`, `layGroup`, `arrangeFlankCavalry`) → P6.13 (Z-36-7)')
S[624] = (ZC, '`spawn_unit` (przez `BattleScene3::reset_side`); wybór pól → P6.13 (Z-36-7)')
S[238] = (ZC, '`spawn_unit` (`on_wall_walkway` → `WALL_WALK_Y`); przydział rzędów muru / `placeOne` → P6.13 (Z-36-7)')
S[256] = (ZC, '`climb_onto_wall_walkway` (`:5875-5891`) + `update_morale_bar` (`:5795`); decyzje tury → P6.13')
S[483] = (ZC, 'w `build_battle_scene_with_units`: skala 1 jednostek gracza (`:12883-12887`) + `init_deploy_ghost_layer`; DOM → P5; auto-grupowanie → P6.13; znaczniki grup → cz. 4')
S[620] = (ZC, '`move_deploy_unit` / `BattleScene3::move_deploy_unit` (pozycje modelu i pasków); `occByKey` → P6.13; 160 ruchów weba odtworzonych w teście')
S[198] = (Z2, '`cell_bounds_xz` (`battle::field`) — konsument w cz. 3: obrysy duchów')
S[452] = (Z2, '`FieldScene::build_deploy_zone`')
S[582] = (Z2, '`FieldScene::init_deploy_ghost_layer`')
S[585] = (Z2, '`FieldScene::append_deploy_cell_outline` — wołana przez duchy cz. 3')
S[57] = (Z2, '`DEPLOY_MID_COL` (`pub const`, `constants_equal_web` cz. 2)')
S[85] = (Z2, '`DEPLOY_DEF_MIN_COL` (`pub const`, `constants_equal_web` cz. 2)')
for n, why in {
    4: '`DIRS4` = `DIR_DELTA`; konsumenci: ruch/BFS/sąsiedztwo (logika); scena używa `DIR_DELTA` w `dir_yaw`',
    7: 'jedyny konsument `relativeHit` (logika trafień z flanki/tyłu)',
    8: 'logika trafień (P6.13)',
    15: 'kopia składu do powtórki (`_savedAtkBUs`) — dane, nie scena',
    58: 'stała rozstawienia (wybór pól) — Z-36-7', 60: 'stała rozstawienia (wybór pól) — Z-36-7',
    61: 'stała rozstawienia (wybór pól) — Z-36-7', 62: 'stała rozstawienia (wybór pól) — Z-36-7',
    63: 'stała rozstawienia (wybór pól) — Z-36-7', 87: 'stała rozstawienia (wybór pól) — Z-36-7',
    88: 'stała rozstawienia (wybór pól) — Z-36-7',
    90: 'punkty ruchu (logika)', 99: 'mechanika brodu (logika)', 100: 'mechanika brodu (logika)',
    101: 'fortyfikacja (logika)', 107: 'tempo tury (czas; harmonogram → P6.13/cz. 4)', 112: 'tempo tury (czas)',
    126: 'morale (logika)', 127: 'morale (logika)', 129: 'morale (logika)', 130: 'morale (logika)', 131: 'morale (logika)',
    132: 'morale (logika)', 133: 'morale (logika)', 134: 'morale (logika)', 135: 'morale okrążenia (`_activateUnit`, logika)',
    137: 'morale armii (logika)', 138: 'morale armii (logika)', 143: 'wycofanie strzelców (logika)',
    176: 'punkty ruchu (logika)', 187: 'wspinaczka wieżą — decyzja logiki; skutek 3D = `climb_onto_wall_walkway`',
    189: 'szarża (logika)', 205: 'bród (logika)', 206: 'bród (logika)', 207: 'odległość (logika)',
    178: 'zasięg → DTO (`range` nie wpływa na scenę)', 179: 'klasyfikacja → wybór pól (Z-36-7)', 181: 'logika strzału',
    182: 'klasyfikacja → wybór pól (Z-36-7)', 183: 'klasyfikacja → wybór pól (Z-36-7)', 186: 'klasyfikacja → wybór pól (Z-36-7)',
    194: 'normalizacja nazw do klasyfikacji (Z-36-7); routing modelu ma własny `norm_name` (`models::unit_core::routing`)',
    199: 'klucz zajętości `occByKey` → `BattleQueries::occupant`',
    173: 'odczyt statystyk → DTO (`ammoCount`/`moraleBaseFor`)', 180: 'amunicja startowa → `UnitSpawn::ammo_left/ammo_max`',
    184: 'klasyfikacja (logika)', 185: 'klasyfikacja (logika)', 188: 'kolejność rozstawienia (wybór pól, Z-36-7)',
    190: 'morale (logika)', 191: 'morale startowe → `UnitSpawn::morale/morale_max`', 192: 'morale ucieczki (logika)',
}.items():
    S[n] = (WD, why)
for n in (224, 244, 246, 247, 248, 254, 255, 320, 343, 344, 346, 347, 348, 418, 419, 477, 488, 490, 532, 546, 547,
          556, 557, 558, 559, 560, 561, 562, 581, 605, 611, 614, 615, 616, 618, 621, 622, 625, 667, 668, 669, 670, 671,
          675, 676, 677, 680, 695, 696, 697, 698, 705, 706, 707, 708, 709, 712, 714, 717):
    S[n] = (PD, 'logika zaznaczenia / rozkazów / grup / morale (P6.13); efekt w scenie przez funkcje z kolumny `woła`')
for n in (249, 250):
    S[n] = (ND, 'atrapy `THREE.Group`/`Mesh` dla klonów planowania auto-tury — nigdy nie trafiają do sceny (`:5518-5557`); logika → P6.13')
S[412] = (ND, '`dispose()` geometrii/materiałów = czas życia zasobów GPU; w Rust własność/`Drop` (jak `ownedGeos` w cz. 2)')
S[354] = (M4, 'napis obrażeń: pozycja 3D → ekran (`worldToScreen`, cz. 5) + element DOM (P5); dynamika jak `_spawnWallLabel` (cz. 4)')
S[701] = (M4, 'znaczniki grup (§4 cz. 4); `_makeGroupNumberTexture` już → cz. 4 (§12a); tekstura canvas = raster')
S[702] = (M4, 'jw.; w testach cz. 3 poddrzewa `groupFrame` są wyłączone z dumpów (liczone: `markers`)')
S[703] = (M4, 'jw. (synchronizacja znaczników)')
S[626] = (M4, 'przejście fazy (koniec rozstawienia): `_setDeployZoneVisible` jest w cz. 4/5 (§12); czyszczenia (`_clearDeployGhosts`, `_clearOrderPreview`, `_disposeAllOrderLines`) zportowane')

rows = []
for line in open(inv, encoding='utf-8'):
    if not line.startswith('| '):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if c[0].isdigit():
        a, b = [int(x) for x in c[1].replace('–', '-').split('-')]
        rows.append((int(c[0]), a, b, c[3].strip('`'), c[10]))

LG = 'NIE-DOTYCZY sceny (logika → P6.13)'

# Graf wywołań metod klasy (`this.<metoda>(`) i domknięcie przechodnie do PORTED_WEB.
methods = {r[3].split('.')[-1]: '\n'.join(src[r[1] - 1:r[2]]) for r in rows if r[3].startswith('BattleScene.')}
direct = {m: {c for c in re.findall(r'this\.(_?[A-Za-z0-9_]+)\(', body) if c in methods and c != m}
          for m, body in methods.items()}


def reach(m):
    seen, stack = set(), [m]
    while stack:
        for c in direct.get(stack.pop(), ()):
            if c not in seen:
                seen.add(c)
                stack.append(c)
    return seen


def js_name(ident):
    # camelCase starting lowercase = web name (`tileScore`), `*_web` = test name, `_x` = web method.
    return ident.startswith('_') or ident.endswith('_web') or (ident[0].islower() and '_' not in ident and ident != ident.lower())


bad = 0
counts = {}
out = ['| # | linie | symbol | źródło | woła (zportowane; bezpośrednio / pośrednio) | status cz. 3 | Rust / powód |',
       '|---|---|---|---|---|---|---|']
for n, a, b, sym, st in rows:
    src_tag = 'RUNDA-3' if 'RUNDA-3' in st else ('cz. 2 → cz. 3' if n in FROM_Q2 else ('dopisany' if n in ADDED else None))
    if src_tag is None:
        continue
    name = sym.split('.')[-1]
    dcalls = sorted(c for c in direct.get(name, ()) if c in PORTED_WEB)
    icalls = sorted(c for c in reach(name) if c in PORTED_WEB and c not in dcalls)
    calls = dcalls + [f'({c})' for c in icalls]
    if n not in S:
        print(f'BRAK STATUSU #{n} {sym}', file=sys.stderr)
        bad += 1
        continue
    status, why = S[n]
    if status == PD and not calls:
        status, why = LG, 'brak wywołań funkcji sceny (bezpośrednich i przez graf wywołań klasy) — sama logika / UI'
    if n in ADDED:
        why = why + ' — ' + ADDED[n]
    if status.startswith('ZPORTOWANY'):
        for ident in re.findall(r'`([A-Za-z_][A-Za-z0-9_:]*)`', why.split(' — ')[0]):
            leaf = ident.split('::')[-1]
            if js_name(leaf):
                continue
            if not re.search(r'\b' + re.escape(leaf) + r'\b', rust):
                print(f'BRAK W RUST #{n} {sym}: {ident}', file=sys.stderr)
                bad += 1
    key = status.split(' (')[0].split(':')[0].split(' —')[0]
    counts[key] = counts.get(key, 0) + 1
    out.append(f'| {n} | {a}–{b} | `{sym}` | {src_tag} | {", ".join(calls) if calls else "—"} | {status} | {why} |')
print('\n'.join(out))
total = sum(counts.values())
print(f'LICZNIK: wierszy = {total}; ' + '; '.join(f'{k} = {v}' for k, v in sorted(counts.items()))
      + f'; bez statusu / niezgodnych = {bad}', file=sys.stderr)
sys.exit(1 if bad else 0)
