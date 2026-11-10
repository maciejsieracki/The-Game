STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1
GOAL: Każda odłożona bitwa w kolejce ma się zamknąć (ekran, rozstrzygnięcie lub odrzucenie przy błędzie), a wyjątek w ścieżce bitwy nie może zostawić kolejki bez ekranu i bez flusha.
ZMIANY/COMMIT: baza 25bffd17 (runda 2), commit r3 w worktree (SHA w odpowiedzi orkiestratora). Pliki:
- gra/src/main.ts: (1) finishIncomingBattleUi() -- flush kolejki w bloku finally (try/catch, console.warn, hidePreBattle() po wyjątku), dawniej za try/finally bez catch, czyli wyjątek w onResolved() pomijał flush; (2) endActiveHumanTurn(), finally -- gołe flushDeferredAutoPreBattle() zastąpione flushDeferredPreBattleSafely('endActiveHumanTurn'), przed flushPendingEraChangeToast() i syncPlayerUnitSelectionOnMap(). Zmienione funkcje: finishIncomingBattleUi, endActiveHumanTurn (+ komentarz flushDeferredPreBattleSafely). Bramka canPlayerInitiateEndTurn, hintEndTurnBlocked, watchdog, healStuck: BEZ ZMIAN.
- gra/tools/endturn-battle-deadlock-test.cjs: piny A7, A7b, A8, A8b; część C (wrapper z main.ts wyciągnięty ze źródła i wykonany na prawdziwej kolejce ui/preBattle.ts; mutant bez siatki).
- ui/preBattle.ts, gra/src/game/**, gra/src/battle/**: BEZ ZMIAN (brak dowodu, że są przyczyną).
- dyspozycje/autobot/runs/R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1/01-operator-r3.md.
Brak push, brak deployu, WERSJE.md nietknięte.

TESTY:
- endturn-battle-deadlock-test: 37/0 (było 29/0; C1, C1b, C1c, C2 -- wrapper z main.ts: wyjątek nie wychodzi, brak ducha scrimu, FIFO C-PRE/C-AFTER; mutant bez try/catch rzuca = czerwieni C2).
- tsc --noEmit: czysto (exit 0).
- vite build (bezpośredni, outDir w scratchpad): OK, 40 s.
- koniec-tury-f1-f4-runda3-test: 38/1 (ten sam FAIL F1-A3, pin sprzed r3; bez zmiany). Wcześniejsza wersja r3 psuła F1-A4 -- naprawione przez inline try/catch zachowujący literał flushDeferredAutoPreBattle(); po onResolved().
- koniec-tury-g1-g2-runda4-test: 37/1 (ten sam FAIL A8 kontrola G2, jak na bazie r2).
- heal-stale-blockers-pending-battle-test: 23/0. barbarzyncy-podwojny-atak-prebattle-test: 18/0.
- barbarzyncy-krazenie-test: 249/0. barb-city-behavior-test: 177/0. logic-test: 213/213. ai-test: 276/18 (bez zmian względem zgłoszonego).
- war-allin-capital-test: 85/6 -- stan istniejący na bazie (wszystkie 6 FAIL w sekcji 6: "baza nie zawiera modułu" i hashe 6b/6c vs referencja pre-feature). Nie naprawiano.
- NIE_ZMIERZONO: test wykonawczy w Chromium (/opt/pw-browsers) na pełnym bundlu gry -- NIE wykonany (main.ts jest monolitem bez hooka do kolejki; wymaga ruchu przez kreator gry; odłożone). Zamiast tego część C wykonuje prawdziwy kod wrappera z main.ts na prawdziwej kolejce.

PRZYCZYNA KORZENIOWA (stan dowodowy):
- DOWIEDZIONE (czytaniem kodu + testem): (a) advanceSeat()/triggerPlayerEndTurn() wołały sprzątacz kolejki ZA bramką canPlayerInitiateEndTurn(), która odrzuca przy hasPendingAutoPreBattle() -- naprawione w r1/r2 (pin A1, A2); (b) finishIncomingBattleUi(): wyjątek w onResolved() przerywał funkcję PRZED flushem -- naprawione w r3 (A7); (c) endActiveHumanTurn(): wyjątek w showPreBattle w finally pomijał flushPendingEraChangeToast/syncPlayerUnitSelectionOnMap -- naprawione w r3 (A8).
- SYMULACJA wpływu reguły WAR_ALLIN (war-allin-capital-quick.cjs 90 tur, harness bez kolejki main.ts): OFF -> ON battles: aiVsPlayer 0 -> 9 (captures 0 -> 2, owner 0 traci miasta), aiVsAi 0 -> 41, barbarians 0 -> 3. Reguła ZWIĘKSZA liczbę bitew, w tym ataki AI na gracza (jedyna kategoria trafiająca do kolejki). Liczby w kolejce main.ts: NIE_ZMIERZONO (harness nie modeluje kolejki).
- NIE_ZMIERZONO: kto w turze 43 zostawił kolejkę niepustą bez ekranu w zgłoszonej grze. Kandydat z dowodem statycznym: (b) lub zerwany stan isPreBattleOpen()===true przy niewidocznym overlayu (brak dowodu, nie badano usuwania overlayu z DOM). Hipoteza stale isDiplomacyAudienceOpen() (rootEl.style.display !== 'none' przy niewidocznym modalu) -- NIE_ZMIERZONO.

BLOKADY:
- Test w Chromium na pełnym bundlu: NIE wykonany (patrz wyżej) -- wymagany przed READY_FOR_DEPLOY, jeśli Evaluator to uzna za twardy warunek.
- Przyczyna korzeniowa w grze właściciela: nie potwierdzona (zapis gry potrzebny).
- Mutacja siatki w finishIncomingBattleUi (bez try/catch) NIE jest pokryta testem wykonawczym (closure w boot); pokryta tylko pinem A7 i testem wrappera C.

ZAŁOŻENIA: (1) kolejka = najazdy na gracza (wg FC); (2) 50 ms watchdog z r2 bez zmian; (3) wrapper w finishIncomingBattleUi rozpisany inline (ta sama semantyka) dla zachowania pinów F1-A4.

RUNDY: 3/5 (Operator, odpowiedź na FAIL FC r2: punkt 1 częściowo, punkt 2 częściowo, punkt 3 zrobione)
NASTĘPNY KROK: Evaluator na commicie r3; do rozstrzygnięcia: brak testu w Chromium (wymóg twardy?) i brak dowodu przyczyny w zapisie właściciela.
DEPLOY/PUSH: NIE WYKONANO
