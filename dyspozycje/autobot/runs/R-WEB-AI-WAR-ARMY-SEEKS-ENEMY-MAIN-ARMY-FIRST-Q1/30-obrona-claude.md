STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1
GOAL: armia AI szuka najsilniejszej widocznej armii wroga przed zdobywaniem miast; nakladka niezalezna od obrony domu.
ZMIANY/COMMIT: start aad2f26ba; zmienione: gra/tools/ai-war-army-seeks-army-test.cjs (+T10), dyspozycje/rust-port/LEDGER.md (wpis 2026-11-11). Kod gry (ai.ts) bez zmian wzgledem aad2f26ba. SHA koncowy w polu sha zwrotu (commit z tym raportem).
ZARZUTY:
1. PRZYJMUJE. LEDGER: wpis zmieniony na "kandydat r2", usunieto "obrona domu wylaczona" z warunkow pominiecia, dodano jawne: nakladka NIEZALEZNA od isHomeWarDefenseEnabled, w Rust nie wiazac z flaga obrony domu.
2. PRZYJMUJE. Dodano T10 (homeDefense:false): bitwa w 1. turze (PO battles=6, PRZED battles=0) oraz zblizanie 3 heksy -> bitwa w <=4 turach bez zajec. Dowod mutacyjny: po tymczasowym przywroceniu `|| !isHomeWarDefenseEnabled()` w ai.ts test daje 21 PASS / 1 FAIL ("PO przy homeDefense:false: bitwa w 1. turze (battles=0)"); po przywroceniu ai.ts do aad2f26ba 22/0. (Druga asercja T10 nie wykrywa mutacji — dla zblizania inne mechanizmy tez prowadza do bitwy; pierwsza asercja jest decydujaca.)
3. ODRZUCAM jako zarzut do kodu (informacyjny): 0,8 i 3 to decyzja balansu wlasciciela, wartosci w ai-params.json bez zmian.
4. ODRZUCAM jako zarzut (informacyjny): sekcja r1 w 10-operator-claude.md to historia, uchylona w sekcji RUNDA 2/5; nie edytuje historycznego raportu. Aktualny stan: r2 (ten plik + LEDGER).
TESTY (surowe wyjscie, po zmianach): ai-war-army-seeks-army-test 22 PASS 0 FAIL; ai-war-defend-home-test 30 passed 0 failed (T9 zielony); ai-war-gate-test 24 passed 0 failed; tsc --noEmit exit 0.
NIE_ZMIERZONO ponownie: pozostale bramki (ai-test 296/0, general-muster, scattered-merge, war-allin-capital 96/2, referencyjne) — kod gry nie zmieniony od aad2f26ba, wyniki Evaluatora (20-evaluator-claude.md) pozostaja wazne. Merge-tree z main 494480569 nie powtarzany (zmieniono tylko test + LEDGER); Evaluator: czysty dla kodu.
BLOKADY: brak. Zalozenie: LEDGER.md jest w zakresie poprawki (wskazany przez Evaluatora).
RUNDY: 2/5 (obrona po Evaluatorze r2)
NASTEPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
