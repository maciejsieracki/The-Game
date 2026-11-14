# R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1
GOAL: w wojnie obniżane jest tylko Zaufanie (do 0), Respekt bez zmian, ocena pokoju bez limitu 29.
ZMIANY/COMMIT: kandydat a3dd5524e26fbfb8970ea483e3708a7357867685 (potomek bazy 5d0c5f8d1; merge-base --is-ancestor OK). Diff vs baza: 11 plików, wszystkie w allowliście (diplomacy.ts, diplomacy-proposals.ts, diplomacy-display.ts, diplomacyAudience.ts, testy cjs, raporty). Brak zmian w ai.ts, main.ts, JSON balansu, WERSJE.md. git diff --check czysty.
ZARZUTY: 1 ODDAL (tautologia usunięta, nowa asercja warRelationCapApplies(0,80,true)===false). 2 ODDAL (komentarze proposals poprawione; pozostałe dwa nadal prawdziwe lub na liście ZAKAZ). 3 ODDAL (ten sam dług 22 PASS / 5 FAIL na bazie i kandydacie, identyczne linie FAIL). 4 DO DECYZJI CZŁOWIEKA (informacyjnie): etykieta "Wrogi" w wojnie nadal twarda — następny krok (progi nastawienia), poza zakresem. Żaden NAPRAW.
TESTY (surowe): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test 21/21; combat-test 6/6; diplo-war-trust-only-test 11 OK 0 FAIL (mutacja: stary diplomacy.ts daje 6 OK, 5 FAIL, więc test wykrywa regresję); diplomacy-test 148 passed 0 failed; diplo-respect-military-events-test 24 OK 0 FAIL; render Chromium (diplomacy-respect-true-value-real-render-test) 18 OK 0 FAIL; dyplo-bilans-gate...runda3 22 PASS / 5 FAIL na kandydacie ORAZ na bazie (te same linie FAIL; dług znany, nie regresja). PNG dowodów nadpisane przez test render przywrócone.
BLOKADY: brak. Nie zmierzono żywej gry ani wpływu na AI.
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora a3dd5524e (FF na main), potem krok 2 z kolejki (siła militarna).
DEPLOY/PUSH: NIE WYKONANO
