STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16
GOAL: Naprawić czerwony test bramki końca tury no-negative-stocks-endturn (asercja f) i sklasyfikować rodzinę testów; zero zmian gra/src.
BAZA: 481e0ebf9 (origin/main); merge-base potwierdzone.
ZMIANY/COMMIT: pliki tylko w allowliście. gra/tools/no-negative-stocks-endturn-test.cjs, gra/tools/endturn-battle-deadlock-test.cjs, gra/tools/endturn-battle-deadlock-exec-test.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16-2026-11-28.md, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16/. gra/src bez zmian (git diff gra/src pusty).
TESTY:
- no-negative-stocks-endturn-test: PRZED 18 pass/1 fail (f) → PO 19/0. Mutacja (`if (false && nnsGateForPlayer().blokada)`) → FAIL (f); przywrócenie → 19/0.
- endturn-battle-deadlock-test: PRZED 37/1 ([A4]) → PO 38/0.
- endturn-battle-deadlock-exec-test: PRZED abort (needle M4) → PO 49/0.
- Reszta rodziny zielona (tabela PRZED/PO w runs/R-WEB-TEST-DEBT-Q16/scan-PRZED-PO.txt). Pominięte, wymagają --dist: end-turn-gate-live, no-negative-stocks-ai-t2-behavior, no-negative-stocks-c3-turn.
- tsc --noEmit RC 0; ai-test 297/0; logic-test 213/213.
PRZYCZYNA (A, pin przestarzały): commit 7fd21ed0c (ENDQUIET) zmienił sygnaturę na (quiet = false). Zamierzone wg jego komunikatu. Logika bramki bez zmian.
BLOKADY: brak w allowliście. Poza allowlistą pięć plików z tym samym starym nagłówkiem (patrz UWAGI-DLA-ORKIESTRATORA).
UWAGI-DLA-ORKIESTRATORA:
- Poza allowlistą, niezmienione, prawdopodobnie czerwone (NIE URUCHOMIONO): gra/tools/diplo-forced-peace-pending-test.cjs:182, gra/tools/diplomacy-sensible-deals-main-guard-test.cjs:32, gra/tools/koniec-tury-f1-f4-runda3-test.cjs:168, gra/tools/koniec-tury-g1-g2-runda4-test.cjs:130, gra/tools/load-game-blockers-exec-test.cjs:73. Naprawa: zmiana nagłówka na (quiet = false). Osobny temat.
- Mutacja dla pinu [A4] nie wykonana (tylko aktualizacja nagłówka).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje binarne kryterium: no-negative-stocks-endturn zielony + mutacja czerwona; PRZED/PO tabela; zero zmian gra/src. Następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
