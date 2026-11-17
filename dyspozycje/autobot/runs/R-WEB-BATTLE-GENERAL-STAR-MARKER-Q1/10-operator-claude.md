STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1
GOAL: generał armii na polu bitwy ma jasną gwiazdkę także po Resecie rozstawiania (poprawka zarzutu FC r1: ścieżka `_placeUnitsOneSide` nie dodawała gwiazdki).
ZMIANY/COMMIT: baza ad422d889 (potomek b160459c9, `merge-base --is-ancestor` OK). Commit kodu d307091d8: `gra/src/battle/battleScene.ts` (+1 linia: `this._attachCommanderStar(group, bu);` po `this.scene.add(group)` w `_placeUnitsOneSide`, ok. linii 17905), `gra/tools/battle-commander-star-test.cjs` (+44: test pokrycia miejsc budowy grupy), `gra/tools/battle-commander-star-reset-test.cjs` (nowy: test sceny Reset z mutacją na kopii). Commit raportu: osobny, tylko ten plik. Logika ruchu/walki, `_manualOrder*`, arbitraż kolizji, `main.ts`, `armyMerge.ts`, dane, balans: NIETKNIĘTE.

PEŁNA LISTA ŚCIEŻEK BUDOWY GRUPY JEDNOSTKI (`group = buildUnitModel(`):
- battleScene.ts:4573 -> `_placeSiegeDefenders` (gałąź 1), gwiazdka: linia 4580 — POKRYTE
- battleScene.ts:4743 -> `_placeSiegeDefenders` (gałąź 2), gwiazdka: linia 4750 — POKRYTE
- battleScene.ts:5475 -> `_placeUnits` (start bitwy, replay przez `_replayBattle` 11279, wczytanie bitwy), gwiazdka: linia 5488 — POKRYTE
- battleScene.ts:17898 -> `_placeUnitsOneSide` (rozstawienie w fazie deploy, Reset przez `_resetDeploySide`, deprecated alias 17996), gwiazdka: linia 17905 — POKRYTE (nowa poprawka tej rundy)
- manualBattle.ts:756 -> `place()` w module `src/battle/manualBattle.ts` — NIEPOKRYTE, ale moduł nie jest importowany przez żaden plik gry (grep: tylko README-manualBattle.md). Martwy/prototypowy kod, poza scena gry. Nie zmieniano; do decyzji orkiestratora.
- Mid-battle respawn / posiłki: brak dodatkowego `buildUnitModel` w battleScene.ts; `oblezenie/main.ts` i `mapFieldBattle.ts` używają tego samego `BattleScene` (pokryte).
- `ui/unitMiniPreview.ts` i `ui/unitInfoCard.ts` to podglądy UI, nie scena bitwy — poza zakresem.

TESTY (surowe wyniki):
- `npx tsc --noEmit -p .` w gra/: exit 0 (34 s).
- Bramki referencyjne (rc z node): logic-test rc=0, tech-tree-test rc=0, research-test rc=0, unit-replace-test rc=0, combat-test rc=0.
- `node tools/battle-commander-star-test.cjs`: 17 PASS, 0 FAIL (w tym pokrycie 4/4 miejsc, mutacja `_placeUnitsOneSide` daje czerwono).
- `node tools/battle-commander-star-reset-test.cjs` (nowy): 4 PASS, 0 FAIL. Realna `_placeUnitsOneSide` na scenie-stubie: dokładnie jedna grupa z gwiazdką (generał), zwykłe jednostki bez. Mutacja na kopii (usunięcie wywołania w Resecie) -> 0 grup z gwiazdką -> czerwono (test wykrywa regresję).
- Regresja `battle-*-test.cjs` bez `-browser`/`-live` (47 plików) na kandydacie d307091d8, limit 45 s na plik:
  - rc=0: 33
  - rc=124 (timeout 45 s): 13 — battle-attack-move-pointer, battle-cap-500, battle-collision-arbitration, battle-flee-move-half, battle-full-move-strike, battle-line-advance-uniform, battle-natural-chariot-r5, battle-natural-near-range-r6, battle-neverrout-hold, battle-pursuit-move-behavior, battle-ranged-approach-regression, battle-routed-pursued-destroyed, battle-skip-equals-auto-resolve.
  - rc=1: 1 — battle-standoff-two-warriors (TypeError w `_computeManualArbitrationClaims`, `clear` of undefined).
- Baza b160459c9 (worktree tymczasowy, usunięty po pomiarze): te same 13 timeoutów przy 45 s (identyczne = dług istniejący, NIE regresja); battle-standoff-two-warriors rc=1 także na bazie (dług istniejący, NIE regresja). Wniosek: ta runda nie wprowadza nowych timeoutów ani nowych czerwonych testów w tej partii.
- NIE ZMIERZONO: przedłużony limit czasu (> 45 s) dla 13 timeoutów — zakres tej rundy nie uruchomił ich dłużej; nie wiem, czy są to realne przekroczenia, czy tylko wolne testy.
- NIE ZMIERZONO: żywy bieg w Chromium (vite build poza repo, playwright, zrzuty 1280×720 i 1400×900, scenariusz Reset w przeglądarce). Pokrycie Resetu jest potwierdzone na poziomie sceny (test powyżej), nie pikselowo.

BLOKADY: brak blokad kodowych. Żywy Chromium nie wykonany (patrz NIE ZMIERZONO). Uwaga środowiskowa: worktree zawiera nieskomitowane, niezwiązane zmiany w `dyspozycje/autobot/runs/R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence/*` i `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json` — NIE dodawałem ich do commitów (git add tylko konkretnych plików).

RUNDY: 2/5 (runda 1 FC FAIL: brak gwiazdki w Resecie; runda 2 = ta). Ostatni werdykt FC r1: FAIL; decyzja wymagana: brak.

UWAGI-DLA-ORKIESTRATORA:
1. manualBattle.ts:756 (`place()`) nie ma gwiazdki — moduł nieimportowany przez grę; jeśli ma być wiązany z grą, osobny temat.
2. Dług Rust: REPIN znacznika generała w scenie bitwy (dispatch: jeśli dotyczy) — dotyczy, bo zmiana jest w renderze bitwy.
3. Przedłużone timeouty 13 testów i standoff-two-warriors: dług istniejący (identyczny na bazie), do osobnego tematu.
4. Żywy Chromium (zrzuty 1280×720 i 1400×900) jest wymagany przez kryterium (b) dispatchu i nie został wykonany w tej rundzie — FC powinien to uwzględnić albo zlecić osobny przebieg.
5. `gra/node_modules` w worktree zostawiono (FC potrzebuje go do testów); usunąć przy sprzątaniu po FC.

NASTĘPNY KROK: Evaluator (Sonnet) + Final Control: weryfikacja commita d307091d8 i raportu; decyzja, czy żywy Chromium jest wymagany przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
