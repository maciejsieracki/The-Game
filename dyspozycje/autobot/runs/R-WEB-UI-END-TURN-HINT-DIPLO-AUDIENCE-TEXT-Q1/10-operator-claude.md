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
