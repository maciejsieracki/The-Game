STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1
GOAL: rebalans ekonomii wg epok ZA FLAGA (OFF domyslnie): ulepszenia stale jak epoka 1, zywnosc wojska x3/epoke, racje obywateli x2/epoke
ZMIANY/COMMIT: kandydat b740a8845a50b8070de4de1514d2339992a4b8e7; merge-base --is-ancestor d425dd0a3 b740a8845 = OK; 15 plikow, +443/-12. Poza allowlista (jawnie, konieczne dla zakazu dispatchu): converters.ts, citizen-resource-upkeep.ts (podmiana na legacyCitizenConsumptionEraMultiplier, by flaga nie ruszala konwerterow ani utrzymania surowcowego), citizen-consumption-era-mult-test.cjs (1 linia). Akceptuje.
TESTY (wlasne, surowe wyjscie, na b740a8845): tsc exit 0; econ-era-rebalance 37 ok/0 FAIL; citizen-consumption-era-mult PASS; foundry-throughput 159/0; citizen-upkeep-era-mult 681/0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; hud-shortage 17/0; gross-net 18/0; hud-resource-card-state 7/0; population-growth-v85 50/0; ai-economy-measure-hook 23/23. Czerwone przedistniejace, potwierdzone na bazie d425dd0a3 identycznie: citizen-resource-upkeep 122/2, unit-epoch-cost 56/1.
OCENA ZARZUTOW: (1) konwertery - naprawione (legacy, ON==OFF): ZAMKNIETE. (2) utrzymanie surowcowe - naprawione na legacy; zalozenie: skaluja sie tylko racje zywnosci: ZAMKNIETE. (3) brak testow - dodane E7-E10, mutanty M8-M10 czerwone: ZAMKNIETE. (4) epoki 4-5 - eraOrdinal zwija nazwy tekstowe do max 3; wg obrony units.json ma tylko epoki 1-3 (nie weryfikowano niezaleznie); wartosci liczbowe epok daja 2^(e-1) / 3^(e-1): NOTA. (5) karty jednostek - unitFoodCardValue podpiete w unitInfoCard i unitAdapter: ZAMKNIETE.
BLOKADY: brak
UWAGI-DLA-ORKIESTRATORA: (a) NIE_ZMIERZONO bieg 30/150 tur OFF/ON; wynik t30 z rundy 2 nieaktualny dla ON; orkiestrator powtarza 150 tur z --rebalance 0|1 (ai-economy-measure-run.cjs). (b) Zalozenia do potwierdzenia przez wlasciciela: konwertery, utrzymanie Pracy i surowcowe obywateli bez zmian; epoki 4-5 wzorem. (c) Flaga OFF: istniejace testy zielone, sciezka OFF bez zmian.
RUNDY: FC 1/1
NASTEPNY KROK: integracja orkiestratora (b740a8845 do main), bramki, bieg 150 tur OFF vs ON; flaga zostaje OFF
DEPLOY/PUSH: NIE WYKONANO
