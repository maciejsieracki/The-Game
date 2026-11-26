# R-WEB-MINT-ORPHAN-Q1 — Final Control
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-ORPHAN-Q1
GOAL: osierocona Mennica nieaktywna i nie znika; po ukończeniu nowej w stolicy stare znikają; powrót stolicy reaktywuje; Mennica tylko w stolicy.
ZMIANY/COMMIT: kandydat 5c8f7b331afa7237323712b9acc3d3f410ce39ec; merge-base --is-ancestor cb18bff7c5 -> TAK; diff --stat: 5 plików (+415): gra/src/game/mennica-orphan.ts (nowy), gra/src/main.ts (+17, hook), gra/tools/mint-orphan-test.cjs (nowy), runs/.../10-operator, 30-obrona. Wszystko w allowliście, brak zmian balansu / gra-robocza / WERSJE.
TESTY (własne, surowe wyjścia): tsc exit 0; mint-orphan 28 PASS/0 FAIL; własna mutacja guardu stolicy w helperze -> 26 PASS/2 FAIL (wykryta), po przywróceniu 28/0; mint-capital-only 8/0; waluta-mennica 61/0; trade-routes-income 135/0; war-rules-multiwar-main-guard 21/0; logic 213/213; ai-test 297/0; combat 6/6. NIE ZMIERZONO: przeglądarka (gra), tech-tree, research, unit-replace.
OCENA ZARZUTÓW:
1. Brak akcji wyburzenia: w grze nie istnieje mechanika wyburzania budynków (grep: tylko mury w city-defense/battleScene); buildings.json nie ma flagi zakazu. Zadanie 2 dispatchu ("sprawdź i opisz") spełnione opisem. Dostarczenie wyburzenia to nowa funkcja UI (zwrot, przycisk, potwierdzenie) = decyzja o grze, nie blokuje tej rundy; kryterium (2) właściciela pozostaje NIESPEŁNIONE w grze -> osobny temat + ABC. demolishBuildingIds jest martwym kodem do czasu tego tematu.
2. Hook niewykonywany przez test: naprawione — test woła realny helper applyMennicaCompletedInCapital; main.ts tylko go wywołuje (regex okablowania). Ryzyko resztkowe niskie.
3. Scenariusz na realnym ownersWithMennica: częściowo; akceptowalne.
4. Komunikat: hint + console.log, brak wpisu "Ważne" — drobna rozbieżność z dodatkiem; notatka.
BLOKADY: brak.
RUNDY: 3/5 (FC).
NASTĘPNY KROK: integracja orkiestratora; osobny temat wyburzania budynków (Mennica) z pytaniem ABC; opcjonalnie wpis "Ważne".
UWAGI-DLA-ORKIESTRATORA: kryterium (2) wymaga nowej mechaniki wyburzenia; weryfikacja w przeglądarce niewykonana.
DEPLOY/PUSH: NIE WYKONANO
