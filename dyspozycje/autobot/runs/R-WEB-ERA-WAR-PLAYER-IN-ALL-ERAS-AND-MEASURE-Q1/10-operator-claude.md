# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (częściowy zakres: kod + testy; narzędzie pomiarowe, bieg dymny i scenariusz silnikowy NIE wykonane)
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz (ownerId 0) jako cel wojen epoki Kamienia, Brązu i Żelaza na równi z AI, także w fallbacku wolnego celu i w parowaniu.
ZMIANY-COMMIT: baza 49f8e1ea8; commit z kodem i testami (SHA w polu sha wyniku). Allowlista: gra/src/game/forced-war-common.ts, gra/src/main.ts (2 hunki), gra/tools/forced-war-{bronze,iron,stone}-test.cjs, forced-war-reguly-multi-turn-simulation-test.cjs, era-war-bronze-player-target-test.cjs, era-war-defer-not-cancel-test.cjs (regex), nowy gra/tools/era-war-player-included-test.cjs.

AUDYT (plik:linia, baza 49f8e1ea8):
- Kamień: gracz w puli przez main.ts ~45568 (isPlayerEligibleForEraWarPool); parowanie OK. Fallback celu dla Kamienia celowo WYŁĄCZONY (limit R2 celu, forced-war-common.ts ~537) — NIE ZMIENIONO; to decyzja projektowa, wymaga potwierdzenia (patrz UWAGI).
- Brąz i Żelazo: gracz w puli i w parowaniu OK; fallback wolnego celu WYKLUCZAŁ gracza (forced-war-common.ts:549 `cand.ownerId === 0`) — NAPRAWIONE; main.ts freeTargetCandidates (~45682) nie zawierał gracza — DODANE (gdy playerCity istnieje oraz opcja K2 „wojna epoki z udziałem gracza” ON lub flaga K2 OFF).
- Opcja K2 OFF nadal wyklucza gracza (main.ts ~45580); to świadoma opcja gracza, NIE zmieniona. Tekst gra/data/ui-params.json:185 opisuje stan OFF i jest nadal prawdziwy; nie zmieniany.
- Progi: war-rules-params.json bez zmian (40/40/40, licznik 1, odpoczynek/koszty bez zmian).

NAPRAWA: 2 hunki (forced-war-common.ts, main.ts) + zmiana komentarzy. Bez zmiany progów, kosztów, liczników.

TESTY:
- tsc (gra/node_modules/.bin/tsc --noEmit --ignoreDeprecations 6.0): 1 linia wyjścia w tsc2.txt; brak błędów w zmienionych plikach (pełny baseline nie porównywany NIE ZMIERZONO).
- era-war-player-included-test.cjs: 10 OK / 0 FAIL. Mutacja (przywrócone `cand.ownerId === 0`) -> T1 FAIL (cel 5 zamiast gracza 0): test czerwony.
- era-war-defer-not-cancel-test: 28/0 (regex asercji Z4 zaktualizowany do nowej formy freeTargetCandidates).
- forced-war-bronze-test 48/0 (było 45/3; progi 20->40, etykiety).
- forced-war-iron-test 55/0 (było 54/1).
- forced-war-reguly-multi-turn-simulation-test 48/0 (było 43/5; Kamień 25->40, Brąz 20->40, pętla 60/100 tur, oczekiwane tury 40/50/80).
- forced-war-stone-test 31/0 (było 28/3, progi 25->40).
- era-war-bronze-player-target-test 44/0 (było 42/2; S2c/S6 progi z JSON, poolStartTurn z JSON).
- era-war-delays 55/0, era-war-ignore-treaties 22/0, era-war-all-eras 10/0, forced-war-trojstronna 23/0.
- logic-test 213/213, research-test 33/0, ai-unit-replace-same-rules 45/0, combat-test OK.
- tech-tree 20 i pozostałe NIE URUCHOMIONE.
- Kopie bazy (git archive 49f8e1ea8) NIE porównywane dla testów poza stone/bronze-player: tam baza miała te same czerwone asercje (threshold debt).

BLOKADY / NIE ZMIERZONO:
- Narzędzie pomiarowe (__eraWarMeasure, era-war-measure-run.cjs): NIE ZROBIONE.
- Bieg dymny seed 4242/7, 120 tur, Chromium: NIE WYKONANY.
- Scenariusz silnikowy Kamień trwa -> Brąz pending -> pokój -> start (przez main/esbuild): NIE ZROBIONY; test T1-T6 działa na czystej logice.
- Realne wypowiedzenie wojny AI->gracz w Brązie/Żelazie w ai.ts (targetId 0 w ścieżce fallbacku): założono zgodność z istniejącą ścieżką domino (targetId 0), NIE ZMIERZONO w silniku.

UWAGI-DLA-ORKIESTRATORA:
1. Kamień bez fallbacku: dispatch wymaga gracza „we wszystkich epokach, także w fallbacku”. Obecny kod celowo nie robi fallbacku dla Kamienia (limit R2). Decyzja właściciela potrzebna (ABC): czy Kamień też ma dostać fallback wolnego celu.
2. Brak node_modules w worktree: wykonano `npm ci --ignore-scripts` w gra/ (tylko lokalnie, untracked, nie commitowane).
3. Pliki pomocnicze testu (.era-war-player-included-entry.ts, .era-war-player-included-bundle.cjs) są generowane i nie są commitowane.
4. Zmiana tylko w pętli wojen epoki, bez nowego UI.

NASTĘPNY KROK: runda 2 (Operator) — pomiar `__eraWarMeasure` i bieg 120 tur seed 4242/7; decyzja ABC w punkcie 1.
DEPLOY-PUSH: NIE WYKONANO
