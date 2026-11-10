#!/usr/bin/env python3
"""R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2 r2 (zarzut Ev-2): uzgodnienie wierszy
`RUNDA-2` inwentarza `inwentarz-battleScene.md` (Q1) z portem części 2.

Użycie: python3 -I recon.py <inwentarz.md> <battleScene.ts @ edb8fb56> <src/battle/field.rs>
Wypisuje tabelę Markdown (stdout) i licznik kontrolny (stderr); kod wyjścia 1, gdy
któryś wiersz RUNDA-2 nie ma statusu albo status wskazuje symbol nieobecny w Rust.
Kolumna `odw. cz.2` = liczba odwołań do symbolu (poza jego definicją) w zakresach linii
zportowanych w części 2 (§12); `konsumenci` = symbole inwentarza, w których ciele pada nazwa.
"""
import re
import sys

inv, ts, rs = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(ts, encoding='utf-8').read().split('\n')
rust = open(rs, encoding='utf-8').read()

PORTED = [(618, 630), (676, 708), (734, 771), (774, 774), (872, 872), (905, 905), (1130, 1240),
          (1724, 1739), (1831, 1840), (2080, 2085), (3304, 3366), (3849, 3896), (3987, 4123),
          (4462, 4968), (9872, 9880), (11568, 11679), (15213, 15274), (19442, 19460)]

P = 'ZPORTOWANY (cz. 2)'
# status, Rust / powód
S = {}
for n in list(range(16, 26)) + [45, 46, 47, 49, 50, 51, 52, 53, 54, 94]:
    S[n] = (P, '`pub const` w `battle::field`; test `constants_equal_web`')
S[55] = (P, '`deploy_clear_ranks_for` (+ `battle_safe_cols`); test `helpers_match_web`')
S[147] = (P, '`floor_color`; test `constants_equal_web`')
S[148] = (P, '`floor_color_desert`; test `constants_equal_web`')
for n in range(149, 171):
    S[n] = (P, '`pub const`; test `constants_equal_web` + parytet sceny')
S[171] = (P, '`make_gable_roof_geometry` / `FieldGeo::GableRoof`')
S[197] = (P, '`cell_to_world`; test `helpers_match_web`')
S[204] = (P, '`tile_top_y`; test `helpers_match_web`')
S[220] = ('ZPORTOWANY częściowo (cz. 2) / reszta → cz. 3–5',
          'pola kamery `camTarget/camDir/camDist*` (`:2080-2085`) = `BattleCamera`; pozostałe pola 3D '
          'klasy (jednostki, pociski, nakładki, picking) przechodzą razem z metodami części 3–5, które ich używają')
S[234] = (P, '`carve_wall_tiles` → `SiegeLayout`')
S[236] = (P, '`FieldScene::build_siege_interior_buildings`')
S[240] = (P, '`FieldScene::build_battlefield`')
S[241] = (P, '`build_playable_margin_visuals`')
S[726] = (P, '`lighten`; test `helpers_match_web`')
S[727] = (P, '`blend`; test `helpers_match_web`')

W3 = 'WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 3'
W4 = 'WSPÓLNA (domena P6.13) — kopia w scenie odłożona do cz. 4'
WD = 'WSPÓLNA (domena P6.13) — scena konsumuje tylko wynik (DTO), kopii w scenie nie będzie'
WZ = 'WSPÓLNA (domena, Z-36-3) — wejście części 2 jako DTO'
M3 = 'PRZENIESIONY → cz. 3 (jednostki/nakładki)'
M4 = 'PRZENIESIONY → cz. 4 (dynamika/efekty)'
for n in (3, 4):
    S[n] = (W3, 'brak użycia w polu statycznym; pierwszy konsument sceny `dirYaw` (rozstawienie jednostek)')
for n in (5, 6):
    S[n] = (W4, 'konsumenci `_doMeleeAttack`/`_doRangedAttack`/`_updateFacing` (obrót przy ataku)')
S[91] = (WD, 'konsument `attackRange` (logika zasięgu)')
S[96] = (WD, 'parametry brodu (`combatParamsData.brod`) — mechanika ruchu/walki; w cz. 2 tylko komentarz `:1840`')
S[115] = (W3, 'wysokość pasków HP: `_placeUnits*`/`_placeSiegeDefenders` (cz. 3), animacje (cz. 4)')
S[123] = (WD, 'dziennik starć (`_pushClash`) — logika/UI')
S[125] = (WD, 'morale startowe — `moraleBaseFor`/`RuntimeBattleUnit`')
S[136] = (WD, '`_checkRout` (PODZIAŁ, logika)')
S[142] = (WD, '`_checkEnd` (logika końca bitwy)')
S[144] = (WD, '`_phalanxAction`/`_phalanxStep` (logika)')
S[172] = (WD, '`attackRange`/`movementPoints` (logika); słowo `norm` w `field.rs` to inna, lokalna nazwa')
S[175] = (WD, '`_singleBlow`/`_checkRout`/`computeInstantResult` (logika walki)')
for n in (178, 179, 181, 182, 183, 186, 194):
    S[n] = (W3, 'klasyfikacja jednostek przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`) — część 3')
S[199] = (W3, 'klucz komórki — 40 konsumentów, wszyscy w logice ruchu / jednostkach; pole statyczne go nie używa')
S[208] = (W3, 'obrót jednostki (`_placeUnits*`, `_placeSiegeDefenders`, `_startRout`)')
S[719] = (WD, 'auto-rozstrzygnięcie bez sceny (`skip`)')
S[232] = (WZ, 'domena buduje siatkę; generator testu woła ją w webie (ZAŁOŻENIE Z-36-3/Z-36-4)')
S[233] = (WZ, 'jw.')
S[26] = (WZ, 'jedyny konsument `_fencePlayableZone` (domena, Z-36-3)')
S[95] = ('NIE PORTOWANY — martwa stała w webie',
         '`const UNIT_Y = 0` (`:906`) nie ma użycia w kodzie; jedyne wystąpienie poza definicją to komentarz `:4484`')
for n in (105, 106):
    S[n] = (M4, 'czas lotu pocisku — jedyny konsument `_doRangedAttack`')
for n in (109, 110, 111):
    S[n] = (M4, 'czas ciosu — jedyny konsument `_doMeleeAttack`')
S[120] = (M3, 'kolor strony jednostki: `_placeUnits*`, `_placeSiegeDefenders` (w konstruktorze `sideColor` to inna, lokalna zmienna DOM `:2969`)')
S[141] = (M4, 'jedyny konsument `_breachWallTile`')
for n in (173, 180, 184, 185, 188, 190, 191, 192):
    S[n] = (M3, 'dane jednostki przy rozstawieniu (`_placeUnits*`, `_placeSiegeDefenders`)')
S[195] = (M4, 'rodzaj pocisku — jedyny konsument `_doRangedAttack`')
S[235] = (M3, 'umieszczenie muru w scenie (§4, §12 „Poza zakresem”); mesh muru = część 1')
S[238] = (M3, 'rozstawienie obrońców oblężenia = jednostki (§4 część 3)')
for n in (252, 266, 319, 349):
    S[n] = (M4, 'PODZIAŁ: logika → P6.13; scena dostaje zdarzenia w części 4')
for n in (297, 298, 300):
    S[n] = (M4, 'atak/pocisk katapulty/wyłom w murze — dynamika oblężenia (§4 część 4: `_breachWallTile`)')
S[302] = (M4, 'napis nad kaflem muru po trafieniu (wołany z `_attackWallTile`/`_breachWallTile`)')
for n in (322, 323, 350):
    S[n] = (M4, 'animacje ataku / ucieczki')
S[375] = (M3, 'usuwanie węzłów jednostek (odwrotność `_placeUnits`; wołane z `_replayBattle`)')
S[700] = (M4, 'tekstura znacznika grupy (§4 część 4: znaczniki grup), wołana z `_updateGroupFrameMarker`')
for n in (723, 724, 725):
    S[n] = (M4, 'interpolacja animacji: `_doMeleeAttack`, `_doMove`, `_tickProjectiles`')

rows = []
for line in open(inv, encoding='utf-8'):
    if not line.startswith('| '):
        continue
    c = [x.strip() for x in line.strip().strip('|').split('|')]
    if c[0].isdigit():
        a, b = [int(x) for x in c[1].replace('–', '-').split('-')]
        rows.append((int(c[0]), a, b, c[3].strip('`'), c[10]))


def owner(ln):
    best = None
    for r in rows:
        if r[1] <= ln <= r[2] and (best is None or r[2] - r[1] < best[2] - best[1]):
            best = r
    return best[3] if best else '?'


bad = 0
counts = {}
out = ['| # | linie | symbol | odw. cz.2 | konsumenci | status r2 | Rust / powód |', '|---|---|---|---|---|---|---|']
for n, a, b, sym, st in rows:
    if 'RUNDA-2' not in st:
        continue
    name = sym.split('.')[-1]
    pat = re.compile(r'(?<![A-Za-z0-9_$])' + re.escape(name) + r'(?![A-Za-z0-9_$])')
    refs, users = 0, set()
    for i, l in enumerate(src, 1):
        if a <= i <= b or not pat.search(l):
            continue
        if any(x <= i <= y for x, y in PORTED):
            refs += 1
        users.add(owner(i))
    if n not in S:
        print(f'BRAK STATUSU #{n} {sym}', file=sys.stderr)
        bad += 1
        continue
    status, why = S[n]
    if status.startswith('ZPORTOWANY'):
        ids = re.findall(r'`([A-Za-z_:]+)', why)
        for ident in ids:
            leaf = ident.split('::')[-1]
            if leaf not in rust and not ident.startswith('pub') and leaf not in ('constants_equal_web', 'helpers_match_web', 'camTarget/camDir/camDist*'):
                print(f'BRAK W RUST #{n} {sym}: {ident}', file=sys.stderr)
                bad += 1
    key = status if status.startswith('WSPÓLNA') else status.split(' —')[0].split(' (')[0]
    counts[key] = counts.get(key, 0) + 1
    u = ', '.join(sorted(users)[:3]) + (f' (+{len(users) - 3})' if len(users) > 3 else '')
    out.append(f'| {n} | {a}–{b} | `{sym}` | {refs} | {u} | {status} | {why} |')
print('\n'.join(out))
total = sum(counts.values())
print(f'LICZNIK: wierszy RUNDA-2 = {total}; ' + '; '.join(f'{k} = {v}' for k, v in sorted(counts.items()))
      + f'; bez statusu / niezgodnych = {bad}', file=sys.stderr)
sys.exit(1 if bad else 0)
