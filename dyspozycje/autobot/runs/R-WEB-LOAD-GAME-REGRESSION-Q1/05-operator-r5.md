STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LOAD-GAME-REGRESSION-Q1
GOAL: Wczytanie zapisu z menu głównego i pauzy działa (także po przeładowaniu i przy zapisach FSA/IDB); autozapis sygnalizuje błąd graczowi; blokady wczytania (kolejka bitew, endTurnInProgress) są czyszczone.
ZMIANY/COMMIT: baza ee8e7034 (łańcuch 1d7ddb3b..ee8e7034). SHA commita r5: w odpowiedzi orkiestratora. Allowlista r5 (git add jawny):
- `gra/src/main.ts` (tylko): nowa `notifyAutosaveFailureOnce()` + flaga `autosaveFailureNotified` (obok `fsaAutosaveDegradedNotified`, ~31314); 4 miejsca nieudanego autozapisu (migawka, zapis localStorage, catch rotacji, catch wywołania) przechodzą przez nią zamiast `showHintMessage` co turę. Logika kolejki bitew NIE ruszona. Zmienione funkcje: doRotatingAutosave (3 miejsca), runWorldEndTurn (catch wywołania doRotatingAutosave, ~31812).
- `gra/tools/load-game-regression-test.cjs`: grupy 6a-6b (mutacje hasAnySaveSlot i cache), 7a-7c (notifyAutosaveFailureOnce: prawdziwa funkcja z main.ts, mutacja bez strażnika).
- `gra/tools/load-game-blockers-exec-test.cjs` (NOWY, wykonawczy): wyciąga prawdziwe ciała resetEndTurnBlockers, prepareSessionForLoad, healStaleEndTurnBlockers, canPlayerInitiateEndTurn; prawdziwa kolejka ui/preBattle.ts (esbuild+jsdom).
- `gra/tools/load-game-regression-e2e-r5.cjs` (NOWY, Chromium): scenariusze A-FSA, A-IDB, B-PROMPT, D-EMPTY.
- `dyspozycje/autobot/runs/R-WEB-LOAD-GAME-REGRESSION-Q1/05-operator-r5.md` (ten raport).
Brak zmian w gra-robocza/**, WERSJE.md, rust-port/**, src-tauri/**, package-lock.json. Bez push, bez deploy.

PUNKTY ZAMÓWIENIA R5:
(c) WYKONAWCZO (load-game-blockers-exec-test): kolejka odłożonych bitew niepusta + blokady -> prepareSessionForLoad: kolejka pusta, endTurnInProgress/aiCmdResume/aiTurnAwaitingBattle=false, canPlayerInitiateEndTurn()===true (L1). Otwarty ekran bitwy + kolejka -> ekran zamknięty, koniec tury odblokowany (L2). Kontrola K1: bez wczytania blokada zostaje. Mutacje: M1 (bez clearDeferredAutoPreBattleQueue) i M2 (bez hidePreBattle) czerwienią L1/L2. M3 (bez zerowania aiCmdResume) jest RÓWNOWAŻNA: healStaleEndTurnBlockers() zdejmuje osierocony aiCmdResume bez kolejki i ekranu (udokumentowane w teście, nie udaję czerwieni). Wynik: 15 PASS / 0 FAIL.
  Ograniczenie: testuje warstwę blokad, nie pełny loadGameFromSlot.
(c, ≥40 tur) NIE_ZMIERZONO: patrz BLOKADY.
(a) E2E load rzeczywisty (Chromium, bundle Vite z ee8e7034+r5): WYKONANO na 2 tury (turn 2, 1 autozapis).
  - A-FSA: zapis na dysku (1 plik), po reloadzie „Wczytaj grę" AKTYWNY, lista zapisów 1 wiersz, po wczytaniu tura=2, miasta=9, jednostki=12, „Zakończ turę" klikalny, klik podnosi turę do 3. Jedyny FAIL: console.error 404 (URL nieustalony, pojawia się tylko w scenariuszu z nową grą; NIE_ZMIERZONO źródło).
  - A-IDB (bez atrapy FSA): te same wyniki (tura 2 / 9 miast / 12 jedn. / tura->3), 0 błędów konsoli.
  - Stary zapis (sprzed zmian): NIE_ZMIERZONO (brak fixtures z poprzedniego builda; format zapisu w r1-r5 nie zmieniony w kodzie).
(b) wariant prompt: B-PROMPT (queryPermission='prompt' po reloadzie, requestPermission=granted): „Wczytaj grę" AKTYWNY; wczytanie tura=2, miasta=9, jednostki=12. WYKONANO.
(d) S3/D-EMPTY: WYSZAROWANY przy pustym katalogu, podpowiedź „brak zapisów" obecna w tekście przycisku (hint). Atrybut `title` = null (w menu głównym podpis jest tekstem, nie title): zapisane jako fakt, nie błąd.
(e) WYKONANO: nieudany autozapis = jednorazowy showHintMessage na sesję (notifyAutosaveFailureOnce), log konsoli bez zmian; test 7a/7b/7c.
(f) WYKONANO: mutacje 6a (hasAnySaveSlot -> false) i 6b (cache get -> false) czerwienią testy.

TESTY:
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/load-game-regression-test.cjs`: 34 PASS / 0 FAIL (było 29; +6a,6b,7a,7b,7c).
- `node tools/load-game-blockers-exec-test.cjs`: 15 PASS / 0 FAIL.
- `node tools/fsa-autosave-test.cjs`: 55 pass / 0 fail. `node tools/autosave-quota-fail-test.cjs`: 20 / 0. `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/load-game-regression-e2e-r5.cjs --turns 5`: A-FSA, A-IDB, B-PROMPT, D-EMPTY -> FAIL 1 (404 w A-FSA, patrz wyżej); pozostałe PASS.
- `git diff --check` (staged): OK.
- Trial merge: `git merge-tree` HEAD vs origin/main: bez konfliktów (exit 0) przed commitem r5; main.ts r5 łata się czysto (patch -p1 dry-run na origin/main: 4 hunki, offset 15-98 linii). NIE rebasowano.

NOTATKA KRYTYCZNA (dla orkiestratora):
1. origin/main NIE zawiera łańcucha 1d7ddb3b..ee8e7034 (`git merge-base --is-ancestor` = false). Build z origin/main (+ patch r5) reprodukuje objaw właściciela: S1 pauza „Wczytaj grę" wyszarzona „Brak zapisu" mimo pliku autozapisu na dysku; po reloadzie menu główne też wyszarzone. Wydanie z origin/main bez tego łańcucha cofa naprawę presence.
2. Stall zakończenia tury w E2E: w ee8e7034 (i w buildzie z origin/main) po turze 1 (tura=2, autozapis zapisany) kolejny koniec tury zostaje w `endTurnInProgress` (log: `[EndTurn] blocked: endTurnInProgress` powtarzany, `[data-end]` aria-disabled=true przez 240 s). To ta sama klasa co R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1 (nie naprawiana tutaj, zakres DEADLOCK). Ten stall uniemożliwia zebranie ≥40 tur.

BLOKADY:
- ≥40 tur w FSA (≥41 autozapisów, przeładowanie, wczytanie): NIE_ZMIERZONO — stall zakończenia tury po turze 2 (pkt 2 wyżej) i czas na turę; nie zrobiono.
- Zależność od DEADLOCK: stall endTurnInProgress po turze 2 NIE_ZMIERZONO jako przyczyna w kodzie (widziano tylko logi).
- 404 w A-FSA: URL nieustalony (NIE_ZMIERZONO).
- Stary zapis z poprzedniego builda: NIE_ZMIERZONO.
- Atrapa FSA `queryPermission` zawsze zwraca stan z `window.__fakeFsaMode` (granted/prompt), nie prawdziwa przeglądarka.

RUNDY: 5/5 (ostatnia). Werdykt wymaga Evaluatora/Final Control; po limicie rund nie wracam do Operatora bez decyzji właściciela.
NASTĘPNY KROK: Evaluator (Sonnet 5.5 medium) przegląd r5: notifyAutosaveFailureOnce (jednorazowość), exec-test L1-L3/M1-M2, E2E r5. Orkiestrator decyduje: (i) zakres stalla endTurnInProgress po turze 2 (DEADLOCK), (ii) czy wydanie z origin/main ma zawierać łańcuch r1-r5 (pkt 1), (iii) ≥40 tur po naprawie stalla.
DEPLOY/PUSH: NIE WYKONANO
