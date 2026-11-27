STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-QUIET-CLICK-Q1
GOAL: Domknąć zarzuty Evaluatora (runda 1) do kandydata 7fd21ed0c: pomiar live PRZED/PO oraz rozstrzygnięcie kliku t2→t3 (dispatch pkt 1 i 3) oraz wzmocnić test statyczny.
ZMIANY/COMMIT: baza/kandydat 7fd21ed0c (origin/main 5d5a38a51 + poprawka ENDQUIET). Zmiana w tej rundzie: gra/tools/endturn-quiet-test.cjs (+4 asercje: klik advanceSeat woła wersję głośną; triggerPlayerEndTurn nie woła bramki; dokładnie jedno wywołanie canPlayerInitiateEndTurn(true)). gra/src/main.ts BEZ zmian w tej rundzie (przywrócony po mutacji). Ten plik raportu: dyspozycje/autobot/runs/R-WEB-ENDTURN-QUIET-CLICK-Q1/30-obrona-claude.md. SHA: czubek commita tej rundy (patrz sha w StructuredOutput).

ODPOWIEDZI NA ZARZUTY:
- Zarzut 1 (brak tabeli PRZED/PO): PRZYJMUJĘ. Pomiar live NIE WYKONANO w tej rundzie. Powód: worktree nie ma gra/node_modules (brak vite, potrzebny npm install i build do katalogu poza repo); probe tools/endturn-perf-probe.cjs wymaga live Chromium przez wiele tur (wg ENDPERF Chromium padał ok. t18). Brak tabeli = binarne kryterium dispatchu nie spełnione.
- Zarzut 2 (klik t2→t3 nierozstrzygnięty): PRZYJMUJĘ. NIE ZMIERZONO (ten sam powód co zarzut 1). Rozstrzygnięcie zostaje otwarte.
- Zarzut 3 (test tylko statyczny, nie pokrywa triggerPlayerEndTurn ani advanceSeat): PRZYJMUJĘ i POPRAWIAM. Dodano asercje: (a) advanceSeat() zawiera `if (!canPlayerInitiateEndTurn()) {` i nie zawiera wersji cichej; (b) triggerPlayerEndTurn nie wywołuje canPlayerInitiateEndTurn (deleguje do advanceSeat); (c) w całym main.ts dokładnie jedno wywołanie canPlayerInitiateEndTurn(true) (HUD config.canEndTurn). Dowód mutacji M1: w advanceSeat zmieniono bramkę na canPlayerInitiateEndTurn(true) -> test: `FAIL: advanceSeat (klik) woła wersję głośną` i `FAIL: dokładnie jedno wywołanie wersji cichej (2)`, wynik 8 pass / 2 fail, exit 1. Po przywróceniu main.ts: `10 pass, 0 fail`. Mutacja M1 wykryta. Uwaga: test pozostaje statyczny; nie dowodzi zachowania w czasie wykonania.
- Zarzut 4 (healStaleEndTurnBlockers() ma console.warn w cyklu): ODRZUCAM z dowodem strukturalnym. Każda z czterech gałęzi z warn kasuje własny warunek wyzwalający w tym samym wywołaniu, więc przy kolejnym tyknięciu cyklu warunek jest fałszywy i log się nie powtarza:
  * gałąź 'Clearing stale AI battle resume flags' (main.ts ~43440): ustawia aiTurnAwaitingBattle=false i aiCmdResume=null; warunek hasStaleAiResume wymaga jednego z nich != false/null.
  * gałąź 'Clearing stale endTurnInProgress': ustawia endTurnInProgress=false; warunek wymaga endTurnInProgress.
  * gałąź 'Clearing orphan turn transition overlay': wywołuje endTurnTransition(), które ustawia root=null (src/ui/turnTransitionOverlay.ts:112-121); isTurnTransitionActive() = root != null (linia 108), więc warunek przestaje być prawdziwy.
  * gałąź 'Force-clearing stuck transition (>8s)': ustawia endTurnInProgress=false i endTurnStartedAt=0; kolejny tick ma stuckMs=0.
  Wniosek: każdy warn jest jednorazowy na epizod, a nie na każdy tick 500 ms. Zastrzeżenie: brak pomiaru live tej częstości (NIE ZMIERZONO); ryzyko ponownego uzbrojenia warunku przez inny kod nie jest wykluczone statycznie, ale nie znaleziono takiej ścieżki w tej rundzie.

TESTY (surowe wyniki tej rundy):
- node tools/endturn-quiet-test.cjs (kandydat + nowa asercja): 10 pass, 0 fail, exit 0.
- Mutacja M1 (advanceSeat gate -> canPlayerInitiateEndTurn(true)): 8 pass, 2 fail (czerwony), potem przywrócenie: 10 pass, 0 fail.
- Bramki z dispatchu (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, society-breakdown, ai-city-order-need-wiring, endturn-aria-sync): NIE URUCHAMIANO w tej rundzie. Źródło gry nie zmieniło się od kandydata; wyniki z raportu Evaluatora/Operatora rundy 1 (tsc 0, logic 213/213, ai-test 297/0 i pozostałe) są cytowane z 10-operator-claude.md i nie były powtórzone tutaj.
- Pomiar live PRZED/PO (stany a–d x wpisy/30 s): NIE ZMIERZONO.
- Klik t2→t3 na żywo (seed 4242/7, maksimum): NIE ZMIERZONO.

BLOKADY: (1) pomiar live stanów a–d i tabela PRZED/PO wymagają build gra/ (npm install w worktree + vite do katalogu poza repo; brak node_modules) i wieloturowego biegu Chromium, który wg ENDPERF padał ok. t18 — nie zmieściło się w tej rundzie; (2) klik t2→t3 — j.w.; (3) brak tabeli PRZED/PO oznacza, że binarne kryterium dispatchu nie jest spełnione. Zalecenie dla orkiestratora: osobna runda live (Operator z zapasem dysku ≥ 6 GB, npm ci w worktree, usunięcie node_modules i katalogu buildu po pracy) albo DECISION_REQUIRED, czy kryterium live może być zastąpione testem statycznym + dowodem strukturalnym z zarzutu 4.

RUNDY: 2/5 (runda 1: 10-operator-claude.md; runda obrony: ta)
NASTĘPNY KROK: runda live (pkt 1 i 3 dispatchu) z Evaluatorem; ewentualnie decyzja orkiestratora o zastąpieniu kryterium live.
UWAGI-DLA-ORKIESTRATORA: (a) w gra/src/main.ts pozostałe wywołania canPlayerInitiateEndTurn() bez argumentu (linie ~30973, ~33189, ~35037, ~35124) są w hookach testowych (civTest/gateInfo/diagnostyka), a nie w cyklu HUD 500 ms, więc poza zakresem wyciszenia; zostawiono bez zmian. (b) W dispatchu w tle nie uruchamiano niczego (zasada run_in_background).
DEPLOY/PUSH: NIE WYKONANO
