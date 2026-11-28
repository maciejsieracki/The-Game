STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16B
GOAL: Przywrócić 5 czerwonych testów po zmianie sygnatury canPlayerInitiateEndTurn (ENDQUIET) bez zmian logiki gry i bez osłabiania wzorców; skan testów z tym wzorcem PRZED/PO. Obrona: odpowiedź na 4 zarzuty Evaluatora (commit 0316606d91d30093bdb74b49916aa546b2eafb53).
ZMIANY/COMMIT: baza c5ce9978f (rewizja Operatora r1). Zmiany r2:
- gra/tools/load-game-blockers-exec-test.cjs (zarzut 4: NNS): zaślepka nnsGateForPlayer steruje przełącznikiem nnsGateBlockStub (ze STATE); scenariusz NNS1-NNS3 + mutacja M4 (wycięta bramka NNS w canPlayerInitiateEndTurn -> koniec tury odblokowany = wykryte).
- dyspozycje/analizy/DLUG-TESTOWY-Q16B-2026-11-28.md (zarzuty 1-3: poprawiona liczba plików, pełna tabela skanu 25/25, bramki zmierzone).
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16B/obrona-r2-wyniki.txt (surowe wyjścia tej rundy).
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16B/30-obrona-claude.md (ten raport).
Kod gry NIE zmieniony: git diff b075137 -- gra/src gra/data = pusty. Commit: patrz pole sha.
TESTY (surowe wyniki, c5ce9978f + zmiany r2):
- diplo-forced-peace-pending-test: PASS=40 FAIL=0
- diplomacy-sensible-deals-main-guard-test: 22 passed, 0 failed
- koniec-tury-f1-f4-runda3-test: 39 pass, 0 fail
- koniec-tury-g1-g2-runda4-test: 41 pass, 0 fail
- load-game-blockers-exec-test: 19 PASS / 0 FAIL (było 15/0; +NNS1-NNS3 i M4)
- heal-stale-blockers-pending-battle-test: 23 pass, 0 fail
- endturn-battle-deadlock-exec-test: 49 pass, 0 fail
- endturn-battle-deadlock-test: 38 pass, 0 fail
- endturn-quiet-test: 10 pass, 0 fail
- no-negative-stocks-end-turn-gate-levers-test: 34 passed, 0 failed
- no-negative-stocks-endturn-test: 19 passed, 0 failed
- hotseat-etap4-noop-test: PRZERWANY po 580 s (RC 124) w turze 3, bez wyniku (bieg live Chromium); NIE ZMIERZONO PRZED osobno
- ai-wojny-zwykle-cap-dwa-miasta-test, hotseat-drugi-fotel-tura-test: NIE PONOWIONO w r2 (wyniki r1: 2/2 i RC 2, identyczne przed/po, bez związku z nagłówkiem)
- 11 testów/sond live (endturn-click-live, endturn-nns-console, endturn-perf-probe, forced-war x3, measure-close-modals, measure-forced-peace, perf-long-session-live, war-era-counter-live, world-overlay-midgame-diag-probe): NIE URUCHOMIONO (Chromium/bundle); wg git grep na b07513734 nie zawierają starej sygnatury
- tsc --noEmit: exit 0, zero błędów
- logic-test: LOGIC OK (213/213)
- ai-test: ai-test: 297 passed, 0 failed
- git diff --check: czysto
Odpowiedzi na zarzuty:
1. PRZYJĘTE. Liczba plików z tekstem canPlayerInitiateEndTurn: grep -l po gra/tools/*.cjs = 25 (nie 18). Dokument poprawiony. Stary nagłówek `(): boolean` na b07513734 (git grep) = 6 plików, nie 25.
2. PRZYJĘTE. Dwa pominięte pliki (heal-stale-blockers-pending-battle 23/0, hotseat-etap4-noop przerwany po 580 s) dopisane do tabeli. Logi scan-*.txt z runs/ pochodzą z innego worktree (hotseat-etap4 pokazuje tam błąd Chromium); nie przyjmuję ich jako wyniku PO.
3. PRZYJĘTE i ZMIERZONE: tsc 0 błędów, logic 213/213, ai-test 297/0 (surowe wyjście wyżej, nie z pamięci Operatora r1).
4. PRZYJĘTE i NAPRAWIONE: gałąź bramki NNS w canPlayerInitiateEndTurn jest pokryta scenariuszem NNS1-NNS3 (realne sprawdzenie, że blokada NNS wiąże i że zdjęcie blokady ją odblokowuje) oraz mutacją M4 (usunięcie gałęzi NNS -> scenariusz czerwieni). Żadna istniejąca asercja nie została osłabiona (diff zmienia tylko zaślepkę i dopisuje asercje).
BLOKADY: brak blokady tematu. Luki odnotowane jawnie (nie należą do zakresu pinów):
- hotseat-etap4-noop-test: bieg live przekroczył limit 580 s; wynik nieznany (Chromium). Do zamknięcia w osobnym temacie, jeśli orkiestrator uzna za wymagane.
- ai-wojny-zwykle-cap-dwa-miasta (2/2) i hotseat-drugi-fotel-tura (RC 2): stan z r1, nie ponawiane; przyczyny NIE ZBADANE (poza zakresem nagłówka).
- prunePendingForcedPeace i pendingForcedPeaceTreaties w harnessie load-game: NIE ZMIERZONO, czy są konieczne (żadna asercja ich nie używa).
RUNDY: 2/5 (runda 1: c5ce9978f; runda 2 = obrona, bez zmian w kodzie gry)
NASTĘPNY KROK: Evaluator r2 (weryfikacja zarzutów 1-4 wg tych wyników); po PASS - Final Control. Nic nie integrować przed FC.
DEPLOY/PUSH: NIE WYKONANO
