STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, tekst podpowiedzi)
TEMAT: R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1
GOAL: gdy blokuje otwarta audiencja dyplomatyczna (lub panel łączenia armii, karta odkrycia technologii), `hintEndTurnBlocked()` pokazuje odpowiedni komunikat zamiast „Zakończ ekran bitwy…”; komunikat bitwy zostaje wyłącznie przy otwartej przed-bitwie / oczekującej przed-bitwie BEZ modala. Logika blokady (`canPlayerInitiateEndTurn`) bez zmian.
ZMIANY/COMMIT: base 8f6381fc5 (origin/main). Allowlista:
  - gra/src/main.ts — w `hintEndTurnBlocked` trzy nowe gałęzie modali (isDiplomacyAudienceOpen, isArmyMergePanelOpen, isTechDiscoveryNoticeOpen) PRZED gałęzią `isPreBattleOpen() || hasPendingAutoPreBattle()`. Teksty:
    „Zamknij okno audiencji dyplomatycznej, potem zakończ turę.”
    „Zamknij panel łączenia armii, potem zakończ turę.”
    „Zamknij kartę odkrycia technologii, potem zakończ turę.”
    Tekst „Zakończ ekran bitwy, potem zakończ turę.” bez zmian.
  - gra/tools/end-turn-hint-diplo-audience-test.cjs (nowy test statyczny: czyta main.ts, sprawdza kolejność gałęzi i treści, audyt polszczyzny, dwie mutacje w pamięci).
  - dyspozycje/autobot/runs/R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1/10-operator-claude.md (ten raport).
  Commit kodu + raportu tej rundy: SHA w polu sha zwrotu.
TESTY:
  - tsc --noEmit: exit 0 (zmierzone exit=0; liczba błędów NIE_ZMIERZONO poza exit 0).
  - Bramki referencyjne (po `npm ci` w gra/, 71 pakietów): logic-test 213/213 (LOGIC OK); tech-tree-test 20 pass / 0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6 pass; unit-power-test 6 pass / 0 fail. Wszystkie exit 0.
  - Nowy test end-turn-hint-diplo-audience-test.cjs: passed=6 failed=0, exit 0 (w tym mutacja „usunięcie gałęzi audiencji” wykryta i mutacja „modal po gałęzi bitwy” wykryta).
  - Istniejące testy end-turn ze wskazania `git grep -l hintEndTurnBlocked -- gra/tools`:
    * end-turn-block-event-test.cjs: passed=35 failed=0. Pierwsza wersja zmiany przesuwała gałąź NNS poza okno 2500 znaków, które test przeszukuje, i dawała 34/1; naprawione skróceniem komentarza, bez zmiany testu.
    * endturn-battle-deadlock-test.cjs: 38 pass, 0 fail.
    * koniec-tury-f1-f4-runda3-test.cjs: 39 pass, 0 fail.
    * diplomacy-sensible-deals-main-guard-test.cjs: 22 passed, 0 failed.
    * no-negative-stocks-endturn-test.cjs: 18 passed, 1 failed. Asercja „(f) hintEndTurnBlocked: gałąź blokady pokazuje nnsHint.komunikat” jest PRE-EXISTING: regex wymaga bezpośredniego `{ showHintMessage(nnsHint.komunikat`, a w bazie stoi `noteEndTurnBlockedByNns();` między nimi. Sprawdzone statycznie na źródle bazy 8f6381fc5 — regex nie pasuje także tam (False). Nie jest skutkiem tej rundy.
    * git diff --check: czysto.
  - NIE ZMIERZONO: Chromium/Playwright (realny render podpowiedzi przy otwartej audiencji). Kryterium (a) zrealizowane testem źródłowym i mutacjami, nie żywym renderem.
  - Audyt polszczyzny: teksty bez surowych ID i bez angielskich słów (test sprawdza listę słów i wielkie litery/podkreślenia).
BLOKADY: brak. Blokada (`canPlayerInitiateEndTurn`) i jej warunki nie zostały zmienione.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja kolejności gałęzi w `hintEndTurnBlocked` i testu mutacyjnego; opcjonalnie żywy zrzut z audiencją (Chromium), jeśli orkiestrator uzna to za wymagane.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
  - Pre-existing czerwony test: gra/tools/no-negative-stocks-endturn-test.cjs, asercja (f) o komunikacie blokady NNS. Regex nie odpowiada obecnemu kodowi. Do osobnego tematu testowego, poza zakresem tej rundy.
  - Kolejność w hintEndTurnBlocked po zmianie: awaitingFirstPlayerCity → modal audiencji → modal armii → modal techu → bitwa → oferta AI → gameOver → endTurnInProgress → NNS → tura AI.

---
## RUNDA 2/5 (Operator HAIKU 5.5, baza kandydat 2bd8bb6fe)

STATUS: PASS-WITH-NOTES (naprawa FAIL r1 wykonana; kod hintEndTurnBlocked bez zmian w tej rundzie)
DOMAIN: GAME (UI, tekst podpowiedzi; harness testowy)
TEMAT: R-WEB-UI-END-TURN-HINT-DIPLO-AUDIENCE-TEXT-Q1
GOAL (r2): (1) `endturn-battle-deadlock-exec-test.cjs` wraca do bazy 42/7; (2) test tematu 16/0 zielony; (3) pozostałe bramki jak w r1; (4) `git diff --check`.
ZMIANY/COMMIT: allowlista dodatku (`gra/tools/endturn-battle-deadlock-exec-test.cjs`) — tylko dopisanie brakującej zależności `isTechDiscoveryNoticeOpen` w:
  - destrukturyzacji `deps` w fabryce (`const {...} = deps`),
  - obiekcie `env` (`techNotice: false`),
  - wywołaniu factory (`isTechDiscoveryNoticeOpen: () => env.techNotice`).
  Asercje nie zostały zmienione. Kod `gra/src/main.ts` i test tematu NIE zmienione w tej rundzie.
  Commit: SHA w polu sha zwrotu (plik raportu i harness w jednym commicie, `git add` po ścieżkach).
TESTY (surowe liczby z wyjścia tej sesji):
  - tsc --noEmit (gra/): exit 0.
  - npm ci (gra/): added 71 packages.
  - endturn-battle-deadlock-exec-test.cjs: 42 pass, 7 fail (FAIL = B2, D2 advanceSeat, D3 advanceSeat, D2 triggerPlayerEndTurn, D3 triggerPlayerEndTurn, G5, F-M4 — ten sam zestaw długu bazowego; r1 dawał 40/9 z nowymi B1c, C1b, które teraz są zielone).
  - end-turn-hint-diplo-audience-test.cjs: passed=16 failed=0 (test tematu).
  - end-turn-block-event-test.cjs: passed=35 failed=0.
  - endturn-battle-deadlock-test.cjs: 38 pass, 0 fail.
  - koniec-tury-f1-f4-runda3-test.cjs: 39 pass, 0 fail.
  - diplomacy-sensible-deals-main-guard-test.cjs: 22 passed, 0 failed.
  - no-negative-stocks-endturn-test.cjs: 18 passed, 1 failed — asercja (f) „hintEndTurnBlocked: gałąź blokady pokazuje nnsHint.komunikat” (ten sam pre-existing FAIL co w r1; regex wymaga `{ showHintMessage(nnsHint.komunikat` bezpośrednio, a kod ma `noteEndTurnBlockedByNns();` pomiędzy; `git diff 8f6381fc5 2bd8bb6fe -- gra/src/main.ts` nie zmienia linii `nnsHint`, czyli FAIL nie pochodzi z tej rundy).
  - load-game-blockers-exec-test.cjs: crash `ReferenceError: resetEmpireRecruitPanelSession is not defined` w harnessie (przed L1 wyjściem) — nie dotyczy hintEndTurnBlocked; harness nie został zmieniony (poza allowlistą). Pre-existing, NIE NAPRAWIONE.
  - Reference gates: logic-test LOGIC OK (213/213) exit 0; tech-tree-test 20 pass / 0 fail; research-test 33/0 ALL GREEN; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass / 0 fail. Wszystkie exit 0.
  - git grep -l hintEndTurnBlocked gra/tools: 8 plików (zestaw powyżej i no-negative-stocks, load-game-blockers).
  - git diff --check: czysto (exit 0).
  - NIE ZMIERZONO: Chromium/Playwright (żywy render podpowiedzi przy audiencji).
BLOKADY: brak dla tematu. Poza zakresem (UWAGI-DLA-ORKIESTRATORA niżej).
RUNDY: 2/5 (ostatni werdykt FC r1 = FAIL; powód: ReferenceError w endturn-battle-deadlock-exec-test).
NASTĘPNY KROK: Evaluator (SONNET) / Final Control (SONNET) — weryfikacja, że 42/7 odpowiada bazie (7 FAIL = dług bazowy, nie zmieniany) i że asercje harnessu nie zostały osłabione.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
  - no-negative-stocks-endturn-test (f): regex źródłowy do poprawy w osobnym temacie testowym (nie w tym temacie).
  - load-game-blockers-exec-test: brak `resetEmpireRecruitPanelSession` w deps harnessu — osobny dług testowy.
  - Obie pozycje wymagają osobnych tematów; nie zakładałem ich (zakaz nowych sesji/zadań).
