STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian w gra/src i gra/data)
TEMAT: R-WEB-TEST-DEBT-Q9
GOAL: obrona kandydata f64fde137 po raporcie Evaluatora 852b327a3: zarzuty 1-3 rozstrzygnięte, trzy testy zielone bez osłabiania asercji.
ZMIANY-COMMIT: allowlista: gra/tools/citizen-resource-upkeep-test.cjs, gra/tools/unit-epoch-cost-test.cjs, gra/tools/unit-replace-full-cost-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q9/30-obrona-claude.md. SHA: czubek commita zwrócony w polu sha.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. citizen-resource-upkeep-test.cjs: komentarz (ok. l.740) i komunikat assert (l.750) zmienione na `const ordPctEvaluated = evaluateOrderFromBreakdown(`. Kotwica w kodzie: main.ts:44221 `const ordPctEvaluated = evaluateOrderFromBreakdown(`.
2. PRZYJMUJĘ. unit-epoch-cost-test.cjs (komentarz przy asercji Konnicy): dodane odwołanie do R-WEB-CAVALRY-IRON-ONLY-Q1 (2026-11-11, rejestr: „przeniesienie każdego typu konnicy do Żelaza”). Wpis w rejestrze potwierdzony grepem (REJESTR-PROSB-I-ZADAN.md, linia 9645).
3. PRZYJMUJĘ. unit-replace-full-cost-test.cjs: regex wzmocniony z `cost,` na `cost, pendingLedgerSink\(`. Test nadal sprawdza wyłącznie zakres unitReplaceExecuteDeps (slice main.ts). Dowód mutacji: w tym zakresie oryginał daje match=true, mutant (usunięty 4. argument pendingLedgerSink) daje match=false (node -e, na kopii stringu, bez zmian src).

TESTY (surowe wyjście, worktree na f64fde137 + moje zmiany):
- npm ci --ignore-scripts w gra/: exit 0; df / po instalacji: 11G wolne
- unit-epoch-cost-test: 57 passed, 0 failed
- citizen-resource-upkeep-test: 124 passed, 0 failed
- unit-replace-full-cost-test: 40 passed, 0 failed
- tsc --noEmit: exit 0, 0 linii wyjścia
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: exit 0, „All sanity checks passed.”
- git diff --check: czysto; git status: tylko 3 pliki testów (+ raport)

Uwaga: wynik exit-code trzech testów z pierwszej serii był z `tail` (exit tail), dlatego liczby passed/failed z wyjścia są dowodem; wszystkie pokazały 0 failed.

BLOKADY: brak. Realny błąd gry nie stwierdzony (przypadek c nie wystąpił). Pytanie o epokę Konnicy (Żelazo w units.json vs Brąz w rust-port P4-4) z raportu Operatora pozostaje otwarte dla właściciela; asercja przyjmuje dane z units.json.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator/Final Control weryfikuje poprawki (3 pliki) i mutację regexu.
DEPLOY/PUSH: NIE WYKONANO
