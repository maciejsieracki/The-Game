# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora dla kandydata fb11e5ffa)

STATUS: BLOCK (częściowa obrona: zarzuty 4 i 5 częściowo naprawione i pokryte testem; 2, 3, 6 otwarte; bieg 120 tur × 2 ziarna NIE wykonany)
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz (ownerId 0) jako cel wymuszonych wojen epoki Kamienia/Brązu/Żelaza na równi z AI, bez zmian progów (40 tur), liczników i kosztów; narzędzie pomiarowe; bieg dymny; testy.
BAZA: fb11e5ffa (kandydat r3, `git checkout --detach`). W worktree przed startem leżały niezacommitowane zmiany w gra/src/main.ts (hak powodów `not-searched` i zawężenie backfillu Żelaza do epoki 3); zostały zachowane i zweryfikowane (patrz pkt 4 i 5). `gra/node_modules` = symlink do node_modules innego worktree (tylko odczyt, ignorowany przez git). Dysk wolny: 9,2 GB (df / 2026-11-20).

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ. Nie wykazano inaczej; nie ponowiono biegu, więc JSONL seed 7 z dist 23:50 nadal nie pochodzi z końcowego builda. NIE ZROBIONE w tej rundzie. Do wykonania razem z pkt 2.

2. PRZYJMUJĘ, NIE NAPRAWIONO (decyzja, nie błąd kodu do ślepej poprawki). Bramka wskazana z kodu: `gra/src/main.ts:45812` — `rejected`, `reason: 'pairing-unresolved(wszystkie pary zablokowane sojuszem)'`. Zgodnie z regułą R-WEB-ERA-WAR-IGNORE-TREATIES-Q1 aktywny sojusz z napastnikiem blokuje parę; gdy zablokowane są wszystkie pary, pending czeka. Czy takie czekanie (68 tur) ma być dopuszczalne, czy pending ma się odroczyć/wygasnąć, to decyzja właściciela (ABC), nie zmieniam jej w tym temacie. Drugi odnotowany powód (t109 `evaluateEraForcedWarGate:civ-cap-target`) też NIE zbadany dalej. Bieg z logu NIE powtórzony.

3. PRZYJMUJĘ. Testy S6–S8 w `gra/tools/era-war-engine-scenario-test.cjs` nadal składają kroki lustrzanie z funkcji (`turnStep`/`fallbackStep`), a nie wykonują pętli main.ts. Wiązanie z main.ts pilnują piny S9/S10 (regex). NIE ZROBIONE: wykonanie prawdziwego toru main.ts w node. Dodano S10 (zachowanie backfillu Żelaza przez realną `backfillMissingEraEntryTurns` + pin wiązania w main.ts), ale to nie zamyka zarzutu.

4. PRZYJMUJĘ, CZĘŚCIOWO NAPRAWIONO. Hak `__eraWarMeasure` dostał powody dla prób niewystartowania w `gra/src/main.ts` (~l.45498, ~45540, ~45568; `eraWarMeasureRejections.push` z `result: 'not-searched'`). Uwaga uczciwa: etykiety powodów (`prog-tur-od-epoki`, `poza-epoka-lub-tura`, `poziom-trudnosci-1`, `isAlreadyAtWarAnyRole`) są wyliczane w main.ts z warunków, NIE zwracane przez `isEligible*` w ai.ts. Powody z ai.ts (`forcedEraPeaceLock`, licznik, brak celu wewnątrz `ai.ts`) NIE są logowane. Hak nie był uruchomiony na przeglądarce (brak biegu) — NIE ZMIERZONO.

5. PRZYJMUJĘ, NAPRAWIONO (kod), NIE ZMIERZONO na biegu. Przyczyna: `backfillMissingEraEntryTurns(ironEraEnterTurnByOwner, restoredEraOwners, turn)` przy wczytaniu wpisywał wejście w Żelazo także właścicielom w epoce 2, co ustawiało wpis Żelaza wcześniej niż faktyczne wejście. Poprawka: `gra/src/main.ts` ~l.52252–52261 — backfill Żelaza tylko dla `e === 3`. Pokryte przez S10 w `era-war-engine-scenario-test.cjs` (gracz w Brązie nie dostaje wpisu Żelaza; właściciel w Żelazie dostaje; kamień nie dostaje; pin wiązania). Wpływ na przebieg 120 tur NIE ZMIERZONY.

6. PRZYJMUJĘ jako OTWARTE (brak dowodu błędu i brak dowodu poprawności). Etykieta `iron` przy celu w epoce 2 i klucz licznika 0:2 NIE zostały rozstrzygnięte; nie zmieniano logiki. Wymaga decyzji/analizy z biegiem (NIE ZMIERZONO). Dodatkowo: dispatch pkt 6 oczekiwał 40 tur od wejścia gracza w TĘ epokę; obecny kod liczy od wpisu epoki celu (ten sam mechanizm co AI), co jest zgodne z progiem puli gracza w Brązie, ale nie zostało potwierdzone dla Żelaza.

7. PRZYJMUJĘ. Dowody (JSONL, dist, dist2, profile Chromium) leżą poza repo w `/tmp/claude-0/ew4`; nie są w allowliście i nie zostały zacommitowane. Sprzątanie należy do orkiestratora. (Uwaga: podczas tej rundy utworzyłem i usunąłem własny plik tymczasowy `/tmp/x` — nie dotyczy dowodów.)

## Naprawy w tej rundzie (pliki)

- `gra/src/main.ts`: hak pomiarowy `not-searched` (pkt 4, tylko odczyt) + zawężenie backfillu Żelaza do epoki 3 po wczytaniu (pkt 5). Oba zachowują decyzje gry poza logowaniem/wpisem wejścia właściciela w epoce 2.
- `gra/tools/era-war-engine-scenario-test.cjs`: dodano S10 (pkt 5).
- `gra/tools/forced-war-iron-main-guard-test.cjs`: okno regexu `wasPending` 4200 → 6000 (pin kolejności tekstowej; przed zmianą HEAD dawał 35/1, odległość 4548 > 4200; to był FAIL przedistniejący na bazie, nie efekt tej rundy).

## Wyniki testów (surowe, ten worktree, po zmianach)

- `node ./node_modules/typescript/bin/tsc --noEmit`: TSC_EXIT=0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN (33)
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed (6)
- era-war-engine-scenario-test.cjs: WYNIK: 27 OK / 0 FAIL (S1–S10)
- era-war-player-included-test.cjs: WYNIK: 10 OK / 0 FAIL
- era-war-defer-not-cancel-test.cjs: 29 passed / 0 failed
- era-war-delays-test.cjs: WYNIK: 55 OK / 0 FAIL
- era-war-ignore-treaties-test.cjs: 22 pass / 0 fail
- era-war-bronze-player-target-test.cjs: 44 passed / 0 failed
- forced-war-bronze-test.cjs: ALL GREEN
- forced-war-iron-test.cjs: PASSED: 55 / FAILED: 0
- forced-war-stone-test.cjs: PASSED: 31 / FAILED: 0
- forced-war-reguly-multi-turn-simulation-test.cjs: ALL GREEN
- forced-war-bronze-main-guard-test.cjs: WYNIK: 22 PASS, 0 FAIL
- forced-war-iron-main-guard-test.cjs: WYNIK: 36 PASS, 0 FAIL (było 35/1)
- forced-war-stone-main-guard-test.cjs: WYNIK: 15 PASS, 0 FAIL

NIE ZMIERZONO: bieg 120 tur × seed 4242 i seed 7 (pkt 2 z dispatchu rundy 3); tabela per epoka; mutacja S10 nie była wykonywana; hak pomiarowy nie był uruchomiony w przeglądarce.

## BLOKADY

- Bieg dymny 120 tur × 2 ziarna z runnerem wznawialnym — NIE wykonany (wymaga wielu odcinków w Chromium; nie ukończono w tej rundzie).
- Zarzut 2 (pending 68 tur przez sojusz) — decyzja właściciela (ABC), nie naprawiona.
- Zarzut 3 (prawdziwy tor main.ts w teście sekwencji) — nie zrobiony.
- Zarzut 6 (etykieta iron / licznik 0:2) — nie rozstrzygnięty.
- Gracz jako cel Kamienia przez pulę (dispatch pkt 5 rundy 3) — brak dowodu biegiem i brak testu toru.

## RUNDY

4/5 (r1 7b941ba4b FC FAIL; r2 723621fb9 zarzuty; r3 fb11e5ffa zarzuty 1–8 Evaluatora; ta obrona = runda 4 tego ID, na bazie fb11e5ffa + zmiany w worktree).

## NASTĘPNY KROK

Orkiestrator: (a) decyzja właściciela ABC o pending blokowanym sojuszem (zarzut 2) i o etykiecie/liczniku Żelaza dla celu w epoce 2 (zarzut 6); (b) bieg 120 tur × 2 ziarna z runnerem wznawialnym przez osobny temat (pkt 1, 2, 4 zarzutów, dispatch pkt 2); (c) Evaluator ponownie ocenia 4, 5 (kod) i 3 (test).

UWAGI-DLA-ORKIESTRATORA: symlink `gra/node_modules` -> `/home/user/The-Game/.claude/worktrees/wf_d7c71990-f52-1/gra/node_modules` (odczyt; nie usuwać tego worktree bez sprawdzenia). Dowody z biegu r2 w `/tmp/claude-0/ew4` (poza repo). Brak nowych sesji, zadań ani harmonogramów utworzonych w tej rundzie.

DEPLOY/PUSH: NIE WYKONANO
