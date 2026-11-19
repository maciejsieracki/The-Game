STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-ERA-SCALE-Q1
GOAL: utrzymanie jednostek (pieniadz, surowce, zywnosc) x1/x2/x4 wg epoki jednostki za flaga eraRebalansAktywny; karta zywnosci = silnik.
ZMIANY/COMMIT: kandydat 665626e56; `git merge-base --is-ancestor 1bc8ec66 665626e56` = OK. `git diff --stat` 1bc8ec66..665626e56: 7 plikow (economy-upkeep.ts, econ-era-rebalance.ts, econ-era-rebalance-params.json, econ-era-rebalance-test.cjs, unit-upkeep-era-scale-test.cjs, 10-operator, 30-obrona), +255/-27; wszystko w allowliscie (brak gra-robocza/kanon/WERSJE/rust-port/hud). Czytane z diffu: jeden helper unitUpkeepScaleByEpoch (epoka JEDNOSTKI, jak dotad), uzyty w unitResourceUpkeep, buildUnitUpkeepTable, buildUnitFoodTable, unitFoodCardValue; rebalancedUnitFoodBase deleguje do helpera (redundancja nieszkodliwa).
TESTY (wlasne, na 665626e56, surowe wyjscie): tsc --noEmit exit 0; logic-test 213/213; tech-tree 20 pass/0 fail; research ALL GREEN; unit-replace 21/21; ai-unit-replace-same-rules 45/0; combat-test exit 0 (All sanity checks passed); econ-era-rebalance-test 38 ok/0 FAIL; unit-upkeep-era-scale-test 16 ok/0 FAIL (3 mutanty czerwone); unit-epoch-cost 57/0; unit-resource-upkeep 7/0; upkeep-test 91/0; glod-wojska-karencja 40/0; citizen-consumption-era-mult PASS; ai-recruit-upkeep-gate 23/0; ai-upkeep-runway 17/0; ai-upkeep-wiring 4/0; hud-net-building-drain 36/0; resource-gross-net-converter-inputs 18/0; garrison-upkeep-tooltip 28/0; upkeep-difficulty-per-owner 19/0; recruitment-no-upkeep-gate 37/0.
OCENA ZARZUTOW EVALUATORA:
1. Falszywa przeslanka dispatchu (pieniadz/surowce juz x1/2/4) - ODDAL jako uwage. Realna zmiana to wylacznie zywnosc jednostek przy fladze ON: 4/12/36 -> 4/8/16, epoki 4-5: 108/324 -> 16/16 (zgodne z decyzja wlasciciela "zywnosc x1/x2/x4"). Wymaga swiadomej akceptacji, nie jest bledem kodu.
2. Usuniety mutant M6 - ODDAL; zastapiony wykrywalnym M3 (zywnosc x3), pokrycie wystarczajace.
3. Komentarze "x3/epoke" - ODDAL; wg diffu poprawione w economy-upkeep.ts.
4. Pomiar dymny 60 tur / netto skarbca - NIE ZMIERZONO; ODDAL (nie blokuje korekty kodu, ale rozpad armii AI nieznany; zalecany jako osobny pomiar po integracji).
5. HUD wizualnie - NIE ZMIERZONO; ODDAL. Zmiana zachowania przy fladze OFF: karta zywnosci pokazuje teraz wartosc silnika (4/8/16 zamiast surowej), pinowane przez test - do swiadomej akceptacji.
BLOKADY: brak blokad kodu. Otwarte: pomiar dymny (NIE ZMIERZONO), weryfikacja wizualna (NIE ZMIERZONO), treasury-unit-cost-model.cjs nieaktualny (poza allowlista). gra/node_modules w worktree to dowiazanie (ignorowane przez git).
RUNDY: FC runda 1 / limit 5 (Operator+Obrona: runda 2/5).
UWAGI-DLA-ORKIESTRATORA: (a) zywnosc jednostek w epokach 4-5 spada z 108/324 do 16 - zalecane potwierdzenie z wlascicielem i pomiar AI po integracji; (b) zaktualizowac treasury-unit-cost-model.cjs osobnym tematem; (c) przy integracji sprawdzic merge-base 665626e56.
NASTEPNY KROK: integracja orkiestratora (merge 665626e56 do main, bramki), potem pomiar dymny jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
