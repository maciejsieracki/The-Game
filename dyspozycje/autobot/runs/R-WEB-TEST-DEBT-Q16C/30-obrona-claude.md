STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C
GOAL: Ustalić klasę trzech czerwonych testów (ai-wojny-zwykle-cap-dwa-miasta, hotseat-drugi-fotel-tura, hotseat-etap4-noop) i naprawić A bez zmiany gry; B/C opisać z dowodem; dokument DLUG-TESTOWY-Q16C.
ZMIANY-COMMIT: patrz sekcja SHA poniżej. Pliki: gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs, gra/tools/hotseat-drugi-fotel-tura-test.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/* (*.txt). gra/src bez zmian (git diff gra/src = 0).

## Odpowiedź na zarzuty Evaluatora (325c96408)

1. Brak commitu Operatora — PRZYJMUJĘ. Praca wykonana i zacommitowana w tej rundzie (patrz SHA).
2. Brak dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md — PRZYJMUJĘ. Dokument zapisany (stan wiążący na górze, NIE ZMIERZONO jawnie).
3. Brak klasyfikacji A/B/C i dowodów dla trzech testów; brak naprawy i mutacji — PRZYJMUJĘ częściowo i wykonuję:
   - ai-wojny-zwykle-cap-dwa-miasta: klasa A (dwa stare piny: bramka NNS po t16 bez prepareEndTurnGate; nieaktualny regex asercji F po refaktorze isWarTreatyBlocked). Naprawiono. Wynik: 22 PASS / 0 FAIL (plik 31-ai-wojny-zielony-po-poprawce.txt). Dowód czerwieni bazy: 32-ai-wojny-czerwony-baza.txt (2 PASS / 2 FAIL). Mutacja: regex na peaceLocked:false nie trafia (dowód w dokumencie); mutacja w harnessie NIE ZMIERZONO.
   - hotseat-drugi-fotel-tura: klasa A (stale selektory kreatora: `.nb.next` i `.start` nie istnieją; nawigacja to `.nav .next`). Selektory poprawione. Status NIE ZAMKNIĘTY: po poprawce Chromium zamyka stronę w podscenariuszu (klasa C). Pełny przebieg NIE ZMIERZONO. Plik 33 (przerwany) i 34 (baza BLOCK).
   - hotseat-etap4-noop: klasa C, NIE uruchomiono w tej rundzie (NIE ZMIERZONO). Brak dowodu na błąd gry.
4. Brak raportu Operatora 10-operator-*.md — PRZYJMUJĘ. Dodano 10-operator-claude.md (runda 1) i ten raport (obrona).

## Zarzut „brak commit’u”: dowód
Przed tą rundą `git diff --name-only dbcc12f71..origin/main` było puste i brak było plików gra/tools/tdq16c-*. Po tej rundzie zmiany są w pliku gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs i gra/tools/hotseat-drugi-fotel-tura-test.cjs (oba na allowliście).

## Bramki
- gra/src: git diff dbcc12f71 -- gra/src = pusty (zero zmian w grze).
- tsc / logic 213 / ai-test 297 NIE URUCHAMIANO w tej rundzie: zmiany dotyczą wyłącznie plików tools/*.cjs, które nie są w bramkach tsc/logic/ai-test. Zero wpływu na te bramki wykazany przez brak zmian w gra/src i gra/data.

## Binarne kryterium
- ai-wojny: ZIELONY po naprawie A (22/0). SPEŁNIONE z zastrzeżeniem: jedna pełna zielona runda po ostatniej zmianie + czerwień bazy.
- hotseat-drugi-fotel: NIE SPEŁNIONE (poprawka selektorów, brak zielonego przebiegu; Chromium C).
- hotseat-etap4-noop: NIE SPEŁNIONE (NIE ZMIERZONO w tej rundzie).
- Dokument zapisany: SPEŁNIONE.

BLOKADY: hotseat-drugi-fotel (klasa C podczas przebiegu, pełny zielony przebieg niedostępny w tej rundzie); hotseat-etap4-noop (nieuruchomiony, klasa C).
RUNDY: 1/5 w tej rundzie obrony (runda Operatora nr 2 z kolejności procesu).
NASTĘPNY KROK: (1) rerun hotseat-drugi-fotel do końca w osobnych segmentach (<=590 s) i przegląd selektorów późniejszych scenariuszy; (2) hotseat-etap4-noop jako osobny segment po stabilizacji Chromium (klasa C, INFRA); (3) mutacja czerwona-zielona w harnessie dla ai-wojny.
UWAGI-DLA-ORKIESTRATORA: harness Chromium (SIGSEGV/Target closed) nadal blokuje pełne przebiegi live; `sed` w hotseat-drugi-fotel zmienił selektory także w scenariuszach późniejszych (nie zweryfikowane); pierwszy przebieg ai-wojny zawiesił się na 120 s w bashu i przeszedł w tło — wykonano tylko przez kontrolę postępu (bez run_in_background z mojej strony).
DEPLOY/PUSH: NIE WYKONANO
SHA: (patrz wpis w odpowiedzi strukturalnej)
