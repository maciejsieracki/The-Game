STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-PROC-GATE-REFERENCE-REFRESH-Q2
GOAL: odświeżyć tabelę punktów odniesienia bramek w docs/decyzje/R-PROC-AUTOBOT.md §6 (oraz powielenia) na podstawie świeżego pomiaru 5 bramek referencyjnych na origin/main.
ZMIANY/COMMIT: docs/decyzje/R-PROC-AUTOBOT.md (§6: data 2026-11-12, baza origin/main @ ef27be007; tech-tree-test 19/19 -> 20/20; unit-replace-test 13/13 -> 21/21). Pozostałe wartości bez zmian (logic 213/213, research 33/33, combat 6/6). Powielenia: grep po nazwach bramek w docs/ i *.md — poza §6 R-PROC-AUTOBOT.md brak tabel z liczbami do odświeżenia (wzmianki 19/19 w P-EPOKA-BRAZU, R-BRAZ-SUPER-DISPATCH, R-DYPLO-JSON, R-WIARYGODNOSC-S9 dotyczą historycznych, datowanych raportów i nie są zmieniane). Allowlista zachowana; gra/ nietknięte (npm ci --ignore-scripts tylko do uruchomienia bramek; brak npm run build/dev).
TESTY (surowe wyniki z uruchomienia w gra/ na ef27be007):
- node ./node_modules/typescript/bin/tsc --noEmit: EXIT 0, brak błędów
- node tools/logic-test.cjs: EXIT 0, "LOGIC OK (213/213)"
- node tools/tech-tree-test.cjs: EXIT 0, "tech-tree-test: 20 pass, 0 fail"
- node tools/research-test.cjs: EXIT 0, "PASSED: 33 / FAILED: 0 / TOTAL: 33", "ALL GREEN"
- node tools/unit-replace-test.cjs: EXIT 0, "WSZYSTKIE TESTY ZIELONE (21/21)"
- node tools/combat-test.cjs: EXIT 0, "COMBAT TEST: 6/6 pass"
- git diff --check: czysto
BLOKADY: brak. Uwaga: npm ci zgłosił ostrzeżenie npm audit — poza zakresem, nie zmieniano.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja liczb z surowych wyników powyżej i zgodności diffu z allowlistą.
DEPLOY/PUSH: NIE WYKONANO
