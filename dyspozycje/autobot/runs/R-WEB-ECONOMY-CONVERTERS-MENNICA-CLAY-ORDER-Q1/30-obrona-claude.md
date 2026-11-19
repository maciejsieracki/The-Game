STATUS: BLOCK (pomiar produkcji Cegły i Ceramiki z dispatchu NIE WYKONANY; reszta zarzutów obsłużona, patrz niżej)
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1
GOAL: Obrona rundy 2 (kandydat 7416a040c): odpowiedź na zarzuty Evaluatora 1-4 (f0be326dc).
ZMIANY-COMMIT: zmiana w tej rundzie: gra/tools/mennica-magazyn-test.cjs (+sekcja I: splitHandelLargestRemainder bezpośrednio, 11 asercji; export funkcji w bundle; poprawiony nieaktualny komentarz o czerwonej asercji Garncarni). Kod gry (gra/src) NIE zmieniany w tej rundzie. SHA: pole sha odpowiedzi.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (NIE ZMIERZONO). Evaluator ma rację: bieg 45 tur seed 4242 nie wykazał produkcji Cegły i Ceramiki > 0 (gracz bez Cegielni i Garncarni). Nie ponowiłem biegu przeglądarki. Ustalenie: w gra/src ani w gra/tools nie ma haka stawiającego budynki (grep `placeBuilding|addBuilding|debugBuild` w main.ts: brak; runner ai-economy-measure-run.cjs nie buduje). Dodanie haka = zmiana main.ts poza allowlistą (dozwolone tylko converterConsumedRatesForBuildings) i/lub runnera. Substytut w silniku (nie zastępuje kryterium biegu): advanceCityEconomy z glina 40 + Cegielnia + Garncarnia -> cegla 38 > 0, ceramika 11 > 0, glina 1 (asercje H/C2 w mennica-magazyn-test.cjs, zielone). Decyzja o haku/rozszerzeniu allowlisty = orkiestrator.
2. PRZYJMUJĘ (NIE POPRAWIONE). HUD adaptera main.ts (empireConverterInputRatesForOwner) różni się od silnika: pula = suma City.surowce (silnik: ownerResourceStockAll + wpływy tury), budynki z operationalBuiltIds (silnik: runtimeActiveBuiltIdsForCity z bramką Mennicy/złota), capacityOf = Infinity. Pełna zgodność wymaga wspólnej funkcji z turn-economy.ts, poza zakresem tej rundy. Test F/E sprawdza tylko czystą funkcję converters.ts; adapter w main.ts nie jest testowany w Node. Odnotowane jako znany rozjazd.
3. ODRZUCAM część „zmiana balansu poza Mennicą" z dowodem: dispatch (DODATEK, punkt 1) wprost zamawia podział metodą największych reszt z sumą części = pula i bez utraty małej puli; efekt +≤1 jednostkę na część przy dużej puli jest zamierzonym skutkiem tej reguły (przykład Evaluatora: pula 7 -> 4/2/1; test I potwierdza). Piny ekonomii (ekonomia-5x 280/0, grupa-b 49/0, hex 14/0, zloto 45/0, tarasy 18/0) zielone bez zmian. PRZYJMUJĘ brak testu bezpośredniego -> dodany (sekcja I). NIE ZMIERZONO: wpływ na tempo gospodarki/AI (nie robiłem pomiaru 150 tur).
4. PRZYJMUJĘ (NIE POPRAWIONE). gra/src/ui/cityPanel.ts (podgląd „Skarb +X" = floor(netto x %)) jest poza allowlistą tego tematu, więc nie ruszałem go (zmiana = FAIL wg granic). Rozszerzenie allowlisty o cityPanel.ts = decyzja orkiestratora.

TESTY (surowe liczby z tego uruchomienia, kandydat 7416a040c + zmiana testu):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- unit-replace-archer-slinger-test: 51 OK, 0 FAIL
- combat-test: All sanity checks passed.
- ekonomia-5x-inwariant-test: 280 passed, 0 failed
- grupa-b-lane-test: 49 pass, 0 fail
- hex-plony-magazyn-test: 14 passed, 0 failed
- zloto-test: 45 pass, 0 fail
- tarasy-cywilizacje-test: 18 passed, 0 failed
- mennica-magazyn-test: 56 passed, 0 failed (było 45 przed sekcją I)
- converters-shared-input-test: 24 passed, 0 failed
- resource-gross-net-converter-inputs-test: 18 ok, 0 FAIL
- MUTACJA (tymczasowa, cofnięta git checkout): cities.ts bez dodawania reszt (`+= 0`) -> mennica-magazyn 52 passed, 4 failed (suma części, 7->4/2/0, 2->Skarb 0, remis 50/50). Plik cities.ts przywrócony; git status czysty poza testem.
- Pomiar dymny 45 tur: NIE POWTÓRZONY w tej rundzie (patrz pkt 1); liczby z 10-operator-claude.md nie są przeze mnie zweryfikowane.

BLOKADY:
- (a) Kryterium biegu: produkcja Cegły i Ceramiki > 0 na seed 4242 NIE ZMIERZONA (brak haka stawiającego budynki). Dispatch: nie wykonany pomiar = FAIL rundy -> wymaga decyzji orkiestratora (hak w main.ts poza allowlistą lub zgoda na inny dowód).
- (b) Rozjazd HUD adaptera vs silnik (pkt 2) - wymaga wspólnej funkcji; poza zakresem.
- (c) cityPanel.ts poza allowlistą (pkt 4).
- (d) Wpływ balansu LRM na tempo gospodarki - NIE ZMIERZONO.
- Środowisko: gra/node_modules to dowiązanie symboliczne do worktree wf_67a822a6-aa1-3 (nieśledzone, nie usuwane; usuwanie = zakazane rm/unlink; do posprzątania przez orkiestratora).

RUNDY: 3/5 wg numeracji dispatchu (obrona rundy 2)
NASTĘPNY KROK: orkiestrator: (1) decyzja o haku budynków dla pomiaru Cegielni+Garncarni albo akceptacja substytutu silnikowego; (2) decyzja o rozszerzeniu allowlisty o cityPanel.ts i/lub wspólną funkcję HUD=silnik; potem ponowny Evaluator.
UWAGI-DLA-ORKIESTRATORA: stary raport 30-obrona-claude.md (runda 1) został nadpisany tym plikiem; historia w git.
DEPLOY/PUSH: NIE WYKONANO
