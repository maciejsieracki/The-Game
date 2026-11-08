STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1-20260927
GOAL: Fotel 2 hot-seat może zaznaczyć własną jednostkę i wydać ręczny rozkaz marszu.
WERDYKT: PASS-WITH-NOTES

ZAKRES I DIFF:
- `git diff origin/main..HEAD` jest pusty: HEAD oraz origin/main wskazują ten sam commit `6eab3b40`; poprawka operatora pozostaje niezatwierdzoną zmianą working tree.
- Efektywny diff working tree zawiera wyłącznie `gra/src/main.ts` oraz `gra/tools/hotseat-drugi-fotel-tura-test.cjs` (5/1 oraz 189/2 linii). Nie ma zmian w `WERSJE.md`, `KANAL-PRACA.md`, `gra-robocza/empireDetailPanel.ts` ani innych śledzonych plikach.
- W katalogu runu jest raport operatora `01-operator.md` oraz niniejszy werdykt. Niezależny, istniejący untracked `DYSPOZYCJA-RECZNY-RUCH-GRACZ2.md` pozostaje poza zmianą tej ewaluacji.

RAPORT OPERATORA:
- Przeczytano `dyspozycje/autobot/runs/R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1-20260927/01-operator.md`.

DOWÓD KODU:
- Czyste `origin/main`, `gra/src/main.ts:25390`: `if (!u || !dest || u.ownerId !== 0) return false;` — bramka zaszyta na fotel 1.
- Working tree, `gra/src/main.ts:25385-25394`: ta sama funkcja `executeMarchSegmentForUnit()` używa `if (!u || !dest || !isMe(u.ownerId)) return false;`.
- Zmiana jest wąska i zachowuje pozostałą logikę wykonania segmentu. Jest zgodna z istniejącymi bramkami `selectPlayerUnit()` i `planMarchTo()`, które sprawdzają aktywny fotel przez `isMe()`.

WERYFIKACJA TESTÓW:
- `gra/node_modules/typescript/bin/tsc --noEmit` z katalogu `gra/`: PASS, exit 0.
- `node --check tools/hotseat-drugi-fotel-tura-test.cjs`: PASS, exit 0.
- `git diff --check`: PASS, exit 0.
- Skupiony scenariusz regresyjny uruchomiono niezależnie przez realny build Vite i headless Chromium, wywołując wyłącznie `runScenarioSeat2ManualMoveViaRealClicks`: `FOCUSED_RESULT={"pass":true,"failures":[]}`, exit 0. Scenariusz aktywuje fotel 2, tworzy jego jednostkę, zaznacza ją przez istniejący produkcyjny hook `selectPlayerUnit()`, klika sąsiedni heks jako rozkaz marszu i asercją sprawdza faktyczną zmianę q/r.
- Ten sam scenariusz uruchomiony na czystym worktree `origin/main` (stary kod, bez poprawki) zwrócił: `BASELINE_FOCUSED_RESULT={"pass":false,...}`. Jednostka ownerId=49 pozostała na `{q:23,r:74}` zamiast ruszyć na kliknięty `{q:24,r:74}`. To niezależnie potwierdza czerwony baseline i zieloną poprawkę.

LIVE-HARNESS NOTES:
- Pełny zmieniony `hotseat-drugi-fotel-tura-test.cjs` nie doszedł do nowego scenariusza: istniejący scenariusz główny zakończył pierwszą próbę timeoutem `pollUntil(world-end-turn-after-both-seats)` przy `turn=2, activeHumanOwnerId=49`, a kolejne próby zakończyły się zamknięciem strony.
- Niezależna kontrola na czystym `origin/main` tym samym istniejącym `hotseat-drugi-fotel-tura-test.cjs` odtworzyła dokładnie ten sam stan i timeout pierwszej próby (`turn=2, activeHumanOwnerId=49`), po czym kolejne próby również kończyły się zamknięciem strony. To potwierdza, że ten timeout jest pre-existing live-harness/infrastructure problemem, a nie skutkiem poprawki ruchu.
- Dodatkowo uruchomiono na czystym `origin/main` `hotseat-dyplo-kontakt-per-fotel-test.cjs` i `hotseat-etap4-noop-test.cjs`; oba nie domknęły się w wielominutowym limicie i wykazały retry/page-closed zachowanie live harnessu (procesy zakończone przez limit/ochronę procesu, bez wyniku PASS). Nie traktuję tego jako dowodu regresji tematu.

OGRANICZENIA / NOTY:
- Pełny pakiet 35 testów nie został domknięty z powodu reprodukowalnych timeoutów live harnessu. Funkcjonalny scenariusz tematu został jednak wykonany osobno na HEAD oraz jako czerwony baseline na czystym origin/main.
- Ewaluator nie zmienił kodu produkcyjnego, nie wykonał merge/push/deploy. Dodano wyłącznie ten plik werdyktu.

NASTĘPNY KROK: Final Control dla tego samego ID; brak potrzeby zmian w kodzie tej karty.
DEPLOY/PUSH: NIE WYKONANO
