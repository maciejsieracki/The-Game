STATUS: PASS-WITH-NOTES
DOMAIN: GAME (sprzątanie martwego kodu, bez zmiany zachowania gry)
TEMAT: R-WEB-CLEAN-DEAD-LEDGER-PROBE-Q1
GOAL: usunąć martwą sondę ledgerAuditE3c* z gra/src/main.ts (hak testowy ?civTest=1), odczyt z narzędzia pomiarowego zastąpić 'n/d', dodać strażnika.
BAZA: d97e825bb14a4e6953e08d48a77483ac5a196903 (origin/main).

ZMIANY/COMMIT:
- gra/src/main.ts: usunięte 2 deklaracje `let` (ledgerAuditE3cLast, ledgerAuditE3cFires; ok. l. 10502–10503) oraz pola e3cLast/e3cFires z obiektu zwracanego przez snapshot __ledgerTestDebug (ok. l. 33176). Diff: 2 linie usunięte, 1 zmieniona.
- gra/tools/resource-ledger-live-measure.cjs: linia 175 (odczyt s.e3cFires / s.e3cLast) zastąpiona przez `res.e3c = 'n/d';`. Pole e3c w raporcie zachowane.
- gra/tools/dead-ledger-probe-absent-test.cjs (nowy): asercje źródłowe (main.ts bez ledgerAuditE3c / e3cLast / e3cFires; measure bez odczytu sondy) + dowód mutacyjny w pamięci.
- SHA: podane w polu sha odpowiedzi (commit na detached HEAD worktree).

WYSZUKIWANIE (grep ledgerAuditE3c po gra/ i całym repo, bez node_modules):
- Trafienia w kodzie: tylko gra/src/main.ts:10502, 10503 (deklaracje) i 33176 (odczyt w snapshocie). Brak przypisań i inkrementacji poza deklaracją, więc sonda zawsze = 0 / [].
- Pozostałe trafienia w repo są w dokumentach dyspozycji i runach, plus artefakty buildów gra/tools/.zeton-*-dist/*.html (nie kod źródłowy, nieruszane).
- Jedyny konsument w gra/tools: resource-ledger-live-measure.cjs:175 (wynik trafia do raportu, linia 236).

TESTY (liczby z surowego wyjścia):
- tsc --noEmit: exit 0
- logic-test: 213 PASS (ostatni [213]); 0 linii FAIL
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test, unit-replace-archer-slinger, unit-replace-army-multi-select, unit-replace-full-cost, unit-replace-multitype-walk, unit-replace-promotion-table: exit 0 każdy
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- determinism-save-load-resume-test: exit 0 (brak liczby w wyjściu)
- fort-nodes-save-load-test: 18 passed, 0 failed
- save-load-budowa-priorytet-on-load-test: 6 PASS / 0 FAIL
- forced-war-iron-era-enter-turn-save-load-test: 20 passed, 0 failed
- hotseat-etap7-saveload-test: 59 passed, 0 failed
- resource-ledger-test: 1073 passed, 0 failed
- resource-ledger-save-history-test: 15/0; resource-ledger-engine-test: 20/0; resource-ledger-consume-test: 30/0; resource-ledger-hook-gate-test: 6/0; resource-ledger-owner-delta-test: 8/0; resource-ledger-trade-test: 27/0; resource-ledger-skad-dom-test: 13/0; resource-ledger-skad-ui-test: 18/0
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- hotseat-etap6d-diplomacy-engine-test: exit 0, wyjście końcowe "WSZYSTKIE TESTY PASS" (liczby 77 nie odnotowano w tym formacie wyjścia)
- dead-ledger-probe-absent-test (nowy): 5 PASS / 0 FAIL przy czystym main.ts
- Dowód mutacyjny na PLIKU: tymczasowe przywrócenie `let ledgerAuditE3cFires = 0;` w main.ts => dead-ledger-probe-absent-test exit 1 (FAIL); po przywróceniu pliku (cmp identyczny) exit 0.
- NIE ZAKOŃCZONO: gra/tools/resource-ledger-realpath-mutation-test.cjs (test mutacyjny spoza listy bramek dispatchu): zdążył zabić m01–m03, przerwany ręcznie po przekroczeniu czasu; wynik niepełny. Nie dotyczy zmienionych linii.
- Testy live (Chromium) nie były uruchamiane.

ZACHOWANIE GRY: sonda nigdy nie była zapisywana ani czytana przez logikę gry (tylko hak testowy); nie wchodzi do zapisu gry (testy save-load zielone). Jedyna zmiana obserwowalna: kształt snapshotu __ledgerTestDebug (dwa pola mniej), dotyczy wyłącznie haka ?civTest=1.

BLOKADY: brak (poza niedokończonym resource-ledger-realpath-mutation-test, patrz wyżej).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator, przegląd diffu (3 pliki) i bramek; następnie Final Control.
UWAGI-DLA-ORKIESTRATORA: pytania z tematu #99 (bramka NNS w turze 1, dziennik zasobów AI w zapisie) nie były przedmiotem tej rundy. Liczba 77 dla hotseat-etap6d nie została odnotowana w wyjściu (NIE ZMIERZONO liczby; komunikat PASS obecny).
DEPLOY/PUSH: NIE WYKONANO
