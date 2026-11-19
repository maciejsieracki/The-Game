# R-WEB-AI-CITY-GARRISON-TESTS-REPLACE-Q1 — Final Control (Sonnet 5.5)

STATUS: PASS
DOMAIN: GAME (tylko testy; zero zmian gra/src, gra/data)
TEMAT: R-WEB-AI-CITY-GARRISON-TESTS-REPLACE-Q1
GOAL: zastąpić 4 czerwone oryginalne asercje po FALI 857 (garnizon min. 1) nowymi scenariuszami z garnizonem.
ZMIANY/COMMIT: kandydat 6eaaaae10ae110f14b0d54bd154509c63c176112; `git merge-base --is-ancestor d425dd0a3 6eaaaae10` = OK. diff --stat: 3 pliki (+119/-7): ai-home-defense-vs-barbarians-test.cjs, army-concentration-test.cjs, 10-operator-claude.md. W allowliście; gra/src, gra/data nietknięte. Stare asercje zakomentowane z odwołaniem do FALI 857 (nie usunięte); scenariusze zielone bez zmian.
TESTY (własny bieg, surowe wyjście): tsc --noEmit EXIT 0; ai-home-defense-vs-barbarians 64/0; army-concentration 58/0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace-test 21/21; unit-replace-archer-slinger 51/0; combat 6/6; ai-home-defense-civilian-filter 8/0; ai-war-city-garrison 21/0; militia-garrison-contract 17/0; militia-garrison-router-siege 8/0.
Mutacje (kopie, usunięte): garnizon wyjęty ze scenariuszy home-defense -> 48/4 (czerwone T2-NOWY(b), T4-NOWY(b), T2(b), T4(b)); garnizon liczony jako ruszający się w army-concentration -> 57/1 (czerwone "garnizon nie dostaje ruchu ... =10").
Zarzuty Evaluatora: brak. Obrona: brak.
BLOKADY: brak.
RUNDY: 1/5 (FC).
UWAGI-DLA-ORKIESTRATORA: (1) Scenariusz 4 army-concentration nie mierzy scalania wolnych jednostek (pokrywa to scenariusz 1) — nota Operatora potwierdzona, ODDAL. (2) Mutacja "garnizon wciągnięty do armii" w src (Operator, mut. B) nie powtarzana przeze mnie; uznana na podstawie raportu Operatora.
NASTĘPNY KROK: integracja orkiestratora (FF kandydata do main); temat tylko testowy, bez deployu.
DEPLOY/PUSH: NIE WYKONANO
