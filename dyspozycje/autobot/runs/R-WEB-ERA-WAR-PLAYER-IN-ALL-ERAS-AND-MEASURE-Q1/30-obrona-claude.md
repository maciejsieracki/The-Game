# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — obrona Operatora (odpowiedź na zarzuty kandydata 723621fb9)

STATUS: BLOCK (częściowa obrona: zarzuty 3, 6, 7, 8 naprawione lub wykonane; 1 częściowo; 2, 4, 5 NIE ZROBIONE w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz (ownerId 0) jako cel wymuszonych wojen epoki Kamienia/Brązu/Żelaza na równi z AI, bez zmian progów (40 tur), liczników i kosztów; narzędzie pomiarowe; bieg dymny; testy.
BAZA: 723621fb9 (kandydat, `git checkout --detach`). Zależności: symlink `gra/node_modules` -> node_modules worktree `wf_a4b57a9a-68d-3` (tylko odczyt, poza git; ignorowany przez git). Dysk wolny po starcie: 3,0 GB (poniżej progu 4 GB dla web; nie instalowano nowych zależności).

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, CZĘŚCIOWO. Dodano `gra/tools/era-war-engine-scenario-test.cjs`: prawdziwe funkcje `war-rules-multiwar.ts` i `forced-war-common.ts` (esbuild bundle) + pin źródłowy wiązania backfillu w main.ts. Wynik: 9 OK / 0 FAIL. Mutant `MUTATE_NO_BACKFILL=1`: 4 OK / 3 FAIL (czerwony). NIE ZROBIONE: pełna sekwencja Kamień trwa -> Brąz pending -> pokój -> start w pierwszej turze po pokoju (wymaga pętli main.ts; nie odtworzona).

2. PRZYJMUJĘ, NIE ZROBIONE. Bieg 120 tur × seed 4242 i seed 7 nie został wykonany w tej rundzie (brak czasu na dwa pełne biegi przeglądarkowe; wolne 3,0 GB; runner `era-war-measure-run.cjs` nadal bez wznawiania; nie zmieniano go). Brak tabeli per epoka. NIE ZMIERZONO.

3. PRZYJMUJĘ i NAPRAWIONO (mutacja wykonana). `gra/tools/era-war-defer-not-cancel-test.cjs` T8: regex nie akceptuje już wersji bez `&& eraWarTargetDelayOk(s.ownerId)` (usunięto alternatywę `\)`). Dodano pin `isPlayerPairGateOpen` (para z graczem) z `eraWarTargetDelayOk(aiOwnerId)`. Mutacja w kopii main.ts (usunięcie obu użyć): 27 OK / 2 FAIL (czerwone). Po przywróceniu pliku: 29 / 0 (zweryfikowane cmp = identyczny z kopią zapasową).

4. PRZYJMUJĘ, NIE ZROBIONE. Hak `__eraWarMeasure` nie zawiera jeszcze powodu odrzucenia próby ani stanu wojny naturalnej/Kamienia w chwili próby. Do następnej rundy.

5. PRZYJMUJĘ, NIE ZROBIONE. Brak testu toru gracza-celu Kamienia i drugiego ziarna. Stan: pin fallbacku Kamienia (`stone` wykluczony z fallbacku) przechodzi (era-war-player-included T4 i S4 w scenariuszu); gracz jako cel Kamienia przez pulę nie jest dowiedziony testem.

6. PRZYJMUJĘ i NAPRAWIONO DEFENSYWNIE (przyczyna źródłowa NIE ustalona). Źródło braku wpisu `bronzeEraEnterTurnByOwner.get(0)`: nie zidentyfikowano, która ścieżka zmienia `player.era` bez `reconcilePlayerEraFromResearch` z `prev < 2` (jedyne przypisania: l.2739 reconcile, ustawienia startu/testów l.30096, 49717, 50858, 51086, 31336, 30923). Poprawka w `gra/src/main.ts` (~l.45605): przed `playerEraPoolEligible` wołane `backfillMissingEraEntryTurns` dla gracza (epoka >= 2 -> wpis Brązu; epoka 3 -> także wpis Żelaza), czyli brakujące wejście = pierwsza tura, w której bramka widzi gracza. Dotąd `undefined` = od razu w puli. Test: S1/S2/S3/S5 w engine-scenario (S2 dokumentuje stare zachowanie). NIE ZMIERZONO na żywo (wojna t81 z zarzutu nie została odtworzona biegiem).

7. PRZYJMUJĘ i NAPRAWIONO (regex pin). Przesunięte wywołanie `cleanupIronForcedWarOnPeace` w `finalizePeaceTreatyBetween` jest ~4709 znaków od sygnatury (okno 4000). Okno zwiększone do 6000 w `gra/tools/forced-war-iron-main-guard-test.cjs` (wynik 36 PASS / 0 FAIL). Analogicznie `forced-war-stone-main-guard-test.cjs`: okno 2600 -> 6000 (wynik 15 PASS / 0 FAIL). Uwaga: to pin kolejności tekstowej, nie test zachowania; zmiana zachowania nie była wykonywana.

8. PRZYJMUJĘ i WYKONANO. Bramki uruchomione w tym worktree (surowe wyjścia): `logic-test.cjs` LOGIC OK (213/213); `tech-tree-test.cjs` 20 pass, 0 fail; `research-test.cjs` PASSED 33/33; `unit-replace-test.cjs` WSZYSTKIE TESTY ZIELONE (21/21); `combat-test.cjs` COMBAT TEST 6/6 pass. `npx tsc --noEmit` (bez flag): exit 0.

## Wyniki testów (surowe, ta runda)

- `npx tsc --noEmit`: TSC_EXIT=0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- era-war-player-included-test.cjs: 10 OK / 0 FAIL
- era-war-delays-test.cjs: 55 OK / 0 FAIL
- era-war-defer-not-cancel-test.cjs: 29 passed / 0 failed
- era-war-bronze-player-target-test.cjs: 44 passed / 0 failed
- era-war-ignore-treaties-test.cjs: 22 pass / 0 fail
- era-war-engine-scenario-test.cjs (NOWY): 9 OK / 0 FAIL; mutant 4 OK / 3 FAIL
- forced-war-bronze-test.cjs: 48 / 0
- forced-war-iron-test.cjs: 55 / 0
- forced-war-reguly-multi-turn-simulation-test.cjs: 48 / 0
- forced-war-stone-test.cjs: 31 / 0
- forced-war-bronze-main-guard-test.cjs: 22 PASS / 0 FAIL
- forced-war-iron-main-guard-test.cjs: 36 PASS / 0 FAIL (było 35/1)
- forced-war-stone-main-guard-test.cjs: 15 PASS / 0 FAIL (było 14/1)

## Pliki zmienione w tej rundzie

- gra/src/main.ts (backfill wejścia gracza przed bramką puli, pkt 6)
- gra/tools/era-war-engine-scenario-test.cjs (nowy, pkt 1)
- gra/tools/era-war-defer-not-cancel-test.cjs (regex T8 + pin playerFirst, pkt 3)
- gra/tools/forced-war-iron-main-guard-test.cjs (okno regexu, pkt 7)
- gra/tools/forced-war-stone-main-guard-test.cjs (okno regexu, pkt 7)
- dyspozycje/autobot/runs/R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1/30-obrona-claude.md (ten raport)

## BLOKADY

- Bieg 120 tur × 2 ziarna (pkt 2) i hak z powodami odrzuceń (pkt 4) — nie wykonane.
- Pełny test sekwencji Kamień -> Brąz pending -> pokój -> start (pkt 1) i tor gracza-celu Kamienia (pkt 5) — nie wykonane.
- Przyczyna źródłowa braku wpisu wejścia gracza (pkt 6) — nie ustalona; poprawka defensywna.
- Miejsce na dysku: 3,0 GB wolne przy starcie tej rundy.

## RUNDY

3/5 (runda 1: 7b941ba4b, FC FAIL; runda 2: 723621fb9, zarzuty z Evaluatora; ta obrona = runda 3 na tym samym temacie).

## NASTĘPNY KROK

Orkiestrator: (a) pkt 2 i 4 wymagają osobnego biegu/rundy z wolnym dyskiem (>= 4 GB) i wznawianiem runnera; (b) pkt 1 i 5 — test sekwencji silnikowej przez tor main; (c) Evaluator ponownie ocenia 3, 6, 7, 8.

UWAGI-DLA-ORKIESTRATORA: symlink `gra/node_modules` w worktree wskazuje na node_modules worktree `wf_a4b57a9a-68d-3` (odczyt). Nie usuwać go przy sprzątaniu tego worktree bez sprawdzenia, że drugi worktree nie jest w użyciu. Brak nowych sesji/zadań utworzonych w tej rundzie.

DEPLOY/PUSH: NIE WYKONANO
