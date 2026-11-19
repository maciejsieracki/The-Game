STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-IMPL-Q1
GOAL: AI: fort od 40 nowych heksow, posterunek od 16, po wyczerpaniu limitu miast, do 15% puli Pracy w oknie t30-t90, przy zagrozeniu wojsko pierwsze; gracz bez zmian.
ZMIANY/COMMIT: kandydat 4b57117ee2da845daacfbad1aba4e35ec9d6cea4; `git merge-base --is-ancestor 72a95414a 4b57117ee` = TAK. diff --stat: 6 plikow (+449/-2): ai.ts, auto-improvements.ts, data/ai-territory-race-params.json, ai-territory-race-test.cjs, 10-operator, 30-obrona. Wszystko w allowliscie; brak zmian gra-robocza/kanon/WERSJE/rust-port. Sciezka gracza: `aiTerritoryRace`/`territoryRace` ustawiane tylko w ai.ts; bez nich prog 1 i brak udzialu (diff + test F/H7).
TESTY (wlasne, surowe wyjscie): tsc --noEmit exit 0; ai-territory-race-test 29 OK / 0 FAIL; mutacja kopii (wylaczony prog gain<minNowe) -> 27 OK / 2 FAIL (czerwone); logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-unit-replace-same-rules 45/0; ai-economy-measure-hook 23/23; ai-improvements 56/0; fort-strazniaca 85/0; fort-outpost-placement-rules 40/0; ai2-heks-po-heksie 39/0; auto-improvements 46/0; auto-fort-claim 61 OK / 2 FAIL — IDENTYCZNIE na bazie 72a95414a (dwie asercje drog), nie z tematu. Bieg dymny runtime NIE ZMIERZONO (CPU load ~14).
OCENA ZARZUTOW: 1 (druga sciezka planExpansionFortBuilding) — naprawione w 4b57117ee, testy H, mutacja czerwona: ODDAL. 2 (zagrozenie tylko w oknie) — zgodne z dispatch (d): UWAGA-ABC. 3 — domkniete testami H8/H9 na progach produkcyjnych: ODDAL. 4 — brak E2E planCityImprovements->picker; ryzyko niskie (jeden przekazywany parametr): UWAGA. 5 — 15% liczone per wywolanie od puli na wejsciu; fort 100 Pracy przy puli < ~667 w oknie zablokowany: interpretacja do potwierdzenia, nie bug: UWAGA-ABC. 6 — wplyw w runtime niezmierzony: UWAGA.
BLOKADY: brak.
RUNDY: FC 1/5.
UWAGI-DLA-ORKIESTRATORA: (a) bieg PRZED/PO 150 tur na 2 ziarnach po integracji; (b) ABC: zagrozenie poza oknem [30,90]; (c) ABC: 15% per tura vs w oknie; (d) auto-fort-claim 2 FAIL = dlug testowy bazy.
NASTEPNY KROK: integracja orkiestratora (FF 4b57117ee), potem pomiar runtime.
DEPLOY/PUSH: NIE WYKONANO
