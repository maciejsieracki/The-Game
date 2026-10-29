#!/usr/bin/env python3
"""R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4 r1: uzgodnienie zakresu części 4 z inwentarzem.

Użycie: python3 -I recon-q4.py <inwentarz-battleScene.md (Q1)> <battleScene.ts @ edb8fb56> \
            <src/battle/dynamics.rs> <src/battle/units.rs>

Wiersze objęte (każdy MUSI dostać status, inaczej kod wyjścia 1):
  - każdy wiersz inwentarza Q1, którego status zawiera `RUNDA-4` (31),
  - 24 wiersze odłożone do części 4 przez uzgodnienie części 2 (P4-36 §12a: `PRZENIESIONY → cz. 4` 22,
    `WSPÓLNA … odłożona do cz. 4` 2),
  - 5 wierszy odłożonych do części 4 przez uzgodnienie części 3 (P4-36 §22),
  - 7 wierszy DOŁĄCZONYCH w tej rundzie z powodem (inwentarz przypisał je gdzie indziej, ale mają część sceny
    z zakresu §4 „4 — dynamika i efekty”; m.in. `makeProjectileMesh` wymieniony wprost w GOAL dispatchu).
Status `ZPORTOWANY*` musi wskazywać identyfikatory obecne w `dynamics.rs` / `units.rs` (inaczej kod 1).
Kolumna `woła` = metody zportowane w części 4 (lista PORTED_WEB) wołane w ciele symbolu jako `this.<nazwa>(`,
wprost i (w nawiasie) przez graf wywołań klasy — dowód, jaką część sceny ma wiersz PODZIAŁ.
"""
import re
import sys

inv, ts, dyn_rs, units_rs = sys.argv[1:5]
src = open(ts, encoding='utf-8').read().split('\n')
rust = open(dyn_rs, encoding='utf-8').read() + open(units_rs, encoding='utf-8').read()

FROM_Q2 = {5, 6,  # WSPÓLNA … odłożona do cz. 4
           105, 106, 109, 110, 111, 141, 195, 252, 266, 297, 298, 300, 302, 319, 322, 323, 349, 350, 700,
           723, 724, 725}  # PRZENIESIONY → cz. 4
FROM_Q3 = {354, 626, 701, 702, 703}
ADDED = {
    196: 'inwentarz Q1: RUNDA-5 (przypisanie słownikowe) — GOAL dispatchu wymienia `makeProjectileMesh` w części 4',
    328: 'inwentarz Q1: RUNDA-5 — ruch pocisków co klatkę (§4 „pociski”)',
    324: 'inwentarz Q1: RUNDA-5 — pętla klatki: billboard pasków i gałąź rozstawienia (§4 „aktualizacja pasków”)',
    353: 'inwentarz Q1: PODZIAŁ … UI → P5 — start zanikania (§4 „zanikanie”)',
    330: 'inwentarz Q1: P5 — pozycja świata etykiety i krycie przed rzutem na ekran (napisy obrażeń/muru)',
    455: 'inwentarz Q1: P5 — widoczność strefy rozstawienia = węzły sceny (`_endDeployPhase`, cz. 3 → cz. 4)',
    549: 'inwentarz Q1: P6.13 — numer na znaczniku grupy (§4 „znaczniki grup”)',
}

PORTED_WEB = ['_doMove', '_doMeleeAttack', '_doRangedAttack', '_attackGate', '_animateRam', '_attackWallTile',
              '_spawnCatapultBoulder', '_breachWallTile', '_breachGate', '_startRout', '_startFade', '_fleeStep',
              '_tickProjectiles', '_tickFades', '_spawnDamageLabel', '_spawnWallLabel', '_updateGroupFrameMarker',
              '_removeGroupFrameMarker', '_syncAllGroupFrameMarkers', '_setDeployZoneVisible',
              '_removeUnitFromScene', '_updateHpBar', '_updateMoraleBar', '_updateAmmoBar']

ZP = 'ZPORTOWANY (cz. 4)'
ZC = 'ZPORTOWANY częściowo (cz. 4: część sceny)'
WD = 'WSPÓLNA (domena P6.13) — scena dostaje wynik w DTO (Z-36-13)'
PD = 'PODZIAŁ: logika → P6.13; część sceny = wywołania funkcji zportowanych (kolumna `woła`)'
LG = 'NIE-DOTYCZY sceny (logika → P6.13)'

S = {
    103: (ZP, '`MOVE_STEP_MS`; test `constants_and_easing_equal_web`; konsument `MoveAnim::sample`'),
    104: (ZP, '`STEP_GAP_MS`; test `constants_and_easing_equal_web` — odstęp kroków planuje harmonogram (P6.13)'),
    108: (ZP, '`DEATH_FADE_MS`; test `constants_and_easing_equal_web`; konsument `Fade::progress`'),
    140: (ZP, '`MORALE_GATE_BREACH`; test `constants_and_easing_equal_web` — odjęcie morale robi logika, scena: `update_morale_bar`'),
    105: (ZP, '`RANGED_FLY_MS`; test `constants_and_easing_equal_web`; `Projectile::dur`'),
    106: (ZP, '`RANGED_GAP_MS`; test `constants_and_easing_equal_web` (harmonogram → P6.13)'),
    109: (ZP, '`BLOW_LUNGE_MS`; `MeleeLunge::pose`'),
    110: (ZP, '`BLOW_HIT_T`; `MeleeLunge::hit_due`'),
    111: (ZP, '`BLOW_SETTLE_MS`; test `constants_and_easing_equal_web` (harmonogram → P6.13)'),
    141: (ZP, '`MORALE_WALL_BREACH`; test `constants_and_easing_equal_web` (= 0)'),
    195: (ZP, '`projectile_kind` / `ProjectileKind`; test `projectiles_match_web` (306 par kategoria × nazwa)'),
    196: (ZP, '`make_projectile_mesh`; test `projectiles_match_web` (4 rodzaje, pełne rekordy węzłów)'),
    723: (ZP, '`lerp`; test `constants_and_easing_equal_web`'),
    724: (ZP, '`ease_out`; test `constants_and_easing_equal_web`'),
    725: (ZP, '`ease_in`; test `constants_and_easing_equal_web`'),
    286: (ZP, '`RamAnim` (`start`, `sample`, `step`); test `dynamics_match_web` (2 przebiegi, w tym przerwany `finished`)'),
    285: (ZC, '`RamAnim::start` (kierunek do bramy z bieżącej pozycji) — obrażenia bramy / `gateHp` / HUD → P6.13 / P5'),
    298: (ZP, '`Boulder` (`spawn`, `sample`, `step`); test `dynamics_match_web`'),
    297: (ZC, '`wall_shot_endpoints` + `Boulder` — obrażenia kafla / `wallTileHp` / harmonogram 700 ms → P6.13'),
    300: (ZC, '`breach_wall_tile` (kafel → Plains, segmenty ukryte, 7 brył gruzu), `retreat_from_wall` — wybór pola odwrotu, zniszczenie katapulty obrońcy, morale → P6.13 (DTO)'),
    301: (ZC, '`breach_gate` (kafle bramy, brama + elementy przy bramie ukryte) — morale −5 → DTO, paski `update_morale_bar` (cz. 3)'),
    302: (ZC, '`FloatLabel::wall` — element DOM, tekst, kolor → P5'),
    354: (ZC, '`FloatLabel::damage` — element DOM, tekst, kolor → P5; rzut na ekran → cz. 5'),
    330: (ZC, '`FloatLabel::sample` (wzniesienie, krycie `1 − p²`, wygaśnięcie) — `worldToScreen` → cz. 5, styl DOM → P5'),
    318: (ZC, '`MoveAnim` (`start`, `sample`, `step`) — zajętość, koszt ruchu, `_autoBatchPlanning` → P6.13; nowy kierunek → DTO (`set_facing`)'),
    322: (ZC, '`MeleeLunge` (`start`, `pose`, `hit_due`, `step`) + `set_facing` — cios / kontra / etykiety decyduje logika'),
    323: (ZC, '`ranged_shot_endpoints`, `launch_projectile`, `set_facing` (+ `update_ammo_bar`, cz. 3) — cios po locie → P6.13'),
    328: (ZP, '`tick_projectiles`, `Projectile::sample`; test `dynamics_match_web` (4 pociski × 10 chwil)'),
    329: (ZP, '`tick_fades`, `Fade::step`; test `dynamics_match_web`'),
    353: (ZC, '`Fade` (`start`) — SFX → P5, zajętość → P6.13'),
    350: (ZC, '`rout_facing` + `set_facing` — `routed`/`acted`/rejestr ucieczek/efekty morale → P6.13'),
    324: (ZC, '`billboard`, `billboard_all`, `deploy_phase_frame` — zegar wirtualny / timery → P6.13, kamera (`_tickZoom`, `_tickCameraPanKeys`) → cz. 5, minimapa / morale armii / roster → P5'),
    455: (ZC, '`set_deploy_zone_visible` — etykiety połówek (DOM) → P5'),
    626: (ZC, '`end_deploy_phase` (+ `clear_deploy_ghosts`, `clear_order_preview`, `dispose_all_order_lines` z cz. 3) — migawki grup, zaznaczenie, UI, start bitwy → P6.13 / P5'),
    700: (ZP, '`GroupNumberTexture` (`ops`, `SIZE`) — rasteryzacja canvas → rasteryzator tekstu (NIE_ZMIERZONO wzrokowo)'),
    701: (ZP, '`GroupMarkers::remove`'),
    702: (ZP, '`GroupMarkers::update` (`Line` w `FieldScene::lines`, `Sprite`)'),
    703: (ZP, '`GroupMarkers::sync_all`'),
    549: (ZP, '`group_display_num`, `js_parse_int10`'),
}
for n, why in {
    5: 'kierunek do celu = decyzja logiki; scena: `set_facing` z kierunkiem z DTO',
    6: 'kierunek ataku / zwrot = decyzja logiki; scena: `set_facing` z kierunkiem z DTO',
    92: 'odstęp strzelców (wybór kroku) — logika', 93: 'odstęp od walczących wręcz (wybór kroku) — logika',
    97: 'bród: koszt kroku `moveLeft` w `_doMove` — logika (animacja kroku bez zmian)',
    102: 'kara AI za bród (punktacja pola) — logika',
    212: 'kierunek natarcia → wybór celu / trafienia — logika',
}.items():
    S[n] = (WD, why)
for n in (251, 252, 253, 260, 261, 262, 266, 267, 268, 273, 277, 279, 283, 284, 305, 306, 319, 349, 351, 658, 659):
    S[n] = (PD, 'decyzja (cel, krok, ucieczka, rozbicie) → P6.13; skutek w scenie przez funkcje z kolumny `woła`')

rows = []
for line in open(inv, encoding='utf-8'):
    if not line.startswith('| '):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if c[0].isdigit():
        a, b = [int(x) for x in c[1].replace('–', '-').split('-')]
        rows.append((int(c[0]), a, b, c[3].strip('`'), c[10]))

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
    return ident.startswith('_') or ident.endswith('_web') or (ident[0].islower() and '_' not in ident and ident != ident.lower())


bad = 0
counts = {}
out = ['| # | linie | symbol | źródło | woła (zportowane; bezpośrednio / pośrednio) | status cz. 4 | Rust / powód |',
       '|---|---|---|---|---|---|---|']
for n, a, b, sym, st in rows:
    if 'RUNDA-4' in st:
        tag = 'RUNDA-4'
    elif n in FROM_Q2:
        tag = 'cz. 2 → cz. 4'
    elif n in FROM_Q3:
        tag = 'cz. 3 → cz. 4'
    elif n in ADDED:
        tag = 'dołączony'
    else:
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
    out.append(f'| {n} | {a}–{b} | `{sym}` | {tag} | {", ".join(calls) if calls else "—"} | {status} | {why} |')
missing = sorted((FROM_Q2 | FROM_Q3 | set(ADDED)) - {r[0] for r in rows})
for n in missing:
    print(f'BRAK WIERSZA #{n} w inwentarzu', file=sys.stderr)
    bad += 1
print('\n'.join(out))
total = sum(counts.values())
print(f'LICZNIK: wierszy = {total}; ' + '; '.join(f'{k} = {v}' for k, v in sorted(counts.items()))
      + f'; bez statusu / niezgodnych = {bad}', file=sys.stderr)
sys.exit(1 if bad else 0)
