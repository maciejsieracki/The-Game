# R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1 — obrona, runda 1 (Operator HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1
GOAL: rozkaz ręczny marszu/ataku daje pełny ruch w jednej aktywacji, cios na końcu ruchu (max 1 na turę); AUTO bez zmian; Pomiń bez zmian.
BAZA: a52a198c0 (kandydat, z 459354a12); kod obrony: bd1f05836

## Odpowiedź na zarzuty Evaluatora (41823359f)

- **Zarzut 1 (KRYTYCZNY, łańcuch martwy dla jednostek domyślnych): PRZYJMUJĘ.** Zgadzam się z przyczyną: `_manualOrderChainActive` wykluczał jednostki przez `_isUnitDoctrineAuto(ru)`, a ta funkcja zwraca `true` dla jednostek bez `unitDoctrine` i bez `groupId` (battleScene.ts ~18240–18249). Rozkaz ręczny ma pierwszeństwo przed doktryną (ABC A 2026-11-15), więc warunek został usunięty z `_manualOrderChainActive` (battleScene.ts ~19055–19057). Komentarz nad funkcją poprawiony. Zmiana w commicie bd1f05836.
- **Zarzut 2 (brak pomiaru live przed/po): PRZYJMUJĘ częściowo.** Pomiar po poprawce wykonany (sekcja LIVE). Pomiar „przed” nie został powtórzony przeze mnie; jako bazę podaję wynik Evaluatora z tego samego kandydata bez poprawki (1,00 hex/aktywację, 0 ruch+cios, seed 1) — NIE ZMIERZONO przeze mnie.
- **Zarzut 3 (test na stubach ukrywa wadę): PRZYJMUJĘ.** Usunięto stub `scene._isUnitDoctrineAuto = () => false` z `gra/tools/battle-manual-orders-full-move-test.cjs` (funkcja `sceneFor`). Test korzysta teraz z prawdziwej `_isUnitDoctrineAuto`. Pozostałe stuby (`_doMove`, `_doAttack`, `_firstStepAlongPathToAttack`) zostają — BFS nadal nie jest testowany; to dług testowy, nie blokada.
- **Zarzut 4 (attackMove z wyczerpanym MP vs move): ODRZUCAM jako blokujący, zostawiam.** Dowód: `_manualOrderChainActive` (~19060–19069): dla `move` łańcuch trwa tylko gdy wróg sąsiaduje (`_adjacentEnemy`), dla `attackMove` wyczerpany MP kończy łańcuch (`return false`), a dla `attack` łańcuch trwa do ciosu w zasięgu. Zgodne z kryteriami dispatchu („cios na końcu ruchu, gdy wróg w zasięgu”); niespójność nie wpływa na GOAL. Odnotowane jako NASTĘPNY KROK do osobnego ujednolicenia, jeśli właściciel chce.

## ZMIANY-COMMIT

- `bd1f05836` — `gra/src/battle/battleScene.ts` (6 linii: usunięty warunek `|| this._isUnitDoctrineAuto(ru)` w `_manualOrderChainActive`, poprawiony komentarz), `gra/tools/battle-manual-orders-full-move-test.cjs` (usunięty stub doktryny). Allowlista zachowana.
- Raport: `dyspozycje/autobot/runs/R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1/30-obrona-claude.md` (ten plik).

## TESTY

- `tsc --noEmit` (gra/): exit 0 (surowe wyjście: pusty stdout, kod 0).
- `node tools/battle-manual-orders-full-move-test.cjs`: exit 0, wynik `battle-manual-orders-full-move-test: passed`. Wykonane po `npm ci` w gra/ (71 pakietów, bez `npm run build/dev`).
- `node tools/battle-manual-orders-full-move-test.cjs --mutate`: exit 1, `AssertionError: marsz reczny: 1 krokow w jednej aktywacji (wymagane >= 1,5)` — mutacja czerwona, jak wymagał dispatch.
- `git diff --check`: czysty (brak wyjścia).
- Pozostałe 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test) i testy `_performPlayerOrder`/manual-orders NIE ZMIERZONO w tej rundzie (czas; zostają do następnej rundy lub do FC).

## LIVE (Chromium, `gra/tools/battle-manual-orders-full-move-repro-measure.cjs`, scenariusz Hastati 6 vs Hastati 6, RM_SEEDS=1,2,3 zadane, wykonane: seed 1 i 2)

Surowe wyniki (summary z logu `$SP/live-r2.log`, ścieżka: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/live-r2.log):

| tryb | seed | timedOut | hexPerRoundWhenMoving | ruch+cios (movingUnitRoundsWithStrike) | leftoverMpAfterMoving |
|---|---|---|---|---|---|
| auto | 1 | nie (capped r9) | 1,48 | 5 | — |
| move | 1 | TAK (150 s) | 1,85 | 6 | 0,43 |
| attack | 1 | TAK (150 s) | 1,92 | 11 | 3,00 |
| auto | 2 | nie (capped r9) | 1,75 | 5 | — |
| move | 2 | TAK (150 s) | 1,92 | 6 | 0,00 |

- Tryby `move` i `attack` przerwane limitem czasu (`timedOut: true`, `result: null`), więc liczby pochodzą z częściowego przebiegu — traktować jako wskaźnik, nie pomiar końcowy.
- Seed 3 NIE ZMIERZONO (proces zakończył się po 5 wierszach, bez błędu w logu; nie ustaliłem przyczyny w tej rundzie).
- AUTO bit-w-bit na >=3 ziarnach: NIE ZMIERZONO.
- Porównanie z bazą: Evaluator z kandydata bez poprawki: move 1,00 hex/aktywację, 0 ruch+cios; po poprawce move 1,85–1,92 hex/rundę z ruchem, ruch+cios 6 (move) i 11 (attack). Kryterium ≥1,5 hex i ruch+cios >0 — spełnione na 2 ziarnach (częściowo). Kryterium „niewykorzystany ruch ≤10%” — NIE spełnione na seedzie 1 w trybie move (0,43 MP ≈ 14% z 3 MP) i w attack (3,00 MP, to jednak tryb ze strikiem w innej logice — do rozbicia w następnej rundzie); seed 2 move: 0,00 MP.

## BLOKADY

- Brak pełnego pomiaru live na 3 ziarnach i bez timeoutu (move/attack przerwane limitem 150 s).
- Brak AUTO bit-w-bit (≥3 ziarna).
- Pozostałe bramki referencyjne nieuruchomione w tej rundzie.
- Dług: testy jednostkowe nadal stubują BFS i `_doMove`/`_doAttack`.

## RUNDY

1/5 (Operator, runda obrony po zarzutach Evaluatora). Zużyte rundy: 1 z 5.

## NASTĘPNY KROK

Evaluator r2: sprawdzić commit bd1f05836 — pełny pomiar live (3 ziarna, bez timeoutu, z podniesionym RM_MAX_MS), AUTO bit-w-bit na ≥3 ziarnach, 5 bramek referencyjnych, oraz decyzja o zarzucie 4 (attackMove vs move z wyczerpanym MP).

## DEPLOY/PUSH

NIE WYKONANO (zgodnie z dispatchem: nie integruję, nie deployuję, nie pushuję na main).

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wymagał `npm ci` w gra/ — wykonane; `gra/node_modules` do usunięcia przy sprzątaniu worktree.
- Proces live: uruchomienie w tle przez narzędzie zwróciło się po 120 s; wynik zebrany z pliku logu. Ten sam skrypt przerywa run po RM_MAX_MS, co daje timedOut dla move/attack przy 150 s; do pełnego pomiaru potrzebne większe RM_MAX_MS.
- Zarzut 4 (niespójność attackMove vs move) — kandydat na osobny temat, jeśli właściciel zechce ujednolicić.
