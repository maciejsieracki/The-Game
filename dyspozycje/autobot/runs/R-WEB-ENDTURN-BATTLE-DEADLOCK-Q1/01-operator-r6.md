STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1
GOAL: Runda 6 (obrona): odpowiedź na zarzuty FAIL Evaluatora/FC po r5 (baza 0191d17e). Zarzut 1 (scena bitwy) i 5 (kolejność bramek) PRZYJĘTE i naprawione z testem; 2 i 4 PRZYJĘTE jako ograniczenia (NIE_ZMIERZONO); 3 ODRZUCONE z dowodem (kolejka nie przyjmuje AI↔AI); 6 bez zmian (brak regresji).
ZMIANY-COMMIT: baza 0191d17e (worktree wf_98b4dae4-219-3, detached). Zmienione pliki: `gra/src/main.ts`, `gra/tools/endturn-battle-deadlock-exec-test.cjs`, `gra/tools/endturn-battle-deadlock-test.cjs`, ten raport. Funkcje zmienione w main.ts: `scheduleDeferredPreBattleQueueWatchdog` (callback: guard scena/podsumowanie), `maybeScheduleDeferredPreBattleQueueWatchdog` (guard), `healStuckDeferredPreBattleQueueOnEndTurnAttempt` (guard na początku: brak flusha i brak czyszczenia przy otwartej scenie/podsumowaniu), `advanceSeat` (sprzątacz tylko gdy playtest/pierwsze miasto/galeria/gameOver nie blokują), `triggerPlayerEndTurn` (deleguje do advanceSeat, bez duplikatu bramki). Nie zmieniono: finally w `finishIncomingBattleUi` ani flush w `endActiveHumanTurn` (celowo bez guarda: w `finishIncomingBattleUi` scena jest jeszcze zarejestrowana, bo `bs.dispose()` idzie PO nim). Commit: SHA w sekcji ODPOWIEDŹ niżej (po commicie).
ODPOWIEDŹ NA ZARZUTY:
- Z1 PRZYJMUJĘ (poprawka+dowód). Potwierdzone: `flushDeferredAutoPreBattle` (ui/preBattle.ts:397) sprawdza tylko isPreBattleOpen i audiencję; `battleUiResolving` jest true tylko w oknie finishIncomingBattleUi. Naprawa: guard `isBattleSceneOpen() || isPostBattleSummaryOpen()` w watchdogu, w planowaniu watchdoga i na początku healStuck (ta ostatnia gałąź obejmuje też 8 s czyszczenie, które mogłoby skasować kolejkę żywej bitwy). Dowód: scenariusz G (G0-G5) + mutacje M5 (healStuck) i M6 (watchdog) czerwienią G.
- Z2 PRZYJMUJĘ jako ograniczenie, NIE_ZMIERZONO. Nie wykazano, jak powstaje stan osierocony na zapisie właściciela ani w Chromium. Mechanizm skutku (brak flusha przy klikaniu) jest wykazany i naprawiony niezależnie od źródła: siatka (watchdog + flush-first) zapewnia, że kolejka się opróżnia. Kandydatów `finishMapBattleUi`/`clearBattleUiState` NIE sprawdzałem w tej rundzie; zostają jako osobny temat.
- Z3 ODRZUCAM (dowód). `showPreBattle` z `auto:true` występuje TYLKO w `gra/src/main.ts:28809` (atak AI/barbarzyńców NA GRACZA, wołany z launchIncomingMapFieldBattle; komentarz tamże mówi, że to jedyne automatyczne wywołanie). Kolejka `deferredAutoRequests` przyjmuje wyłącznie żądania `auto:true` (ui/preBattle.ts:240). Bitwy AI↔AI NIE trafiają do kolejki. Wpływ `WAR_ALLIN_CAPITAL_ENABLED` na liczbę ataków na gracza: NIE_ZMIERZONO.
- Z4 PRZYJMUJĘ jako ograniczenie. Harness wyciąga ciała funkcji z prawdziwego main.ts (brak kopii), ale nie uruchamia main.ts ani Chromium. Brak repro w przeglądarce w tej rundzie (NIE_ZMIERZONO). Ryzyko dryfu tekstowego łagodzą pin-testy i brak cichego pominięcia: `findFn` zwraca null dla brakującej funkcji, a lista obecnych funkcji jest drukowana w teście A.
- Z5 PRZYJMUJĘ (poprawka+dowód). `advanceSeat` wywołuje sprzątacz dopiero, gdy playtestWalkaActive, isAwaitingFirstPlayerCity, galleryOn i gameOver są fałszywe. Duplikat bramki w `triggerPlayerEndTurn` usunięty (podwójne console.warn i podpowiedź znikają). Dowód: scenariusz H1 + mutacja M7 (heal bez warunków) czerwieni H.
- Z6 PRZYJMUJĘ bez zmian. Watchdog używa czasu rzeczywistego tylko do otwarcia UI, bez wpływu na symulację. Nie widzę regresji determinizmu; tsc, logic-test i barbarzyncy potwierdzają.

TESTY (worktree, po poprawce, `gra/`):
- `node tools/endturn-battle-deadlock-exec-test.cjs`: 46 pass / 0 fail (poprzednio 36/0; dodano G0-G5, H1, M5-M7).
- `node tools/endturn-battle-deadlock-test.cjs` (pin tekstowy): 38 pass / 0 fail (A2 przepisane na delegację do advanceSeat).
- `npx tsc --noEmit`: exit 0.
- `barbarzyncy-krazenie-test`: 249 passed / 0 failed. `barb-city-behavior-test`: 177 / 0. `logic-test`: 213/213 OK.
- `ai-test`: 276 passed / 18 failed (bez zmian względem punktu odniesienia).
- `war-allin-capital-test`: 85 passed / 6 failed. Wynik zgodny z raportem Evaluatora dla fcd86933 (różnica w hashach bazy, nie w tym diffie). NIE_ZMIERZONO na czystym origin/main w tej rundzie.
- Build Vite (bezpośredni, wyjście do scratchpadu): OK, 42,8 s.
- `git diff --check`: czysto.

BLOKADY: brak twardych. Otwarte ograniczenia: Z2 (przyczyna powstania stanu), Z4 (brak Chromium), war-allin 85/6 (NIE_ZMIERZONO na bazie).
RUNDY: 6 (obrona po limicie 5/5; wykonano na polecenie orkiestratora, decyzja właściciela wymagana przy kolejnych rundach).
NASTĘPNY KROK: Evaluator r6 (niezależny przegląd G/H i mutacji M5-M7), potem Final Control. Integracja i READY_FOR_DEPLOY tylko przez orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
