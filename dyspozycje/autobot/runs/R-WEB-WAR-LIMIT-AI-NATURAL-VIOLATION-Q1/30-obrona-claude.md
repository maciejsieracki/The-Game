STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1
GOAL: limit 1 wojny naturalnej per cywilizacja obowiązuje także przy wciąganiu sojuszników (seed 4242, AI 28, tury 60–67).
ZMIANY/COMMIT: baza 5b975a72af013c5e551f7a848deaa0016f24e28e (kod operatora). Obrona: gra/src/game/diplomacy-war-limit.ts (+26: PendingPrincipalWar + pendingPrincipalCounts przeniesione do modułu czystego), gra/src/main.ts (-15/+4: usunięta lokalna definicja, import + wywołanie z callbackiem statusu), gra/tools/war-limit-ai-natural-test.cjs (test rdzenia (a2) + poprawione (c)), gra/tools/war-rules-multiwar-main-guard-test.cjs (okno 2600→3200), ten raport. SHA = czubek commita obrony (podany w polu sha odpowiedzi).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — REGRESJA main-guard (20 PASS / 1 FAIL) — PRZYJMUJĘ, naprawione
- Przyczyna: w tests/war-rules-multiwar-main-guard-test.cjs asercja „bramka sojusznika PRZED joinAllyToWar" szuka w oknie 2600 znaków od `function applyAllianceObligationsOnWar`. Dopisanie pendingPrincipal wypycha joinAllyToWar na offset 2771, więc joinIdx=-1.
- Naprawa: okno 2600 → 3200 (komentarz w pliku). Asercja kolejności została (nie osłabiona).
- Wynik po naprawie: `node tools/war-rules-multiwar-main-guard-test.cjs` → 21 PASS / 0 FAIL (zgodnie z bazą 78c6d8bf6: 21/0).

### Zarzut 2 — test dowodowy nie pokrywa rdzenia — PRZYJMUJĘ, naprawione
- Przyczyna: rdzeń pendingPrincipalCounts był wewnątrz closure boot() w main.ts, więc test wykonywał tylko czysty warLimitAllows i dopasowania tekstowe.
- Naprawa: pendingPrincipalCounts wyniesiony do czystego modułu gra/src/game/diplomacy-war-limit.ts (z typem PendingPrincipalWar; statusOf jest wstrzykiwany jako callback). main.ts importuje helper i przekazuje `(x, y) => getDiploRelation(x, y).status`. Test (a2) bundluje moduł przez esbuild i wykonuje helper na 5 przypadkach: owner 28 + oczekująca 1↔28, pomijany 22 → true; pomijany = partner 1 → false; para już 'wojna' → false; owner 22 spoza pary → false; atakujący 1 z pomijanym 28 → false.
- Mutacja (własna, zarzut 2): ciało pendingPrincipalCounts zastąpione przez `return false` → `war-limit-ai-natural-test: PASS 14 / FAIL 1` (FAIL: „rdzeń: obrońca 28 z oczekującą 1↔28 liczy się"). Przywrócono plik (cmp identyczny).
- Mutacja (z raportu operatora, usunięcie argumentu pendingPrincipal w bramce sojusznika) → `PASS 13 / FAIL 2`. Przywrócono main.ts (cmp identyczny).
- Wynik zwykły: `war-limit-ai-natural-test: PASS 15 / FAIL 0`.

### Zarzut 3 — brak biegu seed 4242 do tury 67 — PRZYJMUJĘ, NIE ZMIERZONO (z powodem)
- Próba: vite build bundla poza repo (`./node_modules/.bin/vite build --outDir <scratchpad>/dist --emptyOutDir`) została odrzucona przez klasyfikator uprawnień trybu auto (decyzja środowiska, nie błąd gry). Nie obchodziłem tej blokady. Bez bundla runner live (diplomacy-harder-measure-run.cjs / limits-measure) nie wystartował, więc nie zebrano logu deklaracji ani biegu 67 tur.
- Dowód ścieżki 22↔28 nadal POŚREDNI (dane MEAS79 tura 59–60 + kod), jak w raporcie operatora §2. Kryterium binarne z pkt 4 dispatchu (bieg weryfikujący) NIE ZMIERZONO → do wykonania przez FC lub kolejną rundę po dopuszczeniu buildu: `node tools/limits-measure.cjs` na nowym biegu seed 4242, oczekiwane maksimum wojen naturalnych AI <= 1.

### Zarzut 4 — bramki wybiórcze — PRZYJMUJĘ, uruchomione wszystkie wymienione (liczby z surowego wyjścia tej rundy, cwd gra/)
- `./node_modules/.bin/tsc --noEmit -p tsconfig.json` → exit 0
- logic-test → LOGIC OK (213/213), exit 0
- tech-tree-test → 20 pass, 0 fail
- research-test → PASSED 33 / FAILED 0
- combat-test → COMBAT TEST 6/6 pass
- unit-replace-test → WSZYSTKIE TESTY ZIELONE (21/21)
- unit-replace-archer-slinger-test → 51 OK, 0 FAIL
- unit-replace-full-cost-test → 40 passed, 0 failed
- unit-replace-multitype-walk-test → 25 OK, 0 FAIL
- unit-replace-promotion-table-test → PASS: 32 wpisów, 63 krawędzi, brak cykli
- unit-replace-army-multi-select-test → WSZYSTKIE TESTY ZIELONE (36/36); część Chromium/live NIE ZMIERZONO
- ai-unit-replace-same-rules-test → 45 passed, 0 failed
- ai-test → 297 passed, 0 failed
- era-war-pairing-alliance-test → 19 pass, 0 fail
- ai-ai-alliance-surcharge-test → RESULT: ALL GREEN (live + mutants detected)
- war-rules-multiwar-test → WYNIK: 57 OK / 0 FAIL
- war-rules-multiwar-main-guard-test → 21 PASS / 0 FAIL
- diplomacy-war-limit-unit-test → pass=57 fail=0
- diplomacy-war-limit-analyze-test → pass=17 fail=0
- alliance-war-obligation-test → 14 passed, 0 failed
- war-limit-ai-natural-test → PASS 15 / FAIL 0 (mutacje: 14/1 i 13/2)
- NIE URUCHOMIONO: testy wymagające Chromium live (war-rules-multiwar-live-test, testy live wojen) — brak buildu/przeglądarki w tej rundzie.

## 1. Reguła limitu (z kodu, bez zmian względem raportu operatora)
- gra/src/game/diplomacy-war-limit.ts: maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja; warLimitAllows odmawia, gdy atakujący lub obrońca ma już tyle wojen danego typu (maxWojenNaturalnych = 1 w data/diplomacy-war-limit-params.json). Brak wyjątków „przyłączenie przez sojusz" i „przejęcie miasta" w bramce; force=true (ownerDeclareWarOn z triggerRebelProtectionWarConsequence) omija bramkę — to UWAGA 1 z raportu operatora, nie zmieniano.

## 2. Ścieżka deklaracji 22↔28 — dowód pośredni (jak wyżej, NIE ZMIERZONO log)
- Sojusznik 22 był sprawdzany przez bramkę limitu obrońcy 28 zanim główna wojna 1↔28 została zapisana w relacjach. Poprawka dopisuje wojnę oczekującą do liczenia (pendingPrincipalCounts).

## Zakres zmian (diff HEAD vs 5b975a72a)
- gra/src/game/diplomacy-war-limit.ts: eksport PendingPrincipalWar i pendingPrincipalCounts (czysty moduł; zachowanie identyczne z wersją w main.ts).
- gra/src/main.ts: usunięta lokalna definicja typu i funkcji; import z modułu; wywołanie w warTypesForOwner z callbackiem `(x, y) => getDiploRelation(x, y).status`. Brak innych zmian zachowania.
- Testy: patrz wyżej.

## UWAGI-DLA-ORKIESTRATORA
1. Build vite odrzucony przez klasyfikator uprawnień (tryb auto) — bieg seed 4242 wymaga zgody właściciela na build bundla poza repo albo wykonania przez FC.
2. UWAGI 1 i 2 z raportu operatora (force=true w triggerRebelProtectionWarConsequence; declareWarAfterTruce bez bramki limitu) pozostają otwarte — kandydaci do ABC / osobnego tematu, nie kodowano.
3. Obserwacja: test (a) w war-limit-ai-natural-test.cjs i (a2) bundlują moduł esbuild; wymagają gra/node_modules (npm ci --ignore-scripts wykonane w worktree).

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje diff obrony (main.ts, diplomacy-war-limit.ts, dwa testy) i mutacje; FC: bieg seed 4242 do tury 67 + limits-measure.cjs (po zgodzie na build), potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (obrona po zarzutach Evaluatora; ostatni werdykt: zarzuty 1–4 przyjęte, 3 jako NIE ZMIERZONO)
